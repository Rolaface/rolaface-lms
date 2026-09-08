import { Box, Text, Button, Badge, Paper } from '@mantine/core';
import { IconCircleCheck, IconEye, IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useContractTemplateStore } from '../../../../store/contractTemplateStore';

export function TemplateSuccessPage() {
  const navigate = useNavigate();
  const { activeTemplate } = useContractTemplateStore();

  const templateName = activeTemplate?.templateName ?? 'Standard Personal Loan Agreement';
  const templateVersion = activeTemplate?.templateVersion ?? '1.0';
  const templateStatus = activeTemplate?.status ?? 'Active';
  const templateId = activeTemplate?.id ?? 'tmpl-001';

  return (
    <Box>
      {/* Page Title */}
      <Box className="mb-2">
        <Text size="xl" fw={700} c="slate.9" className="text-2xl">
          Create Contract Template
        </Text>
        <Text size="sm" c="slate.5" className="mt-1">
          Create a reusable contract template and configure it before mapping to loan products.
        </Text>
      </Box>

      {/* Stepper - All 3 steps completed */}
      <Paper
        className="p-6 mt-6 mb-6"
        style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: 'var(--mantine-radius-lg)' }}
      >
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--mantine-color-brand-6)' }}
              >
                <IconCircleCheck size={20} color="white" />
              </div>
              <Text size="sm" fw={600} c="slate.8">Template Information</Text>
              <IconCircleCheck size={16} color="var(--mantine-color-success-6)" />
            </div>
            <Text size="xs" c="slate.5" className="mt-1">Enter basic details of the contract template.</Text>
          </div>

          {/* Connector */}
          <div className="flex-shrink-0 w-20 h-0.5" style={{ backgroundColor: 'var(--mantine-color-brand-6)' }} />

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--mantine-color-brand-6)' }}
              >
                <IconCircleCheck size={20} color="white" />
              </div>
              <Text size="sm" fw={600} c="slate.8">Upload Contract Template</Text>
              <IconCircleCheck size={16} color="var(--mantine-color-success-6)" />
            </div>
            <Text size="xs" c="slate.5" className="mt-1">Upload the master contract document.</Text>
          </div>

          {/* Connector */}
          <div className="flex-shrink-0 w-20 h-0.5" style={{ backgroundColor: 'var(--mantine-color-brand-6)' }} />

          {/* Step 3 */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--mantine-color-brand-6)' }}
              >
                <IconCircleCheck size={20} color="white" />
              </div>
              <Text size="sm" fw={600} c="slate.8">Configure Template</Text>
              <IconCircleCheck size={16} color="var(--mantine-color-success-6)" />
            </div>
            <Text size="xs" c="slate.5" className="mt-1">Configure fields and placeholders in the document.</Text>
          </div>
        </div>
      </Paper>

      {/* Success Content Card */}
      <Paper
        className="p-10"
        style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: 'var(--mantine-radius-lg)' }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Success Illustration */}
          <div className="relative mb-6">
            {/* Decorative elements */}
            <div className="absolute -top-3 -left-4 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--mantine-color-success-3)' }} />
            <div className="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--mantine-color-success-4)' }} />
            <Text className="absolute top-8 -right-6" size="sm" c="success.4" fw={700}>+</Text>
            <Text className="absolute top-2 -left-8" size="sm" c="success.4" fw={700}>+</Text>
            <div className="absolute bottom-0 -left-5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--mantine-color-success-3)' }} />
            <Text className="absolute bottom-2 right-2" size="sm" c="success.4" fw={700}>+</Text>

            {/* Document icon with checkmark */}
            <div className="relative">
              <div
                className="w-20 h-24 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--mantine-color-slate-1)', border: '1px solid var(--mantine-color-slate-2)' }}
              >
                <div className="space-y-1.5">
                  <div className="w-10 h-1 rounded" style={{ backgroundColor: 'var(--mantine-color-slate-3)' }} />
                  <div className="w-8 h-1 rounded" style={{ backgroundColor: 'var(--mantine-color-slate-3)' }} />
                  <div className="w-10 h-1 rounded" style={{ backgroundColor: 'var(--mantine-color-slate-3)' }} />
                  <div className="w-6 h-1 rounded" style={{ backgroundColor: 'var(--mantine-color-slate-3)' }} />
                </div>
              </div>
              {/* Green checkmark circle */}
              <div
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--mantine-color-success-5), var(--mantine-color-success-7))' }}
              >
                <IconCircleCheck size={24} color="white" />
              </div>
            </div>
          </div>

          {/* Success text */}
          <Text size="xl" fw={700} c="slate.9" className="mb-2">
            Contract Template Created Successfully
          </Text>
          <Text size="sm" c="slate.5" className="mb-6 max-w-md">
            Your contract template has been created. You can now map this template to loan products.
          </Text>

          {/* Template Info Box */}
          <Box
            className="rounded-lg p-4 mb-8 w-full max-w-md flex items-start gap-3"
            style={{ border: '1px solid var(--mantine-color-brand-1)', backgroundColor: 'var(--mantine-color-brand-0)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: 'var(--mantine-color-brand-1)' }}
            >
              <IconInfoCircle size={16} color="var(--mantine-color-brand-6)" />
            </div>
            <div className="text-left">
              <Text size="sm" c="slate.8">
                <Text span fw={600}>Template Name:</Text>{' '}{templateName}
              </Text>
              <Text size="sm" c="slate.8" className="mt-1">
                <Text span fw={600}>Version:</Text>{' '}{templateVersion}
              </Text>
              <Text size="sm" c="slate.8" className="mt-1">
                <Text span fw={600}>Status:</Text>{' '}
                <Badge size="sm" variant="light" color="success" className="ml-1">
                  {templateStatus}
                </Badge>
              </Text>
            </div>
          </Box>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="md"
              leftSection={<IconEye size={16} />}
              onClick={() => navigate({ to: '/setup/contract-templates' })}
            >
              View Template
            </Button>
            <Button
              size="md"
              rightSection={<IconArrowRight size={16} />}
              onClick={() => navigate({ to: '/setup/map-products' })}
            >
              Map to Loan Product
            </Button>
          </div>
        </div>
      </Paper>
    </Box>
  );
}