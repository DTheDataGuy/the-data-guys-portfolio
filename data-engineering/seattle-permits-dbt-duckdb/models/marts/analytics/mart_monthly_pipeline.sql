-- Applications, issuances and completions per month on a gap-free month spine,
-- with a trailing 12-month average and year-over-year change. The newest month is flagged partial.
with bounds as (
    select min(applied_month) as first_month, max(applied_month) as last_month
    from {{ ref('fct_permits') }}
),

spine as (
    select cast(m as date) as month
    from bounds, generate_series(first_month, last_month, interval 1 month) as t(m)
),

applied as (
    select applied_month as month, count(*) as applications,
           sum(declared_value_usd) as declared_value_usd,
           sum(housing_units_added) as housing_units_applied
    from {{ ref('fct_permits') }} where applied_month is not null group by 1
),

issued as (
    select cast(date_trunc('month', issued_date) as date) as month, count(*) as issuances
    from {{ ref('fct_permits') }} where issued_date is not null group by 1
),

completed as (
    select cast(date_trunc('month', completed_date) as date) as month, count(*) as completions
    from {{ ref('fct_permits') }} where completed_date is not null group by 1
),

monthly as (
    select
        s.month,
        coalesce(a.applications, 0)          as applications,
        coalesce(i.issuances, 0)             as issuances,
        coalesce(c.completions, 0)           as completions,
        coalesce(a.declared_value_usd, 0)    as declared_value_usd,
        coalesce(a.housing_units_applied, 0) as housing_units_applied
    from spine s
    left join applied a using (month)
    left join issued i using (month)
    left join completed c using (month)
)

select
    *,
    month = (select last_month from bounds)                   as is_partial_month,
    round(avg(applications) over (order by month rows between 11 preceding and current row), 1)
        as applications_trailing_12m_avg,
    applications - lag(applications, 12) over (order by month) as applications_yoy_change,
    round({{ safe_divide("applications - lag(applications, 12) over (order by month)",
                         "lag(applications, 12) over (order by month)") }} * 100, 1) as applications_yoy_pct
from monthly
order by month
