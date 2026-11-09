import { type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export const tooltipStyle = {
  contentStyle: { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--popover-foreground))" },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: "hsl(var(--popover-foreground))", padding: 0 },
  cursor: { fill: "hsl(var(--muted) / 0.5)" },
};
export const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false } as const;
export const grid = { stroke: "hsl(var(--border))", strokeDasharray: "3 3", vertical: false } as const;
export const C = {
  green: "hsl(var(--chart-1))",
  gold: "hsl(var(--chart-2))",
  bronze: "hsl(var(--chart-3))",
  teal: "hsl(var(--chart-4))",
  gray: "hsl(var(--chart-5))",
};
export const SERIES = [C.green, C.gold, C.bronze, C.teal, C.gray, "hsl(164 35% 45%)", "hsl(43 60% 40%)", "hsl(30 30% 40%)"];

export function ChartBox({ height = 260, children }: { height?: number; children: ReactNode }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color, opacity: i.dashed ? 0.6 : 1 }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Horizontal bar list — readable for long category labels. */
export function BarList({ rows, format, color = C.green, max }: { rows: { name: string; value: number | null; display?: string; note?: string }[]; format: (v: number) => string; color?: string; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.name} className="text-sm">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{r.value === null ? r.display ?? "Suppressed" : format(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full" style={{ width: `${r.value === null ? 0 : Math.max(2, (r.value / m) * 100)}%`, background: color }} />
          </div>
          {r.note && <div className="mt-0.5 text-[11px] text-muted-foreground">{r.note}</div>}
        </div>
      ))}
    </div>
  );
}
