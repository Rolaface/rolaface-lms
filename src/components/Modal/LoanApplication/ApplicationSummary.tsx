import { Box, Text, Progress, Divider } from "@mantine/core";
import { DOCUMENT_KEYS, OPTIONAL_DOCUMENTS, applicantName, type LoanApplicationValues } from "./form";
import { labelOf, useLoanTypeOptions } from "./lookups";

interface Props {
  values: LoanApplicationValues;
  totalRepayable: number;
  monthlyRepayment: number;
  activeStep: number;
  totalSteps: number;
}

export function ApplicationSummary({ values, totalRepayable, monthlyRepayment, activeStep, totalSteps }: Props) {
  const isIndividual = values.applicant_type === "Individual";
  const { options: loanTypes } = useLoanTypeOptions(values.applicant_type);

  const requiredDocs = DOCUMENT_KEYS[values.applicant_type].filter((key) => !OPTIONAL_DOCUMENTS.includes(key));
  const uploadedCount = requiredDocs.filter((key) => values.documents[key]).length;
  const totalDocs = requiredDocs.length;
  const pending = totalDocs - uploadedCount;

  const progressPct = Math.round(((activeStep + 1) / totalSteps) * 100);
  const name = isIndividual
    ? applicantName(values)
    : [values.first_name, values.last_name].filter(Boolean).join(" ");

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

      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Applicant
      </Text>
      <Text fz="sm" fw={700} c="brand.7" mb={1} lineClamp={1}>
        {name || "—"}
      </Text>
      <Text fz="xs" c="slate.5" mb="sm">
        {isIndividual ? values.nrc : values.company_name}
      </Text>

      <Divider color="slate.2" mb="sm" />

      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Loan
      </Text>
      <Text fz="sm" fw={700} c="slate.8" mb={1}>
        {labelOf(loanTypes, values.loan_type) || `${values.applicant_type} loan`}
      </Text>
      <Text fz="xs" c="slate.5" mb="sm">
        K {(Number(values.requested_amount) || 0).toLocaleString()} • {values.tenure_months || 0} months
      </Text>

      <Divider color="slate.2" mb="sm" />

      <Text fz="xxs" fw={700} c="slate.4" mb={2} tt="uppercase" style={{ letterSpacing: "0.03em" }}>
        Financial
      </Text>
      <Text fz="sm" fw={700} c="slate.8" mb={1}>
        K {monthlyRepayment.toLocaleString()} / {values.repayment_frequency === "Bi-weekly" ? "fortnight" : "month"}
      </Text>
      <Text fz="xs" c="slate.5" mb="sm">
        Total repayable: K {totalRepayable.toLocaleString()}
      </Text>

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
