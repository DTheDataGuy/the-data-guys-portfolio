package com.thedataguys.permits

import org.apache.spark.sql.{Dataset, SparkSession}
import org.apache.spark.sql.expressions.Window
import org.apache.spark.sql.functions._

/** Typed Dataset implementations of the cycle-time and housing metrics.
  *
  * Cycle times deliberately avoid Spark's built-in percentile: each group is reduced with
  * `groupByKey` + `mapGroups` and the hand-written [[Stats.percentile]], so the parity check against
  * PySpark, Polars and DuckDB also validates this code, not just Spark.
  */
object PermitJobs {

  def load(spark: SparkSession, silverPath: String): Dataset[Permit] = {
    import spark.implicits._
    spark.read.parquet(silverPath).select(
      col("permit_num").as("permitNum"),
      col("permit_type").as("permitType"),
      col("permit_type_desc").as("permitTypeDesc"),
      col("applied_year").cast("int").as("appliedYear"),
      col("issued_date").as("issuedDate"),
      col("days_to_issue").as("daysToIssue"),
      col("review_cycles").as("reviewCycles"),
      col("housing_units_added").as("housingUnitsAdded"),
      col("housing_units_removed").as("housingUnitsRemoved"),
      col("zip")
    ).as[Permit]
  }

  def cycleTimes(permits: Dataset[Permit], minYear: Int = 2010, minN: Int = 20): Dataset[CycleTime] = {
    import permits.sparkSession.implicits._
    permits
      .filter(p => p.daysToIssue.isDefined && p.appliedYear.exists(_ >= minYear))
      .groupByKey(p => (p.permitType, p.permitTypeDesc.getOrElse(Keys.NullDesc), p.appliedYear.get))
      .mapGroups { case ((ptype, desc, year), rows) =>
        val group  = rows.toVector
        val days   = group.flatMap(_.daysToIssue)
        val cycles = group.flatMap(_.reviewCycles)
        CycleTime(
          permit_type = ptype,
          permit_type_desc = if (desc == Keys.NullDesc) None else Some(desc),
          applied_year = year,
          issued_permits = group.size.toLong,
          p50_days_to_issue = Stats.percentile(days, 0.5),
          p90_days_to_issue = Stats.percentile(days, 0.9),
          avg_review_cycles =
            if (cycles.isEmpty) None else Some(Stats.round2(cycles.sum.toDouble / cycles.size))
        )
      }
      .filter(_.issued_permits >= minN)
  }

  def housingProduction(permits: Dataset[Permit]): Dataset[HousingYear] = {
    import permits.sparkSession.implicits._
    val yearly = permits
      .filter(p => p.issuedDate.isDefined && p.zip.isDefined &&
        (p.housingUnitsAdded.getOrElse(0L) + p.housingUnitsRemoved.getOrElse(0L)) > 0)
      .map(p => (p.zip.get, p.issuedDate.get.toLocalDate.getYear,
        p.housingUnitsAdded.getOrElse(0L), p.housingUnitsRemoved.getOrElse(0L)))
      .toDF("zip", "issued_year", "added", "removed")
      .groupBy("zip", "issued_year")
      .agg(count(lit(1)).as("housing_permits"), sum("added").as("units_added"), sum("removed").as("units_removed"))
      .withColumn("net_units", col("units_added") - col("units_removed"))

    val w = Window.partitionBy("zip").orderBy("issued_year").rowsBetween(Window.unboundedPreceding, Window.currentRow)
    yearly.withColumn("cumulative_net_units", sum("net_units").over(w)).as[HousingYear]
  }

  private object Keys { val NullDesc = "\u0000none" }
}
