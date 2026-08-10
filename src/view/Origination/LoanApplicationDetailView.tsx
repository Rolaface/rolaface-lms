import { useMemo, useState } from 'react';
import { Badge, Button, Paper, RingProgress, Tabs, Text, TextInput } from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFileCertificate,
  IconFileText,
  IconId,
  IconMessage,
  IconNote,
  IconPencil,
  IconPhoneCall,
  IconPhoto,
  IconSearch,
  IconX,
} from '@tabler/icons-react';

import type { LoanApplicationRow } from './LoanApplication';
import { STATUS_COLOR } from './LoanApplication';

const brand = {
  cream: '#FAF8F3',
  ink: '#241F3D',
  primary: '#4F46E5',
  primarySoft: '#EEF0FE',
  teal: '#3F8B61',
  tealSoft: '#E9F4EC',
  gold: '#C89A3C',
  goldSoft: '#FBF3E1',
  rose: '#B8533A',
  roseSoft: '#F9EAE6',
  sky: '#2E7BB8',
  skySoft: '#E9F2FA',
  slate: '#6B7280',
  slateSoft: '#F1F1EF',
};

const serif = { fontFamily: 'Georgia, "Times New Roman", serif' };

function formatCurrency(amount: number) {
  if (!amount && amount !== 0) return '—';
  return `K ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/* ============================================================================
   LOCAL TYPES
============================================================================ */

type DocumentIcon = 'id' | 'photo' | 'file' | 'certificate';
type DocumentStatus = 'Uploaded' | 'Missing';

export interface ApplicationDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  size: string;
  icon: DocumentIcon;
}

type ActivityKind = 'note' | 'call' | 'decision';

export interface ApplicationActivityItem {
  id: string;
  date: string;
  kind: ActivityKind;
  title: string;
  description: string;
  actor: string;
}

export interface LoanApplicationDetail {
  applicant: {
    fullName: string;
    gender: string;
    maritalStatus: string;
    birthDate: string;
    nrc: string;
    phone: string;
    email: string;
    nationality: string;
    residentialAddress: string;
    occupation: string;
    employerName: string;
  };
  business: {
    isBusinessLoan: boolean;
    companyName: string;
    typeOfBusiness: string;
    establishedDate: string;
    registeredOffice: string;
    natureOfBusiness: string;
  };
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
  };
  loanTerms: {
    amountRequested: number;
    tenureMonths: number;
    purpose: string;
    collateralPledged: string;
    proposedRepaymentFrequency: string;
  };
  reviewer: {
    name: string;
    initials: string;
    branch: string;
  };
  documents: ApplicationDocument[];
  activity: ApplicationActivityItem[];
  stage: 'Draft' | 'Submitted' | 'Under review' | 'Decision' | 'Closed';
}

const APPLICATION_STAGES: LoanApplicationDetail['stage'][] = [
  'Draft',
  'Submitted',
  'Under review',
  'Decision',
  'Closed',
];

function stageForStatus(status: string): LoanApplicationDetail['stage'] {
  switch (status) {
    case 'Draft':
      return 'Draft';
    case 'Open':
      return 'Under review';
    case 'Sanctioned':
    case 'Rejected':
      return 'Decision';
    case 'Closed':
      return 'Closed';
    default:
      return 'Submitted';
  }
}

/* ============================================================================
   MOCK DETAIL BUILDER
   TODO: replace with a real `GET /loan-application/{id}` call. Derives
   plausible values from the list row so the page renders sensibly until the
   endpoint exists — nothing here should be treated as real data.
============================================================================ */

function getApplicationDetail(application: LoanApplicationRow): LoanApplicationDetail {
  const [firstName, ...rest] = (application.applicant_name || '').trim().split(/\s+/);
  const surname = rest.join(' ') || 'Applicant';
  const isBusinessLoan = /business|sme|working capital|asset/i.test(application.loan_product || '');

  return {
    applicant: {
      fullName: application.applicant_name || '—',
      gender: 'Female',
      maritalStatus: 'Married',
      birthDate: '14 Mar 1990',
      nrc: '221114/10/1',
      phone: application.applicant_phone_number || '—',
      email: application.applicant_email_address || '—',
      nationality: 'Zambian',
      residentialAddress: 'Plot 22, Cairo Road, Lusaka',
      occupation: isBusinessLoan ? 'Business owner' : 'Salaried employee',
      employerName: isBusinessLoan ? application.applicant_name : 'Zamtel Plc',
    },
    business: {
      isBusinessLoan,
      companyName: isBusinessLoan ? application.applicant_name : '—',
      typeOfBusiness: isBusinessLoan ? 'Private limited company' : '—',
      establishedDate: isBusinessLoan ? '02 Jun 2016' : '—',
      registeredOffice: isBusinessLoan ? 'Plot 14, Ndola Industrial Area' : '—',
      natureOfBusiness: isBusinessLoan ? 'Logistics & haulage' : '—',
    },
    nextOfKin: {
      name: `${firstName || 'Jane'} ${surname}'s guarantor`,
      relationship: 'Sibling',
      phone: '+260 96 000 0000',
    },
    loanTerms: {
      amountRequested: application.loan_amount || 0,
      tenureMonths: 24,
      purpose: isBusinessLoan ? 'Working capital expansion' : 'Home improvement',
      collateralPledged: isBusinessLoan ? 'Delivery van — Toyota Dyna, 2019' : 'None',
      proposedRepaymentFrequency: 'Monthly',
    },
    reviewer: {
      name: 'Grace Mwansa',
      initials: 'GM',
      branch: 'Cairo Road branch',
    },
    documents: [
      { id: 'nrc', name: 'NRC copy', status: 'Uploaded', size: '1.2 MB', icon: 'id' },
      { id: 'photo', name: 'Passport photo', status: 'Uploaded', size: '480 KB', icon: 'photo' },
      {
        id: 'payslip',
        name: 'Payslips (3 months)',
        status: isBusinessLoan ? 'Missing' : 'Uploaded',
        size: isBusinessLoan ? '—' : '640 KB',
        icon: 'file',
      },
      { id: 'bank', name: 'Bank statements', status: 'Uploaded', size: '2.1 MB', icon: 'file' },
      { id: 'tpin', name: 'TPIN certificate', status: 'Uploaded', size: '210 KB', icon: 'certificate' },
      ...(isBusinessLoan
        ? ([
            { id: 'pacra', name: 'PACRA certificate', status: 'Uploaded', size: '310 KB', icon: 'certificate' },
            { id: 'taxclear', name: 'Tax clearance certificate', status: 'Missing', size: '—', icon: 'certificate' },
          ] as ApplicationDocument[])
        : []),
    ],
    activity: [
      {
        id: 'a1',
        date: application.posting_date,
        kind: 'note',
        title: 'Application submitted',
        description: `Loan application ${application.name} created for ${application.applicant_name}.`,
        actor: 'Applicant · self-service portal',
      },
      {
        id: 'a2',
        date: application.posting_date,
        kind: 'call',
        title: 'Document collection call',
        description: 'Reached out to confirm outstanding supporting documents.',
        actor: 'Grace Mwansa · Loan Officer',
      },
      ...(application.status === 'Sanctioned' || application.status === 'Rejected'
        ? [
            {
              id: 'a3',
              date: application.posting_date,
              kind: 'decision' as const,
              title: `Application ${application.status.toLowerCase()}`,
              description:
                application.status === 'Sanctioned'
                  ? 'Credit committee approved the application; disbursement pending.'
                  : 'Application did not meet minimum affordability criteria.',
              actor: 'Credit Committee',
            },
          ]
        : []),
    ],
    stage: stageForStatus(application.status),
  };
}

/* ============================================================================
   SMALL SHARED BITS (local to this file only)
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

const documentIconMap: Record<DocumentIcon, React.ReactNode> = {
  id: <IconId size={16} />,
  photo: <IconPhoto size={16} />,
  file: <IconFileText size={16} />,
  certificate: <IconFileCertificate size={16} />,
};

function DocumentCard({ doc }: { doc: ApplicationDocument }) {
  const missing = doc.status === 'Missing';
  const accent = missing ? { bg: brand.roseSoft, fg: brand.rose } : { bg: brand.skySoft, fg: brand.sky };
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
        {documentIconMap[doc.icon]}
      </div>
      <div className="min-w-0">
        <Text fz="xs" fw={700} c="gray.9" truncate>
          {doc.name}
        </Text>
        <Text fz={11} fw={600} c={missing ? undefined : 'dimmed'} style={missing ? { color: brand.rose } : undefined}>
          {doc.status} · {doc.size}
        </Text>
      </div>
    </Paper>
  );
}

const activityKindIcon: Record<ActivityKind, React.ReactNode> = {
  note: <IconNote size={11} />,
  call: <IconPhoneCall size={11} />,
  decision: <IconMessage size={11} />,
};
const activityKindLabel: Record<ActivityKind, string> = { note: 'Note', call: 'Call', decision: 'Decision' };
const activityKindTone: Record<ActivityKind, { bg: string; fg: string }> = {
  note: { bg: brand.skySoft, fg: brand.sky },
  call: { bg: brand.goldSoft, fg: '#8A5A0F' },
  decision: { bg: brand.tealSoft, fg: brand.teal },
};

function ActivityFeed({ activity }: { activity: ApplicationActivityItem[] }) {
  return (
    <Paper radius="lg" className="p-4" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
      <div className="flex flex-col">
        {activity.map((a, idx) => {
          const tone = activityKindTone[a.kind];
          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1" style={{ borderColor: tone.fg, backgroundColor: '#fff' }} />
                {idx < activity.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
              </div>
              <div className="pb-5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <Text fz={10} c="dimmed" className="font-mono">
                    {formatDate(a.date)}
                  </Text>
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ backgroundColor: tone.bg, color: tone.fg }}>
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
        {activity.length === 0 && (
          <Text fz="xs" c="dimmed" className="py-3">
            No entries match your search.
          </Text>
        )}
      </div>
    </Paper>
  );
}

function StageBar({ stage, isRejected }: { stage: LoanApplicationDetail['stage']; isRejected: boolean }) {
  const currentIndex = APPLICATION_STAGES.indexOf(stage);
  return (
    <div className="pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        {APPLICATION_STAGES.map((s, idx) => {
          const done = idx < currentIndex || (idx === currentIndex && s !== 'Decision');
          const isCurrent = idx === currentIndex;
          const color = isRejected && isCurrent ? brand.rose : done || isCurrent ? brand.teal : '#E5E1D6';
          return (
            <div key={s} className="flex-1 flex flex-col gap-1.5">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <Text fz={10} c={isCurrent ? 'gray.9' : 'dimmed'} fw={isCurrent ? 700 : 500}>
                {s}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   LEFT SIDEBAR — applicant identity + this application's headline numbers.
   A loan application only ever belongs to one product, so unlike a borrower
   360 (which lists many loans/investments/accounts) this sidebar has one
   application card, not an accordion of several.
============================================================================ */

function ApplicationSidebar({
  application,
  detail,
  collapsed,
  onToggleCollapsed,
  onBack,
}: {
  application: LoanApplicationRow;
  detail: LoanApplicationDetail;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
}) {
  const scale = STATUS_COLOR[application.status] ?? 'slate';

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 w-12 shrink-0 border-r border-gray-200 bg-white py-3">
        <Button variant="subtle" color="gray" size="xs" px={4} onClick={onToggleCollapsed}>
          <IconChevronRight size={16} />
        </Button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})` }}
        >
          {initialsOf(application.applicant_name || '—')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:w-80 shrink-0 h-screen sticky top-0 border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Button variant="subtle" color="gray" size="xs" px={4} onClick={onBack}>
          <IconArrowLeft size={16} />
        </Button>
        <Button variant="subtle" color="gray" size="xs" px={4} className="ml-auto" onClick={onToggleCollapsed}>
          <IconChevronLeft size={16} />
        </Button>
      </div>

      {/* Applicant summary */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})` }}
          >
            {initialsOf(application.applicant_name || '—')}
          </div>
          <div>
            <Text fz="sm" fw={700} c="gray.9">
              {application.applicant_name || 'Unnamed applicant'}
            </Text>
            <Text fz="xs" c="dimmed">
              {application.name}
            </Text>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Badge
            variant="light"
            size="sm"
            color={scale}
            styles={{ root: { fontSize: 10, border: `1px solid var(--mantine-color-${scale}-2)` } }}
          >
            {application.status}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Phone
            </Text>
            <Text fz="xs" c="gray.7" className="font-mono">
              {detail.applicant.phone}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              NRC
            </Text>
            <Text fz="xs" c="gray.7">
              {detail.applicant.nrc}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Email
            </Text>
            <Text fz="xs" c="gray.7" className="truncate max-w-[140px]">
              {detail.applicant.email}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: brand.primarySoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              AMOUNT REQUESTED
            </Text>
            <Text fz="sm" fw={700} style={{ color: brand.primary }}>
              {formatCurrency(detail.loanTerms.amountRequested)}
            </Text>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: brand.tealSoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              TENURE REQUESTED
            </Text>
            <Text fz="sm" fw={700} style={{ color: brand.teal }}>
              {detail.loanTerms.tenureMonths} months
            </Text>
          </div>
        </div>
      </div>

      {/* This application */}
      <div className="px-4 py-4">
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wide mb-2">
          THIS APPLICATION
        </Text>
        <div
          className="rounded-lg border-l-[3px] border p-2.5"
          style={{ borderColor: '#e5e7eb', borderLeftColor: brand.sky, backgroundColor: brand.skySoft }}
        >
          <div className="flex justify-between items-start mb-1">
            <div>
              <Text fz="xs" fw={700} c="gray.9">
                {application.name}
              </Text>
              <Text fz={10} c="dimmed">
                {application.loan_product}
              </Text>
            </div>
            <Badge size="xs" variant="light" color={scale} styles={{ root: { fontSize: 9 } }}>
              {application.status}
            </Badge>
          </div>
          <Text fz={10} c="dimmed" className="mt-1">
            Applied {formatDate(application.posting_date)}
          </Text>
          <Text fz={10} c="dimmed">
            Stage: <span className="font-semibold text-gray-700">{detail.stage}</span>
          </Text>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   TOP BAR — searches within this application's documents & activity log,
   the application-detail equivalent of Borrower360's global cross-entity
   search (there's nothing else to jump to from inside a single application).
============================================================================ */

function ApplicationSearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      size="sm"
      radius="md"
      placeholder="Search documents or activity on this application..."
      leftSection={<IconSearch size={14} />}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      className="w-full max-w-xl"
    />
  );
}

/* ============================================================================
   RIGHT RAIL — swaps by active tab, mirroring the borrower-view pattern of a
   context-sensitive rail rather than one fixed panel.
============================================================================ */

function ApplicationSnapshotPanel({ detail }: { detail: LoanApplicationDetail }) {
  const uploaded = detail.documents.filter((d) => d.status === 'Uploaded').length;
  const pct = detail.documents.length > 0 ? Math.round((uploaded / detail.documents.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <div className="flex items-center gap-4 mb-4">
          <RingProgress size={88} thickness={8} sections={[{ value: pct, color: brand.gold }]} rootColor="#ECE8DD" />
          <div>
            <Text fz={18} fw={700}>
              {pct}%
            </Text>
            <Text fz="sm" c="dimmed">
              Documents complete
            </Text>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Review stage
            </Text>
            <Text fz="xs" fw={700} c="gray.9">
              {detail.stage}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Loan product
            </Text>
            <Text fz="xs" fw={700} c="gray.9">
              {detail.loanTerms.purpose}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Documents on file
            </Text>
            <Text fz="xs" fw={700} c="gray.9" className="font-mono">
              {uploaded} / {detail.documents.length}
            </Text>
          </div>
        </div>
      </Paper>

      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.9" className="mb-3">
          Assigned loan officer
        </Text>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})` }}
          >
            {detail.reviewer.initials}
          </div>
          <div>
            <Text fz="xs" fw={700} c="gray.9">
              {detail.reviewer.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {detail.reviewer.branch}
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
          Message officer
        </Button>
      </Paper>
    </div>
  );
}

function DocumentStatusPanel({ detail }: { detail: LoanApplicationDetail }) {
  const missing = detail.documents.filter((d) => d.status === 'Missing');
  const uploaded = detail.documents.length - missing.length;
  const pct = detail.documents.length > 0 ? Math.round((uploaded / detail.documents.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">
          DOCUMENT STATUS
        </Text>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: brand.slateSoft }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: missing.length ? brand.gold : brand.teal }} />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Complete
            </Text>
            <Text fz="xs" fw={700} c="gray.9" className="font-mono">
              {uploaded} / {detail.documents.length}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Missing
            </Text>
            <Text fz="xs" fw={700} style={{ color: missing.length ? brand.gold : undefined }} c={missing.length ? undefined : 'gray.9'}>
              {missing.length ? missing.map((m) => m.name).join(', ') : 'None'}
            </Text>
          </div>
        </div>
        <Button fullWidth size="xs" styles={{ root: { backgroundColor: brand.primary } }} disabled={!missing.length}>
          Request from applicant
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
   MAIN EXPORT
============================================================================ */

interface LoanApplicationDetailViewProps {
  application: LoanApplicationRow;
  onBack: () => void;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isActionPending?: boolean;
}

export function LoanApplicationDetailView({
  application,
  onBack,
  onEdit,
  onApprove,
  onReject,
  isActionPending,
}: LoanApplicationDetailViewProps) {
  const detail = useMemo(() => getApplicationDetail(application), [application]);
  const [tab, setTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const scale = STATUS_COLOR[application.status] ?? 'slate';
  const isDraft = application.status === 'Draft' || application.status === 'Open';
  const isRejected = application.status === 'Rejected';

  const accentColor =
    application.status === 'Sanctioned'
      ? brand.teal
      : application.status === 'Rejected'
        ? brand.rose
        : application.status === 'Closed'
          ? brand.slate
          : brand.sky;

  const q = search.trim().toLowerCase();
  const filteredDocuments = useMemo(
    () => (q ? detail.documents.filter((d) => d.name.toLowerCase().includes(q)) : detail.documents),
    [detail.documents, q],
  );
  const filteredActivity = useMemo(
    () => (q ? detail.activity.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) : detail.activity),
    [detail.activity, q],
  );
  const docsUploaded = detail.documents.filter((d) => d.status === 'Uploaded').length;

  const rightRail =
    tab === 'documents' ? (
      <DocumentStatusPanel detail={detail} />
    ) : tab === 'activity' ? (
      <QuickLogPanel />
    ) : (
      <ApplicationSnapshotPanel detail={detail} />
    );

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] -m-8">
      <ApplicationSidebar
        application={application}
        detail={detail}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: brand.cream }}>
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
          <ApplicationSearchBar value={search} onChange={setSearch} />
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              {/* Header strip */}
              <Paper
                radius="lg"
                p="md"
                className="border-l-4"
                style={{ borderLeftColor: accentColor, border: '1px solid #ECE8DD', borderLeftWidth: 4, boxShadow: '0 6px 20px rgba(36,31,61,0.08)' }}
              >
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <div>
                    <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                      LOAN APPLICATION · {application.name}
                    </Text>
                    <Text fz="xl" fw={700} c="gray.9" style={serif}>
                      {application.applicant_name || 'Unnamed applicant'}
                    </Text>
                    <Text fz="xs" c="dimmed" className="mt-1">
                      Product: <span className="font-semibold text-gray-700">{application.loan_product || '—'}</span>
                      {'   '}Applied: <span className="font-semibold text-gray-700">{formatDate(application.posting_date)}</span>
                    </Text>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="light"
                      color={scale}
                      radius="xl"
                      size="lg"
                      styles={{ root: { textTransform: 'none', fontWeight: 700, border: `1px solid var(--mantine-color-${scale}-2)` } }}
                    >
                      {application.status}
                    </Badge>
                    {isDraft && onEdit && (
                      <Button size="xs" radius="md" variant="default" leftSection={<IconPencil size={13} />} onClick={onEdit}>
                        Edit
                      </Button>
                    )}
                    {isDraft && onApprove && (
                      <Button size="xs" radius="md" color="success" leftSection={<IconCheck size={13} />} onClick={onApprove} loading={isActionPending}>
                        Approve
                      </Button>
                    )}
                    {isDraft && onReject && (
                      <Button
                        size="xs"
                        radius="md"
                        color="danger"
                        variant="light"
                        leftSection={<IconX size={13} />}
                        onClick={onReject}
                        loading={isActionPending}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-gray-100">
                  <OverviewField label="LOAN PRODUCT" value={application.loan_product || '—'} />
                  <OverviewField label="AMOUNT REQUESTED" value={formatCurrency(detail.loanTerms.amountRequested)} />
                  <OverviewField label="TENURE REQUESTED" value={`${detail.loanTerms.tenureMonths} months`} />
                  <OverviewField label="APPLICATION STATUS" value={application.status} />
                  <OverviewField label="APPLICATION DATE" value={formatDate(application.posting_date)} />
                </div>

                <StageBar stage={detail.stage} isRejected={isRejected} />
              </Paper>

              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={(v) => v && setTab(v)}
                variant="pills"
                radius="xl"
                styles={{
                  tab: {
                    color: '#6B7280',
                    background: 'transparent',
                    border: 'none',
                    '&[data-active]': { background: '#E5E7EB !important', color: '#111827 !important', fontWeight: 700 },
                  },
                }}
              >
                <Tabs.List className="mb-5 flex-wrap gap-1 pb-3 border-b border-gray-200">
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  <Tabs.Tab value="applicant">Applicant &amp; Business</Tabs.Tab>
                  <Tabs.Tab value="documents">Documents</Tabs.Tab>
                  <Tabs.Tab value="activity">Activity</Tabs.Tab>
                </Tabs.List>

                {/* ---- Overview ---- */}
                <Tabs.Panel value="overview">
                  <div className="flex flex-col gap-5">
                    <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                        <Text fz="lg" fw={600} c="gray.9" style={serif}>
                          Requested terms
                        </Text>
                        <Text fz="xs" c="dimmed">
                          What the applicant asked for
                        </Text>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                        <OverviewField label="AMOUNT REQUESTED" value={formatCurrency(detail.loanTerms.amountRequested)} />
                        <OverviewField label="TENURE REQUESTED" value={`${detail.loanTerms.tenureMonths} months`} />
                        <OverviewField label="REPAYMENT FREQUENCY" value={detail.loanTerms.proposedRepaymentFrequency} />
                        <OverviewField label="PURPOSE OF LOAN" value={detail.loanTerms.purpose} />
                        <OverviewField label="COLLATERAL PLEDGED" value={detail.loanTerms.collateralPledged} />
                        <OverviewField label="LOAN PRODUCT" value={application.loan_product || '—'} />
                      </div>
                    </Paper>

                    <SectionHeading title="Applicant summary" aside="Personal details on file" />
                    <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                        <OverviewField label="FULL NAME" value={detail.applicant.fullName} />
                        <OverviewField label="PHONE" value={detail.applicant.phone} />
                        <OverviewField label="EMAIL" value={detail.applicant.email} />
                        <OverviewField label="NRC" value={detail.applicant.nrc} />
                        <OverviewField label="NATIONALITY" value={detail.applicant.nationality} />
                        <OverviewField label="OCCUPATION" value={detail.applicant.occupation} />
                      </div>
                    </Paper>

                    {detail.business.isBusinessLoan && (
                      <>
                        <SectionHeading title="Business summary" aside="Company details on file" />
                        <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                            <OverviewField label="COMPANY NAME" value={detail.business.companyName} />
                            <OverviewField label="TYPE OF BUSINESS" value={detail.business.typeOfBusiness} />
                            <OverviewField label="ESTABLISHED" value={detail.business.establishedDate} />
                            <OverviewField label="REGISTERED OFFICE" value={detail.business.registeredOffice} />
                            <OverviewField label="NATURE OF BUSINESS" value={detail.business.natureOfBusiness} />
                          </div>
                        </Paper>
                      </>
                    )}

                    <SectionHeading title="Documents" aside={`${docsUploaded} / ${detail.documents.length} on file`} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {detail.documents.map((doc) => (
                        <DocumentCard key={doc.id} doc={doc} />
                      ))}
                    </div>

                    <SectionHeading title="Activity" aside="Every touchpoint on this application, in order" />
                    <ActivityFeed activity={detail.activity} />
                  </div>
                </Tabs.Panel>

                {/* ---- Applicant & Business ---- */}
                <Tabs.Panel value="applicant">
                  <div className="flex flex-col gap-5">
                    <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                        <Text fz="lg" fw={600} c="gray.9" style={serif}>
                          Personal information
                        </Text>
                        <Text fz="xs" c="dimmed">
                          As submitted by the applicant
                        </Text>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                        <OverviewField label="FULL NAME" value={detail.applicant.fullName} />
                        <OverviewField label="GENDER" value={detail.applicant.gender} />
                        <OverviewField label="MARITAL STATUS" value={detail.applicant.maritalStatus} />
                        <OverviewField label="DATE OF BIRTH" value={detail.applicant.birthDate} />
                        <OverviewField label="NRC" value={detail.applicant.nrc} />
                        <OverviewField label="NATIONALITY" value={detail.applicant.nationality} />
                        <OverviewField label="PHONE" value={detail.applicant.phone} />
                        <OverviewField label="EMAIL" value={detail.applicant.email} />
                        <OverviewField label="RESIDENTIAL ADDRESS" value={detail.applicant.residentialAddress} />
                        <OverviewField label="OCCUPATION" value={detail.applicant.occupation} />
                        <OverviewField label="EMPLOYER" value={detail.applicant.employerName} />
                      </div>
                    </Paper>

                    {detail.business.isBusinessLoan && (
                      <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                          <Text fz="lg" fw={600} c="gray.9" style={serif}>
                            Business information
                          </Text>
                          <Text fz="xs" c="dimmed">
                            Registered entity details
                          </Text>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                          <OverviewField label="COMPANY NAME" value={detail.business.companyName} />
                          <OverviewField label="TYPE OF BUSINESS" value={detail.business.typeOfBusiness} />
                          <OverviewField label="ESTABLISHED DATE" value={detail.business.establishedDate} />
                          <OverviewField label="REGISTERED OFFICE" value={detail.business.registeredOffice} />
                          <OverviewField label="NATURE OF BUSINESS" value={detail.business.natureOfBusiness} />
                        </div>
                      </Paper>
                    )}

                    <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                        <Text fz="lg" fw={600} c="gray.9" style={serif}>
                          Next of kin
                        </Text>
                        <Text fz="xs" c="dimmed">
                          Emergency / guarantor contact
                        </Text>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                        <OverviewField label="NAME" value={detail.nextOfKin.name} />
                        <OverviewField label="RELATIONSHIP" value={detail.nextOfKin.relationship} />
                        <OverviewField label="PHONE" value={detail.nextOfKin.phone} />
                      </div>
                    </Paper>
                  </div>
                </Tabs.Panel>

                {/* ---- Documents ---- */}
                <Tabs.Panel value="documents">
                  <SectionHeading
                    title="Documents"
                    aside={`${filteredDocuments.filter((d) => d.status === 'Uploaded').length} / ${filteredDocuments.length} shown`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filteredDocuments.map((doc) => (
                      <DocumentCard key={doc.id} doc={doc} />
                    ))}
                    {filteredDocuments.length === 0 && (
                      <Text fz="xs" c="dimmed">
                        No documents match your search.
                      </Text>
                    )}
                  </div>
                </Tabs.Panel>

                {/* ---- Activity ---- */}
                <Tabs.Panel value="activity">
                  <SectionHeading title="Activity" aside="Every touchpoint on this application, in order" />
                  <ActivityFeed activity={filteredActivity} />
                </Tabs.Panel>
              </Tabs>
            </div>

            {rightRail}
          </div>
        </div>
      </div>
    </div>
  );
}