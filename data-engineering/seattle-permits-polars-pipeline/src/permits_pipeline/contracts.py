"""Silver data contract: the typed shape every downstream consumer (dbt, Spark, dashboards) can rely on.

A contract is code, not a wiki page: ``transform.to_silver`` produces exactly these columns and dtypes,
and ``quality.validate_contract`` fails the run if it ever drifts.
"""
from __future__ import annotations

from dataclasses import dataclass

import polars as pl

PERMITNUM_RE = r"^\d{6,7}-[A-Z]{2}(-\d{3})?$"
ZIP_RE = r"^98\d{3}$"
SENTINEL_DATE_FLOOR = "1990-01-01"   # source uses 1900-01-01 as "unknown"
COST_OUTLIER_USD = 2_000_000_000     # the largest real Seattle project is well below this


@dataclass(frozen=True)
class Field:
    name: str
    dtype: pl.DataType
    required: bool = False
    description: str = ""


SILVER_CONTRACT: tuple[Field, ...] = (
    Field("permit_num", pl.Utf8, True, "Unique permit number, e.g. 6123456-CN"),
    Field("permit_suffix", pl.Utf8, True, "Permit family code from the number: CN, DM, EX, BK, RR, GR ..."),
    Field("is_sub_permit", pl.Boolean, True, "True for -001 style child records"),
    Field("permit_class", pl.Utf8, True, "Single Family/Duplex, Commercial, Multifamily ..."),
    Field("permit_class_mapped", pl.Utf8, True, "Residential / Non-Residential / N/A"),
    Field("permit_type", pl.Utf8, True, "Building, Demolition, Grading, Roof, ECA/Shoreline"),
    Field("permit_type_desc", pl.Utf8, False, "New, Addition/Alteration, Deconstruction ..."),
    Field("status", pl.Utf8, True, "Current status in the city system"),
    Field("description", pl.Utf8, False, "Free-text scope of work"),
    Field("housing_category", pl.Utf8, False, "Middle Housing, Large Multifamily ..."),
    Field("dwelling_unit_type", pl.Utf8, False, "Townhouse, ADU, Rowhouse ..."),
    Field("housing_units_net", pl.Int64, False, "Net change in housing units (negative = units removed)"),
    Field("housing_units_added", pl.Int64, False, "Units added"),
    Field("housing_units_removed", pl.Int64, False, "Units removed"),
    Field("est_project_cost", pl.Float64, False, "Declared project value in USD (outliers flagged, not dropped)"),
    Field("applied_date", pl.Date, False, "Application date"),
    Field("issued_date", pl.Date, False, "Issue date"),
    Field("expires_date", pl.Date, False, "Expiry date"),
    Field("completed_date", pl.Date, False, "Completion / final inspection date"),
    Field("days_to_issue", pl.Int64, False, "issued_date - applied_date"),
    Field("days_to_complete", pl.Int64, False, "completed_date - issued_date"),
    Field("plan_review_days", pl.Int64, False, "Total plan review days reported by the city"),
    Field("review_cycles", pl.Int64, False, "Number of plan review cycles"),
    Field("applied_month", pl.Date, False, "First day of the application month"),
    Field("applied_year", pl.Int32, False, "Application year"),
    Field("address", pl.Utf8, False, "Normalized street address"),
    Field("city", pl.Utf8, False, "Upper-cased city"),
    Field("zip", pl.Utf8, False, "Five-digit Seattle ZIP (98xxx) or null"),
    Field("latitude", pl.Float64, False, "WGS84 latitude, null when outside Seattle"),
    Field("longitude", pl.Float64, False, "WGS84 longitude, null when outside Seattle"),
    Field("contractor", pl.Utf8, False, "Contractor company name (upper-cased, trimmed)"),
    Field("zoning", pl.Utf8, False, "Zoning designation"),
    Field("parent_permit_num", pl.Utf8, False, "Parent permit for dependent records"),
    Field("related_mup", pl.Utf8, False, "Related master use permit"),
    Field("is_dependent_building", pl.Boolean, True, "Dependent building flag"),
    Field("flag_sentinel_date", pl.Boolean, True, "A 1900-era placeholder date was nulled"),
    Field("flag_cost_outlier", pl.Boolean, True, "Declared cost above the outlier threshold"),
    Field("flag_bad_geo", pl.Boolean, True, "Coordinates missing or outside Seattle"),
    Field("flag_bad_zip", pl.Boolean, True, "ZIP missing or not a 98xxx code"),
    Field("source_url", pl.Utf8, False, "Link to the record in the city portal"),
    Field("_extract_id", pl.Utf8, True, "Bronze extract the row came from (lineage)"),
)

SILVER_SCHEMA: dict[str, pl.DataType] = {f.name: f.dtype for f in SILVER_CONTRACT}
REQUIRED = [f.name for f in SILVER_CONTRACT if f.required]

# Hard rules: a row that breaks one is moved to quarantine with the rule name, never silently dropped.
HARD_RULES: dict[str, pl.Expr] = {
    "permit_num_missing_or_malformed": ~pl.col("permit_num").fill_null("").str.contains(PERMITNUM_RE),
    "negative_cost": pl.col("est_project_cost").fill_null(0) < 0,
    "issued_before_applied": pl.col("days_to_issue").fill_null(0) < 0,
    "completed_before_issued": pl.col("days_to_complete").fill_null(0) < 0,
}
