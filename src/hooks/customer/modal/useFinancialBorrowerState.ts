import { useState } from "react";

export function useFinancialBorrowerState() {
  // Financial
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [sourceOfIncome, setSourceOfIncome] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [creditRiskCategory, setCreditRiskCategory] = useState<string | null>(
    null,
  );

  // Borrower
  const [convertToBorrower, setConvertToBorrower] = useState(true);
  const [borrowerCategory, setBorrowerCategory] = useState<string | null>(
    null,
  );
  const [loanPurpose, setLoanPurpose] = useState<string | null>(null);
  const [intendedLoanProduct, setIntendedLoanProduct] = useState<
    string | null
  >(null);
  const [preliminaryRiskRating, setPreliminaryRiskRating] = useState<
    string | null
  >(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [creditOfficer, setCreditOfficer] = useState<string | null>(null);
  const [relationshipManager, setRelationshipManager] = useState<
    string | null
  >(null);

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
    setCreditRiskCategory(null);
    setConvertToBorrower(true);
    setBorrowerCategory(null);
    setLoanPurpose(null);
    setIntendedLoanProduct(null);
    setPreliminaryRiskRating(null);
    setBranch(null);
    setCreditOfficer(null);
    setRelationshipManager(null);
  };

  return {
    educationLevel, setEducationLevel,
    employmentType, setEmploymentType,
    sourceOfIncome, setSourceOfIncome,
    monthlyIncome, setMonthlyIncome,
    annualIncome, setAnnualIncome,
    creditRiskCategory, setCreditRiskCategory,
    convertToBorrower, setConvertToBorrower,
    borrowerCategory, setBorrowerCategory,
    loanPurpose, setLoanPurpose,
    intendedLoanProduct, setIntendedLoanProduct,
    preliminaryRiskRating, setPreliminaryRiskRating,
    branch, setBranch,
    creditOfficer, setCreditOfficer,
    relationshipManager, setRelationshipManager,
    getErrors,
    reset,
  };
}