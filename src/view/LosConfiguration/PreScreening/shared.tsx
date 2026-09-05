import { Badge, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { Severity } from "./types";

/* ============================================================
   BADGES — plain Mantine semantic colors, same pattern as the
   Badge usage in SchedulerPage.tsx (color + variant="light").
   ============================================================ */
const STATUS_COLOR: Record<string, string> = {
  Active: "green",
  Draft: "gray",
  Inactive: "orange",
  Archived: "gray",
  Scheduled: "blue",
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || "gray";
  return (
    <Badge color={color} variant="light" size="sm" radius="sm">
      {status}
    </Badge>
  );
}

const SEVERITY_COLOR: Record<Severity, string> = {
  Blocking: "red",
  Warning: "orange",
  Review: "blue",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge color={SEVERITY_COLOR[severity]} variant="light" size="sm" radius="sm">
      {severity}
    </Badge>
  );
}

/* ============================================================
   VALIDATION LINE
   ============================================================ */
export function ValidationLine({ ok, text, warnOnly }: { ok: boolean; text: string; warnOnly?: boolean }) {
  const color = ok ? "var(--mantine-color-green-6)" : warnOnly ? "var(--mantine-color-orange-6)" : "var(--mantine-color-red-6)";
  const bg = ok ? "var(--mantine-color-green-0)" : warnOnly ? "var(--mantine-color-orange-0)" : "var(--mantine-color-red-0)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
      <span style={{ width: 18, height: 18, borderRadius: 99, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {ok ? <IconCheck size={12} stroke={2.5} /> : <IconX size={12} stroke={2.5} />}
      </span>
      <Text span fz={13.5} c={ok ? "slate.8" : color}>{text}</Text>
    </div>
  );
}

/* ============================================================
   TOAST
   ============================================================ */
export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--mantine-color-slate-8)", color: "#fff", padding: "11px 20px", borderRadius: "var(--mantine-radius-md)", fontSize: 13.5, fontWeight: 500, zIndex: 1000, boxShadow: "var(--mantine-shadow-md)", display: "flex", alignItems: "center", gap: 8 }}>
      <IconCheck size={14} color="var(--mantine-color-green-5)" />{message}
    </div>
  );
}