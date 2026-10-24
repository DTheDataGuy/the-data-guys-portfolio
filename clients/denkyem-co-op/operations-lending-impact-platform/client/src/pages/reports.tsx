import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader, Card, Empty, Pill, KpiGrid, DownloadLink, Callout, ErrorState, BrandMark } from "@/components/kit";
import { apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { useApp } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dateTimeLabel } from "@/lib/format";
import { Printer, Plus, ShieldCheck, Globe2, FileText } from "lucide-react";
import { CLIENT_REVIEW } from "@shared/release";

const SECTIONS = [
  ["lending", "Lending"],
  ["impact", "Programs & impact"],
  ["crp", "CRP reporting"],
  ["crsp", "CRSP services"],
  ["engagement", "Community & engagement"],
  ["fundraising", "Fundraising"],
  ["finance", "Finance"],
  ["surveys", "Surveys & journeys"],
  ["ned", "NED migration"],
];
const REL: Record<string, { label: string; tone: any }> = {
  draft: { label: "Draft", tone: "muted" },
  approved_internal: { label: "Approved — internal", tone: "gold" },
  released_external: { label: "Released externally", tone: "green" },
};

export default function Reports() {
  const { role, demo, filters } = useApp();
  const { toast } = useToast();
  const { data: views, error } = useQuery<any[]>({ queryKey: ["/api/reports", { _r: role, _d: demo }] });
  const [sel, setSel] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("Internal");
  const [secs, setSecs] = useState<string[]>(["lending", "impact"]);
  useEffect(() => {
    if (views?.length && (!sel || !views.find((v) => v.id === sel))) setSel(views[0].id);
    if (views && !views.length) setSel(null);
  }, [views, sel]);
  const { data: rep, error: repErr } = useQuery<any>({ queryKey: [`/api/reports/${sel}/data`, { _r: role, _d: demo }], enabled: !!sel });
  const create = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/reports", { name, audience, sections: secs, filters })).json(),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setSel(r.id);
      setCreating(false);
      setName("");
      toast({ title: "Report view saved as draft" });
    },
    onError: (e: ApiError) => toast({ title: "Not saved", description: e.message, variant: "destructive" }),
  });
  const release = useMutation({
    mutationFn: async (status: string) => (await apiRequest("POST", `/api/reports/${sel}/release`, { status })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Release status updated" });
    },
    onError: (e: ApiError) => toast({ title: "Release blocked", description: e.message, variant: "destructive" }),
  });
  if (error) return <ErrorState error={error} />;
  const view = views?.find((v) => v.id === sel);
  const canRelease = ["admin", "leadership"].includes(role);
  const canCreate = ["admin", "leadership", "program", "lending", "finance"].includes(role);
  if (CLIENT_REVIEW) return <div>
    <PageHeader kicker="Reporting" title="Approved reports"
      description="Board, funder and operating reports are released only after source reconciliation and approval." />
    <Card><Empty title="No reports released">Supplied source records are under review. No sample reports or unapproved financial results are shown.</Empty></Card>
  </div>;
  return (
    <div>
      <div className="no-print">
        <PageHeader
          kicker="Reporting"
          title={role === "funder" ? "Released reports" : "Report builder"}
          description={role === "funder" ? "Approved aggregate reports shared with you by Denkyem. Small groups are suppressed and no individual records are included." : "Save a set of sections and filters as a named view, approve it internally, then release it to board or funders. Exports carry the same definitions, status labels and suppression."}
          actions={
            canCreate && (
              <Button onClick={() => setCreating((c) => !c)} data-testid="button-new-report">
                <Plus className="mr-1.5 h-4 w-4" /> New report view
              </Button>
            )
          }
        />
      </div>
      {creating && (
        <Card title="New report view" className="no-print mb-4">
          <div className="grid gap-4 md:grid-cols-[1fr_200px]">
            <div>
              <Label className="mb-1.5 block text-[13px]">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 board packet" data-testid="input-report-name" />
            </div>
            <div>
              <Label className="mb-1.5 block text-[13px]">Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger data-testid="select-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Internal", "Board", "Funder"].map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
            {SECTIONS.map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Checkbox checked={secs.includes(k)} onCheckedChange={(v) => setSecs((s) => (v ? [...s, k] : s.filter((x) => x !== k)))} data-testid={`check-section-${k}`} />
                {l}
              </label>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Current page filters are saved with the view.</div>
          <Button className="mt-4" onClick={() => create.mutate()} disabled={!name || !secs.length || create.isPending} data-testid="button-save-report">
            Save draft view
          </Button>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card title="Saved views" bodyClass="p-0" className="no-print h-fit">
          <div className="divide-y">
            {views?.map((v) => (
              <button key={v.id} onClick={() => setSel(v.id)} className={`block w-full px-4 py-3 text-left ${sel === v.id ? "bg-accent" : "hover:bg-muted/50"}`} data-testid={`report-${v.id}`}>
                <div className="text-sm font-medium">{v.name}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Pill tone={REL[v.releaseStatus]?.tone}>{REL[v.releaseStatus]?.label ?? v.releaseStatus}</Pill>
                  <span className="text-[11px] text-muted-foreground">{v.audience}</span>
                </div>
              </button>
            ))}
            {!views?.length && <div className="p-4 text-sm text-muted-foreground">{role === "funder" ? "No reports have been released to you yet." : "No views yet."}</div>}
          </div>
        </Card>
        <div className="min-w-0">
          {!view ? (
            <Empty title="No report selected" icon={FileText} />
          ) : repErr ? (
            <ErrorState error={repErr} />
          ) : (
            <div className="rounded-xl border bg-card p-5 md:p-7 print-sheet">
              <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <BrandMark className="h-10 w-10 text-primary" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--chart-3))]">Denkyem Co-op · {view.audience} report</div>
                    <h2 className="font-serif text-2xl font-semibold leading-tight">{view.name}</h2>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Generated {dateTimeLabel(rep?.generatedAt)} · groups under {rep?.suppression} suppressed{demo ? " · DEMONSTRATION DATA — fictitious" : ""}
                    </div>
                  </div>
                </div>
                <div className="no-print flex flex-wrap gap-2">
                  <DownloadLink href={`/api/reports/${view.id}/export`} testId="download-report">CSV</DownloadLink>
                  <Button variant="outline" onClick={() => window.print()} data-testid="button-print">
                    <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
                  </Button>
                </div>
              </div>
              {canRelease && (
                <div className="no-print mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="mr-1 font-medium">Release:</span>
                  <Pill tone={REL[view.releaseStatus]?.tone}>{REL[view.releaseStatus]?.label}</Pill>
                  {view.releaseStatus === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => release.mutate("approved_internal")} data-testid="button-approve-internal">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Approve for internal use
                    </Button>
                  )}
                  {view.releaseStatus === "approved_internal" && (
                    <Button size="sm" onClick={() => release.mutate("released_external")} data-testid="button-release-external">
                      <Globe2 className="mr-1.5 h-3.5 w-3.5" /> Release to board / funders
                    </Button>
                  )}
                  {view.releaseStatus !== "draft" && (
                    <Button size="sm" variant="ghost" onClick={() => release.mutate("draft")} data-testid="button-withdraw">
                      Withdraw to draft
                    </Button>
                  )}
                  {view.approvedBy && <span className="text-xs text-muted-foreground">by {view.approvedBy} · {dateTimeLabel(view.approvedAt)}</span>}
                </div>
              )}
              <div className="mt-6 space-y-8">
                {rep?.sections.map((s: any) => (
                  <section key={s.id}>
                    <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
                      <span className="h-4 w-1 rounded bg-[hsl(var(--chart-2))]" /> {s.title}
                    </h3>
                    {s.restricted ? <div className="text-sm text-muted-foreground">Not visible for your role.</div> : <KpiGrid items={s.kpis} cols={4} />}
                  </section>
                ))}
              </div>
              <div className="mt-8">
                <Callout>Every figure carries its status. Verified values come from approved, reconciled sources; provisional values depend on rules still awaiting sign-off; “Not available” means the source has not been supplied and is never shown as zero.</Callout>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
