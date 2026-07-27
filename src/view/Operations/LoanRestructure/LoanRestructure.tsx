// LoanRestructure.tsx
import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Menu,
} from '@mantine/core';
import {
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileOff,
  IconTrash,
  IconPercentage,
  IconCirclePlus,
  IconCalendarStats,
  IconListDetails,
  IconCircleCheck,
  IconClockHour4,
  IconCircleX,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconAdjustments,
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

function restructureTypeMeta(type: RestructureRow['restructureType']) {
  if (type === 'RATE_CHANGE')
    return {
      label: 'Rate Change',
      color: 'brand',
      icon: <IconPercentage size={17} />,
      iconBg: 'bg-[#eef2ff]',
      iconColor: 'text-[#4F46E5]',
      pillBg: 'bg-[#eef2ff]',
      pillText: 'text-[#4F46E5]',
      ring: 'ring-[#e0e7ff]',
    };
  if (type === 'TOPUP')
    return {
      label: 'Topup',
      color: 'green',
      icon: <IconCirclePlus size={17} />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      pillBg: 'bg-emerald-50',
      pillText: 'text-emerald-700',
      ring: 'ring-emerald-100',
    };
  return {
    label: 'Modify Maturity',
    color: 'gold',
    icon: <IconCalendarStats size={17} />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    pillBg: 'bg-amber-50',
    pillText: 'text-amber-700',
    ring: 'ring-amber-100',
  };
}

function statusMeta(status: RestructureRow['status']) {
  if (status === 'APPROVED') return { color: 'green', label: 'Approved', dot: '#22c55e', text: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (status === 'PENDING') return { color: 'gold', label: 'Pending', dot: '#eab308', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { color: 'danger', label: 'Rejected', dot: '#ef4444', text: 'text-red-700', bg: 'bg-red-50' };
}

function Sparkline({ color, points }: { color: string; points: string }) {
  return (
    <svg viewBox="0 0 80 32" width="52" height="22" fill="none" className="shrink-0">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoanRestructure() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [restructureType, setRestructureType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // table state
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState(DUMMY_RESTRUCTURES);

  const stats = useMemo(() => {
    return {
      total: rowsData.length,
      approved: rowsData.filter((r) => r.status === 'APPROVED').length,
      pending: rowsData.filter((r) => r.status === 'PENDING').length,
      rejected: rowsData.filter((r) => r.status === 'REJECTED').length,
    };
  }, [rowsData]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch =
        !q ||
        r.customer.toLowerCase().includes(q) ||
        r.loanAc.toLowerCase().includes(q);
      const matchesType = !restructureType || r.restructureType === restructureType;
      const matchesStatus = !status || r.status === status;
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
      columnHelper.display({
        id: 'index',
        header: '#',
        cell: (info) => (
          <Text fz="xs" c="gray.5" fw={500}>
            {info.row.index + 1}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => {
          const row = info.row.original;
          const initials = row.customer
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          const palette = [
            { bg: 'bg-indigo-50', text: 'text-indigo-600' },
            { bg: 'bg-rose-50', text: 'text-rose-600' },
            { bg: 'bg-teal-50', text: 'text-teal-600' },
            { bg: 'bg-amber-50', text: 'text-amber-600' },
            { bg: 'bg-sky-50', text: 'text-sky-600' },
            { bg: 'bg-violet-50', text: 'text-violet-600' },
          ];
          const hash = row.customer
            .split('')
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          const { bg, text } = palette[hash % palette.length];
          return (
            <Group gap={11} wrap="nowrap">
              <div
                className={`w-9 h-9 rounded-full ${bg} ${text} flex items-center justify-center shrink-0 text-[12px] font-semibold`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <Text fz="sm" fw={600} c="gray.9" truncate>
                  {row.customer}
                </Text>
                <Text fz={11} c="dimmed" truncate>
                  {row.loanType}
                </Text>
              </div>
            </Group>
          );
        },
      }),
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <span className="inline-block rounded-md bg-gray-50 px-2 py-1 text-[11px] font-mono font-semibold text-gray-600">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('restructureType', {
        header: 'Restructure Type',
        cell: (info) => {
          const meta = restructureTypeMeta(info.getValue());
          return (
            <span className={`inline-flex items-center rounded-full ${meta.pillBg} ${meta.pillText} px-2.5 py-1 text-[11px] font-semibold`}>
              {meta.label}
            </span>
          );
        },
      }),
      columnHelper.accessor('reason', {
        header: 'Reason',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('totalCharges', {
        header: 'Charges',
        cell: (info) => (
          <Text
            fz="sm"
            fw={700}
            c="#4F46E5"
            className="font-mono text-right"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            ${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const meta = statusMeta(info.getValue());
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full ${meta.bg} px-2.5 py-1`}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
              <Text fz={11} fw={600} className={meta.text}>
                {meta.label}
              </Text>
            </span>
          );
        },
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
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
            <Group justify="flex-end">
              <Menu shadow="md" width={160} position="bottom-end" withArrow>
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    radius="md"
                    className="opacity-50 group-hover:opacity-100 transition-opacity"
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconEye size={14} />}>View</Menu.Item>
                  <Menu.Item leftSection={<IconPencil size={14} />}>Edit</Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="danger"
                    onClick={() => handleDelete(row.id)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
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
    setStatus(null);
  };

  const restructureTypeOptions = [
    { value: 'RATE_CHANGE', label: 'Rate Change' },
    { value: 'TOPUP', label: 'Topup' },
    { value: 'MODIFY_MATURITY', label: 'Modify Maturity' },
  ];

  const statusOptions = [
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <LoanRestructureModal opened={opened} onClose={close} onSubmit={handleAddRestructure} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <Text size="xl" fw={800} className="text-gray-900">
            Loan Restructures
          </Text>
          <Text size="sm" c="dimmed" className="mt-0.5">
            Track and manage restructure requests across all loan accounts
          </Text>
        </div>
        <Button
          onClick={open}
          radius="md"
          className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={16} />}
        >
          Restructure Loan
        </Button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-[#eef2ff] to-white px-4 py-3.5">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={10} wrap="nowrap">
              <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                <IconListDetails size={16} className="text-[#4F46E5]" />
              </div>
              <div className="min-w-0">
                <Text fz={11} c="dimmed" fw={500} truncate>
                  Total Requests
                </Text>
                <Text fz={20} fw={800} c="gray.9" className="leading-tight">
                  {stats.total}
                </Text>
              </div>
            </Group>
            <Sparkline color="#4F46E5" points="0,24 12,20 24,22 36,12 48,16 60,6 72,10" />
          </Group>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-4 py-3.5">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={10} wrap="nowrap">
              <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                <IconCircleCheck size={16} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <Text fz={11} c="dimmed" fw={500} truncate>
                  Approved
                </Text>
                <Text fz={20} fw={800} c="gray.9" className="leading-tight">
                  {stats.approved}
                </Text>
              </div>
            </Group>
            <Sparkline color="#059669" points="0,20 12,22 24,14 36,18 48,8 60,12 72,4" />
          </Group>
        </div>

        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-4 py-3.5">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={10} wrap="nowrap">
              <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                <IconClockHour4 size={16} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <Text fz={11} c="dimmed" fw={500} truncate>
                  Pending
                </Text>
                <Text fz={20} fw={800} c="gray.9" className="leading-tight">
                  {stats.pending}
                </Text>
              </div>
            </Group>
            <Sparkline color="#d97706" points="0,10 12,14 24,8 36,18 48,14 60,22 72,18" />
          </Group>
        </div>

        <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white px-4 py-3.5">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={10} wrap="nowrap">
              <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                <IconCircleX size={16} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <Text fz={11} c="dimmed" fw={500} truncate>
                  Rejected
                </Text>
                <Text fz={20} fw={800} c="gray.9" className="leading-tight">
                  {stats.rejected}
                </Text>
              </div>
            </Group>
            <Sparkline color="#dc2626" points="0,8 12,12 24,10 36,16 48,14 60,20 72,24" />
          </Group>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <TextInput
          size="sm"
          radius="md"
          placeholder="Search by customer name or loan A/c..."
          leftSection={<IconSearch size={15} className="text-gray-400" />}
          className="flex-1 min-w-[260px]"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />
        <Select
          size="sm"
          radius="md"
          placeholder="All Restructure Types"
          data={restructureTypeOptions}
          className="w-52"
          clearable
          rightSection={chevronDown}
          value={restructureType}
          onChange={(v) => {
            setRestructureType(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />
        <Select
          size="sm"
          radius="md"
          placeholder="All Status"
          data={statusOptions}
          className="w-40"
          clearable
          rightSection={chevronDown}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />
        <Button
          size="sm"
          radius="md"
          variant="default"
          leftSection={<IconAdjustments size={15} />}
          onClick={resetFilters}
        >
          Reset Filters
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Table verticalSpacing="md" horizontalSpacing="lg" fz="sm" className="w-full" highlightOnHover={false}>
          <Table.Thead className="bg-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id} className="border-b border-gray-100">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      className={`text-gray-400 font-semibold uppercase select-none ${
                        canSort ? 'cursor-pointer hover:text-gray-600' : ''
                      }`}
                      style={{ fontSize: 10.5, letterSpacing: '0.04em', paddingTop: 14, paddingBottom: 14 }}
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
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                      <IconFileOff size={22} className="opacity-60" />
                    </div>
                    <Text ta="center" c="dimmed" fz="sm" fw={500}>
                      No restructure requests match your filters.
                    </Text>
                    <Button size="xs" variant="subtle" color="brand" radius="md" className="mt-2" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-[#fafaff] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} className="py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              {totalRows === 0
                ? 'Showing 0 of 0 requests'
                : `Showing ${firstRow} to ${lastRow} of ${totalRows} requests`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                rightSection={chevronDown}
                size="xs"
                radius="md"
                className="w-16"
              />
            </div>
          </div>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="brand"
            size="sm"
            radius="md"
          />
        </div>
      </div>
    </Box>
  );
}