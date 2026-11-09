import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip, canReview, type Enriched } from "@/lib/app";
import { EXC_LABEL, EXC_GROUP, type ExcCat } from "@shared/calc";
import { PageHeader, Panel, Tag, Money, DataTable, Pill, Seg, Note, $ } from "@/components/kit";
import { openProject } from "@/components/project";
import { Skeleton } from "./command";

const FLOW = ["New", "Assigned", "Investigating", "Resolved", "Verified"] as const;
const ALL_ST = [...FLOW, "Waived"];
type Item = { key: string; row: Enriched; cat: ExcCat; group: string; status: string; owner: string | null; due: string | null; updated_by: string | null; updated_at: string | null; impact: number | null };
const EXPLAIN: Record<ExcCat, (r: Enriched, th: any) => string> = {
  LOSS: (r, th) => `Projected loss (${th.lossBasis === "legacy" ? "workbook label" : th.lossBasis === "itd" ? "ITD GP" : "GP at completion"}). ITD GP ${$(r.m.itdGP)}; GP at completion ${$(r.m.fcGP)}.`,
  UNDER: (r, th) => `Underbilled by ${$(-(r.m.ob || 0))} (B − R), beyond the ${$(th.underThreshold)} threshold.`,
  BOND: () => "Bond status is ‘Needs Review’ — confirm bonded/unbonded and the bond number.",
  EAC_LT_ACTUAL: (r) => `EAC ${$(r.E)} is below ITD cost ${$(r.A)} — the estimate at completion must be at least cost to date.`,
  NEG_REMC: (r) => `Remaining contract is negative (${$(r.m.remC)}): revenue earned exceeds contract. Held out of the forecast for review.`,
  ZERO_DENOM: (r) => `Remaining contract is zero but remaining GP is ${$(r.m.remGP)} — margin is undefined (legacy shows 0%).`,
  MISSING_INPUT: (r) => `Blank source value(s): ${r.m.missing.join(", ")}. Kept blank on the row; the formula treats it as $0 like the workbook.`,
  BOND_CONFLICT: () => "Marked Bonded, but no high-confidence match to the bond reference list.",
  CONTRACT_RECON: (r) => `Current contract differs from original + mods by ${$(r.m.reconDiff)}.`,
};

export default function ExceptionsPage() {
  const w = useWip(); const s = useSession();
  const st = useQuery<any[]>({ queryKey: [`/api/exc?period=${w.period?.id || ""}`], enabled: !!w.period });
  const [group, setGroup] = useState<"all" | "Financial" | "Bond" | "Data quality">("all");
  const [status, setStatus] = useState<string>("open"); const [sel, setSel] = useState<Item | null>(null);
  const items = useMemo<Item[]>(() => {
    if (!w.view || !w.period) return [];
    const m = new Map((st.data || []).map((x) => [x.key, x]));
    return w.view.eligible.flatMap((r) => r.exc.map((c) => { const k = `${w.period!.id}|${r.id}|${c}`; const x: any = m.get(k) || {}; return { key: k, row: r, cat: c, group: EXC_GROUP[c], status: x.status || "New", owner: x.owner || null, due: x.due || null, updated_by: x.updated_by || null, updated_at: x.updated_at || null, impact: c === "LOSS" ? r.m.itdGP : c === "UNDER" ? r.m.ob : c === "NEG_REMC" ? r.m.remC : c === "CONTRACT_RECON" ? r.m.reconDiff : c === "EAC_LT_ACTUAL" ? (r.E || 0) - (r.A || 0) : null }; }));
  }, [w.view, w.period, st.data]);
  if (!w.view || !w.th) return <div><PageHeader title="Exceptions" /><Skeleton /></div>;
  const counts = Object.fromEntries(ALL_ST.map((x) => [x, items.filter((i) => i.status === x).length]));
  const shown = items.filter((i) => (group === "all" || i.group === group) && (status === "all" ? true : status === "open" ? !["Verified", "Waived"].includes(i.status) : i.status === status));
  return (
    <div>
      <PageHeader title="Exception workbench" subtitle="Every flagged condition on a reporting-eligible project, with an owner and a status. Nothing is cleared without a note; only finance or executives can verify." tags={<Tag kind="calc">Rule-generated</Tag>} />
      {w.view.noLossLabels ? <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[13px]" data-testid="note-no-loss-labels">This period’s file has no workbook ‘Projected Loss’ labels, so projected losses are not counted under the current loss basis. Pick ITD GP or At completion on the Command page, or set the loss basis under Rules (loss rule pending executive approval).</div> : null}
      <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        {ALL_ST.map((x, i) => (
          <button key={x} onClick={() => setStatus(status === x ? "open" : x)} className={`rounded-lg border px-3 py-2.5 text-left transition ${status === x ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"}`} data-testid={`status-${x}`}>
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">{i < 5 ? <span className="tnum">{i + 1}.</span> : null}{x}</div>
            <div className="text-[22px] font-semibold tnum">{counts[x]}</div>
          </button>
        ))}
      </div>
      <Panel pad={false}>
        <DataTable rows={shown} rowKey={(i) => i.key} onRow={setSel} pageSize={25} search={(i) => `${i.row.entity} ${i.row.projectId} ${i.row.projectName} ${EXC_LABEL[i.cat]} ${i.owner || ""}`} initialSort={{ key: "imp", dir: "asc" }}
          toolbar={<><Seg value={group} onChange={setGroup} testid="seg-group" options={[{ value: "all", label: "All" }, { value: "Financial", label: "Financial" }, { value: "Bond", label: "Bond" }, { value: "Data quality", label: "Data quality" }]} />
            <Seg value={status === "open" || status === "all" ? status : "open"} onChange={setStatus} options={[{ value: "open", label: "Open" }, { value: "all", label: "Include closed" }]} /></>}
          cols={[
            { key: "c", label: "Exception", render: (i) => <Pill tone={i.group === "Financial" ? "bad" : i.group === "Bond" ? "warn" : "info"}>{EXC_LABEL[i.cat]}</Pill>, value: (i) => EXC_LABEL[i.cat] },
            { key: "e", label: "Entity", value: (i) => i.row.entity },
            { key: "p", label: "Project", render: (i) => <span><b className="font-medium">{i.row.projectId}</b> <span className="text-muted-foreground">{(i.row.projectName || "").slice(0, 30)}</span></span>, value: (i) => i.row.projectId },
            { key: "imp", label: "Amount", align: "right", render: (i) => <Money v={i.impact} />, value: (i) => i.impact },
            { key: "s", label: "Status", render: (i) => <Pill tone={i.status === "Verified" ? "ok" : i.status === "Resolved" ? "info" : i.status === "Waived" ? "muted" : i.status === "New" ? "bad" : "warn"}>{i.status}</Pill>, value: (i) => ALL_ST.indexOf(i.status) },
            { key: "o", label: "Owner", render: (i) => i.owner || <span className="text-muted-foreground">Unassigned</span>, value: (i) => i.owner },
            { key: "d", label: "Due", value: (i) => i.due },
          ]} empty={<div className="p-6 text-center text-sm text-muted-foreground">No exceptions match. Clear the filters to see everything.</div>} />
      </Panel>
      <Note>Exceptions regenerate from the governed rules each time data changes. If an underlying value is corrected (for example, EAC updated to at least cost to date), the flag disappears on its own; its history stays in the log.</Note>
      <ExcSheet item={sel} onClose={() => setSel(null)} can={canReview(s.user?.role)} th={w.th} owners={w.boot?.settings.owners} />
    </div>
  );
}

function ExcSheet({ item, onClose, can, th, owners }: { item: Item | null; onClose: () => void; can: boolean; th: any; owners: any }) {
  const { toast } = useToast();
  const ev = useQuery<any[]>({ queryKey: [`/api/exc/events?key=${encodeURIComponent(item?.key || "")}`], enabled: !!item });
  const [status, setStatus] = useState(""); const [owner, setOwner] = useState(""); const [due, setDue] = useState(""); const [note, setNote] = useState(""); const [k, setK] = useState("");
  if (item && k !== item.key) { setK(item.key); setStatus(item.status); setOwner(item.owner || ""); setDue(item.due || ""); setNote(""); }
  const ownerOpts = Array.from(new Set([...(owners ? Object.values(owners) as string[] : []), "Executive Sponsor (Executive)", item?.row.pm || ""].filter(Boolean)));
  const save = async () => {
    if (!item) return;
    try { await api("POST", "/api/exc", { period: item.row.period, rowId: item.row.id, cat: item.cat, status, owner: owner || null, due: due || null, note }); await queryClient.invalidateQueries(); toast({ title: "Exception updated" }); onClose(); }
    catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); }
  };
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
        {item ? <div className="space-y-4">
          <div><Pill tone={item.group === "Financial" ? "bad" : item.group === "Bond" ? "warn" : "info"}>{item.group}</Pill><SheetTitle className="mt-2 text-[18px]">{EXC_LABEL[item.cat]}</SheetTitle><div className="text-[13px] text-muted-foreground">{item.row.entity} · {item.row.projectId} — {item.row.projectName}</div></div>
          <div className="rounded-lg border bg-muted/40 p-3 text-[13px]">{EXPLAIN[item.cat](item.row, th)}</div>
          <Button variant="outline" size="sm" onClick={() => { openProject(item.row.id); onClose(); }}>Open Project 360</Button>
          <div className="flex flex-wrap gap-1">{FLOW.map((f, i) => <span key={f} className={`rounded px-2 py-1 text-[11.5px] ${FLOW.indexOf(status as any) >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</span>)}</div>
          {can ? <div className="space-y-3">
            <div><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger data-testid="select-exc-status"><SelectValue /></SelectTrigger><SelectContent>{ALL_ST.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Owner</Label><Select value={owner || "__none"} onValueChange={(v) => setOwner(v === "__none" ? "" : v)}><SelectTrigger data-testid="select-exc-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">Unassigned</SelectItem>{ownerOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Due date</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
            <div><Label>Note {status === "Resolved" || status === "Waived" ? "(required)" : ""}</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was found, what changed, who confirmed" data-testid="input-exc-note" /></div>
            <Button onClick={save} data-testid="button-save-exc">Save</Button>
          </div> : <Note>You have view-only access to exceptions.</Note>}
          <div><div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Activity</div>
            {ev.data?.length ? ev.data.map((e) => <div key={e.id} className="border-b py-2 text-[12.5px] last:border-0"><div className="flex justify-between"><b className="font-medium">{e.action}</b><span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span></div><div className="text-muted-foreground">{e.user_name}{e.note ? ` — “${e.note}”` : ""}</div></div>) : <p className="text-[12.5px] text-muted-foreground">No activity yet.</p>}
          </div>
        </div> : null}
      </SheetContent>
    </Sheet>
  );
}
