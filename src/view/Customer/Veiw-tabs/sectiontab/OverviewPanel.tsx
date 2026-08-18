import { Group, Progress, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBell,
  IconBuildingBank,
  IconChartPie,
  IconCircleCheck,
  IconExternalLink,
  IconFileUpload,
  IconPlus,
  IconRepeat,
  IconShieldCheck,
  IconTags,
  IconUser,
  IconWallet,
  IconCalendar,
} from '@tabler/icons-react';
import type { BorrowerProfile } from '../../../../types/customerview';
import { InfoRow, SectionCard, StatCard, StatusBadge } from './Customerprofileshared ';
import { RiskRatingCard } from './Riskratingcard';


const DEMO_EXPOSURE = 2450000;
const DEMO_OUTSTANDING = 1820000;
const DEMO_OVERDUE = 0;

const DEMO_EXPOSURE_TREND = [
  2180000,
  2240000,
  2190000,
  2310000,
  2270000,
  2390000,
  2350000,
  2450000,
];

const DEMO_OUTSTANDING_TREND = [
  1490000,
  1530000,
  1510000,
  1580000,
  1560000,
  1690000,
  1760000,
  1820000,
];


function field(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  return value as React.ReactNode;
}

function money(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  return `ZMW ${Number(value).toLocaleString()}`;
}

interface Alert {
  label: string;
  severity: 'danger' | 'warning';
}

function buildAlerts(b: any): Alert[] {
  const alerts: Alert[] = [];
  if (b.kycStatus && b.kycStatus !== 'Verified') {
    alerts.push({ label: `KYC verification ${String(b.kycStatus).toLowerCase()}`, severity: 'warning' });
  }
  const overdueLoans = (b.loans ?? []).filter((l: any) => l.status === 'Overdue').length;
  if (overdueLoans > 0) {
    alerts.push({ label: `${overdueLoans} facility${overdueLoans > 1 ? 'ies' : 'y'} overdue`, severity: 'danger' });
  }
  return alerts;
}

function AlertsBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  const hasDanger = alerts.some((a) => a.severity === 'danger');
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
      style={{
        borderColor: hasDanger ? 'var(--mantine-color-danger-3)' : 'var(--mantine-color-warning-3)',
        backgroundColor: hasDanger ? 'var(--mantine-color-danger-0)' : 'var(--mantine-color-warning-0)',
      }}
    >
      <ThemeIcon variant="light" color={hasDanger ? 'danger' : 'warning'} size={30} radius="md">
        <IconAlertTriangle size={16} />
      </ThemeIcon>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {alerts.map((a) => (
          <Text key={a.label} size="xs" fw={600} c={a.severity === 'danger' ? 'danger.7' : 'warning.7'}>
            {a.label}
          </Text>
        ))}
      </div>
    </div>
  );
}

/** Donut built with a conic-gradient rather than SVG arcs. */
function FacilityDonut({ active, activeOverdue, closed }: { active: number; activeOverdue: number; closed: number }) {
  const total = active + activeOverdue + closed;
  const activePct = total ? (active / total) * 100 : 0;
  const overduePct = total ? (activeOverdue / total) * 100 : 0;

  const activeColor = 'var(--mantine-color-success-5)';
  const overdueColor = 'var(--mantine-color-brand-6)';
  const closedColor = 'var(--mantine-color-slate-3)';

  const gradient = total
    ? `conic-gradient(${activeColor} 0% ${activePct}%, ${overdueColor} ${activePct}% ${activePct + overduePct}%, ${closedColor} ${activePct + overduePct}% 100%)`
    : 'var(--mantine-color-slate-2)';

  const legend: { color: string; label: string; count: number }[] = [
    { color: activeColor, label: 'Active', count: active },
    { color: overdueColor, label: 'Active (Overdue)', count: activeOverdue },
    { color: closedColor, label: 'Closed', count: closed },
  ];

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 112, height: 112, borderRadius: '50%', background: gradient }}>
        <div
          className="absolute rounded-full flex flex-col items-center justify-center"
          style={{ inset: 14, backgroundColor: 'var(--mantine-color-white)' }}
        >
          <Text fw={800} fz={24} c="slate.8" lh={1}>
            {total}
          </Text>
          <Text fz={9} c="slate.5" ta="center" mt={2}>
            Total Facilities
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: l.color }} />
            <Text size="xs" c="slate.6">
              {l.label}
            </Text>
            <Text size="xs" fw={700} c="slate.8">
              {l.count}
            </Text>
            <Text size="xs" c="slate.4">
              ({total ? Math.round((l.count / total) * 100) : 0}%)
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <UnstyledButton
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-2 rounded-md transition-colors"
      style={{ ':hover': {} } as any}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-slate-0)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <ThemeIcon variant="light" color="brand" size={32} radius="xl">
        {icon}
      </ThemeIcon>
      <Text size={9} c="slate.6" fw={600} ta="center" lh={1.2}>
        {label}
      </Text>
    </UnstyledButton>
  );
}

/** Facility Portfolio card — donut + mini exposure/utilization stats + quick actions, matching the reference layout. */
function FacilityPortfolioCard({
  facilityActive,
  facilityOverdue,
  facilityClosed,
  exposure,
  utilizationPct,
  onNewFacility,
  onViewFacilities,
  onExposureBreakup,
  onFacilityAlerts,
}: {
  facilityActive: number;
  facilityOverdue: number;
  facilityClosed: number;
  exposure: unknown;
  utilizationPct?: number;
  onNewFacility?: () => void;
  onViewFacilities?: () => void;
  onExposureBreakup?: () => void;
  onFacilityAlerts?: () => void;
}) {
  return (
    <SectionCard
      icon={<IconBuildingBank size={16} />}
      title="Facility Portfolio"
      action={
        onViewFacilities && (
          <UnstyledButton onClick={onViewFacilities}>
            <Text size="xs" fw={700} c="brand.6">
              View all facilities
            </Text>
          </UnstyledButton>
        )
      }
    >
      <FacilityDonut active={facilityActive} activeOverdue={facilityOverdue} closed={facilityClosed} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-md p-3" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}>
          <Text size="xs" c="slate.5">
            Total Exposure
          </Text>
          <Text size="md" fw={700} c="slate.8" mt={2}>
            {money(exposure)}
          </Text>
        </div>
        <div className="rounded-md p-3" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}>
          <Text size="xs" c="slate.5">
            Utilization
          </Text>
          <Text size="md" fw={700} c="slate.8" mt={2}>
            {utilizationPct !== undefined ? `${utilizationPct}%` : '—'}
          </Text>
          <Progress value={utilizationPct ?? 0} size={4} radius="xl" color="brand" mt={6} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 mt-4 pt-3 border-t border-[var(--mantine-color-slate-1)]">
        <QuickAction icon={<IconPlus size={16} />} label="New Facility" onClick={onNewFacility} />
        <QuickAction icon={<IconBuildingBank size={16} />} label="View Facilities" onClick={onViewFacilities} />
        <QuickAction icon={<IconChartPie size={16} />} label="Exposure Breakup" onClick={onExposureBreakup} />
        <QuickAction icon={<IconBell size={16} />} label="Facility Alerts" onClick={onFacilityAlerts} />
      </div>
    </SectionCard>
  );
}

/** Repayment Overview card — highlighted Next Payment / Amount Due boxes + status banner, matching the reference layout. */
function RepaymentOverviewCard({
  repayment,
  onViewAllPayments,
  onViewSchedule,
}: {
  repayment: any;
  onViewAllPayments?: () => void;
  onViewSchedule?: () => void;
}) {
  const isOverdue = Boolean(repayment.emiOverdue);

  return (
    <SectionCard
      icon={<IconRepeat size={16} />}
      title="Repayment Overview"
      action={
        onViewAllPayments && (
          <UnstyledButton onClick={onViewAllPayments}>
            <Text size="xs" fw={700} c="brand.6">
              View all payments
            </Text>
          </UnstyledButton>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div
          className="rounded-md p-3"
          style={{ backgroundColor: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-1)' }}
        >
          <Group gap={6} wrap="nowrap">
            <ThemeIcon variant="light" color="brand" size={22} radius="md">
              <IconCalendar size={13} />
            </ThemeIcon>
            <Text size="xs" c="slate.5">
              Next Payment
            </Text>
          </Group>
          <Text mt={8} size="md" fw={800} c="slate.8">
            {field(repayment.nextDueDate)}
          </Text>
          {repayment.daysUntilNext !== undefined && (
            <Text size="xs" c="slate.5" mt={2}>
              in {repayment.daysUntilNext} days
            </Text>
          )}
        </div>

        <div
          className="rounded-md p-3"
          style={{ backgroundColor: 'var(--mantine-color-success-0)', border: '1px solid var(--mantine-color-success-2)' }}
        >
          <Text size="xs" c="slate.5">
            Amount Due
          </Text>
          <Text mt={8} size="md" fw={800} c="slate.8">
            {money(repayment.emiDue)}
          </Text>
          {onViewSchedule && (
            <UnstyledButton onClick={onViewSchedule}>
              <Text mt={2} size="xs" fw={700} c="brand.6" td="underline">
                View Schedule
              </Text>
            </UnstyledButton>
          )}
        </div>
      </div>

      <InfoRow
        label="Overdue Amount"
        value={
          <Text size="xs" fw={700} c={isOverdue ? 'danger.6' : 'slate.8'}>
            {money(repayment.emiOverdue ?? 0)}
          </Text>
        }
      />
      <InfoRow
        label="Days Past Due (Max)"
        value={
          <Text size="xs" fw={700} c={repayment.daysPastDueMax ? 'danger.6' : 'slate.8'}>
            {repayment.daysPastDueMax ?? 0}
          </Text>
        }
      />
      <InfoRow label="Repayment Frequency" value={field(repayment.frequency)} />
      <InfoRow label="EMI / Installment" value={money(repayment.emiDue)} bordered={false} />

      <div
        className="flex items-center gap-2.5 rounded-md p-3 mt-3"
        style={{ backgroundColor: isOverdue ? 'var(--mantine-color-danger-0)' : 'var(--mantine-color-success-0)' }}
      >
        <ThemeIcon variant="filled" color={isOverdue ? 'danger' : 'success'} size={26} radius="xl">
          {isOverdue ? <IconAlertCircle size={14} /> : <IconCircleCheck size={14} />}
        </ThemeIcon>
        <div>
          <Text size="xs" fw={700} c={isOverdue ? 'danger.7' : 'success.7'}>
            {isOverdue ? 'Payment overdue' : 'All payments are up to date'}
          </Text>
          <Text size="xs" c="slate.5">
            {isOverdue ? `${repayment.daysPastDueMax ?? 0} days past due` : 'No dues as of today'}
          </Text>
        </div>
      </div>
    </SectionCard>
  );
}

const ACTIVITY_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  payment: { icon: <IconCircleCheck size={15} />, color: 'success' },
  disbursement: { icon: <IconBuildingBank size={15} />, color: 'brand' },
  document: { icon: <IconFileUpload size={15} />, color: 'warning' },
  default: { icon: <IconAlertCircle size={15} />, color: 'gray' },
};

/** Horizontal timeline with connecting dashes, matching the reference "Recent Activity" strip. */
function ActivityTimeline({ activity }: { activity: any[] }) {
  const items = activity.slice(0, 5);
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-[var(--mantine-color-slate-2)] py-6">
        <Text size="xs" c="slate.4">
          No activity recorded yet
        </Text>
      </div>
    );
  }
  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {items.map((a, i) => {
        const meta = ACTIVITY_ICON[a.type] ?? ACTIVITY_ICON.default;
        return (
          <div key={i} className="flex items-start shrink-0">
            <div className="flex flex-col items-start px-2" style={{ minWidth: 156, maxWidth: 176 }}>
              <ThemeIcon variant="light" color={meta.color} size={34} radius="xl" className="mb-2">
                {meta.icon}
              </ThemeIcon>
              <Text size="xs" fw={700} c="slate.8">
                {a.title}
              </Text>
              <Text size="xs" c="slate.5" mt={2} truncate w="100%">
                {a.description}
              </Text>
              <Text size="xs" c="slate.4" mt={4}>
                {a.timestamp}
              </Text>
            </div>
            {i < items.length - 1 && (
              <div className="flex items-center pt-4 shrink-0" style={{ width: 28 }}>
                <div style={{ width: '100%', borderTop: '1px dashed var(--mantine-color-slate-3)' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OverviewPanel({
  borrower,
  activeFacilities,
  totalFacilities,
}: {
  borrower: BorrowerProfile;
  activeFacilities: number;
  totalFacilities: number;
}) {
  const b = borrower as any;
  const repayment = b.repaymentSummary ?? {};
  const activity: any[] = b.recentActivity ?? [];
  const alerts = buildAlerts(b);

  const outstandingPct = b.exposure ? Math.round(((b.outstandingBalance ?? 0) / b.exposure) * 100) : undefined;
  const overdueAccounts = (b.loans ?? []).filter((l: any) => l.status === 'Overdue').length;

  const facilityClosed = (b.loans ?? []).filter((l: any) => l.status === 'Closed').length;
  const facilityOverdue = (b.loans ?? []).filter((l: any) => l.status === 'Overdue').length;
  const facilityActive = Math.max(activeFacilities - facilityOverdue, 0);

  return (
    <div className="flex flex-col gap-4">
      <AlertsBanner alerts={alerts} />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 <StatCard
  label="Total Exposure"
  value={money(DEMO_EXPOSURE)}
  subtitle={`Across ${totalFacilities} facilities`}
  icon={<IconWallet size={18} />}
  sparkline={DEMO_EXPOSURE_TREND}
  trend="4.1% vs last month"
  trendDirection="up"
/>

<StatCard
  label="Outstanding Balance"
  value={money(DEMO_OUTSTANDING)}
  subtitle={`${Math.round((DEMO_OUTSTANDING / DEMO_EXPOSURE) * 100)}% of exposure`}
  icon={<IconBuildingBank size={18} />}
  sparkline={DEMO_OUTSTANDING_TREND}
  trend="2.8% vs last month"
  trendDirection="up"
/>

<StatCard
  label="Overdue Amount"
  value={money(DEMO_OVERDUE)}
  subtitle="All payments current"
  icon={<IconAlertCircle size={18} />}
  tone="danger"
  rightIcon={
    <ThemeIcon variant="light" color="success" size={34} radius="xl">
      <IconCircleCheck size={18} />
    </ThemeIcon>
  }
/>
        <RiskRatingCard
          riskRating={b.riskRating}
          creditScore={b.riskScore ?? b.creditAssessment?.score}
          riskAssessedAt={b.riskAssessedAt}
          onViewDetails={b.onViewRiskDetails}
        />
      </div>

      {/* Row 2: profile / facilities / repayment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          icon={<IconUser size={16} />}
          title="Customer Summary"
          action={
            b.onViewFullProfile && (
              <UnstyledButton onClick={b.onViewFullProfile}>
                <Group gap={4} wrap="nowrap">
                  <Text size="xs" fw={700} c="brand.6">
                    View full profile
                  </Text>
                  <IconExternalLink size={12} color="var(--mantine-color-brand-6)" />
                </Group>
              </UnstyledButton>
            )
          }
        >
          <InfoRow label="Customer Type" value={field(b.type ?? 'Individual')} />
          <InfoRow label="Customer Number" value={field(b.custId)} />
          <InfoRow label="Primary Mobile" value={field(b.mobile)} />
          <InfoRow label="Email Address" value={field(b.email)} />
          <InfoRow label="Residential Address" value={field(b.residentialAddress)} />
          <InfoRow label="Onboarded On" value={field(b.relationshipSince)} />
          <InfoRow label="Last Updated" value={field(b.lastUpdated)} />
          <InfoRow label="Relationship Manager" value={field(b.relationshipManager?.name)} bordered={false} />
        </SectionCard>

        <FacilityPortfolioCard
          facilityActive={facilityActive}
          facilityOverdue={facilityOverdue}
          facilityClosed={facilityClosed}
          exposure={b.exposure}
          utilizationPct={outstandingPct}
          onNewFacility={b.onNewFacility}
          onViewFacilities={b.onViewFacilities}
          onExposureBreakup={b.onExposureBreakup}
          onFacilityAlerts={b.onFacilityAlerts}
        />

        <RepaymentOverviewCard
          repayment={repayment}
          onViewAllPayments={b.onViewAllPayments}
          onViewSchedule={b.onViewSchedule}
        />
      </div>

      {/* Row 3: recent activity, full-width horizontal timeline */}
      <SectionCard icon={<IconCircleCheck size={16} />} title="Recent Activity" empty={activity.length === 0} emptyLabel="No activity recorded yet">
        <ActivityTimeline activity={activity} />
      </SectionCard>

      {/* Row 4: compliance + classification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard icon={<IconShieldCheck size={16} />} title="Risk & Compliance">
          <InfoRow label="KYC Status" value={<StatusBadge status={b.kycStatus} />} />
          <InfoRow label="KYC Last Updated" value={field(b.complianceChecks?.kycVerification?.checkedAt)} />
          <InfoRow label="Compliance Status" value={<StatusBadge status={b.complianceStatus} />} />
          <InfoRow label="Sanction Check" value={<StatusBadge status={b.complianceChecks?.sanctionsScreening?.status} />} />
          <InfoRow label="PEP Status" value={<StatusBadge status={b.complianceChecks?.pepStatus?.status ?? 'No'} />} bordered={false} />
        </SectionCard>

        <SectionCard icon={<IconTags size={16} />} title="Tags & Classification">
          <InfoRow label="Customer Segment" value={field(b.customerSegment)} />
          <InfoRow label="Industry" value={field(b.industry)} />
          <InfoRow label="Source" value={field(b.source)} />
          <InfoRow label="Tags" value={b.tags?.length ? b.tags.join(', ') : '—'} bordered={false} />
        </SectionCard>
      </div>

      <Group gap={8} className="rounded-lg p-3" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}>
        <Text size="xs" c="slate.5">
          This is a summary overview. Use the tabs above to view detailed information.
        </Text>
      </Group>
    </div>
  );
}