// loanDisbursementForm.ts

export interface LoanDisbursementPayload {
  against_loan: string;

  posting_date: string;
  disbursement_date: string;
  disbursed_amount: number;

  mode_of_payment: string;
  reference_number: string;
  reference_date: string;

  repayment_start_date: string;

  // Optional fields (supported by Frappe but not mandatory)
  applicant_type?: "Customer" | string;
  applicant?: string;
  loan_product?: string;

  clearance_date?: string;

  sanctioned_loan_amount?: number;
  current_disbursed_amount?: number;

  disbursement_account?: string;
  bank_account?: string;
  loan_account?: string;
  cost_center?: string;

  is_term_loan?: 0 | 1;
  tenure?: number;

  repayment_method?:
    | "Repay Over Number of Periods"
    | "Repay Fixed Amount per Period";

  repayment_schedule_type?: string;
  repayment_frequency?: string;

  monthly_repayment_amount?: number;

  withhold_security_deposit?: 0 | 1;

  total_emi_charges?: number;

  bpi_difference_date?: string;
  broken_period_interest_days?: number;
  broken_period_interest?: number;
  bpi_amount_difference?: number;

  status?: string;
  is_imported?: 0 | 1;

  tranche_number?: number;
}

// Frappe whitelisted methods wrap the response in `message`
export interface LoanDisbursementResponse {
  message: {
    name: string;
    [key: string]: unknown;
  };
}