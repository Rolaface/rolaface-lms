import { useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { actionTone, isRejectionState, TONE_STYLES, type WfRule, type WfState } from "./workflowUtils";

const NODE_W = 150;
const NODE_H = 56;
const MIN_GAP = 90;
const PAD_X = 40;
const TOP_PAD = 24;
const ARC_BASE = 40; // apex height of an arc spanning one column
const ARC_STEP = 22; // extra height per additional column spanned
const REJECT_DROP = 130;

// Rough width of an 11px medium action pill; avoids measuring the DOM before layout.
const labelWidth = (text: string) => Math.ceil(text.length * 6.4) + 22;
const ZOOM_MIN = 0.3;
const FIT_ZOOM_MIN = 0.7;
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

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth);
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const mainNodes = states.filter((s) => !isRejectionState(s));
  const rejectNodes = states.filter((s) => isRejectionState(s));
  const mainCol = Object.fromEntries(mainNodes.map((s, i) => [s.id, i]));
  const drawable = rules.filter((r) => stateById[r.from] && stateById[r.to]);

  // Adjacent forward actions sit on the straight line between two cards, so the gap is sized to fit the longest one.
  const straightRules = drawable.filter((r) => mainCol[r.from] !== undefined && mainCol[r.to] === mainCol[r.from] + 1);
  const gap = Math.max(MIN_GAP, ...straightRules.map((r) => labelWidth(r.action || "Unnamed action") + 40));
  const colGap = NODE_W + gap;

  // Arcs above the row (returns, skips) grow with the number of columns they span; leave room for the tallest one.
  const arcRise = (span: number) => ARC_BASE + (span - 1) * ARC_STEP;
  const maxSpan = Math.max(0, ...drawable.filter((r) => mainCol[r.from] !== undefined && mainCol[r.to] !== undefined && !straightRules.includes(r)).map((r) => Math.abs(mainCol[r.to] - mainCol[r.from])));
  const mainY = (maxSpan > 0 ? arcRise(maxSpan) : 0) + TOP_PAD;
  const rejectY = mainY + NODE_H + REJECT_DROP;

  const mainWidth = Math.max(1, mainNodes.length) * colGap - gap;
  const rejectWidth = rejectNodes.length * colGap - gap;
  const rejectStartX = PAD_X + Math.max(0, (mainWidth - rejectWidth) / 2); // centre the rejection row under the pipeline

  const pos: Record<string, { x: number; y: number }> = {};
  mainNodes.forEach((s, i) => (pos[s.id] = { x: PAD_X + i * colGap, y: mainY }));
  rejectNodes.forEach((s, i) => (pos[s.id] = { x: rejectStartX + i * colGap, y: rejectY }));

  const width = PAD_X * 2 + Math.max(mainWidth, rejectWidth);
  const height = (rejectNodes.length > 0 ? rejectY : mainY) + NODE_H + 40;

  const fitZoom = containerWidth > 0 ? Math.min(1, Math.max(FIT_ZOOM_MIN, (containerWidth - 8) / width)) : 1;
  const zoom = manualZoom ?? fitZoom;

  const edges = drawable.map((r) => {
    const tone = actionTone(r, stateById, stateIndex);
    const from = pos[r.from];
    const to = pos[r.to];
    let d: string, labelX: number, labelY: number;
    if (straightRules.includes(r)) {
      const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
      const x2 = to.x, y2 = to.y + NODE_H / 2;
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
      labelX = (x1 + x2) / 2;
      labelY = y1;
    } else if (from.y === to.y) {
      // Same row but not adjacent (returns, skips): arc over the cards, label at the apex.
      const x1 = from.x + NODE_W / 2, x2 = to.x + NODE_W / 2, y = from.y;
      const rise = arcRise(Math.abs(mainCol[r.to] - mainCol[r.from]) || 1);
      d = `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - rise * 2}, ${x2} ${y}`;
      labelX = (x1 + x2) / 2;
      labelY = y - rise;
    } else {
      // Between rows (e.g. into a rejection state): the label sits just under the source card so each one stays readable.
      const down = to.y > from.y;
      const x1 = from.x + NODE_W / 2, y1 = down ? from.y + NODE_H : from.y;
      const x2 = to.x + NODE_W / 2, y2 = down ? to.y : to.y + NODE_H;
      const midY = (y1 + y2) / 2;
      d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      labelX = x1;
      labelY = y1 + (down ? 22 : -22);
    }
    return { rule: r, tone, d, labelX, labelY };
  });

  const zoomBtnCls = "rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">Click a state or action to edit it.</p>
        <div className="flex items-center gap-1 text-[11px]">
          <button onClick={() => setManualZoom(Math.max(ZOOM_MIN, Math.round((zoom - ZOOM_STEP) * 100) / 100))} disabled={zoom <= ZOOM_MIN} title="Zoom out" className={zoomBtnCls}>
            <IconMinus size={14} />
          </button>
          <button onClick={() => setManualZoom(null)} title="Reset zoom to fit" className="w-12 rounded border border-slate-200 px-1 py-1.5 text-center text-slate-500 hover:bg-slate-50">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setManualZoom(Math.min(ZOOM_MAX, Math.round((zoom + ZOOM_STEP) * 100) / 100))} disabled={zoom >= ZOOM_MAX} title="Zoom in" className={zoomBtnCls}>
            <IconPlus size={14} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-auto rounded-md border border-slate-100 bg-slate-50" style={{ maxHeight: 480 }}>
        {states.length === 0 ? (
          <p className="p-4 text-xs text-slate-400">No states yet.</p>
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
                    className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 ${cls.border} ${cls.bg} ${cls.text}`}
                    style={{ left: g.labelX, top: g.labelY }}
                  >
                    <span className="text-[11px] font-medium leading-4">{g.rule.action || "Unnamed action"}</span>
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
                  <span className="max-w-full truncate text-xs font-semibold text-slate-900">{s.name}</span>
                  <span className="max-w-full truncate text-[11px] text-slate-500">{s.role || "No role set"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
