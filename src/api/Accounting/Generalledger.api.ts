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



interface RawLedgerRow {
  gl_entry: string;
  posting_date: string;
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
  remarks?: string;
}

interface RawGLData {
  account: string;
  account_currency: string;
  presentation_currency: string;
  company: string;
  summary: Summary;
  columns: ApiColumn[];
  ledger: RawLedgerRow[];
  pagination: Pagination;
}

interface RawGLApiResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: RawGLData;
  };
}



export const BASE_CURRENCY = 'INR';

export function formatAmount(currency: string, amount: number) {
  return formatAmountShared(currency, amount, { withSymbol: true });
}
export function stripAccountAbbreviation(accountName: string): string {
  return accountName.replace(/\s-\s[^-]+$/, '');
}

function mapRow(raw: RawLedgerRow): LedgerRow {
  return {
    gl_entry: raw.gl_entry,
    posting_date: raw.posting_date,
    account: raw.account,
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
    remarks: raw.remarks,
    is_summary_row: false,
  };
}



export async function fetchGeneralLedger(
  filters: GLFilters,
  page: number,
  pageSize: number,
): Promise<GLResponse> {
 // NEW
const response: AxiosResponse<RawGLApiResponse> = await api.get(
  API.Accounting.generalLedger.viewLedger,
    {
      params: {
        account: filters.account,
        from_date: filters.fromDate,
        to_date: filters.toDate,
        page,
        page_size: pageSize,
      },
    },
  );

  const data = response.data.message.data;

  let ledgerEntries = data.ledger;
  if (filters.voucherNo?.trim()) {
    const q = filters.voucherNo.trim().toLowerCase();
    ledgerEntries = ledgerEntries.filter((r) =>
      r.voucher_no?.toLowerCase().includes(q),
    );
  }

  const presentationCurrency =
    data.presentation_currency || useCompanyStore.getState().baseCurrency || BASE_CURRENCY;

  return {
    account: data.account,
    account_currency: data.account_currency || presentationCurrency,
    presentation_currency: presentationCurrency,
    company: data.company,
    summary: data.summary,
    columns: data.columns,
    ledger: ledgerEntries.map(mapRow),
    pagination: data.pagination,
  };
}