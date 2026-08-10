import { useState } from "react";
import { 
  SimpleGrid, 
  Box, 
  Group, 
  Text, 
  Button, 
  Stack, 
  Modal, 
  ActionIcon 
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType, DirectorDocEntry } from "./LoanApplicationModal";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
}

const nextId = () => Math.random().toString(36).slice(2, 10);
const MAX_DIRECTOR_DOCS = 3;

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

function FileField({
  label,
  required,
  file,
  onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <Label text={label} required={required} />
      <input
        type="file"
        className="block w-full mt-1 text-sm text-slate-600 border border-slate-300 rounded-md file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm file:font-medium hover:file:bg-slate-200"
        onChange={(e) => onChange(e.currentTarget.files?.[0] ?? null)}
      />
      <Text fz="xs" c="slate.4" mt={2}>
        {file ? file.name : "Upload document or choose file"}
      </Text>
    </div>
  );
}

export function DocumentsStep({ form, loanType }: StepProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (loanType === "Personal") {
    return (
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="lg">
        <FileField
          label="Latest three payslips"
          required
          file={form.values.payslips}
          onChange={(f) => form.setFieldValue("payslips", f)}
        />
        <FileField
          label="Bank statements (3 months)"
          required
          file={form.values.bankStatementsPersonal}
          onChange={(f) => form.setFieldValue("bankStatementsPersonal", f)}
        />
        <FileField
          label="NRC copy"
          required
          file={form.values.nrcCopy}
          onChange={(f) => form.setFieldValue("nrcCopy", f)}
        />
        <FileField
          label="Passport-sized photo"
          required
          file={form.values.passportPhotoPersonal}
          onChange={(f) => form.setFieldValue("passportPhotoPersonal", f)}
        />
        <FileField
          label="TPIN certificate"
          required
          file={form.values.tpinCertificate}
          onChange={(f) => form.setFieldValue("tpinCertificate", f)}
        />
      </SimpleGrid>
    );
  }

  // --- Business Documents ---
  const directorDocs = form.values.directorDocuments || [];

  const handleAddDirectorDoc = () => {
    if (directorDocs.length >= MAX_DIRECTOR_DOCS) return;
    const newIndex = directorDocs.length;
    form.insertListItem("directorDocuments", { id: nextId(), nrcFile: null, photoFile: null } as DirectorDocEntry);
    setEditingIndex(newIndex);
    open();
  };

  const handleEditDirectorDoc = (index: number) => {
    setEditingIndex(index);
    open();
  };

  const handleDeleteDirectorDoc = (index: number) => {
    form.removeListItem("directorDocuments", index);
  };

  const handleCloseModal = () => {
    // Cleanup: If a user opened "Add Director Docs" but didn't upload anything, remove the entry.
    if (editingIndex !== null) {
      const current = form.values.directorDocuments[editingIndex];
      if (current && !current.nrcFile && !current.photoFile) {
        form.removeListItem("directorDocuments", editingIndex);
      }
    }
    setEditingIndex(null);
    close();
  };

  return (
    <>
      <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Group gap="sm" align="center" className="flex gap-4">
              <Text fz="sm" fw={700} c="slate.8">
                Director documents ({directorDocs.length}/{MAX_DIRECTOR_DOCS})
              </Text>
              <Text fz="xs" c="slate.5">
                Add up to 3 director NRC and passport photo uploads.
              </Text>
            </Group>
            <Button
              size="sm"
              variant="light"
              radius="md"
              color="brand"
              onClick={handleAddDirectorDoc}
              disabled={directorDocs.length >= MAX_DIRECTOR_DOCS}
            >
              Add Director Docs
            </Button>
          </Group>

          {directorDocs.length > 0 && (
            <Stack gap="sm">
              {directorDocs.map((doc, idx) => (
                <Group
                  key={doc.id}
                  justify="space-between"
                  align="center"
                  className="border border-slate-200 bg-slate-50 rounded-md p-2"
                >
                  <Box>
                    <Text fz="sm" fw={600} c="slate.8">
                      Director {idx + 1} Documents
                    </Text>
                    <Text fz="xs" c="slate.5">
                      NRC: {doc.nrcFile ? doc.nrcFile.name : "Pending"} • Photo: {doc.photoFile ? doc.photoFile.name : "Pending"}
                    </Text>
                  </Box>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="brand"
                      onClick={() => handleEditDirectorDoc(idx)}
                      aria-label="Edit director documents"
                    >
                      <IconPencil size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeleteDirectorDoc(idx)}
                      aria-label="Delete director documents"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
          )}
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" verticalSpacing="lg">
          <FileField
            label="PACRA certificate"
            required
            file={form.values.pacraCertificate}
            onChange={(f) => form.setFieldValue("pacraCertificate", f)}
          />
          <FileField
            label="Form 2"
            required
            file={form.values.form2}
            onChange={(f) => form.setFieldValue("form2", f)}
          />
          <FileField
            label="Tax clearance certificate / TPIN"
            required
            file={form.values.taxClearanceCertificate}
            onChange={(f) => form.setFieldValue("taxClearanceCertificate", f)}
          />

          <FileField
            label="Latest tax compliance return"
            required
            file={form.values.taxComplianceReturn}
            onChange={(f) => form.setFieldValue("taxComplianceReturn", f)}
          />
          <FileField
            label="Order / Invoice (if applying for order financing or invoice discounting)"
            file={form.values.orderInvoice}
            onChange={(f) => form.setFieldValue("orderInvoice", f)}
          />
          <FileField
            label="Bank statements (6 months)"
            required
            file={form.values.bankStatementsBusiness}
            onChange={(f) => form.setFieldValue("bankStatementsBusiness", f)}
          />

          <FileField
            label="Applicant Passport-sized photo"
            required
            file={form.values.applicantPassportPhoto}
            onChange={(f) => form.setFieldValue("applicantPassportPhoto", f)}
          />
          <FileField
            label="Board resolution"
            required
            file={form.values.boardResolution}
            onChange={(f) => form.setFieldValue("boardResolution", f)}
          />
        </SimpleGrid>
      </Stack>

      {/* Director Documents Edit/Add Modal */}
      <Modal
        opened={opened && editingIndex !== null}
        onClose={handleCloseModal}
        size="lg"
        title={
          <Text fz="lg" fw={700} c="slate.8">
            {editingIndex !== null ? `Director ${editingIndex + 1} Documents` : "Add Director Documents"}
          </Text>
        }
      >
        {editingIndex !== null && (
          <Box>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" verticalSpacing="md" mb="xl">
              <FileField
                label={`Director ${editingIndex + 1} NRC`}
                required
                file={form.values.directorDocuments[editingIndex].nrcFile}
                onChange={(f) => form.setFieldValue(`directorDocuments.${editingIndex}.nrcFile`, f)}
              />
              <FileField
                label={`Director ${editingIndex + 1} passport photo`}
                required
                file={form.values.directorDocuments[editingIndex].photoFile}
                onChange={(f) => form.setFieldValue(`directorDocuments.${editingIndex}.photoFile`, f)}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button color="brand" radius="md" onClick={handleCloseModal}>
                Done
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </>
  );
}