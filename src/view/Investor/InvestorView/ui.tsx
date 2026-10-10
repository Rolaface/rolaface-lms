/* Small UI blocks shared by the Investor 360 view panels: cards, KPI tiles, status badges. */
import type { ReactNode } from "react";
import {
  Alert,
  Badge,
  Box,
  Group,
  Loader,
  Paper,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { parseFrappeError } from "../../../utils/parseFrappeError";

/** Badge colors of the investment, fund, fund record and schedule row statuses. */
const STATUS_COLORS: Record<string, string> = {
  Draft: "slate",
  Pending: "slate",
  Approved: "warning",
  Partial: "info",
  Paid: "success",
  Accrued: "info",
  Cancelled: "danger",
  Submitted: "success",
  Received: "info",
  Matured: "success",
  Renewed: "brand",
  Sent: "info",
  Active: "success",
  Inactive: "slate",
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: string | null | undefined;
  size?: "xs" | "sm";
}) {
  if (!status) return null;
  const color = STATUS_COLORS[status] ?? "gray";
  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size={size}
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          border: `1px solid var(--mantine-color-${color}-2)`,
        },
      }}
    >
      {status}
    </Badge>
  );
}

/** White rounded card used for every block of the view. */
export function Card({
  children,
  p = "md",
}: {
  children: ReactNode;
  p?: string | number;
}) {
  return (
    <Paper
      radius="lg"
      p={p}
      style={{
        background: "var(--mantine-color-white)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      {children}
    </Paper>
  );
}

export function CardTitle({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
      <Box>
        <Text fw={700} fz="sm" c="slate.8">
          {title}
        </Text>
        {subtitle && (
          <Text fz="xs" c="slate.5">
            {subtitle}
          </Text>
        )}
      </Box>
      {aside}
    </Group>
  );
}

/** A figure with an icon, a label and an optional hint line. */
export function KpiTile({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card>
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon size={36} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <Box style={{ minWidth: 0 }}>
          <Text
            fz={11}
            fw={600}
            c="slate.5"
            tt="uppercase"
            style={{ letterSpacing: 0.4 }}
          >
            {label}
          </Text>
          <Text fz="lg" fw={800} c="slate.9" truncate>
            {value}
          </Text>
          {hint && (
            <Text fz="xs" c="slate.5">
              {hint}
            </Text>
          )}
        </Box>
      </Group>
    </Card>
  );
}

/** Label / value pair used in detail grids. */
export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Text fz={11} c="slate.5" fw={600}>
        {label}
      </Text>
      <Text fz="sm" c="slate.8" fw={600}>
        {value === null || value === undefined || value === "" ? "-" : value}
      </Text>
    </Box>
  );
}

export function LoadingBlock() {
  return (
    <Group justify="center" py="xl">
      <Loader size="sm" color="brand" />
    </Group>
  );
}

export function ErrorBlock({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}) {
  return (
    <Alert variant="light" color="red" radius="md">
      {error ? parseFrappeError(error) : fallback}
    </Alert>
  );
}
