import { Paper, Text, Group, Pagination } from "@mantine/core";
import { IconFileText, IconPdf, IconPhoto } from "@tabler/icons-react";
import { SectionHeading, brand } from "../SharedUI";

const getDocConfig = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { icon: <IconPdf size={18} />, bg: brand.roseSoft, fg: brand.rose };
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return { icon: <IconPhoto size={18} />, bg: brand.skySoft, fg: brand.sky };
  return { icon: <IconFileText size={18} />, bg: brand.slateSoft, fg: brand.slate };
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function DocumentsTab({ data, meta, page, setPage, onPaginate }: any) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Documents" aside={`${meta?.total || 0} files on record`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.map((doc: any) => {
          const config = getDocConfig(doc.file_name);
          return (
            <Paper key={doc.name} withBorder radius="lg" p="sm" component="a" href={doc.file_url} target="_blank" className="flex items-center gap-3 transition-shadow hover:shadow-md cursor-pointer" style={{ borderColor: '#EDEAE0', boxShadow: '0 1px 2px rgba(36,31,61,0.06)', textDecoration: 'none' }}>
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: config.bg, color: config.fg }}>
                {config.icon}
              </div>
              <div className="min-w-0">
                <Text fz="xs" fw={700} c="gray.9" truncate>{doc.file_name}</Text>
                <Text fz={11} fw={600} c="dimmed">Uploaded {doc.creation.split(' ')[0]} · {formatBytes(doc.file_size)}</Text>
              </div>
            </Paper>
          )
        })}
      </div>
      {data.length === 0 && <Text fz="xs" c="dimmed" className="text-center py-4">No documents attached.</Text>}
      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end" mt="md">
          <Pagination value={page} onChange={(v) => { setPage(v); onPaginate(v); }} total={meta.total_pages} size="sm" color="brand" radius="md" />
        </Group>
      )}
    </div>
  );
}