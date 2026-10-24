/* Workbook reproduction targets.
 * Each target is a control total from the approved month-end workbook; the app recomputes
 * the same figure from imported WIP rows and flags any value outside its tolerance.
 * Client figures are redacted in this public portfolio copy. Supply real targets via the
 * secured admin configuration in a deployment. Served only to signed-in users. */
export type ReproTarget = { k: string; label: string; target: number | null; tol: number; fmt: "int" | "money" | "pct2" | "pct4" };
export const REPRO_TARGETS: ReproTarget[] = [
  { k: "rows", label: "Master project rows", target: null, tol: 0, fmt: "int" },
  { k: "eligible", label: "Reporting-eligible projects", target: null, tol: 0, fmt: "int" },
  { k: "C", label: "Current contract (eligible)", target: null, tol: 0.01, fmt: "money" },
  { k: "remC", label: "Remaining contract C − R", target: null, tol: 0.01, fmt: "money" },
  { k: "remCost", label: "Remaining cost E − A", target: null, tol: 0.01, fmt: "money" },
  { k: "remGP", label: "Remaining GP (C−R)−(E−A)", target: null, tol: 0.01, fmt: "money" },
  { k: "remGM", label: "Weighted remaining GM", target: null, tol: 1e-10, fmt: "pct4" },
  { k: "itdGP", label: "ITD GP R − A", target: null, tol: 0.01, fmt: "money" },
  { k: "loss", label: "Projected-loss projects", target: null, tol: 0, fmt: "int" },
  { k: "under", label: "Underbilled > $250K", target: null, tol: 0, fmt: "int" },
  { k: "fin", label: "Financial exceptions (loss ∪ under)", target: null, tol: 0, fmt: "int" },
  { k: "bond", label: "Bond-report projects", target: null, tol: 0, fmt: "int" },
  { k: "bondedRem", label: "Bonded remaining contract", target: null, tol: 0.01, fmt: "money" },
  { k: "bondedPct", label: "Bonded share of bond-report backlog", target: null, tol: 0.00005, fmt: "pct2" },
];
