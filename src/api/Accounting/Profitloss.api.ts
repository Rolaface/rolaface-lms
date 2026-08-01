import type { AxiosResponse } from 'axios';
import apiClient from '../../config/axios';
import { API } from '../../config/api';

const api = apiClient;

/* ───────────────── Types ───────────────── */

export type PLMode = 'Fiscal Year' | 'Date Range';
export type PLPeriodicity = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';

export interface PLNode {
  account: string;
  account_name: string;
  is_group: boolean;
  indent: number;
  periods: Record<string, number>; // keyed by column fieldname
  total: number;
  children?: PLNode[];
}

export interface PLColumn {
  fieldname: string;
  label: string;
  hidden?: boolean;
}

export interface PLSummaryItem {
  label: string;
  value: number;
  indicator: 'green' | 'red';
  type?: string; // KPI strip filters out items that carry a `type`
}

export interface PLData {
  company: string;
  columns: PLColumn[];
  income: PLNode[];
  expense: PLNode[];
  summary: PLSummaryItem[];
}

export interface ProfitLossFilters {
  mode: PLMode;
  periodicity: PLPeriodicity;
   from_fiscal_year: string;   
  to_fiscal_year: string;
  from_date: string;
  to_date: string;
}

/* Raw shapes as they come off the wire, before normalization */
interface RawPLNode {
  account: string;
  account_name: string;
  is_group?: boolean | 0 | 1;
  indent?: number;
  periods?: Record<string, number>;
  total?: number;
  children?: RawPLNode[];
}

interface RawPLData {
  company: string;
  columns: PLColumn[];
  income: RawPLNode[];
  expense: RawPLNode[];
  summary: PLSummaryItem[];
}

interface PLEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: RawPLData;
}

interface PLApiResponse {
  message: PLEnvelope;
}

/* ───────────────── Currency helpers ───────────────── */

export const BASE_CURRENCY = 'INR';
const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export function formatAmount(currency: string | undefined, amount: number) {
  if (!amount) return '—';
  const symbol = CURRENCY_SYMBOLS[currency ?? BASE_CURRENCY] ?? currency ?? '';
  return `${symbol} ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function nf(amount: number) {
  if (!amount) return '—';
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/* ───────────────── Node normalization ───────────────── */

// Mirrors the old project's `mapNode` — normalizes is_group (0/1 -> boolean),
// defaults periods/total, and recurses into children so nested groups are typed too.
function mapNode(raw: RawPLNode): PLNode {
  return {
    account: raw.account,
    account_name: raw.account_name,
    is_group: !!raw.is_group,
    indent: raw.indent ?? 0,
    periods: raw.periods ?? {},
    total: raw.total ?? 0,
    children: raw.children?.length ? raw.children.map(mapNode) : undefined,
  };
}

/* ───────────────── Param building ───────────────── */

// Old project branched params by mode (filter_based_on) — same here.
function buildParams(filters: ProfitLossFilters) {
  if (filters.mode === 'Date Range') {
    return {
      periodicity: filters.periodicity,
      from_date: filters.from_date,
      to_date: filters.to_date,
      filter_based_on: 'Date Range' as const,
    };
  }
  return {
    periodicity: filters.periodicity,
    from_fiscal_year: filters.from_fiscal_year,
    to_fiscal_year: filters.to_fiscal_year,
    filter_based_on: 'Fiscal Year' as const,
  };
}

/* ───────────────── GET Profit & Loss ───────────────── */

/** GET /accounting/profit-and-loss?periodicity=...&from_fiscal_year=... (or date range) */
export async function fetchProfitAndLoss(filters: ProfitLossFilters): Promise<PLData> {
  const params = buildParams(filters);

  // NOTE: rename this to whatever your new project's config/api.ts actually
  // calls the P&L endpoint (matching the Receivable pattern e.g.
  // API.Accounting.receivable.getAllReceivable).
  const response: AxiosResponse<PLApiResponse> = await api.get(
    API.Accounting.profitLoss.get,
    { params },
  );

  const envelope = response.data.message;

  if (envelope.status_code !== 200) {
    throw new Error(envelope.message || 'Failed to load Profit & Loss.');
  }

  const d = envelope.data;

  return {
    company: d.company,
    columns: d.columns,
    income: d.income.map(mapNode),
    expense: d.expense.map(mapNode),
    summary: d.summary,
  };
}