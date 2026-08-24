import { useEffect, useMemo, useState } from 'react';
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
import { FilterMultiSelect } from '../../../components/shared/FilterMultiSelect';

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
  Badge,
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
  IconCircleCheck,
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

function StatusBadge({ status }: { status: number }) {
  const isApproved = status === 1;
  const isCancelled = status === 2;
  const scale = isApproved ? 'success' : isCancelled ? 'danger' : 'slate';
  const label = isApproved ? 'Approved' : isCancelled ? 'Cancelled' : 'Draft';

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
      {label}
    </Badge>
  );
}

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export function LoanWriteOff() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  const [editData, setEditData] = useState<LoanWriteOffDetail | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: 'posting_date', desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Reset pagination when search or statusFilter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, statusFilter]);

  const { data: writeOffResponse, isLoading, isError } = useQuery({
    queryKey: ['loan-write-offs', pagination.pageIndex, pagination.pageSize, search, statusFilter],
    queryFn: () =>
      getLoanWriteOffs({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: search || undefined,
        status: statusFilter.length ? statusFilter : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const serverData: LoanWriteOffListItem[] = writeOffResponse?.data ?? [];
  
  // Local fallback filter since backend 'get_loan_write_offs' might not filter by status yet
  const filteredData = useMemo(() => {
    if (!statusFilter || statusFilter.length === 0) return serverData;
    return serverData.filter((item) => statusFilter.includes(String(item.docstatus)));
  }, [serverData, statusFilter]);

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
    mutationFn: ({ id, action }: { id: string; action: 'approved' | 'cancelled' }) =>
      updateLoanWriteOffStatus(id, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loan-write-offs'] });
      const isCancel = variables.action === 'cancelled';
      showSuccess(
        isCancel ? 'Write-off Cancelled' : 'Write-off Approved',
        isCancel ? 'Write-off cancelled successfully.' : 'Write-off approved successfully.'
      );
    },
    onError: (error: any, variables) => {
      const isCancel = variables.action === 'cancelled';
      showError(isCancel ? 'Cancel Failed' : 'Approval Failed', error);
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
  const handleStatusChange = (id: string, action: 'approved' | 'cancelled') => {
    const isCancel = action === 'cancelled';
    openCommonModal({
      heading: isCancel ? 'Cancel Write-off' : 'Approve Write-off',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to {isCancel ? 'cancel' : 'approve'} write-off{' '}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: isCancel ? 'danger' : 'success',
      buttons: [
        { label: 'Back', variant: 'default' },
        {
          label: isCancel ? 'Cancel' : 'Approve',
          color: isCancel ? 'danger' : 'success',
          onClick: () => {
            statusMutation.mutate({ id, action });
          },
        },
      ],
    });
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
      columnHelper.accessor('docstatus', {
        header: () => (
          <Text fz="xs" fw={600} w="100%">
            Status
          </Text>
        ),
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
          const isDraft = row.docstatus === 0;
          const isCancelled = row.docstatus === 2;
          const canDelete = isDraft || isCancelled;

          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
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
              <Tooltip label={isDraft ? 'Edit' : 'Only Drafts can be edited'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? 'brand' : 'slate'}
                  radius="md"
                  disabled={!isDraft}
                  onClick={() => handleEditClick(row.name)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canDelete ? 'Delete' : 'Approved write-offs cannot be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? 'danger' : 'slate'}
                  radius="md"
                  disabled={!canDelete || (deleteMutation.isPending && deleteMutation.variables === row.name)}
                  loading={deleteMutation.isPending && deleteMutation.variables === row.name}
                  onClick={() => handleDeleteClick(row.name)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={140} position="bottom-end" withinPortal radius="md" withArrow>
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    disabled={isCancelled}
                    loading={statusMutation.isPending && statusMutation.variables?.id === row.name}
                    style={{ opacity: isCancelled ? 0.5 : 1 }}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft ? (
                    <Menu.Item 
                      color="success" 
                      leftSection={<IconCircleCheck size={14} />}
                      onClick={() => handleStatusChange(row.name, 'approved')}
                    >
                      Approve
                    </Menu.Item>
                  ) : (
                    <Menu.Item color="danger" onClick={() => handleStatusChange(row.name, 'cancelled')}>
                      Cancel
                    </Menu.Item>
                  )}
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

  const resetFilters = () => {
    setSearch('');
    setStatusFilter([]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

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
          <FilterMultiSelect
            placeholder="All Statuses"
            data={[
              { value: '0', label: 'Draft' },
              { value: '1', label: 'Approved' },
              { value: '2', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            width={140}
          />
          <Button size="sm" radius="xl" variant="default" px="md" ml="auto" onClick={resetFilters}>
            Reset
          </Button>

          <Group gap="xs">
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