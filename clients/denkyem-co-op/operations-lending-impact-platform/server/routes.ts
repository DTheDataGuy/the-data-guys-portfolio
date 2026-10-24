import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import { createHash } from "node:crypto";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage, HttpError, autoMap, type Ctx } from "./storage";
import { DATASETS, DATASET_MAP, DOMAINS, ROLES, TXN_STATUS_MATRIX, type Role, type Domain } from "@shared/contracts";
import * as D from "./dashboards";
import { DEFAULT_RULES, type Filters } from "./metrics";
import { CLIENT_REVIEW } from "@shared/release";
import { runAcceptance } from "./acceptance";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

declare global {
  namespace Express {
    interface Request {
      ctx: Ctx;
    }
  }
}

const ROLE_KEYS = Object.keys(ROLES) as Role[];
const DEFAULT_USER: Record<Role, string> = {
  admin: "Data steward",
  lending: "Lending staff",
  program: "Program staff",
  finance: "Finance reviewer",
  leadership: "Leadership",
  funder: "Funder viewer",
};

function ctxOf(req: Request): Ctx {
  if (CLIENT_REVIEW) return { role: "leadership", user: "Public review", demo: false };
  const r = String(req.header("x-denkyem-role") || req.query.role || "admin") as Role;
  const role = ROLE_KEYS.includes(r) ? r : "funder";
  const user = String(req.header("x-denkyem-user") || req.query.user || DEFAULT_USER[role]).slice(0, 80);
  const dv = String(req.header("x-denkyem-demo") ?? req.query.demo ?? "1");
  return { role, user, demo: false };
}

const canRead = (ctx: Ctx, domain: Domain) => DOMAINS[domain].readRoles.includes(ctx.role);
const canWrite = (ctx: Ctx, domain: Domain) => DOMAINS[domain].writeRoles.includes(ctx.role);
function needRead(ctx: Ctx, domain: Domain) {
  if (!canRead(ctx, domain)) throw new HttpError(403, `${ROLES[ctx.role].label} cannot view ${DOMAINS[domain].label} detail. Ask an administrator for access or use an approved report.`);
}
function needWrite(ctx: Ctx, domain: Domain) {
  if (!canWrite(ctx, domain)) throw new HttpError(403, `${ROLES[ctx.role].label} cannot enter or import ${DOMAINS[domain].label} data.`);
}
function needAdmin(ctx: Ctx) {
  if (ctx.role !== "admin") throw new HttpError(403, "Administrator role required");
}
function needApprover(ctx: Ctx) {
  if (!ROLES[ctx.role].canApprove) throw new HttpError(403, `${ROLES[ctx.role].label} cannot approve`);
}

function strip(dataset: string, payload: Record<string, any>, ctx: Ctx) {
  if (ROLES[ctx.role].restrictedAccess) return payload;
  const def = DATASET_MAP[dataset];
  const o = { ...payload };
  for (const f of def.fields) if (f.restricted && f.key in o) o[f.key] = "Restricted";
  return o;
}

function filtersOf(req: Request): Filters & { basis?: "month" | "ytd" } {
  const q = req.query as Record<string, string>;
  const f: any = {};
  for (const k of ["year", "month", "program", "county", "fund", "risk", "participantCategory", "basis"]) if (q[k] && q[k] !== "all") f[k] = q[k];
  return f;
}

const wrap = (fn: (req: Request, res: Response) => any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const out = fn(req, res);
    if (out !== undefined && !res.headersSent) res.json(out);
  } catch (e) {
    next(e);
  }
};

function toCsv(rows: Record<string, any>[], cols?: string[]) {
  const c = cols ?? Array.from(rows.reduce((s, r) => (Object.keys(r).forEach((k) => s.add(k)), s), new Set<string>()));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [c.join(","), ...rows.map((r) => c.map((k) => esc(r[k])).join(","))].join("\r\n");
}
function sendCsv(res: Response, name: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  res.send("\ufeff" + csv);
}

// Dashboard registry used by the API, reports and exports
const DASH: Record<string, { domain: Domain; fn: (ctx: Ctx, f: any) => any; label: string }> = {
  lending: { domain: "lending", label: "Lending", fn: (c, f) => D.lendingDashboard(storage, c, f) },
  ned: { domain: "lending", label: "NED migration", fn: (c) => D.nedMigration(storage, c) },
  impact: { domain: "impact", label: "Programs & impact", fn: (c, f) => D.impactDashboard(storage, c, f) },
  crp: { domain: "crp", label: "CRP reporting", fn: (c, f) => D.crpDashboard(storage, c, f) },
  crsp: { domain: "crsp", label: "CRSP services", fn: (c, f) => D.crspDashboard(storage, c, f) },
  engagement: { domain: "engagement", label: "Community & engagement", fn: (c, f) => D.engagementDashboard(storage, c, f) },
  fundraising: { domain: "fundraising", label: "Fundraising", fn: (c, f) => D.fundraisingDashboard(storage, c, f) },
  finance: { domain: "finance", label: "Finance", fn: (c, f) => D.financeDashboard(storage, c, f) },
  surveys: { domain: "surveys", label: "Surveys & journeys", fn: (c) => D.surveysDashboard(storage, c) },
};

let lastAcceptance: ReturnType<typeof runAcceptance> | null = null;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Remove only explicitly marked synthetic fixtures. Real records and their
  // history are preserved; no source data is created or relabeled.
  storage.db.transaction(() => {
    storage.db.prepare("DELETE FROM records WHERE is_demo=1").run();
    storage.db.prepare("DELETE FROM import_batches WHERE is_demo=1").run();
    storage.db.prepare("DELETE FROM report_views WHERE is_demo=1").run();
    storage.db.prepare("DELETE FROM settings WHERE key='demo_seeded_at'").run();
  })();

  app.use("/api", (req, res, next) => {
    req.ctx = ctxOf(req);
    if (CLIENT_REVIEW) {
      // Never expose sample fixtures, raw records, internal tooling or write
      // operations through this unauthenticated client-review website.
      const readPaths = ["/meta", "/options", "/sources", "/contracts", "/reports"];
      const allowedRead = req.method === "GET" &&
        (readPaths.includes(req.path) || /^\/dashboard\/[a-z]+$/.test(req.path));
      if (!allowedRead) return res.status(403).json({
        message: "Staff sign-in and source approval are required before data can be uploaded, changed or exported.",
      });
    }
    next();
  });

  // ─── meta ───
  app.get(
    "/api/meta",
    wrap((req) => ({
      roles: ROLES,
      domains: DOMAINS,
      ctx: req.ctx,
      clientReview: CLIENT_REVIEW,
      rules: D.getRules(storage),
      txnMatrix: TXN_STATUS_MATRIX,
      queue: req.ctx.role === "funder" ? [] : storage.queueCounts(req.ctx.demo),
    })),
  );
  app.get(
    "/api/contracts",
    wrap(() => DATASETS),
  );
  app.get(
    "/api/options",
    wrap((req) => {
      const d = req.ctx.demo;
      const programs = storage.rows("dim_program", d).map((p) => ({ id: p.Program_ID, name: p.Program_Name }));
      const geos = storage.rows("dim_geography", d);
      const loans = canRead(req.ctx, "lending") ? storage.rows("loan", d) : [];
      const years = new Set<string>();
      for (const ds of ["fact_service_delivery", "loan_transaction", "fact_events", "finance_line"]) storage.rows(ds, d).forEach((r) => {
        const def = DATASET_MAP[ds];
        const v = def.dateField ? r[def.dateField] : r.Period;
        if (typeof v === "string") years.add(v.slice(0, 4));
      });
      return {
        programs,
        counties: Array.from(new Set(geos.map((g) => g.County).filter(Boolean))).sort(),
        funds: Array.from(new Set(loans.map((l) => l.Funding_Source).filter(Boolean))).sort(),
        risks: Array.from(new Set(loans.map((l) => l.Risk_Raw).filter(Boolean))).sort(),
        participantCategories: Array.from(new Set(storage.rows("dim_participant_group", d).map((g) => g.Participant_Category).filter(Boolean))).sort(),
        years: Array.from(years).sort().reverse(),
      };
    }),
  );

  // ─── dashboards ───
  app.get(
    "/api/dashboard/overview",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Board and funder viewers see released reports only.");
      const o = D.overview(storage, req.ctx, filtersOf(req));
      const sectionDomain: Record<string, Domain> = { lending: "lending", impact: "impact", delivery: "impact", engagement: "engagement", finance: "finance" };
      return { ...o, sections: o.sections.map((s) => (canRead(req.ctx, sectionDomain[s.id]) ? s : { ...s, restricted: true, kpis: [] })) };
    }),
  );
  app.get(
    "/api/dashboard/:name",
    wrap((req) => {
      const d = DASH[req.params.name];
      if (!d) throw new HttpError(404, "Unknown dashboard");
      needRead(req.ctx, d.domain);
      return d.fn(req.ctx, filtersOf(req));
    }),
  );
  app.get(
    "/api/sources",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Not available to funder viewers");
      return D.sourceStatus(storage, req.ctx);
    }),
  );

  // ─── records ───
  app.get(
    "/api/records/:dataset",
    wrap((req) => {
      const def = DATASET_MAP[req.params.dataset];
      if (!def) throw new HttpError(404, "Unknown dataset");
      needRead(req.ctx, def.domain);
      const st = req.query.status ? String(req.query.status).split(",") : undefined;
      const rows = storage.listRecords(def.key, req.ctx.demo, st).slice(0, Number(req.query.limit) || 500);
      return rows.map((r) => ({ ...r, payload: strip(def.key, JSON.parse(r.payload), req.ctx) }));
    }),
  );
  app.get(
    "/api/record/:id",
    wrap((req) => {
      const r = storage.getRecord(Number(req.params.id));
      if (!r) throw new HttpError(404, "Not found");
      needRead(req.ctx, DATASET_MAP[r.dataset].domain);
      return { ...r, payload: strip(r.dataset, JSON.parse(r.payload), req.ctx), history: storage.history(r.id).map((h) => ({ ...h, payload: strip(r.dataset, JSON.parse(h.payload), req.ctx) })) };
    }),
  );
  app.post(
    "/api/records/:dataset",
    wrap((req) => {
      const def = DATASET_MAP[req.params.dataset];
      if (!def) throw new HttpError(404, "Unknown dataset");
      needWrite(req.ctx, def.domain);
      return storage.createRecord(req.ctx, def.key, req.body?.payload ?? {}, !!req.body?.submit);
    }),
  );
  app.patch(
    "/api/record/:id",
    wrap((req) => {
      const r = storage.getRecord(Number(req.params.id));
      if (!r) throw new HttpError(404, "Not found");
      needWrite(req.ctx, DATASET_MAP[r.dataset].domain);
      return storage.updateRecord(req.ctx, r.id, req.body?.payload ?? {}, req.body?.reason, req.body?.expectedUpdatedAt, !!req.body?.submit);
    }),
  );
  app.post(
    "/api/record/:id/:action",
    wrap((req) => {
      if (!["approve", "return", "submit", "discard"].includes(req.params.action)) throw new HttpError(404, "Unknown action");
      const r = storage.getRecord(Number(req.params.id));
      if (!r) throw new HttpError(404, "Not found");
      const domain = DATASET_MAP[r.dataset].domain;
      if (req.params.action === "approve" || req.params.action === "return") {
        needApprover(req.ctx);
        needRead(req.ctx, domain);
      } else needWrite(req.ctx, domain);
      storage.transition(req.ctx, r.id, req.params.action as any, req.body?.note);
      return { ok: true };
    }),
  );
  app.post(
    "/api/validate/:dataset",
    wrap((req) => {
      const def = DATASET_MAP[req.params.dataset];
      if (!def) throw new HttpError(404, "Unknown dataset");
      return storage.validatePayload(def, req.body?.payload ?? {}, req.ctx.demo).issues;
    }),
  );
  app.get(
    "/api/queue",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Not available");
      const st = String(req.query.status || "submitted,returned,draft,quarantined").split(",");
      const rows = storage.db
        .prepare(`SELECT * FROM records WHERE is_demo=? AND review_status IN (${st.map(() => "?").join(",")}) ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 400`)
        .all(req.ctx.demo ? 1 : 0, ...st) as any[];
      return rows
        .filter((r) => canRead(req.ctx, DATASET_MAP[r.dataset].domain))
        .map((r) => ({ id: r.id, dataset: r.dataset, datasetLabel: DATASET_MAP[r.dataset].label, domain: DATASET_MAP[r.dataset].domain, status: r.review_status, version: r.version, supersedesId: r.supersedes_id, createdBy: r.created_by, submittedBy: r.submitted_by, updatedAt: r.updated_at ?? r.created_at, revisionReason: r.revision_reason, reviewNote: r.review_note, sourceType: r.source_type, batchId: r.batch_id, payload: strip(r.dataset, JSON.parse(r.payload), req.ctx) }));
    }),
  );

  // ─── imports ───
  app.get(
    "/api/imports",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Not available");
      return storage.listBatches(req.ctx.demo).filter((b) => canRead(req.ctx, DATASET_MAP[b.dataset].domain)).map((b) => ({ ...b, datasetLabel: DATASET_MAP[b.dataset].label, reconciliation: JSON.parse(b.reconciliation || "{}") }));
    }),
  );
  app.post("/api/imports/parse", upload.single("file"), (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(400, "No file uploaded");
      const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true, raw: false });
      const sheets = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null, raw: false, dateNF: "yyyy-mm-dd" });
        const headers = rows.length ? Object.keys(rows[0]) : ((XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[]) ?? []);
        return { name, headers, rowCount: rows.length, preview: rows.slice(0, 8) };
      });
      res.json({ fileName: req.file.originalname, checksum: createHash("sha256").update(req.file.buffer).digest("hex"), sheets });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/imports", upload.single("file"), (req, res, next) => {
    try {
      const dataset = String(req.body.dataset || "");
      const def = DATASET_MAP[dataset];
      if (!def) throw new HttpError(422, "Choose a target dataset");
      needWrite(req.ctx, def.domain);
      if (!req.file) throw new HttpError(400, "No file uploaded");
      const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true, raw: false });
      const sheet = req.body.sheet && wb.SheetNames.includes(req.body.sheet) ? req.body.sheet : wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[sheet], { defval: null, raw: false, dateNF: "yyyy-mm-dd" });
      if (!rows.length) throw new HttpError(422, `Sheet "${sheet}" has no data rows`);
      const headers = Object.keys(rows[0]);
      const checksum = createHash("sha256").update(req.file.buffer).update(sheet).digest("hex");
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : undefined;
      const b = storage.stageImport(req.ctx, dataset, req.file.originalname, checksum, headers, rows, sheet, req.body.reportingPeriod || undefined, mapping);
      res.json(batchView(b.id, req.ctx));
    } catch (e) {
      next(e);
    }
  });
  function batchView(id: number, ctx: Ctx) {
    const b = storage.getBatch(id);
    if (!b) throw new HttpError(404, "Batch not found");
    const def = DATASET_MAP[b.dataset];
    needRead(ctx, def.domain);
    const raw = JSON.parse(b.rawRows) as Record<string, any>[];
    const mapping = JSON.parse(b.mapping);
    const mapped = storage.mapRows(def, mapping, raw.slice(0, 25)).map((p) => strip(def.key, p, ctx));
    return { ...b, rawRows: undefined, headers: JSON.parse(b.headers), mapping, reconciliation: JSON.parse(b.reconciliation || "{}"), issues: b.parsedIssues.slice(0, 500), issueTotal: b.parsedIssues.length, preview: mapped, datasetLabel: def.label, suggested: autoMap(def, JSON.parse(b.headers)) };
  }
  app.get(
    "/api/imports/:id",
    wrap((req) => batchView(Number(req.params.id), req.ctx)),
  );
  app.post(
    "/api/imports/:id/remap",
    wrap((req) => {
      const b = storage.getBatch(Number(req.params.id));
      if (!b) throw new HttpError(404, "Not found");
      needWrite(req.ctx, DATASET_MAP[b.dataset].domain);
      storage.revalidate(req.ctx, b.id, req.body.mapping);
      return batchView(b.id, req.ctx);
    }),
  );
  app.post(
    "/api/imports/:id/:action",
    wrap((req) => {
      if (!["submit", "approve", "reject", "rollback"].includes(req.params.action)) throw new HttpError(404, "Unknown action");
      const b = storage.getBatch(Number(req.params.id));
      if (!b) throw new HttpError(404, "Not found");
      const domain = DATASET_MAP[b.dataset].domain;
      const a = req.params.action;
      if (a === "submit") {
        needWrite(req.ctx, domain);
        storage.submitBatch(req.ctx, b.id);
      } else if (a === "approve") {
        needApprover(req.ctx);
        needRead(req.ctx, domain);
        return { ...storage.approveBatch(req.ctx, b.id, { partial: !!req.body?.partial, note: req.body?.note }), batch: batchView(b.id, req.ctx) };
      } else if (a === "reject") {
        needApprover(req.ctx);
        if (!req.body?.note) throw new HttpError(422, "A reason is required to reject a batch");
        storage.rejectBatch(req.ctx, b.id, req.body.note);
      } else {
        needApprover(req.ctx);
        needRead(req.ctx, domain);
        storage.rollbackBatch(req.ctx, b.id, req.body?.note);
      }
      return batchView(b.id, req.ctx);
    }),
  );
  app.get("/api/imports/:id/errors", (req, res, next) => {
    try {
      const b = storage.getBatch(Number(req.params.id));
      if (!b) throw new HttpError(404, "Not found");
      needRead(req.ctx, DATASET_MAP[b.dataset].domain);
      sendCsv(res, `batch-${b.id}-issues.csv`, toCsv(b.parsedIssues, ["row", "field", "severity", "message"]));
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/templates/:dataset", (req, res, next) => {
    try {
      const def = DATASET_MAP[String(req.params.dataset).replace(/\.csv$/, "")];
      if (!def) throw new HttpError(404, "Unknown dataset");
      const example: Record<string, any> = {};
      def.fields.forEach((f) => (example[f.key] = f.type === "date" ? "YYYY-MM-DD" : f.type === "month" ? "YYYY-MM" : f.options ? f.options[0] : f.type === "money" ? "0.00" : f.type === "int" ? "0" : ""));
      sendCsv(res, `${def.key}_template.csv`, toCsv([example], def.fields.map((f) => f.key)));
    } catch (e) {
      next(e);
    }
  });

  // ─── exports (Power BI-compatible flat CSVs; legacy table names preserved) ───
  app.get("/api/export/dataset/:dataset", (req, res, next) => {
    try {
      const def = DATASET_MAP[String(req.params.dataset).replace(/\.csv$/, "")];
      if (!def) throw new HttpError(404, "Unknown dataset");
      if (req.ctx.role === "funder") throw new HttpError(403, "Funder viewers cannot export record-level data. Use a released aggregate report.");
      needRead(req.ctx, def.domain);
      const rows = storage.rows(def.key, req.ctx.demo).map((r) => {
        const { _id, _status, _batch, ...p } = r;
        return { ...strip(def.key, p, req.ctx), Record_ID: _id, Batch_ID: _batch, Is_Demo: req.ctx.demo ? 1 : 0 };
      });
      storage.audit(req.ctx, "export.dataset", def.key, null, { rows: rows.length });
      sendCsv(res, `${def.legacyTable ?? def.key}${req.ctx.demo ? "_DEMO" : ""}.csv`, toCsv(rows, [...def.fields.map((f) => f.key), "Record_ID", "Batch_ID", "Is_Demo"]));
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/export/kpis", (req, res, next) => {
    try {
      if (req.ctx.role === "funder") throw new HttpError(403, "Use a released report export");
      const f = filtersOf(req);
      const rows: any[] = [];
      for (const [k, d] of Object.entries(DASH)) {
        if (!canRead(req.ctx, d.domain)) continue;
        const out = d.fn(req.ctx, f);
        (out.kpis ?? []).forEach((m: any) => rows.push({ Dashboard: d.label, Metric_ID: m.id, Metric: m.label, Value: m.value, Unit: m.unit, Status: m.status, Period: m.period, Definition: m.definition, Source: m.source, Denominator: m.denominator, Exclusions: m.exclusions, Reason: m.reason, Last_Import: m.lastImport, Is_Demo: req.ctx.demo ? 1 : 0, Section: k }));
      }
      storage.audit(req.ctx, "export.kpis", "kpis", null, { filters: f, rows: rows.length });
      sendCsv(res, `denkyem_kpis${req.ctx.demo ? "_DEMO" : ""}.csv`, toCsv(rows));
    } catch (e) {
      next(e);
    }
  });

  // ─── reports ───
  app.get(
    "/api/reports",
    wrap((req) => {
      if (CLIENT_REVIEW) return [];
      const v = storage.listViews(req.ctx.demo).map((x) => ({ ...x, sections: JSON.parse(x.sections), filters: JSON.parse(x.filters) }));
      return req.ctx.role === "funder" ? v.filter((x) => x.releaseStatus === "released_external") : v;
    }),
  );
  app.post(
    "/api/reports",
    wrap((req) => {
      if (!["admin", "leadership", "program", "lending", "finance"].includes(req.ctx.role)) throw new HttpError(403, "Not permitted");
      const { name, audience, sections, filters } = req.body ?? {};
      if (!name || !Array.isArray(sections) || !sections.length) throw new HttpError(422, "Name and at least one section are required");
      return { id: storage.createView(req.ctx, { name, audience: audience || "Internal", sections: sections.filter((s: string) => DASH[s]), filters }) };
    }),
  );
  app.post(
    "/api/reports/:id/release",
    wrap((req) => {
      const v = storage.getView(Number(req.params.id));
      if (!v) throw new HttpError(404, "Not found");
      const status = String(req.body?.status);
      if (!["draft", "approved_internal", "released_external"].includes(status)) throw new HttpError(422, "Invalid release status");
      if (!["admin", "leadership"].includes(req.ctx.role)) throw new HttpError(403, "Leadership or administrator approval required");
      if (status === "released_external") {
        const rules = D.getRules(storage);
        if (!rules.externalReleaseApproved && !req.ctx.demo) throw new HttpError(409, "External release is blocked until leadership approves the external aggregation policy (Administration → Rules).");
        if (v.releaseStatus !== "approved_internal") throw new HttpError(409, "Approve internally before external release");
      }
      storage.setViewRelease(req.ctx, v.id, status);
      return { ok: true };
    }),
  );
  function reportData(id: number, ctx: Ctx) {
    const v = storage.getView(id);
    if (!v || !!v.isDemo !== ctx.demo) throw new HttpError(404, "Report not found");
    if (ctx.role === "funder" && v.releaseStatus !== "released_external") throw new HttpError(403, "This report has not been released");
    const sections = JSON.parse(v.sections) as string[];
    const filters = JSON.parse(v.filters || "{}");
    // aggregate-only context; restricted fields never included
    const aggCtx: Ctx = { ...ctx, role: ctx.role === "funder" ? "leadership" : ctx.role };
    const out = sections
      .filter((s) => DASH[s])
      .map((s) => {
        const d = DASH[s];
        if (ctx.role !== "funder" && !canRead(ctx, d.domain)) return { id: s, title: d.label, restricted: true, kpis: [] };
        const res = d.fn({ ...aggCtx, role: ctx.role === "funder" ? "leadership" : aggCtx.role }, filters);
        return { id: s, title: d.label, kpis: (res.kpis ?? []).map((k: any) => ({ ...k })), trend: res.trend ?? res.portfolioTrend ?? res.monthly ?? null };
      });
    return { view: { ...v, sections, filters }, sections: out, generatedAt: new Date().toISOString(), suppression: D.getRules(storage).smallCellThreshold };
  }
  app.get(
    "/api/reports/:id/data",
    wrap((req) => reportData(Number(req.params.id), req.ctx)),
  );
  app.get("/api/reports/:id/export", (req, res, next) => {
    try {
      const r = reportData(Number(req.params.id), req.ctx);
      const rows = r.sections.flatMap((s: any) => s.kpis.map((k: any) => ({ Report: r.view.name, Section: s.title, Metric_ID: k.id, Metric: k.label, Value: k.value, Unit: k.unit, Status: k.status, Period: k.period, Definition: k.definition, Source: k.source, Denominator: k.denominator, Exclusions: k.exclusions, Is_Demo: req.ctx.demo ? 1 : 0 })));
      storage.audit(req.ctx, "export.report", "report_views", r.view.id, { rows: rows.length });
      sendCsv(res, `${r.view.name.replace(/[^a-z0-9]+/gi, "_")}${req.ctx.demo ? "_DEMO" : ""}.csv`, toCsv(rows));
    } catch (e) {
      next(e);
    }
  });

  // ─── governance ───
  app.get(
    "/api/rules",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Not available");
      return { rules: D.getRules(storage), defaults: DEFAULT_RULES };
    }),
  );
  app.put(
    "/api/rules",
    wrap((req) => {
      needAdmin(req.ctx);
      const cur = D.getRules(storage);
      const next: any = { ...cur };
      for (const k of Object.keys(DEFAULT_RULES)) if (k in (req.body ?? {})) next[k] = req.body[k];
      if (typeof next.smallCellThreshold !== "number" || next.smallCellThreshold < 1) throw new HttpError(422, "Threshold must be a positive number");
      storage.setSetting(req.ctx, "rules", next);
      return next;
    }),
  );
  app.get(
    "/api/locks",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Not available");
      return storage.listLocks();
    }),
  );
  app.post(
    "/api/locks",
    wrap((req) => {
      if (!["admin", "finance"].includes(req.ctx.role)) throw new HttpError(403, "Administrator or finance role required");
      const { domain, period, status, reason } = req.body ?? {};
      if (!DOMAINS[domain as Domain] || !/^\d{4}-\d{2}$/.test(period)) throw new HttpError(422, "Choose a domain and a YYYY-MM period");
      storage.setLock(req.ctx, domain, period, status === "reopened" ? "reopened" : "closed", reason);
      return { ok: true };
    }),
  );
  app.get(
    "/api/audit",
    wrap((req) => {
      if (!["admin", "leadership"].includes(req.ctx.role)) throw new HttpError(403, "Administrator or leadership role required");
      return storage.listAudit(Number(req.query.limit) || 300);
    }),
  );
  app.get(
    "/api/acceptance",
    wrap((req) => {
      if (req.ctx.role === "funder") throw new HttpError(403, "Not available");
      return lastAcceptance;
    }),
  );
  app.post(
    "/api/acceptance/run",
    wrap((req) => {
      needAdmin(req.ctx);
      lastAcceptance = runAcceptance();
      storage.audit(req.ctx, "acceptance.run", "acceptance", null, { passed: lastAcceptance.passed, total: lastAcceptance.total });
      return lastAcceptance;
    }),
  );

  // error handler for API
  app.use("/api", (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, issues: err.issues });
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ message: "A conflicting approved record already exists." });
    console.error(err);
    res.status(500).json({ message: err?.message || "Server error" });
  });

  return httpServer;
}
