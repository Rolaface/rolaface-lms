import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Textarea,
  Modal,
  Badge,
  ActionIcon,
  Tooltip,
  Table,
  Group,
  Stack,
  ThemeIcon,
  Divider,
  useMantineTheme,
} from '@mantine/core';
import {
  IconX,
  IconSearch,
  IconChevronRight,
  IconChevronLeft,
  IconArrowRight,
  IconWallet,
  IconCalendarDue,
  IconChecklist,
  IconNotes,
  IconReportMoney,
  IconUserSearch,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoanRepaymentPayload } from '../../types/loanRepaymentForm';
import {
  getLoanRepaymentAccount,
  getLoanDues,
  createLoanRepayment,
  getLoanRepaymentById,
  updateLoanRepayment,
} from '../../api/loanRepaymentApi';
import { ModalFooter } from '../shared/ModalFooter';
import { openCommonModal } from './AlertModal';
import { IconMinus } from '@tabler/icons-react';
import { formatAmount, useCurrencyReady } from '../../store/currencyStore';
import { useCompanyStore } from '../../store/companyStore';
import { parseCommentForTextarea } from "../../utils/commentUtils";


export interface LoanCapitalizationModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onSubmit?: (data: LoanCapitalizationFormData) => void;
  editId?: string | null;
  isView?: boolean;
}
export interface LoanCapitalizationFormData {
  loanAc: string;
  customerName: string;
  loanType: string;
  valueDate: string;
  amountToPay: number | '';
  paymentMode: string | null;
  referenceNumber: string;
  referenceDate: string;
  accountNumber: string;
  remark: string;
  _comments?: string;
  capitalizedInterest: number | '';
  capitalizedPenalty: number | '';
  capitalizedFee: number | '';
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

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
function toCapitalizationType(field: 'interest' | 'penalty' | 'fee') {
  if (field === 'interest') return 'Interest Capitalization';
  if (field === 'penalty') return 'Penalty Capitalization';
  return 'Charges Capitalization';
}

interface PaymentEffectRow {
  component: string;
  before: number;
  after: number;
}

interface PaymentEffectModalProps {
  opened: boolean;
  onClose: () => void;
  loanId: string;
  customerName: string;
  rows: PaymentEffectRow[];
  currency: string | undefined;
}

function PaymentEffectModal({ opened, onClose, loanId, customerName, rows, currency }: PaymentEffectModalProps) {
  const theme = useMantineTheme();
  return (
    <Modal opened={opened} onClose={onClose} size={800} withCloseButton={false} padding={0} radius="lg">
      <Box bg="white">
        <Group justify="space-between" align="center" px="xl" py="md">
          <Group gap="sm">
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--mantine-radius-md)',
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconReportMoney size={20} color="var(--mantine-color-white)" stroke={1.8} />
            </Box>
            <Box>
              <Text size="md" fw={700} c="slate.8">
                Capitalization Effect
              </Text>
              <Text size="xs" c="slate.5">
                Projected impact on <Text span fw={600} c="slate.7">{loanId} / {customerName}</Text>
              </Text>
            </Box>
          </Group>
          <ActionIcon variant="subtle" color="slate" radius="xl" size="md" onClick={onClose} aria-label="Close">
            <IconX size={16} />
          </ActionIcon>
        </Group>

        <Divider color="slate.2" />

                  <Box p="xl">
            <Table
              withTableBorder={false}
              withColumnBorders={false}
              withRowBorders={false}
              verticalSpacing="sm"
              styles={{
                table: { borderCollapse: "separate", borderSpacing: "0" }
              }}
            >
              <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                <Table.Tr>
                  <Table.Th c="slate.5" fz="xs" tt="uppercase">HEAD</Table.Th>
                  <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right">Before</Table.Th>
                  <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right">Capitalized</Table.Th>
                  <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right">After</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, index) => (
                  <Table.Tr key={row.component} style={{ background: index % 2 === 1 ? "var(--mantine-color-slate-0)" : "transparent" }}>
                    <Table.Td>
                      <Text size="sm" fw={600} c="slate.8">
                        {row.component}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.component === "Installment Remaining" ? row.before : formatAmount(currency, row.before, { withSymbol: true })}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text size="sm" fw={600} ff="monospace" c="brand.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.component === "Installment Remaining" ? Math.abs(row.before - row.after) : formatAmount(currency, Math.abs(row.before - row.after), { withSymbol: true })}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text size="sm" fw={600} ff="monospace" c="success.7" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.component === "Installment Remaining" ? row.after : formatAmount(currency, row.after, { withSymbol: true })}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

        <Divider color="slate.2" />
        <Group justify="flex-end" px="xl" py="md">
          <Button size="sm" radius="xl" variant="default" onClick={onClose} px="lg">
            Close
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}

export function LoanCapitalizationModal({ opened, onClose, onMinimize, onSubmit, editId, isView }: LoanCapitalizationModalProps) {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();
  const [search, setSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);

  const [valueDate, setValueDate] = useState(new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState('');
  const [comment, setComment] = useState('');

  const [capitalizedInterest, setCapitalizedInterest] = useState<number | ''>('');
  const [capitalizedPenalty, setCapitalizedPenalty] = useState<number | ''>('');
  const [capitalizedFee, setCapitalizedFee] = useState<number | ''>('');

  // Which capitalization type the loaded edit record actually is —
  // only that field is editable/sent back on update.
  const [editRecordType, setEditRecordType] = useState<string | null>(null);

  const [paymentEffectOpened, setPaymentEffectOpened] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setBorrowerPanelCollapsed(!!selectedLoanId);
  }, [selectedLoanId]);

  const { data: searchResponse, isLoading: isSearching } = useQuery({
    queryKey: ['loanRepaymentAccounts', search],
    queryFn: () => getLoanRepaymentAccount(search),
    enabled: opened && search.trim().length > 0 && !editId,
  });

  const matches: Borrower[] = useMemo(() => {
    const items = searchResponse?.message?.data ?? [];
    return items.map((item) => ({
      name: item.applicant_name || item.applicant,
      cif: item.applicant,
      phone: item.phone_number || '',
      status: 'Standard',
      loans: [{ id: item.against_loan, type: '' }],
    }));
  }, [searchResponse]);

  const selectedLoan = selectedBorrower?.loans.find((l) => l.id === selectedLoanId) ?? null;

  // payment_type fixed to "Normal Repayment" — this call only reads current
  // outstanding breakdown, not a specific repayment schedule.
  const { data: duesResponse, isFetching: isDuesLoading } = useQuery({
    queryKey: ['loanDues', selectedLoanId, valueDate],
    queryFn: () =>
      getLoanDues({
        payment_type: 'Normal Repayment',
        posting_date: valueDate,
        against_loan: selectedLoanId as string,
      }),
    enabled: !!selectedLoanId,
  });

  const dues = duesResponse?.message;

  const { data: editDetailsResponse } = useQuery({
    queryKey: ['loanRepayment', editId],
    queryFn: () => getLoanRepaymentById(editId as string),
    enabled: opened && !!editId,
  });

  useEffect(() => {
    if (editId && editDetailsResponse) {
      const item = editDetailsResponse.message?.data || editDetailsResponse.message || editDetailsResponse;

      setSelectedBorrower({
        name: item.applicant,
        cif: item.applicant,
        phone: '',
        status: 'Standard',
        loans: [{ id: item.against_loan, type: item.loan_product || '' }],
      });
      setSelectedLoanId(item.against_loan);
      setValueDate(item.value_date ? item.value_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setRemark((item as any).manual_remarks || (item as any).remarks || item.remark || "");
        setComment(parseCommentForTextarea((item as any)._comments || (item as any).comment || (item as any).comments || (item as any).manual_remarks || (item as any).remarks || ""));

      setCapitalizedInterest('');
      setCapitalizedPenalty('');
      setCapitalizedFee('');
      setEditRecordType(item.repayment_type);

      if (item.repayment_type === 'Interest Capitalization') setCapitalizedInterest(item.amount_paid ?? '');
      else if (item.repayment_type === 'Penalty Capitalization') setCapitalizedPenalty(item.amount_paid ?? '');
      else if (item.repayment_type === 'Charges Capitalization') setCapitalizedFee(item.amount_paid ?? '');
    } else if (!editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editDetailsResponse]);

  const totalDue = dues
    ? (dues.payable_principal_amount ?? 0) + (dues.interest_amount ?? 0) + (dues.penalty_amount ?? 0) + (dues.total_charges_payable ?? 0)
    : 0;

  const paymentEffectRows: PaymentEffectRow[] = useMemo(() => {
    if (!selectedLoan || !dues) return [];
    const totalCapitalized =
      (Number(capitalizedInterest) || 0) + (Number(capitalizedPenalty) || 0) + (Number(capitalizedFee) || 0);
    const principalDue = dues.payable_principal_amount ?? 0;
    const interestDue = dues.interest_amount ?? 0;
    const clamp = (n: number) => Math.max(Math.round(n * 100) / 100, 0);

    // Capitalization folds waived-as-added amounts into principal — principal
    // goes up by the capitalized total, arrears/interest go down by the same.
    return [
      {
        component: 'Interest Outstanding',
        before: interestDue,
        after: clamp(interestDue - Math.min(Number(capitalizedInterest) || 0, interestDue)),
      },
      {component: 'Penalty Outstanding', before: 0.0, after: 0.0},
      {component: 'Charges Outstanding', before: 0.0, after: 0.0},
      { component: 'Total Outstanding', before: totalDue, after: totalDue },
      { component: 'Arrears', before: totalDue, after: clamp(totalDue - totalCapitalized) },
      {component: 'Installment Remaining', before:10, after:5}
    ];
  }, [selectedLoan, dues, capitalizedInterest, capitalizedPenalty, capitalizedFee, totalDue]);

  const handleSelectBorrower = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    setSelectedLoanId(borrower.loans[0]?.id ?? null);
    setCapitalizedInterest('');
    setCapitalizedPenalty('');
    setCapitalizedFee('');
  };

  const handleClearBorrower = () => {
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setSearch('');
    setRemark('');
    setComment('');
    setCapitalizedInterest('');
    setCapitalizedPenalty('');
    setCapitalizedFee('');
  };

  const handleSelectLoan = (loan: LoanAccount) => {
    setSelectedLoanId(loan.id);
    setCapitalizedInterest('');
    setCapitalizedPenalty('');
    setCapitalizedFee('');
  };

  const handleReset = () => {
    setSearch('');
    setSelectedBorrower(null);
    setSelectedLoanId(null);
    setValueDate(new Date().toISOString().slice(0, 10));
    setRemark('');
    setComment('');
    setCapitalizedInterest('');
    setCapitalizedPenalty('');
    setCapitalizedFee('');
    setEditRecordType(null);
  };

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: typeof error === 'string' ? error : 'Something went wrong. Please try again.',
      color: 'red',
      buttons: [{ label: 'Close', color: 'red' }],
    });
  };

  const showSuccessAlert = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'Close', color: 'green' }],
    });
  };

  const showValidation = (body: string) => {
    openCommonModal({
      heading: 'Validation Error',
      subtitle: '',
      body,
      color: 'red',
      buttons: [{ label: 'Close', color: 'red' }],
    });
  };

  const handleMinimize = () => {
    onMinimize?.();
  };
  const handleClose = () => {
    handleReset();
    onClose();
  };

  const createCapitalizationMutation = useMutation({
    mutationFn: createLoanRepayment,
  });

  const updateCapitalizationMutation = useMutation({
    mutationFn: updateLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      handleReset();
      onClose();
    },
  });

  const hasAnyCapitalizedAmount =
    (Number(capitalizedInterest) || 0) > 0 || (Number(capitalizedPenalty) || 0) > 0 || (Number(capitalizedFee) || 0) > 0;

  const handleSubmit = async () => {
    if (!selectedLoan || !selectedBorrower) return;

    if (!hasAnyCapitalizedAmount) {
      showValidation('Please enter at least one capitalized amount before submitting.');
      return;
    }

    const basePayload = {
      applicant_type: 'Customer' as const,
      applicant: selectedBorrower.cif,
      loan_product: selectedLoan.type,
      against_loan: selectedLoan.id,
      value_date: valueDate.slice(0, 10),
      mode_of_payment: '',
      reference_number: '',
      reference_date: '',
      _comments: comment,
    };

    if (editId) {
      let amount = 0;
      if (editRecordType === 'Interest Capitalization') amount = Number(capitalizedInterest) || 0;
      else if (editRecordType === 'Penalty Capitalization') amount = Number(capitalizedPenalty) || 0;
      else if (editRecordType === 'Charges Capitalization') amount = Number(capitalizedFee) || 0;

      const payload: LoanRepaymentPayload = {
        ...basePayload,
        repayment_type: editRecordType as string,
        amount_paid: amount,
      };
      updateCapitalizationMutation.mutate(
        { id: editId, payload },
        {
          onSuccess: () => showSuccessAlert('Capitalization Updated', 'Loan capitalization updated successfully.'),
          onError: () => showError('Update Failed', null),
        }
      );
      return;
    }

    const entries: { repayment_type: string; amount: number }[] = [];
    if (Number(capitalizedInterest) > 0) entries.push({ repayment_type: toCapitalizationType('interest'), amount: Number(capitalizedInterest) });
    if (Number(capitalizedPenalty) > 0) entries.push({ repayment_type: toCapitalizationType('penalty'), amount: Number(capitalizedPenalty) });
    if (Number(capitalizedFee) > 0) entries.push({ repayment_type: toCapitalizationType('fee'), amount: Number(capitalizedFee) });

    if (entries.length === 0) {
      showValidation('Please enter at least one capitalized amount before submitting.');
      return;
    }

    setIsSubmittingAll(true);
    try {
      for (const entry of entries) {
        const payload: LoanRepaymentPayload = {
          ...basePayload,
          repayment_type: entry.repayment_type,
          amount_paid: entry.amount,
        };
        await createCapitalizationMutation.mutateAsync(payload);
      }
      queryClient.invalidateQueries({ queryKey: ['loanRepayments'] });
      showSuccessAlert('Capitalization Processed', 'Loan capitalization processed successfully.');
      onSubmit?.({
        loanAc: selectedLoan.id,
        customerName: selectedBorrower.name,
        loanType: selectedLoan.type,
        valueDate,
        amountToPay: '',
        paymentMode: null,
        referenceNumber: '',
        referenceDate: '',
        accountNumber: '',
        remark,
        _comments: comment,
        capitalizedInterest,
        capitalizedPenalty,
        capitalizedFee,
      });
      handleReset();
      onClose();
    } catch (err) {
      showError('Processing Failed', null);
    } finally {
      setIsSubmittingAll(false);
    }
  };
  const isPending = isSubmittingAll || updateCapitalizationMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size={1300}
      withCloseButton={false}
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: '88vh',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0, minHeight: 0, overflow: 'hidden' },
      }}
    >
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }} bg="white">
        {/* Header — same brand.6 header bar as CustomerModal */}
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: '1px solid var(--mantine-color-brand-7)', flexShrink: 0 }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconWallet size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white">
                Loan Capitalization
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Search a borrower and process a capitalization against their loan account
              </Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={handleMinimize} aria-label="Minimize">
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>

        <Group style={{ flex: 1, minHeight: 0 }} gap={0} wrap="nowrap" align="stretch">
          {/* Borrower panel */}
          <Box
            style={{
              borderRight: '1px solid var(--mantine-color-slate-2)',
              flexShrink: 0,
              overflowY: 'auto',
              transition: 'width 200ms ease, padding 200ms ease',
              width: borrowerPanelCollapsed ? 56 : 300,
              padding: borrowerPanelCollapsed ? 12 : 20,
            }}
            bg="slate.0"
          >
            {borrowerPanelCollapsed ? (
              <Stack align="center" gap="md">
                <Tooltip label="Expand borrower selection" withArrow position="right">
                  <ActionIcon variant="light" color="brand" radius="xl" size="md" onClick={() => setBorrowerPanelCollapsed(false)}>
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Tooltip>
                {selectedBorrower && (
                  <Tooltip label={selectedBorrower.name} withArrow position="right">
                    <Box
                      w={34}
                      h={34}
                      style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        background: 'var(--mantine-color-brand-1)',
                        border: '1px solid var(--mantine-color-brand-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size="xs" fw={700} c="brand.7">
                        {selectedBorrower.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </Text>
                    </Box>
                  </Tooltip>
                )}
              </Stack>
            ) : (
              <>
                <Group justify="space-between" align="center" mb={2}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
                    <IconUserSearch size={15} style={{ color: "var(--mantine-color-brand-6)" }} />
                    <Text size="sm" fw={700} c="slate.8">
                      Borrower Selection
                    </Text>
                  </div>                  {selectedBorrower && (
                    <Tooltip label="Collapse" withArrow position="left">
                      <ActionIcon variant="subtle" color="slate" radius="xl" size="sm" onClick={() => setBorrowerPanelCollapsed(true)}>
                        <IconChevronLeft size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
                <Text size="xs" c="slate.5" ml={12} mb="md">
                  Search by A/C no, phone or name
                </Text>

                {!selectedBorrower && !isView && (
                  <TextInput
                    size="sm"
                    radius="xl"
                    placeholder="Search by loan A/C, applicant or phone"
                    value={search}
                    disabled={isView}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    leftSection={<IconSearch size={14} color="var(--mantine-color-slate-4)" />}
                    styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
                  />
                )}

                {selectedBorrower ? (
                  <Box mt="sm">
                    <Group justify="space-between" align="center" mb={8}>
                      <Text size="xs" fw={600} c="slate.5" tt="uppercase">
                        Selected Borrower
                      </Text>
                      {!isView && (
                        <Text
                          size="xs"
                          fw={700}
                          c="brand.6"
                          onClick={handleClearBorrower}
                          style={{ cursor: 'pointer' }}
                        >
                          Change
                        </Text>
                      )}
                    </Group>
                    <Box
                      p="sm"
                      style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        border: '1px solid var(--mantine-color-brand-3)',
                        background: 'var(--mantine-color-brand-0)',
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={700} c="slate.8">
                          {selectedBorrower.name}
                        </Text>
                        <Badge size="sm" variant="light" color={selectedBorrower.status === 'Overdue' ? 'danger' : 'success'} styles={{ root: { fontSize: 10 } }}>
                          {selectedBorrower.status}
                        </Badge>
                      </Group>
                      <Text size="xs" c="slate.5" mt={2}>
                        CIF: {selectedBorrower.cif} | {selectedBorrower.phone}
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  search.trim() && (
                    <Stack gap={8} mt="sm">
                      {isSearching ? (
                        <Text size="xs" c="slate.5" py={8}>Searching...</Text>
                      ) : matches.length === 0 ? (
                        <Text size="xs" c="slate.5" py={8}>No borrowers found.</Text>
                      ) : (
                        matches.map((borrower) => (
                          <Box
                            key={borrower.cif}
                            component="button"
                            type="button"
                            onClick={() => handleSelectBorrower(borrower)}
                            p="sm"
                            className="lms-cap-borrower-btn"
                            style={{
                              textAlign: 'left',
                              borderRadius: 'var(--mantine-radius-md)',
                              border: '1px solid var(--mantine-color-slate-2)',
                              background: 'var(--mantine-color-white)',
                              cursor: 'pointer',
                              transition: 'background-color 120ms ease',
                            }}
                          >
                            <Group justify="space-between" wrap="nowrap">
                              <Text size="sm" fw={700} c="slate.8">
                                {borrower.name}
                              </Text>
                              <Badge size="sm" variant="light" color={borrower.status === 'Overdue' ? 'danger' : 'success'} styles={{ root: { fontSize: 10 } }}>
                                {borrower.status}
                              </Badge>
                            </Group>
                            <Text size="xs" c="slate.5" mt={2}>
                              CIF: {borrower.cif} | {borrower.phone}
                            </Text>
                          </Box>
                        ))
                      )}
                    </Stack>
                  )
                )}

                {selectedBorrower && (
                  <Box mt="sm">
                    <Text size="xs" fw={600} c="slate.5" tt="uppercase" mb={8}>
                      Select Active Loan Account
                    </Text>
                    <Stack gap={8}>
                      {selectedBorrower.loans.map((loan) => {
                        const isActive = selectedLoanId === loan.id;
                        return (
                          <Box
                            key={loan.id}
                            component="button"
                            type="button"
                            disabled={isView}
                            onClick={() => handleSelectLoan(loan)}
                            p="sm"
                            style={{
                              textAlign: 'left',
                              borderRadius: 'var(--mantine-radius-md)',
                              border: `1px solid var(--mantine-color-${isActive ? 'brand-4' : 'slate-2'})`,
                              background: isActive ? 'var(--mantine-color-brand-0)' : 'var(--mantine-color-white)',
                              boxShadow: isActive ? `0 0 0 1px var(--mantine-color-brand-2)` : 'none',
                              cursor: isView ? 'default' : 'pointer',
                              opacity: isView ? 0.8 : 1,
                            }}
                          >
                            <Text size="sm" fw={700} c="slate.8">
                              {loan.type} - {loan.id}
                            </Text>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Main form */}
          <Box style={{ flex: 1, position: 'relative', overflowY: 'auto' }} bg="white">
            <Box
              style={{
                borderRadius: 'var(--mantine-radius-lg)',
                border: '1px solid var(--mantine-color-slate-2)',
                minHeight: '100%',
                transition: 'opacity 300ms ease, filter 300ms ease',
                pointerEvents: !selectedLoan ? 'none' : undefined,
                userSelect: !selectedLoan ? 'none' : undefined,
                opacity: !selectedLoan ? 0.5 : 1,
                filter: !selectedLoan ? 'blur(2px)' : 'none',
              }}
              p="md"
            >
              <Group gap={8} mb="xs">
                <IconChecklist size={16} color="var(--mantine-color-brand-6)" />
                <Group gap={6}>
                  <Text size="sm" fw={700} c="slate.8">
                    Executing Capitalization for
                  </Text>
                  <Badge variant="light" color="brand" radius="sm" size="sm">
                    {selectedLoan?.id ?? '—'}
                  </Badge>
                  <Text size="sm" c="slate.4">/</Text>
                  <Badge variant="light" color="gold" radius="sm" size="sm">
                    {selectedBorrower?.name ?? '—'}
                  </Badge>
                </Group>
              </Group>

              <TextInput
                size="sm"
                withAsterisk
                type="date"
                label="Value Date"
                disabled={isView}
                value={valueDate}
                onChange={(e) => setValueDate(e.currentTarget.value)}
                leftSection={<IconCalendarDue size={14} color="var(--mantine-color-success-6)" />}
                w={260}
                styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)', marginBottom: 4 } }}
              />

              <Box mt="sm">
                <Text size="sm" fw={700} c="slate.8" mb="xs">
                  Capitalization Breakdown
                </Text>

                
                  
                      <Box style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
              <Table
                verticalSpacing="md"
                horizontalSpacing="xl"
                withRowBorders={true}
                styles={{
                  table: {
                    borderCollapse: "collapse",
                    margin: 0,
                  },
                }}
              >
                <Table.Thead style={{ background: "var(--mantine-color-slate-0)" }}>
                  <Table.Tr>
                    <Table.Th c="slate.5" fz="xs" tt="uppercase" w="30%">Component</Table.Th>
                    <Table.Th c="slate.5" fz="xs" fw={600} tt="uppercase" w="28%" ta="right">Arrears</Table.Th>
                    <Table.Th c="slate.5" fz="xs" tt="uppercase" w="40%" ta="right">Capitalized Amount</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[
                    { label: "Interest", arrears: dues?.interest_amount ?? 0, value: capitalizedInterest, onChange: setCapitalizedInterest, max: dues?.interest_amount, type: "Interest Capitalization" },
                    { label: "Penalty", arrears: dues?.penalty_amount ?? 0, value: capitalizedPenalty, onChange: setCapitalizedPenalty, max: dues?.penalty_amount, type: "Penalty Capitalization" },
                    { label: "Charge / Fee", arrears: dues?.total_charges_payable ?? 0, value: capitalizedFee, onChange: setCapitalizedFee, max: dues?.total_charges_payable, type: "Charges Capitalization" },
                  ].map((row) => (
                    <Table.Tr key={row.label} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
                      <Table.Td>
                        <Text size="sm" fw={700} c="slate.8">
                          {row.label}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" ff="monospace" c="slate.6" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {isDuesLoading ? "..." : formatAmount(companyCurrency, row.arrears, { withSymbol: true })}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <NumberInput
                          hideControls
                          placeholder="0.00"
                          thousandSeparator=","
                          decimalScale={2}
                          min={0}
                          radius="sm"
                          max={row.max}
                          disabled={isView || (editId ? editRecordType !== row.type : false)}
                          value={row.value}
                          onChange={(v) => row.onChange(v as number | "")}
                          rightSection={<Text size="xs" fw={600} c="slate.4">{companyCurrency}</Text>}
                          rightSectionWidth={48}
                          styles={{
                            root: { maxWidth: "190px", marginLeft: "auto" },
                            input: {
                              textAlign: "right",
                              paddingRight: 44,
                              fontWeight: 600,
                              backgroundColor: "var(--mantine-color-slate-0)",
                              borderColor: "var(--mantine-color-slate-2)",
                            },
                          }}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
              </Box>

              <div className="mt-4 w-2/3">
                  <Textarea
                    size="sm"
                    label="Comment"
                    placeholder="Add a comment or description..."
                    disabled={isView}
                    value={comment}
                    onChange={(e) => setComment(e.currentTarget.value)}
                    minRows={2}
                    maxRows={4}
                    autosize
                    variant={isView ? 'filled' : 'default'}
                    leftSection={<IconNotes size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
                    leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '10px' } }}
                  />
              </div>
            </Box>

            {!selectedLoan && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(3px)',
                }}
              >
                <Box
                  w={440}
                  style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    border: '1px solid var(--mantine-color-brand-2)',
                    background: 'var(--mantine-color-white)',
                    boxShadow: 'var(--mantine-shadow-xl)',
                  }}
                >
                  <Group justify="center" pt="xl">
                    <Box
                      w={64}
                      h={64}
                      style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        background: 'var(--mantine-color-brand-1)',
                        border: '1px solid var(--mantine-color-brand-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconChecklist size={30} color="var(--mantine-color-brand-7)" />
                    </Box>
                  </Group>
                  <Box px="xl" py="lg" ta="center">
                    <Text size="xl" fw={700} c="slate.8">
                      No Loan Account Selected
                    </Text>
                    <Text size="sm" c="slate.5" mt="sm" style={{ lineHeight: 1.6 }}>
                      To proceed with a capitalization transaction, first search for a borrower and select one of their active loan accounts from the panel on the left.
                    </Text>
                    <Box mt="sm" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-slate-2)', background: 'var(--mantine-color-slate-0)' }}>
                      <Text size="xs" fw={700} c="brand.6" tt="uppercase">
                        Next Step
                      </Text>
                      <Text size="sm" c="slate.7" mt={4}>
                        Select a borrower → Choose a loan account → Process capitalization
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* Dues summary */}
          <div
            className="w-75 p-5 shrink-0 flex flex-col shadow-(--mantine-shadow-lg)"
            style={{ borderLeft: "1px solid var(--mantine-color-slate-2)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded" style={{ background: theme.other.accentBarGradient }} />
              <Text size="sm" fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                Dues Summary
              </Text>
            </div>

            {!selectedLoan ? (
              <Text size="xs" c="dimmed" className="py-8 text-center">
                Select a loan account on the left to view dues.
              </Text>
            ) : (
              <div className="flex flex-col gap-3">
                <div
                  className="flex items-center gap-2 rounded-md p-2.5"
                  style={{ background: 'var(--mantine-color-slate-1)', border: '1px solid var(--mantine-color-slate-2)' }}
                >
                  <div className="p-1.5 rounded-md flex items-center justify-center shrink-0" style={{ background: '#EEF2FF' }}>
                    <IconCalendarDue size={14} style={{ color: 'var(--mantine-color-brand-6)' }} />
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">EMI Date</Text>
                   <Text size="sm" fw={700} c="slate.8">
  {isDuesLoading ? 'Loading...' : fmtDate(dues?.due_date || '')}
</Text>
                  </div>
                </div>

                <div
                  className="rounded-md p-3 flex flex-col gap-2"
                  style={{ background: 'var(--mantine-color-slate-1)', border: '1px solid var(--mantine-color-slate-2)' }}
                >
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Principal Due</Text>
                    <Text size="xs" c="slate.7" className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
  {formatAmount(companyCurrency, dues?.payable_principal_amount ?? 0, { withSymbol: true })}
</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Interest Due</Text>
                    <Text size="xs" c="slate.7" className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
  {formatAmount(companyCurrency, dues?.interest_amount ?? 0, { withSymbol: true })}
</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Penalty</Text>
                    <Text size="xs" c="slate.7" className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
  {formatAmount(companyCurrency, dues?.penalty_amount ?? 0, { withSymbol: true })}
</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Fees/Charges</Text>
                    <Text size="xs" c="slate.7" className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
  {formatAmount(companyCurrency, dues?.total_charges_payable ?? 0, { withSymbol: true })}
</Text>
                  </div>
                  <div className="border-t border-gray-100 my-0.5" />
                  <div className="flex justify-between items-center">
                    <Text size="sm" fw={700} c="slate.8">Total Amount Due</Text>
                    <Text size="sm" fw={700} c="slate.8" className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
  {formatAmount(companyCurrency, dues?.payable_amount ?? 0, { withSymbol: true })}
</Text>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="brand"
                  fullWidth
                  className="mt-4"
                  leftSection={<IconReportMoney size={14} />}
                  onClick={() => setPaymentEffectOpened(true)}
                >
                  Capitalization Effect
                </Button>
              </div>
            )}
          </div>
        </Group>

        <ModalFooter 
          variant="theme"
          isViewMode={isView}
          onClose={onClose}
          submitLabel={editId ? 'Update' : 'Save'}
          submitDisabled={!selectedLoan || !hasAnyCapitalizedAmount || isPending}
          submitLoading={isPending}
          onSubmit={handleSubmit}
        />
      </Box>

     <PaymentEffectModal
  opened={paymentEffectOpened}
  onClose={() => setPaymentEffectOpened(false)}
  loanId={selectedLoan?.id ?? ''}
  customerName={selectedBorrower?.name ?? ''}
  rows={paymentEffectRows}
  currency={companyCurrency}
/>
    </Modal>
  );
}
