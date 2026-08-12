import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import {
  Box,
  Text,
  ActionIcon,
  Modal,
  ThemeIcon,
  Group,
  ScrollArea,
  Fieldset,
  UnstyledButton,
} from "@mantine/core";
import {
  IconX,
  IconBriefcase,
  IconCheck,
  IconChevronRight,
} from "@tabler/icons-react";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import {
  createLoanProduct,
  updateLoanProduct,
  getLoanProductById,
  getAllIncomeAccounts,
  getAllIPAccounts,
  getAllPrincipalAccounts,
} from "../../../api/productApi";
import { STEPS, toAccountOptions } from "./Constants";
import { ProductDetailsTab } from "./ProductDetailsTab";
import { AccountingTab, type AccountFieldsState, type InterestPenaltyAccountsState } from "./AccountingTab";
import { ChargesTab, type ChargeRow } from "./ChargesTab";
import { ChargeAccountsModal } from "./ChargesaccountModal";
import { ModalFooter } from "../../shared/ModalFooter";
import { openCommonModal } from "../AlertModal";
import { CollectionTab } from "./CollectionsTab";

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
      penaltyRate: (v) => (!v ? "Penalty Rate is required" : null),
      collectionSeq: {
        standard: (v) => (!v ? "Required" : null),
        subStandard: (v) => (!v ? "Required" : null),
        writtenOff: (v) => (!v ? "Required" : null),
        settlement: (v) => (!v ? "Required" : null),
      },
    },
  });

  const [generalAccs, setGeneralAccs] = useState<AccountFieldsState>({
    loanAccount: "", disbursementAccount: "", repaymentAccount: "", writeOffAccount: "",
    writeOffRecoveryAccount: "", subsidyAccount: "", securityDepositAccount: "",
    suspenseCollectionAccount: "", customerRefundAccount: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sameAsInterest, setSameAsInterest] = useState(false);
  const [interestAccs, setInterestAccs] = useState<InterestPenaltyAccountsState>({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });
  const [penaltyAccs, setPenaltyAccs] = useState<InterestPenaltyAccountsState>({ income: "", receivable: "", accrued: "", suspended: "", waiver: "" });

  const [brokenPeriodRecoveryAccount, setBrokenPeriodRecoveryAccount] = useState("");

  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [accountsModalIndex, setAccountsModalIndex] = useState<number | null>(null);

  // ---------- ALERT HELPERS (same pattern as AddLoanCategoryModal) ----------
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showErrorMessage = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body,
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const { data: incomeAccountsData } = useQuery({
    queryKey: ["accounts", "Income"],
    queryFn: () => getAllIncomeAccounts(),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  const { data: principalAccountsData } = useQuery({
    queryKey: ["accounts", "Asset,Liability"],
    queryFn: () => getAllPrincipalAccounts(),
    enabled: opened,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allAccountsData } = useQuery({
    queryKey: ["accounts", "all"],
    queryFn: () => getAllIPAccounts(),
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
    const product = (existingProductData as any)?.message?.data || (existingProductData as any)?.data;
    if (!product) return;

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

    loan_account: generalAccs.loanAccount || undefined,
    disbursement_account: generalAccs.disbursementAccount || undefined,
    payment_account: generalAccs.repaymentAccount || undefined,
    subsidy_adjustment_account: generalAccs.subsidyAccount || undefined,
    security_deposit_account: generalAccs.securityDepositAccount || undefined,
    suspense_collection_account: generalAccs.suspenseCollectionAccount || undefined,
    customer_refund_account: generalAccs.customerRefundAccount || undefined,

    write_off_account: generalAccs.writeOffAccount || undefined,
    write_off_recovery_account: generalAccs.writeOffRecoveryAccount || undefined,

    interest_income_account: interestAccs.income || undefined,
    interest_receivable_account: interestAccs.receivable || undefined,
    interest_accrued_account: interestAccs.accrued || undefined,
    suspense_interest_income: interestAccs.suspended || undefined,
    interest_waiver_account: interestAccs.waiver || undefined,
    broken_period_interest_recovery_account: brokenPeriodRecoveryAccount || undefined,

    penalty_income_account: penaltyAccs.income || undefined,
    penalty_receivable_account: penaltyAccs.receivable || undefined,
    penalty_accrued_account: penaltyAccs.accrued || undefined,
    penalty_suspense_account: penaltyAccs.suspended || undefined,
    penalty_waiver_account: penaltyAccs.waiver || undefined,

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
      showSuccess("Product Created", "Loan product created successfully.");
      await onSaved?.();
      handleModalClose();
    },
    onError: (err: any) => {
      setSubmitError(parseFrappeError(err));
      showError("Create Failed", err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLoanProduct,
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      queryClient.invalidateQueries({ queryKey: ["loanProduct", variables.id] });
      showSuccess("Product Updated", "Loan product updated successfully.");
      await onSaved?.();
      handleModalClose();
    },
    onError: (err: any) => {
      setSubmitError(parseFrappeError(err));
      showError("Update Failed", err);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ---------- SUBMIT ----------
  const handleValidSubmit = (values: typeof form.values) => {
    if (isViewMode) return;
    if (currentStep !== 3) {
      handleNext();
      return;
    }
    setSubmitError(null);

    const missingAccounts = getMissingAccountingFields();
    if (missingAccounts.length > 0) {
      const message = `Missing required accounts: ${missingAccounts.join(", ")}`;
      setSubmitError(message);
      showErrorMessage("Validation Error", message);
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
      { label: "Write Off Account", value: generalAccs.writeOffAccount },
      { label: "Write Off Recovery Account", value: generalAccs.writeOffRecoveryAccount },
    ];
    return required.filter((f) => !f.value).map((f) => f.label);
  };

  const validateCurrentStep = (): boolean => {
    if (activeTab === "1") {
      const missing = getMissingAccountingFields();
      if (missing.length > 0) {
        const message = `Missing required accounts: ${missing.join(", ")}`;
        setSubmitError(message);
        return false;
      }
      setSubmitError(null);
      return true;
    }
    const fields = stepFieldsMap[activeTab || "0"];
    if (!fields) return true;
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

  const doReset = () => {
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

  const handleReset = doReset;

  // Confirm before wiping out everything the user has entered — same
  // heading/subtitle/buttons pattern as LoanCategory's confirm modals.
  const handleResetClick = () => {
    openCommonModal({
      heading: "Reset this form?",
      subtitle: "This action cannot be undone.",
      body: "This will clear everything you've entered on this form.",
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        { label: "Reset", color: "red", onClick: () => doReset() },
      ],
    });
  };

  const handleModalClose = () => {
    if (loanProductId) {
      queryClient.removeQueries({ queryKey: ["loanProduct", loanProductId] });
    }
    handleReset();
    onClose();
  };

  const currentStep = parseInt(activeTab || "0");
  const headerIcon = STEPS[currentStep]?.icon || IconBriefcase;
  const HeaderIcon = headerIcon;
  const headerTitle = loanProductId
    ? isViewMode
      ? "View Loan Product"
      : "Update Loan Product"
    : "Create Loan Product";

  const isLastStep = currentStep === 3;
  const hideSubmit = isViewMode && isLastStep;
  const submitLabel = isLastStep
    ? loanProductId
      ? "Update"
      : "Save"
    : isViewMode
      ? "Next"
      : "Save & Continue";
  const handleFooterSubmit = () => {
    if (currentStep < 3) {
      handleNext();
    } else {
      form.onSubmit(handleValidSubmit, handleInvalidSubmit)();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size={1040}
      padding={0}
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "88vh",
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      <form
        onSubmit={form.onSubmit(handleValidSubmit, handleInvalidSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && currentStep < 3) {
            e.preventDefault();
          }
        }}
        style={{ height: "100%" }}
      >
        <Box
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
          bg="white"
        >
          {/* Header — same solid brand.6 bar as CustomerModal / AddLoanCategoryModal */}
          <Group
            justify="space-between"
            align="center"
            px="xl"
            py="sm"
            bg="brand.6"
            style={{
              borderBottom: "1px solid var(--mantine-color-brand-7)",
              flexShrink: 0,
            }}
          >
            <Group gap="sm">
              <ThemeIcon radius="md" size={34} variant="white" color="brand">
                <HeaderIcon size={16} />
              </ThemeIcon>
              <Box>
                <Text
                  size="md"
                  fw={700}
                  c="white"
                  style={{ color: "var(--mantine-color-white)", letterSpacing: "-0.01em" }}
                >
                  {headerTitle}
                </Text>
                <Group gap={6}>
                  <Text size="xs" fw={600} c="brand.1" style={{ color: "var(--mantine-color-brand-1)" }}>
                    Step {currentStep + 1} of {STEPS.length}
                  </Text>
                  <Text size="xs" c="brand.3" style={{ color: "var(--mantine-color-brand-3)" }}>
                    ·
                  </Text>
                  <Text size="xs" fw={500} c="brand.1" style={{ color: "var(--mantine-color-brand-1)" }}>
                    {STEPS[currentStep]?.label}
                  </Text>
                </Group>
              </Box>
            </Group>
            <ActionIcon
              type="button"
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={handleModalClose}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>

          {/* Tab bar */}
          <Box
            px="md"
            py={8}
            style={{
              borderBottom: "1px solid var(--mantine-color-slate-2)",
              flexShrink: 0,
            }}
            bg="slate.0"
          >
            <ScrollArea type="auto" scrollbarSize={4} offsetScrollbars={false}>
              <Group gap={18} wrap="nowrap">
                {STEPS.map((step, idx) => {
                  const isActive = currentStep === idx;
                  const isComplete = currentStep > idx;
                  const StepIcon = step.icon;
                  return (
                    <Group key={step.label} gap={18} wrap="nowrap">
                      <UnstyledButton
                        type="button"
                        onClick={() => setActiveTab(idx.toString())}
                        px={14}
                        py={7}
                        style={{
                          borderRadius: "var(--mantine-radius-sm)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          background: isActive
                            ? "var(--mantine-color-white)"
                            : "transparent",
                          boxShadow: isActive ? "var(--mantine-shadow-sm)" : "none",
                          border: isActive
                            ? "1px solid var(--mantine-color-slate-2)"
                            : "1px solid transparent",
                          transition:
                            "background-color 120ms ease, box-shadow 120ms ease",
                        }}
                      >
                        <Group gap={6} wrap="nowrap">
                          <ThemeIcon
                            radius="xl"
                            size={20}
                            variant={isActive || isComplete ? "filled" : "outline"}
                            color={isActive || isComplete ? "brand" : "slate"}
                            style={{ flexShrink: 0 }}
                          >
                            {isComplete ? (
                              <IconCheck size={10} />
                            ) : (
                              <StepIcon size={10} />
                            )}
                          </ThemeIcon>
                          <Text
                            size="xs"
                            fw={isActive ? 700 : 500}
                            c={
                              isActive
                                ? "brand.7"
                                : isComplete
                                  ? "slate.7"
                                  : "slate.5"
                            }
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {step.label}
                          </Text>
                        </Group>
                      </UnstyledButton>
                      {idx < STEPS.length - 1 && (
                        <IconChevronRight
                          size={11}
                          color="var(--mantine-color-slate-3)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </Group>
                  );
                })}
              </Group>
            </ScrollArea>
          </Box>

          {/* Main Content */}
          <ScrollArea type="auto" scrollbarSize={8} style={{ flex: 1, minHeight: 0 }} bg="slate.0">
            <Box mx="auto" pt="md" pl="lg" pr="lg" pb="md">
              <Fieldset disabled={isViewMode} variant="unstyled" p={0} m={0}>
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
                {activeTab === "2" && <CollectionTab form={form} />}
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
              </Fieldset>
            </Box>
          </ScrollArea>

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

          {/* Footer — shared ModalFooter component */}
          <ModalFooter
            variant="theme"
            isViewMode={isViewMode}
            onClose={handleModalClose}
            submitLabel={submitLabel}
            submitLoading={isLastStep ? isSaving : false}
            hideSubmit={hideSubmit}
            onSubmit={handleFooterSubmit}
            errorMessage={submitError ?? undefined}
          />
        </Box>
      </form>
    </Modal>
  );
}