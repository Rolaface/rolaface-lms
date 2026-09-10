import { useMemo, useState } from "react";
import {
  Box,
  Button,
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
  Title,
  Stack,
  useMantineTheme,
  SegmentedControl,
  Menu,
} from "@mantine/core";
import {
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconFileText,
  IconEye,
  IconDatabase,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

// MOCK DATA for Enrichment
export interface EnrichmentRow {
  id: string;
  name: string;
  applicant: string;
  approvedAmount: number;
  tenure: number;
  rate: number;
  status: string;
}

const MOCK_DATA: EnrichmentRow[] = [
  {
    id: "APP-58231",
    name: "APP-58231",
    applicant: "Chanda Mwansa",
    approvedAmount: 76500,
    tenure: 24,
    rate: 25,
    status: "Pending Data",
  },
  {
    id: "APP-58232",
    name: "APP-58232",
    applicant: "Vinod Kumain",
    approvedAmount: 50000,
    tenure: 12,
    rate: 21,
    status: "Enriched",
  },
  {
    id: "APP-58233",
    name: "APP-58233",
    applicant: "Simon Zimba",
    approvedAmount: 5700,
    tenure: 6,
    rate: 28,
    status: "Failed",
  },
];

const columnHelper = createColumnHelper<EnrichmentRow>();

export const STATUS_COLOR: Record<string, string> = {
  "Pending Data": "warning",
  Enriched: "success",
  Failed: "danger",
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ status }: { status: string }) {
  const scale = STATUS_COLOR[status] ?? "slate";
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{
            borderRadius: "50%",
            background: `var(--mantine-color-${scale}-6)`,
          }}
        />
      }
    >
      {status}
    </Badge>
  );
}

function ApplicationIdCell({ name }: { name: string }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        style={{
          width: 30,
          height: 30,
          borderRadius: "var(--mantine-radius-md)",
          background: "var(--mantine-color-brand-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconFileText size={14} color="var(--mantine-color-brand-6)" />
      </Box>
      <Text
        fz="xs"
        fw={700}
        c="slate.8"
        style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
      >
        {name}
      </Text>
    </Group>
  );
  }

: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

export function EnrichmentTable() {
  const theme = useMantineTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [applicationType, setApplicationType] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  
  // Filter data
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (status !== "All" && item.status !== status) return false;
      if (applicationType && applicationType !== "All Types") {
        // Mock data doesn't have application_type in Enrichment anymore. Skip for dummy logic.
      }
      if (search) {
        const query = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.applicant.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [search, status, applicationType]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Application",
        cell: (info) => <ApplicationIdCell name={info.getValue()} />,
      }),
      columnHelper.accessor("applicant", {
        header: "Applicant",
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("approvedAmount", {
        header: "Approved Amount",
        cell: (info) => (
          <Text fz="xs" fw={700} c="slate.7">
            ZMW {info.getValue().toLocaleString()}
          </Text>
        ),
      }),
      columnHelper.accessor("tenure", {
        header: "Tenure",
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7">
            {info.getValue()} Months
          </Text>
        ),
      }),
      columnHelper.accessor("rate", {
        header: "Interest Rate",
        cell: (info) => (
          <Text fz="xs" fw={600} c="slate.7">
            {info.getValue()}%
          </Text>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => (
          <Group gap={6} justify="flex-end" wrap="nowrap" className="lms-row-actions">
            <Tooltip label="View Details" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray">
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray">
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray">
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
            <Menu position="bottom-end" shadow="sm" withArrow>
              <Menu.Target>
                <ActionIcon size="sm" variant="subtle" color="gray">
                  <IconDotsVertical size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item>More Options</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      }),
    ],
    []
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

  const totalRows = filteredData.length;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <Box p="md">
      {/* Header */}
      <Group justify="space-between" align="flex-end" mb="lg">
        <Group gap="md">
          <Box
            w={44}
            h={44}
            style={{
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other?.brandGradient || "var(--mantine-color-brand-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: theme.other?.brandGlowShadow || "none",
            }}
          >
            <IconDatabase size={22} />
          </Box>
          <Stack gap={2}>
            <Title order={2} fz={22} fw={800} c="slate.9">
              Data Enrichment
            </Title>
            <Text fz="sm" c="slate.5">
              Review and finalize loan terms for approved applications
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
        mb="md"
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Application / Applicant / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 260 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Types"
            data={["Personal loan", "Business loan", "Mortgage"]}
            w={166}
            searchable
            clearable
            rightSection={<IconChevronDown size={14} style={{ opacity: 0.6 }} />}
            value={applicationType}
            onChange={(v) => {
              setApplicationType(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            data={[
              { label: "All", value: "All" },
              { label: "Pending", value: "Pending Data" },
              { label: "Enriched", value: "Enriched" },
              { label: "Failed", value: "Failed" },
            ]}
          />

          <Group gap="xs" ml="auto">
            <Button
              size="sm"
              radius="xl"
              variant="default"
              px="md"
              onClick={() => {
                setSearch("");
                setApplicationType(null);
                setStatus("All");
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => {}}
              leftSection={<IconPlus size={14} />}
            >
              Configure Enrichment
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <Box style={{ overflowX: "auto" }}>
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
                        justify={
                          header.id === "actions"
                            ? "flex-end"
                            : "flex-start"
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && (
                          <SortIcon
                            sorted={header.column.getIsSorted()}
                          />
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
                        size={26}
                        color="var(--mantine-color-slate-4)"
                      />
                    </Box>
                    <Text ta="center" c="slate.5" fz="xs">
                      No enrichment applications match your filters.
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => {
                const scale = STATUS_COLOR[row.original.status] ?? "slate";
                const cells = row.getVisibleCells();
                return (
                  <Table.Tr
                    key={row.id}
                    className="lms-row"
                    style={{ cursor: "pointer", background: "var(--mantine-color-white)" }}
                  >
                    {cells.map((cell, idx) => (
                      <Table.Td
                        key={cell.id}
                        style={{
                          padding: "10px 10px",
                          border: "none",
                          boxShadow: "var(--mantine-shadow-xs)",
                          borderLeft:
                            idx === 0
                              ? `3px solid var(--mantine-color-${scale}-4)`
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
        {/* Pagination Footer */}
        <Group justify="space-between" px="sm" pt="xs" pb="xs">
          <Group
            gap="sm"
            c="slate.6"
            style={{ fontSize: "var(--mantine-font-size-xs)" }}
          >
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
                onChange={(v) =>
                  setPagination({ pageIndex: 0, pageSize: Number(v) || 10 })
                }
                rightSection={<IconChevronDown size={14} style={{ opacity: 0.6 }} />}
                size="xs"
                radius="xl"
                w={60}
              />
            </Group>
          </Group>
          <Pagination
            total={table.getPageCount() || 1}
            value={pageIndex + 1}
            onChange={(p) =>
              setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
            }
            color="brand"
            size="xs"
            radius="xl"
          />
        </Group>
      </Paper>
    </Box>
  );
}
