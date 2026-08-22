import { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Group,
  Paper,
  Table,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Menu,
  Select,
  useMantineTheme,
  Badge,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconTrash,
  IconDotsVertical,
  IconCalendarClock,
  IconPower,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { schedulerModal } from "../components/Modal/Schedular/schedulerModalStore";
 
interface SchedulerRow {
  id: string;
  schedulerName: string;
  frequency: string;
  enabled: boolean;
}

const DUMMY_DATA: SchedulerRow[] = [
  { id: "1", schedulerName: "Repayment Reminder", frequency: "Monthly", enabled: true },
  ];

const columnHelper = createColumnHelper<SchedulerRow>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function SchedulerPage() {
  const theme = useMantineTheme();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [schedulers, setSchedulers] = useState<SchedulerRow[]>(DUMMY_DATA);
  const [sorting, setSorting] = useState([{ id: "schedulerName", desc: false }]);

  // ── Client-side search + pagination ──
  const filteredSchedulers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return schedulers;
    return schedulers.filter(
      (s) =>
        s.schedulerName.toLowerCase().includes(term) ||
        s.frequency.toLowerCase().includes(term)
    );
  }, [schedulers, debouncedSearch]);

  const totalRows = filteredSchedulers.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const data = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSchedulers.slice(start, start + pageSize);
  }, [filteredSchedulers, page, pageSize]);


   const handleAddClick = () => {
    schedulerModal.open({
      onSaved: (form) => {
        const id = `scheduler-${Date.now()}`;
        setSchedulers((prev) => [...prev, { id, ...form }]);
      },
    });
  };

  const handleView = (row: SchedulerRow) => {
    schedulerModal.open({
      initialData: {
        schedulerName: row.schedulerName,
        frequency: row.frequency,
        enabled: row.enabled,
      },
      isView: true,
    });
  };

  const handleEdit = (row: SchedulerRow) => {
    schedulerModal.open({
      initialData: {
        schedulerName: row.schedulerName,
        frequency: row.frequency,
        enabled: row.enabled,
      },
      onSaved: (form) => {
        setSchedulers((prev) =>
          prev.map((s) => (s.id === row.id ? { ...s, ...form } : s))
        );
      },
    });
  };

  // ── Table Columns ──
  const columns = useMemo(
    () => [
      columnHelper.accessor("schedulerName", {
        header: "Scheduler Name",
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.accessor("frequency", {
        header: "Frequency",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.accessor("enabled", {
        header: "Status",
        cell: (info) => (
          <Badge
            color={info.getValue() ? "green" : "gray"}
            variant="light"
            size="sm"
            radius="sm"
          >
            {info.getValue() ? "Enabled" : "Disabled"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const rowData = info.row.original;

          return (
            <Group
              justify="flex-end"
              gap={4}
              wrap="nowrap"
              className="scheduler-row-actions"
            >
              <Tooltip label="View" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="slate"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("View", rowData);
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Edit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="brand"
                  radius="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Edit", rowData);
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>

              <Menu shadow="md" width={140} position="bottom-end" radius="md">
                <Menu.Target>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDotsVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconPower size={14} />}
                    color={rowData.enabled ? "orange" : "green"}
                    onClick={(e) => {
                      e.stopPropagation();
                    //   handleToggleEnable(rowData.id, rowData.enabled);
                    }}
                  >
                    {rowData.enabled ? "Disable" : "Enable"}
                  </Menu.Item>
                  <Menu.Item
                    color="danger"
                    leftSection={<IconTrash size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                    //   handleDelete(rowData.id);
                    }}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .scheduler-search:focus-within { box-shadow: ${theme.other?.searchFocusRing || "none"}; }
        .scheduler-row-actions { opacity: 1; }
        .scheduler-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .scheduler-row:hover td { background: ${theme.other?.rowHoverBg || "var(--mantine-color-gray-0)"} !important; }
        .scheduler-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .scheduler-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .scheduler-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Header Area */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other?.brandGradient || "var(--mantine-color-blue-6)",
              boxShadow: theme.other?.brandGlowShadow || "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCalendarClock size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Scheduler
            </Title>
            <Text fz="sm" c="slate.5">
              Manage your scheduler
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar Area */}
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
            className="scheduler-search"
            size="sm"
            radius="xl"
            placeholder="Search by name or frequency"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.currentTarget.value);
              setPage(1);
            }}
          />

          <Button
            size="sm"
            radius="xl"
            variant="default"
            px="sm"
            style={{ flexShrink: 0 }}
            onClick={() => { setSearchInput(""); setPage(1); }}
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
              background: theme.other?.brandGradient || "var(--mantine-color-blue-6)",
            }}
            onClick={handleAddClick}
            leftSection={<IconPlus size={14} />}
          >
            Add Scheduler
          </Button>
        </Group>
      </Paper>

      {/* Table Area */}
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
                    return (
                      <Table.Th
                        key={header.id}
                        className="scheduler-thead-cell"
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
                        <IconCalendarClock size={24} color="var(--mantine-color-slate-4)" />
                      </Box>
                      <Text ta="center" c="slate.5" fz="xs">
                        No schedulers match your search.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => (
                  <Table.Tr
                    key={row.id}
                    className="scheduler-row"
                    style={{ cursor: "pointer" }}
                    onDoubleClick={() => console.log("Row double-clicked", row.original)}
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: "10px 10px",
                          border: "none",
                          boxShadow: "var(--mantine-shadow-xs)",
                          borderLeft:
                            idx === 0
                              ? `3px solid var(--mantine-color-brand-4)`
                              : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        <Group justify="space-between" px="sm" pt="xs">
          <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
            <span>
              {totalRows === 0
                ? "Showing 0 of 0"
                : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
            </span>
            <Group gap="xs">
              <span>Rows:</span>
              <Select
                data={["10", "20", "50"]}
                value={String(pageSize)}
                onChange={(v) => {
                  setPageSize(Number(v) || 10);
                  setPage(1);
                }}
                rightSection={chevronDown}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={totalPages}
            value={page}
            onChange={(p) => setPage(p)}
            color="brand"
            size="xs"
            radius="xl"
            disabled={totalRows === 0}
          />
        </Group>
      </Paper>
    </Stack>
  );
}

export default SchedulerPage;