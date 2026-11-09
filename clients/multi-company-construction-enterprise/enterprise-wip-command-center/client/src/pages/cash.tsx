import { useMemo, useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/queryClient";
import { canEdit, saveSetting } from "@/lib/app";
import { useCash } from "@/lib/fc";
import type { CashAssumptions } from "@shared/calc";
import { PageHeader, Panel, Tag, DataTable, Note, Money, $, P, $M, Kpi, Seg, CHART, axisTick, tipStyle } from "@/components/kit";
import { Skeleton } from "./command";

const FIELDS: { k: keyof CashAssumptions; label: string; help: string; pct?: boolean }[] = [
  { k: "billLag", label: "Billing lag (months)", help: "Revenue earned in month m is billed in m + lag" },
  { k: "collectLag", label: "Collection lag (months)", help: "Bills are collected this many months later" },
  { k: "retentionPct", label: "Retention withheld (%)", help: "Held back from each bill; released 2 months after the project’s last revenue month", pct: true },
  { k: "payLag", label: "Payables lag (months)", help: "Cost incurred in month m is paid in m + lag" },
  { k: "underRecoveryMonths", label: "Underbilling recovered over (months)", help: "Current underbillings (R > B) are billed and collected evenly over this period" },
  { k: "overUnwindMonths", label: "Overbilling unwinds over (months)", help: "Current overbillings (B > R) reduce receipts evenly over this period" },
];

export default function CashPage() {
  const { f, c, boot } = useCash(); const s = useSession(); const { toast } = useToast();
  const [H, setH] = useState<"12" | "24" | "36">("12");
  const [edit, setEdit] = useState<Record<string, string> | null>(null);
  const d = useMemo(() => {
    if (!f || !c) return null; const n = Math.min(Number(H), f.H);
    const rows = f.labels.slice(0, n).map((m, i) => ({ m, receipts: c.receipts[i], ret: c.retRelease[i], bill: c.billPos[i], disb: -c.disb[i], net: c.net[i], cum: c.cum[i] }));
    const low = rows.reduce((a, r, i) => (r.cum < a.v ? { v: r.cum, i } : a), { v: Infinity, i: -1 });
    const firstNeg = rows.findIndex((r) => r.net < 0);
    return { n, rows, low, firstNeg, inflow: rows.reduce((a, r) => a + r.receipts + r.ret + r.bill, 0), outflow: rows.reduce((a, r) => a - r.disb, 0) };
  }, [f, c, H]);
  if (!f || !c || !d || !boot) return <div><PageHeader title="Cash flow" /><Skeleton /></div>;
  const a = boot.settings.cash; const hasOpen = a.openingCash !== null && a.openingCash !== undefined;
  const start = () => setEdit(Object.fromEntries([...FIELDS.map((x) => [x.k, String(x.pct ? (a[x.k] as number) * 100 : a[x.k])]), ["openingCash", hasOpen ? String(a.openingCash) : ""]]));
  const save = async () => {
    if (!edit) return; const out: any = {};
    for (const x of FIELDS) { const v = Number(edit[x.k]); if (!Number.isFinite(v) || v < 0) return toast({ title: `Check “${x.label}”`, variant: "destructive" }); out[x.k] = x.pct ? v / 100 : Math.round(v); }
    const oc = edit.openingCash.trim(); out.openingCash = oc === "" ? null : Number(oc.replace(/[$,]/g, "")); if (out.openingCash !== null && !Number.isFinite(out.openingCash)) return toast({ title: "Opening cash must be a number or blank", variant: "destructive" });
    try { await saveSetting("cash", out); setEdit(null); toast({ title: "Cash assumptions saved" }); } catch (e: any) { toast({ title: "Couldn’t save", description: e.message, variant: "destructive" }); }
  };
  return (
    <div>
      <PageHeader title="Cash-flow requirements" subtitle="A timing assumption model, not a bank forecast. It converts the phased revenue and cost forecast into expected receipts and payments using the lags below. Actual bank balances, AR aging and AP aging are not connected."
        tags={<><Tag kind="assumption">Timing assumption model</Tag><Tag kind="proposed">Lags proposed, pending executive approval</Tag></>}
        actions={<Seg value={H} onChange={setH} options={[{ value: "12", label: "12 mo" }, { value: "24", label: "24 mo" }, { value: "36", label: "36 mo" }]} />} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Opening cash" value={hasOpen ? $M(a.openingCash) : "Not entered"} sub={hasOpen ? "entered by finance" : "curve starts at $0"} kind={hasOpen ? "user" : "pending"} />
        <Kpi label={`Expected inflows, ${d.n} mo`} value={$M(d.inflow)} sub="receipts + retention + billing position" kind="forecast" how={{ formula: "Σ revenue(m − billLag − collectLag) × (1 − retention) + retention releases + underbilling recovery − overbilling unwind" }} />
        <Kpi label={`Expected outflows, ${d.n} mo`} value={$M(d.outflow)} sub="phased remaining cost" kind="forecast" how={{ formula: "Σ cost(m − payLag)" }} />
        <Kpi label="Low point" value={$M(d.low.v)} sub={d.low.i >= 0 ? d.rows[d.low.i].m : ""} tone={d.low.v < 0 ? "bad" : undefined} kind="forecast" how={{ formula: "min over months of opening cash + Σ net cash to date" }} />
        <Kpi label="First net-outflow month" value={d.firstNeg >= 0 ? d.rows[d.firstNeg].m : "None"} sub={d.firstNeg >= 0 ? $(d.rows[d.firstNeg].net) : `in ${d.n} months`} tone={d.firstNeg >= 0 ? "warn" : undefined} kind="forecast" />
      </div>
      <Note tone="warn">Months 1–2 show little inflow and full outflow because receipts lag billing and collection while costs are paid after one month. This is a timing effect of the assumptions, not a projected shortfall. Current billing position: underbilled {$M(c.under)}, overbilled {$M(c.over)}.</Note>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title="Monthly cash movement" tags={<Tag kind="assumption" />}>
          <div className="h-[320px]"><ResponsiveContainer><ComposedChart data={d.rows} stackOffset="sign" margin={{ left: 4, right: 8, top: 6 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="m" tick={axisTick} interval={d.n > 12 ? 2 : 0} /><YAxis tick={axisTick} tickFormatter={(v) => $M(v, 0)} width={60} />
            <Tooltip {...tipStyle} formatter={(v: any, n: any) => [$(v), n]} /><ReferenceLine y={0} stroke={CHART.muted} />
            <Bar dataKey="receipts" name="Receipts" stackId="a" fill={CHART.primary} /><Bar dataKey="ret" name="Retention release" stackId="a" fill={CHART.c5} /><Bar dataKey="bill" name="Billing position" stackId="a" fill={CHART.gold} /><Bar dataKey="disb" name="Payments" stackId="a" fill={CHART.terra} />
            <Line dataKey="cum" name={hasOpen ? "Cash balance" : "Cumulative net (from $0)"} stroke={CHART.bad} strokeWidth={2} dot={false} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </ComposedChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Assumptions" tags={<Tag kind="assumption" />} actions={canEdit(s.user?.role) && !edit ? <Button size="sm" variant="outline" onClick={start} data-testid="button-edit-cash">Edit</Button> : null}>
          <div className="space-y-2.5">
            {FIELDS.map((x) => <div key={x.k}><div className="flex items-center justify-between gap-2"><Label className="text-[12.5px]">{x.label}</Label>{edit ? <Input className="h-8 w-24 text-right" value={edit[x.k]} onChange={(e) => setEdit({ ...edit, [x.k]: e.target.value })} /> : <b className="text-[13px] tnum">{x.pct ? P(a[x.k] as number, 1) : a[x.k]}</b>}</div><p className="text-[11.5px] text-muted-foreground">{x.help}</p></div>)}
            <div><div className="flex items-center justify-between gap-2"><Label className="text-[12.5px]">Opening cash</Label>{edit ? <Input className="h-8 w-36 text-right" placeholder="blank" value={edit.openingCash} onChange={(e) => setEdit({ ...edit, openingCash: e.target.value })} data-testid="input-opening-cash" /> : <b className="text-[13px] tnum">{hasOpen ? $(a.openingCash) : "Blank"}</b>}</div><p className="text-[11.5px] text-muted-foreground">Stays blank until finance enters a real balance.</p></div>
            {edit ? <div className="flex gap-2 pt-1"><Button size="sm" onClick={save} data-testid="button-save-cash">Save</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div> : null}
          </div>
        </Panel>
      </div>
      <Panel className="mt-4" pad={false} title="Monthly schedule">
        <DataTable rows={d.rows} rowKey={(r) => r.m} dense pageSize={36} cols={[
          { key: "m", label: "Month", value: (r) => r.m, sortable: false }, { key: "r", label: "Receipts", align: "right", render: (r) => <Money v={r.receipts} />, sortable: false }, { key: "t", label: "Retention", align: "right", render: (r) => <Money v={r.ret} />, sortable: false },
          { key: "b", label: "Billing position", align: "right", render: (r) => <Money v={r.bill} />, sortable: false }, { key: "d", label: "Payments", align: "right", render: (r) => <Money v={r.disb} />, sortable: false },
          { key: "n", label: "Net", align: "right", render: (r) => <b><Money v={r.net} /></b>, sortable: false }, { key: "c", label: hasOpen ? "Balance" : "Cumulative", align: "right", render: (r) => <Money v={r.cum} />, sortable: false },
        ]} />
      </Panel>
    </div>
  );
}
