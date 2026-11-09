-- Lifecycle stage from the seed, plus site-history features computed with window functions.
with permits as (
    select * from {{ ref('stg_permits') }}
),

lifecycle as (
    select * from {{ ref('status_lifecycle') }}
),

joined as (
    select
        p.*,
        l.lifecycle_stage,
        l.stage_order,
        l.is_terminal,
        l.is_active_pipeline,
        greatest(p.applied_date, p.issued_date, p.completed_date) as last_activity_date
    from permits p
    left join lifecycle l using (status)
)

select
    *,
    -- How many permits this address has seen, in order, and the gap since the previous one.
    case when address is not null then
        row_number() over (partition by address order by applied_date nulls last, permit_num)
    end as site_permit_seq,
    case when address is not null then
        {{ days_between(
            "lag(applied_date) over (partition by address order by applied_date nulls last, permit_num)",
            "applied_date") }}
    end as days_since_prior_site_permit,
    max(applied_date) over () as data_as_of
from joined
