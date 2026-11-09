import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setSession, useSession, type Me } from "@/lib/queryClient";
import { Logo } from "@/components/shell";
import { ThemeToggle } from "@/lib/theme";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex items-center gap-3"><Logo className="h-10 w-10 text-white" /><div><div className="text-[15px] font-semibold text-white">Enterprise WIP</div><div className="text-[12px] opacity-70">Command Center</div></div></div>
        <div className="mt-auto max-w-lg">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-white">One governed WIP. Every entity. Every month.</h1>
          <p className="mt-4 text-[15px] leading-7 opacity-80">Standardized WIPs arrive by email, are validated against the approved rules, and roll up into backlog, forecast, cash-flow and bond-capacity planning — with every change traced to its source row.</p>
          <div className="mt-8 flex flex-wrap gap-2 text-[12px]">
            {["WIP", "Backlog", "Revenue forecast", "Cash flow", "Bond capacity", "Executive planning"].map((s, i) => (
              <span key={s} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-white/85">{i > 0 ? <span className="text-[hsl(var(--sidebar-primary))]">→</span> : null}{s}</span>
            ))}
          </div>
        </div>
        <svg className="pointer-events-none absolute -right-24 top-24 h-[420px] w-[420px] opacity-[.07]" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth=".6">{Array.from({ length: 10 }).map((_, i) => <rect key={i} x={5 + i * 4} y={5 + i * 4} width={90 - i * 8} height={90 - i * 8} rx="6" />)}</svg>
      </div>
      <div className="relative flex items-center justify-center px-6 py-12">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [login, setLogin] = useState(""); const [pw, setPw] = useState(""); const [show, setShow] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { const r = await api<{ token: string; user: Me }>("POST", "/api/auth/login", { login: login.trim(), password: pw }); setSession(r.token, r.user); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Frame>
      <div className="mb-8 lg:hidden"><Logo className="h-10 w-10 text-foreground" /></div>
      <h2 className="text-[24px] font-semibold tracking-tight">Sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">Authorized users only. Use the username or email you were given.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="login">Username or email</Label><Input id="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus data-testid="input-login" /></div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <div className="relative"><Input id="pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="pr-10" data-testid="input-password" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        </div>
        {err ? <div className="rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 px-3 py-2 text-sm text-[hsl(var(--destructive))]" data-testid="text-login-error">{err}</div> : null}
        <Button type="submit" className="w-full" disabled={busy || !login || !pw} data-testid="button-signin">{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-8 flex items-center gap-2 text-[12px] text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Sessions expire after 12 hours. Financial data stays on the server.</p>
    </Frame>
  );
}

export function PasswordForm({ onDone, first }: { onDone?: () => void; first?: boolean }) {
  const [cur, setCur] = useState(""); const [nx, setNx] = useState(""); const [nx2, setNx2] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [ok, setOk] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk(false);
    if (nx !== nx2) return setErr("The new passwords don’t match.");
    setBusy(true);
    try { const r = await api<{ user: Me }>("POST", "/api/auth/password", { current: cur, next: nx }); setSession((await import("@/lib/queryClient")).getSession().token, r.user); setOk(true); setCur(""); setNx(""); setNx2(""); onDone?.(); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="cur">{first ? "Temporary password" : "Current password"}</Label><Input id="cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} data-testid="input-current" /></div>
      <div className="space-y-1.5"><Label htmlFor="nx">New password</Label><Input id="nx" type="password" autoComplete="new-password" value={nx} onChange={(e) => setNx(e.target.value)} data-testid="input-new" /><p className="text-[12px] text-muted-foreground">At least 12 characters, mixing letters with numbers or symbols.</p></div>
      <div className="space-y-1.5"><Label htmlFor="nx2">Confirm new password</Label><Input id="nx2" type="password" autoComplete="new-password" value={nx2} onChange={(e) => setNx2(e.target.value)} data-testid="input-new2" /></div>
      {err ? <div className="text-sm text-[hsl(var(--destructive))]">{err}</div> : null}
      {ok && !first ? <div className="text-sm text-[hsl(var(--ok))]">Password updated.</div> : null}
      <Button type="submit" disabled={busy || !cur || !nx} data-testid="button-save-password">{busy ? "Saving…" : "Save new password"}</Button>
    </form>
  );
}

export function ForceChange() {
  const s = useSession();
  return (
    <Frame>
      <h2 className="text-[24px] font-semibold tracking-tight">Welcome, {s.user?.name.split(" ")[0]}</h2>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Set your own password to finish signing in. The temporary one stops working after this.</p>
      <PasswordForm first />
      <button className="mt-6 text-[12px] text-muted-foreground underline" onClick={() => setSession("", null)}>Sign out</button>
    </Frame>
  );
}
