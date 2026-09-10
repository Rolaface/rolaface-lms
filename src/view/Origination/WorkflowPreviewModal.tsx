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
  if (!str) return { stroke: "#adb5bd", fill: "#f8f9fa" };
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { stroke: "#3B82F6", fill: "#DBEAFE" }, // brand
    { stroke: "#4f46e5", fill: "#e0e7ff" }, // indigo
    { stroke: "#06b6d4", fill: "#cffafe" }, // cyan
    { stroke: "#14b8a6", fill: "#ccfbf1" }, // teal
    { stroke: "#10b981", fill: "#d1fae5" }, // success
    { stroke: "#f59e0b", fill: "#fef3c7" }, // warning
    { stroke: "#8b5cf6", fill: "#ede9fe" }, // grape
    { stroke: "#ec4899", fill: "#fce7f3" }, // pink
    { stroke: "#7c3aed", fill: "#ede9fe" }, // violet
    { stroke: "#f97316", fill: "#ffedd5" }, // orange
  ];
  return palettes[Math.abs(hash) % palettes.length];
};

export function WorkflowPreviewModal({ opened, onClose, states, transitions }: WorkflowPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);

    let graphDef = "graph LR\n";
    states.forEach((s) => {
      if (s.state.trim()) {
        const safeState = s.state.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
        const colors = getDeterministicColorPair(s.state.trim());
        const isFinal = s.doc_status === "1";
        
        // If final, maybe make it slightly bolder or standard
        const strokeW = isFinal ? "3px" : "2px";
        const style = `fill:${colors.fill},stroke:${colors.stroke},stroke-width:${strokeW},color:#1e293b`;
        
        graphDef += `  ${safeState}("${s.state.trim()}")\n`;
        graphDef += `  style ${safeState} ${style}\n`;
      }
    });

    transitions.forEach((t) => {
      if (t.from_state && t.to_state && t.action) {
        const safeFrom = t.from_state.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
        const safeTo = t.to_state.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
        const colors = getDeterministicColorPair(t.action.trim());
        graphDef += `  ${safeFrom} -->|"${t.action.trim()}"| ${safeTo}\n`;
        graphDef += `  linkStyle ${transitions.indexOf(t)} stroke:${colors.stroke},stroke-width:2px,color:#1e293b\n`;
      }
    });

    if (states.length === 0 && transitions.length === 0) {
      graphDef += `  Empty("No workflow defined")\n`;
    }

    const renderGraph = async () => {
      const w = window as any;
      if (w.mermaid) {
        try {
          w.mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            themeVariables: {
              lineColor: "#adb5bd",
              textColor: "#495057",
              fontFamily: "Inter, sans-serif"
            },
            flowchart: {
              curve: "basis"
            }
          });
          
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }

          renderCounter++;
          const renderId = `workflow-diagram-${renderCounter}`;
          
          const { svg } = await w.mermaid.render(renderId, graphDef);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            // scale up the SVG to fill container
            const svgElement = containerRef.current.querySelector("svg");
            if (svgElement) {
              svgElement.style.width = "100%";
              svgElement.style.height = "auto";
              svgElement.style.maxWidth = "100%";
            }
          }
        } catch (e) {
          console.error("Mermaid render error:", e);
          if (containerRef.current) containerRef.current.innerHTML = "<p>Error rendering diagram</p>";
        } finally {
          setLoading(false);
        }
      }
    };

    if (!(window as any).mermaid) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.async = true;
      script.onload = renderGraph;
      document.body.appendChild(script);
    } else {
      setTimeout(renderGraph, 50);
    }
  }, [opened, states, transitions]);

  return (
    <Modal opened={opened} onClose={onClose} size="90%" title={<Text fw={600} size="lg">Workflow Visualizer</Text>} centered>
      <Box mih={500} pos="relative" key={opened ? "open" : "closed"}>
        {loading && (
          <Center pos="absolute" inset={0} bg="white" style={{ zIndex: 10 }}>
            <Loader size="sm" />
          </Center>
        )}
        <div ref={containerRef} style={{ width: "100%", minHeight: "500px", display: "flex", justifyContent: "center", padding: "10px" }} />
      </Box>
    </Modal>
  );
}
