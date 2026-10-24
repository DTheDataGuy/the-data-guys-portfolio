import { PageHeader, Card, Pill, Callout } from "@/components/kit";
import { CheckCircle2, CircleDashed } from "lucide-react";

const REFRESH = [
  ["LoanWell loans, transactions & portfolio snapshot", "Lending team", "Weekly (Monday)", "Import & reconcile → Loans / Transactions / Snapshot. Check money control totals match the LoanWell export."],
  ["NED migrated accounts (when available)", "Lending team + NED contact", "Weekly during migration", "From ACTIVE → Generate Reports, download the Active Loan Report and Aging Report: Days Range; import them, then confirm each account in the crosswalk. Adapter stays off until cutover."],
  ["Program services, allocations, disbursements, outcomes", "Program staff", "Monthly by the 10th", "Enter data or import the monthly sheet. Submit; a second person approves."],
  ["Third Thursday, Drop In & CoLab, Growth Lab attendance", "Program / events", "After each event", "Record attendance as check-in or headcount. Registration-only events show no attendance."],
  ["CRP monthly report", "Program staff", "Monthly", "Enter the period-activity row with its source confirmation. Baselines and cumulative rows are tagged separately."],
  ["CRSP service log", "Program staff", "Monthly", "Import the CRSP workbook. Business IDs, not names, drive distinct counts."],
  ["Mighty Networks membership & ActiveCampaign campaigns", "Engagement owner", "Monthly", "Import period-end membership and campaign exports."],
  ["Fundraising pipeline & receipts", "Development / finance", "Bi-weekly", "Import the fundraising workbook; receipts come from finance."],
  ["Month-end P&L, Balance Sheet & promissory notes", "Robin (finance)", "Monthly after close", "Import finalized statements only. Close the period in Administration when done."],
];

const NEEDS = [
  ["NED", "The manual names the exports. Still need one sample of each (Active Loan Report, Aging Report: Days Range, Payment History, Fund Transfers), the migration file for the ~130 legacy loans, and the cutover date.", "Paige Woods · Lending team · Ned support"],
  ["Lending rules", "Approve the loan status mapping, transaction status matrix and transaction IDs, plus delinquency and revenue-based repayment rules.", "Lending team"],
  ["Industry review", "Confirm NAICS / industry categories for borrowers and CRSP businesses.", "Lending & program"],
  ["Fundraising", "July fundraising workbook to confirm column meanings and stages.", "Development"],
  ["Finance", "Robin's finalized P&L and Balance Sheet by month, plus the promissory-note master list.", "Robin"],
  ["Impact counting", "Unique-population methodology across programs (who counts as one person).", "Amanda · program"],
  ["CRP history", "Prior CRP reports and source confirmations to fill the coverage gaps.", "Program staff"],
  ["Surveys & membership", "Survey instruments, event check-in method and membership tier definitions.", "Amanda"],
  ["Access & release", "Named access owners per role and the external aggregation / release policy.", "Leadership"],
];

const STEPS = [
  ["Enter or import", "Staff enter records in guided forms or upload the source export. Drafts are never published."],
  ["Validate", "Required fields, allowed values, references, duplicates and snapshot replacements are checked row by row."],
  ["Reconcile", "Row counts and money totals are compared with the source file before anything is approved."],
  ["Approve", "A second person approves. Partial approval quarantines error rows with a note."],
  ["Publish", "Approved data appears on dashboards with status, period and last-import labels."],
  ["Correct or roll back", "Corrections need a reason and keep version history. A whole batch can be rolled back."],
];

export default function Guide() {
  return (
    <div>
      <PageHeader kicker="Help" title="Operator guide" description="How data moves from source systems into approved reporting, who refreshes what, and what is still needed from Denkyem before figures can move from Provisional to Verified." />
      <Card title="How data flows">
        <ol className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-lg border p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</div>
              <div className="mt-2 text-sm font-semibold">{t}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Refresh checklist" subtitle="Manual imports come first; automation is added once each source is stable">
          <div className="divide-y">
            {REFRESH.map(([s, o, c, h]) => (
              <div key={s} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{s}</span>
                  <div className="flex gap-1.5">
                    <Pill tone="green">{o}</Pill>
                    <Pill tone="gold">{c}</Pill>
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{h}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Still needed from Denkyem" subtitle="Open dependencies from the build brief">
          <div className="space-y-3">
            {NEEDS.map(([t, d, o]) => (
              <div key={t} className="flex gap-3">
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--chart-3))]" />
                <div>
                  <div className="text-sm font-medium">
                    {t} <span className="font-normal text-muted-foreground">· {o}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Reading the status labels">
          <div className="space-y-2 text-sm">
            {[
              ["Verified", "green", "From approved, reconciled sources with signed-off rules."],
              ["Provisional", "amber", "Calculated from approved data, but a business rule is still awaiting sign-off."],
              ["Not available", "muted", "The source has not been supplied. Never shown as zero."],
              ["Demo", "gold", "Fictitious demonstration data. Turn off demo mode in the header to see real data."],
            ].map(([l, t, d]) => (
              <div key={l} className="flex items-start gap-2">
                <Pill tone={t as any}>{l}</Pill>
                <span className="text-xs text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Ground rules">
          <ul className="space-y-1.5 text-sm">
            {[
              "Nothing is emailed, shared or published automatically.",
              "Power BI examples are reference only — never Denkyem results.",
              "LoanWell stays the lending record until NED cutover is confirmed.",
              "Small groups are suppressed in every aggregate and export.",
              "A failed refresh keeps the last approved data and shows a banner.",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {x}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-4">
        <Callout>This is a working prototype for review, not a production deployment. Sign-in, named accounts and hosted storage are set up once access owners are confirmed.</Callout>
      </div>
    </div>
  );
}
