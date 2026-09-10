import type {
  CustomerCreatePayload,
  IndividualCustomerPayload,
  CompanyCustomerPayload,
} from "../../api/Customer/customerApi";

/**
 * CORRECTED against the authoritative backend constant.py (2026-09-10):
 *
 *   EXTENDED_DETAILS_FIELDS only contains {name, registration_no,
 *   strict_credit_limit, principal_id}. None of those map to anything
 *   our UI state collects, so extended_details is dropped entirely from
 *   both payloads — it was previously carrying NRC / company registration
 *   / financial fields, ALL of which were being silently stripped by the
 *   backend's field whitelist and never actually saved.
 *
 *   BASIC_DETAILS_FIELDS is the table that actually accepts
 *   national_identification_number, registered_company_name,
 *   registration_number, incorporation_date, gender, and every financial
 *   field — so all of that now lives in basic_details only, for both
 *   Individual and Company.
 *
 *   Top-level Company field is `industry` per ALLOWED_CUSTOMER_FIELDS,
 *   NOT `industry_type` (industry_type only exists inside the child
 *   tables). Previously sent as `industry_type` at the top level and
 *   silently dropped by the backend's field filter.
 *
 * Fields still with no source (left as empty/0 — do not ship without
 * confirming with backend):
 *   - territory
 *   - is_npa
 *
 * customerType mapping ASSUMPTION (unchanged, confirm before relying on
 * this): IdentityStep's SegmentedControl currently only offers
 * Individual / Business (2 values) — everything maps 1:1.
 *
 * addresses[] / contacts[] are built directly from the flat
 * Identity/Contact step fields (Residential/Mailing/Registered
 * Office/Correspondence, Primary Contact Name), not from the
 * `customerAddresses` / `customerContacts` arrays (those are only
 * populated during edit-mode hydration and stay `[]` on create). The
 * `*AddressId` / `primaryContactId` fields (set during edit hydration)
 * are passed through as each entry's `name` so the backend patches the
 * existing Address/Contact doc on update instead of inserting a
 * duplicate.
 */

/**
 * These are deliberately NOT imported via `ReturnType<typeof useXState>`
 * because the real file paths/folders for these hooks weren't shared —
 * only their content was. Each type below lists just the fields this
 * builder actually reads. Swap for real imports once hook file locations
 * are known.
 */

interface IdentityState {
  customerType: string;
  customerGroup: string | null;
  isStaffCustomer: boolean;
  staffId: string | null;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string;
  nationality: string | null;
  maritalStatus: string | null;
  occupation: string;
  industry: string | null;
  employer: string;
  nrcNumber: string;
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
  registeredOfficeAddressId?: string;
  taxId: string;
  directors: Array<{
    fullName: string;
    role: string;
    shareholdingPercent: string;
  }>;
}

interface ContactState {
  email: string;
  mobileNumber: string;
  primaryContactName: string;
  primaryContactId?: string;

  residentialAddress: string;
  residentialAddressLine2: string;
  country: string | null;
  province: string | null;
  district: string;
  cityTown: string;
  postalCode: string;
  residentialAddressId?: string;

  sameAsResidential: boolean;
  mailingAddress: string;
  mailingAddressLine2: string;
  mailingCountry: string | null;
  mailingProvince: string | null;
  mailingDistrict: string;
  mailingCityTown: string;
  mailingPostalCode: string;
  mailingAddressId?: string;

  sameAsRegisteredOffice: boolean;
  correspondenceAddress: string;
  correspondenceAddressLine2: string;
  correspondenceCountry: string | null;
  correspondenceProvince: string | null;
  correspondenceCityTown: string;
  correspondencePostalCode: string;
  correspondenceAddressId?: string;
}

interface IdentificationState {
  idDocuments: Array<{
    idType: string;
    docNumber: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate: string;
    verification: string;
    // ADDED — IdentificationStep.tsx already has a working "Issuing
    // Country" Select bound to this field (via useCountries lookup); this
    // local interface just never declared it, so buildCustomerPayload was
    // hardcoding issuing_country to "" instead of reading the real value.
    issuingCountry?: string | null;
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
  const isCompany = identity.customerType === "Business";

  const netWorth =
    financial.totalAssets !== "" && financial.totalLiabilities !== ""
      ? Number(financial.totalAssets) - Number(financial.totalLiabilities)
      : 0;

  const documents = identification.idDocuments.map((doc) => ({
    document_type: doc.idType,
    document_name: doc.idType, // TODO: no separate "document name" field in state
    document_number: doc.docNumber,
    issue_date: doc.issueDate,
    expiry_date: doc.expiryDate || undefined,
    verification_status: doc.verification,
    issuing_authority: doc.issuingAuthority,
    // FIXED: was hardcoded to "" — IdentificationStep.tsx already collects
    // this via a country Select bound to issuingCountry, it just wasn't
    // being read here.
    issuing_country: doc.issuingCountry ?? "",
  }));

  // --- addresses ---------------------------------------------------------
  // Entries with no address_line1 are dropped so we don't insert empty
  // Address docs when a section was left blank.
  const addresses = (
    isCompany
      ? [
          {
            name: identity.registeredOfficeAddressId,
            address_type: "Office",
            address_line1: identity.businessAddress,
            address_line2: identity.businessAddressLine2 || undefined,
            city: identity.businessCity,
            state: identity.businessProvince ?? "",
            country: identity.businessCountry ?? "",
            pincode: identity.businessPostalCode,
            is_primary_address: 1 as const,
            is_shipping_address: (contact.sameAsRegisteredOffice ? 1 : 0) as 0 | 1,
          },
          contact.sameAsRegisteredOffice
            ? null
            : {
                name: contact.correspondenceAddressId,
                address_type: "Office",
                address_line1: contact.correspondenceAddress,
                address_line2: contact.correspondenceAddressLine2 || undefined,
                city: contact.correspondenceCityTown,
                state: contact.correspondenceProvince ?? "",
                country: contact.correspondenceCountry ?? "",
                pincode: contact.correspondencePostalCode,
                is_primary_address: 0 as const,
                is_shipping_address: 1 as const,
              },
        ]
      : [
          {
            name: contact.residentialAddressId,
            address_type: "Current",
            address_line1: contact.residentialAddress,
            address_line2: contact.residentialAddressLine2 || undefined,
            city: contact.cityTown,
            state: contact.province ?? "",
            country: contact.country ?? "",
            pincode: contact.postalCode,
            is_primary_address: 1 as const,
            is_shipping_address: (contact.sameAsResidential ? 1 : 0) as 0 | 1,
          },
          contact.sameAsResidential
            ? null
            : {
                name: contact.mailingAddressId,
                address_type: "Permanent",
                address_line1: contact.mailingAddress,
                address_line2: contact.mailingAddressLine2 || undefined,
                city: contact.mailingCityTown,
                state: contact.mailingProvince ?? "",
                country: contact.mailingCountry ?? "",
                pincode: contact.mailingPostalCode,
                is_primary_address: 0 as const,
                is_shipping_address: 1 as const,
              },
        ]
  ).filter((a): a is NonNullable<typeof a> => !!a && a.address_line1.trim().length > 0);

  const contacts = isCompany
    ? (() => {
        // Sanitize before splitting — a stray comma (or other punctuation)
        // in the free-text Primary Contact field was leaking straight into
        // first_name (e.g. ",wasan"), and since edit-hydration rejoins
        // first_name + last_name with a space, the corruption would persist
        // across every subsequent edit once it got saved once.
        const trimmed = contact.primaryContactName
          .trim()
          .replace(/,/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!trimmed) return [];
        const [first, ...rest] = trimmed.split(" ");
        return [
          {
            name: contact.primaryContactId,
            first_name: first,
            last_name: rest.join(" "),
            email_id: contact.email,
            mobile_no: contact.mobileNumber,
            is_primary_contact: 1 as const,
            is_billing_contact: 1 as const,
          },
        ];
      })()
    : identity.firstName.trim()
      ? [
          {
            name: contact.primaryContactId,
            first_name: identity.firstName,
            last_name: identity.lastName,
            email_id: contact.email,
            mobile_no: contact.mobileNumber,
            is_primary_contact: 1 as const,
            is_billing_contact: 1 as const,
          },
        ]
      : [];

  if (!isCompany) {
    const payload: IndividualCustomerPayload = {
      customer_name: [identity.firstName, identity.lastName].filter(Boolean).join(" "),
      customer_type: "Individual",
      customer_group: identity.customerGroup ?? "",
      territory: "", // TODO: no source field
      gender: identity.gender, // top-level — in ALLOWED_CUSTOMER_FIELDS
      first_name: identity.firstName,
      last_name: identity.lastName,
      email_id: contact.email,
      mobile_no: contact.mobileNumber,
      tax_id: identity.individualTaxId,
      default_currency: identity.currency ?? "",
      is_npa: 0, // TODO: no source field
      relationship_manager: financial.relationshipManager ?? undefined,
      // Single source of truth — basic_details is the only child table
      // whose whitelist actually includes NRC + all financials (confirmed
      // against constant.py BASIC_DETAILS_FIELDS). extended_details is
      // NOT sent: its real whitelist is {registration_no,
      // strict_credit_limit, principal_id}, none of which this form
      // collects.
      basic_details: [
        {
          national_identification_number: identity.nrcNumber,
          gender: identity.gender,
          date_of_birth: identity.dateOfBirth,
          marital_status: identity.maritalStatus,
          nationality: identity.nationality,
          is_staff_customer: identity.isStaffCustomer ? 1 : 0,
          staff_id: identity.isStaffCustomer ? identity.staffId : null,
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
          net_worth: netWorth,
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
    // FIXED: ALLOWED_CUSTOMER_FIELDS has top-level "industry", not
    // "industry_type" — "industry_type" only exists as a child-table
    // field (basic_details/extended_details). Sending "industry_type"
    // at the top level meant it was silently dropped by create_customer's
    // field-whitelist loop.
    industry: identity.businessIndustry ?? "",
    is_npa: 0, // TODO: no source field
    relationship_manager: financial.relationshipManager ?? undefined,
    // Single source of truth — same reasoning as Individual above.
    // Company registration fields (registered_company_name,
    // registration_number, incorporation_date) also only exist in
    // BASIC_DETAILS_FIELDS, not in the real EXTENDED_DETAILS_FIELDS.
    basic_details: [
      {
        registered_company_name: identity.companyName,
        registration_number: identity.registrationNumber,
        incorporation_date: identity.incorporationDate,
        // ADDED — source_of_income is in the shared BASIC_DETAILS_FIELDS
        // whitelist (no customer_type restriction in constant.py) and is
        // already collected by FinancialStep for both customer types, but
        // was only ever included in the Individual basic_details object.
        source_of_income: financial.sourceOfIncome,
        total_assets: Number(financial.totalAssets) || 0,
        total_liabilities: Number(financial.totalLiabilities) || 0,
        net_worth: netWorth,
        existing_monthly_obligations:
          Number(financial.existingMonthlyObligations) || 0,
        annual_revenue: Number(identity.annualRevenue) || 0,
        number_of_employees: Number(identity.numberOfEmployees) || 0,
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