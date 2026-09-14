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
} from "@mantine/core";
import {
  IconBell,
  IconChevronDown,
  IconFileText,
  IconGauge,
  IconBuildingBank,
  IconScale,
  IconShieldCheck,
  IconCar,
  IconIdBadge2,
  IconCalendar,
  IconUserCircle,
  IconChartBar,
  IconClipboardCheck,
  IconCheck,
  IconX,
  IconPlus,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconArrowLeft,
  IconArrowRight,
  IconMinus,
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

const zmw = (n: number | string | null | undefined) =>
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
  return { eligibleAmount, mandatoryPassed: creditPassed && dtiPassed };
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function ReadRow({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <Box style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <Text fz={11.5} c="dimmed" mb={3}>
        {label}
      </Text>
      <Text fz={13.5} fw={600} c="dark.7">
        {value ?? "—"}
      </Text>
    </Box>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
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
    <Group justify="space-between" py={9} style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-gray-1)" }}>
      <Text fz={12.5} c="dimmed">
        {label}
      </Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="dark.8">
        {value}
      </Text>
    </Group>
  );
}

function CardHeader({ icon: Icon, title, right }: { icon: React.FC<any>; title: string; right?: React.ReactNode }) {
  return (
    <Group justify="space-between" align="center" mb={14}>
      <Group gap={10}>
        <ThemeIcon radius="md" size={28} variant="light" color="brand">
          <Icon size={15} />
        </ThemeIcon>
        <Text fz={14} fw={700} c="dark.7">
          {title}
        </Text>
      </Group>
      {right}
    </Group>
  );
}

function Card({ icon, title, right, children }: { icon: React.FC<any>; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="md" p="lg">
      <CardHeader icon={icon} title={title} right={right} />
      {children}
    </Paper>
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

const OVERALL_STATUS_COLORS: Record<string, string> = {
  "Not Started": "gray",
  "In Progress": "brand",
  "Ready for Decision": "orange",
  Completed: "green",
};

const CHECK_STATUSES = ["Pending", "In Progress", "Passed", "Failed", "Exception"];
const DOC_STATUSES = ["Missing", "Uploaded", "Verified", "Rejected"];

function SourceBadge({ source }: { source: "application" | "manual" }) {
  const map: Record<string, { label: string; color: string }> = {
    application: { label: "From application", color: "teal" },
    manual: { label: "Manual entry", color: "teal" },
  };
  const s = map[source] || map.application;
  return (
    <Badge size="sm" radius="xl" color={s.color} variant="light">
      {s.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Top app bar
// ---------------------------------------------------------------------------

function TopBar({ onMinimize, onClose, embedded }: { onMinimize: () => void; onClose: () => void; embedded?: boolean }) {
  return (
    <Group justify="space-between" align="center" px="xl" py={10} bg="brand.7" style={{ flexShrink: 0 }}>
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
// Left sidebar
// ---------------------------------------------------------------------------

type Section = "application" | "prescreening" | "enrichment" | "underwriting";

function LeftNav({ section, setSection, values }: { section: Section; setSection: (s: Section) => void; values: LoanApplicationValues }) {
  const isBusiness = values.loanType === "Business";
  const name = isBusiness ? values.companyName : [values.firstName, values.surname].filter(Boolean).join(" ");
  const initials = (name || "").split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const items: { id: Section; label: string; icon: React.FC<any>; done: boolean }[] = [
    { id: "application", label: "Loan application", icon: IconFileText, done: true },
    { id: "prescreening", label: "Pre-screening", icon: IconGauge, done: true },
    { id: "enrichment", label: "Enrichment", icon: IconBuildingBank, done: true },
    { id: "underwriting", label: "Underwriting", icon: IconScale, done: false },
  ];

  return (
    <Box w={220} style={{ flexShrink: 0, background: "white", borderRight: "1px solid var(--mantine-color-gray-2)" }}>
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
            <UnstyledButton key={it.id} onClick={() => setSection(it.id)} px={10} py={9} style={{ borderRadius: 8 }}>
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
          );
        })}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Asset model (multi-asset, restored)
// ---------------------------------------------------------------------------

interface AssetDoc {
  name: string;
  tier: "required" | "optional";
  status: string;
  uploadedDate: string;
  uploadedBy: string;
  comment: string;
}

interface TitleChecklistItem {
  id: string;
  label: string;
  status: string;
  comment: string;
}

interface LegalCheck {
  id: string;
  name: string;
  status: string;
  finding: string;
  why: string;
  action: string;
  comment: string;
}

interface Asset {
  id: string;
  source: "application" | "manual";
  base: DummyAssetBase;
  valuation: { amount: string; currency: string; method: string; marketValue: string; forcedSaleValue: string; notes: string };
  valuer: { name: string; company: string; license: string; contact: string; verified: boolean };
  valuationDate: string;
  expiryDays: number;
  status: string;
  reason: string;
  docs: AssetDoc[];
  legalVerifier: { name: string; company: string; role: string; license: string; contact: string };
  titleChecklist: TitleChecklistItem[];
  titleDocs: AssetDoc[];
  legalChecks: LegalCheck[];
}

let assetSeq = 1;
function makeAsset(source: "application" | "manual", base: DummyAssetBase): Asset {
  const id = "asset-" + assetSeq++;
  return {
    id,
    source,
    base,
    valuation: { amount: "", currency: "ZMW", method: "Market comparison", marketValue: "", forcedSaleValue: "", notes: "" },
    valuer: { name: "", company: "", license: "", contact: "", verified: false },
    valuationDate: "",
    expiryDays: 180,
    status: "Pending",
    reason: "",
    docs: [
      { name: "Valuation report", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Asset photos", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Ownership document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
    ],
    legalVerifier: { name: "", company: "", role: "", license: "", contact: "" },
    titleChecklist: [
      { id: "titleVerified", label: "Title verified", status: "Pending", comment: "" },
      { id: "ownershipVerified", label: "Ownership verified", status: "Pending", comment: "" },
      { id: "encumbrances", label: "Encumbrances checked", status: "Pending", comment: "" },
      { id: "liens", label: "Existing liens checked", status: "Pending", comment: "" },
      { id: "restrictions", label: "Restrictions checked", status: "Pending", comment: "" },
    ],
    titleDocs: [
      { name: "Title deed / ownership document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Search report", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Legal opinion", tier: "optional", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
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
  };
}

function makeSeedAsset(): Asset {
  const a = makeAsset("application", DUMMY_SEED_ASSET_BASE);
  a.docs = [
    { name: "Valuation report", tier: "required", status: "Verified", uploadedDate: "3 Sep 2026", uploadedBy: "Field valuer", comment: "" },
    { name: "Asset photos", tier: "required", status: "Verified", uploadedDate: "3 Sep 2026", uploadedBy: "Field valuer", comment: "" },
    { name: "Ownership document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
  ];
  a.titleChecklist = [
    { id: "titleVerified", label: "Title verified", status: "Passed", comment: "" },
    { id: "ownershipVerified", label: "Ownership verified", status: "Passed", comment: "" },
    { id: "encumbrances", label: "Encumbrances checked", status: "Exception", comment: "" },
    { id: "liens", label: "Existing liens checked", status: "Passed", comment: "" },
    { id: "restrictions", label: "Restrictions checked", status: "Passed", comment: "" },
  ];
  a.titleDocs = [
    { name: "Title deed / ownership document", tier: "required", status: "Verified", uploadedDate: "4 Sep 2026", uploadedBy: "Legal officer", comment: "" },
    { name: "Search report", tier: "required", status: "Verified", uploadedDate: "4 Sep 2026", uploadedBy: "Legal officer", comment: "" },
    { name: "Legal opinion", tier: "optional", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
  ];
  return a;
}

// ---------------------------------------------------------------------------
// Compact check row — checkbox + flag-as-exception (restored old interaction)
// ---------------------------------------------------------------------------

function CompactCheckRow({
  label,
  checked,
  exception,
  note,
  onToggle,
  onFlag,
  onNoteChange,
}: {
  label: string;
  checked: boolean;
  exception: boolean;
  note: string;
  onToggle: () => void;
  onFlag: () => void;
  onNoteChange: (v: string) => void;
}) {
  return (
    <Box py={7} style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}>
      <Group gap={8} wrap="nowrap" align="center">
        <Checkbox checked={checked} disabled={exception} onChange={onToggle} size="xs" />
        <Text fz={12.5} c={exception ? "orange.8" : "dark.6"} style={{ flex: 1 }}>
          {label}
        </Text>
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
// Documents table (editable — restored old functionality)
// ---------------------------------------------------------------------------

function DocumentsTable({ title, docs, setDocs }: { title: string; docs: AssetDoc[]; setDocs: (d: AssetDoc[]) => void }) {
  const update = (i: number, patch: Partial<AssetDoc>) => setDocs(docs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDoc = () =>
    setDocs([...docs, { name: "New document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" }]);
  const removeDoc = (i: number) => setDocs(docs.filter((_, idx) => idx !== i));

  return (
    <Card
      icon={IconFileText}
      title={title}
      right={
        <Button size="compact-sm" variant="light" radius="xl" leftSection={<IconPlus size={13} />} onClick={addDoc}>
          Add documents
        </Button>
      }
    >
      <Stack gap={0}>
        {docs.length === 0 && (
          <Text fz={12.5} c="dimmed" ta="center" py="md">
            No documents added yet.
          </Text>
        )}
        {docs.map((d, i) => (
          <Box key={i} py={12} style={{ borderTop: i > 0 ? "1px solid var(--mantine-color-gray-1)" : "none" }}>
            <Group justify="space-between" wrap="nowrap" gap={14}>
              <Group gap={10} style={{ flex: 1, minWidth: 0 }} wrap="nowrap" align="flex-start">
                <IconFileText size={16} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0, marginTop: 4 }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <TextInput
                    value={d.name}
                    onChange={(e) => update(i, { name: e.currentTarget.value })}
                    size="sm"
                    variant="transparent"
                    placeholder="Document name"
                    styles={{ input: { fontWeight: 600, fontSize: 13, color: "var(--mantine-color-dark-7)", padding: 0, minHeight: 24, height: 24, border: "none", background: "transparent" } }}
                  />
                  <Group gap={6} mt={2} wrap="nowrap">
                    <Select
                      data={["required", "optional"]}
                      value={d.tier}
                      onChange={(v) => update(i, { tier: (v as "required" | "optional") || "required" })}
                      size="xs"
                      variant="transparent"
                      allowDeselect={false}
                      styles={{
                        input: { fontSize: 11, color: "var(--mantine-color-gray-5)", padding: 0, minHeight: 18, height: 18, border: "none", background: "transparent", cursor: "pointer" },
                        wrapper: { width: 100 },
                        rightSection: { width: 14 },
                      }}
                    />
                    <Text fz={11} c="dimmed" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      · uploaded {d.uploadedDate || "—"} {d.uploadedBy ? `by ${d.uploadedBy}` : ""}
                    </Text>
                  </Group>
                </Box>
              </Group>
              <Group gap={8} wrap="nowrap" align="center">
                <Button size="compact-sm" variant="light" color="brand" radius="xl">
                  Preview
                </Button>
                <Select data={DOC_STATUSES} value={d.status} onChange={(v) => update(i, { status: v || d.status })} size="xs" radius="xl" w={110} allowDeselect={false} />
                <ActionIcon variant="subtle" color="gray" onClick={() => removeDoc(i)}>
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Group>
            <TextInput value={d.comment} onChange={(e) => update(i, { comment: e.currentTarget.value })} placeholder="Verification comment (optional)" size="xs" radius="md" mt={10} />
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Asset switcher (restored)
// ---------------------------------------------------------------------------

function AssetSwitcher({
  assets,
  selectedId,
  onSelect,
  onAdd,
}: {
  assets: Asset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: (base: DummyAssetBase) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState(DUMMY_ASSET_TYPES[0]);
  const [newDesc, setNewDesc] = useState("");

  function submit() {
    if (!newDesc.trim()) return;
    onAdd({ type: newType, description: newDesc, assetId: "", location: "", owner: "", acquisition: "" });
    setNewDesc("");
    setAdding(false);
  }

  return (
    <Box mb={20}>
      <Group justify="space-between" mb={10}>
        <Text fz={13} fw={700} c="dark.7">
          Assets offered as security ({assets.length})
        </Text>
      </Group>
      <Group gap={8} mb={adding ? 10 : 0} wrap="wrap">
        {assets.map((a, i) => {
          const active = a.id === selectedId;
          return (
            <UnstyledButton
              key={a.id}
              onClick={() => onSelect(a.id)}
              px={12}
              py={8}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 10,
                border: `1.5px solid ${active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-gray-2)"}`,
                background: active ? "var(--mantine-color-brand-0)" : "white",
              }}
            >
              <Text fz={12} fw={600} c={active ? "brand.7" : "dark.8"}>
                Asset {i + 1}: {a.base.description.slice(0, 28)}
                {a.base.description.length > 28 ? "…" : ""}
              </Text>
              <StatusBadge status={a.status} />
            </UnstyledButton>
          );
        })}
        <Button size="compact-sm" variant="outline" color="brand" radius="md" onClick={() => setAdding(!adding)} styles={{ root: { borderStyle: "dashed" } }}>
          + Add asset
        </Button>
      </Group>
      {adding && (
        <Paper withBorder radius="md" p="sm" bg="gray.0">
          <Group align="flex-end" gap={8}>
            <Select label="Asset type" data={DUMMY_ASSET_TYPES} value={newType} onChange={(v) => setNewType(v || DUMMY_ASSET_TYPES[0])} w={180} radius="md" />
            <TextInput label="Description" value={newDesc} onChange={(e) => setNewDesc(e.currentTarget.value)} placeholder="e.g. Stand 4521, Kabwata, Lusaka" style={{ flex: 1 }} radius="md" />
            <Button onClick={submit} radius="md">
              Add
            </Button>
            <Button variant="default" radius="md" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </Group>
        </Paper>
      )}
    </Box>
  );
}

function ValidityNote({ date, days }: { date: string; days: number }) {
  if (!date)
    return (
      <Text fz={12.5} c="dimmed" py={9}>
        Set a valuation date to see validity
      </Text>
    );
  const valDate = new Date(date);
  const expiry = new Date(valDate);
  expiry.setDate(expiry.getDate() + days);
  const daysLeft = Math.round((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const expired = daysLeft < 0;
  return (
    <Group gap={6} py={9}>
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

type Decision = "approve" | "conditions" | "refer" | "reject" | null;

const DECISION_LABEL: Record<string, string> = {
  approve: "Approve / Proceed",
  conditions: "Approve with Conditions",
  refer: "Refer / Further Revision",
  reject: "Reject",
};

const REJECT_REASONS = ["Insufficient collateral", "Ownership issue", "Legal risk", "Invalid documentation", "Unresolved exception", "Valuation issue", "Other"];

interface Condition {
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

// ---------------------------------------------------------------------------
// Underwriting workspace
// ---------------------------------------------------------------------------

function UnderwritingWorkspace({
  finalAmount,
  applicationId,
  loanTypeLabel,
  onBack,
  onSubmitReady,
}: {
  finalAmount: number;
  applicationId: string;
  loanTypeLabel: string;
  onBack?: () => void;
  onSubmitReady?: (canSubmit: boolean, submit: () => void) => void;
}) {
  const [tab, setTab] = useState<"asset" | "legal" | "financial">("asset");
  const [assets, setAssets] = useState<Asset[]>(() => [makeSeedAsset()]);
  const [selectedId, setSelectedId] = useState<string>(() => assets[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState("ZMW");
  const [decisionStatus, setDecisionStatus] = useState("Review Required");
  const [decision, setDecision] = useState<Decision>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [completed, setCompleted] = useState(false);

  const selected = assets.find((a) => a.id === selectedId) || assets[0];

  function updateAsset(id: string, patch: Partial<Asset>) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function updateSelected(patch: Partial<Asset>) {
    updateAsset(selected.id, patch);
  }
  function addAsset(base: DummyAssetBase) {
    const a = makeAsset("manual", { ...base, owner: base.owner || "" });
    setAssets((prev) => [...prev, a]);
    setSelectedId(a.id);
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

  const coverage = selected.valuation.amount ? Math.round((Number(selected.valuation.amount) / finalAmount) * 100) : null;
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
      const aValuationOk = a.status === "Passed" || (["Failed", "Exception"].includes(a.status) && a.reason.trim());
      if (!aValuationOk) {
        valuationOk = false;
        blockers.push(`${label}: valuation status has not been finalized.`);
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

      const requiredDocs = [...a.docs, ...a.titleDocs].filter((d) => d.tier === "required");
      const missingDocs = requiredDocs.filter((d) => d.status !== "Verified");
      if (missingDocs.length) {
        docsOk = false;
        blockers.push(`${label}: ${missingDocs.length} required document(s) not yet verified — ${missingDocs.map((d) => d.name).join(", ")}.`);
      }
    });

    return { valuationOk, titleOk, legalOk, docsOk, ready: valuationOk && titleOk && legalOk && docsOk, blockers };
  }, [assets]);

  const anyTouched = assets.some(
    (a) => a.status !== "Pending" || a.titleChecklist.some((i) => i.status !== "Pending") || a.legalChecks.some((c) => c.comment),
  );
  const overallStatus = completed ? "Completed" : readiness.ready ? "Ready for Decision" : anyTouched ? "In Progress" : "Not Started";

  const allLegalChecks = assets.flatMap((a) => a.legalChecks);
  const legalCounts = {
    passed: allLegalChecks.filter((c) => c.status === "Passed").length,
    exception: allLegalChecks.filter((c) => c.status === "Exception").length,
    failed: allLegalChecks.filter((c) => c.status === "Failed").length,
  };
  const legalStatusLabel = `${legalCounts.passed} passed · ${legalCounts.exception} exception · ${legalCounts.failed} failed`;

  const decisionReady =
    decision === "approve" ||
    (decision === "conditions" && conditions.length > 0 && conditions.every((c) => c.condition.trim())) ||
    ((decision === "refer" || decision === "reject") && !!reasonCategory);

  const canSubmit = completed;
  useEffect(() => {
    onSubmitReady?.(canSubmit, () => {});
  }, [canSubmit]);

  const valuationBadge =
    selected.status === "Passed"
      ? { color: "green", label: "Valuation verified" }
      : ["Failed", "Exception"].includes(selected.status)
      ? { color: "red", label: "Valuation flagged" }
      : { color: "orange", label: "Valuation pending" };

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
    <Box p={30}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb={16}>
        <Group gap={12}>
          <ThemeIcon radius="md" size={40} variant="light" color="brand">
            <IconClipboardCheck size={20} />
          </ThemeIcon>
          <Box>
            <Text fz={19} fw={700} c="dark.8">
              Underwriting Workspace
            </Text>
            <Text fz={13} c="dimmed" mt={2}>
              Review, validate, verify, and complete legal, financial, and collateral details.
            </Text>
          </Box>
        </Group>
        <Group gap={10}>
          {onBack && (
            <Button variant="default" radius="xl" size="sm" leftSection={<IconArrowLeft size={14} />} onClick={onBack}>
              Back
            </Button>
          )}
          <Badge size="lg" radius="xl" variant="light" color={OVERALL_STATUS_COLORS[overallStatus]} leftSection={<IconCircleCheck size={12} />}>
            {overallStatus}
          </Badge>
        </Group>
      </Group>

      {/* Info strip */}
      <SimpleGrid cols={3} spacing={0} bg="gray.0" p="md" mb={20} style={{ borderRadius: 10, border: "1px solid var(--mantine-color-gray-2)" }}>
        <ReadRow label="Application ID" value={applicationId} />
        <ReadRow label="Loan Amount" value={zmw(finalAmount)} />
        <ReadRow label="Loan Type" value={loanTypeLabel} />
      </SimpleGrid>

      {/* Asset switcher */}
      <AssetSwitcher assets={assets} selectedId={selected.id} onSelect={setSelectedId} onAdd={addAsset} />

      {/* Tabs */}
      <Paper withBorder radius="md" p={6} mb={20}>
        <Group gap={4}>
          <UnstyledButton onClick={() => setTab("asset")} px={16} py={9} style={{ borderRadius: 8, background: tab === "asset" ? "var(--mantine-color-brand-0)" : "transparent", flex: 1 }}>
            <Group gap={7} justify="center">
              <IconCircleCheck size={15} color={tab === "asset" ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
              <Text fz={13} fw={tab === "asset" ? 700 : 500} c={tab === "asset" ? "brand.7" : "dark.5"}>
                Asset Validation
              </Text>
            </Group>
          </UnstyledButton>
          <UnstyledButton onClick={() => setTab("legal")} px={16} py={9} style={{ borderRadius: 8, background: tab === "legal" ? "var(--mantine-color-brand-0)" : "transparent", flex: 1 }}>
            <Group gap={7} justify="center">
              <IconShieldCheck size={15} color={tab === "legal" ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
              <Text fz={13} fw={tab === "legal" ? 700 : 500} c={tab === "legal" ? "brand.7" : "dark.5"}>
                Legal &amp; Title Verification
              </Text>
            </Group>
          </UnstyledButton>
          <UnstyledButton onClick={() => setTab("financial")} px={16} py={9} style={{ borderRadius: 8, background: tab === "financial" ? "var(--mantine-color-brand-0)" : "transparent", flex: 1 }}>
            <Group gap={7} justify="center">
              <IconChartBar size={15} color={tab === "financial" ? "var(--mantine-color-brand-7)" : "var(--mantine-color-gray-5)"} />
              <Text fz={13} fw={tab === "financial" ? 700 : 500} c={tab === "financial" ? "brand.7" : "dark.5"}>
                Financial Analysis
              </Text>
            </Group>
          </UnstyledButton>
        </Group>
      </Paper>

      <Text fz={12} fw={600} c="brand.6" mb={12}>
        Reviewing: {selected.base.description}
      </Text>

      <Stack gap={16}>
        {tab === "asset" && (
          <>
            <Card icon={IconUserCircle} title="Borrower Details" right={<SourceBadge source={selected.source} />}>
              {selected.source === "application" ? (
                <SimpleGrid cols={4} spacing={16}>
                  <ReadRow label="Asset Type" value={selected.base.type} />
                  <ReadRow label="Asset ID" value={selected.base.assetId} />
                  <ReadRow label="Location" value={selected.base.location} />
                  <ReadRow label="Owner" value={selected.base.owner} />
                  <ReadRow label="Description" value={selected.base.description} span={2} />
                  <ReadRow label="Acquisition information" value={selected.base.acquisition} span={2} />
                </SimpleGrid>
              ) : (
                <SimpleGrid cols={4} spacing={16}>
                  <Select label="Asset type" value={selected.base.type} onChange={(v) => updateSelected({ base: { ...selected.base, type: v || selected.base.type } })} data={DUMMY_ASSET_TYPES} radius="md" />
                  <TextInput label="Asset ID / reference" value={selected.base.assetId} onChange={(e) => updateSelected({ base: { ...selected.base, assetId: e.currentTarget.value } })} placeholder="e.g. AST-33022" radius="md" />
                  <TextInput label="Location" value={selected.base.location} onChange={(e) => updateSelected({ base: { ...selected.base, location: e.currentTarget.value } })} placeholder="e.g. Lusaka, Zambia" radius="md" />
                  <TextInput label="Owner" value={selected.base.owner} onChange={(e) => updateSelected({ base: { ...selected.base, owner: e.currentTarget.value } })} radius="md" />
                  <TextInput label="Description" value={selected.base.description} onChange={(e) => updateSelected({ base: { ...selected.base, description: e.currentTarget.value } })} style={{ gridColumn: "1 / -1" }} radius="md" />
                  <TextInput label="Acquisition / value information" value={selected.base.acquisition} onChange={(e) => updateSelected({ base: { ...selected.base, acquisition: e.currentTarget.value } })} style={{ gridColumn: "1 / -1" }} radius="md" />
                </SimpleGrid>
              )}
            </Card>

            <Card
              icon={IconCar}
              title="Vehicle Valuation"
              right={
                <Badge size="sm" radius="xl" color={valuationBadge.color} variant="light" leftSection={<IconAlertTriangle size={11} />}>
                  {valuationBadge.label}
                </Badge>
              }
            >
              <SimpleGrid cols={4} spacing={14} mb={14}>
                <NumberInput label="Valuation amount" value={selected.valuation.amount ? Number(selected.valuation.amount) : undefined} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, amount: v ? String(v) : "" } })} placeholder="e.g. 95000" prefix="ZMW " radius="md" />
                <Select label="Valuation method" value={selected.valuation.method} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, method: v || selected.valuation.method } })} data={["Market comparison", "Cost approach", "Income approach"]} radius="md" />
                <NumberInput label="Market value" value={selected.valuation.marketValue ? Number(selected.valuation.marketValue) : undefined} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, marketValue: v ? String(v) : "" } })} placeholder="e.g. 98000" prefix="ZMW " radius="md" />
                <NumberInput label="Forced sale value" value={selected.valuation.forcedSaleValue ? Number(selected.valuation.forcedSaleValue) : undefined} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, forcedSaleValue: v ? String(v) : "" } })} placeholder="e.g. 76000" prefix="ZMW " radius="md" />
              </SimpleGrid>
              <SimpleGrid cols={coverage != null ? 2 : 1} spacing={12}>
                <Textarea label="Valuation notes" value={selected.valuation.notes} onChange={(e) => updateSelected({ valuation: { ...selected.valuation, notes: e.currentTarget.value } })} placeholder="Condition, mileage, any relevant observations…" minRows={2} radius="md" />
                {coverage != null && (
                  <Paper bg="brand.0" p="sm" radius="md" style={{ border: "1px solid var(--mantine-color-brand-2)" }}>
                    <Stack gap={8}>
                      <MiniStat label="This asset's value" value={zmw(selected.valuation.amount)} />
                      <MiniStat label="Final loan amount" value={zmw(finalAmount)} />
                      <MiniStat label="Coverage" value={`${coverage}%`} accent={coverage < 120} />
                    </Stack>
                  </Paper>
                )}
              </SimpleGrid>
            </Card>

            <Card icon={IconIdBadge2} title="Valuer Information">
              <SimpleGrid cols={4} spacing={14} mb={12}>
                <TextInput label="Valuer name" value={selected.valuer.name} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, name: e.currentTarget.value } })} placeholder="e.g. K. Zulu" radius="md" />
                <TextInput label="Valuer / company" value={selected.valuer.company} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, company: e.currentTarget.value } })} placeholder="e.g. Apex Valuers Ltd" radius="md" />
                <TextInput label="License number" value={selected.valuer.license} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, license: e.currentTarget.value } })} placeholder="e.g. VAL-2321" radius="md" />
                <TextInput label="Contact" value={selected.valuer.contact} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, contact: e.currentTarget.value } })} placeholder="Phone or email" radius="md" />
              </SimpleGrid>
              <Box p="sm" bg={selected.valuer.verified ? "brand.0" : "gray.0"} style={{ border: `1px solid var(--mantine-color-${selected.valuer.verified ? "brand" : "gray"}-2)`, borderRadius: 9 }}>
                <Checkbox
                  checked={selected.valuer.verified}
                  onChange={(e) => updateSelected({ valuer: { ...selected.valuer, verified: e.currentTarget.checked } })}
                  label="Valuer meets the configured panel requirement"
                  size="sm"
                />
              </Box>
            </Card>

            <Card icon={IconCalendar} title="Valuation date and status" right={<Select data={CHECK_STATUSES} value={selected.status} onChange={(v) => updateSelected({ status: v || selected.status })} size="xs" radius="xl" w={140} allowDeselect={false} />}>
              <SimpleGrid cols={["Failed", "Exception"].includes(selected.status) ? 3 : 2} spacing={16}>
                <TextInput type="date" label="Valuation date" value={selected.valuationDate} onChange={(e) => updateSelected({ valuationDate: e.currentTarget.value })} radius="md" />
                <Box>
                  <Text fz={12} fw={500} c="dark.6" mb={5}>
                    Validity
                  </Text>
                  <ValidityNote date={selected.valuationDate} days={selected.expiryDays} />
                </Box>
                {["Failed", "Exception"].includes(selected.status) && (
                  <Textarea label="Finding / reason (required)" value={selected.reason} onChange={(e) => updateSelected({ reason: e.currentTarget.value })} placeholder="Explain why the valuation failed or is an exception…" minRows={2} radius="md" />
                )}
              </SimpleGrid>
            </Card>

            <DocumentsTable title="Supporting Documents" docs={selected.docs} setDocs={(docs) => updateSelected({ docs })} />
          </>
        )}

        {tab === "legal" && (
          <>
            <Card icon={IconIdBadge2} title="Verifier Information">
              <SimpleGrid cols={4} spacing={14}>
                <TextInput label="Verifier name" value={selected.legalVerifier.name} onChange={(e) => updateSelected({ legalVerifier: { ...selected.legalVerifier, name: e.currentTarget.value } })} placeholder="e.g. M. Tembo" radius="md" />
                <TextInput label="Company / firm" value={selected.legalVerifier.company} onChange={(e) => updateSelected({ legalVerifier: { ...selected.legalVerifier, company: e.currentTarget.value } })} placeholder="e.g. Tembo & Associates" radius="md" />
                <TextInput label="Role" value={selected.legalVerifier.role} onChange={(e) => updateSelected({ legalVerifier: { ...selected.legalVerifier, role: e.currentTarget.value } })} placeholder="e.g. Internal legal officer" radius="md" />
                <TextInput label="License number" value={selected.legalVerifier.license} onChange={(e) => updateSelected({ legalVerifier: { ...selected.legalVerifier, license: e.currentTarget.value } })} placeholder="e.g. LZ-4471" radius="md" />
              </SimpleGrid>
            </Card>

            <SimpleGrid cols={2} spacing={16}>
              <Paper withBorder radius="md" p="lg" pb={2}>
                <Text fz={13} fw={700} c="dark.7" mb={4}>
                  Title verification
                </Text>
                {selected.titleChecklist.map((item) => (
                  <CompactCheckRow
                    key={item.id}
                    label={item.label}
                    checked={item.status === "Passed"}
                    exception={["Failed", "Exception"].includes(item.status)}
                    note={item.comment}
                    onToggle={() => updateChecklist(selected.id, item.id, { status: item.status === "Passed" ? "Pending" : "Passed" })}
                    onFlag={() => updateChecklist(selected.id, item.id, { status: ["Failed", "Exception"].includes(item.status) ? "Pending" : "Exception" })}
                    onNoteChange={(v) => updateChecklist(selected.id, item.id, { comment: v })}
                  />
                ))}
              </Paper>

              <Paper withBorder radius="md" p="lg" pb={2}>
                <Group justify="space-between" mb={4}>
                  <Text fz={13} fw={700} c="dark.7">
                    Legal checks
                  </Text>
                  <Text fz={10.5} c="dimmed">
                    for {selected.base.type}
                  </Text>
                </Group>
                {selected.legalChecks.map((c) => (
                  <CompactCheckRow
                    key={c.id}
                    label={c.name}
                    checked={c.status === "Passed"}
                    exception={["Failed", "Exception"].includes(c.status)}
                    note={c.comment}
                    onToggle={() => updateLegalCheck(selected.id, c.id, { status: c.status === "Passed" ? "Pending" : "Passed" })}
                    onFlag={() => updateLegalCheck(selected.id, c.id, { status: ["Failed", "Exception"].includes(c.status) ? "Pending" : "Exception" })}
                    onNoteChange={(v) => updateLegalCheck(selected.id, c.id, { comment: v })}
                  />
                ))}
              </Paper>
            </SimpleGrid>

            <DocumentsTable title="Supporting Documents" docs={selected.titleDocs} setDocs={(titleDocs) => updateSelected({ titleDocs })} />
          </>
        )}

        {tab === "financial" && (
          <Card icon={IconChartBar} title="Financial Analysis">
            <SimpleGrid cols={3} spacing={16}>
              <ReadRow label="Final loan amount" value={zmw(finalAmount)} />
              <ReadRow label="Total asset value" value={zmw(totalAssetValue)} />
              <ReadRow label="Total coverage" value={totalCoverage != null ? `${totalCoverage}%` : "—"} />
            </SimpleGrid>
          </Card>
        )}

        <Card icon={IconFileText} title="Underwriter Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            placeholder="General comments, findings, risks, exceptions and recommendations that apply across the review…"
            minRows={2}
            radius="md"
          />
          <Text fz={11} c="dimmed" mt={6}>
            Shared across all assets and tabs, and included in the underwriting audit trail.
          </Text>
        </Card>

        <Card icon={IconClipboardCheck} title="Conclusion by Underwriting Decision">
          <SimpleGrid cols={3} spacing={14} mb={16}>
            <Paper bg="gray.0" radius="md" p="sm">
              <Text fz={11} c="dimmed" mb={4}>
                Assets ({assets.length})
              </Text>
              <Text fz={13} fw={600} mb={6}>
                {zmw(totalAssetValue)}
                {totalCoverage != null && (
                  <Text component="span" fz={11} c="dimmed">
                    {" "}
                    · {totalCoverage}% coverage
                  </Text>
                )}
              </Text>
              <StatusBadge status={readiness.valuationOk ? "Passed" : "Exception"} />
            </Paper>
            <Paper bg="gray.0" radius="md" p="sm">
              <Text fz={11} c="dimmed" mb={4}>
                Title
              </Text>
              <Text fz={13} fw={600} mb={6}>
                {readiness.titleOk ? "Verified" : "Unresolved"}
              </Text>
              <StatusBadge status={readiness.titleOk ? "Passed" : "Exception"} />
            </Paper>
            <Paper bg="gray.0" radius="md" p="sm">
              <Text fz={11} c="dimmed" mb={4}>
                Legal checks
              </Text>
              <Text fz={13} fw={600}>
                {legalCounts.passed} passed · {legalCounts.exception} exception · {legalCounts.failed} failed
              </Text>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={3} spacing={14} mb={16}>
            <Select label="Assignee" data={["ZMW", "Internal team", "Legal"]} value={assignee} onChange={(v) => setAssignee(v || assignee)} radius="md" />
            <Select label="Status" data={["Review Required", "In Progress", "Ready for Decision"]} value={decisionStatus} onChange={(v) => setDecisionStatus(v || decisionStatus)} radius="md" />
            <TextInput label="Legal status" value={legalStatusLabel} readOnly radius="md" />
          </SimpleGrid>

          {!decision ? (
            <SimpleGrid cols={4} spacing={10} style={{ opacity: readiness.ready ? 1 : 0.45, pointerEvents: readiness.ready ? "auto" : "none" }}>
              <Button variant="outline" color="green" radius="xl" leftSection={<IconCircleCheck size={15} />} onClick={() => setDecision("approve")}>
                Approve / Proceed
              </Button>
              <Button variant="outline" color="orange" radius="xl" leftSection={<IconAlertTriangle size={15} />} onClick={() => setDecision("conditions")}>
                Approve with Conditions
              </Button>
              <Button variant="outline" color="brand" radius="xl" leftSection={<IconArrowRight size={15} />} onClick={() => setDecision("refer")}>
                Refer / Further Revision
              </Button>
              <Button variant="outline" color="red" radius="xl" leftSection={<IconCircleX size={15} />} onClick={() => setDecision("reject")}>
                Reject
              </Button>
            </SimpleGrid>
          ) : (
            <Box>
              <Group justify="space-between" mb={14}>
                <Text fz={13} fw={700} c="dark.8">
                  {DECISION_LABEL[decision]}
                </Text>
                <Button variant="subtle" size="compact-sm" onClick={() => setDecision(null)}>
                  Change decision
                </Button>
              </Group>

              {decision === "conditions" && (
                <Box mb={16}>
                  {conditions.map((c, i) => (
                    <Group key={i} align="flex-end" gap={10} mb={10} wrap="nowrap">
                      <TextInput
                        label="Condition"
                        value={c.condition}
                        onChange={(e) => updateCondition(i, { condition: e.currentTarget.value })}
                        placeholder="e.g. Title clearance required before disbursement"
                        style={{ flex: 2 }}
                        radius="md"
                      />
                      <Select label="Responsible party" value={c.responsible} onChange={(v) => updateCondition(i, { responsible: v || c.responsible })} data={["Customer", "Internal", "Legal"]} style={{ flex: 1 }} radius="md" />
                      <Select label="Due before" value={c.dueBefore} onChange={(v) => updateCondition(i, { dueBefore: v || c.dueBefore })} data={["Disbursement", "Offer", "Documentation"]} style={{ flex: 1 }} radius="md" />
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
                <Box mb={16}>
                  <Text fz={11} fw={600} c="dimmed" tt="uppercase" mb={10}>
                    Reason
                  </Text>
                  <Group gap={8} mb={12} wrap="wrap">
                    {REJECT_REASONS.map((r) => (
                      <Button key={r} size="compact-sm" radius="xl" variant={reasonCategory === r ? "light" : "outline"} color={reasonCategory === r ? "brand" : "gray"} onClick={() => setReasonCategory(r)}>
                        {r}
                      </Button>
                    ))}
                  </Group>
                  <Textarea label="Detailed explanation (optional)" value={reasonDetail} onChange={(e) => setReasonDetail(e.currentTarget.value)} placeholder="Add any further detail for the audit trail…" minRows={2} radius="md" />
                </Box>
              )}

              <Paper withBorder radius="md" p="md" mb={16} bg="gray.0">
                <Text fz={12} fw={600} c="dark.8" mb={8}>
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
        </Card>
      </Stack>
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
      padding={0}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <TopBar onMinimize={onMinimize} onClose={onClose} />

        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
          <LeftNav section={section} setSection={setSection} values={applicationValues} />

          <Box style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "var(--mantine-color-gray-0)" }}>
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

            {section === "enrichment" && (
              <Box style={{ height: "100%" }}>
                <EnrichmentModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "underwriting" && (
              <UnderwritingWorkspace
                finalAmount={finalAmount}
                applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId}
                loanTypeLabel={loanTypeLabel}
                onBack={() => setSection("enrichment")}
                onSubmitReady={handleSubmitReady}
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