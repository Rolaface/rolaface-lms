import React, { useState } from 'react';
import { Box, Stepper, Title, Text, Paper, ThemeIcon, Group, Button, useMantineTheme, Modal } from '@mantine/core';
import { IconFileText, IconMinus, IconX } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useContractTemplateStore } from '../../store/contractTemplateStore';
import { openCommonModal } from './AlertModal';
import { TemplateInfo } from '../../view/Setup/ContractTemplates/CreateTemplate/TemplateInfo';
import { UploadTemplate } from '../../view/Setup/ContractTemplates/CreateTemplate/UploadTemplate';
import { ConfigureTemplate } from '../../view/Setup/ContractTemplates/CreateTemplate/ConfigureTemplate';

export interface CreateTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
}

export function CreateTemplateModal({ opened, onClose, onMinimize, editId }: CreateTemplateModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const theme = useMantineTheme();
  const navigate = useNavigate();

  const handleNext = (data?: any) => {
    if (data !== undefined) {
      setUploadedData(data);
    }
    if (activeStep < 2) {
      setActiveStep((current) => current + 1);
    } else {
      const activeTemplate = useContractTemplateStore.getState().activeTemplate;
      const templateName = activeTemplate?.templateName ?? 'Standard Personal Loan Agreement';
      const templateVersion = activeTemplate?.templateVersion ?? '1.0';

      openCommonModal({
        heading: 'Contract Template Created Successfully',
        subtitle: 'Your contract template has been created. You can now map this template to loan products.',
        body: `Template Name: ${templateName}\nVersion: ${templateVersion}\nStatus: Active`,
        color: 'green',
        buttons: [
          {
            label: 'View Template',
            variant: 'default',
            onClick: () => {
              onClose();
              navigate({ to: '/setup/contract-templates' });
            },
          },
          {
            label: 'Map to Loan Product',
            color: 'brand',
            onClick: () => {
              onClose();
              navigate({ to: '/setup/map-products' });
            },
          },
        ],
      });
      onClose();
    }
  };

  const handlePrev = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const handleCancel = () => {
    onClose();
  };

  const handleMinimize = () => {
    onMinimize?.();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1200}
      padding={0}
      radius="lg"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '90vh',
        },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minHeight: 0,
          backgroundColor: 'var(--mantine-color-slate-50)',
        },
      }}
    >
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Header */}
        <Box
          className="px-6 py-3 flex justify-between items-center shrink-0"
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
              <IconFileText size={19} />
            </ThemeIcon>
            <div className="min-w-0">
              <Text size="md" fw={700} c="white" className="leading-tight truncate">
                Create Contract Template
              </Text>
              <Text size="xs" c="brand.1" className="leading-tight truncate">
                Create a reusable contract template and configure it.
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
              onClick={onClose}
              style={{ color: 'var(--mantine-color-white)' }}
              styles={{ root: { '&:hover': { backgroundColor: theme.other.headerButtonHoverBg } } }}
            >
              <IconX size={18} />
            </Button>
          </Group>
        </Box>

        {/* Body */}
        <Box className="w-full p-4 flex flex-col" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Paper p="md" radius="md" className="border border-slate-200 shadow-sm mb-4 shrink-0 bg-white">
            <Stepper
              active={activeStep}
              onStepClick={setActiveStep}
              allowNextStepsSelect={true}
              color="brand"
              size="sm"
              classNames={{
                stepIcon: 'border-0',
                separator: 'bg-slate-200',
              }}
            >
              <Stepper.Step label="Template Information" description="Enter basic details" />
              <Stepper.Step label="Upload Contract Template" description="Upload the document" />
              <Stepper.Step label="Configure Template" description="Configure fields" />
            </Stepper>
          </Paper>

          <Paper radius="md" className="border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
            {activeStep === 0 && <TemplateInfo onNext={handleNext} onCancel={handleCancel} />}
            {activeStep === 1 && <UploadTemplate onNext={handleNext} onPrev={handlePrev} onCancel={handleCancel} />}
            {activeStep === 2 && <ConfigureTemplate uploadedData={uploadedData} onNext={handleNext} onPrev={handlePrev} onCancel={handleCancel} />}
          </Paper>
        </Box>
      </Box>
    </Modal>
  );
}
