import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Box,
  Paper,
  TextInput,
  Checkbox,
  Button,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Modal,
  Loader,
  Table,
  Stack,
  useMantineTheme,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconLayoutList,
  IconChevronRight,
  IconDownload,
  IconFolder,
  IconFolderOpen,
  IconBook,
  IconBookmark,
  IconDots,
  IconPencil,
  IconEye,
  IconTrash,
  IconGitBranch,
  IconAlertCircle,
} from '@tabler/icons-react';

import { type COAAccount, formatAmount } from '../../api/Accounting/Chartofaccounts.api';
import { useChartOfAccounts } from '../../hooks/Accounting/Usechartofaccounts';

import { useCurrencyReady } from '../../store/currencyStore';

/* Theme tokens, not raw Mantine colors — keep this the single mapping
   from root_type -> theme color so it stays in sync with mantineTheme.ts */
const ROOT_TYPE_COLOR: Record<COAAccount['root_type'], string> = {
  Asset: 'indigoAlt',
  Liability: 'danger',
  Equity: 'accent',
  Income: 'success',
  Expense: 'slate',
};

/* ───────────────── Filter bar ───────────────── */

function FilterBar({
  searchTerm, setSearchTerm, hideZero, setHideZero,
  onRefresh, loading, allExpanded, onToggleExpand, onExport,
  theme,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  hideZero: boolean;
  setHideZero: (v: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  allExpanded: boolean;
  onToggleExpand: () => void;
  onExport: () => void;
  theme: ReturnType<typeof useMantineTheme>;
}) {
  return (
    <Paper
      radius="xl"
      p="xs"
      style={{
        flexShrink: 0,
        background: 'var(--mantine-color-slate-0)',
        border: '1px solid var(--mantine-color-slate-2)',
      }}
    >
      <Group gap="sm" wrap="wrap" align="center">
        <TextInput
          className="coa-search"
          radius="xl"
          placeholder="Search accounts..."
          leftSection={<IconSearch size={13} />}
          style={{ flex: 1, minWidth: 220 }}
          styles={{
            input: { border: '1px solid var(--mantine-color-slate-2)' },
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        <Checkbox
          size="xs"
          label="Hide Zero Values"
          checked={hideZero}
          onChange={(e) => setHideZero(e.currentTarget.checked)}
        />

        <Group gap={6} ml="auto" wrap="nowrap">
          <Button size="xs" radius="xl" variant="default" leftSection={
            allExpanded ? <IconChevronRight size={13} /> : <IconLayoutList size={13} />
          } onClick={onToggleExpand}>
            {allExpanded ? 'Collapse' : 'Expand All'}
          </Button>
          <Button
            size="xs"
            radius="xl"
            variant="default"
            leftSection={<IconRefresh size={13} className={loading ? 'animate-spin' : ''} />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            size="xs"
            radius="xl"
            color="brand"
            leftSection={<IconDownload size={13} />}
            onClick={onExport}
            style={{
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            Export
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}

/* ───────────────── View modal ───────────────── */

function ViewAccountModal({ account, onClose }: { account: COAAccount | null; onClose: () => void }) {
  return (
    <Modal opened={account !== null} onClose={onClose} title="Account Details" size="sm">
      {account && (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Group justify="space-between">
            <Text fz="xs" c="slate.5">Account Name</Text>
            <Text fz="xs" fw={600} c="slate.8">{account.account_name}</Text>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="slate.5">Account Type</Text>
            <Text fz="xs" c="slate.7">{account.account_type || '—'}</Text>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="slate.5">Root Type</Text>
            <Badge size="sm" variant="light" color={ROOT_TYPE_COLOR[account.root_type]}>
              {account.root_type}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="slate.5">Currency</Text>
            <Text fz="xs" c="slate.7">{account.account_currency}</Text>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="slate.5">Balance</Text>
            <Text fz="xs" fw={600} c="slate.8">
             {formatAmount(account.account_currency, account.balance_in_account_currency ?? account.balance, { withSymbol: true })}
            </Text>
          </Group>
        </Box>
      )}
    </Modal>
  );
}

/* ───────────────── Columns ───────────────── */

function useColumns(
  onView: (a: COAAccount) => void,
  onDelete: (a: COAAccount) => void,
  baseCurrency: string,
): ColumnDef<COAAccount>[] {
  return useMemo<ColumnDef<COAAccount>[]>(
    () => [
      {
        id: 'name',
        header: 'Account Name',
        size: 300,
        cell: ({ row }) => {
          const node = row.original;
          const canExpand = row.getCanExpand();
          return (
            <Group gap={6} wrap="nowrap" style={{ paddingLeft: row.depth * 18 }}>
              {canExpand ? (
                <ActionIcon size="xs" variant="subtle" color="slate" tabIndex={-1} style={{ pointerEvents: 'none' }}>
                  {row.getIsExpanded() ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
                </ActionIcon>
              ) : (
                <IconBook size={13} color="var(--mantine-color-slate-4)" style={{ flexShrink: 0, marginLeft: 4 }} />
              )}
              <Text fz="xs" fw={node.is_group ? 700 : 500} c={node.is_group ? 'slate.8' : 'slate.7'} truncate>
                {node.account_name}
              </Text>
              {node.disabled === 1 && (
                <Badge size="xs" variant="light" color="slate" style={{ flexShrink: 0 }}>
                  Disabled
                </Badge>
              )}
            </Group>
          );
        },
      },
      {
        id: 'account_type',
        header: 'Account Type',
        size: 150,
        cell: ({ row }) => (
          <Text fz="xs" c="slate.5">{row.original.account_type || '—'}</Text>
        ),
      },
      {
        id: 'root_type',
        header: 'Root Type',
        size: 110,
        cell: ({ row }) => (
          <Badge size="sm" variant="light" color={ROOT_TYPE_COLOR[row.original.root_type]} styles={{ root: { fontSize: 10, padding: '0 8px' } }}>
            {row.original.root_type}
          </Badge>
        ),
      },
      {
        id: 'balance',
        header: () => <Text fz="xs" fw={700} ta="right" w="100%">Balance</Text>,
        size: 150,
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group === 1) return <Text fz="xs" c="slate.4" ta="right">—</Text>;
          return (
            <Text
              fz="xs"
              ta="right"
              fw={600}
              c="success.6"
              style={{
                fontFamily: 'var(--mantine-font-family-monospace)',
                fontVariantNumeric: 'tabular-nums',
                background: 'var(--mantine-color-slate-0)',
                borderRadius: 'var(--mantine-radius-sm)',
                padding: '4px 8px',
                display: 'inline-block',
              }}
            >
              {formatAmount(node.account_currency, node.balance_in_account_currency ?? node.balance, { withSymbol: true })}
            </Text>
          );
        },
      },
      {
        id: 'balance_base',
        header: () => <Text fz="xs" fw={700} ta="right" w="100%">Balance ({baseCurrency})</Text>,
        size: 160,
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group === 1) return <Text fz="xs" c="slate.4" ta="right">—</Text>;
          return (
            <Text
              fz="xs"
              ta="right"
              fw={600}
              c="slate.7"
              style={{
                fontFamily: 'var(--mantine-font-family-monospace)',
                fontVariantNumeric: 'tabular-nums',
                background: 'var(--mantine-color-slate-0)',
                borderRadius: 'var(--mantine-radius-sm)',
                padding: '4px 8px',
                display: 'inline-block',
              }}
            >
             {formatAmount(baseCurrency, node.balance, { withSymbol: true })}
            </Text>
          );
        },
      },
      {
        id: 'actions',
        header: () => <Text fz="xs" fw={700} ta="right" w="100%">Actions</Text>,
        size: 50,
        cell: ({ row }) => {
          const node = row.original;
          return (
            <Group justify="flex-end" onClick={(e) => e.stopPropagation()}>
              <Menu shadow="md" width={170} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                    <IconDots size={15} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconPencil size={13} />}>Edit</Menu.Item>
                  <Menu.Item leftSection={<IconEye size={13} />} onClick={() => onView(node)}>
                    View
                  </Menu.Item>
                  {node.is_group === 1 ? (
                    <Menu.Item leftSection={<IconGitBranch size={13} />}>Add Child</Menu.Item>
                  ) : (
                    <Menu.Item leftSection={<IconBookmark size={13} />}>View Ledger</Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    color="danger"
                    leftSection={<IconTrash size={13} />}
                    onClick={() => onDelete(node)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      },
    ],
    [onView, onDelete, baseCurrency],
  );
}

/* ───────────────── Page ───────────────── */

export function ChartOfAccounts() {
  useCurrencyReady();
  const theme = useMantineTheme();

  const {
    searchTerm, setSearchTerm,
    hideZero, setHideZero,
    loading, allExpanded,
    handleToggleExpand, handleRefresh, handleExport,
    tableData, expanded, handleExpandedChange,
    viewAccount, setViewAccount,
    handleDelete,
    baseCurrency,
  } = useChartOfAccounts();

  const columns = useColumns(setViewAccount, handleDelete, baseCurrency);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: handleExpandedChange,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    // No h="100%" / flex-fill here — that needs a bounded-height parent
    // which this route doesn't have, so the whole page was scrolling
    // instead of the table. Fixed maxHeight below is self-contained:
    // works regardless of what the parent layout does.
    <Stack gap="lg" p="lg">
      <style>{`
        .coa-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .coa-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .coa-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .coa-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .coa-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .coa-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      <ViewAccountModal account={viewAccount} onClose={() => setViewAccount(null)} />

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        hideZero={hideZero}
        setHideZero={setHideZero}
        onRefresh={handleRefresh}
        loading={loading}
        allExpanded={allExpanded}
        onToggleExpand={handleToggleExpand}
        onExport={handleExport}
        theme={theme}
      />

      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: 'var(--mantine-color-slate-0)',
          border: '1px solid var(--mantine-color-slate-2)',
        }}
      >
        {/* This Box is the ONLY thing that scrolls — fixed maxHeight
            means the table stays contained and the page around it
            (filters, header, sidebar) never moves. */}
        <Box style={{ maxHeight: 'calc(100vh - 250px)', minHeight: 280, overflowY: 'auto', overflowX: 'auto' }}>
          <Table
            verticalSpacing="sm"
            horizontalSpacing="sm"
            fz="xs"
            w="100%"
            style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}
          >
            <Table.Thead>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <Table.Th
                      key={header.id}
                      className="coa-thead-cell"
                      c="slate.5"
                      fw={700}
                      style={{
                        fontSize: 'var(--mantine-font-size-xs)',
                        padding: '0 10px 6px',
                        userSelect: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: 'none',
                        minWidth: header.getSize(),
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} style={{ border: 'none' }}>
                    <Group justify="center" py={64}>
                      <Loader size="sm" color="indigoAlt.4" />
                    </Group>
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
                        <IconAlertCircle size={26} color="var(--mantine-color-slate-4)" />
                      </Box>
                      <Text ta="center" c="slate.5" fz="xs">No accounts found.</Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr
                    key={row.id}
                    className="coa-row"
                    style={row.getCanExpand() ? { cursor: 'pointer' } : undefined}
                    onClick={row.getCanExpand() ? row.getToggleExpandedHandler() : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: '10px 10px',
                          border: 'none',
                          boxShadow: 'var(--mantine-shadow-xs)',
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}