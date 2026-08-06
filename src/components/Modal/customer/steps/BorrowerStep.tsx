import { Select, Switch, Text, Group, Divider, Box } from "@mantine/core";
import { IconChevronDown, IconCash } from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";

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
    <PlainCard>
      <SectionHeader
        icon={IconCash}
        title="Borrower setup"
        badge="OPTIONAL"
        description="Convert this profile into a borrower record and assign ownership"
      />
      <Group justify="space-between" mb="xs">
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
          <Divider mt="md" mb="md" color="slate.2" />

          <FieldRow columns="1.2fr 1.2fr 1.2fr">
            <Select
              radius="md"
              searchable
              rightSection={chevron}
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
            <Select
              radius="md"
              searchable
              rightSection={chevron}
              label="Loan Purpose"
              withAsterisk
              placeholder="Select"
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
            <Select
              radius="md"
              searchable
              rightSection={chevron}
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
          </FieldRow>

          <FieldRow columns="1fr 1.2fr 1fr">
            <Select
              radius="md"
              searchable
              rightSection={chevron}
              label="Preliminary Risk Rating"
              placeholder="Not yet rated"
              data={["Low", "Medium", "High"]}
              value={preliminaryRiskRating}
              onChange={setPreliminaryRiskRating}
            />
            <Select
              radius="md"
              searchable
              rightSection={chevron}
              label="Branch"
              withAsterisk
              placeholder="Select"
              data={[
                "Cairo Road, Lusaka",
                "Kitwe Branch",
                "Ndola Branch",
                "Livingstone Branch",
              ]}
              value={branch}
              onChange={setBranch}
            />
            <Select
              radius="md"
              searchable
              rightSection={chevron}
              label="Credit Officer"
              placeholder="Unassigned"
              data={["M. Banda", "C. Phiri", "T. Mwansa"]}
              value={creditOfficer}
              onChange={setCreditOfficer}
            />
          </FieldRow>

          <FieldRow columns="1fr 1.2fr 1fr">
            <Select
              radius="md"
              searchable
              rightSection={chevron}
              label="Relationship Manager"
              placeholder="Unassigned"
              data={["K. Zulu", "N. Tembo"]}
              value={relationshipManager}
              onChange={setRelationshipManager}
            />
            <Box />
            <Box />
          </FieldRow>
        </>
      )}
    </PlainCard>
  );
}