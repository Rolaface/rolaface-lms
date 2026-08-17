import {
  Box,
  Text,
  Avatar,
  Paper,
  Group,
  Progress,
  Badge,
  Button,
  SimpleGrid,
} from "@mantine/core";
import { IconUser, IconEye } from "@tabler/icons-react";

interface CustomerSummarySidebarProps {
  customerName: string;
  customerType: string;
  customerNumber: string;
  activeGroupLabel: string;
  currentStepLabel: string;
  stepInGroup: number;
  groupStepCount: number;
  overallCompleted: number;
  overallTotal: number;

  creditScore?: number | null;
  creditBand?: string | null;
  activeFacilities?: number | null;
  outstandingDebt?: string | null;
  bureau?: string | null;
  lastChecked?: string | null;
  reportStatus?: string | null;

  onViewSnapshot?: () => void;
}

export function CustomerSummarySidebar({
  customerName,
  customerType,
  customerNumber,
  activeGroupLabel,
  currentStepLabel,
  stepInGroup,
  groupStepCount,
  overallCompleted,
  overallTotal,
  creditScore = null,
  creditBand = null,
  activeFacilities = null,
  onViewSnapshot,
}: CustomerSummarySidebarProps) {
  const displayName = customerName.trim() || "New Customer";

  const overallProgress =
    overallTotal > 0
      ? Math.min(100, Math.round((overallCompleted / overallTotal) * 100))
      : 0;

  return (
    <Box
      className="w-full lg:w-[260px] border-t lg:border-t-0 lg:border-l"
      style={{
        flexShrink: 0,
        borderColor: "var(--mantine-color-slate-2)",
        overflow: "hidden",
      }}
      bg="slate.0"
      p="sm"
    >
      <Box ta="center" mb="sm">
        <Avatar
          radius="md"
          size={56}
          color="brand"
          variant="light"
          mx="auto"
          mb={6}
        >
          <IconUser size={25} />
        </Avatar>

        <Text
          size="sm"
          fw={700}
          c="slate.8"
          truncate
          title={displayName}
        >
          {displayName}
        </Text>

        <Text size="xs" c="slate.5" truncate>
          {customerType}
          {customerNumber ? ` · ${customerNumber}` : ""}
        </Text>
      </Box>

      <Paper
        withBorder
        radius="md"
        p="sm"
        mb="sm"
        bg="white"
      >
        <Text
          size="10px"
          fw={700}
          tt="uppercase"
          c="slate.5"
          mb="xs"
          style={{ letterSpacing: 0.5 }}
        >
          Onboarding Progress
        </Text>

        <Group justify="space-between" mb={4} wrap="nowrap">
          <Text size="xs" c="slate.5">
            Group
          </Text>

          <Text
            size="xs"
            fw={600}
            c="slate.8"
            ta="right"
            truncate
            style={{ maxWidth: 150 }}
          >
            {activeGroupLabel}
          </Text>
        </Group>

        <Group justify="space-between" mb="xs" wrap="nowrap">
          <Text size="xs" c="slate.5">
            Step
          </Text>

          <Text
            size="xs"
            fw={600}
            c="slate.8"
            ta="right"
            truncate
            style={{ maxWidth: 150 }}
          >
            {stepInGroup} of {groupStepCount}
          </Text>
        </Group>

        <Progress
          value={overallProgress}
          size={5}
          radius="xl"
          color="brand"
        />
      </Paper>

      <Paper
        withBorder
        radius="md"
        p="sm"
        bg="white"
      >
        <Text
          size="10px"
          fw={700}
          tt="uppercase"
          c="slate.5"
          mb="sm"
          style={{ letterSpacing: 0.5 }}
        >
          Lending Snapshot
        </Text>

        <SimpleGrid
          cols={2}
          spacing="sm"
          verticalSpacing="sm"
        >
          <Box>
            <Text
              size="9px"
              tt="uppercase"
              c="slate.5"
              fw={600}
            >
              Credit Score
            </Text>

            <Text
              size="sm"
              fw={700}
              c={creditScore !== null ? "brand.7" : "slate.5"}
            >
              {creditScore ?? "—"}
            </Text>
          </Box>

          <Box>
            <Text
              size="9px"
              tt="uppercase"
              c="slate.5"
              fw={600}
              mb={2}
            >
              Risk Band
            </Text>

            {creditBand ? (
              <Badge
                size="xs"
                color="success"
                variant="light"
              >
                {creditBand}
              </Badge>
            ) : (
              <Text size="sm" fw={600} c="slate.5">
                —
              </Text>
            )}
          </Box>

          <Box>
            <Text
              size="9px"
              tt="uppercase"
              c="slate.5"
              fw={600}
            >
              Active Facilities
            </Text>

            <Text
              size="sm"
              fw={600}
              c="slate.8"
            >
              {activeFacilities ?? "—"}
            </Text>
          </Box>

          <Box>
            <Text
              size="9px"
              tt="uppercase"
              c="slate.5"
              fw={600}
            >
              Active Loans
            </Text>

            <Text
              size="sm"
              fw={600}
              c="slate.8"
            >
              0
            </Text>
          </Box>

          <Box style={{ gridColumn: "1 / -1" }}>
            <Text
              size="9px"
              tt="uppercase"
              c="slate.5"
              fw={600}
            >
              Exposure
            </Text>

            <Text
              size="sm"
              fw={600}
              c="slate.8"
            >
              K 0.00
            </Text>
          </Box>
        </SimpleGrid>

        {onViewSnapshot && (
          <Button
            fullWidth
            size="xs"
            variant="default"
            radius="sm"
            mt="sm"
            leftSection={<IconEye size={12} />}
            onClick={onViewSnapshot}
          >
            View Full Snapshot
          </Button>
        )}
      </Paper>
    </Box>
  );
}