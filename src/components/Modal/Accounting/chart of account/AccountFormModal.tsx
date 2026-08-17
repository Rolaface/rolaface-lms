import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import {
  Modal,
  TextInput,
  Checkbox,
  Select,
  Group,
  Button,
  Text,
  Box,
  ThemeIcon,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core';
import { IconX, IconMinus, IconBuildingBank } from '@tabler/icons-react';
import { useAccountForm, ROOT_TYPE_OPTIONS, ACCOUNT_TYPE_OPTIONS } from '../../../../hooks/Accounting/chart of account/UseAccountForm';
import type { COAAccount } from '../../../../api/Accounting/Chartofaccounts.api';

import { getCurrencyList } from '../../../../api/lookup api/currencylistapi';
import { ModalFooter } from '../../../shared/ModalFooter';

interface AccountFormModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSuccess: () => void;
  company: string;
  baseCurrency: string;
  parentAccount?: COAAccount | null;
  editAccount?: COAAccount | null;
  readOnly?: boolean;
  onExited?: () => void;
}

export function AccountFormModal({
  opened,
  onClose,
  onMinimize,
  onSuccess,
  company,
  baseCurrency,
  parentAccount,
  editAccount,
  readOnly = false,
  onExited,
}: AccountFormModalProps) {
  const theme = useMantineTheme();
  const { form, setField, errors, loading, isEditMode, handleSubmit, reset } = useAccountForm({
    company,
    baseCurrency,
    parentAccount,
    editAccount,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const title = readOnly
    ? 'Account Details'
    : isEditMode
    ? 'Edit Account'
    : parentAccount
    ? 'New Child Account'
    : 'Create Account';
  const subtitle = readOnly
    ? `Viewing: ${editAccount?.account_name}`
    : isEditMode
    ? `Editing: ${editAccount?.account_name}`
    : parentAccount
    ? `Creating under: ${parentAccount.account_name}`
    : 'Add a new account to the chart of accounts';

  const [currencySearch, setCurrencySearch] = useState('');
  const [debouncedCurrencySearch] = useDebouncedValue(currencySearch, 300);

  const { data: currencyList = [], isFetching: isFetchingCurrencies } = useQuery({
    queryKey: ['currency-list', debouncedCurrencySearch],
    queryFn: () => getCurrencyList({ search: debouncedCurrencySearch, page_size: 20 }),
    enabled: opened && !readOnly,
    staleTime: 5 * 60 * 1000,
  });

  const currencyOptions = useMemo(() => {
    const opts = currencyList.map((c: any) => ({
      value: c.name,
      label: c.name,
    }));
    if (baseCurrency && !opts.some((o) => o.value === baseCurrency)) {
      opts.unshift({ value: baseCurrency, label: baseCurrency });
    }
    return opts;
  }, [currencyList, baseCurrency]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleMinimize = () => {
    onMinimize();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="900px"
      radius="lg"
      padding={0}
      lockScroll
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          overflow: 'hidden',
        },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minHeight: 0,
          overflow: 'hidden',
        },
      }}
      transitionProps={{
        onExited: () => {
          onExited?.();
        },
      }}
    >
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} bg="white">
        <Box
          className="px-6 py-3 flex justify-between items-center rounded-t-md shrink-0"
          style={{
            background: theme.other.brandGradient,
            borderBottom: '1px solid var(--mantine-color-brand-7)',
          }}
        >
          <Group gap="sm" className="min-w-0" wrap="nowrap">
            <ThemeIcon
              size={38}
              radius="xl"
              style={{
                background: theme.other.headerIconOverlayBg,
                color: 'var(--mantine-color-white)',
              }}
            >
              <IconBuildingBank size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                {title}
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                {subtitle}
              </Text>
            </div>
          </Group>
          <Group gap="xs" className="shrink-0" wrap="nowrap">
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleMinimize}
              style={{ color: 'var(--mantine-color-white)' }}
              styles={{ root: { '&:hover': { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconMinus size={18} />
            </Button>
            <Button
              variant="subtle"
              size="xs"
              px={8}
              onClick={handleClose}
              style={{ color: 'var(--mantine-color-white)' }}
              styles={{ root: { '&:hover': { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

        <ScrollArea type="auto" scrollbarSize={8} style={{ flex: 1, minHeight: 0 }} bg="slate.0">
          <Box px="lg" pt="sm" pb="lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <TextInput
                  label="Account Name"
                  value={isEditMode ? editAccount?.account_name ?? '' : form.accountName}
                  onChange={(e) => setField('accountName', e.currentTarget.value)}
                  required={!isEditMode && !readOnly}
                  disabled={isEditMode || readOnly}
                  error={errors.accountName}
                />
              </div>

              <div className="md:col-span-4">
                <Select
                  label="Account Type"
                  placeholder="Select account type"
                  data={ACCOUNT_TYPE_OPTIONS}
                  value={form.accountType}
                  onChange={(v) => setField('accountType', v ?? '')}
                  searchable
                  clearable
                  disabled={readOnly}
                />
              </div>

              <div className="md:col-span-3 md:row-span-2">
                <Checkbox
                  label="Is Group"
                  checked={form.isGroup}
                  onChange={(e) => setField('isGroup', e.currentTarget.checked)}
                  description="Group accounts can hold child accounts; entries only post against non-group accounts"
                  mt="md"
                  disabled={readOnly}
                />
              </div>

              <div className="md:col-span-5">
                <TextInput
                  label="Account Number"
                  value={form.accountNumber}
                  onChange={(e) => setField('accountNumber', e.currentTarget.value)}
                  disabled={readOnly}
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Currency"
                  placeholder={baseCurrency || 'Select currency'}
                  data={currencyOptions}
                  value={form.currency || null}
                  onChange={(v) => setField('currency', v ?? '')}
                  onSearchChange={setCurrencySearch}
                  searchable
                  nothingFoundMessage={isFetchingCurrencies ? 'Searching…' : 'No currencies found'}
                  disabled={readOnly}
                />
              </div>

              <div className="md:col-span-2">
                {form.isGroup && (
                  <Select
                    label="Root Type"
                    placeholder="Select root type"
                    data={ROOT_TYPE_OPTIONS}
                    value={form.rootType}
                    onChange={(v) => setField('rootType', v ?? '')}
                    required={!readOnly}
                    error={errors.rootType}
                    disabled={readOnly}
                  />
                )}
              </div>
            </div>
          </Box>
        </ScrollArea>

        <Box style={{ flexShrink: 0 }}>
          <ModalFooter
            variant="theme"
            isViewMode={readOnly}
            onClose={handleClose}
            submitLabel={isEditMode ? 'Update Account' : 'Save Account'}
            submitLoading={loading}
            onSubmit={handleSubmit}
          />
        </Box>
      </Box>
    </Modal>
  );
}