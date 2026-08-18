import { Box, Text, Stack, Group, ActionIcon, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useId, useRef, useState } from "react";
import { openCommonModal } from "../Modal/AlertModal"; // <-- CHECK THIS PATH matches your project

/**
 * CreditScoreGauge
 * ------------------------------------------------------------------
 * Semi-circle "speedometer" gauge for a credit score, with:
 *   - smooth gradient arc + soft depth shadow (glossy/3D feel)
 *   - animated needle + counting number on score change
 *   - optional "last checked" timestamp + guarded refetch button
 * ------------------------------------------------------------------
 */

export interface CreditScoreBand {
  label: string;
  max: number; // inclusive upper bound of this band
  color: string; // CSS var
}

export const DEFAULT_SCORE_MIN = 300;
export const DEFAULT_SCORE_MAX = 850;

export const DEFAULT_BANDS: CreditScoreBand[] = [
  { label: "Poor", max: 579, color: "var(--mantine-color-danger-5)" },
  { label: "Fair", max: 669, color: "var(--mantine-color-warning-5)" },
  { label: "Good", max: 739, color: "var(--mantine-color-info-5)" },
  { label: "Excellent", max: 850, color: "var(--mantine-color-success-5)" },
];

export function getScoreBand(
  score: number,
  bands: CreditScoreBand[] = DEFAULT_BANDS,
): CreditScoreBand {
  return bands.find((b) => score <= b.max) ?? bands[bands.length - 1];
}

interface CreditScoreGaugeProps {
  score: number | null;
  min?: number;
  max?: number;
  bands?: CreditScoreBand[];
  size?: number; // rendered width in px, height follows aspect ratio
  showValue?: boolean; // render numeral + band label under the arc
  /** Overrides the band label shown under the number, e.g. "/100". Omit to show the band label as before. */
  scoreSuffix?: string;

  /** When the score was last fetched. Omit to hide the timestamp/refetch row. */
  lastFetchedAt?: Date | null;
  /** Called after the user confirms they want a fresh fetch. */
  onRefetch?: () => void | Promise<void>;
  /** Hard floor — refetching faster than this just warns, no confirm dialog. Default 60s. */
  minRefetchIntervalMs?: number;
}

const CX = 100;
const CY = 100;
const R = 80;
const STROKE = 16;
const VIEWBOX = "0 0 200 116";
const ANIMATION_MS = 700;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function scoreToAngle(score: number, min: number, max: number) {
  const clamped = Math.min(Math.max(score, min), max);
  return 180 - ((clamped - min) / (max - min)) * 180;
}

function arcPath(cx: number, cy: number, r: number, angleStart: number, angleEnd: number) {
  const p1 = polarToCartesian(cx, cy, r, angleStart);
  const p2 = polarToCartesian(cx, cy, r, angleEnd);
  const largeArc = angleStart - angleEnd > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Smoothly tweens a numeric value whenever `target` changes. */
function useAnimatedNumber(target: number, durationMs: number = ANIMATION_MS) {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number | undefined>(undefined);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}

function formatRelativeTime(date: Date): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

export function CreditScoreGauge({
  score,
  min = DEFAULT_SCORE_MIN,
  max = DEFAULT_SCORE_MAX,
  bands = DEFAULT_BANDS,
  size = 180,
  showValue = true,
  scoreSuffix,
  lastFetchedAt = null,
  onRefetch,
  minRefetchIntervalMs = 60_000,
}: CreditScoreGaugeProps) {
  const gradientId = useId();
  const height = (size * 116) / 200;
  const hasScore = score !== null && score !== undefined;
  const band = hasScore ? getScoreBand(score, bands) : null;

  const animatedScore = useAnimatedNumber(hasScore ? score : min);
  const needleAngle = scoreToAngle(hasScore ? animatedScore : min, min, max);
  const needleTip = polarToCartesian(CX, CY, R - STROKE / 2, needleAngle);

  // Build gradient stops from band boundaries so the arc blends smoothly.
  let runningMin = min;
  const stops: { color: string; startPct: number; endPct: number }[] = [];
  for (const b of bands) {
    const startPct = ((runningMin - min) / (max - min)) * 100;
    const endPct = ((Math.min(b.max, max) - min) / (max - min)) * 100;
    stops.push({ color: b.color, startPct, endPct });
    runningMin = b.max;
  }

  const gradientStopElements: JSX.Element[] = [];
  stops.forEach((s) => {
    gradientStopElements.push(
      <stop key={`${s.color}-start`} offset={`${s.startPct}%`} stopColor={s.color} />,
    );
    gradientStopElements.push(
      <stop key={`${s.color}-end`} offset={`${s.endPct}%`} stopColor={s.color} />,
    );
  });

  function handleRefetchClick() {
    if (!onRefetch) return;

    if (lastFetchedAt) {
      const msSinceLastFetch = Date.now() - lastFetchedAt.getTime();

      if (msSinceLastFetch < minRefetchIntervalMs) {
        openCommonModal({
          heading: "Too soon to refetch",
          body: `Score was refreshed ${formatRelativeTime(lastFetchedAt)}. Please wait a bit before checking again.`,
          color: "orange",
          buttons: [{ label: "Got it", variant: "default" }],
        });
        return;
      }

      openCommonModal({
        heading: "Refetch credit score?",
        subtitle: "This pulls a fresh bureau report.",
        body: `Your credit score was last checked ${formatRelativeTime(lastFetchedAt)}. Continue?`,
        color: "blue",
        buttons: [
          { label: "Not now", variant: "default" },
          { label: "Refetch", color: "blue", onClick: () => onRefetch() },
        ],
      });
      return;
    }

    onRefetch();
  }

  return (
    <Stack gap={2} align="center">
      <Box style={{ width: size, height, position: "relative" }}>
        <svg
          viewBox={VIEWBOX}
          width={size}
          height={height}
          style={{ overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(15, 23, 42, 0.18))" }}
        >
          <defs>
            <linearGradient id={`${gradientId}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStopElements}
            </linearGradient>

            <linearGradient id={`${gradientId}-sheen`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity={0.35} />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </linearGradient>

            <radialGradient id={`${gradientId}-hub`}>
              <stop offset="0%" stopColor="var(--mantine-color-slate-6)" />
              <stop offset="100%" stopColor="var(--mantine-color-slate-9)" />
            </radialGradient>

            <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={arcPath(CX, CY, R, 180, 0)}
            stroke="var(--mantine-color-slate-2)"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />

          {/* Gradient band arc */}
          <path
            d={arcPath(CX, CY, R, 180, 0)}
            stroke={`url(#${gradientId}-arc)`}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            opacity={hasScore ? 1 : 0.25}
          />

          {/* Glossy sheen */}
          <path
            d={arcPath(CX, CY, R, 180, 0)}
            stroke={`url(#${gradientId}-sheen)`}
            strokeWidth={STROKE / 2.4}
            fill="none"
            strokeLinecap="round"
            opacity={hasScore ? 0.8 : 0.15}
            transform={`translate(0, ${-STROKE / 5})`}
          />

          {hasScore && (
            <g filter={`url(#${gradientId}-glow)`}>
              <line
                x1={CX}
                y1={CY}
                x2={needleTip.x}
                y2={needleTip.y}
                stroke="var(--mantine-color-slate-8)"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle
                cx={CX}
                cy={CY}
                r={7}
                fill={`url(#${gradientId}-hub)`}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      </Box>

      {showValue && (
        <Stack gap={0} align="center" mt={-4}>
          <Text fw={800} fz={28} c={hasScore ? "slate.8" : "slate.4"} lh={1.1}>
            {hasScore ? Math.round(animatedScore) : "—"}
          </Text>
          <Text fz="xs" fw={600} c={hasScore ? "slate.5" : "slate.4"}>
            {hasScore ? (scoreSuffix ?? band?.label) : "Not assessed"}
          </Text>
        </Stack>
      )}

      {(lastFetchedAt || onRefetch) && (
        <Group gap={4} mt={4} align="center">
          {lastFetchedAt && (
            <Text fz={10} c="slate.4">
              Checked {formatRelativeTime(lastFetchedAt)}
            </Text>
          )}
          {onRefetch && (
            <Tooltip label="Refetch score" withArrow>
              <ActionIcon size="xs" variant="subtle" color="slate" onClick={handleRefetchClick}>
                <IconRefresh size={12} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      )}
    </Stack>
  );
}