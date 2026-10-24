import ExcelJS from "exceljs";
import { db } from "./db";

/* Field dictionary: target → header synonyms (normalized to lowercase letters/digits). */
const F: Record<string, string[]> = {
  entity: ["entity", "entitycode", "company code", "co"],
  company: ["company", "companyname", "legal entity"],
  bu: ["business unit", "businessunit", "bu", "segment"],
  project_id: ["project id", "projectid", "project", "project no", "project number", "project #", "job", "job no", "job number", "job #", "jobid"],
  project_name: ["project name", "projectname", "job name", "description", "project description"],
  pm: ["project manager", "pm", "manager"],
  status: ["status", "project status"],
  jv: ["jv flag", "jv", "joint venture"],
  icwo: ["ic/iwo flag", "iciwo", "ic iwo", "intercompany", "ic/iwo"],
  imp_elig: ["reporting eligible"], mgmt_elig: ["management active eligible"], imp_excl: ["exclusion reason"],
  bond_no: ["bond number", "bond no", "bond #", "bondnumber", "bond"],
  bond_status_raw: ["bond status", "bonded", "bonded status"],
  orig: ["original contract", "original contract amount", "base contract"],
  mods: ["contract mods", "change orders", "approved change orders", "approved cos", "mods"],
  C: ["current/revised contract", "current contract", "revised contract", "contract value", "total contract", "current contract amount", "revised contract amount"],
  R: ["itd earned revenue", "earned revenue", "itd revenue", "revenue earned to date", "earned to date", "revenue to date"],
  E: ["eac", "estimated cost at completion", "total estimated cost", "estimated total cost", "eac cost", "cost at completion"],
  A: ["itd cost", "cost to date", "actual cost to date", "itd actual cost", "actual cost", "costs to date"],
  B: ["billings", "billed to date", "itd billings", "billings to date", "total billed"],
  legacy_exc: ["exception type"], legacy_sev: ["severity"],
  customer: ["customer", "owner", "client"], location: ["location", "site"], contract_no: ["contract no.", "contract no", "contract number", "contract #"],
  inferred: ["project id inferred"], bond_method: ["bond match method"], bond_score: ["bond match score"],
  source_row_in: ["source row"], source_file_in: ["source file"], source_sheet_in: ["source sheet"], master_row: ["master_row", "master row"],
  start_date: ["start date", "project start", "start"], end_date: ["est. completion date", "estimated completion", "completion date", "end date", "substantial completion", "finish date"],
};
const norm = (s: any) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const SYN = new Map<string, string>();
for (const [k, arr] of Object.entries(F)) for (const s of arr) SYN.set(norm(s), k);
const NUMS = new Set(["orig", "mods", "C", "R", "E", "A", "B", "bond_score"]);
const REQUIRED_ANY = ["C", "R", "E", "A"];

function cellVal(v: any): any {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("result" in v) return cellVal(v.result);
    if ("richText" in v) return v.richText.map((t: any) => t.text).join("");
    if ("text" in v) return v.text;
    if ("error" in v) return null;
    return null;
  }
  return v;
}
/* exceljs drops a formula's cached result when it is 0 — Excel always stores one, so a formula with no result is 0. */
function numCell(v: any): any { if (v && typeof v === "object" && ("formula" in v || "sharedFormula" in v) && !("result" in v && v.result !== undefined)) return 0; return cellVal(v); }
function toNum(v: any): { n: number | null; bad: boolean } {
  if (v === null || v === undefined || v === "") return { n: null, bad: false };
  if (typeof v === "number") return { n: v, bad: false };
  let s = String(v).trim();
  if (!s || s === "-" || s === "—") return { n: null, bad: false };
  const neg = /^\(.*\)$/.test(s);
  s = s.replace(/[$,()\s]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? { n: neg ? -n : n, bad: false } : { n: null, bad: true };
}
function toDate(v: any): string | null {
  const d0 = toDate0(v); return d0 && d0 < "1900-01-02" ? null : d0; // Excel serial 0 (“00:00:00”) is a blank date
}
function toDate0(v: any): string | null {
  if (!v) return null;
  if (typeof v === "number") { const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000); return d.toISOString().slice(0, 10); }
  const s = String(v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function detectPeriod(...texts: (string | null | undefined)[]) {
  for (const t of texts) {
    if (!t) continue;
    let m = /(20\d{2})[-._ ](\d{1,2})[-._ ](\d{1,2})/.exec(t);
    if (m) return { period: `${m[1]}-${m[2].padStart(2, "0")}`, asOf: `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` };
    m = /(\d{1,2})[-._/](\d{1,2})[-._/](20\d{2})/.exec(t);
    if (m) return { period: `${m[3]}-${m[1].padStart(2, "0")}`, asOf: `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` };
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    m = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s._-]*(20\d{2})/i.exec(t);
    if (m) { const mo = months.indexOf(m[1].toLowerCase()) + 1; const last = new Date(Date.UTC(Number(m[2]), mo, 0)).getUTCDate(); return { period: `${m[2]}-${String(mo).padStart(2, "0")}`, asOf: `${m[2]}-${String(mo).padStart(2, "0")}-${last}` }; }
  }
  return null;
}

type Ent = { code: string; company: string; bu: string; type: string };
export const entityList = () => db.prepare("SELECT code, company, bu, type FROM entities ORDER BY sort").all() as Ent[];
const ALIASES: [RegExp, string][] = [
  [/aecom\s*jv\s*1|aecom jv1/i, "SES/AEC JV1"], [/aecom\s*jv\s*2|aecom jv2/i, "SES/AEC JV2"], [/turnagain/i, "SES/TURN"], [/aptim/i, "SSO/APTIM"], [/malcolm/i, "RDGP/MALC"],
  [/rdg\s*pacific|\bstgp\b|\bstp\b/i, "RDGP"], [/rdg[_\s-]*compan|\bstg\b/i, "RDG"], [/cascade-civil|\btun\b/i, "CCV"], [/summit\s*env|\bbes\b/i, "SES"], [/summit\s*eng|\bbel\b/i, "SEL"],
  [/summit\s*solutions|\bbso\b/i, "SSO"], [/summit\s*integrated|\bbin\b/i, "SIN"], [/summit\s*builders|\bbbl\b/i, "SBL"], [/summit\s*terra|\bbtl\b/i, "STL"], [/summit\s*civil|\bbcc\b/i, "BCC"],
  [/const(ruction)?\s*(&|and)?\s*design|\bbcd\b/i, "SCD"], [/summit\s*highway|\bbhl\b/i, "SHL"], [/summit\s*pacific|\bbpl\b/i, "SPL"], [/\bbri\b|summit\s*inc/i, "SRI"],
];
export function detectEntity(...texts: (string | null | undefined)[]) {
  for (const raw of texts) { if (!raw) continue; const t = String(raw).replace(/[-_.]+/g, " "); for (const [re, code] of ALIASES) if (re.test(t)) return code; }
  return null;
}

export type Staged = { rows: any[]; issues: { row: number; level: "error" | "warning"; field: string; message: string }[]; format: string; sheet: string; headerRow: number; mapped: Record<string, string>; unmapped: string[]; entities: string[]; period: { period: string; asOf: string } | null };

function stageTable(table: any[][], headerIdx: number, sheet: string, fname: string, subject: string | null, forcedEntity: string | null, format: string): Staged {
  const ents = entityList();
  const known = new Map(ents.map((e) => [e.code, e]));
  const hdr = table[headerIdx].map((h) => String(h ?? "").trim());
  const colOf: Record<string, number> = {};
  const unmapped: string[] = [];
  hdr.forEach((h, i) => { if (!h) return; const k = SYN.get(norm(h)); if (k && colOf[k] === undefined) colOf[k] = i; else if (!k) unmapped.push(h); });
  const mapped: Record<string, string> = {};
  for (const [k, i] of Object.entries(colOf)) mapped[k] = hdr[i];
  const fileEntity = forcedEntity || detectEntity(fname, sheet, subject);
  const issues: Staged["issues"] = [];
  const out: any[] = [];
  const seen = new Map<string, number>();
  for (let r = headerIdx + 1; r < table.length; r++) {
    const line = table[r] || [];
    const get = (k: string) => (colOf[k] === undefined ? null : cellVal(line[colOf[k]]));
    const pid = get("project_id");
    const nonEmpty = line.some((v) => cellVal(v) !== null && String(cellVal(v)).trim() !== "");
    if (!nonEmpty) continue;
    const excelRow = r + 1;
    const nameV = get("project_name");
    if (pid === null || String(pid).trim() === "") {
      if (/total/i.test(String(nameV || line.map(cellVal).join(" ")))) continue; // subtotal / total lines
      issues.push({ row: excelRow, level: "warning", field: "Project ID", message: "Row skipped — no project ID" });
      continue;
    }
    const entity = String(get("entity") || fileEntity || "").trim();
    const rec: any = { entity, project_id: String(pid).trim(), project_name: nameV ? String(nameV).trim() : null };
    for (const k of ["company", "bu", "pm", "status", "jv", "icwo", "imp_elig", "mgmt_elig", "imp_excl", "bond_no", "bond_status_raw", "legacy_exc", "legacy_sev", "customer", "location", "contract_no", "inferred", "bond_method"]) {
      const v = get(k); rec[k] = v === null || String(v).trim() === "" ? null : String(v).trim();
    }
    for (const k of NUMS) {
      const { n, bad } = toNum(colOf[k] === undefined ? null : numCell(line[colOf[k]])); rec[k] = n;
      if (bad) issues.push({ row: excelRow, level: "error", field: mapped[k] || k, message: `Not a number: "${get(k)}"` });
    }
    rec.start_date = toDate(get("start_date")); rec.end_date = toDate(get("end_date"));
    rec.source_row = get("source_row_in") !== null ? Number(get("source_row_in")) : excelRow;
    rec.source_file = get("source_file_in") ? String(get("source_file_in")) : fname;
    rec.source_sheet = get("source_sheet_in") ? String(get("source_sheet_in")) : sheet;
    rec.master_row = get("master_row") !== null ? Number(get("master_row")) : null;
    if (rec.bond_no && /^\d+$/.test(rec.bond_no) && rec.bond_no.length < 9) rec.bond_no = rec.bond_no.padStart(9, "0");
    if (!rec.status) rec.status = "Active";
    if (!rec.jv) rec.jv = /jv/i.test(entity) ? "Yes" : "No";
    if (!rec.icwo) rec.icwo = "No";
    const e = known.get(entity);
    if (!entity) issues.push({ row: excelRow, level: "error", field: "Entity", message: "Entity not found in the file, filename or subject — choose one" });
    else if (!e) issues.push({ row: excelRow, level: "warning", field: "Entity", message: `Entity "${entity}" is not in the reference table` });
    if (e) { rec.company = rec.company || e.company; rec.bu = e.bu; } // governed BU mapping always wins
    if (REQUIRED_ANY.every((k) => rec[k] === null)) issues.push({ row: excelRow, level: "error", field: "Financials", message: "No contract, revenue, EAC or cost values" });
    if (rec.B === null) issues.push({ row: excelRow, level: "warning", field: "Billings", message: "Billings blank — kept as unknown, not zero" });
    if (rec.E !== null && rec.A !== null && rec.E + 0.005 < rec.A) issues.push({ row: excelRow, level: "warning", field: "EAC", message: "EAC is below ITD cost" });
    if (rec.C !== null && rec.R !== null && rec.R - rec.C > 0.005) issues.push({ row: excelRow, level: "warning", field: "ITD Earned Revenue", message: "Earned revenue exceeds contract" });
    const k = `${entity}|${rec.project_id}`;
    if (seen.has(k)) issues.push({ row: excelRow, level: "warning", field: "Project ID", message: `Same entity + project ID also on row ${seen.get(k)} — both kept (no dedupe by ID alone)` });
    else seen.set(k, excelRow);
    rec._excelRow = excelRow;
    out.push(rec);
  }
  const missing = ["project_id", "C", "R", "E", "A"].filter((k) => colOf[k] === undefined);
  if (missing.length) issues.unshift({ row: headerIdx + 1, level: missing.includes("project_id") ? "error" : "warning", field: "Headers", message: `Columns not found: ${missing.map((m) => ({ project_id: "Project ID", C: "Current/Revised Contract", R: "ITD Earned Revenue", E: "EAC", A: "ITD Cost" } as any)[m]).join(", ")}` });
  return { rows: out, issues, format, sheet, headerRow: headerIdx + 1, mapped, unmapped, entities: [...new Set(out.map((r) => r.entity).filter(Boolean))], period: detectPeriod(fname, subject) };
}

function findHeader(table: any[][]) {
  let best = -1, score = 0;
  for (let i = 0; i < Math.min(table.length, 20); i++) {
    const s = (table[i] || []).reduce((a, v) => a + (SYN.has(norm(cellVal(v))) ? 1 : 0), 0);
    if (s > score) { score = s; best = i; }
  }
  return score >= 4 ? best : -1;
}

function parseCsv(text: string): any[][] {
  const rows: any[][] = []; let row: any[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/* Excel files re-saved by other tools (openpyxl, Google Sheets, some add-ins) can carry comment/VML
   parts that exceljs cannot reconcile. On failure, strip comments and drawings (never cell data) and retry. */
/* Large workbooks often carry reference tabs the importer never reads (contract listings, registers
   formatted down to row 1,048,576). Parsing them can take minutes, so before loading we empty the cell
   data of big tabs whose names the importer never uses. The first tab and every WIP-related tab are
   always kept in full, and no cell in a kept tab is changed. */
const KEEP_TAB = /^summary$|^rdg itd$|\b(itd|direct)\b|wip|03_master|instruction|cover/i;
const BIG_TAB = 1_000_000;
export async function trimUnusedTabs(buf: Buffer): Promise<{ buf: Buffer; trimmed: string[] }> {
  const JSZip = (await import("jszip")).default; const z = await JSZip.loadAsync(buf);
  const wbx = await z.file("xl/workbook.xml")?.async("string"); const rel = await z.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!wbx || !rel) return { buf, trimmed: [] };
  const target = new Map<string, string>();
  for (const m of rel.matchAll(/<Relationship\b[^>]*>/g)) { const id = /Id="([^"]+)"/.exec(m[0])?.[1], t = /Target="([^"]+)"/.exec(m[0])?.[1]; if (id && t) target.set(id, t.replace(/^\/?(xl\/)?/, "xl/")); }
  const trimmed: string[] = []; let i = 0;
  for (const m of wbx.matchAll(/<sheet\b[^>]*>/g)) {
    const name = (/name="([^"]*)"/.exec(m[0])?.[1] || "").replace(/&amp;/g, "&").trim(); const rid = /r:id="([^"]+)"/.exec(m[0])?.[1];
    const first = i++ === 0; if (first || KEEP_TAB.test(name) || !rid) continue;
    const path = target.get(rid); const f = path ? z.file(path) : null; if (!f) continue;
    const size = (f as any)._data?.uncompressedSize ?? 0;
    if (size && size < BIG_TAB) continue;
    const x = await f.async("string"); if (x.length < BIG_TAB) continue;
    z.file(path!, x.replace(/<sheetData>[\s\S]*<\/sheetData>|<sheetData\/>/, "<sheetData/>").replace(/<(mergeCells|conditionalFormatting|dataValidations|hyperlinks)\b[\s\S]*?<\/\1>/g, ""));
    trimmed.push(name);
  }
  if (!trimmed.length) return { buf, trimmed };
  z.remove("xl/calcChain.xml");
  const ct = await z.file("[Content_Types].xml")!.async("string"); z.file("[Content_Types].xml", ct.replace(/<Override[^>]*calcChain[^>]*\/>/gi, ""));
  z.file("xl/_rels/workbook.xml.rels", rel.replace(/<Relationship[^>]*calcChain[^>]*\/>/gi, ""));
  return { buf: await z.generateAsync({ type: "nodebuffer" }), trimmed };
}

async function loadWorkbook(raw: Buffer) {
  const { buf } = await trimUnusedTabs(raw);
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(buf as any); return wb; } catch (e) {
    const JSZip = (await import("jszip")).default; const z = await JSZip.loadAsync(buf);
    for (const n of Object.keys(z.files)) {
      if (/^xl\/(comments|threadedComments|drawings\/vmlDrawing|persons)/i.test(n)) z.remove(n);
      else if (/^xl\/worksheets\/_rels\/.*\.rels$/i.test(n)) { const x = await z.file(n)!.async("string"); z.file(n, x.replace(/<Relationship[^>]*(comments|vmlDrawing|threadedComment)[^>]*\/>/gi, "")); }
      else if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(n)) { const x = await z.file(n)!.async("string"); z.file(n, x.replace(/<legacyDrawing[^>]*\/>/g, "")); }
      else if (n === "[Content_Types].xml") { const x = await z.file(n)!.async("string"); z.file(n, x.replace(/<Override[^>]*(comments|vmlDrawing|threadedComment|person)[^>]*\/>/gi, "")); }
    }
    const clean = await z.generateAsync({ type: "nodebuffer" });
    const wb2 = new ExcelJS.Workbook(); await wb2.xlsx.load(clean as any); return wb2;
  }
}


/* ---------- company WIP workbooks (the monthly files each company sends) ----------
   Mirrors the verified June 2026 load: company tab = the "… ITD" / "… Direct" sheet (SRI: "WIP");
   headers found by name; Active until an "Inactive Projects" label; totals, header repeats and rows with
   no project ID or no financials are skipped. RDG: project list from "Summary", values from "RDG ITD". */
const HN = (v: any) => String(cellVal(v) ?? "").replace(/\s+/g, " ").trim().toLowerCase();
function findCol(h: string[], pats: string[], starts = false) { for (const p of pats) { const i = h.findIndex((x) => (starts ? x.startsWith(p) : x === p)); if (i >= 0) return i; } return -1; }
const sv = (v: any) => { const x = cellVal(v); if (x === null || x === undefined) return null; const t = String(x).trim(); return t || null; };
const HEADER_WORDS = new Set(["new project number", "new project", "project number", "target projects", "legacy project number", "job number"]);
type CoTable = { name: string; t: any[][]; h: number };
function tableOf(ws: ExcelJS.Worksheet) { const t: any[][] = []; ws.eachRow({ includeEmpty: true }, (row, n) => { const a: any[] = []; row.eachCell({ includeEmpty: false }, (cell, col) => { if (cell.type === ExcelJS.ValueType.Merge) return; a[col - 1] = cell.value; }); t[n - 1] = a; }); for (let i = 0; i < t.length; i++) if (!t[i]) t[i] = []; return t; }
function coHeader(t: any[][]) {
  for (let i = 0; i < Math.min(t.length, 15); i++) { const h = Array.from(t[i] || [], HN); if (h.some((x) => ["project name", "job", "job number", "new project number", "project number"].includes(x)) && h.some((x) => /^revised contract|^contract amount|^original contract amount/.test(x))) return i; }
  return -1;
}
function coCols(h: string[]) {
  return {
    pid: findCol(h, ["new project number", "new project", "target projects", "project number", "job number"]), leg: findCol(h, ["legacy project number"]),
    name: findCol(h, ["project name", "job"]), cust: findCol(h, ["customer name"]), loc: findCol(h, ["location", "work type and state"]), bonded: findCol(h, ["bonded", "bonding"]),
    pm: findCol(h, ["pm"]), typ: findCol(h, ["project type", "revenue type"]), cno: findCol(h, ["contract no."]), sd: findCol(h, ["contract date"]), ed: findCol(h, ["estimated completion date"]),
    orig: findCol(h, ["original contract amount", "contract amount"]), mods: findCol(h, ["contract modifications", "change orders"]),
    C: findCol(h, ["revised contract amount", "revised contract"]), E: findCol(h, ["revised eac (excludes g&a)", "revised eac", "eac", "total cost"]),
    R: findCol(h, ["itd earned revenue", "earned revenue"]), A: findCol(h, ["itd costs", "direct costs", "direct & fringe", "actual cost"], true), B: findCol(h, ["itd billed", "billed"], true),
  };
}
export function companyWorkbook(sheets: ExcelJS.Worksheet[]): { list: CoTable; values: CoTable | null } | null {
  const mk = (ws: ExcelJS.Worksheet | undefined): CoTable | null => { if (!ws) return null; const t = tableOf(ws); const h = coHeader(t); return h >= 0 ? { name: ws.name, t, h } : null; };
  const summary = sheets.find((x) => /^summary$/i.test(x.name.trim())), rdgItd = sheets.find((x) => /^rdg itd$/i.test(x.name.trim()));
  if (summary && rdgItd) { const a = mk(summary), b = mk(rdgItd); if (a && b) return { list: a, values: b }; }
  const tab = sheets.find((x) => /\b(itd|direct)\b/i.test(x.name) && !/2026|indirect|level|only/i.test(x.name)) || sheets.find((x) => /^wip$/i.test(x.name.trim()));
  const a = mk(tab); return a ? { list: a, values: null } : null;
}
export function stageCompanyWip(co: { list: CoTable; values: CoTable | null }, fname: string, subject: string | null, forcedEntity: string | null): Staged {
  const ents = entityList(); const known = new Map(ents.map((e) => [e.code, e]));
  const entity = forcedEntity || detectEntity(fname, subject) || detectEntity(co.list.name) || "";
  const e = known.get(entity);
  const issues: Staged["issues"] = []; const out: any[] = []; const seen = new Map<string, number>();
  const { t, h: hi, name: sheet } = co.list; const hdr = Array.from(t[hi], HN); const c = coCols(hdr);
  const mapped: Record<string, string> = {}; for (const [k, i] of Object.entries(c)) if (i >= 0) mapped[k] = String(cellVal(t[hi][i]) ?? "").trim();
  if (!entity) issues.push({ row: hi + 1, level: "error", field: "Entity", message: "Couldn’t tell which company this file is from — choose the entity" });
  else if (!e) issues.push({ row: hi + 1, level: "warning", field: "Entity", message: `Entity "${entity}" is not in the reference table` });
  if (c.pid < 0 && c.leg < 0) issues.push({ row: hi + 1, level: "error", field: "Headers", message: "No project number column found" });
  // RDG values tab (same project ID)
  let vals: Map<string, { row: number; line: any[]; c: ReturnType<typeof coCols> }> | null = null;
  if (co.values) { vals = new Map(); const vc = coCols(Array.from(co.values.t[co.values.h], HN)); for (let r = co.values.h + 1; r < co.values.t.length; r++) { const line = co.values.t[r] || []; const p = vc.pid >= 0 ? sv(line[vc.pid]) : null; if (p && !vals.has(p)) vals.set(p, { row: r + 1, line, c: vc }); } }
  let status = "Active";
  for (let r = hi + 1; r < t.length; r++) {
    const line = t[r] || []; const excelRow = r + 1;
    const g = (k: keyof ReturnType<typeof coCols>, L = line, cc = c) => (cc[k] >= 0 ? cellVal(L[cc[k]]) : null);
    const lab = [0, 1, 2].map((i) => cellVal(line[i])).filter((v) => v !== null && v !== undefined).join(" ");
    if (/inactive projects/i.test(lab)) { status = "Inactive"; continue; }
    const pid = sv(g("pid")) || (c.leg >= 0 ? sv(g("leg")) : null);
    if (!pid) { if (lab.trim() && !/total/i.test(lab)) issues.push({ row: excelRow, level: "warning", field: "Project ID", message: `Row skipped — no project ID (“${lab.trim().slice(0, 50)}”)` }); continue; }
    if (HEADER_WORDS.has(pid.replace(/\s+/g, " ").trim().toLowerCase()) || /total/i.test(pid)) continue;
    let src = { line, c, row: excelRow, sheet };
    const v = vals?.get(pid); if (v) src = { line: v.line, c: v.c, row: v.row, sheet: co.values!.name };
    const rec: any = { entity, project_id: pid };
    let bad = false;
    for (const [k, col] of [["orig", "orig"], ["mods", "mods"], ["C", "C"], ["R", "R"], ["E", "E"], ["A", "A"], ["B", "B"]] as const) {
      const raw = src.c[col] >= 0 ? numCell(src.line[src.c[col]]) : null; const n = toNum(raw); rec[k] = n.n;
      if (n.bad) { bad = true; issues.push({ row: excelRow, level: "error", field: mapped[col] || k, message: `Not a number: "${raw}"` }); }
    }
    if (!bad && ["C", "R", "E", "A"].every((k) => rec[k] === null)) { issues.push({ row: excelRow, level: "warning", field: "Financials", message: `Row skipped — ${pid} has no contract, revenue, EAC or cost values` }); continue; }
    const name = sv(g("name")); const typ = (sv(g("typ")) || "").toUpperCase();
    Object.assign(rec, {
      project_name: name, pm: sv(g("pm")), status, jv: entity.includes("/") ? "Yes" : "No",
      icwo: ["IC", "IWO", "IWCT"].includes(typ) || /^IC\b/.test(name || "") ? "Yes" : "No",
      customer: sv(g("cust")), location: sv(g("loc")), contract_no: sv(g("cno")), start_date: toDate(g("sd")), end_date: toDate(g("ed")),
      bond_no: null, bond_status_raw: null, bond_method: null, _bonded: sv(g("bonded")), _typ: typ || null,
      source_row: src.row, source_file: fname, source_sheet: src.sheet, master_row: null, company: e?.company || null, bu: e?.bu || null, _excelRow: excelRow,
    });
    if (rec.B === null) issues.push({ row: excelRow, level: "warning", field: "Billings", message: "Billings blank — kept as unknown, not zero" });
    if (rec.E !== null && rec.A !== null && rec.E + 0.005 < rec.A) issues.push({ row: excelRow, level: "warning", field: "EAC", message: "EAC is below ITD cost" });
    if (rec.C !== null && rec.R !== null && rec.R - rec.C > 0.005) issues.push({ row: excelRow, level: "warning", field: "ITD Earned Revenue", message: "Earned revenue exceeds contract" });
    const k = `${entity}|${pid}`; if (seen.has(k)) issues.push({ row: excelRow, level: "warning", field: "Project ID", message: `Same entity + project ID also on row ${seen.get(k)} — both kept (no dedupe by ID alone)` }); else seen.set(k, excelRow);
    out.push(rec);
  }
  if (co.values) issues.unshift({ row: hi + 1, level: "warning", field: "Source", message: `Project list from “${sheet}”; values from “${co.values.name}” (the Summary tab’s earned revenue has not reconciled).` });
  return { rows: out, issues, format: "company-wip", sheet: co.values ? `${sheet} + ${co.values.name}` : sheet, headerRow: hi + 1, mapped, unmapped: [], entities: entity ? [entity] : [], period: detectPeriod(fname, subject) };
}

/** Flags a company file can't state reliably, carried from the governed neighbouring month by entity + project ID. */
export function applyCarryForward(rows: any[], ref: { label: string; rows: Map<string, any> } | null) {
  for (const r of rows) {
    const j = ref?.rows.get(`${r.entity}|${r.project_id}`);
    if (j) { r.icwo = j.icwo || r.icwo; r.bond_no = j.bond_no || null; r.bond_status_raw = j.bond_status_raw || null; r.bond_method = `Carried from ${ref!.label} bond match (entity + project ID)`; }
    else {
      const b = r._bonded || ""; r.bond_method = `Source Bonded flag (no ${ref ? ref.label : "prior-month"} match)`;
      r.bond_status_raw = r.entity === "RDG" ? "Needs Review" : /^y/i.test(b) ? "Bonded - Number Unmatched" : /^n/i.test(b) ? "Unbonded" : "Needs Review";
    }
    delete r._bonded; delete r._typ;
  }
}

export async function stageFile(buf: Buffer, fname: string, subject: string | null, forcedEntity: string | null): Promise<Staged> {
  if (/\.csv$/i.test(fname)) {
    const t = parseCsv(buf.toString("utf8").replace(/^\uFEFF/, ""));
    const h = findHeader(t);
    if (h < 0) throw new Error("Couldn’t find a header row with project and financial columns.");
    return stageTable(t, h, "CSV", fname, subject, forcedEntity, "csv");
  }
  const wb = await loadWorkbook(buf);
  const sheets = wb.worksheets;
  if (!sheets.some((x) => /03_MASTER_WIP|^WIP Data$/i.test(x.name))) { const co = companyWorkbook(sheets); if (co) return stageCompanyWip(co, fname, subject, forcedEntity); }
  const pick = sheets.find((s) => /03_MASTER_WIP/i.test(s.name)) || sheets.find((s) => /^WIP( Data)?$/i.test(s.name)) || sheets.find((s) => /wip/i.test(s.name) && !/instruction|readme|lists/i.test(s.name)) || sheets[0];
  const toTable = (ws: ExcelJS.Worksheet) => { const t: any[][] = []; ws.eachRow({ includeEmpty: true }, (row, n) => { const vals = (row.values as any[]).slice(1); t[n - 1] = vals; }); for (let i = 0; i < t.length; i++) if (!t[i]) t[i] = []; return t; };
  let t = toTable(pick), h = findHeader(t), ws = pick;
  if (h < 0) for (const s of sheets) { const tt = toTable(s); const hh = findHeader(tt); if (hh >= 0) { t = tt; h = hh; ws = s; break; } }
  if (h < 0) throw new Error("Couldn’t find a sheet with WIP columns (Project ID, Contract, Revenue, EAC, Cost).");
  const format = /03_MASTER_WIP/i.test(ws.name) ? "consolidated" : /^WIP Data$/i.test(ws.name) ? "standard-template" : "entity-wip";
  let subj = subject;
  if (format === "standard-template") {
    const info = sheets.find((s) => /instructions|cover/i.test(s.name));
    const pe = info ? String(cellVal(info.getCell("C6").value) || "") : "";
    const ent = info ? String(cellVal(info.getCell("C5").value) || "").trim() : "";
    if (pe) subj = `${pe} ${subject || ""}`;
    if (ent && !forcedEntity) forcedEntity = ent.split(/\s/)[0];
  }
  return stageTable(t, h, ws.name, fname, subj, forcedEntity, format);
}

/* ---------- proposed standard template (xlsx) ---------- */
export async function templateWorkbook(ents: Ent[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "The Data Guys";
  const ins = wb.addWorksheet("Instructions");
  ins.getColumn(2).width = 30; ins.getColumn(3).width = 70;
  ins.getCell("B2").value = "Standard Monthly WIP Submission — PROPOSED v0.1, pending executive confirmation";
  ins.getCell("B2").font = { bold: true, size: 14 };
  ins.getCell("B3").value = "Fill one row per project on the ‘WIP Data’ sheet. Leave a value blank if it is unknown — blanks are kept as unknown, never zero.";
  ins.getCell("B5").value = "Entity code"; ins.getCell("C5").value = ""; ins.getCell("C5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4CC" } };
  ins.getCell("B6").value = "Period end (YYYY-MM-DD)"; ins.getCell("C6").value = ""; ins.getCell("C6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4CC" } };
  ins.getCell("B7").value = "Prepared by"; ins.getCell("B8").value = "Reviewed by";
  ins.getCell("B10").value = "Email to the WIP intake address with the entity code and period in the file name, e.g. 2026-08-31 WIP SRI.xlsx";
  ins.getCell("B12").value = "Do not enter calculated fields (remaining contract, remaining cost, GP, margin, over/under billing). The Command Center calculates them.";
  ins.getCell("B5").font = ins.getCell("B6").font = { bold: true };
  (ins.getCell("C5") as any).dataValidation = { type: "list", allowBlank: false, formulae: [`Lists!$A$2:$A$${ents.length + 1}`] };
  const cols: [string, number, string][] = [
    ["Entity", 12, "Entity code from the list"], ["Project ID", 14, "Text — keep leading zeros"], ["Project Name", 34, ""], ["Project Manager", 20, ""],
    ["Status", 11, "Active / Inactive"], ["JV Flag", 9, "Yes / No"], ["IC/IWO Flag", 11, "Yes / No"], ["Bond Number", 14, "Text — keep leading zeros"], ["Bond Status", 16, "Bonded / Unbonded / Needs Review"],
    ["Original Contract", 16, "$"], ["Contract Mods", 15, "$ approved change orders"], ["Current/Revised Contract", 18, "$"], ["ITD Earned Revenue", 17, "$"], ["EAC", 16, "$ estimated cost at completion"], ["ITD Cost", 16, "$"], ["Billings", 16, "$ billed to date"],
    ["Customer", 20, ""], ["Location", 16, ""], ["Contract No.", 14, ""], ["Start Date", 12, "YYYY-MM-DD"], ["Est. Completion Date", 16, "YYYY-MM-DD — drives the backlog forecast"],
  ];
  const ws = wb.addWorksheet("WIP Data", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = cols.map(([h, w]) => ({ header: h, width: w }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14243A" } };
  cols.forEach(([, , note], i) => { if (note) ws.getCell(1, i + 1).note = note; });
  for (let r = 2; r <= 400; r++) {
    ws.getCell(r, 2).numFmt = "@"; ws.getCell(r, 8).numFmt = "@";
    for (let c = 10; c <= 16; c++) ws.getCell(r, c).numFmt = "#,##0.00;(#,##0.00)";
    (ws.getCell(r, 1) as any).dataValidation = { type: "list", allowBlank: true, formulae: [`Lists!$A$2:$A$${ents.length + 1}`] };
    (ws.getCell(r, 5) as any).dataValidation = { type: "list", allowBlank: true, formulae: ['"Active,Inactive"'] };
    (ws.getCell(r, 6) as any).dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes,No"'] };
    (ws.getCell(r, 7) as any).dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes,No"'] };
    (ws.getCell(r, 9) as any).dataValidation = { type: "list", allowBlank: true, formulae: ['"Bonded,Unbonded,Needs Review"'] };
  }
  const li = wb.addWorksheet("Lists");
  li.getCell("A1").value = "Entity"; li.getCell("B1").value = "Company"; li.getCell("C1").value = "Business Unit";
  ents.forEach((e, i) => { li.getCell(i + 2, 1).value = e.code; li.getCell(i + 2, 2).value = e.company; li.getCell(i + 2, 3).value = e.bu; });
  li.getColumn(2).width = 40; li.getColumn(3).width = 22;
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function reconTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Recon", { views: [{ state: "frozen", ySplit: 1 }] });
  const cols = ["Entity", "Project ID", "Project Name", "CostPoint Actual", "HCSS Actual", "Procore Actual", "Open AP / Accrual", "WIP EAC", "Prior EAC", "Approved CO Value", "Pending CO Value", "Management Adjustment", "Adjustment Reason", "Owner"];
  ws.columns = cols.map((h) => ({ header: h, width: Math.max(14, h.length + 4) }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14243A" } };
  const n = wb.addWorksheet("Notes");
  n.getCell("A1").value = "Month-end reconciliation template — PROPOSED v0.1, pending executive confirmation";
  n.getCell("A2").value = "One row per project per month. Blank = unknown. The Command Center auto-clears rows that tie within tolerance or are explained, and routes the rest.";
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const RECON_F: Record<string, string[]> = {
  entity: ["entity"], project_id: ["project id", "project", "job"], project_name: ["project name", "name"],
  cp: ["costpoint actual", "costpoint", "cp actual"], hcss: ["hcss actual", "hcss"], procore: ["procore actual", "procore"], open_ap: ["open ap / accrual", "open ap", "accrual"],
  eac: ["wip eac", "eac"], prior_eac: ["prior eac"], approved_co: ["approved co value", "approved co"], pending_co: ["pending co value", "pending co"],
  mgmt_adj: ["management adjustment", "mgmt adjustment"], adj_reason: ["adjustment reason", "reason"], owner: ["owner"],
};
export async function parseRecon(buf: Buffer, fname: string) {
  let t: any[][];
  if (/\.csv$/i.test(fname)) t = parseCsv(buf.toString("utf8").replace(/^\uFEFF/, ""));
  else { const wb = await loadWorkbook(buf); const ws = wb.worksheets[0]; t = []; ws.eachRow({ includeEmpty: true }, (row, n) => { t[n - 1] = (row.values as any[]).slice(1); }); }
  const syn = new Map<string, string>(); for (const [k, a] of Object.entries(RECON_F)) for (const s of a) syn.set(norm(s), k);
  const h = (t[0] || []).map((x) => syn.get(norm(cellVal(x))) || null);
  const out: any[] = [];
  for (let i = 1; i < t.length; i++) {
    const rec: any = {}; let any = false;
    h.forEach((k, j) => { if (!k) return; const v = cellVal((t[i] || [])[j]); if (v !== null && String(v).trim() !== "") any = true; rec[k] = ["entity", "project_id", "project_name", "adj_reason", "owner"].includes(k) ? (v === null ? null : String(v).trim()) : toNum(v).n; });
    if (any && rec.project_id) out.push(rec);
  }
  return out;
}
