import apiClient from "../../config/axios";
import API from "../../config/api";

export interface Source {
  name?: string;
  channel_name: string;
  is_active: number;
  modified?: string;
}
const extractList = (msg: any): Source[] => {
  if (Array.isArray(msg)) return msg;
  if (!msg || typeof msg !== "object") return [];

  for (const key of ["data", "channels", "items", "list", "records", "message"]) {
    const val = msg[key];
    if (Array.isArray(val)) return val;
    if (val && typeof val === "object") {
      const nested = extractList(val);
      if (nested.length) return nested;
    }
  }
  return [];
};

export interface GetSourcesParams {
  search?: string;
  is_active?: 0 | 1;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const getSources = async (params?: GetSourcesParams): Promise<{ data: Source[], total?: number, total_pages?: number } | Source[]> => {
  const cleanParams: Record<string, any> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.is_active === 0 || params?.is_active === 1) cleanParams.is_active = params.is_active;
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;
  if (params?.sort_by) cleanParams.sort_by = params.sort_by;
  if (params?.sort_order) cleanParams.sort_order = params.sort_order;

  const response = await apiClient.get(API.losChannel.getAll, { params: cleanParams });
  const data = response.data;

  // Custom APIs might return pagination inside message or data
  if (data?.message && typeof data.message === 'object' && !Array.isArray(data.message) && data.message.data) {
    return {
      data: data.message.data,
      total: data.message.total,
      total_pages: data.message.total_pages
    };
  }

  if (data && typeof data === 'object' && !Array.isArray(data) && data.data) {
    return {
      data: data.data,
      total: data.total,
      total_pages: data.total_pages
    };
  }

  // Fallbacks
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.message?.data)) return data.message.data;
  if (Array.isArray(data)) return data;

  return extractList(data);
};

export const getSourceById = async (name: string): Promise<Source> => {
  const response = await apiClient.get(API.losChannel.getById, { params: { id: name } });
  const data = response.data;
  return data?.message?.data || data?.message || data;
};

export const createSource = async (payload: Partial<Source>): Promise<Source> => {
  const { data } = await apiClient.post(API.losChannel.create, payload);
  return data;
};

export const updateSource = async (
  name: string,
  payload: Partial<Source>
): Promise<Source> => {
  const { data } = await apiClient.patch(API.losChannel.update, payload, { params: { id: name } });
  return data;
};

export const disableSource = async (name: string): Promise<any> => {
  const { data } = await apiClient.patch(API.losChannel.disable, {}, { params: { id: name } });
  return data;
};

export const enableSource = async (name: string): Promise<any> => {
  const { data } = await apiClient.patch(API.losChannel.enable, {}, { params: { id: name } });
  return data;
};

export const deleteSource = async (name: string): Promise<any> => {
  const { data } = await apiClient.delete(API.losChannel.delete, { params: { id: name } });
  return data;
};