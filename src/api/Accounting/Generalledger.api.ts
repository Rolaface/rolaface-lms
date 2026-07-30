

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
  finance_book?: string;
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

/* ───────────────── Currency helpers ───────────────── */

export const BASE_CURRENCY = 'INR';

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export function formatAmount(currency: string, amount: number) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Strips a trailing " - <company abbreviation>" suffix, e.g. "Debtors INR - RI" → "Debtors INR" */
export function stripAccountAbbreviation(accountName: string): string {
  return accountName.replace(/\s-\s[^-]+$/, '');
}

/* ───────────────── Dummy data ───────────────── */

const COLUMNS: ApiColumn[] = [
  { label: 'Posting Date', fieldname: 'posting_date', width: 110 },
  { label: 'Account', fieldname: 'account', width: 170 },
  { label: 'Debit (INR)', fieldname: 'debit', width: 130 },
  { label: 'Credit (INR)', fieldname: 'credit', width: 130 },
  { label: 'Balance (INR)', fieldname: 'balance', width: 130 },
  { label: 'Voucher Type', fieldname: 'voucher_type', width: 130 },
  { label: 'Voucher Subtype', fieldname: 'voucher_subtype', width: 140 },
  { label: 'Voucher No', fieldname: 'voucher_no', width: 150 },
  { label: 'Against Account', fieldname: 'against_account', width: 160 },
  { label: 'Party Type', fieldname: 'party_type', width: 110 },
  { label: 'Party', fieldname: 'party', width: 130 },
  { label: 'Party Name', fieldname: 'party_name', width: 170 },
  { label: 'Project', fieldname: 'project', width: 130 },
  { label: 'Cost Center', fieldname: 'cost_center', width: 150 },
];

interface RawRow {
  posting_date: string;
  account: string;
  voucher_type: string;
  voucher_subtype: string;
  voucher_no: string;
  against_account: string;
  party_type?: string;
  party?: string;
  party_name?: string;
  project?: string;
  cost_center: string;
  debit: number;
  credit: number;
  remarks: string;
}

function buildRawRows(): RawRow[] {
  return [
    { posting_date: '2026-07-20', account: 'Creditors - NSPL', voucher_type: 'Purchase Invoice', voucher_subtype: 'Purchase Invoice', voucher_no: 'ACC-PINV-2026-00087', against_account: 'Stock In Hand - NSPL', party_type: 'Supplier', party: 'SUP-2026-0014', party_name: 'OfficeMart Supplies', cost_center: 'Main - N', debit: 0, credit: 411500, remarks: 'Purchase booking' },
    { posting_date: '2026-07-20', account: 'Stock In Hand - NSPL', voucher_type: 'Purchase Invoice', voucher_subtype: 'Purchase Invoice', voucher_no: 'ACC-PINV-2026-00087', against_account: 'SUP-2026-0014', cost_center: 'Main - N', debit: 411500, credit: 0, remarks: 'Purchase booking' },
    { posting_date: '2026-07-20', account: 'Creditors - NSPL', voucher_type: 'Payment Entry', voucher_subtype: 'Pay', voucher_no: 'ACC-PAY-2026-00031', against_account: 'Cash - NSPL', party_type: 'Supplier', party: 'SUP-2026-0014', party_name: 'OfficeMart Supplies', cost_center: 'Main - N', debit: 411500, credit: 0, remarks: 'Vendor payment' },
    { posting_date: '2026-07-20', account: 'Cash - NSPL', voucher_type: 'Payment Entry', voucher_subtype: 'Pay', voucher_no: 'ACC-PAY-2026-00031', against_account: 'SUP-2026-0014', cost_center: 'Main - N', debit: 0, credit: 411500, remarks: 'Vendor payment' },
    { posting_date: '2026-07-20', account: 'Stock In Hand - NSPL', voucher_type: 'Stock Reconciliation', voucher_subtype: 'Stock Reconciliation', voucher_no: 'MAT-RECO-2026-0006', against_account: 'Stock Adjustment - NSPL', cost_center: 'Main - N', debit: 0, credit: 30000, remarks: 'Stock recount' },
    { posting_date: '2026-07-20', account: 'Stock Adjustment - NSPL', voucher_type: 'Stock Reconciliation', voucher_subtype: 'Stock Reconciliation', voucher_no: 'MAT-RECO-2026-0006', against_account: 'Stock In Hand - NSPL', cost_center: 'Main - N', debit: 30000, credit: 0, remarks: 'Stock recount' },
    { posting_date: '2026-07-20', account: 'Creditors - NSPL', voucher_type: 'Purchase Invoice', voucher_subtype: 'Purchase Invoice', voucher_no: 'ACC-PINV-2026-00091', against_account: 'Stock In Hand - NSPL', party_type: 'Supplier', party: 'SUP-2026-0021', party_name: 'Bright Electronics Inc.', cost_center: 'Main - N', debit: 0, credit: 197415, remarks: 'Purchase booking' },
    { posting_date: '2026-07-20', account: 'Stock In Hand - NSPL', voucher_type: 'Purchase Invoice', voucher_subtype: 'Purchase Invoice', voucher_no: 'ACC-PINV-2026-00091', against_account: 'SUP-2026-0021', cost_center: 'Main - N', debit: 184500, credit: 0, remarks: 'Purchase booking' },
    { posting_date: '2026-07-20', account: 'Freight and Forwarding - NSPL', voucher_type: 'Purchase Invoice', voucher_subtype: 'Purchase Invoice', voucher_no: 'ACC-PINV-2026-00091', against_account: 'SUP-2026-0021', cost_center: 'Main - N', debit: 9225, credit: 0, remarks: 'Freight charge' },
    { posting_date: '2026-07-20', account: 'Marketing Expenses - NSPL', voucher_type: 'Purchase Invoice', voucher_subtype: 'Purchase Invoice', voucher_no: 'ACC-PINV-2026-00091', against_account: 'SUP-2026-0021', cost_center: 'Main - N', debit: 3690, credit: 0, remarks: 'Marketing spend' },
    { posting_date: '2026-07-21', account: 'DEBITOR-USD - NSPL', voucher_type: 'Sales Invoice', voucher_subtype: 'Sales Invoice', voucher_no: 'ACC-SINV-2026-00120', against_account: 'Sales - NSPL', party_type: 'Customer', party: 'CUST-2026-0044', party_name: 'Apex Manufacturing', cost_center: 'Main - N', debit: 900872.5, credit: 0, remarks: 'Sale booking' },
    { posting_date: '2026-07-21', account: 'Sales - NSPL', voucher_type: 'Sales Invoice', voucher_subtype: 'Sales Invoice', voucher_no: 'ACC-SINV-2026-00120', against_account: 'CUST-2026-0044', cost_center: 'Main - N', debit: 0, credit: 900872.5, remarks: 'Sale booking' },
    { posting_date: '2026-07-21', account: 'Stock In Hand - NSPL', voucher_type: 'Sales Invoice', voucher_subtype: 'Sales Invoice', voucher_no: 'ACC-SINV-2026-00120', against_account: 'Cost of Goods Sold - NSPL', cost_center: 'Main - N', debit: 0, credit: 750000, remarks: 'COGS booking' },
  ];
}

function buildDummyLedger(account: string): LedgerRow[] {
  let running = 0;
  return buildRawRows()
    .filter((r) => r.account === account || r.against_account === account || !account)
    .map((r, i) => {
      running += r.debit - r.credit;
      return {
        gl_entry: `GLE-${i + 1}`,
        posting_date: r.posting_date,
        account: r.account,
        party_type: r.party_type,
        party: r.party,
        party_name: r.party_name,
        voucher_type: r.voucher_type,
        voucher_subtype: r.voucher_subtype,
        voucher_no: r.voucher_no,
        against_account: r.against_account,
        project: r.project,
        cost_center: r.cost_center,
        debit: r.debit,
        credit: r.credit,
        balance: running,
        remarks: r.remarks,
      };
    });
}

/** GET /accounting/general-ledger?account=...&voucher_no=...&from_date=...&to_date=...&page=...&page_size=... */
export async function fetchGeneralLedger(
  filters: GLFilters,
  page: number,
  pageSize: number,
): Promise<GLResponse> {
  await new Promise((res) => setTimeout(res, 450));

  let allRows = buildDummyLedger(filters.account);
  if (filters.voucherNo?.trim()) {
    const q = filters.voucherNo.trim().toLowerCase();
    allRows = allRows.filter((r) => r.voucher_no?.toLowerCase().includes(q));
  }

  const openingBalance = 0;

  const totalEntries = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = allRows.slice(start, start + pageSize);

  const periodDebit = allRows.reduce((s, r) => s + r.debit, 0);
  const periodCredit = allRows.reduce((s, r) => s + r.credit, 0);
  const periodBalance = periodDebit - periodCredit;

  // Synthetic "Opening" row shown only on page 1, matching report-view style
  const openingRow: LedgerRow = {
    gl_entry: 'opening',
    posting_date: '',
    account: 'Opening',
    debit: openingBalance > 0 ? openingBalance : 0,
    credit: openingBalance < 0 ? -openingBalance : 0,
    balance: openingBalance,
    is_summary_row: true,
  };

  const closingRow: LedgerRow = {
    gl_entry: 'closing',
    posting_date: '',
    account: 'Closing (Opening + Total)',
    debit: openingBalance + periodDebit,
    credit: periodCredit,
    balance: openingBalance + periodBalance,
    is_summary_row: true,
  };

  const ledger = page === 1 ? [openingRow, ...pageRows, closingRow] : pageRows;

  return {
    account: filters.account,
    account_currency: BASE_CURRENCY,
    presentation_currency: BASE_CURRENCY,
    company: 'NovaTech Solutions Pvt. Ltd.',
    finance_book: 'Finance Book',
    summary: {
      opening: { debit: openingBalance, credit: 0, balance: openingBalance },
      total: { debit: periodDebit, credit: periodCredit, balance: periodBalance },
      closing: {
        debit: openingBalance + periodDebit,
        credit: periodCredit,
        balance: openingBalance + periodBalance,
      },
    },
    columns: COLUMNS,
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