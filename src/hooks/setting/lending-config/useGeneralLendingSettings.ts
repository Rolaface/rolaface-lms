import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  getLendingDefaults,
  updateLendingDefaults,
} from "../../../api/setting/lending_config/lending_cfgApi";
import type { UpdateLendingDefaultsPayload } from "../../../types/setting/lending_config/lendingConfig.types";

export const LENDING_CONFIG_QUERY_KEY = ["lendingDefaults"] as const;

export function useGeneralLendingSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: LENDING_CONFIG_QUERY_KEY,
    queryFn: getLendingDefaults,
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateLendingDefaultsPayload) =>
      updateLendingDefaults(payload),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(LENDING_CONFIG_QUERY_KEY, updatedData);
      notifications.show({
        title: "Success",
        message: "General lending settings updated successfully",
        color: "green",
      });
    },
    onError: (err: Error) => {
      console.error("Failed to update general settings:", err);
      notifications.show({
        title: "Error",
        message: "Failed to save general settings",
        color: "red",
      });
    },
  });

  return {
    defaults: data,
    isLoading,
    error,
    saveSettings: mutation.mutate,
    isSaving: mutation.isPending,
  };
}