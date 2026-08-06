import { Select, NumberInput, Box } from "@mantine/core";
import { IconChevronDown, IconChartLine } from "@tabler/icons-react";
import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";

interface FinancialStepProps {
  educationLevel: string | null;
  setEducationLevel: (v: string | null) => void;
  employmentType: string | null;
  setEmploymentType: (v: string | null) => void;
  sourceOfIncome: string | null;
  setSourceOfIncome: (v: string | null) => void;
  monthlyIncome: number | "";
  setMonthlyIncome: (v: number | "") => void;
  annualIncome: number | "";
  setAnnualIncome: (v: number | "") => void;
  creditRiskCategory: string | null;
  setCreditRiskCategory: (v: string | null) => void;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

function FieldRow({
  columns,
  children,
}: {
  columns: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: "var(--mantine-spacing-md)",
        marginBottom: "var(--mantine-spacing-sm)",
      }}
    >
      {children}
    </Box>
  );
}

export function FinancialStep(props: FinancialStepProps) {
  const {
    educationLevel,
    setEducationLevel,
    employmentType,
    setEmploymentType,
    sourceOfIncome,
    setSourceOfIncome,
    monthlyIncome,
    setMonthlyIncome,
    annualIncome,
    setAnnualIncome,
    creditRiskCategory,
    setCreditRiskCategory,
  } = props;

  return (
    <PlainCard>
      <SectionHeader
        icon={IconChartLine}
        title="Financial profile"
        badge="OPTIONAL"
        description="Employment, income and credit background used to gauge affordability"
        accent="accent"
      />

  
      <FieldRow columns="1fr 1.3fr 1fr 1.2fr">
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Education Level"
          placeholder="Select"
          data={["Primary", "Secondary", "Tertiary", "Postgraduate"]}
          value={educationLevel}
          onChange={setEducationLevel}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Employment Type"
          placeholder="Select"
          data={[
            "Formally Employed",
            "Self-Employed",
            "Informal",
            "Unemployed",
            "Retired",
          ]}
          value={employmentType}
          onChange={setEmploymentType}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Source of Income"
          placeholder="Select"
          data={["Salary", "Business", "Farming", "Pension", "Other"]}
          value={sourceOfIncome}
          onChange={setSourceOfIncome}
        />
        <NumberInput
          radius="md"
          label="Monthly Income (ZMW)"
          placeholder="e.g. 12,500"
          thousandSeparator=","
          value={monthlyIncome}
          onChange={(v) => setMonthlyIncome(v as number | "")}
        />
      </FieldRow>

      <FieldRow columns="1fr 1.3fr 1fr 1.2fr">
        <NumberInput
          radius="md"
          label="Annual Income (ZMW)"
          placeholder="e.g. 150,000"
          thousandSeparator=","
          value={annualIncome}
          onChange={(v) => setAnnualIncome(v as number | "")}
        />
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Credit Risk Category"
          placeholder="Not yet assessed"
          data={["Low", "Medium", "High"]}
          value={creditRiskCategory}
          onChange={setCreditRiskCategory}
        />
        <Box />
        <Box />
      </FieldRow>
    </PlainCard>
  );
}