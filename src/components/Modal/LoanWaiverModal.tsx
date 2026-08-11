import { useEffect, useMemo, useState } from "react";
import { Box, Button, Modal, Text, useMantineTheme } from "@mantine/core";
import { IconArrowRight, IconDiscount2, IconX } from "@tabler/icons-react"; import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoanRepaymentPayload } from "../../types/loanRepaymentForm";
import type { LoanWaiverBorrower, LoanWaiverFormData, LoanWaiverLoanAccount } from "../../types/loanwaiver";
import {
  getLoanRepaymentAccount,
  getLoanDues,
  createLoanRepayment,
  getLoanRepaymentById,
  updateLoanRepayment,
} from "../../api/loanRepaymentApi";
import { computeWaiverEffect, toWaiverType } from "../../utils/loanwaiverutils";
import { BorrowerSelectionPanel } from "./Waiver/Borrowerselectionpanel";
import { WaiverExecutionPanel } from "./Waiver/Waiverexecutionpanel";
import { DuesSummaryPanel } from "./Waiver/Duessummarypanel";
import { WaiverEffectModal } from "./Waiver/Waivereffectmodal";
import { ModalFooter } from "../../components/shared/ModalFooter";

export type { LoanWaiverFormData };

interface LoanWaiverModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanWaiverFormData) => void;
  editId?: string | null;
  isView?: boolean;
}

export function LoanWaiverModal({ opened, onClose, onSubmit, editId, isView }: LoanWaiverModalProps) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<LoanWaiverBorrower | null>(null);
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

  useEffect(() => {
    setBorrowerPanelCollapsed(!!selectedLoanId);
  }, [selectedLoanId]);

  const { data: searchResponse, isLoading: isSearching } = useQuery({
    queryKey: ["loanRepaymentAccounts", search],
    queryFn: () => getLoanRepaymentAccount(search),
    enabled: opened && search.trim().length > 0 && !editId,
  });

  const matches: LoanWaiverBorrower[] = useMemo(() => {
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

  const handleSelectBorrower = (borrower: LoanWaiverBorrower) => {
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

  const handleSelectLoan = (loan: LoanWaiverLoanAccount) => {
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
      <Modal
        opened={opened}
        onClose={onClose}
        size={borrowerPanelCollapsed ? "1100px" : "1300px"}
        withCloseButton={false}
        padding={0}
        radius="md"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Box className="flex flex-col h-[700px] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl flex items-center justify-center" style={{ background: theme.other.brandGradient }}>
                <IconDiscount2 size={20} style={{ color: "var(--mantine-color-white)" }} />
              </div>
              <div>
                <Text size="md" fw={700} c="slate.8" className="leading-tight">
                  Loan Waiver
                </Text>
                <Text size="xs" c="dimmed">
                  Search a borrower and process a waiver against their loan account.
                </Text>
              </div>
            </div>
            <Button variant="subtle" color="slate" onClick={onClose} className="px-2" size="xs">
              <IconX size={18} />
            </Button>
          </div>

          <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }} />

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <BorrowerSelectionPanel
              collapsed={borrowerPanelCollapsed}
              onToggleCollapse={setBorrowerPanelCollapsed}
              search={search}
              onSearchChange={setSearch}
              isSearching={isSearching}
              matches={matches}
              selectedBorrower={selectedBorrower}
              selectedLoanId={selectedLoanId}
              onSelectBorrower={handleSelectBorrower}
              onClearBorrower={handleClearBorrower}
              onSelectLoan={handleSelectLoan}
              isView={isView}
            />

            <WaiverExecutionPanel
              selectedLoan={selectedLoan}
              selectedBorrower={selectedBorrower}
              isView={isView}
              editId={editId}
              editRecordType={editRecordType}
              valueDate={valueDate}
              onValueDateChange={setValueDate}
              dues={dues}
              isDuesLoading={isDuesLoading}
              waivedInterest={waivedInterest}
              waivedPenalty={waivedPenalty}
              waivedFee={waivedFee}
              onWaivedInterestChange={setWaivedInterest}
              onWaivedPenaltyChange={setWaivedPenalty}
              onWaivedFeeChange={setWaivedFee}
              remark={remark}
              onRemarkChange={setRemark}
            />

            <DuesSummaryPanel
              selectedLoan={selectedLoan}
              dues={dues}
              isDuesLoading={isDuesLoading}
              onOpenPaymentEffect={() => setWaiverEffectOpened(true)}
            />
          </div>

          {/* Footer */}
          <ModalFooter
            variant="theme"
            isViewMode={isView}
            onClose={onClose}
            submitLabel={editId ? "Update" : "Save"}
            submitLoading={isPending}
            submitDisabled={!selectedLoan || !hasAnyWaivedAmount || isPending}
            submitIcon={<IconArrowRight size={16} />}
            onSubmit={handleSubmit}
          />
        </Box>
      </Modal>

      <WaiverEffectModal
        opened={waiverEffectOpened}
        onClose={() => setWaiverEffectOpened(false)}
        selectedLoan={selectedLoan}
        waiverEffect={waiverEffect}
      />
    </>
  );
}