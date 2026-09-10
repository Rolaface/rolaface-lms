import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";

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
  loanType: "Personal",

  customerType: "existing",
  selectedCustomerId: "CU-10234",
  selectedOfferId: "OF-1",
  applicantType: "Personal",
  repaymentFrequency: "Monthly",

  firstName: "Chanda",
  middleName: "",
  surname: "Mwansa",
  phone: "0977123456",
  email: "chanda.mwansa@example.com",
  nrc: "123456/78/1",
  gender: "Female",
  maritalStatus: "Married",
  birthDate: "1990-03-14",

  companyName: "",
  typeOfBusiness: null,
  establishedDate: "",
  natureOfBusiness: "",
  registeredOffice: "",
  collateralPledged: "",
  purposeOfLoan: "Home improvement",

  residentialAddress: "Plot 22, Kabulonga, Lusaka",
  occupation: "Nurse",
  employerName: "Ministry of Health",
  nationality: "Zambian",
  principalObjective: "Home improvement",
  kinName: "Mwansa Mwansa",
  kinPhone: "0977456789",
  kinEmail: "mwansa.mwansa@example.com",
  kinRelationship: "Spouse",

  directors: [],
  directorsCount: "",
  directorsDocunentCount: "",

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

  payslips: dummyFile("payslip-jul-2026.pdf", "application/pdf"),
  bankStatementsPersonal: dummyFile(
    "bank-statement-q3-2026.pdf",
    "application/pdf",
  ),
  nrcCopy: dummyFile("nrc-copy.jpg", "image/jpeg"),
  passportPhotoPersonal: dummyFile("passport-photo.jpg", "image/jpeg"),
  tpinCertificate: dummyFile("tpin-certificate.pdf", "application/pdf"),

  pacraCertificate: null,
  form2: null,
  taxClearanceCertificate: null,
  taxComplianceReturn: null,
  orderInvoice: null,
  bankStatementsBusiness: null,
  applicantPassportPhoto: null,
  boardResolution: null,
  directorDocuments: [],

  loanAmount: 35000,
  tenureMonths: 18,
};

export const DUMMY_BUSINESS_LOAN_APPLICATION: LoanApplicationValues = {
  loanType: "Business",

  customerType: "existing",
  selectedCustomerId: "CU-11045",
  selectedOfferId: "OF-3",
  applicantType: "Business",

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

  companyName: "Kalingalinga Traders Ltd",
  typeOfBusiness: "Private Limited Company",
  establishedDate: "2015-01-12",
  natureOfBusiness: "Wholesale of building materials",
  registeredOffice: "Plot 9, Roma, Lusaka",
  collateralPledged: "80000",
  purposeOfLoan: "Stock purchase",

  residentialAddress: "",
  occupation: "",
  employerName: "",
  nationality: null,
  principalObjective: "",
  kinName: "",
  kinPhone: "",
  kinEmail: "",
  kinRelationship: "",

  directors: [
    {
      id: "dir-1",
      name: "Bwalya Phiri",
      phone: "0966552310",
      email: "bwalya.phiri@example.com",
      nrc: "234567/11/2",
    },
    {
      id: "dir-2",
      name: "Mutale Banda",
      phone: "0955903217",
      email: "mutale.banda@example.com",
      nrc: "345678/22/3",
    },
  ],
  directorsCount: "2",
  directorsDocunentCount: "2",

  applicantFirstName: "Bwalya",
  applicantMiddleName: "",
  applicantLastName: "Phiri",
  applicantPhone: "0966552310",
  applicantEmail: "bwalya.phiri@example.com",
  applicantNrc: "234567/11/2",
  applicantGender: "Male",
  applicantMaritalStatus: "Single",
  applicantBirthDate: "1985-07-02",
  applicantAddress: "House 4B, Chilenje, Lusaka",
  applicantPosition: "Managing Director",
  applicantNationality: "Zambian",

  payslips: null,
  bankStatementsPersonal: null,
  nrcCopy: null,
  passportPhotoPersonal: null,
  tpinCertificate: null,

  pacraCertificate: dummyFile("pacra-certificate.pdf", "application/pdf"),
  form2: dummyFile("form-2.pdf", "application/pdf"),
  taxClearanceCertificate: dummyFile(
    "tax-clearance-certificate.pdf",
    "application/pdf",
  ),
  taxComplianceReturn: dummyFile(
    "tax-compliance-return.pdf",
    "application/pdf",
  ),
  orderInvoice: null,
  bankStatementsBusiness: dummyFile(
    "bank-statements-6mo.pdf",
    "application/pdf",
  ),
  applicantPassportPhoto: dummyFile("applicant-photo.jpg", "image/jpeg"),
  boardResolution: dummyFile("board-resolution.pdf", "application/pdf"),
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

  loanAmount: 80000,
  tenureMonths: 24,
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