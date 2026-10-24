import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, FailureBanner, ErrorState, Empty, SimpleTable, Pill, StatusBadge, DownloadLink } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, BarList, Legend } from "@/components/charts";
import { axisMoney, axisNum, money, monthLabel, num, dateLabel } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Impact() {
  const { data: d, error, isLoading } = useDash<any>("impact");
  if (error) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader
        kicker="Programs & impact"
        title="Funding deployment, service delivery and outcomes"
        description="Allocations count once; linked disbursements subtract once. Sessions, hours and attendance are activity — not unique people. Participant groups are categories, so unique participants appear only where a deduplicated count is supported."
        actions={
          <>
            <DownloadLink href="/api/export/dataset/fact_service_delivery" testId="download-services">Service delivery CSV</DownloadLink>
            <DownloadLink href="/api/export/dataset/fact_allocation" testId="download-allocations">Allocations CSV</DownloadLink>
          </>
        }
      />
      <FailureBanner items={d?.freshness} />
      <KpiGrid items={d?.kpis} cols={4} loading={isLoading} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Funds allocated vs. disbursed by month" subtitle="Approved allocations and linked disbursements (returns subtract)">
          {d?.trend?.length ? (
            <>
              <Legend items={[{ label: "Allocated", color: C.gold }, { label: "Disbursed", color: C.green }]} />
              <ChartBox height={230}>
                <BarChart data={d.trend.filter((t: any) => t.allocated || t.disbursed)} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                  <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                  <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number) => money(v)} />
                  <Bar dataKey="allocated" name="Allocated" fill={C.gold} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="disbursed" name="Disbursed" fill={C.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartBox>
            </>
          ) : (
            <Empty />
          )}
        </Card>
        <Card title="Sessions, hours and attendance" subtitle="Monthly activity — program and county filters apply">
          {d?.trend?.length ? (
            <>
              <Legend items={[{ label: "Sessions", color: C.green }, { label: "Service hours", color: C.gold }, { label: "Attendance", color: C.bronze }]} />
              <ChartBox height={230}>
                <ComposedChart data={d.trend.slice(-21)} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                  <YAxis tickFormatter={axisNum} {...axis} width={40} />
                  <Tooltip {...tooltipStyle} labelFormatter={monthLabel} />
                  <Bar dataKey="sessions" name="Sessions" fill={C.green} radius={[3, 3, 0, 0]} />
                  <Line dataKey="hours" name="Service hours" stroke={C.gold} strokeWidth={2} dot={false} />
                  <Line dataKey="attendance" name="Attendance" stroke={C.bronze} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartBox>
            </>
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      <Tabs defaultValue="programs" className="mt-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="programs" data-testid="tab-programs">Programs</TabsTrigger>
          <TabsTrigger value="outcomes" data-testid="tab-outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="reach" data-testid="tab-reach">Reach & mix</TabsTrigger>
          <TabsTrigger value="funds" data-testid="tab-funds">Allocations</TabsTrigger>
          <TabsTrigger value="quality" data-testid="tab-quality">Coverage & notes</TabsTrigger>
        </TabsList>
        <TabsContent value="programs" className="mt-4">
          <Card title="Program scorecard" subtitle="Funds lifetime-to-date; activity for the selected period">
            <SimpleTable
              testId="table-programs"
              columns={[
                { key: "name", label: "Program", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.category} · {r.cadence}</div></div> },
                { key: "allocated", label: "Allocated", align: "right", render: (r) => money(r.allocated) },
                { key: "disbursed", label: "Disbursed", align: "right", render: (r) => money(r.disbursed) },
                { key: "remaining", label: "Remaining", align: "right", render: (r) => money(r.remaining) },
                { key: "sessions", label: "Sessions", align: "right", render: (r) => num(r.sessions) },
                { key: "hours", label: "Hours", align: "right", render: (r) => num(r.hours) },
                { key: "attendance", label: "Attendance", align: "right", render: (r) => num(r.attendance) },
              ]}
              rows={d?.programTable ?? []}
            />
          </Card>
        </TabsContent>
        <TabsContent value="outcomes" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(d?.outcomes ?? []).map((o: any) => (
              <div key={o.id} className="rounded-xl border bg-card p-4" data-testid={`outcome-${o.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-medium text-muted-foreground">{o.label}</div>
                  <StatusBadge status={o.status} />
                </div>
                <div className={o.value === null ? "mt-2 text-base text-muted-foreground" : "mt-2 text-2xl font-semibold tabular-nums"}>{o.value === null ? "Not available" : num(o.value)}</div>
                <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  <div>
                    {o.kind} · {o.rule}
                  </div>
                  <div>Evidence: {o.evidence}</div>
                  <div>
                    {o.observations} observations across {o.programs} programs · v{o.version}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Outcome definitions are configurable per funder. Self-reported outcomes are labeled as such and are not causal attribution.</p>
        </TabsContent>
        <TabsContent value="reach" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Sessions by county">{d?.geography?.length ? <BarList rows={d.geography.map((g: any) => ({ name: `${g.county} County`, value: g.sessions, note: `${num(g.attendance)} attendance · ${money(g.disbursed, true)} disbursed` }))} format={num} /> : <Empty />}</Card>
            <Card title="Sessions by service type">{d?.serviceMix?.length ? <BarList rows={d.serviceMix.slice(0, 10)} format={num} color={C.gold} /> : <Empty />}</Card>
            <Card title="Sessions by participant group" subtitle="Categories, not people">{d?.groupMix?.length ? <BarList rows={d.groupMix} format={num} color={C.bronze} /> : <Empty />}</Card>
            <Card title="Sessions by city" className="lg:col-span-2">{d?.cities?.length ? <BarList rows={d.cities.slice(0, 10)} format={num} color={C.teal} /> : <Empty />}</Card>
            <Card title="Sessions by industry group">{d?.industryMix?.length ? <BarList rows={d.industryMix} format={num} /> : <Empty />}</Card>
          </div>
        </TabsContent>
        <TabsContent value="funds" className="mt-4">
          <Card title="Allocation register" subtitle="Each allocation counted once">
            <SimpleTable
              dense
              columns={[
                { key: "id", label: "Allocation", render: (r) => <span className="font-medium">{r.id}</span> },
                { key: "programName", label: "Program" },
                { key: "county", label: "County" },
                { key: "date", label: "Date", render: (r) => dateLabel(r.date) },
                { key: "allocated", label: "Allocated", align: "right", render: (r) => money(r.allocated) },
                { key: "disbursed", label: "Disbursed", align: "right", render: (r) => money(r.disbursed) },
                { key: "remaining", label: "Remaining", align: "right", render: (r) => money(r.remaining) },
                { key: "pct", label: "Deployed", className: "w-[16%]", render: (r) => <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-[hsl(var(--chart-1))]" style={{ width: `${Math.min(100, (r.disbursed / Math.max(1, r.allocated)) * 100)}%` }} /></div> },
              ]}
              rows={d?.allocations ?? []}
            />
          </Card>
        </TabsContent>
        <TabsContent value="quality" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Reporting coverage" subtitle="Months with approved service records vs. expected">
              <SimpleTable
                dense
                columns={[
                  { key: "name", label: "Program" },
                  { key: "cov", label: "Coverage", render: (r) => `${r.reported} / ${r.expected} months` },
                  { key: "missing", label: "Recent gaps", render: (r) => (r.missing.length ? <div className="flex flex-wrap gap-1">{r.missing.map((m: string) => <Pill key={m} tone="amber">{monthLabel(m)}</Pill>)}</div> : <Pill tone="green">Complete</Pill>) },
                ]}
                rows={d?.coverage ?? []}
              />
            </Card>
            <Card title="Data-quality notes" subtitle="Methodology, limitations and source gaps">
              <div className="space-y-3">
                {(d?.qualityNotes ?? []).map((n: any) => (
                  <div key={n.Note_ID} className="border-l-2 border-[hsl(var(--chart-3))] pl-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Pill tone="bronze">{n.Category}</Pill> {n.Domain} · {dateLabel(n.Date)}
                    </div>
                    <div className="mt-1 text-sm">{n.Description}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}
