import { useSyncExternalStore, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, queryClient, useSession } from "./queryClient";
import { metrics, exceptions, type Row, type Thresholds, type FcAssumptions, type CashAssumptions, type LossBasis, type ExcCat } from "@shared/calc";
import type { ReconTol as Tolerances, Owners } from "@shared/recon";

export type Period = { id: string; label: string; as_of: string; status: "draft" | "review" | "published"; version: number; published_at: string | null; published_by: string | null; note: string | null };
export type Entity = { code: string; company: string; bu: string; type: "Operating" | "JV"; status: string; notes: string | null; expected: number; sort: number };
export type Rule = { id: string; name: string; condition: string; treatment: string; basis: string; status: "approved" | "proposed"; active: boolean; version: number; params: Record<string, any> };
export type Bootstrap = {
  user: any; periods: Period[]; entities: Entity[]; rules: Rule[]; legacyRules: any[]; legacyEntity: any[];
  settings: { thresholds: Thresholds; fc: FcAssumptions; cash: CashAssumptions; surety: { aggregate: number | null; single: number | null; note: string }; reconTol: Tolerances; owners: Owners; planning: { targetMonthly: number | null; gapPct: number } };
  intake: { address: string; allow: string[]; autoCommit: boolean; hasKey: boolean; keyLast4: string | null; rotatedAt: string | null };
};

/* ---------- UI state ---------- */
export type Filters = { bu: string; entity: string; company: string; kind: "all" | "Operating" | "JV" };
type UI = { period: string | null; filters: Filters; lossBasis: LossBasis | null; hist?: number };
let ui: UI = { period: null, filters: { bu: "all", entity: "all", company: "all", kind: "all" }, lossBasis: null };
const subs = new Set<() => void>();
const ALL: Filters = { bu: "all", entity: "all", company: "all", kind: "all" };
let hist: Filters[] = [];
const sameF = (a: Filters, b: Filters) => a.bu === b.bu && a.entity === b.entity && a.company === b.company && a.kind === b.kind;
export const setUI = (p: Partial<UI>) => {
  if (p.filters && !sameF(p.filters, ui.filters)) { hist = [...hist, ui.filters].slice(-25); }
  ui = { ...ui, ...p, hist: hist.length }; subs.forEach((f) => f());
};
/** Step back to the previous filter view (one click undoes one drill-in). */
export const backFilters = () => {
  const prev = hist.pop(); ui = { ...ui, filters: prev || ALL, hist: hist.length }; subs.forEach((f) => f());
};
export const clearFilters = () => { if (!sameF(ui.filters, ALL)) setUI({ filters: ALL }); };
/** Click a chart item: filter to it, or click the same item again to step back out. */
export const toggleFilter = (k: keyof Filters, v: string) => {
  if ((ui.filters as any)[k] === v) backFilters(); else setUI({ filters: { ...ui.filters, [k]: v } as Filters });
};
export const useUI = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => ui);

export function useBootstrap() {
  const s = useSession();
  return useQuery<Bootstrap>({ queryKey: ["/api/bootstrap"], enabled: !!s.user && !s.user.mustChange });
}
export function usePeriod() {
  const { data } = useBootstrap(); const u = useUI();
  const periods = data?.periods || [];
  const p = periods.find((x) => x.id === u.period) || periods.find((x) => x.status === "published") || periods[0] || null;
  return { period: p, periods };
}
export function useRows(periodId?: string | null) {
  return useQuery<Row[]>({ queryKey: ["/api/periods", periodId || "", "rows"], enabled: !!periodId });
}

/** Live sync: poll the server revision and refresh everything when anyone changes data. */
export function useLiveSync() {
  const s = useSession(); const last = useRef<number | null>(null);
  useEffect(() => {
    if (!s.user || s.user.mustChange) return;
    let stop = false;
    const tick = async () => {
      try { const { rev } = await api<{ rev: number }>("GET", "/api/rev"); if (last.current !== null && rev !== last.current) queryClient.invalidateQueries(); last.current = rev; } catch {}
      if (!stop) setTimeout(tick, 5000);
    };
    tick();
    return () => { stop = true; };
  }, [s.user?.id, s.user?.mustChange]);
}

export const matchFilters = (r: Row, f: Filters, ents: Entity[]) => {
  if (f.bu !== "all" && r.bu !== f.bu) return false;
  if (f.entity !== "all" && r.entity !== f.entity) return false;
  if (f.company !== "all" && r.company !== f.company) return false;
  if (f.kind !== "all") { const e = ents.find((x) => x.code === r.entity); if ((e?.type || "Operating") !== f.kind) return false; }
  return true;
};

export type Enriched = Row & { m: ReturnType<typeof metrics>; exc: ExcCat[] };
/** Central view model: period rows + filters + thresholds → enriched rows everywhere in the app. */
export function useWip() {
  const boot = useBootstrap(); const { period, periods } = usePeriod(); const u = useUI();
  const q = useRows(period?.id);
  const th: Thresholds | null = boot.data ? { ...boot.data.settings.thresholds, lossBasis: u.lossBasis || boot.data.settings.thresholds.lossBasis } : null;
  const view = useMemo(() => {
    if (!q.data || !boot.data || !th) return null;
    const ents = boot.data.entities;
    const all: Enriched[] = q.data.map((r) => { const m = metrics(r); return { ...r, m, exc: r.eligible ? exceptions(r, m, th) : [] }; });
    const scoped = all.filter((r) => matchFilters(r, u.filters, ents));
    const noLossLabels = th.lossBasis === "legacy" && !all.some((r) => !!r.legacyExc);
    return { all, scoped, eligible: scoped.filter((r) => r.eligible), bondReport: scoped.filter((r) => r.inBondReport), noLossLabels };
  }, [q.data, boot.data, u.filters, th?.lossBasis, th?.lossThreshold, th?.underThreshold]);
  return { boot: boot.data, period, periods, th, view, loading: boot.isLoading || q.isLoading, filters: u.filters };
}

export const filtersActive = (f: Filters) => f.bu !== "all" || f.entity !== "all" || f.company !== "all" || f.kind !== "all";
export const canEdit = (role?: string) => ["admin", "executive", "finance"].includes(role || "");
export const canReview = (role?: string) => ["admin", "executive", "finance", "reviewer"].includes(role || "");
export const isExec = (role?: string) => ["admin", "executive"].includes(role || "");

export async function fileToBase64(f: File): Promise<string> {
  const buf = new Uint8Array(await f.arrayBuffer()); let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}
export async function saveSetting(k: string, v: any) { await api("PUT", `/api/settings/${k}`, v); await queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] }); }
