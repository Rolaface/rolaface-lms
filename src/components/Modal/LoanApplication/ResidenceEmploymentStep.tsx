import { useState } from "react";
import { 
  SimpleGrid, 
  TextInput, 
  Select, 
  Box, 
  Group, 
  Text, 
  Button, 
  Stack, 
  Modal,
  ActionIcon,
  Checkbox,
  Collapse
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronUp, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues, LoanType, DirectorEntry } from "./LoanApplicationModal";
import { getAllCountries } from "../../../api/loanApplicationApi";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateInput } from "@mantine/dates";

interface StepProps {
  form: UseFormReturnType<LoanApplicationValues>;
  loanType: LoanType;
  directorsError?: string | null;
  readOnly?: boolean;
}

const RELATIONSHIPS = [ "Spouse", "Parent", "Child", "Sibling", "Other",];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
];

const nextId = () => Math.random().toString(36).slice(2, 10);

function Label({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </span>
  );
}

export function ResidenceEmploymentStep({ form, loanType, directorsError, readOnly = false }: StepProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { data: countryResponse, isLoading: isCountriesLoading } = useQuery({
  queryKey: ["countries"],
  queryFn: getAllCountries,
});

const countryOptions = useMemo(() => {
  const countries = countryResponse?.message?.data || [];
  return countries.map((c: any) => ({ value: c.value, label: c.label }));
}, [countryResponse]);

if (loanType === "Personal") {
  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" style={{ gridColumn: "1 / -1" }}>
      {/* Present / Residential Address */}
      <Box p="md" bd="1px solid var(--mantine-color-slate-3)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
        <Text fw={600} mb="md">Residential Address</Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
          <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
            <TextInput radius="md" label={<Label text="Address Line 1" required />} placeholder="Plot / street, area" readOnly={readOnly} style={{ flex: 1 }} />
            <TextInput radius="md" label={<Label text="Address Line 2" />} placeholder="Apartment, suite, etc." readOnly={readOnly} style={{ flex: 1 }} />
          </div>
          <TextInput radius="md" label={<Label text="City / Town" required />} placeholder="e.g. Lusaka" readOnly={readOnly} />
          <Select radius="md" searchable label={<Label text="State / Province" />} placeholder="Select" disabled={readOnly} data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]} />
          <Select radius="md" searchable label={<Label text="Country" required />} placeholder={isCountriesLoading ? "Loading..." : "Select"} disabled={isCountriesLoading || readOnly} data={countryOptions} />
          <TextInput radius="md" label={<Label text="Postal Code" />} placeholder="e.g. 10101" readOnly={readOnly} />
        </SimpleGrid>
      </Box>

      {/* Permanent / Mailing Address */}
      <Box p="md" bd="1px solid var(--mantine-color-slate-3)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
        <Group justify="space-between" mb="md">
          <Text fw={600}>Permanent Address</Text>
          <Checkbox label="Same as residential" size="sm" />
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
          <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
            <TextInput radius="md" label={<Label text="Address Line 1" required />} placeholder="Plot / street, area" readOnly={readOnly} style={{ flex: 1 }} />
            <TextInput radius="md" label={<Label text="Address Line 2" />} placeholder="Apartment, suite, etc." readOnly={readOnly} style={{ flex: 1 }} />
          </div>
          <TextInput radius="md" label={<Label text="City / Town" required />} placeholder="e.g. Lusaka" readOnly={readOnly} />
          <Select radius="md" searchable label={<Label text="State / Province" />} placeholder="Select" disabled={readOnly} data={["Lusaka", "Copperbelt", "Southern", "Eastern", "Northern"]} />
          <Select radius="md" searchable label={<Label text="Country" required />} placeholder={isCountriesLoading ? "Loading..." : "Select"} disabled={isCountriesLoading || readOnly} data={countryOptions} />
          <TextInput radius="md" label={<Label text="Postal Code" />} placeholder="e.g. 10101" readOnly={readOnly} />
        </SimpleGrid>
      </Box>
    </SimpleGrid>
      <Group gap="xs" mt={2} mb={0} wrap="nowrap">
        <Text fz="sm" fw={700} c="slate.8" style={{ whiteSpace: "nowrap" }}>
          Next of Kin Details
        </Text>
        <Box
          style={{
            height: 1,
            flex: 1,
            backgroundColor: "var(--mantine-color-slate-2)",
          }}
        />
      </Group>

      <SimpleGrid
        cols={{ base: 1, sm: 3 }}
        spacing="md"
        verticalSpacing="sm"
      >
                <TextInput
          radius="md"
          label={<Label text="Next of kin name" required />}
          placeholder="e.g. John Doe"
          {...form.getInputProps("kinName")}
          readOnly={readOnly}
        />

        <TextInput
          radius="md"
          type="tel"
          label={<Label text="Next of kin phone" required />}
          placeholder="e.g. 0971234567"
          value={form.values.kinPhone}
          onChange={(e) =>
            form.setFieldValue(
              "kinPhone",
              e.currentTarget.value.replace(/\D/g, "")
            )
          }
          error={form.errors.kinPhone}
          readOnly={readOnly}
        />

        <TextInput
          radius="md"
          type="email"
          label={<Label text="Next of kin email" required />}
          placeholder="e.g. john.doe@example.com"
          value={form.values.kinEmail}
          onChange={(e) => {
            form.setFieldValue("kinEmail", e.currentTarget.value);
            form.validateField("kinEmail");
          }}
          error={form.errors.kinEmail}
          readOnly={readOnly}
        />

        <Select
          radius="md"
          label={<Label text="Relationship" required />}
          placeholder="Select relationship"
          data={RELATIONSHIPS}
          {...form.getInputProps("kinRelationship")}
          style={{ gridColumn: "1 / -1" }}
          disabled={readOnly}
        />
      </SimpleGrid>
    </Stack>
  );
}

  // --- Business: Directors & Applicant ---
  const directors = form.values.directors || [];
  const [expandedDirectors, setExpandedDirectors] = useState<number[]>([]);

  const toggleDirector = (index: number) => {
    setExpandedDirectors((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleAddDirector = () => {
    const newIndex = directors.length;
    form.insertListItem("directors", { id: nextId(), name: "", phone: "", email: "", nrc: "" });
    setExpandedDirectors((prev) => [...prev, newIndex]);
  };

  const handleDeleteDirector = (index: number) => {
    form.removeListItem("directors", index);
    setExpandedDirectors((prev) => prev.filter((i) => i !== index).map(i => i > index ? i - 1 : i));
  };

  const handleEditDirector = (index: number) => {
    setEditingIndex(index);
    open();
  };

  const handleDone = () => {
    if (editingIndex === null) return;
    const nameErr = form.validateField(`directors.${editingIndex}.name`).hasError;
    const phoneErr = form.validateField(`directors.${editingIndex}.phone`).hasError;
    const emailErr = form.validateField(`directors.${editingIndex}.email`).hasError;
    const nrcErr = form.validateField(`directors.${editingIndex}.nrc`).hasError;

    if (nameErr || phoneErr || emailErr || nrcErr) return;

    setEditingIndex(null);
    close();
  };

  const handleCloseModal = () => {
    // Cleanup: If a user opened "Add Director" but didn't fill anything out, remove it.
    if (editingIndex !== null) {
      const current = form.values.directors[editingIndex];
      if (current && !current.name && !current.phone && !current.email && !current.nrc) {
        form.removeListItem("directors", editingIndex);
      }
    }
    setEditingIndex(null);
    close();
  };

  return (
    <>
      <Stack gap="sm">
          {/* Directors Section */}
        <Box p="xl" bd="1px solid var(--mantine-color-slate-2)" style={{ borderRadius: "var(--mantine-radius-md)" }}>
          <Group justify="space-between" align="flex-start" mb="xs">
            <Box>
              <Group gap="xs" align="center">
                <Text fz="lg" fw={700} c="dark.9" style={{ letterSpacing: "-0.5px" }}>
                  Active Directors
                </Text>
                <Box px={10} py={2} bg="slate.1" c="slate.7" fw={600} style={{ borderRadius: "var(--mantine-radius-xl)", fontSize: "12px" }}>
                  {directors.length} Recorded
                </Box>
              </Group>
              <Text fz="sm" c="slate.5" mt={4}>
                Add directors. Each director requires a name, phone, email, and NRC.
              </Text>
              {directorsError && (
                <Text fz="xs" c="red.6" mt={4}>
                  {directorsError}
                </Text>
              )}
            </Box>
            {!readOnly && (
              <Button
                variant="default"
                radius="md"
                size="sm"
                leftSection={<IconPlus size={16} color="var(--mantine-color-slate-4)" />}
                onClick={handleAddDirector}
                style={{ color: "var(--mantine-color-slate-4)", borderColor: "var(--mantine-color-slate-2)" }}
              >
                Add Director
              </Button>
            )}
          </Group>

          <Box style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", margin: "20px 0" }} />

         <Stack gap="sm">
            {directors.map((dir, idx) => {
              const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "D";
              const colors = [
                { bg: "indigo.1", c: "indigo.8" },
                { bg: "teal.1", c: "teal.8" },
                { bg: "grape.1", c: "grape.8" },
              ];
              const colorTheme = colors[idx % colors.length];
              const isExpanded = expandedDirectors.includes(idx);

              return (
                <Box
                  key={dir.id}
                  bd="1px solid var(--mantine-color-slate-2)"
                  style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
                >
                  {isExpanded ? (
                    /* Expanded Form Fields */
                    <Box p="md" bg="slate.0">
                      <Group justify="space-between" mb="md">
                        <Text fz="sm" fw={600} c="dark.9">Director {idx + 1} Details</Text>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => toggleDirector(idx)}
                        >
                          <IconChevronUp size={18} stroke={1.5} color="var(--mantine-color-slate-4)" />
                        </ActionIcon>
                      </Group>
                      
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" verticalSpacing="md">
                        <TextInput
                          radius="md"
                          label={<Label text="Director name" required />}
                          placeholder="e.g. John Doe"
                          {...form.getInputProps(`directors.${idx}.name`)}
                          onBlur={() => form.validateField(`directors.${idx}.name`)}
                        />
                        <TextInput
                          radius="md"
                          type="tel"
                          label={<Label text="Director phone" required />}
                          placeholder="e.g. 0971234567"
                          value={form.values.directors[idx].phone}
                          onChange={(e) =>
                            form.setFieldValue(`directors.${idx}.phone`, e.currentTarget.value.replace(/\D/g, ""))
                          }
                          onBlur={() => form.validateField(`directors.${idx}.phone`)}
                          error={form.errors[`directors.${idx}.phone`]}
                        />
                        <TextInput
                          radius="md"
                          type="email"
                          label={<Label text="Director email" required />}
                          placeholder="e.g. jane.doe@example.com"
                          value={form.values.directors[idx].email}
                          onChange={(e) => {
                            form.setFieldValue(`directors.${idx}.email`, e.currentTarget.value);
                            form.validateField(`directors.${idx}.email`);
                          }}
                          onBlur={() => form.validateField(`directors.${idx}.email`)}
                          error={form.errors[`directors.${idx}.email`]}
                        />
                        <TextInput
                          radius="md"
                          label={<Label text="Director NRC" required />}
                          placeholder="e.g. 123456/78/1"
                          {...form.getInputProps(`directors.${idx}.nrc`)}
                          onBlur={() => form.validateField(`directors.${idx}.nrc`)}
                        />
                      </SimpleGrid>

                      <Group justify="flex-end" mt="md">
                        <Button variant="default" radius="md" onClick={() => toggleDirector(idx)}>
                          Done
                        </Button>
                      </Group>
                    </Box>
                  ) : (
                    /* Summary Row */
                    <Group 
                      wrap="nowrap"
                      justify="space-between" 
                      align="center"
                      p="md"
                      bg="transparent"
                    >
                      <Group wrap="nowrap" gap="md" style={{ flex: 1, minWidth: 0 }}>
                        <Box 
                          w={42} 
                          h={42} 
                          bg={colorTheme.bg} 
                          c={colorTheme.c} 
                          fz="sm"
                          fw={700} 
                          style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          {getInitials(dir.name)}
                        </Box>
                        <Box style={{ overflow: "hidden", flex: 1 }}>
                          <Group gap="sm" mb={6} align="center">
                            <Text fz="15px" fw={600} c="dark.9" truncate>
                              {dir.name || `Director ${idx + 1} (Incomplete)`}
                            </Text>
                            {dir.name && (
                              <Box px={8} py={2} bg="indigo.0" c="indigo.8" fw={600} style={{ borderRadius: "var(--mantine-radius-sm)", fontSize: "11px" }}>
                                Director
                              </Box>
                            )}
                          </Group>
                          <Group gap="lg" align="center" wrap="nowrap">
                            <Text fz="sm" c="slate.5" truncate>
                              <span style={{ color: "var(--mantine-color-slate-4)" }}>NRC:</span> {dir.nrc || "Pending"} 
                            </Text>
                            <Text fz="xs" c="slate.3">•</Text>
                            <Text fz="sm" c="slate.6" truncate>
                              {dir.email || "Email pending"}
                            </Text>
                            <Text fz="xs" c="slate.3">•</Text>
                            <Text fz="sm" c="slate.6" truncate>
                              {dir.phone || "Phone pending"}
                            </Text>
                          </Group>
                        </Box>
                      </Group>

                      {!readOnly && (
                        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => toggleDirector(idx)}
                            aria-label="Edit director"
                          >
                            <IconPencil size={18} stroke={1.5} color="var(--mantine-color-slate-4)" />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => handleDeleteDirector(idx)}
                            aria-label="Delete director"
                          >
                            <IconTrash size={18} stroke={1.5} color="var(--mantine-color-slate-4)" />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
       </Stack>
    </>
  );
}