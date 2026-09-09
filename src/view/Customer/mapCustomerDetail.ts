import dayjs from "dayjs";
import type {
  BorrowerProfile,
  LoanSummary,
  LoanStatus,
} from "../../types/customerview";
import type { CustomerDetailRaw } from "../../api/Customer/customerApi";

export function mapCustomerDetailToBorrowerProfile(
  raw: CustomerDetailRaw
): BorrowerProfile {
  const isBusiness = raw.customer_type === "Company";


  const basicDetails = raw.basic_details?.[0];
  const extendedDetails = raw.extended_details?.[0];
  const details: Record<string, any> = {
    ...basicDetails,
    ...Object.fromEntries(
      Object.entries(extendedDetails ?? {}).filter(
        ([, v]) => v !== null && v !== undefined
      )
    ),
  };

  const addresses = raw.addresses ?? [];
  const contacts = raw.contacts ?? [];

  const primaryAddress =
    addresses.find(
      (a) => a.name === raw.customer_primary_address || a.is_primary_address === 1
    ) ?? addresses[0];
  const shippingAddress =
    addresses.find((a) => a.is_shipping_address === 1) ?? primaryAddress;

  const primaryContact =
    contacts.find(
      (c) => c.name === raw.customer_primary_contact || c.is_primary_contact === 1
    ) ?? contacts[0];
  const secondaryContact = contacts.find((c) => c.name !== primaryContact?.name);

  const nok = raw.next_of_kin?.[0];

  // dayjs handles the "2026-09-08 10:16:49.336661" backend format fine
  // without a custom replace/parse step. isValid() guards against a
  // missing/malformed date instead of silently rendering "Invalid Date".
  const formatDate = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const d = dayjs(value);
    return d.isValid() ? d.format("DD MMM YYYY") : undefined;
  };

  return {
    customerId: raw.name,
    name: raw.customer_name,
    custId: raw.name,
    status: raw.status?.toLowerCase() === "active" ? "Active" : "Inactive",
    mobile: raw.mobile_no,
    nationalId: extendedDetails?.national_identification_number ?? undefined,
 currency: raw.default_currency || undefined, 
    relationshipManager: raw.relationship_manager_name
      ? {
          name: raw.relationship_manager_name,
          branch: "",
          initials: raw.relationship_manager_name
            .split(" ")
            .filter(Boolean)
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
        }
      : undefined,

    relationshipSince: formatDate(raw.creation),
    lastUpdated: formatDate(raw.modified),

    loans: [], // filled in by Borrower360's own getLoanList effect
    investments: undefined,
    savings: undefined,
    fixedDeposits: undefined,

    // --- Identity ---
    type: raw.customer_type,
    firstName: raw.first_name || undefined,
    lastName: raw.last_name || undefined,
    gender: raw.gender ?? details.gender ?? null,
    dateOfBirth: details.date_of_birth || undefined,
    nationality: details.nationality ?? null,
    occupation: details.occupation || undefined,
    industry: (details.industry_type ?? raw.industry) ?? null,
    employer: details.employer_name || undefined,

    // --- Business identity ---
    registeredCompanyName: isBusiness
      ? extendedDetails?.registered_company_name || raw.customer_name
      : undefined,
    registrationNumber: isBusiness
      ? extendedDetails?.registration_number || undefined
      : undefined,
    incorporationDate: isBusiness
      ? formatDate(extendedDetails?.incorporation_date)
      : undefined,
    employees: isBusiness ? extendedDetails?.number_of_employees ?? undefined : undefined,
    annualRevenue: isBusiness ? extendedDetails?.annual_revenue ?? undefined : undefined,
    addressLine1: isBusiness ? primaryAddress?.address_line1 || undefined : undefined,
    addressLine2: isBusiness ? primaryAddress?.address_line2 || undefined : undefined,
    city: primaryAddress?.city || undefined,
    directorsAndShareholders: isBusiness
      ? (raw.stakeholders ?? []).map((s) => ({
          name: s.stakeholder_name,
          role: s.stakeholder_role,
          ownershipPercent: s.ownership_percentage,
        }))
      : undefined,

    // --- Contact ---
    email: raw.email_id || primaryContact?.email_id || undefined,
    alternateMobile: secondaryContact?.mobile_no || undefined,
    residentialAddress: !isBusiness
      ? primaryAddress?.address_line1 || undefined
      : undefined,
    country: primaryAddress?.country || null,
    province: primaryAddress?.state || null,
    postalCode: primaryAddress?.pincode || undefined,
    mailingAddress:
      shippingAddress && shippingAddress.name !== primaryAddress?.name
        ? shippingAddress.address_line1
        : undefined,

    // --- Next of kin ---
    nextOfKin: nok
      ? {
          firstName: nok.first_name || undefined,
          middleName: nok.middle_name || undefined,
          lastName: nok.last_name || undefined,
          relationship: nok.relationship ?? null,
          phone: nok.phone || undefined,
          address: nok.address_line_1 || undefined,
          district: nok.district || undefined,
          city: nok.city || undefined,
          postalCode: nok.postal_code || undefined,
        }
      : undefined,

    // --- KYC & Compliance ---
    identificationDocuments: (raw.documents ?? []).map((d) => ({
      name: d.document_type || d.document_name,
      number: d.document_number || undefined,
      expiryDate: formatDate(d.expiry_date),
      verification: d.verification_status || undefined,
    })),
    complianceChecks: undefined, // TODO: not returned by getCustomerById yet
    requiredDocuments: undefined,
    kycStatus: undefined,
    riskRating: undefined,

    // --- Financial & Lending ---
    exposure: undefined, // TODO: sum of loan exposure — no backend field yet
    creditAssessment: undefined, // TODO: bureau data not on this endpoint yet
    financialProfile: {
      educationLevel: details.education_level ?? null,
      employmentType: details.employment_type ?? null,
      sourceOfIncome: details.source_of_income ?? null,
      monthlyIncome: details.monthly_income ?? null,
      annualIncome: details.annual_income ?? null,
      creditRiskCategory: null,
      relationshipManager: raw.relationship_manager_name ?? null,
    },
  };
}

// Accepts `any` on purpose: the loan-list endpoint returns extra runtime
// fields (status, dpd) that aren't in the typed LoanRaw interface yet.
export function mapLoanRawToLoanSummary(raw: any): LoanSummary {
  const loanAmount = Number(raw?.loan_amount) || 0;
  const totalPrincipalPaid = Number(raw?.total_principal_paid) || 0;

  const repaidPercent =
    loanAmount > 0
      ? Math.round(
          Math.min(100, Math.max(0, (totalPrincipalPaid / loanAmount) * 100))
        )
      : 0;

  const knownStatuses: LoanStatus[] = ["Active", "Delinquent", "Closed", "Overdue"];
  const rawStatus = String(raw?.status ?? "");
  const status: LoanStatus = knownStatuses.includes(rawStatus as LoanStatus)
    ? (rawStatus as LoanStatus)
    : "Active";

  return {
    id: raw?.name ?? "",
    loanNumber: raw?.name ?? "",
    product: raw?.loan_product ?? "",
    status,
    outstanding: Number(raw?.pending_principal_amount) || 0,
    nextInstallment:
      raw?.total_payment !== undefined && raw?.total_payment !== null
        ? Number(raw.total_payment)
        : null,
    repaidPercent,
    dpd: Number(raw?.dpd) || 0,
  };
}