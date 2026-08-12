// LoanDisbursementModal.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
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
} from "@mantine/core";
import {
  IconX,
  IconSearch,
  IconCalendar,
  IconCurrencyRupee,
  IconChevronDown,
  IconCreditCard,
  IconHome,
  IconLock,
  IconUser,
  IconNote,
  IconClock,
  IconArrowRight,
  IconRefresh,
  IconNotes,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLoanDisbursement, getAllDsbrAccount, updateLoanDisbursement, getLoanDisbursementById} from "../../api/loanDisbursementAPi"; 
import {getAllApplicationDsbr} from "../../api/loanApi";
import type { LoanDisbursementPayload, } from "../../types/loanDisbursementForm";
import { parseFrappeError } from "../../utils/parseFrappeError";
import {getSymbol} from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { openCommonModal } from "./AlertModal";

interface LoanDisbursementModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanDisbursementFormData) => void;
  editId?: string | null; 
  initialData?: any;
  isView?: boolean;
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
}

interface ChargeRow {
  label: string;
  amount: number;
}

const CHARGES: ChargeRow[] = [
  { label: "Processing Fee", amount: 5000 },
  { label: "Documentation Charges", amount: 750 },
  { label: "Insurance Premium", amount: 2500 },
  { label: "GST (18%)", amount: 1485 },
];

const TOTAL_CHARGES = CHARGES.reduce((sum, c) => sum + c.amount, 0);

const PAYMENT_MODES = ["Bank Draft", "Cash", "Cheque", "Credit Card", "Wire Transfer"];

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

// function formatCurrency(amount: number) {
//   return `₹${amount.toLocaleString("en-IN")}`;
// }

export function LoanDisbursementModal({
  opened,
  onClose,
  onSubmit,
  editId,     
  initialData,
  isView = false,
}: LoanDisbursementModalProps) {

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

  const form = useForm({
    initialValues: {
      acNo: "",
      valueDate: "",
      disburseAmount: "" as number | "",
      modeOfPayment: null as string | null,
      disbursementAc: null as string | null,
      refDate: "",
      refNo: "",
      beneficiaryAcNo: "",
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
      const errorMessage = parseFrappeError(error);

      modals.open({
        title: <Text fw={600} c="red">Action Failed</Text>,
        children: (
          <div>
            <Text size="sm" mb="lg">
              {errorMessage}
            </Text>
            <Group justify="flex-end">
              <Button onClick={() => modals.closeAll()} variant="default">
                Close
              </Button>
            </Group>
          </div>
        ),
      });
    },
  });

 const handleReset = () => {
    form.reset();
    setActiveTab("settlement");
  };

const handleSubmit = (values: typeof form.values) => {
    const payload: Partial<LoanDisbursementPayload> = {
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
    };

    if (editId) {
      updateDisbursementMutation.mutate({ id: editId, payload });
    } else {
      createDisbursementMutation.mutate(payload as LoanDisbursementPayload);
    }
  };

  useEffect(() => {
    if (opened && editId && initialData) {
      form.setValues({
        acNo: initialData.againstLoan || "",
        valueDate: initialData.disbursementDate || "",
        disburseAmount: initialData.disbursedAmount || "",
        modeOfPayment: initialData.modeOfPayment || null,
        disbursementAc: initialData.disbursementAccount || null, 
        refDate: initialData.referenceDate || "",
        refNo: initialData.referenceNumber || "",
        beneficiaryAcNo: initialData.loanAccount || "",   
      });
    } else if (opened && !editId) {
      form.reset();
      setActiveTab("settlement");
    }
  }, [opened, editId, initialData]);

  const { data: loanAppsResponse, isLoading: isLoanAppsLoading, refetch: refetchLoanApps} = useQuery({
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
        valueDate: item.disbursement_date || item.posting_date || "",
        disburseAmount: item.disbursed_amount || "",
        modeOfPayment: item.mode_of_payment || null,
        disbursementAc: item.disbursement_account || null, 
        refDate: item.reference_date || "",
        refNo: item.reference_number || "",
        beneficiaryAcNo: item.loan_account || "",
      });
    } else if (opened && !editId) {
      form.reset();
      setActiveTab("settlement");
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

useEffect(() => {
    if (!editId) {
      form.setFieldValue("beneficiaryAcNo", selectedLoanApp?.loan_account || "");
    }
   }, [form.values.acNo, selectedLoanApp]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="1300px"
      withCloseButton={false}
      padding={0}
      radius="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconNote size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                Disburse Loan
              </Text>
              <Text size="xs" c="dimmed">
                Process a disbursement payout against a sanctioned loan account.
              </Text>
            </div>
          </div>
          <ActionCloseButton onClose={onClose} />
        </div>

        <div className="border-b border-gray-200" />

        {/* Body: main form + summary sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main form column */}
          <div className="flex-1 overflow-y-auto p-6">
            <fieldset disabled={isView} className="border-0 p-0 m-0">
            <div className="grid grid-cols-3 gap-4 mb-5">
           <Select
  size="sm"
  withAsterisk
  searchable
  clearable={!!form.values.acNo}  
  label="Loan Number"
  placeholder={isLoanAppsLoading ? "Loading..." : "Search loan account"}
  data={loanAppOptions}
  disabled={isLoanAppsLoading}
  leftSection={<IconSearch size={14} className="text-gray-400" />}
  onClick={() => refetchLoanApps()}
  {...form.getInputProps("acNo")}
/>
             <TextInput
                size="sm"
                withAsterisk
                type="date"
                label="Value Date"
                 {...form.getInputProps("valueDate")}
                leftSection={<IconCalendar size={14} className="text-emerald-600" />}
                classNames={labelClass}
              />
              <NumberInput
                size="sm"
                withAsterisk
                label="Disburse Amount"
                 hideControls
                 min={0}
                placeholder="Enter amount"
                 {...form.getInputProps("disburseAmount")}
                leftSection={<IconNotes size={14} className="text-orange-500" />}
                thousandSeparator=","
                classNames={labelClass}
              />
            </div>
            </fieldset>

            <Tabs value={activeTab} onChange={setActiveTab} variant="default">
              <Tabs.List className="border-b border-gray-200">
                <Tabs.Tab value="settlement" className="font-medium text-sm">
                  Settlement
                </Tabs.Tab>
                <Tabs.Tab
                  value="charges"
                  className="font-medium text-sm"
                  rightSection={
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 font-normal">
                      <IconLock size={10} /> Auto
                    </span>
                  }
                >
                  Charges
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="settlement" pt="lg">
                <div className="grid grid-cols-2 gap-x-8">
                  {/* Pay From */}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-1 h-4 rounded bg-gradient-to-b from-[#7C3AED] to-[#4F46E5]" />
                      <Text size="sm" fw={700} className="text-gray-900">
                        Pay From
                      </Text>
                    </div>
                    <div className="flex flex-col gap-4 mt-4">
                     <Select
                        size="sm"
                        withAsterisk
                        label="Mode of Payment"
                        placeholder="Select mode of payment"
                        data={PAYMENT_MODES}
                        disabled={isView}
                         {...form.getInputProps("modeOfPayment")}
                        leftSection={<IconCreditCard size={14} className="text-indigo-500" />}
                        rightSection={chevronDown}
                        classNames={labelClass}
                      />
                    {editId ? (
  <TextInput
    size="sm"
    // withAsterisk
    label="Disbursement A/c"
    disabled={isView}
    {...form.getInputProps("disbursementAc")}
    leftSection={<IconHome size={14} className="text-indigo-500" />}
    classNames={labelClass}
  />
) : (
  <Select
    size="sm"
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
    leftSection={<IconHome size={14} className="text-indigo-500" />}
    rightSection={chevronDown}
    classNames={labelClass}
  />
)}
                    </div>
                  </div>

                  {/* Pay To */}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-1 h-4 rounded bg-gradient-to-b from-[#7C3AED] to-[#4F46E5]" />
                      <Text size="sm" fw={700} className="text-gray-900">
                        Pay To
                      </Text>
                    </div>
                    <div className="flex flex-col gap-4 mt-4">
                      <TextInput
                        size="sm"
                        withAsterisk
                        type="date"
                        label="Ref Date"
                        disabled={isView}
                         {...form.getInputProps("refDate")}
                        leftSection={<IconCalendar size={14} className="text-emerald-600" />}
                        classNames={labelClass}
                      />
                      <TextInput
                        size="sm"
                        withAsterisk
                        label="Ref No"
                        disabled={isView}
                        placeholder="e.g. DSB-2026-000452"
                         {...form.getInputProps("refNo")}
                        leftSection={<IconCalendar size={14} className="text-orange-500" />}
                        classNames={labelClass}
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
  // withAsterisk
  label="A/c No"
  placeholder="Account number"
  disabled ={isView}
  {...form.getInputProps("beneficiaryAcNo")}
  leftSection={<IconHome size={14} className="text-indigo-500" />}
  classNames={labelClass}
/>
                    </div>
                  </div>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="charges" pt="lg">
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs px-3 py-2 rounded-md mb-4">
                  <IconLock size={13} />
                  These charges are fetched automatically from the loan account and can't be
                  edited here.
                </div>

                <div className="border border-gray-200 rounded-md overflow-hidden max-w-md">
                  {CHARGES.map((c, idx) => (
                    <div
                      key={c.label}
                      className={`flex justify-between px-4 py-3 text-sm text-gray-700 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                      } border-b border-gray-100`}
                    >
                      <span>{c.label}</span>
                      <span className="font-mono">
                        {c.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 text-sm font-bold text-gray-900 bg-indigo-50/60">
                    <span>Total Charges</span>
                    <span className="font-mono text-indigo-700">
                      ₹
                      {TOTAL_CHARGES.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </Tabs.Panel>
            </Tabs>
          </div>

         {/* Summary sidebar */}
          <div className="w-[280px] border-l border-gray-200 p-5 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-0.5">
              {/* <div className="w-1 h-4 rounded bg-gradient-to-b from-[#7C3AED] to-[#4F46E5]" /> */}
              {/* <Text size="sm" fw={700} className="text-gray-900">
                Summary
              </Text> */}
            </div>
            <div className="flex flex-col gap-3">
              <SummaryItem
                icon={<IconUser size={14} className="text-gray-500" />}
                iconBg="#F3F4F6"
                label="Customer Name"
                value={selectedLoanApp ? (selectedLoanApp.applicant_name || selectedLoanApp.applicant) : "—"}
              />
              <SummaryItem
                icon={<IconNote size={14} className="text-indigo-500" />}
                iconBg="#EEF2FF"
                label="Currency"
                value={companyCurrency}
              />
              <SummaryItem
                icon={<IconNote size={14} className="text-emerald-600" />}
                iconBg="#ECFDF5"
                label="Sanctioned Amount"
                value={
  selectedLoanApp
    ? `${currencySymbol}${selectedLoanApp.loan_amount}`
    : `${currencySymbol}0`
}
                bold
              />
            <SummaryItem
  icon={<IconClock size={14} className="text-orange-500" />}
  iconBg="#FFF7ED"
  label="Disbursement till Date"
  value={
    selectedLoanApp
      ? `${currencySymbol}${selectedLoanApp.current_disbursed_amount || 0}`
      : `${currencySymbol}0`
  }
  bold
/>
<SummaryItem
  icon={<IconCalendar size={14} className="text-emerald-600" />}
  iconBg="#ECFDF5"
  label="Repayment Start Date"
  value={selectedLoanApp?.repayment_start_date || "—"} 
  bold
/>
             <SummaryItem
  icon={<IconCreditCard size={14} className="text-indigo-500" />}
  iconBg="#EEF2FF"
  label="Mode of Disbursement"
  value={
    form.values.modeOfPayment ? (
      <Badge
        size="sm"
        variant="light"
        color="orange"
        className="font-semibold"
        styles={{ root: { fontSize: 10 } }}
      >
        {form.values.modeOfPayment}
      </Badge>
    ) : (
      <div className="w-4 h-4 rounded-full bg-orange-100" />
    )
  }
/>
            </div>
          </div>
        </div>

     {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0">
          
          <Button variant="default" size="sm" onClick={onClose} className="font-semibold">
            {isView ? "Close" : "Cancel"} {/* <-- Update text dynamically */}
          </Button>

          {/* Wrap the action buttons so they only show if it's NOT view mode */}
          {!isView && (
            <div className="flex gap-2">
              
              {/* Show API Error if any */}
              {(createDisbursementMutation.isError || updateDisbursementMutation.isError) && (
                <Text size="xs" c="red" className="mr-2 self-center">
                  Failed to {editId ? "update" : "create"} disbursement.
                </Text>
              )}

              <Button
                size="sm"
                variant="subtle"
                color="red"
                leftSection={<IconRefresh size={14} />}
                onClick={handleReset}
                disabled={isPending}
                className="font-semibold px-4"
              >
                Reset
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={isPending}
                rightSection={!isPending ? <IconArrowRight size={16} /> : null}
                className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
              >
                {editId ? "Update" : "Submit"}
              </Button>
            </div>
          )}
        </div>
      </Box>
      </form>
    </Modal>
  );
}

function ActionCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Button variant="subtle" color="gray" onClick={onClose} className="px-2" size="xs">
      <IconX size={18} />
    </Button>
  );
}

function SummaryItem({
  icon,
  iconBg,
  label,
  value,
  bold,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50/60 border border-gray-100 rounded-md p-3">
      <div
        className="p-1.5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        {typeof value === "string" ? (
          <Text size="sm" fw={bold ? 700 : 600} className="text-gray-900">
            {value}
          </Text>
        ) : (
          value
        )}
      </div>
    </div>
  );
}