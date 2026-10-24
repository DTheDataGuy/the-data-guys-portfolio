import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { DATASET_MAP, type DatasetDef, type FieldDef, type Role, DOMAINS } from "@shared/contracts";
import type { RecordRow, ImportBatch, AuditEvent, ReportView } from "@shared/schema";

export interface Ctx {
  user: string;
  role: Role;
  demo: boolean;
}

export interface Issue {
  row: number; // 1-based data row (0 = file level)
  field?: string;
  severity: "error" | "warning";
  message: string;
}

const now = () => new Date().toISOString();

const DDL = `
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset TEXT NOT NULL, business_key TEXT NOT NULL, payload TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft', version INTEGER NOT NULL DEFAULT 1, supersedes_id INTEGER,
  is_demo INTEGER NOT NULL DEFAULT 0, source_type TEXT NOT NULL DEFAULT 'manual', batch_id INTEGER,
  source_row_ref TEXT, fingerprint TEXT, period_date TEXT,
  created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_by TEXT, updated_at TEXT,
  submitted_by TEXT, approved_by TEXT, approved_at TEXT, revision_reason TEXT, review_note TEXT,
  CHECK (review_status IN ('draft','submitted','returned','approved','superseded','rolled_back','quarantined'))
);
CREATE INDEX IF NOT EXISTS idx_records_ds ON records(dataset, is_demo, review_status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_records_approved ON records(dataset, is_demo, business_key) WHERE review_status = 'approved' AND business_key NOT LIKE 'row:%';
CREATE TABLE IF NOT EXISTS import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT, dataset TEXT NOT NULL, file_name TEXT NOT NULL, checksum TEXT NOT NULL,
  sheet_name TEXT, reporting_period TEXT, mapping TEXT NOT NULL, mapping_version INTEGER NOT NULL DEFAULT 1,
  headers TEXT NOT NULL, raw_rows TEXT NOT NULL, row_count INTEGER NOT NULL, valid_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0, warning_count INTEGER NOT NULL DEFAULT 0, issues TEXT NOT NULL DEFAULT '[]',
  reconciliation TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL, failure_reason TEXT, is_demo INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL, created_at TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, approval_note TEXT
);
CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, role TEXT NOT NULL,
  action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, detail TEXT
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_by TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS report_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, audience TEXT NOT NULL, sections TEXT NOT NULL,
  filters TEXT NOT NULL DEFAULT '{}', release_status TEXT NOT NULL DEFAULT 'draft', is_demo INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL, created_at TEXT NOT NULL, approved_by TEXT, approved_at TEXT
);
CREATE TABLE IF NOT EXISTS period_locks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT NOT NULL, period TEXT NOT NULL, status TEXT NOT NULL,
  by TEXT NOT NULL, at TEXT NOT NULL, reason TEXT
);
`;

function camel<T>(row: any): T {
  if (!row) return row;
  const o: any = {};
  for (const k of Object.keys(row)) o[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = row[k];
  return o as T;
}

// ─────────── value parsing ───────────
export function parseValue(field: FieldDef, raw: any): { value: any; error?: string; warning?: string } {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) return { value: null };
  const s = typeof raw === "string" ? raw.trim() : raw;
  switch (field.type) {
    case "id":
    case "text":
    case "longtext":
      return { value: String(s) };
    case "zip": {
      const z = String(s).trim();
      if (/^\d{4}$/.test(z)) return { value: "0" + z, warning: "4-digit ZIP padded — confirm leading zero" };
      if (!/^\d{5}(-\d{4})?$/.test(z)) return { value: z, warning: `ZIP "${z}" is not a 5-digit code` };
      return { value: z };
    }
    case "date": {
      const d = toISODate(s);
      if (!d) return { value: null, error: `"${s}" is not a valid date (use YYYY-MM-DD or MM/DD/YYYY)` };
      return { value: d };
    }
    case "month": {
      const m = String(s).match(/^(\d{4})[-\s/]?(\d{1,2})$/);
      if (m) return { value: `${m[1]}-${m[2].padStart(2, "0")}` };
      const d = toISODate(s);
      if (d) return { value: d.slice(0, 7) };
      return { value: null, error: `"${s}" is not a valid period (use YYYY-MM)` };
    }
    case "money":
    case "decimal":
    case "percent": {
      let t = String(s).replace(/[$,%\s]/g, "");
      let neg = false;
      if (/^\(.*\)$/.test(t)) {
        neg = true;
        t = t.slice(1, -1);
      }
      const n = Number(t);
      if (!Number.isFinite(n)) return { value: null, error: `"${s}" is not a number` };
      const v = (neg ? -1 : 1) * n;
      if (field.min !== undefined && v < field.min) return { value: v, error: `${field.label} cannot be below ${field.min}` };
      return { value: field.type === "money" ? Math.round(v * 100) / 100 : v };
    }
    case "int": {
      const n = Number(String(s).replace(/,/g, ""));
      if (!Number.isFinite(n)) return { value: null, error: `"${s}" is not a whole number` };
      if (!Number.isInteger(n)) return { value: Math.round(n), warning: `${field.label} rounded to whole number` };
      if (field.min !== undefined && n < field.min) return { value: n, error: `${field.label} cannot be below ${field.min}` };
      return { value: n };
    }
    case "bool":
      return { value: /^(true|yes|1|y)$/i.test(String(s)) };
    case "enum": {
      const opt = field.options?.find((o) => o.toLowerCase() === String(s).toLowerCase());
      if (!opt) return { value: String(s), error: `"${s}" is not an allowed ${field.label} (${field.options?.join(", ")})` };
      return { value: opt };
    }
  }
  return { value: s };
}

export function toISODate(v: any): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Excel serial
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return valid(y, +m[1], +m[2]);
  }
  return null;
}
function valid(y: number, mo: number, d: number) {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function businessKeyOf(def: DatasetDef, p: Record<string, any>, rowRef: string) {
  if (!def.uniqueKey.length) return `row:${rowRef}`;
  return def.uniqueKey.map((k) => String(p[k] ?? "")).join("|");
}

export function fingerprintOf(def: DatasetDef, p: Record<string, any>) {
  if (def.key !== "loan_transaction") return null;
  const parts = ["Transaction_Date", "Transaction_Type", "Transaction_Status", "Source_Account_Number", "Disbursement_Amount", "Principal_Paid", "Interest_Paid", "Fees_Paid", "Total_Payment_Amount"].map((k) => String(p[k] ?? ""));
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
}

export function autoMap(def: DatasetDef, headers: string[]): Record<string, string | null> {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9#$]/g, "");
  const mapping: Record<string, string | null> = {};
  const used = new Set<string>();
  for (const h of headers) {
    const nh = norm(h);
    const hit = def.fields.find(
      (fd) => !used.has(fd.key) && (norm(fd.key) === nh || norm(fd.label) === nh || (fd.aliases || []).some((a) => norm(a) === nh)),
    );
    mapping[h] = hit ? hit.key : null;
    if (hit) used.add(hit.key);
  }
  return mapping;
}

export class Store {
  db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(DDL);
  }

  // ─────────── audit ───────────
  audit(ctx: Ctx, action: string, entity: string, entityId?: string | number | null, detail?: any) {
    this.db
      .prepare("INSERT INTO audit_events (at, actor, role, action, entity, entity_id, detail) VALUES (?,?,?,?,?,?,?)")
      .run(now(), ctx.user, ctx.role, action, entity, entityId == null ? null : String(entityId), detail ? JSON.stringify(detail) : null);
  }
  listAudit(limit = 300): AuditEvent[] {
    return this.db.prepare("SELECT * FROM audit_events ORDER BY id DESC LIMIT ?").all(limit).map((r) => camel<AuditEvent>(r));
  }

  // ─────────── settings ───────────
  getSetting<T>(key: string, fallback: T): T {
    const r: any = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return r ? (JSON.parse(r.value) as T) : fallback;
  }
  setSetting(ctx: Ctx, key: string, value: any) {
    this.db
      .prepare("INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=excluded.updated_at")
      .run(key, JSON.stringify(value), ctx.user, now());
    this.audit(ctx, "setting.update", "settings", key, value);
  }

  // ─────────── records ───────────
  rows(dataset: string, demo: boolean, statuses: string[] = ["approved"]): (Record<string, any> & { _id: number; _status: string; _batch: number | null })[] {
    const q = `SELECT id, payload, review_status, batch_id FROM records WHERE dataset = ? AND is_demo = ? AND review_status IN (${statuses.map(() => "?").join(",")}) ORDER BY id`;
    return this.db
      .prepare(q)
      .all(dataset, demo ? 1 : 0, ...statuses)
      .map((r: any) => ({ ...JSON.parse(r.payload), _id: r.id, _status: r.review_status, _batch: r.batch_id }));
  }
  listRecords(dataset: string, demo: boolean, statuses?: string[]): RecordRow[] {
    const st = statuses && statuses.length ? statuses : ["draft", "submitted", "returned", "approved", "quarantined"];
    return this.db
      .prepare(`SELECT * FROM records WHERE dataset = ? AND is_demo = ? AND review_status IN (${st.map(() => "?").join(",")}) ORDER BY id DESC`)
      .all(dataset, demo ? 1 : 0, ...st)
      .map((r) => camel<RecordRow>(r));
  }
  getRecord(id: number): RecordRow | undefined {
    return camel<RecordRow>(this.db.prepare("SELECT * FROM records WHERE id = ?").get(id));
  }
  history(id: number): RecordRow[] {
    // walk supersedes chain both directions
    const out: RecordRow[] = [];
    let cur = this.getRecord(id);
    while (cur) {
      out.push(cur);
      cur = cur.supersedesId ? this.getRecord(cur.supersedesId) : undefined;
    }
    return out;
  }
  queueCounts(demo: boolean) {
    return this.db
      .prepare("SELECT dataset, review_status as status, COUNT(*) as n FROM records WHERE is_demo = ? AND review_status IN ('draft','submitted','returned','quarantined') GROUP BY dataset, review_status")
      .all(demo ? 1 : 0) as { dataset: string; status: string; n: number }[];
  }
  datasetCounts(demo: boolean) {
    return this.db
      .prepare("SELECT dataset, COUNT(*) as n, MAX(approved_at) as last FROM records WHERE is_demo = ? AND review_status = 'approved' GROUP BY dataset")
      .all(demo ? 1 : 0) as { dataset: string; n: number; last: string }[];
  }

  validatePayload(def: DatasetDef, input: Record<string, any>, demo: boolean, batchKeys?: Map<string, Set<string>>): { payload: Record<string, any>; issues: Omit<Issue, "row">[] } {
    const payload: Record<string, any> = {};
    const issues: Omit<Issue, "row">[] = [];
    for (const fd of def.fields) {
      const r = parseValue(fd, input[fd.key]);
      payload[fd.key] = r.value;
      if (r.error) issues.push({ field: fd.key, severity: "error", message: r.error });
      else if (r.warning) issues.push({ field: fd.key, severity: "warning", message: r.warning });
      if (fd.required && (r.value === null || r.value === undefined) && !r.error)
        issues.push({ field: fd.key, severity: "error", message: `${fd.label} is required` });
      if (fd.ref && r.value != null && !r.error) {
        const inBatch = batchKeys?.get(`${fd.ref.dataset}.${fd.ref.field}`)?.has(String(r.value));
        if (!inBatch && !this.refExists(fd.ref.dataset, fd.ref.field, String(r.value), demo))
          issues.push({ field: fd.key, severity: "error", message: `Unknown ${fd.label} "${r.value}" — no approved ${DATASET_MAP[fd.ref.dataset]?.label ?? fd.ref.dataset} record` });
      }
    }
    return { payload, issues };
  }
  refCache = new Map<string, Set<string>>();
  refExists(dataset: string, field: string, value: string, demo: boolean) {
    const k = `${dataset}.${field}.${demo}`;
    let s = this.refCache.get(k);
    if (!s) {
      s = new Set(this.rows(dataset, demo).map((r) => String(r[field])));
      // NED accounts become valid loan accounts once mapped in the migration crosswalk
      if (dataset === "loan" && field === "Source_Account_Number")
        for (const c of this.rows("ned_crosswalk", demo)) if (c.NED_Account) s.add(String(c.NED_Account));
      this.refCache.set(k, s);
    }
    return s.has(value);
  }
  invalidateRefs() {
    this.refCache.clear();
  }

  isLocked(def: DatasetDef, payload: Record<string, any>) {
    if (!def.dateField || !payload[def.dateField]) return false;
    const period = String(payload[def.dateField]).slice(0, 7);
    const r: any = this.db.prepare("SELECT status FROM period_locks WHERE domain = ? AND period = ? ORDER BY id DESC LIMIT 1").get(def.domain, period);
    return r?.status === "closed";
  }

  createRecord(ctx: Ctx, dataset: string, input: Record<string, any>, submit: boolean) {
    const def = DATASET_MAP[dataset];
    if (!def) throw new HttpError(404, "Unknown dataset");
    const { payload, issues } = this.validatePayload(def, input, ctx.demo);
    const errors = issues.filter((i) => i.severity === "error");
    if (submit && errors.length) throw new HttpError(422, "Validation failed", issues);
    if (this.isLocked(def, payload)) throw new HttpError(423, `Period ${String(payload[def.dateField!]).slice(0, 7)} is closed for ${DOMAINS[def.domain].label}. Reopen it (audited) to edit.`);
    const ref = `manual-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const key = businessKeyOf(def, payload, ref);
    if (def.uniqueKey.length) {
      const dup: any = this.db.prepare("SELECT id FROM records WHERE dataset=? AND is_demo=? AND business_key=? AND review_status IN ('approved','submitted','draft')").get(dataset, ctx.demo ? 1 : 0, key);
      if (dup && !def.snapshotKey) throw new HttpError(409, `A record with ${def.uniqueKey.join(" + ")} = ${key} already exists (#${dup.id}). Edit it to create a correction.`);
    }
    const t = now();
    const info = this.db
      .prepare(
        `INSERT INTO records (dataset, business_key, payload, review_status, is_demo, source_type, source_row_ref, fingerprint, period_date, created_by, created_at, updated_by, updated_at, submitted_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(dataset, key, JSON.stringify(payload), submit ? "submitted" : "draft", ctx.demo ? 1 : 0, "manual", ref, fingerprintOf(def, payload), def.dateField ? payload[def.dateField] : null, ctx.user, t, ctx.user, t, submit ? ctx.user : null);
    this.audit(ctx, submit ? "record.submit" : "record.draft", dataset, info.lastInsertRowid, { key });
    return { id: Number(info.lastInsertRowid), issues };
  }

  updateRecord(ctx: Ctx, id: number, input: Record<string, any>, reason: string | undefined, expectedUpdatedAt?: string, submit?: boolean) {
    const rec = this.getRecord(id);
    if (!rec) throw new HttpError(404, "Record not found");
    const def = DATASET_MAP[rec.dataset];
    const { payload, issues } = this.validatePayload(def, input, !!rec.isDemo);
    if (submit && issues.some((i) => i.severity === "error")) throw new HttpError(422, "Validation failed", issues);
    if (this.isLocked(def, payload) || this.isLocked(def, JSON.parse(rec.payload))) throw new HttpError(423, "This reporting period is closed. Reopen it to make corrections.");
    if (rec.reviewStatus === "approved") {
      if (!reason) throw new HttpError(422, "A revision reason is required to correct approved data");
      // correction → new version; prior approved version preserved and stays published until approval
      const t = now();
      const info = this.db
        .prepare(
          `INSERT INTO records (dataset, business_key, payload, review_status, version, supersedes_id, is_demo, source_type, batch_id, source_row_ref, fingerprint, period_date, created_by, created_at, updated_by, updated_at, submitted_by, revision_reason)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(rec.dataset, businessKeyOf(def, payload, rec.sourceRowRef || String(id)), JSON.stringify(payload), submit ? "submitted" : "draft", rec.version + 1, rec.id, rec.isDemo, "correction", rec.batchId, rec.sourceRowRef, fingerprintOf(def, payload), def.dateField ? payload[def.dateField] : null, ctx.user, t, ctx.user, t, submit ? ctx.user : null, reason);
      this.audit(ctx, "record.correction", rec.dataset, info.lastInsertRowid, { supersedes: id, reason });
      return { id: Number(info.lastInsertRowid), issues, correction: true };
    }
    if (!["draft", "returned", "quarantined"].includes(rec.reviewStatus)) throw new HttpError(409, `Cannot edit a ${rec.reviewStatus} record`);
    if (expectedUpdatedAt && rec.updatedAt !== expectedUpdatedAt) throw new HttpError(409, "This record was changed by someone else. Reload before saving.");
    this.db
      .prepare("UPDATE records SET payload=?, business_key=?, fingerprint=?, period_date=?, updated_by=?, updated_at=?, review_status=?, submitted_by=COALESCE(?, submitted_by), revision_reason=COALESCE(?, revision_reason) WHERE id=?")
      .run(JSON.stringify(payload), businessKeyOf(def, payload, rec.sourceRowRef || String(id)), fingerprintOf(def, payload), def.dateField ? payload[def.dateField] : null, ctx.user, now(), submit ? "submitted" : rec.reviewStatus === "quarantined" ? "quarantined" : "draft", submit ? ctx.user : null, reason ?? null, id);
    this.audit(ctx, submit ? "record.submit" : "record.update", rec.dataset, id);
    return { id, issues };
  }

  transition(ctx: Ctx, id: number, action: "approve" | "return" | "submit" | "discard", note?: string) {
    const rec = this.getRecord(id);
    if (!rec) throw new HttpError(404, "Record not found");
    const def = DATASET_MAP[rec.dataset];
    const allowed: Record<string, string[]> = { submit: ["draft", "returned", "quarantined"], approve: ["submitted"], return: ["submitted"], discard: ["draft", "returned", "quarantined"] };
    if (!allowed[action].includes(rec.reviewStatus)) throw new HttpError(409, `Cannot ${action} a ${rec.reviewStatus} record`);
    if (action === "submit") {
      const { issues } = this.validatePayload(def, JSON.parse(rec.payload), !!rec.isDemo);
      if (issues.some((i) => i.severity === "error")) throw new HttpError(422, "Validation failed", issues);
    }
    if (action === "approve" && rec.submittedBy === ctx.user && ctx.role !== "admin") throw new HttpError(403, "Reviewer must differ from submitter");
    const t = now();
    const tx = this.db.transaction(() => {
      if (action === "approve") {
        if (rec.supersedesId) this.db.prepare("UPDATE records SET review_status='superseded' WHERE id=? AND review_status='approved'").run(rec.supersedesId);
        // snapshot slice replacement / same-key replacement
        const prior: any = this.db.prepare("SELECT id FROM records WHERE dataset=? AND is_demo=? AND business_key=? AND review_status='approved' AND id<>?").get(rec.dataset, rec.isDemo, rec.businessKey, id);
        if (prior) {
          if (!def.snapshotKey && !rec.supersedesId) throw new HttpError(409, "An approved record with the same key exists — submit a correction instead");
          this.db.prepare("UPDATE records SET review_status='superseded' WHERE id=?").run(prior.id);
          if (!rec.supersedesId) this.db.prepare("UPDATE records SET supersedes_id=? WHERE id=?").run(prior.id, id);
        }
        this.db.prepare("UPDATE records SET review_status='approved', approved_by=?, approved_at=?, review_note=? WHERE id=?").run(ctx.user, t, note ?? null, id);
      } else if (action === "return") {
        if (!note) throw new HttpError(422, "A reason is required when returning a submission");
        this.db.prepare("UPDATE records SET review_status='returned', review_note=?, updated_at=? WHERE id=?").run(note, t, id);
      } else if (action === "submit") {
        this.db.prepare("UPDATE records SET review_status='submitted', submitted_by=?, updated_at=? WHERE id=?").run(ctx.user, t, id);
      } else if (action === "discard") {
        this.db.prepare("UPDATE records SET review_status='rolled_back', updated_at=?, review_note=? WHERE id=?").run(t, note ?? "Discarded draft", id);
      }
    });
    tx();
    this.invalidateRefs();
    this.audit(ctx, `record.${action}`, rec.dataset, id, note ? { note } : undefined);
  }

  // ─────────── imports ───────────
  stageImport(ctx: Ctx, dataset: string, fileName: string, checksum: string, headers: string[], rows: Record<string, any>[], sheetName?: string, reportingPeriod?: string, mappingOverride?: Record<string, string | null>) {
    const def = DATASET_MAP[dataset];
    if (!def) throw new HttpError(404, "Unknown dataset");
    const mapping = mappingOverride ?? autoMap(def, headers);
    const t = now();
    const prior: any = this.db.prepare("SELECT id FROM import_batches WHERE dataset=? AND checksum=? AND is_demo=? AND status IN ('approved','partially_approved')").get(dataset, checksum, ctx.demo ? 1 : 0);
    const info = this.db
      .prepare(
        `INSERT INTO import_batches (dataset, file_name, checksum, sheet_name, reporting_period, mapping, headers, raw_rows, row_count, status, is_demo, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(dataset, fileName, checksum, sheetName ?? null, reportingPeriod ?? null, JSON.stringify(mapping), JSON.stringify(headers), JSON.stringify(rows), rows.length, "staged", ctx.demo ? 1 : 0, ctx.user, t);
    const id = Number(info.lastInsertRowid);
    this.audit(ctx, "import.upload", dataset, id, { fileName, checksum, rows: rows.length });
    if (prior) {
      this.db.prepare("UPDATE import_batches SET status='duplicate', failure_reason=? WHERE id=?").run(`Identical file already approved in batch #${prior.id}. No rows will be added (idempotent reimport).`, id);
      return this.getBatch(id)!;
    }
    this.revalidate(ctx, id);
    return this.getBatch(id)!;
  }

  getBatch(id: number): (ImportBatch & { parsedIssues: Issue[] }) | undefined {
    const b = camel<ImportBatch>(this.db.prepare("SELECT * FROM import_batches WHERE id=?").get(id));
    if (!b) return undefined;
    return { ...b, parsedIssues: JSON.parse(b.issues) };
  }
  listBatches(demo: boolean): ImportBatch[] {
    return this.db
      .prepare("SELECT id, dataset, file_name, checksum, reporting_period, row_count, valid_count, error_count, warning_count, status, failure_reason, created_by, created_at, reviewed_by, reviewed_at, approval_note, mapping_version, reconciliation FROM import_batches WHERE is_demo=? ORDER BY id DESC")
      .all(demo ? 1 : 0)
      .map((r) => camel<ImportBatch>(r));
  }

  mapRows(def: DatasetDef, mapping: Record<string, string | null>, rows: Record<string, any>[]) {
    return rows.map((r) => {
      const o: Record<string, any> = {};
      for (const [src, dst] of Object.entries(mapping)) if (dst) o[dst] = r[src];
      return o;
    });
  }

  revalidate(ctx: Ctx, id: number, newMapping?: Record<string, string | null>) {
    const b = this.getBatch(id);
    if (!b) throw new HttpError(404, "Batch not found");
    if (!["staged", "failed"].includes(b.status)) throw new HttpError(409, `Batch is ${b.status}`);
    const def = DATASET_MAP[b.dataset];
    const mapping = newMapping ?? JSON.parse(b.mapping);
    const rows = JSON.parse(b.rawRows) as Record<string, any>[];
    const issues: Issue[] = [];
    const mappedFields = new Set(Object.values(mapping).filter(Boolean) as string[]);
    const missingRequired = def.fields.filter((fd) => fd.required && !mappedFields.has(fd.key));
    for (const h of Object.keys(mapping)) if (!mapping[h]) issues.push({ row: 0, severity: "warning", message: `Column "${h}" is not mapped and will be ignored` });
    let status = "staged";
    let failure: string | null = null;
    if (missingRequired.length) {
      status = "failed";
      failure = `Schema drift: required columns missing — ${missingRequired.map((m) => `${m.label} (${m.key})`).join(", ")}. Map them or obtain a corrected export.`;
      issues.unshift({ row: 0, severity: "error", message: failure });
    }
    // batch-local keys for in-file references (e.g. loans + allocations in the same file)
    const mapped = this.mapRows(def, mapping, rows);
    const batchKeys = new Map<string, Set<string>>();
    for (const fd of def.fields) batchKeys.set(`${def.key}.${fd.key}`, new Set(mapped.map((m) => String(m[fd.key] ?? ""))));
    const seenKeys = new Map<string, number>();
    const seenFp = new Map<string, number>();
    let valid = 0;
    const money: Record<string, number> = {};
    const typeStatus: Record<string, number> = {};
    let replaces = 0;
    if (status !== "failed") {
      mapped.forEach((m, i) => {
        const rowNo = i + 1;
        const { payload, issues: ri } = this.validatePayload(def, m, !!b.isDemo, batchKeys);
        ri.forEach((x) => issues.push({ ...x, row: rowNo }));
        const key = businessKeyOf(def, payload, `${b.checksum}:${rowNo}`);
        if (def.uniqueKey.length) {
          if (seenKeys.has(key)) issues.push({ row: rowNo, severity: "error", message: `Duplicate key ${key} (also row ${seenKeys.get(key)})` });
          else seenKeys.set(key, rowNo);
          const existing: any = this.db.prepare("SELECT id, payload FROM records WHERE dataset=? AND is_demo=? AND business_key=? AND review_status='approved'").get(def.key, b.isDemo, key);
          if (existing) {
            if (def.snapshotKey) {
              replaces++;
              issues.push({ row: rowNo, severity: "warning", message: `Replaces approved snapshot #${existing.id} for ${key} (prior version retained)` });
            } else if (existing.payload === JSON.stringify(payload)) {
              issues.push({ row: rowNo, severity: "warning", message: `Identical to approved record #${existing.id} — will be skipped` });
            } else {
              issues.push({ row: rowNo, severity: "error", message: `Key ${key} already approved (#${existing.id}) with different values — submit a correction with a reason` });
            }
          }
        }
        const fp = fingerprintOf(def, payload);
        if (fp) {
          if (seenFp.has(fp)) issues.push({ row: rowNo, severity: "warning", message: `Possible duplicate of row ${seenFp.get(fp)} (same date/type/status/account/amounts). Not collapsed — review.` });
          else seenFp.set(fp, rowNo);
          const ex: any = this.db.prepare("SELECT id FROM records WHERE dataset=? AND is_demo=? AND fingerprint=? AND review_status='approved' LIMIT 1").get(def.key, b.isDemo, fp);
          if (ex) issues.push({ row: rowNo, severity: "warning", message: `Matches approved transaction #${ex.id} by fingerprint — possible re-import of the same activity` });
          const ts = `${payload.Transaction_Type}/${payload.Transaction_Status}`;
          typeStatus[ts] = (typeStatus[ts] || 0) + 1;
        }
        if (!ri.some((x) => x.severity === "error")) valid++;
        for (const fd of def.fields) if (fd.type === "money" && typeof payload[fd.key] === "number") money[fd.key] = (money[fd.key] || 0) + Math.round(payload[fd.key] * 100);
      });
    }
    const errRows = new Set(issues.filter((x) => x.severity === "error" && x.row > 0).map((x) => x.row));
    const before = (this.db.prepare("SELECT COUNT(*) n FROM records WHERE dataset=? AND is_demo=? AND review_status='approved'").get(def.key, b.isDemo) as any).n;
    const recon = {
      rowsInFile: rows.length,
      validRows: status === "failed" ? 0 : rows.length - errRows.size,
      errorRows: errRows.size,
      approvedBefore: before,
      approvedAfterIfFull: before + (status === "failed" ? 0 : rows.length - errRows.size - replaces),
      replacesSnapshotRows: replaces,
      moneyTotals: Object.fromEntries(Object.entries(money).map(([k, v]) => [k, v / 100])),
      typeStatusCounts: typeStatus,
    };
    this.db
      .prepare("UPDATE import_batches SET mapping=?, mapping_version=mapping_version + ?, issues=?, valid_count=?, error_count=?, warning_count=?, status=?, failure_reason=?, reconciliation=? WHERE id=?")
      .run(JSON.stringify(mapping), newMapping ? 1 : 0, JSON.stringify(issues), recon.validRows, issues.filter((x) => x.severity === "error").length, issues.filter((x) => x.severity === "warning").length, status, failure, JSON.stringify(recon), id);
    if (newMapping) this.audit(ctx, "import.remap", def.key, id, { mapping });
    if (status === "failed") this.audit(ctx, "import.failed", def.key, id, { reason: failure });
    return this.getBatch(id)!;
  }

  submitBatch(ctx: Ctx, id: number) {
    const b = this.getBatch(id);
    if (!b || b.status !== "staged") throw new HttpError(409, "Only staged batches can be submitted");
    this.db.prepare("UPDATE import_batches SET status='submitted' WHERE id=?").run(id);
    this.audit(ctx, "import.submit", b.dataset, id);
  }

  approveBatch(ctx: Ctx, id: number, opts: { partial?: boolean; note?: string }) {
    const b = this.getBatch(id);
    if (!b || b.status !== "submitted") throw new HttpError(409, "Only submitted batches can be approved");
    if (b.createdBy === ctx.user && ctx.role !== "admin") throw new HttpError(403, "Approver must differ from uploader");
    const def = DATASET_MAP[b.dataset];
    const issues = b.parsedIssues;
    const errRows = new Set(issues.filter((x) => x.severity === "error" && x.row > 0).map((x) => x.row));
    if (errRows.size && !opts.partial) throw new HttpError(422, `${errRows.size} rows have errors. Fix the file, or approve a documented partial batch.`);
    if (opts.partial && !opts.note) throw new HttpError(422, "A partial approval requires a documented reason");
    if (errRows.size >= b.rowCount) throw new HttpError(422, "Every row has errors — nothing to approve. Reject the batch or fix the file.");
    const mapping = JSON.parse(b.mapping);
    const mapped = this.mapRows(def, mapping, JSON.parse(b.rawRows));
    const batchKeys = new Map<string, Set<string>>();
    for (const fd of def.fields) batchKeys.set(`${def.key}.${fd.key}`, new Set(mapped.map((m) => String(m[fd.key] ?? ""))));
    const t = now();
    let inserted = 0,
      skipped = 0,
      quarantined = 0;
    const tx = this.db.transaction(() => {
      mapped.forEach((m, i) => {
        const rowNo = i + 1;
        const { payload } = this.validatePayload(def, m, !!b.isDemo, batchKeys);
        const ref = `${b.checksum.slice(0, 12)}:${rowNo}`;
        const key = businessKeyOf(def, payload, ref);
        const fp = fingerprintOf(def, payload);
        if (errRows.has(rowNo)) {
          this.db
            .prepare(`INSERT INTO records (dataset, business_key, payload, review_status, is_demo, source_type, batch_id, source_row_ref, fingerprint, period_date, created_by, created_at, review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
            .run(def.key, `row:${ref}`, JSON.stringify(payload), "quarantined", b.isDemo, "import", id, ref, fp, def.dateField ? payload[def.dateField] : null, b.createdBy, t, issues.filter((x) => x.row === rowNo).map((x) => x.message).join("; "));
          quarantined++;
          return;
        }
        let supersedes: number | null = null;
        if (def.uniqueKey.length) {
          const existing: any = this.db.prepare("SELECT id, payload FROM records WHERE dataset=? AND is_demo=? AND business_key=? AND review_status='approved'").get(def.key, b.isDemo, key);
          if (existing) {
            if (existing.payload === JSON.stringify(payload)) {
              skipped++;
              return;
            }
            if (!def.snapshotKey) throw new HttpError(409, `Row ${rowNo} conflicts with approved record #${existing.id}`);
            this.db.prepare("UPDATE records SET review_status='superseded' WHERE id=?").run(existing.id);
            supersedes = existing.id;
          }
        }
        this.db
          .prepare(
            `INSERT INTO records (dataset, business_key, payload, review_status, version, supersedes_id, is_demo, source_type, batch_id, source_row_ref, fingerprint, period_date, created_by, created_at, submitted_by, approved_by, approved_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          )
          .run(def.key, key, JSON.stringify(payload), "approved", supersedes ? 2 : 1, supersedes, b.isDemo, "import", id, ref, fp, def.dateField ? payload[def.dateField] : null, b.createdBy, t, b.createdBy, ctx.user, t);
        inserted++;
      });
      this.db
        .prepare("UPDATE import_batches SET status=?, reviewed_by=?, reviewed_at=?, approval_note=? WHERE id=?")
        .run(errRows.size ? "partially_approved" : "approved", ctx.user, t, opts.note ?? null, id);
    });
    tx();
    this.invalidateRefs();
    this.audit(ctx, "import.approve", def.key, id, { inserted, skipped, quarantined, partial: !!opts.partial, note: opts.note });
    return { inserted, skipped, quarantined };
  }

  rejectBatch(ctx: Ctx, id: number, note: string) {
    const b = this.getBatch(id);
    if (!b || !["staged", "submitted", "failed"].includes(b.status)) throw new HttpError(409, "Batch cannot be rejected");
    this.db.prepare("UPDATE import_batches SET status='rejected', reviewed_by=?, reviewed_at=?, approval_note=? WHERE id=?").run(ctx.user, now(), note, id);
    this.audit(ctx, "import.reject", b.dataset, id, { note });
  }

  rollbackBatch(ctx: Ctx, id: number, note: string) {
    const b = this.getBatch(id);
    if (!b || !["approved", "partially_approved"].includes(b.status)) throw new HttpError(409, "Only approved batches can be rolled back");
    if (!note) throw new HttpError(422, "A rollback reason is required");
    const tx = this.db.transaction(() => {
      const recs: any[] = this.db.prepare("SELECT id, supersedes_id FROM records WHERE batch_id=? AND review_status IN ('approved','quarantined')").all(id);
      for (const r of recs) {
        this.db.prepare("UPDATE records SET review_status='rolled_back', review_note=? WHERE id=?").run(`Rolled back: ${note}`, r.id);
        if (r.supersedes_id) this.db.prepare("UPDATE records SET review_status='approved' WHERE id=? AND review_status='superseded'").run(r.supersedes_id);
      }
      this.db.prepare("UPDATE import_batches SET status='rolled_back', approval_note=? WHERE id=?").run(note, id);
    });
    tx();
    this.invalidateRefs();
    this.audit(ctx, "import.rollback", b.dataset, id, { note });
  }

  lastImports(demo: boolean) {
    const ok = this.db
      .prepare("SELECT dataset, MAX(reviewed_at) last FROM import_batches WHERE is_demo=? AND status IN ('approved','partially_approved') GROUP BY dataset")
      .all(demo ? 1 : 0) as any[];
    const attempts = this.db
      .prepare("SELECT dataset, status, created_at, failure_reason, id FROM import_batches b WHERE is_demo=? AND id = (SELECT MAX(id) FROM import_batches WHERE dataset=b.dataset AND is_demo=b.is_demo)")
      .all(demo ? 1 : 0) as any[];
    const map: Record<string, { lastSuccess: string | null; lastAttempt: string | null; lastStatus: string | null; failure: string | null; batchId: number | null }> = {};
    for (const r of ok) map[r.dataset] = { lastSuccess: r.last, lastAttempt: null, lastStatus: null, failure: null, batchId: null };
    for (const a of attempts) {
      map[a.dataset] = map[a.dataset] || { lastSuccess: null, lastAttempt: null, lastStatus: null, failure: null, batchId: null };
      Object.assign(map[a.dataset], { lastAttempt: a.created_at, lastStatus: a.status, failure: a.status === "failed" ? a.failure_reason : null, batchId: a.id });
    }
    return map;
  }

  // ─────────── period locks ───────────
  listLocks() {
    return this.db.prepare("SELECT * FROM period_locks ORDER BY id DESC").all().map((r) => camel<any>(r));
  }
  setLock(ctx: Ctx, domain: string, period: string, status: "closed" | "reopened", reason?: string) {
    if (status === "reopened" && !reason) throw new HttpError(422, "Reopening a closed period requires a reason");
    this.db.prepare("INSERT INTO period_locks (domain, period, status, by, at, reason) VALUES (?,?,?,?,?,?)").run(domain, period, status, ctx.user, now(), reason ?? null);
    this.audit(ctx, `period.${status}`, domain, period, { reason });
  }

  // ─────────── report views ───────────
  listViews(demo: boolean): ReportView[] {
    return this.db.prepare("SELECT * FROM report_views WHERE is_demo=? ORDER BY id DESC").all(demo ? 1 : 0).map((r) => camel<ReportView>(r));
  }
  createView(ctx: Ctx, v: { name: string; audience: string; sections: string[]; filters?: any }) {
    const info = this.db
      .prepare("INSERT INTO report_views (name, audience, sections, filters, release_status, is_demo, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)")
      .run(v.name, v.audience, JSON.stringify(v.sections), JSON.stringify(v.filters || {}), "draft", ctx.demo ? 1 : 0, ctx.user, now());
    this.audit(ctx, "report.create", "report_views", info.lastInsertRowid, v);
    return Number(info.lastInsertRowid);
  }
  setViewRelease(ctx: Ctx, id: number, status: string) {
    this.db.prepare("UPDATE report_views SET release_status=?, approved_by=?, approved_at=? WHERE id=?").run(status, ctx.user, now(), id);
    this.audit(ctx, "report.release", "report_views", id, { status });
  }
  getView(id: number): ReportView | undefined {
    return camel<ReportView>(this.db.prepare("SELECT * FROM report_views WHERE id=?").get(id));
  }

  // demo seeding helper (bypasses review; marked source_type=demo)
  insertDemo(dataset: string, payloads: Record<string, any>[], batchId: number | null, at: string) {
    const def = DATASET_MAP[dataset];
    const stmt = this.db.prepare(
      `INSERT INTO records (dataset, business_key, payload, review_status, is_demo, source_type, batch_id, source_row_ref, fingerprint, period_date, created_by, created_at, submitted_by, approved_by, approved_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    payloads.forEach((p, i) => {
      const { payload } = this.validatePayload(def, p, true, new Map(def.fields.map((fd) => [`${def.key}.${fd.key}`, new Set(payloads.map((x) => String(x[fd.key] ?? "")))])));
      const ref = `demo-${dataset}-${i + 1}`;
      stmt.run(dataset, businessKeyOf(def, payload, ref), JSON.stringify(payload), "approved", 1, "demo", batchId, ref, fingerprintOf(def, payload), def.dateField ? payload[def.dateField] : null, "Demo fixture", at, "Demo fixture", "Demo fixture", at);
    });
    this.invalidateRefs();
  }
}

export class HttpError extends Error {
  status: number;
  issues?: any;
  constructor(status: number, message: string, issues?: any) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export const storage = new Store(process.env.DENKYEM_DB || "data.db");
