import { useMemo, useState } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Loader,
  Menu,
  useMantineTheme,
} from "@mantine/core";
import {
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconClipboardList,
  IconTrash,
  IconAlertTriangle,
  IconEye,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";

import { loanApplicationModal } from "../../components/Modal/LoanApplication/loanApplicationModalStore";
import { LoanApplicationDetailView } from "./LoanApplicationDetailView";
import * as LoanApplicationApi from "../../api/LosConfiguration/LoanApplicationApi";
import type { ApplicantType, LoanApplicationListRow } from "../../api/LosConfiguration/LoanApplicationApi";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { useCompanyStore } from "../../store/companyStore";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { formatAmount } from "../../store/currencyStore";
import { getWorkflowActions } from "../../api/workflowApi";
import type { WorkflowAction } from "../../types/workflow";
import { useApplicationWorkflow } from "./useApplicationWorkflow";
import { ORIGINATION_STAGES, type OriginationStageKey } from "./stages";

export type LoanApplicationRow = LoanApplicationListRow;

const columnHelper = createColumnHelper<LoanApplicationRow>();

const APPLICANT_TYPES: ApplicantType[] = ["Individual", "Business"];
const SORTABLE_COLUMNS: Record<string, string> = { name: "name", requested_amount: "requested_amount" };

export const STATUS_COLOR: Record<string, string> = {
  Draft: "warning",
  Submitted: "info",
  Approved: "success",
  Rejected: "danger",
  Cancelled: "slate",
  "Pre-Screening": "info",
  Appraisal: "info",
  Underwriting: "grape",
  Offer: "grape",
};

export const CLOSED_STATUSES = ["Approved", "Rejected", "Cancelled"];

export const displayStatus = (row: { status: string; workflow_state?: string | null }) => row.workflow_state || row.status;

function WorkflowMenu({
  row,
  onSelect,
  onViewDetails,
}: {
  row: LoanApplicationRow;
  onSelect: (action: string, actions: WorkflowAction[]) => void;
  onViewDetails: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const { data, isFetching } = useQuery({
    queryKey: ["los-workflow-actions", row.name],
    queryFn: () => getWorkflowActions(LoanApplicationApi.LOAN_APPLICATION_DOCTYPE, row.name),
    enabled: opened,
    staleTime: 0,
  });
  const actions = data?.allowed_actions ?? [];
  return (
    <Menu shadow="md" width={200} position="bottom-end" opened={opened} onChange={setOpened}>
      <Menu.Target>
        <ActionIcon size="sm" variant="subtle" color="gray">
          <IconDotsVertical size={14} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            setOpened(false);
            onViewDetails();
          }}
        >
          View details
        </Menu.Item>
        <Menu.Divider />
        {isFetching && !data ? (
          <Menu.Item disabled leftSection={<Loader size={12} />}>
            Loading actions…
          </Menu.Item>
        ) : actions.length === 0 ? (
          <Menu.Item disabled>No actions available</Menu.Item>
        ) : (
          actions.map((wf) => (
            <Menu.Item
              key={wf.action}
              onClick={() => {
                setOpened(false);
                onSelect(wf.action, actions);
              }}
            >
              {wf.action}
            </Menu.Item>
          ))
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-4)";
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
        <IconClipboardList size={14} color="var(--mantine-color-brand-6)" />
      </Box>
      <Text fz={11} fw={700} c="slate.8" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
        {name}
      </Text>
    </Group>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function LoanApplication({ stage = "application" }: { stage?: OriginationStageKey }) {
  const stageConfig = ORIGINATION_STAGES[stage];
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const { modal: workflowModal, openAction } = useApplicationWorkflow();

  const [viewingApplicationId, setViewingApplicationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [applicantType, setApplicantType] = useState<ApplicantType | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const listParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(applicantType && { applicant_type: applicantType }),
      workflow_state: stageConfig.workflowState,
      ...(sorting[0] && {
        sort_by: SORTABLE_COLUMNS[sorting[0].id],
        sort_order: sorting[0].desc ? ("desc" as const) : ("asc" as const),
      }),
    }),
    [pagination, debouncedSearch, applicantType, sorting, stageConfig.workflowState],
  );

  const {
    data: applicationsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["los-loan-applications", listParams],
    queryFn: () => LoanApplicationApi.getAll(listParams),
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const data = useMemo(() => applicationsResponse?.data ?? [], [applicationsResponse]);
  const totalRows = applicationsResponse?.pagination?.total ?? 0;
  const pageCount = Math.max(1, applicationsResponse?.pagination?.total_pages ?? 1);

  const deleteMutation = useMutation({
    mutationFn: LoanApplicationApi.remove,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["los-loan-applications"] });
      openCommonModal({
        heading: "Application Deleted",
        subtitle: "",
        body: `Loan application ${id} was deleted.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
    },
  });

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const handleAdd = () => loanApplicationModal.open({ loanApplicationId: null });

  const handleOpen = (id: string, readOnly: boolean) => stageConfig.openModal(id, readOnly);

  const handleViewDetails = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["los-loan-application", id] });
    setViewingApplicationId(id);
  };

  const confirmDelete = (id: string) => {
    openCommonModal({
      heading: "Delete Loan Application",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        { label: "Delete", color: "red", onClick: () => deleteMutation.mutate(id) },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Application",
        cell: (info) => <ApplicationIdCell name={info.getValue()} />,
      }),
      columnHelper.accessor("applicant_name", {
        header: "Applicant",
        enableSorting: false,
        cell: (info) => (
          <Text fz={11} fw={600} c="slate.7" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
            {info.getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.accessor("requested_amount", {
        header: "Amount",
        cell: (info) => {
          const value = info.getValue();
          if (value === null || value === undefined) {
            return (
              <Text fz={11} c="slate.6">
                —
              </Text>
            );
          }
          return (
            <Text fz={11} c="slate.8" fw={600} style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
              {formatAmount(companyCurrency, value, { withSymbol: true })}
            </Text>
          );
        },
      }),
      columnHelper.accessor("applicant_type", {
        header: "Type",
        enableSorting: false,
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color="brand"
            styles={{ root: { fontSize: 10, padding: "0 8px" } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("customer_name", {
        header: "Customer",
        enableSorting: false,
        cell: (info) => (
          <Text fz={11} c="slate.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
            {info.getValue() || info.row.original.customer || "—"}
          </Text>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        enableSorting: false,
        cell: (info) => (
          <Group gap={6} wrap="nowrap">
            <StatusBadge status={displayStatus(info.row.original)} />
            {info.row.original.custom_status && info.row.original.custom_status !== displayStatus(info.row.original) && (
              <Text fz={10.5} c="slate.6" fw={600}>
                {info.row.original.custom_status}
              </Text>
            )}
          </Group>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz={11} fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isDraft = row.status === "Draft";
          const canEdit = !CLOSED_STATUSES.includes(row.status);
          return (
            <Group justify="flex-end" gap={6} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleOpen(row.name, true)}>
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={canEdit ? "Edit" : "Closed applications cannot be edited"} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={canEdit ? "brand" : "gray"}
                  disabled={!canEdit}
                  onClick={() => handleOpen(row.name, false)}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isDraft ? "Delete" : "Only draft applications can be deleted"} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={isDraft ? "danger" : "gray"}
                  disabled={!isDraft || deleteMutation.isPending}
                  onClick={() => confirmDelete(row.name)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <WorkflowMenu
                row={row}
                onViewDetails={() => handleViewDetails(row.name)}
                onSelect={(action, actions) =>
                  openAction({ id: row.name, applicantName: row.applicant_name, actions, preselectedAction: action })
                }
              />
            </Group>
          );
        },
      }),
    ],
    [companyCurrency, deleteMutation.isPending, openAction, stageConfig],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      resetPage();
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = pagination;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(totalRows, pageIndex * pageSize + rows.length);

  const resetFilters = () => {
    setSearch("");
    setApplicantType(null);
    setSorting([]);
    resetPage();
  };

  if (viewingApplicationId !== null) {
    const application = data.find((a) => a.name === viewingApplicationId);
    if (application) {
      return (
        <Box p="xl" mt="xl">
          <LoanApplicationDetailView
            application={application}
            onBack={() => setViewingApplicationId(null)}
            onEdit={() => {
              setViewingApplicationId(null);
              handleOpen(application.name, false);
            }}
          />
        </Box>
      );
    }
  }

  return (
    <Stack gap="lg" p="lg">
      {workflowModal}
      <style>{`
  .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
  .lms-row-actions { opacity: 1; }
  .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
  .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
  .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
  .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
  .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
`}</style>

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
            <IconClipboardList size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              {stageConfig.title}
            </Title>
            <Text fz="sm" c="slate.5">
              {stageConfig.subtitle}
            </Text>
          </Stack>
        </Group>
      </Group>

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
            placeholder="Application / Applicant / Company / NRC / Phone"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 260 }}
            styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              resetPage();
            }}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Types"
            data={APPLICANT_TYPES}
            w={166}
            clearable
            rightSection={chevronDown}
            value={applicantType}
            onChange={(v) => {
              setApplicantType(v as ApplicantType | null);
              resetPage();
            }}
          />

          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>
              Reset
            </Button>
            {stageConfig.canCreate && (
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={handleAdd}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              New Application
            </Button>
            )}
          </Group>
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {isLoading ? (
          <Stack align="center" gap="xs" py="xl">
            <Loader size="sm" color="brand" />
            <Text ta="center" c="slate.5" fz={11}>
              Loading loan applications…
            </Text>
          </Stack>
        ) : isError ? (
          <Stack align="center" gap="xs" py="xl">
            <IconAlertTriangle size={26} color="var(--mantine-color-danger-5)" />
            <Text ta="center" c="danger.6" fz={11}>
              Couldn't load loan applications. Please try again.
            </Text>
          </Stack>
        ) : (
          <>
            <Box
              style={{
                height: "clamp(320px, calc(100vh - 280px), 720px)",
                overflowY: "auto",
              }}
            >
              <Table
                verticalSpacing={6}
                horizontalSpacing="sm"
                fz={11}
                w="100%"
                style={{ borderCollapse: "separate", borderSpacing: "0 6px" }}
              >
                <Table.Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort() && header.column.id in SORTABLE_COLUMNS;
                        return (
                          <Table.Th
                            key={header.id}
                            className="lms-thead-cell"
                            c="slate.5"
                            fw={700}
                            style={{
                              fontSize: 10,
                              padding: "0 12px 4px",
                              userSelect: "none",
                              cursor: canSort ? "pointer" : "default",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              border: "none",
                            }}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          >
                            <Group gap="xs" wrap="nowrap" justify={header.id === "actions" ? "flex-end" : "flex-start"}>
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
                            <IconClipboardList size={26} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz={11}>
                            No loan applications match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const scale = STATUS_COLOR[displayStatus(row.original)] ?? "slate";
                      return (
                        <Table.Tr
                          key={row.id}
                          className="lms-row"
                          onDoubleClick={() => handleOpen(row.original.name, true)}
                          style={{ cursor: "pointer" }}
                        >
                          {row.getVisibleCells().map((cell, idx) => (
                            <Table.Td
                              key={cell.id}
                              style={{
                                padding: "8px 12px",
                                border: "none",
                                boxShadow: "var(--mantine-shadow-xs)",
                                borderLeft: idx === 0 ? `3px solid var(--mantine-color-${scale}-4)` : undefined,
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </Box>
            <Group justify="space-between" px="sm" pt="xs">
              <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
                <span>{totalRows === 0 ? "Showing 0 of 0" : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
                <Group gap="xs">
                  <span>Rows:</span>
                  <Select
                    data={["10", "20", "50"]}
                    value={String(pageSize)}
                    onChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) || 20 })}
                    rightSection={chevronDown}
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination
                total={pageCount}
                value={pageIndex + 1}
                onChange={(p) => setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))}
                color="brand"
                size="xs"
                radius="xl"
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
