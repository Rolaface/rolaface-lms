import { Select, Switch, Text, Group, Divider, Box, NumberInput } from "@mantine/core";
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
  loanAmountRequested: number | "";
  setLoanAmountRequested: (v: number | "") => void;
  loanTenureMonths: number | "";
  setLoanTenureMonths: (v: number | "") => void;
  repaymentFrequency: string | null;
  setRepaymentFrequency: (v: string | null) => void;
  preliminaryRiskRating: string | null;
  setPreliminaryRiskRating: (v: string | null) => void;
  branch: string | null;
  setBranch: (v: string | null) => void;
  creditOfficer: string | null;
  setCreditOfficer: (v: string | null) => void;
}

const chevron = <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />;

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .borrower-field-row > * { flex-basis: 100% !important; width: 100% !important; }
        }
      `}</style>
      <Box className="borrower-field-row" style={{ display: "flex", flexWrap: "wrap", columnGap: 16, rowGap: "var(--mantine-spacing-sm)" }}>
        {children}
      </Box>
    </>
  );
}

interface FullWidthFieldProps {
  width: number;
  label: string;
  withAsterisk?: boolean;
}

function FullWidthSelect({
  width, label, placeholder, data, value, onChange, withAsterisk,
}: FullWidthFieldProps & { placeholder: string; data: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <Box style={{ flex: `0 0 ${width}px`, width }}>
      <Select
        style={{ width: "100%" }} size="sm" radius="md" searchable rightSection={chevron}
        label={label} placeholder={placeholder} withAsterisk={withAsterisk}
        data={data} value={value} onChange={onChange}
        comboboxProps={{ width: 300, position: "bottom-start" }}
        styles={{
          label: { fontSize: "var(--mantine-font-size-xs)", fontWeight: 600, color: "var(--mantine-color-slate-6)", whiteSpace: "nowrap", marginBottom: 4 },
          input: { height: 38 },
        }}
      />
    </Box>
  );
}

function FullWidthNumber({
  width, label, placeholder, value, onChange, withAsterisk,
}: FullWidthFieldProps & { placeholder: string; value: number | ""; onChange: (v: number | "") => void }) {
  return (
    <Box style={{ flex: `0 0 ${width}px`, width }}>
      <NumberInput
        style={{ width: "100%" }} size="sm" radius="md" hideControls thousandSeparator=","
        label={label} placeholder={placeholder} withAsterisk={withAsterisk}
        value={value} onChange={(v) => onChange(v as number | "")}
        styles={{
          label: { fontSize: "var(--mantine-font-size-xs)", fontWeight: 600, color: "var(--mantine-color-slate-6)", whiteSpace: "nowrap", marginBottom: 4 },
          input: { height: 38 },
        }}
      />
    </Box>
  );
}

export function BorrowerStep(props: BorrowerStepProps) {
  const {
    convertToBorrower, setConvertToBorrower,
    borrowerCategory, setBorrowerCategory,
    loanPurpose, setLoanPurpose,
    intendedLoanProduct, setIntendedLoanProduct,
    loanAmountRequested, setLoanAmountRequested,
    loanTenureMonths, setLoanTenureMonths,
    repaymentFrequency, setRepaymentFrequency,
    preliminaryRiskRating, setPreliminaryRiskRating,
    branch, setBranch,
    creditOfficer, setCreditOfficer,
  } = props;

  return (
    <PlainCard dense>
      <Group justify="space-between" mb={6}>
        <Text size="sm" fw={700} c="slate.8">Loan Requirement</Text>
        <Group gap={8}>
          <Text size="xs" c="slate.5">Convert to Borrower</Text>
          <Switch checked={convertToBorrower} onChange={(e) => setConvertToBorrower(e.currentTarget.checked)} color="brand" />
        </Group>
      </Group>

      {convertToBorrower && (
        <>
          <Divider mt={4} mb="sm" color="slate.2" />
          <FieldRow>
            <FullWidthSelect width={185} label="Borrower Category" placeholder="Select" withAsterisk
              data={["Individual Borrower", "Joint Borrower", "Business Borrower", "Group Borrower"]}
              value={borrowerCategory} onChange={setBorrowerCategory} />
            <FullWidthSelect width={160} label="Loan Purpose" placeholder="Select" withAsterisk
              data={["Agriculture", "Working Capital", "Asset Finance", "Housing", "Education", "Other"]}
              value={loanPurpose} onChange={setLoanPurpose} />
            <FullWidthSelect width={190} label="Intended Loan Product" placeholder="Select"
              data={["Salary Advance", "Farmer Input Loan", "SME Working Capital", "Asset Finance"]}
              value={intendedLoanProduct} onChange={setIntendedLoanProduct} />
            <FullWidthNumber width={160} label="Loan Amount Requested" placeholder="e.g. 25,000"
              value={loanAmountRequested} onChange={setLoanAmountRequested} />
            <FullWidthNumber width={130} label="Tenure (months)" placeholder="e.g. 12"
              value={loanTenureMonths} onChange={setLoanTenureMonths} />
            <FullWidthSelect width={175} label="Repayment Frequency" placeholder="Select"
              data={["Weekly", "Bi-weekly", "Monthly", "Quarterly"]}
              value={repaymentFrequency} onChange={setRepaymentFrequency} />
            <FullWidthSelect width={175} label="Branch" placeholder="Select" withAsterisk
              data={["Cairo Road, Lusaka", "Kitwe Branch", "Ndola Branch", "Livingstone Branch"]}
              value={branch} onChange={setBranch} />
            <FullWidthSelect width={145} label="Credit Officer" placeholder="Unassigned"
              data={["M. Banda", "C. Phiri", "T. Mwansa"]}
              value={creditOfficer} onChange={setCreditOfficer} />
            <FullWidthSelect width={190} label="Preliminary Risk Rating" placeholder="Not yet rated"
              data={["Low", "Medium", "High"]}
              value={preliminaryRiskRating} onChange={setPreliminaryRiskRating} />
          </FieldRow>
        </>
      )}
    </PlainCard>
  );
}