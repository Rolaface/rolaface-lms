import type { AxiosResponse } from 'axios';
import apiClient from '../../config/axios';
import { API } from '../../config/api';

const api = apiClient;

/* ───────────────── Types ───────────────── */

interface FiscalYearEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: { fiscal_year: string };
}

interface FiscalYearApiResponse {
  message: FiscalYearEnvelope;
}

/* ───────────────── Current fiscal year ───────────────── */


// API.frappeUtilsAPI.getCompanyCurrentFiscalYear
export async function getCompanyCurrentFiscalYear(): Promise<string | null> {
  const response: AxiosResponse<FiscalYearApiResponse> = await api.get(
    API.frappeUtilsAPI.getCompanyCurrentFiscalYear,
  );
  return response.data.message?.data?.fiscal_year ?? null;
}