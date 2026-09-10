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
  IconTrash,
  IconDotsVertical,
  IconSignature,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { offerModal } from "../../../components/Modal/OfferSigning/offerSigningModalStore";

// MOCK DATA for Offer & Signing
export interface OfferRow {
  id: string;
  name: string;
  applicant: string;
  approvedAmount: number;
  offerStatus: string;
  contractStatus: string;
  signingMethod: string;
}

const MOCK_DATA: OfferRow[] = [
  {
    id: "APP-58231",
    name: "APP-58231",
    applicant: "Chanda Mwansa",
    approvedAmount: 61000,
    offerStatus: "Awaiting decision",
    contractStatus: "Not Generated",
    signingMethod: "—",
  },
  {
    id: "APP-58232",
    name: "APP-58232",
    applicant: "Vinod Kumain",
    approvedAmount: 50000,
    offerStatus: "Accepted",
    contractStatus: "Executed",
    signingMethod: "E-signature",
  },
  {
    id: "APP-58233",
    name: "APP-58233",
    applicant: "Simon Zimba",
    approvedAmount: 5700,
    offerStatus: "Rejected",
    contractStatus: "Not Generated",
    signingMethod: "—",
  },
  {
    id: "APP-58234",
    name: "APP-58234",
    applicant: "Bwembya Kunda",
    approvedAmount: 88000,
    offerStatus: "Amendment requested",
    contractStatus: "Not Generated",
    signingMethod: "—",
  },
  {
    id: "APP-58235",
    name: "APP-58235",
    applicant: "Mwangi Zimba",
    approvedAmount: 42000,
    offerStatus: "Accepted",
    contractStatus: "Signing in progress",
    signingMethod: "Physical signature",
  },
];

const columnHelper = createColumnHelper<OfferRow>();

export const OFFER_STATUS_COLOR: Record<string, string> = {
  "Awaiting decision": "slate",
  Accepted: "success",
  Rejected: "danger",
  "Amendment requested": "warning",
};

export const CONTRACT_STATUS_COLOR: Record<string, string> = {
  "Not Generated": "slate",
  Generated: "brand",
  "Signing in progress": "warning",
  Executed: "success",
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function OfferStatusBadge({ status }: { status: string }) {
  const scale = OFFER_STATUS_COLOR[status] ?? "slate";
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

function ContractStatusBadge({ status }: { status: string }) {
  const scale = CONTRACT_STATUS_COLOR[status] ?? "slate";
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

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function OfferIssuanceStage() {
  const theme = useMantineTheme();
  const [search, setSearch] = useState("");
  const [offerStatus, setOfferStatus] = useState("all");
  const [applicationType, setApplicationType] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filter data
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_DATA.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.applicant.toLowerCase().includes(q);
      const matchesType = !applicationType || applicationType === "All Types";
      const matchesStatus = offerStatus === "all" || item.offerStatus === offerStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, offerStatus, applicationType]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Application",
        cell: (info) => <ApplicationIdCell name={info.getValue()} />,
      }),
      columnHelper.accessor("applicant", {
        header: "Applicant",
        cell: (info) => (
          <Text
            fz="xs"
            fw={600}
            c="slate.7"
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("approvedAmount", {
        header: "Approved Amount",
        cell: (info) => (
          <Text
            fz="xs"
            c="slate.8"
            fw={600}
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            ZMW {info.getValue().toLocaleString()}
          </Text>
        ),
      }),
      columnHelper.accessor("offerStatus", {
        header: "Offer Status",
        cell: (info) => <OfferStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("contractStatus", {
        header: "Contract Status",
        cell: (info) => <ContractStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("signingMethod", {
        header: "Signing Method",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
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
        cell: () => (
          <Group gap={6} justify="flex-end" wrap="nowrap" className="lms-row-actions">
             <Tooltip label="View Details" withArrow>
                         <ActionIcon
                           size="sm"
                           variant="subtle"
                           color="gray"
                           onClick={() => offerModal.open({ applicationValues: undefined })}
                         >
                           <IconEye size={14} />
                         </ActionIcon>
                       </Tooltip>
                                    <Tooltip label="Edit" withArrow>
                                     <ActionIcon
                                       size="sm"
                                       variant="subtle"
                                       color="gray"
                                       onClick={() => offerModal.open({ applicationValues: undefined })}
                                     >
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

  const rows = table.getRowModel().rows;
  const totalRows = filteredData.length;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  const resetFilters = () => {
    setSearch("");
    setApplicationType(null);
    setOfferStatus("all");
  };

  return (
    <Stack gap="lg" p="lg">
      <style>{`
  .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
  .lms-row-actions { opacity: 1; }
  .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
  .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
  .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
  .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
  .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
`}</style>

      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSignature
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Offer &amp; Signing
            </Title>
            <Text fz="sm" c="slate.5">
              Issue offers, track acceptance, and manage contract execution
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
            rightSection={chevronDown}
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
            value={offerStatus}
            onChange={(v) => {
              setOfferStatus(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            data={[
              { label: "All", value: "all" },
              { label: "Awaiting", value: "Awaiting decision" },
              { label: "Accepted", value: "Accepted" },
              { label: "Rejected", value: "Rejected" },
              { label: "Amendment", value: "Amendment requested" },
            ]}
          />

          <Group gap="xs" ml="auto">
            <Button
              size="sm"
              radius="xl"
              variant="default"
              px="md"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => {}}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Issue Offer
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
                        No applications match your filters.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row) => {
                  const scale = OFFER_STATUS_COLOR[row.original.offerStatus] ?? "slate";
                  const cells = row.getVisibleCells();
                  return (
                    <Table.Tr
                      key={row.id}
                      className="lms-row"
                      style={{ cursor: "pointer" }}
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
        <Group justify="space-between" px="sm" pt="xs">
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
                rightSection={chevronDown}
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
      </Box>
    </Stack>
  );
}