import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, DataTable, Pill } from "@/components/kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "./command";

type A = { id: number; at: string; user_name: string | null; action: string; target: string | null; detail: string | null };
const tone = (a: string): any => a.startsWith("import") || a.startsWith("intake") ? "info" : a.startsWith("period") ? "ok" : a.startsWith("rule") || a.startsWith("setting") ? "gold" : a.includes("login") ? "muted" : "muted";
const fmt = (d: string | null) => { if (!d) return ""; try { const o = JSON.parse(d); return Object.entries(o).filter(([k]) => k !== "password").map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · "); } catch { return d; } };

export default function AuditPage() {
  const [limit, setLimit] = useState("300");
  const q = useQuery<A[]>({ queryKey: [`/api/audit?limit=${limit}`] });
  if (q.isLoading) return <div><PageHeader title="Audit trail" /><Skeleton /></div>;
  const rows = q.data || [];
  return (
    <div>
      <PageHeader title="Audit trail" subtitle="Every sign-in, upload, commit, edit, rule change, approval and publish — who, what and when. Records cannot be edited or deleted from the app." />
      <Panel pad={false} actions={<Select value={limit} onValueChange={setLimit}><SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger><SelectContent>{["100", "300", "1000", "2000"].map((x) => <SelectItem key={x} value={x}>Last {x}</SelectItem>)}</SelectContent></Select>}>
        <DataTable rows={rows} rowKey={(a) => String(a.id)} pageSize={50} search={(a) => `${a.user_name} ${a.action} ${a.target} ${a.detail}`} initialSort={{ key: "at", dir: "desc" }} cols={[
          { key: "at", label: "When", value: (a) => a.at, render: (a) => <span className="whitespace-nowrap tnum">{new Date(a.at).toLocaleString()}</span> },
          { key: "u", label: "Who", value: (a) => a.user_name, render: (a) => a.user_name || <span className="text-muted-foreground">System / email</span> },
          { key: "a", label: "Action", value: (a) => a.action, render: (a) => <Pill tone={tone(a.action)}>{a.action}</Pill> },
          { key: "t", label: "Target", value: (a) => a.target, render: (a) => <span className="font-mono text-[12px]">{a.target || "—"}</span> },
          { key: "d", label: "Detail", render: (a) => <span className="line-clamp-2 text-[12px] text-muted-foreground" title={fmt(a.detail)}>{fmt(a.detail)}</span> },
        ]} />
      </Panel>
    </div>
  );
}
