

import type { AxiosResponse } from 'axios';
import apiClient from '../../config/axios';
import { API } from '../../config/api';
import { useCompanyStore } from '../../store/companyStore';
import { formatAmount as formatAmountShared } from '../../store/currencyStore';

const api = apiClient;

/* ───────────────── Types ───────────────── */

export interface LedgerRow {
  gl_entry: string;
  posting_date: string;
  account: string;
  party_type?: string;
  party?: string;
  party_name?: string;
  voucher_type?: string;
  voucher_subtype?: string;
  voucher_no?: string;
  against_account?: string;
  against_voucher_type?: string;
  against_voucher?: string;
  bill_no?: string;
  project?: string;
  cost_center?: string;
  debit: number;
  credit: number;
  balance: number;
  remarks?: string;
  /** true for the synthetic "Opening" / "Total" / "Closing (Opening + Total)" rows */
  is_summary_row?: boolean;
}

export interface ApiColumn {
  label: string;
  fieldname: string;
  fieldtype?: string;
  hidden?: number;
  width?: number;
  options?: string;
  sticky?: boolean;
}

export interface Summary {
  opening: { debit: number; credit: number; balance: number };
  total: { debit: number; credit: number; balance: number };
  closing: { debit: number; credit: number; balance: number };
}

export interface Pagination {
  page: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GLResponse {
  account: string;
  account_currency: string;
  presentation_currency: string;
  company: string;
  summary: Summary;
  columns: ApiColumn[];
  ledger: LedgerRow[];
  pagination: Pagination;
}

export interface GLFilters {
  account: string;
  voucherNo?: string;
  fromDate: string;
  toDate: string;
}

/* Raw shapes as they come off the wire (frappe.desk.query_report.run) */

interface RawLedgerEntry {
  gl_entry?: string;
  posting_date?: string;
  account: string;
  party_type?: string;
  party?: string;
  party_name?: string;
  voucher_type?: string;
  voucher_subtype?: string;
  voucher_no?: string;
  against?: string;
  against_voucher_type?: string;
  against_voucher?: string;
  bill_no?: string;
  project?: string;
  cost_center?: string;
  debit: number;
  credit: number;
  balance: number;
  remarks?: string | null;
  account_currency?: string | null;
  presentation_currency?: string;
}

interface RawColumn {
  label: string;
  fieldname: string;
  fieldtype?: string;
  hidden?: number;
  width?: number;
  options?: string;
  sticky?: boolean;
}

interface RawReportMessage {
  result: RawLedgerEntry[];
  columns: RawColumn[];
  message?: string | null;
}

interface RawReportResponse {
  message: RawReportMessage;
}

/* ───────────────── Company resolution ─────────────────
   TODO: remove FALLBACK_COMPANY once useCompanyStore is wired to a
   real /company API and companyName is never empty on load.
   ─────────────────────────────────────────────────────────── */

const FALLBACK_COMPANY = '--';

function resolveCompany(): string {
  return useCompanyStore.getState().companyName || FALLBACK_COMPANY;
}

/* ───────────────── Currency helpers ───────────────── */



export const BASE_CURRENCY = 'INR';

export function formatAmount(currency: string, amount: number) {
  return formatAmountShared(currency, amount, { withSymbol: true });
}
export function stripAccountAbbreviation(accountName: string): string {
  return accountName.replace(/\s-\s[^-]+$/, '');
}

/* ───────────────── Summary-row detection ─────────────────
   Frappe bakes literal quotes into the account field for the
   synthetic rows: "'Opening'", "'Total'", "'Closing (Opening + Total)'"
   ─────────────────────────────────────────────────────────── */

type SummaryKind = 'opening' | 'total' | 'closing';

function summaryKind(row: RawLedgerEntry): SummaryKind | null {
  const acc = row.account?.replace(/^'|'$/g, '').trim().toLowerCase();
  if (acc === 'opening') return 'opening';
  if (acc === 'total') return 'total';
  if (acc?.startsWith('closing')) return 'closing';
  return null;
}

function mapRow(raw: RawLedgerEntry, i: number, isSummary: boolean): LedgerRow {
  return {
    gl_entry: raw.gl_entry ?? `row-${i}`,
    posting_date: raw.posting_date ?? '',
    account: isSummary ? raw.account.replace(/^'|'$/g, '') : raw.account,
    party_type: raw.party_type,
    party: raw.party,
    party_name: raw.party_name,
    voucher_type: raw.voucher_type,
    voucher_subtype: raw.voucher_subtype,
    voucher_no: raw.voucher_no,
    against_account: raw.against,
    against_voucher_type: raw.against_voucher_type,
    against_voucher: raw.against_voucher,
    bill_no: raw.bill_no,
    project: raw.project,
    cost_center: raw.cost_center,
    debit: raw.debit ?? 0,
    credit: raw.credit ?? 0,
    balance: raw.balance ?? 0,
    remarks: raw.remarks ?? undefined,
    is_summary_row: isSummary,
  };
}

/* ───────────────── Param building ───────────────── */

function buildReportFilters(filters: GLFilters, company: string) {
  return {
    company,
    from_date: filters.fromDate,
    to_date: filters.toDate,
    account: filters.account ? [filters.account] : [],
    party: [],
    categorize_by: 'Categorize by Voucher (Consolidated)',
    cost_center: [],
    project: [],
    include_dimensions: 1,
    include_default_book_entries: 1,
  };
}

/* ───────────────── GET General Ledger ─────────────────
   Hits the raw Frappe report runner via API.Accounting.generalLedger.get
   (= frappe.desk.query_report.run). Pagination and the opening/total/
   closing summary are derived client-side since the report returns the
   full result set in one call.
   ─────────────────────────────────────────────────────────── */

export async function fetchGeneralLedger(
  filters: GLFilters,
  page: number,
  pageSize: number,
): Promise<GLResponse> {
  const company = resolveCompany();
  const reportFilters = buildReportFilters(filters, company);

  const response: AxiosResponse<RawReportResponse> = await api.get(
    API.Accounting.generalLedger.get,
    {
      params: {
        report_name: 'General Ledger',
        filters: JSON.stringify(reportFilters),
        ignore_prepared_report: false,
        are_default_filters: true,
      },
    },
  );

  const { result, columns: rawColumns } = response.data.message;

  // Split out the synthetic rows from the real ledger entries
  let openingRaw: RawLedgerEntry | undefined;
  let totalRaw: RawLedgerEntry | undefined;
  let closingRaw: RawLedgerEntry | undefined;
  const entryRows: RawLedgerEntry[] = [];

  for (const row of result) {
    const kind = summaryKind(row);
    if (kind === 'opening') openingRaw = row;
    else if (kind === 'total') totalRaw = row;
    else if (kind === 'closing') closingRaw = row;
    else entryRows.push(row);
  }

  let ledgerEntries = entryRows;
  if (filters.voucherNo?.trim()) {
    const q = filters.voucherNo.trim().toLowerCase();
    ledgerEntries = ledgerEntries.filter((r) => r.voucher_no?.toLowerCase().includes(q));
  }

  const totalEntries = ledgerEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const start = (page - 1) * pageSize;
  const pageRawRows = ledgerEntries.slice(start, start + pageSize);

  const summary: Summary = {
    opening: {
      debit: openingRaw?.debit ?? 0,
      credit: openingRaw?.credit ?? 0,
      balance: openingRaw?.balance ?? 0,
    },
    total: {
      debit: totalRaw?.debit ?? 0,
      credit: totalRaw?.credit ?? 0,
      balance: totalRaw?.balance ?? 0,
    },
    closing: {
      debit: closingRaw?.debit ?? 0,
      credit: closingRaw?.credit ?? 0,
      balance: closingRaw?.balance ?? 0,
    },
  };

  const pageRows = pageRawRows.map((r, i) => mapRow(r, start + i, false));
  const ledger: LedgerRow[] = [];
  if (page === 1 && openingRaw) ledger.push(mapRow(openingRaw, -1, true));
  ledger.push(...pageRows);
  if (page === totalPages && closingRaw) ledger.push(mapRow(closingRaw, -2, true));

  const columns: ApiColumn[] = rawColumns.map((c) => ({
    label: c.label,
    fieldname: c.fieldname === 'against' ? 'against_account' : c.fieldname,
    fieldtype: c.fieldtype,
    hidden: c.hidden,
    width: c.width,
    options: c.options,
    sticky: c.sticky,
  }));

  const presentationCurrency =
    result[0]?.presentation_currency ?? useCompanyStore.getState().baseCurrency ?? BASE_CURRENCY;

  return {
    account: filters.account,
    account_currency: presentationCurrency,
    presentation_currency: presentationCurrency,
    company,
    summary,
    columns,
    ledger,
    pagination: {
      page,
      page_size: pageSize,
      total_entries: totalEntries,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
}