import { Link } from "wouter";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line } from "recharts";
import { AlertTriangle, Info, XCircle, ArrowRight, Lock } from "lucide-react";
import { useDash, KpiCard, PageHeader, Card, Freshness, FailureBanner, ErrorState, type Metric, Empty } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, Legend } from "@/components/charts";
import { axisMoney, axisNum, money, monthLabel, dateLabel } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function Overview() {
  const { data, isLoading, error } = useDash<any>("overview");
  const { demo } = useApp();
  if (error) return <ErrorState error={error} />;
  const lend = (data?.lendingTrend ?? []).slice(-18);
  const impact = (data?.impactTrend ?? []).slice(-18);
  const fin = data?.financeTrend ?? [];
  return (
    <div>
      <PageHeader
        kicker="Executive overview"
        title="How Denkyem is building community wealth"
        description={
          <>
            Approved figures across lending, programs, community engagement and finance. Every number carries its definition, source, period and status — open the <Info className="inline h-3.5 w-3.5" /> on any card.
            {demo && " Values shown are demonstration fixtures."}
          </>
        }
      />
      <FailureBanner items={data?.freshness} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6 min-w-0">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
            : data.sections.map((s: any) => (
                <section key={s.id} data-testid={`section-${s.id}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold">{s.title}</h2>
                    {!s.restricted && (
                      <Link href={s.link} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" data-testid={`link-section-${s.id}`}>
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  {s.restricted ? (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" /> Not available for your role. Ask leadership for an approved report.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {s.kpis.map((m: Metric, i: number) => (
                        <KpiCard key={m.id} m={m} accent={i === 0} />
                      ))}
                    </div>
                  )}
                </section>
              ))}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Lending disbursements by month" subtitle="Completed disbursement transactions · draws, not loans">
              {lend.length ? (
                <ChartBox height={220}>
                  <BarChart data={lend} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                    <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                    <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number, n) => (n === "amount" ? [money(v), "Disbursed"] : [v, "Draws"])} />
                    <Bar dataKey="amount" fill={C.green} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartBox>
              ) : (
                <Empty>Approve a Transaction Report with Status to see disbursements.</Empty>
              )}
            </Card>
            <Card title="Portfolio principal (month-end)" subtitle="Verified Active loans only · never summed across dates">
              {data?.portfolioTrend?.length ? (
                <ChartBox height={220}>
                  <AreaChart data={data.portfolioTrend} margin={{ left: 0, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="pp" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={C.gold} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={C.gold} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="date" tickFormatter={(d) => monthLabel(d.slice(0, 7))} {...axis} />
                    <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                    <Tooltip {...tooltipStyle} labelFormatter={dateLabel} formatter={(v: number, n) => (n === "principal" ? [money(v), "Principal"] : [v, "Active loans"])} />
                    <Area dataKey="principal" stroke={C.gold} strokeWidth={2} fill="url(#pp)" />
                  </AreaChart>
                </ChartBox>
              ) : (
                <Empty>Approve an outstanding-principal snapshot.</Empty>
              )}
            </Card>
            <Card title="Program activity" subtitle="Sessions delivered and event attendance instances">
              {impact.length ? (
                <>
                  <Legend items={[{ label: "Sessions", color: C.green }, { label: "Attendance", color: C.bronze }]} />
                  <ChartBox height={200}>
                    <ComposedChart data={impact} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid {...grid} />
                      <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                      <YAxis tickFormatter={axisNum} {...axis} width={40} />
                      <Tooltip {...tooltipStyle} labelFormatter={monthLabel} />
                      <Bar dataKey="sessions" name="Sessions" fill={C.green} radius={[3, 3, 0, 0]} />
                      <Line dataKey="attendance" name="Attendance" stroke={C.bronze} strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ChartBox>
                </>
              ) : (
                <Empty>Enter or import service and event records.</Empty>
              )}
            </Card>
            <Card title="Income vs. expenses (monthly)" subtitle="Finalized month-end statements only">
              {fin.length ? (
                <>
                  <Legend items={[{ label: "Income", color: C.green }, { label: "Expenses", color: C.bronze }, { label: "Net operating income", color: C.gold }]} />
                  <ChartBox height={200}>
                    <ComposedChart data={fin} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid {...grid} />
                      <XAxis dataKey="period" tickFormatter={monthLabel} {...axis} />
                      <YAxis tickFormatter={axisMoney} {...axis} width={52} />
                      <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number) => money(v)} />
                      <Bar dataKey="income" name="Income" fill={C.green} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill={C.bronze} radius={[3, 3, 0, 0]} />
                      <Line dataKey="noi" name="Net operating income" stroke={C.gold} strokeWidth={2.5} dot={{ r: 2.5 }} />
                    </ComposedChart>
                  </ChartBox>
                </>
              ) : (
                <Empty>Import Robin's finalized P&amp;L and Balance Sheet.</Empty>
              )}
            </Card>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-2.5 text-[13px] font-semibold">Needs attention</div>
            <div className="divide-y">
              {(data?.issues ?? []).map((i: any, k: number) => {
                const I = i.level === "error" ? XCircle : i.level === "warning" ? AlertTriangle : Info;
                const tone = i.level === "error" ? "text-red-600 dark:text-red-400" : i.level === "warning" ? "text-amber-600 dark:text-amber-400" : "text-primary";
                return (
                  <Link key={k} href={i.link} className="flex gap-3 px-4 py-3 hover:bg-muted/50" data-testid={`issue-${k}`}>
                    <I className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium leading-snug">{i.title}</div>
                      <div className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-3">{i.detail}</div>
                    </div>
                  </Link>
                );
              })}
              {!isLoading && !data?.issues?.length && <div className="px-4 py-4 text-sm text-muted-foreground">Nothing outstanding.</div>}
            </div>
          </div>
          <Freshness items={data?.freshness?.filter((f: any) => ["loan_snapshot", "loan_transaction", "fact_service_delivery", "fact_events", "crp_report", "crsp_service", "campaign", "membership_snapshot", "finance_line", "fundraising_opportunity"].includes(f.dataset))} />
        </aside>
      </div>
    </div>
  );
}
