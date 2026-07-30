/* ───────────────────────────────────────────────────────────
   Accounts Payable — API layer
   Dummy paginated data + a fake-delay fetch for now. When the
   backend is ready, swap the body of fetchPayables for a real
   axios/react-query call — keep the name/signature the same so
   the logic layer doesn't change.
   ─────────────────────────────────────────────────────────── */

export type PayableVoucherType = 'Purchase Invoice' | 'Payment Entry' | 'Journal Entry' | 'Expense Claim';
export type PayableStatus = 'Pending' | 'Overdue' | 'Paid';

export interface PayableRow {
  id: string;
  isSummary: boolean;
  billNo: string;
  vendor: string;
  voucherType: PayableVoucherType | '';
  costCenter?: string;
  currency: string;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  postingDate?: string;
  dueDate?: string;
  age: number;
  status: PayableStatus | '';
  overdue: boolean;
}

export interface AgeingSummary {
  '0_30': number;
  '31_60': number;
  '61_90': number;
  '91_120': number;
  '121_above': number;
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

export interface PayableResponse {
  kpis: PayableKPIs;
  rows: PayableRow[];
  pagination: Pagination;
}

export interface PayableFilters {
  search?: string;
  status?: PayableStatus | 'all';
  postingDate?: string;
  voucherType?: PayableVoucherType | '';
  costCenter?: string;
  payableAccount?: string;
  suppliers?: string[];
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

export const SUPPLIER_OPTIONS: LookupOption[] = [
  { label: 'OfficeMart Supplies', value: 'SUP-2026-0014' },
  { label: 'Bright Electronics Inc.', value: 'SUP-2026-0021' },
  { label: 'Northstar Logistics', value: 'SUP-2026-0028' },
  { label: 'Prime Packaging Co.', value: 'SUP-2026-0035' },
  { label: 'Vertex Raw Materials', value: 'SUP-2026-0041' },
];

export const COST_CENTER_OPTIONS: LookupOption[] = [
  { label: 'Main - N', value: 'Main - N' },
  { label: 'Purchasing - N', value: 'Purchasing - N' },
  { label: 'Warehouse - N', value: 'Warehouse - N' },
];

export const PAYABLE_ACCOUNT_OPTIONS: LookupOption[] = [
  { label: 'Creditors INR - N', value: 'Creditors INR - N' },
  { label: 'Creditors USD - N', value: 'Creditors USD - N' },
];

export const VOUCHER_TYPE_OPTIONS: PayableVoucherType[] = [
  'Purchase Invoice',
  'Payment Entry',
  'Journal Entry',
  'Expense Claim',
];

/* ───────────────── Dummy row data ───────────────── */

interface RawRow {
  billNo: string;
  vendor: string;
  voucherType: PayableVoucherType;
  costCenter: string;
  currency: string;
  invoicedAmount: number;
  paidAmount: number;
  postingDate: string;
  dueDate: string | null;
}

function buildRawRows(): RawRow[] {
  return [
    { billNo: 'BILL-0087', vendor: 'OfficeMart Supplies', voucherType: 'Purchase Invoice', costCenter: 'Main - N', currency: 'INR', invoicedAmount: 411500, paidAmount: 411500, postingDate: '2026-07-20', dueDate: '2026-08-19' },
    { billNo: '-', vendor: 'OfficeMart Supplies', voucherType: 'Payment Entry', costCenter: 'Main - N', currency: 'INR', invoicedAmount: 0, paidAmount: 411500, postingDate: '2026-07-20', dueDate: null },
    { billNo: 'BILL-0091', vendor: 'Bright Electronics Inc.', voucherType: 'Purchase Invoice', costCenter: 'Purchasing - N', currency: 'INR', invoicedAmount: 197415, paidAmount: 0, postingDate: '2026-07-20', dueDate: '2026-08-19' },
    { billNo: 'BILL-0102', vendor: 'Northstar Logistics', voucherType: 'Purchase Invoice', costCenter: 'Warehouse - N', currency: 'INR', invoicedAmount: 88200, paidAmount: 0, postingDate: '2026-05-14', dueDate: '2026-06-13' },
    { billNo: 'BILL-0114', vendor: 'Prime Packaging Co.', voucherType: 'Purchase Invoice', costCenter: 'Purchasing - N', currency: 'INR', invoicedAmount: 154200, paidAmount: 70000, postingDate: '2026-06-30', dueDate: '2026-07-30' },
    { billNo: '-', vendor: 'Prime Packaging Co.', voucherType: 'Payment Entry', costCenter: 'Purchasing - N', currency: 'INR', invoicedAmount: 0, paidAmount: 70000, postingDate: '2026-07-06', dueDate: null },
    { billNo: 'BILL-0126', vendor: 'Vertex Raw Materials', voucherType: 'Purchase Invoice', costCenter: 'Warehouse - N', currency: 'INR', invoicedAmount: 62700, paidAmount: 0, postingDate: '2026-07-19', dueDate: '2026-08-18' },
    { billNo: '-', vendor: 'Northstar Logistics', voucherType: 'Journal Entry', costCenter: 'Warehouse - N', currency: 'INR', invoicedAmount: 9500, paidAmount: 0, postingDate: '2026-07-23', dueDate: '2026-08-06' },
    { billNo: 'BILL-0071', vendor: 'Bright Electronics Inc.', voucherType: 'Purchase Invoice', costCenter: 'Purchasing - N', currency: 'INR', invoicedAmount: 214600, paidAmount: 0, postingDate: '2026-04-12', dueDate: '2026-05-12' },
    { billNo: '-', vendor: 'Vertex Raw Materials', voucherType: 'Expense Claim', costCenter: 'Warehouse - N', currency: 'INR', invoicedAmount: 15400, paidAmount: 0, postingDate: '2026-07-26', dueDate: '2026-08-10' },
  ];
}

function computeStatusAndAge(row: RawRow): { status: PayableStatus; age: number; overdue: boolean; outstanding: number } {
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

const BILLABLE_TYPES: PayableVoucherType[] = ['Purchase Invoice', 'Journal Entry', 'Expense Claim'];

function buildDummyRows(): PayableRow[] {
  return buildRawRows()
    .filter((r) => r.invoicedAmount > 0 || r.paidAmount > 0)
    .map((r, i) => {
      const { status, age, overdue, outstanding } = computeStatusAndAge(r);
      const isBillable = BILLABLE_TYPES.includes(r.voucherType);
      const prefix =
        r.voucherType === 'Purchase Invoice'
          ? 'ACC-PINV'
          : r.voucherType === 'Payment Entry'
            ? 'ACC-PAY'
            : r.voucherType === 'Expense Claim'
              ? 'ACC-EXP'
              : 'ACC-JV';
      return {
        id: `${prefix}-2026-${String(i + 1).padStart(5, '0')}`,
        isSummary: false,
        billNo: r.billNo,
        vendor: r.vendor,
        voucherType: r.voucherType,
        costCenter: r.costCenter,
        currency: r.currency,
        invoicedAmount: r.invoicedAmount,
        paidAmount: r.paidAmount,
        outstandingAmount: isBillable ? outstanding : 0,
        postingDate: r.postingDate,
        dueDate: r.dueDate ?? undefined,
        age,
        status: isBillable ? status : '',
        overdue: isBillable ? overdue : false,
      };
    });
}

function buildKpis(rows: PayableRow[]): PayableKPIs {
  const billableRows = rows.filter((r) => BILLABLE_TYPES.includes(r.voucherType as PayableVoucherType));
  const total_invoiced = billableRows.reduce((s, r) => s + r.invoicedAmount, 0);
  const total_paid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const total_outstanding = billableRows.reduce((s, r) => s + r.outstandingAmount, 0);
  const overdue_amount = billableRows.filter((r) => r.overdue).reduce((s, r) => s + r.outstandingAmount, 0);
  const total_suppliers = new Set(rows.map((r) => r.vendor)).size;

  const ageing_summary: AgeingSummary = { '0_30': 0, '31_60': 0, '61_90': 0, '91_120': 0, '121_above': 0 };
  billableRows
    .filter((r) => r.outstandingAmount > 0)
    .forEach((r) => {
      if (r.age <= 30) ageing_summary['0_30'] += r.outstandingAmount;
      else if (r.age <= 60) ageing_summary['31_60'] += r.outstandingAmount;
      else if (r.age <= 90) ageing_summary['61_90'] += r.outstandingAmount;
      else if (r.age <= 120) ageing_summary['91_120'] += r.outstandingAmount;
      else ageing_summary['121_above'] += r.outstandingAmount;
    });

  const settledBills = billableRows.filter((r) => r.outstandingAmount === 0);
  const average_payment_days = settledBills.length
    ? Math.round(settledBills.reduce((s, r) => s + r.age, 0) / settledBills.length)
    : 0;

  return {
    total_outstanding,
    total_invoiced,
    total_paid,
    total_suppliers,
    overdue_amount,
    average_payment_days,
    ageing_summary,
  };
}

/** Mimics: GET /accounting/payables?search=...&status=...&page=...&page_size=... */
export async function fetchPayables(
  filters: PayableFilters,
  page: number,
  pageSize: number,
): Promise<PayableResponse> {
  await new Promise((res) => setTimeout(res, 400));

  let rows = buildDummyRows();

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((r) => r.id.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q) || r.billNo.toLowerCase().includes(q));
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
  if (filters.suppliers?.length) {
    rows = rows.filter((r) => filters.suppliers!.some((s) => r.vendor === SUPPLIER_OPTIONS.find((o) => o.value === s)?.label));
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