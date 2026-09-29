import { Switch } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconGripVertical, IconPlus } from "@tabler/icons-react";
import type React from "react";
import { initials, type WfState } from "./workflowUtils";

interface StateEditorProps {
  stateList: WfState[];
  dragOverId: string | null;
  onDragOverReorder: (id: string | null) => void;
  onDropReorder: (draggedId: string, targetId: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onEditState: (id: string) => void;
  onAddState: (e: React.MouseEvent<HTMLElement>) => void;
}

export function StateEditor({ stateList, dragOverId, onDragOverReorder, onDropReorder, onMove, onToggleActive, onEditState, onAddState }: StateEditorProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">State Editor</h2>
      <p className="mt-0.5 text-xs text-slate-500">Drag to reorder, bypass to skip a state.</p>

      <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
        {stateList.length === 0 ? (
          <p className="px-4 py-4 text-xs italic text-slate-400">No states here yet — add one below.</p>
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
              className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? "border-t border-slate-100" : ""} ${dragOverId === s.id ? "bg-indigo-50" : ""} ${s.active ? "" : "opacity-60"}`}
            >
              <span className="cursor-grab text-slate-300 hover:text-slate-500" title="Drag to reorder">
                <IconGripVertical size={14} />
              </span>
              <span className="w-4 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
              <button onClick={() => onEditState(s.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded px-1 py-1 text-left hover:bg-slate-50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{initials(s.role || s.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {s.role || "No role set"}
                    {s.message ? ` · ${s.message}` : ""}
                  </span>
                </span>
              </button>
              <Switch size="sm" checked={s.active} onChange={(e) => onToggleActive(s.id, e.currentTarget.checked)} aria-label={`Toggle ${s.name}`} />
              <button
                disabled={i === 0}
                onClick={() => onMove(s.id, -1)}
                className="rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <IconChevronUp size={14} />
              </button>
              <button
                disabled={i === stateList.length - 1}
                onClick={() => onMove(s.id, 1)}
                className="rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <IconChevronDown size={14} />
              </button>
            </div>
          ))
        )}
        <button
          onClick={onAddState}
          className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-slate-300 px-4 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <IconPlus size={12} /> Add state
        </button>
      </div>
    </div>
  );
}
