import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip, isExec, saveSetting, type Rule } from "@/lib/app";
import type { LossBasis } from "@shared/calc";
import { PageHeader, Panel, Tag, DataTable, Pill, Note, $, P } from "@/components/kit";
import { Skeleton } from "./command";

type Fx = { id: string; name: string; formula: string; where: string; notes: string; kind: "calc" | "forecast" | "assumption" };
const FORMULAS: { group: string; items: Fx[] }[] = [
  { group: "Core WIP", items: [
    { id: "F1", name: "Remaining contract", formula: "C − R", where: "Current contract − ITD earned revenue", notes: "Negative results are flagged NEG_REMC and excluded from the forecast", kind: "calc" },
    { id: "F2", name: "Remaining cost", formula: "E − A", where: "EAC − ITD cost", notes: "EAC below actual is flagged EAC_LT_ACTUAL", kind: "calc" },
    { id: "F3", name: "Remaining gross profit", formula: "(C − R) − (E − A)", where: "Remaining contract − remaining cost", notes: "Blank inputs follow the workbook convention (treated as 0 in the subtraction) and the row is flagged MISSING_INPUT", kind: "calc" },
    { id: "F4", name: "Remaining GM % (weighted)", formula: "Σ remaining GP ÷ Σ remaining contract", where: "Computed on totals of any group", notes: "Never an average of project percentages. Row-level is N/A when C − R = 0 (ZERO_DENOM)", kind: "calc" },
    { id: "F5", name: "ITD gross profit", formula: "R − A", where: "Earned revenue − ITD cost", notes: "Legacy loss ranking shows this value", kind: "calc" },
    { id: "F6", name: "Forecast gross profit", formula: "C − E", where: "Contract − EAC", notes: "Used when the loss basis is set to Forecast", kind: "calc" },
    { id: "F7", name: "Forecast GM %", formula: "(C − E) ÷ C", where: "Per project", notes: "N/A when C = 0", kind: "calc" },
    { id: "F8", name: "Over / (under) billing", formula: "B − R", where: "Billings − earned revenue", notes: "Negative = underbilled. Blank billings stay unknown, never zero", kind: "calc" },
    { id: "F9", name: "Percent complete (cost)", formula: "A ÷ E", where: "ITD cost ÷ EAC", notes: "N/A when E is blank or 0", kind: "calc" },
    { id: "F10", name: "Contract reconciliation", formula: "C − (original + modifications)", where: "Per project", notes: "A difference of $1 or more is flagged CONTRACT_RECON", kind: "calc" },
  ] },
  { group: "Exceptions & bonds", items: [
    { id: "E1", name: "Projected loss", formula: "Legacy flag | R − A < −threshold | C − E < −threshold", where: "Loss basis selector", notes: "Default is the approved workbook’s legacy flag (13 in July)", kind: "calc" },
    { id: "E2", name: "Underbilled", formula: "B − R < −$250,000", where: "Threshold editable", notes: "45 in July", kind: "calc" },
    { id: "E3", name: "Financial exceptions", formula: "loss ∪ underbilled", where: "Distinct projects", notes: "52 in July — a project in both counts once", kind: "calc" },
    { id: "E4", name: "Bonded share", formula: "Σ(C − R | Bonded, Number Unmatched) ÷ Σ(C − R | bond report)", where: "Bond report scope", notes: "62.18% in July", kind: "calc" },
  ] },
  { group: "Forecast, cash & capacity", items: [
    { id: "P1", name: "Monthly phased revenue", formula: "max(C − R, 0) × weightₖ", where: "k = month index from start offset", notes: "Months: override → end date → small-project rule → BU default. Straight weights = 1/n; front = (n−i)/Σ; back = (i+1)/Σ", kind: "forecast" },
    { id: "P2", name: "Monthly phased cost", formula: "max(E − A, 0) × weightₖ", where: "Same schedule as revenue", notes: "Margin by month = (rev − cost) ÷ rev", kind: "forecast" },
    { id: "P3", name: "Backlog gap month", formula: "first m where revenueₘ < target × threshold", where: "Target entered by you", notes: "Blank target ⇒ no gap is computed", kind: "forecast" },
    { id: "P4", name: "Weighted pipeline", formula: "Σ value × probability, straight over duration", where: "Open stages only", notes: "Requires value, probability, start and duration", kind: "forecast" },
    { id: "C1", name: "Receipts", formula: "revenue(m − billLag − collectLag) × (1 − retention)", where: "Cash model", notes: "Timing assumption model, not a bank forecast", kind: "assumption" },
    { id: "C2", name: "Retention release", formula: "Σ retained, paid 2 months after last revenue month + lags", where: "Per project", notes: "", kind: "assumption" },
    { id: "C3", name: "Billing position", formula: "+ underbillings ÷ N₁ − overbillings ÷ N₂", where: "First N months", notes: "Recovers current under/over billing", kind: "assumption" },
    { id: "C4", name: "Payments", formula: "cost(m − payLag)", where: "Cash model", notes: "", kind: "assumption" },
    { id: "C5", name: "Bond headroom", formula: "aggregate limit − bonded backlog − Σ(bonded pipeline × probability)", where: "Limits entered by you", notes: "Bond amounts are penal sums, not capacity", kind: "calc" },
  ] },
  { group: "Month-end reconciliation", items: [
    { id: "M1", name: "Tolerance", formula: "max(absolute tolerance, |base| × % tolerance)", where: "Per check", notes: "Defaults $5,000 / 0.5% — proposed, pending executive approval", kind: "assumption" },
    { id: "M2", name: "CostPoint ↔ field actuals", formula: "(HCSS or Procore) − CostPoint", where: "Auto-clears if within tolerance, or explained by open AP, or by a documented adjustment", notes: "Adjustments above materiality need approval", kind: "calc" },
    { id: "M3", name: "EAC movement", formula: "EAC − prior EAC vs max(prior × 2%, abs tol)", where: "Clears if explained by approved change orders", notes: "Otherwise routed to the forecast owner", kind: "calc" },
    { id: "M4", name: "WIP ties", formula: "WIP A − CostPoint; WIP E − recon EAC", where: "Against the loaded WIP row", notes: "EAC below actual is never auto-cleared", kind: "calc" },
    { id: "M5", name: "Pending change exposure", formula: "|pending COs| ÷ |C| ≥ 10%", where: "Routed to operations", notes: "", kind: "calc" },
  ] },
];

export default function RulesPage() {
  const w = useWip(); const s = useSession(); const { toast } = useToast();
  const [ed, setEd] = useState<Rule | null>(null); const [reason, setReason] = useState("");
  const [th, setTh] = useState<{ lossBasis: LossBasis; lossThreshold: string; underThreshold: string } | null>(null);
  if (!w.boot) return <div><PageHeader title="Rules & formulas" /><Skeleton /></div>;
  const rules = w.boot.rules; const exec = isExec(s.user?.role); const t = w.boot.settings.thresholds;
  const counts = new Map<string, number>(); for (const r of w.view?.all || []) for (const x of r.reasons) counts.set(x, (counts.get(x) || 0) + 1);
  const saveRule = async () => { if (!ed) return; if (reason.trim().length < 3) return toast({ title: "Add a reason for the change", variant: "destructive" }); try { await api("PUT", "/api/rules", { rules: rules.map((r) => r.id === ed.id ? ed : r), reason }); await queryClient.invalidateQueries(); setEd(null); setReason(""); toast({ title: `${ed.id} saved`, description: "Every page has been recalculated." }); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } };
  const reset = async () => { try { await api("POST", "/api/rules/reset"); await queryClient.invalidateQueries(); toast({ title: "Rules reset to the approved July set" }); } catch (e: any) { toast({ title: "Couldn’t reset", description: e.message, variant: "destructive" }); } };
  const saveTh = async () => { if (!th) return; const a = Number(th.lossThreshold.replace(/[$,]/g, "")), b = Number(th.underThreshold.replace(/[$,]/g, "")); if (!(a >= 0) || !(b >= 0)) return toast({ title: "Thresholds must be positive numbers", variant: "destructive" }); try { await saveSetting("thresholds", { lossBasis: th.lossBasis, lossThreshold: a, underThreshold: b }); setTh(null); toast({ title: "Thresholds saved" }); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } };
  return (
    <div>
      <PageHeader title="Rules & formulas" subtitle="Every eligibility rule, threshold and formula the app uses — versioned, with the basis for each. Change a rule and every page recalculates for everyone."
        actions={s.user?.role === "admin" ? <Button size="sm" variant="outline" onClick={reset}><RotateCcw /> Reset to approved set</Button> : null} />
      <Tabs defaultValue="rules">
        <TabsList className="mb-3"><TabsTrigger value="rules">Eligibility rules</TabsTrigger><TabsTrigger value="formulas" data-testid="tab-formulas">Formula catalog</TabsTrigger><TabsTrigger value="thresholds">Thresholds</TabsTrigger><TabsTrigger value="legacy">Workbook rules (legacy)</TabsTrigger></TabsList>
        <TabsContent value="rules">
          <Panel pad={false} subtitle="A row is reporting-eligible when no active rule excludes it. Eligibility overrides by an executive win over rules and are logged on the project.">
            <DataTable rows={rules} rowKey={(r) => r.id} pageSize={30} cols={[
              { key: "id", label: "Rule", render: (r) => <span className="block min-w-[180px] whitespace-normal"><span className="font-mono text-[12px]">{r.id}</span> <b className="ml-1 font-medium">{r.name}</b></span>, value: (r) => r.id },
              { key: "c", label: "Condition", render: (r) => <span className="block min-w-[200px] whitespace-normal text-[12.5px]">{r.condition}</span> },
              { key: "t", label: "Treatment", render: (r) => <span className="block min-w-[200px] whitespace-normal text-[12.5px]">{r.treatment}</span> },
              { key: "b", label: "Basis", render: (r) => r.status === "proposed" ? <span className="block min-w-[160px] whitespace-normal text-[12px] text-[hsl(var(--warn))]">{r.basis}</span> : <span className="text-[12px] text-muted-foreground">{r.basis}</span> },
              { key: "n", label: "Rows hit", align: "right", render: (r) => counts.get(r.id) ?? 0, value: (r) => counts.get(r.id) ?? 0 },
              { key: "v", label: "Version", align: "right", value: (r) => r.version },
              { key: "a", label: "Status", render: (r) => <span className="flex items-center gap-1.5">{r.active ? <Pill tone={r.status === "approved" ? "ok" : "gold"}>{r.status}</Pill> : <Pill>off</Pill>}{exec ? <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEd({ ...r, params: { ...r.params } }); }} aria-label={`Edit ${r.id}`}><Pencil className="h-3.5 w-3.5" /></Button> : null}</span> },
            ]} />
          </Panel>
        </TabsContent>
        <TabsContent value="formulas">
          <div className="space-y-4">{FORMULAS.map((g) => <Panel key={g.group} title={g.group} pad={false}>
            <div className="divide-y">{g.items.map((x) => <div key={x.id} className="grid gap-2 px-4 py-3 md:grid-cols-[48px_220px_1fr_1fr]">
              <span className="font-mono text-[11.5px] text-muted-foreground">{x.id}</span>
              <div><div className="text-[13.5px] font-medium">{x.name}</div><Tag kind={x.kind} className="mt-1" /></div>
              <div><code className="rounded bg-muted px-2 py-1 text-[12.5px]">{x.formula}</code><div className="mt-1 text-[12px] text-muted-foreground">{x.where}</div></div>
              <div className="text-[12.5px] text-muted-foreground">{x.notes}</div>
            </div>)}</div>
          </Panel>)}
            <Note>Letters: C current contract · R ITD earned revenue · E estimate at completion · A ITD cost · B ITD billings. IDs stay as text so leading zeros survive; rows are never de-duplicated by project ID alone — entity and source row are part of the key.</Note>
          </div>
        </TabsContent>
        <TabsContent value="thresholds">
          <Panel title="Exception thresholds" tags={<Tag kind="user" />} actions={exec || s.user?.role === "finance" ? (th ? null : <Button size="sm" variant="outline" onClick={() => setTh({ lossBasis: t.lossBasis, lossThreshold: String(t.lossThreshold), underThreshold: String(t.underThreshold) })}>Edit</Button>) : null}>
            {th ? <div className="grid max-w-2xl gap-3 md:grid-cols-3">
              <div><Label>Loss basis</Label><Select value={th.lossBasis} onValueChange={(v) => setTh({ ...th, lossBasis: v as LossBasis })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="legacy">Legacy workbook flag</SelectItem><SelectItem value="itd">ITD GP (R − A)</SelectItem><SelectItem value="forecast">Forecast GP (C − E)</SelectItem></SelectContent></Select></div>
              <div><Label>Loss threshold ($)</Label><Input value={th.lossThreshold} onChange={(e) => setTh({ ...th, lossThreshold: e.target.value })} /></div>
              <div><Label>Underbilled threshold ($)</Label><Input value={th.underThreshold} onChange={(e) => setTh({ ...th, underThreshold: e.target.value })} /></div>
              <div className="flex gap-2 md:col-span-3"><Button size="sm" onClick={saveTh}>Save</Button><Button size="sm" variant="ghost" onClick={() => setTh(null)}>Cancel</Button></div>
            </div> : <dl className="grid max-w-2xl gap-3 text-[13px] md:grid-cols-3"><div><dt className="text-muted-foreground">Loss basis</dt><dd className="font-medium">{t.lossBasis === "legacy" ? "Legacy workbook flag" : t.lossBasis === "itd" ? "ITD GP (R − A)" : "Forecast GP (C − E)"}</dd></div><div><dt className="text-muted-foreground">Loss threshold</dt><dd className="font-medium tnum">{$(t.lossThreshold)}</dd></div><div><dt className="text-muted-foreground">Underbilled threshold</dt><dd className="font-medium tnum">{$(t.underThreshold)}</dd></div></dl>}
            <div className="mt-3"><Note>The Close page’s reproduction tests always use the approved defaults (legacy basis, $100,000, $250,000), so changing thresholds here never breaks the July tie-out.</Note></div>
          </Panel>
        </TabsContent>
        <TabsContent value="legacy">
          <Panel pad={false} title="Rules as written in the approved workbook" subtitle="Shown unchanged for reference" tags={<Tag kind="legacy" />}>
            <DataTable rows={w.boot.legacyRules} rowKey={(r: any) => String(r.Rule)} pageSize={40} cols={Object.keys(w.boot.legacyRules[0] || {}).map((k) => ({ key: k, label: k, render: (r: any) => <span className="text-[12.5px]">{r[k] ?? "—"}</span>, value: (r: any) => r[k] }))} />
          </Panel>
        </TabsContent>
      </Tabs>
      <Dialog open={!!ed} onOpenChange={(o) => !o && setEd(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit {ed?.id}</DialogTitle><DialogDescription>Saving creates a new version and recalculates eligibility everywhere.</DialogDescription></DialogHeader>
        {ed ? <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3"><span className="text-[13px] font-medium">Rule active</span><Switch checked={ed.active} onCheckedChange={(v) => setEd({ ...ed, active: v })} data-testid="switch-rule-active" /></div>
          <div><Label>Status</Label><Select value={ed.status} onValueChange={(v) => setEd({ ...ed, status: v as any, basis: v === "approved" && ed.basis.startsWith("Proposed") ? `Approved by ${s.user?.name}` : ed.basis })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approved</SelectItem><SelectItem value="proposed">Proposed, pending executive approval</SelectItem></SelectContent></Select></div>
          {Object.entries(ed.params).map(([k, v]) => <div key={k}><Label>{k}</Label><Input value={Array.isArray(v) ? v.join(", ") : String(v)} onChange={(e) => setEd({ ...ed, params: { ...ed.params, [k]: Array.isArray(v) ? e.target.value.split(",").map((x) => x.trim()).filter(Boolean).map((x) => (typeof v[0] === "number" ? Number(x) : x)) : typeof v === "number" ? Number(e.target.value) : e.target.value } })} /></div>)}
          <div><Label>Reason for change</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="input-rule-reason" /></div>
        </div> : null}
        <DialogFooter><Button onClick={saveRule} data-testid="button-save-rule">Save new version</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
