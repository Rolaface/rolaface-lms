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

// Shared label/input styling so Select and NumberInput read as one family —
// consistent height, label typography, and radius across every field.
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

/**
 * Horizontal, wrapping field row.
 * Every field below has a FIXED, content-driven width — sized to comfortably
 * fit its full label AND its longest realistic value, with no shrinking.
 * Nothing truncates: when the container can't fit every field on one line,
 * the row wraps a whole field to the next line instead of cutting anything.
 */
function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Small-screen stacking: below 480px each field takes the full row. */}
      <style>{`
        @media (max-width: 480px) {
          .financial-field-row > * {
            flex-basis: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
      <Box
        className="financial-field-row"
        style={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: 16,
          rowGap: "var(--mantine-spacing-sm)",
        }}
      >
        {children}
      </Box>
    </>
  );
}

// width = fixed content-driven size (fits full label + longest value).
// flex: 0 0 <width>px — never shrinks (no truncation), never grows.
function FieldSlot({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <Box style={{ flex: `0 0 ${width}px`, width }}>{children}</Box>
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
    <PlainCard dense>
      <SectionHeader
        icon={IconChartLine}
        title="Financial profile"
        badge="OPTIONAL"
        accent="accent"
        dense
      />

      <FieldRow>
        {/* label "Education Level" is the long part; values are short */}
        <FieldSlot width={165}>
          <Select
            style={{ width: "100%" }}
            radius="md"
            searchable
            rightSection={chevron}
            label="Education Level"
            placeholder="Select"
            data={["Primary", "Secondary", "Tertiary", "Postgraduate"]}
            value={educationLevel}
            onChange={setEducationLevel}
            comboboxProps={{ width: 280, position: "bottom-start" }}
            styles={fieldStyles}
          />
        </FieldSlot>

        {/* longest value "Formally Employed" drives this width */}
        <FieldSlot width={190}>
          <Select
            style={{ width: "100%" }}
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
            comboboxProps={{ width: 280, position: "bottom-start" }}
            styles={fieldStyles}
          />
        </FieldSlot>

        {/* label "Source of Income" is the long part; values are short */}
        <FieldSlot width={160}>
          <Select
            style={{ width: "100%" }}
            radius="md"
            searchable
            rightSection={chevron}
            label="Source of Income"
            placeholder="Select"
            data={["Salary", "Business", "Farming", "Pension", "Other"]}
            value={sourceOfIncome}
            onChange={setSourceOfIncome}
            comboboxProps={{ width: 280, position: "bottom-start" }}
            styles={fieldStyles}
          />
        </FieldSlot>

        {/* label "Monthly Income (ZMW)" sizes this — value itself is short */}
        <FieldSlot width={178}>
          <NumberInput
            style={{ width: "100%" }}
            radius="md"
            label="Monthly Income (ZMW)"
            placeholder="e.g. 12,500"
            thousandSeparator=","
            value={monthlyIncome}
            onChange={(v) => setMonthlyIncome(v as number | "")}
            styles={fieldStyles}
          />
        </FieldSlot>

        {/* label "Annual Income (ZMW)" sizes this — value itself is short */}
        <FieldSlot width={172}>
          <NumberInput
            style={{ width: "100%" }}
            radius="md"
            label="Annual Income (ZMW)"
            placeholder="e.g. 150,000"
            thousandSeparator=","
            value={annualIncome}
            onChange={(v) => setAnnualIncome(v as number | "")}
            styles={fieldStyles}
          />
        </FieldSlot>

        {/* label "Credit Risk Category" is the long part; values are short */}
        <FieldSlot width={185}>
          <Select
            style={{ width: "100%" }}
            radius="md"
            searchable
            rightSection={chevron}
            label="Credit Risk Category"
            placeholder="Not yet assessed"
            data={["Low", "Medium", "High"]}
            value={creditRiskCategory}
            onChange={setCreditRiskCategory}
            comboboxProps={{ width: 280, position: "bottom-start" }}
            styles={fieldStyles}
          />
        </FieldSlot>
      </FieldRow>
    </PlainCard>
  );
}