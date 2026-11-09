export const fmt = (n: number | null | undefined, d = 0) => (n == null || Number.isNaN(n) ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
export const pct = (n: number | null | undefined, d = 0) => (n == null ? "—" : `${fmt(n, d)}%`);
export const pts = (n: number | null | undefined) => (n == null ? "—" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n), 1)} pts`);
export const dateLabel = (d: string | null | undefined) => { if (!d) return "—"; const [y, m, dd] = d.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
export const qs = (o: Record<string, any>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v != null && v !== "" && v !== "all") p.set(k, String(v)); const s = p.toString(); return s ? `?${s}` : ""; };
