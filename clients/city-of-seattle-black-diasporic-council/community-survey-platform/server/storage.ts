import Database from "better-sqlite3";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { QUESTIONS, Q, LIKERT_ITEMS, suggestBd, DEFAULT_CODEBOOK, OPEN_TEXT_FIELDS, BD_GROUPS, SURVEY_VERSION, ORG_TYPES, geoOf, type BdCode } from "@shared/survey";
import { DEFAULT_BENCHMARKS, DEFAULT_FLOORS, DEFAULT_SETTINGS, DEFAULT_SOURCES } from "@shared/defaults";
import type { Resp, Settings } from "@shared/analytics";

const DB_FILE = process.env.SD_DB || "data.db";
export const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
/* Safety copy of the whole database on every startup, before anything else runs. Never modifies the live file. */
export const STARTUP_BACKUP = (() => {
  try {
    const has = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='respondents'").get();
    if (!has) return null;
    const dir = process.env.SD_BACKUP_DIR || "data/backups";
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `data-startup-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
    db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    const n = (new Database(file, { readonly: true }).prepare("SELECT COUNT(*) n FROM respondents").get() as any).n;
    const all = fs.readdirSync(dir).filter((f) => /^data-startup-.*\.db$/.test(f)).sort();
    for (const old of all.slice(0, Math.max(0, all.length - 30))) { try { fs.unlinkSync(path.join(dir, old)); } catch {} }
    console.log(`[backup] ${file} (${n} responses)`);
    return { file, responses: n, at: new Date().toISOString() };
  } catch (e: any) { console.error("[backup] failed:", e?.message); return { file: null, error: String(e?.message || e), at: new Date().toISOString() }; }
})();
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS channels (code TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, notes TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, created_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS survey_sessions (token TEXT PRIMARY KEY, started_on TEXT NOT NULL, channel TEXT, max_step INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS respondents (response_id TEXT PRIMARY KEY, seq INTEGER NOT NULL UNIQUE, submitted_at TEXT NOT NULL, submitted_on TEXT NOT NULL, survey_version TEXT NOT NULL, lang TEXT NOT NULL, channel TEXT, engagement_source TEXT NOT NULL DEFAULT 'survey', entry_mode TEXT NOT NULL DEFAULT 'online', entered_by TEXT, duration_sec INTEGER, status TEXT NOT NULL DEFAULT 'included', status_reason TEXT, quality_flags TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS raw_submissions (response_id TEXT PRIMARY KEY REFERENCES respondents(response_id), payload TEXT NOT NULL, sha256 TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS survey_answers (response_id TEXT NOT NULL REFERENCES respondents(response_id), question_id TEXT NOT NULL, value_code TEXT, value_text TEXT, value_num REAL, PRIMARY KEY (response_id, question_id));
CREATE TABLE IF NOT EXISTS respondent_identities (response_id TEXT NOT NULL REFERENCES respondents(response_id), identity_code TEXT NOT NULL, PRIMARY KEY (response_id, identity_code));
CREATE TABLE IF NOT EXISTS analytic_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, response_id TEXT NOT NULL REFERENCES respondents(response_id), bd_code TEXT NOT NULL, source TEXT NOT NULL, reason TEXT, status TEXT NOT NULL DEFAULT 'active', updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS likert_responses (response_id TEXT NOT NULL REFERENCES respondents(response_id), item_id TEXT NOT NULL, value INTEGER, label TEXT NOT NULL, PRIMARY KEY (response_id, item_id));
CREATE TABLE IF NOT EXISTS multi_selections (response_id TEXT NOT NULL REFERENCES respondents(response_id), question_id TEXT NOT NULL, option_code TEXT NOT NULL, PRIMARY KEY (response_id, question_id, option_code));
CREATE TABLE IF NOT EXISTS priority_rankings (response_id TEXT NOT NULL REFERENCES respondents(response_id), issue TEXT NOT NULL, rank INTEGER NOT NULL, PRIMARY KEY (response_id, issue));
CREATE TABLE IF NOT EXISTS barrier_rankings (response_id TEXT NOT NULL REFERENCES respondents(response_id), barrier TEXT NOT NULL, rank INTEGER NOT NULL, PRIMARY KEY (response_id, barrier));
CREATE TABLE IF NOT EXISTS community_organizations (org_id TEXT PRIMARY KEY, name TEXT NOT NULL, aliases TEXT, org_type TEXT, community_served TEXT, diaspora TEXT, neighborhood TEXT, website TEXT, age_status TEXT, validated INTEGER NOT NULL DEFAULT 0, notes TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS asset_mentions (id INTEGER PRIMARY KEY AUTOINCREMENT, response_id TEXT NOT NULL REFERENCES respondents(response_id), slot INTEGER NOT NULL, name_raw TEXT NOT NULL, name_norm TEXT NOT NULL, org_type TEXT, age_status TEXT, org_id TEXT REFERENCES community_organizations(org_id));
CREATE TABLE IF NOT EXISTS open_texts (text_id TEXT PRIMARY KEY, response_id TEXT NOT NULL REFERENCES respondents(response_id), question_id TEXT NOT NULL, text TEXT NOT NULL, flag TEXT NOT NULL DEFAULT 'review', reviewed_by TEXT, reviewed_at TEXT);
CREATE TABLE IF NOT EXISTS codebook (code TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, keywords TEXT, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS qualitative_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, text_id TEXT NOT NULL REFERENCES open_texts(text_id), theme_code TEXT NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, subtheme TEXT, sentiment TEXT, note TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(text_id, theme_code));
CREATE TABLE IF NOT EXISTS population_benchmarks (bd_code TEXT PRIMARY KEY, pct REAL NOT NULL, moe REAL, dataset TEXT, vintage TEXT, geography TEXT, tbl TEXT, variable TEXT, status TEXT NOT NULL, notes TEXT, oversample REAL NOT NULL DEFAULT 1, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS intersection_floors (key TEXT PRIMARY KEY, name TEXT NOT NULL, floor_min REAL NOT NULL, floor_max REAL, measure TEXT, notes TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS followup_contacts (contact_id TEXT PRIMARY KEY, submitted_on TEXT NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, method TEXT, interests TEXT NOT NULL DEFAULT '[]', availability TEXT NOT NULL DEFAULT '[]', language TEXT, identity TEXT NOT NULL DEFAULT '[]', neighborhood TEXT, accessibility TEXT, status TEXT NOT NULL DEFAULT 'new', cohort TEXT, staff_notes TEXT, consent INTEGER NOT NULL, updated_by TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS stakeholders (stakeholder_id TEXT PRIMARY KEY, name TEXT NOT NULL, stype TEXT, community TEXT, neighborhood TEXT, contact_status TEXT NOT NULL DEFAULT 'Not contacted', methods TEXT NOT NULL DEFAULT '[]', date_contacted TEXT, response TEXT, notes TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS engagement_events (event_id TEXT PRIMARY KEY, engagement_source TEXT NOT NULL, title TEXT NOT NULL, event_date TEXT, community TEXT, neighborhood TEXT, participants INTEGER, notes TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS governance_evidence (id TEXT PRIMARY KEY, dimension TEXT NOT NULL, pathway TEXT, evidence TEXT NOT NULL, source_type TEXT NOT NULL, strength TEXT NOT NULL, reference TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS research_sources (id TEXT PRIMARY KEY, title TEXT NOT NULL, publisher TEXT, url TEXT, dataset TEXT, vintage TEXT, used_for TEXT, figure TEXT, figure_type TEXT, notes TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS team_members (member_id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, org TEXT, role TEXT NOT NULL, code_hash TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, created_by TEXT NOT NULL, last_login TEXT);
CREATE TABLE IF NOT EXISTS import_batches (batch_id TEXT PRIMARY KEY, file_name TEXT NOT NULL, rows_total INTEGER NOT NULL, imported INTEGER NOT NULL, duplicates INTEGER NOT NULL, rejected INTEGER NOT NULL, channel TEXT, at TEXT NOT NULL, by TEXT NOT NULL, response_ids TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, role TEXT NOT NULL, action TEXT NOT NULL, entity TEXT, entity_id TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS ac_resp ON analytic_codes(response_id);
CREATE INDEX IF NOT EXISTS am_resp ON asset_mentions(response_id);
CREATE INDEX IF NOT EXISTS qc_text ON qualitative_codes(text_id);
`);

/* Additive migration: remember which response a survey session produced, so a retried submit is never counted twice. */
try { const cols = (db.prepare("PRAGMA table_info(survey_sessions)").all() as any[]).map((c) => c.name); if (!cols.includes("response_id")) db.exec("ALTER TABLE survey_sessions ADD COLUMN response_id TEXT"); } catch (e: any) { console.error("[migrate] survey_sessions.response_id:", e?.message); }
export const MIN_ONLINE_ANSWERS = 5;
class DuplicateSession extends Error { constructor(public rid: string) { super("duplicate session"); } }
export class HttpError extends Error { constructor(public status: number, message: string, public details?: any) { super(message); } }
const now = () => new Date().toISOString();
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
let version = 1; let cache: Resp[] | null = null;
export const dataVersion = () => version;
function bump() { version++; cache = null; }

export function audit(actor: string, role: string, action: string, entity?: string, entityId?: string, detail?: any) {
  db.prepare("INSERT INTO audit_log (at, actor, role, action, entity, entity_id, detail) VALUES (?,?,?,?,?,?,?)").run(now(), actor, role, action, entity || null, entityId || null, detail == null ? null : typeof detail === "string" ? detail : JSON.stringify(detail));
}

/* ---------------- first-run defaults ---------------- */
(function init() {
  const has = (t: string) => (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as any).n > 0;
  const at = now();
  db.transaction(() => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) db.prepare("INSERT OR IGNORE INTO settings (k, v) VALUES (?,?)").run(k, JSON.stringify(v));
    if (!has("codebook")) for (const c of DEFAULT_CODEBOOK) db.prepare("INSERT INTO codebook (code, name, keywords) VALUES (?,?,?)").run(c.code, c.name, c.keywords);
    if (!has("population_benchmarks")) for (const b of DEFAULT_BENCHMARKS) db.prepare("INSERT INTO population_benchmarks (bd_code, pct, moe, dataset, vintage, geography, tbl, variable, status, notes, oversample, updated_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(b.bd_code, b.pct, b.moe, b.dataset, b.vintage, b.geography, b.tbl, b.variable, b.status, b.notes, b.oversample, "Initial setup", at);
    if (!has("intersection_floors")) for (const f of DEFAULT_FLOORS) db.prepare("INSERT INTO intersection_floors (key, name, floor_min, floor_max, measure, notes, updated_by, updated_at) VALUES (?,?,?,?,?,?,?,?)").run(f.key, f.name, f.floor_min, f.floor_max, f.measure, f.notes, "Initial setup", at);
    if (!has("research_sources")) for (const s of DEFAULT_SOURCES) db.prepare("INSERT INTO research_sources (id, title, publisher, url, dataset, vintage, used_for, figure, figure_type, notes, updated_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(s.id, s.title, s.publisher, s.url, s.dataset, s.vintage, s.used_for, s.figure, s.figure_type, s.notes, "Initial setup", at);
    if (!has("channels")) db.prepare("INSERT INTO channels (code, name, kind, notes, created_at, created_by) VALUES (?,?,?,?,?,?)").run("web", "Main survey link", "Online", "Default link shared publicly", at, "Initial setup");
  })();
})();

export function getSettings(): Settings {
  const rows = db.prepare("SELECT k, v FROM settings").all() as any[];
  const s: any = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.k] = JSON.parse(r.v);
  return s;
}
export function setSettings(patch: Partial<Settings>, actor: string, role: string) {
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const before = getSettings();
  db.transaction(() => {
    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.includes(k)) continue;
      db.prepare("INSERT INTO settings (k, v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(k, JSON.stringify(v));
    }
  })();
  const changed = Object.fromEntries(Object.entries(patch).filter(([k, v]) => allowed.includes(k) && JSON.stringify((before as any)[k]) !== JSON.stringify(v)).map(([k, v]) => [k, { from: (before as any)[k], to: v }]));
  if (Object.keys(changed).length) audit(actor, role, "settings.update", "settings", undefined, changed);
  bump();
  return getSettings();
}

/* ---------------- sessions (completion metrics; no personal data) ---------------- */
export function startSession(channel: string | null) {
  const token = crypto.randomBytes(16).toString("hex");
  db.prepare("INSERT INTO survey_sessions (token, started_on, channel) VALUES (?,?,?)").run(token, today(), channel);
  return token;
}
export function progressSession(token: string, step: number) {
  db.prepare("UPDATE survey_sessions SET max_step = MAX(max_step, ?) WHERE token=? AND completed=0").run(Math.max(0, Math.min(7, step | 0)), token);
}
export function sessionStats() {
  const rows = db.prepare("SELECT max_step, completed, COUNT(*) n FROM survey_sessions GROUP BY max_step, completed").all() as any[];
  const started = rows.reduce((a, r) => a + r.n, 0);
  const completed = rows.filter((r) => r.completed).reduce((a, r) => a + r.n, 0);
  const reached = Array.from({ length: 7 }, (_, i) => rows.filter((r) => r.completed || r.max_step >= i).reduce((a, r) => a + r.n, 0));
  return { started, completed, reached };
}

/* ---------------- submission ---------------- */
const MAXLEN = 2000;
const clean = (v: any, max = MAXLEN) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");
export const normName = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[’'`.]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\b(the|of|seattle)\b/g, " ").replace(/\s+/g, " ").trim();

/** Validate a raw survey payload against the instrument. Unknown keys and invalid codes are dropped, never guessed. */
export function validatePayload(a: any) {
  const errors: Record<string, string> = {};
  const out: any = {};
  const valid = (qid: string, c: any) => typeof c === "string" && !!Q[qid].options?.some((o) => o.code === c);
  for (const q of QUESTIONS) {
    const v = a?.[q.id];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    switch (q.type) {
      case "single": case "likert": case "scale5": if (valid(q.id, v)) out[q.id] = v; else errors[q.id] = "Not a valid choice"; break;
      case "zip": { const z = clean(v, 10); if (/^\d{5}$/.test(z)) out[q.id] = z; else errors[q.id] = "Enter a five-digit ZIP code"; break; }
      case "text": case "longtext": { const t = clean(v); if (t) out[q.id] = t; break; }
      case "multi": {
        let arr = Array.isArray(v) ? [...new Set(v.filter((c: any) => valid(q.id, c)))] as string[] : [];
        const excl = q.options!.filter((o) => o.exclusive).map((o) => o.code);
        if (arr.some((c) => excl.includes(c)) && arr.length > 1) { errors[q.id] = "“None” can’t be combined with other choices"; arr = arr.filter((c) => excl.includes(c)); }
        if (arr.length) out[q.id] = arr; break;
      }
      case "pick_rank": case "rank": {
        const arr = Array.isArray(v) ? [...new Set(v.filter((c: any) => valid(q.id, c)))] as string[] : [];
        if (q.max && arr.length > q.max) { errors[q.id] = `Choose up to ${q.max}`; break; }
        if (arr.length) out[q.id] = arr; break;
      }
      case "text3": { const arr = (Array.isArray(v) ? v : []).slice(0, 3).map((t: any) => clean(t)); if (arr.some(Boolean)) out[q.id] = arr; break; }
      case "assets": {
        const arr = (Array.isArray(v) ? v : []).slice(0, 3).map((x: any) => ({ name: clean(x?.name, 160), type: ORG_TYPES.includes(x?.type) ? x.type : null, age: ["new", "established", "unsure"].includes(x?.age) ? x.age : null })).filter((x: any) => x.name);
        if (arr.length) out[q.id] = arr; break;
      }
    }
    for (const f of q.followups || []) {
      const sel = Array.isArray(out[q.id]) ? out[q.id].includes(f.when) : out[q.id] === f.when;
      const t = clean(a?.[f.id], 300);
      if (sel && t) out[f.id] = t;
    }
  }
  return { answers: out, errors };
}

function qualityFlags(ans: any, duration: number | null) {
  const f: string[] = [];
  if (duration != null && duration < 120) f.push("fast");
  const lk = LIKERT_ITEMS.map((l) => ans[l.id]).filter((v) => v && v !== "na");
  if (lk.length === 12 && new Set(lk).size === 1) f.push("straight_line");
  const answered = QUESTIONS.filter((q) => ans[q.id] != null).length;
  if (answered < 5) f.push("sparse");
  return f;
}

function nextSeq(table: string, col: string, prefix: string, width: number) {
  const rows = db.prepare(`SELECT ${col} id FROM ${table}`).all() as any[];
  const max = rows.reduce((m, r) => Math.max(m, Number(String(r.id).replace(prefix, "")) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}

export function submitSurvey(body: any, opts: { entryMode: "online" | "staff_entry" | "import"; enteredBy?: string; role?: string; date?: string }) {
  const { answers, errors } = validatePayload(body?.answers || {});
  if (Object.keys(errors).length) throw new HttpError(422, "Some answers need attention", errors);
  const s = getSettings();
  if (opts.entryMode === "online" && s.survey_status !== "open") throw new HttpError(403, "This survey is not accepting responses right now.");
  const token = clean(body?.token, 64);
  const sess = token ? (db.prepare("SELECT * FROM survey_sessions WHERE token=?").get(token) as any) : null;
  // Same session token sent again (e.g. the connection dropped after saving): return the original receipt, never a second record.
  if (opts.entryMode === "online" && sess?.completed) return { responseId: sess.response_id || "received", duplicate: true };
  const answeredCount = QUESTIONS.filter((q) => answers[q.id] != null).length;
  const minAnswers = opts.entryMode === "online" ? MIN_ONLINE_ANSWERS : 1;
  if (answeredCount < minAnswers) throw new HttpError(422, opts.entryMode === "online" ? `Please answer at least ${MIN_ONLINE_ANSWERS} questions before submitting. You've answered ${answeredCount}.` : "This entry has no answers. Enter at least one answer before saving.");
  const channelRaw = clean(body?.channel, 40).toLowerCase();
  const channel = (db.prepare("SELECT code FROM channels WHERE code=?").get(channelRaw) as any)?.code || (opts.entryMode === "staff_entry" ? "paper" : opts.entryMode === "import" ? "import" : "web");
  const startedMs = Number(body?.startedAt);
  const duration = Number.isFinite(startedMs) && startedMs > 0 ? Math.max(0, Math.round((Date.now() - startedMs) / 1000)) : null;
  const flags = qualityFlags(answers, opts.entryMode === "online" ? duration : null);
  const at = now();
  let rid = "";
  const raw = JSON.stringify({ answers: body?.answers || {}, channel: channelRaw || null, surveyVersion: SURVEY_VERSION });
  const sha = crypto.createHash("sha256").update(raw).digest("hex");
  if (opts.entryMode === "import" && db.prepare("SELECT 1 FROM raw_submissions WHERE sha256=?").get(sha)) throw new HttpError(409, "Duplicate of a response already in the platform");
  const day = opts.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date) ? opts.date : today();
  try { db.transaction(() => {
    const seqRow = db.prepare("SELECT COALESCE(MAX(seq),0)+1 s FROM respondents").get() as any;
    const seq = seqRow.s; rid = `R-${String(seq).padStart(5, "0")}`;
    db.prepare("INSERT INTO respondents (response_id, seq, submitted_at, submitted_on, survey_version, lang, channel, engagement_source, entry_mode, entered_by, duration_sec, quality_flags) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(rid, seq, at, day, SURVEY_VERSION, "en", channel, opts.entryMode === "import" ? "import" : "survey", opts.entryMode, opts.enteredBy || null, opts.entryMode === "online" ? duration : null, JSON.stringify(flags));
    db.prepare("INSERT INTO raw_submissions (response_id, payload, sha256) VALUES (?,?,?)").run(rid, raw, sha);
    writeDerived(rid, answers, opts.enteredBy ? `${opts.enteredBy}` : "Survey intake");
    if (sess) {
      const again = db.prepare("SELECT completed, response_id FROM survey_sessions WHERE token=?").get(token) as any;
      if (opts.entryMode === "online" && again?.completed) throw new DuplicateSession(again.response_id || "received");
      db.prepare("UPDATE survey_sessions SET completed=1, max_step=7, response_id=? WHERE token=?").run(rid, token);
    }
  })(); } catch (e) { if (e instanceof DuplicateSession) return { responseId: e.rid, duplicate: true }; throw e; }
  if (opts.entryMode === "staff_entry") audit(opts.enteredBy || "Staff", opts.role || "staff", "response.enter_paper", "respondents", rid);
  bump();
  return { responseId: rid };
}

/** Normalized tables derived from validated answers. Raw payload is stored separately and never rewritten. */
function writeDerived(rid: string, ans: any, by: string) {
  const at = now();
  const insA = db.prepare("INSERT INTO survey_answers (response_id, question_id, value_code, value_text, value_num) VALUES (?,?,?,?,?)");
  for (const q of QUESTIONS) {
    const v = ans[q.id];
    if (v == null) continue;
    if (q.type === "single" || q.type === "scale5") insA.run(rid, q.id, v, null, /^\d$/.test(v) ? Number(v) : null);
    else if (q.type === "zip") insA.run(rid, q.id, v, null, null);
    else if (q.type === "text" || q.type === "longtext") insA.run(rid, q.id, null, v, null);
    else if (q.type === "likert") db.prepare("INSERT INTO likert_responses (response_id, item_id, value, label) VALUES (?,?,?,?)").run(rid, q.id, v === "na" ? null : Number(v), q.options!.find((o) => o.code === v)!.label);
    else if (q.type === "multi") {
      if (q.id === "Q04") for (const c of v) db.prepare("INSERT INTO respondent_identities (response_id, identity_code) VALUES (?,?)").run(rid, c);
      else for (const c of v) db.prepare("INSERT INTO multi_selections (response_id, question_id, option_code) VALUES (?,?,?)").run(rid, q.id, c);
    } else if (q.type === "pick_rank") v.forEach((c: string, i: number) => db.prepare("INSERT INTO priority_rankings (response_id, issue, rank) VALUES (?,?,?)").run(rid, c, i + 1));
    else if (q.type === "rank") v.forEach((c: string, i: number) => db.prepare("INSERT INTO barrier_rankings (response_id, barrier, rank) VALUES (?,?,?)").run(rid, c, i + 1));
    else if (q.type === "text3") v.forEach((t: string, i: number) => t && insA.run(rid, `${q.id}_${i + 1}`, null, t, null));
    else if (q.type === "assets") v.forEach((x: any, i: number) => {
      const norm = normName(x.name);
      const org = findOrgByNorm(norm);
      db.prepare("INSERT INTO asset_mentions (response_id, slot, name_raw, name_norm, org_type, age_status, org_id) VALUES (?,?,?,?,?,?,?)").run(rid, i + 1, x.name, norm, x.type, x.age, org);
    });
    for (const f of q.followups || []) if (ans[f.id]) insA.run(rid, f.id, null, ans[f.id], null);
  }
  // analytical classification (rule-based suggestion; raw self-identification kept untouched)
  const sugg = suggestBd(ans.Q04 || [], { african: ans.Q04_african, caribbean: ans.Q04_caribbean, latino: ans.Q04_latino, other: ans.Q04_other, heritage: ans.Q06 });
  for (const s of sugg) db.prepare("INSERT INTO analytic_codes (response_id, bd_code, source, reason, status, updated_by, updated_at) VALUES (?,?,?,?,?,?,?)").run(rid, s.code, "rule", s.reason, "active", "Classification rules", at);
  // open text into the review queue, with keyword suggestions (clearly marked; never approved automatically)
  const themes = db.prepare("SELECT code, keywords FROM codebook WHERE active=1").all() as any[];
  for (const f of OPEN_TEXT_FIELDS) {
    const t = f.id.startsWith("Q24_") ? ans.Q24?.[Number(f.id.slice(4)) - 1] : ans[f.id];
    if (!t) continue;
    const tid = `${rid}-${f.id}`;
    db.prepare("INSERT INTO open_texts (text_id, response_id, question_id, text) VALUES (?,?,?,?)").run(tid, rid, f.id, t);
    if (f.kind === "identity") continue;
    const low = t.toLowerCase();
    for (const th of themes) {
      const kws = String(th.keywords || "").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      if (kws.some((k) => low.includes(k))) db.prepare("INSERT OR IGNORE INTO qualitative_codes (text_id, theme_code, source, status, updated_by, updated_at) VALUES (?,?,?,?,?,?)").run(tid, th.code, "keyword", "suggested", "Keyword suggestion", at);
    }
  }
}

/* ---------------- read model for analytics ---------------- */
export function allResponses(): Resp[] {
  if (cache) return cache;
  const rs = db.prepare("SELECT * FROM respondents ORDER BY seq").all() as any[];
  const by = <T,>(sql: string) => { const m = new Map<string, T[]>(); for (const r of db.prepare(sql).all() as any[]) { if (!m.has(r.response_id)) m.set(r.response_id, []); m.get(r.response_id)!.push(r); } return m; };
  const answers = by<any>("SELECT * FROM survey_answers");
  const ids = by<any>("SELECT * FROM respondent_identities");
  const codes = by<any>("SELECT * FROM analytic_codes WHERE status='active'");
  const lik = by<any>("SELECT * FROM likert_responses");
  const multi = by<any>("SELECT * FROM multi_selections");
  const pr = by<any>("SELECT * FROM priority_rankings ORDER BY rank");
  const br = by<any>("SELECT * FROM barrier_rankings ORDER BY rank");
  const am = by<any>("SELECT * FROM asset_mentions ORDER BY slot");
  cache = rs.map((r) => {
    const a: Record<string, any> = {};
    for (const x of answers.get(r.response_id) || []) a[x.question_id] = x.value_code ?? x.value_text;
    const m: Record<string, string[]> = {};
    for (const x of multi.get(r.response_id) || []) (m[x.question_id] ||= []).push(x.option_code);
    const geo = geoOf(a.Q03);
    const bd = [...new Set((codes.get(r.response_id) || []).map((c) => c.bd_code))];
    return {
      rid: r.response_id, date: r.submitted_on, channel: r.channel, source: r.engagement_source, entryMode: r.entry_mode, status: r.status, flags: JSON.parse(r.quality_flags),
      duration: r.duration_sec,
      age: a.Q01 || null, gender: a.Q02 || null, zip: a.Q03 || null, area: geo.area, sector: geo.sector, cd: geo.cd, tenure: a.Q05 || null,
      identity: (ids.get(r.response_id) || []).map((x) => x.identity_code), bd: bd.filter((c) => c !== "REVIEW") as BdCode[], bdReview: bd.includes("REVIEW"),
      likert: Object.fromEntries((lik.get(r.response_id) || []).map((x) => [x.item_id, x.value])),
      multi: m, single: a,
      priorities: (pr.get(r.response_id) || []).map((x) => ({ issue: x.issue, rank: x.rank })),
      barriers: (br.get(r.response_id) || []).map((x) => ({ barrier: x.barrier, rank: x.rank })),
      assets: (am.get(r.response_id) || []).map((x) => ({ name: x.name_raw, norm: x.name_norm, type: x.org_type, age: x.age_status, orgId: x.org_id })),
    } as Resp;
  });
  return cache;
}

export function responseDetail(rid: string) {
  const r = db.prepare("SELECT * FROM respondents WHERE response_id=?").get(rid) as any;
  if (!r) throw new HttpError(404, "Response not found");
  const raw = db.prepare("SELECT payload, sha256 FROM raw_submissions WHERE response_id=?").get(rid) as any;
  const codes = db.prepare("SELECT * FROM analytic_codes WHERE response_id=? ORDER BY id").all(rid);
  const texts = db.prepare("SELECT * FROM open_texts WHERE response_id=?").all(rid);
  const resp = allResponses().find((x) => x.rid === rid);
  return { meta: { ...r, quality_flags: JSON.parse(r.quality_flags) }, raw: JSON.parse(raw.payload), rawSha256: raw.sha256, codes, texts, resp };
}

export function setResponseStatus(rid: string, status: "included" | "excluded", reason: string, actor: string, role: string) {
  const r = db.prepare("SELECT status FROM respondents WHERE response_id=?").get(rid) as any;
  if (!r) throw new HttpError(404, "Response not found");
  if (status === "excluded" && !reason.trim()) throw new HttpError(422, "A reason is required to exclude a response");
  db.prepare("UPDATE respondents SET status=?, status_reason=? WHERE response_id=?").run(status, reason.trim() || null, rid);
  audit(actor, role, `response.${status === "excluded" ? "exclude" : "include"}`, "respondents", rid, { from: r.status, to: status, reason });
  bump();
}

export function setBdCodes(rid: string, codes: string[], note: string, actor: string, role: string) {
  const valid = new Set(BD_GROUPS.map((g) => g.code));
  const next = [...new Set(codes.filter((c) => valid.has(c as BdCode)))];
  const cur = (db.prepare("SELECT bd_code FROM analytic_codes WHERE response_id=? AND status='active'").all(rid) as any[]).map((r) => r.bd_code);
  if (!db.prepare("SELECT 1 FROM respondents WHERE response_id=?").get(rid)) throw new HttpError(404, "Response not found");
  const at = now();
  db.transaction(() => {
    db.prepare("UPDATE analytic_codes SET status='removed', updated_by=?, updated_at=? WHERE response_id=? AND status='active'").run(actor, at, rid);
    for (const c of next) db.prepare("INSERT INTO analytic_codes (response_id, bd_code, source, reason, status, updated_by, updated_at) VALUES (?,?,?,?,?,?,?)").run(rid, c, "analyst", note || "Analyst review", "active", actor, at);
  })();
  audit(actor, role, "classification.update", "respondents", rid, { from: cur, to: next, note });
  bump();
}

/* ---------------- qualitative ---------------- */
export function listTexts(f: { q?: string; field?: string; flag?: string; status?: string }) {
  const texts = db.prepare("SELECT t.*, r.status resp_status FROM open_texts t JOIN respondents r ON r.response_id=t.response_id ORDER BY t.text_id").all() as any[];
  const codes = db.prepare("SELECT * FROM qualitative_codes").all() as any[];
  const byT = new Map<string, any[]>();
  for (const c of codes) { if (!byT.has(c.text_id)) byT.set(c.text_id, []); byT.get(c.text_id)!.push(c); }
  return texts.map((t) => ({ ...t, codes: byT.get(t.text_id) || [] }))
    .filter((t) => (!f.field || f.field === "all" || t.question_id.startsWith(f.field)) && (!f.flag || f.flag === "all" || t.flag === f.flag) && (!f.q || t.text.toLowerCase().includes(f.q.toLowerCase()))
      && (!f.status || f.status === "all" || (f.status === "uncoded" ? !t.codes.some((c: any) => c.status === "approved") : f.status === "suggested" ? t.codes.some((c: any) => c.status === "suggested") : t.codes.some((c: any) => c.status === "approved"))));
}
export function codeText(textId: string, theme: string, status: "approved" | "rejected" | "suggested" | "remove", actor: string, role: string, extra: { subtheme?: string; sentiment?: string; note?: string } = {}) {
  if (!db.prepare("SELECT 1 FROM open_texts WHERE text_id=?").get(textId)) throw new HttpError(404, "Text not found");
  if (!db.prepare("SELECT 1 FROM codebook WHERE code=?").get(theme)) throw new HttpError(422, "Unknown theme");
  const cur = db.prepare("SELECT * FROM qualitative_codes WHERE text_id=? AND theme_code=?").get(textId, theme) as any;
  if (status === "remove") { if (cur) db.prepare("DELETE FROM qualitative_codes WHERE id=?").run(cur.id); }
  else if (cur) db.prepare("UPDATE qualitative_codes SET status=?, subtheme=COALESCE(?, subtheme), sentiment=COALESCE(?, sentiment), note=COALESCE(?, note), updated_by=?, updated_at=? WHERE id=?").run(status, extra.subtheme ?? null, extra.sentiment ?? null, extra.note ?? null, actor, now(), cur.id);
  else db.prepare("INSERT INTO qualitative_codes (text_id, theme_code, source, status, subtheme, sentiment, note, updated_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(textId, theme, "analyst", status, extra.subtheme || null, extra.sentiment || null, extra.note || null, actor, now());
  audit(actor, role, `theme.${status}`, "open_texts", textId, { theme, prior: cur?.status || null, source: cur?.source || "analyst" });
  bump();
}
export function flagText(textId: string, flag: string, actor: string, role: string) {
  if (!["review", "internal", "aggregate"].includes(flag)) throw new HttpError(422, "Unknown flag");
  const cur = db.prepare("SELECT flag FROM open_texts WHERE text_id=?").get(textId) as any;
  if (!cur) throw new HttpError(404, "Text not found");
  db.prepare("UPDATE open_texts SET flag=?, reviewed_by=?, reviewed_at=? WHERE text_id=?").run(flag, actor, now(), textId);
  audit(actor, role, "quote.flag", "open_texts", textId, { from: cur.flag, to: flag });
  bump();
}
export const listCodebook = () => db.prepare("SELECT * FROM codebook ORDER BY code").all();
export function upsertTheme(t: any, actor: string, role: string) {
  const name = clean(t?.name, 80); if (!name) throw new HttpError(422, "Theme name is required");
  let code = clean(t?.code, 20).toUpperCase();
  const exists = code && db.prepare("SELECT 1 FROM codebook WHERE code=?").get(code);
  if (!exists) code = nextSeq("codebook", "code", "TH-", 3).replace(/^TH-0*/, "TH-N");
  if (exists) db.prepare("UPDATE codebook SET name=?, description=?, keywords=?, active=? WHERE code=?").run(name, clean(t.description, 400) || null, clean(t.keywords, 600) || null, t.active === false ? 0 : 1, code);
  else db.prepare("INSERT INTO codebook (code, name, description, keywords, active) VALUES (?,?,?,?,1)").run(code, name, clean(t.description, 400) || null, clean(t.keywords, 600) || null);
  audit(actor, role, exists ? "codebook.update" : "codebook.add", "codebook", code, { name });
  bump();
  return code;
}

/* ---------------- organizations & mentions ---------------- */
function findOrgByNorm(norm: string): string | null {
  if (!norm) return null;
  const orgs = db.prepare("SELECT org_id, name, aliases FROM community_organizations").all() as any[];
  for (const o of orgs) {
    const names = [o.name, ...String(o.aliases || "").split(",")].map((s) => normName(s)).filter(Boolean);
    if (names.includes(norm)) return o.org_id;
  }
  return null;
}
export const listOrgs = () => db.prepare("SELECT * FROM community_organizations ORDER BY name").all();
export function upsertOrg(o: any, actor: string, role: string) {
  const name = clean(o?.name, 160); if (!name) throw new HttpError(422, "Organization name is required");
  const id = o.org_id && db.prepare("SELECT 1 FROM community_organizations WHERE org_id=?").get(o.org_id) ? o.org_id : nextSeq("community_organizations", "org_id", "ORG-", 4);
  const exists = id === o.org_id;
  const vals = [name, clean(o.aliases, 400) || null, ORG_TYPES.includes(o.org_type) ? o.org_type : null, clean(o.community_served, 200) || null, clean(o.diaspora, 200) || null, clean(o.neighborhood, 120) || null, clean(o.website, 200) || null, ["new", "established", "unsure"].includes(o.age_status) ? o.age_status : null, o.validated ? 1 : 0, clean(o.notes, 1000) || null, actor, now()];
  if (exists) db.prepare("UPDATE community_organizations SET name=?, aliases=?, org_type=?, community_served=?, diaspora=?, neighborhood=?, website=?, age_status=?, validated=?, notes=?, updated_by=?, updated_at=? WHERE org_id=?").run(...vals, id);
  else db.prepare("INSERT INTO community_organizations (name, aliases, org_type, community_served, diaspora, neighborhood, website, age_status, validated, notes, updated_by, updated_at, org_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(...vals, id);
  // re-link mentions to directory entries by exact normalized name or alias
  const mentions = db.prepare("SELECT id, name_norm FROM asset_mentions").all() as any[];
  for (const m of mentions) db.prepare("UPDATE asset_mentions SET org_id=? WHERE id=?").run(findOrgByNorm(m.name_norm), m.id);
  audit(actor, role, exists ? "org.update" : "org.add", "community_organizations", id, { name, validated: !!o.validated });
  bump();
  return id;
}
export function deleteOrg(id: string, actor: string, role: string) {
  const o = db.prepare("SELECT name FROM community_organizations WHERE org_id=?").get(id) as any;
  if (!o) throw new HttpError(404, "Organization not found");
  db.transaction(() => { db.prepare("UPDATE asset_mentions SET org_id=NULL WHERE org_id=?").run(id); db.prepare("DELETE FROM community_organizations WHERE org_id=?").run(id); })();
  audit(actor, role, "org.delete", "community_organizations", id, { name: o.name });
  bump();
}

/* ---------------- generic admin tables ---------------- */
type TableDef = { table: string; key: string; prefix: string; width: number; fields: Record<string, "text" | "int" | "json" | "real" | "bool"> ; required: string[]; label: string };
export const TABLES: Record<string, TableDef> = {
  stakeholders: { table: "stakeholders", key: "stakeholder_id", prefix: "S-", width: 4, label: "Stakeholder", required: ["name"], fields: { name: "text", stype: "text", community: "text", neighborhood: "text", contact_status: "text", methods: "json", date_contacted: "text", response: "text", notes: "text" } },
  events: { table: "engagement_events", key: "event_id", prefix: "E-", width: 4, label: "Engagement activity", required: ["title", "engagement_source"], fields: { engagement_source: "text", title: "text", event_date: "text", community: "text", neighborhood: "text", participants: "int", notes: "text" } },
  governance: { table: "governance_evidence", key: "id", prefix: "G-", width: 4, label: "Evidence note", required: ["dimension", "evidence", "source_type", "strength"], fields: { dimension: "text", pathway: "text", evidence: "text", source_type: "text", strength: "text", reference: "text" } },
  sources: { table: "research_sources", key: "id", prefix: "SRC-", width: 3, label: "Research source", required: ["title"], fields: { title: "text", publisher: "text", url: "text", dataset: "text", vintage: "text", used_for: "text", figure: "text", figure_type: "text", notes: "text" } },
};
export function listTable(t: string) {
  const d = TABLES[t]; if (!d) throw new HttpError(404, "Unknown table");
  return (db.prepare(`SELECT * FROM ${d.table} ORDER BY ${d.key}`).all() as any[]).map((r) => { for (const [f, ty] of Object.entries(d.fields)) if (ty === "json") r[f] = JSON.parse(r[f] || "[]"); return r; });
}
export function upsertRow(t: string, body: any, actor: string, role: string) {
  const d = TABLES[t]; if (!d) throw new HttpError(404, "Unknown table");
  const errors: Record<string, string> = {};
  const vals: Record<string, any> = {};
  for (const [f, ty] of Object.entries(d.fields)) {
    const v = body?.[f];
    if (ty === "json") vals[f] = JSON.stringify(Array.isArray(v) ? v.map((x: any) => clean(String(x), 80)).filter(Boolean) : []);
    else if (ty === "int") vals[f] = v === "" || v == null ? null : Number.isInteger(Number(v)) && Number(v) >= 0 ? Number(v) : (errors[f] = "Whole number", null);
    else vals[f] = clean(v ?? "", 2000) || null;
    if (d.required.includes(f) && (vals[f] == null || vals[f] === "[]")) errors[f] = "Required";
  }
  if (t === "stakeholders" && !vals.contact_status) vals.contact_status = "Not contacted";
  if (vals.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(vals.event_date)) errors.event_date = "Use YYYY-MM-DD";
  if (vals.date_contacted && !/^\d{4}-\d{2}-\d{2}$/.test(vals.date_contacted)) errors.date_contacted = "Use YYYY-MM-DD";
  if (Object.keys(errors).length) throw new HttpError(422, "Please fix the highlighted fields", errors);
  const id = body?.[d.key] && db.prepare(`SELECT 1 FROM ${d.table} WHERE ${d.key}=?`).get(body[d.key]) ? body[d.key] : nextSeq(d.table, d.key, d.prefix, d.width);
  const exists = id === body?.[d.key];
  const cols = Object.keys(d.fields);
  if (exists) db.prepare(`UPDATE ${d.table} SET ${cols.map((c) => `${c}=?`).join(", ")}, updated_by=?, updated_at=? WHERE ${d.key}=?`).run(...cols.map((c) => vals[c]), actor, now(), id);
  else db.prepare(`INSERT INTO ${d.table} (${d.key}, ${cols.join(", ")}, updated_by, updated_at) VALUES (?, ${cols.map(() => "?").join(", ")}, ?, ?)`).run(id, ...cols.map((c) => vals[c]), actor, now());
  audit(actor, role, `${t}.${exists ? "update" : "add"}`, d.table, id, vals.name || vals.title || vals.dimension);
  bump();
  return id;
}
export function deleteRow(t: string, id: string, actor: string, role: string) {
  const d = TABLES[t]; if (!d) throw new HttpError(404, "Unknown table");
  const r = db.prepare(`SELECT * FROM ${d.table} WHERE ${d.key}=?`).get(id); if (!r) throw new HttpError(404, "Not found");
  db.prepare(`DELETE FROM ${d.table} WHERE ${d.key}=?`).run(id);
  audit(actor, role, `${t}.delete`, d.table, id, r);
  bump();
}

/* ---------------- benchmarks & floors ---------------- */
export const listBenchmarks = () => db.prepare("SELECT * FROM population_benchmarks ORDER BY bd_code").all() as any[];
export function saveBenchmarks(rows: any[], actor: string, role: string) {
  const errors: Record<string, string> = {};
  for (const r of rows) {
    if (!BD_GROUPS.some((g) => g.code === r.bd_code)) errors[r.bd_code] = "Unknown group";
    if (!(Number(r.pct) >= 0 && Number(r.pct) <= 100)) errors[`${r.bd_code}.pct`] = "0–100";
    if (!(Number(r.oversample) > 0 && Number(r.oversample) <= 5)) errors[`${r.bd_code}.oversample`] = "Between 0 and 5";
  }
  if (Object.keys(errors).length) throw new HttpError(422, "Please fix the highlighted values", errors);
  const before = listBenchmarks();
  db.transaction(() => {
    for (const r of rows) db.prepare("UPDATE population_benchmarks SET pct=?, moe=?, dataset=?, vintage=?, geography=?, tbl=?, variable=?, status=?, notes=?, oversample=?, updated_by=?, updated_at=? WHERE bd_code=?")
      .run(Number(r.pct), r.moe === "" || r.moe == null ? null : Number(r.moe), clean(r.dataset, 200) || null, clean(r.vintage, 40) || null, clean(r.geography, 120) || null, clean(r.tbl, 40) || null, clean(r.variable, 80) || null, clean(r.status, 60) || "Working baseline", clean(r.notes, 1000) || null, Number(r.oversample), actor, now(), r.bd_code);
  })();
  audit(actor, role, "benchmarks.update", "population_benchmarks", undefined, { before: before.map((b) => [b.bd_code, b.pct, b.oversample]), after: rows.map((b) => [b.bd_code, Number(b.pct), Number(b.oversample)]) });
  bump();
}
export const listFloors = () => db.prepare("SELECT * FROM intersection_floors").all() as any[];
export function saveFloors(rows: any[], actor: string, role: string) {
  db.transaction(() => { for (const r of rows) db.prepare("UPDATE intersection_floors SET floor_min=?, floor_max=?, notes=?, updated_by=?, updated_at=? WHERE key=?").run(Number(r.floor_min), r.floor_max === "" || r.floor_max == null ? null : Number(r.floor_max), clean(r.notes, 500) || null, actor, now(), r.key); })();
  audit(actor, role, "floors.update", "intersection_floors", undefined, rows.map((r) => [r.key, r.floor_min, r.floor_max]));
  bump();
}

/* ---------------- channels ---------------- */
export const listChannels = () => db.prepare("SELECT * FROM channels ORDER BY created_at").all() as any[];
export function addChannel(c: any, actor: string, role: string) {
  const name = clean(c?.name, 80); if (!name) throw new HttpError(422, "Give the link a name");
  let code = clean(c?.code || name, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  if (!code) throw new HttpError(422, "Invalid code");
  if (db.prepare("SELECT 1 FROM channels WHERE code=?").get(code)) code = `${code}-${crypto.randomBytes(2).toString("hex")}`;
  db.prepare("INSERT INTO channels (code, name, kind, notes, created_at, created_by) VALUES (?,?,?,?,?,?)").run(code, name, clean(c.kind, 40) || "Online", clean(c.notes, 300) || null, now(), actor);
  audit(actor, role, "channel.add", "channels", code, name);
  bump();
  return code;
}

/* ---------------- follow-up contacts (separate from survey answers) ---------------- */
export function submitContact(b: any) {
  const errors: Record<string, string> = {};
  const name = clean(b?.name, 120), email = clean(b?.email, 160).toLowerCase(), phone = clean(b?.phone, 40);
  if (!name) errors.name = "Please tell us what to call you";
  if (!email && !phone) errors.email = "Add an email or a phone number so we can reach you";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "That email doesn’t look complete";
  if (phone && phone.replace(/\D/g, "").length < 10) errors.phone = "Include area code";
  if (!b?.consent) errors.consent = "Please confirm so we can contact you";
  if (Object.keys(errors).length) throw new HttpError(422, "Please check the highlighted fields", errors);
  const pick = (v: any, allowed: string[]) => (Array.isArray(v) ? v.filter((x) => allowed.includes(x)) : []);
  let id = "";
  db.transaction(() => {
    id = nextSeq("followup_contacts", "contact_id", "C-", 4);
    db.prepare("INSERT INTO followup_contacts (contact_id, submitted_on, name, email, phone, method, interests, availability, language, identity, neighborhood, accessibility, consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)")
      .run(id, today(), name, email || null, phone || null, ["email", "phone", "text"].includes(b.method) ? b.method : null,
        JSON.stringify(pick(b.interests, ["focus_group", "listening_session", "interview", "community_review", "updates"])),
        JSON.stringify(pick(b.availability, ["weekday_day", "weekday_evening", "weekend", "virtual", "in_person"])),
        clean(b.language, 80) || null, JSON.stringify(pick(b.identity, ["african_american", "african_immigrant", "caribbean", "afro_latino", "mixed", "other"])), clean(b.neighborhood, 80) || null, clean(b.accessibility, 400) || null);
  })();
  bump();
  return id;
}
export const listContacts = () => (db.prepare("SELECT * FROM followup_contacts ORDER BY contact_id").all() as any[]).map((c) => ({ ...c, interests: JSON.parse(c.interests), availability: JSON.parse(c.availability), identity: JSON.parse(c.identity) }));
export function updateContact(id: string, b: any, actor: string, role: string) {
  const c = db.prepare("SELECT status, cohort FROM followup_contacts WHERE contact_id=?").get(id) as any;
  if (!c) throw new HttpError(404, "Contact not found");
  const status = ["new", "contacted", "scheduled", "participated", "declined", "unreachable"].includes(b.status) ? b.status : c.status;
  db.prepare("UPDATE followup_contacts SET status=?, cohort=?, staff_notes=?, updated_by=?, updated_at=? WHERE contact_id=?").run(status, clean(b.cohort, 80) || null, clean(b.staff_notes, 1000) || null, actor, now(), id);
  audit(actor, role, "contact.update", "followup_contacts", id, { status: [c.status, status], cohort: [c.cohort, clean(b.cohort, 80) || null] });
  bump();
}
export function deleteContact(id: string, actor: string, role: string) {
  if (!db.prepare("SELECT 1 FROM followup_contacts WHERE contact_id=?").get(id)) throw new HttpError(404, "Contact not found");
  db.prepare("DELETE FROM followup_contacts WHERE contact_id=?").run(id);
  audit(actor, role, "contact.delete", "followup_contacts", id, "Removed at the person’s request or per retention policy");
  bump();
}

export const auditLog = (limit = 300) => db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?").all(limit);
export const assetMentions = () => db.prepare("SELECT m.*, r.status resp_status FROM asset_mentions m JOIN respondents r ON r.response_id=m.response_id").all() as any[];
export const openTextsForExport = () => db.prepare("SELECT t.*, r.status resp_status FROM open_texts t JOIN respondents r ON r.response_id=t.response_id ORDER BY t.text_id").all() as any[];
export const qualCodesAll = () => db.prepare("SELECT * FROM qualitative_codes ORDER BY text_id").all() as any[];
export const classificationQueue = () => db.prepare("SELECT response_id FROM analytic_codes WHERE status='active' AND bd_code='REVIEW'").all() as any[];

/* ---------------- team members (individual executive-team logins) ---------------- */
export const hashCode = (c: string) => crypto.createHash("sha256").update(c.trim().toUpperCase()).digest("hex");
function genCode() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const pick = (n: number) => Array.from(crypto.randomBytes(n), (b) => A[b % A.length]).join(""); return `SBD-${pick(4)}-${pick(4)}`; }
const pubMember = (m: any) => m && ({ memberId: m.member_id, name: m.name, email: m.email, org: m.org, role: m.role, active: !!m.active, createdAt: m.created_at, createdBy: m.created_by, lastLogin: m.last_login });
export function memberByHash(h: string) { return db.prepare("SELECT * FROM team_members WHERE code_hash=? AND active=1").get(h) as any; }
export function touchMember(id: string) { db.prepare("UPDATE team_members SET last_login=? WHERE member_id=?").run(now(), id); }
export function listMembers() { return (db.prepare("SELECT * FROM team_members ORDER BY created_at").all() as any[]).map(pubMember); }
export function addMember(b: any, by: string, role: string) {
  const name = clean(b?.name, 80), email = clean(b?.email, 120).toLowerCase(), org = clean(b?.org, 120) || null, r = String(b?.role || "");
  const errs: any = {};
  if (!name) errs.name = "Name is required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = "Enter a valid email";
  if (!["viewer", "analyst", "admin"].includes(r)) errs.role = "Choose a role";
  if (Object.keys(errs).length) throw new HttpError(422, "Check the highlighted fields", errs);
  if (db.prepare("SELECT 1 FROM team_members WHERE email=?").get(email)) throw new HttpError(409, "Someone with that email already has access");
  const id = nextSeq("team_members", "member_id", "TM-", 3); const code = genCode();
  db.prepare("INSERT INTO team_members (member_id, name, email, org, role, code_hash, active, created_at, created_by) VALUES (?,?,?,?,?,?,1,?,?)").run(id, name, email, org, r, hashCode(code), now(), by);
  audit(by, role, "team.add", "team_members", id, { role: r });
  return { member: pubMember(db.prepare("SELECT * FROM team_members WHERE member_id=?").get(id)), code };
}
export function updateMember(id: string, b: any, by: string, role: string) {
  const m = db.prepare("SELECT * FROM team_members WHERE member_id=?").get(id) as any; if (!m) throw new HttpError(404, "Team member not found");
  if (b?.role && ["viewer", "analyst", "admin"].includes(b.role)) db.prepare("UPDATE team_members SET role=? WHERE member_id=?").run(b.role, id);
  if (typeof b?.active === "boolean") db.prepare("UPDATE team_members SET active=? WHERE member_id=?").run(b.active ? 1 : 0, id);
  let code: string | undefined;
  if (b?.resetCode) { code = genCode(); db.prepare("UPDATE team_members SET code_hash=? WHERE member_id=?").run(hashCode(code), id); }
  audit(by, role, b?.resetCode ? "team.reset_code" : "team.update", "team_members", id, { role: b?.role, active: b?.active });
  return { member: pubMember(db.prepare("SELECT * FROM team_members WHERE member_id=?").get(id)), code };
}

/* ---------------- bulk import ---------------- */
export function recordBatch(b: { file: string; total: number; ids: string[]; dup: number; rej: number; channel: string | null; by: string; role: string }) {
  const id = nextSeq("import_batches", "batch_id", "IMP-", 4);
  db.prepare("INSERT INTO import_batches (batch_id, file_name, rows_total, imported, duplicates, rejected, channel, at, by, response_ids) VALUES (?,?,?,?,?,?,?,?,?,?)").run(id, b.file.slice(0, 160), b.total, b.ids.length, b.dup, b.rej, b.channel, now(), b.by, JSON.stringify(b.ids));
  audit(b.by, b.role, "response.import", "import_batches", id, { imported: b.ids.length, duplicates: b.dup, rejected: b.rej });
  return id;
}
export function listBatches() { return (db.prepare("SELECT * FROM import_batches ORDER BY at DESC").all() as any[]).map((r) => ({ batchId: r.batch_id, file: r.file_name, total: r.rows_total, imported: r.imported, duplicates: r.duplicates, rejected: r.rejected, channel: r.channel, at: r.at, by: r.by })); }

export function rawSha(answers: any, channel: string) { return crypto.createHash("sha256").update(JSON.stringify({ answers: answers || {}, channel: String(channel || "").trim().slice(0, 40).toLowerCase() || null, surveyVersion: SURVEY_VERSION })).digest("hex"); }
export function shaExists(sha: string) { return !!db.prepare("SELECT 1 FROM raw_submissions WHERE sha256=?").get(sha); }

/** Counts only, for post-deploy verification. */
export function opsStatus() {
  const one = (q: string) => (db.prepare(q).get() as any);
  return {
    responses: one("SELECT COUNT(*) n FROM respondents").n,
    byStatus: db.prepare("SELECT COALESCE(status,'') status, COUNT(*) n FROM respondents GROUP BY 1").all(),
    firstId: one("SELECT MIN(response_id) v FROM respondents").v, lastId: one("SELECT MAX(response_id) v FROM respondents").v,
    lastSubmittedAt: one("SELECT MAX(submitted_at) v FROM respondents").v,
    rawSubmissions: one("SELECT COUNT(*) n FROM raw_submissions").n,
    contacts: one("SELECT COUNT(*) n FROM followup_contacts").n,
    sessions: one("SELECT COUNT(*) n FROM survey_sessions").n,
    startupBackup: STARTUP_BACKUP,
    minOnlineAnswers: MIN_ONLINE_ANSWERS,
  };
}
