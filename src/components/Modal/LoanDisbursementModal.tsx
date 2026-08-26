// LoanDisbursementModal.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "@mantine/form";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Tabs,
  Badge,
  Group,
  Table,
  Loader,
  Stack,
  ThemeIcon,
  Checkbox,
  useMantineTheme,
  Textarea,
} from "@mantine/core";
import {
  IconX,
  IconMinus,
  IconSearch,
  IconCalendar,
  IconChevronDown,
  IconCreditCard,
  IconHome,
  IconLock,
  IconNote,
  IconNotes,
} from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLoanDisbursement, getAllDsbrAccount, updateLoanDisbursement, getLoanDisbursementById, getAllModeOfPayments } from "../../api/loanDisbursementAPi";
import { getAllApplicationDsbr, getLoanById } from "../../api/loanApi";
import type { LoanDisbursementPayload, } from "../../types/loanDisbursementForm";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { getSymbol, formatAmount } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { openCommonModal } from "./AlertModal";
import { ModalFooter } from "../shared/ModalFooter";

interface LoanDisbursementModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onSubmit?: (data: LoanDisbursementFormData) => void;
  editId?: string | null;
  initialData?: any;
  isView?: boolean;
}
export interface LoanDisbursementChargeRow {
  id: string;
  name: string;
  amount: string;
  account: string;
  treatment_of_charge: string;
}

export interface LoanDisbursementFormData {
  acNo: string;
  valueDate: string;
  disburseAmount: number | "";
  modeOfPayment: string | null;
  disbursementAc: string | null;
  refDate: string;
  refNo: string;
  beneficiaryAcNo: string;
  charges: LoanDisbursementChargeRow[];
  isTopup: boolean;
  topupSanctionedCurrent: number | "";
  topupSanctionedNew: number | "";
  topupOutstandingCurrent: number | "";
  topupOutstandingNew: number | "";
  topupAmount: number | "";
  comment?: string;
}


const CHARGE_TREATMENT_OPTIONS = ["Billed Separately", "Add to first repayment"] as const;

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateValue = (value?: string | null): string => {
  if (!value) return "";

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    return `${year}-${month}-${day}`;
  }

  return value;
};
const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD-MMM-YYYY") : String(value);
};
const toDateValue = (iso: string | null | undefined): Date | null =>
  iso && dayjs(iso).isValid() ? dayjs(iso).toDate() : null;

const chevronDown = <IconChevronDown size={14} color="var(--mantine-color-slate-4)" />;

// function formatCurrency(amount: number) {
//   return `₹${amount.toLocaleString("en-IN")}`;
// }

export function LoanDisbursementModal({
  opened,
  onClose,
  onMinimize,
  onSubmit: _onSubmit,
  editId,
  initialData,
  isView = false,
}: LoanDisbursementModalProps) {

  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencySymbol = getSymbol(companyCurrency);

  const [activeTab, setActiveTab] = useState<string | null>("settlement");

  const { data: modeOfPaymentsResponse, isLoading: isModeOfPaymentsLoading } = useQuery({
    queryKey: ["modeOfPayments"],
    queryFn: getAllModeOfPayments,
    enabled: opened,
  });

  const modeOfPaymentOptions = useMemo(() => {
    const list = modeOfPaymentsResponse?.data || modeOfPaymentsResponse?.message || modeOfPaymentsResponse || [];
    if (Array.isArray(list)) {
      return list.map((item: any) => item.name);
    }
    return [];
  }, [modeOfPaymentsResponse]);

  const modeOfPaymentAccounts = useMemo(() => {
    const list = modeOfPaymentsResponse?.data || modeOfPaymentsResponse?.message || modeOfPaymentsResponse || [];
    const map: Record<string, string | null> = {};
    if (Array.isArray(list)) {
      list.forEach((item: any) => {
        map[item.name] = item.default_account || null;
      });
    }
    return map;
  }, [modeOfPaymentsResponse]);

  const form = useForm<LoanDisbursementFormData>({
    initialValues: {
      acNo: "",
      valueDate: getTodayDate(),
      disburseAmount: "" as number | "",
      modeOfPayment: null as string | null,
      disbursementAc: null as string | null,
      refDate: getTodayDate(),
      refNo: "",
      beneficiaryAcNo: "",
      charges: [],
      isTopup: false,
      topupSanctionedCurrent: "" as number | "",
      topupSanctionedNew: "" as number | "",
      topupOutstandingCurrent: "" as number | "",
      topupOutstandingNew: "" as number | "",
      topupAmount: "" as number | "",
      comment: "",
    },
    validate: {
      acNo: (v) => (!v ? "Account Number is required" : null),
      valueDate: (v) => (!v ? "Value Date is required" : null),
      disburseAmount: (v) => (!v ? "Disburse Amount is required" : null),
      modeOfPayment: (v) => (!v ? "Mode of Payment is required" : null),
      // disbursementAc: (v) => (!v ? "Disbursement Account is required" : null),
      refDate: (v) => (!v ? "Ref Date is required" : null),
      refNo: (v) => (!v ? "Ref No is required" : null),
      // beneficiaryAcNo: (v) => (!v ? "Beneficiary A/c No is required" : null),
    },
  });

  const queryClient = useQueryClient();
  const createDisbursementMutation = useMutation({
    mutationFn: createLoanDisbursement,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["loanDisbursements"] });
      const newId =
        data?.data?.name || data?.message?.name || data?.name || "";
      handleReset();
      onClose();
      openCommonModal({
        heading: "Disbursement Created",
        subtitle: "",
        body: newId
          ? `Loan disbursement ${newId} has been created successfully.`
          : "Loan disbursement has been created successfully.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
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

  const updateDisbursementMutation = useMutation({
    mutationFn: updateLoanDisbursement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanDisbursements"] });
      queryClient.invalidateQueries({ queryKey: ["loanDisbursement", editId] });

      handleReset();
      onClose();
      openCommonModal({
        heading: "Disbursement Updated",
        subtitle: "",
        body: editId
          ? `Loan disbursement ${editId} has been updated successfully.`
          : "Loan disbursement has been updated successfully.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
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
    form.setValues({
      valueDate: getTodayDate(),
      refDate: getTodayDate(),
    });
    setActiveTab("settlement");
  };

  const handleSubmit = (values: typeof form.values) => {
    const modeAccount = values.modeOfPayment ? modeOfPaymentAccounts[values.modeOfPayment] : null;
    const resolvedDisbursementAc = values.disbursementAc || modeAccount || loanDataDisbursementAccount || undefined;
    console.log("DEBUG disbursement:", {
      formDisbursementAc: values.disbursementAc,
      modeOfPayment: values.modeOfPayment,
      modeAccount,
      loanDataDisbursementAccount,
      resolvedDisbursementAc,
      acNo: values.acNo,
      hasUserChangedLoanAccount,
    });

    const payload: Partial<LoanDisbursementPayload> & {
      loan_disbursement_charges?: Array<{ charge: string; amount: number; account: string; treatment_of_charge: string }>;
    } = {
      against_loan: values.acNo,
      posting_date: values.valueDate,
      disbursement_date: values.valueDate,
      disbursed_amount: Number(values.disburseAmount),
      mode_of_payment: values.modeOfPayment as string,
      reference_number: values.refNo,
      reference_date: values.refDate,
      repayment_start_date: selectedLoanApp?.repayment_start_date || undefined,
      disbursement_account: resolvedDisbursementAc,
      loan_account: selectedLoanApp?.loan_account || undefined,
      comment: values.comment,
      loan_disbursement_charges: values.charges.map((charge) => ({
        charge: charge.name,
        amount: Number(charge.amount || 0),
        account: charge.account,
        treatment_of_charge: charge.treatment_of_charge || "Billed Separately",
      })),
    };

    if (values.isTopup) {
      payload.top_up = 1;
      payload.top_up_details = {
        old_sanctioned_amount: Number(values.topupSanctionedCurrent || 0),
        new_sanctioned_amount: Number(values.topupSanctionedNew || 0),
        old_outstanding_amount: Number(values.topupOutstandingCurrent || 0),
        new_outstanding_amount: Number(values.topupOutstandingNew || 0),
        top_up_amount: Number(values.topupAmount || 0),
      };
    }



    if (editId) {
      updateDisbursementMutation.mutate({ id: editId, payload });
    } else {
      createDisbursementMutation.mutate(payload as LoanDisbursementPayload);
    }
  };
  const [hasUserChangedLoanAccount, setHasUserChangedLoanAccount] = useState(false);
  const [hasUserChangedMode, setHasUserChangedMode] = useState(false);
  const skipTopupRecalc = Boolean(editId) && !hasUserChangedLoanAccount;

  const { data: loanAppsResponse, isLoading: isLoanAppsLoading, refetch: refetchLoanApps } = useQuery({
    queryKey: ["loanApplications"],
    queryFn: getAllApplicationDsbr,
    enabled: opened,
  });

  const { data: editDetailsResponse, isLoading: isEditLoading } = useQuery({
    queryKey: ["loanDisbursement", editId],
    queryFn: () => getLoanDisbursementById(editId!),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (editId && editDetailsResponse) {
      const respData = (editDetailsResponse as any).message || editDetailsResponse;
      const item = respData.data || respData;
      let topupDetails = null;

      if (item.top_up && item.against_loan) {
        if (typeof item.top_up_details === 'string') {
          try {
            topupDetails = JSON.parse(item.top_up_details);
          } catch (e) {
            console.error('Failed to parse top_up_details', e);
          }
        } else {
          topupDetails = item.top_up_details;
        }
      }

      form.setValues({
        acNo: item.against_loan || "",
        valueDate: normalizeDateValue(item.disbursement_date || item.posting_date || getTodayDate()),
        disburseAmount: (Number(item.disbursed_amount) || 0),
        modeOfPayment: item.mode_of_payment || null,
        disbursementAc: item.disbursement_account || null,
        refDate: normalizeDateValue(item.reference_date || getTodayDate()),
        refNo: item.reference_number || "",
        beneficiaryAcNo: item.loan_account || "",
        isTopup: Boolean(item.top_up),
        topupSanctionedCurrent: topupDetails?.old_sanctioned_amount ?? "",
        topupSanctionedNew: topupDetails?.new_sanctioned_amount ?? "",
        topupOutstandingCurrent: topupDetails?.old_outstanding_amount ?? "",
        topupOutstandingNew: topupDetails?.new_outstanding_amount ?? "",
        topupAmount: topupDetails?.top_up_amount ?? "",
        comment: item.comment || "",
      });
      const existingCharges = normalizeLoanCharges({ loan_charges: item.loan_disbursement_charges });
      form.setFieldValue("charges", existingCharges);
      setHasUserChangedLoanAccount(false);
      setHasUserChangedMode(false);
    } else if (!editId) {
      form.reset();
      form.setValues({
        valueDate: getTodayDate(),
        refDate: getTodayDate(),
      });
      setActiveTab("settlement");
      setHasUserChangedLoanAccount(false);
      setHasUserChangedMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editDetailsResponse]);

  const loanAppOptions = useMemo(() => {
    if (loanAppsResponse?.data) {
      return loanAppsResponse.data.map((item: any) => item.name);
    }
    return [];
  }, [loanAppsResponse]);

  const selectedLoanApp = useMemo(() => {
    if (!loanAppsResponse?.data || !form.values.acNo) return null;
    return loanAppsResponse.data.find((app: any) => app.name === form.values.acNo);
  }, [loanAppsResponse, form.values.acNo]);

  const normalizeLoanCharges = (payload: any): LoanDisbursementChargeRow[] => {
    const list =
      payload?.message?.data?.loan_charges ??
      payload?.data?.loan_charges ??
      payload?.loan_charges ??
      payload?.message?.loan_charges ??
      [];

    if (!Array.isArray(list)) return [];

    return list
      .map((item: any) => {
        if (!item) return null;
        const name = item.charge || item.name || item.charge_name || item.item || "";
        if (!name) return null;

        return {
          id: String(item.name || item.charge || item.charge_name || `${Date.now()}-${Math.random()}`),
          name,
          amount: item.amount != null ? String(item.amount) : "",
          account: item.account || item.income_account || item.default_account || "",
          treatment_of_charge: item.treatment_of_charge || item.treatment || "Billed Separately",
        };
      })
      .filter((item): item is LoanDisbursementChargeRow => Boolean(item));
  };

  const { data: loanAccountDetailsData, isLoading: isLoanAccountChargesLoading, error: loanAccountDetailsError } = useQuery({
    queryKey: ["loanAccountDetails", form.values.acNo],
    queryFn: () => getLoanById(form.values.acNo),
    enabled: opened && !!form.values.acNo && (!editId || hasUserChangedLoanAccount),
  });
  const isPending = createDisbursementMutation.isPending || updateDisbursementMutation.isPending || isEditLoading || isLoanAccountChargesLoading;


  const actualDisbursableAmount = useMemo(() => {
    const loanData =
      (loanAccountDetailsData as any)?.message?.data ||
      (loanAccountDetailsData as any)?.data ||
      (loanAccountDetailsData as any)?.message ||
      loanAccountDetailsData;

    if (loanData) {
      const sanctioned = Number(loanData.loan_amount || 0);
      const disbursed = Number(loanData.disbursed_amount || 0);
      return sanctioned - disbursed;
    }

    // Fallback: loanAccountDetailsData query hasn't fired yet (e.g. edit mode,
    // account not changed) — derive from the disbursement record itself.
    if (editId && editDetailsResponse) {
      const item =
        (editDetailsResponse as any).message?.data ||
        (editDetailsResponse as any).data ||
        (editDetailsResponse as any).message ||
        editDetailsResponse;
      const sanctioned = Number(item?.sanctioned_loan_amount || 0);
      const priorDisbursed = Number(item?.current_disbursed_amount || 0);
      return sanctioned - priorDisbursed;
    }

    return null;
  }, [loanAccountDetailsData, editId, editDetailsResponse]);

  const canShowTopup = actualDisbursableAmount !== null && actualDisbursableAmount === 0;

  const loanDataDisbursementAccount = useMemo(() => {
    const loanData =
      (loanAccountDetailsData as any)?.message?.data ||
      (loanAccountDetailsData as any)?.data ||
      (loanAccountDetailsData as any)?.message ||
      loanAccountDetailsData;
    return loanData?.disbursement_account || null;
  }, [loanAccountDetailsData]);

  const selectedLoanDisbursedAmount = useMemo(() => {
    const loanData =
      (loanAccountDetailsData as any)?.message?.data ||
      (loanAccountDetailsData as any)?.data ||
      (loanAccountDetailsData as any)?.message ||
      loanAccountDetailsData;

    if (loanData) return Number(loanData.disbursed_amount || 0);

    if (editId && editDetailsResponse) {
      const item =
        (editDetailsResponse as any).message?.data ||
        (editDetailsResponse as any).data ||
        (editDetailsResponse as any).message ||
        editDetailsResponse;
      return Number(item?.disbursed_amount || 0);
    }

    return 0;
  }, [loanAccountDetailsData, editId, editDetailsResponse]);

  useEffect(() => {
    if (!opened || !form.values.acNo) {
      form.setFieldValue("charges", []);
      if (!editId) {
        form.setFieldValue("disburseAmount", "");
        form.setFieldValue("topupSanctionedCurrent", "");
        form.setFieldValue("topupOutstandingCurrent", "");
      }
      return;
    }
    if (editId && !hasUserChangedLoanAccount) return;
    if (isLoanAccountChargesLoading) return;

    const chargeDefaults = normalizeLoanCharges(loanAccountDetailsData);
    form.setFieldValue("charges", chargeDefaults);
  }, [form.values.acNo, loanAccountDetailsData, isLoanAccountChargesLoading]);

  // CREATE mode: current sanctioned/outstanding always derived live from getLoanById.
  useEffect(() => {
    if (editId || !form.values.acNo) return;
    if (isLoanAccountChargesLoading) return;

    const loanData =
      (loanAccountDetailsData as any)?.message?.data ||
      (loanAccountDetailsData as any)?.data ||
      (loanAccountDetailsData as any)?.message ||
      loanAccountDetailsData;

    if (!loanData) return;

    const sanctioned = Number(loanData.loan_amount || 0);
    const disbursed = Number(loanData.disbursed_amount || 0);
    const outstanding = sanctioned - disbursed;

    form.setFieldValue("topupSanctionedCurrent", sanctioned);
    form.setFieldValue("topupOutstandingCurrent", outstanding);
    form.setFieldValue("disburseAmount", outstanding);
  }, [editId, form.values.acNo, loanAccountDetailsData, isLoanAccountChargesLoading]);

  // EDIT mode: current sanctioned/outstanding derived from API — getLoanById
  // once the user changes the loan account, otherwise from the disbursement record itself.
  useEffect(() => {
    if (!editId) return;
    if (!hasUserChangedLoanAccount) return;
    if (isLoanAccountChargesLoading) return;

    const loanData =
      (loanAccountDetailsData as any)?.message?.data ||
      (loanAccountDetailsData as any)?.data ||
      (loanAccountDetailsData as any)?.message ||
      loanAccountDetailsData;

    if (!loanData) return;

    const sanctioned = Number(loanData.loan_amount || 0);
    const disbursed = Number(loanData.disbursed_amount || 0);
    form.setFieldValue("topupSanctionedCurrent", sanctioned);
    form.setFieldValue("topupOutstandingCurrent", sanctioned - disbursed);
  }, [editId, hasUserChangedLoanAccount, loanAccountDetailsData, isLoanAccountChargesLoading, editDetailsResponse]);

  useEffect(() => {
    if (editId && !hasUserChangedLoanAccount && !hasUserChangedMode) return;

    const modeAccount = form.values.modeOfPayment ? modeOfPaymentAccounts[form.values.modeOfPayment] : null;
    const loanFallback = form.values.acNo ? loanDataDisbursementAccount : null;
    form.setFieldValue("disbursementAc", modeAccount || loanFallback || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.acNo, form.values.modeOfPayment, modeOfPaymentAccounts, loanDataDisbursementAccount, hasUserChangedMode]);

  useEffect(() => {
    if (skipTopupRecalc) return;
    const currentSanctioned = Number(form.values.topupSanctionedCurrent || 0);
    const currentOutstanding = Number(form.values.topupOutstandingCurrent || 0);
    const topup = Number(form.values.topupAmount || 0);
    form.setFieldValue("topupSanctionedNew", currentSanctioned + topup);
    form.setFieldValue("topupOutstandingNew", currentOutstanding + topup);

  }, [form.values.topupSanctionedCurrent, form.values.topupOutstandingCurrent, skipTopupRecalc]);

  useEffect(() => {
    if (!canShowTopup) return;
    if (skipTopupRecalc) return;
    const outstandingCurrent = Number(form.values.topupOutstandingCurrent || 0);
    const sanctionedCurrent = Number(form.values.topupSanctionedCurrent || 0);
    const disburse = Number(form.values.disburseAmount || 0);
    const topup = disburse - outstandingCurrent;

    form.setFieldValue("topupAmount", topup);
    form.setFieldValue("topupSanctionedNew", sanctionedCurrent + topup);
    form.setFieldValue("topupOutstandingNew", outstandingCurrent + topup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.disburseAmount, canShowTopup, skipTopupRecalc]);
  useEffect(() => {
    if (skipTopupRecalc) return;
    if (form.values.isTopup && !canShowTopup) {
      form.setFieldValue("isTopup", false);
      if (activeTab === "topup") {
        setActiveTab("settlement");
      }
    }
  }, [canShowTopup, skipTopupRecalc]);

  const handleChargeUpdate = (index: number, field: "amount" | "treatment_of_charge", value: string) => {


    form.setFieldValue(
      "charges",
      form.values.charges.map((charge, chargeIndex) => {
        if (chargeIndex !== index) return charge;
        return { ...charge, [field]: value };
      })
    );
  };


  useEffect(() => {
    if (!editId) {
      form.setFieldValue("beneficiaryAcNo", selectedLoanApp?.loan_account || "");
    }
  }, [form.values.acNo, selectedLoanApp]);

  const footerErrorMessage =
    createDisbursementMutation.isError || updateDisbursementMutation.isError
      ? `Failed to ${editId ? "update" : "create"} disbursement.`
      : undefined;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="1060px"
      withCloseButton={false}
      padding={0}
      radius="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Box className="flex flex-col">
          {/* Header — styled to match the Loan Booking modal header */}
          <Box
            className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
            style={{
              background: theme.other.brandGradient as string,
              borderBottom: "1px solid var(--mantine-color-brand-7)",
            }}
          >
            <Group gap="sm" className="min-w-0" wrap="nowrap">
              <ThemeIcon
                size={38}
                radius="xl"
                style={{
                  background: theme.other.headerIconOverlayBg as string,
                  color: "var(--mantine-color-white)",
                }}
              >
                <IconNote size={19} />
              </ThemeIcon>
              <div className="min-w-0">
                <Text size="md" fw={700} c="white" className="leading-tight truncate">
                  {editId ? (isView ? "View Loan Disbursement" : "Update Loan Disbursement") : "Disburse Loan"}
                </Text>
                <Text size="xs" c="brand.1" className="leading-tight truncate">
                  {editId ? `Disbursement · ${editId}` : "Process a disbursement payout against a sanctioned loan account."}
                </Text>
              </div>
            </Group>
            <Group gap="xs" className="shrink-0" wrap="nowrap">
              {isView && (
                <Badge variant="light" color="gray" radius="sm" size="sm">
                  View Only
                </Badge>
              )}
              <Button
                variant="subtle"
                size="xs"
                px={8}
                onClick={() => onMinimize?.()}
                aria-label="Minimize"
                style={{ color: "var(--mantine-color-white)" }}
                styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg as string } } }}
              >
                <IconMinus size={18} />
              </Button>
              <Button
                variant="subtle"
                size="xs"
                px={8}
                onClick={onClose}
                aria-label="Close"
                style={{ color: "var(--mantine-color-white)" }}
                styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg as string } } }}
              >
                <IconX size={18} />
              </Button>
            </Group>
          </Box>

          {/* Body: main form + summary sidebar */}
          <div className="flex overflow-hidden" style={{ height: "70vh", maxHeight: 680, minHeight: 500 }}>
            {/* Main form column */}
            <div className="flex-1 overflow-y-auto p-4">
              <fieldset disabled={isView} className="border-0 p-0 m-0">
                <div className="flex flex-wrap items-start gap-4 mb-4">
                  <Select
                    size="sm"
                    withAsterisk
                    searchable
                    maw={280}
                    clearable={!!form.values.acNo}
                    label="Loan Number"
                    placeholder={isLoanAppsLoading ? "Loading..." : "Search loan account"}
                    data={loanAppOptions}
                    disabled={isLoanAppsLoading}
                    leftSection={<IconSearch size={14} color="var(--mantine-color-slate-4)" />}
                    onClick={() => refetchLoanApps()}
                    {...form.getInputProps("acNo")}
                    onChange={(value) => {
                      form.setValues({
                        acNo: value ?? "",
                        valueDate: getTodayDate(),
                        disburseAmount: "",
                        modeOfPayment: null,
                        disbursementAc: null,
                        refDate: getTodayDate(),
                        refNo: "",
                        beneficiaryAcNo: "",
                        charges: [],
                        isTopup: false,
                        topupSanctionedCurrent: "",
                        topupSanctionedNew: "",
                        topupOutstandingCurrent: "",
                        topupOutstandingNew: "",
                        topupAmount: "",
                      });
                      setHasUserChangedLoanAccount(true);
                      setHasUserChangedMode(false);
                      setActiveTab("settlement");
                    }}
                  />
                  <DateInput
                    size="sm"
                    withAsterisk
                    maw={190}
                    label="Value Date"
                    valueFormat="DD-MMM-YYYY"
                    disabled={isView}
                    value={toDateValue(form.values.valueDate)}
                    onChange={(d) => form.setFieldValue("valueDate", d ? dayjs(d).format("YYYY-MM-DD") : "")}
                    error={form.errors.valueDate}
                    leftSection={<IconCalendar size={14} color="var(--mantine-color-success-6)" />}
                  />
                  <NumberInput
                    size="sm"
                    withAsterisk
                    maw={230}
                    label="Disbursement Amount"
                    hideControls
                    min={0}
                    placeholder="Enter amount"
                    {...form.getInputProps("disburseAmount")}
                    leftSection={<IconNotes size={14} color="var(--mantine-color-warning-5)" />}
                    thousandSeparator=","
                    disabled={isView || (canShowTopup && !form.values.isTopup)}
                  />
                  {canShowTopup && (
                    <Checkbox
                      mt={22}
                      label="Topup"
                      disabled={isView}
                      checked={form.values.isTopup}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        form.setFieldValue("isTopup", checked);
                        if (!checked && activeTab === "topup") {
                          setActiveTab("settlement");
                        }
                      }}
                    />
                  )}
                </div>
              </fieldset>

              <Tabs value={activeTab} onChange={setActiveTab} variant="default">
                <Tabs.List style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
                  <Tabs.Tab value="settlement">
                    Settlement
                  </Tabs.Tab>
                  <Tabs.Tab value="charges">
                    Charges
                  </Tabs.Tab>
                  {form.values.isTopup && (
                    <Tabs.Tab value="topup">
                      Topup
                    </Tabs.Tab>
                  )}
                </Tabs.List>

                <Tabs.Panel value="settlement" pt="md">
                  <div className="flex flex-wrap items-start justify-between">
                    {/* Pay From */}
                    <div className="shrink-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-1 h-4 rounded" style={{ background: theme.other.brandGradient as string }} />
                        <Text size="sm" fw={700} c="slate.8">
                          Pay From
                        </Text>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        <Select
                          size="sm"
                          withAsterisk
                          maw={200}
                          label="Mode of Payment"
                          placeholder={isModeOfPaymentsLoading ? "Loading..." : "Select mode of payment"}
                          data={modeOfPaymentOptions}
                          disabled={isView || isModeOfPaymentsLoading}
                          {...form.getInputProps("modeOfPayment")}
                          onChange={(value) => {
                            form.setFieldValue("modeOfPayment", value);
                            setHasUserChangedMode(true);
                          }}
                          leftSection={<IconCreditCard size={14} color="var(--mantine-color-brand-5)" />}
                          rightSection={chevronDown}
                        />
                        <TextInput
                          size="sm"
                          maw={280}
                          label="Disbursement A/c"
                          disabled={isView}
                          readOnly
                          placeholder="Disbursement Account"
                          {...form.getInputProps("disbursementAc")}
                          leftSection={<IconHome size={14} color="var(--mantine-color-brand-5)" />}
                        />
                      </div>
                    </div>

                    {/* Pay To */}
                    <div className="shrink-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-1 h-4 rounded" style={{ background: theme.other.brandGradient as string }} />
                        <Text size="sm" fw={700} c="slate.8">
                          Pay To
                        </Text>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        <DateInput
                          size="sm"
                          withAsterisk
                          maw={180}
                          label="Ref Date"
                          valueFormat="DD-MMM-YYYY"
                          disabled={isView}
                          value={toDateValue(form.values.refDate)}
                          onChange={(d) => form.setFieldValue("refDate", d ? dayjs(d).format("YYYY-MM-DD") : "")}
                          error={form.errors.refDate}
                          leftSection={<IconCalendar size={14} color="var(--mantine-color-success-6)" />}
                        />
                        <TextInput
                          size="sm"
                          withAsterisk
                          maw={230}
                          label="Ref No"
                          disabled={isView}
                          placeholder="e.g. DSB-2026-000452"
                          {...form.getInputProps("refNo")}
                          leftSection={<IconCalendar size={14} color="var(--mantine-color-warning-5)" />}
                        />
                        {/* <Select
                        size="sm"
                        withAsterisk
                        searchable
                        clearable
                        label="A/c No"
                        placeholder={isBeneficiaryAccountsLoading ? "Loading..." : "Beneficiary account number"}
                        data={beneficiaryAccountOptions}
                        searchValue={beneficiaryAcSearch}
                        onSearchChange={setBeneficiaryAcSearch}
                       disabled={isView || isBeneficiaryAccountsLoading}
                         {...form.getInputProps("beneficiaryAcNo")}
                        leftSection={<IconHome size={14} className="text-indigo-500" />}
                        rightSection={chevronDown}
                        classNames={labelClass}
                      /> */}
                        <TextInput
                          size="sm"
                          maw={340}
                          // withAsterisk
                          label="A/c No"
                          placeholder="Account number"
                          disabled={isView}
                          leftSection={<IconHome size={14} color="var(--mantine-color-brand-5)" />}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                      <Textarea
                        size="sm"
                        label="Comment"
                        placeholder="Add a comment or description..."
                        minRows={2}
                        maxRows={4}
                        autosize
                        disabled={isView}
                        variant={isView ? 'filled' : 'default'}
                        leftSection={<IconNotes size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
                        leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '10px' } }}
                        {...form.getInputProps("comment")}
                      />
                    </div>
                </Tabs.Panel>

                <Tabs.Panel value="charges" pt="md">
                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-md"
                      style={{
                        backgroundColor: "var(--mantine-color-brand-0)",
                        color: "var(--mantine-color-brand-7)",
                      }}
                    >
                      <IconLock size={13} />
                      Charges are loaded from the selected loan account and can be reviewed or adjusted here.
                    </div>

                    {loanAccountDetailsError && (
                      <Text size="sm" c="red" fw={500}>
                        Unable to load loan charges for the selected account. Please try again.
                      </Text>
                    )}

                    {isLoanAccountChargesLoading ? (
                      <div
                        className="flex items-center justify-center gap-2 border border-dashed rounded-md py-8 text-sm"
                        style={{ borderColor: "var(--mantine-color-slate-3)", color: "var(--mantine-color-slate-5)" }}
                      >
                        <Loader size="sm" />
                        Loading loan charges...
                      </div>
                    ) : form.values.charges.length === 0 ? (
                      <div
                        className="border border-dashed rounded-md py-10 text-center text-sm"
                        style={{
                          borderColor: "var(--mantine-color-slate-3)",
                          color: "var(--mantine-color-slate-5)",
                          background: "var(--mantine-color-slate-0)",
                        }}
                      >
                        No charges added yet.
                      </div>
                    ) : (
                      <div
                        className="rounded-md overflow-hidden"
                        style={{ border: "1px solid var(--mantine-color-slate-2)" }}
                      >
                        <Table size="sm" verticalSpacing="sm" horizontalSpacing="sm" className="w-full">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th className="w-1/3">Charge</Table.Th>
                              <Table.Th className="w-1/4">Amount</Table.Th>
                              <Table.Th className="w-1/3">Treatment of Charge</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {form.values.charges.map((charge, index) => (
                              <Table.Tr key={charge.id} className="align-top">
                                <Table.Td>
                                  <TextInput
                                    size="xs"
                                    value={charge.name}
                                    disabled
                                    readOnly
                                    placeholder="Charge"
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <TextInput
                                    size="xs"
                                    placeholder="Amount"
                                    type="number"
                                    min={0}
                                    value={charge.amount}
                                    disabled={isView}
                                    onChange={(event) => handleChargeUpdate(index, "amount", event.currentTarget.value)}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <Select
                                    size="xs"
                                    data={CHARGE_TREATMENT_OPTIONS}
                                    value={charge.treatment_of_charge || "Billed Separately"}
                                    disabled={isView}
                                    onChange={(value) =>
                                      handleChargeUpdate(index, "treatment_of_charge", value || "Billed Separately")
                                    }
                                    styles={{ input: { minWidth: 170 } }}
                                  />
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                </Tabs.Panel>

                {form.values.isTopup && (
                  <Tabs.Panel value="topup" pt="md">
                    <div className="space-y-1">
                      <div
                        className="rounded-md overflow-hidden"
                        style={{ border: "1px solid var(--mantine-color-slate-2)" }}
                      >
                        <Table size="sm" verticalSpacing="sm" horizontalSpacing="sm" className="w-full">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th className="w-1/3"></Table.Th>
                              <Table.Th className="w-1/3" style={{ textAlign: "center" }}>Current</Table.Th>
                              <Table.Th className="w-1/3" style={{ textAlign: "center" }}>New</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            <Table.Tr>
                              <Table.Td>
                                <Text size="xs" fw={600} c="slate.7">
                                  Sanctioned Amount
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled
                                  {...form.getInputProps("topupSanctionedCurrent")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled={isView}
                                  value={form.values.topupSanctionedNew}
                                  onChange={(value) => {
                                    const newSanctionedVal = Number(value || 0);
                                    form.setFieldValue("topupSanctionedNew", value as number | "");
                                    const currentSanctioned = Number(form.values.topupSanctionedCurrent || 0);
                                    const currentOutstanding = Number(form.values.topupOutstandingCurrent || 0);
                                    const topupVal = newSanctionedVal - currentSanctioned;
                                    form.setFieldValue("topupAmount", topupVal);
                                    form.setFieldValue("topupOutstandingNew", currentOutstanding + topupVal);
                                    form.setFieldValue("disburseAmount", currentOutstanding + topupVal);
                                  }}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td>
                                <Text size="xs" fw={600} c="slate.7">
                                  Outstanding Amount
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled
                                  {...form.getInputProps("topupOutstandingCurrent")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled
                                  {...form.getInputProps("topupOutstandingNew")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>
                      </div>

                      <Group gap="xs" wrap="nowrap" align="center" mt={4} px="sm" justify="flex-end">
                        <Text size="xs" fw={600} c="slate.7">
                          Topup
                        </Text>
                        <div style={{ width: "225px" }}>
                          <NumberInput
                            size="xs"
                            hideControls
                            min={0}
                            disabled={isView}
                            value={form.values.topupAmount}
                            onChange={(value) => {
                              const topupVal = Number(value || 0);
                              form.setFieldValue("topupAmount", value as number | "");
                              const currentSanctioned = Number(form.values.topupSanctionedCurrent || 0);
                              const currentOutstanding = Number(form.values.topupOutstandingCurrent || 0);
                              form.setFieldValue("topupSanctionedNew", currentSanctioned + topupVal);
                              form.setFieldValue("topupOutstandingNew", currentOutstanding + topupVal);
                              form.setFieldValue("disburseAmount", currentOutstanding + topupVal);
                            }}
                            thousandSeparator=","
                          />
                        </div>

                      </Group>
                    </div>
                  </Tabs.Panel>
                )}
              </Tabs>
            </div>

            {/* Summary sidebar — styled after the Loan Booking summary sidebar */}
            <div
              className="w-[280px] shrink-0 overflow-y-auto p-4"
              style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
            >
              <Text size="sm" fw={700} c="slate.7" tt="uppercase" style={{ letterSpacing: "0.05em" }} mb="sm">
                Summary
              </Text>

              <Stack gap="sm">
                <SummaryCard>
                  <Stack gap={2}>
                    <SummaryRow
                      label="Customer Name"
                      value={selectedLoanApp ? (selectedLoanApp.applicant_name || selectedLoanApp.applicant) : "—"}
                    />
                    <SummaryRow label="Currency" value={companyCurrency || "—"} />
                    <SummaryRow
                      label="Sanctioned Amount"
                      value={selectedLoanApp ? formatAmount(companyCurrency, selectedLoanApp.loan_amount, { withSymbol: true }) : formatAmount(companyCurrency, 0, { withSymbol: true })}
                      bold
                    />
                    <SummaryRow
                      label="Disbursement till Date"
                      value={formatAmount(companyCurrency, selectedLoanDisbursedAmount, { withSymbol: true })}
                      bold
                    />
                    <SummaryRow
                      label="Repayment Start Date"
                      value={formatDate(selectedLoanApp?.repayment_start_date)}
                      bold
                    />
                  </Stack>
                </SummaryCard>

                <SummaryCard>
                  <Group justify="space-between" wrap="nowrap" py={2}>
                    <Text size="xs" c="slate.5">
                      Mode of Disbursement
                    </Text>
                    {form.values.modeOfPayment ? (
                      <Badge size="sm" variant="light" color="brand" styles={{ root: { fontSize: 10 } }}>
                        {form.values.modeOfPayment}
                      </Badge>
                    ) : (
                      <Text size="xs" fw={700} c="slate.8">
                        —
                      </Text>
                    )}
                  </Group>
                </SummaryCard>
              </Stack>
            </div>
          </div>

          {/* Footer — shared ModalFooter, matching Loan Booking modal */}
          <Box style={{ flexShrink: 0 }}>
            <ModalFooter
              variant="theme"
              isViewMode={isView}
              onClose={onClose}
              submitLabel={editId ? "Update" : "Save"}
              submitLoading={isPending}
              errorMessage={footerErrorMessage}
            />
          </Box>
        </Box>
      </form>
    </Modal>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap" py={5}>
      <Text size="xs" c="slate.5">
        {label}
      </Text>
      {typeof value === "string" ? (
        <Text size="xs" fw={bold ? 700 : 600} c="slate.8" ta="right">
          {value}
        </Text>
      ) : (
        value
      )}
    </Group>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--mantine-color-slate-1)",
        border: "1px solid var(--mantine-color-slate-2)",
        borderRadius: "var(--mantine-radius-lg)",
        padding: "10px 12px",
      }}
    >
      {children}
    </div>
  );
}
