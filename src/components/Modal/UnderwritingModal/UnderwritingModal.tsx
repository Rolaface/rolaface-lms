import { LegalVerification } from "./LegalVerification";
import { AssetValuation, zmw, STATUS_COLORS, DECISION_LABEL, REJECT_REASONS, requiredDocsVerified, missingRequiredDocs, DecisionButton, SectionLabel } from "./AssetValuation";
import { useEffect, useMemo, useState } from "react";
import {
  Modal, Box, Group, Text, Badge, ThemeIcon, UnstyledButton, Stack, SimpleGrid, Paper, TextInput, Select,
  Checkbox, Textarea, Button, ActionIcon, Avatar, Divider, Tooltip,
} from "@mantine/core";
import {
  IconBell, IconChevronDown, IconChevronLeft, IconChevronRight, IconFileText, IconGauge, IconBuildingBank, IconScale,
  IconShieldCheck, IconCar, IconIdBadge2, IconCheck, IconX, IconPlus, IconInfoCircle,
  IconAlertTriangle, IconCircleCheck, IconCircleX, IconArrowRight, IconMinus, IconTrash, IconUpload, IconLock,
  IconCertificate,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import { PreScreeningModal } from "../PreScreeningModal/PreScreeningModal";
import { LeftNav, ContextHeader } from "../PreScreeningModal/PreScreeningShared";
import { EnrichmentModal } from "../Enrichment/EnrichmentModal";
import { DUMMY_ASSET_TYPES, getApplicableChecks, type DummyAssetBase } from "../PreScreeningModal/Dummyloanapplicationdata";
import type { ApplicationCollateral, LoanApplication, StagePayload } from "../../../api/LosConfiguration/LoanApplicationApi";
import { StageLoading, uploadStageFile, useStageApplication } from "../stageData";

interface UnderwritingModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  embedded?: boolean; tab?: any; onTabChange?: (t: any) => void;
  readOnly?: boolean;
  loanApplicationId?: string | null;
  application?: LoanApplication;
}

export interface UnderwritingResult {
  ready: boolean;
  buildPayload: (submit: boolean) => Promise<StagePayload>;
}

export function ReadRow({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <Box style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <Text fz={11} c="gray.6" mb={3} fw={500}>{label}</Text>
      <Text fz={14} fw={600} c="dark.8">{value ?? "—"}</Text>
    </Box>
  );
}

export function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box>
      <Text fz={11} c="dimmed">{label}</Text>
      <Text fz={16} fw={700} c={accent ? "orange.7" : "dark.7"}>{value}</Text>
    </Box>
  );
}

function SimRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <Group justify="space-between" py={6} style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-gray-1)" }}>
      <Text fz={12.5} c="dimmed">{label}</Text>
      <Text fz={12.5} fw={600} c="dark.8">{value}</Text>
    </Group>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge size="sm" radius="xl" color={STATUS_COLORS[status] || "gray"} variant="light">{status}</Badge>;
}

// ---------------------------------------------------------------------------
// Types & the single merged flow: Asset -> Valuation -> Legal
// ---------------------------------------------------------------------------

type Section = "application" | "prescreening" | "appraisal" | "underwriting";
export type PanelId = "assetDetails" | "documents" | "valuation" | "assetDocs" | "legal" | "legalDocs" | "notes" | "assetConclusion";

export const PANEL_ITEMS: { id: PanelId; label: string; icon: React.FC<any> }[] = [
  { id: "assetDetails", label: "Asset", icon: IconIdBadge2 },
  { id: "valuation", label: "Valuation", icon: IconCar },
  { id: "legal", label: "Legal", icon: IconShieldCheck },
];
const STEPS = PANEL_ITEMS.map((p) => p.id);

// The Underwriting sidebar item expands into two sub-tabs. Both browse the
// same asset list and the same 4-step stepper — they only differ in which
// step an asset opens on, so opening from "Legal Verification" drops the
// reviewer straight into the Legal step instead of Asset details.
export type TabId = "asset" | "legal";
export const TAB_ITEMS: { id: TabId; label: string; icon: React.FC<any>; entryStep: PanelId }[] = [
  { id: "asset", label: "Asset Valuation", icon: IconCircleCheck, entryStep: "assetDetails" },
  { id: "legal", label: "Legal Verification", icon: IconShieldCheck, entryStep: "legal" },
];

export interface AssetDoc {
  name: string; tier: "required" | "optional"; status: string; uploadedDate: string; uploadedBy: string;
  validUntil: string; fileMeta: string; comment: string;
  fileUrl?: string; fileType?: string; file?: File;
}
export interface TitleChecklistItem { id: string; label: string; status: string; comment: string }
export interface LegalCheck { id: string; name: string; status: string; finding: string; why: string; action: string; comment: string }
export type Decision = "approve" | "conditions" | "refer" | "reject" | null;
export interface Condition { condition: string; responsible: string; dueBefore: string }

export interface Asset {
  id: string;
  rowId?: string;
  securityType: string | null;
  estimatedValue: number | "";
  ownershipDate?: string | null;
  source: "application" | "manual";
  base: DummyAssetBase;
  valuation: { valuationAmount: string; currency: string; method: string; marketValue: string; forcedSaleValue: string; notes: string };
  valuer: { name: string; company: string; license: string; contact: string; verified: boolean };
  valuationDate: string;
  expiryDays: number;
  status: string;
  reason: string;
  docs: AssetDoc[];
  title: { titleNumber: string; propertyRef: string; propertyType: string; location: string; registrationInfo: string; registeredOwner: string };
  legalVerifier: { name: string; company: string; role: string; license: string; contact: string };
  titleChecklist: TitleChecklistItem[];
  titleDocs: AssetDoc[];
  legalChecks: LegalCheck[];
  legalRemarks: string;
  assetOverallAssessment: string;
  assetRemarks: string;
  assetAssignee: string;
  assetDecisionStatus: string;
}

const emptyDoc = (name: string, tier: "required" | "optional"): AssetDoc => ({ name, tier, status: "Missing", uploadedDate: "", uploadedBy: "", validUntil: "", fileMeta: "", comment: "" });

// Local YYYY-MM-DD (toISOString would shift the day across the UTC boundary).
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

let assetSeq = 1;
function makeAsset(source: "application" | "manual", base: DummyAssetBase): Asset {
  return {
    id: "asset-" + assetSeq++, source, base, securityType: null, estimatedValue: "", ownershipDate: null,
    valuation: { valuationAmount: "", currency: "ZMW", method: "Market comparison", marketValue: "", forcedSaleValue: "", notes: "" },
    valuer: { name: "", company: "", license: "", contact: "", verified: false },
    valuationDate: todayISO(), expiryDays: 180, status: "Pending", reason: "",
    docs: [emptyDoc("Valuation report", "required")],
    title: { titleNumber: "", propertyRef: base?.assetId || "", propertyType: base?.type || "", location: base?.location || "", registrationInfo: "", registeredOwner: base?.owner || "" },
    legalVerifier: { name: "", company: "", role: "", license: "", contact: "" },
    titleChecklist: [
      { id: "titleVerified", label: "Title verified", status: "Pending", comment: "" },
      { id: "ownershipVerified", label: "Ownership verified", status: "Pending", comment: "" },
      { id: "encumbrances", label: "Encumbrances checked", status: "Pending", comment: "" },
      { id: "liens", label: "Existing liens checked", status: "Pending", comment: "" },
      { id: "restrictions", label: "Restrictions checked", status: "Pending", comment: "" },
    ],
    titleDocs: [emptyDoc("Title deed / ownership document", "required"), emptyDoc("Search report", "required"), emptyDoc("Legal opinion", "optional")],
    legalChecks: (getApplicableChecks(base?.type || "") || []).map((c) => ({
      id: c?.id ?? Math.random().toString(36).slice(2), name: c?.name ?? "Legal check", status: "Pending",
      finding: c?.finding ?? "", why: c?.why || "", action: c?.action || "", comment: "",
    })),
    legalRemarks: "",
    assetOverallAssessment: "Review Required", assetRemarks: "", assetAssignee: "Internal team", assetDecisionStatus: "Review Required",
  };
}

const ASSET_DETAIL_KEYS = [
  "valuer", "valuationDate", "expiryDays", "reason", "docs", "title", "legalVerifier", "titleChecklist", "titleDocs",
  "legalChecks", "legalRemarks", "assetOverallAssessment", "assetRemarks", "assetAssignee", "assetDecisionStatus",
] as const;

const DECISION_CAPTION: Record<Exclude<Decision, null>, string> = {
  approve: "All assets reviewed and cleared", conditions: "Proceed once listed conditions are met",
  refer: "Send back for more information", reject: "Decline the application",
};
const DECISION_COLOR: Record<Exclude<Decision, null>, string> = { approve: "green", conditions: "teal", refer: "orange", reject: "red" };
const DECISION_ICON: Record<Exclude<Decision, null>, React.FC<any>> = {
  approve: IconCircleCheck, conditions: IconCheck, refer: IconInfoCircle, reject: IconCircleX,
};

const DECISION_TO_STATUS: Record<Exclude<Decision, null>, string> = {
  approve: "Approved", conditions: "Approved with Conditions", refer: "Referred", reject: "Rejected",
};
const STATUS_TO_DECISION = Object.fromEntries(Object.entries(DECISION_TO_STATUS).map(([k, v]) => [v, k])) as Record<string, Decision>;

function assetCategory(securityType: string | null | undefined) {
  const name = (securityType || "").toLowerCase();
  if (name.includes("vehicle") || name.includes("car") || name.includes("truck")) return "Motor vehicle";
  if (name.includes("land") || name.includes("property") || name.includes("house") || name.includes("building")) return "Landed property";
  if (name.includes("equipment") || name.includes("machine")) return "Equipment";
  if (name.includes("deposit")) return "Fixed deposit";
  return "Other";
}

function assetFromCollateral(c: ApplicationCollateral, owner: string): Asset {
  const d = (c.valuation_details ?? {}) as Record<string, any>;
  const base: DummyAssetBase = {
    type: d.asset_type || assetCategory(c.collateral_type),
    description: c.description ?? "",
    assetId: d.asset_id ?? "",
    location: d.location ?? "",
    owner: d.owner ?? owner,
    acquisition: d.acquisition ?? "",
  };
  const asset = makeAsset(d.source === "manual" ? "manual" : "application", base);
  ASSET_DETAIL_KEYS.forEach((key) => {
    if (d[key] !== undefined) (asset as any)[key] = d[key];
  });
  return {
    ...asset,
    id: c.row_id || asset.id,
    rowId: c.row_id,
    securityType: c.collateral_type || null,
    estimatedValue: c.estimated_value ?? "",
    ownershipDate: c.ownership_date ?? null,
    status: ["Failed", "Exception"].includes(c.valuation_status ?? "") ? (c.valuation_status as string) : asset.status,
    valuation: {
      ...asset.valuation,
      ...(d.valuation ?? {}),
      valuationAmount: c.valuation_amount ? String(c.valuation_amount) : d.valuation?.valuationAmount ?? "",
      forcedSaleValue: c.forced_sale_value ? String(c.forced_sale_value) : d.valuation?.forcedSaleValue ?? "",
    },
  };
}

function valuationStatus(a: Asset) {
  if (["Failed", "Exception"].includes(a.status)) return a.status;
  return Number(a.valuation.valuationAmount) > 0 && missingRequiredDocs(a.docs).length === 0 ? "Passed" : "Pending";
}

function legalStatus(a: Asset) {
  const issues = assetIssues(a);
  if (a.legalChecks.some((c) => ["Failed", "Exception"].includes(c.status)) && !a.legalRemarks.trim()) return "Unresolved";
  if (issues.legalOpen.length === 0 && missingRequiredDocs(a.titleDocs).length === 0) return "Passed";
  return "Pending";
}

const uploads = new WeakMap<File, Promise<string>>();

function uploadOnce(file: File) {
  if (!uploads.has(file)) {
    uploads.set(
      file,
      uploadStageFile(file).catch((error) => {
        uploads.delete(file);
        throw error;
      }),
    );
  }
  return uploads.get(file)!;
}

async function uploadDocs(docs: AssetDoc[]) {
  return Promise.all(
    docs.map(async ({ file, ...doc }) => (file ? { ...doc, fileUrl: await uploadOnce(file) } : doc)),
  );
}

async function collateralFromAsset(a: Asset): Promise<ApplicationCollateral> {
  const [docs, titleDocs] = await Promise.all([uploadDocs(a.docs), uploadDocs(a.titleDocs)]);
  const details: Record<string, any> = Object.fromEntries(ASSET_DETAIL_KEYS.map((key) => [key, (a as any)[key]]));
  return {
    row_id: a.rowId,
    collateral_type: a.securityType ?? "",
    estimated_value: Number(a.estimatedValue) || 0,
    ownership_date: a.ownershipDate || null,
    description: a.base.description || null,
    valuation_amount: Number(a.valuation.valuationAmount) || null,
    forced_sale_value: Number(a.valuation.forcedSaleValue) || null,
    valuation_status: valuationStatus(a),
    legal_status: legalStatus(a),
    valuation_details: {
      ...details,
      docs,
      titleDocs,
      source: a.source,
      asset_type: a.base.type,
      asset_id: a.base.assetId,
      location: a.base.location,
      owner: a.base.owner,
      acquisition: a.base.acquisition,
      valuation: a.valuation,
    },
  };
}

// requiredDocsVerified, missingRequiredDocs, CompactCheckRow, DocumentsTable,
// ValidityNote, DecisionButton, DECISION_LABEL, REJECT_REASONS all live in
// AssetValuation.tsx now (see the import at the top of this file) so this
// module has exactly one place that defines each of them.

// One place that decides whether an asset is "clean". Used by the stepper
// ticks, the list rows and the overall readiness gate.
function assetIssues(a: Asset) {
  const docsMissing = [...missingRequiredDocs(a.docs), ...missingRequiredDocs(a.titleDocs)];
  const valuationOk = valuationStatus(a) === "Passed" || (["Failed", "Exception"].includes(a.status) && !!a.reason.trim());
  const legalOpen = a.legalChecks.filter((c) => c.status === "Pending" || (["Failed", "Exception"].includes(c.status) && !a.legalRemarks.trim()));
  return { docsMissing, valuationOk, legalOpen };
}

function stepDone(a: Asset, id: PanelId): boolean {
  const i = assetIssues(a);
  if (id === "assetDetails") return !!a.base.description?.trim();
  if (id === "valuation") return i.valuationOk;
  if (id === "legal") return i.legalOpen.length === 0 && missingRequiredDocs(a.titleDocs).length === 0;
  return false;
}

// ---------------------------------------------------------------------------
// Top bar + left nav (no sub-tabs any more)
// ---------------------------------------------------------------------------

function TopBar({ onMinimize, onClose }: { onMinimize: () => void; onClose: () => void }) {
  return (
    <Group justify="space-between" align="center" px="xl" py={8} bg="brand.7" style={{ flexShrink: 0 }}>
      <Group gap={10}>
        <ThemeIcon radius="md" size={30} variant="white" color="brand"><IconFileText size={15} /></ThemeIcon>
        <Box>
          <Text fz={13.5} fw={700} c="white">Loan Application</Text>
          <Text fz={11} c="brand.1">Step 4 • Underwriting</Text>
        </Box>
      </Group>
      <Group gap={14} wrap="nowrap">
        <ActionIcon variant="subtle" color="white" radius="xl"><IconBell size={17} color="white" /></ActionIcon>
        <Group gap={6}>
          <Avatar radius="xl" size={28} color="brand" variant="white"><Text fz={11} fw={700} c="brand.7">DT</Text></Avatar>
          <IconChevronDown size={14} color="white" />
        </Group>
        <ActionIcon variant="subtle" color="white" radius="xl" onClick={onMinimize} aria-label="Minimize"><IconMinus size={16} color="white" /></ActionIcon>
        <ActionIcon variant="subtle" color="white" radius="xl" onClick={onClose} aria-label="Close"><IconX size={16} color="white" /></ActionIcon>
      </Group>
    </Group>
  );
}



// ---------------------------------------------------------------------------
// Workspace: asset list -> one 4-step flow per asset -> overall decision
// ---------------------------------------------------------------------------

function UnderwritingWorkspace({
  application, onChange, tab: tabProp, onTabChange, readOnly = false,
}: {
  application: LoanApplication;
  readOnly?: boolean;
  onChange?: (result: UnderwritingResult) => void;
  tab?: TabId;
  onTabChange?: (t: TabId) => void;
}) {
  const finalAmount = Number(application.approved_amount) || Number(application.requested_amount) || 0;
  const saved = (application.underwriting_data ?? {}) as Record<string, any>;
  const [internalTab, setInternalTab] = useState<TabId>("asset");
  const tab = tabProp ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const isControlled = !!tabProp;

  const [assets, setAssets] = useState<Asset[]>(() =>
    (application.collaterals ?? []).map((c) => assetFromCollateral(c, application.applicant_name || "")),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId>("assetDetails");

  const [assignee] = useState<string>(saved.assignee ?? "Internal team");
  const [decision, setDecision] = useState<Decision>(STATUS_TO_DECISION[application.underwriting_decision ?? ""] ?? null);
  const [conditions, setConditions] = useState<Condition[]>(saved.conditions ?? []);
  const [reasonCategory, setReasonCategory] = useState<string>(saved.reason_category ?? "");
  const [reasonDetail, setReasonDetail] = useState<string>(saved.reason_detail ?? "");
  const [completed, setCompleted] = useState(false);
  const [globalNotes, setGlobalNotes] = useState<string>(saved.notes ?? "");

  useEffect(() => {
    if (selectedId) setPanel(TAB_ITEMS.find((t) => t.id === tab)!.entryStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const selected = assets.find((a) => a.id === selectedId) || null;
  const update = (id: string, patch: Partial<Asset>) => setAssets((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const updateChecklist = (id: string, itemId: string, patch: Partial<TitleChecklistItem>) =>
    setAssets((p) => p.map((a) => (a.id === id ? { ...a, titleChecklist: a.titleChecklist.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : a)));
  const updateLegalCheck = (id: string, checkId: string, patch: Partial<LegalCheck>) =>
    setAssets((p) => p.map((a) => (a.id === id ? { ...a, legalChecks: a.legalChecks.map((c) => (c.id === checkId ? { ...c, ...patch } : c)) } : a)));

  const open = (id: string) => { setSelectedId(id); setPanel(TAB_ITEMS.find((t) => t.id === tab)!.entryStep); };
  const addAsset = () => {
    const a = makeAsset("manual", { type: DUMMY_ASSET_TYPES[0], description: "", assetId: "", location: "", owner: "", acquisition: "" });
    setAssets((p) => [...p, a]);
    open(a.id);
  };
  const removeAsset = (id: string) => { setAssets((p) => p.filter((a) => a.id !== id)); if (selectedId === id) setSelectedId(null); };

  const totalValue = assets.reduce((s, a) => s + (Number(a.valuation.valuationAmount) || 0), 0);
  const coverage = totalValue ? Math.round((totalValue / finalAmount) * 100) : null;

  const readiness = useMemo(() => {
    const blockers: string[] = [];
    assets.forEach((a, i) => {
      const l = `Asset ${i + 1}`;
      const s = assetIssues(a);
      if (s.docsMissing.length) blockers.push(`${l}: required documents missing — ${s.docsMissing.map((d) => d.name).join(", ")}.`);
      if (!s.valuationOk) blockers.push(`${l}: valuation not confirmed.`);
      if (s.legalOpen.length) blockers.push(`${l}: legal checks open — ${s.legalOpen.map((c) => c.name).join(", ")}.`);
    });
    return { ready: blockers.length === 0, blockers };
  }, [assets]);

  const decisionReady =
    (decision === "approve" && readiness.ready) ||
    (decision === "conditions" && conditions.length > 0 && conditions.every((c) => c.condition.trim())) ||
    ((decision === "refer" || decision === "reject") && !!reasonCategory);

  const assetsComplete = assets.every((a) => a.securityType && Number(a.estimatedValue) > 0);

  useEffect(() => {
    onChange?.({
      ready: decisionReady && assetsComplete,
      buildPayload: async (submit) => ({
        custom_status: submit && decision ? DECISION_TO_STATUS[decision] : "Pending",
        underwriting_decision: decision ? DECISION_TO_STATUS[decision] : null,
        final_amount: finalAmount || null,
        underwriting_data: {
          notes: globalNotes,
          assignee,
          conditions: decision === "conditions" ? conditions : [],
          reason_category: decision === "refer" || decision === "reject" ? reasonCategory || null : null,
          reason_detail: decision === "refer" || decision === "reject" ? reasonDetail || null : null,
        },
        collaterals: await Promise.all(assets.map(collateralFromAsset)),
      }),
    });
  }, [assets, decision, conditions, reasonCategory, reasonDetail, globalNotes, assignee, decisionReady, assetsComplete]);

  const panelItems = useMemo(() => {
    if (tab === "asset") {
      return [
        { id: "assetDetails" as PanelId, label: "Asset", icon: IconIdBadge2 },
        { id: "valuation" as PanelId, label: "Valuation", icon: IconCar },
        { id: "notes" as PanelId, label: "Underwriter Notes", icon: IconFileText },
      ];
    }
    return [
      { id: "legal" as PanelId, label: "Legal", icon: IconShieldCheck },
      { id: "notes" as PanelId, label: "Underwriter Notes", icon: IconFileText },
    ];
  }, [tab]);
  const steps = useMemo(() => panelItems.map((p) => p.id), [panelItems]);

  // ------------------------------------------------------------- completed
  if (completed) {
    return (
      <Box p="xl">
        <Paper withBorder className="ps-surface" radius="lg" p="xl" ta="center">
          <ThemeIcon size={48} radius="xl" color="green" variant="light" mb={12}><IconCircleCheck size={26} /></ThemeIcon>
          <Text fz={18} fw={700}>Underwriting complete</Text>
          <Text fz={13} c="dimmed" mb={16}>{decision ? DECISION_LABEL[decision] : ""} · {assets.length} asset(s) reviewed. Use Submit below to send it on.</Text>
          <Button variant="default" radius="xl" onClick={() => setCompleted(false)}>Reopen</Button>
        </Paper>
      </Box>
    );
  }

  // ------------------------------------------------------------ asset flow
  if (selected) {
    const idx = steps.indexOf(panel);
    const notes = selected.valuation.notes;
    const setNotes = (v: string) => update(selected.id, { valuation: { ...selected.valuation, notes: v } });
    const onUpdate = (p: Partial<Asset>) => update(selected.id, p);

    return (
      <Box p={10}>
        <Group mb={6} justify="space-between">
          <UnstyledButton onClick={() => setSelectedId(null)} p={4}>
            <Group gap={4} c="dimmed"><IconChevronLeft size={16} /><Text fz={13} fw={600}>Back to assets</Text></Group>
          </UnstyledButton>
          <Badge variant="light" color="brand" radius="xl">Asset {assets.findIndex((a) => a.id === selected.id) + 1} of {assets.length}</Badge>
        </Group>

        <Paper withBorder className="ps-surface" radius="lg" mb={4} style={{ overflow: "hidden" }}>
          <Group gap={0} px={8} pt={6} wrap="wrap">
            {panelItems.map((s, n) => {
              const active = panel === s.id;
              const done = stepDone(selected, s.id);
              return (
                <UnstyledButton key={s.id} onClick={() => setPanel(s.id)} px={10} pb={6} style={{ borderBottom: `2px solid ${active ? "var(--mantine-color-brand-6)" : "transparent"}` }}>
                  <Group gap={7}>
                    <Badge circle size="sm" p={0} color={done ? "green.6" : active ? "brand.8" : "gray.3"} c={done || active ? "white" : "gray.6"}>
                      {done ? <IconCheck size={10} /> : n + 1}
                    </Badge>
                    <Text fz={12.5} fw={active ? 700 : 500} c={active ? "brand.7" : "dark.5"}>{s.label}</Text>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Group>
        </Paper>

        <Paper withBorder className="ps-surface" radius="lg" bg="white" style={{ overflow: "hidden" }}>
          <Box component="fieldset" disabled={readOnly} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          {(panel === "assetDetails" || panel === "valuation" || panel === "documents") && (
            <AssetValuation asset={selected} finalAmount={finalAmount} panel={panel} notes={notes} setNotes={setNotes} onUpdate={onUpdate} />
          )}
          {panel === "legal" && (
            <LegalVerification
              asset={selected} panel={panel} notes={notes} setNotes={setNotes} onUpdate={onUpdate} finalAmount={finalAmount}
              onUpdateChecklist={(itemId: string, patch: Partial<TitleChecklistItem>) => updateChecklist(selected.id, itemId, patch)}
              onUpdateLegalCheck={(checkId: string, patch: Partial<LegalCheck>) => updateLegalCheck(selected.id, checkId, patch)}
            />
          )}
          {panel === "notes" && (
            <Box px={20} pt={20} pb={20}>
              <Textarea 
                minRows={4}
                radius="md"
                placeholder="General comments, findings, risks, exceptions and recommendations that apply across the review..."
                value={globalNotes}
                onChange={(e) => setGlobalNotes(e.currentTarget.value)}
              />
              <Text fz={11.5} c="dimmed" mt={8}>Shared across all assets and tabs, and included in the underwriting audit trail.</Text>
            </Box>
          )}
          </Box>

          <Group justify="space-between" px={16} py={12} bg="gray.0" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
            <Text fz={11} c="dimmed">Step {idx + 1} of {steps.length}</Text>
            <Group>
              <Button variant="default" radius="xl" size="sm" disabled={idx === 0} onClick={() => setPanel(steps[idx - 1])}>Back</Button>
              {idx < steps.length - 1 ? (
                <Button radius="xl" size="sm" rightSection={<IconArrowRight size={16} />} onClick={() => setPanel(steps[idx + 1])}>
                  Continue to {panelItems[idx + 1].label}
                </Button>
              ) : (
                <Button radius="xl" size="sm" color="green" rightSection={<IconCheck size={16} />} onClick={() => setSelectedId(null)}>Save asset</Button>
              )}
            </Group>
          </Group>
        </Paper>
      </Box>
    );
  }

  // ------------------------------------------------------------ asset list
  return (
    <Box p="md">
      <Group justify="space-between" mb={14}>
        <Group gap={10}>
          <ThemeIcon radius="md" size={34} variant="light" color="brand"><IconShieldCheck size={17} /></ThemeIcon>
          <Text fz={16} fw={700} c="dark.8">
            {tab === "legal" ? "Legal Verification" : "Asset Valuation"} <Text span c="dimmed" fw={600}>({assets.length})</Text>
          </Text>
        </Group>
        <Button radius="xl" leftSection={<IconPlus size={14} />} onClick={addAsset} disabled={readOnly}>Add asset</Button>
      </Group>

      {!isControlled && (
        <Group gap={6} mb={14} wrap="wrap">
          {TAB_ITEMS.map((t) => {
            const tActive = tab === t.id;
            const TIcon = t.icon;
            return (
              <Button key={t.id} size="compact-sm" radius="xl" variant={tActive ? "light" : "subtle"} color={tActive ? "brand" : "gray"} leftSection={<TIcon size={13} />} onClick={() => setTab(t.id)}>
                {t.label}
              </Button>
            );
          })}
        </Group>
      )}

      {assets.length === 0 ? (
        <Paper withBorder radius="lg" py={50} ta="center" bg="gray.0">
          <Text fz="md" fw={600}>No assets added</Text>
          <Text fz="sm" c="dimmed">Add an asset to begin the security review.</Text>
        </Paper>
      ) : (
        <Paper withBorder radius="lg" p="md" bg="gray.0" mb={20}>
          {assets.map((a, i) => {
            const AssetIcon = (a.base.type || "").toLowerCase().includes("vehicle") ? IconCar : IconBuildingBank;
            const doneCount = STEPS.filter((s) => stepDone(a, s)).length;
            return (
              <Paper key={a.id} withBorder radius="md" mb={8} onClick={() => open(a.id)} style={{ borderLeft: "4px solid var(--mantine-color-brand-6)", cursor: "pointer" }}>
                <Group justify="space-between" wrap="nowrap" px={14} py={8}>
                  <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon radius="md" size={30} variant="light" color="brand"><AssetIcon size={16} /></ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Group gap={8} wrap="nowrap">
                        <Badge size="xs" radius="xl" variant="light" color="brand">Asset {i + 1}</Badge>
                        <Text fz={13.5} fw={700} truncate>{a.base.description ? a.base.description.split(",")[0] : a.base.type}</Text>
                      </Group>
                      <Text fz={11.5} c="dimmed" truncate>{a.base.assetId || "No asset ID"} · {doneCount}/{STEPS.length} steps done</Text>
                    </Box>
                  </Group>
                  <Group gap={10} wrap="nowrap">
                    <StatusBadge status={valuationStatus(a)} />
                    <ActionIcon variant="subtle" color="red" size="sm" title="Remove" disabled={readOnly} onClick={(e) => { e.stopPropagation(); removeAsset(a.id); }}><IconTrash size={15} /></ActionIcon>
                    <IconChevronRight size={16} color="var(--mantine-color-gray-4)" />
                  </Group>
                </Group>
              </Paper>
            );
          })}
        </Paper>
      )}

      <Box component="fieldset" disabled={readOnly} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <Paper withBorder radius="lg" p="md" bg="white">
        <SectionLabel>Underwriting decision</SectionLabel>
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing={10} mt={8}>
          {(["approve", "conditions", "refer", "reject"] as const).map((d) => (
            <Box key={d} style={{ borderRadius: "var(--mantine-radius-md)", outline: decision === d ? "2px solid var(--mantine-color-brand-5)" : "none" }}>
              <DecisionButton
                label={DECISION_LABEL[d]}
                caption={DECISION_CAPTION[d]}
                color={DECISION_COLOR[d]}
                icon={DECISION_ICON[d]}
                onClick={() => setDecision(d)}
              />
            </Box>
          ))}
        </SimpleGrid>

        {decision === "approve" && !readiness.ready && (
          <Stack gap={4} mt={10}>
            {readiness.blockers.map((b) => (
              <Group key={b} gap={6} wrap="nowrap">
                <IconAlertTriangle size={13} color="var(--mantine-color-orange-6)" />
                <Text fz={12} c="orange.8">{b}</Text>
              </Group>
            ))}
          </Stack>
        )}

        {decision === "conditions" && (
          <Stack gap={8} mt={12}>
            {conditions.map((c, i) => (
              <Group key={i} gap={8} wrap="nowrap" align="flex-end">
                <TextInput
                  size="xs" radius="md" label={i === 0 ? "Condition" : undefined} style={{ flex: 1 }}
                  value={c.condition} error={c.condition.trim() ? undefined : "Required"}
                  onChange={(e) => setConditions(conditions.map((x, idx) => (idx === i ? { ...x, condition: e.currentTarget.value } : x)))}
                />
                <Select
                  size="xs" radius="md" label={i === 0 ? "Responsible" : undefined} w={140} data={["Customer", "Bank"]} allowDeselect={false}
                  value={c.responsible} onChange={(v) => setConditions(conditions.map((x, idx) => (idx === i ? { ...x, responsible: v ?? "Customer" } : x)))}
                />
                <Select
                  size="xs" radius="md" label={i === 0 ? "Due before" : undefined} w={160} data={["Offer signing", "Disbursement", "First repayment"]} allowDeselect={false}
                  value={c.dueBefore} onChange={(v) => setConditions(conditions.map((x, idx) => (idx === i ? { ...x, dueBefore: v ?? "Disbursement" } : x)))}
                />
                <ActionIcon variant="subtle" color="red" size="md" onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))}><IconX size={15} /></ActionIcon>
              </Group>
            ))}
            <Button variant="subtle" size="compact-sm" radius="xl" leftSection={<IconPlus size={13} />} w="fit-content"
              onClick={() => setConditions([...conditions, { condition: "", responsible: "Customer", dueBefore: "Disbursement" }])}>
              Add condition
            </Button>
          </Stack>
        )}

        {(decision === "refer" || decision === "reject") && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={10} mt={12}>
            <Select size="xs" radius="md" label="Reason" data={REJECT_REASONS} value={reasonCategory || null}
              onChange={(v) => setReasonCategory(v ?? "")} error={reasonCategory ? undefined : "Required"} />
            <Textarea size="xs" radius="md" label="Details" autosize minRows={1} value={reasonDetail}
              onChange={(e) => setReasonDetail(e.currentTarget.value)} />
          </SimpleGrid>
        )}
      </Paper>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function UnderwritingModal({ opened, onClose, loanApplicationId, application: embeddedApplication, onMinimize, embedded, readOnly, tab: externalTab, onTabChange: setExternalTab }: UnderwritingModalProps) {
  const [section, setSection] = useState<Section>("underwriting");
  const [internalTab, setInternalTab] = useState<TabId>("asset"); const tab = externalTab || internalTab; const setTab = setExternalTab || setInternalTab;
  const [result, setResult] = useState<UnderwritingResult | null>(null);
  const [preparing, setPreparing] = useState(false);
  const stage = useStageApplication(embedded ? null : loanApplicationId);

  if (embedded) {
    if (!embeddedApplication) return null;
    return (
      <UnderwritingWorkspace application={embeddedApplication} readOnly={readOnly} tab={tab} onTabChange={setTab} />
    );
  }

  const { application, values } = stage;
  const noop = () => {};

  const handleSubmit = async () => {
    if (!result) return;
    setPreparing(true);
    try {
      if (await stage.save(await result.buildPayload(true))) onClose();
    } finally {
      setPreparing(false);
    }
  };

  return (
    <Modal
      opened={opened} onClose={onClose} size={1400} closeOnClickOutside={false} closeOnEscape={false} padding={0} lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden", height: "85vh", maxHeight: 860 },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Group justify="space-between" align="center" px="xl" py="sm" bg="brand.6" style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}>
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconCertificate size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>Loan Application</Text>
              <Text size="xs" fw={500} c="brand.1">Stage 4 &mdash; Underwriting</Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onMinimize} aria-label="Minimize">
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>
        </Group>

        {!application || !values ? (
          <StageLoading error={stage.error} />
        ) : (
          <>
            <ContextHeader values={values} applicationId={application.name} loanTypeName={application.loan_type_name} stageIndex={4} />
            <Box style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
              <LeftNav activeSubItem={tab} onSubItemClick={(sub) => { setTab(sub as TabId); setSection("underwriting"); }} section={section}
                setSection={setSection}
                stageIndex={4}
                items={[
                  { id: "application", label: "Loan application", hint: "Submitted", icon: IconFileText, done: true },
                  { id: "prescreening", label: "Prescreening", hint: "Passed", icon: IconGauge, done: true },
                  { id: "appraisal", label: "Loan Appraisal", hint: "Passed", icon: IconBuildingBank, done: true },
                  { id: "underwriting", label: "Underwriting", hint: "In progress", icon: IconScale, done: false, subItems: [
                      { id: "asset", label: "Asset Valuation", icon: IconCircleCheck },
                      { id: "legal", label: "Legal Verification", icon: IconShieldCheck }
                    ] },
                ]}
              />
              <Box style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "linear-gradient(180deg, #F5F4FF 0%, var(--mantine-color-gray-0) 320px)" }}>
                {section === "application" && (
                  <Box style={{ height: "100%" }}>
                    <Group gap={10} m="md" p="sm" bg="brand.0" style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}>
                      <IconInfoCircle size={14} color="var(--mantine-color-brand-6)" />
                      <Text fz={12.5} c="brand.9">Submitted application data — read-only at this stage.</Text>
                    </Group>
                    <Box style={{ height: "calc(100% - 70px)" }}>
                      <LoanApplicationModal embedded readOnly initialValues={values} opened={false} onClose={noop} onMinimize={noop} />
                    </Box>
                  </Box>
                )}
                {section === "prescreening" && <PreScreeningModal embedded readOnly application={application} opened={false} onClose={noop} onMinimize={noop} />}
                {section === "appraisal" && <EnrichmentModal embedded readOnly application={application} opened={false} onClose={noop} onMinimize={noop} />}
                {section === "underwriting" && (
                  <UnderwritingWorkspace application={application} readOnly={readOnly} onChange={setResult} tab={tab} onTabChange={setTab} />
                )}
              </Box>
            </Box>
            {!readOnly && (
              <Group justify="space-between" px="xl" py="md" bg="white" style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}>
                <Button variant="default" radius="md" onClick={onClose}>Cancel</Button>
                <Button radius="md" onClick={handleSubmit} disabled={!result?.ready} loading={stage.saving || preparing} rightSection={<IconArrowRight size={16} />}>Submit</Button>
              </Group>
            )}
          </>
        )}
      </Box>
    </Modal>
  );
}
