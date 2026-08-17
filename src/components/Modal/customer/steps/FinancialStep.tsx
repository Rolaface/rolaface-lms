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
  relationshipManager: string | null;
  setRelationshipManager: (v: string | null) => void;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

const fieldStyles = {
  label: {
    fontSize: "var(--mantine-font-size-xs)",
    fontWeight: 600,
    color: "var(--mantine-color-slate-6)",
    whiteSpace: "nowrap" as const,
    marginBottom: 4,
  },
  input: {
    height: 38,
  },
};

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
    relationshipManager,
    setRelationshipManager,
  } = props;

  return (
    <PlainCard dense>
      <SectionHeader
        icon={IconChartLine}
        title="Financial profile"
        badge="OPTIONAL"
        accent="accent"
        dense
      />

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "165px 190px 160px 178px 172px",
          columnGap: 16,
          rowGap: 16,
          alignItems: "start",
        }}
      >
        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Education Level"
          placeholder="Select"
          data={["Primary", "Secondary", "Tertiary", "Postgraduate"]}
          value={educationLevel}
          onChange={setEducationLevel}
          comboboxProps={{
            width: 280,
            position: "bottom-start",
          }}
          styles={fieldStyles}
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
          comboboxProps={{
            width: 280,
            position: "bottom-start",
          }}
          styles={fieldStyles}
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
          comboboxProps={{
            width: 280,
            position: "bottom-start",
          }}
          styles={fieldStyles}
        />

        <NumberInput
          radius="md"
          hideControls
          label="Monthly Income"
          placeholder="e.g. 12,500"
          thousandSeparator=","
          value={monthlyIncome}
          onChange={(v) => setMonthlyIncome(v as number | "")}
          styles={fieldStyles}
        />

        <NumberInput
          radius="md"
          hideControls
          label="Annual Income"
          placeholder="e.g. 150,000"
          thousandSeparator=","
          value={annualIncome}
          onChange={(v) => setAnnualIncome(v as number | "")}
          styles={fieldStyles}
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
          comboboxProps={{
            width: 280,
            position: "bottom-start",
          }}
          styles={fieldStyles}
        />

        <Select
          radius="md"
          searchable
          rightSection={chevron}
          label="Relationship Manager"
          placeholder="Unassigned"
          data={["K. Zulu", "N. Tembo"]}
          value={relationshipManager}
          onChange={setRelationshipManager}
          comboboxProps={{
            width: 280,
            position: "bottom-start",
          }}
          styles={fieldStyles}
        />
      </Box>
    </PlainCard>
  );
}
