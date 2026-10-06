import { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Group,
  Paper,
  Table,
  Badge,
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
  IconCircleDot,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
 import { InvestorModal } from "./InvestorModal";
import {
  PRODUCTS,
  type FundedInvestment,
} from "./InvestorModalShared";
import { FilterMultiSelect } from "../../shared/FilterMultiSelect";

/* ----------------------------- Mock data ----------------------------- */
// Values taken from the screenshot. Replace with API data later.
interface InvestmentRow {
  id: string;
  investmentNo: string;
  customer: string;
  product: string;
  amount: number;
  rate: number;
  startDate: string; // ISO date
  status: string;
}

const MOCK_INVESTMENTS: InvestmentRow[] = [
  {
    id: "INV-2026-0004",
    investmentNo: "INV-2026-0004",
    customer: "John Doe",
    product: "Steady Income NCD",
    amount: 50000,
    rate: 10.5,
    startDate: "2026-10-05",
    status: "Active",
  },
  {
    id: "INV-2026-0003",
    investmentNo: "INV-2026-0003",
    customer: "John Doe",
    product: "Steady Income NCD",
    amount: 200000,
    rate: 10.5,
    startDate: "2026-08-01",
    status: "Active",
  },
  {
    id: "INV-2026-0002",
    investmentNo: "INV-2026-0002",
    customer: "Abhishek",
    product: "Growth NCD",
    amount: 500000,
    rate: 12.5,
    startDate: "2026-07-01",
    status: "Active",
  },
  {
    id: "INV-2026-0001",
    investmentNo: "INV-2026-0001",
    customer: "Arjun Mehta",
    product: "Quarterly Yield NCD",
    amount: 100000,
    rate: 11.75,
    startDate: "2026-06-10",
    status: "Redeemed",
  },
];

/* ------------------------------ Constants ----------------------------- */
const STATUS_META: Record<string, { label: string; color: string }> = {
  Active: { label: "Active", color: "brand" },
  Redeemed: { label: "Redeemed", color: "success" },
  Renewed: { label: "Renewed", color: "success" },
};

const columnHelper = createColumnHelper<InvestmentRow>();

/* ------------------------------ Helpers ------------------------------- */
function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${color}-2)`,
        },
      }}
    >
      {label}
    </Badge>
  );
}

const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const fmtAmount = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/* ------------------------------ Component ----------------------------- */
export function Investments() {
  const theme = useMantineTheme();

  const [investments, setInvestments] = useState<InvestmentRow[]>(MOCK_INVESTMENTS);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const openModal = () => {
    setModalKey((k) => k + 1); // fresh modal state on every open
    setModalOpened(true);
  };

  const handleFunded = (p: FundedInvestment) =>
    setInvestments((prev) => [
      {
        id: p.investmentNo,
        investmentNo: p.investmentNo,
        customer: p.customer,
        product: p.product,
        amount: p.amount,
        rate: p.rate,
        startDate: p.startDate,
        status: p.status,
      },
      ...prev,
    ]);

  const handleCompleted = (investmentNo: string, status: "Redeemed" | "Renewed") =>
    setInvestments((prev) =>
      prev.map((r) => (r.investmentNo === investmentNo ? { ...r, status } : r)),
    );

  const [searchInput, setSearchInput] = useState("");
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState([{ id: "investmentNo", desc: true }]);

  const productOptions = useMemo(
    () => PRODUCTS.map((p) => ({ value: p.name, label: p.name })),
    [],
  );

  const statusOptions = useMemo(
    () =>
      Object.keys(STATUS_META).map((s) => ({ value: s, label: s })),
    [],
  );

  const filteredData = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return investments.filter((row) => {
      const matchesSearch =
        !q ||
        row.investmentNo.toLowerCase().includes(q) ||
        row.customer.toLowerCase().includes(q);
      const matchesProduct =
        productFilter.length === 0 || productFilter.includes(row.product);
      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(row.status);
      return matchesSearch && matchesProduct && matchesStatus;
    });
  }, [investments, searchInput, productFilter, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("investmentNo", {
        header: "Investment No.",
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
      columnHelper.accessor("customer", {
        header: "Customer",
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("product", {
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
      columnHelper.accessor("amount", {
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
            {fmtAmount(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("rate", {
        header: "Rate",
        cell: (info) => (
          <Text fz="xs" c="slate.6" ta="right">
            {`${info.getValue()}%`}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("startDate", {
        header: "Start",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || {
            label: info.getValue(),
            color: "gray",
          };
          return <StatusBadge label={meta.label} color={meta.color} />;
        },
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
    setProductFilter([]);
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
            <IconCircleDot
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Investments
            </Title>
            <Text fz="sm" c="slate.5">
              Manage investor deposits and bookings
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
            placeholder="Investment No. / Customer"
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

          <FilterMultiSelect
            placeholder="All Statuses"
            data={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
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
            Add Investment
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
                    const rightAligned =
                      header.id === "amount" || header.id === "rate";
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
                        No investments match your filters.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => {
                  const rowMeta = STATUS_META[row.original.status] || {
                    label: row.original.status,
                    color: "gray",
                  };
                  return (
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
                                ? `3px solid var(--mantine-color-${rowMeta.color}-4)`
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
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      <InvestorModal
        key={modalKey}
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        existingCount={investments.length}
        onFunded={handleFunded}
        onCompleted={handleCompleted}
      />
    </Stack>
  );
}