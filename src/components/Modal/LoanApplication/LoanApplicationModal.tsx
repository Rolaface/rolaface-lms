import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Modal,
  Box,
  Group,
  Text,
  Button,
  ActionIcon,
  SegmentedControl,
  Badge,
  Stack,
  ScrollArea,
  Checkbox,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { 
  IconX, 
  IconCheck, 
  IconFileText, 
  IconChevronRight, 
  IconUser, 
  IconBuilding, 
  IconBriefcase, 
  IconFileInvoice, 
  IconUsers, 
  IconArrowRight
} from "@tabler/icons-react";

import { PersonalBusinessInfoStep } from "./PersonalBusinessInfoStep";
import { ResidenceEmploymentStep } from "./ResidenceEmploymentStep";
import { DocumentsStep } from "./DocumentsStep";
import { LoanTermsStep } from "./LoanTermsStep";
import { createLoanApplication } from "../../../api/loanApplicationApi";
import type {
  LoanApplicationPayload,
  PersonalLoanApplication,
  BusinessLoanApplication,
} from "../../../types/loanApplicationForm";

export type LoanType = "Personal" | "Business";

export interface DirectorEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  nrc: string;
}

export interface DirectorDocEntry {
  id: string;
  nrcFile: File | null;
  photoFile: File | null;
}

export interface LoanApplicationValues {
  loanType: LoanType;

  // --- Personal: Step 1 ---
  firstName: string;
  middleName: string;
  surname: string;
  phone: string;
  email: string;
  nrc: string;
  gender: string | null;
  maritalStatus: string | null;
  birthDate: string;

  // --- Business: Step 1 ---
  companyName: string;
  typeOfBusiness: string | null;
  establishedDate: string;
  natureOfBusiness: string;
  registeredOffice: string;
  collateralPledged: string;
  purposeOfLoan: string;

  // --- Personal: Step 2 ---
  residentialAddress: string;
  occupation: string;
  employerName: string;
  nationality: string | null;
  principalObjective: string;
  kinName: string;
  kinPhone: string;
  kinEmail: string;
  kinRelationship: string;

  // --- Business: Step 2 ---
  directors: DirectorEntry[];
  applicantFirstName: string;
  applicantMiddleName: string;
  applicantLastName: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantNrc: string;
  applicantGender: string | null;
  applicantMaritalStatus: string | null;
  applicantBirthDate: string;
  applicantAddress: string;
  applicantPosition: string;
  applicantNationality: string | null;

  // --- Personal: Step 3 (Documents) ---
  payslips: File | null;
  bankStatementsPersonal: File | null;
  nrcCopy: File | null;
  passportPhotoPersonal: File | null;
  tpinCertificate: File | null;

  // --- Business: Step 3 (Documents) ---
  pacraCertificate: File | null;
  form2: File | null;
  taxClearanceCertificate: File | null;
  taxComplianceReturn: File | null;
  orderInvoice: File | null;
  bankStatementsBusiness: File | null;
  applicantPassportPhoto: File | null;
  boardResolution: File | null;
  directorDocuments: DirectorDocEntry[];

  // --- Step 4: Loan Terms (shared) ---
  loanAmount: number;
  tenureMonths: number | "";
}

const nextId = () => Math.random().toString(36).slice(2, 10);

const INITIAL_VALUES: LoanApplicationValues = {
  loanType: "Personal",

  firstName: "",
  middleName: "",
  surname: "",
  phone: "",
  email: "",
  nrc: "",
  gender: null,
  maritalStatus: null,
  birthDate: "",

  companyName: "",
  typeOfBusiness: null,
  establishedDate: "",
  natureOfBusiness: "",
  registeredOffice: "",
  collateralPledged: "",
  purposeOfLoan: "",

  residentialAddress: "",
  occupation: "",
  employerName: "",
  nationality: null,
  principalObjective: "",
  kinName: "",
  kinPhone: "",
  kinEmail: "",
  kinRelationship: "",

  directors: [{ id: nextId(), name: "", phone: "", email: "", nrc: "" }],
  applicantFirstName: "",
  applicantMiddleName: "",
  applicantLastName: "",
  applicantPhone: "",
  applicantEmail: "",
  applicantNrc: "",
  applicantGender: null,
  applicantMaritalStatus: null,
  applicantBirthDate: "",
  applicantAddress: "",
  applicantPosition: "",
  applicantNationality: null,

  payslips: null,
  bankStatementsPersonal: null,
  nrcCopy: null,
  passportPhotoPersonal: null,
  tpinCertificate: null,

  pacraCertificate: null,
  form2: null,
  taxClearanceCertificate: null,
  taxComplianceReturn: null,
  orderInvoice: null,
  bankStatementsBusiness: null,
  applicantPassportPhoto: null,
  boardResolution: null,
  directorDocuments: [{ id: nextId(), nrcFile: null, photoFile: null }],

  loanAmount: 4000,
  tenureMonths: 6,
};

const LOAN_RANGE: Record<LoanType, { min: number; max: number }> = {
  Personal: { min: 500, max: 8000 },
  Business: { min: 5000, max: 50000 },
};

const STEP_LABELS: Record<LoanType, string[]> = {
  Personal: ["Personal information", "Residence & Employment", "Documents", "Loan Terms"],
  Business: ["Business information", "Directors & Applicant", "Documents", "Loan Terms"],
};

const STEP_ICONS: Record<LoanType, React.FC<any>[]> = {
  Personal: [IconUser, IconBriefcase, IconFileText, IconFileInvoice],
  Business: [IconBuilding, IconUsers, IconFileText, IconFileInvoice],
};

// --------------------------------------------------------
// Payload builders
// --------------------------------------------------------
// NOTE: "file" in the documents/business_documents arrays is expected by the
// backend to be a server-side file path (e.g. "/private/files/xyz.xlsx").
// There is no upload endpoint provided anywhere in the codebase shown, so the
// raw File objects cannot actually be turned into that path here. Until an
// upload API is wired up, the browser file name is sent as a placeholder so
// the shape of the payload matches exactly - this is called out explicitly
// rather than silently assumed.

function buildPersonalPayload(
  values: LoanApplicationValues,
  totalRepayable: number
): PersonalLoanApplication {
  const documents: PersonalLoanApplication["documents"] = [];

  if (values.payslips) {
    documents.push({
      document_for: "Personal",
      document_name: "Latest three payslips",
      file: values.payslips.name,
    });
  }
  if (values.bankStatementsPersonal) {
    documents.push({
      document_for: "Personal",
      document_name: "Bank statements (3 months)",
      file: values.bankStatementsPersonal.name,
    });
  }
  if (values.nrcCopy) {
    documents.push({
      document_for: "Personal",
      document_name: "NRC copy",
      file: values.nrcCopy.name,
    });
  }
  if (values.passportPhotoPersonal) {
    documents.push({
      document_for: "Personal",
      document_name: "Passport-sized photo",
      file: values.passportPhotoPersonal.name,
    });
  }
  if (values.tpinCertificate) {
    documents.push({
      document_for: "Personal",
      document_name: "TPIN certificate",
      file: values.tpinCertificate.name,
    });
  }

  return {
    application_type: "Personal Loan",
    application_date: new Date().toISOString().slice(0, 10),
    gender: values.gender ?? "",
    marital_status: values.maritalStatus ?? "",
    nationality: values.nationality ?? "",
    amount: String(values.loanAmount),
    tenure: String(values.tenureMonths),
    total_amount: String(totalRepayable),
    first_name: values.firstName,
    last_name: values.surname,
    phone: values.phone,
    email: values.email,
    national_registration_card: values.nrc,
    birth_date: values.birthDate,
    residential_address: values.residentialAddress,
    occupation: values.occupation,
    employer_name: values.employerName,
    loan_purpose: values.principalObjective,
    next_of_kin_relationship: values.kinRelationship,
    next_of_kin_name: values.kinName,
    next_of_kin_phone: values.kinPhone,
    next_of_kin_email: values.kinEmail,
    documents,
  };
}

function buildBusinessPayload(
  values: LoanApplicationValues,
  totalRepayable: number
): BusinessLoanApplication {
  const business_documents: BusinessLoanApplication["business_documents"] = [];

  if (values.pacraCertificate) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "PACRA certificate",
      file: values.pacraCertificate.name,
    });
  }
  if (values.form2) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Form 2",
      file: values.form2.name,
    });
  }
  if (values.taxClearanceCertificate) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Tax clearance certificate / TPIN",
      file: values.taxClearanceCertificate.name,
    });
  }
  if (values.taxComplianceReturn) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Latest tax compliance return",
      file: values.taxComplianceReturn.name,
    });
  }
  if (values.orderInvoice) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Order / Invoice",
      file: values.orderInvoice.name,
    });
  }
  if (values.bankStatementsBusiness) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Bank statements (6 months)",
      file: values.bankStatementsBusiness.name,
    });
  }
  if (values.applicantPassportPhoto) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Applicant Passport-sized photo",
      file: values.applicantPassportPhoto.name,
    });
  }
  if (values.boardResolution) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Board resolution",
      file: values.boardResolution.name,
    });
  }

  values.directorDocuments.forEach((doc, index) => {
    if (doc.nrcFile) {
      business_documents.push({
        document_for: "Director",
        document_name: `Director ${index + 1} NRC`,
        file: doc.nrcFile.name,
      });
    }
    if (doc.photoFile) {
      business_documents.push({
        document_for: "Director",
        document_name: `Director ${index + 1} passport photo`,
        file: doc.photoFile.name,
      });
    }
  });

  return {
    application_type: "Business Loan",
    application_date: new Date().toISOString().slice(0, 10),
    gender: values.applicantGender ?? "",
    marital_status: values.applicantMaritalStatus ?? "",
    nationality: values.applicantNationality ?? "",
    amount: String(values.loanAmount),
    tenure: String(values.tenureMonths),
    total_amount: String(totalRepayable),
    // The Business flow's form steps have no next-of-kin field, so there is
    // no source value for this - left empty rather than invented.
    next_of_kin_relationship: "",
    directors: values.directors.map((director) => ({
      director_name: director.name,
      director_phone: director.phone,
      director_email: director.email,
      national_registration_card: director.nrc,
    })),
    applicant_first_name: values.applicantFirstName,
    applicant_middle_name: values.applicantMiddleName,
    applicant_last_name: values.applicantLastName,
    applicant_phone: values.applicantPhone,
    applicant_email: values.applicantEmail,
    applicant_birth_date: values.applicantBirthDate,
    applicant_national_registration_card: values.applicantNrc,
    applicant_gender: values.applicantGender ?? "",
    applicant_marital_status: values.applicantMaritalStatus ?? "",
    applicant_nationality: values.applicantNationality ?? "",
    applicant_address: values.applicantAddress,
    applicant_position: values.applicantPosition,
    company_name: values.companyName,
    type_of_business: values.typeOfBusiness ?? "",
    established_date: values.establishedDate,
    nature_of_business: values.natureOfBusiness,
    registered_office: values.registeredOffice,
    purpose_of_loan: values.purposeOfLoan,
    collateral_pledged: values.collateralPledged,
    business_documents,
  };
}

interface LoanApplicationModalProps {
  opened: boolean;
  onClose: () => void;
}

export function LoanApplicationModal({ opened, onClose }: LoanApplicationModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [termsOpened, { open: openTerms, close: closeTerms }] = useDisclosure(false);
  const [successOpened, { open: openSuccess, close: closeSuccess }] = useDisclosure(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
const [loanTypeSelected, setLoanTypeSelected] = useState(false);
  const form = useForm<LoanApplicationValues>({ initialValues: INITIAL_VALUES });

  const loanType = form.values.loanType;
  const stepLabels = STEP_LABELS[loanType];

  const handleToggleLoanType = (value: string) => {
    const nextType = value as LoanType;
    form.setFieldValue("loanType", nextType);

    // Clamp loan amount into the new type's range so the Step 4 slider stays valid.
    const range = LOAN_RANGE[nextType];
    const amount = form.values.loanAmount;
    if (amount < range.min) form.setFieldValue("loanAmount", range.min);
    if (amount > range.max) form.setFieldValue("loanAmount", range.max);

    setActiveStep(0);
  };

 const handleReset = () => {
    form.setValues(INITIAL_VALUES);
    form.resetDirty(INITIAL_VALUES);
    setActiveStep(0);
    setAcceptedTerms(false);
    setLoanTypeSelected(false); // <-- Add this
  };

  const handleModalClose = () => {
    handleReset();
    closeTerms();
    closeSuccess();
    onClose();
  };

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleReviewTerms = () => {
    setAcceptedTerms(false);
    openTerms();
  };

  const tenure = Number(form.values.tenureMonths) || 0;
  // TODO: replace with real EMI/fee calculation once the API is wired up.
  const facilityFee = Math.round(form.values.loanAmount * 0.02 * 100) / 100;
  const totalInterest = Math.round(form.values.loanAmount * 0.24 * (tenure / 12) * 100) / 100;
  const totalRepayable = form.values.loanAmount + totalInterest + facilityFee;
  const monthlyRepayment = tenure ? Math.round((totalRepayable / tenure) * 100) / 100 : 0;

  const { mutate: submitLoanApplication, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: LoanApplicationPayload) => createLoanApplication(payload),
    onSuccess: () => {
      closeTerms();
      openSuccess();
    },
    onError: (error) => {
      console.error("Failed to submit loan application:", error);
    },
  });

  const handleAcceptTerms = () => {
    const payload: LoanApplicationPayload =
      loanType === "Personal"
        ? buildPersonalPayload(form.values, totalRepayable)
        : buildBusinessPayload(form.values, totalRepayable);

    submitLoanApplication(payload);
  };

  const handleFinish = () => {
    handleModalClose();
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <PersonalBusinessInfoStep form={form} loanType={loanType} />;
      case 1:
        return <ResidenceEmploymentStep form={form} loanType={loanType} />;
      case 2:
        return <DocumentsStep form={form} loanType={loanType} />;
      case 3:
        return <LoanTermsStep form={form} loanType={loanType} onReviewTerms={handleReviewTerms} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
      opened={opened}
      onClose={handleModalClose}
      size={1400}
      padding={0}
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "88vh",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
        <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* <ActionIcon
            variant="subtle"
            color="slate"
            radius="xl"
            size="md"
            onClick={handleModalClose}
            aria-label="Close"
            style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
          >
            <IconX size={16} />
          </ActionIcon> */}
             <Group
            justify="space-between"
            align="center"
            px="xl"
            py="sm"
            bg="brand.6"
            style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}
          >
            <Group gap="sm">
              <ThemeIcon radius="md" size={34} variant="white" color="brand">
                <IconFileText size={16} />
              </ThemeIcon>
              <Box>
                <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                  New Loan Application
                </Text>
                <Text size="xs" fw={500} c="brand.1">
                  Applicant, loan and repayment details
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={handleModalClose}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>

       <ScrollArea type="auto" scrollbarSize={8} style={{ flex: 1, minHeight: 0 }}>
            {!loanTypeSelected ? (
              // --- NEW PRE-SCREEN LOAN TYPE SELECTION ---
              <Box maw={640} mx="auto" px="xl" py={80}>
                <Text fz="xl" fw={800} c="slate.9" mb="xl" ta="center">
                  What type of loan are you applying for?
                </Text>

                <Group grow align="stretch" gap="lg" mb="xl">
                  {/* Personal Loan Card */}
                  <Box
                    component="button"
                    onClick={() => handleToggleLoanType("Personal")}
                    className="text-left p-6 rounded-xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: loanType === "Personal" ? "var(--mantine-color-brand-6)" : "var(--mantine-color-gray-3)",
                      backgroundColor: loanType === "Personal" ? "var(--mantine-color-brand-0)" : "white",
                    }}
                  >
                    <Text fz="lg" fw={700} c={loanType === "Personal" ? "brand.8" : "slate.9"} mb="xs">
                      Personal Loan
                    </Text>
                    <Text fz="sm" c={loanType === "Personal" ? "brand.7" : "slate.5"}>
                      For individual/personal borrowing
                    </Text>
                  </Box>

                  {/* Business Loan Card */}
                  <Box
                    component="button"
                    onClick={() => handleToggleLoanType("Business")}
                    className="text-left p-6 rounded-xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: loanType === "Business" ? "var(--mantine-color-brand-6)" : "var(--mantine-color-gray-3)",
                      backgroundColor: loanType === "Business" ? "var(--mantine-color-brand-0)" : "white",
                    }}
                  >
                    <Text fz="lg" fw={700} c={loanType === "Business" ? "brand.8" : "slate.9"} mb="xs">
                      Business Loan
                    </Text>
                    <Text fz="sm" c={loanType === "Business" ? "brand.7" : "slate.5"}>
                      For business-related borrowing
                    </Text>
                  </Box>
                </Group>

                <Group justify="center" mt="xl">
                  <Button
                    color="brand"
                    radius="md"
                    size="md"
                    onClick={() => setLoanTypeSelected(true)}
                    rightSection={<IconArrowRight size={18} />}
                  >
                    Continue
                  </Button>
                </Group>
              </Box>
            ) : (
              // --- EXISTING FORM CONTENT ---
              <Box px="xl" py="xl">
                {/* Loan type toggle (Optional: you can delete this segment control now if you don't want them to change it mid-way, or keep it as a fallback) */}
                {/* <Group gap="xs" mb="lg">
                  <Text fz="xs" fw={600} c="slate.6">
                    Loan type:
                  </Text>
                  <SegmentedControl
                    size="xs"
                    radius="xl"
                    color="brand"
                    value={loanType}
                    onChange={handleToggleLoanType}
                    data={[
                      { label: "Personal Loan", value: "Personal" },
                      { label: "Business Loan", value: "Business" },
                    ]}
                  />
                </Group> */}

                {/* Stepper tabs */}
                <Group gap="sm" wrap="nowrap" mb="lg" style={{ overflowX: "auto" }}>
                  {stepLabels.map((label, idx) => {
                    const isActive = activeStep === idx;
                    const isReached = idx <= activeStep;
                    const StepIcon = STEP_ICONS[loanType][idx];

                    return (
                      <Group key={label} gap="sm" wrap="nowrap">
                        <Group
                          gap="xs"
                          wrap="nowrap"
                          onClick={() => (isReached ? setActiveStep(idx) : undefined)}
                          px="md"
                          py={6}
                          style={{
                            cursor: isReached ? "pointer" : "default",
                            backgroundColor: isActive ? "white" : "transparent",
                            border: isActive ? "1px solid var(--mantine-color-gray-2)" : "1px solid transparent",
                            borderRadius: "8px",
                            boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <ThemeIcon
                            radius="xl"
                            size={28}
                            variant={isActive ? "filled" : "outline"}
                            color={isActive ? "brand" : "gray"}
                            style={{ borderWidth: isActive ? 0 : 1 }}
                          >
                            <StepIcon size={16} />
                          </ThemeIcon>
                          <Text
                            fz="sm"
                            fw={isActive ? 700 : 500}
                            c={isActive ? "brand.8" : "gray.6"}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {label}
                          </Text>
                        </Group>

                        {idx < stepLabels.length - 1 && (
                          <IconChevronRight size={16} color="var(--mantine-color-gray-4)" style={{ flexShrink: 0 }} />
                        )}
                      </Group>
                    );
                  })}
                </Group>

                {/* Step content card */}
                <Box className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
                  {renderStep()}
                </Box>
              </Box>
            )}
          </ScrollArea>

          {/* New Fixed Footer (Only visible when form is started) */}
          {loanTypeSelected && (
            <Group
              justify="space-between"
              align="center"
              px="xl"
              py="md"
              bg="white"
              style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}
            >
              <Group gap="lg">
                <Button variant="transparent" c="dark.8" px={0} fw={600} onClick={handleModalClose}>
                  Cancel
                </Button>
                <Divider orientation="vertical" />
                <Button variant="transparent" color="red.8" px={0} fw={600} onClick={handleReset}>
                  Reset Form
                </Button>
              </Group>

            <Group gap="md">
                <Button 
                  variant="default" 
                  radius="md" 
                  onClick={activeStep === 0 ? () => setLoanTypeSelected(false) : handleBack}
                >
                  Back
                </Button>
                
                <Button
                  color="brand"
                  radius="md"
                  onClick={activeStep < 3 ? handleNext : handleReviewTerms}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Save & Continue
                </Button>
              </Group>
            </Group>
          )}
        </Box>
      </Modal>

      {/* Terms & Conditions dialog */}
      <Modal
        opened={termsOpened}
        onClose={closeTerms}
        centered
        radius="lg"
        size={520}
        withCloseButton={false}
      >
        <Group justify="space-between" mb="xs">
          <Badge variant="light" color="brand" radius="sm" size="sm" tt="uppercase">
            Salary advance facility agreement
          </Badge>
          <ActionIcon variant="subtle" color="slate" onClick={closeTerms} aria-label="Close">
            <IconX size={16} />
          </ActionIcon>
        </Group>
        <Text fz="xl" fw={800} c="slate.9" mb="sm">
          Terms and conditions
        </Text>

        <Box className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <Text fz="sm" c="slate.7" mb="sm">
            This facility is offered to you as a pre-qualified existing customer. By accepting, you
            authorize the recovery of the total repayable amount from your nominated account.
          </Text>
          <Stack gap={4} component="ul" className="list-disc pl-4">
            <Text component="li" fz="sm" c="slate.7">
              Loan amount, facility fee, tenure and monthly repayment are as disclosed.
            </Text>
            <Text component="li" fz="sm" c="slate.7">
              Repayment is collected via standing order on the agreed date.
            </Text>
            <Text component="li" fz="sm" c="slate.7">
              The facility fee will be deducted together with the agreed advance amount.
            </Text>
            <Text component="li" fz="sm" c="slate.7">
              By accepting, you confirm that you understand and agree to the deduction authority.
            </Text>
          </Stack>

          <Checkbox
            mt="md"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
            label={
              <Text fz="sm" c="slate.7">
                I have read and accept the Facility Agreement, including the facility fee and deduction
                authority.
              </Text>
            }
          />
        </Box>

        <Button
          fullWidth
          color="brand"
          radius="md"
          mt="md"
          disabled={!acceptedTerms || isSubmitting}
          loading={isSubmitting}
          onClick={handleAcceptTerms}
        >
          Accept & continue
        </Button>
      </Modal>

      {/* Success dialog */}
      <Modal opened={successOpened} onClose={handleFinish} centered radius="lg" size={480} withCloseButton={false}>
        <Stack align="center" gap={4} mb="md">
          <ThemeIcon radius="xl" size={56} color="success" variant="light">
            <IconCheck size={28} />
          </ThemeIcon>
          <Text fz="xl" fw={800} c="slate.9" mt="xs">
            Application submitted
          </Text>
          <Text fz="sm" c="slate.5" ta="center">
            Your {loanType.toLowerCase()} loan request has been received successfully.
          </Text>
        </Stack>

        <Box className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <Group justify="space-between" py={4}>
            <Text fz="sm" c="slate.5">Loan type</Text>
            <Text fz="sm" fw={700} c="slate.8">{loanType} Loan</Text>
          </Group>
          <Group justify="space-between" py={4}>
            <Text fz="sm" c="slate.5">Loan amount</Text>
            <Text fz="sm" fw={700} c="slate.8">K{form.values.loanAmount.toLocaleString()}</Text>
          </Group>
          <Group justify="space-between" py={4}>
            <Text fz="sm" c="slate.5">Tenure</Text>
            <Text fz="sm" fw={700} c="slate.8">{tenure} months</Text>
          </Group>
          <Group justify="space-between" py={4}>
            <Text fz="sm" c="slate.5">Estimated monthly repayment</Text>
            <Text fz="sm" fw={700} c="slate.8">K{monthlyRepayment.toLocaleString()}</Text>
          </Group>
          <Group justify="space-between" py={4}>
            <Text fz="sm" c="slate.5">Total repayable</Text>
            <Text fz="sm" fw={700} c="slate.8">K{totalRepayable.toLocaleString()}</Text>
          </Group>
        </Box>

        <Button fullWidth color="brand" radius="md" mt="md" onClick={handleFinish}>
          Back to home
        </Button>
      </Modal>
    </>
  );
}