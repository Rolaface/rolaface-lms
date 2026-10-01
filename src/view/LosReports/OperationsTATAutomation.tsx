import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Modal,
  Progress,
  RingProgress,
  Select,
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
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconCalendar,
  IconCircleCheck,
  IconChevronRight,
  IconClockHour4,
  IconDownload,
  IconEye,
  IconFilter,
  IconRefresh,
  IconRobot,
  IconSearch,
} from "@tabler/icons-react";

/* -------------------------------------------------------------------------- */
/* TOKENS                                                                      */
/* -------------------------------------------------------------------------- */

const PRIMARY = "#3B34CD";
const SUCCESS = "#0C9F6E";
const WARNING = "#D97706";
const DANGER = "#D92D20";
const TEXT = "#17233B";
const MUTED = "#7A8496";
const BORDER = "#E6EAF0";
const BG = "#F7F8FB";
const TRACK = "#EEF1F5";

/* Hoisted style objects: created once instead of on every render. */
const BORDER_BOTTOM: CSSProperties = { borderBottom: `1px solid ${BORDER}` };
const BORDER_TOP: CSSProperties = { borderTop: `1px solid ${BORDER}` };
const CARD_BASE: CSSProperties = {
  borderColor: BORDER,
  background: "#FFF",
  boxShadow: "0 1px 3px rgba(23,35,59,0.025)",
};
const FULL_HEIGHT_COLUMN: CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
};
const INSET_PANEL: CSSProperties = {
  background: "#F8FAFC",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
};
const CAPS_LABEL: CSSProperties = { letterSpacing: 0.6 };
const PILL: CSSProperties = { borderRadius: 999 };

const tint = (color: string, alpha = "10"): CSSProperties => ({
  color,
  background: `${color}${alpha}`,
});

/* -------------------------------------------------------------------------- */
/* DATA & TYPES                                                                */
/* -------------------------------------------------------------------------- */

type SlaStatus = "Breached" | "At risk" | "Within SLA";
type StageName = "Intake" | "KYC" | "Underwriting" | "Approval";

interface Application {
  id: string;
  customerName: string;
  product: string;
  source: string;
  branch: string;
  submitted: string;
  stage: StageName;
  timeInStage: string;
  totalTat: string;
  timeInStageMinutes: number;
  tatMinutes: number;
  sla: SlaStatus;
  automation: number;
  owner: string;
}

const reportSummary = {
  averageTat: "2h 48m",
  tatTarget: "3h 15m",
  slaMet: 91,
  breached: 12,
  atRisk: 9,
  protected: 116,
  processed: 128,
  agingOver24h: 11,
  automation: 68,
} as const;

const STAGE_OPTIONS = [
  { value: "all", label: "All stages" },
  { value: "Intake", label: "Intake" },
  { value: "KYC", label: "KYC" },
  { value: "Underwriting", label: "Underwriting" },
  { value: "Approval", label: "Approval" },
];

const BRANCH_OPTIONS = [
  { value: "all", label: "All Branches" },
  "Lusaka",
  "Ndola",
  "Kitwe",
  "Livingstone",
];

const PRODUCT_OPTIONS = [
  { value: "all", label: "All Products" },
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "Consumer Loan",
];

const DEFAULT_DATE_RANGE: [string, string] = ["2026-09-01", "2026-09-30"];

const applications: Application[] = [
  {
    id: "APP-2048",
    customerName: "Amit Sharma",
    product: "Business Loan",
    source: "Web",
    branch: "Lusaka",
    submitted: "2026-09-20",
    stage: "Underwriting",
    timeInStage: "48h 15m",
    totalTat: "4d 2h",
    timeInStageMinutes: 2895,
    tatMinutes: 5780,
    sla: "Breached",
    automation: 54,
    owner: "Neha Verma",
  },
  {
    id: "APP-2045",
    customerName: "Priya Patel",
    product: "Home Loan",
    source: "Branch",
    branch: "Ndola",
    submitted: "2026-09-20",
    stage: "KYC",
    timeInStage: "9h 20m",
    totalTat: "1d 6h",
    timeInStageMinutes: 560,
    tatMinutes: 1800,
    sla: "At risk",
    automation: 67,
    owner: "R. Khan",
  },
  {
    id: "APP-2042",
    customerName: "Daniel Mwansa",
    product: "Personal Loan",
    source: "Partner",
    branch: "Kitwe",
    submitted: "2026-09-21",
    stage: "Approval",
    timeInStage: "3h 40m",
    totalTat: "2d 4h",
    timeInStageMinutes: 220,
    tatMinutes: 3120,
    sla: "Within SLA",
    automation: 73,
    owner: "P. Verma",
  },
  {
    id: "APP-2039",
    customerName: "Grace Banda",
    product: "Personal Loan",
    source: "Web",
    branch: "Lusaka",
    submitted: "2026-09-21",
    stage: "Intake",
    timeInStage: "1h 15m",
    totalTat: "1h 15m",
    timeInStageMinutes: 75,
    tatMinutes: 75,
    sla: "Within SLA",
    automation: 88,
    owner: "S. Gupta",
  },
  {
    id: "APP-2036",
    customerName: "Joseph Phiri",
    product: "Consumer Loan",
    source: "Branch",
    branch: "Ndola",
    submitted: "2026-09-18",
    stage: "Underwriting",
    timeInStage: "31h 10m",
    totalTat: "3d 8h",
    timeInStageMinutes: 1870,
    tatMinutes: 4800,
    sla: "Breached",
    automation: 42,
    owner: "N. Singh",
  },
];

const SLA_RANK: Record<SlaStatus, number> = {
  Breached: 0,
  "At risk": 1,
  "Within SLA": 2,
};

const SLA_COLOR: Record<SlaStatus, string> = {
  Breached: DANGER,
  "At risk": WARNING,
  "Within SLA": SUCCESS,
};

const SLA_LABEL: Record<SlaStatus, string> = {
  Breached: "Breached",
  "At risk": "At Risk",
  "Within SLA": "On Track",
};

const STAGE_ORDER: Record<StageName, number> = {
  Intake: 0,
  KYC: 1,
  Underwriting: 2,
  Approval: 3,
};

const QUEUE_HEADINGS = [
  "App ID",
  "Customer Name",
  "Loan Product",
  "Current Stage",
  "Time in Stage",
  "Total TAT",
  "SLA Status",
  "Assigned Owner",
  "Action",
] as const;

const HEADING_STYLE: CSSProperties = {
  color: MUTED,
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.25,
  whiteSpace: "nowrap",
};

/* -------------------------------------------------------------------------- */
/* SHARED PRIMITIVES                                                           */
/* -------------------------------------------------------------------------- */

interface SurfaceCardProps {
  children: ReactNode;
  p?: string | number;
  mb?: string | number;
  mt?: string | number;
  style?: CSSProperties;
}

const SurfaceCard = memo(function SurfaceCard({
  children,
  p = "md",
  mb,
  mt,
  style,
}: SurfaceCardProps) {
  return (
    <Card
      withBorder
      radius="md"
      p={p}
      mb={mb}
      mt={mt}
      style={style ? { ...CARD_BASE, ...style } : CARD_BASE}
    >
      {children}
    </Card>
  );
});

const KPI_CARD_STYLE: CSSProperties = {
  minHeight: 88,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
  tone?: string;
  delta?: string;
}

const KpiCard = memo(function KpiCard({
  icon,
  label,
  value,
  meta,
  tone = PRIMARY,
  delta,
}: KpiCardProps) {
  const toneStyle = tint(tone);

  return (
    <SurfaceCard p="sm" style={KPI_CARD_STYLE}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="10px" fw={600} c={MUTED}>
          {label}
        </Text>

        <ThemeIcon size={28} radius="xl" variant="light" style={toneStyle}>
          {icon}
        </ThemeIcon>
      </Group>

      <Box mt={7}>
        <Group gap={7} align="baseline" wrap="nowrap">
          <Text size="24px" fw={850} c={TEXT} lh={1}>
            {value}
          </Text>

          {delta && (
            <Badge size="xs" variant="light" style={toneStyle}>
              {delta}
            </Badge>
          )}
        </Group>

        <Text size="10px" c={MUTED} mt={4}>
          {meta}
        </Text>
      </Box>
    </SurfaceCard>
  );
});

/* -------------------------------------------------------------------------- */
/* PIPELINE BY STAGE                                                           */
/* -------------------------------------------------------------------------- */

const pipelineStages = [
  { stage: "Intake", files: 50 },
  { stage: "KYC", files: 20 },
  { stage: "Underwriting", files: 120 },
  { stage: "Approval", files: 10 },
] as const;

/* Static data, so derive once at module level instead of on every render. */
const TOTAL_ACTIVE_FILES = pipelineStages.reduce(
  (sum, item) => sum + item.files,
  0
);

const PIPELINE_BOTTLENECK = pipelineStages.reduce((largest, item) =>
  item.files > largest.files ? item : largest
);

const PIPELINE_ROWS = pipelineStages.map((item) => ({
  ...item,
  share: (item.files / TOTAL_ACTIVE_FILES) * 100,
  isBottleneck: item.stage === PIPELINE_BOTTLENECK.stage,
}));

const PROGRESS_STYLES = {
  root: { background: TRACK },
  section: { background: PRIMARY },
};

const PipelineRow = memo(function PipelineRow({
  stage,
  files,
  share,
  isBottleneck,
}: {
  stage: string;
  files: number;
  share: number;
  isBottleneck: boolean;
}) {
  const rounded = Math.round(share);

  return (
    <Box
      px={isBottleneck ? "sm" : 0}
      py={isBottleneck ? 8 : 0}
      mx={isBottleneck ? -4 : 0}
      style={{
        borderRadius: 8,
        background: isBottleneck ? "#F8FAFC" : "transparent",
        border: isBottleneck
          ? `1px solid ${BORDER}`
          : "1px solid transparent",
      }}
    >
      <Group justify="space-between" align="center" mb={5} wrap="nowrap">
        <Group gap={7} wrap="nowrap">
          <Box
            w={isBottleneck ? 8 : 6}
            h={isBottleneck ? 8 : 6}
            style={{
              ...PILL,
              background: isBottleneck ? PRIMARY : MUTED,
            }}
          />

          <Text size="xs" fw={isBottleneck ? 700 : 600} c={TEXT}>
            {stage}
          </Text>

          <Badge
            size="xs"
            variant="light"
            style={{
              color: isBottleneck ? PRIMARY : MUTED,
              background: isBottleneck ? `${PRIMARY}10` : "#F1F3F9",
              border: isBottleneck ? `1px solid ${PRIMARY}18` : undefined,
            }}
          >
            {isBottleneck ? `Peak: ${rounded}%` : `${rounded}%`}
          </Badge>
        </Group>

        <Group gap={4} align="baseline" wrap="nowrap">
          <Text size="xs" fw={isBottleneck ? 800 : 700} c={TEXT}>
            {files}
          </Text>

          <Text size="9px" c={MUTED}>
            files
          </Text>
        </Group>
      </Group>

      <Progress value={share} size={8} radius="xl" styles={PROGRESS_STYLES} />
    </Box>
  );
});

const ACTIVE_QUEUE_BOX: CSSProperties = {
  ...INSET_PANEL,
  flexShrink: 0,
};

const PipelineStageChart = memo(function PipelineStageChart() {
  const bottleneckShare = Math.round(
    (PIPELINE_BOTTLENECK.files / TOTAL_ACTIVE_FILES) * 100
  );

  return (
    <SurfaceCard p="md" style={FULL_HEIGHT_COLUMN}>
      <Box pb="md" style={BORDER_BOTTOM}>
        <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
          <Box>
            <Group gap={7} wrap="wrap">
              <Text
                size="sm"
                fw={750}
                c={TEXT}
                style={{ letterSpacing: -0.2 }}
              >
                Pipeline by Stage
              </Text>

              <Badge size="xs" variant="light" style={tint(PRIMARY)}>
                Live
              </Badge>
            </Group>

            <Text size="10px" c={MUTED} mt={3}>
              Current files by workflow stage
            </Text>
          </Box>

          <Box ta="right" px="sm" py={6} style={ACTIVE_QUEUE_BOX}>
            <Text
              size="8px"
              fw={800}
              c={MUTED}
              tt="uppercase"
              style={CAPS_LABEL}
            >
              Active Queue
            </Text>

            <Group justify="flex-end" align="baseline" gap={4} mt={1} wrap="nowrap">
              <Text size="md" fw={850} c={TEXT} lh={1}>
                {TOTAL_ACTIVE_FILES}
              </Text>

              <Text size="9px" c={MUTED}>
                files
              </Text>
            </Group>
          </Box>
        </Group>
      </Box>

      <Stack gap="sm" pt="md">
        {PIPELINE_ROWS.map((row) => (
          <PipelineRow
            key={row.stage}
            stage={row.stage}
            files={row.files}
            share={row.share}
            isBottleneck={row.isBottleneck}
          />
        ))}
      </Stack>

      <Box mt="auto" pt="sm" style={BORDER_TOP}>
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Group gap={6} wrap="nowrap">
            <Text size="9px" fw={700} c={TEXT}>
              <Box
                component="span"
                w={6}
                h={6}
                mr={5}
                style={{
                  display: "inline-block",
                  ...PILL,
                  background: WARNING,
                }}
              />
              Bottleneck:
            </Text>

            <Text size="9px" c={MUTED}>
              {PIPELINE_BOTTLENECK.stage} ({bottleneckShare}%)
            </Text>
          </Group>

          <Text size="9px" c={MUTED} ta="right">
            Total Active Pipeline:{" "}
            <Text component="span" fw={750} c={TEXT}>
              {TOTAL_ACTIVE_FILES} files
            </Text>
          </Text>
        </Group>
      </Box>
    </SurfaceCard>
  );
});

/* -------------------------------------------------------------------------- */
/* SLA COMPLIANCE                                                              */
/* -------------------------------------------------------------------------- */

const SLA_TOTAL = reportSummary.processed;
const SLA_BREACHED = reportSummary.breached;
const SLA_WITHIN = Math.max(SLA_TOTAL - SLA_BREACHED, 0);
const SLA_WITHIN_EXACT = SLA_TOTAL ? (SLA_WITHIN / SLA_TOTAL) * 100 : 0;
const SLA_BREACHED_EXACT = SLA_TOTAL ? (SLA_BREACHED / SLA_TOTAL) * 100 : 0;
const SLA_WITHIN_PCT = Math.round(SLA_WITHIN_EXACT);

const RING_SECTIONS = [
  { value: SLA_WITHIN_EXACT, color: SUCCESS },
  { value: SLA_BREACHED_EXACT, color: DANGER },
];

const RING_WRAPPER: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const SlaStat = memo(function SlaStat({
  label,
  value,
  dotColor,
  glow,
  valueColor,
  percent,
  percentColor,
  percentWeight,
}: {
  label: string;
  value: number;
  dotColor: string;
  glow: string;
  valueColor: string;
  percent: string;
  percentColor: string;
  percentWeight: number;
}) {
  return (
    <Box p="sm" style={{ ...INSET_PANEL, height: "100%" }}>
      <Group justify="space-between" align="center" gap={5} wrap="nowrap">
        <Group gap={7} wrap="nowrap">
          <Box
            w={8}
            h={8}
            style={{
              ...PILL,
              background: dotColor,
              boxShadow: `0 0 0 4px ${glow}`,
              flexShrink: 0,
            }}
          />

          <Box>
            <Text size="9px" fw={600} c={MUTED}>
              {label}
            </Text>

            <Text size="md" fw={850} c={valueColor} mt={3} lh={1}>
              {value}
            </Text>
          </Box>
        </Group>

        <Text size="9px" fw={percentWeight} c={percentColor}>
          {percent}
        </Text>
      </Group>
    </Box>
  );
});

const SLAComplianceCard = memo(function SLAComplianceCard() {
  return (
    <SurfaceCard p="md" style={FULL_HEIGHT_COLUMN}>
      <Box pb="md" style={BORDER_BOTTOM}>
        <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
          <Box>
            <Group gap={7} wrap="wrap">
              <Text
                size="sm"
                fw={750}
                c={TEXT}
                style={{ letterSpacing: -0.2 }}
              >
                SLA Compliance
              </Text>

              <Badge
                size="xs"
                variant="light"
                leftSection={<IconCircleCheck size={11} />}
                style={tint(SUCCESS)}
              >
                Target Met
              </Badge>
            </Group>

            <Text size="10px" c={MUTED} mt={3}>
              Processed applications within SLA
            </Text>
          </Box>

          <Box ta="right">
            <Text
              size="8px"
              fw={800}
              c={MUTED}
              tt="uppercase"
              style={CAPS_LABEL}
            >
              Processed
            </Text>

            <Text size="sm" fw={850} c={TEXT} lh={1} mt={2}>
              {SLA_TOTAL}{" "}
              <Text component="span" size="9px" fw={500} c={MUTED}>
                total
              </Text>
            </Text>
          </Box>
        </Group>
      </Box>

      <Box py="md" style={RING_WRAPPER}>
        <RingProgress
          size={138}
          thickness={14}
          roundCaps
          sections={RING_SECTIONS}
          label={
            <Box ta="center" style={{ userSelect: "none" }}>
              <Text size="28px" fw={850} c={TEXT} lh={1}>
                {SLA_WITHIN_PCT}%
              </Text>

              <Text
                size="9px"
                fw={700}
                c={SUCCESS}
                mt={5}
                tt="uppercase"
                style={CAPS_LABEL}
              >
                Within SLA
              </Text>
            </Box>
          }
        />
      </Box>

      <Grid gutter="xs" mt={2}>
        <Grid.Col span={6}>
          <SlaStat
            label="Within SLA"
            value={SLA_WITHIN}
            dotColor={SUCCESS}
            glow={`${SUCCESS}12`}
            valueColor={TEXT}
            percent={`${SLA_WITHIN_EXACT.toFixed(1)}%`}
            percentColor={SUCCESS}
            percentWeight={800}
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <SlaStat
            label="Breached SLA"
            value={SLA_BREACHED}
            dotColor={DANGER}
            glow={`${DANGER}10`}
            valueColor={DANGER}
            percent={`${SLA_BREACHED_EXACT.toFixed(1)}%`}
            percentColor={MUTED}
            percentWeight={700}
          />
        </Grid.Col>
      </Grid>

      <Box mt="auto" pt="sm" style={BORDER_TOP}>
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Group gap={5} wrap="nowrap">
            <IconCircleCheck size={13} color={SUCCESS} />

            <Text size="9px" fw={650} c={TEXT}>
              {SLA_BREACHED_EXACT.toFixed(1)}% breach rate
            </Text>

            <Text size="9px" c={MUTED}>
              (within &lt;10% tolerance)
            </Text>
          </Group>

          <Text size="9px" fw={600} c={MUTED}>
            {SLA_TOTAL} evaluated applications
          </Text>
        </Group>
      </Box>
    </SurfaceCard>
  );
});

/* -------------------------------------------------------------------------- */
/* TIMELINE MODAL                                                              */
/* -------------------------------------------------------------------------- */

interface TimelineEvent {
  title: string;
  description: string;
  date: string;
  actor: string;
  current: boolean;
}

/** Highest stage index at which each event becomes visible. */
function buildTimeline(application: Application): TimelineEvent[] {
  const stageIndex = STAGE_ORDER[application.stage];
  const isUnderwriting = application.stage === "Underwriting";
  const isApproval = application.stage === "Approval";

  const events: Array<TimelineEvent & { order: number }> = [
    {
      order: 0,
      title: "Application Submitted",
      description: "Application entered the lending workflow.",
      date: application.submitted,
      actor: "System",
      current: false,
    },
    {
      order: 1,
      title: "Intake Completed",
      description: "Initial application information was validated.",
      date: "2026-09-20",
      actor: "Operations",
      current: false,
    },
    {
      order: 1,
      title: "KYC Completed",
      description: "Customer identity verification was completed.",
      date: "2026-09-21",
      actor: "Credit Operations",
      current: false,
    },
    {
      order: 2,
      title: "Underwriting",
      description: isUnderwriting
        ? `File has remained in Underwriting for ${application.timeInStage}.`
        : "Underwriting review completed before the file moved forward.",
      date: "2026-09-22",
      actor: application.owner,
      current: isUnderwriting,
    },
    {
      order: 3,
      title: "Approval",
      description: isApproval
        ? `File is currently awaiting approval. Total TAT is ${application.totalTat}.`
        : "Approval stage is pending or completed later in the workflow.",
      date: "2026-09-23",
      actor: isApproval ? application.owner : "Credit Team",
      current: isApproval,
    },
  ];

  return events.filter((event) => event.order <= stageIndex);
}

const TimelineModal = memo(function TimelineModal({
  application,
  onClose,
}: {
  application: Application | null;
  onClose: () => void;
}) {
  if (!application) return null;

  const timeline = buildTimeline(application);
  const slaTone = SLA_COLOR[application.sla];

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      size="lg"
      radius="md"
      title={
        <Box>
          <Text fw={800} size="sm" c={TEXT}>
            Timeline History
          </Text>

          <Text size="10px" c={MUTED} mt={2}>
            {application.id} · {application.customerName}
          </Text>
        </Box>
      }
    >
      <Stack gap="md">
        <Card
          withBorder
          radius="md"
          p="sm"
          style={{ borderColor: BORDER, background: BG }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Text size="10px" fw={800} c={MUTED}>
                LOAN PRODUCT
              </Text>

              <Text size="xs" fw={700} c={TEXT} mt={3}>
                {application.product}
              </Text>
            </Box>

            <Badge size="xs" variant="light" style={tint(slaTone)}>
              {SLA_LABEL[application.sla]}
            </Badge>
          </Group>

          <Group gap="lg" mt="sm">
            {[
              ["CURRENT STAGE", application.stage],
              ["TIME IN STAGE", application.timeInStage],
              ["TOTAL TAT", application.totalTat],
            ].map(([label, value]) => (
              <Box key={label}>
                <Text size="9px" c={MUTED} fw={700}>
                  {label}
                </Text>

                <Text size="xs" fw={700} c={TEXT} mt={2}>
                  {value}
                </Text>
              </Box>
            ))}
          </Group>
        </Card>

        <Box>
          <Text size="xs" fw={750} c={TEXT} mb="sm">
            Processing Timeline
          </Text>

          <Stack gap={0}>
            {timeline.map((event, index) => {
              const tone = event.current ? WARNING : PRIMARY;
              const isLast = index === timeline.length - 1;

              return (
                <Group
                  key={event.title}
                  align="flex-start"
                  gap="sm"
                  wrap="nowrap"
                >
                  <Box
                    style={{
                      width: 18,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      w={10}
                      h={10}
                      style={{
                        ...PILL,
                        background: `${tone}18`,
                        border: `3px solid ${tone}`,
                        boxSizing: "border-box",
                      }}
                    />

                    {!isLast && (
                      <Box w={1} h={55} style={{ background: BORDER }} />
                    )}
                  </Box>

                  <Box pb="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Text size="xs" fw={750} c={TEXT}>
                        {event.title}
                      </Text>

                      <Text size="9px" c={MUTED}>
                        {event.date}
                      </Text>
                    </Group>

                    <Text size="10px" c={MUTED} mt={3}>
                      {event.description}
                    </Text>

                    <Text size="9px" fw={700} c={PRIMARY} mt={4}>
                      {event.actor}
                    </Text>
                  </Box>
                </Group>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Modal>
  );
});

/* -------------------------------------------------------------------------- */
/* PRIORITY QUEUE ROW                                                          */
/* -------------------------------------------------------------------------- */

const QueueRow = memo(function QueueRow({
  row,
  onView,
}: {
  row: Application;
  onView: (row: Application) => void;
}) {
  const tone = SLA_COLOR[row.sla];

  return (
    <Table.Tr style={{ boxShadow: `inset 3px 0 0 ${tone}` }}>
      <Table.Td>
        <Text size="xs" fw={750} style={{ color: PRIMARY }}>
          {row.id}
        </Text>
      </Table.Td>

      <Table.Td>
        <Text size="xs" fw={650} c={TEXT}>
          {row.customerName}
        </Text>
      </Table.Td>

      <Table.Td>
        <Text size="xs" c={TEXT}>
          {row.product}
        </Text>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" variant="light" style={tint(PRIMARY)}>
          {row.stage}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text size="xs" fw={800} c={tone}>
          {row.timeInStage}
        </Text>
      </Table.Td>

      <Table.Td>
        <Text size="xs" fw={800} c={TEXT}>
          {row.totalTat}
        </Text>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" variant="light" style={tint(tone)}>
          {SLA_LABEL[row.sla]}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text size="xs" fw={600} c={TEXT}>
          {row.owner}
        </Text>
      </Table.Td>

      <Table.Td ta="right">
        <Tooltip label="View timeline">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={`View timeline for ${row.id}`}
            onClick={() => onView(row)}
          >
            <IconEye size={15} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  );
});

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

const PAGE_STYLE: CSSProperties = {
  background: BG,
  minHeight: "100%",
  color: TEXT,
};

const FILTER_BAR_STYLE: CSSProperties = {
  borderColor: BORDER,
  background: "#FFF",
};

const ALERT_CARD_STYLE: CSSProperties = {
  borderColor: `${WARNING}30`,
  background: "linear-gradient(90deg, #FFFDF5 0%, #FFFFFF 82%)",
};

const TABLE_STYLE: CSSProperties = { minWidth: 980 };
const TABLE_HEAD_STYLE: CSSProperties = { background: "#F8FAFC" };

export interface OperationsTATAutomationProps {
  onExport?: () => void;
  onGenerate?: () => void;
}

export function OperationsTATAutomation({
  onExport,
  onGenerate,
}: OperationsTATAutomationProps = {}) {
  const [product, setProduct] = useState("all");
  const [branch, setBranch] = useState("all");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>(
    DEFAULT_DATE_RANGE
  );
  const [stageFilter, setStageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  // Keeps typing responsive while the (potentially large) list re-filters.
  const deferredSearch = useDeferredValue(search);

  const isDefaultRange =
    dateRange[0] === DEFAULT_DATE_RANGE[0] &&
    dateRange[1] === DEFAULT_DATE_RANGE[1];

  const activeFilterCount =
    Number(product !== "all") +
    Number(branch !== "all") +
    Number(!isDefaultRange);

  const visibleApplications = useMemo(() => {
    const [from, to] = dateRange;
    const query = deferredSearch.trim().toLowerCase();

    return applications
      .filter(
        (row) =>
          (product === "all" || row.product === product) &&
          (branch === "all" || row.branch === branch) &&
          (!from || row.submitted >= from) &&
          (!to || row.submitted <= to) &&
          (stageFilter === "all" || row.stage === stageFilter) &&
          (!query ||
            row.id.toLowerCase().includes(query) ||
            row.customerName.toLowerCase().includes(query))
      )
      .sort(
        (a, b) =>
          SLA_RANK[a.sla] - SLA_RANK[b.sla] || b.tatMinutes - a.tatMinutes
      );
  }, [product, branch, dateRange, deferredSearch, stageFilter]);

  const queueStats = useMemo(() => {
    let breached = 0;
    let atRisk = 0;

    for (const row of visibleApplications) {
      if (row.sla === "Breached") breached += 1;
      else if (row.sla === "At risk") atRisk += 1;
    }

    return { breached, atRisk };
  }, [visibleApplications]);

  const reset = useCallback(() => {
    setProduct("all");
    setBranch("all");
    setDateRange(DEFAULT_DATE_RANGE);
  }, []);

  const resetQueueFilters = useCallback(() => {
    setSearch("");
    setStageFilter("all");
  }, []);

  const closeTimeline = useCallback(() => setSelectedApplication(null), []);

  return (
    <Box style={PAGE_STYLE}>
      <Box
        component="main"
        maw={1520}
        mx="auto"
        px={{ base: "sm", md: "lg" }}
        py={{ base: "xs", md: "sm" }}
      >
        {/* HEADER */}
        <Group justify="space-between" align="center" gap="md" mb="sm" wrap="wrap">
          <Box>
            <Group gap={6}>
              <Text
                size="10px"
                fw={800}
                c={PRIMARY}
                tt="uppercase"
                style={{ letterSpacing: 0.75 }}
              >
                Lending Reports
              </Text>

              <Text size="10px" c={MUTED}>
                · Last 30 days · All branches
              </Text>
            </Group>

            <Title
              order={2}
              mt={3}
              style={{
                color: TEXT,
                lineHeight: 1.05,
                letterSpacing: -0.5,
              }}
            >
              Operations, TAT &amp; Automation
            </Title>
          </Box>

          <Group gap={7}>
            <Button
              variant="default"
              radius="md"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={onExport}
            >
              Export
            </Button>

            <Button
              radius="md"
              size="xs"
              style={{ background: PRIMARY }}
              leftSection={<IconBolt size={14} />}
              onClick={onGenerate}
            >
              Generate
            </Button>
          </Group>
        </Group>

        {/* FILTER BAR */}
        <Card withBorder radius="md" p={6} mb="sm" style={FILTER_BAR_STYLE}>
          <Group align="center" gap={6} wrap="wrap">
            <Group gap={6} px={3} wrap="nowrap" style={{ color: MUTED }}>
              <IconFilter size={14} />

              <Text size="10px" fw={650} c={MUTED}>
                Filters
              </Text>

              {activeFilterCount > 0 && (
                <Badge size="xs" variant="light" style={tint(PRIMARY)}>
                  {activeFilterCount}
                </Badge>
              )}
            </Group>

            {/* APPLICATION DATE RANGE */}
            <Box style={{ flex: "1 1 250px", minWidth: 210 }}>
              <DatePickerInput
                type="range"
                value={dateRange}
                onChange={setDateRange}
                valueFormat="DD MMM YYYY"
                placeholder="Application date range"
                leftSection={<IconCalendar size={13} />}
                clearable={false}
                size="xs"
                radius="md"
              />
            </Box>

            {/* BRANCH */}
            <Box style={{ flex: "1 1 145px", minWidth: 120 }}>
              <Select
                value={branch}
                onChange={(value) => setBranch(value || "all")}
                data={BRANCH_OPTIONS}
                size="xs"
                radius="md"
              />
            </Box>

            {/* LOAN PRODUCT */}
            <Box style={{ flex: "1 1 150px", minWidth: 130 }}>
              <Select
                value={product}
                onChange={(value) => setProduct(value || "all")}
                data={PRODUCT_OPTIONS}
                size="xs"
                radius="md"
              />
            </Box>

            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconRefresh size={13} />}
              onClick={reset}
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
          </Group>
        </Card>

        {/* KPI SUMMARY */}
        <Grid gutter="sm" mb="sm">
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <KpiCard
              icon={<IconClockHour4 size={15} />}
              label="Overall Average TAT"
              value={reportSummary.averageTat}
              meta={`Target ${reportSummary.tatTarget}`}
              tone={PRIMARY}
              delta="27m under"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 3 }}>
            <KpiCard
              icon={<IconCircleCheck size={15} />}
              label="SLA Met"
              value={`${reportSummary.slaMet}%`}
              meta={`${reportSummary.breached} breached · ${reportSummary.atRisk} at risk`}
              tone={SUCCESS}
              delta="4.2% better"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 3 }}>
            <KpiCard
              icon={<IconAlertTriangle size={15} />}
              label="Aging > 24h"
              value={`${reportSummary.agingOver24h}`}
              meta="8.6% of active queue"
              tone={DANGER}
              delta="Needs attention"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 3 }}>
            <KpiCard
              icon={<IconRobot size={15} />}
              label="Automation"
              value={`${reportSummary.automation}%`}
              meta={`${reportSummary.processed} processed`}
              tone={PRIMARY}
              delta="+8% better"
            />
          </Grid.Col>
        </Grid>

        {/* BOTTLENECK ALERT */}
        <Card withBorder radius="md" p="xs" mb="sm" style={ALERT_CARD_STYLE}>
          <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
            <Group gap={9} wrap="nowrap">
              <ThemeIcon
                size={30}
                radius="xl"
                style={{ background: "#FEF3C7", color: WARNING }}
              >
                <IconAlertTriangle size={15} />
              </ThemeIcon>

              <Box>
                <Group gap={6} wrap="wrap">
                  <Text size="xs" fw={750} c={TEXT}>
                    Credit Verification
                  </Text>

                  <Text size="10px" fw={750} c={DANGER}>
                    82% SLA · +22m over target
                  </Text>

                  <Text size="10px" c={MUTED}>
                    16 applications beyond the preferred window.
                  </Text>
                </Group>
              </Box>
            </Group>

            <Button
              variant="subtle"
              size="xs"
              style={{ color: PRIMARY, flexShrink: 0 }}
              rightSection={<IconArrowUpRight size={12} />}
            >
              Review
            </Button>
          </Group>
        </Card>

        {/* PIPELINE + SLA COMPLIANCE */}
        <Grid gutter="sm" align="stretch">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <PipelineStageChart />
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }}>
            <SLAComplianceCard />
          </Grid.Col>
        </Grid>

        {/* PRIORITY QUEUE */}
        <SurfaceCard mt="sm" p={0} style={{ overflow: "hidden" }}>
          <Box p="sm">
            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Box>
                <Group gap={8}>
                  <Text fw={750} size="sm" c={TEXT}>
                    Priority Queue
                  </Text>

                  <Badge
                    size="xs"
                    variant="light"
                    style={{ color: TEXT, background: "#F1F3F7" }}
                  >
                    {visibleApplications.length}
                  </Badge>

                  {(queueStats.breached > 0 || queueStats.atRisk > 0) && (
                    <Badge size="xs" variant="light" style={tint(DANGER, "08")}>
                      {queueStats.breached} breached · {queueStats.atRisk} at
                      risk
                    </Badge>
                  )}
                </Group>

                <Text size="10px" c={MUTED} mt={2}>
                  Files still in process, prioritized by SLA severity and TAT.
                </Text>
              </Box>

              <Group gap={6}>
                <Box style={{ width: 225 }}>
                  <TextInput
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    placeholder="Search customer or App ID"
                    leftSection={<IconSearch size={13} />}
                    size="xs"
                    radius="md"
                  />
                </Box>

                <Select
                  value={stageFilter}
                  onChange={(value) => setStageFilter(value || "all")}
                  size="xs"
                  w={125}
                  data={STAGE_OPTIONS}
                />
              </Group>
            </Group>
          </Box>

          <Divider color={BORDER} />

          <Box style={{ overflowX: "auto" }}>
            <Table
              verticalSpacing={7}
              highlightOnHover
              withTableBorder={false}
              style={TABLE_STYLE}
            >
              <Table.Thead style={TABLE_HEAD_STYLE}>
                <Table.Tr style={BORDER_BOTTOM}>
                  {QUEUE_HEADINGS.map((heading) => (
                    <Table.Th key={heading} style={HEADING_STYLE}>
                      {heading}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {visibleApplications.map((row) => (
                  <QueueRow
                    key={row.id}
                    row={row}
                    onView={setSelectedApplication}
                  />
                ))}

                {!visibleApplications.length && (
                  <Table.Tr>
                    <Table.Td colSpan={QUEUE_HEADINGS.length}>
                      <Stack align="center" gap={4} py="md">
                        <Text size="sm" fw={700} c={TEXT}>
                          No applications found
                        </Text>

                        <Text size="10px" c={MUTED}>
                          Try a different customer, App ID, or stage.
                        </Text>

                        <Button
                          variant="subtle"
                          size="xs"
                          mt={2}
                          onClick={resetQueueFilters}
                          style={{ color: PRIMARY }}
                        >
                          Clear queue filters
                        </Button>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>

          <Divider color={BORDER} />

          <Group justify="space-between" px="sm" py={7}>
            <Text size="9px" c={MUTED}>
              SLA severity · longest TAT
            </Text>

            <Button
              variant="subtle"
              size="xs"
              style={{ color: PRIMARY }}
              rightSection={<IconChevronRight size={12} />}
            >
              View all
            </Button>
          </Group>
        </SurfaceCard>

        {/* TIMELINE MODAL */}
        <TimelineModal
          application={selectedApplication}
          onClose={closeTimeline}
        />
      </Box>
    </Box>
  );
}

export default OperationsTATAutomation;