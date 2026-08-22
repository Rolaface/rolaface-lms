import { useMemo, useState, useEffect } from 'react'; import { useDebouncedValue } from '@mantine/hooks';
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
  Switch,
  Text,
  Pagination,
  Tooltip,
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
  IconTrash,
  IconShieldCheck,
  IconBox,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllCollateralTypes,
  enableCollateralType,
  disableCollateralType,
  deleteCollateralType,
} from '../../../api/collateralTypeApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';
import { collateralTypeModal } from '../../../components/Modal/collateralTypeModalStore';

interface CollateralRow {
  id: string;
  type: string;
  haircut: number;
  ltv: number;
  status: string;
}

const columnHelper = createColumnHelper<CollateralRow>();

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

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

// Maps the UI's "all | active | disabled" segmented control to the API's `disabled` param.
// Returns undefined for "all" so we don't send the param at all.
function statusToDisabledParam(status: string): 0 | 1 | undefined {
  if (status === 'active') return 0;
  if (status === 'disabled') return 1;
  return undefined;
}

export function CollateralType() {
  const theme = useMantineTheme();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState([{ id: 'type', desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const disabledParam = statusToDisabledParam(status);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, disabledParam]);

  const { data: collateralResponse, isLoading, isFetching } = useQuery({
    queryKey: ['collateralTypes', debouncedSearch, disabledParam, page, pageSize],
    queryFn: () =>
      getAllCollateralTypes({
        search: debouncedSearch.trim() || undefined,
        disabled: disabledParam,
        page,
        page_size: pageSize,
      }),
    placeholderData: (previousData) => previousData,
  });

  const queryClient = useQueryClient();

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

  const { mutate: enableType, isPending: isEnabling } = useMutation({
    mutationFn: (id: string) => enableCollateralType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collateralTypes'] });
      showSuccess('Collateral Type Activated', 'Collateral type has been marked active successfully.');
    },
    onError: (error: any) => showError('Status Update Failed', error),
  });

  const { mutate: disableType, isPending: isDisabling } = useMutation({
    mutationFn: (id: string) => disableCollateralType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collateralTypes'] });
      showSuccess('Collateral Type Inactivated', 'Collateral type has been marked inactive successfully.');
    },
    onError: (error: any) => showError('Status Update Failed', error),
  });
  const { mutate: removeType, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCollateralType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collateralTypes'] });
      showSuccess('Collateral Type Deleted', 'Collateral type deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const handleDelete = (row: CollateralRow) => {
    openCommonModal({
      heading: 'Delete Collateral Type',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete collateral type{' '}
          <Text span fw={600}>
            {row.type}
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
            removeType(row.id);
          },
        },
      ],
    });
  };

  // Data now arrives pre-filtered from the API (search + disabled params),
  // so this only needs to map the response shape into rows — no client-side filtering.
  const data = useMemo(() => {
    const list = collateralResponse?.data || collateralResponse?.message?.data || collateralResponse || [];
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      id: item.name,
      type: item.loan_security_type,
      haircut: item.haircut ?? 0,
      ltv: item.loan_to_value_ratio ?? 0,
      status: item.disabled === 1 ? 'DISABLED' : 'ACTIVE',
    }));
  }, [collateralResponse]);

  const handleToggleStatus = (row: CollateralRow) => {
    const willDisable = row.status === 'ACTIVE';
    openCommonModal({
      heading: willDisable ? 'Mark as Inactive' : 'Mark as Active',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to mark collateral type{' '}
          <Text span fw={600}>
            {row.type}
          </Text>{' '}
          as {willDisable ? 'inactive' : 'active'}?
        </>
      ),
      color: willDisable ? 'red' : 'green',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: willDisable ? 'Inactive' : 'Active',
          color: willDisable ? 'red' : 'green',
          onClick: () => {
            if (willDisable) {
              disableType(row.id);
            } else {
              enableType(row.id);
            }
          },
        },
      ],
    });
  };

  // Shared by the eye icon and the row double-click handler — matches the
  // ERP's "double-click a row to view" convention (see LoanDisbursement).
  const handleView = (row: CollateralRow) => {
    collateralTypeModal.open({ editId: row.id, isView: true });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: 'Collateral Type',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('haircut', {
        header: 'Haircut %',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue().toFixed(3)}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('ltv', {
        header: 'Loan to Value Ratio',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}%
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'} />,
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
          const isActive = row.status === 'ACTIVE';
          const isTogglingStatus =
            (isEnabling || isDisabling);
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
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
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="brand"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    collateralTypeModal.open({ editId: row.id, isView: false });
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row);
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isActive ? 'Inactive' : 'Active'} withArrow>
                <Switch
                  size="xs"
                  color="success"
                  checked={isActive}
                  disabled={isTogglingStatus}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggleStatus(row)}
                />
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    [isDeleting, isEnabling, isDisabling]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = collateralResponse?.pagination?.total ?? 0;
  const totalPages = collateralResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);
  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  return (
    <Stack gap="lg" p="lg">

      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* Header — icon tile + title, same pattern as Customers / Loan Products */}
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
            <IconBox size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Collateral Types
            </Title>
            <Text fz="sm" c="slate.5">
              Manage collateral categories and lending limits
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search + segmented status control */}
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
            placeholder="Search Collateral Types"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={setStatus}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'disabled' },
            ]}
          />

          <Button size="sm" radius="xl" variant="default" px="md" ml="auto" onClick={resetFilters}>
            Reset
          </Button>

          <Button
            size="sm"
            radius="xl"
            color="brand"
            onClick={() => {
              collateralTypeModal.open({ editId: null, isView: false });
            }}
            leftSection={<IconPlus size={14} />}
            style={{
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            Add Collateral Type
          </Button>
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
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : (
          <>
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
                          <IconShieldCheck size={24} color="var(--mantine-color-slate-4)" />
                        </Box>
                        <Text ta="center" c="slate.5" fz="xs">
                          No collateral types match your filters.
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
                        onDoubleClick={() => handleView(row.original)}
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
          </>
        )}
      </Paper>
    </Stack>
  );
}