// LoanRepaymentModal.tsx
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
} from "@tabler/icons-react";

interface LoanRepaymentModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanRepaymentFormData) => void;
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
  lateFees: number;
}

interface Borrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: LoanAccount[];
}

// Static borrower directory — wire up to real borrower lookup as needed.
const BORROWERS: Borrower[] = [
  {
    name: "Yash Joshi",
    cif: "1009842",
    phone: "+91 98765 43210",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-001",
        type: "Vehicle Loan",
        balance: 12450,
        emiDate: "5th of Month",
        principalDue: 450,
        interestDue: 125.5,
        lateFees: 25,
      },
      {
        id: "LNA-2025-089",
        type: "Personal Loan",
        balance: 4200,
        emiDate: "12th of Month",
        principalDue: 210,
        interestDue: 65,
        lateFees: 0,
      },
    ],
  },
  {
    name: "Meera Nair",
    cif: "1010223",
    phone: "+91 91234 56780",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-014",
        type: "Home Loan",
        balance: 284300,
        emiDate: "1st of Month",
        principalDue: 3200,
        interestDue: 1450.75,
        lateFees: 0,
      },
    ],
  },
  {
    name: "Arjun Kapoor",
    cif: "1011567",
    phone: "+91 99887 66554",
    status: "Overdue",
    loans: [
      {
        id: "LNA-2025-032",
        type: "Vehicle Loan",
        balance: 8600,
        emiDate: "18th of Month",
        principalDue: 380,
        interestDue: 95.25,
        lateFees: 40,
      },
      {
        id: "LNA-2025-047",
        type: "Personal Loan",
        balance: 2150,
        emiDate: "25th of Month",
        principalDue: 175,
        interestDue: 42.5,
        lateFees: 15,
      },
    ],
  },
  {
    name: "Sanya Iyer",
    cif: "1012890",
    phone: "+91 90000 12345",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-058",
        type: "Education Loan",
        balance: 156000,
        emiDate: "10th of Month",
        principalDue: 1200,
        interestDue: 380.6,
        lateFees: 0,
      },
    ],
  },
  {
    name: "Rohan Mehta",
    cif: "1013456",
    phone: "+91 98123 45678",
    status: "Overdue",
    loans: [
      {
        id: "LNA-2025-071",
        type: "Vehicle Loan",
        balance: 5400,
        emiDate: "3rd of Month",
        principalDue: 300,
        interestDue: 88,
        lateFees: 60,
      },
    ],
  },
];

const PAYMENT_MODES = ["Direct Debit from A/C", "Cash", "Cheque", "NEFT/RTGS", "UPI"];

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function LoanRepaymentModal({ opened, onClose, onSubmit }: LoanRepaymentModalProps) {
  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);

  const [valueDate, setValueDate] = useState(new Date().toISOString().slice(0, 10));
  const [natureOfPayment, setNatureOfPayment] = useState<LoanRepaymentFormData["natureOfPayment"]>(
    "PAY_DUES"
  );
  const [amountToPay, setAmountToPay] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<string | null>("Direct Debit from A/C");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [remark, setRemark] = useState("");

  // Collapse the borrower panel automatically once a loan account is picked,
  // to free up room for the payment form. Expands again if selection is cleared.
  useEffect(() => {
    setBorrowerPanelCollapsed(!!selectedLoanId);
  }, [selectedLoanId]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const qDigits = q.replace(/\D/g, "");
    return BORROWERS.filter((b) => {
      const nameWords = b.name.toLowerCase().split(" ");
      const matchesName = nameWords.some((word) => word.startsWith(q));
      const matchesPhone = qDigits.length > 0 && b.phone.replace(/\D/g, "").includes(qDigits);
      const matchesCif = b.cif.startsWith(q);
      return matchesName || matchesPhone || matchesCif;
    });
  }, [search]);

  const selectedLoan = selectedBorrower?.loans.find((l) => l.id === selectedLoanId) ?? null;
  const totalDue = selectedLoan
    ? selectedLoan.principalDue + selectedLoan.interestDue + selectedLoan.lateFees
    : 0;

  const handleSelectBorrower = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    setSelectedLoanId(borrower.loans[0]?.id ?? null);
    const firstLoan = borrower.loans[0];
    if (firstLoan) {
      setAmountToPay(
        Math.round((firstLoan.principalDue + firstLoan.interestDue + firstLoan.lateFees) * 100) /
        100
      );
    }
  };

  const handleClearBorrower = () => {
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setSearch("");
    setAmountToPay("");
    setReferenceNumber("");
    setReferenceDate("");
    setAccountNumber("");
    setRemark("");
  };

  const handleSelectLoan = (loan: LoanAccount) => {
    setSelectedLoanId(loan.id);
    if (natureOfPayment === "PAY_DUES") {
      setAmountToPay(
        Math.round((loan.principalDue + loan.interestDue + loan.lateFees) * 100) / 100
      );
    } else if (natureOfPayment === "FULL_SETTLEMENT") {
      setAmountToPay(loan.balance);
    }
  };

  const handleNatureChange = (value: string) => {
    const nature = value as LoanRepaymentFormData["natureOfPayment"];
    setNatureOfPayment(nature);
    if (!selectedLoan) return;
    if (nature === "PAY_DUES") {
      setAmountToPay(Math.round(totalDue * 100) / 100);
    } else if (nature === "FULL_SETTLEMENT") {
      setAmountToPay(selectedLoan.balance);
    } else {
      setAmountToPay("");
    }
  };

  const handleReset = () => {
    setSearch("");
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setValueDate(new Date().toISOString().slice(0, 10));
    setNatureOfPayment("PAY_DUES");
    setAmountToPay("");
    setPaymentMode("Direct Debit from A/C");
    setReferenceNumber("");
    setReferenceDate("");
    setAccountNumber("");
    setRemark("");
  };

  const handleSubmit = () => {
    onSubmit?.({
      loanAc: selectedLoan?.id ?? "",
      customerName: selectedBorrower?.name ?? "",
      loanType: selectedLoan?.type ?? "",
      valueDate,
      natureOfPayment,
      amountToPay,
      paymentMode,
      referenceNumber,
      referenceDate,
      accountNumber,
      remark,
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="1300px"
      withCloseButton={false}
      padding={0}
      radius="md"
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
                  placeholder="e.g. Yash Joshi, 9876543210..."
                  value={search}
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
                      <button
                        type="button"
                        onClick={handleClearBorrower}
                        className="text-xs font-semibold text-[#4F46E5] hover:text-[#3730A3]"
                      >
                        Change
                      </button>
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
                      {matches.length === 0 ? (
                        <Text size="xs" c="dimmed" className="py-2">
                          No borrowers found.
                        </Text>
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
                          onClick={() => handleSelectLoan(loan)}
                          className={`text-left rounded-md border p-3 transition-colors ${selectedLoanId === loan.id
                              ? "border-[#818cf8] bg-[#eef2ff] ring-1 ring-[#c7d2fe]"
                              : "border-gray-200 hover:bg-gray-50"
                            }`}
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
          <div className="flex-1 overflow-y-auto p-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <IconChecklist size={16} className="text-[#4F46E5]" />
                <Text size="sm" fw={700} className="text-gray-900">
                  Payment Execution
                </Text>
              </div>
              <div className="flex flex-col justify-center h-[42px]">
                <Text size="xs" fw={500} className="text-gray-700 mb-1">
                  Loan Account
                </Text>

                <div className="flex items-center gap-2">
                  <Text size="sm" fw={700} className="font-mono text-gray-900">
                    {selectedLoan?.id}
                  </Text>

                  <span className="text-gray-300">|</span>

                  <Text size="sm" c="dimmed">
                    {selectedLoan?.type}
                  </Text>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <TextInput
                    size="sm"
                    withAsterisk
                    type="date"
                    label="Value Date"
                    value={valueDate}
                    onChange={(e) => setValueDate(e.currentTarget.value)}
                    leftSection={<IconCalendarDue size={14} className="text-emerald-600" />}
                    classNames={labelClass}
                  />

                  <div>
                    <Text size="sm" fw={500} className="text-gray-700 mb-1">
                      Nature of Payment
                    </Text>
                    <SegmentedControl
                      size="xs"
                      fullWidth
                      color="brand"
                      value={natureOfPayment}
                      onChange={handleNatureChange}
                      data={[
                        { label: "Pay Dues", value: "PAY_DUES" },
                        { label: "Partially Pay Off", value: "PARTIAL" },
                        { label: "Full Settl.", value: "FULL_SETTLEMENT" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <NumberInput
                    size="sm"
                    withAsterisk
                    label="Amount to Pay"
                    placeholder="Enter amount"
                    value={amountToPay}
                    onChange={(v) => setAmountToPay(v as number | "")}
                    leftSection={<IconCurrencyDollar size={14} className="text-[#F26522]" />}
                    thousandSeparator=","
                    decimalScale={2}
                    classNames={labelClass}
                  />

                  <Select
                    size="sm"
                    withAsterisk
                    label="Payment Mode"
                    placeholder="Select payment mode"
                    data={PAYMENT_MODES}
                    value={paymentMode}
                    onChange={setPaymentMode}
                    leftSection={<IconCreditCard size={14} className="text-[#4F46E5]" />}
                    rightSection={chevronDown}
                    classNames={labelClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <TextInput
                    size="sm"
                    label="Reference Number"
                    placeholder="e.g. UTR / cheque no."
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.currentTarget.value)}
                    leftSection={<IconHash size={14} className="text-gray-400" />}
                    classNames={labelClass}
                  />

                  <TextInput
                    size="sm"
                    type="date"
                    label="Reference Date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.currentTarget.value)}
                    leftSection={<IconCalendar size={14} className="text-gray-400" />}
                    classNames={labelClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <TextInput
                    size="sm"
                    label="Account Number"
                    placeholder="Debit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.currentTarget.value)}
                    leftSection={<IconCreditCard size={14} className="text-gray-400" />}
                    classNames={labelClass}
                  />

                  <TextInput
                    size="sm"
                    label="Remark"
                    placeholder="Add a note about this repayment (optional)"
                    value={remark}
                    onChange={(e) => setRemark(e.currentTarget.value)}
                    leftSection={<IconNotes size={14} className="text-gray-400" />}
                    classNames={labelClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dues Summary — separate card, to the right of Payment Execution */}
          <div className="w-[300px] border-l border-gray-200 p-5 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />
              <Text size="sm" fw={700} className="text-gray-900">
                Dues Summary
              </Text>
            </div>
            <Text size="xs" c="dimmed" className="ml-3 mb-4">
              Live account status
            </Text>

            {selectedLoan ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 bg-gray-50/60 border border-gray-100 rounded-md p-2.5">
                  <div className="p-1.5 rounded-md bg-[#eef2ff] flex items-center justify-center shrink-0">
                    <IconCar size={14} className="text-[#4F46E5]" />
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      {selectedLoan.type}
                    </Text>
                    <Text size="sm" fw={700} className="text-gray-900 font-mono">
                      {selectedLoan.id}
                    </Text>
                  </div>
                </div>

                <div className="bg-gray-50/60 border border-gray-100 rounded-md p-2.5">
                  <Text size="xs" c="dimmed">
                    Customer
                  </Text>
                  <Text size="sm" fw={600} className="text-gray-900">
                    {selectedBorrower?.name}
                  </Text>
                </div>

                <div className="bg-gray-50/60 border border-gray-100 rounded-md p-2.5">
                  <Text size="xs" c="dimmed">
                    EMI Date
                  </Text>
                  <Text size="sm" fw={600} className="text-gray-900">
                    {selectedLoan.emiDate}
                  </Text>
                </div>

                <div className="bg-gray-50/60 border border-gray-100 rounded-md p-3 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">
                      Principal Due
                    </Text>
                    <Text size="xs" className="font-mono text-gray-700">
                      {formatCurrency(selectedLoan.principalDue)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">
                      Interest Due
                    </Text>
                    <Text size="xs" className="font-mono text-gray-700">
                      {formatCurrency(selectedLoan.interestDue)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">
                      Late Fees / Penalties
                    </Text>
                    <Text size="xs" className="font-mono text-gray-700">
                      {formatCurrency(selectedLoan.lateFees)}
                    </Text>
                  </div>
                  <div className="border-t border-gray-100 my-1" />
                  <div className="flex justify-between items-center">
                    <Text size="sm" fw={700} className="text-gray-900">
                      Total Amount Due
                    </Text>
                    <Text size="sm" fw={700} className="text-gray-900 font-mono">
                      {formatCurrency(totalDue)}
                    </Text>
                  </div>
                </div>
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
          <Button size="sm" variant="default" onClick={onClose} className="font-semibold px-5">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="subtle"
              color="danger"
              leftSection={<IconRefresh size={14} />}
              onClick={handleReset}
              className="font-semibold px-4"
            >
              Reset
            </Button>
            <Button
              size="sm"
              disabled={!selectedLoan}
              onClick={handleSubmit}
              rightSection={<IconArrowRight size={16} />}
              className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 font-semibold px-6"
            >
              Process Repayment
            </Button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}