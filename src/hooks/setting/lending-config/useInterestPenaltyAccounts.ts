import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  getLendingDefaults,
  getGLAccountsList,
  updateLendingDefaults,
} from "../../../api/setting/lending_config/lending_cfgApi";
import { LENDING_CONFIG_QUERY_KEY } from "./useGeneralLendingSettings";
import type { AccountMappingRaw } from "../../../types/setting/lending_config/lendingConfig.types";

export function useInterestPenaltyAccounts() {
  const queryClient = useQueryClient();

  const [sameAsInterest, setSameAsInterest] = useState<boolean>(true);
  const [mappings, setMappings] = useState<AccountMappingRaw[]>([]);

  const { data: defaultsData, isLoading: isDefaultsLoading } = useQuery({
    queryKey: LENDING_CONFIG_QUERY_KEY,
    queryFn: getLendingDefaults,
  });

  const { data: glAccounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ["glAccounts"],
    queryFn: () => getGLAccountsList(),
  });

  useEffect(() => {
    if (defaultsData) {
      setSameAsInterest(defaultsData.same_as_interest);
      setMappings(defaultsData.mappings || []);
    }
  }, [defaultsData]);

  const handleInterestChange = (index: number, val: string | null) => {
    const updated = [...mappings];
    const newAccount = val || "";
    updated[index].interest_account = newAccount;

    if (sameAsInterest) {
      updated[index].penalty_account = newAccount;
    }
    setMappings(updated);
  };

  const handlePenaltyChange = (index: number, val: string | null) => {
    const updated = [...mappings];
    updated[index].penalty_account = val || "";
    setMappings(updated);
  };

  const handleToggleSameAsInterest = (checked: boolean) => {
    setSameAsInterest(checked);
    if (checked) {
      setMappings((prev) =>
        prev.map((r) => ({ ...r, penalty_account: r.interest_account }))
      );
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!defaultsData) return;
      return updateLendingDefaults({
        auto_disbursement: defaultsData.auto_disbursement,
        enable_topup: defaultsData.enable_topup,
        same_as_interest: sameAsInterest,
        mappings: mappings.map((m) => ({
          transaction_type: m.transaction_type,
          interest_account: m.interest_account,
          penalty_account: m.penalty_account,
        })),
      });
    },
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(LENDING_CONFIG_QUERY_KEY, updated);
      }
      notifications.show({
        title: "Success",
        message: "Lending defaults updated successfully",
        color: "green",
      });
    },
    onError: (err: Error) => {
      console.error("Failed to update lending mappings:", err);
      notifications.show({
        title: "Error",
        message: "Failed to update lending settings",
        color: "red",
      });
    },
  });

  return {
    mappings,
    glAccounts,
    sameAsInterest,
    isLoading: isDefaultsLoading || isAccountsLoading,
    isSaving: saveMutation.isPending,
    handleInterestChange,
    handlePenaltyChange,
    handleToggleSameAsInterest,
    saveMappings: saveMutation.mutate,
  };
}