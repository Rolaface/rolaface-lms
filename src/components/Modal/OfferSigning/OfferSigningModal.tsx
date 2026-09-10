import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Group,
  Text,
  Badge,
  ThemeIcon,
  UnstyledButton,
  Stack,
  Paper,
  Table,
  TextInput,
  Select,
  Checkbox,
  Textarea,
  Button,
  ActionIcon,
  SimpleGrid,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconFileText,
  IconGauge,
  IconScale,
  IconSignature,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconPencil,
  IconCloudUpload,
  IconDownload,
  IconSend,
  IconUsers,
  IconArrowRight,
  IconMinus,
} from "@tabler/icons-react";
import { LoanApplicationModal } from "../LoanApplication/LoanApplicationModal";
import type { LoanApplicationValues } from "../LoanApplication/LoanApplicationModal";
import { PreScreeningModal } from "../PreScreeningModal/PreScreeningModal";
import { EnrichmentModal } from "../Enrichment/EnrichmentModal";
import { UnderwritingModal } from "../UnderwritingModal/UnderwritingModal";
import {
  DUMMY_PERSONAL_LOAN_APPLICATION,
  DUMMY_PRESCREENING_CONTEXT,
} from "../PreScreeningModal/Dummyloanapplicationdata";

interface OfferModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  applicationValues?: LoanApplicationValues;
  embedded?: boolean;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const APPLICATION = {
  id: "APP-58231",
  customer: { name: "Chanda Mwansa", type: "Existing customer", id: "CU-10234", phone: "0977 123 456", email: "chanda.mwansa@example.com" },
  loan: { product: "Personal loan", typeId: "personal", subtype: "Salary-backed", purpose: "Home improvement", amount: 76500, tenure: 24, rate: 25, frequency: "Monthly" },
};

const FINAL_TERMS = { amount: 40183, rate: 25, tenure: 24, frequency: "Monthly", processingFeePct: 2, insurancePct: 1, taxPct: 16 };

function computeSimulation(amount: number, tenure: number, rate: number, frequency: string) {
  const nPeriods = frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  const installment = periodicRate > 0 ? (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) / (Math.pow(1 + periodicRate, nPeriods) - 1) : amount / nPeriods;
  const totalRepayment = installment * nPeriods;
  const first = new Date(); first.setMonth(first.getMonth() + 1);
  const final = new Date(first);
  if (frequency === "Bi-weekly") final.setDate(final.getDate() + 14 * (nPeriods - 1));
  else final.setMonth(final.getMonth() + (nPeriods - 1));
  const schedule = [];
  let balance = amount;
  for (let i = 1; i <= nPeriods; i++) {
    const interestPortion = balance * periodicRate;
    const principalPortion = installment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    const due = new Date(first);
    if (frequency === "Bi-weekly") due.setDate(due.getDate() + 14 * (i - 1));
    else due.setMonth(due.getMonth() + (i - 1));
    schedule.push({ n: i, due, installment, principal: principalPortion, interest: interestPortion, balance });
  }
  return { installment, totalRepayment, totalInterest: totalRepayment - amount, nPeriods, first, final, schedule };
}
const FINAL_SIM = computeSimulation(FINAL_TERMS.amount, FINAL_TERMS.tenure, FINAL_TERMS.rate, FINAL_TERMS.frequency);
const FINAL_FEES = (() => {
  const processingFee = FINAL_TERMS.amount * (FINAL_TERMS.processingFeePct / 100);
  const insurance = FINAL_TERMS.amount * (FINAL_TERMS.insurancePct / 100);
  const tax = (processingFee + insurance) * (FINAL_TERMS.taxPct / 100);
  return { processingFee, insurance, tax, total: processingFee + insurance + tax };
})();
const ISSUED_DATE = new Date();
const VALID_UNTIL = new Date(ISSUED_DATE); VALID_UNTIL.setDate(VALID_UNTIL.getDate() + 14);

const ASSETS_SUMMARY = [{ type: "Motor vehicle", description: "2019 Toyota Hilux D/Cab, registration ABC 1234 ZM", value: 95000 }];

const UNDERWRITING_DECISION = {
  outcome: "conditions",
  conditions: [{ condition: "Obtain a discharge / clearance letter from the existing financier for the vehicle encumbrance.", responsible: "Customer", dueBefore: "Disbursement" }],
  legalCheckCounts: { passed: 5, exception: 1, failed: 0 },
  underwriter: "Logged-in credit officer",
};

const zmw = (n: number | null | undefined) => (n == null || n === "" ? "—" : "ZMW " + Math.round(Number(n)).toLocaleString());
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  Pending: "gray",
  "In Progress": "brand",
  Passed: "green",
  Failed: "red",
  Exception: "orange",
  Accepted: "green",
  Rejected: "red",
  "Offer Accepted": "green",
  "Offer Rejected": "red",
  "Awaiting decision": "brand",
  "Amendment requested": "orange",
  Draft: "gray",
  Generated: "brand",
  "Signing in progress": "orange",
  Executed: "green",
  "Contract Executed": "green",
  Signed: "green",
  Verified: "green",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" radius="xl" color={STATUS_COLORS[status] || "gray"} variant="light">
      {status}
    </Badge>
  );
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
    <Group justify="space-between" py={9} style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-slate-1)" }}>
      <Text fz={12.5} c="slate.5">{label}</Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="slate.9">{value}</Text>
    </Group>
  );
}

const th = { textAlign: "left" as const, padding: "8px 12px", fontWeight: 600, color: "var(--mantine-color-slate-5)", fontSize: 11 };
const td = { padding: "8px 12px", color: "var(--mantine-color-slate-7)" };

type Section = "application" | "prescreening" | "enrichment" | "underwriting" | "offer";

function LeftNav({ section, setSection }: { section: Section; setSection: (s: Section) => void }) {
  const items: { id: Section; label: string; icon: React.FC<any> }[] = [
    { id: "application", label: "Loan application", icon: IconFileText },
    { id: "prescreening", label: "Prescreening", icon: IconGauge },
    { id: "enrichment", label: "Enrichment", icon: IconBuildingBank },
    { id: "underwriting", label: "Underwriting", icon: IconScale },
    { id: "offer", label: "Offer & signing", icon: IconSignature },
  ];
  return (
    <Box w={216} style={{ flexShrink: 0, background: "white", borderRight: "1px solid var(--mantine-color-slate-2)" }} p={12}>
      <Text fz={10.5} fw={600} c="slate.4" tt="uppercase" px={10} mb={10} style={{ letterSpacing: 0.4 }}>
        Stage 5 of 5
      </Text>
      <Stack gap={4}>
        {items.map((it) => {
          const active = section === it.id;
          const Icon = it.icon;
          const isDone = it.id !== "offer";
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
                  <Icon size={16} color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-slate-6)"} />
                  <Text fz="sm" fw={active ? 600 : 500} c={active ? "brand.7" : "slate.7"}>{it.label}</Text>
                </Group>
                {isDone && <IconCheck size={13} color={active ? "var(--mantine-color-brand-7)" : "var(--mantine-color-green-6)"} />}
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}

function ContextHeader({ values, applicationId }: { values: LoanApplicationValues; applicationId: string; }) {
  const isBusiness = values.loanType === "Business";
  const name = isBusiness ? values.companyName : [values.firstName, values.surname].filter(Boolean).join(" ");
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Group justify="space-between" align="center" px="xl" py="sm" bg="white" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
      <Group gap={12}>
        <ThemeIcon radius="xl" size={36} variant="light" color="brand">
          <Text fz="sm" fw={700}>{initials || "—"}</Text>
        </ThemeIcon>
        <Box>
          <Text fz="sm" fw={700} c="slate.9">{name || "—"}</Text>
          <Text fz="xs" c="slate.5">{isBusiness ? "Business Loan" : "Personal Loan"}</Text>
        </Box>
      </Group>
      <Group gap={26}>
        <Box ta="right">
          <Text fz={10.5} c="slate.4">Approved amount</Text>
          <Text fz={13.5} fw={700} c="slate.9">{zmw(FINAL_TERMS.amount)}</Text>
        </Box>
        <Box ta="right">
          <Text fz={10.5} c="slate.4">Application ID</Text>
          <Text fz={13.5} fw={700} c="slate.9">{applicationId}</Text>
        </Box>
      </Group>
    </Group>
  );
}

function CollapsibleStep({ index, title, status, summary, onEdit, active, children }: any) {
  const isDone = status === "done";
  return (
    <Paper withBorder radius="md" mb={14} style={{ overflow: "hidden", borderColor: active ? "var(--mantine-color-brand-2)" : undefined }}>
      <Group justify="space-between" px={18} py={14} bg={active ? "brand.0" : "white"}>
        <Group gap={12}>
          <ThemeIcon radius="xl" size={26} color={isDone || active ? "brand" : "gray"} variant={isDone || active ? "filled" : "light"}>
            {isDone ? <IconCheck size={14} /> : <Text fz={12} fw={600}>{index}</Text>}
          </ThemeIcon>
          <Box>
            <Text fz={14} fw={600} c="slate.9">{title}</Text>
            {summary && <Text fz={12.5} c="slate.5" mt={1}>{summary}</Text>}
          </Box>
        </Group>
        {isDone && onEdit && (
          <Button variant="subtle" size="compact-sm" onClick={onEdit} leftSection={<IconPencil size={12} />}>
            Change
          </Button>
        )}
      </Group>
      {active && <Box p="md">{children}</Box>}
    </Paper>
  );
}

const AMEND_FIELDS = ["Requested amount", "Tenure", "Interest rate", "Repayment frequency", "Other terms"];
const ROUTE_STAGES = ["Enrichment", "Underwriting", "Prescreening"];

function OfferWorkspace() {
  const [offerStatus, setOfferStatus] = useState("pending"); // pending | accepted | rejected | amendment
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [amendField, setAmendField] = useState(AMEND_FIELDS[0]);
  const [amendDetail, setAmendDetail] = useState("");
  const [amendRoute, setAmendRoute] = useState(ROUTE_STAGES[0]);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showAmendForm, setShowAmendForm] = useState(false);

  const [contractStatus, setContractStatus] = useState("not_generated"); // not_generated | generated
  const [signingMethod, setSigningMethod] = useState<string | null>(null); // esign | physical
  const [signatories, setSignatories] = useState([
    { name: APPLICATION.customer.name, role: "Customer", status: "Pending" },
    { name: "Bwalya Mumba", role: "Bank officer", status: "Pending" },
  ]);
  const [physical, setPhysical] = useState({ dispatch: "Not dispatched", received: false, uploaded: false, verification: "Pending" });
  const [executed, setExecuted] = useState(false);

  const overallStatus = executed ? "Contract Executed"
    : offerStatus === "rejected" ? "Offer Rejected"
    : offerStatus === "amendment" ? "Amendment requested"
    : offerStatus === "accepted" ? (contractStatus === "not_generated" ? "Offer Accepted" : signingMethod ? "Signing in progress" : "Generated")
    : "Awaiting decision";

  const allSigned = signingMethod === "esign" ? signatories.every((s) => s.status === "Signed")
    : signingMethod === "physical" ? physical.received && physical.uploaded && physical.verification === "Verified" : false;

  function toggleSignatory(i: number) {
    setSignatories(signatories.map((s, idx) => (idx === i ? { ...s, status: s.status === "Signed" ? "Pending" : "Signed" } : s)));
  }

  function downloadOffer() {
    const lines = [
      `LOAN OFFER — ${APPLICATION.id}`,
      `Issued ${fmtDate(ISSUED_DATE)} · Valid until ${fmtDate(VALID_UNTIL)}`,
      "",
      `Customer: ${APPLICATION.customer.name} (${APPLICATION.customer.id})`,
      `Loan type: ${APPLICATION.loan.product} — ${APPLICATION.loan.subtype}`,
      `Purpose: ${APPLICATION.loan.purpose}`,
      "",
      `Approved amount: ${zmw(FINAL_TERMS.amount)}`,
      `Interest rate: ${FINAL_TERMS.rate}% p.a. (fixed)`,
      `Tenure: ${FINAL_TERMS.tenure} months`,
      `Repayment frequency: ${FINAL_TERMS.frequency}`,
      "",
      `Estimated ${FINAL_TERMS.frequency.toLowerCase()} installment: ${zmw(FINAL_SIM.installment)}`,
      `Total interest: ${zmw(FINAL_SIM.totalInterest)}`,
      `Total repayment: ${zmw(FINAL_SIM.totalRepayment)}`,
      `First payment due: ${fmtDate(FINAL_SIM.first)}`,
      `Final payment due: ${fmtDate(FINAL_SIM.final)}`,
      "",
      `Processing fee: ${zmw(FINAL_FEES.processingFee)}`,
      `Credit life insurance: ${zmw(FINAL_FEES.insurance)}`,
      `Tax on fees: ${zmw(FINAL_FEES.tax)}`,
      `Total fees and charges: ${zmw(FINAL_FEES.total)}`,
      "",
      "Collateral / security:",
      ...ASSETS_SUMMARY.map((a) => `  - ${a.type}: ${a.description}`),
      "",
      "Key conditions:",
      ...UNDERWRITING_DECISION.conditions.map((c) => `  - ${c.condition} (${c.responsible}, due before ${c.dueBefore.toLowerCase()})`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Loan-Offer-${APPLICATION.id}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Box p={30}>
      <Group justify="space-between" align="center" mb={18}>
        <Box>
          <Text fz={15} fw={700} c="slate.9">Offer &amp; signing</Text>
          <Text fz={12} c="slate.5" mt={2}>Issue the offer, capture the customer's response, then generate and execute the contract.</Text>
        </Box>
        <StatusBadge status={overallStatus} />
      </Group>

      <CollapsibleStep
        index={1} title="Loan offer" active={offerStatus === "pending"}
        status={offerStatus !== "pending" ? "done" : "active"}
        summary={offerStatus === "accepted" ? "Offer accepted by customer" : offerStatus === "rejected" ? "Offer rejected by customer" : offerStatus === "amendment" ? "Amendment requested" : ""}
        onEdit={() => { setOfferStatus("pending"); setContractStatus("not_generated"); setSigningMethod(null); setExecuted(false); }}
      >
        {offerStatus === "pending" && (
          <Box>
            <Group justify="space-between" mb={14}>
              <Text fz={12} c="slate.4">Issued {fmtDate(ISSUED_DATE)} · Valid until {fmtDate(VALID_UNTIL)}</Text>
              <Button size="compact-sm" variant="light" color="brand" radius="md" onClick={downloadOffer} leftSection={<IconDownload size={13} />}>
                Download offer
              </Button>
            </Group>

            <Paper bg="brand.0" p="lg" radius="md" style={{ border: "1px solid var(--mantine-color-brand-2)", textAlign: "center" }} mb={20}>
              <Text fz={11.5} fw={600} c="brand.7" mb={4}>Approved loan amount</Text>
              <Text fz={28} fw={800} c="brand.9">{zmw(FINAL_TERMS.amount)}</Text>
              <Text fz={11.5} c="brand.7" mt={2}>for {APPLICATION.loan.purpose.toLowerCase()}</Text>
            </Paper>

            <SectionLabel>Customer &amp; loan</SectionLabel>
            <Paper withBorder radius="md" px="md" mb={18}>
              <SimRow label="Customer" value={`${APPLICATION.customer.name} (${APPLICATION.customer.id})`} />
              <SimRow label="Loan type" value={`${APPLICATION.loan.product} — ${APPLICATION.loan.subtype}`} />
              <SimRow label="Loan purpose" value={APPLICATION.loan.purpose} />
              <SimRow label="Interest rate" value={`${FINAL_TERMS.rate}% p.a. (fixed)`} />
              <SimRow label="Tenure" value={`${FINAL_TERMS.tenure} months`} />
              <SimRow label="Repayment frequency" value={FINAL_TERMS.frequency} last />
            </Paper>

            <SectionLabel>Repayment</SectionLabel>
            <Paper withBorder radius="md" px="md" mb={10}>
              <SimRow label={`Estimated ${FINAL_TERMS.frequency.toLowerCase()} installment`} value={zmw(FINAL_SIM.installment)} strong />
              <SimRow label="Total interest" value={zmw(FINAL_SIM.totalInterest)} />
              <SimRow label="Total repayment" value={zmw(FINAL_SIM.totalRepayment)} />
              <SimRow label="First payment due" value={fmtDate(FINAL_SIM.first)} />
              <SimRow label="Final payment due" value={fmtDate(FINAL_SIM.final)} last />
            </Paper>

            <UnstyledButton onClick={() => setScheduleOpen(!scheduleOpen)} mb={18}>
              <Group gap={4}>
                <Text fz={12} fw={500} c="brand.6">{scheduleOpen ? "Hide full repayment schedule" : "View full repayment schedule"}</Text>
                {scheduleOpen ? <IconChevronUp size={13} c="brand.6" /> : <IconChevronDown size={13} c="brand.6" />}
              </Group>
            </UnstyledButton>
            {scheduleOpen && (
              <Paper withBorder radius="md" mb={18} style={{ overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
                <Table fz={12} stickyHeader>
                  <Table.Thead bg="slate.0">
                    <Table.Tr>
                      <Table.Th style={th}>#</Table.Th><Table.Th style={th}>Due date</Table.Th><Table.Th style={th}>Installment</Table.Th><Table.Th style={th}>Principal</Table.Th><Table.Th style={th}>Interest</Table.Th><Table.Th style={th}>Balance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {FINAL_SIM.schedule.map((row) => (
                      <Table.Tr key={row.n}>
                        <Table.Td style={td}>{row.n}</Table.Td><Table.Td style={td}>{fmtDate(row.due)}</Table.Td><Table.Td style={td}>{zmw(row.installment)}</Table.Td><Table.Td style={td}>{zmw(row.principal)}</Table.Td><Table.Td style={td}>{zmw(row.interest)}</Table.Td><Table.Td style={td}>{zmw(row.balance)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            <SectionLabel>Fees and charges</SectionLabel>
            <Paper withBorder radius="md" px="md" mb={18}>
              <SimRow label="Processing fee" value={zmw(FINAL_FEES.processingFee)} />
              <SimRow label="Credit life insurance" value={zmw(FINAL_FEES.insurance)} />
              <SimRow label="Tax on fees" value={zmw(FINAL_FEES.tax)} />
              <SimRow label="Total fees and charges" value={zmw(FINAL_FEES.total)} last strong />
            </Paper>

            <SectionLabel>Collateral / security</SectionLabel>
            <Paper withBorder radius="md" px="md" mb={18}>
              {ASSETS_SUMMARY.map((a, i) => <SimRow key={a.description} label={a.type} value={a.description} last={i === ASSETS_SUMMARY.length - 1} />)}
            </Paper>

            <SectionLabel>Key conditions</SectionLabel>
            <Box mb={20}>
              {UNDERWRITING_DECISION.conditions.map((c, i) => (
                <Group key={i} align="flex-start" gap={8} p="sm" bg="orange.0" style={{ border: "1px solid var(--mantine-color-orange-2)", borderRadius: 10, marginBottom: 8 }} wrap="nowrap">
                  <IconAlertTriangle size={14} color="var(--mantine-color-orange-7)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Text fz={12.5} c="orange.9">
                    {c.condition} <Text component="span" c="orange.7">— {c.responsible}, due before {c.dueBefore.toLowerCase()}</Text>
                  </Text>
                </Group>
              ))}
            </Box>

            {!showRejectForm && !showAmendForm && (
              <Group gap={10}>
                <Button color="green" radius="md" onClick={() => setOfferStatus("accepted")} leftSection={<IconCheck size={14} />}>Accept offer</Button>
                <Button variant="default" radius="md" onClick={() => setShowAmendForm(true)}>Request amendment</Button>
                <Button variant="outline" color="red" radius="md" onClick={() => setShowRejectForm(true)}>Reject offer</Button>
              </Group>
            )}

            {showRejectForm && (
              <Paper bg="red.0" p="md" radius="md" style={{ border: "1px solid var(--mantine-color-red-2)" }}>
                <SectionLabel>Reject offer</SectionLabel>
                <Textarea label="Reason (required)" value={rejectReason} onChange={(e) => setRejectReason(e.currentTarget.value)} placeholder="Why is the customer rejecting this offer?" radius="md" />
                <Group gap={10} mt={12}>
                  <Button color="red" radius="md" disabled={!rejectReason.trim()} onClick={() => setOfferStatus("rejected")}>Confirm rejection</Button>
                  <Button variant="default" radius="md" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                </Group>
              </Paper>
            )}

            {showAmendForm && (
              <Paper bg="orange.0" p="md" radius="md" style={{ border: "1px solid var(--mantine-color-orange-2)" }}>
                <SectionLabel>Request amendment</SectionLabel>
                <SimpleGrid cols={2} spacing={14} mb={12}>
                  <Select label="What is changing" value={amendField} onChange={(v) => setAmendField(v || AMEND_FIELDS[0])} data={AMEND_FIELDS} radius="md" />
                  <Select label="Route back to" value={amendRoute} onChange={(v) => setAmendRoute(v || ROUTE_STAGES[0])} data={ROUTE_STAGES} radius="md" />
                </SimpleGrid>
                <Textarea label="Describe the requested change" value={amendDetail} onChange={(e) => setAmendDetail(e.currentTarget.value)} placeholder="e.g. Customer wants tenure extended to 36 months to lower the installment." radius="md" />
                <Group gap={10} mt={12}>
                  <Button color="orange" radius="md" disabled={!amendDetail.trim()} onClick={() => setOfferStatus("amendment")}>Submit amendment request</Button>
                  <Button variant="default" radius="md" onClick={() => setShowAmendForm(false)}>Cancel</Button>
                </Group>
              </Paper>
            )}
          </Box>
        )}
      </CollapsibleStep>

      {offerStatus === "rejected" && (
        <Paper bg="red.0" p="lg" radius="md" style={{ border: "1.5px solid var(--mantine-color-red-3)" }}>
          <Group gap={10} mb={8}>
            <IconCircleX size={20} color="var(--mantine-color-red-6)" />
            <Text fz={15} fw={700} c="red.9">Offer rejected</Text>
          </Group>
          <Text fz={12.5} c="red.8">Reason: {rejectReason}</Text>
        </Paper>
      )}

      {offerStatus === "amendment" && (
        <Paper bg="orange.0" p="lg" radius="md" style={{ border: "1.5px solid var(--mantine-color-orange-3)" }}>
          <Group gap={10} mb={8}>
            <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
            <Text fz={15} fw={700} c="orange.9">Routed back for amendment</Text>
          </Group>
          <Text fz={12.5} c="orange.8" mb={4}>Change requested: <strong>{amendField}</strong> — {amendDetail}</Text>
          <Text fz={12.5} c="orange.8">Application sent back to the <strong>{amendRoute}</strong> stage for review and recalculation.</Text>
        </Paper>
      )}

      {offerStatus === "accepted" && (
        <CollapsibleStep index={2} title="Contract & signing" active status={executed ? "done" : "active"} summary={executed ? "Contract executed" : ""}>
          {contractStatus === "not_generated" ? (
            <Box py={20} ta="center">
              <IconFileText size={24} color="var(--mantine-color-slate-4)" style={{ marginBottom: 8 }} />
              <Text fz={13} c="slate.5" mb={12}>Generate the final loan contract using the approved terms.</Text>
              <Button color="brand" radius="md" onClick={() => setContractStatus("generated")}>Generate contract</Button>
            </Box>
          ) : (
            <Box>
              <SectionLabel right={<StatusBadge status={executed ? "Executed" : "Generated"} />}>Contract</SectionLabel>
              <Paper bg="slate.0" withBorder radius="md" p="md" mb={20}>
                <Paper bg="white" withBorder radius="md" p="lg" mb={12} style={{ fontSize: 12, color: "var(--mantine-color-slate-5)", lineHeight: 1.7 }}>
                  <Text fz={12} fw={700} c="slate.9" mb={6}>LOAN AGREEMENT — {APPLICATION.id}</Text>
                  Between the Lender and {APPLICATION.customer.name} for a {APPLICATION.loan.product.toLowerCase()} of {zmw(FINAL_TERMS.amount)} at {FINAL_TERMS.rate}% p.a. over {FINAL_TERMS.tenure} months, repayable {FINAL_TERMS.frequency.toLowerCase()}…
                  <Text mt={8} c="slate.3">[ contract preview — full document continues ]</Text>
                </Paper>
                <Group justify="space-between" align="center">
                  <Text fz={11.5} c="slate.4">Document version v1.0</Text>
                  <Group gap={8}>
                    <Button size="compact-sm" variant="light" color="brand" radius="md" leftSection={<IconDownload size={12} />}>Download</Button>
                    <Button size="compact-sm" variant="default" radius="md">Print</Button>
                  </Group>
                </Group>
              </Paper>

              {!executed && !signingMethod && (
                <Box>
                  <SectionLabel>Signing method</SectionLabel>
                  <SimpleGrid cols={2} spacing={12} mb={4}>
                    <UnstyledButton onClick={() => setSigningMethod("esign")} p="md" bg="white" style={{ border: "1.5px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)", display: "flex", gap: 12 }}>
                      <ThemeIcon radius="md" size={36} color="gray" variant="light"><IconSend size={16} /></ThemeIcon>
                      <Box>
                        <Text fz={14} fw={600} c="slate.9">E-signature</Text>
                        <Text fz={12} c="slate.5">Send for digital signature</Text>
                      </Box>
                    </UnstyledButton>
                    <UnstyledButton onClick={() => setSigningMethod("physical")} p="md" bg="white" style={{ border: "1.5px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)", display: "flex", gap: 12 }}>
                      <ThemeIcon radius="md" size={36} color="gray" variant="light"><IconSignature size={16} /></ThemeIcon>
                      <Box>
                        <Text fz={14} fw={600} c="slate.9">Physical signature</Text>
                        <Text fz={12} c="slate.5">Print, sign, and return</Text>
                      </Box>
                    </UnstyledButton>
                  </SimpleGrid>
                </Box>
              )}

              {!executed && signingMethod === "esign" && (
                <Box>
                  <SectionLabel right={<Text fz={11} c="slate.4">{signatories.filter((s) => s.status === "Signed").length} / {signatories.length} signed</Text>}>Signatories</SectionLabel>
                  <Box mb={14} style={{ height: 6, background: "var(--mantine-color-slate-1)", borderRadius: 4, overflow: "hidden" }}>
                    <Box style={{ height: "100%", width: `${(signatories.filter((s) => s.status === "Signed").length / signatories.length) * 100}%`, background: "var(--mantine-color-brand-6)", borderRadius: 4 }} />
                  </Box>
                  <Paper withBorder radius="md" mb={14} style={{ overflow: "hidden" }}>
                    {signatories.map((s, i) => (
                      <Group key={s.name} justify="space-between" align="center" px="md" py={11} style={{ borderTop: i > 0 ? "1px solid var(--mantine-color-slate-1)" : "none" }}>
                        <Group gap={8}>
                          <IconUsers size={14} color="var(--mantine-color-slate-4)" />
                          <Box>
                            <Text fz={12.5} fw={500}>{s.name}</Text>
                            <Text fz={10.5} c="slate.4">{s.role}</Text>
                          </Box>
                        </Group>
                        <UnstyledButton onClick={() => toggleSignatory(i)}>
                          <StatusBadge status={s.status} />
                        </UnstyledButton>
                      </Group>
                    ))}
                  </Paper>
                  <Text fz={11.5} c="slate.4" mb={14}>Click a status pill to simulate a signature being received.</Text>
                </Box>
              )}

              {!executed && signingMethod === "physical" && (
                <Box>
                  <SectionLabel>Physical signature tracking</SectionLabel>
                  <SimpleGrid cols={2} spacing={14} mb={14}>
                    <Select label="Dispatch / hand-over status" value={physical.dispatch} onChange={(v) => setPhysical({ ...physical, dispatch: v || physical.dispatch })} data={["Not dispatched", "Dispatched", "Handed over"]} radius="md" />
                    <Box>
                      <Text fz={12} fw={500} c="slate.7" mb={5}>Verification status</Text>
                      <StatusBadge status={physical.verification} />
                    </Box>
                  </SimpleGrid>
                  <Checkbox label="Signed document received" checked={physical.received} onChange={(e) => setPhysical({ ...physical, received: e.currentTarget.checked })} mb={12} />
                  {!physical.uploaded ? (
                    <Button size="sm" variant="light" color="brand" radius="md" mb={12} onClick={() => setPhysical({ ...physical, uploaded: true, verification: "Pending" })} leftSection={<IconCloudUpload size={14} />}>
                      Upload signed document
                    </Button>
                  ) : (
                    <Group justify="space-between" align="center" p="sm" mb={12} bg="white" style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)" }}>
                      <Group gap={8}>
                        <IconFileText size={14} color="var(--mantine-color-slate-4)" />
                        <Text fz={12.5}>Signed contract — {APPLICATION.id}.pdf</Text>
                      </Group>
                      <Button size="compact-sm" variant="light" color="brand" radius="md" onClick={() => setPhysical({ ...physical, verification: "Verified" })}>
                        Mark verified
                      </Button>
                    </Group>
                  )}
                </Box>
              )}

              {!executed && signingMethod && (
                <Box>
                  <Button color={allSigned ? "green" : "gray"} radius="md" disabled={!allSigned} onClick={() => setExecuted(true)} rightSection={<IconArrowRight size={15} />}>
                    Mark contract executed
                  </Button>
                  {!allSigned && <Text fz={11.5} c="slate.4" mt={6}>All required signatures must be completed first.</Text>}
                </Box>
              )}

              {executed && (
                <Paper bg="green.0" p="lg" radius="md" ta="center" style={{ border: "1.5px solid var(--mantine-color-green-2)" }}>
                  <IconCircleCheck size={28} color="var(--mantine-color-green-6)" style={{ marginBottom: 8 }} />
                  <Text fz={14.5} fw={700} c="slate.9">Contract executed</Text>
                  <Text fz={12.5} c="slate.5" mt={4}>All required signatures completed via {signingMethod === "esign" ? "e-signature" : "physical signature"}. The loan is ready for disbursement.</Text>
                </Paper>
              )}
            </Box>
          )}
        </CollapsibleStep>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function OfferModal({
  opened,
  onClose,
  applicationValues = DUMMY_PERSONAL_LOAN_APPLICATION,
  onMinimize,
}: OfferModalProps) {
  const [section, setSection] = useState<Section>("offer");

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
        <Group justify="space-between" align="center" px="xl" py="sm" bg="brand.6" style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}>
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconSignature size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>Loan application workflow</Text>
              <Text size="xs" fw={500} c="brand.1">Stage 5 — Offer & signing</Text>
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

        <ContextHeader values={applicationValues} applicationId={DUMMY_PRESCREENING_CONTEXT.applicationId} />

        <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
          <LeftNav section={section} setSection={setSection} />

          <Box style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
            {section === "application" && (
              <Box style={{ height: "100%" }}>
                <LoanApplicationModal embedded readOnly initialValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
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
              <Box style={{ height: "100%" }}>
                <UnderwritingModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "offer" && <OfferWorkspace />}
          </Box>
        </Box>

        <Group justify="space-between" align="center" px="xl" py="md" bg="white" style={{ borderTop: "1px solid var(--mantine-color-gray-2)", flexShrink: 0 }}>
          <Button variant="transparent" c="dark.8" px={0} fw={600} onClick={onClose}>
            Close
          </Button>
          <Button color="brand" radius="md" onClick={onClose}>
            Complete workflow
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}