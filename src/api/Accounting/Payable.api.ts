import type { AxiosResponse } from "axios";
import apiClient from "../../config/axios";
import { API } from "../../config/api";

const api = apiClient;


export type PayableVoucherType = "Purchase Invoice" | "Payment Entry" | "Journal Entry" | "Expense Claim";
export type PayableStatus = "Pending" | "Overdue" | "Paid";

export interface PayableRow {
  id: string;
  isSummary: boolean;
  billNo: string;
  vendor: string;
  voucherType: PayableVoucherType | "";
  costCenter?: string;
  currency: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  postingDate?: string;
  dueDate?: string;
  age: number;
  status: PayableStatus | "";
  overdue: boolean;
}

export interface AgeingSummary {
  "0_30": number;
  "31_60": number;
  "61_90": number;
  "91_120": number;
  "121_above": number;
}

export interface PayableKPIs {
  total_outstanding: number;
  total_invoiced: number;
  total_paid: number;
  total_suppliers: number;
  overdue_amount: number;
  average_payment_days: number;
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

interface PayableData {
  kpis: PayableKPIs;
  data: any[];
  pagination: {
    page: number;
    page_size: number;
    total_items?: number;
    items_in_page?: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface PayableEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: PayableData;
}

interface PayableApiResponse {
  message: PayableEnvelope;
}

export interface PayableResponse {
  kpis: PayableKPIs;
  rows: PayableRow[];
  pagination: Pagination;
}

export interface PayableFilters {
  search?: string;
  status?: PayableStatus | "all";
  postingDate?: string;
  voucherType?: PayableVoucherType | "";
  costCenter?: string;
  payableAccount?: string;
  suppliers?: string[];
  groupBy?: string[];
}

export const VOUCHER_TYPE_OPTIONS: PayableVoucherType[] = [
  "Purchase Invoice",
  "Payment Entry",
  "Journal Entry",
  "Expense Claim",
];



function computeRow(row: any, index: number): PayableRow {
  const isSummary = !row.voucher_no;
  const outstanding = row.amounts?.outstanding ?? row.outstanding ?? 0;

  let status: PayableStatus | "" = "";
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
    billNo: row.bill_no || "-",
    vendor: row.supplier || row.party || row.supplier_name || (isSummary ? "" : "Unknown"),
    voucherType: (row.voucher_type as PayableVoucherType) || "",
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



export async function fetchPayables(
  filters: PayableFilters,
  page: number,
  pageSize: number,
): Promise<PayableResponse> {
  const params = {
    page,
    page_size: pageSize,
    search: filters.search || undefined,
    status: filters.status && filters.status !== "all" ? filters.status : undefined,
    posting_date: filters.postingDate || undefined,
    cost_center: filters.costCenter || undefined,
    party: filters.suppliers?.length ? filters.suppliers.join(",") : undefined,
    payable_account: filters.payableAccount || undefined,
    group_by: filters.groupBy?.length ? filters.groupBy.join(",") : undefined,
    voucher_type: filters.voucherType || undefined,
  };

  const response: AxiosResponse<PayableApiResponse> = await api.get(
    API.Accounting.payable.getAllPayables,
    { params }
  );

  const payload = response.data.message.data;
  const rawRows = payload.data || [];   // ← "data" key, not "rows"
  const rows = rawRows.map((r: any, i: number) => computeRow(r, i));

  const pag = payload.pagination || ({} as PayableData["pagination"]);

  return {
    kpis: payload.kpis,
    rows,
    pagination: {
      page: pag.page ?? page,
      page_size: pag.page_size ?? pageSize,
      total_entries: pag.total_items ?? rows.length,
      total_pages: pag.total_pages ?? 1,
      has_next: pag.has_next ?? false,
      has_prev: pag.has_previous ?? page > 1,   
    },
  };
}



export interface SelectOption {
  value: string;
  label: string;
}

export async function fetchSupplierOptions(): Promise<SelectOption[]> {
  const response = await api.get(API.lookup.getSuppliers);
  const list = response.data?.data ?? [];
  return list.map((s: any) => ({ value: String(s.value), label: String(s.label) }));
}

export async function fetchCostCenterOptions(): Promise<SelectOption[]> {
  const response = await api.get(API.lookup.getCostCenters);
  const list = response.data?.data ?? [];
  return list.map((c: any) => ({ value: String(c.value), label: String(c.label) }));
}

export async function fetchPayableAccountOptions(): Promise<SelectOption[]> {
  const response = await api.get(API.lookup.getPayableAccounts);
  const list = response.data?.data ?? [];
  return list.map((a: any) => ({ value: String(a.value), label: String(a.label) }));
}