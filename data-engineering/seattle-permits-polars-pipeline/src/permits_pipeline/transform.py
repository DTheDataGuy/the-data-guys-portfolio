"""Silver layer: type, clean, flag, deduplicate and quarantine — lazily, so Polars can optimize the plan."""
from __future__ import annotations

import logging
from datetime import date
from pathlib import Path

import polars as pl

from .config import SEATTLE_BBOX, Paths
from .contracts import (COST_OUTLIER_USD, HARD_RULES, SENTINEL_DATE_FLOOR, SILVER_SCHEMA, ZIP_RE)

log = logging.getLogger(__name__)

SOURCE_COLUMNS = (
    "permitnum", "permitclass", "permitclassmapped", "permittypemapped", "permittypedesc", "description",
    "housingunits", "housingunitsremoved", "housingunitsadded", "estprojectcost", "applieddate", "issueddate",
    "expiresdate", "completeddate", "statuscurrent", "relatedmup", "originaladdress1", "originalcity",
    "originalstate", "originalzip", "contractorcompanyname", "link_url", "latitude", "longitude",
    "totaldaysplanreview", "numberreviewcycles", "zoning", "dwellingunittype", "dependentbuilding",
    "parentpermitnum", "housingcategory",
)

DATE_COLS = {"applieddate": "applied_date", "issueddate": "issued_date",
             "expiresdate": "expires_date", "completeddate": "completed_date"}


def _text(col: str) -> pl.Expr:
    """Trim, collapse internal whitespace, and turn empty strings / 'N/A' placeholders into null."""
    c = pl.col(col).str.strip_chars().str.replace_all(r"\s+", " ")
    return pl.when(c.is_in(["", "N/A", "NA", "NULL"])).then(None).otherwise(c)


def _category(col: str) -> pl.Expr:
    """Required categorical: the source's 'N/A' becomes an explicit 'Unclassified' bucket, never null."""
    return _text(col).fill_null("Unclassified")


def _num(col: str, dtype: pl.DataType = pl.Float64) -> pl.Expr:
    return pl.col(col).cast(pl.Float64, strict=False).cast(dtype, strict=False)


def _date(col: str, as_of: date) -> pl.Expr:
    d = pl.col(col).str.to_datetime(strict=False).dt.date()
    floor = pl.lit(date.fromisoformat(SENTINEL_DATE_FLOOR))
    return pl.when((d < floor) | (d > pl.lit(as_of))).then(None).otherwise(d)


def _raw_date(col: str) -> pl.Expr:
    return pl.col(col).str.to_datetime(strict=False).dt.date()


def silver_plan(bronze: pl.LazyFrame, as_of: date | None = None) -> pl.LazyFrame:
    """Build the lazy silver plan from a bronze LazyFrame (all-string columns)."""
    as_of = as_of or date.today()
    floor = date.fromisoformat(SENTINEL_DATE_FLOOR)
    # Socrata omits keys that are null for every row in a page, so a small extract can be missing
    # whole columns. Add them as null strings so the plan (and the contract) never depends on luck.
    present = set(bronze.collect_schema().names())
    missing = [c for c in SOURCE_COLUMNS if c not in present]
    if missing:
        bronze = bronze.with_columns([pl.lit(None, dtype=pl.Utf8).alias(c) for c in missing])

    typed = bronze.select(
        pl.col("permitnum").str.strip_chars().str.to_uppercase().alias("permit_num"),
        _category("permitclass").alias("permit_class"),
        _category("permitclassmapped").alias("permit_class_mapped"),
        _category("permittypemapped").alias("permit_type"),
        _text("permittypedesc").alias("permit_type_desc"),
        _category("statuscurrent").alias("status"),
        _text("description").alias("description"),
        _text("housingcategory").alias("housing_category"),
        _text("dwellingunittype").alias("dwelling_unit_type"),
        _num("housingunits", pl.Int64).alias("housing_units_net"),
        _num("housingunitsadded", pl.Int64).alias("housing_units_added"),
        _num("housingunitsremoved", pl.Int64).alias("housing_units_removed"),
        _num("estprojectcost").alias("est_project_cost"),
        *[_date(src, as_of).alias(dst) for src, dst in DATE_COLS.items()],
        pl.any_horizontal([(_raw_date(src) < pl.lit(floor)) for src in DATE_COLS]).fill_null(False)
          .alias("flag_sentinel_date"),
        _num("totaldaysplanreview", pl.Int64).alias("plan_review_days"),
        _num("numberreviewcycles", pl.Int64).alias("review_cycles"),
        _text("originaladdress1").str.to_uppercase().alias("address"),
        _text("originalcity").str.to_uppercase().alias("city"),
        _text("originalzip").str.slice(0, 5).alias("zip_raw"),
        _num("latitude").alias("lat_raw"),
        _num("longitude").alias("lon_raw"),
        _text("contractorcompanyname").str.to_uppercase().alias("contractor"),
        _text("zoning").alias("zoning"),
        _text("parentpermitnum").alias("parent_permit_num"),
        _text("relatedmup").alias("related_mup"),
        (pl.col("dependentbuilding") == "1").alias("is_dependent_building"),
        pl.col("link_url").alias("source_url"),
        pl.col("_extract_id"),
    )

    in_bbox = (pl.col("lat_raw").is_between(SEATTLE_BBOX["lat_min"], SEATTLE_BBOX["lat_max"])
               & pl.col("lon_raw").is_between(SEATTLE_BBOX["lon_min"], SEATTLE_BBOX["lon_max"])).fill_null(False)
    zip_ok = pl.col("zip_raw").fill_null("").str.contains(ZIP_RE)

    return (
        typed.with_columns(
            pl.col("permit_num").str.extract(r"-([A-Z]{2})", 1).alias("permit_suffix"),
            pl.col("permit_num").str.contains(r"-\d{3}$").fill_null(False).alias("is_sub_permit"),
            (pl.col("issued_date") - pl.col("applied_date")).dt.total_days().alias("days_to_issue"),
            (pl.col("completed_date") - pl.col("issued_date")).dt.total_days().alias("days_to_complete"),
            pl.when(pl.col("plan_review_days") < 0).then(None).otherwise(pl.col("plan_review_days"))
              .alias("plan_review_days"),
            pl.col("applied_date").dt.truncate("1mo").alias("applied_month"),
            pl.col("applied_date").dt.year().cast(pl.Int32).alias("applied_year"),
            pl.when(zip_ok).then(pl.col("zip_raw")).otherwise(None).alias("zip"),
            pl.when(in_bbox).then(pl.col("lat_raw")).otherwise(None).alias("latitude"),
            pl.when(in_bbox).then(pl.col("lon_raw")).otherwise(None).alias("longitude"),
            (pl.col("est_project_cost").fill_null(0) > COST_OUTLIER_USD).alias("flag_cost_outlier"),
            (~in_bbox).alias("flag_bad_geo"),
            (~zip_ok).alias("flag_bad_zip"),
        )
        # One row per permit: keep the most advanced record if the source ever repeats a number.
        .sort(["permit_num", "completed_date", "issued_date", "applied_date"], nulls_last=False)
        .unique(subset="permit_num", keep="last", maintain_order=False)
    )


def split_quarantine(silver: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame]:
    """Separate rows that break a hard rule. Quarantined rows carry the names of every rule they broke."""
    rules = list(HARD_RULES.items())
    flagged = silver.with_columns(
        pl.concat_list([pl.when(expr).then(pl.lit(name)).otherwise(None) for name, expr in rules])
          .list.drop_nulls().alias("_violations")
    )
    bad = flagged.filter(pl.col("_violations").list.len() > 0)
    good = flagged.filter(pl.col("_violations").list.len() == 0).drop("_violations")
    return good.select([pl.col(c).cast(t) for c, t in SILVER_SCHEMA.items()]), bad


def to_silver(bronze_path: Path, paths: Paths, as_of: date | None = None) -> dict:
    paths.ensure()
    plan = silver_plan(pl.scan_parquet(bronze_path), as_of)
    silver_all = plan.collect()
    good, bad = split_quarantine(silver_all)
    good = good.sort("permit_num")
    good.write_parquet(paths.silver / "permits.parquet", compression="zstd", statistics=True)
    # Also partitioned by year for engines that prune on directory (Spark, DuckDB hive_partitioning).
    (good.with_columns(pl.col("applied_year").fill_null(0))
         .write_parquet(paths.silver / "permits_by_year", partition_by="applied_year", compression="zstd"))
    bad.with_columns(pl.col("_violations").list.join(";")).write_parquet(paths.quarantine / "permits_rejected.parquet")
    stats = {"bronze_rows": silver_all.height, "silver_rows": good.height, "quarantined_rows": bad.height,
             "quarantine_by_rule": (bad.explode("_violations").group_by("_violations").len()
                                    .sort("_violations").rows())}
    log.info("silver: %s rows, quarantine: %s", good.height, bad.height)
    return stats
