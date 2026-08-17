import { useMemo, useState } from 'react';
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
  useMantineTheme,
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconTrash,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconArrowsExchange,
  IconArrowsExchange2,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { LoanTransferFormData } from '../../../components/Modal/LoanTransferModal';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { loanTransferModal } from './LoanTransferModalStore';

interface TransferRow {
  id: number;
  transferDate: string;
  fromBranch: string;
  toBranch: string;
  loansCount: number;
  status: 'COMPLETED' | 'PENDING';
}

const DUMMY_TRANSFERS: TransferRow[] = [
  {
    id: 1,
    transferDate: '2026-07-28',
    fromBranch: 'Lusaka Main',
    toBranch: 'Ndola',
    loansCount: 12,
    status: 'COMPLETED',
  },
  {
    id: 2,
    transferDate: '2026-07-29',
    fromBranch: 'Kitwe',
    toBranch: 'Lusaka Main',
    loansCount: 3,
    status: 'PENDING',
  },
  {
    id: 3,
    transferDate: '2026-07-25',
    fromBranch: 'Ndola',
    toBranch: 'Livingstone',
    loansCount: 8,
    status: 'COMPLETED',
  },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'PENDING', color: 'gold' },
  COMPLETED: { label: 'COMPLETED', color: 'brand' },
};

const columnHelper = createColumnHelper<TransferRow>();

function SortIcon({ sorted }: { sorted: string | boolean }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function LoanTransfer() {
  const theme = useMantineTheme();

  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState([{ id: 'transferDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState(DUMMY_TRANSFERS);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch = !q;
      const matchesBranch = !branch || r.fromBranch === branch || r.toBranch === branch;
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [rowsData, search, branch, status]);

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

  const handleDelete = (id: number, transferDate: string) => {
    try {
      setRowsData((prev) => prev.filter((r) => r.id !== id));
      showSuccess('Transfer Deleted', `Transfer dated ${transferDate} deleted successfully.`);
    } catch (err) {
      showError('Delete Failed', 'Failed to delete transfer. Please try again.');
    }
  };

  const confirmDelete = (row: TransferRow) => {
    openCommonModal({
      heading: 'Delete Loan Transfer',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete this transfer (
          <Text span fw={600}>
            {row.fromBranch} → {row.toBranch}
          </Text>
          )?
        </>
      ),
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: 'Delete',
          color: 'red',
          onClick: () => handleDelete(row.id, row.transferDate),
        },
      ],
    });
  };

  const handleAddTransfer = (formData: LoanTransferFormData) => {
    try {
      setRowsData((prev) => [
        ...prev,
        {
          id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
          transferDate: formData.transferDate,
          fromBranch: formData.fromBranch,
          toBranch: formData.toBranch,
          loansCount: formData.loans.length,
          status: 'PENDING',
        },
      ]);
      showSuccess('Transfer Created', 'Loan transfer created successfully.');
    } catch (err) {
      showError('Create Failed', 'Failed to create loan transfer. Please try again.');
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('transferDate', {
        header: 'Transfer Date',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('fromBranch', {
        header: 'From Branch',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('toBranch', {
        header: 'To Branch',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loansCount', {
        header: 'Loans Included',
        cell: (info) => (
          <Badge variant="light" color="brand" size="sm" radius="sm" styles={{ root: { fontSize: 10 } }}>
            {info.getValue()} Loans
          </Badge>
        ),
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
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="danger"
                  radius="md"
                  onClick={() => confirmDelete(row)}
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
    setBranch(null);
    setStatus('all');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const branchOptions = Array.from(
    new Set([...DUMMY_TRANSFERS.map((r) => r.fromBranch), ...DUMMY_TRANSFERS.map((r) => r.toBranch)])
  );

  return (
    <Stack gap="lg" p="lg">
      {/* Scoped, purely visual — mirrors FeeAndCharges.tsx */}
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
            <IconArrowsExchange size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Transfers
            </Title>
            <Text fz="sm" c="slate.5">
              Move loan accounts between branches
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
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Search Transfer Ref"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 200 }}
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
            placeholder="Any Branch"
            data={branchOptions}
            w={180}
            searchable
            clearable
            rightSection={chevronDown}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={branch}
            onChange={(v) => {
              setBranch(v);
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
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Pending', value: 'PENDING' },
            ]}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => loanTransferModal.open({ onSubmit: handleAddTransfer })}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              New Transfer
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
                      <IconArrowsExchange2 size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No transfers match your filters.
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