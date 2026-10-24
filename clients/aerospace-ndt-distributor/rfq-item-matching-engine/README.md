# RFQ-to-Catalog Item Matching Engine

**Client / organization:** Aerospace NDT parts distributor (anonymized)  
**Built by:** Dei'Marlon Scisney · The Data Guys

## Overview

A Python matching engine that reads free-text requests for quote (RFQs) arriving by email in many layouts, extracts part numbers, and matches each line to the distributor's internal catalog: exact, competitor cross-reference, partial, description-only or out of scope, with a confidence level and a review note. Ships with a T-SQL schema that turns the prototype into an auditable RFQ archive.

## Tech stack

`Python` · `pandas` · `regex` · `difflib` · `pytest` · `SQL Server (T-SQL)` · `Jupyter / Colab`

## Engineering highlights

- **Part-number extraction** (`src/rfq_matcher.py`): normalization, a 200-term noise vocabulary, unit filters and validity rules pull real part numbers out of messy email text.
- **Seven-way match classification**: exact, cross-reference, cross-reference needed, partial (fuzzy via `difflib`), description match, out of scope and no match, each with confidence and an operator note.
- **Competitor cross-reference** table maps OEM part numbers to internal equivalents.
- **Production SQL design** (`sql/rfq_automation_schema.sql`, 330+ lines of T-SQL): configuration tables (cross-references, noise terms, junk patterns), RFQ archive, attachments, line items, match results and audit, with filtered unique indexes so operators can tune matching without a code deploy.
- **Schema guide** (`docs/sql-schema-recommendations.md`): data flow, retention, indexing and operator-review design.
- **Tested**: `pytest` suite plus a synthetic sample catalog; `python src/rfq_matcher.py sample_data/catalog_sample.csv` classifies 47 line items across 13 sample RFQs.

## Code footprint

| Language | Authored lines |
|---|---:|
| Python | 397 |
| SQL | 332 |

## Run locally

```bash
pip install -r requirements.txt
pytest -q
python src/rfq_matcher.py sample_data/catalog_sample.csv
```

## Confidentiality

Client, staff and estimate identifiers are replaced; internal part prefixes are fictional (DST, OEM). The sample catalog is synthetic. Original notebooks are kept in `notebooks/` with outputs cleared.
