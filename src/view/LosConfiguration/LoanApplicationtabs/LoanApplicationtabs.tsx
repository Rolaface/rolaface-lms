import React, { useState, useMemo } from "react";
import {
  IconFileText as FileText,
  IconGauge as Gauge,
  IconBuildingBank as Landmark,
  IconWallet as Wallet,
  IconPercentage as Percent,
  IconShieldCheck as ShieldCheck,
  IconScale as Scale,
  IconClipboardList as ClipboardList,
  IconCheck as Check,
  IconX as X,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconChevronRight as ChevronRight,
  IconArrowRight as ArrowRight,
  IconInfoCircle as Info,
  IconAlertTriangle as AlertTriangle,
  IconAlertCircle as AlertCircle,
  IconCircleCheck as CheckCircle2,
  IconCircleX as XCircle,
  IconHelp as HelpCircle,
  IconPaperclip as Paperclip,
  IconCamera as Camera,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Mock data — everything Stage 1–3 already produced (now frozen)
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
  collateral: { type: "Motor vehicle", description: "2019 Toyota Hilux D/Cab, registration ABC 1234 ZM", value: 95000 },
};

const POLICY = { personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 } };
const PRESCREENING_DATA = { credit: { value: 742, source: "bureau" }, liabilities: { obligations: 3850, activeLoans: 2, outstanding: 38500, source: "bureau" }, income: { value: 13100, source: "hrms" } };

const ASSET_TYPES = ["Motor vehicle", "Landed property", "Equipment", "Fixed deposit", "Other"];

const CHECKS_POLICY = {
  "Motor vehicle": [
    { id: "title-auth", name: "Title authenticity", defaultStatus: "Passed", finding: "Registration certificate verified against the national vehicle registry." },
    { id: "ownership", name: "Ownership verification", defaultStatus: "Passed", finding: "Registered owner matches the applicant." },
    { id: "encumbrance", name: "Existing encumbrance check", defaultStatus: "Exception", finding: "Existing charge identified against the vehicle with a third-party financier.",
      why: "A registered encumbrance means the lender does not hold first claim on the asset until it is released.", action: "Obtain a discharge / clearance letter from the existing financier before disbursement." },
    { id: "litigation", name: "Litigation check", defaultStatus: "Passed", finding: "No active litigation found against the asset or owner." },
    { id: "regulatory", name: "Regulatory check", defaultStatus: "Passed", finding: "Vehicle meets regulatory and roadworthiness requirements on file." },
    { id: "search", name: "Search report verification", defaultStatus: "Passed", finding: "Search report obtained from the Road Transport and Safety Agency." },
  ],
};
const GENERIC_CHECKS = [
  { id: "title-auth", name: "Title authenticity" }, { id: "ownership", name: "Ownership verification" },
  { id: "encumbrance", name: "Existing encumbrance check" }, { id: "litigation", name: "Litigation check" },
  { id: "regulatory", name: "Regulatory check" }, { id: "search", name: "Search report verification" },
];
function getApplicableChecks(type) {
  const configured = CHECKS_POLICY[type];
  if (configured) return configured;
  return GENERIC_CHECKS.map((c) => ({ ...c, defaultStatus: "Pending", finding: "", why: "", action: "" }));
}

let assetSeq = 1;
function makeAsset({ source, base }) {
  const id = "asset-" + assetSeq++;
  return {
    id, source, base,
    valuation: { amount: "", currency: "ZMW", method: "Market comparison", marketValue: "", forcedSaleValue: "", notes: "" },
    valuer: { name: "", company: "", license: "", contact: "", verified: false },
    valuationDate: "", expiryDays: 180, status: "Pending", reason: "",
    docs: [
      { name: "Valuation report", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Asset photos", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
      { name: "Ownership document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
    ],
    title: { titleNumber: "", propertyRef: base.assetId || "", propertyType: base.type, location: base.location || "", registrationInfo: "", registeredOwner: base.owner || "" },
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
    legalChecks: getApplicableChecks(base.type).map((c) => ({ ...c, status: c.defaultStatus, comment: "" })),
  };
}

// The asset captured on the original application, pre-reviewed for a realistic default state
const SEED_ASSET_1 = {
  ...makeAsset({
    source: "application",
    base: { type: "Motor vehicle", description: "2019 Toyota Hilux D/Cab, registration ABC 1234 ZM", assetId: "AST-33021", location: "Lusaka, Zambia", owner: "Chanda Mwansa", acquisition: "Purchased 2019 · dealer invoice on file" },
  }),
  docs: [
    { name: "Valuation report", tier: "required", status: "Verified", uploadedDate: "3 Sep 2026", uploadedBy: "Field valuer", comment: "" },
    { name: "Asset photos", tier: "required", status: "Verified", uploadedDate: "3 Sep 2026", uploadedBy: "Field valuer", comment: "" },
    { name: "Ownership document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
  ],
  title: { titleNumber: "MV-ZM-119284", propertyRef: "AST-33021", propertyType: "Motor vehicle", location: "Lusaka, Zambia", registrationInfo: "Registered with RTSA, Lusaka", registeredOwner: "Chanda Mwansa" },
  titleChecklist: [
    { id: "titleVerified", label: "Title verified", status: "Passed", comment: "" },
    { id: "ownershipVerified", label: "Ownership verified", status: "Passed", comment: "" },
    { id: "encumbrances", label: "Encumbrances checked", status: "Exception", comment: "" },
    { id: "liens", label: "Existing liens checked", status: "Passed", comment: "" },
    { id: "restrictions", label: "Restrictions checked", status: "Passed", comment: "" },
  ],
  titleDocs: [
    { name: "Title deed / ownership document", tier: "required", status: "Verified", uploadedDate: "4 Sep 2026", uploadedBy: "Legal officer", comment: "" },
    { name: "Search report", tier: "required", status: "Verified", uploadedDate: "4 Sep 2026", uploadedBy: "Legal officer", comment: "" },
    { name: "Legal opinion", tier: "optional", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const zmw = (n) => (n == null || n === "" ? "—" : "ZMW " + Math.round(n).toLocaleString());

function computeSimulation(amount, tenure, rate, frequency, feePct = 0) {
  const nPeriods = frequency === "Bi-weekly" ? Math.round((tenure / 12) * 26) : tenure;
  const periodsPerYear = frequency === "Bi-weekly" ? 26 : 12;
  const periodicRate = rate / 100 / periodsPerYear;
  let installment;
  if (periodicRate > 0) installment = (amount * periodicRate * Math.pow(1 + periodicRate, nPeriods)) / (Math.pow(1 + periodicRate, nPeriods) - 1);
  else installment = amount / nPeriods;
  const totalRepayment = installment * nPeriods;
  const totalInterest = totalRepayment - amount;
  return { installment, totalRepayment, totalInterest, nPeriods };
}

function calcEligibility({ income, obligations, maxDTI, annualRate, tenureMonths, productMax, creditScore, minCreditScore }) {
  const customerDTI = income > 0 ? (obligations / income) * 100 : 100;
  const creditPassed = creditScore >= minCreditScore;
  const dtiPassed = customerDTI <= maxDTI;
  const maxAffordableMonthly = income * (maxDTI / 100);
  const capacity = Math.max(0, maxAffordableMonthly - obligations);
  const r = annualRate / 100 / 12;
  const affordabilityAmount = r > 0 ? capacity * ((1 - Math.pow(1 + r, -tenureMonths)) / r) : capacity * tenureMonths;
  const eligibleAmount = creditPassed && dtiPassed ? Math.min(affordabilityAmount, productMax) : 0;
  return { eligibleAmount, mandatoryPassed: creditPassed && dtiPassed };
}

const POL = POLICY[APPLICATION.loan.typeId];
const PRESCREENING_CALC = calcEligibility({
  income: PRESCREENING_DATA.income.value, obligations: PRESCREENING_DATA.liabilities.obligations, maxDTI: POL.maxDTI,
  annualRate: APPLICATION.loan.rate, tenureMonths: APPLICATION.loan.tenure, productMax: POL.productMax,
  creditScore: PRESCREENING_DATA.credit.value, minCreditScore: POL.minCreditScore,
});
const APPROVED_AMOUNT = Math.round(PRESCREENING_CALC.eligibleAmount);

const FINAL_TERMS = { amount: APPROVED_AMOUNT, rate: 25, tenure: 24, frequency: "Monthly", processingFeePct: 2, insurancePct: 1, taxPct: 16 };
const FINAL_SIM = computeSimulation(FINAL_TERMS.amount, FINAL_TERMS.tenure, FINAL_TERMS.rate, FINAL_TERMS.frequency);
const FINAL_FEES = (() => {
  const processingFee = FINAL_TERMS.amount * (FINAL_TERMS.processingFeePct / 100);
  const insurance = FINAL_TERMS.amount * (FINAL_TERMS.insurancePct / 100);
  const tax = (processingFee + insurance) * (FINAL_TERMS.taxPct / 100);
  const netCharges = processingFee + insurance + tax;
  return { processingFee, insurance, tax, netCharges, netDisbursement: FINAL_TERMS.amount - netCharges };
})();

// ---------------------------------------------------------------------------
// Status styling
// ---------------------------------------------------------------------------

const STATUS_STYLES = {
  Pending: { bg: "#f3f4f6", color: "#6b7280" },
  "In Progress": { bg: "#eef2ff", color: "#4338ca" },
  Passed: { bg: "#f0fdf4", color: "#15803d" },
  Failed: { bg: "#fef2f2", color: "#dc2626" },
  Exception: { bg: "#fffbeb", color: "#d97706" },
};
const CHECK_STATUSES = ["Pending", "In Progress", "Passed", "Failed", "Exception"];
const DOC_STATUSES = ["Missing", "Uploaded", "Verified", "Rejected"];
const DOC_STATUS_STYLES = { Missing: { bg: "#f3f4f6", color: "#6b7280" }, Uploaded: { bg: "#eef2ff", color: "#4338ca" }, Verified: { bg: "#f0fdf4", color: "#15803d" }, Rejected: { bg: "#fef2f2", color: "#dc2626" } };

function StatusPill({ status, styles }) {
  const s = (styles || STATUS_STYLES)[status] || STATUS_STYLES.Pending;
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 20 }}>{status}</span>;
}

function StatusSelect({ value, onChange, options }) {
  const s = STATUS_STYLES[value] || STATUS_STYLES.Pending;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 11.5, fontWeight: 600, color: s.color, background: s.bg, border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer" }}>
      {(options || CHECK_STATUSES).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SourceBadge({ source }) {
  const map = { bureau: { label: "Credit bureau", color: "#4338ca", bg: "#eef2ff" }, hrms: { label: "HRMS", color: "#4338ca", bg: "#eef2ff" }, application: { label: "From application", color: "#0f766e", bg: "#ecfdf5" } };
  const s = map[source] || map.application;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />{s.label}</span>;
}
function FieldError({ children }) {
  return <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, fontSize: 12.5, color: "#dc2626" }}><AlertCircle size={13} style={{ marginTop: 1.5, flexShrink: 0 }} /><span>{children}</span></div>;
}
function ReadRow({ label, value, span }) {
  return <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}><div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 3 }}>{label}</div><div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{value ?? "—"}</div></div>;
}
function SectionLabel({ children, right }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.3, textTransform: "uppercase" }}>{children}</div>{right}</div>;
}
function SimRow({ label, value, last, strong }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : "1px solid #f3f4f6", fontSize: 13 }}><span style={{ color: "#6b7280" }}>{label}</span><span style={{ fontWeight: strong ? 700 : 600, color: "#111827" }}>{value}</span></div>;
}
function MiniStat({ label, value, accent }) {
  return <div><div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div><div style={{ fontSize: 16, fontWeight: 700, color: accent ? "#d97706" : "#111827" }}>{value}</div></div>;
}
function TextInput({ label, value, onChange, placeholder, suffix, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        {suffix && <span style={{ position: "absolute", right: 11, top: 9, fontSize: 12, color: "#9ca3af" }}>{suffix}</span>}
      </div>
    </div>
  );
}
function SelectInput({ label, value, onChange, options, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2}
        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
    </div>
  );
}

const th = { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#6b7280", fontSize: 11 };
const td = { padding: "8px 12px", color: "#374151" };

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

function DocumentsTable({ title, docs, setDocs }) {
  const update = (i, patch) => setDocs(docs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDoc = () => setDocs([...docs, { name: "New document", tier: "required", status: "Missing", uploadedDate: "", uploadedBy: "", comment: "" }]);
  const removeDoc = (i) => setDocs(docs.filter((_, idx) => idx !== i));
  return (
    <div>
      <SectionLabel right={<button onClick={addDoc} style={{ fontSize: 11.5, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>+ Add document</button>}>{title}</SectionLabel>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {docs.length === 0 && <div style={{ padding: "16px", fontSize: 12.5, color: "#9ca3af", textAlign: "center" }}>No documents added yet.</div>}
        {docs.map((d, i) => (
          <div key={i} style={{ padding: "12px 16px", borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <FileText size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input value={d.name} onChange={(e) => update(i, { name: e.target.value })} style={{ fontSize: 12.5, fontWeight: 500, color: "#111827", border: "none", background: "transparent", width: "100%", padding: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <select value={d.tier} onChange={(e) => update(i, { tier: e.target.value })} style={{ fontSize: 10.5, color: "#9ca3af", border: "none", background: "transparent", padding: 0 }}>
                      <option value="required">required</option><option value="optional">optional</option>
                    </select>
                    <span style={{ fontSize: 10.5, color: "#9ca3af" }}>· uploaded {d.uploadedDate || "—"} by {d.uploadedBy || "—"}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button style={{ fontSize: 11.5, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>Preview</button>
                <select value={d.status} onChange={(e) => update(i, { status: e.target.value })}
                  style={{ fontSize: 11.5, fontWeight: 600, color: DOC_STATUS_STYLES[d.status].color, background: DOC_STATUS_STYLES[d.status].bg, border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer" }}>
                  {DOC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => removeDoc(i)} style={{ border: "none", background: "transparent", color: "#c4c9d2", cursor: "pointer", padding: 2 }}><X size={14} /></button>
              </div>
            </div>
            <input value={d.comment || ""} onChange={(e) => update(i, { comment: e.target.value })} placeholder="Verification comment (optional)"
              style={{ width: "100%", marginTop: 8, padding: "6px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 11.5, boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Underwriting Readiness
// ---------------------------------------------------------------------------

function ReadinessRow({ label, ok, note }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 12.5, color: "#374151" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: ok ? "#15803d" : "#d97706" }}>
        {ok ? <Check size={13} /> : <AlertTriangle size={13} />} {note}
      </span>
    </div>
  );
}

function ReadinessPanel({ readiness }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
      <SectionLabel>Underwriting readiness</SectionLabel>
      <ReadinessRow label="Asset valuation" ok={readiness.valuationOk} note={readiness.valuationOk ? "Completed" : "Not completed"} />
      <ReadinessRow label="Title verification" ok={readiness.titleOk} note={readiness.titleOk ? "Completed" : "Unresolved item(s)"} />
      <ReadinessRow label="Legal checks" ok={readiness.legalOk} note={readiness.legalOk ? "Completed" : "Unresolved item(s)"} />
      <div style={{ borderBottom: "none" }}><ReadinessRow label="Supporting documents" ok={readiness.docsOk} note={readiness.docsOk ? "Complete" : "Missing required document(s)"} /></div>

      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 9, background: readiness.ready ? "#f0fdf4" : "#fffbeb", border: "1px solid " + (readiness.ready ? "#bbf7d0" : "#fde68a") }}>
        {readiness.ready ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#15803d" }}><CheckCircle2 size={14} /> Ready for decision</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#92400e", marginBottom: 4 }}><AlertTriangle size={14} /> Not ready for decision</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#92400e" }}>
              {readiness.blockers.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UnderwritingStage() {
  const [section, setSection] = useState("underwriting");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6", minHeight: "100vh", padding: "28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1120, background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#4f46e5", padding: "16px 26px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Loan application workflow</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>Stage 4 — Underwriting</div>
          </div>
        </div>

        <ContextHeader />

        <div style={{ display: "flex", alignItems: "stretch", minHeight: 560 }}>
          <LeftNav section={section} setSection={setSection} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {section === "application" && <LoanApplicationReview />}
            {section === "prescreening" && <PrescreeningReview />}
            {section === "enrichment" && <EnrichmentReview />}
            {section === "underwriting" && <UnderwritingWorkspace />}
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 10.5, color: "#9ca3af" }}>Final amount</div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{zmw(FINAL_TERMS.amount)}</div></div>
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
  ];
  return (
    <div style={{ width: 216, flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", padding: "18px 12px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", padding: "0 10px", marginBottom: 10 }}>Stage 4 of 5</div>
      {items.map((it) => {
        const active = section === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setSection(it.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 4, borderRadius: 9, border: "none", background: active ? "#eef2ff" : "transparent", color: active ? "#4338ca" : "#374151", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
            <Icon size={16} />
            {it.label}
            {it.id !== "underwriting" && <Check size={13} style={{ marginLeft: "auto", color: active ? "#4338ca" : "#16a34a" }} />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — Loan application (read-only)
// ---------------------------------------------------------------------------

const APP_TABS = [
  { id: "customer", label: "Customer & loan" }, { id: "personal", label: "Personal details" },
  { id: "collateral", label: "Collateral" }, { id: "documents", label: "Documents" }, { id: "employment", label: "Employment" },
];

function ReadOnlyTabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 20px", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
      {tabs.map((t, i) => {
        const isActive = t.id === active;
        return (
          <React.Fragment key={t.id}>
            {i > 0 && <ChevronRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />}
            <button onClick={() => onSelect(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "none", background: isActive ? "#eef2ff" : "transparent", color: isActive ? "#4338ca" : "#374151", fontSize: 12.5, fontWeight: isActive ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#4f46e5", color: "#fff", flexShrink: 0 }}><Check size={11} /></span>
              {t.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LockedBanner({ text }) {
  return (
    <div style={{ padding: "12px 26px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "9px 14px" }}>
        <Info size={14} style={{ color: "#4f46e5", marginTop: 1.5, flexShrink: 0 }} />
        <div style={{ fontSize: 12.5, color: "#3730a3" }}>{text}</div>
      </div>
    </div>
  );
}

function LoanApplicationReview() {
  const { customer, loan, documents, employment, collateral } = APPLICATION;
  const [appTab, setAppTab] = useState("customer");
  return (
    <div>
      <LockedBanner text="Submitted application data — read-only at this stage." />
      <div style={{ marginTop: 12 }}><ReadOnlyTabBar tabs={APP_TABS} active={appTab} onSelect={setAppTab} /></div>
      <div style={{ padding: "22px 26px", maxHeight: 480, overflowY: "auto" }}>
        {appTab === "customer" && (
          <>
            <SectionLabel>Customer</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
              <ReadRow label="Customer name" value={customer.name} /><ReadRow label="Customer type" value={customer.type} />
              <ReadRow label="Customer ID" value={customer.id} /><ReadRow label="Segment" value={customer.segment} />
            </div>
            <SectionLabel>Loan</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Loan product" value={loan.product} /><ReadRow label="Purpose" value={loan.purpose} />
              <ReadRow label="Requested amount" value={zmw(loan.amount)} /><ReadRow label="Tenure" value={`${loan.tenure} months`} />
            </div>
          </>
        )}
        {appTab === "personal" && (
          <>
            <SectionLabel>Personal details</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Full name" value={customer.name} /><ReadRow label="National ID" value={customer.nrc} />
              <ReadRow label="Date of birth" value={customer.dob} /><ReadRow label="Address" value={customer.address} />
            </div>
          </>
        )}
        {appTab === "collateral" && (
          <>
            <SectionLabel>Collateral</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <ReadRow label="Type" value={collateral.type} /><ReadRow label="Estimated value" value={zmw(collateral.value)} />
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
                  <span style={{ color: "#374151" }}>{d.name}</span>
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
              <ReadRow label="Employer" value={employment.employer} /><ReadRow label="Monthly income" value={zmw(employment.monthlyIncome)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Prescreening (read-only)
// ---------------------------------------------------------------------------

function PrescreeningReview() {
  const requested = APPLICATION.loan.amount;
  const isPartial = PRESCREENING_CALC.mandatoryPassed && PRESCREENING_CALC.eligibleAmount < requested;
  return (
    <div>
      <LockedBanner text="Prescreening decision is locked — read-only at this stage." />
      <div style={{ padding: "22px 26px", maxHeight: 480, overflowY: "auto" }}>
        <SectionLabel>Prescreening data</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Credit score</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{PRESCREENING_DATA.credit.value}</div>
            <div style={{ marginTop: 6 }}><SourceBadge source="bureau" /></div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Existing liabilities</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{zmw(PRESCREENING_DATA.liabilities.obligations)}<span style={{ fontSize: 11, color: "#9ca3af" }}> /mo</span></div>
            <div style={{ marginTop: 6 }}><SourceBadge source="bureau" /></div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Monthly income</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{zmw(PRESCREENING_DATA.income.value)}</div>
            <div style={{ marginTop: 6 }}><SourceBadge source="hrms" /></div>
          </div>
        </div>

        <SectionLabel>Decision</SectionLabel>
        <div style={{ background: isPartial ? "#fffbeb" : "#f0fdf4", border: "1.5px solid " + (isPartial ? "#fde68a" : "#bbf7d0"), borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {isPartial ? <AlertTriangle size={18} color="#d97706" /> : <CheckCircle2 size={18} color="#16a34a" />}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{isPartial ? "Amount adjusted at prescreening" : "Prescreening passed"}</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <MiniStat label="Requested" value={zmw(requested)} />
            <MiniStat label="Approved" value={zmw(APPROVED_AMOUNT)} accent={isPartial} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — Enrichment (read-only)
// ---------------------------------------------------------------------------

function EnrichmentReview() {
  return (
    <div>
      <LockedBanner text="Final commercial terms are locked — read-only at this stage." />
      <div style={{ padding: "22px 26px", maxHeight: 480, overflowY: "auto" }}>
        <SectionLabel>Final loan terms</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
          <MiniStat label="Amount" value={zmw(FINAL_TERMS.amount)} />
          <MiniStat label="Rate" value={`${FINAL_TERMS.rate}% p.a.`} />
          <MiniStat label="Tenure" value={`${FINAL_TERMS.tenure} months`} />
        </div>
        <SectionLabel>Charges and repayment</SectionLabel>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 16px" }}>
          <SimRow label="Processing fee" value={zmw(FINAL_FEES.processingFee)} />
          <SimRow label="Insurance" value={zmw(FINAL_FEES.insurance)} />
          <SimRow label="Tax on fees" value={zmw(FINAL_FEES.tax)} />
          <SimRow label="Net disbursement" value={zmw(FINAL_FEES.netDisbursement)} />
          <SimRow label="Estimated installment" value={zmw(FINAL_SIM.installment)} />
          <SimRow label="Total repayment" value={zmw(FINAL_SIM.totalRepayment)} last strong />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 4 — Underwriting workspace (active)
// ---------------------------------------------------------------------------


const UW_TABS = [
  { id: "asset", label: "Asset valuation", icon: Camera },
  { id: "title", label: "Legal / title verification", icon: ShieldCheck },
  { id: "checks", label: "Legal checks", icon: ClipboardList },
];

function AssetSwitcher({ assets, selectedId, onSelect, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState(ASSET_TYPES[0]);
  const [newDesc, setNewDesc] = useState("");

  function submit() {
    if (!newDesc.trim()) return;
    onAdd({ type: newType, description: newDesc, assetId: "", location: "", owner: APPLICATION.customer.name, acquisition: "" });
    setNewDesc(""); setAdding(false);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <SectionLabel>Assets offered as security ({assets.length})</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: adding ? 10 : 0 }}>
        {assets.map((a, i) => {
          const active = a.id === selectedId;
          const worst = ["Failed", "Exception"].includes(a.status) ? a.status : a.status;
          return (
            <button key={a.id} onClick={() => onSelect(a.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: "1.5px solid " + (active ? "#4f46e5" : "#e5e7eb"), background: active ? "#eef2ff" : "#fff", cursor: "pointer" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? "#4338ca" : "#111827" }}>Asset {i + 1}: {a.base.description.slice(0, 28)}{a.base.description.length > 28 ? "…" : ""}</span>
              <StatusPill status={a.status} />
            </button>
          );
        })}
        <button onClick={() => setAdding(!adding)} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "#fff", border: "1.5px dashed #c7d2fe", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>+ Add asset</button>
      </div>
      {adding && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ width: 180 }}><SelectInput label="Asset type" value={newType} onChange={setNewType} options={ASSET_TYPES} /></div>
          <div style={{ flex: 1 }}><TextInput label="Description" value={newDesc} onChange={setNewDesc} placeholder="e.g. Stand 4521, Kabwata, Lusaka" /></div>
          <button onClick={submit} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Add</button>
          <button onClick={() => setAdding(false)} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 12.5, cursor: "pointer" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function UnderwritingWorkspace() {
  const [tab, setTab] = useState("asset");
  const [assets, setAssets] = useState([SEED_ASSET_1]);
  const [selectedId, setSelectedId] = useState(SEED_ASSET_1.id);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [completed, setCompleted] = useState(false);

  const selected = assets.find((a) => a.id === selectedId) || assets[0];

  function updateAsset(id, patch) { setAssets(assets.map((a) => (a.id === id ? { ...a, ...patch } : a))); }
  function updateSelected(patch) { updateAsset(selected.id, patch); }
  function addAsset(base) {
    const a = makeAsset({ source: "manual", base });
    setAssets([...assets, a]);
    setSelectedId(a.id);
  }
  function updateChecklist(assetId, itemId, patch) {
    updateAsset(assetId, { titleChecklist: assets.find((a) => a.id === assetId).titleChecklist.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  }
  function updateLegalCheck(assetId, checkId, patch) {
    updateAsset(assetId, { legalChecks: assets.find((a) => a.id === assetId).legalChecks.map((c) => (c.id === checkId ? { ...c, ...patch } : c)) });
  }
  function addCondition() { setConditions([...conditions, { condition: "", responsible: "Customer", dueBefore: "Disbursement" }]); }
  function updateCondition(i, patch) { setConditions(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c))); }
  function removeCondition(i) { setConditions(conditions.filter((_, idx) => idx !== i)); }

  const ownershipMatches = selected.title.registeredOwner.trim().toLowerCase() === APPLICATION.customer.name.trim().toLowerCase();
  const coverage = selected.valuation.amount ? Math.round((Number(selected.valuation.amount) / FINAL_TERMS.amount) * 100) : null;
  const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.valuation.amount) || 0), 0);
  const totalCoverage = totalAssetValue ? Math.round((totalAssetValue / FINAL_TERMS.amount) * 100) : null;

  // --- Readiness across all assets ---
  const readiness = useMemo(() => {
    let blockers = [];
    let valuationOk = true, titleOk = true, legalOk = true, docsOk = true;

    assets.forEach((a, i) => {
      const label = `Asset ${i + 1}`;
      const aValuationOk = a.status === "Passed" || (["Failed", "Exception"].includes(a.status) && a.reason.trim());
      if (!aValuationOk) { valuationOk = false; blockers.push(`${label}: valuation status has not been finalized.`); }

      const titleUnresolved = a.titleChecklist.filter((i2) => i2.status === "Pending" || i2.status === "In Progress" || (["Failed", "Exception"].includes(i2.status) && !i2.comment.trim()));
      if (titleUnresolved.length) { titleOk = false; blockers.push(`${label}: title verification has ${titleUnresolved.length} unresolved item(s) — ${titleUnresolved.map((i2) => i2.label).join(", ")}.`); }

      const legalUnresolved = a.legalChecks.filter((c) => ["Failed", "Exception"].includes(c.status) && !c.comment.trim());
      if (legalUnresolved.length) { legalOk = false; blockers.push(`${label}: legal checks have ${legalUnresolved.length} unresolved exception/failure — ${legalUnresolved.map((c) => c.name).join(", ")}.`); }

      const requiredDocs = [...a.docs, ...a.titleDocs].filter((d) => d.tier === "required");
      const missingDocs = requiredDocs.filter((d) => d.status !== "Verified");
      if (missingDocs.length) { docsOk = false; blockers.push(`${label}: ${missingDocs.length} required document(s) not yet verified — ${missingDocs.map((d) => d.name).join(", ")}.`); }
    });

    return { valuationOk, titleOk, legalOk, docsOk, ready: valuationOk && titleOk && legalOk && docsOk, blockers };
  }, [assets]);

  const anyTouched = assets.some((a) => a.status !== "Pending" || a.titleChecklist.some((i) => i.status !== "Pending") || a.legalChecks.some((c) => c.comment));
  const overallStatus = completed ? "Completed" : readiness.ready ? "Ready for Decision" : anyTouched ? "In Progress" : "Not Started";

  const allLegalChecks = assets.flatMap((a) => a.legalChecks);
  const legalCounts = { passed: allLegalChecks.filter((c) => c.status === "Passed").length, exception: allLegalChecks.filter((c) => c.status === "Exception").length, failed: allLegalChecks.filter((c) => c.status === "Failed").length };

  const decisionReady = decision === "approve" || (decision === "conditions" && conditions.length > 0 && conditions.every((c) => c.condition.trim()))
    || ((decision === "refer" || decision === "reject") && reasonCategory);

  if (completed) {
    return (
      <div style={{ padding: "60px 30px", textAlign: "center" }}>
        <CheckCircle2 size={32} color="#16a34a" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827" }}>Underwriting completed</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 6 }}>
          Decision: {DECISION_LABEL[decision]}{decision === "conditions" ? ` · ${conditions.length} condition(s)` : ""}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "22px 30px 30px", maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Underwriting workspace</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Review security, verify title, and complete legal checks before a consolidated decision.</div>
        </div>
        <StatusPill status={overallStatus} styles={{ "Not Started": { bg: "#f3f4f6", color: "#6b7280" }, "In Progress": { bg: "#eef2ff", color: "#4338ca" }, "Ready for Decision": { bg: "#fffbeb", color: "#d97706" }, Completed: { bg: "#f0fdf4", color: "#15803d" } }} />
      </div>

      <ReadinessPanel readiness={readiness} />

      <AssetSwitcher assets={assets} selectedId={selected.id} onSelect={setSelectedId} onAdd={addAsset} />

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 22, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {UW_TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 16px", border: "none", borderBottom: active ? "2px solid #4f46e5" : "2px solid transparent", background: "transparent", color: active ? "#4338ca" : "#6b7280", fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: "pointer" }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "20px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#4338ca", marginBottom: 16 }}>Reviewing: {selected.base.description}</div>

          {tab === "asset" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <SectionLabel right={<SourceBadge source={selected.source === "application" ? "application" : "manual"} />}>Asset details</SectionLabel>
                {selected.source === "application" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
                    <ReadRow label="Asset type" value={selected.base.type} /><ReadRow label="Asset ID" value={selected.base.assetId} />
                    <ReadRow label="Location" value={selected.base.location} /><ReadRow label="Owner" value={selected.base.owner} />
                    <ReadRow label="Description" value={selected.base.description} span={2} />
                    <ReadRow label="Acquisition information" value={selected.base.acquisition} span={2} />
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
                    <SelectInput label="Asset type" value={selected.base.type} onChange={(v) => updateSelected({ base: { ...selected.base, type: v } })} options={ASSET_TYPES} />
                    <TextInput label="Asset ID / reference" value={selected.base.assetId} onChange={(v) => updateSelected({ base: { ...selected.base, assetId: v } })} placeholder="e.g. AST-33022" />
                    <TextInput label="Location" value={selected.base.location} onChange={(v) => updateSelected({ base: { ...selected.base, location: v } })} placeholder="e.g. Lusaka, Zambia" />
                    <TextInput label="Owner" value={selected.base.owner} onChange={(v) => updateSelected({ base: { ...selected.base, owner: v } })} />
                    <TextInput label="Description" value={selected.base.description} onChange={(v) => updateSelected({ base: { ...selected.base, description: v } })} span={2} />
                    <TextInput label="Acquisition / value information" value={selected.base.acquisition} onChange={(v) => updateSelected({ base: { ...selected.base, acquisition: v } })} span={2} />
                  </div>
                )}
              </div>

              <div>
                <SectionLabel right={<span style={{ fontSize: 10.5, fontWeight: 600, color: "#c2410c", background: "#fff7ed", padding: "3px 9px", borderRadius: 20 }}>Underwriter verified</span>}>Valuation</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <TextInput label="Valuation amount" value={selected.valuation.amount} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, amount: v } })} placeholder="e.g. 95000" suffix="ZMW" />
                  <SelectInput label="Valuation method" value={selected.valuation.method} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, method: v } })} options={["Market comparison", "Cost approach", "Income approach"]} />
                  <TextInput label="Market value" value={selected.valuation.marketValue} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, marketValue: v } })} placeholder="e.g. 98000" suffix="ZMW" />
                  <TextInput label="Forced sale / realizable value" value={selected.valuation.forcedSaleValue} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, forcedSaleValue: v } })} placeholder="e.g. 76000" suffix="ZMW" />
                </div>
                <TextArea label="Valuation notes" value={selected.valuation.notes} onChange={(v) => updateSelected({ valuation: { ...selected.valuation, notes: v } })} placeholder="Condition, mileage, any relevant observations…" />

                {coverage != null && (
                  <div style={{ marginTop: 14, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 26 }}>
                    <MiniStat label="This asset's value" value={zmw(selected.valuation.amount)} />
                    <MiniStat label="Final loan amount" value={zmw(FINAL_TERMS.amount)} />
                    <MiniStat label="Coverage" value={`${coverage}%`} accent={coverage < 120} />
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Valuer information</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 10 }}>
                  <TextInput label="Valuer name" value={selected.valuer.name} onChange={(v) => updateSelected({ valuer: { ...selected.valuer, name: v } })} placeholder="e.g. K. Zulu" />
                  <TextInput label="Valuer / company" value={selected.valuer.company} onChange={(v) => updateSelected({ valuer: { ...selected.valuer, company: v } })} placeholder="e.g. Apex Valuers Ltd" />
                  <TextInput label="Registration / license number" value={selected.valuer.license} onChange={(v) => updateSelected({ valuer: { ...selected.valuer, license: v } })} placeholder="e.g. VAL-2291" />
                  <TextInput label="Contact" value={selected.valuer.contact} onChange={(v) => updateSelected({ valuer: { ...selected.valuer, contact: v } })} placeholder="Phone or email" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151" }}>
                  <input type="checkbox" checked={selected.valuer.verified} onChange={(e) => updateSelected({ valuer: { ...selected.valuer, verified: e.target.checked } })} />
                  Valuer meets the configured panel requirements
                </label>
              </div>

              <div>
                <SectionLabel>Valuation date</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Valuation date</div>
                    <input type="date" value={selected.valuationDate} onChange={(e) => updateSelected({ valuationDate: e.target.value })} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>Validity</div>
                    <ValidityNote date={selected.valuationDate} days={selected.expiryDays} />
                  </div>
                </div>
              </div>

              <div>
                <SectionLabel right={<StatusSelect value={selected.status} onChange={(v) => updateSelected({ status: v })} />}>Valuation status</SectionLabel>
                {["Failed", "Exception"].includes(selected.status) && (
                  <TextArea label="Finding / reason (required)" value={selected.reason} onChange={(v) => updateSelected({ reason: v })} placeholder="Explain why the valuation failed or is an exception…" />
                )}
              </div>

              <DocumentsTable title="Supporting documents" docs={selected.docs} setDocs={(docs) => updateSelected({ docs })} />
            </div>
          )}

          {tab === "title" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <SectionLabel right={<SourceBadge source={selected.source === "application" ? "application" : "manual"} />}>Title / property information</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <TextInput label="Title number" value={selected.title.titleNumber} onChange={(v) => updateSelected({ title: { ...selected.title, titleNumber: v } })} />
                  <TextInput label="Property / asset reference" value={selected.title.propertyRef} onChange={(v) => updateSelected({ title: { ...selected.title, propertyRef: v } })} />
                  <TextInput label="Property type" value={selected.title.propertyType} onChange={(v) => updateSelected({ title: { ...selected.title, propertyType: v } })} />
                  <TextInput label="Location" value={selected.title.location} onChange={(v) => updateSelected({ title: { ...selected.title, location: v } })} />
                  <TextInput label="Registration information" value={selected.title.registrationInfo} onChange={(v) => updateSelected({ title: { ...selected.title, registrationInfo: v } })} span={2} />
                </div>
              </div>

              <div>
                <SectionLabel>Ownership verification</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
                  <TextInput label="Registered owner (from title document)" value={selected.title.registeredOwner} onChange={(v) => updateSelected({ title: { ...selected.title, registeredOwner: v } })} />
                  <ReadRow label="Applicant / pledgor" value={APPLICATION.customer.name} />
                </div>
                {ownershipMatches ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "9px 12px" }}>
                    <Check size={14} /> Ownership matches
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "9px 12px" }}>
                    <AlertTriangle size={14} /> Ownership mismatch — requires review
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Title verification</SectionLabel>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                  {selected.titleChecklist.map((item, i) => (
                    <div key={item.id} style={{ padding: "11px 16px", borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12.5, color: "#374151" }}>{item.label}</span>
                        <StatusSelect value={item.status} onChange={(v) => updateChecklist(selected.id, item.id, { status: v })} />
                      </div>
                      {["Failed", "Exception"].includes(item.status) && (
                        <input value={item.comment} onChange={(e) => updateChecklist(selected.id, item.id, { comment: e.target.value })} placeholder="Comment required to resolve this item"
                          style={{ width: "100%", marginTop: 8, padding: "7px 10px", borderRadius: 7, border: "1px solid " + (item.comment ? "#e5e7eb" : "#fde68a"), fontSize: 12, boxSizing: "border-box" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Legal observations</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <TextArea label="Findings" value={selected.observations.findings} onChange={(v) => updateSelected({ observations: { ...selected.observations, findings: v } })} placeholder="What was found during the review…" />
                  <TextArea label="Risks / issues identified" value={selected.observations.risks} onChange={(v) => updateSelected({ observations: { ...selected.observations, risks: v } })} placeholder="Any risks worth flagging…" />
                  <TextArea label="Recommendations" value={selected.observations.recommendations} onChange={(v) => updateSelected({ observations: { ...selected.observations, recommendations: v } })} placeholder="Recommended next steps…" />
                </div>
              </div>

              <DocumentsTable title="Supporting documents" docs={selected.titleDocs} setDocs={(titleDocs) => updateSelected({ titleDocs })} />
            </div>
          )}

          {tab === "checks" && (
            <div>
              <SectionLabel right={<span style={{ fontSize: 11, color: "#9ca3af" }}>{selected.legalChecks.filter((c) => c.status === "Passed").length} passed · {selected.legalChecks.filter((c) => c.status === "Exception").length} exception · {selected.legalChecks.filter((c) => c.status === "Failed").length} failed</span>}>
                Legal checks — configured for {selected.base.type} · {APPLICATION.customer.type} · Zambia
              </SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selected.legalChecks.map((c) => {
                  const expand = ["Failed", "Exception"].includes(c.status);
                  return (
                    <div key={c.id} style={{ background: "#fff", border: "1px solid " + (expand ? "#fde68a" : "#e5e7eb"), borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.name}</span>
                        <StatusSelect value={c.status} onChange={(v) => updateLegalCheck(selected.id, c.id, { status: v })} />
                      </div>
                      <input value={c.finding} onChange={(e) => updateLegalCheck(selected.id, c.id, { finding: e.target.value })} placeholder="What was found…"
                        style={{ width: "100%", marginTop: 8, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box", color: "#374151" }} />
                      {expand && (
                        <div style={{ marginTop: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>Why this is a problem</div>
                            <input value={c.why || ""} onChange={(e) => updateLegalCheck(selected.id, c.id, { why: e.target.value })} placeholder="Explain the risk this creates…" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box", background: "#fff" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>Action required</div>
                            <input value={c.action || ""} onChange={(e) => updateLegalCheck(selected.id, c.id, { action: e.target.value })} placeholder="What needs to happen before this clears…" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box", background: "#fff" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>Underwriter comment (required to resolve)</div>
                            <input value={c.comment} onChange={(e) => updateLegalCheck(selected.id, c.id, { comment: e.target.value })} placeholder="Add your acknowledgement or next step…"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid " + (c.comment ? "#e5e7eb" : "#f59e0b"), fontSize: 12, boxSizing: "border-box", background: "#fff" }} />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500, color: "#92400e", background: "#fff", border: "1px solid #fde68a", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
                              <Paperclip size={11} /> Attach evidence
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
        <SectionLabel>Underwriter notes</SectionLabel>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="General comments, findings, risks, exceptions and recommendations that apply across the review…" rows={3}
          style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Shared across all assets and tabs, and included in the underwriting audit trail.</div>
      </div>

      <DecisionSection
        readiness={readiness} decision={decision} setDecision={setDecision}
        conditions={conditions} addCondition={addCondition} updateCondition={updateCondition} removeCondition={removeCondition}
        reasonCategory={reasonCategory} setReasonCategory={setReasonCategory} reasonDetail={reasonDetail} setReasonDetail={setReasonDetail}
        decisionReady={decisionReady} legalCounts={legalCounts} assetCount={assets.length} totalAssetValue={totalAssetValue} totalCoverage={totalCoverage}
        onComplete={() => setCompleted(true)}
      />
    </div>
  );
}

function ValidityNote({ date, days }) {
  if (!date) return <div style={{ fontSize: 12.5, color: "#9ca3af", padding: "9px 0" }}>Set a valuation date to see validity</div>;
  const valDate = new Date(date);
  const expiry = new Date(valDate);
  expiry.setDate(expiry.getDate() + days);
  const daysLeft = Math.round((expiry - new Date()) / (1000 * 60 * 60 * 24));
  const expired = daysLeft < 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: expired ? "#dc2626" : "#15803d", padding: "9px 0" }}>
      {expired ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
      {expired ? "Valuation expired" : `Valid for ${daysLeft} more days`}
    </div>
  );
}

const DECISION_LABEL = { approve: "Approve / Proceed", conditions: "Approve with Conditions", refer: "Refer / Require Further Review", reject: "Reject" };
const REJECT_REASONS = ["Insufficient collateral", "Ownership issue", "Legal risk", "Invalid documentation", "Unresolved exception", "Valuation issue", "Other"];

function DecisionSection({ readiness, decision, setDecision, conditions, addCondition, updateCondition, removeCondition, reasonCategory, setReasonCategory, reasonDetail, setReasonDetail, decisionReady, legalCounts, assetCount, totalAssetValue, totalCoverage, onComplete }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "20px 22px" }}>
      <SectionLabel>Consolidated underwriting decision</SectionLabel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Assets ({assetCount})</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{zmw(totalAssetValue)}{totalCoverage != null && <span style={{ fontSize: 11, color: "#6b7280" }}> · {totalCoverage}% coverage</span>}</div>
          <StatusPill status={readiness.valuationOk ? "Passed" : "Exception"} />
        </div>
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Title</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{readiness.titleOk ? "Verified" : "Unresolved"}</div>
          <StatusPill status={readiness.titleOk ? "Passed" : "Exception"} />
        </div>
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Legal checks</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{legalCounts.passed} passed · {legalCounts.exception} exception · {legalCounts.failed} failed</div>
        </div>
      </div>

      {!readiness.ready ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "10px 12px" }}>
          <AlertTriangle size={14} /> Resolve the readiness items above before a decision can be made.
        </div>
      ) : !decision ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <DecisionButton label="Approve / Proceed" tone="#16a34a" onClick={() => setDecision("approve")} />
          <DecisionButton label="Approve with Conditions" tone="#d97706" onClick={() => setDecision("conditions")} />
          <DecisionButton label="Refer / Further Review" tone="#4f46e5" onClick={() => setDecision("refer")} />
          <DecisionButton label="Reject" tone="#dc2626" onClick={() => setDecision("reject")} />
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{DECISION_LABEL[decision]}</span>
            <button onClick={() => setDecision(null)} style={{ fontSize: 12, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer" }}>Change decision</button>
          </div>

          {decision === "conditions" && (
            <div style={{ marginBottom: 16 }}>
              {conditions.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "flex-end" }}>
                  <TextInput label="Condition" value={c.condition} onChange={(v) => updateCondition(i, { condition: v })} placeholder="e.g. Title clearance required before disbursement" />
                  <SelectInput label="Responsible party" value={c.responsible} onChange={(v) => updateCondition(i, { responsible: v })} options={["Customer", "Internal", "Legal"]} />
                  <SelectInput label="Due before" value={c.dueBefore} onChange={(v) => updateCondition(i, { dueBefore: v })} options={["Disbursement", "Offer", "Documentation"]} />
                  <button onClick={() => removeCondition(i)} style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#dc2626", cursor: "pointer" }}><X size={14} /></button>
                </div>
              ))}
              <button onClick={addCondition} style={{ fontSize: 12.5, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>+ Add condition</button>
            </div>
          )}

          {(decision === "refer" || decision === "reject") && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Reason</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {REJECT_REASONS.map((r) => (
                  <button key={r} onClick={() => setReasonCategory(r)} style={{ fontSize: 12, fontWeight: 500, padding: "7px 13px", borderRadius: 20, border: "1.5px solid " + (reasonCategory === r ? "#4f46e5" : "#e5e7eb"), background: reasonCategory === r ? "#eef2ff" : "#fff", color: reasonCategory === r ? "#4338ca" : "#374151", cursor: "pointer" }}>{r}</button>
                ))}
              </div>
              <TextArea label="Detailed explanation (optional)" value={reasonDetail} onChange={setReasonDetail} placeholder="Add any further detail for the audit trail…" />
            </div>
          )}

          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Decision summary</div>
            <SimRow label="Decision" value={DECISION_LABEL[decision]} />
            <SimRow label="Assets reviewed" value={String(assetCount)} />
            <SimRow label="Title verification" value={readiness.titleOk ? "Passed" : "Unresolved"} />
            <SimRow label="Legal checks" value={`${legalCounts.passed} passed / ${legalCounts.exception} exception`} />
            {decision === "conditions" && <SimRow label="Conditions" value={String(conditions.length)} />}
            {(decision === "refer" || decision === "reject") && <SimRow label="Reason" value={reasonCategory || "—"} />}
            <SimRow label="Underwriter" value="Logged-in credit officer" last />
          </div>

          <button
            disabled={!decisionReady}
            onClick={() => decisionReady && onComplete()}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 10, border: "none", background: decisionReady ? "#4f46e5" : "#c7c9d1", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: decisionReady ? "pointer" : "not-allowed" }}
          >
            Complete underwriting <ArrowRight size={15} />
          </button>
          {!decisionReady && <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 6 }}>{decision === "conditions" ? "Add at least one condition to continue." : "Select a reason to continue."}</div>}
        </div>
      )}
    </div>
  );
}

function DecisionButton({ label, tone, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "14px 10px", borderRadius: 10, border: "1.5px solid " + tone, background: "#fff", color: tone, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
      {label}
    </button>
  );
}