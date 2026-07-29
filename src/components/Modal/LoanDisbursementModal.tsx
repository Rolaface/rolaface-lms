// LoanDisbursementModal.tsx
import { useMemo, useState } from "react";
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
  IconCurrencyDollar,
  IconClock,
  IconArrowRight,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLoanDisbursement, getAllLoanApplicationNumber } from "../../api/loanDisbursementAPi"; 
import type { LoanDisbursementPayload, } from "../../types/loanDisbursementForm";

interface LoanDisbursementModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanDisbursementFormData) => void;
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

// Static account/summary data — wire up to real account lookup as needed.
const ACCOUNT_SUMMARY = {
  customerName: "Rohan Mehta",
  currency: "INR",
  sanctionedAmount: 800000,
  disbursementTillDate: 313750,
  modeOfDisbursement: "Manual",
};

const PAYMENT_MODES = ["Bank Transfer", "Cash", "Cheque", "UPI"];
const DISBURSE_ACCOUNTS = ["Primary Account", "Operating Account", "Escrow Account"];

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function LoanDisbursementModal({
  opened,
  onClose,
  onSubmit,
}: LoanDisbursementModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("settlement");

  const [acNo, setAcNo] = useState("");
  const [valueDate, setValueDate] = useState("");
  const [disburseAmount, setDisburseAmount] = useState<number | "">("");

  const [modeOfPayment, setModeOfPayment] = useState<string | null>(null);
  const [disbursementAc, setDisbursementAc] = useState<string | null>(null);

  const [refDate, setRefDate] = useState("");
  const [refNo, setRefNo] = useState("");
  const [beneficiaryAcNo, setBeneficiaryAcNo] = useState("");

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
      disbursementAc: (v) => (!v ? "Disbursement Account is required" : null),
      refDate: (v) => (!v ? "Ref Date is required" : null),
      refNo: (v) => (!v ? "Ref No is required" : null),
      beneficiaryAcNo: (v) => (!v ? "Beneficiary A/c No is required" : null),
    },
  });

  const queryClient = useQueryClient();

  const createDisbursementMutation = useMutation({
    mutationFn: createLoanDisbursement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanDisbursements"] });
      handleReset();
      onClose();
    },
  });

 const handleReset = () => {
    form.reset();
    setActiveTab("settlement");
  };

  const handleSubmit = (values: typeof form.values) => {
    const payload: LoanDisbursementPayload = {
      against_loan: values.acNo,
      posting_date: values.valueDate,
      disbursement_date: values.valueDate,
      disbursed_amount: Number(values.disburseAmount),
      mode_of_payment: values.modeOfPayment as string,
      reference_number: values.refNo,
      reference_date: values.refDate,
      repayment_start_date: values.valueDate, 
      disbursement_account: values.disbursementAc || undefined,
    };

    createDisbursementMutation.mutate(payload);
  };

  const { data: loanAppsResponse, isLoading: isLoanAppsLoading } = useQuery({
    queryKey: ["loanApplications"],
    queryFn: getAllLoanApplicationNumber,
  });

  // Extract the "name" property from the response array to pass to the dropdown
  const loanAppOptions = useMemo(() => {
    if (loanAppsResponse?.data) {
      return loanAppsResponse.data.map((item: any) => item.name);
    }
    return [];
  }, [loanAppsResponse]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="1300px"
      withCloseButton={false}
      padding={0}
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
      <Box className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconCurrencyDollar size={20} className="text-white" />
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
            <div className="grid grid-cols-3 gap-4 mb-5">
             <Select
                size="sm"
                withAsterisk
                searchable
                clearable
                label="A/c No"
                placeholder={isLoanAppsLoading ? "Loading..." : "Search loan account"}
                data={loanAppOptions}
                disabled={isLoanAppsLoading}
                leftSection={<IconSearch size={14} className="text-gray-400" />}
                rightSection={chevronDown}
                classNames={labelClass}
                {...form.getInputProps("acNo")}
              />
              <TextInput
                size="sm"
                withAsterisk
                type="date"
                label="Value Date"
                value={valueDate}
                {...form.getInputProps("valueDate")}
                leftSection={<IconCalendar size={14} className="text-emerald-600" />}
                classNames={labelClass}
              />
              <NumberInput
                size="sm"
                withAsterisk
                label="Disburse Amount"
                placeholder="Enter amount"
                value={disburseAmount}
                {...form.getInputProps("disburseAmount")}
                leftSection={<IconCurrencyRupee size={14} className="text-orange-500" />}
                thousandSeparator=","
                classNames={labelClass}
              />
            </div>

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
                        value={modeOfPayment}
                        onChange={setModeOfPayment}
                        leftSection={<IconCreditCard size={14} className="text-indigo-500" />}
                        rightSection={chevronDown}
                        classNames={labelClass}
                      />
                      <Select
                        size="sm"
                        withAsterisk
                        label="Disbursement A/c"
                        placeholder="Select disburse account"
                        data={DISBURSE_ACCOUNTS}
                        value={disbursementAc}
                        onChange={setDisbursementAc}
                        leftSection={<IconHome size={14} className="text-indigo-500" />}
                        rightSection={chevronDown}
                        classNames={labelClass}
                      />
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
                        value={refDate}
                        onChange={(e) => setRefDate(e.currentTarget.value)}
                        leftSection={<IconCalendar size={14} className="text-emerald-600" />}
                        classNames={labelClass}
                      />
                      <TextInput
                        size="sm"
                        withAsterisk
                        label="Ref No"
                        placeholder="e.g. DSB-2026-000452"
                        value={refNo}
                        onChange={(e) => setRefNo(e.currentTarget.value)}
                        leftSection={<IconCalendar size={14} className="text-orange-500" />}
                        classNames={labelClass}
                      />
                      <TextInput
                        size="sm"
                        withAsterisk
                        label="A/c No"
                        placeholder="Beneficiary account number"
                        value={beneficiaryAcNo}
                        onChange={(e) => setBeneficiaryAcNo(e.currentTarget.value)}
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
              <div className="w-1 h-4 rounded bg-gradient-to-b from-[#7C3AED] to-[#4F46E5]" />
              <Text size="sm" fw={700} className="text-gray-900">
                Summary
              </Text>
            </div>
            <Text size="xs" c="dimmed" className="ml-3 mb-4">
              Live account status
            </Text>

            <div className="flex flex-col gap-3">
              <SummaryItem
                icon={<IconUser size={14} className="text-gray-500" />}
                iconBg="#F3F4F6"
                label="Customer Name"
                value={ACCOUNT_SUMMARY.customerName}
              />
              <SummaryItem
                icon={<IconCurrencyDollar size={14} className="text-indigo-500" />}
                iconBg="#EEF2FF"
                label="Currency"
                value={ACCOUNT_SUMMARY.currency}
              />
              <SummaryItem
                icon={<IconCurrencyDollar size={14} className="text-emerald-600" />}
                iconBg="#ECFDF5"
                label="Sanctioned Amount"
                value={formatCurrency(ACCOUNT_SUMMARY.sanctionedAmount)}
                bold
              />
              <SummaryItem
                icon={<IconClock size={14} className="text-orange-500" />}
                iconBg="#FFF7ED"
                label="Disbursement till Date"
                value={formatCurrency(ACCOUNT_SUMMARY.disbursementTillDate)}
                bold
              />
              <SummaryItem
                icon={<IconCreditCard size={14} className="text-indigo-500" />}
                iconBg="#EEF2FF"
                label="Mode of Disbursement"
                value={
                  <Badge
                    size="sm"
                    variant="light"
                    color="orange"
                    className="font-semibold"
                    styles={{ root: { fontSize: 10 } }}
                  >
                    {ACCOUNT_SUMMARY.modeOfDisbursement}
                  </Badge>
                }
              />
            </div>
          </div>
        </div>

       {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-end items-center shrink-0">
          <div className="flex gap-2">
            
            {/* Show API Error if any */}
            {createDisbursementMutation.isError && (
              <Text size="xs" c="red" className="mr-2 self-center">
                Failed to create disbursement.
              </Text>
            )}

            <Button
              size="sm"
              variant="subtle"
              color="red"
              leftSection={<IconRefresh size={14} />}
              onClick={handleReset}
              disabled={createDisbursementMutation.isPending}
              className="font-semibold px-4"
            >
              Reset
            </Button>
           <Button
              type="submit" // <--- Change this from onClick={handleSubmit} to type="submit"
              size="sm"
              loading={createDisbursementMutation.isPending}
              rightSection={!createDisbursementMutation.isPending ? <IconArrowRight size={16} /> : null}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              Submit Disbursement
            </Button>
          </div>
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