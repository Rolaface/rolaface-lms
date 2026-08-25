import apiClient from "../../config/axios";
import { API } from "../../config/api";

export interface BaseStatementParams {
  loan_id: string;
  from_date?: string;
  to_date?: string;
  view_type?: "summary" | "detailed";
}

export interface GetLoanStatementParams extends BaseStatementParams {
  page?: number;
  page_size?: number;
  search?: string;
  transaction_type?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getLoanStatementDashboard(params: BaseStatementParams) {
  const { data } = await apiClient.get(API.loanStatement.getDashboard, { params });
  return data;
}

export async function getLoanStatement(params: GetLoanStatementParams) {
  const { data } = await apiClient.get(API.loanStatement.getStatement, { params });
  return data;
}

export async function exportLoanStatementPDF(params: BaseStatementParams) {
  const response = await apiClient.get(API.loanStatement.exportPdf, {
    params,
    responseType: "blob", 
  });
  return response.data;
}

export async function exportLoanStatementExcel(params: BaseStatementParams) {
  const response = await apiClient.get(API.loanStatement.exportExcel, {
    params,
    responseType: "blob",
  });
  return response.data;
}

export interface SendLoanStatementPayload {
  customer_id: string;
  loan_id: string;
  from_date: string;
  to_date: string;
}

export async function sendLoanStatementEmail(payload: SendLoanStatementPayload) {
  const { data } = await apiClient.post(API.loanStatement.sendStatement, payload);
  return data;
}