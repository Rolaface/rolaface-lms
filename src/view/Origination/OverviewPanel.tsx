import { Paper, Text } from '@mantine/core';
import type { LoanApplicationRow } from './LoanApplication';
import type { LoanApplicationDetail } from './LoanApplicationDetailParts';
import { DocumentCard, ActivityFeed, formatCurrency } from './LoanApplicationDetailParts';
import { OverviewField, SectionHeading, serif } from '../LoanAccount/LoanView/SharedUI';

export function OverviewPanel({
  application,
  detail,
}: {
  application: LoanApplicationRow;
  detail: LoanApplicationDetail;
}) {
  const docsUploaded = detail.documents.filter((d) => d.status === 'Uploaded').length;

  return (
    <div className="flex flex-col gap-5">
      <Paper
        radius="lg"
        className="overflow-hidden"
        style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
          <Text fz="lg" fw={600} c="slate.9" style={serif}>
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
      <Paper
        radius="lg"
        className="overflow-hidden"
        style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
      >
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
          <Paper
            radius="lg"
            className="overflow-hidden"
            style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
          >
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
          <Paper
            radius="lg"
            className="overflow-hidden"
            style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
              {detail.directors.map((dir) => (
                <div
                  key={dir.name}
                  className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 border-b last:border-b-0 border-[var(--mantine-color-slate-1)]"
                >
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
  );
}