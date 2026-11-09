import { Link } from "wouter";
import { CheckCircle2, CircleDashed, ArrowDown } from "lucide-react";
import { PageHeader, Panel, Tag, Pill, Note } from "@/components/kit";

const STAGES: { k: string; live: boolean; to?: string; d: string }[] = [
  { k: "Opportunity & Bid", live: true, to: "/pipeline", d: "Pipeline register with value, probability, start, duration and bond need. Estimating system integration proposed." },
  { k: "Award & Project Setup", live: true, to: "/pipeline", d: "Awarded bids link to their project ID once it appears in a WIP." },
  { k: "Execution → WIP", live: true, to: "/intake", d: "Standardized monthly WIPs by upload or email, validated, staged and committed per entity." },
  { k: "Governed WIP", live: true, to: "/portfolio", d: "Versioned eligibility rules, data-quality flags, reproduction tests against the approved workbook." },
  { k: "Month-end exception layer", live: true, to: "/month-end", d: "CostPoint, HCSS/Procore, EAC, change and adjustment inputs auto-clear what is explained; true exceptions route to each company’s finance, project and operations owners." },
  { k: "Backlog & revenue forecast", live: true, to: "/forecast", d: "12/24/36-month phasing by project, company, JV and business unit; margin outlook; gap detection." },
  { k: "Cash flow", live: true, to: "/cash", d: "Timing assumption model from the forecast: billing and collection lags, retention, payables." },
  { k: "Bond capacity", live: true, to: "/capacity", d: "Bonded backlog plus bonded pipeline against surety limits you enter." },
  { k: "Executive planning", live: true, to: "/planning", d: "One view of the chain with what-if timing, margin and pipeline scenarios." },
  { k: "Closeout", live: false, d: "Final cost, retention collection and warranty tracking — proposed." },
];
const NEXT = [
  ["CostPoint actuals feed", "Scheduled export or API into month-end reconciliation, replacing manual upload", "Pending system access"],
  ["HCSS / Procore actuals feed", "Field cost and change events by project", "Pending system access"],
  ["Estimating system connection", "Bids flow into the pipeline automatically", "Pending executive approval — system to confirm"],
  ["Surety program limits", "Single and aggregate limits entered from the surety letter", "Pending executive approval"],
  ["Revenue target & gap threshold", "Drives backlog-gap detection in the forecast", "Pending executive approval"],
  ["Reconciliation tolerances", "$5,000 / 0.5% / 2% EAC movement / $250,000 materiality defaults", "Proposed, pending executive approval"],
  ["R-CTRL control-row rule", "Excludes source control rows that are not projects", "Proposed, pending executive approval"],
];

export default function RoadmapPage() {
  return (
    <div>
      <PageHeader title="Roadmap" subtitle="Opportunity → Bid → Award → Project Setup → Execution → WIP → Forecast → Closeout. What runs today and what is waiting on a decision or a system connection." />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel title="Lifecycle">
          <ol className="space-y-1">{STAGES.map((s, i) => <li key={s.k}>
            <div className={`flex gap-3 rounded-lg border p-3 ${s.live ? "" : "border-dashed"}`}>
              {s.live ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-semibold">{s.k}</span>{s.live ? <Pill tone="ok">Live</Pill> : <Pill tone="gold">Proposed</Pill>}{s.to ? <Link href={s.to} className="ml-auto text-[12.5px] text-primary hover:underline">Open</Link> : null}</div><p className="mt-0.5 text-[12.5px] text-muted-foreground">{s.d}</p></div>
            </div>
            {i < STAGES.length - 1 ? <ArrowDown className="mx-auto my-0.5 h-3.5 w-3.5 text-muted-foreground" /> : null}
          </li>)}</ol>
        </Panel>
        <div className="space-y-4">
          <Panel title="Decisions & connections pending" tags={<Tag kind="pending" />}>
            <div className="divide-y">{NEXT.map(([a, b, c]) => <div key={a} className="py-2.5 first:pt-0"><div className="flex items-start justify-between gap-2"><span className="text-[13px] font-medium">{a}</span><Pill tone="gold" className="shrink-0">{c}</Pill></div><p className="mt-0.5 text-[12px] text-muted-foreground">{b}</p></div>)}</div>
          </Panel>
          <Note>No system connections are claimed as live. CostPoint, HCSS, Procore and estimating data enter today through the standardized upload templates.</Note>
        </div>
      </div>
    </div>
  );
}
