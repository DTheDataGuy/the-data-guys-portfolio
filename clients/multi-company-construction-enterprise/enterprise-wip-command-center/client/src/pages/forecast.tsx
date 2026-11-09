import { useMemo, useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, AreaChart, Area, Legend, Line } from "recharts";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/queryClient";
import { canEdit, saveSetting } from "@/lib/app";
import { useForecast } from "@/lib/fc";
import { groupBy, type Curve, type FcAssumptions } from "@shared/calc";
import { PageHeader, Panel, Tag, DataTable, Pill, Note, Money, $, P, $M, Kpi, Seg, CHART, axisTick, tipStyle } from "@/components/kit";
import { openProject } from "@/components/project";
import { Skeleton } from "./command";

const sum = (a: number[], n = a.length) => a.slice(0, n).reduce((s, x) => s + x, 0);
type G = "entity" | "bu" | "company" | "kind";

export default function ForecastPage() {
  const { f, boot } = useForecast(); const s = useSession();
  const [H, setH] = useState<"12" | "24" | "36">("12"); const [g, setG] = useState<G>("entity"); const [open, setOpen] = useState(false);
  const h = Number(H);
  const d = useMemo(() => {
    if (!f) return null; const n = Math.min(h, f.H);
    const months = f.labels.slice(0, n).map((m, i) => ({ m, rev: f.rev[i], cost: f.cost[i], gp: f.gp[i], gm: f.rev[i] ? f.gp[i] / f.rev[i] : null, backlog: f.backlog[i], pipe: f.pipe.rev[i] }));
    const groups = [...groupBy(f.fc, (x) => g === "kind" ? (x.row.jv === "Yes" ? "JV" : "Operating") : String((x.row as any)[g] || "—"))].map(([k, xs]) => {
      const r = (k2: number) => xs.reduce((a, x) => a + sum(x.rev, k2), 0), c = (k2: number) => xs.reduce((a, x) => a + sum(x.cost, k2), 0);
      const rem = xs.reduce((a, x) => a + Math.max(x.row.R !== null || x.row.C !== null ? (x.row.C || 0) - (x.row.R || 0) : 0, 0), 0);
      return { k, n: xs.length, rem, r3: r(3), r6: r(6), r12: r(12), rh: r(n), gph: r(n) - c(n), gm: r(n) ? (r(n) - c(n)) / r(n) : null };
    }).sort((a, b) => b.rh - a.rh);
    const rh = sum(f.rev, n), ch = sum(f.cost, n);
    return { n, months, groups, rh, ch, gm: rh ? (rh - ch) / rh : null, r12: sum(f.rev, 12), pipeH: sum(f.pipe.rev, n) };
  }, [f, h, g]);
  if (!f || !d || !boot) return <div><PageHeader title="Revenue forecast" /><Skeleton /></div>;
  const gapLabel = f.gapIdx >= 0 ? f.labels[f.gapIdx] : null;
  return (
    <div>
      <PageHeader title="Backlog & revenue forecast" subtitle="Phases each project’s remaining contract (C − R) and remaining cost (E − A) across future months. Built only from governed WIP rows; nothing is invented for months without data."
        tags={<><Tag kind="forecast" /><Tag kind="proposed">Phasing method proposed, pending executive approval</Tag></>}
        actions={<><Seg value={H} onChange={setH} options={[{ value: "12", label: "12 mo" }, { value: "24", label: "24 mo" }, { value: "36", label: "36 mo" }]} testid="seg-horizon" /><Button size="sm" variant="outline" onClick={() => setOpen(true)} data-testid="button-fc-assumptions"><Settings2 /> Assumptions</Button></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Backlog in forecast" value={$M(f.totalRem)} sub={`${f.base.length} projects`} kind="calc" how={{ formula: "Σ max(C − R, 0) over reporting-eligible rows" + (f.a.includeJV ? " + active JV" : "") + ", negative rows excluded" }} />
        <Kpi label={`Revenue, next ${d.n} mo`} value={$M(d.rh)} sub={`${P(f.totalRem ? d.rh / f.totalRem : null)} of backlog`} kind="forecast" how={{ formula: "Σ monthly phased revenue", inputs: [["Phasing", "schedule end date → override → small-project rule → BU default"], ["Curve", f.a.curve]] }} />
        <Kpi label={`Gross profit, next ${d.n} mo`} value={$M(d.rh - d.ch)} sub={`margin ${P(d.gm)}`} kind="forecast" how={{ formula: "Σ phased revenue − Σ phased remaining cost; margin = GP ÷ revenue (weighted, never averaged)" }} />
        <Kpi label="Beyond 36 months" value={$M(f.beyond)} sub="not yet scheduled in horizon" kind="calc" how={{ formula: "backlog − Σ revenue in 36-month horizon" }} />
        <Kpi label="Backlog gap begins" value={gapLabel || (f.target ? "Not in horizon" : "Set target")} sub={f.target ? `revenue < ${P(f.gapPct, 0)} of ${$M(f.target)}/mo` : "enter a monthly revenue target"} tone={gapLabel ? "warn" : undefined} kind={f.target ? "forecast" : "pending"} how={{ formula: "first month where forecast revenue < target × threshold", inputs: [["Target", f.target ? $(f.target) : "blank — not entered"], ["Threshold", P(f.gapPct, 0)]] }} />
        <Kpi label="Excluded for review" value={f.excluded.length} sub={$M(f.excluded.reduce((a, r) => a + (r.m.remC || 0), 0)) + " negative remaining"} tone={f.excluded.length ? "bad" : undefined} kind="calc" how={{ formula: "rows where C − R < 0 are not forecast" }} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Monthly revenue and gross profit" subtitle={f.pipe.used.length ? `Includes ${f.pipe.used.length} weighted pipeline opportunities (stacked, lighter)` : "Governed backlog only — no pipeline entered"} tags={<Tag kind="forecast" />}>
          <div className="h-[280px]"><ResponsiveContainer><ComposedChart data={d.months} margin={{ left: 4, right: 8, top: 6 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="m" tick={axisTick} interval={d.n > 12 ? 2 : 0} /><YAxis tick={axisTick} tickFormatter={(v) => $M(v, 0)} width={58} />
            <Tooltip {...tipStyle} formatter={(v: any, n: any) => [$(v), n]} />
            <Bar dataKey="rev" name="Backlog revenue" stackId="r" fill={CHART.primary} radius={[0, 0, 0, 0]} />
            {f.pipe.used.length ? <Bar dataKey="pipe" name="Pipeline (weighted)" stackId="r" fill={CHART.gold} radius={[3, 3, 0, 0]} /> : null}
            <Line dataKey="gp" name="Gross profit" stroke={CHART.terra} strokeWidth={2} dot={false} />
            {f.target ? <ReferenceLine y={f.target} stroke={CHART.bad} strokeDasharray="4 4" label={{ value: "Target", position: "insideTopRight", fontSize: 11, fill: CHART.bad }} /> : null}
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </ComposedChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Backlog burn" subtitle="Remaining contract left at the end of each month" tags={<Tag kind="forecast" />}>
          <div className="h-[280px]"><ResponsiveContainer><AreaChart data={d.months} margin={{ left: 4, right: 8, top: 6 }}>
            <defs><linearGradient id="bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={CHART.primary} stopOpacity={0.35} /><stop offset="1" stopColor={CHART.primary} stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="m" tick={axisTick} interval={d.n > 12 ? 2 : 0} /><YAxis tick={axisTick} tickFormatter={(v) => $M(v, 0)} width={58} />
            <Tooltip {...tipStyle} formatter={(v: any) => $(v)} /><Area dataKey="backlog" name="Remaining backlog" stroke={CHART.primary} fill="url(#bl)" strokeWidth={2} />
          </AreaChart></ResponsiveContainer></div>
        </Panel>
      </div>

      <Panel className="mt-4" pad={false} title="Projection by group" actions={<Seg value={g} onChange={setG} options={[{ value: "entity", label: "Entity" }, { value: "company", label: "Company" }, { value: "bu", label: "Business unit" }, { value: "kind", label: "Operating / JV" }]} />} subtitle={!f.a.includeJV ? "JV rows are excluded from the forecast by rule; turn on “Include active JV” in Assumptions to project them." : undefined}>
        <DataTable rows={d.groups} rowKey={(x) => x.k} dense pageSize={30} initialSort={{ key: "rh", dir: "desc" }} cols={[
          { key: "k", label: "Group", render: (x) => <b className="font-medium">{x.k}</b>, value: (x) => x.k }, { key: "n", label: "Projects", align: "right", value: (x) => x.n },
          { key: "r3", label: "Next 3 mo", align: "right", render: (x) => <Money v={x.r3} />, value: (x) => x.r3 }, { key: "r6", label: "Next 6 mo", align: "right", render: (x) => <Money v={x.r6} />, value: (x) => x.r6 }, { key: "r12", label: "Next 12 mo", align: "right", render: (x) => <Money v={x.r12} />, value: (x) => x.r12 },
          { key: "rh", label: `${d.n}-mo revenue`, align: "right", render: (x) => <b><Money v={x.rh} /></b>, value: (x) => x.rh }, { key: "g", label: `${d.n}-mo GP`, align: "right", render: (x) => <Money v={x.gph} />, value: (x) => x.gph }, { key: "gm", label: "Margin", align: "right", render: (x) => P(x.gm), value: (x) => x.gm },
        ]} />
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel pad={false} title="Monthly schedule" tags={<Tag kind="forecast" />}>
          <DataTable rows={d.months} rowKey={(x) => x.m} dense pageSize={36} cols={[
            { key: "m", label: "Month", value: (x) => x.m, sortable: false }, { key: "r", label: "Revenue", align: "right", render: (x) => <Money v={x.rev} />, sortable: false }, { key: "c", label: "Cost", align: "right", render: (x) => <Money v={x.cost} />, sortable: false },
            { key: "g", label: "GP", align: "right", render: (x) => <Money v={x.gp} />, sortable: false }, { key: "gm", label: "Margin", align: "right", render: (x) => P(x.gm), sortable: false },
            { key: "p", label: "Pipeline (wtd)", align: "right", render: (x) => x.pipe ? <Money v={x.pipe} /> : <span className="text-muted-foreground">—</span>, sortable: false },
            { key: "b", label: "Backlog end", align: "right", render: (x) => <Money v={x.backlog} />, sortable: false },
            { key: "t", label: "vs target", align: "right", render: (x) => f.target ? <span className={x.rev < f.target * f.gapPct ? "text-[hsl(var(--destructive))] font-medium" : ""}>{P(x.rev / f.target, 0)}</span> : <span className="text-muted-foreground">—</span>, sortable: false },
          ]} />
        </Panel>
        <Panel pad={false} title="Excluded — negative remaining contract" subtitle="Revenue earned exceeds contract. Not forecast; review the contract or change orders.">
          <DataTable rows={f.excluded} rowKey={(r) => r.id} dense onRow={(r) => openProject(r.id)} empty={<div className="p-6 text-center text-sm text-muted-foreground">None</div>} cols={[
            { key: "p", label: "Project", render: (r) => <span><b className="font-medium">{r.entity} {r.projectId}</b></span>, value: (r) => r.projectId },
            { key: "c", label: "C − R", align: "right", render: (r) => <Money v={r.m.remC} />, value: (r) => r.m.remC },
          ]} />
        </Panel>
      </div>

      <Panel className="mt-4" pad={false} title="Project phasing" subtitle="Click a project to override its months, start or curve. Overrides are saved with your name and reason." tags={<Tag kind="assumption" />}>
        <DataTable rows={f.fc} rowKey={(x) => x.row.id} onRow={(x) => openProject(x.row.id)} search={(x) => `${x.row.entity} ${x.row.projectId} ${x.row.projectName}`} initialSort={{ key: "r", dir: "desc" }} cols={[
          { key: "p", label: "Project", render: (x) => <span><b className="font-medium">{x.row.entity} {x.row.projectId}</b> <span className="text-muted-foreground">{(x.row.projectName || "").slice(0, 28)}</span></span>, value: (x) => x.row.projectId },
          { key: "b", label: "Basis", render: (x) => <Pill tone={x.phase.basis === "project override" ? "gold" : x.phase.basis === "schedule date" ? "ok" : "muted"}>{x.phase.basis}</Pill>, value: (x) => x.phase.basis },
          { key: "mo", label: "Months", align: "right", value: (x) => x.phase.months }, { key: "st", label: "Starts", align: "right", render: (x) => x.phase.start ? `+${x.phase.start}` : "now", value: (x) => x.phase.start },
          { key: "cv", label: "Curve", value: (x) => x.phase.curve },
          { key: "r", label: "Remaining", align: "right", render: (x) => <Money v={x.rev.reduce((a, b) => a + b, 0)} />, value: (x) => x.rev.reduce((a, b) => a + b, 0) },
          { key: "n", label: "Next 12 mo", align: "right", render: (x) => <Money v={sum(x.rev, 12)} />, value: (x) => sum(x.rev, 12) },
        ]} />
      </Panel>
      <FcSheet open={open} onOpenChange={setOpen} a={f.a} planning={boot.settings.planning} can={canEdit(s.user?.role)} />
    </div>
  );
}

function num(v: string) { const x = Number(String(v).replace(/[$,]/g, "")); return v.trim() === "" ? null : Number.isFinite(x) ? x : NaN; }
function FcSheet({ open, onOpenChange, a, planning, can }: { open: boolean; onOpenChange: (o: boolean) => void; a: FcAssumptions; planning: { targetMonthly: number | null; gapPct: number }; can: boolean }) {
  const { toast } = useToast();
  const [x, setX] = useState<FcAssumptions>(a); const [tgt, setTgt] = useState(planning?.targetMonthly != null ? String(planning.targetMonthly) : ""); const [gp, setGp] = useState(String(Math.round((planning?.gapPct ?? 0.85) * 100)));
  const save = async () => {
    const t = num(tgt), g = Number(gp) / 100; if (Number.isNaN(t as number) || !(g > 0 && g <= 1.5)) return toast({ title: "Check the target and threshold", variant: "destructive" });
    try { await saveSetting("fc", { ...x, targetMonthly: t, gapPct: g }); await saveSetting("planning", { targetMonthly: t, gapPct: g }); toast({ title: "Forecast assumptions saved", description: "Everyone sees the updated forecast now." }); onOpenChange(false); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); }
  };
  return (
    <Sheet open={open} onOpenChange={(o) => { if (o) setX(a); onOpenChange(o); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Forecast assumptions</SheetTitle><SheetDescription>Proposed, pending executive approval. These drive every forecast, cash and capacity view. Changes are audited.</SheetDescription></SheetHeader>
        <div className="mt-4 space-y-4">
          <div><Label>Phasing curve</Label><Select value={x.curve} onValueChange={(v) => setX({ ...x, curve: v as Curve })} disabled={!can}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="straight">Straight-line — equal each month</SelectItem><SelectItem value="front">Front-loaded — more early</SelectItem><SelectItem value="back">Back-loaded — more late</SelectItem></SelectContent></Select></div>
          <div><Label>Default remaining months by business unit</Label><p className="mb-2 text-[12px] text-muted-foreground">Used only when a project has no end date and no override.</p><div className="grid grid-cols-2 gap-2">{Object.entries(x.buMonths).map(([bu, m]) => <div key={bu}><span className="text-[12px]">{bu}</span><Input type="number" min={1} value={m} disabled={!can} onChange={(e) => setX({ ...x, buMonths: { ...x.buMonths, [bu]: Math.max(1, Number(e.target.value) || 1) } })} /></div>)}</div></div>
          <div className="grid grid-cols-2 gap-2"><div><Label>Small project if remaining under</Label><Input value={x.smallRemaining} disabled={!can} onChange={(e) => setX({ ...x, smallRemaining: Number(e.target.value) || 0 })} /></div><div><Label>…finishes in (months)</Label><Input type="number" min={1} value={x.smallMonths} disabled={!can} onChange={(e) => setX({ ...x, smallMonths: Math.max(1, Number(e.target.value) || 1) })} /></div></div>
          <div className="flex items-center justify-between rounded-lg border p-3"><div><div className="text-[13px] font-medium">Include active JV</div><div className="text-[12px] text-muted-foreground">JV rows are excluded from operating KPIs by rule.</div></div><Switch checked={x.includeJV} disabled={!can} onCheckedChange={(v) => setX({ ...x, includeJV: v })} /></div>
          <div className="rounded-lg border p-3"><div className="mb-2 text-[13px] font-medium">Backlog gap detection</div><div className="grid grid-cols-2 gap-2"><div><Label>Monthly revenue target</Label><Input value={tgt} placeholder="blank — not entered" disabled={!can} onChange={(e) => setTgt(e.target.value)} data-testid="input-target" /></div><div><Label>Flag below (% of target)</Label><Input type="number" value={gp} disabled={!can} onChange={(e) => setGp(e.target.value)} /></div></div><p className="mt-2 text-[12px] text-muted-foreground">Left blank on purpose — the app does not guess a revenue target.</p></div>
          {can ? <Button className="w-full" onClick={save} data-testid="button-save-fc">Save assumptions</Button> : <Note>View only for your role.</Note>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
