# Seattle permits data platform: one command per stage, `make all` for the full run.
#   make setup      install Python deps (Java 17 needed for Spark; sbt for the Scala build)
#   make all        live API -> Polars -> dbt -> PySpark -> Scala -> parity -> charts
#   make replay     same, but rebuilt from the last landed bronze extract (no network)
#   make test       every unit/integration test (pytest, dbt, ScalaTest)

PY        ?= python
POLARS    := seattle-permits-polars-pipeline
DBT       := seattle-permits-dbt-duckdb
SPARK     := seattle-permits-spark
SILVER    := $(abspath $(POLARS)/data/silver/permits_by_year)
SEED      := $(abspath $(DBT)/seeds/status_lifecycle.csv)
SCALA_JAR ?= $(SPARK)/scala_job/target/scala-2.12/seattle-permits-spark_2.12-1.0.0.jar
SUBMIT    := spark-submit --master "local[2]" --driver-memory 3g
AS_OF     ?=

.PHONY: setup all replay pipeline pipeline-replay dbt pyspark scala-build scala parity charts test clean

setup:
	$(PY) -m pip install -r requirements.txt

all: pipeline dbt pyspark scala parity charts
replay: pipeline-replay dbt pyspark scala parity charts

pipeline:
	cd $(POLARS) && PYTHONPATH=src $(PY) -m permits_pipeline run --source api $(if $(AS_OF),--as-of $(AS_OF))

pipeline-replay:
	cd $(POLARS) && PYTHONPATH=src $(PY) -m permits_pipeline run --source replay $(if $(AS_OF),--as-of $(AS_OF))

dbt:
	cd $(DBT) && DBT_PROFILES_DIR=. dbt build && DBT_PROFILES_DIR=. dbt source freshness && DBT_PROFILES_DIR=. dbt docs generate

pyspark:
	cd $(SPARK) && $(SUBMIT) pyspark_job/permits_spark/main.py --silver $(SILVER) --lifecycle $(SEED) --out output/pyspark

scala-build:
	cd $(SPARK)/scala_job && sbt -batch package

scala: scala-build
	cd $(SPARK) && $(SUBMIT) --class com.thedataguys.permits.Main $(abspath $(SCALA_JAR)) $(SILVER) output/scala

parity:
	cd $(SPARK) && $(PY) parity/parity_check.py

charts:
	$(PY) docs/make_charts.py

test:
	cd $(POLARS) && PYTHONPATH=src $(PY) -m pytest -q
	cd $(SPARK) && $(PY) -m pytest -q pyspark_job/tests
	cd $(SPARK)/scala_job && sbt -batch test
	cd $(DBT) && DBT_PROFILES_DIR=. dbt build

clean:
	rm -rf $(POLARS)/data $(DBT)/target $(SPARK)/output $(SPARK)/scala_job/target
