import { Fragment, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { Box, Text, Button, ActionIcon, Modal } from "@mantine/core";
import {
  IconX, IconBriefcase, IconArrowRight, IconArrowLeft, IconCheck,
} from "@tabler/icons-react";
import {
//   createLoanProduct,
//   updateLoanProduct,
  getLoanProductById,
  getAccounts,
  type CreateLoanProductPayload,
} from "../../../api/LoanProduct/LoanProductAPi";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import {createLoanProduct, updateLoanProduct} from "../../../api/productApi";
import { STEPS, theme, toAccountOptions } from "./Constants";
import { ProductDetailsTab } from "./ProductDetailsTab";
import { AccountingTab, type AccountFieldsState, type InterestPenaltyAccountsState } from "./AccountingTab";
import { CollectionTab } from "./CollectionsTab";
import { ChargesTab, type ChargeRow } from "./ChargesTab";
import { ChargeAccountsModal } from "./ChargesaccountModal";

interface LoanProductProps {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
  loanProductId?: string | null;
  isViewMode?: boolean;
}

export function LoanProductModal({ opened, onClose, onSaved, loanProductId, isViewMode }: LoanProductProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>("0");

  const form = useForm({
    initialValues: {
      productCode: "",
      productName: "",
      loanCategory: null as string | null,
      repaymentScheduleType: null as string | null,
      maxLoanAmount: "" as number | "",
      npaThreshold: "" as number | "",
      interestRate: "" as number | "",
      interestFrequency: null as string | null,
      penaltyRate: "" as number | "",
      penaltyFrequency: null as string | null,
      gracePeriodDays: "" as number | "",
      collectionSeq: {
        standard: null as string | null,
        subStandard: null as string | null,
        writtenOff: null as string | null,
        settlement: null as string | null,
      },
    },
    validate: {
      productCode: (v) => (!v ? "Product Code is required" : null),
      productName: (v) => (!v ? "Product Name is required" : null),
      loanCategory: (v) => (!v ? "Loan Category is required" : null),
      repaymentScheduleType: (v) => (!v ? "Repayment Schedule Type is required" : null),
      maxLoanAmount: (v) => (!v ? "Maximum Loan Amount is required" : null),
      npaThreshold: (v) => (!v ? "This field is required" : null),
      interestRate: (v) => (!v ? "Interest Rate is required" : null),
    //   interestFrequency: (v) => (!v ? "Interest Frequency is required" : null),
      penaltyRate: (v) => (!v ? "Penalty Rate is required" : null),
    //   penaltyFrequency: (v) => (!v ? "Penalty Frequency is required" : null),
      collectionSeq: {
        standard: (v) => (!v ? "Required" : null),
        subStandard: (v) => (!v ? "Required" : null),
        writtenOff: (v) => (!v ? "Required" : null),
        settlement: (v) => (!v ? "Required" : null),
      },
    },
  });

  // Non-required / table-style data kept outside the form (same as charges/collaterals in LoanAccountModal)
  const [generalAccs, setGeneralAccs] = useState<AccountFieldsState>({
    loanAccount: "", disbursementAccount: "", repaymentAccount: "", writeOffAccount: "",
    writeOffRecoveryAccount: "", subsidyAccount: "", securityDepositAccount: "",
    suspenseCollectionAccount: "", customerRefundAccount: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sameAsInterest, setSameAsInterest] = useState(false);
  const [interestAccs, setInterestAccs] = useState<InterestPenaltyAccountsState>({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
  const [penaltyAccs, setPenaltyAccs] = useState<InterestPenaltyAccountsState>({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
  // Not part of the Interest/Penalty side-by-side table since there's no
  // penalty equivalent — the backend requires this only on the interest side.
  const [brokenPeriodRecoveryAccount, setBrokenPeriodRecoveryAccount] = useState("");

  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [accountsModalIndex, setAccountsModalIndex] = useState<number | null>(null);

  // ---------- ACCOUNT LOOKUPS (real data, replaces the old dummyAccounts) ----------
  // Income accounts -> used for every "Income Account" field (interest, penalty, charges)
  const { data: incomeAccountsData } = useQuery({
    queryKey: ["accounts", "Income"],
    queryFn: () => getAccounts({ root_type: "Income" }),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  // Asset/Liability accounts -> used for principal-side balance accounts
  // (loan, disbursement, repayment, receivable, accrued, suspense, waiver,
  // security deposit, suspense collection, customer refund, subsidy)
  const { data: principalAccountsData } = useQuery({
    queryKey: ["accounts", "Asset,Liability"],
    queryFn: () => getAccounts({ root_type: "Asset,Liability" }),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  // Unrestricted account list (no root_type filter) -> used for Write Off /
  // Write Off Recovery accounts, per the API note.
  const { data: allAccountsData } = useQuery({
    queryKey: ["accounts", "all"],
    queryFn: () => getAccounts(),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  const incomeAccounts = toAccountOptions(incomeAccountsData);
  const principalAccounts = toAccountOptions(principalAccountsData);
  const writeOffAccounts = toAccountOptions(allAccountsData);

  // ---------- FETCH EXISTING PRODUCT (view / edit) ----------
  const { data: existingProductData, isLoading: isFetchingProduct } = useQuery({
    queryKey: ["loanProduct", loanProductId],
    queryFn: async () => await getLoanProductById(loanProductId as string),
    enabled: !!loanProductId && opened === true,
    refetchOnMount: "always",
  });

  useEffect(() => {
    // 1. Account for the 'message' wrapper shown in your network tab
    const product = (existingProductData as any)?.message?.data || (existingProductData as any)?.data;
    if (!product) return;

    // 2. Read directly from the flat structure
    form.setValues({
      productCode: product.product_code || "",
      productName: product.product_name || "",
      loanCategory: product.loan_category || null,
      repaymentScheduleType: product.repayment_schedule_type || null,
      maxLoanAmount: product.maximum_loan_amount != null ? Number(product.maximum_loan_amount) : "",
     npaThreshold: product.days_past_due_threshold_for_npa != null ? Number(product.days_past_due_threshold_for_npa) : "",
      interestRate: product.rate_of_interest != null ? Number(product.rate_of_interest) : "",
      interestFrequency: product.interest_frequency || null,
      penaltyRate: product.penalty_interest_rate != null ? Number(product.penalty_interest_rate) : "",
      penaltyFrequency: product.penalty_frequency || null,
      gracePeriodDays: product.grace_period_in_days != null ? Number(product.grace_period_in_days) : "",
      collectionSeq: {
        standard: product.collection_offset_sequence_for_standard_asset || null,
        subStandard: product.collection_offset_sequence_for_sub_standard_asset || null,
        writtenOff: product.collection_offset_sequence_for_written_off_asset || null,
        settlement: product.collection_offset_sequence_for_settlement_collection || null,
      },
    });

    setGeneralAccs({
      loanAccount: product.loan_account || "",
      disbursementAccount: product.disbursement_account || "",
      repaymentAccount: product.payment_account || "",
      writeOffAccount: product.write_off_account || "",
      writeOffRecoveryAccount: product.write_off_recovery_account || "",
      subsidyAccount: product.subsidy_adjustment_account || "",
      securityDepositAccount: product.security_deposit_account || "",
      suspenseCollectionAccount: product.suspense_collection_account || "",
      customerRefundAccount: product.customer_refund_account || "",
    });

    setInterestAccs({
      income: product.interest_income_account || "",
      receivable: product.interest_receivable_account || "",
      accrued: product.interest_accrued_account || "",
      suspended: product.suspense_interest_income || "",
      waiver: product.interest_waiver_account || "",
    });

    setPenaltyAccs({
      income: product.penalty_income_account || "",
      receivable: product.penalty_receivable_account || "",
      accrued: product.penalty_accrued_account || "",
      suspended: product.penalty_suspense_account || "",
      waiver: product.penalty_waiver_account || "",
    });

    setBrokenPeriodRecoveryAccount(product.broken_period_interest_recovery_account || "");

    setSameAsInterest(product.same_as_regular_interest_accounts === 1);

    if (Array.isArray(product.loan_charges)) {
      setCharges(
        product.loan_charges.map((c: any) => ({
          id: Date.now() + Math.random(),
          type: c.charge_type || "",
          basedOn: c.charge_based_on === "Fixed Amount" ? "Flat Amount" : "Percentage",
          amount: c.amount ? String(c.amount) : "",
          percentage: c.percentage ? String(c.percentage) : "",
          // Note: ensure these keys match exactly what the backend sends inside the loan_charges array
          incomeAccount: c.income_account || "",
          receivableAccount: c.receivable_account || "",
          waiverAccount: c.waiver_account || "",
          writeOffAccount: c.write_off_account || "",
          suspenseAccount: c.suspense_account || "",
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProductData]);

  const handleInterestChange = (field: keyof InterestPenaltyAccountsState, value: string | null) => {
    const val = value || "";
    setInterestAccs((prev) => ({ ...prev, [field]: val }));
    if (sameAsInterest) setPenaltyAccs((prev) => ({ ...prev, [field]: val }));
  };

  const handlePenaltyChange = (field: keyof InterestPenaltyAccountsState, value: string | null) => {
    setPenaltyAccs((prev) => ({ ...prev, [field]: value || "" }));
    if (sameAsInterest) setSameAsInterest(false);
  };

  const handleSameAsInterestToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.currentTarget.checked;
    setSameAsInterest(isChecked);
    if (isChecked) setPenaltyAccs({ ...interestAccs });
  };

  const emptyCharge = (): ChargeRow => ({
    id: Date.now() + Math.random(), type: "", basedOn: "Percentage", amount: "", percentage: "",
    incomeAccount: "", receivableAccount: "", waiverAccount: "", writeOffAccount: "", suspenseAccount: "",
  });

  const handleAddCharge = () => setCharges((prev) => [...prev, emptyCharge()]);

  const handleUpdateCharge = (index: number, field: keyof ChargeRow, value: string) => {
    setCharges((prev) =>
      prev.map((charge, i) => {
        if (i !== index) return charge;
        const updated = { ...charge, [field]: value };
        if (field === "basedOn") {
          if (value === "Percentage") updated.amount = "";
          if (value === "Flat Amount") updated.percentage = "";
        }
        return updated;
      })
    );
  };

  const handleRemoveChargeAt = (index: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== index));
    setAccountsModalIndex(null);
  };

const buildPayload = (values: typeof form.values) => ({
  product_code: values.productCode,
  product_name: values.productName,
  loan_category: values.loanCategory || undefined,
  repayment_schedule_type: values.repaymentScheduleType || undefined,
  maximum_loan_amount: values.maxLoanAmount ? Number(values.maxLoanAmount) : undefined,
  days_past_due_threshold_for_npa: values.npaThreshold ? Number(values.npaThreshold) : undefined,
  rate_of_interest: values.interestRate ? Number(values.interestRate) : undefined,
  interest_frequency: values.interestFrequency || undefined,
  penalty_interest_rate: values.penaltyRate ? Number(values.penaltyRate) : undefined,
  penalty_frequency: values.penaltyFrequency || undefined,
  grace_period_in_days: values.gracePeriodDays ? Number(values.gracePeriodDays) : undefined,

  collection_offset_sequence_for_standard_asset: values.collectionSeq.standard || undefined,
  collection_offset_sequence_for_sub_standard_asset: values.collectionSeq.subStandard || undefined,
  collection_offset_sequence_for_written_off_asset: values.collectionSeq.writtenOff || undefined,
  collection_offset_sequence_for_settlement_collection: values.collectionSeq.settlement || undefined,

  // --- Flattened General Accounts ---
  loan_account: generalAccs.loanAccount || undefined,
  disbursement_account: generalAccs.disbursementAccount || undefined,
  payment_account: generalAccs.repaymentAccount || undefined,
  subsidy_adjustment_account: generalAccs.subsidyAccount || undefined,
  security_deposit_account: generalAccs.securityDepositAccount || undefined,
  suspense_collection_account: generalAccs.suspenseCollectionAccount || undefined,
  customer_refund_account: generalAccs.customerRefundAccount || undefined,

  // --- Flattened Write Off Accounts ---
  write_off_account: generalAccs.writeOffAccount || undefined,
  write_off_recovery_account: generalAccs.writeOffRecoveryAccount || undefined,

  // --- Flattened Interest Accounts ---
  interest_income_account: interestAccs.income || undefined,
  interest_receivable_account: interestAccs.receivable || undefined,
  interest_accrued_account: interestAccs.accrued || undefined,
  suspense_interest_income: interestAccs.suspended || undefined,
  interest_waiver_account: interestAccs.waiver || undefined,
  broken_period_interest_recovery_account: brokenPeriodRecoveryAccount || undefined,

  // --- Flattened Penalty Accounts ---
  penalty_income_account: penaltyAccs.income || undefined,
  penalty_receivable_account: penaltyAccs.receivable || undefined,
  penalty_accrued_account: penaltyAccs.accrued || undefined,
  penalty_suspense_account: penaltyAccs.suspended || undefined,
  penalty_waiver_account: penaltyAccs.waiver || undefined,

  // Charges (Keep this as an array as requested)
  loan_charges: charges.map((c) => ({
    charge_type: c.type,
    charge_based_on: c.basedOn === "Flat Amount" ? "Fixed Amount" : "Percentage",
    percentage: c.percentage ? Number(c.percentage) : 0,
    amount: c.amount ? Number(c.amount) : 0,
  })),
});
  // ---------- CREATE / UPDATE MUTATIONS ----------
  const createMutation = useMutation({
    mutationFn: createLoanProduct,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      await onSaved?.();
      handleModalClose();
    },
    onError: (err: any) => {
      setSubmitError(parseFrappeError(err));
    },
  });

const updateMutation = useMutation({
    mutationFn: updateLoanProduct,  
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      queryClient.invalidateQueries({ queryKey: ["loanProduct", variables.id] });
      await onSaved?.();
      handleModalClose();
    },
    onError: (err: any) => {
      setSubmitError(parseFrappeError(err));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ---------- SUBMIT (mantine form validate + jump to invalid tab, like LoanAccountModal) ----------
  const handleValidSubmit = (values: typeof form.values) => {
    if (isViewMode) return;
    if (currentStep !== 3) {
    handleNext();
    return;
  }
    setSubmitError(null);

    const missingAccounts = getMissingAccountingFields();
    if (missingAccounts.length > 0) {
      setSubmitError(`Missing required accounts: ${missingAccounts.join(", ")}`);
      setActiveTab("1");
      return;
    }

    updateMutation.reset();
    createMutation.reset();
    const payload = buildPayload(values);
    if (loanProductId) {
      updateMutation.mutate({ id: loanProductId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleInvalidSubmit = (errors: typeof form.errors) => {
    const keys = Object.keys(errors);
    if (keys.some((k) => k.startsWith("collectionSeq"))) {
      setActiveTab("2");
    } else {
      setActiveTab("0");
    }
  };

  // Which fields belong to which step — used to validate before "Next"
  const stepFieldsMap: Record<string, string[]> = {
    "0": [
      "productCode", "productName", "loanCategory", "repaymentScheduleType",
      "maxLoanAmount", "npaThreshold", "interestRate", "interestFrequency",
      "penaltyRate", "penaltyFrequency",
    ],
    "2": [
      "collectionSeq.standard", "collectionSeq.subStandard",
      "collectionSeq.writtenOff", "collectionSeq.settlement",
    ],
  };

  const getMissingAccountingFields = (): string[] => {
    const required: { label: string; value: string }[] = [
      { label: "Loan Account", value: generalAccs.loanAccount },
      { label: "Disbursement Account", value: generalAccs.disbursementAccount },
      { label: "Repayment Account", value: generalAccs.repaymentAccount },
      { label: "Security Deposit Account", value: generalAccs.securityDepositAccount },
    //   { label: "Customer Refund Account", value: generalAccs.customerRefundAccount },
    //   { label: "Interest Income Account", value: interestAccs.income },
    //   { label: "Interest Accrued Account", value: interestAccs.accrued },
    //   { label: "Interest Waiver Account", value: interestAccs.waiver },
    //   { label: "Interest Receivable Account", value: interestAccs.receivable },
    //   { label: "Penalty Income Account", value: penaltyAccs.income },
    //   { label: "Penalty Accrued Account", value: penaltyAccs.accrued },
    //   { label: "Penalty Waiver Account", value: penaltyAccs.waiver },
    //   { label: "Penalty Receivable Account", value: penaltyAccs.receivable },
      { label: "Write Off Account", value: generalAccs.writeOffAccount },
      { label: "Write Off Recovery Account", value: generalAccs.writeOffRecoveryAccount },
    ];
    return required.filter((f) => !f.value).map((f) => f.label);
  };

  const validateCurrentStep = (): boolean => {
    if (activeTab === "1") {
      const missing = getMissingAccountingFields();
      if (missing.length > 0) {
        setSubmitError(`Missing required accounts: ${missing.join(", ")}`);
        return false;
      }
      
      setSubmitError(null);
      return true;
    }
    const fields = stepFieldsMap[activeTab || "0"];
    if (!fields) return true; // step 3 (Charges) has no required fields
    let hasError = false;
    fields.forEach((f) => {
      const result = form.validateField(f);
      if (result.hasError) hasError = true;
    });
    return !hasError;
  };
  const handleNext = () => {
    const current = parseInt(activeTab || "0");
    if (isViewMode) {
      if (current < 3) setActiveTab((current + 1).toString());
      return;
    }
    if (!validateCurrentStep()) return;
    if (current < 3) setActiveTab((current + 1).toString());
  };
  const handleBack = () => {
    const current = parseInt(activeTab || "0");
    if (current > 0) setActiveTab((current - 1).toString());
  };

  const handleReset = () => {
    form.reset();
    setGeneralAccs({ loanAccount: "", disbursementAccount: "", repaymentAccount: "", writeOffAccount: "", writeOffRecoveryAccount: "", subsidyAccount: "", securityDepositAccount: "", suspenseCollectionAccount: "", customerRefundAccount: "" });
    setSameAsInterest(false);
    setInterestAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setPenaltyAccs({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
    setBrokenPeriodRecoveryAccount("");
    setCharges([]);
    setAccountsModalIndex(null);
    setActiveTab("0");
    setSubmitError(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleModalClose = () => {
    if (loanProductId) {
      queryClient.removeQueries({ queryKey: ["loanProduct", loanProductId] });
    }
    handleReset();
    onClose();
  };

  const currentStep = parseInt(activeTab || "0");

  const headerIcon = currentStep === 0 ? IconBriefcase : STEPS[currentStep].icon;
  const headerTitle = loanProductId
    ? isViewMode ? "View Loan Product" : "Update Loan Product"
    : "Create Loan Product";

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="80%" withCloseButton={false} padding={0} radius="lg"
      overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      styles={{
        content: { height: "95vh", maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      {/* <form onSubmit={form.onSubmit(handleValidSubmit, handleInvalidSubmit)} style={{ height: "100%" }}> */}
      <form
  onSubmit={form.onSubmit(handleValidSubmit, handleInvalidSubmit)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && currentStep < 3) {
      e.preventDefault();
    }
  }}
  style={{ height: "100%" }}
>
        <Box className="flex flex-col h-full bg-white" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box className="flex justify-between items-start px-6 pt-4 pb-3 shrink-0 bg-white border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${theme.brand[5]}, ${theme.brand[7]})` }}>
                {(() => { const HeaderIcon = headerIcon; return <HeaderIcon size={17} className="text-white" />; })()}
              </div>
              <div>
                <Text size="lg" fw={800} className="text-slate-900 leading-tight">{headerTitle}</Text>
              </div>
            </div>
            <ActionIcon type="button" variant="light" color="gray" radius="xl" size="lg" onClick={handleModalClose} aria-label="Close" className="hover:bg-slate-100">
              <IconX size={18} />
            </ActionIcon>
          </Box>

          <Box className="px-8 pt-2.5 pb-2.5 border-b border-slate-100 shrink-0 bg-white">
            <div className="flex items-center">
              {STEPS.map((step, idx) => {
                const isActive = currentStep === idx;
                const isComplete = currentStep > idx;
                const StepIcon = step.icon;
                return (
                  <Fragment key={step.label}>
                    <button type="button" onClick={() => setActiveTab(idx.toString())} className="flex items-center gap-2 text-left shrink-0 group">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold shrink-0 transition-all" style={isActive ? { backgroundColor: theme.brand[6], color: "#fff", boxShadow: `0 0 0 3px ${theme.brand[1]}` } : isComplete ? { backgroundColor: theme.brand[5], color: "#fff" } : { backgroundColor: "#fff", color: "#94a3b8", border: "2px solid #e2e8f0" }}>
                        {isComplete ? <IconCheck size={13} /> : <StepIcon size={13} />}
                      </div>
                      <div className="hidden sm:block whitespace-nowrap">
                        <Text size="xs" fw={700} style={{ color: isActive ? theme.brand[6] : isComplete ? "#334155" : "#94a3b8" }}>{step.label}</Text>
                        <Text size="10px" className="text-slate-400 leading-none">{step.desc}</Text>
                      </div>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 h-[2px] mx-3 rounded-full transition-colors" style={{ backgroundColor: isComplete ? theme.brand[5] : "#e2e8f0" }} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Box>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 px-6 pb-4 bg-[#F7F8FB]" style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}>
            <fieldset disabled={isViewMode} className="border-0 p-0 m-0">
              {activeTab === "0" && <ProductDetailsTab form={form} />}
              {activeTab === "1" && (
             <AccountingTab
  generalAccs={generalAccs}
  setGeneralAccs={setGeneralAccs}
  interestAccs={interestAccs}
  penaltyAccs={penaltyAccs}
  handleInterestChange={handleInterestChange}
  handlePenaltyChange={handlePenaltyChange}
  sameAsInterest={sameAsInterest}
  handleSameAsInterestToggle={handleSameAsInterestToggle}
  brokenPeriodRecoveryAccount={brokenPeriodRecoveryAccount}
  setBrokenPeriodRecoveryAccount={setBrokenPeriodRecoveryAccount}
/>
              )}
            {activeTab === "2" && (
                <CollectionTab form={form} /> 
              )}
              {activeTab === "3" && (
                <ChargesTab
                  charges={charges}
                  isViewMode={isViewMode}
                  handleUpdateCharge={handleUpdateCharge}
                  handleAddCharge={handleAddCharge}
                  handleRemoveChargeAt={handleRemoveChargeAt}
                  setAccountsModalIndex={setAccountsModalIndex}
                />
              )}
            </fieldset>
          </div>

          <ChargeAccountsModal
            accountsModalIndex={accountsModalIndex}
            setAccountsModalIndex={setAccountsModalIndex}
            charges={charges}
            handleUpdateCharge={handleUpdateCharge}
            isViewMode={isViewMode}
            incomeAccounts={incomeAccounts}
            principalAccounts={principalAccounts}
            writeOffAccounts={writeOffAccounts}
          />

         <div className="bg-white border-t border-slate-100 p-2.5 px-6 flex justify-between items-center shrink-0 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-4" />

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {submitError && (
                <Text size="xs" c="red" className="sm:mr-2">
                  {submitError}
                </Text>
              )}

              <Button type="button" size="sm" variant="default" radius="md" onClick={handleModalClose} className="font-semibold px-5 border-slate-200">
                {isViewMode ? "Close" : "Cancel"}
              </Button>

              {!isViewMode && (
                <button type="button" onClick={handleReset} className="text-xs font-semibold transition-colors" style={{ color: theme.danger[6] }}>
                  Reset
                </button>
              )}

              {currentStep > 0 && (
                <Button type="button" size="sm" variant="default" radius="md" onClick={handleBack} leftSection={<IconArrowLeft size={14} />} className="font-semibold px-5 text-slate-700 border-slate-200">
                  Back
                </Button>
              )}

              {!isViewMode && (
                <Button
                  type="button"
                  size="sm"
                  radius="md"
                  color="brand"
                  className="font-semibold px-6"
                  loading={currentStep === 3 ? isSaving : false}
                  onClick={() => {
                    if (currentStep < 3) {
                      handleNext();
                    } else {
                      form.onSubmit(handleValidSubmit, handleInvalidSubmit)();
                    }
                  }}
                  rightSection={currentStep < 3 ? <IconArrowRight size={14} /> : <IconCheck size={14} />}
                >
                  {currentStep < 3 ? "Save & Next" : loanProductId ? "Update Product" : "Submit"}
                </Button>
              )}

              {isViewMode && currentStep < 3 && (
                <Button type="button" size="sm" radius="md" color="brand" className="font-semibold px-6" onClick={handleNext} rightSection={<IconArrowRight size={14} />}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </Box>
      </form>
    </Modal>
  );
}