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
  ActionIcon,
} from "@mantine/core";
import { IconChevronUp, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";

// Define the shape of your collateral entry. Merge this into your global form values type.
export interface CollateralEntry {
  id: string;
  type: string;
  description: string;
  value: string;
  ownership: string;
}

interface CollateralStepProps {
  form: UseFormReturnType<any>; // Replace 'any' with your actual FormValues type
  collateralsError?: string | null;
  readOnly?: boolean;
}

const COLLATERAL_TYPES = ["Property", "Vehicle", "Gold", "Deposit"];
const OWNERSHIP_TYPES = ["Applicant", "Co-Applicant", "Third Party"];

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

export function Collateral({ form, collateralsError, readOnly = false }: CollateralStepProps) {
  const collaterals = form.values.collaterals || [];
  const [expandedCollaterals, setExpandedCollaterals] = useState<number[]>([]);

  const toggleCollateral = (index: number) => {
    setExpandedCollaterals((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleAddCollateral = () => {
    const newIndex = collaterals.length;
    form.insertListItem("collaterals", {
      id: nextId(),
      type: "",
      description: "",
      value: "",
      ownership: "",
    });
    setExpandedCollaterals((prev) => [...prev, newIndex]);
  };

  const handleDeleteCollateral = (index: number) => {
    form.removeListItem("collaterals", index);
    setExpandedCollaterals((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  return (
    <Stack gap="sm">
      {/* <Box p="xl" bd="1px solid var(--mantine-color-slate-2)" style={{ borderRadius: "var(--mantine-radius-md)" }}> */}
        <Group justify="space-between" align="flex-start" mb="xs">
          {/* <Box> */}
            <Group gap="xs" align="center">
              <Text fz="lg" fw={700} c="dark.9" style={{ letterSpacing: "-0.5px" }}>
                Collateral Details
              </Text>
              <Box px={10} py={2} bg="slate.1" c="slate.7" fw={600} style={{ borderRadius: "var(--mantine-radius-xl)", fontSize: "12px" }}>
                {collaterals.length} Recorded
              </Box>
            </Group>
            <Text fz="sm" c="slate.5" mt={4}>
              Add assets to secure your loan.
            </Text>
            {collateralsError && (
              <Text fz="xs" c="red.6" mt={4}>
                {collateralsError}
              </Text>
            )}
          {/* </Box> */}
          {!readOnly && (
            <Button
              variant="default"
              radius="md"
              size="sm"
              leftSection={<IconPlus size={16} color="var(--mantine-color-slate-4)" />}
              onClick={handleAddCollateral}
              style={{ color: "var(--mantine-color-slate-4)", borderColor: "var(--mantine-color-slate-2)" }}
            >
              Add Collateral
            </Button>
          )}
        </Group>

        {/* <Box style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", margin: "20px 0" }} /> */}

        <Stack gap="sm">
          {collaterals.map((collateral: CollateralEntry, idx: number) => {
            const getInitials = (type: string) => (type ? type.charAt(0).toUpperCase() : "C");
            
            // Generate deterministic colors based on index
            const colors = [
              { bg: "blue.1", c: "blue.8" },
              { bg: "orange.1", c: "orange.8" },
              { bg: "green.1", c: "green.8" },
            ];
            const colorTheme = colors[idx % colors.length];
            const isExpanded = expandedCollaterals.includes(idx);

            return (
              <Box
                key={collateral.id}
                bd="1px solid var(--mantine-color-slate-2)"
                style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
              >
                {isExpanded ? (
                  /* Expanded Form Fields */
                  <Box p="md" bg="slate.0">
                    <Group justify="space-between" mb="md">
                      <Text fz="sm" fw={600} c="dark.9">Collateral {idx + 1} Details</Text>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => toggleCollateral(idx)}
                      >
                        <IconChevronUp size={18} stroke={1.5} color="var(--mantine-color-slate-4)" />
                      </ActionIcon>
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" verticalSpacing="md">
                      <Select
                        radius="md"
                        label={<Label text="Collateral Type" required />}
                        placeholder="Select type"
                        data={COLLATERAL_TYPES}
                        disabled={readOnly}
                        {...form.getInputProps(`collaterals.${idx}.type`)}
                        onBlur={() => form.validateField(`collaterals.${idx}.type`)}
                      />
                      <TextInput
                        radius="md"
                        label={<Label text="Description" required />}
                        placeholder="e.g. 2018 Toyota Hilux"
                        readOnly={readOnly}
                        {...form.getInputProps(`collaterals.${idx}.description`)}
                        onBlur={() => form.validateField(`collaterals.${idx}.description`)}
                      />
                      <TextInput
                        radius="md"
                        label={<Label text="Collateral Value" required />}
                        placeholder="e.g. 150000"
                        readOnly={readOnly}
                        {...form.getInputProps(`collaterals.${idx}.value`)}
                        onBlur={() => form.validateField(`collaterals.${idx}.value`)}
                        // Optional: you could add an onChange to format numbers with commas here
                      />
                      <Select
                        radius="md"
                        label={<Label text="Ownership" required />}
                        placeholder="Select ownership"
                        data={OWNERSHIP_TYPES}
                        disabled={readOnly}
                        {...form.getInputProps(`collaterals.${idx}.ownership`)}
                        onBlur={() => form.validateField(`collaterals.${idx}.ownership`)}
                      />
                    </SimpleGrid>

                    <Group justify="flex-end" mt="md">
                      <Button variant="default" radius="md" onClick={() => toggleCollateral(idx)}>
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
                        {getInitials(collateral.type)}
                      </Box>
                      <Box style={{ overflow: "hidden", flex: 1 }}>
                        <Group gap="sm" mb={6} align="center">
                          <Text fz="15px" fw={600} c="dark.9" truncate>
                            {collateral.type || `Collateral ${idx + 1} (Incomplete)`}
                          </Text>
                          {collateral.ownership && (
                            <Box px={8} py={2} bg="indigo.0" c="indigo.8" fw={600} style={{ borderRadius: "var(--mantine-radius-sm)", fontSize: "11px" }}>
                              {collateral.ownership}
                            </Box>
                          )}
                        </Group>
                        <Group gap="lg" align="center" wrap="nowrap">
                          <Text fz="sm" c="slate.5" truncate>
                            <span style={{ color: "var(--mantine-color-slate-4)" }}>Value:</span> {collateral.value ? `${collateral.value}` : "Pending"}
                          </Text>
                          <Text fz="xs" c="slate.3">•</Text>
                          <Text fz="sm" c="slate.6" truncate style={{ flex: 1 }}>
                            {collateral.description || "Description pending"}
                          </Text>
                        </Group>
                      </Box>
                    </Group>

                    {!readOnly && (
                      <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => toggleCollateral(idx)}
                          aria-label="Edit collateral"
                        >
                          <IconPencil size={18} stroke={1.5} color="var(--mantine-color-slate-4)" />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => handleDeleteCollateral(idx)}
                          aria-label="Delete collateral"
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
      {/* </Box> */}
    </Stack>
  );
}