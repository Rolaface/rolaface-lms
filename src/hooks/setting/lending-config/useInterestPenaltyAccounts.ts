import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLendingDefaults } from "../../../api/setting/lending_config/lending_cfgApi";
import { LENDING_CONFIG_QUERY_KEY } from "./useGeneralLendingSettings";
import type {
  AccountMappingRaw,
  GLAccountOption,
  LendingDefaultsRaw,
  InterestAndPenaltyAccounts,
} from "../../../types/setting/lending_config/lendingConfig.types";

const ROW_DEFS: {
  id: string;
  transaction_type: string;
  interestKey: keyof InterestAndPenaltyAccounts;
  penaltyKey: keyof InterestAndPenaltyAccounts;
}[] = [
  {
    id: "1",
    transaction_type: "Income",
    interestKey: "default_interest_income_account",
    penaltyKey: "default_penalty_income_account",
  },
  {
    id: "2",
    transaction_type: "Receivable",
    interestKey: "default_interest_receivable_account",
    penaltyKey: "default_penalty_receivable_account",
  },
  {
    id: "3",
    transaction_type: "Accrued",
    interestKey: "default_interest_accrued_account",
    penaltyKey: "default_penalty_accrued_account",
  },
  {
    id: "4",
    transaction_type: "Suspended",
    interestKey: "default_interest_suspended_account",
    penaltyKey: "default_penalty_suspended_account",
  },
  {
    id: "5",
    transaction_type: "Waiver",
    interestKey: "default_interest_waiver_account",
    penaltyKey: "default_penalty_waiver_account",
  },
];

export function useInterestPenaltyAccounts() {
  const { data: defaultsData, isLoading } = useQuery<LendingDefaultsRaw>({
    queryKey: LENDING_CONFIG_QUERY_KEY,
    queryFn: getLendingDefaults,
    staleTime: 5 * 60 * 1000,
  });

  const accounts = defaultsData?.default_accounts.interest_and_penalty_accounts;

  // Flat API keys → row-based structure the table renders.
  const mappings: AccountMappingRaw[] = useMemo(() => {
    if (!accounts) return [];
    return ROW_DEFS.map((row) => ({
      id: row.id,
      transaction_type: row.transaction_type,
      interest_account: accounts[row.interestKey],
      penalty_account: accounts[row.penaltyKey],
    }));
  }, [accounts]);

  // True only if every row's interest & penalty account already match in the API data.
  const sameAsInterest = useMemo(
    () =>
      mappings.length > 0 &&
      mappings.every((m) => m.interest_account === m.penalty_account),
    [mappings]
  );

  // Built from whatever account strings the GET response contains, so the
  // disabled Select can render the current value as a valid option.
  // Swap for a real chart-of-accounts endpoint once one is available.
  const glAccounts: GLAccountOption[] = useMemo(() => {
    if (!defaultsData) return [];
    const all = [
      ...Object.values(defaultsData.default_accounts.principal_accounts),
      ...Object.values(defaultsData.default_accounts.interest_and_penalty_accounts),
      ...Object.values(defaultsData.default_accounts.general_accounts),
    ].filter((v): v is string => !!v);

    return Array.from(new Set(all)).map((name) => ({
      value: name,
      label: name,
    }));
  }, [defaultsData]);

  return {
    mappings,
    glAccounts,
    sameAsInterest,
    isLoading,
  };
}