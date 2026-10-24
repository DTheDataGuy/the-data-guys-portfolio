-- Housing units by ZIP and issue year, with each ZIP's running cumulative net units.
with yearly as (
    select
        zip,
        issued_year,
        count(*)                       as housing_permits,
        sum(housing_units_added)       as units_added,
        sum(housing_units_removed)     as units_removed
    from {{ ref('fct_permits') }}
    where issued_year is not null
      and zip is not null
      and housing_units_added + housing_units_removed > 0
    group by all
)

select
    *,
    units_added - units_removed as net_units,
    sum(units_added - units_removed) over (partition by zip order by issued_year
                                           rows between unbounded preceding and current row) as cumulative_net_units,
    rank() over (partition by issued_year order by units_added - units_removed desc) as net_units_rank_in_year
from yearly
order by zip, issued_year
