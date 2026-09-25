import { LegalVerification } from "./LegalVerification";
import { AssetValuation, zmw, STATUS_COLORS, DECISION_LABEL, REJECT_REASONS, requiredDocsVerified, missingRequiredDocs, DecisionButton, SectionLabel } from "./AssetValuation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal, Box, Group, Text, Badge, ThemeIcon, UnstyledButton, Stack, SimpleGrid, Paper, TextInput, Select,
  Checkbox, Textarea, Button, ActionIcon, Avatar, Divider, Tooltip,
} from "@mantine/core";
import {
  IconBell, IconChevronDown, IconChevronLeft, IconChevronRight, IconFileText, IconGauge, IconBuildingBank, IconScale,
  IconShieldCheck, IconCar, IconIdBadge2, IconCheck, IconX, IconPlus, IconInfoCircle,
  IconAlertTriangle, IconCircleCheck, IconCircleX, IconArrowRight, IconMinus, IconTrash, IconUpload, IconLock,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import { PreScreeningModal } from "../PreScreeningModal/PreScreeningModal";
import { EnrichmentModal } from "../Enrichment/EnrichmentModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION, DUMMY_PRESCREENING_CONTEXT, DUMMY_PRESCREENING_DATA, DUMMY_ENRICHMENT_TERMS,
  DUMMY_ASSET_TYPES, DUMMY_SEED_ASSET_BASE, getApplicableChecks, type DummyAssetBase,
} from "../PreScreeningModal/Dummyloanapplicationdata";

interface UnderwritingModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  embedded?: boolean;
  readOnly?: boolean;
  applicationValues?: LoanApplicationValues;
}

const POLICY: Record<"personal" | "business" | "mortgage", { minCreditScore: number; maxDTI: number; productMax: number }> = {
  personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 },
  business: { minCreditScore: 620, maxDTI: 55, productMax: 500000 },
  mortgage: { minCreditScore: 680, maxDTI: 45, productMax: 2000000 },
};

function calcEligibility(p: { income: number; obligations: number; maxDTI: number; annualRate: number; tenureMonths: number; productMax: number; creditScore: number; minCreditScore: number }) {
  const dti = p.income > 0 ? (p.obligations / p.income) * 100 : 100;
  const ok = p.creditScore >= p.minCreditScore && dti <= p.maxDTI;
  const capacity = Math.max(0, p.income * (p.maxDTI / 100) - p.obligations);
  const r = p.annualRate / 100 / 12;
  const afford = r > 0 ? capacity * ((1 - Math.pow(1 + r, -p.tenureMonths)) / r) : capacity * p.tenureMonths;
  return { eligibleAmount: ok ? Math.min(afford, p.productMax) : 0 };
}

// ---------------------------------------------------------------------------
// Shared bits (exported — other files import these)
// ---------------------------------------------------------------------------

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
  fileUrl?: string; fileType?: string;
}
export interface TitleChecklistItem { id: string; label: string; status: string; comment: string }
export interface LegalCheck { id: string; name: string; status: string; finding: string; why: string; action: string; comment: string }
export type Decision = "approve" | "conditions" | "refer" | "reject" | null;
export interface Condition { condition: string; responsible: string; dueBefore: string }

export interface Asset {
  id: string;
  source: "application" | "manual";
  base: DummyAssetBase;
  valuation: { amount: string; valuationAmount: string; currency: string; method: string; marketValue: string; forcedSaleValue: string; notes: string };
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
    id: "asset-" + assetSeq++, source, base,
    valuation: { amount: "", valuationAmount: "", currency: "ZMW", method: "Market comparison", marketValue: "", forcedSaleValue: "", notes: "" },
    valuer: { name: "", company: "", license: "", contact: "", verified: false },
    valuationDate: todayISO(), expiryDays: 180, status: "Pending", reason: "",
    docs: [emptyDoc("Valuation report", "required"), emptyDoc("Asset photos", "required"), emptyDoc("Ownership document", "required")],
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
      id: c?.id ?? Math.random().toString(36).slice(2), name: c?.name ?? "Legal check", status: c?.defaultStatus ?? "Pending",
      finding: c?.finding ?? "", why: c?.why || "", action: c?.action || "", comment: "",
    })),
    legalRemarks: "",
    assetOverallAssessment: "Review Required", assetRemarks: "", assetAssignee: "Internal team", assetDecisionStatus: "Review Required",
  };
}

function makeSeedAsset(): Asset {
  const a = makeAsset("application", DUMMY_SEED_ASSET_BASE);
  const done = (name: string, tier: "required" | "optional", by: string, date: string, meta: string, until = ""): AssetDoc =>
    ({ name, tier, status: "Verified", uploadedDate: date, uploadedBy: by, validUntil: until, fileMeta: meta, comment: "" });
  a.docs = [
    emptyDoc("Valuation report", "required"),
    done("Asset photos", "required", "Field valuer", "3 Sep 2026", "photos_03sep2026.zip (4.8 MB)"),
    emptyDoc("Ownership document", "required"),
  ];
  a.valuation = { ...a.valuation, marketValue: "", forcedSaleValue: "", amount: "" };
  a.valuationDate = todayISO();
  a.valuer = { name: "", company: "", license: "", contact: "", verified: false };
  a.status = "Pending";
  a.titleChecklist = a.titleChecklist.map((i) => ({ ...i, status: i.id === "encumbrances" ? "Exception" : "Passed" }));
  a.titleDocs = [
    done("Title deed / ownership document", "required", "Legal officer", "4 Sep 2026", "title_deed.pdf (1.1 MB)"),
    done("Search report", "required", "Legal officer", "4 Sep 2026", "search_report.pdf (0.8 MB)"),
    emptyDoc("Legal opinion", "optional"),
  ];
  return a;
}

// requiredDocsVerified, missingRequiredDocs, CompactCheckRow, DocumentsTable,
// ValidityNote, DecisionButton, DECISION_LABEL, REJECT_REASONS all live in
// AssetValuation.tsx now (see the import at the top of this file) so this
// module has exactly one place that defines each of them.

// One place that decides whether an asset is "clean". Used by the stepper
// ticks, the list rows and the overall readiness gate.
function assetIssues(a: Asset) {
  const docsMissing = [...missingRequiredDocs(a.docs), ...missingRequiredDocs(a.titleDocs)];
  const valuationOk = a.status === "Passed" || (["Failed", "Exception"].includes(a.status) && !!a.reason.trim());
  const titleOpen = a.titleChecklist.filter((i) => ["Pending", "In Progress"].includes(i.status) || (["Failed", "Exception"].includes(i.status) && !i.comment.trim()));
  const legalOpen = a.legalRemarks.trim() ? [] : a.legalChecks.filter((c) => ["Failed", "Exception"].includes(c.status));
  return { docsMissing, valuationOk, titleOpen, legalOpen };
}

function stepDone(a: Asset, id: PanelId): boolean {
  const i = assetIssues(a);
  if (id === "assetDetails") return !!a.base.description?.trim();
  if (id === "valuation") return i.valuationOk;
  if (id === "legal") return i.titleOpen.length === 0 && i.legalOpen.length === 0;
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

function LeftNav({
  section, setSection, values, tab, setTab,
}: {
  section: Section; setSection: (s: Section) => void; values: LoanApplicationValues; tab: TabId; setTab: (t: TabId) => void;
}) {
  const isBusiness = values.loanType === "Business";
  const name = isBusiness ? values.companyName : [values.firstName, values.surname].filter(Boolean).join(" ");
  const initials = (name || "").split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const items: { id: Section; label: string; icon: React.FC<any>; done: boolean }[] = [
    { id: "application", label: "Loan application", icon: IconFileText, done: true },
    { id: "prescreening", label: "Pre-screening", icon: IconGauge, done: true },
    { id: "appraisal", label: "Loan Appraisal", icon: IconBuildingBank, done: true },
    { id: "underwriting", label: "Underwriting", icon: IconScale, done: false },
  ];
  return (
    <Box w={240} style={{ flexShrink: 0, background: "white", borderRight: "1px solid var(--mantine-color-gray-2)" }}>
      <Group gap={10} p="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}>
        <Avatar radius="xl" size={34} color="brand" variant="light">{initials || "—"}</Avatar>
        <Box>
          <Text fz={13} fw={700} c="dark.8">{name || "—"}</Text>
          <Text fz={11.5} c="dimmed">{isBusiness ? "Business Loan" : "Personal Loan"}</Text>
        </Box>
      </Group>
      <Stack gap={2} p={10}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          return (
            <Box key={it.id}>
              <UnstyledButton onClick={() => setSection(it.id)} px={10} py={9} style={{ borderRadius: 8, width: "100%", background: active ? "var(--mantine-color-brand-0)" : "transparent" }}>
                <Group gap={9} justify="space-between" wrap="nowrap">
                  <Group gap={9} wrap="nowrap">
                    {active ? <Box w={8} h={8} style={{ borderRadius: "50%", background: "var(--mantine-color-brand-6)" }} /> : <Icon size={15} color="var(--mantine-color-gray-6)" />}
                    <Text fz={13} fw={active ? 700 : 500} c={active ? "brand.7" : "dark.6"}>{it.label}</Text>
                  </Group>
                  {it.done && <ThemeIcon radius="xl" size={16} color="brand" variant="light"><IconCheck size={11} /></ThemeIcon>}
                </Group>
              </UnstyledButton>

              {it.id === "underwriting" && active && (
                <Stack gap={1} pl={27} pr={4} py={2}>
                  {TAB_ITEMS.map((t) => {
                    const tActive = tab === t.id;
                    const TIcon = t.icon;
                    return (
                      <UnstyledButton
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        px={9} py={7}
                        style={{
                          borderRadius: 7,
                          borderLeft: `2px solid ${tActive ? "var(--mantine-color-brand-6)" : "transparent"}`,
                          background: tActive ? "var(--mantine-color-brand-0)" : "transparent",
                        }}
                      >
                        <Group gap={7} wrap="nowrap">
                          <TIcon size={13} color={tActive ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
                          <Text fz={12} fw={tActive ? 700 : 500} c={tActive ? "brand.8" : "dark.5"}>{t.label}</Text>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Workspace: asset list -> one 4-step flow per asset -> overall decision
// ---------------------------------------------------------------------------

function UnderwritingWorkspace({
  finalAmount, onSubmitReady, tab: tabProp, onTabChange,
}: {
  finalAmount: number;
  onSubmitReady?: (can: boolean, submit: () => void) => void;
  tab?: TabId;
  onTabChange?: (t: TabId) => void;
}) {
  const [internalTab, setInternalTab] = useState<TabId>("asset");
  const tab = tabProp ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const isControlled = !!tabProp;

  const [assets, setAssets] = useState<Asset[]>(() => [makeSeedAsset()]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId>("assetDetails");

  const [assignee, setAssignee] = useState("Internal team");
  const [decision, setDecision] = useState<Decision>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [completed, setCompleted] = useState(false);
  const [globalNotes, setGlobalNotes] = useState("");

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

  const totalValue = assets.reduce((s, a) => s + (Number(a.valuation.amount) || 0), 0);
  const coverage = totalValue ? Math.round((totalValue / finalAmount) * 100) : null;

  const readiness = useMemo(() => {
    const blockers: string[] = [];
    assets.forEach((a, i) => {
      const l = `Asset ${i + 1}`;
      const s = assetIssues(a);
      if (s.docsMissing.length) blockers.push(`${l}: required documents not verified — ${s.docsMissing.map((d) => d.name).join(", ")}.`);
      if (!s.valuationOk) blockers.push(`${l}: valuation not confirmed.`);
      if (s.titleOpen.length) blockers.push(`${l}: unresolved title items — ${s.titleOpen.map((t) => t.label).join(", ")}.`);
      if (s.legalOpen.length) blockers.push(`${l}: legal exceptions need a legal remark — ${s.legalOpen.map((c) => c.name).join(", ")}.`);
    });
    return { ready: blockers.length === 0, blockers };
  }, [assets]);

  const decisionReady =
    (decision === "approve" && readiness.ready) ||
    (decision === "conditions" && conditions.length > 0 && conditions.every((c) => c.condition.trim())) ||
    ((decision === "refer" || decision === "reject") && !!reasonCategory);

  useEffect(() => { onSubmitReady?.(completed, () => {}); }, [completed]);

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
        <Paper withBorder radius="lg" p="xl" ta="center">
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

        <Paper withBorder radius="lg" mb={4} style={{ overflow: "hidden" }}>
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

        <Paper withBorder radius="lg" bg="white" style={{ overflow: "hidden" }}>
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
        <Button radius="xl" leftSection={<IconPlus size={14} />} onClick={addAsset}>Add asset</Button>
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
                    <StatusBadge status={a.status} />
                    <ActionIcon variant="subtle" color="red" size="sm" title="Remove" onClick={(e) => { e.stopPropagation(); removeAsset(a.id); }}><IconTrash size={15} /></ActionIcon>
                    <IconChevronRight size={16} color="var(--mantine-color-gray-4)" />
                  </Group>
                </Group>
              </Paper>
            );
          })}
        </Paper>
      )}


    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function UnderwritingModal({ opened, onClose, applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION, onMinimize, embedded }: UnderwritingModalProps) {
  const [section, setSection] = useState<Section>("underwriting");
  const [tab, setTab] = useState<TabId>("asset");
  const policy = POLICY[DUMMY_PRESCREENING_CONTEXT.loanTypeId];
  const calc = calcEligibility({
    income: DUMMY_PRESCREENING_DATA.income.value,
    obligations: DUMMY_PRESCREENING_DATA.liabilities.obligations,
    maxDTI: policy.maxDTI,
    annualRate: DUMMY_PRESCREENING_CONTEXT.loanRate,
    tenureMonths: Number(applicationValues.tenureMonths) || 0,
    productMax: policy.productMax,
    creditScore: DUMMY_PRESCREENING_DATA.credit.value,
    minCreditScore: policy.minCreditScore,
  });
  const finalAmount = DUMMY_ENRICHMENT_TERMS.amount || Math.round(calc.eligibleAmount);

  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});
  const handleSubmitReady = (ready: boolean, submit: () => void) => { setCanSubmit(ready); submitRef.current = submit; };

  if (embedded) return <UnderwritingWorkspace finalAmount={finalAmount} onSubmitReady={handleSubmitReady} />;

  const noop = () => {};
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
        <TopBar onMinimize={onMinimize} onClose={onClose} />
        <Box style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          <LeftNav section={section} setSection={setSection} values={applicationValues} tab={tab} setTab={setTab} />
          <Box style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "linear-gradient(180deg, #F5F4FF 0%, var(--mantine-color-gray-0) 320px)" }}>
            {section === "application" && (
              <Box style={{ height: "100%" }}>
                <Group gap={10} m="md" p="sm" bg="brand.0" style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}>
                  <IconInfoCircle size={14} color="var(--mantine-color-brand-6)" />
                  <Text fz={12.5} c="brand.9">Submitted application data — read-only at this stage.</Text>
                </Group>
                <Box style={{ height: "calc(100% - 70px)" }}>
                  <LoanApplicationModal embedded readOnly initialValues={applicationValues} opened={false} onClose={noop} onMinimize={noop} />
                </Box>
              </Box>
            )}
            {section === "prescreening" && <PreScreeningModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={noop} onMinimize={noop} />}
            {section === "appraisal" && <EnrichmentModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={noop} onMinimize={noop} />}
            {section === "underwriting" && <UnderwritingWorkspace finalAmount={finalAmount} onSubmitReady={handleSubmitReady} tab={tab} onTabChange={setTab} />}
          </Box>
        </Box>
        <Group justify="space-between" px="xl" py="md" bg="white" style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}>
          <Button variant="default" radius="md" onClick={onClose}>Cancel</Button>
          <Button radius="md" onClick={() => submitRef.current()} disabled={!canSubmit} rightSection={<IconArrowRight size={16} />}>Submit</Button>
        </Group>
      </Box>
    </Modal>
  );
}