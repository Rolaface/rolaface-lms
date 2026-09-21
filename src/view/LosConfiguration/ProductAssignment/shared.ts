// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
export const SOURCES = ["Branch", "Mobile Banking", "Online Portal", "USSD", "Third Party"];

export const LOAN_TYPES = ["Business", "Personal", "Auto", "Mortgage", "Education"];

export interface LoanProduct {
  code: string;
  name: string;
  loanType: string;
}

export const PRODUCTS: LoanProduct[] = [
  { code: "PL-SAL", name: "Salaried Personal Loan", loanType: "Personal" },
  { code: "PL-SE", name: "Self-Employed Personal Loan", loanType: "Personal" },
  { code: "PL-STF", name: "Staff Loan", loanType: "Personal" },
  { code: "SME-WC", name: "SME Working Capital", loanType: "Business" },
  { code: "SME-TL", name: "SME Term Loan", loanType: "Business" },
  { code: "AL-NEW", name: "New Vehicle Loan", loanType: "Auto" },
  { code: "AL-USED", name: "Used Vehicle Loan", loanType: "Auto" },
  { code: "HL-PUR", name: "Home Purchase Loan", loanType: "Mortgage" },
  { code: "HL-TOP", name: "Home Top-up Loan", loanType: "Mortgage" },
  { code: "EDU-01", name: "Study Loan", loanType: "Education" },
];

export const productsFor = (loanTypes: string[]): LoanProduct[] => PRODUCTS.filter((p) => loanTypes.includes(p.loanType));

export const productByCode = (code: string): LoanProduct | undefined => PRODUCTS.find((p) => p.code === code);

// ---------------------------------------------------------------------------
// Variables a condition can test
// ---------------------------------------------------------------------------
export interface Variable {
  name: string;
  label: string;
  numeric: boolean;
  options?: { value: string; label: string }[];
}

const listOf = (...values: string[]) => values.map((v) => ({ value: v, label: v }));

export const VARIABLES: Variable[] = [
  { name: "customer_type", label: "Customer type", numeric: false, options: listOf("New to bank", "Existing customer", "Staff") },
  { name: "employment_type", label: "Employment type", numeric: false, options: listOf("Salaried", "Self-employed", "Business owner", "Pensioner") },
  { name: "vehicle_condition", label: "Vehicle condition", numeric: false, options: listOf("New", "Used") },
  { name: "credit_score", label: "Credit score", numeric: true },
  { name: "net_monthly_income", label: "Net monthly income", numeric: true },
  { name: "loan_amount", label: "Loan amount", numeric: true },
  { name: "tenor", label: "Tenor (months)", numeric: true },
  { name: "age", label: "Age", numeric: true },
  { name: "years_in_business", label: "Years in business", numeric: true },
];

export const variableByName = (name: string): Variable | undefined => VARIABLES.find((v) => v.name === name);

export type Operator = "=" | "<>" | ">" | ">=" | "<" | "<=";

// Operators read as words so a condition reads as a sentence: "Credit score is at least 700".
const NUMBER_OPERATORS: { value: Operator; label: string }[] = [
  { value: "=", label: "is equal to" },
  { value: "<>", label: "is not equal to" },
  { value: ">", label: "is greater than" },
  { value: ">=", label: "is at least" },
  { value: "<", label: "is less than" },
  { value: "<=", label: "is at most" },
];

// List values read better without "equal to": "Employment type is Salaried".
const LIST_OPERATORS: { value: Operator; label: string }[] = [
  { value: "=", label: "is" },
  { value: "<>", label: "is not" },
];

export const operatorsFor = (variable: Variable | undefined) => (variable && !variable.numeric ? LIST_OPERATORS : NUMBER_OPERATORS);

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------
export type Joiner = "AND" | "OR";

// `joiner` links a clause to the one above it (ignored on the first). AND binds tighter than OR,
// so the clauses split at each OR into blocks: the row matches when every clause in any one block holds.
export interface Clause {
  id: string;
  joiner: Joiner;
  variable: string;
  operator: Operator;
  value: string;
}

// A row applies to any of its sources combined with any of its loan types.
// A row with no clauses is a direct mapping: every such application matches it.
export interface AssignmentRow {
  id: string;
  sources: string[];
  loanTypes: string[];
  clauses: Clause[];
  productCode: string;
}

export type MatchMode = "first" | "all";

export const MATCH_MODES: { value: MatchMode; label: string }[] = [
  { value: "first", label: "First match only" },
  { value: "all", label: "All matches" },
];

export type Fallback = "manual" | "reject";

export const FALLBACKS: { value: Fallback; label: string }[] = [
  { value: "manual", label: "Manual review" },
  { value: "reject", label: "Reject" },
];

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const newClause = (joiner: Joiner = "AND"): Clause => ({ id: uid(), joiner, variable: "", operator: "=", value: "" });

export const orBlocks = (clauses: Clause[]): Clause[][] =>
  clauses.reduce<Clause[][]>((blocks, clause, i) => {
    if (i === 0 || clause.joiner === "OR") blocks.push([clause]);
    else blocks[blocks.length - 1].push(clause);
    return blocks;
  }, []);

const covers = (outer: string[], inner: string[]) => inner.length > 0 && inner.every((v) => outer.includes(v));

// Rows are checked top to bottom. With "first match only", a row with no condition catches every
// application it covers, so a later row covering nothing beyond it can never be used.
export const isShadowed = (rows: AssignmentRow[], index: number): boolean => {
  const row = rows[index];
  return rows
    .slice(0, index)
    .some((earlier) => earlier.clauses.length === 0 && covers(earlier.sources, row.sources) && covers(earlier.loanTypes, row.loanTypes));
};

export const rowError = (row: AssignmentRow): string | null => {
  if (row.sources.length === 0) return "Choose at least one source";
  if (row.loanTypes.length === 0) return "Choose at least one loan type";
  if (row.clauses.some((c) => !c.variable)) return "Choose a variable";
  if (row.clauses.some((c) => c.value.trim() === "")) return "Enter a value";
  if (!row.productCode) return "Choose a product";
  return null;
};

export const clauseText = (clause: Clause): string => {
  const variable = variableByName(clause.variable);
  const operator = operatorsFor(variable).find((o) => o.value === clause.operator)?.label ?? clause.operator;
  const value = variable?.numeric && clause.value !== "" ? Number(clause.value).toLocaleString("en-US") : clause.value;
  return `${variable?.label ?? "…"} ${operator} ${value || "…"}`;
};

// The whole condition as one sentence, e.g. "Employment type is Salaried and Credit score is at least 700".
export const conditionText = (clauses: Clause[]): string =>
  clauses.map((c, i) => (i > 0 ? ` ${c.joiner.toLowerCase()} ` : "") + clauseText(c)).join("");
