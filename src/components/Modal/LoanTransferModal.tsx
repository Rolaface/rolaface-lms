import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  Select,
  Modal,
  Table,
  Checkbox,
  ActionIcon,
  Pagination,
  Group,
} from "@mantine/core";
import {
  IconX,
  IconCalendar,
  IconBuildingBank,
  IconArrowRight,
  IconTrash,
  IconSettings,
  IconArrowsExchange,
  IconPlus,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

export interface LoanTransferFormData {
  transferDate: string;
  fromBranch: string;
  toBranch: string;
  loans: { rowId: number; loanId: string; applicant: string }[];
}

interface LoanTransferModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanTransferFormData) => void;
}

const LOAN_BOOK = [
  { id: "ACC-LOAN-2026-00001", applicant: "Mwansa Chileshe" },
  { id: "ACC-LOAN-2026-00002", applicant: "Bwalya Mutale" },
  { id: "ACC-LOAN-2026-00003", applicant: "Chanda Phiri" },
  { id: "ACC-LOAN-2026-00004", applicant: "Natasha Banda" },
  { id: "ACC-LOAN-2026-00005", applicant: "Kelvin Zulu" },
  { id: "ACC-LOAN-2026-00006", applicant: "Precious Mumba" },
  { id: "ACC-LOAN-2026-00007", applicant: "Given Tembo" },
  { id: "ACC-LOAN-2026-00008", applicant: "Sarah Lungu" },
  { id: "ACC-LOAN-2026-00009", applicant: "Douglas Kunda" },
  { id: "ACC-LOAN-2026-00010", applicant: "Ruth Sakala" },
];

const BRANCH_OPTIONS = ["Lusaka Main", "Ndola", "Kitwe", "Livingstone"];
const PAGE_SIZE = 5;

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

type TransferRow = { rowId: number; loanId: string; applicant: string };

const columnHelper = createColumnHelper<TransferRow>();

export function LoanTransferModal({ opened, onClose, onSubmit }: LoanTransferModalProps) {
  const [transferDate, setTransferDate] = useState("2026-07-28");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");

  const [rows, setRows] = useState<TransferRow[]>([
    { rowId: 1, loanId: "ACC-LOAN-2026-00001", applicant: "Mwansa Chileshe" },
  ]);
  const [rowSeq, setRowSeq] = useState(2);

  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
    if (pagination.pageIndex > maxPage) {
      setPagination((p) => ({ ...p, pageIndex: maxPage }));
    }
  }, [rows.length, pagination.pageIndex]);

  const excludeIds = rows.map((r) => r.loanId).filter(Boolean);

  const addRow = () => {
    const newRow = { rowId: rowSeq, loanId: "", applicant: "" };
    setRowSeq((prev) => prev + 1);
    const nextRows = [...rows, newRow];
    setRows(nextRows);
    const newPage = Math.floor((nextRows.length - 1) / PAGE_SIZE);
    setPagination({ pageIndex: newPage, pageSize: PAGE_SIZE });
  };

  const pickLoan = (rowId: number, loanId: string | null) => {
    if (!loanId) return;
    const loan = LOAN_BOOK.find((l) => l.id === loanId);
    if (!loan) return;

    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, loanId: loan.id, applicant: loan.applicant } : r))
    );
  };

  const removeRow = (rowId: number) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
    setRowSelection((prev: any) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const removeSelected = () => {
    setRows((prev) => prev.filter((r) => !(rowSelection as any)[r.rowId]));
    setRowSelection({});
  };

  const handleReset = () => {
    setTransferDate("");
    setFromBranch("");
    setToBranch("");
    setRows([{ rowId: 1, loanId: "", applicant: "" }]);
    setRowSelection({});
    setPagination({ pageIndex: 0, pageSize: PAGE_SIZE });
    setRowSeq(2);
  };

  const handleSubmit = () => {
    const filledRows = rows.filter((r) => r.loanId);
    onSubmit?.({ transferDate, fromBranch, toBranch, loans: filledRows });
    onClose();
  };

  const filledRows = rows.filter((r) => r.loanId);
  const canSave = transferDate && fromBranch && toBranch && filledRows.length > 0;
  const hasSelection = Object.keys(rowSelection).length > 0;

  const getLoanOptions = (currentRowLoanId: string) =>
    LOAN_BOOK.filter((l) => !excludeIds.includes(l.id) || l.id === currentRowLoanId).map((l) => ({
      value: l.id,
      label: `${l.id} — ${l.applicant}`,
    }));

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="xs"
            color="indigo"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      }),
      columnHelper.accessor("rowId", {
        header: "No.",
        cell: (info) => (
          <Text fz="xs" c="dimmed">
            {info.row.index + 1 + pagination.pageIndex * PAGE_SIZE}
          </Text>
        ),
      }),
      columnHelper.accessor("loanId", {
        header: "Loan No.",
        cell: ({ row }) => (
          <Select
            size="xs"
            placeholder="Search loan..."
            searchable
            nothingFoundMessage="No loans"
            data={getLoanOptions(row.original.loanId)}
            value={row.original.loanId || null}
            onChange={(val) => pickLoan(row.original.rowId, val)}
            styles={{
              input: {
                border: "1px solid transparent",
                backgroundColor: "#f9fafb",
                "&:focus-within": { border: "1px solid #e5e7eb", backgroundColor: "white" },
              },
            }}
          />
        ),
      }),
      columnHelper.accessor("applicant", {
        header: "Applicant",
        cell: (info) => (
          <Text fz="xs" c={info.getValue() ? "gray.7" : "gray.4"} className="truncate w-40">
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Group justify="flex-end" w="100%">
            {hasSelection ? (
              <ActionIcon size="sm" color="red" variant="subtle" onClick={removeSelected}>
                <IconTrash size={14} />
              </ActionIcon>
            ) : (
              <IconSettings size={14} className="text-gray-400" />
            )}
          </Group>
        ),
        cell: ({ row }) => (
          <Group justify="flex-end">
            <ActionIcon
              size="sm"
              color="gray"
              variant="subtle"
              onClick={() => removeRow(row.original.rowId)}
              className="hover:text-red-500"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ),
      }),
    ],
    [excludeIds, hasSelection, pagination.pageIndex]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { rowSelection, pagination },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (row) => row.rowId.toString(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="850px"
      withCloseButton={false}
      padding={0}
      radius="md"
    >
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconArrowsExchange size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                New Loan Transfer
              </Text>
              <Text size="xs" c="dimmed">
                Move selected loans from one branch to another.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={onClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Form Grid */}
          <div className="grid grid-cols-3 gap-5">
            <TextInput
              size="xs"
              withAsterisk
              type="date"
              label="Transfer Date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.currentTarget.value)}
              leftSection={<IconCalendar size={13} className="text-indigo-500" />}
              classNames={labelClass}
            />
            <Select
              size="xs"
              withAsterisk
              label="From Branch"
              placeholder="Select branch"
              data={BRANCH_OPTIONS}
              value={fromBranch}
              onChange={(v) => setFromBranch(v || "")}
              leftSection={<IconBuildingBank size={13} className="text-orange-500" />}
              classNames={labelClass}
            />
            <Select
              size="xs"
              withAsterisk
              label="To Branch"
              placeholder="Select branch"
              data={BRANCH_OPTIONS}
              value={toBranch}
              onChange={(v) => setToBranch(v || "")}
              leftSection={<IconBuildingBank size={13} className="text-emerald-500" />}
              classNames={labelClass}
            />
          </div>

          {/* Loans Table Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <Text size="xs" c="dimmed">
                  Select the accounts to include in this bulk transfer.
                </Text>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white">
              {/* FIXED HEIGHT CONTAINER optimized exactly for 5 compact rows */}
              <div className="h-[230px] flex flex-col overflow-y-auto">
                <Table verticalSpacing={4} horizontalSpacing="sm" className="w-full">
                  <Table.Thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Table.Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Table.Th
                            key={header.id}
                            className="text-gray-500 font-medium"
                            style={{
                              fontSize: 11,
                              padding: "6px 10px",
                              width: header.id === "select" ? 40 : header.id === "rowId" ? 50 : "auto",
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Thead>
                  <Table.Tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5}>
                          <div className="flex items-center justify-center py-10 text-gray-400 text-xs">
                            No loans added.
                          </div>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Table.Tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                          {row.getVisibleCells().map((cell) => (
                            <Table.Td key={cell.id} style={{ padding: "4px 10px" }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </div>

              {/* Table Footer / Pagination */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
                <Text size="xs" c="dimmed">
                  Total {rows.length} row{rows.length !== 1 ? "s" : ""}
                </Text>
                {table.getPageCount() > 1 && (
                  <Pagination
                    total={table.getPageCount()}
                    value={pagination.pageIndex + 1}
                    onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
                    color="indigo"
                    size="xs"
                    radius="sm"
                  />
                )}
              </div>
            </div>

            <Button
              variant="default"
              size="xs"
              mt="sm"
              leftSection={<IconPlus size={13} />}
              onClick={addRow}
            >
              Add Row
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0 bg-gray-50/50">
          <Button size="xs" variant="default" onClick={onClose} className="font-semibold px-5">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button size="xs" variant="subtle" color="red" onClick={handleReset} className="font-semibold px-4">
              Reset
            </Button>
            <Button
              size="xs"
              onClick={handleSubmit}
              disabled={!canSave}
              rightSection={<IconArrowRight size={14} />}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Transfer Loans
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}