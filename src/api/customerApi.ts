import apiClient from "../config/axios";
import { API } from "../config/api";

export interface GetCustomersParams {
  search?: string;
}

export async function getAllCustomers(params: GetCustomersParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;

  const { data } = await apiClient.get(API.customer.getAllCustomers, { params: queryParams });
  return data;
}