import type { AxiosResponse } from 'axios';
import apiClient from '../../config/axios';
import { API } from '../../config/api';

const api = apiClient;



/* ===========================================================
   TYPES
=========================================================== */

export type CFFilterMode = 'Fiscal Year' | 'Date Range';
export type CFPeriodicity = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';

export interface CFFilters {
  mode: CFFilterMode;
  periodicity: CFPeriodicity;
  fromFiscalYear: string;
  toFiscalYear: string;
  fromDate: string;
  toDate: string;
}

/** Raw row as returned by the backend, before tree-mapping */
export interface CFRawRow {
  section?: string;
  section_name?: string;
  parent_section?: string | null;
  indent?: number;
  currency?: string;
  children?: CFRawRow[];
  periods?: Record<string, number>;
  [periodKey: string]: any;
}

export interface CFColumn {
  fieldname: string;
  label: string;
  fieldtype?: string;
  width?: number;
  hidden?: number;
}

export interface CFSummaryItem {
  label: string;
  value: number;
  currency?: string;
  indicator?: 'green' | 'red' | 'gray';
}

/** Mapped tree node — what the table component actually renders */
export interface CFNode {
  id: string;
  section: string;
  currency?: string;
  parent_section?: string | null;
  indent: number;
  periods: Record<string, number>;
  children: CFNode[];
}

export interface CFData {
  columns: CFColumn[];
  summary: CFSummaryItem[];
  tree: CFNode[];
}

interface CashFlowEnvelope {
  status_code: number;
  status: string;
  message: string;
  data: {
    columns: CFColumn[];
    summary: CFSummaryItem[];
    data: CFRawRow[];
  };
}

interface CashFlowApiResponse {
  message: CashFlowEnvelope;
}

/* ===========================================================
   TREE MAPPER
=========================================================== */

function mapNode(row: CFRawRow): CFNode {
  return {
    id: row.section || row.section_name || Math.random().toString(),
    section: (row.section ?? row.section_name ?? '').toString().replace(/^'|'$/g, ''),
    currency: row.currency,
    indent: row.indent ?? 0,
    parent_section: row.parent_section ?? null,
    periods: row.periods ?? {},
    children: (row.children ?? []).map(mapNode),
  };
}

function buildTree(rows: CFRawRow[]): CFNode[] {
  return (rows ?? []).filter((r) => r && Object.keys(r).length > 0).map(mapNode);
}

export const isNetRow = (section: string, parentSection?: string | null): boolean =>
  section.toLowerCase().startsWith('net') && !parentSection;

/* ===========================================================
   FETCH
=========================================================== */

export async function fetchCashFlow(filters: CFFilters): Promise<CFData> {
  const params =
    filters.mode === 'Date Range'
      ? {
          periodicity: filters.periodicity,
          from_date: filters.fromDate,
          to_date: filters.toDate,
          filter_based_on: 'Date Range',
        }
      : {
          periodicity: filters.periodicity,
          from_fiscal_year: filters.fromFiscalYear,
          to_fiscal_year: filters.toFiscalYear,
          filter_based_on: 'Fiscal Year',
        };

  const response: AxiosResponse<CashFlowApiResponse> = await api.get(API.Accounting.cashFlow.get, { params });

  const envelope = response.data.message;

  if (envelope.status_code !== 200) {
    throw new Error(envelope.message || 'Failed to load Cash Flow.');
  }

  return {
    columns: envelope.data.columns ?? [],
    summary: envelope.data.summary ?? [],
    tree: buildTree(envelope.data.data),
  };
}