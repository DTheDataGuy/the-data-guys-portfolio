import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, Copy, Download, FileSpreadsheet, FileText, Filter, KeyRound, Loader2, LogOut, Megaphone, MessageSquareQuote, PenLine, Printer, Radio, Settings as Cog, ShieldCheck, Upload, UserPlus, Users, X } from "lucide-react";
import { BD_GROUPS, FLAG_LABEL, SEATTLE_ZIPS } from "@shared/survey";
import { api, ApiError, download, getQueryFn, setSession, useSession } from "@/lib/queryClient";
import { Story, CHAPTERS } from "@/components/story";
import { Card, Empty, Evidence } from "@/components/charts";
import { SurveyForm } from "@/pages/survey";
import { Wordmark } from "@/components/public-layout";
import { ThemeToggle } from "@/lib/theme";
import { fmt, dateLabel, qs } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Min = "viewer" | "analyst" | "admin";
const RANK: Record<string, number> = { viewer: 1, analyst: 2, admin: 3 };
const OPS: { id: string; t: string; i: any; min: Min }[] = [
  { id: "import", t: "Import data", i: Upload, min: "analyst" },
  { id: "exports", t: "Export data", i: Download, min: "viewer" },
  { id: "responses", t: "Responses", i: ClipboardList, min: "analyst" },
  { id: "voices", t: "Code written answers", i: MessageSquareQuote, min: "analyst" },
  { id: "entry", t: "Paper entry", i: PenLine, min: "analyst" },
  { id: "outreach", t: "Collection links", i: Megaphone, min: "analyst" },
  { id: "contacts", t: "Follow-up contacts", i: Users, min: "admin" },
  { id: "team", t: "Team access", i: KeyRound, min: "admin" },
  { id: "settings", t: "Settings", i: Cog, min: "admin" },
];
const allowed = (role: string, min: Min) => (RANK[role] || 0) >= RANK[min];
const ROLE_LABEL: Record<string, string> = { viewer: "Executive viewer", analyst: "Analyst", admin: "Administrator" };
const useQ = <T = any,>(key: string, enabled = true) => useQuery<T>({ queryKey: [key], queryFn: getQueryFn({ on401: "throw" }), enabled });

function Gate() {
  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); if (!code.trim()) return setErr("Enter your access code.");
    setBusy(true); setErr("");
    setSession(code.trim(), name.trim());
    try {
      const r = await api<{ role: any; name: string | null; personal: boolean }>("POST", "/api/staff/login");
      if (!r.personal && !name.trim()) { setSession("", "", ""); setErr("This is a shared team code. Add your name so changes are attributed in the audit log."); return; }
      setSession(code.trim(), r.name || name.trim(), r.role);
    } catch (e: any) { setSession("", "", ""); setErr(e.message || "Access code not recognized."); }
    finally { setBusy(false); }
  };
  return (
    <div className="grain flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-card-border bg-card md:grid-cols-[1.1fr_1fr]">
        <div className="hidden flex-col justify-between bg-[hsl(var(--sidebar))] p-9 text-[hsl(var(--sidebar-foreground))] md:flex">
          <div className="[&_*]:!text-[hsl(var(--sidebar-foreground))]"><Wordmark /></div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">Executive evidence dashboard</p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.1]">Every response, the moment it arrives.</h2>
            <ul className="mt-6 space-y-3 text-[14px] opacity-85">
              <li className="flex gap-2.5"><Radio className="mt-0.5 h-4 w-4 shrink-0" />Live results from the community survey</li>
              <li className="flex gap-2.5"><FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" />Import and export Excel or CSV</li>
              <li className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Private to the project team. The community never sees results.</li>
            </ul>
          </div>
          <p className="text-[12px] opacity-60">Groups under the privacy threshold are hidden everywhere.</p>
        </div>
        <form onSubmit={go} className="p-7 sm:p-9">
          <div className="md:hidden"><Wordmark /></div>
          <h1 className="mt-6 font-display text-[28px] md:mt-0">Team sign-in</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Use the personal access code an administrator sent you.</p>
          <label className="mt-6 block text-[14px] font-medium">Access code<input value={code} onChange={(e) => setCode(e.target.value)} type="password" className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-input bg-background px-3.5 font-mono tracking-wider" autoComplete="current-password" placeholder="SBD-XXXX-XXXX" data-testid="input-staff-code" /></label>
          <label className="mt-4 block text-[14px] font-medium">Your name <span className="font-normal text-muted-foreground">(only needed for shared codes)</span><input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-input bg-background px-3.5" autoComplete="name" data-testid="input-staff-name" /></label>
          {err && <p className="mt-3 text-[13.5px] font-medium text-destructive" role="alert">{err}</p>}
          <button disabled={busy} className="mt-6 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground hover-elevate" data-testid="button-staff-login">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Open dashboard <ArrowRight className="h-4 w-4" /></>}</button>
          <p className="mt-5 text-center text-[12.5px] text-muted-foreground">Need access? Ask your project administrator.</p>
        </form>
      </div>
    </div>
  );
}

function FilterBar({ f, setF, meta }: { f: any; setF: (f: any) => void; meta: any }) {
  const sel = "min-h-[36px] rounded-lg border border-input bg-card px-2.5 text-[13px]";
  const set = (k: string, v: string) => setF({ ...f, [k]: v || undefined });
  const active = Object.values(f).filter(Boolean).length;
  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <select aria-label="Diaspora group" className={sel} value={f.bd || ""} onChange={(e) => set("bd", e.target.value)}><option value="">All groups</option>{BD_GROUPS.map((g) => <option key={g.code} value={g.code}>{g.short}</option>)}</select>
      <select aria-label="Age" className={sel} value={f.age || ""} onChange={(e) => set("age", e.target.value)}><option value="">All ages</option><option value="youth">Under 25</option><option value="adult">25–64</option><option value="elder">65+</option></select>
      <select aria-label="Area" className={sel} value={f.sector || ""} onChange={(e) => set("sector", e.target.value)}><option value="">All areas</option>{Array.from(new Set(Object.values(SEATTLE_ZIPS).map((z) => z.sector))).map((s) => <option key={s} value={s}>{s}</option>)}</select>
      {meta?.channels?.length > 0 && <select aria-label="Collection link" className={sel} value={f.channel || ""} onChange={(e) => set("channel", e.target.value)}><option value="">All links</option>{meta.channels.map((c: any) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>}
      <input aria-label="From date" type="date" className={sel} value={f.from || ""} onChange={(e) => set("from", e.target.value)} />
      <input aria-label="To date" type="date" className={sel} value={f.to || ""} onChange={(e) => set("to", e.target.value)} />
      {active > 0 && <button onClick={() => setF({})} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" />Clear {active}</button>}
    </div>
  );
}

function Dashboard({ chapter, f, meta }: { chapter?: string; f: any; meta: any }) {
  const { data: b, isLoading } = useQ(`/api/staff/analytics${qs(f)}`);
  const quotes = useQ<any[]>(`/api/staff/texts?flag=aggregate`);
  const [, nav] = useLocation();
  useEffect(() => { if (chapter) setTimeout(() => document.getElementById(`ch-${chapter}`)?.scrollIntoView({ behavior: "smooth" }), 60); }, [chapter, b]);
  if (isLoading || !b) return <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary" />)}</div>;
  const idx = CHAPTERS.findIndex((c) => c.id === chapter);
  return (
    <div>
      <Story b={b} quotes={(quotes.data || []).map((t: any) => ({ field: t.question_id, text: t.text }))} />
      <div className="mt-12 flex justify-end no-print">
        <button onClick={() => window.print()} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-5 text-[14px] font-medium hover-elevate"><Printer className="h-4 w-4" />Print or save as PDF</button>
      </div>
    </div>
  );
}

function Responses() {
  const [st, setSt] = useState("all"); const [open, setOpen] = useState<string | null>(null);
  const { data = [], isLoading } = useQ<any[]>(`/api/staff/responses?status=${st}`);
  return (
    <Card title="All responses" action={<select className="min-h-[36px] rounded-lg border border-input bg-card px-2.5 text-[13px]" value={st} onChange={(e) => setSt(e.target.value)}><option value="all">All</option><option value="review">Identity needs review</option><option value="flagged">Quality flags</option><option value="excluded">Excluded</option></select>}
      note="Each response has a permanent ID. Self-identification is stored as submitted; analytical groups are separate. Excluding keeps the record but removes it from analysis, with a reason in the audit log.">
      {isLoading ? <div className="h-32 animate-pulse rounded-xl bg-secondary" /> : !data.length ? <Empty>No responses in this view yet.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-[13px]">
          <thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="py-2 pr-3 font-medium">ID</th><th className="py-2 pr-3 font-medium">Date</th><th className="py-2 pr-3 font-medium">Groups</th><th className="py-2 pr-3 font-medium">ZIP</th><th className="py-2 pr-3 font-medium">Top priority</th><th className="py-2 pr-3 font-medium">Status</th><th /></tr></thead>
          <tbody>{data.map((r) => (
            <tr key={r.rid} className="border-b border-border/60">
              <td className="py-2 pr-3 font-mono text-[12px]">{r.rid}</td><td className="py-2 pr-3 tnum">{dateLabel(r.date)}</td>
              <td className="py-2 pr-3">{r.bd.map((c: string) => BD_GROUPS.find((g) => g.code === c)?.short).join(", ") || <span className="text-muted-foreground">Unclassified</span>}{r.bdReview && <span className="ml-1.5 rounded bg-[hsl(var(--gold)/.18)] px-1.5 text-[11px]">review</span>}</td>
              <td className="py-2 pr-3 tnum">{r.zip || "—"}</td><td className="py-2 pr-3">{r.priorities[0] || "—"}</td>
              <td className="py-2 pr-3">{r.status === "excluded" ? <span className="text-destructive">Excluded</span> : r.flags.length ? <span className="text-[hsl(var(--terra))]">{r.flags.join(", ")}</span> : "Included"}</td>
              <td className="py-2"><button onClick={() => setOpen(r.rid)} className="rounded-lg px-2 py-1 text-primary hover:bg-secondary">Open</button></td>
            </tr>))}</tbody>
        </table></div>
      )}
      {open && <Detail rid={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

function Detail({ rid, onClose }: { rid: string; onClose: () => void }) {
  const { data } = useQ(`/api/staff/responses/${rid}`);
  const qc = useQueryClient(); const { toast } = useToast(); const s = useSession();
  const act = async (status: string) => {
    const reason = window.prompt(status === "excluded" ? "Reason for excluding (recorded in the audit log):" : "Reason for including:") || "";
    if (!reason.trim()) return;
    try { await api("PATCH", `/api/staff/responses/${rid}/status`, { status, reason }); qc.invalidateQueries(); toast({ title: `Response ${status}` }); onClose(); } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-background p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Response ${rid}`}>
        <div className="flex items-center justify-between"><h2 className="font-mono text-[15px] font-semibold">{rid}</h2><button onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-secondary"><X className="h-4 w-4" /></button></div>
        {!data ? <Loader2 className="mt-6 h-5 w-5 animate-spin" /> : <>
          <div className="mt-4 flex gap-2">{data.respondent?.status !== "excluded" ? <button onClick={() => act("excluded")} className="rounded-full border border-border px-4 py-2 text-[13px] hover-elevate">Exclude from analysis</button> : <button onClick={() => act("included")} className="rounded-full border border-border px-4 py-2 text-[13px] hover-elevate">Include again</button>}</div>
          <h3 className="mt-6 text-[13px] font-semibold">Analytical classification <Evidence kind="assumption" className="ml-1" /></h3>
          <ul className="mt-2 space-y-1 text-[13px]">{(data.codes || []).map((c: any, i: number) => <li key={i} className="rounded-lg bg-secondary/60 px-3 py-2">{Object.entries(c).filter(([k2]) => !["id", "response_id"].includes(k2)).map(([k2, v]) => `${k2}: ${v ?? "—"}`).join(" · ")}</li>)}</ul>
          <h3 className="mt-6 text-[13px] font-semibold">Written answers</h3>
          <ul className="mt-2 space-y-2 text-[13.5px]">{(data.texts || []).map((t: any) => <li key={t.text_id} className="rounded-lg border border-border p-3"><p className="text-[11.5px] text-muted-foreground">{t.question_id} · {FLAG_LABEL[t.flag] || t.flag}</p><p className="mt-1">{t.text}</p></li>)}</ul>
          <h3 className="mt-6 text-[13px] font-semibold">Raw submission (unchanged)</h3>
          <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-secondary/60 p-3 text-[11.5px]">{(() => { try { return JSON.stringify(JSON.parse(data.raw?.payload || "{}"), null, 2); } catch { return data.raw?.payload; } })()}</pre>
          {data.raw?.sha256 && <p className="mt-1 break-all text-[11px] text-muted-foreground">SHA-256 {data.raw.sha256}{s.role ? "" : ""}</p>}
        </>}
      </div>
    </div>
  );
}

function Voices({ meta }: { meta: any }) {
  const [status, setStatus] = useState("all"); const [q, setQ] = useState("");
  const { data = [] } = useQ<any[]>(`/api/staff/texts${qs({ status, q })}`);
  const qc = useQueryClient(); const { toast } = useToast();
  const code = async (id: string, theme: string, st: string) => { try { await api("POST", `/api/staff/texts/${id}/code`, { theme, status: st }); qc.invalidateQueries(); } catch (e: any) { toast({ title: e.message, variant: "destructive" }); } };
  const flag = async (id: string, fl: string) => { try { await api("POST", `/api/staff/texts/${id}/flag`, { flag: fl }); qc.invalidateQueries(); } catch (e: any) { toast({ title: e.message, variant: "destructive" }); } };
  const cb = meta?.codebook || [];
  return (
    <Card title="Written answers" evidence="qual" action={<div className="flex gap-2"><input placeholder="Search text" value={q} onChange={(e) => setQ(e.target.value)} className="min-h-[36px] rounded-lg border border-input bg-card px-2.5 text-[13px]" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-[36px] rounded-lg border border-input bg-card px-2.5 text-[13px]"><option value="all">All</option><option value="uncoded">Not yet coded</option><option value="suggested">Has suggestions</option><option value="approved">Coded</option></select></div>}
      note="Suggested themes come from keyword matching and never count until approved. Only answers marked “Safe for aggregate report” can appear as quotes.">
      {!data.length ? <Empty>No written answers yet.</Empty> : <ul className="space-y-3">{data.slice(0, 200).map((t) => (
        <li key={t.text_id} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground"><span className="font-mono">{t.text_id} · {t.question_id}</span>
            <select value={t.flag} onChange={(e) => flag(t.text_id, e.target.value)} className="rounded-md border border-input bg-card px-2 py-1 text-[12px]" aria-label="Quote permission">{Object.entries(FLAG_LABEL).map(([k2, l]) => <option key={k2} value={k2}>{l}</option>)}</select></div>
          <p className="mt-2 text-[14.5px] leading-relaxed">{t.text}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {t.codes.map((c: any) => { const n = cb.find((x: any) => x.code === c.theme_code)?.name || c.theme_code; return (
              <span key={c.theme_code} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]", c.status === "approved" ? "bg-primary text-primary-foreground" : c.status === "suggested" ? "border border-dashed border-primary/60 text-primary" : "bg-secondary text-muted-foreground line-through")}>{n}
                {c.status === "suggested" && <><button onClick={() => code(t.text_id, c.theme_code, "approved")} className="font-semibold underline">approve</button><button onClick={() => code(t.text_id, c.theme_code, "rejected")} className="underline">reject</button></>}
                {c.status === "approved" && <button onClick={() => code(t.text_id, c.theme_code, "remove")} aria-label="Remove theme"><X className="h-3 w-3" /></button>}
              </span>); })}
            <select value="" onChange={(e) => e.target.value && code(t.text_id, e.target.value, "approved")} className="rounded-full border border-input bg-card px-2.5 py-1 text-[12px]" aria-label="Add theme"><option value="">+ Add theme</option>{cb.map((c: any) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
          </div>
        </li>))}</ul>}
    </Card>
  );
}

function Outreach({ meta }: { meta: any }) {
  const [name, setName] = useState(""); const qc = useQueryClient(); const { toast } = useToast();
  const base = `${window.location.origin}${window.location.pathname}#/survey`;
  const add = async () => { if (!name.trim()) return; try { await api("POST", "/api/staff/channels", { name }); setName(""); qc.invalidateQueries(); } catch (e: any) { toast({ title: e.message, variant: "destructive" }); } };
  return (
    <Card title="Collection links" note="Give each partner, event or flyer its own link to see which outreach reaches whom. The link records only the channel, never the person.">
      <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rainier Beach community center" className="min-h-[44px] flex-1 rounded-xl border border-input bg-card px-3.5 text-[14px]" /><button onClick={add} className="rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground hover-elevate">Create link</button></div>
      <ul className="mt-4 space-y-2">
        <li className="rounded-xl border border-border p-3 text-[13px]"><p className="font-semibold">General public link</p><p className="mt-1 break-all font-mono text-[12px] text-muted-foreground">{base}</p></li>
        {(meta?.channels || []).map((c: any) => { const url = `${base}?c=${c.code}`; return (
          <li key={c.code} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-[13px]"><div className="min-w-0"><p className="font-semibold">{c.name} <span className="font-mono text-[11.5px] font-normal text-muted-foreground">{c.code}</span></p><p className="mt-1 break-all font-mono text-[12px] text-muted-foreground">{url}</p></div><button onClick={() => { navigator.clipboard?.writeText(url); toast({ title: "Link copied" }); }} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[12.5px] hover-elevate">Copy</button></li>); })}
      </ul>
    </Card>
  );
}

function Contacts() {
  const { data = [] } = useQ<any[]>("/api/staff/contacts");
  return (
    <Card title="Follow-up sign-ups" note="Stored separately from survey responses, with no link between them. Visible to administrators only. Export from the Exports page.">
      {!data.length ? <Empty>No sign-ups yet.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-[13px]"><thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground">{["ID", "Name", "Email", "Phone", "Method", "Interests", "Received"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>{data.map((c: any) => <tr key={c.contact_id || c.id} className="border-b border-border/60"><td className="py-2 pr-3 font-mono text-[12px]">{c.contact_id || c.id}</td><td className="py-2 pr-3">{c.name || "—"}</td><td className="py-2 pr-3">{c.email || "—"}</td><td className="py-2 pr-3">{c.phone || "—"}</td><td className="py-2 pr-3">{c.method || c.preferred_method}</td><td className="py-2 pr-3">{String(c.interests || "").replace(/[\[\]"]/g, "").replace(/,/g, ", ")}</td><td className="py-2 pr-3 tnum">{dateLabel(c.created_at || c.submitted_at)}</td></tr>)}</tbody></table></div>}
    </Card>
  );
}

function Settings({ meta }: { meta: any }) {
  const s = meta?.settings; const qc = useQueryClient(); const { toast } = useToast();
  const [v, setV] = useState<any>(null); useEffect(() => { if (s) setV(s); }, [s]);
  if (!v) return null;
  const save = async () => { try { await api("PUT", "/api/staff/settings", v); qc.invalidateQueries(); toast({ title: "Settings saved and logged" }); } catch (e: any) { toast({ title: e.message, variant: "destructive" }); } };
  const inp = "mt-1 block min-h-[42px] w-full rounded-lg border border-input bg-card px-3 text-[14px]";
  return (
    <div className="space-y-4">
      <Card title="Survey and publication" note="Results are visible only to signed-in team members, in every mode. The community site never shows findings. Closing the survey stops new online responses; imports and paper entry still work.">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-[13.5px] font-medium">Survey status<select className={inp} value={v.survey_status} onChange={(e) => setV({ ...v, survey_status: e.target.value })}><option value="open">Open</option><option value="closed">Closed</option></select></label>
          <label className="text-[13.5px] font-medium">Mode<select className={inp} value={v.mode} onChange={(e) => setV({ ...v, mode: e.target.value })}><option value="collection">Collecting responses</option><option value="internal">Analysis</option></select></label>
          <label className="text-[13.5px] font-medium">Privacy threshold (hide under)<input type="number" className={inp} value={v.suppression_k} onChange={(e) => setV({ ...v, suppression_k: e.target.value })} /></label>
          <label className="text-[13.5px] font-medium">Working response target<input type="number" className={inp} value={v.target_n} onChange={(e) => setV({ ...v, target_n: e.target.value })} /></label>
          <label className="text-[13.5px] font-medium">Target range low<input type="number" className={inp} value={v.target_min} onChange={(e) => setV({ ...v, target_min: e.target.value })} /></label>
          <label className="text-[13.5px] font-medium">Target range high<input type="number" className={inp} value={v.target_max} onChange={(e) => setV({ ...v, target_max: e.target.value })} /></label>
        </div>
        <button onClick={save} className="mt-5 rounded-full bg-primary px-6 py-2.5 text-[14px] font-semibold text-primary-foreground hover-elevate">Save settings</button>
      </Card>
      <Card title="Population benchmarks and engagement targets" evidence="assumption" note="Working baseline carried from the earlier representation analysis. Replace with current ACS B02023 / B02025 estimates and margins of error before reporting.">
        <table className="w-full text-[13px]"><thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="py-2 font-medium">Group</th><th className="py-2 font-medium">Population share</th><th className="py-2 font-medium">Oversample</th><th className="py-2 font-medium">Engagement target</th><th className="py-2 font-medium">Status</th></tr></thead>
          <tbody>{(meta.benchmarks || []).map((b: any) => { const t = meta.targets?.find?.((x: any) => x.bd_code === b.bd_code); return <tr key={b.bd_code} className="border-b border-border/60"><td className="py-2">{BD_GROUPS.find((g) => g.code === b.bd_code)?.name}</td><td className="py-2 tnum">{b.pct}%</td><td className="py-2 tnum">{b.oversample}</td><td className="py-2 tnum">{t ? `${fmt(t.target ?? t.pct, 1)}%` : "—"}</td><td className="py-2 text-[12px] text-muted-foreground">{b.status}</td></tr>; })}</tbody></table>
      </Card>
    </div>
  );
}

function Exports() {
  const s = useSession(); const { toast } = useToast();
  const items = [["dataset.xlsx", "Analysis dataset", "One row per response, with self-ID and derived groups in separate columns"], ["dataset.csv", "Analysis dataset (CSV)", ""], ["complete.xlsx", "Complete workbook", "Every table, with IDs"], ["dictionary.xlsx", "Data dictionary", "Every variable, question text and code"], ["representation.xlsx", "Representation report", "Population estimate, target and participation"], ["aggregate.xlsx", "Aggregate findings", "Suppressed tables safe to share"], ["qualitative.xlsx", "Qualitative coding", "Written answers, themes, quote permissions"], ["orgs.xlsx", "Community asset directory", ""], ...(s.role === "admin" ? [["contacts.xlsx", "Follow-up contacts", "Admin only; separate from responses"]] : [])];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k2, t, d]) => <button key={k2} onClick={() => download(`/api/staff/export/${k2}`, `sbd-${k2}`).catch((e) => toast({ title: e.message, variant: "destructive" }))} className="flex items-start gap-3 rounded-2xl border border-card-border bg-card p-4 text-left hover-elevate" data-testid={`export-${k2}`}><FileText className="mt-0.5 h-5 w-5 text-primary" /><span><span className="block text-[14.5px] font-semibold">{t}</span><span className="block text-[12.5px] text-muted-foreground">{d || k2}</span></span></button>)}
    </div>
  );
}


const toB64 = (f: File) => new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1] || ""); fr.onerror = () => rej(new Error("Couldn’t read that file.")); fr.readAsDataURL(f); });
const ST: Record<string, [string, string]> = { ready: ["Ready", "text-primary"], warning: ["Ready with notes", "text-[hsl(var(--gold))]"], imported: ["Imported", "text-primary"], duplicate: ["Already in platform", "text-muted-foreground"], rejected: ["Not imported", "text-destructive"] };

function ImportData({ meta }: { meta: any }) {
  const [file, setFile] = useState<File | null>(null); const [data, setData] = useState(""); const [preview, setPreview] = useState<any>(null); const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState<"" | "preview" | "commit">(""); const [err, setErr] = useState(""); const [channel, setChannel] = useState(""); const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); const qc = useQueryClient(); const { toast } = useToast();
  const batches = useQ<any[]>("/api/staff/import/batches");
  const pick = async (f?: File | null) => {
    if (!f) return; setErr(""); setPreview(null); setResult(null);
    if (!/\.(xlsx|csv)$/i.test(f.name)) return setErr("Upload an Excel (.xlsx) or CSV file.");
    if (f.size > 8 * 1024 * 1024) return setErr("Files must be under 8 MB.");
    setFile(f); setBusy("preview");
    try { const b64 = await toB64(f); setData(b64); setPreview(await api("POST", "/api/staff/import/preview", { fileName: f.name, data: b64, channel })); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  const commit = async () => {
    if (!file) return; setBusy("commit"); setErr("");
    try { const r = await api<any>("POST", "/api/staff/import/commit", { fileName: file.name, data, channel }); setResult(r); setPreview(null); qc.invalidateQueries(); toast({ title: `${r.counts.imported} responses imported`, description: `Batch ${r.batchId}. The dashboard has been updated.` }); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  const reset = () => { setFile(null); setData(""); setPreview(null); setResult(null); setErr(""); if (inputRef.current) inputRef.current.value = ""; };
  const view = result || preview;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[["1", "Download the template", "Every survey question is a column, with the allowed answers listed on a second sheet."], ["2", "Fill it in or paste your data", "Use codes or the answer labels. Separate multiple choices with semicolons."], ["3", "Upload, check, import", "You’ll see every row checked before anything is saved. The dashboard updates instantly."]].map(([n, t, d]) => (
          <div key={n} className="rounded-2xl border border-card-border bg-card p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-semibold text-primary tnum">{n}</span><p className="mt-3 font-semibold">{t}</p><p className="mt-1 text-[13.5px] text-muted-foreground">{d}</p></div>
        ))}
      </div>
      <Card title="Import survey responses" evidence="survey" action={<button onClick={() => download("/api/staff/import/template.xlsx", "survey-import-template.xlsx").catch((e) => toast({ title: e.message, variant: "destructive" }))} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border px-4 text-[13px] font-medium hover-elevate" data-testid="button-template"><FileSpreadsheet className="h-4 w-4" />Download template</button>}
        note="Answers are checked against the survey exactly as online responses are. Anything that doesn’t match an allowed answer is left blank, never guessed. Rows already in the platform are skipped, and every import is logged as a batch with your name.">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-[13px] font-medium">Tag these responses with a collection link <span className="font-normal text-muted-foreground">(optional)</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="mt-1 block min-h-[40px] min-w-[260px] rounded-lg border border-input bg-card px-2.5 text-[13.5px]"><option value="">Use the file’s channel column, or “import”</option>{(meta?.channels || []).map((c: any) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
        </div>
        {!view && (
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={cn("flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors", drag ? "border-primary bg-primary/[.05]" : "border-border")}>
            {busy === "preview" ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
            <p className="mt-3 text-[16px] font-semibold">{busy === "preview" ? `Checking ${file?.name}…` : "Drop an Excel or CSV file here"}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">.xlsx or .csv, up to 8 MB</p>
            <button onClick={() => inputRef.current?.click()} className="mt-5 rounded-full bg-primary px-6 py-2.5 text-[14px] font-semibold text-primary-foreground hover-elevate" data-testid="button-choose-file">Choose file</button>
            <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} data-testid="input-import-file" />
          </div>
        )}
        {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[13.5px] font-medium text-destructive" role="alert">{err}</p>}
        {view && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-3">
              <div className="flex items-center gap-2.5 text-[14px]"><FileSpreadsheet className="h-5 w-5 text-primary" /><b>{view.fileName}</b><span className="text-muted-foreground">· {view.totalRows} rows · {view.columns.matched} of {view.columns.total} columns recognized</span></div>
              <button onClick={reset} className="text-[13px] text-muted-foreground underline">{result ? "Import another file" : "Choose a different file"}</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(result ? [["Imported", view.counts.imported, "text-primary"], ["Already in platform", view.counts.duplicates, ""], ["Not imported", view.counts.rejected, "text-destructive"], ["Rows with notes", view.counts.warnings, ""]] : [["Ready to import", view.counts.ready, "text-primary"], ["Rows with notes", view.counts.warnings, ""], ["Duplicates to skip", view.counts.duplicates, ""], ["Can’t be read", view.counts.rejected, "text-destructive"]]).map(([l, v, c]: any) => (
                <div key={l} className="rounded-xl border border-border p-3"><p className="text-[12px] text-muted-foreground">{l}</p><p className={cn("mt-1 text-[26px] font-semibold tnum", c)}>{fmt(v)}</p></div>))}
            </div>
            {view.columns.ignored.length > 0 && <p className="mt-3 text-[12.5px] text-muted-foreground">Ignored columns (no matching question): {view.columns.ignored.slice(0, 12).join(", ")}{view.columns.ignored.length > 12 ? "…" : ""}</p>}
            <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-border">
              <table className="w-full text-[13px]"><thead className="sticky top-0 bg-card"><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="px-3 py-2 font-medium">Row</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Answers read</th><th className="px-3 py-2 font-medium">{result ? "Response ID / notes" : "Notes"}</th></tr></thead>
                <tbody>{view.rows.map((r: any) => <tr key={r.row} className="border-b border-border/60 align-top"><td className="px-3 py-2 tnum">{r.row}</td><td className={cn("px-3 py-2 font-medium", ST[r.status]?.[1])}>{ST[r.status]?.[0] || r.status}</td><td className="px-3 py-2 tnum">{r.answered}</td><td className="px-3 py-2">{r.responseId && <span className="mr-2 font-mono text-[12px]">{r.responseId}</span>}<span className="text-muted-foreground">{r.messages.join(" · ")}</span></td></tr>)}</tbody></table>
            </div>
            {!result && <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <p className="text-[13px] text-muted-foreground">Nothing has been saved yet.</p>
              <button onClick={commit} disabled={!!busy || !view.counts.ready} className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-primary px-6 text-[14px] font-semibold text-primary-foreground hover-elevate disabled:opacity-50" data-testid="button-commit-import">{busy === "commit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Import {fmt(view.counts.ready)} {view.counts.ready === 1 ? "response" : "responses"}</button>
            </div>}
          </div>
        )}
      </Card>
      <Card title="Import history" note="Each batch keeps the file name, who imported it, and the response IDs it created.">
        {!(batches.data || []).length ? <Empty>No imports yet.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-[13px]"><thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground">{["Batch", "When", "File", "Imported", "Skipped", "Not imported", "By"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{batches.data!.map((b) => <tr key={b.batchId} className="border-b border-border/60"><td className="py-2 pr-3 font-mono text-[12px]">{b.batchId}</td><td className="py-2 pr-3">{new Date(b.at).toLocaleString()}</td><td className="py-2 pr-3">{b.file}</td><td className="py-2 pr-3 tnum">{b.imported}</td><td className="py-2 pr-3 tnum">{b.duplicates}</td><td className="py-2 pr-3 tnum">{b.rejected}</td><td className="py-2 pr-3">{b.by}</td></tr>)}</tbody></table></div>}
      </Card>
    </div>
  );
}

function Team() {
  const { data = [] } = useQ<any[]>("/api/staff/team"); const qc = useQueryClient(); const { toast } = useToast();
  const [v, setV] = useState({ name: "", email: "", org: "", role: "viewer" }); const [errs, setErrs] = useState<any>({}); const [issued, setIssued] = useState<{ name: string; email: string; code: string; role: string } | null>(null);
  const link = `${window.location.origin}${window.location.pathname}#/dashboard`;
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErrs({});
    try { const r = await api<any>("POST", "/api/staff/team", v); setIssued({ name: r.member.name, email: r.member.email, code: r.code, role: r.member.role }); setV({ name: "", email: "", org: "", role: "viewer" }); qc.invalidateQueries({ queryKey: ["/api/staff/team"] }); }
    catch (e: any) { setErrs(e.errors || {}); toast({ title: e.message, variant: "destructive" }); }
  };
  const upd = async (id: string, body: any) => {
    try { const r = await api<any>("PATCH", `/api/staff/team/${id}`, body); if (r.code) setIssued({ name: r.member.name, email: r.member.email, code: r.code, role: r.member.role }); qc.invalidateQueries({ queryKey: ["/api/staff/team"] }); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast({ title: "Copied" }), () => {});
  const inp = "mt-1 block min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-[14px]";
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[["Executive viewer", "Sees the live dashboard and can export data. Can’t change anything."], ["Analyst", "Everything a viewer can do, plus import data, enter paper surveys, review responses and code written answers."], ["Administrator", "Everything, plus team access, follow-up contacts and settings."]].map(([t, d]) => <div key={t} className="rounded-2xl border border-card-border bg-card p-5"><p className="font-semibold">{t}</p><p className="mt-1 text-[13.5px] text-muted-foreground">{d}</p></div>)}
      </div>
      {issued && (
        <div className="rounded-2xl border border-primary/40 bg-primary/[.06] p-5" role="status">
          <p className="font-semibold">Access code for {issued.name} ({ROLE_LABEL[issued.role]})</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">This is the only time the code is shown. Send the dashboard link and the code in separate messages.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => copy(issued.code)} className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 font-mono text-[15px] font-semibold tracking-wider hover-elevate" data-testid="text-issued-code">{issued.code}<Copy className="h-4 w-4" /></button>
            <button onClick={() => copy(link)} className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-[13px] hover-elevate">Copy dashboard link<Copy className="h-4 w-4" /></button>
            <button onClick={() => setIssued(null)} className="rounded-lg px-3 py-2 text-[13px] text-muted-foreground underline">Done</button>
          </div>
        </div>
      )}
      <Card title="Give someone access" note="Each person gets their own code, so every change is attributed and access can be turned off individually.">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_180px_auto] lg:items-end">
          <label className="text-[13px] font-medium">Name<input className={inp} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} data-testid="input-team-name" />{errs.name && <span className="text-[12px] text-destructive">{errs.name}</span>}</label>
          <label className="text-[13px] font-medium">Email<input type="email" className={inp} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} data-testid="input-team-email" />{errs.email && <span className="text-[12px] text-destructive">{errs.email}</span>}</label>
          <label className="text-[13px] font-medium">Organization <span className="font-normal text-muted-foreground">(optional)</span><input className={inp} value={v.org} onChange={(e) => setV({ ...v, org: e.target.value })} /></label>
          <label className="text-[13px] font-medium">Role<select className={inp} value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} data-testid="select-team-role"><option value="viewer">Executive viewer</option><option value="analyst">Analyst</option><option value="admin">Administrator</option></select></label>
          <button className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground hover-elevate" data-testid="button-team-add"><UserPlus className="h-4 w-4" />Create code</button>
        </form>
      </Card>
      <Card title="Team members">
        {!data.length ? <Empty>No personal codes yet. The two shared codes still work.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-[13px]"><thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground">{["ID", "Name", "Email", "Organization", "Role", "Last sign-in", "Status", ""].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.map((m) => <tr key={m.memberId} className={cn("border-b border-border/60", !m.active && "opacity-60")}>
            <td className="py-2 pr-3 font-mono text-[12px]">{m.memberId}</td><td className="py-2 pr-3 font-medium">{m.name}</td><td className="py-2 pr-3">{m.email}</td><td className="py-2 pr-3">{m.org || "—"}</td>
            <td className="py-2 pr-3"><select value={m.role} onChange={(e) => upd(m.memberId, { role: e.target.value })} className="rounded-md border border-input bg-card px-2 py-1 text-[12.5px]" aria-label={`Role for ${m.name}`}><option value="viewer">Executive viewer</option><option value="analyst">Analyst</option><option value="admin">Administrator</option></select></td>
            <td className="py-2 pr-3">{m.lastLogin ? new Date(m.lastLogin).toLocaleString() : "Never"}</td><td className="py-2 pr-3">{m.active ? "Active" : "Turned off"}</td>
            <td className="py-2 text-right whitespace-nowrap"><button onClick={() => upd(m.memberId, { resetCode: true })} className="rounded-lg px-2 py-1 text-primary hover:bg-secondary">New code</button><button onClick={() => upd(m.memberId, { active: !m.active })} className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-secondary">{m.active ? "Turn off" : "Turn on"}</button></td>
          </tr>)}</tbody></table></div>}
      </Card>
    </div>
  );
}

function useLive(enabled: boolean) {
  const qc = useQueryClient(); const { toast } = useToast(); const last = useRef<number | null>(null); const [at, setAt] = useState<Date>(new Date());
  const { data } = useQuery<{ version: number }>({ queryKey: ["/api/staff/version"], queryFn: getQueryFn({ on401: "throw" }), enabled, refetchInterval: 8000, refetchIntervalInBackground: false });
  useEffect(() => {
    if (!data) return;
    if (last.current != null && data.version !== last.current) { qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "/api/staff/version" }); toast({ title: "New data received", description: "The dashboard has been refreshed." }); }
    last.current = data.version; setAt(new Date());
  }, [data?.version]);
  return at;
}

export default function Staff() {
  const s = useSession(); const params = useParams<{ page?: string }>(); const page = params.page || "overview";
  const [f, setF] = useState<any>({}); const [, nav] = useLocation();
  const meta = useQ("/api/staff/meta", !!s.role);
  const { toast } = useToast(); const qc = useQueryClient();
  const liveAt = useLive(!!s.role);
  if (!s.role) return <Gate />;
  const can = (min: Min) => allowed(s.role, min);
  const isChapter = page === "overview" || CHAPTERS.some((c) => c.id === page);
  const title = isChapter ? "Community evidence" : OPS.find((o) => o.id === page)?.t || "";
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] lg:flex">
        <div className="[&_*]:!text-[hsl(var(--sidebar-foreground))]"><Wordmark small /></div>
        <p className="mt-7 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">The story</p>
        <nav className="mt-2 space-y-0.5">
          {CHAPTERS.map((c) => <Link key={c.id} href={`/staff/${c.id}`} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px]", page === c.id ? "bg-white/10 font-semibold" : "opacity-80 hover:bg-white/5")}><span className="w-5 text-[11px] tnum text-[hsl(var(--sidebar-primary))]">{c.n}</span>{c.t}</Link>)}
        </nav>
        <p className="mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">Operations</p>
        <nav className="mt-2 space-y-0.5">
          {OPS.filter((o) => can(o.min)).map((o) => <Link key={o.id} href={`/staff/${o.id}`} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px]", page === o.id ? "bg-white/10 font-semibold" : "opacity-80 hover:bg-white/5")}><o.i className="h-4 w-4" />{o.t}</Link>)}
        </nav>
        <div className="mt-auto space-y-1 pt-6 text-[12.5px]">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-80 hover:bg-white/5"><BookOpen className="h-4 w-4" />Public site</Link>
          <button onClick={() => setSession("", "", "")} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 opacity-80 hover:bg-white/5"><LogOut className="h-4 w-4" /><span className="text-left">Sign out<span className="block text-[11.5px] opacity-70">{s.name} · {ROLE_LABEL[s.role]}</span></span></button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select className="rounded-lg border border-input bg-card px-2 py-1.5 text-[13px] lg:hidden" value={page} onChange={(e) => nav(`/staff/${e.target.value}`)} aria-label="Section">{[...CHAPTERS.map((c) => [c.id, `${c.n} ${c.t}`]), ...OPS.filter((o) => can(o.min)).map((o) => [o.id, o.t])].map(([k2, l]) => <option key={k2} value={k2}>{l}</option>)}</select>
              <h1 className="hidden text-[15px] font-semibold sm:block">{title}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-primary" title="Checks for new responses every few seconds" data-testid="status-live"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>Live · {liveAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</span>
              {meta.data?.settings && <span className="hidden rounded-full bg-secondary px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground md:inline">Survey {meta.data.settings.survey_status === "open" ? "open" : "closed"}</span>}
            </div>
            <ThemeToggle />
          </div>
          {isChapter && <div className="mt-3"><FilterBar f={f} setF={setF} meta={meta.data} /></div>}
        </header>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {isChapter && <Dashboard chapter={page === "overview" ? undefined : page} f={f} meta={meta.data} />}
          {page === "import" && can("analyst") && <ImportData meta={meta.data} />}
          {page === "team" && can("admin") && <Team />}
          {page === "responses" && can("analyst") && <Responses />}
          {page === "voices" && can("analyst") && <Voices meta={meta.data} />}
          {page === "entry" && can("analyst") && <Card title="Enter a paper survey" note="Entered responses are tagged as staff entry with your name in the audit log."><SurveyForm mode="staff" onStaffSubmit={async (answers) => { const r = await api<{ responseId: string }>("POST", "/api/staff/responses", { answers }); qc.invalidateQueries(); toast({ title: `Saved as ${r.responseId}` }); return r.responseId; }} /></Card>}
          {page === "outreach" && can("analyst") && <Outreach meta={meta.data} />}
          {page === "contacts" && s.role === "admin" && <Contacts />}
          {page === "settings" && s.role === "admin" && <Settings meta={meta.data} />}
          {page === "exports" && <Exports />}
        </div>
      </main>
    </div>
  );
}
