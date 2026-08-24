import { useEffect } from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { IconMinus, IconReceipt, IconX } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import {
  createFeeAndCharge,
  updateFeeAndCharge,
  getFeeAndChargeById,
} from '../../api/loanChargesApi';

import { parseFrappeError } from '../../utils/parseFrappeError';
import { openCommonModal } from './AlertModal';
import { ModalFooter } from '../shared/ModalFooter';
import type { CreateFeeAndChargePayload } from '../../types/loanCharges';

export interface FeeAndCharge {
  id?: string;
  name: string;
  item_code?: string;
  item_group?: string;
}

export interface FeeAndChargesModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  mode?: 'add' | 'edit' | 'view';
  data?: FeeAndCharge | null;
}

export function FeeAndChargesModal({
  opened,
  onClose,
  onMinimize,
  mode = 'add',
  data = null,
}: FeeAndChargesModalProps) {
  const isView = mode === 'view';

  const title =
    mode === 'add' ? 'New Fee & Charge' :
    mode === 'edit' ? 'Edit Fee & Charge' :
    'View Fee and Charge';

  const description =
    mode === 'view'
      ? 'Viewing details for this fee/charge.'
      : 'Define a fee or charge to apply on loan accounts.';

  const form = useForm({
    initialValues: { name: '' },
    validate: {
      name: (v) => (!v ? 'Fee/Charge name is required' : null),
    },
  });

  const { data: fetchedCharge, isLoading: isFetching } = useQuery({
    queryKey: ['fee-and-charge', data?.id],
    queryFn: () => getFeeAndChargeById(String(data!.id)),
    enabled: opened && mode !== 'add' && !!data?.id,
  });

  useEffect(() => {
    if (mode !== 'add' && data) {
      // show existing row data immediately so the modal isn't blank while fetching
      form.setValues({ name: data.name || '' });
    } else if (mode === 'add') {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode]);

  // once the fresh get_charge_by_id response arrives, overwrite with the real data
  useEffect(() => {
    if (fetchedCharge?.data && !form.isDirty()) {
      form.setValues({ name: fetchedCharge.data.item_name || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedCharge]);

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

  const handleMinimize = () => {
    onMinimize?.();
  };

  const handleModalClose = () => {
    form.reset();
    onClose();
  };

  const saveChargeMutation = useMutation({
    mutationFn: (payload: CreateFeeAndChargePayload & { id?: string }) =>
      payload.id ? updateFeeAndCharge(payload as CreateFeeAndChargePayload & { id: string }) : createFeeAndCharge(payload),
    onSuccess: () => {
      showSuccess(
        mode === 'edit' ? 'Fee/Charge Updated' : 'Fee/Charge Created',
        mode === 'edit' ? 'Fee/Charge updated successfully.' : 'Fee/Charge created successfully.'
      );
      handleModalClose();
    },
    onError: (err: any) => showError(mode === 'edit' ? 'Update Failed' : 'Create Failed', err),
  });

  const handleSubmit = (values: typeof form.values) => {
    if (mode === 'edit' && data?.id) {
      saveChargeMutation.mutate({
        id: String(data.id),
        item_code: values.name,
        item_group: 'Loan Charges',
      });
    } else {
      saveChargeMutation.mutate({
        item_code: values.name,
        item_group: 'Loan Charges',
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size={480}
      padding={0}
      lockScroll
      styles={{
        content: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: { display: 'none', padding: 0, margin: 0, minHeight: 0 },
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
      }}
    >
      <Box bg="white">
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
              <IconReceipt size={16} />
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
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={handleMinimize}
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

        <form onSubmit={form.onSubmit(handleSubmit)}>
          {/* Body */}
          <Box px="xl" py="lg" bg="slate.0">
            <Stack gap="sm">
              {isFetching && (
                <Text size="xs" c="slate.5">
                  Loading details...
                </Text>
              )}
              <TextInput
                label="Fee/Charge Name"
                placeholder="e.g. Late Payment Fee"
                size="sm"
                radius="md"
                {...form.getInputProps('name')}
                readOnly={isView}
                variant={isView ? 'filled' : 'default'}
                withAsterisk={!isView}
                styles={{ input: { border: '1px solid var(--mantine-color-slate-2)' } }}
              />
            </Stack>
          </Box>

          {/* Footer */}
          <ModalFooter
            variant="theme"
            isViewMode={isView}
            onClose={handleModalClose}
            submitLabel="Save"
            submitLoading={saveChargeMutation.isPending}
          />
        </form>
      </Box>
    </Modal>
  );
}
