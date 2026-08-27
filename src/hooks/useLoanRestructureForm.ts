import { useEffect, useMemo, useState } from "react";
import {
  createLoanRestructure, updateLoanRestructure, getLoanRestructure,
  searchLoanRepaymentAccounts, getLoanDetails,
  type LoanRestructurePayload, type LoanRestructureUpdatePayload, type LoanRestructureCharge,
} from "../api/loanRestructureApi";
import {
  groupAccountsByBorrower, addByFrequency, todayISO,
  type RestructureBorrower, type RestructureLoan, type RestructureType,
} from "../types/RestructureTypes";
import { openCommonModal } from "../components/Modal/AlertModal";
import { parseFrappeError } from "../utils/parseFrappeError";
import { parseCommentForTextarea } from "../utils/commentUtils";


interface UseLoanRestructureFormArgs {
  opened: boolean;
  editName?: string | null;
  viewName?: string | null;
  onSaved: () => void;
}

export interface ChargeRow {
  id: string;
  charge: string;
  amount: number | "";
}

let chargeRowSeq = 0;
const nextChargeRowId = () => `charge_row_${Date.now()}_${chargeRowSeq++}`;

export function useLoanRestructureForm({ opened, editName, viewName, onSaved }: UseLoanRestructureFormArgs) {
  const isViewMode = !!viewName;
  const isEditMode = !!editName;

  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<RestructureBorrower[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<RestructureBorrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanLocked, setLoanLocked] = useState(false);

  const [valueDate, setValueDate] = useState(todayISO());
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [restructureType, setRestructureType] = useState<RestructureType>("RATE_CHANGE");

  const [newInterestRate, setNewInterestRate] = useState<number | "">("");
  const [newPenaltyRate, setNewPenaltyRate] = useState<number | "">("");

  const [topupAmount, setTopupAmount] = useState<number | "">("");
  const [newPrincipalOutstanding, setNewPrincipalOutstanding] = useState<number | "">("");
  const [currentPrincipalOutstanding, setCurrentPrincipalOutstanding] = useState<number | "">("");

  const [extendTenureBy, setExtendTenureBy] = useState<number | "">("");

  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([]);

  const [currentInterestRate, setCurrentInterestRate] = useState<number>(0);
  const [currentPenaltyRate, setCurrentPenaltyRate] = useState<number>(0);
  const [loanDetailsLoading, setLoanDetailsLoading] = useState(false);


  const [currentLoanProduct, setCurrentLoanProduct] = useState<string>("");
  const [currentLoanAmount, setCurrentLoanAmount] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);

  const [oldValues, setOldValues] = useState<{ rate?: number; principal?: number; tenure?: number } | null>(null);
  const [overrideNewMaturityDate, setOverrideNewMaturityDate] = useState<string | null>(null);

  const selectedLoan = selectedBorrower?.loans.find((l) => l.id === selectedLoanId) ?? null;

  const newMaturityDate = useMemo(() => {
    if (overrideNewMaturityDate !== null) return overrideNewMaturityDate;
    if (!selectedLoan?.maturityDate || extendTenureBy === "") return "";
    return addByFrequency(selectedLoan.maturityDate, Number(extendTenureBy), selectedLoan.repaymentFrequency);
  }, [selectedLoan, extendTenureBy, overrideNewMaturityDate]);

  // ---------- ALERT HELPERS (same pattern as CollateralTypeModal) ----------
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showWarning = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "Please review before continuing.",
      body,
      color: "orange",
      buttons: [{ label: "Close", color: "orange" }],
    });
  };

  const showSuccessModal = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  // debounced borrower search
  useEffect(() => {
    if (!search.trim() || selectedBorrower) { setMatches([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const rows = await searchLoanRepaymentAccounts(search.trim());
        setMatches(groupAccountsByBorrower(rows));
      } catch (err) {
        showError("Search Failed", err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, selectedBorrower]);

  const initLoanFields = (loan: RestructureLoan) => {
    setNewInterestRate("");
    setNewPenaltyRate("");
    setTopupAmount("");
    setCurrentPrincipalOutstanding(loan.principalOutstanding || "");
    setNewPrincipalOutstanding(loan.principalOutstanding || "");
    setExtendTenureBy("");

    setCurrentInterestRate(loan.interestRate || 0);
    setCurrentPenaltyRate(loan.penaltyRate || 0);
    setChargeRows([]);
    setCurrentLoanProduct("");
    setCurrentLoanAmount(0);
  };

  const handleSelectBorrower = (borrower: RestructureBorrower) => {
    setSelectedBorrower(borrower);
    setSelectedLoanId(borrower.loans[0]?.id ?? null);
    if (borrower.loans[0]) initLoanFields(borrower.loans[0]);
  };

  const handleSelectLoan = (loan: RestructureLoan) => {
    setSelectedLoanId(loan.id);
    initLoanFields(loan);
  };

  const resetAll = () => {
    setSearch(""); setMatches([]); setSelectedBorrower(null); setSelectedLoanId(null);
    setLoanLocked(false);
    setValueDate(todayISO()); setReason(null); setComment(""); setRestructureType("RATE_CHANGE");
    setOverrideNewMaturityDate(null);
    setNewInterestRate(""); setNewPenaltyRate(""); setTopupAmount(""); setNewPrincipalOutstanding("");
    setExtendTenureBy(""); setChargeRows([]); setOldValues(null);
    setCurrentPrincipalOutstanding("");
    setCurrentInterestRate(0); setCurrentPenaltyRate(0);
    setCurrentLoanProduct("");
    setCurrentLoanAmount(0);
  };

  const handleClearBorrower = () => {
    if (loanLocked) return; // locked in edit mode
    setSelectedBorrower(null); setSelectedLoanId(null); setSearch("");
  };

  useEffect(() => {
    if (!selectedLoan?.id || isViewMode || isEditMode) return;

    let cancelled = false;
    setLoanDetailsLoading(true);
    getLoanDetails(selectedLoan.id)
      .then((details) => {
        if (cancelled) return;
        const interest = Number(details.rate_of_interest) || 0;
        const penalty = Number(details.penalty_charges_rate) || 0;

        setCurrentInterestRate(interest);
        setCurrentPenaltyRate(penalty);
        setCurrentLoanProduct(details.loan_product || "");
        setCurrentLoanAmount(Number(details.loan_amount) || 0);

        const rows: ChargeRow[] = (details.loan_charges || []).map(() => ({
          id: nextChargeRowId(),
          charge: "",
          amount: "",
        }));
        setChargeRows(rows);
      })
      .catch((err) => {
        if (!cancelled) showError("Failed to Load Loan Details", err);
      })
      .finally(() => {
        if (!cancelled) setLoanDetailsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedLoan?.id, isViewMode, isEditMode]);


  useEffect(() => {
    if (!selectedLoan?.id || (!isViewMode && !isEditMode)) return;

    let cancelled = false;
    getLoanDetails(selectedLoan.id)
      .then((details) => {
        if (cancelled) return;
        setCurrentLoanProduct(details.loan_product || "");
        setCurrentLoanAmount(Number(details.loan_amount) || 0);
      })
      .catch(() => {
        // non-critical — silently ignored
      });

    return () => { cancelled = true; };
  }, [selectedLoan?.id, isViewMode, isEditMode]);

  // Load record for edit/view
  useEffect(() => {
    const name = editName || viewName;
    if (!name) return;

    (async () => {
      setIsLoadingRecord(true);
      try {
        const rec = await getLoanRestructure(name);
        const pseudoLoan: RestructureLoan = {
          id: rec.loan,
          type: "—",
          maturityDate: rec.old_maturity_date ?? "",
          principalOutstanding: rec.old_loan_amount ?? 0,
          interestRate: rec.old_rate_of_interest ?? 0,
          penaltyRate: 0,
          repaymentFrequency: "Monthly",
          npaStatus: "Standard",
          dpd: 0,
        };
        const pseudoBorrower: RestructureBorrower = {
          applicantType: rec.applicant_type,
          name: rec.applicant,
          phone: "",
          loans: [pseudoLoan],
        };
        setSelectedBorrower(pseudoBorrower);
        setSelectedLoanId(pseudoLoan.id);
        setLoanLocked(true);
        setValueDate((rec.restructure_date || todayISO()).slice(0, 10));
        setReason(rec.reason_for_restructure);
        setComment(parseCommentForTextarea((rec as any)._comments || (rec as any).comment || (rec as any).comments || (rec as any).manual_remarks || (rec as any).remarks || ""));
        setNewInterestRate(rec.new_rate_of_interest ?? "");
        setExtendTenureBy(rec.new_repayment_period_in_months ?? "");
        setRestructureType(rec.new_rate_of_interest != null ? "RATE_CHANGE" : "MODIFY_MATURITY");
        setOldValues({ rate: rec.old_rate_of_interest, principal: rec.old_loan_amount, tenure: rec.old_tenure });
        setOverrideNewMaturityDate(rec.new_maturity_date ?? "");
        setCurrentInterestRate(rec.old_rate_of_interest ?? 0);
        setCurrentPenaltyRate(0); // not returned by get_loan_restructure.api.get


        const rows: ChargeRow[] = (rec.loan_restructure_charges || []).map((c) => ({
          id: nextChargeRowId(),
          charge: c.charge || "",
          amount: c.restructure_charge_amount ?? "",
        }));
        setChargeRows(rows);
      } catch (err) {
        showError("Failed to Load Restructure", err);
      } finally {
        setIsLoadingRecord(false);
      }
    })();
  }, [editName, viewName]);

  // new
  const handleTopupAmountChange = (value: number | "") => {
    setTopupAmount(value);
    if (currentPrincipalOutstanding !== "" && value !== "") {
      setNewPrincipalOutstanding(Math.round((Number(currentPrincipalOutstanding) + Number(value)) * 100) / 100);
    }
  };

  const handleNewPrincipalChange = (value: number | "") => {
    setNewPrincipalOutstanding(value);
    if (currentPrincipalOutstanding !== "" && value !== "") {
      setTopupAmount(Math.round((Number(value) - Number(currentPrincipalOutstanding)) * 100) / 100);
    }
  };

  const handleCurrentPrincipalChange = (value: number | "") => {
    setCurrentPrincipalOutstanding(value);
    if (value !== "" && topupAmount !== "") {
      setNewPrincipalOutstanding(Math.round((Number(value) + Number(topupAmount)) * 100) / 100);
    }
  };

  const addChargeRow = () => {
    setChargeRows((rows) => [...rows, { id: nextChargeRowId(), charge: "", amount: "" }]);
  };

  const removeChargeRow = (id: string) => {
    setChargeRows((rows) => rows.filter((r) => r.id !== id));
  };


  const updateChargeRow = (id: string, patch: Partial<Pick<ChargeRow, "charge" | "amount">>) => {
    setChargeRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const canSubmit =
    !isViewMode;

  const getMissingFields = (): string[] => {
    const missing: string[] = [];

    return missing;
  };

  const buildCharges = (): LoanRestructureCharge[] => {
    return chargeRows
      .filter((r) => r.charge && Number(r.amount) > 0)
      .map((r) => ({
        doctype: "Loan Restructure Charges",
        charge: r.charge,
        is_post_restructure_charge: 1,
        restructure_charge_amount: Number(r.amount),
      }));
  };

  const handleSubmit = async () => {
    if (isViewMode) return;

    const missing = getMissingFields();
    if (missing.length > 0) {
      showWarning("Incomplete Details", missing.join(", "));
      return;
    }

    if (!selectedLoan || !selectedBorrower) return;

    const base: LoanRestructurePayload = {
      applicant_type: selectedBorrower.applicantType,
      applicant: selectedBorrower.name,
      restructure_type: "Normal Restructure",
      loan: selectedLoan.id,
      restructure_date: valueDate,
      reason_for_restructure: reason as string,
      _comments: comment,
      ...(newInterestRate !== "" ? { new_rate_of_interest: Number(newInterestRate) } : {}),
      ...(restructureType === "MODIFY_MATURITY" ? { new_repayment_period_in_months: Number(extendTenureBy) } : {}),
      loan_restructure_charges: buildCharges(),
    };

    try {
      setIsProcessing(true);
      if (isEditMode && editName) {
        const payload: LoanRestructureUpdatePayload = { ...base, name: editName };
        await updateLoanRestructure(payload);
        showSuccessModal("Restructure Updated", "Restructure updated successfully.");
      } else {
        await createLoanRestructure(base);
        showSuccessModal("Restructure Created", "Restructure created successfully.");
      }
      onSaved();
    } catch (err) {
      showError(isEditMode ? "Update Failed" : "Create Failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isViewMode, isEditMode, isLoadingRecord,
    search, setSearch, matches, searchLoading,
    selectedBorrower, selectedLoanId, selectedLoan, loanLocked,
    handleSelectBorrower, handleSelectLoan, handleClearBorrower,
    valueDate, setValueDate, reason, setReason, comment, setComment,
    restructureType, setRestructureType,
    newInterestRate, setNewInterestRate, newPenaltyRate, setNewPenaltyRate,
    topupAmount, handleTopupAmountChange, newPrincipalOutstanding, handleNewPrincipalChange,
    currentPrincipalOutstanding, handleCurrentPrincipalChange,
    extendTenureBy, setExtendTenureBy, newMaturityDate,
    currentInterestRate, currentPenaltyRate, loanDetailsLoading,
    chargeRows, addChargeRow, removeChargeRow, updateChargeRow,
    canSubmit, isProcessing, handleSubmit,
    oldValues,
    resetAll,
    currentLoanProduct,
    currentLoanAmount,
  };
}