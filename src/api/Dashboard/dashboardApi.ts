import apiClient from "../../config/axios";
import { API } from "../../config/api";

export interface BaseDashboardParams {
  from_date?: string;
  to_date?: string;
  company?: string; 
  [key: string]: any;
}

export interface PaginatedDashboardParams extends BaseDashboardParams {
  page?: number;
  page_size?: number;
}

export async function getDashboardSummary(params?: BaseDashboardParams) {
  const { data } = await apiClient.get(API.dashboard.getSummary, { params });
  return data;
}

export async function getDashboardCharts(params?: BaseDashboardParams) {
  const { data } = await apiClient.get(API.dashboard.getCharts, { params });
  return data;
}

export async function getQuickInsights(params?: BaseDashboardParams) {
  const { data } = await apiClient.get(API.dashboard.getQuickInsights, { params });
  return data;
}

export async function getPendingApprovals(params?: PaginatedDashboardParams) {
  const { data } = await apiClient.get(API.dashboard.getPendingApprovals, { params });
  return data;
}

export async function getOverdueTasks(params?: PaginatedDashboardParams) {
  const { data } = await apiClient.get(API.dashboard.getOverdueTasks, { params });
  return data;
}