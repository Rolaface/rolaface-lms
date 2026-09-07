import { useQuery } from "@tanstack/react-query";
import { getLendingDefaults } from "../../../api/setting/lending_config/lending_cfgApi";
import type { LendingDefaultsRaw } from "../../../types/setting/lending_config/lendingConfig.types";

// Shared cache key — any screen using this key gets the same cached
// data instead of firing a fresh network call, and stays in sync
// automatically if the cache is ever updated elsewhere.
export const LENDING_CONFIG_QUERY_KEY = ["lendingDefaults"] as const;

export function useGeneralLendingSettings() {
  const { data, isLoading, error } = useQuery<LendingDefaultsRaw>({
    queryKey: LENDING_CONFIG_QUERY_KEY,
    queryFn: getLendingDefaults,
    staleTime: 5 * 60 * 1000, // 5 min — avoids refetch on every tab switch
  });

  return {
    defaults: data,
    isLoading,
    error,
  };
}