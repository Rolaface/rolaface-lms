import React, { useState, useRef, useMemo } from 'react';
import { Box, Button, Group, Text, Paper, Divider, Grid, Select, Badge, ActionIcon, Stack, Center, Modal, Pagination } from '@mantine/core';
import { IconFileText, IconEye, IconZoomIn, IconZoomOut, IconMinus, IconPlus, IconDownload, IconAdjustments, IconInfoCircle } from '@tabler/icons-react';

interface ConfigureTemplateProps {
  uploadedData?: any;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
}

export const ConfigureTemplate: React.FC<ConfigureTemplateProps> = ({ uploadedData, onNext, onPrev, onCancel }) => {
  const [zoom, setZoom] = useState(100);
  const [previewOpened, setPreviewOpened] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 50));

  // Use extracted placeholders from API response if available, else fallback to defaults
  const extracted: string[] = useMemo(() =>
    uploadedData?.message?.placeholders ?? uploadedData?.data?.placeholders ?? [],
    [uploadedData]
  );

  // Build all placeholder options for dropdown
  const allPlaceholders = useMemo(() =>
    extracted.map((p: string) => {
      const clean = p.replace(/[{}]/g, '');
      return { value: clean, label: clean };
    }),
    [extracted]
  );

  // Build field rows from extracted placeholders
  const fields = useMemo(() => {
    if (extracted.length === 0) return [];
    return extracted.map((placeholder: string) => {
      const cleanName = placeholder.replace(/[{}]/g, '');
      const formattedName = cleanName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return {
        name: formattedName,
        type: 'Text',
        placeholder: `{{${cleanName}}}`,
        required: true,
      };
    });
  }, [extracted]);

  // Mapping state: field name → selected placeholder value
  // Auto-map: try to match field name to a placeholder by normalized comparison
  const [mappings, setMappings] = useState<Record<string, string | null>>({});

  // Auto-map on first load when fields change
  useMemo(() => {
    if (fields.length === 0) return;
    const initial: Record<string, string | null> = {};
    fields.forEach(field => {
      // Normalize field name: "Customer Name" → "customer_name"
      const normalized = field.name.toLowerCase().replace(/\s+/g, '_');
      // Find matching placeholder
      const match = allPlaceholders.find(p => p.value === normalized);
      initial[field.name] = match ? match.value : null;
    });
    setMappings(initial);
  }, [fields, allPlaceholders]);

  const updateMapping = (fieldName: string, value: string | null) => {
    setMappings(prev => ({ ...prev, [fieldName]: value }));
  };

  // File URL from API response (for preview)
  const filePreviewUrl = uploadedData?.message?.file_url ?? uploadedData?.data?.file_url ?? uploadedData?.local_file_url ?? null;

  const scrollToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    const element = document.getElementById(`doc-page-${pageNum}`);
    if (element && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollPos = scrollRef.current.scrollTop + 100;
    for (let i = totalPages; i >= 1; i--) {
      const el = document.getElementById(`doc-page-${i}`);
      if (el && scrollPos >= el.offsetTop) {
        if (currentPage !== i) setCurrentPage(i);
        break;
      }
    }
  };

  return (
    <Box className="flex flex-col bg-white">
      <Box className="p-2">
        <Grid gutter="xl">
          {/* Left Column: Document Preview */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Box style={{ position: 'sticky', top: '20px' }}>
              <Paper p="md" style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: '12px', height: '650px', display: 'flex', flexDirection: 'column' }}>
                <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
                <Group gap="xs">
                  <IconFileText size={20} color="var(--mantine-color-slate-6)" />
                  <Text fw={600} size="md" c="slate.9">Document Preview</Text>
                </Group>
                <Button variant="outline" color="brand" size="xs" style={{ borderColor: 'var(--mantine-color-brand-2)' }} leftSection={<IconEye size={14} />} onClick={() => setPreviewOpened(true)}>
                  Contract Preview
                </Button>
              </Group>

              {/* PDF Toolbar */}
              <Group justify="space-between" p="xs" style={{ borderBottom: '1px solid var(--mantine-color-slate-2)', borderTop: '1px solid var(--mantine-color-slate-2)', backgroundColor: 'var(--mantine-color-slate-0)', flexShrink: 0 }}>
                <Group gap="md">
                  <ActionIcon variant="transparent" c="slate.6" onClick={handleZoomIn}><IconZoomIn size={18} /></ActionIcon>
                  <ActionIcon variant="transparent" c="slate.6" onClick={handleZoomOut}><IconZoomOut size={18} /></ActionIcon>
                </Group>


                <Group gap="md">
                  <Select
                    size="xs"
                    data={['50%', '75%', '100%', '125%', '150%']}
                    value={`${zoom}%`}
                    onChange={(val) => setZoom(parseInt(val || '100'))}
                    styles={{ input: { width: '80px', border: 'none', backgroundColor: 'transparent', fontWeight: 500, color: 'var(--mantine-color-slate-7)' } }}
                  />
                  <ActionIcon variant="transparent" c="slate.6"><IconDownload size={18} /></ActionIcon>
                  <ActionIcon variant="transparent" c="slate.6"><IconFileText size={18} /></ActionIcon>
                </Group>
              </Group>

              {/* PDF Document Area */}
              {filePreviewUrl ? (
                <Box p="md" style={{ flex: 1, backgroundColor: 'var(--mantine-color-slate-0)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Paper shadow="sm" radius="sm" style={{ width: '100%', maxWidth: '800px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box style={{ flex: 1, transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s', width: '100%' }}>
                      <iframe 
                        src={`${filePreviewUrl}#view=FitH&toolbar=0&navpanes=0`} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none', backgroundColor: 'white', display: 'block' }} 
                        title="Document Preview" 
                      />
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Center style={{ flex: 1, minHeight: '500px', backgroundColor: 'var(--mantine-color-slate-0)' }}>
                  <Stack align="center" gap="xs">
                    <IconFileText size={48} color="var(--mantine-color-slate-4)" />
                    <Text c="slate.5" size="sm">No document preview available</Text>
                    <Text c="slate.4" size="xs">The API did not return a valid file URL.</Text>
                  </Stack>
                </Center>
              )}
              </Paper>
            </Box>
          </Grid.Col>

          {/* Right Column: Configure Fields */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Box style={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <IconAdjustments size={20} color="var(--mantine-color-slate-6)" />
                  <Text fw={600} size="md" c="slate.9">Configure Fields</Text>
                </Group>
                <Button variant="subtle" color="brand" size="sm" leftSection={<IconPlus size={16} />}>
                  Add Custom Field
                </Button>
              </Group>
              <Text size="sm" c="slate.5" mb="xl">
                Map document placeholders with available fields.
              </Text>

              {/* Table Header */}
              <Grid m={0} pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-slate-2)', flexShrink: 0 }}>
                <Grid.Col span={5}><Text size="xs" fw={600} c="slate.7">Available Fields</Text></Grid.Col>
                <Grid.Col span={5}><Text size="xs" fw={600} c="slate.7">Map To (Document Placeholder)</Text></Grid.Col>
                <Grid.Col span={2}><Text size="xs" fw={600} c="slate.7">Required</Text></Grid.Col>
              </Grid>

              {/* Scrollable List */}
              <Box style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }} mb="xl">
                {fields.length === 0 ? (
                  <Center p="xl">
                    <Text size="sm" c="slate.5">No placeholders extracted. Please ensure the uploaded document contains {'{{placeholder}}'} tags.</Text>
                  </Center>
                ) : (
                  fields.map((field, idx) => {
                    const mapped = mappings[field.name];
                    const isMapped = !!mapped;
                    return (
                      <Grid key={idx} m={0} py="sm" align="center" style={{ borderBottom: '1px dashed var(--mantine-color-slate-2)' }}>
                        <Grid.Col span={5}>
                          <Group gap="sm">
                            <Text size="sm" fw={500} c="slate.7">{field.name}</Text>
                            <Badge variant="light" color="brand" radius="sm" style={{ textTransform: 'none', fontSize: '10px' }}>
                              {field.type}
                            </Badge>
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={5}>
                          <Select
                            size="sm"
                            searchable
                            clearable
                            placeholder="Select placeholder..."
                            data={allPlaceholders}
                            value={mapped}
                            onChange={(val) => updateMapping(field.name, val)}
                            styles={{
                              input: {
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                color: isMapped ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-red-6)',
                                borderColor: isMapped ? 'var(--mantine-color-success-4)' : 'var(--mantine-color-slate-3)',
                              },
                            }}
                            rightSection={isMapped ? (
                              <Box w={8} h={8} style={{ borderRadius: '50%', background: 'var(--mantine-color-success-5)' }} />
                            ) : undefined}
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          {field.required ? (
                            <Group gap={4}>
                              <Text c="green.6" size="sm" fw={700}>*</Text>
                              <Text c="green.7" size="xs" fw={600}>Required</Text>
                            </Group>
                          ) : (
                            <Text c="slate.4" size="xs">Optional</Text>
                          )}
                        </Grid.Col>
                      </Grid>
                    );
                  })
                )}
              </Box>

            {/* Info Alert */}
            <Paper p="sm" radius="md" style={{ backgroundColor: 'var(--mantine-color-brand-0)', border: '1px solid var(--mantine-color-brand-2)' }}>
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <IconInfoCircle size={20} color="var(--mantine-color-brand-6)" style={{ marginTop: 2 }} />
                <Text size="sm" c="brand.9">
                  These fields will be populated automatically when a contract is generated using this template.
                </Text>
              </Group>
            </Paper>
            </Box>
          </Grid.Col>
        </Grid>
      </Box>


      <Modal opened={previewOpened} onClose={() => setPreviewOpened(false)} title="Contract Preview" size="80%" withCloseButton closeButtonProps={{ size: 'lg' }}>
        <Box style={{ backgroundColor: 'var(--mantine-color-slate-0)', height: '70vh' }}>
          {filePreviewUrl ? (
            <iframe src={filePreviewUrl} width="100%" height="100%" style={{ border: 'none', backgroundColor: 'white' }} title="Document Preview Modal" />
          ) : (
            <Center h="100%">
              <Stack align="center" gap="xs">
                <IconFileText size={48} color="var(--mantine-color-slate-4)" />
                <Text c="slate.5" size="sm">No document preview available</Text>
              </Stack>
            </Center>
          )}
        </Box>
      </Modal>

      <Divider color="slate.2" />

      <Group justify="space-between" p="lg" px={32}>
        <Button variant="default" size="md" onClick={onPrev}>
          Back
        </Button>
        <Group>
          <Button variant="default" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="md" color="brand" onClick={onNext} rightSection={<span dangerouslySetInnerHTML={{ __html: '&rarr;' }} />}>
            Create Template
          </Button>
        </Group>
      </Group>
    </Box>
  );
};
