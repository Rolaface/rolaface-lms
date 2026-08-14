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
  Loader,
  Menu,
  Stack,
  useMantineTheme,
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
  IconWallet,
} from '@tabler/icons-react';
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
import {
  getAllLoanRepayment,
  deleteLoanRepayment,
  changeLoanRepaymentStatus,
} from '../../../api/loanRepaymentApi';
import { showApiError, showSuccess } from '../../../utils/alert';
import { loanCapitalizationModal } from './LoanCapitalizationModalStore';

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

const STATUS_META: Record<number, { label: string; scale: 'gray' | 'info' | 'danger' }> = {
  0: { label: 'DRAFT', scale: 'gray' },
  1: { label: 'SUBMITTED', scale: 'info' },
  2: { label: 'CANCELLED', scale: 'danger' },
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

function natureColor(type: string) {
  if (type === 'Interest Capitalization') return 'brand';
  if (type === 'Penalty Capitalization') return 'gold';
  if (type === 'Charges Capitalization') return 'accent';
  return 'slate';
}

function StatusBadge({ docstatus }: { docstatus: number }) {
  const meta = STATUS_META[docstatus] || { label: String(docstatus), scale: 'gray' };
  const color = meta.scale === 'gray' ? 'slate' : meta.scale;
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
        <Box w={6} h={6} style={{ borderRadius: '50%', background: `var(--mantine-color-${color}-6)` }} />
      }
    >
      {meta.label}
    </Badge>
  );
}

function AmountCell({ value }: { value: number }) {
  return (
    <Text fz="xs" fw={700} c="slate.8" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
      ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
    </Text>
  );
}

export function LoanCapitalization() {
  const theme = useMantineTheme();
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

  const { mutate: removeCapitalization, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanRepayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      showSuccess('Loan capitalization deleted successfully.');
    },
    onError: () => {
      showApiError('Something went wrong while deleting the capitalization.');
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      changeLoanRepaymentStatus(id, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      showSuccess(
        variables.action === 'approved'
          ? 'Loan capitalization submitted successfully.'
          : 'Loan capitalization cancelled successfully.'
      );
    },
    onError: () => {
      showApiError('Something went wrong while updating the status.');
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
      confirmProps: { color: 'danger' },
      onConfirm: () => removeCapitalization(id),
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('loanAc', {
        header: 'Loan A/c',
        cell: (info) => (
          <Text fz="xs" fw={700} c="slate.8" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('loanType', {
        header: 'Loan Type',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('repaymentType', {
        header: 'Nature of Capitalization',
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
        header: 'Capitalized Amount',
        cell: (info) => <AmountCell value={info.getValue()} />,
      }),
      columnHelper.accessor('valueDate', {
        header: 'Value Date',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('docstatus', {
        header: 'Status',
        cell: (info) => <StatusBadge docstatus={info.getValue()} />,
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
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                 onClick={() => loanCapitalizationModal.open({ editId: row.id, isView: true })}
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
                 onClick={() => loanCapitalizationModal.open({ editId: row.id, isView: false })}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canDelete ? 'Delete' : 'Submitted capitalizations cannot be deleted'} withArrow>
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
                <Menu shadow="md" width={150} radius="md" position="bottom-end">
                  <Menu.Target>
                    <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                      <IconDotsVertical size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {isDraft ? (
                      <Menu.Item onClick={() => updateStatus({ id: row.id, action: 'approved' })}>
                        Submit
                      </Menu.Item>
                    ) : (
                      <Menu.Item color="danger" onClick={() => updateStatus({ id: row.id, action: 'cancelled' })}>
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
    <Stack gap="lg" p="lg">
      

      {/* Scoped, purely visual — mirrors Customer.tsx row/search styling */}
      <style>{`
        .lms-cap-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-cap-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-cap-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-cap-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-cap-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* Header */}
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
            <IconWallet size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Capitalization
            </Title>
            <Text fz="sm" c="slate.5">
              Process interest, penalty, or fee capitalizations against a loan
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar */}
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
            className="lms-cap-search"
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
            w={180}
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
         onClick={() => loanCapitalizationModal.open({ editId: null, isView: false })}
          leftSection={<IconPlus size={14} />}
          style={{
            background: theme.other.brandGradient,
            boxShadow: theme.other.brandGlowShadowSm,
          }}
        >
          Process Capitalization
        </Button>
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper
        radius="lg"
        p="sm"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
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
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <Loader size="sm" color="brand" />
                    <Text ta="center" c="slate.5" fz="xs">
                      Loading loan capitalizations...
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
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
                      <IconFileOff size={26} color="var(--mantine-color-slate-4)" />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No capitalizations match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const meta = STATUS_META[row.original.docstatus] || { scale: 'gray' };
                const color = meta.scale === 'gray' ? 'slate' : meta.scale;
                const cells = row.getVisibleCells();
                return (
                  <Table.Tr key={row.id} className="lms-cap-row">
                    {cells.map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: '10px 10px',
                          border: 'none',
                          boxShadow: 'var(--mantine-shadow-xs)',
                          borderLeft: idx === 0 ? `3px solid var(--mantine-color-${color}-4)` : undefined,
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
      </Paper>
    </Stack>
  );
}