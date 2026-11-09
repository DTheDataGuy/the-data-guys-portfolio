# Seattle Permits on Spark (PySpark + Scala)

**Independent portfolio build on public data** · Dei'Marlon Scisney · The Data Guys

`Apache Spark 3.5` · `PySpark` · `Scala 2.12` · `sbt` · `ScalaTest` · `pytest` · `Java 17`

The silver permits are recomputed on Spark twice: once in PySpark and once as typed Scala. A parity check then confirms that **Polars, DuckDB/dbt, PySpark and Scala produce identical numbers**.

## Latest runs (`local[2]`, 2 CPUs)

| Job | Input | Outputs | Time |
|---|---|---|---|
| PySpark | 193,725 rows, hive-partitioned by `applied_year` | `cycle_times` 124 · `housing_production` 620 · `rolling_applications` 825 · `repeat_site_activity` 16 | 15.1 s |
| Scala | same | `cycle_times` 124 · `housing_production` 620 | 10.9 s |
| Parity | 4 engines | 744 metric rows · 0 missing · 0 mismatched · max diff 5.7e-14 | [report](reports/parity_report.md) |

## PySpark (`pyspark_job/permits_spark/`)

- `jobs.py` holds pure `DataFrame → DataFrame` functions, so they're unit-testable without I/O.
  - `cycle_times`: exact `percentile()` (linear interpolation), group-size floor.
  - `housing_production`: cumulative net units with a `rowsBetween(unboundedPreceding, currentRow)` window.
  - `rolling_applications`: trailing 12 months with a `rangeBetween(-11, 0)` window over a month index.
  - `repeat_site_activity`: `lag()` per address plus a **broadcast join** to the lifecycle seed shared with dbt.
- `session.py` enables AQE with partition coalescing, UTC session time and no schema merging.
- `main.py` is the `spark-submit` entry point with a contract assertion on input columns, partitioned Parquet output and a run summary.
- `tests/` has 9 tests: percentiles, windows, lag logic, the contract guard, and the parity comparator catching drift and missing rows.

## Scala (`scala_job/`)

- `Model.scala` defines the typed `Permit`, `CycleTime` and `HousingYear` case classes.
- `PermitJobs.scala` uses `Dataset[Permit]` with `groupByKey` + `mapGroups` and a **hand-written exact percentile**, so the parity check validates this code, not just Spark's built-ins.
- `Stats.scala` holds pure functions covered by `StatsSpec` (ScalaTest, 5 tests).
- `build.sbt` targets Spark 3.5 (`Provided`) on Scala 2.12, with forked runs and tests.

## Run

```bash
# from data-engineering/ after the Polars pipeline has produced silver
make pyspark
make scala            # sbt package + spark-submit --class com.thedataguys.permits.Main
make parity
cd seattle-permits-spark && python -m pytest -q pyspark_job/tests
cd scala_job && sbt test
```
