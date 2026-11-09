import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, FileSpreadsheet, FileImage, FileArchive, File as FileIcon, Download, Eye, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, blobUrl, download, queryClient, useSession } from "@/lib/queryClient";
import { canEdit, fileToBase64 } from "@/lib/app";
import { FileDrop, Pill } from "@/components/kit";

export const DOC_KINDS = ["Change order", "PM re-forecast", "Pay application", "Contract", "Bond / surety", "Photo", "Correspondence", "Other"];
export type Doc = { id: string; entity: string; projectId: string; period: string | null; name: string; mime: string; size: number; kind: string; note: string | null; uploadedAt: string; uploadedBy: string };

const size = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);
function DocIcon({ d }: { d: Doc }) {
  const n = d.name.toLowerCase();
  const I = /\.(png|jpe?g|gif|webp|heic)$/.test(n) ? FileImage : /\.(xlsx?|xlsm|csv)$/.test(n) ? FileSpreadsheet : /\.(zip|7z|rar)$/.test(n) ? FileArchive : /\.(pdf|docx?|txt|msg|eml)$/.test(n) ? FileText : FileIcon;
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/[.08] text-primary"><I className="h-4 w-4" /></span>;
}
const previewable = (d: Doc) => /^(image\/(png|jpeg|gif|webp)|application\/pdf)$/.test(d.mime || "");

function Thumb({ d }: { d: Doc }) {
  const [u, setU] = useState<string | null>(null);
  useEffect(() => { let url: string | null = null; if (/^image\//.test(d.mime)) blobUrl(`/api/attachments/${d.id}/file?inline=1`).then((x) => { url = x; setU(x); }).catch(() => {}); return () => { if (url) URL.revokeObjectURL(url); }; }, [d.id]);
  return u ? <img src={u} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-border" /> : <DocIcon d={d} />;
}

export function ProjectDocs({ entity, projectId, period }: { entity: string; projectId: string; period?: string | null }) {
  const s = useSession(); const { toast } = useToast(); const edit = canEdit(s.user?.role);
  const key = ["/api/attachments", entity, projectId];
  const q = useQuery<Doc[]>({ queryKey: key, queryFn: () => api<Doc[]>("GET", `/api/attachments?entity=${encodeURIComponent(entity)}&project=${encodeURIComponent(projectId)}`) });
  const [kind, setKind] = useState("Other"); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const upload = async (files: File[]) => {
    setBusy(true); let ok = 0;
    for (const f of files) {
      if (f.size > 20 * 1024 * 1024) { toast({ title: `${f.name} is over 20 MB`, variant: "destructive" }); continue; }
      try { await api("POST", "/api/attachments", { entity, projectId, period, name: f.name, mime: f.type, data: await fileToBase64(f), kind, note: note || undefined }); ok++; }
      catch (e: any) { toast({ title: `Couldn’t attach ${f.name}`, description: e.message, variant: "destructive" }); }
    }
    setBusy(false); setNote("");
    if (ok) { await queryClient.invalidateQueries({ queryKey: key }); toast({ title: `Attached ${ok} file${ok === 1 ? "" : "s"}`, description: "Stored securely on the server and logged in the audit trail." }); }
  };
  const view = async (d: Doc) => { try { const u = await blobUrl(`/api/attachments/${d.id}/file?inline=1`); window.open(u, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(u), 60000); } catch (e: any) { toast({ title: "Couldn’t open", description: e.message, variant: "destructive" }); } };
  const del = async (d: Doc) => { if (!confirm(`Delete ${d.name}? This is logged in the audit trail.`)) return; try { await api("DELETE", `/api/attachments/${d.id}`); await queryClient.invalidateQueries({ queryKey: key }); } catch (e: any) { toast({ title: "Couldn’t delete", description: e.message, variant: "destructive" }); } };
  const docs = q.data || [];
  return (
    <section data-testid="section-docs">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"><Paperclip className="h-3.5 w-3.5" /> Documents & backup</div>
        <span className="text-[11.5px] text-muted-foreground">{docs.length} file{docs.length === 1 ? "" : "s"} · kept across months</span>
      </div>
      {docs.length ? (
        <ul className="mb-2.5 divide-y divide-border/60 rounded-xl border">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2.5" data-testid={`doc-${d.id}`}>
              <Thumb d={d} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium" title={d.name}>{d.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground"><Pill className="px-1.5 py-0 text-[10.5px]">{d.kind}</Pill><span>{size(d.size)}</span><span>{d.uploadedBy} · {new Date(d.uploadedAt).toLocaleDateString()}</span></div>
                {d.note ? <div className="mt-0.5 truncate text-[12px] text-muted-foreground" title={d.note}>{d.note}</div> : null}
              </div>
              <div className="flex shrink-0 gap-0.5">
                {previewable(d) ? <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => view(d)} aria-label="Preview"><Eye className="h-4 w-4" /></Button> : null}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => download(`/api/attachments/${d.id}/file`, d.name)} aria-label="Download"><Download className="h-4 w-4" /></Button>
                {edit ? <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => del(d)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="mb-2.5 text-[12.5px] text-muted-foreground">No documents yet. Attach change orders, PM re-forecasts, pay apps, photos or any backup that explains this month’s numbers.</p>}
      {edit ? (
        <div className="space-y-2 rounded-xl bg-muted/40 p-2.5">
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <Select value={kind} onValueChange={setKind}><SelectTrigger className="h-8 bg-card text-[12.5px]" data-testid="select-doc-kind"><SelectValue /></SelectTrigger><SelectContent>{DOC_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
            <Input className="h-8 bg-card text-[12.5px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note, e.g. CO #14 approved 9/12" data-testid="input-doc-note" />
          </div>
          <FileDrop onFiles={upload} busy={busy} accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.ppt,.pptx,.txt,.msg,.eml,.png,.jpg,.jpeg,.gif,.webp,.heic,.zip" label={busy ? "Uploading…" : "Drop files here or click to attach"} sub="PDF, Office, images, email or ZIP · up to 20 MB each" testid="dropzone-docs" />
        </div>
      ) : null}
    </section>
  );
}
