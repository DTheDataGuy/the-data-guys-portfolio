package com.thedataguys.permits

/** Pure statistics helpers — no Spark, so they're trivially unit-testable. */
object Stats {

  /** Exact percentile with linear interpolation between closest ranks (same definition as
    * Spark's `percentile`, Polars' `quantile(interpolation="linear")` and DuckDB's `quantile_cont`).
    */
  def percentile(values: Seq[Long], q: Double): Double = {
    require(values.nonEmpty, "percentile of an empty sequence")
    require(q >= 0.0 && q <= 1.0, s"q must be in [0, 1], got $q")
    val sorted = values.sorted.toIndexedSeq
    val pos    = q * (sorted.length - 1)
    val lo     = math.floor(pos).toInt
    val hi     = math.ceil(pos).toInt
    sorted(lo) + (sorted(hi) - sorted(lo)) * (pos - lo)
  }

  def round2(x: Double): Double = BigDecimal(x).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
}
