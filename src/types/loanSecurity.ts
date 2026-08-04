export interface LoanSecurity {
  name: string;
  creation: string;
  modified: string;
  docstatus: number;
  
  loan_security_code: string;
  loan_security_name: string;
  loan_security_type: string;
  haircut: number;
  original_security_value: number;
  utilized_security_value: number;
  available_security_value: number;
  loan_to_value_ratio: number;
  disabled: 0 | 1;
}

export interface CreateLoanSecurityPayload {
  loan_security_code: string;
  loan_security_name: string;
  loan_security_type: string;
  haircut?: number;
  original_security_value?: number;
  utilized_security_value?: number;
  available_security_value?: number;
  loan_to_value_ratio?: number;
  disabled?: 0 | 1;
}

export interface CreateLoanSecurityResponse {
  status: "success" | "error";
  message: string;
  data: LoanSecurity;
}

export interface GetLoanSecurityListResponse {
  success: boolean;
  message: string;
  data: LoanSecurity[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}