import { Badge, Button, Paper, Text, ThemeIcon, Group } from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";
import { LineChart, Line } from "recharts";
/**
 * A single label/value field, stacked (icon+label on top, value below).
 * Stacking instead of side-by-side lets fields pack tightly into a
 * multi-column grid without values colliding with the next column's
 * labels — this is the change that actually kills the scroll problem.
 */
export function DataField({
  label,
  value,
  icon,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  emphasis?: boolean;
}) {
  const isEmpty =
    value === undefined || value === null || value === "" || value === "—";

  return (
    <div className="flex flex-col gap-1 border-b border-[var(--mantine-color-slate-1)] py-2.5 pr-4">
      <div className="flex items-center gap-1.5">
        {icon && (
          <span
            className="shrink-0"
            style={{ color: "var(--mantine-color-slate-4)" }}
          >
            {icon}
          </span>
        )}
        <Text
          size="xs"
          c="slate.5"
          fw={500}
          className="uppercase tracking-wide"
        >
          {label}
        </Text>
      </div>
      <Text
        size={emphasis ? "sm" : "xs"}
        fw={emphasis ? 700 : 600}
        c={isEmpty ? "slate.4" : "slate.8"}
      >
        {isEmpty ? "—" : value}
      </Text>
    </div>
  );
}

/**
 * Packs DataFields into a responsive grid. 2 columns is the floor for
 * any section with >3 fields; use 3 for long, low-value-density lists.
 * Each field owns its own bottom border, so row count parity no longer
 * matters (replaces the old index-parity border hack).
 */
export function FieldGrid({
  entries,
  columns = 2,
}: {
  entries: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    emphasis?: boolean;
  }[];
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 4
      ? "sm:grid-cols-2 xl:grid-cols-4"
      : columns === 3
        ? "sm:grid-cols-2 xl:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <div className={`grid grid-cols-1 ${colClass}`}>
      {entries.map((entry) => (
        <DataField key={entry.label} {...entry} />
      ))}
    </div>
  );
}

/** Legacy single-row API, kept only for call sites not yet migrated to FieldGrid. */
export function InfoRow({
  label,
  value,
  icon,
  bordered = true,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 ${
        bordered
          ? "border-b border-[var(--mantine-color-slate-1)] last:border-b-0"
          : ""
      }`}
    >
      <div
        className="flex items-center gap-2"
        style={{ color: "var(--mantine-color-slate-5)" }}
      >
        {icon}
        <Text size="xs" c="slate.5">
          {label}
        </Text>
      </div>
      <Text size="xs" fw={600} c="slate.8" className="text-right">
        {value}
      </Text>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "brand" | "success" | "warning";
}) {
  const isEmpty = value === "—" || value === undefined || value === null;

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{ borderColor: "var(--mantine-color-slate-2)" }}
    >
      <div className="flex items-center justify-between">
        <Text size="xs" c="slate.5" fw={600}>
          {label}
        </Text>
        {icon && (
          <ThemeIcon
            variant="light"
            color={isEmpty ? "gray" : tone}
            size={26}
            radius="md"
          >
            {icon}
          </ThemeIcon>
        )}
      </div>
      <Text mt={6} size="xl" fw={700} c={isEmpty ? "slate.4" : `${tone}.6`}>
        {value}
      </Text>
    </Paper>
  );
}

/**
 * Section wrapper. `dense` shrinks header spacing for cards packed
 * two-up so their headers don't eat extra rows. `empty` renders a quiet
 * "nothing on file yet" state instead of a wall of em-dashes.
 *
 * `h-full flex flex-col` on the Paper + `flex-1` on the body lets every
 * card in a CSS Grid row stretch to match the tallest sibling (grid's
 * default `align-items: stretch`), so a row never ends with one card
 * looking short next to a taller one.
 */
export function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
  dense = false,
  empty = false,
  emptyLabel = "No information on file",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  dense?: boolean;
  empty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      className="h-full flex flex-col"
      style={{ borderColor: "var(--mantine-color-slate-2)" }}
    >
      <div
        className={`flex items-center justify-between ${dense ? "mb-2" : "mb-3"}`}
      >
        <div className="flex items-center gap-2">
          <ThemeIcon variant="light" color="brand" size={28} radius="md">
            {icon}
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700} c="slate.8">
              {title}
            </Text>
            {subtitle && (
              <Text size="xs" c="slate.5">
                {subtitle}
              </Text>
            )}
          </div>
        </div>
        {action}
      </div>

      {empty ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-[var(--mantine-color-slate-2)] py-6">
          <Text size="xs" c="slate.4">
            {emptyLabel}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col flex-1">{children}</div>
      )}
    </Paper>
  );
}

export function FacilityCountTile({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-md p-3"
      style={{
        backgroundColor: "var(--mantine-color-slate-0)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      {icon && (
        <ThemeIcon variant="light" color="brand" size={32} radius="md">
          {icon}
        </ThemeIcon>
      )}
      <div>
        <Text size="xs" c="slate.5">
          {label}
        </Text>
        <Text size="md" fw={700} c="slate.8">
          {count}
        </Text>
      </div>
    </div>
  );
}

/**
 * Consistent status → color mapping across KYC checks, document
 * verification, and any other pass/pending/fail state in the profile.
 * Centralized here so "Verified" and "Clear" never end up two
 * different shades of green in different panels.
 */
export function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const color = [
    "verified",
    "clear",
    "complete",
    "passed",
    "low",
    "uploaded",
    "assessed",
    "active",
  ].includes(s)
    ? "success"
    : ["pending", "in review", "medium", "awaiting"].includes(s)
      ? "warning"
      : ["failed", "flagged", "high", "rejected", "not verified"].includes(s)
        ? "danger"
        : "gray";

  return (
    <Badge size="xs" color={color} variant="light">
      {status ?? "Not started"}
    </Badge>
  );
}

/** One compliance/screening check — used for KYC Verification, AML, Sanctions, PEP, FATCA, CRS. */
export function CheckTile({
  icon,
  title,
  status,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  status?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-[var(--mantine-color-slate-1)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ThemeIcon variant="light" color="brand" size={26} radius="md">
            {icon}
          </ThemeIcon>
          <Text size="xs" fw={700} c="slate.8">
            {title}
          </Text>
        </div>
        <StatusBadge status={status} />
      </div>
      {description && (
        <Text size="xs" c="slate.5">
          {description}
        </Text>
      )}
    </div>
  );
}




function Sparkline({
  data,
  color,
  width = 82,
  height = 38,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const paddingX = 2;
  const paddingY = 4;

  const points = data
    .map((value, index) => {
      const x =
        paddingX +
        (index / (data.length - 1)) * (width - paddingX * 2);

      const y =
        height -
        paddingY -
        ((value - min) / range) * (height - paddingY * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Top-row metric: label, big value, subtitle line, icon chip. Distinct
 * from MetricCard (which has no subtitle) — used for the headline stats
 * row (Total Exposure, Outstanding Balance, Overdue Amount, Risk Rating)
 * where the extra line of context ("Across 2 facilities") matters.
 */
export function StatCard({
  label,
  value,
  subtitle,
  icon,
  tone = "brand",
  trend,
  trendDirection = "up",
  sparkline,
  rightIcon,
}: {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "success" | "warning" | "danger";
  /** e.g. "8.2% vs last 30 days" */
  trend?: string;
  trendDirection?: "up" | "down";
  /** optional series for the inline sparkline, e.g. [12,14,13,18,...] */
  sparkline?: number[];
  /** shown instead of a sparkline when there's nothing to trend (e.g. a status checkmark) */
  rightIcon?: React.ReactNode;
}) {
  const isEmpty = value === "—" || value === undefined || value === null;
  const sparkColor =
    trendDirection === "down"
      ? "var(--mantine-color-danger-5)"
      : "var(--mantine-color-success-5)";

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{ borderColor: "var(--mantine-color-slate-2)" }}
    >
      <Group gap={8} wrap="nowrap" mb={10}>
        {icon && (
          <ThemeIcon
            variant="light"
            color={isEmpty ? "gray" : tone}
            size={30}
            radius="md"
          >
            {icon}
          </ThemeIcon>
        )}
        <Text size="xs" c="slate.5" fw={600}>
          {label}
        </Text>
      </Group>

      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Text size="xl" fw={800} c={isEmpty ? "slate.4" : `${tone}.6`} lh={1.1}>
          {value}
        </Text>
{sparkline && sparkline.length > 1 ? (
  <div
    className="shrink-0 flex items-center"
    style={{
      width: 82,
      height: 38,
      marginLeft: 8,
    }}
  >
    <Sparkline
      data={sparkline}
      color={sparkColor}
      width={82}
      height={38}
    />
  </div>
) : rightIcon ? (
  <div className="shrink-0">{rightIcon}</div>
) : null}
      
      </Group>

      {subtitle && (
        <Text mt={6} size="xs" c="slate.5">
          {subtitle}
        </Text>
      )}
      {trend && (
        <Text
          mt={2}
          size="xs"
          fw={600}
          c={trendDirection === "down" ? "danger.6" : "success.6"}
        >
          {trendDirection === "down" ? "↓" : "↑"} {trend}
        </Text>
      )}
    </Paper>
  );
}

/** Consistent "View Facilities →" / "Edit Classification →" footer action, used across the summary cards. */
export function CardLinkButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      fullWidth
      variant="light"
      color="brand"
      size="xs"
      mt="md"
      rightSection={<IconArrowRight size={14} />}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

/** One row in a document checklist — identification docs, required uploads, etc. */
export function DocStatusRow({
  name,
  meta,
  status,
}: {
  name: string;
  meta?: string;
  status?: string;
}) {
  const ok = ["verified", "uploaded", "complete"].includes(
    (status ?? "").toLowerCase(),
  );

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--mantine-color-slate-1)] py-2 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <ThemeIcon
          variant="light"
          color={ok ? "success" : "gray"}
          size={22}
          radius="xl"
        >
          {ok ? <IconCheck size={13} /> : <IconAlertCircle size={13} />}
        </ThemeIcon>
        <div className="min-w-0">
          <Text size="xs" fw={600} c="slate.8" truncate>
            {name}
          </Text>
          {meta && (
            <Text size="xs" c="slate.5" truncate>
              {meta}
            </Text>
          )}
        </div>
      </div>
      <StatusBadge status={status ?? "Missing"} />
    </div>
  );
}
