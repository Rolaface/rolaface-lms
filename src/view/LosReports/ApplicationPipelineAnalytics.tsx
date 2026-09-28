import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconClipboardData,
  IconCoin,
  IconDownload,
  IconFilter,
  IconFileAnalytics,
  IconRefresh,
  IconTrendingUp,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import {
  Donut,
  EmptyState,
  MetricBar,
  REPORT_COLORS,
  ReportShell,
  SectionCard,
  TinyPill,
} from "../LosReports/shared/LosReportShared";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ApplicationStatus =
  | "Approved"
  | "Rejected"
  | "On Hold"
  | "Withdrawn";

type ApplicationRow = {
  id: string;
  product: string;
  branch: string;
  stage: string;
  status: ApplicationStatus;
  source: string;
  officer: string;
  requested: number;
  approved: number;
  age: number;
  submittedOn: string;
};

type StageRow = {
  stage: string;
  entered: number;
  completed: number;
  pending: number;
  drop: number;
  reason: string;
};

type SourceRow = {
  source: string;
  applications: number;
  approved: number;
  rejected: number;
};

type DateRange = [Date | null, Date | null];

type Filters = {
  product: string;
  status: string;
  source: string;
  dateRange: DateRange;
};

/* -------------------------------------------------------------------------- */
/* DUMMY DATA                                                                 */
/* -------------------------------------------------------------------------- */

const APPLICATIONS: ApplicationRow[] = [
  {
    id: "APP-1001",
    product: "Personal Loan",
    branch: "Delhi",
    stage: "Disbursement",
    status: "Approved",
    source: "Branch",
    officer: "Rahul Sharma",
    requested: 450000,
    approved: 420000,
    age: 2,
    submittedOn: "2026-09-20",
  },
  {
    id: "APP-1002",
    product: "Home Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "On Hold",
    source: "DSA",
    officer: "Priya Singh",
    requested: 3500000,
    approved: 0,
    age: 5,
    submittedOn: "2026-09-18",
  },
  {
    id: "APP-1003",
    product: "Personal Loan",
    branch: "Lucknow",
    stage: "Approved",
    status: "Approved",
    source: "Digital",
    officer: "Amit Verma",
    requested: 300000,
    approved: 285000,
    age: 1,
    submittedOn: "2026-09-21",
  },
  {
    id: "APP-1004",
    product: "Business Loan",
    branch: "Delhi",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "Partner",
    officer: "Rahul Sharma",
    requested: 1200000,
    approved: 0,
    age: 7,
    submittedOn: "2026-09-15",
  },
  {
    id: "APP-1005",
    product: "Personal Loan",
    branch: "Jaipur",
    stage: "Document Verification",
    status: "On Hold",
    source: "Branch",
    officer: "Neha Gupta",
    requested: 500000,
    approved: 0,
    age: 4,
    submittedOn: "2026-09-19",
  },
  {
    id: "APP-1006",
    product: "Home Loan",
    branch: "Delhi",
    stage: "Disbursement",
    status: "Approved",
    source: "Digital",
    officer: "Vikas Kumar",
    requested: 4200000,
    approved: 4000000,
    age: 3,
    submittedOn: "2026-09-19",
  },
  {
    id: "APP-1007",
    product: "Personal Loan",
    branch: "Noida",
    stage: "Credit Assessment",
    status: "Rejected",
    source: "DSA",
    officer: "Priya Singh",
    requested: 250000,
    approved: 0,
    age: 8,
    submittedOn: "2026-09-14",
  },
  {
    id: "APP-1008",
    product: "Business Loan",
    branch: "Lucknow",
    stage: "Underwriting",
    status: "On Hold",
    source: "Partner",
    officer: "Amit Verma",
    requested: 1800000,
    approved: 0,
    age: 6,
    submittedOn: "2026-09-16",
  },
  {
    id: "APP-1009",
    product: "Personal Loan",
    branch: "Jaipur",
    stage: "Approved",
    status: "Approved",
    source: "Digital",
    officer: "Neha Gupta",
    requested: 350000,
    approved: 330000,
    age: 2,
    submittedOn: "2026-09-20",
  },
  {
    id: "APP-1010",
    product: "Home Loan",
    branch: "Delhi",
    stage: "Application",
    status: "Withdrawn",
    source: "Branch",
    officer: "Vikas Kumar",
    requested: 2800000,
    approved: 0,
    age: 10,
    submittedOn: "2026-09-12",
  },
  {
    id: "APP-1011",
    product: "Personal Loan",
    branch: "Noida",
    stage: "Underwriting",
    status: "Approved",
    source: "Partner",
    officer: "Rahul Sharma",
    requested: 600000,
    approved: 575000,
    age: 3,
    submittedOn: "2026-09-19",
  },
  {
    id: "APP-1012",
    product: "Business Loan",
    branch: "Lucknow",
    stage: "Document Verification",
    status: "On Hold",
    source: "DSA",
    officer: "Amit Verma",
    requested: 1500000,
    approved: 0,
    age: 5,
    submittedOn: "2026-09-18",
  },
];

const STAGES: StageRow[] = [
  {
    stage: "Application",
    entered: 120,
    completed: 108,
    pending: 8,
    drop: 4,
    reason: "Incomplete application",
  },
  {
    stage: "Document Verification",
    entered: 108,
    completed: 94,
    pending: 9,
    drop: 5,
    reason: "Document mismatch",
  },
  {
    stage: "Credit Assessment",
    entered: 94,
    completed: 78,
    pending: 10,
    drop: 6,
    reason: "Credit policy",
  },
  {
    stage: "Underwriting",
    entered: 78,
    completed: 68,
    pending: 7,
    drop: 3,
    reason: "Additional review",
  },
  {
    stage: "Approved",
    entered: 68,
    completed: 61,
    pending: 4,
    drop: 3,
    reason: "Customer decline",
  },
  {
    stage: "Disbursement",
    entered: 61,
    completed: 56,
    pending: 3,
    drop: 2,
    reason: "Disbursement pending",
  },
];

const SOURCES: SourceRow[] = [
  {
    source: "Branch",
    applications: 38,
    approved: 22,
    rejected: 8,
  },
  {
    source: "Digital",
    applications: 31,
    approved: 21,
    rejected: 5,
  },
  {
    source: "DSA",
    applications: 24,
    approved: 12,
    rejected: 7,
  },
  {
    source: "Partner",
    applications: 19,
    approved: 11,
    rejected: 5,
  },
];

const CONVERSION_STEPS = [
  {
    label: "Application → Documents",
    value: 90,
  },
  {
    label: "Documents → Credit",
    value: 87,
  },
  {
    label: "Credit → Underwriting",
    value: 83,
  },
  {
    label: "Underwriting → Approval",
    value: 87,
  },
  {
    label: "Approval → Disbursement",
    value: 92,
  },
];

/* -------------------------------------------------------------------------- */
/* APPLICATION STATUS                                                         */
/* -------------------------------------------------------------------------- */

const APPLICATION_STATUS_DATA = [
  {
    label: "Approved",
    value: 42,
    color: REPORT_COLORS.success,
  },
  {
    label: "On Hold",
    value: 24,
    color: REPORT_COLORS.warning,
  },
  {
    label: "Rejected",
    value: 18,
    color: REPORT_COLORS.danger,
  },
  {
    label: "Withdrawn",
    value: 16,
    color: REPORT_COLORS.muted,
  },
];

const APPLICATION_STATUS_TOTAL =
  APPLICATION_STATUS_DATA.reduce(
    (sum, item) => sum + item.value,
    0,
  );

/* -------------------------------------------------------------------------- */
/* OPTIONS                                                                    */
/* -------------------------------------------------------------------------- */

const PRODUCT_OPTIONS = [
  "All Products",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
];

const STATUS_OPTIONS = [
  "All Statuses",
  "Approved",
  "Rejected",
  "On Hold",
  "Withdrawn",
];

const SOURCE_OPTIONS = [
  "All Sources",
  "Branch",
  "Digital",
  "DSA",
  "Partner",
];

const BRANCH_OPTIONS = [
  "All Branches",
  "Delhi",
  "Noida",
  "Lucknow",
  "Jaipur",
];

const OFFICER_OPTIONS = [
  "All Officers",
  "Rahul Sharma",
  "Priya Singh",
  "Amit Verma",
  "Neha Gupta",
  "Vikas Kumar",
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value: number) => {
  if (value >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  }

  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)}L`;
  }

  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(0)}K`;
  }

  return `₹${value.toLocaleString("en-IN")}`;
};

const formatFullCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusColor = (status: ApplicationStatus) => {
  switch (status) {
    case "Approved":
      return "green";
    case "Rejected":
      return "red";
    case "On Hold":
      return "yellow";
    case "Withdrawn":
      return "gray";
    default:
      return "gray";
  }
};

const filterInputStyles = {
  input: {
    minHeight: 30,
    height: 30,
    fontSize: 10,
    fontWeight: 650,
    backgroundColor:
      "var(--mantine-color-gray-0)",
  },
};

const tableHeaderStyles = {
  fontSize: 9,
  fontWeight: 800,
  color: "var(--mantine-color-dimmed)",
  whiteSpace: "nowrap" as const,
};

const tableCellStyles = {
  fontSize: 10,
};

/* -------------------------------------------------------------------------- */
/* COMPACT KPI                                                                */
/* -------------------------------------------------------------------------- */

function CompactKpi({
  label,
  value,
  helper,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <Card
      withBorder
      radius="md"
      p={8}
      style={{
        height: 66,
        overflow: "hidden",
      }}
    >
      <Group
        gap={7}
        wrap="nowrap"
        align="flex-start"
      >
        <ThemeIcon
          size={25}
          radius="sm"
          variant="light"
          color={tone}
          style={{
            flexShrink: 0,
          }}
        >
          {icon}
        </ThemeIcon>

        <Box
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <Text
            size="8px"
            fw={800}
            c="dimmed"
            tt="uppercase"
            lh={1.05}
            truncate
          >
            {label}
          </Text>

          <Text
            fw={800}
            fz={15}
            lh={1.15}
            mt={2}
            truncate
          >
            {value}
          </Text>

          {helper && (
            <Text
              size="7px"
              c="dimmed"
              mt={2}
              truncate
            >
              {helper}
            </Text>
          )}
        </Box>
      </Group>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER COMPONENT                                                           */
/* -------------------------------------------------------------------------- */

function ReportFilter({
  value,
  onChange,
  data,
  width,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  data: string[];
  width: number;
  icon: ReactNode;
}) {
  return (
    <Select
      size="xs"
      radius="md"
      w={width}
      value={value}
      onChange={(nextValue) =>
        onChange(nextValue ?? data[0])
      }
      data={data}
      leftSection={icon}
      checkIconPosition="right"
      styles={filterInputStyles}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function ApplicationPipelineAnalytics() {
  const [filters, setFilters] = useState<Filters>({
    product: "All Products",
    status: "All Statuses",
    source: "All Sources",
    dateRange: [null, null],
  });

  /* Table-only filters */
  const [tableBranch, setTableBranch] =
    useState("All Branches");

  const [tableOfficer, setTableOfficer] =
    useState("All Officers");

  /* ------------------------------------------------------------------------ */
  /* FILTER HELPERS                                                           */
  /* ------------------------------------------------------------------------ */

  const setFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      product: "All Products",
      status: "All Statuses",
      source: "All Sources",
      dateRange: [null, null],
    });

    setTableBranch("All Branches");
    setTableOfficer("All Officers");
  };

  const hasActiveFilters =
    filters.product !== "All Products" ||
    filters.status !== "All Statuses" ||
    filters.source !== "All Sources" ||
    filters.dateRange[0] !== null ||
    filters.dateRange[1] !== null ||
    tableBranch !== "All Branches" ||
    tableOfficer !== "All Officers";

  /* ------------------------------------------------------------------------ */
  /* FILTERED APPLICATIONS                                                    */
  /* ------------------------------------------------------------------------ */

  const filteredApps = useMemo(() => {
    const [from, to] = filters.dateRange;

    const fromDate = from
      ? new Date(
        from.getFullYear(),
        from.getMonth(),
        from.getDate(),
      ).getTime()
      : null;

    const toDate = to
      ? new Date(
        to.getFullYear(),
        to.getMonth(),
        to.getDate(),
        23,
        59,
        59,
        999,
      ).getTime()
      : null;

    return APPLICATIONS.filter((app) => {
      if (
        filters.product !== "All Products" &&
        app.product !== filters.product
      ) {
        return false;
      }

      if (
        filters.status !== "All Statuses" &&
        app.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.source !== "All Sources" &&
        app.source !== filters.source
      ) {
        return false;
      }

      const submittedTime = new Date(
        `${app.submittedOn}T00:00:00`,
      ).getTime();

      if (
        fromDate !== null &&
        submittedTime < fromDate
      ) {
        return false;
      }

      if (
        toDate !== null &&
        submittedTime > toDate
      ) {
        return false;
      }

      return true;
    });
  }, [filters]);

  /* ------------------------------------------------------------------------ */
  /* TABLE FILTER                                                             */
  /* ------------------------------------------------------------------------ */

  const tableApps = useMemo(() => {
    return filteredApps.filter((app) => {
      const branchMatch =
        tableBranch === "All Branches" ||
        app.branch === tableBranch;

      const officerMatch =
        tableOfficer === "All Officers" ||
        app.officer === tableOfficer;

      return branchMatch && officerMatch;
    });
  }, [
    filteredApps,
    tableBranch,
    tableOfficer,
  ]);

  /* ------------------------------------------------------------------------ */
  /* METRICS                                                                  */
  /* ------------------------------------------------------------------------ */

  const metrics = useMemo(() => {
    const total = filteredApps.length;

    const requested = filteredApps.reduce(
      (sum, app) => sum + app.requested,
      0,
    );

    const approvedAmount = filteredApps.reduce(
      (sum, app) => sum + app.approved,
      0,
    );

    const approved = filteredApps.filter(
      (app) => app.status === "Approved",
    ).length;

    const rejected = filteredApps.filter(
      (app) => app.status === "Rejected",
    ).length;

    const withdrawn = filteredApps.filter(
      (app) => app.status === "Withdrawn",
    ).length;

    const active = filteredApps.filter(
      (app) => app.status === "On Hold",
    ).length;

    const conversion =
      total > 0
        ? Math.round((approved / total) * 100)
        : 0;

    const dropOff =
      total > 0
        ? Math.round(
          ((rejected + withdrawn) / total) *
          100,
        )
        : 0;

    return {
      total,
      requested,
      approvedAmount,
      approved,
      rejected,
      withdrawn,
      active,
      conversion,
      dropOff,
    };
  }, [filteredApps]);

  /* ------------------------------------------------------------------------ */
  /* CSV EXPORT                                                               */
  /* ------------------------------------------------------------------------ */

  const exportApplications = (
    rows: ApplicationRow[],
  ) => {
    const header = [
      "Application ID",
      "Product",
      "Branch",
      "Stage",
      "Status",
      "Source",
      "Officer",
      "Requested Amount",
      "Approved Amount",
      "Age",
      "Submitted On",
    ];

    const rowsForExport = rows.map((app) => [
      app.id,
      app.product,
      app.branch,
      app.stage,
      app.status,
      app.source,
      app.officer,
      app.requested,
      app.approved,
      app.age,
      app.submittedOn,
    ]);

    const csv = [header, ...rowsForExport]
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      "application-pipeline-report.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <ReportShell
      title="Application & Pipeline Analytics"
      description="Monitor application volume, pipeline movement, conversion and application-level activity."
      icon={<IconFileAnalytics size={18} />}
      filters={
        <Group
          gap={6}
          wrap="wrap"
          align="center"
        >
          <ReportFilter
            value={filters.product}
            onChange={(value) =>
              setFilter("product", value)
            }
            data={PRODUCT_OPTIONS}
            width={150}
            icon={
              <IconClipboardData size={13} />
            }
          />

          <ReportFilter
            value={filters.status}
            onChange={(value) =>
              setFilter("status", value)
            }
            data={STATUS_OPTIONS}
            width={135}
            icon={<IconFilter size={13} />}
          />

          <ReportFilter
            value={filters.source}
            onChange={(value) =>
              setFilter("source", value)
            }
            data={SOURCE_OPTIONS}
            width={125}
            icon={
              <IconTrendingUp size={13} />
            }
          />

          <DateInput
            size="xs"
            radius="md"
            w={135}
            value={filters.dateRange[0]}
            onChange={(value) =>
              setFilter("dateRange", [
                value,
                filters.dateRange[1],
              ])
            }
            valueFormat="DD-MMM-YYYY"
            placeholder="From date"
            leftSection={
              <IconCalendar size={13} />
            }
            styles={filterInputStyles}
          />

          <DateInput
            size="xs"
            radius="md"
            w={135}
            value={filters.dateRange[1]}
            onChange={(value) =>
              setFilter("dateRange", [
                filters.dateRange[0],
                value,
              ])
            }
            valueFormat="DD-MMM-YYYY"
            placeholder="To date"
            leftSection={
              <IconCalendar size={13} />
            }
            styles={filterInputStyles}
          />

          <Button
            size="xs"
            radius="md"
            variant={
              hasActiveFilters
                ? "light"
                : "subtle"
            }
            color={
              hasActiveFilters
                ? "blue"
                : "gray"
            }
            leftSection={
              <IconRefresh size={13} />
            }
            onClick={resetFilters}
            styles={{
              root: {
                height: 30,
              },
              label: {
                fontSize: 10,
                fontWeight: 700,
              },
            }}
          >
            Reset
          </Button>
        </Group>
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* KPI ROW                                                            */}
      {/* ------------------------------------------------------------------ */}

      <SimpleGrid
        cols={{
          base: 2,
          xs: 3,
          sm: 4,
          md: 5,
          lg: 9,
        }}
        spacing={6}
        mb="md"
      >
        <CompactKpi
          label="Total Applications"
          value={String(metrics.total)}
          helper="Filtered"
          icon={
            <IconClipboardData size={14} />
          }
        />

        <CompactKpi
          label="Active Applications"
          value={String(metrics.active)}
          helper="Currently on hold"
          icon={
            <IconTrendingUp size={14} />
          }
          tone="yellow"
        />

        <CompactKpi
          label="Approved"
          value={String(metrics.approved)}
          helper={`${metrics.conversion}% of total`}
          icon={<IconCheck size={14} />}
          tone="green"
        />

        <CompactKpi
          label="Rejected"
          value={String(metrics.rejected)}
          helper="Decisioned"
          icon={<IconX size={14} />}
          tone="red"
        />

        <CompactKpi
          label="Inactive"
          value={String(metrics.withdrawn)}
          helper="Withdrawn"
          icon={<IconUser size={14} />}
          tone="gray"
        />

        <CompactKpi
          label="Conversion Rate"
          value={`${metrics.conversion}%`}
          helper="Approved / total"
          icon={
            <IconTrendingUp size={14} />
          }
          tone="green"
        />

        <CompactKpi
          label="Drop-off Rate"
          value={`${metrics.dropOff}%`}
          helper="Rejected + inactive"
          icon={<IconX size={14} />}
          tone="red"
        />

        <CompactKpi
          label="Requested Amount"
          value={formatCurrency(
            metrics.requested,
          )}
          helper="Total requested"
          icon={<IconCoin size={14} />}
        />

        <CompactKpi
          label="Approved Amount"
          value={formatCurrency(
            metrics.approvedAmount,
          )}
          helper="Total approved"
          icon={<IconCoin size={14} />}
          tone="green"
        />
      </SimpleGrid>

      {/* ------------------------------------------------------------------ */}
      {/* STAGE + APPLICATION STATUS                                         */}
      {/* ------------------------------------------------------------------ */}

      <SimpleGrid
        cols={{
          base: 1,
          lg: 2,
        }}
        spacing="md"
        mb="md"
      >
        {/* STAGE BREAKDOWN */}
        <SectionCard
          title="Stage-wise Breakdown"
          subtitle="Movement through the application pipeline"
        >
          <Table
            striped
            highlightOnHover
            verticalSpacing={7}
            fz={11}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th
                  style={tableHeaderStyles}
                >
                  Stage
                </Table.Th>

                <Table.Th
                  style={tableHeaderStyles}
                >
                  Entered
                </Table.Th>

                <Table.Th
                  style={tableHeaderStyles}
                >
                  Completed
                </Table.Th>

                <Table.Th
                  style={tableHeaderStyles}
                >
                  Pending
                </Table.Th>

                <Table.Th
                  style={tableHeaderStyles}
                >
                  Drop
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {STAGES.map((stage) => (
                <Table.Tr key={stage.stage}>
                  <Table.Td
                    fw={600}
                    style={tableCellStyles}
                  >
                    {stage.stage}
                  </Table.Td>

                  <Table.Td
                    style={tableCellStyles}
                  >
                    {stage.entered}
                  </Table.Td>

                  <Table.Td
                    style={tableCellStyles}
                  >
                    {stage.completed}
                  </Table.Td>

                  <Table.Td
                    style={{
                      ...tableCellStyles,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Badge
                      size="sm"
                      variant="light"
                      color={
                        stage.pending >= 8
                          ? "yellow"
                          : "gray"
                      }
                    >
                      {stage.pending}
                    </Badge>
                  </Table.Td>

                  <Table.Td
                    style={{
                      ...tableCellStyles,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Badge
                      size="sm"
                      variant="light"
                      color={
                        stage.drop >= 5
                          ? "red"
                          : "gray"
                      }
                    >
                      {stage.drop}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>

        {/* APPLICATION STATUS */}
        <SectionCard
          title="Application Status"
          subtitle="Distribution across application outcomes"
        >
          <Group
            align="center"
            gap="xl"
            wrap="nowrap"
          >
            <Box
              style={{
                flexShrink: 0,
              }}
            >
              <Donut
                centerValue={String(
                  APPLICATION_STATUS_TOTAL,
                )}
                centerLabel="TOTAL"
                segments={APPLICATION_STATUS_DATA.map(
                  (item) => ({
                    value: Math.max(
                      (item.value /
                        APPLICATION_STATUS_TOTAL) *
                      100,
                      0.01,
                    ),
                    color: item.color,
                  }),
                )}
              />
            </Box>

            <Stack
              gap={9}
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              {APPLICATION_STATUS_DATA.map(
                (item) => {
                  const percentage =
                    Math.round(
                      (item.value /
                        APPLICATION_STATUS_TOTAL) *
                      100,
                    );

                  return (
                    <Box key={item.label}>
                      <Group
                        justify="space-between"
                        gap={8}
                        mb={4}
                      >
                        <Group gap={6}>
                          <Box
                            w={7}
                            h={7}
                            bg={item.color}
                            style={{
                              borderRadius:
                                "50%",
                              flexShrink: 0,
                            }}
                          />

                          <Text
                            size="xs"
                            fw={600}
                          >
                            {item.label}
                          </Text>
                        </Group>

                        <Group gap={5}>
                          <Text
                            size="xs"
                            fw={800}
                          >
                            {item.value}
                          </Text>

                          <Text
                            size="9px"
                            c="dimmed"
                          >
                            ({percentage}%)
                          </Text>
                        </Group>
                      </Group>

                      <Progress
                        value={percentage}
                        size={5}
                        radius="xl"
                        color={item.color}
                      />
                    </Box>
                  );
                },
              )}
            </Stack>
          </Group>
        </SectionCard>
      </SimpleGrid>

      {/* ------------------------------------------------------------------ */}
      {/* CONVERSION ANALYSIS                                                */}
      {/* ------------------------------------------------------------------ */}

      <SectionCard
        title="Conversion Analysis"
        subtitle="Application movement between major pipeline stages"
        mb="md"
      >
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
            md: 5,
          }}
          spacing="lg"
        >
          {CONVERSION_STEPS.map((step) => (
            <Box key={step.label}>
              <Group
                justify="space-between"
                gap={8}
                mb={6}
              >
                <Text
                  size="xs"
                  fw={600}
                  lh={1.2}
                >
                  {step.label}
                </Text>

                <Text
                  size="xs"
                  fw={800}
                >
                  {step.value}%
                </Text>
              </Group>

              <Progress
                value={step.value}
                size={7}
                radius="xl"
              />
            </Box>
          ))}
        </SimpleGrid>
      </SectionCard>

      {/* ------------------------------------------------------------------ */}
      {/* SOURCE + APPLICATIONS                                             */}
      {/* ------------------------------------------------------------------ */}

      <SectionCard>
        <SimpleGrid
          cols={{
            base: 1,
            xl: 2,
          }}
          spacing="xl"
        >
          {/* SOURCE ANALYSIS */}
          <Box>
            <Group
              justify="space-between"
              mb="sm"
            >
              <Box>
                <Text fw={800} fz="sm">
                  Source Analysis
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  Application volume and outcomes
                </Text>
              </Box>
            </Group>

            <Table
              striped
              highlightOnHover
              verticalSpacing={8}
              fz={10}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th
                    style={tableHeaderStyles}
                  >
                    Source
                  </Table.Th>

                  <Table.Th
                    style={tableHeaderStyles}
                  >
                    Applications
                  </Table.Th>

                  <Table.Th
                    style={tableHeaderStyles}
                  >
                    Approved
                  </Table.Th>

                  <Table.Th
                    style={tableHeaderStyles}
                  >
                    Rejected
                  </Table.Th>

                  <Table.Th
                    style={tableHeaderStyles}
                  >
                    Approval Rate
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {SOURCES.map((source) => {
                  const approvalRate =
                    source.applications > 0
                      ? Math.round(
                        (source.approved /
                          source.applications) *
                        100,
                      )
                      : 0;

                  return (
                    <Table.Tr key={source.source}>
                      <Table.Td fw={700}>
                        {source.source}
                      </Table.Td>

                      <Table.Td>
                        {source.applications}
                      </Table.Td>

                      {/* APPROVED - FIXED */}
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant="light"
                          color="green"
                        >
                          {source.approved}
                        </Badge>
                      </Table.Td>

                      {/* REJECTED - FIXED */}
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant="light"
                          color="red"
                        >
                          {source.rejected}
                        </Badge>
                      </Table.Td>

                      <Table.Td miw={105}>
                        <MetricBar
                          value={approvalRate}
                          label={`${approvalRate}%`}
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>

          {/* APPLICATIONS */}
          <Box>
            <Group
              justify="space-between"
              align="center"
              mb="sm"
              gap="sm"
              wrap="wrap"
            >
              <Box>
                <Group
                  gap={7}
                  align="center"
                >
                  <Text fw={800} fz="sm">
                    Applications
                  </Text>

                  <Badge
                    size="xs"
                    variant="light"
                    color="blue"
                  >
                    {tableApps.length}
                  </Badge>
                </Group>

                <Text
                  size="xs"
                  c="dimmed"
                  mt={1}
                >
                  Showing up to 5 application records
                </Text>
              </Box>

              <Group
                gap={5}
                align="center"
              >
                {/* TABLE-LEVEL BRANCH FILTER */}
                <Select
                  size="xs"
                  radius="md"
                  w={135}
                  value={tableBranch}
                  onChange={(value) =>
                    setTableBranch(
                      value ?? "All Branches",
                    )
                  }
                  data={BRANCH_OPTIONS}
                  leftSection={
                    <IconBuilding size={13} />
                  }
                  checkIconPosition="right"
                  styles={filterInputStyles}
                />

                {/* TABLE-LEVEL OFFICER FILTER */}
                <Select
                  size="xs"
                  radius="md"
                  w={145}
                  value={tableOfficer}
                  onChange={(value) =>
                    setTableOfficer(
                      value ?? "All Officers",
                    )
                  }
                  data={OFFICER_OPTIONS}
                  leftSection={
                    <IconUser size={13} />
                  }
                  checkIconPosition="right"
                  styles={filterInputStyles}
                />

                <Button
                  size="xs"
                  radius="md"
                  variant="light"
                  leftSection={
                    <IconDownload size={13} />
                  }
                  onClick={() =>
                    exportApplications(
                      tableApps,
                    )
                  }
                  styles={{
                    root: {
                      height: 30,
                    },
                    label: {
                      fontSize: 10,
                      fontWeight: 700,
                    },
                  }}
                >
                  CSV
                </Button>
              </Group>
            </Group>

            <Divider mb="sm" />

            {tableApps.length > 0 ? (
              <Box
                style={{
                  overflowX: "auto",
                  overflowY: "hidden",
                }}
              >
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders={false}
                  verticalSpacing={7}
                  fz={10}
                  style={{
                    minWidth: 760,
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        ID
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Product
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Stage
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Status
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Source
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Requested
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Approved
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Age
                      </Table.Th>

                      <Table.Th
                        style={tableHeaderStyles}
                      >
                        Submitted
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {tableApps
                      .slice(0, 5)
                      .map((app) => (
                        <Table.Tr key={app.id}>
                          <Table.Td>
                            <Text
                              fw={800}
                              size="10px"
                              c="blue"
                            >
                              {app.id}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              fw={600}
                              size="10px"
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {app.product}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {app.stage}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Badge
                              size="sm"
                              variant="light"
                              color={statusColor(
                                app.status,
                              )}
                            >
                              {app.status}
                            </Badge>
                          </Table.Td>

                          {/* SOURCE - FIXED */}
                          <Table.Td>
                            <Badge
                              size="sm"
                              variant="light"
                              color="gray"
                            >
                              {app.source}
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              fw={600}
                              ta="right"
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatFullCurrency(
                                app.requested,
                              )}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              fw={700}
                              ta="right"
                              c={
                                app.approved > 0
                                  ? "green"
                                  : "dimmed"
                              }
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {app.approved > 0
                                ? formatFullCurrency(
                                  app.approved,
                                )
                                : "—"}
                            </Text>
                          </Table.Td>

                          {/* AGE - FIXED */}
                          <Table.Td>
                            <Badge
                              size="sm"
                              variant="light"
                              color={
                                app.age >= 7
                                  ? "red"
                                  : app.age >= 5
                                    ? "yellow"
                                    : "gray"
                              }
                            >
                              {app.age}d
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Text
                              size="10px"
                              c="dimmed"
                              style={{
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatDate(
                                app.submittedOn,
                              )}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Box>
            ) : (
              <EmptyState
                title="No applications found"
                description="Try changing the Branch, Officer, or report filters."
              />
            )}
          </Box>
        </SimpleGrid>
      </SectionCard>
    </ReportShell>
  );
}