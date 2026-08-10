import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";
import { formatAmount as formatAmountShared } from "../../store/currencyStore";


const api = apiClient;

/* ===========================================================
   TYPES — matches real Accounts Receivable response
=========================================================== */

export type ReceivableVoucherType = "Sales Invoice" | "Payment Entry" | "Journal Entry";
export type ReceivableStatus = "Pending" | "Overdue" | "Paid";

export interface ReceivableRow {
  id: string;
  isSummary: boolean;
  customer: string;
  voucherType: ReceivableVoucherType | "";
  costCenter?: string;
  currency: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  postingDate?: string;
  dueDate?: string;
  age: number;
  status: ReceivableStatus | "";
  overdue: boolean;
}

export interface AgeingSummary {
  "0_30": number;
  "31_60": number;
  "61_90": number;
  "91_120": number;
  "121_above": number;
}

export interface ReceivableKPIs {
  total_outstanding: number;
  total_invoiced: number;
  total_paid: number;
  total_customers: number;
  overdue_amount: number;
  average_collection_days: number;
  ageing_summary: AgeingSummary;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ReceivableData {
  kpis: ReceivableKPIs;
  rows: any[];
  pagination: {
    page: number;
    page_size: number;
    total_items?: number;
    total_entries?: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface ReceivableEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: ReceivableData;
}

interface ReceivableApiResponse {
  message: ReceivableEnvelope;
}

export interface ReceivableResponse {
  kpis: ReceivableKPIs;
  rows: ReceivableRow[];
  pagination: Pagination;
}

export interface ReceivableFilters {
  search?: string;
  status?: ReceivableStatus | "all";
  postingDate?: string;
  voucherType?: ReceivableVoucherType | "";
  costCenter?: string;
  receivableAccount?: string;
  customers?: string[];
  groupBy?: string[];
}

export const VOUCHER_TYPE_OPTIONS: ReceivableVoucherType[] = [
  "Sales Invoice",
  "Payment Entry",
  "Journal Entry",
];

/* ===========================================================
   FORMATTING HELPERS
=========================================================== */


export function formatAmount(currency: string | undefined, amount: number) {
  return formatAmountShared(currency, amount, { withSymbol: true });
}

/* ===========================================================
   ROW MAPPING — backend record -> UI row
=========================================================== */

function computeRow(row: any, index: number): ReceivableRow {
  const isSummary = !row.voucher_no;
  const outstanding = row.amounts?.outstanding ?? row.outstanding ?? 0;

  let status: ReceivableStatus | "" = "";
  let age = 0;
  let overdue = false;
  let dueDate: string | undefined;
  const postingDate: string | undefined = row.posting_date;

  if (!isSummary) {
    if (row.due_date) {
      dueDate = row.due_date;
      const dueDateObj = new Date(String(row.due_date).replace(" ", "T"));
      if (!isNaN(dueDateObj.getTime())) {
        age = Math.abs(Math.ceil((Date.now() - dueDateObj.getTime()) / (1000 * 3600 * 24)));
        overdue = dueDateObj.getTime() < Date.now() && outstanding > 0;
      }
    } else {
      age = Math.abs(row.age || 0);
    }
    status = outstanding <= 0 ? "Paid" : overdue ? "Overdue" : "Pending";
  }

  return {
    id: row.voucher_no || `summary-${index}`,
    isSummary,
    customer: row.customer || row.party || (isSummary ? "" : "Unknown"),
    voucherType: (row.voucher_type as ReceivableVoucherType) || "",
    costCenter: row.cost_center || undefined,
    currency: row.currency || "INR",
    invoicedAmount: row.amounts?.invoiced ?? row.invoiced ?? 0,
    paidAmount: row.amounts?.paid ?? row.paid ?? 0,
    outstandingAmount: outstanding,
    postingDate,
    dueDate,
    age,
    status: row.status || status,
    overdue,
  };
}



/* ===========================================================
   GET ALL RECEIVABLES
=========================================================== */

export async function fetchReceivables(
  filters: ReceivableFilters,
  page: number,
  pageSize: number,
): Promise<ReceivableResponse> {
  const params = {
    page,
    page_size: pageSize,
    search: filters.search || undefined,
    status: filters.status && filters.status !== "all" ? filters.status : undefined,
    posting_date: filters.postingDate || undefined,
    cost_center: filters.costCenter || undefined,
    party: filters.customers?.length ? filters.customers.join(",") : undefined,
    receivable_account: filters.receivableAccount || undefined,
    group_by: filters.groupBy?.length ? filters.groupBy.join(",") : undefined,
    voucher_type: filters.voucherType || undefined,
  };

  const response = await api.get(API.Accounting.receivable.getAllReceivable, { params });

  const payload = response.data.message.data;
  const rawRows = payload.data || [];  // ← "data" key, not "rows"
  const rows = rawRows.map((r: any, i: number) => computeRow(r, i));

  const pag = payload.pagination || {};

  return {
    kpis: payload.kpis,
    rows,
    pagination: {
      page: pag.page ?? page,
      page_size: pag.page_size ?? pageSize,
      total_entries: pag.total_items ?? rows.length,
      total_pages: pag.total_pages ?? 1,
      has_next: pag.has_next ?? false,
      has_prev: pag.has_previous ?? page > 1,   // ← "has_previous" not "has_prev"
    },
  };
}

/* ===========================================================
   DROPDOWN OPTIONS — dynamic from backend (already flat {value, label})
=========================================================== */

export interface SelectOption {
  value: string;
  label: string;
}

export async function fetchCustomerOptions(): Promise<SelectOption[]> {
  const response = await api.get(API.lookup.getCustomers);
  const list = response.data?.data ?? [];
  return list.map((c: any) => ({ value: String(c.value), label: String(c.label) }));
}

export async function fetchCostCenterOptions(): Promise<SelectOption[]> {
  const response = await api.get(API.lookup.getCostCenters);
  const list = response.data?.data ?? [];
  return list.map((c: any) => ({ value: String(c.value), label: String(c.label) }));
}

export async function fetchReceivableAccountOptions(): Promise<SelectOption[]> {
  const response = await api.get(API.lookup.getReceivableAccounts);
  const list = response.data?.data ?? [];
  return list.map((a: any) => ({ value: String(a.value), label: String(a.label) }));
}