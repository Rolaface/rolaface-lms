import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  TextInput,
  Group,
  Loader,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  Switch,
  Table,
  Text,
  Title,
  Tooltip,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileText,
  IconPackage,
  IconTrash,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllInvestmentProduct,
  enableInvestmentProduct,
  disableInvestmentProduct,
  deleteInvestmentProduct,
} from "../../../api/Investor/productApi";
import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { PAYOUT_FREQUENCIES } from "../../../components/Modal/Investor/Product/InvestmentProductModal";
import { investmentProductModal } from "../../../components/Modal/Investor/Product/investmentProductModalStore";
import { formatAmount, useCurrencyReady } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

interface ProductRow {
  id: string;
  name: string;
  code: string;
  rate: number;
  tenureMonths: number;
  frequency: string;
  minRate: number;
  maxRate: number;
  minAmount: number;
  maxAmount: number;
  minTenure: number;
  maxTenure: number;
  active: boolean;
}

const columnHelper = createColumnHelper<ProductRow>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ active }: { active: boolean }) {
  const scale = active ? "success" : "danger";
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
      {active ? "ACTIVE" : "INACTIVE"}
    </Badge>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

const RIGHT_ALIGNED = [
  "rate",
  "tenureMonths",
  "rateRange",
  "amountRange",
  "tenureRange",
  "actions",
];

function statusToDisabledParam(status: string): 0 | 1 | undefined {
  if (status === "active") return 0;
  if (status === "disabled") return 1;
  return undefined;
}

/* ------------------------------ Component ----------------------------- */
export function InvestmentProduct() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [frequencyFilter, setFrequencyFilter] = useState<string[]>([]);
  const [status, setStatus] = useState("all");

  const disabledParam = statusToDisabledParam(status);

  // table state
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, disabledParam, frequencyFilter]);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "investmentProducts",
      debouncedSearch,
      disabledParam,
      frequencyFilter,
      page,
      pageSize,
    ],
    queryFn: () => getAllInvestmentProduct(),
    placeholderData: (prev) => prev,
  });

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const { mutate: enableItem, isPending: isEnabling } = useMutation({
    mutationFn: (id: string) => enableInvestmentProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentProducts"] });
      showSuccess(
        "Product Activated",
        "Product has been marked active successfully.",
      );
    },
    onError: (error: any) => showError("Status Update Failed", error),
  });

  const { mutate: disableItem, isPending: isDisabling } = useMutation({
    mutationFn: (id: string) => disableInvestmentProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentProducts"] });
      showSuccess(
        "Product Marked Inactive",
        "Product has been marked inactive successfully.",
      );
    },
    onError: (error: any) => showError("Status Update Failed", error),
  });

  const { mutate: removeItem, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteInvestmentProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investmentProducts"] });
      showSuccess("Product Deleted", "Product deleted successfully.");
    },
    onError: (error: any) => showError("Delete Failed", error),
  });

  const handleDelete = (row: ProductRow) => {
    openCommonModal({
      heading: "Delete Product",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete product{" "}
          <Text span fw={600}>
            {row.name}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: () => {
            removeItem(row.id);
          },
        },
      ],
    });
  };

  const handleToggleStatus = (row: ProductRow) => {
    const willDeactivate = row.active;
    openCommonModal({
      heading: willDeactivate ? "Mark as Inactive" : "Mark as Active",
      subtitle: "Please confirm this action before continuing.",
      body: (
        <>
          Are you sure you want to mark product{" "}
          <Text span fw={600}>
            {row.name}
          </Text>{" "}
          as {willDeactivate ? "inactive" : "active"}?
        </>
      ),
      color: willDeactivate ? "red" : "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: willDeactivate ? "Inactive" : "Active",
          color: willDeactivate ? "red" : "green",
          onClick: () => {
            if (willDeactivate) {
              disableItem(row.id);
            } else {
              enableItem(row.id);
            }
          },
        },
      ],
    });
  };

  const handleView = (row: ProductRow) => {
    investmentProductModal.open({ editId: row.id, isView: true });
  };

  const data = useMemo<ProductRow[]>(() => {
    const list =
      productsResponse?.data ||
      productsResponse?.message?.data ||
      productsResponse ||
      [];
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      id: item.name,
      name: item.product_name,
      code: item.product_code || "",
      rate: Number(item.default_interest_rate) || 0,
      tenureMonths: Number(item.default_tenure) || 0,
      frequency: item.payout_frequency,
      minRate: Number(item.min_interest_rate) || 0,
      maxRate: Number(item.maximum_interest_rate) || 0,
      minAmount: Number(item.minimum_investment) || 0,
      maxAmount: Number(item.maximum_investment) || 0,
      minTenure: Number(item.minimum_tenure) || 0,
      maxTenure: Number(item.maximum_tenure) || 0,
      active: item.disabled !== 1,
    }));
  }, [productsResponse]);

  const frequencyOptions = useMemo(
    () => PAYOUT_FREQUENCIES.map((f) => ({ value: f, label: f })),
    [],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Product",
        cell: (info) => (
          <Box>
            <Text fz="sm" fw={700} c="slate.8">
              {info.getValue()}
            </Text>
            <Text fz={11} c="slate.5" ff="monospace">
              {info.row.original.code || "-"}
            </Text>
          </Box>
        ),
      }),
      columnHelper.accessor("rate", {
        header: "Default Rate",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right">
            {`${info.getValue()}% p.a.`}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("tenureMonths", {
        header: "Default Tenure",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right">
            {`${info.getValue()} months`}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("frequency", {
        header: "Payout Frequency",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "rateRange",
        header: "Interest Range",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right">
            {`${info.row.original.minRate}% – ${info.row.original.maxRate}%`}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "amountRange",
        header: "Investment Range",
        cell: (info) => (
          <Text
            fz="xs"
            c="slate.6"
            ta="right"
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {formatAmount(companyCurrency, info.row.original.minAmount, {
              withSymbol: true,
            })}{" "}
            –{" "}
            {formatAmount(companyCurrency, info.row.original.maxAmount, {
              withSymbol: true,
            })}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "tenureRange",
        header: "Tenure Range",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right" style={{ whiteSpace: "nowrap" }}>
            {`${info.row.original.minTenure} – ${info.row.original.maxTenure} months`}
          </Text>
        ),
      }),
      columnHelper.accessor("active", {
        header: "Status",
        cell: (info) => <StatusBadge active={info.getValue()} />,
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
          const isTogglingStatus = isEnabling || isDisabling;
          return (
            <Group
              justify="flex-end"
              gap={4}
              wrap="nowrap"
              className="lms-row-actions"
            >
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(row);
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="brand"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    investmentProductModal.open({
                      editId: row.id,
                      isView: false,
                    });
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="danger"
                  radius="md"
                  loading={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row);
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={row.active ? "Inactive" : "Active"} withArrow>
                <Switch
                  size="xs"
                  color="success"
                  checked={row.active}
                  disabled={isTogglingStatus}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleToggleStatus(row)}
                />
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    [isDeleting, isEnabling, isDisabling],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = productsResponse?.pagination?.total ?? 0;
  const totalPages = productsResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearchInput("");
    setFrequencyFilter([]);
    setStatus("all");
    setPage(1);
  };

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
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
            <IconPackage
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Investment Products
            </Title>
            <Text fz="sm" c="slate.5">
              Defaults new investments start with, and the limits they must stay
              within
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
            placeholder="Product name or code"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />

          <FilterMultiSelect
            placeholder="All Frequencies"
            data={frequencyOptions}
            value={frequencyFilter}
            onChange={setFrequencyFilter}
            width={150}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={setStatus}
            style={{ flexShrink: 0 }}
            data={[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "disabled" },
            ]}
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

          <Button
            size="sm"
            radius="xl"
            color="brand"
            px="sm"
            style={{
              flexShrink: 0,
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
            leftSection={<IconPlus size={14} />}
            onClick={() =>
              investmentProductModal.open({ editId: null, isView: false })
            }
          >
            Add Product
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
                height: "clamp(320px, calc(100vh - 280px), 720px)",
                overflowY: "auto",
                overflowX: "auto",
                opacity: isFetching ? 0.6 : 1,
                transition: "opacity 120ms ease",
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
                            <IconFileText
                              size={24}
                              color="var(--mantine-color-slate-4)"
                            />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No products match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => (
                      <Table.Tr
                        key={row.id}
                        className="lms-row"
                        onDoubleClick={() => handleView(row.original)}
                        style={{ cursor: "pointer" }}
                      >
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
                                      row.original.active ? "success" : "danger"
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
