{# Whole days from start_date to end_date; null if either side is null. #}
{% macro days_between(start_date, end_date) -%}
    date_diff('day', {{ start_date }}, {{ end_date }})
{%- endmacro %}
