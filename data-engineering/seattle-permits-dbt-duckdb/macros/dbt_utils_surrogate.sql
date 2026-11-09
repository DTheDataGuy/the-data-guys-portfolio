{# Deterministic surrogate key (same idea as dbt_utils.generate_surrogate_key, no package needed). #}
{% macro dbt_utils_surrogate(columns) -%}
    md5({% for c in columns %}coalesce(cast({{ c }} as varchar), '_null_'){% if not loop.last %} || '|' || {% endif %}{% endfor %})
{%- endmacro %}
