import { Link } from "wouter";
import { ArrowRight, Clock, EyeOff, FileLock2, ListChecks, MessagesSquare, Mic, UserRound, Users, Vote } from "lucide-react";
import { BD_GROUPS } from "@shared/survey";
import { PublicLayout } from "@/components/public-layout";
import { useDraft } from "@/lib/store";

const STAGES = [
  { icon: ListChecks, t: "Survey", d: "Open to everyone who identifies with Seattle’s Black diaspora. You are here." },
  { icon: Users, t: "Focus groups", d: "Small conversations organized around shared experience." },
  { icon: Mic, t: "Listening sessions", d: "Open community gatherings, in person and online." },
  { icon: UserRound, t: "One-on-one conversations", d: "Interviews with people who hold community knowledge." },
  { icon: Vote, t: "Community review", d: "Findings brought back to the community before conclusions are drawn." },
];

export default function Home() {
  const d = useDraft();
  const resume = Object.keys(d.answers).length > 0 && d.step > 0;
  return (
    <PublicLayout>
      {/* hero */}
      <section className="grain relative overflow-hidden border-b border-border/70">
        <div className="weave pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:pb-20">
          <div>
            <p className="eyebrow" style={{ color: "hsl(var(--terra))" }}>Seattle Department of Neighborhoods · Seattle City Council</p>
            <h1 className="mt-4 font-display text-[42px] leading-[1.02] sm:text-[60px] lg:text-[68px]">
              One community<br />is many <span className="italic" style={{ color: "hsl(var(--primary))" }}>communities</span>.
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-muted-foreground">
              Help the City understand the identities, experiences, priorities, strengths and hopes of Seattle’s Black diasporic communities, and whether a City of Seattle Black Diasporic Council could meet a real need.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/survey" className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-primary px-7 text-[16.5px] font-semibold text-primary-foreground hover-elevate" data-testid="button-start">
                {resume ? "Continue the survey" : "Take the survey"} <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <span className="inline-flex items-center gap-2 text-[14px] text-muted-foreground"><Clock className="h-4 w-4" /> 10–15 minutes · every question optional</span>
            </div>
          </div>
          {/* identity mosaic */}
          <div className="grid grid-cols-2 gap-2.5" aria-label="The six analytical groups used to check that many voices are heard">
            {BD_GROUPS.map((g, i) => (
              <div key={g.code} className="rounded-xl border border-card-border bg-card/85 p-3.5 backdrop-blur-sm" style={{ borderTop: `3px solid hsl(var(--${["primary", "terra", "gold", "chart-4", "chart-5", "chart-6"][i]}))` }}>
                <p className="text-[14px] font-semibold leading-snug">{g.name}</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{g.desc}</p>
              </div>
            ))}
            <p className="col-span-2 mt-1 text-[12px] leading-snug text-muted-foreground">These groupings help the team check whose voices are and aren’t being heard. You always describe yourself in your own words, and you can select more than one identity.</p>
          </div>
        </div>
      </section>

      {/* why */}
      <section id="why" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Why this matters</p>
            <h2 className="mt-3 font-display text-[32px] leading-tight sm:text-[40px]">An open question, not a foregone conclusion.</h2>
          </div>
          <div className="space-y-5 text-[17px] leading-relaxed text-muted-foreground">
            <p><span className="font-medium text-foreground">The process does not begin by assuming that a Black Diasporic Council is the answer.</span> It asks who makes up Seattle’s Black diaspora, what community structures already exist, where the gaps are, and whether a new structure could meaningfully address them.</p>
            <p>It will also look at the potential purpose, structure and function of such a body, and how it might differ from the councils, commissions and advisory bodies that already exist.</p>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {[["Who we are", "Identity in your own words, never reduced to one box."], ["Where we connect", "The places, groups and networks already doing the work."], ["What we need", "Priorities, barriers, and how well the City is reaching people."]].map(([t, x]) => (
                <div key={t} className="rounded-xl border border-card-border bg-card p-4">
                  <p className="text-[15px] font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-[14px] leading-snug">{x}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* process */}
      <section className="border-y border-border/70 bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The broader process</p>
              <h2 className="mt-3 max-w-xl font-display text-[30px] leading-tight sm:text-[36px]">This survey is one part of a larger conversation.</h2>
            </div>
            <Link href="/methods" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-primary hover:underline">How we analyze the data <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STAGES.map((s, i) => (
              <li key={s.t} className="relative rounded-xl border border-card-border bg-background p-4">
                <div className="flex items-center justify-between"><s.icon className="h-5 w-5 text-primary" /><span className="text-[12px] font-semibold tnum text-muted-foreground">0{i + 1}</span></div>
                <p className="mt-4 text-[15.5px] font-semibold">{s.t}</p>
                <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{s.d}</p>
                {i === 0 && <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-foreground">Now</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* privacy */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { i: EyeOff, t: "No names with your answers", d: "The survey doesn’t ask for your name, email or phone. If you want to join a listening session, that’s a separate form stored apart." },
            { i: FileLock2, t: "Only groups, never individuals", d: "Results are reported in groups. Any group smaller than the privacy threshold is hidden, including on the project team’s own dashboard." },
            { i: MessagesSquare, t: "Your words stay yours", d: "How you describe your heritage is kept exactly as written. Analysts add groupings alongside it; they never replace it." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-card-border bg-card p-6">
              <x.i className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-[17px] font-semibold">{x.t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[14px] text-muted-foreground">Read the full <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">privacy statement</Link>.</p>
      </section>

      {/* final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-[hsl(var(--sidebar))] px-6 py-10 text-[hsl(var(--sidebar-foreground))] sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-[30px] leading-tight sm:text-[36px]">Your experience is evidence.</h2>
            <p className="mt-2 max-w-lg text-[15.5px] leading-relaxed opacity-80">Move back and forth between sections without losing your answers. Skip anything you’d rather not answer.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/survey" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[hsl(var(--sidebar-primary))] px-6 text-[15.5px] font-semibold text-[hsl(var(--sidebar-primary-foreground))] hover-elevate">{resume ? "Continue the survey" : "Start the survey"} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/involved" className="inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-6 text-[15.5px] font-medium hover-elevate">Join a listening session</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
