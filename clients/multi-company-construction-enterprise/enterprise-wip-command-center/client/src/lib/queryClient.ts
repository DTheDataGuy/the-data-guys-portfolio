import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
export type Role = "admin" | "executive" | "finance" | "reviewer" | "viewer";

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

export type Me = { id: string; name: string; login: string; email: string | null; title: string | null; role: Role; roleLabel: string; scope: string; mustChange: boolean };
let session: { token: string; user: Me | null; checked: boolean } = { token: "", user: null, checked: false };
const subs = new Set<() => void>();
export const getSession = () => session;
export function setSession(token: string, user: Me | null) {
  session = { token, user, checked: true };
  if (!user) queryClient.clear();
  subs.forEach((f) => f());
}
export function useSession() { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => session); }

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) { super(message); }
}
const headers = (json: boolean): Record<string, string> => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
});
async function check(res: Response) {
  if (res.ok) return;
  let body: any = null;
  try { body = await res.json(); } catch {}
  if (res.status === 401 && session.user) setSession("", null);
  if (res.status === 403 && body?.mustChange && session.user) setSession(session.token, { ...session.user, mustChange: true });
  throw new ApiError(res.status, body?.message || res.statusText || "Request failed", body);
}
export async function api<T = any>(method: string, url: string, data?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${url}`, { method, headers: headers(data !== undefined), body: data !== undefined ? JSON.stringify(data) : undefined, credentials: "include" });
  } catch {
    throw new ApiError(0, "Can’t reach the server. Check your connection.");
  }
  await check(res);
  return res.json();
}
export async function blobUrl(url: string) {
  const res = await fetch(`${API_BASE}${url}`, { headers: headers(false), credentials: "include" });
  await check(res);
  return URL.createObjectURL(await res.blob());
}
export async function download(url: string, fallbackName: string) {
  const res = await fetch(`${API_BASE}${url}`, { headers: headers(false), credentials: "include" });
  await check(res);
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const m = /filename="([^"]+)"/.exec(cd);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = m?.[1] || fallbackName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Try to restore a session from the secure cookie (works on the published site). */
export async function restoreSession() {
  try {
    const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
    if (r.ok) { const j = await r.json(); setSession(j.token || "", j.user); return; }
  } catch {}
  setSession("", null);
}

export const getQueryFn: <T>(o: { on401: "returnNull" | "throw" }) => QueryFunction<T> = ({ on401 }) => async ({ queryKey }) => {
  const res = await fetch(`${API_BASE}${queryKey.join("/")}`, { headers: headers(false), credentials: "include" });
  if (on401 === "returnNull" && res.status === 401) return null;
  await check(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { queryFn: getQueryFn({ on401: "throw" }), refetchInterval: false, refetchOnWindowFocus: false, staleTime: Infinity, retry: false },
    mutations: { retry: false },
  },
});
