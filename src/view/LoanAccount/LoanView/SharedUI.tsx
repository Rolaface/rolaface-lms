import { Text } from "@mantine/core";

export const themeTokens = {
  primary: "var(--mantine-color-brand-6)",
  primarySoft: "var(--mantine-color-brand-0)",
  success: "var(--mantine-color-success-6)",
  successSoft: "var(--mantine-color-success-0)",
  warning: "var(--mantine-color-warning-6)",
  warningSoft: "var(--mantine-color-warning-0)",
  danger: "var(--mantine-color-danger-6)",
  dangerSoft: "var(--mantine-color-danger-0)",
  info: "var(--mantine-color-info-6)",
  infoSoft: "var(--mantine-color-info-0)",
  slate: "var(--mantine-color-slate-5)",
  slateSoft: "var(--mantine-color-slate-1)",
  surface: "var(--mantine-color-slate-0)",
  ink: "var(--mantine-color-slate-9)",
};

export const serif = { fontFamily: "Georgia, serif" };

export function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: `${iconBg}88` }}
    >
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 36, height: 36, background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <Text fz="xs" c="dimmed" className="leading-tight">
          {label}
        </Text>
        <Text fz="lg" fw={800} c="slate.9" className="leading-tight mt-0.5">
          {value}
        </Text>
      </div>
    </div>
  );
}


export function OverviewField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span style={{ color: "var(--mantine-color-slate-4)", display: "flex" }}>{icon}</span>}
        <Text fz={10} fw={700} c="dimmed" className="tracking-wider">
          {label}
        </Text>
      </div>
      <Text fz="sm" fw={600} c="slate.9" className="font-mono">
        {value}
      </Text>
    </div>
  );
}

export function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline mb-3">
      <Text fz="lg" fw={600} c="slate.9" style={serif}>
        {title}
      </Text>
      {aside && (
        <Text fz="xs" c="dimmed">
          {aside}
        </Text>
      )}
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "active" | "warn" | "neutral" }) {
  const tones = {
    active: { dot: "var(--mantine-other-statusActive)", bg: themeTokens.successSoft, text: "var(--mantine-color-success-7)" },
    warn: { dot: "var(--mantine-other-statusPending)", bg: themeTokens.warningSoft, text: "var(--mantine-color-warning-8)" },
    neutral: { dot: "var(--mantine-other-statusInactive)", bg: themeTokens.slateSoft, text: "var(--mantine-color-slate-6)" },
  } as const;
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ backgroundColor: t.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: t.dot }} />
      <Text fz="xs" fw={700} style={{ color: t.text }}>
        {label}
      </Text>
    </span>
  );
}

export function TenureBar({ elapsed, total }: { elapsed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  return (
    <div className="pt-3 border-t border-[var(--mantine-color-slate-1)]">
      <div className="flex justify-between items-center mb-1.5">
        <Text fz="xs" c="dimmed">
          Tenure elapsed
        </Text>
        <Text fz="xs" c="dimmed" className="font-mono">
          {elapsed} / {total} months
        </Text>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: themeTokens.slateSoft }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--mantine-color-brand-6), var(--mantine-color-warning-6))",
          }}
        />
      </div>
    </div>
  );
}
