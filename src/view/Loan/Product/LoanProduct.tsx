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
  Switch,
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
import { LoanProductModal } from '../../../components/Modal/LoanProductModal';

// NOTE: requires `@tanstack/react-table` — install with:
//   npm install @tanstack/react-table

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Personal Loan', code: 'PL_001', category: 'Retail', rate: 10.5, status: 'ACTIVE' },
  { id: 2, name: 'Home Loan', code: 'HL_001', category: 'Mortgage', rate: 8.5, status: 'ACTIVE' },
  { id: 3, name: 'Auto Loan', code: 'AL_001', category: 'Retail', rate: 9.0, status: 'INACTIVE' },
  { id: 4, name: 'Business Loan', code: 'BL_001', category: 'Corporate', rate: 11.25, status: 'ACTIVE' },
  { id: 5, name: 'Education Loan', code: 'EL_001', category: 'Retail', rate: 7.75, status: 'ACTIVE' },
  { id: 6, name: 'Overdraft Facility', code: 'OD_001', category: 'Corporate', rate: 12.0, status: 'INACTIVE' },
  { id: 7, name: 'Gold Loan', code: 'GL_001', category: 'Retail', rate: 8.0, status: 'ACTIVE' },
];

const columnHelper = createColumnHelper();

function SortIcon({ sorted }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

// Reusable chevron-down affordance for searchable selects
const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanProduct() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [type, setType] = useState(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // local status map so the switch can optimistically update without a backend
  const [statusOverrides, setStatusOverrides] = useState({});

  const data = useMemo(
    () =>
      DUMMY_PRODUCTS.map((p) => ({
        ...p,
        status: statusOverrides[p.id] ?? p.status,
      })),
    [statusOverrides]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const matchesCategory = !category || p.category === category;
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && p.status === 'ACTIVE') ||
        (status === 'inactive' && p.status === 'INACTIVE');
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, search, category, status]);

  const toggleStatus = (id, currentStatus) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [id]: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    }));
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Product Name',
        cell: (info) => (
          <Text fz="xs" fw={500} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('rate', {
        header: 'Base Rate',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue().toFixed(2)}%
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={info.getValue() === 'ACTIVE' ? 'green' : 'red'}
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
                <ActionIcon size="sm" variant="subtle" color="blue">
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} withArrow>
                <Switch
                  size="xs"
                  color="green"
                  checked={row.status === 'ACTIVE'}
                  onChange={() => toggleStatus(row.id, row.status)}
                />
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
    setCategory(null);
    setType(null);
    setStatus('all');
  };

  return (
    <Box className="flex flex-col gap-4">
      {/* The newly integrated Modal Component */}
      <LoanProductModal opened={opened} onClose={close} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Text size="md" fw={700} className="text-gray-900">
          Loan Products
        </Text>
        <Button
          size="xs"
          color="red"
          onClick={open}
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={14} />}
        >
          Add Product
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Product Name / Code"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[180px]"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Categories"
            data={['Retail', 'Mortgage', 'Corporate']}
            className="w-36"
            searchable
            clearable
            rightSection={chevronDown}
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Types"
            data={['Term Loan', 'Overdraft']}
            className="w-36"
            searchable
            clearable
            rightSection={chevronDown}
            value={type}
            onChange={setType}
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
              <Radio size="xs" value="active" label="Active" color="red" />
              <Radio size="xs" value="inactive" label="Inactive" color="red" />
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
                  <Text ta="center" c="dimmed" fz="xs" py="sm">
                    No products match your filters.
                  </Text>
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