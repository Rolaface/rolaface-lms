import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon, Anchor, Box, Text, Group, Button, TextInput, Select, Badge,
  Modal, Table, ScrollArea, ThemeIcon, UnstyledButton, useMantineTheme, Loader,
  Tooltip,
} from "@mantine/core";
import {
  IconX, IconRestore, IconSearch, IconCalendarDue, IconCar, IconClipboardList,
  IconChevronDown, IconUserSearch, IconBuildingBank,
} from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { ModalFooter } from "../../shared/ModalFooter";
import { useCompanyStore } from "../../../store/companyStore";
import { formatAmount, useCurrencyReady } from "../../../store/currencyStore";
import { useLoanRestructureForm } from "../../../hooks/useLoanRestructureForm";
import {
  CONTENT_HEIGHT, RESTRUCTURE_REASONS, buildSchedule, npaBadgeColor, restructureTypeLabel,
} from "../../../types/RestructureTypes";
import { RestructureDetailsTab } from "./RestructureDetailsTab";
import { RestructureChargesTab } from "./RestructureChargesTab";

interface LoanRestructureModalProps {
  opened: boolean;
  onClose: () => void;
  editName?: string | null;
  viewName?: string | null;
  onSaved: () => void;
}

type CenterTab = "DETAILS" | "CHARGES";

const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="xs" ff="monospace" c="slate.6">{value}</Text>
    </div>
  );
}

export function LoanRestructureModal({ opened, onClose, editName, viewName, onSaved }: LoanRestructureModalProps) {
  const theme = useMantineTheme();
  const baseCurrency = useCompanyStore((s) => s.baseCurrency);
  const currencyReady = useCurrencyReady();
  const fmt = (v: number | string | null | undefined) =>
    currencyReady ? formatAmount(baseCurrency, v, { withSymbol: true }) : String(v ?? "");

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return "—";
    const d = dayjs(value);
    return d.isValid() ? d.format("DD-MMM-YYYY") : String(value);
  };
  const toDateValue = (iso: string | null | undefined): Date | null =>
    iso && dayjs(iso).isValid() ? dayjs(iso).toDate() : null;

  const {
    isViewMode, isLoadingRecord,
    search, setSearch, matches, searchLoading,
    selectedBorrower, selectedLoanId, selectedLoan, loanLocked,
    handleSelectBorrower, handleSelectLoan, handleClearBorrower,
    valueDate, setValueDate, reason, setReason,
    restructureType, setRestructureType,
    newInterestRate, setNewInterestRate, newPenaltyRate, setNewPenaltyRate,
    topupAmount, handleTopupAmountChange, newPrincipalOutstanding, handleNewPrincipalChange,
    currentPrincipalOutstanding, handleCurrentPrincipalChange,
    extendTenureBy, setExtendTenureBy, newMaturityDate,
    currentInterestRate, currentPenaltyRate,
    chargeRows, addChargeRow, removeChargeRow, updateChargeRow,
    isProcessing, handleSubmit,
    oldValues,
    resetAll,
  } = useLoanRestructureForm({ opened, editName, viewName, onSaved });

  const [scheduleOpened, setScheduleOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<CenterTab>("DETAILS");

  useEffect(() => {
    if (opened) setActiveTab("DETAILS");
  }, [opened]);

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

  const canPreviewSchedule = !!selectedLoan?.maturityDate;

  const handleModalClose = () => {
    resetAll();
    setActiveTab("DETAILS");
    onClose();
  };

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
                {isViewMode ? "View Loan Restructure" : editName ? "Edit Loan Restructure" : "Loan Restructure"}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                {isViewMode
                  ? "Viewing restructure request details."
                  : "Search a borrower and restructure the terms of their loan account."}
              </Text>
            </Box>
          </Group>
          <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={handleModalClose} aria-label="Close">
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        {isLoadingRecord ? (
          <Box style={{ height: CONTENT_HEIGHT }} className="flex items-center justify-center">
            <Loader color="brand" />
          </Box>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isViewMode) handleSubmit();
            }}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <Box style={{ height: CONTENT_HEIGHT, overflow: "hidden" }}>
              <div className="flex h-full overflow-hidden">
                {/* Borrower Selection */}
                <div
                  className="w-[300px] shrink-0 flex flex-col"
                  style={{ borderRight: "1px solid var(--mantine-color-slate-2)" }}
                >
                  <div className="p-5 pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
                      <IconUserSearch size={15} style={{ color: "var(--mantine-color-brand-6)" }} />
                      <Text size="sm" fw={700} c="slate.8">Borrower Selection</Text>
                    </div>
                    <Text size="xs" c="dimmed" className="ml-5 mb-4">
                      Search by A/C no, phone or name
                    </Text>

                    {!selectedBorrower && !isViewMode && (
                      <TextInput
                        size="sm"
                        placeholder="e.g. Yash Joshi, 9876543210..."
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        leftSection={<IconSearch size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
                        rightSection={searchLoading ? <Loader size={12} /> : undefined}
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
                          {!isViewMode && !loanLocked && (
                            <Anchor
                              component="button"
                              type="button"
                              onClick={handleClearBorrower}
                              size="xs"
                              fw={700}
                              c="brand.6"
                              underline="never"
                            >
                              Change
                            </Anchor>
                          )}
                        </div>
                        <div
                          className="text-left rounded-md"
                          style={{
                            border: "1px solid var(--mantine-color-brand-3)",
                            background: "var(--mantine-color-brand-0)",
                            paddingTop: "1rem", paddingBottom: "1rem",
                            paddingLeft: "1.25rem", paddingRight: "1rem",
                          }}
                        >
                          <Text size="sm" fw={700} c="slate.8">{selectedBorrower.name}</Text>
                          <Text size="xs" c="dimmed" className="mt-0.5">
                            {selectedBorrower.applicantType}
                            {selectedBorrower.phone ? ` | ${selectedBorrower.phone}` : ""}
                          </Text>
                        </div>
                      </div>
                    ) : (
                      search.trim() && (
                        <div className="flex flex-col gap-2">
                          {searchLoading ? (
                            <Text size="xs" c="dimmed" className="py-2">Searching...</Text>
                          ) : matches.length === 0 ? (
                            <Text size="xs" c="dimmed" className="py-2">No borrowers found.</Text>
                          ) : (
                            matches.map((borrower) => (
                              <UnstyledButton
                                key={`${borrower.applicantType}-${borrower.name}-${borrower.phone}`}
                                type="button"
                                onClick={() => handleSelectBorrower(borrower)}
                                className="text-left rounded-md transition-colors w-full"
                                style={{
                                  border: "1px solid var(--mantine-color-slate-2)",
                                  paddingTop: "1rem", paddingBottom: "1rem",
                                  paddingLeft: "1.25rem", paddingRight: "1rem",
                                }}
                                styles={{ root: { "&:hover": { backgroundColor: "var(--mantine-color-slate-1)" } } }}
                              >
                                <Text size="sm" fw={700} c="slate.8">{borrower.name}</Text>
                                <Text size="xs" c="dimmed" className="mt-0.5">
                                  {borrower.applicantType} {borrower.phone ? `· ${borrower.phone}` : ""}
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
                            {loanLocked ? "Loan Account" : "Select Active Loan Account"}
                          </Text>
                        </div>
                        <div className="flex flex-col gap-2">
                          {selectedBorrower.loans.map((loan) => {
                            const isSelected = selectedLoanId === loan.id;
                            return (
                              <UnstyledButton
                                key={loan.id}
                                type="button"
                                disabled={loanLocked}
                                onClick={() => !loanLocked && handleSelectLoan(loan)}
                                className="text-left rounded-md transition-colors w-full"
                                style={{
                                  border: isSelected
                                    ? "1px solid var(--mantine-color-brand-4)"
                                    : "1px solid var(--mantine-color-slate-2)",
                                  background: isSelected ? "var(--mantine-color-brand-0)" : "var(--mantine-color-white)",
                                  boxShadow: isSelected ? "0 0 0 1px var(--mantine-color-brand-2)" : "none",
                                  paddingTop: "1rem", paddingBottom: "1rem",
                                  paddingLeft: "1.25rem", paddingRight: "1rem",
                                  cursor: loanLocked ? "default" : "pointer",
                                  opacity: loanLocked && !isSelected ? 0.5 : 1,
                                }}
                              >
                                <Text size="sm" fw={700} c="slate.8">
                                  {loan.type} - {loan.id}
                                </Text>
                                <Text size="xs" c="dimmed" className="mt-0.5">
                                  {loan.principalOutstanding ? `Balance: ${fmt(loan.principalOutstanding)}` : ""}
                                  {loan.maturityDate ? ` | Maturity: ${formatDate(loan.maturityDate)}` : ""}
                                </Text>
                              </UnstyledButton>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Center */}
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
                          style={{ background: "var(--mantine-color-brand-0)", border: "1px solid var(--mantine-color-brand-2)" }}
                        >
                          <IconClipboardList size={26} style={{ color: "var(--mantine-color-brand-6)" }} />
                        </div>
                        <Text size="lg" fw={700} c="slate.8">No Loan Account Selected</Text>
                        <Text size="sm" c="dimmed" className="mt-2" maw={340}>
                          To proceed with the restructure, first search for a borrower and select one
                          of their active loan accounts from the panel on the left.
                        </Text>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="p-4 pb-3 flex flex-nowrap items-end gap-4 overflow-x-auto">
                        <div className="shrink-0">
                          <Text size="sm" fw={500} className="text-gray-700 mb-1">
                            Selected Loan A/C Number
                          </Text>
                          <div
                            className="inline-flex w-fit items-center gap-2 rounded-md px-4 py-1"
                            style={{ border: "1px solid var(--mantine-color-brand-3)", background: "var(--mantine-color-brand-0)", height: 36 }}
                          >
                            <IconCar size={12} style={{ color: "var(--mantine-color-brand-6)" }} />
                            <Text size="sm" fw={700} c="slate.8" className="font-mono">{selectedLoan.id}</Text>
                            <Text size="xs" c="dimmed">({selectedLoan.type})</Text>
                          </div>
                        </div>

                        <DateInput
                          size="sm" className="w-[180px] shrink-0" withAsterisk
                          label="Value Date" disabled={isViewMode}
                          valueFormat="DD-MMM-YYYY"
                          value={toDateValue(valueDate)}
                          onChange={(d) => setValueDate(d ? dayjs(d).format("YYYY-MM-DD") : "")}
                          leftSection={<IconCalendarDue size={14} className="text-emerald-600" />}
                        />
                        <Select
                          size="sm" withAsterisk label="Reason for Restructure" className="w-[220px] shrink-0"
                          placeholder="Select a reason" disabled={isViewMode}
                          data={RESTRUCTURE_REASONS}
                          value={reason}
                          onChange={setReason}
                          rightSection={chevronDown}
                        />
                      </div>

                      {/* Details / Charges tabs */}
                      <div className="px-6 pt-2" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
                        <div className="inline-flex gap-8">
                          {(["DETAILS", "CHARGES"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setActiveTab(t)}
                              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === t
                                ? "border-[color:var(--mantine-color-brand-6)] text-gray-900"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                              {t === "DETAILS" ? "Details" : "Charges"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 mt-1" />

                      <div className="px-1 py-1">
                        {activeTab === "DETAILS" && (
                          <div className="px-5 pt-3">
                            <RestructureDetailsTab
                              restructureType={restructureType}
                              setRestructureType={setRestructureType}
                              disabled={isViewMode}
                              newInterestRate={newInterestRate}
                              setNewInterestRate={setNewInterestRate}
                              newPenaltyRate={newPenaltyRate}
                              setNewPenaltyRate={setNewPenaltyRate}
                              topupAmount={topupAmount}
                              onTopupAmountChange={handleTopupAmountChange}
                              newPrincipalOutstanding={newPrincipalOutstanding}
                              onNewPrincipalChange={handleNewPrincipalChange}
                              currentPrincipalOutstanding={currentPrincipalOutstanding}
                              onCurrentPrincipalChange={handleCurrentPrincipalChange}
                              currentMaturityDate={selectedLoan.maturityDate}
                              repaymentFrequency={selectedLoan.repaymentFrequency}
                              extendTenureBy={extendTenureBy}
                              setExtendTenureBy={setExtendTenureBy}
                              newMaturityDate={newMaturityDate}
                              onViewSchedule={() => setScheduleOpened(true)}
                              canPreviewSchedule={canPreviewSchedule}
                              currentInterestRate={currentInterestRate}
                              currentPenaltyRate={currentPenaltyRate}
                            />
                          </div>
                        )}

                        {activeTab === "CHARGES" && (
                          <div className="px-5 pt-3">
                            <RestructureChargesTab
                              chargeRows={chargeRows}
                              onAddRow={addChargeRow}
                              onRemoveRow={removeChargeRow}
                              onUpdateRow={updateChargeRow}
                              disabled={isViewMode}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Before Restructure */}
                <div
                  className="w-[300px] p-5 shrink-0 flex flex-col shadow-[var(--mantine-shadow-lg)]"
                  style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
                    <Text size="sm" fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                      SUMMARY
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
                          style={{ background: "var(--mantine-color-slate-1)", border: "1px solid var(--mantine-color-slate-2)" }}
                        >
                          <div className="p-1.5 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--mantine-color-brand-0)" }}>
                            <IconCar size={14} style={{ color: "var(--mantine-color-brand-6)" }} />
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">{selectedLoan.type}</Text>
                            <Text size="sm" fw={700} c="slate.8" className="font-mono">{selectedLoan.id}</Text>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-2 rounded-md p-2.5"
                          style={{ background: "var(--mantine-color-slate-1)", border: "1px solid var(--mantine-color-slate-2)" }}
                        >
                          <div className="p-1.5 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--mantine-color-brand-0)" }}>
                            <IconUserSearch size={14} style={{ color: "var(--mantine-color-brand-6)" }} />
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Customer</Text>
                            <Text size="sm" fw={600} c="slate.8">{selectedBorrower?.name}</Text>
                          </div>
                        </div>

                        <div
                          className="rounded-md p-3 flex flex-col gap-2"
                          style={{ background: "var(--mantine-color-slate-1)", border: "1px solid var(--mantine-color-slate-2)" }}
                        >
                          <SummaryRow
                            label="Principal Outstanding"
                            value={oldValues?.principal != null ? fmt(oldValues.principal) : fmt(selectedLoan.principalOutstanding)}
                          />
                          <SummaryRow
                            label="Interest Rate"
                            value={`${oldValues?.rate ?? selectedLoan.interestRate}%`}
                          />
                          <SummaryRow label="Penalty Rate" value={`${selectedLoan.penaltyRate}%`} />
                          <SummaryRow label="Maturity Date" value={formatDate(selectedLoan.maturityDate)} />
                          <div className="flex justify-between items-center">
                            <Text size="xs" c="dimmed">NPA Status</Text>
                            <Badge size="sm" variant="light" color={npaBadgeColor(selectedLoan.npaStatus)} styles={{ root: { fontSize: 10 } }}>
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
              isViewMode={isViewMode}
              onClose={handleModalClose}
              onSubmit={handleSubmit}
              submitLabel={editName ? "Update" : "Save"}
              submitLoading={isProcessing}
              submitDisabled={isProcessing}
            />
          </form>
        )}
      </Box>

      {/* Schedule preview */}
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
              <Text size="md" fw={700} className="text-gray-900 leading-tight">New Repayment Schedule</Text>
              <Text size="xs" c="dimmed" className="mt-0.5">
                Projected schedule based on the updated restructure terms.
              </Text>
            </div>
            <Button variant="subtle" color="gray" onClick={() => setScheduleOpened(false)} className="px-2" size="xs">
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
              {restructureType === "MODIFY_MATURITY" && (
  <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
    New Maturity: {formatDate(newMaturityDate || selectedLoan.maturityDate)}
  </Badge>
)}
              <Badge size="lg" variant="light" color="brand" radius="sm" className="font-semibold normal-case">
                Principal: {fmt(selectedLoan.principalOutstanding)}
              </Badge>
            </div>
          )}

          <div className="px-6 pb-6 overflow-y-auto flex-1">
            {scheduleRows.length === 0 ? (
              <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" stickyHeader>
                <Table.Thead>
                  <Table.Tr className="border-b border-gray-200">
                    <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>INSTALLMENT</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>DUE DATE</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>PRINCIPAL</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>INTEREST</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>TOTAL EMI</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>BALANCE</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" className="py-8 text-center">
                        Schedule preview not available yet.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            ) : (
              <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm" stickyHeader>
                <Table.Thead>
                  <Table.Tr className="border-b border-gray-200">
                    <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>INSTALLMENT</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold" style={{ fontSize: 11 }}>DUE DATE</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>PRINCIPAL</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>INTEREST</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>TOTAL EMI</Table.Th>
                    <Table.Th className="text-gray-500 font-semibold text-right" style={{ fontSize: 11 }}>BALANCE</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {scheduleRows.map((row) => (
                    <Table.Tr key={row.emiNo} className="border-b border-gray-100 last:border-0">
                      <Table.Td>#{row.emiNo}</Table.Td>
                      <Table.Td>{formatDate(row.dueDate)}</Table.Td>
                      <Table.Td className="text-right font-mono">{fmt(row.principal)}</Table.Td>
                      <Table.Td className="text-right font-mono">{fmt(row.interest)}</Table.Td>
                      <Table.Td className="text-right font-mono font-semibold">{fmt(row.totalEmi)}</Table.Td>
                      <Table.Td className="text-right font-mono">{fmt(row.balance)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
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