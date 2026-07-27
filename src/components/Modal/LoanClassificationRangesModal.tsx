import { Modal, TextInput, Checkbox, Button, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';

export function LoanClassificationRangesModal({ opened, onClose, mode = 'add', data = null }) {
  const isView = mode === 'view';
  
  const title = 
    mode === 'add' ? 'New Classification Range' : 
    mode === 'edit' ? 'Edit Classification Range' : 
    'View Classification Range';

  // Local state to populate form fields
  const [formData, setFormData] = useState({
    classificationCode: '',
    minDpd: '',
    maxDpd: '',
    isWrittenOff: false,
  });

  // Update form when modal opens or data changes
  useEffect(() => {
    if (opened && data) {
      setFormData({
        classificationCode: data.classificationCode || '',
        minDpd: data.minDpd || '',
        maxDpd: data.maxDpd || '',
        isWrittenOff: data.isWrittenOff || false,
      });
    } else if (opened && mode === 'add') {
      // Reset form for adding
      setFormData({
        classificationCode: '',
        minDpd: '',
        maxDpd: '',
        isWrittenOff: false,
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
        <TextInput
          label="Classification Code"
          placeholder="e.g. STD"
          size="sm"
          className="w-full"
          value={formData.classificationCode}
          onChange={(e) => setFormData({ ...formData, classificationCode: e.currentTarget.value })}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
        />
        
        <TextInput
          label="Min DPD Range"
          placeholder="e.g. 0"
          size="sm"
          className="w-full"
          value={formData.minDpd}
          onChange={(e) => setFormData({ ...formData, minDpd: e.currentTarget.value })}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
        />

        <TextInput
          label="Max DPD Range"
          placeholder="e.g. 30"
          size="sm"
          className="w-full"
          value={formData.maxDpd}
          onChange={(e) => setFormData({ ...formData, maxDpd: e.currentTarget.value })}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
        />

        <Checkbox
          label="Is Written Off"
          size="sm"
          mt="xs"
          checked={formData.isWrittenOff}
          onChange={(e) => setFormData({ ...formData, isWrittenOff: e.currentTarget.checked })}
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