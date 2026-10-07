import { useState, useEffect, useMemo, useCallback } from "react";
import type React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Center, Loader } from "@mantine/core";
import { IconArrowRight, IconGitBranch, IconLayoutGrid, IconPlus, IconX } from "@tabler/icons-react";
import { getWorkflow, saveWorkflow, getWorkflowStates, getWorkflowActionMasters, getRoles } from "../../api/workflowApi";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { StateCard } from "./workflow/StateCard";
import { StateEditor } from "./workflow/StateEditor";
import { StateDrawer } from "./workflow/StateDrawer";
import { WorkflowTreeView } from "./workflow/WorkflowTreeView";
import { AddStatePopoverContent, Popover, RulePopoverContent } from "./workflow/WorkflowPopovers";
import { anchorFromElement, isRejectionState, uuidv4, type Anchor, type WfRule, type WfState } from "./workflow/workflowUtils";

type PopoverState = { type: "rule"; id: string; anchor: Anchor } | { type: "addState"; anchor: Anchor; lockedFromId: string | null };

const doctype = "Custom LOS Loan Application";
const workflowName = "Custom LOS Loan Application Workflow";

interface ApiWorkflow {
  states: { state: string; doc_status?: string | number; allow_edit?: string; message?: string; is_active?: number | string | null }[];
  transitions: { from_state: string; action: string; to_state: string; allowed?: string }[];
}

function toLocalModel(data: ApiWorkflow): { states: WfState[]; rules: WfRule[] } {
  const states: WfState[] = data.states.map((s) => ({
    id: uuidv4(),
    name: s.state,
    role: s.allow_edit || "All",
    message: s.message || "",
    active: s.is_active === undefined || s.is_active === null ? true : !!Number(s.is_active),
    docStatus: String(s.doc_status ?? "0"),
  }));
  const byName = Object.fromEntries(states.map((s) => [s.name, s]));
  const rules: WfRule[] = data.transitions
    .filter((t) => byName[t.from_state] && byName[t.to_state])
    .map((t) => {
      const from = byName[t.from_state];
      return {
        id: uuidv4(),
        from: from.id,
        action: t.action,
        to: byName[t.to_state].id,
        roleOverride: t.allowed && t.allowed !== from.role ? t.allowed : null,
      };
    });
  return { states, rules };
}

const showAlert =(heading: string, body: string, color: "success" | "danger" | "warning") =>
  openCommonModal({ heading, subtitle: "", body, color, buttons: [{ label: "Close", color }] });

export function WorkflowConfiguration() {
  const queryClient = useQueryClient();
  const [states, setStates] = useState<WfState[]>([]);
  const [rules, setRules] = useState<WfRule[]>([]);
  const [view, setView] = useState<"flow" | "tree">("flow");
  const [dirty, setDirty] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [drawerStateId, setDrawerStateId] = useState<string | null>(null);
  const [justCreatedRuleId, setJustCreatedRuleId] = useState<string | null>(null);

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [linePos, setLinePos] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

  const { data: dbStates = [] } = useQuery<string[]>({ queryKey: ["workflow-states"], queryFn: getWorkflowStates });
  const { data: dbActions = [] } = useQuery<string[]>({ queryKey: ["workflow-actions"], queryFn: getWorkflowActionMasters });
  const { data: dbRoles = ["All"] } = useQuery<string[]>({ queryKey: ["roles"], queryFn: getRoles });

  const { data: workflowData, isError, refetch } = useQuery<ApiWorkflow>({
    queryKey: ["workflow-configuration", doctype],
    queryFn: () => getWorkflow(doctype),
  });

  // Reset the local editor model whenever a fresh copy of the workflow arrives from the server.
  const [loadedData, setLoadedData] = useState<ApiWorkflow | null>(null);
  if (workflowData && workflowData !== loadedData) {
    setLoadedData(workflowData);
    const local = toLocalModel(workflowData);
    setStates(local.states);
    setRules(local.rules);
    setDirty(false);
  }

  const roleOptions = useMemo(
    () => Array.from(new Set(["All", ...dbRoles, ...states.map((s) => s.role), ...rules.map((r) => r.roleOverride)].filter((r): r is string => !!r))),
    [dbRoles, states, rules]
  );
  const stateNameOptions = useMemo(() => Array.from(new Set([...dbStates, ...states.map((s) => s.name)])), [dbStates, states]);
  const actionOptions = useMemo(() => Array.from(new Set([...dbActions, ...rules.map((r) => r.action).filter(Boolean)])), [dbActions, rules]);

  const stateById = useMemo(() => Object.fromEntries(states.map((s) => [s.id, s])), [states]);
  const rulesFrom = (id: string) => rules.filter((r) => r.from === id);

  const mainRow = states.filter((s) => !isRejectionState(s));
  const stateIndex = Object.fromEntries(mainRow.map((s, i) => [s.id, i])); // position in the pipeline — used to color forward-moving actions

  const markDirty = () => setDirty(true);

  useEffect(() => {
    if (!connectFromId) return;
    function findCard(e: MouseEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      return { el, card: el?.closest("[data-state-id]") ?? null };
    }
    function onMove(e: MouseEvent) {
      setLinePos((p) => ({ ...p, x2: e.clientX, y2: e.clientY }));
      setHoverTargetId(findCard(e).card?.getAttribute("data-state-id") ?? null);
    }
    function onUp(e: MouseEvent) {
      const { el, card } = findCard(e);
      const targetId = card?.getAttribute("data-state-id");
      if (card && targetId && targetId !== connectFromId) {
        const id = uuidv4();
        setRules((prev) => [...prev, { id, from: connectFromId!, action: `Send to ${stateById[targetId]?.name || ""}`, to: targetId, roleOverride: null }]);
        setJustCreatedRuleId(id);
        setDirty(true);
        setShowHint(false);
        setPopover({ type: "rule", id, anchor: anchorFromElement(card) });
      } else if (!card && el?.closest("[data-flow-canvas]")) {
        setShowHint(false);
        setPopover({ type: "addState", anchor: { x: e.clientX, y: e.clientY }, lockedFromId: connectFromId });
      }
      setConnectFromId(null);
      setHoverTargetId(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [connectFromId, stateById]);

  const closePopover = useCallback(() => {
    setPopover(null);
    setJustCreatedRuleId(null);
  }, []);
  const closeDrawer = useCallback(() => setDrawerStateId(null), []);

  const openRulePopover = (e: React.MouseEvent<HTMLElement>, id: string) => setPopover({ type: "rule", id, anchor: anchorFromElement(e.currentTarget) });
  const openAddStatePopover = (e: React.MouseEvent<HTMLElement>) => setPopover({ type: "addState", anchor: anchorFromElement(e.currentTarget), lockedFromId: null });

  function createState({ name, role, fromId, actionName }: { name: string; role: string; fromId: string | null; actionName: string | null }) {
    const id = uuidv4();
    setStates((prev) => [...prev, { id, name, role, message: "", active: true, docStatus: "0" }]);
    if (fromId && actionName) {
      setRules((prev) => [...prev, { id: uuidv4(), from: fromId, action: actionName, to: id, roleOverride: null }]);
    }
    markDirty();
    closePopover();
  }

  function saveState(id: string, patch: Partial<WfState>) {
    setStates((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    markDirty();
  }
  function saveRule(id: string, patch: Partial<WfRule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    markDirty();
  }
  function deleteState(id: string) {
    setStates((prev) => prev.filter((s) => s.id !== id));
    setRules((prev) => prev.filter((r) => r.from !== id && r.to !== id));
    markDirty();
    setDrawerStateId(null);
    closePopover();
  }
  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    markDirty();
    closePopover();
  }
  function duplicateState(id: string) {
    setStates((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      let name = `${prev[idx].name} copy`;
      for (let n = 2; prev.some((s) => s.name === name); n++) name = `${prev[idx].name} copy ${n}`;
      const copy = [...prev];
      copy.splice(idx + 1, 0, { ...prev[idx], id: uuidv4(), name, docStatus: "0" });
      return copy;
    });
    markDirty();
  }
  function reorderStates(draggedId: string, targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setStates((prev) => {
      const dragIdx = prev.findIndex((s) => s.id === draggedId);
      const targetIdx = prev.findIndex((s) => s.id === targetId);
      if (dragIdx === -1 || targetIdx === -1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(dragIdx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
    markDirty();
    setShowHint(false);
  }
  function handleConnectStart(e: React.MouseEvent<HTMLElement>, fromId: string) {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setLinePos({ x1: rect.left + rect.width / 2, y1: rect.top + rect.height / 2, x2: e.clientX, y2: e.clientY });
    setConnectFromId(fromId);
  }

  const saveMutation = useMutation({
    mutationFn: saveWorkflow,
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["workflow-configuration", doctype] });
      queryClient.invalidateQueries({ queryKey: ["workflow-states"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-actions"] });
      showAlert("Saved successfully", "Workflow configuration updated.", "success");
    },
    onError: (err: Error) => showAlert("Save Failed", err.message ||"An error occurred while saving.", "danger"),
  });

  const handleSave = () => {
    if (states.some((s) => !s.name.trim())) {
      showAlert("Validation Error", "All states must have a name.", "warning");
      return;
    }
    if (rules.some((r) => !r.action.trim() || !stateById[r.to])) {
      showAlert("Validation Error", "Every action needs a name and a target state.", "warning");
      return;
    }

    saveMutation.mutate({
      doctype,
      workflow_name: workflowName,
      // A state with no outgoing actions is the end of the workflow, so it is saved as Final (doc_status 1).
      states: states.map((s) => ({
        state: s.name,
        doc_status: s.docStatus === "2" ? "2" : rulesFrom(s.id).length === 0 ? "1" : "0",
        allow_edit: s.role || "All",
        message: s.message,
        is_active: s.active ? 1 : 0,
      })),
      transitions: rules.map((r) => ({
        from_state: stateById[r.from].name,
        action: r.action,
        to_state: stateById[r.to].name,
        allowed: r.roleOverride || stateById[r.from].role || "All",
      })),
      is_active: 1,
    });
  };

  if (!loadedData) {
    return (
      <Center h="100%">
        {isError ? (
          <div className="text-center">
            <p className="text-xs text-rose-700">Failed to load the workflow configuration.</p>
            <Button mt="sm" size="xs" variant="default" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <Loader />
        )}
      </Center>
    );
  }

  const popoverRule = popover?.type === "rule" ? rules.find((r) => r.id === popover.id) : undefined;
  const drawerState = drawerStateId ? stateById[drawerStateId] : undefined;
  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-1 rounded px-2.5 py-1 ${active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900">Loan application workflow</h1>
            <p className="text-xs text-slate-500">States an application moves through, who owns each one, and what happens next.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {dirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved
              </span>
            )}
            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs font-medium">
              <button onClick={() => setView("flow")} className={tabCls(view === "flow")}>
                <IconLayoutGrid size={13} /> Flow
              </button>
              <button onClick={() => setView("tree")} className={tabCls(view === "tree")}>
                <IconGitBranch size={13} /> Tree
              </button>
            </div>
            <button
              onClick={openAddStatePopover}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
            >
              <IconPlus size={13} /> Add state
            </button>
            <Button size="xs" color="brand" onClick={handleSave} loading={saveMutation.isPending}>
              Save workflow
            </Button>
          </div>
        </div>

        {view === "flow" && showHint && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-indigo-50 px-3 py-1.5 text-[11px] text-indigo-700">
            <span>Drag a card's grip to reorder. Drag its + onto another card to connect, or onto empty space to create a connected state.</span>
            <button onClick={() => setShowHint(false)} className="shrink-0 text-indigo-400 hover:text-indigo-600">
              <IconX size={12} />
            </button>
          </div>
        )}

        {/* FLOW VIEW */}
        {view === "flow" && (
          <div className="mt-3 space-y-4" data-flow-canvas="true">
            {mainRow.length === 0 ? (
              <p className="text-xs text-slate-400">No states yet — add one to get started.</p>
            ) : (
              <div className="-ml-1 overflow-hidden py-1 pl-1 pr-3">
                <div className="-ml-11 flex flex-wrap items-stretch gap-y-3">
                  {mainRow.map((s) => (
                    <div key={s.id} className="relative flex items-stretch pl-11">
                      <div className="absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
                        <IconArrowRight size={14} />
                      </div>
                      <StateCard
                        state={s}
                        rules={rulesFrom(s.id)}
                        stateById={stateById}
                        stateIndex={stateIndex}
                        roleOptions={roleOptions}
                        onRoleChange={(role) => saveState(s.id, { role })}
                        onEditRule={openRulePopover}
                        isDragOverTarget={dragOverId === s.id}
                        onDragOverReorder={setDragOverId}
                        onDropReorder={reorderStates}
                        onConnectStart={handleConnectStart}
                        isConnectDropTarget={!!connectFromId && connectFromId !== s.id && hoverTargetId === s.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <StateEditor
              stateList={states}
              dragOverId={dragOverId}
              onDragOverReorder={setDragOverId}
              onDropReorder={reorderStates}
              onToggleActive={(id, active) => saveState(id, { active })}
              onEditState={setDrawerStateId}
              onAddState={openAddStatePopover}
            />
          </div>
        )}

        {/* TREE PREVIEW */}
        {view === "tree" && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <WorkflowTreeView states={states} rules={rules} stateById={stateById} stateIndex={stateIndex} onEditState={setDrawerStateId} onEditRule={openRulePopover} />
          </div>
        )}
      </div>

      {/* connect-drag overlay */}
      {connectFromId && (
        <>
          <svg className="pointer-events-none fixed inset-0 z-[140] h-full w-full">
            <line x1={linePos.x1} y1={linePos.y1} x2={linePos.x2} y2={linePos.y2} stroke="#4338ca" strokeWidth="2" strokeDasharray="5 4" />
            <circle cx={linePos.x2} cy={linePos.y2} r="4" fill="#4338ca" />
          </svg>
          <div className="pointer-events-none fixed left-1/2 top-4 z-[140] -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            Drop on a state to connect, or on empty space to create one
          </div>
        </>
      )}

      {/* Quick-edit popovers */}
      {popover?.type === "addState" && (
        <Popover anchor={popover.anchor} onClose={closePopover} width={300}>
          <AddStatePopoverContent
            existingStates={states}
            stateById={stateById}
            stateNameOptions={stateNameOptions}
            actionOptions={actionOptions}
            roleOptions={roleOptions}
            lockedFromId={popover.lockedFromId}
            onCreate={createState}
            onClose={closePopover}
          />
        </Popover>
      )}
      {popover?.type === "rule" && popoverRule && (
        <Popover anchor={popover.anchor} onClose={closePopover}>
          <RulePopoverContent
            rule={popoverRule}
            fromState={stateById[popoverRule.from]}
            states={states}
            stateById={stateById}
            actionOptions={actionOptions}
            roleOptions={roleOptions}
            isNewRule={justCreatedRuleId === popoverRule.id}
            onClose={closePopover}
            onSave={(patch) => {
              saveRule(popoverRule.id, patch);
              closePopover();
            }}
            onDelete={() => deleteRule(popoverRule.id)}
          />
        </Popover>
      )}

      {/* Full "more options" drawer — states only */}
      {drawerState && (
        <StateDrawer
          key={drawerState.id}
          state={drawerState}
          otherStateNames={states.filter((s) => s.id !== drawerState.id).map((s) => s.name)}
          stateNameOptions={stateNameOptions}
          roleOptions={roleOptions}
          relatedActionCount={rules.filter((r) => r.from === drawerState.id || r.to === drawerState.id).length}
          onCancel={closeDrawer}
          onSave={(patch) => {
            saveState(drawerState.id, patch);
            closeDrawer();
          }}
          onDelete={() => deleteState(drawerState.id)}
          onDuplicate={() => {
            duplicateState(drawerState.id);
            closeDrawer();
          }}
        />
      )}
    </div>
  );
}
