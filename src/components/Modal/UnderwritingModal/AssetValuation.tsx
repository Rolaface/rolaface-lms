import { useRef, useState } from "react";
import {
  Box, Group, Text, SimpleGrid, Paper, TextInput, NumberInput, Select, Checkbox, Textarea, Badge, Button,
  ActionIcon, ThemeIcon, UnstyledButton, Tooltip, Stack, Modal, Image
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconAlertTriangle, IconUpload, IconFileText, IconCircleCheck, IconCircleX, IconLock, IconX, IconPlus, IconTrash,
} from "@tabler/icons-react";
import { DUMMY_ASSET_TYPES } from "../PreScreeningModal/Dummyloanapplicationdata";
// Types only — erased at build time, so this file has no *runtime* dependency
// on UnderwritingModal.tsx. That keeps the import graph one-directional
// (UnderwritingModal -> LegalVerification -> AssetValuation) instead of
// circular, which is what caused "does not provide an export" at runtime.
import type { Asset, PanelId, AssetDoc } from "./UnderwritingModal";

// ---------------------------------------------------------------------------
// Shared bits used across all three files. Defined here (the file nothing
// else depends on) and re-exported by whoever needs them.
// ---------------------------------------------------------------------------

export const zmw = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : "ZMW " + Math.round(Number(n)).toLocaleString();

export const STATUS_COLORS: Record<string, string> = {
  Pending: "gray", "In Progress": "brand", Passed: "green", Failed: "red", Exception: "orange",
  Missing: "gray", Uploaded: "brand", Verified: "green", Rejected: "red",
};

export function requiredDocsVerified(docs: AssetDoc[]): boolean {
  return docs.filter((d) => d.tier === "required").every((d) => d.status === "Verified");
}
export function missingRequiredDocs(docs: AssetDoc[]): AssetDoc[] {
  return docs.filter((d) => d.tier === "required" && d.status !== "Verified");
}

export const DECISION_LABEL: Record<string, string> = {
  approve: "Approve / Proceed", conditions: "Approve with Conditions", refer: "Refer / Further Revision", reject: "Reject",
};
export const REJECT_REASONS = ["Insufficient collateral", "Ownership issue", "Legal risk", "Invalid documentation", "Unresolved exception", "Valuation issue", "Other"];

// Converts a stored date string (e.g. "YYYY-MM-DD") into a Date object for
// DateInput's `value` prop. Returns null for empty/invalid values.
function toDateObj(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function SectionLabel({ children, color = "dark.6", icon: Icon }: { children: React.ReactNode; color?: string; icon?: React.FC<any> }) {
  return (
    <Group gap={6} align="center" wrap="nowrap">
      {Icon && <Icon size={16} stroke={2.5} />}
      <Text fz={11.5} fw={700} c={color} tt="uppercase" style={{ letterSpacing: 0.5 }}>{children}</Text>
    </Group>
  );
}

export function ValidityNote({ date, days }: { date: string; days: number }) {
  if (!date) return null;
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + days);
  const left = Math.round((expiry.getTime() - Date.now()) / 86400000);
  const expired = left < 0;
  
  const formattedExpiry = expiry.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  
  return (
    <Badge 
      color={expired ? "red" : "green"} 
      variant="light" 
      size="lg" 
      radius="xl"
      leftSection={expired ? <IconCircleX size={14} /> : <IconCircleCheck size={14} />}
      style={{ textTransform: 'none', fontWeight: 600, marginTop: 10 }}
    >
      {expired ? `Expired on ${formattedExpiry}` : `Valid until ${formattedExpiry} · ${left} days left`}
    </Badge>
  );
}

export function CompactCheckRow({ label, checked, exception, note, onToggle, onFlag, onNoteChange, disabled, disabledReason }: {
  label: string; checked: boolean; exception: boolean; note: string; onToggle: () => void; onFlag: () => void;
  onNoteChange: (v: string) => void; disabled?: boolean; disabledReason?: string;
}) {
  return (
    <Box py={5} style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}>
      <Group gap={8} wrap="nowrap" align="center">
        <Tooltip label={disabledReason} disabled={!disabled} withArrow>
          <Checkbox checked={checked} disabled={exception || disabled} onChange={onToggle} size="xs" />
        </Tooltip>
        <Text fz={12.5} c={exception ? "orange.8" : disabled ? "gray.5" : "dark.6"} style={{ flex: 1 }}>{label}</Text>
        {disabled && !checked && <IconLock size={12} color="var(--mantine-color-gray-4)" />}
        <ActionIcon variant="subtle" color={exception ? "orange" : "gray"} size="sm" onClick={onFlag} title="Flag as exception">
          <IconAlertTriangle size={14} />
        </ActionIcon>
      </Group>
      {exception && (
        <TextInput value={note} onChange={(e) => onNoteChange(e.currentTarget.value)} placeholder="What was found, and what's required to resolve it…" size="xs" radius="md" mt={5} error={!note} />
      )}
    </Box>
  );
}

export function DocumentsTable({ title, docs, setDocs }: { title?: string; docs: AssetDoc[]; setDocs: (d: AssetDoc[]) => void }) {
  const refs = useRef<Record<number, HTMLInputElement | null>>({});
  const update = (i: number, patch: Partial<AssetDoc>) => setDocs(docs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const onFile = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    update(i, {
      status: "Uploaded", fileMeta: `${f.name} (${(f.size / 1048576).toFixed(1)} MB)`, uploadedBy: "You",
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });
    e.target.value = "";
  };

  return (
    <Box>
      <Stack gap={8}>
        {docs.map((d, i) => {
          if (!d.fileMeta) return null; // Only show already uploaded documents
          
          return (
            <Paper key={i} withBorder radius="md" p="sm" bg="white">
              <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap" gap={12} style={{ flex: 1 }}>
                  <ThemeIcon radius="md" size={38} variant="light" color="indigo">
                    <IconFileText size={20} />
                  </ThemeIcon>
                  <Box>
                    <TextInput
                      value={d.name}
                      onChange={(e) => update(i, { name: e.currentTarget.value })}
                      variant="unstyled"
                      placeholder="Document name"
                      styles={{ input: { fontWeight: 600, fontSize: 13.5, color: "var(--mantine-color-dark-8)", height: 20, minHeight: 20, padding: 0, border: "none", background: "transparent" } }}
                    />
                    <Text fz={12} c="dimmed">
                      {d.fileMeta} · uploaded {d.uploadedDate || 'recently'}
                    </Text>
                  </Box>
                </Group>

                <input type="file" ref={(el) => { refs.current[i] = el; }} style={{ display: "none" }} onChange={(e) => onFile(i, e)} />
                
                <Group gap={8}>
                  <Button variant="subtle" color="indigo" size="compact-sm" radius="xl" fw={600}>View</Button>
                  <Button variant="default" size="compact-sm" radius="xl" onClick={() => refs.current[i]?.click()}>
                    Replace
                  </Button>
                  <ActionIcon variant="subtle" color="red" size="md" radius="xl" onClick={() => setDocs(docs.filter((_, x) => x !== i))}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

export function DecisionButton({ label, caption, color, icon: Icon, disabled, onClick }: {
  label: string; caption?: string; color: string; icon: React.FC<any>; disabled?: boolean; onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick} disabled={disabled} p={14}
      style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-gray-3)", background: "white", textAlign: "left", opacity: disabled ? 0.55 : 1 }}
    >
      <Group gap={12} wrap="nowrap">
        <ThemeIcon radius="md" size={32} variant="light" color={color}><Icon size={18} /></ThemeIcon>
        <Box>
          <Text fz={13} fw={600} c="dark.8">{label}</Text>
          {caption && <Text fz={11} c="dimmed" mt={2} lh={1.2}>{caption}</Text>}
        </Box>
      </Group>
    </UnstyledButton>
  );
}

export function DocumentPreviewModal({ opened, onClose, doc }: { opened: boolean; onClose: () => void; doc?: AssetDoc }) {
  const url = doc?.fileUrl;
  const isImage = !!doc?.fileType?.startsWith("image/");
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="80%"
      radius="md"
      centered
      zIndex={400}
      title={
        <Group gap={8} wrap="nowrap">
          <IconFileText size={18} color="var(--mantine-color-indigo-6)" />
          <Box>
            <Text fz={14} fw={700} c="dark.9">{doc?.name || "Document"}</Text>
            {doc?.fileMeta && <Text fz={11.5} c="dimmed">{doc.fileMeta} · uploaded by {doc.uploadedBy || "You"}{doc.uploadedDate ? `, ${doc.uploadedDate}` : ""}</Text>}
          </Box>
        </Group>
      }
    >
      <Box h="75vh" style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: "var(--mantine-radius-md)", overflow: "hidden", background: "var(--mantine-color-gray-0)" }}>
        {!url ? (
          <Stack h="100%" align="center" justify="center" gap={6}>
            <ThemeIcon variant="light" color="gray" size={40} radius="xl"><IconFileText size={20} /></ThemeIcon>
            <Text fz={13} c="dimmed">No preview available for this document.</Text>
          </Stack>
        ) : isImage ? (
          <Image src={url} alt={doc?.name} h="100%" fit="contain" />
        ) : (
          <iframe src={url} title={doc?.name || "Document preview"} style={{ width: "100%", height: "100%", border: 0 }} />
        )}
      </Box>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Asset step + Valuation step
// ---------------------------------------------------------------------------

const REPORT = "Valuation report";

export function AssetValuation({
  asset,
  panel,
  notes,
  setNotes,
  onUpdate,
}: {
  asset: Asset;
  finalAmount: number;
  panel: PanelId;
  notes: string;
  setNotes: (v: string) => void;
  onUpdate: (patch: Partial<Asset>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const reportDoc = asset.docs[0];
  const hasReport = !!reportDoc?.fileMeta;
  
  const onDropzoneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const meta = `${(f.size / 1048576).toFixed(1)} MB`;
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    
    if (reportDoc?.fileUrl) URL.revokeObjectURL(reportDoc.fileUrl);
    onUpdate({ docs: [{ name: f.name.split('.')[0], tier: "optional", status: "Uploaded", fileMeta: meta, uploadedDate: date, uploadedBy: "You", validUntil: "", comment: "", fileUrl: URL.createObjectURL(f), fileType: f.type }] });
    
    if (e.target) e.target.value = "";
  };
  const confirmed = asset.status === "Passed";
  const locked = confirmed;

  const v = asset.valuation;

  const setV = (patch: Partial<Asset["valuation"]>) => onUpdate({ valuation: { ...v, ...patch } });

  // ------------------------------------------------------------------ Asset
  if (panel === "assetDetails") {
    const setBase = (p: Partial<Asset["base"]>) => onUpdate({ base: { ...asset.base, ...p } });
    return (
      <Box px={14} pt={10} pb={8}>
        <Group gap={8} mb={8}>
          <SectionLabel>Asset details</SectionLabel>
          <Badge variant="light" color="gray" size="sm" tt="none">
            {asset.source === "application" ? "Carried from the loan application" : "Added manually"}
          </Badge>
        </Group>
        <SimpleGrid cols={3} spacing={12} mb={12}>
          <Select
            size="xs"
            label="Asset type"
            data={DUMMY_ASSET_TYPES}
            value={asset.base.type}
            onChange={(x) => {
              if (!x) return;
              // Different asset types share the same underlying fields
              // (description / acquisition / location / titleNumber), so
              // switching type must clear them — otherwise the previous
              // type's data leaks into the new type's labels.
              onUpdate({
                base: { ...asset.base, type: x, description: "", acquisition: "", location: "" },
                title: { ...asset.title, titleNumber: "" },
              });
            }}
            allowDeselect={false}
            radius="md"
          />
          <TextInput size="xs" label="Asset ID" value={asset.base.assetId || ""} onChange={(e) => setBase({ assetId: e.currentTarget.value })} placeholder="e.g. AST-33022" radius="md" />
          
          {asset.base.type === "Motor vehicle" && (
            <>
              <TextInput size="xs" label="Registered owner" value={asset.title.registeredOwner} onChange={(e) => onUpdate({ title: { ...asset.title, registeredOwner: e.currentTarget.value } })} radius="md" />
              <TextInput size="xs" label="Registration details" value={asset.base.description || ""} onChange={(e) => setBase({ description: e.currentTarget.value })} placeholder="e.g. 2019 Toyota Hilux D/Cab" radius="md" error={asset.base.description?.trim() ? undefined : "Required"} />
              <TextInput size="xs" label="Acquisition" value={asset.base.acquisition || ""} onChange={(e) => setBase({ acquisition: e.currentTarget.value })} placeholder="Purchased 2019 · dealer invoice on file" radius="md" />
            </>
          )}

          {asset.base.type === "Landed property" && (
            <>
              <TextInput size="xs" label="Registered owner" value={asset.title.registeredOwner} onChange={(e) => onUpdate({ title: { ...asset.title, registeredOwner: e.currentTarget.value } })} radius="md" />
              <Box style={{ gridColumn: "1 / span 2" }}>
                <TextInput size="xs" label="Location / Address" value={asset.base.location || ""} onChange={(e) => setBase({ location: e.currentTarget.value })} placeholder="e.g. Plot 1234, Lusaka" radius="md" error={asset.base.location?.trim() ? undefined : "Required"} />
              </Box>
              <Box style={{ gridColumn: "1 / -1" }}>
                <SimpleGrid cols={2} spacing={12}>
                  <TextInput size="xs" label="Title number" value={asset.title.titleNumber || ""} onChange={(e) => onUpdate({ title: { ...asset.title, titleNumber: e.currentTarget.value } })} radius="md" />
                  <TextInput size="xs" label="Acquisition" value={asset.base.acquisition || ""} onChange={(e) => setBase({ acquisition: e.currentTarget.value })} radius="md" />
                </SimpleGrid>
              </Box>
            </>
          )}

          {asset.base.type === "Equipment" && (
            <>
              <TextInput size="xs" label="Manufacturer / Brand" value={asset.title.registeredOwner} onChange={(e) => onUpdate({ title: { ...asset.title, registeredOwner: e.currentTarget.value } })} radius="md" />
              <Box style={{ gridColumn: "1 / -1" }}>
                <SimpleGrid cols={2} spacing={12}>
                  <TextInput size="xs" label="Equipment details" value={asset.base.description || ""} onChange={(e) => setBase({ description: e.currentTarget.value })} placeholder="Model, Serial number, etc." radius="md" error={asset.base.description?.trim() ? undefined : "Required"} />
                  <TextInput size="xs" label="Location" value={asset.base.location || ""} onChange={(e) => setBase({ location: e.currentTarget.value })} radius="md" />
                </SimpleGrid>
              </Box>
              <TextInput size="xs" label="Acquisition" value={asset.base.acquisition || ""} onChange={(e) => setBase({ acquisition: e.currentTarget.value })} radius="md" />
            </>
          )}

          {asset.base.type === "Fixed deposit" && (
            <>
              <TextInput size="xs" label="Account name" value={asset.title.registeredOwner} onChange={(e) => onUpdate({ title: { ...asset.title, registeredOwner: e.currentTarget.value } })} radius="md" />
              <Box style={{ gridColumn: "1 / -1" }}>
                <SimpleGrid cols={3} spacing={12}>
                  <Box style={{ gridColumn: "1 / span 2" }}>
                    <TextInput size="xs" label="Bank & Account details" value={asset.base.description || ""} onChange={(e) => setBase({ description: e.currentTarget.value })} placeholder="Bank name, Account number" radius="md" error={asset.base.description?.trim() ? undefined : "Required"} />
                  </Box>
                  <DateInput
                    size="xs"
                    label="Maturity date"
                    valueFormat="DD-MMM-YYYY"
                    placeholder="DD-MMM-YYYY"
                    value={toDateObj(asset.base.acquisition)}
                    onChange={(d) => setBase({ acquisition: d ? d.toISOString().slice(0, 10) : "" })}
                    radius="md"
                  />
                </SimpleGrid>
              </Box>
            </>
          )}

          {asset.base.type === "Other" && (
            <>
              <TextInput size="xs" label="Registered owner" value={asset.title.registeredOwner} onChange={(e) => onUpdate({ title: { ...asset.title, registeredOwner: e.currentTarget.value } })} radius="md" />
              <Box style={{ gridColumn: "1 / -1" }}>
                <SimpleGrid cols={2} spacing={12}>
                  <TextInput size="xs" label="Description" value={asset.base.description || ""} onChange={(e) => setBase({ description: e.currentTarget.value })} radius="md" error={asset.base.description?.trim() ? undefined : "Required"} />
                  <TextInput size="xs" label="Location" value={asset.base.location || ""} onChange={(e) => setBase({ location: e.currentTarget.value })} radius="md" />
                </SimpleGrid>
              </Box>
            </>
          )}
        </SimpleGrid>


      </Box>
    );
  }

  // -------------------------------------------------------------- Valuation
  return (
    <Box px={14} pt={10} pb={8}>
      <Group align="stretch" wrap="nowrap" gap={20}>
        
        {/* LEFT COLUMN: Document & Summary */}
        <Box style={{ flex: 0.9, minWidth: 0 }}>
          <Group justify="space-between" mb={8}>
            <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase">Valuation Report</Text>
            {hasReport && (
              <Group gap={8}>
                <Button variant="default" size="compact-xs" radius="xl" onClick={() => setPreviewOpen(true)}>Open full</Button>
                <Button variant="default" size="compact-xs" radius="xl" onClick={() => fileRef.current?.click()}>Replace</Button>
              </Group>
            )}
          </Group>
          
          <input type="file" ref={fileRef} accept=".pdf,.jpg,.png" style={{ display: "none" }} onChange={onDropzoneUpload} />
          <DocumentPreviewModal opened={previewOpen} onClose={() => setPreviewOpen(false)} doc={reportDoc} />

          {!hasReport ? (
            <Box mb={14}>
              <UnstyledButton
                w="100%"
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "1.5px dashed var(--mantine-color-indigo-3)",
                  borderRadius: "var(--mantine-radius-md)",
                  padding: "16px 16px",
                  backgroundColor: "var(--mantine-color-indigo-0)",
                  textAlign: "center",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--mantine-color-indigo-1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--mantine-color-indigo-0)"}
              >
                <Group justify="center" align="center" gap={8} style={{ flexDirection: "column" }}>
                  <ThemeIcon variant="light" size={36} radius="xl" color="indigo"><IconUpload size={18} /></ThemeIcon>
                  <Box>
                    <Text fz={14} fw={700} c="dark.9">Upload the valuation report</Text>
                    <Text fz={12} c="dimmed" mt={4}>Market value, forced sale value, the valuation date and the valuer's details are all read off this report. Attach it first.</Text>
                  </Box>
                  <Button radius="xl" color="indigo" size="xs" style={{ pointerEvents: "none" }}>Choose file</Button>
                  <Text fz={11} c="dimmed">PDF, JPG or PNG · up to 20 MB</Text>
                </Group>
              </UnstyledButton>
            </Box>
          ) : (
            <Box mb={14}>
              <Paper withBorder radius="md" p={8} bg="indigo.0" style={{ borderColor: 'var(--mantine-color-indigo-2)', minWidth: 0 }} mb={10}>
                <Group wrap="nowrap" gap={8} style={{ minWidth: 0 }}>
                  <IconFileText size={16} color="var(--mantine-color-indigo-6)" style={{ flexShrink: 0 }} />
                  <Text fz={12.5} fw={600} c="indigo.9" truncate style={{ flexShrink: 0, maxWidth: "55%" }}>{reportDoc?.name || "Report"}.pdf</Text>
                  <Text fz={12} c="indigo.7" truncate style={{ flex: 1, minWidth: 0 }}>{reportDoc?.fileMeta || ""} · uploaded by {reportDoc?.uploadedBy || "You"}, {reportDoc?.uploadedDate}</Text>
                </Group>
              </Paper>

              <Box
                p={10}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  background: "white",
                  border: "1px solid var(--mantine-color-gray-3)",
                  overflow: "hidden",
                }}
              >
                <Box
                  p={8}
                  mx={-10}
                  mt={-10}
                  mb={8}
                  style={{
                    background: "linear-gradient(180deg, #4338CA 0%, #3730A3 100%)",
                    borderRadius: "var(--mantine-radius-md) var(--mantine-radius-md) 0 0",
                  }}
                >
                  <Text fz={13} fw={700} c="white">Valuation Report Summary</Text>
                </Box>
                
                <Box mb={8}>
                  <Group justify="space-between" py={4} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                    <Text fz={12} c="slate.5">Open market value</Text>
                    <Text fz={12} fw={600} c="slate.9">{v.marketValue ? `ZMW ${Number(v.marketValue).toLocaleString()}` : "—"}</Text>
                  </Group>
                  <Group justify="space-between" py={4} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                    <Text fz={12} c="slate.5">Forced sale value</Text>
                    <Text fz={12} fw={600} c="slate.9">{v.forcedSaleValue ? `ZMW ${Number(v.forcedSaleValue).toLocaleString()}` : "—"}</Text>
                  </Group>
                  <Group justify="space-between" py={4} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                    <Text fz={12} c="slate.5">Date of inspection</Text>
                    <Text fz={12} fw={600} c="slate.9">{asset.valuationDate ? new Date(asset.valuationDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Text>
                  </Group>
                  <Group justify="space-between" py={4} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                    <Text fz={12} c="slate.5">Valuer details</Text>
                    <Text fz={12} fw={600} c="slate.9" ta="right" maw={200} truncate>{asset.valuer?.name ? `${asset.valuer.name} ${asset.valuer.company ? `(${asset.valuer.company})` : ""}` : "—"}</Text>
                  </Group>
                  <Group justify="space-between" py={5} bg="slate.0" px={8} mt={8} style={{ borderRadius: "var(--mantine-radius-sm)" }}>
                    <Text fz={12.5} fw={700} c="slate.9">Valuation Amount</Text>
                    <Text fz={12.5} fw={700} c="brand.7">{v.valuationAmount ? `ZMW ${Number(v.valuationAmount).toLocaleString()}` : "—"}</Text>
                  </Group>
                </Box>
              </Box>
              
            </Box>
          )}
        </Box>

        {/* RIGHT COLUMN: Inputs */}
        <Box style={{ flex: 1.4, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Group justify="space-between" mb={8}>
            <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase">Asset Valuation</Text>
            {confirmed && <Badge variant="light" color="green" size="sm" leftSection={<IconCircleCheck size={10} />}>Confirmed</Badge>}
          </Group>

          <SimpleGrid cols={2} spacing={10} mb={10}>
            <NumberInput size="xs" label="Valuation amount" prefix="ZMW " thousandSeparator="," hideControls disabled={locked} value={v.valuationAmount === "" ? "" : Number(v.valuationAmount)} onChange={(x) => setV({ valuationAmount: String(x ?? "") })} radius="md" placeholder="e.g. 95000" />
            <Select size="xs" label="Valuation method" disabled={locked} value={v.method} onChange={(x) => setV({ method: x || v.method })} data={["Market comparison", "Cost approach", "Income approach"]} allowDeselect={false} radius="md" />
            <NumberInput size="xs" label="Market value" prefix="ZMW " thousandSeparator="," hideControls disabled={locked} value={v.marketValue === "" ? "" : Number(v.marketValue)} onChange={(x) => setV({ marketValue: String(x ?? "") })} radius="md" placeholder="e.g. 98000" />
            <NumberInput size="xs" label="Forced sale value" prefix="ZMW " thousandSeparator="," hideControls disabled={locked} value={v.forcedSaleValue === "" ? "" : Number(v.forcedSaleValue)} onChange={(x) => setV({ forcedSaleValue: String(x ?? "") })} radius="md" placeholder="e.g. 76000" />
          </SimpleGrid>

          <Text fz={11.5} fw={700} c="indigo.9" tt="uppercase" mb={6}>
            Valuer details
          </Text>
          <SimpleGrid cols={2} spacing={10} mb={10}>
            <TextInput size="xs" label="Valuer name" disabled={locked} value={asset.valuer.name} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, name: e.currentTarget.value } })} radius="md" placeholder="e.g. K. Zulu" />
            <TextInput size="xs" label="Valuer / company" disabled={locked} value={asset.valuer.company} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, company: e.currentTarget.value } })} radius="md" placeholder="e.g. Apex Valuers Ltd" />
            <TextInput size="xs" label="License number" disabled={locked} value={asset.valuer.license} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, license: e.currentTarget.value } })} radius="md" placeholder="e.g. VAL-2321" />
            <TextInput size="xs" label="Contact" disabled={locked} value={asset.valuer.contact} onChange={(e) => onUpdate({ valuer: { ...asset.valuer, contact: e.currentTarget.value } })} radius="md" placeholder="Phone or email" />
            <TextInput size="xs" type="date" label="Valuation date" disabled={locked} value={asset.valuationDate} onChange={(e) => onUpdate({ valuationDate: e.currentTarget.value })} radius="md" />
          </SimpleGrid>

        </Box>
      </Group>
    </Box>
  );
}