import React, { ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";

export const REPORT_COLORS = {
  primary: "#5146e5",
  primarySoft: "#efedff",

  success: "#22c55e",
  successSoft: "#eaf9ef",

  warning: "#f59e0b",
  warningSoft: "#fff6df",

  danger: "#ef4444",
  dangerSoft: "#fff0f0",

  info: "#3b82f6",
  infoSoft: "#edf5ff",

  text: "#24304a",
  muted: "#7b8798",
  border: "#e5e9f0",

  surface: "#ffffff",
  page: "#f6f8fb",
} as const;

type ReportTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

/* -------------------------------------------------------------------------- */
/* Report Shell                                                               */
/* -------------------------------------------------------------------------- */

type ReportShellProps = {
  title: string;
  subtitle: string;
  filters?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
  onExport?: () => void;
};

export function ReportShell({
  title,
  subtitle,
  filters,
  children,
  onRefresh,
  onExport,
}: ReportShellProps) {
  return (
    <Box
      bg={REPORT_COLORS.page}
      mih="100%"
      p={{
        base: 12,
        md: 18,
      }}
    >
      <Group
        justify="space-between"
        align="flex-end"
        mb={16}
        gap={12}
        wrap="wrap"
      >
        <Box>
          <Text
            fw={800}
            fz={{
              base: 18,
              md: 20,
            }}
            c={REPORT_COLORS.text}
            lh={1.15}
          >
            {title}
          </Text>

          <Text
            fz={11}
            c={REPORT_COLORS.muted}
            mt={4}
          >
            {subtitle}
          </Text>
        </Box>

        <Group
          gap={8}
          align="flex-end"
          wrap="wrap"
        >
          {filters}

          {onRefresh && (
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={onRefresh}
              leftSection={
                <IconRefresh size={14} />
              }
            >
              Reset
            </Button>
          )}

          {onExport && (
            <Button
              variant="default"
              size="xs"
              px={10}
              onClick={onExport}
              leftSection={
                <IconDownload size={14} />
              }
            >
              Export CSV
            </Button>
          )}
        </Group>
      </Group>

      <Stack gap={12}>
        {children}
      </Stack>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI Card                                                                   */
/* -------------------------------------------------------------------------- */

type KpiCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  tone?: ReportTone;
  icon?: ReactNode;
};

export function KpiCard({
  label,
  value,
  helper,
  tone = "primary",
  icon,
}: KpiCardProps) {
  const color = REPORT_COLORS[tone];

  const soft =
    REPORT_COLORS[
      `${tone}Soft` as keyof typeof REPORT_COLORS
    ];

  return (
    <Card
      withBorder
      radius="md"
      p={12}
      bg={REPORT_COLORS.surface}
      style={{
        borderColor: REPORT_COLORS.border,
        minHeight: 94,
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        gap={8}
      >
        <Box>
          <Text
            tt="uppercase"
            fw={800}
            fz={8.5}
            c={REPORT_COLORS.muted}
            lts={0.35}
          >
            {label}
          </Text>

          <Text
            fw={800}
            fz={19}
            c={REPORT_COLORS.text}
            mt={4}
            lh={1}
          >
            {value}
          </Text>

          {helper && (
            <Text
              fz={9.5}
              c={REPORT_COLORS.muted}
              mt={6}
            >
              {helper}
            </Text>
          )}
        </Box>

        {icon && (
          <ThemeIcon
            size={26}
            radius="sm"
            variant="light"
            color={color}
            style={{
              background: soft,
              color,
            }}
          >
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Section Card                                                               */
/* -------------------------------------------------------------------------- */

type SectionCardProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  minHeight?: number | string;
};

export function SectionCard({
  title,
  subtitle,
  right,
  children,
  minHeight,
}: SectionCardProps) {
  return (
    <Paper
      withBorder
      radius="md"
      p={{
        base: 12,
        md: 14,
      }}
      bg={REPORT_COLORS.surface}
      style={{
        borderColor: REPORT_COLORS.border,
        minHeight,
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        gap={12}
        mb={10}
      >
        <Box>
          <Text
            fw={800}
            fz={11.5}
            c={REPORT_COLORS.text}
          >
            {title}
          </Text>

          {subtitle && (
            <Text
              fz={9.5}
              c={REPORT_COLORS.muted}
              mt={2}
            >
              {subtitle}
            </Text>
          )}
        </Box>

        {right}
      </Group>

      {children}
    </Paper>
  );
}

/* -------------------------------------------------------------------------- */
/* Tiny Pill                                                                  */
/* -------------------------------------------------------------------------- */

type TinyPillProps = {
  children: ReactNode;
  tone?: ReportTone;
};

export function TinyPill({
  children,
  tone = "primary",
}: TinyPillProps) {
  const color = REPORT_COLORS[tone];

  const soft =
    REPORT_COLORS[
      `${tone}Soft` as keyof typeof REPORT_COLORS
    ];

  return (
    <Badge
      size="xs"
      radius="sm"
      variant="light"
      fw={700}
      style={{
        color,
        background: soft,
        textTransform: "none",
      }}
    >
      {children}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric Bar                                                                 */
/* -------------------------------------------------------------------------- */

type MetricBarProps = {
  label: string;
  value: number;
  suffix?: string;
  tone?: ReportTone;
  detail?: ReactNode;
};

export function MetricBar({
  label,
  value,
  suffix = "",
  tone = "primary",
  detail,
}: MetricBarProps) {
  const color = REPORT_COLORS[tone];

  const safeValue = Math.max(
    0,
    Math.min(value, 100),
  );

  return (
    <Stack gap={4}>
      <Group
        justify="space-between"
        gap={8}
      >
        <Text
          fz={9.5}
          fw={700}
          c={REPORT_COLORS.text}
        >
          {label}
        </Text>

        <Text
          fz={9.5}
          fw={800}
          c={REPORT_COLORS.text}
        >
          {value}
          {suffix}
        </Text>
      </Group>

      <Progress
        value={safeValue}
        size={7}
        radius="xl"
        color={color}
      />

      {detail && (
        <Text
          fz={8.5}
          c={REPORT_COLORS.muted}
        >
          {detail}
        </Text>
      )}
    </Stack>
  );
}

/* -------------------------------------------------------------------------- */
/* Donut                                                                      */
/* -------------------------------------------------------------------------- */

type DonutSegment = {
  value: number;
  color: string;
};

type DonutProps = {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
};

export function Donut({
  segments,
  centerValue,
  centerLabel,
}: DonutProps) {
  let current = 0;

  const gradient = segments
    .map((segment) => {
      const start = current;

      current += Math.max(
        0,
        segment.value,
      );

      return `${segment.color} ${start}% ${current}%`;
    })
    .join(", ");

  return (
    <Box
      style={{
        position: "relative",
        width: 104,
        height: 104,
        flex: "0 0 auto",
      }}
    >
      <Box
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: `conic-gradient(${gradient})`,
          position: "relative",
        }}
      >
        <Box
          style={{
            position: "absolute",
            inset: 15,
            borderRadius: "50%",
            background:
              REPORT_COLORS.surface,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <Box>
            <Text
              fw={900}
              fz={18}
              lh={1}
              c={REPORT_COLORS.text}
            >
              {centerValue}
            </Text>

            <Text
              fw={700}
              fz={8}
              c={REPORT_COLORS.muted}
              mt={2}
            >
              {centerLabel}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

type EmptyStateProps = {
  message?: string;
};

export function EmptyState({
  message = "No data matches the selected filters.",
}: EmptyStateProps) {
  return (
    <Paper
      withBorder
      radius="sm"
      p={18}
      ta="center"
      style={{
        borderColor: REPORT_COLORS.border,
        borderStyle: "dashed",
      }}
    >
      <Text
        fz={11}
        fw={700}
        c={REPORT_COLORS.text}
      >
        {message}
      </Text>

      <Text
        fz={9.5}
        c={REPORT_COLORS.muted}
        mt={3}
      >
        Try changing one or more filters.
      </Text>
    </Paper>
  );
}

/* -------------------------------------------------------------------------- */
/* Compact Divider                                                            */
/* -------------------------------------------------------------------------- */

export function CompactDivider() {
  return (
    <Divider
      color={REPORT_COLORS.border}
      my={10}
    />
  );
}