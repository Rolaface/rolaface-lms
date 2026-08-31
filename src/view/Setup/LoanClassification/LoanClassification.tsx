import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconFileText,
  IconLayersLinked,
  IconPencil,
  IconPlus,
  IconSelector,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { loanClassificationModal } from './LoanClassificationsStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { SortDirection } from '@tanstack/react-table';

import type { LoanClassificationData } from '../../../types/loanClassification';
import {
  getAllLoanClassifications,
  deleteLoanClassification,
} from '../../../api/LoanClassificationApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';
import { usePermission } from '../../../hooks/Usepermission';

const EMPTY_CLASSIFICATIONS: LoanClassificationData[] = [];
const DEFAULT_SORTING = [{ id: 'code', desc: false }];

const columnHelper = createColumnHelper<LoanClassificationData>();

function SortIcon({ sorted }: { sorted: false | SortDirection }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
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

export function LoanClassification() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  
  const { can } = usePermission();
  const canCreateLoan = can('Loan Classification', 'create');
  const canReadLoan = can('Loan Classification', 'read');
  const canWriteLoan = can('Loan Classification', 'write');
  const canDeleteLoan = can('Loan Classification', 'delete');

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [sorting, setSorting] = useState(DEFAULT_SORTING);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['loanClassifications', debouncedSearch, page, pageSize],
    queryFn: () =>
      getAllLoanClassifications({
        search: debouncedSearch.trim() || undefined,
        page,
        page_size: pageSize,
      }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const classifications = response?.data ?? EMPTY_CLASSIFICATIONS;
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

  const { mutate: removeClassification, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanClassification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanClassifications'] });
      showSuccess('Classification Deleted', 'Loan classification deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const handleAdd = () => {
    loanClassificationModal.open({ editId: null, initialData: null, isView: false });
  };

  const handleEdit = (row: LoanClassificationData) => {
    loanClassificationModal.open({ editId: row.code, initialData: row, isView: false });
  };

  // Shared by the eye icon and the row double-click handler — matches the
  // ERP's "double-click a row to view" convention used across the other modules.
  const handleView = (row: LoanClassificationData) => {
    loanClassificationModal.open({ editId: row.code, initialData: row, isView: true });
  };

  const handleDelete = (row: LoanClassificationData) => {
    openCommonModal({
      heading: 'Delete Loan Classification',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete classification{' '}
          <Text span fw={600}>
            {row.code}
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
            removeClassification(row.code);
          },
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('level', {
        header: 'Level',
        cell: (info) => (
          <Badge variant="light" size="sm" radius="sm" color="brand" styles={{ root: { fontSize: 10, padding: '0 8px' } }}>
            L{info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('min_dpd_range', {
        header: 'Min DPD',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('max_dpd_range', {
        header: 'Max DPD',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() ?? '∞'}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('provision_rate', {
        header: 'Provision Rate',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}%
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
              {canReadLoan && (
                <Tooltip label="View" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(row);
                    }}
                  >
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              {canWriteLoan && (
                <Tooltip label="Edit" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="brand"
                    radius="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(row);
                    }}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              {canDeleteLoan && (
                <Tooltip label="Delete" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="danger"
                    radius="md"
                    loading={isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDeleting, canReadLoan, canWriteLoan, canDeleteLoan]
  );

  const table = useReactTable({
    data: classifications,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = response?.pagination?.total ?? 0;
  const totalPages = response?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <Stack gap="lg" p="lg">
      {/* Scoped, purely visual — pulls from theme.other to stay in sync
          with the brand color everywhere else (mirrors Customer.tsx). */}
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
            <IconLayersLinked size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Classifications
            </Title>
            <Text fz="sm" c="slate.5">
              Configure delinquency bands and provisioning
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
            placeholder="Code / Classification Name"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            {canCreateLoan && (
              <Button
                size="sm"
                radius="xl"
                color="brand"
                onClick={handleAdd}
                leftSection={<IconPlus size={14} />}
                style={{
                  background: theme.other.brandGradient,
                  boxShadow: theme.other.brandGlowShadowSm,
                }}
              >
                Add Classification
              </Button>
            )}
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
          style={{ borderCollapse: 'separate', borderSpacing: '0 8px', opacity: isFetching ? 0.6 : 1 }}
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
                      Loading loan classifications...
                    </Text>
                  </Stack>
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
                      <IconFileText size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No classifications found.
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
                    onDoubleClick={canReadLoan ? () => handleView(row.original) : undefined}
                    style={{ cursor: canReadLoan ? 'pointer' : 'default' }}
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
                onChange={(v) => {
                  setPageSize(Number(v) || 10);
                  setPage(1);
                }}
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
            onChange={(p) => setPage(p)}
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