import { Switch } from "@mantine/core";
import { IconGripVertical, IconPlus } from "@tabler/icons-react";
import type React from "react";
import { initials, type WfState } from "./workflowUtils";

interface StateEditorProps {
  stateList: WfState[];
  dragOverId: string | null;
  onDragOverReorder: (id: string | null) => void;
  onDropReorder: (draggedId: string, targetId: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onEditState: (id: string) => void;
  onAddState: (e: React.MouseEvent<HTMLElement>) => void;
}

export function StateEditor({ stateList, dragOverId, onDragOverReorder, onDropReorder, onToggleActive, onEditState, onAddState }: StateEditorProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[13px] font-semibold text-slate-900">State Editor</h2>
        <span className="text-[11px] text-slate-400">Drag to reorder, toggle to bypass a state.</span>
      </div>

      <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
        {stateList.length === 0 ? (
          <p className="px-3 py-3 text-[11px] italic text-slate-400">No states here yet — add one below.</p>
        ) : (
          stateList.map((s, i) => (
            <div
              key={s.id}
              data-state-id={s.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
              onDragOver={(e) => {
                e.preventDefault();
                onDragOverReorder(s.id);
              }}
              onDragLeave={() => onDragOverReorder(null)}
              onDrop={(e) => {
                e.preventDefault();
                onDropReorder(e.dataTransfer.getData("text/plain"), s.id);
                onDragOverReorder(null);
              }}
              className={`flex cursor-grab items-center gap-2 px-3 py-1.5 active:cursor-grabbing ${i !== 0 ? "border-t border-slate-100" : ""} ${dragOverId === s.id ? "bg-indigo-50" : ""} ${s.active ? "" : "opacity-60"}`}
            >
              <span className="text-slate-300 hover:text-slate-500" title="Drag to reorder">
                <IconGripVertical size={14} />
              </span>
              <span className="w-4 shrink-0 text-center text-[11px] text-slate-400">{i + 1}</span>
              <button onClick={() => onEditState(s.id)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded px-1 py-0.5 text-left hover:bg-slate-50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">{initials(s.role || s.name)}</span>
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="shrink-0 text-xs font-semibold text-slate-900">{s.name}</span>
                  <span className="shrink-0 text-[11px] text-slate-500">{s.role || "No role set"}</span>
                  {s.message && <span className="min-w-0 truncate text-[11px] text-slate-400">{s.message}</span>}
                </span>
              </button>
              <Switch size="xs" checked={s.active} onChange={(e) => onToggleActive(s.id, e.currentTarget.checked)} aria-label={`Toggle ${s.name}`} />
            </div>
          ))
        )}
        <button
          onClick={onAddState}
          className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-slate-300 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <IconPlus size={12} /> <span className="text-xs font-medium">Add state</span>
        </button>
      </div>
    </div>
  );
}
