import { useRef, useState } from "react";
import { Box, Group, Text, SimpleGrid, Paper, TextInput, Textarea, Select, Button, ActionIcon, Tooltip, Badge, Checkbox } from "@mantine/core";
import { IconX, IconLock, IconPlus, IconFileText, IconUpload, IconCircleCheck, IconAlertTriangle, IconEye, IconRefresh, IconPencil } from "@tabler/icons-react";
import type { Asset, AssetDoc, PanelId, TitleChecklistItem, LegalCheck } from "./UnderwritingModal";
import {
  requiredDocsVerified,
  SectionLabel, CompactCheckRow, DocumentsTable, DocumentPreviewModal,
} from "./AssetValuation"

export function LegalVerification({
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
  finalAmount?: number;
}) {
  const docFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const addDocRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // -------------------------------------------------------------- Legal
  if (panel === "legal") {
    const passedChecks = asset.legalChecks.filter(c => c.status === "Passed").length;
    const totalChecks = asset.legalChecks.length;

    const stampFile = (f: File) => ({
      status: "Uploaded",
      fileMeta: `${f.name} (${(f.size / 1048576).toFixed(1)} MB)`,
      uploadedBy: "You",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      fileUrl: URL.createObjectURL(f),
      fileType: f.type,
    });

    const setDoc = (i: number, patch: Partial<AssetDoc>) =>
      onUpdate({ titleDocs: asset.titleDocs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) });

    const onDocFile = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const old = asset.titleDocs[i]?.fileUrl;
      if (old) URL.revokeObjectURL(old);
      setDoc(i, stampFile(f));
      e.target.value = "";
    };

    // Required slots keep their place and go back to "missing"; optional ones are dropped.
    const onRemoveDoc = (i: number) => {
      const d = asset.titleDocs[i];
      if (d.fileUrl) URL.revokeObjectURL(d.fileUrl);
      if (d.tier === "required") {
        setDoc(i, { status: "Missing", fileMeta: "", uploadedBy: "", uploadedDate: "", fileUrl: undefined, fileType: undefined });
      } else {
        onUpdate({ titleDocs: asset.titleDocs.filter((_, idx) => idx !== i) });
      }
    };

    const onAddDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const newDoc = { name: f.name.replace(/\.[^.]+$/, ""), tier: "optional" as const, status: "Missing", uploadedDate: "", uploadedBy: "", validUntil: "", fileMeta: "", comment: "" };
      onUpdate({ titleDocs: [...asset.titleDocs, { ...newDoc, ...stampFile(f) }] });
      e.target.value = "";
    };

    return (
      <Box px={14} pt={8} pb={6}>
        <Group justify="space-between" mb={4}>
          <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase">Documents the checks are made against</Text>
          <input type="file" ref={addDocRef} style={{ display: "none" }} onChange={onAddDocFile} />
          <Button size="compact-xs" variant="outline" radius="xl" color="indigo" leftSection={<IconPlus size={12} />} onClick={() => addDocRef.current?.click()}>Add document</Button>
        </Group>

        <DocumentPreviewModal
          opened={previewIdx != null}
          onClose={() => setPreviewIdx(null)}
          doc={previewIdx != null ? asset.titleDocs[previewIdx] : undefined}
        />

        <SimpleGrid cols={3} spacing={8} mb={10}>
          {asset.titleDocs.map((d, i) => {
            const isOpt = d.tier === "optional";
            const ok = d.status === "Verified" || d.status === "Uploaded";
            return (
              <Paper key={i} withBorder radius="md" p={6} bg={ok ? "green.0" : "transparent"}
                style={{ borderColor: ok ? "var(--mantine-color-green-3)" : isOpt ? "var(--mantine-color-gray-3)" : "var(--mantine-color-brand-3)",
                        borderStyle: isOpt && !ok ? "dashed" : "solid" }}>
                <input type="file" ref={(el) => { docFileRefs.current[i] = el; }} style={{ display: "none" }} onChange={(e) => onDocFile(i, e)} />
                <Group wrap="nowrap" gap={8} align="center">
                  {ok ? <IconFileText size={16} color="var(--mantine-color-green-7)" style={{ flexShrink: 0 }} /> : <IconUpload size={16} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />}
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    {editingIdx === i ? (
                      <TextInput
                        size="xs"
                        radius="sm"
                        autoFocus
                        value={d.name}
                        placeholder="Document name"
                        onChange={(e) => setDoc(i, { name: e.currentTarget.value })}
                        onBlur={() => setEditingIdx(null)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingIdx(null); }}
                        styles={{ input: { fontSize: 12, fontWeight: 600, height: 22, minHeight: 22 } }}
                      />
                    ) : (
                      <Group gap={4} wrap="nowrap">
                        <Text fz={12} fw={600} c={ok ? "green.9" : "dark.8"} truncate>{d.name || "Untitled document"}</Text>
                        <Tooltip label="Rename" withArrow>
                          <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => setEditingIdx(i)} aria-label="Rename document">
                            <IconPencil size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                    <Text fz={10.5} c={ok ? "green.7" : "dimmed"} truncate>
                      {ok ? (d.fileMeta || "Verified") : isOpt ? "Optional" : "Required"}
                    </Text>
                  </Box>
                  <Group gap={2} wrap="nowrap">
                    {ok ? (
                      <>
                        <Tooltip label="Preview" withArrow>
                          <ActionIcon variant="subtle" color="indigo" size="sm" onClick={() => setPreviewIdx(i)}><IconEye size={14} /></ActionIcon>
                        </Tooltip>
                        <Tooltip label="Replace" withArrow>
                          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => docFileRefs.current[i]?.click()}><IconRefresh size={14} /></ActionIcon>
                        </Tooltip>
                      </>
                    ) : (
                      <Button variant="light" color="indigo" size="compact-xs" radius="xl" onClick={() => docFileRefs.current[i]?.click()}>Attach</Button>
                    )}
                    {(ok || isOpt) && (
                      <Tooltip label={ok ? "Remove file" : "Remove"} withArrow>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRemoveDoc(i)}><IconX size={14} /></ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Group>
              </Paper>
            )
          })}
        </SimpleGrid>

        <Group align="flex-start" wrap="nowrap" gap={14}>
          <Box style={{ flex: 1 }}>
            <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase" mb={6}>Title Information</Text>
            
            <SimpleGrid cols={2} spacing={10} mb={6}>
              <TextInput size="xs" radius="md" label="Title / registration no." value={asset.title.titleNumber} onChange={(e) => onUpdate({ title: { ...asset.title, titleNumber: e.currentTarget.value } })} />
              <TextInput size="xs" radius="md" label="Registered owner" value={asset.title.registeredOwner} onChange={(e) => onUpdate({ title: { ...asset.title, registeredOwner: e.currentTarget.value } })} />
            </SimpleGrid>
            
            <TextInput size="xs" radius="md" label="Registration details" value="RTSA · first registered 14 Mar 2019" mb={10} readOnly />
            

            <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase" mb={6}>Verified By</Text>
            <SimpleGrid cols={2} spacing={10}>
              <TextInput size="xs" radius="md" label="Name" value={asset.legalVerifier.name} onChange={(e) => onUpdate({ legalVerifier: { ...asset.legalVerifier, name: e.currentTarget.value } })} />
              <TextInput size="xs" radius="md" label="Firm" value={asset.legalVerifier.company} onChange={(e) => onUpdate({ legalVerifier: { ...asset.legalVerifier, company: e.currentTarget.value } })} />
              <Select size="xs" radius="md" label="Role" value="External counsel" data={["External counsel", "Internal legal"]} allowDeselect={false} />
              <TextInput size="xs" radius="md" label="License number" value="LZ-4471" readOnly />
            </SimpleGrid>
          </Box>

          <Box style={{ flex: 1.1 }}>
            <Group justify="space-between" mb={6}>
              <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase">Legal Checks</Text>
              <Text fz={11} c="dimmed">{asset.base.type} - {passedChecks} of {totalChecks} cleared</Text>
            </Group>
            
            <Box>
              {asset.legalChecks.map((c) => {
                const isExc = c.status === "Exception" || c.status === "Failed";
                const isOk = c.status === "Passed";
                return (
                  <Box key={c.id} mb={6}>
                    <Group justify="space-between" wrap="nowrap">
                      <Checkbox
                        size="sm"
                        label={c.name}
                        checked={isOk}
                        onChange={(e) => onUpdateLegalCheck(c.id, { status: e.currentTarget.checked ? "Passed" : "Pending" })}
                        styles={{ label: { fontSize: 13, color: isExc ? "var(--mantine-color-orange-7)" : "var(--mantine-color-dark-8)", fontWeight: 500 } }}
                      />
                      <Group gap={8}>
                        {isOk && (
                          <Badge variant="transparent" color="green" size="sm" leftSection={<IconCircleCheck size={14} />} style={{ textTransform: 'none', fontWeight: 600 }}>
                            Verified
                          </Badge>
                        )}
                        {!isOk && (
                          <ActionIcon 
                            variant="outline" 
                            color={isExc ? "indigo" : "gray"} 
                            radius="md" 
                            size="sm"
                            onClick={() => onUpdateLegalCheck(c.id, { status: isExc ? "Pending" : "Exception" })}
                            style={{ borderColor: isExc ? "var(--mantine-color-indigo-6)" : "var(--mantine-color-gray-4)", borderWidth: 1.5 }}
                          >
                            <IconAlertTriangle size={14} color={isExc ? "var(--mantine-color-orange-6)" : "var(--mantine-color-gray-5)"} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                    
                  </Box>
                )
              })}
            </Box>

            <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase" mt={10} mb={6}>Legal Remark</Text>
            <Textarea
              size="xs"
              radius="md"
              minRows={3}
              autosize
              placeholder="Overall legal opinion on this asset…"
              value={asset.legalRemarks}
              onChange={(e) => onUpdate({ legalRemarks: e.currentTarget.value })}
              error={!asset.legalRemarks.trim() && asset.legalChecks.some((c) => ["Failed", "Exception"].includes(c.status)) ? "Explain the flagged checks and what's required to resolve them" : undefined}
            />
          </Box>
        </Group>
      </Box>
    );
  }

  return null;
}
