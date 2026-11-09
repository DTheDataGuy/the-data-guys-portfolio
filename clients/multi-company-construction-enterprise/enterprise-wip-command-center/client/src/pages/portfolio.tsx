import { useMemo, useState } from "react";
import { ChevronRight, Building2, Layers } from "lucide-react";
import { useWip } from "@/lib/app";
import { totals, groupBy } from "@shared/calc";
import { PageHeader, Panel, Tag, Money, P, $M, DataTable, Pill, Note } from "@/components/kit";
import { openProject } from "@/components/project";
import { BU_COLOR, Skeleton } from "./command";

export default function PortfolioPage() {
  const w = useWip(); const [bu, setBu] = useState<string | null>(null); const [ent, setEnt] = useState<string | null>(null);
  const d = useMemo(() => {
    if (!w.view || !w.boot) return null;
    const el = w.view.eligible;
    const bus = [...groupBy(el, (r) => r.bu)].map(([k, rs]) => ({ k, rs, t: totals(rs) })).sort((a, b) => b.t.remC - a.t.remC);
    return { el, bus };
  }, [w.view, w.boot]);
  if (!d || !w.boot) return <div><PageHeader title="Portfolio explorer" /><Skeleton /></div>;
  const curBu = bu ? d.bus.find((b) => b.k === bu) : null;
  const ents = curBu ? [...groupBy(curBu.rs, (r) => r.entity)].map(([k, rs]) => ({ k, rs, t: totals(rs), e: w.boot!.entities.find((x) => x.code === k), all: w.view!.all.filter((r) => r.entity === k).length })).sort((a, b) => b.t.remC - a.t.remC) : [];
  const curEnt = ent ? ents.find((e) => e.k === ent) : null;
  const ET = totals(d.el);
  return (
    <div>
      <PageHeader title="Portfolio explorer" subtitle="Drill from the enterprise to business unit, entity and project. Every level is a weighted rollup of the same governed rows." tags={<Tag kind="calc" />} />
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px]">
        <button className={`rounded-md px-2 py-1 ${!bu ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`} onClick={() => { setBu(null); setEnt(null); }}>Enterprise</button>
        {bu ? <><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /><button className={`rounded-md px-2 py-1 ${!ent ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`} onClick={() => setEnt(null)}>{bu}</button></> : null}
        {ent ? <><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /><span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">{ent}</span></> : null}
      </nav>

      {!bu ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {d.bus.map((b) => (
            <button key={b.k} onClick={() => setBu(b.k)} className="group rounded-xl border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md" data-testid={`card-bu-${b.k}`}>
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-[15px] font-semibold"><span className="h-3 w-3 rounded-sm" style={{ background: BU_COLOR[b.k] }} />{b.k}</span><ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" /></div>
              <div className="mt-4 text-[28px] font-semibold tracking-tight tnum">{$M(b.t.remC)}</div>
              <div className="text-[12px] text-muted-foreground">remaining contract · {P(ET.remC ? b.t.remC / ET.remC : null)} of enterprise</div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-[12px]">
                <div><div className="text-muted-foreground">Projects</div><div className="font-semibold tnum">{b.t.count}</div></div>
                <div><div className="text-muted-foreground">Rem. GP</div><div className="font-semibold tnum">{$M(b.t.remGP)}</div></div>
                <div><div className="text-muted-foreground">Weighted GM</div><div className="font-semibold tnum">{P(b.t.remGM, 2)}</div></div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(b.t.remC / ET.remC) * 100}%`, background: BU_COLOR[b.k] }} /></div>
            </button>
          ))}
        </div>
      ) : !ent ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ents.map((e) => (
            <button key={e.k} onClick={() => setEnt(e.k)} className="group rounded-xl border bg-card p-4 text-left transition hover:shadow-md" data-testid={`card-entity-${e.k}`}>
              <div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2 text-[15px] font-semibold"><Building2 className="h-4 w-4 text-muted-foreground" />{e.k}{e.e?.type === "JV" ? <Pill tone="gold">JV</Pill> : null}</div><div className="mt-0.5 text-[12px] text-muted-foreground">{e.e?.company}</div></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
              <div className="mt-3 flex items-baseline justify-between"><span className="text-[22px] font-semibold tnum">{$M(e.t.remC)}</span><span className="text-[12px] text-muted-foreground">GM {P(e.t.remGM, 2)}</span></div>
              <div className="mt-1 text-[12px] text-muted-foreground">{e.t.count} eligible of {e.all} submitted rows · ITD GP <Money v={e.t.itdGP} /></div>
            </button>
          ))}
          {!ents.length ? <Note>No eligible projects in this business unit for the current filters.</Note> : null}
        </div>
      ) : curEnt ? (
        <Panel title={<span className="flex items-center gap-2"><Layers className="h-4 w-4" />{curEnt.k} — {curEnt.e?.company}</span>} subtitle={`${curEnt.t.count} eligible projects · ${$M(curEnt.t.remC)} remaining · weighted GM ${P(curEnt.t.remGM, 2)}`} pad={false}>
          <DataTable rows={curEnt.rs} rowKey={(r) => r.id} onRow={(r) => openProject(r.id)} search={(r) => `${r.projectId} ${r.projectName} ${r.pm || ""}`} initialSort={{ key: "rc", dir: "desc" }} cols={[
            { key: "p", label: "Project", render: (r) => <span><b className="font-medium">{r.projectId}</b> <span className="text-muted-foreground">{(r.projectName || "").slice(0, 40)}</span></span>, value: (r) => r.projectId },
            { key: "c", label: "Contract", align: "right", render: (r) => <Money v={r.C} />, value: (r) => r.C },
            { key: "rc", label: "Remaining", align: "right", render: (r) => <Money v={r.m.remC} />, value: (r) => r.m.remC },
            { key: "gp", label: "Rem. GP", align: "right", render: (r) => <Money v={r.m.remGP} />, value: (r) => r.m.remGP },
            { key: "gm", label: "GM", align: "right", render: (r) => P(r.m.remGM), value: (r) => r.m.remGM },
            { key: "itd", label: "ITD GP", align: "right", render: (r) => <Money v={r.m.itdGP} />, value: (r) => r.m.itdGP },
            { key: "ob", label: "Over/(under)", align: "right", render: (r) => <Money v={r.m.ob} />, value: (r) => r.m.ob },
            { key: "x", label: "Flags", render: (r) => r.exc.length ? <Pill tone={r.exc.includes("LOSS") || r.exc.includes("UNDER") ? "bad" : "warn"}>{r.exc.length}</Pill> : <Pill tone="ok">OK</Pill>, value: (r) => r.exc.length },
          ]} />
        </Panel>
      ) : null}
    </div>
  );
}
