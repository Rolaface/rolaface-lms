import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';

export interface FeeAndCharge {
  id?: number;
  name: string;
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

  // Local state to populate form fields
  const [formData, setFormData] = useState<FeeAndCharge>({
    name: '',
  });

  // Update form when modal opens or data changes
  useEffect(() => {
    if (opened && data) {
      setFormData({
        name: data.name || '',
      });
    } else if (opened && mode === 'add') {
      // Reset form for adding
      setFormData({
        name: '',
      });
    }
  }, [opened, data, mode]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="md"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <Stack gap="md" mt="sm">
        <TextInput
          label="Fee/Charge Name"
          placeholder="e.g. Late Payment Fee"
          size="sm"
          className="w-full"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
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
          <Button 
            size="sm" 
            bg="indigoAlt.4"
            className="bg-[#991B1B] hover:bg-red-900 transition-colors"
            onClick={onClose}
          >
            Save
          </Button>
        )}
      </Group>
    </Modal>
  );
}