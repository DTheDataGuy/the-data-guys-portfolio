import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Info, Search, Upload, Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { fmtUSD, fmtM, fmtPct } from "@shared/calc";

/* ---------- evidence labels: measured vs calculated vs assumption vs sample ---------- */
export type TagKind = "source" | "calc" | "assumption" | "forecast" | "sample" | "proposed" | "legacy" | "proxy" | "user" | "pending";
const TAG: Record<TagKind, { label: string; cls: string; tip: string }> = {
  source: { label: "Source", cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20", tip: "Value reported in a submitted WIP. Never overwritten." },
  calc: { label: "Calculated", cls: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/25", tip: "Derived from source values by a governed formula." },
  assumption: { label: "Assumption model", cls: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30", tip: "Depends on editable timing assumptions — not a commitment or bank forecast." },
  forecast: { label: "Forecast", cls: "bg-violet-500/10 text-violet-800 dark:text-violet-300 border-violet-500/25", tip: "Forward-looking projection from backlog and phasing assumptions." },
  sample: { label: "Sample data", cls: "bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-500/30", tip: "Illustrative sample. Replace with real source data before relying on it." },
  proposed: { label: "Proposed, pending executive approval", cls: "bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/30", tip: "Not yet approved by Executive." },
  legacy: { label: "Legacy workbook", cls: "bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/25", tip: "Value as it appears in the original July workbook (kept immutable for comparison)." },
  proxy: { label: "Proxy", cls: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/25", tip: "Stand-in value until a real input is entered." },
  user: { label: "User-entered", cls: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25", tip: "Entered by an authorized user in this app." },
  pending: { label: "Pending input", cls: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25", tip: "Blank until someone enters it — never assumed." },
};
const DOT: Record<TagKind, string> = { source: "bg-slate-500", calc: "bg-sky-600", assumption: "bg-amber-500", forecast: "bg-violet-500", sample: "bg-fuchsia-500", proposed: "bg-orange-500", legacy: "bg-stone-500", proxy: "bg-teal-500", user: "bg-emerald-500", pending: "bg-zinc-400" };
export function Tag({ kind, children, className }: { kind: TagKind; children?: ReactNode; className?: string }) {
  const t = TAG[kind];
  return <span title={t.tip} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-[1px] text-[11px] font-medium leading-5", t.cls, className)} data-testid={`tag-${kind}`}><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[kind])} aria-hidden />{children || t.label}</span>;
}

export type How = { formula: string; inputs?: [string, string][]; note?: string; source?: string };
export function HowCalc({ how, className, compact }: { how: How; className?: string; compact?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <button type="button" title="How this is calculated" className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground", className)} aria-label="How this is calculated" data-testid="button-how">
            <Calculator className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button type="button" className={cn("inline-flex items-center gap-1 rounded text-[11px] text-muted-foreground hover:text-foreground", className)} aria-label="How this is calculated" data-testid="button-how">
            <Calculator className="h-3 w-3" /> How calculated
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="start">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Formula</div>
        <div className="rounded-md bg-muted px-2 py-1.5 font-mono text-[12px] leading-5">{how.formula}</div>
        {how.inputs?.length ? (
          <table className="mt-3 w-full text-[12px]"><tbody>
            {how.inputs.map(([k, v]) => <tr key={k} className="border-b border-border/60 last:border-0"><td className="py-1 pr-2 text-muted-foreground">{k}</td><td className="py-1 text-right tnum font-medium">{v}</td></tr>)}
          </tbody></table>
        ) : null}
        {how.note ? <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{how.note}</p> : null}
        {how.source ? <p className="mt-2 text-[11px] text-muted-foreground">Source: {how.source}</p> : null}
      </PopoverContent>
    </Popover>
  );
}

export function Kpi({ label, value, sub, kind = "calc", how, onClick, tone, testid }: { label: string; value: ReactNode; sub?: ReactNode; kind?: TagKind; how?: How; onClick?: () => void; tone?: "bad" | "good" | "warn"; testid?: string }) {
  return (
    <div className={cn("card-soft card-lift group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card p-4 sm:p-5", onClick && "cursor-pointer")} onClick={onClick} data-testid={testid || `kpi-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      {tone ? <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", tone === "bad" ? "bg-[hsl(var(--destructive))]" : tone === "good" ? "bg-[hsl(var(--ok))]" : "bg-[hsl(var(--warn))]")} /> : null}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[11.5px] font-semibold uppercase leading-4 tracking-[.06em] text-muted-foreground">{label}</div>
        {how ? <div className="-mr-1.5 -mt-1.5 shrink-0" onClick={(e) => e.stopPropagation()}><HowCalc how={how} compact /></div> : null}
      </div>
      <div className={cn("mt-2.5 truncate text-[22px] font-semibold leading-7 tracking-tight tnum sm:text-[28px] sm:leading-9", tone === "bad" && "text-[hsl(var(--destructive))]", tone === "good" && "text-[hsl(var(--ok))]", tone === "warn" && "text-[hsl(var(--warn))]")}>{value}</div>
      {sub ? <div className="mt-1 text-[12px] leading-5 text-muted-foreground">{sub}</div> : null}
      <div className="mt-auto pt-3"><Tag kind={kind} /></div>
    </div>
  );
}

const PAGE_GROUP: [string, string][] = [["/changes", "Monthly cycle"], ["/brief", "Monthly cycle"], ["/guide", "Reference"], ["/portfolio", "Overview"], ["/projects", "Overview"], ["/exceptions", "Govern"], ["/month-end", "Govern"], ["/bonds", "Govern"], ["/intake", "Monthly cycle"], ["/close", "Monthly cycle"], ["/forecast", "Plan"], ["/management", "Plan"], ["/cash", "Plan"], ["/capacity", "Plan"], ["/planning", "Plan"], ["/pipeline", "Plan"], ["/rules", "Reference"], ["/team", "Reference"], ["/audit", "Reference"], ["/roadmap", "Reference"], ["/account", "Account"]];
export function PageHeader({ title, subtitle, actions, tags }: { title: string; subtitle?: ReactNode; actions?: ReactNode; tags?: ReactNode }) {
  const [loc] = useLocation();
  const eyebrow = loc === "/" ? "Overview" : PAGE_GROUP.find(([h]) => loc.startsWith(h))?.[1] || "Enterprise WIP";
  return (
    <div className="page-in mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="eyebrow mb-1.5 text-[10.5px]">{eyebrow}</div>
        <h1 className="text-[24px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-9" data-testid="text-page-title">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
        {tags ? <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className, pad = true, tags }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean; tags?: ReactNode }) {
  return (
    <section className={cn("card-soft min-w-0 overflow-hidden rounded-2xl border bg-card", className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-[15px] font-semibold leading-6">{title}</h2>{tags}</div>
            {subtitle ? <p className="mt-0.5 text-[12.5px] leading-5 text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={pad ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center" data-testid="empty-state">
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <div className="text-[15px] font-semibold">{title}</div>
      {body ? <div className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{body}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <div className={cn("flex gap-2 rounded-lg border px-3 py-2.5 text-[13px] leading-5", tone === "warn" ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200" : "bg-muted/50 text-muted-foreground")}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0">{children}</div>
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, size = "sm", testid }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; size?: "sm" | "xs"; testid?: string }) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5" role="tablist" data-testid={testid}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-md px-2.5 font-medium transition-colors", size === "sm" ? "py-1 text-[12.5px]" : "py-0.5 text-[11.5px]", value === o.value ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}>{o.label}</button>
      ))}
    </div>
  );
}

export const $ = (v: number | null | undefined, d = 0) => fmtUSD(v, d);
export const $M = (v: number | null | undefined, d = 1) => fmtM(v, d);
export const P = (v: number | null | undefined, d = 1) => fmtPct(v, d);
export function Money({ v, d = 0, className, neg = true }: { v: number | null | undefined; d?: number; className?: string; neg?: boolean }) {
  if (v === null || v === undefined) return <span className={cn("text-muted-foreground", className)} title="Blank in source">—</span>;
  const s = Math.abs(v).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d });
  return <span className={cn("tnum", neg && v < -0.005 && "text-[hsl(var(--destructive))]", className)}>{v < -0.005 ? `(${s})` : s}</span>;
}

export function Bar({ value, max, tone = "primary" }: { value: number; max: number; tone?: "primary" | "bad" | "gold" | "ok" }) {
  const w = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const c = tone === "bad" ? "bg-[hsl(var(--destructive))]" : tone === "gold" ? "bg-[hsl(var(--gold))]" : tone === "ok" ? "bg-[hsl(var(--ok))]" : "bg-primary";
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", c)} style={{ width: `${w}%` }} /></div>;
}

/* ---------- data table: sortable, searchable, paginated ---------- */
export type Col<T> = { key: string; label: ReactNode; render?: (r: T) => ReactNode; value?: (r: T) => number | string | null; align?: "left" | "right" | "center"; className?: string; sortable?: boolean; title?: string };
export function DataTable<T>({ rows, cols, rowKey, onRow, search, pageSize = 25, initialSort, empty, toolbar, dense, testid, rowClass, onSlice }: {
  rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; onRow?: (r: T) => void; search?: (r: T) => string; pageSize?: number; initialSort?: { key: string; dir: "asc" | "desc" }; empty?: ReactNode; toolbar?: ReactNode; dense?: boolean; onSlice?: (rows: T[]) => void; testid?: string; rowClass?: (r: T) => string;
}) {
  const [q, setQ] = useState(""); const [sort, setSort] = useState(initialSort || null); const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    let out = rows;
    if (q && search) { const t = q.toLowerCase(); out = out.filter((r) => search(r).toLowerCase().includes(t)); }
    if (sort) {
      const c = cols.find((x) => x.key === sort.key);
      if (c?.value) {
        const f = c.value;
        out = [...out].sort((a, b) => { const x = f(a), y = f(b); if (x === y) return 0; if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; const r = x < y ? -1 : 1; return sort.dir === "asc" ? r : -r; });
      }
    }
    return out;
  }, [rows, q, sort, cols, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pg = Math.min(page, pages - 1);
  const slice = filtered.slice(pg * pageSize, pg * pageSize + pageSize);
  const sliceKey = slice.map(rowKey).join("|");
  useEffect(() => { onSlice?.(slice); }, [sliceKey]); // eslint-disable-line
  return (
    <div data-testid={testid}>
      {(search || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          {search ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search project, name, PM, entity…" className="h-8 pl-8 text-[13px]" data-testid="input-table-search" />
            </div>
          ) : null}
          {toolbar}
          <div className="ml-auto text-[12px] text-muted-foreground tnum">{filtered.length.toLocaleString()} rows</div>
        </div>
      )}
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-[13px]">
          <thead className="sticky top-0 z-[1] bg-muted/60 backdrop-blur">
            <tr className="border-b">
              {cols.map((c) => {
                const active = sort?.key === c.key; const can = c.sortable !== false && !!c.value;
                return (
                  <th key={c.key} title={c.title} className={cn("whitespace-nowrap px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground", c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left", can && "cursor-pointer select-none hover:text-foreground", c.className)}
                    onClick={() => can && setSort(active ? { key: c.key, dir: sort!.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "desc" })}>
                    <span className="inline-flex items-center gap-1">{c.label}{active ? (sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined} className={cn("border-b border-border/50 last:border-0 even:bg-muted/[.22]", onRow && "cursor-pointer hover:bg-primary/[.05]", rowClass?.(r))} data-testid={`row-${rowKey(r)}`}>
                {cols.map((c) => <td key={c.key} className={cn("whitespace-nowrap px-3", dense ? "py-1.5" : "py-2", c.align === "right" ? "text-right tnum" : c.align === "center" ? "text-center" : "", c.className)}>{c.render ? c.render(r) : String((c.value?.(r) ?? "") as any)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!slice.length ? <div className="p-6">{empty || <Empty title="Nothing to show" body="Try clearing filters or search." />}</div> : null}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-[12px] text-muted-foreground">
          <span className="tnum">Page {pg + 1} of {pages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled={pg === 0} onClick={() => setPage(pg - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            <Button size="sm" variant="ghost" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)} aria-label="Next page"><ChevronRight /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FileDrop({ onFiles, accept = ".xlsx,.xlsm,.csv", label = "Drop a WIP file here or click to browse", sub, busy, testid = "dropzone" }: { onFiles: (f: File[]) => void; accept?: string; label?: string; sub?: string; busy?: boolean; testid?: string }) {
  const ref = useRef<HTMLInputElement>(null); const [over, setOver] = useState(false);
  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); const f = Array.from(e.dataTransfer.files || []); if (f.length) onFiles(f); }}
      onClick={() => ref.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") ref.current?.click(); }}
      className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors", over ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40", busy && "pointer-events-none opacity-60")} data-testid={testid}>
      <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">{busy ? "Reading and validating…" : label}</div>
      {sub ? <div className="mt-1 text-[12px] text-muted-foreground">{sub}</div> : null}
      <input ref={ref} type="file" accept={accept} multiple className="hidden" onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onFiles(f); e.target.value = ""; }} data-testid="input-file" />
    </div>
  );
}

export const SEV_CLS = { Critical: "bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/25", Warning: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30", OK: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25" } as const;
export function Pill({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "bad" | "warn" | "ok" | "info" | "gold"; className?: string }) {
  const c = { muted: "bg-muted text-muted-foreground border-border", bad: SEV_CLS.Critical, warn: SEV_CLS.Warning, ok: SEV_CLS.OK, info: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/25", gold: "bg-[hsl(var(--gold))]/15 text-amber-900 dark:text-amber-200 border-[hsl(var(--gold))]/30" }[tone];
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[1px] text-[11.5px] font-medium leading-5", c, className)}>{children}</span>;
}

export const CHART = { primary: "hsl(var(--primary))", gold: "hsl(var(--gold))", terra: "hsl(var(--terra))", ok: "hsl(var(--ok))", bad: "hsl(var(--destructive))", muted: "hsl(var(--muted-foreground))", grid: "hsl(var(--border))", c5: "hsl(var(--chart-5))" };
export const axisTick = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
export const tipStyle = { contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 } };
