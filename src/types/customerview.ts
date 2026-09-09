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



export interface NextOfKinInfo {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  relationship?: string | null;
  phone?: string;
  address?: string;
  district?: string;
  city?: string;
  postalCode?: string;
}

export interface DirectorOrShareholder {
  name?: string;
  role?: string;
  ownershipPercent?: number | string;
}

export interface IdentificationDocumentInfo {
  name: string;
  number?: string;
  expiryDate?: string;
  verification?: string;
}

export interface ComplianceCheckInfo {
  status?: string;
}

export interface FinancialProfileInfo {
  educationLevel?: string | null;
  employmentType?: string | null;
  sourceOfIncome?: string | null;
  monthlyIncome?: number | null;
  annualIncome?: number | null;
  creditRiskCategory?: string | null;
  relationshipManager?: string | null;
}

export interface CreditAssessmentInfo {
  bureau?: string;
  score?: number | null;
  fetchedAt?: string | null;
  activeFacilities?: number;
  defaults?: number;
  delinquencies?: number;
  recentInquiries?: number;
  status?: string;
}

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
   currency?: string;
  riskRating?: 'Low' | 'Medium' | 'High' | string;
  kycStatus?: 'Verified' | 'Pending' | 'Rejected' | string;
  relationshipSince?: string;
  relationshipManager?: { name: string; branch: string; initials: string };
  lastUpdated?: string;  
  loans?: LoanSummary[];
  investments?: InvestmentSummary[];
  savings?: SavingsSummary[];
  fixedDeposits?: FixedDepositSummary[];
  creditScore?: number;

  // --- Identity (PersonalInfoPanel) ---
  type?: 'Individual' | 'Company' | 'Business';
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  gender?: string | null;
  dateOfBirth?: string;
  nationality?: string | null;
  occupation?: string;
  industry?: string | null;
  employer?: string;

  // --- Business identity ---
  registeredCompanyName?: string;
  registrationNumber?: string;
  incorporationDate?: string;
  employees?: number;
  annualRevenue?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  directorsAndShareholders?: DirectorOrShareholder[];

  // --- Contact ---
  email?: string;
  alternateMobile?: string;
  preferredCommunication?: string;
  residentialAddress?: string;
  country?: string | null;
  province?: string | null;
  district?: string;
  postalCode?: string;
  mailingAddress?: string;

  // --- Next of kin ---
  nextOfKin?: NextOfKinInfo;

  // --- KYC & Compliance ---
  identificationDocuments?: IdentificationDocumentInfo[];
  complianceChecks?: {
    kycVerification?: ComplianceCheckInfo;
    amlScreening?: ComplianceCheckInfo;
    sanctionsScreening?: ComplianceCheckInfo;
    pepStatus?: ComplianceCheckInfo;
    fatca?: ComplianceCheckInfo;
    crs?: ComplianceCheckInfo;
  };
  requiredDocuments?: { name: string; status?: string }[];

  // --- Financial & Lending ---
  exposure?: number;
  creditAssessment?: CreditAssessmentInfo;
  financialProfile?: FinancialProfileInfo;
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