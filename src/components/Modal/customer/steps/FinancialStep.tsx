import { Select, NumberInput, Box, TextInput } from "@mantine/core";
import { IconChevronDown, IconChartLine } from "@tabler/icons-react";
import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";

interface FinancialStepProps {
  customerType: string;
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
  totalAssets: number | "";
  setTotalAssets: (v: number | "") => void;
  totalLiabilities: number | "";
  setTotalLiabilities: (v: number | "") => void;
  existingMonthlyObligations: number | "";
  setExistingMonthlyObligations: (v: number | "") => void;
  relationshipManager: string | null;
  setRelationshipManager: (v: string | null) => void;
  industryType: string | null;
  setIndustryType: (v: string | null) => void;
  employerName: string;
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
    customerType,
    educationLevel, setEducationLevel,
    employmentType, setEmploymentType,
    sourceOfIncome, setSourceOfIncome,
    monthlyIncome, setMonthlyIncome,
    annualIncome, setAnnualIncome,
    totalAssets, setTotalAssets,
    totalLiabilities, setTotalLiabilities,
    existingMonthlyObligations, setExistingMonthlyObligations,
    relationshipManager, setRelationshipManager,
    industryType, setIndustryType,
    employerName,
  } = props;

  const isBusiness = customerType === "Business";

  const netWorth =
    totalAssets !== "" && totalLiabilities !== ""
      ? totalAssets - totalLiabilities
      : "";

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
          gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))",
          columnGap: 16,
          rowGap: 16,
          alignItems: "start",
        }}
      >
        {/* Individual-only fields — Education / Employment / Industry /
            Employer aren't meaningful for a Business customer, and
            Industry + Annual Revenue for businesses already live on the
            Identity step's Business Information card, so we don't
            duplicate them here. */}
        {!isBusiness && (
          <>
            <Select
              radius="md" searchable rightSection={chevron}
              label="Education Level" placeholder="Select"
              data={["Primary", "Secondary", "Tertiary", "Postgraduate"]}
              value={educationLevel} onChange={setEducationLevel}
              comboboxProps={{ width: 280, position: "bottom-start" }}
              styles={fieldStyles}
            />
            <Select
              radius="md" searchable rightSection={chevron}
              label="Employment Type" placeholder="Select"
              data={["Formally Employed", "Self-Employed", "Informal", "Unemployed", "Retired"]}
              value={employmentType} onChange={setEmploymentType}
              comboboxProps={{ width: 280, position: "bottom-start" }}
              styles={fieldStyles}
            />
            <Select
              radius="md" searchable rightSection={chevron}
              label="Industry Type" placeholder="Select Industry Type"
              data={["Agriculture", "Construction", "Education", "Finance", "Healthcare", "Hospitality", "Information Technology", "Manufacturing", "Retail", "Transportation", "Other"]}
              value={industryType} onChange={setIndustryType}
              comboboxProps={{ width: 280, position: "bottom-start" }}
              styles={fieldStyles}
            />
            <TextInput
              radius="md"
              label="Employer Name"
              placeholder="e.g. ABC Ltd"
              value={employerName}
              styles={fieldStyles}
            />
          </>
        )}

        <Select
          radius="md" searchable rightSection={chevron}
          label="Source of Income" placeholder="Select"
          data={["Salary", "Business", "Farming", "Pension", "Other"]}
          value={sourceOfIncome} onChange={setSourceOfIncome}
          comboboxProps={{ width: 280, position: "bottom-start" }}
          styles={fieldStyles}
        />

        {/* Annual Income is an individual-only figure — for Business,
            Annual Revenue already covers this on the Identity step. */}
        {!isBusiness && (
          <>
            <NumberInput
              radius="md" hideControls
              label="Monthly Income" placeholder="e.g. 12,500" thousandSeparator=","
              value={monthlyIncome} onChange={(v) => setMonthlyIncome(v as number | "")}
              styles={fieldStyles}
            />
            <NumberInput
              radius="md" hideControls
              label="Annual Income" placeholder="e.g. 150,000" thousandSeparator=","
              value={annualIncome} onChange={(v) => setAnnualIncome(v as number | "")}
              styles={fieldStyles}
            />
          </>
        )}

        <NumberInput
          radius="md" hideControls
          label="Total Assets" placeholder="e.g. 250,000" thousandSeparator=","
          value={totalAssets} onChange={(v) => setTotalAssets(v as number | "")}
          styles={fieldStyles}
        />
        <NumberInput
          radius="md" hideControls
          label="Total Liabilities" placeholder="e.g. 80,000" thousandSeparator=","
          value={totalLiabilities} onChange={(v) => setTotalLiabilities(v as number | "")}
          styles={fieldStyles}
        />
        <NumberInput
          radius="md" hideControls disabled
          label="Net Worth" placeholder="Auto-calculated" thousandSeparator=","
          value={netWorth}
          styles={fieldStyles}
        />
        <NumberInput
          radius="md" hideControls
          label="Existing Monthly Obligations" placeholder="e.g. 3,000" thousandSeparator=","
          value={existingMonthlyObligations}
          onChange={(v) => setExistingMonthlyObligations(v as number | "")}
          styles={fieldStyles}
        />
        {/* <Select
          radius="md" searchable rightSection={chevron}
          label="Relationship Manager" placeholder="Unassigned"
          data={["K. Zulu", "N. Tembo"]}
          value={relationshipManager} onChange={setRelationshipManager}
          comboboxProps={{ width: 280, position: "bottom-start" }}
          styles={fieldStyles}
        /> */}
      </Box>
    </PlainCard>
  );
}