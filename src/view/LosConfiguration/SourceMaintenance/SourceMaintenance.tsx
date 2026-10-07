import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  Stack,
  Avatar,
  Loader,
  TextInput,
  useMantineTheme,
  Switch,
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconTrash,
  IconSearch,
  IconBuildingStore,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSources,
  deleteSource,
  enableSource,
  disableSource,
} from '../../../api/LosConfiguration/sourceApi';
import type { Source } from '../../../api/LosConfiguration/sourceApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';
import { sourceModal } from '../../../components/Modal/sourceModalStore';
import { useDebouncedValue } from '@mantine/hooks';

interface SourceRow {
  id: string;
  name: string;
  channel_name: string;
  status: string;
  modified: string;
}

const columnHelper = createColumnHelper<SourceRow>();

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
        {initials || <IconBuildingStore size={16} />}
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

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

function statusToDisabledParam(status: string): 0 | 1 | undefined {
  if (status === 'active') return 0;
  if (status === 'disabled') return 1;
  return undefined;
}

export function SourceMaintenance() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState([{ id: 'channel_name', desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const isActiveParam = status === 'active' ? 1 : status === 'disabled' ? 0 : undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isActiveParam]);

  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ['sources', debouncedSearch, isActiveParam, page, pageSize],
    queryFn: () => getSources({
      search: debouncedSearch.trim() || undefined,
      is_active: isActiveParam,
      page,
      page_size: pageSize,
    }),
    placeholderData: (prev) => prev,
  });

  const data: SourceRow[] = useMemo(() => {
    const list = Array.isArray(responseData) ? responseData : (responseData?.data || []);
    return list.map((s: any) => ({
      id: s.name || s.channel_name,
      name: s.name || s.channel_name,
      channel_name: s.channel_name,
      status: Number(s.is_active) === 1 ? 'ACTIVE' : 'INACTIVE',
      modified: s.modified ? new Date(s.modified).toLocaleDateString() : '—',
    }));
  }, [responseData]);

  // If server returns total, use it, else default to length
  const totalRows = !Array.isArray(responseData) && responseData?.total !== undefined 
    ? responseData.total 
    : data.length;
    
  const totalPages = !Array.isArray(responseData) && responseData?.total_pages !== undefined
    ? responseData.total_pages
    : Math.ceil(totalRows / pageSize) || 1;

  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);
  
  // Since we fetch page-by-page from the server, we just pass all data to the table
  const pageData = data;

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: 'red',
      buttons: [{ label: 'OK', color: 'red' }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'OK', color: 'green' }],
    });
  };

  const { mutate: removeItem, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      showSuccess('Source Deleted', 'Source deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const handleDelete = (row: SourceRow) => {
    openCommonModal({
      heading: 'Delete Source',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete source{' '}
          <Text span fw={600}>
            {row.channel_name}
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
          onClick: () => removeItem(row.name),
        },
      ],
    });
  };

  const handleView = (row: SourceRow) => {
    sourceModal.open({ editId: row.name, isView: true });
  };

  const handleToggleStatus = (row: SourceRow) => {
    const willDisable = row.status === 'ACTIVE';
    openCommonModal({
      heading: willDisable ? 'Mark as Inactive' : 'Mark as Active',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to mark source{' '}
          <Text span fw={600}>
            {row.channel_name}
          </Text>{' '}
          as {willDisable ? 'inactive' : 'active'}?
        </>
      ),
      color: 'blue',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: 'Confirm',
          color: 'blue',
          onClick: async () => {
            try {
              if (willDisable) {
                await disableSource(row.name);
              } else {
                await enableSource(row.name);
              }
              queryClient.invalidateQueries({ queryKey: ['sources'] });
              showSuccess('Status Updated', `Source has been marked ${willDisable ? 'inactive' : 'active'} successfully.`);
            } catch (error: any) {
              showError('Status Update Failed', error);
            }
          },
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('channel_name', {
        header: 'Source Name',
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('modified', {
        header: 'Last Updated',
        cell: (info) => (
          <Text fz="xs" c="slate.6" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {info.getValue()}
          </Text>
        ),
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
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
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
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    sourceModal.open({ editId: row.name });
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row);
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Switch
                size="sm"
                color="success"
                checked={isActive}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(row);
                }}
                ml="xs"
              />
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const table = useReactTable({
    data: pageData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

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

      {/* Header */}
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
            <IconBuildingStore size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Text component="h2" m={0} c="slate.8" fw={700} fz="h2">
              Source Maintenance
            </Text>
            <Text fz="sm" c="slate.5">
              Manage loan application sources
            </Text>
          </Stack>
        </Group>
      </Group>

      <Paper 
        radius="xl" 
        p="xs" 
        style={{ 
          background: 'var(--mantine-color-slate-0)', 
          border: '1px solid var(--mantine-color-slate-2)' 
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Search Sources"
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
            onClick={() => sourceModal.open({ editId: null, isView: false })}
            leftSection={<IconPlus size={14} />}
            style={{
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            Add Source
          </Button>
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        pos="relative"
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
            <Box
              style={{
                height: 'clamp(320px, calc(100vh - 280px), 720px)',
                overflowY: 'auto',
                opacity: isFetching ? 0.6 : 1,
                transition: 'opacity 120ms ease',
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
                            className="lms-thead-cell"
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
                            <IconBuildingStore size={26} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No sources match your filters.
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
            </Box>
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