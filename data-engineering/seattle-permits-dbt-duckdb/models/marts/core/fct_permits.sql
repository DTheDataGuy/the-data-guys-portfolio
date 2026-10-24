{{
  config(
    materialized='incremental',
    unique_key='permit_num',
    incremental_strategy='delete+insert',
    on_schema_change='fail'
  )
}}
-- Permit fact table. Incremental: each run re-merges every permit whose last activity falls inside the
-- look-back window, so late status changes (issued, completed) on older permits are picked up.

select
    permit_num,
    {{ dbt_utils_surrogate(['permit_type', 'permit_work_class']) }} as permit_type_key,
    zip,
    applied_month,
    applied_year,
    issued_year,
    permit_class,
    permit_class_mapped,
    status,
    lifecycle_stage,
    is_terminal,
    applied_date,
    issued_date,
    completed_date,
    last_activity_date,
    days_to_issue,
    days_to_complete,
    plan_review_days,
    review_cycles,
    declared_value_usd,
    housing_units_added,
    housing_units_removed,
    housing_units_net,
    contractor,
    site_permit_seq,
    days_since_prior_site_permit,
    flag_cost_outlier,
    flag_bad_geo,
    extract_id
from {{ ref('int_permit_lifecycle') }}

{% if is_incremental() %}
where last_activity_date is null
   or last_activity_date >= (select max(last_activity_date) from {{ this }}) - interval {{ var('incremental_lookback_days', 60) }} day
{% endif %}
