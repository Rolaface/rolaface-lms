/* Accounting drill-down: one Journal Entry, which GL was debited / credited, when, and where the money went. */
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Drawer,
  Group,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconArrowRight,
  IconInfoCircle,
  IconReceipt2,
} from "@tabler/icons-react";
import { getJournalEntryDetail } from "../../../api/Investor/investorFlowApi";
import type {
  JournalEntryDetail,
  JournalEntryLine,
} from "../../../types/Investor/investorFlow";
import { Card, ErrorBlock, LoadingBlock } from "./ui";
import { fmtDate, useMoney } from "./format";

interface Props {
  /** Journal Entry to show; null closes the drawer. */
  journalEntry: string | null;
  onClose: () => void;
}

export function JournalEntryDrawer({ journalEntry, onClose }: Props) {
  return (
    <Drawer
      opened={!!journalEntry}
      onClose={onClose}
      position="right"
      size="xl"
      radius="md"
      offset={8}
      title={
        <Group gap="sm">
          <ThemeIcon size={32} radius="md" variant="light" color="brand">
            <IconReceipt2 size={18} />
          </ThemeIcon>
          <Box>
            <Text fw={800} fz="md" c="slate.9">
              Accounting
            </Text>
            <Text fz="xs" c="slate.5">
              {journalEntry}
            </Text>
          </Box>
        </Group>
      }
    >
      {journalEntry && <JournalEntryBody name={journalEntry} />}
    </Drawer>
  );
}

function JournalEntryBody({ name }: { name: string }) {
  const { data, isError, error } = useQuery({
    queryKey: ["journalEntryDetail", name],
    queryFn: () => getJournalEntryDetail(name),
    retry: false,
  });

  // Only a failed request shows the error; anything else without data is still loading.
  if (isError)
    return (
      <ErrorBlock
        error={error}
        fallback="The Journal Entry could not be loaded."
      />
    );
  if (!data) return <LoadingBlock />;

  // Credited lines are where the value came from; debited lines are where it went.
  const from = data.lines.filter((l) => l.credit > 0);
  const to = data.lines.filter((l) => l.debit > 0);

  return (
    <Stack gap="md">
      {/* Money flow: credited accounts on the left, debited accounts on the right */}
      <Card>
        <Text fw={700} fz="sm" c="slate.8" mb="sm">
          Where the money came from and where it went
        </Text>
        <Group align="stretch" wrap="nowrap" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text fz={11} fw={700} c="slate.5" tt="uppercase">
              From (credited)
            </Text>
            {from.map((l, i) => (
              <FlowCard key={i} line={l} amount={l.credit} color="danger" />
            ))}
          </Stack>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <ThemeIcon size={30} radius="xl" variant="light" color="brand">
              <IconArrowRight size={16} />
            </ThemeIcon>
          </Box>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text fz={11} fw={700} c="slate.5" tt="uppercase">
              To (debited)
            </Text>
            {to.map((l, i) => (
              <FlowCard key={i} line={l} amount={l.debit} color="success" />
            ))}
          </Stack>
        </Group>
      </Card>

      <Card>
        <Text fw={700} fz="sm" c="slate.8" mb="sm">
          GL lines
        </Text>
        <GlLinesTable data={data} />
      </Card>
    </Stack>
  );
}

function FlowCard({
  line,
  amount,
  color,
}: {
  line: JournalEntryLine;
  amount: number;
  color: string;
}) {
  const money = useMoney();
  return (
    <Box
      p="sm"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: `1px solid var(--mantine-color-${color}-2)`,
        background: `var(--mantine-color-${color}-0)`,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text fz="xs" fw={700} c="slate.8" truncate>
          {line.account_name}
        </Text>
        <Text
          fz="xs"
          fw={800}
          c={`${color}.7`}
          style={{ whiteSpace: "nowrap" }}
        >
          {money(amount)}
        </Text>
      </Group>
      <Group gap={4} mt={4} wrap="wrap">
        <Badge
          size="xs"
          variant="white"
          color="slate"
          style={{ textTransform: "none" }}
        >
          {line.root_type}
        </Badge>
        {line.party && (
          <Badge
            size="xs"
            variant="white"
            color="slate"
            style={{ textTransform: "none" }}
          >
            {line.party}
          </Badge>
        )}
      </Group>
      {line.meaning && (
        <Group gap={4} mt={6} wrap="nowrap">
          <IconInfoCircle size={11} color={`var(--mantine-color-${color}-6)`} />
          <Text fz={11} c="slate.6">
            {line.meaning}
          </Text>
        </Group>
      )}
    </Box>
  );
}

/** GL lines of a Journal Entry: posting date, reference, account, party, debit and credit. */
function GlLinesTable({ data }: { data: JournalEntryDetail }) {
  const money = useMoney();
  return (
    <Table.ScrollContainer minWidth={620}>
      <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Posted on</Table.Th>
            <Table.Th>Ref no.</Table.Th>
            <Table.Th>GL account</Table.Th>
            <Table.Th>Party</Table.Th>
            <Table.Th ta="right">Debit</Table.Th>
            <Table.Th ta="right">Credit</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.lines.map((l, i) => (
            <Table.Tr key={i}>
              <Table.Td style={{ whiteSpace: "nowrap" }}>
                {fmtDate(data.posting_date)}
              </Table.Td>
              <Table.Td>{data.reference_no || "-"}</Table.Td>
              <Table.Td>
                <Text fz="xs" fw={700} c="slate.8">
                  {l.account_name}
                  {l.account_number ? ` (${l.account_number})` : ""}
                </Text>
                <Text fz={11} c="slate.5">
                  {l.root_type}
                </Text>
              </Table.Td>
              <Table.Td>{l.party || "-"}</Table.Td>
              <Table.Td
                ta="right"
                fw={l.debit ? 700 : 400}
                c={l.debit ? "slate.9" : "slate.4"}
              >
                {l.debit ? money(l.debit) : "-"}
              </Table.Td>
              <Table.Td
                ta="right"
                fw={l.credit ? 700 : 400}
                c={l.credit ? "slate.9" : "slate.4"}
              >
                {l.credit ? money(l.credit) : "-"}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr style={{ background: "var(--mantine-color-slate-0)" }}>
            <Table.Td colSpan={4} fw={700}>
              Total
            </Table.Td>
            <Table.Td ta="right" fw={800}>
              {money(data.total_debit)}
            </Table.Td>
            <Table.Td ta="right" fw={800}>
              {money(data.total_credit)}
            </Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Table.ScrollContainer>
  );
}

/** GL lines of one Journal Entry, loaded by name (used as the dropdown under a row). */
export function JournalEntryLines({ name }: { name: string }) {
  const { data, isError, error } = useQuery({
    queryKey: ["journalEntryDetail", name],
    queryFn: () => getJournalEntryDetail(name),
    retry: false,
  });
  // Only a failed request shows the error; anything else without data is still loading.
  if (isError)
    return (
      <ErrorBlock
        error={error}
        fallback="The Journal Entry could not be loaded."
      />
    );
  if (!data) return <LoadingBlock />;
  return <GlLinesTable data={data} />;
}
