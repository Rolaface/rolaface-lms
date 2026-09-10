import React, { useState, useMemo, useEffect } from "react";
import {
  IconFileText as FileText,
  IconGauge as Gauge,
  IconBuildingBank as Landmark,
  IconWallet as Wallet,
  IconPercentage as Percent,
  IconCalendar as Calendar,
  IconCheck as Check,
  IconX as X,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconChevronRight as ChevronRight,
  IconArrowRight as ArrowRight,
  IconArrowLeft as ArrowLeft,
  IconInfoCircle as Info,
  IconAlertTriangle as AlertTriangle,
  IconAlertCircle as AlertCircle,
  IconCircleCheck as CheckCircle2,
  IconCircleX as XCircle,
  IconHelp as HelpCircle,
  IconShieldCheck as ShieldCheck,
} from "@tabler/icons-react";
// ---------------------------------------------------------------------------
// Mock data — represents what Stage 1 (application) and Stage 2 (prescreening)
// already produced. Both are now frozen / read-only.
// ---------------------------------------------------------------------------

const APPLICATION = {
  id: "APP-58231",
  customer: {
    name: "Chanda Mwansa", type: "Existing customer", id: "CU-10234", phone: "0977 123 456",
    email: "chanda.mwansa@example.com", nrc: "123456/78/1", segment: "Salaried — Ministry of Health",
    dob: "14-Mar-1990", gender: "Female", maritalStatus: "Married", address: "Plot 22, Kabulonga, Lusaka",
    nationality: "Zambian", nextOfKin: { name: "Mwansa Banda", phone: "0977 456 789", relationship: "Spouse" },
  },
  loan: { product: "Personal loan", typeId: "personal", subtype: "Salary-backed", purpose: "Home improvement", amount: 76500, tenure: 24, rate: 25, frequency: "Monthly" },
  documents: [
    { name: "Latest 3 payslips", tier: "required", uploaded: true },
    { name: "National ID copy", tier: "required", uploaded: true },
    { name: "Passport photo", tier: "required", uploaded: true },
    { name: "Proof of residence", tier: "optional", uploaded: false },
  ],
  employment: { status: "Formally employed", employer: "Ministry of Health", occupation: "Nurse", monthlyIncome: 12560, additionalIncome: 0, monthlyExpenses: 4500 },
  collateral: null,
};

const POLICY = { personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 } };
const PRODUCT_LIMITS = { amountMin: 5000, rateMin: 18, rateMax: 32, tenureMin: 6, tenureMax: 60 };

// The decided prescreening inputs — locked once Stage 2 was completed
const PRESCREENING_DATA = {
  credit: { value: 742, source: "bureau" },
  liabilities: { obligations: 3850, activeLoans: 2, outstanding: 38500, source: "bureau" },
  income: { value: 13100, source: "hrms" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const zmw = (n) => (n == null ? "—" : "ZMW " + Math.round(n).toLocaleString());

function computeSimulation(amount, tenure, rate, frequency, feePct = 0) {
  const nPeriods = frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  let installment;
  if (periodicRate > 0) installment = (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) / (Math.pow(1 + periodicRate, nPeriods) - 1);
  else installment = amount / nPeriods;
  const totalRepayment = installment * nPeriods;
  const totalInterest = totalRepayment - amount;
  const fee = amount * feePct;
  const first = new Date();
  first.setMonth(first.getMonth() + 1);
  const final = new Date(first);
  if (frequency === "Bi-weekly") final.setDate(final.getDate() + 14 * (nPeriods - 1));
  else final.setMonth(final.getMonth() + (nPeriods - 1));
  const schedule = [];
  let balance = amount;
  for (let i = 1; i <= Math.min(nPeriods, 6); i++) {
    const interestPortion = balance * periodicRate;
    const principalPortion = installment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    const due = new Date(first);
    if (frequency === "Bi-weekly") due.setDate(due.getDate() + 14 * (i - 1));
    else due.setMonth(due.getMonth() + (i - 1));
    schedule.push({ n: i, due, principal: principalPortion, interest: interestPortion, balance });
  }
  return { installment, totalRepayment: totalRepayment + fee, totalInterest, fee, nPeriods, first, final, schedule };
}

const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function calcEligibility({ income, obligations, maxDTI, annualRate, tenureMonths, productMax, creditScore, minCreditScore }) {
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount = r > 0 ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r) : capacity * tenureMonths;
  const eligibleAmount = creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0;
  return { customerDTI, creditPassed, dtiPassed, maxAffordableMonthly, capacity, affordabilityAmount, eligibleAmount, productMax, mandatoryPassed: creditPassed && dtiPassed };
}

// The prescreening decision, computed once and now locked
const PRESCREENING_POLICY = POLICY[APPLICATION.loan.typeId];
const PRESCREENING_CALC = calcEligibility({
  income: PRESCREENING_DATA.income.value, obligations: PRESCREENING_DATA.liabilities.obligations, maxDTI: PRESCREENING_POLICY.maxDTI,
  annualRate: APPLICATION.loan.rate, tenureMonths: APPLICATION.loan.tenure, productMax: PRESCREENING_POLICY.productMax,
  creditScore: PRESCREENING_DATA.credit.value, minCreditScore: PRESCREENING_POLICY.minCreditScore,
});
const APPROVED_AMOUNT = Math.round(PRESCREENING_CALC.eligibleAmount);

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SourceBadge({ source }) {
  const map = {
    bureau: { label: "Credit bureau", color: "#4338ca", bg: "#eef2ff" },
    hrms: { label: "HRMS", color: "#4338ca", bg: "#eef2ff" },
    application: { label: "From application", color: "#0f766e", bg: "#ecfdf5" },
    manual: { label: "Manually entered", color: "#c2410c", bg: "#fff7ed" },
  };
  const s = map[source] || map.manual;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 20 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function FieldError({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, fontSize: 12.5, color: "#dc2626" }}>
      <AlertCircle size={13} style={{ marginTop: 1.5, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

function ReadRow({ label, value, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{value ?? "—"}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}

function SimRow({ label, value, last, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : "1px solid #f3f4f6", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: accent ? "#d97706" : "#111827" }}>{value}</div>
    </div>
  );
}

function CheckLine({ ok, children }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5, color: "#374151" }}>
      {ok ? <Check size={14} color="#16a34a" style={{ marginTop: 1, flexShrink: 0 }} /> : <X size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />}
      {children}
    </li>
  );
}

const th = { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#6b7280", fontSize: 11 };
const td = { padding: "8px 12px", color: "#374151" };

// ---------------------------------------------------------------------------
// Context header
// ---------------------------------------------------------------------------

function ContextHeader() {
  const { customer, loan, id } = APPLICATION;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 26px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4f46e5", fontSize: 13, flexShrink: 0 }}>
          {customer.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{customer.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{loan.product} · {loan.subtype}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10.5, color: "#9ca3af" }}>Approved amount</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{zmw(APPROVED_AMOUNT)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10.5, color: "#9ca3af" }}>Application ID</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{id}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left navigation
// ---------------------------------------------------------------------------

function LeftNav({ section, setSection }) {
  const items = [
    { id: "application", label: "Loan application", icon: FileText },
    { id: "prescreening", label: "Prescreening", icon: Gauge },
    { id: "enrichment", label: "Enrichment", icon: Landmark },
  ];
  return (
    <div style={{ width: 216, flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", padding: "18px 12px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", padding: "0 10px", marginBottom: 10 }}>Stage 3 of 5</div>
      {items.map((it) => {
        const active = section === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => setSection(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 4,
              borderRadius: 9, border: "none", background: active ? "#eef2ff" : "transparent",
              color: active ? "#4338ca" : "#374151", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer", textAlign: "left",
            }}
          >
            <Icon size={16} />
            {it.label}
            {it.id !== "enrichment" && <Check size={13} style={{ marginLeft: "auto", color: active ? "#4338ca" : "#16a34a" }} />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — Loan application (read-only, tabbed)
// ---------------------------------------------------------------------------

const APP_TABS = [
  { id: "customer", label: "Customer & loan" },
  { id: "eligibility", label: "Eligibility & simulation" },
  { id: "personal", label: "Personal details" },
  ...(APPLICATION.collateral ? [{ id: "collateral", label: "Collateral" }] : []),
  { id: "documents", label: "Documents" },
  { id: "employment", label: "Employment" },
  { id: "review", label: "Review" },
];

function ReadOnlyTabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 20px", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
      {tabs.map((t, i) => {
        const isActive = t.id === active;
        return (
          <React.Fragment key={t.id}>
            {i > 0 && <ChevronRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />}
            <button
              onClick={() => onSelect(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "none",
                background: isActive ? "#eef2ff" : "transparent", color: isActive ? "#4338ca" : "#374151",
                fontSize: 12.5, fontWeight: isActive ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#4f46e5", color: "#fff", flexShrink: 0 }}>
                <Check size={11} />
              </span>
              {t.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LoanApplicationReview() {
  const { customer, loan, documents, employment, collateral } = APPLICATION;
  const [appTab, setAppTab] = useState("customer");
  const simulation = useMemo(() => computeSimulation(loan.amount, loan.tenure, loan.rate, loan.frequency, 0.02), []);

  return (
    <div>
      <div style={{ padding: "12px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 14px" }}>
          <Info size={14} style={{ color: "#4f46e5", marginTop: 1.5, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#3730a3" }}>Submitted application data — read-only at this stage.</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <ReadOnlyTabBar tabs={APP_TABS} active={appTab} onSelect={setAppTab} />
      </div>

      <div style={{ padding: "22px 26px", maxHeight: 480, overflowY: "auto" }}>
        {appTab === "customer" && (
          <>
            <SectionLabel>Customer</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
              <ReadRow label="Customer name" value={customer.name} />
              <ReadRow label="Customer type" value={customer.type} />
              <ReadRow label="Customer ID" value={customer.id} />
              <ReadRow label="Segment" value={customer.segment} />
              <ReadRow label="Phone" value={customer.phone} />
              <ReadRow label="Email" value={customer.email} />
            </div>
            <SectionLabel>Loan</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Loan product" value={loan.product} />
              <ReadRow label="Sub-type" value={loan.subtype} />
              <ReadRow label="Purpose" value={loan.purpose} />
              <ReadRow label="Repayment frequency" value={loan.frequency} />
              <ReadRow label="Requested amount" value={zmw(loan.amount)} />
              <ReadRow label="Tenure" value={`${loan.tenure} months`} />
              <ReadRow label="Interest rate" value={`${loan.rate}% p.a.`} />
            </div>
          </>
        )}

        {appTab === "eligibility" && (
          <>
            <SectionLabel>Loan terms</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
              <MiniStat label="Requested amount" value={zmw(loan.amount)} />
              <MiniStat label="Tenure" value={`${loan.tenure} months`} />
              <MiniStat label="Interest rate" value={`${loan.rate}% p.a.`} />
            </div>
            <SectionLabel>Simulation as submitted</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 16px" }}>
              <SimRow label="Estimated installment" value={zmw(simulation.installment)} />
              <SimRow label="Total interest" value={zmw(simulation.totalInterest)} />
              <SimRow label="Total repayment" value={zmw(simulation.totalRepayment)} />
              <SimRow label="Fees and charges" value={zmw(simulation.fee)} />
              <SimRow label="First repayment date" value={fmtDate(simulation.first)} />
              <SimRow label="Final repayment date" value={fmtDate(simulation.final)} last />
            </div>
          </>
        )}

        {appTab === "personal" && (
          <>
            <SectionLabel>Personal details</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
              <ReadRow label="Full name" value={customer.name} />
              <ReadRow label="National ID" value={customer.nrc} />
              <ReadRow label="Date of birth" value={customer.dob} />
              <ReadRow label="Gender" value={customer.gender} />
              <ReadRow label="Marital status" value={customer.maritalStatus} />
              <ReadRow label="Nationality" value={customer.nationality} />
              <ReadRow label="Residential address" value={customer.address} span={2} />
            </div>
            <SectionLabel>Next of kin</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Name" value={customer.nextOfKin?.name} />
              <ReadRow label="Phone" value={customer.nextOfKin?.phone} />
              <ReadRow label="Relationship" value={customer.nextOfKin?.relationship} />
            </div>
          </>
        )}

        {appTab === "collateral" && collateral && (
          <>
            <SectionLabel>Collateral</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Collateral type" value={collateral.type} />
              <ReadRow label="Estimated value" value={zmw(collateral.value)} />
              <ReadRow label="Description" value={collateral.description} span={2} />
            </div>
          </>
        )}

        {appTab === "documents" && (
          <>
            <SectionLabel>Documents submitted</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "6px 18px" }}>
              {documents.map((d, i) => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "10px 0", borderBottom: i < documents.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ color: "#374151" }}>{d.name} <span style={{ color: "#9ca3af", fontSize: 11 }}>· {d.tier}</span></span>
                  {d.uploaded ? <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#15803d", fontWeight: 500 }}><Check size={13} /> Submitted</span> : <span style={{ color: "#9ca3af" }}>Not provided</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {appTab === "employment" && (
          <>
            <SectionLabel>Employment and income</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Status" value={employment.status} />
              <ReadRow label="Employer" value={employment.employer} />
              <ReadRow label="Occupation" value={employment.occupation} />
              <ReadRow label="Monthly income (declared)" value={zmw(employment.monthlyIncome)} />
              <ReadRow label="Additional income (declared)" value={zmw(employment.additionalIncome)} />
              <ReadRow label="Monthly expenses (declared)" value={zmw(employment.monthlyExpenses)} />
            </div>
          </>
        )}

        {appTab === "review" && (
          <>
            <SectionLabel>Application summary</SectionLabel>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
              <SimRow label="Product" value={loan.product} />
              <SimRow label="Amount" value={zmw(loan.amount)} />
              <SimRow label="Tenure" value={`${loan.tenure} months`} />
              <SimRow label="Interest rate" value={`${loan.rate}% p.a.`} />
              <SimRow label="Estimated installment" value={zmw(simulation.installment)} />
              <SimRow label="Total repayment" value={zmw(simulation.totalRepayment)} last />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
              <SimRow label={customer.type} value={customer.name} />
              {collateral && <SimRow label="Collateral" value={`${collateral.type} · ${zmw(collateral.value)}`} />}
              <SimRow label="Documents" value={`${documents.filter((d) => d.uploaded).length} of ${documents.length} submitted`} />
              <SimRow label="Monthly income" value={zmw(employment.monthlyIncome)} last />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Prescreening (read-only, decision already made)
// ---------------------------------------------------------------------------

const PRESCREENING_TABS = [
  { id: "data", label: "Prescreening data" },
  { id: "calculation", label: "Eligibility calculation" },
  { id: "decision", label: "Decision" },
];

function StaticSourceCard({ title, icon: Icon, value, suffix, note, source }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
        <Icon size={14} color="#6b7280" /> {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{value}{suffix && <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}> {suffix}</span>}</div>
      <div style={{ fontSize: 11.5, color: "#6b7280", margin: "2px 0 8px" }}>{note}</div>
      <SourceBadge source={source} />
    </div>
  );
}

function RuleRow({ rule, req, customer, pass, calculated }) {
  return (
    <tr style={{ borderTop: "1px solid #f3f4f6" }}>
      <td style={td}>{rule}</td><td style={td}>{req}</td><td style={td}>{customer}</td>
      <td style={td}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: pass ? "#15803d" : "#dc2626" }}>
          {calculated ? <><Percent size={11} /> Calculated</> : pass ? <><Check size={11} /> Passed</> : <><X size={11} /> Failed</>}
        </span>
      </td>
    </tr>
  );
}

function PrescreeningReview() {
  const [tab, setTab] = useState("data");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const requested = APPLICATION.loan.amount;
  const calc = PRESCREENING_CALC;
  const isPartial = calc.mandatoryPassed && calc.eligibleAmount < requested;

  return (
    <div>
      <div style={{ padding: "12px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 14px" }}>
          <Info size={14} style={{ color: "#4f46e5", marginTop: 1.5, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#3730a3" }}>Prescreening decision is locked — read-only at this stage.</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <ReadOnlyTabBar tabs={PRESCREENING_TABS} active={tab} onSelect={setTab} />
      </div>

      <div style={{ padding: "22px 26px", maxHeight: 480, overflowY: "auto" }}>
        {tab === "data" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <StaticSourceCard title="Credit score" icon={Gauge} value={PRESCREENING_DATA.credit.value} note="Fetched at prescreening" source={PRESCREENING_DATA.credit.source} />
            <StaticSourceCard title="Existing liabilities" icon={Landmark} value={zmw(PRESCREENING_DATA.liabilities.obligations)} suffix="/mo" note={`${PRESCREENING_DATA.liabilities.activeLoans} active loans · ${zmw(PRESCREENING_DATA.liabilities.outstanding)} outstanding`} source={PRESCREENING_DATA.liabilities.source} />
            <StaticSourceCard title="Monthly income" icon={Wallet} value={zmw(PRESCREENING_DATA.income.value)} note="Confirmed via HRMS payroll" source={PRESCREENING_DATA.income.source} />
          </div>
        )}

        {tab === "calculation" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 4 }}>
              <div><div style={{ fontSize: 11.5, color: "#6b7280" }}>Requested loan</div><div style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{zmw(requested)}</div></div>
              <div><div style={{ fontSize: 11.5, color: "#6b7280" }}>Maximum eligible amount</div><div style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{zmw(calc.eligibleAmount)}</div></div>
            </div>

            <button onClick={() => setRulesOpen(!rulesOpen)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#111827", background: "transparent", border: "none", cursor: "pointer", padding: "12px 0", width: "100%", justifyContent: "space-between" }}>
              <span>How was eligibility calculated?</span> {rulesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {rulesOpen && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead><tr style={{ background: "#f9fafb" }}><th style={th}>Rule</th><th style={th}>Requirement</th><th style={th}>Customer</th><th style={th}>Result</th></tr></thead>
                  <tbody>
                    <RuleRow rule="Minimum credit score" req={`≥ ${PRESCREENING_POLICY.minCreditScore}`} customer={String(PRESCREENING_DATA.credit.value)} pass={calc.creditPassed} />
                    <RuleRow rule="Maximum debt-to-income" req={`≤ ${PRESCREENING_POLICY.maxDTI}%`} customer={`${calc.customerDTI.toFixed(0)}%`} pass={calc.dtiPassed} />
                    <RuleRow rule="Maximum loan amount" req="Based on affordability" customer={zmw(calc.eligibleAmount)} pass={calc.mandatoryPassed} calculated />
                    <RuleRow rule="Product maximum" req={`≤ ${zmw(PRESCREENING_POLICY.productMax)}`} customer={zmw(calc.eligibleAmount)} pass={calc.mandatoryPassed} />
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={() => setCalcOpen(!calcOpen)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#111827", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0", width: "100%", justifyContent: "space-between" }}>
              <span>View calculation</span> {calcOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {calcOpen && (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "6px 16px" }}>
                <SimRow label="Monthly income" value={zmw(PRESCREENING_DATA.income.value)} />
                <SimRow label="Existing monthly obligations" value={zmw(PRESCREENING_DATA.liabilities.obligations)} />
                <SimRow label="Maximum allowed debt ratio" value={`${PRESCREENING_POLICY.maxDTI}%`} />
                <SimRow label="Maximum affordable monthly payment" value={zmw(calc.maxAffordableMonthly)} />
                <SimRow label="Available repayment capacity" value={zmw(calc.capacity)} />
                <SimRow label={`Maximum loan amount at ${APPLICATION.loan.rate}% over ${APPLICATION.loan.tenure} months`} value={zmw(calc.affordabilityAmount)} />
                <SimRow label="Product maximum" value={zmw(PRESCREENING_POLICY.productMax)} />
                <SimRow label="Final eligible amount" value={zmw(calc.eligibleAmount)} last strong />
              </div>
            )}
          </>
        )}

        {tab === "decision" && (
          <div style={{ background: isPartial ? "#fffbeb" : "#f0fdf4", border: "1.5px solid " + (isPartial ? "#fde68a" : "#bbf7d0"), borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {isPartial ? <AlertTriangle size={20} color="#d97706" /> : <CheckCircle2 size={20} color="#16a34a" />}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{isPartial ? "Amount adjusted at prescreening" : "Prescreening passed"}</div>
            </div>
            {isPartial ? (
              <>
                <p style={{ fontSize: 12.5, color: "#92400e", margin: "0 0 14px" }}>The customer didn't qualify for the full requested amount. The credit team used the eligible amount to proceed.</p>
                <div style={{ display: "flex", gap: 24 }}>
                  <MiniStat label="Requested" value={zmw(requested)} />
                  <MiniStat label="Approved" value={zmw(APPROVED_AMOUNT)} accent />
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12.5, color: "#166534", margin: 0 }}>The requested amount of {zmw(requested)} was within the customer's eligibility and was approved as requested.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — Enrichment (active, interactive)
// ---------------------------------------------------------------------------

function NumberField({ label, value, onChange, suffix, hint, error, min, max, step }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input type="number" value={value ?? ""} min={min} max={max} step={step ?? 1} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid " + (error ? "#fca5a5" : "#d1d5db"), fontSize: 13, boxSizing: "border-box" }} />
        {suffix && <span style={{ position: "absolute", right: 11, top: 9, fontSize: 12, color: "#9ca3af" }}>{suffix}</span>}
      </div>
      {hint && !error && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</div>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function EnrichmentWorkspace() {
  const [amount, setAmount] = useState(APPROVED_AMOUNT);
  const [tenure, setTenure] = useState(APPLICATION.loan.tenure);
  const [frequency, setFrequency] = useState(APPLICATION.loan.frequency);
  const [rate, setRate] = useState(APPLICATION.loan.rate);
  const [interestType, setInterestType] = useState("Fixed");
  const [calcMethod, setCalcMethod] = useState("Reducing balance");
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [processingFeePct, setProcessingFeePct] = useState(2);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [insurancePct, setInsurancePct] = useState(1);
  const [taxPct, setTaxPct] = useState(16);
  const [waiverEnabled, setWaiverEnabled] = useState(false);
  const [waiverAmount, setWaiverAmount] = useState(0);
  const [waiverReason, setWaiverReason] = useState("");

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [continued, setContinued] = useState(false);

  const amountError = amount != null && (amount < PRODUCT_LIMITS.amountMin || amount > APPROVED_AMOUNT)
    ? `Enter an amount between ${zmw(PRODUCT_LIMITS.amountMin)} and ${zmw(APPROVED_AMOUNT)} (the amount approved at prescreening).` : null;
  const tenureError = tenure != null && (tenure < PRODUCT_LIMITS.tenureMin || tenure > PRODUCT_LIMITS.tenureMax)
    ? `Enter a tenure between ${PRODUCT_LIMITS.tenureMin} and ${PRODUCT_LIMITS.tenureMax} months.` : null;
  const rateError = rate != null && (rate < PRODUCT_LIMITS.rateMin || rate > PRODUCT_LIMITS.rateMax)
    ? `Enter a rate between ${PRODUCT_LIMITS.rateMin}% and ${PRODUCT_LIMITS.rateMax}%.` : null;

  const valid = !amountError && !tenureError && !rateError && amount && tenure && rate;

  const figures = useMemo(() => {
    if (!valid) return null;
    const processingFee = amount * (processingFeePct / 100);
    const insurance = insuranceEnabled ? amount * (insurancePct / 100) : 0;
    const feesSubtotal = processingFee + insurance;
    const tax = feesSubtotal * (taxPct / 100);
    const waiver = waiverEnabled ? Number(waiverAmount || 0) : 0;
    const netCharges = Math.max(0, feesSubtotal + tax - waiver);
    const netDisbursement = amount - netCharges;
    const sim = computeSimulation(amount, tenure, rate, frequency, 0);
    const totalCostOfCredit = sim.totalInterest + netCharges;
    return { processingFee, insurance, feesSubtotal, tax, waiver, netCharges, netDisbursement, sim, totalCostOfCredit };
  }, [valid, amount, tenure, rate, frequency, processingFeePct, insuranceEnabled, insurancePct, taxPct, waiverEnabled, waiverAmount]);

  if (continued) {
    return (
      <div style={{ padding: "60px 30px", textAlign: "center" }}>
        <CheckCircle2 size={32} color="#16a34a" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827" }}>Moving to Stage 4 — Underwriting</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 6 }}>Final terms locked at {zmw(amount)} · {rate}% · {tenure} months.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 30px", maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "10px 14px", marginBottom: 22 }}>
        <Info size={15} style={{ color: "#4f46e5", marginTop: 1.5, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "#3730a3" }}>These are the final commercial terms being prepared for underwriting and the customer offer — not yet final approved terms.</div>
      </div>

      <SectionLabel>Interest details</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
        <NumberField label="Interest rate" value={rate} onChange={setRate} suffix="% p.a." hint={`Product range: ${PRODUCT_LIMITS.rateMin}%–${PRODUCT_LIMITS.rateMax}%`} error={rateError} min={PRODUCT_LIMITS.rateMin} max={PRODUCT_LIMITS.rateMax} step={0.5} />
        <SelectField label="Interest type" value={interestType} onChange={setInterestType} options={["Fixed", "Variable"]} />
        <SelectField label="Calculation method" value={calcMethod} onChange={setCalcMethod} options={["Reducing balance", "Flat rate"]} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Effective date</div>
          <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
      </div>

      <SectionLabel>Charges and fees</SectionLabel>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <NumberField label="Processing fee" value={processingFeePct} onChange={setProcessingFeePct} suffix="%" hint={figures ? `= ${zmw(figures.processingFee)}` : ""} min={0} max={10} step={0.5} />
          <NumberField label="Tax (VAT) on fees" value={taxPct} onChange={setTaxPct} suffix="%" hint={figures ? `= ${zmw(figures.tax)}` : ""} min={0} max={30} step={1} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input type="checkbox" checked={insuranceEnabled} onChange={(e) => setInsuranceEnabled(e.target.checked)} id="ins" />
          <label htmlFor="ins" style={{ fontSize: 12.5, fontWeight: 500, color: "#374151" }}>Credit life insurance applicable</label>
        </div>
        {insuranceEnabled && (
          <div style={{ marginBottom: 14, maxWidth: 240 }}>
            <NumberField label="Insurance premium" value={insurancePct} onChange={setInsurancePct} suffix="%" hint={figures ? `= ${zmw(figures.insurance)}` : ""} min={0} max={5} step={0.25} />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input type="checkbox" checked={waiverEnabled} onChange={(e) => setWaiverEnabled(e.target.checked)} id="waiver" />
          <label htmlFor="waiver" style={{ fontSize: 12.5, fontWeight: 500, color: "#374151" }}>Apply a waiver or discount</label>
        </div>
        {waiverEnabled && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 4 }}>
            <NumberField label="Waiver amount" value={waiverAmount} onChange={setWaiverAmount} suffix="ZMW" min={0} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Reason</div>
              <input value={waiverReason} onChange={(e) => setWaiverReason(e.target.value)} placeholder="e.g. loyalty discount"
                style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
        )}

        {figures && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
            <SimRow label="Total charges (net of waiver)" value={zmw(figures.netCharges)} last strong />
          </div>
        )}
      </div>

      <SectionLabel>Final loan terms</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
        <NumberField label="Amount" value={amount} onChange={setAmount} suffix="ZMW" hint={`Capped at approved amount: ${zmw(APPROVED_AMOUNT)}`} error={amountError} min={PRODUCT_LIMITS.amountMin} max={APPROVED_AMOUNT} step={500} />
        <NumberField label="Tenure" value={tenure} onChange={setTenure} suffix="months" hint={`${PRODUCT_LIMITS.tenureMin}–${PRODUCT_LIMITS.tenureMax}`} error={tenureError} min={PRODUCT_LIMITS.tenureMin} max={PRODUCT_LIMITS.tenureMax} />
        <SelectField label="Repayment frequency" value={frequency} onChange={setFrequency} options={["Monthly", "Bi-weekly"]} />
      </div>

      {figures ? (
        <>
          <SectionLabel>Final repayment schedule</SectionLabel>
          <div style={{ border: "1.5px solid #c7d2fe", borderRadius: 12, padding: "16px 18px", background: "#f5f6ff", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3, color: "#4338ca", background: "#e0e7ff", padding: "3px 9px", borderRadius: 20 }}>FINAL TERMS FOR UNDERWRITING</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>Estimated {frequency.toLowerCase()} installment</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginTop: 2 }}>{zmw(figures.sim.installment)}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>Net disbursement</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginTop: 2 }}>{zmw(figures.netDisbursement)}</div>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "4px 14px", marginBottom: 14 }}>
              <SimRow label="Gross loan amount" value={zmw(amount)} />
              <SimRow label="Total charges and fees" value={zmw(figures.netCharges)} />
              <SimRow label="Net disbursement" value={zmw(figures.netDisbursement)} />
              <SimRow label="Estimated installment" value={zmw(figures.sim.installment)} />
              <SimRow label="Total interest" value={zmw(figures.sim.totalInterest)} />
              <SimRow label="Total repayment (principal + interest)" value={zmw(figures.sim.totalRepayment)} />
              <SimRow label="Total cost of credit" value={zmw(figures.totalCostOfCredit)} />
              <SimRow label="First repayment date" value={fmtDate(figures.sim.first)} />
              <SimRow label="Final repayment date" value={fmtDate(figures.sim.final)} last />
            </div>
            <button onClick={() => setScheduleOpen(!scheduleOpen)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              {scheduleOpen ? "Hide repayment schedule" : "Preview repayment schedule"} {scheduleOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {scheduleOpen && (
              <div style={{ marginTop: 10, background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ background: "#f9fafb" }}><th style={th}>#</th><th style={th}>Due date</th><th style={th}>Principal</th><th style={th}>Interest</th><th style={th}>Balance</th></tr></thead>
                  <tbody>
                    {figures.sim.schedule.map((row) => (
                      <tr key={row.n} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>{row.n}</td><td style={td}>{fmtDate(row.due)}</td><td style={td}>{zmw(row.principal)}</td><td style={td}>{zmw(row.interest)}</td><td style={td}>{zmw(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {figures.sim.nPeriods > 6 && <div style={{ fontSize: 11.5, color: "#9ca3af", padding: "8px 12px" }}>Showing first 6 of {figures.sim.nPeriods} payments.</div>}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 12, padding: "18px 20px", textAlign: "center", marginBottom: 24 }}>
          <HelpCircle size={20} color="#9ca3af" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Fix the highlighted fields above to calculate the final schedule.</div>
        </div>
      )}

      <button
        disabled={!valid}
        onClick={() => valid && setContinued(true)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 10, border: "none", background: valid ? "#4f46e5" : "#c7c9d1", color: "#fff", fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed" }}
      >
        Review and continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EnrichmentStage() {
  const [section, setSection] = useState("enrichment");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6", minHeight: "100vh", padding: "28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1080, background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#4f46e5", padding: "16px 26px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Landmark size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Loan application workflow</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>Stage 3 — Loan enrichment</div>
          </div>
        </div>

        <ContextHeader />

        <div style={{ display: "flex", alignItems: "stretch", minHeight: 560 }}>
          <LeftNav section={section} setSection={setSection} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {section === "application" && <LoanApplicationReview />}
            {section === "prescreening" && <PrescreeningReview />}
            {section === "enrichment" && (
              <div style={{ maxHeight: 640, overflowY: "auto" }}>
                <EnrichmentWorkspace />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}