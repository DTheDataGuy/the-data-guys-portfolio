import { useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/queryClient";
import { saveSetting } from "@/lib/app";
import { useForecast, OPEN_STAGES } from "@/lib/fc";
import { forecastRows } from "@shared/calc";
import { PageHeader, Panel, Tag, DataTable, Note, Money, $, P, $M, Kpi, Pill, CHART, axisTick, tipStyle } from "@/components/kit";
import { openProject } from "@/components/project";
import { Skeleton } from "./command";

export default function CapacityPage() {
  const x = useForecast(); const { f, boot, view, opps } = x; const s = useSession(); const { toast } = useToast();
  const [edit, setEdit] = useState<{ aggregate: string; single: string; note: string } | null>(null);
  const d = useMemo(() => {
    if (!f || !view) return null;
    const bonded = view.bondReport.filter((r) => r.bondStatus === "Bonded" || r.bondStatus === "Bonded - Number Unmatched");
    const review = view.bondReport.filter((r) => r.bondStatus === "Needs Review");
    const rem = (xs: typeof bonded) => xs.reduce((a, r) => a + Math.max(r.m.remC || 0, 0), 0);
    const fc = forecastRows(bonded.filter((r) => (r.m.remC || 0) >= 0), f.a, f.ovs, f.asOf);
    let run = rem(bonded); const burn = f.labels.slice(0, 24).map((m, i) => { run -= fc.reduce((a, q) => a + q.rev[i], 0); return { m, bonded: Math.max(run, 0) }; });
    const pipe = (opps.data || []).filter((o) => o.bonded && OPEN_STAGES.includes(o.stage));
    const pipeW = pipe.reduce((a, o) => a + (o.value || 0) * (o.probability ?? 0), 0), pipeF = pipe.reduce((a, o) => a + (o.value || 0), 0);
    const largest = [...bonded].sort((a, b) => (b.m.remC || 0) - (a.m.remC || 0));
    return { bonded, review, bRem: rem(bonded), rRem: rem(review), burn, pipe, pipeW, pipeF, largest, maxSingle: largest[0]?.m.remC || 0 };
  }, [f, view, opps.data]);
  if (!f || !d || !boot) return <div><PageHeader title="Bond capacity" /><Skeleton /></div>;
  const su = boot.settings.surety; const agg = su.aggregate, single = su.single;
  const head = agg != null ? agg - d.bRem - d.pipeW : null;
  const can = ["admin", "executive", "finance"].includes(s.user?.role || "");
  const save = async () => { if (!edit) return; const p = (v: string) => v.trim() === "" ? null : Number(v.replace(/[$,]/g, "")); const a = p(edit.aggregate), si = p(edit.single); if ([a, si].some((v) => v !== null && !Number.isFinite(v))) return toast({ title: "Limits must be numbers or blank", variant: "destructive" }); try { await saveSetting("surety", { aggregate: a, single: si, note: edit.note }); setEdit(null); toast({ title: "Surety limits saved" }); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } };
  return (
    <div>
      <PageHeader title="Bond capacity planning" subtitle="Compares bonded backlog with your surety program limits. Individual bond amounts are penal sums and are never treated as capacity; limits stay blank until entered from the surety letter."
        tags={<><Tag kind="calc" /><Tag kind="user">Limits entered by you</Tag></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Bonded backlog" value={$M(d.bRem)} sub={`${d.bonded.length} bonded projects`} how={{ formula: "Σ max(C − R, 0) where bond status ∈ {Bonded, Number Unmatched}" }} />
        <Kpi label="Needs-review backlog" value={$M(d.rRem)} sub={`${d.review.length} projects — may be bonded`} tone="warn" how={{ formula: "Σ (C − R) where bond status = Needs Review" }} />
        <Kpi label="Aggregate limit" value={agg != null ? $M(agg) : "Not entered"} sub={agg != null ? `${P(d.bRem / agg)} used` : "from surety letter"} kind={agg != null ? "user" : "pending"} />
        <Kpi label="Headroom" value={head != null ? $M(head) : "—"} sub={head != null ? "after weighted bonded pipeline" : "enter the aggregate limit"} tone={head != null && head < 0 ? "bad" : undefined} kind={head != null ? "calc" : "pending"} how={{ formula: "aggregate limit − bonded backlog − Σ(bonded pipeline value × probability)", inputs: [["Limit", agg != null ? $(agg) : "blank"], ["Bonded backlog", $(d.bRem)], ["Weighted pipeline", $(d.pipeW)]] }} />
        <Kpi label="Largest single remaining" value={$M(d.maxSingle)} sub={single != null ? `single limit ${$M(single)}` : "single limit not entered"} tone={single != null && d.maxSingle > single ? "bad" : undefined} kind="calc" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title="Bonded backlog runoff" subtitle="How bonded exposure declines as work is earned — capacity that frees up over time" tags={<Tag kind="forecast" />}>
          <div className="h-[290px]"><ResponsiveContainer><AreaChart data={d.burn} margin={{ left: 4, right: 8, top: 6 }}>
            <defs><linearGradient id="bb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={CHART.gold} stopOpacity={0.4} /><stop offset="1" stopColor={CHART.gold} stopOpacity={0.03} /></linearGradient></defs>
            <CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="m" tick={axisTick} interval={2} /><YAxis tick={axisTick} tickFormatter={(v) => $M(v, 0)} width={60} domain={[0, (dm: number) => Math.max(dm, agg || 0) * 1.05]} />
            <Tooltip {...tipStyle} formatter={(v: any) => $(v)} /><Area dataKey="bonded" name="Bonded backlog remaining" stroke={CHART.gold} fill="url(#bb)" strokeWidth={2} />
            {agg != null ? <ReferenceLine y={agg} stroke={CHART.bad} strokeDasharray="4 4" label={{ value: "Aggregate limit", position: "insideTopRight", fontSize: 11, fill: CHART.bad }} /> : null}
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </AreaChart></ResponsiveContainer></div>
          {agg == null ? <Note>Enter the aggregate program limit to draw the capacity line and compute headroom.</Note> : null}
        </Panel>
        <Panel title="Surety program" tags={<Tag kind="user" />} actions={can && !edit ? <Button size="sm" variant="outline" onClick={() => setEdit({ aggregate: agg != null ? String(agg) : "", single: single != null ? String(single) : "", note: su.note || "" })} data-testid="button-edit-surety">Enter limits</Button> : null}>
          {edit ? <div className="space-y-3">
            <div><Label>Aggregate program limit</Label><Input value={edit.aggregate} onChange={(e) => setEdit({ ...edit, aggregate: e.target.value })} placeholder="blank" data-testid="input-aggregate" /></div>
            <div><Label>Single-project limit</Label><Input value={edit.single} onChange={(e) => setEdit({ ...edit, single: e.target.value })} placeholder="blank" /></div>
            <div><Label>Source / note</Label><Textarea rows={2} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="e.g. surety letter dated …" /></div>
            <div className="flex gap-2"><Button size="sm" onClick={save} data-testid="button-save-surety">Save</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
          </div> : <dl className="space-y-2 text-[13px]"><div className="flex justify-between"><dt className="text-muted-foreground">Aggregate</dt><dd className="font-medium tnum">{agg != null ? $(agg) : "Blank"}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Single project</dt><dd className="font-medium tnum">{single != null ? $(single) : "Blank"}</dd></div><div><dt className="text-muted-foreground">Source</dt><dd>{su.note || "—"}</dd></div></dl>}
          <div className="mt-4 border-t pt-3"><div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Bonded pipeline</div>{d.pipe.length ? <div className="text-[13px]">{d.pipe.length} opportunities · face {$M(d.pipeF)} · weighted {$M(d.pipeW)}</div> : <div className="text-[13px] text-muted-foreground">No bonded opportunities entered in the Bid pipeline.</div>}</div>
        </Panel>
      </div>
      <Panel className="mt-4" pad={false} title="Largest bonded exposures" subtitle={single != null ? "Rows above the single-project limit are flagged" : undefined}>
        <DataTable rows={d.largest} rowKey={(r) => r.id} onRow={(r) => openProject(r.id)} pageSize={15} search={(r) => `${r.entity} ${r.projectId} ${r.projectName} ${r.bondNo || ""}`} initialSort={{ key: "r", dir: "desc" }} cols={[
          { key: "p", label: "Project", render: (r) => <span><b className="font-medium">{r.entity} {r.projectId}</b> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 30)}</span></span>, value: (r) => r.projectId },
          { key: "b", label: "Bond #", render: (r) => <span className="font-mono text-[12px]">{r.bondNo || "—"}</span>, value: (r) => r.bondNo },
          { key: "c", label: "Contract", align: "right", render: (r) => <Money v={r.C} />, value: (r) => r.C },
          { key: "r", label: "Remaining", align: "right", render: (r) => <b><Money v={r.m.remC} /></b>, value: (r) => r.m.remC },
          { key: "s", label: "vs single limit", align: "right", render: (r) => single != null ? ((r.m.remC || 0) > single ? <Pill tone="bad">Over</Pill> : P((r.m.remC || 0) / single, 0)) : "—" },
        ]} />
      </Panel>
    </div>
  );
}
