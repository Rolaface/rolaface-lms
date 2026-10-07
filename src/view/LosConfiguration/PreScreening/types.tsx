/* ============================================================
   types.tsx
   Domain types + helpers shared by every Pre-Screening tab.
   Fields, operators, severities, actions and date units are NOT
   hardcoded: they are loaded once from get_prescreening_fields
   through setPrescreeningConfig().
   ============================================================ */

export type FieldType = "numeric" | "text" | "dropdown" | "boolean" | "date";
export type RuleValue = string | number | boolean | null;

export interface FieldDef {
  id: string;
  label: string;
  category: string;
  type: FieldType;
  unit?: string;
  options?: string[];
}

export type Severity = string;

export interface Rule {
  id: string;
  fieldId: string | null;
  operator?: string;
  value?: RuleValue;
  value2?: RuleValue;
  values?: string[];
  dateUnit?: string;
  severity: Severity;
  action?: string;
  actionTouched?: boolean;
  disabled?: boolean;
}

export interface RuleGroup {
  id: string;
  name: string;
  logic: "ALL" | "ANY";
  rules: Rule[];
}

export interface VersionEntry {
  name: string;
  version: string;
  status: string;
  effective_from?: string | null;
  effective_to?: string | null;
  published_by?: string | null;
  published_on?: string | null;
  rules_count?: number;
}

export interface AuditEntry {
  date: string;
  user: string;
  action: string;
  detail: string;
}

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  product: string;
  productName: string;
  draftId?: string | null;
  status: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string;
  evaluationStrategy: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  publishedBy: string;
  publishedDate: string;
  groups: RuleGroup[];
  versions: VersionEntry[];
  audit: AuditEntry[];
}

export interface RuleSetSummary {
  id: string;
  draftId: string | null;
  name: string;
  productCode: string;
  product: string;
  status: string;
  version: string;
  rulesCount: number;
  modifiedDate: string;
  modifiedBy: string;
}

export interface OperatorDef {
  id: string;
  label: string;
}

export interface SeverityDef {
  label: string;
  color: string;
  wash: string;
  defaultAction: string;
  desc: string;
}

/* ============================================================
   CONFIG (filled from the API). Empty until loaded.
   ============================================================ */
export let FIELDS: FieldDef[] = [];
export let CATEGORY_ORDER: string[] = [];
export let OPERATORS: Record<string, OperatorDef[]> = {};
export let SEVERITIES: Record<string, SeverityDef> = {};
export let ACTIONS: string[] = [];
export let DATE_UNITS: string[] = [];

const SEVERITY_STYLE: Record<string, { color: string; wash: string }> = {
  Blocking: { color: "#C0322A", wash: "#FBEAE9" },
  Warning: { color: "#B45309", wash: "#FEF3E1" },
  Review: { color: "#2B6CB0", wash: "#E8F1FB" },
};
const FALLBACK_STYLE = { color: "#475569", wash: "#F1F5F9" };

const humanize = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const OPERATOR_LABELS: Record<string, string> = {
  equals: "is",
  not_equals: "is not",
  greater_than: "is greater than",
  greater_than_or_equal: "is at least",
  less_than: "is less than",
  less_than_or_equal: "is at most",
  between: "is between",
  in: "is one of",
  not_in: "is not one of",
  contains: "contains",
  starts_with: "starts with",
  before: "is before",
  after: "is after",
  older_than: "is older than",
};

export const formatDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(String(d).replace(" ", "T").slice(0, 19));
  return isNaN(dt.getTime()) ? d : dt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
};

export const formatDay = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const pickId = (x: any): string =>
  typeof x === "string"
    ? x
    : String(x?.id ?? x?.value ?? x?.name ?? x?.key ?? x?.operator ?? x?.severity ?? x?.action ?? x?.unit ?? "");

const pickLabel = (x: any, id: string): string =>
  typeof x === "string" ? humanize(id) : String(x?.label ?? x?.title ?? humanize(id));

const toOptions = (o: any): string[] | undefined => {
  if (Array.isArray(o)) {
    return o.map((x) => (typeof x === "string" ? x : String(x?.value ?? x?.label ?? x?.name ?? x?.id ?? "")));
  }
  if (typeof o === "string" && o.trim()) {
    return o.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
};

export const setFields = (f: FieldDef[]) => {
  FIELDS = f;
  const cats: string[] = [];
  f.forEach((x) => { if (!cats.includes(x.category)) cats.push(x.category); });
  CATEGORY_ORDER = cats;
};

export function setPrescreeningConfig(payload: any) {
  const cfg = Array.isArray(payload) ? { fields: payload } : payload ?? {};

  // fields
  setFields(
    (cfg.fields ?? []).map((item: any) => ({
      id: item.field_name || item.id || item.name,
      label: item.label || item.field_name || item.name,
      category: item.category || item.field_category || "Other",
      type: item.type || item.field_type || "text",
      unit: item.unit || undefined,
      options: toOptions(item.options),
    }))
  );

  // operators: { numeric: [...], text: [...] } /[{type, id, label}]
  const ops: Record<string, OperatorDef[]> = {};
  const rawOps = cfg.operators;
  const addOp = (type: string, o: any) => {
    const id = pickId(o);
    if (!id) return;
    (ops[type] = ops[type] || []).push({ id, label: OPERATOR_LABELS[id] ?? pickLabel(o, id).toLowerCase() });
  };
  if (Array.isArray(rawOps)) {
    rawOps.forEach((o: any) => addOp(String(o?.type ?? o?.field_type ?? ""), o));
  } else if (rawOps && typeof rawOps === "object") {
    Object.entries(rawOps).forEach(([type, list]) => {
      if (Array.isArray(list)) list.forEach((o) => addOp(type, o));
    });
  }
  OPERATORS = ops;

  // severities
  const sev: Record<string, SeverityDef> = {};
  (cfg.severities ?? []).forEach((s: any) => {
    const id = pickId(s);
    if (!id) return;
    const style = SEVERITY_STYLE[id] ?? FALLBACK_STYLE;
    sev[id] = {
      label: typeof s === "string" ? id : String(s?.label ?? id),
      color: style.color,
      wash: style.wash,
      defaultAction: typeof s === "string" ? "" : String(s?.default_action ?? s?.defaultAction ?? s?.action ?? ""),
      desc: typeof s === "string" ? "" : String(s?.description ?? s?.desc ?? ""),
    };
  });
  SEVERITIES = sev;

  // actions + date units
  ACTIONS = (cfg.actions ?? []).map(pickId).filter(Boolean);
  DATE_UNITS = (cfg.date_units ?? []).map(pickId).filter(Boolean);
}

export const fieldById = (id: string | null | undefined): FieldDef | undefined =>
  FIELDS.find((f) => f.id === id);

export const opLabel = (type: FieldType, id?: string) =>
  (OPERATORS[type] ?? []).find((o) => o.id === id)?.label || id;

/* ============================================================
   OPERATOR LOGIC (for sentence generation and local evaluation)
   ============================================================ */
export type OpCat =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
  | "between" | "in" | "notin" | "contains" | "startswith"
  | "relative" | "before" | "after" | "other";

const OP_ALIASES: Record<string, OpCat> = {
  eq: "eq", equals: "eq", equal: "eq", is: "eq", on: "eq",
  neq: "neq", notequals: "neq", notequal: "neq", isnot: "neq",
  gt: "gt", greaterthan: "gt",
  gte: "gte", greaterthanorequal: "gte", greaterthanorequalto: "gte",
  lt: "lt", lessthan: "lt",
  lte: "lte", lessthanorequal: "lte", lessthanorequalto: "lte",
  between: "between",
  in: "in", oneof: "in", isoneof: "in",
  notin: "notin", notoneof: "notin", isnotoneof: "notin",
  contains: "contains",
  startswith: "startswith",
  relative: "relative",
  olderthan: "relative",
  before: "before",
  after: "after",
};

export const opCat = (op?: string): OpCat => {
  const n = String(op ?? "").toLowerCase().replace(/[\s_\-]/g, "");
  if (OP_ALIASES[n]) return OP_ALIASES[n];
  if (n.includes("ago") || n.includes("relative")) return "relative";
  return "other";
};
export const isListOp = (op?: string) => ["in", "notin"].includes(opCat(op));
export const isBetweenOp = (op?: string) => opCat(op) === "between";
export const isRelativeOp = (op?: string) => opCat(op) === "relative";

/* ============================================================
   FORMATTING + SENTENCE GENERATION
   ============================================================ */
export function fmtVal(field: FieldDef | undefined, v: RuleValue | undefined): string {
  if (!field) return "…";
  if (v === undefined || v === null || v === "") return "…";
  if (field.type === "numeric") {
    const n = Number(v).toLocaleString();
    if (field.unit === "ZMW") return `ZMW ${n}`;
    if (field.unit === "%") return `${v}%`;
    if (field.unit) return `${n} ${field.unit}`;
    return n;
  }
  if (field.type === "boolean") return v === true || v === "Yes" ? "Yes" : "No";
  return String(v);
}

export function ruleSentence(rule: Rule): string {
  const field = fieldById(rule.fieldId);
  if (!field) return "Select a criterion to begin";
  const t = field.type;
  if (t === "numeric") {
    if (isBetweenOp(rule.operator)) {
      if (rule.value == null || rule.value2 == null) return `${field.label} is between …`;
      return `${field.label} is between ${fmtVal(field, rule.value)} and ${fmtVal(field, rule.value2)}`;
    }
    if (rule.value === undefined || rule.value === null || rule.value === "") return `${field.label} ${opLabel(t, rule.operator)} …`;
    return `${field.label} ${opLabel(t, rule.operator)} ${fmtVal(field, rule.value)}`;
  }
  if (t === "text" || t === "dropdown") {
    if (isListOp(rule.operator)) {
      if (!rule.values || !rule.values.length) return `${field.label} ${opLabel(t, rule.operator)} …`;
      return `${field.label} ${opLabel(t, rule.operator)} ${rule.values.join(", ")}`;
    }
    if (!rule.value) return `${field.label} ${opLabel(t, rule.operator)} …`;
    return t === "text"
      ? `${field.label} ${opLabel(t, rule.operator)} "${rule.value}"`
      : `${field.label} ${opLabel(t, rule.operator)} ${rule.value}`;
  }
  if (t === "boolean") {
    if (rule.value === undefined || rule.value === null) return `${field.label} is …`;
    return `${field.label} is ${rule.value ? "Yes" : "No"}`;
  }
  if (t === "date") {
    if (isRelativeOp(rule.operator)) {
      if (!rule.value) return `${field.label} is more than … ago`;
      return `${field.label} is more than ${rule.value} ${rule.dateUnit ?? ""} ago`.replace("  ", " ");
    }
    if (isBetweenOp(rule.operator)) {
      if (!rule.value || !rule.value2) return `${field.label} is between …`;
      return `${field.label} is between ${rule.value} and ${rule.value2}`;
    }
    if (!rule.value) return `${field.label} ${opLabel(t, rule.operator)} …`;
    return `${field.label} ${opLabel(t, rule.operator)} ${rule.value}`;
  }
  return field.label;
}

export function negativeRuleSentence(rule: Rule): string {
  const sentence = ruleSentence(rule);
  if (sentence === "Select a criterion to begin" || sentence.includes(" …")) return sentence;
  const field = fieldById(rule.fieldId)?.label || sentence.split(" ")[0];
  const condition = sentence.slice(field.length + 1);
  if (/^is not /i.test(condition)) return `${field} is Not${condition.slice(6)}`;
  if (/^is /i.test(condition)) return `${field} is Not${condition.slice(2)}`;
  if (/^contains /i.test(condition)) return `${field} does Not${condition.slice(8)}`;
  if (/^starts with /i.test(condition)) return `${field} does Not${condition.slice(11)}`;
  if (/^equals /i.test(condition)) return `${field} does Not equal${condition.slice(7)}`;
  return `${field} Not ${condition}`;
}

export function ruleIsComplete(rule: Rule): boolean {
  const field = fieldById(rule.fieldId);
  if (!field) return false;
  if (field.type === "numeric") {
    if (isBetweenOp(rule.operator))
      return rule.value !== undefined && rule.value !== "" && rule.value2 !== undefined && rule.value2 !== "" && Number(rule.value2) > Number(rule.value);
    return rule.value !== undefined && rule.value !== null && rule.value !== "" && !isNaN(Number(rule.value));
  }
  if (field.type === "text" || field.type === "dropdown") {
    if (isListOp(rule.operator)) return !!(rule.values && rule.values.length > 0);
    return !!rule.value;
  }
  if (field.type === "boolean") return rule.value === true || rule.value === false;
  if (field.type === "date") {
    if (isBetweenOp(rule.operator)) return !!rule.value && !!rule.value2;
    return !!rule.value;
  }
  return false;
}

/* ============================================================
   LOCAL EVALUATION 
   ============================================================ */
export function evalRule(rule: Rule, sampleValue: RuleValue | undefined): boolean | null {
  const field = fieldById(rule.fieldId);
  if (!field) return null;
  if (sampleValue === undefined || sampleValue === "") return null;
  const cat = opCat(rule.operator);
  if (field.type === "numeric") {
    const v = Number(sampleValue);
    switch (cat) {
      case "eq": return v === Number(rule.value);
      case "neq": return v !== Number(rule.value);
      case "gt": return v > Number(rule.value);
      case "gte": return v >= Number(rule.value);
      case "lt": return v < Number(rule.value);
      case "lte": return v <= Number(rule.value);
      case "between": return v >= Number(rule.value) && v <= Number(rule.value2);
      default: return null;
    }
  }
  if (field.type === "boolean") return sampleValue === rule.value;
  if (field.type === "dropdown" || field.type === "text") {
    const list = rule.values || [];
    switch (cat) {
      case "eq": return sampleValue === rule.value;
      case "neq": return sampleValue !== rule.value;
      case "in": return list.includes(sampleValue as string);
      case "notin": return !list.includes(sampleValue as string);
      case "contains": return String(sampleValue).toLowerCase().includes(String(rule.value || "").toLowerCase());
      case "startswith": return String(sampleValue).toLowerCase().startsWith(String(rule.value || "").toLowerCase());
      default: return null;
    }
  }
  return null;
}

export interface ValidationResult {
  issues: string[];
  warnings: string[];
  rulesCount: number;
  ok: boolean;
}

export function computeValidation(ruleSet: RuleSet): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  if (ruleSet.groups.length === 0) issues.push("Add at least one rule group.");
  ruleSet.groups.forEach((g) => {
    if (g.rules.length === 0) issues.push(`"${g.name}" has no rules configured.`);
    g.rules.forEach((r) => {
      if (!ruleIsComplete(r)) {
        const f = fieldById(r.fieldId);
        issues.push(`${f ? f.label : "A rule"} in "${g.name}" is missing a value.`);
      }
    });
    if (g.logic === "ALL") {
      const byField: Record<string, Rule[]> = {};
      g.rules.forEach((r) => {
        if (!r.fieldId) return;
        (byField[r.fieldId] = byField[r.fieldId] || []).push(r);
      });
      Object.entries(byField).forEach(([fid, rules]) => {
        const field = fieldById(fid);
        if (field && field.type === "numeric" && rules.length > 1) {
          let min = -Infinity;
          let max = Infinity;
          rules.forEach((r) => {
            if (!ruleIsComplete(r)) return;
            const c = opCat(r.operator);
            if (c === "gt" || c === "gte") min = Math.max(min, Number(r.value));
            if (c === "lt" || c === "lte") max = Math.min(max, Number(r.value));
            if (c === "between") { min = Math.max(min, Number(r.value)); max = Math.min(max, Number(r.value2)); }
            if (c === "eq") { min = Math.max(min, Number(r.value)); max = Math.min(max, Number(r.value)); }
          });
          if (min > max) warnings.push(`"${field.label}" rules in "${g.name}" may conflict and could make the rule impossible to satisfy.`);
        }
      });
    }
  });
  const rulesCount = ruleSet.groups.reduce((a, g) => a + g.rules.length, 0);
  return { issues, warnings, rulesCount, ok: issues.length === 0 };
}