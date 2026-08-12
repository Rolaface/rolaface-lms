export interface CreateLoanPayload {
  applicant_type: "Customer" | string;
  applicant: string;
  loan_product: string;
  loan_amount: number;
  rate_of_interest: number;
  penalty_charges_rate: number;
  is_term_loan: 0 | 1;
  repayment_method: "Repay Over Number of Periods" | "Repay Fixed Amount per Period";
  posting_date: string; 

  // Optional (commented in your sample, or clearly non-mandatory)
  applicant_name?: string;
  loan_application?: string;
  repayment_periods?: number;
  monthly_repayment_amount?: number;
  disbursement_date?: string;
  repayment_start_date?: string;
  auto_create_disbursement_on_loan_booking?: 0 | 1;
  moratorium_tenure?: number;
  moratorium_type?: "EMI" | "Principal" | string;
  treatment_of_interest?: "Capitalize" | string;

 loan_charges?: {
  charge: string;
  amount: number;
  account?: string;
  treatment_of_charge?: string;
 }[];
 collaterals?: {
    status: "Pledged" |string;
    reference_no: string;
    description: string;
    items: {
      loan_security: string;
      qty: number;
      loan_security_price: number;
      amount: number;
    }[];
  };
}

// Frappe whitelisted methods wrap the return value in `message`.
// Confirm this shape matches what your endpoint actually returns.
export interface CreateLoanResponse {
  message: {
    name: string;
    [key: string]: unknown;
  };
}