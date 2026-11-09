import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, CircleSlash, ShieldCheck, FlaskConical, Clock, FileQuestion, Lock, Download } from "lucide-react";
import { fmtValue, dateTimeLabel, ago, type Unit } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { ApiError, fileUrl } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export interface Metric {
  id: string;
  label: string;
  value: number | null;
  unit: Unit;
  status: "verified" | "provisional" | "unavailable" | "demo" | "not_applicable";
  reason?: string;
  definition: string;
  source: string;
  period: string;
  denominator?: string;
  exclusions?: string;
  n?: number;
  lastImport?: string | null;
  inapplicableFilters?: string[];
  secondary?: string;
}

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return <span aria-hidden className={cn("brand-mark", className)} />;
}

const STATUS_META: Record<Metric["status"], { label: string; cls: string; icon: any }> = {
  verified: { label: "Verified", cls: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800", icon: ShieldCheck },
  provisional: { label: "Provisional", cls: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800", icon: AlertTriangle },
  unavailable: { label: "Not available", cls: "bg-muted text-muted-foreground border-border", icon: CircleSlash },
  demo: { label: "Demo", cls: "bg-[hsl(43_96%_58%/0.18)] text-[hsl(35_70%_28%)] border-[hsl(43_96%_50%/0.5)] dark:text-[hsl(43_96%_70%)]", icon: FlaskConical },
  not_applicable: { label: "Not applicable", cls: "bg-muted text-muted-foreground border-border", icon: CircleSlash },
};

export function StatusBadge({ status, className }: { status: Metric["status"]; className?: string }) {
  const m = STATUS_META[status] ?? STATUS_META.unavailable;
  const I = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap", m.cls, className)} data-testid={`status-${status}`}>
      <I className="h-3 w-3" />
      {m.label}
    </span>
  );
}

export function Pill({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "green" | "gold" | "bronze" | "red" | "amber"; className?: string }) {
  const tones = {
    muted: "bg-muted text-muted-foreground border-border",
    green: "bg-[hsl(164_69%_19%/0.1)] text-[hsl(164_69%_19%)] border-[hsl(164_69%_19%/0.25)] dark:text-[hsl(164_50%_65%)] dark:bg-[hsl(164_50%_50%/0.12)]",
    gold: "bg-[hsl(43_96%_58%/0.18)] text-[hsl(35_70%_28%)] border-[hsl(43_96%_50%/0.45)] dark:text-[hsl(43_96%_70%)]",
    bronze: "bg-[hsl(30_43%_56%/0.15)] text-[hsl(28_45%_32%)] border-[hsl(30_43%_56%/0.4)] dark:text-[hsl(30_50%_72%)]",
    red: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
    amber: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function KpiCard({ m, accent = false, compact = true }: { m: Metric; accent?: boolean; compact?: boolean }) {
  const unavailable = m.value === null;
  return (
    <div className={cn("group relative flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm", accent && "border-t-4 border-t-[hsl(43_96%_58%)]")} data-testid={`kpi-${m.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium leading-tight text-muted-foreground">{m.label}</div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`About ${m.label}`} data-testid={`kpi-info-${m.id}`}>
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm" align="end">
            <MetricDetail m={m} />
          </PopoverContent>
        </Popover>
      </div>
      <div className={cn("mt-2 font-semibold tabular-nums tracking-tight", unavailable ? "text-base text-muted-foreground" : "text-[1.65rem] leading-none")}>{fmtValue(m.value, m.unit, compact)}</div>
      {m.secondary && !unavailable && <div className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{m.secondary}</div>}
      {unavailable && m.reason && <div className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{m.reason}</div>}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        <StatusBadge status={m.status} />
        <span className="text-[11px] text-muted-foreground truncate">{m.period}</span>
      </div>
      {!!m.inapplicableFilters?.length && (
        <div className="mt-2 text-[11px] text-amber-800 dark:text-amber-300" data-testid={`kpi-inapplicable-${m.id}`}>
          Filter not applicable: {m.inapplicableFilters.join(", ")}
        </div>
      )}
    </div>
  );
}

export function MetricDetail({ m }: { m: Metric }) {
  const row = (k: string, v?: ReactNode) =>
    v ? (
      <div className="grid grid-cols-[96px_1fr] gap-2 py-1">
        <div className="text-xs text-muted-foreground">{k}</div>
        <div className="text-xs">{v}</div>
      </div>
    ) : null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="font-semibold">{m.label}</div>
        <StatusBadge status={m.status} />
      </div>
      <div className="divide-y">
        {row("Definition", m.definition)}
        {row("Source", m.source)}
        {row("Period", m.period)}
        {row("Denominator", m.denominator)}
        {row("Exclusions", m.exclusions)}
        {row("Rows used", m.n !== undefined ? m.n.toLocaleString() : undefined)}
        {row("Status note", m.reason)}
        {row("Last import", m.lastImport ? `${dateTimeLabel(m.lastImport)} (${ago(m.lastImport)})` : "No successful import")}
        {row("Filters", m.inapplicableFilters?.length ? `Not applicable: ${m.inapplicableFilters.join(", ")}` : undefined)}
      </div>
    </div>
  );
}

export function KpiGrid({ items, cols = 4, loading }: { items?: Metric[]; cols?: number; loading?: boolean }) {
  const c = cols === 3 ? "lg:grid-cols-3" : cols === 5 ? "lg:grid-cols-5" : cols === 6 ? "lg:grid-cols-3 xl:grid-cols-6" : cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-4";
  if (loading || !items)
    return (
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", c)}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-[128px] rounded-xl" />
        ))}
      </div>
    );
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", c)}>
      {items.map((m, i) => (
        <KpiCard key={m.id} m={m} accent={i === 0} />
      ))}
    </div>
  );
}

export function PageHeader({ title, kicker, description, actions }: { title: string; kicker?: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {kicker && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(30_43%_46%)] dark:text-[hsl(30_50%_68%)]">{kicker}</div>}
        <h1 className="font-serif text-xl font-bold leading-tight tracking-tight md:text-[1.6rem]" data-testid="page-title">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, children, action, className, bodyClass }: { title?: ReactNode; subtitle?: ReactNode; children: ReactNode; action?: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>}
            {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function Empty({ title = "Source pending", children, icon: I = FileQuestion }: { title?: string; children?: ReactNode; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center" data-testid="empty-state">
      <I className="mb-2 h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">{title}</div>
      {children && <div className="mt-1 max-w-md text-xs text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const e = error as ApiError;
  if (e?.status === 403)
    return (
      <Empty title="Not available for this role" icon={Lock}>
        {e.message}
      </Empty>
    );
  return (
    <Empty title="Something went wrong" icon={AlertTriangle}>
      {e?.message ?? String(error)}
    </Empty>
  );
}

export function useDash<T = any>(name: string, extra?: Record<string, any>) {
  const { filters, role, demo } = useApp();
  return useQuery<T>({ queryKey: [`/api/dashboard/${name}`, { ...filters, ...extra, _r: role, _d: demo ? 1 : 0 }] });
}

export function Freshness({ items }: { items?: { dataset: string; label: string; approvedRows: number; lastSuccessfulImport: string | null; lastStatus: string | null; failure: string | null }[] }) {
  const { demo } = useApp();
  if (!items) return null;
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-[13px] font-semibold">
        <Clock className="h-4 w-4 text-muted-foreground" /> Source freshness
      </div>
      <div className="divide-y">
        {items.map((f) => (
          <div key={f.dataset} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs">
            <div className="min-w-0 font-medium">{f.label}</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="tabular-nums">{f.approvedRows.toLocaleString()} rows</span>
              {f.failure ? <Pill tone="red">Refresh failed</Pill> : f.approvedRows ? <Pill tone={demo ? "gold" : "green"}>{demo ? "Demo" : "Approved"}</Pill> : <Pill>Source pending</Pill>}
              <span className="hidden sm:inline">{f.lastSuccessfulImport ? `Last good ${ago(f.lastSuccessfulImport)}` : "No successful import"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FailureBanner({ items }: { items?: { label: string; failure: string | null; lastSuccessfulImport: string | null }[] }) {
  const failed = items?.filter((i) => i.failure) ?? [];
  if (!failed.length) return null;
  return (
    <div className="mb-4 space-y-2" data-testid="refresh-failure-banner">
      {failed.map((f) => (
        <div key={f.label} className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">{f.label}: latest refresh failed — showing last approved data{f.lastSuccessfulImport ? ` from ${dateTimeLabel(f.lastSuccessfulImport)}` : ""}</div>
            <div className="mt-0.5 text-xs opacity-90">{f.failure}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DownloadLink({ href, params, children, testId }: { href: string; params?: Record<string, any>; children: ReactNode; testId?: string }) {
  return (
    <a href={fileUrl(href, params)} target="_blank" rel="noopener noreferrer" data-testid={testId} className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted">
      <Download className="h-4 w-4" />
      {children}
    </a>
  );
}

export function SimpleTable({ columns, rows, empty, dense, testId }: { columns: { key: string; label: string; align?: "right" | "left"; render?: (r: any) => ReactNode; className?: string }[]; rows: any[]; empty?: ReactNode; dense?: boolean; testId?: string }) {
  if (!rows?.length) return <>{empty ?? <Empty title="No rows" />}</>;
  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            {columns.map((c) => (
              <th key={c.key} className={cn("whitespace-nowrap px-3 py-2 font-semibold", c.align === "right" && "text-right", c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-muted/40">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 align-top", dense ? "py-1.5" : "py-2.5", c.align === "right" && "text-right tabular-nums", c.className)}>
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn" | "gold"; title?: string; children: ReactNode }) {
  const t = {
    info: "border-[hsl(164_69%_19%/0.25)] bg-[hsl(164_69%_19%/0.05)] dark:bg-[hsl(164_50%_50%/0.08)]",
    warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    gold: "border-[hsl(43_96%_50%/0.5)] bg-[hsl(43_96%_58%/0.12)]",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", t)}>
      {title && <div className="mb-0.5 font-semibold">{title}</div>}
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}
