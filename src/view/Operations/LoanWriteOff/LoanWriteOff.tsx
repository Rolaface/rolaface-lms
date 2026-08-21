import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLoanWriteOffs,
  getLoanWriteOffById,
  deleteLoanWriteOff,
  updateLoanWriteOffStatus,
} from '../../../api/lendingOperation/writeoff';
import type { LoanWriteOffListItem, LoanWriteOffDetail } from '../../../types/loanWriteOff';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';

import {
  Box,
  Button,
  TextInput,
  Group,
  Paper,
  Table,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Select,
  Stack,
  Loader,
  Menu,
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
  IconFileOff,
  IconDotsVertical,
  IconCheck,
  IconSend,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { loanWriteOffModal } from './LoanWriteOffModalStore';
import { formatAmount, useCurrencyReady } from '../../../store/currencyStore';
import { useCompanyStore } from '../../../store/companyStore';
const columnHelper = createColumnHelper<LoanWriteOffListItem>();

function SortIcon({ sorted }: { sorted: string | boolean }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export function LoanWriteOff() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  const [editData, setEditData] = useState<LoanWriteOffDetail | null>(null);
  const [search, setSearch] = useState('');

  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: 'posting_date', desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: writeOffResponse, isLoading, isError } = useQuery({
    queryKey: ['loan-write-offs', pagination.pageIndex, pagination.pageSize, search],
    queryFn: () =>
      getLoanWriteOffs({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const filteredData: LoanWriteOffListItem[] = writeOffResponse?.data ?? [];
  const serverPagination = writeOffResponse?.pagination;

  /* ---------------- alert helpers ---------------- */

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
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

  /* ---------------- mutations ---------------- */

  const deleteMutation = useMutation({
    mutationFn: deleteLoanWriteOff,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['loan-write-offs'] });
      showSuccess('Write-off Deleted', `Write-off "${id}" deleted successfully.`);
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approved' | 'submitted' }) =>
      updateLoanWriteOffStatus(id, action),
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['loan-write-offs'] });
      showSuccess(
        action === 'approved' ? 'Write-off Approved' : 'Write-off Submitted',
        action === 'approved' ? 'Write-off approved successfully.' : 'Write-off submitted successfully.'
      );
    },
    onError: (error: any, { action }) => {
      showError(
        action === 'approved' ? 'Approval Failed' : 'Submission Failed',
        error
      );
    },
  });

  /* ---------------- handlers ---------------- */

  const handleAddClick = () => {
    setEditData(null);
    loanWriteOffModal.open({ onSubmit: handleModalSuccess });
  };

  const handleEditClick = async (id: string) => {
    try {
      const detail = await getLoanWriteOffById(id);
      setEditData(detail);
      loanWriteOffModal.open({ editData: detail, onSubmit: handleModalSuccess });
    } catch (err) {
      showError('Load Failed', err);
    }
  };
  const handleViewClick = async (id: string) => {
    try {
      const detail = await getLoanWriteOffById(id);
      setEditData(detail);
      loanWriteOffModal.open({ editData: detail, isView: true, onSubmit: handleModalSuccess });
    } catch (err) {
      showError('Load Failed', err);
    }
  };
  const handleDeleteClick = (id: string) => {
    openCommonModal({
      heading: 'Delete Write-off',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete write-off{' '}
          <Text span fw={600}>
            {id}
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
          onClick: () => {
            deleteMutation.mutate(id);
          },
        },
      ],
    });
  };

  const handleStatusChange = (id: string, action: 'approved' | 'submitted') => {
    statusMutation.mutate({ id, action });
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['loan-write-offs'] });
    showSuccess(
      editData ? 'Write-off Updated' : 'Write-off Created',
      editData ? 'Write-off updated successfully.' : 'Write-off created successfully.'
    );
    setEditData(null);
  };
  /* ---------------- columns ---------------- */

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Write-off ID',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>

        ),
      }),
      columnHelper.accessor('loan', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('applicant', {
        header: 'Applicant',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loan_product', {
        header: 'Loan Product',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
     columnHelper.accessor('write_off_amount', {
  header: 'Write-off Amount',
  cell: (info) => (
    <Text
      fz="xs"
      fw={700}
      c="slate.8"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {formatAmount(companyCurrency, Number(info.getValue()), { withSymbol: true })}
    </Text>
  ),
}),
      columnHelper.accessor('posting_date', {
  header: 'Posting Date',
  cell: (info) => (
    <Text fz="xs" c="slate.6">
      {fmtDate(info.getValue())}
    </Text>
  ),
  sortingFn: 'basic',
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
                  onClick={() => handleViewClick(row.name)}
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
                  onClick={() => handleEditClick(row.name)}
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
                  loading={deleteMutation.isPending && deleteMutation.variables === row.name}
                  onClick={() => handleDeleteClick(row.name)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={160} position="bottom-end" withinPortal radius="md">
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    loading={statusMutation.isPending && statusMutation.variables?.id === row.name}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconSend size={14} />}
                    onClick={() => handleStatusChange(row.name, 'submitted')}
                  >
                    Submit
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleStatusChange(row.name, 'approved')}
                  >
                    Approve
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    [deleteMutation.isPending, deleteMutation.variables, statusMutation.isPending, statusMutation.variables, companyCurrency]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: serverPagination?.total_pages ?? 1,
  });

  const rows = table.getRowModel().rows;
  const totalRows = serverPagination?.total ?? 0;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <Stack gap="lg" p="lg">


      {/* Scoped, purely visual — pulls from theme.other, mirrors FeeAndCharges.tsx */}
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
            <IconFileOff size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Write-offs
            </Title>
            <Text fz="sm" c="slate.5">
              Manage and track loan write-off requests
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search */}
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
            placeholder="Search Loan A/c / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <Group gap="xs" ml="auto">
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={handleAddClick}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Write Off Loan
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
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <Loader size="sm" color="brand" />
                    <Text ta="center" c="slate.5" fz="xs">
                      Loading write-offs...
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : isError ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Text ta="center" c="danger" fz="xs" py="xl">
                    Failed to load write-offs.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
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
                      No write-offs match your search.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const cells = row.getVisibleCells();
                return (
                   <Table.Tr
                    key={row.id}
                    className="lms-row"
                    onDoubleClick={() => handleViewClick(row.original.name)}
                    style={{ cursor: 'pointer' }}
                  >
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