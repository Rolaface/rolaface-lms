import React, { useState } from 'react';
import {
  Box,
  Grid,
  Select,
  Textarea,
  TextInput,
  Group,
  Divider,
  Button,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconArrowRight, IconFileText } from '@tabler/icons-react';

export interface TemplateInfoData {
  name: string;
  type: string;
  effectiveDate: string;
  effectiveTo?: string;
  comment?: string;
  description?: string;
  bank?: string;
  product?: string;
  version?: string;
}

interface TemplateInfoProps {
  initialValues?: Partial<TemplateInfoData>;
  onNext: (data: TemplateInfoData) => void;
  onCancel: () => void;
  isView?: boolean;
}

const TEMPLATE_TYPES = [
  'Loan Agreement',
  'Sanction Letter',
  'Hypothecation Agreement',
  'Promissory Note',
  'Disbursement Memo',
  'NDA',
  'Other',
];

export const TemplateInfo: React.FC<TemplateInfoProps> = ({
  initialValues,
  onNext,
  onCancel,
  isView = false,
}) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [type, setType] = useState(initialValues?.type || '');
  const [effectiveDate, setEffectiveDate] = useState(initialValues?.effectiveDate || '');
  const [effectiveTo, setEffectiveTo] = useState(initialValues?.effectiveTo || '');
  const [comment, setComment] = useState(
    initialValues?.comment || initialValues?.description || ''
  );

  React.useEffect(() => {
    if (initialValues) {
      if (initialValues.name !== undefined) setName(initialValues.name);
      if (initialValues.type !== undefined) setType(initialValues.type);
      if (initialValues.effectiveDate !== undefined) setEffectiveDate(initialValues.effectiveDate);
      if (initialValues.effectiveTo !== undefined) setEffectiveTo(initialValues.effectiveTo || '');
      if (initialValues.comment !== undefined || initialValues.description !== undefined) {
        setComment(initialValues.comment || initialValues.description || '');
      }
    }
  }, [initialValues]);

  const [errors, setErrors] = useState<{
    name?: string;
    type?: string;
    effectiveDate?: string;
  }>({});

  const isFormComplete = Boolean(type.trim() && name.trim() && effectiveDate.trim());

  const handleProceed = () => {
    const newErrors: { name?: string; type?: string; effectiveDate?: string } = {};
    if (!type.trim()) {
      newErrors.type = 'Template type is required';
    }
    if (!name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (!effectiveDate.trim()) {
      newErrors.effectiveDate = 'Effective date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext({
      name: name.trim(),
      type,
      effectiveDate,
      effectiveTo,
      comment: comment.trim(),
      description: comment.trim(),
      bank: initialValues?.bank || 'HDFC Bank',
      product: initialValues?.product || 'Personal Loan',
      version: initialValues?.version || '1.0',
    });
  };

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
      bg="white"
    >
      {/* Step 1 Body: Form Details */}
      <Box p="xl" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Paper
          p="xl"
          radius="md"
          style={{
            border: '1px solid var(--mantine-color-slate-2)',
            backgroundColor: 'white',
            maxWidth: '780px',
          }}
        >
          <Grid gutter="md">
            {/* Row 1: Template Type & Template Name - 50% Equal */}
            <Grid.Col span={6}>
              <Select
                label="Template Type"
                placeholder="Select template type"
                data={TEMPLATE_TYPES}
                value={type || null}
                onChange={(val) => {
                  setType(val || '');
                  if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
                }}
                error={errors.type}
                size="sm"
                radius="md"
                required={!isView}
                disabled={isView}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Template Name"
                placeholder="Enter template name"
                value={name}
                onChange={(e) => {
                  setName(e.currentTarget.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                size="sm"
                radius="md"
                required={!isView}
                disabled={isView}
              />
            </Grid.Col>

            {/* Row 2: Effective From & Effective To - 50% Equal */}
            <Grid.Col span={6}>
              <TextInput
                type="date"
                label="Effective From"
                value={effectiveDate}
                onChange={(e) => {
                  setEffectiveDate(e.currentTarget.value);
                  if (errors.effectiveDate)
                    setErrors((prev) => ({ ...prev, effectiveDate: undefined }));
                }}
                error={errors.effectiveDate}
                size="sm"
                radius="md"
                required={!isView}
                disabled={isView}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                type="date"
                label="Effective To"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.currentTarget.value)}
                size="sm"
                radius="md"
                disabled={isView}
              />
            </Grid.Col>

            {/* Row 3: Comment - Full width matching both columns */}
            <Grid.Col span={12}>
              <Textarea
                label="Comment"
                placeholder="Enter comment"
                value={comment}
                onChange={(e) => setComment(e.currentTarget.value)}
                minRows={3}
                maxRows={5}
                size="sm"
                radius="md"
                disabled={isView}
              />
            </Grid.Col>
          </Grid>
        </Paper>
      </Box>

      {/* Footer Pinned to Bottom */}
      <Box style={{ flexShrink: 0 }}>
        <Divider color="slate.2" />
        <Group justify="space-between" px="xl" py="md" bg="white">
          <Button variant="default" size="sm" radius="md" onClick={onCancel}>
            {isView ? 'Close' : 'Cancel'}
          </Button>

          <Group gap="sm">
            {!isView && (
              <Button
                variant="default"
                size="sm"
                radius="md"
                onClick={handleProceed}
              >
                Save as Draft
              </Button>
            )}
            <Button
              color="brand"
              size="sm"
              radius="md"
              rightSection={<IconArrowRight size={14} />}
              onClick={
                isView
                  ? () =>
                      onNext({
                        name: name.trim(),
                        type,
                        effectiveDate,
                        effectiveTo,
                        comment: comment.trim(),
                        description: comment.trim(),
                        bank: initialValues?.bank || 'HDFC Bank',
                        product: initialValues?.product || 'Personal Loan',
                        version: initialValues?.version || '1.0',
                      })
                  : handleProceed
              }
            >
              Next: Upload Template
            </Button>
          </Group>
        </Group>
      </Box>
    </Box>
  );
};
