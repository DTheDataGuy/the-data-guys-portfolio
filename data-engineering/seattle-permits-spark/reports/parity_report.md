# Cross-engine parity report

Baseline: **Polars gold**. Tolerance: 1e-09. Result: **PASS**

| Metric | Engine | Rows (Polars / engine) | Missing either side | Mismatched values | Max abs diff | Match |
|---|---|---|---|---|---|---|
| `cycle_times` | duckdb | 124 / 124 | 0 | 0 | 5.68e-14 | yes |
| `cycle_times` | pyspark | 124 / 124 | 0 | 0 | 5.68e-14 | yes |
| `cycle_times` | scala | 124 / 124 | 0 | 0 | 0.00e+00 | yes |
| `housing_production` | duckdb | 620 / 620 | 0 | 0 | 0.00e+00 | yes |
| `housing_production` | pyspark | 620 / 620 | 0 | 0 | 0.00e+00 | yes |
| `housing_production` | scala | 620 / 620 | 0 | 0 | 0.00e+00 | yes |
