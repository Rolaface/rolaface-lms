/* Investor Payouts: every payout made to investors (Draft -> Approved -> Cancelled), with Add Payout. */
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
  IconCash,
  IconChevronDown,
  IconDotsVertical,
  IconEye,
  IconMail,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import {
  approveInvestorPayout,
  cancelInvestorPayout,
  deleteInvestorPayout,
  getInvestorPayouts,
} from "../../../api/Investor/investorFlowApi";
import {
  PAYOUT_PAYMENT_TYPES,
  PAYOUT_PAYMENT_TYPE_LABELS,
  type PayoutListItem,
  type PayoutPaymentType,
  type PayoutRecordStatus,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import { payoutModal } from "../../../components/Modal/Investor/Payouts/payoutModalStore";
import { formatInvestorDate } from "../../../components/Modal/Investor/investorDate";
import { PayoutStatementMailDialog } from "../../../components/Modal/Investor/Statements/StatementMailDialog";
import {
  approveWithMail,
  preparePayoutMail,
  showApprovalResult,
} from "../../../components/Modal/Investor/Statements/autoMail";

const STATUS_COLOR: Record<PayoutRecordStatus, string> = {
  Draft: "slate",
  Approved: "success",
  Cancelled: "danger",
};
const STATUS_OPTIONS = (
  ["Draft", "Approved", "Cancelled"] as PayoutRecordStatus[]
).map((v) => ({ value: v, label: v }));
const TYPE_OPTIONS = PAYOUT_PAYMENT_TYPES.map((v) => ({
  value: v,
  label: PAYOUT_PAYMENT_TYPE_LABELS[v],
}));

const TH = {
  fontSize: "var(--mantine-font-size-xs)",
  fontWeight: 700,
  color: "var(--mantine-color-slate-5)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  border: "none",
  padding: "0 10px 6px",
};

export function InvestorPayouts() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "investorPayouts",
      debouncedSearch,
      statusFilter,
      typeFilter,
      page,
      pageSize,
    ],
    queryFn: () =>
      getInvestorPayouts({
        search: debouncedSearch.trim() || undefined,
        record_status: statusFilter as PayoutRecordStatus[],
        payment_type: typeFilter as PayoutPaymentType[],
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
    queryClient.invalidateQueries({ queryKey: ["investorPayouts"] });
    queryClient.invalidateQueries({
      queryKey: ["payoutContext", investmentId],
    });
    queryClient.invalidateQueries({
      queryKey: ["investorEarning", investmentId],
    });
    queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
    // Add Payout's investment list: a fully paid investment drops out of it.
    queryClient.invalidateQueries({ queryKey: ["payoutCandidates"] });
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
    // Investor 360 (investment view): refreshed so it shows the latest without reloading the page.
    queryClient.invalidateQueries({ queryKey: ["investorPortfolio"] });
    queryClient.invalidateQueries({ queryKey: ["investorInvestmentDetail"] });
    queryClient.invalidateQueries({ queryKey: ["investorStatement"] });
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
    fn: (args: { id: string; payout: string }) => Promise<unknown>,
    success: (row: PayoutListItem) => [string, string],
    failure: string,
  ) => ({
    mutationFn: (row: PayoutListItem) =>
      fn({ id: row.investment_id, payout: row.name }),
    onSuccess: (_data: unknown, row: PayoutListItem) => {
      refresh(row.investment_id);
      showSuccess(...success(row));
    },
    onError: (error: unknown) => showError(failure, error),
  });
  // Approve; the payment statement is then emailed to the investor in the background.
  const companyName = useCompanyStore((state) => state.companyName);
  const approveMutation = useMutation({
    // Never re-sent automatically: the first request may already have approved.
    retry: false,
    mutationFn: (row: PayoutListItem) =>
      approveWithMail(
        () =>
          preparePayoutMail(row.investment_id, row.name, {
            theme,
            currency: companyCurrency,
            companyName,
          }),
        (mail) =>
          approveInvestorPayout({
            id: row.investment_id,
            payout: row.name,
            mail,
          }),
      ),
    onSuccess: (_data, row: PayoutListItem) => {
      refresh(row.investment_id);
      queryClient.invalidateQueries({ queryKey: ["investorNotifications"] });
      showApprovalResult({
        heading: "Payout Approved",
        body: `The payout to ${row.investor} is approved, its Journal Entry is posted and the EMIs are updated.`,
      });
    },
    onError: (error: unknown) => showError("Approve Failed", error),
  });
  // Compose Mail: send the payment statement again.
  const [mailFor, setMailFor] = useState<{
    investmentId: string;
    payoutName: string;
  } | null>(null);
  const cancelMutation = useMutation(
    action(
      cancelInvestorPayout,
      (row) => [
        "Payout Cancelled",
        `The payout of ${fmtAmount(row.payment_amount)} and its Journal Entry are cancelled.`,
      ],
      "Cancel Failed",
    ),
  );
  const deleteMutation = useMutation(
    action(
      deleteInvestorPayout,
      () => ["Payout Deleted", "The payout has been deleted."],
      "Delete Failed",
    ),
  );

  const open = (mode: "view" | "edit", row: PayoutListItem) =>
    payoutModal.open({
      mode,
      investorFlowId: row.investment_id,
      payoutName: row.name,
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
            <IconCash
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Investor Payouts
            </Title>
            <Text fz="sm" c="slate.5">
              Pay investors against their repayment schedule; approving a payout
              posts its Journal Entry
            </Text>
          </Stack>
        </Group>
        <Button
          radius="xl"
          color="brand"
          leftSection={<IconPlus size={16} />}
          style={{ background: theme.other.brandGradient }}
          onClick={() => payoutModal.open({ mode: "add" })}
        >
          Add Payout
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
            placeholder="All Payment Types"
            data={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            width={170}
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
              setTypeFilter([]);
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
                    {[
                      "Investor",
                      "Value Date",
                      "Type",
                      "Amount",
                      "Split",
                      "Mode",
                      "Reference",
                      "Status",
                    ].map((h) => (
                      <Table.Th
                        key={h}
                        className="lms-thead-cell"
                        style={{
                          ...TH,
                          textAlign: h === "Amount" ? "right" : "left",
                        }}
                      >
                        {h}
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
                      <Table.Td colSpan={9} style={{ border: "none" }}>
                        <Stack align="center" gap="xs" py="xl">
                          <IconCash
                            size={26}
                            color="var(--mantine-color-slate-4)"
                          />
                          <Text ta="center" c="slate.5" fz="xs">
                            No payouts match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const isDraft = row.record_status === "Draft";
                      const isApproved = row.record_status === "Approved";
                      const canDelete =
                        isDraft || row.record_status === "Cancelled";
                      const cell = {
                        padding: "10px",
                        border: "none",
                        boxShadow: "var(--mantine-shadow-xs)",
                      };
                      return (
                        <Table.Tr
                          key={row.name}
                          className="lms-row"
                          onDoubleClick={() => open("view", row)}
                          style={{ cursor: "pointer" }}
                        >
                          <Table.Td
                            style={{
                              ...cell,
                              borderLeft: `3px solid var(--mantine-color-${STATUS_COLOR[row.record_status]}-4)`,
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
                            {formatInvestorDate(row.value_date)}
                          </Table.Td>
                          <Table.Td style={cell}>
                            <Badge
                              variant="light"
                              color="brand"
                              radius="sm"
                              size="sm"
                              style={{ textTransform: "none" }}
                            >
                              {row.payment_type}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ ...cell, textAlign: "right" }}>
                            <Text
                              fz="xs"
                              fw={700}
                              c="slate.8"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {fmtAmount(Number(row.payment_amount) || 0)}
                            </Text>
                          </Table.Td>
                          <Table.Td style={cell}>
                            {isApproved ? (
                              <Text fz={11} c="slate.6">
                                Int {fmtAmount(Number(row.interest_paid) || 0)}{" "}
                                · Prin{" "}
                                {fmtAmount(Number(row.principal_paid) || 0)}
                                {Number(row.penalty_paid)
                                  ? ` · Pen ${fmtAmount(Number(row.penalty_paid))}`
                                  : ""}
                              </Text>
                            ) : (
                              <Text fz={11} c="slate.4">
                                On approval
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td style={cell}>{row.payment_mode}</Table.Td>
                          <Table.Td style={cell}>
                            <Text fz="xs" ff="monospace">
                              {row.reference_number || "-"}
                            </Text>
                          </Table.Td>
                          <Table.Td style={cell}>
                            <Badge
                              variant="light"
                              radius="xl"
                              size="sm"
                              color={STATUS_COLOR[row.record_status]}
                              style={{ textTransform: "none", fontWeight: 700 }}
                            >
                              {row.record_status}
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
                                    : "Only Draft payouts can be edited"
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
                                    : "Only Draft or Cancelled payouts can be deleted"
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
                                      "Delete Payout",
                                      `Delete the ${row.record_status.toLowerCase()} payout of ${fmtAmount(row.payment_amount)} to ${row.investor}?`,
                                      "Delete",
                                      "red",
                                      () => deleteMutation.mutate(row),
                                    )
                                  }
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip
                                label={
                                  isApproved
                                    ? "Compose Mail (payment statement)"
                                    : "Available once the payout is Approved"
                                }
                                withArrow
                              >
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color={isApproved ? "success" : "slate"}
                                  radius="md"
                                  disabled={!isApproved}
                                  style={
                                    isApproved ? undefined : { opacity: 0.35 }
                                  }
                                  aria-label="Compose Mail"
                                  onClick={() =>
                                    setMailFor({
                                      investmentId: row.investment_id,
                                      payoutName: row.name,
                                    })
                                  }
                                >
                                  <IconMail size={14} />
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
                                          "Approve Payout",
                                          `Approve the ${row.payment_type} payout of ${fmtAmount(row.payment_amount)} to ${row.investor} (${row.investment_id})? Its Journal Entry is posted from ${row.paid_from},`,
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
                                          "Cancel Payout",
                                          `Cancel the approved payout of ${fmtAmount(row.payment_amount)}? Its Journal Entry ${row.journal_entry ?? ""} is cancelled and the EMIs get back what it paid.`,
                                          "Cancel Payout",
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
      {mailFor && (
        <PayoutStatementMailDialog
          investmentId={mailFor.investmentId}
          payoutName={mailFor.payoutName}
          onClose={() => setMailFor(null)}
        />
      )}
    </Stack>
  );
}
