import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Box,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Menu,
  LoadingOverlay,
  Button,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconSearch,
  IconFileText,
  IconDots,
  IconCircleCheck,
  IconBan,
  IconTrash,
  IconFileInvoice,
  IconPlus,
} from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";

import { type JournalEntry } from "../../api/Accounting/Journalentries.api";
import { useJournalEntries } from "../../hooks/Accounting/journal-entry/useJournalEntries";
import JournalEntryModal from "../../components/Modal/Accounting/JournalEntryModal";
import { useCompanyStore } from "../../store/companyStore";

function formatDate(date: string) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const [y, m, d] = date.split("T")[0].split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${y}`;
}

function statusInfo(docstatus: JournalEntry["docstatus"]) {
  if (docstatus === 1) return { label: "Submitted", color: "green" };
  if (docstatus === 2) return { label: "Cancelled", color: "red" };
  return { label: "Draft", color: "gray" };
}

const columnHelper = createColumnHelper<JournalEntry>();

function useColumns(
  onSubmit: (name: string) => void,
  onCancel: (name: string) => void,
  onDelete: (name: string) => void,
  onView: (name: string) => void,
  onEdit: (name: string) => void,
) {
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Entry Number",
        cell: (info) => (
          <Group gap={6} wrap="nowrap">
            <IconFileText size={14} className="text-gray-400 shrink-0" />
            <Text fz="xs" fw={600} c="gray.9">
              {info.getValue()}
            </Text>
          </Group>
        ),
      }),
      columnHelper.accessor("posting_date", {
        header: "Posting Date",
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {formatDate(info.getValue())}
          </Text>
        ),
      }),
      columnHelper.accessor("docstatus", {
        header: "Status",
        cell: (info) => {
          const { label, color } = statusInfo(info.getValue());
          return (
            <Badge
              variant="light"
              size="sm"
              color={color}
              styles={{ root: { fontSize: 10, padding: "0 8px" } }}
            >
              {label}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("total_debit", {
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Total Debit
          </Text>
        ),
        cell: (info) => (
          <Text
            fz="xs"
            ta="right"
            c="gray.8"
            className="font-mono bg-gray-50 rounded px-2 py-1 inline-block w-full"
          >
            {info.getValue().toFixed(2)}
          </Text>
        ),
      }),
      columnHelper.accessor("total_credit", {
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Total Credit
          </Text>
        ),
        cell: (info) => (
          <Text
            fz="xs"
            ta="right"
            c="gray.8"
            className="font-mono bg-gray-50 rounded px-2 py-1 inline-block w-full"
          >
            {info.getValue().toFixed(2)}
          </Text>
        ),
      }),
      columnHelper.accessor("user_remark", {
        header: "Remark",
        cell: (info) => (
          <Text fz="xs" c="gray.6" truncate className="max-w-[220px]">
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="center" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isDraft = row.docstatus === 0;
          const isSubmitted = row.docstatus === 1;
          return (
            <Group justify="center" gap={4} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => onView(row.name)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label={isDraft ? "Edit" : "Only drafts can be edited"}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  disabled={!isDraft}
                  onClick={() => onEdit(row.name)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={160} position="bottom-end">
                <Menu.Target>
                  <ActionIcon size="sm" variant="subtle" color="gray">
                    <IconDots size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {isDraft && (
                    <Menu.Item
                      leftSection={
                        <IconCircleCheck size={13} className="text-green-600" />
                      }
                      onClick={() => onSubmit(row.name)}
                    >
                      Submit
                    </Menu.Item>
                  )}
                  {isSubmitted ? (
                    <Menu.Item
                      color="red"
                      leftSection={<IconBan size={13} />}
                      onClick={() => onCancel(row.name)}
                    >
                      Cancel Entry
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={13} />}
                      onClick={() => onDelete(row.name)}
                    >
                      Delete
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    [onSubmit, onCancel, onDelete, onView, onEdit],
  );
}

export function JournalEntries() {
  const [opened, setOpened] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);

  const baseCurrency = useCompanyStore((state) => state.baseCurrency);

  const {
    loading,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    orderBy,
    setOrderBy,
    filteredData,
    total,
    pagination,
    setPagination,
    handleSubmit,
    handleCancel,
    handleDelete,
    handleRefresh,
  } = useJournalEntries();

  const openNew = () => {
    setActiveEntryId(null);
    setModalReadOnly(false);
    setOpened(true);
  };
  const openView = (name: string) => {
    setActiveEntryId(name);
    setModalReadOnly(true);
    setOpened(true);
  };
  const openEdit = (name: string) => {
    setActiveEntryId(name);
    setModalReadOnly(false);
    setOpened(true);
  };
  const closeModal = () => {
    setOpened(false);
    setActiveEntryId(null);
  };

  const columns = useColumns(
    handleSubmit,
    handleCancel,
    handleDelete,
    openView,
    openEdit,
  ); // CHANGED

  const { pageIndex, pageSize } = pagination;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const totalRows = total;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <Box className="flex flex-col gap-4 p-6 ">
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Search journal entries..."
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[220px]"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Group gap={4} wrap="nowrap">
            <Text
              fz="xs"
              fw={600}
              c="gray.5"
              className="uppercase tracking-wide"
            >
              From
            </Text>
            <DateInput
              size="xs"
              placeholder="From Date"
              value={fromDate}
              onChange={(value) => setFromDate(value || "")}
              valueFormat="DD/MM/YYYY"
              className="w-[150px]"
              clearable
            />
          </Group>
          <Group gap={4} wrap="nowrap">
            <Text
              fz="xs"
              fw={600}
              c="gray.5"
              className="uppercase tracking-wide"
            >
              To
            </Text>
            <DateInput
              size="xs"
              placeholder="To Date"
              value={toDate}
              onChange={(value) => setToDate(value || "")}
              valueFormat="DD/MM/YYYY"
              className="w-[150px]"
              clearable
            />
          </Group>
          <Group gap="xs" ml="auto">
            <Select
              size="xs"
              data={[
                { value: "posting_date desc", label: "Posting Date" },
                { value: "creation desc", label: "Creation Date" },
              ]}
              value={orderBy}
              onChange={(v) => setOrderBy(v || "creation desc")}
              className="w-40"
            />

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openNew} // CHANGED
              color="indigo"
              radius="md"
              size="sm"
            >
              New Entry
            </Button>
          </Group>
        </div>
      </Paper>

      <Paper
        withBorder
        radius="md"
        className="shadow-sm overflow-hidden"
        pos="relative"
      >
        <LoadingOverlay
          visible={loading}
          zIndex={5}
          overlayProps={{ blur: 1 }}
        />
        <Table
          verticalSpacing={4}
          horizontalSpacing="sm"
          fz="xs"
          className="w-full"
        >
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    className="text-gray-600 font-semibold select-none"
                    style={{ fontSize: 11, padding: "6px 10px" }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <IconFileInvoice size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No journal entries found.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} style={{ padding: "5px 10px" }}>
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

        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {totalRows === 0
                ? "Showing 0 of 0"
                : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) =>
                  setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })
                }
                size="xs"
                className="w-14"
              />
            </div>
          </div>
          <Pagination
            total={pageCount}
            value={pageIndex + 1}
            onChange={(p) =>
              setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
            }
            color="indigoAlt.4"
            size="xs"
            radius="sm"
          />
        </div>
      </Paper>

      <JournalEntryModal
        opened={opened}
        onClose={closeModal}
        onSuccess={handleRefresh}
        entryId={activeEntryId}
        isReadOnly={modalReadOnly}
        baseCurrency={baseCurrency}
      />
    </Box>
  );
}
