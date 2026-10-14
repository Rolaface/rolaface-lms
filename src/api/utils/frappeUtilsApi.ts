import type { AxiosResponse } from 'axios';
import apiClient from '../../config/axios';
import { API } from '../../config/api';

const api = apiClient;

/* ───────────────── Types ───────────────── */

export interface FiscalYearData {
  fiscal_year: string;
  start_date: string;
  end_date: string;
}

interface FiscalYearEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: FiscalYearData;
}

interface FiscalYearApiResponse {
  message: FiscalYearEnvelope;
}


export interface UserOption {
  name: string;
  full_name: string;
  email: string;
  enabled: number;
  user_type: string;
}

interface RawUserResponse {
  data: UserOption[];
}

/* ───────────────── Current fiscal year ───────────────── */

// API.frappeUtilsAPI.getCompanyCurrentFiscalYear
export async function getCompanyCurrentFiscalYear(): Promise<FiscalYearData | null> {
  const response: AxiosResponse<FiscalYearApiResponse> = await api.get(
    API.frappeUtilsAPI.getCompanyCurrentFiscalYear,
  );
  return response.data.message?.data ?? null;
}

/* ───────────────── Account options (for dropdown) ───────────────── */

export interface AccountOption {
  name: string;
  account_name: string;
  account_currency: string | null;
  account_number: string | null;
  account_type: string;
}

interface RawAccountOptionsResponse {
  data: AccountOption[];
}

export async function fetchLedgerAccountOptions(): Promise<AccountOption[]> {
  const response: AxiosResponse<RawAccountOptionsResponse> = await api.get(
    API.frappeUtilsAPI.getaccounts,
    {
      params: {
        fields: JSON.stringify(["name", "account_currency", "account_number", "account_name", "account_type"]),
        filters: JSON.stringify([["is_group", "=", 0]]),
        limit_page_length: 0,
        order_by: "creation desc",
      },
    },
  );
  return response.data.data ?? [];
}

/** Ledger (non-group) accounts whose name matches the search, for a searchable dropdown. */
export async function searchLedgerAccounts(search = "", limit = 20): Promise<AccountOption[]> {
  const filters: (string | number)[][] = [["is_group", "=", 0]];
  if (search.trim()) filters.push(["name", "like", `%${search.trim()}%`]);
  const response: AxiosResponse<RawAccountOptionsResponse> = await api.get(API.frappeUtilsAPI.getaccounts, {
    params: {
      fields: JSON.stringify(["name", "account_currency", "account_number", "account_name", "account_type"]),
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      order_by: "name asc",
    },
  });
  return response.data.data ?? [];
}

/** Names of the accounts matching the filters (Frappe Account list). */
async function accountNames(filters: (string | number | string[])[][]): Promise<string[]> {
  const response: AxiosResponse<{ data: { name: string }[] }> = await api.get(API.frappeUtilsAPI.getaccounts, {
    params: {
      fields: JSON.stringify(["name"]),
      filters: JSON.stringify(filters),
      limit_page_length: 0,
      order_by: "name asc",
    },
  });
  return (response.data.data ?? []).map((a) => a.name);
}

/** The company an account belongs to. */
export async function getAccountCompany(account: string): Promise<string | null> {
  const response: AxiosResponse<{ data: { company: string }[] }> = await api.get(API.frappeUtilsAPI.getaccounts, {
    params: {
      fields: JSON.stringify(["company"]),
      filters: JSON.stringify([["name", "=", account]]),
      limit_page_length: 1,
    },
  });
  return response.data.data?.[0]?.company ?? null;
}

/**
 * Ledger accounts of the given Account Types inside a group path of the Chart of Accounts.
 *   groupPath    - group names from the top down, each one inside the previous, e.g. ["Current Assets", "Bank Accounts"]
 *   accountTypes - Account Types of the ledgers to list, e.g. ["Bank"] (empty = any type)
 *   company      - limit to one company (optional)
 */
export async function fetchAccountsUnderGroups({
  groupPath,
  accountTypes = [],
  company,
}: {
  groupPath: string[];
  accountTypes?: string[];
  company?: string | null;
}): Promise<AccountOption[]> {
  const companyFilter = company ? [["company", "=", company]] : [];
  // Resolve each group of the path inside the groups found at the previous level.
  let parents: string[] | null = null;
  for (const groupName of groupPath) {
    const base = [["is_group", "=", 1], ["account_name", "=", groupName], ...companyFilter];
    const found: string[] = parents
      ? (await Promise.all(parents.map((p) => accountNames([...base, ["name", "descendants of", p]])))).flat()
      : await accountNames(base);
    parents = Array.from(new Set(found));
    if (!parents.length) return [];
  }
  const groups = parents ?? [];
  const typeFilter = accountTypes.length ? [["account_type", "in", accountTypes]] : [];
  const lists = await Promise.all(
    groups.map(async (group) => {
      const response: AxiosResponse<RawAccountOptionsResponse> = await api.get(API.frappeUtilsAPI.getaccounts, {
        params: {
          fields: JSON.stringify(["name", "account_currency", "account_number", "account_name", "account_type"]),
          filters: JSON.stringify([
            ["is_group", "=", 0],
            ["disabled", "=", 0],
            ["name", "descendants of", group],
            ...typeFilter,
            ...companyFilter,
          ]),
          limit_page_length: 0,
          order_by: "name asc",
        },
      });
      return response.data.data ?? [];
    }),
  );
  const byName = new Map(lists.flat().map((a) => [a.name, a]));
  return Array.from(byName.values());
}


export async function fetchRelationshipManagers(
  query?: string,
): Promise<UserOption[]> {
  const trimmedQuery = query?.trim() ?? "";

  const params: Record<string, string | number> = {
    fields: JSON.stringify([
      "name",
      "full_name",
      "email",
      "enabled",
      "user_type",
    ]),
    filters: JSON.stringify([
      ["enabled", "=", 1],
      ["role_profile_name", "=", "Relationship Manager"],
    ]),
    limit_page_length: 10,
  };

  if (trimmedQuery) {
    params.or_filters = JSON.stringify([
      ["name", "like", `%${trimmedQuery}%`],
      ["full_name", "like", `%${trimmedQuery}%`],
      ["email", "like", `%${trimmedQuery}%`],
    ]);
  }

  const response: AxiosResponse<RawUserResponse> = await api.get(
    API.frappeUtilsAPI.getallusers,
    {
      params,
    },
  );

  return Array.isArray(response.data?.data)
    ? response.data.data
    : [];
}