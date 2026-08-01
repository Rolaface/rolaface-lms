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
  MultiSelect,
  Loader,
  Modal,
  Stack,
  Group,
  Text,
  Divider,
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
  type ReceivableRow,
  VOUCHER_TYPE_OPTIONS,
} from "../../api/Accounting/Receivable.api";
import { useReceivable } from "../../hooks/Accounting/Receivablelogic";

/* ───────────────── KPI strip ───────────────── */

function KpiStrip({
  kpis,
  loading,
  displayAmount,
}: {
  kpis: NonNullable<ReturnType<typeof useReceivable>["kpis"]>;
  loading: boolean;
  displayAmount: (currency: string | undefined, amount: number) => string;
}) {
  const fmt = (n: number) => displayAmount(undefined, n);

  const sections = [
    {
      icon: <IconReceipt2 size={14} className="text-emerald-500" />,
      label: "Outstanding",
      items: [
        {
          label: "Total",
          value: fmt(kpis.total_outstanding),
          color: "text-emerald-600",
          bold: true,
        },
        {
          label: "Overdue",
          value: fmt(kpis.overdue_amount),
          color: "text-red-500",
          bold: true,
        },
        {
          label: "Invoiced",
          value: fmt(kpis.total_invoiced),
          color: "text-blue-500",
        },
      ],
    },
    {
      icon: <IconUsers size={14} className="text-indigoAlt-6" />,
      label: "Customers",
      items: [
        {
          label: "Count",
          value: String(kpis.total_customers),
          color: "text-indigoAlt-6",
          bold: true,
        },
        {
          label: "Paid",
          value: fmt(kpis.total_paid),
          color: "text-emerald-600",
        },
        {
          label: "Avg Days",
          value: String(kpis.average_collection_days || "—"),
          color: "text-indigoAlt-6",
        },
      ],
    },
    {
      icon: <IconReceipt2 size={14} className="text-amber-400" />,
      label: "Aging",
      items: Object.entries(kpis.ageing_summary).map(([key, val]) => {
        const label =
          key === "121_above" ? "121d+" : `${key.replace("_", "–")}d`;
        const bucket =
          key === "0_30"
            ? "text-emerald-600"
            : key === "31_60"
              ? "text-amber-500"
              : key === "61_90"
                ? "text-orange-500"
                : "text-red-600";
        return { label, value: fmt(val as number), color: bucket };
      }),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {sections.map((sec) => (
        <Paper
          key={sec.label}
          withBorder
          radius="md"
          className="px-4 py-3 flex flex-col gap-2 border-gray-200"
        >
          <div className="flex items-center gap-1.5">
            {sec.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {sec.label}
            </span>
          </div>
          <div
            className={`grid gap-2 divide-x divide-gray-100`}
            style={{
              gridTemplateColumns: `repeat(${sec.items.length}, minmax(0, 1fr))`,
            }}
          >
            {sec.items.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-0.5 px-2 first:pl-0 last:pr-0 min-w-0"
              >
                <span className="text-[10px] text-gray-500 truncate">
                  {item.label}
                </span>
                {loading ? (
                  <div className="h-3.5 w-12 bg-gray-100 rounded animate-pulse mt-0.5" />
                ) : (
                  <span
                    className={`text-[12px] tabular-nums truncate ${item.color} ${"bold" in item && item.bold ? "font-bold" : "font-medium"}`}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Paper>
      ))}
    </div>
  );
}

/* ───────────────── Status badge ───────────────── */

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  const color =
    status === "Paid" ? "teal" : status === "Overdue" ? "red" : "yellow";
  return (
    <Badge color={color} variant="light" size="sm" radius="sm">
      {status}
    </Badge>
  );
}

/* ───────────────── Page ───────────────── */

export function Receivable() {
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
    selectedCustomers,
    setSelectedCustomers,
    selectedReceivableAccount,
    setSelectedReceivableAccount,
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

    customerOptions,
    costCenterOptions,
    receivableAccountOptions,

    viewRowId,
    setViewRowId,
    viewRow,
  } = useReceivable();

  const columns = useMemo<ColumnDef<ReceivableRow>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "Voucher No",
        cell: ({ row }) => (
          <span className="font-mono text-indigoAlt-6 text-xs font-semibold">
            {row.original.id}
          </span>
        ),
      },
      {
        id: "customer",
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <span className="text-xs text-gray-800">{row.original.customer}</span>
        ),
      },
      {
        id: "voucherType",
        accessorKey: "voucherType",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-[11px] text-gray-500 font-medium">
            {row.original.voucherType}
          </span>
        ),
      },
      {
        id: "invoicedAmount",
        accessorKey: "invoicedAmount",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-blue-500 font-medium">
            {displayAmount(row.original.currency, row.original.invoicedAmount)}
          </span>
        ),
      },
      {
        id: "paidAmount",
        accessorKey: "paidAmount",
        header: "Paid",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-emerald-600 font-medium">
            {displayAmount(row.original.currency, row.original.paidAmount)}
          </span>
        ),
      },
      {
        id: "outstandingAmount",
        accessorKey: "outstandingAmount",
        header: "Outstanding",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={`text-xs tabular-nums font-semibold ${row.original.outstandingAmount > 0 ? "text-red-500" : "text-emerald-600"}`}
          >
            {displayAmount(
              row.original.currency,
              row.original.outstandingAmount,
            )}
          </span>
        ),
      },
      {
        id: "due",
        header: "Due / Posting Date",
        cell: ({ row }) => (
          <span className="text-[11px] text-gray-500 tabular-nums">
            {row.original.dueDate ?? row.original.postingDate ?? "—"}
          </span>
        ),
      },
      {
        id: "age",
        header: "Aging",
        cell: ({ row }) => {
          if (
            !row.original.voucherType ||
            row.original.voucherType !== "Sales Invoice"
          )
            return null;
          return (
            <div className="flex items-center gap-1">
              {row.original.overdue ? (
                <IconAlertTriangle size={11} className="text-red-500" />
              ) : (
                <IconClock size={11} className="text-gray-400" />
              )}
              <span
                className={`text-[11px] font-medium ${row.original.overdue ? "text-red-500" : "text-gray-500"}`}
              >
                {row.original.age}d {row.original.overdue ? "overdue" : "left"}
              </span>
            </div>
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
          <div className="flex justify-center">
            <ActionIcon
              variant="subtle"
              color="indigoAlt"
              size="sm"
              onClick={() => setViewRowId(row.original.id)}
            >
              <IconEye size={14} />
            </ActionIcon>
          </div>
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
      Customer: r.customer,
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
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(sheetData),
      "Receivables",
    );
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Accounts_Receivable_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="flex flex-col gap-3 p-6">
      {/* KPI strip */}
      {kpis ? (
        <KpiStrip
          kpis={kpis}
          loading={isLoading}
          displayAmount={displayAmount}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-md h-20 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Filter bar */}
      <Paper withBorder radius="md" className="px-4 py-3 border-gray-200">
        <div className="flex items-center gap-1.5 mb-2">
          <IconAdjustmentsHorizontal size={13} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Filters
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <DatePickerInput
            label="Posting Date"
            value={postingDate ? new Date(postingDate) : null}
            onChange={(d) =>
              setPostingDate(d ? new Date(d).toISOString().split("T")[0] : "")
            }
            size="xs"
            className="w-[150px]"
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
            onChange={(v) =>
              setFilterStatus((v as typeof filterStatus) ?? "all")
            }
            size="xs"
            className="w-[130px]"
          />

          <Select
            label="Voucher Type"
            placeholder="All Types"
            data={VOUCHER_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))}
            value={selectedVoucherType || null}
            onChange={(v) =>
              setSelectedVoucherType((v as typeof selectedVoucherType) ?? "")
            }
            size="xs"
            className="w-[150px]"
            clearable
          />

          <Select
            label="Group By"
            placeholder="None"
            data={[
              { value: "customer", label: "Customer" },
              { value: "voucher", label: "Voucher" },
            ]}
            value={selectedGroupBy[0] ?? null}
            onChange={(value) => setSelectedGroupBy(value ? [value] : [])}
            size="xs"
            className="w-[160px]"
            clearable
          />

          <Select
            label="Customer"
            placeholder="All Customers"
            data={customerOptions}
            value={selectedCustomers[0] ?? null}
            onChange={(value) => setSelectedCustomers(value ? [value] : [])}
            size="xs"
            className="w-[200px]"
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
            className="w-[160px]"
            searchable
            clearable
          />

          <Select
            label="Account"
            placeholder="All Accounts"
            data={receivableAccountOptions}
            value={selectedReceivableAccount || null}
            onChange={(v) => setSelectedReceivableAccount(v ?? "")}
            size="xs"
            className="w-[170px]"
            searchable
            clearable
          />

          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<IconX size={12} />}
              onClick={clearAll}
            >
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-end gap-2">
            <TextInput
              placeholder="Search voucher, customer…"
              leftSection={<IconSearch size={12} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              size="xs"
              className="w-[220px]"
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
          </div>
        </div>
      </Paper>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <Paper
        withBorder
        radius="md"
        className="border-gray-200 overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto overflow-y-auto max-h-[520px] relative">
          <Table
            striped
            highlightOnHover
            verticalSpacing="xs"
            horizontalSpacing="sm"
            stickyHeader
            className="min-w-full"
          >
            <Table.Thead className="bg-gray-50">
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
                        style={{ textAlign: align }}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap"
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
              {isLoading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} className="py-16">
                    <div className="flex justify-center items-center">
                      <Loader size="sm" color="indigoAlt" />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={columns.length}
                    className="py-16 text-center text-xs text-gray-400"
                  >
                    No receivables found matching your filters.
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
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
                          style={{ textAlign: align }}
                          className="whitespace-nowrap"
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

          {isLoading && rows.length > 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <Loader size="sm" color="indigoAlt" />
            </div>
          )}
        </div>

        {/* Pagination footer */}
        <div className="border-t border-gray-200 bg-gray-50/50 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500">
            {pagination && pagination.total_entries > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {(pagination.page - 1) * pagination.page_size + 1}–
                  {Math.min(
                    pagination.page * pagination.page_size,
                    pagination.total_entries,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {pagination.total_entries}
                </span>
              </>
            ) : (
              "No entries"
            )}
          </span>
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center gap-1">
              <ActionIcon
                variant="default"
                size="sm"
                disabled={!pagination.has_prev || isLoading}
                onClick={() => handlePageChange(page - 1)}
              >
                <IconChevronLeft size={13} />
              </ActionIcon>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <Button
                    key={p}
                    size="xs"
                    variant={p === page ? "filled" : "default"}
                    color={p === page ? "indigoAlt" : undefined}
                    disabled={isLoading}
                    onClick={() => handlePageChange(p)}
                    className="px-2"
                  >
                    {p}
                  </Button>
                ))}
              <ActionIcon
                variant="default"
                size="sm"
                disabled={!pagination.has_next || isLoading}
                onClick={() => handlePageChange(page + 1)}
              >
                <IconChevronRight size={13} />
              </ActionIcon>
            </div>
          )}
        </div>
      </Paper>

      {/* View details modal */}
      <Modal
        opened={!!viewRowId}
        onClose={() => setViewRowId(null)}
        title="Voucher Details"
        size="md"
        radius="md"
      >
        {viewRow && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Voucher No
              </Text>
              <Text size="sm" fw={600} className="font-mono text-indigoAlt-6">
                {viewRow.id}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Customer
              </Text>
              <Text size="sm">{viewRow.customer}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Voucher Type
              </Text>
              <Text size="sm">{viewRow.voucherType}</Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Invoiced Amount
              </Text>
              <Text size="sm" className="text-blue-500 font-medium">
                {displayAmount(viewRow.currency, viewRow.invoicedAmount)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Paid Amount
              </Text>
              <Text size="sm" className="text-emerald-600 font-medium">
                {displayAmount(viewRow.currency, viewRow.paidAmount)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Outstanding Amount
              </Text>
              <Text
                size="sm"
                fw={700}
                className={
                  viewRow.outstandingAmount > 0
                    ? "text-red-500"
                    : "text-emerald-600"
                }
              >
                {displayAmount(viewRow.currency, viewRow.outstandingAmount)}
              </Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Posting Date
              </Text>
              <Text size="sm">{viewRow.postingDate ?? "—"}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Due Date
              </Text>
              <Text size="sm">{viewRow.dueDate ?? "—"}</Text>
            </Group>
            {viewRow.status && (
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Status
                </Text>
                <StatusBadge status={viewRow.status} />
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  );
}
