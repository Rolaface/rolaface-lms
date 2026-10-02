import api from "../../config/axios";
import { API } from "../../config/api";
import type { AxiosResponse } from "axios";

const Endpoints = API.losDocumentSetup;

export interface DocumentSetupPayload {
  loan_product: string;
  documents: {
    document_name: string;
    is_required: number;
  }[];
}

export interface DocumentSetupPagination {
  total: number;
  total_pages: number;
  page?: number;
  page_size?: number;
}

export const DocumentSetupApi = {
  create: async (payload: DocumentSetupPayload): Promise<any> => {
    const response: AxiosResponse<any> = await api.post(Endpoints.create, payload);
    return response.data;
  },

  // Paginated list. `search` is optional and only sent when non-empty,
  // so existing callers getAll(page, pageSize) keep working.
  getAll: async (page = 1, page_size = 20, search?: string): Promise<any> => {
    const params: Record<string, any> = { page, page_size };
    if (search && search.trim()) params.search = search.trim();
    const response: AxiosResponse<any> = await api.get(Endpoints.getAll, { params });
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(Endpoints.getById, {
      params: { id },
    });
    return response.data;
  },

  update: async (id: string, payload: DocumentSetupPayload): Promise<any> => {
    const response: AxiosResponse<any> = await api.put(Endpoints.update, payload, {
      params: { id },
    });
    return response.data;
  },

  remove: async (id: string): Promise<any> => {
    const response: AxiosResponse<any> = await api.delete(Endpoints.delete, {
      params: { id },
    });
    return response.data;
  },

  getProductsWithoutDocuments: async (): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(Endpoints.getProductsWithoutDocuments);
    return response.data;
  },

  // ---- Helpers expected by the UI -----------------------------------------
  unwrapList: (res: any): any[] => {
    const list = res?.data ?? res?.message?.data ?? res?.message ?? res;
    return Array.isArray(list) ? list : [];
  },

  unwrap: (res: any): any => {
    return res?.data || res?.message?.data || res?.message || {};
  },


  unwrapPagination: (res: any): DocumentSetupPagination | null => {
    const p = res?.pagination ?? res?.message?.pagination ?? null;
    if (!p || typeof p.total !== "number") return null;
    return p as DocumentSetupPagination;
  },
};