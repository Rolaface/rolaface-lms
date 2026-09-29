import { useEffect, useRef, useState } from "react";
import type React from "react";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { actionTone, isRejectionState, TONE_STYLES, type WfRule, type WfState } from "./workflowUtils";

const NODE_W = 150;
const NODE_H = 56;
const COL_GAP = 210;
const PAD_X = 40;
const MAIN_Y = 50;
const REJECT_Y = 220;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.15;

interface WorkflowTreeViewProps {
  states: WfState[];
  rules: WfRule[];
  stateById: Record<string, WfState>;
  stateIndex: Record<string, number>;
  onEditState: (id: string) => void;
  onEditRule: (e: React.MouseEvent<HTMLElement>, ruleId: string) => void;
}

export function WorkflowTreeView({ states, rules, stateById, stateIndex, onEditState, onEditRule }: WorkflowTreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [manualZoom, setManualZoom] = useState<number | null>(null); // null = auto-fit to the panel

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const mainNodes = states.filter((s) => !isRejectionState(s));
  const rejectNodes = states.filter((s) => isRejectionState(s));

  const pos: Record<string, { x: number; y: number }> = {};
  mainNodes.forEach((s, i) => (pos[s.id] = { x: PAD_X + i * COL_GAP, y: MAIN_Y }));
  rejectNodes.forEach((s, i) => (pos[s.id] = { x: PAD_X + i * COL_GAP, y: REJECT_Y }));

  const colCount = Math.max(mainNodes.length, rejectNodes.length, 1);
  const width = PAD_X * 2 + (colCount - 1) * COL_GAP + NODE_W;
  const height = (rejectNodes.length > 0 ? REJECT_Y : MAIN_Y) + NODE_H + 40;

  const fitZoom = containerWidth > 0 ? Math.min(1, Math.max(ZOOM_MIN, (containerWidth - 8) / width)) : 1;
  const zoom = manualZoom ?? fitZoom;

  const edges = rules
    .filter((r) => pos[r.from] && pos[r.to])
    .map((r) => {
      const tone = actionTone(r, stateById, stateIndex);
      const from = pos[r.from];
      const to = pos[r.to];
      let d: string, labelX: number, labelY: number;
      if (tone === "reject") {
        const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H;
        const x2 = to.x + NODE_W / 2, y2 = to.y;
        const midY = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${midY + 20}, ${x2} ${midY - 20}, ${x2} ${y2}`;
        labelX = (x1 + x2) / 2;
        labelY = midY;
      } else if (to.x >= from.x) {
        const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
        const x2 = to.x, y2 = to.y + NODE_H / 2;
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
        labelX = (x1 + x2) / 2;
        labelY = y1 - 12;
      } else {
        const x1 = from.x + NODE_W / 2, y1 = from.y;
        const x2 = to.x + NODE_W / 2, y2 = to.y;
        const arcY = Math.min(y1, y2) - 55;
        d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${arcY}, ${x2} ${y2}`;
        labelX = (x1 + x2) / 2;
        labelY = arcY + 8;
      }
      return { rule: r, tone, d, labelX, labelY };
    });

  const zoomBtnCls = "rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">Click a state or action to edit it.</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setManualZoom(Math.max(ZOOM_MIN, Math.round((zoom - ZOOM_STEP) * 100) / 100))} disabled={zoom <= ZOOM_MIN} title="Zoom out" className={zoomBtnCls}>
            <IconMinus size={14} />
          </button>
          <button onClick={() => setManualZoom(null)} title="Reset zoom to fit" className="w-12 rounded border border-slate-200 px-1 py-1.5 text-center text-xs text-slate-500 hover:bg-slate-50">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setManualZoom(Math.min(ZOOM_MAX, Math.round((zoom + ZOOM_STEP) * 100) / 100))} disabled={zoom >= ZOOM_MAX} title="Zoom in" className={zoomBtnCls}>
            <IconPlus size={14} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-auto rounded-md border border-slate-100 bg-slate-50" style={{ maxHeight: 480 }}>
        {states.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No states yet.</p>
        ) : (
          <div style={{ width: width * zoom, height: height * zoom }}>
            <div className="relative" style={{ width, height, transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
              <svg className="absolute inset-0" width={width} height={height}>
                <defs>
                  {(Object.keys(TONE_STYLES) as (keyof typeof TONE_STYLES)[]).map((tone) => (
                    <marker key={tone} id={`wf-arrow-${tone}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={TONE_STYLES[tone].stroke} />
                    </marker>
                  ))}
                </defs>
                {edges.map((g) => (
                  <path key={g.rule.id} d={g.d} fill="none" stroke={TONE_STYLES[g.tone].stroke} strokeWidth="2" markerEnd={`url(#wf-arrow-${g.tone})`} />
                ))}
              </svg>

              {edges.map((g) => {
                const cls = TONE_STYLES[g.tone];
                return (
                  <button
                    key={`label-${g.rule.id}`}
                    onClick={(e) => onEditRule(e, g.rule.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls.border} ${cls.bg} ${cls.text}`}
                    style={{ left: g.labelX, top: g.labelY }}
                  >
                    {g.rule.action || "Unnamed action"}
                  </button>
                );
              })}

              {[...mainNodes, ...rejectNodes].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onEditState(s.id)}
                  className={`absolute flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-center shadow-sm hover:border-indigo-400 hover:shadow ${s.active ? "" : "opacity-60"}`}
                  style={{ left: pos[s.id].x, top: pos[s.id].y, width: NODE_W, height: NODE_H }}
                >
                  <span className="max-w-full truncate text-sm font-semibold text-slate-900">{s.name}</span>
                  <span className="max-w-full truncate text-xs text-slate-500">{s.role || "No role set"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
