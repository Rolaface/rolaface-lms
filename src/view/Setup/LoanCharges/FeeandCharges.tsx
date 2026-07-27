import { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Paper,
  Table,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { FeeAndChargesModal, type FeeAndCharge } from "../../../components/Modal/FeeAndChargesModal";

// --- DUMMY DATA ---
const DUMMY_FEES_AND_CHARGES: FeeAndCharge[] = [
  { id: 1, name: "Processing Fee" },
  { id: 2, name: "Late Payment Penalty" },
  { id: 3, name: "Documentation Charge" },
  { id: 4, name: "Prepayment Penalty" },
  { id: 5, name: "Insurance Premium" },
];

const columnHelper = createColumnHelper<FeeAndCharge>();

function SortIcon({ sorted }: { sorted: string | boolean }) {
  if (sorted === "asc") return <IconChevronUp size={12} />;
  if (sorted === "desc") return <IconChevronDown size={12} />;
  return <IconSelector size={12} className="opacity-40" />;
}

const chevronDown = <IconChevronDown size={14} className="opacity-60" />;

// --- MAIN TABLE COMPONENT ---
export function FeeAndCharges() {
  const [opened, { open, close }] = useDisclosure(false);
  
  // Modal Action State
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedData, setSelectedData] = useState<FeeAndCharge | null>(null);

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', data: FeeAndCharge | null = null) => {
    setModalMode(mode);
    setSelectedData(data);
    open();
  };

  // filter state
  const [search, setSearch] = useState("");

  // table state - Using inline type to fix Vite export error
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DUMMY_FEES_AND_CHARGES.filter((p) => {
      return !q || p.name.toLowerCase().includes(q);
    });
  }, [search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Fee/Charge Name",
        cell: (info) => (
          <Text fz="xs" fw={600} c="gray.9">
            {info.getValue()}
          </Text>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => (
          <Group justify="flex-end" gap={6} wrap="nowrap">
            <Tooltip label="View" withArrow>
              <ActionIcon 
                size="sm" 
                variant="subtle" 
                color="gray" 
                onClick={() => handleOpenModal('view', info.row.original)}
              >
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Edit" withArrow>
              <ActionIcon 
                size="sm" 
                variant="subtle" 
                color="blue" 
                onClick={() => handleOpenModal('edit', info.row.original)}
              >
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      }),
    ],
    [],
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

  return (
    <Box className="flex flex-col gap-4 p-8 mt-10">
      <FeeAndChargesModal 
        opened={opened} 
        onClose={close} 
        mode={modalMode} 
        data={selectedData} 
      />

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <Title order={2} className="text-gray-900 font-semibold">
          Fee and Charges
        </Title>
        <Button
          size="xs"
          bg="indigoAlt.4"
          className="bg-[#991B1B] hover:bg-red-900 transition-colors"
          onClick={() => handleOpenModal('add')}
          leftSection={<IconPlus size={14} />}
        >
          Add Fee/Charge
        </Button>
      </div>

      {/* Filters Box */}
      <Paper withBorder radius="md" p="xs" className="shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <TextInput
            size="xs"
            placeholder="Search Name"
            leftSection={<IconSearch size={13} />}
            className="flex-1 min-w-[250px] max-w-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
        </div>
      </Paper>

      {/* Data Table */}
      <Paper withBorder radius="md" className="shadow-sm overflow-hidden">
        <Table
          verticalSpacing={6}
          horizontalSpacing="sm"
          fz="xs"
          className="w-full"
        >
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
                      style={{ fontSize: 11, padding: "8px 10px" }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Group
                        gap={4}
                        wrap="nowrap"
                        justify={
                          header.id === "actions" ? "flex-end" : "flex-start"
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && (
                          <SortIcon sorted={header.column.getIsSorted() as string | boolean} />
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
                <Table.Td colSpan={columns.length}>
                  <Text ta="center" c="dimmed" fz="xs" py="sm">
                    No fees or charges match your search.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} style={{ padding: "8px 10px" }}>
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

        {/* Pagination Footer */}
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
                rightSection={chevronDown}
                size="xs"
                className="w-14"
              />
            </div>
          </div>
          <Pagination
            total={table.getPageCount() || 1}
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
    </Box>
  );
}