import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  CloseButton,
  Group,
  Loader,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Paper,
  SimpleGrid,
  Switch,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Timeline,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  getInvestorEarningById,
  payInvestorEarningRow,
  updateInvestorEarning,
} from "../../../api/Investor/investorFlowApi";
import {
  type InvestorEarning,
  type InvestorEarningDetails,
  type InvestorEarningRowStatus,
  type InvestorEarningScheduleRow,
  type InvestorScheduleVersion,
} from "../../../types/Investor/investorFlow";
import { IconHistory, IconReceipt2 } from "@tabler/icons-react";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import {
  SectionBox,
  TH_STYLE,
  createInitialState,
  fmtDate,
  loadInvestorFlowState,
  toIso,
  type ModalState,
} from "./InvestorModalShared";
import { StageShell } from "./StageShell";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

const ROWS_PER_PAGE = 10;

type ScheduleAmountField =
  "principal_amount" | "interest_amount" | "penalty_amount" | "total_payment";

const ROW_STATUS_COLOR: Record<InvestorEarningRowStatus, string> = {
  Pending: "slate",
  Accrued: "warning",
  Paid: "success",
};

/** Accrued rows keep their date, principal and interest; only penalty / total can change. */
const ACCRUED_LOCKED_FIELDS = new Set([
  "payment_date",
  "principal_amount",
  "interest_amount",
]);

/** Details and schedule rows being viewed / edited. */
interface EarningDraft {
  details: InvestorEarningDetails;
  rows: InvestorEarningScheduleRow[];
}

const draftFromEarning = (e: InvestorEarning): EarningDraft => ({
  details: {
    amount_invested: Number(e.amount_invested) || 0,
    frequency: e.frequency,
    mat_date: e.mat_date,
    rate_of_interest: Number(e.rate_of_interest) || 0,
    first_repay_date: e.first_repay_date,
    rate_of_penalty: e.rate_of_penalty,
  },
  rows: e.schedule.map((r) => ({ ...r })),
});

/** First problem in the schedule rows (the details are read-only), or "" when they can be saved. */
function validateDraft({ rows }: EarningDraft): string {
  for (const r of rows) {
    if (!r.payment_date) return `Row ${r.idx}: enter the payment date.`;
    const amounts = [
      r.principal_amount,
      r.interest_amount,
      r.penalty_amount,
      r.total_payment,
    ];
    if (amounts.some((v) => !(Number(v) >= 0)))
      return `Row ${r.idx}: amounts cannot be negative.`;
  }
  return "";
}

/* ------------------------------------------------------------------ */
/* Earning & Settlement content                                        */
/* ------------------------------------------------------------------ */

interface EarningsStatementsProps {
  draft: EarningDraft;
  /** Omitted when read-only. */
  onChange?: (draft: EarningDraft) => void;
  /** Pays one schedule row; omitted when read-only. */
  onPay?: (row: InvestorEarningScheduleRow) => void;
  /** Opens the accounting of a paid row (its payout Journal Entry). */
  onViewAccounting?: (row: InvestorEarningScheduleRow) => void;
  /** Why Pay is disabled (e.g. unsaved changes), or "". */
  payDisabledReason?: string;
  /** Row being paid. */
  payingRow?: string | null;
  /** Version of the current schedule. */
  version?: number;
  /** Earlier versions of the schedule (newest first). */
  history?: InvestorScheduleVersion[];
  /** The saved current schedule (compared with the latest history version). */
  currentRows?: InvestorEarningScheduleRow[];
}

type CompareField =
  | "payment_date"
  | "principal_amount"
  | "interest_amount"
  | "penalty_amount"
  | "total_payment";
const COMPARE_FIELDS: CompareField[] = [
  "payment_date",
  "principal_amount",
  "interest_amount",
  "penalty_amount",
  "total_payment",
];
const HISTORY_ROWS_PER_PAGE = 10;
const VERSIONS_PER_PAGE = 6;

interface VersionEntry {
  version: number;
  current: boolean;
  rows: InvestorEarningScheduleRow[];
}

const sameValue = (field: CompareField, a: unknown, b: unknown) =>
  field === "payment_date"
    ? String(a ?? "") === String(b ?? "")
    : Number(a || 0) === Number(b || 0);

/** Fields of each row (by position) that differ in the newer version; null when there is no newer version. */
function changesAgainst(
  rows: InvestorEarningScheduleRow[],
  newer: InvestorEarningScheduleRow[] | null,
): Map<number, Set<CompareField>> | null {
  if (!newer) return null;
  const changes = new Map<number, Set<CompareField>>();
  rows.forEach((row, i) => {
    const next = newer[i];
    const fields = new Set<CompareField>(
      next
        ? COMPARE_FIELDS.filter((f) => !sameValue(f, row[f], next[f]))
        : COMPARE_FIELDS,
    );
    if (fields.size) changes.set(i, fields);
  });
  return changes;
}

const totalOf = (rows: InvestorEarningScheduleRow[], field: CompareField) =>
  rows.reduce((a, r) => a + (Number(r[field]) || 0), 0);

/** "Schedule history": every version (current first) with what changed in the version after it. */
function ScheduleHistoryModal({
  opened,
  onClose,
  version,
  currentRows,
  history,
}: {
  opened: boolean;
  onClose: () => void;
  version: number;
  currentRows: InvestorEarningScheduleRow[];
  history: InvestorScheduleVersion[];
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const versions: VersionEntry[] = [
    { version, current: true, rows: currentRows },
    ...history.map((h) => ({
      version: h.version,
      current: false,
      rows: h.rows,
    })),
  ];
  const [selected, setSelected] = useState<number>(
    history[0]?.version ?? version,
  );
  const [versionPage, setVersionPage] = useState(1);
  const [rowPage, setRowPage] = useState(1);
  const [onlyChanged, setOnlyChanged] = useState(false);

  const index = Math.max(
    0,
    versions.findIndex((v) => v.version === selected),
  );
  const entry = versions[index];
  // The version that replaced this one (the one just above it in the list).
  const newer = index > 0 ? versions[index - 1] : null;
  const changes = changesAgainst(entry.rows, newer ? newer.rows : null);

  const visibleRows = entry.rows
    .map((row, i) => ({ row, i, newerRow: newer?.rows[i] }))
    .filter(({ i }) => !onlyChanged || !!changes?.has(i));
  const rowPages = Math.max(
    1,
    Math.ceil(visibleRows.length / HISTORY_ROWS_PER_PAGE),
  );
  const currentRowPage = Math.min(rowPage, rowPages);
  const pageRows = visibleRows.slice(
    (currentRowPage - 1) * HISTORY_ROWS_PER_PAGE,
    currentRowPage * HISTORY_ROWS_PER_PAGE,
  );

  const versionPages = Math.max(
    1,
    Math.ceil(versions.length / VERSIONS_PER_PAGE),
  );
  const pageVersions = versions.slice(
    (versionPage - 1) * VERSIONS_PER_PAGE,
    versionPage * VERSIONS_PER_PAGE,
  );

  const select = (v: number) => {
    setSelected(v);
    setRowPage(1);
  };

  const cell = (
    row: InvestorEarningScheduleRow,
    field: CompareField,
    newerRow?: InvestorEarningScheduleRow,
  ) => {
    const value =
      field === "payment_date"
        ? fmtDate(row[field])
        : fmtAmount(Number(row[field]) || 0);
    const changedField =
      !!newerRow && !sameValue(field, row[field], newerRow[field]);
    if (!changedField || !newerRow) return value;
    const next =
      field === "payment_date"
        ? fmtDate(newerRow[field])
        : fmtAmount(Number(newerRow[field]) || 0);
    return (
      <Tooltip
        label={`Changed in version ${newer?.version} to ${next}`}
        withArrow
      >
        <Box
          component="span"
          px={6}
          py={2}
          style={{
            borderRadius: "var(--mantine-radius-sm)",
            background: "var(--mantine-color-warning-1)",
            display: "inline-block",
          }}
        >
          <Text span fz="xs" fw={600} c="slate.8">
            {value}
          </Text>
          <Text span fz={10} c="warning.8" ml={4}>
            → {next}
          </Text>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1180}
      radius="lg"
      centered
      zIndex={400}
      padding={0}
      withCloseButton={false}
      styles={{ content: { overflow: "hidden" } }}
    >
      {/* Header */}
      <Group
        justify="space-between"
        px="lg"
        py="md"
        style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
      >
        <Group gap="sm">
          <ThemeIcon size={36} radius="md" variant="light" color="brand">
            <IconHistory size={18} />
          </ThemeIcon>
          <Box>
            <Text fw={700} c="slate.8">
              Schedule history
            </Text>
            <Text fz="xs" c="slate.5">
              {versions.length} versions · every saved change kept as its own
              version
            </Text>
          </Box>
        </Group>
        <CloseButton onClick={onClose} aria-label="Close" />
      </Group>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          minHeight: 460,
        }}
      >
        {/* Versions */}
        <Box
          p="md"
          style={{
            borderRight: "1px solid var(--mantine-color-slate-2)",
            background: "var(--mantine-color-slate-0)",
          }}
        >
          <Timeline active={-1} bulletSize={22} lineWidth={2}>
            {pageVersions.map((v) => {
              const i = versions.indexOf(v);
              const changed =
                i > 0
                  ? (changesAgainst(v.rows, versions[i - 1].rows)?.size ?? 0)
                  : null;
              const active = v.version === selected;
              return (
                <Timeline.Item
                  key={v.version}
                  bullet={
                    <Text fz={10} fw={700}>
                      {v.version}
                    </Text>
                  }
                  color={v.current ? "success" : active ? "brand" : "slate"}
                >
                  <UnstyledButton
                    onClick={() => select(v.version)}
                    w="100%"
                    p={8}
                    style={{
                      borderRadius: "var(--mantine-radius-md)",
                      background: active
                        ? "var(--mantine-color-white)"
                        : undefined,
                      boxShadow: active
                        ? "0 0 0 1px var(--mantine-color-brand-3)"
                        : undefined,
                    }}
                  >
                    <Group gap={6}>
                      <Text fw={700} fz="sm" c="slate.8">
                        Version {v.version}
                      </Text>
                      {v.current && (
                        <Badge
                          variant="light"
                          color="success"
                          radius="sm"
                          size="xs"
                        >
                          Current
                        </Badge>
                      )}
                    </Group>
                    <Text fz="xs" c="slate.5">
                      {v.rows.length} payouts ·{" "}
                      {fmtAmount(totalOf(v.rows, "total_payment"))}
                    </Text>
                    {changed !== null && (
                      <Text fz="xs" c={changed ? "warning.8" : "slate.5"}>
                        {changed
                          ? `${changed} row${changed > 1 ? "s" : ""} changed in v${versions[i - 1].version}`
                          : "No row changes"}
                      </Text>
                    )}
                  </UnstyledButton>
                </Timeline.Item>
              );
            })}
          </Timeline>
          {versionPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination
                total={versionPages}
                value={versionPage}
                onChange={setVersionPage}
                size="xs"
                radius="xl"
                color="brand"
              />
            </Group>
          )}
        </Box>

        {/* Selected version */}
        <Box p="md" style={{ minWidth: 0 }}>
          <Group justify="space-between" mb="sm" wrap="wrap" gap="xs">
            <Group gap="xs">
              <Text fw={700} c="slate.8">
                Version {entry.version}
              </Text>
              <Badge
                variant="light"
                color={entry.current ? "success" : "slate"}
                radius="sm"
                size="sm"
              >
                {entry.current
                  ? "Current schedule"
                  : `Replaced by version ${newer?.version}`}
              </Badge>
            </Group>
            {!entry.current && (
              <Switch
                size="sm"
                color="brand"
                label="Only changed rows"
                checked={onlyChanged}
                onChange={(e) => {
                  setOnlyChanged(e.currentTarget.checked);
                  setRowPage(1);
                }}
              />
            )}
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mb="sm">
            {(
              [
                ["Principal", "principal_amount"],
                ["Interest", "interest_amount"],
                ["Penalty", "penalty_amount"],
                ["Total payment", "total_payment"],
              ] as [string, CompareField][]
            ).map(([label, field]) => {
              const value = totalOf(entry.rows, field);
              const diff = newer ? totalOf(newer.rows, field) - value : 0;
              return (
                <Paper key={field} radius="md" p="xs" withBorder>
                  <Text fz={11} c="slate.5">
                    {label}
                  </Text>
                  <Text fw={700} fz="sm" c="slate.8">
                    {fmtAmount(value)}
                  </Text>
                  {!!newer && Math.abs(diff) >= 0.01 && (
                    <Text fz={10} c={diff > 0 ? "success.7" : "danger.7"}>
                      {diff > 0 ? "+" : "−"}
                      {fmtAmount(Math.abs(diff))} in v{newer.version}
                    </Text>
                  )}
                </Paper>
              );
            })}
          </SimpleGrid>

          {!entry.current && !changes?.size && (
            <Alert variant="light" color="slate" radius="md" mb="sm">
              No row values changed in version {newer?.version}.
            </Alert>
          )}

          <Table.ScrollContainer minWidth={640}>
            <Table
              verticalSpacing={6}
              horizontalSpacing="sm"
              fz="xs"
              striped
              highlightOnHover
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={TH_STYLE}>#</Table.Th>
                  <Table.Th style={TH_STYLE}>Payment date</Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                    Principal
                  </Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                    Interest
                  </Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                    Penalty
                  </Table.Th>
                  <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                    Total payment
                  </Table.Th>
                  <Table.Th style={TH_STYLE}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageRows.map(({ row, i, newerRow }) => (
                  <Table.Tr key={row.name}>
                    <Table.Td>{i + 1}</Table.Td>
                    <Table.Td>{cell(row, "payment_date", newerRow)}</Table.Td>
                    <Table.Td ta="right">
                      {cell(row, "principal_amount", newerRow)}
                    </Table.Td>
                    <Table.Td ta="right">
                      {cell(row, "interest_amount", newerRow)}
                    </Table.Td>
                    <Table.Td ta="right">
                      {cell(row, "penalty_amount", newerRow)}
                    </Table.Td>
                    <Table.Td ta="right">
                      {cell(row, "total_payment", newerRow)}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        radius="sm"
                        size="sm"
                        color={ROW_STATUS_COLOR[row.status ?? "Pending"]}
                      >
                        {row.status ?? "Pending"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Group justify="space-between" mt="sm">
            <Text fz="xs" c="slate.5">
              {visibleRows.length} of {entry.rows.length} rows
            </Text>
            <Pagination
              total={rowPages}
              value={currentRowPage}
              onChange={setRowPage}
              size="xs"
              radius="xl"
              color="brand"
            />
          </Group>
        </Box>
      </Box>
    </Modal>
  );
}

function EarningsStatements({
  draft,
  onChange,
  onPay,
  onViewAccounting,
  payDisabledReason = "",
  payingRow = null,
  version = 1,
  history = [],
  currentRows = [],
}: EarningsStatementsProps) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const [historyOpened, setHistoryOpened] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ROWS_PER_PAGE);
  const { rows } = draft;
  const editable = !!onChange;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstRow = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(rows.length, currentPage * pageSize);

  const totalPayment = rows.reduce(
    (a, r) => a + (Number(r.total_payment) || 0),
    0,
  );

  const setRow = (name: string, patch: Partial<InvestorEarningScheduleRow>) =>
    onChange?.({
      ...draft,
      rows: rows.map((r) => {
        if (r.name !== name) return r;
        const next = { ...r, ...patch };
        // Principal / Interest / Penalty changed: refill Total Payment (it stays editable).
        if (
          "principal_amount" in patch ||
          "interest_amount" in patch ||
          "penalty_amount" in patch
        ) {
          next.total_payment =
            Math.round(
              ((Number(next.principal_amount) || 0) +
                (Number(next.interest_amount) || 0) +
                (Number(next.penalty_amount) || 0)) *
                100,
            ) / 100;
        }
        return next;
      }),
    });

  /** Paid rows are locked; Accrued rows lock date, principal and interest. */
  const cellEditable = (row: InvestorEarningScheduleRow, field: string) =>
    editable &&
    row.status !== "Paid" &&
    !(row.status === "Accrued" && ACCRUED_LOCKED_FIELDS.has(field));

  const amountCell = (
    row: InvestorEarningScheduleRow,
    field: ScheduleAmountField,
  ) =>
    cellEditable(row, field) ? (
      <NumberInput
        size="xs"
        radius="md"
        min={0}
        decimalScale={2}
        thousandSeparator=","
        hideControls
        value={row[field]}
        onChange={(v) => setRow(row.name, { [field]: Number(v) || 0 })}
      />
    ) : (
      <Text fz="xs" ta="right">
        {fmtAmount(Number(row[field]) || 0)}
      </Text>
    );

  return (
    <>
      {/* Takes the remaining height; only the table inside it scrolls. */}
      <Box
        style={{
          flex: 1,
          // Room for a few rows; on a very short window the modal body scrolls instead.
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SectionBox
          fill
          title={
            <Text
              span
              fz="xs"
              fw={800}
              tt="uppercase"
              style={{ letterSpacing: 0.5 }}
            >
              Repayment schedule
            </Text>
          }
          titleAddon={
            <Badge variant="light" color="brand" radius="sm" size="sm">
              Version {version}
            </Badge>
          }
          actions={
            <Button
              size="xs"
              radius="xl"
              variant="default"
              leftSection={<IconHistory size={14} />}
              disabled={history.length === 0}
              onClick={() => setHistoryOpened(true)}
            >
              Schedule history{history.length ? ` (${history.length})` : ""}
            </Button>
          }
        >
          {rows.length === 0 ? (
            <Alert variant="light" color="brand" radius="md">
              No schedule saved for this investment.
            </Alert>
          ) : (
            <>
              <Box style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
                <Table
                  verticalSpacing={6}
                  horizontalSpacing="sm"
                  fz="xs"
                  stickyHeader
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={TH_STYLE}>#</Table.Th>
                      <Table.Th style={TH_STYLE}>Payment date</Table.Th>
                      <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                        Principal
                      </Table.Th>
                      <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                        Interest
                      </Table.Th>
                      <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                        Penalty
                      </Table.Th>
                      <Table.Th style={{ ...TH_STYLE, textAlign: "right" }}>
                        Total payment
                      </Table.Th>
                      <Table.Th style={TH_STYLE}>Status</Table.Th>
                      {(onPay || onViewAccounting) && <Table.Th />}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageRows.map((row) => (
                      <Table.Tr key={row.name}>
                        <Table.Td>{row.idx}</Table.Td>
                        <Table.Td miw={140}>
                          {cellEditable(row, "payment_date") ? (
                            <TextInput
                              type="date"
                              size="xs"
                              radius="md"
                              value={row.payment_date ?? ""}
                              onChange={(e) =>
                                setRow(row.name, {
                                  payment_date: e.currentTarget.value,
                                })
                              }
                            />
                          ) : (
                            row.payment_date
                          )}
                        </Table.Td>
                        <Table.Td miw={110}>
                          {amountCell(row, "principal_amount")}
                        </Table.Td>
                        <Table.Td miw={110}>
                          {amountCell(row, "interest_amount")}
                        </Table.Td>
                        <Table.Td miw={110}>
                          {amountCell(row, "penalty_amount")}
                        </Table.Td>
                        <Table.Td miw={120}>
                          {amountCell(row, "total_payment")}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            variant="light"
                            radius="sm"
                            size="sm"
                            color={ROW_STATUS_COLOR[row.status ?? "Pending"]}
                          >
                            {row.status ?? "Pending"}
                          </Badge>
                        </Table.Td>
                        {(onPay || onViewAccounting) && (
                          <Table.Td ta="right">
                            {row.status === "Paid" &&
                              row.payout_entry &&
                              onViewAccounting && (
                                <Button
                                  size="compact-xs"
                                  radius="xl"
                                  variant="light"
                                  color="brand"
                                  leftSection={<IconReceipt2 size={12} />}
                                  onClick={() => onViewAccounting(row)}
                                >
                                  View accounting
                                </Button>
                              )}
                            {onPay && row.status !== "Paid" && (
                              <Button
                                size="compact-xs"
                                radius="xl"
                                color="brand"
                                disabled={
                                  !!payDisabledReason ||
                                  (!!payingRow && payingRow !== row.name)
                                }
                                loading={payingRow === row.name}
                                title={payDisabledReason || undefined}
                                onClick={() => onPay(row)}
                              >
                                Pay
                              </Button>
                            )}
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
              <Group
                justify="space-between"
                mt="sm"
                wrap="wrap"
                gap="xs"
                style={{ flex: "none" }}
              >
                <Group
                  gap="md"
                  c="slate.6"
                  style={{ fontSize: "var(--mantine-font-size-xs)" }}
                >
                  <span>
                    Showing {firstRow}-{lastRow} of {rows.length}
                  </span>
                  <Group gap="xs">
                    <span>Rows:</span>
                    <Select
                      data={["10", "20", "50"]}
                      value={String(pageSize)}
                      onChange={(v) => {
                        setPageSize(Number(v) || ROWS_PER_PAGE);
                        setPage(1);
                      }}
                      allowDeselect={false}
                      size="xs"
                      radius="xl"
                      w={70}
                    />
                  </Group>
                  <Text fz="xs" c="slate.5">
                    {rows.filter((r) => r.status === "Paid").length} paid ·
                    Total {fmtAmount(totalPayment)}
                    {payDisabledReason && onPay
                      ? ` · ${payDisabledReason}`
                      : ""}
                  </Text>
                </Group>
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={setPage}
                  color="brand"
                  size="xs"
                  radius="xl"
                />
              </Group>
            </>
          )}
        </SectionBox>
      </Box>
      {historyOpened && (
        <ScheduleHistoryModal
          opened={historyOpened}
          onClose={() => setHistoryOpened(false)}
          version={version}
          currentRows={currentRows}
          history={history}
        />
      )}
    </>
  );
}

/** Read-only Earning & Settlement of an Investor Flow (loads it by ID). */
export function EarningsStatementsView({
  investorFlowId,
}: {
  investorFlowId: string;
}) {
  const {
    data: earning,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["investorEarning", investorFlowId],
    queryFn: () => getInvestorEarningById(investorFlowId),
  });

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" color="brand" />
      </Group>
    );
  }
  if (error || !earning) {
    return (
      <Alert variant="light" color="red" radius="md">
        {error
          ? parseFrappeError(error)
          : "The repayment record could not be loaded."}
      </Alert>
    );
  }
  return (
    <EarningsStatements
      draft={draftFromEarning(earning)}
      version={earning.schedule_version}
      history={earning.schedule_history}
      currentRows={earning.schedule}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface EarningsStatementsModalProps {
  opened: boolean;
  onClose: () => void;
  /** Investor Flow ID (Status Received). */
  investorFlowId: string;
  /** View (Eye) when true, edit (Pencil) when false. */
  readOnly?: boolean;
  /** Called after the edits are saved. */
  onSaved?: () => void;
  /** Minimizes the modal to the dock. */
  onMinimize: () => void;
}

const STAGE_INDEX = 1;

/** Stage 2 — Investor Payouts (no side nav). */
export function EarningsStatementsModal({
  opened,
  onClose,
  investorFlowId,
  readOnly = false,
  onSaved,
  onMinimize,
}: EarningsStatementsModalProps) {
  const earningQuery = useQuery({
    queryKey: ["investorEarning", investorFlowId],
    queryFn: () => getInvestorEarningById(investorFlowId),
    enabled: opened,
  });
  const flowQuery = useQuery({
    queryKey: ["investorFlow", investorFlowId],
    queryFn: () => loadInvestorFlowState(investorFlowId),
    enabled: opened,
  });

  if (earningQuery.data && flowQuery.data) {
    return (
      <EarningsStage
        key={earningQuery.dataUpdatedAt}
        opened={opened}
        onClose={onClose}
        onMinimize={onMinimize}
        investorFlowId={investorFlowId}
        readOnly={readOnly}
        onSaved={onSaved}
        earning={earningQuery.data}
        flowState={flowQuery.data}
      />
    );
  }

  const error = earningQuery.error || flowQuery.error;
  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      onMinimize={onMinimize}
      stageIndex={STAGE_INDEX}
      state={createInitialState()}
      title={readOnly ? "View Investor Payouts" : "Edit Investor Payouts"}
    >
      <Group justify="center" py="xl">
        {error ? (
          <Text fz="sm" c="red">
            {parseFrappeError(error)}
          </Text>
        ) : (
          <Loader size="sm" color="brand" />
        )}
      </Group>
    </StageShell>
  );
}

function EarningsStage({
  opened,
  onClose,
  onMinimize,
  investorFlowId,
  readOnly,
  onSaved,
  earning,
  flowState,
}: Omit<EarningsStatementsModalProps, "readOnly"> & {
  readOnly: boolean;
  earning: InvestorEarning;
  flowState: ModalState;
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<EarningDraft>(() =>
    draftFromEarning(earning),
  );
  // Only a Received investment can be edited / paid / closed.
  // Editable once funds are approved (Fund Status Partial / Paid), unless the investment is Cancelled.
  const canPay =
    !readOnly &&
    ["Partial", "Paid"].includes(earning.fund_status) &&
    earning.status !== "Cancelled";
  // Expired (past maturity with money still due): the schedule can only be viewed; rows can still be paid.
  const expired = earning.payment_status === "Expired";
  // Every row paid (Payment Status Paid): nothing is left to change or pay; view only.
  const allPaid =
    earning.payment_status === "Paid" ||
    (earning.schedule.length > 0 &&
      earning.schedule.every((r) => r.status === "Paid"));
  const editable = canPay && !expired && !allPaid;
  const draftError = editable ? validateDraft(draft) : "";
  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(draftFromEarning(earning));
  const refreshEarning = () => {
    queryClient.invalidateQueries({
      queryKey: ["investorEarning", investorFlowId],
    });
    queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
    queryClient.invalidateQueries({
      queryKey: ["investorFlow", investorFlowId],
    });
  };

  const showFailure = (heading: string, error: any) =>
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });

  const payMutation = useMutation({
    mutationFn: (row: InvestorEarningScheduleRow) =>
      payInvestorEarningRow({
        id: investorFlowId,
        row: row.name,
        paymentDate: toIso(new Date()),
      }),
    onSuccess: (_data, row) => {
      refreshEarning();
      openCommonModal({
        heading: "Payout Posted",
        subtitle: "",
        body: `Payout of ${fmtAmount(Number(row.total_payment) || 0)} for row ${row.idx} has been posted successfully.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) => showFailure("Payout Failed", error),
  });

  const confirmPay = (row: InvestorEarningScheduleRow) =>
    openCommonModal({
      heading: "Pay Schedule Row",
      subtitle: "Please confirm this action before continuing.",
      body: `Pay ${fmtAmount(Number(row.total_payment) || 0)} for row ${row.idx} (due ${row.payment_date}) from the Company Bank Account, dated today?`,
      color: "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Pay",
          color: "green",
          onClick: () => payMutation.mutate(row),
        },
      ],
    });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateInvestorEarning({
        id: investorFlowId,
        payload: {
          schedule: draft.rows.map((row) => ({
            name: row.name,
            payment_date: row.payment_date,
            principal_amount: row.principal_amount,
            interest_amount: row.interest_amount,
            penalty_amount: row.penalty_amount,
            total_payment: row.total_payment,
          })),
        },
      }),
    onSuccess: () => {
      refreshEarning();
      onClose();
      openCommonModal({
        heading: "Investor Payouts Updated",
        subtitle: "",
        body: "The repayment schedule has been updated successfully.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
      onSaved?.();
    },
    onError: (error: any) => showFailure("Update Failed", error),
  });

  let footer;
  if (editable) {
    footer = (
      <>
        {draftError && (
          <Text fz="xs" c="red" mr="auto">
            {draftError}
          </Text>
        )}
        <Button
          size="sm"
          radius="xl"
          color="brand"
          disabled={!!draftError || !isDirty}
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save
        </Button>
      </>
    );
  }

  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      onMinimize={onMinimize}
      stageIndex={STAGE_INDEX}
      state={flowState}
      title={editable ? "Edit Investor Payouts" : "View Investor Payouts"}
      footer={footer}
      headerItems={[
        {
          label: "Rate of interest",
          value: `${draft.details.rate_of_interest}% p.a.`,
        },
        {
          label: "Total interest",
          value: fmtAmount(
            draft.rows.reduce(
              (a, r) => a + (Number(r.interest_amount) || 0),
              0,
            ),
          ),
        },
        { label: "Frequency", value: draft.details.frequency || "—" },
        {
          label: "First repay date",
          value: draft.details.first_repay_date
            ? fmtDate(draft.details.first_repay_date)
            : "—",
        },
        {
          label: "Maturity date",
          value: draft.details.mat_date ? fmtDate(draft.details.mat_date) : "—",
        },
        {
          label: "Rate of penalty",
          value:
            draft.details.rate_of_penalty != null
              ? `${draft.details.rate_of_penalty}% p.a.`
              : "—",
        },
      ]}
    >
      <section
        className="inv-content"
        style={{ display: "flex", flexDirection: "column", overflow: "auto" }}
      >
        {allPaid && (
          <Alert variant="light" color="success" radius="md" mb="md">
            Every payout of this investment has been made (Payment Status:
            Paid). Investor Payouts can only be viewed.
          </Alert>
        )}
        {expired && (
          <Alert variant="light" color="danger" radius="md" mb="md">
            This investment has Expired: its maturity date has passed with money
            still due. The schedule can no longer be edited. Pay the rows if the
            investor takes the money back, or renew it from the Renewal screen.
          </Alert>
        )}
        <EarningsStatements
          draft={draft}
          version={earning.schedule_version}
          history={earning.schedule_history}
          currentRows={earning.schedule}
          onChange={editable ? setDraft : undefined}
          onPay={canPay && !allPaid ? confirmPay : undefined}
          onViewAccounting={(row) => {
            // Investor 360: this investment's Repayments, with the payout's accounting open.
            const params = new URLSearchParams({
              investor: earning.investor_id,
              investment: investorFlowId,
              tab: "schedule",
              je: row.payout_entry ?? "",
            });
            onClose();
            navigate({ href: `/investor/investments?${params.toString()}` });
          }}
          payDisabledReason={isDirty ? "Save your changes before paying" : ""}
          payingRow={
            payMutation.isPending ? (payMutation.variables?.name ?? null) : null
          }
        />
      </section>
    </StageShell>
  );
}
