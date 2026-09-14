import React from 'react';
import { Paper, Text, Button, Grid, Box } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import type { LoanApplicationRow } from './LoanApplication';
import type { LoanApplicationDetail } from './LoanApplicationDetailParts';
import { formatCurrency, formatDate } from './LoanApplicationDetailParts';

const Field = ({ label, value, span = 6 }: { label: string; value: string | number | undefined | null; span?: number }) => (
  <Grid.Col span={{ base: 12, sm: span }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
    <Text fz={9} fw={700} tt="uppercase" c="gray.7" style={{ letterSpacing: '0.2px' }}>
      {label}
    </Text>
    <Text fz={11} fw={600} c="black" style={{ minHeight: '14px', marginTop: '2px' }}>
      {value || '—'}
    </Text>
  </Grid.Col>
);

const SectionHeading = ({ title }: { title: string }) => (
  <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px', marginTop: '16px' }} className="page-break-inside-avoid">
    <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
      {title}
    </Text>
  </Box>
);

export function FormPreviewPanel({ detail, application }: { detail: LoanApplicationDetail; application: LoanApplicationRow }) {
  const handlePrint = () => {
    window.print();
  };

  const isBusiness = detail.business?.isBusinessLoan;

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
          border: '2px solid #000',
          backgroundColor: '#fff',
          maxWidth: '850px',
          margin: '0 auto',
          width: '100%',
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        <Box mb={20} className="text-center" style={{ position: 'relative' }}>
          <Text fz={22} fw={900} c="black" tt="uppercase" style={{ letterSpacing: '1px', textDecoration: 'underline' }}>
            Official Loan Application Form
          </Text>
          <Text fz={10} c="black" mt={4}>
            Reference: <strong>{application.name || '[ TBD ]'}</strong> &nbsp;|&nbsp; Date: <strong>{application.application_date ? formatDate(application.application_date) : '[ DD/MM/YYYY ]'}</strong>
          </Text>
        </Box>

        <SectionHeading title="1. Loan Request Specifics" />
        <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
          <Field label="Loan Product Type" value={application.application_type} span={4} />
          <Field label="Amount Requested" value={formatCurrency(detail.loanTerms.amountRequested)} span={4} />
          <Field label="Tenure" value={`${detail.loanTerms.tenureMonths} months`} span={4} />
          <Field label="Repayment Frequency" value={detail.loanTerms.proposedRepaymentFrequency} span={4} />
          <Field label="Purpose of Loan" value={detail.loanTerms.purpose} span={8} />
          <Field label="Collateral Offered" value={detail.loanTerms.collateralPledged} span={12} />
        </Grid>

        <SectionHeading title={isBusiness ? "2. Principal Applicant / Representative" : "2. Applicant Personal Information"} />
        <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
          <Field label="Full Legal Name" value={detail.applicant.fullName} span={8} />
          <Field label="Date of Birth" value={detail.applicant.birthDate ? formatDate(detail.applicant.birthDate) : null} span={4} />
          <Field label="Gender" value={detail.applicant.gender} span={3} />
          <Field label="Marital Status" value={detail.applicant.maritalStatus} span={3} />
          <Field label="NRC / ID Number" value={detail.applicant.nrc} span={3} />
          <Field label="Nationality" value={detail.applicant.nationality} span={3} />
          <Field label="Primary Phone" value={detail.applicant.phone} span={4} />
          <Field label="Email Address" value={detail.applicant.email} span={8} />
          <Field label="Residential Address (Full)" value={detail.applicant.residentialAddress} span={12} />
        </Grid>

        {isBusiness && detail.business && (
          <>
            <SectionHeading title="3. Business / Entity Details" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Registered Company Name" value={detail.business.companyName} span={8} />
              <Field label="Entity Type" value={detail.business.typeOfBusiness} span={4} />
              <Field label="Date of Incorporation" value={detail.business.establishedDate ? formatDate(detail.business.establishedDate) : null} span={4} />
              <Field label="Nature of Business" value={detail.business.natureOfBusiness} span={8} />
              <Field label="Registered Office Address" value={detail.business.registeredOffice} span={12} />
            </Grid>
          </>
        )}

        {detail.directors && detail.directors.length > 0 && (
          <>
            <SectionHeading title={isBusiness ? "4. Directors & Partners" : "3. Additional Directors"} />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              {detail.directors.map((director, idx) => (
                <React.Fragment key={idx}>
                  <Field label={`Director ${idx + 1} Name`} value={director.fullName || director.name} span={4} />
                  <Field label="NRC" value={director.nrc} span={3} />
                  <Field label="Phone" value={director.phone} span={3} />
                  <Field label="Email" value={director.email} span={2} />
                </React.Fragment>
              ))}
            </Grid>
          </>
        )}

        {!isBusiness && (
          <>
            <SectionHeading title="3. Employment & Financials" />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Current Occupation / Title" value={detail.applicant.occupation} span={6} />
              <Field label="Employer Name / Business" value={detail.applicant.employerName} span={6} />
            </Grid>
          </>
        )}

        {detail.nextOfKin && (
          <>
            <SectionHeading title={isBusiness ? "5. Emergency Contact / Next of Kin" : "4. Emergency Contact / Next of Kin"} />
            <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
              <Field label="Full Name" value={detail.nextOfKin.name} span={5} />
              <Field label="Relationship to Applicant" value={detail.nextOfKin.relationship} span={4} />
              <Field label="Contact Phone" value={detail.nextOfKin.phone} span={3} />
            </Grid>
          </>
        )}

        <Box mt={24} className="page-break-inside-avoid">
          <SectionHeading title="Declaration & Signatures" />
          <Box style={{ border: '1px solid #000', margin: '-0.5px', padding: '12px' }}>
            <Text fz={9} c="black" style={{ textAlign: 'justify', lineHeight: 1.4 }}>
              I/We hereby irrevocably declare that all information, statements, and particulars contained in this application and any supplementary documents are true, complete, and accurate to the best of my/our knowledge and belief. I/We understand that providing false or misleading information constitutes a material breach and may result in immediate cancellation of the loan application and/or legal action. I/We authorize the Lender, its agents, and its representatives to conduct any inquiries, credit checks, or verifications from any source as deemed necessary for the assessment of this application, and to disclose information relating to this account to credit reference agencies or regulatory bodies in accordance with applicable data protection laws.
            </Text>
            
            <Grid mt={30}>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid #000', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="black">Applicant(s) Authorized Signature</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid #000', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="black">Date (DD/MM/YYYY)</Text>
              </Grid.Col>
            </Grid>
          </Box>
        </Box>

        <Box mt={24} className="page-break-inside-avoid">
          <SectionHeading title="For Official Use Only" />
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
            <Field label="Application Stage" value={detail.stage || "Under Review"} span={6} />
            <Field label="Receiving Officer" value={detail.reviewer ? `${detail.reviewer.name} (${detail.reviewer.branch})` : ""} span={6} />
            <Field label="Initial Remarks" value="" span={12} />
          </Grid>
          <Box style={{ border: '1px solid #000', borderTop: 'none', margin: '-0.5px', padding: '24px 12px 12px' }}>
            <Grid>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid #000', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="black">Approving Officer Signature</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box style={{ borderBottom: '1px solid #000', height: 20, width: '90%' }} mb="4px"></Box>
                <Text fz={9} fw={700} c="black">Date (DD/MM/YYYY)</Text>
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
