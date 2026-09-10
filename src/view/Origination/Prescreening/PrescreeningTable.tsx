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
  IconAdjustments,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

// MOCK DATA for Prescreening
export interface PrescreeningRow {
  id: string;
  name: string;
  applicant: string;
  amount: number;
  creditScore: number | null;
  obligations: number | null;
  status: string;
}

const MOCK_DATA: PrescreeningRow[] = [
  {
    id: "APP-58231",
    name: "APP-58231",
    applicant: "Chanda Mwansa",
    amount: 76500,
    creditScore: 742,
    obligations: 3850,
    status: "Pending",
  },
  {
    id: "APP-58232",
    name: "APP-58232",
    applicant: "Vinod Kumain",
    amount: 50000,
    creditScore: 680,
    obligations: 1200,
    status: "Passed",
  },
  {
    id: "APP-58233",
    name: "APP-58233",
    applicant: "Simon Zimba",
    amount: 5700,
    creditScore: 520,
    obligations: 4500,
    status: "Failed",
  },
  {
    id: "APP-58234",
    name: "APP-58234",
    applicant: "Mwangi Zimba",
    amount: 100000,
    creditScore: null,
    obligations: null,
    status: "Pending",
  },
];

const columnHelper = createColumnHelper<PrescreeningRow>();

export const STATUS_COLOR: Record<string, string> = {
  Pending: "warning",
  Passed: "success",
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

export function PrescreeningTable() {
  const theme = useMantineTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  
  // Filter data
  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (status !== "All" && item.status !== status) return false;
      if (search) {
        const query = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.applicant.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [search, status]);

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
      columnHelper.accessor("amount", {
        header: "Requested Amount",
        cell: (info) => (
          <Text fz="xs" fw={700} c="slate.7">
            ZMW {info.getValue().toLocaleString()}
          </Text>
        ),
      }),
      columnHelper.accessor("creditScore", {
        header: "Credit Score",
        cell: (info) => {
          const score = info.getValue();
          if (!score) return <Text fz="xs" c="slate.4">Pending check</Text>;
          return (
            <Group gap={4}>
              <Text fz="xs" fw={600} c={score > 650 ? "success.6" : "danger.6"}>
                {score}
              </Text>
            </Group>
          );
        },
      }),
      columnHelper.accessor("obligations", {
        header: "Monthly Obligations",
        cell: (info) => {
          const obs = info.getValue();
          if (!obs) return <Text fz="xs" c="slate.4">Pending check</Text>;
          return (
            <Text fz="xs" fw={600} c="slate.7">
              ZMW {obs.toLocaleString()}
            </Text>
          );
        },
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
          <Group gap={4} justify="flex-end" wrap="nowrap">
            <Tooltip label="View Details" withArrow>
              <ActionIcon size="sm" variant="subtle" color="slate" radius="md">
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Run Prescreening" withArrow>
              <ActionIcon size="sm" variant="subtle" color="brand" radius="md">
                <IconAdjustments size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

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
            <IconFileText size={22} />
          </Box>
          <Stack gap={2}>
            <Title order={2} fz={22} fw={800} c="slate.9">
              Prescreening
            </Title>
            <Text fz="sm" c="slate.5">
              Review applications and run prescreening checks
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar */}
      <Paper p="xs" radius="md" style={{ border: "1px solid var(--mantine-color-slate-2)" }} mb="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" style={{ flex: 1 }}>
            <TextInput
              placeholder="Application / Applicant / Customer"
              leftSection={<IconSearch size={14} color="var(--mantine-color-slate-4)" />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              radius="md"
              size="sm"
              w={300}
            />
            <Select
              data={["All Types", "Personal Loan", "Business Loan", "Mortgage"]}
              defaultValue="All Types"
              radius="md"
              size="sm"
              w={160}
            />
          </Group>
          <Group gap="sm">
            <Group gap={6} p={4} style={{ background: "var(--mantine-color-slate-0)", borderRadius: "var(--mantine-radius-xl)", border: "1px solid var(--mantine-color-slate-2)" }}>
              {["All", "Pending", "Passed", "Failed"].map((tab) => (
                <Button
                  key={tab}
                  variant={status === tab ? "filled" : "subtle"}
                  color={status === tab ? "brand" : "slate"}
                  size="xs"
                  radius="xl"
                  onClick={() => setStatus(tab)}
                  style={{ height: 26, padding: "0 12px" }}
                >
                  {tab}
                </Button>
              ))}
            </Group>
            <Button
              variant="default"
              size="sm"
              radius="md"
              onClick={() => {
                setSearch("");
                setStatus("All");
              }}
            >
              Reset
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Table */}
      <Paper radius="md" style={{ border: "1px solid var(--mantine-color-slate-2)", overflow: "hidden" }}>
        <Box style={{ overflowX: "auto" }}>
          <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" striped>
            <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort() ? "pointer" : "default",
                        whiteSpace: "nowrap",
                        padding: "12px 16px",
                      }}
                    >
                      <Group gap={4} wrap="nowrap" justify={header.id === "actions" ? "flex-end" : "flex-start"}>
                        <Text fz="xs" fw={700} c="slate.5" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Text>
                        {header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
                      </Group>
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={columns.length} style={{ textAlign: "center", padding: "40px" }}>
                    <Text c="slate.5">No applications found in Prescreening</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
        <Group justify="space-between" align="center" p="md" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
          <Text fz="sm" c="slate.5">
            Showing {table.getRowModel().rows.length} rows
          </Text>
          <Pagination
            total={table.getPageCount()}
            value={table.getState().pagination.pageIndex + 1}
            onChange={(page) => table.setPageIndex(page - 1)}
            size="sm"
            radius="md"
            color="brand"
          />
        </Group>
      </Paper>
    </Box>
  );
}
