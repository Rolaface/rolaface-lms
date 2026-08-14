import { Box, Group, Text, Slider, NumberInput, Button, SimpleGrid } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";
import { useCompanyStore } from "../../../store/companyStore";
import { getSymbol } from "../../../store/currencyStore";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const LOAN_RANGE: Record<LoanType, { min: number; max: number; step: number }> = {
  Personal: { min: 500, max: 8000, step: 100 },
  Business: { min: 5000, max: 50000, step: 500 },
};

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Group justify="space-between" py={6}>
      <Text fz="sm" c="slate.5">
        {label}
      </Text>
      <Text fz="sm" fw={bold ? 700 : 600} c="slate.8">
        {value}
      </Text>
    </Group>
  );
}

export function LoanTermsStep({ form, loanType }: StepProps) {
  const { min, max, step } = LOAN_RANGE[loanType];
  const tenure = Number(form.values.tenureMonths) || 0;
 const companyCurrency = useCompanyStore((state) => state.baseCurrency);
      const currencySymbol = getSymbol(companyCurrency);
  const facilityFee = Math.round(form.values.loanAmount * 0.02 * 100) / 100;
  const totalInterest = Math.round(form.values.loanAmount * 0.24 * (tenure / 12) * 100) / 100;
  const totalRepayable = form.values.loanAmount + totalInterest + facilityFee;
  const monthlyRepayment = tenure ? Math.round((totalRepayable / tenure) * 100) / 100 : 0;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
      <Box className="border border-slate-200 rounded-lg p-5">
        <Text fz="sm" fw={600} c="slate.5" mb={4}>
          Loan amount
        </Text>
        <Text fz={32} fw={800} c="slate.9" mb="sm">
          {currencySymbol}{form.values.loanAmount.toLocaleString()}
        </Text>
        <Slider
          color="dark"
          min={min}
          max={max}
          step={step}
          value={form.values.loanAmount}
          onChange={(v) => form.setFieldValue("loanAmount", v)}
          label={null}
          mb="xs"
        />
        <Group justify="space-between" mb="md">
          <Text fz="xs" c="slate.4">
            K{min.toLocaleString()}
          </Text>
          <Text fz="xs" c="slate.4">
            K{max.toLocaleString()}
          </Text>
        </Group>

        <NumberInput
          radius="md"
          label={<Label text="Enter amount" required />}
          hideControls
          min={min}
          max={max}
          thousandSeparator=","
          value={form.values.loanAmount}
          onChange={(v) => form.setFieldValue("loanAmount", Number(v) || 0)}
          mb="sm"
        />
        <NumberInput
          radius="md"
          label={<Label text="Tenure (months)" required />}
          hideControls
          min={1}
          {...form.getInputProps("tenureMonths")}
        />
      </Box>

      <Box className="border border-slate-200 rounded-lg p-5 bg-slate-50">
        <Text fz="sm" fw={700} c="slate.8" mb="sm">
          Repayment summary
        </Text>
        <SummaryRow label="Loan amount" value={`${currencySymbol}${form.values.loanAmount.toLocaleString()}`} />
        <SummaryRow label="Tenure" value={`${tenure} months`} />
        <SummaryRow label="Monthly repayment" value={`${currencySymbol}${monthlyRepayment.toLocaleString()}`} />
        <SummaryRow label="Facility fee" value={`K${facilityFee.toLocaleString()}`} />

        <Box className="bg-white border border-slate-200 rounded-md px-3 py-2 mt-2">
          <SummaryRow label="Total repayable" value={`${currencySymbol}${totalRepayable.toLocaleString()}`} bold />
        </Box>
      </Box>
    </SimpleGrid>
  );
}