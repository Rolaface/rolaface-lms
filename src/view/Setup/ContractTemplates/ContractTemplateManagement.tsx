
import React, { useState, useMemo } from 'react';
import { Box, Button, Group, Text, Paper, SimpleGrid, TextInput, Select, Table, Badge, ActionIcon, Switch, Pagination, Tooltip, Avatar } from '@mantine/core';
import { IconCloudUpload, IconSearch, IconFilter, IconFileDescription, IconCircleCheck, IconClock, IconLink, IconEye, IconPencil, IconCopy, IconTrash, IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { createTemplateModal } from '../../../components/Modal/createTemplateModalStore';

const mockTemplates = [
  { id: 1, bank: 'HDFC Bank', color: 'red', product: 'Business Loan', type: 'Loan Agreement', name: 'HDFC Business Loan Agreement', version: '2.0', uploadDate: '01-May-2024', uploadTime: '10:30 AM', effectiveDate: '01-May-2024', status: 'Active' },
  { id: 2, bank: 'HDFC Bank', color: 'red', product: 'Education Loan', type: 'Sanction Letter', name: 'HDFC Education Sanction Letter', version: '1.0', uploadDate: '15-Apr-2024', uploadTime: '02:15 PM', effectiveDate: '15-Apr-2024', status: 'Active' },
  { id: 3, bank: 'ICICI Bank', color: 'orange', product: 'Personal Loan', type: 'Loan Agreement', name: 'ICICI Personal Loan Agreement', version: '1.0', uploadDate: '10-Apr-2024', uploadTime: '11:45 AM', effectiveDate: '10-Apr-2024', status: 'Inactive' },
  { id: 4, bank: 'SBI Bank', color: 'blue', product: 'Home Loan', type: 'Loan Agreement', name: 'SBI Home Loan Agreement', version: '1.1', uploadDate: '20-Mar-2024', uploadTime: '09:05 AM', effectiveDate: '20-Mar-2024', status: 'Active' },
  { id: 5, bank: 'Bajaj Finserv', color: 'cyan', product: 'Consumer Loan', type: 'Hypothecation Agreement', name: 'Bajaj Consumer Hypothecation Agreement', version: '1.0', uploadDate: '05-Mar-2024', uploadTime: '04:20 PM', effectiveDate: '05-Mar-2024', status: 'Active' },
  { id: 6, bank: 'Axis Bank', color: 'pink', product: 'Home Loan', type: 'Loan Agreement', name: 'Axis Home Loan Agreement', version: '1.0', uploadDate: '28-Feb-2024', uploadTime: '12:10 PM', effectiveDate: '01-Mar-2024', status: 'Inactive' }
];

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

const columnHelper = createColumnHelper<typeof mockTemplates[0]>();

export function ContractTemplateManagement() {
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState([{ id: 'uploadDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Loan Agreement': return 'indigo';
      case 'Sanction Letter': return 'orange';
      case 'Hypothecation Agreement': return 'green';
      default: return 'gray';
    }
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
      header: 'Loan Product / Scheme',
      cell: (info) => <Text fz="sm" c="slate.7">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('type', {
      header: 'Contract Type',
      cell: (info) => (
        <Badge color={getBadgeColor(info.getValue())} variant="light" size="sm" radius="sm">
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
              <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Switch size="sm" checked={isActive} color="brand" className="mx-1" />
            <Tooltip label="Delete" withArrow>
              <ActionIcon size="sm" variant="subtle" color="red" radius="md">
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    }),
  ], []);

  const table = useReactTable({
    data: mockTemplates,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Box className="max-w-[1400px] w-full p-4 flex flex-col mx-auto">
      <Group justify="space-between" mb="md">
        <Box>
          <Text size="xl" fw={700} c="slate.9" className="text-2xl mb-1">
            Contract Template Management
          </Text>
          <Text size="sm" c="slate.5">
            Upload and manage bank/NBFC loan contract templates. Upload your legally approved PDF templates and map them to loan products.
          </Text>
        </Box>
        <Link to="/setup/contract-templates/create">
          <Button 
            leftSection={<IconCloudUpload size={18} />} 
            size="md"
          >
            Upload New Contract Template
          </Button>
        </Link>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm" mb="md">
        <Paper p="sm" radius="md" className="border border-slate-200 shadow-sm">
          <Group gap="md">
            <Box className="p-2 bg-indigo-50 text-brand-6 rounded-md">
              <IconFileDescription size={24} stroke={1.5} />
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
        <Paper p="sm" radius="md" className="border border-slate-200 shadow-sm">
          <Group gap="md">
            <Box className="p-2 bg-green-50 text-green-600 rounded-md">
              <IconCircleCheck size={24} stroke={1.5} />
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
        <Paper p="sm" radius="md" className="border border-slate-200 shadow-sm">
          <Group gap="md">
            <Box className="p-2 bg-orange-50 text-orange-500 rounded-md">
              <IconClock size={24} stroke={1.5} />
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
        <Paper p="sm" radius="md" className="border border-slate-200 shadow-sm">
          <Group gap="md">
            <Box className="p-2 bg-blue-50 text-blue-500 rounded-md">
              <IconLink size={24} stroke={1.5} />
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

      <Paper radius="md" className="border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col flex-1">
        <Box p="md" className="border-b border-slate-100 flex items-center justify-between shrink-0">
          <Text size="lg" fw={600} c="slate.8">Existing Contract Templates</Text>
          <Group>
            <TextInput
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              radius="md"
              style={{ width: 300 }}
            />
            <Button variant="default" leftSection={<IconFilter size={16} />} radius="md">
              Filters
            </Button>
          </Group>
        </Box>

        <Box className="flex-1 overflow-auto">
          <Table horizontalSpacing="md" verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead className="bg-slate-50 sticky top-0 z-10" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    >
                      <Group gap={6} wrap="nowrap" justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}>
                        <Text fz="xs" fw={600} c="slate.5" tt="uppercase" lts={0.5}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Text>
                        {header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
                      </Group>
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} align="center" style={{ padding: '40px' }}>
                    <Text c="slate.5">No contract templates found</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>

        <Box p="md" className="border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <Text size="sm" c="slate.5">
            Showing {table.getRowModel().rows.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0} to{' '}
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getPrePaginationRowModel().rows.length)} of{' '}
            {table.getPrePaginationRowModel().rows.length} entries
          </Text>
          <Group gap="md">
            <Pagination
              total={table.getPageCount()}
              value={table.getState().pagination.pageIndex + 1}
              onChange={(page) => table.setPageIndex(page - 1)}
              size="sm"
              radius="md"
              color="brand"
            />
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onChange={(v) => table.setPageSize(Number(v))}
              data={['10 / page', '20 / page', '50 / page']}
              size="sm"
              radius="md"
              style={{ width: 110 }}
            />
          </Group>
        </Box>
      </Paper>
    </Box>
  );
}
