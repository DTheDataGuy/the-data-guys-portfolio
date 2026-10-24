import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

// Session state lives in memory only (no cookies/localStorage).
export const session = { role: "leadership", user: "", demo: false };

function headers(json = false): Record<string, string> {
  const h: Record<string, string> = { "x-denkyem-role": session.role, "x-denkyem-demo": session.demo ? "1" : "0" };
  if (session.user) h["x-denkyem-user"] = session.user;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

export class ApiError extends Error {
  status: number;
  issues?: any[];
  constructor(status: number, message: string, issues?: any[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let msg = res.statusText;
    let issues: any[] | undefined;
    try {
      const j = await res.json();
      msg = j.message || msg;
      issues = j.issues;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg, issues);
  }
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, { method, headers: headers(!!data), body: data ? JSON.stringify(data) : undefined });
  await throwIfResNotOk(res);
  return res;
}

export async function apiUpload(url: string, form: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}${url}`, { method: "POST", headers: headers(false), body: form });
  await throwIfResNotOk(res);
  return res.json();
}

export function qs(params?: Record<string, any>) {
  if (!params) return "";
  const e = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all");
  return e.length ? "?" + e.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&") : "";
}

/** URL for a file download (headers can't be set on <a>, so role/demo go in the query). */
export function fileUrl(path: string, params?: Record<string, any>) {
  return `${API_BASE}${path}${qs({ ...params, role: session.role, demo: session.demo ? 1 : 0, user: session.user || undefined })}`;
}

export const getQueryFn: <T>(options: { on401: "returnNull" | "throw" }) => QueryFunction<T> =
  () =>
  async ({ queryKey }) => {
    const [url, params] = queryKey as [string, Record<string, any> | undefined];
    const res = await fetch(`${API_BASE}${url}${qs(params)}`, { headers: headers() });
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: false,
    },
    mutations: { retry: false },
  },
});
