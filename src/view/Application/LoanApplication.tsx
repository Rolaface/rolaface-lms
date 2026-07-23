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
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileText,
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
import { LoanApplicationModal } from '../../components/Modal/LoanApplicationModal';

// NOTE: requires `@tanstack/react-table` — install with:
//   npm install @tanstack/react-table

const DUMMY_APPLICATIONS = [
  {
    id: 1,
    appNo: 'APP-2026-004821',
    customer: 'Chanda Mwansa',
    product: 'SME Business Growth Loan',
    branch: 'Lusaka Main Branch',
    amount: 850000,
    rate: 15.5,
    status: 'DRAFT',
    appliedDate: '2026-07-20',
  },
  {
    id: 2,
    appNo: 'APP-2026-004798',
    customer: 'Bwalya Enterprises Ltd',
    product: 'Asset Finance — Commercial Vehicle',
    branch: 'Ndola Corporate Branch',
    amount: 2400000,
    rate: 17.0,
    status: 'PENDING_APPROVAL',
    appliedDate: '2026-07-18',
  },
  {
    id: 3,
    appNo: 'APP-2026-004780',
    customer: 'Natasha Phiri',
    product: 'Personal Salary Advance',
    branch: 'Kitwe Business Branch',
    amount: 45000,
    rate: 12.0,
    status: 'APPROVED',
    appliedDate: '2026-07-15',
  },
  {
    id: 4,
    appNo: 'APP-2026-004755',
    customer: 'Mutale Chileshe',
    product: 'Agri-Business Seasonal Loan',
    branch: 'Livingstone Branch',
    amount: 620000,
    rate: 14.0,
    status: 'DISBURSED',
    appliedDate: '2026-07-10',
  },
  {
    id: 5,
    appNo: 'APP-2026-004732',
    customer: 'Joseph Tembo',
    product: 'Personal Salary Advance',
    branch: 'Lusaka Main Branch',
    amount: 30000,
    rate: 13.0,
    status: 'REJECTED',
    appliedDate: '2026-07-08',
  },
  {
    id: 6,
    appNo: 'APP-2026-004710',
    customer: 'Bwalya Enterprises Ltd',
    product: 'SME Business Growth Loan',
    branch: 'Ndola Corporate Branch',
    amount: 1250000,
    rate: 16.5,
    status: 'APPROVED',
    appliedDate: '2026-07-05',
  },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'DRAFT', color: 'gray' },
  PENDING_APPROVAL: { label: 'PENDING APPROVAL', color: 'yellow' },
  APPROVED: { label: 'APPROVED', color: 'blue' },
  DISBURSED: { label: 'DISBURSED', color: 'green' },
  REJECTED: { label: 'REJECTED', color: 'red' },
};

const columnHelper = createColumnHelper();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

const fmtAmount = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function LoanApplication() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'appliedDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const data = useMemo(() => DUMMY_APPLICATIONS, []);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((a) => {
      const matchesSearch =
        !q ||
        a.appNo.toLowerCase().includes(q) ||
        a.customer.toLowerCase().includes(q);
      const matchesProduct = !product || a.product === product;
      const matchesBranch = !branch || a.branch === branch;
      const matchesStatus = status === 'all' || a.status === status;
      return matchesSearch && matchesProduct && matchesBranch && matchesStatus;
    });
  }, [data, search, product, branch, status]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('appNo', {
        header: 'Application No.',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="xs" fw={500} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('product', {
        header: 'Loan Product',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('branch', {
        header: 'Branch',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <Text fz="xs" c="gray.6" className="font-mono">
            ZMW {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('rate', {
        header: 'Rate',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue().toFixed(2)}%
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('appliedDate', {
        header: 'Applied On',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || { label: info.getValue(), color: 'gray' };
          return (
            <Badge
              variant="light"
              size="sm"
              color={meta.color}
              className="font-semibold tracking-wider"
              styles={{ root: { fontSize: 10, padding: '0 8px' } }}
            >
              {meta.label}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: () => (
          <Group justify="flex-end" gap={6} wrap="nowrap">
            <Tooltip label="View" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray">
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="blue">
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
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
    setProduct(null);
    setBranch(null);
    setStatus('all');
  };

  const productOptions = Array.from(new Set(DUMMY_APPLICATIONS.map((a) => a.product)));
  const branchOptions = Array.from(new Set(DUMMY_APPLICATIONS.map((a) => a.branch)));

  return (
    <Box className="flex flex-col gap-4">
      <LoanApplicationModal opened={opened} onClose={close} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Text size="md" fw={700} className="text-gray-900">
          Loan Applications
        </Text>
        <Button
          size="xs"
          color="red"
          onClick={open}
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={14} />}
        >
          New Application
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Application No. / Customer"
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
            placeholder="All Products"
            data={productOptions}
            className="w-52"
            searchable
            clearable
            rightSection={chevronDown}
            value={product}
            onChange={(v) => {
              setProduct(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Branches"
            data={branchOptions}
            className="w-44"
            searchable
            clearable
            rightSection={chevronDown}
            value={branch}
            onChange={(v) => {
              setBranch(v);
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
              <Radio size="xs" value="all" label="All" color="red" />
              <Radio size="xs" value="DRAFT" label="Draft" color="red" />
              <Radio size="xs" value="PENDING_APPROVAL" label="Pending" color="red" />
              <Radio size="xs" value="APPROVED" label="Approved" color="red" />
              <Radio size="xs" value="DISBURSED" label="Disbursed" color="red" />
              <Radio size="xs" value="REJECTED" label="Rejected" color="red" />
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
                    <IconFileText size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No applications match your filters.
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
            color="red"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>
    </Box>
  );
}