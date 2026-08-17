import { useMemo, useState } from 'react';
import {
  Box, Button, TextInput, Select, Group, Paper, Table, Badge, ActionIcon,
  Text, Pagination, Tooltip, Title, Stack, useMantineTheme, Loader, Menu,
} from '@mantine/core';
import {
  IconEye, IconPencil, IconPlus, IconSearch, IconFileOff, IconTrash, IconRefresh,
  IconCircleCheck, IconDotsVertical,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLoanRestructureList } from '../../../hooks/useLoanRestructureList';
import { openCommonModal } from '../../../components/Modal/AlertModal';
import { RESTRUCTURE_STATUSES, type LoanRestructureListItem } from '../../../api/loanRestructureApi';
import { loanRestructureModal } from './LoanRestructureModalStore';

const STATUS_META: Record<string, { label: string; color: string }> = {
  Initiated: { label: 'INITIATED', color: 'gold' },
  Approved: { label: 'APPROVED', color: 'brand' },
  Draft: { label: 'DRAFT', color: 'slate' },
  Cancelled: { label: 'CANCELLED', color: 'danger' },
};


const fmtDate = (iso: string) => (iso ? dayjs(iso).format('DD-MMM-YYYY') : '—');

const chevronDown = undefined;

export function LoanRestructure() {
  const theme = useMantineTheme();



  const {
    search, setSearch,
    status, setStatus,
    page, setPage,
    pageSize, setPageSize,
    rows, pagination, loading,
    refetch, handleDelete,
    handleApprove, approvingName,
  } = useLoanRestructureList();

  const confirmDelete = (row: LoanRestructureListItem) => {
    openCommonModal({
      heading: 'Delete Restructure Request',
      subtitle: 'This action cannot be undone.',
      body: <>Are you sure you want to delete restructure request <Text span fw={600}>{row.name}</Text>?</>,
      color: 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        { label: 'Delete', color: 'red', onClick: () => handleDelete(row.name) },
      ],
    });
  };

  const confirmApprove = (row: LoanRestructureListItem) => {
    openCommonModal({
      heading: 'Approve Restructure Request',
      subtitle: 'Please confirm before proceeding.',
      body: <>Are you sure you want to approve restructure request <Text span fw={600}>{row.name}</Text>? Once approved, this request can no longer be edited or deleted.</>,
      color: 'teal',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        { label: 'Approve', color: 'teal', onClick: () => handleApprove(row.name) },
      ],
    });
  };



  const totalRows = pagination?.total ?? 0;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box style={{ width: 40, height: 40, borderRadius: 'var(--mantine-radius-md)', background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconRefresh size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>Loan Restructures</Title>
            <Text fz="sm" c="slate.5">Manage rate changes, top-ups and maturity modifications</Text>
          </Stack>
        </Group>
      </Group>

      <Paper radius="xl" p="xs" style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            size="sm" radius="xl" placeholder="Search by restructure name / loan"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            size="sm" radius="xl" placeholder="All Statuses"
            data={RESTRUCTURE_STATUSES.map((s) => ({ value: s, label: s }))}
            w={180} clearable rightSection={chevronDown}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={status === 'all' ? null : status}
            onChange={(v) => { setStatus((v as any) || 'all'); setPage(1); }}
          />
          <Group gap="xs" ml="auto">
            <Button
              size="sm" radius="xl" color="brand" onClick={() => loanRestructureModal.open({ editName: null, viewName: null })}
              leftSection={<IconPlus size={14} />}
              style={{ background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadowSm }}
            >
              Restructure Loan
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs" w="100%" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Restructure ID</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Type</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Reason</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Date</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none' }}>Status</Table.Th>
              <Table.Th style={{ padding: '0 10px 6px', textAlign: 'right', border: 'none' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr><Table.Td colSpan={6} style={{ border: 'none' }}><Text ta="center" c="slate.5" fz="xs" py="xl">Loading...</Text></Table.Td></Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ border: 'none' }}>
                  <Stack align="center" gap="xs" py="xl">
                    <IconFileOff size={26} color="var(--mantine-color-slate-4)" />
                    <Text ta="center" c="slate.5" fz="xs">No restructure requests match your filters.</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const meta = STATUS_META[row.status] || { label: row.status || '—', color: 'slate' };
                const isDraft = row.status === 'Draft';
                const isApproving = approvingName === row.name;
                return (
                  <Table.Tr key={row.name} className="lms-row">
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)', borderLeft: '3px solid var(--mantine-color-brand-4)' }}>
                      <Text fz="sm" fw={700} c="slate.8" className="font-mono">{row.name}</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Badge variant="light" size="sm" radius="sm" color="brand" styles={{ root: { fontSize: 10 } }}>{row.restructure_type}</Badge>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Text fz="xs" c="slate.5">{row.reason_for_restructure || '—'}</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Text fz="xs" c="slate.5">{fmtDate(row.restructure_date)}</Text>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Badge variant="light" size="sm" radius="sm" color={meta.color} styles={{ root: { fontSize: 10 } }}>{meta.label}</Badge>
                    </Table.Td>
                    <Table.Td style={{ padding: '10px', border: 'none', boxShadow: 'var(--mantine-shadow-xs)' }}>
                      <Group justify="flex-end" gap={4} wrap="nowrap">
                        <Tooltip label="View" withArrow>
                          <ActionIcon size="sm" variant="subtle" color="slate" radius="md" onClick={() => loanRestructureModal.open({ editName: null, viewName: row.name })}>
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={isDraft ? 'Edit' : 'Only Draft can be edited'} withArrow>
                          <ActionIcon size="sm" variant="subtle" color={isDraft ? 'brand' : 'slate'} radius="md" disabled={!isDraft} onClick={() => loanRestructureModal.open({ editName: row.name, viewName: null })}>
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={isDraft ? 'Delete' : 'Only Draft can be deleted'} withArrow>
                          <ActionIcon size="sm" variant="subtle" color={isDraft ? 'danger' : 'slate'} radius="md" disabled={!isDraft} onClick={() => confirmDelete(row)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Menu shadow="md" width={170} radius="md" position="bottom-end" withArrow disabled={!isDraft || isApproving}>
                          <Menu.Target>
                            <Tooltip label={isDraft ? 'More actions' : 'No actions available'} withArrow>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="slate"
                                radius="md"
                                disabled={!isDraft || isApproving}
                                aria-label="More actions"
                              >
                                {isApproving ? <Loader size={14} /> : <IconDotsVertical size={14} />}
                              </ActionIcon>
                            </Tooltip>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconCircleCheck size={14} />}
                              color="success"
                              onClick={() => confirmApprove(row)}
                            >
                              Approve
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
            <span>{totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select data={['10', '20', '50']} value={String(pageSize)} onChange={(v) => { setPageSize(Number(v) || 10); setPage(1); }} size="xs" radius="xl" w={60} />
            </Group>
          </Group>
          <Pagination total={pagination?.total_pages || 1} value={page} onChange={setPage} color="brand" size="xs" radius="xl" disabled={totalRows === 0} />
        </Group>
      </Paper>
    </Stack>
  );
}