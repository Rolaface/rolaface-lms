import { Paper, Text } from '@mantine/core';
import type { LoanApplicationDetail } from './LoanApplicationDetailParts';
import { OverviewField, serif } from '../LoanAccount/LoanView/SharedUI';

export function ApplicantBusinessPanel({ detail }: { detail: LoanApplicationDetail }) {
  return (
    <div className="flex flex-col gap-5">
      <Paper
        radius="lg"
        className="overflow-hidden"
        style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
          <Text fz="lg" fw={600} c="slate.9" style={serif}>
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
        <Paper
          radius="lg"
          className="overflow-hidden"
          style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
        >
          <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
            <Text fz="lg" fw={600} c="slate.9" style={serif}>
              Directors
            </Text>
            <Text fz="xs" c="dimmed">
              {detail.directors.length} on file
            </Text>
          </div>
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
      )}

      {detail.business.isBusinessLoan && (
        <Paper
          radius="lg"
          className="overflow-hidden"
          style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
        >
          <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
            <Text fz="lg" fw={600} c="slate.9" style={serif}>
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

      <Paper
        radius="lg"
        className="overflow-hidden"
        style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--mantine-color-slate-1)]">
          <Text fz="lg" fw={600} c="slate.9" style={serif}>
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
  );
}