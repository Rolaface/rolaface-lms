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
  IconFileText,
  IconEye,
  IconPencil,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { FilterMultiSelect } from "../../components/shared/FilterMultiSelect";
import { getInvestorEarnings } from "../../api/Investor/investorFlowApi";
import { getEveryInvestmentProduct } from "../../api/Investor/productApi";
import type { InvestorEarningListItem } from "../../types/Investor/investorFlow";
import { formatAmount } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { EarningsStatementsModal } from "../../components/Modal/Investor/EarningsStatementModal";

const columnHelper = createColumnHelper<InvestorEarningListItem>();

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

const RIGHT_ALIGNED = ["amount_invested", "rate_of_interest", "actions"];

export function EarningsStatements() {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, productFilter]);

  /* ------------------------------- Data ------------------------------- */
  const { data: earningsResponse, isLoading, isFetching } = useQuery({
    queryKey: ["investorEarnings", debouncedSearch, productFilter, page, pageSize],
    queryFn: () =>
      getInvestorEarnings({
        search: debouncedSearch.trim() || undefined,
        investment_product: productFilter,
        page,
        page_size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["investmentProducts", "all"],
    queryFn: getEveryInvestmentProduct,
  });

  const earnings = earningsResponse?.data ?? [];
  const totalRows = earningsResponse?.pagination?.total ?? 0;
  const totalPages = earningsResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  /* ----------------------------- Modal ----------------------------- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const openModal = (id: string, readOnly: boolean) => {
    setSelectedId(id);
    setModalReadOnly(readOnly);
    setModalKey((k) => k + 1); // fresh modal state on every open
    setModalOpened(true);
  };

  /* ----------------------------- Table ----------------------------- */
  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.name, label: p.product_name })),
    [products],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Investment ID",
        cell: (info) => (
          <Text
            fz="sm"
            fw={700}
            c="slate.8"
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("investor", {
        header: "Customer",
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("investment_product_name", {
        header: "Product",
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color="brand"
            styles={{ root: { fontSize: 10, padding: "0 8px" } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("amount_invested", {
        header: "Amount",
        cell: (info) => (
          <Text
            fz="xs"
            c="slate.6"
            ta="right"
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmtAmount(Number(info.getValue()) || 0)}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("rate_of_interest", {
        header: "Rate",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right">
            {`${info.getValue()}%`}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("frequency", {
        header: "Frequency",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("first_repay_date", {
        header: "First Repay",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("mat_date", {
        header: "Maturity",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
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
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => openModal(row.name, true)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label={row.status === "Received" ? "Edit" : `${row.status}: view only`}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={row.status === "Received" ? "brand" : "slate"}
                  radius="md"
                  disabled={row.status !== "Received"}
                  onClick={() => openModal(row.name, false)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyCurrency],
  );

  const table = useReactTable({
    data: earnings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  const resetFilters = () => {
    setSearchInput("");
    setProductFilter([]);
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
            <IconFileText size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Earnings & Statements
            </Title>
            <Text fz="sm" c="slate.5">
              View and edit the earning schedule of received investments
            </Text>
          </Stack>
        </Group>
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
            placeholder="Investment ID / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />

          <FilterMultiSelect
            placeholder="All Products"
            data={productOptions}
            value={productFilter}
            onChange={setProductFilter}
            width={140}
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
                            <IconFileText size={24} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No received investments match your filters.
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
                                  ? "3px solid var(--mantine-color-info-4)"
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

      {selectedId && (
        <EarningsStatementsModal
          key={modalKey}
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          investorFlowId={selectedId}
          readOnly={modalReadOnly}
        />
      )}

    </Stack>
  );
}
