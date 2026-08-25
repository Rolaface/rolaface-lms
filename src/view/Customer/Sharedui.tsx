import { useMemo, useState, useEffect } from "react";
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
  Tooltip,
} from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
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
  IconX,
} from "@tabler/icons-react";
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
} from "../../types/customerview";
import type { LoanAccountingEntry } from "./mockdata";
import { themeTokens } from "../LoanAccount/LoanView/SharedUI";
import {
  accountStatusColor,
  activityFilters,
  activityKindIcon,
  activityKindLabel,
  activityKindTone,
  docAccentMap,
  docIconMap,
  formatK,
  initialsOf,
  loanStatusColor,
  serif,
} from "./mockdata";
import { ScrollArea, Loader } from "@mantine/core";
import { getLoanList } from "../../api/lookup api/lookUpApi";
import { useDebouncedValue } from "@mantine/hooks";

/* ============================================================================
   SMALL SHARED BITS
============================================================================ */

export function OverviewField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && (
          <span
            style={{ color: "var(--mantine-color-slate-4)", display: "flex" }}
          >
            {icon}
          </span>
        )}
        <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
          {label}
        </Text>
      </div>
      <Text fz="sm" fw={600} c="slate.9" className="font-mono">
        {value}
      </Text>
    </div>
  );
}
export function SectionHeading({
  title,
  aside,
}: {
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-baseline mb-3">
      <Text fz="lg" fw={600} c="slate.9" style={serif}>
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

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "active" | "warn" | "neutral";
}) {
  const tones = {
    active: {
      dot: themeTokens.success,
      bg: themeTokens.successSoft,
      text: "var(--mantine-color-success-7)",
    },
    warn: {
      dot: themeTokens.warning,
      bg: themeTokens.warningSoft,
      text: "var(--mantine-color-warning-8)",
    },
    neutral: {
      dot: themeTokens.slate,
      bg: themeTokens.slateSoft,
      text: "var(--mantine-color-slate-6)",
    },
  } as const;
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ backgroundColor: t.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ backgroundColor: t.dot }}
      />
      <Text fz="xs" fw={700} style={{ color: t.text }}>
        {label}
      </Text>
    </span>
  );
}

// Gradient tenure indicator — ink to gold — matches the "elapsed vs total" read of a
// physical loan ledger rather than a generic progress bar.
export function TenureBar({
  elapsed,
  total,
}: {
  elapsed: number;
  total: number;
}) {
  const pct =
    total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  return (
    <div className="pt-3 border-t border-[var(--mantine-color-slate-1)]">
      <div className="flex justify-between items-center mb-1.5">
        <Text fz="xs" c="dimmed">
          Tenure elapsed
        </Text>
        <Text fz="xs" c="dimmed" className="font-mono">
          {elapsed} / {total} months
        </Text>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: themeTokens.slateSoft }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${themeTokens.primary}, ${themeTokens.warning})`,
          }}
        />
      </div>
    </div>
  );
}

export function CollateralSection({
  collateral,
}: {
  collateral: CollateralItem[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {collateral.map((item) => (
        <Paper
          key={item.id}
          radius="lg"
          className="overflow-hidden"
          style={{
            border: "1px solid var(--mantine-color-slate-2)",
            boxShadow: "var(--mantine-shadow-sm)",
          }}
        >
          <div
            className="flex items-center justify-center h-32"
            style={{ background: "var(--mantine-color-slate-0)" }}
          >
            <Text fz={34}>{item.type === "Motor vehicle" ? "🚗" : "📄"}</Text>
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

              <Progress value={100} color="dark" radius="xl" size="sm" />
            </div>

            <div className="mb-3">
              <div className="flex justify-between">
                <Text fz="xs">Forced sale value</Text>
                <Text fz="xs">{formatK(item.forcedSaleValue)}</Text>
              </div>

              <Progress
                value={(item.forcedSaleValue / item.marketValue) * 100}
                color="slate"
                radius="xl"
                size="sm"
              />
            </div>

            <Group gap="xs">
              {item.status === "Verified" ? (
                <Badge color="success" variant="light">
                  Verified
                </Badge>
              ) : (
                <Badge color="warning" variant="light">
                  {item.status}
                </Badge>
              )}

              <Badge color="slate" variant="light">
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
  const accent = doc.expiring
    ? { bg: themeTokens.dangerSoft, fg: themeTokens.danger }
    : docAccentMap[doc.icon];
  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      className="flex items-center gap-3 transition-shadow hover:shadow-md"
      style={{
        borderColor: "var(--mantine-color-slate-2)",
        boxShadow: "var(--mantine-shadow-xs)",
      }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent.bg, color: accent.fg }}
      >
        {docIconMap[doc.icon]}
      </div>
      <div className="min-w-0">
        <Text fz="xs" fw={700} c="slate.9" truncate>
          {doc.name}
        </Text>
        <Text
          fz={11}
          fw={600}
          c={doc.expiring ? undefined : "dimmed"}
          style={doc.expiring ? { color: themeTokens.danger } : undefined}
        >
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
  const kycTone =
    borrower.kycStatus === "Verified"
      ? themeTokens.success
      : borrower.kycStatus === "Pending"
        ? themeTokens.warning
        : borrower.kycStatus === "Rejected"
          ? themeTokens.danger
          : themeTokens.slate;
  const riskTone =
    borrower.riskRating === "Low"
      ? themeTokens.success
      : borrower.riskRating === "Medium"
        ? themeTokens.warning
        : borrower.riskRating === "High"
          ? themeTokens.danger
          : themeTokens.slate;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper
        radius="lg"
        p="md"
        style={{
          boxShadow: "var(--mantine-shadow-md)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <RingProgress
            size={88}
            thickness={8}
            sections={[
              {
                value: (borrower.creditScore ?? 0) / 8.5,
                color: themeTokens.warning,
              },
            ]}
            rootColor="var(--mantine-color-slate-2)"
          />

          <div>
            <Text fz={18} fw={700}>
              {borrower.creditScore ?? "Not available"}
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
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: kycTone }}
              />
              <Text fz="xs" fw={700} c="slate.9">
                {borrower.kycStatus ?? "Not available"}
              </Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Risk rating
            </Text>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: riskTone }}
              />
              <Text fz="xs" fw={700} c="slate.9">
                {borrower.riskRating ?? "Not available"}
              </Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Relationship since
            </Text>
            <Text fz="xs" fw={700} c="slate.9">
              {borrower.relationshipSince ?? "Not available"}
            </Text>
          </div>
        </div>
      </Paper>

      <Paper
        radius="lg"
        p="md"
        style={{
          boxShadow: "var(--mantine-shadow-md)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Text fz="xs" fw={700} c="slate.9" className="mb-3">
          Relationship manager
        </Text>
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            radius="xl"
            size={38}
            style={{
              background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`,
              color: "var(--mantine-color-white)",
            }}
          >
            {borrower.relationshipManager?.initials ?? "—"}
          </Avatar>
          <div>
            <Text fz="xs" fw={700} c="slate.9">
              {borrower.relationshipManager?.name ?? "Not available"}
            </Text>
            <Text fz="xs" c="dimmed">
              {borrower.relationshipManager?.branch ?? ""}
            </Text>
          </div>
        </div>
        <Button
          fullWidth
          size="xs"
          variant="light"
          styles={{
            root: {
              backgroundColor: themeTokens.primarySoft,
              color: themeTokens.primary,
            },
          }}
          leftSection={<IconMessage size={14} />}
          disabled={!borrower.relationshipManager}
        >
          Message RM
        </Button>
      </Paper>
    </div>
  );
}

export function DocumentStatusPanel({
  checklist,
}: {
  checklist: DocumentChecklist;
}) {
  const pct =
    checklist.total > 0
      ? Math.round((checklist.complete / checklist.total) * 100)
      : 0;
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper
        radius="lg"
        p="md"
        style={{
          boxShadow: "var(--mantine-shadow-md)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wider mb-3">
          DOCUMENT STATUS
        </Text>
        <div
          className="h-1.5 w-full rounded-full overflow-hidden mb-3"
          style={{ backgroundColor: themeTokens.slateSoft }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: checklist.missingLabel
                ? themeTokens.warning
                : themeTokens.success,
            }}
          />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Complete
            </Text>
            <Text fz="xs" fw={700} c="slate.9" className="font-mono">
              {checklist.complete} / {checklist.total}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">
              Missing
            </Text>
            <Text
              fz="xs"
              fw={700}
              style={{
                color: checklist.missingLabel ? themeTokens.warning : undefined,
              }}
              c={checklist.missingLabel ? undefined : "slate.9"}
            >
              {checklist.missingLabel ?? "None"}
            </Text>
          </div>
        </div>
        <Button
          fullWidth
          size="xs"
          styles={{ root: { backgroundColor: themeTokens.primary } }}
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
      <Paper
        radius="lg"
        p="md"
        style={{
          boxShadow: "var(--mantine-shadow-md)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wider mb-3">
          QUICK LOG
        </Text>
        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            size="xs"
            styles={{ root: { backgroundColor: themeTokens.primary } }}
            leftSection={<IconNote size={14} />}
          >
            Add note
          </Button>
          <Button
            fullWidth
            size="xs"
            variant="light"
            styles={{
              root: {
                backgroundColor: themeTokens.infoSoft,
                color: themeTokens.info,
              },
            }}
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
  const [selectedId, setSelectedId] = useState<string | null>(
    schedule[0]?.id ?? null,
  );

  const colors: Record<ScheduleInstallment["status"], string> = {
    "Paid on time": "var(--mantine-color-success-6)",
    "Paid late": "var(--mantine-color-warning-6)",
    Overdue: "var(--mantine-color-danger-6)",
    Upcoming: "var(--mantine-color-slate-1)",
  };

  // Short, human status word for the detail panel below.
  const statusWord: Record<ScheduleInstallment["status"], string> = {
    "Paid on time": "paid",
    "Paid late": "paid late",
    Overdue: "overdue",
    Upcoming: "upcoming",
  };

  const selected =
    schedule.find((s) => s.id === selectedId) ?? schedule[0] ?? null;

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
        border: "1px solid var(--mantine-color-slate-2)",
        boxShadow: "var(--mantine-shadow-sm)",
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
                background: "var(--mantine-color-success-6)",
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
                background: "var(--mantine-color-warning-6)",
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
                background: "var(--mantine-color-danger-6)",
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
                background: "var(--mantine-color-slate-2)",
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
                    ? "var(--mantine-color-slate-1)"
                    : colors[item.status],
                border: isSelected
                  ? `2px solid ${themeTokens.ink}`
                  : item.status === "Upcoming"
                    ? "1px solid var(--mantine-color-slate-2)"
                    : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  item.status === "Upcoming"
                    ? "var(--mantine-color-slate-4)"
                    : "var(--mantine-color-white)",
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
          style={{
            backgroundColor: themeTokens.surface,
            border: "1px solid var(--mantine-color-slate-2)",
          }}
        >
          <Text fz="sm" fw={700} c="slate.9" className="mb-3">
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
        border: "1px solid var(--mantine-color-slate-2)",
        boxShadow: "var(--mantine-shadow-sm)",
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
                <Badge variant="light">{item.method}</Badge>
              </Table.Td>

              <Table.Td>{item.collector}</Table.Td>

              <Table.Td className="font-mono">
                {formatK(item.principal)}
              </Table.Td>

              <Table.Td className="font-mono">
                {formatK(item.interest)}
              </Table.Td>

              <Table.Td className="font-mono">{formatK(item.penalty)}</Table.Td>

              <Table.Td fw={700}>{formatK(item.total)}</Table.Td>

              <Table.Td className="font-mono">{formatK(item.balance)}</Table.Td>
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
        border: "1px solid var(--mantine-color-slate-2)",
        boxShadow: "var(--mantine-shadow-sm)",
      }}
    >
      <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
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

              <Table.Td className="font-mono">{formatK(row.balance)}</Table.Td>
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
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  const filtered =
    filter === "all" ? activity : activity.filter((a) => a.kind === filter);

  return (
    <Paper
      radius="lg"
      className="p-4"
      style={{
        boxShadow: "var(--mantine-shadow-md)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
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
                  ? {
                      backgroundColor: themeTokens.primary,
                      color: "var(--mantine-color-white)",
                      borderColor: themeTokens.primary,
                    }
                  : {
                      backgroundColor: "var(--mantine-color-white)",
                      color: "var(--mantine-color-slate-6)",
                      borderColor: "var(--mantine-color-slate-2)",
                    }
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
                  style={{
                    borderColor: tone.fg,
                    backgroundColor: "var(--mantine-color-white)",
                  }}
                />
                {idx < filtered.length - 1 && (
                  <span className="w-px flex-1 bg-[var(--mantine-color-slate-2)]" />
                )}
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
                <Text fz="xs" fw={600} c="slate.9">
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
  hideProfile = false,
}: {
  borrower: BorrowerProfile;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
  selected: SelectedItem;
  onSelect: (item: SelectedItem) => void;
  hideProfile?: boolean;
}) {
  const [loanSearch, setLoanSearch] = useState("");
  const [debouncedLoanSearch] = useDebouncedValue(loanSearch, 300);
  const [loanResults, setLoanResults] = useState<typeof loans | null>(null);
  const [loanSearchLoading, setLoanSearchLoading] = useState(false);

  const isSelected = (
    type: "loan" | "investment" | "savings" | "fixedDeposit",
    id: string,
  ) => selected?.type === type && selected.id === id;

  const loans = borrower.loans ?? [];
  const investments = borrower.investments ?? [];
  const savings = borrower.savings ?? [];
  const fixedDeposits = borrower.fixedDeposits ?? [];
  const displayedLoans = loanResults ?? loans;

  useEffect(() => {
    const q = debouncedLoanSearch.trim();
    if (!q) {
      setLoanResults(null);
      return;
    }
    setLoanSearchLoading(true);
    getLoanList({ search: q })
      .then((data) => {
        const raw = data?.data ?? [];

        setLoanResults(
          raw.map((r: any) => ({
            id: r.name,
            loanNumber: r.name,
            outstanding: r.pending_principal_amount ?? 0,
            repaidPercent:
              r.loan_amount > 0
                ? Math.min(
                    100,
                    Math.max(0, (r.total_principal_paid / r.loan_amount) * 100),
                  )
                : 0,
            status: r.status ?? "",
            nextInstallment: r.total_payment ?? 0,
            dpd: r.dpd,
          })),
        );
      })
      .catch(() => setLoanResults([]))
      .finally(() => setLoanSearchLoading(false));
  }, [debouncedLoanSearch]);
  if (collapsed) {
    return (
      <div className="flex flex-col items-center w-14 shrink-0 h-screen sticky top-0 border-r border-[var(--mantine-color-slate-2)] bg-white py-3 gap-1">
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          size={34}
          onClick={onToggleCollapsed}
          aria-label="Expand sidebar"
          className="mb-2"
        >
          <IconChevronRight size={17} />
        </ActionIcon>

        <Avatar
          radius="xl"
          size={32}
          style={{
            background: `linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-info-5))`,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
          }}
          className="mb-2"
        >
          {initialsOf(borrower.name)}
        </Avatar>
        {!hideProfile && (
          <Tooltip label="Profile" position="right" withArrow>
            <ActionIcon
              variant={selected?.type === "profile" ? "light" : "subtle"}
              color={selected?.type === "profile" ? "brand" : "gray"}
              radius="md"
              size={38}
              onClick={() => onSelect({ type: "profile" })}
            >
              <IconUser size={16} />
            </ActionIcon>
          </Tooltip>
        )}

        <Tooltip label={`Loans (${loans.length})`} position="right" withArrow>
          <ActionIcon
            variant={selected?.type === "loan" ? "light" : "subtle"}
            color={selected?.type === "loan" ? "brand" : "gray"}
            radius="md"
            size={38}
            onClick={() =>
              loans[0] && onSelect({ type: "loan", id: loans[0].id })
            }
          >
            <IconCreditCard size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={`Investments (${investments.length})`}
          position="right"
          withArrow
        >
          <ActionIcon
            variant={selected?.type === "investment" ? "light" : "subtle"}
            color={selected?.type === "investment" ? "brand" : "gray"}
            radius="md"
            size={38}
            onClick={() =>
              investments[0] &&
              onSelect({ type: "investment", id: investments[0].id })
            }
          >
            <IconChartLine size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={`Savings (${savings.length})`}
          position="right"
          withArrow
        >
          <ActionIcon
            variant={selected?.type === "savings" ? "light" : "subtle"}
            color={selected?.type === "savings" ? "brand" : "gray"}
            radius="md"
            size={38}
            onClick={() =>
              savings[0] && onSelect({ type: "savings", id: savings[0].id })
            }
          >
            <IconPigMoney size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={`Fixed Deposits (${fixedDeposits.length})`}
          position="right"
          withArrow
        >
          <ActionIcon
            variant={selected?.type === "fixedDeposit" ? "light" : "subtle"}
            color={selected?.type === "fixedDeposit" ? "brand" : "gray"}
            radius="md"
            size={38}
            onClick={() =>
              fixedDeposits[0] &&
              onSelect({ type: "fixedDeposit", id: fixedDeposits[0].id })
            }
          >
            <IconClockHour4 size={16} />
          </ActionIcon>
        </Tooltip>

        <div className="flex-1" />

        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          size={32}
          onClick={onBack}
        >
          <IconArrowLeft size={14} />
        </ActionIcon>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:w-60 shrink-0 h-screen sticky top-0 border-r border-[var(--mantine-color-slate-2)] bg-white">
      {/* Breadcrumb — fixed */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--mantine-color-slate-1)]">
        <ActionIcon variant="subtle" color="slate" size="sm" onClick={onBack}>
          <IconArrowLeft size={14} />
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          color="slate"
          size="sm"
          className="ml-auto"
          onClick={onToggleCollapsed}
        >
          <IconChevronLeft size={14} />
        </ActionIcon>
      </div>

      {/* Customer identity — fixed */}
      <div className="px-3 py-3 border-b border-[var(--mantine-color-slate-1)]">
        <div className="flex items-center gap-2.5">
          <Avatar
            radius="xl"
            size={38}
            style={{
              background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`,
              color: "var(--mantine-color-white)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {initialsOf(borrower.name)}
          </Avatar>

          <div className="min-w-0">
            <Text fz="xs" fw={700} c="slate.9" truncate>
              {borrower.name}
            </Text>
            <Text fz={10} c="dimmed" truncate>
              {borrower.custId}
            </Text>
          </div>
        </div>

        <Badge
          size="xs"
          variant="light"
          className="mt-2"
          styles={{
            root: {
              backgroundColor: themeTokens.successSoft,
              color: themeTokens.success,
            },
          }}
        >
          {borrower.status}
        </Badge>

        <div className="mt-2.5 pt-2 border-t border-[var(--mantine-color-slate-1)]">
          <div className="flex justify-between items-center">
            <Text fz={10} c="dimmed">
              Mobile
            </Text>
            <Text fz={10} fw={600} c="slate.7" className="font-mono">
              {borrower.mobile}
            </Text>
          </div>
          <div className="flex justify-between items-center mt-1">
            <Text fz={10} c="dimmed">
              Branch
            </Text>
            <Text fz={10} fw={600} c="slate.7" truncate>
              {borrower.branch ?? "Not available"}
            </Text>
          </div>
        </div>
      </div>
      {!hideProfile && (
        <div className="px-2 py-2 border-b border-[var(--mantine-color-slate-1)]">
          <button
            type="button"
            onClick={() => onSelect({ type: "profile" })}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all"
            style={
              selected?.type === "profile"
                ? {
                    backgroundColor: themeTokens.primarySoft,
                    color: themeTokens.primary,
                  }
                : {
                    backgroundColor: "var(--mantine-color-white)",
                    color: "var(--mantine-color-slate-6)",
                  }
            }
          >
            <IconUser size={14} />

            <div className="flex-1">
              <Text fz={11} fw={700}>
                Profile
              </Text>
              <Text fz={9} c="dimmed">
                Customer information
              </Text>
            </div>
          </button>
        </div>
      )}

      {/* Sections — SCROLLABLE AREA.
          flex-1 -> takes all remaining vertical space below the fixed header blocks above.
          min-h-0 -> required so a flex child can actually shrink and scroll instead of
                     growing to fit all content (classic flexbox overflow gotcha).
          overflow-y-auto -> only this region scrolls; the outer sidebar (h-screen sticky)
                     stays put, so the page itself never scrolls because of long lists.
          Loans, Investments, Savings and Fixed Deposits are all inside this one Accordion,
          so wrapping the Accordion here fixes the scroll behaviour for all four sections
          at once — no matter how many loans/investments/savings/FDs a customer has. */}
      <ScrollArea
        className="flex-1"
        type="hover"
        scrollbarSize={5}
        offsetScrollbars
      >
        <Accordion
          multiple
          defaultValue={selected?.type === "loan" ? ["loans"] : []}
          chevron={<IconChevronUp size={12} />}
          styles={{
            control: {
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 8,
              paddingBottom: 8,
            },
            panel: { paddingLeft: 8, paddingRight: 8 },
            label: { fontSize: 11 },
          }}
        >
          <Accordion.Item value="loans">
            <Accordion.Control
              icon={<IconCreditCard size={13} color={themeTokens.primary} />}
            >
              <div className="flex items-center gap-2">
                <Text fz={10} fw={700} className="tracking-wide">
                  LOANS
                </Text>
                <Badge
                  size="xs"
                  variant="light"
                  styles={{
                    root: {
                      backgroundColor: themeTokens.infoSoft,
                      color: themeTokens.info,
                    },
                  }}
                  circle
                >
                  {loans.length}
                </Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              <TextInput
                placeholder="Search loan number..."
                size="xs"
                radius="md"
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.currentTarget.value)}
                leftSection={<IconSearch size={11} />}
                styles={{
                  input: {
                    height: 30,
                    minHeight: 30,
                    fontSize: 11,
                    paddingLeft: 30,
                    paddingRight: 28,
                  },
                }}
                rightSection={
                  loanSearchLoading ? (
                    <Loader size={11} />
                  ) : loanSearch ? (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => setLoanSearch("")}
                    >
                      <IconX size={11} />
                    </ActionIcon>
                  ) : null
                }
                mb={8}
              />

              <ScrollArea
                h={3 * 72}
                type="hover"
                scrollbarSize={4}
                offsetScrollbars
              >
                <div className="flex flex-col pr-0.5">
                  {displayedLoans.length === 0 ? (
                    <Text fz={11} c="dimmed" className="text-center py-4">
                      No loans found
                    </Text>
                  ) : (
                    displayedLoans.map((loan, idx) => {
                      const selected = isSelected("loan", loan.id);
                      return (
                        <button
                          key={loan.id}
                          onClick={() =>
                            onSelect({ type: "loan", id: loan.id })
                          }
                          title={loan.loanNumber}
                          className="text-left w-full transition-colors"
                          style={{
                            backgroundColor: selected
                              ? themeTokens.primarySoft
                              : "transparent",
                            borderLeft: selected
                              ? `2px solid ${themeTokens.primary}`
                              : "2px solid transparent",
                            borderTop:
                              idx === 0
                                ? "none"
                                : "1px solid var(--mantine-color-slate-1)",
                            padding: "8px 8px 8px 10px",
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Text
                              fz={10}
                              fw={selected ? 700 : 600}
                              c={selected ? "slate.9" : "slate.7"}
                              className="font-mono"
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "visible",
                                textOverflow: "clip",
                                flexShrink: 1,
                                minWidth: 0,
                              }}
                            >
                              {loan.loanNumber}
                            </Text>
                            {loan.status && (
                              <Badge
                                size="xs"
                                variant="light"
                                color={loanStatusColor[loan.status]}
                                styles={{
                                  root: {
                                    fontSize: 8,
                                    flexShrink: 0,
                                    height: 16,
                                    padding: "0 6px",
                                  },
                                }}
                              >
                                {loan.status}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <Text
                              fz={12}
                              fw={700}
                              c="slate.9"
                              className="font-mono shrink-0"
                            >
                              {formatK(loan.outstanding)}
                            </Text>
                            <div
                              className="flex-1 h-1 rounded-full overflow-hidden"
                              style={{
                                backgroundColor: "var(--mantine-color-slate-1)",
                              }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${loan.repaidPercent}%`,
                                  backgroundColor:
                                    loan.status === "Delinquent"
                                      ? themeTokens.danger
                                      : loan.status === "Closed"
                                        ? "var(--mantine-color-slate-4)"
                                        : themeTokens.success,
                                }}
                              />
                            </div>
                            <Text fz={9} c="dimmed" className="shrink-0">
                              {loan.repaidPercent}%
                            </Text>
                          </div>

                          {(loan.nextInstallment || loan.dpd) && (
                            <div className="flex items-center justify-between mt-1">
                              <Text fz={9} c="dimmed">
                                {loan.nextInstallment
                                  ? `Next: ${formatK(loan.nextInstallment)}`
                                  : ""}
                              </Text>
                              {loan.dpd ? (
                                <Text
                                  fz={9}
                                  fw={700}
                                  style={{ color: themeTokens.danger }}
                                >
                                  DPD {loan.dpd}
                                </Text>
                              ) : null}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="investments">
            <Accordion.Control
              icon={<IconChartLine size={13} color={themeTokens.primary} />}
            >
              <div className="flex items-center gap-2">
                <Text fz={10} fw={700} className="tracking-wide">
                  INVESTMENTS
                </Text>
                <Badge
                  size="xs"
                  variant="light"
                  styles={{
                    root: {
                      backgroundColor: themeTokens.infoSoft,
                      color: themeTokens.info,
                    },
                  }}
                  circle
                >
                  {investments.length}
                </Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              <div className="flex flex-col gap-1.5">
                {investments.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => onSelect({ type: "investment", id: inv.id })}
                    className="text-left rounded-lg border-l-[3px] border p-2 transition-all hover:shadow-sm"
                    style={
                      isSelected("investment", inv.id)
                        ? {
                            borderColor: "var(--mantine-color-slate-2)",
                            borderLeftColor: themeTokens.info,
                            backgroundColor: themeTokens.infoSoft,
                          }
                        : {
                            borderColor: "var(--mantine-color-slate-2)",
                            borderLeftColor: themeTokens.info,
                            backgroundColor: "var(--mantine-color-white)",
                          }
                    }
                  >
                    <div className="flex justify-between items-start mb-1 gap-1">
                      <div className="min-w-0">
                        <Text fz={11} fw={700} c="slate.9" truncate>
                          {inv.refNumber}
                        </Text>
                        <Text fz={9} c="dimmed" truncate>
                          {inv.product}
                        </Text>
                      </div>
                      <Badge
                        size="xs"
                        variant="light"
                        color={accountStatusColor[inv.status]}
                        styles={{ root: { fontSize: 8, flexShrink: 0 } }}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <Text fz={12} fw={700} c="slate.9">
                          {formatK(inv.currentBalance)}
                        </Text>
                        <Text fz={8} c="dimmed" className="tracking-wide">
                          CURRENT BALANCE
                        </Text>
                      </div>
                      <Text fz={10} c="dimmed">
                        {inv.maturity}
                      </Text>
                    </div>
                  </button>
                ))}
              </div>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="savings">
            <Accordion.Control
              icon={<IconPigMoney size={13} color={themeTokens.primary} />}
            >
              <div className="flex items-center gap-2">
                <Text fz={10} fw={700} className="tracking-wide">
                  SAVINGS
                </Text>
                <Badge
                  size="xs"
                  variant="light"
                  styles={{
                    root: {
                      backgroundColor: themeTokens.infoSoft,
                      color: themeTokens.info,
                    },
                  }}
                  circle
                >
                  {savings.length}
                </Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              <div className="flex flex-col gap-1.5">
                {savings.map((sav) => (
                  <button
                    key={sav.id}
                    onClick={() => onSelect({ type: "savings", id: sav.id })}
                    className="text-left rounded-lg border-l-[3px] border p-2 flex justify-between items-center transition-all hover:shadow-sm"
                    style={
                      isSelected("savings", sav.id)
                        ? {
                            borderColor: "var(--mantine-color-slate-2)",
                            borderLeftColor: themeTokens.success,
                            backgroundColor: themeTokens.successSoft,
                          }
                        : {
                            borderColor: "var(--mantine-color-slate-2)",
                            borderLeftColor: themeTokens.success,
                            backgroundColor: "var(--mantine-color-white)",
                          }
                    }
                  >
                    <div className="min-w-0">
                      <Text fz={11} fw={700} c="slate.9" truncate>
                        {sav.accountNumber}
                      </Text>
                      <Text fz={9} c="dimmed">
                        Available
                      </Text>
                    </div>
                    <Text fz={12} fw={700} c="slate.9">
                      {formatK(sav.available, 2)}
                    </Text>
                  </button>
                ))}
              </div>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="fixedDeposits">
            <Accordion.Control
              icon={<IconClockHour4 size={13} color={themeTokens.primary} />}
            >
              <div className="flex items-center gap-2">
                <Text fz={10} fw={700} className="tracking-wide">
                  FIXED DEPOSITS
                </Text>
                <Badge
                  size="xs"
                  variant="light"
                  styles={{
                    root: {
                      backgroundColor: themeTokens.infoSoft,
                      color: themeTokens.info,
                    },
                  }}
                  circle
                >
                  {fixedDeposits.length}
                </Badge>
              </div>
            </Accordion.Control>
            <Accordion.Panel>
              <div className="flex flex-col gap-1.5">
                {fixedDeposits.map((fd) => (
                  <button
                    key={fd.id}
                    onClick={() =>
                      onSelect({ type: "fixedDeposit", id: fd.id })
                    }
                    className="text-left rounded-lg border-l-[3px] border p-2 flex justify-between items-center transition-all hover:shadow-sm"
                    style={
                      isSelected("fixedDeposit", fd.id)
                        ? {
                            borderColor: "var(--mantine-color-slate-2)",
                            borderLeftColor: themeTokens.warning,
                            backgroundColor: themeTokens.warningSoft,
                          }
                        : {
                            borderColor: "var(--mantine-color-slate-2)",
                            borderLeftColor: themeTokens.warning,
                            backgroundColor: "var(--mantine-color-white)",
                          }
                    }
                  >
                    <div className="min-w-0">
                      <Text fz={11} fw={700} c="slate.9" truncate>
                        {fd.refNumber}
                      </Text>
                      <Text fz={9} c="dimmed">
                        Matures {fd.maturity}
                      </Text>
                    </div>
                    <Text fz={12} fw={700} c="slate.9">
                      {formatK(fd.amount)}
                    </Text>
                  </button>
                ))}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </ScrollArea>
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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const results = useMemo(() => {
    const items: {
      section: string;
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      onClick: () => void;
    }[] = [
      {
        section: "CUSTOMERS",
        icon: <IconUser size={15} />,
        title: borrower.name,
        subtitle: `${borrower.custId} · ${borrower.mobile}`,
        onClick: () => setOpen(false),
      },
      ...(borrower.loans ?? []).map((loan) => ({
        section: "LOANS",
        icon: <IconFileText size={15} />,
        title: loan.loanNumber,
        subtitle: `${loan.product} · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: "loan", id: loan.id });
          setOpen(false);
        },
      })),
      ...(borrower.investments ?? []).map((inv) => ({
        section: "INVESTMENTS",
        icon: <IconFileText size={15} />,
        title: inv.refNumber,
        subtitle: `${inv.product} · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: "investment", id: inv.id });
          setOpen(false);
        },
      })),
      ...(borrower.savings ?? []).map((sav) => ({
        section: "SAVINGS",
        icon: <IconFileText size={15} />,
        title: sav.accountNumber,
        subtitle: `Savings account · ${borrower.name}`,
        onClick: () => {
          onSelect({ type: "savings", id: sav.id });
          setOpen(false);
        },
      })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q),
    );
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
        <Paper
          withBorder
          radius="md"
          shadow="md"
          className="absolute left-0 right-0 mt-1.5 z-50 max-h-96 overflow-y-auto py-2"
        >
          {results.length === 0 ? (
            <Text fz="xs" c="dimmed" className="px-4 py-3">
              No results found.
            </Text>
          ) : (
            Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section} className="mb-1">
                <Text
                  fz={10}
                  fw={700}
                  c="dimmed"
                  className="px-4 py-1.5 tracking-wider"
                >
                  {section}
                </Text>
                {items.map((item, idx) => (
                  <button
                    key={`${section}-${idx}`}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--mantine-color-slate-0)] text-left"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: themeTokens.infoSoft,
                        color: themeTokens.info,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <Text fz="xs" fw={700} c="slate.9">
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
