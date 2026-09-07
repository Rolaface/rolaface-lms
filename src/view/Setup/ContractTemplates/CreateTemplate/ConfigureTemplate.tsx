import React, { useState, useRef } from 'react';
import { Box, Button, Group, Text, Paper, Divider, Grid, Select, Badge, ActionIcon, Stack, Center, Modal } from '@mantine/core';
import { IconFileText, IconEye, IconZoomIn, IconZoomOut, IconMinus, IconPlus, IconDownload, IconAdjustments, IconInfoCircle } from '@tabler/icons-react';

interface ConfigureTemplateProps {
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
}

export const ConfigureTemplate: React.FC<ConfigureTemplateProps> = ({ onNext, onPrev, onCancel }) => {
  const [zoom, setZoom] = useState(100);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalPages = 3;

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 50));

  const fields = [
    { name: 'Customer Name', type: 'Text', placeholder: '{{customer_name}}', required: true },
    { name: 'Customer Number', type: 'Text', placeholder: '{{customer_number}}', required: true },
    { name: 'Loan Account Number', type: 'Text', placeholder: '{{loan_account_no}}', required: true },
    { name: 'Loan Amount', type: 'Currency', placeholder: '{{loan_amount}}', required: true },
    { name: 'Interest Rate (%)', type: 'Percentage', placeholder: '{{interest_rate}}', required: true },
    { name: 'Tenor (Months)', type: 'Number', placeholder: '{{tenor}}', required: true },
    { name: 'Disbursement Date', type: 'Date', placeholder: '{{disbursement_date}}', required: true },
    { name: 'Maturity Date', type: 'Date', placeholder: '{{maturity_date}}', required: false },
    { name: 'Repayment Amount', type: 'Currency', placeholder: '{{repayment_amount}}', required: false },
  ];

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
      <Box className="p-4">
        <Grid gutter="xl">
          {/* Left Column: Document Preview */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Paper p="md" style={{ border: '1px solid var(--mantine-color-slate-2)', borderRadius: '12px', height: '100%' }}>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconFileText size={20} color="var(--mantine-color-slate-6)" />
                  <Text fw={600} size="md" c="slate.9">Document Preview</Text>
                </Group>
                <Button variant="outline" color="brand" size="xs" style={{ borderColor: 'var(--mantine-color-brand-2)' }} leftSection={<IconEye size={14} />} onClick={() => setPreviewOpened(true)}>
                  Contract Preview
                </Button>
              </Group>

              {/* PDF Toolbar */}
              <Group justify="space-between" p="xs" style={{ borderBottom: '1px solid var(--mantine-color-slate-2)', borderTop: '1px solid var(--mantine-color-slate-2)', backgroundColor: 'var(--mantine-color-slate-0)' }}>
                <Group gap="md">
                  <ActionIcon variant="transparent" c="slate.6" onClick={handleZoomIn}><IconZoomIn size={18} /></ActionIcon>
                  <ActionIcon variant="transparent" c="slate.6" onClick={handleZoomOut}><IconZoomOut size={18} /></ActionIcon>
                  <Group gap={4}>
                    <Box style={{ border: '1px solid var(--mantine-color-slate-3)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'white' }}>
                      <Text size="sm">{currentPage}</Text>
                    </Box>
                    <Text size="sm" c="slate.5">/ {totalPages}</Text>
                  </Group>
                </Group>
                <Group gap="md">
                  <ActionIcon variant="transparent" c="slate.6" onClick={handleZoomOut}><IconMinus size={18} /></ActionIcon>
                  <Text size="sm" fw={500} w={40} ta="center">{zoom}%</Text>
                  <ActionIcon variant="transparent" c="slate.6" onClick={handleZoomIn}><IconPlus size={18} /></ActionIcon>
                  <ActionIcon variant="transparent" c="slate.6"><IconDownload size={18} /></ActionIcon>
                </Group>
              </Group>

              {/* PDF Document Area */}
              <Box p="xl" style={{ height: '400px', backgroundColor: 'var(--mantine-color-slate-0)', overflowY: 'auto', overflowX: 'hidden' }} ref={scrollRef} onScroll={handleScroll}>
                <Box style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                  <Stack gap="xl" align="center">
                    {/* Page 1 */}
                    <Paper id="doc-page-1" p="xl" shadow="sm" style={{ backgroundColor: 'white', width: '100%', minHeight: '500px' }}>
                      <Center mb="lg">
                        <Text fw={700} size="lg">PERSONAL LOAN AGREEMENT</Text>
                      </Center>
                      <Text size="xs" mb="md">This Personal Loan Agreement ("Agreement") is made on {'{{disbursement_date}}'} between:</Text>
                      <Text size="xs" mb="md">{'{{customer_name}}'} ("Borrower"), Customer No. {'{{customer_number}}'}<br/>and<br/>{'{{lender_name}}'} ("Lender").</Text>
                      <Text size="xs" fw={700} mb="xs">1. LOAN DETAILS</Text>
                      <Text size="xs" mb="md">1.1 The Lender agrees to grant a loan to the Borrower with the following terms:</Text>
                      
                      <Box style={{ border: '1px solid var(--mantine-color-slate-3)' }}>
                        {[
                          { label: 'Loan Account Number', val: '{{loan_account_no}}' },
                          { label: 'Loan Amount', val: '{{loan_amount}}' },
                          { label: 'Interest Rate', val: '{{interest_rate}} % per annum' },
                          { label: 'Tenor', val: '{{tenor}} months' },
                          { label: 'Disbursement Date', val: '{{disbursement_date}}' },
                          { label: 'Maturity Date', val: '{{maturity_date}}' },
                          { label: 'Repayment Amount', val: '{{repayment_amount}}' },
                        ].map((row, i) => (
                          <Grid key={i} m={0} style={{ borderBottom: i !== 6 ? '1px solid var(--mantine-color-slate-2)' : 'none' }}>
                            <Grid.Col span={6} p="xs" style={{ borderRight: '1px solid var(--mantine-color-slate-2)', backgroundColor: 'var(--mantine-color-slate-0)' }}>
                              <Text size="xs" fw={600}>{row.label}</Text>
                            </Grid.Col>
                            <Grid.Col span={6} p="xs">
                              <Text size="xs">{row.val}</Text>
                            </Grid.Col>
                          </Grid>
                        ))}
                      </Box>
                    </Paper>

                    {/* Page 2 */}
                    <Paper id="doc-page-2" p="xl" shadow="sm" style={{ backgroundColor: 'white', width: '100%', minHeight: '500px' }}>
                      <Text size="xs" fw={700} mb="xs">2. CONDITIONS PRECEDENT</Text>
                      <Text size="xs" mb="md">2.1 The Borrower shall provide all necessary documents required by the Lender before disbursement.</Text>
                      <Text size="xs" mb="md">2.2 The Loan Amount will be transferred to the Borrower's designated account.</Text>
                      
                      <Text size="xs" fw={700} mb="xs" mt="xl">3. REPAYMENT</Text>
                      <Text size="xs" mb="md">3.1 The Borrower shall repay the loan in equal monthly installments.</Text>
                      <Text size="xs" mb="md">3.2 The repayment amount is {'{{repayment_amount}}'} starting from the month following disbursement.</Text>
                      <Text size="xs" mb="md">3.3 Late payments will incur a penalty fee of 2% per month.</Text>
                    </Paper>

                    {/* Pages 3 to 6 */}
                    {[3].map((num) => (
                      <Paper key={num} id={`doc-page-${num}`} p="xl" shadow="sm" style={{ backgroundColor: 'white', width: '100%', minHeight: '500px' }}>
                        <Center h="100%">
                          <Text size="sm" c="slate.4">[Page {num} Content]</Text>
                        </Center>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Box>

              {/* Thumbnails */}
              <Group p="md" gap="sm" justify="center" style={{ borderTop: '1px solid var(--mantine-color-slate-2)' }}>
                {[1, 2, 3].map((num) => (
                  <Stack key={num} align="center" gap={4} onClick={() => scrollToPage(num)} style={{ cursor: 'pointer' }}>
                    <Box style={{ width: 40, height: 50, border: num === currentPage ? '2px solid var(--mantine-color-brand-6)' : '1px solid var(--mantine-color-slate-3)', backgroundColor: 'white', padding: 2, display: 'flex', flexDirection: 'column', gap: 2, transition: 'all 0.2s' }}>
                      <div style={{ height: 2, backgroundColor: num === currentPage ? 'var(--mantine-color-brand-4)' : 'var(--mantine-color-slate-2)', width: '80%' }} />
                      <div style={{ height: 2, backgroundColor: num === currentPage ? 'var(--mantine-color-brand-4)' : 'var(--mantine-color-slate-2)', width: '100%' }} />
                      <div style={{ height: 2, backgroundColor: num === currentPage ? 'var(--mantine-color-brand-4)' : 'var(--mantine-color-slate-2)', width: '90%' }} />
                      <div style={{ height: 2, backgroundColor: num === currentPage ? 'var(--mantine-color-brand-4)' : 'var(--mantine-color-slate-2)', width: '60%' }} />
                    </Box>
                    <Text size="xs" c={num === currentPage ? 'brand.7' : 'slate.5'} fw={num === currentPage ? 600 : 400}>{num}</Text>
                  </Stack>
                ))}
              </Group>
            </Paper>
          </Grid.Col>

          {/* Right Column: Configure Fields */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
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

            {/* Table */}
            <Box mb="xl">
              <Grid m={0} pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-slate-2)' }}>
                <Grid.Col span={5}><Text size="xs" fw={600} c="slate.7">Available Fields</Text></Grid.Col>
                <Grid.Col span={5}><Text size="xs" fw={600} c="slate.7">Map To (Document Placeholder)</Text></Grid.Col>
                <Grid.Col span={2}><Text size="xs" fw={600} c="slate.7">Required</Text></Grid.Col>
              </Grid>

              {fields.map((field, idx) => (
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
                      data={[field.placeholder]}
                      value={field.placeholder}
                      styles={{ input: { fontSize: '12px', fontFamily: 'monospace', color: 'var(--mantine-color-slate-6)' } }}
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
              ))}
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
          </Grid.Col>
        </Grid>
      </Box>


      <Modal opened={previewOpened} onClose={() => setPreviewOpened(false)} title="Contract Preview" size="80%" withCloseButton closeButtonProps={{ size: 'lg' }}>
        <Box p="md" style={{ backgroundColor: 'var(--mantine-color-slate-0)', height: '60vh', overflowY: 'auto' }}>
          <Paper p="xl" shadow="sm" radius="md" style={{ backgroundColor: 'white', minHeight: '800px' }}>
            <Center mb="lg">
              <Text fw={700} size="xl">PERSONAL LOAN AGREEMENT</Text>
            </Center>
            <Text size="sm" mb="md">This Personal Loan Agreement ("Agreement") is made on <strong>01-Sep-2026</strong> between:</Text>
            <Text size="sm" mb="md"><strong>John Doe</strong> ("Borrower"), Customer No. <strong>CUST-98213</strong><br/>and<br/><strong>HDFC Bank</strong> ("Lender").</Text>
            <Text size="sm" fw={700} mb="xs">1. LOAN DETAILS</Text>
            <Text size="sm" mb="md">1.1 The Lender agrees to grant a loan to the Borrower with the following terms:</Text>
            
            <Box style={{ border: '1px solid var(--mantine-color-slate-3)' }}>
              <Grid m={0} style={{ borderBottom: '1px solid var(--mantine-color-slate-2)' }}><Grid.Col span={6} p="xs" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}><Text size="sm" fw={600}>Loan Account Number</Text></Grid.Col><Grid.Col span={6} p="xs"><Text size="sm">LN-0912384</Text></Grid.Col></Grid>
              <Grid m={0} style={{ borderBottom: '1px solid var(--mantine-color-slate-2)' }}><Grid.Col span={6} p="xs" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}><Text size="sm" fw={600}>Loan Amount</Text></Grid.Col><Grid.Col span={6} p="xs"><Text size="sm">? 5,00,000</Text></Grid.Col></Grid>
              <Grid m={0} style={{ borderBottom: '1px solid var(--mantine-color-slate-2)' }}><Grid.Col span={6} p="xs" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}><Text size="sm" fw={600}>Interest Rate</Text></Grid.Col><Grid.Col span={6} p="xs"><Text size="sm">12.5 % per annum</Text></Grid.Col></Grid>
              <Grid m={0} style={{ borderBottom: '1px solid var(--mantine-color-slate-2)' }}><Grid.Col span={6} p="xs" style={{ backgroundColor: 'var(--mantine-color-slate-0)' }}><Text size="sm" fw={600}>Tenor</Text></Grid.Col><Grid.Col span={6} p="xs"><Text size="sm">48 months</Text></Grid.Col></Grid>
            </Box>
          </Paper>
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
