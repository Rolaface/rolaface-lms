import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Affix,
  Box,
  Button,
  TextInput,
  Group,
  Menu,
  Paper,
  Table,
  Badge,
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
  IconCircleDot,
  IconDotsVertical,
  IconTrash,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { FilterMultiSelect } from "../../components/shared/FilterMultiSelect";
import { openCommonModal } from "../../components/Modal/AlertModal";
import {
  CUSTOMERS,
  PRODUCTS,
  buildNumber,
  calcSchedule,
   createInitialState,   // added
  productPatch, 
  toIso,
  type ModalState,
} from "../../components/Modal/Investor/InvestorModalShared";
import {
  InvestorModal,
  ProcessingReadOnlyView,
} from "../../components/Modal/Investor/InvestorModal";
import {
  ReceivePaymentModal,
  type ReceivePaymentValues,
} from "../../components/Modal/Investor/ReceivePaymentModal";
import { EarningsStatementsModal } from "../../components/Modal/Investor/EarningsStatementModal";
import { MaturityModal } from "../../components/Modal/Investor/MaturityModal";

interface InvestmentRow {
  id: string;
  investmentNo: string;
  customer: string;
  product: string;
  amount: number;
  rate: number;
  startDate: string; 
  status: string;
  state?: ModalState;
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
    status: "Approved",
  },
  {
    id: "INV-2026-0003",
    investmentNo: "INV-2026-0003",
    customer: "John Doe",
    product: "Steady Income NCD",
    amount: 200000,
    rate: 10.5,
    startDate: "2026-08-01",
    status: "Approved",
  },
  {
    id: "INV-2026-0002",
    investmentNo: "INV-2026-0002",
    customer: "Abhishek",
    product: "Growth NCD",
    amount: 500000,
    rate: 12.5,
    startDate: "2026-07-01",
    status: "Approved",
  },
  {
    id: "INV-2026-0001",
    investmentNo: "INV-2026-0001",
    customer: "Arjun Mehta",
    product: "Quarterly Yield NCD",
    amount: 100000,
    rate: 11.75,
    startDate: "2026-06-10",
    status: "Received",
  },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  Draft: { label: "Draft", color: "slate" },
  Approved: { label: "Approved", color: "warning" },
  Received: { label: "Received", color: "info" },
  Cancelled: { label: "Cancelled", color: "danger" },
};

const columnHelper = createColumnHelper<InvestmentRow>();

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

export function Investor() {
  const theme = useMantineTheme();

  const [searchInput, setSearchInput] = useState("");
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState([{ id: "investmentNo", desc: true }]);
  const [investments, setInvestments] = useState<InvestmentRow[]>(MOCK_INVESTMENTS);

  /* ------------------------- New investment ------------------------- */
  const [modalOpened, setModalOpened] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const openModal = () => {
    setModalKey((k) => k + 1); // fresh modal state on every open
    setModalOpened(true);
  };

  /* ------------------------------ Toast ----------------------------- */
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  /* -------------------- Row the user is acting on ------------------- */
  const [activeId, setActiveId] = useState<string | null>(null);
  const [paymentOpened, setPaymentOpened] = useState(false);
  /** Earnings & Statements / Maturity modal for the active row. */
  const [stageOpened, setStageOpened] = useState(false);

  const active = investments.find((r) => r.id === activeId) ?? null;
  const activeState = active?.state ?? null;
  const activeSchedule = activeState ? calcSchedule(activeState) : null;

  /** Same "patch the state" contract the tabs use, applied to the active row. */
  const updateActive = (patch: Partial<ModalState>) =>
    setInvestments((prev) =>
      prev.map((r) =>
        r.id === activeId && r.state ? { ...r, state: { ...r.state, ...patch } } : r,
      ),
    );

  /* 1. Submit on Contract Generation -> Draft */
  const handleSubmitted = (state: ModalState) => {
    setInvestments((prev) => [
      {
        id: `ROW-${Date.now()}`,
        investmentNo: "",
        customer: CUSTOMERS[state.customerIndex].name,
        product: PRODUCTS[state.productIndex].name,
        amount: state.amount,
        rate: state.rate,
        startDate: "",
        status: "Draft",
        state,
      },
      ...prev,
    ]);
    setModalOpened(false);
    showToast("Investment saved as Draft");
  };

  /* 2. Approve (Draft) -> Approved */
  const confirmApprove = (row: InvestmentRow) => {
    openCommonModal({
      heading: "Approve Investment",
      subtitle: "Please confirm this action before continuing.",
      body: (
        <>
          Are you sure you want to approve the investment of{" "}
          <Text span fw={600}>
            {fmtAmount(row.amount)}
          </Text>{" "}
          for{" "}
          <Text span fw={600}>
            {row.customer}
          </Text>
          ?
        </>
      ),
      color: "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Approve",
          color: "green",
          onClick: () => {
            // TODO(API): call the approve / status-change API here.
            // For now the status is changed locally.
            setInvestments((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: "Approved" } : r)),
            );
          },
        },
      ],
    });
  };

const openReceivePayment = (row: InvestmentRow) => {
   if (!row.state) {
    const customerIndex = CUSTOMERS.findIndex((c) => c.name === row.customer);
    const productIndex = PRODUCTS.findIndex((p) => p.name === row.product);
    setInvestments((prev) =>
      prev.map((r) =>
        r.id === row.id && !r.state
          ? {
              ...r,
              state: {
                ...createInitialState(),
                ...productPatch(productIndex),
                customerIndex,
                productIndex,
                amount: r.amount,
                rate: r.rate,
                contractStatus: "Executed",
                contractNo: buildNumber("CON", prev.length - 1),
                step: 2,
              },
            }
          : r,
      ),
    );
  }
  setActiveId(row.id);
  setPaymentOpened(true);
};

  const handleReceivePayment = ({ paymentMode, utr }: ReceivePaymentValues) => {
    if (!activeState) return;

    const startDate = new Date();
    const investmentNo = buildNumber(
      "INV",
      investments.filter((r) => r.investmentNo).length,
    );

    setInvestments((prev) =>
      prev.map((r) =>
        r.id === activeId && r.state
          ? {
              ...r,
              investmentNo,
              startDate: toIso(startDate),
              status: "Received",
              state: {
                ...r.state,
                paymentMode,
                utr,
                funded: true,
                startDate,
                investmentNo,
                step: 4, // Earnings & Statements
              },
            }
          : r,
      ),
    );
    setPaymentOpened(false);
    showToast("Payment received for " + investmentNo);
    setStageOpened(true); // only now the Earnings & Statements modal opens
  };

  /* 4. Cancel (Approved) -> Cancelled */
  const confirmCancel = (row: InvestmentRow) => {
    openCommonModal({
      heading: "Cancel Investment",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to cancel the investment of{" "}
          <Text span fw={600}>
            {fmtAmount(row.amount)}
          </Text>{" "}
          for{" "}
          <Text span fw={600}>
            {row.customer}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Back", variant: "default" },
        {
          label: "Cancel Investment",
          color: "red",
          onClick: () => {
            // TODO(API): call the cancel / status-change API here.
            // For now the status is changed locally.
            setInvestments((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: "Cancelled" } : r)),
            );
            showToast("Investment cancelled");
          },
        },
      ],
    });
  };

  /* 5. Delete (Draft only) */
  const confirmDelete = (row: InvestmentRow) => {
    openCommonModal({
      heading: "Delete Investment",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete the investment of{" "}
          <Text span fw={600}>
            {fmtAmount(row.amount)}
          </Text>{" "}
          for{" "}
          <Text span fw={600}>
            {row.customer}
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
            // TODO(API): call the delete API here.
            // For now the row is removed locally.
            setInvestments((prev) => prev.filter((r) => r.id !== row.id));
            showToast("Investment deleted");
          },
        },
      ],
    });
  };

  /* 6. View / Edit — what these open has not been defined yet */
  const handleViewInvestment = (_row: InvestmentRow) => {
    // TODO: decide what the View (eye) button opens.
  };

  const handleEditInvestment = (_row: InvestmentRow) => {
    // TODO: decide what the Edit (pencil) button opens (Draft rows only).
  };

  /* 7. Earnings & Statements / Maturity (only for Received rows) */
  const openStage = (row: InvestmentRow) => {
    setActiveId(row.id);
    setStageOpened(true);
  };

  const handleComplete = () => {
    if (!activeState || !activeState.decision) return;
    // Status stays "Received": only Draft / Approved / Received / Cancelled exist.
    setInvestments((prev) =>
      prev.map((r) =>
        r.id === activeId && r.state
          ? { ...r, state: { ...r.state, completed: true } }
          : r,
      ),
    );
    showToast("Workflow completed for " + activeState.investmentNo);
    closeTimer.current = window.setTimeout(() => setStageOpened(false), 900);
  };

  /* ------------------------------ Table ----------------------------- */
  const productOptions = useMemo(
    () => PRODUCTS.map((p) => ({ value: p.name, label: p.name })),
    [],
  );

  const statusOptions = useMemo(
    () => Object.keys(STATUS_META).map((s) => ({ value: s, label: s })),
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
            c={info.getValue() ? "slate.8" : "slate.5"}
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            {info.getValue() || "Pending"}
          </Text>
        ),
        // Rows without a number yet count as the newest, so with the default
        // (descending) sort a new Draft shows at the top of the list.
        sortingFn: (a, b, columnId) => {
          const x = a.getValue<string>(columnId) || "\uffff";
          const y = b.getValue<string>(columnId) || "\uffff";
          return x < y ? -1 : x > y ? 1 : 0;
        },
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
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isDraft = row.status === "Draft";
          const isApproved = row.status === "Approved";
          const isReceived = row.status === "Received";
          const hasActions = isDraft || isApproved || (!!row.state && isReceived);

          return (
            <Group justify="flex-end" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={() => handleViewInvestment(row)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={isDraft ? "Edit" : "Only Drafts can be edited"}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? "brand" : "slate"}
                  radius="md"
                  disabled={!isDraft}
                  onClick={() => handleEditInvestment(row)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={isDraft ? "Delete" : "Only Drafts can be deleted"}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? "danger" : "slate"}
                  radius="md"
                  disabled={!isDraft}
                  onClick={() => confirmDelete(row)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>

              <Menu
                shadow="md"
                width={190}
                position="bottom-end"
                radius="md"
                disabled={!hasActions}
              >
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    disabled={!hasActions}
                    aria-label="Actions"
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  {isDraft && (
                    <Menu.Item onClick={() => confirmApprove(row)}>Approve</Menu.Item>
                  )}
                  {isApproved && (
                    <Menu.Item onClick={() => openReceivePayment(row)}>
                      Receive Payment
                    </Menu.Item>
                  )}
                  {isApproved && (
                    <Menu.Item color="danger" onClick={() => confirmCancel(row)}>
                      Cancel
                    </Menu.Item>
                  )}
                  {isReceived && (
                    <Menu.Item onClick={() => openStage(row)}>
                      {row.state && row.state.step >= 5
                        ? "Maturity"
                        : "Earnings & Statements"}
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
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
                      header.id === "amount" ||
                      header.id === "rate" ||
                      header.id === "actions";
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
        onSubmitted={handleSubmitted}
      />

      {activeState && (
        <>
          {/* Receive Payment (Approved rows) */}
          <ReceivePaymentModal
            key={`pay-${activeId}`}
            opened={paymentOpened}
            onClose={() => setPaymentOpened(false)}
            state={activeState}
            onSubmit={handleReceivePayment}
          />

          {/* Earnings & Statements — opens only after the payment is received */}
          <EarningsStatementsModal
            key={`earn-${activeId}`}
            opened={stageOpened && activeState.funded && activeState.step === 4}
            onClose={() => setStageOpened(false)}
            state={activeState}
            update={updateActive}
            schedule={activeSchedule}
            onToast={showToast}
            processingView={
              <ProcessingReadOnlyView
                state={activeState}
                schedule={activeSchedule}
                existingCount={investments.length}
              />
            }
            onSubmit={() => updateActive({ step: 5 })}
          />

          {/* Maturity — opens when Earnings & Statements is submitted */}
          <MaturityModal
            key={`mat-${activeId}`}
            opened={stageOpened && activeState.funded && activeState.step === 5}
            onClose={() => setStageOpened(false)}
            state={activeState}
            update={updateActive}
            schedule={activeSchedule}
            onToast={showToast}
            processingView={
              <ProcessingReadOnlyView
                state={activeState}
                schedule={activeSchedule}
                existingCount={investments.length}
              />
            }
            onComplete={handleComplete}
          />
        </>
      )}

      {toast && (
        <Affix position={{ bottom: 20, left: 0, right: 0 }} zIndex={1000}>
          <Box style={{ display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <Paper
              radius="md"
              px={18}
              py={10}
              fw={600}
              style={{
                background: "var(--mantine-color-success-6)",
                color: "var(--mantine-color-white)",
              }}
            >
              {toast}
            </Paper>
          </Box>
        </Affix>
      )}
    </Stack>
  );
}