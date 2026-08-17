import { Text } from "@mantine/core";

export const brand = {
  primary: "#1A56DB",
  primarySoft: "#EFF6FF",
  teal: "#0F766E",
  tealSoft: "#F0FDFA",
  gold: "#B45309",
  goldSoft: "#FFFBEB",
  slate: "#475569",
  slateSoft: "#F8FAFC",
  rose: "#BE123C",
  roseSoft: "#FFF1F2",
  sky: "#0369A1",
  skySoft: "#F0F9FF",
  cream: "#FAFAF9",
  ink: "#111827",
};

export const serif = { fontFamily: "Georgia, serif" };

export function OverviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Text fz={10} fw={700} c="dimmed" className="tracking-wider mb-1">
        {label}
      </Text>
      <Text fz="sm" fw={600} c="gray.9" className="font-mono">
        {value}
      </Text>
    </div>
  );
}

export function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline mb-3">
      <Text fz="lg" fw={600} c="gray.9" style={serif}>
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
    active: { dot: brand.teal, bg: brand.tealSoft, text: "#0B5D4D" },
    warn: { dot: brand.gold, bg: brand.goldSoft, text: "#8A5A0F" },
    neutral: { dot: brand.slate, bg: brand.slateSoft, text: "#4B5563" },
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
    <div className="pt-3 border-t border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <Text fz="xs" c="dimmed">
          Tenure elapsed
        </Text>
        <Text fz="xs" c="dimmed" className="font-mono">
          {elapsed} / {total} months
        </Text>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: brand.slateSoft }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brand.primary}, ${brand.gold})` }}
        />
      </div>
    </div>
  );
}