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
  from_fiscal_year: number;
  to_fiscal_year: number;
  from_date: string;
  to_date: string;
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

/* ───────────────── Period column generation ───────────────── */

const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export function buildPeriodColumns(periodicity: PLPeriodicity, fyLabel: string): PLColumn[] {
  let periods: PLColumn[] = [];
  if (periodicity === 'Monthly') {
    periods = MONTH_LABELS.map((m) => ({ fieldname: m.toLowerCase(), label: `${m} ${fyLabel}` }));
  } else if (periodicity === 'Quarterly') {
    periods = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({ fieldname: q.toLowerCase(), label: `${q} ${fyLabel}` }));
  } else if (periodicity === 'Half-Yearly') {
    periods = ['H1', 'H2'].map((h) => ({ fieldname: h.toLowerCase(), label: `${h} ${fyLabel}` }));
  } else {
    periods = [{ fieldname: 'fy', label: `FY ${fyLabel}` }];
  }
  return [
    { fieldname: 'account', label: 'Account' },
    ...periods,
    { fieldname: 'total', label: 'Total' },
  ];
}

/* ───────────────── Dummy data ───────────────── */

// deterministic pseudo-variation so numbers look organic without being random on every render
function spread(base: number, count: number): number[] {
  const weights = [1.0, 0.92, 1.08, 0.97, 1.12, 0.88, 1.03, 0.95, 1.1, 0.9, 1.05, 1.0];
  return Array.from({ length: count }, (_, i) => Math.round((base / count) * weights[i % weights.length]));
}

interface RawAccount {
  account: string;
  account_name: string;
  annual: number;
}

const INCOME_ACCOUNTS: RawAccount[] = [
  { account: 'SALES-NSPL', account_name: 'Sales Revenue', annual: 14200000 },
  { account: 'SERVICE-REV-NSPL', account_name: 'Service Revenue', annual: 3860000 },
  { account: 'OTHER-INC-NSPL', account_name: 'Other Income', annual: 412000 },
];

const EXPENSE_ACCOUNTS: RawAccount[] = [
  { account: 'SALARY-NSPL', account_name: 'Salaries & Wages', annual: 5120000 },
  { account: 'RENT-NSPL', account_name: 'Rent Expense', annual: 960000 },
  { account: 'UTIL-NSPL', account_name: 'Utilities', annual: 214000 },
  { account: 'MKT-NSPL', account_name: 'Marketing Expenses', annual: 386000 },
  { account: 'COGS-NSPL', account_name: 'Cost of Goods Sold', annual: 1941300 },
];

function buildNode(raw: RawAccount, columns: PLColumn[]): PLNode {
  const periodCols = columns.filter((c) => c.fieldname !== 'account' && c.fieldname !== 'total');
  const values = spread(raw.annual, periodCols.length);
  const periods: Record<string, number> = {};
  periodCols.forEach((c, i) => (periods[c.fieldname] = values[i]));
  const total = values.reduce((s, v) => s + v, 0);
  return {
    account: raw.account,
    account_name: raw.account_name,
    is_group: false,
    indent: 1,
    periods,
    total,
  };
}

function buildGroup(label: string, accounts: RawAccount[], columns: PLColumn[]): PLNode {
  const children = accounts.map((a) => buildNode(a, columns));
  const periodCols = columns.filter((c) => c.fieldname !== 'account' && c.fieldname !== 'total');
  const periods: Record<string, number> = {};
  periodCols.forEach((c) => {
    periods[c.fieldname] = children.reduce((s, ch) => s + (ch.periods[c.fieldname] ?? 0), 0);
  });
  const total = children.reduce((s, ch) => s + ch.total, 0);
  return {
    account: label.toUpperCase(),
    account_name: label,
    is_group: true,
    indent: 0,
    periods,
    total,
    children,
  };
}

function buildDummyPL(filters: ProfitLossFilters): PLData {
  const fyLabel =
    filters.mode === 'Fiscal Year'
      ? String(filters.from_fiscal_year)
      : `${filters.from_date} to ${filters.to_date}`;

  const columns = buildPeriodColumns(filters.periodicity, fyLabel);

  const income = [buildGroup('Income', INCOME_ACCOUNTS, columns)];
  const expense = [buildGroup('Expenses', EXPENSE_ACCOUNTS, columns)];

  const totalIncome = income[0].total;
  const totalExpense = expense[0].total;
  const netProfit = totalIncome - totalExpense;

  const summary: PLSummaryItem[] = [
    { label: 'Total Income', value: totalIncome, indicator: 'green' },
    { label: 'Total Expense', value: totalExpense, indicator: 'red' },
    { label: 'Net Profit', value: netProfit, indicator: netProfit >= 0 ? 'green' : 'red' },
  ];

  return {
    company: 'NovaTech Solutions Pvt. Ltd.',
    columns,
    income,
    expense,
    summary,
  };
}

/** Mimics: GET /accounting/profit-and-loss?periodicity=...&from_fiscal_year=... */
export async function fetchProfitAndLoss(filters: ProfitLossFilters): Promise<PLData> {
  await new Promise((res) => setTimeout(res, 400));
  return buildDummyPL(filters);
}