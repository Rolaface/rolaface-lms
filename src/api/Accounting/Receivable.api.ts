/* ───────────────────────────────────────────────────────────
   Accounts Receivable — API layer
   Dummy paginated data + a fake-delay fetch for now. When the
   backend is ready, swap the body of fetchReceivables for a
   real axios/react-query call — keep the name/signature the
   same so the logic layer doesn't change.
   ─────────────────────────────────────────────────────────── */

export type ReceivableVoucherType = 'Sales Invoice' | 'Payment Entry' | 'Journal Entry';
export type ReceivableStatus = 'Pending' | 'Overdue' | 'Paid';

export interface ReceivableRow {
  id: string;
  isSummary: boolean;
  customer: string;
  voucherType: ReceivableVoucherType | '';
  costCenter?: string;
  currency: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  postingDate?: string;
  dueDate?: string;
  age: number;
  status: ReceivableStatus | '';
  overdue: boolean;
}

export interface AgeingSummary {
  '0_30': number;
  '31_60': number;
  '61_90': number;
  '91_120': number;
  '121_above': number;
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

export interface ReceivableResponse {
  kpis: ReceivableKPIs;
  rows: ReceivableRow[];
  pagination: Pagination;
}

export interface ReceivableFilters {
  search?: string;
  status?: ReceivableStatus | 'all';
  postingDate?: string;
  voucherType?: ReceivableVoucherType | '';
  costCenter?: string;
  receivableAccount?: string;
  customers?: string[];
  groupBy?: string[];
}

export interface LookupOption {
  label: string;
  value: string;
}

/* ───────────────── Currency helpers ───────────────── */

export const BASE_CURRENCY = 'INR';

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export function formatAmount(currency: string | undefined, amount: number) {
  const symbol = CURRENCY_SYMBOLS[currency ?? BASE_CURRENCY] ?? currency ?? '';
  return `${symbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ───────────────── Lookup dummy data ───────────────── */

export const CUSTOMER_OPTIONS: LookupOption[] = [
  { label: 'Apex Manufacturing', value: 'CUST-2026-0044' },
  { label: 'Bright Electronics Inc.', value: 'CUST-2026-0021' },
  { label: 'Coastal Traders LLP', value: 'CUST-2026-0032' },
  { label: 'Delta Textiles Ltd.', value: 'CUST-2026-0056' },
  { label: 'Everstone Retail', value: 'CUST-2026-0063' },
];

export const COST_CENTER_OPTIONS: LookupOption[] = [
  { label: 'Main - N', value: 'Main - N' },
  { label: 'Sales - N', value: 'Sales - N' },
  { label: 'Warehouse - N', value: 'Warehouse - N' },
];

export const RECEIVABLE_ACCOUNT_OPTIONS: LookupOption[] = [
  { label: 'Debtors INR - N', value: 'Debtors INR - N' },
  { label: 'Debtors USD - N', value: 'Debtors USD - N' },
];

export const VOUCHER_TYPE_OPTIONS: ReceivableVoucherType[] = [
  'Sales Invoice',
  'Payment Entry',
  'Journal Entry',
];

/* ───────────────── Dummy row data ───────────────── */

interface RawRow {
  customer: string;
  voucherType: ReceivableVoucherType;
  costCenter: string;
  currency: string;
  invoicedAmount: number;
  paidAmount: number;
  postingDate: string;
  dueDate: string | null;
}

function buildRawRows(): RawRow[] {
  return [
    { customer: 'Apex Manufacturing', voucherType: 'Sales Invoice', costCenter: 'Main - N', currency: 'INR', invoicedAmount: 900872.5, paidAmount: 0, postingDate: '2026-07-21', dueDate: '2026-08-20' },
    { customer: 'Apex Manufacturing', voucherType: 'Payment Entry', costCenter: 'Main - N', currency: 'INR', invoicedAmount: 0, paidAmount: 400000, postingDate: '2026-07-24', dueDate: null },
    { customer: 'Bright Electronics Inc.', voucherType: 'Sales Invoice', costCenter: 'Sales - N', currency: 'INR', invoicedAmount: 197415, paidAmount: 197415, postingDate: '2026-06-10', dueDate: '2026-07-10' },
    { customer: 'Coastal Traders LLP', voucherType: 'Sales Invoice', costCenter: 'Main - N', currency: 'INR', invoicedAmount: 542300, paidAmount: 0, postingDate: '2026-05-02', dueDate: '2026-06-01' },
    { customer: 'Delta Textiles Ltd.', voucherType: 'Sales Invoice', costCenter: 'Warehouse - N', currency: 'INR', invoicedAmount: 318900, paidAmount: 150000, postingDate: '2026-06-28', dueDate: '2026-07-28' },
    { customer: 'Delta Textiles Ltd.', voucherType: 'Payment Entry', costCenter: 'Warehouse - N', currency: 'INR', invoicedAmount: 0, paidAmount: 150000, postingDate: '2026-07-05', dueDate: null },
    { customer: 'Everstone Retail', voucherType: 'Sales Invoice', costCenter: 'Sales - N', currency: 'INR', invoicedAmount: 76500, paidAmount: 0, postingDate: '2026-07-18', dueDate: '2026-08-17' },
    { customer: 'Coastal Traders LLP', voucherType: 'Journal Entry', costCenter: 'Main - N', currency: 'INR', invoicedAmount: 12000, paidAmount: 0, postingDate: '2026-07-22', dueDate: '2026-08-05' },
    { customer: 'Bright Electronics Inc.', voucherType: 'Sales Invoice', costCenter: 'Sales - N', currency: 'INR', invoicedAmount: 244800, paidAmount: 0, postingDate: '2026-04-15', dueDate: '2026-05-15' },
    { customer: 'Everstone Retail', voucherType: 'Payment Entry', costCenter: 'Sales - N', currency: 'INR', invoicedAmount: 0, paidAmount: 76500, postingDate: '2026-07-27', dueDate: null },
  ];
}

function computeStatusAndAge(row: RawRow): { status: ReceivableStatus; age: number; overdue: boolean; outstanding: number } {
  const outstanding = row.invoicedAmount - row.paidAmount;
  if (outstanding <= 0) return { status: 'Paid', age: 0, overdue: false, outstanding: 0 };

  const today = new Date('2026-07-30');
  const refDate = row.dueDate ? new Date(row.dueDate) : new Date(row.postingDate);
  const daysDiff = Math.ceil((today.getTime() - refDate.getTime()) / (1000 * 3600 * 24));
  const overdue = row.dueDate ? daysDiff > 0 : false;

  return {
    status: overdue ? 'Overdue' : 'Pending',
    age: Math.abs(daysDiff),
    overdue,
    outstanding,
  };
}

function buildDummyRows(): ReceivableRow[] {
  return buildRawRows()
    .filter((r) => r.invoicedAmount > 0 || r.paidAmount > 0)
    .map((r, i) => {
      const { status, age, overdue, outstanding } = computeStatusAndAge(r);
      return {
        id: `${r.voucherType === 'Sales Invoice' ? 'ACC-SINV' : r.voucherType === 'Payment Entry' ? 'ACC-PAY' : 'ACC-JV'}-2026-${String(i + 1).padStart(5, '0')}`,
        isSummary: false,
        customer: r.customer,
        voucherType: r.voucherType,
        costCenter: r.costCenter,
        currency: r.currency,
        invoicedAmount: r.invoicedAmount,
        paidAmount: r.paidAmount,
        outstandingAmount: r.voucherType === 'Sales Invoice' ? outstanding : 0,
        postingDate: r.postingDate,
        dueDate: r.dueDate ?? undefined,
        age,
        status: r.voucherType === 'Sales Invoice' ? status : '',
        overdue: r.voucherType === 'Sales Invoice' ? overdue : false,
      };
    });
}

function buildKpis(rows: ReceivableRow[]): ReceivableKPIs {
  const invoiceRows = rows.filter((r) => r.voucherType === 'Sales Invoice');
  const total_invoiced = invoiceRows.reduce((s, r) => s + r.invoicedAmount, 0);
  const total_paid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const total_outstanding = invoiceRows.reduce((s, r) => s + r.outstandingAmount, 0);
  const overdue_amount = invoiceRows.filter((r) => r.overdue).reduce((s, r) => s + r.outstandingAmount, 0);
  const total_customers = new Set(rows.map((r) => r.customer)).size;

  const ageing_summary: AgeingSummary = { '0_30': 0, '31_60': 0, '61_90': 0, '91_120': 0, '121_above': 0 };
  invoiceRows
    .filter((r) => r.outstandingAmount > 0)
    .forEach((r) => {
      if (r.age <= 30) ageing_summary['0_30'] += r.outstandingAmount;
      else if (r.age <= 60) ageing_summary['31_60'] += r.outstandingAmount;
      else if (r.age <= 90) ageing_summary['61_90'] += r.outstandingAmount;
      else if (r.age <= 120) ageing_summary['91_120'] += r.outstandingAmount;
      else ageing_summary['121_above'] += r.outstandingAmount;
    });

  const collectedInvoices = invoiceRows.filter((r) => r.outstandingAmount === 0);
  const average_collection_days = collectedInvoices.length
    ? Math.round(collectedInvoices.reduce((s, r) => s + r.age, 0) / collectedInvoices.length)
    : 0;

  return {
    total_outstanding,
    total_invoiced,
    total_paid,
    total_customers,
    overdue_amount,
    average_collection_days,
    ageing_summary,
  };
}

/** Mimics: GET /accounting/receivables?search=...&status=...&page=...&page_size=... */
export async function fetchReceivables(
  filters: ReceivableFilters,
  page: number,
  pageSize: number,
): Promise<ReceivableResponse> {
  await new Promise((res) => setTimeout(res, 400));

  let rows = buildDummyRows();

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((r) => r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q));
  }
  if (filters.status && filters.status !== 'all') {
    rows = rows.filter((r) => r.status === filters.status);
  }
  if (filters.voucherType) {
    rows = rows.filter((r) => r.voucherType === filters.voucherType);
  }
  if (filters.costCenter) {
    rows = rows.filter((r) => r.costCenter === filters.costCenter);
  }
  if (filters.customers?.length) {
    rows = rows.filter((r) => filters.customers!.some((c) => r.customer === CUSTOMER_OPTIONS.find((o) => o.value === c)?.label));
  }

  const kpis = buildKpis(rows);

  const totalEntries = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return {
    kpis,
    rows: pageRows,
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