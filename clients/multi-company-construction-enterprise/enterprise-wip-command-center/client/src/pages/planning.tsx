import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { ArrowRight, Database, Layers, TrendingUp, Wallet, ShieldCheck, Target } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useCash, OPEN_STAGES } from "@/lib/fc";
import { cashModel } from "@shared/calc";
import { PageHeader, Panel, Tag, Note, $, P, $M, Kpi, CHART, axisTick, tipStyle } from "@/components/kit";
import { Skeleton } from "./command";

export default function PlanningPage() {
  const { f, c, boot, view, opps } = useCash();
  const [slip, setSlip] = useState(0); const [fade, setFade] = useState(0); const [win, setWin] = useState(100);
  const d = useMemo(() => {
    if (!f || !c || !view || !boot) return null;
    const H = 12; const shift = (a: number[]) => a.map((_, i) => (i - slip >= 0 ? a[i - slip] : 0));
    const rev = shift(f.rev), cost = shift(f.cost).map((x, i) => x + (rev[i] - x) * fade / 100);
    const pipe = f.pipe.rev.map((x) => x * win / 100);
    const months = f.labels.slice(0, H).map((m, i) => ({ m, base: f.rev[i], rev: rev[i], pipe: pipe[i], gp: rev[i] - cost[i] + f.pipe.gp[i] * win / 100 }));
    const scen = slip || fade ? cashModel(f.fc.map((q) => ({ ...q, rev: shift(q.rev), cost: shift(q.cost).map((x, i) => x + (shift(q.rev)[i] - x) * fade / 100) })), boot.settings.cash, f.H) : c;
    const r12 = months.reduce((a, x) => a + x.rev, 0), p12 = months.reduce((a, x) => a + x.pipe, 0), g12 = months.reduce((a, x) => a + x.gp, 0);
    const low = scen.cum.slice(0, H).reduce((a, v, i) => (v < a.v ? { v, i } : a), { v: Infinity, i: -1 });
    const bonded = view.bondReport.filter((r) => r.bondStatus.startsWith("Bonded")).reduce((a, r) => a + Math.max(r.m.remC || 0, 0), 0);
    const pipeB = (opps.data || []).filter((o) => o.bonded && OPEN_STAGES.includes(o.stage)).reduce((a, o) => a + (o.value || 0) * (o.probability ?? 0), 0);
    const agg = boot.settings.surety.aggregate; const target = f.target;
    const gapIdx = target ? months.findIndex((x) => x.rev + x.pipe < target * f.gapPct) : -1;
    const pipeAll = (opps.data || []).filter((o) => OPEN_STAGES.includes(o.stage));
    return { months, r12, p12, g12, gm: r12 + p12 ? g12 / (r12 + p12) : null, low, bonded, pipeB, agg, head: agg != null ? agg - bonded - pipeB : null, target, gapIdx, cover: target ? (r12 + p12) / (target * 12) : null, pipeN: pipeAll.length, pipeW: pipeAll.reduce((a, o) => a + (o.value || 0) * (o.probability ?? 0), 0) };
  }, [f, c, view, boot, opps.data, slip, fade, win]);
  if (!d || !f || !view) return <div><PageHeader title="Executive planning" /><Skeleton /></div>;
  const what = slip || fade || win !== 100;
  const chain = [
    { to: "/portfolio", icon: Database, t: "WIP", v: `${view.eligible.length} projects`, s: "governed, reconciled" },
    { to: "/forecast", icon: Layers, t: "Backlog", v: $M(f.totalRem), s: "remaining contract" },
    { to: "/forecast", icon: TrendingUp, t: "Revenue forecast", v: $M(d.r12), s: "next 12 months" },
    { to: "/cash", icon: Wallet, t: "Cash flow", v: $M(d.low.v), s: boot!.settings.cash.openingCash == null ? "low point, before opening cash" : "12-month low point" },
    { to: "/capacity", icon: ShieldCheck, t: "Bond capacity", v: d.head != null ? $M(d.head) : "Limits blank", s: "headroom" },
    { to: "/planning", icon: Target, t: "Executive planning", v: d.target ? P(d.cover, 0) : "Set target", s: "12-mo coverage" },
  ];
  return (
    <div>
      <PageHeader title="Executive planning" subtitle="The governed WIP carried forward: backlog → revenue → cash → bond capacity, in one view. Use the what-if controls to stress timing and margin — they are not saved and do not change anyone else’s view."
        tags={<><Tag kind="forecast" /><Tag kind="proposed">Planning layer proposed, pending executive approval</Tag></>} />
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {chain.map((x, i) => <Link key={x.t} href={x.to} className="group relative block rounded-xl border bg-card p-3.5 transition hover:border-primary/50 hover:shadow-sm" data-testid={`chain-${i}`}>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-muted-foreground"><x.icon className="h-4 w-4 text-primary" />{x.t}</div>
          <div className="text-[19px] font-semibold tnum">{x.v}</div><div className="text-[11.5px] text-muted-foreground">{x.s}</div>
          {i < chain.length - 1 ? <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-background text-muted-foreground xl:block" /> : null}
        </Link>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Panel title={what ? "12-month outlook — what-if applied" : "12-month outlook"} subtitle={d.target ? `Target ${$M(d.target)}/month; gap flagged below ${P(f.gapPct, 0)}` : "No revenue target entered — set one in Forecast › Assumptions to detect backlog gaps"} tags={what ? <Tag kind="assumption">What-if, not saved</Tag> : <Tag kind="forecast" />}>
          <div className="h-[300px]"><ResponsiveContainer><ComposedChart data={d.months} margin={{ left: 4, right: 8, top: 6 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="m" tick={axisTick} /><YAxis tick={axisTick} tickFormatter={(v) => $M(v, 0)} width={58} />
            <Tooltip {...tipStyle} formatter={(v: any, n: any) => [$(v), n]} />
            <Bar dataKey="rev" name="Backlog revenue" stackId="a" fill={CHART.primary} /><Bar dataKey="pipe" name="Pipeline (weighted)" stackId="a" fill={CHART.gold} radius={[3, 3, 0, 0]} />
            {what ? <Line dataKey="base" name="Base forecast" stroke={CHART.muted} strokeDasharray="4 3" dot={false} /> : null}
            <Line dataKey="gp" name="Gross profit" stroke={CHART.terra} strokeWidth={2} dot={false} />
            {d.target ? <ReferenceLine y={d.target} stroke={CHART.bad} strokeDasharray="4 4" /> : null}
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </ComposedChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="What-if" subtitle="Local to your screen">
          <div className="space-y-5">
            <div><div className="mb-2 flex justify-between text-[13px]"><span>Schedule slip</span><b className="tnum">{slip} mo</b></div><Slider value={[slip]} min={0} max={6} step={1} onValueChange={([v]) => setSlip(v)} data-testid="slider-slip" /><p className="mt-1 text-[11.5px] text-muted-foreground">Delays all backlog revenue and cost</p></div>
            <div><div className="mb-2 flex justify-between text-[13px]"><span>Margin fade</span><b className="tnum">{fade}%</b></div><Slider value={[fade]} min={0} max={50} step={5} onValueChange={([v]) => setFade(v)} data-testid="slider-fade" /><p className="mt-1 text-[11.5px] text-muted-foreground">Share of remaining GP lost to cost growth</p></div>
            <div><div className="mb-2 flex justify-between text-[13px]"><span>Pipeline realization</span><b className="tnum">{win}%</b></div><Slider value={[win]} min={0} max={150} step={10} onValueChange={([v]) => setWin(v)} disabled={!f.pipe.used.length} /><p className="mt-1 text-[11.5px] text-muted-foreground">{f.pipe.used.length ? "Scales probability-weighted pipeline" : "No pipeline entered yet"}</p></div>
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="12-mo revenue" value={$M(d.r12 + d.p12)} sub={d.p12 ? `incl. ${$M(d.p12)} pipeline` : "backlog only"} kind="forecast" />
        <Kpi label="12-mo margin outlook" value={P(d.gm)} sub={$M(d.g12) + " GP"} kind="forecast" how={{ formula: "Σ GP ÷ Σ revenue (weighted)" }} />
        <Kpi label="Backlog gap begins" value={d.gapIdx >= 0 ? d.months[d.gapIdx].m : d.target ? "Not in 12 mo" : "No target"} tone={d.gapIdx >= 0 ? "warn" : undefined} kind={d.target ? "forecast" : "pending"} />
        <Kpi label="Cash low point" value={$M(d.low.v)} sub={(d.low.i >= 0 ? d.months[d.low.i].m : "") + (boot!.settings.cash.openingCash == null ? " · vs $0 opening (not entered)" : "")} kind="assumption" tone={d.low.v < 0 ? "bad" : undefined} />
        <Kpi label="Bond headroom" value={d.head != null ? $M(d.head) : "Limits blank"} kind={d.head != null ? "calc" : "pending"} tone={d.head != null && d.head < 0 ? "bad" : undefined} />
        <Kpi label="Open pipeline" value={d.pipeN ? $M(d.pipeW) : "—"} sub={d.pipeN ? `${d.pipeN} ${d.pipeN === 1 ? "opportunity" : "opportunities"}, weighted` : "none entered yet"} kind={d.pipeN ? "user" : "pending"} />
      </div>
      <Note>Every figure traces back to the governed WIP. Blank inputs (revenue target, surety limits, opening cash, pipeline) are shown as blank — the app does not fill them with estimates.</Note>
    </div>
  );
}
