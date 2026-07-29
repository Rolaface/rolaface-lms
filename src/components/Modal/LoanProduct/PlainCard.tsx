import { Text, Paper } from "@mantine/core";

export const PlainCard = ({ description, children }: { description?: string; children: React.ReactNode }) => (
  <Paper withBorder radius="lg" p={0} className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-white border-slate-200 overflow-hidden">
    <div className="p-4">
      {description && <Text size="sm" className="text-slate-500 mb-3">{description}</Text>}
      {children}
    </div>
  </Paper>
);