import polars as pl

from conftest import AS_OF, bronze_frame, make
from permits_pipeline import gold, quality
from permits_pipeline.transform import silver_plan, split_quarantine


def build(records):
    good, bad = split_quarantine(silver_plan(bronze_frame(records), AS_OF).collect())
    return good, bad


def test_quality_gate_passes_on_real_sample(sample_records):
    good, bad = build(sample_records)
    checks = quality.run_checks(good, bad.height, len(sample_records), AS_OF)
    failed = [c.name for c in checks if c.severity == "error" and not c.passed]
    assert failed == []


def test_quality_gate_fails_when_rows_go_missing(sample_records):
    good, bad = build(sample_records)
    checks = {c.name: c for c in quality.run_checks(good.head(10), bad.height, len(sample_records), AS_OF)}
    assert not checks["bronze_rows_reconcile"].passed


def test_contract_drift_is_detected(sample_records):
    good, _ = build(sample_records)
    assert not quality.validate_contract(good.drop("zip")).passed
    assert not quality.validate_contract(good.with_columns(pl.col("applied_year").cast(pl.Int64))).passed


def test_gold_reconciles(tmp_path, sample_records):
    good, _ = build(sample_records)
    good.write_parquet(tmp_path / "silver.parquet")
    result = gold.build_gold(tmp_path / "silver.parquet", tmp_path / "gold")
    assert result["reconciliation"]["ok"]


def test_cycle_time_percentiles():
    recs = [make(permitnum=f"71{i:05d}-CN", issueddate=f"2024-0{1 + (i % 2) + 1}-10T00:00:00.000")
            for i in range(30)]
    good, _ = build(recs)
    ct = gold.cycle_times(good.lazy()).collect()
    assert ct["issued_permits"][0] == 30
    assert ct["p50_days_to_issue"][0] in (31.0, 45.5, 60.0)


def test_housing_net_units():
    good, _ = build([make(permitnum="7200001-CN", housingunitsadded="10", housingunitsremoved="2")])
    hp = gold.housing_production(good.lazy()).collect()
    assert hp["net_units"][0] == 8 and hp["zip"][0] == "98122"
