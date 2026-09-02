import { Box, Button, Divider, Group, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  IconAward, IconBuildingBank, IconCash, IconCalendarStats,
  IconFileSearch, IconFlag, IconSearch, IconGauge,
} from "@tabler/icons-react";

import { PlainCard, SectionHeader } from "../../../../components/shared/customer/Shared";
import { CreditScoreGauge, getScoreBand } from "../../../../components/shared/Creditscoregauge";
import { type CreditAssessmentResult } from "../../../../hooks/customer/modal/Usecreditassessmentstate";

interface CreditBureauSummaryProps {
  result: CreditAssessmentResult | null;
  isExpired: boolean;
  onViewFullReport?: () => void;
}

export function CreditBureauSummary({ result, isExpired, onViewFullReport }: CreditBureauSummaryProps) {
  if (!result) {
    return (
      <PlainCard dense>
        <Group justify="space-between" align="center" mb="xs">
          <SectionHeader
            icon={IconGauge}
            title="Credit bureau summary"
            badge="BUREAU"
            accent="accent"
            dense
            stepNumber={2}
          />
        </Group>

        <Stack
          align="center"
          justify="center"
          gap={6}
          py="xl"
          style={{
            border: "1px dashed var(--mantine-color-slate-3)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <ThemeIcon variant="light" color="slate" size={36} radius="xl">
            <IconFileSearch size={18} />
          </ThemeIcon>
          <Text size="sm" fw={600} c="slate.6">
            No bureau summary yet
          </Text>
          <Text size="xs" c="slate.5" ta="center" maw={260}>
            Run the credit check on the left to pull the customer's bureau
            score, risk band, and account history.
          </Text>
        </Stack>
      </PlainCard>
    );
  }

  const band = getScoreBand(result.score);
  const items = [
    { label: "Risk Band", value: result.riskBand, icon: IconAward },
    { label: "Active Accounts", value: String(result.activeAccounts), icon: IconBuildingBank },
    { label: "Delinquent Accounts", value: String(result.delinquentAccounts), icon: IconFlag },
    { label: "Total Outstanding", value: result.totalOutstanding.toLocaleString(), icon: IconCash },
    { label: "Monthly Obligations", value: result.monthlyObligations.toLocaleString(), icon: IconCalendarStats },
    { label: "Recent Enquiries", value: String(result.recentEnquiries), icon: IconSearch },
  ];

  return (
    <PlainCard dense>
      <Group justify="space-between" align="center" mb="xs">
        <SectionHeader icon={IconGauge} title="Credit bureau summary" badge="BUREAU" accent="accent" dense stepNumber={2} />
        {isExpired && (
          <Text size="xs" c="warning.7" fw={600}>Expired — refresh recommended</Text>
        )}
      </Group>

      <Group align="center" wrap="nowrap" gap="lg">
        <CreditScoreGauge score={result.score} size={150} />
        <Stack gap={4} style={{ flex: 1 }}>
          <SimpleGrid cols={3} spacing="md" verticalSpacing="xs">
            {items.map((item) => (
              <Group key={item.label} gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon variant="light" color="slate" size={26} radius="sm">
                  <item.icon size={14} />
                </ThemeIcon>
                <Box>
                  <Group gap={4}>
                    <Text size="xs" c="slate.5">{item.label}</Text>
                    <Text size="9px" c="slate.4" fw={600}>· BUREAU</Text>
                  </Group>
                  <Text size="sm" fw={700} c="slate.8">{item.value}</Text>
                </Box>
              </Group>
            ))}
          </SimpleGrid>

          <Divider my={4} />
        </Stack>
      </Group>
    </PlainCard>
  );
}