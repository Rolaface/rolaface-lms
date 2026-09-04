export interface ApiEnvelope<T> {
  status_code: number;
  status: string;
  message: {
    status_code: number;
    status: string;
    message: string;
    data: T;
  };
}

export interface PrincipalAccounts {
  default_loan_account: string | null;
  default_disbursement_bank_account: string | null;
  default_repayment_bank_account: string | null;
}

export interface InterestAndPenaltyAccounts {
  default_interest_income_account: string | null;
  default_penalty_income_account: string | null;
  default_interest_receivable_account: string | null;
  default_penalty_receivable_account: string | null;
  default_interest_accrued_account: string | null;
  default_penalty_accrued_account: string | null;
  default_interest_suspended_account: string | null;
  default_penalty_suspended_account: string | null;
  default_interest_waiver_account: string | null;
  default_penalty_waiver_account: string | null;
}

export interface GeneralAccounts {
  default_write_off_account: string | null;
  default_write_off_recovery: string | null;
  default_subsidy_account: string | null;
  default_security_deposit_account: string | null;
  default_suspense_collection: string | null;
  default_customer_refund: string | null;
}

export interface DefaultAccounts {
  principal_accounts: PrincipalAccounts;
  interest_and_penalty_accounts: InterestAndPenaltyAccounts;
  general_accounts: GeneralAccounts;
}

export interface LendingDefaultsRaw {
  default_accounts: DefaultAccounts;
  enable_topup: 0 | 1;
  enable_auto_disbursement: 0 | 1;
  name: string;
  company: string;
}

export interface GLAccountOption {
  value: string;
  label: string;
}

export interface AccountMappingRaw {
  id: string;
  transaction_type: string;
  interest_account: string | null;
  penalty_account: string | null;
}