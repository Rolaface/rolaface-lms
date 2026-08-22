import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Select,
  NumberInput,
  TextInput,
  ActionIcon,
  Paper,
  Text,
  Button,
  Group,
  Box,
  SimpleGrid
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconReceipt2,
  IconChevronLeft,
  IconChevronRight,
  IconPercentage, 
  IconRepeat,     
  IconCalendarEvent 
} from "@tabler/icons-react";
import { getAllIPAccounts } from "../../../api/productApi";
import { useQuery } from "@tanstack/react-query";
import { getAllItems } from "../../../api/productApi";
export interface ChargeRow {
  id: string;
  feeName: string;
  amount: number | "";
  account: string;
  treatment: string;
}

interface ChargesTabProps {
  charges: ChargeRow[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof ChargeRow, value: string | number) => void;
  onRemove: (id: string) => void;
  interestRate?: number | "";
  penaltyRate?: number | "";
  gracePeriodDays?: number | "";
  onInterestRateChange?: (value: number | "") => void;
  onPenaltyRateChange?: (value: number | "") => void;
  onGracePeriodChange?: (value: number | "") => void;
}

const ROWS_PER_PAGE = 3;

const TREATMENT_OPTIONS = [
  { value: "Billed Separately", label: "Billed Separately" },
  { value: "Add to first repayment", label: "Add to first repayment" },
];

export function ChargesTab({
  charges,
  onAdd,
  onUpdate,
  onRemove,
  interestRate,
  penaltyRate,
  gracePeriodDays,
  onInterestRateChange,
  onPenaltyRateChange,
  onGracePeriodChange,
}: ChargesTabProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(charges.length / ROWS_PER_PAGE));

  const [accountSearch, setAccountSearch] = useState("");

const { data: accountsResponse, isLoading: isAccountsLoading } = useQuery({
  queryKey: ["ipAccounts", accountSearch],
  queryFn: () => getAllIPAccounts(accountSearch),
});

// const accountOptions = useMemo(() => {
//    const accounts = accountsResponse?.data || [];

//    if (!Array.isArray(accounts)) return [];

//   return accounts.map((a: any) => ({
//     value: String(a.value),
//     label: String(a.label),
//   }));
// }, [accountsResponse]);
const selectedAccountValues = useMemo(
  () => Array.from(new Set(charges.map((c) => c.account).filter(Boolean))),
  [charges]
);

const { data: selectedAccountsResponse } = useQuery({
  queryKey: ["ipAccounts", "selected", selectedAccountValues],
  queryFn: async () => {
    const results = await Promise.all(
      selectedAccountValues.map((v) => getAllIPAccounts(v))
    );
    return results.flatMap((r) => r?.data || []);
  },
  enabled: selectedAccountValues.length > 0,
});

const accountOptions = useMemo(() => {
  const accounts = accountsResponse?.data || [];
  const merged = Array.isArray(accounts) ? [...accounts] : [];
  const selected = selectedAccountsResponse || [];
  selected.forEach((a: any) => {
    if (!merged.some((m: any) => String(m.value) === String(a.value))) {
      merged.push(a);
    }
  });
  return merged.map((a: any) => ({
    value: String(a.value),
    label: String(a.label),
  }));
}, [accountsResponse, selectedAccountsResponse]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCharges = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return charges.slice(start, start + ROWS_PER_PAGE);
  }, [charges, page]);


  const handleAdd = () => {
    onAdd();
    const nextTotalPages = Math.max(1, Math.ceil((charges.length + 1) / ROWS_PER_PAGE));
    setPage(nextTotalPages);
  };

  const { data: itemsResponse, isFetching: isFetchingItems } = useQuery({
      queryKey: ["allItems"],
      queryFn: getAllItems,
    });

   const itemOptions = useMemo(() => {
    const items = itemsResponse?.data;
    if (!Array.isArray(items)) return [];
    return items
      .map((i: any) => (typeof i === "string" ? i : i?.name ?? i?.value))
      .filter((v): v is string => typeof v === "string" && v.length > 0);
  }, [itemsResponse]);

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      {/* Interest & Penalty Section */}
      <Box p="md" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <Paper withBorder p="md" radius="md">
            {/* <Text size="xs" fw={700} c="dimmed" mb="md">
              INTEREST
            </Text> */}
            <Group align="flex-start" grow>
              <NumberInput
  label="Interest Rate (%)"
  withAsterisk
  placeholder="Enter rate"
  leftSection={<IconPercentage size={16} />}
  hideControls
  value={interestRate}
  onChange={(val) => onInterestRateChange?.(val as number | "")}
/>
              <Select
                label="Interest Frequency"
                // withAsterisk
                placeholder="Select frequency"
                leftSection={<IconRepeat size={16} />}
                data={["Daily", "Weekly", "Monthly", "Yearly"]} // Replace with your actual constants
              />
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <SimpleGrid cols={3} spacing="md">
            <NumberInput
  label="Penalty Rate (%)"
  withAsterisk
  placeholder="Enter rate"
  leftSection={<IconPercentage size={16} />}
  hideControls
  value={penaltyRate}
  onChange={(val) => onPenaltyRateChange?.(val as number | "")}
/>
              <Select
                label="Penalty Frequency"
                // withAsterisk
                placeholder="Select frequency"
                leftSection={<IconRepeat size={16} />}
                data={["Daily", "Weekly", "Monthly", "Yearly"]}
              />
              <NumberInput
  label="Grace Period (Days)"
  placeholder="Enter days"
  leftSection={<IconCalendarEvent size={16} />}
  hideControls
  value={gracePeriodDays}
  onChange={(val) => onGracePeriodChange?.(val as number | "")}
/>
            </SimpleGrid>
          </Paper>
        </SimpleGrid>
      </Box>
      <Table.ScrollContainer minWidth={650}>
        <Table verticalSpacing="sm" horizontalSpacing="md" className="w-full">
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-16">No.</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Account</Table.Th>
              <Table.Th>Treatment</Table.Th>
              <Table.Th className="w-24" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <IconReceipt2 size={22} style={{ color: "var(--mantine-color-slate-3)" }} />
                    <Text size="xs" c="slate.4">
                      No charges added yet. Click &ldquo;+ Add charge&rdquo; to create one.
                    </Text>
                  </div>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedCharges.map((c, index) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Text size="sm" fw={500} c="slate.6">
                      {(page - 1) * ROWS_PER_PAGE + index + 1}
                    </Text>
                  </Table.Td>
                  {/* <Table.Td>
                    <Select
                      size="sm"
                      value={c.feeName}
                      onChange={(val) => onUpdate(c.id, "feeName", val || "")}
                      placeholder="Select type"
                    />
                  </Table.Td> */}
                    <Table.Td>
                    {/* <TextInput
                      size="sm"
                      value={c.feeName}
                      onChange={(val) => onUpdate(c.id, "feeName", val.currentTarget.value)}
                      placeholder="Select type"
                    /> */}
                    <Table.Td>
  <Select
    size="sm"
    data={itemOptions}
    value={c.feeName}
    onChange={(val) => onUpdate(c.id, "feeName", val || "")}
    placeholder="Select type"
    searchable
    clearable={!!c.feeName}
    disabled={isFetchingItems}
  />
</Table.Td>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="sm"
                      value={c.amount}
                      hideControls
                      min={0}
                      onChange={(val) => onUpdate(c.id, "amount", val as number)}
                      placeholder="0.00"
                    />
                  </Table.Td>
                  <Table.Td>
                 <Select
  size="sm"
  data={accountOptions}
  value={c.account}
  searchable
 clearable={!!c.account} 
  disabled={isAccountsLoading}
  placeholder="Search account..."
  onSearchChange={setAccountSearch}
  // filter={() => true} 
  onChange={(val) => onUpdate(c.id, "account", val || "")}
/>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="sm"
                       data={TREATMENT_OPTIONS}
                      value={c.treatment}
                      onChange={(val) => onUpdate(c.id, "treatment", val || "")}
                      placeholder="Select type"
                    />
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1 justify-end">
                      <ActionIcon variant="subtle" color="slate" size="sm">
                        <IconPencil size={16} stroke={1.5} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        onClick={() => onRemove(c.id)}
                      >
                        <IconTrash size={16} stroke={1.5} />
                      </ActionIcon>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group
        justify="space-between"
        className="p-3"
        style={{ borderTop: "1px solid var(--mantine-color-slate-2)", background: "var(--mantine-color-white)" }}
      >
        <Button
          variant="subtle"
          color="brand"
          size="xs"
          leftSection={<IconPlus size={16} stroke={2.5} />}
          onClick={handleAdd}
        >
          Add charge
        </Button>

        {charges.length > ROWS_PER_PAGE && (
          <Group gap="xs">
            <Text size="xs" c="slate.5">
              Page {page} of {totalPages}
            </Text>
            <ActionIcon
              variant="default"
              size="sm"
              radius="md"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <IconChevronLeft size={14} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              size="sm"
              radius="md"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <IconChevronRight size={14} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    </Paper>
  );
}