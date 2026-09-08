import React, { useState } from "react";
import {
  IconChevronDown as ChevronDown,
  IconChevronRight as ChevronRight,
  IconPlus as Plus,
  IconTrash as Trash2,
  IconCopy as Copy,
  IconArrowRight as ArrowRight,
  IconStack as Layers, // Tabler equivalent
  IconListCheck as ListChecks,
  IconShieldCheck as ShieldCheck,
  IconUser as User,
  IconAdjustments as Settings2, // Tabler equivalent
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  canvas: "#F3F4F7",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F9FB",
  ink: "#131A2B",
  inkSoft: "#3C4459",
  slate: "#66708A",
  slateLight: "#E4E7EE",
  border: "#E3E6EC",
  steel: "#2C4A78",
  steelDeep: "#1D3557",
  steelTint: "#EAF0F8",
  mint: "#1E8E5A",
  mintDeep: "#166B45",
  mintTint: "#E7F5EE",
  amber: "#B8791F",
  amberDeep: "#8A5C13",
  amberTint: "#FBF1DF",
};

const FIELDS = [
  { id: "creditScore", label: "Credit Score", unit: "number", category: "Credit" },
  { id: "netSalary", label: "Net Salary", unit: "currency", category: "Income" },
  { id: "dti", label: "Debt-to-Income Ratio", unit: "percent", category: "Income" },
  { id: "collateralValue", label: "Collateral Value", unit: "currency", category: "Collateral" },
  { id: "paymentHistory", label: "Payment History", unit: "percent", category: "Repayment History" },
  { id: "employmentYears", label: "Employment Duration (yrs)", unit: "number", category: "Employment" },
  { id: "customerTenure", label: "Customer Tenure (yrs)", unit: "number", category: "Customer Profile" },
];
const fieldById = (id) => FIELDS.find((f) => f.id === id);

// Plain-English operators (no symbols)
const OPERATORS = [
  { id: "gte", label: "Greater than or equal to" },
  { id: "lte", label: "Less than or equal to" },
  { id: "gt", label: "Greater than" },
  { id: "lt", label: "Less than" },
  { id: "eq", label: "Equal to" },
];
const operatorLabel = (id) => OPERATORS.find((o) => o.id === id)?.label || id;

const PRODUCT_COLORS = {
  "Premium Car Loan": { bg: C.steelTint, fg: C.steelDeep, dot: C.steel },
  "Standard Car Loan": { bg: C.mintTint, fg: C.mintDeep, dot: C.mint },
  "Basic Car Loan": { bg: C.amberTint, fg: C.amberDeep, dot: C.amber },
};
const colorFor = (product) => PRODUCT_COLORS[product] || { bg: C.slateLight, fg: C.inkSoft, dot: C.slate };

const uid = () => Math.random().toString(36).slice(2, 9);

// ---------------------------------------------------------------------------
// Initial data
// ---------------------------------------------------------------------------
const initialGroups = [
  {
    id: "g1",
    product: "Premium Car Loan",
    conditions: [
      { id: "c1", field: "creditScore", operator: "gte", value: 750, join: null },
      { id: "c2", field: "netSalary", operator: "gte", value: 20000, join: "AND" },
      { id: "c3", field: "collateralValue", operator: "gte", value: 100000, join: "AND" },
      { id: "c4", field: "paymentHistory", operator: "gte", value: 90, join: "AND" },
    ],
  },
  {
    id: "g2",
    product: "Standard Car Loan",
    conditions: [
      { id: "c5", field: "creditScore", operator: "gte", value: 650, join: null },
      { id: "c6", field: "creditScore", operator: "lte", value: 749, join: "AND" },
      { id: "c7", field: "netSalary", operator: "gte", value: 12000, join: "AND" },
      { id: "c8", field: "paymentHistory", operator: "gte", value: 70, join: "AND" },
    ],
  },
  {
    id: "g3",
    product: "Basic Car Loan",
    conditions: [
      { id: "c9", field: "creditScore", operator: "gte", value: 550, join: null },
      { id: "c10", field: "netSalary", operator: "gte", value: 8000, join: "AND" },
      { id: "c11", field: "paymentHistory", operator: "gte", value: 50, join: "AND" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" style={{ color: C.inkSoft }}>
      <span className="font-medium" style={{ color: C.ink }}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm outline-none transition"
          style={{ borderColor: C.border, backgroundColor: C.surface, color: C.ink }}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
      </div>
    </label>
  );
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" style={{ color: C.inkSoft }}>
      <span className="font-medium" style={{ color: C.ink }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition"
        style={{ borderColor: C.border, backgroundColor: C.surface, color: C.ink }}
      />
    </label>
  );
}

function Pill({ children, style }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={style}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Condition row
// ---------------------------------------------------------------------------
function ConditionRow({ cond, onChange, onRemove }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
      style={{ backgroundColor: C.surfaceAlt, borderColor: C.border }}
    >
      <div className="relative">
        <select
          value={cond.field}
          onChange={(e) => onChange({ field: e.target.value })}
          className="appearance-none rounded-md border px-2.5 py-2 pr-7 text-sm outline-none"
          style={{ borderColor: C.border, backgroundColor: C.surface, color: C.ink, minWidth: 168 }}
        >
          {FIELDS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
      </div>

      <div className="relative">
        <select
          value={cond.operator}
          onChange={(e) => onChange({ operator: e.target.value })}
          className="appearance-none rounded-md border px-2.5 py-2 pr-7 text-sm outline-none"
          style={{ borderColor: C.border, backgroundColor: C.surface, color: C.ink, minWidth: 210 }}
        >
          {OPERATORS.map((op) => (
            <option key={op.id} value={op.id}>{op.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
      </div>

      <input
        type="number"
        value={cond.value}
        onChange={(e) => onChange({ value: e.target.value === "" ? "" : Number(e.target.value) })}
        className="rounded-md border px-2.5 py-2 text-sm outline-none"
        style={{ borderColor: C.border, backgroundColor: C.surface, color: C.ink, width: 110 }}
      />
      <span className="text-xs" style={{ color: C.slate, minWidth: 14 }}>
        {fieldById(cond.field)?.unit === "percent" ? "%" : ""}
      </span>

      <button
        onClick={onRemove}
        aria-label="Remove condition"
        className="ml-auto rounded-md p-1.5 transition hover:bg-white"
        style={{ color: C.slate }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rule group card
// ---------------------------------------------------------------------------
function RuleGroupCard({ group, index, expanded, onToggleExpand, onUpdateGroup, onDuplicate, onRemove }) {
  const colors = colorFor(group.product);

  const updateCondition = (condId, patch) => {
    onUpdateGroup({
      conditions: group.conditions.map((c) => (c.id === condId ? { ...c, ...patch } : c)),
    });
  };
  const toggleJoin = (condId) => {
    onUpdateGroup({
      conditions: group.conditions.map((c) =>
        c.id === condId ? { ...c, join: c.join === "AND" ? "OR" : "AND" } : c
      ),
    });
  };
  const removeCondition = (condId) => {
    const remaining = group.conditions.filter((c) => c.id !== condId);
    if (remaining.length) remaining[0] = { ...remaining[0], join: null };
    onUpdateGroup({ conditions: remaining });
  };
  const addCondition = () => {
    onUpdateGroup({
      conditions: [
        ...group.conditions,
        { id: uid(), field: FIELDS[0].id, operator: "gte", value: 0, join: group.conditions.length ? "AND" : null },
      ],
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              style={{ backgroundColor: C.slateLight, color: C.inkSoft }}
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Pill style={{ backgroundColor: colors.bg, color: colors.fg }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                  {group.product || "Unassigned product"}
                </Pill>
              </div>
              <h3 className="mt-2 truncate text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>
                Rule Group {index + 1} &mdash; {group.product || "Untitled product"}
              </h3>
              <p className="mt-0.5 text-xs" style={{ color: C.slate }}>
                {group.conditions.length} condition{group.conditions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={onDuplicate} aria-label="Duplicate group" className="rounded-md p-2 transition" style={{ color: C.slate }}>
              <Copy size={16} />
            </button>
            <button onClick={onRemove} aria-label="Delete group" className="rounded-md p-2 transition" style={{ color: C.amberDeep }}>
              <Trash2 size={16} />
            </button>
            <button
              onClick={onToggleExpand}
              aria-label="Toggle group"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border transition"
              style={{ borderColor: C.border, color: C.ink }}
            >
              <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium" style={{ color: C.slate }}>Conditions</p>
            <div>
              {group.conditions.map((cond, i) => (
                <React.Fragment key={cond.id}>
                  {i > 0 && (
                    <div className="my-1.5 flex items-center gap-3 pl-1">
                      <div style={{ width: 2, height: 12, backgroundColor: C.border, marginLeft: 18 }} />
                    </div>
                  )}
                  {i > 0 && (
                    <div className="mb-1.5 flex items-center gap-3 pl-1">
                      <button
                        onClick={() => toggleJoin(cond.id)}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition"
                        style={{
                          backgroundColor: cond.join === "OR" ? C.amberTint : C.steelTint,
                          color: cond.join === "OR" ? C.amberDeep : C.steelDeep,
                        }}
                      >
                        {cond.join}
                      </button>
                      <div className="flex-1" style={{ borderTop: `1px dashed ${C.border}` }} />
                    </div>
                  )}
                  <ConditionRow
                    cond={cond}
                    onChange={(patch) => updateCondition(cond.id, patch)}
                    onRemove={() => removeCondition(cond.id)}
                  />
                </React.Fragment>
              ))}
            </div>

            <button
              onClick={addCondition}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition"
              style={{ borderColor: C.border, color: C.steel }}
            >
              <Plus size={14} /> Add condition
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg p-4" style={{ backgroundColor: colors.bg }}>
              <span className="text-sm font-medium" style={{ color: colors.fg }}>Then</span>
              <ArrowRight size={15} style={{ color: colors.fg }} />
              <span className="text-sm" style={{ color: colors.fg }}>Assign product</span>
              <div className="relative ml-auto min-w-[220px]">
                <select
                  value={group.product}
                  onChange={(e) => onUpdateGroup({ product: e.target.value })}
                  className="w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm font-semibold outline-none"
                  style={{ borderColor: C.border, color: C.ink }}
                >
                  {["Premium Car Loan", "Standard Car Loan", "Basic Car Loan", "Personal Loan", "Business Loan"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LoanProductAutoAssignment() {
  const [ruleName, setRuleName] = useState("Auto Loan Product Assignment");
  const [source, setSource] = useState("Customer Profile");
  const [category, setCategory] = useState("Credit");
  const [subcategory, setSubcategory] = useState("Credit Score");
  const [productLine, setProductLine] = useState("Auto Loan");

  const [groups, setGroups] = useState(initialGroups);
  const [expanded, setExpanded] = useState({ g1: true, g2: true, g3: true });

  const [settings, setSettings] = useState({
    matchMode: "stop", // 'stop' | 'multiple'
    defaultProduct: "Standard Car Loan",
    noMatchAction: "Manual Review",
  });

  const [savedFlash, setSavedFlash] = useState(false);

  const updateGroup = (id, patch) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const addGroup = () => {
    const id = uid();
    setGroups((gs) => [
      ...gs,
      {
        id,
        product: "Standard Car Loan",
        conditions: [{ id: uid(), field: FIELDS[0].id, operator: "gte", value: 0, join: null }],
      },
    ]);
    setExpanded((e) => ({ ...e, [id]: true }));
  };

  const duplicateGroup = (id) => {
    const src = groups.find((g) => g.id === id);
    const newId = uid();
    const copy = { ...src, id: newId, conditions: src.conditions.map((c) => ({ ...c, id: uid() })) };
    setGroups((gs) => {
      const idx = gs.findIndex((g) => g.id === id);
      const next = [...gs];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setExpanded((e) => ({ ...e, [newId]: true }));
  };

  const removeGroup = (id) => setGroups((gs) => gs.filter((g) => g.id !== id));

  const handleSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.canvas }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; font-feature-settings: 'tnum' 1, 'lnum' 1; }
        select, input, button { font-family: inherit; }
        ::selection { background: ${C.steelTint}; }
      `}</style>

      <div className="mx-auto px-5 py-8 sm:px-8 lg:px-10" style={{ maxWidth: 1080 }}>
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: C.slate }}>
              <span>Setup</span>
              <ChevronRight size={12} />
              <span style={{ color: C.ink }}>Product Assignment Rules</span>
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 500 }}>
              Loan Product Auto Assignment
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: C.slate }}>
              Configure rules that automatically assign the most suitable loan product to eligible customers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="text-sm font-medium" style={{ color: C.mint }}>Configuration saved</span>
            )}
            <button
              className="rounded-lg border px-4 py-2.5 text-sm font-medium transition"
              style={{ borderColor: C.border, color: C.inkSoft, backgroundColor: C.surface }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: C.steel }}
            >
              Save configuration
            </button>
          </div>
        </div>

        {/* rule metadata - split across clean rows */}
        <div className="mt-7 rounded-2xl border p-6" style={{ backgroundColor: C.surface, borderColor: C.border }}>
          <h2 className="text-base font-semibold" style={{ color: C.ink }}>Rule details</h2>
          <p className="mt-1 text-xs" style={{ color: C.slate }}>
            Identify this rule and the data it evaluates before defining conditions below.
          </p>

          <div className="mt-4">
            <LabeledInput label="Rule name" value={ruleName} onChange={setRuleName} placeholder="e.g., Auto Loan Product Assignment" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <LabeledSelect label="Source" value={source} onChange={setSource} options={["Customer Profile", "Loan Application", "Credit Bureau", "Employment Records", "Bank Statement"]} />
            <LabeledSelect label="Category" value={category} onChange={setCategory} options={["Income", "Credit", "Employment", "Collateral", "Repayment History", "Customer Profile"]} />
            <LabeledSelect label="Subcategory" value={subcategory} onChange={setSubcategory} options={["Credit Score", "Net Salary", "Debt-to-Income Ratio", "Collateral Value", "Payment History", "Employment Duration", "Customer Tenure"]} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <LabeledSelect label="Product line" value={productLine} onChange={setProductLine} options={["Auto Loan", "Personal Loan", "Mortgage", "Business Loan", "Education Loan"]} />
          </div>
        </div>

        {/* flow strip */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto rounded-full border px-5 py-3" style={{ backgroundColor: C.surfaceAlt, borderColor: C.border }}>
          {[
            { icon: User, label: "Customer data" },
            { icon: Layers, label: "Rule groups" },
            { icon: ListChecks, label: "Matching conditions" },
            { icon: ShieldCheck, label: "Product assignment" },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-shrink-0 items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: C.steelTint, color: C.steelDeep }}>
                  <step.icon size={14} />
                </div>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: C.inkSoft }}>{step.label}</span>
              </div>
              {i < arr.length - 1 && <div className="mx-1 h-px w-8 flex-shrink-0" style={{ backgroundColor: C.border }} />}
            </React.Fragment>
          ))}
        </div>

        {/* rule groups */}
        <div className="mt-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: C.ink }}>Rule groups</h2>
            <span className="text-xs" style={{ color: C.slate }}>Evaluated top to bottom &mdash; the first full match is assigned</span>
          </div>

          {groups.map((g, i) => (
            <RuleGroupCard
              key={g.id}
              group={g}
              index={i}
              expanded={!!expanded[g.id]}
              onToggleExpand={() => setExpanded((e) => ({ ...e, [g.id]: !e[g.id] }))}
              onUpdateGroup={(patch) => updateGroup(g.id, patch)}
              onDuplicate={() => duplicateGroup(g.id)}
              onRemove={() => removeGroup(g.id)}
            />
          ))}

          <button
            onClick={addGroup}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-sm font-medium transition"
            style={{ borderColor: C.border, color: C.steel, backgroundColor: C.surface }}
          >
            <Plus size={16} /> Add rule group
          </button>

          {/* global settings */}
          <div className="mt-2 rounded-2xl border p-6" style={{ backgroundColor: C.surface, borderColor: C.border }}>
            <div className="flex items-center gap-2">
              <Settings2 size={16} style={{ color: C.steel }} />
              <h2 className="text-base font-semibold" style={{ color: C.ink }}>Matching behavior</h2>
            </div>
            <p className="mt-1 text-xs" style={{ color: C.slate }}>
              Decide what happens when a customer qualifies for more than one product.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3.5"
                style={{ borderColor: settings.matchMode === "stop" ? C.steel : C.border, backgroundColor: settings.matchMode === "stop" ? C.steelTint : C.surface }}
              >
                <input type="radio" checked={settings.matchMode === "stop"} onChange={() => setSettings((s) => ({ ...s, matchMode: "stop" }))} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium" style={{ color: C.ink }}>Stop processing after match</span>
                  <span className="mt-0.5 block text-xs" style={{ color: C.slate }}>Assign the first matching product and stop checking further groups.</span>
                </span>
              </label>
              <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3.5"
                style={{ borderColor: settings.matchMode === "multiple" ? C.steel : C.border, backgroundColor: settings.matchMode === "multiple" ? C.steelTint : C.surface }}
              >
                <input type="radio" checked={settings.matchMode === "multiple"} onChange={() => setSettings((s) => ({ ...s, matchMode: "multiple" }))} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium" style={{ color: C.ink }}>Allow multiple matches</span>
                  <span className="mt-0.5 block text-xs" style={{ color: C.slate }}>Surface every product the customer qualifies for, not just one.</span>
                </span>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Default product"
                value={settings.defaultProduct}
                onChange={(v) => setSettings((s) => ({ ...s, defaultProduct: v }))}
                options={["Standard Car Loan", "Basic Car Loan", "Premium Car Loan"]}
              />
              <LabeledSelect
                label="If no rule matches"
                value={settings.noMatchAction}
                onChange={(v) => setSettings((s) => ({ ...s, noMatchAction: v }))}
                options={["Manual Review", "Assign default product", "Reject application"]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}