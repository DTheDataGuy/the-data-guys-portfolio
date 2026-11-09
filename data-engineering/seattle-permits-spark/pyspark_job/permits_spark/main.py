"""spark-submit entry point.

    spark-submit pyspark_job/permits_spark/main.py \
        --silver ../seattle-permits-polars-pipeline/data/silver/permits_by_year \
        --lifecycle ../seattle-permits-dbt-duckdb/seeds/status_lifecycle.csv \
        --out output/pyspark
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from permits_spark import jobs  # noqa: E402
from permits_spark.session import build_session  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--silver", required=True, help="Hive-partitioned silver Parquet (applied_year=YYYY/)")
    ap.add_argument("--lifecycle", required=True, help="status_lifecycle.csv seed from the dbt project")
    ap.add_argument("--out", default="output/pyspark")
    ap.add_argument("--master", default=None)
    args = ap.parse_args(argv)

    spark = build_session("permits-pyspark", args.master)
    t0 = time.perf_counter()
    permits = jobs.assert_contract(spark.read.parquet(args.silver)).cache()
    lifecycle = spark.read.option("header", True).csv(args.lifecycle)
    rows = permits.count()

    outputs = {
        "cycle_times": jobs.cycle_times(permits),
        "housing_production": jobs.housing_production(permits),
        "rolling_applications": jobs.rolling_applications(permits),
        "repeat_site_activity": jobs.repeat_site_activity(permits, lifecycle),
    }
    counts = {}
    for name, df in outputs.items():
        target = f"{args.out}/{name}"
        writer = df.write.mode("overwrite")
        if name == "housing_production":
            writer = writer.partitionBy("issued_year")
        writer.parquet(target)
        counts[name] = spark.read.parquet(target).count()

    summary = {"engine": f"pyspark {spark.version}", "input_rows": rows, "outputs": counts,
               "seconds": round(time.perf_counter() - t0, 1)}
    Path(args.out).mkdir(parents=True, exist_ok=True)
    Path(args.out, "_run_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary))
    spark.stop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
