// @TODO:No need of Nature of Payment, remove the Nature of Payment

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Modal,
  Badge,
  ActionIcon,
  Tooltip,
  Table,
} from "@mantine/core";
import {
  IconX,
  IconSearch,
  IconChevronRight,
  IconChevronLeft,
  IconArrowRight,
  IconRefresh,
  IconWallet,
  IconCalendarDue,
  IconChecklist,
  IconNotes,
} from "@tabler/icons-react";

interface LoanWaiverModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanWaiverFormData) => void;
}

export interface LoanWaiverFormData {
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
}

interface Borrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: LoanAccount[];
}

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
        penalty: 10,
        lateFees: 25,
      },
      {
        id: "LNA-2025-089",
        type: "Personal Loan",
        balance: 4200,
        emiDate: "12th of Month",
        principalDue: 210,
        interestDue: 65,
        penalty: 10,
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
        penalty: 10,
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
        penalty: 10,
        lateFees: 40,
      },
      {
        id: "LNA-2025-047",
        type: "Personal Loan",
        balance: 2150,
        emiDate: "25th of Month",
        principalDue: 175,
        interestDue: 42.5,
        penalty: 10,
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
        penalty: 10,
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
        penalty: 10,
        lateFees: 60,
      },
    ],
  },
];

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function LoanWaiverModal({ opened, onClose, onSubmit }: LoanWaiverModalProps) {
  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);

  const [valueDate, setValueDate] = useState(new Date().toISOString().slice(0, 10));
  const [natureOfPayment, setNatureOfPayment] = useState<LoanWaiverFormData["natureOfPayment"]>(
    "PAY_DUES"
  );
  const [amountToPay, setAmountToPay] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<string | null>("Direct Debit from A/C");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [remark, setRemark] = useState("");

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
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="1300px"
        withCloseButton={false}
        padding={0}
        radius="md"
      >
        <Box className="flex flex-col h-[640px] max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#3730A3] flex items-center justify-center">
                <IconWallet size={20} className="text-white" />
              </div>
              <div>
                <Text size="md" fw={700} className="text-gray-900 leading-tight">
                  Loan Waiver
                </Text>
                <Text size="xs" c="dimmed">
                  Search a borrower and process a waiver against their loan account.
                </Text>
              </div>
            </div>
            <Button variant="subtle" color="gray" onClick={onClose} className="px-2" size="xs">
              <IconX size={18} />
            </Button>
          </div>

          <div className="border-b border-gray-200" />

          <div className="flex flex-1 overflow-hidden">
            <div
              className={`border-r border-gray-200 shrink-0 overflow-y-auto transition-all duration-200 ${
                borrowerPanelCollapsed ? "w-14 p-3" : "w-[300px] p-5"
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
                            className={`text-left rounded-md border p-3 transition-colors ${
                              selectedLoanId === loan.id
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

            <div className="relative flex-1 overflow-y-auto p-6">
              <div
                className={`flex h-full flex-col rounded-lg border border-gray-200 p-4 transition-all duration-300 ${
                  !selectedLoan
                    ? "pointer-events-none select-none opacity-50 blur-[2px]"
                    : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                  <IconChecklist size={16} className="text-[#4F46E5]" />

                  <Text
                    size="sm"
                    fw={700}
                    className="text-gray-900 flex items-center gap-2"
                  >
                    Executing Waiver for
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[#4338CA] font-semibold">
                      {selectedLoan?.id ?? "—"}
                    </span>

                    <span className="text-gray-400">/</span>

                    <span className="rounded bg-orange-100 px-2 py-0.5 text-[#EA580C] font-semibold">
                      {selectedBorrower?.name ?? "—"}
                    </span>
                  </Text>
                </div>

                {/* Value Date */}
                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
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
                </div>

                {/* Waiver Breakdown */}
                <div className="mt-6">
                  <Text
                    size="sm"
                    fw={600}
                    className="text-gray-900 mb-3"
                  >
                    Waiver Breakdown
                  </Text>

                  <Table
                    withTableBorder
                    withColumnBorders
                    striped
                    highlightOnHover
                    verticalSpacing="sm"
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th className="w-[180px]">Component</Table.Th>
                        <Table.Th className="text-right w-[180px]">
                          Arrears
                        </Table.Th>
                        <Table.Th className="text-right w-[180px]">
                          Waived Amount
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>

                      <Table.Tr>
                        <Table.Td>Interest</Table.Td>

                        <Table.Td className="font-mono text-right">
                          $3,000.00
                        </Table.Td>

                        <Table.Td>
                          <NumberInput
                            hideControls
                            placeholder="0.00"
                            thousandSeparator=","
                            decimalScale={2}
                          />
                        </Table.Td>
                      </Table.Tr>

                      <Table.Tr>
                        <Table.Td>Penalty</Table.Td>

                        <Table.Td className="font-mono text-right">
                          $4,000.00
                        </Table.Td>

                        <Table.Td>
                          <NumberInput
                            hideControls
                            placeholder="0.00"
                            thousandSeparator=","
                            decimalScale={2}
                          />
                        </Table.Td>
                      </Table.Tr>

                      <Table.Tr>
                        <Table.Td>Charge / Fee</Table.Td>

                        <Table.Td className="font-mono text-right">
                          $200.00
                        </Table.Td>

                        <Table.Td>
                          <NumberInput
                            hideControls
                            placeholder="0.00"
                            thousandSeparator=","
                            decimalScale={2}
                          />
                        </Table.Td>
                      </Table.Tr>

                    </Table.Tbody>
                  </Table>
                </div>

                {/* Remarks */}
                <TextInput
                  size="sm"
                  label="Remark"
                  placeholder="Add a note about this waiver (optional)"
                  value={remark}
                  onChange={(e) => setRemark(e.currentTarget.value)}
                  leftSection={<IconNotes size={14} className="text-gray-400" />}
                  classNames={labelClass}
                />
              </div>

              {!selectedLoan && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/55 backdrop-blur-[3px]">
                  <div className="w-[440px] rounded-2xl border border-[#dbe4ff] bg-white shadow-2xl">
                    <div className="flex justify-center pt-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] ring-1 ring-[#C7D2FE]">
                        <IconChecklist size={30} className="text-[#4338CA]" />
                      </div>
                    </div>
                    <div className="px-8 py-6 text-center">
                      <Text size="xl" fw={700} className="text-gray-900">
                        No Loan Account Selected
                      </Text>
                      <Text size="sm" c="dimmed" className="mt-3 leading-6">
                        To proceed with a waiver transaction, first search for a borrower
                        and select one of their active loan accounts from the panel on the
                        left.
                      </Text>
                      <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                        <Text size="xs" fw={600} className="uppercase tracking-wide text-[#4F46E5]">
                          Next Step
                        </Text>
                        <Text size="sm" className="mt-1 text-gray-700">
                          Select a borrower → Choose a loan account → Process waiver
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                        Penalty
                      </Text>
                      <Text size="xs" className="font-mono text-gray-700">
                        {formatCurrency(selectedLoan.penalty)}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text size="xs" c="dimmed">
                        Fees/Charges
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
                Process Waiver
              </Button>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}