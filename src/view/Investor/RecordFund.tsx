import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ActionIcon,
  Box,
  Button,
  TextInput,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Table,
  Badge,
  Menu,
  Text,
  Title,
  Tooltip,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconCash,
  IconEye,
  IconPencil,
  IconTrash,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterMultiSelect } from "../../components/shared/FilterMultiSelect";
import {
  approveFundRecord,
  cancelFundRecord,
  deleteFundRecord,
  getFundRecords,
} from "../../api/Investor/investorFlowApi";
import type { FundRecordListItem, FundRecordStatus } from "../../types/Investor/investorFlow";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { formatAmount } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { recordFundModal } from "../../components/Modal/Investor/recordFundModalStore";

const columnHelper = createColumnHelper<FundRecordListItem>();

const RECORD_STATUS_COLOR: Record<FundRecordStatus, string> = {
  Draft: "slate",
  Approved: "success",
  Cancelled: "danger",
};

const RECORD_STATUS_OPTIONS = (["Draft", "Approved", "Cancelled"] as FundRecordStatus[]).map((v) => ({
  value: v,
  label: v,
}));

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const RIGHT_ALIGNED = ["amount_paid", "remaining_fund", "actions"];

export function RecordFund() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  /* ------------------------------- Data ------------------------------- */
  const { data: fundsResponse, isLoading, isFetching } = useQuery({
    queryKey: ["fundRecords", debouncedSearch, statusFilter, page, pageSize],
    queryFn: () =>
      getFundRecords({
        search: debouncedSearch.trim() || undefined,
        record_status: statusFilter as FundRecordStatus[],
        page,
        page_size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const records = fundsResponse?.data ?? [];
  const totalRows = fundsResponse?.pagination?.total ?? 0;
  const totalPages = fundsResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  /* ----------------------------- Modal ----------------------------- */
  const openModal = (mode: "view" | "edit", row: FundRecordListItem) =>
    recordFundModal.open({ mode, investorFlowId: row.investment_id, recordName: row.name });

  /* --------------------------- Row actions --------------------------- */
  const queryClient = useQueryClient();
  const refresh = (investmentId: string) => {
    queryClient.invalidateQueries({ queryKey: ["fundRecords"] });
    queryClient.invalidateQueries({ queryKey: ["investorFunds"] });
    queryClient.invalidateQueries({ queryKey: ["investorFund", investmentId] });
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
  };
  const showSuccess = (heading: string, body: string) =>
    openCommonModal({ heading, subtitle: "", body, color: "green", buttons: [{ label: "Close", color: "green" }] });
  const showError = (heading: string, error: any) =>
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });

  const rowAction = (
    fn: (args: { id: string; record: string }) => Promise<unknown>,
    success: (row: FundRecordListItem) => [string, string],
    failure: string,
  ) => ({
    mutationFn: (row: FundRecordListItem) => fn({ id: row.investment_id, record: row.name }),
    onSuccess: (_data: unknown, row: FundRecordListItem) => {
      refresh(row.investment_id);
      showSuccess(...success(row));
    },
    onError: (error: any) => showError(failure, error),
  });

  const approveMutation = useMutation(rowAction(
    approveFundRecord,
    (row) => ["Fund Approved", `${fmtAmount(row.amount_paid)} from ${row.investor} is approved and its Journal Entry is posted.`],
    "Approve Failed",
  ));
  const cancelMutation = useMutation(rowAction(
    cancelFundRecord,
    (row) => [
      "Fund Cancelled",
      row.record_status === "Approved"
        ? `The record and its Journal Entry ${row.journal_entry ?? ""} are cancelled.`
        : "The fund record is cancelled.",
    ],
    "Cancel Failed",
  ));
  const deleteMutation = useMutation(rowAction(
    deleteFundRecord,
    () => ["Fund Deleted", "The draft fund record has been deleted."],
    "Delete Failed",
  ));

  const confirm = (
    heading: string,
    body: string,
    label: string,
    color: string,
    onConfirm: () => void,
  ) =>
    openCommonModal({
      heading,
      subtitle: "Please confirm this action before continuing.",
      body,
      color,
      buttons: [
        { label: "Back", variant: "default" },
        { label, color, onClick: onConfirm },
      ],
    });

   const columns = useMemo(
    () => [
      // columnHelper.accessor("investment_id", {
      //   header: "Investment ID",
      //   cell: (info) => (
      //     <Text fz="sm" fw={700} c="slate.8" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
      //       {info.getValue()}
      //     </Text>
      //   ),
      // }),
      columnHelper.accessor("investor", {
        header: "Investor",
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("amount_paid", {
        header: "Fund Received",
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.8" ta="right" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtAmount(Number(info.getValue()) || 0)}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("remaining_fund", {
        header: "Remaining Fund",
        cell: (info) => (
          <Text fz="xs" c="slate.7" ta="right" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtAmount(Number(info.getValue()) || 0)}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("paid_date", {
        header: "Paid Date",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("mode_of_payment", {
        header: "Mode of Payment",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("reference_number", {
        header: "Reference No.",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("record_status", {
        header: "Record Status",
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="xl"
            color={RECORD_STATUS_COLOR[info.getValue()] ?? "slate"}
            styles={{ root: { textTransform: "none", fontWeight: 700 } }}
          >
            {info.getValue()}
          </Badge>
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
          const isDraft = row.record_status === "Draft";
          const isApproved = row.record_status === "Approved";
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="slate" radius="md" onClick={() => openModal("view", row)}>
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? "Edit" : "Only Draft records can be edited"} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? "brand" : "slate"}
                  radius="md"
                  disabled={!isDraft}
                  style={isDraft ? undefined : { opacity: 0.35 }}
                  onClick={() => openModal("edit", row)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? "Delete" : "Only Draft records can be deleted"} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? "danger" : "slate"}
                  radius="md"
                  disabled={!isDraft}
                  style={isDraft ? undefined : { opacity: 0.35 }}
                  onClick={() =>
                    confirm(
                      "Delete Fund Record",
                      `Delete the draft record of ${fmtAmount(row.amount_paid)} from ${row.investor}?`,
                      "Delete",
                      "red",
                      () => deleteMutation.mutate(row),
                    )
                  }
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={170} position="bottom-end" radius="md" disabled={!isDraft && !isApproved}>
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    aria-label="Actions"
                    disabled={!isDraft && !isApproved}
                    style={isDraft || isApproved ? undefined : { opacity: 0.35 }}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft && (
                    <Menu.Item
                      onClick={() =>
                        confirm(
                          "Approve Fund",
                          `Approve ${fmtAmount(row.amount_paid)} from ${row.investor}? This posts its Journal Entry (Paid from ${row.credit_gl} → Paid to ${row.debit_gl}).`,
                          "Approve",
                          "green",
                          () => approveMutation.mutate(row),
                        )
                      }
                    >
                      Approve
                    </Menu.Item>
                  )}
                  <Menu.Item
                    color="danger"
                    onClick={() =>
                      confirm(
                        "Cancel Fund",
                        isApproved
                          ? `Cancel the approved record of ${fmtAmount(row.amount_paid)}? Its Journal Entry ${row.journal_entry ?? ""} will be cancelled too.`
                          : `Cancel the draft record of ${fmtAmount(row.amount_paid)}?`,
                        "Cancel Record",
                        "red",
                        () => cancelMutation.mutate(row),
                      )
                    }
                  >
                    Cancel
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyCurrency],
  );

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter([]);
  };

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCash size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Record Fund
            </Title>
            <Text fz="sm" c="slate.5">
              Record the funds received from investors; approving a record posts its Journal Entry
            </Text>
          </Stack>
        </Group>
        <Button
          radius="xl"
          color="brand"
          leftSection={<IconPlus size={16} />}
          style={{ background: theme.other.brandGradient }}
          onClick={() => recordFundModal.open({ mode: "add" })}
        >
          Add Fund
        </Button>
      </Group>

      {/* Filter bar */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="xs" wrap="nowrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Investment ID / Investor"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />

          <FilterMultiSelect
            placeholder="All Record Status"
            data={RECORD_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            width={160}
          />

          <Button
            size="sm"
            radius="xl"
            variant="default"
            px="sm"
            style={{ flexShrink: 0 }}
            onClick={resetFilters}
          >
            Reset
          </Button>
        </Group>
      </Paper>

      {/* Table */}
      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : (
          <>
            <Box
              style={{
                height: "clamp(320px, calc(100vh - 330px), 720px)",
                overflowY: "auto",
                opacity: isFetching ? 0.6 : 1,
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
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const rightAligned = RIGHT_ALIGNED.includes(header.id);
                        return (
                          <Table.Th
                            key={header.id}
                            className="lms-thead-cell"
                            c="slate.5"
                            fw={700}
                            style={{
                              fontSize: "var(--mantine-font-size-xs)",
                              padding: "0 10px 6px",
                              userSelect: "none",
                              cursor: canSort ? "pointer" : "default",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              border: "none",
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <Group
                              gap="xs"
                              wrap="nowrap"
                              justify={rightAligned ? "flex-end" : "flex-start"}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {canSort && (
                                <SortIcon sorted={header.column.getIsSorted()} />
                              )}
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
                            <IconCash size={24} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No fund records match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => (
                      <Table.Tr key={row.id} className="lms-row">
                        {row.getVisibleCells().map((cell, idx) => (
                          <Table.Td
                            key={cell.id}
                            style={{
                              padding: "10px 10px",
                              border: "none",
                              boxShadow: "var(--mantine-shadow-xs)",
                              borderLeft:
                                idx === 0
                                  ? `3px solid var(--mantine-color-${
                                      RECORD_STATUS_COLOR[row.original.record_status] ?? "slate"
                                    }-4)`
                                  : undefined,
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

            {/* Pagination Footer */}
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
                    onChange={(v) => {
                      setPageSize(Number(v) || 10);
                      setPage(1);
                    }}
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


    </Stack>
  );
}
