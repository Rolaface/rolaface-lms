import type {
  CustomerCreatePayload,
  IndividualCustomerPayload,
  CompanyCustomerPayload,
} from "../../api/Customer/customerApi";

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

    issuingCountry?: string | null;
    // Locally-held file for this document row, kept in real app state
    // via updateIdDocument. Not sent to the server as a File — see the
    // mapping below.
    documentUpload?: File | null;
    // Once a real upload endpoint exists, the returned reference
    // (URL/path/id) should be stored here and sent instead of null.
    documentUploadRef?: string | null;
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

    issuing_country: doc.issuingCountry ?? "",
    // Stays null (matching the sample payload) until a real upload
    // endpoint exists and returns a reference for documentUploadRef.
    // The picked File itself lives on doc.documentUpload in the
    // meantime — see handleCreateCustomer for where a future
    // pre-submit upload step would go.
    document_upload: doc.documentUploadRef ?? null,
  }));

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
            is_shipping_address: (contact.sameAsRegisteredOffice ? 1 : 0) as
              0 | 1,
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
  ).filter(
    (a): a is NonNullable<typeof a> => !!a && a.address_line1.trim().length > 0,
  );

  const contacts = isCompany
    ? (() => {
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
      customer_name: [identity.firstName, identity.lastName]
        .filter(Boolean)
        .join(" "),
      customer_type: "Individual",
      customer_group: identity.customerGroup ?? "",
      territory: "",
      gender: identity.gender,
      first_name: identity.firstName,
      last_name: identity.lastName,
      email_id: contact.email,
      mobile_no: contact.mobileNumber,
      tax_id: identity.individualTaxId,
      default_currency: identity.currency ?? "",
      is_npa: 0,
      relationship_manager: financial.relationshipManager ?? undefined,

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
          country: "",
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
    territory: "",
    email_id: contact.email,
    mobile_no: contact.mobileNumber,
    tax_id: identity.taxId,
    default_currency: identity.currency ?? "",

    industry: identity.businessIndustry ?? "",
    is_npa: 0,
    relationship_manager: financial.relationshipManager ?? undefined,

    basic_details: [
      {
        registered_company_name: identity.companyName,
        registration_number: identity.registrationNumber,
        incorporation_date: identity.incorporationDate,

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