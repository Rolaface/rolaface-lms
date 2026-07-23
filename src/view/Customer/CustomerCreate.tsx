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
  IconUsers,
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
import { CustomerModal } from '../../components/Modal/CustomerModal';

// NOTE: requires `@tanstack/react-table` — install with:
//   npm install @tanstack/react-table

const DUMMY_CUSTOMERS = [
  {
    id: 1,
    name: 'Rola -di acono',
    type: 'Company',
    contact: 'Marco Rossi',
    email: 'marco.rossi@rolaco.com',
    mobile: '+39 331 220 4410',
    city: 'Milan',
    country: 'Italy',
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'Chanda Mwansa',
    type: 'Individual',
    contact: 'Chanda Mwansa',
    email: 'c.mwansa@mailbox.zm',
    mobile: '+260 97 712 3344',
    city: 'Lusaka',
    country: 'Zambia',
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'Bwalya Enterprises Ltd',
    type: 'Company',
    contact: 'Bwalya Mutale',
    email: 'info@bwalyaent.co.zm',
    mobile: '+260 96 550 2210',
    city: 'Ndola',
    country: 'Zambia',
    status: 'INACTIVE',
  },
  {
    id: 4,
    name: 'Natasha Phiri',
    type: 'Individual',
    contact: 'Natasha Phiri',
    email: 'n.phiri@mailbox.zm',
    mobile: '+260 95 330 8871',
    city: 'Kitwe',
    country: 'Zambia',
    status: 'ACTIVE',
  },
  {
    id: 5,
    name: 'Harborview Logistics',
    type: 'Company',
    contact: 'Sarah Nkonde',
    email: 's.nkonde@harborview.co',
    mobile: '+260 97 118 8820',
    city: 'Livingstone',
    country: 'Zambia',
    status: 'ACTIVE',
  },
];

const columnHelper = createColumnHelper();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function Customer() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // local status map so the row can optimistically update without a backend
  const [statusOverrides, setStatusOverrides] = useState<Record<number, string>>({});
  const [customers, setCustomers] = useState(DUMMY_CUSTOMERS);

  const data = useMemo(
    () =>
      customers.map((c) => ({
        ...c,
        status: statusOverrides[c.id] ?? c.status,
      })),
    [customers, statusOverrides]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q);
      const matchesType = !type || c.type === type;
      const matchesCountry = !country || c.country === country;
      const matchesStatus = status === 'all' || c.status === status;
      return matchesSearch && matchesType && matchesCountry && matchesStatus;
    });
  }, [data, search, type, country, status]);

  const handleDelete = (id: number) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Customer Name',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={info.getValue() === 'Company' ? 'indigo' : 'cyan'}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('contact', {
        header: 'Primary Contact',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('mobile', {
        header: 'Mobile',
        cell: (info) => (
          <Text fz="xs" c="gray.6" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('city', {
        header: 'City',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('country', {
        header: 'Country',
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
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
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
    setType(null);
    setCountry(null);
    setStatus('all');
  };

  const countryOptions = Array.from(new Set(DUMMY_CUSTOMERS.map((c) => c.country)));

  return (
    <Box className="flex flex-col gap-4">
      <CustomerModal opened={opened} onClose={close} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Text size="md" fw={700} className="text-gray-900">
          Customers
        </Text>
        <Button
          size="xs"
          bg="indigoAlt.4"
          onClick={open}
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={14} />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Name / Email / Mobile"
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
            placeholder="All Types"
            data={['Individual', 'Company']}
            className="w-36"
            searchable
            clearable
            rightSection={chevronDown}
            value={type}
            onChange={(v) => {
              setType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Countries"
            data={countryOptions}
            className="w-40"
            searchable
            clearable
            rightSection={chevronDown}
            value={country}
            onChange={(v) => {
              setCountry(v);
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
              <Radio size="xs" value="all" label="All" color="indigoAlt.4" />
              <Radio size="xs" value="ACTIVE" label="Active" color="indigoAlt.4" />
              <Radio size="xs" value="INACTIVE" label="Inactive" color="indigoAlt.4" />
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
                    <IconUsers size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No customers match your filters.
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
            color="indigoAlt.4"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>
    </Box>
  );
}