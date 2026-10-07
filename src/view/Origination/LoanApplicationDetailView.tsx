import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Paper, Tabs, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';

import type { LoanApplicationRow } from './LoanApplication';
import { CLOSED_STATUSES, STATUS_COLOR, displayStatus } from './LoanApplication';
import { getWorkflowActions } from '../../api/workflowApi';
import { useApplicationWorkflow } from './useApplicationWorkflow';
import * as LoanApplicationApi from '../../api/LosConfiguration/LoanApplicationApi';
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
import { FormPreviewPanel } from './FormPreviewPanel';

interface LoanApplicationDetailViewProps {
  application: LoanApplicationRow;
  onBack: () => void;
  onEdit?: () => void;
}

export function LoanApplicationDetailView({ application, onBack, onEdit }: LoanApplicationDetailViewProps) {
  const { data: apiData } = useQuery({
    queryKey: ['los-loan-application', application.name],
    queryFn: () => LoanApplicationApi.getById(application.name),
  });

  const detail = useMemo(
    () => (apiData ? buildDetailFromApi(apiData) : buildFallbackDetail(application)),
    [apiData, application],
  );

  const [tab, setTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const { data: workflowData } = useQuery({
    queryKey: ['los-workflow-actions', application.name],
    queryFn: () => getWorkflowActions(LoanApplicationApi.LOAN_APPLICATION_DOCTYPE, application.name),
    staleTime: 0,
  });
  const allowedActions = workflowData?.allowed_actions ?? [];
  const { modal: workflowModal, openAction } = useApplicationWorkflow();

  const status = displayStatus(apiData ?? application);
  const scale = STATUS_COLOR[status] ?? 'slate';
  const canEdit = !CLOSED_STATUSES.includes(apiData?.status ?? application.status);
  const isRejected = status === 'Rejected' || status === 'Cancelled';

  const accentColor =
    status === 'Approved'
      ? themeTokens.success
      : isRejected
        ? themeTokens.danger
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
      {workflowModal}
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
                      {detail.displayName}
                    </Text>
                    <Text fz="xs" c="dimmed" className="mt-1">
                      Loan type: <span className="font-semibold text-[var(--mantine-color-slate-7)]">{detail.loanTerms.loanType}</span>
                      {'   '}Applied: <span className="font-semibold text-[var(--mantine-color-slate-7)]">{formatDate(application.application_date)}</span>
                    </Text>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="light"
                      color={scale}
                      radius="xl"
                      size="lg"
                      styles={{ root: { textTransform: 'none', fontWeight: 700, border: `1px solid var(--mantine-color-${scale}-2)` } }}
                    >
                      {status}
                    </Badge>
                    {canEdit && onEdit && (
                      <Button size="xs" radius="md" variant="default" leftSection={<IconPencil size={13} />} onClick={onEdit}>
                        Edit
                      </Button>
                    )}
                    {allowedActions.map((wf) => (
                      <Button
                        key={wf.action}
                        size="xs"
                        radius="md"
                        variant="light"
                        color="violet"
                        onClick={() =>
                          openAction({
                            id: application.name,
                            applicantName: detail.displayName,
                            actions: allowedActions,
                            preselectedAction: wf.action,
                          })
                        }
                      >
                        {wf.action}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-[var(--mantine-color-slate-1)]">
                  <OverviewField label="LOAN TYPE" value={detail.loanTerms.loanType} />
                  <OverviewField label="AMOUNT REQUESTED" value={formatCurrency(detail.loanTerms.amountRequested)} />
                  <OverviewField label="TENURE REQUESTED" value={`${detail.loanTerms.tenureMonths} months`} />
                  <OverviewField label="APPLICATION STATUS" value={status} />
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
                  <Tabs.Tab value="preview">Form Preview</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview">
                  <OverviewPanel detail={detail} />
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

                <Tabs.Panel value="preview">
                  <FormPreviewPanel application={application} detail={detail} />
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