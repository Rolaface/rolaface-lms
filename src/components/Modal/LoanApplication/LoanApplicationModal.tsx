import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { createLoanApplication, getLoanApplicationById, updateLoanApplication } from "../../../api/loanApplicationApi";
import type {
  LoanApplicationPayload,
  PersonalLoanApplication,
  BusinessLoanApplication,
} from "../../../types/loanApplicationForm";
import { useCompanyStore } from "../../../store/companyStore";
import { getSymbol } from "../../../store/currencyStore";
import { uploadFile } from "../../../api/loanApi";

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

function buildPersonalPayload(
  values: LoanApplicationValues,
  totalRepayable: number,
  resolvedUrls: Record<string, string | null>
): PersonalLoanApplication {
  const documents: PersonalLoanApplication["documents"] = [];

  if (values.payslips) {
    documents.push({
      document_for: "Personal",
      document_name: "Latest three payslips",
      file: resolvedUrls.payslips as string,
    });
  }
  if (values.bankStatementsPersonal) {
    documents.push({
      document_for: "Personal",
      document_name: "Bank statements (3 months)",
      file: resolvedUrls.bankStatementsPersonal as string,
    });
  }
  if (values.nrcCopy) {
    documents.push({
      document_for: "Personal",
      document_name: "NRC copy",
      file: resolvedUrls.nrcCopy as string,
    });
  }
  if (values.passportPhotoPersonal) {
    documents.push({
      document_for: "Personal",
      document_name: "Passport-sized photo",
      file: resolvedUrls.passportPhotoPersonal as string,
    });
  }
  if (values.tpinCertificate) {
    documents.push({
      document_for: "Personal",
      document_name: "TPIN certificate",
      file: resolvedUrls.tpinCertificate as string,
    });
  }
  // ...rest of the return object stays exactly the same

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
  resolvedUrls: Record<string, string | null>
): BusinessLoanApplication {
  const business_documents: BusinessLoanApplication["business_documents"] = [];

  if (values.pacraCertificate) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "PACRA certificate",
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
      document_name: "Tax clearance certificate / TPIN",
      file: resolvedUrls.taxClearanceCertificate as string,
    });
  }
  if (values.taxComplianceReturn) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Latest tax compliance return",
      file: resolvedUrls.taxComplianceReturn as string,
    });
  }
  if (values.orderInvoice) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Order / Invoice",
      file: resolvedUrls.orderInvoice as string,
    });
  }
  if (values.bankStatementsBusiness) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Bank statements (6 months)",
      file: resolvedUrls.bankStatementsBusiness as string,
    });
  }
  if (values.applicantPassportPhoto) {
    business_documents.push({
      document_for: "Applicant",
      document_name: "Applicant Passport-sized photo",
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
        document_name: `Director ${index + 1} passport photo`,
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
  loanApplicationId?: string | null;
}

export function LoanApplicationModal({ opened, onClose, loanApplicationId }: LoanApplicationModalProps) {
  const originalDocumentUrls = useRef<Record<string, string>>({});
const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
// const [loanTypeSelected, setLoanTypeSelected] = useState(false);
const [loanTypeSelected, setLoanTypeSelected] = useState(!!loanApplicationId);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  

  const form = useForm<LoanApplicationValues>({ 
  initialValues: INITIAL_VALUES,
  validate: {
    firstName: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    surname: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    phone: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
      birthDate: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
    nrc: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    email: (v, values) => {
      if (values.loanType !== "Personal") return null;
      if (!v?.trim()) return "Required";
      if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
      return null;
    },
    gender: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
maritalStatus: (v, values) => values.loanType === "Personal" && !v?.trim() ? "Required" : null,
    
    // --- Personal Employment ---
    residentialAddress: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    occupation: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    employerName: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    principalObjective: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    kinName: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    kinPhone: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    kinRelationship: (v, values) => (values.loanType === "Personal" && !v?.trim() ? "Required" : null),
    nationality: (v, values) => values.loanType === "Personal" && !v?.trim() ? "Required" : null,
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
    payslips: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
    bankStatementsPersonal: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
    nrcCopy: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
    passportPhotoPersonal: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),
    tpinCertificate: (v, values) => (values.loanType === "Personal" && !v ? "Required" : null),

    // --- Business Base ---
    companyName: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    establishedDate: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    natureOfBusiness: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    registeredOffice: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    purposeOfLoan: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    
    // --- Business Applicant ---
    applicantFirstName: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    applicantLastName: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    applicantPhone: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    applicantNrc: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    applicantBirthDate: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    applicantAddress: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    applicantPosition: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    
    // --- Business Docs ---
    pacraCertificate: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    form2: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    taxClearanceCertificate: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    taxComplianceReturn: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    bankStatementsBusiness: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    applicantPassportPhoto: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    boardResolution: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),

    // --- Array Validations (Business) ---
    directors: {
      name: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
      phone: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
      nrc: (v, values) => (values.loanType === "Business" && !v?.trim() ? "Required" : null),
    },
    directorDocuments: {
      nrcFile: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
      photoFile: (v, values) => (values.loanType === "Business" && !v ? "Required" : null),
    },
  }
});

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
    setLoanTypeSelected(false);
  };

const handleModalClose = () => {
  handleReset();
  onClose();
};
  const handleNext = () => {
  let hasError = false;
  let fieldsToValidate: string[] = [];
  
  if (loanType === "Personal") {
    if (activeStep === 0) fieldsToValidate = ["firstName", "surname", "phone", "email", "nrc", "gender", "maritalStatus", "birthDate"];
    if (activeStep === 1) fieldsToValidate = ["residentialAddress", "occupation", "employerName", "principalObjective", "kinName", "kinPhone", "kinRelationship", "kinEmail", "nationality"];
    if (activeStep === 2) fieldsToValidate = ["payslips", "bankStatementsPersonal", "nrcCopy", "passportPhotoPersonal", "tpinCertificate"];
  } else {
    if (activeStep === 1) fieldsToValidate = ["residentialAddress", "occupation", "employerName", "principalObjective", "kinName", "kinPhone", "kinEmail", "kinRelationship"];
    if (activeStep === 1) fieldsToValidate = ["applicantFirstName", "applicantLastName", "applicantPhone", "applicantEmail", "applicantNrc", "applicantBirthDate", "applicantAddress", "applicantPosition"];
    if (activeStep === 2) fieldsToValidate = ["pacraCertificate", "form2", "taxClearanceCertificate", "taxComplianceReturn", "bankStatementsBusiness", "applicantPassportPhoto", "boardResolution"];
  }

  fieldsToValidate.forEach((field) => {
    if (form.validateField(field).hasError) hasError = true;
  });

  if (loanType === "Business") {
    if (activeStep === 1) {
      form.values.directors.forEach((_, i) => {
        if (form.validateField(`directors.${i}.name`).hasError) hasError = true;
        if (form.validateField(`directors.${i}.phone`).hasError) hasError = true;
        if (form.validateField(`directors.${i}.nrc`).hasError) hasError = true;
      });
    }
    if (activeStep === 2) {
      form.values.directorDocuments.forEach((_, i) => {
        if (form.validateField(`directorDocuments.${i}.nrcFile`).hasError) hasError = true;
        if (form.validateField(`directorDocuments.${i}.photoFile`).hasError) hasError = true;
      });
    }
  }

  // Move to next step only if the current step is valid
  if (!hasError) {
    setActiveStep((s) => Math.min(s + 1, 3));
  }
};
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const tenure = Number(form.values.tenureMonths) || 0;
  const facilityFee = Math.round(form.values.loanAmount * 0.02 * 100) / 100;
  const totalInterest = Math.round(form.values.loanAmount * 0.24 * (tenure / 12) * 100) / 100;
  const totalRepayable = form.values.loanAmount + totalInterest + facilityFee;
  const monthlyRepayment = tenure ? Math.round((totalRepayable / tenure) * 100) / 100 : 0;

  const { data: existingApplicationData, refetch: refetchLoanApplication } = useQuery({
  queryKey: ["loan-application", loanApplicationId],
  queryFn: () => getLoanApplicationById(loanApplicationId as string),
  enabled: !!loanApplicationId && opened === true,
});

useEffect(() => {
  const application = existingApplicationData?.message?.data;
  if (!application) return;

  const isBusinessType = application.application_type === "Business Loan";
const getDocFile = (docsArray: any[], documentNames: string[], key?: string) => {
    if (!docsArray) return null;
    const doc = docsArray.find((d: any) => documentNames.includes(d.document_name));
    if (doc && doc.file) {
      const fileName = doc.file.split('/').pop() || doc.file;
      if (key) originalDocumentUrls.current[key] = doc.file;
      return new File([""], fileName);
    }
    return null;
  };
  const pDocs = application.documents || [];
  const bDocs = application.business_documents || [];
  const extractedDirectorDocs: DirectorDocEntry[] = [];

  for (let i = 1; i <= 3; i++) {
    const nrc = getDocFile(bDocs, [`Director ${i} NRC`], `directorDocuments.${i - 1}.nrcFile`);
    const photo = getDocFile(bDocs, [`Director ${i} passport photo`], `directorDocuments.${i - 1}.photoFile`);
        if (nrc || photo) {
      extractedDirectorDocs.push({
        id: nextId(),
        nrcFile: nrc,
        photoFile: photo
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
   
    payslips: getDocFile(pDocs, ["Latest three payslips", "Salary Slip"], "payslips"), 
    bankStatementsPersonal: getDocFile(pDocs, ["Bank statements (3 months)"], "bankStatementsPersonal"),
    nrcCopy: getDocFile(pDocs, ["NRC copy"], "nrcCopy"),
    passportPhotoPersonal: getDocFile(pDocs, ["Passport-sized photo"], "passportPhotoPersonal"),
    tpinCertificate: getDocFile(pDocs, ["TPIN certificate"], "tpinCertificate"),

    // Business Documents
    pacraCertificate: getDocFile(bDocs, ["PACRA certificate"], "pacraCertificate"),
    form2: getDocFile(bDocs, ["Form 2"], "form2"),
    taxClearanceCertificate: getDocFile(bDocs, ["Tax clearance certificate / TPIN"], "taxClearanceCertificate"),
    taxComplianceReturn: getDocFile(bDocs, ["Latest tax compliance return"], "taxComplianceReturn"),
    orderInvoice: getDocFile(bDocs, ["Order / Invoice"], "orderInvoice"),
    bankStatementsBusiness: getDocFile(bDocs, ["Bank statements (6 months)"], "bankStatementsBusiness"),
    applicantPassportPhoto: getDocFile(bDocs, ["Applicant Passport-sized photo"], "applicantPassportPhoto"),
    boardResolution: getDocFile(bDocs, ["Board resolution"], "boardResolution"),

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
    directors: (application.directors?.length ? application.directors : []).map((d: any) => ({
      id: d.name || nextId(),
      name: d.director_name || "",
      phone: d.director_phone || "",
      email: d.director_email || "",
      nrc: d.national_registration_card || "",
    })),
    
    directorDocuments: extractedDirectorDocs,
  });

  if (!application.directors || application.directors.length === 0) {
    form.setFieldValue("directors", [{ id: nextId(), name: "", phone: "", email: "", nrc: "" }]);
  }

  setLoanTypeSelected(true);
  setActiveStep(0);
}, [existingApplicationData]);

  const { mutate: submitLoanApplication, isPending: isSubmitting } = useMutation({
  mutationFn: (payload: LoanApplicationPayload) => createLoanApplication(payload),
  onSuccess: () => {
    handleModalClose(); // Closes the main form upon success
  },
  onError: (error) => {
    console.error("Failed to submit loan application:", error);
  },
});

const { mutate: updateLoanApplicationMutation, isPending: isUpdating } = useMutation({
  mutationFn: updateLoanApplication,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
    handleModalClose(); 
  },
  onError: (error) => {
    console.error("Failed to update loan application:", error);
  },
});

const resolveDocumentUrl = async (file: File | null, fieldPath: string): Promise<string | null> => {
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
            [`directorDocuments.${index}.nrcFile`, doc.nrcFile] as [string, File | null],
            [`directorDocuments.${index}.photoFile`, doc.photoFile] as [string, File | null],
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
        return <PersonalBusinessInfoStep form={form} loanType={loanType} />;
      case 1:
        return <ResidenceEmploymentStep form={form} loanType={loanType} />;
      case 2:
        return <DocumentsStep form={form} loanType={loanType} />;
      case 3:
        case 3:
         return <LoanTermsStep form={form} loanType={loanType} />;
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
  {loanApplicationId ? "Update Loan Application" : "New Loan Application"}
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
                        {/* <Group
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
                        > */}
                        <Group
  gap="xs"
  wrap="nowrap"
  onClick={() => setActiveStep(idx)}
  px="md"
  py={6}
  style={{
    cursor: "pointer",
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
            {!(loanApplicationId && activeStep === 0) && (
  <Button 
    variant="default" 
    radius="md" 
    onClick={activeStep === 0 ? () => setLoanTypeSelected(false) : handleBack}
  >
    Back
  </Button>
            )}
  
  <Button
    color="brand"
    radius="md"
    onClick={activeStep < 3 ? handleNext : handleSubmitApplication}
    loading={activeStep === 3 && (isUploadingDocs || isSubmitting || isUpdating)}
    rightSection={<IconArrowRight size={16} />}
  >
    {activeStep < 3 ? "Save & Continue" : (loanApplicationId ? "Update Application" : "Submit Application")}
  </Button>
</Group>
            </Group>
          )}
        </Box>
      </Modal>
    </>
  );
}