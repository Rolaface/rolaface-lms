import { useEffect, useMemo, useState } from 'react';
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
import { showApiError, showSuccess, showValidationError } from '../../utils/alert';

interface LoanCapitalizationModalProps {
  opened: boolean;
  onClose: () => void;
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

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

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
}

function PaymentEffectModal({ opened, onClose, loanId, customerName, rows }: PaymentEffectModalProps) {
  const theme = useMantineTheme();
  return (
    <Modal opened={opened} onClose={onClose} size={640} withCloseButton={false} padding={0} radius="lg">
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
                Payment Effect
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
          <Table withTableBorder withColumnBorders striped verticalSpacing="sm" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th c="slate.5" fz="xs" tt="uppercase">Component</Table.Th>
                <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right">Before</Table.Th>
                <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right">After</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.component}>
                  <Table.Td fz="sm" fw={600} c="slate.7">{row.component}</Table.Td>
                  <Table.Td ta="right" fz="sm" c="slate.6" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                    {formatCurrency(row.before)}
                  </Table.Td>
                  <Table.Td ta="right" fz="sm" fw={700} c="success.7" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                    {formatCurrency(row.after)}
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

export function LoanCapitalizationModal({ opened, onClose, onSubmit, editId, isView }: LoanCapitalizationModalProps) {
  const theme = useMantineTheme();
  const [search, setSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [borrowerPanelCollapsed, setBorrowerPanelCollapsed] = useState(false);

  const [valueDate, setValueDate] = useState(new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState('');

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
    if (opened && editId && editDetailsResponse) {
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
      setRemark('');

      setCapitalizedInterest('');
      setCapitalizedPenalty('');
      setCapitalizedFee('');
      setEditRecordType(item.repayment_type);

      if (item.repayment_type === 'Interest Capitalization') setCapitalizedInterest(item.amount_paid ?? '');
      else if (item.repayment_type === 'Penalty Capitalization') setCapitalizedPenalty(item.amount_paid ?? '');
      else if (item.repayment_type === 'Charges Capitalization') setCapitalizedFee(item.amount_paid ?? '');
    } else if (opened && !editId) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editId, editDetailsResponse]);

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
      { component: 'Total Outstanding', before: totalDue, after: totalDue },
      { component: 'Principal Outstanding', before: principalDue, after: clamp(principalDue + totalCapitalized) },
      { component: 'Arrears', before: totalDue, after: clamp(totalDue - totalCapitalized) },
      {
        component: 'Interest Payable',
        before: interestDue,
        after: clamp(interestDue - Math.min(Number(capitalizedInterest) || 0, interestDue)),
      },
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
    setCapitalizedInterest('');
    setCapitalizedPenalty('');
    setCapitalizedFee('');
    setEditRecordType(null);
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
      showValidationError('Please enter at least one capitalized amount before submitting.');
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
          onSuccess: () => showSuccess('Loan capitalization updated successfully.'),
          onError: () => showApiError('Something went wrong while updating the capitalization.'),
        }
      );
      return;
    }

    const entries: { repayment_type: string; amount: number }[] = [];
    if (Number(capitalizedInterest) > 0) entries.push({ repayment_type: toCapitalizationType('interest'), amount: Number(capitalizedInterest) });
    if (Number(capitalizedPenalty) > 0) entries.push({ repayment_type: toCapitalizationType('penalty'), amount: Number(capitalizedPenalty) });
    if (Number(capitalizedFee) > 0) entries.push({ repayment_type: toCapitalizationType('fee'), amount: Number(capitalizedFee) });

    if (entries.length === 0) {
      showValidationError('Please enter at least one capitalized amount before submitting.');
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
      showSuccess('Loan capitalization processed successfully.');
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
        capitalizedInterest,
        capitalizedPenalty,
        capitalizedFee,
      });
      handleReset();
      onClose();
    } catch (err) {
      showApiError('Something went wrong while processing the capitalization.');
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const isPending = isSubmittingAll || updateCapitalizationMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
          <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
            <IconX size={16} color="white" />
          </ActionIcon>
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
                  <Group gap={8}>
                    <Box w={4} h={16} style={{ borderRadius: 4, background: theme.other.brandGradient }} />
                    <Text size="sm" fw={700} c="slate.8">
                      Borrower Selection
                    </Text>
                  </Group>
                  {selectedBorrower && (
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

                {selectedBorrower ? (
                  <Box mt="md">
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
                    <Stack gap={8} mt="md">
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
                  <Box mt="lg">
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
              p="lg"
            >
              <Group gap={8} mb="sm">
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

              <Box mt="20">
                <Text size="sm" fw={700} c="slate.8" mb="sm">
                  Capitalization Breakdown
                </Text>

                <Table withTableBorder withColumnBorders striped highlightOnHover verticalSpacing="sm" style={{ border: '1px solid var(--mantine-color-slate-2)' }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th c="slate.5" fz="xs" tt="uppercase" w={180}>Component</Table.Th>
                      <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right" w={180}>Arrears</Table.Th>
                      <Table.Th c="slate.5" fz="xs" tt="uppercase" ta="right" w={180}>Capitalized Amount</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={600} c="slate.7">Interest</Table.Td>
                      <Table.Td ta="right" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                        {isDuesLoading ? '...' : formatCurrency(dues?.interest_amount ?? 0)}
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          hideControls
                          placeholder="0.00"
                          thousandSeparator=","
                          decimalScale={2}
                          min={0}
                          max={dues?.interest_amount}
                          disabled={isView || (editId ? editRecordType !== 'Interest Capitalization' : false)}
                          value={capitalizedInterest}
                          onChange={(v) => setCapitalizedInterest(v as number | '')}
                        />
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={600} c="slate.7">Penalty</Table.Td>
                      <Table.Td ta="right" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                        {isDuesLoading ? '...' : formatCurrency(dues?.penalty_amount ?? 0)}
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          hideControls
                          placeholder="0.00"
                          thousandSeparator=","
                          decimalScale={2}
                          min={0}
                          max={dues?.penalty_amount}
                          disabled={isView || (editId ? editRecordType !== 'Penalty Capitalization' : false)}
                          value={capitalizedPenalty}
                          onChange={(v) => setCapitalizedPenalty(v as number | '')}
                        />
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={600} c="slate.7">Charge / Fee</Table.Td>
                      <Table.Td ta="right" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                        {isDuesLoading ? '...' : formatCurrency(dues?.total_charges_payable ?? 0)}
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          hideControls
                          placeholder="0.00"
                          thousandSeparator=","
                          decimalScale={2}
                          min={0}
                          max={dues?.total_charges_payable}
                          disabled={isView || (editId ? editRecordType !== 'Charges Capitalization' : false)}
                          value={capitalizedFee}
                          onChange={(v) => setCapitalizedFee(v as number | '')}
                        />
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Box>

              <TextInput
                size="sm"
                label="Remark"
                placeholder="Add a note about this capitalization (optional)"
                disabled={isView}
                value={remark}
                onChange={(e) => setRemark(e.currentTarget.value)}
                leftSection={<IconNotes size={14} color="var(--mantine-color-slate-4)" />}
                mt="lg"
                styles={{ label: { fontWeight: 600, color: 'var(--mantine-color-slate-7)', marginBottom: 4 } }}
              />
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
                    <Box mt="lg" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-slate-2)', background: 'var(--mantine-color-slate-0)' }}>
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
          <div className="w-[300px] p-5 shrink-0 overflow-y-auto" style={{ borderLeft: '1px solid var(--mantine-color-slate-2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded" style={{ background: theme.other.brandGradient }} />
              <Text size="xs" fw={700} c="slate.8" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
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
                      {isDuesLoading ? 'Loading...' : dues?.due_date || '—'}
                    </Text>
                  </div>
                </div>

                <div
                  className="rounded-md p-3 flex flex-col gap-2"
                  style={{ background: 'var(--mantine-color-slate-1)', border: '1px solid var(--mantine-color-slate-2)' }}
                >
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Principal Due</Text>
                    <Text size="xs" c="slate.7" className="font-mono">
                      {formatCurrency(dues?.payable_principal_amount ?? 0)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Interest Due</Text>
                    <Text size="xs" c="slate.7" className="font-mono">
                      {formatCurrency(dues?.interest_amount ?? 0)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Penalty</Text>
                    <Text size="xs" c="slate.7" className="font-mono">
                      {formatCurrency(dues?.penalty_amount ?? 0)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="xs" c="dimmed">Fees/Charges</Text>
                    <Text size="xs" c="slate.7" className="font-mono">
                      {formatCurrency(dues?.total_charges_payable ?? 0)}
                    </Text>
                  </div>
                  <div className="border-t border-gray-100 my-0.5" />
                  <div className="flex justify-between items-center">
                    <Text size="sm" fw={700} c="slate.8">Total Amount Due</Text>
                    <Text size="sm" fw={700} c="slate.8" className="font-mono">
                      {formatCurrency(dues?.payable_amount ?? 0)}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Group>

        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={onClose}
          leftSlot={
            <Button
              size="sm"
              radius="xl"
              variant="light"
              color="brand"
              disabled={!selectedLoan}
              leftSection={<IconReportMoney size={14} />}
              onClick={() => setPaymentEffectOpened(true)}
              px="md"
            >
              Payment Effect
            </Button>
          }
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
      />
    </Modal>
  );
}