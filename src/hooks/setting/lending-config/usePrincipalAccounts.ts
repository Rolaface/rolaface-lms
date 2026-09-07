import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLendingDefaults } from "../../../api/setting/lending_config/lending_cfgApi";
import { LENDING_CONFIG_QUERY_KEY } from "./useGeneralLendingSettings";
import type {
  GLAccountOption,
  LendingDefaultsRaw,
  PrincipalAccounts,
} from "../../../types/setting/lending_config/lendingConfig.types";

export interface GLAccountRow {
  id: string;
  label: string;
  value: string | null;
}

const ROW_DEFS: { id: string; label: string; key: keyof PrincipalAccounts }[] = [
  {
    id: "loan_account",
    label: "Loan Account",
    key: "default_loan_account",
  },
  {
    id: "disbursement_account",
    label: "Disbursement Bank Account",
    key: "default_disbursement_bank_account",
  },
  {
    id: "repayment_account",
    label: "Repayment Bank Account",
    key: "default_repayment_bank_account",
  },
];


function buildGlAccounts(defaultsData?: LendingDefaultsRaw): GLAccountOption[] {
  if (!defaultsData) return [];
  const all = [
    ...Object.values(defaultsData.default_accounts.principal_accounts),
    ...Object.values(defaultsData.default_accounts.interest_and_penalty_accounts),
    ...Object.values(defaultsData.default_accounts.general_accounts),
  ].filter((v): v is string => !!v);

  return Array.from(new Set(all)).map((name) => ({ value: name, label: name }));
}

export function usePrincipalAccounts() {
  const { data: defaultsData, isLoading } = useQuery<LendingDefaultsRaw>({
    queryKey: LENDING_CONFIG_QUERY_KEY,
    queryFn: getLendingDefaults,
    staleTime: 5 * 60 * 1000,
  });

  const accounts = defaultsData?.default_accounts.principal_accounts;

  const rows: GLAccountRow[] = useMemo(() => {
    if (!accounts) return [];
    return ROW_DEFS.map((row) => ({
      id: row.id,
      label: row.label,
      value: accounts[row.key],
    }));
  }, [accounts]);

  const glAccounts = useMemo(() => buildGlAccounts(defaultsData), [defaultsData]);

  return { rows, glAccounts, isLoading };
}