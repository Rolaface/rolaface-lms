/* Amend Payouts: amendments to investments' repayment schedules (Draft -> Approved -> Cancelled),
   with Create Amend. A Draft is not in use until it is approved. */
import { useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Menu,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconChevronDown,
  IconDotsVertical,
  IconEye,
  IconFileText,
  IconMoneybagPlus,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterMultiSelect } from "../../components/shared/FilterMultiSelect";
import {
  approveAmendment,
  cancelAmendment,
  deleteAmendment,
  getAmendments,
} from "../../api/Investor/investorFlowApi";
import {
  AMEND_STATUSES,
  type AmendStatus,
  type AmendmentListItem,
} from "../../types/Investor/investorFlow";
import { formatAmount } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { earningsStatementsModal } from "../../components/Modal/Investor/earningsStatementsModalStore";
import { formatInvestorDate } from "../../components/Modal/Investor/investorDate";

const STATUS_COLOR: Record<AmendStatus, string> = {
  Draft: "slate",
  Approved: "success",
  Cancelled: "danger",
};
const STATUS_OPTIONS = AMEND_STATUSES.map((v) => ({ value: v, label: v }));

const TH = {
  fontSize: "var(--mantine-font-size-xs)",
  fontWeight: 700,
  color: "var(--mantine-color-slate-5)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  border: "none",
  padding: "0 10px 6px",
};

const HEADERS: { label: string; right?: boolean }[] = [
  { label: "Investor" },
  { label: "Version" },
  { label: "Amend Date" },
  { label: "Payouts" },
  { label: "Principal", right: true },
  { label: "Interest", right: true },
  { label: "Penalty", right: true },
  { label: "Total", right: true },
  { label: "Status" },
];

export function EarningsStatements() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["amendments", debouncedSearch, statusFilter, page, pageSize],
    queryFn: () =>
      getAmendments({
        search: debouncedSearch.trim() || undefined,
        amend_status: statusFilter as AmendStatus[],
        page,
        page_size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });
  const rows = useMemo(() => data?.data ?? [], [data]);
  const totalRows = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const refresh = (investmentId: string) => {
    queryClient.invalidateQueries({ queryKey: ["amendments"] });
    queryClient.invalidateQueries({ queryKey: ["amendCandidates"] });
    queryClient.invalidateQueries({ queryKey: ["amendment", investmentId] });
    // The schedule in use changes on Approve / Cancel: everything that shows it is refreshed.
    queryClient.invalidateQueries({
      queryKey: ["investorEarning", investmentId],
    });
    queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
    queryClient.invalidateQueries({
      queryKey: ["payoutContext", investmentId],
    });
    queryClient.invalidateQueries({ queryKey: ["payoutCandidates"] });
    queryClient.invalidateQueries({ queryKey: ["investorPortfolio"] });
    queryClient.invalidateQueries({ queryKey: ["investorInvestmentDetail"] });
    queryClient.invalidateQueries({ queryKey: ["investorStatement"] });
    queryClient.invalidateQueries({ queryKey: ["investorReport"] });
  };
  const showSuccess = (heading: string, body: string) =>
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  const showError = (heading: string, error: unknown) =>
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
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

  const action = (
    fn: (args: { id: string; version: number }) => Promise<unknown>,
    success: (row: AmendmentListItem) => [string, string],
    failure: string,
  ) => ({
    // Never re-sent automatically: the first request may already have gone through.
    retry: false,
    mutationFn: (row: AmendmentListItem) =>
      fn({ id: row.investment_id, version: row.version }),
    onSuccess: (_data: unknown, row: AmendmentListItem) => {
      refresh(row.investment_id);
      showSuccess(...success(row));
    },
    onError: (error: unknown) => showError(failure, error),
  });
  const approveMutation = useMutation(
    action(
      approveAmendment,
      (row) => [
        "Amendment Approved",
        `The amended schedule of ${row.investment_id} is now in use.`,
      ],
      "Approve Failed",
    ),
  );
  const cancelMutation = useMutation(
    action(
      cancelAmendment,
      (row) => [
        "Amendment Cancelled",
        `${row.investment_id} is back on the schedule it had before this amendment.`,
      ],
      "Cancel Failed",
    ),
  );
  const deleteMutation = useMutation(
    action(
      deleteAmendment,
      () => ["Amendment Deleted", "The amendment has been deleted."],
      "Delete Failed",
    ),
  );

  const open = (mode: "view" | "edit", row: AmendmentListItem) =>
    earningsStatementsModal.open({
      mode,
      investorFlowId: row.investment_id,
      version: row.version,
    });

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
            <IconMoneybagPlus
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Amend Payouts
            </Title>
            <Text fz="sm" c="slate.5">
              Amend an investment's repayment schedule; an amendment is used
              once it is approved
            </Text>
          </Stack>
        </Group>
        <Button
          radius="xl"
          color="brand"
          leftSection={<IconPlus size={16} />}
          style={{ background: theme.other.brandGradient }}
          onClick={() => earningsStatementsModal.open({ mode: "create" })}
        >
          Create Amend
        </Button>
      </Group>

      {/* Filters */}
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
            placeholder="Investment ID / investor name, mobile, ID or email"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.currentTarget.value);
              setPage(1);
            }}
          />
          <FilterMultiSelect
            placeholder="All Status"
            data={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            width={150}
          />
          <Button
            size="sm"
            radius="xl"
            variant="default"
            px="sm"
            style={{ flexShrink: 0 }}
            onClick={() => {
              setSearchInput("");
              setStatusFilter([]);
              setPage(1);
            }}
          >
            Reset
          </Button>
        </Group>
      </Paper>

      {/* Table */}
      <Paper
        radius="lg"
        p="sm"
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
                overflow: "auto",
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
                  <Table.Tr>
                    {HEADERS.map((h) => (
                      <Table.Th
                        key={h.label}
                        className="lms-thead-cell"
                        style={{ ...TH, textAlign: h.right ? "right" : "left" }}
                      >
                        {h.label}
                      </Table.Th>
                    ))}
                    <Table.Th
                      className="lms-thead-cell"
                      style={{ ...TH, textAlign: "right" }}
                    >
                      Actions
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td
                        colSpan={HEADERS.length + 1}
                        style={{ border: "none" }}
                      >
                        <Stack align="center" gap="xs" py="xl">
                          <IconFileText
                            size={26}
                            color="var(--mantine-color-slate-4)"
                          />
                          <Text ta="center" c="slate.5" fz="xs">
                            No amendments yet. Use Create Amend to amend an
                            investment's schedule.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const isDraft = row.amend_status === "Draft";
                      const isApproved = row.amend_status === "Approved";
                      const canDelete =
                        isDraft || row.amend_status === "Cancelled";
                      const cell = {
                        padding: "10px",
                        border: "none",
                        boxShadow: "var(--mantine-shadow-xs)",
                      };
                      const money = (v: number) => (
                        <Text
                          fz="xs"
                          fw={600}
                          c="slate.8"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {fmtAmount(Number(v) || 0)}
                        </Text>
                      );
                      return (
                        <Table.Tr
                          key={`${row.investment_id}-${row.version}`}
                          className="lms-row"
                          onDoubleClick={() => open("view", row)}
                          style={{ cursor: "pointer" }}
                        >
                          <Table.Td
                            style={{
                              ...cell,
                              borderLeft: `3px solid var(--mantine-color-${STATUS_COLOR[row.amend_status]}-4)`,
                            }}
                          >
                            <Text fz="sm" fw={600} c="slate.8">
                              {row.investor}
                            </Text>
                            <Text fz={11} c="slate.5">
                              {row.investment_id}
                            </Text>
                          </Table.Td>
                          <Table.Td style={cell}>
                            <Badge
                              variant="light"
                              color="brand"
                              radius="sm"
                              size="sm"
                              style={{ textTransform: "none" }}
                            >
                              v{row.version}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={cell}>
                            {row.amend_date
                              ? formatInvestorDate(row.amend_date)
                              : "-"}
                          </Table.Td>
                          <Table.Td style={cell}>{row.emis}</Table.Td>
                          <Table.Td style={{ ...cell, textAlign: "right" }}>
                            {money(row.principal)}
                          </Table.Td>
                          <Table.Td style={{ ...cell, textAlign: "right" }}>
                            {money(row.interest)}
                          </Table.Td>
                          <Table.Td style={{ ...cell, textAlign: "right" }}>
                            {money(row.penalty)}
                          </Table.Td>
                          <Table.Td style={{ ...cell, textAlign: "right" }}>
                            <Text
                              fz="xs"
                              fw={800}
                              c="slate.9"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {fmtAmount(Number(row.total) || 0)}
                            </Text>
                          </Table.Td>
                          <Table.Td style={cell}>
                            <Badge
                              variant="light"
                              radius="xl"
                              size="sm"
                              color={STATUS_COLOR[row.amend_status]}
                              style={{ textTransform: "none", fontWeight: 700 }}
                            >
                              {row.amend_status}
                            </Badge>
                          </Table.Td>
                          <Table.Td
                            style={cell}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            <Group justify="flex-end" gap={4} wrap="nowrap">
                              <Tooltip label="View" withArrow>
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color="slate"
                                  radius="md"
                                  onClick={() => open("view", row)}
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip
                                label={
                                  isDraft
                                    ? "Edit"
                                    : "Only Draft amendments can be edited"
                                }
                                withArrow
                              >
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color={isDraft ? "brand" : "slate"}
                                  radius="md"
                                  disabled={!isDraft}
                                  style={
                                    isDraft ? undefined : { opacity: 0.35 }
                                  }
                                  onClick={() => open("edit", row)}
                                >
                                  <IconPencil size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip
                                label={
                                  canDelete
                                    ? "Delete"
                                    : "Only Draft or Cancelled amendments can be deleted"
                                }
                                withArrow
                              >
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color={canDelete ? "danger" : "slate"}
                                  radius="md"
                                  disabled={!canDelete}
                                  style={
                                    canDelete ? undefined : { opacity: 0.35 }
                                  }
                                  onClick={() =>
                                    confirm(
                                      "Delete Amendment",
                                      `Delete the ${row.amend_status.toLowerCase()} amendment v${row.version} of ${row.investment_id} (${row.investor})?`,
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
                                      isDraft || isApproved
                                        ? undefined
                                        : { opacity: 0.35 }
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
                                          "Approve Amendment",
                                          `Approve amendment v${row.version} of ${row.investment_id} (${row.investor})? Its schedule becomes the one in use for payouts.`,
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
                                          "Cancel Amendment",
                                          `Cancel amendment v${row.version} of ${row.investment_id}? The investment goes back to the schedule it had before it.`,
                                          "Cancel Amendment",
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
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Pagination */}
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
                    rightSection={
                      <IconChevronDown size={14} style={{ opacity: 0.6 }} />
                    }
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
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
