export interface LoanCharge {
  charge_type: string;
  charge_based_on: "Percentage" | "Fixed Amount" | string;
  percentage: number;
  amount: number;
}

export interface LoanProductForm {
  product_code: string;
  product_name: string;
  rate_of_interest: number;
  maximum_loan_amount: number;
  penalty_interest_rate: number;
  grace_period_in_days: number;

  repayment_schedule_type: "Monthly as per repayment start date" | string;
  repayment_date_on: "Start of the next month" | string;
  cyclic_day_of_the_month: number;

  is_term_loan: 0 | 1;
  validate_normal_repayment: 0 | 1;
  disabled: 0 | 1;

  min_days_bw_disbursement_first_repayment: number;

  disbursement_account: string;
  loan_account: string;
  payment_account: string;
  subsidy_adjustment_account: string;
  security_deposit_account: string;
  suspense_collection_account: string;
  customer_refund_account: string;

  interest_income_account: string;
  interest_accrued_account: string;
  interest_waiver_account: string;
  interest_receivable_account: string;
  suspense_interest_income: string;

  broken_period_interest_recovery_account: string;

  additional_interest_income: string;
  additional_interest_accrued: string;
  additional_interest_receivable: string;
  additional_interest_suspense: string;
  additional_interest_waiver: string;

  penalty_income_account: string;
  penalty_accrued_account: string;
  penalty_waiver_account: string;
  penalty_receivable_account: string;
  penalty_suspense_account: string;

  write_off_account: string;
  write_off_recovery_account: string;

  collection_offset_sequence_for_standard_asset: string;
  collection_offset_sequence_for_sub_standard_asset: string;
  collection_offset_sequence_for_written_off_asset: string;
  collection_offset_sequence_for_settlement_collection: string;

  loan_charges: LoanCharge[];

  // Optional fields
  loan_category?: string;
}

export interface CreateLoanProductResponse {
  message: {
    name: string;
    [key: string]: unknown;
  };
}