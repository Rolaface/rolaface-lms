import { Badge } from '@mantine/core';
import {
  IconBuildingBank,
  IconCalendar,
  IconId,
  IconMapPin,
  IconPhone,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import type { BorrowerProfile } from '../../../../types/customerview';
import { FieldGrid, SectionCard } from './Customerprofileshared ';

/**
 * NOTE: BorrowerProfile currently only has name/custId/mobile/branch/etc.
 * The onboarding form (Create Customer) collects many more fields than the
 * view model has today — middle name, preferred name, gender, DOB,
 * nationality, occupation, industry, employer for Individuals; registered
 * company name, registration number, incorporation date, employees, annual
 * revenue, directors & shareholders for Business; plus alternate mobile,
 * preferred communication, country/province/district/postal code/mailing
 * address, and next-of-kin details.
 *
 * Until BorrowerProfile is extended with these fields, this panel reads
 * them defensively via `borrower as any` and falls back to "—" so the
 * layout/labels are locked in now and wiring up real data later is just a
 * matter of extending the type — no UI changes needed.
 */

function field(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  return value as React.ReactNode;
}

/** True only when every value in the group is genuinely empty. */
function allEmpty(values: unknown[]) {
  return values.every((v) => v === undefined || v === null || v === '');
}

function IdentityIndividualSection({ borrower }: { borrower: any }) {
  return (
    <SectionCard icon={<IconUser size={16} />} title="Identity" subtitle="Individual customer">
      <FieldGrid
        columns={2}
        entries={[
          { label: 'Customer Type', value: 'Individual' },
          { label: 'Customer Number', value: borrower.custId, icon: <IconId size={13} /> },
          { label: 'First Name', value: field(borrower.firstName) },
          { label: 'Middle Name', value: field(borrower.middleName) },
          { label: 'Last Name', value: field(borrower.lastName) },
          { label: 'Preferred Name', value: field(borrower.preferredName) },
          { label: 'Gender', value: field(borrower.gender) },
          { label: 'Date of Birth', value: field(borrower.dateOfBirth), icon: <IconCalendar size={13} /> },
          { label: 'Nationality', value: field(borrower.nationality) },
          { label: 'Occupation', value: field(borrower.occupation) },
          { label: 'Industry', value: field(borrower.industry) },
          { label: 'Employer', value: field(borrower.employer) },
        ]}
      />
    </SectionCard>
  );
}

function IdentityBusinessSection({ borrower }: { borrower: any }) {
  const directors = borrower.directorsAndShareholders ?? [];

  return (
    <SectionCard icon={<IconBuildingBank size={16} />} title="Business Information" subtitle="Business customer">
      <FieldGrid
        columns={2}
        entries={[
          { label: 'Customer Type', value: 'Business' },
          { label: 'Customer Number', value: borrower.custId, icon: <IconId size={13} /> },
          { label: 'Registered Company Name', value: field(borrower.registeredCompanyName) },
          { label: 'Registration Number', value: field(borrower.registrationNumber) },
          { label: 'Incorporation Date', value: field(borrower.incorporationDate), icon: <IconCalendar size={13} /> },
          { label: 'Industry', value: field(borrower.industry) },
          { label: 'Employees', value: field(borrower.employees) },
          { label: 'Annual Revenue', value: field(borrower.annualRevenue) },
          { label: 'Address Line 1', value: field(borrower.addressLine1) },
          { label: 'Address Line 2', value: field(borrower.addressLine2) },
          { label: 'City / Town', value: field(borrower.city) },
        ]}
      />

      {directors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--mantine-color-slate-1)]">
          <div className="flex items-center gap-2 mb-2">
            <IconUsers size={14} style={{ color: 'var(--mantine-color-slate-5)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--mantine-color-slate-6)' }}>
              Directors & Shareholders
            </span>
            <Badge size="xs" variant="light" color="brand">
              {directors.length}
            </Badge>
          </div>
          <FieldGrid
            columns={2}
            entries={directors.map((d: any, i: number) => ({
              label: d.name ?? `Unnamed ${i + 1}`,
              value: `${d.role ?? '—'} · ${d.ownershipPercent ?? '—'}%`,
            }))}
          />
        </div>
      )}
    </SectionCard>
  );
}

function ContactSection({ borrower }: { borrower: any }) {
  return (
    <SectionCard icon={<IconPhone size={16} />} title="Contact Information">
      <FieldGrid
        columns={2}
        entries={[
          { label: 'Mobile Number', value: field(borrower.mobile), icon: <IconPhone size={13} />, emphasis: true },
          { label: 'Alternate Mobile', value: field(borrower.alternateMobile) },
          { label: 'Email Address', value: field(borrower.email) },
          { label: 'Preferred Communication', value: field(borrower.preferredCommunication) },
          { label: 'Residential Address', value: field(borrower.residentialAddress), icon: <IconMapPin size={13} /> },
          { label: 'Country', value: field(borrower.country) },
          { label: 'Province', value: field(borrower.province) },
          { label: 'District', value: field(borrower.district) },
          { label: 'City / Town', value: field(borrower.branch ?? borrower.city) },
          { label: 'Postal Code', value: field(borrower.postalCode) },
          { label: 'Mailing Address', value: field(borrower.mailingAddress ?? borrower.residentialAddress) },
        ]}
      />
    </SectionCard>
  );
}

function NextOfKinSection({ borrower }: { borrower: any }) {
  const kin = borrower.nextOfKin;
  const isEmpty = !kin || allEmpty(Object.values(kin));

  return (
    <SectionCard
      icon={<IconUsers size={16} />}
      title="Next of Kin"
      subtitle="Optional"
      empty={isEmpty}
      emptyLabel="No next of kin on file yet"
    >
      <FieldGrid
        columns={2}
        entries={[
          { label: 'First Name', value: field(kin?.firstName) },
          { label: 'Middle Name', value: field(kin?.middleName) },
          { label: 'Last Name', value: field(kin?.lastName) },
          { label: 'Relationship', value: field(kin?.relationship) },
          { label: 'Phone', value: field(kin?.phone) },
          { label: 'Address', value: field(kin?.address) },
          { label: 'District', value: field(kin?.district) },
          { label: 'City / Town', value: field(kin?.city) },
          { label: 'Postal Code', value: field(kin?.postalCode) },
        ]}
      />
    </SectionCard>
  );
}

export function PersonalInfoPanel({ borrower }: { borrower: BorrowerProfile }) {
  const b = borrower as any;
  const isBusiness = b.type === 'Company' || b.type === 'Business';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      {isBusiness ? <IdentityBusinessSection borrower={b} /> : <IdentityIndividualSection borrower={b} />}

      <div className="flex flex-col gap-4">
        <ContactSection borrower={b} />
        <NextOfKinSection borrower={b} />
      </div>
    </div>
  );
}