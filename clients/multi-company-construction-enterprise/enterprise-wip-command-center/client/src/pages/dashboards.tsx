import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ScatterChart, Scatter, ZAxis,
  Treemap, ReferenceLine, Legend, PieChart, Pie,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useWip, useRows, matchFilters, useUI, toggleFilter } from "@/lib/app";
import { totals, groupBy, metrics, exceptions, EXC_GROUP, EXC_LABEL, type Row, type ExcCat } from "@shared/calc";
import { PageHeader, Panel, Tag, P, $M, $, CHART, axisTick, tipStyle, Note, Seg, DataTable } from "@/components/kit";
import { openProject } from "@/components/project";
import { BU_COLOR, Skeleton } from "./command";

const BOND_COLOR: Record<string, string> = { Bonded: CHART.primary, "Bonded - Number Unmatched": CHART.c5, Unbonded: CHART.muted, "Needs Review": CHART.gold };
const GRP_COLOR = { Financial: CHART.bad, Bond: CHART.gold, "Data quality": CHART.primary };
const M = (v: number) => $M(v, 0);
const MM = ({ v }: { v: number | null }) => <span className={`tnum ${(v ?? 0) < -0.5 ? "text-destructive" : ""}`}>{v === null ? "—" : $M(v, 1)}</span>;

function Delta({ cur, prev, kind = "money", invert = false }: { cur: number | null; prev: number | null; kind?: "money" | "pct" | "count"; invert?: boolean }) {
  if (cur === null || prev === null) return <span className="text-[12px] text-muted-foreground">No prior period</span>;
  const d = cur - prev;
  const txt = kind === "pct" ? `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)} pts` : kind === "count" ? `${d >= 0 ? "+" : ""}${d}` : `${d >= 0 ? "+" : "−"}${$M(Math.abs(d))}`;
  const flat = Math.abs(d) < (kind === "pct" ? 0.00005 : 0.5);
  const good = invert ? d < 0 : d > 0;
  const Icon = flat ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 text-[12px] font-medium tnum ${flat ? "text-muted-foreground" : good ? "text-ok" : "text-destructive"}`}><Icon className="h-3.5 w-3.5" />{txt}</span>;
}

function Stat({ label, value, children, testid }: { label: string; value: string; children?: React.ReactNode; testid?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4" data-testid={testid}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-[26px] font-semibold leading-none tnum">{value}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function TreeCell(props: any) {
  const { x, y, width, height, name, value, fill, depth } = props;
  if (depth !== 2 || width <= 0 || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} style={{ fill, stroke: "hsl(var(--card))", strokeWidth: 2, cursor: "pointer" }} />
      {width > 44 && height > 30 && <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight={600}>{name}</text>}
      {width > 60 && height > 46 && <text x={x + 8} y={y + 34} fill="#fff" fillOpacity={0.85} fontSize={11}>{$M(value, 1)}</text>}
    </g>
  );
}

export default function DashboardsPage() {
  const w = useWip(); const ui = useUI();
  const [billMode, setBillMode] = useState<"net" | "split">("split");
  const [entMetric, setEntMetric] = useState<"remC" | "remGP">("remC");
  const sorted = useMemo(() => [...(w.periods || [])].sort((a, b) => a.as_of.localeCompare(b.as_of)), [w.periods]);
  const prevP = w.period ? [...sorted].reverse().find((p) => p.as_of < w.period!.as_of) || null : null;
  const prevQ = useRows(prevP?.id);

  const d = useMemo(() => {
    if (!w.view || !w.boot) return null;
    const el = w.view.eligible; const t = totals(el);
    const fin = (rs: typeof el) => rs.filter((r) => r.exc.includes("LOSS") || r.exc.includes("UNDER")).length;
    const br = w.view.bondReport;
    const bondedRem = br.filter((r) => r.bondStatus === "Bonded" || r.bondStatus === "Bonded - Number Unmatched").reduce((a, r) => a + (r.m.remC || 0), 0);
    const brRem = br.reduce((a, r) => a + (r.m.remC || 0), 0);

    // previous period on the same filters and eligibility
    let prev: null | { t: ReturnType<typeof totals>; byEnt: Map<string, { remC: number; remGP: number }>; exc: Map<string, ExcCat[]>; hasLabels: boolean } = null;
    if (prevQ.data) {
      const all = prevQ.data as Row[];
      const pr = all.filter((r) => r.eligible && matchFilters(r, w.filters, w.boot!.entities));
      const byEnt = new Map<string, { remC: number; remGP: number }>();
      const exc = new Map<string, ExcCat[]>();
      pr.forEach((r) => {
        const m = metrics(r); const e = byEnt.get(r.entity) || { remC: 0, remGP: 0 };
        e.remC += m.remC || 0; e.remGP += m.remGP || 0; byEnt.set(r.entity, e);
        exc.set(`${r.entity}|${r.projectId}`, exceptions(r, m, w.th!));
      });
      prev = { t: totals(pr), byEnt, exc, hasLabels: all.some((r) => !!r.legacyExc) };
    }

    const byEnt = [...groupBy(el, (r) => r.entity)].map(([k, rs]) => {
      const tt = totals(rs);
      const g = { Financial: 0, Bond: 0, "Data quality": 0 } as Record<string, number>;
      rs.forEach((r) => { const seen = new Set(r.exc.map((c) => EXC_GROUP[c])); seen.forEach((x) => g[x]++); });
      return { k, bu: rs[0].bu, ...tt, gmPct: tt.remGM === null ? null : tt.remGM * 100, fin: fin(rs), g, company: rs[0].company,
        inPrev: !!prev && prev.byEnt.has(k), prevRemC: prev ? prev.byEnt.get(k)?.remC ?? null : null, prevRemGP: prev ? prev.byEnt.get(k)?.remGP ?? null : null,
        bondReview: rs.filter((r) => r.exc.includes("BOND")).length,
        bondedShare: (() => { const b = br.filter((r) => r.entity === k); const tot = b.reduce((a, r) => a + (r.m.remC || 0), 0); const bd = b.filter((r) => r.bondStatus === "Bonded" || r.bondStatus === "Bonded - Number Unmatched").reduce((a, r) => a + (r.m.remC || 0), 0); return tot > 0 ? bd / tot : null; })() };
    }).sort((a, b) => b.remC - a.remC);

    const tree = [...groupBy(el, (r) => r.bu)].map(([bu, rs]) => ({
      name: bu, children: [...groupBy(rs, (r) => r.entity)].map(([e, xs]) => ({ name: e, size: Math.max(0, totals(xs).remC), fill: BU_COLOR[bu] || CHART.muted })).filter((x) => x.size > 0),
    }));

    const gmBins = [
      { k: "Loss (< 0%)", lo: -Infinity, hi: 0, tone: CHART.bad }, { k: "0–5%", lo: 0, hi: 0.05, tone: CHART.terra },
      { k: "5–10%", lo: 0.05, hi: 0.1, tone: CHART.gold }, { k: "10–15%", lo: 0.1, hi: 0.15, tone: CHART.c5 },
      { k: "15–20%", lo: 0.15, hi: 0.2, tone: CHART.primary }, { k: "20%+", lo: 0.2, hi: Infinity, tone: CHART.ok },
    ].map((b) => { const rs = el.filter((r) => r.m.remGM !== null && (r.m.remC || 0) > 0 && r.m.remGM >= b.lo && r.m.remGM < b.hi); return { ...b, n: rs.length, remC: rs.reduce((a, r) => a + (r.m.remC || 0), 0) }; });
    const gmNA = el.filter((r) => r.m.remGM === null || (r.m.remC || 0) <= 0).length;

    const pcBins = Array.from({ length: 5 }, (_, i) => ({ k: `${i * 20}–${i * 20 + 20}%`, lo: i * 0.2, hi: i === 4 ? Infinity : i * 0.2 + 0.2 }))
      .map((b) => { const rs = el.filter((r) => r.m.pctRev !== null && r.m.pctRev >= b.lo && r.m.pctRev < b.hi); return { ...b, n: rs.length, remC: rs.reduce((a, r) => a + (r.m.remC || 0), 0) }; });
    const pcNA = el.filter((r) => r.m.pctRev === null).length;

    const bondByBu = [...groupBy(br, (r) => r.bu)].map(([bu, rs]) => {
      const o: any = { bu };
      Object.keys(BOND_COLOR).forEach((c) => (o[c] = rs.filter((r) => r.bondStatus === c).reduce((a, r) => a + (r.m.remC || 0), 0)));
      return o;
    });

    // completion timeline from source schedule dates
    const qOf = (s: string) => { const [y, m] = s.split("-").map(Number); return `${y} Q${Math.floor((m - 1) / 3) + 1}`; };
    const asOf = w.period!.as_of;
    const tl = new Map<string, { remC: number; n: number }>();
    let noDate = { remC: 0, n: 0 }, past = { remC: 0, n: 0 };
    el.forEach((r) => {
      const v = r.m.remC || 0; if (v <= 0) return;
      if (!r.endDate) { noDate.remC += v; noDate.n++; return; }
      if (r.endDate < asOf) { past.remC += v; past.n++; return; }
      const q = qOf(r.endDate); const c = tl.get(q) || { remC: 0, n: 0 }; c.remC += v; c.n++; tl.set(q, c);
    });
    const timeline = [...tl].sort(([a], [b]) => a.localeCompare(b)).slice(0, 12).map(([k, v]) => ({ k, ...v }));
    const tlLater = [...tl].sort(([a], [b]) => a.localeCompare(b)).slice(12).reduce((a, [, v]) => ({ remC: a.remC + v.remC, n: a.n + v.n }), { remC: 0, n: 0 });

    const bill = byEnt.map((e) => ({ k: e.k, under: -e.under, over: e.over, net: e.net })).sort((a, b) => a.net - b.net);
    const riskExcl = el.filter((r) => !((r.m.remC || 0) > 0 && r.m.remGM !== null)).length;
    const byRem = [...el].sort((a, b) => (b.m.remC || 0) - (a.m.remC || 0) || `${a.entity}|${a.projectId}`.localeCompare(`${b.entity}|${b.projectId}`));
    const top10 = byRem.slice(0, 10).reduce((a, r) => a + Math.max(0, r.m.remC || 0), 0);
    const posRem = el.reduce((a, r) => a + Math.max(0, r.m.remC || 0), 0);
    const conc = { top10, share: posRem > 0 ? top10 / posRem : null, topEnt: byEnt[0] ? { k: byEnt[0].k, share: posRem > 0 ? Math.max(0, byEnt[0].remC) / posRem : null } : null };

    // exception aging: same project flagged last month vs new this month
    const AGE_CATS: ExcCat[] = ["LOSS", "UNDER", "BOND", "EAC_LT_ACTUAL", "NEG_REMC", "MISSING_INPUT"];
    const lossComparable = !!prev && !(w.th!.lossBasis === "legacy" && (!prev.hasLabels || !w.view.all.some((r) => !!r.legacyExc)));
    const aging = !prev ? null : AGE_CATS.filter((c) => c !== "LOSS" || lossComparable).map((c) => {
      let carried = 0, fresh = 0, resolved = 0;
      el.forEach((r) => { if (!r.exc.includes(c)) return; const p = prev!.exc.get(`${r.entity}|${r.projectId}`); if (p && p.includes(c)) carried++; else fresh++; });
      const curKeys = new Map<string, (typeof el)[number]>(el.map((r) => [`${r.entity}|${r.projectId}`, r]));
      prev!.exc.forEach((cats, key) => { const cur = curKeys.get(key); if (cats.includes(c) && cur && !cur.exc.includes(c)) resolved++; });
      return { k: EXC_LABEL[c], carried, fresh, resolved };
    }).filter((x) => x.carried + x.fresh + x.resolved > 0);

    const risk = byRem.filter((r) => (r.m.remC || 0) > 0 && r.m.remGM !== null).slice(0, 60)
      .map((r) => ({ x: r.m.remC, y: (r.m.remGM || 0) * 100, z: Math.abs(r.m.ob || 0), r, bu: r.bu }));

    return { el, t, fin: fin(el), prev, byEnt, riskExcl, conc, aging, lossComparable, tree, gmBins, gmNA, pcBins, pcNA, bondByBu, bondedRem, brRem, timeline, noDate, past, tlLater, bill, risk };
  }, [w.view, w.boot, w.th, w.filters, prevQ.data, w.period]);

  if (!d || !w.period) return <div><PageHeader title="Dashboards" /><Skeleton /></div>;
  const pickEnt = (k: string) => toggleFilter("entity", k);
  const onCat = (st: any) => { if (st?.activeLabel) pickEnt(String(st.activeLabel)); };
  const prevLbl = prevP ? `${prevP.label}${prevP.status !== "published" ? " (in review)" : ""}` : null;
  const statusNote = w.period.status !== "published" ? " · this month is in review, not yet published" : "";

  return (
    <div>
      <PageHeader
        title="Dashboards"
        subtitle={<>Visual view of {w.period.label}{prevLbl ? <> compared with {prevLbl}</> : null}{statusNote}. Every chart is recalculated from the governed rows and follows the filters at the top. Click any company or business unit to drill in; click it again, or use Back in the bar at the top, to step back out.</>}
        tags={<><Tag kind="calc" /><Tag kind="source">Source dates</Tag></>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Stat label="Backlog" value={$M(d.t.remC)} testid="dash-backlog"><Delta cur={d.t.remC} prev={d.prev?.t.remC ?? null} /></Stat>
        <Stat label="Remaining GP" value={$M(d.t.remGP)}><Delta cur={d.t.remGP} prev={d.prev?.t.remGP ?? null} /></Stat>
        <Stat label="Weighted remaining GM" value={P(d.t.remGM, 2)}><Delta cur={d.t.remGM} prev={d.prev?.t.remGM ?? null} kind="pct" /></Stat>
        <Stat label="Net over / (under) billed" value={$M(d.t.net)}><Delta cur={d.t.net} prev={d.prev?.t.net ?? null} /></Stat>
        <Stat label="Eligible projects" value={String(d.t.count)}><Delta cur={d.t.count} prev={d.prev?.t.count ?? null} kind="count" /></Stat>
      </div>
      {prevLbl && <p className="mt-2 text-[12px] text-muted-foreground">Changes compare with {prevLbl} on the same filters{d.byEnt.some((e) => !e.inPrev) ? <> ({d.byEnt.filter((e) => !e.inPrev).map((e) => e.k).join(", ")} had no WIP that month, so {d.byEnt.filter((e) => !e.inPrev).length === 1 ? "its" : "their"} backlog shows as new)</> : null}. Two periods are a comparison, not a trend; trend lines appear once three or more months are loaded.</p>}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Panel title="Where the backlog sits" subtitle={<>Remaining contract by business unit and entity. Box size = backlog. Top 10 projects hold <b className="text-foreground">{P(d.conc.share, 1)}</b>{d.conc.topEnt ? <>; the largest entity, {d.conc.topEnt.k}, holds <b className="text-foreground">{P(d.conc.topEnt.share, 1)}</b></> : null}.</>} tags={<Tag kind="calc" />}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={d.tree} dataKey="size" isAnimationActive={false} content={<TreeCell />} onClick={(n: any) => n?.name && n.depth === 2 && pickEnt(n.name)}>
                <Tooltip {...tipStyle} formatter={(v: any) => [$(v), "Remaining contract"]} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <BuLegend />
        </Panel>

        <Panel title={`${entMetric === "remC" ? "Backlog" : "Remaining GP"} by entity${prevLbl ? `: ${prevP!.label} vs ${w.period.label}` : ""}`} subtitle={entMetric === "remC" ? "Remaining contract (C − R), eligible projects" : "Remaining gross profit (C − R) − (E − A), eligible projects"} tags={<Tag kind="calc" />} actions={<Seg value={entMetric} onChange={(v) => setEntMetric(v)} testid="seg-ent-metric" options={[{ value: "remC", label: "Backlog" }, { value: "remGP", label: "Remaining GP" }]} />}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.byEnt} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} onClick={onCat} className="cursor-pointer">
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="k" tick={axisTick} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={44} />
                <YAxis tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} width={52} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, n: any) => [$(v), n]} />
                {prevLbl && <Bar isAnimationActive={false} name={prevP!.label} dataKey={entMetric === "remC" ? "prevRemC" : "prevRemGP"} fill={CHART.muted} fillOpacity={0.45} radius={[3, 3, 0, 0]} />}
                <Bar isAnimationActive={false} name={w.period.label} dataKey={entMetric} fill={CHART.primary} radius={[3, 3, 0, 0]}>
                  {d.byEnt.map((e) => <Cell key={e.k} fill={BU_COLOR[e.bu] || CHART.muted} />)}
                </Bar>
                {prevLbl && <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {prevLbl && d.byEnt.some((e) => !e.inPrev) && <p className="text-[12px] text-muted-foreground">No {prevP!.label} WIP for {d.byEnt.filter((e) => !e.inPrev).map((e) => e.k).join(", ")}, so the month-over-month change for the enterprise includes that gap.</p>}
        </Panel>

        <Panel title="Margin vs size: largest 60 projects" subtitle="Each dot is a project. Right = more backlog; lower = thinner margin. Bubble size = billing position. Click a dot to open it." tags={<Tag kind="calc" />}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Remaining contract" tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} scale="log" domain={["auto", "auto"]} />
                <YAxis type="number" dataKey="y" name="Remaining GM" tick={axisTick} tickFormatter={(v) => `${v.toFixed(0)}%`} axisLine={false} tickLine={false} width={44} />
                <ZAxis type="number" dataKey="z" range={[30, 400]} />
                <ReferenceLine y={(d.t.remGM || 0) * 100} stroke={CHART.gold} strokeDasharray="4 4" label={{ value: `Enterprise ${P(d.t.remGM, 1)}`, fill: CHART.muted, fontSize: 11, position: "insideTopRight" }} />
                <ReferenceLine y={0} stroke={CHART.bad} strokeOpacity={0.5} />
                <Tooltip {...tipStyle} content={({ payload }: any) => { const p = payload?.[0]?.payload; if (!p) return null; return <div className="rounded-lg border bg-popover px-3 py-2 text-[12px] shadow"><div className="font-semibold">{p.r.entity} {p.r.projectId}</div><div className="text-muted-foreground">{p.r.projectName}</div><div className="mt-1 tnum">Remaining {$(p.x)} · GM {p.y.toFixed(1)}% · Over/(under) {$(p.r.m.ob)}</div></div>; }} />
                <Scatter isAnimationActive={false} data={d.risk} onClick={(p: any) => p?.r && openProject(p.r.id)} className="cursor-pointer">
                  {d.risk.map((p, i) => <Cell key={i} fill={p.y < 0 ? CHART.bad : BU_COLOR[p.bu] || CHART.muted} fillOpacity={0.7} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <BuLegend extra={<span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" />Negative margin</span>} />
          {d.riskExcl > 0 && <p className="mt-1 text-[12px] text-muted-foreground">{d.riskExcl} projects are left off because remaining contract is zero or negative, so margin can't be computed. They are listed under Exceptions.</p>}
        </Panel>

        <Panel title="Margin distribution" subtitle="Remaining contract by remaining-GM band (projects with positive backlog)" tags={<Tag kind="calc" />}>
          <div style={{ height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.gmBins} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="k" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} width={52} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, _n: any, p: any) => [`${$(v)} · ${p.payload.n} projects`, "Remaining contract"]} />
                <Bar isAnimationActive={false} dataKey="remC" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: CHART.muted, formatter: (v: number) => (v ? $M(v, 0) : "") }}>
                  {d.gmBins.map((b) => <Cell key={b.k} fill={b.tone} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[12px] text-muted-foreground">{d.gmBins.map((b) => `${b.k}: ${b.n}`).join(" · ")}{d.gmNA ? ` · Not computable or no backlog: ${d.gmNA}` : ""}</p>
        </Panel>

        <Panel title="Billing position by entity" subtitle="Over-billed (+) and under-billed (−), B − R" tags={<Tag kind="calc" />} actions={<Seg value={billMode} onChange={(v: any) => setBillMode(v)} options={[{ value: "split", label: "Gross" }, { value: "net", label: "Net" }]} />}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.bill} layout="vertical" stackOffset="sign" margin={{ left: 0, right: 12, top: 4, bottom: 4 }} onClick={onCat} className="cursor-pointer">
                <CartesianGrid horizontal={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis type="number" tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="k" tick={axisTick} width={48} interval={0} axisLine={false} tickLine={false} />
                <ReferenceLine x={0} stroke={CHART.muted} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, n: any) => [$(v), n]} />
                {billMode === "net" ? (
                  <Bar isAnimationActive={false} name="Net over / (under)" dataKey="net" radius={3}>
                    {d.bill.map((b) => <Cell key={b.k} fill={b.net < 0 ? CHART.bad : CHART.primary} />)}
                  </Bar>
                ) : (<>
                  <Bar isAnimationActive={false} name="Under-billed" dataKey="under" stackId="s" fill={CHART.bad} />
                  <Bar isAnimationActive={false} name="Over-billed" dataKey="over" stackId="s" fill={CHART.primary} />
                </>)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Exceptions by entity" subtitle="Projects with at least one flag in each group (a project can appear in more than one)" tags={<Tag kind="calc" />} actions={<Link href="/exceptions" className="text-[12.5px] font-medium text-primary hover:underline">Open exceptions</Link>}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.byEnt.map((e) => ({ k: e.k, ...e.g }))} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} onClick={onCat} className="cursor-pointer">
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="k" tick={axisTick} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={44} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                {(Object.keys(GRP_COLOR) as (keyof typeof GRP_COLOR)[]).map((g) => <Bar isAnimationActive={false} key={g} dataKey={g} stackId="e" fill={GRP_COLOR[g]} />)}
                <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Bond mix by business unit" subtitle={`Remaining contract on the bond report · bonded share ${P(d.brRem ? d.bondedRem / d.brRem : null, 1)}`} tags={<Tag kind="calc" />} actions={<Link href="/bonds" className="text-[12.5px] font-medium text-primary hover:underline">Open Bond Center</Link>}>
          <div className="grid gap-4 md:grid-cols-[1fr_190px]">
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.bondByBu} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={CHART.grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="bu" tick={axisTick} width={92} axisLine={false} tickLine={false} />
                  <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, n: any) => [$(v), n]} />
                  {Object.entries(BOND_COLOR).map(([k, c]) => <Bar isAnimationActive={false} key={k} dataKey={k} stackId="b" fill={c} className="cursor-pointer" onClick={(x: any) => toggleFilter("bu", x.bu)} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={Object.keys(BOND_COLOR).map((k) => ({ k, v: d.bondByBu.reduce((a: number, b: any) => a + Math.max(0, b[k]), 0) }))} dataKey="v" nameKey="k" innerRadius={52} outerRadius={80} paddingAngle={2} isAnimationActive={false}>
                    {Object.entries(BOND_COLOR).map(([k, c]) => <Cell key={k} fill={c} />)}
                  </Pie>
                  <Tooltip {...tipStyle} formatter={(v: any, n: any) => [$(v), n]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground">A bond amount is not bonding capacity. Surety limits are still blank.</p>
        </Panel>

        <Panel title="Percent complete" subtitle="Projects and remaining contract by revenue completion (R ÷ C)" tags={<Tag kind="calc" />}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.pcBins} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="k" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} width={52} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, _n: any, p: any) => [`${$(v)} · ${p.payload.n} projects`, "Remaining contract"]} />
                <Bar isAnimationActive={false} dataKey="remC" fill={CHART.primary} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: CHART.muted, formatter: (v: number) => (v ? $M(v, 0) : "") }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[12px] text-muted-foreground">{d.pcBins.map((b) => `${b.k}: ${b.n}`).join(" · ")}{d.pcNA ? ` · No contract value: ${d.pcNA}` : ""}</p>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Company scorecard" subtitle="One row per entity, same filters and rules as every chart. Click a row to drill in; click it again to step back." pad={false} tags={<Tag kind="calc" />}>
          <DataTable rows={d.byEnt} rowKey={(r) => r.k} onRow={(r) => pickEnt(r.k)} pageSize={25} dense testid="table-scorecard"
            rowClass={(r) => (ui.filters.entity === r.k ? "bg-primary/[0.07]" : "")}
            initialSort={{ key: "remC", dir: "desc" }}
            cols={[
              { key: "k", label: "Entity", value: (r) => r.k, render: (r) => <span className="font-semibold">{r.k}</span> },
              { key: "bu", label: "Unit", value: (r) => r.bu, render: (r) => <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ background: BU_COLOR[r.bu] || CHART.muted }} />{r.bu}</span> },
              { key: "count", label: "Projects", align: "right", value: (r) => r.count },
              { key: "remC", label: "Backlog", align: "right", value: (r) => r.remC, render: (r) => <MM v={r.remC} /> },
              { key: "dRem", label: prevLbl ? `Δ vs ${prevP!.label.split(" ")[0]}` : "Δ prior", align: "right", value: (r) => (r.prevRemC === null ? null : r.remC - r.prevRemC), render: (r) => r.prevRemC === null ? <span className="text-[11.5px] text-muted-foreground" title="No WIP for this entity in the prior month">{prevLbl ? `Not in ${prevP!.label.split(" ")[0]}` : "—"}</span> : <MM v={r.remC - r.prevRemC} /> },
              { key: "remGP", label: "Rem. GP", align: "right", value: (r) => r.remGP, render: (r) => <MM v={r.remGP} /> },
              { key: "gm", label: "GM", align: "right", value: (r) => r.remGM, render: (r) => <span className={(r.remGM ?? 0) < 0 ? "text-destructive" : ""}>{P(r.remGM, 1)}</span> },
              { key: "under", label: "Under-billed", align: "right", value: (r) => r.under, render: (r) => <MM v={r.under ? -r.under : 0} /> },
              { key: "fin", label: "Fin. exc.", align: "right", value: (r) => r.fin, render: (r) => r.fin ? <span className="font-semibold text-destructive">{r.fin}</span> : <span className="text-muted-foreground">0</span> },
              { key: "bondReview", label: "Bond review", align: "right", value: (r) => r.bondReview },
              { key: "bonded", label: "Bonded", align: "right", value: (r) => r.bondedShare, render: (r) => P(r.bondedShare, 0) },
            ]} />
          <div className="border-t px-4 py-2 text-[12px] text-muted-foreground tnum">Total: {d.t.count} projects · {$(d.t.remC)} backlog · {$(d.t.remGP)} remaining GP · {P(d.t.remGM, 2)} weighted GM</div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Panel title="Exception aging" subtitle={prevLbl ? `Flags this month: carried over from ${prevP!.label} vs new. Resolved = flagged last month, clear now.` : "Needs a prior month to compare"} tags={<Tag kind="calc" />}>
          {!d.aging ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed px-6 text-center text-[13px] text-muted-foreground">{w.period.label} is the earliest month loaded, so there is nothing to age against yet.</div>
          ) : (<>
            <div style={{ height: Math.max(200, d.aging.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.aging} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={CHART.grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="k" tick={axisTick} width={150} axisLine={false} tickLine={false} interval={0} />
                  <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar isAnimationActive={false} name="Carried over" dataKey="carried" stackId="a" fill={CHART.bad} />
                  <Bar isAnimationActive={false} name="New this month" dataKey="fresh" stackId="a" fill={CHART.gold} />
                  <Bar isAnimationActive={false} name="Resolved" dataKey="resolved" fill={CHART.ok} />
                  <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!d.lossComparable && <p className="text-[12px] text-muted-foreground">Projected loss is left out: {prevP!.label}'s files have no workbook loss labels. Switch the loss basis on the Command Center to ITD GP or At completion to age losses on a like-for-like rule.</p>}
          </>)}
        </Panel>

        <Panel title="When the backlog is scheduled to finish" subtitle="Remaining contract by the project end date reported in each WIP, by quarter. Dates are source data; this is not a revenue forecast." tags={<Tag kind="source">Source dates</Tag>}>
          {d.timeline.length + d.past.n + d.tlLater.n === 0 ? (
            <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border border-dashed text-center text-[13px] text-muted-foreground">
              <div className="font-medium text-foreground">Project end dates are not in this month's source</div>
              <div className="mt-1 max-w-xl">The {w.period.label} baseline came from the consolidated workbook, which does not carry schedule dates. Switch to a month loaded from the company WIPs (for example June 2026) to see this view. Nothing is estimated.</div>
            </div>
          ) : <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...(d.past.n ? [{ k: "Past due", ...d.past }] : []), ...d.timeline, ...(d.tlLater.n ? [{ k: "Later", ...d.tlLater }] : []), ...(d.noDate.n ? [{ k: "No end date", ...d.noDate }] : [])]} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="k" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} tickFormatter={M} axisLine={false} tickLine={false} width={52} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, _n: any, p: any) => [`${$(v)} · ${p.payload.n} projects`, "Remaining contract"]} />
                <Bar isAnimationActive={false} dataKey="remC" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: CHART.muted, formatter: (v: number) => (v ? $M(v, 0) : "") }}>
                  {[...(d.past.n ? ["Past due"] : []), ...d.timeline.map((x) => x.k), ...(d.tlLater.n ? ["Later"] : []), ...(d.noDate.n ? ["No end date"] : [])].map((k) => <Cell key={k} fill={k === "Past due" ? CHART.terra : k === "No end date" ? CHART.muted : CHART.primary} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>}
          {d.noDate.n > 0 && d.timeline.length > 0 && <p className="text-[12px] text-muted-foreground">{d.noDate.n} projects ({$M(d.noDate.remC)}) have no end date in their WIP.</p>}
          {d.past.n > 0 && <Note tone="warn">{d.past.n} projects with {$M(d.past.remC)} of backlog have an end date before {w.period.as_of}. Their schedules may need updating in the next WIP.</Note>}
        </Panel>
            </div>
    </div>
  );
}

function BuLegend({ extra }: { extra?: React.ReactNode }) {
  return <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-muted-foreground">{Object.entries(BU_COLOR).slice(0, 3).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{k}</span>)}{extra}</div>;
}
