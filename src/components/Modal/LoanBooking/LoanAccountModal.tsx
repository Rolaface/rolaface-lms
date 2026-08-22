import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Text,
  Button,
  Modal,
  Group,
  ThemeIcon,
  Badge,
  useMantineTheme,
  ScrollArea,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconX,
  IconMinus,
  IconFileInvoice,
  IconCheck,
  IconCalculator,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  createLoan,
  getLoanById,
  updateLoan,
  getReapymentScheduleById,
  attachLoanDocuments,
  uploadFile,
} from "../../../api/loanApi";
import {
  calcEmi,
  buildAmortization,
  getTodayDate,
} from "../../../utils/loanCalculations";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { ANNUAL_RATE, DEFAULT_DOCUMENTS, TAB_ITEMS } from "./Constants";
import type { LoanDocumentPayload } from "../../../types/loanForm";
import { BasicDetailsTab } from "./BasicDetailsTab";
import { RepaymentScheduleTab } from "./RepaymentScheduleTab";
import { ChargesTab, type ChargeRow } from "./ChargesTab";
import {
  CollateralTab,
  type CollateralItem,
  type Collateral,
} from "./CollateralTab";
import { CoApplicantTab, type CoApplicant } from "./CoapplicationTab";
import { DocumentsTab, type DocumentRow } from "./DocumentTab";
import { LoanSummarySidebar } from "./LoanSummarySidebarTab";
import { LoanSimulatorModal } from "../LoanSimulatorModal";
import { ModalFooter } from "../../shared/ModalFooter";
import { getLoanProductById } from "../../../api/productApi";
import { openCommonModal } from "../AlertModal";

interface LoanAccountModalProps {
  opened: boolean;
  loanId?: string | null;
  onClose: () => void;
  isViewMode?: boolean;
  onMinimize: () => void;
}

export function LoanAccountModal({
  opened,
  onClose,
  loanId,
  isViewMode,
  onMinimize,
}: LoanAccountModalProps) {
  const queryClient = useQueryClient();
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>("basic");
  const loadedLoanProductCode = useRef<string | null>(null);
  // const [loanAcNumber] = useState("");
  const [simulatorModalOpened, setSimulatorModalOpened] = useState(false);
  const [coApplicantSearch, setCoApplicantSearch] = useState("");

  const [charges, setCharges] = useState<ChargeRow[]>([
    {
      id: Date.now().toString(),
      feeName: "",
      amount: "",
      account: "",
      treatment: "",
    },
  ]);
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([
    { id: Date.now().toString(), name: "", email: "", mobile: "" },
  ]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);

  const [chargeSectionDefaults, setChargeSectionDefaults] = useState({
    interestRate: "" as number | "",
    penaltyRate: "" as number | "",
    gracePeriodDays: "" as number | "",
  });

  const handleUpdateChargeSectionDefaults = (
    field: keyof typeof chargeSectionDefaults,
    value: number | "",
  ) => setChargeSectionDefaults((prev) => ({ ...prev, [field]: value }));

  // Initialize Mantine Form
  const form = useForm({
    initialValues: {
      loanAcNumber: "",
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
      auto_create_disbursement_on_loan_booking: 0,
    },
    validate: {
      customerNumber: (v) => (!v ? "Customer is required" : null),
      productCode: (v) => (!v ? "Product is required" : null),
      loanAmount: (v) => (!v ? "Loan Amount is required" : null),
      valueDate: (v) => (!v ? "Value Date is required" : null),
      repaymentStartDate: (v) =>
        !v ? "Repayment Start Date is required" : null,
      tenureValue: (v, values) =>
        values.fixedRepaymentsIn === "TENOR" && !v
          ? "Tenure is required"
          : null,
      repaymentAmount: (v, values) =>
        values.fixedRepaymentsIn === "EMI" && !v
          ? "Repayment Amount is required"
          : null,
    },
  });

  const handleFormError = (errors: typeof form.errors) => {
    if (Object.keys(errors).length > 0) {
      setActiveTab("basic");
    }
  };

  const tenureMonths = useMemo(() => {
    return form.values.tenureValue === "" ? 0 : Number(form.values.tenureValue);
  }, [form.values.tenureValue]);

  const effectiveRate = Number(form.values.rateOfInterest);

  const estimatedEmi = useMemo(
    () =>
      calcEmi(Number(form.values.loanAmount) || 0, effectiveRate, tenureMonths),
    [form.values.loanAmount, tenureMonths, effectiveRate],
  );

  const totalRepayment = useMemo(
    () => Math.round(estimatedEmi * tenureMonths * 100) / 100,
    [estimatedEmi, tenureMonths],
  );

  const totalInterest = useMemo(
    () =>
      Math.round(
        (totalRepayment - (Number(form.values.loanAmount) || 0)) * 100,
      ) / 100,
    [totalRepayment, form.values.loanAmount],
  );

  const summaryPrincipal = Number(form.values.loanAmount) || 0;

  const handleAddDocument = () =>
    setDocuments((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", file: null },
    ]);

  const handleUpdateDocument = (
    id: string,
    field: keyof DocumentRow,
    value: any,
  ) =>
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );

  const handleRemoveDocument = (id: string) =>
    setDocuments((prev) => prev.filter((d) => d.id !== id));

  const handleAddCharge = () =>
    setCharges((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        feeName: "",
        amount: "",
        account: "",
        treatment: "",
        appliedOn: getTodayDate(),
      },
    ]);
  const handleUpdateCharge = (
    id: string,
    field: keyof ChargeRow,
    value: string | number,
  ) =>
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  const handleRemoveCharge = (id: string) =>
    setCharges((prev) => prev.filter((c) => c.id !== id));

  // Replace your current collateral state with this:
  const [collateral, setCollateral] = useState<Collateral>({
    status: "Pledged",
    reference_no: "",
    description: "",
    items: [],
  });

  const handleUpdateCollateral = (
    field: keyof Collateral,
    value: string | number,
  ) => {
    setCollateral((prev) => ({ ...prev, [field]: value as string }));
  };

  const handleAddCollateralItem = () => {
    setCollateral((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          loan_security: "",
          qty: "",
          loan_security_price: "",
          amount: "",
        },
      ],
    }));
  };

  const handleUpdateCollateralItem = (
    id: string,
    field: keyof CollateralItem,
    value: string | number,
  ) => {
    setCollateral((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleRemoveCollateralItem = (id: string) => {
    setCollateral((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };
  const handleAddCoApplicant = () =>
    setCoApplicants((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", email: "", mobile: "" },
    ]);
  const handleUpdateCoApplicant = (
    id: string,
    field: keyof Omit<CoApplicant, "id">,
    value: string,
  ) =>
    setCoApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  const handleRemoveCoApplicant = (id: string) =>
    setCoApplicants((prev) => prev.filter((a) => a.id !== id));

  async function resolveDocumentsPayload(
    rows: DocumentRow[],
  ): Promise<LoanDocumentPayload[]> {
    const resolved: LoanDocumentPayload[] = [];

    for (const doc of rows) {
      if (doc.file instanceof File) {
        const customFileName = doc.name
          ? `${doc.name}.${doc.file.name.split(".").pop()}`
          : undefined;
        const uploaded = await uploadFile(doc.file, 1, customFileName);
        // const uploaded = await uploadFile(doc.file);
        resolved.push({
          file_name: doc.name || uploaded.file_name,
          file_url: uploaded.file_url,
        });
      } else if (typeof doc.file === "string" && doc.file) {
        resolved.push({
          file_name: doc.name,
          file_url: doc.file,
        });
      }
    }

    return resolved;
  }

  const attachDocumentsMutation = useMutation({
    mutationFn: attachLoanDocuments,
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "Loan saved, but attaching documents failed.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
    },
  });

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };
  const createLoanMutation = useMutation({
    mutationFn: createLoan,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      const newLoanId = (data as { message?: { data?: { name?: string } } })?.message?.data?.name;
      if (newLoanId) {
        try {
          const documentsToAttach = await resolveDocumentsPayload(documents);
          if (documentsToAttach.length > 0) {
            attachDocumentsMutation.mutate({ id: newLoanId, documents: documentsToAttach });
          }
        } catch (err) {
          console.error("Document attach failed:", err);
        }
      }
      showSuccess(
        "Loan Booking Created",
        newLoanId 
          ? `Loan Booking ${newLoanId} created successfully.`
          : "Loan Booking created successfully."
      );

      handleModalClose();
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const payload: any = {
      applicant_type: "Customer",
      applicant: values.customerNumber,
      loan_product: values.productCode,
      loan_amount: Number(values.loanAmount),
      auto_create_disbursement_on_loan_booking:
        values.auto_create_disbursement_on_loan_booking,
      is_term_loan: 1,
      posting_date: values.valueDate,
      repayment_method:
        values.fixedRepaymentsIn === "TENOR"
          ? "Repay Over Number of Periods"
          : "Repay Fixed Amount per Period",
    };

    payload.rate_of_interest =
      chargeSectionDefaults.interestRate === ""
        ? 0
        : Number(chargeSectionDefaults.interestRate);
    payload.penalty_charges_rate =
      chargeSectionDefaults.penaltyRate === ""
        ? 0
        : Number(chargeSectionDefaults.penaltyRate);
    payload.transaction_date = values.trnDate || "";
    payload.reference_number = values.refNumber || "";
    payload.migration_date = values.migrationDate || "";
    payload.grace_period =
      chargeSectionDefaults.gracePeriodDays === ""
        ? 0
        : Number(chargeSectionDefaults.gracePeriodDays);
    payload.loan_charges = charges.map((c) => ({
      charge: c.feeName || "",
      amount: Number(c.amount) || 0,
      account: c.account || "",
      treatment_of_charge: c.treatment || "",
    }));

    if (collateral.items.length > 0) {
      payload.collaterals = {
        status: collateral.status || "",
        reference_no: collateral.reference_no || "",
        description: collateral.description || "",
        items: collateral.items.map((item) => ({
          loan_security: item.loan_security || "",
          qty: Number(item.qty) || 0,
          loan_security_price: Number(item.loan_security_price) || 0,
          amount: Number(item.amount) || 0,
        })),
      };
    }

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

  const { data: loanProductDetails } = useQuery({
    queryKey: ["loanProductDetails", form.values.productCode, opened],
    queryFn: () => getLoanProductById(form.values.productCode as string),
    enabled: !!form.values.productCode && opened,
  });

  useEffect(() => {
    const product = loanProductDetails?.message?.data;
    if (!product) return;

    if (loanId && form.values.productCode === loadedLoanProductCode.current) {
      return;
    }

    // UPDATED: Catching multiple property names (charge vs charge_type) to ensure mapping works
    const mappedCharges: ChargeRow[] = (product.loan_charges || []).map(
      (lc: any) => ({
        id: lc.name ?? Date.now().toString() + Math.random(),
        feeName: lc.charge ?? lc.charge_type ?? "",
        amount: lc.amount ?? "",
        account: lc.income_account ?? lc.account ?? "",
        treatment: lc.treatment_of_charge ?? lc.treatment ?? "",
      }),
    );

    if (mappedCharges.length > 0) {
      setCharges(mappedCharges);
    }

    setChargeSectionDefaults({
      interestRate: product.rate_of_interest ?? "",
      penaltyRate:
        product.penalty_interest_rate ?? product.penalty_charges_rate ?? "",
      gracePeriodDays: product.grace_period_in_days ?? "",
    });
  }, [loanProductDetails]);

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

  const fetchedRepaymentSchedule =
    scheduleData?.message?.data?.repayment_schedule ?? [];

  const fetchedMaturityDate = scheduleData?.message?.data?.maturity_date;
  const finalMaturityDate = fetchedMaturityDate;

  useEffect(() => {
    const loan = existingLoanData?.message?.data;

    if (loan) {
      form.setValues({
        loanAcNumber: loan.name || "",
        customerNumber: loan.applicant || "",
        productCode: loan.loan_product || "",
        isImport: !!loan.migration_date,
        loanAmount: loan.loan_amount || "",
        loanAppNumber: loan.loan_application_number || "",
        trnDate: loan.transaction_date || getTodayDate(),
        refNumber: loan.reference_number || "",
        migrationDate: loan.migration_date || "",
        fixedRepaymentsIn:
          loan.repayment_method === "Repay Over Number of Periods"
            ? "TENOR"
            : "EMI",
        tenureValue: loan.repayment_periods || "",
        auto_create_disbursement_on_loan_booking:
          loan.auto_create_disbursement_on_loan_booking || 0,
        repaymentAmount: loan.monthly_repayment_amount || "",
        valueDate: loan.posting_date,
        repaymentStartDate: loan.repayment_start_date || "",
        // moratoriumType: loan.moratorium_type || "Principal",
        moratoriumType: loan.moratorium_type || "None",
        moratoriumPeriod: loan.moratorium_tenure || "",
      });

      // loadedLoanProductCode.current = loan.loan_product || "";
      if (!loan.loan_charges || loan.loan_charges.length === 0) {
        loadedLoanProductCode.current = null;
      } else {
        loadedLoanProductCode.current = loan.loan_product || "";
      }
      setChargeSectionDefaults({
        interestRate: loan.rate_of_interest ?? "",
        penaltyRate: loan.penalty_charges_rate ?? "",
        gracePeriodDays: loan.grace_period ?? "",
      });

      const mappedCharges: ChargeRow[] = (loan.loan_charges || []).map(
        (lc: any) => ({
          id: lc.name ?? Date.now().toString() + Math.random(),
          feeName: lc.charge ?? "",
          amount: lc.amount ?? "",
          account: lc.account ?? "",
          treatment: lc.treatment_of_charge ?? "",
        }),
      );

      if (mappedCharges.length > 0) {
        setCharges(mappedCharges);
      }

      if (loan.collaterals) {
        setCollateral({
          status: loan.collaterals.status || "Pledged",
          reference_no: loan.collaterals.reference_no || "",
          description: loan.collaterals.description || "",
          items: (loan.collaterals.items || []).map((item: any) => ({
            id: item.name ?? Date.now().toString() + Math.random(),
            loan_security: item.loan_security || "",
            qty: item.qty ?? "",
            loan_security_price: item.loan_security_price ?? "",
            amount: item.amount ?? "",
          })),
        });
      } else {
        setCollateral({
          status: "Pledged",
          reference_no: "",
          description: "",
          items: [],
        });
      }
      if (loan.attachments && loan.attachments.length > 0) {
        setDocuments(
          loan.attachments.map((att: any) => ({
            id: att.name,
            name: att.file_name || "",
            file: att.file_url || "",
          })),
        );
      } else {
        setDocuments([]);
      }
    }
  }, [existingLoanData]);

const updateLoanMutation = useMutation({mutationFn: updateLoan,onSuccess: async (data, variables) => {
queryClient.invalidateQueries({ queryKey: ["loans"] });
queryClient.invalidateQueries({ queryKey: ["loan", variables.id] });
try {
  const documentsToAttach = await resolveDocumentsPayload(documents);
  if (documentsToAttach.length > 0) {
    attachDocumentsMutation.mutate({ id: variables.id, documents: documentsToAttach });
  }
} catch (err) {
  console.error("Document attach failed:", err);
}
   showSuccess(
        "Loan Booking Updated",
        `Loan Booking ${variables.id} updated successfully.`
      );
      handleModalClose();
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const handleReset = () => {
    form.reset();
    setCharges([
      {
        id: Date.now().toString(),
        feeName: "",
        amount: "",
        account: "",
        treatment: "",
      },
    ]);
    setCollateral({
      status: "Pledged",
      reference_no: "",
      description: "",
      items: [],
    });
    setCoApplicants([
      { id: Date.now().toString(), name: "", email: "", mobile: "" },
    ]);
    setCoApplicantSearch("");
    setDocuments([]);
    setChargeSectionDefaults({
      interestRate: "",
      penaltyRate: "",
      gracePeriodDays: "",
    });
    setActiveTab("basic");
    createLoanMutation.reset();
  };
  const handleModalClose = () => {
    if (loanId) {
      queryClient.removeQueries({ queryKey: ["loan", loanId] });
      queryClient.removeQueries({
        queryKey: ["loan-repayment-schedule", loanId],
      });
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
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
        },
      }}
    >
      {/* <form
        onSubmit={form.onSubmit(handleSubmit)}
        style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}
      > */}
      <form
        onSubmit={form.onSubmit(handleSubmit, handleFormError)}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
        }}
      >
        <Box className="flex flex-col flex-1 min-h-0">
          {/* Header */}

          <Box
            className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
            style={{
              background: theme.other.brandGradient,
              borderBottom: "1px solid var(--mantine-color-brand-7)",
            }}
          >
            <Group gap="sm" className="min-w-0" wrap="nowrap">
              <ThemeIcon
                size={38}
                radius="xl"
                style={{
                  background: theme.other.headerIconOverlayBg,
                  color: "var(--mantine-color-white)",
                }}
              >
                <IconFileInvoice size={19} /> {/* was 24 */}
              </ThemeIcon>
              <div className="min-w-0">
                <Text
                  size="md"
                  fw={700}
                  c="white"
                  className="leading-tight truncate"
                >
                  {" "}
                  {/* size="lg" -> "md" */}
                  {loanId
                    ? isViewMode
                      ? "View Loan Booking"
                      : "Update Loan Booking"
                    : "New Loan Booking"}
                </Text>
                <Text size="xs" c="brand.1" className="leading-tight truncate">
                  {loanId ? ` · Account ${loanId}` : ""}
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
                onClick={onMinimize}
                style={{ color: "var(--mantine-color-white)" }}
                styles={{
                  root: {
                    "&:hover": {
                      backgroundColor: theme.other.headerButtonHoverBg,
                    },
                  },
                }}
              >
                <IconMinus size={18} />
              </Button>
              <Button
                variant="subtle"
                size="xs"
                px={8}
                onClick={handleModalClose}
                style={{ color: "var(--mantine-color-white)" }}
                styles={{
                  root: {
                    "&:hover": {
                      backgroundColor: theme.other.headerButtonHoverBg,
                    },
                  },
                }}
              >
                <IconX size={18} />
              </Button>
            </Group>
          </Box>

          <Box
            px="md"
            py={6}
            style={{
              borderBottom: "1px solid var(--mantine-color-slate-2)",
              flexShrink: 0,
            }}
            bg="slate.0"
          >
            <ScrollArea type="auto" scrollbarSize={4} offsetScrollbars={false}>
              <Group gap={18} wrap="nowrap">
                {TAB_ITEMS.map((tab, idx) => {
                  const isActive = idx === activeTabIndex;
                  const isComplete = idx < activeTabIndex;
                  const StepIcon = tab.icon;
                  return (
                    <Group key={tab.value} gap={18} wrap="nowrap">
                      <UnstyledButton
                        type="button"
                        onClick={() => setActiveTab(tab.value)}
                        px={14}
                        py={7}
                        style={{
                          borderRadius: "var(--mantine-radius-sm)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          background: isActive
                            ? "var(--mantine-color-white)"
                            : "transparent",
                          boxShadow: isActive
                            ? "var(--mantine-shadow-sm)"
                            : "none",
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
                            variant={
                              isActive || isComplete ? "filled" : "outline"
                            }
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
                            {tab.label}
                          </Text>
                        </Group>
                      </UnstyledButton>
                      {idx < TAB_ITEMS.length - 1 && (
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

          <Box
            component="fieldset"
            disabled={isViewMode}
            bg="white"
            className="flex-1 flex flex-col lg:flex-row overflow-y-auto border-0 p-0 m-0 min-w-0 min-h-0"
          >
            <div className="flex-1 pt-3 px-5 pb-5 min-w-0">
              {activeTab === "basic" && (
                <BasicDetailsTab
                  form={form}
                  // loanAcNumber={loanAcNumber}
                  maturityDate={finalMaturityDate}
                />
              )}
              {activeTab === "schedule" && (
                <RepaymentScheduleTab
                  repaymentSchedule={fetchedRepaymentSchedule}
                  isFetchingSchedule={isFetchingSchedule}
                />
              )}
              {activeTab === "charges" && (
                <ChargesTab
                  charges={charges}
                  onAdd={handleAddCharge}
                  onUpdate={handleUpdateCharge}
                  onRemove={handleRemoveCharge}
                  interestRate={chargeSectionDefaults.interestRate}
                  penaltyRate={chargeSectionDefaults.penaltyRate}
                  gracePeriodDays={chargeSectionDefaults.gracePeriodDays}
                  onInterestRateChange={(v) =>
                    handleUpdateChargeSectionDefaults("interestRate", v)
                  }
                  onPenaltyRateChange={(v) =>
                    handleUpdateChargeSectionDefaults("penaltyRate", v)
                  }
                  onGracePeriodChange={(v) =>
                    handleUpdateChargeSectionDefaults("gracePeriodDays", v)
                  }
                />
              )}
              {activeTab === "collateral" && (
                <CollateralTab
                  collateral={collateral}
                  onUpdate={handleUpdateCollateral}
                  onAddItem={handleAddCollateralItem}
                  onUpdateItem={handleUpdateCollateralItem}
                  onRemoveItem={handleRemoveCollateralItem}
                />
              )}{" "}
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
              {activeTab === "documents" && (
                <DocumentsTab
                  documents={documents}
                  onAdd={handleAddDocument}
                  onUpdate={handleUpdateDocument}
                  onRemove={handleRemoveDocument}
                />
              )}
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
          </Box>

          {/* Footer — shared ModalFooter, no Reset action exposed. */}
          <Box style={{ flexShrink: 0 }}>
            <ModalFooter
              variant="theme"
              isViewMode={isViewMode}
              onClose={handleModalClose}
              // onSaveDraft={!isViewMode ? () => { } : undefined}
              submitLabel={loanId ? "Update " : "Save"}
              // submitLoading={createLoanMutation.isPending || updateLoanMutation.isPending || isFetchingLoan}
              submitLoading={
                createLoanMutation.isPending ||
                updateLoanMutation.isPending ||
                attachDocumentsMutation.isPending ||
                isFetchingLoan
              }
              errorMessage={
                createLoanMutation.isError
                  ? parseFrappeError(createLoanMutation.error)
                  : undefined
              }
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
        </Box>
      </form>

      <LoanSimulatorModal
        opened={simulatorModalOpened}
        onClose={() => setSimulatorModalOpened(false)}
      />
    </Modal>
  );
}
