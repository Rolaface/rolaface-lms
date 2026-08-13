import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { DateInput } from "@mantine/dates";
import {
  Box,
  Paper,
  Table,
  Select,
  TextInput,
  Button,
  Loader,
  Text,
  Group,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconRefresh,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconLayoutList,
  IconAlertCircle,
  IconReceipt2,
} from "@tabler/icons-react";

import { type PLNode } from "../../api/Accounting/Profitloss.api";
import { useProfitLoss } from "../../hooks/Accounting/Useprofitloss";
import dayjs from "dayjs";

/* ───────────────── Helpers ───────────────── */

const buildExpandedToDepth = (
  nodes: PLNode[],
  depth: number,
  path = "",
): Record<string, boolean> => {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (depth > 0 && node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedToDepth(node.children, depth - 1, id));
    }
  });
  return state;
};

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  data,
  loading,
  displayAmount,
}: {
  data: ReturnType<typeof useProfitLoss>["data"];
  loading: boolean;
  displayAmount: (n: number) => string;
}) {
  const items = data?.summary ?? [];

  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "var(--mantine-spacing-sm)",
      }}
    >
      {(loading || !data ? Array.from({ length: 3 }) : items).map(
        (item: any, i) => (
          <Paper
            key={item?.label ?? i}
            withBorder
            radius="lg"
            p="md"
            style={{ borderColor: "var(--mantine-color-slate-2)" }}
          >
            <Group gap={6} mb="xs">
              <IconReceipt2
                size={14}
                color={
                  !loading && item?.indicator === "red"
                    ? "var(--mantine-color-danger-5)"
                    : "var(--mantine-color-success-6)"
                }
              />
              <Text
                fz="10px"
                fw={700}
                tt="uppercase"
                c="slate.4"
                style={{ letterSpacing: "0.08em" }}
                truncate
              >
                {item?.label ?? "—"}
              </Text>
            </Group>
            {loading || !data ? (
              <Box
                h={16}
                w={96}
                style={{
                  background: "var(--mantine-color-slate-1)",
                  borderRadius: 4,
                }}
                className="animate-pulse"
              />
            ) : (
              <Text
                fz="sm"
                fw={800}
                c={item.indicator === "green" ? "success.6" : "danger.5"}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {displayAmount(item.value)}
              </Text>
            )}
          </Paper>
        ),
      )}
    </Box>
  );
}

/* ───────────────── Page ───────────────── */

export function ProfitLoss() {
  const theme = useMantineTheme();
  const {
    filters,
    setFilters,
    data,
    tableData,
    isLoading,
    error,
    displayAmount,
    handleRefresh,
    handleFieldBlur,
  } = useProfitLoss();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    if (!data) return;
    setExpanded(buildExpandedToDepth(tableData, 2));
    setAllExpanded(false);
  }, [data, tableData]);

  const handleToggleExpand = () => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  };

  const columns = useMemo<ColumnDef<PLNode>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col): ColumnDef<PLNode> => {
      if (col.fieldname === "account") {
        return {
          id: "account_name",
          header: col.label,
          size: 240,
          cell: ({ row }) => {
            const node = row.original;
            const canExpand = row.getCanExpand();
            return (
              <Group
                gap={6}
                wrap="nowrap"
                style={{ paddingLeft: row.depth * 18 }}
              >
                {canExpand ? (
                  <Box
                    component="button"
                    type="button"
                    onClick={row.getToggleExpandedHandler()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                      color: "var(--mantine-color-slate-4)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <IconChevronRight
                      size={12}
                      style={{
                        transition: "transform 150ms ease",
                        transform: row.getIsExpanded()
                          ? "rotate(90deg)"
                          : "none",
                      }}
                    />
                    {row.getIsExpanded() ? (
                      <IconFolderOpen size={13} />
                    ) : (
                      <IconFolder size={13} />
                    )}
                  </Box>
                ) : (
                  <IconFileText
                    size={12}
                    color="var(--mantine-color-slate-4)"
                    style={{ opacity: 0.6, flexShrink: 0 }}
                  />
                )}
                <Text
                  fz="xs"
                  fw={node.is_group ? 600 : 400}
                  c="slate.8"
                  truncate
                >
                  {node.account_name}
                </Text>
              </Group>
            );
          },
        };
      }
      const isTotal = col.fieldname === "total";
      return {
        id: col.fieldname,
        header: col.label,
        size: isTotal ? 130 : 110,
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text
            fz="xs"
            fw={isTotal ? 600 : 500}
            c={isTotal ? "slate.9" : "info.5"}
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {isTotal
              ? displayAmount(row.original.total)
              : displayAmount(row.original.periods?.[col.fieldname] ?? 0)}
          </Text>
        ),
      };
    });
  }, [data, displayAmount]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: (updater) => {
      setExpanded(updater);
      setAllExpanded(false);
    },
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (error && !data) {
    return (
      <Stack align="center" py={80} gap="sm">
        <IconAlertCircle size={26} color="var(--mantine-color-danger-5)" />
        <Text fz="sm" c="danger.6">
          {error}
        </Text>
        <Button
          size="xs"
          variant="default"
          radius="xl"
          leftSection={<IconRefresh size={13} />}
          onClick={handleRefresh}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="lg">
      <style>{`
        .pl-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
        .pl-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .pl-row:hover td { background: ${theme.other?.rowHoverBg ?? "var(--mantine-color-slate-0)"} !important; }
      `}</style>

      <KpiStrip
        data={data}
        loading={isLoading && !data}
        displayAmount={displayAmount}
      />

      {/* Compact single-row toolbar — same pill pattern as JournalEntries,
          instead of a tall boxed filter panel with its own header row. */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <Select
            radius="xl"
            size="xs"
            data={["Fiscal Year", "Date Range"]}
            value={filters.mode}
            onChange={(v) => {
              const mode = (v || "Fiscal Year") as typeof filters.mode;
              setFilters((f) => ({ ...f, mode }));
            }}
            w={128}
          />

          <Select
            radius="xl"
            size="xs"
            data={["Monthly", "Quarterly", "Half-Yearly", "Yearly"]}
            value={filters.periodicity}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                periodicity: (v || "Monthly") as typeof filters.periodicity,
              }))
            }
            w={120}
          />

          {filters.mode === "Fiscal Year" ? (
            <TextInput
              radius="xl"
              size="xs"
              type="text"
              value={filters.from_fiscal_year}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setFilters((f) => ({
                  ...f,
                  from_fiscal_year: v,
                  to_fiscal_year: v,
                }));
              }}
              onBlur={() => handleFieldBlur("from_fiscal_year")}
              placeholder="2026-2027"
              disabled
              w={104}
            />
          ) : (
            <>
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
                  size="xs"
                  placeholder="From Date"
               value={filters.from_date ? new Date(filters.from_date) : null}
                  onChange={(value) =>
                    setFilters((f) => ({
                      ...f,
                      from_date: value ? dayjs(value).format("YYYY-MM-DD") : "",
                    }))
                  }
                  onBlur={() => handleFieldBlur("from_date")}
                  valueFormat="DD-MMM-YYYY"
                  w={132}
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
                  size="xs"
                  placeholder="To Date"
                value={filters.to_date ? new Date(filters.to_date) : null}
                  onChange={(value) =>
                    setFilters((f) => ({
                      ...f,
                      to_date: value ? dayjs(value).format("YYYY-MM-DD") : "",
                    }))
                  }
                  onBlur={() => handleFieldBlur("to_date")}
                  valueFormat="DD-MMM-YYYY"
                  w={132}
                  clearable
                />
              </Group>
            </>
          )}

          <Group gap="xs" ml="auto" wrap="nowrap">
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
              onClick={handleToggleExpand}
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
                  className={isLoading ? "animate-spin" : ""}
                />
              }
              onClick={handleRefresh}
              style={{
                background: theme.other?.brandGradient,
                boxShadow: theme.other?.brandGlowShadowSm,
              }}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data table — rounded-row / sticky-header language matching JournalEntries */}
      <Paper
        radius="lg"
        p="sm"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Box
          style={{
            maxHeight: "calc(100vh - 320px)",
            minHeight: 280,
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <Table
            verticalSpacing="xs"
            horizontalSpacing="sm"
            fz="xs"
            w="100%"
            style={{
              borderCollapse: "separate",
              borderSpacing: "0 6px",
              tableLayout: "fixed",
              minWidth: "100%",
            }}
          >
            <Table.Thead>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => {
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
                        className="pl-thead-cell"
                        style={{
                          width: header.getSize(),
                          textAlign: align,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--mantine-color-slate-5)",
                          whiteSpace: "nowrap",
                          padding: "0 10px 6px",
                          border: "none",
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
              ))}
            </Table.Thead>
            <Table.Tbody>
              {isLoading && !data ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={columns.length}
                    style={{ border: "none" }}
                    py={64}
                  >
                    <Group justify="center">
                      <Loader size="sm" color="brand" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={columns.length}
                    style={{ border: "none" }}
                    py={64}
                    ta="center"
                  >
                    <Text fz="xs" c="slate.4">
                      No Profit &amp; Loss data.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr key={row.id} className="pl-row">
                    {row.getVisibleCells().map((cell, idx) => {
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
                            padding: "8px 10px",
                            border: "none",
                            boxShadow: "var(--mantine-shadow-xs)",
                            borderTopLeftRadius:
                              idx === 0
                                ? "var(--mantine-radius-md)"
                                : undefined,
                            borderBottomLeftRadius:
                              idx === 0
                                ? "var(--mantine-radius-md)"
                                : undefined,
                            borderTopRightRadius:
                              idx === row.getVisibleCells().length - 1
                                ? "var(--mantine-radius-md)"
                                : undefined,
                            borderBottomRightRadius:
                              idx === row.getVisibleCells().length - 1
                                ? "var(--mantine-radius-md)"
                                : undefined,
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
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
