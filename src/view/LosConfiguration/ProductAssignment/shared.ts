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

const NUMBER_OPERATORS: { value: Operator; label: string }[] = [
  { value: "=", label: "is equal to" },
  { value: "<>", label: "is not equal to" },
  { value: ">", label: "is greater than" },
  { value: ">=", label: "is at least" },
  { value: "<", label: "is less than" },
  { value: "<=", label: "is at most" },
];

const LIST_OPERATORS: { value: Operator; label: string }[] = [
  { value: "=", label: "is" },
  { value: "<>", label: "is not" },
];

export const operatorsFor = (variable: Variable | undefined) => (variable && !variable.numeric ? LIST_OPERATORS : NUMBER_OPERATORS);

export type Joiner = "AND" | "OR";

export interface Clause {
  id: string;
  variable: string;
  operator: Operator;
  value: string;
}

export interface ConditionGroup {
  id: string;
  name: string;
  join: Joiner;
  clauses: Clause[];
}

export interface AssignmentRow {
  id: string;
  sources: string[];
  loanTypes: string[];
  join: Joiner;
  groups: ConditionGroup[];
  productCode: string;
}

export type MatchMode = "first" | "manual" | "all";

export const MATCH_MODES: { value: MatchMode; label: string }[] = [
  { value: "first", label: "First match only" },
  { value: "manual", label: "Manual review" },
  { value: "all", label: "All matches" },
];

export type Fallback = "manual" | "default";

export const FALLBACKS: { value: Fallback; label: string }[] = [
  { value: "manual", label: "Manual review" },
  { value: "default", label: "Assign default product" },
];

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const newClause = (): Clause => ({ id: uid(), variable: "", operator: "=", value: "" });

export const newGroup = (join: Joiner = "AND"): ConditionGroup => ({ id: uid(), name: "", join, clauses: [newClause()] });

export const allClauses = (row: Pick<AssignmentRow, "groups">): Clause[] => row.groups.flatMap((g) => g.clauses);

export const hasCondition = (row: Pick<AssignmentRow, "groups">): boolean => allClauses(row).length > 0;

const covers = (outer: string[], inner: string[]) => inner.length > 0 && inner.every((v) => outer.includes(v));

export const isShadowed = (rows: AssignmentRow[], index: number): boolean => {
  const row = rows[index];
  return rows
    .slice(0, index)
    .some((earlier) => !hasCondition(earlier) && covers(earlier.sources, row.sources) && covers(earlier.loanTypes, row.loanTypes));
};

export const rowError = (row: AssignmentRow): string | null => {
  const clauses = allClauses(row);
  if (row.sources.length === 0) return "Choose at least one source";
  if (row.loanTypes.length === 0) return "Choose at least one loan type";
  if (clauses.some((c) => !c.variable)) return "Choose a variable";
  if (clauses.some((c) => c.value.trim() === "")) return "Enter a value";
  if (!row.productCode) return "Choose a product";
  return null;
};

export const clauseText = (clause: Clause): string => {
  const variable = variableByName(clause.variable);
  const operator = operatorsFor(variable).find((o) => o.value === clause.operator)?.label ?? clause.operator;
  const value = variable?.numeric && clause.value !== "" ? Number(clause.value).toLocaleString("en-US") : clause.value;
  return `${variable?.label ?? "…"} ${operator} ${value || "…"}`;
};

export const groupText = (group: ConditionGroup): string => group.clauses.map(clauseText).join(` ${group.join.toLowerCase()} `);

export const conditionText = (row: Pick<AssignmentRow, "join" | "groups">): string => {
  const groups = row.groups.filter((g) => g.clauses.length > 0);
  return groups.map((g) => (groups.length > 1 && g.clauses.length > 1 ? `(${groupText(g)})` : groupText(g))).join(` ${row.join.toLowerCase()} `);
};
