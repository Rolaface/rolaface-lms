import React from 'react';
import { Paper, Text, Button, Grid, Box } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import type { UseFormReturnType } from "@mantine/form";
import { applicantName, formatAddress, type LoanApplicationValues } from "./form";
import { labelOf, useCollateralTypeOptions, useLoanTypeOptions, usePurposeOptions, useSubTypeOptions } from "./lookups";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
}

const zmw = (n: number | "") => (n === "" ? "" : "ZMW " + Math.round(Number(n)).toLocaleString());

const Field = ({ label, value, span = 6 }: { label: string; value: string | number | undefined | null; span?: number }) => (
  <Grid.Col
    span={{ base: 12, sm: span }}
    style={{
      border: '1px solid var(--mantine-color-slate-2)',
      padding: '4px 8px',
      margin: '-0.5px',
      background: 'var(--mantine-color-white)',
    }}
  >
    <Text fz={9} fw={700} tt="uppercase" c="slate.5" style={{ letterSpacing: '0.2px' }}>
      {label}
    </Text>
    <Text fz={11} fw={600} c="slate.8" style={{ minHeight: '14px', marginTop: '2px' }}>
      {value || '—'}
    </Text>
  </Grid.Col>
);

const SectionHeading = ({ title }: { title: string }) => (
  <Box
    p="4px 8px"
    style={{
      background: 'var(--mantine-color-brand-0)',
      border: '1px solid var(--mantine-color-brand-2)',
      margin: '-0.5px',
      marginTop: '16px',
    }}
    className="page-break-inside-avoid"
  >
    <Text fz={11} fw={800} tt="uppercase" c="brand.7" style={{ letterSpacing: '0.5px' }}>
      {title}
    </Text>
  </Box>
);

export function Review({ form }: StepProps) {
  const values = form.values;
  const isBusiness = values.applicant_type === "Business";
  const { options: loanTypes } = useLoanTypeOptions(values.applicant_type);
  const { options: subTypes } = useSubTypeOptions(values.loan_type);
  const { options: purposes } = usePurposeOptions(values.loan_sub_type);
  const { options: collateralTypes } = useCollateralTypeOptions();
  const permanentAddress = values.permanent_same_as_current ? values.current_address : values.permanent_address;
  const collateralSummary = values.collaterals
    .map((c) => [labelOf(collateralTypes, c.collateral_type), zmw(c.estimated_value)].filter(Boolean).join(" — "))
    .join("; ");

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-end print:hidden mb-2">
        <Button variant="default" size="xs" radius="xs" leftSection={<IconPrinter size={14} />} onClick={handlePrint}>
          Print Form
        </Button>
      </div>

      <Paper
        radius={0}
        p={24}
        className="form-print-container"
        style={{
          border: '2px solid var(--mantine-color-slate-8)',
          backgroundColor: 'var(--mantine-color-white)',
          maxWidth: '850px',
          margin: '0 auto',
          width: '100%',
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        <Box mb={20} className="text-center" style={{ position: 'relative' }}>
          <Text fz={22} fw={900} c="brand.7" tt="uppercase" style={{ letterSpacing: '1px', textDecoration: 'underline' }}>
            Official Loan Application Form
          </Text>
          <Text fz={10} c="slate.6" mt={4}>
            Reference Number: <Text component="span" fw={700} c="slate.8">[ OFFICE USE ]</Text> &nbsp;|&nbsp; Date: <Text component="span" fw={700} c="slate.8">[ DD / MM / YYYY ]</Text>
          </Text>
        </Box>

        <SectionHeading title="1. Loan Request Specifics" />
        <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
          <Field label="Loan Type" value={labelOf(loanTypes, values.loan_type)} span={4} />
          <Field label="Loan Sub-type" value={labelOf(subTypes, values.loan_sub_type)} span={4} />
          <Field label="Purpose of Loan" value={labelOf(purposes, values.loan_purpose)} span={4} />
          <Field label="Amount Requested" value={zmw(values.requested_amount)} span={4} />
          <Field label="Tenure" value={values.tenure_months ? `${values.tenure_months} months` : ""} span={4} />
          <Field label="Repayment Frequency" value={values.repayment_frequency} span={4} />
          <Field label="Channel" value={values.channel} span={4} />
          <Field label="Customer" value={values.customer_type === "Existing" ? values.customer_name || values.customer : "New customer"} span={8} />
          <Field label="Collateral Offered" value={collateralSummary} span={12} />
        </Grid>

        {!isBusiness ? (
          <>
            <SectionHeading title="2. Applicant Personal Information" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Legal Name" value={applicantName(values)} span={8} />
              <Field label="Date of Birth" value={values.date_of_birth} span={4} />
              <Field label="Gender" value={values.gender} span={3} />
              <Field label="Marital Status" value={values.marital_status} span={3} />
              <Field label="NRC / ID Number" value={values.nrc} span={3} />
              <Field label="Nationality" value={values.nationality} span={3} />
              <Field label="Primary Phone" value={values.phone} span={4} />
              <Field label="Email Address" value={values.email} span={8} />
              <Field label="Residential Address (Full)" value={formatAddress(values.current_address)} span={12} />
              <Field label="Permanent Address (Full)" value={formatAddress(permanentAddress)} span={12} />
            </Grid>
          </>
        ) : (
          <>
            <SectionHeading title="2. Business / Entity Details" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Registered Company Name" value={values.company_name} span={8} />
              <Field label="Entity Type" value={values.business_type} span={4} />
              <Field label="PACRA Registration Number" value={values.registration_number} span={4} />
              <Field label="TPIN" value={values.tpin} span={4} />
              <Field label="Date of Incorporation" value={values.established_date} span={4} />
              <Field label="Nature of Business" value={values.nature_of_business} span={8} />
              <Field label="Credit Score" value={values.credit_score === "" ? "" : String(values.credit_score)} span={4} />
              <Field label="Registered Office Address" value={formatAddress(values.office_address)} span={12} />
            </Grid>

            <SectionHeading title="3. Principal Applicant / Representative" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Legal Name" value={[values.first_name, values.middle_name, values.last_name].filter(Boolean).join(" ")} span={8} />
              <Field label="Position / Title" value={values.position} span={4} />
              <Field label="NRC / ID Number" value={values.nrc} span={4} />
              <Field label="Nationality" value={values.nationality} span={4} />
              <Field label="Contact Phone" value={values.phone} span={4} />
              <Field label="Email Address" value={values.email} span={12} />
              <Field label="Residential Address" value={formatAddress(values.current_address)} span={12} />
            </Grid>

            {values.directors && values.directors.length > 0 && (
              <>
                <SectionHeading title="4. Directors & Partners" />
                <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
                  {values.directors.map((director, idx) => (
                    <React.Fragment key={idx}>
                      <Field label={`Director ${idx + 1} Name`} value={director.full_name} span={4} />
                      <Field label="NRC" value={director.nrc} span={3} />
                      <Field label="Phone" value={director.phone} span={3} />
                      <Field label="Email" value={director.email} span={2} />
                    </React.Fragment>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}

        {!isBusiness && (
          <>
            <SectionHeading title="3. Employment & Financials" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Employment Status" value={values.employment_status} span={4} />
              <Field label="Employment Type" value={values.employment_type} span={4} />
              <Field label="Experience (Years)" value={values.experience_years === "" ? "" : String(values.experience_years)} span={4} />
              <Field label="Current Occupation / Title" value={values.designation} span={4} />
              <Field label="Employer Name / Business" value={values.employer_name} span={4} />
              <Field label="Credit Score" value={values.credit_score === "" ? "" : String(values.credit_score)} span={4} />
            </Grid>
          </>
        )}

        {!isBusiness && values.kin_name && (
          <>
            <SectionHeading title={isBusiness ? "5. Emergency Contact / Next of Kin" : "4. Emergency Contact / Next of Kin"} />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Name" value={values.kin_name} span={5} />
              <Field label="Relationship to Applicant" value={values.kin_relationship} span={4} />
              <Field label="Contact Phone" value={values.kin_phone} span={3} />
            </Grid>
          </>
        )}

        <Box mt={24} className="page-break-inside-avoid">
          <SectionHeading title="Declaration & Signatures" />
          <Box
            style={{
              border: '1px solid var(--mantine-color-slate-2)',
              margin: '-0.5px',
              padding: '12px',
              background: 'var(--mantine-color-slate-0)',
            }}
          >
            <Text fz={9} c="slate.7" style={{ textAlign: 'justify', lineHeight: 1.4 }}>
              I/We hereby irrevocably declare that all information, statements, and particulars contained in this application and any supplementary documents are true, complete, and accurate to the best of my/our knowledge and belief. I/We understand that providing false or misleading information constitutes a material breach and may result in immediate cancellation of the loan application and/or legal action. I/We authorize the Lender, its agents, and its representatives to conduct any inquiries, credit checks, or verifications from any source as deemed necessary for the assessment of this application, and to disclose information relating to this account to credit reference agencies or regulatory bodies in accordance with applicable data protection laws.
            </Text>

            <Grid mt={30}>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid var(--mantine-color-slate-6)', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="slate.7">Applicant(s) Authorized Signature</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid var(--mantine-color-slate-6)', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="slate.7">Date (DD/MM/YYYY)</Text>
              </Grid.Col>
            </Grid>
          </Box>
        </Box>

        <Box mt={24} className="page-break-inside-avoid">
          <SectionHeading title="For Official Use Only" />
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
            <Field label="Application Status" value="Pending / Under Review" span={6} />
            <Field label="Receiving Officer" value="" span={6} />
            <Field label="Initial Remarks" value="" span={12} />
          </Grid>
          <Box
            style={{
              border: '1px solid var(--mantine-color-slate-2)',
              borderTop: 'none',
              margin: '-0.5px',
              padding: '24px 12px 12px',
              background: 'var(--mantine-color-slate-0)',
            }}
          >
            <Grid>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid var(--mantine-color-slate-6)', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="slate.7">Approving Officer Signature</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid var(--mantine-color-slate-6)', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="slate.7">Date (DD/MM/YYYY)</Text>
              </Grid.Col>
            </Grid>
          </Box>
        </Box>
      </Paper>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .form-print-container, .form-print-container * {
            visibility: visible;
          }
          .form-print-container {
            position: absolute;
            left: 0;
            top: 0;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            border: none !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}