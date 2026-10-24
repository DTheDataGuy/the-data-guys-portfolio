import type { Store, Ctx } from "./storage";
import type { MetricResult } from "@shared/schema";
import { DATASET_MAP, DATASETS, TXN_STATUS_MATRIX } from "@shared/contracts";
import * as M from "./metrics";
import type { Filters, Rules } from "./metrics";

type Row = Record<string, any>;

export function getRules(store: Store): Rules {
  return { ...M.DEFAULT_RULES, ...store.getSetting<Partial<Rules>>("rules", {}) };
}

function freshness(store: Store, ctx: Ctx, datasets: string[]) {
  const li = store.lastImports(ctx.demo);
  const seeded = store.getSetting<string | null>("demo_seeded_at", null);
  const counts = Object.fromEntries(store.datasetCounts(ctx.demo).map((c) => [c.dataset, c]));
  return datasets.map((d) => {
    const x = li[d];
    const c = counts[d];
    return {
      dataset: d,
      label: DATASET_MAP[d]?.label ?? d,
      approvedRows: c?.n ?? 0,
      lastSuccessfulImport: x?.lastSuccess ?? (ctx.demo && c ? seeded : c?.last ?? null),
      lastAttempt: x?.lastAttempt ?? null,
      lastStatus: x?.lastStatus ?? null,
      failure: x?.failure ?? null,
      failedBatchId: x?.lastStatus === "failed" ? x.batchId : null,
    };
  });
}
const lastOf = (fr: ReturnType<typeof freshness>, d: string) => fr.find((x) => x.dataset === d)?.lastSuccessfulImport ?? null;

function applied(f: Filters) {
  return Object.entries(f)
    .filter(([, v]) => v)
    .map(([k]) => k);
}
function inapplicable(f: Filters, allowed: (keyof Filters)[]) {
  return applied(f).filter((k) => !allowed.includes(k as keyof Filters));
}

const FILTER_LABEL: Record<string, string> = { year: "Year", month: "Month", program: "Program", county: "County", fund: "Funding source", risk: "Risk", participantCategory: "Participant category" };
const labelFilters = (xs: string[]) => xs.map((x) => FILTER_LABEL[x] ?? x);

// ═════════════════ LENDING ═════════════════
export function lendingInputs(store: Store, ctx: Ctx, f: Filters) {
  const all: M.LendingInputs = {
    loans: store.rows("loan", ctx.demo),
    txns: store.rows("loan_transaction", ctx.demo),
    snapshots: store.rows("loan_snapshot", ctx.demo),
    pipeline: store.rows("pipeline_snapshot", ctx.demo),
    stages: store.rows("stage_history", ctx.demo),
    industry: store.rows("industry_mapping", ctx.demo),
    crosswalk: store.rows("ned_crosswalk", ctx.demo),
  };
  if (!f.fund && !f.risk && !f.county) return all;
  const loans = all.loans.filter((l) => (!f.fund || l.Funding_Source === f.fund || l.Subfund === f.fund) && (!f.risk || l.Risk_Raw === f.risk || String(l.Risk_Rating) === f.risk) && (!f.county || l.County === f.county));
  const ids = new Set(loans.map((l) => l.Loan_ID));
  const idx = M.buildLoanIndex(all.loans, all.crosswalk);
  const keep = (acct: string, sys?: string) => {
    const l = idx.resolve(acct, sys);
    return !!l && ids.has(l.Loan_ID);
  };
  return {
    ...all,
    loans,
    txns: all.txns.filter((t) => keep(t.Source_Account_Number)),
    snapshots: all.snapshots.filter((s) => keep(s.Source_Account_Number, s.Source_System)),
    industry: all.industry.filter((m) => ids.has(m.Loan_ID)),
  };
}

export function lendingDashboard(store: Store, ctx: Ctx, f: Filters) {
  const rules = getRules(store);
  const inp = lendingInputs(store, ctx, f);
  const range = M.periodRange(f);
  const asOf = range?.end;
  const fr = freshness(store, ctx, ["loan", "loan_transaction", "loan_snapshot", "pipeline_snapshot", "stage_history", "industry_mapping", "ned_crosswalk"]);
  const dims = labelFilters(inapplicable(f, ["year", "month", "fund", "risk", "county"]));
  const period = range?.label ?? "All approved periods";
  const pp = M.portfolioPrincipal(inp, asOf);
  const fl = M.fundedLoans(inp, range);
  const pay = M.payments(inp, range);
  const pt = M.processingTime(inp, range);
  const disp = M.dispositions(inp.loans);
  const del = M.delinquency(inp, asOf);
  const sd = M.stageDistribution(inp.pipeline);
  const order = ["Application", "Underwriting", "Application Decision", "Completed"];
  const conv = M.stageConversion(inp.stages, order);
  const statusPending = !rules.loanStatusMappingApproved;
  const matrixPending = !rules.txnStatusMatrixApproved;
  const kpis: MetricResult[] = [
    M.mk(
      {
        id: "portfolio_principal",
        label: "Current portfolio principal",
        value: pp.value,
        unit: "money",
        status: statusPending ? "provisional" : "verified",
        reason: pp.value === null ? (pp as any).reason : statusPending ? "Loan status mapping not yet approved by lending" : undefined,
        definition: "Sum of Outstanding Principal for loans with verified Active status in the selected approved snapshot. Interest and fees excluded. Snapshots are never summed across dates.",
        source: "Outstanding Principal Balance Report + loan status dimension (LoanWell / NED by crosswalk authority)",
        period: pp.date ? `As of ${pp.date}` : "No snapshot",
        denominator: "—",
        exclusions: `${(pp as any).excludedPositive ?? 0} non-Active loans with positive balance excluded; ${(pp as any).dropped ?? 0} non-authoritative migration rows ignored; ${(pp as any).unmatched ?? 0} unmatched snapshot rows`,
        n: pp.n,
        lastImport: lastOf(fr, "loan_snapshot"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
    M.mk(
      {
        id: "active_loans",
        label: "Active loans",
        value: pp.value === null ? null : pp.n,
        unit: "count",
        status: statusPending ? "provisional" : "verified",
        reason: pp.value === null ? (pp as any).reason : statusPending ? "Loan status mapping not yet approved" : undefined,
        definition: "Distinct canonical loans with verified Active status at the selected as-of date.",
        source: "Loan dimension + snapshot",
        period: pp.date ? `As of ${pp.date}` : "No snapshot",
        lastImport: lastOf(fr, "loan"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
    M.mk(
      {
        id: "funded_loans",
        label: "Funded loans",
        value: inp.txns.length ? fl.fundedLoanCount : null,
        unit: "count",
        status: matrixPending ? "provisional" : "verified",
        reason: !inp.txns.length ? "No approved Transaction Report with Status" : matrixPending ? "Transaction status matrix awaiting lending approval" : undefined,
        definition: "Distinct canonical loans with a completed, non-zero disbursement in the period. Multiple draws count once.",
        source: "LoanWell Transaction Report with Status",
        period,
        exclusions: `${fl.quarantined} failed/error/N/A disbursement rows quarantined`,
        secondary: `${fl.disbursementCount} disbursement transactions`,
        n: fl.disbursementCount,
        lastImport: lastOf(fr, "loan_transaction"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
    M.mk(
      {
        id: "disbursed",
        label: "Disbursed",
        value: inp.txns.length ? fl.disbursementAmount : null,
        unit: "money",
        status: matrixPending ? "provisional" : "verified",
        reason: !inp.txns.length ? "No approved transactions" : matrixPending ? "Transaction status matrix awaiting lending approval" : undefined,
        definition: "Sum of completed disbursement transactions in the period.",
        source: "LoanWell Transaction Report with Status",
        period,
        exclusions: `${fl.quarantined} non-completed disbursement rows excluded`,
        lastImport: lastOf(fr, "loan_transaction"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
    M.mk(
      {
        id: "payments_total",
        label: "Payments received (net)",
        value: inp.txns.length ? pay.total : null,
        unit: "money",
        status: matrixPending ? "provisional" : "verified",
        reason: !inp.txns.length ? "No approved transactions" : matrixPending ? `Reversal netting rule ${rules.reversalRuleVersion} not yet approved` : undefined,
        definition: "Completed payments in the period, less linked completed reversals (each applied once). Failed payments never count as cash.",
        source: "LoanWell Transaction Report with Status",
        period,
        secondary: `Principal $${pay.principal.toLocaleString()} · Interest $${pay.interest.toLocaleString()} · Fees $${pay.fees.toLocaleString()}`,
        exclusions: `${pay.excluded} failed/error payments excluded; ${pay.reversalsQuarantined} reversals quarantined (unlinked or of failed payments)`,
        n: pay.counted,
        lastImport: lastOf(fr, "loan_transaction"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
    M.mk(
      {
        id: "processing_time",
        label: "Avg processing time",
        value: pt.mean,
        unit: "days",
        status: "provisional",
        reason: pt.mean === null ? "No funded loans with validated application and disbursement dates" : "Created-date validation pending",
        definition: "Mean days from validated application/created date to first qualifying disbursement, one value per funded loan in the cohort (no closed-only filter).",
        source: "Loan dimension + Transaction Report",
        period: `Cohort first funded: ${period}`,
        n: pt.n,
        secondary: pt.median !== null ? `Median ${pt.median} days` : undefined,
        exclusions: `${pt.excluded} loans excluded for missing/invalid dates`,
        lastImport: lastOf(fr, "loan_transaction"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
    M.mk(
      {
        id: "delinquency_rate",
        label: "Delinquency rate",
        value: del ? del.rate * 100 : null,
        unit: "percent",
        status: rules.delinquencyRulesApproved ? "verified" : "provisional",
        reason: !del ? "No verified active population in snapshot" : rules.delinquencyRulesApproved ? undefined : "Schedule/status rules for revenue-based loans not approved — internal only",
        definition: "Verified delinquent Active loans ÷ the same verified Active population at the same as-of date.",
        source: "Snapshot Days Delinquent + loan status",
        period: del?.date ? `As of ${del.date}` : "—",
        denominator: del ? `${del.activeLoans} active loans` : undefined,
        secondary: del ? `${del.delinquentLoans} loans · delinquent principal $${del.delinquentPrincipal.toLocaleString()}` : undefined,
        exclusions: del ? `${del.revenueBasedFlagged} revenue-based loans flagged for schedule review` : undefined,
        lastImport: lastOf(fr, "loan_snapshot"),
        inapplicableFilters: dims,
      },
      ctx.demo,
    ),
  ];
  const pipelineTotal = sd.stages.reduce((a, s) => a + s.amount, 0);
  return {
    kpis,
    pipeline: {
      date: sd.date,
      stages: sd.stages,
      total: sd.date ? pipelineTotal : null,
      conversion: conv,
      conversionReason: conv ? null : "Stage history not supplied — conversion and time-in-stage disabled (stage distribution only).",
    },
    dispositions: disp,
    loanSize: M.loanSizeDistribution(inp.loans),
    industry: M.industryConcentration(inp, asOf),
    portfolioTrend: M.portfolioTrend(inp),
    disbursementTrend: M.disbursementTrend(inp),
    payments: pay,
    forensics: M.txnForensics(inp.txns),
    matrix: TXN_STATUS_MATRIX,
    geography: geographyLending(inp, asOf),
    funds: Array.from(new Set(store.rows("loan", ctx.demo).map((l) => l.Funding_Source).filter(Boolean))).sort(),
    risks: Array.from(new Set(store.rows("loan", ctx.demo).map((l) => l.Risk_Raw).filter(Boolean))).sort(),
    sourceMix: sourceMix(inp),
    freshness: fr,
    rules,
    appliedFilters: applied(f),
  };
}

function geographyLending(inp: M.LendingInputs, asOf?: string) {
  const sl = M.snapshotSlice(inp, asOf);
  const m = new Map<string, { county: string; loans: number; principal: number }>();
  for (const r of sl.rows) {
    if (r.loan?.Loan_Status !== "Active") continue;
    const k = r.loan.County || "Unknown";
    const e = m.get(k) ?? { county: k, loans: 0, principal: 0 };
    e.loans++;
    e.principal += M.cents(r.snap.Outstanding_Principal);
    m.set(k, e);
  }
  return Array.from(m.values()).map((e) => ({ ...e, principal: M.fromCents(e.principal) })).sort((a, b) => b.principal - a.principal);
}

function sourceMix(inp: M.LendingInputs) {
  const sl = M.snapshotSlice(inp);
  const out = { LoanWell: 0, NED: 0 };
  for (const r of sl.rows) out[r.snap.Source_System as "LoanWell" | "NED"]++;
  return { ...out, date: sl.date };
}

export function nedMigration(store: Store, ctx: Ctx) {
  const rules = getRules(store);
  const cw = store.rows("ned_crosswalk", ctx.demo);
  const rows = cw.map((c) => ({
    ...c,
    variance: c.Principal_NED !== null && c.Principal_LoanWell !== null ? Math.round((c.Principal_NED - c.Principal_LoanWell) * 100) / 100 : null,
  }));
  const status = (s: string) => rows.filter((r) => r.Match_Status === s).length;
  return {
    adapterEnabled: rules.nedAdapterEnabled,
    rows,
    summary: {
      total: rows.length,
      matched: status("Matched"),
      variance: status("Variance"),
      missingNED: status("Missing in NED"),
      missingLW: status("Missing in LoanWell"),
      pending: status("Pending"),
      signedOff: rows.filter((r) => r.Signed_Off_By).length,
      principalLW: rows.reduce((a, r) => a + M.cents(r.Principal_LoanWell), 0) / 100,
      principalNED: rows.reduce((a, r) => a + M.cents(r.Principal_NED), 0) / 100,
      authorityNED: rows.filter((r) => r.Authority === "NED").length,
    },
    checklist: [
      { step: "Read NED user manual and identify the export reports", owner: "The Data Guys", done: true },
      { step: "Obtain sample CSVs: Active Loan, Aging (Days Range), Payment History, Fund Transfers", owner: "Paige · Lending team · support@nedhelps.com", done: false },
      { step: "Build source-to-canonical crosswalk", owner: "Lending + data steward", done: rows.length > 0 },
      { step: "Confirm overlap window and cutover date", owner: "Director of Lending", done: rows.some((r) => r.Cutover_Date) },
      { step: "Compare loan counts and principal by loan", owner: "Lending + The Data Guys", done: rows.length > 0 && status("Pending") === 0 },
      { step: "Document exceptions and sign off", owner: "Director of Lending", done: rows.length > 0 && rows.every((r) => r.Signed_Off_By) },
      { step: "Enable NED adapter (manual import proven first)", owner: "Administrator", done: rules.nedAdapterEnabled },
    ],
  };
}

// ═════════════════ IMPACT ═════════════════
export function impactInputs(store: Store, ctx: Ctx): M.ImpactInputs {
  return {
    programs: store.rows("dim_program", ctx.demo),
    geos: store.rows("dim_geography", ctx.demo),
    groups: store.rows("dim_participant_group", ctx.demo),
    allocations: store.rows("fact_allocation", ctx.demo),
    disbursements: store.rows("fact_disbursement", ctx.demo),
    legacyFunds: store.rows("fact_funds_deployment", ctx.demo),
    services: store.rows("fact_service_delivery", ctx.demo),
    events: store.rows("fact_events", ctx.demo),
    outcomes: store.rows("outcome_observation", ctx.demo),
    metricDefs: store.rows("metric_definition", ctx.demo),
  };
}

export function impactDashboard(store: Store, ctx: Ctx, f: Filters) {
  const inp = impactInputs(store, ctx);
  const range = M.periodRange(f);
  const geoById = new Map(inp.geos.map((g) => [g.Geography_ID, g]));
  const progById = new Map(inp.programs.map((p) => [p.Program_ID, p]));
  const groupById = new Map(inp.groups.map((g) => [g.Participant_Group_ID, g]));
  const geoOk = (id: any) => !f.county || geoById.get(id)?.County === f.county;
  const progOk = (id: any) => !f.program || id === f.program;
  const fr = freshness(store, ctx, ["dim_program", "fact_allocation", "fact_disbursement", "fact_service_delivery", "fact_events", "outcome_observation", "fact_data_quality_notes"]);
  const period = range?.label ?? "All approved periods";

  // Funds (participant category not attributable → inapplicable)
  const filteredFundsInp = {
    ...inp,
    allocations: inp.allocations.filter((a) => progOk(a.Program_ID) && geoOk(a.Geography_ID)),
    legacyFunds: inp.legacyFunds.filter((a) => progOk(a.Program_ID) && geoOk(a.Geography_ID)),
  };
  const funds = M.fundsSummary(filteredFundsInp, range?.end);
  const disbInPeriod = inp.disbursements.filter((d) => inRangeD(d.Date, range) && filteredFundsInp.allocations.some((a) => a.Allocation_ID === d.Allocation_ID) && d.Status !== "Pending" && d.Status !== "Reversed");
  const disbPeriodSum = disbInPeriod.reduce((a, d) => a + (d.Adjustment_Type === "Return" ? -1 : 1) * Math.abs(M.cents(d.Amount_Disbursed)), 0) / 100;
  const allocInPeriod = filteredFundsInp.allocations.filter((a) => inRangeD(a.Date, range)).reduce((a, x) => a + M.cents(x.Amount_Allocated), 0) / 100;

  const services = inp.services.filter((s) => inRangeD(s.Date, range) && progOk(s.Program_ID) && geoOk(s.Geography_ID) && (!f.participantCategory || groupById.get(s.Participant_Group_ID)?.Participant_Category === f.participantCategory));
  const events = inp.events.filter((e) => inRangeD(e.Date, range) && progOk(e.Program_ID) && geoOk(e.Geography_ID));
  const hours = services.reduce((a, s) => a + (s.Service_Hours || 0), 0);
  const sessions = services.reduce((a, s) => a + (s.Session_Count || 0), 0);
  const attendance = events.filter((e) => e.Attendance_Basis === "Checked-in" || e.Attendance_Basis === "Headcount").reduce((a, e) => a + (e.Attendance || 0), 0);
  const regOnly = events.filter((e) => e.Attendance_Basis === "Registration only").reduce((a, e) => a + (e.Registrations || 0), 0);
  const activePrograms = new Set([...services.filter((s) => s.Session_Count > 0 || s.Service_Hours > 0).map((s) => s.Program_ID), ...events.filter((e) => (e.Attendance || 0) > 0).map((e) => e.Program_ID).filter(Boolean)]);
  const groupsServed = new Set(services.map((s) => s.Participant_Group_ID).filter(Boolean));
  const singleProgramParticipants = f.program ? services.filter((s) => s.Aggregation_Basis === "Aggregate" && s.Participant_Count != null) : [];
  const fundsDims = labelFilters(inapplicable(f, ["year", "month", "program", "county"]));
  const svcDims = labelFilters(inapplicable(f, ["year", "month", "program", "county", "participantCategory"]));
  const evDims = labelFilters(inapplicable(f, ["year", "month", "program", "county"]));
  const lastFunds = lastOf(fr, "fact_disbursement");
  const kpis: MetricResult[] = [
    M.mk({ id: "funds_disbursed", label: "Funds disbursed", value: inp.allocations.length || inp.legacyFunds.length ? (range ? disbPeriodSum : funds.disbursed) : null, unit: "money", definition: "Sum of approved disbursements linked to approved allocations; returns subtract; pending/reversed excluded.", source: "Fund allocations + disbursements", period, lastImport: lastFunds, inapplicableFilters: fundsDims, reason: inp.allocations.length ? undefined : "No approved allocations" }, ctx.demo),
    M.mk({ id: "funds_allocated", label: "Funds allocated", value: inp.allocations.length || inp.legacyFunds.length ? (range ? allocInPeriod : funds.allocated) : null, unit: "money", definition: "Each allocation counted once, never once per disbursement.", source: "Fund allocations", period, lastImport: lastOf(fr, "fact_allocation"), inapplicableFilters: fundsDims, reason: inp.allocations.length ? undefined : "No approved allocations" }, ctx.demo),
    M.mk({ id: "funds_remaining", label: "Remaining to deploy", value: inp.allocations.length || inp.legacyFunds.length ? funds.remaining : null, unit: "money", definition: "Approved allocation minus linked disbursements, as of the period end (or today).", source: "Calculated", period: `As of ${range?.end ?? "latest"}`, lastImport: lastFunds, inapplicableFilters: fundsDims, reason: inp.allocations.length ? undefined : "No approved allocations" }, ctx.demo),
    M.mk({ id: "service_hours", label: "Service hours", value: inp.services.length ? Math.round(hours * 10) / 10 : null, unit: "hours", definition: "Sum of approved Service_Hours.", source: "Service delivery", period, n: services.length, lastImport: lastOf(fr, "fact_service_delivery"), inapplicableFilters: svcDims, reason: inp.services.length ? undefined : "No approved service records" }, ctx.demo),
    M.mk({ id: "sessions", label: "Sessions delivered", value: inp.services.length ? sessions : null, unit: "count", definition: "Sum of Session_Count. Sessions are not people.", source: "Service delivery", period, lastImport: lastOf(fr, "fact_service_delivery"), inapplicableFilters: svcDims, reason: inp.services.length ? undefined : "No approved service records" }, ctx.demo),
    M.mk({ id: "attendance", label: "Event attendance (instances)", value: inp.events.length ? attendance : null, unit: "count", definition: "Checked-in or headcount attendance instances — not deduplicated people. Registration-only events reported separately.", source: "Events & occurrences", period, secondary: regOnly ? `${regOnly.toLocaleString()} registrations at registration-only events (not attendance)` : undefined, lastImport: lastOf(fr, "fact_events"), inapplicableFilters: evDims, reason: inp.events.length ? undefined : "No approved events" }, ctx.demo),
    M.mk({ id: "programs_active", label: "Programs with activity", value: inp.services.length || inp.events.length ? activePrograms.size : null, unit: "count", definition: "Distinct programs with approved sessions, hours or attendance in the period.", source: "Service delivery + events", period, lastImport: lastOf(fr, "fact_service_delivery"), reason: inp.services.length || inp.events.length ? undefined : "No activity records" }, ctx.demo),
    M.mk(
      {
        id: "participants",
        label: "Participants served",
        value: f.program && singleProgramParticipants.length ? singleProgramParticipants.reduce((a, s) => a + (s.Participant_Count || 0), 0) : null,
        unit: "count",
        status: "provisional",
        reason: f.program ? (singleProgramParticipants.length ? "Aggregate-only mode: summed reported counts; overlap across periods possible unless dedup method confirms uniqueness" : "No reported participant counts for this program") : "No unique-participant identifier in the template. Select one program to see its reported (aggregate-only) count.",
        definition: "Requires restricted deduplicated mode or aggregate-only reported counts with stated deduplication. Participant group counts are never people.",
        source: "Service delivery (Participant_Count)",
        period,
        secondary: `${groupsServed.size} participant groups (categories) — not people`,
      },
      ctx.demo,
    ),
  ];

  // Trends
  const months = new Map<string, any>();
  const bump = (m: string, k: string, v: number) => {
    if (!m) return;
    const e = months.get(m) ?? { month: m, allocated: 0, disbursed: 0, sessions: 0, hours: 0, attendance: 0 };
    e[k] += v;
    months.set(m, e);
  };
  filteredFundsInp.allocations.forEach((a) => bump(a.Date?.slice(0, 7), "allocated", a.Amount_Allocated || 0));
  inp.disbursements.filter((d) => filteredFundsInp.allocations.some((a) => a.Allocation_ID === d.Allocation_ID) && d.Status !== "Pending" && d.Status !== "Reversed").forEach((d) => bump(d.Date?.slice(0, 7), "disbursed", (d.Adjustment_Type === "Return" ? -1 : 1) * Math.abs(d.Amount_Disbursed || 0)));
  inp.services.filter((s) => progOk(s.Program_ID) && geoOk(s.Geography_ID)).forEach((s) => {
    bump(s.Date?.slice(0, 7), "sessions", s.Session_Count || 0);
    bump(s.Date?.slice(0, 7), "hours", s.Service_Hours || 0);
  });
  inp.events.filter((e) => progOk(e.Program_ID) && geoOk(e.Geography_ID) && e.Attendance_Basis !== "Registration only").forEach((e) => bump(e.Date?.slice(0, 7), "attendance", e.Attendance || 0));
  const trend = Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month)).map((e) => ({ ...e, allocated: Math.round(e.allocated), disbursed: Math.round(e.disbursed), hours: Math.round(e.hours * 10) / 10 }));

  // Program table
  const programTable = inp.programs.map((p) => {
    const al = funds.allocations.filter((a) => a.program === p.Program_ID);
    const sv = services.filter((s) => s.Program_ID === p.Program_ID);
    const ev = events.filter((e) => e.Program_ID === p.Program_ID);
    return {
      id: p.Program_ID,
      name: p.Program_Name,
      grant: p.Grant_Name,
      category: p.Program_Category,
      status: p.Status,
      cadence: p.Reporting_Cadence,
      allocated: al.reduce((a, x) => a + x.allocated, 0),
      disbursed: al.reduce((a, x) => a + x.disbursed, 0),
      remaining: al.reduce((a, x) => a + x.remaining, 0),
      sessions: sv.reduce((a, s) => a + (s.Session_Count || 0), 0),
      hours: Math.round(sv.reduce((a, s) => a + (s.Service_Hours || 0), 0) * 10) / 10,
      attendance: ev.filter((e) => e.Attendance_Basis !== "Registration only").reduce((a, e) => a + (e.Attendance || 0), 0),
    };
  });

  // Mix & geography
  const by = <T extends Row>(rows: T[], key: (r: T) => string, val: (r: T) => number) => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(key(r) || "Unknown", (m.get(key(r) || "Unknown") || 0) + val(r)));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 })).sort((a, b) => b.value - a.value);
  };
  const serviceMix = by(services, (s) => s.Service_Type, (s) => s.Session_Count || 0);
  const groupMix = by(services, (s) => groupById.get(s.Participant_Group_ID)?.Business_Type ?? groupById.get(s.Participant_Group_ID)?.Participant_Category ?? "Unattributed", (s) => s.Session_Count || 0);
  const industryMix = by(services, (s) => groupById.get(s.Participant_Group_ID)?.Industry_Label ?? "Unknown", (s) => s.Session_Count || 0);
  const geoAgg = new Map<string, { county: string; sessions: number; attendance: number; disbursed: number; region: string }>();
  const g = (id: any) => {
    const geo = geoById.get(id);
    const k = geo?.County ?? "Unknown";
    if (!geoAgg.has(k)) geoAgg.set(k, { county: k, sessions: 0, attendance: 0, disbursed: 0, region: geo?.Region ?? "—" });
    return geoAgg.get(k)!;
  };
  services.forEach((s) => (g(s.Geography_ID).sessions += s.Session_Count || 0));
  events.filter((e) => e.Attendance_Basis !== "Registration only").forEach((e) => (g(e.Geography_ID).attendance += e.Attendance || 0));
  funds.allocations.forEach((a) => (g(a.geo).disbursed += a.disbursed));
  const cityAgg = by(services, (s) => geoById.get(s.Geography_ID)?.City ?? "Unknown", (s) => s.Session_Count || 0);

  // Outcomes (configurable)
  const defs = inp.metricDefs;
  const outcomes = defs.map((d) => {
    const obs = inp.outcomes.filter((o) => o.Metric_ID === d.Metric_ID && o.Metric_Version === d.Version && progOk(o.Program_ID) && (!range || (o.Period_End >= range.start && o.Period_End <= range.end)));
    let value: number | null = null;
    if (obs.length) {
      if (d.Aggregation_Rule === "Sum of period activity") value = obs.reduce((a, o) => a + (o.Value || 0), 0);
      else if (d.Aggregation_Rule === "Latest snapshot") {
        const byProg = new Map<string, Row>();
        obs.forEach((o) => {
          const p = byProg.get(o.Program_ID);
          if (!p || o.Period_End > p.Period_End) byProg.set(o.Program_ID, o);
        });
        value = Array.from(byProg.values()).reduce((a, o) => a + (o.Value || 0), 0);
      } else if (d.Aggregation_Rule === "Average") value = obs.reduce((a, o) => a + (o.Value || 0), 0) / obs.length;
      else value = obs.length;
    }
    return { id: d.Metric_ID, version: d.Version, label: d.Label, kind: d.Kind, unit: d.Unit, rule: d.Aggregation_Rule, evidence: d.Evidence_Standard, value, observations: obs.length, programs: new Set(obs.map((o) => o.Program_ID)).size, status: value === null ? "unavailable" : ctx.demo ? "demo" : "verified" };
  });

  // Coverage: months with any service record per program
  const coverage = inp.programs.map((p) => {
    const ms = new Set(inp.services.filter((s) => s.Program_ID === p.Program_ID).map((s) => s.Date?.slice(0, 7)));
    const start = p.Period_Start?.slice(0, 7);
    const end = (p.Period_End && p.Period_End < new Date().toISOString().slice(0, 10) ? p.Period_End : new Date().toISOString().slice(0, 10)).slice(0, 7);
    const expected = start ? monthsBetween(start, end) : [];
    const missing = expected.filter((m) => !ms.has(m));
    return { id: p.Program_ID, name: p.Program_Name, cadence: p.Reporting_Cadence, expected: expected.length, reported: expected.length - missing.length, missing: missing.slice(-6) };
  });

  return {
    kpis,
    trend,
    programTable,
    allocations: funds.allocations.map((a) => ({ ...a, programName: progById.get(a.program)?.Program_Name ?? a.program, county: geoById.get(a.geo)?.County ?? "Unknown" })),
    serviceMix,
    groupMix,
    industryMix,
    geography: Array.from(geoAgg.values()).sort((a, b) => b.sessions - a.sessions),
    cities: cityAgg,
    outcomes,
    coverage,
    qualityNotes: store.rows("fact_data_quality_notes", ctx.demo).sort((a, b) => String(b.Date).localeCompare(String(a.Date))),
    programs: inp.programs.map((p) => ({ id: p.Program_ID, name: p.Program_Name })),
    freshness: fr,
    appliedFilters: applied(f),
  };
}
const inRangeD = (d: any, r: any) => M.inRange(d, r);
function monthsBetween(a: string, b: string) {
  const out: string[] = [];
  let [y, m] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  while (y < by || (y === by && m <= bm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (out.length > 120) break;
  }
  return out;
}

// ═════════════════ CRP ═════════════════
export function crpDashboard(store: Store, ctx: Ctx, f: Filters) {
  const rows = store.rows("crp_report", ctx.demo).sort((a, b) => a.Period_End.localeCompare(b.Period_End));
  const range = M.periodRange(f);
  const inR = rows.filter((r) => !range || (r.Period_End >= range.start && r.Period_End <= range.end));
  const activity = inR.filter((r) => r.Period_Basis === "Period activity");
  const cumulative = inR.filter((r) => r.Period_Basis === "Cumulative");
  const baseline = rows.find((r) => r.Period_Basis === "Baseline");
  const latestCum = cumulative[cumulative.length - 1];
  const sum = (k: string) => (activity.length ? activity.reduce((a, r) => a + (r[k] || 0), 0) : null);
  const fr = freshness(store, ctx, ["crp_report"]);
  const dims = labelFilters(inapplicable(f, ["year", "month"]));
  const flow = (id: string, label: string, k: string, unit: MetricResult["unit"], def: string) =>
    M.mk({ id, label, value: sum(k), unit, definition: def, source: "CRP period reports (period-activity rows only)", period: range?.label ?? "All reported periods", n: activity.length, exclusions: `${cumulative.length} cumulative and ${baseline ? 1 : 0} baseline rows not summed`, lastImport: lastOf(fr, "crp_report"), inapplicableFilters: dims, reason: activity.length ? undefined : "No period-activity reports" }, ctx.demo);
  // authoritative lending comparison
  const inp = lendingInputs(store, ctx, {});
  const lend = M.fundedLoans(inp, range);
  const crpLoanDollars = sum("Loan_Dollars");
  const kpis = [
    flow("crp_loans", "Loans originated (CRP-reported)", "Loans_Originated", "count", "Program-reported loans originated in period-activity reports."),
    flow("crp_loan_dollars", "Loan dollars (CRP-reported)", "Loan_Dollars", "money", "Program-reported; shown beside authoritative lending disbursements, never replaced by them."),
    flow("crp_coaching", "Financial coaching", "Financial_Coaching", "count", "Program-reported coaching count in period-activity reports."),
    flow("crp_training", "Small business training", "Small_Biz_Training", "count", "Program-reported training count."),
    flow("crp_jobs_created", "Jobs created (reported)", "Jobs_Created", "count", "Self-reported outcome; not causal attribution."),
    M.mk({ id: "crp_active", label: "Active participants (latest)", value: inR.length ? inR[inR.length - 1].Active_Participants : null, unit: "count", definition: "Point-in-time count from the most recent report. Monthly snapshots are never summed.", source: "CRP period reports", period: inR.length ? inR[inR.length - 1].Reporting_Period : "—", lastImport: lastOf(fr, "crp_report"), inapplicableFilters: dims }, ctx.demo),
  ];
  // coverage & gaps (monthly cadence expectation)
  const reported = new Set(rows.filter((r) => r.Period_Basis !== "Baseline").map((r) => r.Period_End.slice(0, 7)));
  const first = rows.find((r) => r.Period_Basis !== "Baseline")?.Period_End.slice(0, 7);
  const last = rows[rows.length - 1]?.Period_End.slice(0, 7);
  const expected = first && last ? monthsBetween(first, last) : [];
  const RACE_KEYS = Object.keys(rows[0] ?? {}).filter((k) => k.startsWith("Race_") && k !== "Race_Selection");
  const COUNTY_KEYS = Object.keys(rows[0] ?? {}).filter((k) => k.startsWith("County_"));
  const sel = inR[inR.length - 1];
  const t = getRules(store).smallCellThreshold;
  return {
    kpis,
    periods: rows.map((r) => ({ id: r._id, period: r.Reporting_Period, start: r.Period_Start, end: r.Period_End, basis: r.Period_Basis, area: r.Funding_Area, enrolled: r.Enrolled, active: r.Active_Participants, coaching: r.Financial_Coaching, training: r.Small_Biz_Training, funded: r.Small_Biz_Funded, loans: r.Loans_Originated, dollars: r.Loan_Dollars, jobsC: r.Jobs_Created, jobsR: r.Jobs_Retained, established: r.Businesses_Established, expanded: r.Businesses_Expanded, highlights: r.Program_Highlights, challenges: r.Program_Challenges, source: r.Source_Document })),
    coverage: { expected: expected.length, reported: expected.filter((m) => reported.has(m)).length, missing: expected.filter((m) => !reported.has(m)) },
    selected: sel
      ? {
          period: sel.Reporting_Period,
          raceSelection: sel.Race_Selection,
          race: RACE_KEYS.map((k) => ({ name: k.replace("Race_", "").replace(/([A-Z])/g, " $1").trim(), ...M.suppress(sel[k] || 0, t) })),
          county: COUNTY_KEYS.map((k) => ({ name: k.replace("County_", ""), ...M.suppress(sel[k] || 0, t) })),
        }
      : null,
    comparison: { crpReported: crpLoanDollars, lendingDisbursed: inp.txns.length ? lend.disbursementAmount : null, period: range?.label ?? "All periods", note: "CRP figures are program-reported. Lending figures are authoritative transactions across all funds. Differences are expected until reconciled by fund." },
    baseline: baseline ? { period: baseline.Reporting_Period, enrolled: baseline.Enrolled, loans: baseline.Loans_Originated, dollars: baseline.Loan_Dollars } : null,
    latestCumulative: latestCum ? { period: latestCum.Reporting_Period, loans: latestCum.Loans_Originated, dollars: latestCum.Loan_Dollars } : null,
    trend: activity.map((r) => ({ period: r.Period_End.slice(0, 7), dollars: r.Loan_Dollars || 0, loans: r.Loans_Originated || 0, coaching: r.Financial_Coaching || 0, training: r.Small_Biz_Training || 0 })),
    freshness: fr,
  };
}

// ═════════════════ CRSP ═════════════════
export function crspDashboard(store: Store, ctx: Ctx, f: Filters) {
  const all = store.rows("crsp_service", ctx.demo);
  const range = M.periodRange(f);
  const rows = all.filter((r) => M.inRange(r.Service_Date, range));
  const fr = freshness(store, ctx, ["crsp_service"]);
  const t = getRules(store).smallCellThreshold;
  const dims = labelFilters(inapplicable(f, ["year", "month"]));
  const distinct = M.distinctCount(rows, "Business_ID");
  const minutes = rows.reduce((a, r) => a + (r.Duration_Minutes || 0), 0);
  const period = range?.label ?? "All service dates";
  const kpis = [
    M.mk({ id: "crsp_services", label: "Services delivered", value: all.length ? rows.length : null, unit: "count", definition: "Count of approved CRSP service records (business visits/sessions).", source: "CRSP service-report workbook", period, lastImport: lastOf(fr, "crsp_service"), inapplicableFilters: dims }, ctx.demo),
    M.mk({ id: "crsp_businesses", label: "Distinct businesses served", value: all.length ? distinct : null, unit: "count", definition: "Distinct opaque Business_ID values — real identity, not a non-null name count.", source: "CRSP service-report workbook", period, lastImport: lastOf(fr, "crsp_service"), inapplicableFilters: dims }, ctx.demo),
    M.mk({ id: "crsp_hours", label: "Service hours", value: all.length ? Math.round((minutes / 60) * 10) / 10 : null, unit: "hours", definition: "Sum of Duration_Minutes ÷ 60. Source duration columns mapped to one documented unit (minutes); originals retained.", source: "CRSP service-report workbook", period, lastImport: lastOf(fr, "crsp_service"), inapplicableFilters: dims }, ctx.demo),
    M.mk({ id: "crsp_visits_per_business", label: "Avg visits per business", value: distinct ? Math.round((rows.length / distinct) * 100) / 100 : null, unit: "ratio", definition: "Total valid visits ÷ distinct served businesses in the period — not the average of visit sequence numbers.", source: "Calculated", period, denominator: `${distinct} distinct businesses`, lastImport: lastOf(fr, "crsp_service"), inapplicableFilters: dims }, ctx.demo),
  ];
  const monthly = new Map<string, { month: string; services: number; hours: number; businesses: Set<string> }>();
  rows.forEach((r) => {
    const k = r.Service_Date.slice(0, 7);
    const e = monthly.get(k) ?? { month: k, services: 0, hours: 0, businesses: new Set() };
    e.services++;
    e.hours += (r.Duration_Minutes || 0) / 60;
    e.businesses.add(r.Business_ID);
    monthly.set(k, e);
  });
  const heat: Record<string, number> = {};
  rows.forEach((r) => {
    const d = new Date(r.Service_Date + "T12:00:00Z");
    const key = `${r.Service_Date.slice(0, 7)}|${d.getUTCDay()}`;
    heat[key] = (heat[key] || 0) + 1;
  });
  const distinctBy = (key: string) => {
    const m = new Map<string, Set<string>>();
    rows.forEach((r) => {
      const k = r[key] || "Unknown";
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(r.Business_ID);
    });
    return Array.from(m.entries()).map(([name, s]) => ({ name, ...M.suppress(s.size, t) })).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  };
  const restricted = ["admin", "program"].includes(ctx.role);
  return {
    kpis,
    monthly: Array.from(monthly.values()).sort((a, b) => a.month.localeCompare(b.month)).map((e) => ({ month: e.month, services: e.services, hours: Math.round(e.hours * 10) / 10, businesses: e.businesses.size })),
    heat,
    industry: distinctBy("Industry_Code"),
    serviceMix: (() => {
      const m = new Map<string, number>();
      rows.forEach((r) => m.set(r.Service_Provided || "Unknown", (m.get(r.Service_Provided || "Unknown") || 0) + 1));
      return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    })(),
    referral: distinctBy("Referral_Source"),
    demographics: restricted ? { gender: distinctBy("Gender"), race: distinctBy("Race_Ethnicity"), language: distinctBy("Language") } : null,
    demographicsNote: restricted ? `Counts of distinct businesses. Cells under ${t} suppressed (policy ${getRules(store).smallCellPolicyApproved ? "approved" : "proposed"}).` : "Demographic breakdowns are restricted to program staff and administrators.",
    freshness: fr,
  };
}

// ═════════════════ ENGAGEMENT ═════════════════
export function engagementDashboard(store: Store, ctx: Ctx, f: Filters) {
  const range = M.periodRange(f);
  const events = store.rows("fact_events", ctx.demo).filter((e) => M.inRange(e.Date, range));
  const members = store.rows("membership_snapshot", ctx.demo);
  const campaigns = store.rows("campaign", ctx.demo).filter((c) => M.inRange(c.Send_Date, range));
  const tags = store.rows("crm_tag_summary", ctx.demo);
  const fr = freshness(store, ctx, ["fact_events", "membership_snapshot", "campaign", "crm_tag_summary"]);
  const period = range?.label ?? "All periods";
  const attended = (e: Row) => (e.Attendance_Basis === "Checked-in" || e.Attendance_Basis === "Headcount" ? e.Attendance || 0 : 0);
  const series = (s: string) => events.filter((e) => e.Event_Series === s);
  const tt = series("Third Thursday");
  const di = series("Drop In and CoLab");
  const lastMemberDate = Array.from(new Set(members.filter((m) => !range || m.Period_End <= range.end).map((m) => m.Period_End))).sort().pop();
  const tier = (t: string) => members.find((m) => m.Period_End === lastMemberDate && m.Tier === t)?.Members_At_Period_End ?? null;
  const sent = campaigns.reduce((a, c) => a + (c.Delivered ?? c.Sent ?? 0), 0);
  const uo = campaigns.reduce((a, c) => a + (c.Unique_Opens || 0), 0);
  const uc = campaigns.reduce((a, c) => a + (c.Unique_Clicks || 0), 0);
  const lastEv = lastOf(fr, "fact_events");
  const kpis = [
    M.mk({ id: "tt_attendance", label: "Third Thursday attendance", value: tt.length ? tt.reduce((a, e) => a + attended(e), 0) : null, unit: "count", definition: "Attendance instances at Third Thursday occurrences (checked-in or headcount).", source: "Events & occurrences", period, n: tt.length, secondary: `${tt.length} occurrences`, lastImport: lastEv }, ctx.demo),
    M.mk({ id: "di_attendance", label: "Drop In and CoLab visits", value: di.length ? di.reduce((a, e) => a + attended(e), 0) : null, unit: "count", definition: "Attendance instances at Drop In and CoLab sessions.", source: "Events & occurrences", period, n: di.length, secondary: `${di.length} sessions`, lastImport: lastEv }, ctx.demo),
    M.mk({ id: "full_access", label: "Denkyem Fam Full Access", value: tier("Denkyem Fam Full Access"), unit: "count", definition: "Members at period end (stock). Monthly totals are never summed as unique members.", source: "Mighty Networks membership", period: lastMemberDate ? `As of ${lastMemberDate}` : "—", lastImport: lastOf(fr, "membership_snapshot") }, ctx.demo),
    M.mk({ id: "premium", label: "Premium Member Monthly", value: tier("Premium Member Monthly"), unit: "count", definition: "Members at period end (stock).", source: "Mighty Networks membership", period: lastMemberDate ? `As of ${lastMemberDate}` : "—", lastImport: lastOf(fr, "membership_snapshot") }, ctx.demo),
    M.mk({ id: "open_rate", label: "Unique open rate", value: sent ? (uo / sent) * 100 : null, unit: "percent", status: fr.find((x) => x.dataset === "campaign")?.lastStatus === "failed" ? "provisional" : undefined, reason: fr.find((x) => x.dataset === "campaign")?.failure ? "Latest refresh failed — showing last approved data" : undefined, definition: "Unique opens ÷ delivered (or sent where delivered is unavailable) for campaigns in the period.", source: "ActiveCampaign campaigns", period, denominator: `${sent.toLocaleString()} delivered`, secondary: sent ? `Unique click rate ${((uc / sent) * 100).toFixed(1)}%` : undefined, lastImport: lastOf(fr, "campaign") }, ctx.demo),
  ];
  const monthKey = (e: Row) => e.Date.slice(0, 7);
  const trend = new Map<string, any>();
  events.forEach((e) => {
    const k = monthKey(e);
    const r = trend.get(k) ?? { month: k, recurring: 0, signature: 0, registrations: 0, attendance: 0 };
    if (e.Event_Type === "Recurring") r.recurring += attended(e);
    else r.signature += attended(e);
    r.registrations += e.Registrations || 0;
    r.attendance += attended(e);
    trend.set(k, r);
  });
  const memTrend = new Map<string, any>();
  members.forEach((m) => {
    const r = memTrend.get(m.Period_End) ?? { date: m.Period_End };
    r[m.Tier] = m.Members_At_Period_End;
    r.joins = (r.joins || 0) + (m.New_Joins || 0);
    memTrend.set(m.Period_End, r);
  });
  return {
    kpis,
    trend: Array.from(trend.values()).sort((a, b) => a.month.localeCompare(b.month)),
    membership: Array.from(memTrend.values()).sort((a, b) => a.date.localeCompare(b.date)),
    signature: events.filter((e) => e.Event_Type === "Signature").map((e) => ({ name: e.Event_Name, date: e.Date, registrations: e.Registrations, attendance: e.Attendance, basis: e.Attendance_Basis })),
    registrationVsAttendance: events.filter((e) => e.Registrations).map((e) => ({ name: e.Event_Name, date: e.Date, registrations: e.Registrations, attendance: attended(e), basis: e.Attendance_Basis })).slice(-12),
    campaigns: campaigns.map((c) => ({ id: c.Campaign_ID, name: c.Name, date: c.Send_Date, sent: c.Sent, delivered: c.Delivered, uniqueOpenRate: c.Delivered || c.Sent ? (c.Unique_Opens || 0) / (c.Delivered || c.Sent) : null, uniqueClickRate: c.Delivered || c.Sent ? (c.Unique_Clicks || 0) / (c.Delivered || c.Sent) : null, unsub: c.Unsubscribes })).sort((a, b) => b.date.localeCompare(a.date)),
    tags: (() => {
      const d = Array.from(new Set(tags.map((t) => t.As_Of))).sort().pop();
      return { asOf: d ?? null, rows: tags.filter((t) => t.As_Of === d).map((t) => ({ tag: t.Tag, contacts: t.Distinct_Contacts })).sort((a, b) => b.contacts - a.contacts) };
    })(),
    ratios: { available: members.some((m) => m.Active_Definition), note: "DAM/MAM and WAM/MAM need daily/weekly/monthly active-member definitions with matched windows." },
    freshness: fr,
  };
}

// ═════════════════ FUNDRAISING ═════════════════
export function fundraisingDashboard(store: Store, ctx: Ctx, f: Filters) {
  const opps = store.rows("fundraising_opportunity", ctx.demo);
  const receipts = store.rows("fundraising_receipt", ctx.demo);
  const range = M.periodRange(f);
  const fr = freshness(store, ctx, ["fundraising_opportunity", "fundraising_receipt"]);
  const open = opps.filter((o) => !["Committed", "Declined", "Closed"].includes(o.Stage));
  const committed = opps.filter((o) => o.Committed_Amount && M.inRange(o.Committed_Date, range));
  const rc = receipts.filter((r) => M.inRange(r.Date, range));
  const period = range?.label ?? "All periods";
  const sumC = (rows: Row[], k: string) => rows.reduce((a, r) => a + M.cents(r[k]), 0) / 100;
  const weighted = open.filter((o) => o.Probability != null).reduce((a, o) => a + M.cents(o.Requested_Amount) * (o.Probability / 100), 0) / 100;
  const kpis = [
    M.mk({ id: "fr_open", label: "Open pipeline (requested)", value: opps.length ? sumC(open, "Requested_Amount") : null, unit: "money", definition: "Requested/expected amounts for opportunities not yet committed, declined or closed. Not secured funds.", source: "Fundraising tracker (proposed mapping)", period: "Current", n: open.length, status: "provisional", reason: "Tracker column meanings not yet verified against Paige's July workbook", lastImport: lastOf(fr, "fundraising_opportunity") }, ctx.demo),
    M.mk({ id: "fr_committed", label: "Commitments", value: opps.length ? sumC(committed, "Committed_Amount") : null, unit: "money", definition: "Committed amounts dated in the period. Commitments are not cash receipts or accounting revenue.", source: "Fundraising tracker", period, n: committed.length, status: "provisional", reason: "Mapping pending", lastImport: lastOf(fr, "fundraising_opportunity") }, ctx.demo),
    M.mk({ id: "fr_received", label: "Cash received", value: receipts.length || opps.length ? sumC(rc, "Amount") : null, unit: "money", definition: "Receipt transactions dated in the period.", source: "Fundraising receipts", period, n: rc.length, lastImport: lastOf(fr, "fundraising_receipt") }, ctx.demo),
    M.mk({ id: "fr_weighted", label: "Probability-weighted (optional)", value: open.some((o) => o.Probability != null) ? weighted : null, unit: "money", definition: "Σ requested × probability for open opportunities where probability is actually used. Never presented as secured.", source: "Calculated", period: "Current", status: "provisional", reason: open.some((o) => o.Probability != null) ? "Illustrative only" : "Probability not used in tracker", lastImport: lastOf(fr, "fundraising_opportunity") }, ctx.demo),
  ];
  const stageOrder = ["Prospect", "Cultivation", "Proposal submitted", "Committed", "Declined", "Closed"];
  const byStage = stageOrder.map((s) => ({ stage: s, count: opps.filter((o) => o.Stage === s).length, amount: sumC(opps.filter((o) => o.Stage === s), s === "Committed" ? "Committed_Amount" : "Requested_Amount") }));
  const instruments = ["Grant", "Donation", "Investment", "Promissory note"].map((i) => ({ instrument: i, open: sumC(open.filter((o) => o.Instrument_Type === i), "Requested_Amount"), committed: sumC(opps.filter((o) => o.Instrument_Type === i), "Committed_Amount"), received: sumC(receipts.filter((r) => opps.find((o) => o.Opportunity_ID === r.Opportunity_ID)?.Instrument_Type === i), "Amount") }));
  const restricted = ["admin", "finance"].includes(ctx.role);
  const today = new Date().toISOString().slice(0, 10);
  return {
    kpis,
    byStage,
    instruments,
    upcoming: open
      .filter((o) => o.Next_Action_Date)
      .sort((a, b) => a.Next_Action_Date.localeCompare(b.Next_Action_Date))
      .slice(0, 12)
      .map((o) => ({ id: o.Opportunity_ID, funder: restricted ? o.Funder : "Restricted", instrument: o.Instrument_Type, stage: o.Stage, amount: o.Requested_Amount, next: o.Next_Action, date: o.Next_Action_Date, overdue: o.Next_Action_Date < today, owner: o.Owner })),
    closing: open.filter((o) => o.Expected_Close).sort((a, b) => a.Expected_Close.localeCompare(b.Expected_Close)).slice(0, 10).map((o) => ({ id: o.Opportunity_ID, funder: restricted ? o.Funder : "Restricted", amount: o.Requested_Amount, close: o.Expected_Close, stage: o.Stage, probability: o.Probability })),
    receiptsTrend: (() => {
      const m = new Map<string, number>();
      receipts.forEach((r) => m.set(r.Date.slice(0, 7), (m.get(r.Date.slice(0, 7)) || 0) + (r.Amount || 0)));
      return Array.from(m.entries()).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
    })(),
    freshness: fr,
  };
}

// ═════════════════ FINANCE ═════════════════
export function financeDashboard(store: Store, ctx: Ctx, f: Filters & { basis?: "month" | "ytd" }) {
  const lines = store.rows("finance_line", ctx.demo);
  const notes = store.rows("promissory_note", ctx.demo);
  const fr = freshness(store, ctx, ["finance_line", "promissory_note"]);
  const periods = Array.from(new Set(lines.map((l) => l.Period))).sort();
  const sel = f.month && periods.includes(f.month) ? f.month : f.year ? periods.filter((p) => p.startsWith(f.year!)).pop() : periods[periods.length - 1];
  const basis = f.basis === "month" ? "Month_Amount" : "YTD_Amount";
  const pl = lines.filter((l) => l.Statement_Type === "Profit & Loss" && l.Period === sel);
  const bs = lines.filter((l) => l.Statement_Type === "Balance Sheet" && l.Period === sel);
  const total = (rows: Row[], cat: string, k: string) => {
    const t = rows.find((r) => r.Parent_Category === cat && r.Line_Kind === "Total");
    if (t) return { value: t[k] as number, from: "Statement total line" };
    const d = rows.filter((r) => r.Parent_Category === cat && r.Line_Kind === "Detail");
    return d.length ? { value: d.reduce((a, r) => a + M.cents(r[k]), 0) / 100, from: "Sum of detail lines (no total line supplied)" } : { value: null as number | null, from: "—" };
  };
  const inc = total(pl, "Income", basis);
  const exp = total(pl, "Expense", basis);
  const cogs = total(pl, "Cost of Goods Sold", basis);
  const reportedNoi = total(pl, "Net Operating Income", basis);
  const calculatedNoi = inc.value !== null && cogs.value !== null && exp.value !== null
    ? Math.round((inc.value - cogs.value - exp.value) * 100) / 100 : null;
  // A missing COGS line is not evidence of zero COGS. Prefer the explicit
  // statement NOI and reconcile it when every component is available.
  const noi = reportedNoi.value ?? calculatedNoi;
  const noiVariance = reportedNoi.value !== null && calculatedNoi !== null
    ? Math.round((reportedNoi.value - calculatedNoi) * 100) / 100 : null;
  const assets = total(bs, "Asset", "Month_Amount");
  const liab = total(bs, "Liability", "Month_Amount");
  const eq = total(bs, "Equity", "Month_Amount");
  const balanced = assets.value !== null && liab.value !== null && eq.value !== null ? Math.abs(assets.value - (liab.value + eq.value)) <= 1 : null;
  const meta = pl[0] ?? bs[0];
  const label = sel ? `${basis === "YTD_Amount" ? "YTD through" : "Month of"} ${sel}` : "No statement";
  const kpis = [
    M.mk({ id: "income", label: basis === "YTD_Amount" ? "Income (YTD)" : "Income (month)", value: inc.value, unit: "money", definition: `Total income from the finalized P&L. ${inc.from}. Monthly and YTD are separate; YTD is never added across months.`, source: "Robin's finalized month-end P&L", period: label, lastImport: lastOf(fr, "finance_line"), reason: sel ? undefined : "No approved statement" }, ctx.demo),
    M.mk({ id: "expenses", label: basis === "YTD_Amount" ? "Expenses (YTD)" : "Expenses (month)", value: exp.value, unit: "money", definition: `Total expenses. ${exp.from}.`, source: "Finalized P&L", period: label, lastImport: lastOf(fr, "finance_line") }, ctx.demo),
    M.mk({ id: "noi", label: "Net operating income", value: noi, unit: "money",
      definition: "Reported net operating income; independently reconciled as income − cost of goods sold − operating expenses on the same statement and basis.",
      source: reportedNoi.value !== null ? "P&L net operating income line" : "Calculated from P&L totals",
      status: noiVariance !== null && Math.abs(noiVariance) > 0.01 ? "provisional" : undefined,
      reason: noi === null ? "Net operating income or complete component totals not supplied" :
        noiVariance !== null && Math.abs(noiVariance) > 0.01 ? `Statement component variance: ${noiVariance}` : undefined,
      period: label, lastImport: lastOf(fr, "finance_line") }, ctx.demo),
    M.mk({ id: "assets", label: "Total assets", value: assets.value, unit: "money", definition: `Balance sheet total assets. ${assets.from}.`, source: "Finalized Balance Sheet", period: sel ? `As of ${sel} month-end` : "—", lastImport: lastOf(fr, "finance_line"), secondary: balanced === null ? undefined : balanced ? "Balances: Assets = Liabilities + Equity" : "Does not balance — review statement" }, ctx.demo),
  ];
  const comp = (rows: Row[], cat: string) => rows.filter((r) => r.Parent_Category === cat && r.Line_Kind === "Detail").map((r) => ({ name: r.Line_Name, value: r[cat === "Income" || cat === "Expense" ? basis : "Month_Amount"] ?? 0 })).sort((a, b) => b.value - a.value);
  const trend = periods.map((p) => {
    const rows = lines.filter((l) => l.Statement_Type === "Profit & Loss" && l.Period === p);
    const i = total(rows, "Income", "Month_Amount").value;
    const e = total(rows, "Expense", "Month_Amount").value;
    const c = total(rows, "Cost of Goods Sold", "Month_Amount").value;
    const n = total(rows, "Net Operating Income", "Month_Amount").value;
    return { period: p, income: i, expenses: e, noi: n ?? (i !== null && c !== null && e !== null ? Math.round((i - c - e) * 100) / 100 : null) };
  });
  const today = new Date();
  const restricted = ["admin", "finance"].includes(ctx.role);
  const bucket = (d: string) => {
    const days = (Date.parse(d) - today.getTime()) / 86400000;
    return days < 0 ? "Matured / past due" : days <= 90 ? "0–90 days" : days <= 180 ? "91–180 days" : days <= 365 ? "181–365 days" : "1 year +";
  };
  const buckets = ["Matured / past due", "0–90 days", "91–180 days", "181–365 days", "1 year +"].map((b) => ({ bucket: b, notes: notes.filter((n) => bucket(n.Maturity_Date) === b).length, balance: notes.filter((n) => bucket(n.Maturity_Date) === b).reduce((a, n) => a + M.cents(n.Remaining_Balance), 0) / 100 }));
  return {
    kpis,
    periods,
    selected: sel ?? null,
    statementMeta: meta ? { entity: meta.Entity, basis: meta.Basis, version: meta.Statement_Version, approved: meta.Approved_Date } : null,
    income: comp(pl, "Income"),
    expenses: comp(pl, "Expense"),
    waterfall: calculatedNoi !== null ? [
      { name: "Income", value: inc.value, kind: "start" },
      { name: "Cost of goods sold", value: -cogs.value!, kind: "step" },
      { name: "Operating expenses", value: -exp.value!, kind: "step" },
      { name: "Calculated operating income", value: calculatedNoi, kind: "end" },
    ] : [],
    noiReconciliation: { reported: reportedNoi.value, calculated: calculatedNoi, variance: noiVariance },
    balance: { assets: comp(bs, "Asset"), liabilities: comp(bs, "Liability"), equity: comp(bs, "Equity"), totals: { assets: assets.value, liabilities: liab.value, equity: eq.value }, balanced },
    trend,
    ratios: [
      { name: "Debt-to-equity", numerator: "Total liabilities", denominator: "Total equity", status: "Pending Robin's definition" },
      { name: "Current ratio", numerator: "Current assets", denominator: "Current liabilities", status: "Pending chart-of-accounts mapping" },
      { name: "Quick ratio", numerator: "Cash + receivables", denominator: "Current liabilities", status: "Pending chart-of-accounts mapping" },
      { name: "Operating margin", numerator: "Net operating income", denominator: "Total income", status: "Pending definition approval" },
      { name: "Cash runway", numerator: "Unrestricted cash", denominator: "Avg monthly operating expense", status: "Pending restriction mapping" },
    ],
    notes: {
      total: notes.length ? notes.reduce((a, n) => a + M.cents(n.Remaining_Balance), 0) / 100 : null,
      buckets,
      upcoming: notes
        .filter((n) => n.Next_Payment_Date)
        .sort((a, b) => a.Next_Payment_Date.localeCompare(b.Next_Payment_Date))
        .slice(0, 8)
        .map((n) => ({ id: n.Note_ID, lender: restricted ? n.Lender : "Restricted", next: n.Next_Payment_Date, due: n.Amount_Due, remaining: n.Remaining_Balance, maturity: n.Maturity_Date, rate: n.Interest_Rate })),
    },
    freshness: fr,
  };
}

// ═════════════════ SURVEYS & JOURNEYS ═════════════════
export function surveysDashboard(store: Store, ctx: Ctx) {
  const s = store.rows("survey_summary", ctx.demo);
  const j = store.rows("journey_touchpoint", ctx.demo);
  const biz = store.rows("business", ctx.demo);
  const fr = freshness(store, ctx, ["survey_summary", "journey_touchpoint"]);
  const instruments = Array.from(new Set(s.map((x) => x.Instrument_ID))).map((id) => {
    const rows = s.filter((x) => x.Instrument_ID === id).sort((a, b) => a.Period_End.localeCompare(b.Period_End));
    const n = rows.reduce((a, r) => a + r.Responses, 0);
    const mean = n ? rows.reduce((a, r) => a + r.Mean_Score * r.Responses, 0) / n : null;
    const starts = rows.reduce((a, r) => a + (r.Starts || 0), 0);
    return { id, name: rows[0].Instrument_Name, scale: `${rows[0].Scale_Min}–${rows[0].Scale_Max}`, scaleMax: rows[0].Scale_Max, responses: n, mean: mean !== null ? Math.round(mean * 100) / 100 : null, completion: starts ? n / starts : null, trend: rows.map((r) => ({ period: r.Period, mean: r.Mean_Score, responses: r.Responses })), categories: Array.from(new Set(rows.map((r) => r.Service_Category))) };
  });
  const stages = ["Event / program", "TA / Pit Crew", "Application", "Funded"];
  const reviewed = j.filter((t) => t.Match_Confidence !== "Low");
  const funnel = stages.map((st) => ({ stage: st, businesses: new Set(reviewed.filter((t) => t.Stage === st).map((t) => t.Business_ID)).size }));
  const matched = new Set(reviewed.map((t) => t.Business_ID)).size;
  const internal = ctx.role !== "funder";
  return {
    instruments,
    journey: internal ? { funnel, matchedBusinesses: matched, knownBusinesses: biz.length, lowConfidenceExcluded: j.length - reviewed.length, coverage: biz.length ? matched / biz.length : null } : null,
    freshness: fr,
  };
}

// ═════════════════ OVERVIEW ═════════════════
export function overview(store: Store, ctx: Ctx, f: Filters) {
  const L = lendingDashboard(store, ctx, f);
  const I = impactDashboard(store, ctx, f);
  const E = engagementDashboard(store, ctx, f);
  const F = financeDashboard(store, ctx, f);
  const R = fundraisingDashboard(store, ctx, f);
  const C = crspDashboard(store, ctx, f);
  const pick = (arr: MetricResult[], id: string) => arr.find((k) => k.id === id)!;
  const fr = freshness(store, ctx, DATASETS.map((d) => d.key));
  const rules = getRules(store);
  const queue = store.queueCounts(ctx.demo);
  const issues: { level: "warning" | "error" | "info"; title: string; detail: string; link: string }[] = [];
  fr.filter((x) => x.failure).forEach((x) => issues.push({ level: "error", title: `${x.label}: latest refresh failed`, detail: `Last approved data retained${x.lastSuccessfulImport ? ` from ${x.lastSuccessfulImport.slice(0, 10)}` : ""}. ${x.failure}`, link: "/imports" }));
  if (!rules.loanStatusMappingApproved) issues.push({ level: "warning", title: "Loan status mapping not approved", detail: "Portfolio principal and active-loan count stay provisional.", link: "/admin" });
  if (!rules.txnStatusMatrixApproved) issues.push({ level: "warning", title: "Transaction status matrix pending", detail: "Funded, disbursed and payment totals stay provisional.", link: "/lending" });
  if (!rules.delinquencyRulesApproved) issues.push({ level: "warning", title: "Delinquency rules pending", detail: "Revenue-based schedules need lending sign-off; internal only.", link: "/lending" });
  if (!rules.nedAdapterEnabled) issues.push({ level: "info", title: "NED adapter disabled", detail: "Manual import and crosswalk first; live connector pending NED contract.", link: "/ned" });
  const pendingN = queue.filter((q) => q.status === "submitted").reduce((a, q) => a + q.n, 0);
  if (pendingN) issues.push({ level: "info", title: `${pendingN} submissions awaiting review`, detail: "Draft and submitted values stay out of published reports.", link: "/review" });
  const quarantined = queue.filter((q) => q.status === "quarantined").reduce((a, q) => a + q.n, 0);
  if (quarantined) issues.push({ level: "warning", title: `${quarantined} quarantined import rows`, detail: "Resolve or keep excluded with a documented reason.", link: "/review" });
  return {
    sections: [
      { id: "lending", title: "Lending", link: "/lending", kpis: [pick(L.kpis, "portfolio_principal"), pick(L.kpis, "funded_loans"), pick(L.kpis, "disbursed")] },
      { id: "impact", title: "Funding deployment", link: "/impact", kpis: [pick(I.kpis, "funds_allocated"), pick(I.kpis, "funds_disbursed"), pick(I.kpis, "funds_remaining")] },
      { id: "delivery", title: "Service delivery", link: "/impact", kpis: [pick(I.kpis, "service_hours"), pick(I.kpis, "sessions"), pick(C.kpis, "crsp_businesses")] },
      { id: "engagement", title: "Community & engagement", link: "/engagement", kpis: [pick(E.kpis, "tt_attendance"), pick(E.kpis, "full_access"), pick(E.kpis, "open_rate")] },
      { id: "finance", title: "Financial health", link: "/finance", kpis: [pick(F.kpis, "income"), pick(F.kpis, "noi"), pick(R.kpis, "fr_received")] },
    ],
    lendingTrend: L.disbursementTrend,
    portfolioTrend: L.portfolioTrend,
    impactTrend: I.trend,
    financeTrend: F.trend,
    issues,
    freshness: fr,
    queue,
  };
}

export function sourceStatus(store: Store, ctx: Ctx) {
  const fr = freshness(store, ctx, DATASETS.map((d) => d.key));
  return DATASETS.map((d) => {
    const x = fr.find((y) => y.dataset === d.key)!;
    const state = x.failure ? "Refresh failed" : x.approvedRows ? (ctx.demo ? "Demonstration" : "Approved data") : "Source pending";
    return { key: d.key, label: d.label, domain: d.domain, source: d.source, owner: d.owner, cadence: d.cadence, grain: d.grain, legacyTable: d.legacyTable ?? null, ...x, state };
  });
}
