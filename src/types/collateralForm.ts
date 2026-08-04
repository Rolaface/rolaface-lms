export interface CreateCollateralPayload {
  loan_security_code: string;
  loan_security_type: string;
  loan_security_name: string;

  // Optional (not required by the backend validator)
  loan_to_value_ratio?: number;
  haircut?: number;
  disabled?: 0 | 1;
  original_security_value?: number;
}

export interface CreateCollateralResponse {
  status: string;
  message: string;
  data: {
    name: string;
    loan_security_code: string;
    loan_security_type: string;
    loan_security_name: string;
    loan_to_value_ratio: number;
    haircut: number;
    disabled: 0 | 1;
    original_security_value: number;
    creation: string;
    modified: string;
    [key: string]: unknown;
  };
}