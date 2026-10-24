import { CheckCircle2, Circle, PlugZap, ExternalLink } from "lucide-react";
import { useDash, PageHeader, Card, ErrorState, SimpleTable, Pill, Callout, Empty, DownloadLink } from "@/components/kit";
import { money, dateLabel } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const FIELD_MAP = [
  ["Account Number / Loan #", "Source_Account_Number", "Loan identifier", "Active Loan Report · loan ID"],
  ["Loan Fund Name / Subfund", "Funding_Source / Subfund", "Fund hierarchy", "Funding-source tag (Active Loan Report)"],
  ["Outstanding Principal", "Outstanding_Principal", "Principal only", "Aging Report: Days Range · balance"],
  ["Outstanding Interest / Fees", "Outstanding_Interest / _Fees", "Kept separate from principal", "Trial Balance / RBF Summary"],
  ["Number of Days Delinquent", "Days_Delinquent", "Provisional until rules approved", "Aging buckets Current · 1–30 · 31–60 · 61–90 · 91–120 · 120+"],
  ["Transaction Type / Status", "Transaction_Type / _Status", "Must follow status matrix", "Payment History · type, status"],
  ["(new) Transaction ID", "Source_Transaction_ID", "Required for reversal linking", "Payment History · Payment ID"],
  ["Disbursement", "Disbursement transaction", "One transfer per loan", "Fund Transfers export"],
  ["Loan Status", "Loan_Status", "Actual status — never inferred from balance", "Pending first export"],
];

export default function Ned() {
  const { data: d, isLoading, error } = useDash<any>("ned");
  if (error) return <ErrorState error={error} />;
  const s = d?.summary;
  return (
    <div>
      <PageHeader
        kicker="Lending · system migration"
        title="LoanWell → NED migration"
        description="NED was selected in July 2026. LoanWell stays the legacy authority until each loan is reconciled and signed off in the crosswalk. The live NED connector stays disabled until manual import is proven and the export contract is confirmed."
        actions={<DownloadLink href="/api/export/dataset/ned_crosswalk" testId="download-crosswalk">Crosswalk CSV</DownloadLink>}
      />
      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Loans in crosswalk", s.total],
              ["Matched", s.matched],
              ["Variance", s.variance],
              ["Pending", s.pending],
              ["Signed off", s.signedOff],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
            <Card title="Loan-by-loan reconciliation" subtitle={`Principal per LoanWell ${money(s.principalLW)} · per NED ${money(s.principalNED)} · ${s.authorityNED} loans under NED authority`}>
              {d.rows.length ? (
                <SimpleTable
                  dense
                  testId="table-crosswalk"
                  columns={[
                    { key: "id", label: "Loan", render: (r) => <span className="font-medium">{r.Canonical_Loan_ID}</span> },
                    { key: "lw", label: "LoanWell", render: (r) => r.LoanWell_Account },
                    { key: "ned", label: "NED", render: (r) => r.NED_Account ?? "—" },
                    { key: "cut", label: "Cutover", render: (r) => dateLabel(r.Cutover_Date) },
                    { key: "auth", label: "Authority", render: (r) => <Pill tone={r.Authority === "NED" ? "gold" : "muted"}>{r.Authority}</Pill> },
                    { key: "plw", label: "Principal (LW)", align: "right", render: (r) => money(r.Principal_LoanWell) },
                    { key: "pned", label: "Principal (NED)", align: "right", render: (r) => money(r.Principal_NED) },
                    { key: "var", label: "Variance", align: "right", render: (r) => (r.variance ? <span className="font-semibold text-red-700 dark:text-red-400">{money(r.variance)}</span> : "—") },
                    { key: "st", label: "Status", render: (r) => <Pill tone={r.Match_Status === "Matched" ? "green" : r.Match_Status === "Variance" ? "red" : "amber"}>{r.Match_Status}</Pill> },
                    { key: "note", label: "Exception / sign-off", render: (r) => <span className="text-xs text-muted-foreground">{r.Exception_Note ?? (r.Signed_Off_By ? `Signed off · ${r.Signed_Off_By}` : "—")}</span> },
                  ]}
                  rows={d.rows}
                />
              ) : (
                <Empty>Import the migration crosswalk (Import &amp; reconcile → NED migration crosswalk).</Empty>
              )}
            </Card>
            <div className="space-y-4">
              <Card title="Migration checklist">
                <ol className="space-y-2.5">
                  {d.checklist.map((c: any, i: number) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div>
                        <div className={c.done ? "" : "font-medium"}>{c.step}</div>
                        <div className="text-xs text-muted-foreground">{c.owner}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
              <Card title="NED adapter">
                <div className="flex items-start gap-3">
                  <PlugZap className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">{d.adapterEnabled ? "Enabled" : "Disabled — manual import only"}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Turns on in Administration → Rules after the export/API contract, field mapping and overlap-window reconciliation are approved. Credentials are never stored in this app.</p>
                    <a href="https://docs.google.com/document/d/1FGOkE858eoogJGS4yXFrFUzgkxgRyNn_/edit" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      NED user manual (shared Sept 24) <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="mt-4">
            <Card title="Proposed field crosswalk" subtitle="LoanWell legacy field → canonical contract → NED source report named in the NED user manual. Exact NED column headers are confirmed from the first real export.">
              <SimpleTable columns={[{ key: "0", label: "LoanWell field" }, { key: "1", label: "Canonical field" }, { key: "2", label: "Rule" }, { key: "3", label: "NED field", render: (r) => <Pill tone="amber">{r[3]}</Pill> }]} rows={FIELD_MAP.map((r) => ({ ...r }))} />
            </Card>
          </div>
          <div className="mt-4">
            <Card title="What the NED manual confirms" subtitle="Denkyem Co-op × Ned Platform User Manual">
              <ul className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
                {[
                  "About 130 legacy loans migrate straight into active repaying status — balances and terms only, no repayment history. LoanWell stays the history source for those loans.",
                  "Two products: Revenue-Based Business Loan ($10k–$200k, 36 months, 1–5% revenue share, $100/month floor, repayment capped at 1.1×) and Legacy Fixed-Fee (principal × 1.1 ÷ 36, existing loans only).",
                  "Portfolio CSVs come from ACTIVE → Generate Reports: Active Loan Report, Aging Report (Days Range or Simple) and Trial Balance / RBF Summary.",
                  "Per-borrower CSVs: Repayments / Payment History (with Payment ID and status), Fund Transfers, Cash Flow, Bank Transactions, Business Info, Activity Log.",
                  "The Days Range aging buckets (Current, 1–30, 31–60, 61–90, 91–120, 120+) are the manual's recommended match for Denkyem's delinquency structure.",
                  "Delinquency notices follow the credit policy: Day 31 first notice, Day 61 second, Day 91 final, Day 121 formal default.",
                ].map((x) => (
                  <li key={x} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--chart-2))]" /> {x}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <div className="mt-4">
            <Callout title="Counting rule during overlap">A loan that appears in both systems is counted once. Before its cutover date the LoanWell row is authoritative; on or after cutover, the NED row is — and only once the crosswalk names NED as the authority. Non-authoritative duplicates are dropped and counted in the exclusions note.</Callout>
          </div>
        </>
      )}
    </div>
  );
}
