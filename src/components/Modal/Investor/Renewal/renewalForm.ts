/* Renewal form values, the figures calculated from them, and conversion to / from the API. */
import type {
  InterestSettlement,
  RenewalContract,
  RenewalPayload,
  RenewalRecord,
  RenewalStructure,
  RepaymentFrequency,
} from "../../../../types/Investor/investorFlow";
import { addMonths, nextPayoutDate, toIso } from "../InvestorModalShared";

type Num = number | "";

export interface RenewalFormValues {
  structure: RenewalStructure | "";
  effectiveDate: string;
  settlementAmount: Num;
  interestSettlement: InterestSettlement | "";
  interestSettlementDate: string;
  rate: Num;
  frequency: RepaymentFrequency;
  tenure: Num;
  firstPayment: string;
  penaltyRate: Num;
  reason: string;
}

/** Structures where the unpaid interest is not added to principal: paid now or deferred. */
export const INTEREST_SEPARATE: RenewalStructure[] = [
  "Principal Rollover",
  "Extended Maturity",
];

export const STRUCTURE_LABELS: Record<RenewalStructure, string> = {
  Capitalization: "Capitalization — Add eligible dues to principal",
  "Principal Rollover": "Principal Rollover — Keep interest separate",
  "Extended Maturity": "Extended Maturity — Retain principal, extend deadline",
  "Partial Settlement": "Partial Settlement & Rollover",
};

/** New renewal: starts from the terms of the contract in force, effective today. */
export function initialValues(
  contract: RenewalContract | null,
): RenewalFormValues {
  const today = toIso(new Date());
  const frequency = (contract?.contract_frequency ||
    "Monthly") as RepaymentFrequency;
  return {
    structure: "",
    effectiveDate: today,
    settlementAmount: "",
    interestSettlement: "",
    interestSettlementDate: "",
    rate: contract ? contract.contract_interest_rate : "",
    frequency,
    tenure: "",
    firstPayment: toIso(nextPayoutDate(new Date(today), frequency)),
    penaltyRate:
      contract && contract.contract_penalty_rate
        ? contract.contract_penalty_rate
        : "",
    reason: "",
  };
}

export function valuesFromRecord(r: RenewalRecord): RenewalFormValues {
  const num = (v: unknown): Num =>
    v === null || v === undefined || v === "" ? "" : Number(v);
  return {
    structure: r.renewal_structure,
    effectiveDate: r.renewal_effective_date || "",
    settlementAmount:
      r.renewal_structure === "Partial Settlement"
        ? num(r.settlement_amount)
        : "",
    interestSettlement: (r.interest_settlement as InterestSettlement) || "",
    interestSettlementDate: r.interest_settlement_date || "",
    rate: num(r.renewal_interest_rate),
    frequency: r.payment_frequency,
    tenure: num(r.renewal_tenure),
    firstPayment: r.renewal_first_repayment_date || "",
    penaltyRate:
      Number(r.renewal_penalty_rate) > 0 ? Number(r.renewal_penalty_rate) : "",
    reason: r.reason_for_renewal || "",
  };
}

/** The new maturity always follows from the effective date and the tenure (never entered separately). */
export function newMaturity(v: RenewalFormValues): string {
  if (!v.effectiveDate || !(Number(v.tenure) > 0)) return "";
  return toIso(addMonths(v.effectiveDate, Number(v.tenure)));
}

/** Same rule as the backend (renewal._renewed_principal). */
export function renewedPrincipal(
  v: RenewalFormValues,
  contract: RenewalContract | null,
): number {
  if (!contract || !v.structure) return 0;
  const p = contract.outstanding_principal;
  const i = contract.unpaid_interest;
  if (v.structure === "Capitalization") return round2(p + i);
  if (v.structure === "Partial Settlement")
    return round2(p + i - (Number(v.settlementAmount) || 0));
  return round2(p);
}

/** Cash paid to the investor on the effective date. */
export function payoutAtRenewal(
  v: RenewalFormValues,
  contract: RenewalContract | null,
): number {
  if (!contract) return 0;
  if (v.structure === "Partial Settlement")
    return Number(v.settlementAmount) || 0;
  if (
    v.structure &&
    INTEREST_SEPARATE.includes(v.structure) &&
    v.interestSettlement === "Pay on renewal date"
  )
    return contract.unpaid_interest;
  return 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function payloadFromValues(v: RenewalFormValues): RenewalPayload {
  const separate = !!v.structure && INTEREST_SEPARATE.includes(v.structure);
  return {
    renewal_structure: v.structure as RenewalStructure,
    renewal_effective_date: v.effectiveDate,
    settlement_amount:
      v.structure === "Partial Settlement" && v.settlementAmount !== ""
        ? Number(v.settlementAmount)
        : null,
    interest_settlement:
      separate && v.interestSettlement ? v.interestSettlement : null,
    interest_settlement_date:
      separate && v.interestSettlement === "Defer to an agreed future date"
        ? v.interestSettlementDate || null
        : null,
    renewal_interest_rate: Number(v.rate),
    payment_frequency: v.frequency,
    renewal_tenure: Number(v.tenure),
    renewal_first_repayment_date: v.firstPayment,
    renewal_penalty_rate: v.penaltyRate === "" ? null : Number(v.penaltyRate),
    reason_for_renewal: v.reason.trim() || null,
  };
}

/** The first problem with the values (same rules as the backend), or "" when they can be saved. */
export function validateValues(
  v: RenewalFormValues,
  contract: RenewalContract | null,
): string {
  if (!contract) return "Select the investment to renew.";
  if (!v.structure) return "Select the renewal structure.";
  if (!v.effectiveDate) return "Enter the renewal effective date.";
  // Same rules as the backend: at expiry on/after the maturity date; mid-contract from today up to it.
  const maturityDate = contract.contract_maturity;
  if (
    maturityDate &&
    contract.renewal_kind === "At expiry" &&
    v.effectiveDate < maturityDate
  )
    return "The effective date cannot be before the current maturity date.";
  if (
    maturityDate &&
    contract.renewal_kind === "Mid-contract" &&
    (v.effectiveDate < toIso(new Date()) || v.effectiveDate > maturityDate)
  )
    return "During the contract, the effective date must be from today up to the current maturity date.";
  if (v.structure === "Partial Settlement") {
    const owed = round2(
      contract.outstanding_principal + contract.unpaid_interest,
    );
    const s = Number(v.settlementAmount);
    if (!(s > 0) || s >= owed)
      return "Enter a settlement amount above 0 and below the amount owed.";
  }
  if (INTEREST_SEPARATE.includes(v.structure) && contract.unpaid_interest > 0) {
    if (!v.interestSettlement)
      return "Choose how the unpaid interest is settled.";
  }
  if (v.rate === "" || Number(v.rate) < 0 || Number(v.rate) > 100)
    return "Enter an interest rate between 0 and 100.";
  if (!(Number(v.tenure) > 0) || !Number.isInteger(Number(v.tenure)))
    return "Enter the tenure in whole months.";
  const maturity = newMaturity(v);
  if (!v.firstPayment) return "Enter the first payment date.";
  if (v.firstPayment <= v.effectiveDate || v.firstPayment > maturity)
    return "The first payment date must be after the effective date and on or before the new maturity date.";
  if (
    v.interestSettlement === "Defer to an agreed future date" &&
    INTEREST_SEPARATE.includes(v.structure)
  ) {
    if (!v.interestSettlementDate)
      return "Enter the date the unpaid interest will be paid.";
    if (
      v.interestSettlementDate <= v.effectiveDate ||
      v.interestSettlementDate > maturity
    )
      return "The interest settlement date must be after the effective date and on or before the new maturity date.";
  }
  if (
    v.penaltyRate !== "" &&
    (Number(v.penaltyRate) < 0 || Number(v.penaltyRate) > 100)
  )
    return "Enter a penalty rate between 0 and 100.";
  if (!(renewedPrincipal(v, contract) > 0))
    return "The renewed principal must be more than 0.";
  return "";
}
