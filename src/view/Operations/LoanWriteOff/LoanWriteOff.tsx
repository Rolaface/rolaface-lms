import { useMemo, useState, useEffect } from 'react';
import { getLoanWriteOffs, getLoanWriteOffById, deleteLoanWriteOff,updateLoanWriteOffStatus} from "../../../api/lendingOperation/writeoff";
import type { LoanWriteOffListItem, LoanWriteOffDetail, } from "../../../types/loanWriteOff";

import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
   Menu, 
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
  IconDotsVertical,  
  IconCheck,         
  IconSend, 
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


const columnHelper = createColumnHelper<LoanWriteOffListItem>();

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
  const [editData, setEditData] = useState<LoanWriteOffDetail | null>(null);

  // filter state
  const [search, setSearch] = useState('');


  // table state
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowsData, setRowsData] = useState<LoanWriteOffListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiPagination, setApiPagination] = useState({ total: 0, total_pages: 1 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);

    getLoanWriteOffs({
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      search,
    })
      .then((res) => {
        if (active) {
          setRowsData(Array.isArray(res?.data) ? res.data : []);
          setApiPagination({
            total: res?.pagination?.total ?? 0,
            total_pages: res?.pagination?.total_pages ?? 1,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setRowsData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pagination.pageIndex, pagination.pageSize, search]);

  const filteredData = useMemo(() => rowsData, [rowsData]);

  const handleAddWriteOff = () => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };
  const handleEditClick = async (id: string) => {
    try {
      const detail = await getLoanWriteOffById(id);
      setEditData(detail);
      open();
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteClick = async (id: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete write-off "${id}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteLoanWriteOff(id);
      // Refresh the list after deletion
      setPagination((p) => ({ ...p })); // triggers useEffect refetch since deps unchanged; safer to force refetch below
      const res = await getLoanWriteOffs({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search,
      });
      setRowsData(Array.isArray(res?.data) ? res.data : []);
      setApiPagination({
        total: res?.pagination?.total ?? 0,
        total_pages: res?.pagination?.total_pages ?? 1,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };
  const handleStatusChange = async (id: string, action: "approved" | "submitted") => {
  try {
    setStatusUpdatingId(id);
    await updateLoanWriteOffStatus(id, action);

    const res = await getLoanWriteOffs({
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      search,
    });
    setRowsData(Array.isArray(res?.data) ? res.data : []);
    setApiPagination({
      total: res?.pagination?.total ?? 0,
      total_pages: res?.pagination?.total_pages ?? 1,
    });
  } catch (err) {
    console.error(err);
  } finally {
    setStatusUpdatingId(null);
  }
};

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Write-off ID',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loan', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('applicant', {
        header: 'Applicant',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loan_product', {
        header: 'Loan Product',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('write_off_amount', {
        header: 'Write-off Amount',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            ₹{Number(info.getValue()).toLocaleString('en-IN')}
          </Text>
        ),
      }),
      columnHelper.accessor('posting_date', {
        header: 'Posting Date',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
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
          return (
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray">
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  onClick={() => handleEditClick(row.name)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label="Delete" withArrow>
  <ActionIcon
    size="sm"
    variant="subtle"
    color="red"
    loading={deletingId === row.name}
    onClick={() => handleDeleteClick(row.name)}
  >
    <IconTrash size={14} />
  </ActionIcon>
</Tooltip>
<Menu shadow="md" width={160} position="bottom-end" withinPortal>
  <Menu.Target>
    <ActionIcon
      size="sm"
      variant="subtle"
      color="gray"
      loading={statusUpdatingId === row.name}
    >
      <IconDotsVertical size={14} />
    </ActionIcon>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item
      leftSection={<IconSend size={14} />}
      onClick={() => handleStatusChange(row.name, "submitted")}
    >
      Submit
    </Menu.Item>
    <Menu.Item
      leftSection={<IconCheck size={14} />}
      onClick={() => handleStatusChange(row.name, "approved")}
    >
      Approve
    </Menu.Item>
  </Menu.Dropdown>
</Menu>
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const rows = table.getRowModel().rows;
  const totalRows = apiPagination.total;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch('');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };


  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanWriteOffModal
        opened={opened}
        onClose={() => {
          close();
          setEditData(null);
        }}
        onSubmit={handleAddWriteOff}
        editData={editData}
      />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Write-offs
        </Title>
        <Button
          size="xs"
          onClick={() => {
            setEditData(null);
            open();
          }}
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
                      className={`text-gray-600 font-semibold select-none ${canSort ? 'cursor-pointer' : ''
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
            total={apiPagination.total_pages || 1}
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