package com.thedataguys.permits

import org.apache.spark.sql.{SaveMode, SparkSession}

/** spark-submit --class com.thedataguys.permits.Main seattle-permits-spark.jar <silverPath> <outDir> */
object Main {
  def main(args: Array[String]): Unit = {
    require(args.length == 2, "usage: Main <silverPath> <outDir>")
    val Array(silverPath, outDir) = args

    val spark = SparkSession.builder()
      .appName("permits-scala")
      .config("spark.sql.adaptive.enabled", "true")
      .config("spark.sql.shuffle.partitions", "16")
      .config("spark.sql.session.timeZone", "UTC")
      .getOrCreate()

    val t0      = System.nanoTime()
    val permits = PermitJobs.load(spark, silverPath).cache()
    val rows    = permits.count()

    PermitJobs.cycleTimes(permits).write.mode(SaveMode.Overwrite).parquet(s"$outDir/cycle_times")
    PermitJobs.housingProduction(permits).write.mode(SaveMode.Overwrite)
      .partitionBy("issued_year").parquet(s"$outDir/housing_production")

    val ct = spark.read.parquet(s"$outDir/cycle_times").count()
    val hp = spark.read.parquet(s"$outDir/housing_production").count()
    val secs = (System.nanoTime() - t0) / 1e9
    println(f"""{"engine": "scala ${util.Properties.versionNumberString} / spark ${spark.version}", "input_rows": $rows, "outputs": {"cycle_times": $ct, "housing_production": $hp}, "seconds": $secs%.1f}""")
    spark.stop()
  }
}
