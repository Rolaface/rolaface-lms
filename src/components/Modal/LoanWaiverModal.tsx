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
  IconScale,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoanRepaymentPayload } from "../../types/loanRepaymentForm";
import {
  getLoanRepaymentAccount,
  getLoanDues,
  createLoanRepayment,
  getLoanRepaymentById,
  updateLoanRepayment,
} from "../../api/loanRepaymentApi";

interface LoanWaiverModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanWaiverFormData) => void;
  editId?: string | null;
  isView?: boolean;
}

export interface LoanWaiverFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  amountToPay: number | "";
  paymentMode: string | null;
  referenceNumber: string;
  referenceDate: string;
  accountNumber: string;
  remark: string;
  waivedInterest: number | "";
  waivedPenalty: number | "";
  waivedFee: number | "";
}

interface LoanAccount {
  id: string;
  type: string;
}

interface Borrower {
  name: string;
  cif: string;
  phone: string;
  status: string;
  loans: LoanAccount[];
}

const labelClass = { label: "text-sm font-medium text-gray-700 mb-1" };

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function toWaiverType(field: "interest" | "penalty" | "fee") {
  if (field === "interest") return "Interest Waiver";
  if (field === "penalty") return "Penalty Waiver";
  return "Charges Waiver";
}

// Computes projected before/after using real dues from getLoanDues.
// Principal and remaining installments are unaffected by a waiver — API doesn't
// currently return remaining installments at all, so both sides show 0 until
// that's available from a real endpoint.
function computeWaiverEffect(
  dues: any,
  waivedInterest: number,
  waivedPenalty: number,
  waivedFee: number
) {
  const interestDue = dues?.interest_amount ?? 0;
  const penaltyDue = dues?.penalty_amount ?? 0;
  const feeDue = dues?.total_charges_payable ?? 0;
  const principalDue = dues?.payable_principal_amount ?? 0;

  const interestWaived = Math.min(Math.max(waivedInterest, 0), interestDue);
  const penaltyWaived = Math.min(Math.max(waivedPenalty, 0), penaltyDue);
  const feeWaived = Math.min(Math.max(waivedFee, 0), feeDue);
  const totalWaived = interestWaived + penaltyWaived + feeWaived;

  const totalOutstandingBefore = principalDue + interestDue + penaltyDue + feeDue;
  const arrearsBefore = totalOutstandingBefore;

  return {
    totalOutstandingBefore,
    totalOutstandingAfter: Math.max(totalOutstandingBefore - totalWaived, 0),
    principalOutstandingBefore: principalDue,
    principalOutstandingAfter: principalDue,
    arrearsBefore,
    arrearsAfter: Math.max(arrearsBefore - totalWaived, 0),
    remainingInstallmentsBefore: 0,
    remainingInstallmentsAfter: 0,
    interestPayableBefore: interestDue,
    interestPayableAfter: Math.max(interestDue - interestWaived, 0),
  };
}

export function LoanWaiverModal({ opened, onClose, onSubmit, editId, isView }: LoanWaiverModalProps) {
  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);

  const [valueDate, setValueDate] = useState(new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState("");

  const [waivedInterest, setWaivedInterest] = useState<number | "">("");
  const [waivedPenalty, setWaivedPenalty] = useState<number | "">("");
  const [waivedFee, setWaivedFee] = useState<number | "">("");

  // Which waiver type the currently-loaded edit record actually is —
  // only that one field is editable/sent back on update.
  const [editRecordType, setEditRecordType] = useState<string | null>(null);

  const [waiverEffectOpened, setWaiverEffectOpened] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setBorrowerPanelCollapsed(!!selectedLoanId);
  }, [selectedLoanId]);

  const { data: searchResponse, isLoading: isSearching } = useQuery({
    queryKey: ["loanRepaymentAccounts", search],
    queryFn: () => getLoanRepaymentAccount(search),
    enabled: opened && search.trim().length > 0 && !editId,
  });

  const matches: Borrower[] = useMemo(() => {
    const items = searchResponse?.message?.data ?? [];
    return items.map((item) => ({
      name: item.applicant_name || item.applicant,
      cif: item.applicant,
      phone: item.phone_number || "",
      status: "Standard",
      loans: [{ id: item.against_loan, type: "" }],
    }));
  }, [searchResponse]);

  const selectedLoan = selectedBorrower?.loans.find((l) => l.id === selectedLoanId) ?? null;

  // Fetch current dues to populate Arrears + Dues Summary. payment_type is fixed
  // to "Normal Repayment" here since this call is only used to read current
  // outstanding breakdown, not to compute a specific repayment schedule.
  const { data: duesResponse, isFetching: isDuesLoading } = useQuery({
    queryKey: ["loanDues", selectedLoanId, valueDate],
    queryFn: () =>
      getLoanDues({
        payment_type: "Normal Repayment",
        posting_date: valueDate,
        against_loan: selectedLoanId as string,
      }),
    enabled: !!selectedLoanId,
  });

  const dues = duesResponse?.message;

  const { data: editDetailsResponse } = useQuery({
    queryKey: ["loanRepayment", editId],
    queryFn: () => getLoanRepaymentById(editId as string),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (opened && editId && editDetailsResponse) {
      const item = editDetailsResponse.message?.data || editDetailsResponse.message || editDetailsResponse;

      setSelectedBorrower({
        name: item.applicant,
        cif: item.applicant,
        phone: "",
        status: "Standard",
        loans: [{ id: item.against_loan, type: item.loan_product || "" }],
      });
      setSelectedLoanId(item.against_loan);
      setValueDate(item.value_date ? item.value_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setRemark("");

      setWaivedInterest("");
      setWaivedPenalty("");
      setWaivedFee("");
      setEditRecordType(item.repayment_type);

      if (item.repayment_type === "Interest Waiver") setWaivedInterest(item.amount_paid ?? "");
      else if (item.repayment_type === "Penalty Waiver") setWaivedPenalty(item.amount_paid ?? "");
      else if (item.repayment_type === "Charges Waiver") setWaivedFee(item.amount_paid ?? "");
    } else if (opened && !editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editDetailsResponse]);

  const waiverEffect = useMemo(() => {
    if (!selectedLoan) return null;
    return computeWaiverEffect(
      dues,
      Number(waivedInterest) || 0,
      Number(waivedPenalty) || 0,
      Number(waivedFee) || 0
    );
  }, [selectedLoan, dues, waivedInterest, waivedPenalty, waivedFee]);

  const handleSelectBorrower = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    setSelectedLoanId(borrower.loans[0]?.id ?? null);
    setWaivedInterest("");
    setWaivedPenalty("");
    setWaivedFee("");
  };

  const handleClearBorrower = () => {
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setSearch("");
    setRemark("");
    setWaivedInterest("");
    setWaivedPenalty("");
    setWaivedFee("");
  };

  const handleSelectLoan = (loan: LoanAccount) => {
    setSelectedLoanId(loan.id);
    setWaivedInterest("");
    setWaivedPenalty("");
    setWaivedFee("");
  };

  const handleReset = () => {
    setSearch("");
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setValueDate(new Date().toISOString().slice(0, 10));
    setRemark("");
    setWaivedInterest("");
    setWaivedPenalty("");
    setWaivedFee("");
    setEditRecordType(null);
  };

  const createWaiverMutation = useMutation({
    mutationFn: createLoanRepayment,
  });

  const updateWaiverMutation = useMutation({
    mutationFn: updateLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanRepayments"] });
      handleReset();
      onClose();
    },
  });

  const handleSubmit = async () => {
    if (!selectedLoan || !selectedBorrower) return;

    const basePayload = {
      applicant_type: "Customer" as const,
      applicant: selectedBorrower.cif,
      loan_product: selectedLoan.type,
      against_loan: selectedLoan.id,
      value_date: valueDate.slice(0, 10),
      mode_of_payment: "", // not shown in this UI — send empty unless your doctype requires it
      reference_number: "",
      reference_date: "",
    };

    if (editId) {
      // Editing an existing single-type waiver — only send the field matching its own type.
      let amount = 0;
      if (editRecordType === "Interest Waiver") amount = Number(waivedInterest) || 0;
      else if (editRecordType === "Penalty Waiver") amount = Number(waivedPenalty) || 0;
      else if (editRecordType === "Charges Waiver") amount = Number(waivedFee) || 0;

      const payload: LoanRepaymentPayload = {
        ...basePayload,
        repayment_type: editRecordType as string,
        amount_paid: amount,
      };
      updateWaiverMutation.mutate({ id: editId, payload });
      return;
    }

    // Create mode — one Loan Repayment record per non-zero waived field.
    const entries: { repayment_type: string; amount: number }[] = [];
    if (Number(waivedInterest) > 0) entries.push({ repayment_type: toWaiverType("interest"), amount: Number(waivedInterest) });
    if (Number(waivedPenalty) > 0) entries.push({ repayment_type: toWaiverType("penalty"), amount: Number(waivedPenalty) });
    if (Number(waivedFee) > 0) entries.push({ repayment_type: toWaiverType("fee"), amount: Number(waivedFee) });

    if (entries.length === 0) return;

    setIsSubmittingAll(true);
    try {
      for (const entry of entries) {
        const payload: LoanRepaymentPayload = {
          ...basePayload,
          repayment_type: entry.repayment_type,
          amount_paid: entry.amount,
        };
        await createWaiverMutation.mutateAsync(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["loanRepayments"] });
      onSubmit?.({
        loanAc: selectedLoan.id,
        customerName: selectedBorrower.name,
        loanType: selectedLoan.type,
        valueDate,
        amountToPay: "",
        paymentMode: null,
        referenceNumber: "",
        referenceDate: "",
        accountNumber: "",
        remark,
        waivedInterest,
        waivedPenalty,
        waivedFee,
      });
      handleReset();
      onClose();
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const isPending = isSubmittingAll || updateWaiverMutation.isPending;
  const hasAnyWaivedAmount =
    (Number(waivedInterest) || 0) > 0 || (Number(waivedPenalty) || 0) > 0 || (Number(waivedFee) || 0) > 0;

  return (
    <>
      <Modal opened={opened} onClose={onClose} size="1300px" withCloseButton={false} padding={0} radius="md" closeOnClickOutside={false}
      closeOnEscape={false}>
        <Box className="flex flex-col h-[700px] max-h-[90vh] overflow-hidden">
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
                    <ActionIcon variant="light" color="brand" size="md" onClick={() => setBorrowerPanelCollapsed(false)}>
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Tooltip>
                  {selectedBorrower && (
                    <Tooltip label={selectedBorrower.name} withArrow position="right">
                      <div className="w-8 h-8 rounded-full bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center">
                        <Text size="xs" fw={700} className="text-[#4F46E5]">
                          {selectedBorrower.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
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
                  !selectedLoan ? "pointer-events-none select-none opacity-50 blur-[2px]" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-5">
                  <IconChecklist size={16} className="text-[#4F46E5]" />
                  <Text size="sm" fw={700} className="text-gray-900 flex items-center gap-2">
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

                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                  <TextInput
                    size="sm"
                    withAsterisk
                    type="date"
                    label="Value Date"
                    disabled={isView}
                    value={valueDate}
                    onChange={(e) => setValueDate(e.currentTarget.value)}
                    leftSection={<IconCalendarDue size={14} className="text-emerald-600" />}
                    classNames={labelClass}
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Text size="sm" fw={600} className="text-gray-900">
                      Waiver Breakdown
                    </Text>
                    <Button
                      size="xs"
                      variant="light"
                      color="brand"
                      leftSection={<IconScale size={14} />}
                      onClick={() => setWaiverEffectOpened(true)}
                      className="font-semibold"
                    >
                      Payment Effect
                    </Button>
                  </div>

                  <Table withTableBorder withColumnBorders striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th className="w-[180px]">Component</Table.Th>
                        <Table.Th className="text-right w-[180px]">Arrears</Table.Th>
                        <Table.Th className="text-right w-[180px]">Waived Amount</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>Interest</Table.Td>
                        <Table.Td className="font-mono text-right">
                          {isDuesLoading ? "..." : formatCurrency(dues?.interest_amount ?? 0)}
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            hideControls
                            placeholder="0.00"
                            thousandSeparator=","
                            decimalScale={2}
                            min={0}
                            max={dues?.interest_amount}
                            disabled={isView || (editId ? editRecordType !== "Interest Waiver" : false)}
                            value={waivedInterest}
                            onChange={(v) => setWaivedInterest(v as number | "")}
                          />
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Penalty</Table.Td>
                        <Table.Td className="font-mono text-right">
                          {isDuesLoading ? "..." : formatCurrency(dues?.penalty_amount ?? 0)}
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            hideControls
                            placeholder="0.00"
                            thousandSeparator=","
                            decimalScale={2}
                            min={0}
                            max={dues?.penalty_amount}
                            disabled={isView || (editId ? editRecordType !== "Penalty Waiver" : false)}
                            value={waivedPenalty}
                            onChange={(v) => setWaivedPenalty(v as number | "")}
                          />
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>Charge / Fee</Table.Td>
                        <Table.Td className="font-mono text-right">
                          {isDuesLoading ? "..." : formatCurrency(dues?.total_charges_payable ?? 0)}
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            hideControls
                            placeholder="0.00"
                            thousandSeparator=","
                            decimalScale={2}
                            min={0}
                            max={dues?.total_charges_payable}
                            disabled={isView || (editId ? editRecordType !== "Charges Waiver" : false)}
                            value={waivedFee}
                            onChange={(v) => setWaivedFee(v as number | "")}
                          />
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </div>

                <TextInput
                  size="sm"
                  label="Remark"
                  placeholder="Add a note about this waiver (optional)"
                  disabled={isView}
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
                </div>
              ) : (
                <Text size="xs" c="dimmed" className="py-8 text-center">
                  Select a loan account on the left to view dues.
                </Text>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4 px-6 flex justify-between items-center shrink-0">
            <Button variant="default" size="sm" onClick={onClose} className="font-semibold">
              {isView ? "Close" : "Cancel"}
            </Button>
            {!isView && (
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
                  disabled={!selectedLoan || !hasAnyWaivedAmount || isPending}
                  loading={isPending}
                  onClick={handleSubmit}
                  rightSection={<IconArrowRight size={16} />}
                  className="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:opacity-90 font-semibold px-6"
                >
                  {editId ? "Update" : "Process Waiver"}
                </Button>
              </div>
            )}
          </div>
        </Box>
      </Modal>

      <Modal
        opened={waiverEffectOpened}
        onClose={() => setWaiverEffectOpened(false)}
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
                  Projected impact of this waiver on {selectedLoan?.id ?? "the loan account"}.
                </Text>
              </div>
            </div>
            <Button variant="subtle" color="gray" onClick={() => setWaiverEffectOpened(false)} className="px-2" size="xs">
              <IconX size={18} />
            </Button>
          </div>

          <div className="border-b border-gray-200" />

          <div className="px-6 py-5">
            {waiverEffect && selectedLoan ? (
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
                    <Table.Td><Text size="sm" fw={600} className="text-gray-900">Total Outstanding</Text></Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(waiverEffect.totalOutstandingBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(waiverEffect.totalOutstandingAfter)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Text size="sm" fw={600} className="text-gray-900">Principal Outstanding</Text></Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(waiverEffect.principalOutstandingBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-gray-700">
                      {formatCurrency(waiverEffect.principalOutstandingAfter)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr className="bg-gray-50/60">
                    <Table.Td><Text size="sm" fw={600} className="text-gray-900">Arrears</Text></Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(waiverEffect.arrearsBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(waiverEffect.arrearsAfter)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Text size="sm" fw={600} className="text-gray-900">Remaining Installments</Text></Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {waiverEffect.remainingInstallmentsBefore}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-gray-700">
                      {waiverEffect.remainingInstallmentsAfter}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr className="bg-gray-50/60">
                    <Table.Td><Text size="sm" fw={600} className="text-gray-900">Interest Payable</Text></Table.Td>
                    <Table.Td className="text-right font-mono text-sm text-gray-700">
                      {formatCurrency(waiverEffect.interestPayableBefore)}
                    </Table.Td>
                    <Table.Td className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(waiverEffect.interestPayableAfter)}
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            ) : (
              <Text size="sm" c="dimmed" className="py-6 text-center">
                Select a loan account to preview waiver effect.
              </Text>
            )}

            <Text size="xs" c="dimmed" className="mt-4">
              A waiver forgives interest, penalty, and fees only — principal and the remaining
              installment count are unaffected. This is a projection only and does not process
              the transaction.
            </Text>
          </div>

          <div className="border-t border-gray-200 p-4 px-6 flex justify-end">
            <Button size="sm" variant="default" onClick={() => setWaiverEffectOpened(false)} className="font-semibold px-5">
              Close
            </Button>
          </div>
        </Box>
      </Modal>
    </>
  );
}