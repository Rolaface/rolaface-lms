import { Group, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBuildingBank,
  IconCircleCheck,
  IconFileUpload,
  IconRepeat,
  IconShieldCheck,
  IconTags,
  IconUser,
  IconWallet,
} from '@tabler/icons-react';
import type { BorrowerProfile } from '../../../../types/customerview';
import { InfoRow, SectionCard, StatCard, StatusBadge } from './Customerprofileshared ';
import { RiskRatingCard } from './Riskratingcard';

/**
 * NOTE: same defensive-read situation as every other panel — none of
 * exposure/outstandingBalance/overdueAmount/repayment/recentActivity/tags
 * exist on BorrowerProfile yet. Reads via `borrower as any`, falls back
 * to "—" everywhere, so the layout is locked in now and wiring real data
 * later is just extending the type.
 */

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

/** Donut built with a conic-gradient rather than SVG arcs — cheap, crisp,
 *  and trivial to drive from three percentages instead of hand-computing
 *  path angles like the credit gauge has to. */
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

const ACTIVITY_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  payment: { icon: <IconCircleCheck size={13} />, color: 'success' },
  disbursement: { icon: <IconBuildingBank size={13} />, color: 'brand' },
  document: { icon: <IconFileUpload size={13} />, color: 'warning' },
  default: { icon: <IconAlertCircle size={13} />, color: 'gray' },
};

function ActivityRow({ title, description, timestamp, type, isLast = false }: any) {
  const meta = ACTIVITY_ICON[type] ?? ACTIVITY_ICON.default;
  return (
    <div className={`flex items-start justify-between gap-3 py-2.5 ${!isLast ? 'border-b border-[var(--mantine-color-slate-1)]' : ''}`}>
      <div className="flex items-start gap-2 min-w-0">
        <ThemeIcon variant="light" color={meta.color} size={24} radius="xl" className="mt-0.5 shrink-0">
          {meta.icon}
        </ThemeIcon>
        <div className="min-w-0">
          <Text size="xs" fw={700} c="slate.8">
            {title}
          </Text>
          <Text size="xs" c="slate.5" truncate>
            {description}
          </Text>
        </div>
      </div>
      <Text size="xs" c="slate.4" className="shrink-0 whitespace-nowrap">
        {timestamp}
      </Text>
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

      {/* Headline numbers — all four StatCards stretch to equal height via grid's default align-items: stretch */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Exposure"
          value={money(b.exposure)}
          subtitle={`Across ${totalFacilities} facilit${totalFacilities === 1 ? 'y' : 'ies'}`}
          icon={<IconWallet size={18} />}
        />
        <StatCard
          label="Outstanding Balance"
          value={money(b.outstandingBalance)}
          subtitle={outstandingPct !== undefined ? `${outstandingPct}% of exposure` : undefined}
          icon={<IconBuildingBank size={18} />}
        />
        <StatCard
          label="Overdue Amount"
          value={money(b.overdueAmount)}
          subtitle={overdueAccounts ? `${overdueAccounts} account${overdueAccounts > 1 ? 's' : ''} overdue` : 'No overdue accounts'}
          icon={<IconAlertCircle size={18} />}
          tone="danger"
        />
        <RiskRatingCard
          riskRating={b.riskRating}
          creditScore={b.riskScore ?? b.creditAssessment?.score}
          riskAssessedAt={b.riskAssessedAt}
          onViewDetails={b.onViewRiskDetails}
        />
      </div>

      {/* Row 2: who they are / what they hold / how repayment looks — no items-start,
          so each SectionCard (h-full flex flex-col) stretches to match the tallest sibling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard icon={<IconUser size={16} />} title="Customer Summary">
          <InfoRow label="Customer Type" value={field(b.type ?? 'Individual')} />
          <InfoRow label="Customer Number" value={field(b.custId)} />
          <InfoRow label="Primary Mobile" value={field(b.mobile)} />
          <InfoRow label="Email Address" value={field(b.email)} />
          <InfoRow label="Residential Address" value={field(b.residentialAddress)} />
          <InfoRow label="Onboarded On" value={field(b.relationshipSince)} />
          <InfoRow label="Last Updated" value={field(b.lastUpdated)} />
          <InfoRow label="Relationship Manager" value={field(b.relationshipManager?.name)} bordered={false} />
        </SectionCard>

        <SectionCard icon={<IconBuildingBank size={16} />} title="Facility Summary">
          <FacilityDonut active={facilityActive} activeOverdue={facilityOverdue} closed={facilityClosed} />
        </SectionCard>

        <SectionCard icon={<IconRepeat size={16} />} title="Repayment Summary">
          <InfoRow label="EMI/Installment Due" value={money(repayment.emiDue)} />
          <InfoRow
            label="EMI/Installment Overdue"
            value={
              <Text size="xs" fw={700} c={repayment.emiOverdue ? 'danger.6' : 'slate.4'}>
                {money(repayment.emiOverdue)}
              </Text>
            }
          />
          <InfoRow label="Next Due Date" value={field(repayment.nextDueDate)} />
          <InfoRow
            label="Days Past Due (Max)"
            value={
              <Text size="xs" fw={700} c={repayment.daysPastDueMax ? 'danger.6' : 'slate.4'}>
                {repayment.daysPastDueMax ? `${repayment.daysPastDueMax} Days` : '—'}
              </Text>
            }
          />
          <InfoRow label="Repayment Frequency" value={field(repayment.frequency)} bordered={false} />
        </SectionCard>
      </div>

      {/* Row 3: what's happened / compliance posture / how they're classified — same equal-height behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard icon={<IconCircleCheck size={16} />} title="Recent Activity" empty={activity.length === 0} emptyLabel="No activity recorded yet">
          {activity.slice(0, 5).map((a, i) => (
            <ActivityRow key={i} {...a} isLast={i === Math.min(activity.length, 5) - 1} />
          ))}
        </SectionCard>

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