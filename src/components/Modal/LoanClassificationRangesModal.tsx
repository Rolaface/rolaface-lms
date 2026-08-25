import { Modal, TextInput, Checkbox, Button, Group, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';

interface LoanClassificationRangesModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit' | 'view';
  data?: {
    classificationCode?: string;
    minDpd?: string | number;
    maxDpd?: string | number;
    isWrittenOff?: boolean;
  } | null;
}

export function LoanClassificationRangesModal({ opened, onClose, mode = 'add', data = null }: LoanClassificationRangesModalProps) {
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

  // Update form when data changes
  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        classificationCode: data.classificationCode || '',
        minDpd: String(data.minDpd || ''),
        maxDpd: String(data.maxDpd || ''),
        isWrittenOff: data.isWrittenOff || false,
      });
    } else if (mode === 'add') {
      // Reset form for adding
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        classificationCode: '',
        minDpd: '',
        maxDpd: '',
        isWrittenOff: false,
      });
    }
  }, [data, mode]);

  const handleModalClose = () => {
    setFormData({
      classificationCode: '',
      minDpd: '',
      maxDpd: '',
      isWrittenOff: false,
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
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
        <Button variant="default" onClick={handleModalClose} size="sm">
          {isView ? 'Close' : 'Cancel'}
        </Button>
        {!isView && (
          <Button 
            size="sm" 
            bg="indigoAlt.4"
            className="bg-[#991B1B] hover:bg-red-900 transition-colors"
            onClick={handleModalClose}
          >
            Save
          </Button>
        )}
      </Group>
    </Modal>
  );
}
