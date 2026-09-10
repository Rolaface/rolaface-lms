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
 *
 * customerType mapping ASSUMPTION (confirm before relying on this):
 *   IdentityStep's SegmentedControl currently only offers Individual /
 *   Business (2 values) — everything maps 1:1, no "Joint/SME/Corporate/
 *   Group" collapsing needed at present.
 *
 * RESOLVED (confirmed against customer_api/constant.py CHILD_TABLE_FIELDS):
 *   `basic_details` does NOT accept registered_company_name /
 *   registration_number / incorporation_date, and does NOT accept
 *   national_identification_number (NRC) either — only `extended_details`
 *   does. Individual now sends BOTH basic_details (unchanged, already
 *   working) and extended_details (adds NRC). Company sends BOTH
 *   basic_details and extended_details as of 2026-09-09 (see below) —
 *   previously it sent only extended_details.
 *
 * RESOLVED (confirmed against customer_api/utils.py sync_addresses /
 * sync_contacts):
 *   addresses[] / contacts[] are now built directly from the flat
 *   Identity/Contact step fields (Residential/Mailing/Registered
 *   Office/Correspondence, Primary Contact Name) instead of the
 *   `customerAddresses` / `customerContacts` arrays, which were only ever
 *   populated during edit-mode hydration and stayed `[]` for every new
 *   customer — meaning addresses/contacts silently never reached the
 *   backend on create. The `*AddressId` / `primaryContactId` fields (set
 *   during edit hydration) are passed through as each entry's `name` so
 *   `sync_addresses`/`sync_contacts` patch the existing Address/Contact
 *   doc on update instead of orphaning it and inserting a duplicate.
 *
 * RESOLVED (confirmed against customer_api/constant.py CHILD_TABLE_FIELDS —
 * both basic_details and extended_details accept `net_worth`):
 *   FinancialStep shows Net Worth as an auto-calculated (Total Assets -
 *   Total Liabilities) disabled field, but this builder never sent it —
 *   backend never received it. Now computed here the same way and added
 *   to every child-details row (individual basic_details + extended_details,
 *   company basic_details + extended_details).
 *
 * RESOLVED (2026-09-09, backend requirement): total_assets,
 * total_liabilities, net_worth, existing_monthly_obligations,
 * annual_revenue and number_of_employees are handled from basic_details.
 * Company previously sent these 6 fields ONLY inside extended_details
 * (no basic_details entry existed for Company at all) — Company now also
 * sends a basic_details row with these 6 values, alongside the unchanged
 * extended_details row (kept in both — see CompanyBasicDetails comment in
 * customerApi.ts for why extended_details wasn't stripped of them).
 * Individual is unchanged: no UI collects annual_revenue/number_of_employees
 * for Individual, so those two stay Company-only, same as before.
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
    issuing_country: "", // TODO: no source field
  }));

  // --- addresses ---------------------------------------------------------
  // Built from the flat step fields (not a `customerAddresses` array — see
  // header note). Entries with no address_line1 are dropped so we don't
  // insert empty Address docs when a section was left blank.
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
      // Additive — basic_details above is unchanged/already-confirmed;
      // extended_details is the only table that accepts NRC (see header
      // note), sent alongside so it doesn't silently vanish.
      extended_details: [
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
   // Backend's ALLOWED_CUSTOMER_FIELDS (constant.py) has top-level
   // "industry", not "industry_type" — confirmed against backend's own
   // sample Company payload. Sending "industry_type" here was silently
   // dropped by create_customer's field loop (it only copies fields that
   // are in ALLOWED_CUSTOMER_FIELDS).
   industry_type: identity.businessIndustry ?? "",
    is_npa: 0, // TODO: no source field
    relationship_manager: financial.relationshipManager ?? undefined,

   
    basic_details: [
      {
        registered_company_name: identity.companyName,
        registration_number: identity.registrationNumber,
        incorporation_date: identity.incorporationDate,
        total_assets: Number(financial.totalAssets) || 0,
        total_liabilities: Number(financial.totalLiabilities) || 0,
        net_worth: netWorth,
        existing_monthly_obligations:
          Number(financial.existingMonthlyObligations) || 0,
        annual_revenue: Number(identity.annualRevenue) || 0,
        number_of_employees: Number(identity.numberOfEmployees) || 0,
      },
    ],

    extended_details: [
      {
        registered_company_name: identity.companyName,
        registration_number: identity.registrationNumber,
        incorporation_date: identity.incorporationDate,
        number_of_employees: Number(identity.numberOfEmployees) || 0,
        annual_revenue: Number(identity.annualRevenue) || 0,
        total_assets: Number(financial.totalAssets) || 0,
        total_liabilities: Number(financial.totalLiabilities) || 0,
        net_worth: netWorth,
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