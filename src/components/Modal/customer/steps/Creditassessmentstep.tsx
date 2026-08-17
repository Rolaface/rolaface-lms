import {
  Box,
  Button,
  Badge,
  Checkbox,
  Group,
  Stack,
  Text,
  Tooltip,
  SimpleGrid,
  Loader,
  Divider,
  } from "@mantine/core";
import { openCommonModal } from "../../../../components/Modal/AlertModal";
import dayjs from "dayjs";
import {
  IconGauge,
  IconRefresh,
  IconFileSearch,
  IconAlertTriangle,
  IconBuildingBank,
  IconCash,
  IconCalendarStats,
  IconChartPie,
  IconShieldCheck,
  IconFlag,
  IconSearch,
  IconAward,
} from "@tabler/icons-react";

import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";
import {
  CreditScoreGauge,
} from "../../../../components/shared/Creditscoregauge";
import {

  type CreditAssessmentResult,
  type CreditCheckStatus,
} from "../../../../hooks/customer/modal/Usecreditassessmentstate";

interface CreditAssessmentStepProps {
  status: CreditCheckStatus;
  result: CreditAssessmentResult | null;
  errorMessage: string | null;
  isExpired: boolean;
  consentGiven: boolean;
  setConsentGiven: (v: boolean) => void;
  runCheck: () => void;
  refreshCheck: () => void;
  onViewFullReport?: () => void;
}

const STATUS_PILL: Record<CreditCheckStatus, { label: string; color: string }> =
  {
    idle: { label: "NOT STARTED", color: "slate" },
    loading: { label: "IN PROGRESS", color: "info" },
    assessed: { label: "ASSESSED", color: "success" },
    failed: { label: "FAILED", color: "danger" },
    no_record: { label: "NO RECORD FOUND", color: "warning" },
  };

// Maps known flag labels to an icon. Falls back to a generic icon for
// anything the bureau response adds that we don't explicitly know about.
const FLAG_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  "active facilities": IconBuildingBank,
  "outstanding debt": IconCash,
  "monthly obligations": IconCalendarStats,
  "credit utilisation": IconChartPie,
  "credit utilization": IconChartPie,
  defaults: IconShieldCheck,
  delinquencies: IconFlag,
  "recent inquiries": IconSearch,
  "credit band": IconAward,
};

function getFlagIcon(label: string) {
  return FLAG_ICONS[label.trim().toLowerCase()] ?? IconGauge;
}

// "1 flagged" / "3 (90d)" etc — highlight anything that reads as a flag.
function isFlaggedValue(value: string) {
  return /flag/i.test(value);
}

function formatTimestamp(iso: string) {
  return dayjs(iso).format("DD-MMM-YYYY hh:mm A");
}



export function CreditAssessmentStep({
  status,
  result,
  errorMessage,
  isExpired,
  consentGiven,
  setConsentGiven,
  runCheck,
  refreshCheck,
  onViewFullReport,
}: CreditAssessmentStepProps) {
  const pill = STATUS_PILL[status];

  const handleRefresh = () => {
    openCommonModal({
      heading: "Refresh credit assessment?",
      subtitle: "A new credit bureau check will be performed.",
      body: "This will retrieve the customer's latest credit information from TransUnion Zambia.",
      color: "blue",
      buttons: [
        {
          label: "Not now",
          variant: "default",
        },
        {
          label: "Refresh",
          color: "blue",
          onClick: refreshCheck,
        },
      ],
    });
  };

  return (
    <PlainCard dense>
      <Group justify="space-between" align="center" mb="xs">
        <SectionHeader
          icon={IconGauge}
          title="Credit assessment"
          badge="FROM BUREAU"
          accent="accent"
          dense
          stepNumber={1}
        />
        <Group gap={6}>
          <Badge color={pill.color} variant="light" radius="sm">
            {pill.label}
          </Badge>
        </Group>
      </Group>

      {/* ---------------- IDLE (pre-check) ---------------- */}
      {status === "idle" && (
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="xs">
            <IconBuildingBank size={16} color="var(--mantine-color-slate-5)" />

            <Text size="sm" c="slate.6">
              TransUnion Zambia · Credit check
            </Text>
          </Group>

          <Group gap="md" align="center">
            <Checkbox
              label="Customer consent obtained"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.currentTarget.checked)}
            />

            <Tooltip
              label="Confirm customer consent first."
              disabled={consentGiven}
              withArrow
            >
              <Box>
                <Button radius="sm" disabled={!consentGiven} onClick={runCheck}>
                  Run Credit Check
                </Button>
              </Box>
            </Tooltip>
          </Group>
        </Group>
      )}

      {/* ---------------- LOADING ---------------- */}
      {status === "loading" && (
        <Group gap="sm" py="md">
          <Loader size="sm" color="brand" />
          <Text size="sm" c="slate.6" fw={500}>
            Fetching from bureau…
          </Text>
        </Group>
      )}

      {/* ---------------- FAILED ---------------- */}
      {status === "failed" && (
        <Stack gap={6}>
          <Group gap={8}>
            <IconAlertTriangle
              size={16}
              color="var(--mantine-color-danger-6)"
            />
            <Text size="sm" c="danger.7" fw={500}>
              {errorMessage ?? "Bureau request failed."}
            </Text>
          </Group>
          <Group>
            <Button
              radius="sm"
              variant="light"
              color="danger"
              leftSection={<IconRefresh size={14} />}
              onClick={runCheck}
            >
              Retry
            </Button>
          </Group>
        </Stack>
      )}

      {/* ---------------- NO RECORD FOUND ---------------- */}
      {status === "no_record" && (
        <Stack gap={6}>
          <Group gap={8}>
            <IconAlertTriangle
              size={16}
              color="var(--mantine-color-warning-6)"
            />
            <Text size="sm" c="warning.8" fw={500}>
              No bureau history found for this customer.
            </Text>
          </Group>
          <Text size="xs" c="slate.5">
            This is itself a data point (thin-file risk) — proceed with manual
            risk assessment if required.
          </Text>
          <Group>
            <Button
              radius="sm"
              variant="light"
              leftSection={<IconRefresh size={14} />}
              onClick={refreshCheck}
            >
              Check Again
            </Button>
          </Group>
        </Stack>
      )}

      {/* ---------------- ASSESSED (success) ---------------- */}
      {status === "assessed" && result && (
        <Stack gap="md">
          <Group align="center" wrap="nowrap" gap="lg">
            <CreditScoreGauge score={result.score} size={150} />
            <Stack gap={4} style={{ flex: 1 }}>
              <Group gap={6} align="center">
                <Text size="xs" c="slate.5" fw={500}>
                  {result.bureau}
                </Text>

                <Text size="xs" c="slate.4">
                  · Fetched {formatTimestamp(result.fetchedAt)}
                </Text>
              </Group>

              <SimpleGrid cols={4} spacing="md" verticalSpacing="xs" mt={2}>
                {result.flags.map((flag) => {
                  const Icon = getFlagIcon(flag.label);
                  const flagged = isFlaggedValue(flag.value);
                  return (
                    <Group
                      key={flag.label}
                      gap={8}
                      align="flex-start"
                      wrap="nowrap"
                    >
                      <Icon size={16} color="var(--mantine-color-slate-4)" />
                      <Stack gap={0}>
                        <Text size="xs" c="slate.5">
                          {flag.label}
                        </Text>
                        <Text
                          size="sm"
                          fw={700}
                          c={flagged ? "warning.7" : "slate.8"}
                        >
                          {flag.value}
                        </Text>
                      </Stack>
                    </Group>
                  );
                })}
              </SimpleGrid>

              <Divider my={4} />

              <Group justify="flex-end" gap="xs" mt="xs">
                <Button
                  size="xs"
                  radius="sm"
                  variant="default"
                  leftSection={<IconFileSearch size={14} />}
                  onClick={onViewFullReport}
                >
                  View Report
                </Button>

                <Button
                  size="xs"
                  radius="sm"
                  variant="default"
                  leftSection={<IconRefresh size={14} />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </Group>
              {isExpired && (
                <Badge
                  color="warning"
                  variant="light"
                  radius="sm"
                  w="fit-content"
                >
                  Expired — refresh recommended
                </Badge>
              )}
            </Stack>
          </Group>
        </Stack>
      )}
    </PlainCard>
  );
}
