import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
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
  Loader,
  Table,
  Stack,
  useMantineTheme,
} from "@mantine/core";
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
} from "@tabler/icons-react";

import {
  type COAAccount,
  formatAmount,
} from "../../api/Accounting/Chartofaccounts.api";
import { useChartOfAccounts } from "../../hooks/Accounting/chart of account/Usechartofaccounts";

import { useCurrencyReady } from "../../store/currencyStore";
import { AccountFormModal } from "../../components/Modal/Accounting/chart of account/AccountFormModal";

const ROOT_TYPE_COLOR: Record<COAAccount["root_type"], string> = {
  Asset: "indigoAlt",
  Liability: "danger",
  Equity: "accent",
  Income: "success",
  Expense: "slate",
};

function FilterBar({
  searchTerm,
  setSearchTerm,
  hideZero,
  setHideZero,
  onRefresh,
  loading,
  allExpanded,
  onToggleExpand,
  onExport,
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
        background: "var(--mantine-color-slate-0)",
        border: "1px solid var(--mantine-color-slate-2)",
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
            input: { border: "1px solid var(--mantine-color-slate-2)" },
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
          <Button
            size="xs"
            radius="xl"
            variant="default"
            leftSection={
              allExpanded ? (
                <IconChevronRight size={13} />
              ) : (
                <IconLayoutList size={13} />
              )
            }
            onClick={onToggleExpand}
          >
            {allExpanded ? "Collapse" : "Expand All"}
          </Button>
            <Button
              size="xs"
              radius="xl"
              color="brand"
              leftSection={
                <IconRefresh
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
              }
              onClick={onRefresh}
              style={{
                background: theme.other?.brandGradient,
                boxShadow: theme.other?.brandGlowShadowSm,
              }}
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

function useColumns(
  onView: (a: COAAccount) => void,
  onEdit: (a: COAAccount) => void,
  onDelete: (a: COAAccount) => void,
  onAddChild: (a: COAAccount) => void,
  onViewLedger: (a: COAAccount) => void,
  baseCurrency: string,
): ColumnDef<COAAccount>[] {
  return useMemo<ColumnDef<COAAccount>[]>(
    () => [
      {
        id: "name",
        header: "Account Name",
        size: 300,
        cell: ({ row }) => {
          const node = row.original;
          const canExpand = row.getCanExpand();
          const isGroup = node.is_group === 1;
          const depth = row.depth;
          return (
            <Group
              gap={6}
              wrap="nowrap"
              style={{ position: "relative", paddingLeft: depth * 22 }}
            >
              {Array.from({ length: depth }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: i * 22 + 9,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "var(--mantine-color-slate-3)",
                  }}
                />
              ))}
              {depth > 0 && (
                <span
                  style={{
                    position: "absolute",
                    left: (depth - 1) * 22 + 9,
                    top: "50%",
                    width: 10,
                    height: 1,
                    background: "var(--mantine-color-slate-3)",
                  }}
                />
              )}

              {canExpand ? (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="slate"
                  tabIndex={-1}
                  style={{ pointerEvents: "none", flexShrink: 0 }}
                >
                  {row.getIsExpanded() ? (
                    <IconFolderOpen size={14} />
                  ) : (
                    <IconFolder size={14} />
                  )}
                </ActionIcon>
              ) : isGroup ? (
                <IconFolder
                  size={14}
                  color="var(--mantine-color-slate-4)"
                  style={{ flexShrink: 0, marginLeft: 4 }}
                />
              ) : (
                <IconBook
                  size={13}
                  color="var(--mantine-color-slate-4)"
                  style={{ flexShrink: 0, marginLeft: 4 }}
                />
              )}
              <Text
                fz="xs"
                fw={node.is_group ? 700 : 500}
                c={node.is_group ? "slate.8" : "slate.7"}
                truncate
              >
                {node.account_name}
              </Text>
              {node.disabled === 1 && (
                <Badge
                  size="xs"
                  variant="light"
                  color="slate"
                  style={{ flexShrink: 0 }}
                >
                  Disabled
                </Badge>
              )}
            </Group>
          );
        },
      },
      {
        id: "account_type",
        header: "Account Type",
        size: 150,
        cell: ({ row }) => (
          <Text fz="xs" c="slate.5">
            {row.original.account_type || "—"}
          </Text>
        ),
      },
      {
        id: "root_type",
        header: "Root Type",
        size: 110,
        cell: ({ row }) => (
          <Badge
            size="sm"
            variant="light"
            color={ROOT_TYPE_COLOR[row.original.root_type]}
            styles={{ root: { fontSize: 10, padding: "0 8px" } }}
          >
            {row.original.root_type}
          </Badge>
        ),
      },
      {
        id: "balance",
        header: () => (
          <Text fz="xs" fw={700} ta="right" w="100%">
            Balance
          </Text>
        ),
        size: 150,
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group === 1)
            return (
              <Text fz="xs" c="slate.4" ta="right">
                —
              </Text>
            );
          return (
            <Text
              fz="xs"
              ta="right"
              fw={600}
              c="success.6"
              style={{
                fontFamily: "var(--mantine-font-family-monospace)",
                fontVariantNumeric: "tabular-nums",
                background: "var(--mantine-color-slate-0)",
                borderRadius: "var(--mantine-radius-sm)",
                padding: "4px 8px",
                display: "inline-block",
              }}
            >
              {formatAmount(
                node.account_currency,
                node.balance_in_account_currency ?? node.balance,
                { withSymbol: true },
              )}
            </Text>
          );
        },
      },
      {
        id: "balance_base",
        header: () => (
          <Text fz="xs" fw={700} ta="right" w="100%">
            Balance ({baseCurrency})
          </Text>
        ),
        size: 160,
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group === 1)
            return (
              <Text fz="xs" c="slate.4" ta="right">
                —
              </Text>
            );
          return (
            <Text
              fz="xs"
              ta="right"
              fw={600}
              c="slate.7"
              style={{
                fontFamily: "var(--mantine-font-family-monospace)",
                fontVariantNumeric: "tabular-nums",
                background: "var(--mantine-color-slate-0)",
                borderRadius: "var(--mantine-radius-sm)",
                padding: "4px 8px",
                display: "inline-block",
              }}
            >
              {formatAmount(baseCurrency, node.balance, { withSymbol: true })}
            </Text>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <Text fz="xs" fw={700} ta="right" w="100%">
            Actions
          </Text>
        ),
        size: 50,
        cell: ({ row }) => {
          const node = row.original;
          return (
            <Group justify="flex-end" onClick={(e) => e.stopPropagation()}>
              <Menu shadow="md" width={170} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                  >
                    <IconDots size={15} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconPencil size={13} />}
                    onClick={() => onEdit(node)}
                    disabled={!node.parent_account}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEye size={13} />}
                    onClick={() => onView(node)}
                  >
                    View
                  </Menu.Item>
                  {node.is_group === 1 ? (
                    <Menu.Item
                      leftSection={<IconGitBranch size={13} />}
                      onClick={() => onAddChild(node)}
                    >
                      Add Child
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      leftSection={<IconBookmark size={13} />}
                      onClick={() => onViewLedger(node)}
                    >
                      View Ledger
                    </Menu.Item>
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
    [onView, onEdit, onDelete, onAddChild, onViewLedger, baseCurrency],
  );
}

export function ChartOfAccounts() {
  useCurrencyReady();
  const theme = useMantineTheme();
  const navigate = useNavigate();

  const {
    searchTerm,
    setSearchTerm,
    hideZero,
    setHideZero,
    loading,
    allExpanded,
    handleToggleExpand,
    handleRefresh,
    handleExport,
    tableData,
    expanded,
    handleExpandedChange,
    handleDelete,
    baseCurrency,
    handleView,
  } = useChartOfAccounts();

  const [formModal, setFormModal] = useState<{
    parent?: COAAccount | null;
    edit?: COAAccount | null;
    viewOnly?: boolean;
  } | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const onView = async (node: COAAccount) => {
    const data = await handleView(node);
    if (data) {
      setFormModal({ edit: data, viewOnly: true });
      setModalOpened(true);
    }
  };

  const onEdit = async (node: COAAccount) => {
    const data = await handleView(node);
    if (data) {
      setFormModal({ edit: data, viewOnly: false });
      setModalOpened(true);
    }
  };

  const columns = useColumns(
    onView,
    onEdit,
    handleDelete,
    (node) => {
      setFormModal({ parent: node });
      setModalOpened(true);
    },
    (node) => {
      navigate({
        to: "/accounting/general-ledger/report",
        search: { account: node.name },
      });
    },
    baseCurrency,
  );
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
    <Stack gap="lg" p="lg">
      <style>{`
        .coa-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .coa-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .coa-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .coa-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .coa-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .coa-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      <AccountFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onExited={() => setFormModal(null)}
        onSuccess={handleRefresh}
        company={import.meta.env.VITE_COMPANY_NAME}
        baseCurrency={baseCurrency}
        parentAccount={formModal?.parent}
        editAccount={formModal?.edit}
        readOnly={formModal?.viewOnly ?? false}
      />

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
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Box
          style={{
            maxHeight: "calc(100vh - 250px)",
            minHeight: 280,
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <Table
            verticalSpacing="sm"
            horizontalSpacing="sm"
            fz="xs"
            w="100%"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
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
                        fontSize: "var(--mantine-font-size-xs)",
                        padding: "0 10px 6px",
                        userSelect: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        border: "none",
                        minWidth: header.getSize(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} style={{ border: "none" }}>
                    <Group justify="center" py={64}>
                      <Loader size="sm" color="indigoAlt.4" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} style={{ border: "none" }}>
                    <Stack align="center" gap="xs" py="xl">
                      <Box
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          background: "var(--mantine-color-white)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <IconAlertCircle
                          size={26}
                          color="var(--mantine-color-slate-4)"
                        />
                      </Box>
                      <Text ta="center" c="slate.5" fz="xs">
                        No accounts found.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr
                    key={row.id}
                    className="coa-row"
                    style={
                      row.getCanExpand() ? { cursor: "pointer" } : undefined
                    }
                    onClick={
                      row.getCanExpand()
                        ? row.getToggleExpandedHandler()
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: "10px 10px",
                          border: "none",
                          boxShadow: "var(--mantine-shadow-xs)",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
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
