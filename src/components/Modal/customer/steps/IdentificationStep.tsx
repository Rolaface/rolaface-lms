import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
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
  Alert,
  Badge,
  ScrollArea,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconId,
  IconPlus,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";
import type { IdDocument } from "../../../../types/customer/types";
import { DatePickerInput } from "@mantine/dates";
import { useCountries } from "../../../../hooks/common/useLookups";
import { useDebouncedValue } from "@mantine/hooks";
import { DocumentUploadField } from "./Documentuploadfield";
import { uploadCustomerDocument } from "../../../../api/Customer/customerApi";

interface IdentificationStepProps {
  idDocuments: IdDocument[];
  updateIdDocument: (id: string, patch: Partial<IdDocument>) => void;
  addIdDocument: () => void;
  removeIdDocument: (id: string) => void;
  errors?: Record<string, string>;
  duplicateDocMatch?: string | null;
}

const chevron = (
  <IconChevronDown size={13} color="var(--mantine-color-slate-4)" />
);

const VERIFICATION_COLOR: Record<string, string> = {
  Verified: "success",
  Pending: "warning",
  "Not verified": "slate",
  Rejected: "danger",
};

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

function DocRow({
  doc,
  isSelected,
  onSelect,
}: {
  doc: IdDocument;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onSelect}
      px="xs"
      py={6}
      style={{
        borderRadius: "var(--mantine-radius-sm)",
        background: isSelected ? "var(--mantine-color-brand-0)" : "transparent",
        border: isSelected
          ? "1px solid var(--mantine-color-brand-4)"
          : "1px solid transparent",
      }}
    >
      <Group justify="space-between" wrap="nowrap" mb={2}>
        <Text
          size="xs"
          fw={isSelected ? 700 : 600}
          c={isSelected ? "brand.7" : "slate.8"}
          truncate
        >
          {doc.idType || "Untitled document"}
        </Text>
      </Group>
      {doc.expiryDate && (
        <Text size="10px" c="slate.5" mb={6}>
          Exp: {dayjs(doc.expiryDate).format("DD-MMM-YYYY")}
        </Text>
      )}
      <Group gap={4}>
        <Badge
          size="xs"
          variant="light"
          color={VERIFICATION_COLOR[doc.verification] ?? "slate"}
          radius="sm"
        >
          {doc.verification.toUpperCase()}
        </Badge>
      </Group>
    </UnstyledButton>
  );
}


export function IdentificationStep({
  idDocuments,
  updateIdDocument,
  addIdDocument,
  removeIdDocument,
  errors = {},
  duplicateDocMatch,
}: IdentificationStepProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    idDocuments[0]?.id ?? null,
  );
  const prevCount = useRef(idDocuments.length);


  const [issuingCountrySearch, setIssuingCountrySearch] = useState("");
  const [debouncedIssuingCountrySearch] = useDebouncedValue(
    issuingCountrySearch,
    300,
  );
  const { data: issuingCountryOptions, isLoading: issuingCountriesLoading } =
    useCountries(debouncedIssuingCountrySearch);


  useEffect(() => {
    if (idDocuments.length > prevCount.current) {
      setSelectedDocId(idDocuments[idDocuments.length - 1].id);
    } else if (!idDocuments.some((d) => d.id === selectedDocId)) {
      setSelectedDocId(idDocuments[0]?.id ?? null);
    }
    prevCount.current = idDocuments.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDocuments]);

  const selectedDoc =
    idDocuments.find((d) => d.id === selectedDocId) ?? idDocuments[0];


  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const handleDocFileChange = async (docId: string, file: File) => {

    updateIdDocument(docId, { documentUpload: file });
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    setUploadingDocId(docId);
    try {
      const fileUrl = await uploadCustomerDocument(file);
      updateIdDocument(docId, { documentUploadRef: fileUrl });
    } catch (err) {
      setUploadErrors((prev) => ({
        ...prev,
        [docId]: "Upload failed. Please try again.",
      }));
    } finally {
      setUploadingDocId((current) => (current === docId ? null : current));
    }
  };

  const handleDocFileRemove = (docId: string) => {
    updateIdDocument(docId, { documentUpload: null, documentUploadRef: null });
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const isMobile = useMediaQuery("(max-width: 768px)");

  const LIST_PANEL_HEIGHT = isMobile ? 200 : 300;

  return (
    <PlainCard>
      <SectionHeader
        icon={IconId}
        title="Identification documents"
        badge="REQUIRED"
        accent="gold"
      />

      <Box
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "flex-start",
          gap: "var(--mantine-spacing-md)",
        }}
      >
        {/* --- Document list: fixed height, only this section scrolls --- */}
        <Paper
          withBorder
          radius="md"
          bg="white"
          w={isMobile ? "100%" : 260}
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Group
            justify="space-between"
            px="sm"
            py="xs"
            style={{ flexShrink: 0 }}
          >
            <Text
              size="xs"
              fw={800}
              tt="uppercase"
              c="slate.5"
              style={{ letterSpacing: 0.5 }}
            >
              Identifications
            </Text>
            <Badge size="xs" variant="light" color="slate" radius="sm">
              {idDocuments.length} {idDocuments.length === 1 ? "Item" : "Items"}
            </Badge>
          </Group>

          <ScrollArea h={LIST_PANEL_HEIGHT} type="auto" scrollbarSize={6}>
            <Stack gap={4} px={6} pb={6}>
              {idDocuments.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  isSelected={doc.id === selectedDoc?.id}
                  onSelect={() => setSelectedDocId(doc.id)}
                />
              ))}
            </Stack>
          </ScrollArea>

          <Box px={6} pb={6} style={{ flexShrink: 0 }}>
            <Button
              fullWidth
              mt={4}
              variant="subtle"
              color="gold"
              radius="md"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={addIdDocument}
              style={{ border: "1px dashed var(--mantine-color-gold-2)" }}
            >
              Add Document
            </Button>
          </Box>
        </Paper>

        {/* --- Selected document editor (no scroll here — grows naturally) --- */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          {selectedDoc ? (
            <Paper
              withBorder
              radius="md"
              p="md"
              bg="slate.0"
              style={{ borderColor: "var(--mantine-color-slate-2)" }}
            >
              <Group
                justify="space-between"
                align={isMobile ? "flex-start" : "flex-end"}
                mb="sm"
                wrap={isMobile ? "wrap" : "nowrap"}
              >
                <Box
                  w={isMobile ? "100%" : "33%"}
                  maw={isMobile ? "100%" : 240}
                >
                  <TextInput
                    size="xs"
                    radius="md"
                    label="Document Name"
                    withAsterisk
                    placeholder="e.g. Passport"
                    value={selectedDoc.idType}
                    onChange={(e) =>
                      updateIdDocument(selectedDoc.id, {
                        idType: e.currentTarget.value,
                      })
                    }
                  />
                </Box>
                <Group gap="xs">
                  <ActionIcon
                    size="sm"
                    color="danger"
                    variant="subtle"
                    onClick={() => removeIdDocument(selectedDoc.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>

              <FieldRow columns={isMobile ? "1fr" : "1.5fr 0.9fr 0.9fr 1fr"}>
                <TextInput
                  size="xs"
                  radius="md"
                  label="Document Number"
                  withAsterisk
                  placeholder="221009/11/1"
                  value={selectedDoc.docNumber}
                  onChange={(e) =>
                    updateIdDocument(selectedDoc.id, {
                      docNumber: e.currentTarget.value,
                    })
                  }
                  error={errors[`doc-${selectedDoc.id}`]}
                />
                <DatePickerInput
                  size="xs"
                  radius="md"
                  label="Issue Date"
                  placeholder="DD-MMM-YYYY"
                  value={
                    selectedDoc.issueDate
                      ? new Date(selectedDoc.issueDate)
                      : null
                  }
                  valueFormat="DD-MMM-YYYY"
                  onChange={(date) =>
                    updateIdDocument(selectedDoc.id, {
                      issueDate: date
                        ? new Date(date).toISOString().split("T")[0]
                        : "",
                    })
                  }
                  maxDate={new Date()}
                  clearable
                />
                <DatePickerInput
                  size="xs"
                  radius="md"
                  label="Expiry Date"
                  placeholder="DD-MMM-YYYY"
                  value={
                    selectedDoc.expiryDate
                      ? new Date(selectedDoc.expiryDate)
                      : null
                  }
                  valueFormat="DD-MMM-YYYY"
                  onChange={(date) =>
                    updateIdDocument(selectedDoc.id, {
                      expiryDate: date
                        ? new Date(date).toISOString().split("T")[0]
                        : "",
                    })
                  }
                  clearable
                />
                <Select
                  size="xs"
                  radius="md"
                  label="Verification"
                  data={[
                    "Not Verified",
                    "Pending Verification",
                    "Verified",
                    "Rejected",
                    "Expired",
                  ]}
                  value={selectedDoc.verification}
                  onChange={(v) =>
                    updateIdDocument(selectedDoc.id, {
                      verification: v ?? selectedDoc.verification,
                    })
                  }
                  rightSection={chevron}
                />
              </FieldRow>

              <FieldRow columns={isMobile ? "1.5fr 1fr" : "1fr 1fr 1fr"}>
                <TextInput
                  mt="sm"
                  size="xs"
                  radius="md"
                  label="Issuing Authority"
                  placeholder="e.g. NRC Dept."
                  value={selectedDoc.issuingAuthority}
                  onChange={(e) =>
                    updateIdDocument(selectedDoc.id, {
                      issuingAuthority: e.currentTarget.value,
                    })
                  }
                />

                <Select
                  mt="sm"
                  size="xs"
                  radius="md"
                  searchable
                  rightSection={chevron}
                  label="Issuing Country"
                  placeholder={
                    issuingCountriesLoading ? "Loading..." : "Select"
                  }
                  data={issuingCountryOptions ?? []}
                  value={selectedDoc.issuingCountry ?? null}
                  onChange={(v) =>
                    updateIdDocument(selectedDoc.id, {
                      issuingCountry: v,
                    })
                  }
                  onSearchChange={setIssuingCountrySearch}
                  disabled={issuingCountriesLoading && !issuingCountryOptions}
                />
              </FieldRow>

              <Box mt="sm">
                <DocumentUploadField
                  file={selectedDoc.documentUpload ?? null}
                  fileUrl={selectedDoc.documentUploadRef ?? null}
                  onFileChange={(file) =>
                    handleDocFileChange(selectedDoc.id, file)
                  }
                  onRemove={() => handleDocFileRemove(selectedDoc.id)}
                  isUploading={uploadingDocId === selectedDoc.id}
                  uploadError={uploadErrors[selectedDoc.id] ?? null}
                />
              </Box>

              {duplicateDocMatch && (
                <Alert
                  mt="sm"
                  color="warning"
                  radius="md"
                  icon={<IconAlertTriangle size={16} />}
                >
                  This document number matches an existing record for{" "}
                  <b>{duplicateDocMatch}</b>. Link to this customer instead of
                  creating a new one.
                </Alert>
              )}
            </Paper>
          ) : (
            <Text size="sm" c="slate.5">
              No document selected.
            </Text>
          )}
        </Box>
      </Box>
    </PlainCard>
  );
}