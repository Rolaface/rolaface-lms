import { LegalDetailView } from './LegalDetailView';
import { AssetDetailView } from './AssetDetailView';
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Box,
  Group,
  Text,
  Badge,
  ThemeIcon,
  UnstyledButton,
  Stack,
  SimpleGrid,
  Paper,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  Textarea,
  Button,
  ActionIcon,
  Avatar,
  Divider,
  Tooltip,
} from "@mantine/core";
import {
  IconBell,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconFileText,
  IconGauge,
  IconBuildingBank,
  IconScale,
  IconShieldCheck,
  IconCar,
  IconIdBadge2,
  IconUserCircle,
  IconClipboardCheck,
  IconCheck,
  IconX,
  IconPlus,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconArrowRight,
  IconMinus,
  IconPencil, IconGavel, IconKey, IconCalendarEvent, IconUserCheck,
  IconTrash,
  IconUpload,
  IconLock,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import { PreScreeningModal } from "../PreScreeningModal/PreScreeningModal";
import { EnrichmentModal } from "../Enrichment/EnrichmentModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION,
  DUMMY_PRESCREENING_CONTEXT,
  DUMMY_PRESCREENING_DATA,
  DUMMY_ENRICHMENT_TERMS,
  DUMMY_ASSET_TYPES,
  DUMMY_SEED_ASSET_BASE,
  getApplicableChecks,
  type DummyAssetBase,
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

export const zmw = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : "ZMW " + Math.round(Number(n)).toLocaleString();

function calcEligibility({
  income,
  obligations,
  maxDTI,
  annualRate,
  tenureMonths,
  productMax,
  creditScore,
  minCreditScore,
}: {
  income: number;
  obligations: number;
  maxDTI: number;
  annualRate: number;
  tenureMonths: number;
  productMax: number;
  creditScore: number;
  minCreditScore: number;
}) {
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount =
    r > 0 ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r) : capacity * tenureMonths;
  const eligibleAmount = creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0;
  return { eligibleAmount, mandatoryPassed: creditPassed && dtiPassed, customerDTI, creditPassed, dtiPassed };
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export function ReadRow({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <Box style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <Text fz={11} c="gray.6" mb={3} fw={500}>
        {label}
      </Text>
      <Text fz={14} fw={600} c="dark.8">
        {value ?? "—"}
      </Text>
    </Box>
  );
}

export function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box>
      <Text fz={11} c="dimmed">
        {label}
      </Text>
      <Text fz={16} fw={700} c={accent ? "orange.7" : "dark.7"}>
        {value}
      </Text>
    </Box>
  );
}

function SimRow({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <Group justify="space-between" py={6} style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-gray-1)" }}>
      <Text fz={12.5} c="dimmed">
        {label}
      </Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="dark.8">
        {value}
      </Text>
    </Group>
  );
}

// Section headings now accept a color so they can pick up the card's accent
// instead of every heading in the page rendering as the same flat gray.
export function SectionLabel({ children, color = "dark.6", icon: Icon }: { children: React.ReactNode; color?: string; icon?: React.FC<any> }) {
  return (
    <Group gap={6} align="center" wrap="nowrap">
      {Icon && (
        <ThemeIcon variant="transparent" size="sm" color={color} style={{ display: 'flex', alignItems: 'center' }}>
           <Icon size={16} stroke={2.5} />
        </ThemeIcon>
      )}
      <Text fz={11.5} fw={700} c={color} tt="uppercase" style={{ letterSpacing: 0.5 }}>
        {children}
      </Text>
    </Group>
  );
}

function SectionHeader({ icon: Icon, title, right, color = "brand" }: { icon: React.FC<any>; title: string; right?: React.ReactNode; color?: string }) {
  return (
    <Group justify="space-between" align="center" mb={10}>
      <Group gap={8}>
        <ThemeIcon radius="md" size={24} variant="light" color={color}>
          <Icon size={13.5} />
        </ThemeIcon>
        <SectionLabel color={`${color}.8`}>{title}</SectionLabel>
      </Group>
      {right}
    </Group>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "gray",
  "In Progress": "brand",
  Passed: "green",
  Failed: "red",
  Exception: "orange",
  Missing: "gray",
  Uploaded: "brand",
  Verified: "green",
  Rejected: "red",
};
function StatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" radius="xl" color={STATUS_COLORS[status] || "gray"} variant="light">
      {status}
    </Badge>
  );
}

export const CHECK_STATUSES = ["Pending", "In Progress", "Passed", "Failed", "Exception"];
const DOC_STATUSES = ["Missing", "Uploaded", "Verified", "Rejected"];

// ---------------------------------------------------------------------------
// Top app bar
// ---------------------------------------------------------------------------

function TopBar({ onMinimize, onClose, embedded }: { onMinimize: () => void; onClose: () => void; embedded?: boolean }) {
  return (
    <Group justify="space-between" align="center" px="xl" py={8} bg="brand.7" style={{ flexShrink: 0 }}>
      <Group gap={10}>
        <ThemeIcon radius="md" size={30} variant="white" color="brand">
          <IconFileText size={15} />
        </ThemeIcon>
        <Box>
          <Text fz={13.5} fw={700} c="white">
            Loan Application
          </Text>
          <Text fz={11} c="brand.1">
            Step 4 • Underwriting
          </Text>
        </Box>
      </Group>
      <Group gap={14} wrap="nowrap">
        <ActionIcon variant="subtle" color="white" radius="xl">
          <IconBell size={17} color="white" />
        </ActionIcon>
        <Group gap={6}>
          <Avatar radius="xl" size={28} color="brand" variant="white">
            <Text fz={11} fw={700} c="brand.7">
              DT
            </Text>
          </Avatar>
          <IconChevronDown size={14} color="white" />
        </Group>
        {!embedded && (
          <>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onMinimize} aria-label="Minimize">
              <IconMinus size={16} color="white" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="white" radius="xl" size="md" onClick={onClose} aria-label="Close">
              <IconX size={16} color="white" />
            </ActionIcon>
          </>
        )}
      </Group>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Underwriting sub-tabs (flat list, shown as nested items in the left nav
// instead of a separate top tab bar + progress stepper inside the workspace)
// ---------------------------------------------------------------------------

type Section = "application" | "prescreening" | "appraisal" | "underwriting";
// "assetDocs" is the Asset Valuation flow's own Supporting Documents step
// (previously embedded inline at the bottom of the Valuation & Verification
// panel). It now lives as its own step, mirroring "legalDocs" on the
// Legal Verification side, and both share the same label
// ("Supporting Documents") so the naming is consistent across both flows.
export type PanelId = "assetDetails" | "valuation" | "assetDocs" | "legal" | "legalDocs" | "notes" | "assetConclusion" | "conclusion";
type TabId = "asset" | "legal";

interface PanelItem {
  id: PanelId;
  label: string;
  icon: React.FC<any>;
  color: string;
}

// Content panels are still tracked individually (used for section headers,
// etc.) but navigation only ever exposes the two groups below.
const PANEL_ITEMS: PanelItem[] = [
  { id: "assetDetails", label: "Asset", icon: IconIdBadge2, color: "blue" },
  { id: "assetDocs", label: "Supporting Documents", icon: IconFileText, color: "blue" },
  { id: "valuation", label: "Valuation", icon: IconCar, color: "brand" },
  { id: "legalDocs", label: "Supporting Documents", icon: IconFileText, color: "violet" },
  { id: "legal", label: "Legal", icon: IconIdBadge2, color: "violet" },
  { id: "notes", label: "Underwriter Notes", icon: IconFileText, color: "gray" },
  { id: "assetConclusion", label: "Security outcome", icon: IconClipboardCheck, color: "blue" },
  { id: "conclusion", label: "Security outcome", icon: IconClipboardCheck, color: "brand" },
];

// The only two sub-tabs shown in the sidebar. Each groups a sequence of
// panels, paged through via the in-content "next" arrow.
//
// IMPORTANT ORDERING FIX:
// Documents must always come BEFORE the step that relies on them, because
// a valuation or a legal check should never be marked "Passed"/"Verified"
// against evidence nobody has uploaded yet:
//   Asset tab:  Details -> Supporting Documents -> Valuation -> Notes -> Conclusion
//   Legal tab:  Supporting Documents -> Verifier & Checks -> Notes -> Conclusion
interface TabItem {
  id: TabId;
  label: string;
  icon: React.FC<any>;
  steps: PanelId[];
}
const TAB_ITEMS: TabItem[] = [
  { id: "asset", label: "Asset Valuation", icon: IconCircleCheck, steps: ["assetDetails", "valuation", "assetConclusion"] },
  { id: "legal", label: "Legal Verification", icon: IconShieldCheck, steps: ["legal", "conclusion"] },
];

// ---------------------------------------------------------------------------
// Left sidebar — now owns the underwriting sub-navigation. When the active
// section is "underwriting", the Underwriting item expands in place to show
// PANEL_ITEMS as nested sub-tabs instead of the old top tab bar + stepper.
// ---------------------------------------------------------------------------

function LeftNav({
  section,
  setSection,
  values,
  tab,
  setTab,
}: {
  section: Section;
  setSection: (s: Section) => void;
  values: LoanApplicationValues;
  tab: TabId;
  setTab: (t: TabId) => void;
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
        <Avatar radius="xl" size={34} color="brand" variant="light">
          {initials || "—"}
        </Avatar>
        <Box>
          <Text fz={13} fw={700} c="dark.8">
            {name || "—"}
          </Text>
          <Text fz={11.5} c="dimmed">
            {isBusiness ? "Business Loan" : "Personal Loan"}
          </Text>
        </Box>
      </Group>

      <Stack gap={2} p={10}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          return (
            <Box key={it.id}>
              <UnstyledButton onClick={() => setSection(it.id)} px={10} py={9} style={{ borderRadius: 8, width: "100%" }}>
                <Group gap={9} justify="space-between" wrap="nowrap">
                  <Group gap={9} wrap="nowrap">
                    {active ? (
                      <Box w={8} h={8} style={{ borderRadius: "50%", background: "var(--mantine-color-brand-6)", flexShrink: 0 }} />
                    ) : (
                      <Icon size={15} color="var(--mantine-color-gray-6)" style={{ flexShrink: 0 }} />
                    )}
                    <Text fz={13} fw={active ? 700 : 500} c={active ? "brand.7" : "dark.6"}>
                      {it.label}
                    </Text>
                  </Group>
                  {it.done && (
                    <ThemeIcon radius="xl" size={16} color="brand" variant="light">
                      <IconCheck size={11} />
                    </ThemeIcon>
                  )}
                </Group>
              </UnstyledButton>

              {/* Sub-tabs for Underwriting, nested right under the item */}
              {it.id === "underwriting" && active && (
                <Stack gap={1} pl={27} pr={4} py={2}>
                  {TAB_ITEMS.map((t) => {
                    const tActive = tab === t.id;
                    const TIcon = t.icon;
                    return (
                      <UnstyledButton
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        px={9}
                        py={7}
                        style={{
                          borderRadius: 7,
                          borderLeft: `2px solid ${tActive ? "var(--mantine-color-brand-6)" : "transparent"}`,
                          background: tActive ? "var(--mantine-color-brand-0)" : "transparent",
                        }}
                      >
                        <Group gap={7} wrap="nowrap">
                          <TIcon size={13} color={tActive ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
                          <Text fz={12} fw={tActive ? 700 : 500} c={tActive ? "brand.8" : "dark.5"}>
                            {t.label}
                          </Text>
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
// Asset model (multi-asset, with KYC + title-information fields)
// ---------------------------------------------------------------------------

export interface AssetDoc {
  name: string;
  tier: "required" | "optional";
  status: string;
  uploadedDate: string;
  uploadedBy: string;
  validUntil: string;
  fileMeta: string;
  comment: string;
}

export interface TitleChecklistItem {
  id: string;
  label: string;
  status: string;
  comment: string;
}

export interface LegalCheck {
  id: string;
  name: string;
  status: string;
  finding: string;
  why: string;
  action: string;
  comment: string;
}

export interface Asset {
  id: string;
  source: "application" | "manual";
  base: DummyAssetBase;
  kycVerified: boolean;
  valuation: { amount: string; currency: string; method: string; marketValue: string; forcedSaleValue: string; notes: string };
  valuer: { name: string; company: string; license: string; contact: string; verified: boolean };
  valuationDate: string;
  expiryDays: number;
  status: string;
  reason: string;
  docs: AssetDoc[];
  title: {
    titleNumber: string;
    propertyRef: string;
    propertyType: string;
    location: string;
    registrationInfo: string;
    registeredOwner: string;
  };
  legalVerifier: { name: string; company: string; role: string; license: string; contact: string };
  titleChecklist: TitleChecklistItem[];
  titleDocs: AssetDoc[];
  legalChecks: LegalCheck[];
  // Asset Validation tab's own Conclusion & Decision (asset-level outcome only)
  assetOverallAssessment: string;
  assetRemarks: string;
  assetAssignee: string;
  assetDecisionStatus: string;
  assetDecision: Decision;
  assetConditions: Condition[];
  assetReasonCategory: string;
  assetReasonDetail: string;
}

let assetSeq = 1;
function makeAsset(source: "application" | "manual", base: DummyAssetBase): Asset {
  const id = "asset-" + assetSeq++;
  const emptyDoc = (name: string, tier: "required" | "optional"): AssetDoc => ({
    name,
    tier,
    status: "Missing",
    uploadedDate: "",
    uploadedBy: "",
    validUntil: "",
    fileMeta: "",
    comment: "",
  });
  return {
    id,
    source,
    base,
    kycVerified: false,
    valuation: { amount: "", currency: "ZMW", method: "Market comparison", marketValue: "", forcedSaleValue: "", notes: "" },
    valuer: { name: "", company: "", license: "", contact: "", verified: false },
    valuationDate: "",
    expiryDays: 180,
    status: "Pending",
    reason: "",
    docs: [emptyDoc("Valuation report", "required"), emptyDoc("Asset photos", "required"), emptyDoc("Ownership document", "required")],
    title: {
      titleNumber: "",
      propertyRef: base?.assetId || "",
      propertyType: base?.type || "",
      location: base?.location || "",
      registrationInfo: "",
      registeredOwner: base?.owner || "",
    },
    legalVerifier: { name: "", company: "", role: "", license: "", contact: "" },
    titleChecklist: [
      { id: "titleVerified", label: "Title verified", status: "Pending", comment: "" },
      { id: "ownershipVerified", label: "Ownership verified", status: "Pending", comment: "" },
      { id: "encumbrances", label: "Encumbrances checked", status: "Pending", comment: "" },
      { id: "liens", label: "Existing liens checked", status: "Pending", comment: "" },
      { id: "restrictions", label: "Restrictions checked", status: "Pending", comment: "" },
    ],
    titleDocs: [
      emptyDoc("Title deed / ownership document", "required"),
      emptyDoc("Search report", "required"),
      emptyDoc("Legal opinion", "optional"),
    ],
    legalChecks: (getApplicableChecks(base?.type || "") || []).map((c) => ({
      id: c?.id ?? Math.random().toString(36).slice(2),
      name: c?.name ?? "Legal check",
      status: c?.defaultStatus ?? "Pending",
      finding: c?.finding ?? "",
      why: c?.why || "",
      action: c?.action || "",
      comment: "",
    })),
    assetOverallAssessment: "Review Required",
    assetRemarks: "",
    assetAssignee: "Internal team",
    assetDecisionStatus: "Review Required",
    assetDecision: null,
    assetConditions: [],
    assetReasonCategory: "",
    assetReasonDetail: "",
  };
}

function makeSeedAsset(): Asset {
  const a = makeAsset("application", DUMMY_SEED_ASSET_BASE);
  a.kycVerified = true;
  a.docs = [
    {
      name: "Valuation report",
      tier: "required",
      status: "Verified",
      uploadedDate: "3 Sep 2026",
      uploadedBy: "Field valuer",
      validUntil: "3 Mar 2027",
      fileMeta: "valuation_03sep2026.pdf (2.4 MB)",
      comment: "",
    },
    {
      name: "Asset photos",
      tier: "required",
      status: "Verified",
      uploadedDate: "3 Sep 2026",
      uploadedBy: "Field valuer",
      validUntil: "",
      fileMeta: "photos_03sep2026.zip (4.8 MB)",
      comment: "",
    },
    {
      name: "Ownership document",
      tier: "required",
      status: "Missing",
      uploadedDate: "",
      uploadedBy: "",
      validUntil: "",
      fileMeta: "",
      comment: "",
    },
  ];
  a.titleChecklist = [
    { id: "titleVerified", label: "Title verified", status: "Passed", comment: "" },
    { id: "ownershipVerified", label: "Ownership verified", status: "Passed", comment: "" },
    { id: "encumbrances", label: "Encumbrances checked", status: "Exception", comment: "" },
    { id: "liens", label: "Existing liens checked", status: "Passed", comment: "" },
    { id: "restrictions", label: "Restrictions checked", status: "Passed", comment: "" },
  ];
  a.titleDocs = [
    { name: "Title deed / ownership document", tier: "required", status: "Verified", uploadedDate: "4 Sep 2026", uploadedBy: "Legal officer", validUntil: "", fileMeta: "title_deed.pdf (1.1 MB)", comment: "" },
    { name: "Search report", tier: "required", status: "Verified", uploadedDate: "4 Sep 2026", uploadedBy: "Legal officer", validUntil: "", fileMeta: "search_report.pdf (0.8 MB)", comment: "" },
    { name: "Legal opinion", tier: "optional", status: "Missing", uploadedDate: "", uploadedBy: "", validUntil: "", fileMeta: "", comment: "" },
  ];
  return a;
}

// ---------------------------------------------------------------------------
// Doc readiness helpers — used everywhere a check / valuation status is
// about to be marked "Passed"/"Verified" so that can never happen ahead of
// the evidence (required documents) actually being verified.
// ---------------------------------------------------------------------------

export function requiredDocsVerified(docs: AssetDoc[]): boolean {
  const required = docs.filter((d) => d.tier === "required");
  if (required.length === 0) return true;
  return required.every((d) => d.status === "Verified");
}

export function missingRequiredDocs(docs: AssetDoc[]): AssetDoc[] {
  return docs.filter((d) => d.tier === "required" && d.status !== "Verified");
}

function DocsGateBanner({ missing, context }: { missing: AssetDoc[]; context: string }) {
  if (missing.length === 0) return null;
  return (
    <Group gap={8} p={10} mb={14} bg="orange.0" style={{ border: "1px solid var(--mantine-color-orange-3)", borderRadius: 9 }} wrap="nowrap" align="flex-start">
      <IconLock size={14} color="var(--mantine-color-orange-7)" style={{ flexShrink: 0, marginTop: 1 }} />
      <Text fz={11.5} lh={1.4} c="orange.9">
        {missing.length} required document{missing.length > 1 ? "s" : ""} still need{missing.length > 1 ? "" : "s"} to be verified before {context} can be marked Passed — {missing.map((d) => d.name).join(", ")}.
      </Text>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Compact check row — checkbox + flag-as-exception
// ---------------------------------------------------------------------------

export function CompactCheckRow({
  label,
  checked,
  exception,
  note,
  onToggle,
  onFlag,
  onNoteChange,
  disabled,
  disabledReason,
}: {
  label: string;
  checked: boolean;
  exception: boolean;
  note: string;
  onToggle: () => void;
  onFlag: () => void;
  onNoteChange: (v: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <Box py={5} style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}>
      <Group gap={8} wrap="nowrap" align="center">
        <Tooltip label={disabledReason} disabled={!disabled} withArrow>
          <Checkbox checked={checked} disabled={exception || disabled} onChange={onToggle} size="xs" />
        </Tooltip>
        <Text fz={12.5} c={exception ? "orange.8" : disabled ? "gray.5" : "dark.6"} style={{ flex: 1 }}>
          {label}
        </Text>
        {disabled && !checked && <IconLock size={12} color="var(--mantine-color-gray-4)" />}
        <ActionIcon variant="subtle" color={exception ? "orange" : "gray"} size="sm" onClick={onFlag} title="Flag as exception">
          <IconAlertTriangle size={14} />
        </ActionIcon>
      </Group>
      {exception && (
        <TextInput
          value={note}
          onChange={(e) => onNoteChange(e.currentTarget.value)}
          placeholder="What was found, and what's required to resolve it…"
          size="xs"
          radius="md"
          mt={5}
          error={!note}
        />
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Documents table (editable, with file meta / validity line + colored status)
// ---------------------------------------------------------------------------

export function DocumentsTable({ title, docs, setDocs }: { title: string; docs: AssetDoc[]; setDocs: (d: AssetDoc[]) => void }) {
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const update = (i: number, patch: Partial<AssetDoc>) => setDocs(docs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDoc = () =>
    setDocs([
      ...docs,
      { name: "New document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", validUntil: "", fileMeta: "", comment: "" },
    ]);
  const removeDoc = (i: number) => setDocs(docs.filter((_, idx) => idx !== i));

  const triggerUpload = (i: number) => fileInputRefs.current[i]?.click();

  const handleFileSelected = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    update(i, {
      status: "Uploaded",
      fileMeta: `${file.name} (${sizeMb} MB)`,
      uploadedDate: today,
      uploadedBy: "You",
    });
    // reset input so the same file can be re-selected later if needed
    e.target.value = "";
  };

  const required = docs.filter((d) => d.tier === "required");
  const requiredVerified = required.filter((d) => d.status === "Verified").length;

  return (
    <Box>
      {/* Progress summary so the reviewer always knows how much is left
          before the next (Valuation / Legal checks) step can pass. */}
      <Group justify="space-between" mb={10} align="center">
        <Text fz={11.5} c={requiredVerified === required.length ? "green.7" : "orange.7"} fw={600}>
          {required.length === 0
            ? "No required documents configured"
            : `${requiredVerified}/${required.length} required documents verified`}
        </Text>
        <Button size="compact-sm" variant="light" color="brand" radius="xl" leftSection={<IconPlus size={13} />} onClick={addDoc}>
          Add documents
        </Button>
      </Group>
      <SimpleGrid cols={3} spacing={12}>
        {docs.length === 0 && (
          <Text fz={12.5} c="dimmed" ta="center" py="md" style={{ gridColumn: "1 / -1" }}>
            No documents added yet.
          </Text>
        )}
        {docs.map((d, i) => (
          <Paper key={i} withBorder radius="md" p={10} style={{ display: "flex", flexDirection: "column" }}>
            <Group gap={8} wrap="nowrap" align="flex-start" mb={6}>
              <ThemeIcon radius="md" size={28} variant="light" color={STATUS_COLORS[d.status] || "blue"} style={{ flexShrink: 0 }}>
                <IconFileText size={14} />
              </ThemeIcon>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextInput
                  value={d.name}
                  onChange={(e) => update(i, { name: e.currentTarget.value })}
                  size="sm"
                  variant="transparent"
                  placeholder="Document name"
                  styles={{ input: { fontWeight: 600, fontSize: 12.5, color: "var(--mantine-color-dark-7)", padding: 0, minHeight: 20, height: 20, border: "none", background: "transparent" } }}
                />
                <Select
                  data={["required", "optional"]}
                  value={d.tier}
                  onChange={(v) => update(i, { tier: (v as "required" | "optional") || "required" })}
                  size="xs"
                  variant="transparent"
                  allowDeselect={false}
                  styles={{
                    input: { fontSize: 11, color: "var(--mantine-color-gray-5)", padding: 0, minHeight: 16, height: 16, border: "none", background: "transparent", cursor: "pointer" },
                    wrapper: { width: 90 },
                    rightSection: { width: 12 },
                  }}
                />
              </Box>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => removeDoc(i)}>
                <IconX size={13} />
              </ActionIcon>
            </Group>
            <Text fz={10.5} c="dimmed" mb={8} lineClamp={2}>
              {d.fileMeta || `uploaded ${d.uploadedDate || "—"}${d.uploadedBy ? ` by ${d.uploadedBy}` : ""}`}
              {d.validUntil ? ` · valid until ${d.validUntil}` : ""}
            </Text>

            {/* hidden native file input, one per card, used to actually pick a file */}
            <input
              type="file"
              ref={(el) => (fileInputRefs.current[i] = el)}
              style={{ display: "none" }}
              onChange={(e) => handleFileSelected(i, e)}
            />

            <Group gap={6} wrap="nowrap" mb={8}>
              <Button
                size="compact-xs"
                variant="light"
                color="brand"
                radius="xl"
                style={{ flex: 1 }}
                leftSection={<IconUpload size={12} />}
                onClick={() => triggerUpload(i)}
              >
                {d.fileMeta ? "Replace" : "Upload"}
              </Button>
              {d.fileMeta && (
                <Button size="compact-xs" variant="default" radius="xl" style={{ flex: 1 }}>
                  Preview
                </Button>
              )}
              <Select
                data={d.fileMeta ? DOC_STATUSES : DOC_STATUSES.filter((s) => s === "Missing")}
                value={d.status}
                onChange={(v) => update(i, { status: v || d.status })}
                size="xs"
                radius="xl"
                style={{ flex: 1 }}
                allowDeselect={false}
                disabled={!d.fileMeta}
                color={STATUS_COLORS[d.status]}
                styles={{
                  input: {
                    fontWeight: 600,
                    fontSize: 11,
                    color: `var(--mantine-color-${STATUS_COLORS[d.status] || "gray"}-7)`,
                    background: `var(--mantine-color-${STATUS_COLORS[d.status] || "gray"}-0)`,
                    borderColor: `var(--mantine-color-${STATUS_COLORS[d.status] || "gray"}-3)`,
                  },
                }}
              />
            </Group>
            <TextInput value={d.comment} onChange={(e) => update(i, { comment: e.currentTarget.value })} placeholder="Verification comment (optional)" size="xs" radius="md" mt="auto" />
          </Paper>
        ))}
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Asset switcher — chips to add, EDIT and remove assets offered as security
// ---------------------------------------------------------------------------

function AssetBaseForm({
  type,
  assetId,
  desc,
  onTypeChange,
  onAssetIdChange,
  onDescChange,
  descError,
  onSubmit,
  onCancel,
  submitLabel,
  title,
}: {
  type: string;
  assetId: string;
  desc: string;
  onTypeChange: (v: string) => void;
  onAssetIdChange: (v: string) => void;
  onDescChange: (v: string) => void;
  descError: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  title: string;
}) {
  return (
    <Paper withBorder radius="md" p={10} bg="gray.0">
      <Group justify="space-between" align="center" mb={8}>
        <Text fz={11.5} fw={700} c="dark.6">
          {title}
        </Text>
        <ActionIcon variant="subtle" color="gray" radius="xl" size="xs" onClick={onCancel} aria-label="Close">
          <IconX size={12} />
        </ActionIcon>
      </Group>
      <Group align="flex-end" gap={8} wrap="wrap">
        <Select size="xs" label="Asset type" data={DUMMY_ASSET_TYPES} value={type} onChange={(v) => onTypeChange(v || DUMMY_ASSET_TYPES[0])} w={160} radius="md" />
        <TextInput size="xs" label="Asset ID" value={assetId} onChange={(e) => onAssetIdChange(e.currentTarget.value)} placeholder="e.g. AST-33022" w={140} radius="md" />
        <TextInput
          size="xs"
          label="Description"
          value={desc}
          onChange={(e) => onDescChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="e.g. Stand 4521, Kabwata, Lusaka"
          style={{ flex: 1, minWidth: 180 }}
          radius="md"
          error={descError ? "Required" : undefined}
        />
        <Button size="xs" onClick={onSubmit} radius="md">
          {submitLabel}
        </Button>
        <Button size="xs" variant="default" radius="md" onClick={onCancel}>
          Cancel
        </Button>
      </Group>
    </Paper>
  );
}

export function ValidityNote({ date, days }: { date: string; days: number }) {
  if (!date)
    return (
      <Text fz={12.5} c="dimmed" py={6}>
        Set a valuation date to see validity
      </Text>
    );
  const valDate = new Date(date);
  const expiry = new Date(valDate);
  expiry.setDate(expiry.getDate() + days);
  const daysLeft = Math.round((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const expired = daysLeft < 0;
  return (
    <Group gap={6} py={6}>
      {expired ? <IconCircleX size={14} color="var(--mantine-color-red-6)" /> : <IconCircleCheck size={14} color="var(--mantine-color-green-6)" />}
      <Text fz={12.5} fw={600} c={expired ? "red.6" : "green.7"}>
        {expired ? "Valuation expired" : `Valid for ${daysLeft} more days`}
      </Text>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

export type Decision = "approve" | "conditions" | "refer" | "reject" | null;

export const DECISION_LABEL: Record<string, string> = {
  approve: "Approve / Proceed",
  conditions: "Approve with Conditions",
  refer: "Refer / Further Revision",
  reject: "Reject",
};

export const REJECT_REASONS = ["Insufficient collateral", "Ownership issue", "Legal risk", "Invalid documentation", "Unresolved exception", "Valuation issue", "Other"];

export interface Condition {
  condition: string;
  responsible: string;
  dueBefore: string;
}

interface Readiness {
  valuationOk: boolean;
  titleOk: boolean;
  legalOk: boolean;
  docsOk: boolean;
  ready: boolean;
  blockers: string[];
}

// All four decision options render with the same light-tint card style and
// an (unselected) radio circle, so none visually outranks the others —
// matches the reference layout: colored icon in a filled circle on the
// left, label + caption stacked beside it, radio indicator on the right.
export function DecisionButton({
  label,
  caption,
  color,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  caption?: string;
  color: string;
  icon: React.FC<any>;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      disabled={disabled}
      p={14}
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-gray-3)",
        background: "white",
        textAlign: "left",
        transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = `var(--mantine-color-${color}-5)`;
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--mantine-shadow-sm)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "var(--mantine-color-gray-3)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <Group gap={12} wrap="nowrap" align="center">
        <ThemeIcon radius="md" size={32} variant="light" color={color}>
          <Icon size={18} />
        </ThemeIcon>
        <Box>
          <Text fz={13} fw={600} c="dark.8">
            {label}
          </Text>
          {caption && (
            <Text fz={11} c="dimmed" mt={2} lh={1.2}>
              {caption}
            </Text>
          )}
        </Box>
      </Group>
    </UnstyledButton>
  );
}

// ---------------------------------------------------------------------------
// Asset Validation accordion card — one per asset. Each card owns its own
// expand/collapse state and its own active sub-tab (Asset Details /
// Valuation & Verification / Supporting Documents / Underwriter Notes /
// Conclusion & Decision), so multiple assets can be reviewed side by side
// without a separate asset switcher.
// ---------------------------------------------------------------------------

function AssetListItem({
  asset,
  index,
  onClick,
  onRemove,
  onUpdateBase,
  titleBadgeLabel,
}: {
  asset: Asset;
  index: number;
  onClick: () => void;
  onRemove: () => void;
  onUpdateBase: (patch: Partial<DummyAssetBase>) => void;
  titleBadgeLabel: string;
}) {
  const [editingBase, setEditingBase] = useState(false);
  const AssetIcon = (asset.base.type || "").toLowerCase().includes("vehicle") ? IconCar : IconBuildingBank;
  const name = asset.base.description ? asset.base.description.split(",")[0] : asset.base.type || "�";

  return (
    <>
      <Paper
        withBorder
        radius="md"
        mb={8}
        onClick={onClick}
        style={{
          borderLeftWidth: 4,
          borderLeftColor: "var(--mantine-color-brand-6)",
          cursor: "pointer",
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--mantine-shadow-sm)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" px={14} py={8}>
          <Group gap={12} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <ThemeIcon radius="md" size={30} variant="light" color="brand">
              <AssetIcon size={16} />
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Group gap={8} wrap="nowrap" align="center">
                <Badge size="xs" radius="xl" color="brand" variant="light" style={{ flexShrink: 0 }}>
                  {titleBadgeLabel} {index + 1}
                </Badge>
                <Text fz={13.5} fw={700} c="dark.8" truncate lh={1.2}>
                  {name}
                </Text>
              </Group>
              {asset.base.assetId && (
                <Text fz={11.5} c="dimmed" mt={3} truncate lh={1.1}>
                  {asset.base.assetId}
                </Text>
              )}
            </Box>
          </Group>
          <Group gap={10} wrap="nowrap" style={{ flexShrink: 0 }}>
            <StatusBadge status={asset.status} />
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={(e) => { e.stopPropagation(); setEditingBase(!editingBase); }} title="Edit basic info">
              <IconPencil size={15} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" size="sm" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove">
              <IconTrash size={15} />
            </ActionIcon>
            <IconChevronRight size={16} color="var(--mantine-color-gray-4)" />
          </Group>
        </Group>
      </Paper>
      {editingBase && (
        <Paper withBorder radius="md" p="md" mb={12} mt={-4} bg="gray.0">
          <AssetBaseForm
            type={asset.base.type}
            assetId={asset.base.assetId || ""}
            desc={asset.base.description || ""}
            onTypeChange={(t) => onUpdateBase({ type: t })}
            onAssetIdChange={(i) => onUpdateBase({ assetId: i })}
            onDescChange={(d) => onUpdateBase({ description: d })}
            descError={false}
            onSubmit={() => setEditingBase(false)}
            onCancel={() => setEditingBase(false)}
            submitLabel="Save changes"
            title="Edit Basic Info"
          />
        </Paper>
      )}
    </>
  );
}

function UnderwritingWorkspace({
  finalAmount,
  applicationId,
  loanTypeLabel,
  onBack,
  onSubmitReady,
  tab: tabProp,
  onTabChange,
}: {
  finalAmount: number;
  applicationId: string;
  loanTypeLabel: string;
  onBack?: () => void;
  onSubmitReady?: (canSubmit: boolean, submit: () => void) => void;
  tab?: TabId;
  onTabChange?: (t: TabId) => void;
}) {
  const [internalTab, setInternalTab] = useState<TabId>("asset");
  const tab = tabProp ?? internalTab;
  const setTab = (t: TabId) => (onTabChange ? onTabChange(t) : setInternalTab(t));
  const isControlled = !!onTabChange;

  const steps = TAB_ITEMS.find((t) => t.id === tab)?.steps ?? TAB_ITEMS[0].steps;
  const [panel, setPanelRaw] = useState<PanelId>(steps[0]);

  const [assetViewMode, setAssetViewMode] = useState<'list'|'detail'>('list');
  const [legalViewMode, setLegalViewMode] = useState<'list'|'detail'|'conclusion'>('list');

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedLegalId, setSelectedLegalId] = useState<string | null>(null);

  useEffect(() => {
    setPanelRaw(steps[0]);
    // Reset view mode when switching main tabs
    if (tab === 'asset') {
      if (selectedAssetId) setAssetViewMode('detail');
      else setAssetViewMode('list');
    } else {
      if (selectedLegalId) setLegalViewMode('detail');
      else setLegalViewMode('list');
    }
  }, [tab]);
  const setPanel = (id: PanelId) => setPanelRaw(id);

  const [assets, setAssets] = useState<Asset[]>(() => [makeSeedAsset()]);
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState("Internal team");
  const [decisionStatus, setDecisionStatus] = useState("Review Required");
  const [decision, setDecision] = useState<Decision>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [completed, setCompleted] = useState(false);

  // "Add Asset" is now a mini multi-step draft flow: Basic Details ->
  // Supporting Documents -> Valuation. The asset only actually gets added
  // to the list at the very end, once everything (including documents) has
  // been filled in — not the moment basic info is entered.
  const [draftAsset, setDraftAsset] = useState<Asset | null>(null);
  const [draftPanel, setDraftPanel] = useState<PanelId>("assetDetails");
  // Reuses the same step list as the Asset Valuation tab (Details ->
  // Documents -> Valuation -> Underwriter Notes -> Conclusion), so the
  // draft wizard and the "edit an existing asset" view stay in sync.
  const draftSteps = steps;

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedLegal = assets.find((a) => a.id === selectedLegalId);

  function updateAsset(id: string, patch: Partial<Asset>) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function editAssetBase(id: string, patch: Partial<DummyAssetBase>) {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    updateAsset(id, { base: { ...asset.base, ...patch } });
  }
  function removeAsset(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAssetId === id) {
      setSelectedAssetId(null);
      setAssetViewMode('list');
    }
    if (selectedLegalId === id) {
      setSelectedLegalId(null);
      setLegalViewMode('list');
    }
  }
  function updateChecklist(assetId: string, itemId: string, patch: Partial<TitleChecklistItem>) {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    updateAsset(assetId, { titleChecklist: asset.titleChecklist.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  }
  function updateLegalCheck(assetId: string, checkId: string, patch: Partial<LegalCheck>) {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    updateAsset(assetId, { legalChecks: asset.legalChecks.map((c) => (c.id === checkId ? { ...c, ...patch } : c)) });
  }
  function addCondition() {
    setConditions((prev) => [...prev, { condition: "", responsible: "Customer", dueBefore: "Disbursement" }]);
  }
  function updateCondition(i: number, patch: Partial<Condition>) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeCondition(i: number) {
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  }
  function openAddAsset() {
    const newAsset = makeAsset("manual", {
      type: DUMMY_ASSET_TYPES[0],
      description: "",
      assetId: "",
      location: "",
      owner: "",
      acquisition: "",
    });
    setAssets(prev => [...prev, newAsset]);
    setSelectedAssetId(newAsset.id);
    setAssetViewMode('detail');
    setPanel('assetDetails');
  }

  const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.valuation.amount) || 0), 0);
  const totalCoverage = totalAssetValue ? Math.round((totalAssetValue / finalAmount) * 100) : null;

  const readiness: Readiness = useMemo(() => {
    const blockers: string[] = [];
    let valuationOk = true,

      titleOk = true,
      legalOk = true,
      docsOk = true;

    assets.forEach((a, i) => {
      const label = `Asset ${i + 1}`;

      const assetDocsMissing = missingRequiredDocs(a.docs);
      if (assetDocsMissing.length) {
        docsOk = false;
        blockers.push(`${label}: ${assetDocsMissing.length} required asset document(s) not yet verified — ${assetDocsMissing.map((d) => d.name).join(", ")}.`);
      }

      const aValuationOk = a.status === "Passed" || (["Failed", "Exception"].includes(a.status) && a.reason.trim());
      if (!aValuationOk) {
        valuationOk = false;
        blockers.push(`${label}: valuation status has not been finalized.`);
      }

      const titleDocsMissing = missingRequiredDocs(a.titleDocs);
      if (titleDocsMissing.length) {
        docsOk = false;
        blockers.push(`${label}: ${titleDocsMissing.length} required title document(s) not yet verified — ${titleDocsMissing.map((d) => d.name).join(", ")}.`);
      }

      const titleUnresolved = a.titleChecklist.filter(
        (i2) => i2.status === "Pending" || i2.status === "In Progress" || (["Failed", "Exception"].includes(i2.status) && !i2.comment.trim()),
      );
      if (titleUnresolved.length) {
        titleOk = false;
        blockers.push(`${label}: title verification has ${titleUnresolved.length} unresolved item(s) — ${titleUnresolved.map((i2) => i2.label).join(", ")}.`);
      }

      const legalUnresolved = a.legalChecks.filter((c) => ["Failed", "Exception"].includes(c.status) && !c.comment.trim());
      if (legalUnresolved.length) {
        legalOk = false;
        blockers.push(`${label}: legal checks have ${legalUnresolved.length} unresolved exception/failure — ${legalUnresolved.map((c) => c.name).join(", ")}.`);
      }
    });

    return { valuationOk, titleOk, legalOk, docsOk, ready: valuationOk && titleOk && legalOk && docsOk, blockers };
  }, [assets]);

  const allLegalChecks = assets.flatMap((a) => a.legalChecks);
  const legalCounts = {
    passed: allLegalChecks.filter((c) => c.status === "Passed").length,
    exception: allLegalChecks.filter((c) => c.status === "Exception").length,
    failed: allLegalChecks.filter((c) => c.status === "Failed").length,
  };

  const decisionReady =
    decision === "approve" ||
    (decision === "conditions" && conditions.length > 0 && conditions.every((c) => c.condition.trim())) ||
    ((decision === "refer" || decision === "reject") && !!reasonCategory);

  const canSubmit = completed;
  useEffect(() => {
    onSubmitReady?.(canSubmit, () => {});
  }, [canSubmit, onSubmitReady]);

  if (completed) {
    return (
      <Box py={70} px={30} ta="center">
        <ThemeIcon radius="xl" size={44} color="green" variant="light" mx="auto" mb={10}>
          <IconCircleCheck size={26} />
        </ThemeIcon>
        <Text fz="md" fw={700} c="dark.8">
          Underwriting completed
        </Text>
        <Text fz={12.5} c="dimmed" mt={6}>
          Decision: {decision ? DECISION_LABEL[decision] : "—"}
          {decision === "conditions" ? ` · ${conditions.length} condition(s)` : ""}
        </Text>
      </Box>
    );
  }

  return (
    <Box px={16} py={16}>
      {!isControlled && (
        <Group gap={6} mb={12} wrap="wrap">
          {TAB_ITEMS.map((t) => {
            const tActive = tab === t.id;
            const TIcon = t.icon;
            return (
              <Button
                key={t.id}
                size="compact-sm"
                radius="xl"
                variant={tActive ? "light" : "subtle"}
                color={tActive ? "brand" : "gray"}
                leftSection={<TIcon size={13} />}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </Button>
            );
          })}
        </Group>
      )}

      {tab === "asset" ? (
        <Box>
          {assetViewMode === 'detail' && selectedAsset ? (
            <Box>
              <Group mb={8} justify="space-between">
                 <UnstyledButton onClick={() => setAssetViewMode('list')} p={4}>
                    <Group gap={4} wrap="nowrap" c="dimmed" style={{ transition: 'color 150ms ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-brand-6)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mantine-color-gray-5)'}>
                       <IconChevronLeft size={16} />
                       <Text fz={13} fw={600}>Back to Assets</Text>
                    </Group>
                 </UnstyledButton>
                 
                 <Group gap={8}>
                   <Badge variant="light" color="brand" radius="xl">
                     Asset {assets.findIndex(a => a.id === selectedAsset.id) + 1}
                   </Badge>
                 </Group>
              </Group>

              <Paper withBorder radius="lg" mb={4} style={{ overflow: "hidden" }}>
                <Group gap={0} px={10} pt={10} pb={0} wrap="wrap">
                  {steps.map((stepId) => {
                    const item = PANEL_ITEMS.find((p) => p.id === stepId)!;
                    const stepActive = panel === stepId;
                    const SIcon = item.icon;
                    return (
                      <UnstyledButton
                        key={stepId}
                        onClick={() => setPanel(stepId)}
                        px={12}
                        pb={10}
                        style={{
                          borderBottom: `2px solid ${stepActive ? "var(--mantine-color-brand-6)" : "transparent"}`,
                          transition: "border-color 120ms ease",
                          cursor: "pointer",
                        }}
                      >
                        <Group gap={7}>
                          <SIcon size={14} color={stepActive ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
                          <Text fz={12.5} fw={stepActive ? 700 : 500} c={stepActive ? "brand.7" : "dark.5"}>
                            {item.label}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </Group>
              </Paper>

              <AssetDetailView
                asset={selectedAsset}
                finalAmount={finalAmount}
                panel={panel}
                notes={notes}
                setNotes={setNotes}
                onUpdate={(patch) => updateAsset(selectedAsset.id, patch)}
                editableBase
              />

              {(() => {
                const idx = steps.indexOf(panel);
                const isLastStep = idx === steps.length - 1;
                if (!isLastStep) {
                  return (
                    <Group justify="flex-end" mt={24} mb={12}>
                      <Button
                        radius="xl"
                        variant="filled"
                        color="brand"
                        onClick={() => setPanel(steps[idx + 1])}
                        rightSection={<IconArrowRight size={16} />}
                      >
                        Next
                      </Button>
                    </Group>
                  );
                }
                return (
                  <Group justify="flex-end" mt={24} mb={12}>
                    <Button variant="filled" color="brand" radius="xl" onClick={() => setAssetViewMode('list')}>
                      Save
                    </Button>
                  </Group>
                );
              })()}
            </Box>
          ) : (
            <Box>
              <Group justify="space-between" align="center" mb={14}>
                <Group gap={10}>
                  <ThemeIcon radius="md" size={34} variant="light" color="brand">
                    <IconShieldCheck size={17} />
                  </ThemeIcon>
                  <Text fz={16} fw={700} c="dark.8">
                    Asset Valuation{" "}
                    <Text span c="dimmed" fw={600}>
                      ({assets.length})
                    </Text>
                  </Text>
                </Group>
                <Button radius="xl" color="brand" leftSection={<IconPlus size={14} />} onClick={openAddAsset}>
                  Add Asset
                </Button>
              </Group>

              {assets.length === 0 ? (
                <Paper withBorder radius="lg" py={60} ta="center" bg="gray.0">
                  <ThemeIcon size={48} radius="xl" color="gray" variant="light" mb={12}>
                    <IconCar size={24} />
                  </ThemeIcon>
                  <Text fz="md" fw={600} c="dark.8">No assets added</Text>
                  <Text fz="sm" c="dimmed" mb={20}>Add an asset to begin valuation.</Text>
                  <Button radius="xl" color="brand" leftSection={<IconPlus size={14} />} onClick={openAddAsset}>
                    Add Asset
                  </Button>
                </Paper>
              ) : (
                <Box>
                <Paper withBorder radius="lg" p="md" bg="gray.0">
                  {assets.map((a, i) => (
                    <AssetListItem
                      key={a.id}
                      asset={a}
                      index={i}
                      titleBadgeLabel="Asset"
                      onClick={() => {
                        setSelectedAssetId(a.id);
                        setAssetViewMode('detail');
                        setPanel('assetDetails');
                      }}
                      onUpdateBase={(patch) => editAssetBase(a.id, patch)}
                      onRemove={() => removeAsset(a.id)}
                    />
                  ))}
                </Paper>
                </Box>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          {legalViewMode === 'detail' && selectedLegal ? (
            <Box>
              <Group mb={8} justify="space-between">
                 <UnstyledButton onClick={() => setLegalViewMode('list')} p={4}>
                    <Group gap={4} wrap="nowrap" c="dimmed" style={{ transition: 'color 150ms ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-brand-6)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mantine-color-gray-5)'}>
                       <IconChevronLeft size={16} />
                       <Text fz={13} fw={600}>Back to Assets</Text>
                    </Group>
                 </UnstyledButton>
                 
                 <Group gap={8}>
                   <Badge variant="light" color="brand" radius="xl">
                     Asset {assets.findIndex(a => a.id === selectedLegal.id) + 1}
                   </Badge>
                 </Group>
              </Group>

              <Paper withBorder radius="lg" mb={4} style={{ overflow: "hidden" }}>
                <Group gap={0} px={10} pt={10} pb={0} wrap="wrap">
                  {steps.map((stepId) => {
                    const item = PANEL_ITEMS.find((p) => p.id === stepId)!;
                    const stepActive = panel === stepId;
                    const SIcon = item.icon;
                    return (
                      <UnstyledButton
                        key={stepId}
                        onClick={() => setPanel(stepId)}
                        px={12}
                        pb={10}
                        style={{
                          borderBottom: `2px solid ${stepActive ? "var(--mantine-color-brand-6)" : "transparent"}`,
                          transition: "border-color 120ms ease",
                          cursor: "pointer",
                        }}
                      >
                        <Group gap={7}>
                          <SIcon size={14} color={stepActive ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
                          <Text fz={12.5} fw={stepActive ? 700 : 500} c={stepActive ? "brand.7" : "dark.5"}>
                            {item.label}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </Group>
              </Paper>

              {panel === 'conclusion' ? (
                <Box mt={12}>
                  <Paper withBorder radius="lg" style={{ overflow: "hidden" }} bg="white">
                  <Box px={24} pt={14} pb={12}>
                    
                    <SimpleGrid cols={3} spacing={8} mb={10}>
                      <Box
                        p={10}
                        bg={readiness.valuationOk ? "green.0" : "orange.0"}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: `1px solid var(--mantine-color-${readiness.valuationOk ? "green" : "orange"}-3)`,
                          borderLeftWidth: 3,
                          borderLeftColor: `var(--mantine-color-${readiness.valuationOk ? "green" : "orange"}-6)`,
                        }}
                      >
                        <Text fz={9.5} fw={700} c={readiness.valuationOk ? "green.7" : "orange.7"} tt="uppercase">
                          Assets ({assets.length})
                        </Text>
                        <Text fz={15} fw={700} c="dark.8" mt={1}>
                          {zmw(totalAssetValue)}
                        </Text>
                        <Text fz={10.5} c="dimmed" mt={1}>
                          {totalCoverage != null ? `${totalCoverage}% coverage` : "—"}
                        </Text>
                      </Box>
                      <Box
                        p={10}
                        bg={readiness.titleOk ? "green.0" : "orange.0"}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: `1px solid var(--mantine-color-${readiness.titleOk ? "green" : "orange"}-3)`,
                          borderLeftWidth: 3,
                          borderLeftColor: `var(--mantine-color-${readiness.titleOk ? "green" : "orange"}-6)`,
                        }}
                      >
                        <Text fz={9.5} fw={700} c={readiness.titleOk ? "green.7" : "orange.7"} tt="uppercase">
                          Title
                        </Text>
                        <Text fz={15} fw={700} c="dark.8" mt={1}>
                          {readiness.titleOk ? "Verified" : "Unresolved"}
                        </Text>
                        <Text fz={10.5} c="dimmed" mt={1}>
                          {readiness.titleOk ? "No open items" : "Action needed"}
                        </Text>
                      </Box>
                      <Box
                        p={10}
                        bg={legalCounts.failed ? "red.0" : legalCounts.exception ? "orange.0" : "green.0"}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: `1px solid var(--mantine-color-${legalCounts.failed ? "red" : legalCounts.exception ? "orange" : "green"}-3)`,
                          borderLeftWidth: 3,
                          borderLeftColor: `var(--mantine-color-${legalCounts.failed ? "red" : legalCounts.exception ? "orange" : "green"}-6)`,
                        }}
                      >
                        <Text fz={9.5} fw={700} c={legalCounts.failed ? "red.7" : legalCounts.exception ? "orange.7" : "green.7"} tt="uppercase">
                          Legal checks
                        </Text>
                        <Text fz={15} fw={700} c="dark.8" mt={1}>
                          {legalCounts.passed} passed
                        </Text>
                        <Text fz={10.5} c="dimmed" mt={1}>
                          {legalCounts.exception} exception · {legalCounts.failed} failed
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <SectionLabel color="brand.8" icon={IconBuildingBank}>Assets in this decision</SectionLabel>
                    <Stack gap={6} mt={6} mb={12}>
                      {assets.map((a, i) => {
                        const titleUnresolved = a.titleChecklist.filter(
                          (t) => t.status === "Pending" || t.status === "In Progress" || (["Failed", "Exception"].includes(t.status) && !t.comment.trim()),
                        ).length;
                        const legalPassed = a.legalChecks.filter((c) => c.status === "Passed").length;
                        const legalTotal = a.legalChecks.length;
                        const assetName = a.base.description ? a.base.description.split(",")[0] : a.base.type || "—";
                        return (
                          <Paper key={a.id} withBorder radius="md" p={8}>
                            <Group justify="space-between" align="center" wrap="wrap" gap={8}>
                              <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                                <Badge size="sm" radius="xl" color="brand" variant="light" style={{ flexShrink: 0 }}>
                                  Asset {i + 1}
                                </Badge>
                                <Text fz={12.5} fw={600} c="dark.8" truncate>
                                  {assetName}
                                </Text>
                                {a.base.assetId && (
                                  <Text fz={11} c="dimmed" truncate>
                                    · {a.base.assetId}
                                  </Text>
                                )}
                              </Group>
                              <Group gap={10} wrap="nowrap">
                                <StatusBadge status={a.status} />
                                <Text fz={11} c={titleUnresolved ? "orange.7" : "green.7"}>
                                  {titleUnresolved ? `${titleUnresolved} title item(s) open` : "Title clear"}
                                </Text>
                                <Text fz={11} c="dimmed">
                                  {legalPassed}/{legalTotal} legal checks passed
                                </Text>
                              </Group>
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>

                    <SimpleGrid cols={3} spacing={16} mb={10}>
                      <Select size="xs" label="Assignee" data={["Internal team", "Legal"]} value={assignee} onChange={(v) => setAssignee(v || assignee)} radius="md" />
                      <Select size="xs" label="Status" data={["Review Required", "In Progress", "Ready for Decision"]} value={decisionStatus} onChange={(v) => setDecisionStatus(v || decisionStatus)} radius="md" />
                    </SimpleGrid>

                    {!decision ? (
                      <>
                        <SimpleGrid cols={4} spacing={8}>
                          <DecisionButton label="Approve / Proceed" caption="No conditions" color="green" icon={IconCircleCheck} onClick={() => setDecision("approve")} />
                          <DecisionButton label="Approve with Conditions" caption="Add pre-disbursement terms" color="orange" icon={IconAlertTriangle} onClick={() => setDecision("conditions")} />
                          <DecisionButton label="Refer / Further Revision" caption="Send back for more info" color="brand" icon={IconArrowRight} onClick={() => setDecision("refer")} />
                          <DecisionButton label="Reject" caption="Close the application" color="red" icon={IconCircleX} onClick={() => setDecision("reject")} />
                        </SimpleGrid>
                      </>
                    ) : (
                      <Box>
                        <Group justify="space-between" mb={10}>
                          <Text fz={13} fw={700} c="dark.8">
                            {DECISION_LABEL[decision]}
                          </Text>
                          <Button variant="subtle" size="compact-sm" onClick={() => setDecision(null)}>
                            Change decision
                          </Button>
                        </Group>

                        {decision === "conditions" && (
                          <Box mb={12}>
                            <Divider mb={10} />
                            {conditions.map((c, i) => (
                              <Group key={i} align="flex-end" gap={10} mb={8} wrap="nowrap">
                                <TextInput size="xs"
                                  label="Condition"
                                  value={c.condition}
                                  onChange={(e) => updateCondition(i, { condition: e.currentTarget.value })}
                                  placeholder="e.g. Title clearance required before disbursement"
                                  style={{ flex: 2 }}
                                  radius="md"
                                />
                                <Select size="xs" label="Responsible party" value={c.responsible} onChange={(v) => updateCondition(i, { responsible: v || c.responsible })} data={["Customer", "Internal", "Legal"]} style={{ flex: 1 }} radius="md" />
                                <Select size="xs" label="Due before" value={c.dueBefore} onChange={(v) => updateCondition(i, { dueBefore: v || c.dueBefore })} data={["Disbursement", "Offer", "Documentation"]} style={{ flex: 1 }} radius="md" />
                                <ActionIcon variant="default" color="red" size="lg" onClick={() => removeCondition(i)}>
                                  <IconX size={14} />
                                </ActionIcon>
                              </Group>
                            ))}
                            <Button variant="light" size="compact-sm" radius="md" onClick={addCondition}>
                              + Add condition
                            </Button>
                          </Box>
                        )}

                        {(decision === "refer" || decision === "reject") && (
                          <Box mb={12}>
                            <Divider mb={10} />
                            <Text fz={11} fw={600} c="dimmed" tt="uppercase" mb={8}>
                              Reason
                            </Text>
                            <Group gap={8} mb={10} wrap="wrap">
                              {REJECT_REASONS.map((r) => (
                                <Button key={r} size="compact-sm" radius="xl" variant={reasonCategory === r ? "light" : "outline"} color={reasonCategory === r ? "brand" : "gray"} onClick={() => setReasonCategory(r)}>
                                  {r}
                                </Button>
                              ))}
                            </Group>
                            <Textarea size="xs" label="Detailed explanation (optional)" value={reasonDetail} onChange={(e) => setReasonDetail(e.currentTarget.value)} placeholder="Add any further detail for the audit trail…" minRows={2} radius="md" />
                          </Box>
                        )}

                        <Paper withBorder radius="md" p="sm" mb={12} bg="gray.0">
                          <Text fz={12} fw={600} c="dark.8" mb={6}>
                            Decision summary
                          </Text>
                          <SimRow label="Decision" value={DECISION_LABEL[decision]} />
                          <SimRow label="Assets reviewed" value={String(assets.length)} />
                          <SimRow label="Title verification" value={readiness.titleOk ? "Passed" : "Unresolved"} />
                          <SimRow label="Legal checks" value={`${legalCounts.passed} passed / ${legalCounts.exception} exception`} last={decision === "approve"} />
                          {decision === "conditions" && <SimRow label="Conditions" value={String(conditions.length)} last />}
                          {(decision === "refer" || decision === "reject") && <SimRow label="Reason" value={reasonCategory || "—"} last />}
                        </Paper>

                        <Button disabled={!decisionReady} onClick={() => decisionReady && setCompleted(true)} color="brand" radius="md" rightSection={<IconArrowRight size={16} />}>
                          Complete underwriting
                        </Button>
                        {!decisionReady && (
                          <Text fz={11.5} c="dimmed" mt={6}>
                            {decision === "conditions" ? "Add at least one condition to continue." : "Select a reason to continue."}
                          </Text>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
                </Box>
              ) : (
                <LegalDetailView
                asset={selectedLegal}
                panel={panel}
                notes={notes}
                setNotes={setNotes}
                onUpdate={(patch) => updateAsset(selectedLegal.id, patch)}
                onUpdateChecklist={(itemId, patch) => updateChecklist(selectedLegal.id, itemId, patch)}
                onUpdateLegalCheck={(checkId, patch) => updateLegalCheck(selectedLegal.id, checkId, patch)}
              />
              )}

              {(() => {
                const detailSteps = steps;
                const idx = detailSteps.indexOf(panel as any);
                const isLastStep = idx === detailSteps.length - 1;
                if (!isLastStep) {
                  return (
                    <Group justify="flex-end" mt={24} mb={12}>
                      <Button
                        radius="xl"
                        variant="filled"
                        color="brand"
                        onClick={() => setPanel(detailSteps[idx + 1])}
                        rightSection={<IconArrowRight size={16} />}
                      >
                        Next
                      </Button>
                    </Group>
                  );
                }
                return (
                  <Group justify="flex-end" mt={24} mb={12}>
                    <Button variant="filled" color="brand" radius="xl" onClick={() => setLegalViewMode('list')}>
                      Save
                    </Button>
                  </Group>
                );
              })()}
            </Box>
          ) : legalViewMode === 'conclusion' ? (
             <Box>
                <Group mb={14}>
                   <UnstyledButton onClick={() => setLegalViewMode('list')} p={4}>
                      <Group gap={4} wrap="nowrap" c="dimmed" style={{ transition: 'color 150ms ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-brand-6)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mantine-color-gray-5)'}>
                         <IconChevronLeft size={16} />
                         <Text fz={13} fw={600}>Back to Assets</Text>
                      </Group>
                   </UnstyledButton>
                </Group>

                <Paper withBorder radius="lg" style={{ overflow: "hidden" }} bg="white">
                  <Box px={24} pt={14} pb={12}>
                    <SectionHeader icon={IconClipboardCheck} title="Conclusion by Underwriting Decision" color="brand" />
                    <SimpleGrid cols={3} spacing={8} mb={10}>
                      <Box
                        p={10}
                        bg={readiness.valuationOk ? "green.0" : "orange.0"}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: `1px solid var(--mantine-color-${readiness.valuationOk ? "green" : "orange"}-3)`,
                          borderLeftWidth: 3,
                          borderLeftColor: `var(--mantine-color-${readiness.valuationOk ? "green" : "orange"}-6)`,
                        }}
                      >
                        <Text fz={9.5} fw={700} c={readiness.valuationOk ? "green.7" : "orange.7"} tt="uppercase">
                          Assets ({assets.length})
                        </Text>
                        <Text fz={15} fw={700} c="dark.8" mt={1}>
                          {zmw(totalAssetValue)}
                        </Text>
                        <Text fz={10.5} c="dimmed" mt={1}>
                          {totalCoverage != null ? `${totalCoverage}% coverage` : "—"}
                        </Text>
                      </Box>
                      <Box
                        p={10}
                        bg={readiness.titleOk ? "green.0" : "orange.0"}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: `1px solid var(--mantine-color-${readiness.titleOk ? "green" : "orange"}-3)`,
                          borderLeftWidth: 3,
                          borderLeftColor: `var(--mantine-color-${readiness.titleOk ? "green" : "orange"}-6)`,
                        }}
                      >
                        <Text fz={9.5} fw={700} c={readiness.titleOk ? "green.7" : "orange.7"} tt="uppercase">
                          Title
                        </Text>
                        <Text fz={15} fw={700} c="dark.8" mt={1}>
                          {readiness.titleOk ? "Verified" : "Unresolved"}
                        </Text>
                        <Text fz={10.5} c="dimmed" mt={1}>
                          {readiness.titleOk ? "No open items" : "Action needed"}
                        </Text>
                      </Box>
                      <Box
                        p={10}
                        bg={legalCounts.failed ? "red.0" : legalCounts.exception ? "orange.0" : "green.0"}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          border: `1px solid var(--mantine-color-${legalCounts.failed ? "red" : legalCounts.exception ? "orange" : "green"}-3)`,
                          borderLeftWidth: 3,
                          borderLeftColor: `var(--mantine-color-${legalCounts.failed ? "red" : legalCounts.exception ? "orange" : "green"}-6)`,
                        }}
                      >
                        <Text fz={9.5} fw={700} c={legalCounts.failed ? "red.7" : legalCounts.exception ? "orange.7" : "green.7"} tt="uppercase">
                          Legal checks
                        </Text>
                        <Text fz={15} fw={700} c="dark.8" mt={1}>
                          {legalCounts.passed} passed
                        </Text>
                        <Text fz={10.5} c="dimmed" mt={1}>
                          {legalCounts.exception} exception · {legalCounts.failed} failed
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <SectionLabel color="brand.8" icon={IconBuildingBank}>Assets in this decision</SectionLabel>
                    <Stack gap={6} mt={6} mb={12}>
                      {assets.map((a, i) => {
                        const titleUnresolved = a.titleChecklist.filter(
                          (t) => t.status === "Pending" || t.status === "In Progress" || (["Failed", "Exception"].includes(t.status) && !t.comment.trim()),
                        ).length;
                        const legalPassed = a.legalChecks.filter((c) => c.status === "Passed").length;
                        const legalTotal = a.legalChecks.length;
                        const assetName = a.base.description ? a.base.description.split(",")[0] : a.base.type || "—";
                        return (
                          <Paper key={a.id} withBorder radius="md" p={8}>
                            <Group justify="space-between" align="center" wrap="wrap" gap={8}>
                              <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                                <Badge size="sm" radius="xl" color="brand" variant="light" style={{ flexShrink: 0 }}>
                                  Asset {i + 1}
                                </Badge>
                                <Text fz={12.5} fw={600} c="dark.8" truncate>
                                  {assetName}
                                </Text>
                                {a.base.assetId && (
                                  <Text fz={11} c="dimmed" truncate>
                                    · {a.base.assetId}
                                  </Text>
                                )}
                              </Group>
                              <Group gap={10} wrap="nowrap">
                                <StatusBadge status={a.status} />
                                <Text fz={11} c={titleUnresolved ? "orange.7" : "green.7"}>
                                  {titleUnresolved ? `${titleUnresolved} title item(s) open` : "Title clear"}
                                </Text>
                                <Text fz={11} c="dimmed">
                                  {legalPassed}/{legalTotal} legal checks passed
                                </Text>
                              </Group>
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>

                    <SimpleGrid cols={2} spacing={8} mb={10}>
                      <Select size="xs" label="Assignee" data={["Internal team", "Legal"]} value={assignee} onChange={(v) => setAssignee(v || assignee)} radius="md" />
                      <Select size="xs" label="Status" data={["Review Required", "In Progress", "Ready for Decision"]} value={decisionStatus} onChange={(v) => setDecisionStatus(v || decisionStatus)} radius="md" />
                    </SimpleGrid>

                    {!decision ? (
                      <>
                        <SimpleGrid cols={4} spacing={8}>
                          <DecisionButton label="Approve / Proceed" caption="No conditions" color="green" icon={IconCircleCheck} onClick={() => setDecision("approve")} />
                          <DecisionButton label="Approve with Conditions" caption="Add pre-disbursement terms" color="orange" icon={IconAlertTriangle} onClick={() => setDecision("conditions")} />
                          <DecisionButton label="Refer / Further Revision" caption="Send back for more info" color="brand" icon={IconArrowRight} onClick={() => setDecision("refer")} />
                          <DecisionButton label="Reject" caption="Close the application" color="red" icon={IconCircleX} onClick={() => setDecision("reject")} />
                        </SimpleGrid>
                      </>
                    ) : (
                      <Box>
                        <Group justify="space-between" mb={10}>
                          <Text fz={13} fw={700} c="dark.8">
                            {DECISION_LABEL[decision]}
                          </Text>
                          <Button variant="subtle" size="compact-sm" onClick={() => setDecision(null)}>
                            Change decision
                          </Button>
                        </Group>

                        {decision === "conditions" && (
                          <Box mb={12}>
                            <Divider mb={10} />
                            {conditions.map((c, i) => (
                              <Group key={i} align="flex-end" gap={10} mb={8} wrap="nowrap">
                                <TextInput size="xs"
                                  label="Condition"
                                  value={c.condition}
                                  onChange={(e) => updateCondition(i, { condition: e.currentTarget.value })}
                                  placeholder="e.g. Title clearance required before disbursement"
                                  style={{ flex: 2 }}
                                  radius="md"
                                />
                                <Select size="xs" label="Responsible party" value={c.responsible} onChange={(v) => updateCondition(i, { responsible: v || c.responsible })} data={["Customer", "Internal", "Legal"]} style={{ flex: 1 }} radius="md" />
                                <Select size="xs" label="Due before" value={c.dueBefore} onChange={(v) => updateCondition(i, { dueBefore: v || c.dueBefore })} data={["Disbursement", "Offer", "Documentation"]} style={{ flex: 1 }} radius="md" />
                                <ActionIcon variant="default" color="red" size="lg" onClick={() => removeCondition(i)}>
                                  <IconX size={14} />
                                </ActionIcon>
                              </Group>
                            ))}
                            <Button variant="light" size="compact-sm" radius="md" onClick={addCondition}>
                              + Add condition
                            </Button>
                          </Box>
                        )}

                        {(decision === "refer" || decision === "reject") && (
                          <Box mb={12}>
                            <Divider mb={10} />
                            <Text fz={11} fw={600} c="dimmed" tt="uppercase" mb={8}>
                              Reason
                            </Text>
                            <Group gap={8} mb={10} wrap="wrap">
                              {REJECT_REASONS.map((r) => (
                                <Button key={r} size="compact-sm" radius="xl" variant={reasonCategory === r ? "light" : "outline"} color={reasonCategory === r ? "brand" : "gray"} onClick={() => setReasonCategory(r)}>
                                  {r}
                                </Button>
                              ))}
                            </Group>
                            <Textarea size="xs" label="Detailed explanation (optional)" value={reasonDetail} onChange={(e) => setReasonDetail(e.currentTarget.value)} placeholder="Add any further detail for the audit trail…" minRows={2} radius="md" />
                          </Box>
                        )}

                        <Paper withBorder radius="md" p="sm" mb={12} bg="gray.0">
                          <Text fz={12} fw={600} c="dark.8" mb={6}>
                            Decision summary
                          </Text>
                          <SimRow label="Decision" value={DECISION_LABEL[decision]} />
                          <SimRow label="Assets reviewed" value={String(assets.length)} />
                          <SimRow label="Title verification" value={readiness.titleOk ? "Passed" : "Unresolved"} />
                          <SimRow label="Legal checks" value={`${legalCounts.passed} passed / ${legalCounts.exception} exception`} last={decision === "approve"} />
                          {decision === "conditions" && <SimRow label="Conditions" value={String(conditions.length)} last />}
                          {(decision === "refer" || decision === "reject") && <SimRow label="Reason" value={reasonCategory || "—"} last />}
                        </Paper>

                        <Button disabled={!decisionReady} onClick={() => decisionReady && setCompleted(true)} color="brand" radius="md" rightSection={<IconArrowRight size={16} />}>
                          Complete underwriting
                        </Button>
                        {!decisionReady && (
                          <Text fz={11.5} c="dimmed" mt={6}>
                            {decision === "conditions" ? "Add at least one condition to continue." : "Select a reason to continue."}
                          </Text>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
             </Box>
          ) : (
            <Box>
              <Group justify="space-between" align="center" mb={14}>
                <Group gap={10}>
                  <ThemeIcon radius="md" size={34} variant="light" color="brand">
                    <IconShieldCheck size={17} />
                  </ThemeIcon>
                  <Text fz={16} fw={700} c="dark.8">
                    Legal Verification{" "}
                    <Text span c="dimmed" fw={600}>
                      ({assets.length})
                    </Text>
                  </Text>
                </Group>
              </Group>

              {assets.length === 0 ? (
                <Paper withBorder radius="lg" py={60} ta="center" bg="gray.0">
                  <ThemeIcon size={48} radius="xl" color="gray" variant="light" mb={12}>
                    <IconIdBadge2 size={24} />
                  </ThemeIcon>
                  <Text fz="md" fw={600} c="dark.8">No assets added</Text>
                  <Text fz="sm" c="dimmed" mb={20}>Add assets in the Asset Valuation tab to begin legal checks.</Text>
                </Paper>
              ) : (
                <Box>
                <Paper withBorder radius="lg" p="md" bg="gray.0">
                  {assets.map((a, i) => (
                    <AssetListItem
                      key={a.id}
                      asset={a}
                      index={i}
                      titleBadgeLabel="Asset"
                      onClick={() => {
                        setSelectedLegalId(a.id);
                        setLegalViewMode('detail');
                        setPanel('legalDocs');
                      }}
                      onUpdateBase={(patch) => editAssetBase(a.id, patch)}
                      onRemove={() => removeAsset(a.id)}
                    />
                  ))}
                </Paper>
                  
                  
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function UnderwritingModal({
  opened,
  onClose,
  applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION,
  onMinimize,
  embedded,
  readOnly,
}: UnderwritingModalProps) {
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
  const approvedAmount = Math.round(calc.eligibleAmount);
  const finalAmount = DUMMY_ENRICHMENT_TERMS.amount || approvedAmount;
  const loanTypeLabel = applicationValues.loanType === "Business" ? "Business Loan" : "Personal Loan";

  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const handleSubmitReady = (ready: boolean, submit: () => void) => {
    setCanSubmit(ready);
    submitRef.current = submit;
  };

  const handleSubmit = () => {
    submitRef.current();
  };

  if (embedded) {
    return (
      <UnderwritingWorkspace
        finalAmount={finalAmount}
        applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
        loanTypeLabel={loanTypeLabel}
        onSubmitReady={handleSubmitReady}
      />
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1400}
      closeOnClickOutside={false}
        closeOnEscape={false}
      padding={0}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden", height: "85vh", maxHeight: 860 },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <TopBar onMinimize={onMinimize} onClose={onClose} />

        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
          <LeftNav section={section} setSection={setSection} values={applicationValues} tab={tab} setTab={setTab} />

          <Box style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "linear-gradient(180deg, #F5F4FF 0%, var(--mantine-color-gray-0) 320px)" }}>
            {section === "application" && (
              <Box style={{ height: "100%" }}>
                <Group gap={10} align="flex-start" m="md" p="sm" bg="brand.0" style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}>
                  <IconInfoCircle size={14} color="var(--mantine-color-brand-6)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Text fz={12.5} c="brand.9">
                    Submitted application data — read-only at this stage.
                  </Text>
                </Group>
                <Box style={{ height: "calc(100% - 70px)" }}>
                  <LoanApplicationModal embedded readOnly initialValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
                </Box>
              </Box>
            )}

            {section === "prescreening" && (
              <Box style={{ height: "100%" }}>
                <PreScreeningModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "appraisal" && (
              <Box style={{ height: "100%" }}>
                <EnrichmentModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "underwriting" && (
              <UnderwritingWorkspace
                finalAmount={finalAmount}
                applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
                loanTypeLabel={loanTypeLabel}
                onBack={() => setSection("appraisal")}
                onSubmitReady={handleSubmitReady}
                tab={tab}
                onTabChange={setTab}
              />
            )}
          </Box>
        </Box>

        <Group justify="space-between" align="center" px="xl" py="md" bg="white" style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}>
          <Button variant="default" radius="md" onClick={onClose}>
            Cancel
          </Button>
          <Button color="brand" radius="md" onClick={handleSubmit} disabled={!canSubmit} rightSection={<IconArrowRight size={16} />}>
            Submit
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
