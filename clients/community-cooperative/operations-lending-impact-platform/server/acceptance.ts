// Brief Section 13 acceptance tests, executed against the real metric engine and an
// isolated in-memory store. Results are shown in Administration → Acceptance tests.
import { Store, type Ctx, HttpError } from "./storage";
import * as M from "./metrics";
import { financeDashboard, impactDashboard, crspDashboard, lendingDashboard } from "./dashboards";
import { DOMAINS, ROLES } from "@shared/contracts";

export interface TestResult {
  id: string;
  name: string;
  expected: string;
  observed: string;
  pass: boolean;
}

const L = (over: Partial<M.LendingInputs>): M.LendingInputs => ({ loans: [], txns: [], snapshots: [], pipeline: [], stages: [], industry: [], crosswalk: [], ...over });
const loan = (id: string, acct: string, status = "Active", extra: any = {}) => ({ Loan_ID: id, Source_System: "LoanWell", Source_Account_Number: acct, Loan_Status: status, ...extra });
const snap = (acct: string, date: string, p: number, extra: any = {}) => ({ Source_Account_Number: acct, Source_System: "LoanWell", As_Of_Date: date, Outstanding_Principal: p, ...extra });
const tx = (type: string, status: string, acct: string, extra: any = {}) => ({ Transaction_Type: type, Transaction_Status: status, Source_Account_Number: acct, Transaction_Date: "2026-03-10", Disbursement_Amount: 0, Principal_Paid: 0, Interest_Paid: 0, Fees_Paid: 0, Total_Payment_Amount: 0, ...extra });

export function runAcceptance(): { ranAt: string; results: TestResult[]; passed: number; total: number } {
  const results: TestResult[] = [];
  const t = (id: string, name: string, expected: string, fn: () => [boolean, string]) => {
    try {
      const [pass, observed] = fn();
      results.push({ id, name, expected, observed, pass });
    } catch (e: any) {
      results.push({ id, name, expected, observed: `Error: ${e.message}`, pass: false });
    }
  };

  t("T01", "Principal vs total", "Loan with principal 100, interest 10, fees 5 contributes 100", () => {
    const r = M.portfolioPrincipal(L({ loans: [loan("L1", "A1")], snapshots: [snap("A1", "2026-03-31", 100, { Outstanding_Interest: 10, Outstanding_Fees: 5, Outstanding_Balance: 115 })] }));
    return [r.value === 100, `Portfolio principal = ${r.value}`];
  });
  t("T02", "Actual status", "Inactive loan with positive balance is not Active", () => {
    const r = M.portfolioPrincipal(L({ loans: [loan("L1", "A1"), loan("L2", "A2", "Charged off")], snapshots: [snap("A1", "2026-03-31", 100), snap("A2", "2026-03-31", 500)] }));
    return [r.value === 100 && r.n === 1, `Principal ${r.value}, active loans ${r.n}, excluded positive ${(r as any).excludedPositive}`];
  });
  t("T03", "Multiple disbursements", "Two draws → 1 funded loan, 2 disbursements", () => {
    const r = M.fundedLoans(L({ loans: [loan("L1", "A1")], txns: [tx("disbursement", "completed", "A1", { Disbursement_Amount: 600 }), tx("disbursement", "completed", "A1", { Disbursement_Amount: 400, Transaction_Date: "2026-04-02" })] }), null);
    return [r.fundedLoanCount === 1 && r.disbursementCount === 2 && r.disbursementAmount === 1000, `${r.fundedLoanCount} funded, ${r.disbursementCount} disbursements, $${r.disbursementAmount}`];
  });
  t("T04", "Transaction failures", "Failed/error/N/A rows quarantined per status matrix", () => {
    const r = M.fundedLoans(L({ loans: [loan("L1", "A1")], txns: [tx("disbursement", "completed", "A1", { Disbursement_Amount: 500 }), tx("disbursement", "failed", "A1", { Disbursement_Amount: 500 }), tx("disbursement", "error", "A1", { Disbursement_Amount: 500 }), tx("disbursement", "N/A", "A1", { Disbursement_Amount: 500 })] }), null);
    return [r.disbursementAmount === 500 && r.quarantined === 3, `$${r.disbursementAmount} counted, ${r.quarantined} quarantined`];
  });
  t("T05", "Reversals", "Linked reversal nets once; failed-payment pair creates no cash", () => {
    const txns = [
      tx("payment", "completed", "A1", { Source_Transaction_ID: "P1", Principal_Paid: 80, Interest_Paid: 20, Total_Payment_Amount: 100 }),
      tx("payment_reversal", "completed", "A1", { Source_Transaction_ID: "R1", Reversal_Of: "P1" }),
      tx("payment_reversal", "completed", "A1", { Source_Transaction_ID: "R1b", Reversal_Of: "P1" }),
      tx("payment", "completed", "A1", { Source_Transaction_ID: "P2", Principal_Paid: 50, Total_Payment_Amount: 50 }),
      tx("payment", "failed", "A1", { Source_Transaction_ID: "P3", Principal_Paid: 70, Total_Payment_Amount: 70 }),
      tx("payment_reversal", "completed", "A1", { Source_Transaction_ID: "R3", Reversal_Of: "P3" }),
    ];
    const r = M.payments(L({ loans: [loan("L1", "A1")], txns }), null);
    return [r.total === 50 && r.reversalsApplied === 1, `Net payments $${r.total}; reversals applied ${r.reversalsApplied}, quarantined ${r.reversalsQuarantined}`];
  });
  t("T06", "Snapshot handling", "Several months never sum one loan's successive balances", () => {
    const inp = L({ loans: [loan("L1", "A1")], snapshots: [snap("A1", "2026-01-31", 300), snap("A1", "2026-02-28", 200), snap("A1", "2026-03-31", 100)] });
    const all = M.portfolioPrincipal(inp);
    const feb = M.portfolioPrincipal(inp, "2026-02-28");
    return [all.value === 100 && feb.value === 200, `Latest ${all.value} (not 600); as of Feb ${feb.value}`];
  });
  t("T07", "Cutover", "Loan in LoanWell and NED counted once under crosswalk authority", () => {
    const r = M.portfolioPrincipal(
      L({
        loans: [loan("L1", "A1")],
        crosswalk: [{ Canonical_Loan_ID: "L1", LoanWell_Account: "A1", NED_Account: "N1", Authority: "NED", Cutover_Date: "2026-03-01", Match_Status: "Matched" }],
        snapshots: [snap("A1", "2026-03-31", 100), snap("N1", "2026-03-31", 101, { Source_System: "NED" })],
      }),
    );
    return [r.value === 101 && r.n === 1, `Principal ${r.value} from 1 loan; ${(r as any).dropped} non-authoritative row ignored`];
  });

  // Store-backed tests
  const s = new Store(":memory:");
  const admin: Ctx = { user: "Test admin", role: "admin", demo: false };
  const staff: Ctx = { user: "Test staff", role: "program", demo: false };
  const reviewer: Ctx = { user: "Test reviewer", role: "program", demo: false };
  const at = new Date().toISOString();
  s.insertDemo("dim_program", [{ Program_ID: "P1", Program_Name: "Test program", Status: "Active" }], null, at);
  s.db.prepare("UPDATE records SET is_demo=0").run();
  s.invalidateRefs();

  t("T08", "Distinct population", "10 service rows for 2 businesses → 10 services, 2 businesses", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ Service_Record_ID: `S${i}`, Business_ID: i % 2 ? "B1" : "B2", Service_Date: "2026-03-05", Duration_Minutes: 60 }));
    s.insertDemo("crsp_service", rows, null, at);
    s.db.prepare("UPDATE records SET is_demo=0").run();
    const d = crspDashboard(s, admin, {});
    const svc = d.kpis.find((k) => k.id === "crsp_services")!.value;
    const biz = d.kpis.find((k) => k.id === "crsp_businesses")!.value;
    return [svc === 10 && biz === 2, `${svc} services, ${biz} distinct businesses`];
  });
  t("T09", "Participant groups", "Four category groups never display as four verified people", () => {
    const d = impactDashboard(s, admin, {});
    const p = d.kpis.find((k) => k.id === "participants")!;
    return [p.value === null && p.status === "unavailable", `Participants served: ${p.value === null ? "Not available" : p.value} (${p.status})`];
  });
  t("T10", "Template isolation", "Demo/template rows never enter production reports", () => {
    const demoCount = (s.db.prepare("SELECT COUNT(*) n FROM records WHERE is_demo=1").get() as any).n;
    s.insertDemo("dim_program", [{ Program_ID: "PX", Program_Name: "Small Business Accelerator", Status: "Active" }], null, at);
    const prod = s.rows("dim_program", false).map((r) => r.Program_Name);
    return [!prod.includes("Small Business Accelerator") && demoCount === 0, `Production programs: ${prod.join(", ")}`];
  });
  t("T11", "Filters", "Program filter changes service metric; inapplicable filters disclosed", () => {
    s.insertDemo("dim_program", [{ Program_ID: "P3", Program_Name: "Second test program", Status: "Active" }], null, at);
    s.db.prepare("UPDATE records SET is_demo=0 WHERE dataset='dim_program' AND payload LIKE '%\"P3\"%'").run();
    s.invalidateRefs();
    s.insertDemo("fact_service_delivery", [
      { Service_Record_ID: "F1", Date: "2026-03-01", Program_ID: "P1", Service_Type: "x", Session_Count: 4, Service_Hours: 4, Aggregation_Basis: "Aggregate" },
      { Service_Record_ID: "F2", Date: "2026-03-01", Program_ID: "P3", Service_Type: "x", Session_Count: 6, Service_Hours: 6, Aggregation_Basis: "Aggregate" },
    ], null, at);
    s.db.prepare("UPDATE records SET is_demo=0 WHERE dataset='fact_service_delivery'").run();
    const all = impactDashboard(s, admin, {}).kpis.find((k) => k.id === "sessions")!.value;
    const p1 = impactDashboard(s, admin, { program: "P1" }).kpis.find((k) => k.id === "sessions")!.value;
    const fund = impactDashboard(s, admin, { fund: "X" }).kpis.find((k) => k.id === "sessions")!.inapplicableFilters;
    return [all === 10 && p1 === 4 && !!fund?.length, `All ${all}, P1 ${p1}; fund filter flagged: ${fund?.join(", ")}`];
  });
  t("T12", "Funds grain", "One allocation with three disbursements counted once", () => {
    const r = M.fundsSummary({ programs: [], geos: [], groups: [], services: [], events: [], outcomes: [], metricDefs: [], legacyFunds: [], allocations: [{ Allocation_ID: "A", Program_ID: "P1", Amount_Allocated: 1000, Date: "2026-01-01" }], disbursements: [100, 200, 300].map((x, i) => ({ Disbursement_ID: `D${i}`, Allocation_ID: "A", Amount_Disbursed: x, Date: "2026-02-01", Status: "Completed" })) });
    return [r.allocated === 1000 && r.disbursed === 600 && r.remaining === 400, `Allocated ${r.allocated}, disbursed ${r.disbursed}, remaining ${r.remaining}`];
  });
  t("T13", "Finance", "Month vs YTD distinct; totals not double-counted; balance sheet reconciles", () => {
    const base = { Entity: "Test", Basis: "Accrual", Statement_Version: "Final" };
    const rows = [
      { Statement_Type: "Profit & Loss", Period: "2026-02", Line_Code: "4000", Line_Name: "Grants", Parent_Category: "Income", Line_Kind: "Detail", Month_Amount: 100, YTD_Amount: 250 },
      { Statement_Type: "Profit & Loss", Period: "2026-02", Line_Code: "4999", Line_Name: "Total for Income", Parent_Category: "Income", Line_Kind: "Total", Month_Amount: 100, YTD_Amount: 250 },
      { Statement_Type: "Profit & Loss", Period: "2026-02", Line_Code: "5000", Line_Name: "Salaries", Parent_Category: "Expense", Line_Kind: "Detail", Month_Amount: 60, YTD_Amount: 120 },
      { Statement_Type: "Balance Sheet", Period: "2026-02", Line_Code: "1999", Line_Name: "Total for Assets", Parent_Category: "Asset", Line_Kind: "Total", Month_Amount: 1000 },
      { Statement_Type: "Balance Sheet", Period: "2026-02", Line_Code: "2999", Line_Name: "Total for Liabilities", Parent_Category: "Liability", Line_Kind: "Total", Month_Amount: 600 },
      { Statement_Type: "Balance Sheet", Period: "2026-02", Line_Code: "3999", Line_Name: "Total for Equity", Parent_Category: "Equity", Line_Kind: "Total", Month_Amount: 400 },
    ].map((r) => ({ ...base, ...r }));
    s.insertDemo("finance_line", rows, null, at);
    s.db.prepare("UPDATE records SET is_demo=0 WHERE dataset='finance_line'").run();
    const m = financeDashboard(s, admin, { basis: "month" });
    const y = financeDashboard(s, admin, { basis: "ytd" });
    const inc = m.kpis.find((k) => k.id === "income")!.value;
    const incY = y.kpis.find((k) => k.id === "income")!.value;
    return [inc === 100 && incY === 250 && m.balance.balanced === true, `Month income ${inc} (not 200), YTD ${incY}, balanced ${m.balance.balanced}`];
  });
  const csvRows = [{ Program_ID: "P9", Program_Name: "Imported program", Status: "Active" }];
  t("T14", "Idempotency", "Reimporting an identical batch adds no production rows", () => {
    const b1 = s.stageImport(staff, "dim_program", "programs.csv", "chk-1", ["Program_ID", "Program_Name", "Status"], csvRows);
    s.submitBatch(staff, b1.id);
    s.approveBatch(reviewer, b1.id, {});
    const before = s.rows("dim_program", false).length;
    const b2 = s.stageImport(staff, "dim_program", "programs.csv", "chk-1", ["Program_ID", "Program_Name", "Status"], csvRows);
    const after = s.rows("dim_program", false).length;
    return [b2.status === "duplicate" && before === after, `Second upload status "${b2.status}", rows ${before} → ${after}`];
  });
  t("T15", "Invalid import", "Missing headers / unknown FKs / drift → actionable errors, nothing published", () => {
    const drift = s.stageImport(staff, "fact_service_delivery", "svc.csv", "chk-2", ["Date", "Hours"], [{ Date: "2026-03-01", Hours: 2 }]);
    const fk = s.stageImport(staff, "fact_service_delivery", "svc2.csv", "chk-3", ["Service_Record_ID", "Date", "Program_ID", "Service_Type", "Session_Count", "Service_Hours", "Aggregation_Basis"], [{ Service_Record_ID: "Z1", Date: "2026-03-01", Program_ID: "NOPE", Service_Type: "x", Session_Count: 1, Service_Hours: 1, Aggregation_Basis: "Aggregate" }]);
    let blocked = false;
    s.submitBatch(staff, fk.id);
    try {
      s.approveBatch(reviewer, fk.id, {});
    } catch (e) {
      blocked = e instanceof HttpError && e.status === 422;
    }
    const fkMsg = fk.parsedIssues.find((i) => i.severity === "error")?.message ?? "";
    return [drift.status === "failed" && /Unknown Program/.test(fkMsg) && blocked, `Drift: ${drift.status}; FK: "${fkMsg.slice(0, 60)}…"; approval blocked ${blocked}`];
  });
  t("T16", "Review workflow", "Drafts invisible to reports; corrections keep prior approved version", () => {
    const { id } = s.createRecord(staff, "dim_program", { Program_ID: "P2", Program_Name: "Draft program", Status: "Active" }, false);
    const visibleDraft = s.rows("dim_program", false).some((r) => r.Program_ID === "P2");
    s.transition(staff, id, "submit");
    s.transition(reviewer, id, "approve");
    const corr = s.updateRecord(staff, id, { Program_ID: "P2", Program_Name: "Renamed program", Status: "Active" }, "Name correction", undefined, true);
    const stillOld = s.rows("dim_program", false).find((r) => r.Program_ID === "P2")?.Program_Name;
    s.transition(reviewer, corr.id, "approve");
    const now = s.rows("dim_program", false).find((r) => r.Program_ID === "P2")?.Program_Name;
    const hist = s.history(corr.id).map((h) => h.reviewStatus);
    return [!visibleDraft && stillOld === "Draft program" && now === "Renamed program" && hist.includes("superseded"), `Draft visible ${visibleDraft}; during review "${stillOld}"; after "${now}"; history ${hist.join(" → ")}`];
  });
  t("T17", "Permissions", "Funder cannot read raw borrower, contact, finance-note or demographic rows", () => {
    const blocked = Object.entries(DOMAINS).filter(([, d]) => !d.readRoles.includes("funder")).map(([k]) => k);
    const crsp = crspDashboard(s, { ...admin, role: "funder" }, {});
    return [blocked.length === Object.keys(DOMAINS).length && !ROLES.funder.restrictedAccess && crsp.demographics === null, `Funder blocked from ${blocked.length}/${Object.keys(DOMAINS).length} raw domains; restricted fields stripped; demographics ${crsp.demographics === null ? "withheld" : "exposed"}`];
  });
  t("T18", "Refresh failure", "Last approved values and timestamp remain; no fresh badge", () => {
    s.db.prepare("INSERT INTO import_batches (dataset, file_name, checksum, mapping, headers, raw_rows, row_count, status, failure_reason, is_demo, created_by, created_at) VALUES ('dim_program','x.csv','f','{}','[]','[]',0,'failed','Timeout',0,'sys',?)").run(at);
    const li = s.lastImports(false).dim_program;
    const rowsAfter = s.rows("dim_program", false).length;
    return [li.lastStatus === "failed" && !!li.lastSuccess && rowsAfter > 0, `Status ${li.lastStatus}; last success ${li.lastSuccess?.slice(0, 19)}; ${rowsAfter} approved rows retained`];
  });
  t("T19", "Unavailable metric", "Missing source shows unavailable, never zero", () => {
    const d = lendingDashboard(s, admin, {});
    const p = d.kpis.find((k) => k.id === "portfolio_principal")!;
    return [p.value === null && p.status === "unavailable", `Portfolio principal: ${p.value === null ? "Not available" : p.value} — ${p.reason}`];
  });
  t("T20", "Usability (end to end)", "Create program → enter service → submit → approve → export", () => {
    const { id: pid } = s.createRecord(staff, "dim_program", { Program_ID: "P5", Program_Name: "E2E program", Status: "Active" }, true);
    s.transition(reviewer, pid, "approve");
    const { id: sid } = s.createRecord(staff, "fact_service_delivery", { Service_Record_ID: "E2E-1", Date: "2026-03-15", Program_ID: "P5", Service_Type: "Workshop", Session_Count: 3, Service_Hours: 4.5, Aggregation_Basis: "Aggregate" }, true);
    s.transition(reviewer, sid, "approve");
    const k = impactDashboard(s, admin, { program: "P5" }).kpis.find((x) => x.id === "service_hours")!;
    return [k.value === 4.5, `Service hours for new program after approval: ${k.value}`];
  });

  s.db.close();
  return { ranAt: new Date().toISOString(), results, passed: results.filter((r) => r.pass).length, total: results.length };
}
