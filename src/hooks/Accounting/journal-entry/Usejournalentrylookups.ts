import { useQuery } from "@tanstack/react-query";
import { getComponentById } from "../../../api/Accounting/Journalentries.api";
import {
  getCustomerListJe,
  getSupplierList,
} from "../../../api/lookup api/Journalentrylookup.api";
import { mapOptions } from "../../../utils/Accounitng/Journal-Entry/Journalentry.utils";
import type { SelectOption } from "../../../types/Accounting/Journalentry.types";

export const lookupKeys = {
  accounts: ["journalEntry", "lookup", "accounts"] as const,
  partyTypes: ["journalEntry", "lookup", "partyTypes"] as const,
  customers: ["journalEntry", "lookup", "customers"] as const,
  suppliers: ["journalEntry", "lookup", "suppliers"] as const,
};

/** GL Account options — group accounts only, same filter as the old project */
export function useAccountOptions() {
  return useQuery({
    queryKey: lookupKeys.accounts,
    queryFn: async () => {
      const res = await getComponentById("Account", ["name", "account_currency"], [["is_group", "=", 0]]);
      const rawAccounts =
        res?.data?.message?.data || res?.data?.message || res?.data?.data || res?.data || [];

      const options: SelectOption[] = Array.isArray(rawAccounts)
        ? rawAccounts.map((item: any) => {
          
            const currency = item.account_currency || "";
           const label = currency ? `${item.name} (${currency})` : item.name;

            return {
              label,
              value: item.name,
              currency,
            };
          })
        : [];
      return options;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Party Type options — fetched once, always available (matches old fetchInitialOptions) */
export function usePartyTypeOptions() {
  return useQuery({
    queryKey: lookupKeys.partyTypes,
    queryFn: async () => {
      const res = await getComponentById("Party Type").catch(() => null);
      return mapOptions(res);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Customer options — lazy loaded. Pass `enabled=true` only once a row's
 * partyType has been set to "Customer" (mirrors the old project's
 * on-demand fetch instead of loading on mount).
 */
export function useCustomerOptions(enabled: boolean) {
  return useQuery({
    queryKey: lookupKeys.customers,
    queryFn: async () => mapOptions(await getCustomerListJe()),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** Supplier options — lazy loaded, same pattern as customers. */
export function useSupplierOptions(enabled: boolean) {
  return useQuery({
    queryKey: lookupKeys.suppliers,
    queryFn: async () => mapOptions(await getSupplierList()),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}