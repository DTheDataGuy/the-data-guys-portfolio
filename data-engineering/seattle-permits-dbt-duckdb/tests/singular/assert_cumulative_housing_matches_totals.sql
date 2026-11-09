-- Each ZIP's final cumulative net units must equal the sum of its yearly net units.
with last_year as (
    select zip, cumulative_net_units,
           row_number() over (partition by zip order by issued_year desc) as rn
    from {{ ref('mart_housing_production') }}
),
totals as (
    select zip, sum(net_units) as total_net from {{ ref('mart_housing_production') }} group by zip
)
select l.zip, l.cumulative_net_units, t.total_net
from last_year l join totals t using (zip)
where l.rn = 1 and l.cumulative_net_units <> t.total_net
