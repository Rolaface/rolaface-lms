import { useMemo, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Kbd,
  Paper,
  Progress,
  RingProgress,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconChartLine,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClockHour4,
  IconCreditCard,
  IconFileText,
  IconMessage,
  IconNote,
  IconPhoneCall,
  IconPigMoney,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import type {
  ActivityItem,
  ActivityKind,
  BorrowerProfile,
  CollateralItem,
  DocumentChecklist,
  DocumentItem,
  RepaymentHistoryItem,
  ScheduleInstallment,
  SelectedItem,
} from '../../types/customerview';
import type { LoanAccountingEntry } from './mockdata';
import {
  accountStatusColor,
  activityFilters,
  activityKindIcon,
  activityKindLabel,
  activityKindTone,
  brand,
  docAccentMap,
  docIconMap,
  formatK,
  initialsOf,
  loanStatusColor,
  serif,
} from './mockdata';

/* ============================================================================
   SMALL SHARED BITS
============================================================================ */

export function OverviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Text fz={10} fw={700} c="dimmed" className="tracking-wider mb-1">
        {label}
      </Text>
      <Text fz="sm" fw={600} c="gray.9" className="font-mono">
        {value}
      </Text>
    </div>
  );
}

export function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline mb-3">
      <Text fz="lg" fw={600} c="gray.9" style={serif}>
        {title}
      </Text>
      {aside && (
        <Text fz="xs" c="dimmed">
          {aside}
        </Text>
      )}
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'active' | 'warn' | 'neutral' }) {
  const tones = {
    active: { dot: brand.teal, bg: brand.tealSoft, text: '#0B5D4D' },
    warn: { dot: brand.gold, bg: brand.goldSoft, text: '#8A5A0F' },
    neutral: { dot: brand.slate, bg: brand.slateSoft, text: '#4B5563' },
  } as const;
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ backgroundColor: t.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: t.dot }} />
      <Text fz="xs" fw={700} style={{ color: t.text }}>
        {label}
      </Text>
    </span>
  );
}

// Gradient tenure indicator — ink to gold — matches the "elapsed vs total" read of a
// physical loan ledger rather than a generic progress bar.
export function TenureBar({ elapsed, total }: { elapsed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  return (
    <div className="pt-3 border-t border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <Text fz="xs" c="dimmed">
          Tenure elapsed
        </Text>
        <Text fz="xs" c="dimmed" className="font-mono">
          {elapsed} / {total} months
        </Text>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: brand.slateSoft }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brand.primary}, ${brand.gold})` }}
        />
      </div>
    </div>
  );
}

export function CollateralSection({ collateral }: { collateral: CollateralItem[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {collateral.map((item) => (
        <Paper
          key={item.id}
          radius="lg"
          className="overflow-hidden"
          style={{
            border: "1px solid #ECE8DD",
            boxShadow: "0 3px 14px rgba(36,31,61,0.06)",
          }}
        >
          <div
            className="flex items-center justify-center h-32"
            style={{ background: "#F8F5EE" }}
          >
            <Text fz={34}>
              {item.type === "Motor vehicle" ? "🚗" : "📄"}
            </Text>
          </div>

          <div className="p-4">
            <Text fw={700}>{item.title}</Text>

            <Text fz="xs" c="dimmed" mb="md">
              {item.type} • {item.subtitle}
            </Text>

            <div className="mb-3">
              <div className="flex justify-between">
                <Text fz="xs">Market value</Text>
                <Text fz="xs">{formatK(item.marketValue)}</Text>
              </div>

              <Progress
                value={100}
                color="dark"
                radius="xl"
                size="sm"
              />
            </div>

            <div className="mb-3">
              <div className="flex justify-between">
                <Text fz="xs">Forced sale value</Text>
                <Text fz="xs">{formatK(item.forcedSaleValue)}</Text>
              </div>

              <Progress
                value={(item.forcedSaleValue / item.marketValue) * 100}
                color="gray"
                radius="xl"
                size="sm"
              />
            </div>

            <Group gap="xs">
              {item.status === "Verified" ? (
                <Badge color="teal" variant="light">
                  Verified
                </Badge>
              ) : (
                <Badge color="orange" variant="light">
                  {item.status}
                </Badge>
              )}

              <Badge color="gray" variant="light">
                Ownership: {item.ownership}
              </Badge>
            </Group>
          </div>
        </Paper>
      ))}
    </div>
  );
}

export function DocumentCard({ doc }: { doc: DocumentItem }) {
  const accent = doc.expiring ? { bg: brand.roseSoft, fg: brand.rose } : docAccentMap[doc.icon];
  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      className="flex items-center gap-3 transition-shadow hover:shadow-md"
      style={{ borderColor: '#EDEAE0', boxShadow: '0 1px 2px rgba(36,31,61,0.06)' }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent.bg, color: accent.fg }}
      >
        {docIconMap[doc.icon]}
      </div>
      <div className="min-w-0">
        <Text fz="xs" fw={700} c="gray.9" truncate>
          {doc.name}
        </Text>
        <Text fz={11} fw={600} c={doc.expiring ? undefined : 'dimmed'} style={doc.expiring ? { color: brand.rose } : undefined}>
          {doc.status} · {doc.size}
        </Text>
      </div>
    </Paper>
  );
}

/* ============================================================================
   RIGHT RAIL — swaps by active tab: risk snapshot (default), document
   status (Documents tab), quick log (Activity tab)
============================================================================ */

export function RiskSnapshotPanel({ borrower }: { borrower: BorrowerProfile }) {

  const kycTone = borrower.kycStatus === 'Verified' ? brand.teal : borrower.kycStatus === 'Pending' ? brand.gold : brand.rose;
  const riskTone = borrower.riskRating === 'Low' ? brand.teal : borrower.riskRating === 'Medium' ? brand.gold : brand.rose;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper
        radius="lg"
        p="md"
        style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <RingProgress
            size={88}
            thickness={8}
            sections={[
              {
                value: borrower.creditScore / 8.5,
                color: brand.gold,
              },
            ]}
            rootColor="#ECE8DD"
          />

          <div>
            <Text fz={18} fw={700}>
              {borrower.creditScore}
            </Text>

            <Text fz="sm" c="dimmed">
              Credit score · Medium risk
            </Text>
          </div>
        </div>



        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              KYC status
            </Text>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: kycTone }} />
              <Text fz="xs" fw={700} c="gray.9">
                {borrower.kycStatus}
              </Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Risk rating
            </Text>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: riskTone }} />
              <Text fz="xs" fw={700} c="gray.9">
                {borrower.riskRating}
              </Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Relationship since
            </Text>
            <Text fz="xs" fw={700} c="gray.9">
              {borrower.relationshipSince}
            </Text>
          </div>
        </div>
      </Paper>

      <Paper
        radius="lg"
        p="md"
        style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}
      >
        <Text fz="xs" fw={700} c="gray.9" className="mb-3">
          Relationship manager
        </Text>
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={38}
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}
          >
            {borrower.relationshipManager.initials}
          </Avatar>
          <div>
            <Text fz="xs" fw={700} c="gray.9">
              {borrower.relationshipManager.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {borrower.relationshipManager.branch}
            </Text>
          </div>
        </div>
        <Button
          fullWidth
          size="xs"
          variant="light"
          styles={{ root: { backgroundColor: brand.primarySoft, color: brand.primary } }}
          leftSection={<IconMessage size={14} />}
        >
          Message RM
        </Button>
      </Paper>
    </div>
  );
}

export function DocumentStatusPanel({ checklist }: { checklist: DocumentChecklist }) {
  const pct = checklist.total > 0 ? Math.round((checklist.complete / checklist.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">
          DOCUMENT STATUS
        </Text>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: brand.slateSoft }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: checklist.missingLabel ? brand.gold : brand.teal }}
          />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Complete
            </Text>
            <Text fz="xs" fw={700} c="gray.9" className="font-mono">
              {checklist.complete} / {checklist.total}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Missing
            </Text>
            <Text fz="xs" fw={700} style={{ color: checklist.missingLabel ? brand.gold : undefined }} c={checklist.missingLabel ? undefined : 'gray.9'}>
              {checklist.missingLabel ?? 'None'}
            </Text>
          </div>
        </div>
        <Button
          fullWidth
          size="xs"
          styles={{ root: { backgroundColor: brand.primary } }}
          disabled={!checklist.missingLabel}
        >
          Request from borrower
        </Button>
      </Paper>
    </div>
  );
}

export function QuickLogPanel() {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">
          QUICK LOG
        </Text>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="xs" styles={{ root: { backgroundColor: brand.primary } }} leftSection={<IconNote size={14} />}>
            Add note
          </Button>
          <Button
            fullWidth
            size="xs"
            variant="light"
            styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }}
            leftSection={<IconPhoneCall size={14} />}
          >
            Log a call
          </Button>
        </div>
      </Paper>
    </div>
  );
}

/* ============================================================================
   TABLES — repayment schedule mosaic, repayment history, accounting ledger
============================================================================ */

export function RepaymentSchedule({
  schedule,
}: {
  schedule: ScheduleInstallment[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(schedule[0]?.id ?? null);

  const colors: Record<ScheduleInstallment["status"], string> = {
    "Paid on time": "#3F8B61",
    "Paid late": "#C89A3C",
    Overdue: "#B8533A",
    Upcoming: "#F5F2EA",
  };

  // Short, human status word for the detail panel below.
  const statusWord: Record<ScheduleInstallment["status"], string> = {
    "Paid on time": "paid",
    "Paid late": "paid late",
    Overdue: "overdue",
    Upcoming: "upcoming",
  };

  const selected = schedule.find((s) => s.id === selectedId) ?? schedule[0] ?? null;

  // The mock data only tracks a single "amount" per installment (no separate
  // principal/interest/penalty breakdown), so derive a stable, proportional
  // split for display — same ratio buildHistory() uses (≈ 9,020 / 15,630 on
  // a 24,650 installment).
  const principal = selected ? Math.round(selected.amount * 0.366) : 0;
  const interest = selected ? selected.amount - principal : 0;
  const penalty = 0;

  return (
    <Paper
      radius="lg"
      p="md"
      style={{
        border: "1px solid #ECE8DD",
        boxShadow: "0 3px 14px rgba(36,31,61,0.06)",
      }}
    >
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        <Group gap={18}>
          <Group gap={6}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#3F8B61",
              }}
            />
            <Text fz="xs">Paid on time</Text>
          </Group>

          <Group gap={6}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#C89A3C",
              }}
            />
            <Text fz="xs">Paid late</Text>
          </Group>

          <Group gap={6}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#B8533A",
              }}
            />
            <Text fz="xs">Overdue</Text>
          </Group>

          <Group gap={6}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#ECE8DD",
              }}
            />
            <Text fz="xs">Upcoming</Text>
          </Group>
        </Group>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {schedule.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              aria-pressed={isSelected}
              style={{
                width: 40,
                height: 56,
                borderRadius: 8,
                background:
                  item.status === "Upcoming"
                    ? "#F5F2EA"
                    : colors[item.status],
                border: isSelected
                  ? `2px solid ${brand.ink}`
                  : item.status === "Upcoming"
                    ? "1px solid #E5E1D6"
                    : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  item.status === "Upcoming"
                    ? "#9CA3AF"
                    : "#fff",
                fontWeight: 700,
                fontSize: 13,
                padding: 0,
                cursor: "pointer",
                transition: "transform 0.1s ease",
              }}
            >
              {item.no}
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: brand.cream, border: "1px solid #ECE8DD" }}
        >
          <Text fz="sm" fw={700} c="gray.9" className="mb-3">
            Installment {selected.no} · due {selected.dueDate}
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <OverviewField label="PRINCIPAL" value={formatK(principal)} />
            <OverviewField label="INTEREST" value={formatK(interest)} />
            <OverviewField label="PENALTY" value={formatK(penalty)} />
            <OverviewField label="TOTAL DUE" value={formatK(selected.amount)} />
            <OverviewField label="STATUS" value={statusWord[selected.status]} />
          </div>
        </div>
      )}
    </Paper>
  );
}

export function RepaymentHistoryTable({
  history,
}: {
  history: RepaymentHistoryItem[];
}) {
  return (
    <Paper
      radius="lg"
      className="overflow-hidden"
      style={{
        border: "1px solid #ECE8DD",
        boxShadow: "0 3px 14px rgba(36,31,61,0.06)",
      }}
    >
      <Table
        verticalSpacing="md"
        horizontalSpacing="md"
        striped={false}
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Receipt</Table.Th>
            <Table.Th>Payment Date</Table.Th>
            <Table.Th>Method</Table.Th>
            <Table.Th>Collector</Table.Th>
            <Table.Th>Principal</Table.Th>
            <Table.Th>Interest</Table.Th>
            <Table.Th>Penalty</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Balance</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {history.map((item) => (
            <Table.Tr key={item.receipt}>
              <Table.Td>{item.receipt}</Table.Td>

              <Table.Td>{item.date}</Table.Td>

              <Table.Td>
                <Badge variant="light">
                  {item.method}
                </Badge>
              </Table.Td>

              <Table.Td>{item.collector}</Table.Td>

              <Table.Td className="font-mono">
                {formatK(item.principal)}
              </Table.Td>

              <Table.Td className="font-mono">
                {formatK(item.interest)}
              </Table.Td>

              <Table.Td className="font-mono">
                {formatK(item.penalty)}
              </Table.Td>

              <Table.Td fw={700}>
                {formatK(item.total)}
              </Table.Td>

              <Table.Td className="font-mono">
                {formatK(item.balance)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

export function AccountingTable({
  accounting,
}: {
  accounting: LoanAccountingEntry[];
}) {
  return (
    <Paper
      radius="lg"
      className="overflow-hidden"
      style={{
        border: "1px solid #ECE8DD",
        boxShadow: "0 3px 14px rgba(36,31,61,0.06)",
      }}
    >
      <Table
        verticalSpacing="md"
        horizontalSpacing="md"
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Debit</Table.Th>
            <Table.Th>Credit</Table.Th>
            <Table.Th>Balance</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {accounting.map((row, index) => (
            <Table.Tr key={index}>
              <Table.Td>{row.date}</Table.Td>

              <Table.Td>{row.description}</Table.Td>

              <Table.Td className="font-mono">
                {row.debit ? formatK(row.debit) : "—"}
              </Table.Td>

              <Table.Td className="font-mono">
                {row.credit ? formatK(row.credit) : "—"}
              </Table.Td>

              <Table.Td className="font-mono">
                {formatK(row.balance)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

/* ============================================================================
   ACTIVITY FEED — filter pills + timeline rows
============================================================================ */

export function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');
  const filtered = filter === 'all' ? activity : activity.filter((a) => a.kind === filter);

  return (
    <Paper radius="lg" className="p-4" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {activityFilters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={
                active
                  ? { backgroundColor: brand.primary, color: '#fff', borderColor: brand.primary }
                  : { backgroundColor: '#fff', color: '#4B5563', borderColor: '#E5E7EB' }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {filtered.map((a, idx) => {
          const tone = activityKindTone[a.kind];
          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1"
                  style={{ borderColor: tone.fg, backgroundColor: '#fff' }}
                />
                {idx < filtered.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
              </div>
              <div className="pb-5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <Text fz={10} c="dimmed" className="font-mono">
                    {a.date}
                  </Text>
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    {activityKindIcon[a.kind]}
                    <Text fz={9} fw={700} className="tracking-wide">
                      {activityKindLabel[a.kind].toUpperCase()}
                    </Text>
                  </span>
                </div>
                <Text fz="xs" fw={600} c="gray.9">
                  {a.title}
                </Text>
                <Text fz={11} c="dimmed" className="mt-0.5">
                  {a.description}
                </Text>
                <Text fz={10} c="dimmed" className="mt-0.5">
                  {a.actor}
                </Text>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <Text fz="xs" c="dimmed" className="py-3">
            No entries in this filter.
          </Text>
        )}
      </div>
    </Paper>
  );
}

/* ============================================================================
   LEFT SIDEBAR (customer summary + loans/investments/savings/FDs)
============================================================================ */

export function BorrowerSidebar({
  borrower,
  collapsed,
  onToggleCollapsed,
  onBack,
  selected,
  onSelect,
}: {
  borrower: BorrowerProfile;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
  selected: SelectedItem;
  onSelect: (item: SelectedItem) => void;
}) {
  const isSelected = (type: 'loan' | 'investment' | 'savings' | 'fixedDeposit', id: string) =>
    selected?.type === type && selected.id === id;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 w-12 shrink-0 border-r border-gray-200 bg-white py-3">
        <ActionIcon variant="subtle" color="gray" onClick={onToggleCollapsed}>
          <IconChevronRight size={16} />
        </ActionIcon>
        <Avatar radius="xl" size={32} style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}>
          {initialsOf(borrower.name)}
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:w-80 shrink-0 h-screen sticky top-0 border-r border-gray-200 bg-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} />
        </ActionIcon>

        <ActionIcon variant="subtle" color="gray" size="sm" className="ml-auto" onClick={onToggleCollapsed}>
          <IconChevronLeft size={16} />
        </ActionIcon>
      </div>

      {/* Customer summary */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={44}
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}
          >
            {initialsOf(borrower.name)}
          </Avatar>
          <div>
            <Text fz="sm" fw={700} c="gray.9">
              {borrower.name}
            </Text>
            <Text fz="xs" c="dimmed">
              {borrower.custId}
            </Text>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <Badge
            variant="light"
            size="sm"
            styles={{ root: { fontSize: 10, backgroundColor: brand.tealSoft, color: brand.teal } }}
          >
            {borrower.status}
          </Badge>

        </div>
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Mobile
            </Text>
            <Text fz="xs" c="gray.7" className="font-mono">
              {borrower.mobile}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              National ID
            </Text>
            <Text fz="xs" c="gray.7">
              {borrower.nationalId}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text fz="xs" c="dimmed">
              Branch
            </Text>
            <Text fz="xs" c="gray.7">
              {borrower.branch}
            </Text>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: brand.primarySoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              TOTAL EXPOSURE
            </Text>
            <Text fz="sm" fw={700} style={{ color: brand.primary }}>
              {formatK(borrower.totalExposure)}
            </Text>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: brand.tealSoft }}>
            <Text fz={9} fw={700} c="dimmed" className="tracking-wider">
              AVAILABLE CREDIT
            </Text>
            <Text fz="sm" fw={700} style={{ color: brand.teal }}>
              {formatK(borrower.availableCredit)}
            </Text>
          </div>
        </div>
      </div>

      {/* Sections */}
      <Accordion multiple defaultValue={['loans']} chevron={<IconChevronUp size={14} />}>
        <Accordion.Item value="loans">
          <Accordion.Control icon={<IconCreditCard size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                LOANS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.loans.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.loans.map((loan) => {
                const accent =
                  loan.status === 'Delinquent' || loan.status === 'Overdue'
                    ? brand.rose
                    : loan.status === 'Closed'
                      ? brand.slate
                      : brand.teal;
                const accentSoft =
                  loan.status === 'Delinquent' || loan.status === 'Overdue'
                    ? brand.roseSoft
                    : loan.status === 'Closed'
                      ? brand.slateSoft
                      : brand.tealSoft;
                const selected = isSelected('loan', loan.id);
                return (
                  <button
                    key={loan.id}
                    onClick={() => onSelect({ type: 'loan', id: loan.id })}
                    className="text-left rounded-lg border-l-[3px] border p-2.5 transition-all hover:shadow-sm"
                    style={
                      selected
                        ? { borderColor: '#e5e7eb', borderLeftColor: accent, backgroundColor: accentSoft }
                        : { borderColor: '#e5e7eb', borderLeftColor: accent, backgroundColor: '#fff' }
                    }
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <Text fz="xs" fw={700} c="gray.9">
                          {loan.loanNumber}
                        </Text>
                        <Text fz={10} c="dimmed">
                          {loan.product}
                        </Text>
                      </div>
                      <Badge size="xs" variant="light" color={loanStatusColor[loan.status]} styles={{ root: { fontSize: 9 } }}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <Text fz="sm" fw={700} c="gray.9">
                          {formatK(loan.outstanding)}
                        </Text>
                        <Text fz={9} c="dimmed" className="tracking-wide">
                          OUTSTANDING
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text fz="xs" fw={600} c="gray.7">
                          {loan.nextInstallment ? formatK(loan.nextInstallment) : '—'}
                        </Text>
                        <Text fz={9} c="dimmed">
                          Next installment
                        </Text>
                      </div>
                    </div>
                    <Progress
                      value={loan.repaidPercent}
                      size={4}
                      color={loan.status === 'Delinquent' ? 'red' : loan.status === 'Closed' ? 'gray' : 'teal'}
                    />
                    <div className="flex justify-between mt-1">
                      <Text fz={10} c="dimmed">
                        {loan.repaidPercent}% repaid
                      </Text>
                      {loan.dpd ? (
                        <Badge size="xs" color="red" variant="light" styles={{ root: { fontSize: 9 } }}>
                          DPD {loan.dpd}
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="investments">
          <Accordion.Control icon={<IconChartLine size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                INVESTMENTS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.investments.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.investments.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => onSelect({ type: 'investment', id: inv.id })}
                  className="text-left rounded-lg border-l-[3px] border p-2.5 transition-all hover:shadow-sm"
                  style={
                    isSelected('investment', inv.id)
                      ? { borderColor: '#e5e7eb', borderLeftColor: brand.sky, backgroundColor: brand.skySoft }
                      : { borderColor: '#e5e7eb', borderLeftColor: brand.sky, backgroundColor: '#fff' }
                  }
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <Text fz="xs" fw={700} c="gray.9">
                        {inv.refNumber}
                      </Text>
                      <Text fz={10} c="dimmed">
                        {inv.product}
                      </Text>
                    </div>
                    <Badge size="xs" variant="light" color={accountStatusColor[inv.status]} styles={{ root: { fontSize: 9 } }}>
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <Text fz="sm" fw={700} c="gray.9">
                        {formatK(inv.currentBalance)}
                      </Text>
                      <Text fz={9} c="dimmed" className="tracking-wide">
                        CURRENT BALANCE
                      </Text>
                    </div>
                    <Text fz="xs" c="dimmed">
                      {inv.maturity}
                    </Text>
                  </div>
                </button>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="savings">
          <Accordion.Control icon={<IconPigMoney size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                SAVINGS ACCOUNTS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.savings.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.savings.map((sav) => (
                <button
                  key={sav.id}
                  onClick={() => onSelect({ type: 'savings', id: sav.id })}
                  className="text-left rounded-lg border-l-[3px] border p-2.5 flex justify-between items-center transition-all hover:shadow-sm"
                  style={
                    isSelected('savings', sav.id)
                      ? { borderColor: '#e5e7eb', borderLeftColor: brand.teal, backgroundColor: brand.tealSoft }
                      : { borderColor: '#e5e7eb', borderLeftColor: brand.teal, backgroundColor: '#fff' }
                  }
                >
                  <div>
                    <Text fz="xs" fw={700} c="gray.9">
                      {sav.accountNumber}
                    </Text>
                    <Text fz={10} c="dimmed">
                      Available
                    </Text>
                  </div>
                  <Text fz="sm" fw={700} c="gray.9">
                    {formatK(sav.available, 2)}
                  </Text>
                </button>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="fixedDeposits">
          <Accordion.Control icon={<IconClockHour4 size={15} color={brand.primary} />}>
            <div className="flex items-center gap-2">
              <Text fz="xs" fw={700} className="tracking-wide">
                FIXED DEPOSITS
              </Text>
              <Badge size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} circle>
                {borrower.fixedDeposits.length}
              </Badge>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-2">
              {borrower.fixedDeposits.map((fd) => (
                <button
                  key={fd.id}
                  onClick={() => onSelect({ type: 'fixedDeposit', id: fd.id })}
                  className="text-left rounded-lg border-l-[3px] border p-2.5 flex justify-between items-center transition-all hover:shadow-sm"
                  style={
                    isSelected('fixedDeposit', fd.id)
                      ? { borderColor: '#e5e7eb', borderLeftColor: brand.gold, backgroundColor: brand.goldSoft }
                      : { borderColor: '#e5e7eb', borderLeftColor: brand.gold, backgroundColor: '#fff' }
                  }
                >
                  <div>
                    <Text fz="xs" fw={700} c="gray.9">
                      {fd.refNumber}
                    </Text>
                    <Text fz={10} c="dimmed">
                      Matures {fd.maturity}
                    </Text>
                  </div>
                  <Text fz="sm" fw={700} c="gray.9">
                    {formatK(fd.amount)}
                  </Text>
                </button>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

/* ============================================================================
   TOP GLOBAL SEARCH BAR
============================================================================ */

export function GlobalSearchBar({
  borrower,
  onSelect,
}: {
  borrower: BorrowerProfile;
  onSelect: (item: SelectedItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const results = useMemo(() => {
    const items: { section: string; icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }[] = [
      {
        section: 'CUSTOMERS',
        icon: <IconUser size={15} />,
        title: borrower.name,
        subtitle: `${borrower.custId} · ${borrower.mobile}`,
        onClick: () => setOpen(false),
      },
      ...borrower.loans.map((loan) => ({
        section: 'LOANS',
        icon: <IconFileText size={15} />,
        title: loan.loanNumber,
        subtitle: `${loan.product} · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: 'loan', id: loan.id });
          setOpen(false);
        },
      })),
      ...borrower.investments.map((inv) => ({
        section: 'INVESTMENTS',
        icon: <IconFileText size={15} />,
        title: inv.refNumber,
        subtitle: `${inv.product} · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: 'investment', id: inv.id });
          setOpen(false);
        },
      })),
      ...borrower.savings.map((sav) => ({
        section: 'SAVINGS',
        icon: <IconFileText size={15} />,
        title: sav.accountNumber,
        subtitle: `Savings account · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: 'savings', id: sav.id });
          setOpen(false);
        },
      })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q));
  }, [query, borrower, onSelect]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    results.forEach((r) => {
      if (!map.has(r.section)) map.set(r.section, []);
      map.get(r.section)!.push(r);
    });
    return map;
  }, [results]);

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <TextInput
        size="sm"
        radius="md"
        placeholder="Search loan number, phone, customer, National ID..."
        leftSection={<IconSearch size={14} />}
        rightSection={<Kbd size="xs">⌘K</Kbd>}
        rightSectionWidth={44}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.currentTarget.value);
          setOpen(true);
        }}
      />
      {open && (
        <Paper withBorder radius="md" shadow="md" className="absolute left-0 right-0 mt-1.5 z-50 max-h-96 overflow-y-auto py-2">
          {results.length === 0 ? (
            <Text fz="xs" c="dimmed" className="px-4 py-3">
              No results found.
            </Text>
          ) : (
            Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section} className="mb-1">
                <Text fz={10} fw={700} c="dimmed" className="px-4 py-1.5 tracking-wider">
                  {section}
                </Text>
                {items.map((item, idx) => (
                  <button
                    key={`${section}-${idx}`}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: brand.skySoft, color: brand.sky }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <Text fz="xs" fw={700} c="gray.9">
                        {item.title}
                      </Text>
                      <Text fz={11} c="dimmed">
                        {item.subtitle}
                      </Text>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </Paper>
      )}
    </div>
  );
}