import api from "../../config/axios";
import { API } from "../../config/api";
import type { AxiosResponse } from "axios";

export const PreScreeningEndpoints = {
  create: API.losPreScreening.create,
  getAll: API.losPreScreening.getAll,
  delete: API.losPreScreening.delete,
  update: API.losPreScreening.update,
  getById: API.losPreScreening.getById,
  getFields: API.losPreScreening.getFields,
  getVersions: API.losPreScreening.getVersions,
  setStatus: API.losPreScreening.setStatus,
  test: API.losPreScreening.test,
};

export interface CreateRuleSetPayload {
  ruleset_name: string;
  loan_product: string;
  description?: string;
  effective_from?: string; // YYYY-MM-DD
  effective_to?: string; // YYYY-MM-DD
  groups?: any[];
}

// POST (swagger: POST create_ruleset)
export const create = async (payload: CreateRuleSetPayload): Promise<any> => {
  const response: AxiosResponse<any> = await api.post(PreScreeningEndpoints.create, payload);
  return response.data;
};

export interface GetRuleSetsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  loan_product?: string;
}

export const getAll = async (params?: GetRuleSetsParams): Promise<any> => {
  const response: AxiosResponse<any> = await api.get(PreScreeningEndpoints.getAll, { params });
  return response.data;
};

export const remove = async (id: string): Promise<any> => {
  const response: AxiosResponse<any> = await api.delete(PreScreeningEndpoints.delete, {
    params: { id },
  });
  return response.data;
};

export interface UpdateRuleSetPayload {
  ruleset_name?: string;
  description?: string;
  effective_from?: string;
  effective_to?: string;
  groups?: any[];
}

export const update = async (id: string, payload: UpdateRuleSetPayload): Promise<any> => {
  const response: AxiosResponse<any> = await api.put(PreScreeningEndpoints.update, payload, {
    params: { id },
  });
  return response.data;
};

export const getById = async (id: string, version?: string): Promise<any> => {
  const params: any = { id };
  if (version) params.version = version;

  const response: AxiosResponse<any> = await api.get(PreScreeningEndpoints.getById, { params });
  return response.data;
};

export const getFields = async (): Promise<any> => {
  const response: AxiosResponse<any> = await api.get(PreScreeningEndpoints.getFields);
  return response.data;
};

export const getVersions = async (loan_product: string): Promise<any> => {
  const response: AxiosResponse<any> = await api.get(PreScreeningEndpoints.getVersions, {
    params: { loan_product },
  });
  return response.data;
};

export const setStatus = async (id: string, status: string): Promise<any> => {
  const response: AxiosResponse<any> = await api.put(
    PreScreeningEndpoints.setStatus,
    { status },
    { params: { id } }
  );
  return response.data;
};

export const test = async (id: string, payload: any): Promise<any> => {
  const response: AxiosResponse<any> = await api.post(PreScreeningEndpoints.test, payload, {
    params: { id },
  });
  return response.data;
};