"""Cross-engine parity: the same metrics computed four independent ways must agree exactly.

Engines compared
  polars  : ../seattle-permits-polars-pipeline/data/gold/*.parquet
  duckdb  : ../seattle-permits-dbt-duckdb/target/permits.duckdb (dbt marts)
  pyspark : output/pyspark/*
  scala   : output/scala/*   (typed Dataset + hand-written percentile)

Writes reports/parity_report.md and reports/parity_report.json; exits non-zero on any mismatch.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import duckdb
import polars as pl

HERE = Path(__file__).resolve().parents[1]
POLARS_GOLD = HERE.parent / "seattle-permits-polars-pipeline" / "data" / "gold"
DUCKDB_FILE = HERE.parent / "seattle-permits-dbt-duckdb" / "target" / "permits.duckdb"
OUT = HERE / "output"
TOL = 1e-9

CT_KEYS = ["permit_type", "permit_type_desc", "applied_year"]
CT_VALS = ["issued_permits", "p50_days_to_issue", "p90_days_to_issue", "avg_review_cycles"]
HP_KEYS = ["zip", "issued_year"]
HP_VALS = ["housing_permits", "units_added", "units_removed", "net_units"]


def _norm(df: pl.DataFrame, keys: list[str], vals: list[str]) -> pl.DataFrame:
    df = df.select(keys + vals)
    casts = {k: (pl.Int64 if k.endswith("year") else pl.Utf8) for k in keys}
    casts.update({v: pl.Float64 for v in vals})
    df = df.with_columns([pl.col(c).cast(t) for c, t in casts.items()])
    if "permit_type_desc" in df.columns:
        df = df.with_columns(pl.col("permit_type_desc").fill_null("Unspecified"))
    return df.sort(keys)


def spark_parquet(path: Path) -> pl.DataFrame:
    # Spark writes hive-partitioned directories; DuckDB reads them (and the partition column) directly.
    return duckdb.sql(f"select * from read_parquet('{path}/**/*.parquet', hive_partitioning=true)").pl()


def load() -> dict[str, dict[str, pl.DataFrame]]:
    con = duckdb.connect(str(DUCKDB_FILE), read_only=True)
    dbt_ct = con.sql("select permit_type, permit_work_class as permit_type_desc, applied_year, issued_permits, "
                     "p50_days_to_issue, p90_days_to_issue, avg_review_cycles "
                     "from analytics.mart_cycle_time_trends").pl()
    dbt_hp = con.sql("select * from analytics.mart_housing_production").pl()
    return {
        "cycle_times": {
            "polars": _norm(pl.read_parquet(POLARS_GOLD / "cycle_times.parquet"), CT_KEYS, CT_VALS),
            "duckdb": _norm(dbt_ct, CT_KEYS, CT_VALS),
            "pyspark": _norm(spark_parquet(OUT / "pyspark" / "cycle_times"), CT_KEYS, CT_VALS),
            "scala": _norm(spark_parquet(OUT / "scala" / "cycle_times"), CT_KEYS, CT_VALS),
        },
        "housing_production": {
            "polars": _norm(pl.read_parquet(POLARS_GOLD / "housing_production.parquet"), HP_KEYS, HP_VALS),
            "duckdb": _norm(dbt_hp, HP_KEYS, HP_VALS),
            "pyspark": _norm(spark_parquet(OUT / "pyspark" / "housing_production"), HP_KEYS, HP_VALS),
            "scala": _norm(spark_parquet(OUT / "scala" / "housing_production"), HP_KEYS, HP_VALS),
        },
    }


def compare(base: pl.DataFrame, other: pl.DataFrame, keys: list[str], vals: list[str]) -> dict:
    j = base.join(other, on=keys, how="full", suffix="_o", coalesce=True, nulls_equal=True)
    only_base = j.filter(pl.col(vals[0] + "_o").is_null() & pl.col(vals[0]).is_not_null()).height
    only_other = j.filter(pl.col(vals[0]).is_null() & pl.col(vals[0] + "_o").is_not_null()).height
    worst = 0.0
    mismatched = 0
    for v in vals:
        diff = (pl.col(v) - pl.col(v + "_o")).abs()
        both_null = pl.col(v).is_null() & pl.col(v + "_o").is_null()
        bad = j.filter(~both_null & (diff.fill_null(float("inf")) > TOL))
        mismatched += bad.height
        if j.height:
            worst = max(worst, float(j.select(diff.max()).item() or 0.0))
    return {"rows_base": base.height, "rows_other": other.height, "only_in_base": only_base,
            "only_in_other": only_other, "mismatched_values": mismatched, "max_abs_diff": worst,
            "match": only_base == 0 and only_other == 0 and mismatched == 0}


def main() -> int:
    data = load()
    spec = {"cycle_times": (CT_KEYS, CT_VALS), "housing_production": (HP_KEYS, HP_VALS)}
    results: dict = {}
    for metric, engines in data.items():
        keys, vals = spec[metric]
        base = engines["polars"]
        results[metric] = {name: compare(base, df, keys, vals) for name, df in engines.items() if name != "polars"}
    ok = all(r["match"] for m in results.values() for r in m.values())

    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    (reports / "parity_report.json").write_text(json.dumps({"passed": ok, "tolerance": TOL, "results": results},
                                                           indent=2))
    lines = ["# Cross-engine parity report", "",
             f"Baseline: **Polars gold**. Tolerance: {TOL:g}. Result: **{'PASS' if ok else 'FAIL'}**", "",
             "| Metric | Engine | Rows (Polars / engine) | Missing either side | Mismatched values | Max abs diff | Match |",
             "|---|---|---|---|---|---|---|"]
    for metric, engines in results.items():
        for name, r in engines.items():
            lines.append(f"| `{metric}` | {name} | {r['rows_base']:,} / {r['rows_other']:,} | "
                         f"{r['only_in_base'] + r['only_in_other']} | {r['mismatched_values']} | "
                         f"{r['max_abs_diff']:.2e} | {'yes' if r['match'] else 'NO'} |")
    (reports / "parity_report.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
