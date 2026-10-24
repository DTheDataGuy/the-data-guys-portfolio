import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, Download, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip, canEdit, isExec } from "@/lib/app";
import { PageHeader, Panel, Tag, DataTable, Pill, Money, Note, Seg, Kpi, $M, $ } from "@/components/kit";
import { Skeleton } from "./command";

export type MF = { period: string; entity: string; projectId: string; reserve: number | null; confidence: number | null; scenario: string | null; narrative: string | null; status: string; updatedAt: string; updatedBy: string | null; approvedBy: string | null; approvedAt: string | null };
/** Handoff formulas, exactly as specified — distinct calculations. */
export const weightedReserve = (reserve: number | null, conf: number | null) => (reserve == null || conf == null ? null : (reserve * conf) / 5);
export const expectedEac = (eac: number | null, reserve: number | null) => (eac == null || reserve == null ? null : eac - reserve);

function parseCsv(t: string): string[][] {
  const out: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === "," || c === "\t") { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim())) out.push(row); row = []; } else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) out.push(row); return out;
}

export default function MgmtPage() {
  const w = useWip(); const s = useSession(); const { toast } = useToast();
  const per = w.period?.id || "";
  const q = useQuery<MF[]>({ queryKey: ["/api/mgmt-fc", per], queryFn: () => api<MF[]>("GET", `/api/mgmt-fc?period=${encodeURIComponent(per)}`), enabled: !!per });
  const [show, setShow] = useState<"all" | "entry" | "draft" | "approved">("all");
  const [form, setForm] = useState<{ key: string; name: string; eac: number | null; reserve: string; confidence: string; scenario: string; narrative: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const edit = canEdit(s.user?.role); const approve = isExec(s.user?.role);
  const d = useMemo(() => {
    if (!w.view) return null;
    const mf = new Map((q.data || []).map((x) => [`${x.entity}|${x.projectId}`, x]));
    const cnt = new Map<string, number>(); for (const r of w.view.eligible) { const k = `${r.entity}|${r.projectId}`; cnt.set(k, (cnt.get(k) || 0) + 1); }
    const rows = w.view.eligible.map((r) => {
      const k = `${r.entity}|${r.projectId}`; const e = mf.get(k) || null; const dup = (cnt.get(k) || 0) > 1;
      return { r, k, e, dup, wr: e ? weightedReserve(e.reserve, e.confidence) : null, xe: e ? expectedEac(r.E, e.reserve) : null };
    });
    const cov = rows.filter((x) => x.e && !x.dup);
    const sum = (f: (x: typeof rows[number]) => number | null) => cov.reduce((a, x) => a + (f(x) ?? 0), 0);
    const withRes = cov.filter((x) => x.e!.reserve != null && x.r.E != null);
    return {
      rows, cov, dups: rows.filter((x) => x.e && x.dup).length,
      reserve: sum((x) => x.e!.reserve), wr: sum((x) => x.wr),
      eacFin: withRes.reduce((a, x) => a + (x.r.E || 0), 0), eacExp: withRes.reduce((a, x) => a + (x.xe || 0), 0), nRes: withRes.length,
      approved: cov.filter((x) => x.e!.status === "approved").length, draft: cov.filter((x) => x.e!.status !== "approved").length,
      sc: ["S1", "S2", "S3"].map((k) => ({ k, n: cov.filter((x) => x.e!.scenario === k).length })),
    };
  }, [w.view, q.data]);
  if (!d || !w.period) return <div><PageHeader title="Management forecast" /><Skeleton /></div>;
  const shown = d.rows.filter((x) => show === "all" ? true : show === "entry" ? !!x.e : show === "draft" ? x.e && x.e.status !== "approved" : x.e?.status === "approved");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/mgmt-fc", per] });
  const save = async () => {
    if (!form) return; const [entity, projectId] = form.key.split("|");
    const n = (v: string) => v.trim() === "" ? null : Number(v.replace(/[$,\s]/g, ""));
    setBusy(true);
    try {
      const out = await api<{ saved: number; cleared: number; errors: string[] }>("PUT", "/api/mgmt-fc", { period: per, items: [{ entity, projectId, reserve: n(form.reserve), confidence: n(form.confidence), scenario: form.scenario === "none" ? null : form.scenario, narrative: form.narrative.trim() || null }] });
      if (out.errors.length) toast({ title: "Not saved", description: out.errors[0], variant: "destructive" }); else { toast({ title: out.cleared ? "Entry cleared" : "Saved as draft", description: "Approval is reset whenever an entry changes." }); setForm(null); }
      await refresh();
    } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } finally { setBusy(false); }
  };
  const upload = async (f: File) => {
    const rows = parseCsv(await f.text()); if (rows.length < 2) return toast({ title: "No rows found", variant: "destructive" });
    const h = rows[0].map((x) => x.trim().toLowerCase()); const ix = (re: RegExp) => h.findIndex((x) => re.test(x));
    const iE = ix(/^entity/), iP = ix(/project/), iR = ix(/reserve/), iC = ix(/confidence/), iS = ix(/scenario/), iN = ix(/narrative|comment|note/);
    if (iE < 0 || iP < 0) return toast({ title: "Missing columns", description: "The file needs Entity and Project ID columns.", variant: "destructive" });
    const items = rows.slice(1).map((r) => ({ entity: r[iE]?.trim(), projectId: r[iP]?.trim(), reserve: iR >= 0 && r[iR]?.trim() ? Number(r[iR].replace(/[$,\s()]/g, "")) * (/\(/.test(r[iR]) ? -1 : 1) : null, confidence: iC >= 0 && r[iC]?.trim() ? Number(r[iC]) : null, scenario: iS >= 0 ? r[iS]?.trim() || null : null, narrative: iN >= 0 ? r[iN]?.trim() || null : null }));
    setBusy(true);
    try { const out = await api<{ saved: number; errors: string[] }>("PUT", "/api/mgmt-fc", { period: per, items }); await refresh(); toast({ title: `${out.saved} entries saved as draft`, description: out.errors.length ? `${out.errors.length} rows skipped — first: ${out.errors[0]}` : "Every row matched on entity + project ID.", variant: out.errors.length ? "destructive" : undefined }); }
    catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); } finally { setBusy(false); }
  };
  const template = () => {
    const lines = ["Entity,Project ID,Project name,Current EAC (source),FA reserve,Confidence (0-5),Scenario (S1/S2/S3),Narrative", ...d.rows.filter((x) => !x.dup).map((x) => [x.r.entity, x.r.projectId, `"${(x.r.projectName || "").replace(/"/g, '""')}"`, x.r.E ?? "", x.e?.reserve ?? "", x.e?.confidence ?? "", x.e?.scenario ?? "", `"${(x.e?.narrative || "").replace(/"/g, '""')}"`].join(","))];
    const b = new Blob([lines.join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `management-forecast-${per}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const approveAll = async () => {
    const keys = d.cov.filter((x) => x.e!.status !== "approved").map((x) => x.k); if (!keys.length) return;
    if (!confirm(`Approve ${keys.length} draft management entries for ${w.period!.label}? This is logged.`)) return;
    const out = await api<{ approved: number }>("POST", "/api/mgmt-fc/approve", { period: per, keys }); await refresh(); toast({ title: `${out.approved} entries approved` });
  };
  return (
    <div>
      <PageHeader title="Management forecast" subtitle="A management layer on top of the finance-reconciled WIP. FA reserve and confidence are management positions — they never change accounting WIP, and nothing here is pre-filled."
        tags={<><Tag kind="source">EAC from WIP</Tag><Tag kind="user">Reserve and confidence entered</Tag><Tag kind="calc" /><Tag kind="pending">S1/S2/S3 definitions pending</Tag></>}
        actions={<>
          <Button size="sm" variant="outline" onClick={template} data-testid="button-mf-template"><Download /> Download sheet</Button>
          {edit ? <label className="inline-flex"><input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }} data-testid="input-mf-upload" /><span className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"><Upload className="h-4 w-4" /> Upload CSV</span></label> : null}
          {approve && d.draft ? <Button size="sm" variant="outline" onClick={approveAll} disabled={busy} data-testid="button-mf-approve"><CheckCheck /> Approve {d.draft} draft{d.draft === 1 ? "" : "s"}</Button> : null}
        </>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Projects with an entry" value={`${d.cov.length} of ${d.rows.length}`} sub={`${d.approved} approved · ${d.draft} draft`} kind="user" />
        <Kpi label="FA reserve" value={$M(d.reserve)} sub={$(d.reserve, 2)} kind="user" how={{ formula: "Σ FA reserve as entered" }} />
        <Kpi label="Weighted reserve" value={$M(d.wr)} sub="reserve × confidence ÷ 5" kind="calc" how={{ formula: "Σ (fa_reserve × confidence ÷ 5)", note: "Confidence is a management position 0–5, not a statistical probability." }} />
        <Kpi label="Expected EAC" value={d.nRes ? $M(d.eacExp) : "—"} sub={d.nRes ? `vs ${$M(d.eacFin)} finance EAC on ${d.nRes} projects` : "needs reserve entries"} kind="calc" how={{ formula: "Σ (current WIP EAC − fa_reserve)", note: "Subtracts the full reserve. It does not subtract the weighted reserve; a weighted EAC view would be a separate metric needing approval." }} />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Finance to management bridge" subtitle="Covered projects with a reserve entered" tags={<Tag kind="calc" />}>
          {d.nRes ? <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[13px]">
            <dt className="text-muted-foreground">Finance EAC (from WIP)</dt><dd className="text-right tnum"><Money v={d.eacFin} /></dd>
            <dt className="text-muted-foreground">Less FA reserve</dt><dd className="text-right tnum"><Money v={-(d.eacFin - d.eacExp)} /></dd>
            <dt className="border-t pt-2 font-semibold">Expected EAC</dt><dd className="border-t pt-2 text-right font-semibold tnum"><Money v={d.eacExp} /></dd>
          </dl> : <p className="text-[13px] leading-6 text-muted-foreground">No reserves entered for {w.period.label} yet. Click any project below, or download the sheet, fill FA reserve and confidence, and upload it back.</p>}
        </Panel>
        <Panel title="Scenario coverage" subtitle="Labels kept exactly as entered" tags={<Tag kind="pending">Definitions pending</Tag>}>
          <div className="grid grid-cols-3 gap-2">{d.sc.map((x) => <div key={x.k} className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{x.k}</div><div className="mt-1 text-[20px] font-semibold tnum">{x.n}</div><div className="text-[11px] text-muted-foreground">projects</div></div>)}</div>
          <p className="mt-3 text-[12px] leading-5 text-muted-foreground">S1, S2 and S3 are kept as entered. The app does not call them base, upside or downside until they are defined.</p>
        </Panel>
      </div>
      {d.dups ? <div className="mb-4"><Note tone="warn">{d.dups} entr{d.dups === 1 ? "y matches" : "ies match"} an entity + project ID that appears on more than one eligible row. These are held out of totals for review.</Note></div> : null}
      <Panel pad={false} title="Projects" actions={<Seg value={show} onChange={setShow} options={[{ value: "all", label: "All" }, { value: "entry", label: `With entry ${d.cov.length}` }, { value: "draft", label: `Draft ${d.draft}` }, { value: "approved", label: `Approved ${d.approved}` }]} />}>
        <DataTable rows={shown} rowKey={(x) => x.r.id} initialSort={{ key: "eac", dir: "desc" }} search={(x) => `${x.r.entity} ${x.r.projectId} ${x.r.projectName || ""}`}
          onRow={edit ? (x) => setForm({ key: x.k, name: `${x.r.entity} ${x.r.projectId} — ${x.r.projectName || ""}`, eac: x.r.E, reserve: x.e?.reserve != null ? String(x.e.reserve) : "", confidence: x.e?.confidence != null ? String(x.e.confidence) : "", scenario: x.e?.scenario || "none", narrative: x.e?.narrative || "" }) : undefined}
          empty={show === "all" ? "No eligible projects in this scope." : "No entries match."}
          cols={[
            { key: "e", label: "Entity", value: (x) => x.r.entity },
            { key: "p", label: "Project", render: (x) => <span><b className="font-medium">{x.r.projectId}</b> <span className="text-muted-foreground">{x.r.projectName}</span>{x.dup ? <> <Pill tone="warn">Duplicate key</Pill></> : null}</span>, value: (x) => x.r.projectId },
            { key: "eac", label: "Current EAC", align: "right", render: (x) => <Money v={x.r.E} />, value: (x) => x.r.E },
            { key: "res", label: "FA reserve", align: "right", render: (x) => x.e?.reserve != null ? <Money v={x.e.reserve} /> : <span className="text-muted-foreground">—</span>, value: (x) => x.e?.reserve ?? null },
            { key: "c", label: "Conf.", align: "right", render: (x) => x.e?.confidence != null ? `${x.e.confidence} / 5` : <span className="text-muted-foreground">—</span>, value: (x) => x.e?.confidence ?? null },
            { key: "wr", label: "Weighted reserve", align: "right", render: (x) => x.wr != null ? <Money v={x.wr} /> : <span className="text-muted-foreground">—</span>, value: (x) => x.wr },
            { key: "xe", label: "Expected EAC", align: "right", render: (x) => x.xe != null ? <Money v={x.xe} /> : <span className="text-muted-foreground">—</span>, value: (x) => x.xe },
            { key: "s", label: "Scenario", render: (x) => x.e?.scenario ? <Pill tone="info">{x.e.scenario}</Pill> : <span className="text-muted-foreground">—</span>, value: (x) => x.e?.scenario || "" },
            { key: "st", label: "Status", render: (x) => !x.e ? <span className="text-muted-foreground">No entry</span> : x.e.status === "approved" ? <span title={`${x.e.approvedBy} · ${x.e.approvedAt?.slice(0, 10)}`}><Pill tone="ok">Approved</Pill>{x.e.approvedBy && x.e.approvedBy === x.e.updatedBy ? <> <Pill tone="gold">Self-approved</Pill></> : null}</span> : <Pill tone="muted">Draft</Pill>, value: (x) => x.e?.status || "" },
          ]} />
      </Panel>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="pr-6 leading-6">{form?.name}</DialogTitle><DialogDescription>Current WIP EAC {form?.eac != null ? $(form.eac, 2) : "is blank"}. Saving sets the entry to draft; approval is reset.</DialogDescription></DialogHeader>
          {form ? <div className="grid grid-cols-2 gap-3">
            <div><Label>FA reserve ($)</Label><Input inputMode="decimal" value={form.reserve} onChange={(e) => setForm({ ...form, reserve: e.target.value })} data-testid="input-mf-reserve" /></div>
            <div><Label>Confidence (0–5)</Label><Select value={form.confidence || "none"} onValueChange={(v) => setForm({ ...form, confidence: v === "none" ? "" : v })}><SelectTrigger data-testid="select-mf-conf"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{[0, 1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Scenario</Label><Select value={form.scenario} onValueChange={(v) => setForm({ ...form, scenario: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{["S1", "S2", "S3"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div>
            <div className="rounded-lg border bg-muted/30 p-2.5 text-[12px] leading-5">
              {(() => { const r = form.reserve.trim() ? Number(form.reserve.replace(/[$,\s]/g, "")) : null; const c = form.confidence ? Number(form.confidence) : null; const wr = r != null && Number.isFinite(r) ? weightedReserve(r, c) : null; const xe = r != null && Number.isFinite(r) ? expectedEac(form.eac, r) : null;
                return <><div className="flex justify-between"><span className="text-muted-foreground">Weighted reserve</span><span className="tnum">{wr != null ? $(wr, 2) : "—"}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Expected EAC</span><span className="tnum">{xe != null ? $(xe, 2) : "—"}</span></div></>; })()}
            </div>
            <div className="col-span-2"><Label>Narrative</Label><Textarea rows={3} value={form.narrative} onChange={(e) => setForm({ ...form, narrative: e.target.value })} placeholder="Why this reserve, what would change it" /></div>
          </div> : null}
          <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save} disabled={busy} data-testid="button-mf-save">Save draft</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
