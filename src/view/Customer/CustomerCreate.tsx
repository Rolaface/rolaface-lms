import { useEffect, useMemo, useState } from 'react';
import { Box, Button, TextInput, Select, Radio, Group, Paper, Table, Badge, ActionIcon, Text, Pagination, Tooltip, Title, Stack, Center } from '@mantine/core';
import { IconEye, IconPencil, IconPlus, IconChevronUp, IconChevronDown, IconSelector, IconSearch, IconUsers, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { CustomerModal } from '../../components/Modal/customer/CustomerModal';
import { getBorrowerProfile } from './mockdata';
import { Borrower360 } from './CustomerView';

export { getBorrowerProfile } from './mockdata';

interface CustomerRow {
  id: number;
  name: string;
  type: string;
  contact: string;
  email: string;
  mobile: string;
  city: string;
  country: string;
  status: string;
}

const DUMMY_CUSTOMERS: CustomerRow[] = [
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

const columnHelper = createColumnHelper<CustomerRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

// Dot + label status indicator — reads calmer than a solid-fill badge
// and matches the semantic `success` / `danger` tokens from the theme.
function StatusIndicator({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <Group gap="xs" wrap="nowrap">
      <Box
        w={6}
        h={6}
        style={{
          borderRadius: '50%',
          background: isActive ? 'var(--mantine-color-success-6)' : 'var(--mantine-color-danger-5)',
          flexShrink: 0,
        }}
      />
      <Text fz="xs" fw={600} c={isActive ? 'success.7' : 'danger.7'} style={{ letterSpacing: 0.3 }}>
        {status}
      </Text>
    </Group>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

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
  const [borrower360CustomerId, setBorrower360CustomerId] = useState<number | null>(null);

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

  useEffect(() => {
    if (borrower360CustomerId !== null && !customers.some((c) => c.id === borrower360CustomerId)) {
      setBorrower360CustomerId(null);
    }
  }, [borrower360CustomerId, customers]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Customer Name',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.8">
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
            color={info.getValue() === 'Company' ? 'brand' : 'info'}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('contact', {
        header: 'Primary Contact',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('mobile', {
        header: 'Mobile',
        cell: (info) => (
          <Text fz="xs" c="slate.6" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('city', {
        header: 'City',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('country', {
        header: 'Country',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusIndicator status={info.getValue()} />,
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
            <Group justify="flex-end" gap="xs" wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  onClick={() => setBorrower360CustomerId(row.id)}
                >
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
    setType(null);
    setCountry(null);
    setStatus('all');
  };

  const countryOptions = Array.from(new Set(DUMMY_CUSTOMERS.map((c) => c.country)));

  if (borrower360CustomerId !== null) {
    const customer = customers.find((c) => c.id === borrower360CustomerId);
    if (customer) {
      const borrower = getBorrowerProfile({ id: customer.id, name: customer.name, mobile: customer.mobile });
      return (
        <Box p="xl" mt="xl">
          <Borrower360 borrower={borrower} onBack={() => setBorrower360CustomerId(null)} />
        </Box>
      );
    }
    // customer no longer exists (deleted) — the effect above resets the id;
    // render nothing for this frame instead of touching state here.
    return null;
  }

  return (
    <Stack gap="md" p="lg">
      <CustomerModal opened={opened} onClose={close} />

      {/* Header — title + subtitle, Add button lives in the filter bar */}
      <Group justify="space-between" align="center">
        <Stack gap="xs">
          <Title order={2} c="slate.8" fw={600}>
            Customers
          </Title>
          <Text fz="sm" c="slate.5">
            Onboard new customers
          </Text>
        </Stack>
      </Group>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" shadow="xs">
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            size="xs"
            placeholder="Name / Email / Mobile"
            leftSection={<IconSearch size={13} />}
            style={{ flex: 1, minWidth: 200 }}
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
            w={144}
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
            w={160}
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
              <Radio size="xs" value="all" label="All" color="brand" />
              <Radio size="xs" value="ACTIVE" label="Active" color="brand" />
              <Radio size="xs" value="INACTIVE" label="Inactive" color="brand" />
            </Group>
          </Radio.Group>

          {/* Reset + Add Customer grouped together at the end of the filter bar,
              matching the "New Entry" placement pattern from the journal entries table */}
          <Group gap="xs" ml="auto">
            <Button size="xs" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            <Button size="xs" color="brand" onClick={open} leftSection={<IconPlus size={14} />}>
              Add Customer
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper withBorder radius="md" shadow="xs" style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="xs" horizontalSpacing="sm" fz="xs" w="100%">
          <Table.Thead bg="slate.0" style={{ borderBottom: '1px solid var(--mantine-color-slate-2)' }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      c="slate.5"
                      fw={600}
                      style={{
                        fontSize: "var(--mantine-font-size-xs)",
                        padding: '6px 10px',
                        userSelect: 'none',
                        cursor: canSort ? 'pointer' : 'default',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Group
                        gap="xs"
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
                  <Stack align="center" gap="xs" py="xl">
                    <IconUsers size={32} color="var(--mantine-color-slate-4)" />
                    <Text ta="center" c="slate.5" fz="xs">
                      No customers match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  style={{ borderBottom: '1px solid var(--mantine-color-slate-1)' }}
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
        <Group justify="space-between" px="sm" py="xs" bg="slate.0" style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
            <span>
              {totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                rightSection={chevronDown}
                size="xs"
                w={56}
              />
            </Group>
          </Group>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="brand"
            size="xs"
            radius="sm"
          />
        </Group>
      </Paper>
    </Stack>
  );
}