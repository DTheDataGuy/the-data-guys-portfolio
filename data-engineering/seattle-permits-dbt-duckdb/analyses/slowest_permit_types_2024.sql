-- Ad-hoc: which permit work classes took longest to issue for 2024 applications?
select permit_type, permit_work_class, issued_permits, p50_days_to_issue, p90_days_to_issue
from {{ ref('mart_cycle_time_trends') }}
where applied_year = 2024
order by p50_days_to_issue desc
