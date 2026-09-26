import { useState } from "react";
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
  Grid,
  Tooltip,
  Accordion,
  Anchor,

  Pagination,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconFileText,
  IconGauge,
  IconScale,
  IconSignature,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconPencil,
  IconCloudUpload,
  IconDownload,
  IconSend,

  IconArrowRight,
  IconArrowLeft,
  IconMinus,
  IconShieldCheck,
} from "@tabler/icons-react";
import '../PreScreeningModal/prescreening.css';
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
    const opening = balance;
    const interestPortion = balance * periodicRate;
    const principalPortion = installment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    const due = new Date(first);
    if (frequency === "Bi-weekly") due.setDate(due.getDate() + 14 * (i - 1));
    else due.setMonth(due.getMonth() + (i - 1));
    schedule.push({ n: i, due, opening, installment, principal: principalPortion, interest: interestPortion, balance });
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

const zmw = (n: number | null | undefined) => (n == null ? "—" : "ZMW " + Math.round(n).toLocaleString());
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

// Small reusable icon-only back button
function BackIconButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <Tooltip label={label} withArrow position="bottom" openDelay={300}>
      <ActionIcon
        variant="light"
        color="gray"
        radius="xl"
        size={30}
        onClick={onClick}
        aria-label={label}
      >
        <IconArrowLeft size={15} />
      </ActionIcon>
    </Tooltip>
  );
}

function SectionLabel({ children, right, left }: { children: React.ReactNode; right?: React.ReactNode; left?: React.ReactNode }) {
  return (
    <Group justify="space-between" align="center" mb={10}>
      <Group gap={8} align="center">
        {left}
        <Text fz={11} fw={600} c="slate.5" tt="uppercase" style={{ letterSpacing: 0.3 }}>
          {children}
        </Text>
      </Group>
      {right}
    </Group>
  );
}

function SimRow({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <Group justify="space-between" py={5} style={{ borderBottom: last ? "none" : "1px solid var(--mantine-color-slate-1)" }}>
      <Text fz={12.5} c="slate.5">{label}</Text>
      <Text fz={12.5} fw={strong ? 700 : 600} c="slate.9">{value}</Text>
    </Group>
  );
}




type Section = "application" | "prescreening" | "appraisal" | "underwriting" | "offer";

function LeftNav({ section, setSection }: { section: Section; setSection: (s: Section) => void }) {
  const items: { id: Section; label: string; icon: React.FC<any> }[] = [
    { id: "application", label: "Loan application", icon: IconFileText },
    { id: "prescreening", label: "Prescreening", icon: IconGauge },
    { id: "appraisal", label: "Loan Appraisal", icon: IconBuildingBank },
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
    <Group justify="space-between" align="center" px="xl" py={6} bg="white" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
      <Group gap={12}>
        <ThemeIcon radius="xl" size={32} variant="light" color="brand">
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



const AMEND_FIELDS = ["Requested amount", "Tenure", "Interest rate", "Repayment frequency", "Other terms"];
const ROUTE_STAGES = ["Loan Appraisal", "Underwriting", "Prescreening"];



function OfferPendingView({
  onAccept,
  onReject,
  onAmend,
  scheduleOpen,
  setScheduleOpen,
}: {
  onAccept: () => void;
  onReject: () => void;
  onAmend: () => void;
  scheduleOpen: boolean;
  setScheduleOpen: (v: boolean) => void;
}) {
  const netDisbursed = FINAL_TERMS.amount - FINAL_FEES.total;
  const [schedulePage, setSchedulePage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const paginatedSchedule = FINAL_SIM.schedule.slice((schedulePage - 1) * ITEMS_PER_PAGE, schedulePage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(FINAL_SIM.schedule.length / ITEMS_PER_PAGE);

  return (
    <Box>
      {/* Approval Status Bar */}
      <Group justify="space-between" align="center" bg="slate.0" p="xs" mb="sm" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-slate-2)" }}>
         <Group gap="lg" pl="xs">
           <Group gap={6}>
             <Text fz={10.5} fw={700} c="slate.5" tt="uppercase">Prescreening</Text>
             <Badge color="green" variant="light" size="sm" radius="sm" style={{ textTransform: 'none' }}>Passed</Badge>
           </Group>
           <Group gap={6}>
             <Text fz={10.5} fw={700} c="slate.5" tt="uppercase">Risk Grade</Text>
             <Badge color="indigo" variant="light" size="sm" radius="sm" style={{ textTransform: 'none' }}>A (Low Risk)</Badge>
           </Group>
           <Group gap={6}>
             <Text fz={10.5} fw={700} c="slate.5" tt="uppercase">DTI</Text>
             <Text fz={12} fw={600} c="slate.8">34%</Text>
           </Group>
           <Group gap={6}>
             <Text fz={10.5} fw={700} c="slate.5" tt="uppercase">Legal</Text>
             <Text fz={12} fw={600} c="slate.8">5 Passed, 1 Exception</Text>
           </Group>
           <Group gap={6}>
             <Text fz={10.5} fw={700} c="slate.5" tt="uppercase">Underwriting</Text>
             <Badge color="green" variant="light" size="sm" radius="sm" style={{ textTransform: 'none' }}>Approved</Badge>
           </Group>
         </Group>
         <Badge color="indigo" variant="light" size="md" radius="sm" style={{ textTransform: 'none' }}>Valid until {fmtDate(VALID_UNTIL)}</Badge>
      </Group>

      {/* Key Stats Grid */}
      <SimpleGrid cols={4} spacing="sm" mb="md">
        <Paper withBorder className="ps-surface" p="xs" radius="md" bg="blue.0" style={{ borderTop: '3px solid var(--mantine-color-blue-5)', borderColor: 'var(--mantine-color-blue-2)' }}>
           <Text fz={11} c="blue.8" mb={2} fw={600}>Monthly installment</Text>
           <Text fz={18} fw={800} c="blue.9" lh={1.1}>{zmw(FINAL_SIM.installment)}</Text>
        </Paper>
        <Paper withBorder className="ps-surface" p="xs" radius="md" bg="orange.0" style={{ borderTop: '3px solid var(--mantine-color-orange-4)', borderColor: 'var(--mantine-color-orange-2)' }}>
           <Text fz={11} c="orange.8" mb={2} fw={600}>Interest rate</Text>
           <Text fz={18} fw={800} c="orange.9" lh={1.1}>{FINAL_TERMS.rate}% p.a.</Text>
        </Paper>
        <Paper withBorder className="ps-surface" p="xs" radius="md" bg="cyan.0" style={{ borderTop: '3px solid var(--mantine-color-cyan-5)', borderColor: 'var(--mantine-color-cyan-2)' }}>
           <Text fz={11} c="cyan.8" mb={2} fw={600}>Tenure</Text>
           <Text fz={18} fw={800} c="cyan.9" lh={1.1}>{FINAL_TERMS.tenure} months</Text>
        </Paper>
        <Paper withBorder className="ps-surface" p="xs" radius="md" bg="teal.0" style={{ borderTop: '3px solid var(--mantine-color-teal-5)', borderColor: 'var(--mantine-color-teal-2)' }}>
           <Text fz={11} c="teal.8" mb={2} fw={600}>Total repayment</Text>
           <Text fz={18} fw={800} c="teal.9" lh={1.1}>{zmw(FINAL_SIM.totalRepayment)}</Text>
        </Paper>
      </SimpleGrid>

      {/* Repayment & Fees Details */}
      <Grid mb="md">
        <Grid.Col span={6}>
          <Paper withBorder className="ps-surface" p="sm" radius="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Group justify="space-between" align="center" mb={8}>
              <Text fz={13} fw={700} c="slate.8">Repayment structure</Text>
              
              <Anchor fz={11.5} fw={600} c="brand" style={{ textDecoration: 'underline', textUnderlineOffset: 2 }} onClick={(e: any) => { e.preventDefault(); setScheduleOpen(true); }}>
                View schedule
              </Anchor>

              <Modal 
                opened={scheduleOpen} 
                onClose={() => setScheduleOpen(false)} 
                title={<Text fw={700} fz={16} c="slate.9">Repayment schedule</Text>}
                centered
                size="xl"
                zIndex={2000}
                withCloseButton
                closeButtonProps={{ size: 'sm' }}
                radius="md"
              >
                <Group justify="space-between" align="center" mb="sm">
                  <Text fz={12} c="slate.5">
                    {FINAL_TERMS.tenure} instalments · Reducing balance · {FINAL_TERMS.rate}% p.a.
                  </Text>
                  <Button
                    size="xs"
                    radius="xl"
                    color="brand"
                    leftSection={<IconDownload size={14} />}
                    onClick={() => {}}
                  >
                    Export
                  </Button>
                </Group>
                <Paper withBorder className="ps-surface" radius="md" style={{ overflow: "hidden" }}>
                  <Table striped verticalSpacing="xs" fz={12.5}>
                    <Table.Thead bg="slate.1">
                      <Table.Tr>
                        <Table.Th c="slate.6" fz={11} fw={700}>NO.</Table.Th>
                        <Table.Th c="slate.6" fz={11} fw={700} style={{ whiteSpace: "nowrap" }}>DUE DATE</Table.Th>
                        <Table.Th c="slate.6" fz={11} fw={700}>OPENING</Table.Th>
                        <Table.Th c="slate.6" fz={11} fw={700}>PRINCIPAL</Table.Th>
                        <Table.Th c="slate.6" fz={11} fw={700}>INTEREST</Table.Th>
                        <Table.Th c="blue.8" fz={11} fw={800}>INSTALMENT</Table.Th>
                        <Table.Th c="teal.8" fz={11} fw={800}>BALANCE</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedSchedule.map((row) => (
                        <Table.Tr key={row.n}>
                          <Table.Td>{row.n}</Table.Td>
                          <Table.Td style={{ whiteSpace: "nowrap" }}>{fmtDate(row.due)}</Table.Td>
                          <Table.Td>{zmw(row.opening)}</Table.Td>
                          <Table.Td>{zmw(row.principal)}</Table.Td>
                          <Table.Td>{zmw(row.interest)}</Table.Td>
                          <Table.Td fw={600} c="blue.7">{zmw(row.installment)}</Table.Td>
                          <Table.Td fw={600} c="teal.7">{zmw(row.balance)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  {totalPages > 1 && (
                    <Box p="xs" bg="slate.0" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
                      <Group justify="center">
                        <Pagination size="sm" total={totalPages} value={schedulePage} onChange={setSchedulePage} />
                      </Group>
                    </Box>
                  )}
                </Paper>
              </Modal>

            </Group>
            <Box style={{ flexGrow: 1 }}>
              <SimRow label="First payment due date" value={fmtDate(FINAL_SIM.first)} />
              <SimRow label="Final maturity date" value={fmtDate(FINAL_SIM.final)} />
              <SimRow label="Frequency" value={FINAL_TERMS.frequency} />
              <SimRow label="Total interest payable" value={zmw(FINAL_SIM.totalInterest)} />
              <SimRow label="Disbursement method" value="Direct bank transfer" />
              <Group justify="space-between" py={5}>
                <Text fz={12.5} c="slate.5">Payroll deduction</Text>
                <Badge color="green" variant="light" size="sm" radius="sm" style={{ textTransform: 'none' }}>Verified</Badge>
              </Group>
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper withBorder className="ps-surface" p="sm" radius="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Group justify="space-between" align="center" mb={8}>
              <Text fz={13} fw={700} c="slate.8">Fees & statutory charges</Text>
              <Text fz={11} c="slate.5">Pre-deducted</Text>
            </Group>
            <Box style={{ flexGrow: 1 }}>
              <SimRow label={`Processing fee (${FINAL_TERMS.processingFeePct}%)`} value={zmw(FINAL_FEES.processingFee)} />
              <SimRow label={`Credit life insurance (${FINAL_TERMS.insurancePct}%)`} value={zmw(FINAL_FEES.insurance)} />
              <SimRow label={`Tax on fees (${FINAL_TERMS.taxPct}% VAT)`} value={zmw(FINAL_FEES.tax)} />
            </Box>
            <Group justify="space-between" p={8} mt={8} bg="brand.0" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-brand-2)" }}>
               <Text fz={13} fw={700} c="brand.9">Net disbursed amount</Text>
               <Text fz={14} fw={800} c="brand.9">{zmw(netDisbursed)}</Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Action Footer */}
      <Group justify="space-between" align="center" p="sm" bg="slate.0" style={{ borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Box>
           <Text fz={14} fw={700} c="slate.9">Customer response & signing authorization</Text>
           <Text fz={12} c="slate.5" mt={2}>Select the borrower's response to generate and execute the contract.</Text>
        </Box>
        <Group gap="sm">
          <Button variant="outline" color="red.7" size="sm" onClick={onReject}>Reject offer</Button>
          <Button variant="default" size="sm" onClick={onAmend}>Request amendment</Button>
          <Button color="green.8" size="sm" onClick={onAccept}>Accept offer</Button>
        </Group>
      </Group>
    </Box>
  );
}

const amendLabelStyles = {
  label: { fontSize: 12, fontWeight: 600, color: "var(--mantine-color-slate-7)", marginBottom: 4 },
};

function OfferWorkspace({ onClose }: { onClose: () => void }) {
  const [offerStatus, setOfferStatus] = useState("pending"); // pending | accepted | rejected | amendment
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [amendField, setAmendField] = useState(AMEND_FIELDS[0]);
  const [amendDetail, setAmendDetail] = useState("");
  const [amendRoute, setAmendRoute] = useState(ROUTE_STAGES[0]);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showAmendForm, setShowAmendForm] = useState(false);

  const [contractStatus] = useState("not_generated"); // not_generated | generated
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
    window.print();
  }

  return (
   <Box p={14}>
      {offerStatus !== "accepted" && offerStatus !== "pending" && showAmendForm && (
        <Group justify="space-between" align="center" mb={8}>
          <Box>
            <Text fz={15} fw={700} c="slate.9">Offer &amp; signing</Text>
            <Text fz={12} c="slate.5" mt={2}>Issue the offer, capture the customer's response, then generate and execute the contract.</Text>
          </Box>
          <Group gap={8}>
            <Button size="compact-sm" variant="light" color="brand" radius="md" onClick={downloadOffer} leftSection={<IconDownload size={13} />}>
              Download offer
            </Button>
            <StatusBadge status={overallStatus} />
          </Group>
        </Group>
      )}

      {offerStatus === "pending" && !showRejectForm && !showAmendForm && (
        <OfferPendingView
          onAccept={() => setOfferStatus("accepted")}
          onReject={() => setShowRejectForm(true)}
          onAmend={() => setShowAmendForm(true)}
          scheduleOpen={scheduleOpen}
          setScheduleOpen={setScheduleOpen}
        />
      )}

      {offerStatus === "pending" && showRejectForm && (
        <Paper withBorder className="ps-surface" radius="md" bg="white" mb="md">
          <Box p="sm">
            <Group gap={4} mb="sm">
              <BackIconButton onClick={() => setShowRejectForm(false)} label="Back to offer" />
              <Text p="sm" fz={15} fw={700} c="slate.5" tt="uppercase" style={{ letterSpacing: 0.5 }}>Reject Offer</Text>
            </Group>
           </Box>
          
          <Box p="sm">
            <Select
              label={<Text fz={13} fw={700} c="slate.8" mb={2}>Rejection Category <Text span c="red">*</Text></Text>}
              placeholder="Select primary reason category..."
              data={["Rates too high", "Competitor offer", "Changed mind", "Other"]}
              radius="md"
              size="md"
              mb="sm"
            />
            
            <Textarea
              label={
                <Group justify="space-between" w="100%" mb={4}>
                  <Text fz={13} fw={700} c="slate.8">Reason <Text span fw={400} c="slate.5">(required)</Text></Text>
                  <Text fz={11} fw={600} c="slate.4">{rejectReason.length}/500</Text>
                </Group>
              }
              value={rejectReason}
              onChange={(e) => setRejectReason(e.currentTarget.value)}
              placeholder="Why is the customer rejecting this offer? Provide specific feedback or context..."
              radius="md"
              size="md"
              minRows={5}
              mb="xl"
            />
            
            <Checkbox
              defaultChecked
              color="red.7"
              size="md"
              label={<Text fz={14} fw={600} c="slate.8">Send rejection acknowledgement notice</Text>}
              description={<Text fz={12} c="slate.5" mt={4}>Automatically transmits an updated status SMS and confirmation email to {APPLICATION.customer.name}.</Text>}
              mb="xl"
            />
            
            <Paper bg="orange.0" p="md" radius="md" style={{ border: "1px solid var(--mantine-color-orange-2)" }}>
              <Group wrap="nowrap" align="flex-start" gap="sm">
                <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" style={{ marginTop: 2 }} />
                <Text fz={12.5} c="orange.9" lh={1.5}>
                  This action is final and will cancel loan offer <strong>#{APPLICATION.id}</strong>. A new application will be required if the borrower reconsiders.
                </Text>
              </Group>
            </Paper>
            
            <Group justify="flex-end" mt={32}>
              <Button variant="default" radius="md" onClick={() => setShowRejectForm(false)}>Cancel</Button>
              <Button color="red.7" radius="md" disabled={!rejectReason.trim()} onClick={() => setOfferStatus("rejected")}>Confirm Rejection</Button>
            </Group>
          </Box>
        </Paper>
      )}

      {offerStatus === "pending" && showAmendForm && (
        <Paper withBorder className="ps-surface" radius="md" bg="white" mb="sm" style={{ overflow: "hidden" }}>
          <Group gap={10} px="md" py={10} wrap="nowrap" style={{ background: "linear-gradient(90deg, var(--mantine-color-indigo-0), white)", borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
            <BackIconButton onClick={() => setShowAmendForm(false)} label="Back to offer" />
            <ThemeIcon radius="md" size={30} variant="light" color="indigo">
              <IconPencil size={15} />
            </ThemeIcon>
            <Box>
              <Text fz={14} fw={700} c="slate.9">Request amendment</Text>
              <Text fz={11.5} c="slate.5">Capture the change and route the application back for review.</Text>
            </Box>
          </Group>

          <Box p="md">
            <SimpleGrid cols={3} spacing="sm" mb="sm">
              <Select
                label="What is changing"
                value={amendField}
                onChange={(v) => setAmendField(v || AMEND_FIELDS[0])}
                data={AMEND_FIELDS}
                radius="md"
                allowDeselect={false}
                styles={amendLabelStyles}
              />
              <TextInput
                label={amendField === "Requested amount" ? "Requested Amount" : amendField === "Other terms" ? "Other Terms" : `Requested ${amendField}`}
                placeholder={`Enter new ${amendField.toLowerCase()}`}
                radius="md"
                styles={amendLabelStyles}
              />
              <Select
                label="Route back to"
                value={amendRoute}
                onChange={(v) => setAmendRoute(v || ROUTE_STAGES[0])}
                data={ROUTE_STAGES}
                radius="md"
                allowDeselect={false}
                styles={amendLabelStyles}
              />
            </SimpleGrid>

            <Textarea
              label="Describe the requested change"
              value={amendDetail}
              onChange={(e) => setAmendDetail(e.currentTarget.value)}
              placeholder="e.g. Customer wants tenure extended to 36 months to lower the installment."
              radius="md"
              autosize
              minRows={3}
              maxRows={6}
              styles={amendLabelStyles}
            />
          </Box>

          <Group justify="flex-end" gap={8} px="md" py={10} bg="slate.0" style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
            <Button variant="default" radius="md" size="sm" onClick={() => setShowAmendForm(false)}>Cancel</Button>
            <Button color="indigo" radius="md" size="sm" disabled={!amendDetail.trim()} onClick={() => setOfferStatus("amendment")} rightSection={<IconSend size={14} />}>
              Submit revisions
            </Button>
          </Group>
        </Paper>
      )}

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
        <Box>
          {/* TOP HEADER CARD */}
            <Group justify="space-between" align="center" mb="sm">
              <Group gap="md">
                <BackIconButton onClick={() => setOfferStatus("pending")} label="Back to offer" />
                <Box>
                  <Text fz={16} fw={600} c="slate.9">Contract & Signing Review</Text>
                </Box>
              </Group>
              <Group gap="sm">
                <Button variant="default" size="sm" radius="md" onClick={downloadOffer} leftSection={<IconDownload size={14} color="var(--mantine-color-slate-6)" />}>
                  <Text fz={12.5} fw={600} c="slate.7">Download Offer Letter</Text>
                </Button>
              </Group>
            </Group>


            <Group align="flex-start" wrap="nowrap" gap={24}>
              <Box style={{ flex: 1, minWidth: 0 }}>
              {/* FORMAL DOCUMENT CARD */}
              <Paper withBorder className="ps-surface" radius="md" mb="xl" bg="white">
                {/* Document Header */}
                <Group justify="space-between" p="md" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
                  <Group gap={8}>
                    <ThemeIcon radius="md" size={24} variant="light" color="indigo">
                      <IconFileText size={14} />
                    </ThemeIcon>
                    <Text fz={12} fw={700} c="indigo.9" tt="uppercase" style={{ letterSpacing: 0.3 }}>Formal Document</Text>
                    <Text fz={12} c="slate.5" ml={4}>Version 1.0 (Ready for Signing)</Text>
                  </Group>
                  <Badge color="green" variant="light" size="sm" radius="sm" leftSection={<IconCheck size={10} />} style={{ textTransform: 'none' }}>
                    Contract Generated
                  </Badge>
                </Group>

                {/* Document Inner Preview */}
                <Box p="md">
                    <Group justify="space-between" mb="md">
                      <Group gap="sm">
                        <Text fz={14} fw={800} c="slate.9">LOAN AGREEMENT</Text>
                        <Badge variant="light" color="gray" radius="sm" size="sm" fw={600}>AGR-2023-58231</Badge>
                      </Group>
                      <IconCircleCheck size={20} color="var(--mantine-color-green-4)" style={{ fill: "transparent" }} />
                    </Group>
                    
                    <Paper bg="slate.0" p="sm" radius="sm" mb="lg">
                      <Text fz={12.5} c="slate.7" lh={1.6}>
                        Between the Lender and <strong>{APPLICATION.customer.name}</strong> for a {APPLICATION.loan.product.toLowerCase()} of <strong>{zmw(FINAL_TERMS.amount)}</strong> at an agreed interest rate of <strong>{FINAL_TERMS.rate}.00% p.a.</strong> amortized over <strong>{FINAL_TERMS.tenure} months</strong>, repayable in equal monthly installments.
                      </Text>
                    </Paper>

                    <SimpleGrid cols={4} mb="lg">
                      <Box>
                        <Text fz={11} c="slate.4" mb={2}>Monthly Installment</Text>
                        <Text fz={12.5} fw={600} c="slate.9">{zmw(FINAL_SIM.installment)}</Text>
                      </Box>
                      <Box>
                        <Text fz={11} c="slate.4" mb={2}>Tenure</Text>
                        <Text fz={12.5} fw={600} c="slate.9">{FINAL_TERMS.tenure} Calendar Months</Text>
                      </Box>
                      <Box>
                        <Text fz={11} c="slate.4" mb={2}>Disbursement Channel</Text>
                        <Text fz={12.5} fw={600} c="slate.9">Direct Bank Wire</Text>
                      </Box>
                      <Box>
                        <Text fz={11} c="slate.4" mb={2}>Effective Date</Text>
                        <Text fz={12.5} fw={600} c="slate.9">Upon Full Execution</Text>
                      </Box>
                    </SimpleGrid>

                    <Text ta="center" fz={11.5} fs="italic" c="slate.4">
                      [ Contract Preview snippet — full 6-page legal binding document continues below with repayment schedules and standard covenants ]
                    </Text>
                </Box>
              </Paper>

              {/* CHOOSE SIGNING METHOD */}
              {!executed && !signingMethod && (
                <Box mb="xl">
                  <Group justify="space-between" align="flex-end" mb="md">
                    <Text fz={12} fw={700} c="slate.7" tt="uppercase" style={{ letterSpacing: 0.5 }}>Choose Signing Method</Text>
                    <Text fz={11.5} c="slate.5">Select customer preference for execution</Text>
                  </Group>
                  
                  <SimpleGrid cols={2} spacing="md">
                    {/* E-signature Card */}
                    <UnstyledButton
                      onClick={() => setSigningMethod("esign")}
                      p={12}
                      bg="white"
                      style={{ 
                        border: "1.5px solid var(--mantine-color-indigo-5)", 
                        borderRadius: "var(--mantine-radius-md)", 
                        boxShadow: "0 0 0 1px rgba(79, 70, 229, 0.05)"
                      }}
                    >
                      <Group wrap="nowrap" align="center">
                        <ThemeIcon radius="xl" size={18} color="indigo" variant="outline" style={{ borderWidth: 5 }}>
                          <Box w={8} h={8} bg="indigo" style={{ borderRadius: '50%' }} />
                        </ThemeIcon>
                        <ThemeIcon radius="md" size={34} variant="filled" color="indigo">
                          <IconSend size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Group gap={8} align="center" mb={2}>
                            <Text fz={13.5} fw={700} c="slate.9">E-signature</Text>
                            <Badge size="xs" radius="sm" variant="light" color="indigo" style={{ textTransform: 'none', fontWeight: 600 }}>Fastest</Badge>
                          </Group>
                          <Text fz={11} c="slate.5" lh={1.3}>Send for digital signature via SMS/Email OTP</Text>
                        </Box>
                      </Group>
                    </UnstyledButton>

                    {/* Physical Signature Card */}
                    <UnstyledButton
                      onClick={() => setSigningMethod("physical")}
                      p={12}
                      bg="white"
                      style={{ 
                        border: "1.5px solid var(--mantine-color-slate-2)", 
                        borderRadius: "var(--mantine-radius-md)",
                      }}
                    >
                      <Group wrap="nowrap" align="center">
                        <Box w={18} h={18} style={{ borderRadius: '50%', border: '1.5px solid var(--mantine-color-slate-3)' }} />
                        <ThemeIcon radius="md" size={34} variant="filled" color="orange.5">
                          <IconSignature size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Group gap={8} align="center" mb={2}>
                            <Text fz={13.5} fw={700} c="slate.9">Physical signature</Text>
                            <Badge size="xs" radius="sm" variant="light" color="orange.5" style={{ textTransform: 'none', fontWeight: 600 }}>Manual</Badge>
                          </Group>
                          <Text fz={11} c="slate.5" lh={1.3}>Print, wet-sign, and upload signed copy</Text>
                        </Box>
                      </Group>
                    </UnstyledButton>
                  </SimpleGrid>
                </Box>
              )}

             {!executed && signingMethod === "esign" && (
                <Box>
                  <SectionLabel
                    left={<BackIconButton onClick={() => setSigningMethod(null)} label="Change signing method" />}
                    right={<Text fz={11} fw={700} c={allSigned ? "green.7" : "slate.5"}>{signatories.filter((s) => s.status === "Signed").length} / {signatories.length} signed</Text>}
                  >
                    Signatories
                  </SectionLabel>
                  <Box mb={20} style={{ height: 8, background: "var(--mantine-color-slate-1)", borderRadius: 8, overflow: "hidden" }}>
                    <Box style={{ height: "100%", width: `${(signatories.filter((s) => s.status === "Signed").length / signatories.length) * 100}%`, background: "var(--mantine-color-green-5)", borderRadius: 8, transition: "width 300ms ease" }} />
                  </Box>
                  
                  <SimpleGrid cols={2} spacing="md" mb={16}>
                    {signatories.map((s, i) => {
                      const initials = s.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                      const signed = s.status === "Signed";
                      return (
                        <UnstyledButton key={s.name} onClick={() => toggleSignatory(i)} style={{ display: 'block', width: '100%' }}>
                          <Paper 
                            withBorder 
                            radius="md" 
                            p={10} 
                            bg={signed ? "green.0" : "white"} 
                            style={{ 
                              borderColor: signed ? "var(--mantine-color-green-4)" : "var(--mantine-color-slate-2)",
                              transition: "all 200ms ease"
                            }}
                          >
                            <Group justify="space-between" align="center">
                              <Group gap={10}>
                                <ThemeIcon radius="xl" size={32} variant={signed ? "filled" : "light"} color={signed ? "green.5" : "gray.3"}>
                                  {signed ? <IconCheck size={16} stroke={3} color="white" /> : <Text fz={11} fw={700} c="slate.7">{initials}</Text>}
                                </ThemeIcon>
                                <Box>
                                  <Text fz={12.5} fw={700} c={signed ? "green.9" : "slate.9"}>{s.name}</Text>
                                  <Text fz={11} c={signed ? "green.7" : "slate.5"}>{s.role}</Text>
                                </Box>
                              </Group>
                              <Badge size="sm" radius="sm" variant={signed ? "filled" : "light"} color={signed ? "green.5" : "gray.5"} style={{ textTransform: 'none', fontWeight: 600 }}>
                                {s.status}
                              </Badge>
                            </Group>
                          </Paper>
                        </UnstyledButton>
                      );
                    })}
                  </SimpleGrid>

                  <Text fz={11} c="slate.4" mb={20} ta="left">Click a status pill to simulate a signature being received.</Text>
                </Box>
              )}

             {!executed && signingMethod === "physical" && (
                <Box>
                  <SectionLabel left={<BackIconButton onClick={() => setSigningMethod(null)} label="Change signing method" />}>
                    Physical signature tracking
                  </SectionLabel>
                  <SimpleGrid cols={2} spacing={14} mb={14}>
                    <Select label="Dispatch / hand-over status" value={physical.dispatch} onChange={(v) => setPhysical({ ...physical, dispatch: v || physical.dispatch })} data={["Not dispatched", "Dispatched", "Handed over"]} radius="md" />
                  </SimpleGrid>
                  
                  {physical.dispatch === "Handed over" && (
                    <Box mt="md">
                      <Checkbox color="indigo" label="Signed document received" checked={physical.received} onChange={(e) => setPhysical({ ...physical, received: e.currentTarget.checked })} mb={12} />
                      {!physical.uploaded ? (
                        <Button size="sm" variant="light" color="indigo" radius="md" mb={12} onClick={() => setPhysical({ ...physical, uploaded: true, verification: "Pending" })} leftSection={<IconCloudUpload size={14} />}>
                          Upload signed document
                        </Button>
                      ) : (
                        <Group justify="space-between" align="center" p="sm" mb={12} bg="white" style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)" }}>
                          <Group gap={8}>
                            <IconFileText size={14} color="var(--mantine-color-slate-4)" />
                            <Text fz={12.5}>Signed contract — {APPLICATION.id}.pdf</Text>
                          </Group>
                          <Button size="compact-sm" variant="light" color="indigo" radius="md" onClick={() => setPhysical({ ...physical, verification: "Verified" })}>
                            Mark verified
                          </Button>
                        </Group>
                      )}
                    </Box>
                  )}
                </Box>
              )}
             {!executed && signingMethod && (
                <Box>
                  <Tooltip 
                    label="All required signatures must be completed first." 
                    disabled={allSigned}
                    position="bottom-start"
                    withArrow
                  >
                    <Box display="inline-block">
                      <Button 
                        color={allSigned ? "green" : "gray"}
                        variant={allSigned ? "filled" : "light"}
                        radius="md" 
                        disabled={!allSigned} 
                        onClick={() => setExecuted(true)} 
                        rightSection={<IconArrowRight size={15} />}
                        style={!allSigned ? { pointerEvents: 'none' } : {}}
                      >
                        Mark contract executed
                      </Button>
                    </Box>
                  </Tooltip>
                </Box>
              )}
{executed && (
                <Paper bg="green.0" p="xl" radius="md" style={{ border: "1.5px solid var(--mantine-color-green-3)", boxShadow: "0 4px 12px rgba(43, 138, 62, 0.05)" }}>
                  <Group wrap="nowrap" align="flex-start" gap="lg">
                    <ThemeIcon size={50} radius="100%" color="green.6" variant="light" style={{ flexShrink: 0 }}>
                      <IconCircleCheck size={32} stroke={2} />
                    </ThemeIcon>
                    <Box>
                      <Text fz={18} fw={700} c="green.9" mb={4}>Contract successfully executed</Text>
                      <Text fz={13.5} c="green.8" mt={4}>
                        All required signatures completed via {signingMethod === "esign" ? "e-signature" : "physical signature"}. The loan is ready for disbursement.
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              )}
            </Box>
            
            {/* SIDEBAR */}
            <Box w={320} style={{ flexShrink: 0, position: 'sticky', top: 0 }}>
              <Text fz={15} fw={700} c="slate.9" mb={4}>Final Execution Summary</Text>
              <Text fz={11} c="slate.5" mb="md" lh={1.4}>Last check before the agreement becomes legally binding.</Text>
              
              <Accordion variant="separated" radius="md" defaultValue={[]} multiple
                styles={{ 
                  item: { border: "1px solid var(--mantine-color-slate-2)", background: "white", marginBottom: 8 },
                  control: { padding: '8px 12px' },
                  content: { padding: '0 12px 8px 12px' }
                }}>
                
                <Accordion.Item value="financials">
                  <Accordion.Control icon={<ThemeIcon variant="light" color="indigo" radius="sm" size={24}><IconBuildingBank size={13} /></ThemeIcon>}>
                    <Text fz={12.5} fw={600} c="slate.9">Approved Financials</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <SimRow label="Approved Amount" value={zmw(FINAL_TERMS.amount)} />
                    <SimRow label="Interest Rate" value={`${FINAL_TERMS.rate}.00% p.a.`} />
                    <SimRow label="Tenure" value={`${FINAL_TERMS.tenure} Months`} />
                    <SimRow label="EMI" value={zmw(FINAL_SIM.installment)} last strong />
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="security">
                  <Accordion.Control icon={<ThemeIcon variant="light" color="indigo" radius="sm" size={24}><IconShieldCheck size={13} /></ThemeIcon>}>
                    <Text fz={12.5} fw={600} c="slate.9">Security & Legal</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <SimRow label="Asset" value="Motor Vehicle (Hilux)" />
                    <SimRow label="Security Value" value="ZMW 76,000" />
                    <SimRow label="LTV / Coverage" value="189%" />
                    <SimRow label="Legal Status" value="Cleared" last strong />
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="aconditions">
                  <Accordion.Control icon={<ThemeIcon variant="light" color="indigo" radius="sm" size={24}><IconCheck size={13} /></ThemeIcon>}>
                    <Text fz={12.5} fw={600} c="slate.9">Approval Conditions</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <SimRow label="Decision" value="Approved" />
                    <SimRow label="Processing Fee" value="2% (Billed by LMS)" />
                    <SimRow label="Pending CPs" value="None" last strong />
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
              
              <Button mt={8} fullWidth color="brand" radius="md" disabled={!executed} onClick={onClose} rightSection={<IconArrowRight size={14} />}>
                Complete workflow
              </Button>
            </Box>
          </Group>
        </Box>
      )}
      <div className="print-only-offer">
        <Paper
          radius={0}
          p={24}
          style={{
            border: '2px solid #000',
            backgroundColor: '#fff',
            maxWidth: '850px',
            margin: '0 auto',
            width: '100%',
            fontFamily: '"Times New Roman", Times, serif',
          }}
        >
          <Box mb={20} className="text-center" style={{ position: 'relative' }}>
            <Text fz={22} fw={900} c="black" tt="uppercase" style={{ letterSpacing: '1px', textDecoration: 'underline' }}>
              OFFICIAL LOAN OFFER CONTRACT
            </Text>
            <Text fz={10} c="black" mt={4}>
              Reference Number: <strong>{APPLICATION.id}</strong> &nbsp;|&nbsp; Issued: <strong>{fmtDate(ISSUED_DATE)}</strong> &nbsp;|&nbsp; Valid Until: <strong>{fmtDate(VALID_UNTIL)}</strong>
            </Text>
          </Box>

          <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px', marginTop: '16px' }} className="page-break-inside-avoid">
            <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
              1. Customer & Loan Purpose
            </Text>
          </Box>
          <Grid style={{ marginLeft: 0, marginRight: 0 }}>
            <Grid.Col span={{ base: 12, sm: 8 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Customer Name</Text>
              <Text fz={11} fw={600} c="black">{APPLICATION.customer.name}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Customer ID</Text>
              <Text fz={11} fw={600} c="black">{APPLICATION.customer.id}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Loan Type</Text>
              <Text fz={11} fw={600} c="black">{APPLICATION.loan.product}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 8 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Purpose</Text>
              <Text fz={11} fw={600} c="black">{APPLICATION.loan.purpose}</Text>
            </Grid.Col>
          </Grid>

          <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px', marginTop: '16px' }} className="page-break-inside-avoid">
            <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
              2. Approved Financial Terms
            </Text>
          </Box>
          <Grid style={{ marginLeft: 0, marginRight: 0 }}>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Approved Amount</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_TERMS.amount)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Interest Rate</Text>
              <Text fz={11} fw={600} c="black">{FINAL_TERMS.rate}% p.a. (Fixed)</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Tenure</Text>
              <Text fz={11} fw={600} c="black">{FINAL_TERMS.tenure} Months</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Repayment Frequency</Text>
              <Text fz={11} fw={600} c="black">{FINAL_TERMS.frequency}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">First Payment Due Date</Text>
              <Text fz={11} fw={600} c="black">{fmtDate(FINAL_SIM.first)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Final Payment Due Date</Text>
              <Text fz={11} fw={600} c="black">{fmtDate(FINAL_SIM.final)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Estimated Installment</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_SIM.installment)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Total Interest</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_SIM.totalInterest)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Total Repayment</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_SIM.totalRepayment)}</Text>
            </Grid.Col>
          </Grid>

          <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px', marginTop: '16px' }} className="page-break-inside-avoid">
            <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
              3. Applicable Fees & Charges
            </Text>
          </Box>
          <Grid style={{ marginLeft: 0, marginRight: 0 }}>
            <Grid.Col span={{ base: 12, sm: 3 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Processing Fee</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_FEES.processingFee)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Credit Life Insurance</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_FEES.insurance)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Tax on Fees</Text>
              <Text fz={11} fw={600} c="black">{zmw(FINAL_FEES.tax)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px', backgroundColor: '#f8f9fa' }}>
              <Text fz={9} fw={800} tt="uppercase" c="black">Total Fees</Text>
              <Text fz={12} fw={700} c="black">{zmw(FINAL_FEES.total)}</Text>
            </Grid.Col>
          </Grid>

          <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px', marginTop: '16px' }} className="page-break-inside-avoid">
            <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
              4. Collateral & Security
            </Text>
          </Box>
          <Grid style={{ marginLeft: 0, marginRight: 0 }}>
            {ASSETS_SUMMARY.map((asset, idx) => (
              <Grid.Col key={idx} span={12} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
                <Text fz={9} fw={700} tt="uppercase" c="gray.7">{asset.type}</Text>
                <Text fz={11} fw={600} c="black">{asset.description}</Text>
              </Grid.Col>
            ))}
          </Grid>

          <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px', marginTop: '16px' }} className="page-break-inside-avoid">
            <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
              5. Key Conditions Precedent
            </Text>
          </Box>
          <Grid style={{ marginLeft: 0, marginRight: 0 }}>
            {UNDERWRITING_DECISION.conditions.map((cond, idx) => (
              <Grid.Col key={idx} span={12} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
                <Text fz={11} fw={600} c="black">• {cond.condition} (Due: {cond.dueBefore})</Text>
              </Grid.Col>
            ))}
          </Grid>

          <Box mt={24} className="page-break-inside-avoid">
            <Box bg="gray.2" p="4px 8px" style={{ border: '1px solid #000', margin: '-0.5px' }}>
              <Text fz={11} fw={800} tt="uppercase" c="black" style={{ letterSpacing: '0.5px' }}>
                Declaration & Signatures
              </Text>
            </Box>
            <Box style={{ border: '1px solid #000', margin: '-0.5px', padding: '12px' }}>
              <Text fz={9} c="black" style={{ textAlign: 'justify', lineHeight: 1.4 }}>
                I/We confirm that I/we have read, fully understood, and agree to the terms and conditions set out in this Loan Offer. I/We accept this offer and authorize the Lender to proceed with the execution of the final Loan Agreement based on these terms. I/We understand that this offer is subject to the fulfillment of all conditions precedent and does not constitute a final disbursement guarantee until the Loan Agreement is fully executed.
              </Text>

              <Grid mt={30}>
                <Grid.Col span={6}>
                  <Box style={{ borderBottom: '1px solid #000', height: 20, width: '90%' }} mb="4px"></Box>
                  <Text fz={9} fw={700} c="black">Applicant(s) Authorized Signature</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Box style={{ borderBottom: '1px solid #000', height: 20, width: '90%' }} mb="4px"></Box>
                  <Text fz={9} fw={700} c="black">Date (DD/MM/YYYY)</Text>
                </Grid.Col>
              </Grid>
            </Box>
          </Box>
        </Paper>

        <style>{`
          .print-only-offer { display: none; }
          @media print {
            body * { visibility: hidden; }
            .print-only-offer, .print-only-offer * { visibility: visible; }
            .print-only-offer {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .page-break-inside-avoid {
              page-break-inside: avoid;
            }
          }
        `}</style>
      </div>

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
      closeOnClickOutside={false}
        closeOnEscape={false}
      lockScroll
      styles={{
        content: { display: "flex", flexDirection: "column", overflow: "hidden", height: "90vh", maxHeight: "90vh" },
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
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>Loan Application</Text>
              <Text size="xs" fw={500} c="brand.1">Stage 5 — Offer & Signing</Text>
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

            {section === "appraisal" && (
              <Box style={{ height: "100%" }}>
                <EnrichmentModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "underwriting" && (
              <Box style={{ height: "100%" }}>
                <UnderwritingModal embedded readOnly applicationValues={applicationValues} opened={false} onClose={() => {}} onMinimize={() => {}} />
              </Box>
            )}

            {section === "offer" && <OfferWorkspace onClose={onClose} />}
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
