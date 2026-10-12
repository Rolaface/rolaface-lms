/* Form values of the Investment Product modal, and their conversion to / from the API. */
import type {
  CreateInvestmentProductPayload,
  InvestmentProductRecord,
} from "../../../../types/Investor/investmentProductForm";

type Num = number | "";

export interface ProductFormValues {
  name: string;
  code: string;
  description: string;
  defaultTenure: Num;
  defaultRate: Num;
  defaultPenalty: Num;
  frequency: string;
  disabled: boolean;
  minRate: Num;
  maxRate: Num;
  minAmount: Num;
  maxAmount: Num;
  minTenure: Num;
  maxTenure: Num;
}

export const EMPTY_FORM: ProductFormValues = {
  name: "",
  code: "",
  description: "",
  defaultTenure: "",
  defaultRate: "",
  defaultPenalty: "",
  frequency: "Monthly",
  disabled: false,
  minRate: "",
  maxRate: "",
  minAmount: "",
  maxAmount: "",
  minTenure: "",
  maxTenure: "",
};

const toNum = (value: unknown): Num =>
  value === null ||
  value === undefined ||
  value === "" ||
  Number.isNaN(Number(value))
    ? ""
    : Number(value);

export function formFromRecord(
  r: Partial<InvestmentProductRecord>,
): ProductFormValues {
  return {
    name: r.product_name || "",
    code: r.product_code || "",
    description: r.product_description || "",
    defaultTenure: toNum(r.default_tenure),
    defaultRate: toNum(r.default_interest_rate),
    // 0 is how Frappe stores an empty Float; the penalty is optional, so show it empty.
    defaultPenalty:
      Number(r.default_penalty_rate) > 0 ? Number(r.default_penalty_rate) : "",
    frequency: r.payout_frequency || "Monthly",
    disabled: r.disabled === 1,
    minRate: toNum(r.min_interest_rate),
    maxRate: toNum(r.maximum_interest_rate),
    minAmount: toNum(r.minimum_investment),
    maxAmount: toNum(r.maximum_investment),
    minTenure: toNum(r.minimum_tenure),
    maxTenure: toNum(r.maximum_tenure),
  };
}

export function payloadFromForm(
  v: ProductFormValues,
): CreateInvestmentProductPayload {
  return {
    product_code: v.code.trim().toUpperCase(),
    product_name: v.name.trim(),
    product_description: v.description.trim(),
    default_tenure: Number(v.defaultTenure),
    default_interest_rate: Number(v.defaultRate),
    default_penalty_rate:
      v.defaultPenalty === "" ? null : Number(v.defaultPenalty),
    payout_frequency: v.frequency,
    disabled: v.disabled ? 1 : 0,
    min_interest_rate: Number(v.minRate),
    maximum_interest_rate: Number(v.maxRate),
    minimum_investment: Number(v.minAmount),
    maximum_investment: Number(v.maxAmount),
    minimum_tenure: Number(v.minTenure),
    maximum_tenure: Number(v.maxTenure),
  };
}

/* ------------------------------ Validation ------------------------------ */
// Same rules as the backend (investmentProduct/utils.py).

const isSet = (v: Num) => v !== "";
const percent = (v: Num, label: string) =>
  !isSet(v)
    ? `Enter the ${label}.`
    : Number(v) < 0 || Number(v) > 100
      ? "Must be between 0 and 100."
      : null;
const months = (v: Num, label: string) =>
  !isSet(v)
    ? `Enter the ${label}.`
    : !(Number(v) > 0) || !Number.isInteger(Number(v))
      ? "Enter whole months above 0."
      : null;
const amount = (v: Num, label: string) =>
  !isSet(v)
    ? `Enter the ${label}.`
    : !(Number(v) > 0)
      ? "Must be above 0."
      : null;

export function validateProductForm(
  v: ProductFormValues,
): Partial<Record<keyof ProductFormValues, string | null>> {
  const errors: Partial<Record<keyof ProductFormValues, string | null>> = {
    name: !v.name.trim() ? "Enter the product name." : null,
    code: !v.code.trim() ? "Enter the product code." : null,
    description: !v.description.trim()
      ? "Enter the product description."
      : null,
    frequency: !v.frequency ? "Select the payout frequency." : null,
    minRate: percent(v.minRate, "minimum interest rate"),
    maxRate: percent(v.maxRate, "maximum interest rate"),
    minAmount: amount(v.minAmount, "minimum investment"),
    maxAmount: amount(v.maxAmount, "maximum investment"),
    minTenure: months(v.minTenure, "minimum tenure"),
    maxTenure: months(v.maxTenure, "maximum tenure"),
    defaultRate: percent(v.defaultRate, "default interest rate"),
    defaultTenure: months(v.defaultTenure, "default tenure"),
    defaultPenalty: isSet(v.defaultPenalty)
      ? percent(v.defaultPenalty, "default penalty rate")
      : null,
  };

  // Minimum must not be above maximum.
  if (
    !errors.maxRate &&
    !errors.minRate &&
    Number(v.minRate) > Number(v.maxRate)
  )
    errors.maxRate = "Must not be below the minimum interest rate.";
  if (
    !errors.maxAmount &&
    !errors.minAmount &&
    Number(v.minAmount) > Number(v.maxAmount)
  )
    errors.maxAmount = "Must not be below the minimum investment.";
  if (
    !errors.maxTenure &&
    !errors.minTenure &&
    Number(v.minTenure) > Number(v.maxTenure)
  )
    errors.maxTenure = "Must not be below the minimum tenure.";

  // Defaults must be within the limits.
  if (!errors.defaultRate && !errors.minRate && !errors.maxRate) {
    const r = Number(v.defaultRate);
    if (r < Number(v.minRate) || r > Number(v.maxRate))
      errors.defaultRate = `Must be between ${v.minRate}% and ${v.maxRate}%.`;
  }
  if (!errors.defaultTenure && !errors.minTenure && !errors.maxTenure) {
    const t = Number(v.defaultTenure);
    if (t < Number(v.minTenure) || t > Number(v.maxTenure))
      errors.defaultTenure = `Must be between ${v.minTenure} and ${v.maxTenure} months.`;
  }
  return errors;
}
