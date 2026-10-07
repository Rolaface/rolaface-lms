import { SimpleGrid, TextInput, Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { LoanApplicationValues } from "./form";
import { useCountryOptions } from "./lookups";

const PROVINCES = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
];

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-slate-800">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

interface AddressFieldsProps {
  form: UseFormReturnType<LoanApplicationValues>;
  path: "current_address" | "permanent_address" | "office_address";
  required?: boolean;
  readOnly?: boolean;
}

export function AddressFields({ form, path, required = false, readOnly = false }: AddressFieldsProps) {
  const { options: countryOptions, isLoading } = useCountryOptions();

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="sm">
      <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="Address Line 1" required={required} />}
          placeholder="Plot / street, area"
          readOnly={readOnly}
          style={{ flex: 1 }}
          {...form.getInputProps(`${path}.address_line1`)}
        />
        <TextInput
          maxLength={140}
          radius="md"
          label={<Label text="Address Line 2" />}
          placeholder="Apartment, suite, etc."
          readOnly={readOnly}
          style={{ flex: 1 }}
          {...form.getInputProps(`${path}.address_line2`)}
        />
      </div>
      <TextInput
        maxLength={140}
        radius="md"
        label={<Label text="City / Town" required={required} />}
        placeholder="e.g. Lusaka"
        readOnly={readOnly}
        {...form.getInputProps(`${path}.city`)}
      />
      <Select
        radius="md"
        searchable
        clearable
        label={<Label text="State / Province" />}
        placeholder="Select"
        disabled={readOnly}
        data={PROVINCES}
        {...form.getInputProps(`${path}.state`)}
        value={form.values[path].state || null}
        onChange={(value) => form.setFieldValue(`${path}.state`, value ?? "")}
      />
      <Select
        radius="md"
        searchable
        clearable
        label={<Label text="Country" required={required} />}
        placeholder={isLoading ? "Loading..." : "Select"}
        disabled={isLoading || readOnly}
        data={countryOptions}
        {...form.getInputProps(`${path}.country`)}
      />
      <TextInput
        maxLength={140}
        radius="md"
        label={<Label text="Postal Code" />}
        placeholder="e.g. 10101"
        readOnly={readOnly}
        {...form.getInputProps(`${path}.pincode`)}
      />
    </SimpleGrid>
  );
}
