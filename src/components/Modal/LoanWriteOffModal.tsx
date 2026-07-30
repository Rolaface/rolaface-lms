import { useEffect, useState } from "react";
import { getWriteOffAccounts, getLoanAccounts, createLoanWriteOff,updateLoanWriteOff } from "../../api/lendingOperation/writeoff";
import type { WriteOffAccountItem, LoanAccountItem, LoanWriteOffDetail } from "../../types/loanWriteOff";
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
  editData?: LoanWriteOffDetail | null;
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
const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function LoanWriteOffModal({ opened, onClose, onSubmit, editData }: LoanWriteOffModalProps) {
  
  const [loanAc, setLoanAc] = useState("");
  const [valueDate, setValueDate] = useState("");
  const [principalOutstanding, setPrincipalOutstanding] = useState<number | "">("");
  const [writeOffPercentage, setWriteOffPercentage] = useState<number | "">("");
  const [writeOffAmount, setWriteOffAmount] = useState<number | "">("");
  const [writeOffAccount, setWriteOffAccount] = useState<string | null>(null);
  const [accountOptions, setAccountOptions] = useState<WriteOffAccountItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [loanAccountOptions, setLoanAccountOptions] = useState<LoanAccountItem[]>([]);
  const [loanAccountsLoading, setLoanAccountsLoading] = useState(false);
  const [loanAcSearch, setLoanAcSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!opened) return;

    let active = true;
    setAccountsLoading(true);

    getWriteOffAccounts({ page: 1, page_size: 10, search: accountSearch })
      .then((res) => {
        if (active) setAccountOptions(res.data);
      })
      .catch((err) => {
        console.error(err);
        if (active) setAccountOptions([]);
      })
      .finally(() => {
        if (active) setAccountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [opened, accountSearch]);
  useEffect(() => {
    if (!opened) return;

    let active = true;
    setLoanAccountsLoading(true);

    getLoanAccounts({ page: 1, page_size: 10, search: loanAcSearch })
      .then((res) => {
        if (active) setLoanAccountOptions(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoanAccountOptions([]);
      })
      .finally(() => {
        if (active) setLoanAccountsLoading(false);
      });

    return () => {
      active = false;
    };
}, [opened, loanAcSearch]);

 useEffect(() => {
  if (editData) {
    setLoanAc(editData.loan);
    setValueDate(editData.value_date);
    setWriteOffAmount(editData.write_off_amount);
    setWriteOffAccount(editData.write_off_account);
  }
}, [editData]);

useEffect(() => {
  if (editData && loanAccountOptions.length > 0) {
    const matchedLoan = loanAccountOptions.find((acc) => acc.name === editData.loan);
    if (matchedLoan) {
      setPrincipalOutstanding(matchedLoan.pending_principal_amount);
    }
  }
}, [editData, loanAccountOptions]);

  const handlePercentageChange = (value: number | "") => {
    setWriteOffPercentage(value);
    if (value !== "" && principalOutstanding !== "") {
      const amount = (Number(principalOutstanding) * Number(value)) / 100;
      setWriteOffAmount(Math.round(amount * 100) / 100);
    } else {
      setWriteOffAmount("");
    }
  };
  const handleLoanAcChange = (value: string | null) => {
    setLoanAc(value ?? "");
    const selected = loanAccountOptions.find((acc) => acc.name === value);
    if (selected) {
      setPrincipalOutstanding(selected.pending_principal_amount);
    } else {
      setPrincipalOutstanding("");
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

  const handleSubmit = async () => {
    if (!loanAc || !valueDate || writeOffAmount === "" || !writeOffAccount) {
      return; // basic guard — add proper validation/toast as needed
    }

    const postingDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD, today

    const payload = {
      loan: loanAc,
      write_off_amount: Number(writeOffAmount),
      write_off_account: writeOffAccount,
      posting_date: postingDate,
      value_date: valueDate,
      is_settlement_write_off: 1 as const,
    };

    try {
      setSubmitting(true);

      if (editData) {
        await updateLoanWriteOff({ name: editData.name, ...payload });
      } else {
        await createLoanWriteOff(payload);
      }

      onSubmit?.({
        loanAc,
        valueDate,
        principalOutstanding,
        writeOffPercentage,
        writeOffAmount,
        writeOffAccount,
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
                {editData ? "Update Write Off" : "Write Off Loan"}
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
              <Select
                size="sm"
                withAsterisk
                label="Loan A/c"
                placeholder="Search loan account"
                data={
    loanAc && !loanAccountOptions.some((acc) => acc.name === loanAc)
      ? [{ value: loanAc, label: loanAc }, ...loanAccountOptions.map((acc) => ({ value: acc.name, label: acc.name }))]
      : loanAccountOptions.map((acc) => ({ value: acc.name, label: acc.name }))
  }
                value={loanAc || null}
                onChange={handleLoanAcChange}
                searchable
                searchValue={loanAcSearch}
                onSearchChange={setLoanAcSearch}
                nothingFoundMessage={loanAccountsLoading ? "Loading..." : "No accounts found"}
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
                  placeholder="Auto-filled on account selection"
                  value={principalOutstanding}
                  onChange={(v) => setPrincipalOutstanding(v as number | "")}
                  leftSection={<IconCurrencyRupee size={14} className="text-orange-500" />}
                  thousandSeparator=","
                  readOnly
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
                data={
    writeOffAccount && !accountOptions.some((a) => a.value === writeOffAccount)
      ? [{ value: writeOffAccount, label: writeOffAccount }, ...accountOptions.map((a) => ({ value: a.value, label: a.label }))]
      : accountOptions.map((a) => ({ value: a.value, label: a.label }))
  }
                value={writeOffAccount}
                onChange={setWriteOffAccount}
                searchable
                searchValue={accountSearch}
                onSearchChange={setAccountSearch}
                nothingFoundMessage={accountsLoading ? "Loading..." : "No accounts found"}
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
              loading={submitting}
              disabled={submitting}
              rightSection={<IconArrowRight size={16} />}
              className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:opacity-90 font-semibold px-6"
            >
              {editData ? "Update Write-off" : "Submit Write-off"}
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