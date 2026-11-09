import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Card, Pill, DownloadLink, SimpleTable } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { useApp, DOMAIN_READ } from "@/lib/app-state";
import { Search, KeyRound, Database, Clock3, UserRound } from "lucide-react";

const DOMAIN_LABEL: Record<string, string> = { impact: "Programs & impact", lending: "Lending", crp: "CRP", crsp: "CRSP", engagement: "Engagement", fundraising: "Fundraising", finance: "Finance", surveys: "Surveys", governance: "Governance" };

export default function Dictionary() {
  const { role } = useApp();
  const { data: contracts } = useQuery<any[]>({ queryKey: ["/api/contracts"] });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>("loan");
  const list = useMemo(
    () => (contracts ?? []).filter((c) => !q || `${c.label} ${c.key} ${c.source} ${c.legacyTable ?? ""} ${c.fields.map((f: any) => `${f.key} ${f.label} ${(f.aliases ?? []).join(" ")}`).join(" ")}`.toLowerCase().includes(q.toLowerCase())),
    [contracts, q],
  );
  const def = contracts?.find((c) => c.key === sel) ?? list[0];
  const canExport = def && DOMAIN_READ[def.domain]?.includes(role);
  return (
    <div>
      <PageHeader kicker="Reference" title="Data dictionary" description="Every dataset's contract: grain, business key, source system, owner, refresh cadence, the legacy Power BI table it replaces, and every field with its accepted legacy header names." />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card bodyClass="p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search datasets, fields, aliases" value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-dictionary-search" />
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {Object.entries(
              list.reduce((acc: Record<string, any[]>, c) => {
                (acc[c.domain] ??= []).push(c);
                return acc;
              }, {}),
            ).map(([dom, items]) => (
              <div key={dom} className="mb-2">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{DOMAIN_LABEL[dom] ?? dom}</div>
                {(items as any[]).map((c) => (
                  <button key={c.key} onClick={() => setSel(c.key)} className={`block w-full rounded-md px-3 py-1.5 text-left text-sm ${def?.key === c.key ? "bg-accent font-semibold" : "hover:bg-muted"}`} data-testid={`dict-${c.key}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>
        {def && (
          <div className="min-w-0 space-y-4">
            <Card
              title={def.label}
              subtitle={<span className="font-mono text-xs">{def.key}</span>}
              action={
                <div className="flex gap-2">
                  <DownloadLink href={`/api/templates/${def.key}`} testId="dict-template">Template</DownloadLink>
                  {canExport && <DownloadLink href={`/api/export/dataset/${def.key}`} testId="dict-export">Approved rows</DownloadLink>}
                </div>
              }
            >
              <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                {[
                  [Database, "Grain", def.grain],
                  [KeyRound, "Business key", def.uniqueKey.join(" + ") + (def.snapshotKey ? ` · snapshot slice ${def.snapshotKey.join(" + ")}` : "")],
                  [Database, "Source", def.source],
                  [UserRound, "Owner", def.owner],
                  [Clock3, "Cadence", def.cadence],
                  [Database, "Replaces", def.legacyTable ?? "New dataset"],
                ].map(([I, k, v]: any) => (
                  <div key={k} className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <I className="h-3.5 w-3.5" /> {k}
                    </div>
                    <div className="mt-1 text-[13px] leading-snug">{v}</div>
                  </div>
                ))}
              </div>
              {def.notes && <p className="mt-3 text-sm text-muted-foreground">{def.notes}</p>}
              <div className="mt-2 flex gap-1.5">
                <Pill tone="bronze">{def.kind}</Pill>
                <Pill>{DOMAIN_LABEL[def.domain]}</Pill>
              </div>
            </Card>
            <Card title="Fields" subtitle={`${def.fields.length} fields · * required`}>
              <SimpleTable
                dense
                testId="table-fields"
                columns={[
                  { key: "label", label: "Field", render: (f) => (<div><div className="font-medium">{f.label}{f.required && <span className="text-red-600"> *</span>}</div><div className="font-mono text-[11px] text-muted-foreground">{f.key}</div></div>) },
                  { key: "type", label: "Type", render: (f) => <span className="text-xs">{f.type}{f.ref ? ` → ${f.ref.dataset}.${f.ref.field}` : ""}</span> },
                  { key: "options", label: "Allowed values", render: (f) => <span className="text-xs text-muted-foreground">{f.options ? f.options.slice(0, 8).join(", ") + (f.options.length > 8 ? "…" : "") : "—"}</span> },
                  { key: "aliases", label: "Legacy headers accepted", render: (f) => <span className="text-xs text-muted-foreground">{f.aliases?.length ? f.aliases.join(", ") : "—"}</span> },
                  { key: "flags", label: "", render: (f) => (f.restricted ? <Pill tone="bronze">Restricted</Pill> : null) },
                  { key: "help", label: "Notes", render: (f) => <span className="text-xs text-muted-foreground">{f.help ?? ""}</span> },
                ]}
                rows={def.fields}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
