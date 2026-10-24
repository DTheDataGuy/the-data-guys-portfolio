# thedataguys.org: Company Website

**Client / organization:** The Data Guys  
**Live deployment:** [thedataguys.org](https://thedataguys.org)  
**Built by:** Dei'Marlon Scisney · The Data Guys

![thedataguys.org: Company Website](../../docs/screenshots/thedataguys-website.png)

## Overview

The Data Guys' marketing and lead-generation site: a large React application with interactive diagnostics, calculators and content.

## Tech stack

`TypeScript` · `React 18` · `Vite` · `Tailwind CSS` · `shadcn/ui` · `React Router` · `Prerendering` · `Vercel`

## Engineering highlights

- ~23,000 lines of authored TSX across 108 components.
- Interactive tools: Data Health Assessment, Data Disaster Simulator, Benchmark Tool, ROI and Impact Equation calculators, Data Stack Tool, AI Readiness.
- Blog with build-time prerendering and sitemap generation (`prerender/`).
- Auth callback flow, settings API client, and PDF lead-magnet downloads.

## Code footprint

| Language | Authored lines |
|---|---:|
| TypeScript | 24,154 |
| CSS | 1,572 |
| JavaScript | 313 |
| HTML | 61 |

shadcn/ui primitives in `components/ui` and compiled builds are not counted.

## Run locally

```bash
npm install
npm run dev
```
