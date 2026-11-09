# dbt build results

dbt 1.12.6 · DuckDB · generated 2026-10-20T05:49:54Z

| Resource | Count | Status |
|---|---:|---|
| model | 10 | success |
| seed | 2 | success |
| snapshot | 1 | success |
| test | 48 | pass |

## Every node

| Type | Name | Status | Time |
|---|---|---|---:|
| model | `dim_permit_type` | success | 0.19s |
| model | `dim_zip` | success | 0.14s |
| model | `fct_permits` | success | 2.85s |
| model | `int_permit_lifecycle` | success | 0.12s |
| model | `mart_active_pipeline` | success | 0.23s |
| model | `mart_contractor_concentration` | success | 0.17s |
| model | `mart_cycle_time_trends` | success | 0.18s |
| model | `mart_housing_production` | success | 0.18s |
| model | `mart_monthly_pipeline` | success | 0.18s |
| model | `stg_permits` | success | 0.26s |
| seed | `permit_suffix_codes` | success | 0.22s |
| seed | `status_lifecycle` | success | 0.19s |
| snapshot | `permit_status_snapshot` | success | 0.51s |
| test | `accepted_values_status_lifecycle_lifecycle_stage__intake__review__ready__issued__completed__terminated` | pass | 0.09s |
| test | `accepted_values_stg_permits_permit_class_mapped__Residential__Non_Residential__Unclassified` | pass | 0.08s |
| test | `assert_concentration_bounds` | pass | 0.04s |
| test | `assert_cumulative_housing_matches_totals` | pass | 0.05s |
| test | `assert_fact_reconciles_to_source` | pass | 0.05s |
| test | `assert_monthly_pipeline_reconciles_to_fact` | pass | 0.04s |
| test | `date_not_before_stg_permits_completed_date__issued_date` | pass | 0.08s |
| test | `date_not_before_stg_permits_issued_date__applied_date` | pass | 0.08s |
| test | `not_negative_fct_permits_days_to_complete` | pass | 0.04s |
| test | `not_negative_fct_permits_days_to_issue` | pass | 0.04s |
| test | `not_negative_fct_permits_declared_value_usd` | pass | 0.06s |
| test | `not_negative_fct_permits_housing_units_added` | pass | 0.05s |
| test | `not_negative_fct_permits_housing_units_removed` | pass | 0.05s |
| test | `not_negative_int_permit_lifecycle_days_since_prior_site_permit` | pass | 0.20s |
| test | `not_negative_mart_cycle_time_trends_p50_days_to_issue` | pass | 0.05s |
| test | `not_negative_mart_monthly_pipeline_applications` | pass | 0.05s |
| test | `not_negative_stg_permits_days_to_issue` | pass | 0.06s |
| test | `not_negative_stg_permits_declared_value_usd` | pass | 0.08s |
| test | `not_null_dim_permit_type_permit_type_key` | pass | 0.02s |
| test | `not_null_dim_zip_zip` | pass | 0.04s |
| test | `not_null_fct_permits_lifecycle_stage` | pass | 0.04s |
| test | `not_null_fct_permits_permit_num` | pass | 0.04s |
| test | `not_null_fct_permits_permit_type_key` | pass | 0.06s |
| test | `not_null_int_permit_lifecycle_lifecycle_stage` | pass | 0.22s |
| test | `not_null_int_permit_lifecycle_permit_num` | pass | 0.05s |
| test | `not_null_mart_contractor_concentration_applied_year` | pass | 0.05s |
| test | `not_null_mart_cycle_time_trends_p50_days_to_issue` | pass | 0.07s |
| test | `not_null_mart_monthly_pipeline_month` | pass | 0.04s |
| test | `not_null_permit_suffix_codes_permit_suffix` | pass | 0.11s |
| test | `not_null_status_lifecycle_status` | pass | 0.12s |
| test | `not_null_stg_permits_permit_num` | pass | 0.05s |
| test | `not_null_stg_permits_status` | pass | 0.07s |
| test | `relationships_fct_permits_permit_type_key__permit_type_key__ref_dim_permit_type_` | pass | 0.07s |
| test | `relationships_fct_permits_zip__zip__ref_dim_zip_` | pass | 0.05s |
| test | `relationships_mart_housing_production_zip__zip__ref_dim_zip_` | pass | 0.05s |
| test | `relationships_stg_permits_permit_suffix__permit_suffix__ref_permit_suffix_codes_` | pass | 0.07s |
| test | `relationships_stg_permits_status__status__ref_status_lifecycle_` | pass | 0.07s |
| test | `source_not_null_silver_permits_permit_num` | pass | 0.17s |
| test | `source_unique_silver_permits_permit_num` | pass | 0.19s |
| test | `unique_dim_permit_type_permit_type_key` | pass | 0.04s |
| test | `unique_dim_zip_zip` | pass | 0.05s |
| test | `unique_fct_permits_permit_num` | pass | 0.05s |
| test | `unique_int_permit_lifecycle_permit_num` | pass | 0.23s |
| test | `unique_mart_contractor_concentration_applied_year` | pass | 0.04s |
| test | `unique_mart_monthly_pipeline_month` | pass | 0.03s |
| test | `unique_permit_suffix_codes_permit_suffix` | pass | 0.05s |
| test | `unique_status_lifecycle_status` | pass | 0.08s |
| test | `unique_stg_permits_permit_num` | pass | 0.05s |
