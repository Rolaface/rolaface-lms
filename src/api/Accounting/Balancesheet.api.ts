

export type BSFilterMode = 'Fiscal Year' | 'Date Range';
export type BSPeriodicity = 'Monthly' | 'Quarterly' | 'Yearly' | 'Half-Yearly';

export interface BSFilters {
  mode: BSFilterMode;
  periodicity: BSPeriodicity;
  fromFiscalYear: number;
  toFiscalYear: number;
  fromDate: string;
  toDate: string;
}

export interface BSNode {
  id: string;
  account: string;
  account_name: string;
  currency?: string;
  indent: number;
  is_group: number;
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
}

export interface BSData {
  columns: BSColumn[];
  summary: BSSummaryItem[];
  assets: BSNode[];
  liabilities: BSNode[];
  equity: BSNode[];
}

export const BASE_CURRENCY = 'INR';
const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export function formatAmount(currency: string, amount: number) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol} ${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ───────────────── Dummy data ───────────────── */

function periodLabelsFor(periodicity: BSPeriodicity): string[] {
  switch (periodicity) {
    case 'Monthly':
      return ['May 2026', 'Jun 2026', 'Jul 2026'];
    case 'Quarterly':
      return ['Q1 2026', 'Q2 2026'];
    case 'Half-Yearly':
      return ['H1 2026', 'H2 2026'];
    case 'Yearly':
    default:
      return ['FY 2026'];
  }
}

function leaf(account_name: string, amounts: number[], periods: string[]): BSNode {
  const p: Record<string, number> = {};
  periods.forEach((label, i) => (p[label] = amounts[i] ?? amounts[amounts.length - 1] ?? 0));
  return {
    id: account_name,
    account: account_name,
    account_name,
    currency: BASE_CURRENCY,
    indent: 1,
    is_group: 0,
    periods: p,
    children: [],
  };
}

function group(account_name: string, children: BSNode[], periods: string[]): BSNode {
  const p: Record<string, number> = {};
  periods.forEach((label) => {
    p[label] = children.reduce((s, c) => s + (c.periods[label] ?? 0), 0);
  });
  return {
    id: account_name,
    account: account_name,
    account_name,
    currency: BASE_CURRENCY,
    indent: 0,
    is_group: 1,
    periods: p,
    children,
  };
}

function buildAssets(periods: string[]): BSNode[] {
  const currentAssets = group(
    'Current Assets',
    [
      leaf('Cash - NSPL', [312000, 298500, 341200], periods),
      leaf('Stock In Hand - NSPL', [900000, 954500, 1023000], periods),
      leaf('Debtors - NSPL', [412500, 455000, 502300], periods),
    ],
    periods,
  );
  const fixedAssets = group(
    'Fixed Assets',
    [
      leaf('Office Equipment - NSPL', [180000, 178500, 177000], periods),
      leaf('Furniture and Fixtures - NSPL', [95000, 94200, 93400], periods),
    ],
    periods,
  );
  return [group('Application of Funds (Assets)', [currentAssets, fixedAssets], periods)];
}

function buildLiabilities(periods: string[]): BSNode[] {
  const currentLiabilities = group(
    'Current Liabilities',
    [
      leaf('Creditors - NSPL', [287500, 305200, 264100], periods),
      leaf('Duties and Taxes - NSPL', [64200, 71500, 68900], periods),
    ],
    periods,
  );
  return [group('Source of Funds (Liabilities)', [currentLiabilities], periods)];
}

function buildEquity(periods: string[]): BSNode[] {
  const equity = group(
    'Equity',
    [
      leaf('Share Capital - NSPL', [1000000, 1000000, 1000000], periods),
      leaf('Retained Earnings - NSPL', [447800, 504000, 604900], periods),
    ],
    periods,
  );
  return [equity];
}

function sumNodeAtLatestPeriod(nodes: BSNode[], periods: string[]): number {
  const latest = periods[periods.length - 1];
  return nodes.reduce((s, n) => s + (n.periods[latest] ?? 0), 0);
}

/** GET /accounting/balance-sheet?mode=...&periodicity=...&from_fiscal_year=...&to_fiscal_year=...&from_date=...&to_date=... */
export async function fetchBalanceSheet(filters: BSFilters): Promise<BSData> {
  await new Promise((res) => setTimeout(res, 450));

  const periods = periodLabelsFor(filters.periodicity);

  const assets = buildAssets(periods);
  const liabilities = buildLiabilities(periods);
  const equity = buildEquity(periods);

  const totalAssets = sumNodeAtLatestPeriod(assets, periods);
  const totalLiabilities = sumNodeAtLatestPeriod(liabilities, periods);
  const totalEquity = sumNodeAtLatestPeriod(equity, periods);
  const netDifference = totalAssets - (totalLiabilities + totalEquity);

  const columns: BSColumn[] = [
    { fieldname: 'account', label: 'Account', width: 260 },
    ...periods.map((label) => ({ fieldname: label, label, width: 130 })),
  ];

  const summary: BSSummaryItem[] = [
    { label: 'Total Assets', value: totalAssets, currency: BASE_CURRENCY, indicator: 'neutral' },
    { label: 'Total Liabilities', value: totalLiabilities, currency: BASE_CURRENCY, indicator: 'red' },
    { label: 'Total Equity', value: totalEquity, currency: BASE_CURRENCY, indicator: 'green' },
    {
      label: 'Balance Check',
      value: netDifference,
      currency: BASE_CURRENCY,
      indicator: Math.abs(netDifference) < 1 ? 'green' : 'red',
    },
  ];

  return { columns, summary, assets, liabilities, equity };
}