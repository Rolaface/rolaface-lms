import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";
import { formatAmount as formatAmountShared } from "../../store/currencyStore";

const api = apiClient;

/* ===========================================================
   TYPES — matches real Trial Balance response
=========================================================== */

export interface TBAccount {
  account: string;
  account_name: string;
  currency?: string;
  indent: number;
  opening_debit: number;
  opening_credit: number;
  debit: number;
  credit: number;
  closing_debit: number;
  closing_credit: number;
  has_value: boolean;
  children?: TBAccount[];
}

export interface TBFilters {
  from_date: string;
  to_date: string;
  fiscal_year: string; 
  show_zero_values: boolean;
  with_period_closing_entry: boolean;
  show_closing_entries: boolean;
}

export interface TBResponse {
  company: string;
  total_accounts: number;
  totals: {
    opening_debit: number; opening_credit: number;
    debit: number; credit: number;
    closing_debit: number; closing_credit: number;
  };
  accounts: TBAccount[];
}

interface TBApiData {
  company: string;
  total_accounts: number;
  totals: TBResponse["totals"];
  accounts: TBAccount[];
}

interface TBEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: TBApiData;
}

interface TBApiResponse {
  message: TBEnvelope;
}

const currentYear = new Date().getFullYear();


export const DEFAULT_TB_FILTERS: TBFilters = {
  from_date: `${currentYear}-04-01`,
  to_date: `${currentYear + 1}-03-31`,
  fiscal_year: `${currentYear}-${currentYear + 1}`,
  show_zero_values: false,
  with_period_closing_entry: false,
  show_closing_entries: false,
};


export function nf(currency: string, value: number) {
  if (!value) return "—";
  return formatAmountShared(currency, value, { withSymbol: true });
}


export async function fetchTrialBalance(filters: TBFilters): Promise<TBResponse> {
  const params = {
    from_date: filters.from_date || undefined,
    to_date: filters.to_date || undefined,
    fiscal_year: filters.fiscal_year || undefined,
    show_zero_values: filters.show_zero_values ? 1 : 0,
    with_period_closing_entry: filters.with_period_closing_entry ? 1 : 0,
    show_closing_entries: filters.show_closing_entries ? 1 : 0,
  };

  const response: AxiosResponse<TBApiResponse> = await api.get(
    API.Accounting.trialbalnce.get,
    { params },
  );

  const payload = response.data.message.data;

  return {
    company: payload.company,
    total_accounts: payload.total_accounts,
    totals: payload.totals,
    accounts: payload.accounts || [],
  };
}