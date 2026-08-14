export interface BaseLoanApplication {
  application_type: "Business Loan" | "Personal Loan";
  application_date: string;
  gender: string;
  amount: string;
  tenure: string;
  total_amount: string;
}
 
export interface BusinessLoanApplication extends BaseLoanApplication {
  application_type: "Business Loan";
    nationality: string;
  // Applicant details (Business specific prefix)
  applicant_first_name: string;
  applicant_middle_name?: string;
  applicant_last_name: string;
  applicant_phone: string;
  applicant_email: string;
  applicant_birth_date: string;
  applicant_national_registration_card: string;
  applicant_gender: string;
  applicant_marital_status: string;
  applicant_nationality: string;
  applicant_address: string;
  applicant_position: string;

  // Company details
  company_name: string;
  type_of_business: string;
  established_date: string;
  nature_of_business: string;
  registered_office: string;

  // Loan & Collateral Details
  purpose_of_loan: string;
  collateral_pledged: string;

  // Directors
  directors: {
    director_name: string;
    director_phone: string;
    director_email: string;
    national_registration_card: string;
  }[];

  // Business Documents
  business_documents: {
    document_for: string;
    document_name: string;
    file: string;
  }[];
}

// --------------------------------------------------------
// 2. Personal Loan Specific Payload
// --------------------------------------------------------
export interface PersonalLoanApplication extends BaseLoanApplication {
  application_type: "Personal Loan";
  marital_status: string;
  // Applicant details (Personal specific names)
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date: string;
  national_registration_card: string;
  residential_address: string;
  
  // Employment Details
  occupation: string;
  employer_name: string;

  // Loan Details
  loan_purpose: string;

  // Next of Kin details
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_email: string;

  // Personal Documents
  documents: {
    document_for: string;
    document_name: string;
    file: string;
  }[];
}

export type LoanApplicationPayload = BusinessLoanApplication | PersonalLoanApplication;

export interface CreateLoanApplicationResponse {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: {
      name: string;
      [key: string]: unknown;
    };
  };
}