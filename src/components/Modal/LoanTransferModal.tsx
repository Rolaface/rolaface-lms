import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  TextInput,
  Select,
  Modal,
  Table,
  ActionIcon,
  Group,
  ThemeIcon,
} from '@mantine/core';
import {
  IconX,
  IconCalendar,
  IconBuildingBank,
  IconTrash,
  IconArrowsExchange,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { ModalFooter } from '../shared/ModalFooter';

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
  { id: 'ACC-LOAN-2026-00001', applicant: 'Mwansa Chileshe' },
  { id: 'ACC-LOAN-2026-00002', applicant: 'Bwalya Mutale' },
  { id: 'ACC-LOAN-2026-00003', applicant: 'Chanda Phiri' },
  { id: 'ACC-LOAN-2026-00004', applicant: 'Natasha Banda' },
  { id: 'ACC-LOAN-2026-00005', applicant: 'Kelvin Zulu' },
  { id: 'ACC-LOAN-2026-00006', applicant: 'Precious Mumba' },
  { id: 'ACC-LOAN-2026-00007', applicant: 'Given Tembo' },
  { id: 'ACC-LOAN-2026-00008', applicant: 'Sarah Lungu' },
  { id: 'ACC-LOAN-2026-00009', applicant: 'Douglas Kunda' },
  { id: 'ACC-LOAN-2026-00010', applicant: 'Ruth Sakala' },
];

const BRANCH_OPTIONS = ['Lusaka Main', 'Ndola', 'Kitwe', 'Livingstone'];
const PAGE_SIZE = 5;

const labelClass = { label: 'text-sm font-medium text-gray-700 mb-1' };

type TransferRow = { rowId: number; loanId: string; applicant: string };

const columnHelper = createColumnHelper<TransferRow>();

export function LoanTransferModal({ opened, onClose, onSubmit }: LoanTransferModalProps) {
  const [transferDate, setTransferDate] = useState('2026-07-28');
  const [fromBranch, setFromBranch] = useState('');
  const [toBranch, setToBranch] = useState('');

  const [rows, setRows] = useState<TransferRow[]>([
    { rowId: 1, loanId: 'ACC-LOAN-2026-00001', applicant: 'Mwansa Chileshe' },
  ]);
  const [rowSeq, setRowSeq] = useState(2);

  // ChargesTab-style pagination (simple page state, 1-indexed)
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const excludeIds = rows.map((r) => r.loanId).filter(Boolean);

  const addRow = () => {
    const newRow = { rowId: rowSeq, loanId: '', applicant: '' };
    setRowSeq((prev) => prev + 1);
    const nextRows = [...rows, newRow];
    setRows(nextRows);
    const nextTotalPages = Math.max(1, Math.ceil(nextRows.length / PAGE_SIZE));
    setPage(nextTotalPages);
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
  };

  const handleSubmit = () => {
    const filledRows = rows.filter((r) => r.loanId);
    onSubmit?.({ transferDate, fromBranch, toBranch, loans: filledRows });
    onClose();
  };

  const filledRows = rows.filter((r) => r.loanId);
  const canSave = transferDate && fromBranch && toBranch && filledRows.length > 0;

  const getLoanOptions = (currentRowLoanId: string) =>
    LOAN_BOOK.filter((l) => !excludeIds.includes(l.id) || l.id === currentRowLoanId).map((l) => ({
      value: l.id,
      label: `${l.id} — ${l.applicant}`,
    }));

  // Only the rows for the current page are given to the table
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('rowId', {
        header: 'No.',
        cell: (info) => (
          <Text fz="xs" c="dimmed">
            {info.row.index + 1 + (page - 1) * PAGE_SIZE}
          </Text>
        ),
      }),
      columnHelper.accessor('loanId', {
        header: 'Loan No.',
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
                border: '1px solid var(--mantine-color-slate-2)',
                backgroundColor: 'var(--mantine-color-white)',
              },
            }}
          />
        ),
      }),
      columnHelper.accessor('applicant', {
        header: 'Applicant',
        cell: (info) => (
          <Text fz="xs" c={info.getValue() ? 'gray.7' : 'gray.4'} className="truncate w-28">
            {info.getValue() || '—'}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => null,
        cell: ({ row }) => (
          <Group justify="flex-end">
            <ActionIcon
              size="sm"
              color="slate"
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
    [excludeIds, page]
  );

  const table = useReactTable({
    data: paginatedRows,
    columns,
    getRowId: (row) => row.rowId.toString(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="850px"
      padding={0}
      lockScroll
      styles={{
        content: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: { display: 'none', padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
      }}
    >
      <Box bg="white" className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: '1px solid var(--mantine-color-brand-7)' }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconArrowsExchange size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: '-0.01em' }}>
                New Loan Transfer
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Move selected loans from one branch to another.
              </Text>
            </Box>
          </Group>
          <ActionIcon
            variant="subtle"
            color="white"
            radius="xl"
            size="md"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        {/* Body */}
        <Box className="flex-1 overflow-y-auto" px="xl" py="lg" bg="slate.0">
          <div className="space-y-5">
            {/* Top Form Grid — Transfer Date narrower, branches take remaining space */}
            <div className="grid grid-cols-[200px_1fr_1fr] gap-10">
              <TextInput
                size="xs"
                withAsterisk
                type="date"
                label="Transfer Date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.currentTarget.value)}
                leftSection={<IconCalendar size={13} className="text-indigo-500" />}
                classNames={labelClass}
                styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              />
              <Select
                size="xs"
                withAsterisk
                label="From Branch"
                placeholder="Select branch"
                data={BRANCH_OPTIONS}
                value={fromBranch}
                onChange={(v) => setFromBranch(v || '')}
                classNames={labelClass}
                styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              />
              <Select
                size="xs"
                withAsterisk
                label="To Branch"
                placeholder="Select branch"
                data={BRANCH_OPTIONS}
                value={toBranch}
                onChange={(v) => setToBranch(v || '')}
                classNames={labelClass}
                styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              />
            </div>

            {/* Loans Table Section */}
            <div>
              <Text size="xs" c="dimmed" mb={8}>
                Select the accounts to include in this bulk transfer.
              </Text>

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
                              className="text-gray-500 font-medium "
                              style={{
                                fontSize: 11,
                                padding: '6px 10px',
                                width:
                                  header.id === 'rowId'
                                    ? 36
                                    : header.id === 'actions'
                                    ? 32
                                    : header.id === 'loanId'
                                    ? '38%'
                                    : 'auto',
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
                          <Table.Td colSpan={4}>
                            <div className="flex items-center justify-center py-10 text-gray-400 text-xs">
                              No loans added.
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <Table.Tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                            {row.getVisibleCells().map((cell) => (
                              <Table.Td key={cell.id} style={{ padding: '4px 10px' }}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </Table.Td>
                            ))}
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </div>

                {/* Table Footer / Pagination — same style as ChargesTab */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
                  <Text size="xs" c="dimmed">
                    Total {rows.length} row{rows.length !== 1 ? 's' : ''}
                  </Text>

                  {rows.length > PAGE_SIZE && (
                    <Group gap="xs">
                      <Text size="xs" c="slate.5">
                        Page {page} of {totalPages}
                      </Text>
                      <ActionIcon
                        variant="default"
                        size="sm"
                        radius="md"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <IconChevronLeft size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="default"
                        size="sm"
                        radius="md"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        <IconChevronRight size={14} />
                      </ActionIcon>
                    </Group>
                  )}
                </div>
              </div>

              <Button variant="default" size="xs" mt="sm" leftSection={<IconPlus size={13} />} onClick={addRow}>
                Add Row
              </Button>
            </div>
          </div>
        </Box>

        {/* Footer */}
        <ModalFooter
          variant="theme"
          isViewMode={false}
          onClose={onClose}
          onSubmit={handleSubmit}
          submitLabel="Save"
          submitDisabled={!canSave}
        />
      </Box>
    </Modal>
  );
}