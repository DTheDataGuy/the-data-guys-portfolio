-- Median and 90th-percentile days from application to issue, by type, work class and year,
-- with the year-over-year change in the median.
with issued as (
    select f.applied_year, t.permit_type, t.permit_work_class, f.days_to_issue, f.review_cycles
    from {{ ref('fct_permits') }} f
    join {{ ref('dim_permit_type') }} t using (permit_type_key)
    where f.days_to_issue is not null
      and f.applied_year >= {{ var('cycle_time_min_year') }}
),

yearly as (
    select
        permit_type,
        permit_work_class,
        applied_year,
        count(*)                                       as issued_permits,
        quantile_cont(days_to_issue, 0.5)              as p50_days_to_issue,
        quantile_cont(days_to_issue, 0.9)              as p90_days_to_issue,
        round(avg(review_cycles), 2)                   as avg_review_cycles
    from issued
    group by all
    having count(*) >= 20
)

select
    *,
    p50_days_to_issue - lag(p50_days_to_issue) over w as p50_change_vs_prior_year
from yearly
window w as (partition by permit_type, permit_work_class order by applied_year)
order by permit_type, permit_work_class, applied_year
