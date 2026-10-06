import { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Group,
  Paper,
  Table,
  Text,
  Title,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileText,
  IconPackage,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
 import {
  FREQUENCY_MONTHS,
  PRODUCTS,
  type ProductOption,
} from  "../../../components/Modal/Investor/InvestorModalShared";
import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import { InvestmentProductModal } from "../../../components/Modal/Investor/Product/InvestmentProductModal";

/* ----------------------------- Mock data ----------------------------- */
// Starts from the products already used in the investor flow. Replace with API data later.
const columnHelper = createColumnHelper<ProductOption>();

/* ------------------------------ Helpers ------------------------------- */
function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const fmtAmount = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const RIGHT_ALIGNED = ["rate", "tenureMonths", "minAmount"];

/* ------------------------------ Component ----------------------------- */
export function InvestmentProduct() {
  const theme = useMantineTheme();

  const [products, setProducts] = useState<ProductOption[]>(PRODUCTS);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

  const openModal = () => {
    setModalKey((k) => k + 1); // fresh form on every open
    setModalOpened(true);
  };

  const handleSave = (product: ProductOption) =>
    setProducts((prev) => [product, ...prev]);

  const frequencyOptions = useMemo(
    () => Object.keys(FREQUENCY_MONTHS).map((f) => ({ value: f, label: f })),
    [],
  );

  const filteredData = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return products.filter((row) => {
      const matchesSearch = !q || row.name.toLowerCase().includes(q);
      const matchesFrequency =
        frequencyFilter.length === 0 || frequencyFilter.includes(row.frequency);
      return matchesSearch && matchesFrequency;
    });
  }, [products, searchInput, frequencyFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Product Name",
        cell: (info) => (
          <Text fz="sm" fw={700} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("rate", {
        header: "Interest Rate",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right">
            {`${info.getValue()}% p.a.`}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("tenureMonths", {
        header: "Tenure",
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
      columnHelper.accessor("minAmount", {
        header: "Minimum Investment",
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
            {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  const resetFilters = () => {
    setSearchInput("");
    setFrequencyFilter([]);
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
            <IconPackage size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Investment Products
            </Title>
            <Text fz="sm" c="slate.5">
              Define the rate, tenure and payout
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
            placeholder="Product name"
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
            onClick={openModal}
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
        <Box
          style={{
            height: "clamp(320px, calc(100vh - 280px), 720px)",
            overflowY: "auto",
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
                              ? "3px solid var(--mantine-color-brand-4)"
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
      </Paper>

      <InvestmentProductModal
        key={modalKey}
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSave={handleSave}
      />
    </Stack>
  );
}