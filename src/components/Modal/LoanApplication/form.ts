import type {
  ApplicantType,
  ApplicationAddress,
  ApplicationDocument,
  FinancialItem,
  LoanApplication,
  LoanApplicationPayload,
} from "../../../api/LosConfiguration/LoanApplicationApi";

export type { ApplicantType };

export type DocumentKey =
  | "payslips"
  | "bankStatementsPersonal"
  | "nrcCopy"
  | "passportPhotoPersonal"
  | "tpinCertificate"
  | "pacraCertificate"
  | "form2"
  | "taxClearanceCertificate"
  | "taxComplianceReturn"
  | "orderInvoice"
  | "bankStatementsBusiness"
  | "applicantPassportPhoto"
  | "boardResolution";

export interface DirectorEntry {
  id: string;
  full_name: string;
  nrc: string;
  phone: string;
  email: string;
}

export interface DirectorDocEntry {
  id: string;
  nrcFile: File | null;
  photoFile: File | null;
}

export interface AddressValues {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string | null;
  pincode: string;
}

export interface CollateralEntry {
  id: string;
  collateral_type: string | null;
  estimated_value: number | "";
  ownership_date: string;
  description: string;
}

export interface FinancialEntry {
  source: string;
  monthly_amount: number | "";
}

export interface LoanApplicationValues {
  customer_type: "New" | "Existing" | null;
  customer: string | null;
  customer_name: string;
  channel: string | null;
  applicant_type: ApplicantType;
  loan_type: string | null;
  loan_sub_type: string | null;
  loan_purpose: string | null;
  requested_amount: number | "";
  tenure_months: number | "";
  repayment_frequency: "Monthly" | "Bi-weekly";
  first_name: string;
  middle_name: string;
  last_name: string;
  nrc: string;
  date_of_birth: string;
  phone: string;
  email: string;
  gender: string | null;
  marital_status: string | null;
  nationality: string | null;
  position: string;
  kin_name: string;
  kin_relationship: string | null;
  kin_phone: string;
  kin_email: string;
  employment_status: string | null;
  employment_type: string | null;
  employer_name: string;
  designation: string;
  experience_years: number | "";
  credit_score: number | "";
  company_name: string;
  registration_number: string;
  tpin: string;
  business_type: string | null;
  established_date: string;
  nature_of_business: string;
  directors: DirectorEntry[];
  current_address: AddressValues;
  permanent_address: AddressValues;
  office_address: AddressValues;
  permanent_same_as_current: boolean;
  income: FinancialEntry[];
  obligations: FinancialEntry[];
  expenses: FinancialEntry[];
  collaterals: CollateralEntry[];
  documents: Record<DocumentKey, File | null>;
  directorDocuments: DirectorDocEntry[];
  other_documents: ApplicationDocument[];
}

export const GENDERS = ["Male", "Female", "Other"];
export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed", "Separated"];
export const KIN_RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Grandparent",
  "Grandchild",
  "Uncle/Aunt",
  "Nephew/Niece",
  "Cousin",
  "Guardian",
  "Friend",
  "Other",
];
export const EMPLOYMENT_STATUSES = ["Salaried", "Self Employed", "Pensioner", "Others"];
export const EMPLOYMENT_TYPES = ["Government", "Private", "Self-Employed", "Others"];
export const EMPLOYMENT_TYPE_MAP: Record<string, string[]> = {
  Salaried: ["Government", "Private", "Others"],
  Pensioner: ["Government", "Private", "Others"],
  "Self Employed": ["Self-Employed", "Others"],
  Others: ["Others"],
};
export const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited Company",
  "Public Limited Company",
  "Cooperative",
  "Other",
];
export const INCOME_SOURCES = ["Net Salary", "Business Income", "Rental Income", "Other Income"];
export const OBLIGATION_SOURCES = ["Monthly Obligation", "Rental Obligation", "Other Monthly Debt"];
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DOCUMENT_NAMES: Record<DocumentKey, string> = {
  payslips: "Latest three payslips",
  bankStatementsPersonal: "Bank statements (3 months)",
  nrcCopy: "NRC copy",
  passportPhotoPersonal: "Passport-sized photo",
  tpinCertificate: "TPIN certificate",
  pacraCertificate: "PACRA certificate",
  form2: "Form 2",
  taxClearanceCertificate: "Tax clearance certificate / TPIN",
  taxComplianceReturn: "Latest tax compliance return",
  orderInvoice: "Order / Invoice",
  bankStatementsBusiness: "Bank statements (6 months)",
  applicantPassportPhoto: "Applicant passport-sized photo",
  boardResolution: "Board resolution",
};

export const DOCUMENT_KEYS: Record<ApplicantType, DocumentKey[]> = {
  Individual: ["payslips", "bankStatementsPersonal", "nrcCopy", "passportPhotoPersonal", "tpinCertificate"],
  Business: [
    "pacraCertificate",
    "form2",
    "taxClearanceCertificate",
    "taxComplianceReturn",
    "orderInvoice",
    "bankStatementsBusiness",
    "applicantPassportPhoto",
    "boardResolution",
  ],
};

export const OPTIONAL_DOCUMENTS: DocumentKey[] = ["orderInvoice"];

export const directorDocName = (index: number, kind: "nrcFile" | "photoFile") =>
  `Director ${index + 1} ${kind === "nrcFile" ? "NRC" : "Passport Photo"}`;

export const cleanPhone = (value: string) => value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

interface SimulationRange {
  amount: { min: number; max: number; step: number };
  tenure: { min: number; max: number };
  rate: number;
}

export const SIMULATION_RANGE: Record<ApplicantType, SimulationRange> = {
  Individual: { amount: { min: 1000, max: 1000000, step: 1000 }, tenure: { min: 1, max: 360 }, rate: 25 },
  Business: { amount: { min: 5000, max: 10000000, step: 5000 }, tenure: { min: 1, max: 360 }, rate: 25.5 },
};

export function computeSimulation(
  amount: number,
  tenure: number,
  rate: number,
  frequency: "Monthly" | "Bi-weekly",
  feePct = 0.02,
) {
  const nPeriods =
    frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  let installment: number;
  if (periodicRate > 0) {
    installment =
      (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) /
      (Math.pow(1 + periodicRate, nPeriods) - 1);
  } else {
    installment = amount / nPeriods;
  }
  const totalRepayment = installment * nPeriods;
  const totalInterest = totalRepayment - amount;
  const fee = amount * feePct;

  const first = new Date();
  first.setMonth(first.getMonth() + 1);
  const final = new Date(first);
  if (frequency === "Bi-weekly") final.setDate(final.getDate() + 14 * (nPeriods - 1));
  else final.setMonth(final.getMonth() + (nPeriods - 1));

  const schedule: Array<{
    n: number;
    due: Date;
    principal: number;
    interest: number;
    balance: number;
  }> = [];
  let balance = amount;
  for (let i = 1; i <= Math.min(nPeriods, 6); i++) {
    const interestPortion = balance * periodicRate;
    const principalPortion = installment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    const due = new Date(first);
    if (frequency === "Bi-weekly") due.setDate(due.getDate() + 14 * (i - 1));
    else due.setMonth(due.getMonth() + (i - 1));
    schedule.push({ n: i, due, principal: principalPortion, interest: interestPortion, balance });
  }
  return {
    installment,
    totalRepayment: totalRepayment + fee,
    totalInterest,
    fee,
    nPeriods,
    first,
    final,
    schedule,
  };
}

export const nextId = () => Math.random().toString(36).slice(2, 10);

export const emptyAddress = (): AddressValues => ({
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: null,
  pincode: "",
});

const emptyDocuments = () =>
  Object.fromEntries(Object.keys(DOCUMENT_NAMES).map((key) => [key, null])) as Record<DocumentKey, File | null>;

export const createInitialValues = (): LoanApplicationValues => ({
  customer_type: null,
  customer: null,
  customer_name: "",
  channel: "Branch",
  applicant_type: "Individual",
  loan_type: null,
  loan_sub_type: null,
  loan_purpose: null,
  requested_amount: "",
  tenure_months: "",
  repayment_frequency: "Monthly",
  first_name: "",
  middle_name: "",
  last_name: "",
  nrc: "",
  date_of_birth: "",
  phone: "",
  email: "",
  gender: null,
  marital_status: null,
  nationality: null,
  position: "",
  kin_name: "",
  kin_relationship: null,
  kin_phone: "",
  kin_email: "",
  employment_status: null,
  employment_type: null,
  employer_name: "",
  designation: "",
  experience_years: "",
  credit_score: "",
  company_name: "",
  registration_number: "",
  tpin: "",
  business_type: null,
  established_date: "",
  nature_of_business: "",
  directors: [],
  current_address: emptyAddress(),
  permanent_address: emptyAddress(),
  office_address: emptyAddress(),
  permanent_same_as_current: false,
  income: INCOME_SOURCES.map((source) => ({ source, monthly_amount: "" })),
  obligations: OBLIGATION_SOURCES.map((source) => ({ source, monthly_amount: "" })),
  expenses: [],
  collaterals: [],
  documents: emptyDocuments(),
  directorDocuments: [],
  other_documents: [],
});

export const isAddressFilled = (address: AddressValues) =>
  !!(
    address.address_line1.trim() ||
    address.address_line2.trim() ||
    address.city.trim() ||
    address.state.trim() ||
    address.country ||
    address.pincode.trim()
  );

export const formatAddress = (address: AddressValues) =>
  [address.address_line1, address.address_line2, address.city, address.state, address.country, address.pincode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

export const applicantName = (values: LoanApplicationValues) =>
  values.applicant_type === "Business"
    ? values.company_name
    : [values.first_name, values.middle_name, values.last_name].filter(Boolean).join(" ");

const text = (value: string | null | undefined) => value?.trim() || null;

const toAddress = (address_type: ApplicationAddress["address_type"], address: AddressValues): ApplicationAddress => ({
  address_type,
  address_line1: address.address_line1.trim(),
  address_line2: text(address.address_line2),
  city: address.city.trim(),
  state: text(address.state),
  country: address.country ?? "",
  pincode: text(address.pincode),
});

const toFinancialItems = (entries: FinancialEntry[]): FinancialItem[] =>
  entries
    .filter((entry) => entry.monthly_amount !== "" && entry.monthly_amount !== null)
    .map((entry) => ({ source: entry.source, monthly_amount: Number(entry.monthly_amount) }));

export function buildAddresses(values: LoanApplicationValues): ApplicationAddress[] {
  const addresses: ApplicationAddress[] = [];
  const permanent = values.permanent_same_as_current ? values.current_address : values.permanent_address;
  if (values.applicant_type === "Business") {
    addresses.push(toAddress("Office", values.office_address));
    if (isAddressFilled(values.current_address)) addresses.push(toAddress("Current", values.current_address));
  } else {
    addresses.push(toAddress("Current", values.current_address));
  }
  if (isAddressFilled(permanent)) addresses.push(toAddress("Permanent", permanent));
  return addresses;
}

export function buildPayload(values: LoanApplicationValues, documents: ApplicationDocument[]): LoanApplicationPayload {
  const isBusiness = values.applicant_type === "Business";
  const payload: LoanApplicationPayload = {
    channel: values.channel ?? "Branch",
    customer_type: values.customer_type ?? "New",
    customer: values.customer_type === "Existing" ? values.customer : null,
    applicant_type: values.applicant_type,
    loan_type: values.loan_type ?? "",
    loan_sub_type: values.loan_sub_type ?? "",
    loan_purpose: values.loan_purpose ?? "",
    requested_amount: Number(values.requested_amount),
    tenure_months: Number(values.tenure_months),
    repayment_frequency: values.repayment_frequency,
    first_name: values.first_name.trim(),
    middle_name: text(values.middle_name),
    last_name: values.last_name.trim(),
    nrc: values.nrc.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    gender: values.gender ?? "",
    marital_status: values.marital_status ?? "",
    date_of_birth: values.date_of_birth,
    nationality: values.nationality ?? "",
    credit_score: values.credit_score === "" ? null : Number(values.credit_score),
    collaterals: values.collaterals.map((row) => ({
      collateral_type: row.collateral_type ?? "",
      estimated_value: Number(row.estimated_value),
      ownership_date: row.ownership_date || null,
      description: text(row.description),
    })),
    documents,
    addresses: buildAddresses(values),
  };

  if (isBusiness) {
    return {
      ...payload,
      position: values.position.trim(),
      company_name: values.company_name.trim(),
      registration_number: values.registration_number.trim(),
      tpin: values.tpin.trim(),
      business_type: values.business_type,
      established_date: values.established_date,
      nature_of_business: values.nature_of_business.trim(),
      directors: values.directors.map((d) => ({
        full_name: d.full_name.trim(),
        nrc: d.nrc.trim(),
        phone: d.phone.trim(),
        email: d.email.trim(),
      })),
    };
  }

  return {
    ...payload,
    kin_name: values.kin_name.trim(),
    kin_phone: values.kin_phone.trim(),
    kin_email: values.kin_email.trim(),
    kin_relationship: values.kin_relationship,
    employment_status: values.employment_status,
    employment_type: values.employment_type,
    employer_name: values.employer_name.trim(),
    designation: values.designation.trim(),
    experience_years: values.experience_years === "" ? null : Number(values.experience_years),
    financials: {
      income: toFinancialItems(values.income),
      obligations: toFinancialItems(values.obligations),
      expenses: toFinancialItems(values.expenses),
    },
  };
}

const mimeFromName = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "";
};

const fileStandIn = (url: string, existingUrls: WeakMap<File, string>) => {
  const fileName = url.split("/").pop() || url;
  const file = new File([""], fileName, { type: mimeFromName(fileName) });
  existingUrls.set(file, url);
  return file;
};

const mergeFinancials = (sources: string[], items: FinancialItem[] | undefined): FinancialEntry[] => {
  const amounts = new Map((items ?? []).map((item) => [item.source, item.monthly_amount]));
  return [
    ...sources.map((source) => ({ source, monthly_amount: amounts.get(source) ?? ("" as const) })),
    ...(items ?? []).filter((item) => !sources.includes(item.source)),
  ];
};

const fromAddress = (address: ApplicationAddress | undefined): AddressValues =>
  address
    ? {
        address_line1: address.address_line1 ?? "",
        address_line2: address.address_line2 ?? "",
        city: address.city ?? "",
        state: address.state ?? "",
        country: address.country || null,
        pincode: address.pincode ?? "",
      }
    : emptyAddress();

export function valuesFromApplication(
  application: LoanApplication,
  existingUrls: WeakMap<File, string>,
): LoanApplicationValues {
  const initial = createInitialValues();
  const addressOf = (type: ApplicationAddress["address_type"]) =>
    fromAddress(application.addresses?.find((a) => a.address_type === type));

  const documentKeyByName = new Map(
    (Object.entries(DOCUMENT_NAMES) as [DocumentKey, string][]).map(([key, name]) => [name, key]),
  );
  const documents = { ...initial.documents };
  const directorDocuments: DirectorDocEntry[] = [];
  const otherDocuments: ApplicationDocument[] = [];
  for (const doc of application.documents ?? []) {
    const key = documentKeyByName.get(doc.document_name);
    const directorMatch = doc.document_name.match(/^Director (\d+) (NRC|Passport Photo)$/);
    if (key) {
      documents[key] = fileStandIn(doc.file, existingUrls);
    } else if (directorMatch) {
      const index = Number(directorMatch[1]) - 1;
      while (directorDocuments.length <= index) {
        directorDocuments.push({ id: nextId(), nrcFile: null, photoFile: null });
      }
      directorDocuments[index][directorMatch[2] === "NRC" ? "nrcFile" : "photoFile"] = fileStandIn(
        doc.file,
        existingUrls,
      );
    } else {
      otherDocuments.push({ document_name: doc.document_name, file: doc.file });
    }
  }

  return {
    ...initial,
    customer_type: application.customer_type,
    customer: application.customer ?? null,
    customer_name: application.customer_name ?? "",
    channel: application.channel,
    applicant_type: application.applicant_type,
    loan_type: application.loan_type,
    loan_sub_type: application.loan_sub_type,
    loan_purpose: application.loan_purpose,
    requested_amount: application.requested_amount ?? "",
    tenure_months: application.tenure_months ?? "",
    repayment_frequency: application.repayment_frequency || "Monthly",
    first_name: application.first_name ?? "",
    middle_name: application.middle_name ?? "",
    last_name: application.last_name ?? "",
    nrc: application.nrc ?? "",
    date_of_birth: application.date_of_birth ?? "",
    phone: application.phone ?? "",
    email: application.email ?? "",
    gender: application.gender || null,
    marital_status: application.marital_status || null,
    nationality: application.nationality || null,
    position: application.position ?? "",
    kin_name: application.kin_name ?? "",
    kin_relationship: application.kin_relationship || null,
    kin_phone: application.kin_phone ?? "",
    kin_email: application.kin_email ?? "",
    employment_status: application.employment_status || null,
    employment_type: application.employment_type || null,
    employer_name: application.employer_name ?? "",
    designation: application.designation ?? "",
    experience_years: application.experience_years ?? "",
    credit_score: application.credit_score || "",
    company_name: application.company_name ?? "",
    registration_number: application.registration_number ?? "",
    tpin: application.tpin ?? "",
    business_type: application.business_type || null,
    established_date: application.established_date ?? "",
    nature_of_business: application.nature_of_business ?? "",
    directors: (application.directors ?? []).map((d) => ({
      id: d.row_id || nextId(),
      full_name: d.full_name ?? "",
      nrc: d.nrc ?? "",
      phone: d.phone ?? "",
      email: d.email ?? "",
    })),
    current_address: addressOf("Current"),
    permanent_address: addressOf("Permanent"),
    office_address: addressOf("Office"),
    income: mergeFinancials(INCOME_SOURCES, application.financials?.income),
    obligations: mergeFinancials(OBLIGATION_SOURCES, application.financials?.obligations),
    expenses: application.financials?.expenses ?? [],
    collaterals: (application.collaterals ?? []).map((c) => ({
      id: c.row_id || nextId(),
      collateral_type: c.collateral_type || null,
      estimated_value: c.estimated_value ?? "",
      ownership_date: c.ownership_date ?? "",
      description: c.description ?? "",
    })),
    documents,
    directorDocuments,
    other_documents: otherDocuments,
  };
}
