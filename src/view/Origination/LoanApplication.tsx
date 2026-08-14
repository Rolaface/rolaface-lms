import { useEffect, useMemo, useState } from 'react';
import { modals } from '@mantine/modals';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  useMantineTheme,
  Menu,
} from '@mantine/core';
import {
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileText,
  IconTrash,
  IconAlertTriangle,
  IconDotsVertical,
  IconEye,
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

import { LoanApplicationModal } from '../../components/Modal/LoanApplication/LoanApplicationModal';
import { LoanApplicationDetailView } from './LoanApplicationDetailView';
import {
  getAllLoanApplications,
  deleteLoanApplication,
  changeLoanApplicationStatus,
  convertCustomLoanApplicationToLoan,
} from '../../api/loanApplicationApi';
import { parseFrappeError } from '../../utils/parseFrappeError';
import { useCompanyStore } from '../../store/companyStore';

// Matches the actual /getAllLoanApplications response shape:
// { name, application_type, customer, status, application_date, first_name, last_name, company_name }
export interface LoanApplicationRow {
  name: string;
  application_type: string;
  customer: string | null;
  status: string;
  application_date: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}
const columnHelper = createColumnHelper<LoanApplicationRow>();

// TODO: replace with your real status picklist if it differs.
// Added 'Submitted' since it appears in the real API response's data.
const STATUS_OPTIONS = ['Open', 'Draft', 'Submitted', 'Sanctioned', 'Rejected', 'Closed'];

export const STATUS_COLOR: Record<string, string> = {
  Open: 'info',
  Draft: 'slate',
  Submitted: 'info',
  Sanctioned: 'success',
  Rejected: 'danger',
  Closed: 'slate',
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ status }: { status: string }) {
  const scale = STATUS_COLOR[status] ?? 'slate';
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box w={6} h={6} style={{ borderRadius: '50%', background: `var(--mantine-color-${scale}-6)` }} />
      }
    >
      {status}
    </Badge>
  );
}

function ApplicationIdCell({ name }: { name: string }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        style={{
          width: 30,
          height: 30,
          borderRadius: 'var(--mantine-radius-md)',
          background: 'var(--mantine-color-brand-0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconFileText size={14} color="var(--mantine-color-brand-6)" />
      </Box>
      <Text fz="xs" fw={700} c="slate.8" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
        {name}
      </Text>
    </Group>
  );
}

// Business Loan rows don't have first_name/last_name, so the applicant column
// falls back to company_name for those; Personal Loan rows fall back to the
// concatenated name.
function getApplicantDisplayName(row: LoanApplicationRow) {
  if (row.application_type === 'Business Loan') {
    return row.company_name || '—';
  }
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return fullName || '—';
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

function formatDate(date: string) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function LoanApplication() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const companyName = useCompanyStore((state) => state.companyName);

  const [editingId, setEditingId] = useState<string | null>(null);
  // Replaces the old modal-based "view" mode — now swaps the whole page
  // content for LoanApplicationDetailView, mirroring Customer.tsx/Borrower360.
  const [viewingApplicationId, setViewingApplicationId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [company, setCompany] = useState<string | null>(null);
  // Replaces the old loan-product filter: the real API response has no
  // loan_product field, so this now filters by application_type instead.
  const [applicationType, setApplicationType] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  const [sorting, setSorting] = useState([{ id: 'application_date', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => changeLoanApplicationStatus(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
    },
    onError: (error: any) => {
      const errorMessage = parseFrappeError(error);
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

  const convertToLoanMutation = useMutation({
    mutationFn: ({ id, company: companyParam }: { id: string; company: string }) =>
      convertCustomLoanApplicationToLoan({ id, company: companyParam }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
    },
    onError: (error: any) => {
      const errorMessage = parseFrappeError(error);
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

  const {
    data: applicationsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['loan-applications'],
    queryFn: getAllLoanApplications,
  });

  const data: LoanApplicationRow[] = useMemo(
    () => applicationsResponse?.data ?? [],
    [applicationsResponse],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteLoanApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
    },
    onError: (error: any) => {
      const errorMessage = parseFrappeError(error);
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

  const applicationTypeOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.application_type).filter(Boolean))),
    [data],
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((a) => {
      const applicantName = getApplicantDisplayName(a).toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        applicantName.includes(q) ||
        (a.customer ?? '').toLowerCase().includes(q) ||
        (a.application_type ?? '').toLowerCase().includes(q);
      const matchesType = !applicationType || a.application_type === applicationType;
      const matchesStatus = status === 'all' || a.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, company, applicationType, status]);

  // If the application being viewed disappears (deleted / filtered out of a
  // fresh fetch), fall back to the list instead of showing a stale detail page.
  useEffect(() => {
    if (viewingApplicationId !== null && !data.some((a) => a.name === viewingApplicationId)) {
      setViewingApplicationId(null);
    }
  }, [viewingApplicationId, data]);

  const handleAdd = () => {
    setEditingId(null);
    open();
  };

  const handleView = (id: string) => {
    setViewingApplicationId(id);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    open();
  };

  const handleModalClose = () => {
    setEditingId(null);
    close();
  };

  const confirmApprove = (id: string) => {
    modals.openConfirmModal({
      title: 'Approve loan application',
      children: (
        <Text size="sm">
          Are you sure you want to approve loan application <b>{id}</b>?
        </Text>
      ),
      labels: { confirm: 'Approve', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: () => statusMutation.mutate({ id, action: 'approved' }),
    });
  };

  const confirmReject = (id: string) => {
    modals.openConfirmModal({
      title: 'Reject loan application',
      children: (
        <Text size="sm">
          Are you sure you want to reject loan application <b>{id}</b>? This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Reject', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => statusMutation.mutate({ id, action: 'rejected' }),
    });
  };

  const confirmDelete = (id: string) => {
    modals.openConfirmModal({
      title: 'Delete loan application',
      children: <Text size="sm">Are you sure you want to delete <b>{id}</b>? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const confirmCreateLoanBooking = (id: string) => {
    modals.openConfirmModal({
      title: 'Create loan booking',
      children: (
        <Text size="sm">
          Are you sure you want to create a loan booking for application <b>{id}</b>?
        </Text>
      ),
      labels: { confirm: 'Create Booking', cancel: 'Cancel' },
      confirmProps: { color: 'brand' },
      onConfirm: () => convertToLoanMutation.mutate({ id, company: companyName }),
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Application',
        cell: (info) => <ApplicationIdCell name={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'applicant',
        header: 'Applicant',
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            {getApplicantDisplayName(info.row.original)}
          </Text>
        ),
      }),
      columnHelper.accessor('application_type', {
        header: 'Type',
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
      columnHelper.accessor('customer', {
        header: 'Customer',
        cell: (info) => (
          <Text fz="xs" c="slate.6" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
            {info.getValue() || '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('application_date', {
        header: 'Application Date',
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {formatDate(info.getValue())}
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
          const isDraft = row.status === 'Draft' || row.status === 'Open';
          return (
            <Group justify="flex-end" gap={6} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleView(row.name)}>
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? 'Edit' : 'Only Open/Draft applications can be edited'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? 'brand' : 'gray'}
                  disabled={!isDraft}
                  onClick={() => handleEdit(row.name)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? 'Delete' : 'Only Open/Draft applications can be deleted'} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? 'danger' : 'gray'}
                  disabled={!isDraft || deleteMutation.isPending}
                  onClick={() => confirmDelete(row.name)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="gray">
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft ? (
                    <>
                      <Menu.Item onClick={() => confirmApprove(row.name)}>Approve</Menu.Item>
                      <Menu.Item color="red" onClick={() => confirmReject(row.name)}>
                        Reject
                      </Menu.Item>
                      <Menu.Item onClick={() => confirmCreateLoanBooking(row.name)}>
                      Create Loan Booking
                    </Menu.Item>
                    </>
                  ) : (
                    <>
                     <Menu.Item onClick={() => confirmCreateLoanBooking(row.name)}>
                      Create Loan Booking
                    </Menu.Item>
                    <Menu.Item>
                      Delete
                    </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    [],
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
    setCompany(null);
    setApplicationType(null);
    setStatus('all');
  };

  // --- View swap: same pattern as Customer.tsx / Borrower360 ---
  if (viewingApplicationId !== null) {
    const application = data.find((a) => a.name === viewingApplicationId);
    if (application) {
      return (
        <Box p="xl" mt="xl">
          <LoanApplicationDetailView
            application={application}
            onBack={() => setViewingApplicationId(null)}
            onEdit={() => {
              setViewingApplicationId(null);
              handleEdit(application.name);
            }}
            onApprove={() => confirmApprove(application.name)}
            onReject={() => confirmReject(application.name)}
            isActionPending={statusMutation.isPending}
          />
        </Box>
      );
    }
    return null;
  }

  return (
    <Stack gap="lg" p="lg">
      <LoanApplicationModal opened={opened} onClose={handleModalClose} loanApplicationId={editingId} />

      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
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
            <IconFileText size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Applications
            </Title>
            <Text fz="sm" c="slate.5">
              Track and manage loan applications
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar */}
      <Paper
        radius="xl"
        p="xs"
        style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Application / Applicant / Type / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 260 }}
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
            placeholder="All Types"
            data={applicationTypeOptions}
            w={166}
            searchable
            clearable
            rightSection={chevronDown}
            value={applicationType}
            onChange={(v) => {
              setApplicationType(v);
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
            data={[{ label: 'All', value: 'all' }, ...STATUS_OPTIONS.map((s) => ({ label: s, value: s }))]}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={handleAdd}
              leftSection={<IconPlus size={14} />}
              style={{ background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadowSm }}
            >
              New Application
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper
        radius="lg"
        p="sm"
        style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}
      >
        {isLoading ? (
          <Stack align="center" gap="xs" py="xl">
            <Loader size="sm" color="brand" />
            <Text ta="center" c="slate.5" fz="xs">
              Loading loan applications…
            </Text>
          </Stack>
        ) : isError ? (
          <Stack align="center" gap="xs" py="xl">
            <IconAlertTriangle size={26} color="var(--mantine-color-danger-5)" />
            <Text ta="center" c="danger.6" fz="xs">
              Couldn't load loan applications. Please try again.
            </Text>
          </Stack>
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
                          <Group gap="xs" wrap="nowrap" justify={header.id === 'actions' ? 'flex-end' : 'flex-start'}>
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
                          <IconFileText size={26} color="var(--mantine-color-slate-4)" />
                        </Box>
                        <Text ta="center" c="slate.5" fz="xs">
                          No loan applications match your filters.
                        </Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => {
                    const scale = STATUS_COLOR[row.original.status] ?? 'slate';
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
                              borderLeft: idx === 0 ? `3px solid var(--mantine-color-${scale}-4)` : undefined,
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
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}