import { useMemo, useState } from 'react';
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
import { useDisclosure } from '@mantine/hooks';
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

import { LoanClassificationModal } from '../../../components/Modal/LoanClassificationModal';
import type { LoanClassificationData } from '../../../types/loanClassification';
import {
  getAllLoanClassifications,
  deleteLoanClassification,
} from '../../../api/LoanClassificationApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';

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

  const [opened, { open, close }] = useDisclosure(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedData, setSelectedData] = useState<LoanClassificationData | null>(null);

  const handleOpenModal = (
    mode: 'add' | 'edit' | 'view',
    data: LoanClassificationData | null = null
  ) => {
    setModalMode(mode);
    setSelectedData(data);
    open();
  };

  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState(DEFAULT_SORTING);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: classifications = EMPTY_CLASSIFICATIONS, isLoading } = useQuery({
    queryKey: ['loanClassifications'],
    queryFn: () => getAllLoanClassifications(),
    retry: false,
  });

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

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classifications.filter((c) => {
      const matchesSearch = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [classifications, search]);

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
        )      }),
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
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => handleOpenModal('view', row)}
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
                  onClick={() => handleOpenModal('edit', row)}
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
                  loading={isDeleting}
                  onClick={() => handleDelete(row)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDeleting]
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
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <Stack gap="lg" p="lg">
      <LoanClassificationModal opened={opened} onClose={close} mode={modalMode} data={selectedData} />

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
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => handleOpenModal('add')}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Add Classification
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