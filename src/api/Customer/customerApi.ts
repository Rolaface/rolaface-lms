import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";


const api = apiClient;

const CUSTOMER_ENDPOINTS = {

  get: API.customer.list,
  // Not confirmed yet — backend not ready.
  create:API.customer.create,
  update: API.customer.update,
  delete: API.customer.delete,
   getById: API.customer.getById, 
  getCustomerGroups: API.customer.getCustomerGroups,

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
  salutation?: string | null;
  designation?: string | null;
  email_id: string;
  mobile_no: string;
  is_primary_contact: 0 | 1;
  is_billing_contact: 0 | 1;
}

export interface CustomerAddress {
  name: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_primary_address: 0 | 1;
  is_shipping_address: 0 | 1;
}

// Mirrors backend CHILD_TABLE_FIELDS["basic_details"] (customer_api/constant.py).
export interface CustomerBasicDetails {
  name: string;
  date_of_birth: string | null;
  marital_status: string | null;
  nationality: string | null;
  is_staff_customer: 0 | 1;
  staff_id: string | null;
  occupation: string | null;
  education_level: string | null;
  employment_type: string | null;
  industry_type: string | null;
  employer_name: string | null;
  source_of_income: string | null;
  monthly_income: number;
  annual_income: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  existing_monthly_obligations: number;
  annual_revenue: number;
  number_of_employees: number;
}

// Mirrors backend CHILD_TABLE_FIELDS["extended_details"] — superset of
// basic_details that also carries NRC/national id + company registration
// fields (neither of which basic_details accepts — confirmed from
// customer_api/constant.py CHILD_TABLE_FIELDS).
export interface CustomerExtendedDetails {
  name: string;
  national_identification_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  nationality: string | null;
  is_staff_customer: 0 | 1;
  staff_id: string | null;
  occupation: string | null;
  registered_company_name: string | null;
  registration_number: string | null;
  incorporation_date: string | null;
  education_level: string | null;
  employment_type: string | null;
  industry_type: string | null;
  employer_name: string | null;
  source_of_income: string | null;
  monthly_income: number;
  annual_income: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  existing_monthly_obligations: number;
  annual_revenue: number;
  number_of_employees: number;
}

// Mirrors backend CHILD_TABLE_FIELDS["next_of_kin"].
export interface CustomerNextOfKin {
  name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  relationship: string | null;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  district: string;
  state: string | null;
  country: string;
  postal_code: string;
}

// Mirrors backend CHILD_TABLE_FIELDS["stakeholders"].
export interface CustomerStakeholder {
  name: string;
  stakeholder_name: string;
  stakeholder_role: string;
  ownership_percentage: number;
}

// Mirrors backend CHILD_TABLE_FIELDS["documents"].
export interface CustomerDocumentRecord {
  name: string;
  document_type: string;
  document_name: string;
  document_number: string;
  issue_date: string | null;
  expiry_date: string | null;
  verification_status: string;
  issuing_authority: string | null;
  place_of_issue: string | null;
  document_upload: string | null;
  issuing_country: string | null;
}

export interface CustomerDetailRaw {
  mobile_no: string;
  so_required?: 0 | 1;
  lead_name?: string | null;
  naming_series?: string;
  customer_details?: string | null;
  image?: string | null;
   creation?: string;    
  modified?: string; 
  tax_withholding_category?: string | null;
  industry: string | null;
  name: string;
  customer_name: string;
  customer_type: "Individual" | "Company";
  customer_group: string;
  territory: string;
  email_id: string;
  tax_id: string;
  default_currency: string | null;
  first_name: string;
  last_name: string;
  customer_primary_address: string | null;
  customer_primary_contact: string | null;
  is_npa: 0 | 1;
  status: string;
  gender: string | null;
  primary_address: string | null;
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
  // NOTE: previously missing from this type even though the backend always
  // returns them (confirmed against customer_api/service.py get_customer_by_id
  // + TABLE_MAPPING) — edit-mode population silently dropped this data
  // because TS never surfaced it. Backend key is `relationship_manager`
  // (FIELD_MAPPING translates `account_manager` <-> `relationship_manager`),
  // not `account_manager`.
  relationship_manager: string | null;
  relationship_manager_name: string | null;
  basic_details: CustomerBasicDetails[];
  extended_details: CustomerExtendedDetails[];
  next_of_kin: CustomerNextOfKin[];
  stakeholders: CustomerStakeholder[];
  documents: CustomerDocumentRecord[];
}

interface GetCustomerByIdEnvelope {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: CustomerDetailRaw;
  };
}

export interface CustomerGroup {
  name: string;
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

/* ───────────────── Create payload — confirmed request body shape (2026-09-04) ─────────────────
   Two shapes depending on customer_type. Shared sub-shapes first. */

export interface CustomerAddressPayload {
  name?: string; // present on update = patch existing Address; absent = insert new
  address_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  is_primary_address: 0 | 1;
  is_shipping_address: 0 | 1;
}

export interface CustomerContactPayload {
  name?: string; // present on update = patch existing Contact; absent = insert new
  first_name: string;
  last_name: string;
  salutation?: string | null;
  designation?: string;
  email_id: string;
  mobile_no: string;
  is_primary_contact: 0 | 1;
  is_billing_contact: 0 | 1;
}

export interface CustomerDocumentPayload {
  document_type: string;
  document_name: string;
  document_number: string;
  issue_date: string;
  expiry_date?: string;
  verification_status: string;
  issuing_authority: string;
  issuing_country: string;
}

export interface IndividualBasicDetails {
  gender: string | null;
  date_of_birth: string;
  marital_status: string | null;
  nationality: string | null;
  is_staff_customer: 0 | 1;
  staff_id?: string | null;
  occupation: string;
  education_level: string | null;
  employment_type: string | null;
  industry_type: string | null;
  employer_name: string;
  source_of_income: string | null;
  monthly_income: number;
  annual_income: number;
  total_assets: number;
  total_liabilities: number;
  existing_monthly_obligations: number;
}

// Sent alongside basic_details — backend's basic_details child table does
// NOT accept `national_identification_number` (see CHILD_TABLE_FIELDS in
// customer_api/constant.py), only extended_details does. Kept as an
// additive record so NRC actually gets saved.
export interface IndividualExtendedDetails {
  national_identification_number: string;
  gender: string | null;
  date_of_birth: string;
  marital_status: string | null;
  nationality: string | null;
  is_staff_customer: 0 | 1;
  staff_id?: string | null;
  occupation: string;
  education_level: string | null;
  employment_type: string | null;
  industry_type: string | null;
  employer_name: string;
  source_of_income: string | null;
  monthly_income: number;
  annual_income: number;
  total_assets: number;
  total_liabilities: number;
  existing_monthly_obligations: number;
}

export interface IndividualNextOfKinPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  relationship: string | null;
  phone: string;
  address_line_1: string;
  district: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface IndividualCustomerPayload {
  customer_name: string;
  customer_type: "Individual";
  customer_group: string;
  territory: string;
  // Top-level customer field — required here because backend's
  // basic_details child table does not include `gender`, so sending it
  // only inside basic_details silently drops it. Kept inside
  // basic_details too (unused by backend, harmless) so nothing here
  // removes data that was already being collected.
  gender: string | null;
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_no: string;
  tax_id: string;
  default_currency: string;
  is_npa: 0 | 1;
  // Backend maps this to `account_manager` (see FIELD_MAPPING).
  relationship_manager?: string;
  basic_details: [IndividualBasicDetails];
  extended_details: [IndividualExtendedDetails];
  addresses: CustomerAddressPayload[];
  contacts: CustomerContactPayload[];
  next_of_kin: IndividualNextOfKinPayload[];
  documents: CustomerDocumentPayload[];
}

// Company has no basic_details entry — CHILD_TABLE_FIELDS["basic_details"]
// doesn't contain registered_company_name / registration_number /
// incorporation_date, so sending it there silently drops those 3 fields.
// extended_details is the only table that accepts them.
export interface CompanyExtendedDetails {
  registered_company_name: string;
  registration_number: string;
  incorporation_date: string;
  number_of_employees: number;
  annual_revenue: number;
  total_assets: number;
  total_liabilities: number;
  existing_monthly_obligations: number;
}

export interface CompanyStakeholderPayload {
  stakeholder_name: string;
  stakeholder_role: string;
  ownership_percentage: number;
}

export interface CompanyCustomerPayload {
  customer_name: string;
  customer_type: "Company";
  customer_group: string;
  territory: string;
  email_id: string;
  mobile_no: string;
  tax_id: string;
  default_currency: string;
  industry: string;
  is_npa: 0 | 1;
  // Backend maps this to `account_manager` (see FIELD_MAPPING).
  relationship_manager?: string;
  extended_details: [CompanyExtendedDetails];
  addresses: CustomerAddressPayload[];
  contacts: CustomerContactPayload[];
  stakeholders: CompanyStakeholderPayload[];
  documents: CustomerDocumentPayload[];
}

export type CustomerCreatePayload =
  | IndividualCustomerPayload
  | CompanyCustomerPayload;

export interface CustomerRecord {
  name: string;
  customer_name: string;
  customer_type: "Individual" | "Company";
}

// Backend wraps every whitelisted-method response in Frappe's default
// `{ message: { status_code, status, message, data } }` envelope — same
// shape getCustomerById already unwraps below. create/update/delete were
// returning `response.data` (the raw envelope) typed as CustomerRecord,
// so `result.name` was always undefined post-create. Unwrapped to match.
interface MutationEnvelope<T> {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: T;
  };
}

export async function createCustomer(
  payload: CustomerCreatePayload
): Promise<CustomerRecord> {
  const response: AxiosResponse<MutationEnvelope<CustomerRecord>> =
    await api.post(CUSTOMER_ENDPOINTS.create, payload);
  return response.data.message.data;
}

export async function updateCustomer(
  customerId: string,
  payload: Partial<CustomerCreatePayload>
): Promise<CustomerRecord> {
  // FIX: backend route is `@frappe.whitelist(methods=["PUT", "PATCH"])` and
  // reads the id via `id=None` kwarg / `?id=` query param — it never reads
  // `id`/`name` from the JSON body. The old code sent this as a POST with
  // `{ name: customerId, ...payload }` in the body, which Frappe rejected
  // with 403 "Not permitted" before the request even reached update_customer(),
  // and even if the method matched, customer_id would still have come back
  // empty. Use PUT with the id as a query param instead.
  const response: AxiosResponse<MutationEnvelope<CustomerRecord>> =
    await api.put(
      `${CUSTOMER_ENDPOINTS.update}?id=${encodeURIComponent(customerId)}`,
      payload
    );
  return response.data.message.data;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  // FIX: backend route is `@frappe.whitelist(methods=["DELETE"])` and reads
  // `id` via `id=None` kwarg / `?id=` query param (customer_api/routes.py
  // delete_customer) — same class of bug as the updateCustomer fix above.
  // POSTing `{ name: customerId }` would be rejected before reaching the
  // handler.
  await api.delete(CUSTOMER_ENDPOINTS.delete, {
    params: { id: customerId },
  });
}


export async function getCustomerById(id: string): Promise<CustomerDetailRaw> {
  const response: AxiosResponse<GetCustomerByIdEnvelope> = await api.get(
    CUSTOMER_ENDPOINTS.getById,
    { params: { id } }
  );
  return response.data.message.data;
}


export async function getCustomerGroups(): Promise<CustomerGroup[]> {
  const response: AxiosResponse<{ data: CustomerGroup[] }> = await api.get(
    CUSTOMER_ENDPOINTS.getCustomerGroups
  );

  return response.data.data;
}