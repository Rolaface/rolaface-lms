import {
  Box, Button, Badge, Checkbox, Group, Select, Stack, Text, Tooltip,
} from "@mantine/core";
import { IconChevronDown, IconGauge, IconRefresh, IconAlertTriangle, IconBuildingBank } from "@tabler/icons-react";
import dayjs from "dayjs";

import {
  PlainCard, SectionHeader,
} from "../../../../components/shared/customer/Shared";
import { BUREAU_PROVIDERS } from "../../../../api/Customer/creditAssessmentApi";
import {
  type CreditAssessmentResult,
  type CreditCheckStatus,
} from "../../../../hooks/customer/modal/Usecreditassessmentstate";
import { openCommonModal } from "../../../../components/Modal/AlertModal";

interface CreditAssessmentStepProps {
  status: CreditCheckStatus;
  result: CreditAssessmentResult | null;
  errorMessage: string | null;
  consentGiven: boolean;
  setConsentGiven: (v: boolean) => void;
  bureauProvider: string | null;
  setBureauProvider: (v: string | null) => void;
  runCheck: () => void;
  refreshCheck: () => void;
}

const STATUS_PILL: Record<CreditCheckStatus, { label: string; color: string }> = {
  idle: { label: "NOT STARTED", color: "slate" },
  loading: { label: "IN PROGRESS", color: "info" },
  assessed: { label: "ASSESSED", color: "success" },
  failed: { label: "FAILED", color: "danger" },
  no_record: { label: "NO RECORD FOUND", color: "warning" },
};

const chevron = <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />;

function formatTimestamp(iso: string) {
  return dayjs(iso).format("DD-MMM-YYYY hh:mm A");
}

export function CreditAssessmentStep({
  status, result, errorMessage,
  consentGiven, setConsentGiven,
  bureauProvider, setBureauProvider,
  runCheck, refreshCheck,
}: CreditAssessmentStepProps) {
  const pill = STATUS_PILL[status];

  const handleRefresh = () => {
  if (!result?.fetchedAt) {
    refreshCheck();
    return;
  }

  const lastRefreshed = dayjs(result.fetchedAt);
  const now = dayjs();

  const minutesAgo = Math.max(0, now.diff(lastRefreshed, "minute"));

  const timeText =
    minutesAgo < 1
      ? "less than a minute ago"
      : minutesAgo === 1
        ? "1 minute ago"
        : `${minutesAgo} minutes ago`;

  openCommonModal({
    heading: "Refresh Credit Assessment?",
    subtitle: "A recent credit assessment is already available.",
    body: (
      <>
        This credit assessment was last refreshed <strong>{timeText}</strong>.
        Refreshing will send a new request to the credit bureau and may update
        the customer's credit information.
        <br />
        <br />
        Do you want to continue?
      </>
    ),
    color: "info",
    buttons: [
      {
        label: "Cancel",
        variant: "default",
      },
      {
        label: "Refresh Credit Check",
        color: "brand",
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
        <Badge color={pill.color} variant="light" radius="sm">
          {pill.label}
        </Badge>
      </Group>

      {(status === "idle" || status === "loading") && (
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Select
            radius="md" rightSection={chevron}
            leftSection={<IconBuildingBank size={14} color="var(--mantine-color-slate-5)" />}
            label="Bureau / Credit Check Provider"
            data={BUREAU_PROVIDERS}
            value={bureauProvider}
            onChange={setBureauProvider}
            disabled={status === "loading"}
            styles={{ input: { height: 38 } }}
            w={220}
          />
          <Group gap="md" align="center">
            <Checkbox
              label="Customer consent obtained"
              checked={consentGiven}
              disabled={status === "loading"}
              onChange={(e) => setConsentGiven(e.currentTarget.checked)}
            />
            <Tooltip label="Confirm customer consent first." disabled={consentGiven} withArrow>
              <Box>
                <Button
                  radius="sm"
                  disabled={!consentGiven || status === "loading"}
                  loading={status === "loading"}
                  onClick={runCheck}
                >
                  Run Credit Check
                </Button>
              </Box>
            </Tooltip>
          </Group>
        </Group>
      )}

      {status === "failed" && (
        <Stack gap={6}>
          <Group gap={8}>
            <IconAlertTriangle size={16} color="var(--mantine-color-danger-6)" />
            <Text size="sm" c="danger.7" fw={500}>
              {errorMessage ?? "Bureau request failed."}
            </Text>
          </Group>
          <Group>
            <Button radius="sm" variant="light" color="danger" leftSection={<IconRefresh size={14} />} onClick={runCheck}>
              Retry
            </Button>
          </Group>
        </Stack>
      )}

      {status === "no_record" && (
        <Stack gap={6}>
          <Group gap={8}>
            <IconAlertTriangle size={16} color="var(--mantine-color-warning-6)" />
            <Text size="sm" c="warning.8" fw={500}>
              No bureau history found for this customer.
            </Text>
          </Group>
          <Text size="xs" c="slate.5">
            This is itself a data point (thin-file risk) — proceed with manual risk assessment if required.
          </Text>
          <Group>
            <Button radius="sm" variant="light" leftSection={<IconRefresh size={14} />} onClick={handleRefresh}>
              Check Again
            </Button>
          </Group>
        </Stack>
      )}

      {status === "assessed" && result && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="slate.6">
            Assessed via <Text span fw={600} c="slate.8">{result.bureau}</Text> · {formatTimestamp(result.fetchedAt)}
          </Text>
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
      )}
    </PlainCard>
  );
}