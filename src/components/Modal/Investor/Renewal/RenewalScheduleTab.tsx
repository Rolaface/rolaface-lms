/* Tab 2 - the schedule of the renewed contract (a preview until the renewal is approved). */
import {
  Alert,
  Badge,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Table,
  Text,
} from "@mantine/core";
import { useCompanyStore } from "../../../../store/companyStore";
import { formatAmount } from "../../../../store/currencyStore";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { fmtDate } from "../InvestorModalShared";

export interface RenewalScheduleLine {
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  total_payment: number;
  status: string | null;
}

interface Props {
  /** Shown above the table, e.g. "Preview" or "Current schedule (version 3)". */
  caption: string;
  rows: RenewalScheduleLine[] | null;
  loading: boolean;
  error: unknown;
  /** Why there is nothing to show (e.g. the terms are incomplete). */
  emptyMessage: string;
}

const STATUS_COLOR: Record<string, string> = {
  Pending: "slate",
  Accrued: "info",
  Paid: "success",
};

export function RenewalScheduleTab({
  caption,
  rows,
  loading,
  error,
  emptyMessage,
}: Props) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });

  if (loading)
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" color="brand" />
      </Group>
    );
  if (error)
    return (
      <Alert variant="light" color="red" radius="md">
        {parseFrappeError(error)}
      </Alert>
    );
  if (!rows || rows.length === 0)
    return (
      <Alert variant="light" color="slate" radius="md">
        {emptyMessage}
      </Alert>
    );

  const sum = (f: keyof RenewalScheduleLine) =>
    rows.reduce((t, r) => t + (Number(r[f]) || 0), 0);

  return (
    <>
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm" mb="md">
        {[
          { label: "Payouts", value: String(rows.length) },
          { label: "Principal", value: fmtAmount(sum("principal_amount")) },
          { label: "Interest", value: fmtAmount(sum("interest_amount")) },
          { label: "Total payout", value: fmtAmount(sum("total_payment")) },
        ].map((k) => (
          <Paper key={k.label} p="sm" radius="md" withBorder>
            <Text fz={11} c="slate.5">
              {k.label}
            </Text>
            <Text fz="md" fw={800} c="slate.8">
              {k.value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
      <Paper radius="lg" p="sm" withBorder>
        <Text fz="xs" fw={700} c="slate.6" mb="xs">
          {caption}
        </Text>
        <Table.ScrollContainer minWidth={720}>
          <Table
            verticalSpacing="xs"
            horizontalSpacing="sm"
            fz="xs"
            striped
            highlightOnHover
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Payment date</Table.Th>
                <Table.Th ta="right">Principal</Table.Th>
                <Table.Th ta="right">Interest</Table.Th>
                <Table.Th ta="right">Penalty</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r, i) => (
                <Table.Tr key={`${r.payment_date}-${i}`}>
                  <Table.Td c="slate.5">{i + 1}</Table.Td>
                  <Table.Td>
                    {fmtDate(r.payment_date)}
                    {!Number(r.principal_amount) && r.status === "Accrued" && (
                      <Text span fz={10} c="info.7" ml={6}>
                        deferred interest
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="right">
                    {fmtAmount(Number(r.principal_amount) || 0)}
                  </Table.Td>
                  <Table.Td ta="right">
                    {fmtAmount(Number(r.interest_amount) || 0)}
                  </Table.Td>
                  <Table.Td ta="right">
                    {Number(r.penalty_amount)
                      ? fmtAmount(Number(r.penalty_amount))
                      : "-"}
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    {fmtAmount(Number(r.total_payment) || 0)}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="xs"
                      variant="light"
                      color={STATUS_COLOR[r.status ?? "Pending"] ?? "slate"}
                      style={{ textTransform: "none" }}
                    >
                      {r.status ?? "Pending"}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
