import { theme, type ChipColor } from "./Constants";

export const IconChip = ({ icon: Icon, color = "brand" }: { icon: React.ComponentType<{ size?: number }>; color?: ChipColor }) => {
  const c = theme[color];
  return (
    <div className="w-full h-full flex items-center justify-center shrink-0 border-r" style={{ backgroundColor: c[0], color: (c as any)[5], borderColor: c[1] }}>
      <Icon size={18} />
    </div>
  );
};