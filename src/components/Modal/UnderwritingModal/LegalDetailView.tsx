import React from 'react';
import { Box, Group, Text, SimpleGrid, TextInput, Textarea, Divider } from '@mantine/core';
import { IconScale, IconFileText } from '@tabler/icons-react';
import { type Asset, type PanelId, type TitleChecklistItem, type LegalCheck, missingRequiredDocs, requiredDocsVerified, SectionLabel, CompactCheckRow, DocumentsTable } from './UnderwritingModal';

export function LegalDetailView({
  asset,
  panel,
  notes,
  setNotes,
  onUpdate,
  onUpdateChecklist,
  onUpdateLegalCheck,
}: {
  asset: Asset;
  panel: PanelId;
  notes: string;
  setNotes: (v: string) => void;
  onUpdate: (patch: Partial<Asset>) => void;
  onUpdateChecklist: (itemId: string, patch: Partial<TitleChecklistItem>) => void;
  onUpdateLegalCheck: (checkId: string, patch: Partial<LegalCheck>) => void;
}) {
  const missingTitleDocs = missingRequiredDocs(asset.titleDocs);
  const docsReady = requiredDocsVerified(asset.titleDocs);
  const disabledReason = "Verify all required Supporting Documents first";

  return (
    <Box px={16} pt={16} pb={12}>
      {panel === "legal" && (
        <Box>

          <SectionLabel color="brand.8" icon={IconScale}>Verifier Information</SectionLabel>
          <SimpleGrid cols={4} spacing={20} mt={16} mb={16}>
            <TextInput size="xs" label="Verifier name" value={asset.legalVerifier.name} onChange={(e) => onUpdate({ legalVerifier: { ...asset.legalVerifier, name: e.currentTarget.value } })} placeholder="e.g. M. Tembo" radius="md" />
            <TextInput size="xs" label="Company / firm" value={asset.legalVerifier.company} onChange={(e) => onUpdate({ legalVerifier: { ...asset.legalVerifier, company: e.currentTarget.value } })} placeholder="e.g. Tembo & Associates" radius="md" />
            <TextInput size="xs" label="Role" value={asset.legalVerifier.role} onChange={(e) => onUpdate({ legalVerifier: { ...asset.legalVerifier, role: e.currentTarget.value } })} placeholder="e.g. Internal legal officer" radius="md" />
            <TextInput size="xs" label="License number" value={asset.legalVerifier.license} onChange={(e) => onUpdate({ legalVerifier: { ...asset.legalVerifier, license: e.currentTarget.value } })} placeholder="e.g. LZ-4471" radius="md" />
          </SimpleGrid>

          <Divider my={10} />

          <SimpleGrid cols={2} spacing={20}>
            <Box>
              <SectionLabel color="brand.8" icon={IconScale}>Legal verification</SectionLabel>
              <Box mt={6}>
                {asset.titleChecklist.map((item) => (
                  <CompactCheckRow
                    key={item.id}
                    label={item.label}
                    checked={item.status === "Passed"}
                    exception={["Failed", "Exception"].includes(item.status)}
                    note={item.comment}
                    onToggle={() => onUpdateChecklist(item.id, { status: item.status === "Passed" ? "Pending" : "Passed" })}
                    onFlag={() => onUpdateChecklist(item.id, { status: ["Failed", "Exception"].includes(item.status) ? "Pending" : "Exception" })}
                    onNoteChange={(v) => onUpdateChecklist(item.id, { comment: v })}
                  />
                ))}
              </Box>
            </Box>

            <Box style={{ borderLeft: "1px solid var(--mantine-color-gray-2)", paddingLeft: 20 }}>
              <Group justify="space-between" mb={4}>
                <SectionLabel color="brand.8" icon={IconScale}>Legal checks</SectionLabel>
                <Text fz={10.5} c="dimmed">
                  for {asset.base.type}
                </Text>
              </Group>
              {asset.legalChecks.map((c) => (
                <CompactCheckRow
                  key={c.id}
                  label={c.name}
                  checked={c.status === "Passed"}
                  exception={["Failed", "Exception"].includes(c.status)}
                  note={c.comment}
                  onToggle={() => onUpdateLegalCheck(c.id, { status: c.status === "Passed" ? "Pending" : "Passed" })}
                  onFlag={() => onUpdateLegalCheck(c.id, { status: ["Failed", "Exception"].includes(c.status) ? "Pending" : "Exception" })}
                  onNoteChange={(v) => onUpdateLegalCheck(c.id, { comment: v })}
                />
              ))}
            </Box>
          </SimpleGrid>

          <Box mt={24} mb={8}>
            <SectionLabel color="brand.8" icon={IconFileText}>Supporting Documents</SectionLabel>
            <DocumentsTable title="" docs={asset.titleDocs} setDocs={(titleDocs) => onUpdate({ titleDocs })} />
          </Box>
        </Box>
      )}

      {panel === "notes" && (
        <Box>
          
          <Textarea
            size="xs"
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            placeholder="General comments, findings, risks, exceptions and recommendations that apply across the review…"
            minRows={2}
            radius="md"
          />
          <Text fz={11} c="dimmed" mt={6}>
            Shared across all assets and tabs, and included in the underwriting audit trail.
          </Text>
        </Box>
      )}
    </Box>
  );
}

