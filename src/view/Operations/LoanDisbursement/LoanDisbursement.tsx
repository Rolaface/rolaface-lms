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
  IconCashBanknote,
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
import { LoanDisbursementModal, type LoanDisbursementFormData } from '../../../components/Modal/LoanDisbursementModal';

interface DisbursementRow {
  id: number;
  againstLoan: string;
  applicant: string;
  applicantType: string;
  company: string;
  disbursementDate: string;
  disbursedAmount: number;
  modeOfPayment: string;
  status: 'DISBURSED' | 'PENDING';
}

const DUMMY_DISBURSEMENTS: DisbursementRow[] = [
  {
    id: 1,
    againstLoan: 'LN-2026-0011',
    applicant: 'Marco Rossi',
    applicantType: 'Customer',
    company: 'Acme Corp',
    disbursementDate: '2026-06-12',
    disbursedAmount: 250000,
    modeOfPayment: 'Bank Transfer',
    status: 'DISBURSED',
  },
  {
    id: 2,
    againstLoan: 'LN-2026-0014',
    applicant: 'Chanda Mwansa',
    applicantType: 'Employee',
    company: 'Billu&Billa',
    disbursementDate: '2026-06-20',
    disbursedAmount: 80000,
    modeOfPayment: 'UPI',
    status: 'DISBURSED',
  },
  {
    id: 3,
    againstLoan: 'LN-2026-0019',
    applicant: 'Bwalya Enterprises Ltd',
    applicantType: 'Vendor',
    company: 'Zenith Traders',
    disbursementDate: '2026-07-01',
    disbursedAmount: 500000,
    modeOfPayment: 'Cheque',
    status: 'PENDING',
  },
  {
    id: 4,
    againstLoan: 'LN-2026-0022',
    applicant: 'Natasha Phiri',
    applicantType: 'Employee',
    company: 'Billu&Billa',
    disbursementDate: '2026-07-10',
    disbursedAmount: 45000,
    modeOfPayment: 'Cash',
    status: 'PENDING',
  },
  {
    id: 5,
    againstLoan: 'LN-2026-0025',
    applicant: 'Harborview Logistics',
    applicantType: 'Customer',
    company: 'Acme Corp',
    disbursementDate: '2026-07-18',
    disbursedAmount: 320000,
    modeOfPayment: 'Bank Transfer',
    status: 'DISBURSED',
  },
];

const columnHelper = createColumnHelper<DisbursementRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <IconChevronUp size={12} />;
  if (sorted === 'desc') return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanDisbursement() {
  const [opened, { open, close }] = useDisclosure(false);

  // filter state
  const [search, setSearch] = useState('');
  const [applicantType, setApplicantType] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // table state
  const [sorting, setSorting] = useState([{ id: 'disbursementDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [statusOverrides, setStatusOverrides] = useState<Record<number, string>>({});
  const [rowsData, setRowsData] = useState(DUMMY_DISBURSEMENTS);

  const data = useMemo(
    () =>
      rowsData.map((r) => ({
        ...r,
        status: (statusOverrides[r.id] ?? r.status) as DisbursementRow['status'],
      })),
    [rowsData, statusOverrides]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      const matchesSearch =
        !q ||
        r.applicant.toLowerCase().includes(q) ||
        r.againstLoan.toLowerCase().includes(q);
      const matchesType = !applicantType || r.applicantType === applicantType;
      const matchesCompany = !company || r.company === company;
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesType && matchesCompany && matchesStatus;
    });
  }, [data, search, applicantType, company, status]);

  const handleDelete = (id: number) => {
    setRowsData((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddDisbursement = (formData: LoanDisbursementFormData) => {
    setRowsData((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
        againstLoan: formData.againstLoan || '—',
        applicant: formData.loanPartner || '—',
        applicantType: formData.applicantType || '—',
        company: formData.company || '—',
        disbursementDate: formData.disbursementDate || '—',
        disbursedAmount: Number(formData.disbursedAmount) || 0,
        modeOfPayment: formData.modeOfPayment || '—',
        status: 'PENDING',
      },
    ]);
  };

  const columns = useMemo(
    () => [
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
      columnHelper.accessor('applicantType', {
        header: 'Type',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            color={info.getValue() === 'Employee' ? 'indigo' : info.getValue() === 'Vendor' ? 'orange' : 'cyan'}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('disbursementDate', {
        header: 'Disbursement Date',
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
      columnHelper.accessor('modeOfPayment', {
        header: 'Mode Of Payment',
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
            color={info.getValue() === 'DISBURSED' ? 'green' : 'yellow'}
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
    setApplicantType(null);
    setCompany(null);
    setStatus('all');
  };

  const companyOptions = Array.from(new Set(DUMMY_DISBURSEMENTS.map((r) => r.company)));

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanDisbursementModal opened={opened} onClose={close} onSubmit={handleAddDisbursement} />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Disbursements
        </Title>
        <Button
          size="xs"
          onClick={open}
          className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 transition-opacity"
          leftSection={<IconPlus size={14} />}
        >
          Add Disbursement
        </Button>
      </div>

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
          <Select
            size="xs"
            placeholder="All Companies"
            data={companyOptions}
            className="w-40"
            searchable
            clearable
            rightSection={chevronDown}
            value={company}
            onChange={(v) => {
              setCompany(v);
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
              <Radio size="xs" value="DISBURSED" label="Disbursed" color="indigo" />
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
      </Paper>
    </Box>
  );
}