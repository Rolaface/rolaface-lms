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
  Table,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  Textarea,
  Button,
  ActionIcon,
  Tabs,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconFileText,
  IconGauge,
  IconScale,
  IconShieldCheck,
  IconClipboardList,
  IconCamera,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconArrowRight,
  IconMinus,
  IconPaperclip,
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

function computeSimulation(amount: number, tenure: number, rate: number, frequency: string) {
  const nPeriods = frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  const installment =
    periodicRate > 0
      ? (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) /
        (Math.pow(1 + periodicRate, nPeriods) - 1)
      : amount / nPeriods;
  const totalRepayment = installment * nPeriods;
  return { installment, totalRepayment, totalInterest: totalRepayment - amount, nPeriods };
}

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Group justify="space-between" align="center" mb={10}>
      <Text fz={11} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: 0.3 }}>
        {children}
      </Text>
      {right}
    </Group>
  );
}

function SimRow({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <Group
      justify="space-between"
      py={9}
      style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-slate-1)" }}
    >
      <Text fz={12.5} c="slate.5">
        {label}
      </Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="slate.9">
        {value}
      </Text>
    </Group>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box>
      <Text fz={11} c="slate.5">
        {label}
      </Text>
      <Text fz={16} fw={700} c={accent ? "orange.7" : "slate.9"}>
        {value}
      </Text>
    </Box>
  );
}

function ReadRow({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <Box style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <Text fz={11.5} c="slate.4" mb={3}>
        {label}
      </Text>
      <Text fz={13.5} fw={600} c="slate.9">
        {value ?? "—"}
      </Text>
    </Box>
  );
}

const th = { textAlign: "left" as const, padding: "8px 12px", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11 };
const td = { padding: "8px 12px", color: "var(--mantine-color-slate-7)" };

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

const CHECK_STATUSES = ["Pending", "In Progress", "Passed", "Failed", "Exception"];
const DOC_STATUSES = ["Missing", "Uploaded", "Verified", "Rejected"];

function StatusSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options?: string[] }) {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v || value)}
      data={options || CHECK_STATUSES}
      radius="xl"
      size="xs"
      w={140}
      allowDeselect={false}
    />
  );
}

function SourceBadge({ source }: { source: "bureau" | "hrms" | "application" | "manual" }) {
  const map: Record<string, { label: string; color: string }> = {
    bureau: { label: "Credit bureau", color: "brand" },
    hrms: { label: "HRMS", color: "brand" },
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

type Section = "application" | "prescreening" | "enrichment" | "underwriting";

function LeftNav({ section, setSection }: { section: Section; setSection: (s: Section) => void }) {
  const items: { id: Section; label: string; icon: React.FC<any> }[] = [
    { id: "application", label: "Loan application", icon: IconFileText },
    { id: "prescreening", label: "Prescreening", icon: IconGauge },
    { id: "enrichment", label: "Enrichment", icon: IconBuildingBank },
    { id: "underwriting", label: "Underwriting", icon: IconScale },
  ];
  return (
    <Box
      w={216}
      style={{ flexShrink: 0, background: "white", borderRight: "1px solid var(--mantine-color-slate-2)" }}
      p={12}
    >
      <Text fz={10.5} fw={600} c="slate.4" tt="uppercase" px={10} mb={10} style={{ letterSpacing: 0.4 }}>
        Stage 4 of 5
      </Text>
      <Stack gap={4}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          const isDone = it.id !== "underwriting";
          return (
            <UnstyledButton
              key={it.id}
              onClick={() => setSection(it.id)}
              px={12}
              py={10}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                background: active ? "var(--mantine-color-brand-0)" : "transparent",
              }}
            >
              <Group gap={10} justify="space-between" wrap="nowrap">
                <Group gap={10}>
                  <Icon
                    size={16}
                    color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-slate-6)"}
                  />
                  <Text fz="sm" fw={active ? 600 : 500} c={active ? "brand.7" : "slate.7"}>
                    {it.label}
                  </Text>
                </Group>
                {isDone && (
                  <IconCheck
                    size={13}
                    color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-green-6)"}
                  />
                )}
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}

function ContextHeader({
  values,
  applicationId,
  finalAmount,
}: {
  values: LoanApplicationValues;
  applicationId: string;
  finalAmount: number;
}) {
  const isBusiness = values.loanType === "Business";
  const name = isBusiness
    ? values.companyName
    : [values.firstName, values.surname].filter(Boolean).join(" ");
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Group
      justify="space-between"
      align="center"
      px="xl"
      py="sm"
      bg="white"
      style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}
    >
      <Group gap={12}>
        <ThemeIcon radius="xl" size={36} variant="light" color="brand">
          <Text fz="sm" fw={700}>
            {initials || "—"}
          </Text>
        </ThemeIcon>
        <Box>
          <Text fz="sm" fw={700} c="slate.9">
            {name || "—"}
          </Text>
          <Text fz="xs" c="slate.5">
            {isBusiness ? "Business Loan" : "Personal Loan"}
          </Text>
        </Box>
      </Group>
      <Group gap={26}>
        <Box ta="right">
          <Text fz={10.5} c="slate.4">
            Final amount
          </Text>
          <Text fz={13.5} fw={700} c="slate.9">
            {zmw(finalAmount)}
          </Text>
        </Box>
        <Box ta="right">
          <Text fz={10.5} c="slate.4">
            Application ID
          </Text>
          <Text fz={13.5} fw={700} c="slate.9">
            {applicationId}
          </Text>
        </Box>
      </Group>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Asset model
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
  valuation: {
    amount: string;
    currency: string;
    method: string;
    marketValue: string;
    forcedSaleValue: string;
    notes: string;
  };
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
  titleChecklist: TitleChecklistItem[];
  observations: { findings: string; risks: string; recommendations: string };
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
    title: {
      titleNumber: "",
      propertyRef: base.assetId || "",
      propertyType: base.type,
      location: base.location || "",
      registrationInfo: "",
      registeredOwner: base.owner || "",
    },
    titleChecklist: [
      { id: "titleVerified", label: "Title verified", status: "Pending", comment: "" },
      { id: "ownershipVerified", label: "Ownership verified", status: "Pending", comment: "" },
      { id: "encumbrances", label: "Encumbrances checked", status: "Pending", comment: "" },
      { id: "liens", label: "Existing liens checked", status: "Pending", comment: "" },
      { id: "restrictions", label: "Restrictions checked", status: "Pending", comment: "" },
    ],
    observations: { findings: "", risks: "", recommendations: "" },
    titleDocs: [
      { name: "Title deed / ownership document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Search report", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Legal opinion", tier: "optional", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
    ],
    legalChecks: getApplicableChecks(base.type).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.defaultStatus,
      finding: c.finding,
      why: c.why || "",
      action: c.action || "",
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
  a.title = {
    titleNumber: "MV-ZM-119284",
    propertyRef: "AST-33021",
    propertyType: "Motor vehicle",
    location: "Lusaka, Zambia",
    registrationInfo: "Registered with RTSA, Lusaka",
    registeredOwner: "Chanda Mwansa",
  };
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
// Documents table
// ---------------------------------------------------------------------------

function DocumentsTable({ title, docs, setDocs }: { title: string; docs: AssetDoc[]; setDocs: (d: AssetDoc[]) => void }) {
  const update = (i: number, patch: Partial<AssetDoc>) => setDocs(docs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDoc = () =>
    setDocs([...docs, { name: "New document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" }]);
  const removeDoc = (i: number) => setDocs(docs.filter((_, idx) => idx !== i));

  return (
    <Box>
      <SectionLabel
        right={
          <Button size="compact-xs" variant="light" radius="xl" onClick={addDoc}>
            + Add document
          </Button>
        }
      >
        {title}
      </SectionLabel>
      <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
        {docs.length === 0 && (
          <Text fz={12.5} c="slate.4" ta="center" py="md">
            No documents added yet.
          </Text>
        )}
        {docs.map((d, i) => (
          <Box key={i} px="md" py={10} style={{ borderTop: i > 0 ? "1px solid var(--mantine-color-slate-1)" : "none" }}>
            <Group justify="space-between" wrap="nowrap" gap={10}>
              <Group gap={8} style={{ flex: 1, minWidth: 0 }}>
                <IconFileText size={14} color="var(--mantine-color-slate-4)" style={{ flexShrink: 0 }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <TextInput
                    variant="unstyled"
                    value={d.name}
                    onChange={(e) => update(i, { name: e.currentTarget.value })}
                    size="xs"
                    styles={{ input: { fontWeight: 500, fontSize: 12.5, padding: 0, minHeight: "auto", height: "auto" } }}
                  />
                  <Group gap={6}>
                    <Select
                      data={["required", "optional"]}
                      value={d.tier}
                      onChange={(v) => update(i, { tier: (v as "required" | "optional") || "required" })}
                      variant="unstyled"
                      size="xs"
                      w={80}
                      styles={{ input: { fontSize: 10.5, color: "var(--mantine-color-slate-4)", padding: 0, minHeight: "auto", height: "auto" } }}
                    />
                    <Text fz={10.5} c="slate.4">
                      · uploaded {d.uploadedDate || "—"} by {d.uploadedBy || "—"}
                    </Text>
                  </Group>
                </Box>
              </Group>
              <Group gap={8} wrap="nowrap">
                <Button size="compact-xs" variant="light" radius="xl">
                  Preview
                </Button>
                <Select
                  data={DOC_STATUSES}
                  value={d.status}
                  onChange={(v) => update(i, { status: v || d.status })}
                  size="xs"
                  radius="xl"
                  w={120}
                  allowDeselect={false}
                />
                <ActionIcon variant="subtle" color="gray" onClick={() => removeDoc(i)}>
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Group>
            <TextInput
              value={d.comment}
              onChange={(e) => update(i, { comment: e.currentTarget.value })}
              placeholder="Verification comment (optional)"
              size="xs"
              radius="md"
              mt={8}
            />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Readiness
// ---------------------------------------------------------------------------

interface Readiness {
  valuationOk: boolean;
  titleOk: boolean;
  legalOk: boolean;
  docsOk: boolean;
  ready: boolean;
  blockers: string[];
}

function ReadinessRow({ label, ok, note }: { label: string; ok: boolean; note: string }) {
  return (
    <Group justify="space-between" py={9} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
      <Text fz={12.5} c="slate.7">
        {label}
      </Text>
      <Group gap={5}>
        {ok ? <IconCheck size={13} color="var(--mantine-color-green-7)" /> : <IconAlertTriangle size={13} color="var(--mantine-color-orange-6)" />}
        <Text fz={12} fw={600} c={ok ? "green.7" : "orange.6"}>
          {note}
        </Text>
      </Group>
    </Group>
  );
}

function ReadinessPanel({ readiness }: { readiness: Readiness }) {
  return (
    <Paper withBorder radius="md" p="md" mb={22}>
      <SectionLabel>Underwriting readiness</SectionLabel>
      <ReadinessRow label="Asset valuation" ok={readiness.valuationOk} note={readiness.valuationOk ? "Completed" : "Not completed"} />
      <ReadinessRow label="Title verification" ok={readiness.titleOk} note={readiness.titleOk ? "Completed" : "Unresolved item(s)"} />
      <ReadinessRow label="Legal checks" ok={readiness.legalOk} note={readiness.legalOk ? "Completed" : "Unresolved item(s)"} />
      <Box style={{ borderBottom: "none" }}>
        <ReadinessRow label="Supporting documents" ok={readiness.docsOk} note={readiness.docsOk ? "Complete" : "Missing required document(s)"} />
      </Box>

      <Box
        mt={12}
        p="sm"
        style={{
          borderRadius: 9,
          background: readiness.ready ? "var(--mantine-color-green-0)" : "var(--mantine-color-yellow-0)",
          border: `1px solid ${readiness.ready ? "var(--mantine-color-green-2)" : "var(--mantine-color-yellow-3)"}`,
        }}
      >
        {readiness.ready ? (
          <Group gap={7}>
            <IconCircleCheck size={14} color="var(--mantine-color-green-7)" />
            <Text fz={12.5} fw={600} c="green.7">
              Ready for decision
            </Text>
          </Group>
        ) : (
          <>
            <Group gap={7} mb={4}>
              <IconAlertTriangle size={14} color="var(--mantine-color-orange-7)" />
              <Text fz={12.5} fw={600} c="orange.8">
                Not ready for decision
              </Text>
            </Group>
            <Box component="ul" pl={20} m={0}>
              {readiness.blockers.map((b) => (
                <Text component="li" key={b} fz={12} c="orange.8">
                  {b}
                </Text>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Asset switcher
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
    <Box mb={16}>
      <SectionLabel>Assets offered as security ({assets.length})</SectionLabel>
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
                border: `1.5px solid ${active ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-2)"}`,
                background: active ? "var(--mantine-color-brand-0)" : "white",
              }}
            >
              <Text fz={12} fw={600} c={active ? "brand.7" : "slate.9"}>
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
        <Paper withBorder radius="md" p="sm" bg="slate.0">
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
      <Text fz={12.5} c="slate.4" py={9}>
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
  refer: "Refer / Require Further Review",
  reject: "Reject",
};

const REJECT_REASONS = ["Insufficient collateral", "Ownership issue", "Legal risk", "Invalid documentation", "Unresolved exception", "Valuation issue", "Other"];

interface Condition {
  condition: string;
  responsible: string;
  dueBefore: string;
}

function DecisionButton({ label, tone, onClick }: { label: string; tone: string; onClick: () => void }) {
  return (
    <Button variant="outline" color={tone} radius="md" onClick={onClick} styles={{ root: { height: "auto", padding: "14px 10px", whiteSpace: "normal" }, label: { fontSize: 12.5, fontWeight: 700 } }}>
      {label}
    </Button>
  );
}

function DecisionSection({
  readiness,
  decision,
  setDecision,
  conditions,
  addCondition,
  updateCondition,
  removeCondition,
  reasonCategory,
  setReasonCategory,
  reasonDetail,
  setReasonDetail,
  decisionReady,
  legalCounts,
  assetCount,
  totalAssetValue,
  totalCoverage,
  onComplete,
}: {
  readiness: Readiness;
  decision: Decision;
  setDecision: (d: Decision) => void;
  conditions: Condition[];
  addCondition: () => void;
  updateCondition: (i: number, patch: Partial<Condition>) => void;
  removeCondition: (i: number) => void;
  reasonCategory: string;
  setReasonCategory: (v: string) => void;
  reasonDetail: string;
  setReasonDetail: (v: string) => void;
  decisionReady: boolean;
  legalCounts: { passed: number; exception: number; failed: number };
  assetCount: number;
  totalAssetValue: number;
  totalCoverage: number | null;
  onComplete: () => void;
}) {
  return (
    <Paper withBorder radius="md" p="lg">
      <SectionLabel>Consolidated underwriting decision</SectionLabel>

      <SimpleGrid cols={3} spacing={14} mb={18}>
        <Paper bg="slate.0" radius="md" p="sm">
          <Text fz={11} c="slate.5" mb={4}>
            Assets ({assetCount})
          </Text>
          <Text fz={13} fw={600} mb={6}>
            {zmw(totalAssetValue)}
            {totalCoverage != null && (
              <Text component="span" fz={11} c="slate.5">
                {" "}
                · {totalCoverage}% coverage
              </Text>
            )}
          </Text>
          <StatusBadge status={readiness.valuationOk ? "Passed" : "Exception"} />
        </Paper>
        <Paper bg="slate.0" radius="md" p="sm">
          <Text fz={11} c="slate.5" mb={4}>
            Title
          </Text>
          <Text fz={13} fw={600} mb={6}>
            {readiness.titleOk ? "Verified" : "Unresolved"}
          </Text>
          <StatusBadge status={readiness.titleOk ? "Passed" : "Exception"} />
        </Paper>
        <Paper bg="slate.0" radius="md" p="sm">
          <Text fz={11} c="slate.5" mb={4}>
            Legal checks
          </Text>
          <Text fz={13} fw={600}>
            {legalCounts.passed} passed · {legalCounts.exception} exception · {legalCounts.failed} failed
          </Text>
        </Paper>
      </SimpleGrid>

      {!readiness.ready ? (
        <Group gap={8} p="sm" bg="yellow.0" style={{ border: "1px solid var(--mantine-color-yellow-3)", borderRadius: 9 }}>
          <IconAlertTriangle size={14} color="var(--mantine-color-orange-7)" />
          <Text fz={12.5} c="orange.8">
            Resolve the readiness items above before a decision can be made.
          </Text>
        </Group>
      ) : !decision ? (
        <SimpleGrid cols={4} spacing={10}>
          <DecisionButton label="Approve / Proceed" tone="green" onClick={() => setDecision("approve")} />
          <DecisionButton label="Approve with Conditions" tone="orange" onClick={() => setDecision("conditions")} />
          <DecisionButton label="Refer / Further Review" tone="brand" onClick={() => setDecision("refer")} />
          <DecisionButton label="Reject" tone="red" onClick={() => setDecision("reject")} />
        </SimpleGrid>
      ) : (
        <Box>
          <Group justify="space-between" mb={14}>
            <Text fz={13} fw={700} c="slate.9">
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
                  <Select
                    label="Responsible party"
                    value={c.responsible}
                    onChange={(v) => updateCondition(i, { responsible: v || c.responsible })}
                    data={["Customer", "Internal", "Legal"]}
                    style={{ flex: 1 }}
                    radius="md"
                  />
                  <Select
                    label="Due before"
                    value={c.dueBefore}
                    onChange={(v) => updateCondition(i, { dueBefore: v || c.dueBefore })}
                    data={["Disbursement", "Offer", "Documentation"]}
                    style={{ flex: 1 }}
                    radius="md"
                  />
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
              <SectionLabel>Reason</SectionLabel>
              <Group gap={8} mb={12} wrap="wrap">
                {REJECT_REASONS.map((r) => (
                  <Button
                    key={r}
                    size="compact-sm"
                    radius="xl"
                    variant={reasonCategory === r ? "light" : "outline"}
                    color={reasonCategory === r ? "brand" : "gray"}
                    onClick={() => setReasonCategory(r)}
                  >
                    {r}
                  </Button>
                ))}
              </Group>
              <Textarea
                label="Detailed explanation (optional)"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.currentTarget.value)}
                placeholder="Add any further detail for the audit trail…"
                minRows={2}
                radius="md"
              />
            </Box>
          )}

          <Paper withBorder radius="md" p="md" mb={16} bg="slate.0">
            <Text fz={12} fw={600} c="slate.9" mb={8}>
              Decision summary
            </Text>
            <SimRow label="Decision" value={DECISION_LABEL[decision]} />
            <SimRow label="Assets reviewed" value={String(assetCount)} />
            <SimRow label="Title verification" value={readiness.titleOk ? "Passed" : "Unresolved"} />
            <SimRow label="Legal checks" value={`${legalCounts.passed} passed / ${legalCounts.exception} exception`} />
            {decision === "conditions" && <SimRow label="Conditions" value={String(conditions.length)} />}
            {(decision === "refer" || decision === "reject") && <SimRow label="Reason" value={reasonCategory || "—"} />}
            <SimRow label="Underwriter" value="Logged-in credit officer" last />
          </Paper>

          <Button
            disabled={!decisionReady}
            onClick={() => decisionReady && onComplete()}
            color="brand"
            radius="md"
            rightSection={<IconArrowRight size={16} />}
          >
            Complete underwriting
          </Button>
          {!decisionReady && (
            <Text fz={11.5} c="slate.4" mt={6}>
              {decision === "conditions" ? "Add at least one condition to continue." : "Select a reason to continue."}
            </Text>
          )}
        </Box>
      )}
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Underwriting workspace
// ---------------------------------------------------------------------------

function UnderwritingWorkspace({
  finalAmount,
  onSubmitReady,
}: {
  finalAmount: number;
  onSubmitReady?: (canSubmit: boolean, submit: () => void) => void;
}) {
  const [tab, setTab] = useState<"asset" | "title" | "checks">("asset");
  const [assets, setAssets] = useState<Asset[]>(() => [makeSeedAsset()]);
  const [selectedId, setSelectedId] = useState<string>(() => assets[0]?.id ?? "");
  const [notes, setNotes] = useState("");
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

  const ownershipMatches =
    selected.title.registeredOwner.trim().toLowerCase() === selected.base.owner.trim().toLowerCase() && !!selected.base.owner;
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
  }, [canSubmit]);

  if (completed) {
    return (
      <Box py={70} px={30} ta="center">
        <ThemeIcon radius="xl" size={44} color="green" variant="light" mx="auto" mb={10}>
          <IconCircleCheck size={26} />
        </ThemeIcon>
        <Text fz="md" fw={700} c="slate.9">
          Moving to Stage 5 — Offer &amp; Signing
        </Text>
        <Text fz={12.5} c="slate.5" mt={6}>
          Decision: {decision ? DECISION_LABEL[decision] : "—"}
          {decision === "conditions" ? ` · ${conditions.length} condition(s)` : ""}
        </Text>
      </Box>
    );
  }

  return (
    <Box p={30}>
      <Group justify="space-between" align="center" mb={18}>
        <Box>
          <Text fz={15} fw={700} c="slate.9">
            Underwriting workspace
          </Text>
          <Text fz={12} c="slate.5" mt={2}>
            Review security, verify title, and complete legal checks before a consolidated decision.
          </Text>
        </Box>
      </Group>

      <ReadinessPanel readiness={readiness} />

      <AssetSwitcher assets={assets} selectedId={selected.id} onSelect={setSelectedId} onAdd={addAsset} />

      <Paper withBorder radius="md" mb={22} style={{ overflow: "hidden" }}>
        <Tabs value={tab} onChange={(v) => setTab((v as "asset" | "title" | "checks") || "asset")}>
          <Tabs.List>
            <Tabs.Tab value="asset" leftSection={<IconCamera size={14} />}>
              Asset valuation
            </Tabs.Tab>
            <Tabs.Tab value="title" leftSection={<IconShieldCheck size={14} />}>
              Legal / title verification
            </Tabs.Tab>
            <Tabs.Tab value="checks" leftSection={<IconClipboardList size={14} />}>
              Legal checks
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Box p="lg">
          <Text fz={12} fw={600} c="brand.7" mb={16}>
            Reviewing: {selected.base.description}
          </Text>

          {tab === "asset" && (
            <Stack gap={22}>
              <Box>
                <SectionLabel right={<SourceBadge source={selected.source} />}>Asset details</SectionLabel>
                {selected.source === "application" ? (
                  <SimpleGrid cols={2} spacing={14} bg="slate.0" p="md" style={{ borderRadius: 12, border: "1px solid var(--mantine-color-slate-2)" }}>
                    <ReadRow label="Asset type" value={selected.base.type} />
                    <ReadRow label="Asset ID" value={selected.base.assetId} />
                    <ReadRow label="Location" value={selected.base.location} />
                    <ReadRow label="Owner" value={selected.base.owner} />
                    <ReadRow label="Description" value={selected.base.description} span={2} />
                    <ReadRow label="Acquisition information" value={selected.base.acquisition} span={2} />
                  </SimpleGrid>
                ) : (
                  <SimpleGrid cols={2} spacing={14} bg="slate.0" p="md" style={{ borderRadius: 12, border: "1px solid var(--mantine-color-slate-2)" }}>
                    <Select label="Asset type" value={selected.base.type} onChange={(v) => updateSelected({ base: { ...selected.base, type: v || selected.base.type } })} data={DUMMY_ASSET_TYPES} radius="md" />
                    <TextInput label="Asset ID / reference" value={selected.base.assetId} onChange={(e) => updateSelected({ base: { ...selected.base, assetId: e.currentTarget.value } })} placeholder="e.g. AST-33022" radius="md" />
                    <TextInput label="Location" value={selected.base.location} onChange={(e) => updateSelected({ base: { ...selected.base, location: e.currentTarget.value } })} placeholder="e.g. Lusaka, Zambia" radius="md" />
                    <TextInput label="Owner" value={selected.base.owner} onChange={(e) => updateSelected({ base: { ...selected.base, owner: e.currentTarget.value } })} radius="md" />
                    <TextInput label="Description" value={selected.base.description} onChange={(e) => updateSelected({ base: { ...selected.base, description: e.currentTarget.value } })} style={{ gridColumn: "1 / -1" }} radius="md" />
                    <TextInput label="Acquisition / value information" value={selected.base.acquisition} onChange={(e) => updateSelected({ base: { ...selected.base, acquisition: e.currentTarget.value } })} style={{ gridColumn: "1 / -1" }} radius="md" />
                  </SimpleGrid>
                )}
              </Box>

              <Box>
                <SectionLabel
                  right={
                    <Badge size="sm" radius="xl" color="orange" variant="light">
                      Underwriter verified
                    </Badge>
                  }
                >
                  Valuation
                </SectionLabel>
                <SimpleGrid cols={2} spacing={14} mb={14}>
                  <NumberInput label="Valuation amount" value={selected.valuation.amount ? Number(selected.valuation.amount) : undefined} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, amount: v ? String(v) : "" } })} placeholder="e.g. 95000" suffix=" ZMW" radius="md" />
                  <Select label="Valuation method" value={selected.valuation.method} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, method: v || selected.valuation.method } })} data={["Market comparison", "Cost approach", "Income approach"]} radius="md" />
                  <NumberInput label="Market value" value={selected.valuation.marketValue ? Number(selected.valuation.marketValue) : undefined} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, marketValue: v ? String(v) : "" } })} placeholder="e.g. 98000" suffix=" ZMW" radius="md" />
                  <NumberInput label="Forced sale / realizable value" value={selected.valuation.forcedSaleValue ? Number(selected.valuation.forcedSaleValue) : undefined} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, forcedSaleValue: v ? String(v) : "" } })} placeholder="e.g. 76000" suffix=" ZMW" radius="md" />
                </SimpleGrid>
                <Textarea label="Valuation notes" value={selected.valuation.notes} onChange={(e) => updateSelected({ valuation: { ...selected.valuation, notes: e.currentTarget.value } })} placeholder="Condition, mileage, any relevant observations…" minRows={2} radius="md" />

                {coverage != null && (
                  <Group mt={14} p="sm" gap={26} bg="brand.0" style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: 10 }}>
                    <MiniStat label="This asset's value" value={zmw(selected.valuation.amount)} />
                    <MiniStat label="Final loan amount" value={zmw(finalAmount)} />
                    <MiniStat label="Coverage" value={`${coverage}%`} accent={coverage < 120} />
                  </Group>
                )}
              </Box>

              <Box>
                <SectionLabel>Valuer information</SectionLabel>
                <SimpleGrid cols={2} spacing={14} mb={10}>
                  <TextInput label="Valuer name" value={selected.valuer.name} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, name: e.currentTarget.value } })} placeholder="e.g. K. Zulu" radius="md" />
                  <TextInput label="Valuer / company" value={selected.valuer.company} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, company: e.currentTarget.value } })} placeholder="e.g. Apex Valuers Ltd" radius="md" />
                  <TextInput label="Registration / license number" value={selected.valuer.license} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, license: e.currentTarget.value } })} placeholder="e.g. VAL-2291" radius="md" />
                  <TextInput label="Contact" value={selected.valuer.contact} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, contact: e.currentTarget.value } })} placeholder="Phone or email" radius="md" />
                </SimpleGrid>
                <Checkbox checked={selected.valuer.verified} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, verified: e.currentTarget.checked } })} label="Valuer meets the configured panel requirements" />
              </Box>

              <Box>
                <SectionLabel>Valuation date</SectionLabel>
                <SimpleGrid cols={2} spacing={14}>
                  <TextInput type="date" label="Valuation date" value={selected.valuationDate} onChange={(e) => updateSelected({ valuationDate: e.currentTarget.value })} radius="md" />
                  <Box>
                    <Text fz={12} fw={500} c="slate.7" mb={5}>
                      Validity
                    </Text>
                    <ValidityNote date={selected.valuationDate} days={selected.expiryDays} />
                  </Box>
                </SimpleGrid>
              </Box>

              <Box>
                <SectionLabel right={<StatusSelect value={selected.status} onChange={(v) => updateSelected({ status: v })} />}>Valuation status</SectionLabel>
                {["Failed", "Exception"].includes(selected.status) && (
                  <Textarea label="Finding / reason (required)" value={selected.reason} onChange={(e) => updateSelected({ reason: e.currentTarget.value })} placeholder="Explain why the valuation failed or is an exception…" minRows={2} radius="md" />
                )}
              </Box>

              <DocumentsTable title="Supporting documents" docs={selected.docs} setDocs={(docs) => updateSelected({ docs })} />
            </Stack>
          )}

          {tab === "title" && (
            <Stack gap={22}>
              <Box>
                <SectionLabel right={<SourceBadge source={selected.source} />}>Title / property information</SectionLabel>
                <SimpleGrid cols={2} spacing={14}>
                  <TextInput label="Title number" value={selected.title.titleNumber} onChange={(e) => updateSelected({ title: { ...selected.title, titleNumber: e.currentTarget.value } })} radius="md" />
                  <TextInput label="Property / asset reference" value={selected.title.propertyRef} onChange={(e) => updateSelected({ title: { ...selected.title, propertyRef: e.currentTarget.value } })} radius="md" />
                  <TextInput label="Property type" value={selected.title.propertyType} onChange={(e) => updateSelected({ title: { ...selected.title, propertyType: e.currentTarget.value } })} radius="md" />
                  <TextInput label="Location" value={selected.title.location} onChange={(e) => updateSelected({ title: { ...selected.title, location: e.currentTarget.value } })} radius="md" />
                  <TextInput label="Registration information" value={selected.title.registrationInfo} onChange={(e) => updateSelected({ title: { ...selected.title, registrationInfo: e.currentTarget.value } })} style={{ gridColumn: "1 / -1" }} radius="md" />
                </SimpleGrid>
              </Box>

              <Box>
                <SectionLabel>Ownership verification</SectionLabel>
                <SimpleGrid cols={2} spacing={14} mb={12}>
                  <TextInput label="Registered owner (from title document)" value={selected.title.registeredOwner} onChange={(e) => updateSelected({ title: { ...selected.title, registeredOwner: e.currentTarget.value } })} radius="md" />
                  <ReadRow label="Applicant / pledgor" value={selected.base.owner || "—"} />
                </SimpleGrid>
                {ownershipMatches ? (
                  <Group gap={7} p="sm" bg="green.0" style={{ border: "1px solid var(--mantine-color-green-2)", borderRadius: 9 }}>
                    <IconCheck size={14} color="var(--mantine-color-green-7)" />
                    <Text fz={12.5} fw={600} c="green.7">
                      Ownership matches
                    </Text>
                  </Group>
                ) : (
                  <Group gap={7} p="sm" bg="yellow.0" style={{ border: "1px solid var(--mantine-color-yellow-3)", borderRadius: 9 }}>
                    <IconAlertTriangle size={14} color="var(--mantine-color-orange-7)" />
                    <Text fz={12.5} fw={600} c="orange.7">
                      Ownership mismatch — requires review
                    </Text>
                  </Group>
                )}
              </Box>

              <Box>
                <SectionLabel>Title verification</SectionLabel>
                <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
                  {selected.titleChecklist.map((item, i) => (
                    <Box key={item.id} px="md" py={10} style={{ borderTop: i > 0 ? "1px solid var(--mantine-color-slate-1)" : "none" }}>
                      <Group justify="space-between">
                        <Text fz={12.5} c="slate.7">
                          {item.label}
                        </Text>
                        <StatusSelect value={item.status} onChange={(v) => updateChecklist(selected.id, item.id, { status: v })} />
                      </Group>
                      {["Failed", "Exception"].includes(item.status) && (
                        <TextInput
                          value={item.comment}
                          onChange={(e) => updateChecklist(selected.id, item.id, { comment: e.currentTarget.value })}
                          placeholder="Comment required to resolve this item"
                          size="xs"
                          radius="md"
                          mt={8}
                          error={!item.comment}
                        />
                      )}
                    </Box>
                  ))}
                </Paper>
              </Box>

              <Box>
                <SectionLabel>Legal observations</SectionLabel>
                <Stack gap={12}>
                  <Textarea label="Findings" value={selected.observations.findings} onChange={(e) => updateSelected({ observations: { ...selected.observations, findings: e.currentTarget.value } })} placeholder="What was found during the review…" minRows={2} radius="md" />
                  <Textarea label="Risks / issues identified" value={selected.observations.risks} onChange={(e) => updateSelected({ observations: { ...selected.observations, risks: e.currentTarget.value } })} placeholder="Any risks worth flagging…" minRows={2} radius="md" />
                  <Textarea label="Recommendations" value={selected.observations.recommendations} onChange={(e) => updateSelected({ observations: { ...selected.observations, recommendations: e.currentTarget.value } })} placeholder="Recommended next steps…" minRows={2} radius="md" />
                </Stack>
              </Box>

              <DocumentsTable title="Supporting documents" docs={selected.titleDocs} setDocs={(titleDocs) => updateSelected({ titleDocs })} />
            </Stack>
          )}

          {tab === "checks" && (
            <Box>
              <SectionLabel
                right={
                  <Text fz={11} c="slate.4">
                    {selected.legalChecks.filter((c) => c.status === "Passed").length} passed ·{" "}
                    {selected.legalChecks.filter((c) => c.status === "Exception").length} exception ·{" "}
                    {selected.legalChecks.filter((c) => c.status === "Failed").length} failed
                  </Text>
                }
              >
                Legal checks — configured for {selected.base.type}
              </SectionLabel>
              <Stack gap={10}>
                {selected.legalChecks.map((c) => {
                  const expand = ["Failed", "Exception"].includes(c.status);
                  return (
                    <Paper key={c.id} withBorder radius="md" p="md" style={{ borderColor: expand ? "var(--mantine-color-yellow-3)" : undefined }}>
                      <Group justify="space-between">
                        <Text fz={13} fw={600} c="slate.9">
                          {c.name}
                        </Text>
                        <StatusSelect value={c.status} onChange={(v) => updateLegalCheck(selected.id, c.id, { status: v })} />
                      </Group>
                      <TextInput value={c.finding} onChange={(e) => updateLegalCheck(selected.id, c.id, { finding: e.currentTarget.value })} placeholder="What was found…" size="xs" radius="md" mt={8} />
                      {expand && (
                        <Stack gap={8} mt={10} p="sm" bg="yellow.0" style={{ borderRadius: 9, border: "1px solid var(--mantine-color-yellow-3)" }}>
                          <Box>
                            <Text fz={11} fw={600} c="orange.8" mb={4}>
                              Why this is a problem
                            </Text>
                            <TextInput value={c.why} onChange={(e) => updateLegalCheck(selected.id, c.id, { why: e.currentTarget.value })} placeholder="Explain the risk this creates…" size="xs" radius="md" bg="white" />
                          </Box>
                          <Box>
                            <Text fz={11} fw={600} c="orange.8" mb={4}>
                              Action required
                            </Text>
                            <TextInput value={c.action} onChange={(e) => updateLegalCheck(selected.id, c.id, { action: e.currentTarget.value })} placeholder="What needs to happen before this clears…" size="xs" radius="md" bg="white" />
                          </Box>
                          <Box>
                            <Text fz={11} fw={600} c="orange.8" mb={4}>
                              Underwriter comment (required to resolve)
                            </Text>
                            <TextInput value={c.comment} onChange={(e) => updateLegalCheck(selected.id, c.id, { comment: e.currentTarget.value })} placeholder="Add your acknowledgement or next step…" size="xs" radius="md" bg="white" error={!c.comment} />
                          </Box>
                          <Group gap={8}>
                            <Button size="compact-xs" variant="outline" color="orange" leftSection={<IconPaperclip size={11} />}>
                              Attach evidence
                            </Button>
                          </Group>
                        </Stack>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper withBorder radius="md" p="md" mb={22}>
        <SectionLabel>Underwriter notes</SectionLabel>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          placeholder="General comments, findings, risks, exceptions and recommendations that apply across the review…"
          minRows={3}
          radius="md"
        />
        <Text fz={11} c="slate.4" mt={6}>
          Shared across all assets and tabs, and included in the underwriting audit trail.
        </Text>
      </Paper>

      <DecisionSection
        readiness={readiness}
        decision={decision}
        setDecision={setDecision}
        conditions={conditions}
        addCondition={addCondition}
        updateCondition={updateCondition}
        removeCondition={removeCondition}
        reasonCategory={reasonCategory}
        setReasonCategory={setReasonCategory}
        reasonDetail={reasonDetail}
        setReasonDetail={setReasonDetail}
        decisionReady={decisionReady}
        legalCounts={legalCounts}
        assetCount={assets.length}
        totalAssetValue={totalAssetValue}
        totalCoverage={totalCoverage}
        onComplete={() => setCompleted(true)}
      />
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

  const [canSubmit, setCanSubmit] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const handleSubmitReady = (ready: boolean, submit: () => void) => {
    setCanSubmit(ready);
    submitRef.current = submit;
  };

  const handleSubmit = () => {
    submitRef.current();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={1400}
      padding={0}
      lockScroll
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      <Box style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconScale size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                Loan application workflow
              </Text>
              <Text size="xs" fw={500} c="brand.1">
                Stage 4 — Underwriting
              </Text>
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

        <ContextHeader values={applicationValues} applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId} finalAmount={finalAmount} />

        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
          <LeftNav section={section} setSection={setSection} />

          <Box style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
            {section === "application" && (
              <Box style={{ height: "100%" }}>
                <Group
                  gap={10}
                  align="flex-start"
                  m="md"
                  p="sm"
                  bg="brand.0"
                  style={{ border: "1px solid var(--mantine-color-brand-2)", borderRadius: "var(--mantine-radius-md)" }}
                >
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
                <PreScreeningModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} />
              </Box>
            )}

            {section === "enrichment" && (
              <Box style={{ height: "100%" }}>
                <EnrichmentModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "underwriting" && <UnderwritingWorkspace finalAmount={finalAmount} onSubmitReady={handleSubmitReady} />}
          </Box>
        </Box>

        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="md"
          bg="white"
          style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}
        >
          <Button variant="transparent" c="dark.8" px={0} fw={600} onClick={onClose}>
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