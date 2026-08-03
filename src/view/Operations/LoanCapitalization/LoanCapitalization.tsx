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
  Loader,
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
  IconTrash,
  IconDotsVertical,
  IconFileOff,
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
import { modals } from '@mantine/modals';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoanCapitalizationModal } from '../../../components/Modal/LoanCapitalizationModal';
import {
  getAllLoanRepayment,
  deleteLoanRepayment,
  changeLoanRepaymentStatus,
} from '../../../api/loanRepaymentApi';

const CAPITALIZATION_TYPES = ['Interest Capitalization', 'Penalty Capitalization', 'Charges Capitalization', 'Principal Capitalization'];

interface CapitalizationRow {
  id: string;
  loanAc: string;
  customer: string;
  loanType: string;
  repaymentType: string;
  docstatus: number;
  amountPaid: number;
  valueDate: string;
}

const columnHelper = createColumnHelper<CapitalizationRow>();

const STATUS_META: Record<number, { label: string; color: string }> = {
  0: { label: 'DRAFT', color: 'gray' },
  1: { label: 'SUBMITTED', color: 'blue' },
  2: { label: 'CANCELLED', color: 'red' },
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

function natureColor(type: string) {
  if (type === 'Interest Capitalization') return 'brand';
  if (type === 'Penalty Capitalization') return 'gold';
  if (type === 'Charges Capitalization') return 'accent';
  return 'gray';
}

export function LoanCapitalization() {
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [loanType, setLoanType] = useState<string | null>(null);
  const [status, setStatus] = useState('all');
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedCapitalizationId, setSelectedCapitalizationId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleModalClose = () => {
    close();
    setSelectedCapitalizationId(null);
    setIsViewMode(false);
  };

  const { data: repaymentsResponse, isLoading } = useQuery({
    queryKey: ['loanRepayments'],
    queryFn: getAllLoanRepayment,
  });

  const queryClient = useQueryClient();

  const { mutate: removeCapitalization, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanRepayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      changeLoanRepaymentStatus(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
    },
  });

  // Only rows whose repayment_type is one of the capitalization types —
  // the shared getAllLoanRepayment endpoint returns every record type.
  const rowsData = useMemo(() => {
    const list = repaymentsResponse?.message?.data?.repayments ?? [];
    return list
      .filter((item: any) => CAPITALIZATION_TYPES.includes(item.repayment_type))
      .map((item: any) => ({
        id: item.name,
        loanAc: item.against_loan || '—',
        customer: item.applicant || '—',
        loanType: item.loan_product || '—',
        repaymentType: item.repayment_type,
        docstatus: item.docstatus,
        amountPaid: item.amount_paid || 0,
        valueDate: item.value_date || '—',
      }));
  }, [repaymentsResponse]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch = !q || r.customer.toLowerCase().includes(q) || r.loanAc.toLowerCase().includes(q);
      const matchesLoanType = !loanType || r.loanType === loanType;
      const matchesStatus = status === 'all' || String(r.docstatus) === status;
      return matchesSearch && matchesLoanType && matchesStatus;
    });
  }, [rowsData, search, loanType, status]);

  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: 'Delete loan capitalization',
      children: (
        <Text size="sm">
          Are you sure you want to delete capitalization <b>{id}</b>? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => removeCapitalization(id),
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">{info.getValue()}</Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => <Text fz="xs" c="gray.6">{info.getValue()}</Text>,
      }),
      columnHelper.accessor('loanType', {
        header: 'Loan Type',
        cell: (info) => <Text fz="xs" c="gray.6">{info.getValue()}</Text>,
      }),
      columnHelper.accessor('repaymentType', {
        header: 'Nature of Capitalization',
        cell: (info) => (
          <Badge variant="light" size="sm" color={natureColor(info.getValue())} styles={{ root: { fontSize: 10, padding: '0 8px' } }}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('amountPaid', {
        header: 'Capitalized Amount',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            ${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        ),
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => <Text fz="xs" c="gray.6">{info.getValue()}</Text>,
      }),
      columnHelper.accessor('docstatus', {
        header: 'Status',
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || { label: String(info.getValue()), color: 'gray' };
          return (
            <Badge variant="light" size="sm" color={meta.color} className="font-semibold tracking-wider" styles={{ root: { fontSize: 10, padding: '0 8px' } }}>
              {meta.label}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">Actions</Text>,
        cell: (info) => {
          const row = info.row.original;
          const isDraft = row.docstatus === 0;
          const isCancelled = row.docstatus === 2;
          const canDelete = isDraft || isCancelled;

          return (
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    setSelectedCapitalizationId(row.id);
                    setIsViewMode(true);
                    open();
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? 'Edit' : 'Only Drafts can be edited'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? 'brand' : 'gray'}
                  disabled={!isDraft}
                  onClick={() => {
                    setSelectedCapitalizationId(row.id);
                    setIsViewMode(false);
                    open();
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canDelete ? 'Delete' : 'Submitted capitalizations cannot be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? 'danger' : 'gray'}
                  disabled={!canDelete || isDeleting}
                  onClick={() => handleDelete(row.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              {!isCancelled && (
                <Menu shadow="md" width={140} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon size="sm" variant="subtle" color="gray">
                      <IconDotsVertical size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {isDraft ? (
                      <Menu.Item onClick={() => updateStatus({ id: row.id, action: 'approved' })}>
                        Submit
                      </Menu.Item>
                    ) : (
                      <Menu.Item color="red" onClick={() => updateStatus({ id: row.id, action: 'cancelled' })}>
                        Cancel
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          );
        },
      }),
    ],
    [isDeleting]
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
    setLoanType(null);
    setStatus('all');
  };

  const loanTypeOptions = Array.from(new Set(rowsData.map((r) => r.loanType).filter(Boolean)));

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanCapitalizationModal opened={opened} onClose={handleModalClose} editId={selectedCapitalizationId} isView={isViewMode} />

      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Capitalization
        </Title>
        <Button
          size="xs"
          onClick={() => {
            setSelectedCapitalizationId(null);
            setIsViewMode(false);
            open();
          }}
          className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          Process Capitalization
        </Button>
      </div>

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
            placeholder="All Loan Types"
            data={loanTypeOptions}
            className="w-44"
            searchable
            clearable
            rightSection={chevronDown}
            value={loanType}
            onChange={(v) => {
              setLoanType(v);
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
              <Radio size="xs" value="all" label="All" color="brand" />
              <Radio size="xs" value="0" label="Draft" color="brand" />
              <Radio size="xs" value="1" label="Submitted" color="brand" />
              <Radio size="xs" value="2" label="Cancelled" color="brand" />
            </Group>
          </Radio.Group>

          <Button size="xs" variant="default" className="ml-auto px-4" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Paper>

      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th key={header.id} className={`text-gray-600 font-semibold select-none ${canSort ? 'cursor-pointer' : ''}`} style={{ fontSize: 11, padding: '6px 10px' }} onClick={header.column.getToggleSortingHandler()}>
                      <Group gap={4} wrap="nowrap" justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}>
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
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader size="sm" color="gray" />
                    <Text ta="center" c="dimmed" fz="xs" mt="sm">Loading loan capitalizations...</Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <IconFileOff size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">No capitalizations match your filters.</Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
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
            color="brand"
            size="xs"
            radius="sm"
            disabled={totalRows === 0}
          />
        </div>
      </Paper>
    </Box>
  );
}