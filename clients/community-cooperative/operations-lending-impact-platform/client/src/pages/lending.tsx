import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, FailureBanner, ErrorState, Empty, SimpleTable, Pill, Callout, DownloadLink } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, SERIES, BarList, Legend } from "@/components/charts";
import { axisMoney, money, monthLabel, dateLabel, num, pct } from "@/lib/format";
import { useApp } from "@/lib/app-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Lending() {
  const { data: d, error, isLoading } = useDash<any>("lending");
  const { role, demo } = useApp();
  const { data: loans } = useQuery<any[]>({ queryKey: ["/api/records/loan", { status: "approved", _r: role, _d: demo }] });
  if (error) return <ErrorState error={error} />;
  const disp = d?.dispositions;
  const dispRows = disp ? [
    { name: "Active", value: disp.active, color: C.green },
    { name: "Repaid", value: disp.repaid, color: C.gold },
    { name: "Charged off", value: disp.chargedOff, color: C.bronze },
    { name: "Cancelled", value: disp.cancelled, color: C.gray },
    { name: "Unknown status", value: disp.unknown, color: "hsl(var(--muted-foreground))" },
  ].filter((r) => r.value) : [];
  return (
    <div>
      <PageHeader
        kicker="Lending"
        title="Loan portfolio, pipeline and repayment"
        description="Principal comes from approved month-end snapshots for loans with a verified Active status. Disbursements and payments come from the Transaction Report with Status, following the transaction status matrix."
        actions={<DownloadLink href="/api/export/dataset/loan_snapshot" testId="download-snapshots">Snapshots CSV</DownloadLink>}
      />
      <FailureBanner items={d?.freshness} />
      {d && !d.rules.loanStatusMappingApproved && (
        <div className="mb-4">
          <Callout tone="warn" title="Provisional until lending signs off">
            The loan-status mapping, transaction status matrix and delinquency rules are proposals. Figures stay marked Provisional and are internal-only until the Director of Lending approves them in Administration → Rules.
          </Callout>
        </div>
      )}
      <KpiGrid items={d?.kpis} cols={4} loading={isLoading} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Portfolio principal at month-end" subtitle="One authoritative snapshot per loan per date (LoanWell or NED by crosswalk)">
          {d?.portfolioTrend?.length ? (
            <ChartBox height={240}>
              <AreaChart data={d.portfolioTrend} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="lp" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="date" tickFormatter={(x) => monthLabel(x.slice(0, 7))} {...axis} />
                <YAxis tickFormatter={axisMoney} {...axis} width={56} />
                <Tooltip {...tooltipStyle} labelFormatter={dateLabel} formatter={(v: number, n) => (n === "principal" ? [money(v), "Principal"] : [v, "Active loans"])} />
                <Area dataKey="principal" stroke={C.green} strokeWidth={2} fill="url(#lp)" />
              </AreaChart>
            </ChartBox>
          ) : (
            <Empty>No approved snapshots.</Empty>
          )}
        </Card>
        <Card title="Disbursements by month" subtitle="Completed disbursement transactions">
          {d?.disbursementTrend?.length ? (
            <ChartBox height={240}>
              <BarChart data={d.disbursementTrend.slice(-24)} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                <YAxis tickFormatter={axisMoney} {...axis} width={56} />
                <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v: number, n) => (n === "amount" ? [money(v), "Disbursed"] : [v, "Draws"])} />
                <Bar dataKey="amount" fill={C.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartBox>
          ) : (
            <Empty>No approved transactions.</Empty>
          )}
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="mt-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="composition" data-testid="tab-composition">Composition</TabsTrigger>
          <TabsTrigger value="repayment" data-testid="tab-repayment">Repayment & transactions</TabsTrigger>
          <TabsTrigger value="register" data-testid="tab-register">Loan register</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card title="Applications by stage" subtitle={d?.pipeline?.date ? `Pipeline snapshot as of ${dateLabel(d.pipeline.date)} · total requested ${money(d.pipeline.total)}` : "No pipeline snapshot"}>
              {d?.pipeline?.stages?.length ? (
                <SimpleTable
                  columns={[
                    { key: "stage", label: "Stage" },
                    { key: "count", label: "Applications", align: "right", render: (r) => num(r.count) },
                    { key: "amount", label: "Requested", align: "right", render: (r) => money(r.amount) },
                    { key: "bar", label: "", className: "w-[35%]", render: (r) => <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full" style={{ width: `${(r.count / Math.max(...d.pipeline.stages.map((s: any) => s.count))) * 100}%`, background: ["Declined", "Withdrawn"].includes(r.stage) ? C.bronze : C.green }} /></div> },
                  ]}
                  rows={d.pipeline.stages}
                  testId="table-pipeline"
                />
              ) : (
                <Empty>Import a LoanWell Pipeline export.</Empty>
              )}
            </Card>
            <Card title="Stage conversion" subtitle="From application stage history — distinct applications reaching the next stage">
              {d?.pipeline?.conversion ? (
                <div className="space-y-3">
                  {d.pipeline.conversion.map((c: any) => (
                    <div key={c.from} className="rounded-lg border p-3">
                      <div className="flex items-baseline justify-between text-sm">
                        <span>
                          {c.from} → <span className="font-medium">{c.to}</span>
                        </span>
                        <span className="text-lg font-semibold tabular-nums">{pct(c.rate, 0)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {c.converted} of {c.eligible} applications
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="Conversion unavailable">{d?.pipeline?.conversionReason}</Empty>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="composition" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Loan dispositions" subtitle="By verified status — repaid and charged-off kept separate">
              {dispRows.length ? (
                <>
                  <ChartBox height={180}>
                    <PieChart>
                      <Pie data={dispRows} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2} stroke="none">
                        {dispRows.map((r) => (
                          <Cell key={r.name} fill={r.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ChartBox>
                  <Legend items={dispRows.map((r) => ({ label: `${r.name} · ${r.value}`, color: r.color }))} />
                </>
              ) : (
                <Empty />
              )}
            </Card>
            <Card title="Loan size distribution" subtitle="Original amount · funded loans">
              {d?.loanSize ? (
                <ChartBox height={220}>
                  <BarChart data={d.loanSize.filter((b: any) => b.bucket !== "Unknown" || b.loans)} margin={{ left: -10, right: 8, top: 8 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="bucket" {...axis} />
                    <YAxis allowDecimals={false} {...axis} width={36} />
                    <Tooltip {...tooltipStyle} formatter={(v: number, n) => (n === "loans" ? [v, "Loans"] : [money(v), "Amount"])} />
                    <Bar dataKey="loans" fill={C.bronze} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartBox>
              ) : (
                <Empty />
              )}
            </Card>
            <Card title="Active principal by county" subtitle="Latest snapshot">
              {d?.geography?.length ? <BarList rows={d.geography.map((g: any) => ({ name: `${g.county} · ${g.loans} loans`, value: g.principal }))} format={(v) => money(v, true)} /> : <Empty />}
            </Card>
            <Card title="Industry concentration" subtitle="Curated mapping only — unreviewed loans show as Unknown or needs review" className="lg:col-span-2">
              {d?.industry?.length ? <BarList rows={d.industry.map((g: any) => ({ name: `${g.industry} · ${g.loans} loans`, value: g.principal }))} format={(v) => money(v, true)} color={C.teal} /> : <Empty />}
            </Card>
            <Card title="Snapshot source mix" subtitle={d?.sourceMix?.date ? `As of ${dateLabel(d.sourceMix.date)}` : ""}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>LoanWell (legacy)</span><span className="font-semibold tabular-nums">{d?.sourceMix?.LoanWell ?? 0}</span></div>
                <div className="flex justify-between"><span>NED (after cutover)</span><span className="font-semibold tabular-nums">{d?.sourceMix?.NED ?? 0}</span></div>
                <p className="text-xs text-muted-foreground">Migrated loans count once, under the authority recorded in the NED crosswalk.</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="repayment" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Payments received (net of linked reversals)" subtitle="Principal, interest and fees reported separately">
              {d?.payments ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Principal", d.payments.principal],
                    ["Interest", d.payments.interest],
                    ["Fees", d.payments.fees],
                  ].map(([k, v]: any) => (
                    <div key={k} className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">{k}</div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">{money(v, true)}</div>
                    </div>
                  ))}
                  <div className="col-span-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <div>Counted: <b className="text-foreground">{d.payments.counted}</b></div>
                    <div>Failed excluded: <b className="text-foreground">{d.payments.excluded}</b></div>
                    <div>Reversals netted: <b className="text-foreground">{d.payments.reversalsApplied}</b></div>
                    <div>Reversals quarantined: <b className="text-foreground">{d.payments.reversalsQuarantined}</b></div>
                  </div>
                </div>
              ) : (
                <Empty />
              )}
            </Card>
            <Card title="Transaction type × status" subtitle="Raw row counts from approved imports — the forensic view">
              <SimpleTable dense columns={[{ key: "type", label: "Type" }, { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "completed" ? "green" : "red"}>{r.status}</Pill> }, { key: "rows", label: "Rows", align: "right" }]} rows={d?.forensics ?? []} />
            </Card>
            <Card title="Transaction status matrix" subtitle={`Proposed treatment · ${d?.rules?.txnStatusMatrixApproved ? "approved" : "awaiting lending approval"} · reversal rule ${d?.rules?.reversalRuleVersion ?? ""}`} className="lg:col-span-2">
              <SimpleTable columns={[{ key: "type", label: "Transaction type" }, { key: "status", label: "Status" }, { key: "treatment", label: "Treatment" }, { key: "counts", label: "In metrics", render: (r) => <Pill tone={r.counts === "Included" ? "green" : r.counts === "Excluded" ? "red" : "gold"}>{r.counts}</Pill> }]} rows={d?.matrix ?? []} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="register" className="mt-4">
          <Card title="Canonical loan register" subtitle="Restricted fields are hidden for roles without restricted access">
            <SimpleTable
              dense
              testId="table-loans"
              columns={[
                { key: "Loan_ID", label: "Loan", render: (r) => <span className="font-medium">{r.payload.Loan_ID}</span> },
                { key: "acct", label: "Account", render: (r) => r.payload.Source_Account_Number },
                { key: "fund", label: "Fund", render: (r) => r.payload.Subfund ?? r.payload.Funding_Source },
                { key: "status", label: "Status", render: (r) => <Pill tone={r.payload.Loan_Status === "Active" ? "green" : r.payload.Loan_Status === "Charged off" ? "red" : "muted"}>{r.payload.Loan_Status}</Pill> },
                { key: "type", label: "Repayment", render: (r) => r.payload.Repayment_Type ?? "—" },
                { key: "amt", label: "Original", align: "right", render: (r) => money(r.payload.Original_Amount) },
                { key: "fund_d", label: "Funded", render: (r) => dateLabel(r.payload.Funding_Date) },
                { key: "county", label: "County", render: (r) => r.payload.County ?? "—" },
                { key: "risk", label: "Risk", render: (r) => r.payload.Risk_Raw ?? "—" },
              ]}
              rows={(loans ?? []).slice(0, 80)}
            />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}

export { SERIES };
