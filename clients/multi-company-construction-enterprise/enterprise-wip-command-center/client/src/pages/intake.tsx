import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Mail, KeyRound, Copy, Check, X, FileSpreadsheet, CircleCheck, CircleDashed, Upload, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, download, queryClient, useSession, API_BASE } from "@/lib/queryClient";
import { useWip, canEdit, isExec, fileToBase64 } from "@/lib/app";
import { PageHeader, Panel, Tag, DataTable, Pill, Note, FileDrop, Kpi } from "@/components/kit";
import { Skeleton } from "./command";

type Imp = { id: string; period: string; channel: string; filename: string; sender: string | null; subject: string | null; format: string; entities: string[]; rowsTotal: number; rowsValid: number; errors: number; warnings: number; status: string; createdAt: string; createdBy: string; committedAt: string | null; committedBy: string | null; sha: string; validation: any; staged?: any[] };
const ST_TONE: Record<string, any> = { committed: "ok", staged: "warn", rejected: "muted", superseded: "muted", failed: "bad" };

function CopyBtn({ text }: { text: string }) { const [ok, setOk] = useState(false); return <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }} aria-label="Copy">{ok ? <Check /> : <Copy />}</Button>; }

export default function IntakePage() {
  const w = useWip(); const s = useSession(); const { toast } = useToast();
  const hist = useQuery<Imp[]>({ queryKey: ["/api/imports"] });
  const [busy, setBusy] = useState(false); const [staged, setStaged] = useState<Imp | null>(null); const [batch, setBatch] = useState<Imp[]>([]); const [prog, setProg] = useState("");
  const [forceEnt, setForceEnt] = useState("auto"); const [forcePer, setForcePer] = useState("");
  const received = useMemo(() => {
    if (!w.view || !w.boot) return [];
    return w.boot.entities.filter((e) => e.expected).map((e) => { const rs = w.view!.all.filter((r) => r.entity === e.code); const imp = hist.data?.find((i) => i.status === "committed" && i.period === w.period?.id && i.entities.includes(e.code)); return { e, n: rs.length, el: rs.filter((r) => r.eligible).length, file: rs[0]?.sourceFile || imp?.filename || null, imp }; });
  }, [w.view, w.boot, hist.data, w.period]);
  if (!w.boot || !w.period) return <div><PageHeader title="WIP intake" /><Skeleton /></div>;
  const recN = received.filter((r) => r.n > 0).length;
  const onFiles = async (fs: File[]) => {
    setBusy(true); const got: Imp[] = []; if (fs.length > 1) setBatch([]);
    for (const [n, f] of fs.entries()) {
      setProg(fs.length > 1 ? `Reading ${n + 1} of ${fs.length}: ${f.name}` : "");
      try {
        const r = await api<{ duplicate: boolean; import: Imp }>("POST", "/api/imports/stage", { filename: f.name, contentBase64: await fileToBase64(f), period: forcePer || undefined, entity: forceEnt === "auto" ? undefined : forceEnt });
        const full = await api<Imp>("GET", `/api/imports/${r.import.id}`); got.push(full); if (fs.length === 1) setStaged(full); else setBatch([...got]);
        if (r.duplicate) toast({ title: "Already received", description: `${f.name} matches an earlier file exactly — showing that import.` });
      } catch (e: any) { toast({ title: `Couldn’t read ${f.name}`, description: e.message, variant: "destructive" }); }
    }
    setBusy(false); setProg(""); queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
    if (fs.length > 1) toast({ title: `${got.length} of ${fs.length} files read`, description: `${got.filter((i) => i.errors === 0).length} ready to load, ${got.filter((i) => i.errors > 0).length} need attention. Review below, then load.` });
  };
  const loadAll = async () => {
    const ready = batch.filter((i) => i.status === "staged" && i.errors === 0); let ok = 0, rows = 0; const fails: string[] = [];
    setBusy(true);
    for (const [n, i] of ready.entries()) { setProg(`Loading ${n + 1} of ${ready.length}: ${i.filename}`); try { const r = await api<any>("POST", `/api/imports/${i.id}/commit`); ok++; rows += r.rows; } catch (e: any) { fails.push(`${i.filename}: ${e.message}`); } }
    setBusy(false); setProg(""); await queryClient.invalidateQueries();
    const fresh = await Promise.all(batch.map((i) => api<Imp>("GET", `/api/imports/${i.id}`).catch(() => i))); setBatch(fresh);
    toast({ title: `Loaded ${ok} file${ok === 1 ? "" : "s"} · ${rows.toLocaleString()} rows`, description: fails.length ? `Not loaded: ${fails.join("; ")}` : "Each file replaced only its own entity’s rows for that month.", variant: fails.length ? "destructive" : undefined });
  };
  const commit = async () => { if (!staged) return; try { const r = await api<any>("POST", `/api/imports/${staged.id}/commit`); await queryClient.invalidateQueries(); toast({ title: `Loaded ${r.rows} rows into ${r.period}`, description: `Entities: ${r.entities.join(", ")}. Prior rows for these entities in this period were replaced; the old import is kept as superseded.` }); setStaged(null); } catch (e: any) { toast({ title: "Couldn’t load", description: e.message, variant: "destructive" }); } };
  const reject = async () => { if (!staged) return; await api("POST", `/api/imports/${staged.id}/reject`); await queryClient.invalidateQueries({ queryKey: ["/api/imports"] }); setStaged(null); toast({ title: "Import rejected", description: "Nothing was loaded." }); };
  return (
    <div>
      <PageHeader title="WIP intake" subtitle="Each entity sends its standardized WIP to the intake mailbox (or uploads it here). The file is validated against the field dictionary and rules, previewed, then loaded — replacing only that entity’s rows for that month."
        tags={<><Tag kind="source" /><Tag kind="proposed">Template proposed, pending executive approval</Tag></>}
        actions={<Button variant="outline" size="sm" onClick={() => download("/api/template/wip.xlsx", "Standard_WIP_Template_PROPOSED_v0.1.xlsx")} data-testid="button-wip-template"><Download /> Standard WIP template</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={`Received for ${w.period.label}`} value={`${recN} / ${received.length}`} sub="expected entity WIPs" kind="source" />
        <Kpi label="Rows loaded" value={w.view!.all.length.toLocaleString()} sub={`${w.view!.all.filter((r) => r.eligible).length} reporting-eligible`} kind="source" />
        <Kpi label="Email intake" value={w.boot.intake.hasKey ? "Active" : "Not set up"} sub={w.boot.intake.address || "No mailbox set"} kind="user" />
        <Kpi label="Awaiting review" value={(hist.data || []).filter((i) => i.status === "staged").length} sub="staged imports not yet loaded" kind="source" />
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="mb-3"><TabsTrigger value="upload" data-testid="tab-upload"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload & validate</TabsTrigger><TabsTrigger value="checklist" data-testid="tab-checklist">Monthly checklist</TabsTrigger><TabsTrigger value="email" data-testid="tab-email"><Mail className="mr-1.5 h-3.5 w-3.5" />Email intake setup</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>

        <TabsContent value="upload">
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <Panel title="1 · Drop the WIP">
              {canEdit(s.user?.role) ? <div className="space-y-3">
                <FileDrop onFiles={onFiles} busy={busy} sub="Drop one company WIP or all of them at once (.xlsx, .xlsm, .csv). Each company’s current layout is read as-is." />
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[11.5px]">Entity</Label><Select value={forceEnt} onValueChange={setForceEnt}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Detect automatically</SelectItem>{w.boot.entities.map((e) => <SelectItem key={e.code} value={e.code}>{e.code} — {e.company}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-[11.5px]">Period (YYYY-MM)</Label><Input className="h-8" placeholder="detect" value={forcePer} onChange={(e) => setForcePer(e.target.value)} /></div>
                </div>
                <p className="text-[12px] text-muted-foreground">Entity and period are detected from the file contents, sheet name, filename (e.g. “2026-08-31 WIP SRI.xlsx”) or email subject. Set them here only if detection fails.</p>
              </div> : <Note>Your role can view intake but not load files.</Note>}
            </Panel>
            <Panel title="2 · Review before loading" subtitle={staged ? `${staged.filename} · ${staged.format}` : "The validation preview appears here"}>
              {staged ? <StagedView imp={staged} onCommit={commit} onReject={reject} can={canEdit(s.user?.role)} /> : <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground"><FileSpreadsheet className="mb-2 h-8 w-8 opacity-50" />Nothing staged. Dropped files are checked for headers, numbers, entity, period, duplicates and rule conflicts — nothing loads until you confirm.</div>}
            </Panel>
          </div>
          {prog ? <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 text-[12.5px]" data-testid="text-batch-progress">{prog}</div> : null}
          {batch.length > 1 ? <div className="mt-4"><Panel title={`Batch · ${batch.length} files`} subtitle="Every file is checked separately. Files with blocking errors are held back; the rest can be loaded together."
            actions={canEdit(s.user?.role) ? <Button size="sm" onClick={loadAll} disabled={busy || !batch.some((i) => i.status === "staged" && i.errors === 0)} data-testid="button-load-all"><Check /> Load {batch.filter((i) => i.status === "staged" && i.errors === 0).length} clean files</Button> : null}>
            <DataTable rows={batch} rowKey={(i: Imp) => i.id} cols={[
              { key: "f", label: "File", render: (i: Imp) => <span className="text-[12.5px]">{i.filename}</span> },
              { key: "e", label: "Entity", render: (i: Imp) => <span className="font-medium">{i.entities.join(", ") || "Not detected"}</span> },
              { key: "p", label: "Period", render: (i: Imp) => i.period },
              { key: "r", label: "Rows", align: "right", render: (i: Imp) => <span className="tabular-nums">{i.rowsTotal.toLocaleString()}</span> },
              { key: "x", label: "Errors", align: "right", render: (i: Imp) => i.errors ? <Pill tone="bad">{i.errors}</Pill> : <span className="text-muted-foreground">0</span> },
              { key: "w", label: "Warnings", align: "right", render: (i: Imp) => <span className="tabular-nums">{i.warnings}</span> },
              { key: "s", label: "Status", render: (i: Imp) => <Pill tone={ST_TONE[i.status]}>{i.status}</Pill> },
              { key: "v", label: "", render: (i: Imp) => <Button size="sm" variant="ghost" onClick={() => setStaged(i)} data-testid={`button-review-${i.id}`}>Review</Button> },
            ]} />
          </Panel></div> : null}
        </TabsContent>

        <TabsContent value="checklist">
          <Panel pad={false} title={`Expected WIPs — ${w.period.label}`} subtitle="Green when that entity has rows in the period. Resubmitting replaces the entity’s rows; history is kept.">
            <DataTable rows={received} rowKey={(r) => r.e.code} pageSize={30} cols={[
              { key: "s", label: "", render: (r) => r.n ? <CircleCheck className="h-4 w-4 text-[hsl(var(--ok))]" /> : <CircleDashed className="h-4 w-4 text-muted-foreground" />, value: (r) => r.n ? 1 : 0 },
              { key: "e", label: "Entity", render: (r) => <span><b className="font-medium">{r.e.code}</b> <span className="text-muted-foreground">{r.e.company}</span>{r.e.type === "JV" ? <Pill tone="gold" className="ml-1.5">JV</Pill> : null}</span>, value: (r) => r.e.code },
              { key: "b", label: "Business unit", value: (r) => r.e.bu },
              { key: "n", label: "Rows", align: "right", value: (r) => r.n },
              { key: "el", label: "Eligible", align: "right", value: (r) => r.el },
              { key: "f", label: "Source file", render: (r) => r.file ? <span className="text-[12px]">{r.file}</span> : <span className="text-muted-foreground">Not received</span>, value: (r) => r.file },
              { key: "v", label: "Loaded via", render: (r) => r.imp ? <span className="text-[12px]">{r.imp.channel} · {new Date(r.imp.committedAt || r.imp.createdAt).toLocaleDateString()}</span> : r.n ? <span className="text-[12px] text-muted-foreground">Initial workbook load</span> : "—" },
            ]} />
          </Panel>
        </TabsContent>

        <TabsContent value="email"><EmailSetup /></TabsContent>

        <TabsContent value="history">
          <Panel pad={false}>
            <DataTable rows={hist.data || []} rowKey={(i) => i.id} onRow={async (i) => setStaged(await api<Imp>("GET", `/api/imports/${i.id}`))} search={(i) => `${i.filename} ${i.sender || ""} ${i.entities.join(" ")}`} cols={[
              { key: "t", label: "Received", render: (i) => new Date(i.createdAt).toLocaleString(), value: (i) => i.createdAt },
              { key: "c", label: "Channel", render: (i) => <Pill tone={i.channel === "email" ? "info" : "muted"}>{i.channel}</Pill>, value: (i) => i.channel },
              { key: "f", label: "File", render: (i) => <span className="text-[12.5px]">{i.filename}</span>, value: (i) => i.filename },
              { key: "p", label: "Period", value: (i) => i.period },
              { key: "e", label: "Entities", render: (i) => i.entities.join(", "), value: (i) => i.entities.join(",") },
              { key: "r", label: "Rows", align: "right", value: (i) => i.rowsTotal },
              { key: "x", label: "Errors / warnings", align: "right", render: (i) => <span>{i.errors ? <b className="text-[hsl(var(--destructive))]">{i.errors}</b> : 0} / {i.warnings}</span>, value: (i) => i.errors },
              { key: "s", label: "Status", render: (i) => <Pill tone={ST_TONE[i.status]}>{i.status}</Pill>, value: (i) => i.status },
              { key: "b", label: "By", render: (i) => <span className="text-[12px]">{i.committedBy || i.createdBy}</span> },
            ]} empty={<div className="p-6 text-center text-sm text-muted-foreground">No files received through the app yet. The July 2026 baseline was loaded from the 19 submitted WIPs in the approved workbook.</div>} />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StagedView({ imp, onCommit, onReject, can }: { imp: Imp; onCommit: () => void; onReject: () => void; can: boolean }) {
  const v = imp.validation || {}; const issues: any[] = v.issues || [];
  const [lvl, setLvl] = useState<"all" | "error" | "warning">("all");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[["Period", imp.period], ["Entities", imp.entities.join(", ") || "—"], ["Rows", imp.rowsTotal], ["Blocking errors", imp.errors], ["Warnings", imp.warnings]].map(([k, val]) => <div key={k as string} className={`rounded-lg border px-3 py-2 ${k === "Blocking errors" && imp.errors ? "border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/5" : ""}`}><div className="text-[11px] text-muted-foreground">{k}</div><div className="truncate text-[15px] font-semibold tnum">{val as any}</div></div>)}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]"><Pill tone={ST_TONE[imp.status]}>{imp.status}</Pill><span className="text-muted-foreground">Sheet “{v.sheet}”, header row {v.headerRow} · fingerprint {imp.sha}</span></div>
      {v.mapped ? <div><div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Column mapping</div><div className="flex flex-wrap gap-1.5">{Object.entries(v.mapped).map(([k, h]: any) => <span key={k} className="rounded border bg-muted/40 px-1.5 py-0.5 text-[11.5px]"><span className="text-muted-foreground">{h}</span> → <b className="font-medium">{k}</b></span>)}{(v.unmapped || []).slice(0, 12).map((h: string) => <span key={h} className="rounded border border-dashed px-1.5 py-0.5 text-[11.5px] text-muted-foreground">{h} (ignored)</span>)}</div></div> : null}
      {issues.length ? <div>
        <div className="mb-1.5 flex items-center justify-between"><div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Validation findings</div><div className="flex gap-1">{(["all", "error", "warning"] as const).map((x) => <button key={x} onClick={() => setLvl(x)} className={`rounded px-2 py-0.5 text-[11.5px] ${lvl === x ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{x}</button>)}</div></div>
        <div className="scroll-thin max-h-56 overflow-y-auto rounded-lg border">{issues.filter((i) => lvl === "all" || i.level === lvl).slice(0, 300).map((i, k) => <div key={k} className="flex gap-3 border-b px-3 py-1.5 text-[12.5px] last:border-0"><Pill tone={i.level === "error" ? "bad" : "warn"}>{i.level}</Pill><span className="w-14 shrink-0 text-muted-foreground tnum">row {i.row}</span><span className="w-32 shrink-0 truncate font-medium">{i.field}</span><span className="text-muted-foreground">{i.message}</span></div>)}</div>
      </div> : <Note>No validation findings.</Note>}
      {imp.staged?.length ? <div><div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Preview (first 8 rows)</div><div className="scroll-thin overflow-x-auto rounded-lg border"><table className="w-full min-w-max text-[12px]"><thead><tr className="border-b bg-muted/40">{["entity", "project_id", "project_name", "C", "R", "E", "A", "B", "status"].map((h) => <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead><tbody>{imp.staged.slice(0, 8).map((r, i) => <tr key={i} className="border-b last:border-0">{["entity", "project_id", "project_name", "C", "R", "E", "A", "B", "status"].map((h) => <td key={h} className="max-w-[180px] truncate px-2 py-1 tnum">{r[h] === null || r[h] === undefined ? <span className="text-muted-foreground">blank</span> : typeof r[h] === "number" ? r[h].toLocaleString() : String(r[h])}</td>)}</tr>)}</tbody></table></div></div> : null}
      {imp.status === "staged" && can ? <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button onClick={onCommit} disabled={imp.errors > 0} data-testid="button-commit"><Check /> Load {imp.rowsTotal} rows into {imp.period}</Button>
        <Button variant="outline" onClick={onReject} data-testid="button-reject"><X /> Reject</Button>
        {imp.errors > 0 ? <span className="text-[12.5px] text-[hsl(var(--destructive))]">Fix the blocking errors and re-send the file.</span> : <span className="text-[12px] text-muted-foreground">Replaces existing {imp.period} rows for {imp.entities.join(", ")} only.</span>}
      </div> : null}
    </div>
  );
}

function EmailSetup() {
  const w = useWip(); const s = useSession(); const { toast } = useToast(); const cfg = w.boot!.intake;
  const [addr, setAddr] = useState(cfg.address || ""); const [allow, setAllow] = useState((cfg.allow || []).join("\n")); const [auto, setAuto] = useState(!!cfg.autoCommit); const [newKey, setNewKey] = useState<string | null>(null);
  const endpoint = `${API_BASE || window.location.origin}/api/intake/email`;
  const save = async () => { try { await api("PUT", "/api/intake/config", { address: addr, allow: allow.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean), autoCommit: auto }); await queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] }); toast({ title: "Email intake settings saved" }); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); } };
  const rotate = async () => { try { const r = await api<{ key: string }>("POST", "/api/intake/rotate"); setNewKey(r.key); await queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] }); } catch (e: any) { toast({ title: "Couldn’t create key", description: e.message, variant: "destructive" }); } };
  const curl = `curl -X POST "${endpoint}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Intake-Key: ${newKey || "<intake key>"}" \\\n  -d '{"from":"wip@entity.com","subject":"2026-08-31 WIP SRI","attachments":[{"name":"2026-08-31 WIP SRI.xlsx","contentBytes":"<base64>"}]}'`;
  const steps = [
    ["Trigger", "Office 365 Outlook — “When a new email arrives (V3)” on the shared mailbox, folder Inbox, Include Attachments = Yes, Only with Attachments = Yes. Optional subject filter: “WIP”."],
    ["Action", "HTTP — Method POST, URI = the endpoint below."],
    ["Headers", "Content-Type: application/json and X-Intake-Key: the key generated on this page (store it as a secure input)."],
    ["Body", "{ \"from\": From, \"subject\": Subject, \"receivedAt\": Received Time, \"attachments\": Attachments } — pass the Attachments array as-is; each item has name and contentBytes."],
    ["Reply (optional)", "Parse the response JSON and send a reply to the sender with results[].message so each entity sees “loaded”, “staged for review” or the blocking issue."],
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Mailbox and rules" tags={<Tag kind="user">Your settings</Tag>}>
        <div className="space-y-3">
          <div><Label>Intake mailbox address</Label><Input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="wip@yourcompany.com" disabled={!isExec(s.user?.role)} data-testid="input-intake-address" /><p className="mt-1 text-[12px] text-muted-foreground">The shared mailbox entities send their WIP to. Created in Microsoft 365 by IT — not by this app.</p></div>
          <div><Label>Allowed senders</Label><Textarea rows={4} value={allow} onChange={(e) => setAllow(e.target.value)} placeholder={"controller@enterprise.example.com\n@contractor.example.com"} disabled={!isExec(s.user?.role)} data-testid="input-intake-allow" /><p className="mt-1 text-[12px] text-muted-foreground">One per line. Use @domain.com to allow a whole domain. Leave empty to accept any sender that has the key.</p></div>
          <div className="flex items-center justify-between rounded-lg border p-3"><div><div className="text-[13px] font-medium">Load clean files automatically</div><div className="text-[12px] text-muted-foreground">Files with zero blocking errors load straight in (never into a published month). Anything else waits in “Upload & validate”.</div></div><Switch checked={auto} onCheckedChange={setAuto} disabled={!isExec(s.user?.role)} data-testid="switch-autocommit" /></div>
          {isExec(s.user?.role) ? <Button onClick={save} data-testid="button-save-intake">Save settings</Button> : null}
        </div>
      </Panel>
      <Panel title="Connection key" subtitle={cfg.hasKey ? `Active key ending ••••${cfg.keyLast4} · created ${cfg.rotatedAt ? new Date(cfg.rotatedAt).toLocaleString() : ""}` : "No key yet — email intake is off until one is generated"}>
        <div className="space-y-3">
          {newKey ? <div className="rounded-lg border border-[hsl(var(--gold))]/50 bg-[hsl(var(--gold))]/10 p-3"><div className="mb-1 text-[12.5px] font-semibold">Copy this key now — it won’t be shown again</div><div className="flex items-center gap-2"><code className="flex-1 break-all rounded bg-background px-2 py-1.5 text-[12px]" data-testid="text-new-key">{newKey}</code><CopyBtn text={newKey} /></div></div> : null}
          {s.user?.role === "admin" ? <Button variant="outline" onClick={rotate} data-testid="button-rotate-key"><KeyRound /> {cfg.hasKey ? "Replace key" : "Generate key"}</Button> : <Note>Only an administrator can generate or replace the key.</Note>}
          <div><Label>Endpoint</Label><div className="flex items-center gap-1"><code className="flex-1 break-all rounded border bg-muted/40 px-2 py-1.5 text-[12px]" data-testid="text-endpoint">{endpoint}</code><CopyBtn text={endpoint} /></div></div>
          <p className="text-[12px] text-muted-foreground">Keys are stored only as a one-way hash. Replacing the key immediately disables the old one. Each file is fingerprinted, so a re-sent email never loads twice.</p>
        </div>
      </Panel>
      <Panel className="xl:col-span-2" title={<span className="flex items-center gap-2"><Workflow className="h-4 w-4" /> Power Automate flow (5 steps)</span>} subtitle="Built once by IT on the shared mailbox; after that, every emailed WIP flows in with no manual steps">
        <ol className="grid gap-3 md:grid-cols-5">{steps.map(([t, d], i) => <li key={t} className="rounded-lg border p-3"><div className="mb-1 flex items-center gap-2 text-[13px] font-semibold"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{i + 1}</span>{t}</div><p className="text-[12px] leading-5 text-muted-foreground">{d}</p></li>)}</ol>
        <div className="mt-4"><div className="mb-1 flex items-center justify-between"><Label>Test from a terminal</Label><CopyBtn text={curl} /></div><pre className="scroll-thin overflow-x-auto rounded-lg border bg-muted/40 p-3 text-[11.5px] leading-5">{curl}</pre></div>
      </Panel>
    </div>
  );
}
