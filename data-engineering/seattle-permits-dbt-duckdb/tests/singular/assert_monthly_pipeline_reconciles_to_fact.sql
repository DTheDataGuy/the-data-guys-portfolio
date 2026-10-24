-- Every dated application in the fact table must appear exactly once in the monthly mart.
select m.total, f.total
from (select sum(applications) as total from {{ ref('mart_monthly_pipeline') }}) m,
     (select count(*) as total from {{ ref('fct_permits') }} where applied_month is not null) f
where m.total <> f.total
