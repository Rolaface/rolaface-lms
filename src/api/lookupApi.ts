import apiClient from "../config/axios"; 
import { API } from "../config/api";

export async function getLoanSecurityType(params?: Record<string, any>) {
  const { data } = await apiClient.get(API.search.getLoanSecurityType, { params });
  return data;
}