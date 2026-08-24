import { Modal, TextInput, Select, Button, Group, Stack } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface LoanProvisionModalProps {
  opened: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit' | 'view';
  data?: {
    classificationCode?: string;
    securityType?: string;
    rate?: string | number;
  } | null;
}

export function LoanProvisionModal({ opened, onClose, mode = 'add', data = null }: LoanProvisionModalProps) {
  const isView = mode === 'view';
  
  const title = 
    mode === 'add' ? 'New Loan Provision' : 
    mode === 'edit' ? 'Edit Loan Provision' : 
    'View Loan Provision';

  // Local state to populate form fields if data is passed
  const [formData, setFormData] = useState({
    classificationCode: '',
    securityType: 'Secured',
    rate: ''
  });

  // Update form when data changes
  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        classificationCode: data.classificationCode || '',
        securityType: data.securityType || 'Secured',
        rate: String(data.rate || '')
      });
    } else if (mode === 'add') {
      // Reset form for adding
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        classificationCode: '',
        securityType: 'Secured',
        rate: ''
      });
    }
  }, [data, mode]);

  const handleModalClose = () => {
    setFormData({
      classificationCode: '',
      securityType: 'Secured',
      rate: ''
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
        
        <Select
          label="Security Type"
          placeholder="Select security type"
          data={['Secured', 'Unsecured', 'Partially Secured']}
          value={formData.securityType}
          onChange={(val) => setFormData({ ...formData, securityType: val || '' })}
          size="sm"
          className="w-full"
          rightSection={!isView && <IconChevronDown size={14} className="opacity-60" />}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
        />

        <TextInput
          label="Provision Rate (%)"
          placeholder="e.g. 1.00"
          size="sm"
          className="w-full"
          value={formData.rate}
          onChange={(e) => setFormData({ ...formData, rate: e.currentTarget.value })}
          readOnly={isView}
          variant={isView ? 'filled' : 'default'}
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
