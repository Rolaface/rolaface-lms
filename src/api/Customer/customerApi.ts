import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { getCustomerList } from "../lookup api/lookUpApi"; // list/search already exists — reused, not duplicated

const api = apiClient;

/* ───────────────── Types ───────────────── */
// TODO: refine against real backend response once available.
export interface CustomerPayload {
  customer_type: "Individual" | "Business";
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
  name: string; // Frappe doc name / customer number
}

/* ───────────────────────────────────────────────────────────────
   API.customer currently only has `getAllCustomers`. create / update /
   delete / getById DON'T exist in api.ts yet — backend not ready.
   Placeholder strings below just so TS doesn't break. Swap for the
   real API.customer.xxx key once it's added there.
   ─────────────────────────────────────────────────────────────── */
const CUSTOMER_ENDPOINTS = {
  create: "TODO_ADD_API_CUSTOMER_CREATE",
  update: "TODO_ADD_API_CUSTOMER_UPDATE",
  delete: "TODO_ADD_API_CUSTOMER_DELETE",
  getById: "TODO_ADD_API_CUSTOMER_GET_BY_ID",
};

/* ───────────────── CRUD (backend not ready — scaffold only) ───────────────── */

export async function createCustomer(
  payload: CustomerPayload,
): Promise<CustomerRecord> {
  // TODO: backend endpoint not ready — confirm path + verb once added to api.ts
  const response: AxiosResponse = await api.post(CUSTOMER_ENDPOINTS.create, payload);
  return response.data;
}

export async function updateCustomer(
  customerId: string,
  payload: Partial<CustomerPayload>,
): Promise<CustomerRecord> {
  // TODO: backend endpoint not ready
  const response: AxiosResponse = await api.post(CUSTOMER_ENDPOINTS.update, {
    name: customerId,
    ...payload,
  });
  return response.data;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  // TODO: backend endpoint not ready
  await api.post(CUSTOMER_ENDPOINTS.delete, { name: customerId });
}

export async function getCustomerById(
  customerId: string,
): Promise<CustomerRecord | null> {
  // TODO: backend endpoint not ready
  const response: AxiosResponse = await api.get(CUSTOMER_ENDPOINTS.getById, {
    params: { name: customerId },
  });
  return response.data ?? null;
}

/* ───────────────── Duplicate checks — reuse existing getCustomerList, no new endpoint ───────────────── */

export async function checkDuplicateMobile(mobile: string): Promise<any> {
  // TODO: confirm backend supports `mobile` as a filter param on get_customers
  return getCustomerList({ mobile });
}

export async function checkDuplicateDocument(docNumber: string): Promise<any> {
  // TODO: confirm backend supports `doc_number` as a filter param
  return getCustomerList({ doc_number: docNumber });
}