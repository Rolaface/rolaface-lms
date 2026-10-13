import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Text,
  Paper,
  Divider,
  Grid,
  Select,
  Badge,
  ActionIcon,
  Stack,
  Center,
  Modal,
  TextInput,
} from '@mantine/core';
import {
  IconFileText,
  IconEye,
  IconZoomIn,
  IconZoomOut,
  IconPlus,
  IconAdjustments,
  IconInfoCircle,
  IconTrash,
} from '@tabler/icons-react';

interface ConfigureTemplateProps {
  uploadedData?: any;
  onNext: (configData?: any) => void;
  onPrev: () => void;
  onCancel: () => void;
}

interface TemplateField {
  name: string;
  type: string;
  placeholder: string;
  required: boolean;
}

export const ConfigureTemplate: React.FC<ConfigureTemplateProps> = ({
  uploadedData,
  onNext,
  onPrev,
  onCancel,
}) => {
  const [zoom, setZoom] = useState(100);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [customFieldModalOpened, setCustomFieldModalOpened] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  const extracted: string[] = useMemo(() => {
    const raw =
      uploadedData?.message?.placeholders ??
      uploadedData?.data?.placeholders ??
      uploadedData?.placeholders ??
      [];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [];
  }, [uploadedData]);

  const extractedFields = useMemo(() => {
    if (!extracted || extracted.length === 0) return [];
    return extracted.map((placeholder: string) => {
      const cleanName = placeholder.replace(/[{}]/g, '');
      const formattedName = cleanName
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        name: formattedName,
        type: 'Text',
        placeholder: cleanName,
        required: true,
      };
    });
  }, [extracted]);

  const allPlaceholders = useMemo(
    () =>
      extracted.map((p: string) => {
        const clean = p.replace(/[{}]/g, '');
        return { value: clean, label: clean };
      }),
    [extracted]
  );

  const [fields, setFields] = useState<TemplateField[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (extractedFields.length > 0) {
      setFields(extractedFields);
      const initial: Record<string, string> = {};
      extractedFields.forEach((f) => {
        initial[f.name] = f.placeholder;
      });
      setMappings(initial);
    } else {
      setFields([]);
      setMappings({});
    }
  }, [extractedFields]);

  const updateMapping = (fieldName: string, value: string | null) => {
    setMappings((prev) => ({ ...prev, [fieldName]: value || '' }));
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const placeholderFormatted = newFieldPlaceholder.trim().startsWith('{{')
      ? newFieldPlaceholder.trim()
      : `{{${newFieldPlaceholder.trim() || newFieldName.toLowerCase().replace(/\s+/g, '_')}}}`;

    const newField: TemplateField = {
      name: newFieldName.trim(),
      type: 'Text',
      placeholder: placeholderFormatted,
      required: false,
    };

    setFields((prev) => [...prev, newField]);
    setMappings((prev) => ({ ...prev, [newField.name]: placeholderFormatted }));
    setNewFieldName('');
    setNewFieldPlaceholder('');
    setCustomFieldModalOpened(false);
  };

  const handleRemoveField = (fieldName: string) => {
    setFields((prev) => prev.filter((f) => f.name !== fieldName));
    setMappings((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const filePreviewUrl =
    uploadedData?.local_file_url ??
    uploadedData?.message?.file_url ??
    uploadedData?.data?.file_url ??
    null;

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
      <Box p="md" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '16px',
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* Left Column: Document Preview - Full Height down to Back Button */}
          <Paper
            p="sm"
            style={{
              border: '1px solid var(--mantine-color-slate-2)',
              borderRadius: '12px',
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'white',
            }}
          >
            {/* Compact Header with integrated Zoom & Full Preview */}
            <Group
              justify="space-between"
              align="center"
              pb={8}
              mb={8}
              style={{
                borderBottom: '1px solid var(--mantine-color-slate-2)',
                flexShrink: 0,
              }}
            >
              <Group gap="xs">
                <IconFileText size={16} color="var(--mantine-color-slate-6)" />
                <Text fw={600} size="sm" c="slate.9">
                  Document Preview
                </Text>
              </Group>

              <Group gap="xs">
                {/* Compact Zoom Controls */}
                <Group
                  gap={4}
                  bg="slate.0"
                  px={6}
                  py={2}
                  style={{
                    borderRadius: 6,
                    border: '1px solid var(--mantine-color-slate-2)',
                  }}
                >
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    c="slate.6"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <IconZoomOut size={13} />
                  </ActionIcon>
                  <Text size="11px" c="slate.7" fw={600} style={{ minWidth: 32, textAlign: 'center' }}>
                    {zoom}%
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    c="slate.6"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <IconZoomIn size={13} />
                  </ActionIcon>
                </Group>

                {filePreviewUrl && (
                  <Button
                    variant="subtle"
                    color="brand"
                    size="compact-xs"
                    leftSection={<IconEye size={12} />}
                    onClick={() => setPreviewOpened(true)}
                  >
                    Full Preview
                  </Button>
                )}
              </Group>
            </Group>

            {/* Document Area */}
            {filePreviewUrl ? (
              <Box
                style={{
                  flex: 1,
                  minHeight: 0,
                  backgroundColor: 'var(--mantine-color-slate-0)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 6,
                }}
              >
                <Paper
                  shadow="xs"
                  radius="sm"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s',
                  }}
                >
                  <iframe
                    src={`${filePreviewUrl}#view=FitH&toolbar=0&navpanes=0`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', backgroundColor: 'white', flex: 1 }}
                    title="Document Preview"
                  />
                </Paper>
              </Box>
            ) : (
              <Center style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--mantine-color-slate-0)' }}>
                <Stack align="center" gap="xs" p="md">
                  <IconFileText size={48} color="var(--mantine-color-slate-4)" />
                  <Text c="slate.6" size="sm" fw={600}>
                    Standard Loan Agreement Template
                  </Text>
                  <Text c="slate.4" size="xs" ta="center">
                    Configuring placeholders for contract generation.
                  </Text>
                </Stack>
              </Center>
            )}
          </Paper>

          {/* Right Column: Configure Fields - Full Height down to Footer */}
          <Paper
            p="sm"
            style={{
              border: '1px solid var(--mantine-color-slate-2)',
              borderRadius: '12px',
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'white',
            }}
          >
            <Group justify="space-between" mb={4} style={{ flexShrink: 0 }}>
              <Group gap="xs">
                <IconAdjustments size={18} color="var(--mantine-color-slate-6)" />
                <Text fw={600} size="sm" c="slate.9">
                  Configure Template Fields
                </Text>
              </Group>
              <Button
                variant="subtle"
                color="brand"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => setCustomFieldModalOpened(true)}
              >
                Add Field
              </Button>
            </Group>
            <Text size="xs" c="slate.5" mb="xs" style={{ flexShrink: 0 }}>
              Map document placeholders to contract variable fields.
            </Text>

            {/* Table Header */}
            <Grid
              m={0}
              py="xs"
              px="xs"
              bg="slate.0"
              style={{
                borderTop: '1px solid var(--mantine-color-slate-2)',
                borderBottom: '1px solid var(--mantine-color-slate-2)',
                borderRadius: '6px',
                flexShrink: 0,
              }}
            >
              <Grid.Col span={5}>
                <Text size="xs" fw={700} c="slate.7">
                  Available Field
                </Text>
              </Grid.Col>
              <Grid.Col span={5}>
                <Text size="xs" fw={700} c="slate.7">
                  Document Placeholder
                </Text>
              </Grid.Col>
              <Grid.Col span={2}>
                <Text size="xs" fw={700} c="slate.7" ta="right">
                  Action
                </Text>
              </Grid.Col>
            </Grid>

            {/* Scrollable List - stretches to full height */}
            <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
              {fields.length === 0 ? (
                <Center p="xl" style={{ flexDirection: 'column', gap: 8, height: '100%' }}>
                  <IconAdjustments size={32} color="var(--mantine-color-slate-4)" />
                  <Text size="sm" fw={600} c="slate.6">
                    No Placeholders Extracted
                  </Text>
                  <Text size="xs" c="slate.4">
                    Upload and extract a contract template to configure fields.
                  </Text>
                </Center>
              ) : (
                fields.map((field, idx) => {
                  const mapped = mappings[field.name];
                  return (
                    <Grid
                      key={idx}
                      m={0}
                      py="xs"
                      px="xs"
                      align="center"
                      style={{ borderBottom: '1px solid var(--mantine-color-slate-1)' }}
                    >
                      <Grid.Col span={5}>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="xs" fw={600} c="slate.8" truncate>
                            {field.name}
                          </Text>
                          {field.required && (
                            <Badge variant="light" color="red" size="xs" radius="sm">
                              Req
                            </Badge>
                          )}
                        </Group>
                      </Grid.Col>
                      <Grid.Col span={5}>
                        <Select
                          size="xs"
                          searchable
                          data={allPlaceholders}
                          value={mapped || field.placeholder}
                          onChange={(val) => updateMapping(field.name, val)}
                          styles={{
                            input: {
                              fontFamily: 'monospace',
                              fontSize: '11px',
                            },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={2}>
                        <Group justify="flex-end">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleRemoveField(field.name)}
                            disabled={field.required}
                            title={field.required ? 'Required field' : 'Remove field'}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Grid.Col>
                    </Grid>
                  );
                })
              )}
            </Box>

            {/* Info Note */}
            <Paper
              p="xs"
              mt="xs"
              radius="md"
              style={{
                flexShrink: 0,
                backgroundColor: 'var(--mantine-color-brand-0)',
                border: '1px solid var(--mantine-color-brand-2)',
              }}
            >
              <Group gap="xs" align="center" wrap="nowrap">
                <IconInfoCircle size={16} color="var(--mantine-color-brand-6)" />
                <Text size="xs" c="brand.8">
                  These fields will automatically merge when loan contracts are created.
                </Text>
              </Group>
            </Paper>
          </Paper>
        </Box>
      </Box>

      {/* Custom Field Modal */}
      <Modal
        opened={customFieldModalOpened}
        onClose={() => setCustomFieldModalOpened(false)}
        title="Add Custom Template Field"
        size="sm"
      >
        <Stack gap="sm">
          <TextInput
            label="Field Name"
            placeholder="e.g. Co-Applicant Name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Placeholder Tag"
            placeholder="e.g. {{co_applicant_name}}"
            value={newFieldPlaceholder}
            onChange={(e) => setNewFieldPlaceholder(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" size="xs" onClick={() => setCustomFieldModalOpened(false)}>
              Cancel
            </Button>
            <Button size="xs" color="brand" onClick={handleAddCustomField}>
              Add Field
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Full Preview Modal */}
      <Modal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        title="Contract Preview"
        size="80%"
      >
        <Box style={{ height: '70vh' }}>
          {filePreviewUrl && (
            <iframe
              src={filePreviewUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Preview"
            />
          )}
        </Box>
      </Modal>

      {/* Wizard Footer Pinned to Bottom */}
      <Box style={{ flexShrink: 0 }}>
        <Divider color="slate.2" />
        <Group justify="space-between" px="xl" py="md" bg="white">
          <Button variant="default" size="sm" radius="md" onClick={onPrev}>
            Back
          </Button>
          <Group gap="sm">
            <Button variant="default" size="sm" radius="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              radius="md"
              color="brand"
              onClick={() => onNext({ fields, mappings })}
            >
              Create Template
            </Button>
          </Group>
        </Group>
      </Box>
    </Box>
  );
};
