import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, KeyRound, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, queryClient, useSession } from "@/lib/queryClient";
import { useWip } from "@/lib/app";
import { PageHeader, Panel, DataTable, Pill, Note, Empty } from "@/components/kit";
import { Skeleton } from "./command";

type U = { id: string; name: string; login: string; email: string | null; title: string | null; role: string; roleLabel: string; scope: string; mustChange: boolean; active: boolean; lastLogin: string | null };
const ROLES = [
  { k: "admin", l: "Administrator", d: "Everything, including users, rules reset and intake keys" },
  { k: "executive", l: "Executive", d: "View all, publish months, approve rules and overrides" },
  { k: "finance", l: "Finance preparer", d: "Upload WIPs, edit data, forecasts and pipeline; send for review" },
  { k: "reviewer", l: "Reviewer", d: "View and resolve assigned exceptions" },
  { k: "viewer", l: "Viewer", d: "Read-only dashboards" },
];
const blank = { name: "", login: "", email: "", title: "", role: "viewer", scope: "*" };

export default function TeamPage() {
  const s = useSession(); const w = useWip(); const { toast } = useToast();
  const q = useQuery<U[]>({ queryKey: ["/api/users"] });
  const [form, setForm] = useState<(typeof blank & { id?: string; active?: boolean }) | null>(null);
  const [cred, setCred] = useState<{ name: string; login: string; pw: string } | null>(null);
  const admin = s.user?.role === "admin";
  if (q.isLoading || !w.boot) return <div><PageHeader title="Team & access" /><Skeleton /></div>;
  const users = q.data || []; const ents = w.boot.entities.map((e) => e.code);
  const save = async () => {
    if (!form) return;
    try {
      if (form.id) { await api("PATCH", `/api/users/${form.id}`, form); toast({ title: "Access updated" }); }
      else { const r = await api<{ user: U; tempPassword: string }>("POST", "/api/users", form); setCred({ name: r.user.name, login: r.user.login, pw: r.tempPassword }); }
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setForm(null);
    } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); }
  };
  const reset = async (u: U) => { try { const r = await api<{ tempPassword: string }>("POST", `/api/users/${u.id}/reset`); setCred({ name: u.name, login: u.login, pw: r.tempPassword }); setForm(null); } catch (e: any) { toast({ title: "Couldn’t reset", description: e.message, variant: "destructive" }); } };
  const scopeSet = (sc: string) => sc === "*" ? new Set(ents) : new Set(sc.split(",").map((x) => x.trim()));
  return (
    <div>
      <PageHeader title="Team & access" subtitle="Who can sign in, what they can do, and which entities they see. Temporary passwords must be changed at first sign-in."
        actions={admin ? <Button size="sm" onClick={() => setForm({ ...blank })} data-testid="button-add-user"><UserPlus /> Add person</Button> : null} />
      <Panel pad={false}>
        {users.length ? <DataTable rows={users} rowKey={(u) => u.id} onRow={admin ? (u) => setForm({ id: u.id, name: u.name, login: u.login, email: u.email || "", title: u.title || "", role: u.role, scope: u.scope, active: u.active }) : undefined} cols={[
          { key: "n", label: "Name", render: (u) => <span><b className="font-medium">{u.name}</b><span className="block text-[12px] text-muted-foreground">{u.title || ""}</span></span>, value: (u) => u.name },
          { key: "l", label: "Username", render: (u) => <span className="font-mono text-[12.5px]">{u.login}</span>, value: (u) => u.login },
          { key: "e", label: "Email", value: (u) => u.email },
          { key: "r", label: "Role", render: (u) => <Pill tone={u.role === "admin" || u.role === "executive" ? "info" : "muted"}>{u.roleLabel}</Pill>, value: (u) => u.role },
          { key: "s", label: "Entities", render: (u) => u.scope === "*" ? "All" : u.scope, value: (u) => u.scope },
          { key: "st", label: "Status", render: (u) => !u.active ? <Pill>Disabled</Pill> : u.mustChange ? <Pill tone="gold">Temp password</Pill> : <Pill tone="ok">Active</Pill> },
          { key: "ll", label: "Last sign-in", value: (u) => u.lastLogin, render: (u) => u.lastLogin ? new Date(u.lastLogin).toLocaleString() : <span className="text-muted-foreground">Never</span> },
        ]} /> : <Empty title="No users" />}
      </Panel>
      <div className="mt-4 grid gap-3 md:grid-cols-5">{ROLES.map((r) => <div key={r.k} className="rounded-xl border bg-card p-3"><div className="text-[13px] font-semibold">{r.l}</div><div className="mt-1 text-[12px] text-muted-foreground">{r.d}</div></div>)}</div>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{form?.id ? `Edit ${form.name}` : "Add person"}</DialogTitle><DialogDescription>{form?.id ? "Changes take effect at their next request." : "A temporary password is generated once — share it privately."}</DialogDescription></DialogHeader>
        {form ? <div className="grid grid-cols-2 gap-3">
          <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-user-name" /></div>
          <div><Label>Username</Label><Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} data-testid="input-user-login" /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="col-span-2"><Label>Role</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r.k} value={r.k}>{r.l} — {r.d}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2"><Label>Entities visible</Label><div className="mt-1.5 flex flex-wrap gap-3"><label className="flex items-center gap-1.5 text-[13px]"><Checkbox checked={form.scope === "*"} onCheckedChange={(v) => setForm({ ...form, scope: v ? "*" : "" })} /> All</label>{ents.map((e) => { const set = scopeSet(form.scope); return <label key={e} className="flex items-center gap-1.5 text-[13px]"><Checkbox checked={set.has(e)} disabled={form.scope === "*"} onCheckedChange={(v) => { v ? set.add(e) : set.delete(e); setForm({ ...form, scope: [...set].join(",") }); }} /> {e}</label>; })}</div></div>
          {form.id ? <div className="col-span-2 flex items-center justify-between rounded-lg border p-3"><span className="text-[13px]">Account active</span><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /></div> : null}
        </div> : null}
        <DialogFooter className="gap-2">{form?.id ? <Button variant="outline" className="mr-auto" onClick={() => reset(users.find((u) => u.id === form.id)!)}><KeyRound /> Reset password</Button> : null}<Button onClick={save} disabled={!form?.name || !form?.login || (form.scope !== "*" && !form.scope)} data-testid="button-save-user">Save</Button></DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={!!cred} onOpenChange={(o) => !o && setCred(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Temporary password for {cred?.name}</DialogTitle><DialogDescription>Shown once. They will be asked to set their own password at first sign-in.</DialogDescription></DialogHeader>
        {cred ? <div className="space-y-2 rounded-lg border bg-muted/40 p-3 font-mono text-[13px]"><div>Username: {cred.login}</div><div className="flex items-center justify-between gap-2">Password: {cred.pw}<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard?.writeText(`${cred.login} / ${cred.pw}`); toast({ title: "Copied" }); }}><Copy className="h-3.5 w-3.5" /></Button></div></div> : null}
        <Note>Send the username and password through separate channels.</Note>
      </DialogContent></Dialog>
    </div>
  );
}
