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
  Switch,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Avatar,
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
  IconShieldLock,
  IconTrash,
  IconCoin,
  IconPercentage,
  IconGauge,
  IconCoins,
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
  getAllCollaterals,
  enableCollateral,
  disableCollateral,
  deleteCollateral,
} from '../../api/collateralApi';
import { openCommonModal } from '../../components/Modal/AlertModal';
import { parseFrappeError } from '../../utils/parseFrappeError';
import { collateralModal } from '../../components/Modal/collateralModalStore';

interface CollateralRow {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
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

function NameCell({ name, type }: { name: string; type: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Group gap={10} wrap="nowrap">
      <Avatar
        size={34}
        radius="md"
        variant="light"
        color="brand"
        style={{ fontSize: 12, fontWeight: 700, flexShrink: 0 }}
      >
        {initials || <IconShieldLock size={16} />}
      </Avatar>
      <Box>
        <Text fz="sm" fw={700} c="slate.8">
          {name}
        </Text>
        <Text fz="xs" c="slate.5">
          {type}
        </Text>
      </Box>
    </Group>
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

export function Collateral() {
  const theme = useMantineTheme();

  // filter state
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: collateralResponse, isLoading } = useQuery({
    queryKey: ['collaterals'],
    queryFn: getAllCollaterals,
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

  const { mutate: enableItem, isPending: isEnabling } = useMutation({
    mutationFn: (id: string) => enableCollateral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaterals'] });
      showSuccess('Collateral Activated', 'Collateral has been activated successfully.');
    },
    onError: (error: any) => showError('Status Update Failed', error),
  });

  const { mutate: disableItem, isPending: isDisabling } = useMutation({
    mutationFn: (id: string) => disableCollateral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaterals'] });
      showSuccess('Collateral Disabled', 'Collateral has been disabled successfully.');
    },
    onError: (error: any) => showError('Status Update Failed', error),
  });

  const { mutate: removeItem, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCollateral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaterals'] });
      showSuccess('Collateral Deleted', 'Collateral deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const handleDelete = (row: CollateralRow) => {
    openCommonModal({
      heading: 'Delete Collateral',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete collateral{' '}
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
            removeItem(row.id);
          },
        },
      ],
    });
  };

  const data = useMemo(() => {
    const list = collateralResponse?.data || collateralResponse?.message?.data || collateralResponse || [];
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      id: item.name,
      code: item.loan_security_code,
      name: item.loan_security_name,
      type: item.loan_security_type,
      value: item.original_security_value ?? 0,
      haircut: item.haircut ?? 0,
      ltv: item.loan_to_value_ratio ?? 0,
      status: item.disabled === 1 ? 'DISABLED' : 'ACTIVE',
    }));
  }, [collateralResponse]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchesType = !type || c.type === type;
      const matchesStatus =
        status === 'all' ||
        (status === 'ACTIVE' && c.status === 'ACTIVE') ||
        (status === 'DISABLED' && c.status === 'DISABLED');
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, type, status]);

  const handleToggleStatus = (row: CollateralRow) => {
    const willDisable = row.status === 'ACTIVE';
    openCommonModal({
      heading: willDisable ? 'Disable Collateral' : 'Activate Collateral',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to {willDisable ? 'disable' : 'activate'} collateral{' '}
          <Text span fw={600}>
            {row.name}
          </Text>
          ?
        </>
      ),
      color: willDisable ? 'red' : 'green',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: willDisable ? 'Disable' : 'Activate',
          color: willDisable ? 'red' : 'green',
          onClick: () => {
            if (willDisable) {
              disableItem(row.id);
            } else {
              enableItem(row.id);
            }
          },
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Collateral',
        cell: (info) => <NameCell name={info.getValue()} type={info.row.original.type} />,
      }),
      columnHelper.accessor('code', {
        header: 'Code',
        cell: (info) => (
          <IconText icon={<IconShieldLock size={13} />} mono>
            {info.getValue()}
          </IconText>
        ),
      }),
      columnHelper.accessor('value', {
        header: 'Orig. Value',
        cell: (info) => (
          <IconText icon={<IconCoin size={13} />}>${info.getValue().toLocaleString()}</IconText>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('haircut', {
        header: 'Haircut %',
        cell: (info) => (
          <IconText icon={<IconPercentage size={13} />}>{info.getValue().toFixed(3)}</IconText>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('ltv', {
        header: 'LTV %',
        cell: (info) => (
          <IconText icon={<IconGauge size={13} />}>{info.getValue()}%</IconText>
        ),
        sortingFn: 'basic',
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
          const isActive = row.status === 'ACTIVE';
          const isTogglingStatus = isEnabling || isDisabling;
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => collateralModal.open({ editId: row.id, isView: true })}
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
                  onClick={() => collateralModal.open({ editId: row.id, isView: false })}
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
              <Tooltip label={isActive ? 'Disable' : 'Activate'} withArrow>
                <Switch
                  size="xs"
                  color="success"
                  checked={isActive}
                  disabled={isTogglingStatus}
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
    setType(null);
    setStatus('all');
  };

  const typeOptions = Array.from(new Set(data.map((c) => c.type).filter(Boolean)));

  return (
    <Stack gap="lg" p="lg">
      {/* Scoped, purely visual — mirrors the Customers module styling,
          pulling from theme.other instead of one-off literals. */}
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
            <IconCoins size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Collaterals
            </Title>
            <Text fz="sm" c="slate.5">
              Manage pledged assets and valuation metrics
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search + pill filters + segmented status control */}
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
            placeholder="Code / Name"
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
            placeholder="All Types"
            data={typeOptions}
            w={180}
            searchable
            clearable
            rightSection={chevronDown}
            value={type}
            onChange={(v) => {
              setType(v);
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
              { label: 'Disabled', value: 'DISABLED' },
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
              onClick={() => collateralModal.open({ editId: null, isView: false })}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Add Collateral
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
                      Loading collaterals...
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
                      <IconShieldLock size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No collaterals match your filters.
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
          />
        </Group>
      </Paper>
    </Stack>
  );
}