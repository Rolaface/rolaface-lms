import type { AxiosResponse } from 'axios';
import apiClient from '../../config/axios';
import { API } from '../../config/api';

const api = apiClient;

/* ───────────────── Types ───────────────── */

export type BSFilterMode = 'Fiscal Year' | 'Date Range';
export type BSPeriodicity = 'Monthly' | 'Quarterly' | 'Yearly' | 'Half-Yearly';

export interface BSFilters {
  mode: BSFilterMode;
  periodicity: BSPeriodicity;
  fromFiscalYear: string; 
  toFiscalYear: string;
  fromDate: string;
  toDate: string;
}

export interface BSNode {
  id: string;
  account: string;
  account_name: string;
  currency?: string;
  parent_account?: string;
  indent: number;
  is_group: number;
  has_value?: boolean;
  opening_balance?: number;
  periods: Record<string, number>;
  children: BSNode[];
}

export interface BSSummaryItem {
  label: string;
  value: number;
  currency?: string;
  indicator?: 'green' | 'red' | 'neutral';
}

export interface BSColumn {
  fieldname: string;
  label: string;
  width?: number;
  hidden?: boolean;
}

export interface BSData {
  columns: BSColumn[];
  summary: BSSummaryItem[];
  assets: BSNode[];
  liabilities: BSNode[];
  equity: BSNode[];
}


interface RawBSNode {
  account: string;
  account_name: string;
  currency?: string;
  parent_account?: string;
  indent?: number;
  is_group?: boolean | 0 | 1;
  has_value?: boolean;
  opening_balance?: number;
  periods?: Record<string, number>;
  children?: RawBSNode[];
}

interface RawBSData {
  columns: BSColumn[];
  summary: BSSummaryItem[];
  assets: RawBSNode[];
  liabilities: RawBSNode[];
  equity?: RawBSNode[];
}

interface BSEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: RawBSData;
}

interface BSApiResponse {
  message: BSEnvelope;
}

/* ───────────────── Node normalization ───────────────── */


function mapNode(raw: RawBSNode): BSNode {
  return {
    id: raw.account,
    account: raw.account,
    account_name: raw.account_name,
    currency: raw.currency,
    parent_account: raw.parent_account,
    indent: raw.indent ?? 0,
    is_group: raw.is_group ? 1 : 0,
    has_value: raw.has_value,
    opening_balance: raw.opening_balance,
    periods: raw.periods ?? {},
    children: raw.children?.length ? raw.children.map(mapNode) : [],
  };
}

/* ───────────────── Param building ───────────────── */

function buildParams(filters: BSFilters) {
  if (filters.mode === 'Date Range') {
    return {
      periodicity: filters.periodicity,
      from_date: filters.fromDate,
      to_date: filters.toDate,
      filter_based_on: 'Date Range' as const,
    };
  }
  return {
    periodicity: filters.periodicity,
    from_fiscal_year: filters.fromFiscalYear,
    to_fiscal_year: filters.toFiscalYear,
    filter_based_on: 'Fiscal Year' as const,
  };
}

/* ───────────────── GET Balance Sheet ───────────────── */


export async function fetchBalanceSheet(filters: BSFilters): Promise<BSData> {
  const params = buildParams(filters);

  const response: AxiosResponse<BSApiResponse> = await api.get(
    API.Accounting.balanceSheet.get,
    { params },
  );

  const envelope = response.data.message;

  if (envelope.status_code !== 200) {
    throw new Error(envelope.message || 'Failed to load Balance Sheet.');
  }

  const d = envelope.data;

  return {
    columns: d.columns,
    summary: d.summary,
    assets: d.assets.map(mapNode),
    liabilities: d.liabilities.map(mapNode),
    equity: (d.equity ?? []).map(mapNode),
  };
}