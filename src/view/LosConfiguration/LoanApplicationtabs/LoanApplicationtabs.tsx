import React, { useState, useMemo, useEffect } from "react";
import {
  IconSearch as Search,
  IconUser as User,
  IconBuilding as Building2,
  IconChevronRight as ChevronRight,
  IconCheck as Check,
  IconX as X,
  IconInfoCircle as Info,
  IconAlertCircle as AlertCircle,
  IconSparkles as Sparkles,
  IconArrowRight as ArrowRight,
  IconArrowLeft as ArrowLeft,
  IconLoader2 as Loader2,
  IconCalendar as Calendar,
  IconFileText as FileText,
  IconShieldCheck as ShieldCheck,
  IconChevronUp as ChevronUp,
  IconChevronDown as ChevronDown,
  IconWallet as Wallet,
  IconPercentage as Percent,
  IconClock as Clock,
  IconUsers as Users,
  IconInbox as Inbox,
  IconLock as Lock,
  IconCloudUpload as UploadCloud,
  IconBuildingBank as Landmark,
  IconCircleCheck as CheckCircle2,
  IconMinus as Minus,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CUSTOMERS = [
  {
    id: "CU-10234", name: "Chanda Mwansa", phone: "0977 123 456", nrc: "123456/78/1", segment: "Salaried — Ministry of Health", since: "Customer since 2021", hasOffers: true,
    email: "chanda.mwansa@example.com", dob: "14-Mar-1990", gender: "Female", maritalStatus: "Married", address: "Plot 22, Kabulonga, Lusaka", nationality: "Zambian", nextOfKin: null,
  },
  {
    id: "CU-10892", name: "Bwalya Phiri", phone: "0966 552 310", nrc: "234567/11/2", segment: "Self-employed — Retail", since: "Customer since 2023", hasOffers: false,
    email: "bwalya.phiri@example.com", dob: "02-Jul-1985", gender: "Male", maritalStatus: "Single", address: "House 4B, Chilenje, Lusaka", nationality: "Zambian", nextOfKin: null,
  },
  {
    id: "CU-11045", name: "Mutale Banda", phone: "0955 903 217", nrc: "345678/22/3", segment: "Salaried — Zamtel", since: "Customer since 2019", hasOffers: true,
    email: "mutale.banda@example.com", dob: "27-Nov-1992", gender: "Female", maritalStatus: "Married", address: "Plot 9, Roma, Lusaka", nationality: "Zambian", nextOfKin: { name: "Mwansa Banda", phone: "0977 456 789", relationship: "Spouse" },
  },
];

const OFFERS = {
  "CU-10234": [
    { id: "OF-1", product: "Personal Loan — Salary Advance", amount: 35000, rate: 22, tenure: 18, purpose: "General purpose", validity: "Valid until 30 Sep 2026", condition: "Requires latest payslip on file", loanType: "personal", subtype: "salary", purposeVal: "General purpose" },
    { id: "OF-2", product: "Personal Loan — Top-up", amount: 15000, rate: 20, tenure: 12, purpose: "Top-up on existing facility", validity: "Valid until 15 Oct 2026", condition: "Existing loan must be in good standing", loanType: "personal", subtype: "salary", purposeVal: "Top-up" },
  ],
  "CU-11045": [
    { id: "OF-3", product: "Personal Loan — Salary Advance", amount: 50000, rate: 19, tenure: 24, purpose: "General purpose", validity: "Valid until 05 Nov 2026", condition: "Subject to updated employer confirmation", loanType: "personal", subtype: "salary", purposeVal: "General purpose" },
  ],
};

const LOAN_TYPES = [
  {
    id: "personal", label: "Personal loan", icon: User,
    subtypes: [
      { id: "salary", label: "Salary-backed", purposes: ["Home improvement", "Education", "Medical", "Debt consolidation", "Other"] },
      { id: "consumer", label: "Consumer loan", purposes: ["Vehicle purchase", "Appliances", "Travel", "Other"] },
    ],
    amount: { min: 5000, max: 100000 }, tenure: { min: 6, max: 60 }, rate: { min: 18, max: 32, kind: "Fixed" },
    docs: { required: ["Latest 3 payslips", "National ID copy", "Passport photo"], optional: ["Proof of residence"], conditional: ["Employer confirmation letter — if self-employed"] },
    requirements: { collateral: false, guarantor: false, employment: "Formal employment, 6+ months", income: "ZMW 3,000 / month minimum" },
  },
  {
    id: "business", label: "Business loan", icon: Building2,
    subtypes: [
      { id: "working-capital", label: "Working capital", purposes: ["Stock purchase", "Cash flow support", "Other"] },
      { id: "asset-finance", label: "Asset finance", purposes: ["Equipment purchase", "Vehicle fleet", "Other"] },
    ],
    amount: { min: 20000, max: 500000 }, tenure: { min: 12, max: 84 }, rate: { min: 21, max: 30, kind: "Fixed" },
    docs: { required: ["Business registration certificate", "6 months bank statements", "Director's ID"], optional: ["Audited financials"], conditional: ["Lease agreement — if renting business premises"] },
    requirements: { collateral: true, guarantor: true, employment: "Business trading 12+ months", income: "ZMW 15,000 / month minimum turnover" },
  },
  {
    id: "mortgage", label: "Mortgage", icon: FileText,
    subtypes: [{ id: "home-purchase", label: "Home purchase", purposes: ["Primary residence", "Investment property"] }],
    amount: { min: 100000, max: 2000000 }, tenure: { min: 60, max: 240 }, rate: { min: 16, max: 24, kind: "Variable" },
    docs: { required: ["Title deed / offer letter", "6 months bank statements", "Latest 3 payslips"], optional: ["Property valuation report"], conditional: ["Spousal consent — if married"] },
    requirements: { collateral: true, guarantor: false, employment: "Formal employment, 12+ months", income: "ZMW 8,000 / month minimum" },
  },
];

const FREQUENCIES = ["Monthly", "Bi-weekly"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const zmw = (n) => "ZMW " + Math.round(n).toLocaleString();

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

// ---------------------------------------------------------------------------
// Shared leaf components
// ---------------------------------------------------------------------------

function FieldError({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, fontSize: 12.5, color: "#dc2626" }}>
      <AlertCircle size={13} style={{ marginTop: 1.5, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

function Banner({ tone = "info", children, icon }) {
  const tones = {
    info: { bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3", iconColor: "#4f46e5" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", iconColor: "#d97706" },
  };
  const t = tones[tone];
  const Icon = icon || Info;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: t.bg, border: "1px solid " + t.border, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: t.text, marginBottom: 14 }}>
      <Icon size={15} style={{ marginTop: 1.5, flexShrink: 0, color: t.iconColor }} />
      <div>{children}</div>
    </div>
  );
}

function TypeCard({ icon: Icon, label, description, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", padding: "16px", borderRadius: 12, border: "1.5px solid " + (selected ? "#4f46e5" : "#e5e7eb"), background: selected ? "#eef2ff" : "#fff", cursor: "pointer" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: selected ? "#4f46e5" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={selected ? "#fff" : "#6b7280"} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{description}</div>
      </div>
    </button>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ fontSize: 12.5, fontWeight: 500, padding: "7px 14px", borderRadius: 20, border: "1.5px solid " + (selected ? "#4f46e5" : "#e5e7eb"), background: selected ? "#4f46e5" : "#fff", color: selected ? "#fff" : "#374151", cursor: "pointer" }}>
      {label}
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, required, error, readOnly, type = "text", span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
        {label}
        {required && !readOnly && <span style={{ color: "#dc2626" }}>*</span>}
        {readOnly && <Lock size={11} color="#9ca3af" />}
      </div>
      {readOnly ? (
        <div style={{ padding: "9px 11px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280" }}>{value || "—"}</div>
      ) : (
        <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid " + (error ? "#fca5a5" : "#d1d5db"), fontSize: 13, boxSizing: "border-box", outline: "none" }} />
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required, error, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 }}>{label} {required && <span style={{ color: "#dc2626" }}>*</span>}</div>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid " + (error ? "#fca5a5" : "#d1d5db"), fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SummaryRow({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: last ? "none" : "1px solid #f3f4f6", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

function UploadTile({ label, tier, uploaded, onUpload }) {
  const tierLabel = { required: "Required", optional: "Optional", conditional: "Conditional" }[tier];
  const tierColor = { required: "#dc2626", optional: "#6b7280", conditional: "#d97706" }[tier];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FileText size={15} color="#9ca3af" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{label}</div>
          {tier && <div style={{ fontSize: 10.5, fontWeight: 600, color: tierColor, marginTop: 1 }}>{tierLabel}</div>}
        </div>
      </div>
      {uploaded ? (
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#15803d" }}><Check size={14} /> Uploaded</span>
      ) : (
        <button onClick={onUpload} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
          <UploadCloud size={13} /> Upload
        </button>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#6b7280", marginBottom: 3 }}><Icon size={12} /> {label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{value}</div>
    </div>
  );
}

function RequirementTag({ icon: Icon, label, ok }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, padding: "5px 10px", borderRadius: 20, background: ok ? "#f0fdf4" : "#fff7ed", color: ok ? "#15803d" : "#c2410c" }}>
      <Icon size={12} /> {label}
    </div>
  );
}

function DocGroup({ label, items, tone }) {
  if (!items.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: tone, marginBottom: 4 }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>{items.map((it) => <li key={it} style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>{it}</li>)}</ul>
    </div>
  );
}

const th = { textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#6b7280", fontSize: 11 };
const td = { padding: "7px 12px", color: "#374151" };

function SimRow({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: last ? "none" : "1px solid #f3f4f6", fontSize: 12.5 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Customer & loan
// ---------------------------------------------------------------------------

function TabCustomerLoan(props) {
  const {
    customerType, setCustomerType, query, setQuery, results, customerLoading, pickCustomer,
    selectedCustomer, offersLoading, offersForCustomer, selectedOfferId, setSelectedOfferId, useManualSelection, setUseManualSelection,
    applicantType, setApplicantType, loanTypeId, subtypeId, purpose, handleLoanTypeChange, setSubtypeId, setPurpose, touched,
  } = props;
  const loanType = LOAN_TYPES.find((t) => t.id === loanTypeId);

  return (
    <div>
      <SectionLabel>1. Customer type</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
        <TypeCard icon={User} label="Existing customer" description="Search for a customer already in the system" selected={customerType === "existing"} onClick={() => setCustomerType("existing")} />
        <TypeCard icon={Sparkles} label="New customer" description="Start a fresh application" selected={customerType === "new"} onClick={() => setCustomerType("new")} />
      </div>

      {customerType === "existing" && (
        <>
          <SectionLabel>2. Find customer</SectionLabel>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "#9ca3af" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, customer ID, phone, or national ID"
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 13.5, outline: "none", boxSizing: "border-box" }} />
          </div>
          {customerLoading && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", marginBottom: 12 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading customer…</div>}
          {!customerLoading && !selectedCustomer && query.trim().length > 0 && (
            <div style={{ marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              {results.length === 0 ? (
                <div style={{ padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>No customer found</div>
                  <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>Try a different name, ID, or phone number — or continue as a new customer.</div>
                </div>
              ) : results.map((c, i) => (
                <button key={c.id} onClick={() => pickCustomer(c)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "11px 14px", background: "#fff", border: "none", borderTop: i > 0 ? "1px solid #f3f4f6" : "none", cursor: "pointer", textAlign: "left" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{c.id} · {c.phone}</div>
                  </div>
                  <ChevronRight size={15} color="#9ca3af" />
                </button>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4f46e5", fontSize: 15, flexShrink: 0 }}>
                {selectedCustomer.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{selectedCustomer.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#4f46e5", background: "#eef2ff", padding: "2px 8px", borderRadius: 20 }}>{selectedCustomer.id}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{selectedCustomer.segment} · {selectedCustomer.since} · {selectedCustomer.phone}</div>
              </div>
              <Check size={18} color="#16a34a" />
            </div>
          )}

          {selectedCustomer && (
            <>
              <SectionLabel>3. Pre-approved offers</SectionLabel>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
                {offersLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Checking for pre-approved offers…</div>
                ) : offersForCustomer.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "10px" }}>
                    <Inbox size={22} color="#d1d5db" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>No pre-approved offers available</div>
                    <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>Configure a loan for this customer below.</div>
                  </div>
                ) : useManualSelection ? (
                  <button onClick={() => setUseManualSelection(false)} style={{ fontSize: 12.5, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>← Back to pre-approved offers</button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {offersForCustomer.map((o) => {
                      const selected = selectedOfferId === o.id;
                      return (
                        <button key={o.id} onClick={() => { setSelectedOfferId(o.id); setUseManualSelection(false); }} style={{ textAlign: "left", border: "1.5px solid " + (selected ? "#4f46e5" : "#e5e7eb"), background: selected ? "#eef2ff" : "#fff", borderRadius: 12, padding: "13px 16px", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{o.product}</div>
                              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{o.purpose} · {o.validity}</div>
                            </div>
                            {selected && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={12} color="#fff" /></div>}
                          </div>
                          <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12.5 }}>
                            <div><span style={{ color: "#6b7280" }}>Amount up to</span> <span style={{ fontWeight: 600, color: "#111827" }}>{zmw(o.amount)}</span></div>
                            <div><span style={{ color: "#6b7280" }}>Rate</span> <span style={{ fontWeight: 600, color: "#111827" }}>{o.rate}%</span></div>
                            <div><span style={{ color: "#6b7280" }}>Tenure up to</span> <span style={{ fontWeight: 600, color: "#111827" }}>{o.tenure} mo</span></div>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 6 }}>{o.condition}</div>
                        </button>
                      );
                    })}
                    <button onClick={() => { setSelectedOfferId(null); setUseManualSelection(true); }} style={{ alignSelf: "flex-start", fontSize: 12.5, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 2 }}>
                      Choose another loan product instead →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {customerType === "new" && (
        <>
          <SectionLabel>2. Applicant type</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <TypeCard icon={User} label="Individual" description="Personal loan applicant" selected={applicantType === "individual"} onClick={() => setApplicantType("individual")} />
            <TypeCard icon={Building2} label="Business" description="Registered business entity" selected={applicantType === "business"} onClick={() => setApplicantType("business")} />
          </div>
        </>
      )}

      {((customerType === "existing" && selectedCustomer && !selectedOfferId) || (customerType === "new" && applicantType)) && (
        <>
          <SectionLabel>{customerType === "existing" ? "4. Loan configuration" : "3. Loan configuration"}</SectionLabel>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Loan type</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: loanType ? 16 : 0 }}>
            {LOAN_TYPES.map((t) => <TypeCard key={t.id} icon={t.icon} label={t.label} description={`${zmw(t.amount.min)}–${zmw(t.amount.max)}`} selected={loanTypeId === t.id} onClick={() => handleLoanTypeChange(t.id)} />)}
          </div>
          {loanType && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Loan sub-type</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {loanType.subtypes.map((s) => <Chip key={s.id} label={s.label} selected={subtypeId === s.id} onClick={() => { setSubtypeId(s.id); setPurpose(null); }} />)}
              </div>
            </div>
          )}
          {loanType && subtypeId && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Loan purpose</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {loanType.subtypes.find((s) => s.id === subtypeId).purposes.map((p) => <Chip key={p} label={p} selected={purpose === p} onClick={() => setPurpose(p)} />)}
              </div>
            </div>
          )}
        </>
      )}

      {touched.tab1 && <div style={{ marginTop: 16 }}><FieldError>Select a customer (or applicant type) and complete the loan configuration before continuing.</FieldError></div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Tab 2 — Eligibility & simulation
// ---------------------------------------------------------------------------

function TabEligibility({ loanType, productLoading, amount, tenure, frequency, setAmount, setTenure, setFrequency, amountError, tenureError, simulation, reqExpanded, setReqExpanded, scheduleExpanded, setScheduleExpanded, configChangedNotice }) {
  if (!loanType) return <div style={{ fontSize: 13, color: "#6b7280" }}>Configure a loan product first.</div>;
  if (productLoading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 0", color: "#6b7280", fontSize: 13.5 }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Fetching product rules…</div>;
  }
  return (
    <div>
      {configChangedNotice && <Banner tone="warning" icon={AlertCircle}>Loan configuration changed. Review the updated eligibility and simulation below.</Banner>}

      <SectionLabel>Eligibility</SectionLabel>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 12 }}>
          <MiniStat icon={Wallet} label="Loan amount" value={`${zmw(loanType.amount.min)} – ${zmw(loanType.amount.max)}`} />
          <MiniStat icon={Clock} label="Tenure" value={`${loanType.tenure.min} – ${loanType.tenure.max} months`} />
          <MiniStat icon={Percent} label="Interest rate (p.a.)" value={`${loanType.rate.min}% – ${loanType.rate.max}% · ${loanType.rate.kind}`} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: reqExpanded ? 12 : 0 }}>
          <RequirementTag icon={ShieldCheck} label={loanType.requirements.collateral ? "Collateral required" : "No collateral required"} ok={!loanType.requirements.collateral} />
          <RequirementTag icon={Users} label={loanType.requirements.guarantor ? "Guarantor required" : "No guarantor required"} ok={!loanType.requirements.guarantor} />
          <RequirementTag icon={Check} label={loanType.requirements.income} ok />
        </div>
        <button onClick={() => setReqExpanded(!reqExpanded)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
          {reqExpanded ? "Hide details" : "View documents and full requirements"} {reqExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {reqExpanded && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <DocGroup label="Required" items={loanType.docs.required} tone="#111827" />
            <DocGroup label="Optional" items={loanType.docs.optional} tone="#6b7280" />
            <DocGroup label="Conditional" items={loanType.docs.conditional} tone="#d97706" />
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Employment: {loanType.requirements.employment}</div>
          </div>
        )}
      </div>

      <SectionLabel>Configure your loan</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
            <span>Requested amount</span><span style={{ color: "#9ca3af" }}>{zmw(loanType.amount.min)} – {zmw(loanType.amount.max)}</span>
          </div>
          <input type="range" min={loanType.amount.min} max={loanType.amount.max} step={500} value={Math.min(Math.max(amount ?? loanType.amount.min, loanType.amount.min), loanType.amount.max)} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: "100%" }} />
          <input type="number" value={amount ?? ""} onChange={(e) => setAmount(e.target.value === "" ? null : Number(e.target.value))} style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid " + (amountError ? "#fca5a5" : "#d1d5db"), fontSize: 13.5, boxSizing: "border-box" }} />
          {amountError && <FieldError>{amountError}</FieldError>}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
            <span>Tenure (months)</span><span style={{ color: "#9ca3af" }}>{loanType.tenure.min} – {loanType.tenure.max}</span>
          </div>
          <input type="range" min={loanType.tenure.min} max={loanType.tenure.max} step={1} value={Math.min(Math.max(tenure ?? loanType.tenure.min, loanType.tenure.min), loanType.tenure.max)} onChange={(e) => setTenure(Number(e.target.value))} style={{ width: "100%" }} />
          <input type="number" value={tenure ?? ""} onChange={(e) => setTenure(e.target.value === "" ? null : Number(e.target.value))} style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid " + (tenureError ? "#fca5a5" : "#d1d5db"), fontSize: 13.5, boxSizing: "border-box" }} />
          {tenureError && <FieldError>{tenureError}</FieldError>}
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Repayment frequency</div>
          <div style={{ display: "flex", gap: 8 }}>{FREQUENCIES.map((f) => <Chip key={f} label={f} selected={frequency === f} onClick={() => setFrequency(f)} />)}</div>
        </div>
      </div>

      {simulation && (
        <>
          <SectionLabel>Loan simulation</SectionLabel>
          <div style={{ border: "1.5px solid #c7d2fe", borderRadius: 12, padding: "16px 18px", background: "#f5f6ff" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3, color: "#4f46e5", background: "#e0e7ff", padding: "3px 9px", borderRadius: 20 }}>INDICATIVE — NOT FINAL TERMS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>Estimated {frequency.toLowerCase()} installment</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginTop: 2 }}>{zmw(simulation.installment)}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>Total repayment</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginTop: 2 }}>{zmw(simulation.totalRepayment)}</div>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "4px 14px", marginBottom: 14 }}>
              <SimRow label="Loan amount" value={zmw(amount)} />
              <SimRow label="Interest rate" value={`${simulation.rate.toFixed(1)}% p.a.`} />
              <SimRow label="Tenure" value={`${tenure} months`} />
              <SimRow label="Repayment frequency" value={frequency} />
              <SimRow label="Estimated installment" value={zmw(simulation.installment)} />
              <SimRow label="Total interest" value={zmw(simulation.totalInterest)} />
              <SimRow label="Total repayment" value={zmw(simulation.totalRepayment)} />
              <SimRow label="Fees and charges" value={simulation.fee > 0 ? `${zmw(simulation.fee)} facility fee` : "None applicable"} />
              <SimRow label="First repayment date" value={fmtDate(simulation.first)} />
              <SimRow label="Final repayment date" value={fmtDate(simulation.final)} last />
            </div>
            <button onClick={() => setScheduleExpanded(!scheduleExpanded)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#4f46e5", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              {scheduleExpanded ? "Hide repayment schedule" : "Preview repayment schedule"} {scheduleExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {scheduleExpanded && (
              <div style={{ marginTop: 10, background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ background: "#f9fafb" }}><th style={th}>#</th><th style={th}>Due date</th><th style={th}>Principal</th><th style={th}>Interest</th><th style={th}>Balance</th></tr></thead>
                  <tbody>
                    {simulation.schedule.map((row) => (
                      <tr key={row.n} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>{row.n}</td><td style={td}>{fmtDate(row.due)}</td><td style={td}>{zmw(row.principal)}</td><td style={td}>{zmw(row.interest)}</td><td style={td}>{zmw(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {simulation.nPeriods > 6 && <div style={{ fontSize: 11.5, color: "#9ca3af", padding: "8px 12px" }}>Showing first 6 of {simulation.nPeriods} payments.</div>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Personal / business details
// ---------------------------------------------------------------------------

function TabPersonal({ isBusiness, selectedCustomer, personal, setP, touched }) {
  return (
    <div>
      {selectedCustomer && <Banner tone="info" icon={Info}>We've pre-filled this from {selectedCustomer.name}'s existing record. Locked fields can only be changed by a KYC update.</Banner>}
      <SectionLabel>{isBusiness ? "Business details" : "Personal details"}</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        {isBusiness ? (
          <>
            <TextField label="Business name" value={personal.businessName} onChange={setP("businessName")} placeholder="e.g. Kalingalinga Traders Ltd" required error={touched.tab3 && !personal.businessName ? "Required" : null} />
            <TextField label="Registration number" value={personal.regNumber} onChange={setP("regNumber")} placeholder="e.g. 112233" required error={touched.tab3 && !personal.regNumber ? "Required" : null} />
            <TextField label="TPIN" value={personal.tpin} onChange={setP("tpin")} placeholder="e.g. 1002233445" />
            <TextField label="Phone" value={personal.phone} onChange={setP("phone")} placeholder="e.g. 0971 234 567" required error={touched.tab3 && !personal.phone ? "Required" : null} />
            <TextField label="Email" value={personal.email} onChange={setP("email")} placeholder="e.g. info@company.com" required error={touched.tab3 && !personal.email ? "Required" : null} />
            <TextField label="Business address" value={personal.businessAddress} onChange={setP("businessAddress")} placeholder="e.g. Plot 12, Industrial Area" required span={2} error={touched.tab3 && !personal.businessAddress ? "Required" : null} />
          </>
        ) : (
          <>
            <TextField label="First name" value={personal.firstName} onChange={setP("firstName")} readOnly={!!selectedCustomer} required error={touched.tab3 && !personal.firstName ? "Required" : null} />
            <TextField label="Surname" value={personal.surname} onChange={setP("surname")} readOnly={!!selectedCustomer} required error={touched.tab3 && !personal.surname ? "Required" : null} />
            <TextField label="National ID" value={personal.nrc} onChange={setP("nrc")} readOnly={!!selectedCustomer} required error={touched.tab3 && !personal.nrc ? "Required" : null} />
            <TextField label="Date of birth" value={personal.dob} onChange={setP("dob")} placeholder="DD-MMM-YYYY" readOnly={!!selectedCustomer} required error={touched.tab3 && !personal.dob ? "Required" : null} />
            <TextField label="Phone" value={personal.phone} onChange={setP("phone")} placeholder="e.g. 0971 234 567" required error={touched.tab3 && !personal.phone ? "Required" : null} />
            <TextField label="Email" value={personal.email} onChange={setP("email")} placeholder="e.g. name@example.com" required error={touched.tab3 && !personal.email ? "Required" : null} />
            <SelectField label="Gender" value={personal.gender} onChange={setP("gender")} options={["Female", "Male"]} />
            <SelectField label="Marital status" value={personal.maritalStatus} onChange={setP("maritalStatus")} options={["Single", "Married", "Divorced", "Widowed"]} />
            <TextField label="Residential address" value={personal.address} onChange={setP("address")} placeholder="e.g. Plot 12, Kabulonga, Lusaka" required span={2} error={touched.tab3 && !personal.address ? "Required" : null} />
          </>
        )}
      </div>

      {!isBusiness && (
        <div>
          <SectionLabel>Next of kin</SectionLabel>
          {selectedCustomer?.nextOfKin ? (
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>{selectedCustomer.nextOfKin.name} · {selectedCustomer.nextOfKin.phone} · {selectedCustomer.nextOfKin.relationship} <span style={{ color: "#16a34a", fontWeight: 500 }}>— on file</span></div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>Not on file yet — please provide next of kin details.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <TextField label="Name" value={personal.nokName} onChange={setP("nokName")} placeholder="e.g. John Doe" required error={touched.tab3 && !personal.nokName ? "Required" : null} />
                <TextField label="Phone" value={personal.nokPhone} onChange={setP("nokPhone")} placeholder="e.g. 0977 000 000" required error={touched.tab3 && !personal.nokPhone ? "Required" : null} />
                <SelectField label="Relationship" value={personal.nokRelationship} onChange={setP("nokRelationship")} options={["Spouse", "Parent", "Sibling", "Child", "Other"]} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Collateral
// ---------------------------------------------------------------------------

function TabCollateral({ loanType, collateral, setCollateral, touched }) {
  return (
    <div>
      <Banner tone="info" icon={Landmark}>{loanType.label} requires collateral to secure this facility.</Banner>
      <SectionLabel>Collateral details</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <SelectField label="Collateral type" value={collateral.type} onChange={(v) => setCollateral((c) => ({ ...c, type: v }))} options={["Motor vehicle", "Landed property", "Fixed deposit", "Equipment", "Other"]} required error={touched.tab4 && !collateral.type ? "Required" : null} />
        <TextField label="Estimated value (ZMW)" value={collateral.value} onChange={(v) => setCollateral((c) => ({ ...c, value: v }))} placeholder="e.g. 60000" type="number" required error={touched.tab4 && !collateral.value ? "Required" : null} />
        <TextField label="Description" value={collateral.description} onChange={(v) => setCollateral((c) => ({ ...c, description: v }))} placeholder="e.g. 2019 Toyota Hilux, registration ABC 1234" span={2} />
      </div>
      <SectionLabel>Supporting document</SectionLabel>
      <UploadTile label="Proof of ownership document" uploaded={collateral.documentUploaded} onUpload={() => setCollateral((c) => ({ ...c, documentUploaded: true }))} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Documents
// ---------------------------------------------------------------------------

function TabDocuments({ loanType, docList, uploaded, setUploaded, touched, requiredDocsMissing }) {
  return (
    <div>
      <SectionLabel>Required documents</SectionLabel>
      <p style={{ fontSize: 12.5, color: "#6b7280", margin: "0 0 14px" }}>Based on {loanType.label.toLowerCase()} requirements. Required documents must be uploaded to continue.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {docList.map((d) => <UploadTile key={d.name} label={d.name} tier={d.tier} uploaded={!!uploaded[d.name]} onUpload={() => setUploaded((u) => ({ ...u, [d.name]: true }))} />)}
      </div>
      {touched.tab5 && requiredDocsMissing.length > 0 && <div style={{ marginTop: 14 }}><FieldError>Upload all required documents before continuing: {requiredDocsMissing.map((d) => d.name).join(", ")}.</FieldError></div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 6 — Employment & financials
// ---------------------------------------------------------------------------

function TabEmployment({ isBusiness, employment, setEmployment, touched }) {
  return (
    <div>
      <SectionLabel>{isBusiness ? "Business financials" : "Employment and financial details"}</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {isBusiness ? (
          <>
            <TextField label="Years trading" value={employment.lengthOfService} onChange={(v) => setEmployment((e) => ({ ...e, lengthOfService: v }))} placeholder="e.g. 3" type="number" />
            <TextField label="Average monthly turnover (ZMW)" value={employment.monthlyIncome} onChange={(v) => setEmployment((e) => ({ ...e, monthlyIncome: v }))} placeholder="e.g. 45000" type="number" required error={touched.tab6 && !employment.monthlyIncome ? "Required" : null} />
            <TextField label="Other income sources (ZMW)" value={employment.additionalIncome} onChange={(v) => setEmployment((e) => ({ ...e, additionalIncome: v }))} placeholder="e.g. 5000" type="number" />
            <TextField label="Average monthly expenses (ZMW)" value={employment.monthlyExpenses} onChange={(v) => setEmployment((e) => ({ ...e, monthlyExpenses: v }))} placeholder="e.g. 20000" type="number" />
          </>
        ) : (
          <>
            <SelectField label="Employment status" value={employment.status} onChange={(v) => setEmployment((e) => ({ ...e, status: v }))} options={["Formally employed", "Self-employed", "Contract"]} required error={touched.tab6 && !employment.status ? "Required" : null} />
            <TextField label="Employer name" value={employment.employer} onChange={(v) => setEmployment((e) => ({ ...e, employer: v }))} placeholder="e.g. Ministry of Health" required error={touched.tab6 && !employment.employer ? "Required" : null} />
            <TextField label="Occupation" value={employment.occupation} onChange={(v) => setEmployment((e) => ({ ...e, occupation: v }))} placeholder="e.g. Nurse" />
            <TextField label="Length of employment" value={employment.lengthOfService} onChange={(v) => setEmployment((e) => ({ ...e, lengthOfService: v }))} placeholder="e.g. 4 years" />
            <TextField label="Monthly income (ZMW)" value={employment.monthlyIncome} onChange={(v) => setEmployment((e) => ({ ...e, monthlyIncome: v }))} placeholder="e.g. 12000" type="number" required error={touched.tab6 && !employment.monthlyIncome ? "Required" : null} />
            <TextField label="Additional income (ZMW)" value={employment.additionalIncome} onChange={(v) => setEmployment((e) => ({ ...e, additionalIncome: v }))} placeholder="e.g. 2000" type="number" />
            <TextField label="Monthly expenses (ZMW)" value={employment.monthlyExpenses} onChange={(v) => setEmployment((e) => ({ ...e, monthlyExpenses: v }))} placeholder="e.g. 4500" type="number" />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 7 — Review
// ---------------------------------------------------------------------------

function TabReview({ isBusiness, personalSummary, needsCollateral, collateral, docList, uploaded, employment, loanType, amount, tenure, simulation }) {
  return (
    <div>
      <SectionLabel>Loan summary</SectionLabel>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
        <SummaryRow label="Product" value={loanType.label} />
        <SummaryRow label="Amount" value={zmw(amount)} />
        <SummaryRow label="Tenure" value={`${tenure} months`} />
        <SummaryRow label="Interest rate" value={`${simulation.rate.toFixed(1)}% p.a.`} />
        <SummaryRow label="Estimated installment" value={zmw(simulation.installment)} />
        <SummaryRow label="Total repayment" value={zmw(simulation.totalRepayment)} last />
      </div>
      <SectionLabel>Application</SectionLabel>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <SummaryRow label={isBusiness ? "Business" : "Applicant"} value={personalSummary || "—"} />
        {needsCollateral && <SummaryRow label="Collateral" value={collateral.type ? `${collateral.type} · ${zmw(Number(collateral.value || 0))}` : "—"} />}
        <SummaryRow label="Documents" value={`${Object.keys(uploaded).length} of ${docList.length} uploaded`} />
        <SummaryRow label={isBusiness ? "Monthly turnover" : "Monthly income"} value={employment.monthlyIncome ? zmw(Number(employment.monthlyIncome)) : "—"} last />
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>This reflects the simulated terms only. Final approved terms may differ following full underwriting.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chrome — header, tab bar, footer, sidebar
// ---------------------------------------------------------------------------

function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#4f46e5", padding: "18px 26px", borderRadius: "16px 16px 0 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff" }}>New loan application</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>Customer, loan and repayment details</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Minus size={16} color="rgba(255,255,255,0.75)" />
        <X size={17} color="rgba(255,255,255,0.75)" />
      </div>
    </div>
  );
}

function TabBar({ tabs, activeTab, maxReachable, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 20px", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
      {tabs.map((t, i) => {
        const isActive = t.id === activeTab;
        const isDone = i < tabs.findIndex((x) => x.id === activeTab);
        const reachable = i <= maxReachable;
        return (
          <React.Fragment key={t.id}>
            {i > 0 && <ChevronRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />}
            <button
              onClick={() => reachable && onSelect(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "none",
                background: isActive ? "#eef2ff" : "transparent",
                color: isActive ? "#4338ca" : reachable ? "#374151" : "#c4c9d2",
                fontSize: 12.5, fontWeight: isActive ? 600 : 500, cursor: reachable ? "pointer" : "default", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "#4f46e5" : isActive ? "#4f46e5" : "#e5e7eb", color: isDone || isActive ? "#fff" : "#9ca3af", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {isDone ? <Check size={11} /> : i + 1}
              </span>
              {t.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Sidebar({ customerType, selectedCustomer, applicantType, loanType, subtype, purpose, simulation, amount, tenure, docList, uploaded, progress, submitted }) {
  const requiredMissing = docList.filter((d) => d.tier === "required" && !uploaded[d.name]).length;
  return (
    <div style={{ width: 250, flexShrink: 0, borderLeft: "1px solid #e5e7eb", padding: "20px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 14 }}>Application summary</div>

      <SideBlock label="Applicant">{selectedCustomer ? selectedCustomer.name : applicantType ? `New — ${applicantType}` : "—"}</SideBlock>

      <SideBlock label="Loan">
        {loanType ? (<>{loanType.label}{subtype && <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 1, fontWeight: 400 }}>{subtype.label}{purpose ? ` · ${purpose}` : ""}</div>}</>) : "—"}
      </SideBlock>

      {simulation && (
        <SideBlock label="Financial">
          {zmw(amount)} / {tenure} months
          <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 1, fontWeight: 400 }}>{zmw(simulation.installment)} / period</div>
        </SideBlock>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>Status</div>
        <div style={{ background: submitted ? "#15803d" : "#4f46e5", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{submitted ? "Submitted" : `${progress}% complete`}</div>
          {!submitted && (
            <div style={{ height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#fff", borderRadius: 4 }} />
            </div>
          )}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>{submitted ? "Sent for underwriting" : "Draft"}</div>
        </div>
      </div>

      {docList.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3 }}>Documents</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{Object.keys(uploaded).length} / {docList.length} uploaded</div>
          {requiredMissing > 0 && <div style={{ fontSize: 11.5, color: "#dc2626", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={12} /> {requiredMissing} pending</div>}
        </div>
      )}
    </div>
  );
}

function SideBlock({ label, children }) {
  return (
    <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LoanApplicationTabs() {
  const [customerType, setCustomerType] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [useManualSelection, setUseManualSelection] = useState(false);
  const [applicantType, setApplicantType] = useState(null);

  const [loanTypeId, setLoanTypeId] = useState(null);
  const [subtypeId, setSubtypeId] = useState(null);
  const [purpose, setPurpose] = useState(null);
  const [productLoading, setProductLoading] = useState(false);

  const [amount, setAmount] = useState(null);
  const [tenure, setTenure] = useState(null);
  const [frequency, setFrequency] = useState("Monthly");
  const [reqExpanded, setReqExpanded] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [configChangedNotice, setConfigChangedNotice] = useState(false);

  const [personal, setPersonal] = useState({
    firstName: "", surname: "", nrc: "", phone: "", email: "", dob: "", gender: "", maritalStatus: "", address: "", nationality: "Zambian",
    nokName: "", nokPhone: "", nokRelationship: "", businessName: "", regNumber: "", tpin: "", businessAddress: "",
  });
  const [collateral, setCollateral] = useState({ type: "", description: "", value: "", documentUploaded: false });
  const [uploaded, setUploaded] = useState({});
  const [employment, setEmployment] = useState({ status: "", employer: "", occupation: "", lengthOfService: "", monthlyIncome: "", additionalIncome: "", monthlyExpenses: "" });

  const [activeTab, setActiveTab] = useState("customer");
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const loanType = LOAN_TYPES.find((t) => t.id === loanTypeId) || null;
  const subtype = loanType?.subtypes.find((s) => s.id === subtypeId) || null;
  const offersForCustomer = selectedCustomer ? OFFERS[selectedCustomer.id] || [] : [];
  const selectedOffer = offersForCustomer.find((o) => o.id === selectedOfferId) || null;
  const isBusiness = applicantType === "business";
  const needsCollateral = !!loanType?.requirements.collateral;

  const results = query.trim().length > 0 ? CUSTOMERS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query) || c.nrc.includes(query)) : [];

  useEffect(() => {
    if (selectedOffer) {
      setLoanTypeId(selectedOffer.loanType);
      setSubtypeId(selectedOffer.subtype);
      setPurpose(selectedOffer.purposeVal);
      setAmount(selectedOffer.amount);
      setTenure(selectedOffer.tenure);
    }
  }, [selectedOfferId]);

  useEffect(() => {
    if (loanTypeId && subtypeId && purpose && !selectedOffer) {
      setProductLoading(true);
      const t = setTimeout(() => {
        setProductLoading(false);
        setAmount((prev) => prev ?? Math.round((loanType.amount.min + loanType.amount.max) / 4));
        setTenure((prev) => prev ?? Math.round((loanType.tenure.min + loanType.tenure.max) / 4));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loanTypeId, subtypeId, purpose]);

  // prefill personal details once a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setPersonal((p) => ({
        ...p,
        firstName: selectedCustomer.name.split(" ")[0],
        surname: selectedCustomer.name.split(" ").slice(1).join(" "),
        nrc: selectedCustomer.nrc, phone: selectedCustomer.phone, email: selectedCustomer.email, dob: selectedCustomer.dob,
        gender: selectedCustomer.gender, maritalStatus: selectedCustomer.maritalStatus, address: selectedCustomer.address, nationality: selectedCustomer.nationality,
        nokName: selectedCustomer.nextOfKin?.name || "", nokPhone: selectedCustomer.nextOfKin?.phone || "", nokRelationship: selectedCustomer.nextOfKin?.relationship || "",
      }));
    }
  }, [selectedCustomer]);

  const loanConfigured = !!selectedOffer || (loanTypeId && subtypeId && purpose);
  const productKnown = !!loanType && !productLoading && loanConfigured;
  const amountError = productKnown && amount != null && (amount < loanType.amount.min || amount > loanType.amount.max) ? `Enter an amount between ${zmw(loanType.amount.min)} and ${zmw(loanType.amount.max)}.` : null;
  const tenureError = productKnown && tenure != null && (tenure < loanType.tenure.min || tenure > loanType.tenure.max) ? `Enter a tenure between ${loanType.tenure.min} and ${loanType.tenure.max} months.` : null;

  const simulation = useMemo(() => {
    if (!productKnown || amountError || tenureError || amount == null || tenure == null) return null;
    const rate = (loanType.rate.min + loanType.rate.max) / 2;
    return { ...computeSimulation(amount, tenure, rate, frequency), rate };
  }, [productKnown, loanType, amount, tenure, frequency, amountError, tenureError]);
  const simulationValid = !!simulation;

  const docList = loanType ? [
    ...loanType.docs.required.map((d) => ({ name: d, tier: "required" })),
    ...loanType.docs.optional.map((d) => ({ name: d, tier: "optional" })),
    ...loanType.docs.conditional.map((d) => ({ name: d, tier: "conditional" })),
  ] : [];
  const requiredDocsMissing = docList.filter((d) => d.tier === "required" && !uploaded[d.name]);

  const personalSummary = isBusiness ? personal.businessName : [personal.firstName, personal.surname].filter(Boolean).join(" ");

  const setP = (k) => (v) => setPersonal((p) => ({ ...p, [k]: v }));

  function handleLoanTypeChange(id) {
    if (loanTypeId && loanTypeId !== id) setConfigChangedNotice(true);
    setLoanTypeId(id);
    setSubtypeId(null);
    setPurpose(null);
    setAmount(null);
    setTenure(null);
  }

  function pickCustomer(c) {
    setCustomerLoading(true);
    setTimeout(() => {
      setSelectedCustomer(c);
      setCustomerLoading(false);
      setOffersLoading(true);
      setTimeout(() => setOffersLoading(false), 500);
    }, 600);
  }

  // ---- tab definitions ----
  const tabs = [
    { id: "customer", label: "Customer & loan" },
    { id: "eligibility", label: "Eligibility & simulation" },
    { id: "personal", label: isBusiness ? "Business details" : "Personal details" },
    ...(needsCollateral ? [{ id: "collateral", label: "Collateral" }] : []),
    { id: "documents", label: "Documents" },
    { id: "employment", label: isBusiness ? "Financials" : "Employment" },
    { id: "review", label: "Review" },
  ];

  const personalValid = isBusiness
    ? personal.businessName && personal.regNumber && personal.phone && personal.email && personal.businessAddress
    : personal.firstName && personal.surname && personal.nrc && personal.dob && personal.phone && personal.email && personal.address && (selectedCustomer?.nextOfKin || (personal.nokName && personal.nokPhone));

  const collateralValid = !needsCollateral || (collateral.type && collateral.value);
  const documentsValid = requiredDocsMissing.length === 0;
  const employmentValid = isBusiness ? !!employment.monthlyIncome : !!(employment.status && employment.employer && employment.monthlyIncome);

  const tabCompletion = {
    customer: !!loanConfigured,
    eligibility: simulationValid,
    personal: !!personalValid,
    collateral: collateralValid,
    documents: documentsValid,
    employment: employmentValid,
    review: submitted,
  };

  // furthest index the user is allowed to jump to directly
  let maxReachable = 0;
  for (let i = 0; i < tabs.length; i++) {
    maxReachable = i;
    if (!tabCompletion[tabs[i].id]) break;
  }

  const progress = Math.round((tabs.filter((t) => tabCompletion[t.id]).length / tabs.length) * 100);

  function goNext() {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    const id = tabs[idx].id;
    if (!tabCompletion[id]) {
      setTouched((t) => ({ ...t, [`tab${idx + 1}`]: true }));
      return;
    }
    if (id === "review") {
      setSubmitted(true);
      return;
    }
    setActiveTab(tabs[idx + 1].id);
  }

  function goBack() {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    if (idx > 0) setActiveTab(tabs[idx - 1].id);
  }

  function selectTab(id) {
    setActiveTab(id);
  }

  const activeIdx = tabs.findIndex((t) => t.id === activeTab);
  const nextLabel = activeTab === "eligibility" ? "Proceed with application" : activeTab === "review" ? "Submit application" : "Save & continue";

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6", minHeight: "100vh", padding: "28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1080, background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        <Header />

        {submitted ? (
          <div style={{ padding: "70px 40px", textAlign: "center" }}>
            <CheckCircle2 size={36} color="#16a34a" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Application submitted</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Reference LN-{new Date().getFullYear()}-{String(Math.abs((loanType?.label.length || 1) * 137) % 9000 + 1000)} has been sent for underwriting review.
            </div>
          </div>
        ) : (
          <>
            <TabBar tabs={tabs} activeTab={activeTab} maxReachable={maxReachable} onSelect={selectTab} />
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <div style={{ flex: 1, minWidth: 0, padding: "22px 26px", maxHeight: 560, overflowY: "auto" }}>
                {activeTab === "customer" && (
                  <TabCustomerLoan
                    customerType={customerType} setCustomerType={setCustomerType} query={query} setQuery={setQuery} results={results}
                    customerLoading={customerLoading} pickCustomer={pickCustomer} selectedCustomer={selectedCustomer} offersLoading={offersLoading}
                    offersForCustomer={offersForCustomer} selectedOfferId={selectedOfferId} setSelectedOfferId={setSelectedOfferId}
                    useManualSelection={useManualSelection} setUseManualSelection={setUseManualSelection} applicantType={applicantType} setApplicantType={setApplicantType}
                    loanTypeId={loanTypeId} subtypeId={subtypeId} purpose={purpose} handleLoanTypeChange={handleLoanTypeChange} setSubtypeId={setSubtypeId} setPurpose={setPurpose}
                    touched={touched}
                  />
                )}
                {activeTab === "eligibility" && (
                  <TabEligibility
                    loanType={loanType} productLoading={productLoading} amount={amount} tenure={tenure} frequency={frequency}
                    setAmount={setAmount} setTenure={setTenure} setFrequency={setFrequency} amountError={amountError} tenureError={tenureError}
                    simulation={simulation} reqExpanded={reqExpanded} setReqExpanded={setReqExpanded} scheduleExpanded={scheduleExpanded} setScheduleExpanded={setScheduleExpanded}
                    configChangedNotice={configChangedNotice}
                  />
                )}
                {activeTab === "personal" && <TabPersonal isBusiness={isBusiness} selectedCustomer={selectedCustomer} personal={personal} setP={setP} touched={touched} />}
                {activeTab === "collateral" && <TabCollateral loanType={loanType} collateral={collateral} setCollateral={setCollateral} touched={touched} />}
                {activeTab === "documents" && <TabDocuments loanType={loanType} docList={docList} uploaded={uploaded} setUploaded={setUploaded} touched={touched} requiredDocsMissing={requiredDocsMissing} />}
                {activeTab === "employment" && <TabEmployment isBusiness={isBusiness} employment={employment} setEmployment={setEmployment} touched={touched} />}
                {activeTab === "review" && loanType && simulation && (
                  <TabReview isBusiness={isBusiness} personalSummary={personalSummary} needsCollateral={needsCollateral} collateral={collateral} docList={docList} uploaded={uploaded} employment={employment} loanType={loanType} amount={amount} tenure={tenure} simulation={simulation} />
                )}
              </div>
              <Sidebar customerType={customerType} selectedCustomer={selectedCustomer} applicantType={applicantType} loanType={loanType} subtype={subtype} purpose={purpose} simulation={simulation} amount={amount} tenure={tenure} docList={docList} uploaded={uploaded} progress={progress} submitted={submitted} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 26px", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", gap: 18 }}>
                <button style={{ fontSize: 13, color: "#6b7280", background: "transparent", border: "none", cursor: "pointer" }}>Cancel</button>
                <button style={{ fontSize: 13, color: "#dc2626", background: "transparent", border: "none", cursor: "pointer" }}>Reset form</button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {activeIdx > 0 && (
                  <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 9, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
                <button onClick={goNext} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, border: "none", background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {nextLabel} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=range] { accent-color: #4f46e5; }
      `}</style>
    </div>
  );
}