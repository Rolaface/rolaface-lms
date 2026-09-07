import React, { useState } from 'react';
import { Box, Stepper, Title, Text, Paper } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { TemplateInfo } from './TemplateInfo';
import { UploadTemplate } from './UploadTemplate';
import { ConfigureTemplate } from './ConfigureTemplate';

export const CreateTemplateWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep((current) => current + 1);
    } else {
      navigate({ to: '/setup/contract-templates/create/success' });
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
        {activeStep === 2 && <ConfigureTemplate onPrev={handlePrev} onCancel={handleCancel} />}
      </Paper>
    </Box>
  );
};
