"""Gold layer: analysis-ready tables, each with a reconciliation back to silver."""
from __future__ import annotations

from pathlib import Path

import polars as pl

VALUE = pl.when(~pl.col("flag_cost_outlier")).then(pl.col("est_project_cost"))


def monthly_pipeline(s: pl.LazyFrame) -> pl.LazyFrame:
    """Applications per month and class: volume, declared value and housing units."""
    return (s.filter(pl.col("applied_month").is_not_null())
             .group_by("applied_month", "permit_class_mapped")
             .agg(pl.len().alias("permits"),
                  pl.col("issued_date").is_not_null().sum().alias("issued_to_date"),
                  VALUE.sum().round(0).alias("declared_value_usd"),
                  pl.col("housing_units_added").fill_null(0).sum().alias("housing_units_added"))
             .sort("applied_month", "permit_class_mapped"))


def cycle_times(s: pl.LazyFrame, min_year: int = 2010) -> pl.LazyFrame:
    """How long permits take to issue, by type, work class and application year (issued permits only)."""
    return (s.filter(pl.col("days_to_issue").is_not_null() & (pl.col("applied_year") >= min_year))
             .group_by("permit_type", "permit_type_desc", "applied_year")
             .agg(pl.len().alias("issued_permits"),
                  pl.col("days_to_issue").median().alias("p50_days_to_issue"),
                  pl.col("days_to_issue").quantile(0.9, interpolation="linear").alias("p90_days_to_issue"),
                  pl.col("review_cycles").mean().round(2).alias("avg_review_cycles"))
             .filter(pl.col("issued_permits") >= 20)
             .sort("permit_type", "permit_type_desc", "applied_year"))


def housing_production(s: pl.LazyFrame) -> pl.LazyFrame:
    """Units added and removed by ZIP and issue year — the number housing policy is judged on."""
    return (s.filter(pl.col("issued_date").is_not_null() & pl.col("zip").is_not_null()
                     & (pl.col("housing_units_added").fill_null(0) + pl.col("housing_units_removed").fill_null(0) > 0))
             .with_columns(pl.col("issued_date").dt.year().alias("issued_year"))
             .group_by("zip", "issued_year")
             .agg(pl.len().alias("housing_permits"),
                  pl.col("housing_units_added").fill_null(0).sum().alias("units_added"),
                  pl.col("housing_units_removed").fill_null(0).sum().alias("units_removed"))
             .with_columns((pl.col("units_added") - pl.col("units_removed")).alias("net_units"))
             .sort("zip", "issued_year"))


def contractor_concentration(s: pl.LazyFrame, top_n: int = 10) -> pl.LazyFrame:
    """Contractor-market concentration per application year: top-N share and the Herfindahl-Hirschman
    Index (0-10,000). Aggregate only — some "contractors" in the source are private individuals, so no
    names leave this function."""
    by = (s.filter(pl.col("contractor").is_not_null() & pl.col("applied_year").is_not_null())
           .group_by("applied_year", "contractor").agg(pl.len().alias("permits"))
           .with_columns((pl.col("permits") / pl.col("permits").sum().over("applied_year")).alias("share"),
                         pl.col("permits").rank("ordinal", descending=True).over("applied_year").alias("rnk")))
    return (by.group_by("applied_year")
              .agg(pl.len().alias("active_contractors"),
                   pl.col("permits").sum().alias("permits_with_contractor"),
                   pl.col("share").filter(pl.col("rnk") <= top_n).sum().round(4).alias("top_n_share"),
                   (pl.col("share").pow(2).sum() * 10_000).round(1).alias("hhi"))
              .sort("applied_year"))


def status_funnel(s: pl.LazyFrame) -> pl.LazyFrame:
    return (s.group_by("permit_type", "status").agg(pl.len().alias("permits"))
             .with_columns((pl.col("permits") / pl.col("permits").sum().over("permit_type") * 100).round(2)
                           .alias("share_of_type_pct"))
             .sort("permit_type", "permits", descending=[False, True]))


TABLES = {"monthly_pipeline": monthly_pipeline, "cycle_times": cycle_times,
          "housing_production": housing_production, "contractor_concentration": contractor_concentration,
          "status_funnel": status_funnel}


def build_gold(silver_path: Path, out_dir: Path, csv_dir: Path | None = None) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    s = pl.scan_parquet(silver_path)
    frames = pl.collect_all([fn(s) for fn in TABLES.values()])
    result = {}
    for (name, _), df in zip(TABLES.items(), frames):
        df.write_parquet(out_dir / f"{name}.parquet")
        if csv_dir:
            csv_dir.mkdir(parents=True, exist_ok=True)
            df.write_csv(csv_dir / f"{name}.csv")
        result[name] = df.height
    # Reconciliation: the monthly table must account for every dated silver row.
    dated = s.filter(pl.col("applied_month").is_not_null()).select(pl.len()).collect().item()
    monthly_total = frames[0]["permits"].sum()
    funnel_total = frames[4]["permits"].sum()
    total = s.select(pl.len()).collect().item()
    result["reconciliation"] = {"monthly_pipeline_vs_dated_silver": [int(monthly_total), int(dated)],
                                "status_funnel_vs_silver": [int(funnel_total), int(total)],
                                "ok": monthly_total == dated and funnel_total == total}
    return result
