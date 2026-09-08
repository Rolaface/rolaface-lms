import React, { useState } from 'react';
import { Box, Stepper, Title, Text, Paper, Button, Badge } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconCircleCheck, IconInfoCircle, IconEye, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useContractTemplateStore } from '../../../../store/contractTemplateStore';
import { openCommonModal } from '../../../../components/Modal/AlertModal';
import { TemplateInfo } from './TemplateInfo';
import { UploadTemplate } from './UploadTemplate';
import { ConfigureTemplate } from './ConfigureTemplate';

export const CreateTemplateWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const navigate = useNavigate();
  const { activeTemplate } = useContractTemplateStore();

  const handleNext = (data?: any) => {
    if (data !== undefined) {
      setUploadedData(data);
    }
    if (activeStep < 2) {
      setActiveStep((current) => current + 1);
    } else {
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
            onClick: () => navigate({ to: '/setup/contract-templates' }),
          },
          {
            label: 'Map to Loan Product',
            color: 'brand',
            onClick: () => navigate({ to: '/setup/map-products' }),
          },
        ],
      });
    }
  };
  const handlePrev = () => setActiveStep((current) => (current > 0 ? current - 1 : current));
  const handleCancel = () => {
    navigate({ to: '/setup/contract-templates' });
  };

  return (
    <Box className="w-full p-2 flex flex-col">
      <Box className="mb-4 shrink-0">
        <Title order={2} size="h3" c="slate.9" mb={4}>Create Contract Template</Title>
        <Text c="slate.5" size="sm">
          Create a reusable contract template and configure it before mapping to loan products.
        </Text>
      </Box>

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
          <Stepper.Step label="Template Information" description="Enter basic details of the contract template" />
          <Stepper.Step label="Upload Contract Template" description="Upload the master contract document" />
          <Stepper.Step label="Configure Template" description="Configure fields and placeholders in the document" />
        </Stepper>
      </Paper>

      <Paper radius="md" className="border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
        {activeStep === 0 && <TemplateInfo onNext={handleNext} onCancel={handleCancel} />}
        {activeStep === 1 && <UploadTemplate onNext={handleNext} onPrev={handlePrev} onCancel={handleCancel} />}
        {activeStep === 2 && <ConfigureTemplate uploadedData={uploadedData} onNext={handleNext} onPrev={handlePrev} onCancel={handleCancel} />}
      </Paper>
    </Box>
  );
};
