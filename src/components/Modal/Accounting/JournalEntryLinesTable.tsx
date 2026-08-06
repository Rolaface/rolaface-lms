import { Badge, Button, Table, Text, Paper, Group, Box } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import JournalEntryLineRow from "./JournalEntryLineRow";
import type {
  JournalEntryLine,
  JournalEntryRowErrors,
  SelectOption,
} from "../../../types/Accounting/Journalentry.types";

interface JournalEntryLinesTableProps {
  rows: JournalEntryLine[];
  accountOptions?: SelectOption[];
  partyTypeOptions?: SelectOption[];
  customerOptions?: SelectOption[];
  supplierOptions?: SelectOption[];
  isReadOnly?: boolean;
  rowErrors?: JournalEntryRowErrors;
  onAddRow?: () => void;
  onRemoveRow?: (index: number) => void;
  onRowChange?: (
    index: number,
    field: keyof JournalEntryLine,
    value: string,
    extraUpdates?: Partial<JournalEntryLine>,
  ) => void;
}

export default function JournalEntryLinesTable({
  rows,
  accountOptions = [],
  partyTypeOptions = [],
  customerOptions = [],
  supplierOptions = [],
  isReadOnly = false,
  rowErrors = {},
  onAddRow,
  onRemoveRow,
  onRowChange,
}: JournalEntryLinesTableProps) {
  return (
    <Box>
      <Group gap="xs" mb="sm">
        <Text fz="sm" fw={700} c="slate.8">
          Account Entries
        </Text>
        <Badge
          size="xs"
          radius="xl"
          variant="light"
          color="slate"
          styles={{ label: { fontWeight: 700, fontSize: 10 } }}
        >
          {rows.length} ROWS
        </Badge>
      </Group>

      <Paper
        radius="md"
        withBorder
        style={{ borderColor: "var(--mantine-color-slate-2)", overflow: "hidden" }}
      >
        <Table
          verticalSpacing={6}
          horizontalSpacing="xs"
          fz="xs"
          layout="fixed"
          w="100%"
          styles={{
            thead: { backgroundColor: "var(--mantine-color-slate-0)" },
            th: {
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              color: "var(--mantine-color-slate-5)",
              fontWeight: 600,
              padding: "8px 8px",
            },
            td: { padding: "6px 6px", verticalAlign: "middle" },
          }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="3%" ta="center">
                #
              </Table.Th>
              <Table.Th w="21%">Account</Table.Th>
              <Table.Th w="6%" ta="center">
                CCY
              </Table.Th>
              <Table.Th w="7%">Type</Table.Th>
              <Table.Th w="11%" ta="right">
                Amount
              </Table.Th>
              <Table.Th w="12%">Party Type</Table.Th>
              <Table.Th w="15%">Party</Table.Th>
              <Table.Th w="7%" ta="right">
                Rate
              </Table.Th>
              <Table.Th w="13%">Remark</Table.Th>
              {!isReadOnly && <Table.Th w="5%" ta="center" />}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={isReadOnly ? 9 : 10} ta="center" py="xl">
                  <Text c="slate.5" fz="sm">
                    No journal entry lines added.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row, index) => (
                <JournalEntryLineRow
                  key={index}
                  index={index}
                  entry={row}
                  accountOptions={accountOptions}
                  partyTypeOptions={partyTypeOptions}
                  customerOptions={customerOptions}
                  supplierOptions={supplierOptions}
                  isReadOnly={isReadOnly}
                  rowError={rowErrors[index]}
                  onChange={onRowChange ?? (() => {})}
                  onRemove={onRemoveRow ?? (() => {})}
                />
              ))
            )}
          </Table.Tbody>
        </Table>

        {!isReadOnly && (
          <Box
            p="sm"
            style={{
              background: "var(--mantine-color-slate-0)",
              borderTop: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            <Button
              size="xs"
              variant="subtle"
              color="brand"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={onAddRow}
            >
              Add New Row
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}