import { useMemo } from "react";
import { Link } from "wouter";
import { Printer, CircleDashed } from "lucide-react";
import { useCash } from "@/lib/fc";
import { useUI, filtersActive } from "@/lib/app";
import { totals, groupBy, lossHit, lossAmount, type LossBasis } from "@shared/calc";
import { PageHeader, Tag, Money, P, $M, $, Pill } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { openProject } from "@/components/project";
import { statusLabel } from "@/components/shell";
import { Skeleton } from "./command";

function Sec({ title, tag, children, className = "" }: { title: string; tag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`break-inside-avoid ${className}`}>
      <div className="mb-2 flex items-center justify-between border-b pb-1.5"><h2 className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted-foreground">{title}</h2>{tag}</div>
      {children}
    </section>
  );
}

function printLight() {
  const h = document.documentElement; const wasDark = h.classList.contains("dark");
  if (wasDark) { h.classList.remove("dark"); window.addEventListener("afterprint", () => h.classList.add("dark"), { once: true }); }
  setTimeout(() => window.print(), 50);
}

export default function BriefPage() {
  const x = useCash(); const ui = useUI();
  const basis: LossBasis = x.th?.lossBasis || "legacy";
  const d = useMemo(() => {
    if (!x.view || !x.th || !x.boot) return null;
    const el = x.view.eligible; const t = totals(el);
    const br = x.view.bondReport; const brRem = br.reduce((a, r) => a + (r.m.remC || 0), 0);
    const bRem = br.filter((r) => r.bondStatus.startsWith("Bonded")).reduce((a, r) => a + (r.m.remC || 0), 0);
    const losses = el.filter((r) => lossHit(r, r.m, x.th!, basis)).sort((a, b) => (lossAmount(a.m, basis) || 0) - (lossAmount(b.m, basis) || 0));
    const under = el.filter((r) => r.exc.includes("UNDER")).sort((a, b) => (a.m.ob || 0) - (b.m.ob || 0));
    const fin = el.filter((r) => r.exc.includes("LOSS") || r.exc.includes("UNDER")).length;
    const byBu = [...groupBy(el, (r) => r.bu)].map(([k, rs]) => ({ k, ...totals(rs) })).sort((a, b) => b.remC - a.remC);
    const bondReview = br.filter((r) => r.bondStatus === "Needs Review").length;
    return { t, el, brRem, bRem, losses, under, fin, byBu, bondReview };
  }, [x.view, x.th, x.boot, basis]);
  if (!d || !x.period || !x.boot) return <div><PageHeader title="Executive brief" /><Skeleton /></div>;
  const { t } = d; const p = x.period; const s = x.boot.settings;
  const r12 = x.f ? x.f.rev.slice(0, 12).reduce((a, v) => a + v, 0) : null;
  const low = x.c ? x.c.cum.slice(0, 12).reduce((a: any, v: number, i: number) => (v < a.v ? { v, i } : a), { v: Infinity, i: -1 }) : null;
  const agg = s.surety?.aggregate ?? null; const target = x.f?.target ?? null;
  const open = [
    s.cash?.openingCash == null && { l: "Opening cash", to: "/cash", why: "Cash low point is measured from $0 until it is entered." },
    agg == null && { l: "Surety aggregate and single-job limits", to: "/capacity", why: "Bond capacity headroom stays blank until entered." },
    target == null && { l: "Monthly revenue target", to: "/planning", why: "Revenue gap alerts need a target." },
  ].filter(Boolean) as { l: string; to: string; why: string }[];
  const headline = [
    { l: "Backlog", v: $M(t.remC), s: `${t.count} eligible projects · ${$M(t.C)} contract`, k: "Calculated" },
    { l: "Remaining gross profit", v: $M(t.remGP), s: `Weighted GM ${P(t.remGM, 2)}`, k: "Calculated" },
    { l: "Revenue, next 12 months", v: r12 != null ? $M(r12) : "—", s: "Timing model from backlog phasing", k: "Forecast" },
    { l: "Cash low point, 12 months", v: low && low.i >= 0 ? $M(low.v) : "—", s: s.cash?.openingCash == null ? `${x.f?.labels[low?.i ?? 0] ?? ""} · from $0 opening` : `${x.f?.labels[low?.i ?? 0] ?? ""}`, k: "Modeled" },
  ];
  const Top = ({ rows, val, label }: { rows: typeof d.losses; val: (r: any) => number | null; label: string }) => (
    <table className="w-full text-[12.5px]">
      <thead><tr className="text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1 text-left font-medium">Project</th><th className="py-1 text-right font-medium">{label}</th></tr></thead>
      <tbody>{rows.slice(0, 6).map((r) => (
        <tr key={r.id} className="cursor-pointer border-t border-border/60 hover:bg-muted/50" onClick={() => openProject(r.id)}>
          <td className="max-w-0 truncate py-1.5 pr-2"><span className="font-medium">{r.entity} {r.projectId}</span> <span className="text-muted-foreground">{r.projectName}</span></td>
          <td className="py-1.5 text-right"><Money v={val(r)} /></td>
        </tr>))}
        {!rows.length ? <tr><td colSpan={2} className="py-2 text-muted-foreground">None this month.</td></tr> : null}
      </tbody>
    </table>
  );
  return (
    <div className="page-in">
      <div className="print:hidden">
        <PageHeader title="Executive brief" subtitle="A one-page summary for leadership, the board or the surety. Print it or save it as a PDF; every figure comes from the governed data on screen." tags={<><Tag kind="calc" /><Tag kind="forecast" /></>}
          actions={<Button size="sm" onClick={printLight} data-testid="button-print"><Printer /> Print or save PDF</Button>} />
      </div>
      <article className="brief-sheet mx-auto max-w-[900px] rounded-2xl border bg-card p-7 shadow-[var(--shadow-soft)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none" data-testid="brief">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div>
            <div className="eyebrow text-[10.5px]">Enterprise WIP · Executive brief</div>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{p.label}</h1>
            <div className="mt-1 text-[12.5px] text-muted-foreground">As of {p.as_of} · {statusLabel(p.status)}{p.status === "published" ? ` v${p.version}` : " (not yet published)"} · prepared {new Date().toLocaleDateString()}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {p.status !== "published" ? <Pill tone="warn">Draft figures</Pill> : <Pill tone="ok">Published</Pill>}
            {filtersActive(ui.filters) ? <Pill tone="gold">Filtered view</Pill> : null}
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-4">
          {headline.map((h) => (
            <div key={h.l} className="rounded-xl border bg-muted/30 p-3.5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[.08em] text-muted-foreground">{h.l}</div>
              <div className="mt-1 text-[22px] font-semibold tracking-tight tnum">{h.v}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{h.s}</div>
              <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">{h.k}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <Sec title="Backlog by business unit" tag={<Tag kind="calc" />}>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1 text-left font-medium">Unit</th><th className="py-1 text-right font-medium">Projects</th><th className="py-1 text-right font-medium">Backlog</th><th className="py-1 text-right font-medium">GM</th></tr></thead>
              <tbody>{d.byBu.map((b) => <tr key={b.k} className="border-t border-border/60"><td className="py-1.5">{b.k}</td><td className="py-1.5 text-right tnum">{b.count}</td><td className="py-1.5 text-right"><Money v={b.remC} /></td><td className="py-1.5 text-right tnum">{P(b.remGM, 1)}</td></tr>)}
                <tr className="border-t font-semibold"><td className="py-1.5">Total</td><td className="py-1.5 text-right tnum">{t.count}</td><td className="py-1.5 text-right"><Money v={t.remC} /></td><td className="py-1.5 text-right tnum">{P(t.remGM, 1)}</td></tr></tbody>
            </table>
          </Sec>
          <Sec title="Risk and billing position" tag={<Tag kind="calc" />}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
              <dt className="text-muted-foreground">Financial exceptions</dt><dd className="text-right font-medium tnum">{d.fin} projects</dd>
              <dt className="text-muted-foreground">Projected-loss projects</dt><dd className="text-right font-medium tnum">{x.view?.noLossLabels ? "No workbook labels" : d.losses.length}</dd>
              <dt className="text-muted-foreground">Underbilled (Σ under)</dt><dd className="text-right font-medium">{$M(t.under)}</dd>
              <dt className="text-muted-foreground">Overbilled (Σ over)</dt><dd className="text-right font-medium">{$M(t.over)}</dd>
              <dt className="text-muted-foreground">Net over / (under)</dt><dd className="text-right font-medium"><Money v={t.net} /></dd>
              <dt className="text-muted-foreground">Bonded share of backlog</dt><dd className="text-right font-medium tnum">{P(d.brRem ? d.bRem / d.brRem : null, 1)}</dd>
              <dt className="text-muted-foreground">Bond rows to review</dt><dd className="text-right font-medium tnum">{d.bondReview}</dd>
              <dt className="text-muted-foreground">Bond capacity headroom</dt><dd className="text-right font-medium">{agg != null ? $M(agg - d.bRem) : <span className="text-muted-foreground">Limits not entered</span>}</dd>
            </dl>
          </Sec>
          <Sec title="Largest projected losses" tag={<Tag kind="calc" />}><Top rows={d.losses} val={(r) => lossAmount(r.m, basis)} label="Loss" /></Sec>
          <Sec title="Largest underbillings" tag={<Tag kind="calc" />}><Top rows={d.under} val={(r) => r.m.ob} label="Over/(under)" /></Sec>
        </div>

        <Sec title="Inputs still needed" className="mt-6">
          {open.length ? <ul className="space-y-1.5 text-[12.5px]">{open.map((o) => <li key={o.l} className="flex items-start gap-2"><CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--gold))]" /><span><Link href={o.to} className="font-medium hover:underline">{o.l}</Link> <span className="text-muted-foreground">— {o.why}</span></span></li>)}</ul>
            : <p className="text-[12.5px] text-muted-foreground">All planning inputs are entered.</p>}
        </Sec>

        <footer className="mt-6 border-t pt-3 text-[10.5px] leading-5 text-muted-foreground">
          Calculated = recalculated from submitted WIP rows (backlog C − R, remaining GP (C − R) − (E − A), weighted GM Σ GP ÷ Σ backlog, over/under B − R). Forecast and Modeled figures are timing models, not bank or surety forecasts. Bond amount is a penal sum, not capacity. Blank source values stay blank. Totals: {$(t.remC, 2)} backlog · {$(t.remGP, 2)} remaining GP.
        </footer>
      </article>
    </div>
  );
}
