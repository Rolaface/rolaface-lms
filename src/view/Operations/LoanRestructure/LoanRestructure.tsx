// LoanRestructure.tsx
import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Menu,
  Stack,
  useMantineTheme,
  SegmentedControl,
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
  IconDotsVertical,
  IconRefresh,
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
import { LoanRestructureModal, type RestructureFormData } from "../../../components/Modal/LoanRestructure/LoanRestructureModal"
import { openCommonModal } from '../../../components/Modal/AlertModal';

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

// Same status meta pattern as LoanAccount
const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'PENDING', color: 'gold' },
  APPROVED: { label: 'APPROVED', color: 'brand' },
  REJECTED: { label: 'REJECTED', color: 'danger' },
};

const columnHelper = createColumnHelper<RestructureRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

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

const fmtAmount = (n: number) =>
  n ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export function LoanRestructure() {
  const theme = useMantineTheme();
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

  const showError = (heading: string, message: string) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: message,
      color: 'red',
      buttons: [{ label: 'Close', color: 'red' }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'Close', color: 'green' }],
    });
  };

  const showWarning = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'orange',
      buttons: [{ label: 'Close', color: 'orange' }],
    });
  };

  const handleDelete = (id: number, loanAc: string) => {
    try {
      setRowsData((prev) => prev.filter((r) => r.id !== id));
      showSuccess('Restructure Deleted', `Restructure request ${loanAc} deleted successfully.`);
    } catch (err) {
      showError('Delete Failed', 'Failed to delete restructure request. Please try again.');
    }
  };

  const confirmDelete = (row: RestructureRow) => {
    openCommonModal({
      heading: 'Delete Restructure Request',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete restructure request{' '}
          <Text span fw={600}>
            {row.loanAc}
          </Text>
          ?
        </>
      ),
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: 'Delete',
          color: 'red',
          onClick: () => handleDelete(row.id, row.loanAc),
        },
      ],
    });
  };

  const handleStatusChange = (id: number, newStatus: RestructureRow['status'], loanAc: string) => {
    try {
      setRowsData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      if (newStatus === 'APPROVED') {
        showSuccess('Restructure Approved', `Restructure request ${loanAc} approved.`);
      } else if (newStatus === 'REJECTED') {
        showWarning('Restructure Rejected', `Restructure request ${loanAc} rejected.`);
      } else {
        showSuccess('Restructure Reverted', `Restructure request ${loanAc} reverted to pending.`);
      }
    } catch (err) {
      showError('Update Failed', 'Failed to update status. Please try again.');
    }
  };

  const handleAddRestructure = (formData: RestructureFormData) => {
    try {
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
      showSuccess('Restructure Created', 'Restructure request created successfully.');
    } catch (err) {
      showError('Create Failed', 'Failed to create restructure request. Please try again.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRestructureType(null);
    setStatus('all');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const restructureTypeOptions = [
    { value: 'RATE_CHANGE', label: 'Rate Change' },
    { value: 'TOPUP', label: 'Topup' },
    { value: 'MODIFY_MATURITY', label: 'Modify Maturity' },
  ];

  const columns = useMemo(
    () => [
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <Stack gap={0}>
            <Text fz="sm" fw={700} c="slate.8" className="font-mono">
              {info.getValue()}
            </Text>
            <Text fz="xs" c="slate.5">
              {info.row.original.customer}
            </Text>
          </Stack>
        ),
      }),
      columnHelper.accessor('loanType', {
        header: 'Loan Type',
        cell: (info) => (
          <Text fz="xs" c="slate.5">
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
            radius="sm"
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
          <Text fz="xs" c="slate.5">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => (
          <Text fz="xs" c="slate.5">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('totalCharges', {
        header: 'Charges',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7" className="font-mono">
            ZMW {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || { label: info.getValue(), color: 'slate' };
          return (
            <Badge
              variant="light"
              size="sm"
              radius="sm"
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
        cell: (info) => {
          const row = info.row.original;
          const isPending = row.status === 'PENDING';

          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isPending ? 'Edit' : 'Only Pending can be edited'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isPending ? 'brand' : 'slate'}
                  radius="md"
                  disabled={!isPending}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isPending ? 'Delete' : 'Only Pending can be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isPending ? 'danger' : 'slate'}
                  radius="md"
                  disabled={!isPending}
                  onClick={() => confirmDelete(row)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={160} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isPending ? (
                    <>
                      <Menu.Item onClick={() => handleStatusChange(row.id, 'APPROVED', row.loanAc)}>
                        Approve
                      </Menu.Item>
                      <Menu.Item color="danger" onClick={() => handleStatusChange(row.id, 'REJECTED', row.loanAc)}>
                        Reject
                      </Menu.Item>
                    </>
                  ) : (
                    <Menu.Item color="danger" onClick={() => handleStatusChange(row.id, 'PENDING', row.loanAc)}>
                      Revert to Pending
                    </Menu.Item>
                  )}
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

  return (
    <Stack gap="lg" p="lg">
      <LoanRestructureModal opened={opened} onClose={close} onSubmit={handleAddRestructure} />

      {/* Scoped, purely visual — mirrors FeeAndCharges.tsx / Customer.tsx */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* Header — icon tile + title on the left */}
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
            <IconRefresh size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Restructures
            </Title>
            <Text fz="sm" c="slate.5">
              Manage rate changes, top-ups and maturity modifications
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search + filters */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        <Stack gap="xs">
          <Group gap="sm" wrap="wrap" align="center">
            <TextInput
              className="lms-search"
              size="sm"
              radius="xl"
              placeholder="Loan A/c / Customer"
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
              placeholder="All Restructure Types"
              data={restructureTypeOptions}
              w={200}
              searchable
              clearable
              rightSection={chevronDown}
              styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              value={restructureType}
              onChange={(v) => {
                setRestructureType(v);
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
                { label: 'Pending', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
            />

            <Group gap="xs" ml="auto">
              <Button
                size="sm"
                radius="xl"
                color="brand"
                onClick={open}
                leftSection={<IconPlus size={14} />}
                style={{
                  background: theme.other.brandGradient,
                  boxShadow: theme.other.brandGlowShadowSm,
                }}
              >
                Restructure Loan
              </Button>
            </Group>
          </Group>
        </Stack>
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
                      <IconFileOff size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No restructure requests match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const cells = row.getVisibleCells();
                return (
                  <Table.Tr key={row.id} className="lms-row">
                    {cells.map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: '10px 10px',
                          border: 'none',
                          boxShadow: 'var(--mantine-shadow-xs)',
                          borderLeft: idx === 0 ? '3px solid var(--mantine-color-brand-4)' : undefined,
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
            disabled={totalRows === 0}
          />
        </Group>
      </Paper>
    </Stack>
  );
}