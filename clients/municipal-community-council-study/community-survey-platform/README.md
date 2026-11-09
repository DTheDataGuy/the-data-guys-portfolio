# Community Council Feasibility Survey Platform

**Client / organization:** Municipal community-council feasibility study (anonymized)  
**Built by:** Dei'Marlon Scisney · The Data Guys

![Community Council Feasibility Survey Platform](../../../docs/screenshots/community-survey.png)

## Overview

A public survey plus a separate, restricted executive dashboard that informs whether and how a city should form a new community advisory council. Responses and opt-in contact details are stored separately, and no results are exposed to unauthenticated visitors.

## Tech stack

`TypeScript` · `React 18` · `Vite` · `Express` · `SQLite` · `Drizzle ORM` · `Recharts` · `Tailwind CSS` · `shadcn/ui`

## Engineering highlights

- **Versioned survey instrument** (`shared/survey.ts`): stable question IDs (Q01–Q37), stored option codes, and display labels keyed by language, so translations never change stored data.
- **Every dashboard number is computed** from stored responses in `shared/analytics.ts`. Nothing is hard-coded.
- **Privacy by design**: small-cell suppression (k = 5), separate contact store, and collection/internal/public release modes.
- **Representation tracking**: target sample by group against a planning population, with under-, on- and over-target status thresholds.
- **Staff tools**: paper entry, coded open-ended responses, collection links by channel, imports/exports, audit-logged settings, role-based access.
- **Save-and-resume** public sessions with progress checkpoints; 42 REST endpoints.

## Code footprint

| Language | Authored lines |
|---|---:|
| TypeScript | 4,335 |
| CSS | 261 |
| HTML | 15 |
| JavaScript | 6 |

shadcn/ui primitives in `components/ui` and compiled builds are not counted.

## Run locally

```bash
npm install
npm run dev
```

## Confidentiality

Sponsor identity is anonymized. Survey responses and the staff credentials file are excluded.
