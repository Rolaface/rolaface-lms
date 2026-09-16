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