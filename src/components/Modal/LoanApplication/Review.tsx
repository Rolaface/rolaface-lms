import React from 'react';
import { Paper, Text, Button, Grid, Box } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType } from "./LoanApplicationModal";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const zmw = (n: number) => "ZMW " + Math.round(n).toLocaleString();

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

export function Review({ form, loanType }: StepProps) {
  const values = form.values;
  const isBusiness = loanType === "Business";

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
          <Field label="Loan Product Type" value={loanType + " Loan"} span={4} />
          <Field label="Amount Requested" value={zmw(values.loanAmount)} span={4} />
          <Field label="Tenure" value={`${values.tenureMonths} months`} span={4} />
          <Field label="Repayment Frequency" value={values.repaymentFrequency} span={4} />
          <Field label="Purpose of Loan" value={values.purposeOfLoan} span={8} />
          <Field label="Collateral Offered" value={values.collateralPledged} span={12} />
        </Grid>

        {!isBusiness ? (
          <>
            <SectionHeading title="2. Applicant Personal Information" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Legal Name" value={[values.firstName, values.middleName, values.surname].filter(Boolean).join(" ")} span={8} />
              <Field label="Date of Birth (DD/MM/YYYY)" value={values.birthDate} span={4} />
              <Field label="Gender" value={values.gender} span={3} />
              <Field label="Marital Status" value={values.maritalStatus} span={3} />
              <Field label="NRC / ID Number" value={values.nrc} span={3} />
              <Field label="Nationality" value={values.nationality} span={3} />
              <Field label="Primary Phone" value={values.phone} span={4} />
              <Field label="Email Address" value={values.email} span={8} />
              <Field label="Residential Address (Full)" value={values.residentialAddress} span={12} />
            </Grid>
          </>
        ) : (
          <>
            <SectionHeading title="2. Business / Entity Details" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Registered Company Name" value={values.companyName} span={8} />
              <Field label="Entity Type" value={values.typeOfBusiness} span={4} />
              <Field label="Date of Incorporation" value={values.establishedDate} span={4} />
              <Field label="Nature of Business" value={values.natureOfBusiness} span={8} />
              <Field label="Registered Office Address" value={values.registeredOffice} span={12} />
            </Grid>

            <SectionHeading title="3. Principal Applicant / Representative" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Legal Name" value={[values.applicantFirstName, values.applicantMiddleName, values.applicantLastName].filter(Boolean).join(" ")} span={8} />
              <Field label="Position / Title" value={values.applicantPosition} span={4} />
              <Field label="NRC / ID Number" value={values.applicantNrc} span={4} />
              <Field label="Nationality" value={values.applicantNationality} span={4} />
              <Field label="Contact Phone" value={values.applicantPhone} span={4} />
              <Field label="Email Address" value={values.applicantEmail} span={12} />
              <Field label="Residential Address" value={values.applicantAddress} span={12} />
            </Grid>

            {values.directors && values.directors.length > 0 && (
              <>
                <SectionHeading title="4. Directors & Partners" />
                <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
                  {values.directors.map((director, idx) => (
                    <React.Fragment key={idx}>
                      <Field label={`Director ${idx + 1} Name`} value={director.name} span={4} />
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
              <Field label="Current Occupation / Title" value={values.occupation} span={6} />
              <Field label="Employer Name / Business" value={values.employerName} span={6} />
            </Grid>
          </>
        )}

        {values.kinName && (
          <>
            <SectionHeading title={isBusiness ? "5. Emergency Contact / Next of Kin" : "4. Emergency Contact / Next of Kin"} />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Name" value={values.kinName} span={5} />
              <Field label="Relationship to Applicant" value={values.kinRelationship} span={4} />
              <Field label="Contact Phone" value={values.kinPhone} span={3} />
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