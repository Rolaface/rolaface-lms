import React, { useState, useMemo } from "react";
import {
  IconFileText as FileText,
  IconGauge as Gauge,
  IconBuildingBank as Landmark,
  IconScale as Scale,
  IconSignature as FileSignature,
  IconCheck as Check,
  IconX as X,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconArrowRight as ArrowRight,
  IconInfoCircle as Info,
  IconAlertTriangle as AlertTriangle,
  IconAlertCircle as AlertCircle,
  IconCircleCheck as CheckCircle2,
  IconCircleX as XCircle,
  IconPencil as Pencil,
  IconCloudUpload as UploadCloud,
  IconDownload as Download,
  IconSend as Send,
  IconUsers as Users,
  IconClock as Clock,
  IconPercentage as Percent,
  IconWallet as Wallet,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Mock data — everything Stage 1–4 already produced (now frozen)
// ---------------------------------------------------------------------------

const APPLICATION = {
  id: "APP-58231",
  customer: { name: "Chanda Mwansa", type: "Existing customer", id: "CU-10234", phone: "0977 123 456", email: "chanda.mwansa@example.com" },
  loan: { product: "Personal loan", typeId: "personal", subtype: "Salary-backed", purpose: "Home improvement", amount: 76500, tenure: 24, rate: 25, frequency: "Monthly" },
};

const POLICY = { personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 } };
const PRESCREENING_DATA = { credit: 742, obligations: 3850, income: 13100 };

function calcEligibility({ income, obligations, maxDTI, annualRate, tenureMonths, productMax, creditScore, minCreditScore }) {
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount = r > 0 ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r) : capacity * tenureMonths;
  return { eligibleAmount: creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0, mandatoryPassed: creditPassed && dtiPassed };
}
const POL = POLICY[APPLICATION.loan.typeId];
const APPROVED_AMOUNT = Math.round(calcEligibility({
  income: PRESCREENING_DATA.income, obligations: PRESCREENING_DATA.obligations, maxDTI: POL.maxDTI,
  annualRate: APPLICATION.loan.rate, tenureMonths: APPLICATION.loan.tenure, productMax: POL.productMax,
  creditScore: PRESCREENING_DATA.credit, minCreditScore: POL.minCreditScore,
}).eligibleAmount);

const FINAL_TERMS = { amount: APPROVED_AMOUNT, rate: 25, tenure: 24, frequency: "Monthly", processingFeePct: 2, insurancePct: 1, taxPct: 16 };

function computeSimulation(amount, tenure, rate, frequency) {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const zmw = (n) => (n == null || n === "" ? "—" : "ZMW " + Math.round(n).toLocaleString());
const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STYLES = {
  Pending: { bg: "#f3f4f6", color: "#6b7280" }, "In Progress": { bg: "#eef2ff", color: "#4338ca" },
  Passed: { bg: "#f0fdf4", color: "#15803d" }, Failed: { bg: "#fef2f2", color: "#dc2626" }, Exception: { bg: "#fffbeb", color: "#d97706" },
  Accepted: { bg: "#f0fdf4", color: "#15803d" }, Rejected: { bg: "#fef2f2", color: "#dc2626" }, "Awaiting decision": { bg: "#eef2ff", color: "#4338ca" },
  "Amendment requested": { bg: "#fffbeb", color: "#d97706" }, Draft: { bg: "#f3f4f6", color: "#6b7280" }, Generated: { bg: "#eef2ff", color: "#4338ca" },
  "Signing in progress": { bg: "#fffbeb", color: "#d97706" }, Executed: { bg: "#f0fdf4", color: "#15803d" }, Signed: { bg: "#f0fdf4", color: "#15803d" }, Verified: { bg: "#f0fdf4", color: "#15803d" },
};
function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 20 }}>{status}</span>;
}
function FieldError({ children }) {
  return <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, fontSize: 12.5, color: "#dc2626" }}><AlertCircle size={13} style={{ marginTop: 1.5, flexShrink: 0 }} /><span>{children}</span></div>;
}
function SectionLabel({ children, right }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.3, textTransform: "uppercase" }}>{children}</div>{right}</div>;
}
function SimRow({ label, value, last, strong }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : "1px solid #f3f4f6", fontSize: 13 }}><span style={{ color: "#6b7280" }}>{label}</span><span style={{ fontWeight: strong ? 700 : 600, color: "#111827" }}>{value}</span></div>;
}
function MiniStat({ label, value }) {
  return <div><div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div><div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{value}</div></div>;
}
const th = { textAlign: "left", padding: "7px 10px", fontWeight: 600, color: "#6b7280", fontSize: 10.5 };
const td = { padding: "6px 10px", color: "#374151" };
function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
    </div>
  );
}
function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell — header, context bar, left nav
// ---------------------------------------------------------------------------

function ContextHeader() {
  const { customer, loan, id } = APPLICATION;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 26px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4f46e5", fontSize: 13, flexShrink: 0 }}>
          {customer.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
        </div>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{customer.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{loan.product} · {loan.subtype}</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 10.5, color: "#9ca3af" }}>Approved amount</div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{zmw(FINAL_TERMS.amount)}</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 10.5, color: "#9ca3af" }}>Application ID</div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{id}</div></div>
      </div>
    </div>
  );
}

function LeftNav({ section, setSection }) {
  const items = [
    { id: "application", label: "Loan application", icon: FileText },
    { id: "prescreening", label: "Prescreening", icon: Gauge },
    { id: "enrichment", label: "Enrichment", icon: Landmark },
    { id: "underwriting", label: "Underwriting", icon: Scale },
    { id: "offer", label: "Offer & signing", icon: FileSignature },
  ];
  return (
    <div style={{ width: 216, flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", padding: "18px 12px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", padding: "0 10px", marginBottom: 10 }}>Stage 5 of 5</div>
      {items.map((it) => {
        const active = section === it.id; const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setSection(it.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 4, borderRadius: 9, border: "none", background: active ? "#eef2ff" : "transparent", color: active ? "#4338ca" : "#374151", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
            <Icon size={16} />{it.label}
            {it.id !== "offer" && <Check size={13} style={{ marginLeft: "auto", color: active ? "#4338ca" : "#16a34a" }} />}
          </button>
        );
      })}
    </div>
  );
}

function LockedPanel({ title, children }) {
  return (
    <div>
      <div style={{ padding: "12px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 14px" }}>
          <Info size={14} style={{ color: "#4f46e5", marginTop: 1.5, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#3730a3" }}>{title} is complete and locked — read-only at this stage.</div>
        </div>
      </div>
      <div style={{ padding: "22px 26px", maxHeight: 500, overflowY: "auto" }}>{children}</div>
    </div>
  );
}

function LoanApplicationReview() {
  return (
    <LockedPanel title="The loan application">
      <SectionLabel>Customer &amp; loan</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
        <div><div style={{ fontSize: 11.5, color: "#9ca3af" }}>Customer</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{APPLICATION.customer.name} · {APPLICATION.customer.id}</div></div>
        <div><div style={{ fontSize: 11.5, color: "#9ca3af" }}>Product</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{APPLICATION.loan.product} · {APPLICATION.loan.subtype}</div></div>
        <div><div style={{ fontSize: 11.5, color: "#9ca3af" }}>Purpose</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{APPLICATION.loan.purpose}</div></div>
        <div><div style={{ fontSize: 11.5, color: "#9ca3af" }}>Requested amount</div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{zmw(APPLICATION.loan.amount)}</div></div>
      </div>
    </LockedPanel>
  );
}

function PrescreeningReview() {
  return (
    <LockedPanel title="Prescreening">
      <SectionLabel>Decision</SectionLabel>
      <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><AlertTriangle size={18} color="#d97706" /><div style={{ fontSize: 14, fontWeight: 700 }}>Amount adjusted at prescreening</div></div>
        <div style={{ display: "flex", gap: 24 }}><MiniStat label="Requested" value={zmw(APPLICATION.loan.amount)} /><MiniStat label="Approved" value={zmw(APPROVED_AMOUNT)} /></div>
      </div>
    </LockedPanel>
  );
}

function EnrichmentReview() {
  return (
    <LockedPanel title="Final commercial terms">
      <SectionLabel>Final loan terms</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
        <MiniStat label="Amount" value={zmw(FINAL_TERMS.amount)} /><MiniStat label="Rate" value={`${FINAL_TERMS.rate}% p.a.`} /><MiniStat label="Tenure" value={`${FINAL_TERMS.tenure} months`} />
      </div>
    </LockedPanel>
  );
}

function UnderwritingReview() {
  return (
    <LockedPanel title="Underwriting">
      <SectionLabel>Consolidated decision</SectionLabel>
      <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><AlertTriangle size={18} color="#d97706" /><div style={{ fontSize: 14, fontWeight: 700 }}>Approved with conditions</div></div>
        <div style={{ fontSize: 12.5, color: "#92400e" }}>Legal checks: {UNDERWRITING_DECISION.legalCheckCounts.passed} passed · {UNDERWRITING_DECISION.legalCheckCounts.exception} exception</div>
      </div>
      <SectionLabel>Conditions</SectionLabel>
      {UNDERWRITING_DECISION.conditions.map((c, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", marginBottom: 8, fontSize: 12.5 }}>
          <div style={{ fontWeight: 600, color: "#111827", marginBottom: 3 }}>{c.condition}</div>
          <div style={{ color: "#6b7280" }}>Responsible: {c.responsible} · Due before: {c.dueBefore}</div>
        </div>
      ))}
    </LockedPanel>
  );
}

// ---------------------------------------------------------------------------
// Stage 5 — Offer & Signing
// ---------------------------------------------------------------------------

function CollapsibleStep({ index, title, status, summary, onEdit, active, children }) {
  const isDone = status === "done";
  return (
    <div style={{ border: "1px solid " + (active ? "#c7d2fe" : "#e5e7eb"), borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: active ? "#eef2ff" : "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: isDone || active ? "#4f46e5" : "#e5e7eb", color: isDone || active ? "#fff" : "#9ca3af" }}>
            {isDone ? <Check size={14} /> : index}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</div>
            {summary && <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 1 }}>{summary}</div>}
          </div>
        </div>
        {isDone && onEdit && <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer" }}><Pencil size={12} /> Change</button>}
      </div>
      {active && <div style={{ padding: "4px 18px 20px" }}>{children}</div>}
    </div>
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
  const [signingMethod, setSigningMethod] = useState(null); // esign | physical
  const [signatories, setSignatories] = useState([
    { name: APPLICATION.customer.name, role: "Customer", status: "Pending" },
    { name: "Bwalya Mumba", role: "Bank officer", status: "Pending" },
  ]);
  const [physical, setPhysical] = useState({ dispatch: "Not dispatched", received: false, uploaded: false, verification: "Pending" });
  const [executed, setExecuted] = useState(false);

  const overallStatus = executed ? "Contract Executed"
    : offerStatus === "rejected" ? "Offer Rejected"
    : offerStatus === "amendment" ? "Amendment Requested"
    : offerStatus === "accepted" ? (contractStatus === "not_generated" ? "Offer Accepted" : signingMethod ? "Signing in Progress" : "Contract Generated")
    : "Awaiting decision";

  const allSigned = signingMethod === "esign" ? signatories.every((s) => s.status === "Signed")
    : signingMethod === "physical" ? physical.received && physical.uploaded && physical.verification === "Verified" : false;

  function toggleSignatory(i) {
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
      "",
      "Full repayment schedule:",
      "#\tDue date\tInstallment\tPrincipal\tInterest\tBalance",
      ...FINAL_SIM.schedule.map((r) => `${r.n}\t${fmtDate(r.due)}\t${zmw(r.installment)}\t${zmw(r.principal)}\t${zmw(r.interest)}\t${zmw(r.balance)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Loan-Offer-${APPLICATION.id}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: "22px 30px 30px", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Offer &amp; signing</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Issue the offer, capture the customer's response, then generate and execute the contract.</div>
        </div>
        <StatusPill status={overallStatus} />
      </div>

      {/* Step 1 — Offer */}
      <CollapsibleStep
        index={1} title="Loan offer" active={offerStatus === "pending" || (offerStatus !== "pending" && false)}
        status={offerStatus !== "pending" ? "done" : "active"}
        summary={offerStatus === "accepted" ? "Offer accepted by customer" : offerStatus === "rejected" ? "Offer rejected by customer" : offerStatus === "amendment" ? "Amendment requested" : ""}
        onEdit={() => { setOfferStatus("pending"); setContractStatus("not_generated"); setSigningMethod(null); setExecuted(false); }}
      >
        {offerStatus === "pending" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Issued {fmtDate(ISSUED_DATE)} · Valid until {fmtDate(VALID_UNTIL)}</div>
              <button onClick={downloadOffer} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer" }}>
                <Download size={13} /> Download offer
              </button>
            </div>

            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: "18px 20px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 11.5, color: "#4338ca", fontWeight: 600, marginBottom: 4 }}>Approved loan amount</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#312e81" }}>{zmw(FINAL_TERMS.amount)}</div>
              <div style={{ fontSize: 11.5, color: "#4338ca", marginTop: 2 }}>for {APPLICATION.loan.purpose.toLowerCase()}</div>
            </div>

            <SectionLabel>Customer &amp; loan</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 16px", marginBottom: 18 }}>
              <SimRow label="Customer" value={`${APPLICATION.customer.name} (${APPLICATION.customer.id})`} />
              <SimRow label="Loan type" value={`${APPLICATION.loan.product} — ${APPLICATION.loan.subtype}`} />
              <SimRow label="Loan purpose" value={APPLICATION.loan.purpose} />
              <SimRow label="Interest rate" value={`${FINAL_TERMS.rate}% p.a. (fixed)`} />
              <SimRow label="Tenure" value={`${FINAL_TERMS.tenure} months`} />
              <SimRow label="Repayment frequency" value={FINAL_TERMS.frequency} last />
            </div>

            <SectionLabel>Repayment</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 16px", marginBottom: 10 }}>
              <SimRow label={`Estimated ${FINAL_TERMS.frequency.toLowerCase()} installment`} value={zmw(FINAL_SIM.installment)} strong />
              <SimRow label="Total interest" value={zmw(FINAL_SIM.totalInterest)} />
              <SimRow label="Total repayment" value={zmw(FINAL_SIM.totalRepayment)} />
              <SimRow label="First payment due" value={fmtDate(FINAL_SIM.first)} />
              <SimRow label="Final payment due" value={fmtDate(FINAL_SIM.final)} last />
            </div>
            <button onClick={() => setScheduleOpen(!scheduleOpen)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: "4px 0 18px" }}>
              {scheduleOpen ? "Hide full repayment schedule" : "View full repayment schedule"} {scheduleOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {scheduleOpen && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 18, maxHeight: 260, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ position: "sticky", top: 0 }}><tr style={{ background: "#f9fafb" }}><th style={th}>#</th><th style={th}>Due date</th><th style={th}>Installment</th><th style={th}>Principal</th><th style={th}>Interest</th><th style={th}>Balance</th></tr></thead>
                  <tbody>
                    {FINAL_SIM.schedule.map((row) => (
                      <tr key={row.n} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>{row.n}</td><td style={td}>{fmtDate(row.due)}</td><td style={td}>{zmw(row.installment)}</td><td style={td}>{zmw(row.principal)}</td><td style={td}>{zmw(row.interest)}</td><td style={td}>{zmw(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <SectionLabel>Fees and charges</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 16px", marginBottom: 18 }}>
              <SimRow label="Processing fee" value={zmw(FINAL_FEES.processingFee)} />
              <SimRow label="Credit life insurance" value={zmw(FINAL_FEES.insurance)} />
              <SimRow label="Tax on fees" value={zmw(FINAL_FEES.tax)} />
              <SimRow label="Total fees and charges" value={zmw(FINAL_FEES.total)} last strong />
            </div>

            <SectionLabel>Collateral / security</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 16px", marginBottom: 18 }}>
              {ASSETS_SUMMARY.map((a, i) => <SimRow key={a.description} label={a.type} value={a.description} last={i === ASSETS_SUMMARY.length - 1} />)}
            </div>

            <SectionLabel>Key conditions</SectionLabel>
            <div style={{ marginBottom: 20 }}>
              {UNDERWRITING_DECISION.conditions.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                  <AlertTriangle size={13} color="#d97706" style={{ marginTop: 1.5, flexShrink: 0 }} />
                  <span>{c.condition} <span style={{ color: "#b45309" }}>— {c.responsible}, due before {c.dueBefore.toLowerCase()}</span></span>
                </div>
              ))}
            </div>

            {!showRejectForm && !showAmendForm && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setOfferStatus("accepted")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9, border: "none", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <Check size={14} /> Accept offer
                </button>
                <button onClick={() => setShowAmendForm(true)} style={{ padding: "10px 16px", borderRadius: 9, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Request amendment</button>
                <button onClick={() => setShowRejectForm(true)} style={{ padding: "10px 16px", borderRadius: 9, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reject offer</button>
              </div>
            )}

            {showRejectForm && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 16px" }}>
                <SectionLabel>Reject offer</SectionLabel>
                <TextArea label="Reason (required)" value={rejectReason} onChange={setRejectReason} placeholder="Why is the customer rejecting this offer?" />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button disabled={!rejectReason.trim()} onClick={() => setOfferStatus("rejected")} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: rejectReason.trim() ? "#dc2626" : "#f3c9c9", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: rejectReason.trim() ? "pointer" : "not-allowed" }}>Confirm rejection</button>
                  <button onClick={() => setShowRejectForm(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 12.5, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {showAmendForm && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px" }}>
                <SectionLabel>Request amendment</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
                  <SelectInput label="What is changing" value={amendField} onChange={setAmendField} options={AMEND_FIELDS} />
                  <SelectInput label="Route back to" value={amendRoute} onChange={setAmendRoute} options={ROUTE_STAGES} />
                </div>
                <TextArea label="Describe the requested change" value={amendDetail} onChange={setAmendDetail} placeholder="e.g. Customer wants tenure extended to 36 months to lower the installment." />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button disabled={!amendDetail.trim()} onClick={() => setOfferStatus("amendment")} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: amendDetail.trim() ? "#d97706" : "#fbd9a5", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: amendDetail.trim() ? "pointer" : "not-allowed" }}>Submit amendment request</button>
                  <button onClick={() => setShowAmendForm(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 12.5, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </CollapsibleStep>

      {offerStatus === "rejected" && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><XCircle size={20} color="#dc2626" /><div style={{ fontSize: 15, fontWeight: 700 }}>Offer rejected</div></div>
          <div style={{ fontSize: 12.5, color: "#991b1b" }}>Reason: {rejectReason}</div>
        </div>
      )}

      {offerStatus === "amendment" && (
        <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><AlertTriangle size={20} color="#d97706" /><div style={{ fontSize: 15, fontWeight: 700 }}>Routed back for amendment</div></div>
          <div style={{ fontSize: 12.5, color: "#92400e", marginBottom: 4 }}>Change requested: <strong>{amendField}</strong> — {amendDetail}</div>
          <div style={{ fontSize: 12.5, color: "#92400e" }}>Application sent back to the <strong>{amendRoute}</strong> stage for review and recalculation.</div>
        </div>
      )}

      {/* Step 2 — Contract & signing */}
      {offerStatus === "accepted" && (
        <CollapsibleStep index={2} title="Contract & signing" active status={executed ? "done" : "active"} summary={executed ? "Contract executed" : ""}>
          {contractStatus === "not_generated" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <FileText size={24} color="#9ca3af" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Generate the final loan contract using the approved terms.</div>
              <button onClick={() => setContractStatus("generated")} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Generate contract</button>
            </div>
          ) : (
            <>
              <SectionLabel right={<StatusPill status={executed ? "Executed" : "Generated"} />}>Contract</SectionLabel>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", marginBottom: 20 }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "18px", fontSize: 12, color: "#6b7280", marginBottom: 12, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, color: "#111827", marginBottom: 6 }}>LOAN AGREEMENT — {APPLICATION.id}</div>
                  Between the Lender and {APPLICATION.customer.name} for a {APPLICATION.loan.product.toLowerCase()} of {zmw(FINAL_TERMS.amount)} at {FINAL_TERMS.rate}% p.a. over {FINAL_TERMS.tenure} months, repayable {FINAL_TERMS.frequency.toLowerCase()}…
                  <div style={{ marginTop: 8, color: "#c7c9d1" }}>[ contract preview — full document continues ]</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11.5, color: "#9ca3af" }}>Document version v1.0</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}><Download size={12} /> Download</button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#374151", background: "#f3f4f6", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Print</button>
                  </div>
                </div>
              </div>

              {!executed && !signingMethod && (
                <>
                  <SectionLabel>Signing method</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                    <button onClick={() => setSigningMethod("esign")} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 16, borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Send size={16} color="#6b7280" /></div>
                      <div><div style={{ fontSize: 14, fontWeight: 600 }}>E-signature</div><div style={{ fontSize: 12, color: "#6b7280" }}>Send for digital signature</div></div>
                    </button>
                    <button onClick={() => setSigningMethod("physical")} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 16, borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}><FileSignature size={16} color="#6b7280" /></div>
                      <div><div style={{ fontSize: 14, fontWeight: 600 }}>Physical signature</div><div style={{ fontSize: 12, color: "#6b7280" }}>Print, sign, and return</div></div>
                    </button>
                  </div>
                </>
              )}

              {!executed && signingMethod === "esign" && (
                <div>
                  <SectionLabel right={<span style={{ fontSize: 11, color: "#9ca3af" }}>{signatories.filter((s) => s.status === "Signed").length} / {signatories.length} signed</span>}>Signatories</SectionLabel>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(signatories.filter((s) => s.status === "Signed").length / signatories.length) * 100}%`, background: "#4f46e5", borderRadius: 4 }} />
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
                    {signatories.map((s, i) => (
                      <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={14} color="#9ca3af" /><div><div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 10.5, color: "#9ca3af" }}>{s.role}</div></div></div>
                        <button onClick={() => toggleSignatory(i)} style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0 }}><StatusPill status={s.status} /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 14 }}>Click a status pill to simulate a signature being received.</div>
                </div>
              )}

              {!executed && signingMethod === "physical" && (
                <div>
                  <SectionLabel>Physical signature tracking</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <SelectInput label="Dispatch / hand-over status" value={physical.dispatch} onChange={(v) => setPhysical({ ...physical, dispatch: v })} options={["Not dispatched", "Dispatched", "Handed over"]} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Verification status</div>
                      <StatusPill status={physical.verification} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151", marginBottom: 12 }}>
                    <input type="checkbox" checked={physical.received} onChange={(e) => setPhysical({ ...physical, received: e.target.checked })} /> Signed document received
                  </label>
                  {!physical.uploaded ? (
                    <button onClick={() => setPhysical({ ...physical, uploaded: true, verification: "Pending" })} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", marginBottom: 12 }}>
                      <UploadCloud size={13} /> Upload signed document
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><FileText size={14} color="#9ca3af" /> Signed contract — {APPLICATION.id}.pdf</div>
                      <button onClick={() => setPhysical({ ...physical, verification: "Verified" })} style={{ fontSize: 11.5, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>Mark verified</button>
                    </div>
                  )}
                </div>
              )}

              {!executed && signingMethod && (
                <button disabled={!allSigned} onClick={() => setExecuted(true)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 10, border: "none", background: allSigned ? "#16a34a" : "#c7c9d1", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: allSigned ? "pointer" : "not-allowed" }}>
                  Mark contract executed <ArrowRight size={15} />
                </button>
              )}
              {!executed && signingMethod && !allSigned && <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 6 }}>All required signatures must be completed first.</div>}

              {executed && (
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
                  <CheckCircle2 size={28} color="#16a34a" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>Contract executed</div>
                  <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>All required signatures completed via {signingMethod === "esign" ? "e-signature" : "physical signature"}. The loan is ready for disbursement.</div>
                </div>
              )}
            </>
          )}
        </CollapsibleStep>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OfferIssuanceStage() {
  const [section, setSection] = useState("offer");
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6", minHeight: "100vh", padding: "28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1080, background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#4f46e5", padding: "16px 26px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileSignature size={17} color="#fff" /></div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Loan application</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>Stage 5 — Offer issuance &amp; signing</div></div>
        </div>
        <ContextHeader />
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 560 }}>
          <LeftNav section={section} setSection={setSection} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {section === "application" && <LoanApplicationReview />}
            {section === "prescreening" && <PrescreeningReview />}
            {section === "enrichment" && <EnrichmentReview />}
            {section === "underwriting" && <UnderwritingReview />}
            {section === "offer" && <div style={{ maxHeight: 640, overflowY: "auto" }}><OfferWorkspace /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}