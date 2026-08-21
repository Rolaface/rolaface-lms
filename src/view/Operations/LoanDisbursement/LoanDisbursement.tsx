import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import dayjs from 'dayjs';
import { FilterMultiSelect } from '../../../components/shared/FilterMultiSelect';
import { formatAmount, useCurrencyReady } from '../../../store/currencyStore';
import { useCompanyStore } from '../../../store/companyStore';
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon, Text, Pagination, Tooltip, Title, Stack, Loader, Menu, useMantineTheme,
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
  IconDotsVertical,
} from '@tabler/icons-react';

import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { getAllLoansDisbursement, deleteLoanDisbursement, changeLoanDsbrStatus } from '../../../api/loanDisbursementAPi';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { loanDisbursementModal } from './LoanDisbursementModalStore';

interface DisbursementRow {
  id: string; // Maps to 'name'
  againstLoan: string;
  applicant: string;
  loanProduct: string;
  postingDate: string;
  disbursedAmount: number;
  topUp: boolean;
  status: string;
}


const columnHelper = createColumnHelper<DisbursementRow>();
const STATUS_FILTER_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Submitted', label: 'Approved' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Closed', label: 'Closed' },
];

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

// Same visual pattern as LoanAccount's StatusBadge — dot + label, colors
// resolved from the theme's semantic palette (success / warning) rather
// than raw color names.
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
        <Box w={6} h={6} style={{ borderRadius: '50%', background: `var(--mantine-color-${color}-6)` }} />
      }
    >
      {label}
    </Badge>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function LoanDisbursement() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [applicantType, setApplicantType] = useState<string | null>(null);
  const [debouncedApplicantType] = useDebouncedValue(applicantType, 400);
  const [company, setCompany] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Table state
  const [sorting, setSorting] = useState([{ id: 'disbursementDate', desc: true }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedApplicantType, statusFilter]);
  const {
    data: res,
    isLoading,
    isFetching,
    error: queryError,
    refetch: fetchDisbursements,
  } = useQuery({
    queryKey: ['loanDisbursements', debouncedSearch, debouncedApplicantType, statusFilter, page, pageSize],
    queryFn: () =>
      getAllLoansDisbursement({
        search: debouncedSearch || undefined,
        applicant_type: debouncedApplicantType || undefined,
        status: statusFilter.length ? statusFilter : undefined,
        page,
        page_size: pageSize,
      }),
    placeholderData: keepPreviousData,
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
      topUp: item.top_up === 1,
    }));
  }, [res]);

  const showError = (heading: string, error: any) => {
    const errorData = error?.response?.data;
    const errorMessage =
      errorData?._error_message ||
      errorData?.message?.message ||
      error?.message ||
      'An unexpected error occurred.';

    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: errorMessage,
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

  const deleteMutation = useMutation({
    mutationFn: deleteLoanDisbursement,
    onSuccess: (_data, id) => {
      fetchDisbursements();
      showSuccess('Disbursement Deleted', `Disbursement ${id} deleted successfully.`);
    },
    onError: (error: any) => showError('Action Failed', error),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => changeLoanDsbrStatus(id, action),
    onSuccess: (_data, variables) => {
      fetchDisbursements();
      showSuccess(
        variables.action === 'approved' ? 'Disbursement Submitted' : 'Disbursement Cancelled',
        variables.action === 'approved'
          ? `Disbursement ${variables.id} has been submitted for approval.`
          : `Disbursement ${variables.id} has been cancelled.`
      );
    },
    onError: (error: any) => showError('Update Failed', error),
  });

  const filteredData = useMemo(() => {

    return rowsData;
  }, [rowsData]);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    loanDisbursementModal.open({ editId: null, isView: false, initialData: null });
  };

  const handleEdit = (row: DisbursementRow) => {
    queryClient.invalidateQueries({ queryKey: ['loanDisbursement', row.id] });
    loanDisbursementModal.open({ editId: row.id, isView: false, initialData: row });
  };

  const handleView = (row: DisbursementRow) => {
    queryClient.invalidateQueries({ queryKey: ['loanDisbursement', row.id] });
    loanDisbursementModal.open({ editId: row.id, isView: true, initialData: row });
  };

  const confirmDelete = (row: DisbursementRow) => {
    openCommonModal({
      heading: 'Delete Loan Disbursement',
      subtitle: 'This action cannot be undone.',
      body: (
        <>
          Are you sure you want to delete disbursement{' '}
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
          onClick: () => deleteMutation.mutate(row.id),
        },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Disbursement Ref.',
        cell: (info) => {
          const row = info.row.original;
          return (
            <Group gap={6} wrap="nowrap">
              <Text fz="sm" fw={700} c="slate.8" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                {info.getValue()}
              </Text>
              {row.topUp && (
                <Badge
                  variant="light"
                  color="violet"
                  radius="sm"
                  size="xs"
                  styles={{ root: { textTransform: 'none', fontWeight: 700, padding: '0 6px' } }}
                >
                  Top Up
                </Badge>
              )}
            </Group>
          );
        },
      }),
      columnHelper.accessor('againstLoan', {
        header: 'Loan Ref.',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('applicant', {
        header: 'Applicant',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
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
            radius="sm"
            color="brand"
            styles={{ root: { fontSize: 10, padding: '0 8px' } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('postingDate', {
        header: 'Posting Date',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() && info.getValue() !== '—'
              ? dayjs(info.getValue()).format('DD-MMM-YYYY')
              : '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('disbursedAmount', {
        header: 'Disbursed Amount',
        cell: (info) => (
          <Text
            fz="xs"
            fw={600}
            c="slate.8"
            style={{
              fontFamily: 'var(--mantine-font-family-monospace)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatAmount(companyCurrency, info.getValue(), { withSymbol: true })}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const val = info.getValue();
          const color = val === 'Submitted' || val === 'Disbursed' ? 'success' : 'warning';
          const label = val === 'Submitted' ? 'Approved' : val;
          return <StatusBadge label={label} color={color} />;
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
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="slate" radius="md" onClick={() => handleView(row)}>
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
                  onClick={() => handleEdit(row)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canDelete ? 'Delete' : 'Only Draft or Cancelled can be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? 'danger' : 'slate'}
                  radius="md"
                  disabled={!canDelete || isDeleting}
                  loading={isDeleting}
                  onClick={() => confirmDelete(row)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>

              <Menu shadow="md" width={140} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    disabled={isCancelled}
                    loading={statusMutation.isPending && statusMutation.variables?.id === row.id}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft ? (
                    <Menu.Item
                      onClick={() => {
                        openCommonModal({
                          heading: 'Submit Loan Disbursement',
                          subtitle: 'Please confirm this action before continuing.',
                          body: (
                            <>
                              Are you sure you want to approve loan disbursement{' '}
                              <Text span fw={600}>
                                {row.id}
                              </Text>{' '}
                              for approval?
                            </>
                          ),
                          color: 'success',
                          buttons: [
                            { label: 'Cancel', variant: 'default' },
                            {
                              label: 'Submit',
                              color: 'success',
                              onClick: () => {
                                statusMutation.mutate({ id: row.id, action: 'approved' });
                              },
                            },
                          ],
                        });
                      }}
                    >
                      Approve
                    </Menu.Item>
                  ) : !isCancelled ? (
                    <Menu.Item
                      color="danger"
                      onClick={() => {
                        openCommonModal({
                          heading: 'Cancel Loan Disbursement',
                          subtitle: 'This action cannot be undone.',
                          body: (
                            <>
                              Are you sure you want to cancel loan disbursement{' '}
                              <Text span fw={600}>
                                {row.id}
                              </Text>
                              ?
                            </>
                          ),
                          color: 'danger',
                          buttons: [
                            { label: 'Back', variant: 'default' },
                            {
                              label: 'Cancel Disbursement',
                              color: 'danger',
                              onClick: () => {
                                statusMutation.mutate({ id: row.id, action: 'cancelled' });
                              },
                            },
                          ],
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
        },
      }),
    ],
    [deleteMutation, statusMutation, companyCurrency]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = res?.pagination?.total ?? 0;
  const totalPages = res?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearch('');
    setApplicantType(null);
    setCompany(null);
    setStatusFilter([]);
    setPage(1);
  };

  return (
    <Stack gap="lg" p="lg">
      {/* Scoped, purely visual — mirrors LoanAccount's row/hover treatment */}
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      {/* Header — icon tile + title, same pattern as Loan Booking */}
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
            <IconCashBanknote size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Disbursements
            </Title>
            <Text fz="sm" c="slate.5">
              Manage loan disbursements and payouts
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
        <Group gap="xs" wrap="nowrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Loan Ref. / Applicant"
            leftSection={<IconSearch size={14} />}
            style={{ flexGrow: 4, flexShrink: 1, minWidth: 240 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
            }}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Applicant Types"
            data={['Customer', 'Employee', 'Member']}
            style={{ flexGrow: 1, flexShrink: 1, minWidth: 130, maxWidth: 170 }}
            searchable
            clearable
            rightSection={chevronDown}
            value={applicantType}
            onChange={(v) => {
              setApplicantType(v);
            }}
          />

          <FilterMultiSelect
            placeholder="All Statuses"
            data={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
            }}
            width={140}
          />

          <Button size="sm" radius="xl" variant="default" px="sm" style={{ flexShrink: 0 }} onClick={resetFilters}>
            Reset
          </Button>
          <Button
            size="sm"
            radius="xl"
            color="brand"
            px="sm"
            style={{
              flexShrink: 0,
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
            onClick={handleAdd}
            leftSection={<IconPlus size={14} />}
          >
            Add Disbursement
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
            <Box style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 120ms ease' }}>
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
                          <IconCashBanknote size={24} color="var(--mantine-color-slate-4)" />
                        </Box>
                        <Text ta="center" c="slate.5" fz="xs">
                          No disbursements match your filters.
                        </Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => {
                    const st = row.original.status;
                    const rowColor = st === 'Submitted' || st === 'Disbursed' ? 'success' : 'warning';
                    const cells = row.getVisibleCells();
                    return (
                      <Table.Tr
                        key={row.id}
                        className="lms-row"
                        onDoubleClick={() => handleView(row.original)}
                        style={{ cursor: 'pointer' }}
                      >
                        {cells.map((cell, idx) => (
                          <Table.Td
                            key={cell.id}
                            style={{
                              padding: '10px 10px',
                              border: 'none',
                              boxShadow: 'var(--mantine-shadow-xs)',
                              borderLeft: idx === 0 ? `3px solid var(--mantine-color-${rowColor}-4)` : undefined,
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
                onChange={(v) => { setPageSize(Number(v) || 10); setPage(1); }}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={totalPages}
            value={page}
            onChange={(p) => setPage(p)}
            color="brand"
            size="xs"
            radius="xl"
            disabled={totalRows === 0}
          />
        </Group>
      </>
        )}
    </Paper>
    </Stack >
  );
}