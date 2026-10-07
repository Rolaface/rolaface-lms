import { useEffect, useState } from "react";
import { Button, Select, Textarea } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconCopy, IconTrash, IconX } from "@tabler/icons-react";
import { CreatableSelect } from "../../../components/CreatableSelect";
import { compactInputStyles, labelCls, type WfState } from "./workflowUtils";

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
          <h3 className="text-[13px] font-semibold text-slate-900">More options — {state.name}</h3>
          <button onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <IconX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3">
            <span className={labelCls}>State name</span>
            <CreatableSelect data={stateNameOptions} value={form.name} onChange={(name) => setForm({ ...form, name })} width="100%" size="xs" />
            {duplicateName && <p className="mt-1 text-[11px] text-rose-600">Another state already uses this name.</p>}
          </div>

          <div className="mb-3">
            <span className={labelCls}>Role</span>
            <Select size="xs" radius="md" styles={compactInputStyles} data={roleOptions} value={form.role} onChange={(role) => role && setForm({ ...form, role })} allowDeselect={false} searchable />
          </div>

          <span className={labelCls}>Instructions shown at this state</span>
          <Textarea size="xs" radius="md" styles={compactInputStyles} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.currentTarget.value })} />
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          {confirming ? (
            <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800">
              <p className="mb-2 flex items-center gap-1.5 font-medium">
                <IconAlertTriangle size={13} /> Delete "{state.name}"?
              </p>
              {relatedActionCount > 0 && <p className="mb-2 text-rose-700">This also removes {relatedActionCount} action(s) connected to it.</p>}
              <div className="flex gap-2">
                <Button size="xs" color="red" onClick={onDelete}>
                  Delete state
                </Button>
                <Button size="xs" variant="subtle" color="slate" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs font-medium">
                <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700">
                  <IconTrash size={13} /> Delete
                </button>
                <button onClick={onDuplicate} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
                  <IconCopy size={13} /> Duplicate
                </button>
              </div>
              <div className="flex gap-2">
                <Button size="xs" variant="subtle" color="slate" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="xs" color="brand" disabled={!canSave} onClick={() => onSave({ ...form, name: trimmedName })} leftSection={<IconCheck size={14} />}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
