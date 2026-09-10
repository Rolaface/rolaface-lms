import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;

const CUSTOMER_ENDPOINTS = {
  get: API.customer.list,

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
  status: string;
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

export interface CustomerExtendedDetails {
  name: string;
  registration_no: string | null;
  strict_credit_limit: number | null;
  principal_id: string | null;
}

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

export interface CustomerStakeholder {
  name: string;
  stakeholder_name: string;
  stakeholder_role: string;
  ownership_percentage: number;
}

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
  params?: GetCustomersParams,
): Promise<CustomerApiResponse> => {
  const cleanParams: Record<string, string | number> = {};
  if (params?.search) cleanParams.search = params.search;
  if (params?.page) cleanParams.page = params.page;
  if (params?.page_size) cleanParams.page_size = params.page_size;
  if (params?.status) cleanParams.status = params.status;
  if (params?.customer_type) cleanParams.customer_type = params.customer_type;
  const response: AxiosResponse<CustomerApiResponse> = await api.get(
    CUSTOMER_ENDPOINTS.get,
    { params: cleanParams },
  );
  return response.data;
};

export interface CustomerAddressPayload {
  name?: string;
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
  document_upload?: string | null;
}

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

  gender: string | null;
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_no: string;
  tax_id: string;
  default_currency: string;
  is_npa: 0 | 1;

  relationship_manager?: string;
  basic_details: [IndividualBasicDetails];
  addresses: CustomerAddressPayload[];
  contacts: CustomerContactPayload[];
  next_of_kin: IndividualNextOfKinPayload[];
  documents: CustomerDocumentPayload[];
}

export interface CompanyBasicDetails {
  registered_company_name: string;
  registration_number: string;
  incorporation_date: string;

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

  industry: string;
  is_npa: 0 | 1;
  relationship_manager?: string;
  basic_details: [CompanyBasicDetails];
  addresses: CustomerAddressPayload[];
  contacts: CustomerContactPayload[];
  stakeholders: CompanyStakeholderPayload[];
  documents: CustomerDocumentPayload[];
}

export type CustomerCreatePayload =
  IndividualCustomerPayload | CompanyCustomerPayload;

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
  payload: CustomerCreatePayload,
): Promise<CustomerRecord> {
  const response: AxiosResponse<MutationEnvelope<CustomerRecord>> =
    await api.post(CUSTOMER_ENDPOINTS.create, payload);
  return response.data.message.data;
}

export async function updateCustomer(
  customerId: string,
  payload: Partial<CustomerCreatePayload>,
): Promise<CustomerRecord> {
  const response: AxiosResponse<MutationEnvelope<CustomerRecord>> =
    await api.put(
      `${CUSTOMER_ENDPOINTS.update}?id=${encodeURIComponent(customerId)}`,
      payload,
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
    { params: { id } },
  );
  return response.data.message.data;
}

export async function getCustomerGroups(): Promise<CustomerGroup[]> {
  const response: AxiosResponse<{ data: CustomerGroup[] }> = await api.get(
    CUSTOMER_ENDPOINTS.getCustomerGroups,
  );

  return response.data.data;
}


export async function uploadCustomerDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("is_private", "1");

  const response: AxiosResponse<{ message?: { file_url?: string } }> =
    await api.post("/api/method/upload_file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

  const fileUrl = response.data?.message?.file_url;
  if (!fileUrl) {
    throw new Error("Upload failed: no file_url returned from server.");
  }
  return fileUrl;
}