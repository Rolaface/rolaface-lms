export interface CreateCollateralTypePayload {
  loan_security_type: string;

  // Optional (not required by the backend validator)
  loan_to_value_ratio?: number;
  haircut?: number;
  disabled?: 0 | 1;
}

export interface CreateCollateralTypeResponse {
  status: string;
  message: string;
  data: {
    name: string;
    loan_security_type: string;
    loan_to_value_ratio: number;
    haircut: number;
    disabled: 0 | 1;
    creation: string;
    modified: string;
    [key: string]: unknown;
  };
}