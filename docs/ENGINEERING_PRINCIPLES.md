# Engineering Principles

These principles show up in the code across this portfolio.

## 1. Provenance is a feature
Every imported value keeps its origin: source file, sheet, row and import batch. In the Enterprise WIP Command Center each row carries `sourceFile`, `sourceSheet` and `sourceRow`. In the survey platform, every dashboard figure is recomputed from stored responses.

## 2. One calculation library, many surfaces
Formulas live in a single shared module (`shared/calc.ts`, `shared/analytics.ts`, `server/metrics.ts`) imported by the API, the UI and the exporters. A PDF, a dashboard tile and an Excel export can't disagree.

## 3. Never overwrite source data
Source values are immutable. Derived values are recalculated, and human adjustments are stored as overrides with a reason, an author and a history.

## 4. Separate evidence classes
Observed data, participant- or provider-reported figures, model estimates and plans are labeled and shown separately. Unfavorable findings stay in the record.

## 5. Contracts before code
Datasets declare grain, keys, owner and field contracts up front (`shared/contracts.ts`). Forms, import mappings, validation, templates and the data dictionary are generated from that one declaration.

## 6. Safe by default
- Published periods are locked as versions.
- External writes (e.g., Procore) and live trading are disabled until explicitly enabled.
- Small-cell suppression protects respondents, and contact details are stored apart from responses.
- File operations are dry-run first, journaled and reversible.

## 7. Prove it reproduces
Before a system replaces a spreadsheet, it has to reproduce the approved spreadsheet's control totals within a stated tolerance (`server/repro.ts`).
