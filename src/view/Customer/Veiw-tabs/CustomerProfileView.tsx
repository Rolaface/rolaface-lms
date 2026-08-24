import { Avatar, Badge, Tabs, Text } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconShieldCheck,
  IconUser,
  IconWallet,
} from '@tabler/icons-react';
import type { BorrowerProfile } from '../../../types/customerview';
import { OverviewPanel } from './sectiontab/OverviewPanel';
import { PersonalInfoPanel } from './sectiontab/PersonalInfoPanel';
import { KycCompliancePanel } from './sectiontab/KycCompliancePanel';
import { FinancialLendingPanel } from './sectiontab/FinancialLendingPanel';

export function CustomerProfileView({ borrower }: { borrower: BorrowerProfile }) {
  const loans = borrower.loans ?? [];
  const investments = borrower.investments ?? [];
  const savings = borrower.savings ?? [];
  const fixedDeposits = borrower.fixedDeposits ?? [];

  const totalFacilities = loans.length + investments.length + savings.length + fixedDeposits.length;

  const activeFacilities =
    loans.filter((loan) => loan.status === 'Active').length +
    investments.filter((item) => item.status === 'Active').length +
    savings.filter((item) => item.status === 'Active').length +
    fixedDeposits.filter((item) => item.status === 'Active').length;

  const initials = borrower.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      {/* Header: bigger avatar + inline quick facts so identity/contact
          basics don't have to be re-read further down the page. */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--mantine-color-slate-2)] p-4">
        <Avatar
          radius="xl"
          size={64}
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))',
            color: 'var(--mantine-color-white)',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          {initials}
        </Avatar>

        <div className="flex flex-1 flex-col gap-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <Text size="lg" fw={700} c="slate.8">
              {borrower.name}
            </Text>
            <Badge size="sm" color={borrower.status === 'Active' ? 'success' : 'danger'} variant="light">
              {borrower.status}
            </Badge>
          </div>
          <Text size="xs" c="slate.5">
            {borrower.custId}
          </Text>
        </div>

        <div className="flex flex-wrap gap-6 sm:ml-auto">
          <div>
            <Text size="xs" c="slate.5">
              Mobile
            </Text>
            <Text size="sm" fw={600} c="slate.8">
              {borrower.mobile ?? '—'}
            </Text>
          </div>
          <div>
            <Text size="xs" c="slate.5">
              Branch
            </Text>
            <Text size="sm" fw={600} c="slate.8">
              {borrower.branch ?? '—'}
            </Text>
          </div>
          <div>
            <Text size="xs" c="slate.5">
              Active facilities
            </Text>
            <Text size="sm" fw={600} c="slate.8">
              {activeFacilities} / {totalFacilities}
            </Text>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        variant="default"
        styles={{
          root: { display: 'flex', flexDirection: 'column' },
          tab: {
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--mantine-color-slate-5)',
            '&[data-active]': {
              color: 'var(--mantine-color-brand-6)',
              borderColor: 'var(--mantine-color-brand-6)',
            },
          },
        }}
      >
        {/* Sticky so switching tabs never requires re-scrolling up */}
        <Tabs.List className="sticky top-0 z-10 mb-4 flex-wrap gap-1 border-b border-[var(--mantine-color-slate-2)] bg-[var(--mantine-color-white)]">
          <Tabs.Tab value="overview" leftSection={<IconLayoutDashboard size={14} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="personal" leftSection={<IconUser size={14} />}>
            Personal Info
          </Tabs.Tab>
          <Tabs.Tab value="kyc" leftSection={<IconShieldCheck size={14} />}>
            KYC & Compliance
          </Tabs.Tab>
          <Tabs.Tab value="financial" leftSection={<IconWallet size={14} />}>
            Financial & Lending
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          <OverviewPanel borrower={borrower} activeFacilities={activeFacilities} totalFacilities={totalFacilities} />
        </Tabs.Panel>

        <Tabs.Panel value="personal">
          <PersonalInfoPanel borrower={borrower} />
        </Tabs.Panel>

        <Tabs.Panel value="kyc">
          <KycCompliancePanel borrower={borrower} />
        </Tabs.Panel>

        <Tabs.Panel value="financial">
          <FinancialLendingPanel borrower={borrower} activeFacilities={activeFacilities} totalFacilities={totalFacilities} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}