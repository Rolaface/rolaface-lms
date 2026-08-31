import { useState } from "react";

export function useFinancialBorrowerState() {
  // Financial
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [sourceOfIncome, setSourceOfIncome] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [totalAssets, setTotalAssets] = useState<number | "">("");
  const [totalLiabilities, setTotalLiabilities] = useState<number | "">("");
  const [existingMonthlyObligations, setExistingMonthlyObligations] =
    useState<number | "">("");
  const [relationshipManager, setRelationshipManager] = useState<
    string | null
  >(null);

  // Lending — Credit Assessment
  const [bureauProvider, setBureauProvider] = useState<string | null>(
    "TransUnion Zambia",
  );

  // Lending — Loan Requirement
  const [convertToBorrower, setConvertToBorrower] = useState(true);
  const [borrowerCategory, setBorrowerCategory] = useState<string | null>(
    null,
  );
  const [loanPurpose, setLoanPurpose] = useState<string | null>(null);
  const [intendedLoanProduct, setIntendedLoanProduct] = useState<
    string | null
  >(null);
  const [loanAmountRequested, setLoanAmountRequested] = useState<
    number | ""
  >("");
  const [loanTenureMonths, setLoanTenureMonths] = useState<number | "">("");
  const [repaymentFrequency, setRepaymentFrequency] = useState<
    string | null
  >(null);
  const [preliminaryRiskRating, setPreliminaryRiskRating] = useState<
    string | null
  >(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [creditOfficer, setCreditOfficer] = useState<string | null>(null);

  const getErrors = (): Record<string, string> => {
    if (!convertToBorrower) return {};
    const errs: Record<string, string> = {};
    if (!borrowerCategory)
      errs.borrowerCategory = "Borrower category is required";
    if (!loanPurpose) errs.loanPurpose = "Loan purpose is required";
    if (!branch) errs.branch = "Branch is required";
    return errs;
  };

  const reset = () => {
    setEducationLevel(null);
    setEmploymentType(null);
    setSourceOfIncome(null);
    setMonthlyIncome("");
    setAnnualIncome("");
    setTotalAssets("");
    setTotalLiabilities("");
    setExistingMonthlyObligations("");
    setRelationshipManager(null);
    setBureauProvider("TransUnion Zambia");
    setConvertToBorrower(true);
    setBorrowerCategory(null);
    setLoanPurpose(null);
    setIntendedLoanProduct(null);
    setLoanAmountRequested("");
    setLoanTenureMonths("");
    setRepaymentFrequency(null);
    setPreliminaryRiskRating(null);
    setBranch(null);
    setCreditOfficer(null);
  };

  return {
    educationLevel, setEducationLevel,
    employmentType, setEmploymentType,
    sourceOfIncome, setSourceOfIncome,
    monthlyIncome, setMonthlyIncome,
    annualIncome, setAnnualIncome,
    totalAssets, setTotalAssets,
    totalLiabilities, setTotalLiabilities,
    existingMonthlyObligations, setExistingMonthlyObligations,
    relationshipManager, setRelationshipManager,
    bureauProvider, setBureauProvider,
    convertToBorrower, setConvertToBorrower,
    borrowerCategory, setBorrowerCategory,
    loanPurpose, setLoanPurpose,
    intendedLoanProduct, setIntendedLoanProduct,
    loanAmountRequested, setLoanAmountRequested,
    loanTenureMonths, setLoanTenureMonths,
    repaymentFrequency, setRepaymentFrequency,
    preliminaryRiskRating, setPreliminaryRiskRating,
    branch, setBranch,
    creditOfficer, setCreditOfficer,
    getErrors,
    reset,
  };
}