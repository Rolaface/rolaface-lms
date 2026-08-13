import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;
export const JournalEntryAPI = API.Accounting.journalEntry;



/* ===========================================================
   TYPES
=========================================================== */

export interface JournalEntry {
  name: string;
  posting_date: string;
  total_debit: number;
  total_credit: number;
  docstatus: 0 | 1 | 2; // 0 Draft, 1 Submitted, 2 Cancelled
  user_remark?: string;
}

export interface JournalEntryPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface JournalEntryListResponse {
  status_code?: number;
  status?: string;
  message?: string;
  data: JournalEntry[];
  pagination?: JournalEntryPagination;
}

export interface CommonApiResponse {
  status_code?: number;
  status?: string;
  message?: string;
}

export interface FetchJournalEntriesParams {
  search?: string;
  fromDate?: string;
  toDate?: string;
  orderBy?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface FetchJournalEntriesResult {
  data: JournalEntry[];
  total: number;
}


export interface JournalEntryAccountPayload {
  name?: string;
  account: string;
  account_currency?: string;
  exchange_rate?: number;
  debit_in_account_currency?: number;
  credit_in_account_currency?: number;
  party_type?: string;
  party?: string;
  user_remark?: string;
}


export interface JournalEntryPayload {
  posting_date: string;
  voucher_type: string;
  is_opening?: "Yes" | "No";
  user_remark?: string;
  cheque_no?: string;
  cheque_date?: string;
  multi_currency?: number;
  accounts: JournalEntryAccountPayload[];
}

const FIELDS = [
  "name",
  "posting_date",
  "total_debit",
  "total_credit",
  "docstatus",
  "user_remark",
];



export const fetchJournalEntries = async (
  params: FetchJournalEntriesParams = {}
): Promise<FetchJournalEntriesResult> => {
  const {
    search,
    fromDate,
    toDate,
    orderBy = "creation desc",
    pageIndex = 0,
    pageSize = 10,
  } = params;

  const filters: any[][] = [];
  if (fromDate && toDate) {
    const filterField = orderBy.startsWith("posting_date") ? "posting_date" : "creation";
    if (filterField === "creation") {
      filters.push([filterField, ">=", `${fromDate} 00:00:00`]);
      filters.push([filterField, "<=", `${toDate} 23:59:59`]);
    } else {
      filters.push([filterField, ">=", fromDate]);
      filters.push([filterField, "<=", toDate]);
    }
  }

  const limitStart = pageIndex * pageSize;

  const searchParams = new URLSearchParams();
  searchParams.set("fields", JSON.stringify(FIELDS));
  searchParams.set("limit_start", String(limitStart));
  searchParams.set("limit_page_length", String(pageSize));
  if (search) searchParams.set("search", search);
  if (orderBy) searchParams.set("order_by", orderBy);
  if (filters.length > 0) searchParams.set("filters", JSON.stringify(filters));

  const response: AxiosResponse<JournalEntryListResponse> = await api.get(
    `${JournalEntryAPI.getAll}?${searchParams.toString()}`
  );

  const res = response.data as any;
  const data: JournalEntry[] = res?.data || res?.message?.data || [];
  const pagination: JournalEntryPagination | undefined =
    res?.pagination || res?.message?.pagination;

  return {
    data: Array.isArray(data) ? data : [],
    total: pagination?.total ?? data.length,
  };
};



export const getJournalEntryById = async (id: string): Promise<any> => {
  const url = `${JournalEntryAPI.getById}/${encodeURIComponent(id)}`;
  const response: AxiosResponse = await api.get(url);
  return response.data;
};


export const createJournalEntry = async (
  payload: JournalEntryPayload
): Promise<any> => {
  const response: AxiosResponse = await api.post(JournalEntryAPI.create, payload);
  return response.data;
};



export const updateJournalEntryById = async (
  id: string,
  payload: Partial<JournalEntryPayload>
): Promise<any> => {
  const url = `${JournalEntryAPI.update}/${encodeURIComponent(id)}`;
  const response: AxiosResponse = await api.put(url, payload);
  return response.data;
};



export const submitJournalEntry = async (name: string): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.patch(
    JournalEntryAPI.updateStatus,
    { id: name, action: "approved" }
  );
  return response.data;
};

export const cancelJournalEntry = async (name: string): Promise<CommonApiResponse> => {
  const response: AxiosResponse<CommonApiResponse> = await api.patch(
    JournalEntryAPI.updateStatus,
    { id: name, action: "cancelled" }
  );
  return response.data;
};

/* ===========================================================
   DELETE
=========================================================== */

export const deleteJournalEntry = async (name: string): Promise<CommonApiResponse> => {
  const url = `${JournalEntryAPI.delete}/${encodeURIComponent(name)}`;
  const response: AxiosResponse<CommonApiResponse> = await api.delete(url);
  return response.data;
};



export const getComponentById = async (
  id: string,
  fields?: string[],
  filters?: any[][],
  orderBy?: string
): Promise<any> => {
  const url = `${JournalEntryAPI.getByIdOnly}/${encodeURIComponent(id)}`;
  const params: Record<string, any> = { limit_page_length: 0 };

  if (fields) params.fields = JSON.stringify(fields);
  if (filters) params.filters = JSON.stringify(filters);
  if (orderBy) params.order_by = orderBy;

  const response: AxiosResponse = await api.get(url, { params });
  return response.data;
};