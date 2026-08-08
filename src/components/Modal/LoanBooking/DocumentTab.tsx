import { Text, Badge, Paper, ThemeIcon, Group } from "@mantine/core";
import {
  IconFolderUp,
  IconFileText,
  IconClockHour4,
  IconCircleCheck,
} from "@tabler/icons-react";
import type { DocumentRow } from "./Constants";

interface DocumentsTabProps {
  documents: DocumentRow[];
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Paper
        radius="lg"
        p="xl"
        withBorder
        className="flex flex-col items-center justify-center gap-2 text-center transition-colors"
        style={{
          borderStyle: "dashed",
          borderWidth: 1.5,
          borderColor: "var(--mantine-color-slate-3)",
          background: "var(--mantine-color-slate-0)",
          cursor: "pointer",
        }}
      >
        <ThemeIcon variant="light" color="gold" radius="xl" size={44}>
          <IconFolderUp size={22} />
        </ThemeIcon>
        <Text size="sm" c="slate.5" ta="center">
          Drag and drop files here, or{" "}
          <Text span fw={600} c="brand.6" style={{ cursor: "pointer" }}>
            browse
          </Text>{" "}
          to upload
        </Text>
        <Text size="xs" c="slate.4">
          PDF, JPG or PNG — up to 10MB each
        </Text>
      </Paper>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => {
          const isUploaded = doc.status === "Uploaded";
          return (
            <Paper
              key={doc.id}
              withBorder
              radius="md"
              shadow="xs"
              className="flex justify-between items-center px-4 py-3 transition-colors"
            >
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  variant="light"
                  color={isUploaded ? "success" : "slate"}
                  radius="md"
                  size={34}
                >
                  <IconFileText size={17} />
                </ThemeIcon>
                <Text size="sm" fw={500} c="slate.7">
                  {doc.name}
                </Text>
              </Group>

              <Badge
                size="sm"
                variant="light"
                radius="sm"
                color={isUploaded ? "success" : "warning"}
                leftSection={
                  isUploaded ? (
                    <IconCircleCheck size={12} />
                  ) : (
                    <IconClockHour4 size={12} />
                  )
                }
              >
                {doc.status}
              </Badge>
            </Paper>
          );
        })}
      </div>
    </div>
  );
}