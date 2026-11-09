from __future__ import annotations

from pyspark.sql import SparkSession


def build_session(app: str = "seattle-permits", master: str | None = None) -> SparkSession:
    """Local-friendly defaults; on a cluster, spark-submit's --master and conf take precedence."""
    builder = (SparkSession.builder.appName(app)
               .config("spark.sql.adaptive.enabled", "true")
               .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
               .config("spark.sql.shuffle.partitions", "16")
               .config("spark.sql.session.timeZone", "UTC")
               .config("spark.sql.parquet.mergeSchema", "false")
               .config("spark.ui.showConsoleProgress", "false"))
    if master:
        builder = builder.master(master)
    return builder.getOrCreate()
