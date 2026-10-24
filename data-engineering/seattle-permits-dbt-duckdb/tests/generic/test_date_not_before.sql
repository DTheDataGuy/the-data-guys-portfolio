{# Fails for rows where column_name is earlier than other_column (both non-null). #}
{% test date_not_before(model, column_name, other_column) %}
select {{ column_name }}, {{ other_column }}
from {{ model }}
where {{ column_name }} is not null
  and {{ other_column }} is not null
  and {{ column_name }} < {{ other_column }}
{% endtest %}
