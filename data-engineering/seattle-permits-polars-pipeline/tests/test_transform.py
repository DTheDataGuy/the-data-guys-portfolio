import polars as pl

from conftest import AS_OF, bronze_frame, make
from permits_pipeline.contracts import SILVER_SCHEMA
from permits_pipeline.transform import silver_plan, split_quarantine


def silver(*records):
    good, bad = split_quarantine(silver_plan(bronze_frame(list(records)), AS_OF).collect())
    return good, bad


def test_types_and_derived_fields():
    good, bad = silver(make())
    row = good.row(0, named=True)
    assert bad.height == 0
    assert dict(good.schema) == SILVER_SCHEMA
    assert row["days_to_issue"] == 51 and row["days_to_complete"] == 337
    assert row["zip"] == "98122" and row["city"] == "SEATTLE"
    assert row["permit_suffix"] == "CN" and row["applied_year"] == 2024
    assert str(row["applied_month"]) == "2024-01-01"


def test_sentinel_dates_are_nulled_and_flagged():
    good, _ = silver(make(applieddate="1900-01-01T00:00:00.000"))
    row = good.row(0, named=True)
    assert row["applied_date"] is None and row["flag_sentinel_date"] is True
    assert row["days_to_issue"] is None


def test_future_dates_are_nulled():
    good, _ = silver(make(completeddate="2031-01-01T00:00:00.000"))
    assert good["completed_date"][0] is None


def test_bad_zip_and_geo_are_flagged_not_dropped():
    good, _ = silver(make(originalzip="70", latitude="40.71", longitude="-74.00"))
    row = good.row(0, named=True)
    assert row["zip"] is None and row["flag_bad_zip"]
    assert row["latitude"] is None and row["flag_bad_geo"]


def test_na_category_becomes_unclassified():
    good, _ = silver(make(permitclass="N/A", permitclassmapped="N/A"))
    assert good["permit_class_mapped"][0] == "Unclassified"


def test_duplicates_keep_most_advanced_record():
    early = make(statuscurrent="Issued", completeddate=None)
    late = make(statuscurrent="Completed")
    good, _ = silver(early, late)
    assert good.height == 1 and good["status"][0] == "Completed"


def test_hard_rules_quarantine_with_reasons():
    good, bad = silver(
        make(permitnum="7000002-CN", issueddate="2023-12-01T00:00:00.000"),          # issued before applied
        make(permitnum="7000003-CN", estprojectcost="-50"),                              # negative cost
        make(permitnum="bad-number"),                                                   # malformed key
        make(permitnum="7000004-CN"),
    )
    assert good["permit_num"].to_list() == ["7000004-CN"]
    reasons = dict(zip(bad["permit_num"], bad["_violations"].list.join(";")))
    assert reasons["7000002-CN"] == "issued_before_applied"
    assert reasons["7000003-CN"] == "negative_cost"
    assert reasons["BAD-NUMBER"] == "permit_num_missing_or_malformed"


def test_cost_outlier_flagged_and_kept():
    good, _ = silver(make(estprojectcost="25000000000"))
    assert good["flag_cost_outlier"][0] is True and good["est_project_cost"][0] == 2.5e10


def test_real_sample_has_no_contract_drift(sample_records):
    good, bad = silver(*sample_records)
    assert dict(good.schema) == SILVER_SCHEMA
    assert good.height + bad.height == len(sample_records)
    assert good["permit_num"].is_unique().all()
