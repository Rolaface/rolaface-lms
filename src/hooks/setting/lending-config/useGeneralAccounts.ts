import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLendingDefaults } from "../../../api/setting/lending_config/lending_cfgApi";
import { LENDING_CONFIG_QUERY_KEY } from "./useGeneralLendingSettings";
import type {
  GeneralAccounts,
  GLAccountOption,
  LendingDefaultsRaw,
} from "../../../types/setting/lending_config/lendingConfig.types";

export interface GLAccountRow {
  id: string;
  label: string;
  value: string | null;
}

const ROW_DEFS: { id: string; label: string; key: keyof GeneralAccounts }[] = [
  { id: "write_off", label: "Write-off Account", key: "default_write_off_account" },
  { id: "write_off_recovery", label: "Write-off Recovery Account", key: "default_write_off_recovery" },
  { id: "subsidy", label: "Subsidy Account", key: "default_subsidy_account" },
  { id: "security_deposit", label: "Security Deposit Account", key: "default_security_deposit_account" },
  { id: "suspense_collection", label: "Suspense Collection Account", key: "default_suspense_collection" },
  { id: "customer_refund", label: "Customer Refund Account", key: "default_customer_refund" },
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

export function useGeneralAccounts() {
  const { data: defaultsData, isLoading } = useQuery<LendingDefaultsRaw>({
    queryKey: LENDING_CONFIG_QUERY_KEY,
    queryFn: getLendingDefaults,
    staleTime: 5 * 60 * 1000,
  });

  const accounts = defaultsData?.default_accounts.general_accounts;

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