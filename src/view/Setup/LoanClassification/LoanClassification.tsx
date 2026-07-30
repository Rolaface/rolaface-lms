import { useMemo, useState } from "react";
import { modals } from "@mantine/modals";
import {
  ActionIcon,
  Group,
  Loader,
  Pagination,
  Select,
  Text,
  Tooltip,
} from "@mantine/core";

import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconPencil,
  IconPlus,
  IconRefresh,
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

// -----------------------------------------------------------------------------
// Module-level constants (STABLE REFERENCES)
// -----------------------------------------------------------------------------


const EMPTY_CLASSIFICATIONS: LoanClassificationData[] = [];

const DEFAULT_SORTING = [{ id: "code", desc: false }];

const columnHelper = createColumnHelper<LoanClassificationData>();

// -----------------------------------------------------------------------------
// Table Helpers
// -----------------------------------------------------------------------------

function SortIcon({ sorted }: { sorted: string | boolean }) {
  if (sorted === "asc") {
    return <IconChevronUp size={12} />;
  }

  if (sorted === "desc") {
    return <IconChevronDown size={12} />;
  }

  return <IconSelector size={12} className="opacity-40" />;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function LoanClassification() {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // Modal State
  // ---------------------------------------------------------------------------

  const [opened, { open, close }] = useDisclosure(false);

  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");

  const [selectedData, setSelectedData] =
    useState<LoanClassificationData | null>(null);

  const handleOpenModal = (
    mode: "add" | "edit" | "view",
    data: LoanClassificationData | null = null,
  ) => {
    setModalMode(mode);
    setSelectedData(data);
    open();
  };

  // ---------------------------------------------------------------------------
  // Filtering State
  // ---------------------------------------------------------------------------

  const [search, setSearch] = useState("");

  // ---------------------------------------------------------------------------
  // Table State
  // ---------------------------------------------------------------------------

  const [sorting, setSorting] = useState(DEFAULT_SORTING);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // ---------------------------------------------------------------------------
  // Fetch Classifications
  // ---------------------------------------------------------------------------

  const { data: classifications = EMPTY_CLASSIFICATIONS, isLoading } = useQuery(
    {
      queryKey: ["loanClassifications"],
      queryFn: () => getAllLoanClassifications(),
      retry: false,
    },
  );

  const { mutate: removeClassification, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanClassification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanClassifications"] });
    },
  });

  // ---------------------------------------------------------------------------
  // Filtering Logic
  // ---------------------------------------------------------------------------

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classifications.filter((classification) => {
      const matchesSearch =
        !query ||
        classification.code.toLowerCase().includes(query) ||
        classification.name.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [classifications, search]);

  // ---------------------------------------------------------------------------
  // KPI Calculations (For Stitch Bento Cards)
  // ---------------------------------------------------------------------------

  const classificationStats = useMemo(() => {
    const total = filteredData.length;

    const writtenOff = filteredData.filter(
      (item) => item.is_written_off,
    ).length;

    const averageProvision =
      total === 0
        ? 0
        : filteredData.reduce((sum, item) => sum + item.provision_rate, 0) /
          total;

    const maxDPD = filteredData.reduce<number>((max, item) => {
      if (item.max_dpd_range === null) {
        return Math.max(max, 999);
      }

      return Math.max(max, item.max_dpd_range);
    }, 0);

    return {
      total,
      writtenOff,
      averageProvision: averageProvision.toFixed(1),
      maxDPD: maxDPD >= 999 ? "∞" : String(maxDPD),
    };
  }, [filteredData]);

  // ---------------------------------------------------------------------------
  // Table Columns
  // ---------------------------------------------------------------------------

  const columns = useMemo(
    () => [
      columnHelper.accessor("level", {
        header: "Level",
        cell: (info) => <Text size="xs">L{info.getValue()}</Text>,
      }),

      columnHelper.accessor("code", {
        header: "Code",
        cell: (info) => (
          <Text size="xs" fw={600}>
            {info.getValue()}
          </Text>
        ),
      }),

      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <Text size="xs">{info.getValue()}</Text>,
      }),

      columnHelper.accessor("min_dpd_range", {
        header: "Min DPD",
        cell: (info) => <Text size="xs">{info.getValue()}</Text>,
      }),

      columnHelper.accessor("max_dpd_range", {
        header: "Max DPD",
        cell: (info) => <Text size="xs">{info.getValue() ?? "∞"}</Text>,
      }),

      columnHelper.accessor("provision_rate", {
        header: "Provision Rate",
        cell: (info) => <Text size="xs">{info.getValue()}%</Text>,
      }),

      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;

          return (
            <Group justify="flex-end" gap={4}>
              <Tooltip label="View">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => handleOpenModal("view", row)}
                >
                  <IconEye size={15} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Edit">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => handleOpenModal("edit", row)}
                >
                  <IconPencil size={15} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete">
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
                  <IconTrash size={15} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDeleting],
  );

  // ---------------------------------------------------------------------------
  // React Table Instance
  // ---------------------------------------------------------------------------

  const table = useReactTable({
    data: filteredData,
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

  const rows = table.getRowModel().rows;

  const totalRows = filteredData.length;

  const { pageIndex, pageSize } = pagination;

  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;

  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch("");

    setPagination((previous) => ({
      ...previous,
      pageIndex: 0,
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-8 mt-10 bg-[#f8f9ff] min-h-full">
      <LoanClassificationModal
        opened={opened}
        onClose={close}
        mode={modalMode}
        data={selectedData}
      />

      {/* ------------------------------------------------------------------
          PAGE HEADER
      ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] leading-8 font-bold tracking-tight text-[#121c2a]">
          Loan Classifications
        </h1>

        <p className="text-sm text-[#464653]">
          Configure institution-wide loan classification, provisioning,
          delinquency ranges, and write-off eligibility.
        </p>
      </div>

      {/* ------------------------------------------------------------------
          TABLE CARD
      ------------------------------------------------------------------ */}

      <div
        className="
          bg-white
          border
          border-[#c6c5d6]
          rounded-lg
          overflow-hidden
          shadow-sm
        "
      >
        {/* Toolbar */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            p-4
            border-b
            border-[#c6c5d6]
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                relative
                flex
                items-center
              "
            >
              <IconSearch
                size={18}
                className="
                  absolute
                  left-3
                  text-gray-400
                "
              />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);

                  setPagination((previous) => ({
                    ...previous,
                    pageIndex: 0,
                  }));
                }}
                placeholder="Search by Code or Classification Name"
                className="
                  h-10
                  w-80
                  pl-10
                  pr-3
                  rounded-l-md
                  border
                  border-[#c6c5d6]
                  outline-none
                  text-sm
                  focus:border-[#474dc5]
                "
              />
            </div>

            <button
              onClick={resetFilters}
              className="
                h-10
                px-3
                border
                border-[#c6c5d6]
                rounded-r-md
                hover:bg-gray-50
                flex
                items-center
              "
            >
              <IconRefresh size={18} />
            </button>

            {search && (
              <div
                className="
                  flex
                  items-center
                  gap-2
                  px-3
                  py-1
                  rounded-full
                  bg-blue-50
                  text-blue-700
                  text-xs
                "
              >
                Search:
                <span className="font-semibold">{search}</span>
                <button onClick={resetFilters} className="font-bold">
                  ×
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleOpenModal("add")}
            className="
              h-10
              px-5
              rounded-md
              bg-[#474dc5]
              text-white
              text-sm
              font-medium
              flex
              items-center
              gap-2
              hover:opacity-90
            "
          >
            <IconPlus size={18} />
            Add Classification
          </button>
        </div>

        {/* Table */}

        <div className="overflow-auto">
          <table
            className="
              w-full
              text-left
              border-collapse
            "
          >
            <thead
              className="
                bg-[#eff4ff]
                border-b
                border-[#c6c5d6]
              "
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="
                        px-4
                        py-3
                        text-xs
                        font-semibold
                        text-[#464653]
                        whitespace-nowrap
                        cursor-pointer
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-1
                        "
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        {header.column.getCanSort() && (
                          <SortIcon sorted={header.column.getIsSorted()} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Loader size="sm" color="gray" />
                      <span className="text-sm text-gray-500">
                        Loading loan classifications...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="
                      text-center
                      py-8
                      text-sm
                      text-gray-500
                    "
                  >
                    No classifications found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="
                      border-b
                      border-gray-100
                      hover:bg-blue-50/30
                      transition
                    "
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="
                          px-4
                          py-3
                          text-sm
                          text-[#121c2a]
                        "
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}

        <div
          className="
            flex
            justify-between
            items-center
            px-4
            py-3
            border-t
            border-[#c6c5d6]
          "
        >
          <span className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {firstRow}-{lastRow}
            </span>{" "}
            of <span className="font-medium text-gray-900">{totalRows}</span>{" "}
            classifications
          </span>

          <div className="flex items-center gap-3">
            <Select
              size="xs"
              value={String(pageSize)}
              data={["10", "20", "50"]}
              onChange={(value) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(value) || 10,
                })
              }
              className="w-20"
            />

            <Pagination
              size="sm"
              total={table.getPageCount() || 1}
              value={pageIndex + 1}
              onChange={(page) =>
                setPagination((previous) => ({
                  ...previous,
                  pageIndex: page - 1,
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
