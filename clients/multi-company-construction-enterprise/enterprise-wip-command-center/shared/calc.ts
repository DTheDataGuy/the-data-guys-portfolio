/* Governed calculation library, shared by the server, the UI and exports.
   Source values are never overwritten; derived values are recalculated here.
   Let C = current/revised contract, R = ITD earned revenue, E = EAC cost, A = ITD cost, B = billings. */

export type Row = {
  id: string; period: string; importId: string | null;
  entity: string; company: string; bu: string;
  sourceFile: string; sourceSheet: string; sourceRow: number | null; masterRow: number | null;
  projectId: string; projectName: string; pm: string | null; status: string;
  jv: string; icwo: string;
  impElig: string | null; mgmtElig: string | null; impExcl: string | null;
  bondNo: string | null; bondStatusRaw: string | null;
  orig: number | null; mods: number | null; C: number | null; R: number | null; E: number | null; A: number | null; B: number | null;
  legacyExc: string | null; legacySev: string | null;
  customer: string | null; location: string | null; contractNo: string | null;
  inferred: string | null; bondMethod: string | null; bondScore: number | null;
  legacyBondReport: number; startDate: string | null; endDate: string | null;
  override: string | null; overrideReason: string | null; edited: number;
  /* server-evaluated */
  reasons: string[]; eligible: boolean; inBondReport: boolean; bondStatus: BondCat;
};

export type BondCat = "Bonded" | "Bonded - Number Unmatched" | "Unbonded" | "Needs Review" | "Unknown";
export const BOND_CATS: BondCat[] = ["Bonded", "Bonded - Number Unmatched", "Unbonded", "Needs Review"];

export function normBond(raw: string | null | undefined): BondCat {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "Unknown";
  if (s === "bonded") return "Bonded";
  if (s.startsWith("bonded - number") || s.includes("unmatched")) return "Bonded - Number Unmatched";
  if (s === "unbonded") return "Unbonded";
  if (s.includes("review")) return "Needs Review";
  return "Unknown";
}

const n = (x: number | null | undefined) => (x === null || x === undefined || Number.isNaN(x) ? null : x);
/* Workbook-compatible subtraction: a blank source cell stays blank on the row (and is flagged
   MISSING_INPUT), but the formula treats it as 0 exactly as the source workbook does (=V3-W3),
   so governed totals reconcile to the workbook. Both blank → unknown. */
const sub = (a: number | null, b: number | null) => (a === null && b === null ? null : (a ?? 0) - (b ?? 0));

export type Metrics = {
  remC: number | null; remCost: number | null; itdGP: number | null; remGP: number | null;
  remGM: number | null; remGMLegacy: number; remGMReason: string | null;
  ob: number | null; under: number | null; over: number | null;
  fcGP: number | null; fcGM: number | null; pctCost: number | null; pctRev: number | null;
  reconDiff: number | null; eacBelowActual: boolean; negRemC: boolean; missing: string[];
};

export function metrics(r: Pick<Row, "C" | "R" | "E" | "A" | "B" | "orig" | "mods">): Metrics {
  const C = n(r.C), R = n(r.R), E = n(r.E), A = n(r.A), B = n(r.B);
  const missing = ([["Current contract", C], ["ITD revenue", R], ["EAC", E], ["ITD cost", A], ["Billings", B]] as const).filter(([, v]) => v === null).map(([k]) => k);
  const remC = sub(C, R), remCost = sub(E, A), itdGP = sub(R, A);
  const remGP = remC === null || remCost === null ? null : remC - remCost;
  let remGM: number | null = null, remGMReason: string | null = null, remGMLegacy = 0;
  if (remC === null || remGP === null) remGMReason = "Missing inputs";
  else if (Math.abs(remC) < 0.01) remGMReason = "Remaining contract is zero";
  else { remGM = remGP / remC; remGMLegacy = remGM; if (remC < 0) remGMReason = "Negative remaining contract"; }
  const ob = B === null && R === null ? null : (B ?? 0) - (R ?? 0);
  const fcGP = sub(C, E);
  const fcGM = C && fcGP !== null && Math.abs(C) >= 0.01 ? fcGP / C : null;
  const pctCost = E && A !== null && E > 0 ? A / E : null;
  const pctRev = C && R !== null && C > 0 ? R / C : null;
  const reconDiff = C === null || r.orig === null || r.orig === undefined ? null : C - ((r.orig || 0) + (r.mods || 0));
  return {
    remC, remCost, itdGP, remGP, remGM, remGMLegacy, remGMReason, ob,
    under: ob === null ? null : Math.max(-ob, 0), over: ob === null ? null : Math.max(ob, 0),
    fcGP, fcGM, pctCost, pctRev, reconDiff,
    eacBelowActual: E !== null && A !== null && E + 0.005 < A,
    negRemC: remC !== null && remC < -0.005, missing,
  };
}

/* ---------- thresholds and exception labels ---------- */
export type LossBasis = "legacy" | "itd" | "forecast";
export type Thresholds = { lossBasis: LossBasis; lossThreshold: number; underThreshold: number };
export const DEFAULT_THRESHOLDS: Thresholds = { lossBasis: "legacy", lossThreshold: 100000, underThreshold: 250000 };

export type ExcCat = "LOSS" | "UNDER" | "BOND" | "EAC_LT_ACTUAL" | "NEG_REMC" | "ZERO_DENOM" | "MISSING_INPUT" | "BOND_CONFLICT" | "CONTRACT_RECON";
export const EXC_LABEL: Record<ExcCat, string> = {
  LOSS: "Projected loss", UNDER: "Underbilled", BOND: "Bond status needs review",
  EAC_LT_ACTUAL: "EAC below actual cost", NEG_REMC: "Negative remaining contract", ZERO_DENOM: "Margin not computable",
  MISSING_INPUT: "Blank source value", BOND_CONFLICT: "Bond evidence conflict", CONTRACT_RECON: "Contract ≠ original + mods",
};
export const EXC_GROUP: Record<ExcCat, "Financial" | "Bond" | "Data quality"> = {
  LOSS: "Financial", UNDER: "Financial", BOND: "Bond", EAC_LT_ACTUAL: "Data quality", NEG_REMC: "Data quality",
  ZERO_DENOM: "Data quality", MISSING_INPUT: "Data quality", BOND_CONFLICT: "Bond", CONTRACT_RECON: "Data quality",
};

export function lossHit(r: Row, m: Metrics, t: Thresholds, basis: LossBasis = t.lossBasis) {
  if (basis === "legacy") return /projected loss/i.test(r.legacyExc || "");
  if (basis === "itd") return m.itdGP !== null && m.itdGP < -t.lossThreshold;
  return m.fcGP !== null && m.fcGP < -t.lossThreshold;
}
export function lossAmount(m: Metrics, basis: LossBasis) {
  return basis === "forecast" ? m.fcGP : m.itdGP; // legacy ranking displayed ITD GP (R − A)
}

export function exceptions(r: Row, m: Metrics, t: Thresholds): ExcCat[] {
  const out: ExcCat[] = [];
  if (lossHit(r, m, t)) out.push("LOSS");
  if (m.ob !== null && m.ob < -t.underThreshold) out.push("UNDER");
  if (r.bondStatus === "Needs Review") out.push("BOND");
  if (m.eacBelowActual) out.push("EAC_LT_ACTUAL");
  if (m.negRemC) out.push("NEG_REMC");
  if (m.remGM === null && m.remGP !== null && Math.abs(m.remGP) >= 1) out.push("ZERO_DENOM");
  if (m.missing.length) out.push("MISSING_INPUT");
  if ((r.bondStatus === "Bonded") && (r.bondScore === 0 || r.bondScore === null) && /no high-confidence|unmatched/i.test(r.bondMethod || "")) out.push("BOND_CONFLICT");
  if (m.reconDiff !== null && Math.abs(m.reconDiff) >= 1 && r.orig !== null) out.push("CONTRACT_RECON");
  return out;
}

/* ---------- aggregation ---------- */
export type Totals = {
  count: number; C: number; R: number; E: number; A: number; B: number;
  remC: number; remCost: number; itdGP: number; remGP: number; remGM: number | null;
  under: number; over: number; net: number; fcGP: number;
};
export function totals(rows: Row[]): Totals {
  const t = { count: rows.length, C: 0, R: 0, E: 0, A: 0, B: 0, remC: 0, remCost: 0, itdGP: 0, remGP: 0, under: 0, over: 0, net: 0, fcGP: 0 };
  for (const r of rows) {
    const m = metrics(r);
    t.C += r.C || 0; t.R += r.R || 0; t.E += r.E || 0; t.A += r.A || 0; t.B += r.B || 0;
    t.remC += m.remC || 0; t.remCost += m.remCost || 0; t.itdGP += m.itdGP || 0; t.remGP += m.remGP || 0;
    t.under += m.under || 0; t.over += m.over || 0; t.net += m.ob || 0; t.fcGP += m.fcGP || 0;
  }
  return { ...t, remGM: Math.abs(t.remC) < 0.01 ? null : t.remGP / t.remC };
}

export function groupBy<T>(xs: T[], f: (x: T) => string) {
  const m = new Map<string, T[]>();
  for (const x of xs) { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); }
  return m;
}

/* ---------- forecast engine (assumption model) ---------- */
export type Curve = "straight" | "front" | "back";
export type FcAssumptions = {
  horizon: number; // months
  buMonths: Record<string, number>; // default remaining duration by business unit
  smallRemaining: number; smallMonths: number; // projects with small remaining contract finish sooner
  curve: Curve;
  includeJV: boolean;
  targetMonthly: number | null; gapPct: number;
};
export const DEFAULT_FC: FcAssumptions = {
  horizon: 36,
  buMonths: { Civil: 14, Environmental: 12, "Vertical & Structures": 16, "Electrical & Mechanical": 12 },
  smallRemaining: 1000000, smallMonths: 4, curve: "straight", includeJV: false, targetMonthly: null, gapPct: 0.85,
};
export type FcOverride = { key: string; months: number | null; startOffset: number | null; curve: Curve | null; note: string | null };
export const fcKey = (r: Pick<Row, "entity" | "projectId" | "sourceRow">) => `${r.entity}|${r.projectId}|${r.sourceRow ?? ""}`;

export function monthsBetween(asOf: string, end: string) {
  const a = new Date(asOf + "T00:00:00Z"), b = new Date(end + "T00:00:00Z");
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}
function weights(k: number, curve: Curve) {
  const w: number[] = [];
  for (let i = 0; i < k; i++) w.push(curve === "straight" ? 1 : curve === "front" ? k - i : i + 1);
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}
export type Phase = { months: number; start: number; curve: Curve; basis: "schedule date" | "project override" | "small-project rule" | "business-unit default" };
export function phaseFor(r: Row, a: FcAssumptions, ov: FcOverride | undefined, asOf: string): Phase {
  const m = metrics(r);
  const curve = ov?.curve || a.curve;
  const start = Math.max(0, ov?.startOffset ?? 0);
  if (ov?.months) return { months: Math.max(1, ov.months), start, curve, basis: "project override" };
  if (r.endDate) { const k = monthsBetween(asOf, r.endDate); if (k >= 1) return { months: k, start, curve, basis: "schedule date" }; }
  if ((m.remC || 0) < a.smallRemaining) return { months: a.smallMonths, start, curve, basis: "small-project rule" };
  return { months: a.buMonths[r.bu] || 12, start, curve, basis: "business-unit default" };
}
export type FcRowOut = { row: Row; phase: Phase; rev: number[]; cost: number[] };
export function forecastRows(rows: Row[], a: FcAssumptions, ovs: Map<string, FcOverride>, asOf: string): FcRowOut[] {
  const H = a.horizon;
  return rows.map((r) => {
    const m = metrics(r);
    const p = phaseFor(r, a, ovs.get(fcKey(r)), asOf);
    const w = weights(p.months, p.curve);
    const rev = new Array(H).fill(0), cost = new Array(H).fill(0);
    const rc = Math.max(m.remC || 0, 0), cc = Math.max(m.remCost || 0, 0);
    w.forEach((x, i) => { const k = p.start + i; if (k < H) { rev[k] += rc * x; cost[k] += cc * x; } else { rev[H - 1] += 0; } });
    return { row: r, phase: p, rev, cost };
  });
}
export function monthLabels(asOf: string, H: number) {
  const d = new Date(asOf + "T00:00:00Z");
  const out: string[] = [];
  for (let i = 1; i <= H; i++) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1)); out.push(x.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })); }
  return out;
}

/* ---------- cash timing model (assumption model, not a bank forecast) ---------- */
export type CashAssumptions = { billLag: number; collectLag: number; retentionPct: number; payLag: number; openingCash: number | null; underRecoveryMonths: number; overUnwindMonths: number };
export const DEFAULT_CASH: CashAssumptions = { billLag: 1, collectLag: 1, retentionPct: 0.05, payLag: 1, openingCash: null, underRecoveryMonths: 3, overUnwindMonths: 3 };
export function cashModel(fc: FcRowOut[], c: CashAssumptions, H: number) {
  const receipts = new Array(H).fill(0), disb = new Array(H).fill(0), retRelease = new Array(H).fill(0), billPos = new Array(H).fill(0);
  let under = 0, over = 0;
  for (const f of fc) {
    const m = metrics(f.row);
    under += m.under || 0; over += m.over || 0;
    let last = -1;
    f.rev.forEach((v, i) => {
      if (v > 0) last = i;
      const k = i + c.billLag + c.collectLag;
      if (k < H) receipts[k] += v * (1 - c.retentionPct);
    });
    const retained = f.rev.reduce((a, b) => a + b, 0) * c.retentionPct;
    const rk = last + c.billLag + c.collectLag + 2;
    if (last >= 0 && rk < H) retRelease[rk] += retained;
    f.cost.forEach((v, i) => { const k = i + c.payLag; if (k < H) disb[k] += v; });
  }
  for (let i = 0; i < H; i++) {
    if (i < c.underRecoveryMonths) billPos[i] += under / Math.max(1, c.underRecoveryMonths);
    if (i < c.overUnwindMonths) billPos[i] -= over / Math.max(1, c.overUnwindMonths);
  }
  const open = c.openingCash ?? 0;
  const net: number[] = [], cum: number[] = [];
  let run = open;
  for (let i = 0; i < H; i++) { const x = receipts[i] + retRelease[i] + billPos[i] - disb[i]; net.push(x); run += x; cum.push(run); }
  return { receipts, retRelease, billPos, disb, net, cum, under, over, open };
}

/* ---------- formatting helpers (shared so exports match the UI) ---------- */
export const fmtUSD = (v: number | null | undefined, d = 0) => v === null || v === undefined || Number.isNaN(v) ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d });
export function fmtM(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(d)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
}
export const fmtPct = (v: number | null | undefined, d = 1) => v === null || v === undefined || Number.isNaN(v) ? "N/A" : `${(v * 100).toFixed(d)}%`;
