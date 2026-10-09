/* One investment: the contract agreed to, funds paid in, the repayment schedule and the money trail. */
import { Fragment, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActionIcon,
  Box,
  Collapse,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Timeline,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowRight,
  IconCash,
  IconChevronDown,
  IconCoins,
  IconFileCertificate,
  IconListDetails,
  IconLock,
  IconReceipt2,
  IconRoute,
} from "@tabler/icons-react";
import { getInvestmentDetail } from "../../../api/Investor/investorFlowApi";
import type { InvestmentDetail } from "../../../types/Investor/investorFlow";
import { JournalEntryLines } from "./JournalEntryDrawer";
import {
  Card,
  ErrorBlock,
  Field,
  KpiTile,
  LoadingBlock,
  StatusBadge,
} from "./ui";
import { fmtDate, useMoney } from "./format";

interface Props {
  investmentId: string;
  /** Investor's name, shown on the Repayments summary line. */
  investorName: string;
  onOpenEntry: (journalEntry: string) => void;
}

/** Small button that opens the accounting (Journal Entry) of a row. */
function EntryButton({
  entry,
  label,
  onOpen,
}: {
  entry: string | null;
  label: string;
  onOpen: (je: string) => void;
}) {
  if (!entry) return null;
  return (
    <Tooltip label={`${label}: ${entry}`} withArrow>
      <ActionIcon
        size="sm"
        variant="light"
        color="brand"
        radius="md"
        onClick={(e) => {
          // Opens the drawer only; must not also toggle the row it sits in.
          e.stopPropagation();
          onOpen(entry);
        }}
      >
        <IconReceipt2 size={14} />
      </ActionIcon>
    </Tooltip>
  );
}

export function InvestmentDetailPanel({
  investmentId,
  investorName,
  onOpenEntry,
}: Props) {
  const { data, isError, error } = useQuery({
    queryKey: ["investorInvestmentDetail", investmentId],
    queryFn: () => getInvestmentDetail(investmentId),
    retry: false,
  });

  // Only a failed request shows the error; anything else without data is still loading.
  if (isError)
    return (
      <ErrorBlock
        error={error}
        fallback="The investment could not be loaded."
      />
    );
  if (!data) return <LoadingBlock />;
  return (
    <InvestmentDetailBody
      detail={data}
      investorName={investorName}
      onOpenEntry={onOpenEntry}
    />
  );
}

function InvestmentDetailBody({
  detail,
  investorName,
  onOpenEntry,
}: {
  detail: InvestmentDetail;
  investorName: string;
  onOpenEntry: (je: string) => void;
}) {
  const money = useMoney();
  const [tab, setTab] = useState<string | null>("funds");
  const paidInPct = detail.investment_amount
    ? (detail.fund_paid_in / detail.investment_amount) * 100
    : 0;

  return (
    <Stack gap="md">
      {/* Contract agreed to */}
      <Card>
        <Group justify="space-between" align="flex-start" mb="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={42} radius="md" variant="light" color="brand">
              <IconFileCertificate size={22} />
            </ThemeIcon>
            <Box>
              <Text fw={800} fz="lg" c="slate.9">
                {investorName}
              </Text>
              <Text fz="xs" fw={600} c="slate.6">
                {detail.name}
              </Text>
              <Text fz="xs" c="slate.5">
                {detail.investment_product_name} · created{" "}
                {fmtDate(detail.creation)}
              </Text>
            </Box>
          </Group>
          <Group gap={6}>
            <StatusBadge status={detail.status} />
            {detail.fund_status && (
              <Tooltip label="Fund status" withArrow>
                <span>
                  <StatusBadge status={`Fund ${detail.fund_status}`} />
                </span>
              </Tooltip>
            )}
          </Group>
        </Group>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <Field
            label="Investment amount"
            value={money(detail.investment_amount)}
          />
          <Field
            label="Interest rate"
            value={`${detail.interest_rate}% p.a.`}
          />
          <Field
            label="Repayment frequency"
            value={detail.repayment_frequency}
          />
          <Field
            label="Penalty rate"
            value={detail.penalty_rate ? `${detail.penalty_rate}% p.a.` : "-"}
          />
          <Field
            label="First repayment"
            value={fmtDate(detail.first_repayment_date)}
          />
          <Field label="Maturity date" value={fmtDate(detail.maturity_date)} />
          <Field label="Contract status" value={detail.contract_status} />
          <Field label="Contract sent to" value={detail.mail_sent} />
        </SimpleGrid>
        <Box mt="md">
          <Group justify="space-between" mb={4}>
            <Text fz="xs" c="slate.6">
              Paid in {money(detail.fund_paid_in)} of{" "}
              {money(detail.investment_amount)}
            </Text>
            {detail.fund_pending_approval > 0 && (
              <Text fz="xs" c="warning.7">
                {money(detail.fund_pending_approval)} waiting for approval
              </Text>
            )}
          </Group>
          <Progress value={paidInPct} size={8} radius="xl" color="info" />
        </Box>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
        <KpiTile
          icon={<IconCash size={18} />}
          color="info"
          label="Paid in"
          value={money(detail.fund_paid_in)}
          hint={
            detail.fund_remaining
              ? `${money(detail.fund_remaining)} still to be paid`
              : "Fully paid"
          }
        />
        <KpiTile
          icon={<IconArrowBackUp size={18} />}
          color="success"
          label="Received back"
          value={money(detail.received_back)}
          hint={`${money(detail.principal_returned)} principal + ${money(detail.interest_received)} interest`}
        />
        <KpiTile
          icon={<IconLock size={18} />}
          color="warning"
          label="Principal held"
          value={money(detail.principal_outstanding)}
          hint={`${money(detail.interest_outstanding)} interest to come`}
        />
        <KpiTile
          icon={<IconCoins size={18} />}
          color="grape"
          label="Payouts"
          value={`${detail.payouts_done} / ${detail.payouts_total}`}
          hint={
            detail.next_payout_date
              ? `Next ${money(detail.next_payout_amount)} on ${fmtDate(detail.next_payout_date)}`
              : "No payout scheduled"
          }
        />
      </SimpleGrid>

      <Card>
        <Tabs value={tab} onChange={setTab} color="brand">
          <Tabs.List mb="md">
            <Tabs.Tab value="funds" leftSection={<IconCash size={14} />}>
              Funds paid ({detail.funds.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="schedule"
              leftSection={<IconListDetails size={14} />}
            >
              Repayments ({detail.schedule.length})
            </Tabs.Tab>
            <Tabs.Tab value="trail" leftSection={<IconRoute size={14} />}>
              Money trail
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="funds">
            <FundsTable detail={detail} onOpenEntry={onOpenEntry} />
          </Tabs.Panel>
          <Tabs.Panel value="schedule">
            <RepaymentRecord
              detail={detail}
              investorName={investorName}
              onOpenEntry={onOpenEntry}
            />
          </Tabs.Panel>
          <Tabs.Panel value="trail">
            <MoneyTrail detail={detail} onOpenEntry={onOpenEntry} />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  );
}

function FundsTable({
  detail,
  onOpenEntry,
}: {
  detail: InvestmentDetail;
  onOpenEntry: (je: string) => void;
}) {
  const money = useMoney();
  // Fund row whose Journal Entry is dropped down under it (click a row to open / close).
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Table.ScrollContainer minWidth={860}>
      <Table
        verticalSpacing="sm"
        horizontalSpacing="sm"
        fz="xs"
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={36} />
            <Table.Th>Paid date</Table.Th>
            <Table.Th ta="right">Amount</Table.Th>
            <Table.Th>Mode</Table.Th>
            <Table.Th>Reference</Table.Th>
            <Table.Th>Paid from → Paid to</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th ta="right">Accounting</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {detail.funds.map((f) => (
            <Fragment key={f.name}>
              <Table.Tr
                onClick={() =>
                  f.journal_entry &&
                  setExpanded((e) => (e === f.name ? null : f.name))
                }
                style={{
                  cursor: f.journal_entry ? "pointer" : undefined,
                  background:
                    expanded === f.name
                      ? "var(--mantine-color-brand-0)"
                      : undefined,
                }}
              >
                <Table.Td>
                  {f.journal_entry && (
                    <IconChevronDown
                      size={14}
                      style={{
                        transform:
                          expanded === f.name ? "rotate(180deg)" : undefined,
                        transition: "transform 150ms ease",
                      }}
                    />
                  )}
                </Table.Td>
                <Table.Td>{fmtDate(f.paid_date)}</Table.Td>
                <Table.Td ta="right" fw={700}>
                  {money(f.amount)}
                </Table.Td>
                <Table.Td>{f.mode_of_payment}</Table.Td>
                <Table.Td>{f.reference_number || "-"}</Table.Td>
                <Table.Td>
                  <Group gap={6} wrap="nowrap">
                    <Text fz="xs" truncate maw={180}>
                      {f.paid_from_description || f.paid_from || "-"}
                    </Text>
                    <IconArrowRight
                      size={12}
                      color="var(--mantine-color-slate-4)"
                    />
                    <Text fz="xs" truncate maw={180}>
                      {f.paid_to_description || f.paid_to || "-"}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <StatusBadge status={f.record_status} size="xs" />
                </Table.Td>
                <Table.Td>
                  <Group justify="flex-end">
                    <EntryButton
                      entry={f.journal_entry}
                      label="Fund entry"
                      onOpen={onOpenEntry}
                    />
                  </Group>
                </Table.Td>
              </Table.Tr>
              {expanded === f.name && f.journal_entry && (
                <Table.Tr>
                  <Table.Td
                    colSpan={8}
                    style={{ background: "var(--mantine-color-slate-0)" }}
                  >
                    <JournalEntryLines name={f.journal_entry} />
                  </Table.Td>
                </Table.Tr>
              )}
            </Fragment>
          ))}
          {detail.funds.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text fz="xs" c="dimmed" ta="center" py="md">
                  No fund has been recorded for this investment yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

/** One line like the Repayment Record list; clicking it opens the schedule below it. */
function RepaymentRecord({
  detail,
  investorName,
  onOpenEntry,
}: {
  detail: InvestmentDetail;
  investorName: string;
  onOpenEntry: (je: string) => void;
}) {
  const money = useMoney();
  const [open, setOpen] = useState(false);
  return (
    <Stack gap="sm">
      <Table.ScrollContainer minWidth={860}>
        <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={36} />
              <Table.Th>Investor</Table.Th>
              <Table.Th>Product</Table.Th>
              <Table.Th ta="right">Amount</Table.Th>
              <Table.Th ta="right">Rate</Table.Th>
              <Table.Th>Frequency</Table.Th>
              <Table.Th>First Repay</Table.Th>
              <Table.Th>Maturity</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr
              onClick={() => setOpen((o) => !o)}
              style={{
                cursor: "pointer",
                background: open ? "var(--mantine-color-brand-0)" : undefined,
              }}
            >
              <Table.Td>
                <IconChevronDown
                  size={14}
                  style={{
                    transform: open ? "rotate(180deg)" : undefined,
                    transition: "transform 150ms ease",
                  }}
                />
              </Table.Td>
              <Table.Td fw={600}>{investorName}</Table.Td>
              <Table.Td>{detail.investment_product_name}</Table.Td>
              <Table.Td ta="right" fw={700}>
                {money(detail.investment_amount)}
              </Table.Td>
              <Table.Td ta="right">{detail.interest_rate}%</Table.Td>
              <Table.Td>{detail.repayment_frequency}</Table.Td>
              <Table.Td>{fmtDate(detail.first_repayment_date)}</Table.Td>
              <Table.Td>{fmtDate(detail.maturity_date)}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Collapse expanded={open}>
        <ScheduleTable detail={detail} onOpenEntry={onOpenEntry} />
      </Collapse>
    </Stack>
  );
}

/** Paid instalments of the schedule. */
function ScheduleTable({
  detail,
  onOpenEntry,
}: {
  detail: InvestmentDetail;
  onOpenEntry: (je: string) => void;
}) {
  const money = useMoney();
  const paidRows = detail.schedule.filter((r) => r.status === "Paid");
  return (
    <Table.ScrollContainer minWidth={900}>
      <Table
        verticalSpacing="sm"
        horizontalSpacing="sm"
        fz="xs"
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Due date</Table.Th>
            <Table.Th ta="right">Principal</Table.Th>
            <Table.Th ta="right">Interest</Table.Th>
            <Table.Th ta="right">Penalty</Table.Th>
            <Table.Th ta="right">Total</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Paid on</Table.Th>
            <Table.Th ta="right">Accounting</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paidRows.map((r) => (
            <Table.Tr key={r.name}>
              <Table.Td c="slate.5">{r.number}</Table.Td>
              <Table.Td>{fmtDate(r.payment_date)}</Table.Td>
              <Table.Td ta="right">{money(r.principal)}</Table.Td>
              <Table.Td ta="right">{money(r.interest)}</Table.Td>
              <Table.Td ta="right">
                {r.penalty ? money(r.penalty) : "-"}
              </Table.Td>
              <Table.Td ta="right" fw={700}>
                {money(r.total)}
              </Table.Td>
              <Table.Td>
                <StatusBadge status={r.status} size="xs" />
              </Table.Td>
              <Table.Td>{fmtDate(r.paid_on)}</Table.Td>
              <Table.Td>
                <Group justify="flex-end" gap={4}>
                  <EntryButton
                    entry={r.accrual_entry}
                    label="Interest accrual"
                    onOpen={onOpenEntry}
                  />
                  <EntryButton
                    entry={r.payout_entry}
                    label="Payout"
                    onOpen={onOpenEntry}
                  />
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {paidRows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={9}>
                <Text fz="xs" c="dimmed" ta="center" py="md">
                  No instalment has been paid yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

/** Everything that happened to the investor's money on this investment, oldest first. */
function MoneyTrail({
  detail,
  onOpenEntry,
}: {
  detail: InvestmentDetail;
  onOpenEntry: (je: string) => void;
}) {
  const money = useMoney();
  type TrailEvent = {
    date: string;
    title: string;
    text: string;
    color: string;
    icon: ReactNode;
    entry: string | null;
  };

  const events: TrailEvent[] = [
    ...detail.funds
      .filter((f) => f.record_status === "Approved")
      .map((f) => ({
        date: f.paid_date,
        title: `Paid in ${money(f.amount)}`,
        text: `By ${f.mode_of_payment}${f.reference_number ? ` (Ref ${f.reference_number})` : ""}, landed in ${
          f.paid_to_description || f.paid_to
        }`,
        color: "info",
        icon: <IconCash size={12} />,
        entry: f.journal_entry,
      })),
    ...detail.schedule
      .filter((r) => r.status === "Accrued" || r.status === "Paid")
      .map((r) => ({
        date: r.payment_date,
        title: `Interest of instalment ${r.number} booked: ${money(r.interest + r.penalty)}`,
        text: "Interest became due to the investor and was recorded as owed.",
        color: "grape",
        icon: <IconCoins size={12} />,
        entry: r.accrual_entry,
      })),
    ...detail.schedule
      .filter((r) => r.status === "Paid")
      .map((r) => ({
        date: r.paid_on || r.payment_date,
        title: `Paid back ${money(r.total)}`,
        text: `Instalment ${r.number}: ${money(r.principal)} principal + ${money(r.interest + r.penalty)} interest`,
        color: "success",
        icon: <IconArrowBackUp size={12} />,
        entry: r.payout_entry,
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length === 0) {
    return (
      <Text fz="xs" c="dimmed" ta="center" py="md">
        Nothing has happened to the money yet: no approved fund and no payout.
      </Text>
    );
  }

  return (
    <Timeline bulletSize={24} lineWidth={2} active={events.length}>
      {events.map((e, i) => (
        <Timeline.Item
          key={i}
          bullet={
            <ThemeIcon size={24} radius="xl" color={e.color}>
              {e.icon}
            </ThemeIcon>
          }
          color={e.color}
          title={
            <Group gap="xs">
              <Text fz="sm" fw={700} c="slate.8">
                {e.title}
              </Text>
              <EntryButton
                entry={e.entry}
                label="Accounting"
                onOpen={onOpenEntry}
              />
            </Group>
          }
        >
          <Text fz="xs" c="slate.6">
            {e.text}
          </Text>
          <Text fz={11} c="slate.4" mt={2}>
            {fmtDate(e.date)}
          </Text>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
