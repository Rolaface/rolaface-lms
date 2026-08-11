// LoanRestructureModal.tsx
import { useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Box,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Badge,
  Modal,
  Table,
  ScrollArea,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import {
  IconX,
  IconRestore,
  IconSearch,
  IconCalendarDue,
  IconCar,
  IconClipboardList,
  IconCopy,
  IconChevronDown,
  IconUserSearch,
  IconBuildingBank,
} from "@tabler/icons-react";

import { parseFrappeError } from "../../../utils/parseFrappeError";
import { showSuccess, showApiError } from "../../../utils/alert";
import { ModalFooter } from "../../shared/ModalFooter";
import type {
  RestructureType,
  RestructureLoan,
  RestructureBorrower,
  RestructureFormData,
  ChargeRow,
} from "./RestructureTypes";
import { formatCurrency } from "./RestructureTypes";
import {

  BORROWERS,
  RESTRUCTURE_REASONS,
  CHARGE_DEFS,
  CONTENT_HEIGHT,
  npaBadgeColor,
  todayISO,
  buildSchedule,
  restructureTypeLabel,
} from "./RestructureTypes"
import { RestructureDetailsTab } from "./RestructureDetailsTab";
import { RestructureChargesTab } from "./RestructureChargesTab";

export type { RestructureFormData };

interface LoanRestructureModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: RestructureFormData) => void | Promise<void>;
}

const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xs" ff="monospace" c="slate.6">
        {value}
      </Text>
    </div>
  );
}

/* =========================
 * Component
 * ========================= */
export function LoanRestructureModal({ opened, onClose, onSubmit }: LoanRestructureModalProps) {
  const theme = useMantineTheme();
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

  // Submit state (mirrors the useMutation isPending flag used elsewhere)
  const [isProcessing, setIsProcessing] = useState(false);

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
    setActiveTab("details");
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

  const handleProcess = async () => {
    if (!selectedLoan || !selectedBorrower) return;

    if (!canSubmit) {
      showApiError("Please complete all required fields before processing the restructure.");
      return;
    }

    const payload: RestructureFormData = {
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
    };

    try {
      setIsProcessing(true);
      await onSubmit?.(payload);
      showSuccess("Loan restructured successfully.");
      handleReset();
      onClose();
    } catch (err) {
      showApiError(parseFrappeError(err));
    } finally {
      setIsProcessing(false);
    }
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
      padding={0}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: "flex", flexDirection: "column" },
      }}
    >
      <Box bg="white" className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: "1px solid var(--mantine-color-brand-7)" }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconRestore size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                Loan Restructure
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Search a borrower and restructure the terms of their loan account.
              </Text>
            </Box>
          </Group>
          <ActionIcon
            variant="subtle"
            color="white"
            radius="xl"
            size="md"
            onClick={handleModalClose}
            aria-label="Close"
          >
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProcess();
          }}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* Fixed-height body: BOTH tabs use this exact height so the modal
              never resizes when switching tabs. Each tab scrolls internally. */}
          <Box style={{ height: CONTENT_HEIGHT, overflow: "hidden" }}>
            <div className="flex h-full overflow-hidden">
              {/* Borrower Selection — always visible, independent of tab */}
              <div
                className="w-[300px] shrink-0 flex flex-col"
                style={{ borderRight: "1px solid var(--mantine-color-slate-2)" }}
              >
                <div className="p-5 pb-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
                    <IconUserSearch size={15} style={{ color: "var(--mantine-color-brand-6)" }} />
                    <Text size="sm" fw={700} c="slate.8">
                      Borrower Selection
                    </Text>
                  </div>
                  <Text size="xs" c="dimmed" className="ml-5 mb-4">
                    Search by A/C no, phone or name
                  </Text>

                  {!selectedBorrower && (
                    <TextInput
                      size="sm"
                      placeholder="e.g. Yash Joshi, 9876543210..."
                      value={search}
                      onChange={(e) => setSearch(e.currentTarget.value)}
                      leftSection={<IconSearch size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
                    />
                  )}
                </div>

                <ScrollArea className="flex-1 px-5 pb-5" scrollbarSize={6} type="hover">
                  {selectedBorrower ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">
                          Selected Borrower
                        </Text>
                        <Anchor
                          component="button"
                          type="button"
                          onClick={handleClearBorrower}
                          size="xs"
                          fw={700}
                          c="brand.6"
                          underline="never"
                          styles={{ root: { "&:hover": { color: "var(--mantine-color-brand-7)" } } }}
                        >
                          Change
                        </Anchor>
                      </div>
                      <div
                        className="text-left rounded-md"
                        style={{
                          border: "1px solid var(--mantine-color-brand-3)",
                          background: "var(--mantine-color-brand-0)",
                          paddingTop: "1rem",
                          paddingBottom: "1rem",
                          paddingLeft: "1.25rem",
                          paddingRight: "1rem",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <Text size="sm" fw={700} c="slate.8">
                            {selectedBorrower.name}
                          </Text>
                          <Badge
                            size="sm"
                            variant="light"
                            color={selectedBorrower.status === "Overdue" ? "danger" : "success"}
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
                      <div className="flex flex-col gap-2">
                        {matches.length === 0 ? (
                          <Text size="xs" c="dimmed" className="py-2">
                            No borrowers found.
                          </Text>
                        ) : (
                          matches.map((borrower) => (
                            <UnstyledButton
                              key={borrower.cif}
                              type="button"
                              onClick={() => handleSelectBorrower(borrower)}
                              className="text-left rounded-md transition-colors w-full"
                              style={{
                                border: "1px solid var(--mantine-color-slate-2)",
                                paddingTop: "1rem",
                                paddingBottom: "1rem",
                                paddingLeft: "1.25rem",
                                paddingRight: "1rem",
                              }}
                              styles={{ root: { "&:hover": { backgroundColor: "var(--mantine-color-slate-1)" } } }}
                            >
                              <div className="flex items-center justify-between">
                                <Text size="sm" fw={700} c="slate.8">
                                  {borrower.name}
                                </Text>
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={borrower.status === "Overdue" ? "danger" : "success"}
                                  styles={{ root: { fontSize: 10 } }}
                                >
                                  {borrower.status}
                                </Badge>
                              </div>
                              <Text size="xs" c="dimmed" className="mt-0.5">
                                CIF: {borrower.cif} · {borrower.phone}
                              </Text>
                            </UnstyledButton>
                          ))
                        )}
                      </div>
                    )
                  )}

                  {selectedBorrower && (
                    <div className="mt-5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <IconBuildingBank size={13} style={{ color: "var(--mantine-color-slate-4)" }} />
                        <Text size="xs" fw={600} c="dimmed" className="uppercase tracking-wide">
                          Select Active Loan Account
                        </Text>
                      </div>
                      <div className="flex flex-col gap-2">
                        {selectedBorrower.loans.map((loan) => {
                          const isSelected = selectedLoanId === loan.id;
                          return (
                            <UnstyledButton
                              key={loan.id}
                              type="button"
                              onClick={() => handleSelectLoan(loan)}
                              className="text-left rounded-md transition-colors w-full"
                              style={{
                                border: isSelected
                                  ? "1px solid var(--mantine-color-brand-4)"
                                  : "1px solid var(--mantine-color-slate-2)",
                                background: isSelected ? "var(--mantine-color-brand-0)" : "var(--mantine-color-white)",
                                boxShadow: isSelected ? "0 0 0 1px var(--mantine-color-brand-2)" : "none",
                                paddingTop: "1rem",
                                paddingBottom: "1rem",
                                paddingLeft: "1.25rem",
                                paddingRight: "1rem",
                              }}
                              styles={{
                                root: {
                                  "&:hover": !isSelected ? { backgroundColor: "var(--mantine-color-slate-1)" } : undefined,
                                },
                              }}
                            >
                              <Text size="sm" fw={700} c="slate.8">
                                {loan.type} - {loan.id}
                              </Text>
                              <Text size="xs" c="dimmed" className="mt-0.5">
                                Balance: {formatCurrency(loan.principalOutstanding)} | Maturity: {loan.maturityDate}
                              </Text>
                            </UnstyledButton>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Center: Restructure Request + Tabs + tab-specific content */}
              <div className="flex-1 overflow-y-auto">
                {!selectedLoan ? (
                  <div className="h-full flex items-center justify-center p-6">
                    <div
                      className="w-full max-w-[440px] rounded-lg p-8 flex flex-col items-center text-center"
                      style={{
                        background: "var(--mantine-color-white)",
                        border: "1px solid var(--mantine-color-slate-2)",
                        boxShadow: "var(--mantine-shadow-md)",
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: "var(--mantine-color-brand-0)",
                          border: "1px solid var(--mantine-color-brand-2)",
                        }}
                      >
                        <IconClipboardList size={26} style={{ color: "var(--mantine-color-brand-6)" }} />
                      </div>
                      <Text size="lg" fw={700} c="slate.8">
                        No Loan Account Selected
                      </Text>
                      <Text size="sm" c="dimmed" className="mt-2" maw={340}>
                        To proceed with the restructure, first search for a borrower and select one
                        of their active loan accounts from the panel on the left.
                      </Text>
                      <div
                        className="w-full rounded-md mt-5 py-3 px-4"
                        style={{
                          background: "var(--mantine-color-slate-1)",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <Text size="xs" fw={700} c="brand.6" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                          Next Step
                        </Text>
                        <Text size="sm" c="slate.7" className="mt-1">
                          Select a borrower → Choose a loan account → Restructure terms
                        </Text>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Restructure Request — top fields, always visible */}
                    <div className="p-4 pb-3 flex flex-col gap-3">                      <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
                      <Text fw={700} size="sm" c="slate.8">
                        Restructure Request
                      </Text>
                    </div>

                      <div>
                        <Text size="sm" fw={500} className="text-gray-700 mb-1">
                          Selected Loan A/C Number
                        </Text>
                        <div
                          className="flex items-center gap-2 rounded-md px-4 py-1"
                          style={{
                            border: "1px solid var(--mantine-color-brand-3)",
                            background: "var(--mantine-color-brand-0)",
                          }}
                        >
                          <IconCar size={12} style={{ color: "var(--mantine-color-brand-6)" }} />
                          <Text size="sm" fw={700} c="slate.8" className="font-mono">
                            {selectedLoan.id}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({selectedLoan.type})
                          </Text>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <TextInput
                          size="sm"
                          withAsterisk
                          type="date"
                          label="Value Date"
                          value={valueDate}
                          onChange={(e) => setValueDate(e.currentTarget.value)}
                          leftSection={<IconCalendarDue size={14} className="text-emerald-600" />}
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
                        />
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-4" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
                      <div className="inline-flex gap-6">
                        <button
                          type="button"
                          onClick={() => setActiveTab("details")}
                          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "details"
                              ? "border-[color:var(--mantine-color-brand-6)] text-gray-900"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                          Restructure Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("charges")}
                          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "charges"
                              ? "border-[color:var(--mantine-color-brand-6)] text-gray-900"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                          Restructure Charges
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 mt-1" />

                    {/* Tab content — delegated to standalone tab components */}
                    <div className="px-1 py-1">
                      {activeTab === "details" ? (
                        <RestructureDetailsTab
                          restructureType={restructureType}
                          setRestructureType={setRestructureType}
                          newInterestRate={newInterestRate}
                          setNewInterestRate={setNewInterestRate}
                          newPenaltyRate={newPenaltyRate}
                          setNewPenaltyRate={setNewPenaltyRate}
                          topupAmount={topupAmount}
                          onTopupAmountChange={handleTopupAmountChange}
                          newPrincipalOutstanding={newPrincipalOutstanding}
                          onNewPrincipalChange={handleNewPrincipalChange}
                          newMaturityDate={newMaturityDate}
                          setNewMaturityDate={setNewMaturityDate}
                          onViewSchedule={() => setScheduleOpened(true)}
                        />
                      ) : (
                        <RestructureChargesTab
                          charges={charges}
                          totalCharges={totalCharges}
                          onToggleCharge={toggleCharge}
                          onUpdateChargeAmount={updateChargeAmount}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Before Restructure summary — always visible, independent of tab */}
              <div
                className="w-[300px] p-5 shrink-0 flex flex-col shadow-[var(--mantine-shadow-lg)]"
                style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
                  <Text size="sm" fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                    Before Restructure
                  </Text>
                </div>

                {!selectedLoan ? (
                  <Text size="xs" c="dimmed" className="py-8 text-center">
                    Loan summary will appear here once an account is selected.
                  </Text>
                ) : (
                  <ScrollArea className="flex-1" scrollbarSize={6} type="hover">
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex items-center gap-2 rounded-md p-2.5"
                        style={{
                          background: "var(--mantine-color-slate-1)",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <div
                          className="p-1.5 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: "var(--mantine-color-brand-0)" }}
                        >
                          <IconCar size={14} style={{ color: "var(--mantine-color-brand-6)" }} />
                        </div>
                        <div>
                          <Text size="xs" c="dimmed">
                            {selectedLoan.type}
                          </Text>
                          <Text size="sm" fw={700} c="slate.8" className="font-mono">
                            {selectedLoan.id}
                          </Text>
                        </div>
                      </div>

                      <div
                        className="rounded-md p-2.5"
                        style={{
                          background: "var(--mantine-color-slate-1)",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
                        <Text size="xs" c="dimmed">
                          Customer
                        </Text>
                        <Text size="sm" fw={600} c="slate.8">
                          {selectedBorrower?.name}
                        </Text>
                      </div>

                      <div
                        className="rounded-md p-3 flex flex-col gap-2"
                        style={{
                          background: "var(--mantine-color-slate-1)",
                          border: "1px solid var(--mantine-color-slate-2)",
                        }}
                      >
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
                  </ScrollArea>
                )}
              </div>
            </div>
          </Box>

          {/* Footer */}
          <ModalFooter
            variant="theme"
            isViewMode={false}
            onClose={handleModalClose}
            onSubmit={handleProcess}
            submitLabel="Save"
            submitLoading={isProcessing}
            submitDisabled={!canSubmit}
          />
        </form>
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