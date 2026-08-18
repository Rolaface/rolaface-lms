import { Paper, Text, Group, Pagination } from "@mantine/core";
import { IconNote, IconMessage, IconPhoneCall, IconSettings } from "@tabler/icons-react";
import { SectionHeading, themeTokens } from "../SharedUI";

const getActivityConfig = (type: string) => {
  switch (type) {
    case 'note': return { icon: <IconNote size={10} />, bg: themeTokens.warningSoft, fg: themeTokens.warning, label: 'NOTE' };
    case 'email': return { icon: <IconMessage size={10} />, bg: themeTokens.infoSoft, fg: themeTokens.info, label: 'EMAIL' };
    case 'call': return { icon: <IconPhoneCall size={10} />, bg: themeTokens.successSoft, fg: themeTokens.success, label: 'CALL' };
    default: return { icon: <IconSettings size={10} />, bg: themeTokens.slateSoft, fg: themeTokens.slate, label: 'SYSTEM' };
  }
};

export function ActivityTab({ data, meta, page, setPage, onPaginate }: any) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Activity & audit" aside="Every touchpoint on this loan, in order" />
      <Paper radius="lg" className="p-4" style={{ boxShadow: 'var(--mantine-shadow-md)', border: '1px solid var(--mantine-color-slate-2)' }}>
        <div className="flex flex-col">
          {data.map((a: any, idx: number) => {
            const config = getActivityConfig(a.type);
            return (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1" style={{ borderColor: config.fg, backgroundColor: 'var(--mantine-color-white)' }} />
                  {idx < data.length - 1 && <span className="w-px flex-1 bg-[var(--mantine-color-slate-2)]" />}
                </div>
                <div className="pb-5 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Text fz={10} c="dimmed" className="font-mono">{a.timestamp}</Text>
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5" style={{ backgroundColor: config.bg, color: config.fg }}>
                      {config.icon}
                      <Text fz={9} fw={700} className="tracking-wide">{config.label}</Text>
                    </span>
                  </div>
                  <Text fz="xs" fw={600} c="slate.9">{a.title}</Text>
                  <Text fz={11} c="dimmed" className="mt-0.5">{a.subtitle}</Text>
                  <Text fz={10} c="dimmed" className="mt-0.5">{a.actor}</Text>
                </div>
              </div>
            );
          })}
          {data.length === 0 && <Text fz="xs" c="dimmed" className="py-3">No activity logged.</Text>}
        </div>
      </Paper>
      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end">
          <Pagination value={page} onChange={(v) => { setPage(v); onPaginate(v); }} total={meta.total_pages} size="sm" color="brand" radius="md" />
        </Group>
      )}
    </div>
  );
}