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
import { showSuccess, showApiError } from '../../utils/alert';
import { ModalFooter } from '../shared/ModalFooter';

import {
  Box,
  Text,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Badge,
  Group,
  Stack,
  ActionIcon,
  ThemeIcon,
} from '@mantine/core';
import {
  IconX,
  IconSearch,
  IconCalendar,
  IconCurrencyRupee,
  IconChevronDown,
  IconPercentage,
  IconBuildingBank,
  IconUser,
  IconAlertTriangle,
  IconTag,
  IconClock,
  IconFileInvoice,
  IconRefresh,
  IconFileOff,
} from '@tabler/icons-react';

interface LoanWriteOffModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (data: LoanWriteOffFormData) => void;
  editData?: LoanWriteOffDetail | null;
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

const labelClass = { label: 'text-sm font-medium text-gray-700 mb-1' };
const chevronDown = <IconChevronDown size={14} className="text-gray-500" />;

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function LoanWriteOffModal({ opened, onClose, onSubmit, editData }: LoanWriteOffModalProps) {
  const isEdit = !!editData;

  const title = isEdit ? 'Update Write Off' : 'Write Off Loan';
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

  useEffect(() => {
    if (!opened) return;

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
  }, [opened, accountSearch]);

  useEffect(() => {
    if (!opened) return;

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
  }, [opened, loanAcSearch]);

  useEffect(() => {
    if (!opened) return;

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
  }, [editData, opened]);

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
      showSuccess(isEdit ? 'Write-off updated successfully.' : 'Write-off created successfully.');
      onSubmit?.({
        loanAc,
        valueDate,
        principalOutstanding,
        writeOffPercentage,
        writeOffAmount,
        writeOffAccount,
      });
      onClose();
    },
    onError: (err) => {
      showApiError(parseFrappeError(err));
    },
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
      onClose={onClose}
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
          <ActionIcon
            variant="subtle"
            color="white"
            radius="xl"
            size="md"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={16} color="white" />
          </ActionIcon>
        </Group>

        {/* Body: main form + summary sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main form column */}
          <Box className="flex-1 overflow-y-auto" px="xl" py="lg" bg="slate.0">
            <Stack gap="md">
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
                leftSection={<IconSearch size={14} className="text-gray-400" />}
                error={errors.loanAc}
                classNames={labelClass}
                styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              />

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
                  leftSection={<IconCalendar size={14} className="text-emerald-600" />}
                  error={errors.valueDate}
                  classNames={labelClass}
                  styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
                />
                <NumberInput
                  size="sm"
                  withAsterisk
                  label="Principal Outstanding"
                  placeholder="Auto-filled on account selection"
                  value={principalOutstanding}
                  onChange={(v) => setPrincipalOutstanding(v as number | '')}
                  leftSection={<IconCurrencyRupee size={14} className="text-orange-500" />}
                  thousandSeparator=","
                  readOnly
                  classNames={labelClass}
                  styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
                />

                <div>
                  <NumberInput
                    size="sm"
                    withAsterisk
                    label="Write-off Percentage"
                    placeholder="Enter percentage"
                    value={writeOffPercentage}
                    onChange={(v) => handlePercentageChange(v as number | '')}
                    leftSection={<IconPercentage size={14} className="text-indigo-500" />}
                    max={100}
                    min={0}
                    classNames={labelClass}
                    styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
                  />
                  <Text size="xs" c="dimmed" className="mt-1">
                    Linked to amount
                  </Text>
                </div>

                <div>
                  <NumberInput
                    size="sm"
                    withAsterisk
                    label="Write-off Amount"
                    placeholder="Enter amount"
                    value={writeOffAmount}
                    onChange={(v) => handleAmountChange(v as number | '')}
                    leftSection={<IconCurrencyRupee size={14} className="text-orange-500" />}
                    thousandSeparator=","
                    error={errors.writeOffAmount}
                    classNames={labelClass}
                    styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
                  />
                  <Text size="xs" c="dimmed" className="mt-1">
                    Linked to percentage
                  </Text>
                </div>
              </div>

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
                leftSection={<IconBuildingBank size={14} className="text-indigo-500" />}
                rightSection={chevronDown}
                error={errors.writeOffAccount}
                classNames={labelClass}
                styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              />
            </Stack>
          </Box>

          {/* Summary sidebar */}
          <Box className="w-[280px] shrink-0 overflow-y-auto" style={{ borderLeft: '1px solid var(--mantine-color-slate-2)' }} p="sm">
            <Group gap="xs" mb={2}>
              <div className="w-1 h-4 rounded bg-gradient-to-b from-[#7C3AED] to-[#4F46E5]" />
              <Text size="sm" fw={700} c="slate.8">
                Summary
              </Text>
            </Group>
            <Stack gap="sm">
              <SummaryItem
                icon={<IconUser size={14} className="text-gray-500" />}
                iconBg="#F3F4F6"
                label="Customer Name"
                value={ACCOUNT_SUMMARY.customerName}
              />
              <SummaryItem
                icon={<IconAlertTriangle size={14} className="text-red-500" />}
                iconBg="#FEF2F2"
                label="NPA"
                value={
                  <Badge size="sm" variant="light" color="red" className="font-semibold" styles={{ root: { fontSize: 10 } }}>
                    {ACCOUNT_SUMMARY.npa ? 'Yes' : 'No'}
                  </Badge>
                }
              />
              <SummaryItem
                icon={<IconTag size={14} className="text-orange-500" />}
                iconBg="#FFF7ED"
                label="Classification"
                value={
                  <Badge size="sm" variant="light" color="yellow" className="font-semibold" styles={{ root: { fontSize: 10 } }}>
                    {ACCOUNT_SUMMARY.classification}
                  </Badge>
                }
              />
              <SummaryItem
                icon={<IconClock size={14} className="text-red-500" />}
                iconBg="#FEF2F2"
                label="DPD"
                value={`${ACCOUNT_SUMMARY.dpd} days`}
              />
              <SummaryItem
                icon={<IconCurrencyRupee size={14} className="text-indigo-500" />}
                iconBg="#EEF2FF"
                label="Outstanding"
                value={formatCurrency(ACCOUNT_SUMMARY.outstanding)}
                bold
              />
              <SummaryItem
                icon={<IconFileInvoice size={14} className="text-emerald-600" />}
                iconBg="#ECFDF5"
                label="Write-off Amt"
                value={writeOffAmount !== '' ? formatCurrency(Number(writeOffAmount)) : '—'}
                bold
              />
            </Stack>
          </Box>
        </div>

        {/* Footer */}
<ModalFooter
  variant="theme"
  isViewMode={false}
  onClose={onClose}
  onSubmit={handleSubmit}
  submitLabel={isEdit ? 'Update' : 'Save'}
  submitLoading={saveWriteOffMutation.isPending}
/>
      </Box>
    </Modal>
  );
}

function SummaryItem({
  icon,
  iconBg,
  label,
  value,
  bold,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50/60 border border-gray-100 rounded-md p-3">
      <div
        className="p-1.5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        {typeof value === 'string' ? (
          <Text size="sm" fw={bold ? 700 : 600} className="text-gray-900">
            {value}
          </Text>
        ) : (
          value
        )}
      </div>
    </div>
  );
}