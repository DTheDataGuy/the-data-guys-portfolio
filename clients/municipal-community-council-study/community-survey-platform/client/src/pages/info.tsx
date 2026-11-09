import { Link } from "wouter";
import { ArrowRight, ExternalLink } from "lucide-react";
import { BD_GROUPS, DEFAULT_CODEBOOK } from "@shared/survey";
import { DEFAULT_SOURCES } from "@shared/defaults";
import { PublicLayout, PageHero } from "@/components/public-layout";

const TONES = ["primary", "terra", "gold", "chart-4", "chart-5", "chart-6"];

export function Diaspora() {
  return (
    <PublicLayout>
      <PageHero eyebrow="About the Black diaspora" title={<>Not one story.<br />Many, told together.</>}>
        Seattle’s Black residents include families here for generations, people who arrived last year, and everyone in between: descendants of people enslaved in the United States, East, West and Central African immigrants and refugees, Caribbean and Afro-Latino communities, and people of mixed heritage.
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="prose-civic text-[16.5px] text-muted-foreground">
            <h2 className="!mt-0 text-foreground">Why the survey asks in detail</h2>
            <p>Government data often reports “Black or African American” as a single group. That category combines communities with very different histories, languages, faiths, migration paths and relationships to Seattle.</p>
            <p>When they are combined, the needs of smaller communities can disappear inside an average. This survey lets you select every identity that fits, and then describe your heritage in your own words.</p>
            <h2 className="text-foreground">What the groupings are for</h2>
            <p>The project team uses six broad analytical groups to check that outreach is reaching the whole community, and to compare results where enough people have answered. They are a research tool, not a definition of anyone.</p>
            <p>A person can belong to more than one group. Your own description is always kept exactly as you wrote it.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BD_GROUPS.map((g, i) => (
              <article key={g.code} className="rounded-2xl border border-card-border bg-card p-5" style={{ borderLeft: `4px solid hsl(var(--${TONES[i]}))` }}>
                <p className="text-[11.5px] font-semibold tracking-wider text-muted-foreground tnum">{g.code}</p>
                <h3 className="mt-1 font-display text-[21px] leading-tight">{g.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{g.desc}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-14 rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <p className="eyebrow">A note on numbers</p>
          <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-muted-foreground">
            Census estimates for these communities come from samples and carry margins of error. The City of Seattle’s <a className="text-primary underline underline-offset-2" href={DEFAULT_SOURCES[0].url} target="_blank" rel="noreferrer">Office of Planning &amp; Community Development</a> reports 6.7% of Seattle residents as Black or African American alone in the 2024 American Community Survey. Counting people who are Black in combination with another race gives a larger number. Neither is an exact count, and neither shows the diaspora’s internal diversity on its own.
          </p>
          <Link href="/methods" className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary hover:underline">How the data are analyzed <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </PublicLayout>
  );
}

const METHODS: { id: string; t: string; body: React.ReactNode }[] = [
  { id: "disaggregate", t: "Why Black diaspora data are disaggregated", body: <><p>A single “Black” category can hide real differences in experience, access and need. Looking at results by diaspora group, age, area of the city and time in Seattle shows where experiences are shared and where they diverge.</p><p>A group with fewer survey responses does not have less importance. A priority chosen by fewer people does not automatically deserve less attention.</p></> },
  { id: "sources", t: "Which Census and ACS sources are used", body: <><p>Population context comes from the U.S. Census Bureau’s American Community Survey (ACS) and the City of Seattle’s published summaries. Every source, its vintage and how it is used is recorded in the project’s source register.</p><ul>{DEFAULT_SOURCES.filter((s) => s.url).map((s) => <li key={s.id}><a className="text-primary underline underline-offset-2" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> <span className="text-muted-foreground">({s.publisher}, {s.vintage})</span></li>)}</ul><p>ACS figures are estimates with margins of error. They are shown as estimates, never as exact counts.</p></> },
  { id: "limits", t: "Why government categories have limitations", body: <><p>Census race categories were not designed to capture diaspora identity. Some people who are Black report more than one race; some African and Caribbean residents are counted by ancestry or place of birth rather than race; some Afro-Latino residents may be counted primarily by Hispanic origin. Detailed tables for small groups have wide margins of error.</p><p>That is why the survey asks people directly, in their own terms, rather than relying on government categories alone.</p></> },
  { id: "self-id", t: "How self-identification is preserved", body: <><p>Your selections and your own words are stored exactly as submitted and are never overwritten. The analytical group (for example “East African”) is a separate, derived field suggested by documented rules and reviewed by an analyst. When a description can’t be placed confidently, it is flagged for human review rather than guessed.</p><p>Anyone can belong to more than one group, and multiple identities are counted in each.</p></> },
  { id: "targets", t: "How representation targets work", body: <><p>The team tracks three numbers separately, and they are always labeled:</p><ul><li><b>Population estimate</b>: each group’s approximate share of Seattle’s Black population, from Census-based sources.</li><li><b>Engagement target</b>: the share of survey responses the team aims to hear from each group.</li><li><b>Actual survey participation</b>: who has actually responded so far.</li></ul><p>Comparing them during fieldwork shows where outreach needs to grow while there is still time to act. Targets are set by the project team and can be revised as better data become available.</p></> },
  { id: "oversample", t: "Why oversampling may be used", body: <><p>For smaller communities, a strictly proportional sample can produce too few responses to say anything with confidence, or to protect privacy while reporting. Engagement targets can therefore aim to hear from some groups at a higher share than their population estimate.</p><p>Being above a population share is not a problem in itself. It can be a deliberate choice to make sure smaller communities are heard clearly.</p></> },
  { id: "qual", t: "How open-ended responses are coded", body: <><p>Written answers are kept word for word. Analysts read them and apply themes from a codebook that starts with topics such as {DEFAULT_CODEBOOK.slice(0, 6).map((c) => c.name.toLowerCase()).join(", ")} and grows as new themes emerge from what people actually say.</p><p>Automated keyword matching may suggest a theme, but a suggestion is never counted until an analyst approves it. Quotes are shared only when an analyst marks them safe for an aggregate report, and never if they could identify someone.</p></> },
  { id: "privacy", t: "How privacy is protected", body: <><p>The survey does not collect names or contact details. People who want to join a focus group use a separate form, stored apart, with no link back to their survey answers.</p><p>Results are shown only for groups. Any count smaller than the privacy threshold (currently fewer than 5) is hidden, and combinations of filters that would narrow to a few people are suppressed. Staff access requires an access code, and every change is logged. See the <Link href="/privacy" className="text-primary underline underline-offset-2">privacy statement</Link>.</p></> },
  { id: "sample", t: "Why survey findings are not a probability sample", body: <><p>People choose to take this survey, and it is shared through community networks. That means results describe the people who responded, not every Black resident of Seattle. Reaching a particular number of responses does not by itself make the results statistically representative.</p><p>Findings are therefore written as “Among survey respondents…” or “Among respondents identifying as…”, never as “The Black community believes…”.</p></> },
  { id: "validation", t: "How community validation informs conclusions", body: <><p>Survey results are one source of evidence. They are considered alongside focus groups, listening sessions, one-on-one conversations, population data, history, and what existing organizations and City bodies already do.</p><p>Draft findings are brought back to the community for review before conclusions are drawn. The analysis does not assume any particular outcome, whether that is strengthening existing bodies, a coordinated network, an advisory council, a formal commission, or something else.</p></> },
];

export function Methods() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Research transparency" title="How we analyze the data">
        Plain-language answers to the questions people ask most about how survey responses become findings.
      </PageHero>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr]">
        <nav className="hidden lg:block" aria-label="On this page">
          <ol className="sticky top-24 space-y-1 text-[13.5px]">
            {METHODS.map((m, i) => <li key={m.id}><a href={`#m-${m.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`m-${m.id}`)?.scrollIntoView({ behavior: "smooth" }); }} className="flex gap-2 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><span className="tnum">{String(i + 1).padStart(2, "0")}</span><span>{m.t}</span></a></li>)}
          </ol>
        </nav>
        <div className="space-y-4">
          {METHODS.map((m, i) => (
            <section key={m.id} id={`m-${m.id}`} className="scroll-mt-24 rounded-2xl border border-card-border bg-card p-6 sm:p-7">
              <p className="text-[12px] font-semibold tnum" style={{ color: "hsl(var(--terra))" }}>{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-1 font-display text-[24px] leading-tight">{m.t}</h2>
              <div className="prose-civic mt-2 text-[15.5px] text-muted-foreground [&_b]:text-foreground">{m.body}</div>
            </section>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

export function Privacy() {
  const items: [string, string][] = [
    ["What the survey collects", "Your answers to the survey questions, the date you submitted, and which collection link you used (for example, a community partner’s link). It does not ask for your name, email, phone number, or street address. ZIP code is optional."],
    ["What it doesn’t collect", "The survey record does not store your name, contact details or IP address. A short-lived, random session number is used only to measure how many people start and finish the survey; it contains nothing about you."],
    ["Follow-up contact is separate", "If you want to join a focus group, listening session or receive updates, you use a separate form. Those details are stored in a different place from survey answers, and there is no identifier that connects the two."],
    ["How results are shared", "Only in groups. Any count smaller than the privacy threshold (currently fewer than 5) is hidden. Combinations that could identify someone, such as a rare heritage within one ZIP code and age group, are not shown. Individual answers are never published."],
    ["Your words", "Written answers may be read by the project team for themes. A quote is only used in a report if an analyst marks it safe for aggregate reporting, and never if it could identify you or someone else."],
    ["Who can see the data", "Only the project team, using role-based access codes. Contact details are visible to administrators only. Every change to data or settings is recorded in an audit log. Data are sent over an encrypted (HTTPS) connection."],
    ["While you take it", "Your in-progress answers are held in this browser tab only, so you can move back and forth between sections. Nothing is stored on your device, and closing the tab clears them."],
    ["Retention and questions", "Data are kept only as long as needed for this engagement process, under the retention schedule set by the project team. You can ask the project team to remove your follow-up contact details at any time."],
  ];
  return (
    <PublicLayout>
      <PageHero eyebrow="Privacy statement" title="Your answers, protected by design">Participation is voluntary, and every question is optional.</PageHero>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {items.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-card-border bg-card p-6">
              <dt className="text-[16.5px] font-semibold">{t}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{d}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/survey" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover-elevate">Take the survey <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/methods" className="inline-flex min-h-[48px] items-center gap-1.5 rounded-full border border-border px-6 font-medium hover-elevate">How we analyze the data <ExternalLink className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </PublicLayout>
  );
}
