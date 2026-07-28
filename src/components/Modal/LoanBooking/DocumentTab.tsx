import { Text, Badge } from "@mantine/core";
import type { DocumentRow } from "./Constants";

interface DocumentsTabProps {
  documents: DocumentRow[];
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed border-slate-300 rounded-md py-8 flex items-center justify-center bg-slate-50/40">
        <Text size="sm" c="dimmed">
          📁 Drag and drop files here, or{" "}
          <span className="text-indigo-600 font-medium cursor-pointer">browse</span> to upload
        </Text>
      </div>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center border border-slate-200 rounded-md px-4 py-3 text-sm"
          >
            <span className="text-slate-700">{doc.name}</span>
            <Badge
              size="sm"
              variant="light"
              color={doc.status === "Uploaded" ? "green" : "yellow"}
              className="font-semibold"
              styles={{ root: { fontSize: 10 } }}
            >
              {doc.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}