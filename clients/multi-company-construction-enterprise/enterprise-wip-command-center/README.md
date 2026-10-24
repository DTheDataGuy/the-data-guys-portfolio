# Enterprise WIP Command Center

**Client / organization:** Multi-company construction enterprise (anonymized)  
**Built by:** Dei'Marlon Scisney · The Data Guys

![Enterprise WIP Command Center](../../../docs/assets/enterprise-wip-architecture.svg)

## Overview

A governed, multi-company work-in-progress (WIP) reporting and planning platform. It ingests monthly WIP workbooks from many operating companies, reconciles them against source formulas, locks published months as immutable versions, and turns them into backlog, margin, cash, bonding-capacity and exception views for executives.

## Tech stack

`TypeScript` · `React 18` · `Vite` · `Express` · `SQLite (better-sqlite3)` · `Drizzle ORM` · `TanStack Query` · `Tailwind CSS` · `shadcn/ui` · `SheetJS` · `PDF/DOCX export`

## Engineering highlights

- **Governed calculation library** (`shared/calc.ts`): one formula set shared by server, UI and exports. Source values are never overwritten; derived values (remaining contract, remaining cost, GP, weighted GM, over/under-billing) are recomputed.
- **Month-end exception layer** (`shared/recon.ts`): auto-clears explainable variances across Costpoint, HCSS and Procore within absolute and percent tolerances, and routes true exceptions to an owner.
- **Spreadsheet importer** (`server/importer.ts`): header-alias mapping across 18+ company layouts, row-level provenance (file, sheet, row), preview-before-commit, and blocking-error review.
- **Workbook reproduction tests** (`server/repro.ts`): the app recomputes control totals from imported rows and fails a period that drifts from the approved workbook.
- **Period lifecycle**: draft → review → published with locked versions, row overrides with reason and history, and an audit trail.
- **56 REST endpoints**: auth, periods, rows, overrides, attachments, rules, bonds, forecasts and exports.
- **24 application pages**: command center, portfolio, pipeline, forecast, cash, capacity, bonds, exceptions, close, month-end, audit, roadmap and more.

## Code footprint

| Language | Authored lines |
|---|---:|
| TypeScript | 6,236 |
| CSS | 297 |
| HTML | 16 |
| JavaScript | 6 |

shadcn/ui primitives in `components/ui` and compiled builds are not counted.

## Run locally

```bash
npm install
npm run dev
```

## Confidentiality

Client identity is anonymized; entity codes and names are fictional. Client seed workbooks and real control totals are removed. The code, schema and reconciliation logic are intact.
