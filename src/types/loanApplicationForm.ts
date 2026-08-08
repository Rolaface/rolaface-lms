export interface CreateLoanApplicationPayload {
  applicant_type: "Customer" | string;
  applicant: string;
  loan_product: string;
  loan_amount: number;
  rate_of_interest: number;
  is_term_loan: 0 | 1;
  repayment_method: "Repay Over Number of Periods" | "Repay Fixed Amount per Period";
  posting_date: string;

  // Optional fields
  country?: string;
address_line_1?: string;
address_line_2?: string;
city?: string;
state?: string;
zip_code?: string;
  applicant_email_address?: string;
  applicant_phone_number?: string;
  applicant_name?: string;
  company?: string;
  status?: string;
  loan_purpose?: string;
  is_secured_loan?: 0 | 1;
  repayment_periods?: number;
  monthly_repayment_amount?: number;
  repayment_start_date?: string;
}

// export interface CreateLoanApplicationResponse {
//   message: {
//     name: string;
//     [key: string]: unknown;
//   };
// }
export interface CreateLoanApplicationResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: {
      name: string;
      [key: string]: unknown;
    };
  };
}