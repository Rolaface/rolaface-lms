import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  SegmentedControl,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Switch,
  Text,
  Pagination,
  Tooltip,
  Select,
  Title,
  Stack,
  Loader,
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
  IconCategory,
  IconTag,
  IconTrash,
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
import type { SortDirection, SortingState, PaginationState } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AddLoanCategoryModal } from '../../../components/Modal/Lending Setup Modal/AddLoanCategoryModel';
import type { LoanCategoryFormData } from '../../../components/Modal/Lending Setup Modal/AddLoanCategoryModel';
import {
  getAllLoanCategories,
  deleteLoanCategory,
  enableDisableLoanCategory,
} from '../../../api/loanCategoryApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';

type LoanStatus = 'ACTIVE' | 'INACTIVE';

interface LoanCategoryRow {
  id: string; // maps to 'name' (docname)
  name: string; // loan_category_name
  code: string; // loan_category_code
  status: LoanStatus;
}

const columnHelper = createColumnHelper<LoanCategoryRow>();

function SortIcon({ sorted }: { sorted: false | SortDirection }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ status }: { status: LoanStatus }) {
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

export function LoanCategory() {
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<LoanCategoryFormData | null>(null);
  const [isView, setIsView] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const {
    data: res,
    isLoading,
    refetch: fetchCategories,
  } = useQuery({
    queryKey: ['loanCategories'],
    queryFn: () => getAllLoanCategories(),
  });

  const rowsData: LoanCategoryRow[] = useMemo(() => {
    const list = Array.isArray(res?.data?.categories) ? res.data.categories : [];

    return list.map((item: any) => ({
      id: item.name || '',
      name: item.loan_category_name || '—',
      code: item.loan_category_code || '—',
      status: Number(item.disabled) === 1 ? 'INACTIVE' : 'ACTIVE',
    }));
  }, [res]);

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

  const deleteMutation = useMutation({
    mutationFn: deleteLoanCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanCategories'] });
      showSuccess('Category Deleted', 'Loan category deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const enableDisableMutation = useMutation({
    mutationFn: enableDisableLoanCategory,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loanCategories'] });
      showSuccess(
        variables.disabled === 1 ? 'Category Deactivated' : 'Category Activated',
        `Loan category has been ${variables.disabled === 1 ? 'deactivated' : 'activated'} successfully.`
      );
    },
    onError: (error: any) => showError('Status Update Failed', error),
  });

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || c.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [rowsData, search, status]);

  const handleAdd = () => {
    setEditId(null);
    setEditData(null);
    setIsView(false);
    open();
  };

  const handleEdit = (row: LoanCategoryRow) => {
    setEditId(row.id);
    setEditData({ code: row.code, name: row.name });
    setIsView(false);
    open();
  };

  const handleView = (row: LoanCategoryRow) => {
    setEditId(row.id);
    setEditData({ code: row.code, name: row.name });
    setIsView(true);
    open();
  };

  const handleModalClose = () => {
    setEditId(null);
    setEditData(null);
    setIsView(false);
    close();
  };

  const toggleStatus = (row: LoanCategoryRow) => {
    const nextDisabled = row.status === 'ACTIVE' ? 1 : 0;
    openCommonModal({
      heading: nextDisabled === 1 ? 'Deactivate Loan Category' : 'Activate Loan Category',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to {nextDisabled === 1 ? 'deactivate' : 'activate'} loan category{' '}
          <Text span fw={600}>
            {row.name}
          </Text>
          ?
        </>
      ),
      color: nextDisabled === 1 ? 'red' : 'green',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: nextDisabled === 1 ? 'Deactivate' : 'Activate',
          color: nextDisabled === 1 ? 'red' : 'green',
          onClick: () => {
            enableDisableMutation.mutate({ name: row.id, disabled: nextDisabled });
          },
        },
      ],
    });
  };

  const handleDelete = (row: LoanCategoryRow) => {
    openCommonModal({
      heading: 'Delete Loan Category',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete loan category{' '}
          <Text span fw={600}>
            {row.name}
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
            deleteMutation.mutate(row.id);
          },
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Category Name',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => <IconText icon={<IconTag size={13} />} mono>{info.getValue()}</IconText>,
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
          const isDeleting = deleteMutation.isPending && deleteMutation.variables === row.id;
          const isTogglingStatus =
            enableDisableMutation.isPending && enableDisableMutation.variables?.name === row.id;

          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="slate" radius="md" onClick={() => handleView(row)}>
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon size="sm" variant="subtle" color="brand" radius="md" onClick={() => handleEdit(row)}>
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
              <Tooltip label={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} withArrow>
                <Switch
                  size="xs"
                  color="success"
                  checked={row.status === 'ACTIVE'}
                  disabled={isTogglingStatus}
                  onChange={() => toggleStatus(row)}
                />
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    [deleteMutation, enableDisableMutation]
  );

  const table = useReactTable<LoanCategoryRow>({
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
    setStatus('all');
  };

  return (
    <Stack gap="lg" p="lg">
      <AddLoanCategoryModal
        opened={opened}
        onClose={handleModalClose}
        editId={editId}
        initialData={editData}
        isView={isView}
      />

      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

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
            <IconCategory size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Categories
            </Title>
            <Text fz="sm" c="slate.5">
              Manage lending category setup
            </Text>
          </Stack>
        </Group>
      </Group>

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
            placeholder="Category Name / Code"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
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
              onClick={handleAdd}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Add Category
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader size="sm" color="brand" />
          </div>
        ) : (
          <>
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
                          <IconCategory size={26} color="var(--mantine-color-slate-4)" />
                        </Box>
                        <Text ta="center" c="slate.5" fz="xs">
                          No categories match your filters.
                        </Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => {
                    const isActive = row.original.status === 'ACTIVE';
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
          </>
        )}
      </Paper>
    </Stack>
  );
}