import {
  IconCar,
  IconFileText,
  IconId,
  IconMessageCircle,
  IconNote,
  IconPhoneCall,
  IconReceipt2,
  IconSettingsAutomation,
  IconShieldCheck,
  IconWallet,
} from '@tabler/icons-react';
import type {
  AccountDetailData,
  ActivityItem,
  ActivityKind,
  BorrowerProfile,
  CollateralItem,
  DocIconKind,
  DocumentItem,
  FixedDepositSummary,
  InvestmentSummary,
  LoanAccountingEntry,
  LoanDetailData,
  LoanSummary,
  RepaymentRow,
  SavingsSummary,
} from '../../types/customerview';



export const brand = {
  // surfaces
  cream: '#F5F2EA',
  canvas: '#EFEAE0',
  paper: '#FFFFFF',

  // ink / text
  ink: '#241F3D',
  inkHover: '#332C55',
  inkSoft: '#6B6787',

  // primary — brand & interactive actions
  primary: '#4F3FF0',
  primaryHover: '#4132D6',
  primarySoft: '#EDEAFE',

  // success — healthy, on-track, positive money
  teal: '#0E8A73',
  tealSoft: '#DFF4EE',

  // warning — attention, watch-list, expiring
  gold: '#C7821A',
  goldSoft: '#FBEEDA',

  // danger — overdue, delinquent
  rose: '#D33F5E',
  roseSoft: '#FCE6EB',

  // info — neutral highlights, links, references
  sky: '#1D7FB7',
  skySoft: '#E4F1F9',

  // neutral — closed, inactive
  slate: '#6B7280',
  slateSoft: '#EEF0F2',
};

export const serif = { fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' };

/* ============================================================================
   HELPERS
============================================================================ */

export function formatK(amount: number, decimals = 0) {
  return `K ${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

/* ============================================================================
   STATUS / ICON / COLOR MAPS
============================================================================ */

export const loanStatusColor: Record<string, string> = {
  Active: 'teal',
  Delinquent: 'red',
  Closed: 'gray',
  Overdue: 'red',
};

export const accountStatusColor: Record<string, string> = {
  Active: 'teal',
  Inactive: 'gray',
  Closed: 'gray',
};

export const docIconMap: Record<DocIconKind, React.ReactNode> = {
  agreement: <IconFileText size={17} />,
  id: <IconId size={17} />,
  folder: <IconReceipt2 size={17} />,
  income: <IconWallet size={17} />,
  vehicle: <IconCar size={17} />,
  shield: <IconShieldCheck size={17} />,
};

export const docAccentMap: Record<DocIconKind, { bg: string; fg: string }> = {
  agreement: { bg: brand.primarySoft, fg: brand.primary },
  id: { bg: brand.skySoft, fg: brand.sky },
  folder: { bg: brand.slateSoft, fg: brand.slate },
  income: { bg: brand.tealSoft, fg: brand.teal },
  vehicle: { bg: brand.skySoft, fg: brand.sky },
  shield: { bg: brand.goldSoft, fg: brand.gold },
};

export const activityFilters: { key: 'all' | ActivityKind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'note', label: 'Notes' },
  { key: 'call', label: 'Calls' },
  { key: 'message', label: 'SMS & Email' },
  { key: 'system', label: 'System' },
];

export const activityKindLabel: Record<ActivityKind, string> = {
  system: 'System',
  call: 'Call',
  message: 'Msg',
  note: 'Note',
};

export const activityKindIcon: Record<ActivityKind, React.ReactNode> = {
  system: <IconSettingsAutomation size={12} />,
  call: <IconPhoneCall size={12} />,
  message: <IconMessageCircle size={12} />,
  note: <IconNote size={12} />,
};

export const activityKindTone: Record<ActivityKind, { bg: string; fg: string }> = {
  system: { bg: brand.slateSoft, fg: brand.slate },
  call: { bg: brand.skySoft, fg: brand.sky },
  message: { bg: brand.primarySoft, fg: brand.primary },
  note: { bg: brand.goldSoft, fg: brand.gold },
};

export const scheduleStatusColor: Record<string, string> = {
  'Paid on time': brand.teal,
  'Paid late': brand.gold,
  Overdue: brand.rose,
  Upcoming: '#D8D3C4',
};

/* ============================================================================
   MOCK DATA
============================================================================ */

export const MOCK_LOANS: LoanSummary[] = [
  {
    id: 'LN-2024-08841',
    loanNumber: 'LN-2024-08841',
    product: 'Business Growth Loan',
    status: 'Active',
    outstanding: 86420,
    nextInstallment: 4620,
    repaidPercent: 38,
  },
];

export const MOCK_INVESTMENTS: InvestmentSummary[] = [
  {
    id: 'INV-77021',
    refNumber: 'INV-77021',
    product: 'Money Market Fund',
    status: 'Active',
    currentBalance: 52000,
    maturity: '04 Mar 2027',
  },
];

export const MOCK_SAVINGS: SavingsSummary[] = [
  { id: 'SAV-33410', accountNumber: 'SAV-33410', status: 'Active', available: 6340.5 },
];

export const MOCK_FIXED_DEPOSITS: FixedDepositSummary[] = [
  { id: 'FD-19042', refNumber: 'FD-19042', status: 'Active', amount: 25000, maturity: '20 Sep 2026' },
];

export const DOCS: DocumentItem[] = [
  { id: 'd1', name: 'Loan Agreement.pdf', type: 'Agreement', status: 'Signed', uploadedOn: '12 Apr 2025', size: '1.2 MB', icon: 'agreement' },
  { id: 'd2', name: 'National ID.pdf', type: 'KYC', status: 'Verified', uploadedOn: '10 Apr 2025', size: '340 KB', icon: 'id' },
  { id: 'd3', name: 'KYC Form.pdf', type: 'KYC', status: 'Verified', uploadedOn: '10 Apr 2025', size: '810 KB', icon: 'folder' },
  { id: 'd4', name: 'Payslip_June2026.pdf', type: 'Income', status: 'Uploaded', uploadedOn: '02 Jul 2026', size: '220 KB', icon: 'income' },
  { id: 'd5', name: 'Collateral_LogBook.pdf', type: 'Collateral', status: 'Verified', uploadedOn: '11 Apr 2025', size: '1.5 MB', icon: 'vehicle' },
  { id: 'd6', name: 'Insurance_Certificate.pdf', type: 'Insurance', status: 'Expiring in 12 days', expiring: true, uploadedOn: '20 Sep 2025', size: '480 KB', icon: 'shield' },
];

export const ACTIVITY: ActivityItem[] = [
  { id: 'a1', title: 'Interest accrued for the current cycle', description: 'K 4,290 posted to the loan ledger', date: '02 Jul 2026 · 09:00', actor: 'System', kind: 'system' },
  { id: 'a2', title: 'Outbound call regarding overdue installment', description: 'Borrower promised payment by 03 Jul', date: '29 Jun 2026 · 14:22', actor: 'J. Phiri', kind: 'call' },
  { id: 'a3', title: 'Automated SMS reminder sent', description: '9 days overdue on current installment', date: '25 Jun 2026 · 08:00', actor: 'System', kind: 'message' },
  { id: 'a4', title: 'Field visit conducted at business premises', description: 'Borrower cited delayed customer payments as cause of delay', date: '20 Jun 2026 · 16:41', actor: 'Grace Mwansa', kind: 'note' },
  { id: 'a5', title: 'Penalty accrued — cycle overdue', description: 'K 1,570 posted to the loan ledger', date: '18 Jun 2026 · 00:05', actor: 'System', kind: 'system' },
  { id: 'a6', title: 'Email statement sent', description: 'Monthly statement delivered to registered email', date: '12 Jun 2026 · 08:00', actor: 'System', kind: 'message' },
  { id: 'a7', title: 'Account reviewed', description: 'Flagged for weekly monitoring', date: '05 Jun 2026 · 11:10', actor: 'Grace Mwansa', kind: 'note' },
  { id: 'a8', title: 'Courtesy call', description: 'Borrower confirmed receipt of statement', date: '01 Jun 2026 · 10:05', actor: 'J. Phiri', kind: 'call' },
];

// Builds a full Borrower 360 profile for any customer row from the Customer table.
export function getBorrowerProfile(customer: { id: number; name: string; mobile: string }): BorrowerProfile {
  const totalExposure = MOCK_LOANS.reduce((sum, l) => sum + l.outstanding, 0);
  return {
    customerId: customer.id,
    name: customer.name,
    custId: `CUST-${String(48213 + customer.id).padStart(7, '0')}`,
    status: 'Active',
    mobile: customer.mobile,
    nationalId: '221114/10/1',
    branch: 'Lusaka — Cairo Road',
    totalExposure,
    availableCredit: 40000,
    riskRating: 'Medium',
    kycStatus: 'Verified',
    relationshipSince: 'Mar 2023',
    relationshipManager: { name: 'Grace Mwansa', branch: 'Cairo Road branch', initials: 'GM' },
    loans: MOCK_LOANS,
    investments: MOCK_INVESTMENTS,
    savings: MOCK_SAVINGS,
    fixedDeposits: MOCK_FIXED_DEPOSITS,
    creditScore: 682,
  };
}

export function buildHistory(base: number): RepaymentRow[] {
  const rows: RepaymentRow[] = [];
  const receipts = ['RC-55214', 'RC-54890', 'RC-54401', 'RC-53988', 'RC-53512', 'RC-53077'];
  const dates = ['05 Jun 2026', '06 May 2026', '07 Apr 2026', '06 Mar 2026', '05 Feb 2026', '07 Jan 2026'];
  const methods = ['Mobile Money', 'Bank Transfer', 'Cash', 'Mobile Money', 'Bank Transfer', 'Cash'];
  const collectors = ['Field: J. Phiri', 'Auto-collect', 'Branch: Cairo Rd', 'Field: J. Phiri', 'Auto-collect', 'Branch: Cairo Rd'];
  let balance = base;
  for (let i = 0; i < 6; i++) {
    const principal = 8600 + i * 70;
    const interest = 14200 + (6 - i) * 300;
    const penalty = i % 3 === 1 ? 300 : 0;
    rows.push({
      receipt: receipts[i],
      date: dates[i],
      method: methods[i],
      collector: collectors[i],
      principal,
      interest,
      penalty,
      total: 24650,
      balance,
    });
    balance += 24650 - principal;
  }
  return rows;
}

export const COLLATERAL: CollateralItem[] = [
  {
    id: "c1",
    title: "Toyota Hilux — 2021",
    type: "Motor vehicle",
    subtitle: "Registration ABC 4471",
    marketValue: 320000,
    forcedSaleValue: 224000,
    status: "Verified",
    ownership: "Borrower",
  },
  {
    id: "c2",
    title: "Residential Land Title",
    type: "Title Deed",
    subtitle: "Plot 4471/L, Chalala",
    marketValue: 410000,
    forcedSaleValue: 287000,
    status: "Insurance pending",
    ownership: "Borrower",
  },
];

// Generic generator so every loan (not just the one in the reference screenshots)
// has plausible tab content.
export function getLoanDetail(loan: LoanSummary): LoanDetailData {
  const isClosed = loan.status === 'Closed';
  const isDelinquent = loan.status === 'Delinquent';
  const originalAmount = loan.status === 'Active' ? 480000 : loan.outstanding * 5 || 60000;

  return {
    loanNumber: loan.loanNumber,
    collateral: COLLATERAL,
    product: 'SME Working Capital',
    loanStatusLabel: isClosed ? 'Closed' : isDelinquent ? 'Overdue — Watch' : 'On track',
    purpose: 'Working capital expansion',
    officer: 'Grace Mwansa',
    totalOutstanding: loan.outstanding,
    principalOutstanding: Math.round(loan.outstanding * 0.92),
    interestOutstanding: Math.round(loan.outstanding * 0.06),
    penaltyOutstanding: Math.round(loan.outstanding * 0.02),
    nextInstallment: loan.nextInstallment,
    dueDate: isClosed ? '—' : '02 Aug 2026',
    dpd: loan.dpd ?? 0,
    interestRate: '19.5%',
    maturityDate: '14 Nov 2026',
    tenureMonths: 24,
    elapsedMonths: Math.round((loan.repaidPercent / 100) * 24),
    originalAmount,
    disbursedAmount: originalAmount,
    repaymentFrequency: 'Monthly',
    remainingTenure: Math.max(0, 24 - Math.round((loan.repaidPercent / 100) * 24)),
    tranches: [
      {
        id: 't1',
        label: 'Tranche 1',
        amount: Math.round(originalAmount * 0.625),
        date: '12 Apr 2025',
        method: 'Bank Transfer',
        account: 'Acc ****4471',
        ref: 'DSB-88041-1',
        approvedBy: 'S. Chulu',
        status: 'Completed',
      },
      {
        id: 't2',
        label: 'Tranche 2',
        amount: Math.round(originalAmount * 0.375),
        date: '28 Apr 2025',
        method: 'Bank Transfer',
        account: 'Acc ****4471',
        ref: 'DSB-88041-2',
        approvedBy: 'S. Chulu',
        status: 'Completed',
      },
    ],
    schedule: Array.from({ length: 12 }).map((_, i) => {
      let status: LoanDetailData['schedule'][number]['status'] = 'Upcoming';
      if (i < 6) status = i === 1 ? 'Paid late' : 'Paid on time';
      else if (i === 6 && isDelinquent) status = 'Overdue';
      return {
        id: `s${i + 1}`,
        no: i + 1,
        dueDate: `0${(i % 9) + 1} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} 2026`,
        amount: 24650,
        status,
      };
    }),
    history: buildHistory(loan.outstanding + 24650 * 6),
    accounting: [
      { date: '05 Jun 2026', description: 'Repayment received', debit: 0, credit: 24650, balance: loan.outstanding },
      { date: '06 May 2026', description: 'Repayment received', debit: 0, credit: 24650, balance: loan.outstanding + 24650 },
      { date: '30 Apr 2025', description: 'Loan disbursement', debit: originalAmount, credit: 0, balance: originalAmount },
    ],
    documents: DOCS,
    documentChecklist: { complete: 5, total: 6, missingLabel: 'Updated insurance cert.' },
    activity: ACTIVITY,
  };
}

export function getSavingsDetail(savings: SavingsSummary): AccountDetailData {
  return {
    accountNumber: savings.accountNumber,
    product: 'Flexi Save Account',
    statusLabel: savings.status,
    currentBalance: savings.available,
    avgMonthlyInflow: 12400,
    interestEarnedYtd: 810,
    interestRate: '3.25% Variable',
    openedDate: '11 Mar 2023',
    history: buildHistory(savings.available),
    documents: DOCS,
    documentChecklist: { complete: 6, total: 6, missingLabel: null },
    activity: ACTIVITY,
  };
}

export function getInvestmentDetail(inv: InvestmentSummary): AccountDetailData {
  return {
    accountNumber: inv.refNumber,
    product: inv.product,
    statusLabel: inv.status,
    currentBalance: inv.currentBalance,
    interestRate: '6.8% p.a.',
    openedDate: '04 Mar 2024',
    maturityDate: inv.maturity,
    tenureMonths: 36,
    elapsedMonths: 16,
    history: buildHistory(inv.currentBalance),
    documents: DOCS,
    documentChecklist: { complete: 5, total: 6, missingLabel: 'Updated insurance cert.' },
    activity: ACTIVITY,
  };
}

export function getFixedDepositDetail(fd: FixedDepositSummary): AccountDetailData {
  return {
    accountNumber: fd.refNumber,
    product: 'Fixed Deposit',
    statusLabel: fd.status,
    currentBalance: fd.amount,
    interestRate: '8.2% p.a.',
    openedDate: '20 Sep 2025',
    maturityDate: fd.maturity,
    tenureMonths: 12,
    elapsedMonths: 10,
    history: buildHistory(fd.amount),
    documents: DOCS,
    documentChecklist: { complete: 6, total: 6, missingLabel: null },
    activity: ACTIVITY,
  };
}


export type { LoanAccountingEntry };