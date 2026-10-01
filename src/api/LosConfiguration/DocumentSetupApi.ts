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

export const DocumentSetupApi = {
  create: async (payload: DocumentSetupPayload): Promise<any> => {
    const response: AxiosResponse<any> = await api.post(Endpoints.create, payload);
    return response.data;
  },
  
  getAll: async (page = 1, page_size = 20): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(Endpoints.getAll, {
      params: { page, page_size },
    });
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

  // Helpers expected by the UI
  unwrapList: (res: any): any[] => {
    return res?.data || res?.message?.data || [];
  },
  
  unwrap: (res: any): any => {
    return res?.data || res?.message?.data || res?.message || {};
  },

  getProductsWithoutDocuments: async (): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(Endpoints.getProductsWithoutDocuments);
    return response.data;
  }
};
