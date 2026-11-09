import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader, Card, Empty, Pill, Callout, SimpleTable, DownloadLink } from "@/components/kit";
import { apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { useApp, DOMAIN_WRITE } from "@/lib/app-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dateTimeLabel } from "@/lib/format";
import { Save, Send, Sparkles, CircleAlert } from "lucide-react";

const FEEDS: Record<string, string[]> = {
  dim_program: ["Program filter", "Program scorecard", "Coverage expectations"],
  dim_geography: ["County filter", "Reach by county and city"],
  dim_participant_group: ["Participant category filter", "Mix by participant group (categories, not people)"],
  fact_allocation: ["Funds allocated", "Remaining to deploy"],
  fact_disbursement: ["Funds disbursed", "Remaining to deploy"],
  fact_service_delivery: ["Service hours", "Sessions delivered", "Programs with activity", "Participants (aggregate mode, single program)"],
  fact_events: ["Event attendance", "Third Thursday / Drop In attendance", "Registration → attendance"],
  outcome_observation: ["Outcome cards (jobs, businesses, TA hours…)"],
  crp_report: ["CRP KPIs", "Coverage gaps", "CRP vs. lending comparison"],
  crsp_service: ["CRSP services", "Distinct businesses", "Visits per business"],
  finance_line: ["Income", "Expenses", "Net operating income", "Balance check"],
  fundraising_opportunity: ["Open pipeline", "Commitments", "Next actions"],
  fundraising_receipt: ["Cash received"],
  promissory_note: ["Maturity ladder", "Upcoming note payments"],
  membership_snapshot: ["Membership tiers (period-end stock)"],
  campaign: ["Unique open and click rates"],
  loan: ["Active loans", "Portfolio principal (with snapshot)", "Dispositions"],
  loan_snapshot: ["Portfolio principal", "Delinquency (provisional)"],
  ned_crosswalk: ["NED migration status", "Cutover authority"],
  survey_summary: ["Survey scores by instrument"],
  journey_touchpoint: ["Business journey funnel"],
};

export default function Entry() {
  const { role, demo } = useApp();
  const { toast } = useToast();
  const { data: contracts } = useQuery<any[]>({ queryKey: ["/api/contracts"] });
  const writable = useMemo(() => (contracts ?? []).filter((c) => DOMAIN_WRITE[c.domain]?.includes(role)), [contracts, role]);
  const [ds, setDs] = useState<string>("");
  const def = writable.find((c) => c.key === ds) ?? writable.find((c) => c.key === "fact_service_delivery") ?? writable[0];
  const [vals, setVals] = useState<Record<string, any>>({});
  const [draftId, setDraftId] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const dirty = useRef(false);

  useEffect(() => {
    setVals({});
    setDraftId(null);
    setIssues([]);
    setSavedAt(null);
  }, [def?.key]);

  const refDatasets = useMemo(() => Array.from(new Set((def?.fields ?? []).filter((f: any) => f.ref).map((f: any) => f.ref.dataset))), [def]);
  const refQueries = useQuery<Record<string, any[]>>({
    queryKey: ["entry-refs", refDatasets.join(","), role, demo],
    enabled: !!def,
    queryFn: async () => {
      const out: Record<string, any[]> = {};
      for (const r of refDatasets) {
        try {
          const res = await apiRequest("GET", `/api/records/${r}?status=approved&limit=300`);
          out[r as string] = await res.json();
        } catch {
          out[r as string] = [];
        }
      }
      return out;
    },
  });
  const { data: mine } = useQuery<any[]>({ queryKey: [`/api/records/${def?.key}`, { status: "draft,submitted,returned", _r: role, _d: demo }], enabled: !!def });

  const save = useMutation({
    mutationFn: async (submit: boolean) => {
      const body = { payload: vals, submit };
      const res = draftId ? await apiRequest("PATCH", `/api/record/${draftId}`, body) : await apiRequest("POST", `/api/records/${def.key}`, body);
      return res.json();
    },
    onSuccess: (r, submit) => {
      setIssues(r.issues ?? []);
      setSavedAt(new Date().toISOString());
      dirty.current = false;
      queryClient.invalidateQueries();
      if (submit) {
        toast({ title: "Submitted for review", description: "A reviewer other than you approves it before it reaches reports." });
        setVals({});
        setDraftId(null);
        setIssues([]);
      } else setDraftId(r.id);
    },
    onError: (e: ApiError) => {
      setIssues(e.issues ?? []);
      toast({ title: "Not saved", description: e.message, variant: "destructive" });
    },
  });

  // autosave draft 2s after the last change
  useEffect(() => {
    if (!dirty.current || !def) return;
    const t = setTimeout(() => {
      if (dirty.current && Object.values(vals).some((v) => v !== "" && v != null)) save.mutate(false);
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals]);

  const set = (k: string, v: any) => {
    dirty.current = true;
    setVals((p) => ({ ...p, [k]: v }));
  };
  const issueFor = (k: string) => issues.filter((i) => i.field === k);

  if (!writable.length)
    return (
      <div>
        <PageHeader kicker="Data operations" title="Enter data" />
        <Empty title="Your role cannot enter data">Switch to program, lending, finance or administrator.</Empty>
      </div>
    );

  return (
    <div>
      <PageHeader
        kicker="Data operations"
        title="Enter data"
        description="Guided forms generated from each dataset's contract. Drafts save automatically and stay out of every report until a different reviewer approves them."
        actions={def && <DownloadLink href={`/api/templates/${def.key}`} testId="download-template">Blank template</DownloadLink>}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <Card title="What are you entering?" bodyClass="p-2">
            <div className="max-h-[520px] space-y-0.5 overflow-y-auto">
              {writable.map((c) => (
                <button key={c.key} onClick={() => setDs(c.key)} className={`w-full rounded-md px-3 py-2 text-left text-sm ${def?.key === c.key ? "bg-accent font-semibold" : "hover:bg-muted"}`} data-testid={`entry-dataset-${c.key}`}>
                  <div className="leading-tight">{c.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{c.cadence}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
        {def && (
          <div className="space-y-4 min-w-0">
            <Card
              title={def.label}
              subtitle={<>Grain: {def.grain} · Owner: {def.owner}</>}
              action={<div className="text-right text-[11px] text-muted-foreground">{save.isPending ? "Saving…" : savedAt ? `Draft saved ${dateTimeLabel(savedAt)}` : draftId ? `Draft #${draftId}` : "Not saved yet"}</div>}
            >
              {FEEDS[def.key] && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                  <span className="text-muted-foreground">Feeds:</span>
                  {FEEDS[def.key].map((f) => (
                    <Pill key={f} tone="green">
                      {f}
                    </Pill>
                  ))}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {def.fields.map((f: any) => {
                  const err = issueFor(f.key);
                  const id = `field-${f.key}`;
                  let control;
                  if (f.ref) {
                    const opts = refQueries.data?.[f.ref.dataset] ?? [];
                    control = (
                      <Select value={vals[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
                        <SelectTrigger id={id} data-testid={`input-${f.key}`}>
                          <SelectValue placeholder={opts.length ? "Choose…" : "No approved records yet"} />
                        </SelectTrigger>
                        <SelectContent>
                          {opts.map((o: any) => {
                            const v = o.payload[f.ref.field];
                            const lbl = o.payload.Program_Name || o.payload.City || o.payload.Business_Type || o.payload.Label || o.payload.Funder || o.payload.Display_Name || "";
                            return (
                              <SelectItem key={o.id} value={String(v)}>
                                {v}
                                {lbl && lbl !== "Restricted" ? ` — ${lbl}` : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    );
                  } else if (f.type === "enum") {
                    control = (
                      <Select value={vals[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
                        <SelectTrigger id={id} data-testid={`input-${f.key}`}>
                          <SelectValue placeholder="Choose…" />
                        </SelectTrigger>
                        <SelectContent>
                          {f.options.map((o: string) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  } else if (f.type === "longtext") {
                    control = <Textarea id={id} value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} data-testid={`input-${f.key}`} rows={3} />;
                  } else if (f.type === "bool") {
                    control = (
                      <Select value={vals[f.key] === undefined ? "" : String(vals[f.key])} onValueChange={(v) => set(f.key, v === "true")}>
                        <SelectTrigger id={id} data-testid={`input-${f.key}`}>
                          <SelectValue placeholder="Choose…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    );
                  } else {
                    const type = f.type === "date" ? "date" : f.type === "month" ? "month" : ["money", "int", "decimal", "percent"].includes(f.type) ? "number" : "text";
                    control = <Input id={id} type={type} step={f.type === "int" ? 1 : "any"} value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} data-testid={`input-${f.key}`} className={type === "number" ? "tabular-nums" : ""} />;
                  }
                  return (
                    <div key={f.key} className={f.type === "longtext" ? "md:col-span-2" : ""}>
                      <Label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-[13px]">
                        {f.label}
                        {f.required && <span className="text-red-600">*</span>}
                        {f.restricted && <Pill tone="bronze">Restricted</Pill>}
                      </Label>
                      {control}
                      {f.help && !err.length && <div className="mt-1 text-[11px] text-muted-foreground">{f.help}</div>}
                      {err.map((e, i) => (
                        <div key={i} className={`mt-1 flex items-center gap-1 text-[11.5px] ${e.severity === "error" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                          <CircleAlert className="h-3 w-3" /> {e.message}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => save.mutate(false)} disabled={save.isPending} data-testid="button-save-draft">
                  <Save className="mr-1.5 h-4 w-4" /> Save draft
                </Button>
                <Button onClick={() => save.mutate(true)} disabled={save.isPending} data-testid="button-submit">
                  <Send className="mr-1.5 h-4 w-4" /> Submit for review
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setVals({});
                    setDraftId(null);
                    setIssues([]);
                  }}
                  data-testid="button-new"
                >
                  Start a new record
                </Button>
                {demo && <span className="ml-auto text-xs text-muted-foreground">Saving into the demonstration dataset</span>}
              </div>
            </Card>
            {def.notes && <Callout>{def.notes}</Callout>}
            <Card title="Drafts and submissions in this dataset" subtitle="Open a draft to keep editing">
              <SimpleTable
                dense
                columns={[
                  { key: "id", label: "#" },
                  { key: "status", label: "Status", render: (r) => <Pill tone={r.reviewStatus === "submitted" ? "gold" : r.reviewStatus === "returned" ? "red" : "muted"}>{r.reviewStatus}</Pill> },
                  { key: "key", label: "Key", render: (r) => <span className="font-mono text-xs">{r.businessKey.startsWith("manual-") ? "—" : r.businessKey}</span> },
                  { key: "by", label: "By", render: (r) => r.createdBy },
                  { key: "upd", label: "Updated", render: (r) => dateTimeLabel(r.updatedAt ?? r.createdAt) },
                  { key: "note", label: "Reviewer note", render: (r) => <span className="text-xs text-muted-foreground">{r.reviewNote ?? "—"}</span> },
                  {
                    key: "act",
                    label: "",
                    render: (r) =>
                      ["draft", "returned"].includes(r.reviewStatus) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setVals(r.payload);
                            setDraftId(r.id);
                            setIssues([]);
                          }}
                          data-testid={`button-open-draft-${r.id}`}
                        >
                          Open
                        </Button>
                      ) : null,
                  },
                ]}
                rows={mine ?? []}
                empty={<div className="py-4 text-sm text-muted-foreground">Nothing in progress.</div>}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
