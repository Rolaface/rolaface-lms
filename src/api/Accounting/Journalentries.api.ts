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
  pageIndex?: number; // 0-based, used by the UI
  pageSize?: number;
}

export interface FetchJournalEntriesResult {
  data: JournalEntry[];
  total: number;
}

const FIELDS = [
  "name",
  "posting_date",
  "total_debit",
  "total_credit",
  "docstatus",
  "user_remark",
];

/* ===========================================================
   GET ALL (list, with search / date-range / sort / pagination)
=========================================================== */

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

/* ===========================================================
   STATUS ACTIONS (submit / cancel)
=========================================================== */

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