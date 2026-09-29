import { useEffect, useState } from "react";
import { IconAlertTriangle, IconCheck, IconChevronDown, IconChevronUp, IconCopy, IconTrash, IconX } from "@tabler/icons-react";
import { CreatableSelect } from "../../../components/CreatableSelect";
import { inputCls, type WfState } from "./workflowUtils";

interface StateDrawerProps {
  state: WfState;
  otherStateNames: string[];
  stateNameOptions: string[];
  roleOptions: string[];
  relatedActionCount: number;
  onCancel: () => void;
  onSave: (patch: Partial<WfState>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function StateDrawer({
  state,
  otherStateNames,
  stateNameOptions,
  roleOptions,
  relatedActionCount,
  onCancel,
  onSave,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: StateDrawerProps) {
  const [form, setForm] = useState({ name: state.name, role: state.role, message: state.message });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const trimmedName = form.name.trim();
  const duplicateName = otherStateNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase());
  const canSave = !!trimmedName && !duplicateName;

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-slate-900/20" onClick={onCancel} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">More options — {state.name}</h3>
          <button onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <IconX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-center gap-1">
            <button onClick={onMoveUp} className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50">
              <IconChevronUp size={14} />
            </button>
            <button onClick={onMoveDown} className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50">
              <IconChevronDown size={14} />
            </button>
            <span className="text-xs text-slate-400">Reorder in the flow (or drag its card)</span>
          </div>

          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">State name</span>
            <CreatableSelect data={stateNameOptions} value={form.name} onChange={(name) => setForm({ ...form, name })} width="100%" size="sm" />
            {duplicateName && <p className="mt-1 text-xs text-rose-600">Another state already uses this name.</p>}
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Role</span>
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Instructions shown at this state</span>
            <textarea className={inputCls} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          {confirming ? (
            <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800">
              <p className="mb-2 flex items-center gap-1.5 font-medium">
                <IconAlertTriangle size={13} /> Delete "{state.name}"?
              </p>
              {relatedActionCount > 0 && <p className="mb-2 text-rose-700">This also removes {relatedActionCount} action(s) connected to it.</p>}
              <div className="flex gap-2">
                <button onClick={onDelete} className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700">
                  Delete state
                </button>
                <button onClick={() => setConfirming(false)} className="rounded-md px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700">
                  <IconTrash size={14} /> Delete
                </button>
                <button onClick={onDuplicate} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
                  <IconCopy size={14} /> Duplicate
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={onCancel} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  disabled={!canSave}
                  onClick={() => onSave({ ...form, name: trimmedName })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-900 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconCheck size={14} /> Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
