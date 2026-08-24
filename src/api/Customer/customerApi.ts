import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";


const api = apiClient;

const CUSTOMER_ENDPOINTS = {

  get: API.customer.list,
  // Not confirmed yet — backend not ready.
  create: "TODO_ADD_API_CUSTOMER_CREATE",
  update: "TODO_ADD_API_CUSTOMER_UPDATE",
  delete: "TODO_ADD_API_CUSTOMER_DELETE",
   getById: API.customer.getById, 
};

/* ───────────────── Types — matches the confirmed Postman response exactly ───────────────── */

export interface CustomerRaw {
  name: string; // Frappe doc name / customer number, e.g. "Ackim Chisha - 1"
  customer_name: string;
  customer_type: "Individual" | "Company";
  customer_group: string;
  territory: string;
  email_id: string;
  mobile_no: string;
  status: string; // e.g. "active"
}

export interface CustomerPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CustomerApiResponse {
  status_code: number;
  status: string;
  message: string;
  data: CustomerRaw[];
  pagination: CustomerPagination;
}

export interface GetCustomersParams {
  search?: string;
 status?: string;
  page?: number;
  page_size?: number;
  customer_type?: string;
}

export interface CustomerContact {
  name: string;
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_no: string;
  is_primary_contact: 0 | 1;
  is_billing_contact: 0 | 1;
}

export interface CustomerDetailRaw {
  name: string;
  customer_name: string;
  customer_type: "Individual" | "Company";
  customer_group: string;
  territory: string;
  email_id: string;
  mobile_no: string;
  status: string;
  gender: string | null;
  industry: string | null;
  primary_address: string | null;
  contacts: CustomerContact[];
}

interface GetCustomerByIdEnvelope {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: CustomerDetailRaw;
  };
}

/* ───────────────── GET LIST ───────────────── */
export const getCustomers = async (
  params?: GetCustomersParams
): Promise<CustomerApiResponse> => {
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;
  if (params?.status) cleanParams.status = params.status; 
 if (params?.customer_type) cleanParams.customer_type = params.customer_type;
  const response: AxiosResponse<CustomerApiResponse> = await api.get(
    CUSTOMER_ENDPOINTS.get,
    { params: cleanParams }
  );
  return response.data;
};

export interface CustomerPayload {
  customer_type: "Individual" | "Company";
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  preferred_name?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  occupation?: string;
  industry?: string;
  employer?: string;
  company_name?: string;
  registration_number?: string;
}

export interface CustomerRecord extends CustomerPayload {
  name: string;
}

export async function createCustomer(
  payload: CustomerPayload
): Promise<CustomerRecord> {
  const response: AxiosResponse = await api.post(CUSTOMER_ENDPOINTS.create, payload);
  return response.data;
}

export async function updateCustomer(
  customerId: string,
  payload: Partial<CustomerPayload>
): Promise<CustomerRecord> {
  const response: AxiosResponse = await api.post(CUSTOMER_ENDPOINTS.update, {
    name: customerId,
    ...payload,
  });
  return response.data;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await api.post(CUSTOMER_ENDPOINTS.delete, { name: customerId });
}


export async function getCustomerById(id: string): Promise<CustomerDetailRaw> {
  const response: AxiosResponse<GetCustomerByIdEnvelope> = await api.get(
    CUSTOMER_ENDPOINTS.getById,
    { params: { id } }
  );
  return response.data.message.data;
}