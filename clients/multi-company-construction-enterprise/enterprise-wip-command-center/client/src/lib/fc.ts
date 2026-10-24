import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { forecastRows, monthLabels, cashModel, fcKey, type FcOverride, type FcAssumptions, DEFAULT_FC } from "@shared/calc";
import { useWip, type Enriched } from "./app";

export type Opp = { id: string; entity: string | null; name: string; customer: string | null; bid_date: string | null; value: number | null; probability: number | null; stage: string; start_month: string | null; duration: number | null; margin: number | null; bonded: boolean; owner: string | null; linked: string | null; notes: string | null; sample: boolean; created_at: string; updated_at: string; updated_by: string | null };
export const OPEN_STAGES = ["Opportunity", "Bid", "Award", "Project Setup"];

export function useOverrides() {
  const q = useQuery<any[]>({ queryKey: ["/api/fc-overrides"] });
  return useMemo(() => new Map<string, FcOverride>((q.data || []).map((o) => [o.key, { key: o.key, months: o.months, startOffset: o.start_offset, curve: o.curve, note: o.note }])), [q.data]);
}
export function useOpps() { return useQuery<Opp[]>({ queryKey: ["/api/opps"] }); }

/** Month index (0 = first month after as-of) of a YYYY-MM start. */
export function monthIndex(asOf: string, ym: string) { const a = new Date(asOf + "T00:00:00Z"); const [y, m] = ym.split("-").map(Number); return (y - a.getUTCFullYear()) * 12 + (m - 1 - a.getUTCMonth()) - 1; }

/** Probability-weighted pipeline revenue phased straight-line from start month over duration. Only open stages; only when value, probability, start and duration are all entered. */
export function pipelineCurve(opps: Opp[], asOf: string, H: number) {
  const rev = new Array(H).fill(0), gp = new Array(H).fill(0); const used: Opp[] = [], skipped: Opp[] = [];
  for (const o of opps) {
    if (!OPEN_STAGES.includes(o.stage)) continue;
    if (o.value == null || o.probability == null || !o.start_month || !o.duration) { skipped.push(o); continue; }
    used.push(o); const s = monthIndex(asOf, o.start_month); const wv = o.value * o.probability;
    for (let i = 0; i < o.duration; i++) { const k = s + i; if (k >= 0 && k < H) { rev[k] += wv / o.duration; gp[k] += (wv / o.duration) * (o.margin ?? 0); } }
  }
  return { rev, gp, used, skipped };
}

export function useForecast() {
  const w = useWip(); const ovs = useOverrides(); const opps = useOpps();
  const out = useMemo(() => {
    if (!w.view || !w.boot || !w.period) return null;
    const a: FcAssumptions = { ...DEFAULT_FC, ...w.boot.settings.fc }; const asOf = w.period.as_of; const H = a.horizon;
    const pool = w.view.scoped.filter((r) => r.eligible || (a.includeJV && r.inBondReport && !r.eligible));
    const excluded = pool.filter((r) => (r.m.remC ?? 0) < 0);
    const base = pool.filter((r) => (r.m.remC ?? 0) >= 0);
    const fc = forecastRows(base, a, ovs, asOf);
    const labels = monthLabels(asOf, H);
    const rev = labels.map((_, i) => fc.reduce((s, f) => s + f.rev[i], 0));
    const cost = labels.map((_, i) => fc.reduce((s, f) => s + f.cost[i], 0));
    const totalRem = base.reduce((s, r) => s + Math.max(r.m.remC || 0, 0), 0);
    const inH = rev.reduce((s, x) => s + x, 0);
    let run = totalRem; const backlog = rev.map((x) => (run -= x));
    const pipe = pipelineCurve(opps.data || [], asOf, H);
    const target = w.boot.settings.planning?.targetMonthly ?? a.targetMonthly ?? null; const gapPct = w.boot.settings.planning?.gapPct ?? a.gapPct;
    const gapIdx = target ? rev.findIndex((x) => x < target * gapPct) : -1;
    return { a, asOf, H, fc, labels, rev, cost, gp: rev.map((x, i) => x - cost[i]), backlog, totalRem, beyond: Math.max(0, totalRem - inH), excluded, base, pipe, target, gapPct, gapIdx, ovs, key: (r: Enriched) => fcKey(r) };
  }, [w.view, w.boot, w.period, ovs, opps.data]);
  return { ...w, f: out, opps };
}

export function useCash() {
  const x = useForecast();
  const c = useMemo(() => x.f && x.boot ? cashModel(x.f.fc, x.boot.settings.cash, x.f.H) : null, [x.f, x.boot]);
  return { ...x, c };
}
