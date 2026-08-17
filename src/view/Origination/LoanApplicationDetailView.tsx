import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Paper, Tabs, Text } from '@mantine/core';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';

import type { LoanApplicationRow } from './LoanApplication';
import { getDisplayStatus } from './LoanApplication';
import { getLoanApplicationById } from '../../api/loanApplicationApi';
import {
  brand,
  serif,
  formatCurrency,
  formatDate,
  OverviewField,
  SectionHeading,
  DocumentCard,
  ActivityFeed,
  StageBar,
  ApplicationSidebar,
  ApplicationSearchBar,
  ApplicationSnapshotPanel,
  DocumentStatusPanel,
  QuickLogPanel,
  buildDetailFromApi,
  buildFallbackDetail,
} from './LoanApplicationDetailParts';

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
      ? brand.teal
      : application.status === 'Cancelled'
        ? brand.rose
        : application.status === 'Closed'
          ? brand.slate
          : application.status === 'Submitted'
            ? brand.teal
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
                      {detail.applicant.fullName || 'Unnamed applicant'}
                    </Text>
                    <Text fz="xs" c="dimmed" className="mt-1">
                      Product: <span className="font-semibold text-gray-700">{application.application_type || '—'}</span>
                      {'   '}Applied: <span className="font-semibold text-gray-700">{formatDate(application.application_date)}</span>
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

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-gray-100">
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
      color: '#6B7280',
    },
  }}
>
  <Tabs.List className="mb-5 flex-wrap gap-1 pb-0 border-b border-gray-200">
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="applicant">Applicant &amp; Business</Tabs.Tab>
    <Tabs.Tab value="documents">Documents</Tabs.Tab>
    <Tabs.Tab value="activity">Activity</Tabs.Tab>
  </Tabs.List>

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
                        <OverviewField label="LOAN PRODUCT" value={application.application_type || '—'} />
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

                    {/* {detail.business.isBusinessLoan && (
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
                    )} */}
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

{detail.business.isBusinessLoan && detail.directors.length > 0 && (
  <>
    <SectionHeading title="Directors" aside={`${detail.directors.length} on file`} />
    <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
        {detail.directors.map((dir) => (
          <div key={dir.name} className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 border-b last:border-b-0 border-gray-50">
            <OverviewField label="NAME" value={dir.fullName} />
            <OverviewField label="PHONE" value={dir.phone} />
            <OverviewField label="EMAIL" value={dir.email} />
            <OverviewField label="NRC" value={dir.nrc} />
          </div>
        ))}
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
                    {detail.business.isBusinessLoan && detail.directors.length > 0 && (
  <Paper radius="lg" className="overflow-hidden" style={{ border: '1px solid #ECE8DD', boxShadow: '0 3px 14px rgba(36,31,61,0.06)' }}>
    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
      <Text fz="lg" fw={600} c="gray.9" style={serif}>Directors</Text>
      <Text fz="xs" c="dimmed">{detail.directors.length} on file</Text>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
      {detail.directors.map((dir) => (
        <div key={dir.name} className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 border-b last:border-b-0 border-gray-50">
          <OverviewField label="NAME" value={dir.fullName} />
          <OverviewField label="PHONE" value={dir.phone} />
          <OverviewField label="EMAIL" value={dir.email} />
          <OverviewField label="NRC" value={dir.nrc} />
        </div>
      ))}
    </div>
  </Paper>
)}

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