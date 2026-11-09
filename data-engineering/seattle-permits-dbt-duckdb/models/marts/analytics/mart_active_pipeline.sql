-- Permits still moving through the city process, by stage, with how long they've been open.
select
    lifecycle_stage,
    status,
    count(*)                                                        as open_permits,
    quantile_cont({{ days_between('applied_date', 'data_as_of') }}, 0.5) as median_days_open,
    max({{ days_between('applied_date', 'data_as_of') }})           as max_days_open,
    any_value(data_as_of)                                           as data_as_of
from {{ ref('int_permit_lifecycle') }}
where is_active_pipeline
group by all
order by min(stage_order), open_permits desc
