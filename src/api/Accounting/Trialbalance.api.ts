
export interface TBAccount {
  account: string;
  account_name: string;
  currency?: string;
  indent: number;
  opening_debit: number;
  opening_credit: number;
  debit: number;
  credit: number;
  closing_debit: number;
  closing_credit: number;
  has_value: boolean;
  children?: TBAccount[];
}

export interface TBFilters {
  from_date: string;
  to_date: string;
  fiscal_year: string;
  show_zero_values: boolean;
  with_period_closing_entry: boolean;
  show_closing_entries: boolean;
}

export interface TBResponse {
  company: string;
  total_accounts: number;
  totals: {
    opening_debit: number; opening_credit: number;
    debit: number; credit: number;
    closing_debit: number; closing_credit: number;
  };
  accounts: TBAccount[];
}

export const DEFAULT_TB_FILTERS: TBFilters = {
  from_date: '2026-04-01',
  to_date: '2027-03-31',
  fiscal_year: '2026',
  show_zero_values: false,
  with_period_closing_entry: false,
  show_closing_entries: false,
};

const DUMMY_TB: TBResponse = {
  company: 'NovaTech Solutions Pvt. Ltd.',
  total_accounts: 10,
  totals: {
    opening_debit: 0.0,
    opening_credit: 0.0,
    debit: 7657075114.23,
    credit: 7657075114.23,
    closing_debit: 7657075114.23,
    closing_credit: 7657075114.23,
  },
  accounts: [
    { account: 'DEBITOR-USD - NSPL', account_name: 'DEBITOR-USD', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 7629222207.76, credit: 15357872.5, closing_debit: 7629222207.76, closing_credit: 15357872.5, has_value: true, children: [] },
    { account: 'Cash - NSPL', account_name: 'Cash', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 15357218.0, credit: 411650.0, closing_debit: 15357218.0, closing_credit: 411650.0, has_value: true, children: [] },
    { account: 'Stock In Hand - NSPL', account_name: 'Stock In Hand', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 6911249.99, credit: 5120249.98, closing_debit: 6911249.99, closing_credit: 5120249.98, has_value: true, children: [] },
    { account: 'Creditors - NSPL', account_name: 'Creditors', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 411650.0, credit: 5719384.0, closing_debit: 411650.0, closing_credit: 5719384.0, has_value: true, children: [] },
    { account: 'Sales - NSPL', account_name: 'Sales', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 0, credit: 7629217677.76, closing_debit: 0, closing_credit: 7629217677.76, has_value: true, children: [] },
    { account: 'Cost of Goods Sold - NSPL', account_name: 'Cost of Goods Sold', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 1941314.9, credit: 0, closing_debit: 1941314.9, closing_credit: 0, has_value: true, children: [] },
    { account: 'Stock Adjustment - NSPL', account_name: 'Stock Adjustment', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 3179159.08, credit: 1243749.99, closing_debit: 3179159.08, closing_credit: 1243749.99, has_value: true, children: [] },
    { account: 'Exchange Gain/Loss - NSPL', account_name: 'Exchange Gain/Loss', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 654.5, credit: 4530.0, closing_debit: 654.5, closing_credit: 4530.0, has_value: true, children: [] },
    { account: 'Freight and Forwarding Charges - NSPL', account_name: 'Freight and Forwarding Charges', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 36900.0, credit: 0, closing_debit: 36900.0, closing_credit: 0, has_value: true, children: [] },
    { account: 'Marketing Expenses - NSPL', account_name: 'Marketing Expenses', currency: 'INR', indent: 0, opening_debit: 0, opening_credit: 0, debit: 14760.0, credit: 0, closing_debit: 14760.0, closing_credit: 0, has_value: true, children: [] },
  ],
};

export function nf(value: number) {
  if (!value) return '—';
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** GET /accounting/trial-balance?from_date=...&to_date=...&fiscal_year=... — replace body with axios/react-query call */
export async function fetchTrialBalance(_filters: TBFilters): Promise<TBResponse> {
  await new Promise((res) => setTimeout(res, 500));
  return DUMMY_TB;
}