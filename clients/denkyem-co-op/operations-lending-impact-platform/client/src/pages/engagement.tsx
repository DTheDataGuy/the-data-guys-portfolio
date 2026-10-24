import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, FailureBanner, ErrorState, Empty, SimpleTable, Pill, Callout } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, BarList, Legend } from "@/components/charts";
import { axisNum, monthLabel, num, pct, dateLabel } from "@/lib/format";

export default function Engagement() {
  const { data: d, error, isLoading } = useDash<any>("engagement");
  if (error) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader
        kicker="Community"
        title="Events, membership and outreach"
        description="Third Thursday, Drop In and CoLab, Growth Lab workshops and signature events. Attendance is counted as instances (check-in or headcount); registration-only events never count as attendance. Membership is a period-end stock and is never summed across months."
      />
      <FailureBanner items={d?.freshness} />
      <KpiGrid items={d?.kpis} cols={5} loading={isLoading} />
      {d && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card title="Attendance by month" subtitle="Recurring programs vs. signature events">
              <Legend items={[{ label: "Recurring", color: C.green }, { label: "Signature", color: C.gold }]} />
              <ChartBox height={230}>
                <BarChart data={d.trend.slice(-21)} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                  <YAxis tickFormatter={axisNum} {...axis} width={36} />
                  <Tooltip {...tooltipStyle} labelFormatter={monthLabel} />
                  <Bar dataKey="recurring" name="Recurring" stackId="a" fill={C.green} />
                  <Bar dataKey="signature" name="Signature" stackId="a" fill={C.gold} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartBox>
            </Card>
            <Card title="Mighty Networks membership" subtitle="Members at each period end">
              <Legend items={[{ label: "Denkyem Fam Full Access", color: C.green }, { label: "Premium Member Monthly", color: C.gold }, { label: "Free", color: C.gray }]} />
              <ChartBox height={230}>
                <LineChart data={d.membership} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="date" tickFormatter={(x) => monthLabel(x.slice(0, 7))} {...axis} />
                  <YAxis tickFormatter={axisNum} {...axis} width={36} />
                  <Tooltip {...tooltipStyle} labelFormatter={dateLabel} />
                  <Line dataKey="Denkyem Fam Full Access" stroke={C.green} strokeWidth={2.5} dot={false} />
                  <Line dataKey="Premium Member Monthly" stroke={C.gold} strokeWidth={2.5} dot={false} />
                  <Line dataKey="Free" stroke={C.gray} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ChartBox>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="Signature events" className="lg:col-span-2">
              <SimpleTable
                dense
                columns={[
                  { key: "name", label: "Event", render: (r) => <span className="font-medium">{r.name}</span> },
                  { key: "date", label: "Date", render: (r) => dateLabel(r.date) },
                  { key: "registrations", label: "Registered", align: "right", render: (r) => num(r.registrations) },
                  { key: "attendance", label: "Attended", align: "right", render: (r) => num(r.attendance) },
                  { key: "basis", label: "Basis", render: (r) => <Pill tone={r.basis === "Checked-in" ? "green" : r.basis === "Headcount" ? "bronze" : "muted"}>{r.basis}</Pill> },
                ]}
                rows={d.signature}
              />
            </Card>
            <Card title="CRM audiences" subtitle={d.tags.asOf ? `Distinct contacts by tag · ${dateLabel(d.tags.asOf)}` : ""}>
              {d.tags.rows.length ? <BarList rows={d.tags.rows.map((t: any) => ({ name: t.tag, value: t.contacts }))} format={num} color={C.bronze} /> : <Empty />}
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Card title="Newsletter campaigns" subtitle="ActiveCampaign · unique rates use delivered as the denominator">
              <SimpleTable
                dense
                testId="table-campaigns"
                columns={[
                  { key: "name", label: "Campaign", render: (r) => <span className="font-medium">{r.name}</span> },
                  { key: "date", label: "Sent", render: (r) => dateLabel(r.date) },
                  { key: "delivered", label: "Delivered", align: "right", render: (r) => num(r.delivered) },
                  { key: "uo", label: "Open rate", align: "right", render: (r) => pct(r.uniqueOpenRate) },
                  { key: "uc", label: "Click rate", align: "right", render: (r) => pct(r.uniqueClickRate) },
                  { key: "unsub", label: "Unsubs", align: "right" },
                ]}
                rows={d.campaigns.slice(0, 12)}
              />
            </Card>
            <Card title="Registration → attendance" subtitle="Recent events with registration data">
              <div className="space-y-2.5">
                {d.registrationVsAttendance.slice(-8).map((e: any, i: number) => (
                  <div key={i} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{e.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{e.basis === "Registration only" ? `${e.registrations} registered` : `${e.attendance}/${e.registrations}`}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: e.basis === "Registration only" ? "0%" : `${Math.min(100, (e.attendance / Math.max(1, e.registrations)) * 100)}%`, background: C.green }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="mt-4">
            <Callout title="Engagement ratios pending">{d.ratios.note}</Callout>
          </div>
        </>
      )}
      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}
