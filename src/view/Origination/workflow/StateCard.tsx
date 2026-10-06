import { useRef, useState } from "react";
import { Select } from "@mantine/core";
import type React from "react";
import { IconArrowRight, IconGripVertical, IconPencil, IconPlus, IconUser } from "@tabler/icons-react";
import { actionTone, compactInputStyles, TONE_STYLES, type WfRule, type WfState } from "./workflowUtils";

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
      className={`relative flex w-57 shrink-0 flex-col rounded-lg border bg-white transition ${
        isDragOverTarget || isConnectDropTarget ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
      } ${state.active ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-1 px-2 pb-0.5 pt-2">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", state.id);
            if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 30, 20);
          }}
          className="cursor-grab rounded p-0.5 text-slate-300 hover:bg-slate-50 hover:text-slate-500"
          title="Drag to reorder"
        >
          <IconGripVertical size={12} />
        </span>
        <span title={state.name} className="block min-w-0 flex-1 truncate text-xs font-semibold text-slate-900">
          {state.name}
        </span>
        {(!state.active || isFinal) && (
          <span className={`shrink-0 rounded px-1.5 py-px text-[10px] font-medium ${!state.active ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"}`}>
            {!state.active ? "Inactive" : "Final"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-100 pb-2 pl-2 pr-3">
        <span className="flex w-4 shrink-0 justify-center text-slate-400">
          <IconUser size={11} />
        </span>
        {editingRole ? (
          <Select
            size="xs"
            radius="md"
            styles={compactInputStyles}
            className="min-w-0 flex-1"
            autoFocus
            defaultDropdownOpened
            searchable
            allowDeselect={false}
            data={roleOptions}
            value={state.role || null}
            onChange={(role) => {
              if (role) onRoleChange(role);
              setEditingRole(false);
            }}
            onBlur={() => setEditingRole(false)}
          />
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">{state.role || "No role set"}</span>
            <button onClick={() => setEditingRole(true)} title="Edit role" className="shrink-0 text-slate-300 hover:text-slate-600">
              <IconPencil size={10} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-2.5 py-2">
        {rules.length === 0 ? (
          <span className="text-[11px] italic text-slate-400">End of workflow</span>
        ) : (
          rules.map((r) => {
            const tone = TONE_STYLES[actionTone(r, stateById, stateIndex)];
            return (
              <button
                key={r.id}
                onClick={(e) => onEditRule(e, r.id)}
                className={`flex flex-wrap items-center justify-between gap-x-2 rounded-md border px-2 py-1 text-left ${tone.border} ${tone.bg}`}
              >
                <span className={`text-[11px] font-medium leading-4 ${tone.text}`}>{r.action || "Unnamed action"}</span>
                <span className={`flex items-center gap-0.5 text-[11px] leading-4 ${tone.icon}`}>
                  <IconArrowRight size={10} />
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
