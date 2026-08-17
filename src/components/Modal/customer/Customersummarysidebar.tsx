import { Box, Text, Avatar, Paper, Group, Progress, Badge } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

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
}

// NOTE: Active Loans / Exposure / Risk Level / Estimated EMI have no
// backing state anywhere in the app today (unlike LoanSummarySidebarTab,
// which computes real EMI from form values). These render as static
// placeholders for now — same pattern already used for the mock KYC
// statuses in KycStep. Wire real values here later without touching
// CustomerModal.
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
}: CustomerSummarySidebarProps) {
  const displayName = customerName.trim() || "New Customer";
  const overallProgress =
    overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <Box
      w={260}
      style={{ flexShrink: 0, borderLeft: "1px solid var(--mantine-color-slate-2)" }}
      bg="slate.0"
      p="md"
    >
      <Box ta="center" mb="md">
        <Avatar radius="md" size={64} color="brand" variant="light" mx="auto" mb="xs">
          <IconUser size={28} />
        </Avatar>
        <Text size="sm" fw={700} c="slate.8" truncate>
          {displayName}
        </Text>
        <Text size="xs" c="slate.5">
          {customerType}
          {customerNumber ? ` \u00b7 ${customerNumber}` : ""}
        </Text>
      </Box>

      <Paper withBorder radius="md" p="sm" mb="sm" bg="white">
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
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="slate.5">
            Group
          </Text>
          <Text size="xs" fw={600} c="slate.8">
            {activeGroupLabel}
          </Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="slate.5">
            Step
          </Text>
          <Text size="xs" fw={600} c="slate.8">
            {stepInGroup} of {groupStepCount} ({currentStepLabel})
          </Text>
        </Group>
        <Progress value={overallProgress} size="sm" radius="xl" color="brand" />
      </Paper>

      <Paper withBorder radius="md" p="sm" mb="sm" bg="white">
        <Text
          size="10px"
          fw={700}
          tt="uppercase"
          c="slate.5"
          mb="xs"
          style={{ letterSpacing: 0.5 }}
        >
          Lending Snapshot
        </Text>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="slate.5">
            Active Loans
          </Text>
          <Text size="xs" fw={600} c="slate.8">
            0
          </Text>
        </Group>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="slate.5">
            Exposure
          </Text>
          <Text size="xs" fw={600} c="slate.8">
            K 0.00
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="xs" c="slate.5">
            Risk Level
          </Text>
          <Badge size="xs" color="success" variant="light">
            LOW
          </Badge>
        </Group>
      </Paper>

      <Paper radius="md" p="sm" style={{ background: "var(--mantine-color-brand-6)" }}>
        <Text size="10px" fw={700} tt="uppercase" c="brand.1" style={{ letterSpacing: 0.5 }}>
          Estimated EMI
        </Text>
        <Text size="lg" fw={700} c="white" mt={4}>
          &mdash;
        </Text>
      </Paper>
    </Box>
  );
}