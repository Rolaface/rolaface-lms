import {
  Box,
  Group,
  Stack,
  Text,
  Slider,
  NumberInput,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Divider,
  useMantineTheme,
} from "@mantine/core";
import {
  IconCoin,
  IconCalendarMonth,
  IconCalendarStats,
  IconPercentage,
  IconReceipt2,
  IconInfoCircle,
  IconCircleCheck,
  IconWallet,
} from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";
import { useCompanyStore } from "../../../store/companyStore";
import { getSymbol } from "../../../store/currencyStore";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const LOAN_RANGE: Record<LoanType, { min: number; max: number; step: number }> =
  {
    Personal: { min: 500, max: 8000, step: 100 },
    Business: { min: 5000, max: 50000, step: 500 },
  };

// Single source of truth for the annual rate — used in both the math
// below and the "Interest rate (p.a.)" display row, so they can never
// drift out of sync.
const ANNUAL_INTEREST_RATE = 0.24;
const FACILITY_FEE_RATE = 0.02;

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text fz="sm" fw={600} c="slate.8" span>
      {text}
      {required && (
        <Text span c="danger.6" ml={2}>
          *
        </Text>
      )}
    </Text>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<any>;
  label: string;
  value: string;
}) {
  return (
    <Group justify="space-between" py={4} wrap="nowrap">
      <Group gap={6} wrap="nowrap">
        <ThemeIcon variant="light" color="slate" size={20} radius="md">
          <Icon size={11} />
        </ThemeIcon>
        <Text fz="xs" c="slate.5">
          {label}
        </Text>
      </Group>
      <Text fz="xs" fw={700} c="slate.8">
        {value}
      </Text>
    </Group>
  );
}

export function LoanTermsStep({ form, loanType }: StepProps) {
  const theme = useMantineTheme();
  const { min, max, step } = LOAN_RANGE[loanType];
  const tenure = Number(form.values.tenureMonths) || 0;
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencySymbol = getSymbol(companyCurrency);

  const facilityFee =
    Math.round(form.values.loanAmount * FACILITY_FEE_RATE * 100) / 100;
  const totalInterest =
    Math.round(
      form.values.loanAmount * ANNUAL_INTEREST_RATE * (tenure / 12) * 100,
    ) / 100;
  const totalRepayable = form.values.loanAmount + totalInterest + facilityFee;
  const monthlyRepayment = tenure
    ? Math.round((totalRepayable / tenure) * 100) / 100
    : 0;

  const money = (n: number) => `${currencySymbol}${n.toLocaleString()}`;

  // Derived-only composition split for the summary bar — purely a display
  // of the numbers already computed above, no new business logic.
  const principalPct = totalRepayable
    ? (form.values.loanAmount / totalRepayable) * 100
    : 0;
  const interestPct = totalRepayable
    ? (totalInterest / totalRepayable) * 100
    : 0;
  const feePct = totalRepayable ? (facilityFee / totalRepayable) * 100 : 0;

  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* Loan details */}
        <Paper withBorder radius="md" p="md">
          <Group gap={6} mb="xs">
            <ThemeIcon variant="light" color="brand" size={24} radius="md">
              <IconCoin size={13} />
            </ThemeIcon>
            <Text fz="xs" fw={700} c="slate.8">
              Loan amount
            </Text>
          </Group>

          <Text
            fz={24}
            fw={800}
            c="brand.7"
            mb={4}
            style={{ letterSpacing: "-0.02em" }}
          >
            {money(form.values.loanAmount)}
          </Text>

          <Slider
            color="brand"
            min={min}
            max={max}
            step={step}
            value={form.values.loanAmount}
            onChange={(v) => form.setFieldValue("loanAmount", v)}
            label={null}
            size="sm"
            mb={4}
          />
          <Group justify="space-between" mb="sm">
            <Text fz="xxs" c="slate.4">
              {money(min)}
            </Text>
            <Text fz="xxs" c="slate.4">
              {money(max)}
            </Text>
          </Group>

          <Divider mb="sm" color="slate.1" />

          <Stack gap={8}>
            <NumberInput
              radius="md"
              label={<Label text="Enter amount" required />}
              hideControls
              min={min}
              max={max}
              thousandSeparator=","
              leftSection={
                <Text fz="xs" fw={700} c="slate.5">
                  {currencySymbol}
                </Text>
              }
              leftSectionWidth={52}
              styles={{
                input: {
                  paddingLeft: 52,
                },
              }}
              value={form.values.loanAmount === 0 ? "" : form.values.loanAmount}
              onChange={(value) => {
                if (value === "") {
                  form.setFieldValue("loanAmount", 0);
                  return;
                }

                form.setFieldValue("loanAmount", Number(value));
              }}
            />
            <NumberInput
              radius="md"
              label={<Label text="Tenure (months)" required />}
              hideControls
              min={1}
              leftSection={<IconCalendarMonth size={14} />}
              {...form.getInputProps("tenureMonths")}
            />
          </Stack>
        </Paper>

        {/* Repayment summary */}
        <Paper withBorder radius="md" p="md" bg="slate.0">
          <Group gap={6} mb={4}>
            <ThemeIcon variant="light" color="brand" size={24} radius="md">
              <IconWallet size={13} />
            </ThemeIcon>
            <Text fz="xs" fw={700} c="slate.8">
              Repayment summary
            </Text>
          </Group>

          <Stack gap={0}>
            <SummaryRow
              icon={IconCalendarStats}
              label="Monthly repayment"
              value={money(monthlyRepayment)}
            />
            <SummaryRow
              icon={IconCalendarMonth}
              label="Tenure"
              value={`${tenure} months`}
            />
            <SummaryRow
              icon={IconPercentage}
              label="Interest rate (p.a.)"
              value={`${(ANNUAL_INTEREST_RATE * 100).toFixed(2)}%`}
            />
            <SummaryRow
              icon={IconReceipt2}
              label="Facility fee"
              value={money(facilityFee)}
            />
          </Stack>

          <Paper
            radius="md"
            px="md"
            py={8}
            mt={8}
            style={{
              backgroundImage: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadowSm,
            }}
          >
            <Group justify="space-between" align="center">
              <Text fz="xs" fw={600} c="brand.0">
                Total repayable
              </Text>
              <Text fz="lg" fw={800} c="white">
                {money(totalRepayable)}
              </Text>
            </Group>
          </Paper>

          {/* Composition bar — visual breakdown of principal / interest / fee */}
          <Box mt={8}>
            <Group
              gap={2}
              h={6}
              style={{ borderRadius: 999, overflow: "hidden" }}
            >
              <Box
                style={{ width: `${principalPct}%`, height: "100%" }}
                bg="brand.5"
              />
              <Box
                style={{ width: `${interestPct}%`, height: "100%" }}
                bg="gold.5"
              />
              <Box
                style={{ width: `${feePct}%`, height: "100%" }}
                bg="slate.4"
              />
            </Group>
            <Group gap="sm" mt={4}>
              <Group gap={4}>
                <Box w={6} h={6} style={{ borderRadius: 999 }} bg="brand.5" />
                <Text fz="xxs" c="slate.5">
                  Principal
                </Text>
              </Group>
              <Group gap={4}>
                <Box w={6} h={6} style={{ borderRadius: 999 }} bg="gold.5" />
                <Text fz="xxs" c="slate.5">
                  Interest
                </Text>
              </Group>
              <Group gap={4}>
                <Box w={6} h={6} style={{ borderRadius: 999 }} bg="slate.4" />
                <Text fz="xxs" c="slate.5">
                  Fee
                </Text>
              </Group>
            </Group>
          </Box>

          <Group gap={6} mt={8}></Group>
        </Paper>
      </SimpleGrid>

      <Paper
        withBorder
        radius="md"
        p="sm"
        bg="info.0"
        style={{ borderColor: "var(--mantine-color-info-2)" }}
      >
        <Group gap={8} align="flex-start" wrap="nowrap">
          <ThemeIcon variant="light" color="info" size={22} radius="md">
            <IconInfoCircle size={13} />
          </ThemeIcon>
          <Box>
            <Text fz="xs" fw={700} c="info.8">
              Important
            </Text>
            <Text fz="xxs" c="info.7">
              The final repayment amount may vary based on applicable charges
              and fees.
            </Text>
          </Box>
        </Group>
      </Paper>
    </Stack>
  );
}
