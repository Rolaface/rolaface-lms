

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
  Title,
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

import { type COAAccount, BASE_CURRENCY, formatAmount } from '../../api/Accounting/Chartofaccounts.api';
import { useChartOfAccounts } from '../../hooks/Accounting/Usechartofaccounts';

// NOTE: excel export needs `xlsx` — install with: npm install xlsx

const ROOT_TYPE_COLOR: Record<COAAccount['root_type'], string> = {
  Asset: 'indigoAlt',
  Liability: 'red',
  Equity: 'yellow',
  Income: 'green',
  Expense: 'gray',
};

/* ───────────────── Filter bar ───────────────── */

function FilterBar({
  searchTerm, setSearchTerm, hideZero, setHideZero,
  onRefresh, loading, allExpanded, onToggleExpand, onExport,
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
}) {
  return (
    <Paper withBorder radius="md" p="xs" className="shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <TextInput
          size="xs"
          placeholder="Search accounts..."
          leftSection={<IconSearch size={13} />}
          className="flex-1 min-w-[220px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        <Checkbox
          size="xs"
          label="Hide Zero Values"
          checked={hideZero}
          onChange={(e) => setHideZero(e.currentTarget.checked)}
        />

        <Group gap={6} className="ml-auto" wrap="nowrap">
          <Button size="xs" variant="default" leftSection={
            allExpanded ? <IconChevronRight size={13} /> : <IconLayoutList size={13} />
          } onClick={onToggleExpand}>
            {allExpanded ? 'Collapse' : 'Expand All'}
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<IconRefresh size={13} className={loading ? 'animate-spin' : ''} />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button size="xs" variant="default" leftSection={<IconDownload size={13} />} onClick={onExport}>
            Export
          </Button>
        </Group>
      </div>
    </Paper>
  );
}

/* ───────────────── View modal ───────────────── */

function ViewAccountModal({ account, onClose }: { account: COAAccount | null; onClose: () => void }) {
  return (
    <Modal opened={account !== null} onClose={onClose} title="Account Details" size="sm">
      {account && (
        <div className="flex flex-col gap-2">
          <Group justify="space-between">
            <Text fz="xs" c="gray.6">Account Name</Text>
            <Text fz="xs" fw={600}>{account.account_name}</Text>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="gray.6">Account Type</Text>
            <Text fz="xs">{account.account_type || '—'}</Text>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="gray.6">Root Type</Text>
            <Badge size="sm" variant="light" color={ROOT_TYPE_COLOR[account.root_type]}>
              {account.root_type}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="gray.6">Currency</Text>
            <Text fz="xs">{account.account_currency}</Text>
          </Group>
          <Group justify="space-between">
            <Text fz="xs" c="gray.6">Balance</Text>
            <Text fz="xs" fw={600}>
              {formatAmount(account.account_currency, account.balance_in_account_currency)}
            </Text>
          </Group>
        </div>
      )}
    </Modal>
  );
}

/* ───────────────── Columns ───────────────── */

function useColumns(onView: (a: COAAccount) => void, onDelete: (a: COAAccount) => void): ColumnDef<COAAccount>[] {
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
            <div className="flex items-center gap-1.5" style={{ paddingLeft: row.depth * 18 }}>
              {canExpand ? (
                <ActionIcon size="xs" variant="subtle" color="gray" tabIndex={-1} style={{ pointerEvents: 'none' }}>
                  {row.getIsExpanded() ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
                </ActionIcon>
              ) : (
                <IconBook size={13} className="text-gray-400 shrink-0 ml-1" />
              )}
              <Text fz="xs" fw={node.is_group ? 600 : 500} c={node.is_group ? 'gray.9' : 'gray.7'} truncate>
                {node.account_name}
              </Text>
              {node.disabled && (
                <Badge size="xs" variant="light" color="gray" className="shrink-0">
                  Disabled
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: 'account_type',
        header: 'Account Type',
        size: 150,
        cell: ({ row }) => (
          <Text fz="xs" c="gray.6">{row.original.account_type || '—'}</Text>
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
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">Balance</Text>,
        size: 150,
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group) return <Text fz="xs" c="gray.4" ta="right">—</Text>;
          return (
            <Text fz="xs" ta="right" fw={500} c="green.7" className="font-mono tabular-nums">
              {formatAmount(node.account_currency, node.balance_in_account_currency)}
            </Text>
          );
        },
      },
      {
        id: 'balance_base',
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">Balance ({BASE_CURRENCY})</Text>,
        size: 160,
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group) return <Text fz="xs" c="gray.4" ta="right">—</Text>;
          return (
            <Text fz="xs" ta="right" fw={500} c="gray.8" className="font-mono tabular-nums">
              {formatAmount(BASE_CURRENCY, node.balance)}
            </Text>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => {
          const node = row.original;
          return (
            <Group justify="flex-end">
              <Menu shadow="md" width={170} position="bottom-end">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="gray">
                    <IconDots size={15} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconPencil size={13} />}>Edit</Menu.Item>
                  <Menu.Item leftSection={<IconEye size={13} />} onClick={() => onView(node)}>
                    View
                  </Menu.Item>
                  {node.is_group ? (
                    <Menu.Item leftSection={<IconGitBranch size={13} />}>Add Child</Menu.Item>
                  ) : (
                    <Menu.Item leftSection={<IconBookmark size={13} />}>View Ledger</Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
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
    [onView, onDelete],
  );
}

/* ───────────────── Page ───────────────── */

export function ChartOfAccounts() {
  const {
    searchTerm, setSearchTerm,
    hideZero, setHideZero,
    loading, allExpanded,
    handleToggleExpand, handleRefresh, handleExport,
    tableData, expanded, handleExpandedChange,
    viewAccount, setViewAccount,
    handleDelete,
  } = useChartOfAccounts();

  const columns = useColumns(setViewAccount, handleDelete);

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
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <ViewAccountModal account={viewAccount} onClose={() => setViewAccount(null)} />

      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Chart of Accounts
        </Title>
        <Button size="xs" color="indigoAlt.4">
          Add Account
        </Button>
      </div>

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
      />

      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[520px] relative">
          <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full" style={{ tableLayout: 'fixed' }}>
            <Table.Thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <Table.Th
                      key={header.id}
                      className="text-gray-600 font-semibold select-none bg-gray-50"
                      style={{ fontSize: 11, padding: '6px 10px', width: header.getSize() }}
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
                  <Table.Td colSpan={columns.length}>
                    <div className="flex justify-center items-center py-16">
                      <Loader size="sm" color="indigoAlt.4" />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <div className="flex flex-col items-center py-8 text-gray-400">
                      <IconAlertCircle size={28} className="mb-2 opacity-50" />
                      <Text ta="center" c="dimmed" fz="xs">No accounts found.</Text>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr
                    key={row.id}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${
                      row.getCanExpand() ? 'cursor-pointer select-none' : ''
                    }`}
                    onClick={row.getCanExpand() ? row.getToggleExpandedHandler() : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td
                        key={cell.id}
                        style={{ padding: '5px 10px' }}
                        onClick={cell.column.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
    </Box>
  );
}