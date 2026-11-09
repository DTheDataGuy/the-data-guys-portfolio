import { db, getSetting } from "./db";
import { normBond, type Row } from "@shared/calc";

export type Rule = {
  id: string; name: string; condition: string; treatment: string; basis: string; status: "approved" | "proposed";
  active: boolean; version: number; params: Record<string, any>;
};
export const DEFAULT_RULES: Rule[] = [
  { id: "R-ICWO", name: "IC/IWO intercompany", condition: "IC/IWO flag = Yes", treatment: "Exclude from operating reporting", basis: "Executive prior review + 8/31", status: "approved", active: true, version: 1, params: { keep: ["SRI|2401"] } },
  { id: "R-INACTIVE", name: "Inactive projects", condition: "Status = Inactive", treatment: "Exclude from reporting and bond-management population", basis: "Executive 8/31", status: "approved", active: true, version: 1, params: {} },
  { id: "R-JV", name: "JV treatment", condition: "JV flag = Yes", treatment: "Exclude from operating KPIs; active JV rows retained for the bond report", basis: "Executive prior review", status: "approved", active: true, version: 1, params: {} },
  { id: "R-IWCT", name: "Internal work naming", condition: "Project ID or name contains an internal-work token", treatment: "Exclude from operating reporting", basis: "Executive 8/31", status: "approved", active: true, version: 1, params: { tokens: ["IWCT"] } },
  { id: "R-CCV", name: "Cascade Civil internal / equipment", condition: "CCV project ID starts with a prefix or contains a token", treatment: "Exclude from operating reporting", basis: "Executive 8/31", status: "approved", active: true, version: 1, params: { entity: "CCV", prefixes: ["127"], tokens: ["TRCK", "INCO"] } },
  { id: "R-SRI", name: "Summit Inc small / prior-year", condition: "SRI project ID is 5 digits or ends in 99", treatment: "Exclude from operating reporting", basis: "Executive 8/31", status: "approved", active: true, version: 1, params: { entity: "SRI", digits: 5, suffix: "99" } },
  { id: "R-RDG", name: "RDG equipment / internal", condition: "July 2026: RDG source rows 98–101 (letter-coded equipment/internal). Other months: the same four letter-coded project IDs, because row numbers shift between workbooks", treatment: "Exclude from operating reporting", basis: "Executive 8/31 (row numbers apply to the July workbook only; ID carry-forward proposed, pending executive approval)", status: "approved", active: true, version: 2, params: { entity: "RDG", sourceRows: [98, 99, 100, 101], sourceRowsPeriod: "2026-07", projectIds: ["RDGEQIW", "RDGEQLS", "RDGIWCT", "RDGMISC.AK.EQUIPSRVC"] } },
  { id: "R-CTRL", name: "Source control / reconciliation row", condition: "Numeric project ID ≤ 0 or 9+ digits (not a project)", treatment: "Exclude — not a project", basis: "Proposed, pending executive approval (matches 2 July SRI rows)", status: "proposed", active: true, version: 1, params: { minDigits: 9 } },
];
export const getRules = () => getSetting<Rule[]>("rules", DEFAULT_RULES);

export function evaluate(r: Omit<Row, "reasons" | "eligible" | "inBondReport" | "bondStatus">, rules = getRules()) {
  const reasons: string[] = [];
  const id = String(r.projectId || "").trim(), up = id.toUpperCase(), name = String(r.projectName || "").toUpperCase();
  const on = (k: string) => rules.find((x) => x.id === k && x.active);
  let x: Rule | undefined;
  if ((x = on("R-ICWO")) && /^y/i.test(r.icwo || "") && !(x.params.keep || []).includes(`${r.entity}|${id}`)) reasons.push("R-ICWO");
  if (on("R-INACTIVE") && /^inactive/i.test(r.status || "")) reasons.push("R-INACTIVE");
  if (on("R-JV") && /^y/i.test(r.jv || "")) reasons.push("R-JV");
  if ((x = on("R-IWCT")) && (x.params.tokens || []).some((t: string) => up.includes(t.toUpperCase()) || name.includes(t.toUpperCase()))) reasons.push("R-IWCT");
  if ((x = on("R-CCV")) && r.entity === x.params.entity && ((x.params.prefixes || []).some((p: string) => up.startsWith(p)) || (x.params.tokens || []).some((t: string) => up.includes(t)))) reasons.push("R-CCV");
  if ((x = on("R-SRI")) && r.entity === x.params.entity && ((new RegExp(`^\\d{${x.params.digits}}$`).test(id)) || (x.params.suffix && /^\d+$/.test(id) && id.endsWith(x.params.suffix)))) reasons.push("R-SRI");
  if ((x = on("R-RDG")) && r.entity === x.params.entity) {
    const rowPer = x.params.sourceRowsPeriod || "2026-07";
    const byRow = (r as any).period === rowPer && (x.params.sourceRows || []).includes(Number(r.sourceRow));
    const byId = (r as any).period !== rowPer && (x.params.projectIds || []).map((v: string) => v.toUpperCase()).includes(up);
    if (byRow || byId) reasons.push("R-RDG");
  }
  if ((x = on("R-CTRL")) && /^-?\d+$/.test(id) && (Number(id) <= 0 || id.replace("-", "").length >= (x.params.minDigits || 9))) reasons.push("R-CTRL");
  let eligible = reasons.length === 0;
  if (r.override === "include") eligible = true;
  if (r.override === "exclude") eligible = false;
  const bondStatus = normBond(r.bondStatusRaw);
  const inBondReport = eligible || (/^y/i.test(r.jv || "") && !/^inactive/i.test(r.status || ""));
  return { reasons, eligible, inBondReport, bondStatus };
}

export function mapRow(d: any, rules = getRules()): Row {
  const base = {
    id: d.id, period: d.period, importId: d.import_id, entity: d.entity, company: d.company || "", bu: d.bu || "Unassigned",
    sourceFile: d.source_file || "", sourceSheet: d.source_sheet || "", sourceRow: d.source_row, masterRow: d.master_row,
    projectId: d.project_id, projectName: d.project_name || "", pm: d.pm, status: d.status || "", jv: d.jv || "No", icwo: d.icwo || "No",
    impElig: d.imp_elig, mgmtElig: d.mgmt_elig, impExcl: d.imp_excl, bondNo: d.bond_no, bondStatusRaw: d.bond_status_raw,
    orig: d.orig, mods: d.mods, C: d.C, R: d.R, E: d.E, A: d.A, B: d.B, legacyExc: d.legacy_exc, legacySev: d.legacy_sev,
    customer: d.customer, location: d.location, contractNo: d.contract_no, inferred: d.inferred, bondMethod: d.bond_method, bondScore: d.bond_score,
    legacyBondReport: d.legacy_bond_report, startDate: d.start_date, endDate: d.end_date, override: d.override, overrideReason: d.override_reason, edited: d.edited,
  };
  return { ...base, ...evaluate(base as any, rules) } as Row;
}

export function periodRows(period: string, scope = "*"): Row[] {
  const rules = getRules();
  const all = (db.prepare("SELECT * FROM rows WHERE period=? ORDER BY entity, source_row, rowid").all(period) as any[]).map((d) => mapRow(d, rules));
  if (scope === "*" || !scope) return all;
  const allow = new Set(scope.split(",").map((s) => s.trim()));
  return all.filter((r) => allow.has(r.entity) || allow.has(r.entity.split("/")[0]));
}
