import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { IDENTITY_OPTS } from "@shared/survey";
import { PublicLayout, PageHero } from "@/components/public-layout";
import { api, ApiError, getQueryFn } from "@/lib/queryClient";
import { Story } from "@/components/story";
import { cn } from "@/lib/utils";

const INTERESTS = [["focus_group", "Focus group"], ["listening_session", "Listening session"], ["interview", "One-on-one conversation"], ["community_review", "Reviewing draft findings"], ["updates", "Project updates"]];
const AVAIL = [["weekday_day", "Weekday daytime"], ["weekday_evening", "Weekday evening"], ["weekend", "Weekend"], ["virtual", "Virtual"], ["in_person", "In person"]];

function Chips({ opts, value, onChange, name }: { opts: string[][]; value: string[]; onChange: (v: string[]) => void; name: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {opts.map(([k, l]) => { const on = value.includes(k); return (
        <button type="button" key={k} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
          className={cn("min-h-[44px] rounded-full border px-4 text-[14.5px] transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50")} data-testid={`chip-${k}`}>{l}</button>
      ); })}
    </div>
  );
}

export function Involved() {
  const [f, setF] = useState<any>({ name: "", email: "", phone: "", method: "email", interests: [], availability: [], language: "", identity: [], neighborhood: "", accessibility: "", consent: false, website: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!f.name.trim()) x.name = "Please tell us what to call you.";
    if (!f.email.trim() && !f.phone.trim()) x.email = "Add an email or phone number so the team can reach you.";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) x.email = "Check the email address.";
    if (!f.interests.length) x.interests = "Choose at least one way to be involved.";
    if (!f.consent) x.consent = "Please confirm so the team may contact you.";
    setErr(x); if (Object.keys(x).length) return;
    setBusy(true);
    try { await api("POST", "/api/public/contact", f); setDone(true); window.scrollTo({ top: 0 }); }
    catch (e: any) { setErr(e instanceof ApiError && e.errors ? e.errors : { form: e.message }); }
    finally { setBusy(false); }
  };
  const field = "mt-1.5 block w-full min-h-[48px] rounded-xl border border-input bg-card px-4 text-[16px] focus:border-primary";
  return (
    <PublicLayout>
      <PageHero eyebrow="Get involved" title="Stay involved beyond the survey">
        Join a focus group or listening session, or get updates as the work moves forward. This form is stored separately from survey answers and is never linked to them.
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {done ? (
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-[28px]">Thank you. You’re on the list.</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">The project team will reach out using your preferred method as sessions are scheduled.</p>
            <Link href="/survey" className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover-elevate">Take the survey too <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-6 rounded-2xl border border-card-border bg-card p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-[14.5px] font-medium">What should we call you?<input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" data-testid="input-name" /></label>
              <label className="block text-[14.5px] font-medium">Email<input type="email" className={field} value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={!!err.email} data-testid="input-email" /></label>
              <label className="block text-[14.5px] font-medium">Phone<input type="tel" className={field} value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" data-testid="input-phone" /></label>
              <label className="block text-[14.5px] font-medium">Preferred contact method
                <select className={field} value={f.method} onChange={(e) => set("method", e.target.value)}><option value="email">Email</option><option value="phone">Phone call</option><option value="text">Text message</option></select>
              </label>
            </div>
            {err.name && <p className="text-[13.5px] font-medium text-destructive">{err.name}</p>}
            {err.email && <p className="text-[13.5px] font-medium text-destructive">{err.email}</p>}
            <fieldset><legend className="mb-2 text-[14.5px] font-medium">I’m interested in</legend><Chips name="Interests" opts={INTERESTS} value={f.interests} onChange={(v) => set("interests", v)} />{err.interests && <p className="mt-2 text-[13.5px] font-medium text-destructive">{err.interests}</p>}</fieldset>
            <fieldset><legend className="mb-2 text-[14.5px] font-medium">Availability <span className="font-normal text-muted-foreground">(optional)</span></legend><Chips name="Availability" opts={AVAIL} value={f.availability} onChange={(v) => set("availability", v)} /></fieldset>
            <fieldset><legend className="mb-2 text-[14.5px] font-medium">Community identity <span className="font-normal text-muted-foreground">(optional; helps plan sessions)</span></legend><Chips name="Identity" opts={IDENTITY_OPTS.filter((o) => o.code !== "pns" && !o.other).map((o) => [o.code, o.label])} value={f.identity} onChange={(v) => set("identity", v)} /></fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-[14.5px] font-medium">Preferred language <span className="font-normal text-muted-foreground">(optional)</span><input className={field} value={f.language} onChange={(e) => set("language", e.target.value)} /></label>
              <label className="block text-[14.5px] font-medium">Neighborhood <span className="font-normal text-muted-foreground">(optional)</span><input className={field} value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></label>
            </div>
            <label className="block text-[14.5px] font-medium">Accessibility or interpretation needs <span className="font-normal text-muted-foreground">(optional)</span><textarea rows={3} className={field + " py-3"} value={f.accessibility} onChange={(e) => set("accessibility", e.target.value)} /></label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} aria-hidden />
            <label className="flex items-start gap-3 rounded-xl bg-secondary/60 p-4 text-[14.5px]">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[hsl(var(--primary))]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} data-testid="check-consent" />
              <span>I agree that the project team may contact me about this engagement. I understand this is separate from my survey answers and I can ask to be removed at any time.</span>
            </label>
            {err.consent && <p className="text-[13.5px] font-medium text-destructive">{err.consent}</p>}
            {err.form && <p className="text-[13.5px] font-medium text-destructive">{err.form}</p>}
            <button type="submit" disabled={busy} className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-primary px-7 text-[16px] font-semibold text-primary-foreground hover-elevate disabled:opacity-60" data-testid="button-contact-submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign me up</button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}

export function Findings() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/public/findings"], queryFn: getQueryFn({ on401: "throw" }) });
  return (
    <PublicLayout>
      <PageHero eyebrow="Community findings" title="What we’re hearing">
        Aggregate results from survey respondents. These describe the people who responded, not every Black resident of Seattle, and they are one input alongside focus groups, listening sessions and community review.
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-secondary" /> : !data?.published ? (
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center sm:p-12">
            <h2 className="font-display text-[28px]">Findings will be shared here after community review.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">While the survey is open, results stay with the project team. Draft findings will be brought back to the community before anything is published.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/survey" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover-elevate">Take the survey <ArrowRight className="h-4 w-4" /></Link><Link href="/involved" className="inline-flex min-h-[48px] items-center rounded-full border border-border px-6 font-medium hover-elevate">Join a listening session</Link></div>
          </div>
        ) : <Story b={data} publicView quotes={data.quotes} />}
      </div>
    </PublicLayout>
  );
}
