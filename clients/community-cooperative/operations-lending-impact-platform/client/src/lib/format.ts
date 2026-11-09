export type Unit = "count" | "money" | "hours" | "days" | "percent" | "ratio" | "score";

export function fmtValue(v: number | null | undefined, unit: Unit, compact = false): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "Not available";
  switch (unit) {
    case "money":
      if (compact && Math.abs(v) >= 1000) {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: Math.abs(v) >= 1e6 ? 2 : 1 }).format(v);
      }
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(v) < 100 ? 2 : 0 }).format(v);
    case "percent":
      return `${v.toFixed(1)}%`;
    case "hours":
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })} hrs`;
    case "days":
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })} days`;
    case "ratio":
      return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    case "score":
      return v.toFixed(2);
    default:
      return compact && Math.abs(v) >= 10000 ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v) : v.toLocaleString("en-US");
  }
}
export const money = (v: number | null | undefined, compact = false) => fmtValue(v, "money", compact);
export const num = (v: number | null | undefined) => fmtValue(v, "count");
export const pct = (v: number | null | undefined, digits = 1) => (v === null || v === undefined ? "Not available" : `${(v * 100).toFixed(digits)}%`);
export const axisMoney = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);
export const axisNum = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
export function monthLabel(m: string) {
  if (!m) return "";
  const [y, mo] = m.split("-").map(Number);
  if (!mo) return m;
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}
export function dateLabel(d?: string | null) {
  if (!d) return "—";
  const t = Date.parse(d.length === 10 ? d + "T12:00:00Z" : d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function dateTimeLabel(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
export function ago(d?: string | null) {
  if (!d) return "never";
  const s = (Date.now() - Date.parse(d)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
export const CHART = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
