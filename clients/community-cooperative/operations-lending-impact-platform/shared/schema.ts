import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// One versioned, auditable record store keyed by dataset contract (see contracts.ts).
export const records = sqliteTable(
  "records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dataset: text("dataset").notNull(),
    businessKey: text("business_key").notNull(), // derived from contract uniqueKey (or row ref)
    payload: text("payload").notNull(), // JSON of contract fields
    reviewStatus: text("review_status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    supersedesId: integer("supersedes_id"),
    isDemo: integer("is_demo").notNull().default(0),
    sourceType: text("source_type").notNull().default("manual"), // manual | import | demo
    batchId: integer("batch_id"),
    sourceRowRef: text("source_row_ref"),
    fingerprint: text("fingerprint"),
    periodDate: text("period_date"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedBy: text("updated_by"),
    updatedAt: text("updated_at"),
    submittedBy: text("submitted_by"),
    approvedBy: text("approved_by"),
    approvedAt: text("approved_at"),
    revisionReason: text("revision_reason"),
    reviewNote: text("review_note"),
  },
  (t) => [index("idx_records_ds").on(t.dataset, t.isDemo, t.reviewStatus)],
);

export const importBatches = sqliteTable("import_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dataset: text("dataset").notNull(),
  fileName: text("file_name").notNull(),
  checksum: text("checksum").notNull(),
  sheetName: text("sheet_name"),
  reportingPeriod: text("reporting_period"),
  mapping: text("mapping").notNull(), // JSON {sourceHeader: fieldKey|null}
  mappingVersion: integer("mapping_version").notNull().default(1),
  headers: text("headers").notNull(), // JSON string[]
  rawRows: text("raw_rows").notNull(), // JSON (immutable raw evidence)
  rowCount: integer("row_count").notNull(),
  validCount: integer("valid_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  issues: text("issues").notNull().default("[]"),
  reconciliation: text("reconciliation").notNull().default("{}"),
  status: text("status").notNull(), // staged | submitted | approved | partially_approved | rejected | rolled_back | failed | duplicate
  failureReason: text("failure_reason"),
  isDemo: integer("is_demo").notNull().default(0),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  approvalNote: text("approval_note"),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  at: text("at").notNull(),
  actor: text("actor").notNull(),
  role: text("role").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: text("updated_at"),
});

export const reportViews = sqliteTable("report_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  audience: text("audience").notNull(), // Internal | Board | Funder
  sections: text("sections").notNull(), // JSON string[]
  filters: text("filters").notNull().default("{}"),
  releaseStatus: text("release_status").notNull().default("draft"), // draft | approved_internal | approved_external
  isDemo: integer("is_demo").notNull().default(0),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
});

export const periodLocks = sqliteTable("period_locks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domain: text("domain").notNull(),
  period: text("period").notNull(), // YYYY-MM
  status: text("status").notNull(), // closed | reopened
  by: text("by").notNull(),
  at: text("at").notNull(),
  reason: text("reason"),
});

export const insertRecordInput = z.object({
  dataset: z.string(),
  payload: z.record(z.string(), z.any()),
  submit: z.boolean().optional(),
  revisionReason: z.string().optional(),
});
export const insertReportViewSchema = createInsertSchema(reportViews).omit({ id: true, createdAt: true, approvedAt: true, approvedBy: true, createdBy: true, isDemo: true, releaseStatus: true });

export type RecordRow = typeof records.$inferSelect;
export type ImportBatch = typeof importBatches.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type ReportView = typeof reportViews.$inferSelect;
export type InsertReportView = z.infer<typeof insertReportViewSchema>;

// Shape returned by every KPI endpoint
export type MetricStatus = "verified" | "provisional" | "unavailable" | "demo" | "not_applicable";
export interface MetricResult {
  id: string;
  label: string;
  value: number | null;
  unit: "count" | "money" | "hours" | "days" | "percent" | "ratio" | "score";
  status: MetricStatus;
  reason?: string; // why unavailable / provisional
  definition: string;
  source: string;
  period: string;
  denominator?: string;
  exclusions?: string;
  n?: number;
  lastImport?: string | null;
  inapplicableFilters?: string[];
  secondary?: string;
}
