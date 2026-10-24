select * from {{ ref('mart_contractor_concentration') }}
where top_n_share not between 0 and 1 or hhi not between 0 and 10000
