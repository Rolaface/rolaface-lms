import apiClient from "../../config/axios";
import { API } from "../../config/api";
import type { BaseArrearParams, GetTopOverdueAccountsParams } from "../../types/Report/loanArrear";

export async function getArrearSummary(params: BaseArrearParams) {
  const { data } = await apiClient.get(API.loanArrear.getSummary, { params });
  return data.message;
}

export async function getArrearCharts(params: BaseArrearParams) {
  const { data } = await apiClient.get(API.loanArrear.getCharts, { params });
  return data.message;
}

export async function getArrearInsights(params: BaseArrearParams) {
  const { data } = await apiClient.get(API.loanArrear.getInsights, { params });
  return data.message;
}

export async function getTopOverdueAccounts(params: GetTopOverdueAccountsParams) {
  const { data } = await apiClient.get(API.loanArrear.getTopOverdueAccounts, { params });
  return data;
}

export async function exportArrearReportExcel(params: BaseArrearParams) {
  const response = await apiClient.get(API.loanArrear.exportExcel, {
    params,
    responseType: "blob",
  });
  return response.data;
}