import React from "react";
import {
  Table,
  Select,
  TextInput,
  NumberInput,
  ActionIcon,
  Tooltip,
  Text,
  Box,
} from "@mantine/core";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import type {
  JournalEntryLine,
  JournalEntryLineError,
  SelectOption,
} from "../../../types/Accounting/Journalentry.types";

interface JournalEntryLineRowProps {
  entry: JournalEntryLine;
  index: number;
  accountOptions: SelectOption[];
  partyTypeOptions: SelectOption[];
  customerOptions: SelectOption[];
  supplierOptions: SelectOption[];
  isReadOnly: boolean;
  rowError?: JournalEntryLineError;
  onChange: (
    index: number,
    field: keyof JournalEntryLine,
    value: string,
    extraUpdates?: Partial<JournalEntryLine>,
  ) => void;
  onRemove: (index: number) => void;
}

const toSelectData = (options: SelectOption[]) =>
  options.map((o) => ({ value: o.value, label: o.label }));

const JournalEntryLineRow: React.FC<JournalEntryLineRowProps> = ({
  entry,
  index,
  accountOptions,
  partyTypeOptions,
  customerOptions,
  supplierOptions,
  isReadOnly,
  rowError,
  onChange,
  onRemove,
}) => {
  const isPartyDropdown =
    entry.partyType === "Customer" || entry.partyType === "Supplier";
  const partyOptions =
    entry.partyType === "Customer" ? customerOptions : supplierOptions;

  return (
    <Table.Tr>
      <Table.Td ta="center">
        <Text fz="xs" c="slate.4">
          {index + 1}
        </Text>
      </Table.Td>
      <Table.Td>
        <Select
          size="xs"
          placeholder="Select account"
          searchable
          data={toSelectData(accountOptions)}
          value={entry.account || null}
          onChange={(value) => {
            const selected = accountOptions.find((o) => o.value === value);
            onChange(index, "account", value || "", {
              ccy: selected?.currency || "",
              exchange_rate: "",
            });
          }}
          disabled={isReadOnly}
          error={rowError?.account}
        />
      </Table.Td>

      <Table.Td ta="center">
        <Text
          fz="10px"
          fw={700}
          c="slate.4"
          style={{
            background: "var(--mantine-color-slate-0)",
            padding: "4px 6px",
            borderRadius: "var(--mantine-radius-sm)",
            display: "inline-block",
          }}
        >
          {entry.ccy || "CCY"}
        </Text>
      </Table.Td>

      <Table.Td>
        <Select
          size="xs"
          data={[
            { value: "Dr", label: "Dr" },
            { value: "Cr", label: "Cr" },
          ]}
          value={entry.entryType}
          onChange={(value) => onChange(index, "entryType", value || "Dr")}
          disabled={isReadOnly}
          allowDeselect={false}
        />
      </Table.Td>

      <Table.Td>
        {entry.isRateMissing ? (
          <Tooltip
            label={`No exchange rate found for ${entry.ccy || "this currency"}. Add a Currency Exchange record, or wait for the rate confirmation prompt.`}
            multiline
            w={220}
            withArrow
            color="danger"
          >
            <Box style={{ position: "relative" }}>
              <NumberInput
                size="xs"
                placeholder="0.00"
                value={entry.amount === "" ? undefined : Number(entry.amount)}
                onChange={(value) =>
                  onChange(index, "amount", value === "" ? "" : String(value))
                }
                disabled
                hideControls
                error={rowError?.amount}
                styles={{
                  input: {
                    textAlign: "right",
                    borderColor: "var(--mantine-color-danger-3)",
                    paddingRight: 24,
                  },
                }}
                rightSection={
                  <IconAlertTriangle size={13} color="var(--mantine-color-danger-5)" />
                }
              />
            </Box>
          </Tooltip>
        ) : (
          <NumberInput
            size="xs"
            placeholder="0.00"
            value={entry.amount === "" ? undefined : Number(entry.amount)}
            onChange={(value) =>
              onChange(index, "amount", value === "" ? "" : String(value))
            }
            disabled={isReadOnly}
            hideControls
            error={rowError?.amount}
            styles={{ input: { textAlign: "right" } }}
          />
        )}
      </Table.Td>

      <Table.Td>
        <Select
          size="xs"
          placeholder="Select type"
          data={toSelectData(partyTypeOptions)}
          value={entry.partyType || null}
          onChange={(value) => onChange(index, "partyType", value || "")}
          disabled={isReadOnly}
          clearable
        />
      </Table.Td>

      <Table.Td>
        {isPartyDropdown ? (
          <Select
            size="xs"
            searchable
            data={toSelectData(partyOptions)}
            value={entry.party || null}
            onChange={(value) => onChange(index, "party", value || "")}
            disabled={isReadOnly}
          />
        ) : (
          <TextInput
            size="xs"
            placeholder="Enter Party Name"
            value={entry.party}
            onChange={(e) => onChange(index, "party", e.currentTarget.value)}
            disabled={isReadOnly}
          />
        )}
      </Table.Td>

      <Table.Td>
        <TextInput
          size="xs"
          value={entry.exchange_rate}
          disabled
          readOnly
          styles={{
            input: {
              textAlign: "right",
              backgroundColor: "var(--mantine-color-slate-0)",
            },
          }}
        />
      </Table.Td>

      <Table.Td>
        <TextInput
          size="xs"
          value={entry.remark}
          onChange={(e) => onChange(index, "remark", e.currentTarget.value)}
          disabled={isReadOnly}
        />
      </Table.Td>

      {!isReadOnly && (
        <Table.Td ta="center">
          <ActionIcon
            color="danger"
            variant="subtle"
            size="sm"
            radius="md"
            onClick={() => onRemove(index)}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Table.Td>
      )}
    </Table.Tr>
  );
};

export default JournalEntryLineRow;