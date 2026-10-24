/** Editable starting configuration. Every figure here can be replaced in Settings; changes are audit-logged. */
export const DEFAULT_SETTINGS = {
  survey_status: "open" as "open" | "closed",
  /** collection: public findings hidden · internal: team analysis only · public: aggregate findings published */
  mode: "collection" as "collection" | "internal" | "public",
  suppression_k: 5,
  target_n: 450,
  target_min: 400,
  target_max: 500,
  planning_population: 54700,
  status_under: 75, // attainment % below → Underrepresented
  status_on_low: 95, // ≥ → On target
  status_on_high: 125, // > → Above target
  closed_message: "The survey is not accepting responses right now. Thank you for your interest — please check back or use the Stay Involved form.",
};

const BASE_NOTE = "Project working baseline carried from the earlier representation analysis (build specification §7). Provenance of the underlying ACS pull has not yet been re-verified in this app; replace with current ACS B02023 / B02025 / B05006 / B04006 estimates and their margins of error.";
/** pct = population share benchmark (P_i). oversample = documented coefficient (O_i) chosen so T_i reproduces the earlier equity-adjusted target. */
export const DEFAULT_BENCHMARKS = [
  { bd_code: "BD-01", pct: 45.8, oversample: 0.9629 },
  { bd_code: "BD-02", pct: 23.7, oversample: 1.0886 },
  { bd_code: "BD-03", pct: 10.0, oversample: 1.06 },
  { bd_code: "BD-04", pct: 9.5, oversample: 0.9684 },
  { bd_code: "BD-05", pct: 2.9, oversample: 1.5862 },
  { bd_code: "BD-06", pct: 8.1, oversample: 0.7037 },
].map((b) => ({ ...b, moe: null as number | null, dataset: "Project working baseline", vintage: "Pre-2026 analysis", geography: "Seattle city", tbl: "B02023 / B02025 / B05006 / B04006 (combined)", variable: "Derived share", status: "Working baseline — verify", notes: BASE_NOTE }));

export const DEFAULT_FLOORS = [
  { key: "legacy", name: "Legacy / multigenerational Black Seattle residents", floor_min: 20, floor_max: 25, measure: "Q08 = Native Seattleite / lifelong resident, or Q05 = Born and/or raised in the Seattle area", notes: "Operational proxy; confirm definition with the project team." },
  { key: "youth", name: "Youth (under 25)", floor_min: 20, floor_max: null, measure: "Q01 = Under 18 or 18–24", notes: "" },
  { key: "elders", name: "Elders (65+)", floor_min: 15, floor_max: null, measure: "Q01 = 65–74 or 75+", notes: "" },
  { key: "lgbtq", name: "LGBTQ+ Black residents", floor_min: 10, floor_max: null, measure: "", notes: "Not asked in the current survey instrument. Track through outreach and focus groups, or add an optional question." },
  { key: "faith", name: "Faith-connected residents", floor_min: 20, floor_max: null, measure: "Q21 includes Faith-based activities", notes: "" },
  { key: "business", name: "Black business owners", floor_min: 15, floor_max: null, measure: "", notes: "Not asked in the current survey instrument." },
  { key: "immigrant", name: "Immigrant / refugee residents", floor_min: 30, floor_max: 35, measure: "Q04 includes African immigrant (proxy)", notes: "Proxy only: the survey does not ask immigration or refugee status directly, and Caribbean / Afro-Latino immigrants are not counted." },
  { key: "unaffiliated", name: "Residents unaffiliated with organizations", floor_min: 25, floor_max: null, measure: "Q21 = None of these", notes: "" },
  { key: "low_income", name: "Low-income residents", floor_min: 20, floor_max: null, measure: "", notes: "Not asked in the current survey instrument." },
  { key: "disability", name: "Residents with disabilities / accessibility needs", floor_min: 5, floor_max: 10, measure: "", notes: "Not asked in the current survey instrument." },
];

export const DEFAULT_SOURCES = [
  { id: "SRC-001", title: "About Seattle — 2024 ACS 1-Year Estimates", publisher: "City of Seattle, Office of Planning & Community Development", url: "https://www.seattle.gov/planning-and-community-development/population-and-demographics/about-seattle", dataset: "American Community Survey 1-Year", vintage: "2024", used_for: "Context: Black or African American alone share of Seattle residents", figure: "6.7% Black or African American alone", figure_type: "Measured (survey estimate, has margin of error)", notes: "Race alone understates people who are Black in combination with another race; see B02009 / B02025." },
  { id: "SRC-002", title: "QuickFacts: Seattle city, Washington", publisher: "U.S. Census Bureau", url: "https://www.census.gov/quickfacts/fact/table/seattlecitywashington/POP010220", dataset: "Population Estimates Program V2024 + ACS", vintage: "July 1, 2024", used_for: "Context: total city population", figure: "780,995 residents; 6.6% Black alone", figure_type: "Measured (official estimate)", notes: "780,995 × 6.6% ≈ 51,500 (calculated, rounded). The project’s 54,700 planning population is a separate working figure." },
  { id: "SRC-003", title: "Disaggregated Data for Race and Ethnic Groups", publisher: "City of Seattle, OPCD", url: "https://www.seattle.gov/planning-and-community-development/population-and-demographics/disaggregated-data-for-race-and-ethnic-groups", dataset: "ACS detailed tables", vintage: "Current", used_for: "Method: detailed Black groups; alone vs. alone-or-in-combination", figure: "", figure_type: "Methodology reference", notes: "Recommends alone-or-in-combination estimates where research needs allow." },
  { id: "SRC-004", title: "2024 ACS 1-Year table changes (new detailed Black tables B02023 / B02025)", publisher: "U.S. Census Bureau", url: "https://www.census.gov/programs-surveys/acs/technical-documentation/table-and-geography-changes/2024/1-year.html", dataset: "ACS 1-Year", vintage: "2024", used_for: "Method: source tables for diaspora benchmarks", figure: "", figure_type: "Methodology reference", notes: "B02023: Black alone, selected detailed groups. B02025: Black alone or in any combination." },
  { id: "SRC-005", title: "B02025: Black or African American alone or in any combination (detailed groups)", publisher: "U.S. Census Bureau, data.census.gov", url: "https://data.census.gov/table/ACSDT5Y2024.B02025", dataset: "ACS 5-Year", vintage: "2020–2024", used_for: "Planned: replace working baseline shares", figure: "", figure_type: "To be pulled", notes: "Pull for Seattle city (place 5363000) with margins of error." },
  { id: "SRC-006", title: "Project planning population and representation baseline", publisher: "Seattle Black Diasporic Council build specification (§5–§7)", url: "", dataset: "Earlier project analysis", vintage: "Pre-2026", used_for: "Planning population 54,700; 95% / ±5% benchmark ≈ 382; operational target 400–500; working composition baseline and equity-adjusted targets", figure: "54,700 planning population", figure_type: "Working assumption (not verified in this app)", notes: "Kept editable in Settings. Reaching 382 responses does not by itself make results statistically representative." },
];
