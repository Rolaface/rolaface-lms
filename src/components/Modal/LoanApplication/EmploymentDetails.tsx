import { SimpleGrid, TextInput, Select, NumberInput, Table, ActionIcon, Button, Group, Box, Text } from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import { useState } from "react";

interface EmploymentDetailsProps {
  form: UseFormReturnType<any>; // Replace 'any' with your specific form values type
  readOnly?: boolean;
}

const EMPLOYMENT_STATUSES = ["Salaried", "Self Employed", "Pensioner", "Others"];
const EMPLOYMENT_TYPES = ["Government", "Private", "Self-Employed", "Other"];
const INCOME_TYPES = ["Salary", "Business", "Interest Income", "Rentals", "Others"];
const EXPENSE_TYPES = [ "Medical", "Education", "Travel", "Rentals", "Others"];

const LABEL_STYLES = {
  label: { display: "flex", alignItems: "center", marginBottom: 4 },
} as const;

 function Label({
  text,
  required,
  optional,
}: {
  text: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && (
        <span className="text-slate-400 font-normal ml-1">(Optional)</span>
      )}
    </span>
  );
}

export function EmploymentDetails({ form, readOnly = false }: EmploymentDetailsProps) {
  const [incomes, setIncomes] = useState([{ type: "Salary", amount: 0 }]);
  const [expenses, setExpenses] = useState([{ type: "Household", amount: 0 }]);

  const addIncome = () => setIncomes([...incomes, { type: "", amount: 0 }]);
  const updateIncome = (index: number, field: string, value: any) => {
    const newIncomes = [...incomes];
    newIncomes[index] = { ...newIncomes[index], [field]: value };
    setIncomes(newIncomes);
    form.setFieldValue("monthlyIncome", newIncomes); // Optional: sync with form
  };
  const removeIncome = (index: number) => setIncomes(incomes.filter((_, i) => i !== index));

  const addExpense = () => setExpenses([...expenses, { type: "", amount: 0 }]);
  const updateExpense = (index: number, field: string, value: any) => {
    const newExpenses = [...expenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setExpenses(newExpenses);
    form.setFieldValue("monthlyExpense", newExpenses); // Optional: sync with form
  };
  const removeExpense = (index: number) => setExpenses(expenses.filter((_, i) => i !== index));

  const getAvailableIncomeTypes = (currentIndex: number) => {
    const selectedTypes = incomes.filter((_, i) => i !== currentIndex).map(item => item.type);
    return INCOME_TYPES.filter(type => !selectedTypes.includes(type));
  };

  const getAvailableExpenseTypes = (currentIndex: number) => {
    const selectedTypes = expenses.filter((_, i) => i !== currentIndex).map(item => item.type);
    return EXPENSE_TYPES.filter(type => !selectedTypes.includes(type));
  };
return (
    <SimpleGrid
      cols={{ base: 1, xs: 2, lg: 3 }}
      spacing="sm"
      verticalSpacing="xs"
    >
      <Select
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Employment Status" required />}
        placeholder="Select status"
        data={EMPLOYMENT_STATUSES}
        {...form.getInputProps("employmentStatus")}
        disabled={readOnly}
      />

      <Select
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Employment Type" required />}
        placeholder="Select type"
        data={EMPLOYMENT_TYPES}
        {...form.getInputProps("employmentType")}
        disabled={readOnly}
      />

      <TextInput
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Company Name" required />}
        placeholder="e.g. ABC Enterprises Ltd"
        {...form.getInputProps("companyName")}
        readOnly={readOnly}
      />

      <TextInput
        radius="md"
        styles={LABEL_STYLES}
        label={<Label text="Designation" required />}
        placeholder="e.g. Software Engineer"
        {...form.getInputProps("designation")}
        readOnly={readOnly}
      />

      <NumberInput
        min={0}
        allowNegative={false}
        radius="md"
        hideControls
        styles={LABEL_STYLES}
        label={<Label text="Experience (in years)" required />}
        placeholder="e.g. 5"
        {...form.getInputProps("experience")}
        readOnly={readOnly}
      />

{/* Income and Expense Tables */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" style={{ gridColumn: "1 / -1", marginTop: "12px" }}>

        {/* Income Card */}
        <Box p="sm" bd="1px solid var(--mantine-color-gray-2)" style={{ borderRadius: "var(--mantine-radius-xl)" }}>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <Box w={8} h={8} style={{ borderRadius: "50%", backgroundColor: "var(--mantine-color-green-5)" }} />
              <Text fw={700} size="xs" c="dark.8" style={{ letterSpacing: "0.5px" }}>MONTHLY INCOME</Text>
            </Group>
            <Box px={8} py={2} bg="green.0" c="green.8" fw={700} style={{ borderRadius: "var(--mantine-radius-sm)", border: "1px solid var(--mantine-color-green-2)", fontSize: "10px" }}>
              ZMW
            </Box>
          </Group>

          <Box style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {incomes.map((item, index) => (
              <Group key={index} wrap="nowrap" gap="xs">
                <Select
                  size="sm"
                  radius="md"
                  placeholder="Select"
                  data={getAvailableIncomeTypes(index)}
                  value={item.type}
                  onChange={(val) => updateIncome(index, "type", val || "")}
                  disabled={readOnly}
                  allowDeselect={false}
                  style={{ flex: 1.5 }}
                />
                <NumberInput
                  size="sm"
                  radius="md"
                  hideControls
                  placeholder="0.00"
                  thousandSeparator=","
                  value={item.amount}
                  onChange={(val) => updateIncome(index, "amount", val || 0)}
                  readOnly={readOnly}
                  leftSection={<Text size="xs" c="dimmed" pl={4}>ZMW</Text>}
                  styles={{ input: { textAlign: 'right', fontWeight: 600 } }}
                  style={{ flex: 1 }}
                />
                {!readOnly && (
                  <ActionIcon color="gray" variant="subtle" size="sm" onClick={() => removeIncome(index)}>
                    <IconTrash size={16} stroke={1.5} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Box>

          {!readOnly && incomes.length < 5 && (
            <Button
              size="sm"
              variant="default"
              fullWidth
              mt="md"
              radius="md"
              leftSection={<IconPlus size={14} />}
              style={{ borderStyle: "dashed", borderColor: "var(--mantine-color-gray-4)", color: "var(--mantine-color-gray-6)" }}
              onClick={addIncome}
            >
              Add Income Stream
            </Button>
          )}

          <Group justify="space-between" mt="md" pt="sm" align="flex-end" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
            <Text size="10px" fw={700} c="dimmed" style={{ letterSpacing: "0.5px" }}>GROSS MONTHLY INFLOW</Text>
            <Text size="sm" fw={800} c="dark.9">
              ZMW {incomes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Group>
        </Box>

        {/* Expense Card */}
        <Box p="sm" bd="1px solid var(--mantine-color-gray-2)" style={{ borderRadius: "var(--mantine-radius-xl)" }}>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <Box w={8} h={8} style={{ borderRadius: "50%", backgroundColor: "var(--mantine-color-red-5)" }} />
              <Text fw={700} size="xs" c="dark.8" style={{ letterSpacing: "0.5px" }}>MONTHLY EXPENSES</Text>
            </Group>
            <Box px={8} py={2} bg="red.0" c="red.8" fw={700} style={{ borderRadius: "var(--mantine-radius-sm)", border: "1px solid var(--mantine-color-red-2)", fontSize: "10px" }}>
              Outflow
            </Box>
          </Group>

          <Box style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {expenses.map((item, index) => (
              <Group key={index} wrap="nowrap" gap="xs">
                <Select
                  size="sm"
                  radius="md"
                  placeholder="Select"
                  data={getAvailableExpenseTypes(index)}
                  value={item.type}
                  onChange={(val) => updateExpense(index, "type", val || "")}
                  disabled={readOnly}
                  allowDeselect={false}
                  style={{ flex: 1.5 }}
                />
                <NumberInput
                  size="sm"
                  radius="md"
                  hideControls
                  placeholder="0.00"
                  thousandSeparator=","
                  value={item.amount}
                  onChange={(val) => updateExpense(index, "amount", val || 0)}
                  readOnly={readOnly}
                  leftSection={<Text size="xs" c="dimmed" pl={4}>ZMW</Text>}
                  styles={{ input: { textAlign: 'right', fontWeight: 600 } }}
                  style={{ flex: 1 }}
                />
                {!readOnly && (
                  <ActionIcon color="gray" variant="subtle" size="sm" onClick={() => removeExpense(index)}>
                    <IconTrash size={16} stroke={1.5} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Box>

          {!readOnly && expenses.length < 5 && (
            <Button
              size="sm"
              variant="default"
              fullWidth
              mt="md"
              radius="md"
              leftSection={<IconPlus size={14} />}
              style={{ borderStyle: "dashed", borderColor: "var(--mantine-color-gray-4)", color: "var(--mantine-color-gray-6)" }}
              onClick={addExpense}
            >
              Add Expense Item
            </Button>
          )}

          <Group justify="space-between" mt="md" pt="sm" align="flex-end" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
            <Text size="10px" fw={700} c="dimmed" style={{ letterSpacing: "0.5px" }}>MONTHLY OBLIGATIONS</Text>
            <Text size="sm" fw={800} c="dark.9">
              ZMW {expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Group>
        </Box>
      </SimpleGrid>
    </SimpleGrid>
  );
}