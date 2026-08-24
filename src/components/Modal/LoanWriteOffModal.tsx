import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  getWriteOffAccounts,
  getLoanAccounts,
  createLoanWriteOff,
  updateLoanWriteOff,
} from '../../api/lendingOperation/writeoff';
import type { WriteOffAccountItem, LoanAccountItem, LoanWriteOffDetail } from '../../types/loanWriteOff';
import { parseFrappeError } from '../../utils/parseFrappeError';
import { openCommonModal } from './AlertModal';
import { ModalFooter } from '../shared/ModalFooter';
import { formatAmount, useCurrencyReady } from '../../store/currencyStore';
import { useCompanyStore } from '../../store/companyStore';

import {
  Box,
  Text,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Group,
  Stack,
  ActionIcon,
  ThemeIcon,
  useMantineTheme,
} from '@mantine/core';
import { IconX, IconFileOff, IconMinus } from '@tabler/icons-react';

interface LoanWriteOffModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onSubmit?: (data: LoanWriteOffFormData) => void;
  editData?: LoanWriteOffDetail | null;
  isView?: boolean
}

export interface LoanWriteOffFormData {
  loanAc: string;
  valueDate: string;
  principalOutstanding: number | '';
  writeOffPercentage: number | '';
  writeOffAmount: number | '';
  writeOffAccount: string | null;
}

const ACCOUNT_SUMMARY = {
  customerName: 'Rohan Mehta',
  npa: true,
  classification: 'Sub-Standard',
  dpd: 132,
  outstanding: 486250,
};

export function LoanWriteOffModal({ opened, onClose, onMinimize, onSubmit, editData, isView }: LoanWriteOffModalProps) {
  const theme = useMantineTheme();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();
  const isEdit = !!editData;

  const title = isView ? 'View Write Off' : isEdit ? 'Update Write Off' : 'Write Off Loan';
  const description = 'Record a principal write-off against a loan account.';

  const [loanAc, setLoanAc] = useState('');
  const [valueDate, setValueDate] = useState('');
  const [principalOutstanding, setPrincipalOutstanding] = useState<number | ''>('');
  const [writeOffPercentage, setWriteOffPercentage] = useState<number | ''>('');
  const [writeOffAmount, setWriteOffAmount] = useState<number | ''>('');
  const [writeOffAccount, setWriteOffAccount] = useState<string | null>(null);
  const [accountOptions, setAccountOptions] = useState<WriteOffAccountItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [loanAccountOptions, setLoanAccountOptions] = useState<LoanAccountItem[]>([]);
  const [loanAccountsLoading, setLoanAccountsLoading] = useState(false);
  const [loanAcSearch, setLoanAcSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------- ALERT HELPERS (same pattern as AddLoanCategoryModal) ----------
  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: 'red',
      buttons: [{ label: 'Close', color: 'red' }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'Close', color: 'green' }],
    });
  };

  useEffect(() => {
    

    let active = true;
    setAccountsLoading(true);

    getWriteOffAccounts({ page: 1, page_size: 10, search: accountSearch })
      .then((res) => {
        if (active) setAccountOptions(res.data);
      })
      .catch(() => {
        if (active) setAccountOptions([]);
      })
      .finally(() => {
        if (active) setAccountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accountSearch]);

  useEffect(() => {
    

    let active = true;
    setLoanAccountsLoading(true);

    getLoanAccounts({ page: 1, page_size: 10, search: loanAcSearch })
      .then((res) => {
        if (active) setLoanAccountOptions(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (active) setLoanAccountOptions([]);
      })
      .finally(() => {
        if (active) setLoanAccountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loanAcSearch]);

  useEffect(() => {
    if (editData) {
      setLoanAc(editData.loan);
      setValueDate(editData.value_date);
      setWriteOffAmount(editData.write_off_amount);
      setWriteOffAccount(editData.write_off_account);
    } else {
      setLoanAc('');
      setValueDate('');
      setPrincipalOutstanding('');
      setWriteOffPercentage('');
      setWriteOffAmount('');
      setWriteOffAccount(null);
      setErrors({});
    }
  }, [editData]);

  useEffect(() => {
    if (editData && loanAccountOptions.length > 0) {
      const matchedLoan = loanAccountOptions.find((acc) => acc.name === editData.loan);
      if (matchedLoan) {
        setPrincipalOutstanding(matchedLoan.pending_principal_amount);
      }
    }
  }, [editData, loanAccountOptions]);

  const handlePercentageChange = (value: number | '') => {
    setWriteOffPercentage(value);
    if (value !== '' && principalOutstanding !== '') {
      const amount = (Number(principalOutstanding) * Number(value)) / 100;
      setWriteOffAmount(Math.round(amount * 100) / 100);
    } else {
      setWriteOffAmount('');
    }
  };

  const handleLoanAcChange = (value: string | null) => {
    setLoanAc(value ?? '');
    if (value) setErrors((e) => ({ ...e, loanAc: '' }));
    const selected = loanAccountOptions.find((acc) => acc.name === value);
    if (selected) {
      setPrincipalOutstanding(selected.pending_principal_amount);
    } else {
      setPrincipalOutstanding('');
    }
  };

  const handleAmountChange = (value: number | '') => {
    setWriteOffAmount(value);
    if (value !== '') setErrors((e) => ({ ...e, writeOffAmount: '' }));
    if (value !== '' && principalOutstanding !== '' && Number(principalOutstanding) > 0) {
      const percentage = (Number(value) / Number(principalOutstanding)) * 100;
      setWriteOffPercentage(Math.round(percentage * 100) / 100);
    } else {
      setWriteOffPercentage('');
    }
  };

  const handleReset = () => {
    setLoanAc('');
    setValueDate('');
    setPrincipalOutstanding('');
    setWriteOffPercentage('');
    setWriteOffAmount('');
    setWriteOffAccount(null);
    setErrors({});
  };

  const handleModalClose = () => {
    handleReset();
    handleModalClose();
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!loanAc) next.loanAc = 'Loan A/c is required';
    if (!valueDate) next.valueDate = 'Value Date is required';
    if (writeOffAmount === '') next.writeOffAmount = 'Write-off Amount is required';
    if (!writeOffAccount) next.writeOffAccount = 'Write-off Account is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveWriteOffMutation = useMutation({
    mutationFn: (payload: {
      loan: string;
      write_off_amount: number;
      write_off_account: string;
      posting_date: string;
      value_date: string;
      is_settlement_write_off: 1;
    }) =>
      editData
        ? updateLoanWriteOff({ name: editData.name, ...payload })
        : createLoanWriteOff(payload),
    onSuccess: () => {
      showSuccess(
        isEdit ? 'Write-off Updated' : 'Write-off Created',
        isEdit ? 'Write-off updated successfully.' : 'Write-off created successfully.'
      );
      onSubmit?.({
        loanAc,
        valueDate,
        principalOutstanding,
        writeOffPercentage,
        writeOffAmount,
        writeOffAccount,
      });
      handleModalClose();
    },
    onError: (err) => showError(isEdit ? 'Update Failed' : 'Create Failed', err),
  });

  const handleSubmit = () => {
    if (!validate()) return;
    if (!writeOffAccount) return;

    const postingDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD, today

    saveWriteOffMutation.mutate({
      loan: loanAc,
      write_off_amount: Number(writeOffAmount),
      write_off_account: writeOffAccount,
      posting_date: postingDate,
      value_date: valueDate,
      is_settlement_write_off: 1,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="1000px"
      padding={0}
      lockScroll
      styles={{
        content: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: { display: 'none', padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
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
          style={{ borderBottom: '1px solid var(--mantine-color-brand-7)' }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconFileOff size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: '-0.01em' }}>
                {title}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                {description}
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={() => onMinimize?.()}
              aria-label="Minimize"
            >
              <IconMinus size={16} color="white" />
            </ActionIcon>
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
        </Group>

        {/* Body: main form + summary sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main form column */}
          <Box className="flex-1 overflow-y-auto" px="xl" py="lg" bg="slate.0">
            <Stack gap="md">
              {/* Row 1: Loan A/c (wide), Value Date (narrow), Principal Outstanding (narrow) */}
              <div
                className="grid gap-x-6 gap-y-4"
                style={{ gridTemplateColumns: '1.7fr 1fr 1fr' }}
              >
                <Select
                  size="sm"
                  withAsterisk
                  label="Loan A/c"
                  placeholder="Search loan account"
                  data={
                    loanAc && !loanAccountOptions.some((acc) => acc.name === loanAc)
                      ? [
                        { value: loanAc, label: loanAc },
                        ...loanAccountOptions.map((acc) => ({ value: acc.name, label: acc.name })),
                      ]
                      : loanAccountOptions.map((acc) => ({ value: acc.name, label: acc.name }))
                  }
                  value={loanAc || null}
                  onChange={handleLoanAcChange}
                  searchable
                  searchValue={loanAcSearch}
                  onSearchChange={setLoanAcSearch}
                  nothingFoundMessage={loanAccountsLoading ? 'Loading...' : 'No accounts found'}
                  error={errors.loanAc}
                />

                <TextInput
                  size="sm"
                  withAsterisk
                  type="date"
                  label="Value Date"
                  value={valueDate}
                  onChange={(e) => {
                    setValueDate(e.currentTarget.value);
                    if (e.currentTarget.value) setErrors((er) => ({ ...er, valueDate: '' }));
                  }}
                  error={errors.valueDate}
                />

                <NumberInput
                  size="sm"
                  withAsterisk
                  hideControls
                  label="Principal Outstanding"
                  placeholder="Auto-filled on account selection"
                  value={principalOutstanding}
                  onChange={(v) => setPrincipalOutstanding(v as number | '')}
                  thousandSeparator=","
                  readOnly
                  hideControls
                />
              </div>

              {/* Row 2: Write-off Account (same width as Loan A/c), Write-off Amount, Write-off Percentage (fill remaining space) */}
              <div
                className="grid gap-x-6 gap-y-4"
                style={{ gridTemplateColumns: '1.7fr 1fr 1fr' }}
              >
                <Select
                  size="sm"
                  withAsterisk
                  label="Write-off Account"
                  placeholder="Select write-off account"
                  data={
                    writeOffAccount && !accountOptions.some((a) => a.value === writeOffAccount)
                      ? [
                        { value: writeOffAccount, label: writeOffAccount },
                        ...accountOptions.map((a) => ({ value: a.value, label: a.label })),
                      ]
                      : accountOptions.map((a) => ({ value: a.value, label: a.label }))
                  }
                  value={writeOffAccount}
                  onChange={(value) => {
                    setWriteOffAccount(value);
                    if (value) setErrors((e) => ({ ...e, writeOffAccount: '' }));
                  }}
                  searchable
                  searchValue={accountSearch}
                  onSearchChange={setAccountSearch}
                  nothingFoundMessage={accountsLoading ? 'Loading...' : 'No accounts found'}
                  error={errors.writeOffAccount}
                />

                <div>
                  <NumberInput
                    size="sm"
                    withAsterisk
                    hideControls
                    label="Write-off Amount"
                    placeholder="Enter amount"
                    value={writeOffAmount}
                    onChange={(v) => handleAmountChange(v as number | '')}
                    thousandSeparator=","
                    error={errors.writeOffAmount}
                    hideControls
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    Linked to percentage
                  </Text>
                </div>

                <div>
                  <NumberInput
                    size="sm"
                    withAsterisk
                    label="Write-off Percentage"
                    placeholder="Enter percentage"
                    value={writeOffPercentage}
                    onChange={(v) => handlePercentageChange(v as number | '')}
                    max={100}
                    min={0}
                    hideControls
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    Linked to amount
                  </Text>
                </div>
              </div>
            </Stack>
          </Box>

          {/* Summary sidebar */}
          <Box
            className="w-[280px] shrink-0 overflow-y-auto"
            style={{ borderLeft: '1px solid var(--mantine-color-slate-2)' }}
            p="md"
          >
            <Text size="sm" fw={700} c="slate.7" tt="uppercase" mb="sm" style={{ letterSpacing: '0.05em' }}>
              Summary
            </Text>
            <Stack gap="sm">
              <SummaryCard>
                <Stack gap={2}>
                  <SummaryRow label="Customer Name" value={ACCOUNT_SUMMARY.customerName} bold />
                  <SummaryRow label="NPA" value={ACCOUNT_SUMMARY.npa ? 'Yes' : 'No'} />
                  <SummaryRow label="Classification" value={ACCOUNT_SUMMARY.classification} />
                  <SummaryRow label="DPD" value={`${ACCOUNT_SUMMARY.dpd} days`} />
                  <SummaryRow label="Outstanding" value={formatAmount(companyCurrency, ACCOUNT_SUMMARY.outstanding, { withSymbol: true })} bold />
                </Stack>
              </SummaryCard>

              <div
                style={{
                  background: theme.other.brandGradient as string,
                  boxShadow: theme.other.brandGlowShadowSm as string,
                  borderRadius: 'var(--mantine-radius-lg)',
                  padding: '12px 16px',
                }}
              >
                <Text size="xxs" fw={700} c="brand.1" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Write-off Amount
                </Text>
             <Text fw={800} c="white" ff="monospace" style={{ fontSize: 22, lineHeight: 1.25, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
  {writeOffAmount !== '' ? formatAmount(companyCurrency, Number(writeOffAmount), { withSymbol: true }) : '—'}
</Text>
              </div>
            </Stack>
          </Box>
        </div>

        {/* Footer */}
        <ModalFooter
          variant="theme"
          isViewMode={isView}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Update' : 'Save'}
          submitLoading={saveWriteOffMutation.isPending}
        />
      </Box>
    </Modal>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap" py={5}>
      <Text size="xs" c="slate.5">
        {label}
      </Text>
      <Text size="xs" fw={bold ? 700 : 600} c="slate.8" ff="monospace" ta="right">
        {value}
      </Text>
    </Group>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--mantine-color-slate-1)',
        border: '1px solid var(--mantine-color-slate-2)',
        borderRadius: 'var(--mantine-radius-lg)',
        padding: '10px 12px',
      }}
    >
      {children}
    </div>
  );
}
