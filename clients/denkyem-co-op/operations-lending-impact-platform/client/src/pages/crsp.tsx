import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useDash, KpiGrid, PageHeader, Card, Freshness, ErrorState, Empty, Callout, DownloadLink } from "@/components/kit";
import { ChartBox, tooltipStyle, axis, grid, C, BarList, Legend } from "@/components/charts";
import { axisNum, monthLabel, num } from "@/lib/format";
import { Lock } from "lucide-react";

const NAICS: Record<string, string> = { "722": "Food services (722)", "448": "Clothing retail (448)", "541": "Professional services (541)", "621": "Health care (621)", "238": "Specialty trades (238)", "711": "Arts & performance (711)", "812": "Personal care (812)", "484": "Trucking (484)" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Crsp() {
  const { data: d, error, isLoading } = useDash<any>("crsp");
  if (error) return <ErrorState error={error} />;
  const months = d ? Array.from(new Set(Object.keys(d.heat).map((k) => k.split("|")[0]))).sort().slice(-12) : [];
  const maxHeat = d ? Math.max(1, ...Object.values(d.heat as Record<string, number>)) : 1;
  return (
    <div>
      <PageHeader
        kicker="City of Seattle program"
        title="CRSP business services"
        description="Services are counted per visit; businesses are counted by their opaque ID, never by non-blank names. Average visits per business = visits ÷ distinct businesses."
        actions={<DownloadLink href="/api/export/dataset/crsp_service" testId="download-crsp">CRSP services CSV</DownloadLink>}
      />
      <KpiGrid items={d?.kpis} cols={4} loading={isLoading} />
      {d && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card title="Services and distinct businesses by month">
              {d.monthly.length ? (
                <>
                  <Legend items={[{ label: "Services", color: C.green }, { label: "Distinct businesses", color: C.gold }]} />
                  <ChartBox height={240}>
                    <ComposedChart data={d.monthly} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid {...grid} />
                      <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
                      <YAxis tickFormatter={axisNum} {...axis} width={34} />
                      <Tooltip {...tooltipStyle} labelFormatter={monthLabel} />
                      <Bar dataKey="services" name="Services" fill={C.green} radius={[3, 3, 0, 0]} />
                      <Line dataKey="businesses" name="Distinct businesses" stroke={C.gold} strokeWidth={2.5} dot={false} />
                    </ComposedChart>
                  </ChartBox>
                </>
              ) : (
                <Empty />
              )}
            </Card>
            <Card title="When services happen" subtitle="Visits by weekday, last 12 months">
              <div className="overflow-x-auto">
                <table className="text-[11px]">
                  <thead>
                    <tr>
                      <th />
                      {months.map((m) => (
                        <th key={m} className="px-0.5 pb-1 font-normal text-muted-foreground">
                          {monthLabel(m).split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, di) => (
                      <tr key={day}>
                        <td className="pr-2 text-muted-foreground">{day}</td>
                        {months.map((m) => {
                          const v = d.heat[`${m}|${di}`] || 0;
                          return (
                            <td key={m} className="p-0.5">
                              <div title={`${day} ${monthLabel(m)}: ${v}`} className="h-5 w-6 rounded-sm" style={{ background: v ? `hsl(164 60% 26% / ${0.15 + (v / maxHeat) * 0.85})` : "hsl(var(--muted))" }} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="Distinct businesses by industry">
              <BarList rows={d.industry.map((r: any) => ({ name: NAICS[r.name] ?? r.name, value: r.value, display: r.display }))} format={num} />
            </Card>
            <Card title="Services provided">
              <BarList rows={d.serviceMix} format={num} color={C.gold} />
            </Card>
            <Card title="How businesses found us" subtitle="Distinct businesses by referral source">
              <BarList rows={d.referral.map((r: any) => ({ name: r.name, value: r.value, display: r.display }))} format={num} color={C.bronze} />
            </Card>
          </div>
          <div className="mt-4">
            {d.demographics ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Gender" subtitle="Distinct businesses (owner-reported)">
                  <BarList rows={d.demographics.gender} format={num} color={C.teal} />
                </Card>
                <Card title="Race / ethnicity" subtitle="Distinct businesses (owner-reported)">
                  <BarList rows={d.demographics.race} format={num} color={C.teal} />
                </Card>
                <Card title="Language" subtitle="Distinct businesses">
                  <BarList rows={d.demographics.language} format={num} color={C.teal} />
                </Card>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> {d.demographicsNote}
              </div>
            )}
            {d.demographics && <p className="mt-2 text-xs text-muted-foreground">{d.demographicsNote}</p>}
          </div>
          <div className="mt-4">
            <Callout>Session durations arrive in mixed columns in the source workbook. They are mapped to one documented unit (minutes) at import, with the original column retained for audit.</Callout>
          </div>
        </>
      )}
      <div className="mt-6">
        <Freshness items={d?.freshness} />
      </div>
    </div>
  );
}
