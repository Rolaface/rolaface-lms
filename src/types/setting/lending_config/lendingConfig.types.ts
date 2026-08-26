export interface GLAccountOption {
  value: string;
  label: string;
  account_type?: string;
}

export interface AccountMappingRaw {
  id: string;
  transaction_type: string;
  interest_account: string;
  penalty_account: string;
}

export interface LendingDefaultsRaw {
  auto_disbursement: boolean;
  enable_topup: boolean;
  same_as_interest: boolean;
  mappings: AccountMappingRaw[];
}

export interface UpdateLendingDefaultsPayload {
  auto_disbursement: boolean;
  enable_topup: boolean;
  same_as_interest: boolean;
  mappings: Array<{
    transaction_type: string;
    interest_account: string;
    penalty_account: string;
  }>;
}

export interface ApiEnvelope<T> {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: T;
  };
}