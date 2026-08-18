import { ActionIcon, Divider, Group, Paper, Text, ThemeIcon } from '@mantine/core';
import { IconCalendar, IconChevronRight, IconShieldCheck } from '@tabler/icons-react';
import { CreditScoreGauge, type CreditScoreBand } from '../../../../components/shared/Creditscoregauge';

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
  riskRating?: string;
  creditScore?: number | null;
  riskAssessedAt?: string;
  onViewDetails?: () => void;
}) {
  const tone = toneForRating(riskRating);
  const hasRating = Boolean(riskRating);
  const hasScore = creditScore !== undefined && creditScore !== null;

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{ borderColor: 'var(--mantine-color-slate-2)' }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap={8} align="center" wrap="nowrap">
          <ThemeIcon
            variant="light"
            color={hasRating ? tone : 'gray'}
            size={30}
            radius="md"
          >
            <IconShieldCheck size={15} />
          </ThemeIcon>

          <div>
            <Text size="xs" c="slate.5" fw={600} lh={1.1}>
              Risk Rating
            </Text>

            <Text
              size="md"
              fw={800}
              c={hasRating ? `${tone}.6` : 'slate.4'}
              lh={1.15}
              mt={2}
            >
              {riskRating ?? '—'}
            </Text>
          </div>
        </Group>

        {onViewDetails && (
          <ActionIcon
            variant="light"
            color="gray"
            radius="md"
            size="sm"
            onClick={onViewDetails}
            aria-label="View risk details"
          >
            <IconChevronRight size={14} />
          </ActionIcon>
        )}
      </Group>

      <Group
        justify="space-between"
        align="center"
        wrap="nowrap"
        mt={8}
      >
        <div>
          <Text size="xs" c="slate.5" fw={600}>
            Credit Score
          </Text>

          <Text
            size="lg"
            fw={800}
            c={hasScore ? 'slate.8' : 'slate.4'}
            lh={1}
            mt={3}
          >
            {hasScore ? creditScore : '—'}
          </Text>

          <Text size="xs" c="slate.4" mt={3}>
            {hasScore ? 'out of 100' : 'Not assessed'}
          </Text>
        </div>

        <CreditScoreGauge
          score={creditScore ?? null}
          min={0}
          max={100}
          bands={RISK_SCORE_BANDS}
          size={68}
          showValue={false}
        />
      </Group>

      <Divider my={7} color="slate.1" />

      <Group gap={4} wrap="nowrap">
        <IconCalendar
          size={12}
          style={{
            color: 'var(--mantine-color-slate-4)',
            flexShrink: 0,
          }}
        />

        <Text
          size="xs"
          c="slate.5"
          className="whitespace-nowrap"
        >
          {riskAssessedAt
            ? `Assessed: ${riskAssessedAt}`
            : 'Not yet assessed'}
        </Text>
      </Group>
    </Paper>
  );
}