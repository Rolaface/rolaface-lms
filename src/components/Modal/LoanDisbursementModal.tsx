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
} from "@mantine/core";
import {
  IconX,
  IconSearch,
  IconCalendar,
  IconChevronDown,
  IconCreditCard,
  IconHome,
  IconLock,
  IconNote,
  IconArrowRight,
  IconNotes,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLoanDisbursement, getAllDsbrAccount, updateLoanDisbursement, getLoanDisbursementById } from "../../api/loanDisbursementAPi";
import { getAllApplicationDsbr, getLoanById } from "../../api/loanApi";
import type { LoanDisbursementPayload, } from "../../types/loanDisbursementForm";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { getSymbol } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { openCommonModal } from "./AlertModal";
import { ModalFooter } from "../shared/ModalFooter";

interface LoanDisbursementModalProps {
  opened: boolean;
  onClose: () => void;
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
  topupDisbursedCurrent: number | "";
  topupDisbursedNew: number | "";
  topupOutstandingCurrent: number | "";
  topupOutstandingNew: number | "";
}

const PAYMENT_MODES = ["Bank Draft", "Cash", "Cheque", "Credit Card", "Wire Transfer"];
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

const chevronDown = <IconChevronDown size={14} color="var(--mantine-color-slate-4)" />;

// function formatCurrency(amount: number) {
//   return `₹${amount.toLocaleString("en-IN")}`;
// }

export function LoanDisbursementModal({
  opened,
  onClose,
  onSubmit: _onSubmit,
  editId,
  initialData,
  isView = false,
}: LoanDisbursementModalProps) {

  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencySymbol = getSymbol(companyCurrency);
  // console.log("Currency Symbol", currencySymbol);
  const [activeTab, setActiveTab] = useState<string | null>("settlement");

  const [dsbrAcSearch, setDsbrAcSearch] = useState("");

  const { data: dsbrAccountsResponse, isLoading: isDsbrAccountsLoading } = useQuery({
    queryKey: ["dsbrAccounts", dsbrAcSearch],
    queryFn: () => getAllDsbrAccount(dsbrAcSearch),
    enabled: opened,
  });

  const dsbrAccountOptions = useMemo(() => {
    const list = dsbrAccountsResponse?.data || dsbrAccountsResponse?.message || dsbrAccountsResponse || [];
    if (Array.isArray(list)) {
      return list.map((item: any) => ({
        value: item.value,
        label: item.label,
      }));
    }


    return [];
  }, [dsbrAccountsResponse]);
  const [beneficiaryAcSearch, setBeneficiaryAcSearch] = useState("");

  const { data: beneficiaryAccountsResponse, isLoading: isBeneficiaryAccountsLoading } = useQuery({
    queryKey: ["beneficiaryAccounts", beneficiaryAcSearch],
    queryFn: () => getAllDsbrAccount(beneficiaryAcSearch),
    enabled: opened,
  });

  const beneficiaryAccountOptions = useMemo(() => {
    const list = beneficiaryAccountsResponse?.data || beneficiaryAccountsResponse?.message || beneficiaryAccountsResponse || [];
    if (Array.isArray(list)) {
      return list.map((item: any) => item.value || item.name || item);
    }
    return [];
  }, [beneficiaryAccountsResponse]);

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
      topupDisbursedCurrent: "" as number | "",
      topupDisbursedNew: "" as number | "",
      topupOutstandingCurrent: "" as number | "",
      topupOutstandingNew: "" as number | "",
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

  // const createDisbursementMutation = useMutation({
  //   mutationFn: createLoanDisbursement,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["loanDisbursements"] });
  //     handleReset();
  //     onClose();
  //   },
  // });

  // const updateDisbursementMutation = useMutation({
  //   mutationFn: updateLoanDisbursement,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["loanDisbursements"] });
  //     handleReset();
  //     onClose();
  //   },
  // });
  const createDisbursementMutation = useMutation({
    mutationFn: createLoanDisbursement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanDisbursements"] });
      handleReset();
      onClose();
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
    const payload: Partial<LoanDisbursementPayload> & { loan_disbursement_charges?: Array<{ charge: string; amount: number; account: string; treatment_of_charge: string }> } = {
      against_loan: values.acNo,
      posting_date: values.valueDate,
      disbursement_date: values.valueDate,
      disbursed_amount: Number(values.disburseAmount),
      mode_of_payment: values.modeOfPayment as string,
      reference_number: values.refNo,
      reference_date: values.refDate,
      repayment_start_date: selectedLoanApp?.repayment_start_date || undefined,
      disbursement_account: values.disbursementAc || undefined,
      loan_account: selectedLoanApp?.loan_account || undefined,
      loan_disbursement_charges: values.charges.map((charge) => ({
        charge: charge.name,
        amount: Number(charge.amount || 0),
        account: charge.account,
        treatment_of_charge: charge.treatment_of_charge || "Billed Separately",
      })),
    };

    if (editId) {
      updateDisbursementMutation.mutate({ id: editId, payload });
    } else {
      createDisbursementMutation.mutate(payload as LoanDisbursementPayload);
    }
  };
  const [hasUserChangedLoanAccount, setHasUserChangedLoanAccount] = useState(false);
  useEffect(() => {
    if (opened && editId && initialData) {
      form.setValues({
        acNo: initialData.againstLoan || "",
        valueDate: normalizeDateValue(initialData.disbursementDate || getTodayDate()),
        disburseAmount: initialData.disbursedAmount || "",
        modeOfPayment: initialData.modeOfPayment || null,
        disbursementAc: initialData.disbursementAccount || null,
        refDate: normalizeDateValue(initialData.referenceDate || getTodayDate()),
        refNo: initialData.referenceNumber || "",
        beneficiaryAcNo: initialData.loanAccount || "",
      });
      setHasUserChangedLoanAccount(false);
    } else if (opened && !editId) {
      form.reset();
      form.setValues({ valueDate: getTodayDate(), refDate: getTodayDate() });
      setActiveTab("settlement");
      setHasUserChangedLoanAccount(false);
    }
  }, [opened, editId, initialData]);

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
  const isPending = createDisbursementMutation.isPending || updateDisbursementMutation.isPending || isEditLoading;

  useEffect(() => {
    if (opened && editId && editDetailsResponse) {
      const item = editDetailsResponse.message?.data || editDetailsResponse.data || editDetailsResponse.message || editDetailsResponse;

      form.setValues({
        acNo: item.against_loan || "",
        valueDate: normalizeDateValue(item.disbursement_date || item.posting_date || getTodayDate()),
        disburseAmount: item.disbursed_amount || "",
        modeOfPayment: item.mode_of_payment || null,
        disbursementAc: item.disbursement_account || null,
        refDate: normalizeDateValue(item.reference_date || getTodayDate()),
        refNo: item.reference_number || "",
        beneficiaryAcNo: item.loan_account || "",
      });
      const existingCharges = normalizeLoanCharges({ loan_charges: item.loan_disbursement_charges });
      form.setFieldValue("charges", existingCharges);
      setHasUserChangedLoanAccount(false);
    } else if (opened && !editId) {
      form.reset();
      form.setValues({
        valueDate: getTodayDate(),
        refDate: getTodayDate(),
      });
      setActiveTab("settlement");
      setHasUserChangedLoanAccount(false);

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editDetailsResponse]);

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

  useEffect(() => {
    if (!opened || !form.values.acNo) {
      form.setFieldValue("charges", []);
      return;
    }
    if (editId && !hasUserChangedLoanAccount) return;
    if (isLoanAccountChargesLoading) return;

    const chargeDefaults = normalizeLoanCharges(loanAccountDetailsData);
    form.setFieldValue("charges", chargeDefaults);
  }, [opened, form.values.acNo, loanAccountDetailsData, isLoanAccountChargesLoading]);

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
                onClick={onClose}
                style={{ color: "var(--mantine-color-white)" }}
                styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg as string } } }}
              >
                <IconX size={18} />
              </Button>
            </Group>
          </Box>

          {/* Body: main form + summary sidebar */}
          <div className="flex overflow-hidden" style={{ height: 460 }}>
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
                      form.setFieldValue("acNo", value ?? "");
                      setHasUserChangedLoanAccount(true);
                    }}
                  />
                  <TextInput
                    size="sm"
                    withAsterisk
                    maw={190}
                    type="date"
                    label="Value Date"
                    {...form.getInputProps("valueDate")}
                    leftSection={<IconCalendar size={14} color="var(--mantine-color-success-6)" />}
                  />
                  <NumberInput
                    size="sm"
                    withAsterisk
                    maw={230}
                    label="Disburse Amount"
                    hideControls
                    min={0}
                    placeholder="Enter amount"
                    {...form.getInputProps("disburseAmount")}
                    leftSection={<IconNotes size={14} color="var(--mantine-color-warning-5)" />}
                    thousandSeparator=","
                  />
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
                          placeholder="Select mode of payment"
                          data={PAYMENT_MODES}
                          disabled={isView}
                          {...form.getInputProps("modeOfPayment")}
                          leftSection={<IconCreditCard size={14} color="var(--mantine-color-brand-5)" />}
                          rightSection={chevronDown}
                        />
                        {editId ? (
                          <TextInput
                            size="sm"
                            maw={280}
                            // withAsterisk
                            label="Disbursement A/c"
                            disabled={isView}
                            {...form.getInputProps("disbursementAc")}
                            leftSection={<IconHome size={14} color="var(--mantine-color-brand-5)" />}
                          />
                        ) : (
                          <Select
                            size="sm"
                            maw={280}
                            // withAsterisk
                            searchable
                            clearable
                            label="Disbursement A/c"
                            placeholder={isDsbrAccountsLoading ? "Loading..." : "Select disburse account"}
                            data={dsbrAccountOptions}
                            searchValue={dsbrAcSearch}
                            onSearchChange={setDsbrAcSearch}
                            disabled={isView || isDsbrAccountsLoading}
                            {...form.getInputProps("disbursementAc")}
                            leftSection={<IconHome size={14} color="var(--mantine-color-brand-5)" />}
                            rightSection={chevronDown}
                          />
                        )}
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
                        <TextInput
                          size="sm"
                          withAsterisk
                          maw={180}
                          type="date"
                          label="Ref Date"
                          disabled={isView}
                          {...form.getInputProps("refDate")}
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
                          {...form.getInputProps("beneficiaryAcNo")}
                          leftSection={<IconHome size={14} color="var(--mantine-color-brand-5)" />}
                        />
                      </div>
                    </div>
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
                    <div className="space-y-3">
                      <div
                        className="rounded-md overflow-hidden"
                        style={{ border: "1px solid var(--mantine-color-slate-2)" }}
                      >
                        <Table size="sm" verticalSpacing="sm" horizontalSpacing="sm" className="w-full">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th className="w-1/3"></Table.Th>
                              <Table.Th className="w-1/3">Current</Table.Th>
                              <Table.Th className="w-1/3">New</Table.Th>
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
                                  disabled={isView}
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
                                  {...form.getInputProps("topupSanctionedNew")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                              <Table.Td>
                                <Text size="xs" fw={600} c="slate.7">
                                  Disbursed Amount
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled={isView}
                                  {...form.getInputProps("topupDisbursedCurrent")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled={isView}
                                  {...form.getInputProps("topupDisbursedNew")}
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
                                  disabled={isView}
                                  {...form.getInputProps("topupOutstandingCurrent")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  size="xs"
                                  hideControls
                                  min={0}
                                  disabled={isView}
                                  {...form.getInputProps("topupOutstandingNew")}
                                  thousandSeparator=","
                                />
                              </Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>
                      </div>
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
                      value={selectedLoanApp ? `${currencySymbol}${selectedLoanApp.loan_amount}` : `${currencySymbol}0`}
                      bold
                    />
                    <SummaryRow
                      label="Disbursement till Date"
                      value={
                        selectedLoanApp
                          ? `${currencySymbol}${selectedLoanApp.current_disbursed_amount || 0}`
                          : `${currencySymbol}0`
                      }
                      bold
                    />
                    <SummaryRow
                      label="Repayment Start Date"
                      value={selectedLoanApp?.repayment_start_date || "—"}
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
              submitIcon={<IconArrowRight size={16} />}
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