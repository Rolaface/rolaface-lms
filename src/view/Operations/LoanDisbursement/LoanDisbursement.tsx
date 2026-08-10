import { useEffect, useMemo, useState, useCallback } from 'react';
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
  Alert, Menu
} from '@mantine/core';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconCashBanknote,
  IconTrash,
  IconAlertCircle, IconDotsVertical
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
import { LoanDisbursementModal } from '../../../components/Modal/LoanDisbursementModal';
import { getAllLoansDisbursement, deleteLoanDisbursement, changeLoanDsbrStatus } from '../../../api/loanDisbursementAPi';  
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { modals } from '@mantine/modals';
interface DisbursementRow {
  id: string; // Maps to 'name'
  againstLoan: string;
  applicant: string;
  loanProduct: string;
  postingDate: string;
  disbursedAmount: number;
  status: string;
}
const columnHelper = createColumnHelper<DisbursementRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanDisbursement() {
  const [opened, { open, close }] = useDisclosure(false);
const queryClient = useQueryClient();
 const [editId, setEditId] = useState<string | null>(null);
 const [isView, setIsView] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [applicantType, setApplicantType] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // Table state
  const [sorting, setSorting] = useState([{ id: 'disbursementDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const { 
    data: res, 
    isLoading, 
    error: queryError, 
    refetch: fetchDisbursements  
  } = useQuery({
    queryKey: ['loanDisbursements'],
    queryFn: getAllLoansDisbursement,
  });

  const error = queryError ? (queryError as any)?.message || 'Failed to fetch loan disbursements.' : null;

 const rowsData: DisbursementRow[] = useMemo(() => {
    const list = Array.isArray(res?.data) ? res.data : [];
    
    return list.map((item: any) => ({
      id: item.name || '',
      againstLoan: item.against_loan || '—',
      applicant: item.applicant || '—',
      loanProduct: item.loan_product || '—',
      postingDate: item.posting_date || '—',
      disbursedAmount: Number(item.disbursed_amount) || 0,
      status: item.status || 'Pending',
    }));
  }, [res]);

  const deleteMutation = useMutation({
    mutationFn: deleteLoanDisbursement,
    onSuccess: () => {
      fetchDisbursements();
    },
   onError: (error: any) => {
      const errorData = error.response?.data;
      
      const errorMessage = 
        errorData?._error_message || 
        errorData?.message?.message || 
        error.message || 
        "An unexpected error occurred.";

      modals.open({
        title: <Text fw={600} c="red">Action Failed</Text>,
        children: (
          <div>
            <Text size="sm" mb="lg">
              {errorMessage}
            </Text>
            <Group justify="flex-end">
              <Button onClick={() => modals.closeAll()} variant="default">
                Close
              </Button>
            </Group>
          </div>
        ),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => changeLoanDsbrStatus(id, action),
    onSuccess: () => {
      fetchDisbursements();
    },
  onError: (error: any) => {
      const errorData = error.response?.data;
      const errorMessage = 
        errorData?._error_message || 
        errorData?.message?.message || 
        error.message || 
        "An unexpected error occurred.";

      modals.open({
        title: <Text fw={600} c="red">Update Failed</Text>,
        children: (
          <div>
            <Text size="sm" mb="lg">
              {errorMessage}
            </Text>
            <Group justify="flex-end">
              <Button onClick={() => modals.closeAll()} variant="default">
                Close
              </Button>
            </Group>
          </div>
        ),
      });
    },
  });

const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsData.filter((r) => {
      const matchesSearch =
        !q ||
        r.applicant.toLowerCase().includes(q) ||
        r.againstLoan.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q); // Added search by ID (name)
        
      const matchesStatus = 
        status === 'all' || 
        (status === 'SUBMITTED' && r.status.toUpperCase() === 'SUBMITTED') ||
        (status === 'PENDING' && r.status.toUpperCase() !== 'SUBMITTED');
        
      return matchesSearch && matchesStatus;
    });
  }, [rowsData, search, status]);
 
  const handleAdd = () => {
    setEditId(null);
    setEditData(null);
    setIsView(false);
    open();
  };

  const handleEdit = (row: DisbursementRow) => {
    queryClient.invalidateQueries({ queryKey: ["loanDisbursement", row.id] });
    setEditId(row.id);
    setEditData(row); 
    setIsView(false);
    open();
  };
  const handleView = (row: DisbursementRow) => {
    queryClient.invalidateQueries({ queryKey: ["loanDisbursement", row.id] });
    setEditId(row.id);
    setIsView(true);
    open();
  };

  const handleModalClose = () => {
    setEditId(null);
    setEditData(null);
    setIsView(false);
    close();
  };

 const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Disbursement Ref.',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('againstLoan', {
        header: 'Loan Ref.',
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
      columnHelper.accessor('loanProduct', {
        header: 'Loan Product',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color="indigo"
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('postingDate', {
        header: 'Posting Date',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('disbursedAmount', {
        header: 'Disbursed Amount',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            ₹{info.getValue().toLocaleString('en-IN')}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const val = info.getValue();
          const color = val === 'Submitted' || val === 'Disbursed' ? 'green' : 'yellow';
          return (
            <Badge
              variant="light"
              size="sm"
              color={color}
              className="font-semibold tracking-wider"
              styles={{ root: { fontSize: 10, padding: '0 8px' } }}
            >
              {val}
            </Badge>
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
          const isDraft = row.status === 'Draft';
          const isCancelled = row.status === 'Cancelled';
          const isDeleting = deleteMutation.isPending && deleteMutation.variables === row.id;

          // Allow deletion if it's Draft OR Cancelled
          const canDelete = isDraft || isCancelled; 

          return (
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => handleView(row)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  onClick={() => handleEdit(row)}
                  disabled={!isDraft}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? "red" : "gray"}
                  disabled={!canDelete || isDeleting}
                  loading={isDeleting}
                  onClick={() => {
                    modals.openConfirmModal({
                      title: 'Delete Loan Disbursement',
                      children: (
                        <Text size="sm">
                          Are you sure you want to delete disbursement <b>{row.id}</b>? This cannot be undone.
                        </Text>
                      ),
                      labels: { confirm: 'Delete', cancel: 'Cancel' },
                      confirmProps: { color: 'red' },
                      onConfirm: () => deleteMutation.mutate(row.id),
                    });
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>

              <Menu shadow="md" width={140} position="bottom-end">
                <Menu.Target>
                  <ActionIcon 
                    size="sm" 
                    variant="subtle" 
                    color="gray" 
                    disabled={isCancelled} // <-- Disable menu button when cancelled
                    loading={statusMutation.isPending && statusMutation.variables?.id === row.id}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft ? (
                    <Menu.Item
                      onClick={() => {
                        modals.openConfirmModal({
                          title: 'Submit loan disbursement',
                          children: (
                            <Text size="sm">
                              Are you sure you want to submit loan disbursement <b>{row.id}</b> for approval?
                            </Text>
                          ),
                          labels: { confirm: 'Submit', cancel: 'Cancel' },
                          confirmProps: { color: 'green' },
                          onConfirm: () => statusMutation.mutate({ id: row.id, action: 'approved' }),
                        });
                      }}
                    >
                      Submit
                    </Menu.Item>
                  ) : !isCancelled ? (
                    <Menu.Item
                      color="red"
                      onClick={() => {
                        modals.openConfirmModal({
                          title: 'Cancel loan disbursement',
                          children: (
                            <Text size="sm">
                              Are you sure you want to cancel loan disbursement <b>{row.id}</b>? This cannot be undone.
                            </Text>
                          ),
                          labels: { confirm: 'Cancel', cancel: 'Back' },
                          confirmProps: { color: 'red' },
                          onConfirm: () => statusMutation.mutate({ id: row.id, action: 'cancelled' }),
                        });
                      }}
                    >
                      Cancel
                    </Menu.Item>
                  ) : null}
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        }
      }),
    ],
    [deleteMutation, statusMutation] // Added dependencies to prevent stale state issues
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
    setApplicantType(null);
    setCompany(null);
    setStatus('all');
  };

  // const companyOptions = Array.from(new Set(rowsData.map((r) => r.company).filter(c => c !== '—')));

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanDisbursementModal 
        opened={opened} onClose={handleModalClose} editId={editId} initialData={editData} isView={isView}/>

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Disbursements
        </Title>
       <Button
          size="xs"
          onClick={handleAdd} 
          className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          Add Disbursement
        </Button>
      </div>

      {/* {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )} */}

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Loan Ref. / Applicant"
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
            placeholder="All Applicant Types"
            data={['Employee', 'Customer', 'Vendor']}
            className="w-44"
            searchable
            clearable
            rightSection={chevronDown}
            value={applicantType}
            onChange={(v) => {
              setApplicantType(v);
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
              <Radio size="xs" value="SUBMITTED" label="Submitted" color="indigo" />
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
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader size="sm" color="indigo" />
          </div>
        ) : (
          <>
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
                        <IconCashBanknote size={32} className="mb-2 opacity-50" />
                        <Text ta="center" c="dimmed" fz="xs">
                          No disbursements match your filters.
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
          </>
        )}
      </Paper>
    </Box>
  );
}