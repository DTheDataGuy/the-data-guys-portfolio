import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ComposedChart, Line } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, ErrorState, Empty, SimpleTable, Pill, Callout, DownloadLink } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, BarList, Legend } from "@/components/charts";
import { axisMoney, money, monthLabel, dateLabel } from "@/lib/format";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function Finance() {
  const [basis, setBasis] = useState<"ytd" | "month">("ytd");
  const { data: d, error, isLoading } = useDash<any>("finance", { basis });
  if (error) return <ErrorState error={error} />;
  // waterfall
  let run = 0;
  const wf = (d?.waterfall ?? []).map((s: any) => {
    if (s.kind === "start") {
      run = s.value;
      return { name: s.name, base: 0, value: s.value, color: C.green };
    }
    if (s.kind === "end") return { name: s.name, base: 0, value: s.value, color: (s.value ?? 0) >= 0 ? C.gold : C.bronze };
    const start = run;
    run += s.value;
    return { name: s.name, base: Math.min(start, run), value: Math.abs(s.value), color: C.bronze };
  });
  return (
    <div>
      <PageHeader
        kicker="Finance"
        title="Financial statements"
        description="From finalized month-end statements only. Month and year-to-date are separate bases; YTD is never added across months. Statement total lines are used where present so detail plus subtotals are never double-counted."
        actions={
          <>
            <ToggleGroup type="single" value={basis} onValueChange={(v) => v && setBasis(v as any)} className="rounded-md border p-0.5">
              <ToggleGroupItem value="month" className="h-8 px-3 text-[13px]" data-testid="toggle-month">Month</ToggleGroupItem>
              <ToggleGroupItem value="ytd" className="h-8 px-3 text-[13px]" data-testid="toggle-ytd">Year to date</ToggleGroupItem>
            </ToggleGroup>
            <DownloadLink href="/api/export/dataset/finance_line" testId="download-finance">Statement lines CSV</DownloadLink>
          </>
        }
      />
      {d?.statementMeta && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Pill tone="green">{d.statementMeta.version}</Pill>
          <span>{d.statementMeta.entity}</span>·<span>{d.statementMeta.basis} basis</span>·<span>Period {d.selected}</span>·<span>Approved {dateLabel(d.statementMeta.approved)}</span>
        </div>
      )}
      <KpiGrid items={d?.kpis} cols={4} loading={isLoading} />
      {d && d.selected && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card title={`Income to net operating income · ${basis === "ytd" ? "YTD" : "month"}`} subtitle="Income less cost of goods sold and operating expenses; credits increase the running balance">
              {wf.length ? (
                <ChartBox height={270}>
                  <BarChart data={wf} margin={{ left: 0, right: 8, top: 8, bottom: 30 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="name" {...axis} interval={0} angle={-25} textAnchor="end" height={50} tick={{ fontSize: 10.5 }} />
                    <YAxis tickFormatter={axisMoney} {...axis} width={56} />
                    <Tooltip {...tooltipStyle} formatter={(v: number, n) => (n === "base" ? [null, null] : [money(v), "Amount"])} />
                    <Bar dataKey="base" stackId="w" fill="transparent" />
                    <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]}>
                      {wf.map((w: any, i: number) => (
                        <Cell key={i} fill={w.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartBox>
              ) : (
                <Empty />
              )}
            </Card>
            <Card title="Balance sheet" subtitle={`As of ${d.selected} month-end`}>
              <div className="mb-3 flex items-center gap-2 text-sm">
                {d.balance.balanced ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                {d.balance.balanced ? "Assets = Liabilities + Equity" : "Statement does not balance — review"}
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Assets", d.balance.assets, d.balance.totals.assets],
                  ["Liabilities", d.balance.liabilities, d.balance.totals.liabilities],
                  ["Equity", d.balance.equity, d.balance.totals.equity],
                ].map(([k, lines, total]: any) => (
                  <div key={k}>
                    <div className="flex justify-between border-b pb-1 font-semibold">
                      <span>{k}</span>
                      <span className="tabular-nums">{money(total)}</span>
                    </div>
                    {lines.map((l: any) => (
                      <div key={l.name} className="flex justify-between py-0.5 text-[13px] text-muted-foreground">
                        <span>{l.name}</span>
                        <span className="tabular-nums">{money(l.value)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="Monthly income and expenses" className="lg:col-span-2">
              <Legend items={[{ label: "Income", color: C.green }, { label: "Expenses", color: C.bronze }, { label: "Net operating income", color: C.gold }]} />
              <ChartBox height={220}>
                <ComposedChart data={d.trend} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="period" tickFormatter={monthLabel} {...axis} />
                  <YAxis tickFormatter={axisMoney} {...axis} width={56} />
                  <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number) => money(v)} />
                  <Bar dataKey="income" name="Income" fill={C.green} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={C.bronze} radius={[3, 3, 0, 0]} />
                  <Line dataKey="noi" name="Net operating income" stroke={C.gold} strokeWidth={2.5} dot={{ r: 2.5 }} />
                </ComposedChart>
              </ChartBox>
            </Card>
            <Card title="Income composition" subtitle={basis === "ytd" ? "Year to date" : "Month"}>
              <BarList rows={d.income} format={(v) => money(v, true)} />
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Promissory notes — maturity ladder" subtitle={`Remaining balance ${money(d.notes.total)}`}>
              <BarList rows={d.notes.buckets.map((b: any) => ({ name: `${b.bucket} · ${b.notes} notes`, value: b.balance }))} format={(v) => money(v, true)} color={C.bronze} />
              <div className="mt-4">
                <SimpleTable
                  dense
                  columns={[
                    { key: "next", label: "Next payment", render: (r) => dateLabel(r.next) },
                    { key: "lender", label: "Lender" },
                    { key: "due", label: "Due", align: "right", render: (r) => money(r.due) },
                    { key: "rate", label: "Rate", align: "right", render: (r) => `${r.rate}%` },
                    { key: "maturity", label: "Matures", render: (r) => dateLabel(r.maturity) },
                  ]}
                  rows={d.notes.upcoming}
                />
              </div>
            </Card>
            <Card title="Financial ratios" subtitle="Defined, but held until finance approves the chart-of-accounts mapping">
              <SimpleTable columns={[{ key: "name", label: "Ratio", render: (r) => <span className="font-medium">{r.name}</span> }, { key: "f", label: "Formula", render: (r) => <span className="text-xs">{r.numerator} ÷ {r.denominator}</span> }, { key: "status", label: "Status", render: (r) => <Pill tone="amber">{r.status}</Pill> }]} rows={d.ratios} />
            </Card>
          </div>
        </>
      )}
      {d && !d.selected && (
        <div className="mt-6">
          <Callout tone="warn">No finalized statements are approved yet. Import Robin's month-end P&amp;L and Balance Sheet in Import &amp; reconcile.</Callout>
        </div>
      )}
      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}
