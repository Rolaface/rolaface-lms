import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Loader,
  Menu,
  useMantineTheme,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { FilterMultiSelect } from '../../../components/shared/FilterMultiSelect';
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconCash,
  IconFileText,
  IconTrash,
  IconDotsVertical,
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
import { loanRepaymentModal } from '../../../components/Modal/loanRepaymentModalStore';
import { getAllLoanRepayment, deleteLoanRepayment, changeLoanRepaymentStatus } from '../../../api/loanRepaymentApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseFrappeError } from '../../../utils/parseFrappeError';


interface RepaymentRow {
  id: string;
  loanAc: string;
  customer: string;
  loanType: string;
  docstatus: number;
  natureOfPayment: string;
  amountPaid: number;
  paymentMode: string;
  valueDate: string;
}

// Docstatus -> status badge meta, driven by theme semantic colors
// (slate/info/danger) instead of raw Mantine color names, same tokens
// LoanProduct.tsx uses for Active/Inactive.
const STATUS_META: Record<number, { label: string; color: string }> = {
  0: { label: 'DRAFT', color: 'slate' },
  1: { label: 'SUBMITTED', color: 'info' },
  2: { label: 'CANCELLED', color: 'danger' },
};
const STATUS_FILTER_OPTIONS = [
  { value: '0', label: 'Draft' },
  { value: '1', label: 'Approved' },
  { value: '2', label: 'Cancelled' },
];

const columnHelper = createColumnHelper<RepaymentRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

// Same dot+badge pattern as LoanProduct's StatusBadge.
function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${color}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{ borderRadius: '50%', background: `var(--mantine-color-${color}-6)` }}
        />
      }
    >
      {label}
    </Badge>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;


function natureColor(nature: string) {
  if (nature === 'Normal Repayment') return 'info';
  if (nature === 'Pre Payment') return 'warning';
  if (nature === 'Full Settlement') return 'success';
  return 'slate';
}

function natureLabel(nature: string) {
  return nature || '—';
}

const fmtAmount = (n: number) =>
  n ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export function LoanRepayment() {
  const theme = useMantineTheme();

  const [search, setSearch] = useState('');
   const [debouncedSearch] = useDebouncedValue(search, 400);
  const [loanType, setLoanType] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  

  const { data: repaymentsResponse, isLoading } = useQuery({
    queryKey: ['loanRepayments', debouncedSearch, statusFilter],
   queryFn: () => getAllLoanRepayment(debouncedSearch, statusFilter),
    placeholderData: (prev) => prev,
  });

  const queryClient = useQueryClient();

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: 'red',
      buttons: [{ label: 'Close', color: 'red' }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'Close', color: 'green' }],
    });
  };

  const { mutate: removeRepayment, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanRepayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      showSuccess('Repayment Deleted', 'Loan repayment deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      changeLoanRepaymentStatus(id, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      const message =
        variables.action === 'approved'
          ? 'Loan repayment submitted successfully.'
          : 'Loan repayment cancelled successfully.';
      showSuccess(variables.action === 'approved' ? 'Repayment Submitted' : 'Repayment Cancelled', message);
    },
    onError: (error: any) => showError('Action Failed', error),
  });

  const rowsData = useMemo(() => {
    const list = repaymentsResponse?.message?.data?.repayments ?? [];
    return list.map((item: any) => ({
      id: item.name,
      loanAc: item.against_loan || '—',
      customer: item.applicant || '—',
      docstatus: item.docstatus,
      loanType: item.loan_product || '—',
      natureOfPayment: item.repayment_type || '—',
      amountPaid: item.amount_paid || 0,
      paymentMode: item.mode_of_payment || '—',
      valueDate: item.value_date || '—',
    }));
  }, [repaymentsResponse]);

  const filteredData = useMemo(() => {
    
    return rowsData.filter((r) => {
      
      const matchesLoanType = !loanType || r.loanType === loanType;
return matchesLoanType;
    });
}, [rowsData, loanType]);

  const handleDelete = (id: string) => {
    openCommonModal({
      heading: 'Delete Loan Repayment',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete repayment{' '}
          <Text span fw={600}>
            {id}
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
          onClick: () => {
            removeRepayment(id);
          },
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text
            fz="sm"
            fw={700}
            c="slate.8"
            style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}
          >
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loanType', {
        header: 'Loan Type',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color="brand"
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('natureOfPayment', {
        header: 'Nature of Payment',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color={natureColor(info.getValue())}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {natureLabel(info.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor('amountPaid', {
        header: 'Amount Paid',
        cell: (info) => (
          <Text fz="xs" c="slate.6" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            ZMW {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('paymentMode', {
        header: 'Payment Mode',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('docstatus', {
        header: 'Status',
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || { label: String(info.getValue()), color: 'slate' };
          return <StatusBadge label={meta.label} color={meta.color} />;
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
          const isDraft = row.docstatus === 0;
          const isCancelled = row.docstatus === 2;
          const canDelete = isDraft || isCancelled;

          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                   onClick={() => loanRepaymentModal.open({ editId: row.id, isView: true })}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? 'Edit' : 'Only Drafts can be edited'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? 'brand' : 'slate'}
                  radius="md"
                  disabled={!isDraft}
                  onClick={() => loanRepaymentModal.open({ editId: row.id, isView: false })}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canDelete ? 'Delete' : 'Submitted repayments cannot be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? 'danger' : 'slate'}
                  radius="md"
                  disabled={!canDelete || isDeleting}
                  onClick={() => handleDelete(row.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              {!isCancelled && (
                <Menu shadow="md" width={140} position="bottom-end" radius="md">
                  <Menu.Target>
                    <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                      <IconDotsVertical size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {isDraft ? (
                      <Menu.Item
                        onClick={() => {
                          openCommonModal({
                            heading: 'Submit Loan',
                            subtitle: '',
                            body: (
                              <>
                                Are you sure you want to submit loan{' '}
                                <Text span fw={600}>
                                  {row.id}
                                </Text>{' '}
                                for approval?
                              </>
                            ),
                            color: 'green',
                            buttons: [
                              { label: 'Cancel', variant: 'default' },
                              {
                                label: 'Submit',
                                color: 'green',
                                onClick: () => updateStatus({ id: row.id, action: 'approved' }),
                              },
                            ],
                          });
                        }}
                      >
                        Submit
                      </Menu.Item>
                    ) : (
                      <Menu.Item
                        color="danger"
                        onClick={() => {
                          openCommonModal({
                            heading: 'Cancel Loan',
                            subtitle: 'This action cannot be undone.',
                            body: (
                              <>
                                Are you sure you want to cancel loan{' '}
                                <Text span fw={600}>
                                  {row.id}
                                </Text>
                                ?
                              </>
                            ),
                            color: 'red',
                            buttons: [
                              { label: 'Back', variant: 'default' },
                              {
                                label: 'Cancel Loan',
                                color: 'red',
                                onClick: () => updateStatus({ id: row.id, action: 'cancelled' }),
                              },
                            ],
                          });
                        }}
                      >
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
    setStatusFilter([]);
  };

  // Generate loan type options dynamically from loaded data (like LoanAccount)
  const loanTypeOptions = Array.from(new Set(rowsData.map((r) => r.loanType).filter(Boolean)));

  return (
    <Stack gap="lg" p="lg">


      {/* Scoped, purely visual — mirrors LoanProduct's row/hover treatment */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Header — icon tile + title, same pattern as Loan Products */}
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
            <IconCash size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Repayments
            </Title>
            <Text fz="sm" c="slate.5">
              Track and process loan repayments
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search + pill filter + segmented status control */}
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
            placeholder="Loan A/c / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Loan Types"
            data={loanTypeOptions as string[]}
            w={166}
            searchable
            clearable
            rightSection={chevronDown}
            value={loanType}
            onChange={(v) => {
              setLoanType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

         <FilterMultiSelect
           placeholder="All Statuses"
            data={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            width={140}
          />

          <Button size="sm" radius="xl" variant="default" px="md" ml="auto" onClick={resetFilters}>
            Reset
          </Button>
          <Button
            size="sm"
            radius="xl"
            color="brand"
              onClick={() => loanRepaymentModal.open({ editId: null, isView: false })}
            leftSection={<IconPlus size={14} />}
            style={{
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            Process Repayment
          </Button>
        </Group>
      </Paper>

      {/* Data Table — floating rounded row-cards on a soft canvas */}
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
           <Box style={{ height: 'clamp(320px, calc(100vh - 280px), 720px)', overflowY: 'auto' }}>
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
                            <IconFileText size={24} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No repayments match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const rowMeta =
                        STATUS_META[row.original.docstatus] || { label: String(row.original.docstatus), color: 'slate' };
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
                                borderLeft:
                                  idx === 0
                                    ? `3px solid var(--mantine-color-${rowMeta.color}-4)`
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
                disabled={totalRows === 0}
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}