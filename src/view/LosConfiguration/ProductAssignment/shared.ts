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

export type Operator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "between";

const NUMBER_OPERATORS: { value: Operator; label: string }[] = [
  { value: "=", label: "is equal to" },
  { value: "<>", label: "is not equal to" },
  { value: ">", label: "is greater than" },
  { value: ">=", label: "is at least" },
  { value: "<", label: "is less than" },
  { value: "<=", label: "is at most" },
  { value: "between", label: "is between" },
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
  value2?: string;
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

export type MatchMode = "first" | "manual";

export const MATCH_MODES: { value: MatchMode; label: string }[] = [
  { value: "first", label: "First match only" },
  { value: "manual", label: "Manual review" },
];

export type Fallback = "manual" | "default";

export const FALLBACKS: { value: Fallback; label: string }[] = [
  { value: "manual", label: "Manual review" },
  { value: "default", label: "Loan type default" },
];

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const newClause = (): Clause => ({ id: uid(), variable: "", operator: "=", value: "" });

export const newGroup = (join: Joiner = "AND"): ConditionGroup => ({ id: uid(), name: "", join, clauses: [newClause()] });

export const allClauses = (row: Pick<AssignmentRow, "groups">): Clause[] => row.groups.flatMap((g) => g.clauses);

export const hasCondition = (row: Pick<AssignmentRow, "groups">): boolean => allClauses(row).length > 0;

export const rowError = (row: AssignmentRow): string | null => {
  const clauses = allClauses(row);
  if (row.sources.length === 0) return "Choose at least one source";
  if (row.loanTypes.length === 0) return "Choose at least one loan type";
  if (clauses.some((c) => !c.variable)) return "Choose a variable";
  if (clauses.some((c) => c.value.trim() === "" || (c.operator === "between" && !c.value2?.trim()))) return "Enter a value";
  if (clauses.some((c) => c.operator === "between" && Number(c.value2) < Number(c.value))) return "The second value must not be lower than the first";
  if (!row.productCode) return "Choose a product";
  return null;
};

export const clauseText = (clause: Clause): string => {
  const variable = variableByName(clause.variable);
  const operator = operatorsFor(variable).find((o) => o.value === clause.operator)?.label ?? clause.operator;
  const format = (v?: string) => (variable?.numeric && v ? Number(v).toLocaleString("en-US") : v) || "…";
  const value = clause.operator === "between" ? `${format(clause.value)} and ${format(clause.value2)}` : format(clause.value);
  return `${variable?.label ?? "…"} ${operator} ${value}`;
};

export const groupText = (group: ConditionGroup): string => group.clauses.map(clauseText).join(` ${group.join.toLowerCase()} `);

export const conditionText = (row: Pick<AssignmentRow, "join" | "groups">): string => {
  const groups = row.groups.filter((g) => g.clauses.length > 0);
  return groups.map((g) => (groups.length > 1 && g.clauses.length > 1 ? `(${groupText(g)})` : groupText(g))).join(` ${row.join.toLowerCase()} `);
};
