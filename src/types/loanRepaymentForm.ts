
export interface LoanRepaymentPayload {
  // repayment_type: "Normal Repayment" | "Full Settlement";
  repayment_type: string;
  applicant_type: "Customer";
  applicant: string;

  loan_product: string;
  against_loan: string;

  value_date: string;
  amount_paid: number;

  mode_of_payment: string;
  reference_number: string;
  reference_date: string;
   account_number?: string;  
  manual_remarks?: string;
}

export interface LoanRepaymentResponse {
  message: {
    name: string;
    [key: string]: unknown;
  };
}
export interface LoanRepaymentAccountSearchItem {
  against_loan: string;
  applicant: string;
  applicant_type: string;
  applicant_name: string | null;
  emi: number | null;
  phone_number: string | null;
}

export interface LoanRepaymentAccountSearchResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: LoanRepaymentAccountSearchItem[];
  };
}
export interface LoanDuesResponse {
  message: {
    penalty_amount: number;
    interest_amount: number;
    pending_principal_amount: number;
    payable_principal_amount: number;
    payable_amount: number;
    unaccrued_interest: number;
    unbooked_interest: number;
    unbooked_penalty: number;
    due_date: string | null;
    total_charges_payable: number;
    available_security_deposit: number;
    written_off_amount: number;
    unpaid_demands: unknown[];
    excess_amount_paid: number;
  };
}

export interface LoanDuesPayload {
  payment_type: "Full Settlement" | "Normal Repayment" | "Pre Payment";  
  posting_date: string;
  against_loan: string;
}