/* ============================================================
   types.ts
   Domain types, field catalog, operators, and evaluation logic
   shared by every Pre-Screening tab.
   ============================================================ */

export type FieldType = "numeric" | "text" | "dropdown" | "boolean" | "date";

export interface FieldDef {
  id: string;
  label: string;
  category: string;
  type: FieldType;
  unit?: string;
  options?: string[];
}

export type Severity = "Blocking" | "Warning" | "Review";

export interface Rule {
  id: string;
  fieldId: string | null;
  operator?: string;
  value?: any;
  value2?: any;
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
  version: string;
  status: string;
  effective: string;
  by: string;
  note: string;
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
  name: string;
  product: string;
  status: string;
  version: string;
  rulesCount: number;
  modifiedDate: string;
  modifiedBy: string;
}

/* ============================================================
   FIELD CATALOG
   ============================================================ */
export const FIELDS: FieldDef[] = [
  { id: "age", label: "Applicant Age", category: "Applicant", type: "numeric", unit: "years" },
  { id: "gender", label: "Gender", category: "Applicant", type: "dropdown", options: ["Male", "Female", "Other"] },
  { id: "nationality", label: "Nationality", category: "Applicant", type: "dropdown", options: ["Zambian", "Non-Zambian"] },
  { id: "customerType", label: "Customer Type", category: "Applicant", type: "dropdown", options: ["New Customer", "Existing Customer"] },
  { id: "location", label: "Applicant Location", category: "Applicant", type: "text" },
  { id: "employmentStatus", label: "Employment Status", category: "Employment", type: "dropdown", options: ["Permanent", "Contract", "Self Employed", "Temporary", "Unemployed"] },
  { id: "employer", label: "Employer", category: "Employment", type: "text" },
  { id: "employmentDuration", label: "Employment Duration", category: "Employment", type: "numeric", unit: "months" },
  { id: "monthlyIncome", label: "Monthly Income", category: "Employment", type: "numeric", unit: "ZMW" },
  { id: "creditScore", label: "Credit Score", category: "Credit", type: "numeric", unit: "pts" },
  { id: "previousDefaults", label: "Number of Previous Defaults", category: "Credit", type: "numeric", unit: "count" },
  { id: "hasPreviousDefault", label: "Has Previous Default", category: "Credit", type: "boolean" },
  { id: "existingLoans", label: "Number of Active Loans", category: "Credit", type: "numeric", unit: "count" },
  { id: "hasExistingLoan", label: "Has Existing Loan", category: "Credit", type: "boolean" },
  { id: "overdueAmount", label: "Existing Overdue Amount", category: "Credit", type: "numeric", unit: "ZMW" },
  { id: "dti", label: "Debt-to-Income Ratio", category: "Credit", type: "numeric", unit: "%" },
  { id: "riskCategory", label: "Customer Risk Category", category: "Credit", type: "dropdown", options: ["Low", "Medium", "High"] },
  { id: "loanAmount", label: "Loan Amount", category: "Loan", type: "numeric", unit: "ZMW" },
  { id: "loanPurpose", label: "Loan Purpose", category: "Loan", type: "dropdown", options: ["Personal", "Business", "Education", "Medical", "Home Improvement"] },
  { id: "loanTenure", label: "Loan Tenure", category: "Loan", type: "numeric", unit: "months" },
  { id: "customerSince", label: "Customer Since", category: "Other", type: "date" },
  { id: "dob", label: "Date of Birth", category: "Other", type: "date" },
];

export const fieldById = (id: string | null | undefined): FieldDef | undefined =>
  FIELDS.find((f) => f.id === id);

export const CATEGORY_ORDER = ["Applicant", "Employment", "Credit", "Loan", "Other"];

export const OPERATORS: Record<FieldType, { id: string; label: string }[]> = {
  numeric: [
    { id: "eq", label: "equals" },
    { id: "neq", label: "is not equal to" },
    { id: "gt", label: "is greater than" },
    { id: "gte", label: "is at least" },
    { id: "lt", label: "is less than" },
    { id: "lte", label: "is at most" },
    { id: "between", label: "is between" },
  ],
  text: [
    { id: "eq", label: "is" },
    { id: "neq", label: "is not" },
    { id: "contains", label: "contains" },
    { id: "startsWith", label: "starts with" },
    { id: "oneOf", label: "is one of" },
  ],
  dropdown: [
    { id: "is", label: "is" },
    { id: "isNot", label: "is not" },
    { id: "isOneOf", label: "is one of" },
    { id: "isNotOneOf", label: "is not one of" },
  ],
  boolean: [{ id: "is", label: "is" }],
  date: [
    { id: "before", label: "is before" },
    { id: "after", label: "is after" },
    { id: "on", label: "is on" },
    { id: "between", label: "is between" },
    { id: "relative", label: "is more than" },
  ],
};

export const opLabel = (type: FieldType, id?: string) =>
  (OPERATORS[type].find((o) => o.id === id) || ({} as any)).label || id;

export const SEVERITIES: Record<Severity, { color: string; wash: string; defaultAction: string; desc: string }> = {
  Blocking: { color: "var(--psm-danger)", wash: "var(--psm-danger-wash)", defaultAction: "Reject Application", desc: "Application cannot proceed." },
  Warning: { color: "var(--psm-warn)", wash: "var(--psm-warn-wash)", defaultAction: "Continue with Warning", desc: "Application may continue but shows a warning." },
  Review: { color: "var(--psm-review)", wash: "var(--psm-review-wash)", defaultAction: "Send for Manual Review", desc: "Application is routed to Credit Review." },
};

export const ACTIONS = ["Reject Application", "Mark as Ineligible", "Send for Manual Review", "Continue with Warning"];

/* ============================================================
   FORMATTING + SENTENCE GENERATION
   ============================================================ */
export function fmtVal(field: FieldDef | undefined, v: any): string {
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
    if (rule.operator === "between") {
      if (rule.value == null || rule.value2 == null) return `${field.label} is between …`;
      return `${field.label} is between ${fmtVal(field, rule.value)} and ${fmtVal(field, rule.value2)}`;
    }
    if (rule.value === undefined || rule.value === null || rule.value === "") return `${field.label} ${opLabel(t, rule.operator)} …`;
    return `${field.label} ${opLabel(t, rule.operator)} ${fmtVal(field, rule.value)}`;
  }
  if (t === "text") {
    if (rule.operator === "oneOf") {
      if (!rule.values || !rule.values.length) return `${field.label} is one of …`;
      return `${field.label} is one of ${rule.values.join(", ")}`;
    }
    if (!rule.value) return `${field.label} ${opLabel(t, rule.operator)} …`;
    return `${field.label} ${opLabel(t, rule.operator)} "${rule.value}"`;
  }
  if (t === "dropdown") {
    if (rule.operator === "isOneOf" || rule.operator === "isNotOneOf") {
      if (!rule.values || !rule.values.length) return `${field.label} ${opLabel(t, rule.operator)} …`;
      return `${field.label} ${opLabel(t, rule.operator)} ${rule.values.join(", ")}`;
    }
    if (!rule.value) return `${field.label} ${opLabel(t, rule.operator)} …`;
    return `${field.label} ${opLabel(t, rule.operator)} ${rule.value}`;
  }
  if (t === "boolean") {
    if (rule.value === undefined || rule.value === null) return `${field.label} is …`;
    return `${field.label} is ${rule.value ? "Yes" : "No"}`;
  }
  if (t === "date") {
    if (rule.operator === "relative") {
      if (!rule.value) return `${field.label} is more than … ago`;
      return `${field.label} is more than ${rule.value} ${rule.dateUnit || "months"} ago`;
    }
    if (rule.operator === "between") {
      if (!rule.value || !rule.value2) return `${field.label} is between …`;
      return `${field.label} is between ${rule.value} and ${rule.value2}`;
    }
    if (!rule.value) return `${field.label} ${opLabel(t, rule.operator)} …`;
    return `${field.label} ${opLabel(t, rule.operator)} ${rule.value}`;
  }
  return field.label;
}

export function ruleIsComplete(rule: Rule): boolean {
  const field = fieldById(rule.fieldId);
  if (!field) return false;
  if (field.type === "numeric") {
    if (rule.operator === "between")
      return rule.value !== undefined && rule.value !== "" && rule.value2 !== undefined && rule.value2 !== "" && Number(rule.value2) > Number(rule.value);
    return rule.value !== undefined && rule.value !== "" && !isNaN(Number(rule.value));
  }
  if (field.type === "text") {
    if (rule.operator === "oneOf") return !!(rule.values && rule.values.length > 0);
    return !!rule.value;
  }
  if (field.type === "dropdown") {
    if (rule.operator === "isOneOf" || rule.operator === "isNotOneOf") return !!(rule.values && rule.values.length > 0);
    return !!rule.value;
  }
  if (field.type === "boolean") return rule.value === true || rule.value === false;
  if (field.type === "date") {
    if (rule.operator === "between") return !!rule.value && !!rule.value2;
    return !!rule.value;
  }
  return false;
}

/* ============================================================
   EVALUATION (for Test / Simulation)
   ============================================================ */
export function evalRule(rule: Rule, sampleValue: any): boolean | null {
  const field = fieldById(rule.fieldId);
  if (!field) return null;
  if (sampleValue === undefined || sampleValue === "") return null; // no data supplied
  if (field.type === "numeric") {
    const v = Number(sampleValue);
    switch (rule.operator) {
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
    switch (rule.operator) {
      case "is": case "eq": return sampleValue === rule.value;
      case "isNot": case "neq": return sampleValue !== rule.value;
      case "isOneOf": case "oneOf": return list.includes(sampleValue);
      case "isNotOneOf": return !list.includes(sampleValue);
      case "contains": return String(sampleValue).toLowerCase().includes(String(rule.value || "").toLowerCase());
      case "startsWith": return String(sampleValue).toLowerCase().startsWith(String(rule.value || "").toLowerCase());
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
    // naive numeric conflict detection within ALL groups
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
            if (["gt", "gte"].includes(r.operator!)) min = Math.max(min, Number(r.value));
            if (["lt", "lte"].includes(r.operator!)) max = Math.min(max, Number(r.value));
            if (r.operator === "between") { min = Math.max(min, Number(r.value)); max = Math.min(max, Number(r.value2)); }
            if (r.operator === "eq") { min = Math.max(min, Number(r.value)); max = Math.min(max, Number(r.value)); }
          });
          if (min > max) warnings.push(`"${field.label}" rules in "${g.name}" may conflict and could make the rule impossible to satisfy.`);
        }
      });
    }
  });
  const rulesCount = ruleSet.groups.reduce((a, g) => a + g.rules.length, 0);
  return { issues, warnings, rulesCount, ok: issues.length === 0 };
}

/* ============================================================
   SEED DATA
   ============================================================ */
export const seedRuleSet = (): RuleSet => ({
  id: "rs-1",
  name: "Personal Loan — Pre-Screening Rules",
  description: "Eligibility checks applied before an applicant may proceed to full credit assessment for the Personal Loan product.",
  product: "Personal Loan",
  status: "Active",
  version: "1.2",
  effectiveFrom: "2026-06-01",
  effectiveTo: "",
  evaluationStrategy: "Evaluate all groups; stop at first Blocking failure",
  createdBy: "M. Chanda",
  createdDate: "2026-02-11",
  modifiedBy: "T. Mwansa",
  modifiedDate: "2026-08-19",
  publishedBy: "T. Mwansa",
  publishedDate: "2026-08-19",
  groups: [
    {
      id: "g1", name: "Age & Income Eligibility", logic: "ALL",
      rules: [
        { id: "r1", fieldId: "age", operator: "gte", value: 21, severity: "Blocking", action: "Reject Application" },
        { id: "r2", fieldId: "monthlyIncome", operator: "gte", value: 10000, severity: "Blocking", action: "Reject Application" },
      ],
    },
    {
      id: "g2", name: "Employment Eligibility", logic: "ANY",
      rules: [
        { id: "r3", fieldId: "employmentStatus", operator: "isOneOf", values: ["Permanent", "Contract"], severity: "Review", action: "Send for Manual Review" },
      ],
    },
    {
      id: "g3", name: "Credit Eligibility", logic: "ALL",
      rules: [
        { id: "r4", fieldId: "hasPreviousDefault", operator: "is", value: false, severity: "Blocking", action: "Reject Application" },
        { id: "r5", fieldId: "existingLoans", operator: "lte", value: 2, severity: "Warning", action: "Continue with Warning" },
        { id: "r6", fieldId: "dti", operator: "lt", value: 50, severity: "Warning", action: "Continue with Warning" },
      ],
    },
  ],
  versions: [
    { version: "1.0", status: "Archived", effective: "2025-11-01 – 2026-03-31", by: "M. Chanda", note: "Initial pre-screening policy for Personal Loan launch." },
    { version: "1.1", status: "Archived", effective: "2026-04-01 – 2026-05-31", by: "M. Chanda", note: "Raised minimum income from ZMW 8,000 to ZMW 10,000." },
    { version: "1.2", status: "Active", effective: "2026-06-01 – present", by: "T. Mwansa", note: "Added Debt-to-Income warning threshold; moved Employment check to Review severity." },
  ],
  audit: [
    { date: "2026-08-19 10:14", user: "T. Mwansa", action: "Published version 1.2", detail: "Rule set activated, effective 2026-06-01." },
    { date: "2026-08-18 16:02", user: "T. Mwansa", action: "Edited rule", detail: "Debt-to-Income Ratio — severity changed from Blocking to Warning." },
    { date: "2026-08-18 15:40", user: "T. Mwansa", action: "Added rule", detail: "Debt-to-Income Ratio is less than 50% added to Credit Eligibility." },
    { date: "2026-03-30 09:05", user: "M. Chanda", action: "Published version 1.1", detail: "Rule set activated, effective 2026-04-01." },
    { date: "2026-03-29 14:22", user: "M. Chanda", action: "Edited rule", detail: "Monthly Income — value changed from ZMW 8,000 to ZMW 10,000." },
    { date: "2025-10-28 11:00", user: "M. Chanda", action: "Published version 1.0", detail: "Rule set activated, effective 2025-11-01." },
  ],
});

export const OTHER_RULE_SETS: RuleSetSummary[] = [
  { id: "rs-2", name: "Business Loan — Pre-Screening Rules", product: "Business Loan", status: "Active", version: "1.0", rulesCount: 6, modifiedDate: "2026-07-02", modifiedBy: "R. Banda" },
  { id: "rs-3", name: "Salary Advance — Pre-Screening Rules", product: "Salary Advance", status: "Draft", version: "0.3", rulesCount: 3, modifiedDate: "2026-08-30", modifiedBy: "K. Phiri" },
  { id: "rs-4", name: "Education Loan — Pre-Screening Rules", product: "Education Loan", status: "Inactive", version: "1.4", rulesCount: 7, modifiedDate: "2026-05-14", modifiedBy: "M. Chanda" },
];

export const SAMPLE_APPLICANTS: Record<string, Record<string, any>> = {
  "Eligible applicant": { age: 25, monthlyIncome: 12500, employmentStatus: "Permanent", hasPreviousDefault: false, existingLoans: 1, dti: 32 },
  "Below income threshold": { age: 27, monthlyIncome: 7500, employmentStatus: "Permanent", hasPreviousDefault: false, existingLoans: 0, dti: 21 },
  "Prior default on file": { age: 31, monthlyIncome: 15000, employmentStatus: "Contract", hasPreviousDefault: true, existingLoans: 2, dti: 40 },
};

export const TEST_FIELDS = ["age", "monthlyIncome", "employmentStatus", "hasPreviousDefault", "existingLoans", "dti"];