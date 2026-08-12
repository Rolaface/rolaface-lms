

import apiClient from "../../config/axios";
import { API } from "../../config/api";

interface SearchApiParams {
  page?: number;
  page_size?: number;
  search?: string;
}

const api = apiClient;
const lookupAPI = API.lookup;

export async function getCurrencyList(params: SearchApiParams = {}): Promise<any[]> {
  const resp = await api.get(lookupAPI.currencylistsearch, { params });
  return resp.data?.data || [];
}