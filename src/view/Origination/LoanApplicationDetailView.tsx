import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Paper, Tabs, Text } from '@mantine/core';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';

import type { LoanApplicationRow } from './LoanApplication';
import { getDisplayStatus } from './LoanApplication';
import { getLoanApplicationById } from '../../api/loanApplicationApi';
import {
  themeTokens,
  serif,
  formatCurrency,
  formatDate,
  OverviewField,
  StageBar,
  ApplicationSidebar,
  ApplicationSearchBar,
  ApplicationSnapshotPanel,
  DocumentStatusPanel,
  QuickLogPanel,
  buildDetailFromApi,
  buildFallbackDetail,
} from './LoanApplicationDetailParts';
import { OverviewPanel } from './OverviewPanel';
import { ApplicantBusinessPanel } from './ApplicantBusinessPanel';
import { DocumentsPanel } from './Documentspanel';
import { ActivityPanel } from './Activitypanel';

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
  const { data: applicationDetailResponse } = useQuery({
    queryKey: ['loan-application-detail', application.name],
    queryFn: () => getLoanApplicationById(application.name),
  });

  const apiData = applicationDetailResponse?.message?.data;

  const detail = useMemo(
    () => (apiData ? buildDetailFromApi(apiData) : buildFallbackDetail(application)),
    [apiData, application],
  );

  const [tab, setTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const displayStatus = getDisplayStatus(application.status);
  const scale =
    displayStatus === 'Approved'
      ? 'info'
      : displayStatus === 'Sanctioned'
        ? 'success'
        : displayStatus === 'Rejected'
          ? 'danger'
          : displayStatus === 'Closed'
            ? 'slate'
            : displayStatus === 'Draft'
              ? 'slate'
              : 'info';

  const isDraft = application.status === 'Draft';
  const isRejected = application.status === 'Cancelled';

  const accentColor =
    application.status === 'Sanctioned'
      ? themeTokens.success
      : application.status === 'Cancelled'
        ? themeTokens.danger
        : application.status === 'Closed'
          ? themeTokens.slateSoft
          : application.status === 'Submitted'
            ? themeTokens.success
            : themeTokens.info;

  const q = search.trim().toLowerCase();
  const filteredDocuments = useMemo(
    () => (q ? detail.documents.filter((d) => d.name.toLowerCase().includes(q)) : detail.documents),
    [detail.documents, q],
  );
  const filteredActivity = useMemo(
    () => (q ? detail.activity.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) : detail.activity),
    [detail.activity, q],
  );

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

      <div className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <div className="sticky top-0 z-40 bg-[var(--mantine-color-white)] border-b border-[var(--mantine-color-slate-2)] px-6 py-3">
          <ApplicationSearchBar value={search} onChange={setSearch} />
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              <Paper
                radius="lg"
                p="md"
                className="border-l-4"
                style={{
                  borderLeftColor: accentColor,
                  border: '1px solid var(--mantine-color-slate-2)',
                  borderLeftWidth: 4,
                  boxShadow: 'var(--mantine-shadow-md)',
                }}
              >
                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                  <div>
                    <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
                      LOAN APPLICATION · {application.name}
                    </Text>
                    <Text fz="xl" fw={700} c="slate.9" style={serif}>
                      {detail.applicant.fullName || 'Unnamed applicant'}
                    </Text>
                    <Text fz="xs" c="dimmed" className="mt-1">
                      Product: <span className="font-semibold text-[var(--mantine-color-slate-7)]">{application.application_type || '—'}</span>
                      {'   '}Applied: <span className="font-semibold text-[var(--mantine-color-slate-7)]">{formatDate(application.application_date)}</span>
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
                      {displayStatus}
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

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-[var(--mantine-color-slate-1)]">
                  <OverviewField label="LOAN PRODUCT" value={application.application_type || '—'} />
                  <OverviewField label="AMOUNT REQUESTED" value={formatCurrency(detail.loanTerms.amountRequested)} />
                  <OverviewField label="TENURE REQUESTED" value={`${detail.loanTerms.tenureMonths} months`} />
                  <OverviewField label="APPLICATION STATUS" value={displayStatus} />
                  <OverviewField label="APPLICATION DATE" value={formatDate(application.application_date)} />
                </div>

                <StageBar stage={detail.stage} isRejected={isRejected} />
              </Paper>

              <Tabs
                value={tab}
                onChange={(v) => v && setTab(v)}
                variant="default"
                color="indigo"
                styles={{
                  tab: {
                    fontWeight: 600,
                    color: 'var(--mantine-color-slate-5)',
                  },
                }}
              >
                <Tabs.List className="mb-5 flex-wrap gap-1 pb-0 border-b border-[var(--mantine-color-slate-2)]">
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  <Tabs.Tab value="applicant">Applicant &amp; Business</Tabs.Tab>
                  <Tabs.Tab value="documents">Documents</Tabs.Tab>
                  <Tabs.Tab value="activity">Activity</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview">
                  <OverviewPanel application={application} detail={detail} />
                </Tabs.Panel>

                <Tabs.Panel value="applicant">
                  <ApplicantBusinessPanel detail={detail} />
                </Tabs.Panel>

                <Tabs.Panel value="documents">
                  <DocumentsPanel documents={filteredDocuments} />
                </Tabs.Panel>

                <Tabs.Panel value="activity">
                  <ActivityPanel activity={filteredActivity} />
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