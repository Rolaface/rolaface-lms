import { ActionIcon, Divider, Group, Paper, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconCalendar, IconChevronRight, IconShieldCheck } from '@tabler/icons-react';
import { CreditScoreGauge, type CreditScoreBand } from '../../../../components/shared/Creditscoregauge';

/** Risk-band coloring for the 0–100 credit score gauge shown inside this card.
 *  Kept separate from CreditScoreGauge's DEFAULT_BANDS (which are tuned for
 *  the 300–850 bureau scale) since risk score here is a 0–100 internal metric. */
const RISK_SCORE_BANDS: CreditScoreBand[] = [
  { label: 'High Risk', max: 40, color: 'var(--mantine-color-danger-5)' },
  { label: 'Medium Risk', max: 70, color: 'var(--mantine-color-warning-5)' },
  { label: 'Low Risk', max: 100, color: 'var(--mantine-color-success-5)' },
];

type RiskTone = 'success' | 'warning' | 'danger' | 'gray';

function toneForRating(rating?: string): RiskTone {
  switch ((rating ?? '').toLowerCase()) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'gray';
  }
}

export function RiskRatingCard({
  riskRating,
  creditScore,
  riskAssessedAt,
  onViewDetails,
}: {
  /** e.g. "Low" | "Medium" | "High" */
  riskRating?: string;
  /** 0–100 internal risk/credit score. Omit or pass null/undefined to show the "not assessed" state. */
  creditScore?: number | null;
  /** Display string, e.g. "12 Aug 2026" */
  riskAssessedAt?: string;
  onViewDetails?: () => void;
}) {
  const tone = toneForRating(riskRating);
  const hasRating = Boolean(riskRating);

  return (
    <Paper withBorder radius="md" p="sm" className="h-full flex flex-col" style={{ borderColor: 'var(--mantine-color-slate-2)' }}>
      {/* Header: shield icon + label/value, chevron to drill in */}
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap={8} align="flex-start" wrap="nowrap">
          <ThemeIcon variant="light" color={hasRating ? tone : 'gray'} size={32} radius="md">
            <IconShieldCheck size={16} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="slate.5" fw={600}>
              Risk Rating
            </Text>
            <Text size="md" fw={800} c={hasRating ? `${tone}.6` : 'slate.4'} lh={1.2}>
              {riskRating ?? '—'}
            </Text>
          </div>
        </Group>

        {onViewDetails && (
          <ActionIcon variant="light" color="gray" radius="md" size="sm" onClick={onViewDetails} aria-label="View risk details">
            <IconChevronRight size={14} />
          </ActionIcon>
        )}
      </Group>

      {/* Credit score gauge — kept small so the whole card stays compact next to the plain StatCards */}
      <Group justify="space-between" align="center" mt={6} wrap="nowrap">
        <Text size="xs" c="slate.5" fw={600}>
          Credit Score
        </Text>
        <CreditScoreGauge
          score={creditScore ?? null}
          min={0}
          max={100}
          bands={RISK_SCORE_BANDS}
          size={92}
          showValue
          scoreSuffix="/100"
        />
      </Group>

      <Divider my={6} color="slate.1" />

      {/* Footer: last assessed date + View details link */}
      <Group justify="space-between" align="center" mt="auto" wrap="nowrap">
        <Group gap={4} wrap="nowrap">
          <IconCalendar size={12} style={{ color: 'var(--mantine-color-slate-4)', flexShrink: 0 }} />
          <Text size="xs" c="slate.5" className="whitespace-nowrap">
            {riskAssessedAt ? `Assessed: ${riskAssessedAt}` : 'Not yet assessed'}
          </Text>
        </Group>

        {onViewDetails && (
          <UnstyledButton onClick={onViewDetails}>
            <Group gap={2} wrap="nowrap">
              <Text size="xs" fw={700} c="brand.6" className="whitespace-nowrap">
                View details
              </Text>
              <IconChevronRight size={12} color="var(--mantine-color-brand-6)" />
            </Group>
          </UnstyledButton>
        )}
      </Group>
    </Paper>
  );
}