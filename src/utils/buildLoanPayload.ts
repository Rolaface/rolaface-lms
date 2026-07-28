import type { CreateLoanPayload } from "../types/loanForm";
import { ANNUAL_RATE } from "../components/Modal/LoanBooking/Constants";

export interface LoanFormState {
  customerNumber: string | null;
  productCode: string | null;
  loanAmount: number | "";
  tenureMonths: number;
  fixedRepaymentsIn: string;
  repaymentAmount: number | "";
  repaymentStartDate: string;
  moratoriumType: string | null;
  moratoriumPeriod: number | "";
  trnDate: string;
}

/**
 * Returns null if a required field is missing so the caller can show a
 * validation message instead of firing an incomplete request.
 */
export function buildLoanPayload(state: LoanFormState): CreateLoanPayload | null {
  const { customerNumber, productCode, loanAmount, tenureMonths } = state;
  if (!customerNumber || !productCode || !loanAmount || !tenureMonths) return null;

  const payload: CreateLoanPayload = {
    // TODO: hardcoded — no UI field exists yet for applicant type
    applicant_type: "Customer",
    applicant: customerNumber,
    loan_product: productCode,
    loan_amount: Number(loanAmount),
    // TODO: hardcoded to the Basic Details preview rate — confirm this should
    // instead come from a Product Code lookup once one is selected
    rate_of_interest: ANNUAL_RATE,
    // TODO: no UI field exists yet — confirm default of 0 is correct
    penalty_charges_rate: 0,
    // TODO: no UI toggle exists yet — confirm every loan booked here is a term loan
    is_term_loan: 1,
    repayment_method:
      state.fixedRepaymentsIn === "TENOR"
        ? "Repay Over Number of Periods"
        : "Repay Fixed Amount per Period",
    posting_date: state.trnDate,
  };

  if (state.fixedRepaymentsIn === "TENOR") {
    payload.repayment_periods = tenureMonths;
  } else {
    payload.monthly_repayment_amount = Number(state.repaymentAmount);
  }

  if (state.repaymentStartDate) {
    payload.repayment_start_date = state.repaymentStartDate;
  }

  if (state.moratoriumType && state.moratoriumType !== "None" && state.moratoriumPeriod !== "") {
    payload.moratorium_type = state.moratoriumType;
    payload.moratorium_tenure = Number(state.moratoriumPeriod);
  }

  return payload;
}