import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader, Card, Empty, Pill, ErrorState } from "@/components/kit";
import { apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { useApp } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { dateTimeLabel } from "@/lib/format";
import { Check, Undo2, Trash2, ChevronDown, ChevronRight, History } from "lucide-react";

const TONE: Record<string, any> = { submitted: "gold", returned: "red", draft: "muted", quarantined: "amber" };

export default function Review() {
  const { role, demo, user } = useApp();
  const { toast } = useToast();
  const [status, setStatus] = useState("submitted");
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const { data, error, isLoading } = useQuery<any[]>({ queryKey: ["/api/queue", { status, _r: role, _d: demo }] });
  const { data: detail } = useQuery<any>({ queryKey: [`/api/record/${open}`, { _r: role, _d: demo }], enabled: !!open });
  const act = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => (await apiRequest("POST", `/api/record/${id}/${action}`, { note: note || undefined })).json(),
    onSuccess: (_r, v) => {
      toast({ title: v.action === "approve" ? "Approved — now included in reports" : v.action === "return" ? "Returned to submitter" : v.action === "discard" ? "Discarded" : "Submitted" });
      setNote("");
      setOpen(null);
      queryClient.invalidateQueries();
    },
    onError: (e: ApiError) => toast({ title: "Action blocked", description: e.message, variant: "destructive" }),
  });
  if (error) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader kicker="Data operations" title="Review queue" description={`Reviewers approve or return submissions. You are acting as “${user}”. The submitter cannot approve their own work (administrators excepted, and that is audited).`} />
      <Tabs value={status} onValueChange={(v) => { setStatus(v); setOpen(null); }}>
        <TabsList>
          <TabsTrigger value="submitted" data-testid="tab-submitted">Awaiting review</TabsTrigger>
          <TabsTrigger value="returned" data-testid="tab-returned">Returned</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Drafts</TabsTrigger>
          <TabsTrigger value="quarantined" data-testid="tab-quarantined">Quarantined rows</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-4 space-y-2">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && !data?.length && <Empty title="Nothing here">Approved data flows straight to reports; this list only holds work in progress.</Empty>}
        {data?.map((r) => {
          const isOpen = open === r.id;
          return (
            <div key={r.id} className="rounded-xl border bg-card" data-testid={`queue-item-${r.id}`}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : r.id)}>
                {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.datasetLabel}</span>
                    <Pill tone={TONE[r.status]}>{r.status}</Pill>
                    {r.version > 1 && <Pill tone="bronze">Correction v{r.version}</Pill>}
                    {r.batchId && <Pill>Batch #{r.batchId}</Pill>}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    #{r.id} · {r.submittedBy ?? r.createdBy} · {dateTimeLabel(r.updatedAt)}
                    {r.revisionReason && ` · Reason: ${r.revisionReason}`}
                    {r.reviewNote && ` · ${r.reviewNote}`}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="border-t px-4 py-4">
                  <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(r.payload).map(([k, v]: any) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-dashed py-1">
                        <span className="text-xs text-muted-foreground">{k}</span>
                        <span className="truncate text-right tabular-nums">{v === null || v === "" ? <span className="text-muted-foreground">—</span> : String(v)}</span>
                      </div>
                    ))}
                  </div>
                  {detail?.history?.length > 1 && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs">
                      <div className="mb-1 flex items-center gap-1.5 font-semibold">
                        <History className="h-3.5 w-3.5" /> Version history
                      </div>
                      {detail.history.map((h: any) => (
                        <div key={h.id} className="py-0.5">
                          v{h.version} · #{h.id} · {h.reviewStatus} · {h.approvedBy ? `approved by ${h.approvedBy}` : `by ${h.createdBy}`} · {dateTimeLabel(h.approvedAt ?? h.createdAt)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <Textarea placeholder="Reviewer note (required to return)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} data-testid="input-review-note" />
                    <div className="flex flex-wrap gap-2">
                      {r.status === "submitted" && (
                        <>
                          <Button onClick={() => act.mutate({ id: r.id, action: "approve" })} disabled={act.isPending} data-testid="button-approve">
                            <Check className="mr-1.5 h-4 w-4" /> Approve
                          </Button>
                          <Button variant="outline" onClick={() => act.mutate({ id: r.id, action: "return" })} disabled={act.isPending} data-testid="button-return">
                            <Undo2 className="mr-1.5 h-4 w-4" /> Return
                          </Button>
                        </>
                      )}
                      {["draft", "returned", "quarantined"].includes(r.status) && (
                        <>
                          <Button onClick={() => act.mutate({ id: r.id, action: "submit" })} disabled={act.isPending} data-testid="button-resubmit">
                            Submit
                          </Button>
                          <Button variant="outline" onClick={() => act.mutate({ id: r.id, action: "discard" })} disabled={act.isPending} data-testid="button-discard">
                            <Trash2 className="mr-1.5 h-4 w-4" /> Discard
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Card title="How review works" className="mt-6">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Staff save drafts (auto-saved) and submit. Drafts and submissions never appear in dashboards or exports.</li>
          <li>A different reviewer approves or returns with a note. Approval publishes the record.</li>
          <li>Corrections to approved data need a reason and create a new version; the prior version stays published until the correction is approved, then is kept as superseded history.</li>
          <li>Closed periods are locked. Reopening requires a reason and is audited.</li>
        </ol>
      </Card>
    </div>
  );
}
