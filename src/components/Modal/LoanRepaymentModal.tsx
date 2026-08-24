import { useEffect, useMemo, useState } from "react";
import { Box, Button, Group, Modal, Text, ThemeIcon, useMantineTheme } from "@mantine/core";
import { IconArrowRight, IconCash, IconMinus, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";

import type { LoanRepaymentPayload } from "../../types/loanRepaymentForm";
import {
  getLoanRepaymentAccount,
  createLoanRepayment,
  getLoanDues,
  getLoanRepaymentById,
  updateLoanRepayment,
   getModeOfPayment,
} from "../../api/loanRepaymentApi";
import type { Borrower, LoanAccount, LoanRepaymentFormData, LoanRepaymentFormValues } from "../../types/loanRepayment";
import { computePaymentEffect, toRepaymentType,fromRepaymentType  } from "../../utils/Loanrepaymentutils";
import { BorrowerSelectionPanel } from "./Repayment/Borrowerselectionpanel";
import { PaymentExecutionPanel } from "./Repayment/Paymentexecutionpanel";
import { DuesSummaryPanel } from "./Repayment/Duessummarypanel";
import { PaymentEffectModal } from "./Repayment/Paymenteffectmodal";
import { ModalFooter } from "../../components/shared/ModalFooter"
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";


export type { LoanRepaymentFormData };

interface LoanRepaymentModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanRepaymentFormData) => void;
  editId?: string | null;
  isView?: boolean;
  onMinimize: () => void;
}

export function LoanRepaymentModal({ opened, onClose, onSubmit, editId, isView, onMinimize }: LoanRepaymentModalProps) {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);
  const [paymentEffectOpened, setPaymentEffectOpened] = useState(false);

  useEffect(() => {
    setBorrowerPanelCollapsed(!!selectedLoanId);
  }, [selectedLoanId]);

  const { data: searchResponse, isLoading: isSearching } = useQuery({
    queryKey: ["loanRepaymentAccounts", search],
    queryFn: () => getLoanRepaymentAccount(search),
    enabled: opened && search.trim().length > 0,
  });
  const { data: modeOfPaymentResponse, isLoading: isModeOfPaymentLoading } = useQuery({
  queryKey: ["modeOfPayment"],
  queryFn: () => getModeOfPayment(),
  enabled: opened,
  staleTime: 5 * 60 * 1000, // rarely changes, avoid refetching every open
});

const modeOfPaymentOptions = useMemo(() => {
  const items = modeOfPaymentResponse?.data ?? [];
  return items.map((item) => ({
    value: item.name,
    label: item.name,
  }));
}, [modeOfPaymentResponse]);

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
  const todayIso = () => new Date().toISOString().slice(0, 10);

  const form = useForm({
    initialValues: {
      valueDate: new Date().toISOString().slice(0, 10),
      natureOfPayment: "PAY_DUES" as LoanRepaymentFormValues["natureOfPayment"],
      amountToPay: "" as number | "",
      paymentMode: "" as string | null,
      referenceNumber: "",
      referenceDate: todayIso(),
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

  // ---------- ALERT HELPERS ----------
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const updateRepaymentMutation = useMutation({
    mutationFn: updateLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanRepayments"] });
      showSuccess("Repayment Updated", "Loan repayment updated successfully.");
      handleReset();
      onClose();
    },
    onError: (err) => showError("Update Failed", err),
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
        natureOfPayment: fromRepaymentType(item.repayment_type),
        amountToPay: item.amount_paid ?? "",
        paymentMode: item.mode_of_payment || null,
        referenceNumber: item.reference_number || "",
        referenceDate: item.reference_date || "",
        accountNumber: item.account_number || "",
        remark: item.manual_remarks || "", 
      });
    } else if (opened && !editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editDetailsResponse]);

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
    form.setFieldValue("natureOfPayment", value as LoanRepaymentFormValues["natureOfPayment"]);
    if (value === "PARTIAL") form.setFieldValue("amountToPay", "");
  };

  const createRepaymentMutation = useMutation({
    mutationFn: createLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanRepayments"] });
      showSuccess("Repayment Processed", "Loan repayment processed successfully.");
      handleReset();
      onClose();
    },
    onError: (err) => showError("Create Failed", err),
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
      account_number: values.accountNumber || undefined,
      manual_remarks: values.remark || undefined,
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

  const isProcessing = createRepaymentMutation.isPending || updateRepaymentMutation.isPending;

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
      {/* <Box className="flex flex-col max-h-[90vh]"> */}
      <Box className="flex flex-col h-[700px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <Box
          className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
          style={{
            background: theme.other.brandGradient,
            borderBottom: "1px solid var(--mantine-color-brand-7)",
          }}
        >
          <Group gap="sm" className="min-w-0" wrap="nowrap">
            <ThemeIcon
              size={38}
              radius="xl"
              style={{
                background: theme.other.headerIconOverlayBg,
                color: "var(--mantine-color-white)",
              }}
            >
              <IconCash size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                {isView ? "View Loan Repayment" : editId ? "Edit Loan Repayment" : "Loan Repayment"}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                Search a borrower and process a repayment against their loan account.
              </Text>
            </div>
          </Group>
          <Group gap="xs" className="shrink-0" wrap="nowrap">
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={onMinimize}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconMinus size={18} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={onClose}
              style={{ color: "var(--mantine-color-white)" }}
              styles={{ root: { "&:hover": { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>
        <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }} />

        <div style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }} />

        {/* Body: borrower selection + payment execution + dues summary */}
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

         <PaymentExecutionPanel
  form={form}
  selectedLoan={selectedLoan}
  selectedBorrower={selectedBorrower}
  isView={isView}
  onNatureChange={handleNatureChange}
  modeOfPaymentOptions={modeOfPaymentOptions}
  isModeOfPaymentLoading={isModeOfPaymentLoading}
/>

          <DuesSummaryPanel
            selectedLoan={selectedLoan}
            dues={dues}
            isDuesLoading={isDuesLoading}
            onOpenPaymentEffect={() => setPaymentEffectOpened(true)}
          />
        </div>

        {/* Footer */}

        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={onClose}
          submitLabel={editId ? "Update" : "Save"}
          submitLoading={isProcessing}
          submitDisabled={!selectedLoan || isProcessing}
                    onSubmit={() => form.onSubmit(handleSubmit)()}
        />
      </Box>

      <PaymentEffectModal
        opened={paymentEffectOpened}
        onClose={() => setPaymentEffectOpened(false)}
        selectedLoan={selectedLoan}
        amountToPay={form.values.amountToPay}
        paymentEffect={paymentEffect}
      />
    </Modal>
  );
}