import { Box, Group, Text, Stack } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const zmw = (n: number) => "ZMW " + Math.round(n).toLocaleString();

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fz={11}
      fw={600}
      c="slate.5"
      tt="uppercase"
      style={{ letterSpacing: 0.3 }}
      mb={10}
    >
      {children}
    </Text>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Group
      justify="space-between"
      py={7}
      style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}
    >
      <Text fz="sm" c="slate.5">
        {label}
      </Text>
      <Text fz="sm" fw={600} c="slate.9">
        {value}
      </Text>
    </Group>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      p="md"
      mb={16}
      bg="white"
      style={{
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-md)",
      }}
    >
      {children}
    </Box>
  );
}

export function Review({ form, loanType }: StepProps) {
  const values = form.values;

  const tenure = Number(values.tenureMonths) || 0;
  const facilityFee = Math.round(values.loanAmount * 0.02 * 100) / 100;
  const totalInterest =
    Math.round(values.loanAmount * 0.24 * (tenure / 12) * 100) / 100;
  const totalRepayable = values.loanAmount + totalInterest + facilityFee;
  const monthlyRepayment = tenure
    ? Math.round((totalRepayable / tenure) * 100) / 100
    : 0;

  const applicantSummary =
    loanType === "Business"
      ? values.companyName
      : [values.firstName, values.middleName, values.surname]
          .filter(Boolean)
          .join(" ");

  const documentCount =
    loanType === "Personal"
      ? [
          values.payslips,
          values.bankStatementsPersonal,
          values.nrcCopy,
          values.passportPhotoPersonal,
          values.tpinCertificate,
        ].filter(Boolean).length
      : [
          values.pacraCertificate,
          values.form2,
          values.taxClearanceCertificate,
          values.taxComplianceReturn,
          values.orderInvoice,
          values.bankStatementsBusiness,
          values.applicantPassportPhoto,
          values.boardResolution,
        ].filter(Boolean).length +
        values.directorDocuments.filter((d) => d.nrcFile || d.photoFile).length;

  const totalDocumentSlots =
    loanType === "Personal" ? 5 : 8 + values.directorDocuments.length;

  return (
    <Stack gap={22}>
      <Box>
        <SectionLabel>Loan summary</SectionLabel>
        <SummaryCard>
          <SummaryRow
            label="Product"
            value={loanType === "Business" ? "Business Loan" : "Personal Loan"}
          />
          <SummaryRow label="Amount" value={zmw(values.loanAmount)} />
          <SummaryRow label="Tenure" value={`${tenure} months`} />
          <SummaryRow
            label="Repayment frequency"
            value={values.repaymentFrequency || "Monthly"}
          />
          <SummaryRow label="Facility fee" value={zmw(facilityFee)} />
          <SummaryRow label="Total interest" value={zmw(totalInterest)} />
          <SummaryRow label="Total repayable" value={zmw(totalRepayable)} />
          <SummaryRow
            label="Estimated monthly repayment"
            value={zmw(monthlyRepayment)}
          />
        </SummaryCard>
      </Box>

      <Box>
        <SectionLabel>Application</SectionLabel>
        <SummaryCard>
          <SummaryRow
            label={loanType === "Business" ? "Business" : "Applicant"}
            value={applicantSummary || "—"}
          />
          <SummaryRow
            label={loanType === "Business" ? "Applicant phone" : "Phone"}
            value={
              (loanType === "Business" ? values.applicantPhone : values.phone) ||
              "—"
            }
          />
          <SummaryRow
            label={loanType === "Business" ? "Applicant email" : "Email"}
            value={
              (loanType === "Business" ? values.applicantEmail : values.email) ||
              "—"
            }
          />
          {loanType === "Business" && (
            <SummaryRow
              label="Directors"
              value={String(values.directors.length)}
            />
          )}
          <SummaryRow
            label="Documents"
            value={`${documentCount} of ${totalDocumentSlots} uploaded`}
          />
        </SummaryCard>
      </Box>

      <Text fz={12} c="slate.5">
        This reflects the simulated terms only. Final approved terms may
        differ following full underwriting.
      </Text>
    </Stack>
  );
}