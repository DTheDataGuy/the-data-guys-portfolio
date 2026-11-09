import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FlaskConical, Trash2, CheckCircle2, AlertTriangle, Clock, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { api, download, queryClient, useSession } from "@/lib/queryClient";
import { useWip, canEdit, canReview, fileToBase64, saveSetting } from "@/lib/app";
import { evalRecon, DEFAULT_TOL, type ReconItem, type ReconTol, type ReconOut, type Owners } from "@shared/recon";
import { PageHeader, Panel, Tag, Money, DataTable, Pill, Seg, Note, Empty, FileDrop, $, Kpi } from "@/components/kit";
import { Skeleton } from "./command";

type Ev = ReconItem & { out: ReconOut; wipFound: boolean };
const RES_TONE = { pass: "ok", cleared: "info", approval: "gold", exception: "bad", "n/a": "muted" } as const;

export default function MonthEndPage() {
  const w = useWip(); const s = useSession(); const { toast } = useToast();
  const q = useQuery<ReconItem[]>({ queryKey: [`/api/recon?period=${w.period?.id || ""}`], enabled: !!w.period });
  const saved: ReconTol = { ...DEFAULT_TOL, ...(w.boot?.settings.reconTol || {}) };
  const [tol, setTol] = useState<ReconTol>(saved);
  useEffect(() => setTol(saved), [JSON.stringify(saved)]);
  const owners: Owners = w.boot?.settings.owners as Owners;
  const [disp, setDisp] = useState<string>("all"); const [sel, setSel] = useState<Ev | null>(null); const [busy, setBusy] = useState(false);
  const items = useMemo<Ev[]>(() => {
    if (!q.data || !w.view) return [];
    const idx = new Map(w.view.all.map((r) => [`${r.entity}|${r.projectId}`, r]));
    return q.data.map((x) => { const r = idx.get(`${x.entity}|${x.project_id}`); return { ...x, out: evalRecon(x, r ? { A: r.A, E: r.E, C: r.C } : null, tol), wipFound: !!r }; });
  }, [q.data, w.view, tol]);
  if (!w.view || !w.period || !owners) return <div><PageHeader title="Month-end exceptions" /><Skeleton /></div>;
  const n = items.length, auto = items.filter((i) => i.out.disposition === "Auto-cleared").length, appr = items.filter((i) => i.out.disposition === "Needs approval").length, exc = items.filter((i) => i.out.disposition === "Exception").length;
  const hasSample = items.some((i) => i.sample); const dirty = JSON.stringify(tol) !== JSON.stringify(saved);
  const shown = disp === "all" ? items : items.filter((i) => i.out.disposition === disp);
  const upload = async (fs: File[]) => { setBusy(true); try { const f = fs[0]; const r = await api<{ rows: number }>("POST", "/api/recon/import", { filename: f.name, contentBase64: await fileToBase64(f), period: w.period!.id }); await queryClient.invalidateQueries(); toast({ title: `Loaded ${r.rows} reconciliation rows` }); } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); } finally { setBusy(false); } };
  const sample = async () => { setBusy(true); try { const r = await api<{ rows: number }>("POST", "/api/recon/sample", { period: w.period!.id }); await queryClient.invalidateQueries(); toast({ title: `Generated ${r.rows} sample rows`, description: "Clearly labeled Sample — not real CostPoint/HCSS data." }); } catch (e: any) { toast({ title: "Couldn’t generate", description: e.message, variant: "destructive" }); } finally { setBusy(false); } };
  const clearSample = async () => { await api("DELETE", `/api/recon/sample?period=${w.period!.id}`); await queryClient.invalidateQueries(); toast({ title: "Sample rows removed" }); };
  const SL = ({ k, label, min, max, step, fmt }: { k: keyof ReconTol; label: string; min: number; max: number; step: number; fmt: (v: number) => string }) => (
    <div><div className="mb-1.5 flex justify-between text-[12.5px]"><Label>{label}</Label><span className="font-semibold tnum">{fmt(tol[k])}</span></div><Slider value={[tol[k]]} min={min} max={max} step={step} onValueChange={([v]) => setTol({ ...tol, [k]: v })} disabled={!canEdit(s.user?.role)} data-testid={`slider-${k}`} /></div>
  );
  return (
    <div>
      <PageHeader title="Month-end exception layer" subtitle="Reconciles CostPoint actuals, HCSS / Procore actuals, EAC, WIP, change activity and management adjustments before the WIP is published. What can be explained clears automatically; only true exceptions route to an owner."
        tags={<><Tag kind="proposed">Proposed, pending executive approval</Tag>{hasSample ? <Tag kind="sample">Sample data present</Tag> : null}</>}
        actions={<><Button variant="outline" size="sm" onClick={() => download("/api/template/recon.xlsx", "Month_End_Recon_Template_PROPOSED_v0.1.xlsx")} data-testid="button-recon-template"><Download /> Reconciliation template</Button></>} />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Kpi label="Reconciliation lines" value={n} sub={hasSample ? "includes Sample rows" : "loaded for this period"} kind={hasSample ? "sample" : "source"} />
        <Kpi label="Auto-cleared" value={<span className="text-[hsl(var(--ok))]">{auto}</span>} sub={n ? `${Math.round((auto / n) * 100)}% explained without review` : "—"} how={{ formula: "every check passes, or the difference is explained by open AP/accrual timing, an approved CO, or a documented adjustment below materiality" }} />
        <Kpi label="Needs approval" value={<span className="text-amber-600 dark:text-amber-400">{appr}</span>} sub="explained, but above materiality or EAC re-forecast" how={{ formula: `documented adjustment ≥ ${$(tol.materiality)} or EAC move with reason but no approved CO` }} />
        <Kpi label="True exceptions" value={<span className="text-[hsl(var(--destructive))]">{exc}</span>} sub="routed to an owner for management review" tone="bad" how={{ formula: "unexplained difference beyond tolerance, EAC below actual (never auto-cleared), WIP mismatch, or pending COs ≥ threshold" }} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(owners) as (keyof Owners)[]).map((k) => { const mine = items.filter((i) => i.out.route === k); return (
              <div key={k} className="rounded-xl border bg-card p-4"><div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">{k === "actuals" ? "Actuals variances" : k === "eac" ? "EAC & forecast" : "Field & change activity"}</div><div className="mt-1 text-[14px] font-semibold">{owners[k]}</div><div className="mt-2 flex gap-3 text-[12.5px]"><span><b className="tnum">{mine.filter((i) => i.out.disposition === "Exception").length}</b> exceptions</span><span><b className="tnum">{mine.filter((i) => i.out.disposition === "Needs approval").length}</b> approvals</span></div></div>
            ); })}
          </div>
          <Panel pad={false} title="Reconciliation lines" subtitle="Matched to the governed WIP by entity + project ID (never by project ID alone)">
            {n ? <DataTable rows={shown} rowKey={(i) => i.id} onRow={setSel} pageSize={20} search={(i) => `${i.entity} ${i.project_id} ${i.project_name}`}
              toolbar={<Seg value={disp} onChange={setDisp} options={[{ value: "all", label: `All ${n}` }, { value: "Exception", label: `Exceptions ${exc}` }, { value: "Needs approval", label: `Approval ${appr}` }, { value: "Auto-cleared", label: `Cleared ${auto}` }]} />}
              cols={[
                { key: "d", label: "Disposition", render: (i) => <span className="inline-flex items-center gap-1.5">{i.out.disposition === "Auto-cleared" ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--ok))]" /> : i.out.disposition === "Exception" ? <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" /> : <Clock className="h-3.5 w-3.5 text-amber-500" />}{i.out.disposition}</span>, value: (i) => i.out.disposition },
                { key: "p", label: "Project", render: (i) => <span><b className="font-medium">{i.entity} {i.project_id}</b> <span className="text-muted-foreground">{(i.project_name || "").slice(0, 26)}</span>{i.sample ? <span className="ml-1.5 rounded bg-violet-500/15 px-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">SAMPLE</span> : null}</span>, value: (i) => `${i.entity}${i.project_id}` },
                { key: "cp", label: "CostPoint", align: "right", render: (i) => <Money v={i.cp} />, value: (i) => i.cp },
                { key: "f", label: "Field − CP", align: "right", render: (i) => <Money v={i.out.fieldDiff} />, value: (i) => i.out.fieldDiff },
                { key: "eac", label: "EAC Δ", align: "right", render: (i) => <Money v={i.eac !== null && i.prior_eac !== null ? i.eac - i.prior_eac : null} />, value: (i) => (i.eac ?? 0) - (i.prior_eac ?? 0) },
                { key: "r", label: "Routed to", render: (i) => i.out.route ? owners[i.out.route].split(" (")[0] : <span className="text-muted-foreground">—</span>, value: (i) => i.out.route },
                { key: "s", label: "Review", render: (i) => <Pill tone={i.status === "Resolved" || i.status === "Accepted" ? "ok" : i.status === "In review" ? "warn" : "muted"}>{i.status}</Pill>, value: (i) => i.status },
              ]} /> : <Empty title="No reconciliation data for this period yet" body={<>Upload the month-end reconciliation file (CostPoint, HCSS/Procore, EAC, prior EAC, change orders, adjustments) using the template. To see how the engine behaves before real data exists, generate a clearly labeled Sample set.</>} />}
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Load data">
            {canEdit(s.user?.role) ? <div className="space-y-3">
              <FileDrop onFiles={upload} busy={busy} label="Drop the reconciliation file" sub="Replaces the non-sample rows for this period" testid="drop-recon" />
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={sample} disabled={busy} data-testid="button-sample"><FlaskConical /> Generate sample</Button>{hasSample ? <Button size="sm" variant="ghost" onClick={clearSample}><Trash2 /> Clear sample</Button> : null}</div>
              <p className="text-[12px] text-muted-foreground">Sample rows are derived from real WIP cost and EAC with synthetic field/ERP differences, and are labeled Sample everywhere. They are never mixed into published figures.</p>
            </div> : <Note>View-only access.</Note>}
          </Panel>
          <Panel title="Auto-clear tolerances" subtitle="Move a slider and every line re-evaluates instantly" tags={<Tag kind="assumption" />}>
            <div className="space-y-4">
              <SL k="absTol" label="Absolute tolerance" min={0} max={50000} step={500} fmt={(v) => $(v)} />
              <SL k="pctTol" label="Percent tolerance (of actual)" min={0} max={0.03} step={0.0005} fmt={(v) => `${(v * 100).toFixed(2)}%`} />
              <SL k="eacMovePct" label="EAC move allowed without explanation" min={0} max={0.1} step={0.005} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
              <SL k="materiality" label="Materiality (adjustments need approval above)" min={25000} max={2000000} step={25000} fmt={(v) => $(v)} />
              <SL k="pendingCoPct" label="Pending CO exposure flag" min={0.02} max={0.3} step={0.01} fmt={(v) => `${(v * 100).toFixed(0)}% of contract`} />
              {canEdit(s.user?.role) ? <div className="flex gap-2"><Button size="sm" disabled={!dirty} onClick={async () => { await saveSetting("reconTol", tol); toast({ title: "Tolerances saved for everyone" }); }} data-testid="button-save-tol"><Save /> Save</Button><Button size="sm" variant="ghost" onClick={() => setTol(DEFAULT_TOL)}><RotateCcw /> Defaults</Button></div> : null}
              <p className="text-[12px] text-muted-foreground">Tolerance used = max(absolute, percent × CostPoint actual). EAC below actual is never auto-cleared.</p>
            </div>
          </Panel>
        </div>
      </div>
      <ReconSheet item={sel} onClose={() => setSel(null)} owners={owners} can={canReview(s.user?.role)} />
    </div>
  );
}

function ReconSheet({ item, onClose, owners, can }: { item: Ev | null; onClose: () => void; owners: Owners; can: boolean }) {
  const { toast } = useToast(); const [st, setSt] = useState(""); const [note, setNote] = useState(""); const [k, setK] = useState("");
  if (item && k !== item.id) { setK(item.id); setSt(item.status); setNote(item.note || ""); }
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[520px]">
        {item ? <div className="space-y-4">
          <div><div className="flex gap-2"><Pill tone={item.out.disposition === "Auto-cleared" ? "ok" : item.out.disposition === "Exception" ? "bad" : "gold"}>{item.out.disposition}</Pill>{item.sample ? <Tag kind="sample" /> : null}</div><SheetTitle className="mt-2 text-[18px]">{item.entity} {item.project_id}</SheetTitle><div className="text-[13px] text-muted-foreground">{item.project_name}{item.out.route ? ` · routed to ${owners[item.out.route]}` : ""}</div></div>
          {!item.wipFound ? <Note tone="warn">No matching WIP row for {item.entity} + {item.project_id}; WIP cross-checks are skipped.</Note> : null}
          <div className="grid grid-cols-2 gap-x-4 text-[13px]">
            {([["CostPoint actual", item.cp], ["HCSS actual", item.hcss], ["Procore actual", item.procore], ["Open AP / accrual", item.open_ap], ["EAC", item.eac], ["Prior-month EAC", item.prior_eac], ["Approved COs", item.approved_co], ["Pending COs", item.pending_co], ["Management adj.", item.mgmt_adj]] as [string, number | null][]).map(([l, v]) => <div key={l} className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{l}</span><Money v={v} /></div>)}
          </div>
          {item.adj_reason ? <div className="text-[12.5px]"><span className="text-muted-foreground">Adjustment reason:</span> “{item.adj_reason}”</div> : null}
          <div><div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Checks</div>
            <div className="space-y-2">{item.out.checks.map((c, i) => <div key={i} className="rounded-lg border p-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium">{c.label}</span><Pill tone={RES_TONE[c.result]}>{c.result === "cleared" ? "auto-cleared" : c.result}</Pill></div><div className="mt-1 text-[12.5px] text-muted-foreground">{c.detail}</div><div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{c.code}</div></div>)}</div>
          </div>
          {can ? <div className="space-y-2">
            <Label>Review status</Label>
            <Select value={st} onValueChange={setSt}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Open", "In review", "Resolved", "Accepted"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note" />
            <Button size="sm" onClick={async () => { try { await api("PATCH", `/api/recon/${item.id}`, { status: st, note }); await queryClient.invalidateQueries(); toast({ title: "Saved" }); onClose(); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } }}>Save</Button>
          </div> : null}
        </div> : null}
      </SheetContent>
    </Sheet>
  );
}
