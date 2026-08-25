import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;
const lookupAPI = API.lookup;

interface FrappeListParams {
  fields: string[];
  filters?: [string, string, string][];
}

export const getCustomerList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getCustomers, {
    params,
  });
  return response.data;
};

export const getLoanProductList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getLoanProducts, {
    params,
  });
  return response.data;
};

export const getLoanApplicationList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getLoanApplications, {
    params,
  });
  return response.data;
};

export const getCurrencyList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getCurrencies, {
    params,
  });
  return response.data;
};

export const getLoanList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const requestParams = params
    ? {
        ...params,
        ...(Array.isArray(params.applicant)
          ? { applicant: JSON.stringify(params.applicant) }
          : {}),
      }
    : params;

  const response: AxiosResponse = await api.get(lookupAPI.getLoans, {
    params: requestParams,
  });

  return response.data;
};

export const getLoanSecurityTypeList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(
    lookupAPI.getLoanSecurityTypes,
    { params },
  );
  return response.data;
};

export const getLoanCategoryList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getLoanCategory, {
    params,
  });
  return response.data;
};

export const getLoanSecurityList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getLoanSecurities, {
    params,
  });
  return response.data;
};

export const getLoanDisbursementList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(
    lookupAPI.getLoanDisbursements,
    { params },
  );
  return response.data;
};

export const getLoanRepaymentList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getLoanRepayments, {
    params,
  });
  return response.data;
};

export const getLoanPartnerList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getLoanPartners, {
    params,
  });
  return response.data;
};

export const getLoanDemandOffsetOrderList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(
    lookupAPI.getLoanDemandOffsetOrders,
    { params },
  );
  return response.data;
};

export const getAccountList = async (
  params?: Record<string, any>,
): Promise<any> => {
  // params can include { search, page, page_size, root_type, is_group }
  const response: AxiosResponse = await api.get(lookupAPI.getAccounts, {
    params,
  });
  return response.data;
};

export const getItemList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getItems, { params });
  return response.data;
};

export const getLoanClassification = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(
    lookupAPI.get_loan_classification,
    { params },
  );
  return response.data;
};

export const getCountryList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getCountries, {
    params,
  });
  return response.data;
};

export const getGenderList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getGenders, {
    params,
  });
  return response.data;
};

export const getIndustryList = async (
  params?: Record<string, any>,
): Promise<any> => {
  const response: AxiosResponse = await api.get(lookupAPI.getIndustries, {
    params,
  });
  return response.data;
};
