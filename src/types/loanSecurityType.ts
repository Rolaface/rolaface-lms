export interface LoanSecurityType {
  name: string;
  creation: string;
  modified: string;
  docstatus: number;
  
  loan_security_type: string;
  haircut: number;
  loan_to_value_ratio: number;
  disabled: 0 | 1;
}

export interface CreateLoanSecurityTypePayload {
  loan_security_type: string;
  haircut?: number;
  loan_to_value_ratio?: number;
  disabled?: 0 | 1;
}

export interface CreateLoanSecurityTypeResponse {
  status: "success" | "error";
  message: string;
  data: LoanSecurityType;
}

export interface GetLoanSecurityTypeListResponse {
  success: boolean;
  message: string;
  data: LoanSecurityType[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}