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