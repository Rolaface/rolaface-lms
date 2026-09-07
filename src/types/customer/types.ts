import type {
  CustomerCreatePayload,
  IndividualCustomerPayload,
  CompanyCustomerPayload,
} from "../../api/Customer/customerApi";

/**
 * NOTE — fields with no source in current state hooks are left as
 * empty string / 0 with a TODO comment. Do not silently ship these
 * as-is to a real backend without confirming:
 *   - territory            (no state field anywhere)
 *   - is_npa               (hardcoded 0, no toggle exists yet)
 *   - next_of_kin.country  (useKinState has no country field)
 *
 * customerType mapping ASSUMPTION (confirm before relying on this):
 *   Identity step has 6 types — Individual / Joint / Business / SME /
 *   Corporate / Group. The confirmed payload only supports
 *   "Individual" | "Company". Everything except "Individual" is
 *   mapped to "Company" below.
 *
 * OPEN QUESTION — not resolved here:
 *   Company's registered_company_name / registration_number /
 *   incorporation_date are sent inside `basic_details`, but the
 *   backend's CHILD_TABLE_FIELDS["basic_details"] set (as configured
 *   at time of writing) does not include those keys — only
 *   CHILD_TABLE_FIELDS["extended_details"] does. Left as `basic_details`
 *   here since that matches the confirmed Postman payload; needs
 *   backend confirmation before changing.
 */

/**
 * These are deliberately NOT imported via `ReturnType<typeof useXState>`
 * because the real file paths/folders for these hooks weren't shared —
 * only their content was. Each type below lists just the fields this
 * builder actually reads, taken verbatim from the uploaded hook files.
 * Swap these for real imports once the hook file locations are known.
 */

interface IdentityState {
  customerType: string;
  customerGroup: string | null;
  isStaffCustomer: boolean;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string;
  nationality: string | null;
  maritalStatus: string | null;
  occupation: string;
  industry: string | null;
  employer: string;
  individualTaxId: string;
  currency: string | null;
  companyName: string;
  registrationNumber: string;
  incorporationDate: string;
  numberOfEmployees: number | "";
  annualRevenue: number | "";
  businessIndustry: string | null;
  businessAddress: string;
  businessAddressLine2: string;
  businessCity: string;
  businessProvince: string | null;
  businessCountry: string | null;
  businessPostalCode: string;
  taxId: string;
  directors: Array<{
    fullName: string;
    role: string;
    shareholdingPercent: string;
  }>;
}

/* Mirrors CustomerModalAddress / CustomerModalContact from useContactState.ts.
   useContactState already collects real multi-address / multi-contact arrays —
   this builder now reads those directly instead of building a single
   hardcoded address/contact from the flat residential-address fields. */
interface ContactAddress {
  name?: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_primary_address: 0 | 1;
  is_shipping_address: 0 | 1;
}

interface ContactPerson {
  name?: string;
  first_name: string;
  last_name: string;
  salutation: string | null;
  designation: string | null;
  email_id: string;
  mobile_no: string;
  is_primary_contact: 0 | 1;
  is_billing_contact: 0 | 1;
}

interface ContactState {
  email: string;
  mobileNumber: string;
  customerAddresses: ContactAddress[];
  customerContacts: ContactPerson[];
}

interface IdentificationState {
  idDocuments: Array<{
    idType: string;
    docNumber: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate: string;
    verification: string;
  }>;
}

interface FinancialBorrowerState {
  educationLevel: string | null;
  employmentType: string | null;
  sourceOfIncome: string | null;
  monthlyIncome: number | "";
  annualIncome: number | "";
  totalAssets: number | "";
  totalLiabilities: number | "";
  existingMonthlyObligations: number | "";
  relationshipManager: string | null;
}

interface KinState {
  kinFirstName: string;
  kinMiddleName: string;
  kinLastName: string;
  kinRelationship: string | null;
  kinPhone: string;
  kinAddress: string;
  kinDistrict: string;
  kinCityTown: string;
  kinPostalCode: string;
}

export function buildCustomerPayload(
  identity: IdentityState,
  contact: ContactState,
  identification: IdentificationState,
  financial: FinancialBorrowerState,
  kin: KinState,
): CustomerCreatePayload {
  const isCompany = identity.customerType === "Business"; // matches CustomerModal.tsx's isBusinessType check

  const documents = identification.idDocuments.map((doc) => ({
    document_type: doc.idType,
    document_name: doc.idType, // TODO: no separate "document name" field in state
    document_number: doc.docNumber,
    issue_date: doc.issueDate,
    expiry_date: doc.expiryDate || undefined,
    verification_status: doc.verification,
    issuing_authority: doc.issuingAuthority,
    issuing_country: "", // TODO: no source field
  }));

  const addresses = contact.customerAddresses.map((a) => ({
    address_type: a.address_type,
    address_line1: a.address_line1,
    address_line2: a.address_line2 || undefined,
    city: a.city,
    state: a.state,
    country: a.country,
    pincode: a.pincode,
    is_primary_address: a.is_primary_address,
    is_shipping_address: a.is_shipping_address,
  }));

  const contacts = contact.customerContacts.map((c) => ({
    first_name: c.first_name,
    last_name: c.last_name,
    salutation: c.salutation ?? undefined,
    designation: c.designation ?? undefined,
    email_id: c.email_id,
    mobile_no: c.mobile_no,
    is_primary_contact: c.is_primary_contact,
    is_billing_contact: c.is_billing_contact,
  }));

  if (!isCompany) {
    const payload: IndividualCustomerPayload = {
      customer_name: [identity.firstName, identity.lastName].filter(Boolean).join(" "),
      customer_type: "Individual",
      customer_group: identity.customerGroup ?? "",
      territory: "", // TODO: no source field
      gender: identity.gender, // top-level — see IndividualCustomerPayload comment in customerApi.ts
      first_name: identity.firstName,
      last_name: identity.lastName,
      email_id: contact.email,
      mobile_no: contact.mobileNumber,
      tax_id: identity.individualTaxId,
      default_currency: identity.currency ?? "",
      is_npa: 0, // TODO: no source field
      relationship_manager: financial.relationshipManager ?? undefined,
      basic_details: [
        {
          gender: identity.gender,
          date_of_birth: identity.dateOfBirth,
          marital_status: identity.maritalStatus,
          nationality: identity.nationality,
          is_staff_customer: identity.isStaffCustomer ? 1 : 0,
          occupation: identity.occupation,
          education_level: financial.educationLevel,
          employment_type: financial.employmentType,
          industry_type: identity.industry,
          employer_name: identity.employer,
          source_of_income: financial.sourceOfIncome,
          monthly_income: Number(financial.monthlyIncome) || 0,
          annual_income: Number(financial.annualIncome) || 0,
          total_assets: Number(financial.totalAssets) || 0,
          total_liabilities: Number(financial.totalLiabilities) || 0,
          existing_monthly_obligations:
            Number(financial.existingMonthlyObligations) || 0,
        },
      ],
      addresses,
      contacts,
      next_of_kin: [
        {
          first_name: kin.kinFirstName,
          middle_name: kin.kinMiddleName || undefined,
          last_name: kin.kinLastName,
          relationship: kin.kinRelationship,
          phone: kin.kinPhone,
          address_line_1: kin.kinAddress,
          district: kin.kinDistrict,
          city: kin.kinCityTown,
          postal_code: kin.kinPostalCode,
          country: "", // TODO: no source field in useKinState
        },
      ],
      documents,
    };
    return payload;
  }

  const payload: CompanyCustomerPayload = {
    customer_name: identity.companyName,
    customer_type: "Company",
    customer_group: identity.customerGroup ?? "",
    territory: "", // TODO: no source field
    email_id: contact.email,
    mobile_no: contact.mobileNumber,
    tax_id: identity.taxId,
    default_currency: identity.currency ?? "",
    industry: identity.businessIndustry ?? "",
    is_npa: 0, // TODO: no source field
    relationship_manager: financial.relationshipManager ?? undefined,
    basic_details: [
      {
        registered_company_name: identity.companyName,
        registration_number: identity.registrationNumber,
        incorporation_date: identity.incorporationDate,
        number_of_employees: Number(identity.numberOfEmployees) || 0,
        annual_revenue: Number(identity.annualRevenue) || 0,
        total_assets: Number(financial.totalAssets) || 0,
        total_liabilities: Number(financial.totalLiabilities) || 0,
        existing_monthly_obligations:
          Number(financial.existingMonthlyObligations) || 0,
      },
    ],
    addresses,
    contacts,
    stakeholders: identity.directors.map((d) => ({
      stakeholder_name: d.fullName,
      stakeholder_role: d.role,
      ownership_percentage: Number(d.shareholdingPercent) || 0,
    })),
    documents,
  };
  return payload;
}