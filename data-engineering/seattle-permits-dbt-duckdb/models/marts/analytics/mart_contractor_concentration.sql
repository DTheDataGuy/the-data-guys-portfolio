-- How concentrated is the contractor market each year? Top-N share and the
-- Herfindahl-Hirschman Index (HHI, 0-10,000; above 2,500 is "highly concentrated").
-- Aggregate only: some "contractors" in the source are private individuals, so names stay out of marts.
with by_contractor as (
    select applied_year, contractor, count(*) as permits
    from {{ ref('fct_permits') }}
    where contractor is not null and applied_year is not null
    group by all
),

shares as (
    select
        *,
        permits::double / sum(permits) over (partition by applied_year) as share,
        row_number() over (partition by applied_year order by permits desc, contractor) as rnk
    from by_contractor
)

select
    applied_year,
    count(*)                                                        as active_contractors,
    sum(permits)                                                    as permits_with_contractor,
    round(sum(case when rnk <= {{ var('top_n_contractors') }} then share else 0 end), 4) as top_n_share,
    round(sum(share * share) * 10000, 1)                            as hhi
from shares
group by applied_year
order by applied_year
