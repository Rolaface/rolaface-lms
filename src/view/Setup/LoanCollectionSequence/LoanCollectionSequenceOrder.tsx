import { useMemo, useState } from 'react';
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
import type { SortDirection } from '@tanstack/react-table';
import { LoanCollectionSequenceOrderModal } from '../../../components/Modal/LoanCollectionSequenceOrderModal';

interface SequenceRow {
  id: number;
  sequenceName: string;
  order: string[];
}

const DUMMY_SEQUENCES: SequenceRow[] = [
  {
    id: 1,
    sequenceName: 'Standard Settlement Order',
    order: ['Principal', 'Interest', 'Penalty', 'Charges'],
  },
  {
    id: 2,
    sequenceName: 'Penalty First Order',
    order: ['Penalty', 'Charges', 'Interest', 'Principal'],
  },
  {
    id: 3,
    sequenceName: 'Interest Heavy Offset',
    order: ['Interest', 'Principal', 'Penalty', 'Charges'],
  },
];

const columnHelper = createColumnHelper<SequenceRow>();

function SortIcon({ sorted }: { sorted: false | SortDirection }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function LoanCollectionSequenceOrder() {
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedData, setSelectedData] = useState<SequenceRow | null>(null);

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', data: SequenceRow | null = null) => {
    setModalMode(mode);
    setSelectedData(data);
    open();
  };

  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState([{ id: 'sequenceName', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DUMMY_SEQUENCES.filter((p) => !q || p.sequenceName.toLowerCase().includes(q));
  }, [search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('sequenceName', {
        header: 'Sequence Name',
        cell: (info) => (
          <Group gap={10} wrap="nowrap">
            <Box
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--mantine-radius-md)',
                background: 'var(--mantine-color-brand-0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconListNumbers size={15} color="var(--mantine-color-brand-6)" />
            </Box>
            <Text fz="sm" fw={700} c="slate.8">
              {info.getValue()}
            </Text>
          </Group>
        ),
      }),
      columnHelper.accessor('order', {
        header: 'Component Order',
        cell: (info) => {
          const items = info.getValue();
          return (
            <Group gap={4} wrap="wrap">
              {items.map((item, index) => (
                <Group gap={4} key={index} wrap="nowrap">
                  <Badge
                    variant="light"
                    color="brand"
                    radius="sm"
                    size="sm"
                    styles={{ root: { fontSize: 10, padding: '0 8px', fontWeight: 600 } }}
                  >
                    {item}
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
        cell: (info) => (
          <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
            <Tooltip label="View" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="slate"
                radius="md"
                onClick={() => handleOpenModal('view', info.row.original)}
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
                onClick={() => handleOpenModal('edit', info.row.original)}
              >
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
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
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <Stack gap="lg" p="lg">
      <LoanCollectionSequenceOrderModal
        opened={opened}
        onClose={close}
        mode={modalMode}
        data={selectedData}
      />

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
            <IconListNumbers size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Collection Sequence Order
            </Title>
            <Text fz="sm" c="slate.5">
              Define component liquidation order
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
            placeholder="Search Sequence Name"
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
              Add Sequence
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
                      <IconListNumbers size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No sequences match your search.
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
          />
        </Group>
      </Paper>
    </Stack>
  );
}