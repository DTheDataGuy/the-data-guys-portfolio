/** Reusable calculation functions. Every dashboard number is computed here from stored responses; nothing is hard-coded. */
import { BD_GROUPS, LIKERT_ITEMS, PRIORITY_OPTS, Q, type BdCode } from "./survey";
import type { DEFAULT_SETTINGS } from "./defaults";

export type Settings = typeof DEFAULT_SETTINGS;
export type Resp = {
  rid: string; date: string; channel: string | null; source: string; entryMode: string; status: "included" | "excluded"; flags: string[]; duration: number | null;
  age: string | null; gender: string | null; zip: string | null; area: string; sector: string; cd: boolean; tenure: string | null;
  identity: string[]; bd: BdCode[]; bdReview: boolean;
  likert: Record<string, number | null>; multi: Record<string, string[]>; single: Record<string, any>;
  priorities: { issue: string; rank: number }[]; barriers: { barrier: string; rank: number }[];
  assets: { name: string; norm: string; type: string | null; age: string | null; orgId: string | null }[];
};
export type Filter = { bd?: string; age?: string; gender?: string; sector?: string; zip?: string; tenure?: string; channel?: string; from?: string; to?: string; identity?: string };
export const FILTER_KEYS: (keyof Filter)[] = ["bd", "identity", "age", "gender", "sector", "zip", "tenure", "channel", "from", "to"];

export const AGE_BANDS: Record<string, string> = { youth: "Under 25", adult: "25–64", elder: "65+" };
export function ageBand(a: string | null) { if (!a || a === "pns") return null; if (a === "u18" || a === "18_24") return "youth"; if (a === "65_74" || a === "75p") return "elder"; return "adult"; }

export function applyFilter(rs: Resp[], f: Filter) {
  return rs.filter((r) => r.status === "included"
    && (!f.bd || f.bd === "all" || (f.bd === "REVIEW" ? r.bdReview : r.bd.includes(f.bd as BdCode)))
    && (!f.identity || f.identity === "all" || r.identity.includes(f.identity))
    && (!f.age || f.age === "all" || (AGE_BANDS[f.age] ? ageBand(r.age) === f.age : r.age === f.age))
    && (!f.gender || f.gender === "all" || r.gender === f.gender)
    && (!f.sector || f.sector === "all" || r.sector === f.sector)
    && (!f.zip || f.zip === "all" || r.zip === f.zip)
    && (!f.tenure || f.tenure === "all" || r.tenure === f.tenure)
    && (!f.channel || f.channel === "all" || r.channel === f.channel)
    && (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to));
}
export const isFiltered = (f: Filter) => FILTER_KEYS.some((k) => f[k] && f[k] !== "all");

const pct = (n: number, d: number) => (d ? (n / d) * 100 : null);
const r1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

/** Small-cell suppression: counts between 1 and k-1 are hidden (0 is shown — it reveals no one). */
export const hide = (n: number, k: number) => n > 0 && n < k;

/* ---------------- representation ---------------- */
export type Benchmark = { bd_code: string; pct: number; oversample: number; moe: number | null; status: string; dataset: string; vintage: string };
export function targets(bench: Benchmark[]) {
  const w = bench.map((b) => ({ code: b.bd_code, P: b.pct, O: b.oversample, W: b.pct * b.oversample }));
  const sum = w.reduce((a, x) => a + x.W, 0);
  return w.map((x) => ({ ...x, T: sum ? (x.W / sum) * 100 : 0 }));
}
export function statusOf(att: number | null, s: Settings) {
  if (att == null) return "No target";
  if (att < s.status_under) return "Underrepresented";
  if (att < s.status_on_low) return "Approaching target";
  if (att <= s.status_on_high) return "On target";
  return "Above target";
}
export function representation(rs: Resp[], bench: Benchmark[], s: Settings) {
  const inc = rs.filter((r) => r.status === "included");
  const n = inc.length;
  const classified = inc.filter((r) => r.bd.length).length;
  const t = targets(bench);
  const groups = BD_GROUPS.map((g) => {
    const tg = t.find((x) => x.code === g.code)!;
    const count = inc.filter((r) => r.bd.includes(g.code)).length;
    const share = pct(count, classified);
    const targetCount = Math.round((s.target_n * tg.T) / 100);
    const attainment = pct(count, targetCount);
    const b = bench.find((x) => x.bd_code === g.code)!;
    return {
      code: g.code, name: g.name, short: g.short, population: tg.P, moe: b?.moe ?? null, benchStatus: b?.status, oversample: tg.O, target: r1(tg.T), count, share: r1(share),
      targetCount, needed: Math.max(0, targetCount - count), gap: share == null ? null : r1(share - tg.T), attainment: r1(attainment), status: statusOf(attainment, s),
    };
  });
  const multi = inc.filter((r) => r.bd.length > 1).length;
  return { n, classified, unclassified: n - classified, review: inc.filter((r) => r.bdReview).length, multi, groups, targetN: s.target_n, overallAttainment: r1(pct(n, s.target_n)) };
}

export function floorsStatus(rs: Resp[], floors: any[]) {
  const inc = rs.filter((r) => r.status === "included"); const n = inc.length;
  const test: Record<string, (r: Resp) => boolean> = {
    legacy: (r) => (r.multi.Q08 || []).includes("native") || r.tenure === "born",
    youth: (r) => ageBand(r.age) === "youth",
    elders: (r) => ageBand(r.age) === "elder",
    faith: (r) => (r.multi.Q21 || []).includes("faith"),
    immigrant: (r) => r.identity.includes("african_immigrant"),
    unaffiliated: (r) => (r.multi.Q21 || []).includes("none"),
  };
  return floors.map((f) => {
    const fn = test[f.key];
    if (!fn) return { ...f, measured: false, count: null, share: null, met: null };
    const count = inc.filter(fn).length; const share = r1(pct(count, n));
    return { ...f, measured: true, count, share, met: share == null ? null : share >= f.floor_min };
  });
}

export function distribution(rs: Resp[], key: (r: Resp) => string | string[] | null, labels?: Record<string, string>, order?: string[]) {
  const m = new Map<string, number>();
  let answered = 0;
  for (const r of rs) {
    const v = key(r); const arr = v == null ? [] : Array.isArray(v) ? v : [v];
    if (arr.length) answered++;
    for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  }
  const keys = order ? [...order.filter((k) => m.has(k) || true), ...[...m.keys()].filter((k) => !order.includes(k))] : [...m.keys()].sort((a, b) => (m.get(b) || 0) - (m.get(a) || 0));
  return { n: rs.length, answered, items: keys.map((k) => ({ key: k, label: labels?.[k] ?? k, count: m.get(k) || 0, pct: r1(pct(m.get(k) || 0, answered)) })) };
}
export const optLabels = (qid: string) => Object.fromEntries((Q[qid]?.options || []).map((o) => [o.code, o.label]));
export const optOrder = (qid: string) => (Q[qid]?.options || []).map((o) => o.code);

/* ---------------- Likert ---------------- */
export function likert(rs: Resp[]) {
  return LIKERT_ITEMS.map((it) => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>; let na = 0, skipped = 0;
    for (const r of rs) { const v = r.likert[it.id]; if (v === undefined) skipped++; else if (v === null) na++; else c[v]++; }
    const n = c[1] + c[2] + c[3] + c[4];
    const agree = c[3] + c[4];
    const mean = n ? (c[1] * 1 + c[2] * 2 + c[3] * 3 + c[4] * 4) / n : null;
    return { ...it, n, na, skipped, counts: c, agreePct: r1(pct(agree, n)), strongAgreePct: r1(pct(c[4], n)), disagreePct: r1(pct(c[1] + c[2], n)), mean: mean == null ? null : Math.round(mean * 100) / 100,
      dist: [1, 2, 3, 4].map((v) => ({ v, count: c[v], pct: r1(pct(c[v], n)) })) };
  });
}
/** Share agreeing with each item, by a grouping dimension. Groups with fewer than k answers are suppressed. */
export function likertBy(rs: Resp[], groups: { key: string; label: string; test: (r: Resp) => boolean }[], k: number) {
  return groups.map((g) => {
    const sub = rs.filter(g.test);
    const suppressed = hide(sub.length, k);
    return { key: g.key, label: g.label, n: sub.length, suppressed, items: suppressed || !sub.length ? [] : likert(sub).map((l) => ({ id: l.id, agreePct: l.n >= k ? l.agreePct : null, n: l.n })) };
  });
}

/* ---------------- priorities ---------------- */
export function priorities(rs: Resp[]) {
  const answered = rs.filter((r) => r.priorities.length).length;
  return PRIORITY_OPTS.map((o) => {
    const ranks = rs.flatMap((r) => r.priorities.filter((p) => p.issue === o.code).map((p) => p.rank));
    const score = ranks.reduce((a, rk) => a + (6 - rk), 0);
    return { code: o.code, label: o.label, selected: ranks.length, selectedPct: r1(pct(ranks.length, answered)), score, avgRank: ranks.length ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 100) / 100 : null,
      top1Pct: r1(pct(ranks.filter((x) => x === 1).length, answered)), top3Pct: r1(pct(ranks.filter((x) => x <= 3).length, answered)), top1: ranks.filter((x) => x === 1).length };
  }).sort((a, b) => b.score - a.score || b.selected - a.selected);
}
export function prioritiesBy(rs: Resp[], groups: { key: string; label: string; test: (r: Resp) => boolean }[], k: number, top = 5) {
  return groups.map((g) => {
    const sub = rs.filter((r) => g.test(r) && r.priorities.length);
    const suppressed = hide(sub.length, k);
    return { key: g.key, label: g.label, n: sub.length, suppressed, top: suppressed || !sub.length ? [] : priorities(sub).filter((p) => p.selected).slice(0, top).map((p) => ({ code: p.code, label: p.label, selectedPct: p.selectedPct, score: p.score })) };
  });
}
export function barrierRanks(rs: Resp[]) {
  const answered = rs.filter((r) => r.barriers.length).length;
  return (Q.Q31.options || []).map((o) => {
    const ranks = rs.flatMap((r) => r.barriers.filter((b) => b.barrier === o.code).map((b) => b.rank));
    return { code: o.code, label: o.label, ranked: ranks.length, score: ranks.reduce((a, rk) => a + (6 - rk), 0), top1Pct: r1(pct(ranks.filter((x) => x === 1).length, answered)), avgRank: ranks.length ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 100) / 100 : null };
  }).sort((a, b) => b.score - a.score);
}
export function scale(rs: Resp[], qid: string) {
  const vals = rs.map((r) => r.single[qid]).filter((v) => v != null);
  const nums = vals.filter((v) => /^\d$/.test(v)).map(Number);
  const c = [1, 2, 3, 4, 5].map((v) => ({ v, count: nums.filter((x) => x === v).length, pct: r1(pct(nums.filter((x) => x === v).length, nums.length)) }));
  return { n: nums.length, notSure: vals.length - nums.length, mean: nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null, topTwoPct: r1(pct(nums.filter((x) => x >= 4).length, nums.length)), bottomTwoPct: r1(pct(nums.filter((x) => x <= 2).length, nums.length)), dist: c };
}

/* ---------------- trend ---------------- */
export function trend(rs: Resp[]) {
  const m = new Map<string, number>();
  for (const r of rs) m.set(r.date, (m.get(r.date) || 0) + 1);
  const days = [...m.keys()].sort();
  let cum = 0;
  return days.map((d) => { cum += m.get(d)!; return { date: d, count: m.get(d)!, cumulative: cum }; });
}

/* ---------------- grouping helpers ---------------- */
export const bdGroups = () => BD_GROUPS.map((g) => ({ key: g.code, label: g.short, test: (r: Resp) => r.bd.includes(g.code) }));
export const ageGroups = () => Object.entries(AGE_BANDS).map(([k, label]) => ({ key: k, label, test: (r: Resp) => ageBand(r.age) === k }));
export const sectorGroups = () => ["North", "Central", "Downtown", "South", "West Seattle", "Outside Seattle"].map((s) => ({ key: s, label: s, test: (r: Resp) => r.sector === s }));
export const tenureGroups = () => [["new", "Under 6 years", ["lt1", "1_2", "3_5"]], ["mid", "6–20 years", ["6_10", "11_20"]], ["long", "20+ years or born here", ["gt20", "born"]]].map(([k, label, codes]) => ({ key: k as string, label: label as string, test: (r: Resp) => (codes as string[]).includes(r.tenure || "") }));
export const DIMENSIONS: Record<string, { label: string; groups: () => { key: string; label: string; test: (r: Resp) => boolean }[] }> = {
  bd: { label: "Diaspora group", groups: bdGroups }, age: { label: "Age", groups: ageGroups }, sector: { label: "Area of the city", groups: sectorGroups }, tenure: { label: "Time in Seattle", groups: tenureGroups },
};
