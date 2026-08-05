import { Grid, TextInput, Select, NumberInput } from "@mantine/core";
import { IconChevronDown, IconChartLine } from "@tabler/icons-react";
import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";
import { W } from "../../../../components/constants/customer/constants";

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
  <IconChevronDown size={13} color="var(--mantine-color-gray-5)" />
);

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
      <Grid gap="md" align="flex-end">
        <Grid.Col span={W.sm}>
          <Select
            searchable
            rightSection={chevron}
            label="Education Level"
            placeholder="Select"
            data={["Primary", "Secondary", "Tertiary", "Postgraduate"]}
            value={educationLevel}
            onChange={setEducationLevel}
          />
        </Grid.Col>
        <Grid.Col span={W.md}>
          <Select
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
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <Select
            searchable
            rightSection={chevron}
            label="Source of Income"
            placeholder="Select"
            data={["Salary", "Business", "Farming", "Pension", "Other"]}
            value={sourceOfIncome}
            onChange={setSourceOfIncome}
          />
        </Grid.Col>
        <Grid.Col span={W.md}>
          <NumberInput
            label="Monthly Income (ZMW)"
            placeholder="e.g. 12,500"
            thousandSeparator=","
            value={monthlyIncome}
            onChange={(v) => setMonthlyIncome(v as number | "")}
          />
        </Grid.Col>
        <Grid.Col span={W.md}>
          <NumberInput
            label="Annual Income (ZMW)"
            placeholder="e.g. 150,000"
            thousandSeparator=","
            value={annualIncome}
            onChange={(v) => setAnnualIncome(v as number | "")}
          />
        </Grid.Col>
        <Grid.Col span={W.sm}>
          <Select
            searchable
            rightSection={chevron}
            label="Credit Risk Category"
            placeholder="Not yet assessed"
            data={["Low", "Medium", "High"]}
            value={creditRiskCategory}
            onChange={setCreditRiskCategory}
          />
        </Grid.Col>
      </Grid>
    </PlainCard>
  );
}
