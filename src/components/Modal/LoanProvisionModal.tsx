import { Modal, TextInput, Select, Button, Group, Stack } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function LoanProvisionModal({ opened, onClose, mode = 'add', data = null }) {
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

  // Update form when modal opens or data changes
  useEffect(() => {
    if (opened && data) {
      setFormData({
        classificationCode: data.classificationCode || '',
        securityType: data.securityType || 'Secured',
        rate: data.rate || ''
      });
    } else if (opened && mode === 'add') {
      // Reset form for adding
      setFormData({
        classificationCode: '',
        securityType: 'Secured',
        rate: ''
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
        
        <Select
          label="Security Type"
          placeholder="Select security type"
          data={['Secured', 'Unsecured', 'Partially Secured']}
          value={formData.securityType}
          onChange={(val) => setFormData({ ...formData, securityType: val })}
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