import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Divider,
    Group,
    Loader,
    Pagination,
    Paper,
    RingProgress,
    ScrollArea,
    SegmentedControl,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    ThemeIcon,
    Title,
    Tooltip,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
    IconAlertCircle,
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconClock,
    IconDownload,
    IconEye,
    IconFileText,
    IconFilter,
    IconRefresh,
    IconSearch,
    IconSelector,
    IconX,
} from "@tabler/icons-react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";

import { getAllLoanApplications } from "../../../api/loanApplicationApi";
import type { LoanApplicationRow } from "../../Origination/LoanApplication";
import { loanApplicationModal } from "../../../components/Modal/LoanApplication/loanApplicationModalStore";

type ReportRow = LoanApplicationRow & {
    loan_product?: string | null;
};

type Filters = {
    status: string | null;
    product: string | null;
    branch: string | null;
    stage: string | null;
    from: string;
    to: string;
};

type TatMetric = {
    label: string;
    value: number | null;
    target: number | null;
};

const PAGE_SIZES = ["10", "20", "50"];

const REVIEW_STATUSES = new Set([
    "Pending",
    "Under Review",
    "Ready for Approval",
    "Additional Information Required",
]);

const REVIEW_STAGES = new Set([
    "Prescreening",
    "Enrichment",
    "Underwriting",
    "Decision",
]);

const PIPELINE = [
    "Application Intake",
    "Prescreening",
    "Enrichment",
    "Underwriting",
    "Decision",
] as const;

const STATUS_META = [
    { label: "Approved", color: "teal.6" },
    { label: "Pending", color: "yellow.6" },
    { label: "Rejected", color: "red.5" },
    { label: "On Hold", color: "slate.5" },
];

const STATUS_COLOR: Record<string, string> = {
    Approved: "#4C3BC9",
    Pending: "yellow",
    Rejected: "red",
    Created: "teal",
    "Under Review": "grape",
    "Ready for Approval": "blue",
    "Additional Information Required": "orange",
    Rejection: "red",
};

const STAGE_COLOR: Record<string, string> = {
    Prescreening: "violet",
    Enrichment: "teal",
    Underwriting: "yellow",
    Decision: "grape",
};

const TAT_CONFIG = [
    {
        label: "Application → Prescreening",
        value: [
            "tat_application_to_prescreening_hours",
            "application_to_prescreening_tat_hours",
            "applicationToPrescreeningTatHours",
        ],
        target: [
            "sla_application_to_prescreening_hours",
            "application_to_prescreening_sla_hours",
        ],
    },
    {
        label: "Prescreening → Enrichment",
        value: [
            "tat_prescreening_to_enrichment_hours",
            "prescreening_to_enrichment_tat_hours",
            "prescreeningToEnrichmentTatHours",
        ],
        target: [
            "sla_prescreening_to_enrichment_hours",
            "prescreening_to_enrichment_sla_hours",
        ],
    },
    {
        label: "Enrichment → Underwriting",
        value: [
            "tat_enrichment_to_underwriting_hours",
            "enrichment_to_underwriting_tat_hours",
            "enrichmentToUnderwritingTatHours",
        ],
        target: [
            "sla_enrichment_to_underwriting_hours",
            "enrichment_to_underwriting_sla_hours",
        ],
    },
    {
        label: "Underwriting → Decision",
        value: [
            "tat_underwriting_to_decision_hours",
            "underwriting_to_decision_tat_hours",
            "underwritingToDecisionTatHours",
        ],
        target: [
            "sla_underwriting_to_decision_hours",
            "underwriting_to_decision_sla_hours",
        ],
    },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function obj(row: ReportRow) {
    return row as unknown as Record<string, unknown>;
}

function pick(row: ReportRow, fields: string[]) {
    const source = obj(row);

    for (const field of fields) {
        const value = field.split(".").reduce<unknown>(
            (current, key) =>
                current && typeof current === "object" && !Array.isArray(current)
                    ? (current as Record<string, unknown>)[key]
                    : null,
            source,
        );

        if (value !== null && value !== undefined && value !== "") {
            return value;
        }
    }

    return null;
}

function textValue(row: ReportRow, fields: string[]) {
    const value = pick(row, fields);

    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (value && typeof value === "object") {
        const data = value as Record<string, unknown>;

        return (
            [data.name, data.full_name, data.fullName, data.label, data.title]
                .find((item) => typeof item === "string" && item.trim()) as string | undefined
        ) || null;
    }

    return null;
}

function numberValue(row: ReportRow, fields: string[]) {
    const value = pick(row, fields);

    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value.replace(/[^0-9.-]/g, ""));
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function normalizeRows(payload: unknown): ReportRow[] {
    if (Array.isArray(payload)) {
        return payload.filter(Boolean) as ReportRow[];
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    const root = payload as Record<string, unknown>;

    for (const value of [
        root.data,
        root.results,
        root.items,
        root.applications,
        root.loan_applications,
    ]) {
        if (Array.isArray(value)) {
            return value.filter(Boolean) as ReportRow[];
        }

        if (value && typeof value === "object") {
            const nested = value as Record<string, unknown>;

            for (const key of ["data", "results", "items"]) {
                if (Array.isArray(nested[key])) {
                    return nested[key].filter(Boolean) as ReportRow[];
                }
            }
        }
    }

    return [];
}

function statusOf(row: ReportRow) {
    const raw = String(
        row.status ||
        row.loan_application_status ||
        row.workflow_state ||
        "Unknown",
    );

    if (raw === "Cancelled") return "Rejected";
    if (raw === "Submitted") return "Approved";

    return raw;
}

function stageOf(row: ReportRow) {
    const value = textValue(row, [
        "current_stage",
        "currentStage",
        "stage",
        "workflow_stage",
        "workflowStage",
        "loan_stage",
        "application_stage",
    ]);

    const raw = value || String(row.workflow_state || "");

    const normalized = raw.toLowerCase().replace(/[_-]/g, " ");

    return (
        {
            "pre screening": "Prescreening",
            prescreening: "Prescreening",
            enrichment: "Enrichment",
            underwriting: "Underwriting",
            decision: "Decision",
        }[normalized] || value || "—"
    );
}

function applicantOf(row: ReportRow) {
    if (row.application_type === "Business Loan") {
        return row.company_name || "—";
    }

    return (
        [row.first_name, row.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "—"
    );
}

function customerIdOf(row: ReportRow) {
    return textValue(row, [
        "customer_id",
        "customerId",
        "customer.customer_id",
        "customer.customerId",
    ]);
}

function productOf(row: ReportRow) {
    return row.loan_product || "—";
}

function branchOf(row: ReportRow) {
    return (
        textValue(row, [
            "branch",
            "branch_name",
            "branchName",
            "branch.name",
            "location",
        ]) || "—"
    );
}

function approvedOf(row: ReportRow) {
    return numberValue(row, [
        "approved_amount",
        "approvedAmount",
        "loan_approved_amount",
        "sanctioned_amount",
        "sanctionedAmount",
    ]);
}

function disbursedOf(row: ReportRow) {
    return numberValue(row, [
        "disbursed_amount",
        "disbursedAmount",
        "total_disbursed",
        "totalDisbursed",
        "disbursement_amount",
        "amount_disbursed",
    ]);
}

function officerOf(row: ReportRow) {
    return (
        textValue(row, [
            "assigned_officer",
            "assignedOfficer",
            "assigned_to",
            "assignedTo",
            "loan_officer",
            "loanOfficer",
            "officer",
            "officer.name",
        ]) || "—"
    );
}

function updatedOf(row: ReportRow) {
    return textValue(row, [
        "last_updated",
        "lastUpdated",
        "updated_at",
        "updatedAt",
        "modified_at",
        "modifiedAt",
    ]);
}

function datePart(value?: string | null) {
    return value?.slice(0, 10) || "";
}

function localDate(value: Date | null) {
    if (!value) return "";

    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
        2,
        "0",
    )}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDate(value?: string | null) {
    const raw = datePart(value);
    if (!raw) return "—";

    const date = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) return raw;

    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatDateTime(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return formatDate(value);

    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value || 0);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "ZMW",
        maximumFractionDigits: 2,
    }).format(value || 0);
}

function average(rows: ReportRow[], fields: string[]) {
    const values = rows
        .map((row) => numberValue(row, fields))
        .filter((value): value is number => value !== null && value >= 0);

    return values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;
}

/* -------------------------------------------------------------------------- */
/* TAT                                                                        */
/* -------------------------------------------------------------------------- */

function getTat(rows: ReportRow[]) {
    const metrics: TatMetric[] = TAT_CONFIG.map((item) => ({
        label: item.label,
        value: average(rows, item.value),
        target: average(rows, item.target),
    }));

    const overSla = rows.filter((row) => {
        const value = pick(row, [
            "sla_breached",
            "slaBreached",
            "over_sla",
            "overSla",
            "is_over_sla",
            "isOverSla",
        ]);

        return value === true || value === 1 || value === "true";
    }).length;

    return {
        metrics,
        endToEnd: average(rows, [
            "end_to_end_tat_hours",
            "endToEndTatHours",
            "average_end_to_end_tat_hours",
            "averageEndToEndTatHours",
        ]),
        overSla: overSla || null,
    };
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
    const color = STATUS_COLOR[status] || "slate";

    return (
        <Badge
            size="sm"
            radius="xl"
            variant="light"
            color={color}
            tt="none"
            fw={700}
        >
            {status}
        </Badge>
    );
}

function StageBadge({ stage }: { stage: string }) {
    return stage === "—" ? (
        <Text fz="xs" c="slate.5">
            —
        </Text>
    ) : (
        <Badge
            size="sm"
            radius="xl"
            variant="light"
            color={STAGE_COLOR[stage] || "brand"}
            tt="none"
            fw={700}
        >
            {stage}
        </Badge>
    );
}

function KpiCard({
    label,
    value,
    hint,
    icon,
    color,
    children,
}: {
    label: string;
    value: string;
    hint?: string;
    icon: ReactNode;
    color: string;
    children?: ReactNode;
}) {
    return (
        <Card withBorder radius="lg" p="md" h="100%" bd="1px solid slate.2">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={5}>
                    <Text fz={10.5} fw={800} c="slate.5" tt="uppercase" lts={0.4}>
                        {label}
                    </Text>

                    <Text fz={25} fw={800} c="slate.8" lh={1}>
                        {value}
                    </Text>

                    {children}

                    {hint && (
                        <Text fz={10.5} c="slate.5">
                            {hint}
                        </Text>
                    )}
                </Stack>

                <ThemeIcon size={36} radius="md" variant="light" color={color}>
                    {icon}
                </ThemeIcon>
            </Group>
        </Card>
    );
}

function Panel({
    title,
    subtitle,
    right,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Paper withBorder radius="lg" p="md" h="100%" bd="1px solid slate.2">
            <Group justify="space-between" align="flex-start">
                <Box>
                    <Text fz="sm" fw={800} c="slate.8">
                        {title}
                    </Text>

                    {subtitle && (
                        <Text fz={11} c="slate.5" mt={2}>
                            {subtitle}
                        </Text>
                    )}
                </Box>

                {right}
            </Group>

            <Divider my="sm" color="slate.1" />

            {children}
        </Paper>
    );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

const columnHelper = createColumnHelper<ReportRow>();

export function LoanOriginationReport() {
    const [search, setSearch] = useState("");
    const [tableStatus, setTableStatus] = useState<string | null>(null);
    const [tableProduct, setTableProduct] = useState<string | null>(null);
    const [tableStage, setTableStage] = useState<string | null>(null);

    const [draft, setDraft] = useState<{
        status: string | null;
        product: string | null;
        branch: string | null;
        stage: string | null;
        date: [Date | null, Date | null];
    }>({
        status: null,
        product: null,
        branch: null,
        stage: null,
        date: [null, null],
    });

    const [filters, setFilters] = useState<Filters>({
        status: null,
        product: null,
        branch: null,
        stage: null,
        from: "",
        to: "",
    });

    const [originBy, setOriginBy] = useState<"product" | "branch">("product");

    const [sorting, setSorting] = useState<SortingState>([
        { id: "applicationDate", desc: true },
    ]);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const applicationsQuery = useQuery({
        queryKey: ["loan-origination-report"],
        queryFn: getAllLoanApplications,
    });

    const rows = useMemo(
        () => normalizeRows(applicationsQuery.data),
        [applicationsQuery.data],
    );

    /* ------------------------------- options ------------------------------- */

    const options = useMemo(() => {
        const make = (values: string[]) =>
            [...new Set(values.filter((value) => value !== "—"))]
                .sort()
                .map((value) => ({ label: value, value }));

        return {
            products: make(rows.map(productOf)),
            branches: make(rows.map(branchOf)),
            stages: make(rows.map(stageOf)),
            statuses: make(rows.map(statusOf)),
        };
    }, [rows]);

    /* ------------------------------- filters ------------------------------- */

    const filteredRows = useMemo(
        () =>
            rows.filter((row) => {
                const status = statusOf(row);
                const product = productOf(row);
                const branch = branchOf(row);
                const stage = stageOf(row);
                const date = datePart(row.application_date);

                return (
                    (!filters.status || status === filters.status) &&
                    (!filters.product || product === filters.product) &&
                    (!filters.branch || branch === filters.branch) &&
                    (!filters.stage || stage === filters.stage) &&
                    (!filters.from || date >= filters.from) &&
                    (!filters.to || date <= filters.to)
                );
            }),
        [rows, filters],
    );

    const tableRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return filteredRows.filter((row) => {
            const id = String(row.name || "").toLowerCase();
            const applicant = applicantOf(row).toLowerCase();
            const product = productOf(row).toLowerCase();
            const officer = officerOf(row).toLowerCase();

            return (
                (!query ||
                    id.includes(query) ||
                    applicant.includes(query) ||
                    product.includes(query) ||
                    officer.includes(query)) &&
                (!tableStatus || statusOf(row) === tableStatus) &&
                (!tableProduct || productOf(row) === tableProduct) &&
                (!tableStage || stageOf(row) === tableStage)
            );
        });
    }, [
        filteredRows,
        search,
        tableStatus,
        tableProduct,
        tableStage,
    ]);

    /* -------------------------------- KPIs --------------------------------- */

    const summary = useMemo(() => {
        const total = filteredRows.length;

        const review = filteredRows.filter(
            (row) =>
                REVIEW_STAGES.has(stageOf(row)) ||
                REVIEW_STATUSES.has(statusOf(row)),
        ).length;

        const approved = filteredRows.filter(
            (row) => statusOf(row) === "Approved",
        ).length;

        const disbursedValues = filteredRows
            .map(disbursedOf)
            .filter((value): value is number => value !== null);

        return {
            total,
            review,
            approved,
            rate: total ? (approved / total) * 100 : 0,
            disbursed:
                disbursedValues.length > 0
                    ? disbursedValues.reduce((sum, value) => sum + value, 0)
                    : null,
        };
    }, [filteredRows]);

    const tat = useMemo(() => getTat(filteredRows), [filteredRows]);

    const bottleneckIndex = useMemo(() => {
        const values = tat.metrics.map((item) => item.value || 0);
        const max = Math.max(...values, 0);

        return max > 0 ? values.findIndex((value) => value === max) : -1;
    }, [tat.metrics]);

    /* -------------------------------- table -------------------------------- */

    const columns = useMemo(
        () => [
            columnHelper.accessor("name", {
                id: "application",
                header: "Application ID",
                cell: ({ row }) => (
                    <Group gap="xs" wrap="nowrap">
                        <ThemeIcon size={28} radius="sm" variant="light" color="brand">
                            <IconFileText size={14} />
                        </ThemeIcon>

                        <Text
                            fz={11}
                            fw={700}
                            c="brand.7"
                            ff="monospace"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {row.original.name}
                        </Text>
                    </Group>
                ),
            }),

            columnHelper.accessor("application_date", {
                id: "applicationDate",
                header: "Application Date",
                cell: ({ row }) => (
                    <Text fz={11} c="slate.6" style={{ whiteSpace: "nowrap" }}>
                        {formatDate(row.original.application_date)}
                    </Text>
                ),
            }),

            columnHelper.display({
                id: "customer",
                header: "Customer",
                cell: ({ row }) => (
                    <Stack gap={0}>
                        <Text fz={11.5} fw={700} c="slate.8">
                            {applicantOf(row.original)}
                        </Text>

                        {customerIdOf(row.original) && (
                            <Text fz={9.5} c="slate.5" ff="monospace">
                                {customerIdOf(row.original)}
                            </Text>
                        )}
                    </Stack>
                ),
            }),

            columnHelper.display({
                id: "loanProduct",
                header: "Loan Product",
                cell: ({ row }) => (
                    <Text fz={11} c="slate.7">
                        {productOf(row.original)}
                    </Text>
                ),
            }),

            columnHelper.display({
                id: "branch",
                header: "Branch",
                cell: ({ row }) => (
                    <Text fz={11} c="slate.7">
                        {branchOf(row.original)}
                    </Text>
                ),
            }),

            columnHelper.accessor("amount", {
                id: "requestedAmount",
                header: "Requested Amount",
                cell: ({ row }) => (
                    <Text fz={11} fw={700} c="slate.8" ta="right">
                        {formatCurrency(Number(row.original.amount) || 0)}
                    </Text>
                ),
            }),

            columnHelper.display({
                id: "approvedAmount",
                header: "Approved Amount",
                accessorFn: approvedOf,
                cell: ({ row }) => {
                    const amount = approvedOf(row.original);

                    return (
                        <Text
                            fz={11}
                            fw={700}
                            c={amount === null ? "slate.4" : "slate.8"}
                            ta="right"
                        >
                            {amount === null ? "—" : formatCurrency(amount)}
                        </Text>
                    );
                },
            }),

            columnHelper.display({
                id: "stage",
                header: "Current Stage",
                cell: ({ row }) => (
                    <StageBadge stage={stageOf(row.original)} />
                ),
            }),

            columnHelper.display({
                id: "status",
                header: "Status",
                cell: ({ row }) => (
                    <StatusBadge status={statusOf(row.original)} />
                ),
            }),

            columnHelper.display({
                id: "officer",
                header: "Assigned Officer",
                cell: ({ row }) => (
                    <Text fz={11} c="slate.7" style={{ whiteSpace: "nowrap" }}>
                        {officerOf(row.original)}
                    </Text>
                ),
            }),

            columnHelper.display({
                id: "updated",
                header: "Last Updated",
                accessorFn: updatedOf,
                cell: ({ row }) => (
                    <Text fz={10.5} c="slate.6" style={{ whiteSpace: "nowrap" }}>
                        {formatDateTime(updatedOf(row.original))}
                    </Text>
                ),
            }),

            columnHelper.display({
                id: "actions",
                header: "Action",
                enableSorting: false,
                cell: ({ row }) => (
                    <Tooltip label="View application">
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="brand"
                            onClick={() =>
                                loanApplicationModal.open({
                                    loanApplicationId: row.original.name,
                                })
                            }
                        >
                            <IconEye size={15} />
                        </ActionIcon>
                    </Tooltip>
                ),
            }),
        ],
        [],
    );

    const table = useReactTable({
        data: tableRows,
        columns,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const pageCount = table.getPageCount();
    const currentPage = pageCount ? pagination.pageIndex + 1 : 1;

    /* -------------------------------- actions ------------------------------- */

    const applyFilters = () => {
        setFilters({
            status: draft.status,
            product: draft.product,
            branch: draft.branch,
            stage: draft.stage,
            from: localDate(draft.date[0]),
            to: localDate(draft.date[1]),
        });

        setPagination((page) => ({ ...page, pageIndex: 0 }));
    };

    const clearAll = () => {
        setDraft({
            status: null,
            product: null,
            branch: null,
            stage: null,
            date: [null, null],
        });

        setFilters({
            status: null,
            product: null,
            branch: null,
            stage: null,
            from: "",
            to: "",
        });

        setSearch("");
        setTableStatus(null);
        setTableProduct(null);
        setTableStage(null);

        setPagination((page) => ({ ...page, pageIndex: 0 }));
    };

    const clearTable = () => {
        setSearch("");
        setTableStatus(null);
        setTableProduct(null);
        setTableStage(null);
    };

    const hasGlobalFilters = Object.values(filters).some(Boolean);
    const hasTableFilters =
        Boolean(search) ||
        Boolean(tableStatus) ||
        Boolean(tableProduct) ||
        Boolean(tableStage);

    /* ------------------------------------------------------------------------ */
    /* Render                                                                   */
    /* ------------------------------------------------------------------------ */

    return (
        <Box mih="100%" p="lg" bg="slate.0">
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between" align="flex-end" wrap="wrap">
                    <Stack gap={2}>
                        <Title order={3} c="slate.8" fw={800}>
                            LOS Report
                        </Title>

                        <Text fz="sm" c="slate.5">
                            Loan Origination Performance & Application Pipeline
                        </Text>
                    </Stack>

                    <Group gap="xs">
                        <Tooltip label="Refresh report">
                            <ActionIcon
                                variant="default"
                                color="slate"
                                size="md"
                                loading={applicationsQuery.isFetching}
                                onClick={() => applicationsQuery.refetch()}
                            >
                                <IconRefresh size={15} />
                            </ActionIcon>
                        </Tooltip>

                        <Button
                            size="sm"
                            variant="default"
                            leftSection={<IconDownload size={15} />}
                            disabled={!tableRows.length}
                            onClick={() => downloadCsv(tableRows)}
                        >
                            Export CSV
                        </Button>
                    </Group>
                </Group>

                {/* Global Filters */}
                <Paper withBorder radius="lg" p="sm" bd="1px solid slate.2">
                    <Group gap={6} mb="xs">
                        <IconFilter size={13} color="var(--mantine-color-brand-6)" />

                        <Text fz={10} fw={800} c="brand.6" tt="uppercase">
                            Filters
                        </Text>

                        {hasGlobalFilters && (
                            <Button
                                variant="subtle"
                                size="compact-xs"
                                color="slate"
                                leftSection={<IconX size={11} />}
                                ml="auto"
                                onClick={clearAll}
                            >
                                Clear
                            </Button>
                        )}
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing="xs">
                        <DatePickerInput
                            type="range"
                            label="Date Range"
                            placeholder="Select date range"
                            value={draft.date}
                            onChange={(date) =>
                                setDraft((current) => ({ ...current, date }))
                            }
                            valueFormat="DD-MMM-YYYY"
                            clearable
                            size="sm"
                            radius="md"
                        />

                        <Select
                            label="Product"
                            placeholder="All products"
                            data={options.products}
                            value={draft.product}
                            onChange={(product) =>
                                setDraft((current) => ({ ...current, product }))
                            }
                            searchable
                            clearable
                            size="sm"
                            radius="md"
                        />

                        <Select
                            label="Branch"
                            placeholder="All branches"
                            data={options.branches}
                            value={draft.branch}
                            onChange={(branch) =>
                                setDraft((current) => ({ ...current, branch }))
                            }
                            searchable
                            clearable
                            size="sm"
                            radius="md"
                        />

                        <Select
                            label="Stage"
                            placeholder="All stages"
                            data={options.stages}
                            value={draft.stage}
                            onChange={(stage) =>
                                setDraft((current) => ({ ...current, stage }))
                            }
                            searchable
                            clearable
                            size="sm"
                            radius="md"
                        />

                        <Select
                            label="Status"
                            placeholder="All statuses"
                            data={options.statuses}
                            value={draft.status}
                            onChange={(status) =>
                                setDraft((current) => ({ ...current, status }))
                            }
                            searchable
                            clearable
                            size="sm"
                            radius="md"
                        />

                        <Button size="sm" radius="md" color="brand" onClick={applyFilters}>
                            Apply
                        </Button>
                    </SimpleGrid>
                </Paper>

                {/* KPIs */}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
                    <KpiCard
                        label="Total Applications"
                        value={formatNumber(summary.total)}
                        hint="Matching current report filters"
                        icon={<IconFileText size={17} />}
                        color="brand"
                    />

                    <KpiCard
                        label="In Review"
                        value={formatNumber(summary.review)}
                        hint="Currently in workflow review"
                        icon={<IconClock size={17} />}
                        color="yellow"
                    />

                    <KpiCard
                        label="Approved"
                        value={formatNumber(summary.approved)}
                        icon={<IconCheck size={17} />}
                        color="teal"
                    >
                        <Text fz={10.5} fw={700} c="slate.6">
                            {summary.rate.toFixed(1)}% approval rate
                        </Text>
                    </KpiCard>

                    <KpiCard
                        label="Disbursed Amount"
                        value={
                            summary.disbursed === null
                                ? "—"
                                : formatCurrency(summary.disbursed)
                        }
                        hint={
                            summary.disbursed === null
                                ? "No disbursement data available"
                                : "Sum of available disbursements"
                        }
                        icon={<Text fw={900}>Z</Text>}
                        color="grape"
                    />
                </SimpleGrid>

                {/* Analytics */}
                <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="sm">
                    {/* Pipeline */}
                    <Panel
                        title="Application Pipeline"
                        subtitle={`Total Applications: ${formatNumber(
                            filteredRows.length,
                        )}`}
                    >
                        <Stack gap="sm">
                            {PIPELINE.map((stage, index) => {
                                const count =
                                    stage === "Application Intake"
                                        ? filteredRows.length
                                        : filteredRows.filter(
                                            (row) => stageOf(row) === stage,
                                        ).length;

                                const width = filteredRows.length
                                    ? Math.max((count / filteredRows.length) * 100, 28)
                                    : 28;

                                return (
                                    <Box key={stage}>
                                        <Group justify="space-between" mb={4}>
                                            <Text fz={11} fw={600} c="slate.7">
                                                {stage}
                                            </Text>

                                            <Text fz={10.5} c="slate.6">
                                                <Text span fw={800} c="slate.8">
                                                    {formatNumber(count)}
                                                </Text>{" "}
                                                (
                                                {filteredRows.length
                                                    ? ((count / filteredRows.length) * 100).toFixed(1)
                                                    : "0.0"}
                                                %)
                                            </Text>
                                        </Group>

                                        <Center>
                                            <Box
                                                w={`${width}%`}
                                                h={28}
                                                bg={
                                                    [
                                                        "brand.6",
                                                        "violet.6",
                                                        "teal.6",
                                                        "yellow.6",
                                                        "grape.6",
                                                    ][index]
                                                }
                                                c="white"
                                                py={6}
                                                ta="center"
                                                radius="sm"
                                                style={{
                                                    minWidth: count ? 70 : 0,
                                                    clipPath:
                                                        "polygon(5% 0,95% 0,88% 100%,12% 100%)",
                                                }}
                                            >
                                                <Text fz={11} fw={800}>
                                                    {formatNumber(count)}
                                                </Text>
                                            </Box>
                                        </Center>
                                    </Box>
                                );
                            })}
                        </Stack>

                        <Text fz={9.5} c="slate.4" ta="right" mt="xs">
                            Percentages represent share of total applications.
                        </Text>
                    </Panel>

                    {/* Status */}
                    <Panel title="Application Status Distribution">
                        <Stack align="center" gap="xl" p="md">
                            <RingProgress
                                size={220}
                                thickness={22}
                                roundCaps // Applies pill-shaped rounded ends to chart sectors
                                sections={STATUS_META.map((item) => ({
                                    value: filteredRows.length
                                        ? (filteredRows.filter((row) => statusOf(row) === item.label).length /
                                            filteredRows.length) *
                                        100
                                        : 0,
                                    // Pulls dynamic visual tokens from your updated mapping object
                                    color: STATUS_COLOR[item.label] || item.color,
                                }))}
                                label={
                                    <Stack gap={2} align="center">
                                        <Text fz={32} fw={800} c="slate.9" style={{ lineHeight: 1, letterSpacing: '-0.5px' }}>
                                            {formatNumber(filteredRows.length)}
                                        </Text>
                                        <Text fz={13} fw={600} c="slate.4">
                                            Total Apps
                                        </Text>
                                    </Stack>
                                }
                            />

                            <Stack w="100%" gap="xs" mt="md">
                                {STATUS_META.map((item) => {
                                    const count = filteredRows.filter(
                                        (row) => statusOf(row) === item.label
                                    ).length;

                                    const percentage = filteredRows.length
                                        ? Math.round((count / filteredRows.length) * 100)
                                        : 0;

                                    // Pulls matching tracking hex codes for the bullet dot markers
                                    const displayColor = STATUS_COLOR[item.label] || item.color;

                                    return (
                                        <Group
                                            key={item.label}
                                            justify="space-between"
                                            py="xs"
                                            style={{ borderBottom: '1px solid var(--mantine-color-slate-1)' }}
                                        >
                                            <Group gap="sm">
                                                <Box
                                                    w={10}
                                                    h={10}
                                                    bg={displayColor}
                                                    style={{ borderRadius: "50%" }}
                                                />
                                                <Text fz={14} fw={500} c="slate.7">
                                                    {item.label}
                                                </Text>
                                            </Group>

                                            <Group gap="xs">
                                                <Text fz={15} fw={800} c="slate.8">
                                                    {formatNumber(count)}
                                                </Text>
                                                <Text fz={13} c="slate.4" w={35} ta="right">
                                                    {percentage}%
                                                </Text>
                                            </Group>
                                        </Group>
                                    );
                                })}
                            </Stack>
                        </Stack>
                    </Panel>



                    {/* Originations */}
                    <Panel
                        title="Originations"
                        subtitle="Application volume by selected dimension"
                        right={
                            <SegmentedControl
                                size="xs"
                                value={originBy}
                                onChange={(value) =>
                                    setOriginBy(value as "product" | "branch")
                                }
                                data={[
                                    { label: "By Product", value: "product" },
                                    { label: "By Branch", value: "branch" },
                                ]}
                            />
                        }
                    >
                        {(() => {
                            const counts = new Map<string, number>();

                            filteredRows.forEach((row) => {
                                const key =
                                    originBy === "product"
                                        ? productOf(row)
                                        : branchOf(row);

                                if (key !== "—") {
                                    counts.set(key, (counts.get(key) || 0) + 1);
                                }
                            });

                            const data = [...counts.entries()]
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5);

                            const max = Math.max(
                                ...data.map(([, value]) => value),
                                1,
                            );

                            return data.length ? (
                                <Group align="flex-end" gap="md" h={220}>
                                    {data.map(([label, value], index) => (
                                        <Stack
                                            key={label}
                                            gap={4}
                                            align="center"
                                            justify="flex-end"
                                            h="100%"
                                            style={{ flex: 1, minWidth: 0 }}
                                        >
                                            <Text fz={10} fw={800} c="slate.7">
                                                {formatNumber(value)}
                                            </Text>

                                            <Box
                                                w="70%"
                                                maw={42}
                                                h={Math.max(20, (value / max) * 130)}
                                                bg={
                                                    [
                                                        "brand.6",
                                                        "violet.6",
                                                        "teal.6",
                                                        "yellow.6",
                                                        "slate.5",
                                                    ][index % 5]
                                                }
                                                radius="sm"
                                            />

                                            <Text fz={9.5} c="slate.5" ta="center" lineClamp={1}>
                                                {label}
                                            </Text>
                                        </Stack>
                                    ))}
                                </Group>
                            ) : (
                                <Center h={220}>
                                    <Text fz={11} c="slate.5">
                                        No originations data available.
                                    </Text>
                                </Center>
                            );
                        })()}
                    </Panel>
                </SimpleGrid>

                {/* TAT */}
                <Panel
                    title="Turnaround Time (TAT) & SLA Bottlenecks"
                    subtitle="Operational processing benchmarks"
                    right={
                        <Text fz={10} c="slate.5">
                            Live data when available
                        </Text>
                    }
                >
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="sm">
                        {tat.metrics.map((metric, index) => {
                            const bottleneck = index === bottleneckIndex;

                            return (
                                <Card
                                    key={metric.label}
                                    withBorder
                                    radius="md"
                                    p="sm"
                                    bg={bottleneck ? "yellow.0" : "slate.0"}
                                    bd={bottleneck ? "1px solid yellow.3" : "1px solid slate.2"}
                                >
                                    <Group justify="space-between" gap="xs">
                                        <Text
                                            fz={10}
                                            fw={600}
                                            c={bottleneck ? "yellow.9" : "slate.6"}
                                        >
                                            {metric.label}
                                        </Text>

                                        {bottleneck && (
                                            <Badge size="xs" color="yellow" variant="light">
                                                Bottleneck
                                            </Badge>
                                        )}
                                    </Group>

                                    <Text
                                        fz={20}
                                        fw={800}
                                        c={bottleneck ? "yellow.9" : "slate.8"}
                                        mt="sm"
                                    >
                                        {metric.value === null
                                            ? "—"
                                            : `${metric.value.toFixed(1)} hrs`}
                                    </Text>

                                    {metric.target !== null && (
                                        <Text fz={9.5} c="slate.5">
                                            Target &lt; {metric.target.toFixed(1)} hrs
                                        </Text>
                                    )}
                                </Card>
                            );
                        })}

                        <Card
                            withBorder
                            radius="md"
                            p="sm"
                            bg="blue.0"
                            bd="1px solid blue.2"
                        >
                            <Text fz={10} fw={700} c="blue.8">
                                End-to-End TAT
                            </Text>

                            <Text fz={20} fw={800} c="blue.8" mt="sm">
                                {tat.endToEnd === null
                                    ? "—"
                                    : `${tat.endToEnd.toFixed(1)} hrs`}
                            </Text>

                            <Text fz={9.5} c="slate.5">
                                Over SLA:{" "}
                                <Text span fw={800} c="red.6">
                                    {tat.overSla === null ? "—" : formatNumber(tat.overSla)}
                                </Text>
                            </Text>
                        </Card>
                    </SimpleGrid>
                </Panel>

                {/* Applications */}
                <Paper withBorder radius="lg" bd="1px solid slate.2">
                    <Box p="md">
                        <Group
                            justify="space-between"
                            align="flex-end"
                            gap="sm"
                            wrap="wrap"
                        >
                            <Box>
                                <Title order={5} c="slate.8" fw={800}>
                                    Loan Applications
                                </Title>

                                <Text fz={10.5} c="slate.5" mt={2}>
                                    Detailed overview of loan origination submissions ·{" "}
                                    {formatNumber(tableRows.length)} results
                                </Text>
                            </Box>

                            <Group gap="xs">
                                <TextInput
                                    size="sm"
                                    radius="md"
                                    w={280}
                                    placeholder="Search application ID, customer or officer..."
                                    leftSection={<IconSearch size={14} />}
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.currentTarget.value);
                                        setPagination((page) => ({
                                            ...page,
                                            pageIndex: 0,
                                        }));
                                    }}
                                />

                                <Select
                                    size="sm"
                                    radius="md"
                                    w={115}
                                    placeholder="Stage"
                                    data={options.stages}
                                    value={tableStage}
                                    onChange={setTableStage}
                                    clearable
                                />

                                <Select
                                    size="sm"
                                    radius="md"
                                    w={115}
                                    placeholder="Status"
                                    data={options.statuses}
                                    value={tableStatus}
                                    onChange={setTableStatus}
                                    clearable
                                />

                                <Select
                                    size="sm"
                                    radius="md"
                                    w={120}
                                    placeholder="Product"
                                    data={options.products}
                                    value={tableProduct}
                                    onChange={setTableProduct}
                                    searchable
                                    clearable
                                />

                                {hasTableFilters && (
                                    <Button
                                        variant="subtle"
                                        size="compact-sm"
                                        color="brand"
                                        onClick={clearTable}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </Box>

                    <Divider color="slate.1" />

                    {applicationsQuery.isLoading ? (
                        <Center py={70}>
                            <Stack align="center" gap="xs">
                                <Loader size="sm" />
                                <Text fz={11} c="slate.5">
                                    Loading loan applications...
                                </Text>
                            </Stack>
                        </Center>
                    ) : applicationsQuery.isError ? (
                        <Center py={70}>
                            <Stack align="center" gap="xs" maw={420}>
                                <IconAlertCircle size={22} color="var(--mantine-color-red-6)" />

                                <Text fz="sm" fw={700} ta="center">
                                    Could not load the loan origination report.
                                </Text>

                                <Text fz={11} c="slate.5" ta="center">
                                    {applicationsQuery.error instanceof Error
                                        ? applicationsQuery.error.message
                                        : "Please try refreshing the report."}
                                </Text>

                                <Button
                                    size="xs"
                                    variant="default"
                                    leftSection={<IconRefresh size={13} />}
                                    onClick={() => applicationsQuery.refetch()}
                                >
                                    Retry
                                </Button>
                            </Stack>
                        </Center>
                    ) : !tableRows.length ? (
                        <Center py={70}>
                            <Stack align="center" gap="xs">
                                <IconSearch size={22} color="var(--mantine-color-slate-4)" />

                                <Text fz="sm" fw={700} c="slate.6">
                                    No applications match your filters.
                                </Text>

                                {(hasGlobalFilters || hasTableFilters) && (
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        color="brand"
                                        onClick={clearAll}
                                    >
                                        Clear all filters
                                    </Button>
                                )}
                            </Stack>
                        </Center>
                    ) : (
                        <>
                            <ScrollArea>
                                <Table
                                    miw={1280}
                                    verticalSpacing={8}
                                    horizontalSpacing="sm"
                                    fz={11}
                                    highlightOnHover
                                >
                                    <Table.Thead>
                                        {table.getHeaderGroups().map((group) => (
                                            <Table.Tr key={group.id} bg="slate.0">
                                                {group.headers.map((header) => {
                                                    const canSort = header.column.getCanSort();
                                                    const sorted = header.column.getIsSorted();

                                                    return (
                                                        <Table.Th
                                                            key={header.id}
                                                            onClick={
                                                                canSort
                                                                    ? header.column.getToggleSortingHandler()
                                                                    : undefined
                                                            }
                                                            c="slate.5"
                                                            fz={10}
                                                            fw={800}
                                                            py="sm"
                                                            style={{
                                                                cursor: canSort ? "pointer" : "default",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            <Group gap={4} wrap="nowrap">
                                                                {flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext(),
                                                                )}

                                                                {canSort &&
                                                                    (sorted === "asc" ? (
                                                                        <IconChevronUp size={12} />
                                                                    ) : sorted === "desc" ? (
                                                                        <IconChevronDown size={12} />
                                                                    ) : (
                                                                        <IconSelector
                                                                            size={12}
                                                                            color="var(--mantine-color-slate-4)"
                                                                        />
                                                                    ))}
                                                            </Group>
                                                        </Table.Th>
                                                    );
                                                })}
                                            </Table.Tr>
                                        ))}
                                    </Table.Thead>

                                    <Table.Tbody>
                                        {table.getRowModel().rows.map((row) => (
                                            <Table.Tr key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <Table.Td key={cell.id} valign="middle">
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </Table.Td>
                                                ))}
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>

                            <Divider color="slate.1" />

                            <Group justify="space-between" p="sm" wrap="wrap">
                                <Group gap="xs">
                                    <Text fz={10.5} c="slate.6">
                                        Showing{" "}
                                        {pagination.pageIndex * pagination.pageSize + 1} –{" "}
                                        {Math.min(
                                            (pagination.pageIndex + 1) * pagination.pageSize,
                                            tableRows.length,
                                        )}{" "}
                                        of {formatNumber(tableRows.length)} applications
                                    </Text>

                                    <Select
                                        size="xs"
                                        w={65}
                                        data={PAGE_SIZES}
                                        value={String(pagination.pageSize)}
                                        onChange={(value) =>
                                            setPagination({
                                                pageIndex: 0,
                                                pageSize: Number(value || 10),
                                            })
                                        }
                                    />
                                </Group>

                                <Pagination
                                    total={Math.max(pageCount, 1)}
                                    value={currentPage}
                                    onChange={(page) =>
                                        setPagination((current) => ({
                                            ...current,
                                            pageIndex: page - 1,
                                        }))
                                    }
                                    color="blue"
                                    size="sm"
                                    radius="md"
                                    disabled={pageCount <= 1}
                                />
                            </Group>
                        </>
                    )}
                </Paper>
            </Stack>
        </Box>
    );
}

/* -------------------------------------------------------------------------- */
/* CSV export                                                                 */
/* -------------------------------------------------------------------------- */

function downloadCsv(rows: ReportRow[]) {
    const headers = [
        "Application ID",
        "Application Date",
        "Customer",
        "Customer ID",
        "Loan Product",
        "Branch",
        "Requested Amount",
        "Approved Amount",
        "Current Stage",
        "Status",
        "Assigned Officer",
        "Last Updated",
    ];

    const values = rows.map((row) => [
        row.name,
        datePart(row.application_date),
        applicantOf(row),
        customerIdOf(row) || "",
        productOf(row),
        branchOf(row),
        row.amount ?? 0,
        approvedOf(row) ?? "",
        stageOf(row),
        statusOf(row),
        officerOf(row),
        updatedOf(row) || "",
    ]);

    const csv = [headers, ...values]
        .map((line) =>
            line
                .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
                .join(","),
        )
        .join("\n");

    const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `loan-origination-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

export default LoanOriginationReport;