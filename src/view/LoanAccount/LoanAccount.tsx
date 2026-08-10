import { useMemo, useState } from 'react';
import { modals } from '@mantine/modals';
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
  IconChevronDown,IconFileInvoice,
  IconSelector,
  IconSearch,
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
import { LoanAccountModal } from '../../components/Modal/LoanBooking/LoanAccountModal';
import { getAllLoans, deleteLoan, changeLoanStatus } from '../../api/loanApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Unchanged — same status meta / colors your data already relies on.
const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'DRAFT', color: 'gray' },
  PENDING_APPROVAL: { label: 'PENDING APPROVAL', color: 'yellow' },
  APPROVED: { label: 'APPROVED', color: 'blue' },
  DISBURSED: { label: 'DISBURSED', color: 'green' },
  REJECTED: { label: 'REJECTED', color: 'red' },
};

const columnHelper = createColumnHelper<any>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

// Same visual pattern as LoanProduct's StatusBadge, driven by the
// existing STATUS_META color/label so no status logic changes.
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

const fmtAmount = (n: number) =>
  n ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export function LoanAccount() {
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const handleModalClose = () => {
    close();
    setSelectedLoanId(null);
    setIsViewMode(false);
  };

  const { data: loansResponse, isLoading } = useQuery({
    queryKey: ['loans'],
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
      columnHelper.accessor('product', {
        header: 'Loan Product',
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
      columnHelper.accessor('branch', {
        header: 'Branch',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <Text fz="xs" c="slate.6" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            ZMW {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('rate', {
        header: 'Rate',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() ? `${info.getValue().toFixed(2)}%` : '-'}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('appliedDate', {
        header: 'Applied On',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: 'basic',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || { label: info.getValue(), color: 'gray' };
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
          const rowData = info.row.original;

          // Grab the identifier regardless of how it was mapped to the table row
          const loanIdentifier = rowData.name || rowData.appNo || rowData.id;

          const isDraft = rowData.status === 'DRAFT';

          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => {
                    setSelectedLoanId(loanIdentifier);
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
                  color={isDraft ? 'brand' : 'slate'}
                  radius="md"
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
              <Tooltip label={isDraft ? 'Delete' : 'Only Drafts can be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? 'danger' : 'slate'}
                  radius="md"
                  disabled={!isDraft || isDeleting}
                  onClick={() => {
                    modals.openConfirmModal({
                      title: 'Delete loan application',
                      children: (
                        <Text size="sm">
                          Are you sure you want to delete loan application <b>{loanIdentifier}</b>? This
                          cannot be undone.
                        </Text>
                      ),
                      labels: { confirm: 'Delete', cancel: 'Cancel' },
                      confirmProps: { color: 'danger' },
                      onConfirm: () => removeLoan(loanIdentifier),
                    });
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={140} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft ? (
                    <Menu.Item onClick={() => updateStatus({ id: loanIdentifier, action: 'approved' })}>
                      Submit
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      color="danger"
                      onClick={() => updateStatus({ id: loanIdentifier, action: 'cancelled' })}
                    >
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
    setProduct(null);
    setBranch(null);
    setStatus('all');
  };

  // Generate options dynamically from the loaded API data
  const productOptions = Array.from(new Set(data.map((a) => a.product).filter(Boolean)));
  const branchOptions = Array.from(new Set(data.map((a) => a.branch).filter(Boolean)));

  return (
    <Stack gap="lg" p="lg">
      <LoanAccountModal opened={opened} onClose={handleModalClose} loanId={selectedLoanId} isViewMode={isViewMode} />

      {/* Scoped, purely visual — mirrors LoanProduct's row/hover treatment */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
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
            <IconFileInvoice size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Booking
            </Title>
            <Text fz="sm" c="slate.5">
              Manage loan applications and bookings
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar — pill search + pill filters + segmented status control */}
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
            placeholder="Application No. / Customer"
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
            placeholder="All Products"
            data={productOptions as string[]}
            w={166}
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
            size="sm"
            radius="xl"
            placeholder="All Branches"
            data={branchOptions as string[]}
            w={166}
            searchable
            clearable
            rightSection={chevronDown}
            value={branch}
            onChange={(v) => {
              setBranch(v);
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
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Pending', value: 'PENDING_APPROVAL' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Disbursed', value: 'DISBURSED' },
              { label: 'Rejected', value: 'REJECTED' },
            ]}
          />

          <Button size="sm" radius="xl" variant="default" px="md" ml="auto" onClick={resetFilters}>
            Reset
          </Button>
          <Button
            size="sm"
            radius="xl"
            color="brand"
            onClick={() => {
              setSelectedLoanId(null);
              setIsViewMode(false);
              open();
            }}
            leftSection={<IconPlus size={14} />}
            style={{
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            Add Booking
          </Button>
        </Group>
      </Paper>

      {/* Data Table — floating rounded row-cards on a soft canvas */}
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
                          <IconFileText size={24} color="var(--mantine-color-slate-4)" />
                        </Box>
                        <Text ta="center" c="slate.5" fz="xs">
                          No applications match your filters.
                        </Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => {
                    const rowMeta =
                      STATUS_META[row.original.status] || { label: row.original.status, color: 'gray' };
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