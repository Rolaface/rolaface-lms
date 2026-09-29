import { useRef, useState } from "react";
import type React from "react";
import { IconArrowRight, IconGripVertical, IconPencil, IconPlus, IconUser } from "@tabler/icons-react";
import { actionTone, TONE_STYLES, type WfRule, type WfState } from "./workflowUtils";

interface StateCardProps {
  state: WfState;
  rules: WfRule[];
  stateById: Record<string, WfState>;
  stateIndex: Record<string, number>;
  roleOptions: string[];
  onRoleChange: (role: string) => void;
  onEditRule: (e: React.MouseEvent<HTMLElement>, ruleId: string) => void;
  isDragOverTarget: boolean;
  onDragOverReorder: (id: string | null) => void;
  onDropReorder: (draggedId: string, targetId: string) => void;
  onConnectStart: (e: React.MouseEvent<HTMLElement>, fromId: string) => void;
  isConnectDropTarget: boolean;
}

export function StateCard({
  state,
  rules,
  stateById,
  stateIndex,
  roleOptions,
  onRoleChange,
  onEditRule,
  isDragOverTarget,
  onDragOverReorder,
  onDropReorder,
  onConnectStart,
  isConnectDropTarget,
}: StateCardProps) {
  const isFinal = rules.length === 0;
  const cardRef = useRef<HTMLDivElement>(null);
  const [editingRole, setEditingRole] = useState(false);

  return (
    <div
      ref={cardRef}
      data-state-id={state.id}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverReorder(state.id);
      }}
      onDragLeave={() => onDragOverReorder(null)}
      onDrop={(e) => {
        e.preventDefault();
        onDropReorder(e.dataTransfer.getData("text/plain"), state.id);
        onDragOverReorder(null);
      }}
      className={`relative flex w-56 shrink-0 flex-col rounded-lg border bg-white transition ${
        isDragOverTarget || isConnectDropTarget ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
      } ${state.active ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-1 px-2 pt-1">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", state.id);
            if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 30, 20);
          }}
          className="cursor-grab rounded p-0.5 text-slate-300 hover:bg-slate-50 hover:text-slate-500"
          title="Drag to reorder"
        >
          <IconGripVertical size={13} />
        </span>
      </div>

      <div className="flex items-start gap-2 px-3 pb-1.5 pt-0.5">
        <span className="block min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{state.name}</span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
            !state.active ? "bg-slate-100 text-slate-500" : isFinal ? "bg-slate-800 text-white" : "bg-indigo-50 text-indigo-700"
          }`}
        >
          {!state.active ? "Inactive" : isFinal ? "Final" : "In progress"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 pb-2.5">
        <IconUser size={11} className="shrink-0 text-slate-400" />
        {editingRole ? (
          <select
            autoFocus
            value={state.role || ""}
            onChange={(e) => {
              onRoleChange(e.target.value);
              setEditingRole(false);
            }}
            onBlur={() => setEditingRole(false)}
            className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{state.role || "No role set"}</span>
            <button onClick={() => setEditingRole(true)} title="Edit role" className="shrink-0 text-slate-300 hover:text-slate-600">
              <IconPencil size={11} />
            </button>
          </>
        )}
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-1.5 px-3 pb-3">
        {rules.length === 0 ? (
          <span className="text-xs italic text-slate-400">End of workflow</span>
        ) : (
          rules.map((r) => {
            const tone = TONE_STYLES[actionTone(r, stateById, stateIndex)];
            return (
              <button
                key={r.id}
                onClick={(e) => onEditRule(e, r.id)}
                className={`flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-left text-xs ${tone.border} ${tone.bg}`}
              >
                <span className={`truncate font-medium ${tone.text}`}>{r.action || "Unnamed action"}</span>
                <span className={`flex shrink-0 items-center gap-1 ${tone.icon}`}>
                  <IconArrowRight size={11} />
                  <span className={tone.target}>{stateById[r.to]?.name || "Choose target"}</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <button
        onMouseDown={(e) => onConnectStart(e, state.id)}
        title="Drag to connect this state to another (or to empty space, to create one)"
        className="absolute -right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm hover:border-indigo-400 hover:text-indigo-500"
      >
        <IconPlus size={11} />
      </button>
    </div>
  );
}
