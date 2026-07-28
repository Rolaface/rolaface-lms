// LoanRepayment.tsx
import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  Radio,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileOff,
  IconTrash,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { LoanPrepaymentModal, type LoanRepaymentFormData } from '../../../components/Modal/LoanPrepaymentModal';

interface RepaymentRow {
  id: number;
  loanAc: string;
  customer: string;
  loanType: string;
  natureOfPayment: 'PAY_DUES' | 'PARTIAL' | 'FULL_SETTLEMENT';
  amountPaid: number;
  paymentMode: string;
  valueDate: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

const DUMMY_REPAYMENTS: RepaymentRow[] = [
  {
    id: 1,
    loanAc: 'LNA-2025-001',
    customer: 'Yash Joshi',
    loanType: 'Vehicle Loan',
    natureOfPayment: 'PAY_DUES',
    amountPaid: 600.5,
    paymentMode: 'Direct Debit from A/C',
    valueDate: '2026-07-25',
    status: 'COMPLETED',
  },
  {
    id: 2,
    loanAc: 'LNA-2025-089',
    customer: 'Yash Joshi',
    loanType: 'Personal Loan',
    natureOfPayment: 'PARTIAL',
    amountPaid: 150,
    paymentMode: 'UPI',
    valueDate: '2026-07-22',
    status: 'COMPLETED',
  },
  {
    id: 3,
    loanAc: 'LNA-2025-014',
    customer: 'Meera Nair',
    loanType: 'Home Loan',
    natureOfPayment: 'FULL_SETTLEMENT',
    amountPaid: 284300,
    paymentMode: 'NEFT/RTGS',
    valueDate: '2026-07-19',
    status: 'PENDING',
  },
  {
    id: 4,
    loanAc: 'LNA-2025-032',
    customer: 'Arjun Kapoor',
    loanType: 'Vehicle Loan',
    natureOfPayment: 'PAY_DUES',
    amountPaid: 475.25,
    paymentMode: 'Cheque',
    valueDate: '2026-07-10',
    status: 'FAILED',
  },
];

const columnHelper = createColumnHelper<RepaymentRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

function natureColor(nature: RepaymentRow['natureOfPayment']) {
  if (nature === 'PAY_DUES') return 'brand';
  if (nature === 'PARTIAL') return 'gold';
  return 'accent';
}

function natureLabel(nature: RepaymentRow['natureOfPayment']) {
  if (nature === 'PAY_DUES') return 'Pay Dues';
  if (nature === 'PARTIAL') return 'Partially Pay Off';
  return 'Full Settlement';
}

function statusColor(status: RepaymentRow['status']) {
  if (status === 'COMPLETED') return 'green';
  if (status === 'PENDING') return 'gold';
  return 'danger';
}

export function LoanPrepayment() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [loanType, setLoanType] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState(DUMMY_REPAYMENTS);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch =
        !q ||
        r.customer.toLowerCase().includes(q) ||
        r.loanAc.toLowerCase().includes(q);
      const matchesLoanType = !loanType || r.loanType === loanType;
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesLoanType && matchesStatus;
    });
  }, [rowsData, search, loanType, status]);

  const handleDelete = (id: number) => {
    setRowsData((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRepayment = (formData: LoanRepaymentFormData) => {
    setRowsData((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        loanAc: formData.loanAc || '—',
        customer: formData.customerName || '—',
        loanType: formData.loanType || '—',
        natureOfPayment: formData.natureOfPayment,
        amountPaid: Number(formData.amountToPay) || 0,
        paymentMode: formData.paymentMode || '—',
        valueDate: formData.valueDate || '—',
        status: 'PENDING',
      },
    ]);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loanType', {
        header: 'Loan Type',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('natureOfPayment', {
        header: 'Nature of Payment',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={natureColor(info.getValue())}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {natureLabel(info.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor('amountPaid', {
        header: 'Amount Paid',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            ${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        ),
      }),
      columnHelper.accessor('paymentMode', {
        header: 'Payment Mode',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={statusColor(info.getValue())}
            className="font-semibold tracking-wider"
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray">
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon size="sm" variant="subtle" color="brand">
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="danger"
                  onClick={() => handleDelete(row.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = filteredData.length;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch('');
    setLoanType(null);
    setStatus('all');
  };

  const loanTypeOptions = Array.from(new Set(DUMMY_REPAYMENTS.map((r) => r.loanType)));

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanPrepaymentModal opened={opened} onClose={close} onSubmit={handleAddRepayment} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Prepayments
        </Title>
        <Button
          size="xs"
          onClick={open}
          className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          Process Prepayment
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Loan A/c / Customer"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[200px]"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Loan Types"
            data={loanTypeOptions}
            className="w-44"
            searchable
            clearable
            rightSection={chevronDown}
            value={loanType}
            onChange={(v) => {
              setLoanType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <Radio.Group
            name="status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <Group gap="sm">
              <Radio size="xs" value="all" label="All" color="brand" />
              <Radio size="xs" value="COMPLETED" label="Completed" color="brand" />
              <Radio size="xs" value="PENDING" label="Pending" color="brand" />
              <Radio size="xs" value="FAILED" label="Failed" color="brand" />
            </Group>
          </Radio.Group>

          <Button size="xs" variant="default" className="ml-auto px-4" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Paper>

      {/* Data Table */}
      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      className={`text-gray-600 font-semibold select-none ${
                        canSort ? 'cursor-pointer' : ''
                      }`}
                      style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Group
                        gap={4}
                        wrap="nowrap"
                        justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon sorted={header.column.getIsSorted()} />}
                      </Group>
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <IconFileOff size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No repayments match your filters.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} style={{ padding: '5px 10px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                rightSection={chevronDown}
                size="xs"
                className="w-14"
              />
            </div>
          </div>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="brand"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>
    </Box>
  );
}