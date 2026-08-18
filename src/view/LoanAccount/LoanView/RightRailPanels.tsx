import { Paper, Text, Avatar, Button } from "@mantine/core";
import {
  IconMessage,
  IconNote,
  IconPhoneCall,
  IconCircleCheck,
  IconCashBanknote,
  IconFileText,
  IconActivity,
  IconGauge,
  IconShieldCheck,
  IconAlertTriangle,
  IconCalendar,
  IconDotsVertical,
} from "@tabler/icons-react";
import { themeTokens } from "./SharedUI";

/* ============================================================================
   CREDIT SCORE GAUGE — 300–900 semi-circle arc with a position marker
============================================================================ */

const GAUGE_MIN = 300;
const GAUGE_MAX = 900;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = startAngle - endAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function scoreToAngle(score: number) {
  const clamped = Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, score));
  const fraction = (clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
  return 180 - fraction * 180; // 180deg at min (left), 0deg at max (right)
}

function riskLabel(score: number) {
  if (score >= 750) return { label: "Low risk", tone: themeTokens.success, soft: themeTokens.successSoft, desc: "Your credit profile indicates low risk." };
  if (score >= 600) return { label: "Medium risk", tone: themeTokens.warning, soft: themeTokens.warningSoft, desc: "Your credit profile indicates moderate risk." };
  return { label: "High risk", tone: themeTokens.danger, soft: themeTokens.dangerSoft, desc: "Your credit profile indicates elevated risk." };
}

function CreditScoreGauge({ score }: { score: number }) {
  const cx = 100;
  const cy = 92;
  const r = 78;
  const strokeWidth = 12;
  const angle = scoreToAngle(score);
  const marker = polarToCartesian(cx, cy, r, angle);
  const risk = riskLabel(score);

const segments = [
  { from: 180, to: 135, color: "var(--mantine-color-danger-5)" },
  { from: 135, to: 90, color: "var(--mantine-color-gold-6)" },
  { from: 90, to: 45, color: "var(--mantine-color-warning-4)" },
  { from: 45, to: 0, color: "var(--mantine-color-success-6)" },
];
  return (
    <div className="flex items-center gap-4">
      <svg width={180} height={110} viewBox="0 0 200 110">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, r, seg.from, seg.to)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
        {/* Marker */}
      <circle cx={marker.x} cy={marker.y} r={5} fill="var(--mantine-color-slate-8)" stroke="var(--mantine-color-white)" strokeWidth={2} />
        {/* Min/max labels */}
        <text x={cx - r - 4} y={cy + 18} fontSize={10} fill="var(--mantine-color-slate-4)" textAnchor="middle">{GAUGE_MIN}</text>
        <text x={cx + r + 4} y={cy + 18} fontSize={10} fill="var(--mantine-color-slate-4)" textAnchor="middle">{GAUGE_MAX}</text>
      </svg>

      <div className="flex flex-col -ml-6">
        <Text fz={26} fw={800} c="slate.9" style={{ lineHeight: 1 }}>{score}</Text>
        <Text fz="xs" c="dimmed">/ {GAUGE_MAX}</Text>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-2 w-fit"
          style={{ backgroundColor: risk.soft }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: risk.tone }} />
          <Text fz={11} fw={700} style={{ color: risk.tone }}>{risk.label}</Text>
        </span>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  iconBg,
  iconFg,
  label,
  value,
  valueColor,
  dotColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconFg: string;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  dotColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-t border-[var(--mantine-color-slate-1)]">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg, color: iconFg }}
        >
          {icon}
        </div>
        <Text fz="xs" c="dimmed">{label}</Text>
      </div>
      <span className="inline-flex items-center gap-1.5">
        {dotColor && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: dotColor }} />}
        <Text fz="xs" fw={700} style={valueColor ? { color: valueColor } : undefined} c={valueColor ? undefined : "slate.9"}>
          {value}
        </Text>
      </span>
    </div>
  );
}

/* ============================================================================
   RECENT ACTIVITY
============================================================================ */

function activityIcon(kind?: string) {
  switch (kind) {
    case "payment":
      return { icon: <IconCircleCheck size={14} />, bg: themeTokens.successSoft, fg: themeTokens.success };
    case "disbursement":
      return { icon: <IconCashBanknote size={14} />, bg: themeTokens.warningSoft, fg: themeTokens.warning };
    case "system":
    case "created":
      return { icon: <IconFileText size={14} />, bg: themeTokens.infoSoft, fg: themeTokens.info };
    default:
      return { icon: <IconActivity size={14} />, bg: themeTokens.slateSoft, fg: themeTokens.slate };
  }
}

export function RecentActivityPanel({
  activity = [],
  onViewAll,
}: {
  activity?: any[];
  onViewAll?: () => void;
}) {
  const items = activity.slice(0, 4);
  return (
    <Paper radius="lg" p="md" style={{ boxShadow: "var(--mantine-shadow-md)", border: "1px solid var(--mantine-color-slate-2)" }}>
      <div className="flex items-center justify-between mb-3">
        <Text fz="xs" fw={700} c="slate.9">Recent activity</Text>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold"
            style={{ color: themeTokens.primary, background: "none", border: "none", cursor: "pointer" }}
          >
            View all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <Text fz="xs" c="dimmed">No recent activity.</Text>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => {
            const tone = activityIcon(item.kind || item.type);
            const title = item.title || item.description || item.action || "Activity";
            const meta = [item.reference || item.id, item.amount].filter(Boolean).join(" · ");
            const when = item.date || item.created_at || item.timestamp;
            return (
              <div key={item.id || idx} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: tone.bg, color: tone.fg }}
                >
                  {tone.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <Text fz="xs" fw={700} c="slate.9" truncate>{title}</Text>
                  {meta && <Text fz={11} c="dimmed" truncate>{meta}</Text>}
                  {when && <Text fz={10} c="dimmed" className="mt-0.5">{when}</Text>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Paper>
  );
}

/* ============================================================================
   RIGHT RAIL — main export
============================================================================ */

export function RiskSnapshotPanel({
  borrower,
  activity,
  onViewAllActivity,
}: {
  borrower: any;
  activity?: any[];
  onViewAllActivity?: () => void;
}) {
  const creditScore = borrower?.creditScore || 0;
  const kycTone = borrower?.kycStatus === 'Verified' ? themeTokens.success : borrower?.kycStatus === 'Pending' ? themeTokens.warning : themeTokens.danger;
  const riskTone = borrower?.riskRating === 'Low' ? themeTokens.success : borrower?.riskRating === 'Medium' ? themeTokens.warning : themeTokens.danger;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: themeTokens.warningSoft, color: themeTokens.warning }}
            >
              <IconGauge size={16} />
            </div>
            <Text fz={11} fw={700} c="slate.5" className="tracking-wider">CREDIT SCORE</Text>
          </div>
          <IconDotsVertical size={16} color="var(--mantine-color-slate-4)" />
        </div>

        <CreditScoreGauge score={creditScore} />

        <InfoRow
          icon={<IconShieldCheck size={14} />}
          iconBg={themeTokens.successSoft}
          iconFg={themeTokens.success}
          label="KYC status"
          value={borrower?.kycStatus || 'Pending'}
          valueColor="var(--mantine-color-success-7)"
          dotColor={kycTone}
        />
        <InfoRow
          icon={<IconAlertTriangle size={14} />}
          iconBg={themeTokens.warningSoft}
          iconFg={themeTokens.warning}
          label="Risk rating"
          value={borrower?.riskRating || 'Unknown'}
          valueColor="var(--mantine-color-warning-8)"
          dotColor={riskTone}
        />
        {borrower?.relationshipSince && (
          <InfoRow
            icon={<IconCalendar size={14} />}
            iconBg={themeTokens.infoSoft}
            iconFg={themeTokens.info}
            label="Relationship since"
            value={borrower.relationshipSince}
          />
        )}
      </Paper>

      {borrower?.relationshipManager && (
        <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
          <Text fz="xs" fw={700} c="slate.9" className="mb-3">Relationship manager</Text>
          <div className="flex items-center gap-3 mb-3">
            <Avatar radius="xl" size={38} style={{ background: `linear-gradient(135deg, ${themeTokens.primary}, ${themeTokens.info})`, color: 'var(--mantine-color-white)' }}>
              {borrower.relationshipManager.initials}
            </Avatar>
            <div>
              <Text fz="xs" fw={700} c="slate.9">{borrower.relationshipManager.name}</Text>
              <Text fz="xs" c="dimmed">{borrower.relationshipManager.branch}</Text>
            </div>
          </div>
          <Button fullWidth size="xs" variant="light" styles={{ root: { backgroundColor: themeTokens.primarySoft, color: themeTokens.primary } }} leftSection={<IconMessage size={14} />}>
            Message RM
          </Button>
        </Paper>
      )}

      {activity && <RecentActivityPanel activity={activity} onViewAll={onViewAllActivity} />}
    </div>
  );
}

export function DocumentStatusPanel({ checklist }: { checklist: { complete: number; total: number; missingLabel: string | null } }) {
  const pct = checklist.total > 0 ? Math.round((checklist.complete / checklist.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wider mb-3">DOCUMENT STATUS</Text>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: themeTokens.slateSoft }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: checklist.missingLabel ? themeTokens.warning : themeTokens.success }} />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">Complete</Text>
            <Text fz="xs" fw={700} c="slate.9" className="font-mono">{checklist.complete} / {checklist.total}</Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">Missing</Text>
            <Text fz="xs" fw={700} style={{ color: checklist.missingLabel ? themeTokens.warning : undefined }} c={checklist.missingLabel ? undefined : 'slate.9'}>
              {checklist.missingLabel || 'None'}
            </Text>
          </div>
        </div>
        <Button fullWidth size="xs" styles={{ root: { backgroundColor: themeTokens.primary } }} disabled={!checklist.missingLabel}>
          Request from borrower
        </Button>
      </Paper>
    </div>
  );
}

export function QuickLogPanel() {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <Text fz="xs" fw={700} c="slate.5" className="tracking-wider mb-3">QUICK LOG</Text>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="xs" styles={{ root: { backgroundColor: themeTokens.primary } }} leftSection={<IconNote size={14} />}>Add note</Button>
          <Button fullWidth size="xs" variant="light" styles={{ root: { backgroundColor: themeTokens.infoSoft, color: themeTokens.info } }} leftSection={<IconPhoneCall size={14} />}>Log a call</Button>
        </div>
      </Paper>
    </div>
  );
}
