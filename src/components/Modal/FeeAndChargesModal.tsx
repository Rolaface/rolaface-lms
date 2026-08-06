import { useEffect } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconReceipt2, IconX } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import {
  createFeeAndCharge,
  updateFeeAndCharge,
  getFeeAndChargeById,
} from '../../api/loanChargesApi';

import { GradientButton } from '../shared/customer/Shared';
import { parseFrappeError } from '../../utils/parseFrappeError';
import type { CreateFeeAndChargePayload } from '../../types/loanCharges';

export interface FeeAndCharge {
  id?: number;
  name: string;
  item_code?: string;
  item_group?: string;
}

interface FeeAndChargesModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit' | 'view';
  data?: FeeAndCharge | null;
}

export function FeeAndChargesModal({ opened, onClose, mode = 'add', data = null }: FeeAndChargesModalProps) {
  const isView = mode === 'view';

  const title =
    mode === 'add' ? 'New Fee and Charge' :
    mode === 'edit' ? 'Edit Fee and Charge' :
    'View Fee and Charge';

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
    if (opened && mode !== 'add' && data) {
      // show existing row data immediately so the modal isn't blank while fetching
      form.setValues({ name: data.name || '' });
    } else if (opened && mode === 'add') {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, data, mode]);

  // once the fresh get_charge_by_id response arrives, overwrite with the real data
  useEffect(() => {
    if (fetchedCharge?.data && !form.isDirty()) {
      form.setValues({ name: fetchedCharge.data.item_name || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedCharge]);

  const saveChargeMutation = useMutation({
    mutationFn: (payload: CreateFeeAndChargePayload & { id?: string }) =>
      payload.id ? updateFeeAndCharge(payload as CreateFeeAndChargePayload & { id: string }) : createFeeAndCharge(payload),
    onSuccess: () => onClose(),
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
      onClose={onClose}
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
        {/* Header — same brand.6 bar + ThemeIcon + close pattern as CustomerModal */}
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
              <IconReceipt2 size={16} />
            </ThemeIcon>
            <Text size="md" fw={700} c="white" style={{ letterSpacing: '-0.01em' }}>
              {title}
            </Text>
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
              {!isView && saveChargeMutation.isError && (
                <Text
                  size="xs"
                  fw={600}
                  c="danger"
                  style={{
                    border: '1px solid var(--mantine-color-danger-2)',
                    background: 'var(--mantine-color-danger-0)',
                    borderRadius: 'var(--mantine-radius-md)',
                    padding: '8px 12px',
                  }}
                >
                  {parseFrappeError(saveChargeMutation.error)}
                </Text>
              )}
            </Stack>
          </Box>

          {/* Footer */}
          <Group
            justify="flex-end"
            px="xl"
            py="md"
            gap="sm"
            style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }}
          >
            <Button variant="subtle" color="slate" onClick={onClose}>
              {isView ? 'Close' : 'Cancel'}
            </Button>
            {!isView && (
              <GradientButton
                type="submit"
                px="xl"
                loading={saveChargeMutation.isPending}
                rightSection={!saveChargeMutation.isPending ? <IconCheck size={14} /> : undefined}
              >
                Save
              </GradientButton>
            )}
          </Group>
        </form>
      </Box>
    </Modal>
  );
}