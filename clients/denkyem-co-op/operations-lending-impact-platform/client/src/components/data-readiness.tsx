import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, FileCheck2, ShieldCheck, Database } from "lucide-react";
import { PageHeader, Card, Pill, ErrorState } from "@/components/kit";

export const AREAS: Record<string, { title: string; description: string; domains: string[]; needs: string; owner: string }> = {
  "/lending": { title: "Lending portfolio", description: "Pipeline, principal, disbursements and repayment performance.", domains: ["lending"], needs: "Loan register, dated principal snapshots, transaction history with IDs and statuses.", owner: "Kenny · Lending" },
  "/ned": { title: "NED migration", description: "Loan-level reconciliation between the legacy and new lending systems.", domains: ["lending"], needs: "NED Active Loan and Aging reports, migration crosswalk, cutover dates and lending sign-off.", owner: "Kenny · Paige · NED" },
  "/impact": { title: "Programs & impact", description: "Funding deployment, technical assistance and program outcomes.", domains: ["impact"], needs: "Program records, allocations, disbursements, service delivery and approved outcome definitions.", owner: "Amanda · Programs" },
  "/crp": { title: "CRP reporting", description: "Monthly grant activity, cumulative reporting and coverage.", domains: ["crp"], needs: "CRP reports with source confirmations and labels distinguishing period activity from cumulative totals.", owner: "Paige · Programs" },
  "/crsp": { title: "CRSP services", description: "Service visits, hours and distinct businesses served.", domains: ["crsp"], needs: "Service log with stable business IDs, dates and duration units.", owner: "Programs" },
  "/engagement": { title: "Community & engagement", description: "Events, membership and outreach in one reporting view.", domains: ["engagement"], needs: "Event attendance and registration exports, Mighty Networks membership snapshots and ActiveCampaign campaign results.", owner: "Amanda · Programs" },
  "/surveys": { title: "Surveys & feedback", description: "Participant feedback with instrument-specific scales and response counts.", domains: ["surveys"], needs: "Typeform or survey exports, questions, scoring rules and response denominators.", owner: "Amanda · Programs" },
  "/fundraising": { title: "Fundraising", description: "Opportunities, commitments and receipts, kept separate.", domains: ["fundraising"], needs: "Fundraising workbook, stage definitions, commitment dates and matched receipts.", owner: "Paige · Robin" },
  "/finance": { title: "Finance", description: "Finalized statements and promissory-note obligations.", domains: ["finance"], needs: "Finalized P&L and balance sheet for each reporting period, plus the promissory-note master.", owner: "Robin · Finance" },
};

export function DataGate({ path, children }: { path: string; children: ReactNode }) {
  const { data, error, isLoading } = useQuery<any[]>({ queryKey: ["/api/sources"] });
  if (error) return <ErrorState error={error} />;
  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-label="Loading source status" />;
  const area = AREAS[path];
  if (!area) return <>{children}</>;
  const sources = (data ?? []).filter(s => area.domains.includes(s.domain));
  // No-source state is explicit. It never becomes an empty chart or a zero KPI.
  if (sources.some(s => s.approvedRows > 0)) return <>{children}</>;
  return <div>
    <PageHeader kicker="Denkyem reporting" title={area.title} description={area.description} />
    <Card>
      <div className="py-8 md:py-12 text-center max-w-xl mx-auto">
        <Database className="mx-auto mb-5 h-9 w-9 text-primary" />
        <Pill tone="bronze">Source review in progress</Pill>
        <h2 className="mt-4 font-serif text-2xl font-semibold">Ready for verified source records</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{area.needs} Supplied Power BI extracts are being reconciled. Figures will appear only after review and release approval.</p>
        <div className="mt-5 text-xs text-muted-foreground">Source coordination: {area.owner}</div>
        <Link href="/guide" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">View data requirements <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </Card>
  </div>;
}

export function ReadinessHome() {
  return <div>
    <PageHeader kicker="Executive overview" title="Denkyem. One connected view."
      description="Lending, programs, community and finance, organized around the decisions your team makes." />
    <div className="mb-6 rounded-xl border bg-card px-5 py-5 md:px-7">
      <div className="flex items-start gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-primary" /><div>
        <h2 className="font-semibold">Source verification comes first</h2>
        <p className="mt-1 text-sm text-muted-foreground">No sample data. Supplied Power BI extracts are under review, not yet approved for publication. This public review site does not accept confidential uploads.</p>
      </div></div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(AREAS).filter(([p]) => p !== "/ned").map(([path, a]) => <Link key={path} href={path} className="rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors group">
        <FileCheck2 className="mb-5 h-5 w-5 text-[hsl(var(--chart-3))]" />
        <h2 className="font-serif text-xl font-semibold">{a.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>Source review in progress</span><ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" /></div>
      </Link>)}
    </div>
  </div>;
}

export function ReadinessGuide() {
  return <div>
    <PageHeader kicker="Source coordination" title="Data readiness"
      description="The records needed to establish accurate reporting. Share confidential files through an approved private channel, not this public website." />
    <div className="mb-5 rounded-xl border bg-card p-5 text-sm leading-relaxed">
      <h2 className="font-semibold mb-2">Start with the existing Power BI reports</h2>
      Three Power BI content exports have been supplied and staged privately. Their saved records, measures and source definitions are being checked; they are historical extracts, not a live refresh. Confirm the preferred version and last successful refresh date before reporting current performance.
    </div>
    <div className="grid gap-4 md:grid-cols-2">{Object.entries(AREAS).map(([path, a]) => <Card key={path} title={a.title} subtitle={a.owner}>
      <p className="text-sm text-muted-foreground leading-relaxed">{a.needs}</p>
    </Card>)}</div>
    <div className="mt-5 rounded-xl border p-5 text-sm text-muted-foreground">
      Architecture connections such as Eventbrite-to-CRM synchronization, SharePoint refresh, Luma and Google Analytics are not connected. Staff authentication and access approval are required before confidential operating records are loaded.
    </div>
  </div>;
}
