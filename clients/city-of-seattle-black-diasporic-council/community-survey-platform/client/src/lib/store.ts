import { useSyncExternalStore } from "react";

/** Browser storage can be unavailable (private mode, embedded frames). Everything falls back to memory. */
const mem = new Map<string, string>();
export const box = {
  get(k: string) { return mem.get(k) ?? null; },
  set(k: string, v: string) { mem.set(k, v); },
  del(k: string) { mem.delete(k); },
};

export type Draft = { answers: Record<string, any>; step: number; maxStep: number; token: string | null; startedAt: number | null; channel: string | null; savedAt: number | null };
const KEY = "sbd-survey-draft-v1";
const blank = (): Draft => ({ answers: {}, step: 0, maxStep: 0, token: null, startedAt: null, channel: null, savedAt: null });
let draft: Draft = (() => { try { const v = box.get(KEY); return v ? { ...blank(), ...JSON.parse(v) } : blank(); } catch { return blank(); } })();
const subs = new Set<() => void>();
export const getDraft = () => draft;
export function updateDraft(patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) {
  const p = typeof patch === "function" ? patch(draft) : patch;
  draft = { ...draft, ...p, savedAt: Date.now() };
  box.set(KEY, JSON.stringify(draft));
  subs.forEach((f) => f());
}
export function setAnswer(id: string, v: any) { updateDraft((d) => ({ answers: { ...d.answers, [id]: v } })); }
export function clearDraft() { draft = blank(); box.del(KEY); subs.forEach((f) => f()); }
export function useDraft() { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => draft); }

/** Collection-link code from ?c= (before or inside the hash). */
export function channelFromUrl() {
  const q = new URLSearchParams(window.location.search).get("c");
  if (q) return q.toLowerCase();
  const h = window.location.hash; const i = h.indexOf("?");
  return i >= 0 ? new URLSearchParams(h.slice(i + 1)).get("c")?.toLowerCase() || null : null;
}
