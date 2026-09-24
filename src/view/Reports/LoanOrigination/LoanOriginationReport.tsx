import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";

import { DatePickerInput } from "@mantine/dates";
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconEye,
  IconFileText,
  IconFilter,
  IconRefresh,
  IconSearch,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";

import {
  getAllLoanApplications,
} from "../../../api/loanApplicationApi";
import type { LoanApplicationRow } from "../../Origination/LoanApplication";
import { loanApplicationModal } from "../../../components/Modal/LoanApplication/loanApplicationModalStore";

type ReportRow = LoanApplicationRow & {
  loan_product?: string | null;
};

type ApiObject = Record<string, unknown>;

const PAGE_SIZES = ["10", "20", "50"];
const REVIEW_STATUSES = new Set([
  "Pending",
  "Under Review",
  "Ready for Approval",
  "Additional Information Required",
]);

const STATUS_COLOR: Record<string, string> = {
  Pending: "warning",
  Approved: "info",
  Created: "success",
  Rejected: "danger",
  "Under Review": "grape",
  "Ready for Approval": "info",
  "Additional Information Required": "orange",
  Rejection: "danger",
};

function displayStatus(status: string) {
  if (status === "Cancelled") return "Rejected";
  if (status === "Submitted") return "Approved";
  return status;
}

function asObject(value: unknown): ApiObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiObject)
    : null;
}

function normalizeRows(payload: unknown): ReportRow[] {
  if (Array.isArray(payload)) {
    return payload.filter(Boolean) as ReportRow[];
  }

  const root = asObject(payload);
  if (!root) return [];

  const candidates = [
    root.data,
    root.results,
    root.items,
    root.message,
    root.applications,
    root.loan_applications,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(Boolean) as ReportRow[];

    const nested = asObject(candidate);
    if (!nested) continue;

    for (const key of ["data", "results", "items"]) {
      if (Array.isArray(nested[key])) {
        return nested[key].filter(Boolean) as ReportRow[];
      }
    }
  }

  return [];
}

function effectiveStatus(row: ReportRow) {
  const raw =
    row.workflow_state ||
    row.status ||
    row.loan_application_status ||
    "Unknown";

  return displayStatus(raw);
}

function applicantName(row: ReportRow) {
  if (row.application_type === "Business Loan") {
    return row.company_name || "—";
  }

  const fullName = [row.first_name, row.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "—";
}

function productName(row: ReportRow) {
  return row.loan_product || "—";
}

function datePart(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDate(value?: string | null) {
  const raw = datePart(value);
  if (!raw) return "—";

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "ZMW",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function sortIcon(sorted: false | "asc" | "desc") {
  if (sorted === "asc") return <IconChevronUp size={12} />;
  if (sorted === "desc") return <IconChevronDown size={12} />;

  return (
    <IconSelector
      size={12}
      color="var(--mantine-color-slate-4)"
      style={{ opacity: 0.5 }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "slate";

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
          letterSpacing: 0.15,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${color}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{
            borderRadius: "50%",
            background: `var(--mantine-color-${color}-6)`,
          }}
        />
      }
    >
      {status}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      style={{ borderColor: "var(--mantine-color-slate-2)" }}
    >
      <Stack gap={4}>
        <Text fz={11} fw={700} c="slate.5" tt="uppercase" lts={0.4}>
          {label}
        </Text>
        <Text fz={22} fw={800} c="slate.8" lh={1.15}>
          {value}
        </Text>
        {hint && (
          <Text fz={11} c="slate.5">
            {hint}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

const columnHelper = createColumnHelper<ReportRow>();

function downloadCsv(rows: ReportRow[]) {
  const headers = [
    "Application ID",
    "Applicant",
    "Application Type",
    "Loan Product",
    "Requested Amount",
    "Status",
    "Application Date",
  ];

  const values = rows.map((row) => [
    row.name,
    applicantName(row),
    row.application_type || "",
    productName(row),
    row.amount ?? 0,
    effectiveStatus(row),
    datePart(row.application_date),
  ]);

  const csv = [headers, ...values]
    .map((line) =>
      line
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `loan-origination-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function LoanOriginationReport() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "applicationDate", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });



  const applicationsQuery = useQuery({
    queryKey: ["loan-origination-report"],
    queryFn: getAllLoanApplications,
  });

  const rows = useMemo(
    () => normalizeRows(applicationsQuery.data),
    [applicationsQuery.data],
  );

  const productOptions = useMemo(
    () =>
      [...new Set(rows.map(productName).filter((value) => value !== "—"))]
        .sort()
        .map((value) => ({ label: value, value })),
    [rows],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.application_type).filter(Boolean))]
        .sort()
        .map((value) => ({ label: value, value })),
    [rows],
  );

  const statusOptions = [
    { value: "Under Review", label: "Under Review" },
    { value: "Ready for Approval", label: "Ready for Approval" },
    {
      value: "Additional Information Required",
      label: "Additional Information Required",
    },
    { value: "Rejection", label: "Rejection" },
  ];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const rowStatus = effectiveStatus(row);
      const rowProduct = productName(row);
      const rowApplicant = applicantName(row).toLowerCase();
      const rowId = row.name.toLowerCase();

      const matchesSearch =
        !query ||
        rowId.includes(query) ||
        rowApplicant.includes(query) ||
        rowProduct.toLowerCase().includes(query);

      const matchesStatus = !status || rowStatus === status;
      const matchesProduct = !product || rowProduct === product;
      const matchesType = !type || row.application_type === type;

      const applicationDate = datePart(row.application_date);
      const matchesFromDate = !fromDate || applicationDate >= fromDate;
      const matchesToDate = !toDate || applicationDate <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProduct &&
        matchesType &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [rows, search, status, product, type, fromDate, toDate]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const review = filteredRows.filter((row) =>
      REVIEW_STATUSES.has(effectiveStatus(row)),
    ).length;
    const approved = filteredRows.filter(
      (row) => effectiveStatus(row) === "Approved",
    ).length;
    const disbursedAmount = filteredRows.reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0,
    );

    return {
      total,
      review,
      approved,
      disbursedAmount,
    };
  }, [filteredRows]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        id: "application",
        header: "Application",
        cell: ({ row }) => (
          <Group gap={8} wrap="nowrap">
            <Box
              w={30}
              h={30}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                background: "var(--mantine-color-brand-0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconFileText
                size={14}
                color="var(--mantine-color-brand-6)"
              />
            </Box>

            <Text
              fz={11}
              fw={700}
              c="slate.8"
              style={{
                fontFamily: "var(--mantine-font-family-monospace)",
                whiteSpace: "nowrap",
              }}
            >
              {row.original.name}
            </Text>
          </Group>
        ),
      }),

      columnHelper.display({
        id: "applicant",
        header: "Applicant",
        cell: ({ row }) => (
          <Text fz={12} fw={600} c="slate.7" lineClamp={1}>
            {applicantName(row.original)}
          </Text>
        ),
      }),

      columnHelper.display({
        id: "loanProduct",
        header: "Loan Product",
        cell: ({ row }) => (
          <Text fz={12} c="slate.7">
            {productName(row.original)}
          </Text>
        ),
      }),

      columnHelper.accessor("amount", {
        id: "amount",
        header: "Requested Amount",
        cell: ({ row }) => (
          <Text
            ta="right"
            fz={12}
            fw={700}
            c="slate.8"
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              whiteSpace: "nowrap",
            }}
          >
            {formatCurrency(Number(row.original.amount) || 0)}
          </Text>
        ),
      }),

      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={effectiveStatus(row.original)} />,
      }),

      columnHelper.accessor("application_date", {
        id: "applicationDate",
        header: "Application Date",
        cell: ({ row }) => (
          <Text fz={12} c="slate.6" style={{ whiteSpace: "nowrap" }}>
            {formatDate(row.original.application_date)}
          </Text>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Group justify="flex-end" gap={4}>
            <Tooltip label="View application">
              <ActionIcon
                variant="subtle"
                color="brand"
                size="sm"
                onClick={() =>
                  loanApplicationModal.open({
                    loanApplicationId: row.original.name,
                  })
                }
              >
                <IconEye size={15} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const clearFilters = () => {
    setSearch("");
    setStatus(null);
    setProduct(null);
    setType(null);
    setFromDate("");
    setToDate("");
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(product) ||
    Boolean(type) ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const setFilterAndResetPage = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const canExport = filteredRows.length > 0;
  const pageCount = table.getPageCount();
  const currentPage = pageCount === 0 ? 1 : pagination.pageIndex + 1;

  return (
    <Box
      mih="100%"
      p="lg"
      style={{
        background: "#F7F8FB",
        color: "var(--mantine-color-slate-8)",
      }}
    >
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap={3}>
            <Group gap={7} align="center">
              <IconFilter
                size={17}
                color="var(--mantine-color-brand-6)"
              />
              <Title order={3} c="slate.8" fw={700}>
                Loan Origination Report
              </Title>
            </Group>

            <Group gap={6}>
              <Text size="12.5px" c="dimmed">
                Lending Reports
              </Text>
              <Text size="12.5px" c="dimmed">
                ›
              </Text>
              <Text size="12.5px" c="dimmed" fw={500}>
                Loan Origination Report
              </Text>
            </Group>
          </Stack>

          <Group gap="sm">
            <Tooltip label="Refresh report">
              <ActionIcon
                variant="default"
                size="sm"
                radius="md"
                onClick={() => applicationsQuery.refetch()}
                loading={applicationsQuery.isFetching}
                aria-label="Refresh report"
              >
                <IconRefresh size={15} />
              </ActionIcon>
            </Tooltip>

            <Button
              size="sm"
              radius="md"
              variant="default"
              leftSection={<IconDownload size={15} />}
              disabled={!canExport}
              onClick={() => downloadCsv(filteredRows)}
            >
              Export CSV
            </Button>
          </Group>
        </Group>

        <Paper
          withBorder
          radius="lg"
          p="sm"
          style={{ borderColor: "var(--mantine-color-slate-2)" }}
        >
          <Stack gap="sm">
            <Group gap={7}>
              <IconFilter size={14} color="var(--mantine-color-brand-6)" />
              <Text fz={11} fw={700} c="brand.6" tt="uppercase" lts={0.4}>
                Filters
              </Text>

              {hasFilters && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-xs"
                  leftSection={<IconX size={12} />}
                  onClick={clearFilters}
                  style={{ marginLeft: "auto" }}
                >
                  Clear filters
                </Button>
              )}
            </Group>

            <Group align="end" gap="sm" wrap="nowrap">
              <TextInput
                className="lms-search"
                size="sm"
                radius="xl"
                label="Search"
                placeholder="Application, customer, product..."
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(event) =>
                  setFilterAndResetPage(
                    setSearch,
                    event.currentTarget.value,
                  )
                }
                // FIX: Explicitly set width to 20% and remove the flex stretch rules
                w="30%"
              />


              <Select
                size="sm"
                radius="xl"
                label="Status"
                placeholder="All statuses"
                clearable
                searchable
                data={statusOptions}
                value={status}
                onChange={(value) =>
                  setFilterAndResetPage(setStatus, value)
                }
                w={190}
              />

              <Select
                size="sm"
                radius="xl"
                label="Loan Product"
                placeholder="All products"
                clearable
                searchable
                data={productOptions}
                value={product}
                onChange={(value) =>
                  setFilterAndResetPage(setProduct, value)
                }
                w={210}
              />

              <Select
                size="sm"
                radius="xl"
                label="Product Type"
                placeholder="All types"
                clearable
                data={typeOptions}
                value={type}
                onChange={(value) =>
                  setFilterAndResetPage(setType, value)
                }
                w={190}
              />

              <DatePickerInput
                label="From Date"
                placeholder="DD-MMM-YYYY"
                value={fromDate ? new Date(fromDate) : null}
                valueFormat="DD-MMM-YYYY"
                onChange={(d) =>
                  setFromDate(d ? new Date(d).toISOString().split("T")[0] : "")
                }
                size="sm"
                radius="xl"
                w={150}
                clearable
              />

              <DatePickerInput
                label="To Date"
                placeholder="DD-MMM-YYYY"
                value={toDate ? new Date(toDate) : null}
                valueFormat="DD-MMM-YYYY"
                onChange={(d) =>
                  setToDate(d ? new Date(d).toISOString().split("T")[0] : "")
                }
                size="sm"
                radius="xl"
                w={150}
                clearable
              />

            </Group>
          </Stack>
        </Paper>

        <Box
          className="loan-origination-report-summary"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <SummaryCard
            label="Total Applications"
            value={formatNumber(summary.total)}
            hint="Matching current filters"
          />
          <SummaryCard
            label="In Review"
            value={formatNumber(summary.review)}
            hint="Pending or workflow review"
          />
          <SummaryCard
            label="Approved"
            value={formatNumber(summary.approved)}
            hint="Current filtered result"
          />
          <SummaryCard
            label="Disbursed Amount"
            value={formatCurrency(summary.disbursedAmount)}
            hint="Sum of application amounts"
          />
        </Box>

        <Paper
          withBorder
          radius="lg"
          style={{
            borderColor: "var(--mantine-color-slate-2)",
            overflow: "hidden",
          }}
        >
          <Box
            px="md"
            py="sm"
            style={{
              borderBottom: "1px solid var(--mantine-color-slate-1)",
            }}
          >
            <Group justify="space-between">
              <Box>
                <Title order={5} c="slate.8" fw={700}>
                  Applications
                </Title>
                <Text fz={11} c="slate.5">
                  {filteredRows.length} result
                  {filteredRows.length === 1 ? "" : "s"}
                </Text>
              </Box>

              {applicationsQuery.isFetching && !applicationsQuery.isLoading && (
                <Loader size="xs" />
              )}
            </Group>
          </Box>

          {applicationsQuery.isLoading ? (
            <Center py={60}>
              <Stack align="center" gap="xs">
                <Loader size="sm" />
                <Text fz={11} c="slate.5">
                  Loading loan applications...
                </Text>
              </Stack>
            </Center>
          ) : applicationsQuery.isError ? (
            <Center py={60}>
              <Stack align="center" gap="xs" maw={420}>
                <IconAlertCircle
                  size={22}
                  color="var(--mantine-color-red-6)"
                />
                <Text fz={12} fw={700} c="slate.7" ta="center">
                  Could not load the loan origination report.
                </Text>
                <Text fz={11} c="slate.5" ta="center">
                  {applicationsQuery.error instanceof Error
                    ? applicationsQuery.error.message
                    : "Please try refreshing the report."}
                </Text>
                <Button
                  size="xs"
                  radius="md"
                  variant="default"
                  onClick={() => applicationsQuery.refetch()}
                  leftSection={<IconRefresh size={13} />}
                >
                  Retry
                </Button>
              </Stack>
            </Center>
          ) : filteredRows.length === 0 ? (
            <Center py={60}>
              <Stack align="center" gap="xs">
                <IconSearch
                  size={22}
                  color="var(--mantine-color-slate-4)"
                />
                <Text fz={12} fw={700} c="slate.6">
                  No applications match your filters.
                </Text>
                {hasFilters && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="brand"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <>
              <Box style={{ overflowX: "auto" }}>
                <Table
                  verticalSpacing={6}
                  horizontalSpacing="sm"
                  fz={11}
                  withRowBorders={false}
                  style={{
                    minWidth: 920,
                    borderCollapse: "separate",
                    borderSpacing: "0 4px",
                  }}
                >
                  <Table.Thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Table.Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const canSort = header.column.getCanSort();
                          const sorted = header.column.getIsSorted();

                          return (
                            <Table.Th
                              key={header.id}
                              onClick={
                                canSort
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                              style={{
                                color: "var(--mantine-color-slate-5)",
                                fontWeight: 700,
                                fontSize: 11,
                                cursor: canSort ? "pointer" : "default",
                                whiteSpace: "nowrap",
                                userSelect: "none",
                              }}
                            >
                              <Group gap={4} wrap="nowrap">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                {canSort && sortIcon(sorted)}
                              </Group>
                            </Table.Th>
                          );
                        })}
                      </Table.Tr>
                    ))}
                  </Table.Thead>

                  <Table.Tbody>
                    {table.getRowModel().rows.map((row) => (
                      <Table.Tr
                        key={row.id}
                        style={{
                          background: "var(--mantine-color-white)",
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Table.Td
                            key={cell.id}
                            style={{
                              borderTop:
                                "1px solid var(--mantine-color-slate-1)",
                              borderBottom:
                                "1px solid var(--mantine-color-slate-1)",
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>

              <Box
                px="md"
                py="sm"
                style={{
                  borderTop:
                    "1px solid var(--mantine-color-slate-1)",
                }}
              >
                <Group justify="space-between" wrap="wrap" gap="sm">
                  <Group gap="xs">
                    <Text fz={11} c="slate.6">
                      Page {currentPage} of {Math.max(pageCount, 1)}
                    </Text>
                    <Select
                      size="xs"
                      radius="xl"
                      w={64}
                      data={PAGE_SIZES}
                      value={String(pagination.pageSize)}
                      onChange={(value) =>
                        setPagination({
                          pageIndex: 0,
                          pageSize: Number(value || 10),
                        })
                      }
                      rightSection={
                        <IconChevronDown
                          size={12}
                          style={{ opacity: 0.6 }}
                        />
                      }
                    />
                  </Group>

                  <Pagination
                    total={Math.max(pageCount, 1)}
                    value={currentPage}
                    onChange={(page) =>
                      setPagination((current) => ({
                        ...current,
                        pageIndex: page - 1,
                      }))
                    }
                    color="blue"
                    size="sm"
                    radius="md"
                    disabled={pageCount <= 1}
                  />
                </Group>
              </Box>
            </>
          )}
        </Paper>
      </Stack>

      <style>{`
        @media (max-width: 1100px) {
          .loan-origination-report-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </Box>
  );
}

export default LoanOriginationReport;
