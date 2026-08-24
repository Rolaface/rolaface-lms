import { useMemo, useState } from 'react';
import { Box, Button, TextInput, Group, Paper, Table, Text, Pagination, Tooltip, Title, Stack, useMantineTheme, Loader, Select, ActionIcon, Switch } from '@mantine/core';
import { IconEye, IconPencil, IconPlus, IconSearch, IconShieldCheck, IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { useUserRoleList } from '../../hooks/user/useUserRoleList';
import { openCommonModal } from '../../components/Modal/AlertModal';
import { roleModal } from '../../components/Modal/User/Rolemodalstore';
import { StatusBadge } from '../Customer/CustomerTableCells';

interface RoleRow {
  Id: string;
  roleName: string;
  disabled: 0 | 1;
}

const columnHelper = createColumnHelper<RoleRow>();

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  const color = sorted ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-slate-4)';
  if (sorted === 'asc') return <IconChevronUp size={12} color={color} />;
  if (sorted === 'desc') return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

export function RoleManagement() {
  const theme = useMantineTheme();
  const {
    searchInput, setSearchInput,
    page, setPage,
    pageSize, setPageSize,
    rows, pagination, loading,
    handleToggleStatus, togglingId,
    openEdit, openView, loadingId,
  } = useUserRoleList();

  const [sorting, setSorting] = useState<SortingState>([{ id: 'roleName', desc: false }]);

  const confirmToggle = (row: RoleRow) => {
    const willEnable = row.disabled === 1;
    openCommonModal({
      heading: willEnable ? 'Enable Role' : 'Disable Role',
      subtitle: 'Please confirm before proceeding.',
      body: <>Are you sure you want to {willEnable ? 'enable' : 'disable'} role <Text span fw={600}>{row.roleName}</Text>?</>,
      color: willEnable ? 'teal' : 'red',
      buttons: [
        { label: 'Cancel', variant: 'default' },
        { label: willEnable ? 'Enable' : 'Disable', color: willEnable ? 'teal' : 'red', onClick: () => handleToggleStatus(row.Id, row.disabled) },
      ],
    });
  };

  const columns = useMemo(() => [
    columnHelper.accessor('roleName', {
      header: 'Role Name',
      cell: (info) => <Text fz="sm" fw={700} c="slate.8">{info.getValue()}</Text>,
    }),
    columnHelper.accessor('disabled', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue() === 0 ? 'ACTIVE' : 'INACTIVE'} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const row = info.row.original;
        const isLoadingRow = loadingId === row.Id;
        const isToggling = togglingId === row.Id;
        return (
          <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions" onDoubleClick={(e) => e.stopPropagation()}>
            <Tooltip label="View" withArrow>
              <ActionIcon size="sm" variant="subtle" color="slate" radius="md" disabled={isLoadingRow} onClick={() => openView(row.Id)}>
                {isLoadingRow ? <Loader size={14} /> : <IconEye size={14} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="brand" radius="md" disabled={isLoadingRow} onClick={() => openEdit(row.Id)}>
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={row.disabled ? 'Enable' : 'Disable'} withArrow>
              <Switch
                size="xs"
                color="success"
                checked={!row.disabled}
                disabled={isToggling}
                onChange={() => confirmToggle(row)}
              />
            </Tooltip>
          </Group>
        );
      },
    }),
  ], [loadingId, togglingId, openView, openEdit, confirmToggle]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalRows = pagination?.total ?? 0;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const tableRows = table.getRowModel().rows;

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box style={{ width: 40, height: 40, borderRadius: 'var(--mantine-radius-md)', background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconShieldCheck size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>Role Management</Title>
            <Text fz="sm" c="slate.5">Manage roles and module permissions</Text>
          </Stack>
        </Group>
      </Group>

      <Paper radius="xl" p="xs" style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm" radius="xl" placeholder="Search by role name"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />
          <Group gap="xs" ml="auto">
            <Button
               size="sm" radius="xl" color="brand" onClick={() => roleModal.open({})}
              leftSection={<IconPlus size={14} />}
              style={{ background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadowSm }}
            >
              Add Role
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" pos="relative" style={{ background: 'var(--mantine-color-slate-0)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Box style={{ height: 'clamp(320px, calc(100vh - 280px), 720px)', overflowY: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 120ms ease' }}>
          <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs" w="100%" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
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
              {loading ? (
                <Table.Tr><Table.Td colSpan={columns.length} style={{ border: 'none' }}><Group justify="center" py="xl"><Loader size="sm" color="brand" /></Group></Table.Td></Table.Tr>
              ) : tableRows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                    <Stack align="center" gap="xs" py="xl">
                      <Box style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--mantine-color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--mantine-color-slate-2)' }}>
                        <IconShieldCheck size={26} color="var(--mantine-color-slate-4)" />
                      </Box>
                      <Text ta="center" c="slate.5" fz="xs">No roles match your filters.</Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                tableRows.map((row) => {
                  const original = row.original;
                  const isLoadingRow = loadingId === original.Id;
                  const isToggling = togglingId === original.Id;
                  const isActive = original.disabled === 0;
                  return (
                    <Table.Tr
                      key={row.id}
                      className="lms-row"
                      style={{ cursor: 'pointer' }}
                      onDoubleClick={() => {
                        if (isLoadingRow) return;
                        openView(original.Id);
                      }}
                    >
                      {row.getVisibleCells().map((cell, idx) => (
                        <Table.Td
                          key={cell.id}
                          style={{
                            padding: '10px',
                            border: 'none',
                            boxShadow: 'var(--mantine-shadow-xs)',
                            borderLeft: idx === 0 ? `3px solid var(--mantine-color-${isActive ? 'success' : 'danger'}-4)` : undefined,
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

        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
            <span>{totalRows === 0 ? 'Showing 0 of 0' : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select data={['10', '20', '50']} value={String(pageSize)} onChange={(v) => { setPageSize(Number(v) || 20); setPage(1); }} size="xs" radius="xl" w={60} rightSection={<IconChevronDown size={14} style={{ opacity: 0.6 }} />} />
            </Group>
          </Group>
          <Pagination total={pagination?.total_pages || 1} value={page} onChange={setPage} color="brand" size="xs" radius="xl" disabled={totalRows === 0} />
        </Group>
      </Paper>

    </Stack>
  );
}