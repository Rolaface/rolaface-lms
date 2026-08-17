import { Select, Switch, Text, Group, Divider, Box } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { PlainCard } from "../../../shared/customer/Shared";

interface BorrowerStepProps {
  convertToBorrower: boolean;
  setConvertToBorrower: (v: boolean) => void;
  borrowerCategory: string | null;
  setBorrowerCategory: (v: string | null) => void;
  loanPurpose: string | null;
  setLoanPurpose: (v: string | null) => void;
  intendedLoanProduct: string | null;
  setIntendedLoanProduct: (v: string | null) => void;
  preliminaryRiskRating: string | null;
  setPreliminaryRiskRating: (v: string | null) => void;
  branch: string | null;
  setBranch: (v: string | null) => void;
  creditOfficer: string | null;
  setCreditOfficer: (v: string | null) => void;
  relationshipManager: string | null;
  setRelationshipManager: (v: string | null) => void;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

/**
 * Horizontal, wrapping field row.
 * Every field below has a FIXED, content-driven width — sized to comfortably
 * fit its full label AND its longest possible value, with no shrinking.
 * Truncation is not allowed here, so a field can never be squeezed smaller
 * than what its own content needs; when the container can't fit everyone on
 * one line, the row wraps to a second line (4/3, 3/2, etc.) instead of
 * cutting anything off.
 */
function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Small-screen stacking: below 480px each field takes the full row. */}
      <style>{`
        @media (max-width: 480px) {
          .borrower-field-row > * {
            flex-basis: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
      <Box
        className="borrower-field-row"
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

/**
 * width = fixed, content-driven size for this field: enough room for its
 * full label AND its longest possible option, so nothing ever needs to
 * truncate. flex: `0 0 <width>px` means it never shrinks (no truncation
 * risk) and never grows (keeps the row from looking uneven) — it just
 * wraps to the next line as a whole field if the row runs out of room.
 */
interface FullWidthSelectProps {
  width: number;
  label: string;
  placeholder: string;
  data: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  withAsterisk?: boolean;
}

function FullWidthSelect({
  width,
  label,
  placeholder,
  data,
  value,
  onChange,
  withAsterisk,
}: FullWidthSelectProps) {
  return (
    <Box style={{ flex: `0 0 ${width}px`, width }}>
      <Select
        style={{ width: "100%" }}
        size="sm"
        radius="md"
        searchable
        rightSection={chevron}
        label={label}
        placeholder={placeholder}
        withAsterisk={withAsterisk}
        data={data}
        value={value}
        onChange={onChange}
        comboboxProps={{ width: 300, position: "bottom-start" }}
        styles={{
          label: {
            fontSize: "var(--mantine-font-size-xs)",
            fontWeight: 600,
            color: "var(--mantine-color-slate-6)",
            whiteSpace: "nowrap",
            marginBottom: 4,
          },
          input: {
            height: 38,
            // no overflow/ellipsis — full value always shown, field is sized
            // to fit it up front
          },
        }}
      />
    </Box>
  );
}

export function BorrowerStep(props: BorrowerStepProps) {
  const {
    convertToBorrower,
    setConvertToBorrower,
    borrowerCategory,
    setBorrowerCategory,
    loanPurpose,
    setLoanPurpose,
    intendedLoanProduct,
    setIntendedLoanProduct,
    preliminaryRiskRating,
    setPreliminaryRiskRating,
    branch,
    setBranch,
    creditOfficer,
    setCreditOfficer,
    relationshipManager,
    setRelationshipManager,
  } = props;

  return (
    <PlainCard dense>
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={700} c="slate.8">
          Convert to Borrower
        </Text>
        <Switch
          checked={convertToBorrower}
          onChange={(e) => setConvertToBorrower(e.currentTarget.checked)}
          color="brand"
        />
      </Group>

      {convertToBorrower && (
        <>
          <Divider mt={4} mb="sm" color="slate.2" />

          <FieldRow>
            {/* label "Borrower Category" / longest value "Individual Borrower" */}
            <FullWidthSelect
              width={185}
              label="Borrower Category"
              placeholder="Select"
              withAsterisk
              data={[
                "Individual Borrower",
                "Joint Borrower",
                "Business Borrower",
                "Group Borrower",
              ]}
              value={borrowerCategory}
              onChange={setBorrowerCategory}
            />
            {/* longest value "Working Capital" */}
            <FullWidthSelect
              width={160}
              label="Loan Purpose"
              placeholder="Select"
              withAsterisk
              data={[
                "Agriculture",
                "Working Capital",
                "Asset Finance",
                "Housing",
                "Education",
                "Other",
              ]}
              value={loanPurpose}
              onChange={setLoanPurpose}
            />
            {/* label "Intended Loan Product" / longest value "SME Working Capital" */}
            <FullWidthSelect
              width={190}
              label="Intended Loan Product"
              placeholder="Select"
              data={[
                "Salary Advance",
                "Farmer Input Loan",
                "SME Working Capital",
                "Asset Finance",
              ]}
              value={intendedLoanProduct}
              onChange={setIntendedLoanProduct}
            />
            {/* longest value "Cairo Road, Lusaka" / "Livingstone Branch" */}
            <FullWidthSelect
              width={175}
              label="Branch"
              placeholder="Select"
              withAsterisk
              data={[
                "Cairo Road, Lusaka",
                "Kitwe Branch",
                "Ndola Branch",
                "Livingstone Branch",
              ]}
              value={branch}
              onChange={setBranch}
            />
            {/* label "Credit Officer" is the long part here */}
            <FullWidthSelect
              width={145}
              label="Credit Officer"
              placeholder="Unassigned"
              data={["M. Banda", "C. Phiri", "T. Mwansa"]}
              value={creditOfficer}
              onChange={setCreditOfficer}
            />
            {/* label "Preliminary Risk Rating" is long even though values are short */}
            <FullWidthSelect
              width={190}
              label="Preliminary Risk Rating"
              placeholder="Not yet rated"
              data={["Low", "Medium", "High"]}
              value={preliminaryRiskRating}
              onChange={setPreliminaryRiskRating}
            />
            {/* label "Relationship Manager" is the long part here */}
            <FullWidthSelect
              width={175}
              label="Relationship Manager"
              placeholder="Unassigned"
              data={["K. Zulu", "N. Tembo"]}
              value={relationshipManager}
              onChange={setRelationshipManager}
            />
          </FieldRow>
        </>
      )}
    </PlainCard>
  );
}