import {
  IconClipboardList,
  IconStack2,
  IconAdjustmentsHorizontal,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Evaluated fields & operators (condition builder)
// ---------------------------------------------------------------------------
export type FieldUnit = "number" | "currency" | "percent";

export interface RuleField {
  id: string;
  label: string;
  unit: FieldUnit;
  category: string;
}

export const FIELDS: RuleField[] = [
  { id: "creditScore", label: "Credit Score", unit: "number", category: "Credit" },
  { id: "netSalary", label: "Net Salary", unit: "currency", category: "Income" },
  { id: "dti", label: "Debt-to-Income Ratio", unit: "percent", category: "Income" },
  { id: "collateralValue", label: "Collateral Value", unit: "currency", category: "Collateral" },
  { id: "paymentHistory", label: "Payment History", unit: "percent", category: "Repayment History" },
  { id: "employmentYears", label: "Employment Duration (yrs)", unit: "number", category: "Employment" },
  { id: "customerTenure", label: "Customer Tenure (yrs)", unit: "number", category: "Customer Profile" },
];

export const fieldById = (id: string): RuleField | undefined => FIELDS.find((f) => f.id === id);

export type OperatorId = "gte" | "lte" | "gt" | "lt" | "eq";

export interface Operator {
  id: OperatorId;
  label: string;
}

// Plain-English operators (no symbols), per design
export const OPERATORS: Operator[] = [
  { id: "gte", label: "Greater than or equal to" },
  { id: "lte", label: "Less than or equal to" },
  { id: "gt", label: "Greater than" },
  { id: "lt", label: "Less than" },
  { id: "eq", label: "Equal to" },
];

export const operatorLabel = (id: string): string => OPERATORS.find((o) => o.id === id)?.label ?? id;

export type JoinType = "AND" | "OR" | null;

export interface Condition {
  id: string;
  field: string;
  operator: OperatorId;
  value: number | "";
  join: JoinType;
}

export interface RuleGroup {
  id: string;
  product: string;
  conditions: Condition[];
}

export const PRODUCT_OPTIONS: string[] = [
  "Premium Car Loan",
  "Standard Car Loan",
  "Basic Car Loan",
  "Personal Loan",
  "Business Loan",
];

// Maps a product name to a Mantine color key already defined in the app theme.
// Falls back to "slate" (the app's neutral) for products without a fixed color.
const PRODUCT_COLORS: Record<string, string> = {
  "Premium Car Loan": "brand",
  "Standard Car Loan": "teal",
  "Basic Car Loan": "amber",
};

export const colorForProduct = (product: string): string => PRODUCT_COLORS[product] ?? "slate";

export const uid = (): string => Math.random().toString(36).slice(2, 9);

// ---------------------------------------------------------------------------
// Rule details (tab 1)
// ---------------------------------------------------------------------------
export interface RuleSetDetails {
  ruleName: string;
  source: string;
  category: string;
  subcategory: string;
  productLine: string;
}

export const SOURCE_OPTIONS: string[] = [
  "Customer Profile",
  "Loan Application",
  "Credit Bureau",
  "Employment Records",
  "Bank Statement",
];

export const CATEGORY_OPTIONS: string[] = [
  "Income",
  "Credit",
  "Employment",
  "Collateral",
  "Repayment History",
  "Customer Profile",
];

export const SUBCATEGORY_OPTIONS: string[] = [
  "Credit Score",
  "Net Salary",
  "Debt-to-Income Ratio",
  "Collateral Value",
  "Payment History",
  "Employment Duration",
  "Customer Tenure",
];

export const PRODUCT_LINE_OPTIONS: string[] = [
  "Auto Loan",
  "Personal Loan",
  "Mortgage",
  "Business Loan",
  "Education Loan",
];

export const DEFAULT_RULE_DETAILS: RuleSetDetails = {
  ruleName: "",
  source: "Customer Profile",
  category: "Credit",
  subcategory: "Credit Score",
  productLine: "Auto Loan",
};

// ---------------------------------------------------------------------------
// Matching behavior (tab 3)
// ---------------------------------------------------------------------------
export type MatchMode = "stop" | "multiple";
export type NoMatchAction = "Manual Review" | "Assign default product" | "Reject application";

export interface MatchingSettings {
  matchMode: MatchMode;
  defaultProduct: string;
  noMatchAction: NoMatchAction;
}

export const NO_MATCH_ACTION_OPTIONS: NoMatchAction[] = [
  "Manual Review",
  "Assign default product",
  "Reject application",
];

export const DEFAULT_MATCHING_SETTINGS: MatchingSettings = {
  matchMode: "stop",
  defaultProduct: "Standard Car Loan",
  noMatchAction: "Manual Review",
};

// ---------------------------------------------------------------------------
// Configurator tabs (Rule details / Rule groups / Matching behavior)
// ---------------------------------------------------------------------------
export type RuleSetTabValue = "details" | "groups" | "behavior";

export const RULE_SET_TAB_ITEMS: { value: RuleSetTabValue; label: string; icon: TablerIcon }[] = [
  { value: "details", label: "Rule details", icon: IconClipboardList },
  { value: "groups", label: "Rule groups", icon: IconStack2 },
  { value: "behavior", label: "Matching behavior", icon: IconAdjustmentsHorizontal },
];

// ---------------------------------------------------------------------------
// Rule set list (Pre-Screening Rule Sets landing page)
// ---------------------------------------------------------------------------
export type RuleSetStatus = "Active" | "Draft" | "Inactive";

export interface RuleSetSummary {
  id: string;
  name: string;
  status: RuleSetStatus;
  product: string;
  rulesCount: number;
  version: string;
  lastModified: string;
  lastModifiedBy: string;
}

export interface RuleSetRecord {
  summary: RuleSetSummary;
  details: RuleSetDetails;
  groups: RuleGroup[];
  settings: MatchingSettings;
}

export const emptyRuleGroup = (product: string = PRODUCT_OPTIONS[1]): RuleGroup => ({
  id: uid(),
  product,
  conditions: [{ id: uid(), field: FIELDS[0].id, operator: "gte", value: 0, join: null }],
});