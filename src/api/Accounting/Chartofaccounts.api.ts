import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";
import { formatAmount, getSymbol } from "../../store/currencyStore";

const api = apiClient;
export const ChartOfAccountsAPI = API.Accounting.chartOfAccounts;

/* ===========================================================
   TYPES — matches real Chart of Accounts response
=========================================================== */

export interface COAAccount {
  name: string;
  account_name: string;
  account_number?: string;
  parent_account?: string | null;
  account_type?: string;
  root_type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
  is_group: 0 | 1;
  account_currency: string;
  disabled: 0 | 1;
  balance: number;
  balance_in_account_currency?: number;
  children?: COAAccount[];
}

interface ChartOfAccountsData {
  company: string;
  base_currency: string;
  total: number;
  accounts: COAAccount[];
}

interface ChartOfAccountsEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: ChartOfAccountsData;
}

interface ChartOfAccountsApiResponse {
  message: ChartOfAccountsEnvelope;
}

export interface ChartOfAccountsResult {
  accounts: COAAccount[];
  baseCurrency: string;
  company: string;
}

export { formatAmount, getSymbol as symbolFor };

/* ===========================================================
   GET CHART OF ACCOUNTS
=========================================================== */

export async function fetchChartOfAccounts(): Promise<ChartOfAccountsResult> {
  const response: AxiosResponse<ChartOfAccountsApiResponse> = await api.get(
    ChartOfAccountsAPI.getCOA
  );
  const payload = response.data.message.data;
  return {
    accounts: payload.accounts,
    baseCurrency: payload.base_currency,
    company: payload.company,
  };
}

export async function deleteAccount(accountName: string): Promise<void> {
  await api.post(`${ChartOfAccountsAPI.deleteCOA}?id=${accountName}`);
}