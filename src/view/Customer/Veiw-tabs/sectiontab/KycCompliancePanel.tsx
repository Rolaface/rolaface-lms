import {
  IconFileText,
  IconId,
  IconShieldCheck,
  IconUserCheck,
} from '@tabler/icons-react';
import type { BorrowerProfile } from '../../../../types/customerview';
import { CheckTile, DocStatusRow, FieldGrid, SectionCard, StatusBadge } from './Customerprofileshared ';



function field(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  return value as React.ReactNode;
}

const REQUIRED_DOC_TYPES = ['Profile Photo', 'Signature', 'National ID', 'Utility Bill', 'Salary Slip', 'Bank Statement'];

export function KycCompliancePanel({ borrower }: { borrower: BorrowerProfile }) {
  const b = borrower as any;

  const idDocs: { name: string; number?: string; expiryDate?: string; verification?: string }[] =
    b.identificationDocuments ?? [];

  const checks = b.complianceChecks ?? {};

  const requiredDocs: { name: string; status?: string }[] = REQUIRED_DOC_TYPES.map((name) => {
    const match = (b.requiredDocuments ?? []).find((d: any) => d.name === name);
    return { name, status: match?.status };
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      {/* Left column: status summary + the 6 automated checks */}
      <div className="flex flex-col gap-4">
        <SectionCard icon={<IconShieldCheck size={16} />} title="Compliance Snapshot">
          <FieldGrid
            columns={2}
            entries={[
              { label: 'KYC Status', value: <StatusBadge status={b.kycStatus} /> },
              { label: 'Risk Rating', value: <StatusBadge status={b.riskRating} /> },
              { label: 'Relationship Since', value: field(b.relationshipSince) },
              { label: 'Relationship Manager', value: field(b.relationshipManager?.name) },
              { label: 'RM Branch', value: field(b.relationshipManager?.branch) },
            ]}
          />
        </SectionCard>

        <SectionCard
          icon={<IconUserCheck size={16} />}
          title="Verification & Screening"
          subtitle="Runs automatically during onboarding"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CheckTile
              icon={<IconShieldCheck size={14} />}
              title="KYC Verification"
              status={checks.kycVerification?.status}
              description="Confirms identity documents against issuing authority records."
            />
            <CheckTile
              icon={<IconShieldCheck size={14} />}
              title="AML Screening"
              status={checks.amlScreening?.status}
              description="Screens against anti-money-laundering watchlists."
            />
            <CheckTile
              icon={<IconShieldCheck size={14} />}
              title="Sanctions Screening"
              status={checks.sanctionsScreening?.status}
              description="Checks global and local sanctions lists."
            />
            <CheckTile
              icon={<IconUserCheck size={14} />}
              title="PEP Status"
              status={checks.pepStatus?.status}
              description="Politically exposed person screening."
            />
            <CheckTile
              icon={<IconFileText size={14} />}
              title="FATCA"
              status={checks.fatca?.status ?? 'Not applicable'}
              description="US tax reporting status."
            />
            <CheckTile
              icon={<IconFileText size={14} />}
              title="CRS"
              status={checks.crs?.status ?? 'Not applicable'}
              description="Common reporting standard for cross-border tax residency."
            />
          </div>
        </SectionCard>
      </div>

      {/* Right column: the two document checklists */}
      <div className="flex flex-col gap-4">
        <SectionCard
          icon={<IconId size={16} />}
          title="Identification Documents"
          empty={idDocs.length === 0}
          emptyLabel="No identification documents on file yet"
        >
          {idDocs.map((doc, i) => (
            <DocStatusRow
              key={i}
              name={doc.name}
              meta={`${doc.number ?? '—'} · Expires ${doc.expiryDate ?? '—'}`}
              status={doc.verification}
            />
          ))}
        </SectionCard>

        <SectionCard icon={<IconFileText size={16} />} title="Required Documents" subtitle="For onboarding sign-off">
          {requiredDocs.map((doc) => (
            <DocStatusRow key={doc.name} name={doc.name} status={doc.status} />
          ))}
        </SectionCard>
      </div>
    </div>
  );
}