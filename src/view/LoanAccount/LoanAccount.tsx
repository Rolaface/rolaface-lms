import { useMemo, useState, useEffect } from 'react';
import { modals } from '@mantine/modals';
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
  IconFileText,
  IconTrash,
  IconDotsVertical
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
import { LoanAccountModal } from '../../components/Modal/LoanBooking/LoanAccountModal';
import { getAllLoans, deleteLoan, changeLoanStatus } from '../../api/loanApi';  
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'DRAFT', color: 'gray' },
  PENDING_APPROVAL: { label: 'PENDING APPROVAL', color: 'yellow' },
  APPROVED: { label: 'APPROVED', color: 'blue' },
  DISBURSED: { label: 'DISBURSED', color: 'green' },
  REJECTED: { label: 'REJECTED', color: 'red' },
};

const columnHelper = createColumnHelper<any>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

const fmtAmount = (n: number) =>
  n ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export function LoanAccount() {
  const [opened, { open, close }] = useDisclosure(false);
  
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
   const handleModalClose = () => {
    close();
    setSelectedLoanId(null);
    setIsViewMode(false);
  };
 const { data: loansResponse, isLoading } = useQuery({
  queryKey: ["loans"],
  queryFn: getAllLoans,
});

const queryClient = useQueryClient();

const { mutate: removeLoan, isPending: isDeleting } = useMutation({
  mutationFn: (id: string) => deleteLoan(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['loans'] });
  },
});

const { mutate: updateStatus } = useMutation({
  mutationFn: ({ id, action }: { id: string; action: string }) =>
    changeLoanStatus(id, action),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['loans'] });
  },
});
  // filter state
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'appliedDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // useEffect(() => {
  //   const fetchLoans = async () => {
  //     try {
  //       setIsLoading(true);
  //       const response = await getAllLoans();
        
  //       if (response?.status === 'success' && response.data) {
  //         // Map API data to match existing UI structure
  //         const mappedData = response.data.map((item: any) => ({
  //           id: item.name,
  //           appNo: item.name,
  //           customer: item.applicant_name || item.applicant || 'N/A',
  //           product: item.loan_product || 'N/A',
  //           branch: item.company || 'N/A', // Mapped company to branch to preserve UI
  //           amount: item.loan_amount || 0,
  //           rate: 0, // Fallback to 0 since rate isn't in current API response
  //           status: item.status ? item.status.toUpperCase().replace(' ', '_') : 'DRAFT',
  //           appliedDate: item.posting_date,
  //         }));
  //         setData(mappedData);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching loans:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchLoans();
  // }, []);
  const data = useMemo(() => {
  if (loansResponse?.status === 'success' && loansResponse.data) {
    return loansResponse.data.map((item: any) => ({
      id: item.name,
      appNo: item.name,
      customer: item.applicant_name || item.applicant || 'N/A',
      product: item.loan_product || 'N/A',
      branch: item.company || 'N/A',
      amount: item.loan_amount || 0,
      rate: 0,
      status: item.status ? item.status.toUpperCase().replace(' ', '_') : 'DRAFT',
      appliedDate: item.posting_date,
    }));
  }
  return [];
}, [loansResponse]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((a) => {
      const matchesSearch =
        !q ||
        a.appNo.toLowerCase().includes(q) ||
        a.customer.toLowerCase().includes(q);
      const matchesProduct = !product || a.product === product;
      const matchesBranch = !branch || a.branch === branch;
      const matchesStatus = status === 'all' || a.status === status;
      return matchesSearch && matchesProduct && matchesBranch && matchesStatus;
    });
  }, [data, search, product, branch, status]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('appNo', {
        header: 'Application No.',
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="xs" fw={500} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('product', {
        header: 'Loan Product',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('branch', {
        header: 'Branch',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <Text fz="xs" c="gray.6" className="font-mono">
            ZMW {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('rate', {
        header: 'Rate',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue() ? `${info.getValue().toFixed(2)}%` : '-'}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('appliedDate', {
        header: 'Applied On',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || { label: info.getValue(), color: 'gray' };
          return (
            <Badge
              variant="light"
              size="sm"
              color={meta.color}
              className="font-semibold tracking-wider"
              styles={{ root: { fontSize: 10, padding: '0 8px' } }}
            >
              {meta.label}
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
          const rowData = info.row.original;
          
          // Grab the identifier regardless of how it was mapped to the table row
          const loanIdentifier = rowData.name || rowData.appNo || rowData.id; 
          
          const isDraft = rowData.status === 'DRAFT';

          return (
          <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                {/* 1. Add onClick to View Icon */}
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  color="gray"
                  onClick={() => {
                    setSelectedLoanId(loanIdentifier);
                    setIsViewMode(true);
                    open();
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? "Edit" : "Only Drafts can be edited"} withArrow>
                {/* 2. Update onClick to Edit Icon */}
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  color={isDraft ? "blue" : "gray"}
                  disabled={!isDraft}
                  onClick={() => {
                    setSelectedLoanId(loanIdentifier);
                    setIsViewMode(false); 
                    open();
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? "Delete" : "Only Drafts can be deleted"} withArrow>
  <ActionIcon
    size="sm"
    variant="subtle"
    color={isDraft ? "red" : "gray"}
    disabled={!isDraft || isDeleting}
   onClick={() => {
  modals.openConfirmModal({
    title: 'Delete loan application',
    children: (
      <Text size="sm">
        Are you sure you want to delete loan application <b>{loanIdentifier}</b>? This cannot be undone.
      </Text>
    ),
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: () => removeLoan(loanIdentifier),
  });
}}
  >
    <IconTrash size={14} />
  </ActionIcon>
</Tooltip>
  <Menu shadow="md" width={140} position="bottom-end">
  <Menu.Target>
    <ActionIcon size="sm" variant="subtle" color="gray">
      <IconDotsVertical size={14} />
    </ActionIcon>
  </Menu.Target>
  <Menu.Dropdown>
    {isDraft ? (
      <Menu.Item onClick={() => updateStatus({ id: loanIdentifier, action: 'approved' })}>
        Submit
      </Menu.Item>
    ) : (
      <Menu.Item color="red" onClick={() => updateStatus({ id: loanIdentifier, action: 'cancelled' })}>
        Cancel
      </Menu.Item>
    )}
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
    setProduct(null);
    setBranch(null);
    setStatus('all');
  };

  // Generate options dynamically from the loaded API data
  const productOptions = Array.from(new Set(data.map((a) => a.product).filter(Boolean)));
  const branchOptions = Array.from(new Set(data.map((a) => a.branch).filter(Boolean)));

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      {/* <LoanAccountModal opened={opened} onClose={close} /> */}
      {/* <LoanAccountModal opened={opened} onClose={handleModalClose} loanId={selectedLoanId} /> */}
      <LoanAccountModal opened={opened} onClose={handleModalClose} loanId={selectedLoanId} isViewMode={isViewMode} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Booking
        </Title>
       <Button
          size="xs"
          bg="indigoAlt.4"
          onClick={() => {
            setSelectedLoanId(null);
            setIsViewMode(false);
            open();
          }}
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          leftSection={<IconPlus size={14} />}
        >
          New Account
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Application No. / Customer"
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
            placeholder="All Products"
            data={productOptions as string[]}
            className="w-52"
            searchable
            clearable
            rightSection={chevronDown}
            value={product}
            onChange={(v) => {
              setProduct(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="xs"
            placeholder="All Branches"
            data={branchOptions as string[]}
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
              <Radio size="xs" value="all" label="All" color="indigoAlt.4" />
              <Radio size="xs" value="DRAFT" label="Draft" color="indigoAlt.4" />
              <Radio size="xs" value="PENDING_APPROVAL" label="Pending" color="indigoAlt.4" />
              <Radio size="xs" value="APPROVED" label="Approved" color="indigoAlt.4" />
              <Radio size="xs" value="DISBURSED" label="Disbursed" color="indigoAlt.4" />
              <Radio size="xs" value="REJECTED" label="Rejected" color="indigoAlt.4" />
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
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader size="sm" color="gray" />
                    <Text ta="center" c="dimmed" fz="xs" mt="sm">
                      Loading loan applications...
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <IconFileText size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No applications match your filters.
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
            color="indigoAlt.4"
            size="xs"
            radius="sm"
            disabled={totalRows === 0}
          />
        </div>
      </Paper>
    </Box>
  );
}