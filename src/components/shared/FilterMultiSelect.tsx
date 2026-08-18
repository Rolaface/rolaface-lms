import {
  Combobox,
  useCombobox,
  Group,
  Text,
  CheckIcon,
  UnstyledButton,
  ScrollArea,
  Loader,
  Box,
} from "@mantine/core";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";

export interface FilterMultiSelectOption {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  placeholder: string;
  data: FilterMultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  width?: number;
}


export function FilterMultiSelect({
  placeholder,
  data,
  value,
  onChange,
  searchable,
  searchValue,
  onSearchChange,
  loading,
  disabled,
  width = 150,
}: FilterMultiSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const handleToggle = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    );
  };

  const displayLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? data.find((d) => d.value === value[0])?.label || value[0]
        : `${value.length} selected`;

  const options = data.map((item) => {
    const checked = value.includes(item.value);
    return (
      <Combobox.Option value={item.value} key={item.value} active={checked}>
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 16,
              height: 16,
              borderRadius: "var(--mantine-radius-xs)",
              border: `1px solid ${
                checked
                  ? "var(--mantine-color-brand-6)"
                  : "var(--mantine-color-slate-3)"
              }`,
              background: checked
                ? "var(--mantine-color-brand-6)"
                : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {checked && (
              <CheckIcon size={10} color="var(--mantine-color-white)" />
            )}
          </Box>
          <Text fz="xs" c="slate.7">
            {item.label}
          </Text>
        </Group>
      </Combobox.Option>
    );
  });

  return (
    <Combobox store={combobox} withinPortal onOptionSubmit={handleToggle}>
      <Combobox.Target>
        <UnstyledButton
          disabled={disabled}
          onClick={() => combobox.toggleDropdown()}
          style={{
            width,
            flexShrink: 0,
            border: "1px solid var(--mantine-color-slate-3)",
            borderRadius: "var(--mantine-radius-xl)",
            padding: "6px 10px",
            background: "var(--mantine-color-white)",
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <Group justify="space-between" wrap="nowrap" gap={4}>
            <Text
              fz="xs"
              c={value.length ? "slate.8" : "slate.4"}
              fw={value.length ? 600 : 400}
              truncate
            >
              {displayLabel}
            </Text>
            <IconChevronDown
              size={14}
              style={{ opacity: 0.6, flexShrink: 0 }}
            />
          </Group>
        </UnstyledButton>
      </Combobox.Target>

      <Combobox.Dropdown>
        {searchable && (
          <Combobox.Search
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.currentTarget.value)}
            placeholder="Search..."
            leftSection={<IconSearch size={12} />}
          />
        )}
        <Combobox.Options>
          <ScrollArea.Autosize mah={220} type="scroll">
            {loading ? (
              <Group justify="center" py="sm">
                <Loader size="xs" color="brand" />
              </Group>
            ) : options.length > 0 ? (
              options
            ) : (
              <Combobox.Empty>No options</Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}