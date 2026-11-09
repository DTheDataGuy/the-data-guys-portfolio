import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useWip } from "@/lib/app";
import { BOND_CATS, groupBy, type BondCat } from "@shared/calc";
import { PageHeader, Panel, Tag, Money, DataTable, Pill, Seg, Note, $M, $, P, Kpi, tipStyle } from "@/components/kit";
import { openProject } from "@/components/project";
import { Skeleton } from "./command";

const COL: Record<string, string> = { Bonded: "hsl(var(--primary))", "Bonded - Number Unmatched": "hsl(var(--gold))", Unbonded: "hsl(var(--muted-foreground))", "Needs Review": "hsl(var(--terra))" };

export default function BondsPage() {
  const w = useWip(); const ref = useQuery<any[]>({ queryKey: ["/api/bonds"] });
  const [tab, setTab] = useState<"report" | "ref">("report"); const [cat, setCat] = useState<string>("all");
  const d = useMemo(() => {
    if (!w.view) return null;
    const br = w.view.bondReport; const tot = br.reduce((a, r) => a + (r.m.remC || 0), 0);
    const cats = BOND_CATS.map((c) => { const rs = br.filter((r) => r.bondStatus === c); const rem = rs.reduce((a, r) => a + (r.m.remC || 0), 0); return { c, n: rs.length, rem, pct: tot ? rem / tot : null }; });
    const bRem = cats.filter((c) => c.c === "Bonded" || c.c === "Bonded - Number Unmatched").reduce((a, c) => a + c.rem, 0);
    const byEnt = [...groupBy(br, (r) => r.entity)].map(([k, rs]) => { const t = rs.reduce((a, r) => a + (r.m.remC || 0), 0); const b = rs.filter((r) => r.bondStatus.startsWith("Bonded")).reduce((a, r) => a + (r.m.remC || 0), 0); return { k, n: rs.length, t, b, pct: t ? b / t : null, rev: rs.filter((r) => r.bondStatus === "Needs Review").length }; }).sort((a, b) => b.t - a.t);
    return { br, tot, cats, bRem, byEnt, jv: br.filter((r) => !r.eligible).length };
  }, [w.view]);
  if (!d) return <div><PageHeader title="Bond center" /><Skeleton /></div>;
  const rows = cat === "all" ? d.br : d.br.filter((r) => r.bondStatus === cat);
  return (
    <div>
      <PageHeader title="Bond center" subtitle="Bond report scope = reporting-eligible projects plus active JV rows (the workbook’s 11_Bond_Report rule). Bond numbers are kept as text, so leading zeros such as 023224132 are preserved." tags={<><Tag kind="source">Bond list</Tag><Tag kind="calc" /></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Bond-report projects" value={d.br.length} sub={`${d.br.length - d.jv} eligible + ${d.jv} active JV`} how={{ formula: "eligible rows ∪ (JV = Yes and status active)" }} />
        <Kpi label="Bonded remaining contract" value={$M(d.bRem)} sub={$(d.bRem, 2)} how={{ formula: "Σ (C − R) where status ∈ {Bonded, Bonded–Number Unmatched}" }} />
        <Kpi label="Bonded share" value={P(d.tot ? d.bRem / d.tot : null, 2)} sub={`of ${$M(d.tot)} bond-report backlog`} how={{ formula: "bonded remaining ÷ total bond-report remaining", inputs: [["Bonded", $(d.bRem, 2)], ["Total", $(d.tot, 2)]] }} />
        <Kpi label="Needs review" value={d.cats.find((c) => c.c === "Needs Review")?.n ?? 0} sub={$M(d.cats.find((c) => c.c === "Needs Review")?.rem)} tone="bad" how={{ formula: "count(bond status = ‘Needs Review’)" }} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="Backlog by bond status" tags={<Tag kind="calc" />}>
          <div className="h-[200px]"><ResponsiveContainer><PieChart><Pie data={d.cats} dataKey="rem" nameKey="c" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">{d.cats.map((c) => <Cell key={c.c} fill={COL[c.c]} />)}</Pie><Tooltip {...tipStyle} formatter={(v: any) => $(v)} /></PieChart></ResponsiveContainer></div>
          <div className="mt-2 space-y-1.5">{d.cats.map((c) => <button key={c.c} onClick={() => { setTab("report"); setCat(cat === c.c ? "all" : c.c); }} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-muted ${cat === c.c ? "bg-muted" : ""}`}><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COL[c.c] }} /><span className="flex-1 text-left">{c.c}</span><span className="tnum text-muted-foreground">{c.n}</span><span className="w-16 text-right tnum">{$M(c.rem)}</span><span className="w-14 text-right tnum font-medium">{P(c.pct)}</span></button>)}</div>
          <Note>Bond amount is the penal sum of an individual bond — it is <b>not</b> surety capacity. Capacity planning uses the limits you enter on the Bond Capacity page.</Note>
        </Panel>
        <Panel pad={false} actions={<Seg value={tab} onChange={setTab} options={[{ value: "report", label: "Bond report" }, { value: "ref", label: `Bond reference list (${ref.data?.length ?? "…"})` }, ]} />} title={tab === "report" ? "Projects in the bond report" : "Bond reference list"} subtitle={tab === "report" ? (cat === "all" ? "All statuses" : `Filtered: ${cat}`) : "From the surety bond schedule — amounts are bond penal sums"}>
          {tab === "report" ? <DataTable rows={rows} rowKey={(r) => r.id} onRow={(r) => openProject(r.id)} search={(r) => `${r.entity} ${r.projectId} ${r.projectName} ${r.bondNo || ""}`} initialSort={{ key: "rc", dir: "desc" }} cols={[
            { key: "e", label: "Entity", value: (r) => r.entity },
            { key: "p", label: "Project", render: (r) => <span><b className="font-medium">{r.projectId}</b> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 30)}</span>{!r.eligible ? <Pill tone="gold" className="ml-1.5">JV</Pill> : null}</span>, value: (r) => r.projectId },
            { key: "s", label: "Status", render: (r) => <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: COL[r.bondStatus] }} />{r.bondStatus}</span>, value: (r) => r.bondStatus },
            { key: "n", label: "Bond #", render: (r) => r.bondNo ? <span className="font-mono text-[12px]">{r.bondNo}</span> : "—", value: (r) => r.bondNo },
            { key: "rc", label: "Remaining", align: "right", render: (r) => <Money v={r.m.remC} />, value: (r) => r.m.remC },
            { key: "m", label: "Match method", render: (r) => <span className="block max-w-[220px] truncate text-[12px] text-muted-foreground" title={r.bondMethod || ""}>{r.bondMethod || "—"}</span> },
          ]} /> : <DataTable rows={ref.data || []} rowKey={(b) => String(b.id)} search={(b) => `${b.bond_no} ${b.principal} ${b.description}`} cols={[
            { key: "n", label: "Bond #", render: (b) => <span className="font-mono text-[12px]">{b.bond_no}</span>, value: (b) => b.bond_no },
            { key: "p", label: "Principal", value: (b) => b.principal },
            { key: "d", label: "Description", render: (b) => <span className="block max-w-[260px] truncate" title={b.description}>{b.description}</span>, value: (b) => b.description },
            { key: "a", label: "Bond amount", align: "right", render: (b) => <Money v={b.amount} />, value: (b) => b.amount },
            { key: "x", label: "Expires", value: (b) => b.exp },
            { key: "l", label: "Line", value: (b) => b.lob },
          ]} />}
        </Panel>
      </div>
      <Panel className="mt-4" title="Bonded share by entity" pad={false}>
        <DataTable rows={d.byEnt} rowKey={(x) => x.k} pageSize={30} dense cols={[
          { key: "k", label: "Entity", value: (x) => x.k }, { key: "n", label: "Projects", align: "right", value: (x) => x.n },
          { key: "t", label: "Remaining", align: "right", render: (x) => <Money v={x.t} />, value: (x) => x.t }, { key: "b", label: "Bonded remaining", align: "right", render: (x) => <Money v={x.b} />, value: (x) => x.b },
          { key: "p", label: "Bonded %", align: "right", render: (x) => P(x.pct), value: (x) => x.pct }, { key: "r", label: "Needs review", align: "right", render: (x) => x.rev ? <Pill tone="warn">{x.rev}</Pill> : "0", value: (x) => x.rev },
        ]} />
      </Panel>
    </div>
  );
}
