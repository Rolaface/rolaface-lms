import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;
const lookupAPI = API.lookup;



export const getCustomerListJe = async (): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getCustomers);
  return response.data;
};

export const getSupplierList = async (): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getSuppliers);
  return response.data;
};



export interface ExchangeRateResult {
  message?: number;
}


export const getExchangeRateFor = async (
  fromCurrency: string,
  toCurrency: string,
  date: string,
  args: "for_buying" | "for_selling" = "for_buying"
): Promise<number | null> => {
  const params = {
    transaction_date: date,
    from_currency: fromCurrency,
    to_currency: toCurrency,
    args,
  };

  const response: AxiosResponse = await api.get(lookupAPI.getCurrency, { params });
  const data = response.data as ExchangeRateResult;
  const rate = data?.message;

  if (rate && Number(rate) > 0) {
    return Number(rate);
  }
  return null;
};