"""Data-quality gate. Each check has a severity; any failed ``error`` check stops the run before gold.

The report is written as JSON (for machines) and Markdown (for people) on every run.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path

import polars as pl

from .config import SEATTLE_BBOX
from .contracts import REQUIRED, SILVER_SCHEMA


@dataclass
class Check:
    name: str
    severity: str          # "error" | "warn"
    passed: bool
    observed: str
    expectation: str


def _pct(n: int, d: int) -> float:
    return round(100.0 * n / d, 2) if d else 0.0


def validate_contract(df: pl.DataFrame) -> Check:
    actual = dict(df.schema)
    drift = {c: (str(SILVER_SCHEMA.get(c)), str(actual.get(c)))
             for c in set(actual) | set(SILVER_SCHEMA) if SILVER_SCHEMA.get(c) != actual.get(c)}
    return Check("contract_schema_matches", "error", not drift,
                 "no drift" if not drift else json.dumps(drift), "columns and dtypes equal SILVER_CONTRACT")


def run_checks(silver: pl.DataFrame, quarantine_rows: int, bronze_rows: int, as_of: date | None = None
               ) -> list[Check]:
    as_of = as_of or date.today()
    n = silver.height
    checks = [validate_contract(silver)]

    dup = n - silver["permit_num"].n_unique()
    checks.append(Check("permit_num_unique", "error", dup == 0, f"{dup} duplicates", "0 duplicates"))

    nulls = {c: silver[c].null_count() for c in REQUIRED}
    bad = {c: v for c, v in nulls.items() if v}
    checks.append(Check("required_not_null", "error", not bad, json.dumps(bad) if bad else "0 nulls",
                        f"no nulls in {len(REQUIRED)} required columns"))

    accounted = n + quarantine_rows
    checks.append(Check("bronze_rows_reconcile", "error", accounted == bronze_rows,
                        f"{n:,} silver + {quarantine_rows:,} quarantined = {accounted:,} vs {bronze_rows:,} bronze",
                        "every bronze row is in silver or quarantine"))

    checks.append(Check("quarantine_rate", "error", _pct(quarantine_rows, bronze_rows) < 1.0,
                        f"{_pct(quarantine_rows, bronze_rows)}%", "< 1% of bronze rows quarantined"))

    allowed = {"Residential", "Non-Residential", "Unclassified"}
    seen = set(silver["permit_class_mapped"].unique().to_list())
    checks.append(Check("permit_class_mapped_accepted_values", "error", seen <= allowed,
                        ", ".join(sorted(seen)), "subset of " + ", ".join(sorted(allowed))))

    neg = silver.filter((pl.col("days_to_issue") < 0) | (pl.col("days_to_complete") < 0)).height
    checks.append(Check("lifecycle_dates_ordered", "error", neg == 0, f"{neg} rows out of order",
                        "applied <= issued <= completed"))

    geo = silver.filter(pl.col("latitude").is_not_null() & ~(
        pl.col("latitude").is_between(SEATTLE_BBOX["lat_min"], SEATTLE_BBOX["lat_max"])
        & pl.col("longitude").is_between(SEATTLE_BBOX["lon_min"], SEATTLE_BBOX["lon_max"]))).height
    checks.append(Check("coordinates_inside_seattle", "error", geo == 0, f"{geo} outside", "0 outside bbox"))

    newest = silver["applied_date"].max()
    lag = (as_of - newest).days if newest else None
    checks.append(Check("source_freshness", "warn", lag is not None and lag <= 30,
                        f"newest application {newest} ({lag} days old)", "<= 30 days old"))

    for col, limit in (("applied_date", 30.0), ("zip", 10.0), ("latitude", 5.0)):
        p = _pct(silver[col].null_count(), n)
        checks.append(Check(f"{col}_completeness", "warn", p <= limit, f"{p}% null", f"<= {limit}% null"))

    # Coverage drift: the city stopped populating contractor names for most permits after 2020.
    # Tracked as a warning so analyses that depend on the field know which years are usable.
    cov = (silver.filter(pl.col("applied_year").is_in([2019, 2023]))
                 .group_by("applied_year").agg(pl.col("contractor").is_not_null().mean().alias("c"))
                 .sort("applied_year"))
    if cov.height == 2:
        before, after = (round(100 * x, 1) for x in cov["c"].to_list())
        checks.append(Check("contractor_coverage_stable", "warn", after >= 0.5 * before,
                            f"{before}% of 2019 permits name a contractor vs {after}% in 2023",
                            "coverage within 50% of the 2019 level"))

    for flag in ("flag_sentinel_date", "flag_cost_outlier", "flag_bad_geo", "flag_bad_zip"):
        k = int(silver[flag].sum())
        checks.append(Check(flag, "warn", True, f"{k:,} rows flagged ({_pct(k, n)}%)", "tracked, not dropped"))
    return checks


def write_report(checks: list[Check], out_dir: Path, run: dict) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    errors = [c for c in checks if c.severity == "error" and not c.passed]
    report = {"run": run, "passed": not errors, "checks": [asdict(c) for c in checks]}
    (out_dir / "quality_report.json").write_text(json.dumps(report, indent=2, default=str))
    lines = ["# Data-quality report", "",
             f"Extract `{run.get('extract_id')}` · {run.get('bronze_rows', 0):,} bronze rows · "
             f"result: **{'PASS' if not errors else 'FAIL'}**", "",
             "| Check | Severity | Result | Observed | Expectation |", "|---|---|---|---|---|"]
    for c in checks:
        lines.append(f"| `{c.name}` | {c.severity} | {'pass' if c.passed else 'FAIL'} | {c.observed} | {c.expectation} |")
    (out_dir / "quality_report.md").write_text("\n".join(lines) + "\n")
    return report
