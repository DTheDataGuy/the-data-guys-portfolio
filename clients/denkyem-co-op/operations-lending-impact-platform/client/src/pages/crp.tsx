import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, ErrorState, Empty, SimpleTable, Pill, Callout, DownloadLink } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, BarList, Legend } from "@/components/charts";
import { axisMoney, money, monthLabel, num } from "@/lib/format";

export default function Crp() {
  const { data: d, error, isLoading } = useDash<any>("crp");
  if (error) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader
        kicker="Grant reporting"
        title="CRP period reports"
        description="Baseline, monthly period activity and cumulative rows are kept apart. Only period-activity rows are summed; point-in-time counts use the latest report. Missing confirmations show as gaps, never as zeros."
        actions={<DownloadLink href="/api/export/dataset/crp_report" testId="download-crp">CRP reports CSV</DownloadLink>}
      />
      <KpiGrid items={d?.kpis} cols={6} loading={isLoading} />
      {d && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card title="Program-reported loan dollars and activity" subtitle="Period-activity rows only">
            {d.trend.length ? (
              <>
                <Legend items={[{ label: "Loan dollars", color: C.gold }]} />
                <ChartBox height={230}>
                  <BarChart data={d.trend} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="period" tickFormatter={monthLabel} {...axis} />
                    <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                    <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number, n) => (n === "dollars" ? [money(v), "Loan dollars"] : [v, n])} />
                    <Bar dataKey="dollars" fill={C.gold} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartBox>
              </>
            ) : (
              <Empty />
            )}
          </Card>
          <div className="space-y-4">
            <Card title="Reporting coverage">
              <div className="text-2xl font-semibold tabular-nums">
                {d.coverage.reported} <span className="text-base font-normal text-muted-foreground">of {d.coverage.expected} months</span>
              </div>
              {d.coverage.missing.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1.5 text-xs text-muted-foreground">Missing confirmations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.coverage.missing.map((m: string) => (
                      <Pill key={m} tone="amber">
                        {monthLabel(m)}
                      </Pill>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            <Card title="CRP vs. authoritative lending" subtitle={d.comparison.period}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">CRP-reported loan dollars</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{money(d.comparison.crpReported, true)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Lending disbursed (all funds)</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{money(d.comparison.lendingDisbursed, true)}</div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{d.comparison.note}</p>
            </Card>
          </div>
        </div>
      )}
      {d?.selected && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Enrolled by race (latest report)" subtitle={`${d.selected.raceSelection} · small cells suppressed`}>
            <BarList rows={d.selected.race.map((r: any) => ({ name: r.name, value: r.value, display: r.display }))} format={num} color={C.bronze} />
          </Card>
          <Card title="Enrolled by county (latest report)" subtitle="Small cells suppressed">
            <BarList rows={d.selected.county.map((r: any) => ({ name: r.name, value: r.value, display: r.display }))} format={num} color={C.teal} />
          </Card>
        </div>
      )}
      {d && (
        <div className="mt-4">
          <Card title="Report history" subtitle="Every row keeps its basis and source confirmation">
            <SimpleTable
              dense
              testId="table-crp"
              columns={[
                { key: "period", label: "Period", render: (r) => <span className="font-medium">{r.period}</span> },
                { key: "basis", label: "Basis", render: (r) => <Pill tone={r.basis === "Period activity" ? "green" : r.basis === "Baseline" ? "bronze" : "gold"}>{r.basis}</Pill> },
                { key: "enrolled", label: "Enrolled", align: "right" },
                { key: "active", label: "Active", align: "right" },
                { key: "coaching", label: "Coaching", align: "right" },
                { key: "training", label: "Training", align: "right" },
                { key: "loans", label: "Loans", align: "right" },
                { key: "dollars", label: "Loan $", align: "right", render: (r) => money(r.dollars) },
                { key: "jobsC", label: "Jobs created", align: "right" },
                { key: "highlights", label: "Highlights / challenges", render: (r) => <span className="text-xs text-muted-foreground">{[r.highlights, r.challenges].filter(Boolean).join(" · ") || "—"}</span> },
              ]}
              rows={[...d.periods].reverse()}
            />
          </Card>
        </div>
      )}
      <div className="mt-4">
        <Callout>Baseline: {d?.baseline ? `${d.baseline.period} — ${num(d.baseline.enrolled)} enrolled, ${num(d.baseline.loans)} loans, ${money(d.baseline.dollars)}` : "not supplied"}. Latest cumulative: {d?.latestCumulative ? `${d.latestCumulative.period} — ${num(d.latestCumulative.loans)} loans, ${money(d.latestCumulative.dollars)}` : "not supplied"}. These are shown for context and never added to period activity.</Callout>
      </div>
      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}
