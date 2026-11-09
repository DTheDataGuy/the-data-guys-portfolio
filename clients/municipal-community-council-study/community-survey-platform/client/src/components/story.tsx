import { useState } from "react";
import { BD_GROUPS, GOV_DIMENSIONS, GOV_PATHWAYS, Q } from "@shared/survey";
import { Attain, Bars, Card, distItems, Empty, Evidence, Kpi, Likert, RepBars, Scale5, StatusPill, Suppressed, TileMap, Trend } from "@/components/charts";
import { fmt, dateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export const CHAPTERS = [
  { id: "participation", n: "01", t: "Participation", q: "How many people have we heard from?" },
  { id: "representation", n: "02", t: "Who responded", q: "Are we hearing from the whole community?" },
  { id: "belonging", n: "03", t: "Belonging & connection", q: "Do people feel connected, heard and represented?" },
  { id: "place", n: "04", t: "Where community lives", q: "Which parts of the city are we reaching?" },
  { id: "priorities", n: "05", t: "Priorities & barriers", q: "What matters most, and what gets in the way?" },
  { id: "connections", n: "06", t: "Community connections", q: "Where does community already happen?" },
  { id: "voices", n: "07", t: "Voices", q: "What are people saying in their own words?" },
  { id: "governance", n: "08", t: "Governance evidence", q: "What might a structure need to do well?" },
];

function Chapter({ id, children, lead }: { id: string; children: React.ReactNode; lead?: React.ReactNode }) {
  const c = CHAPTERS.find((x) => x.id === id)!;
  return (
    <section id={`ch-${id}`} className="scroll-mt-24 print-break">
      <div className="mb-5 flex items-end gap-4 border-b border-border pb-4">
        <span className="font-display text-[44px] leading-none tnum" style={{ color: "hsl(var(--terra))" }}>{c.n}</span>
        <div>
          <p className="eyebrow">{c.t}</p>
          <h2 className="mt-1 font-display text-[24px] leading-tight sm:text-[28px]">{c.q}</h2>
        </div>
      </div>
      {lead && <p className="mb-5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{lead}</p>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const q = (id: string) => Q[id]?.label || id;

export function Story({ b, publicView = false, quotes, only }: { b: any; publicView?: boolean; quotes?: { field: string; text: string }[]; only?: string }) {
  const [dim, setDim] = useState<"bd" | "age" | "sector" | "tenure">("bd");
  if (b.suppressed) return <Suppressed k={b.k} what="these filters" />;
  const k = b.k; const K = b.kpis; const R = b.representation;
  const show = (id: string) => !only || only === id;
  const scaleL = (id: string): [string, string] => { const l = Q[id]?.scaleLabels || []; return [l[0] || "Low", l[l.length - 1] || "High"]; };
  const noData = b.n === 0;
  return (
    <div className="space-y-14">
      {show("participation") && (
        <Chapter id="participation" lead={noData ? "The dashboard is live and empty. Every number below is calculated from submitted responses as they arrive; nothing is pre-filled." : `Among ${fmt(b.n)} ${b.filtered ? "responses matching the current filters" : "included responses"}, collected since ${dateLabel(K.firstResponse)}.`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi accent label="Total responses" value={fmt(K.responses)} sub={`Working target ${fmt(K.targetN)} (${b.settings ? `${b.settings.target_min}–${b.settings.target_max}` : "range set by project team"})`} testid="kpi-responses" />
            <Kpi label="Target attainment" value={K.attainment == null ? "—" : `${fmt(K.attainment, 0)}%`} sub={`${K.groupsOnTarget} of 6 groups on or above target`} evidence="process" />
            <Kpi label="ZIP codes reached" value={fmt(K.zips)} sub={`${K.groupsRepresented} of 6 diaspora groups represented`} evidence="survey" />
            <Kpi label="Focus-group interest" value={K.focusInterestPct == null ? "—" : `${fmt(K.focusInterestPct, 0)}%`} sub={`${fmt(K.focusInterest)} said yes or maybe`} evidence="survey" />
            {!publicView && <>
              <Kpi label="Completion rate" value={K.completionRate == null ? "—" : `${fmt(K.completionRate, 0)}%`} sub={`${fmt(K.completed)} completed of ${fmt(K.started)} started`} evidence="process" />
              <Kpi label="Organizations named" value={fmt(K.orgsIdentified)} sub="Distinct names, respondent-mentioned" evidence="mention" />
              <Kpi label="Needs review" value={fmt((K.review || 0) + (K.flagged || 0))} sub={`${K.review || 0} identity · ${K.flagged || 0} quality flags`} evidence="process" />
              <Kpi label="Last response" value={<span className="text-[22px] sm:text-[24px]">{K.lastResponse ? dateLabel(K.lastResponse) : "—"}</span>} sub={`${fmt(K.contacts || 0)} follow-up sign-ups (stored separately)`} />
            </>}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card title="Responses over time" evidence="process"><Trend data={b.trend} /></Card>
            {!publicView && b.funnel ? (
              <Card title="Where people stop" evidence="process" note="Share of started sessions reaching each section. Helps spot a section that is too long or unclear.">
                <Bars unit="" items={["About you", "Identity", "Belonging", "Community", "Priorities", "Follow-up", "Submitted"].map((l, i) => ({ key: l, label: l, value: b.funnel[i] || 0, display: `${fmt(b.funnel[i] || 0)}${b.funnel[0] ? ` · ${fmt(((b.funnel[i] || 0) / b.funnel[0]) * 100, 0)}%` : ""}` }))} max={Math.max(1, b.funnel[0] || 0)} empty="No sessions started yet." />
              </Card>
            ) : (
              <Card title="How to read this" evidence="finding"><p className="text-[14px] leading-relaxed text-muted-foreground">People chose to take this survey. Results describe respondents, not every Black resident of Seattle, and reaching a number of responses does not by itself make them statistically representative.</p></Card>
            )}
          </div>
        </Chapter>
      )}

      {show("representation") && (
        <Chapter id="representation" lead="Three different numbers, never interchangeable: the population estimate (Census-based, with margins of error), the engagement target (set by the project team, may deliberately oversample smaller groups), and actual survey participation. Being above a population share is not a problem; it can be the point.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {R.groups.map((g: any) => (
              <Card key={g.code} eyebrow={g.code} title={g.name} action={<StatusPill s={g.status} />}>
                <RepBars g={g} />
                <div className="mt-4"><Attain v={g.attainment} count={g.count} target={g.targetCount} /></div>
                {!publicView && g.needed > 0 && <p className="mt-2 text-[12.5px] text-muted-foreground">About {fmt(g.needed)} more responses to reach the engagement target.</p>}
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]"><Evidence kind="population" /><Evidence kind="target" /><Evidence kind="survey" /><span className="text-muted-foreground">Respondents with more than one identity count in each group ({fmt(R.multi)} so far). {fmt(R.unclassified)} not yet classified{R.review ? `, ${R.review} awaiting analyst review` : ""}.</span></div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Age" evidence="survey"><Bars items={distItems(b.demo.age, k)} k={k} /></Card>
            <Card title="Time in Seattle" evidence="survey"><Bars items={distItems(b.demo.tenure, k)} k={k} /></Card>
            <Card title="Gender" evidence="survey"><Bars items={distItems(b.demo.gender, k)} k={k} /></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Self-identified heritage (select all)" evidence="survey" note="Respondents’ own selections, shown before any analytical grouping. Percentages add to more than 100% because people can choose several."><Bars items={distItems(b.demo.identity, k)} k={k} /></Card>
            <Card title="Relationship to Seattle" evidence="survey"><Bars items={distItems(b.demo.relationship, k)} k={k} /></Card>
          </div>
          {!publicView && b.floors && (
            <Card title="Priority population floors" evidence="target" note="Floors are minimum shares the project aims to hear from. Where the survey doesn’t ask the question, the floor is tracked through outreach instead. Proxies are labeled.">
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-[13.5px]">
                <thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="py-2 pr-3 font-medium">Group</th><th className="py-2 pr-3 font-medium">Floor</th><th className="py-2 pr-3 font-medium">Survey share</th><th className="py-2 font-medium">Status</th></tr></thead>
                <tbody>{b.floors.map((f: any) => (
                  <tr key={f.key} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3"><p className="font-medium">{f.name}</p>{f.notes && <p className="text-[12px] text-muted-foreground">{f.notes}</p>}</td>
                    <td className="py-2.5 pr-3 tnum">{f.floor_min}%{f.floor_max ? `–${f.floor_max}%` : "+"}</td>
                    <td className="py-2.5 pr-3 tnum">{f.measured ? (f.share == null ? "—" : `${fmt(f.share, 0)}% (${fmt(f.count)})`) : <span className="text-muted-foreground">Not measured</span>}</td>
                    <td className="py-2.5">{!f.measured ? <span className="text-[12px] text-muted-foreground">Track via outreach</span> : f.share == null ? "—" : f.met ? <StatusPill s="On target" /> : <StatusPill s="Underrepresented" />}</td>
                  </tr>))}</tbody>
              </table></div>
            </Card>
          )}
        </Chapter>
      )}

      {show("belonging") && (
        <Chapter id="belonging" lead="Each statement is shown on its own. There is no combined “belonging score”; items measure different things and some are worded negatively.">
          <Card title="Agreement with each statement" evidence="finding"><Likert items={b.likert} k={k} /></Card>
          <DimCompare b={b} dim={dim} setDim={setDim} kind="likert" />
        </Chapter>
      )}

      {show("place") && (
        <Chapter id="place" lead="ZIP code is optional. Tiles with fewer responses than the privacy threshold are hidden.">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <Card title="Responses by Seattle ZIP code" evidence="survey"><TileMap zips={b.geo.zips} k={k} /></Card>
            <div className="space-y-4">
              <Card title="By area of the city" evidence="survey"><Bars items={distItems(b.geo.sectors, k)} k={k} /></Card>
              <Card title="Coverage">
                <dl className="grid grid-cols-3 gap-3 text-center">
                  <div><dt className="text-[12px] text-muted-foreground">Gave a ZIP</dt><dd className="font-display text-[26px] tnum">{fmt(b.geo.withZip)}</dd></div>
                  <div><dt className="text-[12px] text-muted-foreground">Seattle ZIPs</dt><dd className="font-display text-[26px] tnum">{fmt(b.geo.zipCount)}</dd></div>
                  <div><dt className="text-[12px] text-muted-foreground">Outside Seattle</dt><dd className="font-display text-[26px] tnum">{fmt(b.geo.outside)}</dd></div>
                </dl>
              </Card>
            </div>
          </div>
        </Chapter>
      )}

      {show("priorities") && (
        <Chapter id="priorities" lead="Respondents ranked their top issues. A lower share does not mean a priority matters less, especially for smaller communities.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Most important issues" evidence="finding" note="Priority score weights rank 1 = 5 points down to rank 5 = 1 point. Bar shows share of respondents who ranked the issue at all.">
              <Bars items={(b.priorities || []).slice(0, 10).map((p: any) => ({ key: p.code, label: p.label, value: p.selectedPct, display: `${fmt(p.selectedPct, 0)}%`, sub: `#1 for ${fmt(p.top1Pct, 0)}% · score ${fmt(p.score)}` }))} empty="No priorities ranked yet." />
            </Card>
            <Card title="Biggest barriers to civic participation" evidence="finding">
              <Bars tone="hsl(var(--terra))" items={(b.barriers || []).slice(0, 10).map((p: any) => ({ key: p.code, label: p.label, value: p.top1Pct, display: `${fmt(p.top1Pct, 0)}% ranked #1`, sub: `score ${fmt(p.score)} · ${fmt(p.ranked)} ranked it` }))} empty="No barriers ranked yet." />
            </Card>
          </div>
          <DimCompare b={b} dim={dim} setDim={setDim} kind="priorities" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="City programs reaching diverse groups" evidence="finding"><Scale5 s={b.scales?.Q28} labels={scaleL("Q28")} /></Card>
            <Card title="City outreach reaching my community" evidence="finding"><Scale5 s={b.scales?.Q30} labels={scaleL("Q30")} /></Card>
            <Card title="My civic engagement today" evidence="finding"><Scale5 s={b.scales?.Q29} labels={scaleL("Q29")} /></Card>
          </div>
        </Chapter>
      )}

      {show("connections") && (
        <Chapter id="connections" lead="Organizations named by respondents are respondent-mentioned. They are not endorsed, and none is treated as representing the community.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={q("Q21")} evidence="finding"><Bars items={distItems(b.q21, k)} k={k} /></Card>
            <Card title="Barriers to connecting across groups" evidence="finding"><Bars tone="hsl(var(--terra))" items={distItems(b.q23, k)} k={k} /></Card>
          </div>
          <Card title="Community asset map" evidence="mention" note={`${fmt(b.assets.mentions)} mentions from ${fmt(b.assets.respondentsNaming)} respondents. ${fmt(b.assets.validated)} linked to researcher-validated directory entries. ${publicView ? "Names mentioned by fewer than the privacy threshold are not listed." : ""}`}>
            {b.assets.list?.length ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {b.assets.list.slice(0, publicView ? 24 : 60).map((a: any) => (
                  <div key={a.key} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2"><p className="text-[14px] font-semibold leading-snug">{a.name}</p><span className="shrink-0 text-[12px] font-semibold tnum text-muted-foreground">{fmt(a.respondents)}</span></div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{[a.type, a.age].filter(Boolean).join(" · ") || "Type not given"}</p>
                    <div className="mt-2">{a.validated ? <Evidence kind="validated" /> : <Evidence kind="mention" />}</div>
                  </div>
                ))}
              </div>
            ) : <Empty small>No organizations named yet.</Empty>}
          </Card>
        </Chapter>
      )}

      {show("voices") && (
        <Chapter id="voices" lead="Themes come from analysts reading every written answer. Automated suggestions are never counted until an analyst approves them.">
          <Card title="Themes in written answers" evidence="qual" note={`${fmt(b.themes.texts)} written answers · ${fmt(b.themes.reviewed)} reviewed by an analyst.`}>
            <Bars tone="hsl(var(--terra))" unit="" items={(b.themes.themes || []).filter((t: any) => t.respondents || (!publicView && t.suggested)).map((t: any) => ({ key: t.code, label: t.name, value: t.respondents, display: `${fmt(t.respondents)} respondents`, sub: !publicView && t.suggested ? `${t.suggested} more suggested, awaiting review` : undefined }))} empty="No approved themes yet." />
          </Card>
          {quotes && quotes.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {quotes.slice(0, 8).map((x, i) => (
                <blockquote key={i} className="rounded-2xl border border-card-border bg-card p-5">
                  <p className="font-display text-[18px] leading-snug">“{x.text}”</p>
                  <footer className="mt-3 text-[12px] text-muted-foreground">Survey respondent · marked safe for aggregate reporting</footer>
                </blockquote>
              ))}
            </div>
          )}
        </Chapter>
      )}

      {show("governance") && (
        <Chapter id="governance" lead="This is an evaluation framework, not a vote. Survey evidence is one input; no pathway is assumed to be correct, and the final assessment draws on focus groups, listening sessions, existing bodies and community review.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Preferred ways to take part" evidence="finding"><Bars items={distItems(b.q35, k)} k={k} /></Card>
            <Card title="Comfort in an open forum" evidence="finding"><Scale5 s={b.scales?.Q33} labels={scaleL("Q33")} /></Card>
            <Card title="Comfort in a small focus group" evidence="finding"><Scale5 s={b.scales?.Q34} labels={scaleL("Q34")} /></Card>
          </div>
          <Card title="Evaluation framework: 13 dimensions × 4 pathways" evidence="framework" note="Each cell is assessed by the project team using all evidence sources, then reviewed with the community. Cells are intentionally blank until that assessment happens.">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-[13px]">
              <thead><tr className="text-left text-[12px] text-muted-foreground"><th className="py-2 pr-3 font-medium">Dimension</th>{GOV_PATHWAYS.map((p) => <th key={p} className="px-2 py-2 font-medium">{p}</th>)}</tr></thead>
              <tbody>{GOV_DIMENSIONS.map((d) => <tr key={d} className="border-t border-border/60"><td className="py-2 pr-3 font-medium">{d}</td>{GOV_PATHWAYS.map((p) => <td key={p} className="px-2 py-2"><div className="h-6 rounded bg-secondary/60" aria-label="Not yet assessed" /></td>)}</tr>)}</tbody>
            </table></div>
          </Card>
        </Chapter>
      )}
    </div>
  );
}

function DimCompare({ b, dim, setDim, kind }: { b: any; dim: string; setDim: (d: any) => void; kind: "likert" | "priorities" }) {
  const D = b.dims?.[dim];
  if (!D) return null;
  const opts = Object.entries(b.dims).map(([key, v]: any) => [key, v.label]);
  return (
    <Card title={kind === "likert" ? "Agreement by group" : "Top priorities by group"} evidence="finding" action={
      <div className="flex flex-wrap gap-1 rounded-full bg-secondary p-1 no-print" role="tablist">
        {opts.map(([key, l]) => <button key={key} role="tab" aria-selected={dim === key} onClick={() => setDim(key)} className={cn("rounded-full px-3 py-1 text-[12.5px] font-medium", dim === key ? "bg-card shadow-sm" : "text-muted-foreground")}>{l}</button>)}
      </div>} note={`Groups with fewer than ${b.k} respondents are hidden. Differences between small groups can be due to chance.`}>
      {kind === "likert" ? (
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-[12.5px]">
          <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-2 font-medium">Statement (% agree)</th>{D.likert.map((g: any) => <th key={g.key} className="px-1.5 py-2 text-center font-medium">{g.label}<br /><span className="font-normal tnum">n={g.suppressed ? `<${b.k}` : g.n}</span></th>)}</tr></thead>
          <tbody>{(b.likert || []).map((it: any) => (
            <tr key={it.id} className="border-t border-border/60"><td className="py-2 pr-2">{it.short}</td>
              {D.likert.map((g: any) => { const c = g.items?.find((x: any) => x.id === it.id); const v = c?.agreePct; return <td key={g.key} className="px-1.5 py-1.5 text-center">{g.suppressed ? <div className="hatch mx-auto h-6 w-full rounded" /> : v == null ? "—" : <div className="mx-auto rounded py-1 font-semibold tnum" style={{ background: `hsl(var(--primary) / ${0.08 + (v / 100) * 0.6})`, color: v > 60 ? "hsl(var(--primary-foreground))" : undefined }}>{fmt(v, 0)}%</div>}</td>; })}
            </tr>))}</tbody>
        </table></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {D.priorities.map((g: any) => (
            <div key={g.key} className="rounded-xl border border-border p-3">
              <p className="text-[13.5px] font-semibold">{g.label} <span className="font-normal text-muted-foreground tnum">n={g.suppressed ? `<${b.k}` : g.n}</span></p>
              {g.suppressed ? <div className="hatch mt-2 h-14 rounded" /> : g.top?.length ? <ol className="mt-2 space-y-1 text-[13px]">{g.top.slice(0, 3).map((t: any, i: number) => <li key={t.code} className="flex justify-between gap-2"><span>{i + 1}. {t.label}</span><span className="tnum text-muted-foreground">{fmt(t.selectedPct, 0)}%</span></li>)}</ol> : <p className="mt-2 text-[12.5px] text-muted-foreground">No rankings yet.</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
export { BD_GROUPS };
