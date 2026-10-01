import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Progress,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconClipboardData,
  IconCoin,
  IconDownload,
  IconFileAnalytics,
  IconFilter,
  IconRefresh,
  IconTrendingUp,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import {
  ReportShell,
  SectionCard,
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

type Tone =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

/* -------------------------------------------------------------------------- */
/* COLORS                                                                      */
/* -------------------------------------------------------------------------- */

const COLORS = {
  primary: "#3B34CD",
  accent: "#8B5CF6",
  neutral: "#64748B",
  success: "#3B34CD",
  warning: "#8B5CF6",
  danger: "#8B5CF6",
  muted: "#64748B",
  text: "#3B34CD",
  border: "rgba(100, 116, 139, 0.22)",
  surface: "var(--mantine-color-body)",
  track: "rgba(100, 116, 139, 0.14)",
};

const TONE_COLOR: Record<Tone, string> = {
  primary: COLORS.primary,
  info: COLORS.primary,
  success: COLORS.primary,
  warning: COLORS.accent,
  danger: COLORS.accent,
  muted: COLORS.neutral,
};

const filterStyles = {
  input: {
    minHeight: 30,
    height: 30,
    fontSize: 10,
    fontWeight: 650,
    backgroundColor: "var(--mantine-color-gray-0)",
  },
};

const tableHead = {
  fontSize: 8.5,
  fontWeight: 800,
  color: "var(--mantine-color-dimmed)",
  whiteSpace: "nowrap" as const,
};

/* -------------------------------------------------------------------------- */
/* OPTIONS                                                                     */
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

const DEFAULT_FILTERS: Filters = {
  product: "All Products",
  status: "All Statuses",
  source: "All Sources",
  dateRange: [null, null],
};

/* -------------------------------------------------------------------------- */
/* DATA                                                                        */
/* -------------------------------------------------------------------------- */

const APPLICATIONS: ApplicationRow[] = [
  ["APP-1001", "Personal Loan", "Delhi", "Disbursement", "Approved", "Branch", "Rahul Sharma", 450000, 420000, 2, "2026-09-20"],
  ["APP-1002", "Home Loan", "Noida", "Underwriting", "On Hold", "DSA", "Priya Singh", 3500000, 0, 5, "2026-09-18"],
  ["APP-1003", "Personal Loan", "Lucknow", "Approved", "Approved", "Digital", "Amit Verma", 300000, 285000, 1, "2026-09-21"],
  ["APP-1004", "Business Loan", "Delhi", "Credit Assessment", "Rejected", "Partner", "Rahul Sharma", 1200000, 0, 7, "2026-09-15"],
  ["APP-1005", "Personal Loan", "Jaipur", "Document Verification", "On Hold", "Branch", "Neha Gupta", 500000, 0, 4, "2026-09-19"],
  ["APP-1006", "Home Loan", "Delhi", "Disbursement", "Approved", "Digital", "Vikas Kumar", 4200000, 4000000, 3, "2026-09-19"],
  ["APP-1007", "Personal Loan", "Noida", "Credit Assessment", "Rejected", "DSA", "Priya Singh", 250000, 0, 8, "2026-09-14"],
  ["APP-1008", "Business Loan", "Lucknow", "Underwriting", "On Hold", "Partner", "Amit Verma", 1800000, 0, 6, "2026-09-16"],
  ["APP-1009", "Personal Loan", "Jaipur", "Approved", "Approved", "Digital", "Neha Gupta", 350000, 330000, 2, "2026-09-20"],
  ["APP-1010", "Home Loan", "Delhi", "Application", "Withdrawn", "Branch", "Vikas Kumar", 2800000, 0, 10, "2026-09-12"],
  ["APP-1011", "Personal Loan", "Noida", "Underwriting", "Approved", "Partner", "Rahul Sharma", 600000, 575000, 3, "2026-09-19"],
  ["APP-1012", "Business Loan", "Lucknow", "Document Verification", "On Hold", "DSA", "Amit Verma", 1500000, 0, 5, "2026-09-18"],
].map(
  ([
    id,
    product,
    branch,
    stage,
    status,
    source,
    officer,
    requested,
    approved,
    age,
    submittedOn,
  ]) => ({
    id,
    product,
    branch,
    stage,
    status,
    source,
    officer,
    requested,
    approved,
    age,
    submittedOn,
  }),
);

const STAGES: StageRow[] = [
  ["Application", 120, 108, 8, 4, "Incomplete application"],
  ["Document Verification", 108, 94, 9, 5, "Document mismatch"],
  ["Credit Assessment", 94, 78, 10, 6, "Credit policy"],
  ["Underwriting", 78, 68, 7, 3, "Additional review"],
  ["Approved", 68, 61, 4, 3, "Customer decline"],
  ["Disbursement", 61, 56, 3, 2, "Disbursement pending"],
].map(
  ([stage, entered, completed, pending, drop, reason]) => ({
    stage,
    entered,
    completed,
    pending,
    drop,
    reason,
  }),
);

const SOURCES: SourceRow[] = [
  ["Branch", 38, 22, 8],
  ["Digital", 31, 21, 5],
  ["DSA", 24, 12, 7],
  ["Partner", 19, 11, 5],
].map(([source, applications, approved, rejected]) => ({
  source,
  applications,
  approved,
  rejected,
}));

const CONVERSION_STEPS = [
  ["Application → Documents", 90],
  ["Documents → Credit", 87],
  ["Credit → Underwriting", 83],
  ["Underwriting → Approval", 87],
  ["Approval → Disbursement", 92],
].map(([label, value]) => ({ label, value }));

const APPLICATION_STATUS_DATA = [
  ["Approved", 42, COLORS.success],
  ["On Hold", 24, COLORS.warning],
  ["Rejected", 18, COLORS.danger],
  ["Withdrawn", 16, COLORS.muted],
].map(([label, value, color]) => ({
  label,
  value,
  color,
}));

const APPLICATION_STATUS_TOTAL =
  APPLICATION_STATUS_DATA.reduce(
    (sum, item) => sum + item.value,
    0,
  );

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

const badgeStyles = (color: string) => ({
  root: {
    color,
    backgroundColor: `${color}14`,
    border: `1px solid ${color}22`,
  },
});

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

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const statusColor = (status: ApplicationStatus) =>
  status === "Approved"
    ? COLORS.success
    : status === "Rejected"
      ? COLORS.warning
      : status === "On Hold"
        ? COLORS.primary
        : COLORS.muted;

const exportApplications = (rows: ApplicationRow[]) => {
  if (!rows.length) return;

  const headers = [
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

  const csv = [headers, ...rows.map((app) => [
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
  ])]
    .map((row) =>
      row.map((cell) => JSON.stringify(cell ?? "")).join(","),
    )
    .join("\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "application-pipeline-report.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

/* -------------------------------------------------------------------------- */
/* SMALL UI COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */

function KpiCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  const color = TONE_COLOR[tone];

  return (
    <Card
      withBorder
      radius="md"
      p={8}
      h="100%"
      style={{
        borderColor: COLORS.border,
        background: COLORS.surface,
      }}
    >
      <Group gap={7} wrap="nowrap" align="flex-start">
        <ThemeIcon
          size={23}
          radius="sm"
          variant="light"
          style={{
            flexShrink: 0,
            color,
            backgroundColor: `${color}14`,
          }}
        >
          {icon}
        </ThemeIcon>

        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text
            fz={8}
            fw={800}
            c="dimmed"
            tt="uppercase"
            truncate
            lh={1}
          >
            {label}
          </Text>

          <Text fz={15} fw={900} mt={3} truncate lh={1.05}>
            {value}
          </Text>

          {helper && (
            <Text fz={7.5} c="dimmed" mt={3} truncate>
              {helper}
            </Text>
          )}
        </Box>
      </Group>
    </Card>
  );
}

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
      onChange={(value) => onChange(value ?? data[0])}
      data={data}
      leftSection={icon}
      checkIconPosition="right"
      styles={filterStyles}
    />
  );
}

function TinyPill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <Badge
      size="xs"
      radius="sm"
      variant="light"
      styles={badgeStyles(TONE_COLOR[tone])}
    >
      {children}
    </Badge>
  );
}

function MetricBar({
  value,
  label,
  color = COLORS.primary,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <Group gap={6} wrap="nowrap">
      <Box style={{ flex: 1, minWidth: 20 }}>
        <Progress
          value={safeValue}
          size={5}
          radius="xl"
          styles={{
            section: { backgroundColor: color },
          }}
        />
      </Box>

      <Text fz={8.5} fw={800} w={30} ta="right">
        {label}
      </Text>
    </Group>
  );
}

function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Array<{ value: number; color: string }>;
  centerValue: string;
  centerLabel: string;
}) {
  const size = 96;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce(
    (sum, segment) => sum + Math.max(0, segment.value),
    0,
  );

  let offset = 0;

  return (
    <Box
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
      aria-label={`${centerLabel}: ${centerValue}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--mantine-color-gray-2)"
          strokeWidth={strokeWidth}
        />

        {segments.map((segment, index) => {
          const dash = total
            ? (segment.value / total) * circumference
            : 0;

          const currentOffset = offset;
          offset += dash;

          return (
            <circle
              key={`${segment.color}-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>

      <Stack
        gap={0}
        align="center"
        justify="center"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <Text fz={17} fw={900} lh={1}>
          {centerValue}
        </Text>
        <Text fz={7} fw={800} c="dimmed" mt={2}>
          {centerLabel}
        </Text>
      </Stack>
    </Box>
  );
}

function StageFlow({ stage }: { stage: StageRow }) {
  const total = Math.max(stage.entered, 1);
  const completed = (stage.completed / total) * 100;
  const pending = (stage.pending / total) * 100;
  const drop = (stage.drop / total) * 100;

  return (
    <Box py={4}>
      <Group justify="space-between" gap={8} mb={4} wrap="nowrap">
        <Text fz={9.5} fw={750} truncate style={{ flex: 1 }}>
          {stage.stage}
        </Text>

        <Group gap={6} wrap="nowrap">
          <Text fz={8.5} c="dimmed">
            <b>{stage.entered}</b> entered
          </Text>

          <Text fz={8.5} c={COLORS.success}>
            <b>{stage.completed}</b> done
          </Text>

          <Text fz={8.5} c={COLORS.warning}>
            <b>{stage.pending}</b> pending
          </Text>

          <Text fz={8.5} c={COLORS.danger}>
            <b>{stage.drop}</b> drop
          </Text>
        </Group>
      </Group>

      <Box
        style={{
          display: "flex",
          height: 6,
          borderRadius: 99,
          overflow: "hidden",
          background: COLORS.track,
        }}
      >
        <Box
          style={{
            width: `${completed}%`,
            background: COLORS.success,
          }}
        />
        <Box
          style={{
            width: `${pending}%`,
            background: COLORS.warning,
          }}
        />
        <Box
          style={{
            width: `${drop}%`,
            background: COLORS.danger,
          }}
        />
      </Box>

      <Text fz={7.5} c="dimmed" mt={3} truncate>
        Primary drop reason: {stage.reason}
      </Text>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function ApplicationPipelineAnalytics() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [tableBranch, setTableBranch] = useState("All Branches");
  const [tableOfficer, setTableOfficer] = useState("All Officers");

  const setFilter = <K extends keyof Filters>(
    key: K,
    value: Filters[K],
  ) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setTableBranch("All Branches");
    setTableOfficer("All Officers");
  };

  const hasActiveFilters =
    filters.product !== "All Products" ||
    filters.status !== "All Statuses" ||
    filters.source !== "All Sources" ||
    filters.dateRange.some(Boolean) ||
    tableBranch !== "All Branches" ||
    tableOfficer !== "All Officers";

  const filteredApps = useMemo(() => {
    const [from, to] = filters.dateRange;

    const fromTime = from
      ? new Date(
          from.getFullYear(),
          from.getMonth(),
          from.getDate(),
        ).getTime()
      : null;

    const toTime = to
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

      const submitted = new Date(
        `${app.submittedOn}T00:00:00`,
      ).getTime();

      return (
        (fromTime === null || submitted >= fromTime) &&
        (toTime === null || submitted <= toTime)
      );
    });
  }, [filters]);

  const tableApps = useMemo(
    () =>
      filteredApps.filter(
        (app) =>
          (tableBranch === "All Branches" ||
            app.branch === tableBranch) &&
          (tableOfficer === "All Officers" ||
            app.officer === tableOfficer),
      ),
    [filteredApps, tableBranch, tableOfficer],
  );

  const metrics = useMemo(() => {
    const total = filteredApps.length;
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

    return {
      total,
      approved,
      rejected,
      withdrawn,
      active,
      requested: filteredApps.reduce(
        (sum, app) => sum + app.requested,
        0,
      ),
      approvedAmount: filteredApps.reduce(
        (sum, app) => sum + app.approved,
        0,
      ),
      conversion: total
        ? Math.round((approved / total) * 100)
        : 0,
      dropOff: total
        ? Math.round(
            ((rejected + withdrawn) / total) * 100,
          )
        : 0,
    };
  }, [filteredApps]);

  const kpis = [
    [
      "Total Applications",
      `${metrics.total}`,
      "Filtered",
      "primary",
      <IconClipboardData size={14} />,
    ],
    [
      "Active Applications",
      `${metrics.active}`,
      "Currently on hold",
      "warning",
      <IconTrendingUp size={14} />,
    ],
    [
      "Approved",
      `${metrics.approved}`,
      `${metrics.conversion}% of total`,
      "success",
      <IconCheck size={14} />,
    ],
    [
      "Rejected",
      `${metrics.rejected}`,
      "Decisioned",
      "danger",
      <IconX size={14} />,
    ],
    [
      "Inactive",
      `${metrics.withdrawn}`,
      "Withdrawn",
      "muted",
      <IconUser size={14} />,
    ],
    [
      "Conversion Rate",
      `${metrics.conversion}%`,
      "Approved / total",
      "success",
      <IconTrendingUp size={14} />,
    ],
    [
      "Drop-off Rate",
      `${metrics.dropOff}%`,
      "Rejected + inactive",
      "danger",
      <IconX size={14} />,
    ],
    [
      "Requested Amount",
      formatCurrency(metrics.requested),
      "Total requested",
      "primary",
      <IconCoin size={14} />,
    ],
    [
      "Approved Amount",
      formatCurrency(metrics.approvedAmount),
      "Total approved",
      "success",
      <IconCoin size={14} />,
    ],
  ] as const;

  return (
    <ReportShell
      title="Application & Pipeline Analytics"
      subtitle="Monitor application volume, pipeline movement, conversion and application-level activity."
      filters={
        <Group gap={6} wrap="wrap" align="center">
          <ReportFilter
            value={filters.product}
            onChange={(value) => setFilter("product", value)}
            data={PRODUCT_OPTIONS}
            width={150}
            icon={<IconClipboardData size={13} />}
          />

          <ReportFilter
            value={filters.status}
            onChange={(value) => setFilter("status", value)}
            data={STATUS_OPTIONS}
            width={135}
            icon={<IconFilter size={13} />}
          />

          <ReportFilter
            value={filters.source}
            onChange={(value) => setFilter("source", value)}
            data={SOURCE_OPTIONS}
            width={125}
            icon={<IconTrendingUp size={13} />}
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
            leftSection={<IconCalendar size={13} />}
            styles={filterStyles}
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
            leftSection={<IconCalendar size={13} />}
            styles={filterStyles}
          />

          <Button
            size="xs"
            radius="md"
            variant="subtle"
            h={30}
            leftSection={<IconRefresh size={13} />}
            onClick={resetFilters}
            style={{
              color: hasActiveFilters
                ? COLORS.primary
                : COLORS.muted,
              backgroundColor: hasActiveFilters
                ? `${COLORS.primary}0D`
                : "transparent",
            }}
          >
            Reset
          </Button>
        </Group>
      }
    >
      {/* KPI SNAPSHOT */}
      <Stack gap={7}>
        <SimpleGrid
          cols={{
            base: 2,
            xs: 3,
            sm: 4,
            md: 5,
          }}
          spacing={7}
        >
          {kpis.slice(0, 5).map(
            ([label, value, helper, tone, icon]) => (
              <KpiCard
                key={label}
                label={label}
                value={value}
                helper={helper}
                tone={tone}
                icon={icon}
              />
            ),
          )}
        </SimpleGrid>

        <SimpleGrid
          cols={{
            base: 2,
            xs: 3,
            sm: 4,
          }}
          spacing={7}
        >
          {kpis.slice(5).map(
            ([label, value, helper, tone, icon]) => (
              <KpiCard
                key={label}
                label={label}
                value={value}
                helper={helper}
                tone={tone}
                icon={icon}
              />
            ),
          )}
        </SimpleGrid>
      </Stack>

      {/* PIPELINE + STATUS */}
      <SimpleGrid
        cols={{
          base: 1,
          lg: 2,
        }}
        spacing={10}
        mt={10}
      >
        <SectionCard
          title="Stage-wise Breakdown"
          subtitle="Movement through the application pipeline"
        >
          <Stack
            gap={0}
            divider={
              <Box h={1} bg={COLORS.track} />
            }
          >
            {STAGES.map((stage) => (
              <StageFlow
                key={stage.stage}
                stage={stage}
              />
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Application Status"
          subtitle="Distribution across application outcomes"
        >
          <Group
            align="center"
            gap={15}
            wrap="nowrap"
          >
            <Donut
              centerValue={String(
                APPLICATION_STATUS_TOTAL,
              )}
              centerLabel="TOTAL"
              segments={APPLICATION_STATUS_DATA.map(
                (item) => ({
                  value: item.value,
                  color: item.color,
                }),
              )}
            />

            <Stack gap={7} style={{ flex: 1, minWidth: 0 }}>
              {APPLICATION_STATUS_DATA.map((item) => {
                const pct = Math.round(
                  (item.value /
                    APPLICATION_STATUS_TOTAL) *
                    100,
                );

                return (
                  <Box key={item.label}>
                    <Group
                      justify="space-between"
                      gap={8}
                      mb={3}
                    >
                      <Group gap={7} wrap="nowrap">
                        <Box
                          w={8}
                          h={8}
                          style={{
                            borderRadius: 99,
                            background: item.color,
                          }}
                        />

                        <Text fz={9.5} fw={700}>
                          {item.label}
                        </Text>
                      </Group>

                      <Text fz={9.5} fw={850}>
                        {item.value}{" "}
                        <Text
                          span
                          fz={8}
                          c="dimmed"
                        >
                          ({pct}%)
                        </Text>
                      </Text>
                    </Group>

                    <Progress
                      value={pct}
                      size={5}
                      radius="xl"
                      styles={{
                        section: {
                          backgroundColor: item.color,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Group>

          <Box
            mt={10}
            p={7}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              background: COLORS.surface,
            }}
          >
            <Group justify="space-between">
              <Text
                fz={8}
                fw={800}
                c="dimmed"
                tt="uppercase"
              >
                Decision mix
              </Text>

              <Text fz={10} fw={850}>
                {APPLICATION_STATUS_TOTAL} applications
              </Text>
            </Group>
          </Box>
        </SectionCard>
      </SimpleGrid>

      {/* CONVERSION */}
      <Box mt={10}>
        <SectionCard
          title="Conversion Analysis"
          subtitle="Application movement between major pipeline stages"
        >
          <ScrollArea type="auto">
            <Group
              gap={0}
              wrap="nowrap"
              align="stretch"
              style={{ minWidth: 650 }}
            >
              {CONVERSION_STEPS.map((step, index) => (
                <Box
                  key={step.label}
                  style={{
                    flex: 1,
                    minWidth: 130,
                    position: "relative",
                    padding: "3px 10px",
                  }}
                >
                  {index > 0 && (
                    <IconArrowRight
                      size={14}
                      style={{
                        position: "absolute",
                        left: -7,
                        top: 27,
                        color: COLORS.muted,
                      }}
                    />
                  )}

                  <Text
                    fz={8}
                    c="dimmed"
                    fw={800}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Text>

                  <Text
                    fz={9.5}
                    fw={750}
                    mt={3}
                    lh={1.2}
                  >
                    {step.label}
                  </Text>

                  <Group
                    justify="space-between"
                    mt={6}
                    mb={3}
                  >
                    <Text fz={8} c="dimmed">
                      Conversion
                    </Text>

                    <Text fz={10} fw={900}>
                      {step.value}%
                    </Text>
                  </Group>

                  <Progress
                    value={step.value}
                    size={6}
                    radius="xl"
                    styles={{
                      section: {
                        background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
                      },
                    }}
                  />
                </Box>
              ))}
            </Group>
          </ScrollArea>
        </SectionCard>
      </Box>

      {/* SOURCE + APPLICATIONS */}
      <Box mt={10}>
        <SectionCard>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(270px, 0.72fr) minmax(0, 1.55fr)",
              gap: 16,
            }}
          >
            {/* SOURCE ANALYSIS */}
            <Box style={{ minWidth: 0 }}>
              <Text fw={850} fz="sm">
                Source Analysis
              </Text>

              <Text fz={8.5} c="dimmed" mb="sm">
                Application volume and outcomes
              </Text>

              <Table
                verticalSpacing={5}
                fz={9}
              >
                <Table.Thead>
                  <Table.Tr>
                    {[
                      "Source",
                      "Applications",
                      "Approved",
                      "Rejected",
                      "Approval Rate",
                    ].map((head) => (
                      <Table.Th
                        key={head}
                        style={tableHead}
                      >
                        {head}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {SOURCES.map((source) => {
                    const rate = source.applications
                      ? Math.round(
                          (source.approved /
                            source.applications) *
                            100,
                        )
                      : 0;

                    return (
                      <Table.Tr key={source.source}>
                        <Table.Td fw={750}>
                          {source.source}
                        </Table.Td>

                        <Table.Td>
                          {source.applications}
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="sm"
                            variant="light"
                            styles={badgeStyles(
                              COLORS.success,
                            )}
                          >
                            {source.approved}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="sm"
                            variant="light"
                            styles={badgeStyles(
                              COLORS.warning,
                            )}
                          >
                            {source.rejected}
                          </Badge>
                        </Table.Td>

                        <Table.Td miw={95}>
                          <MetricBar
                            value={rate}
                            label={`${rate}%`}
                          />
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            {/* APPLICATIONS */}
            <Box style={{ minWidth: 0 }}>
              <Group
                justify="space-between"
                align="center"
                mb="sm"
                gap="sm"
                wrap="wrap"
              >
                <Box>
                  <Group gap={7}>
                    <Text fw={850} fz="sm">
                      Applications
                    </Text>

                    <Badge
                      size="xs"
                      variant="light"
                      styles={badgeStyles(
                        COLORS.primary,
                      )}
                    >
                      {tableApps.length}
                    </Badge>
                  </Group>

                  <Text fz={8.5} c="dimmed" mt={1}>
                    Showing up to 5 application records
                  </Text>
                </Box>

                <Group gap={5} wrap="wrap">
                  <Select
                    size="xs"
                    radius="md"
                    w={125}
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
                    styles={filterStyles}
                  />

                  <Select
                    size="xs"
                    radius="md"
                    w={135}
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
                    styles={filterStyles}
                  />

                  <Button
                    size="xs"
                    radius="md"
                    variant="light"
                    h={30}
                    leftSection={
                      <IconDownload size={13} />
                    }
                    onClick={() =>
                      exportApplications(tableApps)
                    }
                    disabled={!tableApps.length}
                  >
                    CSV
                  </Button>
                </Group>
              </Group>

              {tableApps.length ? (
                <ScrollArea type="auto">
                  <Table
                    highlightOnHover
                    verticalSpacing={5}
                    horizontalSpacing={6}
                    fz={8.5}
                    style={{
                      minWidth: 720,
                      tableLayout: "fixed",
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        {[
                          "ID",
                          "Product",
                          "Stage",
                          "Status",
                          "Source",
                          "Requested",
                          "Approved",
                          "Age",
                          "Submitted",
                        ].map((head) => (
                          <Table.Th
                            key={head}
                            style={tableHead}
                          >
                            {head}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {tableApps
                        .slice(0, 5)
                        .map((app) => (
                          <Table.Tr key={app.id}>
                            <Table.Td>
                              <Text
                                fw={850}
                                fz={8.5}
                                c={COLORS.primary}
                                truncate
                              >
                                {app.id}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              <Text
                                fz={8.5}
                                fw={650}
                                truncate
                              >
                                {app.product}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              <Text
                                fz={8.5}
                                truncate
                              >
                                {app.stage}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              <Badge
                                size="xs"
                                variant="light"
                                styles={badgeStyles(
                                  statusColor(
                                    app.status,
                                  ),
                                )}
                              >
                                {app.status}
                              </Badge>
                            </Table.Td>

                            <Table.Td>
                              <Badge
                                size="xs"
                                variant="light"
                                styles={badgeStyles(
                                  COLORS.muted,
                                )}
                              >
                                {app.source}
                              </Badge>
                            </Table.Td>

                            <Table.Td ta="right">
                              <Text
                                fz={8.5}
                                fw={700}
                                truncate
                              >
                                {formatFullCurrency(
                                  app.requested,
                                )}
                              </Text>
                            </Table.Td>

                            <Table.Td ta="right">
                              <Text
                                fz={8.5}
                                fw={750}
                                c={
                                  app.approved
                                    ? COLORS.success
                                    : "dimmed"
                                }
                                truncate
                              >
                                {app.approved
                                  ? formatFullCurrency(
                                      app.approved,
                                    )
                                  : "—"}
                              </Text>
                            </Table.Td>

                            <Table.Td>
                              <Badge
                                size="xs"
                                variant="light"
                                styles={badgeStyles(
                                  app.age >= 7
                                    ? COLORS.warning
                                    : app.age >= 5
                                      ? COLORS.primary
                                      : COLORS.muted,
                                )}
                              >
                                {app.age}d
                              </Badge>
                            </Table.Td>

                            <Table.Td>
                              <Text
                                fz={8.5}
                                c="dimmed"
                                truncate
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
                </ScrollArea>
              ) : (
                <Box
                  py={20}
                  ta="center"
                  style={{
                    border: `1px dashed ${COLORS.border}`,
                    borderRadius: 8,
                    background: "#FAFAFA",
                  }}
                >
                  <Text fz={10.5} fw={800}>
                    No applications found
                  </Text>

                  <Text fz={8.5} c="dimmed" mt={3}>
                    Try changing the Branch, Officer, or
                    report filters.
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        </SectionCard>
      </Box>
    </ReportShell>
  );
}