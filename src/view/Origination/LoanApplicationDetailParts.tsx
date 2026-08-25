import { ActionIcon, Avatar, Badge, Button, Loader, Modal, Paper, RingProgress, Text, TextInput } from '@mantine/core';
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconEye,
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
import { themeTokens, serif, OverviewField, SectionHeading } from '../LoanAccount/LoanView/SharedUI';
import { useState } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { getSymbol } from '../../store/currencyStore';

// Re-exported so anywhere else in the app that was importing these from
// this file (brand/serif/OverviewField/SectionHeading previously lived
// here) keeps working without changes.
export { themeTokens, serif, OverviewField, SectionHeading };

export function formatCurrency(amount: number) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
    const currencySymbol = getSymbol(companyCurrency);
  if (!amount && amount !== 0) return '—';
  return `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
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

type DocumentIcon = 'id' | 'photo' | 'file' | 'certificate';
type DocumentStatus = 'Uploaded' | 'Missing';

export interface ApplicationDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  size: string;
  icon: DocumentIcon;
  file?: string;
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
export interface DirectorInfo {
  name: string;
  fullName: string;
  phone: string;
  email: string;
  nrc: string;
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
  directors: DirectorInfo[];
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

  // 1. Loop for Personal Loan Documents
  (data.documents || []).forEach((d: any) => {
    if (!d.document_name && !d.file) return;

    const fileName = d.file ? d.file.split('/').pop() : '—';

    docs.push({
      id: d.name,
      name: d.document_name || 'Document',
      status: d.file ? 'Uploaded' : 'Missing',
      size: fileName,
      icon: 'file',
      file: d.file,
    });
  });

  // 2. Loop for Business Loan Documents
  (data.business_documents || []).forEach((d: any) => {
    if (!d.document_name && !d.file) return;

    const fileName = d.file ? d.file.split('/').pop() : '—';

    docs.push({
      id: d.name,
      name: d.document_name || 'Document',
      status: d.file ? 'Uploaded' : 'Missing',
      size: fileName,
      icon: 'certificate',
      file: d.file,
    });
  });

  return docs;
}

// function mapActivity(data: any): ApplicationActivityItem[] {
//   const activity: ApplicationActivityItem[] = [
//     {
//       id: 'created',
//       date: data.application_date,
//       kind: 'note',
//       title: 'Application created',
//       description: `Loan application ${data.name} was created.`,
//       actor: 'Applicant',
//     },
//   ];

//   if (data.status === 'Submitted' || data.status === 'Cancelled' || data.status === 'Sanctioned') {
//     activity.push({
//       id: 'decision',
//       date: data.modified,
//       kind: 'decision',
//       title: `Application ${getDisplayStatus(data.status).toLowerCase()}`,
//       description: data.status === 'Cancelled' ? 'Application was rejected.' : 'Application was approved.',
//       actor: 'Loan Officer',
//     });
//   }

//   return activity;
// }
function mapComments(data: any): ApplicationActivityItem[] {
  if (!data._comments) return [];

  let parsed: { comment: string; by: string; name: string }[] = [];
  try {
    parsed = JSON.parse(data._comments);
  } catch {
    return [];
  }

  return parsed.map((c) => ({
    id: c.name,
    date: data.modified,
    kind: 'note',
    title: c.by,
    description: c.comment,
    actor: c.by,
  }));
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

  activity.push(...mapComments(data));

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
    directors: (data.directors || []).map((d: any) => ({
      name: d.name,
      fullName: d.director_name || '—',
      phone: d.director_phone || '—',
      email: d.director_email || '—',
      nrc: d.national_registration_card || '—',
    })),
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
    directors: [],
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

const documentIconMap: Record<DocumentIcon, React.ReactNode> = {
  id: <IconId size={16} />,
  photo: <IconPhoto size={16} />,
  file: <IconFileText size={16} />,
  certificate: <IconFileCertificate size={16} />,
};

export function DocumentCard({ doc }: { doc: ApplicationDocument }) {
  const missing = doc.status === 'Missing';
  const accent = missing
    ? { bg: themeTokens.dangerSoft, fg: themeTokens.danger }
    : { bg: themeTokens.infoSoft, fg: themeTokens.info };
  
  const ERP_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") as string;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!doc.file) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const fileUrl = `${ERP_BASE}${doc.file}`;

      const response = await fetch(fileUrl, { credentials: 'include' });

      if (!response.ok) {
        throw new Error(`Failed to load: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/html')) {
        throw new Error("Received HTML instead of a file. Check Vite proxy config.");
      }

      setIsImage(contentType.includes('image'));

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
    } catch (error: any) {
      console.error('Preview error:', error);
      setErrorMsg(error.message || "Failed to load document.");
      setPreviewUrl("error"); 
    } finally {
      setIsLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl && previewUrl !== "error") {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setErrorMsg(null);
  };

  const handleDownload = () => {
    if (!previewUrl || previewUrl === "error") return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = doc.name || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const canPreview = !missing && !!doc.file;

  return (
    <>
      <Paper
        withBorder
        radius="lg"
        p="sm"
        className="flex flex-col gap-2 transition-shadow hover:shadow-md"
        style={{
          borderColor: 'var(--mantine-color-slate-2)',
          boxShadow: 'var(--mantine-shadow-xs)',
          cursor: canPreview ? 'pointer' : 'default',
        }}
        onDoubleClick={canPreview ? handlePreview : undefined}
      >
        <div className="flex flex-row items-center justify-between w-full">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: accent.bg, color: accent.fg }}
          >
            {documentIconMap[doc.icon]}
          </div>

          {canPreview && (
            <ActionIcon
              variant="light"
              color="info"
              size="md"
              radius="md"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handlePreview();
              }}
              disabled={isLoading}
              aria-label={`Preview ${doc.name}`}
              title="Preview document"
            >
              {isLoading ? <Loader size={16} /> : <IconEye size={16} />}
            </ActionIcon>
          )}
        </div>

        <div className="min-w-0 w-full mt-1">
          <Text fz="sm" fw={700} c="slate.9" truncate>
            {doc.name}
          </Text>
          <Text fz={11} fw={600} c={missing ? undefined : 'dimmed'} style={missing ? { color: themeTokens.danger } : undefined} truncate>
            {doc.status} · {doc.file ? doc.file.split('/').pop() : doc.size}
          </Text>
        </div>
      </Paper>

      <Modal
        opened={!!previewUrl}
        onClose={closePreview}
        title={<Text fw={700} c="slate.9">{doc.name}</Text>}
        size="xl"
        centered
        withCloseButton
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <div className="flex flex-col gap-4">
          <div className="w-full bg-[var(--mantine-color-slate-0)] rounded-md overflow-hidden flex items-center justify-center min-h-[50vh]">
            
            {errorMsg ? (
              <Text c="red" fw={500}>{errorMsg}</Text>
            ) : isImage ? (
              <img 
                src={previewUrl!} 
                alt={doc.name} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <iframe
                src={previewUrl!}
                className="w-full h-[70vh] border-0"
                title={`Preview of ${doc.name}`}
              />
            )}

          </div>

          <div className="flex justify-end gap-3 pt-3 mt-1 border-t border-[var(--mantine-color-slate-2)]">
            <Button variant="default" onClick={closePreview}>
              Close
            </Button>
            <Button 
              leftSection={<IconDownload size={16} />} 
              onClick={handleDownload}
              disabled={!!errorMsg}
              styles={{ root: { backgroundColor: themeTokens.primary } }}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
const activityKindIcon: Record<ActivityKind, React.ReactNode> = {
  note: <IconNote size={11} />,
  call: <IconPhoneCall size={11} />,
  decision: <IconMessage size={11} />,
};
const activityKindLabel: Record<ActivityKind, string> = { note: 'Note', call: 'Call', decision: 'Decision' };
const activityKindTone: Record<ActivityKind, { bg: string; fg: string }> = {
  note: { bg: themeTokens.infoSoft, fg: themeTokens.info },
  call: { bg: themeTokens.warningSoft, fg: 'var(--mantine-color-warning-8)' },
  decision: { bg: themeTokens.successSoft, fg: themeTokens.success },
};

export function ActivityFeed({ activity }: { activity: ApplicationActivityItem[] }) {
  return (
    <Paper radius="lg" className="p-4" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
      <div className="flex flex-col">
        {activity.map((a, idx) => {
          const tone = activityKindTone[a.kind];
          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1"
                  style={{ borderColor: tone.fg, backgroundColor: 'var(--mantine-color-white)' }}
                />
                {idx < activity.length - 1 && <span className="w-px flex-1 bg-[var(--mantine-color-slate-2)]" />}
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
                <Text fz="xs" fw={600} c="slate.9">
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
    <div className="pt-3 border-t border-[var(--mantine-color-slate-1)]">
      <div className="flex items-center gap-2">
        {APPLICATION_STAGES.map((s, idx) => {
          const done = idx < currentIndex || (idx === currentIndex && s !== 'Decision');
          const isCurrent = idx === currentIndex;
          const color = isRejected && isCurrent ? themeTokens.danger : done || isCurrent ? themeTokens.success : themeTokens.slateSoft;
          return (
            <div key={s} className="flex-1 flex flex-col gap-1.5">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <Text fz={10} c={isCurrent ? 'slate.9' : 'dimmed'} fw={isCurrent ? 700 : 500}>
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
      <div className="flex flex-col items-center gap-3 w-12 shrink-0 border-r border-[var(--mantine-color-slate-2)] bg-[var(--mantine-color-white)] py-3">
        <Button variant="subtle" color="gray" size="xs" px={4} onClick={onToggleCollapsed}>
          <IconChevronRight size={16} />
        </Button>
        <Avatar
          radius="xl"
          size={32}
          style={{
            background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`,
            color: 'var(--mantine-color-white)',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {initialsOf(detail.applicant.fullName)}
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:w-80 shrink-0 h-screen sticky top-0 border-r border-[var(--mantine-color-slate-2)] bg-[var(--mantine-color-white)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
        <Button variant="subtle" color="slate" size="xs" px={4} onClick={onBack}>
          <IconArrowLeft size={16} />
        </Button>
        <Button variant="subtle" color="slate" size="xs" px={4} className="ml-auto" onClick={onToggleCollapsed}>
          <IconChevronLeft size={16} />
        </Button>
      </div>

      <div className="px-4 py-4 border-b border-[var(--mantine-color-slate-1)]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={44}
            style={{
              background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`,
              color: 'var(--mantine-color-white)',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {initialsOf(detail.applicant.fullName)}
          </Avatar>
          <div>
            <Text fz="sm" fw={700} c="slate.9">
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
            <Text fz="xs" c="slate.7" className="font-mono">
              {detail.applicant.phone}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              NRC
            </Text>
            <Text fz="xs" c="slate.7">
              {detail.applicant.nrc}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Email
            </Text>
            <Text fz="xs" c="slate.7" className="truncate max-w-[140px]">
              {detail.applicant.email}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: themeTokens.primarySoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              AMOUNT REQUESTED
            </Text>
            <Text fz="sm" fw={700} style={{ color: themeTokens.primary }}>
              {formatCurrency(detail.loanTerms.amountRequested)}
            </Text>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: themeTokens.successSoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              TENURE REQUESTED
            </Text>
            <Text fz="sm" fw={700} style={{ color: themeTokens.success }}>
              {detail.loanTerms.tenureMonths} months
            </Text>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wide mb-2">
          THIS APPLICATION
        </Text>
        <div
          className="rounded-lg border-l-[3px] border p-2.5"
          style={{ borderColor: 'var(--mantine-color-slate-2)', borderLeftColor: themeTokens.info, backgroundColor: themeTokens.infoSoft }}
        >
          <div className="flex justify-between items-start mb-1">
            <div>
              <Text fz="xs" fw={700} c="slate.9">
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
            Stage: <span className="font-semibold text-[var(--mantine-color-slate-7)]">{detail.stage}</span>
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
      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <div className="flex items-center gap-4 mb-4">
          <RingProgress
            size={88}
            thickness={8}
            sections={[{ value: pct, color: themeTokens.warning }]}
            rootColor="var(--mantine-color-slate-2)"
          />
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
            <Text fz="xs" fw={700} c="slate.9">
              {detail.stage}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Loan product
            </Text>
            <Text fz="xs" fw={700} c="slate.9">
              {detail.loanTerms.purpose}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Documents on file
            </Text>
            <Text fz="xs" fw={700} c="slate.9" className="font-mono">
              {uploaded} / {detail.documents.length}
            </Text>
          </div>
        </div>
      </Paper>

      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Text fz="xs" fw={700} c="slate.9" className="mb-3">
          Assigned loan officer
        </Text>
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={36}
            style={{
              background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`,
              color: 'var(--mantine-color-white)',
            }}
          >
            {detail.reviewer.initials}
          </Avatar>
          <div>
            <Text fz="xs" fw={700} c="slate.9">
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
          styles={{ root: { backgroundColor: themeTokens.primarySoft, color: themeTokens.primary } }}
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
      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wider mb-3">
          DOCUMENT STATUS
        </Text>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: themeTokens.slateSoft }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: missing.length ? themeTokens.warning : themeTokens.success }}
          />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Complete
            </Text>
            <Text fz="xs" fw={700} c="slate.9" className="font-mono">
              {uploaded} / {detail.documents.length}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Missing
            </Text>
            <Text fz="xs" fw={700} style={{ color: missing.length ? themeTokens.warning : undefined }} c={missing.length ? undefined : 'slate.9'}>
              {missing.length ? missing.map((m) => m.name).join(', ') : 'None'}
            </Text>
          </div>
        </div>
        <Button fullWidth size="xs" styles={{ root: { backgroundColor: themeTokens.primary } }} disabled={!missing.length}>
          Request from applicant
        </Button>
      </Paper>
    </div>
  );
}

export function QuickLogPanel() {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wider mb-3">
          QUICK LOG
        </Text>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="xs" styles={{ root: { backgroundColor: themeTokens.primary } }} leftSection={<IconNote size={14} />}>
            Add note
          </Button>
          <Button
            fullWidth
            size="xs"
            variant="light"
            styles={{ root: { backgroundColor: themeTokens.infoSoft, color: themeTokens.info } }}
            leftSection={<IconPhoneCall size={14} />}
          >
            Log a call
          </Button>
        </div>
      </Paper>
    </div>
  );
}