"""Unit tests for the PySpark transformations on small, hand-checked DataFrames."""
import datetime as dt
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("PYSPARK_PYTHON", sys.executable)

from permits_spark import jobs  # noqa: E402
from permits_spark.session import build_session  # noqa: E402

D = dt.date


@pytest.fixture(scope="session")
def spark():
    s = build_session("tests", "local[1]")
    yield s
    s.stop()


def permits(spark, rows):
    cols = ["permit_num", "permit_type", "permit_type_desc", "permit_class_mapped", "status", "applied_date",
            "issued_date", "applied_month", "applied_year", "days_to_issue", "review_cycles",
            "housing_units_added", "housing_units_removed", "zip", "address"]
    schema = ("permit_num string, permit_type string, permit_type_desc string, permit_class_mapped string, "
              "status string, applied_date date, issued_date date, applied_month date, applied_year int, "
              "days_to_issue long, review_cycles long, housing_units_added long, housing_units_removed long, "
              "zip string, address string")
    return spark.createDataFrame([dict(zip(cols, r)) for r in rows], schema=schema)


def row(i, days, year=2024, zip_="98122", added=0, removed=0, address="1 MAIN ST", applied=None):
    applied = applied or D(year, 1, 1)
    return (f"P{i}", "Building", "New", "Residential", "Completed", applied, applied + dt.timedelta(days=days),
            applied.replace(day=1), year, days, 2, added, removed, zip_, address)


def test_contract_rejects_missing_columns(spark):
    with pytest.raises(ValueError, match="missing columns"):
        jobs.assert_contract(spark.createDataFrame([("x",)], "permit_num string"))


def test_cycle_time_exact_percentiles(spark):
    df = permits(spark, [row(i, d) for i, d in enumerate(range(1, 21))])  # 1..20 days
    out = jobs.cycle_times(df).collect()[0]
    assert out.issued_permits == 20
    assert out.p50_days_to_issue == pytest.approx(10.5)
    assert out.p90_days_to_issue == pytest.approx(18.1)


def test_cycle_time_min_group_size(spark):
    df = permits(spark, [row(i, 5) for i in range(5)])
    assert jobs.cycle_times(df, min_n=20).count() == 0


def test_housing_cumulative_window(spark):
    rows = [row(1, 10, 2022, added=10), row(2, 10, 2023, added=5, removed=2), row(3, 10, 2024, removed=4)]
    out = {r.issued_year: r for r in jobs.housing_production(permits(spark, rows)).collect()}
    assert [out[y].net_units for y in (2022, 2023, 2024)] == [10, 3, -4]
    assert [out[y].cumulative_net_units for y in (2022, 2023, 2024)] == [10, 13, 9]


def test_rolling_window_is_twelve_months(spark):
    rows = [row(m, 5, applied=D(2023 + (m - 1) // 12, (m - 1) % 12 + 1, 1)) for m in range(1, 15)]
    out = {r.applied_month: r.applications_trailing_12m for r in jobs.rolling_applications(permits(spark, rows)).collect()}
    assert out[D(2023, 12, 1)] == 12
    assert out[D(2024, 2, 1)] == 12  # Jan 2023 and Feb 2023 have rolled off


def test_repeat_site_activity_uses_lag(spark):
    rows = [row(1, 5, applied=D(2024, 1, 1)), row(2, 5, applied=D(2024, 6, 1)), row(3, 5, applied=D(2026, 1, 1))]
    life = spark.createDataFrame([("Completed", "completed")], "status string, lifecycle_stage string")
    out = jobs.repeat_site_activity(permits(spark, rows), life).collect()[0]
    assert out.permits == 3 and out.repeat_within_365d == 1
