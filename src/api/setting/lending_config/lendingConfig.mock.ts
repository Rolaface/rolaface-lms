import type {
  GLAccountOption,
  LendingDefaultsRaw,
} from "../../../types/setting/lending_config/lendingConfig.types.ts";

export const DUMMY_GL_ACCOUNTS: GLAccountOption[] = [
  { value: "4100", label: "4100 - Interest Income" },
  { value: "1200", label: "1200 - Accounts Receivable" },
  { value: "2100", label: "2100 - Accrued Interest" },
  { value: "2200", label: "2200 - Suspended Interest" },
  { value: "5100", label: "5100 - Interest Expense / Waiver" },
];

export let DUMMY_LENDING_DEFAULTS: LendingDefaultsRaw = {
  auto_disbursement: true,
  enable_topup: true,
  allow_partial_repayment: true,
  auto_repayment_schedule: true,
  interest_accrual: true,
  penalty_interest: true,
  loan_restructuring: true,
  auto_write_off: true,
  same_as_interest: true,

  mappings: [
    {
      id: "1",
      transaction_type: "Income",
      interest_account: "4100",
      penalty_account: "4100",
    },
    {
      id: "2",
      transaction_type: "Receivable",
      interest_account: "1200",
      penalty_account: "1200",
    },
    {
      id: "3",
      transaction_type: "Accrued",
      interest_account: "2100",
      penalty_account: "2100",
    },
    {
      id: "4",
      transaction_type: "Suspended",
      interest_account: "2200",
      penalty_account: "2200",
    },
    {
      id: "5",
      transaction_type: "Waiver",
      interest_account: "",
      penalty_account: "",
    },
  ],
};

export const updateMockLendingDefaults = (
  updated: LendingDefaultsRaw,
): LendingDefaultsRaw => {
  DUMMY_LENDING_DEFAULTS = { ...updated };
  return DUMMY_LENDING_DEFAULTS;
};