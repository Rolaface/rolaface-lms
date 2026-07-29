import { Text } from "@mantine/core";
import { theme } from "./Constants";

export const SubSection = ({ title, icon: Icon, trailing, last = false, children }: { title: string; icon: any; trailing?: React.ReactNode; last?: boolean; children: React.ReactNode }) => (
  <div className={`py-3.5 first:pt-0 ${!last ? "border-b border-slate-100" : ""}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={18} style={{ color: theme.brand[6] }} />
        <Text size="sm" fw={700} className="text-slate-900">{title}</Text>
      </div>
      {trailing}
    </div>
    {children}
  </div>
);