import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, Clock, Lock, Pencil, RotateCcw, Save, Users } from "lucide-react";
import { QUESTIONS, SECTIONS, Q, type Question } from "@shared/survey";
import { QuestionBlock } from "@/components/survey-inputs";
import { PublicLayout } from "@/components/public-layout";
import { useDraft, updateDraft, setAnswer, clearDraft, channelFromUrl, getDraft } from "@/lib/store";
import { API_BASE, api, ApiError } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const STEPS = SECTIONS; // 6 sections + review
const bySection = (id: string) => QUESTIONS.filter((q) => q.section === id);
const NUM: Record<string, string> = {};
{ let i = 1; for (const s of STEPS) for (const q of bySection(s.id)) NUM[q.id] = String(i++); }
export const QUESTION_NUMBER = NUM;

const answered = (q: Question, v: any) => {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return q.type === "assets" ? v.some((x: any) => x?.name?.trim()) : v.some((x: any) => (typeof x === "string" ? x.trim() : x));
  return true;
};

function localErrors(ans: Record<string, any>, ids: string[]) {
  const e: Record<string, string> = {};
  for (const id of ids) {
    const q = Q[id]; const v = ans[id];
    if (q.type === "zip" && v && !/^\d{5}$/.test(v)) e[id] = "Enter a five-digit ZIP code, or leave it blank.";
    if (q.max && Array.isArray(v) && v.length > q.max) e[id] = `Choose up to ${q.max}.`;
  }
  return e;
}

function summary(q: Question, v: any, ans: Record<string, any>): string {
  if (!answered(q, v)) return "";
  const lab = (c: string) => q.options?.find((o) => o.code === c)?.label || c;
  const fu = (q.followups || []).map((f) => ans[f.id]).filter(Boolean);
  let s = "";
  switch (q.type) {
    case "single": case "likert": case "scale5": s = q.type === "scale5" && v !== "na" ? `${v} of 5${q.scaleLabels?.[Number(v) - 1] && !/^\d$/.test(q.scaleLabels[Number(v) - 1]) ? ` · ${q.scaleLabels[Number(v) - 1]}` : ""}` : lab(v); break;
    case "multi": s = v.map(lab).join(", "); break;
    case "rank": case "pick_rank": s = v.map((c: string, i: number) => `${i + 1}. ${lab(c)}`).join("   "); break;
    case "text3": s = v.filter((x: string) => x?.trim()).join(" · "); break;
    case "assets": s = v.filter((x: any) => x?.name?.trim()).map((x: any) => x.name + (x.type ? ` (${x.type})` : "")).join(" · "); break;
    default: s = String(v);
  }
  return fu.length ? `${s} — ${fu.join("; ")}` : s;
}

type Mode = "public" | "staff";
export function SurveyForm({ mode = "public", onStaffSubmit }: { mode?: Mode; onStaffSubmit?: (answers: any) => Promise<string> }) {
  const d = useDraft();
  const [staffAns, setStaffAns] = useState<Record<string, any>>({});
  const [staffStep, setStaffStep] = useState(0);
  const ans = mode === "staff" ? staffAns : d.answers;
  const step = mode === "staff" ? staffStep : d.step;
  const setStep = (n: number) => { if (mode === "staff") setStaffStep(n); else updateDraft((x) => ({ step: n, maxStep: Math.max(x.maxStep, n) })); window.scrollTo({ top: 0, behavior: "smooth" }); headRef.current?.focus({ preventScroll: true }); };
  const set = (id: string, v: any) => (mode === "staff" ? setStaffAns((a) => ({ ...a, [id]: v })) : setAnswer(id, v));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [honey, setHoney] = useState("");
  const headRef = useRef<HTMLHeadingElement>(null);
  const sec = STEPS[step];
  const qs = bySection(sec.id);
  const totalQ = QUESTIONS.length;
  const doneQ = QUESTIONS.filter((q) => answered(q, ans[q.id])).length;
  const pctDone = Math.round(((step) / (STEPS.length - 1)) * 100);

  // Start an anonymous session (for completion-rate tracking only) and record progress per step.
  useEffect(() => {
    if (mode !== "public") return;
    const ch = channelFromUrl();
    if (ch && ch !== getDraft().channel) updateDraft({ channel: ch });
    if (!getDraft().startedAt) updateDraft({ startedAt: Date.now() });
    if (!getDraft().token) api<any>("POST", "/api/public/session", { channel: ch || getDraft().channel }).then((j) => updateDraft({ token: j.token })).catch(() => {});
  }, [mode]);
  useEffect(() => {
    if (mode !== "public" || !d.token) return;
    fetch(`${API_BASE}/api/public/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: d.token, step }) }).catch(() => {});
  }, [step, d.token, mode]);

  const next = () => {
    const e = localErrors(ans, qs.map((q) => q.id));
    setErrors(e);
    if (Object.keys(e).length) { document.querySelector(`[data-testid="q-${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setStep(Math.min(step + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const e = localErrors(ans, QUESTIONS.map((q) => q.id));
    setErrors(e); setFormError("");
    if (Object.keys(e).length) { setFormError("A few answers need attention. They are marked below."); return; }
    if (mode === "public" && doneQ < 5) { setFormError(`Please answer at least 5 questions before submitting. You’ve answered ${doneQ} so far.`); return; }
    setBusy(true);
    try {
      if (mode === "staff") { const id = await onStaffSubmit!(ans); setDone(id); setStaffAns({}); setStaffStep(0); }
      else {
        // Make sure this person has a session token before sending, so any retry is recognized as the same submission.
        let token = getDraft().token;
        if (!token) {
          try { token = (await api<any>("POST", "/api/public/session", { channel: d.channel })).token; updateDraft({ token }); }
          catch { throw new Error("We can’t reach the server right now, so your answers have not been sent yet. They are still here. Check your connection and press Submit again."); }
        }
        const payload = { answers: ans, token, channel: d.channel, startedAt: d.startedAt, website: honey };
        // Retry automatically with the SAME token if the connection drops; the server returns the original receipt instead of saving twice.
        let lastErr: any = null; let sent = false;
        for (let attempt = 0; attempt < 4 && !sent; attempt++) {
          if (attempt) await new Promise((r) => setTimeout(r, [0, 1500, 3500, 7000][attempt]));
          try { await api("POST", "/api/public/submit", payload); sent = true; }
          catch (e: any) {
            lastErr = e;
            const transient = e instanceof ApiError && (e.status === 0 || e.status === 502 || e.status === 503 || e.status === 504);
            if (!transient) throw e;
          }
        }
        if (!sent) throw new ApiError(0, "Your answers may have already been received. The connection dropped before we could confirm it. Please don’t start over: your answers are still here, so press Submit again when you’re back online. It will not be counted twice.", lastErr?.errors);
        const interest = ans.Q32;
        clearDraft();
        setDone(interest || "done");
        window.scrollTo({ top: 0 });
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      setFormError(err?.message || "Something went wrong. Your answers are still here, so you can try again.");
    } finally { setBusy(false); }
  };

  if (done && mode === "public") return <ThankYou interest={done} />;

  return (
    <div className={cn(mode === "public" ? "mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10" : "")}>
      {done && mode === "staff" && <div className="mb-5 rounded-lg border border-primary/30 bg-primary/[.06] px-4 py-3 text-[14px]" role="status">Saved as <b className="tnum">{done}</b>. The form is cleared for the next paper survey.</div>}
      {/* progress */}
      <div className={cn("sticky z-20 -mx-4 mb-6 border-b border-border/70 bg-background/95 px-4 pb-3 pt-3 backdrop-blur sm:mx-0 sm:rounded-b-xl sm:px-0", mode === "public" ? "top-[64px]" : "top-0")}>
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="font-medium"><span className="text-muted-foreground">Step {step + 1} of {STEPS.length} ·</span> {sec.title}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground tnum" aria-live="polite">
            {mode === "public" && d.savedAt ? <><Save className="h-3.5 w-3.5" /> Answers kept as you go</> : `${doneQ} of ${totalQ} answered`}
          </span>
        </div>
        <div className="mt-2.5 flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pctDone} aria-label="Survey progress">
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" onClick={() => (i <= Math.max(mode === "staff" ? 6 : d.maxStep, step) ? setStep(i) : undefined)} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-border", i <= (mode === "staff" ? 6 : d.maxStep) ? "cursor-pointer" : "cursor-default")} aria-label={`Go to ${s.title}`} tabIndex={i <= (mode === "staff" ? 6 : d.maxStep) ? 0 : -1} />
          ))}
        </div>
      </div>

      <header className="mb-8">
        <p className="eyebrow" style={{ color: "hsl(var(--terra))" }}>Section {step + 1}</p>
        <h1 ref={headRef} tabIndex={-1} className="mt-2 font-display text-[30px] leading-tight outline-none sm:text-[38px]">{sec.title}</h1>
        <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted-foreground">{sec.blurb}</p>
        {step === 0 && mode === "public" && (
          <div className="mt-5 grid gap-2 text-[13.5px] text-muted-foreground sm:grid-cols-3">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> About 10–15 minutes</span>
            <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> No name or contact asked</span>
            <span className="flex items-center gap-2"><Save className="h-4 w-4 text-primary" /> Go back anytime without losing answers</span>
          </div>
        )}
      </header>

      {sec.id === "review" ? (
        <Review ans={ans} goTo={setStep} errors={errors} />
      ) : (
        <div className="space-y-5">
          {sec.id === "belonging" && <p className="rounded-lg bg-secondary/60 px-4 py-3 text-[14px] text-muted-foreground">Twelve short statements. Choose the answer closest to how you feel, or “Prefer not to answer.”</p>}
          {qs.map((q) => (
            <div key={q.id} className={cn("rounded-2xl border bg-card p-5 sm:p-6", errors[q.id] ? "border-destructive/60" : "border-card-border")}>
              <QuestionBlock q={q} num={NUM[q.id]} value={ans[q.id]} onChange={(v) => set(q.id, v)} error={errors[q.id]} getFollow={(id) => ans[id]} setFollow={(id, v) => set(id, v)} />
            </div>
          ))}
        </div>
      )}

      {formError && <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-[14px] text-destructive" role="alert">{formError}</p>}
      <input type="text" name="website" value={honey} onChange={(e) => setHoney(e.target.value)} tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-px w-px opacity-0" aria-hidden />

      <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Survey steps">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border bg-card px-5 text-[15px] font-medium hover-elevate" data-testid="button-back"><ArrowLeft className="h-4 w-4" /> Back</button>
        ) : <span />}
        {sec.id === "review" ? (
          <button type="button" onClick={submit} disabled={busy} className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-primary px-7 text-[16px] font-semibold text-primary-foreground hover-elevate disabled:opacity-60" data-testid="button-submit">
            {busy ? "Submitting…" : mode === "staff" ? "Save paper survey" : "Submit my survey"} <Check className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={next} className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-primary px-7 text-[16px] font-semibold text-primary-foreground hover-elevate" data-testid="button-next">
            {step === STEPS.length - 2 ? "Review answers" : `Next: ${STEPS[step + 1].title}`} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </nav>
      {mode === "public" && <p className="mt-6 text-center text-[13px] text-muted-foreground">Every question is optional. Skip anything you prefer not to answer. <Link href="/privacy" className="underline underline-offset-2">Privacy statement</Link></p>}
    </div>
  );
}

function Review({ ans, goTo, errors }: { ans: Record<string, any>; goTo: (n: number) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      {STEPS.slice(0, -1).map((s, i) => {
        const qs = bySection(s.id);
        const n = qs.filter((q) => answered(q, ans[q.id])).length;
        return (
          <section key={s.id} className="rounded-2xl border border-card-border bg-card">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-[16px] font-semibold">{s.title}</h2>
                <p className="text-[12.5px] text-muted-foreground tnum">{n} of {qs.length} answered</p>
              </div>
              <button type="button" onClick={() => goTo(i)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] font-medium text-primary hover-elevate" data-testid={`button-edit-${s.id}`}><Pencil className="h-3.5 w-3.5" /> Edit</button>
            </header>
            <dl className="divide-y divide-border">
              {qs.map((q) => {
                const v = summary(q, ans[q.id], ans);
                return (
                  <div key={q.id} className="grid gap-1 px-5 py-2.5 text-[14px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
                    <dt className="text-muted-foreground"><span className="tnum">{NUM[q.id]}.</span> {q.label}</dt>
                    <dd className={cn(v ? "" : "italic text-muted-foreground/70", errors[q.id] && "text-destructive")}>{errors[q.id] || v || "Skipped"}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function ThankYou({ interest }: { interest: string }) {
  const [copied, setCopied] = useState(false);
  const share = () => { const u = window.location.origin + window.location.pathname + "#/"; navigator.clipboard?.writeText(u).then(() => setCopied(true)).catch(() => {}); };
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-14 sm:px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-7 w-7" strokeWidth={2.5} /></div>
      <h1 className="mt-6 font-display text-[36px] leading-tight sm:text-[44px]">Thank you.</h1>
      <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-muted-foreground">
        <p className="text-foreground">Thank you for taking the time to respond to this survey. Your responses will provide an important contribution to understanding parts of our community that can too often be flattened or generalized.</p>
        <p>This survey is one part of a larger community engagement process.</p>
        <p>If you would like to stay informed or participate in a focus group or listening session, please use the separate follow-up form.</p>
      </div>
      <div className={cn("mt-8 rounded-2xl border p-6", interest === "yes" || interest === "maybe" ? "border-primary/40 bg-primary/[.05]" : "border-card-border bg-card")}>
        <div className="flex items-start gap-4">
          <Users className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-[18px] font-semibold">Stay involved</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">A separate form. Your contact details are stored apart from survey answers and are never connected to the responses you just gave.</p>
            <Link href="/involved" className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover-elevate" data-testid="link-stay-involved">Stay Involved / Join a Listening Session <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-[14px]">
        <button onClick={share} className="rounded-full border border-border px-4 py-2 font-medium hover-elevate" data-testid="button-share">{copied ? "Link copied" : "Copy survey link to share"}</button>
        <Link href="/methods" className="rounded-full border border-border px-4 py-2 font-medium hover-elevate">How we analyze the data</Link>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  const [cfg, setCfg] = useState<any>(null);
  const d = useDraft();
  const [resumeAsked, setResumeAsked] = useState(false);
  useEffect(() => { fetch(`${API_BASE}/api/public/config${channelFromUrl() ? `?c=${encodeURIComponent(channelFromUrl()!)}` : ""}`).then((r) => r.json()).then(setCfg).catch(() => setCfg({ status: "open" })); }, []);
  const hasDraft = useMemo(() => Object.keys(d.answers).length > 0 && d.step > 0, []); // evaluated once on mount
  if (!cfg) return <PublicLayout><div className="mx-auto max-w-3xl px-6 py-24"><div className="h-8 w-64 animate-pulse rounded bg-secondary" /><div className="mt-6 h-40 animate-pulse rounded-2xl bg-secondary" /></div></PublicLayout>;
  if (cfg.status !== "open") return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p className="eyebrow">Survey status</p>
        <h1 className="mt-3 font-display text-[36px]">The survey is not accepting responses right now.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{cfg.closedMessage}</p>
        <Link href="/involved" className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">Stay involved <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </PublicLayout>
  );
  return (
    <PublicLayout>
      {hasDraft && !resumeAsked && (
        <div className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/[.05] px-4 py-3 text-[14px]" role="status">
            <span><b>Welcome back.</b> Your answers are still here. Pick up where you left off.</span>
            <span className="flex gap-2">
              <button className="rounded-full px-3 py-1.5 font-medium text-primary hover-elevate" onClick={() => setResumeAsked(true)} data-testid="button-resume">Continue</button>
              <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover-elevate" onClick={() => { if (confirm("Clear your saved answers and start over?")) { clearDraft(); setResumeAsked(true); } }} data-testid="button-restart"><RotateCcw className="h-3.5 w-3.5" /> Start over</button>
            </span>
          </div>
        </div>
      )}
      <SurveyForm />
    </PublicLayout>
  );
}
