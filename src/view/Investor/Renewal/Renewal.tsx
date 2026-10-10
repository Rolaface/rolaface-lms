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
  IconRefresh,
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
import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import {
  approveRenewal,
  cancelRenewal,
  deleteRenewal,
  getRenewals,
} from "../../../api/Investor/investorFlowApi";
import {
  RENEWAL_STRUCTURES,
  type PaymentStatus,
  type RenewalListItem,
  type RenewalStatus,
  type RenewalStructure,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { renewalModal } from "../../../components/Modal/Investor/Renewal/renewalModalStore";
import { formatInvestorDate } from "../../../components/Modal/Investor/investorDate";

const columnHelper = createColumnHelper<RenewalListItem>();

const RENEWAL_STATUS_COLOR: Record<RenewalStatus, string> = {
  Draft: "slate",
  Approved: "success",
  Cancelled: "danger",
};

const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  Pending: "slate",
  Paid: "success",
  Renewed: "brand",
  Expired: "danger",
};

const CONTRACT_STATUS_COLOR: Record<string, string> = {
  Pending: "warning",
  Sent: "brand",
  Paid: "success",
};

const RENEWAL_STATUS_OPTIONS = (
  ["Draft", "Approved", "Cancelled"] as RenewalStatus[]
).map((v) => ({
  value: v,
  label: v,
}));
const STRUCTURE_OPTIONS = RENEWAL_STRUCTURES.map((v) => ({
  value: v,
  label: v,
}));

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <Badge
      variant="light"
      size="sm"
      radius="xl"
      color={color}
      styles={{ root: { textTransform: "none", fontWeight: 700 } }}
    >
      {label}
    </Badge>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const fmtDate = (iso: string | null) => formatInvestorDate(iso);

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const RIGHT_ALIGNED = ["renewed_principal", "renewal_interest_rate", "actions"];

export function Renewal() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [structureFilter, setStructureFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, structureFilter]);

  /* ------------------------------- Data ------------------------------- */
  const {
    data: renewalsResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "renewals",
      debouncedSearch,
      statusFilter,
      structureFilter,
      page,
      pageSize,
    ],
    queryFn: () =>
      getRenewals({
        search: debouncedSearch.trim() || undefined,
        renewal_status: statusFilter as RenewalStatus[],
        renewal_structure: structureFilter as RenewalStructure[],
        page,
        page_size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const records = renewalsResponse?.data ?? [];
  const totalRows = renewalsResponse?.pagination?.total ?? 0;
  const totalPages = renewalsResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  /* ----------------------------- Modal ----------------------------- */
  const openModal = (mode: "view" | "edit", row: RenewalListItem) =>
    renewalModal.open({ mode, investorFlowId: row.name });

  /* --------------------------- Row actions --------------------------- */
  const queryClient = useQueryClient();
  const refresh = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["renewals"] });
    queryClient.invalidateQueries({ queryKey: ["renewal", id] });
    queryClient.invalidateQueries({ queryKey: ["renewalCandidates"] });
    queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
    queryClient.invalidateQueries({ queryKey: ["investorEarning", id] });
  };
  const showSuccess = (heading: string, body: string) =>
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  const showError = (heading: string, error: any) =>
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });

  const rowAction = (
    fn: (id: string) => Promise<unknown>,
    success: (row: RenewalListItem) => [string, string],
    failure: string,
  ) => ({
    mutationFn: (row: RenewalListItem) => fn(row.name),
    onSuccess: (_data: unknown, row: RenewalListItem) => {
      refresh(row.name);
      showSuccess(...success(row));
    },
    onError: (error: any) => showError(failure, error),
  });

  const approveMutation = useMutation(
    rowAction(
      approveRenewal,
      (row) => [
        "Renewal Approved",
        `The renewal of ${row.name} is approved: its entry is posted and the new schedule is now the current one.`,
      ],
      "Approve Failed",
    ),
  );
  const cancelMutation = useMutation(
    rowAction(
      cancelRenewal,
      (row) => [
        "Renewal Cancelled",
        `The renewal of ${row.name} is cancelled and the schedule before it is restored.`,
      ],
      "Cancel Failed",
    ),
  );
  const deleteMutation = useMutation(
    rowAction(
      deleteRenewal,
      (row) => [
        "Renewal Deleted",
        `The renewal of ${row.name} has been deleted.`,
      ],
      "Delete Failed",
    ),
  );

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
      columnHelper.accessor("investor", {
        header: "Investor",
        cell: (info) => (
          <Box>
            <Text fz="sm" fw={600} c="slate.8">
              {info.getValue()}
            </Text>
            <Text fz={11} c="slate.5">
              {info.row.original.name} ·{" "}
              {info.row.original.investment_product_name}
            </Text>
          </Box>
        ),
      }),
      columnHelper.accessor("renewal_structure", {
        header: "Structure",
        cell: (info) => (
          <Text fz="xs" c="slate.7">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("renewal_effective_date", {
        header: "Effective Date",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("renewed_principal", {
        header: "Renewed Principal",
        cell: (info) => (
          <Text
            fz="xs"
            fw={600}
            c="slate.8"
            ta="right"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {fmtAmount(Number(info.getValue()) || 0)}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("renewal_interest_rate", {
        header: "Rate",
        cell: (info) => (
          <Text fz="xs" c="slate.7" ta="right">
            {info.getValue()}% p.a.
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("new_maturity_date", {
        header: "New Maturity",
        cell: (info) => (
          <Box>
            <Text fz="xs" c="slate.7">
              {fmtDate(info.getValue())}
            </Text>
            <Text fz={11} c="slate.5">
              {info.row.original.renewal_tenure} mo ·{" "}
              {info.row.original.payment_frequency}
            </Text>
          </Box>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("renewal_contract_status", {
        header: "Contract",
        cell: (info) => (
          <StatusBadge
            label={info.getValue() || "Pending"}
            color={
              CONTRACT_STATUS_COLOR[info.getValue() || "Pending"] ?? "slate"
            }
          />
        ),
      }),
      columnHelper.accessor("payment_status", {
        header: "Payment Status",
        cell: (info) =>
          info.getValue() ? (
            <StatusBadge
              label={info.getValue() as string}
              color={
                PAYMENT_STATUS_COLOR[info.getValue() as PaymentStatus] ??
                "slate"
              }
            />
          ) : (
            "-"
          ),
      }),
      columnHelper.accessor("renewal_status", {
        header: "Renewal Status",
        cell: (info) => (
          <StatusBadge
            label={info.getValue()}
            color={RENEWAL_STATUS_COLOR[info.getValue()] ?? "slate"}
          />
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
          const isDraft = row.renewal_status === "Draft";
          const isApproved = row.renewal_status === "Approved";
          // Draft: Approve / Edit / Delete. Approved: Cancel. Cancelled: Delete.
          const canDelete = isDraft || row.renewal_status === "Cancelled";
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => openModal("view", row)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label={isDraft ? "Edit" : "Only Draft renewals can be edited"}
                withArrow
              >
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
              <Tooltip
                label={
                  canDelete
                    ? "Delete"
                    : "Only Draft or Cancelled renewals can be deleted"
                }
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canDelete ? "danger" : "slate"}
                  radius="md"
                  disabled={!canDelete}
                  style={canDelete ? undefined : { opacity: 0.35 }}
                  onClick={() =>
                    confirm(
                      "Delete Renewal",
                      `Delete the ${row.renewal_status.toLowerCase()} renewal of ${row.name} (${row.investor})?`,
                      "Delete",
                      "red",
                      () => deleteMutation.mutate(row),
                    )
                  }
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu
                shadow="md"
                width={170}
                position="bottom-end"
                radius="md"
                disabled={!isDraft && !isApproved}
              >
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    aria-label="Actions"
                    disabled={!isDraft && !isApproved}
                    style={
                      isDraft || isApproved ? undefined : { opacity: 0.35 }
                    }
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft && (
                    <Menu.Item
                      onClick={() =>
                        confirm(
                          "Approve Renewal",
                          `Approve the ${row.renewal_structure} renewal of ${row.name}? Its Journal Entry is posted on ${fmtDate(row.renewal_effective_date)} and the new schedule (${fmtAmount(row.renewed_principal)} at ${row.renewal_interest_rate}% till ${fmtDate(row.new_maturity_date)}) becomes the current one.`,
                          "Approve",
                          "green",
                          () => approveMutation.mutate(row),
                        )
                      }
                    >
                      Approve
                    </Menu.Item>
                  )}
                  {isApproved && (
                    <Menu.Item
                      color="danger"
                      onClick={() =>
                        confirm(
                          "Cancel Renewal",
                          `Cancel the approved renewal of ${row.name}? Its Journal Entry is cancelled and the schedule in force before it is restored.`,
                          "Cancel Renewal",
                          "red",
                          () => cancelMutation.mutate(row),
                        )
                      }
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
    setStructureFilter([]);
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
            <IconRefresh
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Renewal
            </Title>
            <Text fz="sm" c="slate.5">
              Renew investments at expiry or during the contract; approving a
              renewal posts its entry and starts the new schedule
            </Text>
          </Stack>
        </Group>
        <Button
          radius="xl"
          color="brand"
          leftSection={<IconPlus size={16} />}
          style={{ background: theme.other.brandGradient }}
          onClick={() => renewalModal.open({ mode: "add" })}
        >
          Add Renewal
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
            placeholder="All Structures"
            data={STRUCTURE_OPTIONS}
            value={structureFilter}
            onChange={setStructureFilter}
            width={170}
          />

          <FilterMultiSelect
            placeholder="All Renewal Status"
            data={RENEWAL_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            width={170}
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
                                <SortIcon
                                  sorted={header.column.getIsSorted()}
                                />
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
                      <Table.Td
                        colSpan={columns.length}
                        style={{ border: "none" }}
                      >
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
                            <IconRefresh
                              size={24}
                              color="var(--mantine-color-slate-4)"
                            />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No renewals match your filters.
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
                                      RENEWAL_STATUS_COLOR[
                                        row.original.renewal_status
                                      ] ?? "slate"
                                    }-4)`
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
