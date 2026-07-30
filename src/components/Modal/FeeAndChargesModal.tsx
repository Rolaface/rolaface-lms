import { useEffect } from 'react';
import { Modal, TextInput, Button, Group, Stack, Text } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import { createFeeAndCharge,updateFeeAndCharge,deleteFeeAndCharge,getFeeAndChargeById,} from '../../api/loanChargesApi';

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
   }, [opened, data, mode]);
    // once the fresh get_charge_by_id response arrives, overwrite with the real data
 useEffect(() => {
    if (fetchedCharge?.data && !form.isDirty()) {
      form.setValues({ name: fetchedCharge.data.item_name || '' });
    }
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
      title={title}
      size="md"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md" mt="sm">
        {isFetching && (
           <Text size="xs" c="dimmed">Loading details...</Text>
          )}
        <TextInput
          label="Fee/Charge Name"
          placeholder="e.g. Late Payment Fee"
          size="sm"
          className="w-full"
           {...form.getInputProps('name')}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
          withAsterisk={!isView}
        />
      </Stack>

      {/* Footer Actions */}
      <Group justify="flex-end" mt="xl" pt="md" className="border-t border-gray-100">
        <Button variant="default" onClick={onClose} size="sm">
          {isView ? 'Close' : 'Cancel'}
        </Button>
        {!isView && (
            <>
          {saveChargeMutation.isError && (
              <Text size="xs" c="red">
                 {parseFrappeError(saveChargeMutation.error)}
              </Text>
            )}
          <Button 
          type="submit"
            size="sm" 
            bg="indigoAlt.4"
            className="bg-[#991B1B] hover:bg-red-900 transition-colors"
             loading={saveChargeMutation.isPending}
          >
            Save
          </Button>
            </>
        )}
      </Group>
       </form>
    </Modal>
  );
}