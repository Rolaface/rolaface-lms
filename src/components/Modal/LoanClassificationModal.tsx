import { Modal, TextInput, Checkbox, Button, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';

export interface LoanClassificationData {
  level?: number;
  code: string;
  name: string;
  min_dpd_range: number | null;
  max_dpd_range: number | null;
  is_written_off: boolean;
  provision_rate: number;
}

interface LoanClassificationModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit' | 'view';
  data?: LoanClassificationData | null;
}

export function LoanClassificationModal({ opened, onClose, mode = 'add', data = null }: LoanClassificationModalProps) {
  const isView = mode === 'view';
  
  const title = 
    mode === 'add' ? 'New Loan Classification' : 
    mode === 'edit' ? 'Edit Loan Classification' : 
    'View Loan Classification';

  // Local state to populate form fields (using string for inputs)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    min_dpd_range: '',
    max_dpd_range: '',
    provision_rate: '',
    is_written_off: false,
  });

  // Update form when modal opens or data changes
  useEffect(() => {
    if (opened && data) {
      setFormData({
        code: data.code || '',
        name: data.name || '',
        min_dpd_range: data.min_dpd_range !== null ? String(data.min_dpd_range) : '',
        max_dpd_range: data.max_dpd_range !== null ? String(data.max_dpd_range) : '',
        provision_rate: data.provision_rate !== null ? String(data.provision_rate) : '',
        is_written_off: data.is_written_off || false,
      });
    } else if (opened && mode === 'add') {
      // Reset form for adding
      setFormData({
        code: '',
        name: '',
        min_dpd_range: '',
        max_dpd_range: '',
        provision_rate: '',
        is_written_off: false,
      });
    }
  }, [opened, data, mode]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="lg"
      radius="md"
      classNames={{ title: 'font-semibold text-gray-900' }}
    >
      <Stack gap="md" mt="sm">
        <Group grow align="flex-start">
          <TextInput
            label="Classification Code"
            placeholder="e.g. STD"
            size="sm"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
            readOnly={isView}
            variant={isView ? 'filled' : 'default'}
            withAsterisk={!isView}
          />
          <TextInput
            label="Classification Name"
            placeholder="e.g. Standard"
            size="sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
            readOnly={isView}
            variant={isView ? 'filled' : 'default'}
            withAsterisk={!isView}
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label="Min DPD Range"
            placeholder="e.g. 0"
            size="sm"
            value={formData.min_dpd_range}
            onChange={(e) => setFormData({ ...formData, min_dpd_range: e.currentTarget.value })}
            readOnly={isView}
            variant={isView ? 'filled' : 'default'}
          />
          <TextInput
            label="Max DPD Range"
            placeholder="e.g. 30"
            size="sm"
            value={formData.max_dpd_range}
            onChange={(e) => setFormData({ ...formData, max_dpd_range: e.currentTarget.value })}
            readOnly={isView}
            variant={isView ? 'filled' : 'default'}
          />
        </Group>

        <TextInput
          label="Provision Rate (%)"
          placeholder="e.g. 5"
          size="sm"
          className="w-1/2 pr-2"
          value={formData.provision_rate}
          onChange={(e) => setFormData({ ...formData, provision_rate: e.currentTarget.value })}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
        />

        <Checkbox
          label="Is Written Off"
          size="sm"
          mt="xs"
          checked={formData.is_written_off}
          onChange={(e) => setFormData({ ...formData, is_written_off: e.currentTarget.checked })}
          disabled={isView}
          color="indigoAlt.4"
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