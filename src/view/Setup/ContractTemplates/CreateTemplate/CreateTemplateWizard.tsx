import React, { useState } from 'react';
import { Box, Stepper, Text, Paper, Group, ActionIcon, Badge } from '@mantine/core';
import {
  IconArrowLeft,
  IconFileText,
  IconCloudUpload,
  IconAdjustments,
} from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import {
  useContractTemplateStore,
  BANK_COLORS,
  type TemplateItem,
} from '../../../../store/contractTemplateStore';
import { openCommonModal } from '../../../../components/Modal/AlertModal';
import { TemplateInfo, type TemplateInfoData } from './TemplateInfo';
import { UploadTemplate } from './UploadTemplate';
import { ConfigureTemplate } from './ConfigureTemplate';

export function CreateTemplateWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfoData | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const navigate = useNavigate();

  const { addTemplate, setActiveTemplate } = useContractTemplateStore();

  const handleStep1Next = (data: TemplateInfoData) => {
    setTemplateInfo(data);
    setActiveStep(1);
  };

  const handleStep2Next = (data?: any) => {
    if (data !== undefined) {
      setUploadedData(data);
    }
    setActiveStep(2);
  };

  const handleStep3Complete = (configData?: any) => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    const uploadDateStr = `${day}-${month}-${year}`;

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const uploadTimeStr = `${hours}:${minutes} ${ampm}`;

    const bankName = templateInfo?.bank || 'HDFC Bank';
    const templateName = templateInfo?.name || 'Standard Personal Loan Agreement';
    const templateVersion = templateInfo?.version || '1.0';
    const templateType = templateInfo?.type || 'Loan Agreement';

    const newTemplate: TemplateItem = {
      id: `tmpl-${Date.now()}`,
      name: templateName,
      templateName: templateName,
      type: templateType,
      templateType: templateType,
      version: templateVersion,
      templateVersion: templateVersion,
      bank: bankName,
      color: BANK_COLORS[bankName] || 'indigo',
      product: templateInfo?.product || 'Personal Loan',
      uploadDate: uploadDateStr,
      uploadTime: uploadTimeStr,
      effectiveDate: templateInfo?.effectiveDate || uploadDateStr,
      effectiveFrom: templateInfo?.effectiveDate || now.toISOString().slice(0, 10),
      effectiveTo: templateInfo?.effectiveTo || '',
      status: 'Active',
      description: templateInfo?.description || '',
      mappedProductIds: [],
      fileUrl: uploadedData?.local_file_url || uploadedData?.message?.file_url || '',
      placeholders: configData?.mappings ? Object.values(configData.mappings) : [],
    };

    addTemplate(newTemplate);
    setActiveTemplate(newTemplate);

    openCommonModal({
      heading: 'Contract Template Created Successfully',
      subtitle: `Template "${templateName}" is ready.`,
      body: `Template: ${templateName}\nType: ${templateType}\nStatus: Active\n\nWould you like to map loan products to this template now, or do it later?`,
      color: 'green',
      buttons: [
        {
          label: 'Map Later',
          variant: 'default',
          onClick: () => {
            navigate({ to: '/setup/contract-templates' });
          },
        },
        {
          label: 'Map to Loan Products Now',
          color: 'brand',
          onClick: () => {
            setActiveTemplate(newTemplate);
            navigate({ to: `/setup/map-products?templateId=${newTemplate.id}` });
          },
        },
      ],
    });
  };

  const handlePrev = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const handleCancel = () => {
    navigate({ to: '/setup/contract-templates' });
  };

  return (
    <Box className="w-full px-6 pt-0 pb-3">
      {/* Page header with back button */}
      <Box className="mb-2">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="center">
            <ActionIcon
              variant="subtle"
              color="slate"
              size="lg"
              radius="xl"
              onClick={handleCancel}
              title="Back to Templates"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Box>
              <Text size="xl" fw={700} c="slate.9">
                Create Contract Template
              </Text>
              <Text size="sm" c="slate.5">
                Set up a new legal contract template, upload the document, and configure field mapping.
              </Text>
            </Box>
          </Group>

          <Badge variant="light" color="brand" size="md" radius="sm">
            Step {activeStep + 1} of 3
          </Badge>
        </Group>
      </Box>

      {/* Body */}
      <Box className="w-full">
        <Paper
          py="sm"
          px="xl"
          radius="lg"
          className="border border-slate-200 shadow-xs mb-3 shrink-0 bg-white"
        >
          <Stepper
            active={activeStep}
            onStepClick={setActiveStep}
            allowNextStepsSelect
            color="brand"
            size="sm"
            classNames={{
              stepIcon: 'border-0 font-bold',
              separator: 'bg-slate-200',
            }}
          >
            <Stepper.Step
              icon={<IconFileText size={16} />}
              label="Template Information"
              description="Enter basic details"
            />
            <Stepper.Step
              icon={<IconCloudUpload size={16} />}
              label="Upload Contract Template"
              description="Upload the document"
            />
            <Stepper.Step
              icon={<IconAdjustments size={16} />}
              label="Configure Template"
              description="Configure fields"
            />
          </Stepper>
        </Paper>

        <Paper
          radius="lg"
          className="border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col"
        >
          {activeStep === 0 && (
            <TemplateInfo
              initialValues={templateInfo || undefined}
              onNext={handleStep1Next}
              onCancel={handleCancel}
            />
          )}
          {activeStep === 1 && (
            <UploadTemplate
              onNext={handleStep2Next}
              onPrev={handlePrev}
              onCancel={handleCancel}
            />
          )}
          {activeStep === 2 && (
            <ConfigureTemplate
              uploadedData={uploadedData}
              onNext={handleStep3Complete}
              onPrev={handlePrev}
              onCancel={handleCancel}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
