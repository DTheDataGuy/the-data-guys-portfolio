import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Download, Pencil, Save, Undo2, Lock, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { metrics } from "@shared/calc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWip } from "@/lib/app";
import { EXC_LABEL, type ExcCat, totals } from "@shared/calc";
import { PageHeader, Panel, Tag, Money, P, $M, DataTable, Pill, Seg, Note, type Col } from "@/components/kit";
import { download } from "@/lib/queryClient";
import { openProject, ruleName } from "@/components/project";
import { Skeleton } from "./command";

export default function ProjectsPage() {
  const w = useWip(); const [scope, setScope] = useState<"eligible" | "excluded" | "all">("eligible"); const [cat, setCat] = useState<string>("all");
  const s = useSession(); const { toast } = useToast();
  const canEdit = ["admin", "executive", "finance"].includes(s.user?.role || "");
  const [edit, setEdit] = useState(false);
  const [pend, setPend] = useState<Record<string, Record<string, string>>>({});
  const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const visible = useRef<any[]>([]); const skipBlur = useRef<string | null>(null);
  const rows = useMemo(() => {
    if (!w.view) return [];
    let r = w.view.scoped;
    if (scope === "eligible") r = r.filter((x) => x.eligible); else if (scope === "excluded") r = r.filter((x) => !x.eligible);
    if (cat !== "all") r = r.filter((x) => x.exc.includes(cat as ExcCat));
    return r;
  }, [w.view, scope, cat]);
  if (!w.view || !w.period) return <div><PageHeader title="Projects" /><Skeleton /></div>;
  const t = totals(rows);
  const locked = w.period.status === "published";
  const nChanges = Object.values(pend).reduce((a, x) => a + Object.keys(x).length, 0);
  const cur = (r: any, f: EF) => (pend[r.id] && f.k in pend[r.id] ? pend[r.id][f.k] : r[f.rk] == null ? "" : String(r[f.rk]));
  const setCell = (r: any, f: EF, val: string) => {
    const nv = f.t === "num" ? val.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1") : val;
    if (f.t === "num" && nv !== "" && !Number.isFinite(Number(nv))) { toast({ title: `${f.label} must be a number`, description: `“${val}” wasn’t applied. Leave it blank if unknown.`, variant: "destructive" }); return; }
    if (f.t === "date" && nv.trim() !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(nv.trim())) { toast({ title: "Dates use YYYY-MM-DD", variant: "destructive" }); return; }
    setCellRaw(r, f, nv);
  };
  const setCellRaw = (r: any, f: EF, val: string) => setPend((p) => {
    const orig = r[f.rk] == null ? "" : String(r[f.rk]); const next = { ...(p[r.id] || {}) };
    const norm = val.trim();
    if (norm === orig || (f.t === "num" && norm !== "" && orig !== "" && Number(norm) === Number(orig))) delete next[f.k]; else next[f.k] = norm;
    const out = { ...p }; if (Object.keys(next).length) out[r.id] = next; else delete out[r.id]; return out;
  });
  const preview = (r: any) => {
    const pe = pend[r.id]; if (!pe) return r.m;
    const v: any = { C: r.C, R: r.R, E: r.E, A: r.A, B: r.B, orig: r.orig, mods: r.mods };
    for (const f of EDIT_FIELDS) if (f.t === "num" && f.k in pe) v[f.rk] = pe[f.k] === "" ? null : Number(pe[f.k]);
    return metrics(v);
  };
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>, r: any, f: EF) => {
    const txt = e.clipboardData.getData("text"); if (!/[\t\n]/.test(txt.trim())) return;
    e.preventDefault();
    const grid = txt.replace(/\r/g, "").replace(/\n$/, "").split("\n").map((l) => l.split("\t"));
    const vis = visible.current; const ri = vis.findIndex((x) => x.id === r.id); const ci = EDIT_FIELDS.findIndex((x) => x.k === f.k);
    let n = 0;
    grid.forEach((line, i) => line.forEach((val, j) => { const rr = vis[ri + i], ff = EDIT_FIELDS[ci + j]; if (rr && ff) { setCell(rr, ff, val); n++; } }));
    skipBlur.current = `${r.id}|${f.k}`; setActive(null);
    toast({ title: `Pasted ${n} cell${n === 1 ? "" : "s"}`, description: "Review the highlighted cells, add a reason and save." });
  };
  const saveAll = async () => {
    setBusy(true); let ok = 0; const fails: string[] = [];
    for (const [id, ch] of Object.entries(pend)) {
      try { await api("PATCH", `/api/rows/${id}`, { changes: ch, reason }); ok++; } catch (e: any) { fails.push(e.message); }
    }
    await queryClient.invalidateQueries();
    setBusy(false);
    if (fails.length) toast({ title: `Saved ${ok} project${ok === 1 ? "" : "s"}, ${fails.length} failed`, description: fails[0], variant: "destructive" });
    else { toast({ title: `Saved ${nChanges} change${nChanges === 1 ? "" : "s"}`, description: "Totals, exceptions, forecast and cash flow are recalculated. Originals are kept in each project’s history." }); setPend({}); setReason(""); }
  };
  const cell = (f: EF) => (r: any) => {
    const has = !!pend[r.id] && f.k in pend[r.id]; const id = `${r.id}|${f.k}`;
    if (active === id) return <Input autoFocus defaultValue={cur(r, f)} type={f.t === "date" ? "date" : "text"} inputMode={f.t === "num" ? "decimal" : undefined}
      className={cn("h-7 min-w-[110px] px-2 text-[13px] tnum", f.t === "num" && "text-right")} data-testid={`cell-input-${f.k}`}
      onPaste={(e) => onPaste(e, r, f)}
      onBlur={(e) => { if (skipBlur.current === id) { skipBlur.current = null; return; } setCell(r, f, e.currentTarget.value); setActive((a) => (a === id ? null : a)); }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { skipBlur.current = id; setActive(null); return; }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault(); skipBlur.current = id; setCell(r, f, e.currentTarget.value);
          const vis = visible.current; const ri = vis.findIndex((x) => x.id === r.id); const ci = EDIT_FIELDS.findIndex((x) => x.k === f.k);
          if (e.key === "Enter") { const nx = vis[ri + (e.shiftKey ? -1 : 1)]; setActive(nx ? `${nx.id}|${f.k}` : null); }
          else { const nf = EDIT_FIELDS[ci + (e.shiftKey ? -1 : 1)]; setActive(nf ? `${r.id}|${nf.k}` : null); }
        }
      }} />;
    const v = cur(r, f);
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); skipBlur.current = null; setActive(id); }} title={has ? `Was: ${r[f.rk] ?? "blank"}` : "Click to edit"}
        className={cn("-mx-1.5 block w-[calc(100%+12px)] rounded-md px-1.5 py-0.5 text-left outline-none ring-1 ring-transparent transition hover:bg-primary/[.06] hover:ring-primary/30 focus-visible:ring-primary", f.t === "num" && "text-right", has && "bg-[hsl(var(--gold))]/15 ring-[hsl(var(--gold))]/50 font-medium")} data-testid={`cell-${f.k}-${r.id}`}>
        {f.t === "num" ? (v === "" ? <span className="text-muted-foreground">—</span> : <Money v={Number(v)} />) : v === "" ? <span className="text-muted-foreground">—</span> : v}
      </button>
    );
  };
  const projCol: Col<any> = { key: "p", label: "Project", render: (r) => <button type="button" onClick={(e) => { e.stopPropagation(); openProject(r.id); }} className="inline-flex items-center gap-1 text-left hover:underline"><b className="font-medium">{r.projectId}</b> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 26)}</span><ExternalLink className="h-3 w-3 text-muted-foreground" /></button>, value: (r) => r.projectId };
  const editCols: Col<any>[] = [
    { key: "e", label: "Entity", value: (r) => r.entity }, projCol,
    ...EDIT_FIELDS.map((f) => ({ key: `ed-${f.k}`, label: f.label, align: f.t === "num" ? "right" as const : "left" as const, render: cell(f), value: (r: any) => (f.t === "num" ? r[f.rk] : r[f.rk] || "") })),
    { key: "rc", label: <span className="inline-flex items-center gap-1">Remaining<Tag kind="calc" className="px-1 py-0 text-[9.5px]">calc</Tag></span>, align: "right", render: (r) => <Money v={preview(r).remC} className={pend[r.id] ? "font-semibold" : ""} />, value: (r) => r.m.remC },
    { key: "gp", label: "Rem. GP", align: "right", render: (r) => <Money v={preview(r).remGP} className={pend[r.id] ? "font-semibold" : ""} />, value: (r) => r.m.remGP },
    { key: "gm", label: "GM", align: "right", render: (r) => P(preview(r).remGM), value: (r) => r.m.remGM },
    { key: "ob", label: "Over/(under)", align: "right", render: (r) => <Money v={preview(r).ob} />, value: (r) => r.m.ob },
  ];
  return (
    <div>
      <PageHeader title="Projects" subtitle="Every submitted row — eligible and excluded — with source values, governed calculations and the rule that decided eligibility. Click a row to open the Project 360, edit values or override." tags={<><Tag kind="source" /><Tag kind="calc" /></>}
        actions={<>{canEdit ? <Button size="sm" variant={edit ? "default" : "outline"} onClick={() => { if (edit && nChanges && !confirm("Discard unsaved changes?")) return; setEdit(!edit); setActive(null); if (edit) setPend({}); }} data-testid="button-edit-mode"><Pencil /> {edit ? "Done editing" : "Edit cells"}</Button> : null}<Button variant="outline" size="sm" onClick={() => download(`/api/periods/${w.period!.id}/export.xlsx`, `Governed_WIP_${w.period!.id}.xlsx`)} data-testid="button-export"><Download /> Export governed workbook</Button></>} />
      {edit && locked ? <div className="mb-3"><Note tone="warn"><span className="font-medium">{w.period.label} is published, so its values are locked.</span> To correct it, reopen the month in <Link href="/close" className="font-medium underline">Close & Publish</Link>, edit here, then republish as a new version. Or load next month’s WIP and edit that draft.</Note></div> : null}
      {edit && !locked ? <div className="mb-3"><Note>Click any value in the editable columns to change it. Enter moves down, Tab moves right, Esc cancels. You can paste a block copied from Excel. Changed cells turn gold and the calculated columns update instantly. Add one reason and save, and everyone else sees the new numbers within seconds.</Note></div> : null}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["Rows", t.count.toLocaleString()], ["Contract", $M(t.C)], ["Remaining", $M(t.remC)], ["Remaining GP", $M(t.remGP)], ["Weighted GM", P(t.remGM, 2)]].map(([k, v]) => <div key={k} className="rounded-lg border bg-card px-3 py-2"><div className="text-[11.5px] text-muted-foreground">{k}</div><div className="text-[17px] font-semibold tnum">{v}</div></div>)}
      </div>
      <Panel pad={false}>
        <DataTable rows={rows} rowKey={(r) => r.id} onRow={edit && !locked ? undefined : (r) => openProject(r.id)} pageSize={30} testid="table-projects" onSlice={(v) => { visible.current = v; }} rowClass={(r) => (pend[r.id] ? "bg-[hsl(var(--gold))]/[.05]" : "")}
          search={(r) => `${r.entity} ${r.projectId} ${r.projectName} ${r.pm || ""} ${r.customer || ""} ${r.bondNo || ""}`} initialSort={{ key: "rc", dir: "desc" }}
          toolbar={<>
            <Seg value={scope} onChange={setScope} testid="seg-scope" options={[{ value: "eligible", label: "Eligible" }, { value: "excluded", label: "Excluded" }, { value: "all", label: "All rows" }]} />
            <Select value={cat} onValueChange={setCat}><SelectTrigger className="h-8 w-[200px] text-[13px]" data-testid="select-exc"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any exception</SelectItem>{(Object.keys(EXC_LABEL) as ExcCat[]).map((c) => <SelectItem key={c} value={c}>{EXC_LABEL[c]}</SelectItem>)}</SelectContent></Select>
          </>}
          cols={edit && !locked ? editCols : [
            { key: "e", label: "Entity", value: (r) => r.entity },
            { key: "p", label: "Project", render: (r) => <span><b className="font-medium">{r.projectId}</b> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 32)}</span>{r.edited ? <span className="ml-1.5 text-[10px] font-semibold text-[hsl(var(--gold))]">EDITED</span> : null}</span>, value: (r) => r.projectId },
            { key: "st", label: "Status", value: (r) => r.status },
            { key: "c", label: "Contract (C)", align: "right", render: (r) => <Money v={r.C} />, value: (r) => r.C },
            { key: "r", label: "ITD rev (R)", align: "right", render: (r) => <Money v={r.R} />, value: (r) => r.R },
            { key: "rc", label: "Remaining", align: "right", render: (r) => <Money v={r.m.remC} />, value: (r) => r.m.remC },
            { key: "gp", label: "Rem. GP", align: "right", render: (r) => <Money v={r.m.remGP} />, value: (r) => r.m.remGP },
            { key: "gm", label: "GM", align: "right", render: (r) => <span title={r.m.remGMReason || ""}>{P(r.m.remGM)}</span>, value: (r) => r.m.remGM },
            { key: "ob", label: "Over/(under)", align: "right", render: (r) => <Money v={r.m.ob} />, value: (r) => r.m.ob },
            { key: "b", label: "Bond", render: (r) => r.inBondReport ? <Pill tone={r.bondStatus === "Bonded" ? "info" : r.bondStatus === "Needs Review" ? "warn" : "muted"}>{r.bondStatus === "Bonded - Number Unmatched" ? "Bonded*" : r.bondStatus}</Pill> : <span className="text-muted-foreground">—</span>, value: (r) => r.bondStatus },
            { key: "el", label: "Eligibility", render: (r) => r.eligible ? (r.override === "include" ? <Pill tone="gold">Included (override)</Pill> : <Pill tone="ok">Eligible</Pill>) : <span className="text-[12px] text-muted-foreground" title={r.reasons.map(ruleName).join(", ")}>{r.override === "exclude" ? "Excluded (override)" : ruleName(r.reasons[0] || "")}</span>, value: (r) => (r.eligible ? 1 : 0) },
            { key: "x", label: "Flags", render: (r) => r.exc.length ? <span className="text-[12px]" title={r.exc.map((c) => EXC_LABEL[c]).join(", ")}>{r.exc.map((c) => EXC_LABEL[c]).slice(0, 2).join(", ")}{r.exc.length > 2 ? ` +${r.exc.length - 2}` : ""}</span> : null, value: (r) => r.exc.length },
          ]} />
      </Panel>
      {edit && nChanges ? (
        <div className="sticky bottom-4 z-30 mt-4 flex flex-col gap-2 rounded-2xl border border-[hsl(var(--gold))]/50 bg-card p-3 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center" data-testid="save-bar">
          <div className="shrink-0 text-[13px]"><b className="tnum">{nChanges}</b> unsaved change{nChanges === 1 ? "" : "s"} on <b className="tnum">{Object.keys(pend).length}</b> project{Object.keys(pend).length === 1 ? "" : "s"}</div>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for the change (required), e.g. EAC per PM re-forecast 9/25" className="h-9 flex-1" data-testid="input-bulk-reason" />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPend({})} data-testid="button-discard"><Undo2 /> Discard</Button>
            <Button size="sm" disabled={busy || reason.trim().length < 3} onClick={saveAll} data-testid="button-save-cells"><Save /> {busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type EF = { k: string; rk: string; label: string; t: "num" | "str" | "date" };
const EDIT_FIELDS: EF[] = [
  { k: "status", rk: "status", label: "Status", t: "str" },
  { k: "pm", rk: "pm", label: "PM", t: "str" },
  { k: "C", rk: "C", label: "Contract (C)", t: "num" },
  { k: "R", rk: "R", label: "ITD rev (R)", t: "num" },
  { k: "E", rk: "E", label: "EAC (E)", t: "num" },
  { k: "A", rk: "A", label: "ITD cost (A)", t: "num" },
  { k: "B", rk: "B", label: "Billings (B)", t: "num" },
  { k: "end_date", rk: "endDate", label: "Est. completion", t: "date" },
  { k: "bond_no", rk: "bondNo", label: "Bond no.", t: "str" },
];
