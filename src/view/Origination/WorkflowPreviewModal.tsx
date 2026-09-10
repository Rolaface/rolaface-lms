import { useEffect, useRef, useState } from "react";
import { Modal, Box, Center, Loader, Text } from "@mantine/core";

interface WorkflowPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  states: any[];
  transitions: any[];
}

let renderCounter = 0;

const getDeterministicColorPair = (str: string) => {
  if (!str) {
    return {
      stroke: "#adb5bd",
      fill: "#f8f9fa",
    };
  }

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palettes = [
    { stroke: "#3B82F6", fill: "#DBEAFE" },
    { stroke: "#4f46e5", fill: "#e0e7ff" },
    { stroke: "#06b6d4", fill: "#cffafe" },
    { stroke: "#14b8a6", fill: "#ccfbf1" },
    { stroke: "#10b981", fill: "#d1fae5" },
    { stroke: "#f59e0b", fill: "#fef3c7" },
    { stroke: "#8b5cf6", fill: "#ede9fe" },
    { stroke: "#ec4899", fill: "#fce7f3" },
    { stroke: "#7c3aed", fill: "#ede9fe" },
    { stroke: "#f97316", fill: "#ffedd5" },
  ];

  return palettes[Math.abs(hash) % palettes.length];
};

const sanitizeStateId = (value: string) => {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
};

export function WorkflowPreviewModal({
  opened,
  onClose,
  states,
  transitions,
}: WorkflowPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!opened) return;

    setLoading(true);

    let graphDef = "graph LR\n";

    // States
    states.forEach((s) => {
      if (s.state?.trim()) {
        const stateName = s.state.trim();
        const safeState = sanitizeStateId(stateName);

        const colors = getDeterministicColorPair(stateName);
        const isFinal = s.doc_status === "1";

        const strokeWidth = isFinal ? "3px" : "2px";

        const style = [
          `fill:${colors.fill}`,
          `stroke:${colors.stroke}`,
          `stroke-width:${strokeWidth}`,
          "color:#1e293b",
        ].join(",");

        graphDef += `  ${safeState}("${stateName}")\n`;
        graphDef += `  style ${safeState} ${style}\n`;
      }
    });

    // Transitions
    transitions.forEach((t, index) => {
      if (t.from_state && t.to_state && t.action) {
        const fromState = t.from_state.trim();
        const toState = t.to_state.trim();
        const action = t.action.trim();

        const safeFrom = sanitizeStateId(fromState);
        const safeTo = sanitizeStateId(toState);

        const colors = getDeterministicColorPair(action);

        graphDef += `  ${safeFrom} -->|"${action}"| ${safeTo}\n`;
        graphDef += `  linkStyle ${index} stroke:${colors.stroke},stroke-width:2px,color:#1e293b\n`;
      }
    });

    // Empty workflow
    if (states.length === 0 && transitions.length === 0) {
      graphDef += `  Empty("No workflow defined")\n`;
    }

    const renderGraph = async () => {
      const w = window as any;

      if (!w.mermaid) {
        setLoading(false);
        return;
      }

      try {
        w.mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            lineColor: "#adb5bd",
            textColor: "#495057",
            fontFamily: "Inter, sans-serif",
          },
          flowchart: {
            curve: "basis",
            htmlLabels: true,
          },
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        renderCounter++;

        const renderId = `workflow-diagram-${renderCounter}`;

        const { svg } = await w.mermaid.render(renderId, graphDef);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          const svgElement = containerRef.current.querySelector("svg");

          if (svgElement) {
            // Let the SVG determine the height naturally.
            svgElement.style.width = "100%";
            svgElement.style.height = "auto";
            svgElement.style.maxWidth = "100%";
            svgElement.style.display = "block";
          }
        }
      } catch (error) {
        console.error("Mermaid render error:", error);

        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<p style="color: #dc2626;">Error rendering diagram</p>';
        }
      } finally {
        setLoading(false);
      }
    };

    // Load Mermaid if it isn't already available
    if (!wExists()) {
      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";

      script.async = true;

      script.onload = renderGraph;

      script.onerror = () => {
        console.error("Failed to load Mermaid");
        setLoading(false);
      };

      document.body.appendChild(script);
    } else {
      // Give the modal a moment to mount before rendering
      const timeout = window.setTimeout(renderGraph, 50);

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [opened, states, transitions]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="70%"
      centered
      title={
        <Text fw={600} size="lg">
          Workflow Visualizer
        </Text>
      }
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <Box
        pos="relative"
        style={{
          padding: "28px 24px",
        }}
      >
        {loading && (
          <Center
            pos="absolute"
            inset={0}
            bg="white"
            style={{
              zIndex: 10,
              minHeight: "160px",
            }}
          >
            <Loader size="sm" />
          </Center>
        )}

        <div
          ref={containerRef}
          style={{
            width: "100%",
            minHeight: "120px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "auto",
          }}
        />
      </Box>
    </Modal>
  );
}

function wExists() {
  return typeof window !== "undefined" && !!(window as any).mermaid;
}
