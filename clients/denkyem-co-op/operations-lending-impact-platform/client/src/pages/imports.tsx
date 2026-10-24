import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader, Card, Empty, Pill, SimpleTable, Callout, DownloadLink } from "@/components/kit";
import { apiRequest, apiUpload, queryClient, ApiError } from "@/lib/queryClient";
import { useApp, DOMAIN_WRITE, DOMAIN_READ } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dateTimeLabel, money } from "@/lib/format";
import { UploadCloud, FileSpreadsheet, RefreshCw, Send, Check, X, RotateCcw, AlertTriangle, CircleCheck } from "lucide-react";

const STATUS_TONE: Record<string, any> = { staged: "muted", submitted: "gold", approved: "green", partially_approved: "green", failed: "red", rejected: "red", rolled_back: "bronze", duplicate: "amber" };
const STEPS = ["Upload", "Map", "Validate", "Reconcile", "Submit", "Approve"];

export default function Imports() {
  const { role, demo } = useApp();
  const { toast } = useToast();
  const { data: contracts } = useQuery<any[]>({ queryKey: ["/api/contracts"] });
  const { data: batches } = useQuery<any[]>({ queryKey: ["/api/imports", { _r: role, _d: demo }] });
  const writable = useMemo(() => (contracts ?? []).filter((c) => DOMAIN_WRITE[c.domain]?.includes(role)), [contracts, role]);
  const [dataset, setDataset] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [sheet, setSheet] = useState("");
  const [period, setPeriod] = useState("");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null> | null>(null);
  const [note, setNote] = useState("");
  const [partial, setPartial] = useState(false);
  const { data: batch } = useQuery<any>({ queryKey: [`/api/imports/${batchId}`, { _r: role, _d: demo }], enabled: !!batchId });
  const def = contracts?.find((c) => c.key === (batch?.dataset ?? dataset));

  const parse = async (f: File) => {
    setFile(f);
    setParsed(null);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const p = await apiUpload("/api/imports/parse", fd);
      setParsed(p);
      setSheet(p.sheets[0]?.name ?? "");
    } catch (e: any) {
      toast({ title: "Could not read file", description: e.message, variant: "destructive" });
    }
  };
  const stage = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("dataset", dataset);
      if (sheet) fd.append("sheet", sheet);
      if (period) fd.append("reportingPeriod", period);
      return apiUpload("/api/imports", fd);
    },
    onSuccess: (b) => {
      queryClient.setQueryData([`/api/imports/${b.id}`, { _r: role, _d: demo }], b);
      setBatchId(b.id);
      setMapping(null);
      queryClient.invalidateQueries({ queryKey: ["/api/imports"] });
      toast({ title: b.status === "duplicate" ? "Identical file already approved" : b.status === "failed" ? "Staged with blocking errors" : "Staged — review mapping and validation" });
    },
    onError: (e: ApiError) => toast({ title: "Upload blocked", description: e.message, variant: "destructive" }),
  });
  const action = useMutation({
    mutationFn: async ({ a, body }: { a: string; body?: any }) => (await apiRequest("POST", `/api/imports/${batchId}/${a}`, body ?? {})).json(),
    onSuccess: (r, v) => {
      if (v.a === "remap" || v.a === "submit" || v.a === "reject" || v.a === "rollback") queryClient.setQueryData([`/api/imports/${batchId}`, { _r: role, _d: demo }], r.batch ?? r);
      queryClient.invalidateQueries();
      setMapping(null);
      toast({ title: v.a === "approve" ? `Approved — ${r.inserted} added, ${r.skipped} unchanged, ${r.quarantined} quarantined` : v.a === "remap" ? "Mapping saved and revalidated" : `Batch ${v.a === "submit" ? "submitted" : v.a === "reject" ? "rejected" : "rolled back"}` });
      setNote("");
    },
    onError: (e: ApiError) => toast({ title: "Action blocked", description: e.message, variant: "destructive" }),
  });

  const mapNow = mapping ?? batch?.mapping ?? {};
  const stepIdx = !batch ? 0 : batch.status === "staged" ? 3 : batch.status === "submitted" ? 4 : ["approved", "partially_approved", "rolled_back"].includes(batch.status) ? 6 : 2;
  const canApprove = ["admin", "lending", "program", "finance"].includes(role);
  const errorRows = batch?.reconciliation?.errorRows ?? 0;

  return (
    <div>
      <PageHeader kicker="Data operations" title="Import & reconcile" description="Upload CSV or Excel exports (LoanWell, NED, CRSP workbook, CRP reports, statements, Mighty Networks, ActiveCampaign). Nothing is published until every step passes and a second person approves. Identical files are detected and never duplicated." />
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${i < stepIdx ? "bg-primary text-primary-foreground" : i === stepIdx ? "bg-[hsl(var(--chart-2))] text-[hsl(164_69%_12%)]" : "bg-muted text-muted-foreground"}`}>
              {i + 1}. {s}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-border" />}
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card title="1 · Upload a file">
            {writable.length ? (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-[13px]">Target dataset</Label>
                  <Select value={dataset} onValueChange={setDataset}>
                    <SelectTrigger data-testid="select-import-dataset">
                      <SelectValue placeholder="Choose dataset…" />
                    </SelectTrigger>
                    <SelectContent>
                      {writable.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {dataset && <div className="mt-1 text-[11px] text-muted-foreground">Source: {contracts?.find((c) => c.key === dataset)?.source}</div>}
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center hover:bg-muted/40" data-testid="dropzone">
                  <UploadCloud className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{file ? file.name : "Choose CSV or XLSX"}</span>
                  <span className="text-[11px] text-muted-foreground">Up to 25 MB</span>
                  <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} data-testid="input-file" />
                </label>
                {parsed && parsed.sheets.length > 1 && (
                  <div>
                    <Label className="mb-1.5 block text-[13px]">Sheet</Label>
                    <Select value={sheet} onValueChange={setSheet}>
                      <SelectTrigger data-testid="select-sheet">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {parsed.sheets.map((s: any) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name} · {s.rowCount} rows
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {parsed && (
                  <div className="rounded-md bg-muted/60 p-2.5 text-xs">
                    <FileSpreadsheet className="mr-1 inline h-3.5 w-3.5" />
                    {parsed.sheets.find((s: any) => s.name === sheet)?.rowCount ?? 0} rows · {parsed.sheets.find((s: any) => s.name === sheet)?.headers.length ?? 0} columns · checksum {parsed.checksum.slice(0, 10)}…
                  </div>
                )}
                <div>
                  <Label className="mb-1.5 block text-[13px]">Reporting period (optional)</Label>
                  <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} data-testid="input-period" />
                </div>
                <Button className="w-full" disabled={!file || !dataset || stage.isPending} onClick={() => stage.mutate()} data-testid="button-stage">
                  {stage.isPending ? "Staging…" : "Stage file for validation"}
                </Button>
                {dataset && <DownloadLink href={`/api/templates/${dataset}`} testId="download-import-template">Download template</DownloadLink>}
              </div>
            ) : (
              <Empty title="Your role cannot import">Switch to a staff or administrator role.</Empty>
            )}
          </Card>
          <Card title="Import history" bodyClass="p-0">
            <div className="max-h-[440px] divide-y overflow-y-auto">
              {(batches ?? []).map((b) => (
                <button key={b.id} onClick={() => { setBatchId(b.id); setMapping(null); }} className={`block w-full px-4 py-2.5 text-left hover:bg-muted/50 ${batchId === b.id ? "bg-accent" : ""}`} data-testid={`batch-${b.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">#{b.id} · {b.datasetLabel}</span>
                    <Pill tone={STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Pill>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {b.fileName} · {b.rowCount} rows · {dateTimeLabel(b.createdAt)}
                  </div>
                </button>
              ))}
              {!batches?.length && <div className="px-4 py-4 text-sm text-muted-foreground">No imports yet.</div>}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          {!batch ? (
            <Card>
              <Empty title="Stage a file or pick a batch">Mapping, validation and reconciliation appear here. Legacy column names (including misspellings like “Denkeym”) are recognized automatically.</Empty>
            </Card>
          ) : (
            <>
              <Card
                title={`Batch #${batch.id} · ${batch.datasetLabel}`}
                subtitle={`${batch.fileName}${batch.sheetName ? ` · sheet ${batch.sheetName}` : ""} · uploaded by ${batch.createdBy} ${dateTimeLabel(batch.createdAt)} · mapping v${batch.mappingVersion}`}
                action={<Pill tone={STATUS_TONE[batch.status]}>{batch.status.replace("_", " ")}</Pill>}
              >
                {batch.failureReason && (
                  <div className="mb-3 flex gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {batch.failureReason}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[
                    ["Rows in file", batch.reconciliation.rowsInFile ?? batch.rowCount],
                    ["Valid rows", batch.reconciliation.validRows ?? batch.validCount],
                    ["Rows with errors", batch.reconciliation.errorRows ?? 0],
                    ["Warnings", batch.warningCount],
                    ["Approved after (full)", batch.reconciliation.approvedAfterIfFull ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-lg border p-3">
                      <div className="text-[11px] text-muted-foreground">{k}</div>
                      <div className="mt-0.5 text-lg font-semibold tabular-nums">{v as any}</div>
                    </div>
                  ))}
                </div>
                {batch.reconciliation.moneyTotals && Object.keys(batch.reconciliation.moneyTotals).length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-xs font-semibold">Monetary control totals</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(batch.reconciliation.moneyTotals).map(([k, v]: any) => (
                        <span key={k} className="rounded border px-2 py-1">
                          {k}: <b className="tabular-nums">{money(v)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {batch.reconciliation.typeStatusCounts && Object.keys(batch.reconciliation.typeStatusCounts).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {Object.entries(batch.reconciliation.typeStatusCounts).map(([k, v]: any) => (
                      <Pill key={k} tone={k.endsWith("completed") ? "green" : "amber"}>
                        {k}: {v}
                      </Pill>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="2 · Map columns" subtitle="Each source column maps to one contract field or is ignored" action={["staged", "failed"].includes(batch.status) && <Button size="sm" variant="outline" onClick={() => action.mutate({ a: "remap", body: { mapping: mapNow } })} data-testid="button-remap"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Save &amp; revalidate</Button>}>
                <div className="grid gap-2 md:grid-cols-2">
                  {batch.headers.map((h: string) => (
                    <div key={h} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                      <span className="w-[42%] truncate text-xs font-medium" title={h}>{h}</span>
                      <span className="text-muted-foreground">→</span>
                      <Select value={mapNow[h] ?? "__ignore"} onValueChange={(v) => setMapping({ ...mapNow, [h]: v === "__ignore" ? null : v })} disabled={!["staged", "failed"].includes(batch.status)}>
                        <SelectTrigger className="h-7 flex-1 text-xs" data-testid={`map-${h}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__ignore">Ignore column</SelectItem>
                          {def?.fields.map((f: any) => (
                            <SelectItem key={f.key} value={f.key}>
                              {f.label}
                              {f.required ? " *" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="3 · Validation" subtitle={`${batch.issueTotal} issues`} action={batch.issueTotal > 0 && <DownloadLink href={`/api/imports/${batch.id}/errors`} testId="download-errors">Issues CSV</DownloadLink>}>
                {batch.issues.length ? (
                  <div className="max-h-64 overflow-y-auto">
                    <SimpleTable
                      dense
                      columns={[
                        { key: "row", label: "Row", render: (r) => (r.row ? r.row : "File") },
                        { key: "field", label: "Field", render: (r) => r.field ?? "—" },
                        { key: "severity", label: "Severity", render: (r) => <Pill tone={r.severity === "error" ? "red" : "amber"}>{r.severity}</Pill> },
                        { key: "message", label: "What to fix" },
                      ]}
                      rows={batch.issues.slice(0, 200)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CircleCheck className="h-4 w-4" /> No issues found.
                  </div>
                )}
              </Card>

              <Card title="Preview (first rows, mapped)">
                <div className="max-h-72 overflow-auto">
                  <SimpleTable dense columns={(def?.fields ?? []).slice(0, 9).map((f: any) => ({ key: f.key, label: f.label, render: (r: any) => (r[f.key] == null ? "—" : String(r[f.key])) }))} rows={batch.preview} />
                </div>
              </Card>

              <Card title="4–6 · Submit, approve, roll back">
                <div className="space-y-3">
                  <Textarea placeholder="Note (required for partial approval, rejection or rollback)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} data-testid="input-batch-note" />
                  <div className="flex flex-wrap items-center gap-2">
                    {batch.status === "staged" && (
                      <Button onClick={() => action.mutate({ a: "submit" })} data-testid="button-batch-submit">
                        <Send className="mr-1.5 h-4 w-4" /> Submit for approval
                      </Button>
                    )}
                    {batch.status === "submitted" && canApprove && (
                      <>
                        {errorRows > 0 && (
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={partial} onCheckedChange={(v) => setPartial(!!v)} data-testid="checkbox-partial" /> Approve valid rows only; quarantine {errorRows} error rows
                          </label>
                        )}
                        <Button onClick={() => action.mutate({ a: "approve", body: { partial, note } })} data-testid="button-batch-approve">
                          <Check className="mr-1.5 h-4 w-4" /> Approve &amp; publish
                        </Button>
                      </>
                    )}
                    {["staged", "submitted", "failed"].includes(batch.status) && canApprove && (
                      <Button variant="outline" onClick={() => action.mutate({ a: "reject", body: { note } })} data-testid="button-batch-reject">
                        <X className="mr-1.5 h-4 w-4" /> Reject
                      </Button>
                    )}
                    {["approved", "partially_approved"].includes(batch.status) && canApprove && (
                      <Button variant="outline" onClick={() => action.mutate({ a: "rollback", body: { note } })} data-testid="button-batch-rollback">
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Roll back batch
                      </Button>
                    )}
                  </div>
                  {batch.reviewedBy && (
                    <div className="text-xs text-muted-foreground">
                      Reviewed by {batch.reviewedBy} · {dateTimeLabel(batch.reviewedAt)}
                      {batch.approvalNote ? ` · “${batch.approvalNote}”` : ""}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
          <Callout>Snapshots (principal, pipeline, membership) replace the slice for the same key and date; earlier versions are kept. Transaction rows without a source transaction ID are flagged as possible duplicates by fingerprint and never silently collapsed.</Callout>
        </div>
      </div>
    </div>
  );
}

export { DOMAIN_READ };
