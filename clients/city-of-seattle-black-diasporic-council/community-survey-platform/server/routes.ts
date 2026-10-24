import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import ExcelJS from "exceljs";
import { QUESTIONS, Q, LIKERT_ITEMS, BD_GROUPS, BD_NAME, OPEN_TEXT_FIELDS, SEATTLE_ZIPS, SURVEY_VERSION, IDENTITY_OPTS, optLabel, FLAG_LABEL, GOV_DIMENSIONS, GOV_PATHWAYS } from "@shared/survey";
import {
  applyFilter, isFiltered, representation, floorsStatus, distribution, optLabels, optOrder, likert, likertBy, priorities, prioritiesBy, barrierRanks, scale, trend, hide, DIMENSIONS, AGE_BANDS, ageBand, targets,
  type Filter, type Resp,
} from "@shared/analytics";
import * as S from "./storage";

/* ---------------- staff authentication (two roles; verifiers from runtime config, never from source) ---------------- */
const HASHES = (() => {
  let f: any = {};
  try { f = JSON.parse(fs.readFileSync("staff.secret.json", "utf8")); } catch {}
  return { admin: String(process.env.SD_ADMIN_HASH || f.adminHash || "").trim().toLowerCase(), analyst: String(process.env.SD_ANALYST_HASH || f.analystHash || "").trim().toLowerCase(), ops: String(process.env.SD_OPS_HASH || f.opsHash || "").trim().toLowerCase() };
})();
if (!HASHES.admin) console.warn("[auth] No admin access code configured.");
const fails = new Map<string, number[]>();
const WINDOW = 15 * 60 * 1000, MAX_FAILS = 10;
const clientIp = (req: Request) => String(req.header("x-forwarded-for") || "").split(",")[0].trim() || req.ip || "x";
function lockedOut(ip: string) { const now = Date.now(); const a = (fails.get(ip) || []).filter((t) => now - t < WINDOW); fails.set(ip, a); return a.length >= MAX_FAILS; }
function noteFail(ip: string) { const a = fails.get(ip) || []; a.push(Date.now()); fails.set(ip, a); }
const eq = (k: string, h: string) => {
  if (!k || !h) return false;
  const a = Buffer.from(crypto.createHash("sha256").update(k.trim()).digest("hex")); const b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
type Role = "viewer" | "analyst" | "admin";
const RANK: Record<Role, number> = { viewer: 1, analyst: 2, admin: 3 };
function roleOf(req: Request): { role: Role; member?: any } | null {
  const k = String(req.header("x-sd-key") || "");
  if (!k) return null;
  if (eq(k, HASHES.admin)) return { role: "admin" };
  if (eq(k, HASHES.analyst)) return { role: "analyst" };
  const m = S.memberByHash(S.hashCode(k));
  return m ? { role: m.role as Role, member: m } : null;
}
const need = (min: Role) => (req: Request, res: Response, next: NextFunction) => {
  const ip = clientIp(req);
  if (lockedOut(ip)) return res.status(429).json({ message: "Too many wrong access codes. Try again in 15 minutes." });
  const got = roleOf(req);
  if (!got) { if (req.header("x-sd-key")) noteFail(ip); return res.status(401).json({ message: "That access code isn’t recognized, or access was turned off." }); }
  if (RANK[got.role] < RANK[min]) return res.status(403).json({ message: min === "admin" ? "This action needs administrator access." : "Your access is view-only. Ask an administrator for analyst access." });
  (req as any).role = got.role; (req as any).member = got.member; next();
};
const who = (req: Request) => {
  const m = (req as any).member; if (m) return { actor: `${m.name} (${m.member_id})`, role: (req as any).role as string };
  const a = String(req.header("x-sd-actor") || "").trim().slice(0, 60);
  let name = a; try { name = decodeURIComponent(a); } catch {}
  return { actor: name || ((req as any).role === "admin" ? "Administrator" : "Analyst"), role: (req as any).role as string };
};
const hits = new Map<string, number[]>();
function rateLimited(key: string, max: number) {
  const now = Date.now(); const arr = (hits.get(key) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now); hits.set(key, arr); return arr.length > max;
}
const wrap = (fn: (req: Request, res: Response) => any) => async (req: Request, res: Response) => {
  try { await fn(req, res); } catch (e: any) {
    if (e instanceof S.HttpError) return res.status(e.status).json({ message: e.message, errors: e.details });
    console.error(e); res.status(500).json({ message: "Something went wrong. Nothing was changed." });
  }
};
const safe = (v: any) => (typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const parseFilter = (q: any): Filter => { const f: any = {}; for (const k of ["bd", "identity", "age", "gender", "sector", "zip", "tenure", "channel", "from", "to"]) if (q[k]) f[k] = String(q[k]).slice(0, 40); return f; };

/* ---------------- analytics bundle ---------------- */
function themeCounts(rs: Resp[]) {
  const ids = new Set(rs.map((r) => r.rid));
  const texts = S.openTextsForExport().filter((t) => ids.has(t.response_id));
  const tIds = new Set(texts.map((t) => t.text_id));
  const book = S.listCodebook() as any[];
  const codes = S.qualCodesAll().filter((c) => tIds.has(c.text_id));
  const byField = (kind: string) => new Set(texts.filter((t) => OPEN_TEXT_FIELDS.find((f) => f.id === t.question_id)?.kind === kind).map((t) => t.text_id));
  return {
    texts: texts.length, reviewed: texts.filter((t) => t.flag !== "review").length,
    approvedCodes: codes.filter((c) => c.status === "approved").length, suggested: codes.filter((c) => c.status === "suggested").length,
    themes: book.map((b) => {
      const ap = codes.filter((c) => c.theme_code === b.code && c.status === "approved");
      const resp = new Set(ap.map((c) => c.text_id.split("-Q")[0]));
      const kinds = Object.fromEntries(["challenge", "strength", "vision", "resources"].map((k) => { const set = byField(k); return [k, ap.filter((c) => set.has(c.text_id)).length]; }));
      return { code: b.code, name: b.name, approved: ap.length, respondents: resp.size, suggested: codes.filter((c) => c.theme_code === b.code && c.status === "suggested").length, kinds };
    }).sort((a, b) => b.respondents - a.respondents || b.suggested - a.suggested),
  };
}
function assetSummary(rs: Resp[], k: number) {
  const ids = new Set(rs.map((r) => r.rid));
  const orgs = S.listOrgs() as any[];
  const m = new Map<string, { norm: string; names: Map<string, number>; count: number; resp: Set<string>; types: Map<string, number>; ages: Map<string, number>; bd: Map<string, number>; sectors: Map<string, number>; orgId: string | null }>();
  for (const r of rs) for (const a of r.assets) {
    if (!ids.has(r.rid) || !a.norm) continue;
    const key = a.orgId || a.norm;
    if (!m.has(key)) m.set(key, { norm: a.norm, names: new Map(), count: 0, resp: new Set(), types: new Map(), ages: new Map(), bd: new Map(), sectors: new Map(), orgId: a.orgId });
    const x = m.get(key)!; x.count++; x.resp.add(r.rid); x.names.set(a.name, (x.names.get(a.name) || 0) + 1);
    if (a.type) x.types.set(a.type, (x.types.get(a.type) || 0) + 1);
    if (a.age) x.ages.set(a.age, (x.ages.get(a.age) || 0) + 1);
    for (const b of r.bd) x.bd.set(b, (x.bd.get(b) || 0) + 1);
    x.sectors.set(r.sector, (x.sectors.get(r.sector) || 0) + 1);
  }
  const top = (mm: Map<string, number>) => [...mm.entries()].sort((a, b) => b[1] - a[1]);
  const list = [...m.entries()].map(([key, x]) => {
    const org = x.orgId ? orgs.find((o) => o.org_id === x.orgId) : null;
    return {
      key, name: org?.name || top(x.names)[0][0], orgId: x.orgId, validated: !!org?.validated, mentions: x.count, respondents: x.resp.size,
      type: org?.org_type || top(x.types)[0]?.[0] || null, age: org?.age_status || top(x.ages)[0]?.[0] || null,
      bd: top(x.bd).map(([c, n]) => ({ code: c, n: hide(n, k) ? null : n })), sectors: top(x.sectors).map(([s, n]) => ({ sector: s, n: hide(n, k) ? null : n })), variants: top(x.names).map(([nm]) => nm).slice(0, 5),
    };
  }).sort((a, b) => b.respondents - a.respondents || a.name.localeCompare(b.name));
  const types = new Map<string, number>(); for (const a of list) if (a.type) types.set(a.type, (types.get(a.type) || 0) + a.mentions);
  const age = new Map<string, number>(); for (const a of list) if (a.age) age.set(a.age, (age.get(a.age) || 0) + a.mentions);
  return { distinct: list.length, mentions: list.reduce((s, a) => s + a.mentions, 0), respondentsNaming: rs.filter((r) => r.assets.length).length, linked: list.filter((a) => a.orgId).length, validated: list.filter((a) => a.validated).length, directory: orgs.length, list, types: top(types).map(([t, n]) => ({ type: t, n })), ages: top(age).map(([t, n]) => ({ age: t, n })) };
}
function geo(rs: Resp[], k: number) {
  const m = new Map<string, number>();
  for (const r of rs) if (r.zip) m.set(r.zip, (m.get(r.zip) || 0) + 1);
  const zips = Object.entries(SEATTLE_ZIPS).map(([zip, z]) => { const n = m.get(zip) || 0; return { zip, area: z.area, sector: z.sector, cd: !!z.cd, x: z.x, y: z.y, n: hide(n, k) ? null : n, small: hide(n, k) }; });
  const outside = [...m.entries()].filter(([z]) => !SEATTLE_ZIPS[z]).reduce((a, [, n]) => a + n, 0);
  const sectors = distribution(rs, (r) => (r.zip ? r.sector : null));
  sectors.items = sectors.items.map((i) => ({ ...i, count: hide(i.count, k) ? (null as any) : i.count, pct: hide(i.count, k) ? null : i.pct }));
  return { zips, zipCount: m.size, withZip: rs.filter((r) => r.zip).length, outside: hide(outside, k) ? null : outside, cd: rs.filter((r) => r.cd).length, sectors };
}
const supDist = (d: ReturnType<typeof distribution>, k: number, on: boolean) => (on ? { ...d, items: d.items.map((i) => (hide(i.count, k) ? { ...i, count: null as any, pct: null, small: true } : i)) } : d);

function bundle(f: Filter, forPublic = false) {
  const s = S.getSettings(); const k = s.suppression_k;
  const all = S.allResponses();
  const included = all.filter((r) => r.status === "included");
  const rs = applyFilter(all, f);
  const filtered = isFiltered(f);
  const base = { k, n: rs.length, total: included.length, filtered, settings: forPublic ? undefined : s, generatedAt: new Date().toISOString(), surveyVersion: SURVEY_VERSION };
  if (filtered && rs.length < k) return { ...base, suppressed: true };
  const sess = S.sessionStats();
  const bench = S.listBenchmarks();
  const rep = representation(included, bench, s);
  const repF = filtered ? representation(rs, bench, s) : rep;
  const lk = likert(rs);
  const pr = priorities(rs);
  const assets = assetSummary(rs, k);
  const th = themeCounts(rs);
  const q32 = distribution(rs, (r) => r.single.Q32 || null, optLabels("Q32"), optOrder("Q32"));
  const dims = Object.fromEntries(Object.entries(DIMENSIONS).map(([key, d]) => [key, { label: d.label, likert: likertBy(rs, d.groups(), k), priorities: prioritiesBy(rs, d.groups(), k) }]));
  const cpl = forPublic;
  const dates = included.map((r) => r.date).sort();
  return {
    ...base, suppressed: false,
    kpis: {
      responses: rs.length, started: sess.started, completed: sess.completed, completionRate: sess.started ? Math.round((sess.completed / sess.started) * 1000) / 10 : null,
      zips: new Set(rs.filter((r) => r.zip).map((r) => r.zip)).size, groupsRepresented: rep.groups.filter((g) => g.count > 0).length,
      targetN: s.target_n, attainment: rep.overallAttainment, groupsOnTarget: rep.groups.filter((g) => g.status === "On target" || g.status === "Above target").length,
      orgsIdentified: assets.distinct, focusInterest: q32.items.filter((i) => i.key !== "no").reduce((a, i) => a + i.count, 0), focusInterestPct: q32.answered ? Math.round((q32.items.filter((i) => i.key !== "no").reduce((a, i) => a + i.count, 0) / q32.answered) * 1000) / 10 : null,
      lastResponse: dates[dates.length - 1] || null, firstResponse: dates[0] || null, excluded: all.length - included.length, flagged: included.filter((r) => r.flags.length).length, review: rep.review,
      contacts: forPublic ? undefined : S.listContacts().length,
    },
    funnel: sess.reached,
    trend: trend(rs),
    representation: rep, representationFiltered: filtered ? repF : undefined,
    floors: floorsStatus(included, S.listFloors()),
    demo: {
      age: supDist(distribution(rs, (r) => r.age, optLabels("Q01"), optOrder("Q01")), k, cpl),
      ageBand: supDist(distribution(rs, (r) => ageBand(r.age), AGE_BANDS, Object.keys(AGE_BANDS)), k, cpl),
      gender: supDist(distribution(rs, (r) => r.gender, optLabels("Q02"), optOrder("Q02")), k, cpl),
      tenure: supDist(distribution(rs, (r) => r.tenure, optLabels("Q05"), optOrder("Q05")), k, cpl),
      identity: supDist(distribution(rs, (r) => r.identity, Object.fromEntries(IDENTITY_OPTS.map((o) => [o.code, o.label])), IDENTITY_OPTS.map((o) => o.code)), k, cpl),
      relationship: supDist(distribution(rs, (r) => r.multi.Q08 || null, optLabels("Q08"), optOrder("Q08")), k, cpl),
      channel: forPublic ? undefined : distribution(rs, (r) => r.channel, Object.fromEntries(S.listChannels().map((c) => [c.code, c.name]))),
      multiIdentity: rs.filter((r) => r.identity.length > 1).length,
    },
    geo: geo(rs, k),
    likert: lk, dims,
    priorities: pr, barriers: barrierRanks(rs),
    q21: supDist(distribution(rs, (r) => r.multi.Q21 || null, optLabels("Q21"), undefined), k, cpl),
    q23: supDist(distribution(rs, (r) => r.multi.Q23 || null, optLabels("Q23"), undefined), k, cpl),
    q35: supDist(distribution(rs, (r) => r.multi.Q35 || null, optLabels("Q35"), undefined), k, cpl),
    q37: supDist(distribution(rs, (r) => r.single.Q37 || null, optLabels("Q37"), optOrder("Q37")), k, cpl),
    q32: supDist(q32, k, cpl),
    scales: Object.fromEntries(["Q28", "Q29", "Q30", "Q33", "Q34"].map((id) => [id, scale(rs, id)])),
    assets: forPublic ? { distinct: assets.distinct, mentions: assets.mentions, types: assets.types, ages: assets.ages } : assets,
    themes: th,
  };
}

/* ---------------- exports ---------------- */
const RESP_COLS = () => {
  const cols: { key: string; header: string; get: (r: Resp, raw: any) => any }[] = [
    { key: "response_id", header: "Response ID", get: (r) => r.rid }, { key: "submitted_on", header: "Submitted (date)", get: (r) => r.date },
    { key: "status", header: "Analysis status", get: (r) => r.status }, { key: "entry_mode", header: "Entry mode", get: (r) => r.entryMode }, { key: "channel", header: "Collection link", get: (r) => r.channel },
    { key: "quality_flags", header: "Quality flags", get: (r) => r.flags.join("; ") },
    { key: "bd_codes", header: "Analytical group codes (derived)", get: (r) => [...r.bd, ...(r.bdReview ? ["REVIEW"] : [])].join("; ") },
    { key: "sector", header: "Area of city (derived from ZIP)", get: (r) => r.sector },
  ];
  for (const q of QUESTIONS) {
    if (q.type === "text3") { [1, 2, 3].forEach((i) => cols.push({ key: `${q.id}_${i}`, header: `${q.id}_${i}`, get: (r) => r.single[`${q.id}_${i}`] ?? "" })); continue; }
    if (q.type === "assets") { [1, 2, 3].forEach((i) => { cols.push({ key: `${q.id}_${i}_name`, header: `${q.id}_${i}_name`, get: (r) => r.assets[i - 1]?.name ?? "" }); cols.push({ key: `${q.id}_${i}_type`, header: `${q.id}_${i}_type`, get: (r) => r.assets[i - 1]?.type ?? "" }); cols.push({ key: `${q.id}_${i}_age`, header: `${q.id}_${i}_age`, get: (r) => r.assets[i - 1]?.age ?? "" }); }); continue; }
    cols.push({ key: q.id, header: q.id, get: (r) => {
      if (q.id === "Q04") return r.identity.join("; ");
      if (q.type === "likert") { const v = r.likert[q.id]; return v === undefined ? "" : v === null ? "na" : v; }
      if (q.type === "multi") return (r.multi[q.id] || []).join("; ");
      if (q.type === "pick_rank") return r.priorities.map((p) => p.issue).join(" > ");
      if (q.type === "rank") return r.barriers.map((p) => p.barrier).join(" > ");
      return r.single[q.id] ?? "";
    } });
    for (const f of q.followups || []) cols.push({ key: f.id, header: f.id, get: (r) => r.single[f.id] ?? "" });
  }
  return cols;
};
function dictionaryRows() {
  const rows: any[] = [];
  for (const q of QUESTIONS) {
    const table = q.id === "Q04" ? "respondent_identities" : q.type === "likert" ? "likert_responses" : q.type === "multi" ? "multi_selections" : q.type === "pick_rank" ? "priority_rankings" : q.type === "rank" ? "barrier_rankings" : q.type === "assets" ? "asset_mentions" : "survey_answers";
    rows.push({ id: q.id, section: q.section, type: q.type, text: q.label, codes: (q.options || []).map((o) => `${o.code} = ${o.label}`).join(" | "), table, notes: q.type === "likert" ? `Construct: ${q.analysis}; direction: ${LIKERT_ITEMS.find((l) => l.id === q.id)?.direction}. 4 = Strongly agree … 1 = Strongly disagree; na = prefer not to answer.` : q.type === "pick_rank" ? `Up to ${q.max}, ranked 1 = most important. Weighted score = 6 − rank.` : q.type === "rank" ? "Ranked 1 = most significant. Weighted score = 6 − rank." : q.help || "" });
    for (const f of q.followups || []) rows.push({ id: f.id, section: q.section, type: "text", text: `${f.label} (shown when ${q.id} = ${f.when})`, codes: "", table: "survey_answers", notes: "Conditional follow-up" });
  }
  rows.push({ id: "bd_codes", section: "derived", type: "derived", text: "Analytical diaspora classification", codes: BD_GROUPS.map((g) => `${g.code} = ${g.name}`).join(" | ") + " | REVIEW = needs analyst review", table: "analytic_codes", notes: "Derived from Q04 plus origin text by documented rules; analysts can change it. Never overwrites the respondent’s own answer." });
  return rows;
}
async function sendXlsx(res: Response, name: string, sheets: { name: string; columns: { header: string; key: string; width?: number }[]; rows: any[]; note?: string }[]) {
  const wb = new ExcelJS.Workbook(); wb.creator = "Seattle Black Diasporic Community Survey";
  for (const sh of sheets) {
    const ws = wb.addWorksheet(sh.name.slice(0, 31));
    ws.columns = sh.columns.map((c) => ({ header: c.header, key: c.key, width: c.width || Math.min(48, Math.max(12, c.header.length + 2)) }));
    ws.getRow(1).font = { bold: true }; ws.views = [{ state: "frozen", ySplit: 1 }];
    for (const r of sh.rows) ws.addRow(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safe(v)])));
    if (sh.note) { ws.addRow({}); ws.addRow({ [sh.columns[0].key]: sh.note }).font = { italic: true }; }
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  await wb.xlsx.write(res); res.end();
}
const csv = (cols: string[], rows: any[][]) => [cols, ...rows].map((r) => r.map((v) => { const s = String(safe(v ?? "")); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\r\n");
const stamp = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

export async function registerRoutes(_httpServer: Server, app: Express) {
  /* ---------- public ---------- */
  app.get("/api/public/config", (req, res) => {
    const s = S.getSettings();
    const c = String(req.query.c || "").toLowerCase();
    const ch = c ? S.listChannels().find((x) => x.code === c && x.active) : null;
    res.json({ status: s.survey_status, mode: s.mode, closedMessage: s.closed_message, version: SURVEY_VERSION, channel: ch ? ch.code : null });
  });
  /* Maintenance health check: record counts and startup-backup status only (no answers, no contacts). Needs the separate ops key. */
  app.get("/api/ops/status", (req, res) => {
    const ip = clientIp(req);
    if (lockedOut(ip)) return res.status(429).json({ message: "Too many attempts." });
    if (!eq(String(req.header("x-sd-ops") || ""), HASHES.ops)) { noteFail(ip); return res.status(401).json({ message: "Not authorized." }); }
    res.json(S.opsStatus());
  });
  app.post("/api/public/session", wrap((req, res) => {
    if (rateLimited(`s:${clientIp(req)}`, 60)) throw new S.HttpError(429, "Please wait a few minutes and try again.");
    const c = String(req.body?.channel || "").toLowerCase();
    const ch = S.listChannels().find((x) => x.code === c && x.active);
    res.json({ token: S.startSession(ch ? ch.code : "web") });
  }));
  app.post("/api/public/progress", wrap((req, res) => { S.progressSession(String(req.body?.token || ""), Number(req.body?.step) || 0); res.json({ ok: true }); }));
  app.post("/api/public/submit", wrap((req, res) => {
    if (req.body?.website) return res.json({ responseId: "received" }); // honeypot
    if (rateLimited(`sub:${clientIp(req)}`, 30)) throw new S.HttpError(429, "Too many submissions from this connection. Please wait a few minutes and try again.");
    const out = S.submitSurvey(req.body, { entryMode: "online" });
    res.json({ ok: true, receipt: out.responseId });
  }));
  app.post("/api/public/contact", wrap((req, res) => {
    if (req.body?.website) return res.json({ ok: true });
    if (rateLimited(`c:${clientIp(req)}`, 10)) throw new S.HttpError(429, "Please wait a few minutes and try again.");
    S.submitContact(req.body); res.json({ ok: true });
  }));
  app.get("/api/public/findings", wrap((_req, res) => {
    // Results are for the executive team only; the community site never receives findings.
    return res.json({ published: false });
    const s = S.getSettings();
    const b: any = bundle({}, true);
    const quotes = S.openTextsForExport().filter((t) => t.flag === "aggregate" && t.resp_status === "included" && t.question_id !== "Q06").map((t) => ({ field: OPEN_TEXT_FIELDS.find((f) => f.id === t.question_id)?.label, text: t.text })).slice(0, 24);
    // public view drops per-group counts that fall under the suppression threshold
    b.representation.groups = b.representation.groups.map((g: any) => ({ ...g, count: hide(g.count, s.suppression_k) ? null : g.count, share: hide(g.count, s.suppression_k) ? null : g.share, needed: undefined }));
    delete b.floors; delete b.funnel;
    res.json({ published: true, ...b, quotes });
  }));

  /* ---------- staff ---------- */
  const A = need("analyst"), AD = need("admin"), V = need("viewer");
  app.post("/api/staff/login", V, (req, res) => { const m = (req as any).member; if (m) S.touchMember(m.member_id); res.json({ role: (req as any).role, name: m?.name || null, memberId: m?.member_id || null, personal: !!m }); });
  app.get("/api/staff/version", V, (_req, res) => res.json({ version: S.dataVersion() }));
  app.get("/api/staff/analytics", V, wrap((req, res) => res.json(bundle(parseFilter(req.query)))));
  app.get("/api/staff/meta", V, wrap((_req, res) => res.json({ settings: S.getSettings(), benchmarks: S.listBenchmarks(), targets: targets(S.listBenchmarks()), floors: S.listFloors(), channels: S.listChannels(), codebook: S.listCodebook(), govDimensions: GOV_DIMENSIONS, govPathways: GOV_PATHWAYS })));

  app.get("/api/staff/responses", A, wrap((req, res) => {
    const all = S.allResponses();
    const st = String(req.query.status || "all");
    const f = parseFilter(req.query);
    const base = st === "excluded" ? all.filter((r) => r.status === "excluded") : st === "flagged" ? all.filter((r) => r.flags.length) : st === "review" ? all.filter((r) => r.bdReview) : all;
    const list = isFiltered(f) ? applyFilter(base.map((r) => ({ ...r, status: "included" as const })), f).map((r) => all.find((x) => x.rid === r.rid)!) : base;
    res.json(list.slice().reverse().map((r) => ({ rid: r.rid, date: r.date, status: r.status, flags: r.flags, entryMode: r.entryMode, channel: r.channel, age: r.age, zip: r.zip, sector: r.sector, identity: r.identity, bd: r.bd, bdReview: r.bdReview, priorities: r.priorities.slice(0, 3).map((p) => p.issue), duration: r.duration })));
  }));
  app.get("/api/staff/responses/:rid", A, wrap((req, res) => res.json(S.responseDetail(String(req.params.rid)))));
  app.post("/api/staff/responses", A, wrap((req, res) => { const w = who(req); res.json(S.submitSurvey(req.body, { entryMode: "staff_entry", enteredBy: w.actor, role: w.role })); }));
  app.patch("/api/staff/responses/:rid/status", A, wrap((req, res) => { const w = who(req); S.setResponseStatus(String(req.params.rid), req.body?.status === "excluded" ? "excluded" : "included", String(req.body?.reason || ""), w.actor, w.role); res.json({ ok: true }); }));
  app.patch("/api/staff/responses/:rid/classification", A, wrap((req, res) => { const w = who(req); S.setBdCodes(String(req.params.rid), Array.isArray(req.body?.codes) ? req.body.codes : [], String(req.body?.note || "").slice(0, 300), w.actor, w.role); res.json({ ok: true }); }));

  app.get("/api/staff/texts", V, wrap((req, res) => res.json(S.listTexts({ q: String(req.query.q || ""), field: String(req.query.field || "all"), flag: (req as any).role === "viewer" ? "aggregate" : String(req.query.flag || "all"), status: String(req.query.status || "all") }))));
  app.post("/api/staff/texts/:id/code", A, wrap((req, res) => { const w = who(req); S.codeText(String(req.params.id), String(req.body?.theme || ""), req.body?.status, w.actor, w.role, { subtheme: req.body?.subtheme, sentiment: req.body?.sentiment, note: req.body?.note }); res.json({ ok: true }); }));
  app.post("/api/staff/texts/:id/flag", A, wrap((req, res) => { const w = who(req); S.flagText(String(req.params.id), String(req.body?.flag || ""), w.actor, w.role); res.json({ ok: true }); }));
  app.post("/api/staff/codebook", A, wrap((req, res) => { const w = who(req); res.json({ code: S.upsertTheme(req.body, w.actor, w.role) }); }));

  app.get("/api/staff/orgs", V, wrap((_req, res) => res.json(S.listOrgs())));
  app.post("/api/staff/orgs", A, wrap((req, res) => { const w = who(req); res.json({ id: S.upsertOrg(req.body, w.actor, w.role) }); }));
  app.delete("/api/staff/orgs/:id", AD, wrap((req, res) => { const w = who(req); S.deleteOrg(String(req.params.id), w.actor, w.role); res.json({ ok: true }); }));

  app.get("/api/staff/table/:t", V, wrap((req, res) => res.json(S.listTable(String(req.params.t)))));
  app.post("/api/staff/table/:t", A, wrap((req, res) => { const w = who(req); res.json({ id: S.upsertRow(String(req.params.t), req.body, w.actor, w.role) }); }));
  app.delete("/api/staff/table/:t/:id", AD, wrap((req, res) => { const w = who(req); S.deleteRow(String(req.params.t), String(req.params.id), w.actor, w.role); res.json({ ok: true }); }));

  app.post("/api/staff/channels", A, wrap((req, res) => { const w = who(req); res.json({ code: S.addChannel(req.body, w.actor, w.role) }); }));
  app.put("/api/staff/settings", AD, wrap((req, res) => {
    const w = who(req); const b = req.body || {}; const cur = S.getSettings();
    const num = (k: string, lo: number, hi: number) => { if (b[k] === undefined) return; const v = Number(b[k]); if (!(v >= lo && v <= hi)) throw new S.HttpError(422, `${k.replace(/_/g, " ")} must be between ${lo} and ${hi}`); b[k] = v; };
    num("suppression_k", 3, 20); num("target_n", 1, 100000); num("target_min", 1, 100000); num("target_max", 1, 100000); num("planning_population", 1, 10000000); num("status_under", 1, 200); num("status_on_low", 1, 200); num("status_on_high", 1, 400);
    if (b.mode && !["collection", "internal", "public"].includes(b.mode)) throw new S.HttpError(422, "Unknown mode");
    if (b.survey_status && !["open", "closed"].includes(b.survey_status)) throw new S.HttpError(422, "Unknown status");
    const next = { ...cur, ...b };
    if (!(next.status_under <= next.status_on_low && next.status_on_low <= next.status_on_high)) throw new S.HttpError(422, "Status thresholds must increase: underrepresented ≤ on-target low ≤ on-target high");
    res.json(S.setSettings(b, w.actor, w.role));
  }));
  app.put("/api/staff/benchmarks", AD, wrap((req, res) => { const w = who(req); S.saveBenchmarks(Array.isArray(req.body) ? req.body : [], w.actor, w.role); res.json({ ok: true }); }));
  app.put("/api/staff/floors", AD, wrap((req, res) => { const w = who(req); S.saveFloors(Array.isArray(req.body) ? req.body : [], w.actor, w.role); res.json({ ok: true }); }));

  app.get("/api/staff/contacts", AD, wrap((_req, res) => res.json(S.listContacts())));
  app.patch("/api/staff/contacts/:id", AD, wrap((req, res) => { const w = who(req); S.updateContact(String(req.params.id), req.body || {}, w.actor, w.role); res.json({ ok: true }); }));
  app.delete("/api/staff/contacts/:id", AD, wrap((req, res) => { const w = who(req); S.deleteContact(String(req.params.id), w.actor, w.role); res.json({ ok: true }); }));
  app.get("/api/staff/audit", AD, wrap((_req, res) => res.json(S.auditLog(500))));

  /* ---------- exports ---------- */
  /* ---------- team access (admin) ---------- */
  app.get("/api/staff/team", AD, wrap((_req, res) => res.json(S.listMembers())));
  app.post("/api/staff/team", AD, wrap((req, res) => { const w = who(req); res.json(S.addMember(req.body, w.actor, w.role)); }));
  app.patch("/api/staff/team/:id", AD, wrap((req, res) => { const w = who(req); res.json(S.updateMember(String(req.params.id), req.body || {}, w.actor, w.role)); }));

  /* ---------- import (analyst+) ---------- */
  app.get("/api/staff/import/template.xlsx", A, wrap(async (_req, res) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Responses");
    const cols = importColumns();
    ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: Math.min(40, Math.max(14, c.header.length + 2)) }));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4D3A" } }; ws.views = [{ state: "frozen", ySplit: 1 }];
    const g = wb.addWorksheet("How to fill this in");
    g.columns = [{ header: "Column", key: "c", width: 34 }, { header: "Question", key: "q", width: 60 }, { header: "Type", key: "t", width: 18 }, { header: "How to enter", key: "h", width: 60 }, { header: "Allowed codes (code = label)", key: "o", width: 90 }];
    g.getRow(1).font = { bold: true };
    g.addRow({ c: "date", q: "Date the survey was completed (optional)", t: "date", h: "YYYY-MM-DD. Leave blank to use the import date.", o: "" });
    g.addRow({ c: "channel", q: "Collection link code (optional)", t: "code", h: "A code from Collection links. Leave blank to label the row as imported.", o: "" });
    for (const c of cols.filter((c) => c.q)) g.addRow({ c: c.header, q: c.q!.label, t: c.q!.type, h: HOW[c.q!.type] || "", o: (c.q!.options || []).map((o: any) => `${o.code} = ${o.label}`).join("; ") });
    g.getColumn("o").alignment = { wrapText: true, vertical: "top" }; g.getColumn("q").alignment = { wrapText: true, vertical: "top" };
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", `attachment; filename="survey-import-template-${SURVEY_VERSION}.xlsx"`);
    res.send(Buffer.from(buf as ArrayBuffer));
  }));
  app.get("/api/staff/import/batches", V, wrap((_req, res) => res.json(S.listBatches())));
  const runImport = async (req: Request, commit: boolean) => {
    const name = String(req.body?.fileName || "upload").slice(0, 160);
    const b64 = String(req.body?.data || ""); if (!b64) throw new S.HttpError(400, "Choose a file to import.");
    const buf = Buffer.from(b64, "base64"); if (buf.length > 8 * 1024 * 1024) throw new S.HttpError(413, "Files must be under 8 MB.");
    const table = await readTable(name, buf);
    if (!table.headers.length) throw new S.HttpError(422, "The file has no header row.");
    const map = mapHeaders(table.headers);
    const matched = map.filter((m) => m.col).length;
    if (!map.some((m) => m.col?.q)) throw new S.HttpError(422, "None of the columns match survey questions. Start from the import template so the headers line up.");
    const channelOverride = String(req.body?.channel || "").trim().toLowerCase();
    const rows: any[] = []; const ids: string[] = []; let dup = 0, rej = 0, empty = 0; const seen = new Set<string>();
    table.rows.forEach((cells, i) => {
      if (cells.every((c) => c == null || String(c).trim() === "")) { empty++; return; }
      const { answers, date, channel, issues } = rowToAnswers(map, cells);
      const { answers: ok, errors } = S.validatePayload(answers);
      const errs = [...issues, ...Object.entries(errors).map(([q, m]) => `${q}: ${m}`)];
      const answered = Object.keys(ok).length;
      const rowNo = i + 2;
      if (!answered) { rej++; rows.push({ row: rowNo, status: "rejected", answered, messages: errs.length ? errs : ["No answers could be read from this row"] }); return; }
      if (!commit) {
        const sha = S.rawSha(ok, channelOverride || channel);
        if (S.shaExists(sha) || seen.has(sha)) { dup++; rows.push({ row: rowNo, status: "duplicate", answered, messages: [S.shaExists(sha) ? "Already in the platform; will be skipped" : "Same as an earlier row in this file; will be skipped"] }); return; }
        seen.add(sha); rows.push({ row: rowNo, status: errs.length ? "warning" : "ready", answered, messages: errs }); return;
      }
      try {
        const w = who(req);
        const r = S.submitSurvey({ answers: ok, channel: channelOverride || channel }, { entryMode: "import", enteredBy: w.actor, role: w.role, date });
        ids.push(r.responseId); rows.push({ row: rowNo, status: "imported", responseId: r.responseId, answered, messages: errs });
      } catch (e: any) {
        if (e instanceof S.HttpError && e.status === 409) { dup++; rows.push({ row: rowNo, status: "duplicate", answered, messages: [e.message] }); }
        else { rej++; rows.push({ row: rowNo, status: "rejected", answered, messages: [e?.message || "Could not import"] }); }
      }
    });
    const out: any = { fileName: name, totalRows: table.rows.length - empty, columns: { matched, total: table.headers.length, ignored: map.filter((m) => !m.col).map((m) => m.header).filter(Boolean) }, rows,
      counts: { ready: rows.filter((r) => r.status === "ready" || r.status === "warning" || r.status === "imported").length, warnings: rows.filter((r) => r.messages.length && r.status !== "rejected" && r.status !== "duplicate").length, rejected: rej, duplicates: dup, imported: ids.length } };
    if (commit) { const w = who(req); out.batchId = S.recordBatch({ file: name, total: out.totalRows, ids, dup, rej, channel: channelOverride || null, by: w.actor, role: w.role }); }
    return out;
  };
  app.post("/api/staff/import/preview", A, wrap(async (req, res) => res.json(await runImport(req, false))));
  app.post("/api/staff/import/commit", A, wrap(async (req, res) => res.json(await runImport(req, true))));

  app.get("/api/staff/export/:kind", V, wrap(async (req, res) => {
    const kind = String(req.params.kind); const w = who(req); const s = S.getSettings(); const k = s.suppression_k;
    const all = S.allResponses(); const inc = all.filter((r) => r.status === "included");
    const log = () => S.audit(w.actor, w.role, "export", "export", kind);
    if (kind === "dataset.csv") {
      const cols = RESP_COLS().filter((c) => !OPEN_TEXT_FIELDS.some((f) => c.key === f.id || c.key.startsWith("Q24_")) && !c.key.endsWith("_other") && !c.key.endsWith("_self"));
      log();
      res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename="survey-dataset-coded-${stamp()}.csv"`);
      return res.send("\uFEFF" + csv(cols.map((c) => c.key), all.map((r) => cols.map((c) => c.get(r, null)))));
    }
    if (kind === "dataset.xlsx" || kind === "complete.xlsx") {
      const cols = RESP_COLS();
      const coded = cols.filter((c) => !OPEN_TEXT_FIELDS.some((f) => c.key === f.id) && !c.key.startsWith("Q24_") && !c.key.endsWith("_other") && !c.key.endsWith("_self"));
      const sheets: any[] = [
        { name: "Responses (coded)", columns: coded.map((c) => ({ header: c.key, key: c.key })), rows: all.map((r) => Object.fromEntries(coded.map((c) => [c.key, c.get(r, null)]))), note: "One row per response. Open-text answers are in the Open text sheet. No names or contact details are stored with survey answers." },
        { name: "Open text", columns: [{ header: "text_id", key: "text_id", width: 20 }, { header: "response_id", key: "response_id" }, { header: "question_id", key: "question_id" }, { header: "quote_flag", key: "flag" }, { header: "text", key: "text", width: 90 }], rows: S.openTextsForExport().map((t) => ({ ...t, flag: FLAG_LABEL[t.flag] })) },
        { name: "Data dictionary", columns: [{ header: "Field", key: "id" }, { header: "Section", key: "section" }, { header: "Type", key: "type" }, { header: "Question", key: "text", width: 70 }, { header: "Codes", key: "codes", width: 80 }, { header: "Table", key: "table", width: 22 }, { header: "Notes", key: "notes", width: 60 }], rows: dictionaryRows() },
      ];
      if (kind === "complete.xlsx") {
        const rep = representation(inc, S.listBenchmarks(), s);
        sheets.push(
          { name: "Representation", columns: ["code", "name", "population", "oversample", "target", "targetCount", "count", "share", "gap", "attainment", "needed", "status"].map((x) => ({ header: x, key: x })), rows: rep.groups, note: "population = benchmark share (P). target = equity-adjusted target share (T = P×O / ΣP×O). share = % of classified respondents. Respondents can belong to more than one group, so shares can sum above 100%." },
          { name: "Priorities", columns: ["code", "label", "selected", "selectedPct", "score", "avgRank", "top1Pct", "top3Pct"].map((x) => ({ header: x, key: x })), rows: priorities(inc) },
          { name: "Belonging items", columns: ["id", "text", "construct", "direction", "n", "agreePct", "disagreePct", "mean", "na"].map((x) => ({ header: x, key: x })), rows: likert(inc) },
          { name: "Organizations", columns: ["org_id", "name", "aliases", "org_type", "community_served", "diaspora", "neighborhood", "website", "age_status", "validated", "notes"].map((x) => ({ header: x, key: x })), rows: S.listOrgs() as any[] },
          { name: "Qualitative codes", columns: ["text_id", "theme_code", "source", "status", "subtheme", "sentiment", "note", "updated_by", "updated_at"].map((x) => ({ header: x, key: x })), rows: S.qualCodesAll() },
          { name: "Benchmarks", columns: ["bd_code", "pct", "moe", "oversample", "dataset", "vintage", "geography", "tbl", "variable", "status", "notes"].map((x) => ({ header: x, key: x })), rows: S.listBenchmarks() },
          { name: "Sources", columns: ["id", "title", "publisher", "url", "dataset", "vintage", "used_for", "figure", "figure_type", "notes"].map((x) => ({ header: x, key: x, width: 30 })), rows: S.listTable("sources") },
        );
      }
      log(); return sendXlsx(res, `${kind === "complete.xlsx" ? "survey-complete-workbook" : "survey-dataset"}-${stamp()}.xlsx`, sheets);
    }
    if (kind === "dictionary.xlsx") { log(); return sendXlsx(res, `data-dictionary-${stamp()}.xlsx`, [{ name: "Data dictionary", columns: [{ header: "Field", key: "id" }, { header: "Section", key: "section" }, { header: "Type", key: "type" }, { header: "Question", key: "text", width: 70 }, { header: "Codes", key: "codes", width: 80 }, { header: "Table", key: "table", width: 22 }, { header: "Notes", key: "notes", width: 60 }], rows: dictionaryRows() }]); }
    if (kind === "representation.xlsx") {
      const rep = representation(inc, S.listBenchmarks(), s); const fl = floorsStatus(inc, S.listFloors());
      log(); return sendXlsx(res, `representation-report-${stamp()}.xlsx`, [
        { name: "Diaspora groups", columns: [["code", "Code"], ["name", "Group"], ["population", "Population benchmark %"], ["target", "Engagement target %"], ["targetCount", "Target responses"], ["count", "Actual responses"], ["share", "Actual share %"], ["gap", "Gap (pts)"], ["attainment", "Attainment %"], ["needed", "Still needed"], ["status", "Status"], ["benchStatus", "Benchmark status"]].map(([key, header]) => ({ key, header })), rows: rep.groups, note: `Included responses: ${rep.n}. Classified: ${rep.classified}. Awaiting review: ${rep.review}. Multi-group respondents: ${rep.multi}. Operational target: ${s.target_n}. Benchmarks are estimates, not exact counts.` },
        { name: "Engagement floors", columns: [["name", "Group"], ["floor_min", "Floor % (min)"], ["floor_max", "Floor % (max)"], ["measure", "How measured"], ["count", "Respondents"], ["share", "Share %"], ["notes", "Notes"]].map(([key, header]) => ({ key, header, width: 28 })), rows: fl.map((f: any) => ({ ...f, count: f.measured ? f.count : "Not measured", share: f.measured ? f.share : "" })) },
      ]);
    }
    if (kind === "orgs.xlsx") {
      const a = assetSummary(inc, k);
      log(); return sendXlsx(res, `community-assets-${stamp()}.xlsx`, [
        { name: "Mentioned by respondents", columns: [["name", "Name (most common spelling)"], ["respondents", "Respondents naming"], ["mentions", "Mentions"], ["type", "Type"], ["age", "New / established"], ["orgId", "Directory ID"], ["validated", "Researcher-validated"], ["variants", "Spellings seen"]].map(([key, header]) => ({ key, header, width: 26 })), rows: a.list.map((x) => ({ ...x, validated: x.validated ? "Yes" : "No", variants: x.variants.join("; ") })), note: "Respondent mentions are not endorsements, and no organization is presented as representing a community." },
        { name: "Directory", columns: ["org_id", "name", "aliases", "org_type", "community_served", "diaspora", "neighborhood", "website", "age_status", "validated", "notes"].map((x) => ({ header: x, key: x, width: 22 })), rows: S.listOrgs() as any[] },
      ]);
    }
    if (kind === "qualitative.xlsx") {
      const book = new Map((S.listCodebook() as any[]).map((b) => [b.code, b.name]));
      log(); return sendXlsx(res, `qualitative-coding-${stamp()}.xlsx`, [
        { name: "Codes", columns: [["text_id", "Text ID"], ["theme_code", "Theme"], ["theme_name", "Theme name"], ["source", "Source"], ["status", "Status"], ["subtheme", "Subtheme"], ["sentiment", "Sentiment"], ["note", "Note"], ["updated_by", "By"], ["updated_at", "When"]].map(([key, header]) => ({ key, header })), rows: S.qualCodesAll().map((c) => ({ ...c, theme_name: book.get(c.theme_code) })) },
        { name: "Codebook", columns: ["code", "name", "description", "keywords", "active"].map((x) => ({ header: x, key: x, width: 30 })), rows: S.listCodebook() as any[] },
      ]);
    }
    if (kind === "aggregate.xlsx") {
      const b: any = bundle({}, true);
      const d = (x: any) => x.items.map((i: any) => ({ label: i.label, count: i.count ?? `<${k}`, pct: i.pct ?? "" }));
      const cols = [{ header: "Category", key: "label", width: 50 }, { header: "Respondents", key: "count" }, { header: "% of answering", key: "pct" }];
      log(); return sendXlsx(res, `aggregate-tables-${stamp()}.xlsx`, [
        { name: "Age", columns: cols, rows: d(b.demo.age) }, { name: "Time in Seattle", columns: cols, rows: d(b.demo.tenure) }, { name: "Identity (self)", columns: cols, rows: d(b.demo.identity), note: "Multi-select; percentages can sum above 100%." },
        { name: "Where community is found", columns: cols, rows: d(b.q21) }, { name: "Cross-group barriers", columns: cols, rows: d(b.q23) }, { name: "Preferred formats", columns: cols, rows: d(b.q35) },
        { name: "Priorities", columns: ["label", "selected", "selectedPct", "score", "avgRank", "top1Pct", "top3Pct"].map((x) => ({ header: x, key: x })), rows: b.priorities },
        { name: "Belonging items", columns: ["id", "text", "n", "agreePct", "disagreePct", "mean"].map((x) => ({ header: x, key: x })), rows: b.likert },
      ].map((sh) => ({ ...sh, note: sh.note || `Among included survey respondents (n = ${b.n}). Cells under ${k} are suppressed.` })));
    }
    if (kind === "contacts.xlsx") {
      if (w.role !== "admin") throw new S.HttpError(403, "Contact exports need an administrator code.");
      log(); return sendXlsx(res, `followup-contacts-${stamp()}.xlsx`, [{ name: "Follow-up contacts", columns: ["contact_id", "submitted_on", "name", "email", "phone", "method", "interests", "availability", "language", "neighborhood", "accessibility", "status", "cohort", "staff_notes"].map((x) => ({ header: x, key: x, width: 20 })), rows: S.listContacts().map((c: any) => ({ ...c, interests: c.interests.join("; "), availability: c.availability.join("; ") })), note: "Confidential. Stored separately from survey answers; there is no link between these records and any response." }]);
    }
    throw new S.HttpError(404, "Unknown export");
  }));
}

/* ---------------- import helpers ---------------- */
const HOW: Record<string, string> = {
  single: "One code or its label.", likert: "One code or its label.", scale5: "One code or its label.", zip: "Five-digit ZIP code.",
  text: "Free text.", longtext: "Free text.", multi: "One or more codes or labels, separated by semicolons.",
  pick_rank: "Codes or labels in priority order, separated by semicolons (first = highest).", rank: "Codes or labels in rank order, separated by semicolons (first = highest).",
  text3: "Up to three answers, separated by semicolons.", assets: "Up to three organization names, separated by semicolons.",
};
type ICol = { key: string; header: string; q?: any; follow?: { qid: string; fid: string } ; meta?: "date" | "channel" };
function importColumns(): ICol[] {
  const cols: ICol[] = [{ key: "date", header: "date", meta: "date" }, { key: "channel", header: "channel", meta: "channel" }];
  for (const q of QUESTIONS) {
    cols.push({ key: q.id, header: `${q.id} ${q.label}`.replace(/\s+/g, " ").slice(0, 120), q });
    for (const f of q.followups || []) cols.push({ key: f.id, header: `${f.id} (other, please describe for ${q.id})`, follow: { qid: q.id, fid: f.id } });
  }
  return cols;
}
const norm = (s: any) => String(s ?? "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function mapHeaders(headers: string[]) {
  const cols = importColumns();
  return headers.map((h) => {
    const raw = String(h ?? "").trim(); const n = norm(raw);
    const idm = raw.match(/^([A-Za-z]+\d+[A-Za-z0-9_]*)/);
    let col = idm ? cols.find((c) => c.key.toLowerCase() === idm[1].toLowerCase()) : undefined;
    if (!col) col = cols.find((c) => norm(c.header) === n || (c.q && norm(c.q.label) === n) || c.key.toLowerCase() === n);
    return { header: raw, col };
  });
}
function codeFor(q: any, v: string): string | null {
  const t = String(v).trim(); if (!t) return null;
  const o = (q.options || []).find((o: any) => o.code.toLowerCase() === t.toLowerCase()) || (q.options || []).find((o: any) => norm(o.label) === norm(t));
  return o ? o.code : null;
}
function cellText(v: any): string {
  if (v == null) return ""; if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") { if ("text" in v) return String((v as any).text); if ("result" in v) return String((v as any).result ?? ""); if ("richText" in v) return (v as any).richText.map((x: any) => x.text).join(""); }
  return String(v);
}
function rowToAnswers(map: { header: string; col?: ICol }[], cells: any[]) {
  const answers: any = {}; const issues: string[] = []; let date: string | undefined; let channel = "";
  map.forEach((m, i) => {
    const c = m.col; if (!c) return; const v = cellText(cells[i]).trim(); if (!v) return;
    if (c.meta === "date") { const d = v.slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) date = d; else issues.push(`date: “${v}” isn’t YYYY-MM-DD, so the import date was used`); return; }
    if (c.meta === "channel") { channel = v.toLowerCase(); return; }
    if (c.follow) { answers[c.follow.fid] = v; return; }
    const q = c.q; const parts = v.split(/\s*[;|\n]\s*/).filter(Boolean);
    switch (q.type) {
      case "single": case "likert": case "scale5": { const code = codeFor(q, v); if (code) answers[q.id] = code; else issues.push(`${q.id}: “${v.slice(0, 40)}” isn’t one of the allowed answers`); break; }
      case "zip": answers[q.id] = v.replace(/\.0$/, "").padStart(5, "0"); break;
      case "text": case "longtext": answers[q.id] = v; break;
      case "multi": case "pick_rank": case "rank": { const codes: string[] = []; for (const p of parts) { const code = codeFor(q, p); if (code) codes.push(code); else issues.push(`${q.id}: “${p.slice(0, 40)}” isn’t one of the allowed answers`); } if (codes.length) answers[q.id] = codes; break; }
      case "text3": answers[q.id] = parts.slice(0, 3); break;
      case "assets": answers[q.id] = parts.slice(0, 3).map((name) => ({ name, type: null, age: null })); break;
    }
  });
  return { answers, date, channel, issues };
}
async function readTable(name: string, buf: Buffer): Promise<{ headers: string[]; rows: any[][] }> {
  if (/\.(csv|txt)$/i.test(name)) {
    const text = buf.toString("utf8").replace(/^\uFEFF/, "");
    const recs: string[][] = []; let row: string[] = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
      if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(f); recs.push(row); row = []; f = ""; } else f += ch;
    }
    if (f || row.length) { row.push(f); recs.push(row); }
    const [h = [], ...rest] = recs; return { headers: h.map((x) => x.trim()), rows: rest };
  }
  if (!/\.xlsx$/i.test(name)) throw new S.HttpError(415, "Upload an Excel (.xlsx) or CSV file.");
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(buf as any); } catch { throw new S.HttpError(422, "That Excel file couldn’t be opened. Save it as .xlsx and try again."); }
  const ws = wb.worksheets.find((w) => /response|data|survey/i.test(w.name)) || wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };
  const width = ws.columnCount; const all: any[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => { const a: any[] = []; for (let c = 1; c <= width; c++) a.push(r.getCell(c).value); all.push(a); });
  const [h = [], ...rest] = all; return { headers: h.map((x) => cellText(x).trim()), rows: rest };
}
