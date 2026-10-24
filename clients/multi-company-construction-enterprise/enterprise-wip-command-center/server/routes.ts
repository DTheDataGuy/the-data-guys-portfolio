import { REPRO_TARGETS } from "./repro";
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import * as D from "./db";
import { DEFAULT_RULES, getRules, periodRows, type Rule } from "./rules";
import { stageFile, applyCarryForward, templateWorkbook, reconTemplate, parseRecon, detectPeriod, entityList, type Staged } from "./importer";
import { totals, metrics, exceptions, DEFAULT_THRESHOLDS, DEFAULT_FC, DEFAULT_CASH, EXC_LABEL, groupBy, type Thresholds } from "@shared/calc";
import { DEFAULT_TOL, DEFAULT_OWNERS } from "@shared/recon";

type Role = D.Role;
D.seedIfEmpty();

/* ---------- bootstrap accounts ---------- */
function bootstrapUsers() {
  if (D.listUsers().length) return;
  const creds: any[] = [];
  const add = (name: string, login: string, email: string | null, title: string, role: Role) => {
    const pw = process.env[`CC_PW_${login.split(/[.@]/)[0].toUpperCase()}`] || D.tempPassword();
    D.addUser({ name, login, email, title, role, password: pw }, null);
    creds.push({ login, pw });
  };
  add("DeiMarlon Scisney", "info@thedataguys.org", "info@thedataguys.org", "The Data Guys — administrator", "admin");
  add("Executive Sponsor", "exec.sponsor", null, "Executive", "executive");
  fs.writeFileSync(".initial-credentials.json", JSON.stringify(creds, null, 2), { mode: 0o600 });
}
bootstrapUsers();

/* ---------- one-time admin password reset (owner-approved 2026-09-28) ---------- */
(function adminReset() {
  const id = "reset-2026-09-28-info";
  if (D.getSetting<string | null>("adminResetApplied", null) === id) return;
  const u = D.userAuth("info@thedataguys.org");
  if (!u) return;
  D.db.prepare("UPDATE users SET pass_hash=?, must_change=1, active=1 WHERE id=?").run("scrypt$0f015b3d8423b8f055d0f9cfa7f23894$1312bd81ac801aa8de9e4e236a2510802478523b1cf0841183f7ffbb769b90305b4ee49c973965cae7d87a920eea78aa5a1a86b43a130229f7956373b5645ee8", u.id);
  D.db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
  D.setSetting("adminResetApplied", id);
  D.audit(null, "user.password_reset", u.id, { reason: "Owner requested reset" });
})();

/* ---------- auth ---------- */
declare global { namespace Express { interface Request { user?: D.User; token?: string } } }
const COOKIE = "__Host-cc_session";
function tokenOf(req: Request) {
  const h = String(req.header("authorization") || "");
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  const c = String(req.header("cookie") || "").split(/;\s*/).find((x) => x.startsWith(COOKIE + "="));
  return c ? decodeURIComponent(c.slice(COOKIE.length + 1)) : "";
}
function authed(req: Request, res: Response, next: NextFunction) {
  const t = tokenOf(req);
  const u = D.userBySession(t);
  if (!u) return res.status(401).json({ message: "Please sign in." });
  req.user = u; req.token = t;
  if (u.must_change && !["/api/auth/password", "/api/auth/me", "/api/auth/logout"].includes(req.path)) return res.status(403).json({ message: "Set a new password to continue.", mustChange: true });
  next();
}
const roles = (...allowed: Role[]) => (req: Request, res: Response, next: NextFunction) => (allowed.includes(req.user!.role) ? next() : res.status(403).json({ message: "Your role doesn’t allow this." }));
const EDIT: Role[] = ["admin", "executive", "finance"];
const REVIEW: Role[] = ["admin", "executive", "finance", "reviewer"];
const fails = new Map<string, number[]>();
const tooMany = (k: string) => { const n = Date.now(); const a = (fails.get(k) || []).filter((t) => n - t < 15 * 60 * 1000); fails.set(k, a); return a.length >= 8; };
const fail = (k: string) => { const a = fails.get(k) || []; a.push(Date.now()); fails.set(k, a); };
const pubUser = (u: D.User) => ({ id: u.id, name: u.name, login: u.login, email: u.email, title: u.title, role: u.role, roleLabel: D.ROLE_LABEL[u.role], scope: u.scope, mustChange: !!u.must_change });
const who = (u: D.User) => ({ id: u.id, name: u.name });
/* same rule as periodRows: an entity scope also covers that entity's own JV WIPs (e.g. SES → "SES/AEC JV1") */
const inScope = (u: D.User, entity: string) => { if (!u.scope || u.scope === "*") return true; const a = u.scope.split(",").map((x) => x.trim()); const e = String(entity || ""); return a.includes(e) || a.includes(e.split("/")[0]); };
const allScope = (u: D.User) => !u.scope || u.scope === "*";
const importInScope = (u: D.User, i: any) => allScope(u) || String(i?.entities || "").split(/[,|;\s]+/).filter(Boolean).every((e) => inScope(u, e)) && !!String(i?.entities || "").trim();
const setCookie = (res: Response, token: string, req: Request) => {
  const secure = req.secure || String(req.header("x-forwarded-proto") || "").includes("https");
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}; Secure`);
};

/* ---------- helpers ---------- */
const period = (id: string) => D.db.prepare("SELECT * FROM periods WHERE id=?").get(id) as any;
const listPeriods = () => D.db.prepare("SELECT * FROM periods ORDER BY id DESC").all() as any[];
const thresholds = () => ({ ...DEFAULT_THRESHOLDS, ...D.getSetting<Partial<Thresholds>>("thresholds", {}) });
const INTAKE_DEFAULT = { address: "WIP@enterprise.example.com", allow: ["@enterprise.example.com", "@contractor.example.com"], autoCommit: true, keyHash: null, keyLast4: null, rotatedAt: null };
const intakeCfg = () => D.getSetting<any>("intake", INTAKE_DEFAULT);
/* one-time: pre-fill the company mailbox and approved sender domains if never configured */
try {
  if (!D.getSetting<any>("intakeSeeded", null)) {
    const cur = D.getSetting<any>("intake", null);
    if (!cur) D.setSetting("intake", INTAKE_DEFAULT);
    else if (!cur.address && !(cur.allow || []).length) D.setSetting("intake", { ...cur, address: INTAKE_DEFAULT.address, allow: INTAKE_DEFAULT.allow });
    D.setSetting("intakeSeeded", { at: D.now() });
  }
} catch {}
function ensurePeriod(id: string, asOf: string | null, by: string) {
  if (period(id)) return period(id);
  const [y, m] = id.split("-").map(Number);
  const last = asOf || `${id}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  D.db.prepare("INSERT INTO periods(id,label,as_of,status,created_at,created_by) VALUES(?,?,?,?,?,?)").run(id, label, last, "draft", D.now(), by);
  D.bump();
  return period(id);
}
function publicImport(i: any, withStaged = false) {
  const v = i.validation ? JSON.parse(i.validation) : null;
  return {
    id: i.id, period: i.period, channel: i.channel, filename: i.filename, sender: i.sender, subject: i.subject, format: i.format, entities: i.entities ? JSON.parse(i.entities) : [],
    rowsTotal: i.rows_total, rowsValid: i.rows_valid, errors: i.errors, warnings: i.warnings, status: i.status, createdAt: i.created_at, createdBy: i.created_by, committedAt: i.committed_at, committedBy: i.committed_by, sha: i.sha256?.slice(0, 12),
    validation: v, staged: withStaged && i.staged ? JSON.parse(i.staged).slice(0, 400) : undefined,
  };
}

async function stage(buf: Buffer, fname: string, opts: { period?: string | null; entity?: string | null; channel: string; sender?: string | null; subject?: string | null; by: string }) {
  const hash = D.sha(buf);
  const st: Staged = await stageFile(buf, fname, opts.subject || null, opts.entity || null);
  const per = opts.period || st.period?.period || null;
  if (!per) throw Object.assign(new Error("Couldn’t detect the period from the file name or subject. Choose a period."), { status: 400 });
  const dupe = D.db.prepare("SELECT * FROM imports WHERE sha256=? AND period=?").get(hash, per) as any;
  if (st.format === "company-wip") {
    const cur = period(per); const asOf = cur?.as_of || `${per}-28`;
    const ref = (D.db.prepare("SELECT id,label FROM periods WHERE id<>? AND as_of<? ORDER BY as_of DESC LIMIT 1").get(per, asOf) || D.db.prepare("SELECT id,label FROM periods WHERE id<>? ORDER BY as_of ASC LIMIT 1").get(per)) as any;
    const m = new Map<string, any>();
    if (ref) for (const r of D.db.prepare("SELECT entity,project_id,icwo,bond_no,bond_status_raw FROM rows WHERE period=?").all(ref.id) as any[]) { const k = `${r.entity}|${r.project_id}`; if (!m.has(k)) m.set(k, r); }
    applyCarryForward(st.rows, ref ? { label: ref.label, rows: m } : null);
  }
  // Same file again: committed or clean staged copies are reused; a copy that was rejected or held back by errors is re-read (e.g. after choosing the entity).
  if (dupe && (dupe.status === "committed" || (dupe.status === "staged" && dupe.errors === 0))) return { duplicate: true, import: publicImport(dupe) };
  if (dupe && dupe.status === "staged") D.db.prepare("UPDATE imports SET status='rejected' WHERE id=?").run(dupe.id);
  if (dupe) D.db.prepare("UPDATE imports SET sha256=sha256||'-'||id WHERE id=?").run(dupe.id);
  const id = D.uid("IMP");
  const errors = st.issues.filter((x) => x.level === "error").length, warnings = st.issues.filter((x) => x.level === "warning").length;
  const errRows = new Set(st.issues.filter((x) => x.level === "error").map((x) => x.row));
  D.db.prepare("INSERT INTO imports(id,period,channel,filename,sha256,sender,subject,format,entities,rows_total,rows_valid,errors,warnings,status,validation,staged,created_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, per, opts.channel, fname, hash, opts.sender || null, opts.subject || null, st.format, JSON.stringify(st.entities), st.rows.length, st.rows.filter((r) => !errRows.has(r._excelRow)).length, errors, warnings, "staged",
      JSON.stringify({ issues: st.issues.slice(0, 500), mapped: st.mapped, unmapped: st.unmapped, sheet: st.sheet, headerRow: st.headerRow, detected: st.period, asOf: st.period?.asOf || null }), JSON.stringify(st.rows), D.now(), opts.by);
  D.db.prepare("INSERT INTO files(import_id,data) VALUES(?,?)").run(id, buf);
  D.bump();
  return { duplicate: false, import: publicImport(D.db.prepare("SELECT * FROM imports WHERE id=?").get(id), true) };
}

function commit(importId: string, by: { id: string; name: string }) {
  const i = D.db.prepare("SELECT * FROM imports WHERE id=?").get(importId) as any;
  if (!i) throw Object.assign(new Error("Import not found"), { status: 404 });
  if (i.status !== "staged") throw Object.assign(new Error(`This import is already ${i.status}.`), { status: 409 });
  if (i.errors > 0) throw Object.assign(new Error("Fix the blocking errors first (or re-send a corrected file)."), { status: 400 });
  const v = JSON.parse(i.validation || "{}");
  const p = ensurePeriod(i.period, v.asOf || null, by.name);
  if (p.status === "published") throw Object.assign(new Error(`${p.label} is published. Reopen it before loading new data.`), { status: 409 });
  const rows = JSON.parse(i.staged || "[]");
  const ents: string[] = [...new Set(rows.map((r: any) => r.entity))] as string[];
  const tx = D.db.transaction(() => {
    const prior = D.db.prepare(`SELECT DISTINCT import_id FROM rows WHERE period=? AND entity IN (${ents.map(() => "?").join(",")})`).all(i.period, ...ents) as any[];
    D.db.prepare(`DELETE FROM rows WHERE period=? AND entity IN (${ents.map(() => "?").join(",")})`).run(i.period, ...ents);
    for (const pr of prior) if (pr.import_id && pr.import_id !== importId) D.db.prepare("UPDATE imports SET status='superseded' WHERE id=? AND status='committed' AND NOT EXISTS (SELECT 1 FROM rows WHERE import_id=?)").run(pr.import_id, pr.import_id);
    for (const r of rows) {
      const rec: any = {};
      for (const c of D.ROW_COLS) rec[c] = r[c] === undefined ? null : r[c];
      rec.id = D.uid("R"); rec.period = i.period; rec.import_id = importId; rec.legacy_bond_report = 0;
      if (rec.bond_score !== null) rec.bond_score = Number(rec.bond_score);
      D.insertRow.run(rec);
    }
    D.db.prepare("UPDATE imports SET status='committed', committed_at=?, committed_by=? WHERE id=?").run(D.now(), by.name, importId);
  });
  tx();
  D.audit(by, "import.commit", importId, { period: i.period, entities: ents, rows: rows.length, file: i.filename });
  D.bump();
  return { period: i.period, entities: ents, rows: rows.length };
}

function summary(p: string, scope = "*") {
  const rows = periodRows(p, scope);
  const el = rows.filter((r) => r.eligible);
  const t = totals(el);
  const th = thresholds();
  const exc = el.map((r) => ({ r, cats: exceptions(r, metrics(r), th) }));
  const fin = exc.filter((x) => x.cats.includes("LOSS") || x.cats.includes("UNDER"));
  const br = rows.filter((r) => r.inBondReport);
  const bonded = br.filter((r) => r.bondStatus === "Bonded" || r.bondStatus === "Bonded - Number Unmatched");
  const brRem = br.reduce((a, r) => a + (metrics(r).remC || 0), 0), bRem = bonded.reduce((a, r) => a + (metrics(r).remC || 0), 0);
  const byEntity = Object.fromEntries([...groupBy(el, (r) => r.entity)].map(([k, v]) => [k, v.length]));
  const impDiff = rows.filter((r) => r.impElig && (r.impElig === "Yes") !== r.eligible).length;
  return { rows: rows.length, eligible: el.length, totals: t, financialExceptions: fin.length, loss: exc.filter((x) => x.cats.includes("LOSS")).length, under: exc.filter((x) => x.cats.includes("UNDER")).length, bondReport: br.length, bondedPct: brRem ? bRem / brRem : null, bondedRem: bRem, byEntity, importedFlagDifferences: impDiff };
}

/* One-time load of the June 2026 consolidated WIP (built from the 18 June 30, 2026 company files) into an existing database.
   Runs once per database; if June is later removed or replaced, it is not re-loaded. Loaded as "In review" — never auto-published. */
async function seedJune2026() {
  try {
    if (D.getSetting<any>("seedJune2026", null) || period("2026-06")) return;
    const file = [path.resolve(process.cwd(), "seed/june2026.xlsx"), path.resolve(typeof __dirname !== "undefined" ? __dirname : process.cwd(), "../seed/june2026.xlsx")].find((f) => fs.existsSync(f));
    if (!file) return;
    const sys = { id: "system", name: "System load" };
    const out = await stage(fs.readFileSync(file), "2026-06-30 June 2026 Consolidated WIP.xlsx", { period: "2026-06", channel: "baseline", by: sys.name });
    if (out.duplicate) return;
    commit(out.import.id, sys);
    D.db.prepare("UPDATE periods SET status='review', note=? WHERE id='2026-06' AND status='draft'").run("Loaded from 18 company WIPs dated June 30, 2026. Summit Terra (STL) not received for June. RDG values taken from the RDG ITD tab (June Summary tab earned revenue does not reconcile). Not Executive-approved.");
    D.audit(sys, "period.review", "2026-06", "June 2026 loaded from company WIPs");
    D.setSetting("seedJune2026", { at: D.now(), import: out.import.id }); D.bump();
  } catch (e) { console.error("June 2026 load skipped:", (e as any)?.message); }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await seedJune2026();
  app.use((req, res, next) => { res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Referrer-Policy", "same-origin"); res.setHeader("X-Robots-Tag", "noindex, nofollow"); if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store"); next(); });

  /* auth */
  app.post("/api/auth/login", (req, res) => {
    const { login, password } = req.body || {};
    const k = "acct|" + String(login || "").toLowerCase().trim();
    if (tooMany(k)) return res.status(429).json({ message: "Too many attempts. Wait 15 minutes and try again." });
    const u = login ? D.userAuth(String(login)) : undefined;
    if (!u || !u.active || !D.verifyPassword(String(password || ""), u.pass_hash)) { fail(k); return res.status(401).json({ message: "That sign-in didn’t match. Check the username or email and password." }); }
    const token = D.createSession(u.id);
    setCookie(res, token, req);
    D.audit(who(u), "auth.login", u.id);
    res.json({ token, user: pubUser(D.userById(u.id)!) });
  });
  app.get("/api/auth/me", authed, (req, res) => res.json({ token: req.token, user: pubUser(req.user!) }));
  app.post("/api/auth/logout", authed, (req, res) => { D.endSession(req.token!); res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; Secure`); res.json({ ok: true }); });
  app.post("/api/auth/password", authed, (req, res) => {
    const { current, next: nx } = req.body || {};
    const full = D.userAuth(req.user!.login)!;
    if (!D.verifyPassword(String(current || ""), full.pass_hash)) return res.status(400).json({ message: "Your current password is incorrect." });
    const pr = D.passwordProblem(nx); if (pr) return res.status(400).json({ message: pr });
    if (nx === current) return res.status(400).json({ message: "Choose a password different from the temporary one." });
    D.setPassword(req.user!.id, nx, false);
    D.audit(who(req.user!), "auth.password", req.user!.id);
    res.json({ user: pubUser(D.userById(req.user!.id)!) });
  });

  app.get("/api/rev", authed, (_req, res) => res.json({ rev: D.getRev() }));

  app.get("/api/bootstrap", authed, (req, res) => {
    const ic = intakeCfg();
    res.json({
      user: pubUser(req.user!), periods: listPeriods(), entities: D.db.prepare("SELECT * FROM entities ORDER BY sort").all(),
      rules: getRules(), legacyRules: D.getSetting("legacyRules", []), legacyEntity: D.getSetting("legacyEntity", []),
      settings: {
        thresholds: thresholds(), fc: { ...DEFAULT_FC, ...D.getSetting("fc", {}) }, cash: { ...DEFAULT_CASH, ...D.getSetting("cash", {}) },
        surety: D.getSetting("surety", { aggregate: null, single: null, note: "" }), reconTol: { ...DEFAULT_TOL, ...D.getSetting("reconTol", {}) }, owners: { ...DEFAULT_OWNERS, ...D.getSetting("owners", {}) },
        planning: D.getSetting("planning", { targetMonthly: null, gapPct: 0.85 }),
      },
      intake: { address: ic.address, allow: ic.allow, autoCommit: ic.autoCommit, hasKey: !!ic.keyHash, keyLast4: ic.keyLast4, rotatedAt: ic.rotatedAt },
    });
  });

  /* periods & rows */
  app.get("/api/periods/:p/rows", authed, (req, res) => { if (!period(String(req.params.p))) return res.status(404).json({ message: "Unknown period" }); res.json(periodRows(String(req.params.p), req.user!.scope)); });
  app.get("/api/periods/:p/summary", authed, (req, res) => res.json(summary(String(req.params.p), req.user!.scope)));
  app.post("/api/periods", authed, roles(...EDIT), (req, res) => {
    const id = String(req.body?.id || ""); if (!/^20\d{2}-\d{2}$/.test(id)) return res.status(400).json({ message: "Use a YYYY-MM period." });
    if (period(id)) return res.status(409).json({ message: "That period already exists." });
    const p = ensurePeriod(id, req.body?.asOf || null, req.user!.name);
    D.audit(who(req.user!), "period.create", id);
    res.json(p);
  });
  app.post("/api/periods/:p/status", authed, (req, res) => {
    const p = period(String(req.params.p)); if (!p) return res.status(404).json({ message: "Unknown period" });
    const to = String(req.body?.status || ""); const r = req.user!.role;
    const ok = (to === "review" && EDIT.includes(r)) || (to === "published" && (r === "admin" || r === "executive")) || (to === "draft" && (r === "admin" || r === "executive"));
    if (!ok || !["draft", "review", "published"].includes(to)) return res.status(403).json({ message: "Your role can’t make that change." });
    if (to === "published") D.db.prepare("UPDATE periods SET status=?, published_at=?, published_by=?, version=version+1, note=COALESCE(?,note) WHERE id=?").run(to, D.now(), req.user!.name, req.body?.note || null, p.id);
    else D.db.prepare("UPDATE periods SET status=?, note=COALESCE(?,note) WHERE id=?").run(to, req.body?.note || null, p.id);
    D.audit(who(req.user!), `period.${to}`, p.id, req.body?.note || null); D.bump();
    res.json(period(p.id));
  });

  const EDITABLE: Record<string, "num" | "str" | "date"> = { orig: "num", mods: "num", C: "num", R: "num", E: "num", A: "num", B: "num", status: "str", jv: "str", icwo: "str", bond_no: "str", bond_status_raw: "str", pm: "str", project_name: "str", customer: "str", location: "str", start_date: "date", end_date: "date", bu: "str" };
  app.patch("/api/rows/:id", authed, roles(...EDIT), (req, res) => {
    const row = D.db.prepare("SELECT * FROM rows WHERE id=?").get(String(req.params.id)) as any; if (!row || !inScope(req.user!, row.entity)) return res.status(404).json({ message: "Row not found" });
    const p = period(row.period); if (p.status === "published") return res.status(409).json({ message: `${p.label} is published. Reopen the period to edit.` });
    const reason = String(req.body?.reason || "").trim(); if (reason.length < 3) return res.status(400).json({ message: "Add a short reason for the change." });
    const ch = req.body?.changes || {}; const diffs: any = {};
    for (const [k, v] of Object.entries(ch)) {
      const t = EDITABLE[k]; if (!t) continue;
      let val: any = v === "" || v === null || v === undefined ? null : v;
      if (t === "num" && val !== null) { val = Number(String(val).replace(/[$,]/g, "")); if (!Number.isFinite(val)) return res.status(400).json({ message: `${k} must be a number or blank.` }); }
      if (t === "date" && val !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return res.status(400).json({ message: "Dates use YYYY-MM-DD." });
      if (row[k] !== val) diffs[k] = { from: row[k], to: val };
    }
    if (!Object.keys(diffs).length) return res.json({ ok: true, unchanged: true });
    const orig = row.original ? JSON.parse(row.original) : {};
    for (const k of Object.keys(diffs)) if (!(k in orig)) orig[k] = row[k];
    const sets = Object.keys(diffs).map((k) => `${k}=@${k}`).join(",");
    D.db.prepare(`UPDATE rows SET ${sets}, edited=1, original=@original WHERE id=@id`).run({ ...Object.fromEntries(Object.entries(diffs).map(([k, v]: any) => [k, v.to])), original: JSON.stringify(orig), id: row.id });
    D.audit(who(req.user!), "row.edit", `${row.period}|${row.entity}|${row.project_id}`, { reason, diffs });
    D.bump(); res.json({ ok: true });
  });
  app.post("/api/rows/:id/override", authed, roles("admin", "executive"), (req, res) => {
    const row = D.db.prepare("SELECT * FROM rows WHERE id=?").get(String(req.params.id)) as any; if (!row || !inScope(req.user!, row.entity)) return res.status(404).json({ message: "Row not found" });
    const mode = req.body?.mode === "include" || req.body?.mode === "exclude" ? req.body.mode : null; const reason = String(req.body?.reason || "").trim();
    if (mode && reason.length < 3) return res.status(400).json({ message: "Add a reason for the eligibility override." });
    D.db.prepare("UPDATE rows SET override=?, override_reason=? WHERE id=?").run(mode, mode ? reason : null, row.id);
    D.audit(who(req.user!), "row.override", `${row.period}|${row.entity}|${row.project_id}`, { mode, reason }); D.bump();
    res.json({ ok: true });
  });
  app.get("/api/rows/:id/history", authed, (req, res) => {
    const row = D.db.prepare("SELECT period, entity, project_id FROM rows WHERE id=?").get(String(req.params.id)) as any; if (!row || !inScope(req.user!, row.entity)) return res.json([]);
    res.json(D.db.prepare("SELECT * FROM audit WHERE target=? ORDER BY id DESC LIMIT 50").all(`${row.period}|${row.entity}|${row.project_id}`));
  });

  /* project documents — keyed by entity + project ID (never project ID alone), kept across months */
  const ATT_KINDS = ["Change order", "PM re-forecast", "Pay application", "Contract", "Bond / surety", "Photo", "Correspondence", "Other"];
  const attRow = (a: any) => ({ id: a.id, entity: a.entity, projectId: a.project_id, period: a.period, name: a.name, mime: a.mime, size: a.size, kind: a.kind, note: a.note, uploadedAt: a.uploaded_at, uploadedBy: a.uploaded_by });
  app.get("/api/attachments", authed, (req, res) => {
    const entity = String(req.query.entity || ""), project = String(req.query.project || "");
    if (entity && project) { if (!inScope(req.user!, entity)) return res.json([]); return res.json((D.db.prepare("SELECT id,entity,project_id,period,name,mime,size,kind,note,uploaded_at,uploaded_by FROM attachments WHERE entity=? AND project_id=? ORDER BY uploaded_at DESC").all(entity, project) as any[]).map(attRow)); }
    res.json((D.db.prepare("SELECT id,entity,project_id,period,name,mime,size,kind,note,uploaded_at,uploaded_by FROM attachments ORDER BY uploaded_at DESC LIMIT 500").all() as any[]).filter((a) => inScope(req.user!, a.entity)).map(attRow));
  });
  app.post("/api/attachments", authed, roles(...EDIT), (req, res) => {
    const { entity, projectId, period, name, mime, data, kind, note } = req.body || {};
    if (!entity || !projectId || !name || !data) return res.status(400).json({ message: "Missing file or project." });
    if (!inScope(req.user!, String(entity))) return res.status(403).json({ message: "Outside your entity scope." });
    const exists = D.db.prepare("SELECT 1 FROM rows WHERE entity=? AND project_id=? LIMIT 1").get(String(entity), String(projectId)); if (!exists) return res.status(404).json({ message: "Project not found." });
    const buf = Buffer.from(String(data), "base64"); if (!buf.length) return res.status(400).json({ message: "The file is empty." });
    if (buf.length > 20 * 1024 * 1024) return res.status(413).json({ message: "Files are limited to 20 MB each." });
    const safeName = String(name).replace(/[\\/\r\n"]/g, "_").slice(0, 180);
    if (/\.(exe|bat|cmd|com|scr|js|vbs|ps1|msi|dll|sh|html?|svg)$/i.test(safeName)) return res.status(400).json({ message: "That file type isn’t allowed. Use PDF, Office, image, text or ZIP files." });
    const id = D.uid("att"); const k = ATT_KINDS.includes(String(kind)) ? String(kind) : "Other";
    D.db.prepare("INSERT INTO attachments (id,entity,project_id,period,name,mime,size,kind,note,data,uploaded_at,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(id, String(entity), String(projectId), period ? String(period) : null, safeName, String(mime || "application/octet-stream").slice(0, 100), buf.length, k, note ? String(note).slice(0, 500) : null, buf, D.now(), req.user!.name);
    D.audit(who(req.user!), "attachment.add", `${period || ""}|${entity}|${projectId}`, { name: safeName, kind: k, size: buf.length });
    D.bump(); res.json({ ok: true, id });
  });
  app.get("/api/attachments/:id/file", authed, (req, res) => {
    const a = D.db.prepare("SELECT * FROM attachments WHERE id=?").get(String(req.params.id)) as any;
    if (!a || !inScope(req.user!, a.entity)) return res.status(404).json({ message: "Not found" });
    const inline = req.query.inline === "1" && /^(image\/(png|jpeg|gif|webp)|application\/pdf)$/.test(a.mime || "");
    res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${a.name}"`);
    res.setHeader("Content-Type", inline ? a.mime : "application/octet-stream"); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    res.send(a.data);
  });
  app.delete("/api/attachments/:id", authed, roles(...EDIT), (req, res) => {
    const a = D.db.prepare("SELECT id,entity,project_id,period,name FROM attachments WHERE id=?").get(String(req.params.id)) as any;
    if (!a || !inScope(req.user!, a.entity)) return res.status(404).json({ message: "Not found" });
    D.db.prepare("DELETE FROM attachments WHERE id=?").run(a.id); D.audit(who(req.user!), "attachment.delete", `${a.period || ""}|${a.entity}|${a.project_id}`, { name: a.name }); D.bump(); res.json({ ok: true });
  });

  /* imports */
  app.post("/api/imports/stage", authed, roles(...EDIT), async (req, res) => {
    try {
      const { filename, contentBase64, period: per, entity } = req.body || {};
      if (!filename || !contentBase64) return res.status(400).json({ message: "Attach a file." });
      const buf = Buffer.from(String(contentBase64), "base64");
      if (buf.length > 25 * 1024 * 1024) return res.status(413).json({ message: "Files must be under 25 MB." });
      const out = await stage(buf, String(filename), { period: per || null, entity: entity || null, channel: "upload", by: req.user!.name });
      D.audit(who(req.user!), "import.stage", out.import.id, { file: filename, duplicate: out.duplicate });
      res.json(out);
    } catch (e: any) { res.status(e.status || 400).json({ message: e.message || "Couldn’t read that file." }); }
  });
  app.get("/api/imports", authed, (req, res) => {
    const p = req.query.period ? String(req.query.period) : null;
    const rows = (p ? D.db.prepare("SELECT * FROM imports WHERE period=? ORDER BY created_at DESC").all(p) : D.db.prepare("SELECT * FROM imports ORDER BY created_at DESC LIMIT 200").all()) as any[];
    res.json(rows.filter((i) => importInScope(req.user!, i)).map((i) => publicImport(i)));
  });
  app.get("/api/imports/:id", authed, (req, res) => { const i = D.db.prepare("SELECT * FROM imports WHERE id=?").get(String(req.params.id)); if (!i || !importInScope(req.user!, i)) return res.status(404).json({ message: "Not found" }); res.json(publicImport(i, true)); });
  app.post("/api/imports/:id/commit", authed, roles(...EDIT), (req, res) => { try { res.json(commit(String(req.params.id), who(req.user!))); } catch (e: any) { res.status(e.status || 400).json({ message: e.message }); } });
  app.post("/api/imports/:id/reject", authed, roles(...EDIT), (req, res) => { D.db.prepare("UPDATE imports SET status='rejected' WHERE id=? AND status='staged'").run(String(req.params.id)); D.audit(who(req.user!), "import.reject", String(req.params.id)); D.bump(); res.json({ ok: true }); });
  app.get("/api/imports/:id/file", authed, roles(...EDIT), (req, res) => {
    const i = D.db.prepare("SELECT filename FROM imports WHERE id=?").get(String(req.params.id)) as any; const f = D.db.prepare("SELECT data FROM files WHERE import_id=?").get(String(req.params.id)) as any;
    if (!i || !f || !importInScope(req.user!, { entities: (D.db.prepare("SELECT entities FROM imports WHERE id=?").get(String(req.params.id)) as any)?.entities })) return res.status(404).json({ message: "Original file not stored for this import." });
    res.setHeader("Content-Disposition", `attachment; filename="${i.filename.replace(/"/g, "")}"`); res.setHeader("Content-Type", "application/octet-stream"); res.send(f.data);
  });

  /* email intake — Power Automate / Graph friendly */
  app.post("/api/intake/email", async (req, res) => {
    const cfg = intakeCfg();
    const key = String(req.header("x-intake-key") || "");
    if (!cfg.keyHash || !key || D.sha(key) !== cfg.keyHash) return res.status(401).json({ message: "Invalid intake key." });
    const { from, subject, receivedAt, attachments } = req.body || {};
    const sender = String(from || "").toLowerCase().trim();
    if (cfg.allow?.length && !cfg.allow.some((a: string) => sender === a.toLowerCase() || (a.startsWith("@") && sender.endsWith(a.toLowerCase())))) {
      D.audit(null, "intake.rejected-sender", sender, { subject }); return res.status(403).json({ message: `Sender ${sender} is not on the allowlist.` });
    }
    const list = Array.isArray(attachments) ? attachments : [];
    if (!list.length) return res.status(400).json({ message: "No attachments." });
    const results: any[] = [];
    for (const a of list) {
      const name = String(a.name || a.Name || "attachment.xlsx");
      if (!/\.(xlsx|xlsm|csv)$/i.test(name)) { results.push({ name, status: "ignored", message: "Not a spreadsheet" }); continue; }
      try {
        const buf = Buffer.from(String(a.contentBytes || a.ContentBytes || a.content || ""), "base64");
        const out = await stage(buf, name, { channel: "email", sender, subject: subject || null, by: `Email: ${sender || "unknown"}` });
        if (out.duplicate) { results.push({ name, status: "duplicate", importId: out.import.id, message: "Already received — ignored (idempotent)" }); continue; }
        let status = "staged", message = `${out.import.rowsTotal} rows staged for ${out.import.period}`;
        if (cfg.autoCommit && out.import.errors === 0) {
          const p = period(out.import.period);
          if (!p || p.status !== "published") { const c = commit(out.import.id, { id: "email", name: `Email intake (${sender})` }); status = "committed"; message = `${c.rows} rows loaded into ${c.period} for ${c.entities.join(", ")}`; }
          else message += " — period is published, waiting for review";
        } else if (out.import.errors) message += ` — ${out.import.errors} blocking issue(s) need review`;
        results.push({ name, status, importId: out.import.id, period: out.import.period, message });
      } catch (e: any) { results.push({ name, status: "failed", message: e.message }); }
    }
    D.audit(null, "intake.email", sender, { subject, receivedAt, results }); D.bump();
    res.json({ ok: true, results });
  });
  app.put("/api/intake/config", authed, roles("admin", "executive"), (req, res) => {
    const cfg = intakeCfg();
    const allow = Array.isArray(req.body?.allow) ? req.body.allow.map((s: string) => String(s).trim()).filter(Boolean) : cfg.allow;
    D.setSetting("intake", { ...cfg, address: String(req.body?.address ?? cfg.address).trim(), allow, autoCommit: req.body?.autoCommit ?? cfg.autoCommit });
    D.audit(who(req.user!), "intake.config", null, { address: req.body?.address, allow, autoCommit: req.body?.autoCommit }); res.json({ ok: true });
  });
  app.post("/api/intake/rotate", authed, roles("admin"), (req, res) => {
    const key = "wip_" + crypto.randomBytes(24).toString("base64url");
    D.setSetting("intake", { ...intakeCfg(), keyHash: D.sha(key), keyLast4: key.slice(-4), rotatedAt: D.now() });
    D.audit(who(req.user!), "intake.rotate-key", null); res.json({ key });
  });

  /* templates & export */
  app.get("/api/template/wip.xlsx", authed, async (_req, res) => { const b = await templateWorkbook(entityList()); res.setHeader("Content-Disposition", 'attachment; filename="Standard_WIP_Template_PROPOSED_v0.1.xlsx"'); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.send(b); });
  app.get("/api/template/recon.xlsx", authed, async (_req, res) => { const b = await reconTemplate(); res.setHeader("Content-Disposition", 'attachment; filename="Month_End_Recon_Template_PROPOSED_v0.1.xlsx"'); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.send(b); });
  app.get("/api/periods/:p/export.xlsx", authed, async (req, res) => {
    const p = period(String(req.params.p)); if (!p) return res.status(404).json({ message: "Unknown period" });
    const rows = periodRows(p.id, req.user!.scope); const th = thresholds(); const s = summary(p.id, req.user!.scope);
    const wb = new ExcelJS.Workbook(); wb.creator = "Enterprise WIP Command Center";
    const sm = wb.addWorksheet("Summary");
    sm.addRows([[`Enterprise WIP — ${p.label} (${p.status})`], [`Generated ${new Date().toISOString()} by ${req.user!.name}`], [], ["Metric", "Value", "Basis"],
      ["Eligible projects", s.eligible, "Governed rules"], ["Current contract", s.totals.C, "Source"], ["ITD earned revenue", s.totals.R, "Source"], ["EAC", s.totals.E, "Source"], ["ITD cost", s.totals.A, "Source"], ["Billings", s.totals.B, "Source"],
      ["Remaining contract", s.totals.remC, "Calculated C − R"], ["Remaining cost", s.totals.remCost, "Calculated E − A"], ["Remaining GP", s.totals.remGP, "Calculated"], ["Weighted remaining GM", s.totals.remGM, "Σ remaining GP ÷ Σ remaining contract"],
      ["Financial exceptions", s.financialExceptions, `Loss basis: ${th.lossBasis}; underbilled > ${th.underThreshold}`], ["Bonded share of bond-report remaining contract", s.bondedPct, "Calculated"]]);
    sm.getColumn(1).width = 44; sm.getColumn(2).width = 22; sm.getColumn(3).width = 44; sm.getRow(1).font = { bold: true, size: 14 }; sm.getRow(4).font = { bold: true };
    for (let r = 6; r <= 17; r++) sm.getCell(r, 2).numFmt = "#,##0.00;(#,##0.00)"; sm.getCell(18, 2).numFmt = "0.00%"; sm.getCell(20, 2).numFmt = "0.00%";
    const ws = wb.addWorksheet("Governed WIP", { views: [{ state: "frozen", ySplit: 1 }] });
    const H = ["Entity", "Company", "Business Unit", "Project ID", "Project Name", "Status", "JV", "IC/IWO", "Eligible", "Exclusion rules", "Bond #", "Bond Status", "Current Contract", "ITD Revenue", "EAC", "ITD Cost", "Billings", "Remaining Contract", "Remaining Cost", "ITD GP", "Remaining GP", "Remaining GM", "Over/(Under) Billed", "Exceptions", "Source File", "Source Row", "Edited"];
    ws.addRow(H); ws.getRow(1).font = { bold: true };
    for (const r of rows) { const m = metrics(r); ws.addRow([r.entity, r.company, r.bu, r.projectId, r.projectName, r.status, r.jv, r.icwo, r.eligible ? "Yes" : "No", r.reasons.join(", "), r.bondNo, r.bondStatus, r.C, r.R, r.E, r.A, r.B, m.remC, m.remCost, m.itdGP, m.remGP, m.remGM, m.ob, r.eligible ? exceptions(r, m, th).map((c) => EXC_LABEL[c]).join("; ") : "", r.sourceFile, r.sourceRow, r.edited ? "Yes" : ""]); }
    for (let c = 13; c <= 23; c++) ws.getColumn(c).numFmt = c === 22 ? "0.00%" : "#,##0.00;(#,##0.00)";
    ws.getColumn(4).numFmt = "@"; ws.getColumn(11).numFmt = "@";
    const b = Buffer.from(await wb.xlsx.writeBuffer());
    D.audit(who(req.user!), "export.xlsx", p.id);
    res.setHeader("Content-Disposition", `attachment; filename="Enterprise_WIP_${p.id}.xlsx"`); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.send(b);
  });

  /* settings */
  const SETTING_KEYS: Record<string, Role[]> = { thresholds: ["admin", "executive", "finance"], fc: EDIT, cash: EDIT, surety: ["admin", "executive", "finance"], reconTol: EDIT, owners: ["admin", "executive"], planning: EDIT };
  app.put("/api/settings/:k", authed, (req, res) => {
    const k = String(req.params.k); const allowed = SETTING_KEYS[k];
    if (!allowed) return res.status(404).json({ message: "Unknown setting" });
    if (!allowed.includes(req.user!.role)) return res.status(403).json({ message: "Your role can’t change this." });
    D.setSetting(k, req.body || {}); D.audit(who(req.user!), `settings.${k}`, null, req.body); res.json({ ok: true });
  });

  /* exceptions workflow */
  app.get("/api/exc", authed, (req, res) => res.json((D.db.prepare("SELECT e.*, r.entity AS _ent FROM exc_state e LEFT JOIN rows r ON r.id=e.row_id WHERE e.period=?").all(String(req.query.period || "")) as any[]).filter((e) => allScope(req.user!) || (e._ent && inScope(req.user!, e._ent))).map(({ _ent, ...e }) => e)));
  app.get("/api/exc/events", authed, (req, res) => res.json(D.db.prepare("SELECT * FROM exc_events WHERE key=? ORDER BY id DESC").all(String(req.query.key || ""))));
  app.post("/api/exc", authed, roles(...REVIEW), (req, res) => {
    const { period: per, rowId, cat, status, owner, due, note } = req.body || {};
    const er = D.db.prepare("SELECT entity FROM rows WHERE id=?").get(String(rowId || "")) as any; if (!allScope(req.user!) && (!er || !inScope(req.user!, er.entity))) return res.status(403).json({ message: "That project is outside your entity access." });
    const key = `${per}|${rowId}|${cat}`;
    const cur = D.db.prepare("SELECT * FROM exc_state WHERE key=?").get(key) as any;
    const st = status || cur?.status || "New";
    if (!["New", "Assigned", "Investigating", "Resolved", "Verified", "Waived"].includes(st)) return res.status(400).json({ message: "Unknown status" });
    if ((st === "Resolved" || st === "Waived") && !String(note || "").trim()) return res.status(400).json({ message: "Add a resolution note." });
    if (st === "Verified" && !["admin", "executive", "finance"].includes(req.user!.role)) return res.status(403).json({ message: "Only finance or executives can verify." });
    D.db.prepare("INSERT INTO exc_state(key,period,row_id,cat,status,owner,due,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET status=excluded.status, owner=excluded.owner, due=excluded.due, updated_at=excluded.updated_at, updated_by=excluded.updated_by")
      .run(key, per, rowId, cat, st, owner ?? cur?.owner ?? null, due ?? cur?.due ?? null, D.now(), req.user!.name);
    D.db.prepare("INSERT INTO exc_events(key,at,user_name,action,note) VALUES(?,?,?,?,?)").run(key, D.now(), req.user!.name, cur?.status !== st ? `${cur?.status || "New"} → ${st}` : "Updated", note || null);
    D.bump(); res.json({ ok: true });
  });

  /* forecast overrides */
  app.get("/api/fc-overrides", authed, (_req, res) => res.json(D.db.prepare("SELECT * FROM fc_overrides").all()));
  app.put("/api/fc-overrides", authed, roles(...EDIT), (req, res) => {
    const { key, months, startOffset, curve, note } = req.body || {};
    if (!key) return res.status(400).json({ message: "Missing project key" });
    if (months === null && startOffset === null && !curve) D.db.prepare("DELETE FROM fc_overrides WHERE key=?").run(key);
    else D.db.prepare("INSERT INTO fc_overrides(key,months,start_offset,curve,note,updated_at,updated_by) VALUES(?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET months=excluded.months,start_offset=excluded.start_offset,curve=excluded.curve,note=excluded.note,updated_at=excluded.updated_at,updated_by=excluded.updated_by")
      .run(key, months ?? null, startOffset ?? null, curve || null, note || null, D.now(), req.user!.name);
    D.audit(who(req.user!), "forecast.override", key, req.body); D.bump(); res.json({ ok: true });
  });


  /* management forecast layer (hidden): FA reserve + confidence 0–5; never changes accounting WIP */
  app.get("/api/mgmt-fc", authed, (req, res) => {
    const per = String(req.query.period || "");
    res.json((D.db.prepare("SELECT * FROM mgmt_fc WHERE period=? ORDER BY entity, project_id").all(per) as any[]).filter((r) => inScope(req.user!, r.entity))
      .map((r) => ({ period: r.period, entity: r.entity, projectId: r.project_id, reserve: r.reserve, confidence: r.confidence, scenario: r.scenario, narrative: r.narrative, status: r.status, updatedAt: r.updated_at, updatedBy: r.updated_by, approvedBy: r.approved_by, approvedAt: r.approved_at })));
  });
  app.put("/api/mgmt-fc", authed, roles(...EDIT), (req, res) => {
    const { period, items } = req.body || {};
    if (!period || !Array.isArray(items) || !items.length) return res.status(400).json({ message: "Nothing to save." });
    if (items.length > 5000) return res.status(400).json({ message: "Too many rows in one save." });
    const exists = D.db.prepare("SELECT 1 FROM rows WHERE period=? AND entity=? AND project_id=? LIMIT 1");
    const up = D.db.prepare("INSERT INTO mgmt_fc(period,entity,project_id,reserve,confidence,scenario,narrative,status,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,'draft',?,?) ON CONFLICT(period,entity,project_id) DO UPDATE SET reserve=excluded.reserve,confidence=excluded.confidence,scenario=excluded.scenario,narrative=excluded.narrative,status='draft',updated_at=excluded.updated_at,updated_by=excluded.updated_by,approved_by=NULL,approved_at=NULL");
    const del = D.db.prepare("DELETE FROM mgmt_fc WHERE period=? AND entity=? AND project_id=?");
    const errors: string[] = []; let saved = 0, cleared = 0;
    const num = (v: any) => (v === null || v === undefined || v === "" ? null : Number(v));
    D.db.transaction(() => {
      for (const [i, it] of items.entries()) {
        const entity = String(it?.entity ?? "").trim(); const pid = String(it?.projectId ?? "").trim(); const tag = `${entity} ${pid}`.trim() || `row ${i + 1}`;
        if (!entity || !pid) { errors.push(`${tag}: entity and project ID are required`); continue; }
        if (!inScope(req.user!, entity)) { errors.push(`${tag}: outside your entity scope`); continue; }
        if (!exists.get(String(period), entity, pid)) { errors.push(`${tag}: no project with this entity + project ID in ${period}`); continue; }
        const reserve = num(it.reserve); const conf = num(it.confidence);
        if (reserve !== null && !Number.isFinite(reserve)) { errors.push(`${tag}: FA reserve must be a number`); continue; }
        if (conf !== null && (!Number.isInteger(conf) || conf < 0 || conf > 5)) { errors.push(`${tag}: confidence must be a whole number 0–5`); continue; }
        const sc = it.scenario ? String(it.scenario).trim().toUpperCase() : null;
        if (sc && !["S1", "S2", "S3"].includes(sc)) { errors.push(`${tag}: scenario must be S1, S2 or S3`); continue; }
        const nar = it.narrative ? String(it.narrative).slice(0, 2000) : null;
        if (reserve === null && conf === null && !sc && !nar) { del.run(String(period), entity, pid); cleared++; continue; }
        up.run(String(period), entity, pid, reserve, conf, sc, nar, D.now(), req.user!.name); saved++;
      }
    })();
    if (saved || cleared) { D.audit(who(req.user!), "mgmtfc.save", String(period), { saved, cleared, errors: errors.length }); D.bump(); }
    res.json({ saved, cleared, errors });
  });
  app.post("/api/mgmt-fc/approve", authed, roles("admin", "executive"), (req, res) => {
    const { period, keys } = req.body || {};
    if (!period || !Array.isArray(keys) || !keys.length) return res.status(400).json({ message: "Pick entries to approve." });
    const st = D.db.prepare("UPDATE mgmt_fc SET status='approved', approved_by=?, approved_at=? WHERE period=? AND entity=? AND project_id=? AND status<>'approved'");
    let n = 0; D.db.transaction(() => { for (const k of keys) { const [e, p] = String(k).split("|"); if (e && p && inScope(req.user!, e)) n += st.run(req.user!.name, D.now(), String(period), e, p).changes; } })();
    D.audit(who(req.user!), "mgmtfc.approve", String(period), { approved: n }); D.bump(); res.json({ approved: n });
  });

  app.get("/api/repro-targets", authed, (_req, res) => res.json(REPRO_TARGETS));
  /* bonds */
  app.get("/api/bonds", authed, (_req, res) => res.json(D.db.prepare("SELECT * FROM bonds_ref ORDER BY id").all()));

  /* bid pipeline */
  const oppOut = (o: any) => ({ ...o, bonded: !!o.bonded, sample: !!o.sample });
  app.get("/api/opps", authed, (_req, res) => res.json((D.db.prepare("SELECT * FROM opportunities ORDER BY seq DESC").all() as any[]).map(oppOut)));
  const OPP_F = ["entity", "name", "customer", "bid_date", "value", "probability", "stage", "start_month", "duration", "margin", "bonded", "owner", "linked", "notes"];
  const STAGES = ["Opportunity", "Bid", "Award", "Project Setup", "Lost", "No Bid"];
  function cleanOpp(b: any) {
    const o: any = {};
    for (const k of OPP_F) if (k in b) o[k] = b[k] === "" ? null : b[k];
    for (const k of ["value", "probability", "margin", "duration"]) if (o[k] !== undefined && o[k] !== null) { o[k] = Number(o[k]); if (!Number.isFinite(o[k])) throw new Error(`${k} must be a number`); }
    if (o.probability !== undefined && o.probability !== null && (o.probability < 0 || o.probability > 1)) throw new Error("Probability is 0–100%");
    if (o.stage !== undefined && !STAGES.includes(o.stage)) throw new Error("Unknown stage");
    if (o.bonded !== undefined) o.bonded = o.bonded ? 1 : 0;
    return o;
  }
  app.post("/api/opps", authed, roles(...EDIT), (req, res) => {
    try {
      const o = cleanOpp(req.body || {}); if (!o.name) return res.status(400).json({ message: "Name the opportunity." });
      const seq = ((D.db.prepare("SELECT MAX(seq) m FROM opportunities").get() as any).m || 0) + 1; const id = `OPP-${String(seq).padStart(4, "0")}`;
      const full = { entity: null, customer: null, bid_date: null, value: null, probability: null, stage: "Opportunity", start_month: null, duration: null, margin: null, bonded: 0, owner: null, linked: null, notes: null, ...o };
      D.db.prepare(`INSERT INTO opportunities(id,seq,${OPP_F.join(",")},sample,created_at,updated_at,updated_by) VALUES(@id,@seq,${OPP_F.map((k) => "@" + k).join(",")},0,@t,@t,@by)`).run({ ...full, id, seq, t: D.now(), by: req.user!.name });
      D.audit(who(req.user!), "opp.create", id, full); D.bump(); res.json({ id });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.patch("/api/opps/:id", authed, roles(...EDIT), (req, res) => {
    try {
      const o = cleanOpp(req.body || {}); const ks = Object.keys(o); if (!ks.length) return res.json({ ok: true });
      D.db.prepare(`UPDATE opportunities SET ${ks.map((k) => `${k}=@${k}`).join(",")}, updated_at=@t, updated_by=@by WHERE id=@id`).run({ ...o, id: String(req.params.id), t: D.now(), by: req.user!.name });
      D.audit(who(req.user!), "opp.update", String(req.params.id), o); D.bump(); res.json({ ok: true });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });
  app.delete("/api/opps/:id", authed, roles(...EDIT), (req, res) => { D.db.prepare("DELETE FROM opportunities WHERE id=?").run(String(req.params.id)); D.audit(who(req.user!), "opp.delete", String(req.params.id)); D.bump(); res.json({ ok: true }); });

  /* month-end reconciliation layer */
  app.get("/api/recon", authed, (req, res) => res.json((D.db.prepare("SELECT * FROM recon WHERE period=? ORDER BY entity, project_id").all(String(req.query.period || "")) as any[]).filter((r) => inScope(req.user!, r.entity))));
  const insRecon = D.db.prepare("INSERT INTO recon(id,period,entity,project_id,project_name,cp,hcss,procore,open_ap,eac,prior_eac,approved_co,pending_co,mgmt_adj,adj_reason,owner,status,sample,import_id,updated_at,updated_by) VALUES(@id,@period,@entity,@project_id,@project_name,@cp,@hcss,@procore,@open_ap,@eac,@prior_eac,@approved_co,@pending_co,@mgmt_adj,@adj_reason,@owner,'Open',@sample,@import_id,@t,@by)");
  const reconDefaults = { entity: null, project_id: null, project_name: null, cp: null, hcss: null, procore: null, open_ap: null, eac: null, prior_eac: null, approved_co: null, pending_co: null, mgmt_adj: null, adj_reason: null, owner: null };
  app.post("/api/recon/import", authed, roles(...EDIT), async (req, res) => {
    try {
      const { filename, contentBase64, period: per } = req.body || {}; if (!per || !period(per)) return res.status(400).json({ message: "Choose a period." });
      const items = await parseRecon(Buffer.from(String(contentBase64 || ""), "base64"), String(filename || "recon.xlsx"));
      if (!items.length) return res.status(400).json({ message: "No rows with a Project ID were found. Use the reconciliation template headers." });
      const imp = D.uid("RIMP");
      D.db.transaction(() => { D.db.prepare("DELETE FROM recon WHERE period=? AND sample=0").run(per); for (const it of items) insRecon.run({ ...reconDefaults, ...it, id: D.uid("MX"), period: per, sample: 0, import_id: imp, t: D.now(), by: req.user!.name }); })();
      D.audit(who(req.user!), "recon.import", per, { file: filename, rows: items.length }); D.bump(); res.json({ rows: items.length });
    } catch (e: any) { res.status(400).json({ message: e.message || "Couldn’t read that file." }); }
  });
  app.post("/api/recon/sample", authed, roles(...EDIT), (req, res) => {
    const per = String(req.body?.period || ""); if (!period(per)) return res.status(400).json({ message: "Choose a period." });
    const rows = periodRows(per).filter((r) => r.eligible && r.A !== null);
    let seed = 20260731; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    D.db.transaction(() => {
      D.db.prepare("DELETE FROM recon WHERE period=? AND sample=1").run(per);
      for (const r of rows) {
        const A = r.A || 0, E = r.E || 0, u = rnd();
        let hcss = A, open_ap: number | null = null, mgmt_adj: number | null = null, adj_reason: string | null = null, prior = E, aco: number | null = null;
        if (u < 0.12) hcss = A + (rnd() - 0.5) * 3000;
        else if (u < 0.2) { open_ap = Math.round(20000 + rnd() * 180000); hcss = A + open_ap; }
        else if (u < 0.25) { mgmt_adj = Math.round(-(40000 + rnd() * 400000)); adj_reason = "Equipment rate true-up posted in CostPoint after HCSS close (sample)"; hcss = A + mgmt_adj; }
        else if (u < 0.3) hcss = A + Math.round(60000 + rnd() * 500000);
        const v = rnd();
        if (v < 0.1) { aco = Math.round(E * (0.03 + rnd() * 0.05)); prior = E - aco; }
        else if (v < 0.15) prior = E * (1 - (0.04 + rnd() * 0.06));
        else prior = E * (1 - rnd() * 0.01);
        insRecon.run({ ...reconDefaults, id: D.uid("MX"), period: per, entity: r.entity, project_id: r.projectId, project_name: r.projectName, cp: A, hcss: Math.round(hcss * 100) / 100, open_ap, eac: E, prior_eac: Math.round(prior * 100) / 100, approved_co: aco, pending_co: v > 0.93 ? Math.round((r.C || 0) * 0.12) : null, mgmt_adj, adj_reason, sample: 1, import_id: null, t: D.now(), by: req.user!.name });
      }
    })();
    D.audit(who(req.user!), "recon.sample", per, { rows: rows.length }); D.bump(); res.json({ rows: rows.length });
  });
  app.delete("/api/recon/sample", authed, roles(...EDIT), (req, res) => { D.db.prepare("DELETE FROM recon WHERE period=? AND sample=1").run(String(req.query.period || "")); D.bump(); res.json({ ok: true }); });
  app.patch("/api/recon/:id", authed, roles(...REVIEW), (req, res) => {
    const { status, owner, note } = req.body || {};
    if (status && !["Open", "In review", "Resolved", "Accepted"].includes(status)) return res.status(400).json({ message: "Unknown status" });
    D.db.prepare("UPDATE recon SET status=COALESCE(?,status), owner=COALESCE(?,owner), note=COALESCE(?,note), updated_at=?, updated_by=? WHERE id=?").run(status || null, owner || null, note || null, D.now(), req.user!.name, String(req.params.id));
    D.audit(who(req.user!), "recon.update", String(req.params.id), req.body); D.bump(); res.json({ ok: true });
  });

  /* rules */
  app.put("/api/rules", authed, roles("admin", "executive"), (req, res) => {
    const list = req.body?.rules as Rule[]; if (!Array.isArray(list)) return res.status(400).json({ message: "Send the rule list." });
    const cur = getRules(); const next = list.map((r) => { const c = cur.find((x) => x.id === r.id); const changed = c && JSON.stringify({ ...c, version: 0 }) !== JSON.stringify({ ...r, version: 0 }); return { ...r, version: (c?.version || 1) + (changed ? 1 : 0) }; });
    D.setSetting("rules", next); D.audit(who(req.user!), "rules.update", null, { reason: req.body?.reason || null, rules: next.map((r) => ({ id: r.id, active: r.active, version: r.version })) }); res.json(next);
  });
  app.post("/api/rules/reset", authed, roles("admin"), (req, res) => { D.setSetting("rules", DEFAULT_RULES); D.audit(who(req.user!), "rules.reset", null); res.json(DEFAULT_RULES); });

  /* users */
  app.get("/api/users", authed, roles("admin", "executive"), (_req, res) => res.json(D.listUsers().map(pubUser).map((u, i) => ({ ...u, active: !!D.listUsers()[i].active, lastLogin: D.listUsers()[i].last_login }))));
  app.post("/api/users", authed, roles("admin"), (req, res) => {
    const { name, login, email, title, role, scope } = req.body || {};
    if (!name || !login) return res.status(400).json({ message: "Name and username are required." });
    if (!Object.keys(D.ROLE_LABEL).includes(role)) return res.status(400).json({ message: "Pick a role." });
    if (D.userAuth(login)) return res.status(409).json({ message: "That username is taken." });
    const pw = D.tempPassword(); const u = D.addUser({ name, login, email, title, role, scope: scope || "*", password: pw }, req.user!.id);
    D.audit(who(req.user!), "user.create", u.id, { login, role, scope }); res.json({ user: pubUser(u), tempPassword: pw });
  });
  app.patch("/api/users/:id", authed, roles("admin"), (req, res) => {
    const u = D.userById(String(req.params.id)); if (!u) return res.status(404).json({ message: "Not found" });
    const { name, email, title, role, scope, active, login } = req.body || {};
    if (u.id === req.user!.id && (active === false || (role && role !== "admin"))) return res.status(400).json({ message: "You can’t remove your own admin access." });
    D.db.prepare("UPDATE users SET name=?, login=?, email=?, title=?, role=?, scope=?, active=? WHERE id=?").run(name ?? u.name, (login ?? u.login).toLowerCase(), email === undefined ? u.email : email || null, title === undefined ? u.title : title || null, role ?? u.role, scope ?? u.scope, active === undefined ? u.active : active ? 1 : 0, u.id);
    if (active === false) D.endUserSessions(u.id);
    D.audit(who(req.user!), "user.update", u.id, req.body); D.bump(); res.json({ ok: true });
  });
  app.post("/api/users/:id/reset", authed, roles("admin"), (req, res) => { const u = D.userById(String(req.params.id)); if (!u) return res.status(404).json({ message: "Not found" }); const pw = D.tempPassword(); D.setPassword(u.id, pw, true); D.endUserSessions(u.id); D.audit(who(req.user!), "user.reset", u.id); res.json({ tempPassword: pw }); });

  app.get("/api/audit", authed, roles("admin", "executive", "finance"), (req, res) => res.json(D.db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT ?").all(Math.min(Number(req.query.limit) || 300, 2000))));

  return httpServer;
}
