import { createInitialValues, type LoanApplicationValues } from "../LoanApplication/form";

// A fully-filled Personal loan application, used to feed the read-only
// LoanApplicationModal inside PreScreeningModal until this is wired to a
// real submitted application from the backend.
//
// Note: File fields (payslips, nrcCopy, etc.) use a browser File object.
// In a real submitted application these would come from resolved document
// URLs; here we fabricate lightweight File stand-ins so the read-only
// DocumentsStep has something to display.
function dummyFile(name: string, type: string): File {
  return new File(["dummy"], name, { type });
}

export const DUMMY_PERSONAL_LOAN_APPLICATION: LoanApplicationValues = {
  ...createInitialValues(),
  customer_type: "Existing",
  customer: "CU-10234",
  customer_name: "Chanda Mwansa",
  channel: "Branch",
  applicant_type: "Individual",
  requested_amount: 35000,
  tenure_months: 18,
  repayment_frequency: "Monthly",
  first_name: "Chanda",
  last_name: "Mwansa",
  nrc: "123456/78/1",
  date_of_birth: "1990-03-14",
  phone: "0977123456",
  email: "chanda.mwansa@example.com",
  gender: "Female",
  marital_status: "Married",
  nationality: "Zambia",
  kin_name: "Mwansa Mwansa",
  kin_relationship: "Spouse",
  kin_phone: "0977456789",
  kin_email: "mwansa.mwansa@example.com",
  employment_status: "Salaried",
  employment_type: "Government",
  employer_name: "Ministry of Health",
  designation: "Nurse",
  experience_years: 8,
  current_address: {
    address_line1: "Plot 22, Kabulonga",
    address_line2: "",
    city: "Lusaka",
    state: "Lusaka",
    country: "Zambia",
    pincode: "",
  },
  documents: {
    ...createInitialValues().documents,
    payslips: dummyFile("payslip-jul-2026.pdf", "application/pdf"),
    bankStatementsPersonal: dummyFile("bank-statement-q3-2026.pdf", "application/pdf"),
    nrcCopy: dummyFile("nrc-copy.jpg", "image/jpeg"),
    passportPhotoPersonal: dummyFile("passport-photo.jpg", "image/jpeg"),
    tpinCertificate: dummyFile("tpin-certificate.pdf", "application/pdf"),
  },
};

export const DUMMY_BUSINESS_LOAN_APPLICATION: LoanApplicationValues = {
  ...createInitialValues(),
  customer_type: "Existing",
  customer: "CU-11045",
  customer_name: "Kalingalinga Traders Ltd",
  channel: "Branch",
  applicant_type: "Business",
  requested_amount: 80000,
  tenure_months: 24,
  repayment_frequency: "Monthly",
  first_name: "Bwalya",
  last_name: "Phiri",
  nrc: "234567/11/2",
  date_of_birth: "1985-07-02",
  phone: "0966552310",
  email: "bwalya.phiri@example.com",
  gender: "Male",
  marital_status: "Single",
  nationality: "Zambia",
  position: "Managing Director",
  company_name: "Kalingalinga Traders Ltd",
  registration_number: "120150001234",
  tpin: "1002345678",
  business_type: "Private Limited Company",
  established_date: "2015-01-12",
  nature_of_business: "Wholesale of building materials",
  directors: [
    { id: "dir-1", full_name: "Bwalya Phiri", phone: "0966552310", email: "bwalya.phiri@example.com", nrc: "234567/11/2" },
    { id: "dir-2", full_name: "Mutale Banda", phone: "0955903217", email: "mutale.banda@example.com", nrc: "345678/22/3" },
  ],
  office_address: {
    address_line1: "Plot 9, Roma",
    address_line2: "",
    city: "Lusaka",
    state: "Lusaka",
    country: "Zambia",
    pincode: "",
  },
  documents: {
    ...createInitialValues().documents,
    pacraCertificate: dummyFile("pacra-certificate.pdf", "application/pdf"),
    form2: dummyFile("form-2.pdf", "application/pdf"),
    taxClearanceCertificate: dummyFile("tax-clearance-certificate.pdf", "application/pdf"),
    taxComplianceReturn: dummyFile("tax-compliance-return.pdf", "application/pdf"),
    bankStatementsBusiness: dummyFile("bank-statements-6mo.pdf", "application/pdf"),
    applicantPassportPhoto: dummyFile("applicant-photo.jpg", "image/jpeg"),
    boardResolution: dummyFile("board-resolution.pdf", "application/pdf"),
  },
  directorDocuments: [
    {
      id: "dirdoc-1",
      nrcFile: dummyFile("director-1-nrc.jpg", "image/jpeg"),
      photoFile: dummyFile("director-1-photo.jpg", "image/jpeg"),
    },
    {
      id: "dirdoc-2",
      nrcFile: dummyFile("director-2-nrc.jpg", "image/jpeg"),
      photoFile: dummyFile("director-2-photo.jpg", "image/jpeg"),
    },
  ],
};

// ---------------------------------------------------------------------------
// Prescreening-specific data (credit score, liabilities, income scenario,
// application id) that doesn't live on LoanApplicationValues but is needed
// by PreScreeningModal's Prescreening tab.
// ---------------------------------------------------------------------------
export interface DummyPrescreeningContext {
  applicationId: string;
  loanRate: number; // annual %, used for simulation + affordability calc
  loanTypeId: "personal" | "business" | "mortgage";
}

export const DUMMY_PRESCREENING_CONTEXT: DummyPrescreeningContext = {
  applicationId: "APP-58231",
  loanRate: 25,
  loanTypeId: "personal",
};

export interface DummyPrescreeningData {
  credit: { value: number; source: "bureau" | "hrms" | "application" | "manual" };
  liabilities: {
    obligations: number;
    activeLoans: number;
    outstanding: number;
    source: "bureau" | "hrms" | "application" | "manual";
  };
  income: { value: number; source: "bureau" | "hrms" | "application" | "manual" };
}

export const DUMMY_PRESCREENING_DATA: DummyPrescreeningData = {
  credit: { value: 742, source: "bureau" },
  liabilities: { obligations: 3850, activeLoans: 2, outstanding: 38500, source: "bureau" },
  income: { value: 13100, source: "hrms" },
};

// ---------------------------------------------------------------------------
// Enrichment-specific data (final commercial terms locked at Stage 3).
// Underwriting and Offer & Signing both read this as the "final terms"
// that were produced by EnrichmentModal, until that stage is wired to a
// real backend enrichment record.
// ---------------------------------------------------------------------------
export interface DummyEnrichmentTerms {
  amount: number;
  rate: number;
  tenureMonths: number;
  frequency: string;
  processingFeePct: number;
  insurancePct: number;
  taxPct: number;
}

export const DUMMY_ENRICHMENT_TERMS: DummyEnrichmentTerms = {
  amount: 33234, // derived from the same eligibility calc EnrichmentModal uses
  rate: 25,
  tenureMonths: 18,
  frequency: "Monthly",
  processingFeePct: 2,
  insurancePct: 1,
  taxPct: 16,
};

// ---------------------------------------------------------------------------
// Underwriting-specific data — collateral / asset offered as security on
// the application, and the legal-check policy used to seed checks for a
// given asset type. Used by UnderwritingModal until wired to a real
// collateral-registration + legal-check backend.
// ---------------------------------------------------------------------------
export type AssetSource = "application" | "manual";

export interface DummyAssetBase {
  type: string;
  description: string;
  assetId: string;
  location: string;
  owner: string;
  acquisition: string;
}

export const DUMMY_ASSET_TYPES = [
  "Motor vehicle",
  "Landed property",
  "Equipment",
  "Fixed deposit",
  "Other",
];

export interface DummyLegalCheckSeed {
  id: string;
  name: string;
  defaultStatus: "Pending" | "In Progress" | "Passed" | "Failed" | "Exception";
  finding: string;
  why?: string;
  action?: string;
}

export const DUMMY_CHECKS_POLICY: Record<string, DummyLegalCheckSeed[]> = {
  "Motor vehicle": [
    {
      id: "title-auth",
      name: "Title authenticity",
      defaultStatus: "Passed",
      finding: "Registration certificate verified against the national vehicle registry.",
    },
    {
      id: "ownership",
      name: "Ownership verification",
      defaultStatus: "Passed",
      finding: "Registered owner matches the applicant.",
    },
    {
      id: "encumbrance",
      name: "Existing encumbrance check",
      defaultStatus: "Exception",
      finding: "Existing charge identified against the vehicle with a third-party financier.",
      why: "A registered encumbrance means the lender does not hold first claim on the asset until it is released.",
      action: "Obtain a discharge / clearance letter from the existing financier before disbursement.",
    },
    {
      id: "litigation",
      name: "Litigation check",
      defaultStatus: "Passed",
      finding: "No active litigation found against the asset or owner.",
    },
    {
      id: "regulatory",
      name: "Regulatory check",
      defaultStatus: "Passed",
      finding: "Vehicle meets regulatory and roadworthiness requirements on file.",
    },
    {
      id: "search",
      name: "Search report verification",
      defaultStatus: "Passed",
      finding: "Search report obtained from the Road Transport and Safety Agency.",
    },
  ],
};

export const DUMMY_GENERIC_CHECKS: Omit<DummyLegalCheckSeed, "defaultStatus" | "finding">[] = [
  { id: "title-auth", name: "Title authenticity" },
  { id: "ownership", name: "Ownership verification" },
  { id: "encumbrance", name: "Existing encumbrance check" },
  { id: "litigation", name: "Litigation check" },
  { id: "regulatory", name: "Regulatory check" },
  { id: "search", name: "Search report verification" },
];

export function getApplicableChecks(assetType: string): DummyLegalCheckSeed[] {
  const configured = DUMMY_CHECKS_POLICY[assetType];
  if (configured) return configured;
  return DUMMY_GENERIC_CHECKS.map((c) => ({
    ...c,
    defaultStatus: "Pending" as const,
    finding: "",
    why: "",
    action: "",
  }));
}

// The asset captured on the original application, pre-reviewed for a
// realistic default state so the underwriting workspace isn't empty.
export const DUMMY_SEED_ASSET_BASE: DummyAssetBase = {
  type: "Motor vehicle",
  description: "2019 Toyota Hilux D/Cab, registration ABC 1234 ZM",
  assetId: "AST-33021",
  location: "Lusaka, Zambia",
  owner: "Chanda Mwansa",
  acquisition: "Purchased 2019 · dealer invoice on file",
};

// ---------------------------------------------------------------------------
// Offer & signing specific data
// ---------------------------------------------------------------------------
export interface DummySignatory {
  name: string;
  role: string;
}

export const DUMMY_SIGNATORIES: DummySignatory[] = [
  { name: "Chanda Mwansa", role: "Customer" },
  { name: "Bwalya Mumba", role: "Bank officer" },
];

export const DUMMY_AMEND_FIELDS = [
  "Requested amount",
  "Tenure",
  "Interest rate",
  "Repayment frequency",
  "Other terms",
];

export const DUMMY_ROUTE_STAGES = ["Enrichment", "Underwriting", "Prescreening"];