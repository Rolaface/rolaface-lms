/* ============================================================================
   TYPES
============================================================================ */

export type LoanStatus = 'Active' | 'Delinquent' | 'Closed' | 'Overdue';
export type AccountStatus = 'Active' | 'Inactive' | 'Closed';

export interface LoanSummary {
  id: string;
  loanNumber: string;
  product: string;
  status: LoanStatus;
  outstanding: number;
  nextInstallment: number | null;
  repaidPercent: number;
  dpd?: number;
}

export interface InvestmentSummary {
  id: string;
  refNumber: string;
  product: string;
  status: AccountStatus;
  currentBalance: number;
  maturity: string;
}

export interface RepaymentHistoryItem {
  receipt: string;
  date: string;
  method: string;
  collector: string;
  principal: number;
  interest: number;
  penalty: number;
  total: number;
  balance: number;
}

export interface SavingsSummary {
  id: string;
  accountNumber: string;
  status: AccountStatus;
  available: number;
}

export interface FixedDepositSummary {
  id: string;
  refNumber: string;
  status: AccountStatus;
  amount: number;
  maturity: string;
}

export type SelectedItem =
  | { type: 'profile' }
  | { type: 'loan'; id: string }
  | { type: 'investment'; id: string }
  | { type: 'savings'; id: string }
  | { type: 'fixedDeposit'; id: string }
  | null;

export interface BorrowerProfile {
  customerId: string;
  name: string;
  custId: string;
  status: 'Active' | 'Inactive';
  mobile: string;
  nationalId?: string;
  branch?: string;
  totalExposure?: number;
  availableCredit?: number;
  riskRating?: 'Low' | 'Medium' | 'High';
  kycStatus?: 'Verified' | 'Pending' | 'Rejected';
  relationshipSince?: string;
  relationshipManager?: { name: string; branch: string; initials: string };
  loans?: LoanSummary[];
  investments?: InvestmentSummary[];
  savings?: SavingsSummary[];
  fixedDeposits?: FixedDepositSummary[];
  creditScore?: number;
}

export interface CollateralItem {
  id: string;
  title: string;
  type: string;
  marketValue: number;
  forcedSaleValue: number;
  status: string;
  subtitle?: string;
  ownership?: string;
}

export interface Tranche {
  id: string;
  label: string;
  amount: number;
  date: string;
  method: string;
  account: string;
  ref: string;
  approvedBy: string;
  status: 'Completed' | 'Pending';
}

export interface ScheduleInstallment {
  id: string;
  no: number;
  dueDate: string;
  amount: number;
  status: 'Paid on time' | 'Paid late' | 'Overdue' | 'Upcoming';
}

export interface RepaymentRow {
  receipt: string;
  date: string;
  method: string;
  collector: string;
  principal: number;
  interest: number;
  penalty: number;
  total: number;
  balance: number;
}

export interface LedgerRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export type DocIconKind = 'agreement' | 'id' | 'folder' | 'income' | 'vehicle' | 'shield';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: string; // e.g. Signed / Verified / Uploaded / Expiring in 12 days
  expiring?: boolean;
  uploadedOn: string;
  size: string;
  icon: DocIconKind;
}

export type ActivityKind = 'system' | 'call' | 'message' | 'note';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  actor: string;
  kind: ActivityKind;
}

export interface DocumentChecklist {
  complete: number;
  total: number;
  missingLabel: string | null;
}

export interface LoanDetailData {
  loanNumber: string;
  product: string;
  loanStatusLabel: string;
  purpose: string;
  officer: string;
  totalOutstanding: number;
  principalOutstanding: number;
  interestOutstanding: number;
  penaltyOutstanding: number;
  nextInstallment: number | null;
  dueDate: string;
  dpd: number;
  interestRate: string;
  maturityDate: string;
  tenureMonths: number;
  elapsedMonths: number;
  originalAmount: number;
  disbursedAmount: number;
  repaymentFrequency: string;
  remainingTenure: number;
  tranches: Tranche[];
  schedule: ScheduleInstallment[];
  history: RepaymentRow[];
  accounting: LedgerRow[];
  documents: DocumentItem[];
  documentChecklist: DocumentChecklist;
  activity: ActivityItem[];
  collateral: CollateralItem[];
}

export interface LoanAccountingEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountDetailData {
  accountNumber: string;
  product: string;
  statusLabel: string;
  currentBalance: number;
  avgMonthlyInflow?: number;
  interestEarnedYtd?: number;
  interestRate: string;
  openedDate: string;
  maturityDate?: string;
  tenureMonths?: number;
  elapsedMonths?: number;
  history: RepaymentRow[];
  documents: DocumentItem[];
  documentChecklist: DocumentChecklist;
  activity: ActivityItem[];
}