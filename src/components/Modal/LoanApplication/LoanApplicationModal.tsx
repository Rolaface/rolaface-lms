import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  Box,
  Group,
  Text,
  Button,
  ActionIcon,
  ScrollArea,
  ThemeIcon,
  Divider,UnstyledButton
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconX,
  IconFileText,
  IconChevronRight,
  IconUser,
  IconBuilding,
  IconBriefcase,
  IconFileInvoice,
  IconUsers,
  IconArrowRight,
  IconMinus,IconCheck
} from "@tabler/icons-react";
import { PersonalBusinessInfoStep } from "./PersonalBusinessInfoStep";
import { ResidenceEmploymentStep } from "./ResidenceEmploymentStep";
import { DocumentsStep } from "./DocumentsStep";
import { CustomerLoanStep } from "./CustomerLoanStep";
import { EligibilitySimulationStep } from "./EligibilitySimulationStep";
import { Review } from "./Review";
import {
  createLoanApplication,
  getLoanApplicationById,
  updateLoanApplication,
} from "../../../api/loanApplicationApi";
import type {
  LoanApplicationPayload,
  PersonalLoanApplication,
  BusinessLoanApplication,
} from "../../../types/loanApplicationForm";
import { uploadFile } from "../../../api/loanApi";
import { openCommonModal } from "../AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { ApplicationSummary } from "./ApplicationSummary";
import { EmploymentDetails } from "./EmploymentDetails";
import { Applicant } from "./Applicant";

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
  customerType: "existing" | "new" | null;
  selectedCustomerId: string;
  selectedOfferId: string;
  applicantType: LoanType | null;
  repaymentFrequency: "Monthly" | "Bi-weekly";
  firstName: string;
  middleName: string;
  surname: string;
  phone: string;
  email: string;
  nrc: string;
  gender: string | null;
  maritalStatus: string | null;
  birthDate: string;
  companyName: string;
  typeOfBusiness: string | null;
  establishedDate: string;
  natureOfBusiness: string;
  registeredOffice: string;
  collateralPledged: string;
  purposeOfLoan: string;
  residentialAddress: string;
  occupation: string;
  employerName: string;
  nationality: string | null;
  principalObjective: string;
  kinName: string;
  kinPhone: string;
  kinEmail: string;
  kinRelationship: string;
  directors: DirectorEntry[];
  directorsCount: string;
  directorsDocunentCount: string;
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
  payslips: File | null;
  bankStatementsPersonal: File | null;
  nrcCopy: File | null;
  passportPhotoPersonal: File | null;
  tpinCertificate: File | null;
  pacraCertificate: File | null;
  form2: File | null;
  taxClearanceCertificate: File | null;
  taxComplianceReturn: File | null;
  orderInvoice: File | null;
  bankStatementsBusiness: File | null;
  applicantPassportPhoto: File | null;
  boardResolution: File | null;
  directorDocuments: DirectorDocEntry[];
  loanAmount: number;
  tenureMonths: number | "";
}

const nextId = () => Math.random().toString(36).slice(2, 10);

const INITIAL_VALUES: LoanApplicationValues = {
  loanType: "Personal",
  customerType: null,
  selectedCustomerId: "",
  selectedOfferId: "",
  applicantType: "Personal",
  repaymentFrequency: "Monthly",
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
  directors: [],
  directorsCount: "",
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
  directorDocuments: [],
  directorsDocunentCount: "",
  loanAmount: 4000,
  tenureMonths: 6,
};

const LOAN_RANGE: Record<LoanType, { min: number; max: number }> = {
  Personal: { min: 500, max: 8000 },
  Business: { min: 5000, max: 50000 },
};

const STEP_LABELS: Record<LoanType, string[]> = {
  Personal: [
    "Customer & Loan",
    "Eligibility & Simulation",
    "Applicant information",
    "Residence Details",
    "Employment Details",
    "Documents",
    "Review",
  ],
  Business: [
    "Customer & Loan",
    "Eligibility & Simulation",
    "Business information",
    "Directors Details",
    "Applicant Details",
    "Documents",
    "Review",
  ],
};

const STEP_ICONS: Record<LoanType, React.FC<any>[]> = {
  Personal: [IconUsers, IconFileInvoice, IconUser, IconBriefcase, IconBriefcase, IconFileText, IconCheck],
  Business: [IconUsers, IconFileInvoice, IconBuilding, IconBuilding,IconUsers, IconFileText, IconCheck],
};

function buildPersonalPayload(
  values: LoanApplicationValues,
  totalRepayable: number,
  resolvedUrls: Record<string, string | null>,
): PersonalLoanApplication {
  const documents: PersonalLoanApplication["documents"] = [];

  if (values.payslips) {
    documents.push({
      document_for: "Personal",
      document_name: "Salary Slip",
      file: resolvedUrls.payslips as string,
    });
  }
  if (values.bankStatementsPersonal) {
    documents.push({
      document_for: "Personal",
      document_name: "Bank Statement",
      file: resolvedUrls.bankStatementsPersonal as string,
    });
  }
  if (values.nrcCopy) {
    documents.push({
      document_for: "Personal",
      document_name: "NRC Copy",
      file: resolvedUrls.nrcCopy as string,
    });
  }
  if (values.passportPhotoPersonal) {
    documents.push({
      document_for: "Personal",
      document_name: "Passport Photo",
      file: resolvedUrls.passportPhotoPersonal as string,
    });
  }
  if (values.tpinCertificate) {
    documents.push({
      document_for: "Personal",
      document_name: "TPIN Certificate",
      file: resolvedUrls.tpinCertificate as string,
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
  totalRepayable: number,
  resolvedUrls: Record<string, string | null>,
): BusinessLoanApplication {
  const business_documents: BusinessLoanApplication["business_documents"] = [];

  if (values.pacraCertificate) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "PACRA Certificate",
      file: resolvedUrls.pacraCertificate as string,
    });
  }
  if (values.form2) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Form 2",
      file: resolvedUrls.form2 as string,
    });
  }
  if (values.taxClearanceCertificate) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Tax Clearance Certificate",
      file: resolvedUrls.taxClearanceCertificate as string,
    });
  }
  if (values.taxComplianceReturn) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Latest Tax Compliance Return",
      file: resolvedUrls.taxComplianceReturn as string,
    });
  }
  if (values.orderInvoice) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Order/Invoice",
      file: resolvedUrls.orderInvoice as string,
    });
  }
  if (values.bankStatementsBusiness) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Bank Statements",
      file: resolvedUrls.bankStatementsBusiness as string,
    });
  }
  if (values.applicantPassportPhoto) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Passport Photo",
      file: resolvedUrls.applicantPassportPhoto as string,
    });
  }
  if (values.boardResolution) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Board resolution",
      file: resolvedUrls.boardResolution as string,
    });
  }

  values.directorDocuments.forEach((doc, index) => {
    if (doc.nrcFile) {
      business_documents.push({
        document_for: "Director",
        document_name: `Director ${index + 1} NRC`,
        file: resolvedUrls[`directorDocuments.${index}.nrcFile`] as string,
      });
    }
    if (doc.photoFile) {
      business_documents.push({
        document_for: "Director",
        document_name: `Director ${index + 1} Passport Photo`,
        file: resolvedUrls[`directorDocuments.${index}.photoFile`] as string,
      });
    }
  });
  return {
    application_type: "Business Loan",
    application_date: new Date().toISOString().slice(0, 10),
    gender: values.applicantGender ?? "",
    // marital_status: values.applicantMaritalStatus ?? "",
    nationality: values.applicantNationality ?? "",
    amount: String(values.loanAmount),
    tenure: String(values.tenureMonths),
    total_amount: String(totalRepayable),
    // next_of_kin_relationship: "",
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
  onMinimize: () => void;
  onExited?: () => void;
  loanApplicationId?: string | null;
  readOnly?: boolean;
  embedded?: boolean;
  initialValues?: LoanApplicationValues;
}

export function LoanApplicationModal({
  opened,
  onClose,
  onMinimize,
  onExited,
  loanApplicationId,
  readOnly = false,
  embedded = false,
  initialValues,
}: LoanApplicationModalProps) {
  const originalDocumentUrls = useRef<Record<string, string>>({});
  const [directorsError, setDirectorsError] = useState<string | null>(null);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [directorDocsError, setDirectorDocsError] = useState<string | null>(
    null,
  );
  const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  const isAllowedFileType = (file: File | null) =>
    !file || ALLOWED_FILE_TYPES.includes(file.type);
  const [loanTypeSelected, setLoanTypeSelected] = useState(true);
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const form = useForm<LoanApplicationValues>({
    initialValues: embedded && initialValues ? initialValues : INITIAL_VALUES,
    validate: {
      firstName: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      surname: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      phone: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      birthDate: (v, values) =>
        values.loanType === "Personal" && !v ? "Required" : null,
      nrc: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      email: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v?.trim()) return "Required";
        if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
        return null;
      },
      gender: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      maritalStatus: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,

      // --- Personal Employment ---
      residentialAddress: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      occupation: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      employerName: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      principalObjective: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      kinName: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      kinPhone: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      kinRelationship: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      nationality: (v, values) =>
        values.loanType === "Personal" && !v?.trim() ? "Required" : null,
      kinEmail: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v?.trim()) return "Required";
        if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
        return null;
      },
      applicantEmail: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v?.trim()) return "Required";
        if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
        return null;
      },

      // --- Personal Docs ---
      // payslips: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
      // bankStatementsPersonal: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
      // nrcCopy: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
      // passportPhotoPersonal: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
      // tpinCertificate: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
      payslips: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      bankStatementsPersonal: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      nrcCopy: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      passportPhotoPersonal: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      tpinCertificate: (v, values) => {
        if (values.loanType !== "Personal") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },

      // --- Business Base ---
      companyName: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      establishedDate: (v, values) =>
        values.loanType === "Business" && !v ? "Required" : null,
      natureOfBusiness: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      registeredOffice: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      purposeOfLoan: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      typeOfBusiness: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      collateralPledged: (v, values) =>
        values.loanType === "Business" && !String(v ?? "").trim()
          ? "Required"
          : null,
      // --- Business Applicant ---
      applicantFirstName: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantLastName: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantPhone: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantNrc: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantBirthDate: (v, values) =>
        values.loanType === "Business" && !v ? "Required" : null,
      applicantAddress: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantPosition: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantGender: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantMaritalStatus: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,
      applicantNationality: (v, values) =>
        values.loanType === "Business" && !v?.trim() ? "Required" : null,

      pacraCertificate: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      form2: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      taxClearanceCertificate: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      taxComplianceReturn: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      bankStatementsBusiness: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      applicantPassportPhoto: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },
      boardResolution: (v, values) => {
        if (values.loanType !== "Business") return null;
        if (!v) return "Required";
        if (!isAllowedFileType(v))
          return "Only PDF, JPEG, or JPG files are allowed";
        return null;
      },

      // --- Array Validations (Business) ---
      directors: {
        name: (v, values) =>
          values.loanType === "Business" && !v?.trim() ? "Required" : null,
        phone: (v, values) =>
          values.loanType === "Business" && !v?.trim() ? "Required" : null,
        email: (v, values) => {
          if (values.loanType !== "Business") return null;
          if (!v?.trim()) return "Required";
          if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
          return null;
        },
        nrc: (v, values) =>
          values.loanType === "Business" && !v?.trim() ? "Required" : null,
      },
      directorsCount: (v, values) =>
        values.loanType === "Business" && values.directors.length === 0
          ? "Please add at least one director"
          : null,
      // directorDocuments: {
      //   nrcFile: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
      //   photoFile: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
      // },
      directorDocuments: {
        nrcFile: (v, values) => {
          if (values.loanType !== "Business") return null;
          if (!v) return "Required";
          if (!isAllowedFileType(v))
            return "Only PDF, JPEG, or JPG files are allowed";
          return null;
        },
        photoFile: (v, values) => {
          if (values.loanType !== "Business") return null;
          if (!v) return "Required";
          if (!isAllowedFileType(v))
            return "Only PDF, JPEG, or JPG files are allowed";
          return null;
        },
      },
    },
  });

  const loanType = form.values.loanType;
  const stepLabels = STEP_LABELS[loanType];
  const handleToggleLoanType = (value: string) => {
    const nextType = value as LoanType;
    form.setFieldValue("loanType", nextType);
    form.setFieldValue("applicantType", nextType);

    const range = LOAN_RANGE[nextType];
    const amount = form.values.loanAmount;
    if (amount < range.min) form.setFieldValue("loanAmount", range.min);
    if (amount > range.max) form.setFieldValue("loanAmount", range.max);

    setActiveStep(0);
  };

 const handleReset = () => {
    form.setValues(INITIAL_VALUES);
    form.resetDirty(INITIAL_VALUES);
    setDirectorDocsError(null);
    setDirectorsError(null);
    setActiveStep(0);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };
  const handleNext = () => {
    let hasError = false;
    let fieldsToValidate: string[] = [];

    if (activeStep === 0) {
      if (!form.values.customerType) {
        hasError = true;
      } else if (form.values.customerType === "existing" && !form.values.selectedCustomerId) {
        hasError = true;
      } else if (form.values.customerType === "new" && !form.values.applicantType) {
        hasError = true;
      }
    }

    if (activeStep === 1) {
      if (!form.values.loanAmount || !form.values.tenureMonths) hasError = true;
    }

    if (loanType === "Personal") {
      if (activeStep === 2) fieldsToValidate = ["firstName", "surname", "phone", "email", "nrc", "gender", "maritalStatus", "birthDate"];
      if (activeStep === 3) fieldsToValidate = ["residentialAddress", "occupation", "employerName", "principalObjective", "kinName", "kinPhone", "kinRelationship", "kinEmail", "nationality"];
      // Step 4 is EmploymentDetails - validation handles dynamically
      if (activeStep === 5) fieldsToValidate = ["payslips", "bankStatementsPersonal", "nrcCopy", "passportPhotoPersonal", "tpinCertificate"];
    } else {
      if (activeStep === 2) fieldsToValidate = ["companyName", "typeOfBusiness", "establishedDate", "natureOfBusiness", "registeredOffice", "collateralPledged", "purposeOfLoan"];
      if (activeStep === 4) fieldsToValidate = ["applicantFirstName", "applicantLastName", "applicantPhone", "applicantEmail", "applicantNrc", "applicantBirthDate", "applicantAddress", "applicantPosition", "applicantGender", "applicantMaritalStatus", "applicantNationality"];
      if (activeStep === 5) fieldsToValidate = ["pacraCertificate", "form2", "taxClearanceCertificate", "taxComplianceReturn", "bankStatementsBusiness", "applicantPassportPhoto", "boardResolution"];
    }

    if (loanType === "Business" && activeStep === 5) {
      if (form.values.directorDocuments.length === 0) {
        hasError = true;
        setDirectorDocsError("Please add at least one director's documents");
      } else {
        setDirectorDocsError(null);
      }
    }

    fieldsToValidate.forEach((field) => {
      if (form.validateField(field).hasError) hasError = true;
    });

    if (loanType === "Business") {
      if (activeStep === 3) {
        if (form.values.directors.length === 0) {
          hasError = true;
          setDirectorsError("Please add at least one director");
        } else {
          setDirectorsError(null);
        }
        form.values.directors.forEach((_, i) => {
          if (form.validateField(`directors.${i}.name`).hasError) hasError = true;
          if (form.validateField(`directors.${i}.phone`).hasError) hasError = true;
          if (form.validateField(`directors.${i}.email`).hasError) hasError = true;
          if (form.validateField(`directors.${i}.nrc`).hasError) hasError = true;
        });
      }
      if (activeStep === 5) {
        form.values.directorDocuments.forEach((_, i) => {
          if (form.validateField(`directorDocuments.${i}.nrcFile`).hasError) hasError = true;
          if (form.validateField(`directorDocuments.${i}.photoFile`).hasError) hasError = true;
        });
      }
    }

    if (!hasError) {
      setActiveStep((s) => Math.min(s + 1, 6)); // Max step is now 6
    }
  };
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const tenure = Number(form.values.tenureMonths) || 0;
  const facilityFee = Math.round(form.values.loanAmount * 0.02 * 100) / 100;
  const totalInterest =
    Math.round(form.values.loanAmount * 0.24 * (tenure / 12) * 100) / 100;
  const totalRepayable = form.values.loanAmount + totalInterest + facilityFee;
  const monthlyRepayment = tenure
    ? Math.round((totalRepayable / tenure) * 100) / 100
    : 0;

  const { data: existingApplicationData, refetch: refetchLoanApplication } =
    useQuery({
      queryKey: ["loan-application", loanApplicationId],
      queryFn: () => getLoanApplicationById(loanApplicationId as string),
      enabled: !!loanApplicationId,
    });
  useEffect(() => {
    if (loanApplicationId) {
      refetchLoanApplication();
    }
  }, [loanApplicationId, refetchLoanApplication]);

  const getMimeTypeFromFileName = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "application/pdf";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    return "";
  };

  useEffect(() => {
    const application = existingApplicationData?.message?.data;
    if (!application) return;

    const isBusinessType = application.application_type === "Business Loan";
    const getDocFile = (
      docsArray: any[],
      documentNames: string[],
      key?: string,
    ) => {
      if (!docsArray) return null;
      const doc = docsArray.find((d: any) =>
        documentNames.includes(d.document_name),
      );
      // if (doc && doc.file) {
      //   const fileName = doc.file.split('/').pop() || doc.file;
      //   if (key) originalDocumentUrls.current[key] = doc.file;
      //   return new File([""], fileName);
      // }
      if (doc && doc.file) {
        const fileName = doc.file.split("/").pop() || doc.file;
        if (key) originalDocumentUrls.current[key] = doc.file;
        return new File([""], fileName, {
          type: getMimeTypeFromFileName(fileName),
        });
      }
      return null;
    };
    const pDocs = application.documents || [];
    const bDocs = application.business_documents || [];
    const extractedDirectorDocs: DirectorDocEntry[] = [];

    for (let i = 1; i <= 3; i++) {
      const nrc = getDocFile(
        bDocs,
        [`Director ${i} NRC`],
        `directorDocuments.${i - 1}.nrcFile`,
      );
      const photo = getDocFile(
        bDocs,
        [`Director ${i} Passport Photo`],
        `directorDocuments.${i - 1}.photoFile`,
      );
      if (nrc || photo) {
        extractedDirectorDocs.push({
          id: nextId(),
          nrcFile: nrc,
          photoFile: photo,
        });
      }
    }

    form.setValues({
      ...INITIAL_VALUES,
      loanType: isBusinessType ? "Business" : "Personal",
      firstName: application.first_name || "",
      middleName: application.middle_name || "",
      surname: application.last_name || "",
      phone: application.phone || "",
      email: application.email || "",
      nrc: application.national_registration_card || "",
      gender: application.gender || null,
      maritalStatus: application.marital_status || null,
      birthDate: application.birth_date || "",
      residentialAddress: application.residential_address || "",
      occupation: application.occupation || "",
      employerName: application.employer_name || "",
      nationality: application.nationality || null,
      principalObjective: application.loan_purpose || "",
      kinName: application.next_of_kin_name || "",
      kinPhone: application.next_of_kin_phone || "",
      kinEmail: application.next_of_kin_email || "",
      kinRelationship: application.next_of_kin_relationship || "",

      companyName: application.company_name || "",
      typeOfBusiness: application.type_of_business || null,
      establishedDate: application.established_date || "",
      natureOfBusiness: application.nature_of_business || "",
      registeredOffice: application.registered_office || "",
      collateralPledged: application.collateral_pledged || "",
      purposeOfLoan: application.purpose_of_loan || "",

      payslips: getDocFile(
        pDocs,
        ["Latest three payslips", "Salary Slip"],
        "payslips",
      ),
      bankStatementsPersonal: getDocFile(
        pDocs,
        ["Bank statements (3 months)", "Bank Statement"],
        "bankStatementsPersonal",
      ),
      nrcCopy: getDocFile(pDocs, ["NRC copy", "NRC Copy"], "nrcCopy"),
      passportPhotoPersonal: getDocFile(
        pDocs,
        ["Passport-sized photo", "Passport Photo"],
        "passportPhotoPersonal",
      ),
      tpinCertificate: getDocFile(
        pDocs,
         ["TPIN certificate", "TPIN Certificate"],
        "tpinCertificate",
      ),

      // Business Documents
      pacraCertificate: getDocFile(
        bDocs,
        ["PACRA certificate", "PACRA Certificate"],
        "pacraCertificate",
      ),
      form2: getDocFile(bDocs, ["Form 2"], "form2"),
      taxClearanceCertificate: getDocFile(
        bDocs,
        ["Tax clearance certificate / TPIN", "Tax Clearance Certificate"],
        "taxClearanceCertificate",
      ),
      taxComplianceReturn: getDocFile(
        bDocs,
         ["Latest tax compliance return", "Latest Tax Compliance Return"],
        "taxComplianceReturn",
      ),
      orderInvoice: getDocFile(bDocs, ["Order / Invoice", "Order/Invoice"], "orderInvoice"),
      bankStatementsBusiness: getDocFile(
        bDocs,
        ["Bank statements (6 months)", "Bank Statements"],
        "bankStatementsBusiness",
      ),
      applicantPassportPhoto: getDocFile(
        bDocs,
        ["Applicant Passport-sized photo", "Passport Photo"],
        "applicantPassportPhoto",
      ),
      boardResolution: getDocFile(
        bDocs,
         ["Board resolution", "Board Resolution"],
        "boardResolution",
      ),

      applicantFirstName: application.applicant_first_name || "",
      applicantMiddleName: application.applicant_middle_name || "",
      applicantLastName: application.applicant_last_name || "",
      applicantPhone: application.applicant_phone || "",
      applicantEmail: application.applicant_email || "",
      applicantNrc: application.applicant_national_registration_card || "",
      applicantGender: application.applicant_gender || null,
      applicantMaritalStatus: application.applicant_marital_status || null,
      applicantBirthDate: application.applicant_birth_date || "",
      applicantAddress: application.applicant_address || "",
      applicantPosition: application.applicant_position || "",
      applicantNationality: application.applicant_nationality || null,
      loanAmount: Number(application.amount) || 0,
      tenureMonths: Number(application.tenure) || "",
      directors: (application.directors?.length
        ? application.directors
        : []
      ).map((d: any) => ({
        id: d.name || nextId(),
        name: d.director_name || "",
        phone: d.director_phone || "",
        email: d.director_email || "",
        nrc: d.national_registration_card || "",
      })),

      directorDocuments: extractedDirectorDocs,
    });

    if (!application.directors || application.directors.length === 0) {
      form.setFieldValue("directors", [
        { id: nextId(), name: "", phone: "", email: "", nrc: "" },
      ]);
    }

    setLoanTypeSelected(true);
    setActiveStep(0);
  }, [existingApplicationData]);

  const { mutate: submitLoanApplication, isPending: isSubmitting } =
    useMutation({
      mutationFn: (payload: LoanApplicationPayload) =>
        createLoanApplication(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
        handleModalClose();
        showSuccess(
          "Application Submitted",
          "The new loan application has been created successfully.",
        );
      },
      onError: (error: any) => {
        openCommonModal({
          heading: "Action Failed",
          subtitle: "We couldn't complete your request.",
          body: parseFrappeError(error),
          color: "red",

          buttons: [
            {
              label: "Close",
              color: "red",
            },
          ],
        });
      },
    });

  const { mutate: updateLoanApplicationMutation, isPending: isUpdating } =
    useMutation({
      mutationFn: updateLoanApplication,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
        handleModalClose();
        showSuccess(
          "Application Updated",
          `Loan Application ${loanApplicationId} has been updated successfully.`,
        );
      },
      onError: (error: any) => {
        openCommonModal({
          heading: "Action Failed",
          subtitle: "We couldn't complete your request.",
          body: parseFrappeError(error),
          color: "red",

          buttons: [
            {
              label: "Close",
              color: "red",
            },
          ],
        });
      },
    });

  const resolveDocumentUrl = async (
    file: File | null,
    fieldPath: string,
  ): Promise<string | null> => {
    if (!file) return null;
    const isDirty = form.isDirty(fieldPath);
    const existingUrl = originalDocumentUrls.current[fieldPath];
    if (!isDirty && existingUrl) {
      return existingUrl;
    }
    if ((!isDirty || file.size === 0) && existingUrl) {
      return existingUrl;
    }

    const { file_url } = await uploadFile(file);
    return file_url;
  };

  const handleSubmitApplication = async () => {
    const fieldsToResolve: [string, File | null][] =
      loanType === "Personal"
        ? [
            ["payslips", form.values.payslips],
            ["bankStatementsPersonal", form.values.bankStatementsPersonal],
            ["nrcCopy", form.values.nrcCopy],
            ["passportPhotoPersonal", form.values.passportPhotoPersonal],
            ["tpinCertificate", form.values.tpinCertificate],
          ]
        : [
            ["pacraCertificate", form.values.pacraCertificate],
            ["form2", form.values.form2],
            ["taxClearanceCertificate", form.values.taxClearanceCertificate],
            ["taxComplianceReturn", form.values.taxComplianceReturn],
            ["orderInvoice", form.values.orderInvoice],
            ["bankStatementsBusiness", form.values.bankStatementsBusiness],
            ["applicantPassportPhoto", form.values.applicantPassportPhoto],
            ["boardResolution", form.values.boardResolution],
            ...form.values.directorDocuments.flatMap((doc, index) => [
              [`directorDocuments.${index}.nrcFile`, doc.nrcFile] as [
                string,
                File | null,
              ],
              [`directorDocuments.${index}.photoFile`, doc.photoFile] as [
                string,
                File | null,
              ],
            ]),
          ];

    setIsUploadingDocs(true);
    try {
      const resolvedUrls: Record<string, string | null> = {};
      for (const [key, file] of fieldsToResolve) {
        resolvedUrls[key] = await resolveDocumentUrl(file, key);
      }

      const payload: LoanApplicationPayload =
        loanType === "Personal"
          ? buildPersonalPayload(form.values, totalRepayable, resolvedUrls)
          : buildBusinessPayload(form.values, totalRepayable, resolvedUrls);

      if (loanApplicationId) {
        updateLoanApplicationMutation({ id: loanApplicationId, payload });
      } else {
        submitLoanApplication(payload);
      }
    } finally {
      setIsUploadingDocs(false);
    }
  };

   const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <CustomerLoanStep form={form} readOnly={readOnly} />;
      case 1:
        return <EligibilitySimulationStep form={form} readOnly={readOnly} />;
      case 2:
        return (
          <PersonalBusinessInfoStep
            form={form}
            loanType={loanType}
            readOnly={readOnly}
          />
        );
      case 3:
        return (
          <ResidenceEmploymentStep
            form={form}
            loanType={loanType}
            directorsError={directorsError}
            readOnly={readOnly}
          />
        );
      case 4:
        return loanType === "Personal" ? (
          <EmploymentDetails form={form} readOnly={readOnly} />
        ) : (
          <Applicant form={form} readOnly={readOnly} />
        );
      case 5:
        return (
          <DocumentsStep
            form={form}
            loanType={loanType}
            directorDocsError={directorDocsError}
            originalDocumentUrls={originalDocumentUrls.current}
            readOnly={readOnly}
          />
        );
      case 6:
        return <Review form={form} loanType={loanType} />;
      default:
        return null;
    }
  };
    const bodyContent = (
        <Box
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
  {/* return (
    <>
      <Modal
        opened={opened}
        onClose={handleModalClose}
        transitionProps={{
          onExited: () => {
            onExited?.();
          },
        }}
        size={1400}
        padding={0}
        lockScroll
        closeOnClickOutside={false}
        closeOnEscape={false}
        styles={{
          content: {
            height: "92vh",
            maxHeight: "95vh",
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
        <Box
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        > */}
         {!embedded && (
          <Group
            justify="space-between"
            align="center"
            px="xl"
            py="sm"
            bg="brand.6"
            style={{
              borderBottom: "1px solid var(--mantine-color-brand-7)",
              flexShrink: 0,
            }}
          >
            <Group gap="sm">
              <ThemeIcon radius="md" size={34} variant="white" color="brand">
                <IconFileText size={16} />
              </ThemeIcon>
              <Box>
                <Text
                  size="md"
                  fw={700}
                  c="white"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {loanApplicationId
                    ? "Update Loan Application"
                    : "New Loan Application"}
                </Text>
                <Text size="xs" fw={500} c="brand.1">
                  Applicant, loan and repayment details
                </Text>
              </Box>
            </Group>
                        {!embedded && (
              <Group gap="xs" wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  color="white"
                  radius="xl"
                  size="md"
                  onClick={onMinimize}
                  aria-label="Minimize"
                >
                  <IconMinus size={16} color="white" />
                </ActionIcon>

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
            )}
          </Group>
        )}
                    <Box
            px="md"
            py={6}
            style={{
              borderBottom: "1px solid var(--mantine-color-slate-2)",
              flexShrink: 0,
            }}
            bg="slate.0"
          >
            <ScrollArea type="auto" scrollbarSize={4} offsetScrollbars={false}>
              <Group gap={18} wrap="nowrap">
                {stepLabels.map((label, idx) => {
                  const isActive = activeStep === idx;
                  const isComplete = idx < activeStep;
                  const StepIcon = STEP_ICONS[loanType][idx];
                  return (
                    <Group key={label} gap={18} wrap="nowrap">
                      <UnstyledButton
                        type="button"
                        onClick={() => setActiveStep(idx)}
                        px={14}
                        py={7}
                        style={{
                          borderRadius: "var(--mantine-radius-sm)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          background: isActive ? "var(--mantine-color-white)" : "transparent",
                          boxShadow: isActive ? "var(--mantine-shadow-sm)" : "none",
                          border: isActive
                            ? "1px solid var(--mantine-color-slate-2)"
                            : "1px solid transparent",
                          transition: "background-color 120ms ease, box-shadow 120ms ease",
                        }}
                      >
                        <Group gap={6} wrap="nowrap">
                          <ThemeIcon
                            radius="xl"
                            size={20}
                            variant={isActive || isComplete ? "filled" : "outline"}
                            color={isActive || isComplete ? "brand" : "slate"}
                            style={{ flexShrink: 0 }}
                          >
                            {isComplete ? <IconCheck size={10} /> : <StepIcon size={10} />}
                          </ThemeIcon>
                          <Text
                            size="xs"
                            fw={isActive ? 700 : 500}
                            c={isActive ? "brand.7" : isComplete ? "slate.7" : "slate.5"}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {label}
                          </Text>
                        </Group>
                      </UnstyledButton>
                      {idx < stepLabels.length - 1 && (
                        <IconChevronRight
                          size={11}
                          color="var(--mantine-color-slate-3)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </Group>
                  );
                })}
              </Group>
            </ScrollArea>
          </Box>

          <Box
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
            }}
          >
          <ScrollArea type="hover" scrollbarSize={6} style={{ flex: 1, minHeight: 0 }}>
              <Box px="xl" py="xl" style={{ flex: 1, minWidth: 0 }}>
                <Box className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
                  {renderStep()}
                </Box>
              </Box>
          </ScrollArea>

            {loanTypeSelected && !readOnly &&  (
              <ApplicationSummary
                values={form.values}
                totalRepayable={totalRepayable}
                monthlyRepayment={monthlyRepayment}
                activeStep={activeStep}
              />
            )}
          </Box>
          {loanTypeSelected && !readOnly && (
            <Group
              justify="space-between"
              align="center"
              px="xl"
              py="md"
              bg="white"
              style={{
                borderTop: "1px solid var(--mantine-color-gray-2)",
                flexShrink: 0,
              }}
            >
              <Group gap="lg">
                <Button
                  variant="transparent"
                  c="dark.8"
                  px={0}
                  fw={600}
                  onClick={handleModalClose}
                >
                  Cancel
                </Button>
                <Divider orientation="vertical" />
                <Button
                  variant="transparent"
                  color="red.8"
                  px={0}
                  fw={600}
                  onClick={handleReset}
                >
                  Reset Form
                </Button>
              </Group>

                  <Group gap="md">
            {activeStep > 0 && (
  <Button 
    variant="default" 
    radius="md" 
    onClick={handleBack}
  >
    Back
  </Button>
            )}
 <Button
                  color="brand"
                  radius="md"
                  onClick={
                    activeStep < 6 ? handleNext : handleSubmitApplication
                  }
                  loading={
                    activeStep === 6 &&
                    (isUploadingDocs || isSubmitting || isUpdating)
                  }
                  rightSection={<IconArrowRight size={16} />}
                >
                  {activeStep < 6
                    ? "Save & Continue"
                    : loanApplicationId
                      ? "Update Application"
                      : "Save Application"}
                </Button>
              </Group>
            </Group>
          )}
                </Box>
  );

  if (embedded) {
    return (
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        {bodyContent}
      </Box>
    );
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleModalClose}
        transitionProps={{
          onExited: () => {
            onExited?.();
          },
        }}
        // size={1400}
         size="90vw"
        padding={0}
        lockScroll
        closeOnClickOutside={false}
        closeOnEscape={false}
        // styles={{
        //   content: {
        //     height: "92vh",
        //     maxHeight: "95vh",
        //     display: "flex",
        //     flexDirection: "column",
        //     overflow: "hidden",
        //   },
         styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "90vw",
          maxWidth: "1600px",
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
        {bodyContent}
      </Modal>
    </>
  );
}