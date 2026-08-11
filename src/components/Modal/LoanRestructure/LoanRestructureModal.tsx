// LoanRestructureModal.tsx
import { useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Badge,
  Modal,
  Table,
  ThemeIcon,
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
      <Text size="xs" className="font-mono text-gray-700">
        {value}
      </Text>
    </div>
  );
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
          <Box style={{ height: CONTENT_HEIGHT, overflow: "hidden" }} className="border-t border-gray-100">
            <div className="flex h-full overflow-hidden">
              {/* Borrower Selection — always visible, independent of tab */}
              <div className="w-[260px] border-r border-gray-200 p-3 shrink-0 overflow-y-auto">
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
                          className={`text-left rounded-md border p-3 transition-colors ${selectedLoanId === loan.id
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

              {/* Center: Restructure Request + Tabs + tab-specific content */}
              <div className="flex-1 overflow-y-auto">
                {!selectedLoan ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 p-6">
                    <IconClipboardList size={40} className="opacity-50" />
                    <Text c="dimmed" size="sm" ta="center" maw={280}>
                      Select a borrower and loan account on the left to begin the restructure.
                    </Text>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Restructure Request — top fields, always visible */}
                    <div className="p-4 pb-3 flex flex-col gap-3">                      <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />
                      <Text fw={700} size="sm" className="text-gray-900">
                        Restructure Request
                      </Text>
                    </div>

                      <div>
                        <Text size="sm" fw={500} className="text-gray-700 mb-1">
                          Selected Loan A/C Number
                        </Text>
                        <div className="flex items-center gap-2 rounded-md border border-[#a5b4fc] bg-[#eef2ff] px-4 py-1">
                          <IconCar size={12} className="text-[#4F46E5]" />
                          <Text size="sm" fw={700} className="text-gray-900 font-mono">
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
                    <div className="px-4  border-b border-gray-200">
                      <div className="inline-flex gap-6">
                        <button
                          type="button"
                          onClick={() => setActiveTab("details")}
                          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "details"
                              ? "border-[#4F46E5] text-gray-900"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                          Restructure Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("charges")}
                          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "charges"
                              ? "border-[#4F46E5] text-gray-900"
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