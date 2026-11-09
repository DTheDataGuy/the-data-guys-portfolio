import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip, canEdit } from "@/lib/app";
import { useOpps, OPEN_STAGES, type Opp } from "@/lib/fc";
import { PageHeader, Panel, Tag, DataTable, Pill, Money, $M, P, Kpi, Empty } from "@/components/kit";
import { Skeleton } from "./command";

const STAGES = ["Opportunity", "Bid", "Award", "Project Setup", "Lost", "No Bid"];
const LIFE = ["Opportunity", "Bid", "Award", "Project Setup", "Execution", "WIP", "Forecast", "Closeout"];
const blank = { entity: "", name: "", customer: "", bid_date: "", value: "", probability: "", stage: "Opportunity", start_month: "", duration: "", margin: "", bonded: false, owner: "", linked: "", notes: "" };
type F = typeof blank;

export default function PipelinePage() {
  const w = useWip(); const s = useSession(); const q = useOpps(); const { toast } = useToast();
  const [form, setForm] = useState<(F & { id?: string }) | null>(null); const [stage, setStage] = useState("open");
  const opps = q.data || [];
  const st = useMemo(() => STAGES.map((k) => { const xs = opps.filter((o) => o.stage === k); return { k, n: xs.length, v: xs.reduce((a, o) => a + (o.value || 0), 0), w: xs.reduce((a, o) => a + (o.value || 0) * (o.probability ?? 0), 0) }; }), [opps]);
  if (!w.boot || q.isLoading) return <div><PageHeader title="Bid pipeline" /><Skeleton /></div>;
  const open = opps.filter((o) => OPEN_STAGES.includes(o.stage));
  const won = opps.filter((o) => ["Award", "Project Setup"].includes(o.stage)).length, lost = opps.filter((o) => o.stage === "Lost").length;
  const shown = stage === "open" ? open : stage === "all" ? opps : opps.filter((o) => o.stage === stage);
  const edit = (o: Opp) => setForm({ id: o.id, entity: o.entity || "", name: o.name, customer: o.customer || "", bid_date: o.bid_date || "", value: o.value != null ? String(o.value) : "", probability: o.probability != null ? String(Math.round(o.probability * 100)) : "", stage: o.stage, start_month: o.start_month || "", duration: o.duration != null ? String(o.duration) : "", margin: o.margin != null ? String(+(o.margin * 100).toFixed(2)) : "", bonded: o.bonded, owner: o.owner || "", linked: o.linked || "", notes: o.notes || "" });
  const save = async () => {
    if (!form) return; const n = (v: string, pct = false) => v.trim() === "" ? null : Number(v.replace(/[$,%]/g, "")) / (pct ? 100 : 1);
    const body = { ...form, value: n(form.value), probability: n(form.probability, true), margin: n(form.margin, true), duration: n(form.duration) }; delete (body as any).id;
    try { if (form.id) await api("PATCH", `/api/opps/${form.id}`, body); else await api("POST", "/api/opps", body); await queryClient.invalidateQueries({ queryKey: ["/api/opps"] }); setForm(null); toast({ title: form.id ? "Opportunity updated" : "Opportunity added", description: "Forecast, capacity and planning views now include it." }); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); }
  };
  const del = async (id: string) => { await api("DELETE", `/api/opps/${id}`); await queryClient.invalidateQueries({ queryKey: ["/api/opps"] }); setForm(null); toast({ title: "Opportunity removed" }); };
  const can = canEdit(s.user?.role);
  return (
    <div>
      <PageHeader title="Estimating & bid pipeline" subtitle="Connects future work to the governed WIP so backlog gaps show up before they happen. Opportunities are entered by your estimating team — none are pre-loaded or estimated by the app."
        tags={<><Tag kind="user">Entered by estimating</Tag><Tag kind="proposed">Stage gates proposed, pending executive approval</Tag></>}
        actions={can ? <Button size="sm" onClick={() => setForm({ ...blank })} data-testid="button-add-opp"><Plus /> Add opportunity</Button> : null} />
      <Panel className="mb-4" title="Project lifecycle" subtitle="Where each stage lives in the system">
        <div className="scroll-thin flex items-stretch gap-1 overflow-x-auto pb-1">{LIFE.map((k, i) => { const live = ["Execution", "WIP", "Forecast"].includes(k) || (OPEN_STAGES.includes(k)); const c = st.find((x) => x.k === k); return <div key={k} className="flex items-center gap-1"><div className={`min-w-[118px] rounded-lg border px-3 py-2 ${["Execution", "WIP", "Forecast"].includes(k) ? "border-primary/40 bg-primary/5" : ""}`}><div className="text-[12.5px] font-semibold">{k}</div><div className="text-[11.5px] text-muted-foreground">{c ? `${c.n} · ${$M(c.v)}` : k === "WIP" ? `${w.view?.eligible.length ?? "…"} projects` : k === "Closeout" ? "Proposed" : "Governed WIP"}</div>{!live && k === "Closeout" ? <Pill tone="gold" className="mt-1">Proposed</Pill> : null}</div>{i < LIFE.length - 1 ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}</div>; })}</div>
      </Panel>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Open opportunities" value={open.length} sub={$M(open.reduce((a, o) => a + (o.value || 0), 0)) + " face value"} kind="user" />
        <Kpi label="Weighted pipeline" value={$M(open.reduce((a, o) => a + (o.value || 0) * (o.probability ?? 0), 0))} sub="value × probability" kind="calc" how={{ formula: "Σ value × probability over Opportunity, Bid, Award, Project Setup" }} />
        <Kpi label="Bonded opportunities" value={open.filter((o) => o.bonded).length} sub="count against bond capacity" kind="user" />
        <Kpi label="Hit rate" value={won + lost ? P(won / (won + lost), 0) : "—"} sub={won + lost ? `${won} won / ${lost} lost` : "needs decided bids"} kind="calc" how={{ formula: "(Award + Project Setup) ÷ (Award + Project Setup + Lost)" }} />
      </div>
      <Panel pad={false} title="Opportunities" actions={<Select value={stage} onValueChange={setStage}><SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open stages</SelectItem><SelectItem value="all">All stages</SelectItem>{STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>}>
        {opps.length === 0 ? <Empty title="No opportunities yet" body="Add bids as they are identified. For each one, value, win probability, expected start month and duration let it flow into the revenue forecast, cash model and bond-capacity headroom." action={can ? <Button size="sm" onClick={() => setForm({ ...blank })}><Plus /> Add the first opportunity</Button> : undefined} /> :
          <DataTable rows={shown} rowKey={(o) => o.id} onRow={can ? edit : undefined} search={(o) => `${o.id} ${o.name} ${o.customer || ""} ${o.entity || ""} ${o.owner || ""}`} cols={[
            { key: "id", label: "ID", render: (o) => <span className="font-mono text-[12px]">{o.id}</span>, value: (o) => o.id },
            { key: "n", label: "Opportunity", render: (o) => <span><b className="font-medium">{o.name}</b> <span className="text-muted-foreground">{o.customer || ""}</span></span>, value: (o) => o.name },
            { key: "e", label: "Entity", value: (o) => o.entity },
            { key: "s", label: "Stage", render: (o) => <Pill tone={o.stage === "Lost" || o.stage === "No Bid" ? "muted" : o.stage === "Award" || o.stage === "Project Setup" ? "ok" : "info"}>{o.stage}</Pill>, value: (o) => STAGES.indexOf(o.stage) },
            { key: "d", label: "Bid date", value: (o) => o.bid_date },
            { key: "v", label: "Value", align: "right", render: (o) => <Money v={o.value} />, value: (o) => o.value },
            { key: "p", label: "Prob.", align: "right", render: (o) => o.probability != null ? P(o.probability, 0) : "—", value: (o) => o.probability },
            { key: "w", label: "Weighted", align: "right", render: (o) => o.value != null && o.probability != null ? <Money v={o.value * o.probability} /> : "—", value: (o) => (o.value || 0) * (o.probability ?? 0) },
            { key: "st", label: "Start / months", render: (o) => o.start_month ? `${o.start_month} · ${o.duration ?? "?"}` : <span className="text-muted-foreground">not scheduled</span> },
            { key: "b", label: "Bonded", render: (o) => o.bonded ? <Pill tone="gold">Bonded</Pill> : "—", value: (o) => o.bonded ? 1 : 0 },
            { key: "o", label: "Owner", value: (o) => o.owner },
          ]} />}
      </Panel>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{form?.id ? `Edit ${form.id}` : "Add opportunity"}</DialogTitle><DialogDescription>Only opportunities with value, probability, start month and duration flow into the forecast.</DialogDescription></DialogHeader>
          {form ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-opp-name" /></div>
            <div><Label>Stage</Label><Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Entity</Label><Select value={form.entity || "none"} onValueChange={(v) => setForm({ ...form, entity: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{w.boot!.entities.map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Customer</Label><Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></div>
            <div><Label>Bid date</Label><Input type="date" value={form.bid_date} onChange={(e) => setForm({ ...form, bid_date: e.target.value })} /></div>
            <div><Label>Contract value ($)</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} data-testid="input-opp-value" /></div>
            <div><Label>Win probability (%)</Label><Input value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} data-testid="input-opp-prob" /></div>
            <div><Label>Expected margin (%)</Label><Input value={form.margin} onChange={(e) => setForm({ ...form, margin: e.target.value })} /></div>
            <div><Label>Start month</Label><Input type="month" value={form.start_month} onChange={(e) => setForm({ ...form, start_month: e.target.value })} /></div>
            <div><Label>Duration (months)</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <div><Label>Owner</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
            <div><Label>Linked project ID (after award)</Label><Input value={form.linked} onChange={(e) => setForm({ ...form, linked: e.target.value })} /></div>
            <div className="flex items-end gap-2 pb-2"><Switch checked={form.bonded} onCheckedChange={(v) => setForm({ ...form, bonded: v })} /><Label>Requires bond</Label></div>
            <div className="col-span-2 md:col-span-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div> : null}
          <DialogFooter className="gap-2">{form?.id ? <Button variant="ghost" className="mr-auto text-[hsl(var(--destructive))]" onClick={() => del(form.id!)}><Trash2 /> Delete</Button> : null}<Button onClick={save} data-testid="button-save-opp">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
