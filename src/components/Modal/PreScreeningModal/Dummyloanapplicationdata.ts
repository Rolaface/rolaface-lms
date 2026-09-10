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

// A fully-filled Business loan application, for testing the Business
// branch of the read-only view.
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

// Prescreening-specific data (credit score, liabilities, income scenario,
// application id) that doesn't live on LoanApplicationValues but is needed
// by PreScreeningModal's Prescreening tab.
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