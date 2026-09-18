import { useMemo, useState } from "react";
import { Paper, Table, Text, Badge, Loader, Group } from "@mantine/core";
import { IconChevronUp, IconChevronDown, IconSelector } from "@tabler/icons-react";
import { themeTokens, serif } from "../SharedUI";

type SortField =
  | "idx"
  | "payment_date"
  | "principal_amount"
  | "interest_amount"
  | "total_payment"
  | "balance_loan_amount"
  | "ui_status";

type SortDirection = "asc" | "desc";

// Small header sort icon — reused pattern from LoanAccount's table.
function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  const color = active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-4)";
  if (!active) return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
  return direction === "asc" ? (
    <IconChevronUp size={12} color={color} />
  ) : (
    <IconChevronDown size={12} color={color} />
  );
}

const COLUMNS: { field: SortField; label: string; miw?: number }[] = [
  { field: "idx", label: "#" },
  { field: "payment_date", label: "PAYMENT DATE" },
  { field: "principal_amount", label: "PRINCIPAL" },
  { field: "interest_amount", label: "INTEREST" },
  { field: "total_payment", label: "TOTAL PAYMENT" },
  { field: "balance_loan_amount", label: "BALANCE" },
  { field: "ui_status", label: "STATUS", miw: 110 },
];

export function ScheduleTab({ data, renderCurrency }: any) {
  const { schedule } = data;

  const [sortField, setSortField] = useState<SortField>("idx");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const scheduleRows = schedule?.repayment_schedule || [];

  const sortedRows = useMemo(() => {
    const rows = [...scheduleRows];
    rows.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "payment_date") {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (sortField === "ui_status") {
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
      } else {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [scheduleRows, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (!schedule) {
    return (
      <Paper radius="lg" p="xl" style={{ border: '1px solid var(--mantine-color-slate-2)' }} className="flex justify-center">
        <Loader size="sm" color="slate" />
      </Paper>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Paper radius="lg" className="overflow-hidden flex flex-col" style={{ border: '1px solid var(--mantine-color-slate-2)', boxShadow: 'var(--mantine-shadow-sm)' }}>
        <Group
          justify="space-between"
          align="center"
          wrap="wrap"
          gap="sm"
          className="px-4 py-3 border-b border-[var(--mantine-color-slate-1)]"
        >
          <div>
            <Text fz="lg" fw={600} c="slate.9" style={serif}>Repayment Schedule</Text>
            <Text fz="xs" c="dimmed">Reference: {schedule.name}</Text>
          </div>

          <Badge size="sm" variant="light" color="blue">
            Rate: {schedule.rate_of_interest}%
          </Badge>
        </Group>

        {/* Fixed max-height + its own scroll — page never stretches */}
        <div
          className="overflow-x-auto overflow-y-auto"
          style={{ maxHeight: "clamp(220px, calc(100vh - 440px), 360px)" }}
        >
          <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover miw={640}>
            <Table.Thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "var(--mantine-color-white)",
              }}
            >
              <Table.Tr>
                {COLUMNS.map((col) => (
                  <Table.Th
                    key={col.field}
                    miw={col.miw}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleSort(col.field)}
                  >
                    <Group gap={4} wrap="nowrap">
                      <Text fz="xs" fw={700}>{col.label}</Text>
                      <SortIcon
                        active={sortField === col.field}
                        direction={sortDirection}
                      />
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedRows.map((row: any) => (
                <Table.Tr key={row.idx}>
                  <Table.Td className="font-mono text-slate-500">{row.idx}</Table.Td>
                  <Table.Td>{row.payment_date}</Table.Td>
                  <Table.Td className="font-mono">{renderCurrency(row.principal_amount)}</Table.Td>
                  <Table.Td className="font-mono">{renderCurrency(row.interest_amount)}</Table.Td>
                  <Table.Td className="font-mono font-semibold text-slate-800">
                    {renderCurrency(row.total_payment)}
                  </Table.Td>
                  <Table.Td className="font-mono text-slate-600">
                    {renderCurrency(row.balance_loan_amount)}
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: "nowrap" }}>
                    <Badge
                      size="xs"
                      variant="light"
                      color={
                        row.ui_status === "Paid" ? "teal" :
                        row.ui_status === "Partially Paid" ? "yellow" :
                        row.ui_status === "Overdue" ? "red" : "gray"
                      }
                      styles={{
                        root: { whiteSpace: "nowrap" },
                        label: { overflow: "visible", textOverflow: "unset" },
                      }}
                    >
                      {row.ui_status || "Upcoming"}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
              {sortedRows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center py-4 text-xs text-[var(--mantine-color-slate-5)]">
                    No schedule generated.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
    </div>
  );
}