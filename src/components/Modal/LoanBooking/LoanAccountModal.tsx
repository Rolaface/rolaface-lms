import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Text, Button, Modal, Group, ThemeIcon, Badge, useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconX, IconMinus, IconBuildingBank, IconCheck, IconCalculator } from "@tabler/icons-react";

import { createLoan, getLoanById, updateLoan, getReapymentScheduleById } from "../../../api/loanApi";
import { calcEmi, buildAmortization, getTodayDate } from "../../../utils/loanCalculations";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { ANNUAL_RATE, DEFAULT_DOCUMENTS, TAB_ITEMS } from "./Constants";

import { BasicDetailsTab } from "./BasicDetailsTab";
import { RepaymentScheduleTab } from "./RepaymentScheduleTab";
import { ChargesTab, type ChargeRow } from "./ChargesTab";
import { CollateralTab, type CollateralItem } from "./CollateralTab";
import { CoApplicantTab, type CoApplicant } from "./CoapplicationTab";
import { DocumentsTab } from "./DocumentTab";
import { LoanSummarySidebar } from "./LoanSummarySidebarTab";
import { LoanSimulatorModal } from "../LoanSimulatorModal";
import { ModalFooter } from "../../shared/ModalFooter";

interface LoanAccountModalProps {
  opened: boolean;
  loanId?: string | null;
  onClose: () => void;
  isViewMode?: boolean;
}

export function LoanAccountModal({ opened, onClose, loanId, isViewMode }: LoanAccountModalProps) {
  const queryClient = useQueryClient();
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>("basic");

  // UI Only States (Modals, Sub-tabs, etc)
  const [loanAcNumber] = useState("");
  const [collateralModalOpened, setCollateralModalOpened] = useState(false);
  const [collateralSearch, setCollateralSearch] = useState("");
  const [simulatorModalOpened, setSimulatorModalOpened] = useState(false);
  const [coApplicantSearch, setCoApplicantSearch] = useState("");


  const [charges, setCharges] = useState<ChargeRow[]>([
    { id: Date.now().toString(), feeType: "", percentage: "", amount: "", appliedOn: getTodayDate() },
  ]);
  const [collaterals, setCollaterals] = useState<CollateralItem[]>([]);
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([
    { id: Date.now().toString(), name: "", email: "", mobile: "" },
  ]);
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);

  // Initialize Mantine Form
  const form = useForm({
    initialValues: {
      customerNumber: "",
      rateOfInterest: "" as number | "",
      productCode: "",
      loanAppNumber: "",
      refNumber: "",
      isImport: false,
      migrationDate: "",
      trnDate: getTodayDate(),
      valueDate: "",
      currency: "USD",
      loanAmount: "" as number | "",
      fixedRepaymentsIn: "TENOR",
      tenureValue: "" as number | "",
      frequency: "Monthly",
      repaymentAmount: "" as number | "",
      repaymentStartDate: "",
      moratoriumType: "None",
      moratoriumPeriod: "" as number | "",
    },
    validate: {
      customerNumber: (v) => (!v ? "Customer is required" : null),
      productCode: (v) => (!v ? "Product is required" : null),
      loanAmount: (v) => (!v ? "Loan Amount is required" : null),
      tenureValue: (v, values) =>
        values.fixedRepaymentsIn === "TENOR" && !v ? "Tenure is required" : null,
      repaymentAmount: (v, values) =>
        values.fixedRepaymentsIn === "EMI" && !v ? "Repayment Amount is required" : null,
    },
  });

  // --- Derived Calculations ---
  const tenureMonths = useMemo(() => {
    return form.values.tenureValue === "" ? 0 : Number(form.values.tenureValue);
  }, [form.values.tenureValue]);

  const effectiveRate = Number(form.values.rateOfInterest);

  const estimatedEmi = useMemo(
    () => calcEmi(Number(form.values.loanAmount) || 0, effectiveRate, tenureMonths),
    [form.values.loanAmount, tenureMonths, effectiveRate]
  );

  const amortization = useMemo(
    () => buildAmortization(Number(form.values.loanAmount) || 0, effectiveRate, tenureMonths),
    [form.values.loanAmount, tenureMonths, effectiveRate]
  );

  const totalRepayment = useMemo(
    () => Math.round(estimatedEmi * tenureMonths * 100) / 100,
    [estimatedEmi, tenureMonths]
  );

  const totalInterest = useMemo(
    () => Math.round((totalRepayment - (Number(form.values.loanAmount) || 0)) * 100) / 100,
    [totalRepayment, form.values.loanAmount]
  );

  const summaryPrincipal = Number(form.values.loanAmount) || 0;

  // --- Array Handlers ---
  const handleAddCharge = () =>
    setCharges((prev) => [
      ...prev,
      { id: Date.now().toString(), feeType: "", percentage: "", amount: "", appliedOn: getTodayDate() },
    ]);
  const handleUpdateCharge = (id: string, field: keyof ChargeRow, value: string | number) =>
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const handleRemoveCharge = (id: string) => setCharges((prev) => prev.filter((c) => c.id !== id));

  const handleRemoveCollateral = (id: number) => setCollaterals((prev) => prev.filter((c) => c.id !== id));

  const handleAddCoApplicant = () =>
    setCoApplicants((prev) => [...prev, { id: Date.now().toString(), name: "", email: "", mobile: "" }]);
  const handleUpdateCoApplicant = (id: string, field: keyof Omit<CoApplicant, "id">, value: string) =>
    setCoApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  const handleRemoveCoApplicant = (id: string) => setCoApplicants((prev) => prev.filter((a) => a.id !== id));

  // --- API Mutation ---
  const createLoanMutation = useMutation({
    mutationFn: createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      handleModalClose();
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    // Map form data directly to API payload schema
    const payload: any = {
      applicant_type: "Customer", // Adjust if you add UI for this
      applicant: values.customerNumber,
      loan_product: values.productCode,
      loan_amount: Number(values.loanAmount),
      rate_of_interest: effectiveRate,
      penalty_charges_rate: 0,
      is_term_loan: 1,
      posting_date: values.valueDate,
      repayment_method:
        values.fixedRepaymentsIn === "TENOR"
          ? "Repay Over Number of Periods"
          : "Repay Fixed Amount per Period",
    };

    if (values.fixedRepaymentsIn === "TENOR") {
      payload.repayment_periods = tenureMonths;
    } else {
      payload.monthly_repayment_amount = Number(values.repaymentAmount);
    }

    if (values.repaymentStartDate) {
      payload.repayment_start_date = values.repaymentStartDate;
    }

    if (
      values.moratoriumType &&
      values.moratoriumType !== "None" &&
      values.moratoriumPeriod !== "" &&
      Number(values.moratoriumPeriod) > 0
    ) {
      payload.moratorium_type = values.moratoriumType;
      payload.moratorium_tenure = Number(values.moratoriumPeriod);
      if (payload.moratorium_type === "EMI") {
        payload.treatment_of_interest = "Capitalize";
      }
    }

    if (loanId) {
      updateLoanMutation.mutate({ id: loanId, payload });
    } else {
      createLoanMutation.mutate(payload);
    }
  };

  const { data: existingLoanData, isLoading: isFetchingLoan } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async () => await getLoanById(loanId as string),
    enabled: !!loanId && opened === true,
    refetchOnMount: "always",
  });

  const { data: scheduleData, isLoading: isFetchingSchedule } = useQuery({
    queryKey: ["loan-repayment-schedule", loanId],
    queryFn: async () => await getReapymentScheduleById(loanId as string),
    enabled: !!loanId && opened === true,
    refetchOnMount: "always",
  });

  const fetchedRepaymentSchedule = scheduleData?.message?.data?.repayment_schedule ?? [];

  const fetchedMaturityDate = scheduleData?.message?.data?.maturity_date;
  const finalMaturityDate = fetchedMaturityDate;

  useEffect(() => {
    const loan = existingLoanData?.message?.data;

    if (loan) {
      form.setValues({
        customerNumber: loan.applicant || "",
        productCode: loan.loan_product || "",
        loanAmount: loan.loan_amount || "",
        rateOfInterest: loan.rate_of_interest,
        trnDate: loan.posting_date || getTodayDate(),
        fixedRepaymentsIn: loan.repayment_method === "Repay Over Number of Periods" ? "TENOR" : "EMI",
        tenureValue: loan.repayment_periods || "",
        repaymentAmount: loan.monthly_repayment_amount || "",
        valueDate: loan.posting_date,
        repaymentStartDate: loan.repayment_start_date || "",
        moratoriumType: loan.moratorium_type || "Principal",
        moratoriumPeriod: loan.moratorium_tenure || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLoanData]);

  const updateLoanMutation = useMutation({
    mutationFn: updateLoan,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan", variables.id] });
      handleModalClose();
    },
  });

  const handleReset = () => {
    form.reset();
    setCharges([{ id: Date.now().toString(), feeType: "", percentage: "", amount: "", appliedOn: getTodayDate() }]);
    setCollaterals([]);
    setCoApplicants([{ id: Date.now().toString(), name: "", email: "", mobile: "" }]);
    setCoApplicantSearch("");
    setDocuments(DEFAULT_DOCUMENTS);
    setActiveTab("basic");
    createLoanMutation.reset();
  };

  const handleModalClose = () => {
    if (loanId) {
      queryClient.removeQueries({ queryKey: ["loan", loanId] });
      queryClient.removeQueries({ queryKey: ["loan-repayment-schedule", loanId] });
    }
    handleReset();
    onClose();
  };

  const activeTabIndex = TAB_ITEMS.findIndex((t) => t.value === activeTab);

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="95%"
      withCloseButton={false}
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "95vh",
          maxHeight: "95vh",
        },
        body: {
          height: "100%",
          padding: 0,
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Box className="flex flex-col h-full">
          {/* Header */}
          <Box
            className="px-6 py-4 flex justify-between items-center rounded-t-md shrink-0"
            style={{
              background: theme.other.brandGradient,
              borderBottom: "1px solid var(--mantine-color-brand-7)",
            }}
          >
            <Group gap="md" className="min-w-0" wrap="nowrap">
              <ThemeIcon
                size={48}
                radius="xl"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "var(--mantine-color-white)",
                }}
              >
                <IconBuildingBank size={24} />
              </ThemeIcon>
              <div className="min-w-0">
                <Text size="lg" fw={700} c="white" className="leading-tight truncate">
                  {loanId ? (isViewMode ? "View Loan Booking" : "Update Loan Booking") : "New Loan Booking"}
                </Text>
                <Text size="xs" c="brand.1" className="leading-tight truncate">
                  Lending Operations{loanId ? ` · Account ${loanId}` : ""}
                </Text>
              </div>
            </Group>
            <Group gap="xs" className="shrink-0" wrap="nowrap">
              {isViewMode && (
                <Badge variant="light" color="gray" radius="sm" size="sm">
                  View Only
                </Badge>
              )}
              <Button
                variant="subtle"
                size="xs"
                px={8}
                style={{ color: "var(--mantine-color-white)" }}
                className="hover:bg-white/10"
              >
                <IconMinus size={18} />
              </Button>
              <Button
                variant="subtle"
                size="xs"
                px={8}
                onClick={handleModalClose}
                style={{ color: "var(--mantine-color-white)" }}
                className="hover:bg-white/10"
              >
                <IconX size={18} />
              </Button>
            </Group>
          </Box>

          {/* Stepper */}
          <Box className="px-6 pt-4 pb-3 bg-white shrink-0">
            <div className="flex items-center overflow-x-auto w-full">
              {TAB_ITEMS.map((tab, idx) => {
                const isActive = idx === activeTabIndex;
                const isComplete = idx < activeTabIndex;
                const StepIcon = tab.icon;
                return (
                  <Fragment key={tab.value}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.value)}
                      className="flex items-center gap-2 shrink-0 rounded-xl px-3 py-2 transition-colors"
                      style={{
                        background: isActive ? "var(--mantine-color-brand-0)" : "transparent",
                      }}
                    >
                      <ThemeIcon
                        size={30}
                        radius="xl"
                        variant={isActive || isComplete ? "filled" : "light"}
                        color={isActive || isComplete ? "brand" : "slate"}
                      >
                        {isComplete ? <IconCheck size={14} /> : <StepIcon size={14} />}
                      </ThemeIcon>
                      <Text
                        size="sm"
                        fw={700}
                        c={isActive ? "brand.7" : isComplete ? "slate.7" : "slate.4"}
                        className="whitespace-nowrap"
                      >
                        {tab.label}
                      </Text>
                    </button>
                    {idx < TAB_ITEMS.length - 1 && (
                      <div
                        className="flex-1 min-w-[1.5rem] h-[2px] mx-2 rounded-full transition-colors"
                        style={{
                          background: isComplete
                            ? "var(--mantine-color-brand-4)"
                            : "var(--mantine-color-slate-2)",
                        }}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Box>

          {/* Body — one shared scroll region, so the summary panel on the
             right always matches the height of the active tab's content
             instead of clipping inside its own short scrollbar. */}
          <fieldset
            disabled={isViewMode}
            className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-white border-0 p-0 m-0 min-w-0 min-h-0"
          >
            <div className="flex-1 p-6 min-w-0">
              {activeTab === "basic" && (
                <BasicDetailsTab form={form} loanAcNumber={loanAcNumber} maturityDate={finalMaturityDate} />
              )}
              {activeTab === "schedule" && (
                <RepaymentScheduleTab
                  amortization={amortization}
                  repaymentSchedule={fetchedRepaymentSchedule}
                  isFetchingSchedule={isFetchingSchedule}
                  isEditMode={!!loanId}
                />
              )}
              {activeTab === "charges" && (
                <ChargesTab
                  charges={charges}
                  onAdd={handleAddCharge}
                  onUpdate={handleUpdateCharge}
                  onRemove={handleRemoveCharge}
                />
              )}
              {activeTab === "collateral" && (
                <CollateralTab
                  search={collateralSearch}
                  onSearchChange={setCollateralSearch}
                  collaterals={collaterals}
                  onRemove={handleRemoveCollateral}
                  onOpenAddModal={() => setCollateralModalOpened(true)}
                />
              )}
              {activeTab === "coapplicant" && (
                <CoApplicantTab
                  search={coApplicantSearch}
                  onSearchChange={setCoApplicantSearch}
                  coApplicants={coApplicants}
                  onAdd={handleAddCoApplicant}
                  onUpdate={handleUpdateCoApplicant}
                  onRemove={handleRemoveCoApplicant}
                />
              )}
              {activeTab === "documents" && <DocumentsTab documents={documents} />}
            </div>

            <LoanSummarySidebar
              productCode={form.values.productCode}
              rateOfInterest={effectiveRate}
              summaryPrincipal={summaryPrincipal}
              currency={form.values.currency}
              tenureMonths={tenureMonths}
              frequency={form.values.frequency}
              repaymentStartDate={form.values.repaymentStartDate}
              maturityDate={finalMaturityDate}
              moratoriumType={form.values.moratoriumType}
              estimatedEmi={estimatedEmi}
              totalInterest={totalInterest}
              totalRepayment={totalRepayment}
            />
          </fieldset>

          {/* Footer — shared ModalFooter, no Reset action exposed. */}
          <ModalFooter
            variant="theme"
            isViewMode={isViewMode}
            onClose={handleModalClose}
            onSaveDraft={!isViewMode ? () => { } : undefined}
            submitLabel={loanId ? "Update " : "Save"}
            submitLoading={createLoanMutation.isPending || updateLoanMutation.isPending || isFetchingLoan}
            errorMessage={createLoanMutation.isError ? parseFrappeError(createLoanMutation.error) : undefined}
            leftSlot={
              <button
                type="button"
                onClick={() => setSimulatorModalOpened(true)}
                className="text-xs font-semibold flex items-center gap-1 transition-colors"
                style={{ color: "var(--mantine-color-brand-6)" }}
              >
                <IconCalculator size={14} />
                Loan Simulator
              </button>
            }
          />
        </Box>
      </form>

      <LoanSimulatorModal opened={simulatorModalOpened} onClose={() => setSimulatorModalOpened(false)} />
    </Modal>
  );
}