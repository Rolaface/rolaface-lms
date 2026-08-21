import { Box, Text, Progress, Divider } from "@mantine/core";
import type { LoanApplicationValues } from "./LoanApplicationModal";

interface Props {
  values: LoanApplicationValues;
  totalRepayable: number;
  monthlyRepayment: number;
  activeStep: number;
}

export function ApplicationSummary({ values, totalRepayable, monthlyRepayment, activeStep }: Props) {
  const isPersonal = values.loanType === "Personal";

  const applicantName = isPersonal
    ? [values.firstName, values.surname].filter(Boolean).join(" ")
    : [values.applicantFirstName, values.applicantLastName].filter(Boolean).join(" ");

  const docFields = isPersonal
    ? [values.payslips, values.bankStatementsPersonal, values.nrcCopy, values.passportPhotoPersonal, values.tpinCertificate]
    : [values.pacraCertificate, values.form2, values.taxClearanceCertificate, values.taxComplianceReturn, values.bankStatementsBusiness, values.applicantPassportPhoto, values.boardResolution];

  const uploadedCount = docFields.filter(Boolean).length;
  const totalDocs = docFields.length;
  const pending = totalDocs - uploadedCount;

  const progressPct = Math.round(((activeStep + 1) / 4) * 100);

  return (
    <Box
      w={260}
      px="md"
      py="md"
      style={{
        borderLeft: "1px solid var(--mantine-color-slate-2)",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <Text fz="xxs" fw={700} c="slate.4" mb="sm" tt="uppercase" style={{ letterSpacing: "0.04em" }}>
        Application Summary
      </Text>

      {/* Applicant */}
      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Applicant
      </Text>
      <Text fz="sm" fw={700} c="brand.7" mb={1} lineClamp={1}>
        {applicantName || "—"}
      </Text>
      <Text fz="xs" c="slate.5" mb="sm">
        {isPersonal ? values.nrc : values.applicantNrc}
      </Text>

      <Divider color="slate.2" mb="sm" />

      {/* Loan */}
      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Loan
      </Text>
      <Text fz="sm" fw={700} c="slate.8" mb={1}>
        {isPersonal ? "Personal Loan" : "Business Loan"}
      </Text>
      <Text fz="xs" c="slate.5" mb="sm">
        K {values.loanAmount.toLocaleString()} • {values.tenureMonths || 0} months
      </Text>

      <Divider color="slate.2" mb="sm" />

      {/* Financial */}
      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Financial
      </Text>
      <Text fz="sm" fw={700} c="slate.8" mb={1}>
        K {monthlyRepayment.toLocaleString()} / month
      </Text>
      <Text fz="xs" c="slate.5" mb="sm">
        Total repayable: K {totalRepayable.toLocaleString()}
      </Text>

      {/* Status */}
      <Box
        p="sm"
        mb="sm"
        style={{
          borderRadius: "var(--mantine-radius-md)",
          background: "var(--mantine-color-brand-6)",
        }}
      >
        <Text fz="xxs" fw={700} c="white" tt="uppercase" mb={2} style={{ letterSpacing: "0.03em" }}>
          Status
        </Text>
        <Text fz="sm" fw={700} c="white" mb={4}>
          {progressPct}% complete
        </Text>
        <Progress value={progressPct} color="white" bg="brand.4" size="xs" radius="xl" mb={4} />
        <Text fz="xs" c="brand.1">
          Draft
        </Text>
      </Box>

      {/* Documents */}
      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Documents
      </Text>
      <Text fz="sm" fw={700} c="slate.8" mb={1}>
        {uploadedCount} / {totalDocs} uploaded
      </Text>
      {pending > 0 && (
        <Text fz="xs" c="danger.6" fw={600}>
          ⚠ {pending} pending
        </Text>
      )}
    </Box>
  );
}