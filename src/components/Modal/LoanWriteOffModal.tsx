// LoanWriteOffModal.tsx
import { useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Badge,
} from "@mantine/core";
import {
  IconX,
  IconSearch,
  IconCalendar,
  IconCurrencyRupee,
  IconChevronDown,
  IconPercentage,
  IconBuildingBank,
  IconUser,
  IconAlertTriangle,
  IconTag,
  IconClock,
  IconFileInvoice,
  IconArrowRight,
  IconRefresh,
  IconFileOff,
} from "@tabler/icons-react";

interface LoanWriteOffModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanWriteOffFormData) => void;
}

export interface LoanWriteOffFormData {
  loanAc: string;
  valueDate: string;
  principalOutstanding: number | "";
  writeOffPercentage: number | "";
  writeOffAmount: number | "";
  writeOffAccount: string | null;
}

// Static account/summary data — wire up to real account lookup as needed.
const ACCOUNT_SUMMARY = {
  customerName: "Rohan Mehta",
  npa: true,
  classification: "Sub-Standard",
  dpd: 132,
  outstanding: 486250,
};

const WRITE_OFF_ACCOUNTS = ["Write-off Reserve A/c", "Bad Debt Provision A/c", "NPA Suspense A/c"];

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function LoanWriteOffModal({ opened, onClose, onSubmit }: LoanWriteOffModalProps) {
  const [loanAc, setLoanAc] = useState("");
  const [valueDate, setValueDate] = useState("");
  const [principalOutstanding, setPrincipalOutstanding] = useState<number | "">("");
  const [writeOffPercentage, setWriteOffPercentage] = useState<number | "">("");
  const [writeOffAmount, setWriteOffAmount] = useState<number | "">("");
  const [writeOffAccount, setWriteOffAccount] = useState<string | null>(null);

  const handlePercentageChange = (value: number | "") => {
    setWriteOffPercentage(value);
    if (value !== "" && principalOutstanding !== "") {
      const amount = (Number(principalOutstanding) * Number(value)) / 100;
      setWriteOffAmount(Math.round(amount * 100) / 100);
    } else {
      setWriteOffAmount("");
    }
  };

  const handleAmountChange = (value: number | "") => {
    setWriteOffAmount(value);
    if (value !== "" && principalOutstanding !== "" && Number(principalOutstanding) > 0) {
      const percentage = (Number(value) / Number(principalOutstanding)) * 100;
      setWriteOffPercentage(Math.round(percentage * 100) / 100);
    } else {
      setWriteOffPercentage("");
    }
  };

  const handleReset = () => {
    setLoanAc("");
    setValueDate("");
    setPrincipalOutstanding("");
    setWriteOffPercentage("");
    setWriteOffAmount("");
    setWriteOffAccount(null);
  };

  const handleSubmit = () => {
    onSubmit?.({
      loanAc,
      valueDate,
      principalOutstanding,
      writeOffPercentage,
      writeOffAmount,
      writeOffAccount,
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="1000px"
      withCloseButton={false}
      padding={0}
      radius="md"
    >
      <Box className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] flex items-center justify-center">
              <IconFileOff size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                Write Off Loan
              </Text>
              <Text size="xs" c="dimmed">
                Record a principal write-off against a loan account.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={onClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Body: main form + summary sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main form column */}
          <div className="flex-1 overflow-y-auto p-6">

            <div className="flex flex-col gap-4">
              <TextInput
                size="sm"
                withAsterisk
                label="Loan A/c"
                placeholder="Search loan account"
                value={loanAc}
                onChange={(e) => setLoanAc(e.currentTarget.value)}
                leftSection={<IconSearch size={14} className="text-gray-400" />}
                classNames={labelClass}
              />

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <TextInput
                  size="sm"
                  withAsterisk
                  type="date"
                  label="Value Date"
                  value={valueDate}
                  onChange={(e) => setValueDate(e.currentTarget.value)}
                  leftSection={<IconCalendar size={14} className="text-emerald-600" />}
                  classNames={labelClass}
                />
                <NumberInput
                  size="sm"
                  withAsterisk
                  label="Principal Outstanding"
                  placeholder="Enter amount"
                  value={principalOutstanding}
                  onChange={(v) => setPrincipalOutstanding(v as number | "")}
                  leftSection={<IconCurrencyRupee size={14} className="text-orange-500" />}
                  thousandSeparator=","
                  classNames={labelClass}
                />

                <div>
                  <NumberInput
                    size="sm"
                    withAsterisk
                    label="Write-off Percentage"
                    placeholder="Enter percentage"
                    value={writeOffPercentage}
                    onChange={(v) => handlePercentageChange(v as number | "")}
                    leftSection={<IconPercentage size={14} className="text-indigo-500" />}
                    max={100}
                    min={0}
                    classNames={labelClass}
                  />
                  <Text size="xs" c="dimmed" className="mt-1">
                    Linked to amount
                  </Text>
                </div>

                <div>
                  <NumberInput
                    size="sm"
                    withAsterisk
                    label="Write-off Amount"
                    placeholder="Enter amount"
                    value={writeOffAmount}
                    onChange={(v) => handleAmountChange(v as number | "")}
                    leftSection={<IconCurrencyRupee size={14} className="text-orange-500" />}
                    thousandSeparator=","
                    classNames={labelClass}
                  />
                  <Text size="xs" c="dimmed" className="mt-1">
                    Linked to percentage
                  </Text>
                </div>
              </div>

              <Select
                size="sm"
                withAsterisk
                label="Write-off Account"
                placeholder="Select write-off account"
                data={WRITE_OFF_ACCOUNTS}
                value={writeOffAccount}
                onChange={setWriteOffAccount}
                leftSection={<IconBuildingBank size={14} className="text-indigo-500" />}
                rightSection={chevronDown}
                classNames={labelClass}
              />
            </div>
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
                icon={<IconAlertTriangle size={14} className="text-red-500" />}
                iconBg="#FEF2F2"
                label="NPA"
                value={
                  <Badge
                    size="sm"
                    variant="light"
                    color="red"
                    className="font-semibold"
                    styles={{ root: { fontSize: 10 } }}
                  >
                    {ACCOUNT_SUMMARY.npa ? "Yes" : "No"}
                  </Badge>
                }
              />
              <SummaryItem
                icon={<IconTag size={14} className="text-orange-500" />}
                iconBg="#FFF7ED"
                label="Classification"
                value={
                  <Badge
                    size="sm"
                    variant="light"
                    color="yellow"
                    className="font-semibold"
                    styles={{ root: { fontSize: 10 } }}
                  >
                    {ACCOUNT_SUMMARY.classification}
                  </Badge>
                }
              />
              <SummaryItem
                icon={<IconClock size={14} className="text-red-500" />}
                iconBg="#FEF2F2"
                label="DPD"
                value={`${ACCOUNT_SUMMARY.dpd} days`}
              />
              <SummaryItem
                icon={<IconCurrencyRupee size={14} className="text-indigo-500" />}
                iconBg="#EEF2FF"
                label="Outstanding"
                value={formatCurrency(ACCOUNT_SUMMARY.outstanding)}
                bold
              />
              <SummaryItem
                icon={<IconFileInvoice size={14} className="text-emerald-600" />}
                iconBg="#ECFDF5"
                label="Write-off Amt"
                value={
                  writeOffAmount !== "" ? formatCurrency(Number(writeOffAmount)) : "—"
                }
                bold
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-end items-center shrink-0">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="subtle"
              color="red"
              leftSection={<IconRefresh size={14} />}
              onClick={handleReset}
              className="font-semibold px-4"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              rightSection={<IconArrowRight size={16} />}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              Submit Write-off
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
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