import { useMemo } from "react";
import { Paper, Group, Title, TextInput, Button, ActionIcon, Loader, Alert, Table, Badge, Text, Pagination, Select, Tooltip } from "@mantine/core";
import { IconSearch, IconFilter, IconDownload, IconPlus, IconAlertCircle, IconEye, IconSelector, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from "@tanstack/react-table";
import { theme } from "./LoanStatementSummaryCards";
import type { StatementRow, StatementSort } from "../../types/Report/loanStatement";

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  "Opening Balance": { bg: "#F1F5F9", color: "#64748B" },
  Disbursal: { bg: theme.indigoAlt[0], color: theme.indigoAlt[6] },
  Charge: { bg: theme.gold[0], color: theme.gold[6] },
  Repayment: { bg: theme.brand[0], color: theme.brand[6] },
  Interest: { bg: theme.accent[0], color: theme.accent[6] },
};

function SortIcon({ active, direction }: { active: boolean; direction: StatementSort["direction"] }) {
  if (!active) return <IconSelector size={13} className="text-slate-300" />;
  return direction === "asc" ? <IconChevronUp size={13} className="text-slate-500" /> : <IconChevronDown size={13} className="text-slate-500" />;
}

const columnHelper = createColumnHelper<StatementRow>();

export function LoanStatementTable({ rows, pagination, paginationState, sortState, searchState, status, actions, renderCurrency }: any) {
  const { sort, toggleSort } = sortState;

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", { header: "Date", cell: (info) => <div className="text-slate-500">{info.getValue()}</div> }),
      columnHelper.accessor("particulars", { header: "Particulars", enableSorting: false, cell: (info) => <div className="text-slate-700">{info.getValue()}</div> }),
      columnHelper.accessor("reference_no", { header: "Reference No.", enableSorting: false, cell: (info) => <div className="text-slate-400 font-mono text-[11.5px]">{info.getValue()}</div> }),
      columnHelper.accessor("transaction_type", {
        header: "Transaction Type",
        enableSorting: false,
        cell: (info) => {
          const type = info.getValue();
          const b = TYPE_BADGE[type] || { bg: "#F1F5F9", color: "#64748B" };
          return (
            <Badge radius="sm" size="sm" style={{ backgroundColor: b.bg, color: b.color, textTransform: "none" }}>{type}</Badge>
          );
        },
      }),
      columnHelper.accessor("debit", { header: "Debit", enableSorting: false, cell: (info) => <div className="text-slate-600 text-right">{info.getValue() > 0 ? renderCurrency(info.getValue()) : "-"}</div> }),
      columnHelper.accessor("credit", { header: "Credit", enableSorting: false, cell: (info) => <div className="text-slate-600 text-right">{info.getValue() > 0 ? renderCurrency(info.getValue()) : "-"}</div> }),
      columnHelper.accessor("balance", { header: "Balance", cell: (info) => <div className="text-slate-800 font-bold text-right">{renderCurrency(info.getValue())}</div> }),
      columnHelper.display({
        id: "actions", header: "Actions", cell: () => (
          <Group gap={4} justify="flex-end">
            <Tooltip label="View"><ActionIcon variant="subtle" color="gray" size="sm"><IconEye size={14} /></ActionIcon></Tooltip>
          </Group>
        ),
      }),
    ],
    [renderCurrency]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel(), manualSorting: true, manualPagination: true });

  const totalRows = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (paginationState.page - 1) * paginationState.pageSize + 1;
  const lastRow = Math.min(totalRows, paginationState.page * paginationState.pageSize);

  return (
    <Paper withBorder radius="lg" className="border-slate-200 overflow-hidden relative">
      <Group justify="space-between" p="sm" className="border-b border-slate-100">
        <Title order={5} className="text-slate-900">Loan Statement Details</Title>
        <Group gap={10}>
          <TextInput
            placeholder="Search transactions..."
            leftSection={<IconSearch size={14} className="text-slate-400" />}
            value={searchState.search}
            onChange={(e) => searchState.setSearch(e.currentTarget.value)}
            classNames={{ input: "h-9 w-56 rounded-lg border-slate-200 text-[12.5px]" }}
          />
          <Button variant="default" size="sm" radius="md" leftSection={<IconFilter size={13} />}>Filter</Button>
          <ActionIcon variant="default" size={36} radius="md" onClick={() => actions.handleExport("excel")} loading={status.exportingType === "excel"}>
            <IconDownload size={14} />
          </ActionIcon>
          <ActionIcon variant="filled" color="blue" size={36} radius="md"><IconPlus size={16} /></ActionIcon>
        </Group>
      </Group>

      <div className="overflow-x-auto min-h-[250px] relative">
        {status.loadingTable ? (
          <Group justify="center" align="center" className="absolute inset-0 z-10 bg-white/70"><Loader color="blue" size="md" /></Group>
        ) : status.error ? (
          <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />} m="md">{status.error}</Alert>
        ) : rows.length === 0 ? (
          <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />} m="md">No transactions match the selected criteria.</Alert>
        ) : (
          <Table verticalSpacing="xs" horizontalSpacing="md" className="text-[12.5px]">
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id} className="text-slate-400">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.id === "date" || header.column.id === "balance";
                    const isActive = sort.field === header.column.id;
                    const isRightAligned = ["debit", "credit", "balance", "actions"].includes(header.column.id);

                    return (
                      <Table.Th key={header.id} onClick={canSort ? () => toggleSort(header.column.id) : undefined} className={canSort ? "cursor-pointer" : ""}>
                        <Group gap={4} justify={isRightAligned ? "flex-end" : "flex-start"} wrap="nowrap">
                          <Text size="12px" fw={600} c="dimmed">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Text>
                          {canSort && <SortIcon active={isActive} direction={sort.direction} />}
                        </Group>
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </div>

      <Group justify="space-between" p="sm" className="border-t border-slate-100">
        <Text size="12px" c="dimmed">Showing {totalRows === 0 ? 0 : firstRow} to {lastRow} of {totalRows} entries</Text>
        <Group gap={12}>
          <Pagination total={totalPages} value={paginationState.page} onChange={paginationState.setPage} color="blue" size="sm" radius="md" disabled={status.loadingTable} />
          <Select
            data={[{ value: "5", label: "5 / page" }, { value: "10", label: "10 / page" }, { value: "20", label: "20 / page" }, { value: "50", label: "50 / page" }]}
            value={String(paginationState.pageSize)}
            onChange={(v) => v && paginationState.setPageSize(Number(v))}
            classNames={{ input: "h-8 text-[12px] w-28 rounded-lg border-slate-200" }}
            rightSection={<IconChevronDown size={12} className="text-slate-400" />}
            disabled={status.loadingTable}
          />
        </Group>
      </Group>
    </Paper>
  );
}