import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Paper,
  Table,
  Badge,
  Button,
  ActionIcon,
  TextInput,
  Select,
  Loader,
  Modal,
  Stack,
  Group,
  Text,
  Divider,
  Box,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconDownload,
  IconEye,
  IconClock,
  IconAlertTriangle,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconUsers,
  IconReceipt2,
  IconAdjustmentsHorizontal,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  type PayableRow,
  VOUCHER_TYPE_OPTIONS,
} from "../../api/Accounting/Payable.api";
import { usePayable } from "../../hooks/Accounting/Payablelogic";

/* ───────────────── KPI strip ──────────────── */

function KpiStrip({
  kpis,
  loading,
  displayAmount,
}: {
  kpis: NonNullable<ReturnType<typeof usePayable>["kpis"]>;
  loading: boolean;
  displayAmount: (currency: string | undefined, amount: number) => string;
}) {
  const fmt = (n: number) => displayAmount(undefined, n);

  const sections = [
    {
      icon: <IconReceipt2 size={14} color="var(--mantine-color-success-6)" />,
      label: "Outstanding",
      items: [
        { label: "Total", value: fmt(kpis.total_outstanding), color: "success.6", bold: true },
        { label: "Overdue", value: fmt(kpis.overdue_amount), color: "danger.5", bold: true },
        { label: "Invoiced", value: fmt(kpis.total_invoiced), color: "info.5" },
      ],
    },
    {
      icon: <IconUsers size={14} color="var(--mantine-color-brand-6)" />,
      label: "Suppliers",
      items: [
        { label: "Count", value: String(kpis.total_suppliers), color: "brand.6", bold: true },
        { label: "Paid", value: fmt(kpis.total_paid), color: "success.6" },
        { label: "Avg Days", value: String(kpis.average_payment_days || "—"), color: "brand.6" },
      ],
    },
    {
      icon: <IconReceipt2 size={14} color="var(--mantine-color-warning-4)" />,
      label: "Aging",
      items: Object.entries(kpis.ageing_summary).map(([key, val]) => {
        const label = key === "121_above" ? "121d+" : `${key.replace("_", "–")}d`;
        const bucket =
          key === "0_30"
            ? "success.6"
            : key === "31_60"
              ? "warning.5"
              : key === "61_90"
                ? "accent.5"
                : "danger.6";
        return { label, value: fmt(val as number), color: bucket };
      }),
    },
  ];

  return (
    <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--mantine-spacing-sm)" }}>
      {sections.map((sec) => (
        <Paper
          key={sec.label}
          withBorder
          radius="md"
          p="md"
          style={{ borderColor: "var(--mantine-color-slate-2)" }}
        >
          <Group gap={6} mb="xs">
            {sec.icon}
            <Text fz="10px" fw={700} tt="uppercase" c="slate.4" style={{ letterSpacing: "0.08em" }}>
              {sec.label}
            </Text>
          </Group>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${sec.items.length}, minmax(0, 1fr))`,
              gap: "var(--mantine-spacing-xs)",
            }}
          >
            {sec.items.map((item) => (
              <Box key={item.label} style={{ minWidth: 0 }}>
                <Text fz="10px" c="slate.5" truncate>
                  {item.label}
                </Text>
                {loading ? (
                  <Box h={14} w={48} mt={2} style={{ background: "var(--mantine-color-slate-1)", borderRadius: 4 }} className="animate-pulse" />
                ) : (
                  <Text
                    fz="12px"
                    fw={"bold" in item && item.bold ? 700 : 500}
                    c={item.color}
                    truncate
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.value}
                  </Text>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

/* ───────────────── Status badge ───────────────── */

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  const scale = status === "Paid" ? "success" : status === "Overdue" ? "danger" : "warning";
  return (
    <Badge color={scale} variant="light" size="sm" radius="sm">
      {status}
    </Badge>
  );
}

/* ───────────────── Page ───────────────── */

export function Payable() {
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    postingDate,
    setPostingDate,
    selectedGroupBy,
    setSelectedGroupBy,
    selectedVoucherType,
    setSelectedVoucherType,
    selectedCostCenter,
    setSelectedCostCenter,
    selectedSuppliers,
    setSelectedSuppliers,
    selectedPayableAccount,
    setSelectedPayableAccount,
    hasActiveFilters,
    clearAll,

    kpis,
    rows,
    pagination,
    isLoading,
    isExporting,
    error,
    page,
    pageSize,
    handlePageChange,
    handleExportExcel,
    displayAmount,

    supplierOptions,
    costCenterOptions,
    payableAccountOptions,

    viewRowId,
    setViewRowId,
    viewRow,
  } = usePayable();

  const columns = useMemo<ColumnDef<PayableRow>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "Voucher No",
        cell: ({ row }) => (
          <Text fz="xs" fw={600} c="brand.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
            {row.original.id}
          </Text>
        ),
      },
      {
        id: "billNo",
        accessorKey: "billNo",
        header: "Bill No",
        cell: ({ row }) => (
          <Text fz="11px" c="slate.5" fw={500}>
            {row.original.billNo}
          </Text>
        ),
      },
      {
        id: "vendor",
        accessorKey: "vendor",
        header: "Party",
        cell: ({ row }) => (
          <Text fz="xs" c="slate.8">
            {row.original.vendor}
          </Text>
        ),
      },
      {
        id: "voucherType",
        accessorKey: "voucherType",
        header: "Type",
        cell: ({ row }) => (
          <Text fz="11px" c="slate.5" fw={500}>
            {row.original.voucherType}
          </Text>
        ),
      },
      {
        id: "invoicedAmount",
        accessorKey: "invoicedAmount",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" fw={500} c="info.5" style={{ fontVariantNumeric: "tabular-nums" }}>
            {displayAmount(row.original.currency, row.original.invoicedAmount)}
          </Text>
        ),
      },
      {
        id: "paidAmount",
        accessorKey: "paidAmount",
        header: "Paid",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text fz="xs" fw={500} c="success.6" style={{ fontVariantNumeric: "tabular-nums" }}>
            {displayAmount(row.original.currency, row.original.paidAmount)}
          </Text>
        ),
      },
      {
        id: "outstandingAmount",
        accessorKey: "outstandingAmount",
        header: "Outstanding",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Text
            fz="xs"
            fw={600}
            c={row.original.outstandingAmount > 0 ? "danger.5" : "success.6"}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {displayAmount(row.original.currency, row.original.outstandingAmount)}
          </Text>
        ),
      },
      {
        id: "due",
        header: "Due / Posting Date",
        cell: ({ row }) => (
          <Text fz="11px" c="slate.5" style={{ fontVariantNumeric: "tabular-nums" }}>
            {row.original.dueDate ?? row.original.postingDate ?? "—"}
          </Text>
        ),
      },
      {
        id: "age",
        header: "Aging",
        cell: ({ row }) => {
          if (!row.original.status) return null;
          return (
            <Group gap={4} wrap="nowrap">
              {row.original.overdue ? (
                <IconAlertTriangle size={11} color="var(--mantine-color-danger-5)" />
              ) : (
                <IconClock size={11} color="var(--mantine-color-slate-4)" />
              )}
              <Text fz="11px" fw={500} c={row.original.overdue ? "danger.5" : "slate.5"}>
                {row.original.age}d {row.original.overdue ? "overdue" : "left"}
              </Text>
            </Group>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        meta: { align: "center" },
        cell: ({ row }) => (
          <Group justify="center">
            <ActionIcon variant="subtle" color="brand" size="sm" radius="md" onClick={() => setViewRowId(row.original.id)}>
              <IconEye size={14} />
            </ActionIcon>
          </Group>
        ),
      },
    ],
    [displayAmount, setViewRowId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.total_pages ?? -1,
  });

  const onExport = async () => {
    const exportRows = await handleExportExcel();
    if (!exportRows.length) return;
    const sheetData = exportRows.map((r) => ({
      "Voucher No": r.id,
      "Bill No": r.billNo,
      Supplier: r.vendor,
      "Voucher Type": r.voucherType,
      "Cost Center": r.costCenter ?? "",
      "Invoiced Amount": r.invoicedAmount,
      "Paid Amount": r.paidAmount,
      "Outstanding Amount": r.outstandingAmount,
      "Posting Date": r.postingDate ?? "",
      "Due Date": r.dueDate ?? "",
      "Age (Days)": r.age,
      Currency: r.currency,
      Status: r.status,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetData), "Payables");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Accounts_Payable_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <Stack gap="sm" p="lg">
      {/* KPI strip */}
      {kpis ? (
        <KpiStrip kpis={kpis} loading={isLoading} displayAmount={displayAmount} />
      ) : (
        <Box style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--mantine-spacing-sm)" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box
              key={i}
              h={80}
              style={{
                background: "var(--mantine-color-white)",
                border: "1px solid var(--mantine-color-slate-2)",
                borderRadius: "var(--mantine-radius-md)",
              }}
              className="animate-pulse"
            />
          ))}
        </Box>
      )}

      {/* Filter bar */}
      <Paper withBorder radius="md" p="md" style={{ borderColor: "var(--mantine-color-slate-2)" }}>
        <Group gap={6} mb="sm">
          <IconAdjustmentsHorizontal size={13} color="var(--mantine-color-slate-4)" />
          <Text fz="10px" fw={700} tt="uppercase" c="slate.4" style={{ letterSpacing: "0.08em" }}>
            Filters
          </Text>
        </Group>

        <Group gap="sm" wrap="wrap" align="flex-end">
          <DatePickerInput
            label="Posting Date"
            value={postingDate ? new Date(postingDate) : null}
            onChange={(d) => setPostingDate(d ? new Date(d).toISOString().split("T")[0] : "")}
            size="xs"
            w={150}
            clearable
          />

          <Select
            label="Status"
            data={[
              { value: "all", label: "All Statuses" },
              { value: "Pending", label: "Pending" },
              { value: "Overdue", label: "Overdue" },
              { value: "Paid", label: "Paid" },
            ]}
            value={filterStatus}
            onChange={(v) => setFilterStatus((v as typeof filterStatus) ?? "all")}
            size="xs"
            w={130}
          />

          <Select
            label="Voucher Type"
            placeholder="All Types"
            data={VOUCHER_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))}
            value={selectedVoucherType || null}
            onChange={(v) => setSelectedVoucherType((v as typeof selectedVoucherType) ?? "")}
            size="xs"
            w={160}
            clearable
          />

          <Select
            label="Group By"
            placeholder="None"
            data={[
              { value: "supplier", label: "Supplier" },
              { value: "voucher", label: "Voucher" },
            ]}
            value={selectedGroupBy[0] ?? null}
            onChange={(value) => setSelectedGroupBy(value ? [value] : [])}
            size="xs"
            w={160}
            clearable
          />

          <Select
            label="Supplier"
            placeholder="All Suppliers"
            data={supplierOptions}
            value={selectedSuppliers[0] ?? null}
            onChange={(value) => setSelectedSuppliers(value ? [value] : [])}
            size="xs"
            w={200}
            searchable
            clearable
          />

          <Select
            label="Cost Center"
            placeholder="All Cost Centers"
            data={costCenterOptions}
            value={selectedCostCenter || null}
            onChange={(v) => setSelectedCostCenter(v ?? "")}
            size="xs"
            w={160}
            searchable
            clearable
          />

          <Select
            label="Account"
            placeholder="All Accounts"
            data={payableAccountOptions}
            value={selectedPayableAccount || null}
            onChange={(v) => setSelectedPayableAccount(v ?? "")}
            size="xs"
            w={170}
            searchable
            clearable
          />

          {hasActiveFilters && (
            <Button variant="subtle" color="danger" size="xs" leftSection={<IconX size={12} />} onClick={clearAll}>
              Clear
            </Button>
          )}

          <Group gap="sm" ml="auto" align="flex-end">
            <TextInput
              placeholder="Search voucher, supplier…"
              leftSection={<IconSearch size={12} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              size="xs"
              w={220}
            />
            <Button
              variant="default"
              size="xs"
              leftSection={
                isExporting ? (
                  <IconRefresh size={12} className="animate-spin" />
                ) : (
                  <IconDownload size={12} />
                )
              }
              onClick={onExport}
              disabled={isExporting || rows.length === 0}
            >
              {isExporting ? "Exporting…" : "Export"}
            </Button>
          </Group>
        </Group>
      </Paper>

      {error && (
        <Box
          px="sm"
          py={8}
          style={{
            background: "var(--mantine-color-danger-0)",
            border: "1px solid var(--mantine-color-danger-2)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Text fz="xs" c="danger.6">
            {error}
          </Text>
        </Box>
      )}

      {/* Table */}
      <Paper withBorder radius="md" style={{ borderColor: "var(--mantine-color-slate-2)", overflow: "hidden" }}>
        <Box style={{ overflowX: "auto", overflowY: "auto", maxHeight: 520, position: "relative" }}>
          <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm" stickyHeader style={{ minWidth: "100%" }}>
            <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as { align?: string } | undefined)?.align === "right"
                        ? "right"
                        : "left";
                    return (
                      <Table.Th
                        key={header.id}
                        style={{
                          textAlign: align,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--mantine-color-slate-5)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {isLoading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} py={64}>
                    <Group justify="center">
                      <Loader size="sm" color="brand" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} py={64} ta="center">
                    <Text fz="xs" c="slate.4">
                      No payables found matching your filters.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const align =
                        (cell.column.columnDef.meta as { align?: string } | undefined)?.align === "right"
                          ? "right"
                          : "left";
                      return (
                        <Table.Td key={cell.id} style={{ textAlign: align, whiteSpace: "nowrap" }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>

          {isLoading && rows.length > 0 && (
            <Box
              style={{
                position: "absolute",
                inset: 0,
                background: "color-mix(in srgb, var(--mantine-color-white) 60%, transparent)",
                backdropFilter: "blur(1px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader size="sm" color="brand" />
            </Box>
          )}
        </Box>

        {/* Pagination footer */}
        <Group
          justify="space-between"
          px="sm"
          py={8}
          wrap="wrap"
          style={{ borderTop: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-slate-0)" }}
        >
          <Text fz="11px" c="slate.5">
            {pagination && pagination.total_entries > 0 ? (
              <>
                Showing{" "}
                <Text component="span" fz="11px" fw={600} c="slate.8">
                  {(pagination.page - 1) * pagination.page_size + 1}–
                  {Math.min(pagination.page * pagination.page_size, pagination.total_entries)}
                </Text>{" "}
                of{" "}
                <Text component="span" fz="11px" fw={600} c="slate.8">
                  {pagination.total_entries}
                </Text>
              </>
            ) : (
              "No entries"
            )}
          </Text>
          {pagination && pagination.total_pages > 1 && (
            <Group gap={4}>
              <ActionIcon variant="default" size="sm" disabled={!pagination.has_prev || isLoading} onClick={() => handlePageChange(page - 1)}>
                <IconChevronLeft size={13} />
              </ActionIcon>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <Button
                    key={p}
                    size="xs"
                    variant={p === page ? "filled" : "default"}
                    color={p === page ? "brand" : undefined}
                    disabled={isLoading}
                    onClick={() => handlePageChange(p)}
                    px={8}
                  >
                    {p}
                  </Button>
                ))}
              <ActionIcon variant="default" size="sm" disabled={!pagination.has_next || isLoading} onClick={() => handlePageChange(page + 1)}>
                <IconChevronRight size={13} />
              </ActionIcon>
            </Group>
          )}
        </Group>
      </Paper>

      {/* View details modal */}
      <Modal opened={!!viewRowId} onClose={() => setViewRowId(null)} title="Voucher Details" size="md" radius="md">
        {viewRow && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Voucher No
              </Text>
              <Text size="sm" fw={600} c="brand.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
                {viewRow.id}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Bill No
              </Text>
              <Text size="sm">{viewRow.billNo}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Supplier
              </Text>
              <Text size="sm">{viewRow.vendor}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Voucher Type
              </Text>
              <Text size="sm">{viewRow.voucherType}</Text>
            </Group>
            <Divider color="slate.2" />
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Invoiced Amount
              </Text>
              <Text size="sm" fw={500} c="info.5">
                {displayAmount(viewRow.currency, viewRow.invoicedAmount)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Paid Amount
              </Text>
              <Text size="sm" fw={500} c="success.6">
                {displayAmount(viewRow.currency, viewRow.paidAmount)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Outstanding Amount
              </Text>
              <Text size="sm" fw={700} c={viewRow.outstandingAmount > 0 ? "danger.5" : "success.6"}>
                {displayAmount(viewRow.currency, viewRow.outstandingAmount)}
              </Text>
            </Group>
            <Divider color="slate.2" />
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Posting Date
              </Text>
              <Text size="sm">{viewRow.postingDate ?? "—"}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="slate.5">
                Due Date
              </Text>
              <Text size="sm">{viewRow.dueDate ?? "—"}</Text>
            </Group>
            {viewRow.status && (
              <Group justify="space-between">
                <Text size="xs" c="slate.5">
                  Status
                </Text>
                <StatusBadge status={viewRow.status} />
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}