import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  Radio,
  Group,
  Paper,
  Table,
  ActionIcon,
  Switch,
  Text,
  Pagination,
  Tooltip,
  Title,
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
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
import { LoanClassificationModal } from '../../../components/Modal/LoanClassificationModal';

const DUMMY_CLASSIFICATIONS = [
  { id: 1, code: 'STD', name: 'Standard', status: 'ACTIVE' },
  { id: 2, code: 'WTC', name: 'Watch', status: 'ACTIVE' },
  { id: 3, code: 'SUB', name: 'Substandard', status: 'ACTIVE' },
  { id: 4, code: 'DBT', name: 'Doubtful', status: 'ACTIVE' },
  { id: 5, code: 'LSS', name: 'Loss', status: 'DISABLED' },
];

const columnHelper = createColumnHelper();

function SortIcon({ sorted }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanClassification() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'code', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // local status map for optimistic updates (used by the switch in actions)
  const [statusOverrides, setStatusOverrides] = useState({});

  const data = useMemo(
    () =>
      DUMMY_CLASSIFICATIONS.map((c) => ({
        ...c,
        status: statusOverrides[c.id] ?? c.status,
      })),
    [statusOverrides]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      const matchesSearch = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && c.status === 'ACTIVE') ||
        (status === 'disabled' && c.status === 'DISABLED');
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  const toggleStatus = (id, currentStatus) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [id]: currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
    }));
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Classification Code',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Classification Name',
        cell: (info) => (
          <Text fz="xs" fw={500} c="gray.9">
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
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray">
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon size="sm" variant="subtle" color="blue">
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
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
    setStatus('all');
  };

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanClassificationModal opened={opened} onClose={close} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Classifications
        </Title>
        <Button
          size="xs"
          bg="indigoAlt.4"
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          onClick={open}
          leftSection={<IconPlus size={14} />}
        >
          Add Classification
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Search Code or Name"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[250px] max-w-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <Radio.Group
            name="status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <Group gap="sm">
              <Radio size="xs" value="all" label="All" color="indigoAlt.4" />
              <Radio size="xs" value="active" label="Active" color="indigoAlt.4" />
              <Radio size="xs" value="disabled" label="Disabled" color="indigoAlt.4" />
            </Group>
          </Radio.Group>

          <Button size="xs" variant="default" className="ml-auto px-4" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Paper>

      {/* Data Table */}
      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      className={`text-gray-600 font-semibold select-none ${
                        canSort ? 'cursor-pointer' : ''
                      }`}
                      style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Group
                        gap={4}
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
                <Table.Td colSpan={columns.length}>
                  <Text ta="center" c="dimmed" fz="xs" py="sm">
                    No classifications match your filters.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} style={{ padding: '5px 10px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <Select
                data={['10', '20', '50']}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                rightSection={chevronDown}
                size="xs"
                className="w-14"
              />
            </div>
          </div>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="indigoAlt.4"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>
    </Box>
  );
}