import { useMemo } from "react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { ArrowRight, Inbox, TrendingUp, Database, Layers, Wallet, ShieldCheck, Target, AlertTriangle, Scale, ChevronRight } from "lucide-react";
import { useCash } from "@/lib/fc";
import { Button } from "@/components/ui/button";
import { useWip, setUI, useUI, filtersActive, toggleFilter } from "@/lib/app";
import { totals, groupBy, lossHit, lossAmount, EXC_LABEL, EXC_GROUP, type ExcCat, type LossBasis } from "@shared/calc";
import { Kpi, PageHeader, Panel, Tag, HowCalc, Seg, DataTable, Money, P, $M, $, Pill, Note, CHART, axisTick, tipStyle, Bar } from "@/components/kit";
import { openProject } from "@/components/project";
import { statusLabel } from "@/components/shell";

export const BU_COLOR: Record<string, string> = { Civil: "hsl(var(--primary))", Environmental: "hsl(var(--ok))", "Vertical & Structures": "hsl(var(--gold))", "Electrical & Mechanical": "hsl(var(--terra))" };
export function Skeleton() { return <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted/40" />)}</div>; }

export default function CommandPage() {
  const w = useWip(); const ui = useUI();
  const basis: LossBasis = w.th?.lossBasis || "legacy";
  const d = useMemo(() => {
    if (!w.view || !w.th) return null;
    const el = w.view.eligible; const t = totals(el);
    const br = w.view.bondReport; const bonded = br.filter((r) => r.bondStatus === "Bonded" || r.bondStatus === "Bonded - Number Unmatched");
    const brRem = br.reduce((a, r) => a + (r.m.remC || 0), 0), bRem = bonded.reduce((a, r) => a + (r.m.remC || 0), 0);
    const fin = el.filter((r) => r.exc.includes("LOSS") || r.exc.includes("UNDER"));
    const byEnt = [...groupBy(el, (r) => r.entity)].map(([k, rs]) => ({ k, bu: rs[0].bu, ...totals(rs), exc: rs.filter((r) => r.exc.includes("LOSS") || r.exc.includes("UNDER")).length })).sort((a, b) => b.remC - a.remC);
    const byBu = [...groupBy(el, (r) => r.bu)].map(([k, rs]) => ({ k, ...totals(rs) })).sort((a, b) => b.remC - a.remC);
    const topRem = [...el].sort((a, b) => (b.m.remC || 0) - (a.m.remC || 0)).slice(0, 15);
    const losses = el.filter((r) => lossHit(r, r.m, w.th!, basis)).sort((a, b) => (lossAmount(a.m, basis) || 0) - (lossAmount(b.m, basis) || 0)).slice(0, 15);
    const cats: Record<string, number> = {}; el.forEach((r) => r.exc.forEach((c) => (cats[c] = (cats[c] || 0) + 1)));
    const sev = { Critical: el.filter((r) => r.exc.includes("LOSS") || r.exc.includes("UNDER")).length, Warning: 0, OK: 0 };
    el.forEach((r) => { if (!(r.exc.includes("LOSS") || r.exc.includes("UNDER"))) { if (r.exc.length) sev.Warning++; else sev.OK++; } });
    const bondReview = br.filter((r) => r.bondStatus === "Needs Review").length;
    return { t, el, br, brRem, bRem, fin, byEnt, byBu, topRem, losses, cats, sev, bondReview };
  }, [w.view, w.th, basis]);
  if (!d || !w.period) return <div><PageHeader title="Command Center" /><Skeleton /></div>;
  const { t } = d; const allRows = w.view!.scoped.length;
  const maxEnt = Math.max(...d.byEnt.map((x) => x.remC), 1);
  return (
    <div>
      <Hero d={d} allRows={allRows} />

      <div className="mt-6 flex items-end justify-between gap-3">
        <div><div className="eyebrow text-[10.5px]">Portfolio fundamentals</div><h2 className="mt-1 text-[17px] font-semibold tracking-tight">Every figure recalculated from source rows</h2></div>
        <div className="hidden flex-wrap gap-1.5 sm:flex"><Tag kind="source">Source: 19 submitted WIPs</Tag><Tag kind="calc">Governed formulas</Tag>{filtersActive(ui.filters) ? <Pill tone="gold">Filtered view</Pill> : null}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Kpi label="Reporting-eligible projects" value={t.count.toLocaleString()} sub={`of ${allRows.toLocaleString()} submitted rows (rules applied)`} kind="calc" how={{ formula: "count(rows where no active exclusion rule applies, or override = include)", inputs: [["Submitted rows", allRows.toLocaleString()], ["Excluded", (allRows - t.count).toLocaleString()]], note: "See Rules & Formulas for each exclusion rule and its approval basis." }} />
        <Kpi label="Current contract" value={$M(t.C)} sub={$(t.C)} kind="source" how={{ formula: "Σ current/revised contract (C)", note: "Supplied source value — not forced to equal original + mods." }} />
        <Kpi label="Remaining contract (backlog)" value={$M(t.remC)} sub={$(t.remC, 2)} kind="calc" how={{ formula: "Σ (C − R)", inputs: [["Σ C", $(t.C, 2)], ["Σ R (ITD earned revenue)", $(t.R, 2)]] }} />
        <Kpi label="Remaining cost" value={$M(t.remCost)} sub={$(t.remCost, 2)} kind="calc" how={{ formula: "Σ (E − A)", inputs: [["Σ E (EAC)", $(t.E, 2)], ["Σ A (ITD cost)", $(t.A, 2)]] }} />
        <Kpi label="Remaining gross profit" value={$M(t.remGP)} sub={$(t.remGP, 2)} kind="calc" how={{ formula: "Σ (C − R) − Σ (E − A)", inputs: [["Remaining contract", $(t.remC, 2)], ["Remaining cost", $(t.remCost, 2)]] }} />
        <Kpi label="Weighted remaining GM" value={P(t.remGM, 2)} sub="Σ remaining GP ÷ Σ remaining contract" kind="calc" how={{ formula: "Σ remaining GP ÷ Σ remaining contract", inputs: [["Remaining GP", $(t.remGP, 2)], ["Remaining contract", $(t.remC, 2)], ["Result", P(t.remGM, 10)]], note: "Weighted — project percentages are never averaged." }} />
        <Kpi label="ITD gross profit" value={$M(t.itdGP)} sub={$(t.itdGP, 2)} kind="calc" how={{ formula: "Σ (R − A)", inputs: [["Σ R", $(t.R, 2)], ["Σ A", $(t.A, 2)]] }} />
        <Kpi label="Net over / (under) billed" value={<Money v={t.net} />} sub={<>Under {$M(t.under)} · Over {$M(t.over)}</>} kind="calc" tone={t.net < 0 ? "bad" : undefined} how={{ formula: "Σ (B − R)", inputs: [["Σ B (billings)", $(t.B, 2)], ["Σ R", $(t.R, 2)]] }} />
        <Link href="/exceptions"><Kpi label="Financial exceptions" value={d.fin.length} sub={`${d.cats.LOSS || 0} loss · ${d.cats.UNDER || 0} underbilled (overlap counted once)`} tone="bad" kind="calc" how={{ formula: `projects with a loss label (${basis}) or underbilling > ${$(w.th!.underThreshold)}`, note: "Thresholds are editable in Rules & Formulas." }} /></Link>
        <Link href="/bonds"><Kpi label="Bonded share of backlog" value={P(d.brRem ? d.bRem / d.brRem : null, 2)} sub={`${$M(d.bRem)} of ${$M(d.brRem)} · ${d.br.length} bond-report rows`} kind="calc" how={{ formula: "Σ remaining contract (Bonded + Bonded–Number Unmatched) ÷ Σ remaining contract (bond report)", note: "Bond report = eligible rows + active JV rows." }} /></Link>
        <Kpi label="Forecast GP at completion" value={$M(t.fcGP)} sub="Σ (C − E)" kind="calc" how={{ formula: "Σ (C − E)", inputs: [["Σ C", $(t.C, 2)], ["Σ E", $(t.E, 2)]] }} />
        <Kpi label="Health mix" value={<span className="text-[20px]">{d.sev.Critical} · {d.sev.Warning} · {d.sev.OK}</span>} sub="Critical · Warning · OK projects" kind="calc" how={{ formula: "Critical = financial exception; Warning = bond or data-quality flag only; OK = no flags" }} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Backlog by entity" subtitle="Remaining contract (C − R), eligible projects, colored by business unit" tags={<Tag kind="calc" />}>
          <div style={{ height: Math.max(260, d.byEnt.length * 26) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.byEnt} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis type="number" tick={axisTick} tickFormatter={(v) => $M(v, 0)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="k" tick={axisTick} width={48} axisLine={false} tickLine={false} />
                <Tooltip {...tipStyle} cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any, n: any) => [$(v), "Remaining contract"]} labelFormatter={(l) => { const e = d.byEnt.find((x) => x.k === l); return `${l} · ${e?.bu} · ${e?.count} projects · GM ${P(e?.remGM ?? null)}`; }} />
                <RBar isAnimationActive={false} dataKey="remC" radius={[0, 4, 4, 0]} onClick={(x: any) => toggleFilter("entity", x.k)} className="cursor-pointer">
                  {d.byEnt.map((e) => <Cell key={e.k} fill={BU_COLOR[e.bu] || CHART.muted} />)}
                </RBar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-muted-foreground">{Object.entries(BU_COLOR).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{k}</span>)}<span className="ml-auto">Click a bar to filter</span></div>
        </Panel>
        <Panel title="Business-unit rollup" subtitle="Weighted margin — Σ GP ÷ Σ remaining contract" pad={false} tags={<Tag kind="calc" />}>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b text-[11.5px] uppercase tracking-wide text-muted-foreground"><th className="px-4 py-2 text-left">Business unit</th><th className="px-2 py-2 text-right">Projects</th><th className="px-2 py-2 text-right">Remaining</th><th className="px-2 py-2 text-right">Rem. GP</th><th className="px-4 py-2 text-right">GM</th></tr></thead>
            <tbody>
              {d.byBu.map((b) => (
                <tr key={b.k} className="cursor-pointer border-b border-border/60 hover:bg-muted/50" onClick={() => toggleFilter("bu", b.k)}>
                  <td className="px-4 py-2.5"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BU_COLOR[b.k] }} />{b.k}</span></td>
                  <td className="px-2 text-right tnum">{b.count}</td><td className="px-2 text-right tnum">{$M(b.remC)}</td><td className="px-2 text-right tnum">{$M(b.remGP)}</td><td className="px-4 text-right font-medium tnum">{P(b.remGM, 2)}</td>
                </tr>
              ))}
              {w.boot!.entities.some((e) => e.bu === "Electrical & Mechanical") && !d.byBu.find((b) => b.k === "Electrical & Mechanical") ? <tr className="border-b border-border/60 text-muted-foreground"><td className="px-4 py-2.5">Electrical & Mechanical</td><td className="px-2 text-right">0</td><td className="px-2 text-right" colSpan={3}>No eligible projects this period</td></tr> : null}
              <tr className="bg-muted/40 font-semibold"><td className="px-4 py-2.5">Enterprise</td><td className="px-2 text-right tnum">{t.count}</td><td className="px-2 text-right tnum">{$M(t.remC)}</td><td className="px-2 text-right tnum">{$M(t.remGP)}</td><td className="px-4 text-right tnum">{P(t.remGM, 2)}</td></tr>
            </tbody>
          </table>
          <div className="space-y-2 p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Exception mix (eligible)</div>
            {(Object.keys(d.cats) as ExcCat[]).sort((a, b) => d.cats[b] - d.cats[a]).map((c) => (
              <Link key={c} href="/exceptions" className="flex items-center gap-3 text-[12.5px] hover:underline"><span className="w-44 truncate">{EXC_LABEL[c]}</span><Bar value={d.cats[c]} max={d.el.length} tone={EXC_GROUP[c] === "Financial" ? "bad" : EXC_GROUP[c] === "Bond" ? "gold" : "primary"} /><span className="w-8 text-right tnum">{d.cats[c]}</span></Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-2">
        <Panel title="Top 15 projects by remaining contract" subtitle="Largest backlog positions — click any row for the full Project 360" pad={false}>
          <DataTable rows={d.topRem} rowKey={(r) => r.id} onRow={(r) => openProject(r.id)} pageSize={15} dense cols={[
            { key: "e", label: "Entity", value: (r) => r.entity },
            { key: "p", label: "Project", render: (r) => <span><span className="font-medium">{r.projectId}</span> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 34)}</span></span>, value: (r) => r.projectId },
            { key: "rc", label: "Remaining", align: "right", render: (r) => <Money v={r.m.remC} />, value: (r) => r.m.remC },
            { key: "gp", label: "Rem. GP", align: "right", render: (r) => <Money v={r.m.remGP} />, value: (r) => r.m.remGP },
            { key: "gm", label: "GM", align: "right", render: (r) => P(r.m.remGM), value: (r) => r.m.remGM },
            { key: "b", label: "Bond", render: (r) => <Pill tone={r.bondStatus === "Bonded" ? "info" : r.bondStatus === "Needs Review" ? "warn" : "muted"}>{r.bondStatus === "Bonded - Number Unmatched" ? "Bonded*" : r.bondStatus}</Pill> },
          ]} />
        </Panel>
        <Panel title="Top 15 projected losses" subtitle={basis === "legacy" ? "Workbook ‘Projected Loss’ label, ranked by ITD GP (R − A) — matches the July workbook" : basis === "itd" ? `ITD GP (R − A) below −${$(w.th!.lossThreshold)}` : `Forecast GP at completion (C − E) below −${$(w.th!.lossThreshold)}`} pad={false}
          actions={<Seg value={basis} onChange={(v) => setUI({ lossBasis: v })} testid="seg-loss-basis" options={[{ value: "legacy", label: "Workbook label" }, { value: "itd", label: "ITD GP" }, { value: "forecast", label: "At completion" }]} />}>
          <DataTable rows={d.losses} rowKey={(r) => r.id} onRow={(r) => openProject(r.id)} pageSize={15} dense cols={[
            { key: "e", label: "Entity", value: (r) => r.entity },
            { key: "p", label: "Project", render: (r) => <span><span className="font-medium">{r.projectId}</span> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 30)}</span></span>, value: (r) => r.projectId },
            { key: "l", label: basis === "forecast" ? "GP at completion" : "ITD GP", align: "right", render: (r) => <Money v={lossAmount(r.m, basis)} />, value: (r) => lossAmount(r.m, basis) },
            { key: "c", label: "Contract", align: "right", render: (r) => <Money v={r.C} />, value: (r) => r.C },
            { key: "n", label: "Note", render: (r) => (r.C === 0 && r.R === 0 && r.E === 0 ? <Pill tone="warn">C = R = E = 0</Pill> : r.m.eacBelowActual ? <Pill tone="info">EAC &lt; actual</Pill> : null) },
          ]} empty={<div className="p-4 text-sm text-muted-foreground">{w.view?.noLossLabels ? "This period’s file has no workbook ‘Projected Loss’ labels, so this view can’t count losses. Switch to ITD GP or At completion to compare months (loss rule pending executive approval)." : "No projects meet this loss definition."}</div>} />
        </Panel>
      </div>

      <LegacyCompare />
    </div>
  );
}

function LegacyCompare() {
  const w = useWip();
  const rows = useMemo(() => {
    if (!w.view || !w.boot) return [];
    const gov = groupBy(w.view.all.filter((r) => r.eligible), (r) => r.entity);
    return (w.boot.legacyEntity || []).map((l: any) => { const g = gov.get(l.Entity) || []; const gt = totals(g); return { e: l.Entity, bu: l["Business Unit"], lp: Number(l.Projects), gp: g.length, lrc: Number(l["Remaining Contract"]), grc: gt.remC, lgm: Number(l["Remaining GM %"]), ggm: gt.remGM }; });
  }, [w.view, w.boot]);
  if (!rows.length) return null;
  return (
    <Panel className="mt-4" title="Legacy workbook vs governed view" subtitle="The original 08_Entity_Rollup stays immutable. Differences come from the approved exclusion rules (for example, SRI moves from 41 to 21 projects)." tags={<><Tag kind="legacy" /><Tag kind="calc">Governed</Tag></>} pad={false}>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead><tr className="border-b text-[11.5px] uppercase tracking-wide text-muted-foreground"><th className="px-4 py-2 text-left">Entity</th><th className="px-2 text-right">Legacy projects</th><th className="px-2 text-right">Governed</th><th className="px-2 text-right">Legacy remaining</th><th className="px-2 text-right">Governed remaining</th><th className="px-2 text-right">Legacy GM</th><th className="px-4 text-right">Governed GM</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.e} className="border-b border-border/60 last:border-0"><td className="px-4 py-2 font-medium">{r.e} <span className="font-normal text-muted-foreground">{r.bu}</span></td><td className="px-2 text-right tnum text-muted-foreground">{r.lp}</td><td className={`px-2 text-right tnum ${r.lp !== r.gp ? "font-semibold text-[hsl(var(--warn))]" : ""}`}>{r.gp}</td><td className="px-2 text-right tnum text-muted-foreground">{$M(r.lrc)}</td><td className="px-2 text-right tnum">{$M(r.grc)}</td><td className="px-2 text-right tnum text-muted-foreground">{P(r.lgm)}</td><td className="px-4 text-right tnum">{P(r.ggm)}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <div className="p-4"><Note>Governed figures always reflect the full enterprise regardless of the page filters. Legacy figures are exactly as they appear in the July 8/31 workbook.</Note></div>
    </Panel>
  );
}

function Hero({ d, allRows }: { d: any; allRows: number }) {
  const w = useWip(); const { f, c, boot } = useCash();
  const t = d.t; const p = w.period!;
  const r12 = f ? f.rev.slice(0, 12).reduce((a: number, x: number) => a + x, 0) : null;
  const low = c ? c.cum.slice(0, 12).reduce((a: any, v: number, i: number) => (v < a.v ? { v, i } : a), { v: Infinity, i: -1 }) : null;
  const agg = boot?.settings.surety.aggregate ?? null;
  const bonded = d.bRem;
  const chain = [
    { to: "/portfolio", icon: Database, t: "WIP", v: `${t.count} projects`, s: "governed and reconciled" },
    { to: "/forecast", icon: Layers, t: "Backlog", v: $M(t.remC), s: "remaining contract" },
    { to: "/forecast", icon: TrendingUp, t: "Revenue forecast", v: r12 != null ? $M(r12) : "—", s: "next 12 months · forecast" },
    { to: "/cash", icon: Wallet, t: "Cash flow", v: low && low.i >= 0 ? $M(low.v) : "—", s: boot?.settings.cash.openingCash == null ? "low point, $0 opening" : "12-month low point" },
    { to: "/capacity", icon: ShieldCheck, t: "Bond capacity", v: agg != null ? $M(agg - bonded) : "Limits blank", s: agg != null ? "headroom before pipeline" : "enter surety limits" },
    { to: "/planning", icon: Target, t: "Executive planning", v: "Scenarios", s: "slip, fade, win rate" },
  ];
  const big = [
    { l: "Backlog", v: $M(t.remC), s: `${$M(t.C)} current contract`, how: { formula: "Σ (C − R)", inputs: [["Σ C", $(t.C, 2)], ["Σ R (ITD earned revenue)", $(t.R, 2)]] as [string, string][] } },
    { l: "Remaining gross profit", v: $M(t.remGP), s: `${$M(t.remCost)} remaining cost`, how: { formula: "Σ (C − R) − Σ (E − A)", inputs: [["Remaining contract", $(t.remC, 2)], ["Remaining cost", $(t.remCost, 2)]] as [string, string][] } },
    { l: "Weighted remaining GM", v: P(t.remGM, 2), s: "weighted, Σ GP ÷ Σ backlog", how: { formula: "Σ remaining GP ÷ Σ remaining contract", inputs: [["Remaining GP", $(t.remGP, 2)], ["Remaining contract", $(t.remC, 2)], ["Result", P(t.remGM, 10)]] as [string, string][], note: "Weighted — project percentages are never averaged." } },
    { l: "Bonded share of backlog", v: P(d.brRem ? d.bRem / d.brRem : null, 2), s: `${d.br.length} bond-report rows`, how: { formula: "Σ remaining contract (Bonded + Bonded–Number Unmatched) ÷ Σ remaining contract (bond report)", note: "Bond amount is not capacity. Surety limits stay blank until entered." } },
  ];
  const attn = [
    { to: "/exceptions", icon: AlertTriangle, tone: "bad", n: d.fin.length.toLocaleString(), t: "Financial exceptions", s: `${d.cats.LOSS || 0} projected loss · ${d.cats.UNDER || 0} underbilled` },
    { to: "/month-end", icon: Scale, tone: "warn", n: $M(t.under), t: "Underbilled exposure", s: `Net ${t.net < 0 ? "under" : "over"}billed ${$M(Math.abs(t.net))}` },
    { to: "/bonds", icon: ShieldCheck, tone: "gold", n: d.bondReview.toLocaleString(), t: "Bond rows need review", s: "Unmatched or unconfirmed status" },
    { to: "/intake", icon: Inbox, tone: "info", n: p.status === "published" ? "Published" : "Open", t: `${p.label} cycle`, s: p.status === "published" ? `v${p.version}${p.published_by ? ` by ${p.published_by}` : ""}` : "Load WIPs, clear exceptions, publish" },
  ];
  const toneCls: Record<string, string> = { bad: "text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10", warn: "text-[hsl(var(--warn))] bg-[hsl(var(--warn))]/10", gold: "text-[hsl(var(--gold))] bg-[hsl(var(--gold))]/15", info: "text-primary bg-primary/10" };
  return (
    <div className="page-in">
      <section className="hero rounded-3xl p-5 sm:p-7 lg:p-8" data-testid="hero">
        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-white/60">
              <span>Command Center</span><span className="h-1 w-1 rounded-full bg-white/40" /><span>{p.label}</span>
              <span className={`ml-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] text-[10.5px] tracking-[.08em] ${p.status === "published" ? "border-emerald-300/40 text-emerald-200" : "border-amber-300/40 text-amber-200"}`}><span className={`h-1.5 w-1.5 rounded-full ${p.status === "published" ? "bg-emerald-300" : "bg-amber-300"}`} />{statusLabel(p.status)}{p.status === "published" ? ` · v${p.version}` : ""}</span>
            </div>
            <h1 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-[34px]" data-testid="text-page-title">
              <span className="text-[hsl(45_75%_62%)]">{$M(t.remC)}</span> of backlog across {t.count.toLocaleString()} projects
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/70">Governed enterprise WIP as of {p.as_of}. {allRows.toLocaleString()} submitted rows, recalculated under the approved rules at a {P(t.remGM, 2)} weighted remaining margin.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="border-white/25 bg-white/10 text-white hover:bg-white/20"><Link href="/intake"><Inbox /> Load a WIP</Link></Button>
            <Button size="sm" asChild className="bg-[hsl(45_70%_55%)] text-[hsl(212_100%_14%)] hover:bg-[hsl(45_75%_62%)]"><Link href="/dashboards" data-testid="button-dashboards"><TrendingUp /> View dashboards</Link></Button>
          </div>
        </div>
        <div className="relative z-[1] mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 lg:grid-cols-4">
          {big.map((b) => (
            <div key={b.l} className="min-w-0 bg-[hsl(212_90%_14%)]/60 p-4 backdrop-blur-sm sm:p-5" data-testid={`hero-${b.l.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-white/60">{b.l}</div>
                <HowCalc how={b.how} compact className="-mr-1.5 -mt-1.5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white" />
              </div>
              <div className="mt-2 truncate text-[24px] font-semibold leading-8 tracking-tight tnum sm:text-[32px] sm:leading-10">{b.v}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[12px] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" />Calculated · {b.s}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" data-testid="chain">
        {chain.map((x, i) => { const I = x.icon; return (
          <Link key={x.t} href={x.to} className="card-soft card-lift group relative flex min-w-0 flex-col rounded-2xl border bg-card p-3.5" data-testid={`chain-${i}`}>
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><I className="h-3.5 w-3.5" /></span>
              <span className="text-[10.5px] font-semibold tabular-nums text-muted-foreground">0{i + 1}</span>
            </div>
            <div className="mt-2.5 text-[11.5px] font-semibold uppercase tracking-[.06em] text-muted-foreground">{x.t}</div>
            <div className="mt-0.5 truncate text-[17px] font-semibold tracking-tight tnum">{x.v}</div>
            <div className="truncate text-[11.5px] text-muted-foreground">{x.s}</div>
            {i < chain.length - 1 ? <ChevronRight className="absolute -right-[13px] top-1/2 z-[2] hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/60 xl:block" /> : null}
          </Link>
        ); })}
      </div>

      <div className="mt-6"><div className="eyebrow text-[10.5px]">Needs attention</div></div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="attention">
        {attn.map((a) => { const I = a.icon; return (
          <Link key={a.t} href={a.to} className="card-soft card-lift group flex items-center gap-3.5 rounded-2xl border bg-card p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneCls[a.tone]}`}><I className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2"><span className="text-[20px] font-semibold leading-7 tracking-tight tnum">{a.n}</span></div>
              <div className="truncate text-[13px] font-medium">{a.t}</div>
              <div className="text-[12px] leading-4 text-muted-foreground">{a.s}</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ); })}
      </div>
    </div>
  );
}
