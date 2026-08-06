import {
  TextInput,
  Select,
  ActionIcon,
  Text,
  Stack,
  Group,
  Paper,
  Box,
  Button,
} from "@mantine/core";
import {
  IconChevronDown,
  IconId,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";
import { colorVar } from "../../../../utils/customer/utils";
import type { IdDocument } from "../../../../types/customer/types";

interface IdentificationStepProps {
  idDocuments: IdDocument[];
  updateIdDocument: (id: string, patch: Partial<IdDocument>) => void;
  addIdDocument: () => void;
  removeIdDocument: (id: string) => void;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);


function FieldRow({
  columns,
  children,
}: {
  columns: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: "var(--mantine-spacing-md)",
      }}
    >
      {children}
    </Box>
  );
}

export function IdentificationStep({
  idDocuments,
  updateIdDocument,
  addIdDocument,
  removeIdDocument,
}: IdentificationStepProps) {
  return (
    <PlainCard>
      <SectionHeader
        icon={IconId}
        title="Identification documents"
        badge="REQUIRED"
        description="At least one valid government-issued ID — add as many as needed"
        accent="gold"
      />
      <Stack gap="sm">
        {idDocuments.map((doc) => (
          <Paper
            key={doc.id}
            withBorder
            radius="md"
            p="md"
            bg="slate.0"
            style={{ borderColor: "var(--mantine-color-slate-2)" }}
          >
            <Group justify="space-between" mb="sm">
              <Box w="33%" maw={240}>
                <Select
                  size="xs"
                  radius="md"
                  data={[
                    "National ID (NRC)",
                    "Passport",
                    "Driver's Licence",
                    "Voter's Card",
                  ]}
                  value={doc.idType}
                  onChange={(v) =>
                    updateIdDocument(doc.id, { idType: v ?? doc.idType })
                  }
                  rightSection={chevron}
                />
              </Box>
              {doc.isPrimary ? (
                <Text
                  size="10px"
                  fw={700}
                  tt="uppercase"
                  style={{ letterSpacing: 0.4, color: colorVar("gold", 6) }}
                >
                  Primary ID
                </Text>
              ) : (
                <ActionIcon
                  size="sm"
                  color="danger"
                  variant="subtle"
                  onClick={() => removeIdDocument(doc.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </Group>


            <FieldRow columns="1.1fr 1.5fr 0.9fr 0.9fr 1fr">
              <TextInput
                size="xs"
                radius="md"
                label="Document Number"
                withAsterisk
                placeholder="221009/11/1"
                value={doc.docNumber}
                onChange={(e) =>
                  updateIdDocument(doc.id, {
                    docNumber: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                size="xs"
                radius="md"
                label="Issuing Authority"
                placeholder="e.g. NRC Dept."
                value={doc.issuingAuthority}
                onChange={(e) =>
                  updateIdDocument(doc.id, {
                    issuingAuthority: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                size="xs"
                radius="md"
                type="date"
                label="Issue Date"
                value={doc.issueDate}
                onChange={(e) =>
                  updateIdDocument(doc.id, {
                    issueDate: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                size="xs"
                radius="md"
                type="date"
                label="Expiry Date"
                value={doc.expiryDate}
                onChange={(e) =>
                  updateIdDocument(doc.id, {
                    expiryDate: e.currentTarget.value,
                  })
                }
              />
              <Select
                size="xs"
                radius="md"
                label="Verification"
                data={["Not verified", "Pending", "Verified", "Rejected"]}
                value={doc.verification}
                onChange={(v) =>
                  updateIdDocument(doc.id, {
                    verification: v ?? doc.verification,
                  })
                }
                rightSection={chevron}
              />
            </FieldRow>
          </Paper>
        ))}
        <Button
          variant="subtle"
          color="gold"
          radius="md"
          leftSection={<IconPlus size={14} />}
          onClick={addIdDocument}
          style={{ border: `1px dashed ${colorVar("gold", 1)}` }}
        >
          Add Another Document
        </Button>
      </Stack>
    </PlainCard>
  );
}