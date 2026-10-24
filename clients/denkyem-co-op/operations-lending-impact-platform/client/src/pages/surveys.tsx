import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useDash, PageHeader, Card, Freshness, ErrorState, Empty, Pill, Callout } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C } from "@/components/charts";
import { pct, num } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";

export default function Surveys() {
  const { data: d, error, isLoading } = useDash<any>("surveys");
  if (error) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader
        kicker="Voice of the community"
        title="Surveys and business journeys"
        description="Each instrument keeps its own scale — a 1–5 workshop score is never averaged with a 1–10 loan-experience score. Journeys link businesses across events, technical assistance, applications and funding only through approved identifiers or reviewed matches."
      />
      {isLoading ? (
        <Skeleton className="h-60 rounded-xl" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {d.instruments.map((s: any) => (
              <Card key={s.id} title={s.name} subtitle={`Scale ${s.scale} · ${s.categories.join(", ")}`}>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-semibold tabular-nums">{s.mean?.toFixed(2) ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">mean of {num(s.responses)} responses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{pct(s.completion, 0)}</div>
                    <div className="text-xs text-muted-foreground">completion</div>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full" style={{ width: `${((s.mean ?? 0) / s.scaleMax) * 100}%`, background: C.gold }} />
                </div>
                <ChartBox height={110}>
                  <LineChart data={s.trend} margin={{ left: -24, right: 4, top: 12 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="period" {...axis} tick={{ fontSize: 10 }} />
                    <YAxis domain={[1, s.scaleMax]} {...axis} width={40} tick={{ fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Line dataKey="mean" stroke={C.green} strokeWidth={2} dot={{ r: 2.5 }} />
                  </LineChart>
                </ChartBox>
              </Card>
            ))}
            {!d.instruments.length && <Empty>Import survey summaries per instrument.</Empty>}
          </div>
          <div className="mt-6">
            {d.journey ? (
              <Card title="Business journey" subtitle={`${num(d.journey.matchedBusinesses)} of ${num(d.journey.knownBusinesses)} known businesses matched · ${d.journey.lowConfidenceExcluded} low-confidence touchpoints excluded`}>
                <div className="grid gap-3 md:grid-cols-4">
                  {d.journey.funnel.map((f: any, i: number) => {
                    const first = d.journey.funnel[0].businesses || 1;
                    return (
                      <div key={f.stage} className="relative rounded-xl border p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {i + 1}</div>
                        <div className="mt-1 font-medium">{f.stage}</div>
                        <div className="mt-2 text-2xl font-semibold tabular-nums">{num(f.businesses)}</div>
                        <div className="text-xs text-muted-foreground">{i ? `${pct(f.businesses / first, 0)} of step 1` : "businesses"}</div>
                        <div className="mt-3 h-1.5 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full" style={{ width: `${(f.businesses / first) * 100}%`, background: [C.green, C.teal, C.bronze, C.gold][i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Pill tone="green">Approved identifier</Pill>
                  <Pill tone="gold">Reviewed email match</Pill>
                  <Pill tone="bronze">Manual review</Pill>
                  <span className="text-muted-foreground">— only these match methods count. Businesses reached at a step are distinct within that step.</span>
                </div>
              </Card>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> Journey detail is internal only.
              </div>
            )}
          </div>
          <div className="mt-4">
            <Callout>Survey forms, event check-in and membership definitions are still to be confirmed with Amanda. Until they are, completion uses survey starts as the denominator and engagement ratios stay unavailable.</Callout>
          </div>
          <div className="mt-6">
            <Freshness items={d.freshness} />
          </div>
        </>
      )}
    </div>
  );
}
