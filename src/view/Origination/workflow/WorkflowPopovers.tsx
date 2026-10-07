import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Button, Select } from "@mantine/core";
import { CreatableSelect } from "../../../components/CreatableSelect";
import { compactInputStyles, labelCls, type Anchor, type WfRule, type WfState } from "./workflowUtils";

export function Popover({ anchor, onClose, children, width = 300 }: { anchor: Anchor; onClose: () => void; children: React.ReactNode; width?: number }) {
  const style = useMemo(() => {
    let top = "bottom" in anchor ? anchor.bottom + 8 : anchor.y + 8;
    let left = "bottom" in anchor ? anchor.left : anchor.x;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - 320));
    return { top, left, width };
  }, [anchor, width]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[150]" onClick={onClose} />
      <div className="fixed z-[160] rounded-lg border border-slate-200 bg-white p-4 shadow-xl" style={style} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </>
  );
}

interface AddStatePopoverContentProps {
  existingStates: WfState[];
  stateById: Record<string, WfState>;
  stateNameOptions: string[];
  actionOptions: string[];
  roleOptions: string[];
  lockedFromId: string | null;
  onCreate: (input: { name: string; role: string; fromId: string | null; actionName: string | null }) => void;
  onClose: () => void;
}

export function AddStatePopoverContent({ existingStates, stateById, stateNameOptions, actionOptions, roleOptions, lockedFromId, onCreate, onClose }: AddStatePopoverContentProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("All");
  const [fromId, setFromId] = useState(lockedFromId || "");
  const [actionName, setActionName] = useState("");
  const [actionTouched, setActionTouched] = useState(false);

  const trimmed = name.trim();
  const duplicate = existingStates.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  const available = stateNameOptions.filter((n) => !existingStates.some((s) => s.name === n));

  function handleNameChange(v: string) {
    setName(v);
    if (!actionTouched) setActionName(v.trim() ? `Send to ${v.trim()}` : "");
  }

  const canSubmit = !!trimmed && !duplicate && (!fromId || !!actionName.trim());

  return (
    <div>
      <div className="mb-3">
        <span className={labelCls}>State name</span>
        <CreatableSelect data={available} value={name} onChange={handleNameChange} placeholder="Pick or type a state" width="100%" size="xs" />
        {duplicate && <p className="mt-1 text-[11px] text-rose-600">A state with this name already exists.</p>}
      </div>

      <div className="mb-3">
        <span className={labelCls}>Role</span>
        <Select size="xs" radius="md" styles={compactInputStyles} data={roleOptions} value={role} onChange={(v) => v && setRole(v)} allowDeselect={false} searchable />
      </div>

      {lockedFromId ? (
        <div className="mb-3 rounded-md border border-slate-200 p-2.5">
          <span className={labelCls}>Add action</span>
          <p className="mb-1.5 text-[11px] text-slate-500">From {stateById[lockedFromId]?.name}</p>
          <CreatableSelect data={actionOptions} value={actionName} onChange={(v) => { setActionName(v); setActionTouched(true); }} placeholder="Action name" width="100%" size="xs" />
        </div>
      ) : existingStates.length > 0 ? (
        <div className="mb-3 rounded-md border border-slate-200 p-2.5">
          <span className={labelCls}>Add action (optional)</span>
          <Select
            size="xs"
            radius="md"
            styles={compactInputStyles}
            mb={6}
            data={[{ value: "", label: "Don't connect yet" }, ...existingStates.map((s) => ({ value: s.id, label: `From ${s.name}` }))]}
            value={fromId}
            onChange={(v) => setFromId(v ?? "")}
            allowDeselect={false}
          />
          {fromId && (
            <CreatableSelect data={actionOptions} value={actionName} onChange={(v) => { setActionName(v); setActionTouched(true); }} placeholder="Action name" width="100%" size="xs" />
          )}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end gap-2">
        <Button size="xs" variant="subtle" color="slate" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="xs"
          color="brand"
          disabled={!canSubmit}
          onClick={() => onCreate({ name: trimmed, role, fromId: fromId || null, actionName: fromId ? actionName.trim() : null })}
        >
          Add state
        </Button>
      </div>
    </div>
  );
}

interface RulePopoverContentProps {
  rule: WfRule;
  fromState: WfState | undefined;
  states: WfState[];
  stateById: Record<string, WfState>;
  actionOptions: string[];
  roleOptions: string[];
  isNewRule: boolean;
  onSave: (patch: Partial<WfRule>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function RulePopoverContent({ rule, fromState, states, stateById, actionOptions, roleOptions, isNewRule, onSave, onDelete, onClose }: RulePopoverContentProps) {
  const [action, setAction] = useState(rule.action);
  const [to, setTo] = useState(rule.to);
  const [overrideOn, setOverrideOn] = useState(!!rule.roleOverride);
  const [roleVal, setRoleVal] = useState(rule.roleOverride || roleOptions[0] || "All");
  const [autoFollow, setAutoFollow] = useState(isNewRule);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleToChange(v: string) {
    setTo(v);
    if (autoFollow) {
      const name = stateById[v]?.name || "";
      setAction(name ? `Send to ${name}` : "");
    }
  }
  function handleActionChange(v: string) {
    setAction(v);
    setAutoFollow(false);
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-slate-400">From {fromState?.name || "—"}</p>

      <CreatableSelect data={actionOptions} value={action} onChange={handleActionChange} placeholder="Action name, e.g. Approve" width="100%" size="xs" />

      <Select
        size="xs"
        radius="md"
        styles={compactInputStyles}
        mt="xs"
        placeholder="Moves to…"
        data={states.filter((s) => s.id !== rule.from).map((s) => ({ value: s.id, label: s.name }))}
        value={to || null}
        onChange={(v) => handleToChange(v ?? "")}
        allowDeselect={false}
        searchable
      />

      <div className="mt-2 text-[11px] text-slate-500">
        {overrideOn ? (
          <div className="flex items-center gap-2">
            <Select size="xs" radius="md" styles={compactInputStyles} className="flex-1" data={roleOptions} value={roleVal} onChange={(v) => v && setRoleVal(v)} allowDeselect={false} searchable />
            <button onClick={() => setOverrideOn(false)} className="shrink-0 text-slate-400 hover:text-slate-600">
              Reset
            </button>
          </div>
        ) : (
          <button onClick={() => setOverrideOn(true)} className="text-slate-400 underline decoration-dotted hover:text-slate-600">
            Done by {fromState?.role || "no one set yet"} · override
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-medium">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-rose-700">Delete?</span>
            <button onClick={onDelete} className="text-rose-600">
              Yes
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="text-slate-500">
              No
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="text-rose-600 hover:text-rose-700">
            Delete
          </button>
        )}
        <div className="flex gap-2">
          <Button size="xs" variant="subtle" color="slate" onClick={onClose}>
            Cancel
          </Button>
          <Button size="xs" color="brand" disabled={!action.trim() || !to} onClick={() => onSave({ action: action.trim(), to, roleOverride: overrideOn ? roleVal : null })}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
