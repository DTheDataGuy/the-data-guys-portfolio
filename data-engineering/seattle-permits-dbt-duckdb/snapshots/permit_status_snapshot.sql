{% snapshot permit_status_snapshot %}
{{
  config(
    unique_key='permit_num',
    strategy='check',
    check_cols=['status', 'issued_date', 'completed_date', 'expires_date'],
    invalidate_hard_deletes=True
  )
}}
-- Type 2 history of each permit's status: every refresh records what changed and when.
select permit_num, status, issued_date, completed_date, expires_date, _extract_id
from {{ source('silver', 'permits') }}
{% endsnapshot %}
