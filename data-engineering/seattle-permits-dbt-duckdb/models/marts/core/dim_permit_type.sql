select
    {{ dbt_utils_surrogate(['permit_type', 'permit_work_class']) }} as permit_type_key,
    permit_type,
    permit_work_class,
    count(*)                                   as permits_all_time,
    min(applied_year)                          as first_year,
    max(applied_year)                          as last_year
from {{ ref('stg_permits') }}
group by all
