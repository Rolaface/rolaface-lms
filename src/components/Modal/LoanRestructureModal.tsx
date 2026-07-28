// LoanRestructureModal.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  SegmentedControl,
  Badge,
  Checkbox,
  Modal,
  Table,
} from "@mantine/core";
import {
  IconX,
  IconRestore,
  IconSearch,
  IconCalendarDue,
  IconCalendar,
  IconCalendarStats,
  IconCar,
  IconChevronDown,
  IconCurrencyDollar,
  IconPlus,
  IconClipboardList,
  IconCopy,
  IconArrowRight,
  IconRefresh,
} from "@tabler/icons-react";

/* =========================
 * Types
 * ========================= */
type NpaStatus = "Standard" | "Sub-Standard" | "Doubtful" | "Loss";
type RestructureType = "RATE_CHANGE" | "TOPUP" | "MODIFY_MATURITY";

interface RestructureLoan {
  id: string;
  type: string;
  principalOutstanding: number;
  interestRate: number;
  penaltyRate: number;
  maturityDate: string;
  npaStatus: NpaStatus;
  dpd: number;
}

interface RestructureBorrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: RestructureLoan[];
}

export interface RestructureFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  reason: string | null;
  restructureType: RestructureType;
  newInterestRate?: number;
  newPenaltyRate?: number;
  topupAmount?: number;
  newPrincipalOutstanding?: number;
  newMaturityDate?: string;
  charges: { id: string; label: string; amount: number }[];
  totalCharges: number;
}

interface LoanRestructureModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: RestructureFormData) => void;
}

/* =========================
 * Dummy data
 * ========================= */
const BORROWERS: RestructureBorrower[] = [
  {
    name: "Yash Joshi",
    cif: "1009842",
    phone: "+91 98765 43210",
    status: "Standard",
    loans: [
      {
        id: "LNA-2025-001",
        type: "Vehicle Loan",
        principalOutstanding: 12450,
        interestRate: 9.5,
        penaltyRate: 2,
        maturityDate: "2029-03-15",
        npaStatus: "Standard",
        dpd: 0,
      },
      {
        id: "LNA-2025-089",
        type: "Personal Loan",
        principalOutstanding: 4200,
        interestRate: 11.25,
        penaltyRate: 2.5,
        maturityDate: "2027-11-01",
        npaStatus: "Standard",
        dpd: 0,
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
        principalOutstanding: 284300,
        interestRate: 8.75,
        penaltyRate: 1.5,
        maturityDate: "2041-06-01",
        npaStatus: "Standard",
        dpd: 0,
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
        principalOutstanding: 8600,
        interestRate: 10.5,
        penaltyRate: 3,
        maturityDate: "2028-02-18",
        npaStatus: "Sub-Standard",
        dpd: 98,
      },
      {
        id: "LNA-2025-047",
        type: "Personal Loan",
        principalOutstanding: 2150,
        interestRate: 12,
        penaltyRate: 3.5,
        maturityDate: "2026-12-25",
        npaStatus: "Sub-Standard",
        dpd: 45,
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
        principalOutstanding: 156000,
        interestRate: 7.8,
        penaltyRate: 1,
        maturityDate: "2033-08-10",
        npaStatus: "Standard",
        dpd: 0,
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
        principalOutstanding: 5400,
        interestRate: 11,
        penaltyRate: 3,
        maturityDate: "2027-03-03",
        npaStatus: "Doubtful",
        dpd: 210,
      },
    ],
  },
];

const RESTRUCTURE_REASONS = [
  "Financial Hardship",
  "Rate Renegotiation",
  "Loan Consolidation",
  "Collateral Revaluation",
  "Regulatory Requirement",
  "Other",
];

interface ChargeRow {
  id: string;
  label: string;
  description: string;
  amount: number;
  checked: boolean;
}

const CHARGE_DEFS: ChargeRow[] = [
  {
    id: "processing",
    label: "Restructuring Processing Fee",
    description: "One-time fee for processing the restructure request",
    amount: 1500,
    checked: true,
  },
  {
    id: "documentation",
    label: "Documentation Charges",
    description: "Cost of preparing revised loan agreement documents",
    amount: 500,
    checked: true,
  },
  {
    id: "legal",
    label: "Legal / Valuation Fee",
    description: "Applicable when collateral re-valuation is required",
    amount: 2000,
    checked: true,
  },
  {
    id: "cersai",
    label: "CERSAI / Registration Fee",
    description: "Statutory charge for updating security registration",
    amount: 250,
    checked: true,
  },
  {
    id: "stamp",
    label: "Stamp Duty",
    description: "As applicable per state regulations on revised agreement",
    amount: 0,
    checked: false,
  },
];

/* =========================
 * Helpers
 * ========================= */
const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function npaBadgeColor(status: NpaStatus) {
  if (status === "Standard") return "green";
  if (status === "Sub-Standard") return "gold";
  if (status === "Doubtful") return "accent";
  return "danger";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface ScheduleRow {
  emiNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalEmi: number;
  balance: number;
}

function monthsBetween(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(months, 1);
}

function buildSchedule(
  loan: RestructureLoan | null,
  type: RestructureType,
  newInterestRate: number | "",
  newPrincipalOutstanding: number | "",
  newMaturityDate: string,
  valueDate: string
): ScheduleRow[] {
  if (!loan) return [];
  const principal =
    type === "TOPUP" && newPrincipalOutstanding !== ""
      ? Number(newPrincipalOutstanding)
      : loan.principalOutstanding;
  const annualRate =
    type === "RATE_CHANGE" && newInterestRate !== "" ? Number(newInterestRate) : loan.interestRate;
  const maturity = type === "MODIFY_MATURITY" && newMaturityDate ? newMaturityDate : loan.maturityDate;
  const start = valueDate || todayISO();
  const months = monthsBetween(start, maturity);
  const monthlyRate = annualRate / 12 / 100;

  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  const startDate = new Date(start);
  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    let principalComponent = emi - interest;
    if (i === months) principalComponent = balance;
    balance = Math.max(balance - principalComponent, 0);
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + i);
    rows.push({
      emiNo: i,
      dueDate: due.toISOString().slice(0, 10),
      principal: Math.round(principalComponent * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      totalEmi: Math.round((principalComponent + interest) * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  return rows;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xs" className="font-mono text-gray-700">
        {value}
      </Text>
    </div>
  );
}

function restructureTypeLabel(type: RestructureType) {
  if (type === "RATE_CHANGE") return "Rate Change";
  if (type === "TOPUP") return "Topup";
  return "Modify Maturity";
}

/* =========================
 * Component
 * ========================= */
export function LoanRestructureModal({ opened, onClose, onSubmit }: LoanRestructureModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "charges">("details");

  // Borrower / loan selection
  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<RestructureBorrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Restructure Request fields
  const [valueDate, setValueDate] = useState(todayISO());
  const [reason, setReason] = useState<string | null>(null);
  const [restructureType, setRestructureType] = useState<RestructureType>("RATE_CHANGE");

  // Rate Change
  const [newInterestRate, setNewInterestRate] = useState<number | "">("");
  const [newPenaltyRate, setNewPenaltyRate] = useState<number | "">("");

  // Topup
  const [topupAmount, setTopupAmount] = useState<number | "">("");
  const [newPrincipalOutstanding, setNewPrincipalOutstanding] = useState<number | "">("");

  // Modify Maturity
  const [newMaturityDate, setNewMaturityDate] = useState("");

  // Schedule preview
  const [scheduleOpened, setScheduleOpened] = useState(false);

  // Charges tab
  const [charges, setCharges] = useState<ChargeRow[]>(CHARGE_DEFS.map((c) => ({ ...c })));

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

  const totalCharges = useMemo(
    () => charges.filter((c) => c.checked).reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
    [charges]
  );

  const initLoanFields = (loan: RestructureLoan) => {
    setNewInterestRate(loan.interestRate);
    setNewPenaltyRate(loan.penaltyRate);
    setTopupAmount("");
    setNewPrincipalOutstanding(loan.principalOutstanding);
    setNewMaturityDate(loan.maturityDate);
  };

  const handleSelectBorrower = (borrower: RestructureBorrower) => {
    setSelectedBorrower(borrower);
    setSelectedLoanId(borrower.loans[0]?.id ?? null);
    if (borrower.loans[0]) initLoanFields(borrower.loans[0]);
  };

  const handleSelectLoan = (loan: RestructureLoan) => {
    setSelectedLoanId(loan.id);
    initLoanFields(loan);
  };

  const resetRequestFields = () => {
    setValueDate(todayISO());
    setReason(null);
    setRestructureType("RATE_CHANGE");
    setNewInterestRate("");
    setNewPenaltyRate("");
    setTopupAmount("");
    setNewPrincipalOutstanding("");
    setNewMaturityDate("");
  };

  const handleClearBorrower = () => {
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setSearch("");
    resetRequestFields();
  };

  const handleReset = () => {
    handleClearBorrower();
    setCharges(CHARGE_DEFS.map((c) => ({ ...c })));
    setActiveTab("details");
  };

  const handleTopupAmountChange = (value: number | "") => {
    setTopupAmount(value);
    if (selectedLoan && value !== "") {
      setNewPrincipalOutstanding(
        Math.round((selectedLoan.principalOutstanding + Number(value)) * 100) / 100
      );
    } else if (selectedLoan) {
      setNewPrincipalOutstanding(selectedLoan.principalOutstanding);
    }
  };

  const handleNewPrincipalChange = (value: number | "") => {
    setNewPrincipalOutstanding(value);
    if (selectedLoan && value !== "") {
      setTopupAmount(Math.round((Number(value) - selectedLoan.principalOutstanding) * 100) / 100);
    }
  };

  const toggleCharge = (id: string, checked: boolean) => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, checked } : c)));
  };

  const updateChargeAmount = (id: string, amount: number | "") => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, amount: Number(amount) || 0 } : c)));
  };

  const canSubmit =
    !!selectedLoan &&
    !!reason &&
    !!valueDate &&
    (restructureType === "RATE_CHANGE"
      ? newInterestRate !== "" && newPenaltyRate !== ""
      : restructureType === "TOPUP"
      ? topupAmount !== "" && newPrincipalOutstanding !== ""
      : newMaturityDate !== "");

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleProcess = () => {
    if (!selectedLoan || !selectedBorrower) return;
    onSubmit?.({
      loanAc: selectedLoan.id,
      customerName: selectedBorrower.name,
      loanType: selectedLoan.type,
      valueDate,
      reason,
      restructureType,
      newInterestRate: newInterestRate === "" ? undefined : Number(newInterestRate),
      newPenaltyRate: newPenaltyRate === "" ? undefined : Number(newPenaltyRate),
      topupAmount: topupAmount === "" ? undefined : Number(topupAmount),
      newPrincipalOutstanding:
        newPrincipalOutstanding === "" ? undefined : Number(newPrincipalOutstanding),
      newMaturityDate: newMaturityDate || undefined,
      charges: charges.filter((c) => c.checked).map((c) => ({ id: c.id, label: c.label, amount: c.amount })),
      totalCharges,
    });
    handleReset();
    onClose();
  };

  const scheduleRows = useMemo(
    () =>
      buildSchedule(
        selectedLoan,
        restructureType,
        newInterestRate,
        newPrincipalOutstanding,
        newMaturityDate,
        valueDate
      ),
    [selectedLoan, restructureType, newInterestRate, newPrincipalOutstanding, newMaturityDate, valueDate]
  );

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
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
              <IconRestore size={20} className="text-white" />
            </div>
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                Loan Restructure
              </Text>
              <Text size="xs" c="dimmed">
                Search a borrower and restructure the terms of their loan account.
              </Text>
            </div>
          </div>
          <Button variant="subtle" color="gray" onClick={handleModalClose} className="px-2" size="xs">
            <IconX size={18} />
          </Button>
        </div>

        <div className="border-b border-gray-200" />

        {/* Inner tabs */}
        <div className="p-4 shrink-0">
          <div className="inline-flex bg-gray-100 rounded-md p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "details" ? "bg-white text-[#4F46E5] shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Restructure Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("charges")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "charges" ? "bg-white text-[#4F46E5] shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Restructure Charges
            </button>
          </div>
        </div>

        {activeTab === "details" ? (
          <div className="flex flex-1 overflow-hidden border-t border-gray-100">
            {/* Borrower Selection */}
            <div className="w-[280px] border-r border-gray-200 p-5 shrink-0 overflow-y-auto">
              {!selectedBorrower ? (
                <>
                  <Text size="sm" fw={500} className="text-gray-700 mb-1">
                    Search by Customer Name, A/C No. or Phone
                  </Text>
                  <TextInput
                    size="sm"
                    placeholder="e.g. Yash Joshi, 9876543210..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    leftSection={<IconSearch size={14} className="text-gray-400" />}
                    classNames={labelClass}
                  />
                  <Text size="xs" c="dimmed" className="mt-1.5 mb-4">
                    Search matches customer name, loan A/C number, or phone number.
                  </Text>

                  {search.trim() && (
                    <div className="flex flex-col gap-2">
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
                            <Text size="sm" fw={700} className="text-gray-900">
                              {borrower.name}
                            </Text>
                            <Text size="xs" c="dimmed" className="mt-0.5">
                              CIF: {borrower.cif} · {borrower.phone}
                            </Text>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-md border border-[#a5b4fc] bg-[#eef2ff] p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <Text size="sm" fw={700} className="text-gray-900">
                        {selectedBorrower.name}
                      </Text>
                      <button
                        type="button"
                        onClick={handleClearBorrower}
                        className="text-xs font-semibold text-[#4F46E5] hover:text-[#3730A3] shrink-0"
                      >
                        Change
                      </button>
                    </div>
                    <Text size="xs" c="dimmed" className="mt-0.5">
                      CIF: {selectedBorrower.cif} | {selectedBorrower.phone}
                    </Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color={selectedBorrower.status === "Overdue" ? "danger" : "green"}
                      className="mt-2 font-semibold tracking-wider"
                      styles={{ root: { fontSize: 10 } }}
                    >
                      {selectedBorrower.status.toUpperCase()}
                    </Badge>
                  </div>

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
                          Balance: {formatCurrency(loan.principalOutstanding)} | Maturity: {loan.maturityDate}
                        </Text>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Restructure Request form */}
            <div className="flex-1 p-6 overflow-y-auto">
              {!selectedLoan ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <IconClipboardList size={40} className="opacity-50" />
                  <Text c="dimmed" size="sm" ta="center" maw={280}>
                    Select a borrower and loan account on the left to begin the restructure.
                  </Text>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />
                    <Text fw={700} size="sm" className="text-gray-900">
                      Restructure Request
                    </Text>
                  </div>

                  <div>
                    <Text size="sm" fw={500} className="text-gray-700 mb-1">
                      Selected Loan A/C Number
                    </Text>
                    <div className="flex items-center gap-2 rounded-md border border-[#a5b4fc] bg-[#eef2ff] px-3 py-2.5">
                      <IconCar size={14} className="text-[#4F46E5]" />
                      <Text size="sm" fw={700} className="text-gray-900 font-mono">
                        {selectedLoan.id}
                      </Text>
                      <Text size="xs" c="dimmed">
                        ({selectedLoan.type})
                      </Text>
                    </div>
                  </div>

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
                    <Select
                      size="sm"
                      withAsterisk
                      label="Reason for Restructure"
                      placeholder="Select a reason"
                      data={RESTRUCTURE_REASONS}
                      value={reason}
                      onChange={setReason}
                      rightSection={chevronDown}
                      classNames={labelClass}
                    />
                  </div>

                  <div className="border-t border-gray-100" />

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />
                      <Text fw={700} size="sm" className="text-gray-900">
                        Restructure Type
                      </Text>
                    </div>
                    <SegmentedControl
                      fullWidth
                      color="brand"
                      value={restructureType}
                      onChange={(v) => setRestructureType(v as RestructureType)}
                      data={[
                        { label: "Rate Change", value: "RATE_CHANGE" },
                        { label: "Topup", value: "TOPUP" },
                        { label: "Modify Maturity", value: "MODIFY_MATURITY" },
                      ]}
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    {restructureType === "RATE_CHANGE" && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <IconCurrencyDollar size={16} className="text-[#4F46E5]" />
                          <Text fw={700} size="sm" className="text-gray-900">
                            Rate Change Details
                          </Text>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <NumberInput
                            size="sm"
                            withAsterisk
                            label="New Interest Rate (%)"
                            value={newInterestRate}
                            onChange={(v) => setNewInterestRate(v as number | "")}
                            decimalScale={2}
                            classNames={labelClass}
                          />
                          <NumberInput
                            size="sm"
                            withAsterisk
                            label="Penalty Rate (%)"
                            value={newPenaltyRate}
                            onChange={(v) => setNewPenaltyRate(v as number | "")}
                            decimalScale={2}
                            classNames={labelClass}
                          />
                        </div>
                      </>
                    )}

                    {restructureType === "TOPUP" && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <IconPlus size={16} className="text-[#4F46E5]" />
                          <Text fw={700} size="sm" className="text-gray-900">
                            Topup Details
                          </Text>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <NumberInput
                            size="sm"
                            withAsterisk
                            label="Topup Amount"
                            placeholder="e.g. 2000"
                            value={topupAmount}
                            onChange={(v) => handleTopupAmountChange(v as number | "")}
                            leftSection={<IconCurrencyDollar size={14} className="text-[#F26522]" />}
                            thousandSeparator=","
                            classNames={labelClass}
                          />
                          <NumberInput
                            size="sm"
                            withAsterisk
                            label="New Principal Outstanding"
                            value={newPrincipalOutstanding}
                            onChange={(v) => handleNewPrincipalChange(v as number | "")}
                            leftSection={<IconCurrencyDollar size={14} className="text-[#F26522]" />}
                            thousandSeparator=","
                            classNames={labelClass}
                          />
                        </div>
                      </>
                    )}

                    {restructureType === "MODIFY_MATURITY" && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <IconCalendar size={16} className="text-[#4F46E5]" />
                          <Text fw={700} size="sm" className="text-gray-900">
                            Maturity Details
                          </Text>
                        </div>
                        <TextInput
                          size="sm"
                          withAsterisk
                          type="date"
                          label="New Maturity Date"
                          value={newMaturityDate}
                          onChange={(e) => setNewMaturityDate(e.currentTarget.value)}
                          classNames={labelClass}
                          className="max-w-[260px]"
                        />
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    color="brand"
                    size="sm"
                    leftSection={<IconCalendarStats size={14} />}
                    onClick={() => setScheduleOpened(true)}
                    className="self-start font-semibold"
                  >
                    View New Schedule
                  </Button>
                </div>
              )}
            </div>

            {/* Before Restructure summary */}
            <div className="w-[280px] border-l border-gray-200 p-5 shrink-0 overflow-y-auto">
              <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wide mb-3">
                Before Restructure
              </Text>

              {!selectedLoan ? (
                <div className="flex flex-col items-center justify-center text-gray-400 gap-2 py-16">
                  <IconCopy size={36} className="opacity-50" />
                  <Text c="dimmed" size="xs" ta="center" maw={200}>
                    Loan summary will appear here once an account is selected.
                  </Text>
                </div>
              ) : (
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

                  <div className="bg-gray-50/60 border border-gray-100 rounded-md p-3 flex flex-col gap-1.5">
                    <SummaryRow label="Principal Outstanding" value={formatCurrency(selectedLoan.principalOutstanding)} />
                    <SummaryRow label="Interest Rate" value={`${selectedLoan.interestRate}%`} />
                    <SummaryRow label="Penalty Rate" value={`${selectedLoan.penaltyRate}%`} />
                    <SummaryRow label="Maturity Date" value={selectedLoan.maturityDate} />
                    <div className="flex justify-between items-center">
                      <Text size="xs" c="dimmed">
                        NPA Status
                      </Text>
                      <Badge
                        size="sm"
                        variant="light"
                        color={npaBadgeColor(selectedLoan.npaStatus)}
                        styles={{ root: { fontSize: 10 } }}
                      >
                        {selectedLoan.npaStatus}
                      </Badge>
                    </div>
                    <SummaryRow label="DPD (Days Past Due)" value={`${selectedLoan.dpd} days`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-gray-100 overflow-y-auto flex-1">
            <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm">
              <Table.Thead>
                <Table.Tr className="border-b border-gray-200">
                  <Table.Th style={{ width: 36 }} />
                  <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>
                    CHARGE TYPE
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>
                    DESCRIPTION
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>
                    AMOUNT ($)
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {charges.map((c) => (
                  <Table.Tr key={c.id} className="border-b border-gray-100 last:border-0">
                    <Table.Td>
                      <Checkbox
                        size="sm"
                        color="brand"
                        checked={c.checked}
                        onChange={(e) => toggleCharge(c.id, e.currentTarget.checked)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} className="text-gray-900">
                        {c.label}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {c.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        value={c.amount}
                        onChange={(v) => updateChargeAmount(c.id, v as number | "")}
                        disabled={!c.checked}
                        thousandSeparator=","
                        decimalScale={2}
                        className="w-32 ml-auto"
                        styles={{ input: { textAlign: "right" } }}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              <Text size="sm" c="dimmed">
                Total Restructure Charges
              </Text>
              <Text size="lg" fw={700} className="text-[#4F46E5]">
                {formatCurrency(totalCharges)}
              </Text>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0">
          <Button size="sm" variant="default" onClick={handleModalClose} className="font-semibold px-5">
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
              disabled={!canSubmit}
              onClick={handleProcess}
              rightSection={<IconArrowRight size={16} />}
              className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 font-semibold px-6"
            >
              Process Restructure
            </Button>
          </div>
        </div>
      </Box>

      {/* Projected schedule preview */}
      <Modal
        opened={scheduleOpened}
        onClose={() => setScheduleOpened(false)}
        withCloseButton={false}
        size="900px"
        radius="md"
        padding={0}
      >
        <Box className="flex flex-col max-h-[85vh]">
          <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
            <div>
              <Text size="md" fw={700} className="text-gray-900 leading-tight">
                New Repayment Schedule
              </Text>
              <Text size="xs" c="dimmed" className="mt-0.5">
                Projected schedule based on the updated restructure terms.
              </Text>
            </div>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setScheduleOpened(false)}
              className="px-2"
              size="xs"
            >
              <IconX size={18} />
            </Button>
          </div>

          {selectedLoan && (
            <div className="flex flex-wrap gap-2 px-6 pb-4 shrink-0">
              <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                Type: {restructureTypeLabel(restructureType)}
              </Badge>
              {restructureType === "RATE_CHANGE" && (
                <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                  New Rate: {newInterestRate === "" ? selectedLoan.interestRate : newInterestRate}%
                </Badge>
              )}
              {restructureType === "TOPUP" && (
                <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                  Topup: {formatCurrency(Number(topupAmount) || 0)}
                </Badge>
              )}
              {restructureType === "MODIFY_MATURITY" && (
                <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                  New Maturity: {newMaturityDate || selectedLoan.maturityDate}
                </Badge>
              )}
              <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                Penalty: {newPenaltyRate === "" ? selectedLoan.penaltyRate : newPenaltyRate}%
              </Badge>
              <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                Principal:{" "}
                {formatCurrency(
                  restructureType === "TOPUP" && newPrincipalOutstanding !== ""
                    ? Number(newPrincipalOutstanding)
                    : selectedLoan.principalOutstanding
                )}
              </Badge>
            </div>
          )}

          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" stickyHeader>
              <Table.Thead>
                <Table.Tr className="border-b border-gray-200">
                  <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>
                    INSTALLMENT
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>
                    DUE DATE
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>
                    PRINCIPAL
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>
                    INTEREST
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>
                    TOTAL EMI
                  </Table.Th>
                  <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>
                    BALANCE
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {scheduleRows.map((row) => (
                  <Table.Tr key={row.emiNo} className="border-b border-gray-100 last:border-0">
                    <Table.Td>#{row.emiNo}</Table.Td>
                    <Table.Td>{row.dueDate}</Table.Td>
                    <Table.Td className="text-right font-mono">{formatCurrency(row.principal)}</Table.Td>
                    <Table.Td className="text-right font-mono">{formatCurrency(row.interest)}</Table.Td>
                    <Table.Td className="text-right font-mono font-semibold">
                      {formatCurrency(row.totalEmi)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono">{formatCurrency(row.balance)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <div className="border-t border-gray-200 p-4 px-6 flex justify-end shrink-0">
            <Button size="sm" variant="default" onClick={() => setScheduleOpened(false)} className="font-semibold px-5">
              Close
            </Button>
          </div>
        </Box>
      </Modal>
    </Modal>
  );
}