-- Seattle ZIP dimension with a permit-weighted centroid (useful for maps without a GIS join).
select
    zip,
    count(*)                         as permits_all_time,
    round(avg(latitude), 5)          as centroid_lat,
    round(avg(longitude), 5)         as centroid_lon,
    min(applied_year)                as first_year,
    max(applied_year)                as last_year
from {{ ref('stg_permits') }}
where zip is not null
group by zip
