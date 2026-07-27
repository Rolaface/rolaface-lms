// LoanRestructure.tsx
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
import { LoanRestructureModal, type RestructureFormData } from '../../../components/Modal/LoanRestructureModal';

interface RestructureRow {
  id: number;
  loanAc: string;
  customer: string;
  loanType: string;
  restructureType: 'RATE_CHANGE' | 'TOPUP' | 'MODIFY_MATURITY';
  reason: string;
  valueDate: string;
  totalCharges: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const DUMMY_RESTRUCTURES: RestructureRow[] = [
  {
    id: 1,
    loanAc: 'LNA-2025-001',
    customer: 'Yash Joshi',
    loanType: 'Vehicle Loan',
    restructureType: 'RATE_CHANGE',
    reason: 'Rate Renegotiation',
    valueDate: '2026-07-20',
    totalCharges: 4250,
    status: 'PENDING',
  },
  {
    id: 2,
    loanAc: 'LNA-2025-032',
    customer: 'Arjun Kapoor',
    loanType: 'Vehicle Loan',
    restructureType: 'TOPUP',
    reason: 'Financial Hardship',
    valueDate: '2026-07-14',
    totalCharges: 3750,
    status: 'APPROVED',
  },
  {
    id: 3,
    loanAc: 'LNA-2025-014',
    customer: 'Meera Nair',
    loanType: 'Home Loan',
    restructureType: 'MODIFY_MATURITY',
    reason: 'Loan Consolidation',
    valueDate: '2026-07-05',
    totalCharges: 2000,
    status: 'REJECTED',
  },
  {
    id: 4,
    loanAc: 'LNA-2025-071',
    customer: 'Rohan Mehta',
    loanType: 'Vehicle Loan',
    restructureType: 'RATE_CHANGE',
    reason: 'Collateral Revaluation',
    valueDate: '2026-06-28',
    totalCharges: 4250,
    status: 'APPROVED',
  },
];

const columnHelper = createColumnHelper<RestructureRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

function restructureTypeColor(type: RestructureRow['restructureType']) {
  if (type === 'RATE_CHANGE') return 'brand';
  if (type === 'TOPUP') return 'gold';
  return 'accent';
}

function restructureTypeLabel(type: RestructureRow['restructureType']) {
  if (type === 'RATE_CHANGE') return 'Rate Change';
  if (type === 'TOPUP') return 'Topup';
  return 'Modify Maturity';
}

function statusColor(status: RestructureRow['status']) {
  if (status === 'APPROVED') return 'green';
  if (status === 'PENDING') return 'gold';
  return 'danger';
}

export function LoanRestructure() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [restructureType, setRestructureType] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState(DUMMY_RESTRUCTURES);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch =
        !q ||
        r.customer.toLowerCase().includes(q) ||
        r.loanAc.toLowerCase().includes(q);
      const matchesType = !restructureType || r.restructureType === restructureType;
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rowsData, search, restructureType, status]);

  const handleDelete = (id: number) => {
    setRowsData((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRestructure = (formData: RestructureFormData) => {
    setRowsData((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        loanAc: formData.loanAc || '—',
        customer: formData.customerName || '—',
        loanType: formData.loanType || '—',
        restructureType: formData.restructureType,
        reason: formData.reason || '—',
        valueDate: formData.valueDate || '—',
        totalCharges: formData.totalCharges || 0,
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
      columnHelper.accessor('restructureType', {
        header: 'Restructure Type',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={restructureTypeColor(info.getValue())}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {restructureTypeLabel(info.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor('reason', {
        header: 'Reason',
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
      columnHelper.accessor('totalCharges', {
        header: 'Charges',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            ${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
    setRestructureType(null);
    setStatus('all');
  };

  const restructureTypeOptions = [
    { value: 'RATE_CHANGE', label: 'Rate Change' },
    { value: 'TOPUP', label: 'Topup' },
    { value: 'MODIFY_MATURITY', label: 'Modify Maturity' },
  ];

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanRestructureModal opened={opened} onClose={close} onSubmit={handleAddRestructure} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
         <Title order={2} className="text-gray-900 font-semibold">
          Loan Restructures
        </Title>
        <Button
          size="xs"
          onClick={open}
          className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          Restructure Loan
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
            placeholder="All Restructure Types"
            data={restructureTypeOptions}
            className="w-48"
            clearable
            rightSection={chevronDown}
            value={restructureType}
            onChange={(v) => {
              setRestructureType(v);
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
              <Radio size="xs" value="APPROVED" label="Approved" color="brand" />
              <Radio size="xs" value="PENDING" label="Pending" color="brand" />
              <Radio size="xs" value="REJECTED" label="Rejected" color="brand" />
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
                      No restructure requests match your filters.
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