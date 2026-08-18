import { Button, Group } from '@mantine/core';
import {
  IconBriefcase,
  IconBuildingBank,
  IconChartArrows,
  IconCoin,
  IconFileText,
  IconFlag,
  IconLayoutGrid,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconWallet,
} from '@tabler/icons-react';
import type { BorrowerProfile } from '../../../../types/customerview';
import { CreditScoreGauge } from '../../../../components/shared/Creditscoregauge';
import { FacilityCountTile, FieldGrid, SectionCard, StatusBadge } from './Customerprofileshared ';

function field(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  return value as React.ReactNode;
}

function money(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  return `K ${Number(value).toLocaleString()}`;
}

export function FinancialLendingPanel({
  borrower,
  activeFacilities,
  totalFacilities,
  onRefetchCreditScore,
}: {
  borrower: BorrowerProfile;
  activeFacilities: number;
  totalFacilities: number;
  onRefetchCreditScore?: () => void | Promise<void>;
}) {
  const b = borrower as any;
  const credit = b.creditAssessment ?? {};
  const financial = b.financialProfile ?? {};

  return (
    <div className="flex flex-col gap-4">
      {/* Credit assessment — gauge on the left, bureau stats on the right,
          exactly mirroring the onboarding step so agents recognize it. */}
      <SectionCard
        icon={<IconChartArrows size={16} />}
        title="Credit Assessment"
        subtitle={credit.bureau ? `From ${credit.bureau}` : 'From bureau'}
      >
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
          <div className="shrink-0 mx-auto lg:mx-0">
            <CreditScoreGauge
              score={credit.score ?? null}
              lastFetchedAt={credit.fetchedAt ? new Date(credit.fetchedAt) : null}
              onRefetch={onRefetchCreditScore}
              size={160}
            />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <FieldGrid
              columns={4}
              entries={[
                { label: 'Active Facilities', value: field(credit.activeFacilities), icon: <IconLayoutGrid size={13} /> },
                { label: 'Defaults', value: field(credit.defaults) },
                {
                  label: 'Delinquencies',
                  value: credit.delinquencies ? `${credit.delinquencies} flagged` : field(credit.delinquencies),
                  icon: <IconFlag size={13} />,
                },
                {
                  label: 'Recent Inquiries',
                  value: credit.recentInquiries ? `${credit.recentInquiries} (90d)` : field(credit.recentInquiries),
                  icon: <IconSearch size={13} />,
                },
              ]}
            />

            <Group justify="space-between" mt="xs">
              <StatusBadge status={credit.status ?? 'Not assessed'} />
              <Group gap="xs">
                <Button size="xs" variant="default" leftSection={<IconFileText size={14} />}>
                  View Report
                </Button>
                <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={onRefetchCreditScore}>
                  Refresh
                </Button>
              </Group>
            </Group>
          </div>
        </div>
      </SectionCard>

      {/* Facility snapshot — loans/investments/savings/fixed deposits at a glance */}
      <SectionCard icon={<IconWallet size={16} />} title="Facility Snapshot">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FacilityCountTile label="Loans" count={b.loans?.length ?? 0} icon={<IconBuildingBank size={16} />} />
          <FacilityCountTile label="Investments" count={b.investments?.length ?? 0} icon={<IconChartArrows size={16} />} />
          <FacilityCountTile label="Savings" count={b.savings?.length ?? 0} icon={<IconWallet size={16} />} />
          <FacilityCountTile label="Fixed Deposits" count={b.fixedDeposits?.length ?? 0} icon={<IconCoin size={16} />} />
        </div>
        <FieldGrid
          columns={2}
          entries={[
            { label: 'Active Facilities', value: `${activeFacilities} / ${totalFacilities}`, emphasis: true },
            { label: 'Total Exposure', value: money(b.exposure) },
          ]}
        />
      </SectionCard>

      {/* Financial profile — the onboarding wizard's "optional" step */}
      <SectionCard
        icon={<IconBriefcase size={16} />}
        title="Financial Profile"
        subtitle="Optional"
        empty={
          !financial.educationLevel &&
          !financial.employmentType &&
          !financial.sourceOfIncome &&
          !financial.monthlyIncome &&
          !financial.annualIncome
        }
        emptyLabel="No financial profile on file yet"
      >
        <FieldGrid
          columns={3}
          entries={[
            { label: 'Education Level', value: field(financial.educationLevel) },
            { label: 'Employment Type', value: field(financial.employmentType) },
            { label: 'Source of Income', value: field(financial.sourceOfIncome) },
            { label: 'Monthly Income', value: financial.monthlyIncome ? money(financial.monthlyIncome) : '—' },
            { label: 'Annual Income', value: financial.annualIncome ? money(financial.annualIncome) : '—' },
            {
              label: 'Credit Risk Category',
              value: financial.creditRiskCategory ? (
                <StatusBadge status={financial.creditRiskCategory} />
              ) : (
                'Not yet assessed'
              ),
              icon: <IconShieldCheck size={13} />,
            },
            { label: 'Relationship Manager', value: field(financial.relationshipManager ?? b.relationshipManager?.name) },
          ]}
        />
      </SectionCard>
    </div>
  );
}