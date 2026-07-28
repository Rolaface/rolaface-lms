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
  Badge,
  ActionIcon,
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
  IconFileOff,
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
import { LoanTransferModal, type LoanTransferFormData } from '../../../components/Modal/LoanTransferModal';

interface TransferRow {
  id: number;
  transferDate: string;
  fromBranch: string;
  toBranch: string;
  loansCount: number;
  status: 'COMPLETED' | 'PENDING';
}

const DUMMY_TRANSFERS: TransferRow[] = [
  {
    id: 1,
    transferDate: '2026-07-28',
    fromBranch: 'Lusaka Main',
    toBranch: 'Ndola',
    loansCount: 12,
    status: 'COMPLETED',
  },
  {
    id: 2,
    transferDate: '2026-07-29',
    fromBranch: 'Kitwe',
    toBranch: 'Lusaka Main',
    loansCount: 3,
    status: 'PENDING',
  },
  {
    id: 3,
    transferDate: '2026-07-25',
    fromBranch: 'Ndola',
    toBranch: 'Livingstone',
    loansCount: 8,
    status: 'COMPLETED',
  },
];

const columnHelper = createColumnHelper<TransferRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanTransfer() {
  const [opened, { open, close }] = useDisclosure(false);

  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState([{ id: 'transferDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState(DUMMY_TRANSFERS);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch = !q;
      const matchesBranch = !branch || r.fromBranch === branch || r.toBranch === branch;
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [rowsData, search, branch, status]);

  const handleDelete = (id: number) => {
    setRowsData((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddTransfer = (formData: LoanTransferFormData) => {
    setRowsData((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        transferDate: formData.transferDate,
        fromBranch: formData.fromBranch,
        toBranch: formData.toBranch,
        loansCount: formData.loans.length,
        status: 'PENDING',
      },
    ]);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('transferDate', {
        header: 'Transfer Date',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('fromBranch', {
        header: 'From Branch',
        cell: (info) => (
          <Text fz="xs" c="gray.7" fw={500}>
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('toBranch', {
        header: 'To Branch',
        cell: (info) => (
          <Text fz="xs" c="gray.7" fw={500}>
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loansCount', {
        header: 'Loans Included',
        cell: (info) => (
          <Badge variant="light" color="indigo" size="sm" styles={{ root: { fontSize: 10 } }}>
            {info.getValue()} Loans
          </Badge>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={info.getValue() === 'COMPLETED' ? 'green' : 'yellow'}
            className="font-semibold tracking-wider"
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
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
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => handleDelete(row.id)}
                >
                  <IconTrash size={14} />
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
    setBranch(null);
    setStatus('all');
  };

  const branchOptions = Array.from(
    new Set([...DUMMY_TRANSFERS.map((r) => r.fromBranch), ...DUMMY_TRANSFERS.map((r) => r.toBranch)])
  );

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanTransferModal opened={opened} onClose={close} onSubmit={handleAddTransfer} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Transfers
        </Title>
        <Button
          size="xs"
          onClick={open}
          className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          New Transfer
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Search Transfer Ref"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[200px]"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="Any Branch"
            data={branchOptions}
            className="w-44"
            searchable
            clearable
            rightSection={chevronDown}
            value={branch}
            onChange={(v) => {
              setBranch(v);
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
              <Radio size="xs" value="all" label="All" color="indigo" />
              <Radio size="xs" value="COMPLETED" label="Completed" color="indigo" />
              <Radio size="xs" value="PENDING" label="Pending" color="indigo" />
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
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <IconFileOff size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No transfers match your filters.
                    </Text>
                  </div>
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
            color="indigo"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>
    </Box>
  );
}