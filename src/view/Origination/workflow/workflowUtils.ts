/**
 * Local (editor) model for the loan workflow page. States are referenced by id
 * so they can be renamed freely; names are resolved only when saving to Frappe.
 */
export interface WfState {
  id: string;
  name: string;
  role: string;
  message: string;
  /** Drives the State Editor's bypass toggle — an inactive state is skipped. */
  active: boolean;
  /** Stored Frappe doc_status; only "2" (cancelled) is preserved, 0/1 are derived on save. */
  docStatus: string;
}

/** A rule's role is inherited from its "from" state unless roleOverride is set. */
export interface WfRule {
  id: string;
  from: string;
  action: string;
  to: string;
  roleOverride: string | null;
}

export type Anchor = { left: number; bottom: number } | { x: number; y: number };

export function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
  );
}

export const anchorFromElement = (el: Element): Anchor => {
  const rect = el.getBoundingClientRect();
  return { left: rect.left, bottom: rect.bottom };
};

// There is no "rejection" flag in the Frappe workflow schema, so it is inferred from the name.
export const isRejectionState = (s: WfState | undefined) => !!s && /reject|declin/i.test(s.name);

export type ActionTone = "reject" | "forward" | "neutral";

// Classifies an action pill by where it leads: reject (target is a rejection state),
// forward (target sits later in the pipeline), or neutral (return / lateral / unset).
export function actionTone(rule: WfRule, stateById: Record<string, WfState>, stateIndex: Record<string, number>): ActionTone {
  if (isRejectionState(stateById[rule.to])) return "reject";
  const fromIdx = stateIndex[rule.from];
  const toIdx = stateIndex[rule.to];
  if (fromIdx !== undefined && toIdx !== undefined && toIdx > fromIdx) return "forward";
  return "neutral";
}

export const TONE_STYLES: Record<ActionTone, { border: string; bg: string; text: string; icon: string; target: string; stroke: string }> = {
  reject: { border: "border-rose-200", bg: "bg-rose-50 hover:border-rose-300 hover:bg-rose-100", text: "text-rose-700", icon: "text-rose-400", target: "text-rose-600", stroke: "#e11d48" },
  forward: { border: "border-emerald-200", bg: "bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100", text: "text-emerald-700", icon: "text-emerald-400", target: "text-emerald-600", stroke: "#059669" },
  neutral: { border: "border-slate-200", bg: "bg-slate-50 hover:border-slate-300 hover:bg-white", text: "text-slate-700", icon: "text-slate-400", target: "text-slate-600", stroke: "#6366f1" },
};

export function initials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "?";
  const words = clean.split(/\s+/);
  if (words.length === 1) return clean.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
