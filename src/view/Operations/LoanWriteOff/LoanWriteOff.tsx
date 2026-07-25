// LoanWriteOff.tsx
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
import { LoanWriteOffModal, type LoanWriteOffFormData } from '../../../components/Modal/LoanWriteOffModal';

interface WriteOffRow {
  id: number;
  loanAc: string;
  customer: string;
  classification: string;
  dpd: number;
  principalOutstanding: number;
  writeOffAmount: number;
  writeOffPercentage: number;
  valueDate: string;
  status: 'WRITTEN_OFF' | 'PENDING';
}

const DUMMY_WRITE_OFFS: WriteOffRow[] = [
  {
    id: 1,
    loanAc: 'LN-2024-00187',
    customer: 'Rohan Mehta',
    classification: 'Sub-Standard',
    dpd: 132,
    principalOutstanding: 486250,
    writeOffAmount: 48625,
    writeOffPercentage: 10,
    valueDate: '2026-07-24',
    status: 'PENDING',
  },
  {
    id: 2,
    loanAc: 'LN-2024-00092',
    customer: 'Chanda Mwansa',
    classification: 'Doubtful',
    dpd: 210,
    principalOutstanding: 156000,
    writeOffAmount: 156000,
    writeOffPercentage: 100,
    valueDate: '2026-06-15',
    status: 'WRITTEN_OFF',
  },
  {
    id: 3,
    loanAc: 'LN-2024-00145',
    customer: 'Bwalya Enterprises Ltd',
    classification: 'Loss',
    dpd: 365,
    principalOutstanding: 720000,
    writeOffAmount: 720000,
    writeOffPercentage: 100,
    valueDate: '2026-05-02',
    status: 'WRITTEN_OFF',
  },
  {
    id: 4,
    loanAc: 'LN-2024-00201',
    customer: 'Natasha Phiri',
    classification: 'Sub-Standard',
    dpd: 98,
    principalOutstanding: 92500,
    writeOffAmount: 9250,
    writeOffPercentage: 10,
    valueDate: '2026-07-18',
    status: 'PENDING',
  },
];

const columnHelper = createColumnHelper<WriteOffRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

function classificationColor(classification: string) {
  if (classification === 'Sub-Standard') return 'yellow';
  if (classification === 'Doubtful') return 'orange';
  if (classification === 'Loss') return 'red';
  return 'gray';
}

export function LoanWriteOff() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState(DUMMY_WRITE_OFFS);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch =
        !q ||
        r.customer.toLowerCase().includes(q) ||
        r.loanAc.toLowerCase().includes(q);
      const matchesClassification = !classification || r.classification === classification;
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesClassification && matchesStatus;
    });
  }, [rowsData, search, classification, status]);

  const handleDelete = (id: number) => {
    setRowsData((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddWriteOff = (formData: LoanWriteOffFormData) => {
    setRowsData((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        loanAc: formData.loanAc || '—',
        customer: '—',
        classification: 'Sub-Standard',
        dpd: 0,
        principalOutstanding: Number(formData.principalOutstanding) || 0,
        writeOffAmount: Number(formData.writeOffAmount) || 0,
        writeOffPercentage: Number(formData.writeOffPercentage) || 0,
        valueDate: formData.valueDate || '—',
        status: 'PENDING',
      },
    ]);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('classification', {
        header: 'Classification',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={classificationColor(info.getValue())}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('dpd', {
        header: 'DPD',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()} days
          </Text>
        ),
      }),
      columnHelper.accessor('principalOutstanding', {
        header: 'Principal Outstanding',
        cell: (info) => (
          <Text fz="xs" c="gray.6" className="font-mono">
            ₹{info.getValue().toLocaleString('en-IN')}
          </Text>
        ),
      }),
      columnHelper.accessor('writeOffPercentage', {
        header: 'Write-off %',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}%
          </Text>
        ),
      }),
      columnHelper.accessor('writeOffAmount', {
        header: 'Write-off Amount',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            ₹{info.getValue().toLocaleString('en-IN')}
          </Text>
        ),
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={info.getValue() === 'WRITTEN_OFF' ? 'green' : 'yellow'}
            className="font-semibold tracking-wider"
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue() === 'WRITTEN_OFF' ? 'WRITTEN OFF' : 'PENDING'}
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
    setClassification(null);
    setStatus('all');
  };

  const classificationOptions = Array.from(
    new Set(DUMMY_WRITE_OFFS.map((r) => r.classification))
  );

  return (
    <Box className="flex flex-col gap-4">
      <LoanWriteOffModal opened={opened} onClose={close} onSubmit={handleAddWriteOff} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Text size="md" fw={700} className="text-gray-900">
          Loan Write-offs
        </Text>
        <Button
          size="xs"
          onClick={open}
          className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          Write Off Loan
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Loan A/c / Customer"
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
            placeholder="All Classifications"
            data={classificationOptions}
            className="w-44"
            searchable
            clearable
            rightSection={chevronDown}
            value={classification}
            onChange={(v) => {
              setClassification(v);
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
              <Radio size="xs" value="WRITTEN_OFF" label="Written Off" color="indigo" />
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
                      No write-offs match your filters.
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