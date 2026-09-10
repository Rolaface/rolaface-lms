import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;

const CUSTOMER_ENDPOINTS = {
  get: API.customer.list,
  // Not confirmed yet — backend not ready.
  create: API.customer.create,
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

// CORRECTED (2026-09-10) against customer_api/constant.py
// BASIC_DETAILS_FIELDS. This table is the real source of truth for NRC,
// company registration fields, gender, and every financial field for
// BOTH customer types — it was previously missing
// national_identification_number / registered_company_name /
// registration_number / incorporation_date even though the backend
// whitelist has always included them here (they were wrongly assumed to
// live in extended_details instead).
export interface CustomerBasicDetails {
  name: string;
  national_identification_number: string | null;
  registered_company_name: string | null;
  registration_number: string | null;
  incorporation_date: string | null;
  date_of_birth: string | null;
  gender: string | null;
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

// CORRECTED (2026-09-10) against customer_api/constant.py
// EXTENDED_DETAILS_FIELDS. The real whitelist for this table is just
// {name, registration_no, strict_credit_limit, principal_id} — a much
// smaller set than previously modeled here, and none of it is NRC,
// company registration, or financials (those all live in basic_details;
// see CustomerBasicDetails above). Nothing in the current UI collects
// registration_no / strict_credit_limit / principal_id, so this table is
// effectively unused by the customer form right now — kept here only so
// GET responses that include it don't break typing.
export interface CustomerExtendedDetails {
  name: string;
  registration_no: string | null;
  strict_credit_limit: number | null;
  principal_id: string | null;
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
  // Backend key is `relationship_manager`
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

/* ───────────────── Create payload — CORRECTED (2026-09-10) against
   customer_api/constant.py. Two shapes depending on customer_type.
   Shared sub-shapes first. ───────────────── */

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

// CORRECTED — this is now the ONLY child-details table sent on create for
// Individual. Per constant.py BASIC_DETAILS_FIELDS this table accepts
// national_identification_number directly, so there is no need for a
// separate extended_details record just to carry NRC (that assumption
// was wrong — see types.ts header note).
export interface IndividualBasicDetails {
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
  net_worth: number;
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
  // Top-level customer field — required here because basic_details'
  // real whitelist does not include a plain `gender` override at the
  // customer-doc level; ALLOWED_CUSTOMER_FIELDS does have it though, so
  // it's sent here as well as inside basic_details.
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
  addresses: CustomerAddressPayload[];
  contacts: CustomerContactPayload[];
  next_of_kin: IndividualNextOfKinPayload[];
  documents: CustomerDocumentPayload[];
}

// CORRECTED — this is now the ONLY child-details table sent on create for
// Company. Company registration fields (registered_company_name,
// registration_number, incorporation_date) and all financials live in
// BASIC_DETAILS_FIELDS per constant.py, not in the real
// EXTENDED_DETAILS_FIELDS (which is just registration_no /
// strict_credit_limit / principal_id).
export interface CompanyBasicDetails {
  registered_company_name: string;
  registration_number: string;
  incorporation_date: string;
  // FIXED: source_of_income is in constant.py BASIC_DETAILS_FIELDS with
  // no customer_type restriction — it was only ever being sent for
  // Individual, so it was silently missing from every Company create/
  // update payload.
  source_of_income: string | null;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  existing_monthly_obligations: number;
  annual_revenue: number;
  number_of_employees: number;
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
  // FIXED: ALLOWED_CUSTOMER_FIELDS has top-level "industry" for both
  // customer types — confirmed against constant.py. "industry_type" is a
  // *child-table* field (basic_details), a different field entirely;
  // using that name at the top level meant this value was silently
  // dropped on save.
  industry: string;
  is_npa: 0 | 1;
  // Backend maps this to `account_manager` (see FIELD_MAPPING).
  relationship_manager?: string;
  basic_details: [CompanyBasicDetails];
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
  const response: AxiosResponse<MutationEnvelope<CustomerRecord>> =
    await api.put(
      `${CUSTOMER_ENDPOINTS.update}?id=${encodeURIComponent(customerId)}`,
      payload
    );
  return response.data.message.data;
}

export async function deleteCustomer(customerId: string): Promise<void> {
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