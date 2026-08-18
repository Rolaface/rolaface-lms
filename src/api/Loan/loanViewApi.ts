import { mantineTheme } from './../../mantine.theme';
import apiClient from "../../config/axios";
import { API } from "../../config/api";

export interface LoanBaseParams {
  id: string;
}

export interface LoanPaginatedParams extends LoanBaseParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface InstallmentParams extends LoanBaseParams {
  idx: number;
}

export interface ScheduleParams extends LoanBaseParams {
  schedule_id?: string;
}

export async function getLoanOverview(params: LoanBaseParams) {
  const { data } = await apiClient.get(API.loanView.getOverview, { params });
  return data.message;
}

export async function getInstallmentDetail(params: InstallmentParams) {
  const { data } = await apiClient.get(API.loanView.getInstallmentDetail, { params });
  return data.message;
}

export async function getRepaymentScheduleTimeline(params: LoanBaseParams) {
  const { data } = await apiClient.get(API.loanView.getScheduleTimeline, { params });
  return data.message;
}

export async function getRepaymentScheduleVersions(params: LoanBaseParams) {
  const { data } = await apiClient.get(API.loanView.getScheduleVersions, { params });
  return data.message;
}

export async function getRepaymentSchedule(params: ScheduleParams) {
  const { data } = await apiClient.get(API.loanView.getSchedule, { params });
  return data.message;
}

export async function getRepaymentHistory(params: LoanPaginatedParams) {
  const { data } = await apiClient.get(API.loanView.getRepaymentHistory, { params });
  return data.message;
}

export async function getLoanAccountingLedger(params: LoanPaginatedParams) {
  const { data } = await apiClient.get(API.loanView.getAccountingLedger, { params });
  return data.message;
}

export async function getCollateralView(params: LoanPaginatedParams) {
  const { data } = await apiClient.get(API.loanView.getCollateralView, { params });
  return data.message;
}

export async function getLoanDocuments(params: LoanPaginatedParams) {
  const { data } = await apiClient.get(API.loanView.getDocuments, { params });
  return data.message;
}

export async function getLoanActivityAudit(params: LoanPaginatedParams) {
  const { data } = await apiClient.get(API.loanView.getActivityAudit, { params });
  return data.message;
}

export async function getDisbursementHistory(params: LoanPaginatedParams) {
  const { data } = await apiClient.get(API.loanView.getDisbursementHistory, { params });
  return data.message;
}