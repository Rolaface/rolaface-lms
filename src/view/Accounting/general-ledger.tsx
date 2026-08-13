import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Box,
  Paper,
  Table,
  TextInput,
  Button,
  Loader,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Pagination,
  useMantineTheme,
  Select,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconRefresh, IconBook, IconChevronLeft } from "@tabler/icons-react";

import {
  type LedgerRow,
  type Summary,
} from "../../api/Accounting/Generalledger.api";
import { useGeneralLedger } from "../../hooks/Accounting/Generalledger.logic";
import { useCurrencyReady } from "../../store/currencyStore";
import dayjs from "dayjs";

export interface GeneralLedgerProps {
  account?: string;
  onBack?: () => void;
}

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  summary,
  displayAmount,
  loading,
}: {
  summary: Summary;
  displayAmount: (amount: number) => string;
  loading: boolean;
}) {
  const sections = [
    {
      label: "Opening",
      items: [
        { label: "Debit", value: summary.opening.debit, color: "info.5" },
        { label: "Credit", value: summary.opening.credit, color: "gold.5" },
        {
          label: "Balance",
          value: summary.opening.balance,
          color: summary.opening.balance >= 0 ? "success.6" : "danger.5",
        },
      ],
    },
    {
      label: "Period",
      items: [
        { label: "Debit", value: summary.total.debit, color: "info.5" },
        { label: "Credit", value: summary.total.credit, color: "gold.5" },
        {
          label: "Balance",
          value: summary.total.balance,
          color: summary.total.balance >= 0 ? "success.6" : "danger.5",
        },
      ],
    },
    {
      label: "Closing",
      items: [
        { label: "Debit", value: summary.closing.debit, color: "info.5" },
        { label: "Credit", value: summary.closing.credit, color: "gold.5" },
        {
          label: "Balance",
          value: summary.closing.balance,
          color: summary.closing.balance >= 0 ? "success.6" : "danger.5",
        },
      ],
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
      {sections.map((sec) => (
        <Paper
          key={sec.label}
          withBorder
          radius="md"
          p={8}
          style={{ background: "var(--mantine-color-slate-0)" }}
        >
          <Text
            fz="10px"
            fw={700}
            tt="uppercase"
            c="slate.4"
            style={{ letterSpacing: "0.08em" }}
            mb={6}
          >
            {sec.label}
          </Text>
          <Group gap="md" grow>
            {sec.items.map((kpi) => (
              <Box key={kpi.label}>
                <Text fz="11px" c="slate.5" mb={2}>
                  {kpi.label}
                </Text>
                {loading ? (
                  <Box h={14} w={72} className="gl-skeleton" />
                ) : (
                  <Text
                    fz="12px"
                    fw={600}
                    c={kpi.color}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {displayAmount(kpi.value)}
                  </Text>
                )}
              </Box>
            ))}
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/* ───────────────── Filter bar ───────────────── */

function FilterBar({
  account,
  setAccount,
  accountOptions,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onApply,
  onBack,
  showBack,
  loading,
}: {
  account: string;
  setAccount: (v: string) => void;
  accountOptions: { value: string; label: string }[];
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  onApply: () => void;
  onBack: () => void;
  showBack: boolean;
  loading: boolean;
}) {
  return (
    <Group gap="sm" wrap="wrap" align="flex-end">
      {showBack && (
        <Button
          size="xs"
          variant="default"
          leftSection={<IconChevronLeft size={13} />}
          onClick={onBack}
        >
          Back
        </Button>
      )}

      <Select
        size="xs"
        label="Account"
        placeholder="Select account"
        searchable
        clearable
        data={accountOptions}
        value={account || null}
        onChange={(v) => setAccount(v || "")}
        style={{ flex: 1, minWidth: 220 }}
      />

      <DateInput
        size="xs"
        label="From"
        value={fromDate}
        onChange={(value) => setFromDate(value || "")}
        valueFormat="DD-MMM-YYYY"
        w={140}
        clearable
      />

      <DateInput
        size="xs"
        label="To"
        value={toDate}
        onChange={(value) => setToDate(value || "")}
        valueFormat="DD-MMM-YYYY"
        w={140}
        clearable
      />
      <Button
        size="xs"
        color="brand"
        leftSection={
          loading ? (
            <IconRefresh size={13} className="gl-spin" />
          ) : (
            <IconBook size={13} />
          )
        }
        onClick={onApply}
        disabled={loading}
      >
        Apply
      </Button>
    </Group>
  );
}

/* ───────────────── Page ───────────────── */

export function GeneralLedger({
  account: accountProp,
  onBack,
}: GeneralLedgerProps) {
  useCurrencyReady();

  const navigate = useNavigate();
  const theme = useMantineTheme();

  const {
    account,
    setAccount,
    accountOptions,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    handleApply,
    glData,
    loading,
    error,
    page,
    handlePageChange,
    pageSize,
    displayAmount,
  } = useGeneralLedger(accountProp);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate({ to: ".." });
  };

  const columns = useMemo<ColumnDef<LedgerRow>[]>(() => {
    if (!glData?.columns) return [];
    return glData.columns
      .filter((c) => !c.hidden)
      .map((col): ColumnDef<LedgerRow> => {
        const isAmount = ["debit", "credit", "balance"].includes(col.fieldname);
        return {
          id: col.fieldname,
          accessorKey: col.fieldname,
          header: col.label,
          size: col.width ?? (isAmount ? 130 : 160),
          meta: { align: isAmount ? "right" : "left" },
          cell: ({ row, getValue }) => {
            const val = getValue();
            const isSummary = row.original.is_summary_row;

            if (isAmount) {
              const n = Number(val ?? 0);
              if (n === 0)
                return (
                  <Text fz="xs" c="slate.3">
                    —
                  </Text>
                );
              const color =
                col.fieldname === "balance"
                  ? n >= 0
                    ? "success.6"
                    : "danger.5"
                  : col.fieldname === "debit"
                    ? "info.5"
                    : "gold.5";
              return (
                <Text
                  fz="xs"
                  fw={isSummary ? 700 : 500}
                  c={color}
                  ff="monospace"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {displayAmount(n)}
                </Text>
              );
            }

            if (col.fieldname === "posting_date" && val) {
              return (
                <Text
                  fz="xs"
                  c="slate.7"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {dayjs(String(val)).format("DD-MMM-YYYY")}
                </Text>
              );
            }
            if (col.fieldname === "voucher_no" && val)
              return (
                <Text fz="xs" fw={600} c="brand.6">
                  {String(val)}
                </Text>
              );
            if (
              (col.fieldname === "party" || col.fieldname === "party_name") &&
              val
            )
              return (
                <Text fz="xs" fw={500} c="slate.8">
                  {String(val)}
                </Text>
              );
            if (col.fieldname === "account")
              return (
                <Text
                  fz="xs"
                  fw={isSummary ? 700 : 400}
                  c={isSummary ? "slate.9" : "slate.7"}
                >
                  {String(val)}
                </Text>
              );
            if (!val && val !== 0)
              return (
                <Text fz="xs" c="slate.3">
                  —
                </Text>
              );
            return (
              <Text fz="xs" c="slate.7">
                {String(val)}
              </Text>
            );
          },
        };
      });
  }, [glData?.columns, displayAmount]);

  const table = useReactTable({
    data: glData?.ledger ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: glData?.pagination?.total_pages ?? -1,
  });

  const pagination = glData?.pagination;
  const summary = glData?.summary;

  // First load = actively loading and no data yet at all. Show a
  // skeleton/loader inside the table shell instead of nothing, so the
  // page never looks "half rendered" (toolbar visible, table blank).
  const isInitialLoad = loading && !glData;

  return (
    // Self-contained scroll pattern (same as ChartOfAccounts / JournalEntries):
    // fixed maxHeight instead of h="100%"/flex, so it doesn't depend on the
    // parent route having a bounded height.
    <Stack gap="sm" p="lg">
      <style>{`
        @keyframes gl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .gl-spin { animation: gl-spin 900ms linear infinite; }
        .gl-skeleton {
          background: var(--mantine-color-slate-1);
          border-radius: var(--mantine-radius-sm);
          animation: gl-pulse 1.4s ease-in-out infinite;
        }
        @keyframes gl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .gl-row td { background: var(--mantine-color-white); }
        .gl-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .gl-row-summary td { background: var(--mantine-color-slate-0) !important; }
        .gl-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Toolbar — filters + KPI together */}
      <Paper withBorder radius="md" p="sm">
        <Stack gap="sm">
          <FilterBar
            account={account}
            setAccount={setAccount}
            accountOptions={accountOptions.map((a) => ({
              value: a.name,
              label: a.account_name,
            }))}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            onApply={handleApply}
            onBack={handleBack}
            showBack={!!accountProp}
            loading={loading}
          />

          {error && (
            <Text fz="xs" c="danger.6">
              {error}
            </Text>
          )}

          {summary && (
            <KpiStrip
              summary={summary}
              displayAmount={displayAmount}
              loading={loading && !glData}
            />
          )}
        </Stack>
      </Paper>

      {/* Table Paper — always rendered, so the page never shows
          "toolbar only, blank below" while waiting for the first response. */}
      <Paper withBorder radius="md" shadow="sm" style={{ overflow: "hidden" }}>
        <Box
          style={{
            maxHeight: "calc(100vh - 400px)",
            minHeight: 280,
            overflowY: "auto",
            overflowX: "auto",
            position: "relative",
          }}
        >
          {isInitialLoad ? (
            <Group justify="center" py={80}>
              <Loader size="sm" color="indigoAlt.4" />
            </Group>
          ) : columns.length === 0 ? (
            <Group justify="center" py={80}>
              <Text fz="xs" c="slate.4">
                No ledger data available.
              </Text>
            </Group>
          ) : (
            <Table
              stickyHeader
              horizontalSpacing="sm"
              verticalSpacing={4}
              style={{
                tableLayout: "fixed",
                width: "max-content",
                minWidth: "100%",
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  {table.getHeaderGroups()[0].headers.map((header) => {
                    const align =
                      (
                        header.column.columnDef.meta as
                          { align?: string } | undefined
                      )?.align === "right"
                        ? "right"
                        : "left";
                    return (
                      <Table.Th
                        key={header.id}
                        className="gl-thead-cell"
                        style={{
                          width: header.getSize(),
                          textAlign: align,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {loading && !glData?.ledger?.length ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={columns.length}
                      h={Math.min(pageSize, 10) * 38}
                    >
                      <Group justify="center">
                        <Loader size="sm" color="indigoAlt.4" />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length} py={56} ta="center">
                      <Text fz="xs" c="slate.4">
                        No ledger entries found for the selected filters.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const isSummary = row.original.is_summary_row;
                    return (
                      <Table.Tr
                        key={row.id}
                        className={isSummary ? "gl-row-summary" : "gl-row"}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const align =
                            (
                              cell.column.columnDef.meta as
                                { align?: string } | undefined
                            )?.align === "right"
                              ? "right"
                              : "left";
                          return (
                            <Table.Td
                              key={cell.id}
                              style={{
                                textAlign: align,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </Table.Td>
                          );
                        })}
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          )}

          {loading && !isInitialLoad && (glData?.ledger?.length ?? 0) > 0 && (
            <Box
              style={{
                position: "sticky",
                inset: 0,
                background:
                  "color-mix(in srgb, var(--mantine-color-white) 60%, transparent)",
                backdropFilter: "blur(1px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Loader size="sm" color="indigoAlt.4" />
            </Box>
          )}
        </Box>

        {/* Pagination footer — matches JournalEntries.tsx exactly:
            "Showing X-Y of Z" text on the left, Mantine Pagination
            (dots/numbers, radius="xl") on the right. */}
        {pagination && pagination.total_entries > 0 && (
          <Group
            justify="space-between"
            px="sm"
            pt="xs"
            pb="xs"
            style={{
              borderTop: "1px solid var(--mantine-color-slate-2)",
              background: "var(--mantine-color-slate-0)",
            }}
          >
            <Group
              gap="sm"
              c="slate.6"
              style={{ fontSize: "var(--mantine-font-size-xs)" }}
            >
              <span>
                {`Showing ${(pagination.page - 1) * pagination.page_size + 1}-${Math.min(
                  pagination.page * pagination.page_size,
                  pagination.total_entries,
                )} of ${pagination.total_entries}`}
              </span>
            </Group>

            <Pagination
              total={pagination.total_pages}
              value={page}
              onChange={(p) => handlePageChange(p)}
              color="brand"
              size="xs"
              radius="xl"
              disabled={loading}
            />
          </Group>
        )}
      </Paper>
    </Stack>
  );
}
