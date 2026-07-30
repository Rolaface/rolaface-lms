

export interface COAAccount {
  name: string; 
  account_name: string;
  account_type?: string;
  root_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  is_group: boolean;
  disabled?: boolean;
  account_currency: string;
  balance: number; // in base currency
  balance_in_account_currency: number;
  children?: COAAccount[];
}

export const BASE_CURRENCY = 'INR';

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export const symbolFor = (ccy: string) => CURRENCY_SYMBOLS[ccy] ?? ccy;

export function formatAmount(currency: string, amount: number) {
  return `${symbolFor(currency)} ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

const DUMMY_ACCOUNTS: COAAccount[] = [
  {
    name: 'ASSETS', account_name: 'Assets', root_type: 'Asset', is_group: true,
    account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
    children: [
      {
        name: 'CUR-ASSETS', account_name: 'Current Assets', root_type: 'Asset', is_group: true,
        account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
        children: [
          { name: 'CASH', account_name: 'Cash in Hand', account_type: 'Cash', root_type: 'Asset', is_group: false, account_currency: 'INR', balance: 45000, balance_in_account_currency: 45000 },
          { name: 'HDFC', account_name: 'HDFC Bank - Current A/c', account_type: 'Bank', root_type: 'Asset', is_group: false, account_currency: 'INR', balance: 812500, balance_in_account_currency: 812500 },
          { name: 'AR-INR', account_name: 'Accounts Receivable', account_type: 'Receivable', root_type: 'Asset', is_group: false, account_currency: 'INR', balance: 264300, balance_in_account_currency: 264300 },
          { name: 'AR-USD', account_name: 'Accounts Receivable - USD', account_type: 'Receivable', root_type: 'Asset', is_group: false, account_currency: 'USD', balance: 590400, balance_in_account_currency: 7100 },
        ],
      },
      {
        name: 'FIX-ASSETS', account_name: 'Fixed Assets', root_type: 'Asset', is_group: true,
        account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
        children: [
          { name: 'OFF-EQ', account_name: 'Office Equipment', account_type: 'Fixed Asset', root_type: 'Asset', is_group: false, account_currency: 'INR', balance: 138000, balance_in_account_currency: 138000 },
          { name: 'FURN', account_name: 'Furniture & Fixtures', account_type: 'Fixed Asset', root_type: 'Asset', is_group: false, account_currency: 'INR', balance: 92500, balance_in_account_currency: 92500, disabled: true },
        ],
      },
    ],
  },
  {
    name: 'LIABILITIES', account_name: 'Liabilities', root_type: 'Liability', is_group: true,
    account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
    children: [
      { name: 'AP', account_name: 'Accounts Payable', account_type: 'Payable', root_type: 'Liability', is_group: false, account_currency: 'INR', balance: 187400, balance_in_account_currency: 187400 },
      { name: 'GST-PAY', account_name: 'GST Payable', account_type: 'Tax', root_type: 'Liability', is_group: false, account_currency: 'INR', balance: 34600, balance_in_account_currency: 34600 },
    ],
  },
  {
    name: 'EQUITY', account_name: 'Equity', root_type: 'Equity', is_group: true,
    account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
    children: [
      { name: 'CAPITAL', account_name: "Owner's Capital", account_type: 'Equity', root_type: 'Equity', is_group: false, account_currency: 'INR', balance: 950000, balance_in_account_currency: 950000 },
      { name: 'RETAINED', account_name: 'Retained Earnings', account_type: 'Equity', root_type: 'Equity', is_group: false, account_currency: 'INR', balance: 210800, balance_in_account_currency: 210800 },
    ],
  },
  {
    name: 'INCOME', account_name: 'Income', root_type: 'Income', is_group: true,
    account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
    children: [
      { name: 'SALES', account_name: 'Sales Revenue', account_type: 'Income Account', root_type: 'Income', is_group: false, account_currency: 'INR', balance: 1420000, balance_in_account_currency: 1420000 },
      { name: 'SERVICE-REV', account_name: 'Service Revenue', account_type: 'Income Account', root_type: 'Income', is_group: false, account_currency: 'INR', balance: 386000, balance_in_account_currency: 386000 },
    ],
  },
  {
    name: 'EXPENSES', account_name: 'Expenses', root_type: 'Expense', is_group: true,
    account_currency: 'INR', balance: 0, balance_in_account_currency: 0,
    children: [
      { name: 'SALARY', account_name: 'Salaries & Wages', account_type: 'Expense Account', root_type: 'Expense', is_group: false, account_currency: 'INR', balance: 512000, balance_in_account_currency: 512000 },
      { name: 'RENT', account_name: 'Rent Expense', account_type: 'Expense Account', root_type: 'Expense', is_group: false, account_currency: 'INR', balance: 96000, balance_in_account_currency: 96000 },
      { name: 'UTIL', account_name: 'Utilities', account_type: 'Expense Account', root_type: 'Expense', is_group: false, account_currency: 'INR', balance: 21400, balance_in_account_currency: 21400 },
    ],
  },
];

/** GET /accounting/chart-of-accounts — replace body with axios/react-query call */
export async function fetchChartOfAccounts(): Promise<COAAccount[]> {
  await new Promise((res) => setTimeout(res, 500));
  return DUMMY_ACCOUNTS;
}

/** DELETE /accounting/accounts/:name — replace body with a real mutation */
export async function deleteAccount(accountName: string): Promise<void> {
  await new Promise((res) => setTimeout(res, 200));
  // no-op for now — logic layer removes it optimistically from local state
  void accountName;
}