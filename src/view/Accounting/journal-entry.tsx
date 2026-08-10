import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Box,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Menu,
  LoadingOverlay,
  Button,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconSearch,
  IconFileText,
  IconDots,
  IconCircleCheck,
  IconBan,
  IconTrash,
  IconFileInvoice,
  IconPlus,
} from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";

import { type JournalEntry } from "../../api/Accounting/Journalentries.api";
import { useJournalEntries } from "../../hooks/Accounting/journal-entry/useJournalEntries";
import JournalEntryModal from "../../components/Modal/Accounting/JournalEntryModal";
import { useCompanyStore } from "../../store/companyStore";
import {
  formatAmount,
  useCurrencyReady,
  ensureCurrencies,
} from "../../store/currencyStore";

function formatDate(date: string) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const [y, m, d] = date.split("T")[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${y}`;
}

function statusInfo(docstatus: JournalEntry["docstatus"]) {
  if (docstatus === 1) return { label: "Submitted", scale: "success" as const };
  if (docstatus === 2) return { label: "Cancelled", scale: "danger" as const };
  return { label: "Draft", scale: "slate" as const };
}

function StatusBadge({ docstatus }: { docstatus: JournalEntry["docstatus"] }) {
  const { label, scale } = statusInfo(docstatus);
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{
            borderRadius: "50%",
            background: `var(--mantine-color-${scale}-6)`,
          }}
        />
      }
    >
      {label}
    </Badge>
  );
}

const columnHelper = createColumnHelper<JournalEntry>();

function useColumns(
  onSubmit: (name: string) => void,
  onCancel: (name: string) => void,
  onDelete: (name: string) => void,
  onView: (name: string) => void,
  onEdit: (name: string) => void,
  baseCurrency: string,
) {
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Entry Number",
        cell: (info) => (
          <Group gap={6} wrap="nowrap">
            <IconFileText
              size={14}
              color="var(--mantine-color-slate-4)"
              style={{ flexShrink: 0 }}
            />
            <Text fz="sm" fw={700} c="slate.8">
              {info.getValue()}
            </Text>
          </Group>
        ),
      }),
      columnHelper.accessor("posting_date", {
        header: "Posting Date",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {formatDate(info.getValue())}
          </Text>
        ),
      }),
      columnHelper.accessor("docstatus", {
        header: "Status",
        cell: (info) => <StatusBadge docstatus={info.getValue()} />,
      }),
      columnHelper.accessor("total_debit", {
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Total Debit
          </Text>
        ),
        cell: (info) => (
          <Text
            fz="xs"
            ta="right"
            fw={600}
            c="slate.7"
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              background: "var(--mantine-color-slate-0)",
              borderRadius: "var(--mantine-radius-sm)",
              padding: "4px 8px",
            }}
          >
            {formatAmount(baseCurrency, info.getValue(), { withSymbol: true })}
          </Text>
        ),
      }),
      columnHelper.accessor("total_credit", {
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Total Credit
          </Text>
        ),
        cell: (info) => (
          <Text
            fz="xs"
            ta="right"
            fw={600}
            c="slate.7"
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              background: "var(--mantine-color-slate-0)",
              borderRadius: "var(--mantine-radius-sm)",
              padding: "4px 8px",
            }}
          >
            {formatAmount(baseCurrency, info.getValue(), { withSymbol: true })}
          </Text>
        ),
      }),
      columnHelper.accessor("user_remark", {
        header: "Remark",
        cell: (info) => (
          <Text fz="xs" c="slate.6" truncate style={{ maxWidth: 220 }}>
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isDraft = row.docstatus === 0;
          const isSubmitted = row.docstatus === 1;
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => onView(row.name)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label={isDraft ? "Edit" : "Only drafts can be edited"}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="brand"
                  radius="md"
                  disabled={!isDraft}
                  onClick={() => onEdit(row.name)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={170} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                  >
                    <IconDots size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft && (
                    <Menu.Item
                      leftSection={
                        <IconCircleCheck
                          size={13}
                          color="var(--mantine-color-success-6)"
                        />
                      }
                      onClick={() => onSubmit(row.name)}
                    >
                      Submit
                    </Menu.Item>
                  )}
                  {isSubmitted ? (
                    <Menu.Item
                      color="danger"
                      leftSection={<IconBan size={13} />}
                      onClick={() => onCancel(row.name)}
                    >
                      Cancel Entry
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      color="danger"
                      leftSection={<IconTrash size={13} />}
                      onClick={() => onDelete(row.name)}
                    >
                      Delete
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    [onSubmit, onCancel, onDelete, onView, onEdit, baseCurrency],
  );
}

export function JournalEntries() {
  useCurrencyReady();
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);

  const baseCurrency = useCompanyStore((state) => state.baseCurrency);

  useEffect(() => {
    if (baseCurrency) ensureCurrencies([baseCurrency]);
  }, [baseCurrency]);

  const {
    loading,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    orderBy,
    setOrderBy,
    filteredData,
    total,
    pagination,
    setPagination,
    handleSubmit,
    handleCancel,
    handleDelete,
    handleRefresh,
  } = useJournalEntries();

  const openNew = () => {
    setActiveEntryId(null);
    setModalReadOnly(false);
    setOpened(true);
  };
  const openView = (name: string) => {
    setActiveEntryId(name);
    setModalReadOnly(true);
    setOpened(true);
  };
  const openEdit = (name: string) => {
    setActiveEntryId(name);
    setModalReadOnly(false);
    setOpened(true);
  };
  const closeModal = () => {
    setOpened(false);
    setActiveEntryId(null);
  };

  const columns = useColumns(
    handleSubmit,
    handleCancel,
    handleDelete,
    openView,
    openEdit,
    baseCurrency,
  );

  const { pageIndex, pageSize } = pagination;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const totalRows = total;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    // No h="100%" / flex-fill here — that needs a bounded-height parent
    // which this route doesn't reliably have, so the whole page was
    // scrolling instead of just the table. Fixed maxHeight below is
    // self-contained: works regardless of what the parent layout does.
    <Stack gap="lg" p="lg">
      <style>{`
        .je-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .je-row-actions { opacity: 1; }
        .je-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .je-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .je-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .je-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .je-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Toolbar */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="je-search"
            radius="xl"
            placeholder="Search journal entries..."
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <Group gap={4} wrap="nowrap">
            <Text
              fz="xs"
              fw={700}
              c="slate.5"
              tt="uppercase"
              style={{ letterSpacing: 0.4 }}
            >
              From
            </Text>
            <DateInput
              radius="xl"
              placeholder="From Date"
              value={fromDate}
              onChange={(value) => setFromDate(value || "")}
              valueFormat="DD/MM/YYYY"
              w={150}
              clearable
            />
          </Group>
          <Group gap={4} wrap="nowrap">
            <Text
              fz="xs"
              fw={700}
              c="slate.5"
              tt="uppercase"
              style={{ letterSpacing: 0.4 }}
            >
              To
            </Text>
            <DateInput
              radius="xl"
              placeholder="To Date"
              value={toDate}
              onChange={(value) => setToDate(value || "")}
              valueFormat="DD/MM/YYYY"
              w={150}
              clearable
            />
          </Group>

          <Select
            radius="xl"
            data={[
              { value: "posting_date desc", label: "Posting Date" },
              { value: "creation desc", label: "Creation Date" },
            ]}
            value={orderBy}
            onChange={(v) => setOrderBy(v || "creation desc")}
            w={166}
          />

          <Group gap="xs" ml="auto">
            <Button
              radius="xl"
              color="brand"
              onClick={openNew}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              New Entry
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data Table Paper — no longer a flex child claiming remaining
          height; the scroll now lives entirely inside the fixed-height
          Box below, so this Paper (and the page) never grows/scrolls. */}
      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <LoadingOverlay
          visible={loading}
          zIndex={5}
          overlayProps={{ blur: 1 }}
        />

        {/* This Box is the ONLY thing that scrolls — fixed maxHeight
            means the table stays contained and everything else on the
            page (toolbar, pagination, sidebar) stays put. */}
        <Box
  style={{
    maxHeight: 'calc(100vh - 300px)',
    minHeight: 280,
    overflowY: 'auto',
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
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Th
                      key={header.id}
                      className="je-thead-cell"
                      c="slate.5"
                      fw={700}
                      style={{
                        fontSize: "var(--mantine-font-size-xs)",
                        padding: "0 10px 6px",
                        userSelect: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        border: "none",
                      }}
                    >
                      <Group
                        gap="xs"
                        wrap="nowrap"
                        justify={
                          header.id === "actions" ? "flex-end" : "flex-start"
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Group>
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {rows.length === 0 ? (
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
                        <IconFileInvoice
                          size={26}
                          color="var(--mantine-color-slate-4)"
                        />
                      </Box>
                      <Text ta="center" c="slate.5" fz="xs">
                        No journal entries found.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => {
                  const { scale } = statusInfo(row.original.docstatus);
                  const cells = row.getVisibleCells();
                  return (
                    <Table.Tr key={row.id} className="je-row">
                      {cells.map((cell, idx) => (
                        <Table.Td
                          key={cell.id}
                          style={{
                            padding: "10px 10px",
                            border: "none",
                            boxShadow: "var(--mantine-shadow-xs)",
                            borderLeft:
                              idx === 0
                                ? `3px solid var(--mantine-color-${scale}-4)`
                                : undefined,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Pagination Footer — sits below the scrolling Box, outside it,
            so it stays visible without needing flexShrink:0 tricks. */}
        <Group justify="space-between" px="sm" pt="xs">
          <Group
            gap="sm"
            c="slate.6"
            style={{ fontSize: "var(--mantine-font-size-xs)" }}
          >
            <span>
              {totalRows === 0
                ? "Showing 0 of 0"
                : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) =>
                  setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })
                }
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={pageCount}
            value={pageIndex + 1}
            onChange={(p) =>
              setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
            }
            color="brand"
            size="xs"
            radius="xl"
          />
        </Group>
      </Paper>

      <JournalEntryModal
        opened={opened}
        onClose={closeModal}
        onSuccess={handleRefresh}
        entryId={activeEntryId}
        isReadOnly={modalReadOnly}
        baseCurrency={baseCurrency}
      />
    </Stack>
  );
}
