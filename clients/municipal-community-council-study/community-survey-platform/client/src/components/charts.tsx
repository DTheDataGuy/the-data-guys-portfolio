import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EyeOff, Info } from "lucide-react";
import { fmt, pct, dateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ---------------- evidence labels: keep population data, targets, survey findings and qualitative evidence visibly distinct ---------------- */
const EV: Record<string, { label: string; cls: string }> = {
  population: { label: "Population estimate", cls: "bg-[hsl(var(--chart-4)/.12)] text-[hsl(var(--chart-4))]" },
  target: { label: "Engagement target", cls: "bg-[hsl(var(--gold)/.16)] text-[hsl(38_70%_30%)] dark:text-[hsl(var(--gold))]" },
  survey: { label: "Survey participation", cls: "bg-primary/10 text-primary" },
  finding: { label: "Survey finding", cls: "bg-primary/10 text-primary" },
  qual: { label: "Qualitative · analyst-reviewed", cls: "bg-[hsl(var(--terra)/.12)] text-[hsl(var(--terra))]" },
  mention: { label: "Respondent-mentioned", cls: "bg-secondary text-muted-foreground" },
  validated: { label: "Researcher-validated", cls: "bg-primary/10 text-primary" },
  assumption: { label: "Working assumption", cls: "bg-[hsl(var(--gold)/.16)] text-[hsl(38_70%_30%)] dark:text-[hsl(var(--gold))]" },
  process: { label: "Process metric", cls: "bg-secondary text-muted-foreground" },
  framework: { label: "Evaluation framework", cls: "bg-secondary text-muted-foreground" },
};
export function Evidence({ kind, className = "" }: { kind: keyof typeof EV; className?: string }) {
  const e = EV[kind];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide", e.cls, className)}>{e.label}</span>;
}

export function Card({ title, eyebrow, action, children, note, className = "", evidence, id }: { title?: ReactNode; eyebrow?: ReactNode; action?: ReactNode; children: ReactNode; note?: ReactNode; className?: string; evidence?: keyof typeof EV; id?: string }) {
  return (
    <section id={id} className={cn("rounded-2xl border border-card-border bg-card", className)}>
      {(title || action || eyebrow) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            {title && <h3 className="text-[15.5px] font-semibold leading-snug">{title}</h3>}
          </div>
          <div className="flex items-center gap-2">{evidence && <Evidence kind={evidence} />}{action}</div>
        </header>
      )}
      <div className="px-5 pb-5 pt-4">{children}</div>
      {note && <footer className="flex gap-2 border-t border-border px-5 py-3 text-[12.5px] leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><div>{note}</div></footer>}
    </section>
  );
}

export function Kpi({ label, value, sub, accent = false, evidence, testid }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean; evidence?: keyof typeof EV; testid?: string }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border p-4 sm:p-5", accent ? "border-primary/30 bg-primary text-primary-foreground" : "border-card-border bg-card")} data-testid={testid}>
      <p className={cn("text-[12.5px] font-medium", accent ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
      <p className="mt-2 font-display text-[30px] leading-none tnum sm:text-[34px]">{value}</p>
      {sub && <p className={cn("mt-2 text-[12.5px] leading-snug", accent ? "text-primary-foreground/80" : "text-muted-foreground")}>{sub}</p>}
      {evidence && <div className="mt-auto pt-3"><Evidence kind={evidence} /></div>}
    </div>
  );
}

export function Empty({ children = "No responses yet. This fills in automatically as surveys arrive.", small = false }: { children?: ReactNode; small?: boolean }) {
  return <div className={cn("flex items-center justify-center rounded-xl border border-dashed border-border text-center text-[13.5px] text-muted-foreground", small ? "px-3 py-5" : "px-6 py-10")}>{children}</div>;
}
export function Suppressed({ k, what = "this view" }: { k: number; what?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-4 text-[13.5px] text-muted-foreground">
      <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Fewer than {k} responses match {what}, so results are hidden to protect privacy. Widen the filters to see more.</span>
    </div>
  );
}

/* ---------------- horizontal bars ---------------- */
export type BarItem = { key: string; label: ReactNode; value: number | null; display?: ReactNode; sub?: ReactNode; tone?: string; small?: boolean };
export function Bars({ items, max, unit = "%", k, tone = "hsl(var(--chart-1))", empty }: { items: BarItem[]; max?: number; unit?: string; k?: number; tone?: string; empty?: ReactNode }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value || 0));
  if (!items.length || items.every((i) => !i.value && !i.small)) return <Empty small>{empty}</Empty>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="min-w-0 leading-snug">{i.label}</span>
            <span className="shrink-0 font-semibold tnum">{i.small ? <span className="text-[12px] font-normal text-muted-foreground">under {k}</span> : i.display ?? (i.value == null ? "—" : `${fmt(i.value, unit === "%" ? 1 : 0)}${unit === "%" ? "%" : ""}`)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            {i.small ? <div className="hatch h-full w-full opacity-60" /> : <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, ((i.value || 0) / m) * 100))}%`, background: i.tone || tone }} />}
          </div>
          {i.sub && <p className="mt-0.5 text-[12px] text-muted-foreground">{i.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
export const distItems = (d: any, k: number): BarItem[] => (d?.items || []).map((i: any) => ({ key: i.key, label: i.label, value: i.pct, small: i.small, display: i.count == null ? undefined : `${fmt(i.pct, 0)}% · ${fmt(i.count)}` }));

/* ---------------- representation ---------------- */
export function RepBars({ g }: { g: any }) {
  const rows = [
    { l: "Population estimate", v: g.population, c: "hsl(var(--chart-4))" },
    { l: "Engagement target", v: g.target, c: "hsl(var(--gold))" },
    { l: "Survey share", v: g.share, c: "hsl(var(--primary))" },
  ];
  const max = 50;
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.l} className="grid grid-cols-[120px_1fr_48px] items-center gap-2 text-[12px] sm:grid-cols-[132px_1fr_52px]">
          <span className="text-muted-foreground">{r.l}</span>
          <div className="h-2.5 rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${Math.min(100, ((r.v || 0) / max) * 100)}%`, background: r.c }} /></div>
          <span className="text-right font-semibold tnum">{r.v == null ? "—" : `${fmt(r.v, 1)}%`}</span>
        </div>
      ))}
    </div>
  );
}
const STATUS_TONE: Record<string, string> = { Underrepresented: "text-[hsl(var(--terra))] bg-[hsl(var(--terra)/.1)]", "Approaching target": "text-[hsl(38_70%_30%)] dark:text-[hsl(var(--gold))] bg-[hsl(var(--gold)/.15)]", "On target": "text-primary bg-primary/10", "Above target": "text-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/.12)]", "No target": "text-muted-foreground bg-secondary" };
export function StatusPill({ s }: { s: string }) { return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold", STATUS_TONE[s] || STATUS_TONE["No target"])}>{s}</span>; }
export function Attain({ v, count, target }: { v: number | null; count: number | null; target: number }) {
  const w = Math.min(100, ((v || 0) / 150) * 100);
  return (
    <div>
      <div className="relative h-3 rounded-full bg-secondary">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700" style={{ width: `${w}%` }} />
        <div className="absolute -top-1 h-5 w-[2px] bg-foreground/70" style={{ left: `${(100 / 150) * 100}%` }} aria-hidden />
      </div>
      <div className="mt-1 flex justify-between text-[11.5px] text-muted-foreground tnum"><span>{count == null ? "Under threshold" : `${fmt(count)} of ${fmt(target)}`}</span><span>{v == null ? "—" : `${fmt(v, 0)}% of target`}</span></div>
    </div>
  );
}

/* ---------------- diverging Likert ---------------- */
export const LK_LABEL = ["Strongly disagree", "Disagree", "Somewhat agree", "Strongly agree"];
export function Likert({ items, k, compact = false }: { items: any[]; k: number; compact?: boolean }) {
  if (!items.some((i) => i.n)) return <Empty small>No belonging responses yet.</Empty>;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
        {LK_LABEL.map((l, i) => <span key={l} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: `hsl(var(--lk-${i + 1}))` }} />{l}</span>)}
      </div>
      <div className="relative">
        <ul className="space-y-3">
          {items.map((it) => {
            const low = it.n > 0 && it.n < k;
            const d = it.dist || [];
            const p = (v: number) => (d.find((x: any) => x.v === v)?.pct || 0);
            return (
              <li key={it.id} className={cn("grid items-center gap-x-4 gap-y-1", compact ? "grid-cols-1" : "sm:grid-cols-[40%_60%]")}>
                <div className="text-[13.5px] leading-snug">
                  <span className="font-medium">{it.short}</span>
                  <span className="ml-1.5 text-[11.5px] text-muted-foreground">{it.id}{it.direction === "negative" ? " · negatively worded" : it.direction === "descriptive" ? " · descriptive" : ""}</span>
                </div>
                {low || !it.n ? <div className="h-6 rounded bg-secondary/70 text-center text-[11.5px] leading-6 text-muted-foreground">{it.n ? `Fewer than ${k} answers` : "No answers yet"}</div> : (
                  <div className="flex items-center gap-2">
                    <span className="w-9 text-right text-[12px] font-semibold tnum text-[hsl(var(--terra))]">{fmt(p(1) + p(2), 0)}%</span>
                    <div className="grid h-6 flex-1 grid-cols-2 [&>div:first-child]:border-r-2 [&>div:first-child]:border-foreground/40" role="img" aria-label={`${it.short}: ${LK_LABEL.map((l, i) => `${l} ${fmt(p(i + 1), 0)}%`).join(", ")}; ${it.n} answers`}>
                      <div className="flex justify-end overflow-hidden rounded-l">
                        <div style={{ width: `${p(1)}%`, background: "hsl(var(--lk-1))" }} /><div style={{ width: `${p(2)}%`, background: "hsl(var(--lk-2))" }} />
                      </div>
                      <div className="flex overflow-hidden rounded-r">
                        <div style={{ width: `${p(3)}%`, background: "hsl(var(--lk-3))" }} /><div style={{ width: `${p(4)}%`, background: "hsl(var(--lk-4))" }} />
                      </div>
                    </div>
                    <span className="w-9 text-[12px] font-semibold tnum text-primary">{fmt(p(3) + p(4), 0)}%</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">Left: share disagreeing. Right: share agreeing. Percentages exclude “prefer not to answer” and skipped items. Negatively worded items are shown as asked, not reverse-coded.</p>
    </div>
  );
}

/* ---------------- trend ---------------- */
export function Trend({ data, height = 220 }: { data: { date: string; count: number; cumulative: number }[]; height?: number }) {
  if (!data?.length) return <Empty small>The response trend starts with the first submission.</Empty>;
  return (
    <div style={{ height }} role="img" aria-label={`Cumulative responses: ${data[data.length - 1].cumulative} by ${dateLabel(data[data.length - 1].date)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
          <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(d) => dateLabel(d).replace(/, \d{4}$/, "")} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} labelFormatter={(d) => dateLabel(String(d))} formatter={(v: any, n: any) => [fmt(v), n === "cumulative" ? "Total to date" : "That day"]} />
          <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#tg)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- ZIP tile map (approximate positions; each tile is one Seattle ZIP) ---------------- */
export function TileMap({ zips, k, onPick, picked }: { zips: any[]; k: number; onPick?: (zip: string) => void; picked?: string }) {
  const max = Math.max(1, ...zips.map((z) => z.n || 0));
  const W = 4, H = 9;
  return (
    <div>
      <div className="mx-auto grid max-w-[320px] gap-1.5" style={{ gridTemplateColumns: `repeat(${W}, minmax(0,1fr))`, gridTemplateRows: `repeat(${H}, minmax(0,1fr))` }}>
        {zips.map((z) => {
          const a = z.n ? 0.18 + 0.82 * (z.n / max) : 0;
          const on = picked === z.zip;
          return (
            <button key={z.zip} type="button" onClick={() => onPick?.(z.zip)} disabled={!onPick}
              className={cn("relative flex aspect-square flex-col items-center justify-center rounded-md border text-center transition-transform", z.small ? "hatch border-border" : z.n ? "border-transparent" : "border-border bg-secondary/50", on && "ring-2 ring-foreground", onPick && "hover:scale-[1.04]")}
              style={{ gridColumn: z.x + 1, gridRow: z.y + 1, background: z.n ? `hsl(var(--primary) / ${a})` : undefined }}
              title={`${z.zip} · ${z.area}${z.cd ? " · Central District area" : ""} · ${z.small ? `fewer than ${k}` : `${z.n || 0} responses`}`}
              aria-label={`${z.zip}, ${z.area}: ${z.small ? `fewer than ${k} responses` : `${z.n || 0} responses`}`} data-testid={`tile-${z.zip}`}>
              <span className={cn("text-[10.5px] font-semibold tnum leading-none", a > 0.55 ? "text-primary-foreground" : "")}>{z.zip.slice(2)}</span>
              {z.n ? <span className={cn("mt-0.5 text-[10px] tnum leading-none", a > 0.55 ? "text-primary-foreground/85" : "text-muted-foreground")}>{z.n}</span> : null}
              {z.cd && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--terra))]" aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-secondary/80 ring-1 ring-border" />None yet</span>
        <span className="inline-flex items-center gap-1.5"><span className="hatch h-3 w-3 rounded-sm ring-1 ring-border" />Under {k} (hidden)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-8 rounded-sm" style={{ background: "linear-gradient(90deg,hsl(var(--primary)/.2),hsl(var(--primary)))" }} />More responses</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--terra))]" />Central District area</span>
      </div>
      <p className="mt-2 text-center text-[11.5px] text-muted-foreground">Tiles show 981xx ZIP codes arranged roughly north (top) to south. ZIPs cross neighborhood lines, so areas are approximate.</p>
    </div>
  );
}

/* ---------------- small helpers ---------------- */
export function Scale5({ s, labels }: { s: any; labels: [string, string] }) {
  if (!s?.n) return <Empty small>No answers yet.</Empty>;
  return (
    <div>
      <div className="flex h-7 overflow-hidden rounded-md" role="img" aria-label={s.dist.map((d: any) => `${d.v}: ${fmt(d.pct, 0)}%`).join(", ")}>
        {s.dist.map((d: any) => <div key={d.v} className="flex items-center justify-center text-[11px] font-semibold text-white" style={{ width: `${d.pct || 0}%`, background: `hsl(var(--primary) / ${0.25 + d.v * 0.15})` }}>{(d.pct || 0) >= 9 ? `${fmt(d.pct, 0)}%` : ""}</div>)}
      </div>
      <div className="mt-1.5 flex justify-between text-[11.5px] text-muted-foreground"><span>1 · {labels[0]}</span><span>5 · {labels[1]}</span></div>
      <p className="mt-2 text-[12.5px] tnum text-muted-foreground">Average <b className="text-foreground">{fmt(s.mean, 2)}</b> of 5 · {fmt(s.topTwoPct, 0)}% rated 4–5 · {fmt(s.n)} answered{s.notSure ? ` · ${s.notSure} not sure` : ""}</p>
    </div>
  );
}
export { pct, fmt };
