import { Group, Pagination, Text } from "@mantine/core";
import { SectionHeading } from "../SharedUI";
import { DocumentCard } from "../../../Origination/LoanApplicationDetailParts";
import type { ApplicationDocument } from "../../../Origination/LoanApplicationDetailParts";

function isImageFile(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["png", "jpg", "jpeg"].includes(ext || "");
}

function mapLoanDocuments(data: any[]): ApplicationDocument[] {
  return data.map((doc) => ({
    id: doc.name,
    name: doc.file_name,
    status: doc.file_url ? "Uploaded" : "Missing",
    size: doc.file_name,
    icon: isImageFile(doc.file_name) ? "photo" : "file",
    file: doc.file_url,
  }));
}

export function DocumentsTab({ data, meta, page, setPage, onPaginate }: any) {
  const documents = mapLoanDocuments(data);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Documents" aside={`${meta?.total || 0} files on record`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
      {documents.length === 0 && (
        <Text fz="xs" c="dimmed" className="text-center py-4">
          No documents attached.
        </Text>
      )}
      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end" mt="md">
          <Pagination
            value={page}
            onChange={(v) => {
              setPage(v);
              onPaginate(v);
            }}
            total={meta.total_pages}
            size="sm"
            color="brand"
            radius="md"
          />
        </Group>
      )}
    </div>
  );
}