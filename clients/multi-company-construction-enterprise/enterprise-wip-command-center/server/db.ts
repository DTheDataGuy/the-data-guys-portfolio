import Database from "better-sqlite3";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DB_FILE = process.env.CC_DB || "data.db";
export const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, seq INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, login TEXT NOT NULL UNIQUE, email TEXT, title TEXT, role TEXT NOT NULL, scope TEXT NOT NULL DEFAULT '*', pass_hash TEXT NOT NULL, must_change INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, created_by TEXT, last_login TEXT);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS periods (id TEXT PRIMARY KEY, label TEXT NOT NULL, as_of TEXT NOT NULL, status TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL, created_by TEXT, published_at TEXT, published_by TEXT, version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS entities (code TEXT PRIMARY KEY, company TEXT NOT NULL, type TEXT NOT NULL, bu TEXT NOT NULL, status TEXT NOT NULL, notes TEXT, expected INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS imports (id TEXT PRIMARY KEY, period TEXT NOT NULL, channel TEXT NOT NULL, filename TEXT NOT NULL, sha256 TEXT NOT NULL, sender TEXT, subject TEXT, format TEXT, entities TEXT, rows_total INTEGER, rows_valid INTEGER, errors INTEGER, warnings INTEGER, status TEXT NOT NULL, validation TEXT, staged TEXT, created_at TEXT NOT NULL, created_by TEXT, committed_at TEXT, committed_by TEXT, UNIQUE(sha256, period));
CREATE TABLE IF NOT EXISTS files (import_id TEXT PRIMARY KEY, data BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS rows (
  id TEXT PRIMARY KEY, period TEXT NOT NULL, import_id TEXT, entity TEXT NOT NULL, company TEXT, bu TEXT,
  source_file TEXT, source_sheet TEXT, source_row INTEGER, master_row INTEGER,
  project_id TEXT NOT NULL, project_name TEXT, pm TEXT, status TEXT, jv TEXT, icwo TEXT,
  imp_elig TEXT, mgmt_elig TEXT, imp_excl TEXT, bond_no TEXT, bond_status_raw TEXT,
  orig REAL, mods REAL, C REAL, R REAL, E REAL, A REAL, B REAL,
  legacy_exc TEXT, legacy_sev TEXT, customer TEXT, location TEXT, contract_no TEXT, inferred TEXT,
  bond_method TEXT, bond_score REAL, legacy_bond_report INTEGER NOT NULL DEFAULT 0,
  start_date TEXT, end_date TEXT, override TEXT, override_reason TEXT, edited INTEGER NOT NULL DEFAULT 0, original TEXT
);
CREATE INDEX IF NOT EXISTS rows_period ON rows(period);
CREATE TABLE IF NOT EXISTS bonds_ref (id INTEGER PRIMARY KEY AUTOINCREMENT, bond_no TEXT NOT NULL, principal TEXT, description TEXT, eff TEXT, exp TEXT, amount REAL, lob TEXT, source_row INTEGER);
CREATE TABLE IF NOT EXISTS exc_state (key TEXT PRIMARY KEY, period TEXT NOT NULL, row_id TEXT NOT NULL, cat TEXT NOT NULL, status TEXT NOT NULL, owner TEXT, due TEXT, updated_at TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS exc_events (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, at TEXT NOT NULL, user_name TEXT NOT NULL, action TEXT NOT NULL, note TEXT);
CREATE TABLE IF NOT EXISTS fc_overrides (key TEXT PRIMARY KEY, months INTEGER, start_offset INTEGER, curve TEXT, note TEXT, updated_at TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS opportunities (id TEXT PRIMARY KEY, seq INTEGER NOT NULL, entity TEXT, name TEXT NOT NULL, customer TEXT, bid_date TEXT, value REAL, probability REAL, stage TEXT NOT NULL, start_month TEXT, duration INTEGER, margin REAL, bonded INTEGER NOT NULL DEFAULT 0, owner TEXT, linked TEXT, notes TEXT, sample INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT);
CREATE TABLE IF NOT EXISTS recon (id TEXT PRIMARY KEY, period TEXT NOT NULL, entity TEXT, project_id TEXT, project_name TEXT, cp REAL, hcss REAL, procore REAL, open_ap REAL, eac REAL, prior_eac REAL, approved_co REAL, pending_co REAL, mgmt_adj REAL, adj_reason TEXT, owner TEXT, status TEXT NOT NULL DEFAULT 'Open', note TEXT, sample INTEGER NOT NULL DEFAULT 0, import_id TEXT, updated_at TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY, entity TEXT NOT NULL, project_id TEXT NOT NULL, period TEXT, name TEXT NOT NULL, mime TEXT, size INTEGER NOT NULL, kind TEXT, note TEXT, data BLOB NOT NULL, uploaded_at TEXT NOT NULL, uploaded_by TEXT);
CREATE INDEX IF NOT EXISTS ix_att_proj ON attachments(entity, project_id);
CREATE TABLE IF NOT EXISTS mgmt_fc (period TEXT NOT NULL, entity TEXT NOT NULL, project_id TEXT NOT NULL, reserve REAL, confidence INTEGER, scenario TEXT, narrative TEXT, status TEXT NOT NULL DEFAULT 'draft', updated_at TEXT NOT NULL, updated_by TEXT, approved_by TEXT, approved_at TEXT, PRIMARY KEY(period, entity, project_id));
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, user_id TEXT, user_name TEXT, action TEXT NOT NULL, target TEXT, detail TEXT);
`);

export const now = () => new Date().toISOString();
export const sha = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex");
export const uid = (p: string) => `${p}-${crypto.randomBytes(6).toString("hex")}`;

let rev = Date.now();
export const bump = () => { rev++; };
export const getRev = () => rev;

export function getSetting<T>(k: string, dflt: T): T {
  const r = db.prepare("SELECT v FROM settings WHERE k=?").get(k) as any;
  if (!r) return dflt;
  try { return JSON.parse(r.v); } catch { return dflt; }
}
export function setSetting(k: string, v: unknown) {
  db.prepare("INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(k, JSON.stringify(v));
  bump();
}
export function audit(u: { id: string; name: string } | null, action: string, target: string | null, detail?: unknown) {
  db.prepare("INSERT INTO audit(at,user_id,user_name,action,target,detail) VALUES(?,?,?,?,?,?)").run(now(), u?.id || null, u?.name || "system", action, target, detail === undefined ? null : typeof detail === "string" ? detail : JSON.stringify(detail));
}

/* ---------- passwords & sessions ---------- */
export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${h.toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [alg, s, h] = String(stored).split("$");
  if (alg !== "scrypt" || !s || !h) return false;
  const calc = crypto.scryptSync(pw, Buffer.from(s, "hex"), 64, { N: 16384, r: 8, p: 1 });
  const exp = Buffer.from(h, "hex");
  return exp.length === calc.length && crypto.timingSafeEqual(exp, calc);
}
export function tempPassword() {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  const b = crypto.randomBytes(14);
  let s = "";
  for (let i = 0; i < 14; i++) s += A[b[i] % A.length];
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10)}`;
}
export function passwordProblem(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 12) return "Use at least 12 characters.";
  if (pw.length > 200) return "That password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9\W_]/.test(pw)) return "Mix letters with numbers or symbols.";
  return null;
}
export type Role = "admin" | "executive" | "finance" | "reviewer" | "viewer";
export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", executive: "Executive", finance: "Finance preparer", reviewer: "Reviewer", viewer: "Viewer" };
export type User = { id: string; name: string; login: string; email: string | null; title: string | null; role: Role; scope: string; must_change: number; active: number; created_at: string; last_login: string | null };
const UC = "id,name,login,email,title,role,scope,must_change,active,created_at,last_login";
export const listUsers = () => db.prepare(`SELECT ${UC} FROM users ORDER BY seq`).all() as User[];
export const userById = (id: string) => db.prepare(`SELECT ${UC} FROM users WHERE id=?`).get(id) as User | undefined;
export const userAuth = (login: string) => db.prepare(`SELECT * FROM users WHERE lower(login)=lower(?) OR lower(email)=lower(?)`).get(login.trim(), login.trim()) as (User & { pass_hash: string }) | undefined;
export function addUser(u: { name: string; login: string; email?: string | null; title?: string | null; role: Role; scope?: string; password: string }, by: string | null) {
  const seq = ((db.prepare("SELECT MAX(seq) m FROM users").get() as any).m || 0) + 1;
  const id = `U-${String(seq).padStart(3, "0")}`;
  db.prepare("INSERT INTO users(id,seq,name,login,email,title,role,scope,pass_hash,must_change,active,created_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,1,1,?,?)")
    .run(id, seq, u.name.trim(), u.login.trim().toLowerCase(), u.email?.trim().toLowerCase() || null, u.title?.trim() || null, u.role, u.scope || "*", hashPassword(u.password), now(), by);
  bump();
  return userById(id)!;
}
export function setPassword(id: string, pw: string, mustChange: boolean) {
  db.prepare("UPDATE users SET pass_hash=?, must_change=? WHERE id=?").run(hashPassword(pw), mustChange ? 1 : 0, id);
}
const SESSION_MS = 12 * 60 * 60 * 1000;
export function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)").run(sha(token), userId, now(), Date.now() + SESSION_MS);
  db.prepare("UPDATE users SET last_login=? WHERE id=?").run(now(), userId);
  db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
  return token;
}
export function userBySession(token: string) {
  if (!token) return undefined;
  const s = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash=?").get(sha(token)) as any;
  if (!s || s.expires_at < Date.now()) return undefined;
  const u = userById(s.user_id);
  return u && u.active ? u : undefined;
}
export const endSession = (token: string) => db.prepare("DELETE FROM sessions WHERE token_hash=?").run(sha(token));
export const endUserSessions = (id: string) => db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);

/* ---------- seed ---------- */
const numOrNull = (v: any) => (v === null || v === undefined || v === "" ? null : Number(v));
const strOrNull = (v: any) => (v === null || v === undefined || v === "" ? null : String(v));

export const ROW_COLS = ["id", "period", "import_id", "entity", "company", "bu", "source_file", "source_sheet", "source_row", "master_row", "project_id", "project_name", "pm", "status", "jv", "icwo", "imp_elig", "mgmt_elig", "imp_excl", "bond_no", "bond_status_raw", "orig", "mods", "C", "R", "E", "A", "B", "legacy_exc", "legacy_sev", "customer", "location", "contract_no", "inferred", "bond_method", "bond_score", "legacy_bond_report", "start_date", "end_date"];
export const insertRow = db.prepare(`INSERT INTO rows(${ROW_COLS.join(",")}) VALUES(${ROW_COLS.map((c) => "@" + c).join(",")})`);

export function masterToRow(x: any, period: string, importId: string | null) {
  return {
    id: uid("R"), period, import_id: importId, entity: String(x["Entity"]), company: strOrNull(x["Company"]), bu: strOrNull(x["Business Unit"]),
    source_file: strOrNull(x["Source File"]), source_sheet: strOrNull(x["Source Sheet"]), source_row: numOrNull(x["Source Row"]), master_row: numOrNull(x["master_row"]),
    project_id: String(x["Project ID"] ?? ""), project_name: strOrNull(x["Project Name"]), pm: strOrNull(x["Project Manager"]),
    status: strOrNull(x["Status"]) || "Active", jv: strOrNull(x["JV Flag"]) || "No", icwo: strOrNull(x["IC/IWO Flag"]) || "No",
    imp_elig: strOrNull(x["Reporting Eligible"]), mgmt_elig: strOrNull(x["Management Active Eligible"]), imp_excl: strOrNull(x["Exclusion Reason"]),
    bond_no: strOrNull(x["Bond Number"]), bond_status_raw: strOrNull(x["Bond Status"]),
    orig: numOrNull(x["Original Contract"]), mods: numOrNull(x["Contract Mods"]), C: numOrNull(x["Current/Revised Contract"]), R: numOrNull(x["ITD Earned Revenue"]),
    E: numOrNull(x["EAC"]), A: numOrNull(x["ITD Cost"]), B: numOrNull(x["Billings"]),
    legacy_exc: strOrNull(x["Exception Type"]), legacy_sev: strOrNull(x["Severity"]), customer: strOrNull(x["Customer"]), location: strOrNull(x["Location"]),
    contract_no: strOrNull(x["Contract No."]), inferred: strOrNull(x["Project ID Inferred"]), bond_method: strOrNull(x["Bond Match Method"]), bond_score: numOrNull(x["Bond Match Score"]),
    legacy_bond_report: x.legacyBondReport ? 1 : 0, start_date: null, end_date: null,
  };
}

export function seedIfEmpty() {
  const c = (db.prepare("SELECT COUNT(*) c FROM periods").get() as any).c;
  if (c > 0) return;
  const file = [path.resolve(process.cwd(), "seed/july2026.json"), path.resolve(typeof __dirname !== "undefined" ? __dirname : process.cwd(), "../seed/july2026.json")].find((f) => fs.existsSync(f));
  if (!file) throw new Error("Seed file missing");
  const s = JSON.parse(fs.readFileSync(file, "utf8"));
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO periods(id,label,as_of,status,note,created_at,created_by,published_at,published_by) VALUES(?,?,?,?,?,?,?,?,?)")
      .run("2026-07", "July 2026", "2026-07-31", "published", "Governed July baseline — loaded from Enterprise_July_2026_FINAL workbook (03_MASTER_WIP). Original workbook kept unchanged.", now(), "system", now(), "Baseline import");
    s.entities.forEach((e: any, i: number) => db.prepare("INSERT INTO entities(code,company,type,bu,status,notes,expected,sort) VALUES(?,?,?,?,?,?,1,?)").run(e["Entity"], e["Company"], e["Type"], e["Business Unit"], e["Status"], e["Notes"] || null, i));
    const imp = "IMP-baseline-2026-07";
    db.prepare("INSERT INTO imports(id,period,channel,filename,sha256,format,entities,rows_total,rows_valid,errors,warnings,status,created_at,created_by,committed_at,committed_by,validation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(imp, "2026-07", "baseline", "Enterprise_July_2026_FINAL.xlsx", "baseline-" + sha(JSON.stringify(s.rows)).slice(0, 16), "consolidated", JSON.stringify(s.entities.map((e: any) => e["Entity"])), s.rows.length, s.rows.length, 0, 0, "committed", now(), "system", now(), "system",
        JSON.stringify({ intake: s.intake }));
    for (const x of s.rows) insertRow.run(masterToRow(x, "2026-07", imp));
    for (const b of s.bonds) db.prepare("INSERT INTO bonds_ref(bond_no,principal,description,eff,exp,amount,lob,source_row) VALUES(?,?,?,?,?,?,?,?)").run(String(b["Bond #"]), b["Principal"], b["Description"], b["Effective Date"], b["Expiration Date"], numOrNull(b["Bond Amount"]), b["Line of Business"], numOrNull(b["Source Row"]));
    setSetting("legacyEntity", s.legacyEntity);
    setSetting("legacyRules", s.legacyRules);
    setSetting("baselineIntake", s.intake);
  });
  tx();
}
