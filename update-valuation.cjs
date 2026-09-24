const fs = require('fs');
const file = 'src/components/Modal/UnderwritingModal/AssetDetailView.tsx';
const content = fs.readFileSync(file, 'utf8');

const newValuationPanel = `
      {panel === "valuation" && (
        <Box>
          <Group align="flex-start" wrap="nowrap" gap={24}>
            <Box style={{ flex: 1.5 }}>
              <Group justify="space-between" align="center" mb={8}>
                <Text fz={10} fw={700} c="dark.5" tt="uppercase">Valuation Report</Text>
                <Button variant="default" size="compact-xs" radius="xl" style={{ border: "none", background: "transparent", color: "var(--mantine-color-brand-6)" }}>Opened</Button>
              </Group>
              <Paper 
                withBorder 
                style={{ 
                  borderStyle: "dashed", 
                  borderWidth: 2, 
                  borderColor: "var(--mantine-color-brand-3)",
                  backgroundColor: "var(--mantine-color-brand-0)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 320
                }} 
                p="xl"
                radius="md"
              >
                <ActionIcon variant="light" color="brand" size={50} radius="xl" mb={16}>
                  <IconUpload size={24} />
                </ActionIcon>
                <Text fw={700} fz={16} c="brand.9" mb={8}>Upload the valuation report</Text>
                <Text fz={12} c="dimmed" ta="center" maw={300} mb={20}>
                  Market value, forced sale value, valuation date and the valuer's details are all read off this report. Attach it first.
                </Text>
                <Group>
                  <Button size="sm" radius="xl">Choose a file</Button>
                  <Text fz={12} c="dimmed">or drop a file here</Text>
                </Group>
                <Text fz={9} c="dimmed" mt={16}>PDF, JPG, PNG, up to 20 MB</Text>
              </Paper>
              <Group mt={12} justify="space-between" align="center" p={12} bg="orange.0" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-orange-2)" }}>
                <Group gap={8}>
                  <IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" />
                  <Text fz={12} fw={500} c="orange.8">No valuation report available for this asset</Text>
                </Group>
                <Button size="compact-sm" variant="light" color="orange" radius="xl">Request on application</Button>
              </Group>
            </Box>

            <Box style={{ flex: 1 }}>
              <Text fz={10} fw={700} c="dark.5" tt="uppercase" mb={4}>Figures from the report</Text>
              <Text fz={11} c="dimmed" mb={12}>
                These open once a report is attached, so no figure is recorded without the document behind it.
              </Text>
              
              <SimpleGrid cols={2} spacing={8} mb={24}>
                <NumberInput
                  size="xs"
                  label="Market value"
                  value={asset.valuation.marketValue ? Number(asset.valuation.marketValue) : undefined}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, marketValue: v ? String(v) : "" } })}
                  placeholder="e.g. 98000"
                  prefix="ZMW "
                  radius="md"
                  thousandSeparator=","
                />
                <NumberInput
                  size="xs"
                  label="Forced sale value"
                  value={asset.valuation.forcedSaleValue ? Number(asset.valuation.forcedSaleValue) : undefined}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, forcedSaleValue: v ? String(v) : "" } })}
                  placeholder="e.g. 76000"
                  prefix="ZMW "
                  radius="md"
                  thousandSeparator=","
                />
                <TextInput 
                  size="xs" 
                  type="date" 
                  label="Valuation date" 
                  value={asset.valuationDate} 
                  onChange={(e) => onUpdate({ valuationDate: e.currentTarget.value })} 
                  radius="md" 
                />
                <Select
                  size="xs"
                  label="Valuation method"
                  value={asset.valuation.method}
                  onChange={(v) => onUpdate({ valuation: { ...asset.valuation, method: v || asset.valuation.method } })}
                  data={["Market comparison", "Cost approach", "Income approach"]}
                  radius="md"
                />
              </SimpleGrid>

              <Text fz={10} fw={700} c="dark.5" tt="uppercase" mb={8}>Valuer prepared by</Text>
              <SimpleGrid cols={2} spacing={8} mb={16}>
                <TextInput size="xs" label="Valuer name" value={asset.valuer.name} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, name: e.currentTarget.value } })} placeholder="e.g. K. Zulu" radius="md" />
                <TextInput size="xs" label="Firm" value={asset.valuer.company} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, company: e.currentTarget.value } })} placeholder="e.g. Apex Valuers Ltd" radius="md" />
                <TextInput size="xs" label="License number" value={asset.valuer.license} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, license: e.currentTarget.value } })} placeholder="e.g. VAL-2321" radius="md" />
                <Box pt={22}>
                  <Checkbox
                    checked={asset.valuer.verified}
                    onChange={(e) => onUpdate({ valuer: { ...asset.valuer, verified: e.currentTarget.checked } })}
                    label="Practising certificate signed"
                    size="xs"
                  />
                </Box>
              </SimpleGrid>

              <Textarea
                size="xs"
                label="Underwriter comment - optional"
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                placeholder="Anything that qualifies these figures..."
                minRows={3}
                radius="md"
              />
            </Box>
          </Group>
        </Box>
      )}
`;

const parts = content.split('{panel === "valuation" && (');
if (parts.length > 1) {
  const nextParts = parts[1].split('{panel === "assetConclusion" && (');
  if (nextParts.length > 1) {
    const finalContent = parts[0] + newValuationPanel + '      {panel === "assetConclusion" && (' + nextParts[1];
    fs.writeFileSync(file, finalContent);
    console.log('Valuation panel updated successfully');
  }
}
