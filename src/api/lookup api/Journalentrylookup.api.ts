import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;
const lookupAPI = API.lookup;

/* ===========================================================
   CUSTOMER / SUPPLIER LISTS
=========================================================== */

export const getCustomerListJe = async (): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getCustomers);
  return response.data;
};

export const getSupplierList = async (): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getSuppliers);
  return response.data;
};

/* ===========================================================
   CURRENCY EXCHANGE
   ---------------------------------------------------------
   lookupAPI.getCurrency points at:
     erpnext.setup.utils.get_exchange_rate
   which takes (transaction_date, from_currency, to_currency, args)
   and returns a SINGLE float in `message` — not a list, and no
   date is echoed back (the endpoint just resolves "the rate for
   this date" using ERPNext's own internal logic).
=========================================================== */

export interface ExchangeRateResult {
  message?: number;
}

/**
 * Fetch the exchange rate for a currency pair on a given date.
 * Returns null if no rate could be resolved.
 */
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