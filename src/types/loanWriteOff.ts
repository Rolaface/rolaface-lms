
export interface WriteOffAccountItem {
  value: string;
  label: string;
  description: string;
}

export interface WriteOffAccountsPagination {
  page: number;
  page_size: number;
  items_in_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetWriteOffAccountsResponse {
  status_code: number;
  status: string;
  message: string;
  data: WriteOffAccountItem[];
  pagination: WriteOffAccountsPagination;
}


export interface LoanAccountItem {
  name: string;
  applicant: string;
  applicant_name: string | null;
  loan_product: string;
  loan_amount: number;
  total_payment: number;
  total_interest_payable: number;
  total_principal_paid: number;
  total_amount_paid: number;
  pending_principal_amount: number;
}

export interface GetLoanAccountsResponse {
  status_code: number;
  status: string;
  message: string;
  data: LoanAccountItem[];
  pagination?: {
    page: number;
    page_size: number;
    items_in_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}
export interface CreateLoanWriteOffPayload {
  loan: string;
  write_off_amount: number;
  write_off_account: string;
  posting_date: string;
  value_date: string;
  is_settlement_write_off: 1;
}

export interface CreateLoanWriteOffResponse {
  status_code: number;
  status: string;
  message: string;
  data?: unknown;
}

export interface LoanWriteOffListItem {
  name: string;
  loan: string;
  applicant: string;
  loan_product: string;
  write_off_amount: number;
  posting_date: string;
  company: string;
  docstatus: number;
}

export interface GetLoanWriteOffsResponse {
  status_code: number;
  status: string;
  message: string;
  data: LoanWriteOffListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
export interface LoanWriteOffDetail {
  amended_from: string | null;
  loan_product: string;
  write_off_account: string;
  write_off_amount: number;
  applicant: string;
  is_npa: number;
  loan_disbursement: string;
  is_settlement_write_off: number;
  cost_center: string;
  applicant_type: string;
  company: string;
  loan: string;
  posting_date: string;
  value_date: string;
  name: string;
  creation: string;
  modified: string;
  docstatus: number;
  owner: string;
}

export interface GetLoanWriteOffByIdResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: LoanWriteOffDetail;
  };
}
export interface UpdateLoanWriteOffPayload {
  name: string;
  loan: string;
  write_off_amount: number;
  write_off_account: string;
  posting_date: string;
  value_date: string;
  is_settlement_write_off: 1;
}
export interface DeleteLoanWriteOffResponse {
  status_code: number;
  status: string;
  message: string;
}
export interface UpdateLoanWriteOffStatusResponse {
  status_code: number;
  status: string;
  message: string;
}