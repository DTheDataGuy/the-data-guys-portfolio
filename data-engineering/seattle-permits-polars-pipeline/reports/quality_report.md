# Data-quality report

Extract `20261020T054829Z` · 193,747 bronze rows · result: **PASS**

| Check | Severity | Result | Observed | Expectation |
|---|---|---|---|---|
| `contract_schema_matches` | error | pass | no drift | columns and dtypes equal SILVER_CONTRACT |
| `permit_num_unique` | error | pass | 0 duplicates | 0 duplicates |
| `required_not_null` | error | pass | 0 nulls | no nulls in 13 required columns |
| `bronze_rows_reconcile` | error | pass | 193,725 silver + 22 quarantined = 193,747 vs 193,747 bronze | every bronze row is in silver or quarantine |
| `quarantine_rate` | error | pass | 0.01% | < 1% of bronze rows quarantined |
| `permit_class_mapped_accepted_values` | error | pass | Non-Residential, Residential, Unclassified | subset of Non-Residential, Residential, Unclassified |
| `lifecycle_dates_ordered` | error | pass | 0 rows out of order | applied <= issued <= completed |
| `coordinates_inside_seattle` | error | pass | 0 outside | 0 outside bbox |
| `source_freshness` | warn | pass | newest application 2026-10-17 (3 days old) | <= 30 days old |
| `applied_date_completeness` | warn | pass | 23.78% null | <= 30.0% null |
| `zip_completeness` | warn | pass | 5.26% null | <= 10.0% null |
| `latitude_completeness` | warn | pass | 0.58% null | <= 5.0% null |
| `contractor_coverage_stable` | warn | FAIL | 15.1% of 2019 permits name a contractor vs 2.1% in 2023 | coverage within 50% of the 2019 level |
| `flag_sentinel_date` | warn | pass | 28 rows flagged (0.01%) | tracked, not dropped |
| `flag_cost_outlier` | warn | pass | 3 rows flagged (0.0%) | tracked, not dropped |
| `flag_bad_geo` | warn | pass | 1,126 rows flagged (0.58%) | tracked, not dropped |
| `flag_bad_zip` | warn | pass | 10,195 rows flagged (5.26%) | tracked, not dropped |
