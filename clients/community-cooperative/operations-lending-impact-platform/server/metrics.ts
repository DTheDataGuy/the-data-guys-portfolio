// Metric engine. Every metric is computed server-side from approved records only,
// with explicit grain, denominator, exclusions and verification status.
import type { MetricResult, MetricStatus } from "@shared/schema";
import { loanSizeBucket, LOAN_SIZE_BUCKETS } from "@shared/contracts";

type Row = Record<string, any>;
export interface Filters {
  year?: string;
  month?: string; // YYYY-MM
  program?: string;
  county?: string;
  fund?: string;
  risk?: string;
  participantCategory?: string;
}
export interface Rules {
  loanStatusMappingApproved: boolean;
  txnStatusMatrixApproved: boolean;
  delinquencyRulesApproved: boolean;
  smallCellThreshold: number;
  smallCellPolicyApproved: boolean;
  externalReleaseApproved: boolean;
  nedAdapterEnabled: boolean;
  reversalRuleVersion: string;
}
export const DEFAULT_RULES: Rules = {
  loanStatusMappingApproved: false,
  txnStatusMatrixApproved: false,
  delinquencyRulesApproved: false,
  smallCellThreshold: 11,
  smallCellPolicyApproved: false,
  externalReleaseApproved: false,
  nedAdapterEnabled: false,
  reversalRuleVersion: "v0.1 (proposed)",
};

export const cents = (v: any) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) : 0);
export const fromCents = (c: number) => c / 100;
const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

// ─────────── period helpers ───────────
export function periodRange(f: Filters): { start: string; end: string; label: string } | null {
  if (f.month) {
    const [y, m] = f.month.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { start: `${f.month}-01`, end: `${f.month}-${String(last).padStart(2, "0")}`, label: new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) };
  }
  if (f.year) return { start: `${f.year}-01-01`, end: `${f.year}-12-31`, label: `Calendar ${f.year}` };
  return null;
}
export const inRange = (d: any, r: { start: string; end: string } | null) => !r || (typeof d === "string" && d >= r.start && d <= r.end);
const monthOf = (d: any) => (typeof d === "string" ? d.slice(0, 7) : null);

export function mk(base: Partial<MetricResult> & Pick<MetricResult, "id" | "label" | "unit" | "definition" | "source">, demo: boolean): MetricResult {
  const status: MetricStatus = base.value === null || base.value === undefined ? "unavailable" : demo && base.status !== "not_applicable" && base.status !== "unavailable" ? "demo" : base.status ?? "verified";
  return { period: "All approved data", ...base, value: base.value ?? null, status } as MetricResult;
}

// ─────────── LENDING ───────────
export interface LendingInputs {
  loans: Row[];
  txns: Row[];
  snapshots: Row[];
  pipeline: Row[];
  stages: Row[];
  industry: Row[];
  crosswalk: Row[];
}

/** Map a source account (LoanWell or NED) to the canonical loan, honoring the migration crosswalk. */
export function buildLoanIndex(loans: Row[], crosswalk: Row[]) {
  const byAccount = new Map<string, Row>();
  const byId = new Map<string, Row>();
  for (const l of loans) {
    byAccount.set(`${l.Source_System}|${l.Source_Account_Number}`, l);
    byAccount.set(`*|${l.Source_Account_Number}`, l);
    byId.set(l.Loan_ID, l);
  }
  for (const c of crosswalk) {
    const l = byId.get(c.Canonical_Loan_ID);
    if (!l) continue;
    if (c.LoanWell_Account) byAccount.set(`LoanWell|${c.LoanWell_Account}`, l);
    if (c.NED_Account) byAccount.set(`NED|${c.NED_Account}`, l);
  }
  const authority = new Map<string, Row>(crosswalk.map((c) => [c.Canonical_Loan_ID, c]));
  return {
    resolve: (account: string, system?: string) => byAccount.get(`${system ?? "*"}|${account}`) ?? byAccount.get(`*|${account}`),
    byId,
    authority,
  };
}

/** Select the approved snapshot slice at the chosen as-of date — one row per canonical loan, one monetary authority. */
export function snapshotSlice(inp: LendingInputs, asOf?: string) {
  const idx = buildLoanIndex(inp.loans, inp.crosswalk);
  const dates = Array.from(new Set(inp.snapshots.map((s) => s.As_Of_Date))).filter(Boolean).sort();
  const eligible = asOf ? dates.filter((d) => d <= asOf) : dates;
  const date = eligible[eligible.length - 1];
  if (!date) return { date: null as string | null, rows: [] as { loan: Row | undefined; snap: Row }[], unmatched: 0, dropped: 0 };
  const chosen = new Map<string, { loan: Row | undefined; snap: Row }>();
  let unmatched = 0;
  let dropped = 0;
  for (const s of inp.snapshots.filter((x) => x.As_Of_Date === date)) {
    const loan = idx.resolve(s.Source_Account_Number, s.Source_System);
    if (!loan) {
      unmatched++;
      continue;
    }
    const cw = idx.authority.get(loan.Loan_ID);
    let authority = loan.Source_System;
    if (cw) authority = cw.Authority === "NED" && (!cw.Cutover_Date || cw.Cutover_Date <= date) ? "NED" : "LoanWell";
    if (s.Source_System !== authority) {
      dropped++; // non-authoritative duplicate for a migrated loan — never added
      continue;
    }
    chosen.set(loan.Loan_ID, { loan, snap: s });
  }
  return { date, rows: Array.from(chosen.values()), unmatched, dropped };
}

export function portfolioPrincipal(inp: LendingInputs, asOf?: string) {
  if (!inp.loans.length) return { value: null as number | null, n: 0, date: null as string | null, reason: "No status-bearing loan dimension approved. Active cannot be inferred from balance > 0." };
  const sl = snapshotSlice(inp, asOf);
  if (!sl.date) return { value: null, n: 0, date: null, reason: "No approved outstanding-principal snapshot" };
  let c = 0;
  let n = 0;
  let excludedPositive = 0;
  for (const r of sl.rows) {
    if (r.loan?.Loan_Status === "Active") {
      c += cents(r.snap.Outstanding_Principal);
      n++;
    } else if (num(r.snap.Outstanding_Principal) > 0) excludedPositive++;
  }
  return { value: fromCents(c), n, date: sl.date, unmatched: sl.unmatched, dropped: sl.dropped, excludedPositive };
}

export function activeLoanCount(inp: LendingInputs, asOf?: string) {
  const p = portfolioPrincipal(inp, asOf);
  return p.value === null ? null : p.n;
}

const isCompleted = (t: Row) => String(t.Transaction_Status).toLowerCase() === "completed";

export function fundedLoans(inp: LendingInputs, range: { start: string; end: string } | null) {
  const idx = buildLoanIndex(inp.loans, inp.crosswalk);
  const loans = new Set<string>();
  let draws = 0;
  let c = 0;
  let quarantined = 0;
  let unmatched = 0;
  for (const t of inp.txns) {
    if (t.Transaction_Type !== "disbursement" || !inRange(t.Transaction_Date, range)) continue;
    if (!isCompleted(t)) {
      quarantined++;
      continue;
    }
    if (!num(t.Disbursement_Amount)) continue;
    const loan = idx.resolve(t.Source_Account_Number);
    const id = loan?.Loan_ID ?? `unmatched:${t.Source_Account_Number}`;
    if (!loan) unmatched++;
    loans.add(id);
    draws++;
    c += cents(t.Disbursement_Amount);
  }
  return { fundedLoanCount: loans.size, disbursementCount: draws, disbursementAmount: fromCents(c), quarantined, unmatched };
}

export function payments(inp: LendingInputs, range: { start: string; end: string } | null) {
  const byId = new Map<string, Row>();
  for (const t of inp.txns) if (t.Source_Transaction_ID) byId.set(String(t.Source_Transaction_ID), t);
  const tot = { principal: 0, interest: 0, fees: 0, total: 0 };
  let counted = 0,
    excluded = 0,
    reversalsApplied = 0,
    reversalsQuarantined = 0;
  const reversed = new Set<string>();
  for (const t of inp.txns) {
    if (!inRange(t.Transaction_Date, range)) continue;
    if (t.Transaction_Type === "payment") {
      if (!isCompleted(t)) {
        excluded++;
        continue;
      }
      tot.principal += cents(t.Principal_Paid);
      tot.interest += cents(t.Interest_Paid);
      tot.fees += cents(t.Fees_Paid);
      tot.total += cents(t.Total_Payment_Amount);
      counted++;
    } else if (t.Transaction_Type === "payment_reversal") {
      const target = t.Reversal_Of ? byId.get(String(t.Reversal_Of)) : undefined;
      if (!isCompleted(t) || !target) {
        reversalsQuarantined++;
        continue;
      }
      if (!isCompleted(target)) {
        // reversal of a failed payment: the payment was never counted, so nothing to net (no fictitious cash)
        reversalsQuarantined++;
        continue;
      }
      if (reversed.has(String(t.Reversal_Of))) {
        reversalsQuarantined++;
        continue; // a payment can only be reversed once
      }
      reversed.add(String(t.Reversal_Of));
      tot.principal -= cents(target.Principal_Paid);
      tot.interest -= cents(target.Interest_Paid);
      tot.fees -= cents(target.Fees_Paid);
      tot.total -= cents(target.Total_Payment_Amount);
      reversalsApplied++;
    }
  }
  return { principal: fromCents(tot.principal), interest: fromCents(tot.interest), fees: fromCents(tot.fees), total: fromCents(tot.total), counted, excluded, reversalsApplied, reversalsQuarantined };
}

export function processingTime(inp: LendingInputs, range: { start: string; end: string } | null) {
  const idx = buildLoanIndex(inp.loans, inp.crosswalk);
  const first = new Map<string, string>();
  for (const t of inp.txns) {
    if (t.Transaction_Type !== "disbursement" || !isCompleted(t) || !num(t.Disbursement_Amount)) continue;
    const loan = idx.resolve(t.Source_Account_Number);
    if (!loan) continue;
    const prev = first.get(loan.Loan_ID);
    if (!prev || t.Transaction_Date < prev) first.set(loan.Loan_ID, t.Transaction_Date);
  }
  const days: number[] = [];
  let excluded = 0;
  for (const [id, d] of Array.from(first.entries())) {
    if (!inRange(d, range)) continue; // cohort = loans first funded in period
    const loan = idx.byId.get(id)!;
    if (!loan.Application_Date) {
      excluded++;
      continue;
    }
    const diff = (Date.parse(d) - Date.parse(loan.Application_Date)) / 86400000;
    if (!Number.isFinite(diff) || diff < 0) {
      excluded++;
      continue;
    }
    days.push(diff);
  }
  if (!days.length) return { mean: null as number | null, median: null as number | null, n: 0, excluded };
  const s = [...days].sort((a, b) => a - b);
  const median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { mean: Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10, median, n: days.length, excluded };
}

export function dispositions(loans: Row[]) {
  const out = { repaid: 0, chargedOff: 0, cancelled: 0, otherClosed: 0, active: 0, unknown: 0 };
  for (const l of loans) {
    if (l.Loan_Status === "Active") out.active++;
    else if (l.Loan_Status === "Paid off" || l.Disposition === "Repaid") out.repaid++;
    else if (l.Loan_Status === "Charged off" || l.Disposition === "Written off") out.chargedOff++;
    else if (l.Loan_Status === "Cancelled") out.cancelled++;
    else if (l.Loan_Status === "Unknown" || !l.Loan_Status) out.unknown++;
    else out.otherClosed++;
  }
  return out;
}

export function delinquency(inp: LendingInputs, asOf?: string) {
  const sl = snapshotSlice(inp, asOf);
  const active = sl.rows.filter((r) => r.loan?.Loan_Status === "Active");
  if (!active.length) return null;
  const del = active.filter((r) => num(r.snap.Days_Delinquent) > 0);
  const revenueBased = del.filter((r) => r.loan?.Repayment_Type === "Revenue-based").length;
  return {
    rate: del.length / active.length,
    delinquentLoans: del.length,
    activeLoans: active.length,
    delinquentPrincipal: fromCents(del.reduce((a, r) => a + cents(r.snap.Outstanding_Principal), 0)),
    overdueAmount: fromCents(del.reduce((a, r) => a + cents(r.snap.Amount_Past_Due), 0)),
    revenueBasedFlagged: revenueBased,
    date: sl.date,
  };
}

export function loanSizeDistribution(loans: Row[]) {
  const m = new Map<string, { bucket: string; loans: number; amount: number }>(LOAN_SIZE_BUCKETS.map((b) => [b, { bucket: b, loans: 0, amount: 0 }]));
  for (const l of loans) {
    if (l.Loan_Status === "Pending" || l.Loan_Status === "Cancelled") continue;
    const b = loanSizeBucket(l.Original_Amount);
    const e = m.get(b)!;
    e.loans++;
    e.amount += cents(l.Original_Amount);
  }
  return Array.from(m.values()).map((e) => ({ ...e, amount: fromCents(e.amount) }));
}

export function stageDistribution(pipeline: Row[]) {
  const dates = Array.from(new Set(pipeline.map((p) => p.Snapshot_Date))).sort();
  const d = dates[dates.length - 1];
  if (!d) return { date: null as string | null, stages: [] as any[] };
  return {
    date: d,
    stages: pipeline
      .filter((p) => p.Snapshot_Date === d)
      .sort((a, b) => num(a.Stage_Order) - num(b.Stage_Order))
      .map((p) => ({ stage: p.Stage, count: num(p.Application_Count), amount: num(p.Requested_Amount) })),
  };
}

export function stageConversion(stages: Row[], order: string[]) {
  if (!stages.length) return null;
  const reached = new Map<string, Set<string>>();
  for (const s of stages) {
    if (!reached.has(s.Stage)) reached.set(s.Stage, new Set());
    reached.get(s.Stage)!.add(s.Application_ID);
  }
  const out: { from: string; to: string; eligible: number; converted: number; rate: number | null }[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    const a = reached.get(order[i]) ?? new Set();
    const b = reached.get(order[i + 1]) ?? new Set();
    const conv = Array.from(a).filter((x) => b.has(x)).length;
    out.push({ from: order[i], to: order[i + 1], eligible: a.size, converted: conv, rate: a.size ? conv / a.size : null });
  }
  return out;
}

export function industryConcentration(inp: LendingInputs, asOf?: string) {
  const sl = snapshotSlice(inp, asOf);
  const latest = new Map<string, Row>();
  for (const m of inp.industry) {
    if (asOf && m.As_Of > asOf) continue;
    const p = latest.get(m.Loan_ID);
    if (!p || m.As_Of > p.As_Of) latest.set(m.Loan_ID, m);
  }
  const agg = new Map<string, { industry: string; loans: number; principal: number; reviewed: number }>();
  for (const r of sl.rows) {
    if (r.loan?.Loan_Status !== "Active") continue;
    const m = latest.get(r.loan.Loan_ID);
    const label = m && m.Review_Status === "Reviewed" ? m.Industry_Label : m?.Review_Status === "Needs review" ? `${m.Industry_Label} (needs review)` : "Unknown";
    const e = agg.get(label) ?? { industry: label, loans: 0, principal: 0, reviewed: 0 };
    e.loans++;
    e.principal += cents(r.snap.Outstanding_Principal);
    if (m?.Review_Status === "Reviewed") e.reviewed++;
    agg.set(label, e);
  }
  return Array.from(agg.values())
    .map((e) => ({ ...e, principal: fromCents(e.principal) }))
    .sort((a, b) => b.principal - a.principal);
}

export function portfolioTrend(inp: LendingInputs) {
  const dates = Array.from(new Set(inp.snapshots.map((s) => s.As_Of_Date))).filter(Boolean).sort();
  return dates.map((d) => {
    const p = portfolioPrincipal(inp, d);
    return { date: d, principal: p.value, activeLoans: p.n };
  });
}

export function disbursementTrend(inp: LendingInputs) {
  const m = new Map<string, { month: string; amount: number; draws: number }>();
  for (const t of inp.txns) {
    if (t.Transaction_Type !== "disbursement" || !isCompleted(t)) continue;
    const k = monthOf(t.Transaction_Date)!;
    const e = m.get(k) ?? { month: k, amount: 0, draws: 0 };
    e.amount += cents(t.Disbursement_Amount);
    e.draws++;
    m.set(k, e);
  }
  return Array.from(m.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((e) => ({ ...e, amount: fromCents(e.amount) }));
}

export function txnForensics(txns: Row[]) {
  const m = new Map<string, number>();
  for (const t of txns) m.set(`${t.Transaction_Type}|${t.Transaction_Status}`, (m.get(`${t.Transaction_Type}|${t.Transaction_Status}`) || 0) + 1);
  return Array.from(m.entries()).map(([k, n]) => ({ type: k.split("|")[0], status: k.split("|")[1], rows: n }));
}

// ─────────── IMPACT ───────────
export interface ImpactInputs {
  programs: Row[];
  geos: Row[];
  groups: Row[];
  allocations: Row[];
  disbursements: Row[];
  legacyFunds: Row[];
  services: Row[];
  events: Row[];
  outcomes: Row[];
  metricDefs: Row[];
}

/** Allocation counted once; linked disbursements subtracted once. Legacy combined rows grouped by Allocation_ID. */
export function fundsSummary(inp: ImpactInputs, asOf?: string) {
  const allocs = new Map<string, { id: string; program: string; geo: string | null; allocated: number; disbursed: number; date: string }>();
  for (const a of inp.allocations) {
    if (asOf && a.Date > asOf) continue;
    allocs.set(a.Allocation_ID, { id: a.Allocation_ID, program: a.Program_ID, geo: a.Geography_ID, allocated: cents(a.Amount_Allocated), disbursed: 0, date: a.Date });
  }
  for (const d of inp.disbursements) {
    if (asOf && d.Date > asOf) continue;
    if (d.Status === "Pending") continue;
    const a = allocs.get(d.Allocation_ID);
    if (!a) continue;
    const sign = d.Adjustment_Type === "Return" ? -1 : 1;
    a.disbursed += sign * Math.abs(cents(d.Amount_Disbursed)) * (d.Status === "Reversed" ? 0 : 1);
  }
  // legacy compatibility rows
  const legacy = new Map<string, Row[]>();
  for (const r of inp.legacyFunds) {
    if (asOf && r.Date > asOf) continue;
    if (!legacy.has(r.Allocation_ID)) legacy.set(r.Allocation_ID, []);
    legacy.get(r.Allocation_ID)!.push(r);
  }
  for (const [id, rows] of Array.from(legacy.entries())) {
    if (allocs.has(id)) continue;
    const alloc = Math.max(...rows.map((r) => cents(r.Amount_Allocated)));
    allocs.set(id, { id, program: rows[0].Program_ID, geo: rows[0].Geography_ID, allocated: alloc, disbursed: rows.reduce((a, r) => a + cents(r.Amount_Disbursed), 0), date: rows.map((r) => r.Date).sort()[0] });
  }
  const list = Array.from(allocs.values());
  const allocated = list.reduce((a, x) => a + x.allocated, 0);
  const disbursed = list.reduce((a, x) => a + x.disbursed, 0);
  return { allocations: list.map((x) => ({ ...x, allocated: fromCents(x.allocated), disbursed: fromCents(x.disbursed), remaining: fromCents(x.allocated - x.disbursed) })), allocated: fromCents(allocated), disbursed: fromCents(disbursed), remaining: fromCents(allocated - disbursed) };
}

export function distinctCount(rows: Row[], field: string) {
  const s = new Set(rows.map((r) => r[field]).filter((v) => v !== null && v !== undefined && v !== ""));
  return s.size;
}

// ─────────── small-cell suppression ───────────
export function suppress(n: number, threshold: number) {
  return n > 0 && n < threshold ? { value: null, display: `<${threshold}`, suppressed: true } : { value: n, display: String(n), suppressed: false };
}
