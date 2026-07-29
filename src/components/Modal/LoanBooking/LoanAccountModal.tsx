import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Text, Button, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconX, IconMinus, IconFileText, IconCheck, IconCalculator } from "@tabler/icons-react";

import { createLoan, getLoanById, updateLoan } from "../../../api/loanApi";
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

// import { CollateralModal } from "../CollateralModal";
import { LoanSimulatorModal } from "../LoanSimulatorModal";

interface LoanAccountModalProps {
  opened: boolean;
  loanId?: string | null;
  onClose: () => void;
  isViewMode?: boolean;
}

export function LoanAccountModal({ opened, onClose, loanId, isViewMode }: LoanAccountModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>("basic");
  
  // UI Only States (Modals, Sub-tabs, etc)
  const [loanAcNumber] = useState("");
  const [collateralModalOpened, setCollateralModalOpened] = useState(false);
  const [collateralSearch, setCollateralSearch] = useState("");
  const [simulatorModalOpened, setSimulatorModalOpened] = useState(false);
  const [coApplicantSearch, setCoApplicantSearch] = useState("");
  
  // Array Data (Charges, Collaterals, etc) kept outside the form for simplicity
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [collaterals, setCollaterals] = useState<CollateralItem[]>([]);
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([]);
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);

  // Initialize Mantine Form
  const form = useForm({
    initialValues: {
      customerNumber: "",
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

  const estimatedEmi = useMemo(
    () => calcEmi(Number(form.values.loanAmount) || 0, ANNUAL_RATE, tenureMonths),
    [form.values.loanAmount, tenureMonths]
  );
  
  const totalRepayment = useMemo(
    () => Math.round(estimatedEmi * tenureMonths * 100) / 100,
    [estimatedEmi, tenureMonths]
  );
  
  const totalInterest = useMemo(
    () => Math.round((totalRepayment - (Number(form.values.loanAmount) || 0)) * 100) / 100,
    [totalRepayment, form.values.loanAmount]
  );
  
  const maturityDate = useMemo(() => {
    if (!form.values.valueDate || !tenureMonths) return "";
    const d = new Date(form.values.valueDate);
    d.setMonth(d.getMonth() + tenureMonths);
    return d.toISOString().split("T")[0];
  }, [form.values.valueDate, tenureMonths]);
  
  const amortization = useMemo(
    () => buildAmortization(Number(form.values.loanAmount) || 0, ANNUAL_RATE, tenureMonths),
    [form.values.loanAmount, tenureMonths]
  );
  
  const summaryPrincipal = Number(form.values.loanAmount) || 0;

  // --- Array Handlers ---
  const handleAddCharge = () =>
    setCharges((prev) => [...prev, { id: Date.now().toString(), feeType: "", percentage: "", amount: "", appliedOn: getTodayDate() }]);
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
      // onClose();
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    // Map form data directly to API payload schema
    const payload: any = {
      applicant_type: "Customer", // Adjust if you add UI for this
      applicant: values.customerNumber,
      loan_product: values.productCode,
      loan_amount: Number(values.loanAmount),
      rate_of_interest: ANNUAL_RATE, 
      penalty_charges_rate: 0,
      is_term_loan: 1,
      posting_date: values.trnDate,
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
    }

    // createLoanMutation.mutate(payload);
    if (loanId) {
      updateLoanMutation.mutate({ id: loanId, payload });
    } else {
      createLoanMutation.mutate(payload);
    }
  };

// const { data: existingLoanData, isLoading: isFetchingLoan } = useQuery({
//     queryKey: ["loan", loanId],
//     queryFn: () => getLoanById(loanId!),
//     enabled: !!loanId && opened, 
//   });

 const { data: existingLoanData, isLoading: isFetchingLoan, error, isError } = useQuery({
  queryKey: ["loan", loanId],
  queryFn: async () => await getLoanById(loanId as string),
  enabled: !!loanId && opened === true,
  refetchOnMount: "always", 
});

 useEffect(() => {
  const loan = existingLoanData?.message?.data;

  if (loan) {
    form.setValues({
      customerNumber: loan.applicant || "",
      productCode: loan.loan_product || "",
      loanAmount: loan.loan_amount || "",
      trnDate: loan.posting_date || getTodayDate(),
      fixedRepaymentsIn: loan.repayment_method === "Repay Over Number of Periods" ? "TENOR" : "EMI",
      tenureValue: loan.repayment_periods || "",
      repaymentAmount: loan.monthly_repayment_amount || "",
      repaymentStartDate: loan.repayment_start_date || "",
      // moratoriumType: loan.moratorium_type || "None",
      moratoriumType: loan.moratorium_type || "Principal",
      moratoriumPeriod: loan.moratorium_tenure || "",
    });
  }
}, [existingLoanData]);

// const updateLoanMutation = useMutation({
//     mutationFn: updateLoan,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["loans"] });
//       handleModalClose();
//     },
//   });
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
    setCharges([]);
    setCollaterals([]);
    setCoApplicants([]);
    setCoApplicantSearch("");
    setDocuments(DEFAULT_DOCUMENTS);
    setActiveTab("basic");
    createLoanMutation.reset();
  };

  // --- ADD THIS FUNCTION ---
  const handleModalClose = () => {
     if (loanId) {
    queryClient.removeQueries({ queryKey: ["loan", loanId] }); 
  }
    handleReset(); 
    onClose();     
  };

  const activeTabIndex = TAB_ITEMS.findIndex((t) => t.value === activeTab);

  return (
    // <Modal opened={opened} onClose={onClose} size="95%" withCloseButton={false} padding={0} radius="md">
    <Modal opened={opened} onClose={handleModalClose} size="95%" withCloseButton={false} padding={0} radius="md">
      {/* Wrap everything in the form element */}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Box className="flex flex-col h-[90vh]">
          {/* Header */}
          <Box className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 flex justify-between items-center rounded-t-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1 rounded-md shrink-0">
                <IconFileText size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <Text size="md" fw={600} className="leading-tight truncate">
  {/* {loanId ? "Update Loan Booking" : "New Loan Booking"} */}
  {loanId ? (isViewMode ? "View Loan Booking" : "Update Loan Booking") : "New Loan Booking"}
</Text>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="subtle" className="text-white hover:bg-white/10 px-2" size="xs">
                <IconMinus size={18} />
              </Button>
             <Button variant="subtle" onClick={handleModalClose} className="text-white hover:bg-white/10 px-2" size="xs">
  <IconX size={18} />
</Button>
            </div>
          </Box>

          {/* Stepper */}
          <Box className="px-5 pt-4 pb-4 bg-white border-b border-slate-100 shrink-0">
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
                      className="flex items-center gap-2 text-left shrink-0 group"
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                            : isComplete
                            ? "bg-indigo-500 text-white"
                            : "bg-white text-slate-400 border-2 border-slate-200 group-hover:border-slate-300"
                        }`}
                      >
                        {isComplete ? <IconCheck size={14} /> : <StepIcon size={14} />}
                      </div>
                      <Text
                        size="xs"
                        fw={700}
                        className={`whitespace-nowrap ${
                          isActive ? "text-indigo-600" : isComplete ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {tab.label}
                      </Text>
                    </button>
                    {idx < TAB_ITEMS.length - 1 && (
                      <div
                        className={`flex-1 min-w-[2rem] h-[2px] mx-3 rounded-full transition-colors ${
                          isComplete ? "bg-indigo-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Box>

          {/* Body */}
          {/* <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white"> */}
          <fieldset 
            disabled={isViewMode} 
            className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white border-0 p-0 m-0 min-w-0 min-h-0"
          >
            <div className="flex-1 overflow-y-auto p-6 min-w-0">
              {activeTab === "basic" && (
                <BasicDetailsTab
                  form={form}
                  loanAcNumber={loanAcNumber}
                  maturityDate={maturityDate}
                />
              )}
              {activeTab === "schedule" && <RepaymentScheduleTab amortization={amortization} />}
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
              summaryPrincipal={summaryPrincipal}
              currency={form.values.currency}
              tenureMonths={tenureMonths}
              frequency={form.values.frequency}
              repaymentStartDate={form.values.repaymentStartDate}
              maturityDate={maturityDate}
              moratoriumType={form.values.moratoriumType}
              estimatedEmi={estimatedEmi}
              totalInterest={totalInterest}
              totalRepayment={totalRepayment}
            />
          {/* </div> */}
          </fieldset>

          {/* Footer */}
          <div className="bg-white border-t border-slate-100 p-3 px-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0 rounded-b-md">
            <div className="flex items-center gap-4">
              {/* <Button
  size="sm"
  variant="default"
  onClick={handleModalClose}
  disabled={createLoanMutation.isPending}
  className="font-semibold px-5 text-slate-700 border-slate-200"
>
  Cancel
</Button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Reset
              </button> */}
              <button
                type="button"
                onClick={() => setSimulatorModalOpened(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors ml-2"
              >
                <IconCalculator size={14} />
                Loan Simulator
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {createLoanMutation.isError && !isViewMode && (
                <Text size="xs" c="red" className="sm:mr-2">
                  {parseFrappeError(createLoanMutation.error)}
                </Text>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={handleModalClose}
                disabled={createLoanMutation.isPending}
                className="font-semibold px-5 text-slate-700 border-slate-200"
              >
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              
              {/* Only show action buttons if NOT in view mode */}
              {!isViewMode && (
                <>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Reset
                  </button>
                  <Button size="sm" variant="default" className="font-semibold px-5 text-slate-700 border-slate-200">
                    Save as Draft
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    loading={createLoanMutation.isPending || updateLoanMutation.isPending || isFetchingLoan}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 font-semibold px-6"
                  >
                    {loanId ? "Update Application" : "Submit Application"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Box>
      </form>

      {/* <CollateralModal opened={collateralModalOpened} onClose={() => setCollateralModalOpened(false)} /> */}
      <LoanSimulatorModal opened={simulatorModalOpened} onClose={() => setSimulatorModalOpened(false)} />
    </Modal>
  );
}