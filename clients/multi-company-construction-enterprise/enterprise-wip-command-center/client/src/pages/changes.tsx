import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowDownRight, ArrowUpRight, GitCompareArrows, Inbox } from "lucide-react";
import { useWip, useRows, matchFilters, type Enriched } from "@/lib/app";
import { metrics, totals, type Row } from "@shared/calc";
import { PageHeader, Panel, Tag, Money, P, $M, $, DataTable, Pill, Seg, Note, Kpi, type Col } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { openProject } from "@/components/project";
import { Skeleton } from "./command";

type Pair = { key: string; entity: string; projectId: string; name: string; cur: Enriched | null; prev: (Row & { m: ReturnType<typeof metrics> }) | null;
  dC: number; dR: number; dE: number; dFcGP: number; dRemC: number; dOb: number; dGM: number | null };
const k = (r: { entity: string; projectId: string }) => `${r.entity}|${r.projectId}`;
const d0 = (a: number | null | undefined, b: number | null | undefined) => (a || 0) - (b || 0);
const MATERIAL = 50000; // Proposed, pending executive approval

export default function ChangesPage() {
  const w = useWip();
  const sorted = useMemo(() => [...(w.periods || [])].sort((a, b) => a.as_of.localeCompare(b.as_of)), [w.periods]);
  const defPrev = w.period ? [...sorted].reverse().find((p) => p.as_of < w.period!.as_of) : undefined;
  const [prevId, setPrevId] = useState<string | null>(null);
  const prevP = sorted.find((p) => p.id === (prevId || defPrev?.id)) || null;
  const prevQ = useRows(prevP?.id);
  const [tab, setTab] = useState<"fade" | "contract" | "new" | "gone" | "review">("fade");
  const [material, setMaterial] = useState(true);

  const d = useMemo(() => {
    if (!w.view || !w.boot || !prevQ.data) return null;
    const ents = w.boot.entities;
    const prevAll = prevQ.data.map((r) => ({ ...r, m: metrics(r) })).filter((r) => matchFilters(r, w.filters, ents));
    const prev = prevAll.filter((r) => r.eligible); const cur = w.view.eligible;
    const count = (xs: { entity: string; projectId: string }[]) => { const m = new Map<string, number>(); xs.forEach((x) => m.set(k(x), (m.get(k(x)) || 0) + 1)); return m; };
    const cc = count(cur), pc = count(prev);
    const dup = new Set([...cc].filter(([, n]) => n > 1).map(([x]) => x).concat([...pc].filter(([, n]) => n > 1).map(([x]) => x)));
    const pm = new Map(prev.filter((r) => !dup.has(k(r))).map((r) => [k(r), r]));
    const cm = new Map(cur.filter((r) => !dup.has(k(r))).map((r) => [k(r), r]));
    const pairs: Pair[] = [];
    for (const key of new Set([...pm.keys(), ...cm.keys()])) {
      const c = cm.get(key) || null, p = pm.get(key) || null; const b = (c || p)!;
      pairs.push({ key, entity: b.entity, projectId: b.projectId, name: b.projectName || "", cur: c, prev: p,
        dC: d0(c?.C, p?.C), dR: d0(c?.R, p?.R), dE: d0(c?.E, p?.E), dFcGP: d0(c?.m.fcGP, p?.m.fcGP), dRemC: d0(c?.m.remC, p?.m.remC), dOb: d0(c?.m.ob, p?.m.ob),
        dGM: c && p && c.m.fcGM != null && p.m.fcGM != null ? c.m.fcGM - p.m.fcGM : null });
    }
    const both = pairs.filter((x) => x.cur && x.prev), added = pairs.filter((x) => x.cur && !x.prev), gone = pairs.filter((x) => !x.cur && x.prev);
    const tc = totals(cur), tp = totals(prev);
    const sum = (xs: Pair[], f: (x: Pair) => number) => xs.reduce((a, x) => a + f(x), 0);
    const review = [...cur, ...prev].filter((r) => dup.has(k(r)));
    const dupRem = cur.filter((r) => dup.has(k(r))).reduce((a, r) => a + (r.m.remC || 0), 0) - prev.filter((r) => dup.has(k(r))).reduce((a, r) => a + (r.m.remC || 0), 0);
    const bridge = [
      { l: `${prevP!.label} backlog`, v: tp.remC, total: true },
      { l: "New or newly reporting", v: sum(added, (x) => x.cur!.m.remC || 0) },
      { l: "Contract changes", v: sum(both, (x) => x.dC) },
      { l: "Revenue earned", v: -sum(both, (x) => x.dR) },
      { l: "Completed or left reporting", v: -sum(gone, (x) => x.prev!.m.remC || 0) },
      ...(dup.size ? [{ l: "Duplicate keys (held for review)", v: dupRem }] : []),
      { l: `${w.period!.label} backlog`, v: tc.remC, total: true },
    ];
    const check = bridge.slice(1, -1).reduce((a, b) => a + b.v, tp.remC) - tc.remC;
    return { tc, tp, both, added, gone, review, dup, bridge, check, fades: both.filter((x) => x.dFcGP < 0), gains: both.filter((x) => x.dFcGP > 0) };
  }, [w.view, w.boot, w.filters, prevQ.data, prevP?.id]);

  const header = <PageHeader title="What changed" subtitle="Month-over-month movement by project, matched on entity + project ID. Backlog is bridged from last month to this month so every dollar of change is explained." tags={<><Tag kind="calc" /><Tag kind="source">Two WIP months</Tag></>}
    actions={sorted.length >= 2 && w.period ? <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">Compare {w.period.label} with
      <Select value={prevP?.id || ""} onValueChange={setPrevId}><SelectTrigger className="h-8 w-40" data-testid="select-compare"><SelectValue placeholder="Earlier month" /></SelectTrigger><SelectContent>{sorted.filter((p) => p.as_of < w.period!.as_of).map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent></Select></div> : null} />;

  if (w.loading) return <div>{header}<Skeleton /></div>;
  if (!prevP) return (
    <div>{header}
      <Panel>
        <div className="mx-auto flex max-w-[560px] flex-col items-center py-10 text-center" data-testid="empty-changes">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><GitCompareArrows className="h-6 w-6" /></span>
          <h3 className="mt-4 text-[17px] font-semibold">Trends start with the second month</h3>
          <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{w.period ? `${w.period.label} is the only month loaded${sorted.length > 1 ? " before or at this point" : ""}.` : ""} Once the next month’s WIPs arrive, this page shows the backlog bridge, profit fades and gains, contract changes, and new or completed projects. Nothing is estimated from a single month.</p>
          <Link href="/intake"><Button className="mt-5" size="sm"><Inbox /> Load next month’s WIPs</Button></Link>
        </div>
      </Panel>
    </div>
  );
  if (!d) return <div>{header}<Skeleton /></div>;

  const dGM = d.tc.remGM != null && d.tp.remGM != null ? d.tc.remGM - d.tp.remGM : null;
  const lists: Record<string, Pair[]> = {
    fade: [...d.both].filter((x) => x.dFcGP !== 0 && (!material || Math.abs(x.dFcGP) >= MATERIAL)).sort((a, b) => a.dFcGP - b.dFcGP),
    contract: d.both.filter((x) => x.dC !== 0 && (!material || Math.abs(x.dC) >= MATERIAL)).sort((a, b) => Math.abs(b.dC) - Math.abs(a.dC)),
    new: [...d.added].sort((a, b) => (b.cur!.m.remC || 0) - (a.cur!.m.remC || 0)),
    gone: [...d.gone].sort((a, b) => (b.prev!.m.remC || 0) - (a.prev!.m.remC || 0)),
  };
  const maxAbs = Math.max(...d.bridge.map((b) => Math.abs(b.v)), 1);
  const delta = (v0: number | null, money = true, good: "up" | "down" = "up") => { const v = v0 == null ? null : Math.abs(v0) < (money ? 0.5 : 0.00005) ? 0 : v0; return v == null ? <span className="text-muted-foreground">—</span> : (
    <span className={`inline-flex items-center gap-0.5 tnum ${v === 0 ? "text-muted-foreground" : (v > 0) === (good === "up") ? "text-[hsl(var(--ok))]" : "text-[hsl(var(--destructive))]"}`}>
      {v > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : v < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}{money ? $(v) : `${(v * 100).toFixed(2)} pts`}
    </span>); };
  const proj: Col<Pair> = { key: "p", label: "Project", render: (x) => <span><b className="font-medium">{x.projectId}</b> <span className="text-muted-foreground">{x.name.slice(0, 30)}</span></span>, value: (x) => x.projectId };
  const colsFor: Record<string, Col<Pair>[]> = {
    fade: [{ key: "e", label: "Entity", value: (x) => x.entity }, proj,
      { key: "g0", label: `Fcst GP ${prevP.label.split(" ")[0]}`, align: "right", render: (x) => <Money v={x.prev!.m.fcGP} />, value: (x) => x.prev!.m.fcGP },
      { key: "g1", label: `Fcst GP ${w.period!.label.split(" ")[0]}`, align: "right", render: (x) => <Money v={x.cur!.m.fcGP} />, value: (x) => x.cur!.m.fcGP },
      { key: "dg", label: "Change", align: "right", render: (x) => delta(x.dFcGP), value: (x) => x.dFcGP },
      { key: "dm", label: "GM change", align: "right", render: (x) => delta(x.dGM, false), value: (x) => x.dGM },
      { key: "de", label: "EAC change", align: "right", render: (x) => delta(x.dE, true, "down"), value: (x) => x.dE },
      { key: "dc", label: "Contract change", align: "right", render: (x) => delta(x.dC), value: (x) => x.dC }],
    contract: [{ key: "e", label: "Entity", value: (x) => x.entity }, proj,
      { key: "c0", label: "Prior contract", align: "right", render: (x) => <Money v={x.prev!.C} />, value: (x) => x.prev!.C },
      { key: "c1", label: "Current contract", align: "right", render: (x) => <Money v={x.cur!.C} />, value: (x) => x.cur!.C },
      { key: "dc", label: "Change", align: "right", render: (x) => delta(x.dC), value: (x) => x.dC },
      { key: "dr", label: "Revenue earned", align: "right", render: (x) => <Money v={x.dR} />, value: (x) => x.dR },
      { key: "drc", label: "Backlog change", align: "right", render: (x) => delta(x.dRemC), value: (x) => x.dRemC }],
    new: [{ key: "e", label: "Entity", value: (x) => x.entity }, proj,
      { key: "c", label: "Contract", align: "right", render: (x) => <Money v={x.cur!.C} />, value: (x) => x.cur!.C },
      { key: "rc", label: "Remaining", align: "right", render: (x) => <Money v={x.cur!.m.remC} />, value: (x) => x.cur!.m.remC },
      { key: "gm", label: "Fcst GM", align: "right", render: (x) => P(x.cur!.m.fcGM), value: (x) => x.cur!.m.fcGM },
      { key: "pm", label: "PM", value: (x) => x.cur!.pm || "—" }],
    gone: [{ key: "e", label: "Entity", value: (x) => x.entity }, proj,
      { key: "rc", label: `Remaining in ${prevP.label.split(" ")[0]}`, align: "right", render: (x) => <Money v={x.prev!.m.remC} />, value: (x) => x.prev!.m.remC },
      { key: "st", label: "Last status", value: (x) => x.prev!.status || "—" },
      { key: "why", label: "Now", render: (x) => { const now = w.view!.all.find((r) => r.entity === x.entity && r.projectId === x.projectId); return now ? <Pill tone="gold">Excluded: {now.reasons[0] || "rule"}</Pill> : <Pill>Not in this month’s WIP</Pill>; } }],
  };

  return (
    <div className="page-in">
      {header}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Backlog change" value={<span className={d.tc.remC - d.tp.remC < 0 ? "text-[hsl(var(--destructive))]" : ""}>{$M(d.tc.remC - d.tp.remC)}</span>} sub={`${$M(d.tp.remC)} → ${$M(d.tc.remC)}`} kind="calc" how={{ formula: "Σ (C − R) this month − Σ (C − R) prior month", inputs: [["This month", $(d.tc.remC, 2)], ["Prior month", $(d.tp.remC, 2)]] }} />
        <Kpi label="Forecast GP change" value={$M(d.tc.fcGP - d.tp.fcGP)} sub={`${d.fades.length} fades · ${d.gains.length} gains`} kind="calc" how={{ formula: "Σ (C − E) this month − Σ (C − E) prior month" }} />
        <Kpi label="Weighted GM change" value={dGM == null ? "—" : `${dGM >= 0 ? "+" : ""}${(dGM * 100).toFixed(2)} pts`} sub={`${P(d.tp.remGM, 2)} → ${P(d.tc.remGM, 2)}`} kind="calc" how={{ formula: "weighted remaining GM this month − prior month" }} />
        <Kpi label="Projects" value={`${d.tp.count} → ${d.tc.count}`} sub={`${d.added.length} new · ${d.gone.length} completed or excluded`} kind="calc" how={{ formula: "count of reporting-eligible rows each month" }} />
      </div>

      <div className="grid gap-4">
        <Panel title="Backlog bridge" subtitle={`How ${prevP.label} backlog became ${w.period!.label} backlog`} tags={<Tag kind="calc" />}>
          <div className="space-y-2" data-testid="bridge">
            {d.bridge.map((b) => (
              <div key={b.l} className="grid grid-cols-[150px_1fr_90px] sm:grid-cols-[230px_1fr_120px] items-center gap-3 text-[13px]">
                <span className={b.total ? "font-semibold" : "text-muted-foreground"}>{b.l}</span>
                <div className="relative h-5 rounded bg-muted/50">
                  <div className="absolute inset-y-0 rounded" style={{ width: `${Math.max(1.5, (Math.abs(b.v) / maxAbs) * 100)}%`, background: b.total ? "hsl(var(--primary))" : b.v >= 0 ? "hsl(var(--ok))" : "hsl(var(--destructive))", opacity: b.total ? 1 : 0.8 }} />
                </div>
                <span className={`text-right tnum ${b.total ? "font-semibold" : ""}`}>{b.total ? $M(b.v) : `${b.v >= 0 ? "+" : "−"}${$M(Math.abs(b.v))}`}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">Check: the bridge reconciles to {$(d.check, 2)} {Math.abs(d.check) < 1 ? "(ties exactly)" : "— review"}. Revenue earned is the change in ITD revenue on projects present both months.</p>
          {d.dup.size ? <Note tone="warn">{d.dup.size} entity + project keys appear more than once in a month, so they are held out of matching and listed under Needs review. Project ID alone is never used to match.</Note> : null}
        </Panel>

        <Panel pad={false} title={{ fade: "Profit fades and gains", contract: "Contract changes", new: "New this month", gone: "Completed or left reporting", review: "Needs review" }[tab]}
          subtitle={tab === "fade" ? "Change in forecast GP at completion (C − E), biggest fades first" : tab === "contract" ? "Change orders and contract revisions" : undefined}
          actions={<div className="flex flex-wrap items-center gap-2">
            {(tab === "fade" || tab === "contract") ? <button onClick={() => setMaterial(!material)} className="rounded-full border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-muted" data-testid="toggle-material">{material ? `Material only · ≥ ${$M(MATERIAL, 2)}` : "Showing all changes"}</button> : null}
            <Seg value={tab} onChange={setTab} options={[{ value: "fade", label: `Fades & gains` }, { value: "contract", label: "Contract" }, { value: "new", label: `New ${d.added.length}` }, { value: "gone", label: `Completed ${d.gone.length}` }, ...(d.dup.size ? [{ value: "review" as const, label: `Review ${d.dup.size}` }] : [])]} />
          </div>}>
          {tab === "review"
            ? <DataTable rows={d.review} rowKey={(r) => `${r.period}-${r.id}`} cols={[{ key: "m", label: "Month", value: (r) => r.period }, { key: "e", label: "Entity", value: (r) => r.entity }, { key: "p", label: "Project", value: (r) => r.projectId }, { key: "n", label: "Name", value: (r) => r.projectName }, { key: "rc", label: "Remaining", align: "right", render: (r) => <Money v={r.m.remC} />, value: (r) => r.m.remC }]} />
            : <DataTable rows={lists[tab]} rowKey={(x) => x.key} cols={colsFor[tab]} pageSize={15} onRow={(x) => x.cur && openProject(x.cur.id)} search={(x) => `${x.entity} ${x.projectId} ${x.name}`} empty={tab === "fade" && material ? "No project moved forecast GP by the material amount." : "Nothing in this category."} testid="table-changes" />}
          {(tab === "fade" || tab === "contract") && material ? <div className="border-t px-4 py-2 text-[11.5px] text-muted-foreground">Material threshold of {$(MATERIAL)} is Proposed, pending executive approval.</div> : null}
        </Panel>
      </div>
    </div>
  );
}
