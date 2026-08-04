import { useMemo, useState } from "react";
import { modals } from "@mantine/modals";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Pagination,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconFileText,
  IconPencil,
  IconPlus,
  IconSelector,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { LoanClassificationModal } from "../../../components/Modal/LoanClassificationModal";
import type { LoanClassificationData } from "../../../types/loanClassification";
import {
  getAllLoanClassifications,
  deleteLoanClassification,
} from "../../../api/LoanClassificationApi";

const EMPTY_CLASSIFICATIONS: LoanClassificationData[] = [];
const DEFAULT_SORTING = [{ id: "code", desc: false }];

const columnHelper = createColumnHelper<LoanClassificationData>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <IconChevronUp size={12} />;
  if (sorted === "desc") return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

export function LoanClassification() {
  const queryClient = useQueryClient();

  const [opened, { open, close }] = useDisclosure(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedData, setSelectedData] = useState<LoanClassificationData | null>(null);

  const handleOpenModal = (
    mode: "add" | "edit" | "view",
    data: LoanClassificationData | null = null
  ) => {
    setModalMode(mode);
    setSelectedData(data);
    open();
  };

  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState(DEFAULT_SORTING);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: classifications = EMPTY_CLASSIFICATIONS, isLoading } = useQuery({
    queryKey: ["loanClassifications"],
    queryFn: () => getAllLoanClassifications(),
    retry: false,
  });

  const { mutate: removeClassification, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanClassification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanClassifications"] });
    },
  });

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classifications.filter((c) => {
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [classifications, search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("level", {
        header: "Level",
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            L{info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("code", {
        header: "Code",
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9" className="font-mono">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <Text fz="xs" fw={500} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("min_dpd_range", {
        header: "Min DPD",
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("max_dpd_range", {
        header: "Max DPD",
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue() ?? "∞"}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("provision_rate", {
        header: "Provision Rate",
        cell: (info) => (
          <Text fz="xs" c="gray.6">
            {info.getValue()}%
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
            <Group justify="flex-end" gap={6} wrap="nowrap">
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => handleOpenModal("view", row)}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="indigoAlt"
                  onClick={() => handleOpenModal("edit", row)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  disabled={isDeleting}
                  onClick={() => {
                    modals.openConfirmModal({
                      title: "Delete loan classification",
                      children: (
                        <Text size="sm">
                          Are you sure you want to delete classification{" "}
                          <b>{row.code}</b>? This cannot be undone.
                        </Text>
                      ),
                      labels: { confirm: "Delete", cancel: "Cancel" },
                      confirmProps: { color: "red" },
                      onConfirm: () => removeClassification(row.code),
                    });
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDeleting]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = filteredData.length;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <LoanClassificationModal
        opened={opened}
        onClose={close}
        mode={modalMode}
        data={selectedData}
      />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Loan Classifications
        </Title>
        <Button
          size="xs"
          bg="indigoAlt.4"
          onClick={() => handleOpenModal("add")}
          leftSection={<IconPlus size={14} />}
        >
          Add Classification
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Code / Classification Name"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[200px]"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Button size="xs" variant="default" className="ml-auto px-4" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Paper>

      {/* Data Table */}
      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table verticalSpacing={4} horizontalSpacing="sm" fz="xs" className="w-full">
          <Table.Thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <Table.Th
                      key={header.id}
                      className={`text-gray-600 font-semibold select-none ${
                        canSort ? "cursor-pointer" : ""
                      }`}
                      style={{ fontSize: 11, padding: "6px 10px" }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Group
                        gap={4}
                        wrap="nowrap"
                        justify={header.id === "actions" ? "flex-end" : "flex-start"}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon sorted={header.column.getIsSorted()} />}
                      </Group>
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader size="sm" color="gray" />
                    <Text ta="center" c="dimmed" fz="xs" mt="sm">
                      Loading loan classifications...
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <IconFileText size={32} className="mb-2 opacity-50" />
                    <Text ta="center" c="dimmed" fz="xs">
                      No classifications found.
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {totalRows === 0 ? "Showing 0 of 0" : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })}
                rightSection={chevronDown}
                size="xs"
                className="w-14"
              />
            </div>
          </div>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
            color="indigoAlt.4"
            size="xs"
            radius="sm"
            disabled={totalRows === 0}
          />
        </div>
      </Paper>
    </Box>
  );
}