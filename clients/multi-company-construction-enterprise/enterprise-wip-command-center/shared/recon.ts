/* Month-end exception layer: auto-clear what can be explained, route true exceptions. */
export type ReconItem = {
  id: string; period: string; entity: string | null; project_id: string | null; project_name: string | null;
  cp: number | null; hcss: number | null; procore: number | null; open_ap: number | null; eac: number | null; prior_eac: number | null;
  approved_co: number | null; pending_co: number | null; mgmt_adj: number | null; adj_reason: string | null; owner: string | null;
  status: string; note: string | null; sample: number;
};
export type ReconTol = { absTol: number; pctTol: number; eacMovePct: number; materiality: number; pendingCoPct: number };
export const DEFAULT_TOL: ReconTol = { absTol: 5000, pctTol: 0.005, eacMovePct: 0.02, materiality: 250000, pendingCoPct: 0.1 };
export type Owners = { actuals: string; eac: string; field: string };
export const DEFAULT_OWNERS: Owners = { actuals: "Company controller / finance", eac: "Project manager / EAC owner", field: "Company operations lead" };

export type Check = { code: string; label: string; result: "pass" | "cleared" | "approval" | "exception" | "n/a"; detail: string; owner?: keyof Owners; severity?: "critical" | "high" | "medium" };
export type ReconOut = { disposition: "Auto-cleared" | "Needs approval" | "Exception"; checks: Check[]; route: keyof Owners | null; fieldDiff: number | null };

const abs = Math.abs;
export function evalRecon(x: ReconItem, wip: { A: number | null; E: number | null; C: number | null } | null, t: ReconTol): ReconOut {
  const checks: Check[] = [];
  const tol = (base: number | null) => Math.max(t.absTol, abs(base || 0) * t.pctTol);
  const $ = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  // 1 EAC below actual — never auto-cleared
  if (x.eac !== null && x.cp !== null && x.eac + 0.005 < x.cp) checks.push({ code: "MX-EAC<ACT", label: "EAC below CostPoint actual", result: "exception", detail: `EAC ${$(x.eac)} < actual ${$(x.cp)} — always routed`, owner: "eac", severity: "critical" });
  // 2 CostPoint vs field system
  const field = x.hcss ?? x.procore;
  let fieldDiff: number | null = null;
  if (x.cp !== null && field !== null) {
    fieldDiff = field - x.cp;
    const tl = tol(x.cp);
    const src = x.hcss !== null ? "HCSS" : "Procore";
    if (abs(fieldDiff) <= tl) checks.push({ code: "MX-TIE", label: `CostPoint ↔ ${src} actuals`, result: "pass", detail: `Difference ${$(fieldDiff)} within tolerance ${$(tl)}` });
    else if (x.open_ap !== null && abs(fieldDiff - x.open_ap) <= tl) checks.push({ code: "MX-TIMING", label: `CostPoint ↔ ${src} actuals`, result: "cleared", detail: `Difference ${$(fieldDiff)} explained by open AP / accrual ${$(x.open_ap)} (timing)` });
    else if (x.mgmt_adj !== null && x.adj_reason && abs(fieldDiff - x.mgmt_adj) <= tl) {
      const big = abs(x.mgmt_adj) >= t.materiality;
      checks.push({ code: "MX-ADJ", label: `CostPoint ↔ ${src} actuals`, result: big ? "approval" : "cleared", detail: `Explained by documented adjustment ${$(x.mgmt_adj)}: “${x.adj_reason}”${big ? " — above materiality, needs approval" : ""}`, owner: "eac", severity: "medium" });
    } else checks.push({ code: "MX-ACTVAR", label: `CostPoint ↔ ${src} actuals`, result: "exception", detail: `Unexplained difference ${$(fieldDiff)} (tolerance ${$(tl)})`, owner: "actuals", severity: abs(fieldDiff) >= t.materiality ? "high" : "medium" });
  } else checks.push({ code: "MX-TIE", label: "CostPoint ↔ field actuals", result: "n/a", detail: "Field-system actual not supplied" });
  // 3 WIP ITD cost ↔ CostPoint
  if (wip && wip.A !== null && x.cp !== null) {
    const d = wip.A - x.cp, tl = tol(x.cp);
    checks.push(abs(d) <= tl ? { code: "MX-WIPCOST", label: "WIP ITD cost ↔ CostPoint", result: "pass", detail: `Difference ${$(d)}` } : { code: "MX-WIPCOST", label: "WIP ITD cost ↔ CostPoint", result: "exception", detail: `WIP ITD cost differs by ${$(d)}`, owner: "actuals", severity: "high" });
  }
  // 4 EAC movement
  if (x.eac !== null && x.prior_eac !== null) {
    const d = x.eac - x.prior_eac, lim = abs(x.prior_eac) * t.eacMovePct;
    if (abs(d) <= Math.max(lim, t.absTol)) checks.push({ code: "MX-EACMOVE", label: "EAC movement vs prior month", result: "pass", detail: `Moved ${$(d)} (within ${(t.eacMovePct * 100).toFixed(1)}%)` });
    else if (x.approved_co !== null && abs(d) <= abs(x.approved_co) + tol(x.prior_eac)) checks.push({ code: "MX-EACCO", label: "EAC movement vs prior month", result: "cleared", detail: `Moved ${$(d)} — explained by approved change order ${$(x.approved_co)}` });
    else if (x.adj_reason && x.mgmt_adj !== null) checks.push({ code: "MX-EACADJ", label: "EAC movement vs prior month", result: "approval", detail: `Moved ${$(d)} with documented reason “${x.adj_reason}” — needs forecast owner approval`, owner: "eac", severity: "medium" });
    else checks.push({ code: "MX-EACVAR", label: "EAC movement vs prior month", result: "exception", detail: `Unexplained EAC movement ${$(d)}`, owner: "eac", severity: abs(d) >= t.materiality ? "high" : "medium" });
  }
  // 5 WIP EAC ↔ reconciliation EAC
  if (wip && wip.E !== null && x.eac !== null) {
    const d = wip.E - x.eac;
    if (abs(d) > tol(x.eac)) checks.push({ code: "MX-WIPEAC", label: "WIP EAC ↔ reconciliation EAC", result: "exception", detail: `WIP EAC differs by ${$(d)}`, owner: "eac", severity: "high" });
    else checks.push({ code: "MX-WIPEAC", label: "WIP EAC ↔ reconciliation EAC", result: "pass", detail: "Matches" });
  }
  // 6 Pending change exposure
  if (x.pending_co !== null && wip?.C) {
    const r = abs(x.pending_co) / abs(wip.C);
    if (r >= t.pendingCoPct) checks.push({ code: "MX-PENDCO", label: "Pending change exposure", result: "exception", detail: `Pending COs ${$(x.pending_co)} = ${(r * 100).toFixed(1)}% of contract`, owner: "field", severity: "medium" });
  }
  const ex = checks.filter((c) => c.result === "exception");
  const ap = checks.filter((c) => c.result === "approval");
  const rank = { critical: 3, high: 2, medium: 1 } as const;
  const top = [...ex, ...ap].sort((a, b) => (rank[b.severity || "medium"] - rank[a.severity || "medium"]))[0];
  return { disposition: ex.length ? "Exception" : ap.length ? "Needs approval" : "Auto-cleared", checks, route: top?.owner || null, fieldDiff };
}
