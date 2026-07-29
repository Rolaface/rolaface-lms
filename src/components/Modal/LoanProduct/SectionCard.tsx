import { Text, Paper } from "@mantine/core";
import { theme } from "./Constants";

export const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden">
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: theme.brand[5] }} />
        <Text size="sm" fw={700} className="text-slate-900 tracking-tight">{title}</Text>
      </div>
      {description && <Text size="xs" className="text-slate-400 mb-2 pl-3">{description}</Text>}
      {!description && <div className="mb-1.5" />}
      {children}
    </div>
  </Paper>
);