-- No permit is lost or duplicated between the silver source and the fact table.
select s.n as source_rows, f.n as fact_rows
from (select count(*) as n from {{ source('silver', 'permits') }}) s,
     (select count(*) as n from {{ ref('fct_permits') }}) f
where s.n <> f.n
