import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  SegmentedControl,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Avatar,
  useMantineTheme,
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
  IconMail,
  IconPhone,
  IconWorld,
} from '@tabler/icons-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { customerModal } from '../../components/Modal/customer/CustomerModalStore';
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

// Decorative only — falls back to a plain globe icon for any country not listed.
const COUNTRY_FLAGS: Record<string, string> = {
  Zambia: '🇿🇲',
  Italy: '🇮🇹',
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  const scale = isActive ? 'success' : 'danger';
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{ borderRadius: '50%', background: `var(--mantine-color-${scale}-6)` }}
        />
      }
    >
      {status}
    </Badge>
  );
}

function NameCell({ name, type }: { name: string; type: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Group gap={10} wrap="nowrap">
      <Avatar
        size={34}
        radius="md"
        variant="light"
        color={type === 'Company' ? 'brand' : 'info'}
        style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}
      >
        {initials}
      </Avatar>
      <Text fz="sm" fw={700} c="slate.8">
        {name}
      </Text>
    </Group>
  );
}

function IconText({ icon, children, mono = false }: { icon: React.ReactNode; children: React.ReactNode; mono?: boolean }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Box style={{ color: 'var(--mantine-color-slate-4)', display: 'flex', flexShrink: 0 }}>{icon}</Box>
      <Text
        fz="xs"
        c="slate.6"
        style={mono ? { fontFamily: 'var(--mantine-font-family-monospace)' } : undefined}
      >
        {children}
      </Text>
    </Group>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function Customer() {
  const theme = useMantineTheme();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

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

  const stats = useMemo(() => {
    const activeCount = data.filter((c) => c.status === 'ACTIVE').length;
    return {
      total: data.length,
      active: activeCount,
      inactive: data.length - activeCount,
    };
  }, [data]);

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
        cell: (info) => <NameCell name={info.getValue()} type={info.row.original.type} />,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
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
        cell: (info) => <IconText icon={<IconMail size={13} />}>{info.getValue()}</IconText>,
      }),
      columnHelper.accessor('mobile', {
        header: 'Mobile',
        cell: (info) => (
          <IconText icon={<IconPhone size={13} />} mono>
            {info.getValue()}
          </IconText>
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
        cell: (info) => {
          const flag = COUNTRY_FLAGS[info.getValue()];
          return (
            <Group gap={6} wrap="nowrap">
              {flag ? (
                <Text fz="sm" style={{ lineHeight: 1 }}>
                  {flag}
                </Text>
              ) : (
                <IconWorld size={13} color="var(--mantine-color-slate-4)" />
              )}
              <Text fz="xs" c="slate.6">
                {info.getValue()}
              </Text>
            </Group>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
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
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => handleViewCustomer(row)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="brand"
                  radius="md"
                  onClick={() => customerModal.open({ isViewMode: false })}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="danger"
                  radius="md"
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

  const handleViewCustomer = (customer: CustomerRow) => {
  setBorrower360CustomerId(customer.id);
};

  if (borrower360CustomerId !== null) {
    const customer = customers.find((c) => c.id === borrower360CustomerId);
    if (customer) {
      const borrower = getBorrowerProfile({ id: customer.id, name: customer.name, mobile: customer.mobile });
       return (
        <Borrower360 borrower={borrower} onBack={() => setBorrower360CustomerId(null)} />
      );
    }
    return null;
  }

  return (
    <Stack gap="lg" p="lg">
      {/* Scoped, purely visual — now pulls from theme.other instead of
          hand-tuned color-mix() literals so it stays in sync with the
          brand color everywhere else. */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* Header — icon tile + title on the left, live KPI chips on the right */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--mantine-radius-md)',
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconUsers size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Customers
            </Title>
            <Text fz="sm" c="slate.5">
              Onboard new customers
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search + pill filters + segmented status control */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Name / Email / Mobile"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Types"
            data={['Individual', 'Company']}
            w={150}
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
            size="sm"
            radius="xl"
            placeholder="All Countries"
            data={countryOptions}
            w={166}
            searchable
            clearable
            rightSection={chevronDown}
            value={country}
            onChange={(v) => {
              setCountry(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => customerModal.open({ isViewMode: false })}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Add Customer
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data Table — floating rounded row-cards on a soft canvas */}
      <Paper
        radius="lg"
        p="sm"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        <Table
          verticalSpacing="sm"
          horizontalSpacing="sm"
          fz="xs"
          w="100%"
          style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}
        >
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      c="slate.5"
                      fw={700}
                      style={{
                        fontSize: 'var(--mantine-font-size-xs)',
                        padding: '0 10px 6px',
                        userSelect: 'none',
                        cursor: canSort ? 'pointer' : 'default',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: 'none',
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
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <Box
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: 'var(--mantine-color-white)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--mantine-color-slate-2)',
                      }}
                    >
                      <IconUsers size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No customers match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const isActive = row.original.status === 'ACTIVE';
                const cells = row.getVisibleCells();
                return (
                  <Table.Tr
  key={row.id}
  className="lms-row"
  onDoubleClick={() => handleViewCustomer(row.original)}
  style={{ cursor: 'pointer' }}
>
                    {cells.map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: '10px 10px',
                          border: 'none',
                          boxShadow: 'var(--mantine-shadow-xs)',
                          borderLeft:
                            idx === 0
                              ? `3px solid var(--mantine-color-${isActive ? 'success' : 'danger'}-4)`
                              : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Footer */}
        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
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
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="brand"
            size="xs"
            radius="xl"
          />
        </Group>
      </Paper>
    </Stack>
  );
}