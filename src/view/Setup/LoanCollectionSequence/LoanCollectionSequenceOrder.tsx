import { useMemo } from 'react';
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
  Badge,
  Select,
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
  IconListNumbers,
  IconTrash,
} from '@tabler/icons-react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { useCollectionOrders } from '../../../hooks/CollectionOrder/useCollectionOrders';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import type { CollectionOrderListItem, CollectionOrderSort } from '../../../types/collectionOrder';
import { collectionSequenceOrderModal } from './LoanCollectionSequenceOrderStore';

const columnHelper = createColumnHelper<CollectionOrderListItem>();

function SortIcon({ active, direction }: { active: boolean; direction: CollectionOrderSort['direction'] }) {
  const color = active ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (!active) return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
  return direction === 'asc' ? <IconChevronUp size={12} color={color} /> : <IconChevronDown size={12} color={color} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function LoanCollectionSequenceOrder() {
  const theme = useMantineTheme();

  const {
    rows,
    pagination,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sort,
    toggleSort,
    resetFilters,
    refetch,
    removeCollectionOrder,
    deletingName,
  } = useCollectionOrders();

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', data: CollectionOrderListItem | null = null) => {
    collectionSequenceOrderModal.open({ mode, data, onSaved: refetch });
  };

  const handleDelete = (row: CollectionOrderListItem) => {
    openCommonModal({
      heading: 'Delete Collection Sequence',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete sequence{' '}
          <Text span fw={600}>
            {row.title}
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
            removeCollectionOrder(row.name);
          },
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Sequence Name',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('components', {
        header: 'Component Offset Sequence',
        enableSorting: false,
        cell: (info) => {
          const items = info.getValue();
          return (
            <Group gap={4} wrap="wrap">
              {items.map((item, index) => (
                <Group gap={4} key={item.idx} wrap="nowrap">
                  <Badge
                    variant="light"
                    color="brand"
                    radius="sm"
                    size="sm"
                    styles={{ root: { fontSize: 10, padding: '0 8px', fontWeight: 600 } }}
                  >
                    {item.demand_type}
                  </Badge>
                  {index < items.length - 1 && (
                    <Text size="xs" c="slate.4">
                      →
                    </Text>
                  )}
                </Group>
              ))}
            </Group>
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
                  loading={deletingName === row.name}
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
    [deletingName]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.name,
    manualSorting: true,
    manualPagination: true,
  });

  const totalRows = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  return (
    <Stack gap="lg" p="lg">
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
            <IconListNumbers size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Collection Offset Sequence
            </Title>
            <Text fz="sm" c="slate.5">
              Define component liquidation sequence
            </Text>
          </Stack>
        </Group>
      </Group>

      <Paper
        radius="xl"
        p="xs"
        style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Search Sequence Name"
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
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => handleOpenModal('add')}
              leftSection={<IconPlus size={14} />}
              style={{ background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadowSm }}
            >
              Add Sequence
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}
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
                  const canSort = header.column.id === 'title';
                  const isActive = sort.field === 'title' && canSort;
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
                      onClick={canSort ? () => toggleSort('title') : undefined}
                    >
                      <Group gap="xs" wrap="nowrap" justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon active={isActive} direction={sort.direction} />}
                      </Group>
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <Loader size="sm" color="brand" />
                    <Text ta="center" c="slate.5" fz="xs">
                      Loading collection sequences...
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : error ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <Text ta="center" c="danger.6" fz="xs">
                      {error}
                    </Text>
                    <Button size="xs" variant="light" radius="xl" onClick={refetch}>
                      Retry
                    </Button>
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
                      <IconListNumbers size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No sequences match your search.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id} className="lms-row">
                  {row.getVisibleCells().map((cell, idx) => (
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
              ))
            )}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
            <span>{totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => setPageSize(Number(v) || 10)}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination total={totalPages || 1} value={page} onChange={setPage} color="brand" size="xs" radius="xl" />
        </Group>
      </Paper>
    </Stack>
  );
}