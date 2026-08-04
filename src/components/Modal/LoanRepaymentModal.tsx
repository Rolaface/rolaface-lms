import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  SegmentedControl,
  Modal,
  Badge,
  ActionIcon,
  Tooltip,
  Table,
} from "@mantine/core";
import {
  IconX,
  IconSearch,
  IconCalendar,
  IconCurrencyDollar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconCar,
  IconArrowRight,
  IconRefresh,
  IconWallet,
  IconCalendarDue,
  IconChecklist,
  IconNotes,
  IconHash,
  IconScale,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoanRepaymentPayload } from "../../types/loanRepaymentForm";
import { getLoanRepaymentAccount, createLoanRepayment, getLoanDues, getLoanRepaymentById, updateLoanRepayment} from "../../api/loanRepaymentApi";
import { useForm } from "@mantine/form";

interface LoanRepaymentModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanRepaymentFormData) => void;
  editId?: string | null;
  isView?: boolean;
}

export interface LoanRepaymentFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  natureOfPayment: "PAY_DUES" | "PARTIAL" | "FULL_SETTLEMENT";
  amountToPay: number | "";
  paymentMode: string | null;
  referenceNumber: string;
  referenceDate: string;
  accountNumber: string;
  remark: string;
}

interface LoanAccount {
  id: string;
  type: string;
  balance: number;
  emiDate: string;
  principalDue: number;
  interestDue: number;
  penalty: number;
  lateFees: number;
   remainingInstallments: number;
}

interface Borrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: LoanAccount[];
}


const  PAYMENT_MODES = ["Bank Draft", "Cash", "Cheque", "Credit Card", "Wire Transfer"];
function toRepaymentType(nature: LoanRepaymentFormData["natureOfPayment"]) {
  return nature === "FULL_SETTLEMENT" ? "Full Settlement" : "Normal Repayment";
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

 function computePaymentEffect(loan: LoanAccount, amount: number, nature: LoanRepaymentFormData["natureOfPayment"]) {
  const amt = Math.max(0, amount || 0);

  const totalOutstandingBefore = loan.balance + loan.interestDue + loan.penalty + loan.lateFees;
  const arrearsBefore = loan.principalDue + loan.interestDue + loan.penalty + loan.lateFees;
  const principalOutstandingBefore = loan.balance;
  const interestPayableBefore = loan.interestDue;

  let remaining = amt;
  const penaltyPaid = Math.min(remaining, loan.penalty);
  remaining -= penaltyPaid;
  const feesPaid = Math.min(remaining, loan.lateFees);
  remaining -= feesPaid;
  const interestPaid = Math.min(remaining, loan.interestDue);
  remaining -= interestPaid;
  const principalPaid = Math.min(remaining, loan.balance);
  remaining -= principalPaid;

  const totalOutstandingAfter = Math.max(totalOutstandingBefore - amt, 0);
  const principalOutstandingAfter = Math.max(principalOutstandingBefore - principalPaid, 0);
  const arrearsAfter = Math.max(arrearsBefore - amt, 0);
  const interestPayableAfter = Math.max(interestPayableBefore - interestPaid, 0);

  const emiCleared = nature === "FULL_SETTLEMENT" || amt >= loan.principalDue + loan.interestDue + loan.penalty + loan.lateFees;
  const remainingInstallmentsBefore = loan.remainingInstallments;
  const remainingInstallmentsAfter =
    nature === "FULL_SETTLEMENT"
      ? 0
      : emiCleared
      ? Math.max(loan.remainingInstallments - 1, 0)
      : loan.remainingInstallments;

  return {
    totalOutstandingBefore,
    totalOutstandingAfter,
    principalOutstandingBefore,
    principalOutstandingAfter,
    arrearsBefore,
    arrearsAfter,
    remainingInstallmentsBefore,
    remainingInstallmentsAfter,
    interestPayableBefore,
    interestPayableAfter,
  };
}

export function LoanRepaymentModal({ opened, onClose, onSubmit, editId, isView }: LoanRepaymentModalProps) {
  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentEffectOpened, setPaymentEffectOpened] = useState(false);

   useEffect(() => {
    setBorrowerPanelCollapsed(!!selectedLoanId);
  }, [selectedLoanId]);

const { data: searchResponse, isLoading: isSearching } = useQuery({
  queryKey: ["loanRepaymentAccounts", search],
  queryFn: () => getLoanRepaymentAccount(search),
  enabled: opened && search.trim().length > 0,
});

const matches: Borrower[] = useMemo(() => {
  const items = searchResponse?.message?.data ?? [];
  return items.map((item) => ({
    name: item.applicant_name || item.applicant,
    cif: item.applicant,
    phone: item.phone_number || "",
    status: "Standard",
    loans: [
      {
        id: item.against_loan,
        type: "",
        balance: 0,
        emiDate: "",
        principalDue: 0,
        interestDue: 0,
        penalty: 0,
        lateFees: 0,
        remainingInstallments: 0,
      },
    ],
  }));
}, [searchResponse]);

const form = useForm({
  initialValues: {
    valueDate: new Date().toISOString().slice(0, 10),
    natureOfPayment: "PAY_DUES" as LoanRepaymentFormData["natureOfPayment"],
    amountToPay: "" as number | "",
    paymentMode: "Direct Debit from A/C" as string | null,
    referenceNumber: "",
    referenceDate: "",
    accountNumber: "",
    remark: "",
  },
  validate: {
    valueDate: (v) => (!v ? "Value Date is required" : null),
    amountToPay: (v) => (!v ? "Amount to Pay is required" : null),
    paymentMode: (v) => (!v ? "Payment Mode is required" : null),
    referenceDate: (v) => (!v ? "Reference Date is required" : null),
    referenceNumber: (v) => (!v ? "Reference Number is required" : null),
  },
});

const { data: editDetailsResponse, isLoading: isEditLoading } = useQuery({
  queryKey: ["loanRepayment", editId],
  queryFn: () => getLoanRepaymentById(editId as string),
  enabled: opened && !!editId,
});

const updateRepaymentMutation = useMutation({
  mutationFn: updateLoanRepayment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["loanRepayments"] });
    handleReset();
    onClose();
  },
});

useEffect(() => {
  if (opened && editId && editDetailsResponse) {
    const item = editDetailsResponse.message?.data || editDetailsResponse.message || editDetailsResponse;

    setSelectedBorrower({
      name: item.applicant,
      cif: item.applicant,
      phone: "",
      status: "Standard",
      loans: [
        {
          id: item.against_loan,
          type: item.loan_product || "",
          balance: 0,
          emiDate: "",
          principalDue: 0,
          interestDue: 0,
          penalty: 0,
          lateFees: 0,
          remainingInstallments: 0,
        },
      ],
    });
    setSelectedLoanId(item.against_loan);

    form.setValues({
      valueDate: item.value_date ? item.value_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      natureOfPayment: item.repayment_type === "Full Settlement" ? "FULL_SETTLEMENT" : "PAY_DUES",
      amountToPay: item.amount_paid ?? "",
      paymentMode: item.mode_of_payment || null,
      referenceNumber: item.reference_number || "",
      referenceDate: item.reference_date || "",
      accountNumber: "",
      remark: "",
    });
  } else if (opened && !editId) {
    handleReset();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [opened, editId, editDetailsResponse]);

  const queryClient = useQueryClient();

const { data: duesResponse, isFetching: isDuesLoading } = useQuery({
  queryKey: ["loanDues", selectedLoanId, form.values.valueDate, form.values.natureOfPayment],
  queryFn: () =>
    getLoanDues({
      payment_type: toRepaymentType(form.values.natureOfPayment),
      posting_date: form.values.valueDate,
      against_loan: selectedLoanId as string,
    }),
  enabled: !!selectedLoanId,
});

const dues = duesResponse?.message;

useEffect(() => {
  if (!dues) return;
  if (form.values.natureOfPayment === "PAY_DUES" || form.values.natureOfPayment === "FULL_SETTLEMENT") {
    form.setFieldValue("amountToPay", dues.payable_amount);
  }
}, [dues, form.values.natureOfPayment]);

  const selectedLoan = selectedBorrower?.loans.find((l) => l.id === selectedLoanId) ?? null;
  const totalDue = selectedLoan
    ? selectedLoan.principalDue + selectedLoan.interestDue + selectedLoan.lateFees
    : 0;

 const paymentEffect = useMemo(() => {
  if (!selectedLoan) return null;
  return computePaymentEffect(selectedLoan, Number(form.values.amountToPay) || 0, form.values.natureOfPayment);
}, [selectedLoan, form.values.amountToPay, form.values.natureOfPayment]);

 const handleSelectBorrower = (borrower: Borrower) => {
  setSelectedBorrower(borrower);
  setSelectedLoanId(borrower.loans[0]?.id ?? null);
};

 const handleClearBorrower = () => {
  setSelectedBorrower(null);
  setSelectedLoanId(null);
  setSearch("");
  form.reset();
};
const handleSelectLoan = (loan: LoanAccount) => {
  setSelectedLoanId(loan.id);
};

const handleNatureChange = (value: string) => {
  form.setFieldValue("natureOfPayment", value as LoanRepaymentFormData["natureOfPayment"]);
  if (value === "PARTIAL") form.setFieldValue("amountToPay", "");
};

const createRepaymentMutation = useMutation({
  mutationFn: createLoanRepayment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["loanRepayments"] });
    handleReset();
    onClose();
  },
});

const handleSubmit = (values: typeof form.values) => {
  if (!selectedLoan || !selectedBorrower) return;

  const payload: LoanRepaymentPayload = {
    repayment_type: toRepaymentType(values.natureOfPayment),
    applicant_type: "Customer",
    applicant: selectedBorrower.cif,
    loan_product: selectedLoan.type,
    against_loan: selectedLoan.id,
    value_date: values.valueDate.slice(0, 10),
    amount_paid: Number(values.amountToPay) || 0,
    mode_of_payment: values.paymentMode as string,
    reference_number: values.referenceNumber,
    reference_date: values.referenceDate,
  };

  if (editId) {
    updateRepaymentMutation.mutate({ id: editId, payload });
  } else {
    createRepaymentMutation.mutate(payload);
  }
};
const handleReset = () => {
  setSearch("");
  setSelectedBorrower(null);
  setSelectedLoanId(null);
  form.reset();
};

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
      <Box className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#3730A3] flex items-center justify-center">
              <IconWallet size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                Loan Repayment
              </Text>
              <Text size="xs" c="dimmed">
                Search a borrower and process a repayment against their loan account.
              </Text>
            </div>
          </div>
       <Button variant="subtle" color="gray" onClick={onClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>

        </div>

        <div className="border-b border-gray-200" />

        {/* Body: borrower selection + (dues summary stacked above payment execution) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Borrower Selection column */}
          <div
            className={`border-r border-gray-200 shrink-0 overflow-y-auto transition-all duration-200 ${borrowerPanelCollapsed ? "w-14 p-3" : "w-[300px] p-5"
              }`}
          >
            {borrowerPanelCollapsed ? (
              <div className="flex flex-col items-center gap-4">
                <Tooltip label="Expand borrower selection" withArrow position="right">
                  <ActionIcon
                    variant="light"
                    color="brand"
                    size="md"
                    onClick={() => setBorrowerPanelCollapsed(false)}
                  >
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Tooltip>
                {selectedBorrower && (
                  <Tooltip label={selectedBorrower.name} withArrow position="right">
                    <div className="w-8 h-8 rounded-full bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center">
                      <Text size="xs" fw={700} className="text-[#4F46E5]">
                        {selectedBorrower.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </Text>
                    </div>
                  </Tooltip>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />
                    <Text size="sm" fw={700} className="text-gray-900">
                      Borrower Selection
                    </Text>
                  </div>
                  {selectedBorrower && (
                    <Tooltip label="Collapse" withArrow position="left">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => setBorrowerPanelCollapsed(true)}
                      >
                        <IconChevronLeft size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </div>
                <Text size="xs" c="dimmed" className="ml-3 mb-4">
                  Search by A/C no, phone or name
                </Text>

               <TextInput
                 size="sm"
                 placeholder="Search by loan A/C, applicant or phone"
                 value={search}
                 disabled={isView}
                 onChange={(e) => setSearch(e.currentTarget.value)}
                 leftSection={<IconSearch size={14} className="text-gray-400" />}
                 classNames={labelClass}
               />

                {selectedBorrower ? (
                  <div className="mt-4">
                   <div className="flex items-center justify-between mb-2">
  <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">
    Selected Borrower
  </Text>
  {!isView && (
    <button
      type="button"
      onClick={handleClearBorrower}
      className="text-xs font-semibold text-[#4F46E5] hover:text-[#3730A3]"
    >
      Change
    </button>
  )}
</div>
                    <div className="text-left rounded-md border border-[#a5b4fc] bg-[#eef2ff] p-3">
                      <div className="flex items-center justify-between">
                        <Text size="sm" fw={700} className="text-gray-900">
                          {selectedBorrower.name}
                        </Text>
                        <Badge
                          size="sm"
                          variant="light"
                          color={selectedBorrower.status === "Overdue" ? "danger" : "green"}
                          styles={{ root: { fontSize: 10 } }}
                        >
                          {selectedBorrower.status}
                        </Badge>
                      </div>
                      <Text size="xs" c="dimmed" className="mt-0.5">
                        CIF: {selectedBorrower.cif} | {selectedBorrower.phone}
                      </Text>
                    </div>
                  </div>
                ) : (
                  search.trim() && (
  <div className="flex flex-col gap-2 mt-4">
    {isSearching ? (
      <Text size="xs" c="dimmed" className="py-2">Searching...</Text>
    ) : matches.length === 0 ? (
      <Text size="xs" c="dimmed" className="py-2">No borrowers found.</Text>
    ) : (
      matches.map((borrower) => (
                          <button
                            key={borrower.cif}
                            type="button"
                            onClick={() => handleSelectBorrower(borrower)}
                            className="text-left rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <Text size="sm" fw={700} className="text-gray-900">
                                {borrower.name}
                              </Text>
                              <Badge
                                size="sm"
                                variant="light"
                                color={borrower.status === "Overdue" ? "danger" : "green"}
                                styles={{ root: { fontSize: 10 } }}
                              >
                                {borrower.status}
                              </Badge>
                            </div>
                            <Text size="xs" c="dimmed" className="mt-0.5">
                              CIF: {borrower.cif} | {borrower.phone}
                            </Text>
                          </button>
                        ))
                      )}
                    </div>
                  )
                )}

                {selectedBorrower && (
                  <div className="mt-5">
                    <Text size="xs" fw={600} c="dimmed" className="mb-2 uppercase tracking-wide">
                      Select Active Loan Account
                    </Text>
                    <div className="flex flex-col gap-2">
                     {selectedBorrower.loans.map((loan) => (
  <button
    key={loan.id}
    type="button"
    disabled={isView}
    onClick={() => handleSelectLoan(loan)}
    className={`text-left rounded-md border p-3 transition-colors ${
      selectedLoanId === loan.id
        ? "border-[#818cf8] bg-[#eef2ff] ring-1 ring-[#c7d2fe]"
        : "border-gray-200 hover:bg-gray-50"
    } ${isView ? "cursor-default opacity-80" : ""}`}
  >
    <Text size="sm" fw={700} className="text-gray-900">
      {loan.type} - {loan.id}
    </Text>
    <Text size="xs" c="dimmed" className="mt-0.5">
      Balance: {formatCurrency(loan.balance)} | EMI Date: {loan.emiDate}
    </Text>
  </button>
))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Execution column (middle) */}
          <div className="relative flex-1 overflow-y-auto p-6">
            <div className={`rounded-lg border border-gray-200 p-4 transition-all duration-300 ${
                  !selectedLoan
                    ? "pointer-events-none select-none opacity-50 blur-[2px]"
                    : ""
                }`}
              >
              <div className="flex items-center gap-2 mb-4">
                <IconChecklist size={16} className="text-[#4F46E5]" />
                <Text size="sm" fw={700} className="text-gray-900 flex items-center gap-2">
                  Executing Payment for
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-[#4338CA] font-semibold">
                    {selectedLoan?.id ?? "—"}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-[#EA580C] font-semibold">
                    {selectedBorrower?.name ?? "—"}
                  </span>
                </Text>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                 <TextInput
  size="sm"
  withAsterisk
  type="date"
  disabled={isView}
  label="Value Date"
  leftSection={<IconCalendarDue size={14} className="text-emerald-600" />}
  classNames={labelClass}
  {...form.getInputProps("valueDate")}
/>
                </div>

                <div>
                  <Text size="sm" fw={500} className="text-gray-700 mb-1">
                    Nature of Payment
                  </Text>
                  <div className="grid grid-cols-3 gap-x-8 gap-3">
                    {(
                      [
                        {
                          label: "Pay Dues",
                          value: "PAY_DUES",
                          active:
                            "border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shadow-sm",
                          hover: "hover:border-emerald-200 hover:bg-emerald-50",
                        },
                        {
                          label: "Pay Any",
                          value: "PARTIAL",
                          active:
                            "border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm",
                          hover: "hover:border-amber-200 hover:bg-amber-50",
                        },
                        {
                          label: "Pay Full",
                          value: "FULL_SETTLEMENT",
                          active:
                            "border-[#818cf8] bg-[#eef2ff] text-[#4338CA] ring-1 ring-[#c7d2fe] shadow-sm",
                          hover: "hover:border-[#c7d2fe] hover:bg-[#f5f3ff]",
                        },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleNatureChange(option.value)}
                        className={`rounded-lg border py-3 px-3 text-center text-sm font-semibold transition-all duration-200 ${
                          form.values.natureOfPayment === option.value 
                            ? option.active
                            : `border-gray-200 bg-white text-gray-700 ${option.hover}`
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                <NumberInput
  size="sm"
  withAsterisk
  label="Amount to Pay"
  placeholder="Enter amount"
  disabled={isView}
  leftSection={<IconCurrencyDollar size={14} className="text-[#F26522]" />}
  thousandSeparator=","
  decimalScale={2}
  classNames={labelClass}
  {...form.getInputProps("amountToPay")}
/>
                <Select
  size="sm"
  withAsterisk
  label="Payment Mode"
  disabled={isView}
  placeholder="Select payment mode"
  data={PAYMENT_MODES}
  leftSection={<IconCreditCard size={14} className="text-[#4F46E5]" />}
  rightSection={chevronDown}
  classNames={labelClass}
  {...form.getInputProps("paymentMode")}
/>
                 <TextInput
  size="sm"
  label="Account Number"
  placeholder="Debit account number"
  disabled={isView}
  leftSection={<IconCreditCard size={14} className="text-gray-400" />}
  classNames={labelClass}
  {...form.getInputProps("accountNumber")}
/>
                </div>
                <div className="grid grid-cols-3 gap-x-8 gap-y-3">

               <TextInput
  size="sm"
  withAsterisk
  label="Reference Number"
  disabled={isView}
  placeholder="e.g. UTR / cheque no."
  leftSection={<IconHash size={14} className="text-gray-400" />}
  classNames={labelClass}
  {...form.getInputProps("referenceNumber")}
/>
                 <TextInput
  size="sm"
  withAsterisk
  type="date"
  label="Reference Date"
  disabled={isView}
  leftSection={<IconCalendar size={14} className="text-gray-400" />}
  classNames={labelClass}
  {...form.getInputProps("referenceDate")}
/>
                  <TextInput
  size="sm"
  label="Remark"
  placeholder="Add a note about this repayment (optional)"
  disabled={isView}
  leftSection={<IconNotes size={14} className="text-gray-400" />}
  classNames={labelClass}
  {...form.getInputProps("remark")}
/>
                </div>                
              </div>
            </div>

            {!selectedLoan && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/55 backdrop-blur-[3px]">

                <div className="w-[440px] rounded-2xl border border-[#dbe4ff] bg-white shadow-2xl">

                  {/* Icon */}
                  <div className="flex justify-center pt-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] ring-1 ring-[#C7D2FE]">
                      <IconChecklist
                        size={30}
                        className="text-[#4338CA]"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-8 py-6 text-center">

                    <Text
                      size="xl"
                      fw={700}
                      className="text-gray-900"
                    >
                      No Loan Account Selected
                    </Text>

                    <Text
                      size="sm"
                      c="dimmed"
                      className="mt-3 leading-6"
                    >
                      To proceed with a repayment transaction, first search for a borrower
                      and select one of their active loan accounts from the panel on the
                      left.
                    </Text>

                    <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                      <Text
                        size="xs"
                        fw={600}
                        className="uppercase tracking-wide text-[#4F46E5]"
                      >
                        Next Step
                      </Text>

                      <Text
                        size="sm"
                        className="mt-1 text-gray-700"
                      >
                        Select a borrower → Choose a loan account → Process repayment
                      </Text>
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* Dues Summary — separate card, to the right of Payment Execution */}
          <div className="w-[300px] border-l border-gray-200 p-5 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />
              <Text size="sm" fw={700} className="text-gray-900">
                Dues Summary
              </Text>
            </div>

            {selectedLoan ? (
  <div className="flex flex-col gap-3">
    <div className="bg-gray-50/60 border border-gray-100 rounded-md p-2.5">
      <Text size="xs" c="dimmed">EMI Date</Text>
      <Text size="sm" fw={600} className="text-gray-900">
        {isDuesLoading ? "Loading..." : dues?.due_date || "—"}
      </Text>
    </div>

    <div className="bg-gray-50/60 border border-gray-100 rounded-md p-3 flex flex-col gap-1.5">
      <div className="flex justify-between">
        <Text size="xs" c="dimmed">Principal Due</Text>
        <Text size="xs" className="font-mono text-gray-700">
          {formatCurrency(dues?.payable_principal_amount ?? 0)}
        </Text>
      </div>
      <div className="flex justify-between">
        <Text size="xs" c="dimmed">Interest Due</Text>
        <Text size="xs" className="font-mono text-gray-700">
          {formatCurrency(dues?.interest_amount ?? 0)}
        </Text>
      </div>
      <div className="flex justify-between">
        <Text size="xs" c="dimmed">Penalty</Text>
        <Text size="xs" className="font-mono text-gray-700">
          {formatCurrency(dues?.penalty_amount ?? 0)}
        </Text>
      </div>
      <div className="flex justify-between">
        <Text size="xs" c="dimmed">Fees/Charges</Text>
        <Text size="xs" className="font-mono text-gray-700">
          {formatCurrency(dues?.total_charges_payable ?? 0)}
        </Text>
      </div>
      <div className="border-t border-gray-100 my-1" />
      <div className="flex justify-between items-center">
        <Text size="sm" fw={700} className="text-gray-900">Total Amount Due</Text>
        <Text size="sm" fw={700} className="text-gray-900 font-mono">
          {formatCurrency(dues?.payable_amount ?? 0)}
        </Text>
      </div>
    </div>

    <Button
      size="sm"
      variant="light"
      color="brand"
      fullWidth
      leftSection={<IconScale size={14} />}
      onClick={() => setPaymentEffectOpened(true)}
      className="font-semibold"
    >
      Payment Effect
    </Button>
  </div>
) : (
  <Text size="xs" c="dimmed" className="py-8 text-center">
    Select a loan account on the left to view dues.
  </Text>
)}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0">
  <Button variant="default" size="sm" onClick={onClose} className="font-semibold">
    {isView ? "Close" : "Cancel"}
  </Button>
  {!isView && (
    <div className="flex gap-2">
      <Button size="sm" variant="subtle" color="danger" leftSection={<IconRefresh size={14} />} onClick={handleReset} className="font-semibold px-4">
        Reset
      </Button>
      <Button
        size="sm"
        disabled={!selectedLoan || createRepaymentMutation.isPending || updateRepaymentMutation.isPending}
        loading={createRepaymentMutation.isPending || updateRepaymentMutation.isPending}
        onClick={() => form.onSubmit(handleSubmit)()}
        rightSection={<IconArrowRight size={16} />}
        className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 font-semibold px-6"
      >
        {editId ? "Update" : "Process Repayment"}
      </Button>
    </div>
  )}
</div>
      </Box>

      {/* Payment Effect Modal */}
      <Modal
        opened={paymentEffectOpened}
        onClose={() => setPaymentEffectOpened(false)}
        size="640px"
        withCloseButton={false}
        padding={0}
        radius="md"
      >
        <Box className="flex flex-col">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#3730A3] flex items-center justify-center">
                <IconTrendingDown size={20} className="text-white" />
              </div>
              <div>
                <Text size="md" fw={700} className="text-gray-900 leading-tight">
                  Payment Effect
                </Text>
                <Text size="xs" c="dimmed">
  Projected impact of {form.values.amountToPay ? formatCurrency(Number(form.values.amountToPay)) : "this payment"} on{" "}
  {selectedLoan?.id ?? "the loan account"}.
</Text>
              </div>
            </div>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setPaymentEffectOpened(false)}
              className="px-2"
              size="xs"
            >
              <IconX size={18} />
            </Button>
          </div>

          <div className="border-b border-gray-200" />

          <div className="px-6 py-5">
            {paymentEffect && selectedLoan ? (
              <Table verticalSpacing="sm" horizontalSpacing="md" withRowBorders={false}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Component
                    </Table.Th>
                    <Table.Th className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                      Before
                    </Table.Th>
                    <Table.Th className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                      After
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr className="bg-gray-50/60">
                    <Table.Td>
                      <Text size="sm" fw={600} className="text-gray-900">
                        Total Outstanding
                      </Text>
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(paymentEffect.totalOutstandingBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(paymentEffect.totalOutstandingAfter)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>
                      <Text size="sm" fw={600} className="text-gray-900">
                        Principal Outstanding
                      </Text>
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(paymentEffect.principalOutstandingBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(paymentEffect.principalOutstandingAfter)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr className="bg-gray-50/60">
                    <Table.Td>
                      <Text size="sm" fw={600} className="text-gray-900">
                        Arrears
                      </Text>
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(paymentEffect.arrearsBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(paymentEffect.arrearsAfter)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>
                      <Text size="sm" fw={600} className="text-gray-900">
                        Remaining Installments
                      </Text>
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {paymentEffect.remainingInstallmentsBefore}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {paymentEffect.remainingInstallmentsAfter}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr className="bg-gray-50/60">
                    <Table.Td>
                      <Text size="sm" fw={600} className="text-gray-900">
                        Interest Payable
                      </Text>
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(paymentEffect.interestPayableBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(paymentEffect.interestPayableAfter)}
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            ) : (
              <Text size="sm" c="dimmed" className="py-6 text-center">
                Select a loan account to preview payment effect.
              </Text>
            )}

            <Text size="xs" c="dimmed" className="mt-4">
              Payment is applied in order: penalty → fees → interest → principal. This is a
              projection only and does not process the transaction.
            </Text>
          </div>

          <div className="border-t border-gray-200 p-4 px-6 flex justify-end">
            <Button
              size="sm"
              variant="default"
              onClick={() => setPaymentEffectOpened(false)}
              className="font-semibold px-5"
            >
              Close
            </Button>
          </div>
        </Box>
      </Modal>
    </Modal>
  );
}