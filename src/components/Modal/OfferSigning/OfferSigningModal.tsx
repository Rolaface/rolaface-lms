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
  Grid,
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
  IconShieldCheck,
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

// ---------------------------------------------------------------------------
// Offer summary — top banner (matches reference design)
// ---------------------------------------------------------------------------

function OfferSummaryBanner({ onViewSchedule }: { onViewSchedule?: () => void }) {
  return (
    <Box
      p="xl"
      style={{
        backgroundColor: "var(--mantine-color-brand-7)",
        borderTopLeftRadius: "var(--mantine-radius-md)",
        borderTopRightRadius: "var(--mantine-radius-md)",
      }}
      mb={0}
    >
      <Group justify="space-between" align="center" wrap="wrap">
        <Box>
          <Text fz={12} c="brand.1" mb={4}>
            Approved amount · {APPLICATION.loan.purpose}
          </Text>
          <Text fz={32} fw={400} c="white" lh={1} style={{ fontFamily: "serif" }}>
            {zmw(FINAL_TERMS.amount)}
          </Text>
          <Text fz={11} c="brand.1" mt={8}>
            Valid until <Text span fw={700} c="white">{fmtDate(VALID_UNTIL)}</Text>
          </Text>
        </Box>

        <Group gap={40} wrap="nowrap">
          <Box>
            <Text fz={11} c="brand.1" mb={2}>Monthly installment</Text>
            <Text fz={16} fw={600} c="white">{zmw(FINAL_SIM.installment)}</Text>
          </Box>
          <Box>
            <Text fz={11} c="brand.1" mb={2}>Interest rate</Text>
            <Text fz={16} fw={600} c="green.3">{FINAL_TERMS.rate}% p.a.</Text>
          </Box>
          <Box>
            <Text fz={11} c="brand.1" mb={2}>Tenure</Text>
            <Text fz={16} fw={600} c="white">{FINAL_TERMS.tenure} months</Text>
          </Box>
          <Box>
            <Text fz={11} c="brand.1" mb={2}>Total repayment</Text>
            <Text fz={16} fw={600} c="white">{zmw(FINAL_SIM.totalRepayment)}</Text>
          </Box>
        </Group>
      </Group>
    </Box>
  );
}

function OfferCard({
  dotColor,
  title,
  right,
  children,
  footer,
}: {
  dotColor: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Paper withBorder radius="md" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Group justify="space-between" align="center" px="md" py={12} style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
        <Group gap={8} align="center">
          <Box w={7} h={7} style={{ borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
          <Text fz={11} fw={700} c="slate.7" tt="uppercase" style={{ letterSpacing: 0.3 }}>
            {title}
          </Text>
        </Group>
        {right}
      </Group>
      <Box px="md" pt={8} style={{ flex: 1 }}>
        {children}
      </Box>
      {footer && (
        <Box px="md" py={10} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
          {footer}
        </Box>
      )}
    </Paper>
  );
}

// Inject CSS for the precise layout
const offerCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap');
  .os-intro { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
  .os-intro h1 { font-family: 'Source Serif 4', serif; font-size: 16px; font-weight: 600; margin: 0; color: #1B1730; }
  .os-intro p { margin: 1px 0 0; color: #605B78; font-size: 12px; }
  .os-status-pill { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 100px; background: #EFECFC; color: #2A1F94; white-space: nowrap; flex: none; }

  .os-headline { background: linear-gradient(155deg, #2A1F94, #3F2FC7); border-radius: 12px; padding: 13px 18px; color: #fff; display: flex; align-items: center; gap: 18px; flex: none; margin-bottom: 24px; }
  .os-headline .main-fig { flex: none; }
  .os-headline .label { font-size: 10.5px; color: #C9C2F2; margin-bottom: 2px; }
  .os-headline .amount { font-family: 'Source Serif 4', serif; font-size: 24px; font-weight: 600; line-height: 1; }
  .os-headline .valid { font-size: 10px; color: #C9C2F2; margin-top: 4px; }
  .os-headline .valid b { color: #fff; font-weight: 600; }
  .os-headline .divider { width: 1px; align-self: stretch; background: rgba(255,255,255,.18); flex: none; }
  .os-headline .stats { display: flex; gap: 20px; flex: 1; }
  .os-headline .stat .k { font-size: 10px; color: #C9C2F2; margin-bottom: 2px; }
  .os-headline .stat .v { font-size: 14px; font-weight: 700; }
  .os-headline .stat .v.accent { color: #8DE8B4; }

  .os-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; flex: 1; min-height: 0; margin-bottom: 24px; }
  .os-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
  .os-section-head h2 { font-size: 12px; font-weight: 700; margin: 0; color: #605B78; }
  .os-section-head a { font-size: 11px; color: #3F2FC7; text-decoration: none; font-weight: 600; cursor: pointer; }
  .os-section-head .note { font-size: 10.5px; color: #9E99B0; }
  .os-rows { border-top: 1px solid #E7E4EF; }
  .os-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 1px; border-bottom: 1px solid #E7E4EF; font-size: 12px; }
  .os-row .k { color: #605B78; }
  .os-row .v { font-weight: 600; text-align: right; color: #1B1730; }
  .os-row .v.muted { font-weight: 500; color: #605B78; }
  .os-row.total { background: #F7F6F9; margin: 5px -1px 0; padding: 7px 9px; border-radius: 8px; border-bottom: none; }
  .os-row.total .k, .os-row.total .v { font-weight: 700; color: #1B1730; font-size: 12px; }
  .os-tag { font-size: 9.5px; font-weight: 600; padding: 2px 8px; border-radius: 100px; background: #EAF6EF; color: #1E7F4F; }

  .os-collateral { flex: none; border: 1px solid #F0CE96; background: #FDF3E4; border-radius: 12px; display: flex; align-items: center; gap: 14px; padding: 9px 14px; margin-bottom: 24px; }
  .os-collateral .veh { flex: none; min-width: 190px; }
  .os-collateral .veh .name { font-weight: 700; font-size: 12px; color: #1B1730; }
  .os-collateral .veh .sub { font-size: 10.5px; color: #605B78; margin-top: 1px; }
  .os-collateral .sep { width: 1px; align-self: stretch; background: #F0CE96; flex: none; }
  .os-collateral .warn { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
  .os-collateral .warn .ic { font-size: 13px; flex: none; }
  .os-collateral .warn .txt strong { display: block; font-size: 11.5px; color: #7C3A0C; }
  .os-collateral .warn .txt p { margin: 0; font-size: 10.5px; color: #8A4A12; line-height: 1.3; }
  .os-collateral .cta button { background: #B45309; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }

  .os-decision { flex: none; border: 1px solid #E7E4EF; border-radius: 12px; padding: 9px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #F7F6F9; }
  .os-decision .txt strong { display: block; font-size: 12px; color: #1B1730; }
  .os-decision .txt p { margin: 1px 0 0; font-size: 10.5px; color: #605B78; }
  .os-decision .btns { display: flex; gap: 8px; flex: none; }
  .os-decision button { border-radius: 8px; font-size: 11.5px; font-weight: 600; padding: 7px 12px; cursor: pointer; border: 1px solid #E7E4EF; background: #fff; color: #1B1730; }
  .os-decision button.reject { color: #B3261E; border-color: #F3D3CF; }
  .os-decision button.accept { background: #1E7F4F; color: #fff; border: none; }
`;

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
  
  return (
    <Box>
      <style>{offerCss}</style>
      
      <div className="os-headline">
        <div className="main-fig">
          <div className="label">Approved amount · {APPLICATION.loan.purpose}</div>
          <div className="amount">{zmw(FINAL_TERMS.amount)}</div>
          <div className="valid">Valid until <b>{fmtDate(VALID_UNTIL)}</b></div>
        </div>
        <div className="divider"></div>
        <div className="stats">
          <div className="stat"><div className="k">Monthly installment</div><div className="v">{zmw(FINAL_SIM.installment)}</div></div>
          <div className="stat"><div className="k">Interest rate</div><div className="v accent">{FINAL_TERMS.rate}% p.a.</div></div>
          <div className="stat"><div className="k">Tenure</div><div className="v">{FINAL_TERMS.tenure} months</div></div>
          <div className="stat"><div className="k">Total repayment</div><div className="v">{zmw(FINAL_SIM.totalRepayment)}</div></div>
        </div>
      </div>

      <div className="os-two-col">
        <div>
          <div className="os-section-head">
            <h2>Repayment structure</h2>
            <a onClick={(e) => { e.preventDefault(); setScheduleOpen(!scheduleOpen); }}>{scheduleOpen ? "Hide schedule" : "View schedule"}</a>
          </div>
          <div className="os-rows">
            <div className="os-row"><span className="k">First payment due</span><span className="v">{fmtDate(FINAL_SIM.first)}</span></div>
            <div className="os-row"><span className="k">Final maturity date</span><span className="v">{fmtDate(FINAL_SIM.final)}</span></div>
            <div className="os-row"><span className="k">Frequency</span><span className="v muted">{FINAL_TERMS.frequency}</span></div>
            <div className="os-row"><span className="k">Total interest payable</span><span className="v">{zmw(FINAL_SIM.totalInterest)}</span></div>
            <div className="os-row"><span className="k">Disbursement method</span><span className="v muted">Direct bank transfer</span></div>
            <div className="os-row"><span className="k">Payroll deduction</span><span className="os-tag">Verified</span></div>
          </div>
        </div>

        <div>
          <div className="os-section-head">
            <h2>Fees & statutory charges</h2>
            <span className="note">Pre-deducted</span>
          </div>
          <div className="os-rows">
            <div className="os-row"><span className="k">Processing fee ({FINAL_TERMS.processingFeePct}%)</span><span className="v">{zmw(FINAL_FEES.processingFee)}</span></div>
            <div className="os-row"><span className="k">Credit life insurance ({FINAL_TERMS.insurancePct}%)</span><span className="v">{zmw(FINAL_FEES.insurance)}</span></div>
            <div className="os-row"><span className="k">Tax on fees ({FINAL_TERMS.taxPct}% VAT)</span><span className="v">{zmw(FINAL_FEES.tax)}</span></div>
            <div className="os-row total"><span className="k">Net disbursed amount</span><span className="v">{zmw(netDisbursed)}</span></div>
          </div>
        </div>
      </div>

      <div className="os-collateral">
        <div className="veh">
          <div className="name">{ASSETS_SUMMARY[0].description.split(',')[0]}</div>
          <div className="sub">ABC 1234 ZM · Value ZMW {ASSETS_SUMMARY[0].value.toLocaleString()} · LTV 42.3%</div>
        </div>
        <div className="sep"></div>
        <div className="warn">
          <div className="ic">⚠️</div>
          <div className="txt">
            <strong>Clearance letter needed</strong>
            <p>{UNDERWRITING_DECISION.conditions[0].condition}</p>
          </div>
        </div>
        <div className="cta"><button>Upload doc</button></div>
      </div>

      <div className="os-decision">
        <div className="txt">
          <strong>Customer response & signing authorization</strong>
          <p>Select the borrower's response to generate and execute the contract.</p>
        </div>
        <div className="btns">
          <button className="reject" onClick={onReject}>Reject offer</button>
          <button onClick={onAmend}>Request amendment</button>
          <button className="accept" onClick={onAccept}>Accept offer</button>
        </div>
      </div>
    </Box>
  );
}

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
    window.print();
  }

  return (
    <Box p={28}>
      <Group justify="space-between" align="center" mb={18}>
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
        <Paper bg="red.0" p="md" radius="md" style={{ border: "1px solid var(--mantine-color-red-2)" }}>
          <SectionLabel>Reject offer</SectionLabel>
          <Textarea label="Reason (required)" value={rejectReason} onChange={(e) => setRejectReason(e.currentTarget.value)} placeholder="Why is the customer rejecting this offer?" radius="md" />
          <Group gap={10} mt={12}>
            <Button color="red" radius="md" disabled={!rejectReason.trim()} onClick={() => setOfferStatus("rejected")}>Confirm rejection</Button>
            <Button variant="default" radius="md" onClick={() => setShowRejectForm(false)}>Cancel</Button>
          </Group>
        </Paper>
      )}

      {offerStatus === "pending" && showAmendForm && (
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
      {/* PRINTABLE LEGAL OFFER (Hidden on screen, visible on print) */}
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
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
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
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
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
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">First Payment Due</Text>
              <Text fz={11} fw={600} c="black">{fmtDate(FINAL_SIM.first)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} style={{ border: '1px solid #000', padding: '4px 8px', margin: '-0.5px' }}>
              <Text fz={9} fw={700} tt="uppercase" c="gray.7">Final Payment Due</Text>
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
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
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
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
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
          <Grid gutter={0} style={{ marginLeft: 0, marginRight: 0 }}>
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