export function FieldIcon({
  Icon,
  bg,
  color,
}: {
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  bg: string;
  color: string;
}) {
  return (
    <div className="p-1.5 rounded-md flex items-center justify-center" style={{ backgroundColor: bg }}>
      <Icon size={14} style={{ color }} />
    </div>
  );
}