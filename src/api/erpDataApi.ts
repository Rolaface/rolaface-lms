import type { AxiosResponse } from "axios";
import apiClient from "../config/axios";
import { API } from "../config/api";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;

export async function getCompanyInfo(): Promise<any> {
  const resp: AxiosResponse = await apiClient.get(API.Company.getById, {
    params: { custom_company_id: COMPANY_ID },
  });
  return resp.data?.data || null;
}


export async function getLoginUser(): Promise<any> {
  const resp: AxiosResponse = await apiClient.get(API.Company.getUserDetails);
  return resp.data?.message?.data || null;
}


export async function getCurrencyList(params: { search?: string; page_size?: number } = {}): Promise<any[]> {
  const resp: AxiosResponse = await apiClient.get(API.Company.getCurrency, { params });
  return resp.data?.data || [];
}