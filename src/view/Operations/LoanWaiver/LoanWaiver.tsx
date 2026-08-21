import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Select,
  SegmentedControl,
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
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,IconDiscount2,
  IconSearch,
  IconTrash,
  IconDotsVertical,
  IconFileOff,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllLoanRepayment,
  deleteLoanRepayment,
  changeLoanRepaymentStatus,
} from '../../../api/loanRepaymentApi';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { parseFrappeError } from '../../../utils/parseFrappeError';
import { loanWaiverModal } from './LoanWaiverModalStore';
import { formatAmount, useCurrencyReady } from '../../../store/currencyStore';
import { useCompanyStore } from '../../../store/companyStore';

const WAIVER_TYPES = ['Interest Waiver', 'Penalty Waiver', 'Charges Waiver'];

interface WaiverRow {
  id: string;
  loanAc: string;
  customer: string;
  loanType: string;
  repaymentType: string;
  docstatus: number;
  amountPaid: number;
  valueDate: string;
}

const columnHelper = createColumnHelper<WaiverRow>();

const STATUS_META: Record<number, { label: string; color: string }> = {
  0: { label: 'DRAFT', color: 'slate' },
  1: { label: 'SUBMITTED', color: 'info' },
  2: { label: 'CANCELLED', color: 'danger' },
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

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

function natureColor(type: string) {
  if (type === 'Interest Waiver') return 'brand';
  if (type === 'Penalty Waiver') return 'gold';
  return 'accent';
}

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export function LoanWaiver() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();
  const [search, setSearch] = useState('');
  const [loanType, setLoanType] = useState<string | null>(null);
  const [status, setStatus] = useState('all');
  const [sorting, setSorting] = useState([{ id: 'valueDate', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: repaymentsResponse, isLoading } = useQuery({
    queryKey: ['loanRepayments'],
    queryFn: getAllLoanRepayment,
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

  const { mutate: removeWaiver, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanRepayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      showSuccess('Waiver Deleted', 'Loan waiver deleted successfully.');
    },
    onError: (error: any) => showError('Delete Failed', error),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      changeLoanRepaymentStatus(id, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      const isCancel = variables.action === 'cancelled';
      showSuccess(
        isCancel ? 'Waiver Cancelled' : 'Waiver Submitted',
        isCancel ? 'Loan waiver cancelled successfully.' : 'Loan waiver submitted successfully.'
      );
    },
    onError: (error: any, variables) => {
      const isCancel = variables.action === 'cancelled';
      showError(isCancel ? 'Cancel Failed' : 'Submit Failed', error);
    },
  });

  // Only rows whose repayment_type is one of the waiver types — the shared
  // getAllLoanRepayment endpoint returns every repayment/waiver/etc. record.
  const rowsData = useMemo(() => {
    const list = repaymentsResponse?.message?.data?.repayments ?? [];
    return list
      .filter((item: any) => WAIVER_TYPES.includes(item.repayment_type))
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

  const handleDelete = (row: WaiverRow) => {
    openCommonModal({
      heading: 'Delete Loan Waiver',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete waiver{' '}
          <Text span fw={600}>
            {row.id}
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
            removeWaiver(row.id);
          },
        },
      ],
    });
  };

  const handleStatusChange = (row: WaiverRow, action: 'approved' | 'cancelled') => {
    const isCancel = action === 'cancelled';
    openCommonModal({
      heading: isCancel ? 'Cancel Waiver' : 'Submit Waiver',
      subtitle: 'Please confirm this action before continuing.',
      body: (
        <>
          Are you sure you want to {isCancel ? 'cancel' : 'submit'} waiver{' '}
          <Text span fw={600}>
            {row.id}
          </Text>
          ?
        </>
      ),
      color: isCancel ? 'red' : 'green',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        {
          label: isCancel ? 'Cancel Waiver' : 'Submit',
          color: isCancel ? 'red' : 'green',
          onClick: () => {
            updateStatus({ id: row.id, action });
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
      columnHelper.accessor('repaymentType', {
        header: 'Nature of Waiver',
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color={natureColor(info.getValue())}
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
     columnHelper.accessor('amountPaid', {
  header: 'Waiver Amount',
  cell: (info) => (
    <Text
      fz="xs"
      c="slate.6"
      style={{
        fontFamily: 'var(--mantine-font-family-monospace)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {formatAmount(companyCurrency, info.getValue(), { withSymbol: true })}
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
                  onClick={() => loanWaiverModal.open({ editId: row.id, isView: true })}
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
                  onClick={() => loanWaiverModal.open({ editId: row.id, isView: false })}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canDelete ? 'Delete' : 'Submitted waivers cannot be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? 'danger' : 'slate'}
                  radius="md"
                  disabled={!canDelete || isDeleting}
                  onClick={() => handleDelete(row)}
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
                      <Menu.Item onClick={() => handleStatusChange(row, 'approved')}>
                        Submit
                      </Menu.Item>
                    ) : (
                      <Menu.Item color="danger" onClick={() => handleStatusChange(row, 'cancelled')}>
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
    [isDeleting, companyCurrency]
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
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

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
            <IconDiscount2 size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Waivers
            </Title>
            <Text fz="sm" c="slate.5">
              Manage interest, penalty and charges waivers
            </Text>
          </Stack>
        </Group>
      </Group>

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
            data={loanTypeOptions}
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

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Draft', value: '0' },
              { label: 'Submitted', value: '1' },
              { label: 'Cancelled', value: '2' },
            ]}
          />

          <Button size="sm" radius="xl" variant="default" px="md" ml="auto" onClick={resetFilters}>
            Reset
          </Button>
     <Button
            size="sm"
            radius="xl"
            color="brand"
            onClick={() => loanWaiverModal.open({ editId: null, isView: false })}
            leftSection={<IconPlus size={14} />}
            style={{
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            Process Waiver
          </Button>
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
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
                          <IconFileOff size={24} color="var(--mantine-color-slate-4)" />
                        </Box>
                        <Text ta="center" c="slate.5" fz="xs">
                          No waivers match your filters.
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
                      <Table.Tr
                        key={row.id}
                        className="lms-row"
                        onDoubleClick={() => loanWaiverModal.open({ editId: row.original.id, isView: true })}
                        style={{ cursor: 'pointer' }}
                      >
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