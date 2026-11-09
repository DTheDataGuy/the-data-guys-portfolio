import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

// ---- session (access code + display name), kept in memory with best-effort session persistence
// staff session is kept in memory only (never written to browser storage)
let session = { key: "", name: "", role: "" as "" | "admin" | "analyst" | "viewer" };
const subs = new Set<() => void>();
export const getSession = () => session;
export function setSession(key: string, name: string, role: "" | "admin" | "analyst" | "viewer" = "") {
  session = { key, name, role };
  subs.forEach((f) => f());
}
export function useSession() { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => session); }

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string>, public current?: any) { super(message); }
}
const headers = (json: boolean): Record<string, string> => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(session.key ? { "x-sd-key": session.key } : {}),
  ...(session.name ? { "x-sd-actor": encodeURIComponent(session.name) } : {}),
});
async function check(res: Response) {
  if (res.ok) return;
  let body: any = null;
  try { body = await res.json(); } catch {}
  if (res.status === 401 && session.key) setSession("", "", "");
  throw new ApiError(res.status, body?.message || res.statusText || "Request failed", body?.errors, body?.current);
}
export async function api<T = any>(method: string, url: string, data?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${url}`, { method, headers: headers(data !== undefined), body: data !== undefined ? JSON.stringify(data) : undefined });
  } catch {
    throw new ApiError(0, "Can’t reach the server. Check your connection and try again.");
  }
  await check(res);
  return res.json();
}
export async function download(url: string, fallbackName: string) {
  const res = await fetch(`${API_BASE}${url}`, { headers: headers(false) });
  await check(res);
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const m = /filename="([^"]+)"/.exec(cd);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = m?.[1] || fallbackName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export const getQueryFn: <T>(o: { on401: "returnNull" | "throw" }) => QueryFunction<T> = ({ on401 }) => async ({ queryKey }) => {
  const res = await fetch(`${API_BASE}${queryKey.join("/")}`, { headers: headers(false) });
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
