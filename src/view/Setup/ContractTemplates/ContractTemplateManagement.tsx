
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Group,
  SimpleGrid,
  Text,
  Paper,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Switch,
  Pagination,
  Tooltip,
  Avatar,
  Stack,
  Title,
  SegmentedControl,
  useMantineTheme,
} from '@mantine/core';
import {
  IconCloudUpload,
  IconSearch,
  IconFileDescription,
  IconCircleCheck,
  IconClock,
  IconLink,
  IconEye,
  IconPencil,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconPlus,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useNavigate } from '@tanstack/react-router';

/* ───── mock data ───── */
const mockTemplates = [
  { id: 1, bank: 'HDFC Bank', color: 'red', product: 'Business Loan', type: 'Loan Agreement', name: 'HDFC Business Loan Agreement', version: '2.0', uploadDate: '01-May-2024', uploadTime: '10:30 AM', effectiveDate: '01-May-2024', status: 'Active' },
  { id: 2, bank: 'HDFC Bank', color: 'red', product: 'Education Loan', type: 'Sanction Letter', name: 'HDFC Education Sanction Letter', version: '1.0', uploadDate: '15-Apr-2024', uploadTime: '02:15 PM', effectiveDate: '15-Apr-2024', status: 'Active' },
  { id: 3, bank: 'ICICI Bank', color: 'orange', product: 'Personal Loan', type: 'Loan Agreement', name: 'ICICI Personal Loan Agreement', version: '1.0', uploadDate: '10-Apr-2024', uploadTime: '11:45 AM', effectiveDate: '10-Apr-2024', status: 'Inactive' },
  { id: 4, bank: 'SBI Bank', color: 'blue', product: 'Home Loan', type: 'Loan Agreement', name: 'SBI Home Loan Agreement', version: '1.1', uploadDate: '20-Mar-2024', uploadTime: '09:05 AM', effectiveDate: '20-Mar-2024', status: 'Active' },
  { id: 5, bank: 'Bajaj Finserv', color: 'cyan', product: 'Consumer Loan', type: 'Hypothecation Agreement', name: 'Bajaj Consumer Hypothecation Agreement', version: '1.0', uploadDate: '05-Mar-2024', uploadTime: '04:20 PM', effectiveDate: '05-Mar-2024', status: 'Active' },
  { id: 6, bank: 'Axis Bank', color: 'pink', product: 'Home Loan', type: 'Loan Agreement', name: 'Axis Home Loan Agreement', version: '1.0', uploadDate: '28-Feb-2024', uploadTime: '12:10 PM', effectiveDate: '01-Mar-2024', status: 'Inactive' },
];

/* ───── shared sub-components (same as LoanProduct) ───── */
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active';
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
      {status.toUpperCase()}
    </Badge>
  );
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;
const columnHelper = createColumnHelper<typeof mockTemplates[0]>();

/* ───── main component ───── */
export function ContractTemplateManagement() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sorting, setSorting] = useState([{ id: 'uploadDate', desc: true }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Loan Agreement': return 'indigo';
      case 'Sanction Letter': return 'orange';
      case 'Hypothecation Agreement': return 'green';
      default: return 'gray';
    }
  };

  // filter data client-side
  const filteredData = useMemo(() => {
    let data = mockTemplates;
    if (status === 'active') data = data.filter(t => t.status === 'Active');
    if (status === 'inactive') data = data.filter(t => t.status === 'Inactive');
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.bank.toLowerCase().includes(q) ||
        t.product.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      );
    }
    return data;
  }, [search, status]);

  // pagination helpers
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  const columns = useMemo(() => [
    columnHelper.accessor('bank', {
      header: 'Bank / NBFC',
      cell: (info) => (
        <Group gap="sm" wrap="nowrap">
          <Avatar size={34} radius="md" variant="light" color={info.row.original.color} style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {info.getValue().charAt(0)}
          </Avatar>
          <Text fz="sm" fw={700} c="slate.8">{info.getValue()}</Text>
        </Group>
      ),
    }),
    columnHelper.accessor('product', {
      header: 'Loan Product',
      cell: (info) => <Text fz="sm" c="slate.7">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('type', {
      header: 'Contract Type',
      cell: (info) => (
        <Badge
          variant="light"
          size="sm"
          radius="sm"
          color={getBadgeColor(info.getValue())}
          styles={{ root: { fontSize: 10, padding: '0 8px' } }}
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Template Name',
      cell: (info) => (
        <Text fz="sm" c="slate.8" className="max-w-[180px] leading-tight line-clamp-2">
          {info.getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('uploadDate', {
      header: 'Uploaded Date',
      cell: (info) => (
        <Box>
          <Text fz="sm" c="slate.8">{info.getValue()}</Text>
          <Text fz="xs" c="slate.5">{info.row.original.uploadTime}</Text>
        </Box>
      ),
    }),
    columnHelper.accessor('effectiveDate', {
      header: 'Effective Date',
      cell: (info) => <Text fz="sm" c="slate.7">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <Text fz="xs" fw={600} ta="right" w="100%">Actions</Text>,
      cell: (info) => {
        const isActive = info.row.original.status === 'Active';
        return (
          <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
            <Tooltip label="View" withArrow>
              <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="brand" radius="md">
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon size="sm" variant="subtle" color="danger" radius="md">
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={isActive ? 'Deactivate' : 'Activate'} withArrow>
              <Switch size="xs" color="success" checked={isActive} onChange={() => {}} />
            </Tooltip>
          </Group>
        );
      },
    }),
  ], []);

  const table = useReactTable({
    data: pagedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <Stack gap="lg" p="lg">
      {/* ── scoped CSS (same as LoanProduct) ── */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* ── page header (icon + title, same as LoanProduct) ── */}
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
            <IconFileDescription size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Contract Templates
            </Title>
            <Text fz="sm" c="slate.5">
              Upload and manage bank/NBFC loan contract templates
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* ── stat cards ── */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
        <Paper p="sm" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="md">
            <Box className="p-2 rounded-md" style={{ backgroundColor: 'var(--mantine-color-indigo-0)' }}>
              <IconFileDescription size={24} stroke={1.5} color="var(--mantine-color-brand-6)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="xl" fw={700} c="slate.8">25</Text>
                <Text size="sm" fw={600} c="slate.7">Total Templates</Text>
              </Group>
              <Text size="xs" c="slate.5">All uploaded templates</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="sm" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="md">
            <Box className="p-2 rounded-md" style={{ backgroundColor: 'var(--mantine-color-success-0)' }}>
              <IconCircleCheck size={24} stroke={1.5} color="var(--mantine-color-success-6)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="xl" fw={700} c="slate.8">18</Text>
                <Text size="sm" fw={600} c="slate.7">Active Templates</Text>
              </Group>
              <Text size="xs" c="slate.5">Currently active</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="sm" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="md">
            <Box className="p-2 rounded-md" style={{ backgroundColor: 'var(--mantine-color-orange-0)' }}>
              <IconClock size={24} stroke={1.5} color="var(--mantine-color-orange-5)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="xl" fw={700} c="slate.8">5</Text>
                <Text size="sm" fw={600} c="slate.7">Inactive Templates</Text>
              </Group>
              <Text size="xs" c="slate.5">Not active</Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="sm" radius="md" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
          <Group gap="md">
            <Box className="p-2 rounded-md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
              <IconLink size={24} stroke={1.5} color="var(--mantine-color-blue-5)" />
            </Box>
            <Box>
              <Group gap="xs" align="baseline">
                <Text size="xl" fw={700} c="slate.8">12</Text>
                <Text size="sm" fw={600} c="slate.7">Loan Products</Text>
              </Group>
              <Text size="xs" c="slate.5">With active templates</Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* ── pill-shaped toolbar (same as LoanProduct) ── */}
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
            placeholder="Template Name / Bank"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          />
          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
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
              component="a"
              href="/setup/contract-templates/create"
              onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate({ to: '/setup/contract-templates/create' }); }}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Add Template
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* ── table card (same as LoanProduct) ── */}
      <Paper
        radius="lg"
        p="sm"
        pos="relative"
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
                      <Group gap="xs" wrap="nowrap" justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}>
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
                      <IconFileDescription size={24} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No contract templates match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const isActive = row.original.status === 'Active';
                return (
                  <Table.Tr key={row.id} className="lms-row">
                    {row.getVisibleCells().map((cell, idx) => (
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

        {/* ── pagination footer (same as LoanProduct) ── */}
        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
            <span>
              {totalRows === 0
                ? 'Showing 0 of 0'
                : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => { setPageSize(Number(v) || 10); setPage(1); }}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            color="brand"
            size="xs"
            radius="xl"
            disabled={totalRows === 0}
          />
        </Group>
      </Paper>
    </Stack>
  );
}
