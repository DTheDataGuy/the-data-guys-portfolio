import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, CircleDashed, Plus, Lock, Unlock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip, useRows, canEdit, isExec, setUI } from "@/lib/app";
import { totals, metrics, exceptions, DEFAULT_THRESHOLDS, groupBy, type Row } from "@shared/calc";
import { PageHeader, Panel, Tag, DataTable, Pill, Note, Money, $, P, $M, Kpi } from "@/components/kit";
import { statusLabel } from "@/components/shell";
import { Skeleton } from "./command";

/* Approved July 2026 workbook values are loaded from the server after sign-in (never embedded in the public bundle). */
type Target = { k: string; label: string; target: number; tol: number; fmt: (v: number) => string };
const FMT: Record<string, (v: number) => string> = { money: (v) => $(v, 2), pct4: (v) => P(v, 4), pct2: (v) => P(v, 2), int: (v) => v.toLocaleString() };

function measure(all: Row[]) {
  const el = all.filter((r) => r.eligible); const t = totals(el); const th = DEFAULT_THRESHOLDS;
  const ex = el.map((r) => exceptions(r, metrics(r), th));
  const br = all.filter((r) => r.inBondReport); const rem = (xs: Row[]) => xs.reduce((a, r) => a + (metrics(r).remC || 0), 0);
  const bd = rem(br.filter((r) => r.bondStatus === "Bonded" || r.bondStatus === "Bonded - Number Unmatched")); const bt = rem(br);
  return { rows: all.length, eligible: el.length, C: t.C, remC: t.remC, remCost: t.remCost, remGP: t.remGP, remGM: t.remGM ?? NaN, itdGP: t.itdGP, loss: ex.filter((e) => e.includes("LOSS")).length, under: ex.filter((e) => e.includes("UNDER")).length, fin: ex.filter((e) => e.includes("LOSS") || e.includes("UNDER")).length, bond: br.length, bondedRem: bd, bondedPct: bt ? bd / bt : NaN } as Record<string, number>;
}

const pk = (r: Row, i: number) => `${r.entity}|${r.projectId}|${i}`;
function keyed(rows: Row[]) { const seen = new Map<string, number>(); const out = new Map<string, Row>(); for (const r of rows.filter((x) => x.eligible)) { const b = `${r.entity}|${r.projectId}`; const n = seen.get(b) || 0; seen.set(b, n + 1); out.set(pk(r, n), r); } return out; }

export default function ClosePage() {
  const w = useWip(); const s = useSession(); const { toast } = useToast();
  const [dlg, setDlg] = useState<null | "new" | "review" | "published" | "draft">(null); const [note, setNote] = useState(""); const [newId, setNewId] = useState(""); const [newAsOf, setNewAsOf] = useState("");
  const periods = w.periods || []; const idx = periods.findIndex((p) => p.id === w.period?.id);
  const prev = idx >= 0 ? periods[idx + 1] : undefined; // periods are newest-first
  const prevRows = useRows(prev?.id);
  const summary = useQuery<any>({ queryKey: ["/api/periods", w.period?.id || "", "summary"], enabled: !!w.period });
  const exc = useQuery<any[]>({ queryKey: [`/api/exc?period=${w.period?.id || ""}`], enabled: !!w.period });
  const imps = useQuery<any[]>({ queryKey: ["/api/imports"] });
  const tq = useQuery<{ k: string; label: string; target: number; tol: number; fmt: string }[]>({ queryKey: ["/api/repro-targets"] });
  const m = useMemo(() => w.view ? measure(w.view.all) : null, [w.view]);
  const bridge = useMemo(() => {
    if (!w.view || !prevRows.data) return null;
    const a = keyed(prevRows.data), b = keyed(w.view.all);
    let added = 0, addedN = 0, dropped = 0, droppedN = 0, burn = 0, growth = 0; const ents = new Map<string, { k: string; prior: number; cur: number }>();
    for (const [k, r] of b) { const e = ents.get(r.entity) || { k: r.entity, prior: 0, cur: 0 }; e.cur += metrics(r).remC || 0; ents.set(r.entity, e); if (!a.has(k)) { added += metrics(r).remC || 0; addedN++; } }
    for (const [k, r] of a) { const e = ents.get(r.entity) || { k: r.entity, prior: 0, cur: 0 }; e.prior += metrics(r).remC || 0; ents.set(r.entity, e); const c = b.get(k); if (!c) { dropped += metrics(r).remC || 0; droppedN++; continue; } burn += (c.R || 0) - (r.R || 0); growth += (c.C || 0) - (r.C || 0); }
    const p = [...a.values()].reduce((x, r) => x + (metrics(r).remC || 0), 0), c = [...b.values()].reduce((x, r) => x + (metrics(r).remC || 0), 0);
    return { p, c, added, addedN, dropped, droppedN, burn, growth, other: c - (p + added - dropped + growth - burn), ents: [...ents.values()].sort((x, y) => y.cur - x.cur) };
  }, [w.view, prevRows.data]);
  if (!w.view || !w.period || !m || !w.boot) return <div><PageHeader title="Close & publish" /><Skeleton /></div>;
  const isJuly = w.period.id === "2026-07";
  const TARGETS: Target[] = (tq.data || []).map((t) => ({ ...t, fmt: FMT[t.fmt] || FMT.int }));
  const tests = TARGETS.map((t) => ({ ...t, actual: m[t.k], pass: Math.abs(m[t.k] - t.target) <= t.tol + 1e-9 }));
  const passN = tests.filter((t) => t.pass).length;
  const expected = w.boot.entities.filter((e) => e.expected); const got = new Set(w.view.all.map((r) => r.entity));
  const staged = (imps.data || []).filter((i) => i.status === "staged" && i.period === w.period!.id).length;
  const openExc = (exc.data || []).filter((x) => !["Resolved", "Waived", "Verified"].includes(x.status)).length;
  const srv = summary.data; const srvMatch = srv ? Math.abs(srv.totals.remC - m.remC) < 0.005 && srv.eligible === m.eligible && srv.financialExceptions === m.fin : null;
  const checks = [
    { l: "All expected entity WIPs received", ok: expected.every((e) => got.has(e.code)), d: `${expected.filter((e) => got.has(e.code)).length} of ${expected.length}` },
    { l: "No staged files waiting", ok: staged === 0, d: staged ? `${staged} awaiting review in Intake` : "Clear" },
    { l: "Server and browser calculations agree", ok: srvMatch === true, d: srvMatch === null ? "Checking…" : srvMatch ? "Remaining contract, eligible count and exceptions match" : "Mismatch — reload" },
    { l: isJuly ? "Reproduces the approved July workbook" : "Baseline reproduction (July only)", ok: isJuly ? tests.length > 0 && passN === tests.length : true, d: isJuly ? `${passN} of ${tests.length} tests pass` : "Not applicable to this period" },
    { l: "Exceptions reviewed", ok: openExc === 0, d: exc.data?.length ? `${openExc} still open of ${exc.data.length} tracked` : "No exception reviews logged yet", soft: true },
  ];
  const go = async (status: string) => { try { await api("POST", `/api/periods/${w.period!.id}/status`, { status, note: note || undefined }); await queryClient.invalidateQueries(); toast({ title: `${w.period!.label} is now ${statusLabel(status as any)}` }); setDlg(null); setNote(""); } catch (e: any) { toast({ title: "Couldn’t change status", description: e.message, variant: "destructive" }); } };
  const create = async () => { try { const p = await api<any>("POST", "/api/periods", { id: newId, asOf: newAsOf || undefined }); await queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] }); setUI({ period: p.id }); setDlg(null); toast({ title: `${p.label} created`, description: "Send or upload each entity’s WIP to fill it." }); } catch (e: any) { toast({ title: "Couldn’t create period", description: e.message, variant: "destructive" }); } };
  const st = w.period.status;
  return (
    <div>
      <PageHeader title="Close & publish" subtitle="Every month moves Draft → In review → Published. Published months are locked; edits and loads require reopening, and every change is in the audit log."
        actions={<>{canEdit(s.user?.role) ? <Button variant="outline" size="sm" onClick={() => setDlg("new")} data-testid="button-new-period"><Plus /> New month</Button> : null}
          {st === "draft" && canEdit(s.user?.role) ? <Button size="sm" onClick={() => setDlg("review")} data-testid="button-to-review"><Send /> Send for review</Button> : null}
          {st === "review" && isExec(s.user?.role) ? <Button size="sm" onClick={() => setDlg("published")} data-testid="button-publish"><Lock /> Publish {w.period.label}</Button> : null}
          {st !== "draft" && isExec(s.user?.role) ? <Button size="sm" variant="outline" onClick={() => setDlg("draft")} data-testid="button-reopen"><Unlock /> Reopen</Button> : null}</>} />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={`Close checklist — ${w.period.label}`} subtitle={<span>Status: <b>{statusLabel(st)}</b>{w.period.published_at ? ` · published ${new Date(w.period.published_at).toLocaleDateString()} by ${w.period.published_by}` : ""} · version {w.period.version}</span>}>
          <ul className="divide-y">{checks.map((c) => <li key={c.l} className="flex items-center gap-3 py-2.5">{c.ok ? <CircleCheck className="h-5 w-5 text-[hsl(var(--ok))]" /> : c.soft ? <CircleDashed className="h-5 w-5 text-[hsl(var(--warn))]" /> : <CircleX className="h-5 w-5 text-[hsl(var(--destructive))]" />}<span className="flex-1 text-[13.5px] font-medium">{c.l}</span><span className="text-right text-[12.5px] text-muted-foreground">{c.d}</span></li>)}</ul>
        </Panel>
        <Panel title="Months" pad={false}>
          <DataTable rows={periods} rowKey={(p) => p.id} dense pageSize={12} onRow={(p) => setUI({ period: p.id })} cols={[
            { key: "l", label: "Month", render: (p) => <b className="font-medium">{p.label}</b>, value: (p) => p.id },
            { key: "a", label: "As of", value: (p) => p.as_of },
            { key: "s", label: "Status", render: (p) => <Pill tone={p.status === "published" ? "ok" : p.status === "review" ? "info" : "warn"}>{statusLabel(p.status)}</Pill>, value: (p) => p.status },
            { key: "v", label: "Version", align: "right", value: (p) => p.version },
            { key: "n", label: "Note", render: (p) => <span className="block max-w-[220px] truncate text-[12px] text-muted-foreground">{p.note || "—"}</span> },
          ]} />
        </Panel>
      </div>

      <Panel className="mb-4" title="Reproduction tests" subtitle={isJuly ? "The governed engine recalculated from source rows, compared with the approved July 2026 workbook. Default rules and thresholds are used so results stay comparable even if you change settings." : "Targets exist only for the July 2026 baseline. Current values are shown for reference."} tags={<><Tag kind="legacy">Approved workbook</Tag><Tag kind="calc" /></>} actions={isJuly ? <Pill tone={passN === tests.length ? "ok" : "bad"}>{passN}/{tests.length} pass</Pill> : null} pad={false}>
        <DataTable rows={tests} rowKey={(t) => t.k} pageSize={20} dense cols={[
          { key: "r", label: "", render: (t) => !isJuly ? <CircleDashed className="h-4 w-4 text-muted-foreground" /> : t.pass ? <CircleCheck className="h-4 w-4 text-[hsl(var(--ok))]" /> : <CircleX className="h-4 w-4 text-[hsl(var(--destructive))]" /> },
          { key: "l", label: "Test", value: (t) => t.label },
          { key: "t", label: "Workbook", align: "right", render: (t) => isJuly ? t.fmt(t.target) : "—" },
          { key: "a", label: "App (governed)", align: "right", render: (t) => <b className="font-medium">{t.fmt(t.actual)}</b> },
          { key: "d", label: "Difference", align: "right", render: (t) => isJuly ? (t.k === "remGM" || t.k === "bondedPct" ? `${((t.actual - t.target) * 100).toFixed(6)} pts` : t.fmt(t.actual - t.target)) : "—" },
          { key: "o", label: "Tolerance", align: "right", render: (t) => t.tol === 0 ? "exact" : t.k === "remGM" || t.k === "bondedPct" ? "rounding" : "±$0.01" },
        ]} />
      </Panel>

      <Panel title="Month-over-month bridge" subtitle={prev ? `${prev.label} → ${w.period.label}, remaining contract on reporting-eligible projects` : undefined} tags={<Tag kind="calc" />}>
        {!prev ? <Note>A bridge needs two loaded months. {w.period.label} is the first period in the system, so no trend or variance is shown — nothing is estimated for prior months. Once the next month’s WIPs are loaded, this panel shows new awards, completions, revenue burn and contract growth.</Note>
          : !bridge ? <Skeleton /> : <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              {[["Prior remaining", bridge.p], ["+ New projects", bridge.added, `${bridge.addedN}`], ["− Dropped / closed", -bridge.dropped, `${bridge.droppedN}`], ["+ Contract growth", bridge.growth], ["− Revenue earned", -bridge.burn], ["= Current remaining", bridge.c]].map(([l, v, n]) => <div key={l as string} className="rounded-lg border p-3"><div className="text-[11.5px] text-muted-foreground">{l as string}{n ? ` (${n})` : ""}</div><div className="text-[15px] font-semibold tnum">{$M(v as number)}</div></div>)}
            </div>
            {Math.abs(bridge.other) > 1 ? <Note tone="warn">Unexplained difference {$(bridge.other, 2)} — usually rows whose eligibility changed. Review in Portfolio.</Note> : null}
            <DataTable rows={bridge.ents} rowKey={(e) => e.k} dense pageSize={25} cols={[{ key: "k", label: "Entity", value: (e) => e.k }, { key: "p", label: prev.label, align: "right", render: (e) => <Money v={e.prior} />, value: (e) => e.prior }, { key: "c", label: w.period.label, align: "right", render: (e) => <Money v={e.cur} />, value: (e) => e.cur }, { key: "d", label: "Change", align: "right", render: (e) => <Money v={e.cur - e.prior} />, value: (e) => e.cur - e.prior }]} />
          </div>}
      </Panel>

      <Dialog open={dlg === "new"} onOpenChange={(o) => !o && setDlg(null)}><DialogContent><DialogHeader><DialogTitle>Start a new month</DialogTitle><DialogDescription>Creates an empty period. It fills as WIPs arrive by email or upload; nothing is copied from prior months.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3"><div><Label>Period (YYYY-MM)</Label><Input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="2026-08" data-testid="input-new-period" /></div><div><Label>As-of date</Label><Input type="date" value={newAsOf} onChange={(e) => setNewAsOf(e.target.value)} /></div></div>
        <DialogFooter><Button onClick={create} data-testid="button-create-period">Create</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!dlg && dlg !== "new"} onOpenChange={(o) => !o && setDlg(null)}><DialogContent><DialogHeader><DialogTitle>{dlg === "published" ? `Publish ${w.period.label}` : dlg === "review" ? "Send for review" : `Reopen ${w.period.label}`}</DialogTitle><DialogDescription>{dlg === "published" ? "Locks the month. Figures become the official record for this period and the version number increases." : dlg === "review" ? "Signals the month is ready for executive review. Edits are still allowed." : "Returns the month to Draft so data can be corrected. The reopen is logged."}</DialogDescription></DialogHeader>
        {dlg === "published" && checks.some((c) => !c.ok && !c.soft) ? <Note tone="warn">Some checklist items are not complete. You can still publish; the open items are recorded with your note.</Note> : null}
        <div><Label>Note (optional)</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <DialogFooter><Button onClick={() => go(dlg!)} data-testid="button-confirm-status">Confirm</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
