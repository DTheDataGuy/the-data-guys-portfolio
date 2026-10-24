import { Link } from "wouter";
import { Inbox, ShieldAlert, Pencil, CheckCircle2, FileText, GitCompareArrows, Paperclip, Mail, Keyboard, ArrowRight, Users } from "lucide-react";
import { PageHeader, Panel, Tag } from "@/components/kit";
import { useSession } from "@/lib/queryClient";

const STEPS = [
  { n: 1, icon: Inbox, t: "WIPs arrive", to: "/intake", cta: "Open WIP Intake", d: "Entities email their standardized WIP to WIP@enterprise.example.com, or you drag files onto WIP Intake. Each file is checked, staged and shown as a preview before anything changes." },
  { n: 2, icon: CheckCircle2, t: "Review and commit", to: "/intake", cta: "Review staged files", d: "Look at the row counts, errors and warnings for each staged file, then commit it. Rejected senders and bad files never touch the data." },
  { n: 3, icon: ShieldAlert, t: "Clear exceptions", to: "/month-end", cta: "Month-End Exceptions", d: "Losses, underbillings, bond gaps and data problems are routed to the right owner at each company: finance for actuals, the project manager for EAC and forecast, operations for field and change activity." },
  { n: 4, icon: Pencil, t: "Correct numbers", to: "/projects", cta: "Edit cells on Projects", d: "Click Edit cells to fix values right in the table, or open any project to edit it and attach backup. Every change needs a reason and keeps the original value." },
  { n: 5, icon: GitCompareArrows, t: "See what changed", to: "/changes", cta: "What changed", d: "Compare this month with last month: backlog bridge, profit fades and gains, contract changes, new and completed jobs." },
  { n: 6, icon: FileText, t: "Publish and brief", to: "/close", cta: "Close & Publish", d: "Publish the month to lock it, then print the Executive brief for leadership, the board or the surety." },
];
const TIPS: [string, string][] = [
  ["Edit a cell", "Projects → Edit cells → click a value. Enter moves down, Tab moves right, Esc cancels."],
  ["Paste from Excel", "Copy a block of cells in Excel and paste into any editable cell. It fills down and across."],
  ["Explain a number", "Click the small ⓘ next to any figure to see its formula and inputs."],
  ["Drill in", "Click any project row to open Project 360: values, calculations, bond, phasing, documents and history."],
  ["Filter everything", "The business unit, entity and company filters at the top apply to every page."],
  ["Reopen a month", "Published months are locked. Reopen in Close & Publish, correct, and republish as a new version."],
];
const LABELS: [string, string, string][] = [
  ["source", "Source", "Exactly as submitted in the WIP."],
  ["calc", "Calculated", "Recalculated from source values with the governed formulas."],
  ["forecast", "Forecast", "A timing model of future revenue or cost."],
  ["user", "User-entered", "Typed in by a person in the app (limits, opening cash, edits)."],
  ["proposed", "Proposed", "A suggested setting, pending executive approval."],
  ["sample", "Sample", "Illustrative data, never mixed into totals."],
];

export default function GuidePage() {
  const s = useSession();
  return (
    <div className="page-in">
      <PageHeader title={`Start here${s.user?.name ? `, ${s.user.name.split(" ")[0]}` : ""}`} subtitle="How the monthly WIP cycle runs in the Command Center, from inbox to published executive brief." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {STEPS.map((x) => { const I = x.icon; return (
          <Link key={x.n} href={x.to} className="card-lift group flex flex-col rounded-2xl border bg-card p-5" data-testid={`guide-step-${x.n}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><I className="h-5 w-5" /></span>
              <div><div className="text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Step {x.n}</div><div className="text-[15.5px] font-semibold">{x.t}</div></div>
            </div>
            <p className="mt-3 flex-1 text-[13px] leading-6 text-muted-foreground">{x.d}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary">{x.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></div>
          </Link>
        ); })}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={<span className="inline-flex items-center gap-2"><Keyboard className="h-4 w-4 text-muted-foreground" /> Everyday shortcuts</span>}>
          <dl className="divide-y divide-border/60">{TIPS.map(([k, v]) => <div key={k} className="grid grid-cols-[150px_1fr] gap-3 py-2.5 text-[13px]"><dt className="font-medium">{k}</dt><dd className="text-muted-foreground">{v}</dd></div>)}</dl>
        </Panel>
        <div className="space-y-4">
          <Panel title="What the labels mean">
            <ul className="space-y-2">{LABELS.map(([k, l, d]) => <li key={k} className="flex items-start gap-3 text-[13px]"><span className="w-[110px] shrink-0"><Tag kind={k as any}>{l}</Tag></span><span className="text-muted-foreground">{d}</span></li>)}</ul>
          </Panel>
          <Panel title={<span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Email intake</span>}>
            <p className="text-[13px] leading-6 text-muted-foreground">Send WIPs to <b className="text-foreground">WIP@enterprise.example.com</b>. Only @enterprise.example.com and @contractor.example.com senders are accepted; anything else is rejected and logged. The old process keeps running during testing.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px]"><span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"><Paperclip className="h-3.5 w-3.5" /> .xlsx · .xlsm · .csv</span><span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"><Users className="h-3.5 w-3.5" /> Company senders only</span></div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
