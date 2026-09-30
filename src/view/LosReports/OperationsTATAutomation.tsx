import { useMemo, useState } from "react";
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

const PRIMARY = "#3B34CD";
const SUCCESS = "#0C9F6E";
const WARNING = "#D97706";
const DANGER = "#D92D20";
const TEXT = "#17233B";
const MUTED = "#7A8496";
const BORDER = "#E6EAF0";
const BG = "#F7F8FB";
const TRACK = "#EEF1F5";

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
};

const stages = [
  {
    name: "Application Intake",
    short: "Intake",
    apps: 128,
    tat: 31,
    target: 45,
    sla: 97,
  },
  {
    name: "Know Your Customer",
    short: "KYC",
    apps: 121,
    tat: 58,
    target: 90,
    sla: 94,
  },
  {
    name: "Underwriting",
    short: "Underwriting",
    apps: 116,
    tat: 202,
    target: 180,
    sla: 82,
  },
  {
    name: "Approval",
    short: "Approval",
    apps: 104,
    tat: 74,
    target: 120,
    sla: 91,
  },
];

const aging = [
  { label: "0–2h", value: 41, share: 32, color: PRIMARY },
  { label: "2–4h", value: 33, share: 26, color: "#6366F1" },
  { label: "4–8h", value: 27, share: 21, color: "#818CF8" },
  { label: "8–24h", value: 16, share: 13, color: WARNING },
  { label: ">24h", value: 11, share: 9, color: DANGER },
];

const applications = [
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

function SurfaceCard({
  children,
  p = "md",
  mb,
  mt,
  style,
}: {
  children: ReactNode;
  p?: string | number;
  mb?: string | number;
  mt?: string | number;
  style?: CSSProperties;
}) {
  return (
    <Card
      withBorder
      radius="md"
      p={p}
      mb={mb}
      mt={mt}
      style={{
        borderColor: BORDER,
        background: "#FFF",
        boxShadow: "0 1px 3px rgba(23,35,59,0.025)",
        ...style,
      }}
    >
      {children}
    </Card>
  );
}

function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <Group
      justify="space-between"
      align="flex-start"
      gap="sm"
      pb="sm"
      mb="sm"
      style={{
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <Box>
        <Text fw={700} size="sm" c={TEXT}>
          {title}
        </Text>

        {hint && (
          <Text size="10px" c={MUTED} mt={2}>
            {hint}
          </Text>
        )}
      </Box>

      {action}
    </Group>
  );
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  tone = PRIMARY,
  delta,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
  tone?: string;
  delta?: string;
}) {
  return (
    <SurfaceCard
      p="sm"
      style={{
        minHeight: 88,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="10px" fw={600} c={MUTED}>
          {label}
        </Text>

        <ThemeIcon
          size={28}
          radius="xl"
          variant="light"
          style={{
            color: tone,
            background: `${tone}10`,
          }}
        >
          {icon}
        </ThemeIcon>
      </Group>

      <Box mt={7}>
        <Group gap={7} align="baseline" wrap="nowrap">
          <Text
            size="24px"
            fw={850}
            c={TEXT}
            lh={1}
          >
            {value}
          </Text>

          {delta && (
            <Badge
              size="xs"
              variant="light"
              style={{
                color: tone,
                background: `${tone}10`,
              }}
            >
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
}

function statusColor(status: string) {
  if (status === "Breached") return DANGER;
  if (status === "At risk") return WARNING;
  return SUCCESS;
}

function formatMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/* -------------------------------------------------------------------------- */
/* PIPELINE BY STAGE                                                           */
/* -------------------------------------------------------------------------- */

const pipelineStages = [
  { stage: "Intake", files: 50 },
  { stage: "KYC", files: 20 },
  { stage: "Underwriting", files: 120 },
  { stage: "Approval", files: 10 },
];

function PipelineStageChart() {
  const totalActiveFiles = pipelineStages.reduce(
    (sum, item) => sum + item.files,
    0
  );

  const bottleneck = pipelineStages.reduce(
    (largest, item) =>
      item.files > largest.files ? item : largest,
    pipelineStages[0]
  );

  return (
    <SurfaceCard
      p="md"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        pb="md"
        style={{
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Group
          justify="space-between"
          align="flex-start"
          gap="sm"
          wrap="nowrap"
        >
          <Box>
            <Group gap={7} wrap="wrap">
              <Text
                size="sm"
                fw={750}
                c={TEXT}
                style={{
                  letterSpacing: -0.2,
                }}
              >
                Pipeline by Stage
              </Text>

              <Badge
                size="xs"
                variant="light"
                style={{
                  color: PRIMARY,
                  background: `${PRIMARY}10`,
                }}
              >
                Live
              </Badge>
            </Group>

            <Text size="10px" c={MUTED} mt={3}>
              Current files by workflow stage
            </Text>
          </Box>

          <Box
            ta="right"
            px="sm"
            py={6}
            style={{
              background: "#F8FAFC",
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <Text
              size="8px"
              fw={800}
              c={MUTED}
              tt="uppercase"
              style={{
                letterSpacing: 0.6,
              }}
            >
              Active Queue
            </Text>

            <Group
              justify="flex-end"
              align="baseline"
              gap={4}
              mt={1}
              wrap="nowrap"
            >
              <Text
                size="md"
                fw={850}
                c={TEXT}
                lh={1}
              >
                {totalActiveFiles}
              </Text>

              <Text size="9px" c={MUTED}>
                files
              </Text>
            </Group>
          </Box>
        </Group>
      </Box>

      <Stack gap="sm" pt="md">
        {pipelineStages.map((item) => {
          const share =
            (item.files / totalActiveFiles) * 100;

          const isBottleneck =
            item.stage === bottleneck.stage;

          return (
            <Box
              key={item.stage}
              px={isBottleneck ? "sm" : 0}
              py={isBottleneck ? 8 : 0}
              mx={isBottleneck ? -4 : 0}
              style={{
                borderRadius: 8,
                background: isBottleneck
                  ? "#F8FAFC"
                  : "transparent",
                border: isBottleneck
                  ? `1px solid ${BORDER}`
                  : "1px solid transparent",
              }}
            >
              <Group
                justify="space-between"
                align="center"
                mb={5}
                wrap="nowrap"
              >
                <Group gap={7} wrap="nowrap">
                  <Box
                    w={isBottleneck ? 8 : 6}
                    h={isBottleneck ? 8 : 6}
                    style={{
                      borderRadius: 999,
                      background: isBottleneck
                        ? PRIMARY
                        : MUTED,
                    }}
                  />

                  <Text
                    size="xs"
                    fw={isBottleneck ? 700 : 600}
                    c={TEXT}
                  >
                    {item.stage}
                  </Text>

                  <Badge
                    size="xs"
                    variant="light"
                    style={{
                      color: isBottleneck
                        ? PRIMARY
                        : MUTED,
                      background: isBottleneck
                        ? `${PRIMARY}10`
                        : "#F1F3F9",
                      border: isBottleneck
                        ? `1px solid ${PRIMARY}18`
                        : undefined,
                    }}
                  >
                    {isBottleneck
                      ? `Peak: ${Math.round(
                        share
                      )}%`
                      : `${Math.round(share)}%`}
                  </Badge>
                </Group>

                <Group
                  gap={4}
                  align="baseline"
                  wrap="nowrap"
                >
                  <Text
                    size="xs"
                    fw={isBottleneck ? 800 : 700}
                    c={TEXT}
                  >
                    {item.files}
                  </Text>

                  <Text size="9px" c={MUTED}>
                    files
                  </Text>
                </Group>
              </Group>

              <Progress
                value={share}
                size={8}
                radius="xl"
                styles={{
                  root: {
                    background: TRACK,
                  },
                  section: {
                    background: PRIMARY,
                  },
                }}
              />
            </Box>
          );
        })}
      </Stack>

      <Box
        mt="auto"
        pt="sm"
        style={{
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <Group
          justify="space-between"
          align="center"
          gap="sm"
          wrap="wrap"
        >
          <Group gap={6} wrap="nowrap">
            <Text
              size="9px"
              fw={700}
              c={TEXT}
            >
              <Box
                component="span"
                w={6}
                h={6}
                mr={5}
                style={{
                  display: "inline-block",
                  borderRadius: 999,
                  background: WARNING,
                }}
              />
              Bottleneck:
            </Text>

            <Text size="9px" c={MUTED}>
              {bottleneck.stage} (
              {Math.round(
                (bottleneck.files /
                  totalActiveFiles) *
                100
              )}
              %)
            </Text>
          </Group>

          <Text
            size="9px"
            c={MUTED}
            ta="right"
          >
            Total Active Pipeline:{" "}
            <Text
              component="span"
              fw={750}
              c={TEXT}
            >
              {totalActiveFiles} files
            </Text>
          </Text>
        </Group>
      </Box>
    </SurfaceCard>
  );
}

/* -------------------------------------------------------------------------- */
/* SLA COMPLIANCE                                                              */
/* -------------------------------------------------------------------------- */

function SLAComplianceCard() {
  const total = reportSummary.processed;
  const breached = reportSummary.breached;
  const withinSla = Math.max(total - breached, 0);

  const withinSlaExact = total
    ? (withinSla / total) * 100
    : 0;

  const breachedExact = total
    ? (breached / total) * 100
    : 0;

  const withinSlaPercentage = Math.round(
    withinSlaExact
  );

  return (
    <SurfaceCard
      p="md"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        pb="md"
        style={{
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Group
          justify="space-between"
          align="flex-start"
          gap="sm"
          wrap="nowrap"
        >
          <Box>
            <Group gap={7} wrap="wrap">
              <Text
                size="sm"
                fw={750}
                c={TEXT}
                style={{
                  letterSpacing: -0.2,
                }}
              >
                SLA Compliance
              </Text>

              <Badge
                size="xs"
                variant="light"
                leftSection={
                  <IconCircleCheck size={11} />
                }
                style={{
                  color: SUCCESS,
                  background: `${SUCCESS}10`,
                }}
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
              style={{
                letterSpacing: 0.6,
              }}
            >
              Processed
            </Text>

            <Text
              size="sm"
              fw={850}
              c={TEXT}
              lh={1}
              mt={2}
            >
              {total}{" "}
              <Text
                component="span"
                size="9px"
                fw={500}
                c={MUTED}
              >
                total
              </Text>
            </Text>
          </Box>
        </Group>
      </Box>

      <Box
        py="md"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <RingProgress
          size={138}
          thickness={14}
          roundCaps
          sections={[
            {
              value: withinSlaExact,
              color: SUCCESS,
            },
            {
              value: breachedExact,
              color: DANGER,
            },
          ]}
          label={
            <Box
              ta="center"
              style={{
                userSelect: "none",
              }}
            >
              <Text
                size="28px"
                fw={850}
                c={TEXT}
                lh={1}
              >
                {withinSlaPercentage}%
              </Text>

              <Text
                size="9px"
                fw={700}
                c={SUCCESS}
                mt={5}
                tt="uppercase"
                style={{
                  letterSpacing: 0.6,
                }}
              >
                Within SLA
              </Text>
            </Box>
          }
        />
      </Box>

      <Grid gutter="xs" mt={2}>
        <Grid.Col span={6}>
          <Box
            p="sm"
            style={{
              background: "#F8FAFC",
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              height: "100%",
            }}
          >
            <Group
              justify="space-between"
              align="center"
              gap={5}
              wrap="nowrap"
            >
              <Group
                gap={7}
                wrap="nowrap"
              >
                <Box
                  w={8}
                  h={8}
                  style={{
                    borderRadius: 999,
                    background: SUCCESS,
                    boxShadow: `0 0 0 4px ${SUCCESS}12`,
                    flexShrink: 0,
                  }}
                />

                <Box>
                  <Text
                    size="9px"
                    fw={600}
                    c={MUTED}
                  >
                    Within SLA
                  </Text>

                  <Text
                    size="md"
                    fw={850}
                    c={TEXT}
                    mt={3}
                    lh={1}
                  >
                    {withinSla}
                  </Text>
                </Box>
              </Group>

              <Text
                size="9px"
                fw={800}
                c={SUCCESS}
              >
                {withinSlaExact.toFixed(1)}%
              </Text>
            </Group>
          </Box>
        </Grid.Col>

        <Grid.Col span={6}>
          <Box
            p="sm"
            style={{
              background: "#F8FAFC",
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              height: "100%",
            }}
          >
            <Group
              justify="space-between"
              align="center"
              gap={5}
              wrap="nowrap"
            >
              <Group
                gap={7}
                wrap="nowrap"
              >
                <Box
                  w={8}
                  h={8}
                  style={{
                    borderRadius: 999,
                    background: DANGER,
                    boxShadow: `0 0 0 4px ${DANGER}10`,
                    flexShrink: 0,
                  }}
                />

                <Box>
                  <Text
                    size="9px"
                    fw={600}
                    c={MUTED}
                  >
                    Breached SLA
                  </Text>

                  <Text
                    size="md"
                    fw={850}
                    c={DANGER}
                    mt={3}
                    lh={1}
                  >
                    {breached}
                  </Text>
                </Box>
              </Group>

              <Text
                size="9px"
                fw={700}
                c={MUTED}
              >
                {breachedExact.toFixed(1)}%
              </Text>
            </Group>
          </Box>
        </Grid.Col>
      </Grid>

      <Box
        mt="auto"
        pt="sm"
        style={{
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <Group
          justify="space-between"
          align="center"
          gap="sm"
          wrap="wrap"
        >
          <Group gap={5} wrap="nowrap">
            <IconCircleCheck
              size={13}
              color={SUCCESS}
            />

            <Text
              size="9px"
              fw={650}
              c={TEXT}
            >
              {breachedExact.toFixed(1)}%
              breach rate
            </Text>

            <Text
              size="9px"
              c={MUTED}
            >
              (within &lt;10% tolerance)
            </Text>
          </Group>

          <Text
            size="9px"
            fw={600}
            c={MUTED}
          >
            {total} evaluated applications
          </Text>
        </Group>
      </Box>
    </SurfaceCard>
  );
}

/* -------------------------------------------------------------------------- */
/* TIMELINE MODAL                                                              */
/* -------------------------------------------------------------------------- */

function TimelineModal({
  application,
  onClose,
}: {
  application:
  | (typeof applications)[number]
  | null;
  onClose: () => void;
}) {
  if (!application) return null;

  const timeline = [
    {
      title: "Application Submitted",
      description:
        "Application entered the lending workflow.",
      date: application.submitted,
      actor: "System",
      current: false,
    },
    {
      title: "Intake Completed",
      description:
        "Initial application information was validated.",
      date: "2026-09-20",
      actor: "Operations",
      current: false,
    },
    {
      title: "KYC Completed",
      description:
        "Customer identity verification was completed.",
      date: "2026-09-21",
      actor: "Credit Operations",
      current: false,
    },
    {
      title: "Underwriting",
      description:
        application.stage === "Underwriting"
          ? `File has remained in Underwriting for ${application.timeInStage}.`
          : "Underwriting review completed before the file moved forward.",
      date: "2026-09-22",
      actor: application.owner,
      current:
        application.stage === "Underwriting",
    },
    {
      title: "Approval",
      description:
        application.stage === "Approval"
          ? `File is currently awaiting approval. Total TAT is ${application.totalTat}.`
          : "Approval stage is pending or completed later in the workflow.",
      date: "2026-09-23",
      actor:
        application.stage === "Approval"
          ? application.owner
          : "Credit Team",
      current:
        application.stage === "Approval",
    },
  ].filter((event) => {
    const stageOrder = {
      Intake: 0,
      KYC: 1,
      Underwriting: 2,
      Approval: 3,
    };

    const eventOrder = {
      "Application Submitted": 0,
      "Intake Completed": 1,
      "KYC Completed": 1,
      Underwriting: 2,
      Approval: 3,
    };

    return (
      eventOrder[
      event.title as keyof typeof eventOrder
      ] <=
      stageOrder[
      application.stage as keyof typeof stageOrder
      ]
    );
  });

  return (
    <Modal
      opened={!!application}
      onClose={onClose}
      centered
      size="lg"
      radius="md"
      title={
        <Box>
          <Text
            fw={800}
            size="sm"
            c={TEXT}
          >
            Timeline History
          </Text>

          <Text
            size="10px"
            c={MUTED}
            mt={2}
          >
            {application.id} ·{" "}
            {application.customerName}
          </Text>
        </Box>
      }
    >
      <Stack gap="md">
        <Card
          withBorder
          radius="md"
          p="sm"
          style={{
            borderColor: BORDER,
            background: BG,
          }}
        >
          <Group
            justify="space-between"
            align="center"
          >
            <Box>
              <Text
                size="10px"
                fw={800}
                c={MUTED}
              >
                LOAN PRODUCT
              </Text>

              <Text
                size="xs"
                fw={700}
                c={TEXT}
                mt={3}
              >
                {application.product}
              </Text>
            </Box>

            <Badge
              size="xs"
              variant="light"
              style={{
                color: statusColor(
                  application.sla
                ),
                background: `${statusColor(
                  application.sla
                )}10`,
              }}
            >
              {application.sla === "At risk"
                ? "At Risk"
                : application.sla === "Within SLA"
                  ? "On Track"
                  : "Breached"}
            </Badge>
          </Group>

          <Group gap="lg" mt="sm">
            <Box>
              <Text
                size="9px"
                c={MUTED}
                fw={700}
              >
                CURRENT STAGE
              </Text>

              <Text
                size="xs"
                fw={700}
                c={TEXT}
                mt={2}
              >
                {application.stage}
              </Text>
            </Box>

            <Box>
              <Text
                size="9px"
                c={MUTED}
                fw={700}
              >
                TIME IN STAGE
              </Text>

              <Text
                size="xs"
                fw={700}
                c={TEXT}
                mt={2}
              >
                {application.timeInStage}
              </Text>
            </Box>

            <Box>
              <Text
                size="9px"
                c={MUTED}
                fw={700}
              >
                TOTAL TAT
              </Text>

              <Text
                size="xs"
                fw={700}
                c={TEXT}
                mt={2}
              >
                {application.totalTat}
              </Text>
            </Box>
          </Group>
        </Card>

        <Box>
          <Text
            size="xs"
            fw={750}
            c={TEXT}
            mb="sm"
          >
            Processing Timeline
          </Text>

          <Stack gap={0}>
            {timeline.map(
              (event, index) => {
                const tone =
                  event.current
                    ? WARNING
                    : PRIMARY;

                return (
                  <Group
                    key={`${event.title}-${index}`}
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                  >
                    <Box
                      style={{
                        width: 18,
                        display: "flex",
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
                      }}
                    >
                      <Box
                        w={10}
                        h={10}
                        style={{
                          borderRadius: 999,
                          background:
                            `${tone}18`,
                          border: `3px solid ${tone}`,
                          boxSizing:
                            "border-box",
                        }}
                      />

                      {index <
                        timeline.length -
                        1 && (
                          <Box
                            w={1}
                            h={55}
                            style={{
                              background:
                                BORDER,
                            }}
                          />
                        )}
                    </Box>

                    <Box
                      pb="md"
                      style={{
                        flex: 1,
                      }}
                    >
                      <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="nowrap"
                      >
                        <Text
                          size="xs"
                          fw={750}
                          c={TEXT}
                        >
                          {event.title}
                        </Text>

                        <Text
                          size="9px"
                          c={MUTED}
                        >
                          {event.date}
                        </Text>
                      </Group>

                      <Text
                        size="10px"
                        c={MUTED}
                        mt={3}
                      >
                        {event.description}
                      </Text>

                      <Text
                        size="9px"
                        fw={700}
                        c={PRIMARY}
                        mt={4}
                      >
                        {event.actor}
                      </Text>
                    </Box>
                  </Group>
                );
              }
            )}
          </Stack>
        </Box>
      </Stack>
    </Modal>
  );
}

export function OperationsTATAutomation({
  onExport,
  onGenerate,
}: {
  onExport?: () => void;
  onGenerate?: () => void;
} = {}) {
  const [product, setProduct] =
    useState("all");

  const [branch, setBranch] =
    useState("all");

  const [dateRange, setDateRange] =
    useState<[string | null, string | null]>([
      "2026-09-01",
      "2026-09-30",
    ]);

  const [stageFilter, setStageFilter] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [selectedApplication, setSelectedApplication] =
    useState<
      (typeof applications)[number] | null
    >(null);

  const activeFilterCount = [
    product !== "all",
    branch !== "all",
    dateRange[0] !== null ||
    dateRange[1] !== null,
  ].filter(Boolean).length;

  const visibleApplications =
    useMemo(() => {
      const rank = {
        Breached: 0,
        "At risk": 1,
        "Within SLA": 2,
      } as const;

      const query =
        search.trim().toLowerCase();

      return applications
        .filter((row) => {
          const [from, to] = dateRange;

          const matchesGlobalFilters =
            (product === "all" ||
              row.product === product) &&
            (branch === "all" ||
              row.branch === branch) &&
            (!from || row.submitted >= from) &&
            (!to || row.submitted <= to);

          const matchesSearch =
            !query ||
            row.id
              .toLowerCase()
              .includes(query) ||
            row.customerName
              .toLowerCase()
              .includes(query);

          const matchesStage =
            stageFilter === "all" ||
            row.stage === stageFilter;

          return (
            matchesGlobalFilters &&
            matchesSearch &&
            matchesStage
          );
        })
        .sort(
          (a, b) =>
            rank[
            a.sla as keyof typeof rank
            ] -
            rank[
            b.sla as keyof typeof rank
            ] ||
            b.tatMinutes -
            a.tatMinutes
        );
    }, [
      product,
      branch,
      dateRange,
      search,
      stageFilter,
    ]);

  const queueStats = useMemo(
    () => ({
      breached:
        visibleApplications.filter(
          (row) =>
            row.sla === "Breached"
        ).length,

      atRisk:
        visibleApplications.filter(
          (row) =>
            row.sla === "At risk"
        ).length,
    }),
    [visibleApplications]
  );

  const reset = () => {
  setProduct("all");
  setBranch("all");
  setDateRange([
    "2026-09-01",
    "2026-09-30",
  ]);
};

  const resetQueueFilters = () => {
    setSearch("");
    setStageFilter("all");
  };


};

  return (
    <Box
      style={{
        background: BG,
        minHeight: "100%",
        color: TEXT,
      }}
    >
      <Box
        component="main"
        maw={1520}
        mx="auto"
        px={{ base: "sm", md: "lg" }}
        py={{ base: "xs", md: "sm" }}
      >
        {/* HEADER */}
        <Group
          justify="space-between"
          align="center"
          gap="md"
          mb="sm"
          wrap="wrap"
        >
          <Box>
            <Group gap={6}>
              <Text
                size="10px"
                fw={800}
                c={PRIMARY}
                tt="uppercase"
                style={{
                  letterSpacing: 0.75,
                }}
              >
                Lending Reports
              </Text>

              <Text
                size="10px"
                c={MUTED}
              >
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
              Operations, TAT &amp;
              Automation
            </Title>
          </Box>

          <Group gap={7}>
            <Button
              variant="default"
              radius="md"
              size="xs"
              leftSection={
                <IconDownload size={14} />
              }
              onClick={handleExport}
            >
              Export
            </Button>

            <Button
              radius="md"
              size="xs"
              style={{
                background: PRIMARY,
              }}
              leftSection={
                <IconBolt size={14} />
              }
              onClick={onGenerate}
            >
              Generate
            </Button>
          </Group>
        </Group>

        {/* FILTER BAR */}
        <Card
          withBorder
          radius="md"
          p={6}
          mb="sm"
          style={{
            borderColor: BORDER,
            background: "#FFF",
          }}
        >
          <Group
            align="center"
            gap={6}
            wrap="wrap"
          >
            <Group
              gap={6}
              px={3}
              wrap="nowrap"
              style={{
                color: MUTED,
              }}
            >
              <IconFilter size={14} />

              <Text
                size="10px"
                fw={650}
                c={MUTED}
              >
                Filters
              </Text>

              {activeFilterCount > 0 && (
                <Badge
                  size="xs"
                  variant="light"
                  style={{
                    color: PRIMARY,
                    background: `${PRIMARY}10`,
                  }}
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Group>

            {/* APPLICATION DATE RANGE */}
            <Box
              style={{
                flex: "1 1 250px",
                minWidth: 210,
              }}
            >
              <DatePickerInput
                type="range"
                value={dateRange}
                onChange={setDateRange}
                valueFormat="DD MMM YYYY"
                placeholder="Application date range"
                leftSection={
                  <IconCalendar size={13} />
                }
                clearable={false}
                size="xs"
                radius="md"
              />
            </Box>

            {/* BRANCH */}
            <Box
              style={{
                flex: "1 1 145px",
                minWidth: 120,
              }}
            >
              <Select
                value={branch}
                onChange={(value) =>
                  setBranch(value || "all")
                }
                data={[
                  {
                    value: "all",
                    label: "All Branches",
                  },
                  "Lusaka",
                  "Ndola",
                  "Kitwe",
                  "Livingstone",
                ]}
                size="xs"
                radius="md"
              />
            </Box>

            {/* LOAN PRODUCT */}
            <Box
              style={{
                flex: "1 1 150px",
                minWidth: 130,
              }}
            >
              <Select
                value={product}
                onChange={(value) =>
                  setProduct(value || "all")
                }
                data={[
                  {
                    value: "all",
                    label: "All Products",
                  },
                  "Personal Loan",
                  "Home Loan",
                  "Business Loan",
                  "Consumer Loan",
                ]}
                size="xs"
                radius="md"
              />
            </Box>

            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={
                <IconRefresh size={13} />
              }
              onClick={reset}
              disabled={
                activeFilterCount === 0
              }
            >
              Reset
            </Button>
          </Group>
        </Card>

        {/* KPI SUMMARY */}
        <Grid gutter="sm" mb="sm">
          <Grid.Col
            span={{ base: 6, sm: 3 }}
          >
            <KpiCard
              icon={
                <IconClockHour4
                  size={15}
                />
              }
              label="Overall Average TAT"
              value={
                reportSummary.averageTat
              }
              meta={`Target ${reportSummary.tatTarget}`}
              tone={PRIMARY}
              delta="27m under"
            />
          </Grid.Col>

          <Grid.Col
            span={{ base: 6, sm: 3 }}
          >
            <KpiCard
              icon={
                <IconCircleCheck
                  size={15}
                />
              }
              label="SLA Met"
              value={`${reportSummary.slaMet}%`}
              meta={`${reportSummary.breached} breached · ${reportSummary.atRisk} at risk`}
              tone={SUCCESS}
              delta="4.2% better"
            />
          </Grid.Col>

          <Grid.Col
            span={{ base: 6, sm: 3 }}
          >
            <KpiCard
              icon={
                <IconAlertTriangle
                  size={15}
                />
              }
              label="Aging > 24h"
              value={`${reportSummary.agingOver24h}`}
              meta="8.6% of active queue"
              tone={DANGER}
              delta="Needs attention"
            />
          </Grid.Col>

          <Grid.Col
            span={{ base: 6, sm: 3 }}
          >
            <KpiCard
              icon={
                <IconRobot size={15} />
              }
              label="Automation"
              value={`${reportSummary.automation}%`}
              meta={`${reportSummary.processed} processed`}
              tone={PRIMARY}
              delta="+8% better"
            />
          </Grid.Col>
        </Grid>

        {/* BOTTLENECK ALERT */}
        <Card
          withBorder
          radius="md"
          p="xs"
          mb="sm"
          style={{
            borderColor: `${WARNING}30`,
            background:
              "linear-gradient(90deg, #FFFDF5 0%, #FFFFFF 82%)",
          }}
        >
          <Group
            justify="space-between"
            align="center"
            gap="sm"
            wrap="nowrap"
          >
            <Group
              gap={9}
              wrap="nowrap"
            >
              <ThemeIcon
                size={30}
                radius="xl"
                style={{
                  background:
                    "#FEF3C7",
                  color: WARNING,
                }}
              >
                <IconAlertTriangle
                  size={15}
                />
              </ThemeIcon>

              <Box>
                <Group
                  gap={6}
                  wrap="wrap"
                >
                  <Text
                    size="xs"
                    fw={750}
                    c={TEXT}
                  >
                    Credit Verification
                  </Text>

                  <Text
                    size="10px"
                    fw={750}
                    c={DANGER}
                  >
                    82% SLA · +22m over target
                  </Text>

                  <Text
                    size="10px"
                    c={MUTED}
                  >
                    16 applications beyond the preferred window.
                  </Text>
                </Group>
              </Box>
            </Group>

            <Button
              variant="subtle"
              size="xs"
              style={{
                color: PRIMARY,
                flexShrink: 0,
              }}
              rightSection={
                <IconArrowUpRight
                  size={12}
                />
              }
            >
              Review
            </Button>
          </Group>
        </Card>

        {/* PIPELINE + SLA COMPLIANCE */}
        <Grid
          gutter="sm"
          align="stretch"
        >
          <Grid.Col
            span={{ base: 12, lg: 7 }}
          >
            <PipelineStageChart />
          </Grid.Col>

          <Grid.Col
            span={{ base: 12, lg: 5 }}
          >
            <SLAComplianceCard />
          </Grid.Col>
        </Grid>

        {/* PRIORITY QUEUE */}
        <SurfaceCard
          mt="sm"
          p={0}
          style={{
            overflow: "hidden",
          }}
        >
          <Box p="sm">
            <Group
              justify="space-between"
              align="center"
              gap="sm"
              wrap="wrap"
            >
              <Box>
                <Group gap={8}>
                  <Text
                    fw={750}
                    size="sm"
                    c={TEXT}
                  >
                    Priority Queue
                  </Text>

                  <Badge
                    size="xs"
                    variant="light"
                    style={{
                      color: TEXT,
                      background:
                        "#F1F3F7",
                    }}
                  >
                    {
                      visibleApplications.length
                    }
                  </Badge>

                  {(queueStats.breached >
                    0 ||
                    queueStats.atRisk >
                    0) && (
                      <Badge
                        size="xs"
                        variant="light"
                        style={{
                          color: DANGER,
                          background: `${DANGER}08`,
                        }}
                      >
                        {
                          queueStats.breached
                        }{" "}
                        breached ·{" "}
                        {
                          queueStats.atRisk
                        }{" "}
                        at risk
                      </Badge>
                    )}
                </Group>

                <Text
                  size="10px"
                  c={MUTED}
                  mt={2}
                >
                  Files still in process, prioritized by SLA severity and TAT.
                </Text>
              </Box>

              <Group gap={6}>
                <Box
                  style={{
                    width: 225,
                  }}
                >
                  <TextInput
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event
                          .currentTarget
                          .value
                      )
                    }
                    placeholder="Search customer or App ID"
                    leftSection={
                      <IconSearch
                        size={13}
                      />
                    }
                    size="xs"
                    radius="md"
                  />
                </Box>

                <Select
                  value={stageFilter}
                  onChange={(value) =>
                    setStageFilter(
                      value || "all"
                    )
                  }
                  size="xs"
                  w={125}
                  data={[
                    {
                      value: "all",
                      label: "All stages",
                    },
                    ...stages.map(
                      (stage) => ({
                        value:
                          stage.short,
                        label:
                          stage.short,
                      })
                    ),
                  ]}
                />
              </Group>
            </Group>
          </Box>

          <Divider color={BORDER} />

          <Box
            style={{
              overflowX: "auto",
            }}
          >
            <Table
              verticalSpacing={7}
              highlightOnHover
              withTableBorder={false}
              style={{
                minWidth: 980,
              }}
            >
              <Table.Thead
                style={{
                  background:
                    "#F8FAFC",
                }}
              >
                <Table.Tr
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {[
                    "App ID",
                    "Customer Name",
                    "Loan Product",
                    "Current Stage",
                    "Time in Stage",
                    "Total TAT",
                    "SLA Status",
                    "Assigned Owner",
                    "Action",
                  ].map((heading) => (
                    <Table.Th
                      key={heading}
                      style={{
                        color: MUTED,
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          0.25,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {heading}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {visibleApplications.map(
                  (row) => {
                    const tone =
                      statusColor(
                        row.sla
                      );

                    const displayStatus =
                      row.sla ===
                        "At risk"
                        ? "At Risk"
                        : row.sla ===
                          "Within SLA"
                          ? "On Track"
                          : "Breached";

                    return (
                      <Table.Tr
                        key={row.id}
                        style={{
                          boxShadow: `inset 3px 0 0 ${tone}`,
                        }}
                      >
                        <Table.Td>
                          <Text
                            size="xs"
                            fw={750}
                            style={{
                              color:
                                PRIMARY,
                            }}
                          >
                            {row.id}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            fw={650}
                            c={TEXT}
                          >
                            {
                              row.customerName
                            }
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            c={TEXT}
                          >
                            {row.product}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="light"
                            style={{
                              color:
                                PRIMARY,
                              background: `${PRIMARY}10`,
                            }}
                          >
                            {row.stage}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            fw={800}
                            c={tone}
                          >
                            {
                              row.timeInStage
                            }
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            fw={800}
                            c={TEXT}
                          >
                            {row.totalTat}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="light"
                            style={{
                              color: tone,
                              background: `${tone}10`,
                            }}
                          >
                            {
                              displayStatus
                            }
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="xs"
                            fw={600}
                            c={TEXT}
                          >
                            {row.owner}
                          </Text>
                        </Table.Td>

                        <Table.Td ta="right">
                          <Tooltip label="View timeline">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() =>
                                setSelectedApplication(
                                  row
                                )
                              }
                            >
                              <IconEye
                                size={15}
                              />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    );
                  }
                )}

                {!visibleApplications.length && (
                  <Table.Tr>
                    <Table.Td colSpan={9}>
                      <Stack
                        align="center"
                        gap={4}
                        py="md"
                      >
                        <Text
                          size="sm"
                          fw={700}
                          c={TEXT}
                        >
                          No applications found
                        </Text>

                        <Text
                          size="10px"
                          c={MUTED}
                        >
                          Try a different customer, App ID, or stage.
                        </Text>

                        <Button
                          variant="subtle"
                          size="xs"
                          mt={2}
                          onClick={
                            resetQueueFilters
                          }
                          style={{
                            color:
                              PRIMARY,
                          }}
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

          <Group
            justify="space-between"
            px="sm"
            py={7}
          >
            <Text
              size="9px"
              c={MUTED}
            >
              SLA severity · longest TAT
            </Text>

            <Button
              variant="subtle"
              size="xs"
              style={{
                color: PRIMARY,
              }}
              rightSection={
                <IconChevronRight
                  size={12}
                />
              }
            >
              View all
            </Button>
          </Group>
        </SurfaceCard>

        {/* TIMELINE MODAL */}
        <TimelineModal
          application={
            selectedApplication
          }
          onClose={() =>
            setSelectedApplication(
              null
            )
          }
        />
      </Box>
    </Box>
  );


export default OperationsTATAutomation;