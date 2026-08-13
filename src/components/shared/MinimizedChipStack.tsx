
import { useModalMinimizeStore } from '../../store/modalMinimizeStore';
import { MinimizedChip } from './MinimizedChip';

export function MinimizedChipStack() {
  const minimized = useModalMinimizeStore((s) => s.minimized);
  const entries = Object.entries(minimized);

  return (
    <>
      {entries.map(([id, entry], index) => (
        <MinimizedChip
          key={id}
          title={entry.title}
          icon={entry.icon}
          offset={index}
          onRestore={entry.restore}
          onClose={entry.close}
        />
      ))}
    </>
  );
}