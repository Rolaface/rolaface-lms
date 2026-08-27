import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconCalculator } from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../../components/shared/customer/Shared";

interface EligibilitySummaryProps {
  monthlyIncome: number | "";
  existingMonthlyObligations: number | "";
  bureauMonthlyObligations?: number;
  loanTenureMonths: number | "";
}

const DTI_CAP = 0.4; // provisional affordability threshold — no backend rule exists yet

export function EligibilitySummary({
  monthlyIncome, existingMonthlyObligations, bureauMonthlyObligations, loanTenureMonths,
}: EligibilitySummaryProps) {
  const income = monthlyIncome === "" ? null : monthlyIncome;
  const obligations = (existingMonthlyObligations === "" ? 0 : existingMonthlyObligations) + (bureauMonthlyObligations ?? 0);

  const dti = income ? obligations / income : null;
  const affordableInstallment = income ? Math.max(0, income * DTI_CAP - obligations) : null;
  const tenure = loanTenureMonths === "" ? 12 : loanTenureMonths;
  const eligibleAmount = affordableInstallment !== null ? affordableInstallment * tenure : null;

  const status =
    income === null ? "Insufficient Data" : dti !== null && dti <= DTI_CAP ? "Eligible" : "Review Required";
  const statusColor = status === "Eligible" ? "success" : status === "Review Required" ? "warning" : "slate";

  return (
    <PlainCard dense>
      <Group justify="space-between" align="center" mb="xs">
        <SectionHeader icon={IconCalculator} title="Eligibility summary" badge="CALCULATED · PROVISIONAL" accent="accent" dense stepNumber={5} />
        <Badge color={statusColor} variant="light" radius="sm">{status}</Badge>
      </Group>

      <SimpleGrid cols={3} spacing="md">
        <Stack gap={0}>
          <Text size="xs" c="slate.5">Eligible Amount</Text>
          <Text size="sm" fw={700} c="slate.8">
            {eligibleAmount !== null ? eligibleAmount.toLocaleString() : "—"}
          </Text>
        </Stack>
        <Stack gap={0}>
          <Text size="xs" c="slate.5">DTI</Text>
          <Text size="sm" fw={700} c="slate.8">
            {dti !== null ? `${(dti * 100).toFixed(1)}%` : "—"}
          </Text>
        </Stack>
        <Stack gap={0}>
          <Text size="xs" c="slate.5">Status</Text>
          <Text size="sm" fw={700} c="slate.8">{status}</Text>
        </Stack>
      </SimpleGrid>

      <Text size="xs" c="slate.4" mt="xs">
        Provisional estimate — assumes {DTI_CAP * 100}% affordability threshold. No eligibility API is connected yet; replace this calculation once one exists.
      </Text>
    </PlainCard>
  );
}