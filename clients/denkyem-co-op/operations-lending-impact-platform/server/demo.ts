// Clearly labeled DEMONSTRATION fixtures. Fictitious values, isolated by is_demo = 1.
// Never derived from PBIX cached rows; never shown in production mode.
import type { Store } from "./storage";
import { loanSizeBucket } from "@shared/contracts";

let seed = 20261001;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const ri = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const pick = <T>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const pad = (n: number, w = 3) => String(n).padStart(w, "0");
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => iso(new Date(Date.parse(s) + n * 86400000));
const monthEnd = (y: number, m: number) => iso(new Date(Date.UTC(y, m, 0)));
const months = (fromY: number, fromM: number, toY: number, toM: number) => {
  const out: [number, number][] = [];
  let y = fromY,
    m = fromM;
  while (y < toY || (y === toY && m <= toM)) {
    out.push([y, m]);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
};
const r2 = (v: number) => Math.round(v * 100) / 100;

export function seedDemo(store: Store) {
  if (store.getSetting<string | null>("demo_seeded_at", null)) return;
  const at = new Date(Date.now() - 3 * 86400000).toISOString();
  const ins = (ds: string, rows: any[]) => store.insertDemo(ds, rows, null, at);

  // ── Geography, programs, groups ──
  const geos = [
    ["G-01", "Seattle", "King", "98144", "Central Puget Sound"],
    ["G-02", "Renton", "King", "98057", "Central Puget Sound"],
    ["G-03", "Kent", "King", "98032", "Central Puget Sound"],
    ["G-04", "Federal Way", "King", "98003", "Central Puget Sound"],
    ["G-05", "Tacoma", "Pierce", "98405", "South Sound"],
    ["G-06", "Everett", "Snohomish", "98201", "North Sound"],
    ["G-07", "Vancouver", "Clark", "98660", "Southwest WA"],
    ["G-08", "Spokane", "Spokane", "99202", "Eastern WA"],
    ["G-09", "Yakima", "Yakima", "98901", "Central WA"],
  ].map(([id, city, county, zip, region]) => ({ Geography_ID: id, City: city, County: county, Zip: zip, Region: region, Country: "United States" }));
  ins("dim_geography", geos);

  const programs = [
    ["P-GL", "Black Business Growth Lab", "Capacity grant (demo)", "Education", "Workshops & cohort", "2025-01-01", "Quarterly"],
    ["P-DI", "Drop In and CoLab", "Library partnership (demo)", "Technical assistance", "Office hours", "2025-01-01", "Monthly"],
    ["P-PC", "Pit Crew Technical Assistance", "TA grant (demo)", "Technical assistance", "1:1 advising", "2025-01-01", "Monthly"],
    ["P-TT", "Third Thursday", "Community events (demo)", "Community events", "Networking", "2025-01-01", "Monthly"],
    ["P-CRP", "CRP Grant Program", "CRP (demo)", "Grant-funded program", "State program", "2025-01-01", "Monthly"],
    ["P-CRSP", "CRSP Seattle Services", "CRSP (demo)", "Grant-funded program", "City program", "2025-03-01", "Monthly"],
  ].map(([id, name, grant, type, cat, start, cad]) => ({ Program_ID: id, Program_Name: name, Grant_Name: grant, Initiative_Type: type, Program_Category: cat, Status: "Active", Period_Start: start, Period_End: "2026-12-31", Reporting_Cadence: cad, Owner: "Program administrator", Template_Version: "v1.0" }));
  ins("dim_program", programs);

  const groups = [
    ["PG-1", "Business", "Small business (SME)", "722", "Food services", "Hospitality"],
    ["PG-2", "Business", "Startup (<2 yrs)", "541", "Professional services", "Services"],
    ["PG-3", "Individual", "Aspiring entrepreneur", "", "Not yet classified", "Pre-venture"],
    ["PG-4", "Organization", "Nonprofit / partner", "813", "Civic organizations", "Community"],
  ].map(([id, cat, type, code, label, sector]) => ({ Participant_Group_ID: id, Participant_Category: cat, Business_Type: type, Industry_Code: code, Industry_Label: label, Sector_Group: sector }));
  ins("dim_participant_group", groups);

  // ── Funds ──
  const allocs: any[] = [];
  const disb: any[] = [];
  let dn = 1;
  const fundSrc = ["Foundation grant (demo)", "State program (demo)", "City program (demo)", "Corporate partner (demo)"];
  programs.forEach((p, pi) => {
    const nAlloc = pi < 2 ? 3 : 2;
    for (let a = 0; a < nAlloc; a++) {
      const id = `A-${p.Program_ID.slice(2)}-${a + 1}`;
      const amt = ri(4, 22) * 5000;
      const date = `${2025 + (a > 1 ? 1 : 0)}-${pad(ri(1, 6), 2)}-${pad(ri(1, 25), 2)}`;
      allocs.push({ Allocation_ID: id, Date: date, Program_ID: p.Program_ID, Geography_ID: pick(geos).Geography_ID, Funding_Source: pick(fundSrc), Amount_Allocated: amt, Status: "Open" });
      let left = amt * (0.55 + rnd() * 0.4);
      let d = date;
      const draws = ri(2, 5);
      for (let k = 0; k < draws; k++) {
        d = addDays(d, ri(25, 70));
        if (d > "2026-09-25") break;
        const x = r2(k === draws - 1 ? left : left / (draws - k) * (0.7 + rnd() * 0.6));
        left -= x;
        disb.push({ Disbursement_ID: `D-${pad(dn++, 4)}`, Allocation_ID: id, Date: d, Amount_Disbursed: Math.max(500, Math.round(x)), Adjustment_Type: "Disbursement", Status: "Completed" });
      }
    }
  });
  disb.push({ Disbursement_ID: `D-${pad(dn++, 4)}`, Allocation_ID: allocs[0].Allocation_ID, Date: "2026-04-15", Amount_Disbursed: 1500, Adjustment_Type: "Return", Status: "Completed" });
  ins("fact_allocation", allocs);
  ins("fact_disbursement", disb);

  // ── Service delivery ──
  const svc: any[] = [];
  let sn = 1;
  const svcTypes: Record<string, string[]> = {
    "P-GL": ["Workshop", "Cohort session"],
    "P-DI": ["Office hours", "Market research"],
    "P-PC": ["1:1 advising", "Bookkeeping support", "Marketing support"],
    "P-TT": ["Networking"],
    "P-CRP": ["Financial coaching", "Small business training"],
    "P-CRSP": ["Business advising"],
  };
  for (const [y, m] of months(2025, 1, 2026, 9)) {
    for (const p of programs) {
      if (p.Program_ID === "P-TT") continue;
      if (p.Program_ID === "P-CRSP" && y === 2025 && m < 3) continue;
      if (rnd() < 0.07) continue; // realistic reporting gaps
      for (const t of svcTypes[p.Program_ID]) {
        const sessions = ri(4, 26);
        const g = p.Program_ID === "P-CRSP" ? "G-01" : pick(geos.slice(0, 6)).Geography_ID;
        svc.push({ Service_Record_ID: `S-${pad(sn++, 5)}`, Date: monthEnd(y, m), Program_ID: p.Program_ID, Geography_ID: g, Participant_Group_ID: pick(groups).Participant_Group_ID, Service_Type: t, Session_Count: sessions, Service_Hours: r2(sessions * (0.8 + rnd() * 1.4)), Aggregation_Basis: "Aggregate", Participant_Count: ri(Math.ceil(sessions * 0.4), sessions), Dedup_Method: "Unique within month per program (self-reported)" });
      }
    }
  }
  ins("fact_service_delivery", svc);

  // ── Events ──
  const ev: any[] = [];
  let en = 1;
  const ttVenues = ["G-01", "G-01", "G-02", "G-01", "G-05"];
  for (const [y, m] of months(2025, 1, 2026, 9)) {
    // third Thursday
    const first = new Date(Date.UTC(y, m - 1, 1));
    const offset = (4 - first.getUTCDay() + 7) % 7;
    const day = 1 + offset + 14;
    if (!(y === 2025 && m === 12)) {
      const reg = ri(60, 150);
      ev.push({ Event_ID: `E-${pad(en++, 4)}`, Event_Series: "Third Thursday", Event_Name: `Third Thursday — ${new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${y}`, Event_Type: "Recurring", Date: `${y}-${pad(m, 2)}-${pad(day, 2)}`, Program_ID: "P-TT", Geography_ID: pick(ttVenues), Registrations: reg, Attendance: Math.round(reg * (0.5 + rnd() * 0.3)), Attendance_Basis: "Checked-in", Raw_Tag: "third-thursday" });
    }
    // Drop In Thursdays (2–4 sessions)
    for (let w = 0; w < 4; w++) {
      const d = 1 + offset + w * 7;
      if (d > 28 || rnd() < 0.15) continue;
      ev.push({ Event_ID: `E-${pad(en++, 4)}`, Event_Series: "Drop In and CoLab", Event_Name: "Drop In and CoLab — Beacon Hill", Event_Type: "Recurring", Date: `${y}-${pad(m, 2)}-${pad(d, 2)}`, Program_ID: "P-DI", Geography_ID: "G-01", Registrations: ri(4, 14), Attendance: ri(3, 12), Attendance_Basis: "Headcount", Raw_Tag: "drop-in-colab" });
    }
    if (rnd() < 0.7) {
      ev.push({ Event_ID: `E-${pad(en++, 4)}`, Event_Series: "Growth Lab Workshop", Event_Name: pick(["Bookkeeping Q&A", "Visualize Your Brand", "Operational Strategy & OKRs", "Website Essentials", "Loan Readiness"]), Event_Type: "Recurring", Date: `${y}-${pad(m, 2)}-${pad(ri(5, 26), 2)}`, Program_ID: "P-GL", Geography_ID: "G-01", Registrations: ri(15, 60), Attendance: null, Attendance_Basis: "Registration only", Raw_Tag: "growth-lab" });
    }
  }
  ev.push({ Event_ID: `E-${pad(en++, 4)}`, Event_Series: "Signature event", Event_Name: "Holiday Market", Event_Type: "Signature", Date: "2025-12-17", Program_ID: "P-TT", Geography_ID: "G-02", Registrations: null, Attendance: 260, Attendance_Basis: "Headcount", Raw_Tag: "holiday-market" });
  ev.push({ Event_ID: `E-${pad(en++, 4)}`, Event_Series: "Signature event", Event_Name: "Investing in Black Communities 365", Event_Type: "Signature", Date: "2026-02-19", Program_ID: "P-TT", Geography_ID: "G-01", Registrations: 310, Attendance: 214, Attendance_Basis: "Checked-in", Raw_Tag: "ibc365" });
  ev.push({ Event_ID: `E-${pad(en++, 4)}`, Event_Series: "Signature event", Event_Name: "Summer Founders Showcase", Event_Type: "Signature", Date: "2026-07-16", Program_ID: "P-GL", Geography_ID: "G-01", Registrations: 180, Attendance: 131, Attendance_Basis: "Checked-in", Raw_Tag: "showcase" });
  ins("fact_events", ev);

  // ── Outcome definitions & observations ──
  const defs = [
    ["JOBS_CREATED", "Jobs created", "Outcome", "Count", "Sum of period activity", "Self-reported by business at follow-up"],
    ["JOBS_RETAINED", "Jobs retained", "Outcome", "Count", "Latest snapshot", "Self-reported at follow-up"],
    ["BIZ_ESTABLISHED", "Businesses established", "Outcome", "Count", "Sum of period activity", "Registration or license evidence"],
    ["BIZ_EXPANDED", "Businesses expanded", "Outcome", "Count", "Sum of period activity", "Self-reported with staff verification"],
    ["TA_HOURS", "Technical-assistance hours", "Output / activity", "Hours", "Sum of period activity", "Service logs"],
    ["HOUSING_UNITS", "Affordable housing units supported", "Outcome", "Count", "Sum of period activity", "Project documentation (optional, industry-specific)"],
  ].map(([id, label, kind, unit, rule, ev]) => ({ Metric_ID: id, Version: "1", Label: label, Kind: kind, Unit: unit, Aggregation_Rule: rule, Time_Basis: rule === "Latest snapshot" ? "Point-in-time" : "Period activity", Evidence_Standard: ev, Applicable_Programs: "Configurable per funder", Owner: "Program administrator", Description: `${label} — configurable definition, not a universal mandatory claim.` }));
  ins("metric_definition", defs);
  const obs: any[] = [];
  let on = 1;
  for (const [y, q] of [[2025, 1], [2025, 2], [2025, 3], [2025, 4], [2026, 1], [2026, 2]]) {
    const start = `${y}-${pad((q - 1) * 3 + 1, 2)}-01`;
    const end = monthEnd(y, q * 3);
    for (const p of ["P-GL", "P-PC", "P-CRP"]) {
      for (const [mid, lo, hi] of [["JOBS_CREATED", 2, 14], ["JOBS_RETAINED", 10, 40], ["BIZ_ESTABLISHED", 0, 4], ["BIZ_EXPANDED", 1, 6], ["TA_HOURS", 40, 160]] as [string, number, number][]) {
        if (mid === "TA_HOURS" && p === "P-CRP") continue;
        obs.push({ Observation_ID: `O-${pad(on++, 4)}`, Metric_ID: mid, Metric_Version: "1", Program_ID: p, Period_Start: start, Period_End: end, Geography_ID: "G-01", Value: ri(lo, hi), Evidence_Ref: "Quarterly follow-up survey (demo)" });
      }
    }
  }
  ins("outcome_observation", obs);

  ins("fact_data_quality_notes", [
    { Note_ID: "Q-001", Date: "2026-01-20", Category: "Methodology", Domain: "Impact", Description: "Participant groups are categories (Business/SME, Startup, Individual, Organization), not people. Unique-participant totals require deduplicated or reported counts." },
    { Note_ID: "Q-002", Date: "2026-01-21", Category: "Source gap", Domain: "CRP", Description: "Some CRP Smartsheet confirmations are missing. Missing months are shown as gaps, not zeros." },
    { Note_ID: "Q-003", Date: "2026-02-19", Category: "Methodology", Domain: "Lending", Description: "Active portfolio = outstanding principal for loans with verified Active status. Positive balance alone does not establish Active." },
    { Note_ID: "Q-004", Date: "2026-02-19", Category: "Limitation", Domain: "Lending", Description: "LoanWell NAICS is not clean. Industry concentration uses the curated mapping; unreviewed loans show as Unknown." },
    { Note_ID: "Q-005", Date: "2026-05-20", Category: "Self-reported", Domain: "Outcomes", Description: "Jobs created/retained are self-reported at follow-up and are not causal attribution." },
    { Note_ID: "Q-006", Date: "2026-09-24", Category: "Source gap", Domain: "Lending", Description: "NED selected July 2026. Cutover boundary and export contract pending; LoanWell remains the legacy authority until crosswalk sign-off." },
  ]);

  // ── Businesses & lending ──
  const industries = ["Food & beverage", "Retail", "Professional services", "Health & wellness", "Construction & trades", "Creative & media", "Personal care", "Transportation & logistics", "Technology"];
  const naics: Record<string, string> = { "Food & beverage": "722511", Retail: "448140", "Professional services": "541611", "Health & wellness": "621399", "Construction & trades": "238220", "Creative & media": "541430", "Personal care": "812112", "Transportation & logistics": "484110", Technology: "541511" };
  const biz = Array.from({ length: 90 }, (_, i) => {
    const g = pick(geos);
    return { Business_ID: `B-${pad(i + 1)}`, Display_Name: `Demo Business ${pad(i + 1)}`, City: g.City, County: g.County, Zip: g.Zip, Industry_Label: pick(industries) };
  });
  ins("business", biz);

  const funds = [
    ["Denkyem Loan Fund", "Community Capital"],
    ["Denkyem Loan Fund", "Recovery Fund"],
    ["CDFI Fund (demo)", "Growth Capital"],
  ];
  const loans: any[] = [];
  const txns: any[] = [];
  const snaps: any[] = [];
  const indmap: any[] = [];
  let tn = 1;
  const tid = () => `TX-${pad(tn++, 5)}`;
  const snapDates = months(2026, 3, 2026, 8).map(([y, m]) => monthEnd(y, m));
  const statusPlan = [...Array(44).fill("Active"), ...Array(12).fill("Paid off"), ...Array(3).fill("Charged off"), ...Array(2).fill("Cancelled"), ...Array(3).fill("Pending")];
  statusPlan.forEach((status, i) => {
    const b = biz[i];
    const [fund, sub] = pick(funds);
    const amt = pick([6000, 8500, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 125000]);
    const app = `${status === "Paid off" || status === "Charged off" ? 2024 : pick([2024, 2025, 2025, 2026])}-${pad(ri(1, 12), 2)}-${pad(ri(1, 27), 2)}`;
    const appDate = app > "2026-07-15" ? "2026-06-02" : app;
    const funded = status === "Pending" || status === "Cancelled" ? null : addDays(appDate, ri(6, 42));
    const risk = pick(["low", "medium", "medium", "high"]);
    const repay = rnd() < 0.18 ? "Revenue-based" : "Fixed schedule";
    const loan = {
      Loan_ID: `L-${pad(i + 1, 4)}`,
      Source_System: "LoanWell",
      Source_Account_Number: `LW-${10001 + i}`,
      Agreement_ID: `AG-${5000 + i}`,
      Process_ID: `PR-${7000 + i}`,
      Business_ID: b.Business_ID,
      Funding_Source: fund,
      Subfund: sub,
      Loan_Status: status,
      Disposition: status === "Active" || status === "Pending" ? "Open" : status === "Paid off" ? "Repaid" : status === "Charged off" ? "Written off" : "Cancelled",
      Repayment_Type: repay,
      Original_Amount: amt,
      Application_Date: i % 17 === 0 ? null : appDate, // a few missing created dates → visible exclusions
      Approval_Date: funded ? addDays(funded, -3) : null,
      Funding_Date: funded,
      Maturity_Date: funded ? addDays(funded, 365 * pick([2, 3, 5])) : null,
      Risk_Raw: risk,
      Risk_Rating: risk === "low" ? 2 : risk === "medium" ? 3 : 4,
      County: b.County,
      City: b.City,
      Zip: b.Zip,
    };
    loans.push(loan);
    const st = rnd();
    indmap.push({ Loan_ID: loan.Loan_ID, As_Of: "2026-06-30", Raw_NAICS: rnd() < 0.3 ? "" : naics[b.Industry_Label], Normalized_NAICS: naics[b.Industry_Label], Industry_Label: st < 0.15 ? "Unknown" : b.Industry_Label, Review_Status: st < 0.15 ? "Unknown" : st < 0.3 ? "Needs review" : "Reviewed", Reviewed_By: st < 0.3 ? null : "Data steward (demo)" });
    if (!funded) return;
    const twoDraws = amt >= 50000 && rnd() < 0.5;
    const draws = twoDraws ? [Math.round(amt * 0.6), amt - Math.round(amt * 0.6)] : [amt];
    let d = funded;
    draws.forEach((x, k) => {
      if (k) d = addDays(d, ri(20, 60));
      txns.push({ Transaction_Date: d, Transaction_Type: "disbursement", Transaction_Status: "completed", Source_Account_Number: loan.Source_Account_Number, Source_Transaction_ID: tid(), Loan_Fund_Name: fund, Loan_Sub_Fund_Name: sub, Agreement_ID: loan.Agreement_ID, Process_ID: loan.Process_ID, Disbursement_Amount: x, Principal_Paid: 0, Interest_Paid: 0, Fees_Paid: 0, Total_Payment_Amount: 0, Business_Name: b.Display_Name, Borrower_Full_Name: `Demo Borrower ${pad(i + 1)}` });
    });
    if (i === 5) txns.push({ Transaction_Date: addDays(funded, -1), Transaction_Type: "disbursement", Transaction_Status: "error", Source_Account_Number: loan.Source_Account_Number, Source_Transaction_ID: tid(), Loan_Fund_Name: fund, Loan_Sub_Fund_Name: sub, Disbursement_Amount: amt, Principal_Paid: 0, Interest_Paid: 0, Fees_Paid: 0, Total_Payment_Amount: 0 });
    // payments
    const term = 36;
    const monthlyPrin = amt / term;
    const payoffRaw = status === "Paid off" ? addDays(funded, ri(200, 520)) : null;
    const payoff = payoffRaw && payoffRaw > "2026-02-20" ? "2026-02-20" : payoffRaw;
    let bal = amt;
    let pd = addDays(funded, 30);
    const cutoff = status === "Charged off" ? addDays(funded, ri(150, 300)) : "2026-09-15";
    const paid: { date: string; bal: number }[] = [];
    while (pd <= cutoff && bal > 0.5) {
      const isPayoff = payoff && pd >= payoff;
      const prin = isPayoff ? bal : r2(monthlyPrin * (repay === "Revenue-based" ? 0.5 + rnd() : 1));
      const intr = r2(bal * 0.065 / 12);
      const fee = rnd() < 0.05 ? 25 : 0;
      const failed = rnd() < 0.04;
      const id = tid();
      txns.push({ Transaction_Date: pd, Transaction_Type: "payment", Transaction_Status: failed ? "failed" : "completed", Source_Account_Number: loan.Source_Account_Number, Source_Transaction_ID: id, Loan_Fund_Name: fund, Loan_Sub_Fund_Name: sub, Disbursement_Amount: 0, Principal_Paid: Math.min(prin, bal), Interest_Paid: intr, Fees_Paid: fee, Total_Payment_Amount: r2(Math.min(prin, bal) + intr + fee) });
      if (failed) {
        // LoanWell often pairs a failed payment with a reversal row — must not create fictitious cash
        txns.push({ Transaction_Date: addDays(pd, 2), Transaction_Type: "payment_reversal", Transaction_Status: "completed", Source_Account_Number: loan.Source_Account_Number, Source_Transaction_ID: tid(), Reversal_Of: id, Loan_Fund_Name: fund, Loan_Sub_Fund_Name: sub, Disbursement_Amount: 0, Principal_Paid: 0, Interest_Paid: 0, Fees_Paid: 0, Total_Payment_Amount: 0 });
      } else {
        if (rnd() < 0.015) {
          txns.push({ Transaction_Date: addDays(pd, 5), Transaction_Type: "payment_reversal", Transaction_Status: "completed", Source_Account_Number: loan.Source_Account_Number, Source_Transaction_ID: tid(), Reversal_Of: id, Loan_Fund_Name: fund, Loan_Sub_Fund_Name: sub, Disbursement_Amount: 0, Principal_Paid: 0, Interest_Paid: 0, Fees_Paid: 0, Total_Payment_Amount: 0 });
        } else bal = r2(bal - Math.min(prin, bal));
      }
      paid.push({ date: pd, bal });
      if (isPayoff) break;
      pd = addDays(pd, 30);
    }
    if (status === "Charged off") txns.push({ Transaction_Date: addDays(cutoff, 10), Transaction_Type: "writeOff", Transaction_Status: "completed", Source_Account_Number: loan.Source_Account_Number, Source_Transaction_ID: tid(), Disbursement_Amount: 0, Principal_Paid: 0, Interest_Paid: 0, Fees_Paid: 0, Total_Payment_Amount: 0 });
    // snapshots
    for (const sd of snapDates) {
      if (funded > sd) continue;
      const last = paid.filter((p) => p.date <= sd).pop();
      const prin = status === "Charged off" ? r2(last?.bal ?? amt) : last ? last.bal : amt;
      const dd = status === "Active" && rnd() < (repay === "Revenue-based" ? 0.3 : 0.08) ? ri(5, 95) : 0;
      snaps.push({ Source_Account_Number: loan.Source_Account_Number, Source_System: "LoanWell", As_Of_Date: sd, Loan_Fund_Name: fund, Loan_Subfund_Name: sub, Closing_Date: funded, Maturity_Date: loan.Maturity_Date, Interest_Rate: 6.5, Original_Disbursement_Amount: amt, Disbursement_Date: funded, Outstanding_Principal: prin, Outstanding_Interest: prin > 0 ? r2(prin * 0.005) : 0, Outstanding_Fees: prin > 0 && rnd() < 0.1 ? 25 : 0, Outstanding_Balance: 0, Days_Delinquent: dd, Amount_Past_Due: dd ? r2(monthlyPrin * Math.ceil(dd / 30)) : 0, Legal_Name_of_Business: b.Display_Name, Borrower_Name: `Demo Borrower ${pad(i + 1)}` });
      const s = snaps[snaps.length - 1];
      s.Outstanding_Balance = r2(s.Outstanding_Principal + s.Outstanding_Interest + s.Outstanding_Fees);
    }
  });
  // NED migration: 10 active loans migrated with Aug cutover; NED rows for Aug snapshot
  const migrated = loans.filter((l) => l.Loan_Status === "Active").slice(0, 10);
  const cw: any[] = [];
  migrated.forEach((l, k) => {
    const lw = snaps.find((s) => s.Source_Account_Number === l.Source_Account_Number && s.As_Of_Date === "2026-08-31");
    if (!lw) return;
    const variance = k === 3 ? 125.4 : k === 7 ? -980 : 0;
    const ned = `NED-${88000 + k}`;
    snaps.push({ ...lw, Source_Account_Number: ned, Source_System: "NED", Outstanding_Principal: r2(lw.Outstanding_Principal + variance), Outstanding_Balance: r2(lw.Outstanding_Balance + variance) });
    cw.push({ Canonical_Loan_ID: l.Loan_ID, LoanWell_Account: l.Source_Account_Number, NED_Account: ned, Cutover_Date: "2026-08-01", Authority: k === 9 ? "LoanWell" : "NED", Principal_LoanWell: lw.Outstanding_Principal, Principal_NED: r2(lw.Outstanding_Principal + variance), Match_Status: k === 9 ? "Pending" : variance ? "Variance" : "Matched", Exception_Note: variance ? "Principal differs — confirm last payment posting date at cutover" : k === 9 ? "Awaiting NED export for this loan" : null, Signed_Off_By: variance || k === 9 ? null : "Director of Lending (demo)" });
  });
  ins("loan", loans);
  ins("ned_crosswalk", cw);
  ins("loan_transaction", txns);
  ins("loan_snapshot", snaps);
  ins("industry_mapping", indmap);

  // pipeline
  const pipe: any[] = [];
  const stages = [["Application", 1], ["Underwriting", 2], ["Application Decision", 3], ["Completed", 4], ["Declined", 5], ["Withdrawn", 6]] as [string, number][];
  for (const [y, m] of months(2026, 3, 2026, 9)) {
    for (const [s, o] of stages) {
      const c = s === "Application" ? ri(18, 34) : s === "Underwriting" ? ri(8, 16) : s === "Application Decision" ? ri(4, 9) : s === "Completed" ? ri(3, 8) : ri(2, 7);
      pipe.push({ Snapshot_Date: monthEnd(y, m) > "2026-09-30" ? "2026-09-30" : monthEnd(y, m), Stage: s, Stage_Order: o, Application_Count: c, Requested_Amount: c * ri(18, 42) * 1000, Source_System: "LoanWell" });
    }
  }
  ins("pipeline_snapshot", pipe);
  const hist: any[] = [];
  for (let a = 1; a <= 90; a++) {
    const id = `APP-${pad(a, 4)}`;
    let d = `2026-${pad(ri(1, 7), 2)}-${pad(ri(1, 27), 2)}`;
    const amt = ri(8, 120) * 1000;
    const path = ["Application", "Underwriting", "Application Decision", "Completed"];
    for (let k = 0; k < path.length; k++) {
      const next = addDays(d, ri(3, 18));
      hist.push({ Application_ID: id, Stage: path[k], Entered_At: d, Exited_At: k < path.length - 1 ? next : null, Requested_Amount: amt, Outcome_Reason: null });
      d = next;
      if (rnd() < [0.35, 0.3, 0.25, 0][k]) {
        hist.push({ Application_ID: id, Stage: rnd() < 0.6 ? "Declined" : "Withdrawn", Entered_At: d, Exited_At: null, Requested_Amount: amt, Outcome_Reason: pick(["Incomplete documents", "Cash-flow capacity", "Applicant withdrew", "Referred to TA first"]) });
        break;
      }
    }
  }
  ins("stage_history", hist);

  // ── CRP ──
  const crp: any[] = [];
  const crpRow = (period: string, start: string, end: string, basis: string, scale = 1) => {
    const r: any = { Reporting_Period: period, Period_Start: start, Period_End: end, Period_Basis: basis, Funding_Area: "Small business capital access", Economic_Development: "Yes", Race_Selection: "Single-select", Source_Document: `Smartsheet confirmation ${period}.pdf (demo)` };
    r.Enrolled = Math.round(ri(10, 28) * scale);
    r.Active_Participants = Math.round(ri(40, 90) * Math.min(scale, 3));
    r.Financial_Coaching = Math.round(ri(6, 20) * scale);
    r.Small_Biz_Training = Math.round(ri(8, 30) * scale);
    r.Small_Biz_Funded = Math.round(ri(1, 5) * scale);
    r.Businesses_Established = Math.round(ri(0, 2) * scale);
    r.Businesses_Expanded = Math.round(ri(0, 3) * scale);
    r.Loans_Originated = r.Small_Biz_Funded;
    r.Loan_Dollars = r.Loans_Originated * ri(12, 40) * 1000;
    r.Jobs_Created = Math.round(ri(1, 8) * scale);
    r.Jobs_Retained = Math.round(ri(3, 15) * scale);
    const races = ["AmericanIndianAlaskaNative", "Asian", "BlackAfricanAmerican", "NativeHawaiianPacificIslander", "White", "HispanicLatino", "TwoorMoreRaces", "Other", "Unknown"];
    let left = r.Enrolled;
    races.forEach((k, idx) => {
      const v = idx === 2 ? Math.round(left * 0.7) : idx === races.length - 1 ? left : Math.min(left, ri(0, 2));
      r[`Race_${k}`] = v;
      left -= v;
    });
    let cl = r.Enrolled;
    ["King", "Pierce", "Snohomish", "Clark", "Spokane", "Yakima", "Other", "Unknown"].forEach((c, idx) => {
      const v = idx === 0 ? Math.round(cl * 0.62) : idx === 7 ? cl : Math.min(cl, ri(0, 3));
      r[`County_${c}`] = v;
      cl -= v;
    });
    r.Program_Highlights = basis === "Period activity" ? pick(["Cohort graduation with loan-readiness reviews", "Strong turnout at financial coaching clinics", "Two businesses opened storefronts", "New referral partnership with library branches"]) : null;
    r.Program_Challenges = basis === "Period activity" ? pick(["Documentation delays for applicants", "Staff capacity during loan season", "Scheduling conflicts for evening sessions", null]) : null;
    return r;
  };
  crp.push(crpRow("Baseline (program start)", "2024-01-01", "2024-12-31", "Baseline", 6));
  for (const [y, m] of months(2025, 1, 2026, 8)) {
    if ((y === 2025 && (m === 4 || m === 9)) || (y === 2026 && m === 2)) continue; // missing confirmations
    crp.push(crpRow(`${new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${y}`, `${y}-${pad(m, 2)}-01`, monthEnd(y, m), "Period activity"));
  }
  crp.push(crpRow("2025 cumulative", "2025-01-01", "2025-12-31", "Cumulative", 9));
  ins("crp_report", crp);

  // ── CRSP ──
  const crsp: any[] = [];
  const crspBiz = Array.from({ length: 85 }, (_, i) => ({ id: `CB-${pad(i + 1)}`, ind: pick(["722", "448", "541", "621", "238", "711", "812", "484"]), gender: pick(["Woman", "Man", "Woman", "Man", "Non-binary", "Prefer not to say"]), race: pick(["Black/African American", "Black/African American", "Black/African American", "Asian", "Hispanic/Latino", "Two or more", "White"]), lang: pick(["English", "English", "English", "Amharic", "Somali", "Spanish", "Tigrinya"]), ref: pick(["Denkyem newsletter", "Library", "Word of mouth", "City referral", "Third Thursday", "Social media"]) }));
  let cn = 1;
  const visits: Record<string, number> = {};
  for (let k = 0; k < 268; k++) {
    const b = pick(crspBiz);
    visits[b.id] = (visits[b.id] || 0) + 1;
    const [y, m] = pick(months(2025, 3, 2026, 9));
    const day = ri(1, 28);
    crsp.push({ Service_Record_ID: `CR-${pad(cn++, 4)}`, Service_Date: `${y}-${pad(m, 2)}-${pad(day, 2)}`, Business_ID: b.id, Visit_Number: visits[b.id], Industry_Code: b.ind, Business_Size: pick(["0–1", "2–5", "6–10", "11–25"]), Service_Provided: pick(["Business plan review", "Loan readiness", "Bookkeeping setup", "Marketing strategy", "Licensing & permits", "Lease negotiation"]), Desired_Outcome: pick(["Access capital", "Grow revenue", "Formalize business", "Hire staff"]), Referral_Source: b.ref, Duration_Minutes: pick([30, 45, 60, 60, 90, 120]), Duration_Original: "Session Duration .1 (hours) mapped to minutes", Language: b.lang, Gender: b.gender, Race_Ethnicity: b.race, Previous_Year_Revenue: ri(10, 400) * 1000, Business_Legal_Name: `Demo CRSP Business ${b.id.slice(3)}` });
  }
  ins("crsp_service", crsp);

  // ── Membership, campaigns, tags ──
  const mem: any[] = [];
  let full = 180,
    prem = 42,
    free = 610;
  for (const [y, m] of months(2025, 1, 2026, 9)) {
    const jf = ri(8, 22),
      cf = ri(3, 10),
      jp = ri(2, 8),
      cp = ri(0, 4),
      jfree = ri(20, 55);
    full += jf - cf;
    prem += jp - cp;
    free += jfree - ri(5, 15);
    const pe = monthEnd(y, m);
    mem.push({ Period_End: pe, Tier: "Denkyem Fam Full Access", Members_At_Period_End: full, New_Joins: jf, Cancellations: cf, Active_Definition: null });
    mem.push({ Period_End: pe, Tier: "Premium Member Monthly", Members_At_Period_End: prem, New_Joins: jp, Cancellations: cp, Active_Definition: null });
    mem.push({ Period_End: pe, Tier: "Free", Members_At_Period_End: free, New_Joins: jfree, Cancellations: null, Active_Definition: null });
  }
  ins("membership_snapshot", mem);
  const camps = months(2025, 4, 2026, 9).map(([y, m], i) => {
    const sent = ri(2600, 4200);
    const del = sent - ri(20, 80);
    return { Campaign_ID: `C-${pad(i + 1)}`, Name: `${new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" })} Newsletter`, Send_Date: `${y}-${pad(m, 2)}-${pad(ri(8, 28), 2)}`, Sent: sent, Delivered: del, Unique_Opens: Math.round(del * (0.31 + rnd() * 0.14)), Unique_Clicks: Math.round(del * (0.03 + rnd() * 0.04)), Total_Opens: Math.round(del * 0.62), Total_Clicks: Math.round(del * 0.09), Unsubscribes: ri(3, 18), Hard_Bounces: ri(2, 15) };
  });
  ins("campaign", camps);
  ins("crm_tag_summary", [
    ["Loan interest", 640],
    ["Growth Lab member", 222],
    ["Third Thursday attendee", 1180],
    ["Investor / lender", 96],
    ["Pit Crew provider", 41],
    ["Drop In visitor", 318],
  ].map(([t, n]) => ({ As_Of: "2026-09-30", Tag: t, Raw_Tag: String(t).toLowerCase().replace(/ /g, "-"), Distinct_Contacts: n })));

  // ── Fundraising ──
  const opps: any[] = [];
  const stagesF = ["Prospect", "Cultivation", "Proposal submitted", "Committed", "Committed", "Committed", "Declined", "Cultivation", "Proposal submitted", "Committed"];
  for (let i = 1; i <= 18; i++) {
    const stage = pick(stagesF);
    const inst = pick(["Grant", "Grant", "Donation", "Investment", "Promissory note"]);
    const req = ri(2, 50) * 5000;
    opps.push({ Opportunity_ID: `F-${pad(i)}`, Funder: `Demo ${inst === "Grant" ? "Foundation" : inst === "Investment" ? "Impact Investor" : inst === "Promissory note" ? "Note Holder" : "Donor"} ${String.fromCharCode(64 + i)}`, Instrument_Type: inst, Purpose_Restriction: pick(["Loan capital", "General operating", "Program — Growth Lab", "Loan loss reserve", "TA capacity"]), Owner: pick(["Executive Director", "Strategic Operations", "Advancement"]), Stage: stage, Requested_Amount: req, Probability: stage === "Committed" || stage === "Declined" ? null : pick([20, 40, 60, 75]), Expected_Close: `2026-${pad(ri(9, 12), 2)}-${pad(ri(1, 28), 2)}`, Committed_Amount: stage === "Committed" ? Math.round(req * (0.6 + rnd() * 0.4)) : null, Committed_Date: stage === "Committed" ? `${pick([2025, 2026])}-${pad(ri(1, 7), 2)}-${pad(ri(1, 28), 2)}` : null, Next_Action: stage === "Declined" ? null : pick(["Send impact summary", "Schedule site visit", "Submit LOI", "Board introduction", "Quarterly report due"]), Next_Action_Date: stage === "Declined" ? null : `2026-${pad(ri(9, 11), 2)}-${pad(ri(1, 28), 2)}`, Notes: null });
  }
  ins("fundraising_opportunity", opps);
  const rec: any[] = [];
  let rn = 1;
  opps.filter((o) => o.Committed_Amount).forEach((o) => {
    const parts = ri(1, 3);
    for (let k = 0; k < parts; k++) {
      const d = addDays(o.Committed_Date, 20 + k * 60);
      if (d > "2026-09-28") break;
      rec.push({ Receipt_ID: `R-${pad(rn++)}`, Opportunity_ID: o.Opportunity_ID, Date: d, Amount: Math.round(o.Committed_Amount / parts) });
    }
  });
  ins("fundraising_receipt", rec);

  // ── Finance statements (Jan–Aug 2026) ──
  const fin: any[] = [];
  const inc = [["4000", "Grants & contributions", 120000], ["4100", "Loan interest income", 14000], ["4200", "Program fees", 6000], ["4300", "Investment income", 2500]];
  const exp = [["5000", "Salaries & benefits", 78000], ["5100", "Program expenses", 22000], ["5200", "Professional services", 9000], ["5300", "Occupancy", 5500], ["5400", "Loan loss provision", 4000], ["5500", "Interest expense", 3200]];
  const ytd: Record<string, number> = {};
  let cash = 1850000,
    loansRec = 2900000;
  for (const [y, m] of months(2026, 1, 2026, 8)) {
    const period = `${y}-${pad(m, 2)}`;
    const meta = { Entity: "Denkyem Co-op (demo)", Period: period, Basis: "Accrual", Statement_Version: "Final v1", Approved_Date: addDays(monthEnd(y, m), ri(10, 20)) };
    let ti = 0,
      te = 0;
    for (const [code, name, base] of inc) {
      const v = Math.round((base as number) * (0.6 + rnd() * 0.9));
      ytd[code as string] = (ytd[code as string] || 0) + v;
      ti += v;
      fin.push({ Statement_Type: "Profit & Loss", ...meta, Line_Code: code, Line_Name: name, Parent_Category: "Income", Line_Kind: "Detail", Month_Amount: v, YTD_Amount: ytd[code as string] });
    }
    ytd.TI = (ytd.TI || 0) + ti;
    fin.push({ Statement_Type: "Profit & Loss", ...meta, Line_Code: "4999", Line_Name: "Total for Income", Parent_Category: "Income", Line_Kind: "Total", Month_Amount: ti, YTD_Amount: ytd.TI });
    for (const [code, name, base] of exp) {
      const v = Math.round((base as number) * (0.85 + rnd() * 0.3));
      ytd[code as string] = (ytd[code as string] || 0) + v;
      te += v;
      fin.push({ Statement_Type: "Profit & Loss", ...meta, Line_Code: code, Line_Name: name, Parent_Category: "Expense", Line_Kind: "Detail", Month_Amount: v, YTD_Amount: ytd[code as string] });
    }
    ytd.TE = (ytd.TE || 0) + te;
    fin.push({ Statement_Type: "Profit & Loss", ...meta, Line_Code: "5999", Line_Name: "Total for Expenses", Parent_Category: "Expense", Line_Kind: "Total", Month_Amount: te, YTD_Amount: ytd.TE });
    cash += ti - te + ri(-40000, 40000);
    loansRec += ri(-30000, 60000);
    const grantsRec = ri(80000, 220000),
      other = ri(40000, 70000);
    const notes = 2600000 + ri(-50000, 50000),
      accrued = ri(30000, 70000),
      deferred = ri(100000, 260000);
    const ta = cash + loansRec + grantsRec + other;
    const tl = notes + accrued + deferred;
    const restricted = Math.round((ta - tl) * 0.45);
    const unrestricted = ta - tl - restricted;
    const bsl = (code: string, name: string, cat: string, kind: string, v: number) => fin.push({ Statement_Type: "Balance Sheet", ...meta, Line_Code: code, Line_Name: name, Parent_Category: cat, Line_Kind: kind, Month_Amount: v, YTD_Amount: null });
    bsl("1000", "Cash & equivalents", "Asset", "Detail", cash);
    bsl("1200", "Loans receivable, net", "Asset", "Detail", loansRec);
    bsl("1300", "Grants receivable", "Asset", "Detail", grantsRec);
    bsl("1500", "Other assets", "Asset", "Detail", other);
    bsl("1999", "Total for Assets", "Asset", "Total", ta);
    bsl("2000", "Notes payable", "Liability", "Detail", notes);
    bsl("2100", "Accrued liabilities", "Liability", "Detail", accrued);
    bsl("2200", "Deferred revenue", "Liability", "Detail", deferred);
    bsl("2999", "Total for Liabilities", "Liability", "Total", tl);
    bsl("3000", "Net assets without restrictions", "Equity", "Detail", unrestricted);
    bsl("3100", "Net assets with restrictions", "Equity", "Detail", restricted);
    bsl("3999", "Total for Equity", "Equity", "Total", ta - tl);
  }
  ins("finance_line", fin);
  ins(
    "promissory_note",
    Array.from({ length: 7 }, (_, i) => {
      const start = `${pick([2022, 2023, 2024, 2025])}-${pad(ri(1, 12), 2)}-01`;
      const principal = ri(5, 60) * 10000;
      const mat = addDays(start, 365 * pick([3, 4, 5]));
      return { Note_ID: `N-${pad(i + 1)}`, Lender: `Demo Note Holder ${String.fromCharCode(65 + i)}`, Principal_Borrowed: principal, Interest_Rate: pick([0, 1, 2, 2.5, 3]), Start_Date: start, Maturity_Date: mat, Schedule: pick(["Interest-only, balloon at maturity", "Quarterly interest", "Annual interest"]), Next_Payment_Date: `2026-${pad(ri(10, 12), 2)}-${pad(ri(1, 28), 2)}`, Amount_Due: Math.round(principal * 0.006), Remaining_Balance: principal, Document_Ref: `Note agreement N-${pad(i + 1)} (demo)` };
    }),
  );

  // ── Surveys & journeys ──
  const surv: any[] = [];
  const insts = [
    ["SV-WS", "Growth Lab workshop feedback", "Workshops", 1, 5],
    ["SV-LN", "Loan experience survey", "Lending", 1, 10],
    ["SV-DI", "Drop In and CoLab feedback", "Office hours", 1, 5],
  ] as [string, string, string, number, number][];
  for (const [id, name, cat, lo, hi] of insts) {
    for (const [y, q] of [[2025, 2], [2025, 3], [2025, 4], [2026, 1], [2026, 2], [2026, 3]]) {
      const n = ri(14, 60);
      surv.push({ Instrument_ID: id, Instrument_Name: name, Service_Category: cat, Period: `Q${q} ${y}`, Period_End: monthEnd(y, q * 3), Scale_Min: lo, Scale_Max: hi, Responses: n, Mean_Score: r2(hi * (0.78 + rnd() * 0.17)), Starts: Math.round(n * (1.15 + rnd() * 0.5)), Eligible_Population: Math.round(n * (2 + rnd() * 2)) });
    }
  }
  ins("survey_summary", surv);
  const touch: any[] = [];
  let tpn = 1;
  biz.slice(0, 70).forEach((b, i) => {
    const depth = rnd();
    const steps = ["Event / program", "TA / Pit Crew", "Application", "Funded"].slice(0, depth < 0.3 ? 1 : depth < 0.55 ? 2 : depth < 0.75 ? 3 : 4);
    let d = `2025-${pad(ri(1, 10), 2)}-${pad(ri(1, 28), 2)}`;
    steps.forEach((s) => {
      touch.push({ Touchpoint_ID: `J-${pad(tpn++, 4)}`, Business_ID: b.Business_ID, Stage: s, Date: d, Match_Method: pick(["Approved identifier", "Approved identifier", "Email match (reviewed)", "Manual review"]), Match_Confidence: rnd() < 0.08 ? "Low" : rnd() < 0.3 ? "Medium" : "High" });
      d = addDays(d, ri(14, 90));
    });
  });
  ins("journey_touchpoint", touch);

  // ── Demo review queue + a failed refresh, so workflows are visible ──
  const demoCtx = { user: "Program staff (demo)", role: "program" as const, demo: true };
  store.createRecord(demoCtx, "fact_service_delivery", { Service_Record_ID: "S-DRAFT-01", Date: "2026-09-30", Program_ID: "P-PC", Geography_ID: "G-02", Participant_Group_ID: "PG-1", Service_Type: "1:1 advising", Session_Count: 18, Service_Hours: 22.5, Aggregation_Basis: "Aggregate", Participant_Count: 12 }, true);
  store.createRecord(demoCtx, "fact_events", { Event_ID: "E-DRAFT-01", Event_Series: "Third Thursday", Event_Name: "Third Thursday — October 2026", Event_Type: "Recurring", Date: "2026-10-15", Program_ID: "P-TT", Geography_ID: "G-01", Registrations: 120, Attendance_Basis: "Registration only" }, false);
  store.createRecord(demoCtx, "outcome_observation", { Observation_ID: "O-SUB-01", Metric_ID: "JOBS_CREATED", Metric_Version: "1", Program_ID: "P-GL", Period_Start: "2026-07-01", Period_End: "2026-09-30", Geography_ID: "G-01", Value: 9, Evidence_Ref: "Q3 follow-up survey" }, true);
  store.db
    .prepare(`INSERT INTO import_batches (dataset, file_name, checksum, mapping, headers, raw_rows, row_count, status, failure_reason, is_demo, created_by, created_at, issues) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run("campaign", "activecampaign_campaigns_2026-09-30.json", "demo-failed-refresh", "{}", "[]", "[]", 0, "failed", "ActiveCampaign API returned pages 1–3 of 7 then timed out; pagination incomplete, so no rows were published. Last approved data retained.", 1, "Scheduled pull (demo)", new Date(Date.now() - 86400000).toISOString(), JSON.stringify([{ row: 0, severity: "error", message: "Pagination incomplete: 3 of 7 pages retrieved; source count 412 vs retrieved 180" }]));

  store.createView({ user: "Administrator (demo)", role: "admin", demo: true }, { name: "Quarterly funder brief", audience: "Funder", sections: ["impact", "crp", "engagement"] });
  store.createView({ user: "Administrator (demo)", role: "admin", demo: true }, { name: "Board lending & finance review", audience: "Board", sections: ["lending", "finance", "fundraising"] });
  store.db.prepare("UPDATE report_views SET release_status='approved_internal', approved_by='Leadership (demo)', approved_at=? WHERE name='Board lending & finance review' AND is_demo=1").run(at);

  store.setSetting({ user: "system", role: "admin", demo: true }, "demo_seeded_at", at);
  void loanSizeBucket;
}
