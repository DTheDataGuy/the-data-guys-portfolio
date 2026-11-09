import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProjectDocs } from "@/components/docs";
import { Pencil, ShieldCheck, History as HistoryIcon, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip, canEdit, isExec, type Enriched } from "@/lib/app";
import { EXC_LABEL, EXC_GROUP, fcKey, phaseFor, DEFAULT_FC, type FcOverride } from "@shared/calc";
import { Tag, Money, Pill, P, $, HowCalc } from "./kit";

let openId: string | null = null; const subs = new Set<() => void>();
export const openProject = (id: string) => { openId = id; subs.forEach((f) => f()); };
const close = () => { openId = null; subs.forEach((f) => f()); };
const useOpen = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => openId);

const RULE_NAME: Record<string, string> = { "R-ICWO": "IC/IWO intercompany", "R-INACTIVE": "Inactive", "R-JV": "JV (reported separately)", "R-IWCT": "Internal work (IWCT)", "R-CCV": "Cascade Civil internal/equipment", "R-SRI": "Summit Inc small/prior-year", "R-RDG": "RDG equipment/internal", "R-CTRL": "Control / reconciliation row" };
export const ruleName = (id: string) => RULE_NAME[id] || id;

function Line({ k, v, kind, how }: { k: string; v: React.ReactNode; kind?: "source" | "calc"; how?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-[13px] last:border-0">
      <span className="flex items-center gap-1.5 text-muted-foreground">{k}{how ? <span className="font-mono text-[11px] opacity-70">({how})</span> : null}</span>
      <span className="flex items-center gap-2 text-right font-medium tnum">{v}{kind ? <span className={kind === "source" ? "h-1.5 w-1.5 rounded-full bg-slate-400" : "h-1.5 w-1.5 rounded-full bg-sky-500"} title={kind === "source" ? "Source value" : "Calculated"} /> : null}</span>
    </div>
  );
}

export function ProjectDrawerHost() {
  const id = useOpen(); const w = useWip(); const s = useSession(); const { toast } = useToast();
  const row = useMemo(() => w.view?.all.find((r) => r.id === id) || null, [w.view, id]);
  const [edit, setEdit] = useState(false);
  useEffect(() => setEdit(false), [id]);
  const hist = useQuery<any[]>({ queryKey: ["/api/rows", id || "", "history"], enabled: !!id });
  const ovs = useQuery<any[]>({ queryKey: ["/api/fc-overrides"] });
  const bonds = useQuery<any[]>({ queryKey: ["/api/bonds"] });
  if (!row) return <Sheet open={false} />;
  const m = row.m; const locked = w.period?.status === "published";
  const bond = row.bondNo ? bonds.data?.find((b) => b.bond_no === row.bondNo) : null;
  const ov = ovs.data?.find((o) => o.key === fcKey(row));
  const fcA = { ...DEFAULT_FC, ...(w.boot?.settings.fc || {}) };
  const ph = phaseFor(row, fcA, ov ? { key: ov.key, months: ov.months, startOffset: ov.start_offset, curve: ov.curve, note: ov.note } : undefined, w.period?.as_of || "2026-07-31");
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[560px]">
        <div className="sticky top-0 z-10 border-b bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground"><span className="font-semibold text-foreground">{row.entity}</span><span>·</span><span>{row.bu}</span><span>·</span><span className="truncate">{row.company}</span></div>
              <SheetTitle className="mt-1 text-[18px] font-semibold leading-6">{row.projectId} <span className="font-normal text-muted-foreground">— {row.projectName || "Unnamed"}</span></SheetTitle>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.eligible ? <Pill tone="ok">Reporting eligible</Pill> : <Pill>Excluded</Pill>}
                {row.override ? <Pill tone="gold">Override: {row.override}</Pill> : null}
                <Pill tone={row.bondStatus === "Bonded" ? "info" : row.bondStatus === "Needs Review" ? "warn" : "muted"}>{row.bondStatus}</Pill>
                {row.edited ? <Pill tone="gold">Edited in app</Pill> : null}
                {row.status ? <Pill>{row.status}</Pill> : null}
              </div>
            </div>
            <button onClick={close} className="rounded p-1 hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="space-y-5 px-5 py-4">
          {!row.eligible && row.reasons.length ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-[13px]"><div className="mb-1 font-medium">Why this row is excluded</div><ul className="list-disc pl-5 text-muted-foreground">{row.reasons.map((r) => <li key={r}>{ruleName(r)} <span className="font-mono text-[11px]">{r}</span></li>)}</ul></div>
          ) : null}
          {row.exc.length ? (
            <div><div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Exceptions</div><div className="flex flex-wrap gap-1.5">{row.exc.map((c) => <Pill key={c} tone={EXC_GROUP[c] === "Financial" ? "bad" : EXC_GROUP[c] === "Bond" ? "warn" : "info"}>{EXC_LABEL[c]}</Pill>)}</div></div>
          ) : null}

          {edit ? <EditForm row={row} onDone={() => setEdit(false)} /> : (
            <>
              <section>
                <div className="mb-1 flex items-center justify-between"><div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Source values</div><Tag kind="source" /></div>
                <Line k="Original contract" v={<Money v={row.orig} />} kind="source" />
                <Line k="Contract mods" v={<Money v={row.mods} />} kind="source" />
                <Line k="Current / revised contract" how="C" v={<Money v={row.C} />} kind="source" />
                <Line k="ITD earned revenue" how="R" v={<Money v={row.R} />} kind="source" />
                <Line k="EAC (estimated cost at completion)" how="E" v={<Money v={row.E} />} kind="source" />
                <Line k="ITD cost" how="A" v={<Money v={row.A} />} kind="source" />
                <Line k="Billings" how="B" v={<Money v={row.B} />} kind="source" />
                {m.missing.length ? <p className="mt-1.5 text-[12px] text-amber-700 dark:text-amber-300">Blank in source: {m.missing.join(", ")}. Shown as blank; the formula treats blank as $0 exactly as the workbook does.</p> : null}
              </section>
              <section>
                <div className="mb-1 flex items-center justify-between"><div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Governed calculations</div><Tag kind="calc" /></div>
                <Line k="Remaining contract" how="C − R" v={<Money v={m.remC} />} kind="calc" />
                <Line k="Remaining cost" how="E − A" v={<Money v={m.remCost} />} kind="calc" />
                <Line k="Remaining GP" how="(C − R) − (E − A)" v={<Money v={m.remGP} />} kind="calc" />
                <Line k="Remaining GM" how="remaining GP ÷ remaining contract" v={m.remGM === null ? <span className="text-muted-foreground" title={m.remGMReason || ""}>N/A · {m.remGMReason}</span> : P(m.remGM, 2)} kind="calc" />
                <Line k="ITD gross profit" how="R − A" v={<Money v={m.itdGP} />} kind="calc" />
                <Line k="Forecast GP at completion" how="C − E" v={<Money v={m.fcGP} />} kind="calc" />
                <Line k="Forecast GM at completion" how="(C − E) ÷ C" v={P(m.fcGM, 2)} kind="calc" />
                <Line k="Over / (under) billed" how="B − R" v={<Money v={m.ob} />} kind="calc" />
                <Line k="Percent complete (cost)" how="A ÷ E" v={P(m.pctCost, 1)} kind="calc" />
                <Line k="Contract vs original + mods" how="C − (orig + mods)" v={<Money v={m.reconDiff} />} kind="calc" />
                {m.remGMReason === "Remaining contract is zero" ? <p className="mt-1.5 text-[12px] text-muted-foreground">Legacy workbook shows 0% here; the governed view shows N/A because the denominator is zero.</p> : null}
              </section>
              <section>
                <div className="mb-1 flex items-center justify-between"><div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Bond</div><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div>
                <Line k="Bond number" v={row.bondNo ? <span className="font-mono">{row.bondNo}</span> : "—"} />
                <Line k="Bond status (source)" v={row.bondStatusRaw || "—"} />
                <Line k="Match method" v={<span className="max-w-[260px] truncate text-right text-[12px] font-normal" title={row.bondMethod || ""}>{row.bondMethod || "—"}</span>} />
                {bond ? <><Line k="Principal" v={bond.principal} /><Line k="Bond amount (penal sum — not capacity)" v={<Money v={bond.amount} />} /><Line k="Effective → expiry" v={`${bond.eff || "—"} → ${bond.exp || "—"}`} /></> : row.bondNo ? <p className="mt-1 text-[12px] text-muted-foreground">No matching bond in the reference list.</p> : null}
              </section>
              <section>
                <div className="mb-1 flex items-center justify-between"><div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Forecast phasing</div><Tag kind="assumption" /></div>
                <Line k="Remaining duration" v={`${ph.months} months`} />
                <Line k="Start offset" v={`${ph.start} months`} />
                <Line k="Curve" v={ph.curve} />
                <Line k="Basis" v={ph.basis} />
                {(m.remC || 0) < 0 ? <p className="mt-1 text-[12px] text-amber-700 dark:text-amber-300">Negative remaining contract is held out of phasing for review — not forced into the forecast.</p> : null}
                {canEdit(s.user?.role) ? <PhaseEditor row={row} ov={ov} /> : null}
              </section>
              <section>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Lineage</div>
                <Line k="Source file" v={<span className="max-w-[280px] truncate text-[12px] font-normal" title={row.sourceFile}>{row.sourceFile}</span>} />
                <Line k="Sheet · row" v={`${row.sourceSheet || "—"} · ${row.sourceRow ?? "—"}`} />
                <Line k="Customer" v={row.customer || "—"} /><Line k="PM" v={row.pm || "—"} />
              </section>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {canEdit(s.user?.role) && !edit ? <Button size="sm" variant="outline" disabled={locked} onClick={() => setEdit(true)} title={locked ? "Published periods are locked — reopen in Close & Publish" : ""} data-testid="button-edit-row"><Pencil /> {locked ? "Locked (published)" : "Edit values"}</Button> : null}
            {isExec(s.user?.role) ? <OverrideButton row={row} /> : null}
          </div>
          <ProjectDocs entity={row.entity} projectId={row.projectId} period={row.period} />
          <section>
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"><HistoryIcon className="h-3.5 w-3.5" /> Change history</div>
            {hist.data?.length ? hist.data.map((h) => { const d = h.detail ? JSON.parse(h.detail) : {}; return (
              <div key={h.id} className="border-b border-border/60 py-2 text-[12.5px] last:border-0">
                <div className="flex justify-between"><span className="font-medium">{h.user_name}</span><span className="text-muted-foreground">{new Date(h.at).toLocaleString()}</span></div>
                <div className="text-muted-foreground">{h.action === "row.edit" ? Object.entries(d.diffs || {}).map(([k, v]: any) => `${k}: ${v.from ?? "blank"} → ${v.to ?? "blank"}`).join("; ") : h.action === "row.override" ? `Eligibility override: ${d.mode || "cleared"}` : h.action}</div>
                {d.reason ? <div className="mt-0.5 italic text-muted-foreground">“{d.reason}”</div> : null}
              </div>
            ); }) : <p className="text-[12.5px] text-muted-foreground">No changes since import. Source values are exactly as submitted.</p>}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
  function OverrideButton({ row }: { row: Enriched }) {
    const [open, setOpen] = useState(false); const [mode, setMode] = useState<string>(row.override || "none"); const [reason, setReason] = useState(row.overrideReason || "");
    if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)} data-testid="button-override">Eligibility override</Button>;
    return (
      <div className="w-full space-y-2 rounded-lg border p-3">
        <Label>Eligibility override</Label>
        <Select value={mode} onValueChange={setMode}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No override — follow the rules</SelectItem><SelectItem value="include">Force include</SelectItem><SelectItem value="exclude">Force exclude</SelectItem></SelectContent></Select>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required, recorded in the audit trail)" rows={2} />
        <div className="flex gap-2"><Button size="sm" onClick={async () => { try { await api("POST", `/api/rows/${row.id}/override`, { mode: mode === "none" ? null : mode, reason }); await queryClient.invalidateQueries(); toast({ title: "Override saved" }); setOpen(false); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } }}>Save</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
      </div>
    );
  }
}

function PhaseEditor({ row, ov }: { row: Enriched; ov: any }) {
  const { toast } = useToast(); const [months, setMonths] = useState<string>(ov?.months ? String(ov.months) : ""); const [start, setStart] = useState<string>(ov?.start_offset ? String(ov.start_offset) : ""); const [curve, setCurve] = useState<string>(ov?.curve || "default");
  const save = async (clear = false) => {
    try {
      await api("PUT", "/api/fc-overrides", clear ? { key: fcKey(row), months: null, startOffset: null, curve: null } : { key: fcKey(row), months: months ? Number(months) : null, startOffset: start ? Number(start) : null, curve: curve === "default" ? null : curve });
      await queryClient.invalidateQueries({ queryKey: ["/api/fc-overrides"] }); toast({ title: clear ? "Phasing reset to defaults" : "Phasing override saved" }); if (clear) { setMonths(""); setStart(""); setCurve("default"); }
    } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); }
  };
  return (
    <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-2.5">
      <div><Label className="text-[11px]">Months left</Label><Input className="h-8" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} placeholder="default" /></div>
      <div><Label className="text-[11px]">Start in (mo)</Label><Input className="h-8" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value.replace(/\D/g, ""))} placeholder="0" /></div>
      <div><Label className="text-[11px]">Curve</Label><Select value={curve} onValueChange={setCurve}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Default</SelectItem><SelectItem value="straight">Straight</SelectItem><SelectItem value="front">Front-loaded</SelectItem><SelectItem value="back">Back-loaded</SelectItem></SelectContent></Select></div>
      <div className="col-span-3 flex gap-2"><Button size="sm" onClick={() => save()} data-testid="button-save-phase">Save phasing</Button>{ov ? <Button size="sm" variant="ghost" onClick={() => save(true)}>Reset</Button> : null}</div>
    </div>
  );
}

const FIELDS: [string, string, "num" | "str" | "date"][] = [
  ["C", "Current / revised contract", "num"], ["R", "ITD earned revenue", "num"], ["E", "EAC", "num"], ["A", "ITD cost", "num"], ["B", "Billings", "num"],
  ["orig", "Original contract", "num"], ["mods", "Contract mods", "num"], ["status", "Status", "str"], ["bond_no", "Bond number", "str"], ["bond_status_raw", "Bond status", "str"],
  ["end_date", "Est. completion date", "date"], ["start_date", "Start date", "date"], ["pm", "Project manager", "str"],
];
const ROWKEY: Record<string, string> = { C: "C", R: "R", E: "E", A: "A", B: "B", orig: "orig", mods: "mods", status: "status", bond_no: "bondNo", bond_status_raw: "bondStatusRaw", end_date: "endDate", start_date: "startDate", pm: "pm" };
function EditForm({ row, onDone }: { row: Enriched; onDone: () => void }) {
  const { toast } = useToast();
  const init = Object.fromEntries(FIELDS.map(([k]) => [k, (row as any)[ROWKEY[k]] ?? ""]));
  const [v, setV] = useState<Record<string, any>>(init); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const changed = FIELDS.filter(([k]) => String(v[k] ?? "") !== String(init[k] ?? ""));
  const save = async () => {
    setBusy(true);
    try { await api("PATCH", `/api/rows/${row.id}`, { changes: Object.fromEntries(changed.map(([k]) => [k, v[k]])), reason }); await queryClient.invalidateQueries(); toast({ title: "Saved", description: `${changed.length} field(s) updated; the original values are kept in history.` }); onDone(); }
    catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 rounded-xl border p-3.5">
      <div className="text-[13px] font-semibold">Edit source values</div>
      <p className="text-[12px] text-muted-foreground">Leave a field blank if the value is unknown — blanks are never treated as zero on the row. Every edit needs a reason and is logged with the original value.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {FIELDS.map(([k, label, t]) => (
          <div key={k}><Label className="text-[11.5px]">{label}</Label><Input className="h-8 tnum" type={t === "date" ? "date" : "text"} inputMode={t === "num" ? "decimal" : undefined} value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} data-testid={`input-edit-${k}`} /></div>
        ))}
      </div>
      <div><Label className="text-[11.5px]">Reason for change (required)</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Corrected EAC per PM re-forecast 8/5" data-testid="input-edit-reason" /></div>
      <div className="flex items-center gap-2"><Button size="sm" disabled={busy || !changed.length || reason.trim().length < 3} onClick={save} data-testid="button-save-row">{busy ? "Saving…" : `Save ${changed.length || ""} change${changed.length === 1 ? "" : "s"}`}</Button><Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button></div>
    </div>
  );
}
