import { Badge, Button, Paper, RingProgress, Text, TextInput } from '@mantine/core';
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconFileCertificate,
  IconFileText,
  IconId,
  IconMessage,
  IconNote,
  IconPhoneCall,
  IconPhoto,
  IconSearch,
} from '@tabler/icons-react';

import type { LoanApplicationRow } from './LoanApplication';
import { STATUS_COLOR, getDisplayStatus } from './LoanApplication';

export const brand = {
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

export const serif = { fontFamily: 'Georgia, "Times New Roman", serif' };

export function formatCurrency(amount: number) {
  if (!amount && amount !== 0) return '—';
  return `K ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function formatDate(date: string) {
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
   TYPES
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

export const APPLICATION_STAGES: LoanApplicationDetail['stage'][] = [
  'Draft',
  'Submitted',
  'Under review',
  'Decision',
  'Closed',
];

export function stageForStatus(status: string): LoanApplicationDetail['stage'] {
  switch (status) {
    case 'Draft':
      return 'Draft';
    case 'Open':
      return 'Under review';
    case 'Submitted':
    case 'Cancelled':
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
   REAL-DATA MAPPING — sourced from GET get_custom_loan_application_by_id.
   Nothing here is invented: fields with no backend source render as '—'.
============================================================================ */

function applicantNameFromRow(row: LoanApplicationRow) {
  if (row.application_type === 'Business Loan') {
    return row.company_name || '—';
  }
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return fullName || '—';
}

function buildApplicantFullName(data: any, isBusinessLoan: boolean) {
  if (isBusinessLoan) {
    return (
      [data.applicant_first_name, data.applicant_middle_name, data.applicant_last_name]
        .filter(Boolean)
        .join(' ') || '—'
    );
  }
  return [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ') || '—';
}

function mapDocuments(data: any): ApplicationDocument[] {
  const docs: ApplicationDocument[] = [];

  (data.documents || []).forEach((d: any) => {
    if (!d.document_name && !d.file) return;
    docs.push({
      id: d.name,
      name: d.document_name || 'Document',
      status: d.file ? 'Uploaded' : 'Missing',
      size: '—',
      icon: 'file',
    });
  });

  (data.business_documents || []).forEach((d: any) => {
    if (!d.document_name && !d.file) return;
    docs.push({
      id: d.name,
      name: d.document_name || 'Document',
      status: d.file ? 'Uploaded' : 'Missing',
      size: '—',
      icon: 'certificate',
    });
  });

  return docs;
}

function mapActivity(data: any): ApplicationActivityItem[] {
  const activity: ApplicationActivityItem[] = [
    {
      id: 'created',
      date: data.application_date,
      kind: 'note',
      title: 'Application created',
      description: `Loan application ${data.name} was created.`,
      actor: 'Applicant',
    },
  ];

  if (data.status === 'Submitted' || data.status === 'Cancelled' || data.status === 'Sanctioned') {
    activity.push({
      id: 'decision',
      date: data.modified,
      kind: 'decision',
      title: `Application ${getDisplayStatus(data.status).toLowerCase()}`,
      description: data.status === 'Cancelled' ? 'Application was rejected.' : 'Application was approved.',
      actor: 'Loan Officer',
    });
  }

  return activity;
}

export function buildDetailFromApi(data: any): LoanApplicationDetail {
  const isBusinessLoan = data.application_type === 'Business Loan';

  return {
    applicant: {
      fullName: buildApplicantFullName(data, isBusinessLoan),
      gender: (isBusinessLoan ? data.applicant_gender : data.gender) || '—',
      maritalStatus: (isBusinessLoan ? data.applicant_marital_status : data.marital_status) || '—',
      birthDate: formatDate(isBusinessLoan ? data.applicant_birth_date : data.birth_date),
      nrc:
        (isBusinessLoan ? data.applicant_national_registration_card : data.national_registration_card) ||
        '—',
      phone: (isBusinessLoan ? data.applicant_phone : data.phone) || '—',
      email: (isBusinessLoan ? data.applicant_email : data.email) || '—',
      nationality: (isBusinessLoan ? data.applicant_nationality : data.nationality) || '—',
      residentialAddress: (isBusinessLoan ? data.applicant_address : data.residential_address) || '—',
      occupation: isBusinessLoan ? data.applicant_position || '—' : data.occupation || '—',
      employerName: isBusinessLoan ? data.company_name || '—' : data.employer_name || '—',
    },
    business: {
      isBusinessLoan,
      companyName: data.company_name || '—',
      typeOfBusiness: data.type_of_business || '—',
      establishedDate: isBusinessLoan ? formatDate(data.established_date) : '—',
      registeredOffice: data.registered_office || '—',
      natureOfBusiness: data.nature_of_business || '—',
    },
    nextOfKin: {
      name: data.next_of_kin_name || '—',
      relationship: data.next_of_kin_relationship || '—',
      phone: data.next_of_kin_phone || '—',
    },
    loanTerms: {
      amountRequested: Number(data.amount) || 0,
      tenureMonths: Number(data.tenure) || 0,
      purpose: (isBusinessLoan ? data.purpose_of_loan : data.loan_purpose) || '—',
      collateralPledged: data.collateral_pledged || 'None',
      proposedRepaymentFrequency: '—',
    },
    reviewer: { name: '—', initials: '—', branch: '—' },
    documents: mapDocuments(data),
    activity: mapActivity(data),
    stage: stageForStatus(data.status),
  };
}

export function buildFallbackDetail(row: LoanApplicationRow): LoanApplicationDetail {
  return {
    applicant: {
      fullName: applicantNameFromRow(row),
      gender: '—',
      maritalStatus: '—',
      birthDate: '—',
      nrc: '—',
      phone: '—',
      email: '—',
      nationality: '—',
      residentialAddress: '—',
      occupation: '—',
      employerName: '—',
    },
    business: {
      isBusinessLoan: row.application_type === 'Business Loan',
      companyName: row.company_name || '—',
      typeOfBusiness: '—',
      establishedDate: '—',
      registeredOffice: '—',
      natureOfBusiness: '—',
    },
    nextOfKin: { name: '—', relationship: '—', phone: '—' },
    loanTerms: {
      amountRequested: 0,
      tenureMonths: 0,
      purpose: '—',
      collateralPledged: '—',
      proposedRepaymentFrequency: '—',
    },
    reviewer: { name: '—', initials: '—', branch: '—' },
    documents: [],
    activity: [],
    stage: stageForStatus(row.status),
  };
}

/* ============================================================================
   SHARED UI BITS
============================================================================ */

export function OverviewField({ label, value }: { label: string; value: React.ReactNode }) {
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

export function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
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

export function DocumentCard({ doc }: { doc: ApplicationDocument }) {
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

export function ActivityFeed({ activity }: { activity: ApplicationActivityItem[] }) {
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

export function StageBar({ stage, isRejected }: { stage: LoanApplicationDetail['stage']; isRejected: boolean }) {
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
   LEFT SIDEBAR
============================================================================ */

export function ApplicationSidebar({
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
  const displayStatus = getDisplayStatus(application.status);
  const scale = STATUS_COLOR[displayStatus] ?? 'slate';

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
          {initialsOf(detail.applicant.fullName)}
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

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})` }}
          >
            {initialsOf(detail.applicant.fullName)}
          </div>
          <div>
            <Text fz="sm" fw={700} c="gray.9">
              {detail.applicant.fullName || 'Unnamed applicant'}
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
            {displayStatus}
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
                {application.application_type}
              </Text>
            </div>
            <Badge size="xs" variant="light" color={scale} styles={{ root: { fontSize: 9 } }}>
              {displayStatus}
            </Badge>
          </div>
          <Text fz={10} c="dimmed" className="mt-1">
            Applied {formatDate(application.application_date)}
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
   TOP BAR
============================================================================ */

export function ApplicationSearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
   RIGHT RAIL
============================================================================ */

export function ApplicationSnapshotPanel({ detail }: { detail: LoanApplicationDetail }) {
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

export function DocumentStatusPanel({ detail }: { detail: LoanApplicationDetail }) {
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

export function QuickLogPanel() {
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