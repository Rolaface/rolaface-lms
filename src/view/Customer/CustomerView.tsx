import { useMemo, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Kbd,
  Paper,
  Progress,
  RingProgress,
  Table,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconBell,
  IconCar,
  IconChartLine,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClockHour4,
  IconCreditCard,
  IconFileText,
  IconId,
  IconMessage,
  IconMessageCircle,
  IconNote,
  IconPhoneCall,
  IconPigMoney,
  IconReceipt2,
  IconRefreshDot,
  IconSearch,
  IconSettingsAutomation,
  IconShieldCheck,
  IconUser,
  IconWallet,
} from '@tabler/icons-react';

/* ============================================================================
   TYPES
============================================================================ */

type LoanStatus = 'Active' | 'Delinquent' | 'Closed' | 'Overdue';
type AccountStatus = 'Active' | 'Inactive' | 'Closed';

interface LoanSummary {
  id: string;
  loanNumber: string;
  product: string;
  status: LoanStatus;
  outstanding: number;
  nextInstallment: number | null;
  repaidPercent: number;
  dpd?: number;
}

interface InvestmentSummary {
  id: string;
  refNumber: string;
  product: string;
  status: AccountStatus;
  currentBalance: number;
  maturity: string;
}

interface SavingsSummary {
  id: string;
  accountNumber: string;
  status: AccountStatus;
  available: number;
}

interface FixedDepositSummary {
  id: string;
  refNumber: string;
  status: AccountStatus;
  amount: number;
  maturity: string;
}

type SelectedItem =
  | { type: 'loan'; id: string }
  | { type: 'investment'; id: string }
  | { type: 'savings'; id: string }
  | { type: 'fixedDeposit'; id: string }
  | null;

export interface BorrowerProfile {
  customerId: number;
  name: string;
  custId: string;
  status: 'Active' | 'Inactive';
  mobile: string;
  nationalId: string;
  branch: string;
  totalExposure: number;
  availableCredit: number;
  riskRating: 'Low' | 'Medium' | 'High';
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  relationshipSince: string;
  relationshipManager: { name: string; branch: string; initials: string };
  loans: LoanSummary[];
  investments: InvestmentSummary[];
  savings: SavingsSummary[];
  fixedDeposits: FixedDepositSummary[];
}

interface Tranche {
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

interface ScheduleInstallment {
  id: string;
  no: number;
  dueDate: string;
  amount: number;
  status: 'Paid on time' | 'Paid late' | 'Overdue' | 'Upcoming';
}

interface RepaymentRow {
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

interface LedgerRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

type DocIconKind = 'agreement' | 'id' | 'folder' | 'income' | 'vehicle' | 'shield';

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: string; // e.g. Signed / Verified / Uploaded / Expiring in 12 days
  expiring?: boolean;
  uploadedOn: string;
  size: string;
  icon: DocIconKind;
}

type ActivityKind = 'system' | 'call' | 'message' | 'note';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  actor: string;
  kind: ActivityKind;
}

interface DocumentChecklist {
  complete: number;
  total: number;
  missingLabel: string | null;
}

interface LoanDetailData {
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
}

interface AccountDetailData {
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

/* ============================================================================
   DESIGN TOKENS
   A ledger-paper backdrop stays, but the accent system is now semantic
   rather than decorative: indigo carries brand/primary actions, teal reads
   as "healthy money", amber as "needs attention", rose as "past due", and
   sky as neutral/informational. Every card, badge and icon pulls from this
   one map so colour always means the same thing wherever it shows up.
============================================================================ */

const brand = {
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

const serif = { fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' };

/* ============================================================================
   HELPERS
============================================================================ */

function formatK(amount: number, decimals = 0) {
  return `K ${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

/* ============================================================================
   MOCK DATA
============================================================================ */

const MOCK_LOANS: LoanSummary[] = [
  {
    id: 'LN-2024-08841',
    loanNumber: 'LN-2024-08841',
    product: 'Business Growth Loan',
    status: 'Active',
    outstanding: 86420,
    nextInstallment: 4620,
    repaidPercent: 38,
  },
  {
    id: 'LN-2023-05512',
    loanNumber: 'LN-2023-05512',
    product: 'Personal Instalment Loan',
    status: 'Delinquent',
    outstanding: 23180,
    nextInstallment: 2110,
    repaidPercent: 58,
    dpd: 37,
  },
  {
    id: 'LN-2022-01187',
    loanNumber: 'LN-2022-01187',
    product: 'Auto Loan',
    status: 'Closed',
    outstanding: 0,
    nextInstallment: null,
    repaidPercent: 100,
  },
];

const MOCK_INVESTMENTS: InvestmentSummary[] = [
  {
    id: 'INV-77021',
    refNumber: 'INV-77021',
    product: 'Money Market Fund',
    status: 'Active',
    currentBalance: 52000,
    maturity: '04 Mar 2027',
  },
];

const MOCK_SAVINGS: SavingsSummary[] = [
  { id: 'SAV-33410', accountNumber: 'SAV-33410', status: 'Active', available: 6340.5 },
];

const MOCK_FIXED_DEPOSITS: FixedDepositSummary[] = [
  { id: 'FD-19042', refNumber: 'FD-19042', status: 'Active', amount: 25000, maturity: '20 Sep 2026' },
];

const DOCS: DocumentItem[] = [
  { id: 'd1', name: 'Loan Agreement.pdf', type: 'Agreement', status: 'Signed', uploadedOn: '12 Apr 2025', size: '1.2 MB', icon: 'agreement' },
  { id: 'd2', name: 'National ID.pdf', type: 'KYC', status: 'Verified', uploadedOn: '10 Apr 2025', size: '340 KB', icon: 'id' },
  { id: 'd3', name: 'KYC Form.pdf', type: 'KYC', status: 'Verified', uploadedOn: '10 Apr 2025', size: '810 KB', icon: 'folder' },
  { id: 'd4', name: 'Payslip_June2026.pdf', type: 'Income', status: 'Uploaded', uploadedOn: '02 Jul 2026', size: '220 KB', icon: 'income' },
  { id: 'd5', name: 'Collateral_LogBook.pdf', type: 'Collateral', status: 'Verified', uploadedOn: '11 Apr 2025', size: '1.5 MB', icon: 'vehicle' },
  { id: 'd6', name: 'Insurance_Certificate.pdf', type: 'Insurance', status: 'Expiring in 12 days', expiring: true, uploadedOn: '20 Sep 2025', size: '480 KB', icon: 'shield' },
];

const ACTIVITY: ActivityItem[] = [
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
  };
}

function buildHistory(base: number): RepaymentRow[] {
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

// Generic generator so every loan (not just the one in the reference screenshots)
// has plausible tab content.
function getLoanDetail(loan: LoanSummary): LoanDetailData {
  const isClosed = loan.status === 'Closed';
  const isDelinquent = loan.status === 'Delinquent';
  const originalAmount = loan.status === 'Active' ? 480000 : loan.outstanding * 5 || 60000;

  return {
    loanNumber: loan.loanNumber,
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
      let status: ScheduleInstallment['status'] = 'Upcoming';
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

function getSavingsDetail(savings: SavingsSummary): AccountDetailData {
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

function getInvestmentDetail(inv: InvestmentSummary): AccountDetailData {
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

function getFixedDepositDetail(fd: FixedDepositSummary): AccountDetailData {
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

/* ============================================================================
   SMALL SHARED BITS
============================================================================ */

function OverviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Text fz={10} fw={700} c="dimmed" className="tracking-wider mb-1">
        {label}
      </Text>
      <Text fz="sm" fw={600} c="gray.9" className="font-mono">
        {value}
      </Text>
    </div>
  );
}

function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline mb-3">
      <Text fz="lg" fw={600} c="gray.9" style={serif}>
        {title}
      </Text>
      {aside && (
        <Text fz="xs" c="dimmed">
          {aside}
        </Text>
      )}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'active' | 'warn' | 'neutral' }) {
  const tones = {
    active: { dot: brand.teal, bg: brand.tealSoft, text: '#0B5D4D' },
    warn: { dot: brand.gold, bg: brand.goldSoft, text: '#8A5A0F' },
    neutral: { dot: brand.slate, bg: brand.slateSoft, text: '#4B5563' },
  } as const;
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ backgroundColor: t.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: t.dot }} />
      <Text fz="xs" fw={700} style={{ color: t.text }}>
        {label}
      </Text>
    </span>
  );
}

// Gradient tenure indicator — ink to gold — matches the "elapsed vs total" read of a
// physical loan ledger rather than a generic progress bar.
function TenureBar({ elapsed, total }: { elapsed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  return (
    <div className="pt-3 border-t border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <Text fz="xs" c="dimmed">
          Tenure elapsed
        </Text>
        <Text fz="xs" c="dimmed" className="font-mono">
          {elapsed} / {total} months
        </Text>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: brand.slateSoft }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brand.primary}, ${brand.gold})` }}
        />
      </div>
    </div>
  );
}

const loanStatusColor: Record<string, string> = {
  Active: 'teal',
  Delinquent: 'red',
  Closed: 'gray',
  Overdue: 'red',
};

const accountStatusColor: Record<string, string> = {
  Active: 'teal',
  Inactive: 'gray',
  Closed: 'gray',
};

const docIconMap: Record<DocIconKind, React.ReactNode> = {
  agreement: <IconFileText size={17} />,
  id: <IconId size={17} />,
  folder: <IconReceipt2 size={17} />,
  income: <IconWallet size={17} />,
  vehicle: <IconCar size={17} />,
  shield: <IconShieldCheck size={17} />,
};

const docAccentMap: Record<DocIconKind, { bg: string; fg: string }> = {
  agreement: { bg: brand.primarySoft, fg: brand.primary },
  id: { bg: brand.skySoft, fg: brand.sky },
  folder: { bg: brand.slateSoft, fg: brand.slate },
  income: { bg: brand.tealSoft, fg: brand.teal },
  vehicle: { bg: brand.skySoft, fg: brand.sky },
  shield: { bg: brand.goldSoft, fg: brand.gold },
};

function DocumentCard({ doc }: { doc: DocumentItem }) {
  const accent = doc.expiring ? { bg: brand.roseSoft, fg: brand.rose } : docAccentMap[doc.icon];
  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      className="flex items-center gap-3 transition-shadow hover:shadow-md"
      style={{ borderColor: '#EDEAE0', boxShadow: '0 1px 2px rgba(36,31,61,0.06)' }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent.bg, color: accent.fg }}
      >
        {docIconMap[doc.icon]}
      </div>
      <div className="min-w-0">
        <Text fz="xs" fw={700} c="gray.9" truncate>
          {doc.name}
        </Text>
        <Text fz={11} fw={600} c={doc.expiring ? undefined : 'dimmed'} style={doc.expiring ? { color: brand.rose } : undefined}>
          {doc.status} · {doc.size}
        </Text>
      </div>
    </Paper>
  );
}

/* ============================================================================
   RIGHT RAIL — swaps by active tab: risk snapshot (default), document
   status (Documents tab), quick log (Activity tab)
============================================================================ */

function RiskSnapshotPanel({ borrower }: { borrower: BorrowerProfile }) {

  const kycTone = borrower.kycStatus === 'Verified' ? brand.teal : borrower.kycStatus === 'Pending' ? brand.gold : brand.rose;
  const riskTone = borrower.riskRating === 'Low' ? brand.teal : borrower.riskRating === 'Medium' ? brand.gold : brand.rose;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper
        radius="lg"
        p="md"
        style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}
      >
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">
          RISK SNAPSHOT
        </Text>



        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              KYC status
            </Text>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: kycTone }} />
              <Text fz="xs" fw={700} c="gray.9">
                {borrower.kycStatus}
              </Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Risk rating
            </Text>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: riskTone }} />
              <Text fz="xs" fw={700} c="gray.9">
                {borrower.riskRating}
              </Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Relationship since
            </Text>
            <Text fz="xs" fw={700} c="gray.9">
              {borrower.relationshipSince}
            </Text>
          </div>
        </div>
      </Paper>

      <Paper
        radius="lg"
        p="md"
        style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}
      >
        <Text fz="xs" fw={700} c="gray.9" className="mb-3">
          Relationship manager
        </Text>
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={38}
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}
          >
            {borrower.relationshipManager.initials}
          </Avatar>
          <div>
            <Text fz="xs" fw={700} c="gray.9">
              {borrower.relationshipManager.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {borrower.relationshipManager.branch}
            </Text>
          </div>
        </div>
        <Button
          fullWidth
          size="xs"
          variant="light"
          styles={{ root: { backgroundColor: brand.primarySoft, color: brand.primary } }}
          leftSection={<IconMessage size={14} />}
        >
          Message RM
        </Button>
      </Paper>
    </div>
  );
}

function DocumentStatusPanel({ checklist }: { checklist: DocumentChecklist }) {
  const pct = checklist.total > 0 ? Math.round((checklist.complete / checklist.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">
          DOCUMENT STATUS
        </Text>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: brand.slateSoft }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: checklist.missingLabel ? brand.gold : brand.teal }}
          />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Complete
            </Text>
            <Text fz="xs" fw={700} c="gray.9" className="font-mono">
              {checklist.complete} / {checklist.total}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Missing
            </Text>
            <Text fz="xs" fw={700} style={{ color: checklist.missingLabel ? brand.gold : undefined }} c={checklist.missingLabel ? undefined : 'gray.9'}>
              {checklist.missingLabel ?? 'None'}
            </Text>
          </div>
        </div>
        <Button
          fullWidth
          size="xs"
          styles={{ root: { backgroundColor: brand.primary } }}
          disabled={!checklist.missingLabel}
        >
          Request from borrower
        </Button>
      </Paper>
    </div>
  );
}

function QuickLogPanel() {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">
          QUICK LOG
        </Text>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="xs" styles={{ root: { backgroundColor: brand.primary } }} leftSection={<IconNote size={14} />}>
            Add note
          </Button>
          <Button
            fullWidth
            size="xs"
            variant="light"
            styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }}
            leftSection={<IconPhoneCall size={14} />}
          >
            Log a call
          </Button>
        </div>
      </Paper>
    </div>
  );
}



/* ============================================================================
   ACTIVITY FEED — filter pills + timeline rows
============================================================================ */

const activityFilters: { key: 'all' | ActivityKind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'note', label: 'Notes' },
  { key: 'call', label: 'Calls' },
  { key: 'message', label: 'SMS & Email' },
  { key: 'system', label: 'System' },
];

const activityKindLabel: Record<ActivityKind, string> = {
  system: 'System',
  call: 'Call',
  message: 'Msg',
  note: 'Note',
};

const activityKindIcon: Record<ActivityKind, React.ReactNode> = {
  system: <IconSettingsAutomation size={12} />,
  call: <IconPhoneCall size={12} />,
  message: <IconMessageCircle size={12} />,
  note: <IconNote size={12} />,
};

const activityKindTone: Record<ActivityKind, { bg: string; fg: string }> = {
  system: { bg: brand.slateSoft, fg: brand.slate },
  call: { bg: brand.skySoft, fg: brand.sky },
  message: { bg: brand.primarySoft, fg: brand.primary },
  note: { bg: brand.goldSoft, fg: brand.gold },
};

function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');
  const filtered = filter === 'all' ? activity : activity.filter((a) => a.kind === filter);

  return (
    <Paper radius="lg" className="p-4" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {activityFilters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={
                active
                  ? { backgroundColor: brand.primary, color: '#fff', borderColor: brand.primary }
                  : { backgroundColor: '#fff', color: '#4B5563', borderColor: '#E5E7EB' }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {filtered.map((a, idx) => {
          const tone = activityKindTone[a.kind];
          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1"
                  style={{ borderColor: tone.fg, backgroundColor: '#fff' }}
                />
                {idx < filtered.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
              </div>
              <div className="pb-5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <Text fz={10} c="dimmed" className="font-mono">
                    {a.date}
                  </Text>
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    {activityKindIcon[a.kind]}
                    <Text fz={9} fw={700} className="tracking-wide">
                      {activityKindLabel[a.kind].toUpperCase()}
                    </Text>
                  </span>
                </div>
                <Text fz="xs" fw={600} c="gray.9">
                  {a.title}
                </Text>
                <Text fz={11} c="dimmed" className="mt-0.5">
                  {a.description}
                </Text>
                <Text fz={10} c="dimmed" className="mt-0.5">
                  {a.actor}
                </Text>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <Text fz="xs" c="dimmed" className="py-3">
            No entries in this filter.
          </Text>
        )}
      </div>
    </Paper>
  );
}

/* ============================================================================
   LEFT SIDEBAR (customer summary + loans/investments/savings/FDs)
============================================================================ */

function BorrowerSidebar({
  borrower,
  collapsed,
  onToggleCollapsed,
  onBack,
  selected,
  onSelect,
}: {
  borrower: BorrowerProfile;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
  selected: SelectedItem;
  onSelect: (item: SelectedItem) => void;
}) {
  const isSelected = (type: 'loan' | 'investment' | 'savings' | 'fixedDeposit', id: string) =>
    selected?.type === type && selected.id === id;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 w-12 shrink-0 border-r border-gray-200 bg-white py-3">
        <ActionIcon variant="subtle" color="gray" onClick={onToggleCollapsed}>
          <IconChevronRight size={16} />
        </ActionIcon>
        <Avatar radius="xl" size={32} style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}>
          {initialsOf(borrower.name)}
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
        </ActionIcon>
      
        <ActionIcon variant="subtle" color="gray" size="sm" className="ml-auto" onClick={onToggleCollapsed}>
          <IconChevronLeft size={16} />
        </ActionIcon>
      </div>

      {/* Customer summary */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={44}
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}
          >
            {initialsOf(borrower.name)}
          </Avatar>
          <div>
            <Text fz="sm" fw={700} c="gray.9">
              {borrower.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {borrower.custId}
            </Text>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <Badge
            variant="light"
            size="sm"
            styles={{ root: { fontSize: 10, backgroundColor: brand.tealSoft, color: brand.teal } }}
          >
            {borrower.status}
          </Badge>
        
        </div>
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Mobile
            </Text>
            <Text fz="xs" c="gray.7" className="font-mono">
              {borrower.mobile}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              National ID
            </Text>
            <Text fz="xs" c="gray.7">
              {borrower.nationalId}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Branch
            </Text>
            <Text fz="xs" c="gray.7">
              {borrower.branch}
            </Text>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: brand.primarySoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              TOTAL EXPOSURE
            </Text>
            <Text fz="sm" fw={700} style={{ color: brand.primary }}>
              {formatK(borrower.totalExposure)}
            </Text>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: brand.tealSoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              AVAILABLE CREDIT
            </Text>
            <Text fz="sm" fw={700} style={{ color: brand.teal }}>
              {formatK(borrower.availableCredit)}
            </Text>
          </div>
        </div>
      </div>

      {/* Sections */}
      <Accordion multiple defaultValue={['loans']} chevron={<IconChevronUp size={14} />}>
        <Accordion.Item value="loans">
          <Accordion.Control icon={<IconCreditCard size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                LOANS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.loans.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.loans.map((loan) => {
                const accent =
                  loan.status === 'Delinquent' || loan.status === 'Overdue'
                    ? brand.rose
                    : loan.status === 'Closed'
                    ? brand.slate
                    : brand.teal;
                const accentSoft =
                  loan.status === 'Delinquent' || loan.status === 'Overdue'
                    ? brand.roseSoft
                    : loan.status === 'Closed'
                    ? brand.slateSoft
                    : brand.tealSoft;
                const selected = isSelected('loan', loan.id);
                return (
                  <button
                    key={loan.id}
                    onClick={() => onSelect({ type: 'loan', id: loan.id })}
                    className="text-left rounded-lg border-l-[3px] border p-2.5 transition-all hover:shadow-sm"
                    style={
                      selected
                        ? { borderColor: '#e5e7eb', borderLeftColor: accent, backgroundColor: accentSoft }
                        : { borderColor: '#e5e7eb', borderLeftColor: accent, backgroundColor: '#fff' }
                    }
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <Text fz="xs" fw={700} c="gray.9">
                          {loan.loanNumber}
                        </Text>
                        <Text fz={10} c="dimmed">
                          {loan.product}
                        </Text>
                      </div>
                      <Badge size="xs" variant="light" color={loanStatusColor[loan.status]} styles={{ root: { fontSize: 9 } }}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <Text fz="sm" fw={700} c="gray.9">
                          {formatK(loan.outstanding)}
                        </Text>
                        <Text fz={9} c="dimmed" className="tracking-wide">
                          OUTSTANDING
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text fz="xs" fw={600} c="gray.7">
                          {loan.nextInstallment ? formatK(loan.nextInstallment) : '—'}
                        </Text>
                        <Text fz={9} c="dimmed">
                          Next installment
                        </Text>
                      </div>
                    </div>
                    <Progress
                      value={loan.repaidPercent}
                      size={4}
                      color={loan.status === 'Delinquent' ? 'red' : loan.status === 'Closed' ? 'gray' : 'teal'}
                    />
                    <div className="flex justify-between mt-1">
                      <Text fz={10} c="dimmed">
                        {loan.repaidPercent}% repaid
                      </Text>
                      {loan.dpd ? (
                        <Badge size="xs" color="red" variant="light" styles={{ root: { fontSize: 9 } }}>
                          DPD {loan.dpd}
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="investments">
          <Accordion.Control icon={<IconChartLine size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                INVESTMENTS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.investments.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.investments.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => onSelect({ type: 'investment', id: inv.id })}
                  className="text-left rounded-lg border-l-[3px] border p-2.5 transition-all hover:shadow-sm"
                  style={
                    isSelected('investment', inv.id)
                      ? { borderColor: '#e5e7eb', borderLeftColor: brand.sky, backgroundColor: brand.skySoft }
                      : { borderColor: '#e5e7eb', borderLeftColor: brand.sky, backgroundColor: '#fff' }
                  }
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <Text fz="xs" fw={700} c="gray.9">
                        {inv.refNumber}
                      </Text>
                      <Text fz={10} c="dimmed">
                        {inv.product}
                      </Text>
                    </div>
                    <Badge size="xs" variant="light" color={accountStatusColor[inv.status]} styles={{ root: { fontSize: 9 } }}>
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <Text fz="sm" fw={700} c="gray.9">
                        {formatK(inv.currentBalance)}
                      </Text>
                      <Text fz={9} c="dimmed" className="tracking-wide">
                        CURRENT BALANCE
                      </Text>
                    </div>
                    <Text fz="xs" c="dimmed">
                      {inv.maturity}
                    </Text>
                  </div>
                </button>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="savings">
          <Accordion.Control icon={<IconPigMoney size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                SAVINGS ACCOUNTS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.savings.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.savings.map((sav) => (
                <button
                  key={sav.id}
                  onClick={() => onSelect({ type: 'savings', id: sav.id })}
                  className="text-left rounded-lg border-l-[3px] border p-2.5 flex justify-between items-center transition-all hover:shadow-sm"
                  style={
                    isSelected('savings', sav.id)
                      ? { borderColor: '#e5e7eb', borderLeftColor: brand.teal, backgroundColor: brand.tealSoft }
                      : { borderColor: '#e5e7eb', borderLeftColor: brand.teal, backgroundColor: '#fff' }
                  }
                >
                  <div>
                    <Text fz="xs" fw={700} c="gray.9">
                      {sav.accountNumber}
                    </Text>
                    <Text fz={10} c="dimmed">
                      Available
                    </Text>
                  </div>
                  <Text fz="sm" fw={700} c="gray.9">
                    {formatK(sav.available, 2)}
                  </Text>
                </button>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="fixedDeposits">
          <Accordion.Control icon={<IconClockHour4 size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                FIXED DEPOSITS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.fixedDeposits.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.fixedDeposits.map((fd) => (
                <button
                  key={fd.id}
                  onClick={() => onSelect({ type: 'fixedDeposit', id: fd.id })}
                  className="text-left rounded-lg border-l-[3px] border p-2.5 flex justify-between items-center transition-all hover:shadow-sm"
                  style={
                    isSelected('fixedDeposit', fd.id)
                      ? { borderColor: '#e5e7eb', borderLeftColor: brand.gold, backgroundColor: brand.goldSoft }
                      : { borderColor: '#e5e7eb', borderLeftColor: brand.gold, backgroundColor: '#fff' }
                  }
                >
                  <div>
                    <Text fz="xs" fw={700} c="gray.9">
                      {fd.refNumber}
                    </Text>
                    <Text fz={10} c="dimmed">
                      Matures {fd.maturity}
                    </Text>
                  </div>
                  <Text fz="sm" fw={700} c="gray.9">
                    {formatK(fd.amount)}
                  </Text>
                </button>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

/* ============================================================================
   TOP GLOBAL SEARCH BAR
============================================================================ */

function GlobalSearchBar({
  borrower,
  onSelect,
}: {
  borrower: BorrowerProfile;
  onSelect: (item: SelectedItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const results = useMemo(() => {
    const items: { section: string; icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }[] = [
      {
        section: 'CUSTOMERS',
        icon: <IconUser size={15} />,
        title: borrower.name,
        subtitle: `${borrower.custId} · ${borrower.mobile}`,
        onClick: () => setOpen(false),
      },
      ...borrower.loans.map((loan) => ({
        section: 'LOANS',
        icon: <IconFileText size={15} />,
        title: loan.loanNumber,
        subtitle: `${loan.product} · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: 'loan', id: loan.id });
          setOpen(false);
        },
      })),
      ...borrower.investments.map((inv) => ({
        section: 'INVESTMENTS',
        icon: <IconFileText size={15} />,
        title: inv.refNumber,
        subtitle: `${inv.product} · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: 'investment', id: inv.id });
          setOpen(false);
        },
      })),
      ...borrower.savings.map((sav) => ({
        section: 'SAVINGS',
        icon: <IconFileText size={15} />,
        title: sav.accountNumber,
        subtitle: `Savings account · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: 'savings', id: sav.id });
          setOpen(false);
        },
      })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q));
  }, [query, borrower, onSelect]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    results.forEach((r) => {
      if (!map.has(r.section)) map.set(r.section, []);
      map.get(r.section)!.push(r);
    });
    return map;
  }, [results]);

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <TextInput
        size="sm"
        radius="md"
        placeholder="Search loan number, phone, customer, National ID..."
        leftSection={<IconSearch size={14} />}
        rightSection={<Kbd size="xs">⌘K</Kbd>}
        rightSectionWidth={44}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.currentTarget.value);
          setOpen(true);
        }}
      />
      {open && (
        <Paper withBorder radius="md" shadow="md" className="absolute left-0 right-0 mt-1.5 z-50 max-h-96 overflow-y-auto py-2">
          {results.length === 0 ? (
            <Text fz="xs" c="dimmed" className="px-4 py-3">
              No results found.
            </Text>
          ) : (
            Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section} className="mb-1">
                <Text fz={10} fw={700} c="dimmed" className="px-4 py-1.5 tracking-wider">
                  {section}
                </Text>
                {items.map((item, idx) => (
                  <button
                    key={`${section}-${idx}`}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: brand.skySoft, color: brand.sky }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <Text fz="xs" fw={700} c="gray.9">
                        {item.title}
                      </Text>
                      <Text fz={11} c="dimmed">
                        {item.subtitle}
                      </Text>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </Paper>
      )}
    </div>
  );
}

/* ============================================================================
   LOAN DETAIL (tabs: Overview, Disbursement, Schedule, History, Accounting,
   Documents, Activity)
============================================================================ */

const scheduleStatusColor: Record<string, string> = {
  'Paid on time': brand.teal,
  'Paid late': brand.gold,
  Overdue: brand.rose,
  Upcoming: '#D8D3C4',
};

function LoanDetailView({ loan, borrower }: { loan: LoanSummary; borrower: BorrowerProfile }) {
  const detail = useMemo(() => getLoanDetail(loan), [loan]);
  const [tab, setTab] = useState('overview');

  const rightRail =
    tab === 'documents' ? (
      <DocumentStatusPanel checklist={detail.documentChecklist} />
    ) : tab === 'activity' ? (
      <QuickLogPanel />
    ) : (
      <RiskSnapshotPanel borrower={borrower} />
    );

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {/* Header strip */}
        <Paper
          radius="lg"
          p="md"
          className="border-l-4"
          style={{
            borderLeftColor: loan.status === 'Active' ? brand.teal : loan.status === 'Closed' ? brand.slate : brand.rose,
            border: '1px solid #ECE8DD',
            borderLeftWidth: 4,
            boxShadow: '0 6px 20px rgba(36,31,61,0.08)',
          }}
        >
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                ASSET FINANCE · LOAN {detail.loanNumber}
              </Text>
              <Text fz="xl" fw={700} c="gray.9" style={serif}>
                {detail.product === 'SME Working Capital' ? 'Equipment Asset Loan' : detail.product}
              </Text>
              <Text fz="xs" c="dimmed" className="mt-1">
                Purpose: <span className="font-semibold text-gray-700">{detail.purpose}</span>
                {'   '}Officer: <span className="font-semibold text-gray-700">{detail.officer}</span>
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill
                label={detail.loanStatusLabel}
                tone={loan.status === 'Active' ? 'active' : loan.status === 'Closed' ? 'neutral' : 'warn'}
              />
              <Button size="xs" radius="md" styles={{ root: { backgroundColor: brand.primary } }}>
                Record payment
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.goldSoft, color: '#8A5A0F' } }}
                leftSection={<IconBell size={13} />}
              >
                Send reminder
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }}
                leftSection={<IconRefreshDot size={13} />}
              >
                Restructure
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-gray-100">
            <OverviewField label="TOTAL OUTSTANDING" value={formatK(detail.totalOutstanding)} />
            <OverviewField label="NEXT INSTALLMENT" value={detail.nextInstallment ? formatK(detail.nextInstallment) : '—'} />
            <OverviewField label="DAYS PAST DUE" value={detail.dpd} />
            <OverviewField label="INTEREST RATE" value={detail.interestRate} />
            <OverviewField label="MATURITY DATE" value={detail.maturityDate} />
          </div>

          <TenureBar elapsed={detail.elapsedMonths} total={detail.tenureMonths} />
        </Paper>

        <Tabs value={tab} onChange={(v) => v && setTab(v)} variant="pills" color="ink" radius="xl">
          <Tabs.List className="mb-5 flex-wrap gap-1 pb-3 border-b border-gray-200">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="disbursement">Disbursement</Tabs.Tab>
            <Tabs.Tab value="schedule">Schedule</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
            <Tabs.Tab value="accounting">Accounting</Tabs.Tab>
            <Tabs.Tab value="documents">Documents</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <div className="flex flex-col gap-5">
              <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                  <Text fz="lg" fw={600} c="gray.9" style={serif}>
                    Loan overview
                  </Text>
                  <Text fz="xs" c="dimmed">
                    Core terms &amp; current standing
                  </Text>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                  <OverviewField label="LOAN NUMBER" value={detail.loanNumber} />
                  <OverviewField label="PRODUCT" value={detail.product} />
                  <OverviewField label="LOAN STATUS" value={detail.loanStatusLabel} />
                  <OverviewField label="ORIGINAL AMOUNT" value={formatK(detail.originalAmount)} />
                  <OverviewField label="DISBURSED AMOUNT" value={formatK(detail.disbursedAmount)} />
                  <OverviewField label="OUTSTANDING PRINCIPAL" value={formatK(detail.principalOutstanding)} />
                  <OverviewField label="OUTSTANDING INTEREST" value={formatK(detail.interestOutstanding)} />
                  <OverviewField label="OUTSTANDING PENALTY" value={formatK(detail.penaltyOutstanding)} />
                  <OverviewField label="REPAYMENT FREQUENCY" value={detail.repaymentFrequency} />
                  <OverviewField label="LOAN TENURE" value={`${detail.tenureMonths} months`} />
                  <OverviewField label="REMAINING TENURE" value={`${detail.remainingTenure} months`} />
                  <OverviewField label="LOAN OFFICER" value={detail.officer} />
                </div>
              </Paper>

              <div>
                <SectionHeading title="Disbursement" aside={`${detail.tranches.length} tranches released`} />
                <div className="flex flex-col gap-2.5">
                  {detail.tranches.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border-l-[3px] border px-3 py-2.5" style={{ borderColor: '#EDEAE0', borderLeftColor: brand.teal, backgroundColor: '#fff' }}>
                      <Text fz="xs" c="gray.9">
                        <span className="font-semibold">{t.label}</span> · {formatK(t.amount)}
                        <span className="text-gray-400">
                          {' '}
                          — {t.date} · {t.method} · {t.account} · Ref: {t.ref} · Approved by {t.approvedBy}
                        </span>
                      </Text>
                      <Badge size="sm" variant="light" color="teal">
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="disbursement">
            <Paper radius="lg" className="p-4" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex flex-col gap-2.5">
                {detail.tranches.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border-l-[3px] border px-3 py-2.5" style={{ borderColor: '#EDEAE0', borderLeftColor: brand.teal, backgroundColor: '#fff' }}>
                    <div>
                      <Text fz="xs" fw={700} c="gray.9">
                        {t.label} · {formatK(t.amount)}
                      </Text>
                      <Text fz={11} c="dimmed">
                        {t.date} · {t.method} · {t.account} · Ref: {t.ref} · Approved by {t.approvedBy}
                      </Text>
                    </div>
                    <Badge size="sm" variant="light" color="teal">
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="schedule">
            <Paper radius="lg" className="p-4" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: scheduleStatusColor['Paid on time'] }} />
                  Paid on time
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: scheduleStatusColor['Paid late'] }} />
                  Paid late
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: scheduleStatusColor.Overdue }} />
                  Overdue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-gray-300" style={{ background: scheduleStatusColor.Upcoming }} />
                  Upcoming
                </span>
              </div>
              <Table verticalSpacing={6} fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Due date</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.schedule.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>{s.no}</Table.Td>
                      <Table.Td>{s.dueDate}</Table.Td>
                      <Table.Td className="font-mono">{formatK(s.amount)}</Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          variant="light"
                          color={
                            s.status === 'Paid on time' ? 'teal' : s.status === 'Paid late' ? 'orange' : s.status === 'Overdue' ? 'red' : 'gray'
                          }
                        >
                          {s.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Repayment history
                </Text>
                <Text fz="xs" c="dimmed">
                  {detail.history.length} most recent transactions
                </Text>
              </div>
              <Table verticalSpacing={6} fz="xs" className="min-w-full">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Receipt</Table.Th>
                    <Table.Th>Payment date</Table.Th>
                    <Table.Th>Method</Table.Th>
                    <Table.Th>Collector</Table.Th>
                    <Table.Th>Principal</Table.Th>
                    <Table.Th>Interest</Table.Th>
                    <Table.Th>Penalty</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Balance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.history.map((r) => (
                    <Table.Tr key={r.receipt}>
                      <Table.Td className="font-mono" style={{ color: brand.sky }}>{r.receipt}</Table.Td>
                      <Table.Td>{r.date}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="gray">
                          {r.method}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{r.collector}</Table.Td>
                      <Table.Td className="font-mono">{r.principal.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono">{r.interest.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono">{r.penalty.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono font-semibold">{r.total.toLocaleString()}</Table.Td>
                      <Table.Td className="font-mono">{r.balance.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="accounting">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <IconWallet size={15} className="text-gray-500" />
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Ledger entries
                </Text>
              </div>
              <Table verticalSpacing={6} fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Debit</Table.Th>
                    <Table.Th>Credit</Table.Th>
                    <Table.Th>Balance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.accounting.map((row, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{row.date}</Table.Td>
                      <Table.Td>{row.description}</Table.Td>
                      <Table.Td className="font-mono">{row.debit ? formatK(row.debit) : '—'}</Table.Td>
                      <Table.Td className="font-mono">{row.credit ? formatK(row.credit) : '—'}</Table.Td>
                      <Table.Td className="font-mono">{formatK(row.balance)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="documents">
            <SectionHeading title="Documents" aside={`${detail.documents.length} files on record`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {detail.documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <SectionHeading title="Activity & audit" aside="Every touchpoint on this loan, in order" />
            <ActivityFeed activity={detail.activity} />
          </Tabs.Panel>
        </Tabs>
      </div>

      {rightRail}
    </div>
  );
}

/* ============================================================================
   ACCOUNT DETAIL (savings / investment / fixed deposit — tabs: Overview,
   History, Documents, Activity)
============================================================================ */

function AccountDetailView({
  title,
  detail,
  borrower,
}: {
  title: string;
  detail: AccountDetailData;
  borrower: BorrowerProfile;
}) {
  const [tab, setTab] = useState('overview');

  const rightRail =
    tab === 'documents' ? (
      <DocumentStatusPanel checklist={detail.documentChecklist} />
    ) : tab === 'activity' ? (
      <QuickLogPanel />
    ) : (
      <RiskSnapshotPanel borrower={borrower} />
    );

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <Paper
          radius="lg"
          p="md"
          className="border-l-4"
          style={{
            borderLeftColor: detail.statusLabel === 'Active' ? brand.teal : brand.slate,
            border: '1px solid #ECE8DD',
            borderLeftWidth: 4,
            boxShadow: '0 6px 20px rgba(36,31,61,0.08)',
          }}
        >
          <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
            <div>
              <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                EVERYDAY BANKING · ACCOUNT {detail.accountNumber}
              </Text>
              <Text fz="xl" fw={700} c="gray.9" style={serif}>
                {title}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label={detail.statusLabel} tone={detail.statusLabel === 'Active' ? 'active' : 'neutral'} />
              <Button size="xs" radius="md" styles={{ root: { backgroundColor: brand.primary } }}>
                Record payment
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.goldSoft, color: '#8A5A0F' } }}
                leftSection={<IconBell size={13} />}
              >
                Send reminder
              </Button>
              <Button
                size="xs"
                radius="md"
                variant="light"
                styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }}
                leftSection={<IconRefreshDot size={13} />}
              >
                Restructure
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-3 border-b border-gray-100">
            <OverviewField label="CURRENT BALANCE" value={formatK(detail.currentBalance, 2)} />
            {detail.avgMonthlyInflow !== undefined && <OverviewField label="AVG. MONTHLY INFLOW" value={formatK(detail.avgMonthlyInflow)} />}
            {detail.interestEarnedYtd !== undefined && <OverviewField label="INTEREST EARNED YTD" value={formatK(detail.interestEarnedYtd)} />}
            <OverviewField label="INTEREST RATE" value={detail.interestRate} />
            <OverviewField label={detail.maturityDate ? 'MATURITY DATE' : 'OPENED'} value={detail.maturityDate ?? detail.openedDate} />
          </div>

          {detail.tenureMonths !== undefined && (
            <TenureBar elapsed={detail.elapsedMonths ?? 0} total={detail.tenureMonths} />
          )}
        </Paper>

        <Tabs value={tab} onChange={(v) => v && setTab(v)} variant="pills" color="ink" radius="xl">
          <Tabs.List className="mb-5 flex-wrap gap-1 pb-3 border-b border-gray-200">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="history">History</Tabs.Tab>
            <Tabs.Tab value="documents">Documents</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Account overview
                </Text>
                <Text fz="xs" c="dimmed">
                  Core terms &amp; current standing
                </Text>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                <OverviewField label="ACCOUNT NUMBER" value={detail.accountNumber} />
                <OverviewField label="PRODUCT" value={detail.product} />
                <OverviewField label="STATUS" value={detail.statusLabel} />
                <OverviewField label="OPENED" value={detail.openedDate} />
                {detail.maturityDate && <OverviewField label="MATURITY DATE" value={detail.maturityDate} />}
                {detail.tenureMonths !== undefined && (
                  <OverviewField label="TENURE" value={`${detail.elapsedMonths ?? 0} / ${detail.tenureMonths} months`} />
                )}
              </div>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text fz="lg" fw={600} c="gray.9" style={serif}>
                  Transaction history
                </Text>
                <Text fz="xs" c="dimmed">
                  {detail.history.length} most recent transactions
                </Text>
              </div>
              <Table verticalSpacing={6} fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Receipt</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Method</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Balance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {detail.history.map((r) => (
                    <Table.Tr key={r.receipt}>
                      <Table.Td className="font-mono" style={{ color: brand.sky }}>{r.receipt}</Table.Td>
                      <Table.Td>{r.date}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="gray">
                          {r.method}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="font-mono">{formatK(r.total)}</Table.Td>
                      <Table.Td className="font-mono">{formatK(r.balance, 2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="documents">
            <SectionHeading title="Documents" aside={`${detail.documents.length} files on record`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {detail.documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="activity">
            <SectionHeading title="Activity & audit" aside="Every touchpoint on this account, in order" />
            <ActivityFeed activity={detail.activity} />
          </Tabs.Panel>
        </Tabs>
      </div>

      {rightRail}
    </div>
  );
}

/* ============================================================================
   MAIN EXPORT — Borrower360
============================================================================ */

export function Borrower360({ borrower, onBack }: { borrower: BorrowerProfile; onBack: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<SelectedItem>(
    borrower.loans[0] ? { type: 'loan', id: borrower.loans[0].id } : null
  );

  const activeContent = useMemo(() => {
    if (!selected) return null;

    if (selected.type === 'loan') {
      const loan = borrower.loans.find((l) => l.id === selected.id);
      if (!loan) return null;
      return { node: <LoanDetailView loan={loan} borrower={borrower} />, label: `${loan.loanNumber} — ${loan.product}` };
    }
    if (selected.type === 'investment') {
      const inv = borrower.investments.find((i) => i.id === selected.id);
      if (!inv) return null;
      return {
        node: <AccountDetailView title={inv.product} detail={getInvestmentDetail(inv)} borrower={borrower} />,
        label: `${inv.refNumber} — ${inv.product}`,
      };
    }
    if (selected.type === 'savings') {
      const sav = borrower.savings.find((s) => s.id === selected.id);
      if (!sav) return null;
      return {
        node: <AccountDetailView title="Flexi Save Account" detail={getSavingsDetail(sav)} borrower={borrower} />,
        label: `${sav.accountNumber} — Savings account`,
      };
    }
    if (selected.type === 'fixedDeposit') {
      const fd = borrower.fixedDeposits.find((f) => f.id === selected.id);
      if (!fd) return null;
      return {
        node: <AccountDetailView title="Fixed Deposit" detail={getFixedDepositDetail(fd)} borrower={borrower} />,
        label: `${fd.refNumber} — Fixed deposit`,
      };
    }
    return null;
  }, [selected, borrower]);

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] -m-8">
      <BorrowerSidebar
        borrower={borrower}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onBack={onBack}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: brand.cream }}>
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
          <GlobalSearchBar borrower={borrower} onSelect={setSelected} />
        </div>

        <div className="p-6">
          {activeContent ? (
            <div className="flex flex-col gap-3">
              <Text fz="xs" c="dimmed">
                Now viewing: <span className="font-semibold text-gray-700">{activeContent.label}</span>
              </Text>
              {activeContent.node}
            </div>
          ) : (
            <Text c="dimmed" fz="sm">
              Select a loan, investment, or account from the panel to view details.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}