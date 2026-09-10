import { useState, useEffect } from 'react';
import { Combobox, useCombobox, InputBase } from '@mantine/core';

interface CreatableSelectProps {
  data: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  width?: number | string;
  leftSection?: React.ReactNode;
  textColor?: string;
  fontWeight?: number;
  size?: string;
}

export function CreatableSelect({ data, value, onChange, placeholder, width, leftSection, textColor, fontWeight = 500, size = "xs" }: CreatableSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  
  const [search, setSearch] = useState(value || '');

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const exactOptionMatch = data.some((item) => item.toLowerCase() === search.toLowerCase().trim());

  const options = data
    .filter((item) => item.toLowerCase().includes(search.toLowerCase().trim()))
    .map((item) => (
      <Combobox.Option value={item} key={item}>
        {item}
      </Combobox.Option>
    ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === '$create') {
          onChange(search);
        } else {
          setSearch(val);
          onChange(val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          w={width}
          leftSection={leftSection}
          rightSection={<Combobox.Chevron />}
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onBlur={() => {
             combobox.closeDropdown();
             if (search !== value) onChange(search);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          placeholder={placeholder}
          rightSectionPointerEvents="none"
          radius="md"
          size={size as any}
          styles={{
            input: {
              color: textColor || 'inherit',
              fontWeight: fontWeight,
              borderColor: 'var(--mantine-color-slate-3)'
            }
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create" style={{ fontWeight: 600, color: 'var(--mantine-color-brand-6)' }}>
              + Create "{search}"
            </Combobox.Option>
          )}
          {options.length === 0 && search.trim().length === 0 && (
            <Combobox.Empty>Type to search or create</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
