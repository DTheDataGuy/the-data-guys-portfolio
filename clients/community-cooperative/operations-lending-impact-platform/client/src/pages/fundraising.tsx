import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, ErrorState, SimpleTable, Pill, Callout } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, Legend } from "@/components/charts";
import { axisMoney, money, monthLabel, dateLabel } from "@/lib/format";

export default function Fundraising() {
  const { data: d, error, isLoading } = useDash<any>("fundraising");
  if (error) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader
        kicker="Capital & development"
        title="Fundraising pipeline"
        description="Open pipeline, commitments and cash received are separate measures. Commitments are not receipts, and neither is accounting revenue. Probability-weighted totals are optional and never shown as secured."
      />
      <div className="mb-4">
        <Callout tone="warn" title="Proposed field mapping">Column meanings will be confirmed against the July fundraising workbook before these figures leave Provisional.</Callout>
      </div>
      <KpiGrid items={d?.kpis} cols={4} loading={isLoading} />
      {d && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card title="Opportunities by stage">
              <ChartBox height={240}>
                <BarChart data={d.byStage} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="stage" {...axis} interval={0} tick={{ fontSize: 10.5 }} />
                  <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                  <Tooltip {...tooltipStyle} formatter={(v: number, n) => (n === "amount" ? [money(v), "Amount"] : [v, "Opportunities"])} />
                  <Bar dataKey="amount" fill={C.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartBox>
            </Card>
            <Card title="By instrument" subtitle="Grants, donations, investments and promissory notes kept apart">
              <Legend items={[{ label: "Open", color: C.gray }, { label: "Committed", color: C.gold }, { label: "Received", color: C.green }]} />
              <ChartBox height={220}>
                <BarChart data={d.instruments} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="instrument" {...axis} />
                  <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => money(v)} />
                  <Bar dataKey="open" name="Open" fill={C.gray} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="committed" name="Committed" fill={C.gold} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="received" name="Received" fill={C.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartBox>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Next actions" subtitle="Funder names visible to finance and administrators only">
              <SimpleTable
                dense
                testId="table-next-actions"
                columns={[
                  { key: "date", label: "Due", render: (r) => <span className={r.overdue ? "font-semibold text-red-700 dark:text-red-400" : ""}>{dateLabel(r.date)}</span> },
                  { key: "funder", label: "Funder" },
                  { key: "next", label: "Action" },
                  { key: "owner", label: "Owner" },
                  { key: "amount", label: "Ask", align: "right", render: (r) => money(r.amount, true) },
                ]}
                rows={d.upcoming}
              />
            </Card>
            <Card title="Expected to close">
              <SimpleTable
                dense
                columns={[
                  { key: "close", label: "Expected", render: (r) => dateLabel(r.close) },
                  { key: "funder", label: "Funder" },
                  { key: "stage", label: "Stage", render: (r) => <Pill tone="bronze">{r.stage}</Pill> },
                  { key: "probability", label: "Prob.", align: "right", render: (r) => (r.probability != null ? `${r.probability}%` : "—") },
                  { key: "amount", label: "Ask", align: "right", render: (r) => money(r.amount, true) },
                ]}
                rows={d.closing}
              />
            </Card>
            <Card title="Cash received by month" className="lg:col-span-2">
              <ChartBox height={200}>
                <BarChart data={d.receiptsTrend} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                  <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                  <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number) => money(v)} />
                  <Bar dataKey="amount" fill={C.gold} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartBox>
            </Card>
          </div>
        </>
      )}
      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}
