import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  IconFileText as FileText,
  IconGauge as Gauge,
  IconUser as User,
  IconBuilding as Building2,
  IconBuildingBank as Landmark,
  IconWallet as Wallet,
  IconClock as Clock,
  IconCalendar as Calendar,
  IconUsers as Users,
  IconPercentage as Percent,
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
  IconRefresh as RefreshCw,
  IconPencil as PenLine,
  IconDatabase as Database,
  IconLoader2 as Loader2,
  IconBriefcase as Briefcase,
} from "@tabler/icons-react";

const APPLICATION = {
  id: "APP-58231",
  customer: {
    name: "Chanda Mwansa",
    type: "Existing customer",
    id: "CU-10234",
    phone: "0977 123 456",
    email: "chanda.mwansa@example.com",
    nrc: "123456/78/1",
    segment: "Salaried — Ministry of Health",
    dob: "14-Mar-1990",
    gender: "Female",
    maritalStatus: "Married",
    address: "Plot 22, Kabulonga, Lusaka",
    nationality: "Zambian",
    nextOfKin: { name: "Mwansa Banda", phone: "0977 456 789", relationship: "Spouse" },
  },
  loan: {
    product: "Personal loan",
    typeId: "personal",
    subtype: "Salary-backed",
    purpose: "Home improvement",
    amount: 76500,
    tenure: 24,
    rate: 25,
    frequency: "Monthly",
  },
  documents: [
    { name: "Latest 3 payslips", tier: "required", uploaded: true },
    { name: "National ID copy", tier: "required", uploaded: true },
    { name: "Passport photo", tier: "required", uploaded: true },
    { name: "Proof of residence", tier: "optional", uploaded: false },
  ],
  employment: { status: "Formally employed", employer: "Ministry of Health", occupation: "Nurse", monthlyIncome: 12560, additionalIncome: 0, monthlyExpenses: 4500 },
  collateral: null,
};

// Prescreening policy configured per loan product — not invented per screen
const POLICY = {
  personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 },
  business: { minCreditScore: 620, maxDTI: 55, productMax: 500000 },
  mortgage: { minCreditScore: 680, maxDTI: 45, productMax: 2000000 },
};

const SCENARIOS = {
  lower: { label: "Eligible for a lower amount", credit: 742, creditSource: "bureau", obligations: 3850, obligationsSource: "bureau", income: 13100, incomeSource: "hrms" },
  eligible: { label: "Fully eligible", credit: 742, creditSource: "bureau", obligations: 2200, obligationsSource: "bureau", income: 22000, incomeSource: "hrms" },
  failed: { label: "Failed — credit score below minimum", credit: 590, creditSource: "bureau", obligations: 3850, obligationsSource: "bureau", income: 13100, incomeSource: "hrms" },
  bureauDown: { label: "Bureau unavailable — needs manual entry", credit: null, creditSource: "unavailable", obligations: null, obligationsSource: "unavailable", income: 13100, incomeSource: "hrms" },
  incomplete: { label: "Incomplete — income not yet available", credit: 742, creditSource: "bureau", obligations: 3850, obligationsSource: "bureau", income: null, incomeSource: "none" },
};

const DEFAULT_SCENARIO = "lower";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const zmw = (n) => (n == null ? "—" : "ZMW " + Math.round(n).toLocaleString());

function computeSimulation(amount, tenure, rate, frequency, feePct = 0.02) {
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
  return { installment, totalRepayment: totalRepayment + fee, totalInterest, fee, nPeriods, first, final };
}

const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function calcEligibility({ income, obligations, maxDTI, annualRate, tenureMonths, productMax, creditScore, minCreditScore }) {
  if (income == null || obligations == null || creditScore == null) return null;
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount = r > 0 ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r) : capacity * tenureMonths;
  const eligibleAmount = creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0;
  return {
    customerDTI, creditPassed, dtiPassed, maxAffordableMonthly, capacity, affordabilityAmount,
    eligibleAmount, productMax, mandatoryPassed: creditPassed && dtiPassed,
  };
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SourceBadge({ source }) {
  const map = {
    bureau: { label: "Credit bureau", color: "#4338ca", bg: "#eef2ff" },
    hrms: { label: "HRMS", color: "#4338ca", bg: "#eef2ff" },
    application: { label: "From application", color: "#0f766e", bg: "#ecfdf5" },
    manual: { label: "Manually entered", color: "#c2410c", bg: "#fff7ed" },
    unavailable: { label: "Unavailable", color: "#9ca3af", bg: "#f3f4f6" },
    none: { label: "Not available", color: "#9ca3af", bg: "#f3f4f6" },
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

function SimRow({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : "1px solid #f3f4f6", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context header (replaces the right-side application summary)
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
          <div style={{ fontSize: 10.5, color: "#9ca3af" }}>Requested amount</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{zmw(loan.amount)}</div>
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
  ];
  return (
    <div style={{ width: 216, flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", padding: "18px 12px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", padding: "0 10px", marginBottom: 10 }}>Stage 2 of 5</div>
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
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Loan application (read-only review)
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

function ReadOnlyTabBar({ active, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 20px", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
      {APP_TABS.map((t, i) => {
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

function LoanApplicationReview({ onBack }) {
  const { customer, loan, documents, employment, collateral } = APPLICATION;
  const [appTab, setAppTab] = useState("customer");
  const simulation = useMemo(() => computeSimulation(loan.amount, loan.tenure, loan.rate, loan.frequency), []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 14px", flex: 1, marginRight: 16 }}>
          <Info size={14} style={{ color: "#4f46e5", marginTop: 1.5, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#3730a3" }}>Submitted application data — read-only at this stage.</div>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            <ArrowLeft size={13} /> Back to application
          </button>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <ReadOnlyTabBar active={appTab} onSelect={setAppTab} />
      </div>

      <div style={{ padding: "22px 26px", maxHeight: 500, overflowY: "auto" }}>
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
              <CalcRow label="Estimated installment" value={zmw(simulation.installment)} />
              <CalcRow label="Total interest" value={zmw(simulation.totalInterest)} />
              <CalcRow label="Total repayment" value={zmw(simulation.totalRepayment)} />
              <CalcRow label="Fees and charges" value={zmw(simulation.fee)} />
              <CalcRow label="First repayment date" value={fmtDate(simulation.first)} />
              <CalcRow label="Final repayment date" value={fmtDate(simulation.final)} last />
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
                  {d.uploaded ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#15803d", fontWeight: 500 }}><Check size={13} /> Submitted</span>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>Not provided</span>
                  )}
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
// Data source cards (credit score / liabilities / income)
// ---------------------------------------------------------------------------

function DataCard({ title, icon: Icon, status, source, manualMode, onEnterManually, onUseSource, onRefresh, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#374151" }}>
          <Icon size={14} color="#6b7280" /> {title}
        </div>
        {status === "loading" && <Loader2 size={13} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />}
      </div>
      {children}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {!manualMode && source !== "unavailable" && source !== "none" && onRefresh && (
          <button onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
            <RefreshCw size={11} /> Refresh
          </button>
        )}
        {!manualMode && (
          <button onClick={onEnterManually} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#374151", background: "#f3f4f6", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
            <PenLine size={11} /> Enter manually
          </button>
        )}
        {manualMode && onUseSource && (
          <button onClick={onUseSource} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#374151", background: "#f3f4f6", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
            <RefreshCw size={11} /> Use source value
          </button>
        )}
      </div>
    </div>
  );
}

function CreditScoreCard({ state, dispatch }) {
  const { value, source, status, manual, reason } = state.credit;
  return (
    <DataCard
      title="Credit score" icon={ShieldIcon} status={status} source={source} manualMode={manual}
      onRefresh={() => dispatch({ type: "fetchCredit" })}
      onEnterManually={() => dispatch({ type: "manualCredit", on: true })}
      onUseSource={() => dispatch({ type: "manualCredit", on: false })}
    >
      {status === "loading" ? (
        <div style={{ fontSize: 12.5, color: "#6b7280" }}>Fetching from credit bureau…</div>
      ) : manual ? (
        <>
          <input type="number" value={value ?? ""} onChange={(e) => dispatch({ type: "setCredit", value: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder="e.g. 700" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, fontWeight: 700, boxSizing: "border-box", marginBottom: 8 }} />
          <input value={reason} onChange={(e) => dispatch({ type: "setCreditReason", value: e.target.value })} placeholder="Reason for manual entry"
            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, boxSizing: "border-box" }} />
          <div style={{ marginTop: 8 }}><SourceBadge source="manual" /></div>
        </>
      ) : source === "unavailable" ? (
        <>
          <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 4 }}>Bureau unavailable</div>
          <SourceBadge source="unavailable" />
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{value}</div>
          <div style={{ fontSize: 11.5, color: "#6b7280", margin: "2px 0 8px" }}>Fetched today · Successfully fetched</div>
          <SourceBadge source={source} />
        </>
      )}
    </DataCard>
  );
}

function LiabilitiesCard({ state, dispatch }) {
  const { obligations, activeLoans, outstanding, source, status, manual, reason } = state.liabilities;
  return (
    <DataCard
      title="Existing liabilities" icon={Landmark} status={status} source={source} manualMode={manual}
      onRefresh={() => dispatch({ type: "fetchLiabilities" })}
      onEnterManually={() => dispatch({ type: "manualLiabilities", on: true })}
      onUseSource={() => dispatch({ type: "manualLiabilities", on: false })}
    >
      {status === "loading" ? (
        <div style={{ fontSize: 12.5, color: "#6b7280" }}>Fetching from credit bureau…</div>
      ) : manual ? (
        <>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Monthly obligations (ZMW)</div>
          <input type="number" value={obligations ?? ""} onChange={(e) => dispatch({ type: "setObligations", value: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder="e.g. 5000" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, fontWeight: 700, boxSizing: "border-box", marginBottom: 8 }} />
          <input value={reason} onChange={(e) => dispatch({ type: "setLiabReason", value: e.target.value })} placeholder="Reason for manual adjustment"
            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, boxSizing: "border-box" }} />
          <div style={{ marginTop: 8 }}><SourceBadge source="manual" /></div>
        </>
      ) : source === "unavailable" ? (
        <>
          <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 4 }}>Bureau unavailable</div>
          <SourceBadge source="unavailable" />
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{zmw(obligations)}<span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}> /mo</span></div>
          <div style={{ fontSize: 11.5, color: "#6b7280", margin: "2px 0 8px" }}>{activeLoans} active loans · {zmw(outstanding)} outstanding</div>
          <SourceBadge source={source} />
        </>
      )}
    </DataCard>
  );
}

function IncomeCard({ state, dispatch }) {
  const { value, source, status, manual, reason } = state.income;
  return (
    <DataCard
      title="Monthly income" icon={Wallet} status={status} source={source} manualMode={manual}
      onRefresh={() => dispatch({ type: "fetchIncome" })}
      onEnterManually={() => dispatch({ type: "manualIncome", on: true })}
      onUseSource={() => dispatch({ type: "manualIncome", on: false })}
    >
      {status === "loading" ? (
        <div style={{ fontSize: 12.5, color: "#6b7280" }}>Checking HRMS…</div>
      ) : manual ? (
        <>
          <input type="number" value={value ?? ""} onChange={(e) => dispatch({ type: "setIncome", value: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder="e.g. 12000" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, fontWeight: 700, boxSizing: "border-box", marginBottom: 8 }} />
          <input value={reason} onChange={(e) => dispatch({ type: "setIncomeReason", value: e.target.value })} placeholder="Reason for manual entry"
            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12, boxSizing: "border-box" }} />
          <div style={{ marginTop: 8 }}><SourceBadge source="manual" /></div>
        </>
      ) : source === "none" ? (
        <>
          <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 4 }}>Not available from HRMS or the application</div>
          <SourceBadge source="none" />
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{zmw(value)}</div>
          <div style={{ fontSize: 11.5, color: "#6b7280", margin: "2px 0 8px" }}>
            {source === "hrms" ? "Confirmed via HRMS payroll" : source === "application" ? "Reused from the loan application" : ""}
          </div>
          <SourceBadge source={source} />
        </>
      )}
    </DataCard>
  );
}

const ShieldIcon = (p) => <Gauge {...p} />;

// ---------------------------------------------------------------------------
// Eligibility comparison bar
// ---------------------------------------------------------------------------

function ComparisonBar({ requested, eligible, productMax }) {
  const scale = Math.max(requested, eligible, productMax * 0.4) * 1.05;
  const eligiblePct = Math.min(100, (eligible / scale) * 100);
  const requestedPct = Math.min(100, (requested / scale) * 100);
  const tone = eligible >= requested ? "#16a34a" : "#d97706";
  return (
    <div style={{ margin: "14px 0 18px" }}>
      <div style={{ position: "relative", height: 10, background: "#f3f4f6", borderRadius: 6, overflow: "visible" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${eligiblePct}%`, background: tone, borderRadius: 6 }} />
        <div style={{ position: "absolute", left: `calc(${requestedPct}% - 1px)`, top: -4, width: 2, height: 18, background: "#111827" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#6b7280" }}>
        <span>ZMW 0</span>
        <span>Eligible: {zmw(eligible)}</span>
        <span>Requested marker: {zmw(requested)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Eligibility calculation section
// ---------------------------------------------------------------------------

function EligibilitySection({ calc, requested, tenure, rate, maxDTI, minCreditScore, productMax, income, obligations, creditScore, rulesOpen, setRulesOpen, calcOpen, setCalcOpen, recalcFlash }) {
  if (!calc) {
    const missing = [];
    if (creditScore == null) missing.push("Credit score");
    if (obligations == null) missing.push("Liability information");
    if (income == null) missing.push("Income");
    return (
      <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 12, padding: "20px 22px", textAlign: "center" }}>
        <HelpCircle size={22} color="#9ca3af" style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>Prescreening incomplete</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>Missing: {missing.join(", ")}. Fetch or enter these above to run the calculation.</div>
      </div>
    );
  }

  const { eligibleAmount, mandatoryPassed, creditPassed, dtiPassed, customerDTI, maxAffordableMonthly, capacity, affordabilityAmount } = calc;
  const isEligible = mandatoryPassed && eligibleAmount >= requested;
  const isPartial = mandatoryPassed && eligibleAmount < requested;
  const isFailed = !mandatoryPassed;

  return (
    <div>
      {recalcFlash && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 500, color: "#4338ca", background: "#eef2ff", padding: "3px 10px", borderRadius: 20, marginBottom: 12 }}>
          <RefreshCw size={11} /> Recalculated
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11.5, color: "#6b7280" }}>Requested loan</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{zmw(requested)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: "#6b7280" }}>Maximum eligible amount</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: isFailed ? "#9ca3af" : "#111827" }}>{isFailed ? "—" : zmw(eligibleAmount)}</div>
        </div>
      </div>

      {!isFailed && <ComparisonBar requested={requested} eligible={eligibleAmount} productMax={productMax} />}

      {isEligible && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Why this passes</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            <CheckLine ok>Credit score meets minimum requirement</CheckLine>
            <CheckLine ok>Debt-to-income ratio is within the allowed limit</CheckLine>
            <CheckLine ok>Monthly repayment is within the affordability limit</CheckLine>
            <CheckLine ok>Requested amount is within the product and customer limit</CheckLine>
          </ul>
        </div>
      )}

      {isFailed && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Why this fails</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            <CheckLine ok={creditPassed}>Credit score {creditPassed ? "meets" : "is below"} the minimum requirement ({minCreditScore})</CheckLine>
            <CheckLine ok={dtiPassed}>Debt-to-income ratio {dtiPassed ? "is within" : "exceeds"} the allowed limit ({maxDTI}%)</CheckLine>
          </ul>
        </div>
      )}

      {/* Rules table */}
      <button onClick={() => setRulesOpen(!rulesOpen)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#111827", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0", width: "100%", justifyContent: "space-between" }}>
        <span>How was eligibility calculated?</span> {rulesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {rulesOpen && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ background: "#f9fafb" }}>
              <th style={th}>Rule</th><th style={th}>Requirement</th><th style={th}>Customer</th><th style={th}>Result</th>
            </tr></thead>
            <tbody>
              <RuleRow rule="Minimum credit score" req={`≥ ${minCreditScore}`} customer={String(creditScore)} pass={creditPassed} />
              <RuleRow rule="Maximum debt-to-income" req={`≤ ${maxDTI}%`} customer={`${customerDTI.toFixed(0)}%`} pass={dtiPassed} />
              <RuleRow rule="Maximum loan amount" req="Based on affordability" customer={mandatoryPassed ? zmw(eligibleAmount) : "—"} pass={mandatoryPassed} calculated />
              <RuleRow rule="Product maximum" req={`≤ ${zmw(productMax)}`} customer={mandatoryPassed ? zmw(eligibleAmount) : "—"} pass={mandatoryPassed} />
            </tbody>
          </table>
        </div>
      )}

      {/* Calculation breakdown */}
      <button onClick={() => setCalcOpen(!calcOpen)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#111827", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0", width: "100%", justifyContent: "space-between" }}>
        <span>View calculation</span> {calcOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {calcOpen && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "6px 16px" }}>
          <CalcRow label="Monthly income" value={zmw(income)} />
          <CalcRow label="Existing monthly obligations" value={zmw(obligations)} />
          <CalcRow label="Maximum allowed debt ratio" value={`${maxDTI}%`} />
          <CalcRow label="Maximum affordable monthly payment" value={zmw(maxAffordableMonthly)} />
          <CalcRow label="Available repayment capacity" value={zmw(capacity)} />
          <CalcRow label={`Maximum loan amount at ${rate}% over ${tenure} months`} value={zmw(affordabilityAmount)} />
          <CalcRow label="Product maximum" value={zmw(productMax)} />
          <CalcRow label="Final eligible amount" value={mandatoryPassed ? zmw(eligibleAmount) : "Not calculated — mandatory rule failed"} last strong />
        </div>
      )}
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

function MiniStat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: accent ? "#d97706" : "#111827" }}>{value}</div>
    </div>
  );
}

function RuleRow({ rule, req, customer, pass, calculated }) {
  return (
    <tr style={{ borderTop: "1px solid #f3f4f6" }}>
      <td style={td}>{rule}</td>
      <td style={td}>{req}</td>
      <td style={td}>{customer}</td>
      <td style={td}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: pass ? "#15803d" : "#dc2626" }}>
          {calculated ? <><Percent size={11} /> Calculated</> : pass ? <><Check size={11} /> Passed</> : <><X size={11} /> Failed</>}
        </span>
      </td>
    </tr>
  );
}

function CalcRow({ label, value, last, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: last ? "none" : "1px solid #eef0f2", fontSize: 12.5 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

const th = { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#6b7280", fontSize: 11 };
const td = { padding: "8px 12px", color: "#374151" };

// ---------------------------------------------------------------------------
// Overall decision card
// ---------------------------------------------------------------------------

function DecisionCard({ calc, requested, onContinue, onUseEligible, onReview, confirm }) {
  if (!calc) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <HelpCircle size={20} color="#9ca3af" />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Prescreening incomplete</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Resolve the missing data above to reach a decision.</div>
        </div>
      </div>
    );
  }
  const { eligibleAmount, mandatoryPassed } = calc;
  const isEligible = mandatoryPassed && eligibleAmount >= requested;
  const isPartial = mandatoryPassed && eligibleAmount < requested;
  const isFailed = !mandatoryPassed;

  const tone = isEligible ? { bg: "#f0fdf4", border: "#bbf7d0", icon: CheckCircle2, color: "#16a34a", title: "Prescreening passed" }
    : isPartial ? { bg: "#fffbeb", border: "#fde68a", icon: AlertTriangle, color: "#d97706", title: "Amount adjustment required" }
    : { bg: "#fef2f2", border: "#fecaca", icon: XCircle, color: "#dc2626", title: "Prescreening failed" };
  const Icon = tone.icon;

  return (
    <div style={{ background: tone.bg, border: "1.5px solid " + tone.border, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Icon size={20} color={tone.color} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{tone.title}</div>
      </div>

      {isEligible && <p style={{ fontSize: 12.5, color: "#166534", margin: "0 0 14px" }}>The requested amount of {zmw(requested)} is within the customer's eligibility.</p>}
      {isPartial && (
        <>
          <p style={{ fontSize: 12.5, color: "#92400e", margin: "0 0 10px" }}>The requested amount exceeds the customer's current eligibility.</p>
          <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
            <MiniStat label="Requested" value={zmw(requested)} />
            <MiniStat label="Eligible" value={zmw(eligibleAmount)} accent />
          </div>
        </>
      )}
      {isFailed && <p style={{ fontSize: 12.5, color: "#991b1b", margin: "0 0 14px" }}>The customer does not meet one or more mandatory prescreening rules. See the rule breakdown above for details.</p>}

      {confirm && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 12px", marginBottom: 12, fontSize: 12.5 }}>
          <span style={{ flex: 1 }}>Set requested amount to {zmw(eligibleAmount)}?</span>
          <button onClick={() => onUseEligible(true)} style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#111827", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
          <button onClick={() => onUseEligible(false)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {isEligible && (
          <button onClick={onContinue} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9, border: "none", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Continue to enrichment <ArrowRight size={14} />
          </button>
        )}
        {isPartial && !confirm && (
          <>
            <button onClick={() => onReview("useEligible")} style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: "#d97706", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Use {zmw(eligibleAmount)}</button>
            <button onClick={() => onReview("review")} style={{ padding: "10px 16px", borderRadius: 9, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Review application</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reducer for prescreening inputs
// ---------------------------------------------------------------------------

function buildInitialState(scenarioKey) {
  const s = SCENARIOS[scenarioKey];
  return {
    credit: { value: s.credit, source: s.creditSource, status: "idle", manual: s.creditSource === "unavailable", reason: "" },
    liabilities: {
      obligations: s.obligations, activeLoans: s.obligations != null ? 2 : null, outstanding: s.obligations != null ? Math.round(s.obligations * 10) : null,
      source: s.obligationsSource, status: "idle", manual: s.obligationsSource === "unavailable", reason: "",
    },
    income: { value: s.income, source: s.incomeSource, status: "idle", manual: false, reason: "" },
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "fetchCredit":
      return { ...state, credit: { ...state.credit, status: "loading" } };
    case "resolveCreditFetch":
      return { ...state, credit: { ...state.credit, status: "idle", value: action.value, source: action.source } };
    case "manualCredit":
      return { ...state, credit: { ...state.credit, manual: action.on, value: action.on ? state.credit.value : state.credit.value, source: action.on ? "manual" : state.credit.source } };
    case "setCredit":
      return { ...state, credit: { ...state.credit, value: action.value } };
    case "setCreditReason":
      return { ...state, credit: { ...state.credit, reason: action.value } };

    case "fetchLiabilities":
      return { ...state, liabilities: { ...state.liabilities, status: "loading" } };
    case "resolveLiabFetch":
      return { ...state, liabilities: { ...state.liabilities, status: "idle", obligations: action.obligations, activeLoans: action.activeLoans, outstanding: action.outstanding, source: action.source } };
    case "manualLiabilities":
      return { ...state, liabilities: { ...state.liabilities, manual: action.on, source: action.on ? "manual" : state.liabilities.source } };
    case "setObligations":
      return { ...state, liabilities: { ...state.liabilities, obligations: action.value } };
    case "setLiabReason":
      return { ...state, liabilities: { ...state.liabilities, reason: action.value } };

    case "fetchIncome":
      return { ...state, income: { ...state.income, status: "loading" } };
    case "resolveIncomeFetch":
      return { ...state, income: { ...state.income, status: "idle", value: action.value, source: action.source } };
    case "manualIncome":
      return { ...state, income: { ...state.income, manual: action.on, source: action.on ? "manual" : state.income.source } };
    case "setIncome":
      return { ...state, income: { ...state.income, value: action.value } };
    case "setIncomeReason":
      return { ...state, income: { ...state.income, reason: action.value } };

    case "reset":
      return buildInitialState(action.scenario);
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Prescreening workspace
// ---------------------------------------------------------------------------

function PrescreeningWorkspace() {
  const policy = POLICY[APPLICATION.loan.typeId];
  const [state, dispatchRaw] = useState(() => buildInitialState(DEFAULT_SCENARIO));
  const [requested, setRequested] = useState(APPLICATION.loan.amount);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [continued, setContinued] = useState(false);

  function dispatch(action) {
    dispatchRaw((s) => reducer(s, action));
  }

  // simulate credit fetch resolving
  useEffect(() => {
    if (state.credit.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({ type: "resolveCreditFetch", value: s.credit, source: s.creditSource });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.credit.status]);

  useEffect(() => {
    if (state.liabilities.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({ type: "resolveLiabFetch", obligations: s.obligations, activeLoans: s.obligations != null ? 2 : null, outstanding: s.obligations != null ? Math.round(s.obligations * 10) : null, source: s.obligationsSource });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.liabilities.status]);

  useEffect(() => {
    if (state.income.status === "loading") {
      const t = setTimeout(() => {
        const s = SCENARIOS[DEFAULT_SCENARIO];
        dispatch({ type: "resolveIncomeFetch", value: s.income, source: s.incomeSource });
      }, 700);
      return () => clearTimeout(t);
    }
  }, [state.income.status]);

  const calc = useMemo(() => {
    if (state.credit.status === "loading" || state.liabilities.status === "loading" || state.income.status === "loading") return null;
    return calcEligibility({
      income: state.income.value, obligations: state.liabilities.obligations, maxDTI: policy.maxDTI,
      annualRate: APPLICATION.loan.rate, tenureMonths: APPLICATION.loan.tenure, productMax: policy.productMax,
      creditScore: state.credit.value, minCreditScore: policy.minCreditScore,
    });
  }, [state.credit.value, state.credit.status, state.liabilities.obligations, state.liabilities.status, state.income.value, state.income.status]);

  const prevCalc = useRef(calc);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (calc && prevCalc.current && JSON.stringify(calc) !== JSON.stringify(prevCalc.current)) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1400);
      prevCalc.current = calc;
      return () => clearTimeout(t);
    }
    prevCalc.current = calc;
  }, [calc]);

  function handleUseEligible(confirmed) {
    if (confirmed) {
      setRequested(Math.round(calc.eligibleAmount));
    }
    setConfirm(false);
  }

  if (continued) {
    return (
      <div style={{ padding: "60px 30px", textAlign: "center" }}>
        <CheckCircle2 size={32} color="#16a34a" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827" }}>Moving to Stage 3 — Enrichment</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 6 }}>Requested amount confirmed at {zmw(requested)}.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 30px", maxWidth: 820 }}>
      <SectionLabel>Prescreening data</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 26 }}>
        <CreditScoreCard state={state} dispatch={dispatch} />
        <LiabilitiesCard state={state} dispatch={dispatch} />
        <IncomeCard state={state} dispatch={dispatch} />
      </div>

      <SectionLabel>Eligibility calculation</SectionLabel>
      <EligibilitySection
        calc={calc} requested={requested} tenure={APPLICATION.loan.tenure} rate={APPLICATION.loan.rate}
        maxDTI={policy.maxDTI} minCreditScore={policy.minCreditScore} productMax={policy.productMax}
        income={state.income.value} obligations={state.liabilities.obligations} creditScore={state.credit.value}
        rulesOpen={rulesOpen} setRulesOpen={setRulesOpen} calcOpen={calcOpen} setCalcOpen={setCalcOpen}
        recalcFlash={flash}
      />

      <div style={{ marginTop: 26 }}>
        <SectionLabel>Prescreening result</SectionLabel>
        <DecisionCard calc={calc} requested={requested} onContinue={() => setContinued(true)} onUseEligible={handleUseEligible} onReview={(a) => a === "useEligible" && setConfirm(true)} confirm={confirm} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PrescreeningStage() {
  const [section, setSection] = useState("prescreening");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6", minHeight: "100vh", padding: "28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1080, background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#4f46e5", padding: "16px 26px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Loan application workflow</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>Stage 2 — Prescreening</div>
          </div>
        </div>

        <ContextHeader />

        <div style={{ display: "flex", alignItems: "stretch", minHeight: 560 }}>
          <LeftNav section={section} setSection={setSection} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {section === "application" ? (
              <LoanApplicationReview onBack={() => {}} />
            ) : (
              <div style={{ maxHeight: 640, overflowY: "auto" }}>
                <PrescreeningWorkspace />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}