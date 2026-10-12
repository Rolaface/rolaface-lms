/* Overview: totals across all of the investor's investments and one row per investment. */
import {
  Box,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCalendarDue,
  IconCash,
  IconFileCertificate,
  IconHourglass,
  IconLock,
} from "@tabler/icons-react";
import type { InvestorPortfolio } from "../../../types/Investor/investorFlow";
import { Card, CardTitle, KpiTile, StatusBadge } from "./ui";
import { fmtDate, useMoney } from "./format";

interface Props {
  portfolio: InvestorPortfolio;
  onOpenInvestment: (id: string) => void;
}

export function OverviewPanel({ portfolio, onOpenInvestment }: Props) {
  const money = useMoney();
  const { totals, investments } = portfolio;

  // Where the principal paid in stands now: returned to the investor or still held by the company.
  const paidIn = totals.fund_paid_in;
  const returnedPct = paidIn ? (totals.principal_returned / paidIn) * 100 : 0;
  const heldPct = paidIn ? (totals.principal_outstanding / paidIn) * 100 : 0;

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
        <KpiTile
          icon={<IconFileCertificate size={18} />}
          color="brand"
          label="Contracted"
          value={money(totals.contracted)}
          hint={`${totals.investments} investment(s), ${totals.active} active`}
        />
        <KpiTile
          icon={<IconCash size={18} />}
          color="info"
          label="Paid in by investor"
          value={money(totals.fund_paid_in)}
          hint={
            totals.fund_remaining
              ? `${money(totals.fund_remaining)} still to be paid`
              : "Fully paid"
          }
        />
        <KpiTile
          icon={<IconArrowBackUp size={18} />}
          color="success"
          label="Received back"
          value={money(totals.received_back)}
          hint={`${money(totals.principal_returned)} principal + ${money(totals.interest_received)} interest`}
        />
        <KpiTile
          icon={<IconLock size={18} />}
          color="warning"
          label="Principal held"
          value={money(totals.principal_outstanding)}
          hint="Paid in, not yet returned"
        />
        <KpiTile
          icon={<IconHourglass size={18} />}
          color="grape"
          label="Interest to come"
          value={money(totals.interest_outstanding)}
          hint="On payouts not yet made"
        />
        <KpiTile
          icon={<IconCalendarDue size={18} />}
          color="cyan"
          label="Next payout"
          value={
            totals.next_payout_date ? money(totals.next_payout_amount) : "-"
          }
          hint={
            totals.next_payout_date
              ? `${fmtDate(totals.next_payout_date)} · ${totals.next_payout_investment}`
              : "No payout scheduled"
          }
        />
      </SimpleGrid>

      <Card>
        <CardTitle
          title="Where the money stands"
          subtitle="Principal paid in by the investor, split by what happened to it"
        />
        <Progress.Root size={14} radius="xl">
          <Tooltip
            label={`Returned ${money(totals.principal_returned)}`}
            withArrow
          >
            <Progress.Section value={returnedPct} color="success" />
          </Tooltip>
          <Tooltip
            label={`Held ${money(totals.principal_outstanding)}`}
            withArrow
          >
            <Progress.Section value={heldPct} color="warning" />
          </Tooltip>
        </Progress.Root>
        <Group gap="xl" mt="sm">
          {[
            {
              color: "success",
              label: "Returned to investor",
              value: totals.principal_returned,
            },
            {
              color: "warning",
              label: "Held by company",
              value: totals.principal_outstanding,
            },
            {
              color: "slate",
              label: "Still to be paid in",
              value: totals.fund_remaining,
            },
          ].map((l) => (
            <Group key={l.label} gap={6}>
              <Box
                w={10}
                h={10}
                style={{
                  borderRadius: 3,
                  background: `var(--mantine-color-${l.color}-5)`,
                }}
              />
              <Text fz="xs" c="slate.6">
                {l.label}
              </Text>
              <Text fz="xs" fw={700} c="slate.8">
                {money(l.value)}
              </Text>
            </Group>
          ))}
        </Group>
      </Card>

      <Card>
        <CardTitle
          title="Investments"
          subtitle="Click an investment to see its contract, funds, payouts and accounting"
        />
        <Table.ScrollContainer minWidth={900}>
          <Table
            verticalSpacing="sm"
            horizontalSpacing="sm"
            fz="xs"
            highlightOnHover
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Investment</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="right">Contracted</Table.Th>
                <Table.Th ta="right">Paid in</Table.Th>
                <Table.Th ta="right">Received back</Table.Th>
                <Table.Th ta="right">Principal held</Table.Th>
                <Table.Th>Payouts</Table.Th>
                <Table.Th>Next payout</Table.Th>
                <Table.Th>Maturity</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {investments.map((inv) => (
                <Table.Tr
                  key={inv.name}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenInvestment(inv.name)}
                >
                  <Table.Td>
                    <Text fz="xs" fw={700} c="brand.7">
                      {inv.name}
                    </Text>
                    <Text fz={11} c="slate.5">
                      {inv.investment_product_name} · {inv.interest_rate}% p.a.
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={inv.status} size="xs" />
                  </Table.Td>
                  <Table.Td ta="right">{money(inv.investment_amount)}</Table.Td>
                  <Table.Td ta="right">{money(inv.fund_paid_in)}</Table.Td>
                  <Table.Td ta="right">{money(inv.received_back)}</Table.Td>
                  <Table.Td ta="right">
                    {money(inv.principal_outstanding)}
                  </Table.Td>
                  <Table.Td>
                    <Text fz="xs" fw={600}>
                      {inv.payouts_done} / {inv.payouts_total}
                    </Text>
                    <Progress
                      value={
                        inv.payouts_total
                          ? (inv.payouts_done / inv.payouts_total) * 100
                          : 0
                      }
                      size={3}
                      color="success"
                      w={70}
                    />
                  </Table.Td>
                  <Table.Td>
                    {inv.next_payout_date ? (
                      <>
                        <Text fz="xs" fw={600}>
                          {money(inv.next_payout_amount)}
                        </Text>
                        <Text fz={11} c="slate.5">
                          {fmtDate(inv.next_payout_date)}
                        </Text>
                      </>
                    ) : (
                      "-"
                    )}
                  </Table.Td>
                  <Table.Td>{fmtDate(inv.maturity_date)}</Table.Td>
                </Table.Tr>
              ))}
              {investments.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text fz="xs" c="dimmed" ta="center" py="md">
                      This investor has no investments yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
}
