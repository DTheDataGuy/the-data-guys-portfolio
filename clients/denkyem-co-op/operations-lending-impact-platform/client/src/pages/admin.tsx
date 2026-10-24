import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader, Card, Pill, SimpleTable, ErrorState, Callout } from "@/components/kit";
import { apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { useApp } from "@/lib/app-state";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dateTimeLabel, ago } from "@/lib/format";
import { PlayCircle, CheckCircle2, XCircle, Lock, Unlock, Check, Minus } from "lucide-react";

const RULE_TEXT: Record<string, [string, string]> = {
  loanStatusMappingApproved: ["Loan status mapping approved", "LoanWell statuses → active / paid off / charged off / written off. Until approved, lending KPIs stay Provisional."],
  txnStatusMatrixApproved: ["Transaction status matrix approved", "Which type/status combinations count as disbursed, collected or reversed."],
  delinquencyRulesApproved: ["Delinquency & revenue-based rules approved", "Days-past-due logic, including revenue-based repayment loans."],
  smallCellPolicyApproved: ["Small-cell suppression policy approved", "Groups below the threshold are hidden in every aggregate and export."],
  externalReleaseApproved: ["External aggregation & release policy approved", "Required before any report can be released to board or funders (outside demo mode)."],
  nedAdapterEnabled: ["NED adapter enabled", "Stays off until NED access, export format and cutover are confirmed. Manual NED imports still work."],
};

export default function Admin() {
  const { role, demo } = useApp();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const { data: rules, error } = useQuery<any>({ queryKey: ["/api/rules", { _r: role }] });
  const { data: sources } = useQuery<any[]>({ queryKey: ["/api/sources", { _r: role, _d: demo }] });
  const { data: locks } = useQuery<any[]>({ queryKey: ["/api/locks", { _r: role }] });
  const { data: acc } = useQuery<any>({ queryKey: ["/api/acceptance", { _r: role }] });
  const { data: meta } = useQuery<any>({ queryKey: ["/api/meta", { _r: role, _d: demo }] });
  const { data: audit } = useQuery<any[]>({ queryKey: ["/api/audit", { _r: role }], enabled: ["admin", "leadership"].includes(role) });
  const [lock, setLock] = useState({ domain: "finance", period: "", status: "closed", reason: "" });

  const setRule = useMutation({
    mutationFn: async (patch: any) => (await apiRequest("PUT", "/api/rules", patch)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Rule updated — dashboards recalculated" });
    },
    onError: (e: ApiError) => toast({ title: "Not updated", description: e.message, variant: "destructive" }),
  });
  const runAcc = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/acceptance/run")).json(),
    onSuccess: (r) => {
      queryClient.setQueryData(["/api/acceptance", { _r: role }], r);
      toast({ title: `Acceptance tests: ${r.passed} of ${r.total} passed` });
    },
    onError: (e: ApiError) => toast({ title: "Could not run", description: e.message, variant: "destructive" }),
  });
  const saveLock = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/locks", lock)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locks"] });
      setLock({ ...lock, reason: "" });
      toast({ title: `Period ${lock.status === "closed" ? "closed" : "reopened"}` });
    },
    onError: (e: ApiError) => toast({ title: "Not saved", description: e.message, variant: "destructive" }),
  });
  if (error) return <ErrorState error={error} />;
  const r = rules?.rules ?? {};
  return (
    <div>
      <PageHeader kicker="Governance" title="Administration" description="Business-rule approvals, source health, period locks, the audit trail and the acceptance test suite from the build brief." />
      <Tabs defaultValue="rules">
        <TabsList className="flex-wrap">
          <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-sources">Sources</TabsTrigger>
          <TabsTrigger value="locks" data-testid="tab-locks">Period locks</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Roles</TabsTrigger>
          <TabsTrigger value="tests" data-testid="tab-tests">Acceptance tests</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">Audit trail</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4 space-y-4">
          {!isAdmin && <Callout>Only administrators change rules. You can see current status.</Callout>}
          <Card title="Business-rule approvals" subtitle="Each switch records who approved it and when, and is audited">
            <div className="divide-y">
              {Object.entries(RULE_TEXT).map(([k, [t, d]]) => (
                <div key={k} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                  <Switch checked={!!r[k]} disabled={!isAdmin || setRule.isPending} onCheckedChange={(v) => setRule.mutate({ [k]: v })} data-testid={`switch-${k}`} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="text-sm font-medium">Small-cell threshold</div>
                  <div className="text-xs text-muted-foreground">Groups with fewer than this many are shown as “&lt;{r.smallCellThreshold}”.</div>
                </div>
                <Input type="number" min={1} className="w-20 tabular-nums" defaultValue={r.smallCellThreshold} key={r.smallCellThreshold} disabled={!isAdmin} onBlur={(e) => Number(e.target.value) !== r.smallCellThreshold && setRule.mutate({ smallCellThreshold: Number(e.target.value) })} data-testid="input-threshold" />
              </div>
              <div className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-medium">Reversal rule version</span>
                <Pill tone="amber">{r.reversalRuleVersion}</Pill>
              </div>
            </div>
          </Card>
          {meta?.txnMatrix && (
            <Card title="Proposed transaction status matrix" subtitle="Applied only once approved above">
              <SimpleTable dense columns={[{ key: "type", label: "Type", render: (x) => <span className="font-mono text-xs">{x.type}</span> }, { key: "status", label: "Status" }, { key: "treatment", label: "Treatment", render: (x) => <span className="text-xs text-muted-foreground">{x.treatment}</span> }, { key: "counts", label: "Counts as", render: (x) => <Pill tone={x.counts === "Excluded" ? "muted" : x.counts === "Included" ? "green" : "bronze"}>{x.counts}</Pill> }]} rows={meta.txnMatrix} />
          </Card>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card title="Source status" subtitle="A failed refresh keeps the last approved data and flags it">
            <SimpleTable
              dense
              testId="table-sources"
              columns={[
                { key: "label", label: "Dataset", render: (s) => (<div><div className="font-medium">{s.label}</div><div className="text-[11px] text-muted-foreground">{s.source}</div></div>) },
                { key: "owner", label: "Owner", render: (s) => <span className="text-xs">{s.owner}</span> },
                { key: "cadence", label: "Cadence", render: (s) => <span className="text-xs">{s.cadence}</span> },
                { key: "approvedRows", label: "Approved rows", align: "right" },
                { key: "last", label: "Last good import", render: (s) => <span className="text-xs">{s.lastSuccessfulImport ? ago(s.lastSuccessfulImport) : "Never"}</span> },
                { key: "state", label: "State", render: (s) => <Pill tone={s.state === "Approved data" ? "green" : s.state === "Refresh failed" ? "red" : s.state === "Demonstration" ? "gold" : "muted"}>{s.state}</Pill> },
              ]}
              rows={sources ?? []}
            />
          </Card>
        </TabsContent>

        <TabsContent value="locks" className="mt-4 grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card title="Close or reopen a period">
            <div className="space-y-3">
              <Select value={lock.domain} onValueChange={(v) => setLock({ ...lock, domain: v })}>
                <SelectTrigger data-testid="select-lock-domain"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["finance", "lending", "impact", "crp", "crsp", "engagement", "fundraising", "surveys"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="month" value={lock.period} onChange={(e) => setLock({ ...lock, period: e.target.value })} data-testid="input-lock-period" />
              <Select value={lock.status} onValueChange={(v) => setLock({ ...lock, status: v })}>
                <SelectTrigger data-testid="select-lock-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed">Close period</SelectItem>
                  <SelectItem value="reopened">Reopen period</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Reason (required to reopen)" value={lock.reason} onChange={(e) => setLock({ ...lock, reason: e.target.value })} data-testid="input-lock-reason" />
              <Button className="w-full" disabled={!lock.period || !["admin", "finance"].includes(role)} onClick={() => saveLock.mutate()} data-testid="button-save-lock">
                {lock.status === "closed" ? <Lock className="mr-1.5 h-4 w-4" /> : <Unlock className="mr-1.5 h-4 w-4" />} Save
              </Button>
            </div>
          </Card>
          <Card title="Lock history">
            <SimpleTable dense columns={[{ key: "domain", label: "Domain" }, { key: "period", label: "Period" }, { key: "status", label: "Status", render: (l) => <Pill tone={l.status === "closed" ? "green" : "amber"}>{l.status}</Pill> }, { key: "by", label: "By" }, { key: "at", label: "When", render: (l) => dateTimeLabel(l.at) }, { key: "reason", label: "Reason", render: (l) => <span className="text-xs">{l.reason ?? "—"}</span> }]} rows={locks ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card title="Role access" subtitle="Who reads and writes each domain. Sign-in and named accounts are set up once Denkyem confirms access owners.">
            {meta && (
              <SimpleTable
                dense
                columns={[
                  { key: "label", label: "Domain", render: (d) => <span className="font-medium">{d.label}</span> },
                  ...Object.entries(meta.roles).map(([rk, rv]: any) => ({
                    key: rk,
                    label: rv.label.split(" /")[0],
                    render: (d: any) => (d.writeRoles.includes(rk) ? <Pill tone="green">Edit</Pill> : d.readRoles.includes(rk) ? <Pill>View</Pill> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />),
                  })),
                ]}
                rows={Object.entries(meta.domains).map(([k, v]: any) => ({ key: k, ...v }))}
              />
            )}
            <div className="mt-3 text-xs text-muted-foreground">Board / funder viewers see released aggregate reports only. Restricted fields (names, emails, borrower contacts, demographics at row level) are stripped for roles without restricted access.</div>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="mt-4">
          <Card
            title="Acceptance tests (brief §13)"
            subtitle={acc ? `${acc.passed} of ${acc.total} passed · run ${dateTimeLabel(acc.ranAt)}` : "Run against an isolated in-memory copy; production data is untouched"}
            action={<Button size="sm" onClick={() => runAcc.mutate()} disabled={!isAdmin || runAcc.isPending} data-testid="button-run-tests"><PlayCircle className="mr-1.5 h-4 w-4" /> {runAcc.isPending ? "Running…" : "Run all"}</Button>}
          >
            {acc ? (
              <div className="divide-y">
                {acc.results.map((t: any) => (
                  <div key={t.id} className="flex gap-3 py-2.5" data-testid={`test-${t.id}`}>
                    {t.pass ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.id} · {t.name}</div>
                      <div className="text-xs text-muted-foreground">Expected: {t.expected}</div>
                      <div className="text-xs">Observed: {t.observed}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-sm text-muted-foreground">Not run yet in this session.</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card title="Audit trail" subtitle="Approvals, corrections, imports, rollbacks, rule changes, releases and exports">
            {audit ? (
              <SimpleTable dense testId="table-audit" columns={[{ key: "at", label: "When", render: (a) => <span className="text-xs">{dateTimeLabel(a.at)}</span> }, { key: "actor", label: "Who", render: (a) => <span className="text-xs">{a.actor} <span className="text-muted-foreground">({a.role})</span></span> }, { key: "action", label: "Action", render: (a) => <Pill>{a.action}</Pill> }, { key: "entity", label: "Entity", render: (a) => <span className="font-mono text-xs">{a.entity}{a.entityId ? ` #${a.entityId}` : ""}</span> }, { key: "detail", label: "Detail", render: (a) => <span className="line-clamp-1 text-xs text-muted-foreground">{a.detail}</span> }]} rows={audit} />
            ) : (
              <div className="text-sm text-muted-foreground">Administrator or leadership role required.</div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Check };
