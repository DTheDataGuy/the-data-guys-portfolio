# Aerospace NDT Parts Distributor (anonymized)

## [RFQ-to-Catalog Item Matching Engine](rfq-item-matching-engine/)

A Python matching engine that reads free-text requests for quote (RFQs) arriving by email in many layouts, extracts part numbers, and matches each line to the distributor's internal catalog: exact, competitor cross-reference, partial, description-only or out of scope, with a confidence level and a review note. Ships with a T-SQL schema that turns the prototype into an auditable RFQ archive.

**Stack:** Python, pandas, regex, difflib, pytest, SQL Server (T-SQL), Jupyter / Colab

[← Back to portfolio](../../README.md)
