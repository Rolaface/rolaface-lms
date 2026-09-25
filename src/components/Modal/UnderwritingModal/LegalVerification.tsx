import { useRef } from "react";
import { Box, Group, Text, SimpleGrid, Paper, TextInput, Textarea, Select, Button, ActionIcon, Tooltip, Badge, Checkbox, UnstyledButton } from "@mantine/core";
import { IconX, IconLock, IconPlus, IconFileText, IconUpload, IconInfoCircle, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react";
import type { Asset, PanelId, TitleChecklistItem, LegalCheck, Decision } from "./UnderwritingModal";
import {
  REJECT_REASONS, zmw, missingRequiredDocs, requiredDocsVerified,
  SectionLabel, CompactCheckRow, DocumentsTable,
} from "./AssetValuation"

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <Paper withBorder radius="md" p="sm" style={{ borderLeft: `3px solid var(--mantine-color-${color}-6)` }}>
      <Text fz={11} fw={600} c="dimmed">{label}</Text>
      <Text fz={15} fw={700} c={`${color}.8`}>{value}</Text>
      <Text fz={11} c="dimmed">{sub}</Text>
    </Paper>
  );
}

export function LegalVerification({
  asset,
  panel,
  notes,
  setNotes,
  onUpdate,
  onUpdateChecklist,
  onUpdateLegalCheck,
  finalAmount,
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
  // -------------------------------------------------------------- Legal
  if (panel === "legal") {
    const passedChecks = asset.legalChecks.filter(c => c.status === "Passed").length;
    const totalChecks = asset.legalChecks.length;

    const docFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const addDocRef = useRef<HTMLInputElement>(null);

    const stampFile = (f: File) => ({
      status: "Uploaded",
      fileMeta: `${f.name} (${(f.size / 1048576).toFixed(1)} MB)`,
      uploadedBy: "You",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });

    const onDocFile = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      onUpdate({ titleDocs: asset.titleDocs.map((d, idx) => (idx === i ? { ...d, ...stampFile(f), name: d.name } : d)) });
      e.target.value = "";
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

        <SimpleGrid cols={3} spacing={8} mb={10}>
          {asset.titleDocs.map((d, i) => {
            const isOpt = d.tier === "optional";
            const ok = d.status === "Verified" || d.status === "Uploaded";
            return (
              <Paper key={i} withBorder radius="md" p={6} bg={ok ? "green.0" : "transparent"}
                component={ok ? "div" : UnstyledButton}
                onClick={ok ? undefined : () => docFileRefs.current[i]?.click()}
                style={{ borderColor: ok ? "var(--mantine-color-green-3)" : isOpt ? "var(--mantine-color-gray-3)" : "var(--mantine-color-brand-3)", 
                        borderStyle: isOpt && !ok ? "dashed" : "solid", width: "100%", textAlign: "left", cursor: ok ? "default" : "pointer" }}>
                <input type="file" ref={(el) => { docFileRefs.current[i] = el; }} style={{ display: "none" }} onChange={(e) => onDocFile(i, e)} />
                <Group wrap="nowrap" gap={10} align="flex-start">
                  {ok ? <IconFileText size={16} color="var(--mantine-color-green-7)" /> : <IconUpload size={16} color="var(--mantine-color-gray-5)" />}
                  <Box style={{ minWidth: 0 }}>
                    <Text fz={12} fw={600} c={ok ? "green.9" : "dark.8"} truncate>{d.name}</Text>
                    <Text fz={10.5} c={ok ? "green.7" : "dimmed"}>{ok ? `Verified · ${d.uploadedDate || "today"}` : (isOpt ? "Optional - click to attach" : "Required - click to attach")}</Text>
                  </Box>
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
            
            <TextInput size="xs" radius="md" label="Registration details" value="RTSA · first registered 14 Mar 2019" mb={6} readOnly />
            
            <Paper p={5} px={10} radius="md" bg="indigo.0" mb={10}>
              <Group wrap="nowrap" gap={8} align="center">
                <IconInfoCircle size={14} color="var(--mantine-color-indigo-6)" style={{ flexShrink: 0 }} />
                <Text fz={11} c="indigo.9">Read from the title deed above — correct it only where the document differs.</Text>
              </Group>
            </Paper>

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
                    
                    {isExc && (
                      <Textarea 
                        mt={6}
                        size="xs" 
                        radius="md" 
                        minRows={2}
                        placeholder="What was found, and what's required to resolve it..." 
                        styles={{ 
                          input: { 
                            borderColor: "var(--mantine-color-gray-4)",
                            color: "var(--mantine-color-red-5)"
                          } 
                        }} 
                        value={c.comment} 
                        onChange={(e) => onUpdateLegalCheck(c.id, { comment: e.currentTarget.value })}
                      />
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Group>
      </Box>
    );
  }

  // ---------------------------------------------------------- Conclusion
  const amount = Number(asset.valuation.amount) || 0;
  const coverage = finalAmount ? Math.round((amount / finalAmount) * 100) : null;

  const valuationOk = asset.status === "Passed";
  const legalFlagged = asset.legalChecks.filter((c) => ["Failed", "Exception"].includes(c.status)).length;
  const titleOpen = asset.titleChecklist.filter((t) => ["Pending", "In Progress"].includes(t.status) || (["Failed", "Exception"].includes(t.status) && !t.comment.trim()));
  const allDocs = [...asset.docs, ...asset.titleDocs];
  const required = allDocs.filter((d) => d.tier === "required");
  const missing = [...missingRequiredDocs(asset.docs), ...missingRequiredDocs(asset.titleDocs)];
  const canAccept = valuationOk && missing.length === 0;

  const d = asset.assetDecision;
  const conds = asset.assetConditions;
  const options: { id: Decision; label: string; color: string; disabled?: boolean }[] = [
    { id: "approve", label: "Accept as security", color: "green", disabled: !canAccept },
    { id: "conditions", label: "Accept with conditions", color: "orange" },
    { id: "reject", label: "Do not accept", color: "red" },
  ];

  return (
    <Box px={14} pt={10} pb={8}>
      <SimpleGrid cols={3} spacing={10} mb={12}>
        <StatCard
          label="Valuation"
          color={valuationOk ? "green" : "orange"}
          value={valuationOk ? `Recorded — ${zmw(amount)}` : asset.status === "Exception" ? "Exception raised" : "Not confirmed"}
          sub={coverage != null ? `${coverage}% coverage` : asset.valuationDate ? `dated ${asset.valuationDate}` : "No valuation date"}
        />
        <StatCard
          label="Legal"
          color={legalFlagged || titleOpen.length ? "orange" : "green"}
          value={legalFlagged ? `${legalFlagged} exception/failed` : titleOpen.length ? `${titleOpen.length} title item(s) open` : "Clear"}
          sub={`${asset.legalChecks.filter((c) => c.status === "Passed").length}/${asset.legalChecks.length} checks passed`}
        />
        <StatCard
          label="Documents"
          color={missing.length ? "red" : "green"}
          value={`${required.length - missing.length} of ${required.length} required`}
          sub={missing.length ? `Missing: ${missing.map((m) => m.name).join(", ")}` : "All verified"}
        />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md" bg="gray.0" mb={12}>
        <Text ta="center" fz={16} fw={600} c="dark.9">Accept this asset as security?</Text>
        <Text ta="center" fz={12.5} c="dimmed" mb={10}>This records the outcome for this asset only. The credit decision is taken once on the assets list.</Text>
        <Group justify="center" gap={10}>
          {options.map((o) => (
            <Tooltip key={String(o.id)} label="Confirm the valuation and verify all required documents first" disabled={!o.disabled} withArrow>
              <Button color={o.color} radius="md" variant={d === o.id ? "filled" : "default"} disabled={o.disabled} onClick={() => onUpdate({ assetDecision: o.id })}>
                {o.label}
              </Button>
            </Tooltip>
          ))}
        </Group>
      </Paper>

      <Group align="flex-start" wrap="nowrap" gap={16}>
        <Box style={{ flex: 1 }}>
          <TextInput size="xs" radius="md" label="Agreed security value" value={zmw(amount)} readOnly description="Carried from Valuation." mb={8} />
          {d === "conditions" && (
            <Box>
              <Text fz={12} fw={500} mb={6}>Conditions</Text>
              {conds.map((c, i) => (
                <Group key={i} gap={8} mb={6} wrap="nowrap" align="flex-end">
                  <TextInput size="xs" radius="md" style={{ flex: 2 }} placeholder="e.g. Produce discharge of existing charge" value={c.condition} onChange={(e) => onUpdate({ assetConditions: conds.map((x, j) => (j === i ? { ...x, condition: e.currentTarget.value } : x)) })} />
                  <Select size="xs" radius="md" style={{ flex: 1 }} data={["Customer", "Internal", "Legal"]} value={c.responsible} allowDeselect={false} onChange={(v) => onUpdate({ assetConditions: conds.map((x, j) => (j === i ? { ...x, responsible: v || x.responsible } : x)) })} />
                  <ActionIcon variant="default" onClick={() => onUpdate({ assetConditions: conds.filter((_, j) => j !== i) })}><IconX size={14} /></ActionIcon>
                </Group>
              ))}
              <Button size="compact-xs" variant="light" radius="md" onClick={() => onUpdate({ assetConditions: [...conds, { condition: "", responsible: "Customer", dueBefore: "Disbursement" }] })}>+ Add condition</Button>
            </Box>
          )}
          {d === "reject" && (
            <Select size="xs" radius="md" label="Reason" data={REJECT_REASONS} value={asset.assetReasonCategory || null} onChange={(v) => onUpdate({ assetReasonCategory: v || "" })} error={asset.assetReasonCategory ? undefined : "Select a reason"} />
          )}
        </Box>
        <Box style={{ flex: 1 }}>
          <Textarea size="xs" radius="md" minRows={2} label="Remarks on this asset" placeholder="Why this asset is being accepted on these terms…" value={asset.assetRemarks} onChange={(e) => onUpdate({ assetRemarks: e.currentTarget.value })} />
        </Box>
      </Group>
    </Box>
  );
}