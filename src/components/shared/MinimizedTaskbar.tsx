import { useMemo } from "react";
import { useModalStore } from "../../store/ModalStore";
import { MinimizedModalCard } from "./MinimizedModalCard";

export function MinimizedTaskbar() {
  const modals = useModalStore((s) => s.modals); 
  const minimized = useMemo(() => modals.filter((m) => m.minimized), [modals]);

  if (!minimized.length) return null;

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1800, display: "flex", flexDirection: "column", gap: 8 }}>
      {minimized.map((m) => (
        <MinimizedModalCard
          key={m.id}
          modal={m}
          onRestore={() => useModalStore.getState().restoreModal(m.id)}
          onClose={() => useModalStore.getState().closeModal(m.id)}
        />
      ))}
    </div>
  );
}