import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Text,
  Modal,
  Group,
  ActionIcon,
  ThemeIcon,
  useMantineTheme,
} from '@mantine/core';
import { IconX, IconMinus, IconFileText } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import {
  useContractTemplateStore,
  BANK_COLORS,
  type TemplateItem,
} from '../../store/contractTemplateStore';
import { openCommonModal } from './AlertModal';
import {
  TemplateInfo,
  type TemplateInfoData,
} from '../../view/Setup/ContractTemplates/CreateTemplate/TemplateInfo';
import { UploadTemplate } from '../../view/Setup/ContractTemplates/CreateTemplate/UploadTemplate';
import { ConfigureTemplate } from '../../view/Setup/ContractTemplates/CreateTemplate/ConfigureTemplate';

export interface CreateTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  editId?: string | null;
  isView?: boolean;
}

export function CreateTemplateModal({
  opened,
  onClose,
  onMinimize,
  editId,
  isView = false,
}: CreateTemplateModalProps) {
  const theme = useMantineTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfoData | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const navigate = useNavigate();

  const { templates, addTemplate, updateTemplate, setActiveTemplate } = useContractTemplateStore();
  const existingTemplate = editId ? templates.find((t) => t.id === editId) : null;

  React.useEffect(() => {
    if (existingTemplate) {
      setTemplateInfo({
        name: existingTemplate.name || existingTemplate.templateName || '',
        type: existingTemplate.type || existingTemplate.templateType || 'Loan Agreement',
        effectiveDate: existingTemplate.effectiveDate || existingTemplate.effectiveFrom || '',
        effectiveTo: existingTemplate.effectiveTo || '',
        comment: existingTemplate.description || '',
        description: existingTemplate.description || '',
        bank: existingTemplate.bank || 'HDFC Bank',
        product: existingTemplate.product || 'Personal Loan',
        version: existingTemplate.version || '1.0',
      });
      setUploadedData({
        local_file_url: existingTemplate.fileUrl || null,
        file_name: existingTemplate.fileUrl
          ? existingTemplate.fileUrl.split('/').pop()
          : `${(existingTemplate.name || 'Contract_Template').replace(/\s+/g, '_')}.pdf`,
        placeholders: existingTemplate.placeholders || [],
      });
      setActiveStep(0);
    } else if (!opened) {
      setTemplateInfo(null);
      setUploadedData(null);
      setActiveStep(0);
    }
  }, [editId, existingTemplate, opened]);

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

    const bankName = templateInfo?.bank || existingTemplate?.bank || 'HDFC Bank';
    const templateName = templateInfo?.name || existingTemplate?.name || 'Standard Personal Loan Agreement';
    const templateVersion = templateInfo?.version || existingTemplate?.version || '1.0';
    const templateType = templateInfo?.type || existingTemplate?.type || 'Loan Agreement';

    if (editId) {
      const updatedTemplate: TemplateItem = {
        ...existingTemplate!,
        id: editId,
        name: templateName,
        templateName: templateName,
        type: templateType,
        templateType: templateType,
        version: templateVersion,
        templateVersion: templateVersion,
        bank: bankName,
        color: BANK_COLORS[bankName] || existingTemplate?.color || 'indigo',
        product: templateInfo?.product || existingTemplate?.product || 'Personal Loan',
        effectiveDate: templateInfo?.effectiveDate || existingTemplate?.effectiveDate || uploadDateStr,
        effectiveFrom: templateInfo?.effectiveDate || existingTemplate?.effectiveFrom || now.toISOString().slice(0, 10),
        effectiveTo: templateInfo?.effectiveTo !== undefined ? templateInfo.effectiveTo : existingTemplate?.effectiveTo,
        description:
          templateInfo?.description !== undefined
            ? templateInfo.description
            : templateInfo?.comment || existingTemplate?.description || '',
        fileUrl: uploadedData?.local_file_url || uploadedData?.message?.file_url || existingTemplate?.fileUrl || '',
        placeholders: configData?.mappings ? Object.values(configData.mappings) : (existingTemplate?.placeholders || []),
      };

      updateTemplate(editId, updatedTemplate);
      setActiveTemplate(updatedTemplate);
      onClose();

      openCommonModal({
        heading: 'Contract Template Updated Successfully',
        subtitle: `Template "${templateName}" has been updated.`,
        body: `Contract template "${templateName}" has been updated successfully.`,
        color: 'green',
        buttons: [{ label: 'OK', color: 'green' }],
      });
      return;
    }

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
    onClose();

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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95vw"
      padding={0}
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: '92vh',
          maxHeight: '95vh',
          width: '95vw',
          maxWidth: '1600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 16,
        },
        header: { display: 'none', padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          minHeight: 0,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
        bg="white"
      >
        {/* Modal Header - Consistent with Customer Modal */}
        <Group
          justify="space-between"
          align="center"
          px="lg"
          py={8}
          style={{
            background: theme.other.brandGradient,
            borderBottom: '1px solid var(--mantine-color-brand-7)',
            flexShrink: 0,
          }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={32} variant="white" color="brand">
              <IconFileText size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white">
                {isView
                  ? 'View Contract Template'
                  : editId
                  ? 'Edit Contract Template'
                  : 'Create Contract Template'}
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                {isView
                  ? 'View contract template details, uploaded document, and configuration'
                  : 'Configure template details, upload document, and map placeholders'}
              </Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            {onMinimize && (
              <ActionIcon variant="subtle" color="white" onClick={onMinimize} title="Minimize">
                <IconMinus size={16} />
              </ActionIcon>
            )}
            <ActionIcon variant="subtle" color="white" onClick={onClose} title="Close">
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Stepper Header */}
        <Box
          px="xl"
          py="sm"
          bg="slate.0"
          style={{
            borderBottom: '1px solid var(--mantine-color-slate-2)',
            flexShrink: 0,
          }}
        >
          <Stepper
            active={activeStep}
            onStepClick={setActiveStep}
            allowNextStepsSelect
            color="brand"
            size="xs"
          >
            <Stepper.Step
              label="Template Information"
              description="Enter basic details"
            />
            <Stepper.Step
              label="Upload Contract Template"
              description="Upload the document"
            />
            <Stepper.Step
              label="Configure Template"
              description="Configure fields"
            />
          </Stepper>
        </Box>

        {/* Step Body - Strictly fills remaining height */}
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {activeStep === 0 && (
            <TemplateInfo
              initialValues={templateInfo || undefined}
              onNext={handleStep1Next}
              onCancel={onClose}
              isView={isView}
            />
          )}
          {activeStep === 1 && (
            <UploadTemplate
              uploadedData={uploadedData}
              onNext={handleStep2Next}
              onPrev={handlePrev}
              onCancel={onClose}
              isView={isView}
            />
          )}
          {activeStep === 2 && (
            <ConfigureTemplate
              uploadedData={uploadedData}
              onNext={handleStep3Complete}
              onPrev={handlePrev}
              onCancel={onClose}
              isView={isView}
              submitLabel={editId ? 'Update Template' : 'Create Template'}
            />
          )}
        </Box>
      </Box>
    </Modal>
  );
}
