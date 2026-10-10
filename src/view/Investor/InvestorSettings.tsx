import { useState, type ReactNode } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconDeviceFloppy,
  IconReceipt,
  IconScale,
  IconSettings,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import { searchLedgerAccounts } from "../../api/utils/frappeUtilsApi";
import {
  getInvestorSettings,
  updateInvestorSettings,
} from "../../api/Investor/investorFlowApi";
import type {
  InvestorSettings as InvestorSettingsData,
  InvestorSettingsAccounts,
  InvestorSettingsField,
} from "../../types/Investor/investorFlow";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { openCommonModal } from "../../components/Modal/AlertModal";

/** Searchable dropdown of all ledger (non-group) accounts, via getaccounts. */
function AccountSearchSelect({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const { data: options = [], isFetching } = useQuery({
    queryKey: ["ledgerAccountSearch", debouncedSearch],
    queryFn: () => searchLedgerAccounts(debouncedSearch),
  });
  // Keep the saved account in the list even when it is not in the current search results.
  const data = Array.from(
    new Set([...(value ? [value] : []), ...options.map((a) => a.name)]),
  );

  return (
    <Select
      label={label}
      placeholder="Search account"
      size="sm"
      radius="md"
      required={required}
      clearable={!required}
      searchable
      data={data}
      value={value || null}
      onChange={(v) => onChange(v ?? "")}
      searchValue={search}
      onSearchChange={setSearch}
      filter={({ options: all }) => all}
      rightSection={isFetching ? <Loader size={14} /> : undefined}
      nothingFoundMessage={isFetching ? "Searching…" : "No account found"}
    />
  );
}

const GROUPS: {
  title: string;
  description: string;
  icon: typeof IconBuildingBank;
  color: string;
  fields: InvestorSettingsField[];
}[] = [
  {
    title: "Fund received (Paid from)",
    description:
      "One liability GL for all investors. Each Fund Receipt credits it with the investor as the party.",
    icon: IconScale,
    color: "danger",
    fields: ["investor_creditor_account"],
  },
  {
    title: "Mode of payment (Paid to)",
    description:
      "Where the money lands for each mode of payment. Fund Receipt debits it.",
    icon: IconBuildingBank,
    color: "info",
    fields: [
      "investor_cash_account",
      "cheque_account",
      "bank_draft_account",
      "wire_transfer_account",
    ],
  },
  {
    title: "Repayments",
    description:
      "Used when interest and principal are paid back to investors (later step).",
    icon: IconReceipt,
    color: "warning",
    fields: [
      "company_bank_account",
      "interest_payable_account",
      "interest_expense_account",
      "penalty_expense_account",
    ],
  },
];

/** Mode of payment -> its "Paid to" settings field. */
const MODE_FIELDS: { mode: string; field: InvestorSettingsField }[] = [
  { mode: "Cash", field: "investor_cash_account" },
  { mode: "Cheque", field: "cheque_account" },
  { mode: "Bank Draft", field: "bank_draft_account" },
  { mode: "Wire Transfer", field: "wire_transfer_account" },
];

const accountsFrom = (s: InvestorSettingsData): InvestorSettingsAccounts => ({
  investor_creditor_account: s.accounts.investor_creditor_account ?? "",
  investor_cash_account: s.accounts.investor_cash_account ?? "",
  cheque_account: s.accounts.cheque_account ?? "",
  bank_draft_account: s.accounts.bank_draft_account ?? "",
  wire_transfer_account: s.accounts.wire_transfer_account ?? "",
  company_bank_account: s.accounts.company_bank_account ?? "",
  interest_payable_account: s.accounts.interest_payable_account ?? "",
  interest_expense_account: s.accounts.interest_expense_account ?? "",
  penalty_expense_account: s.accounts.penalty_expense_account ?? "",
});

export function InvestorSettings() {
  const theme = useMantineTheme();
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["investorSettings"],
    queryFn: getInvestorSettings,
    retry: false,
  });

  let body: ReactNode;
  if (isLoading) {
    body = (
      <Group justify="center" py="xl">
        <Loader size="sm" color="brand" />
      </Group>
    );
  } else if (error || !data) {
    body = (
      <Alert variant="light" color="red" radius="md">
        {error ? parseFrappeError(error) : "The settings could not be loaded."}
      </Alert>
    );
  } else {
    body = <SettingsForm key={dataUpdatedAt} settings={data} />;
  }

  return (
    <Stack gap="lg" p="lg">
      <Group gap="sm" align="center">
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--mantine-radius-md)",
            background: theme.other.brandGradient,
            boxShadow: theme.other.brandGlowShadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSettings
            size={20}
            color="var(--mantine-color-white)"
            stroke={1.8}
          />
        </Box>
        <Stack gap={2}>
          <Title order={2} c="slate.8" fw={700}>
            Investor Settings
          </Title>
          <Text fz="sm" c="slate.5">
            GL accounts used for every investor accounting entry
          </Text>
        </Stack>
      </Group>
      {body}
    </Stack>
  );
}

function SettingsForm({ settings }: { settings: InvestorSettingsData }) {
  const queryClient = useQueryClient();
  const [accounts, setAccounts] = useState<InvestorSettingsAccounts>(() =>
    accountsFrom(settings),
  );

  const saved = accountsFrom(settings);
  const isDirty = JSON.stringify(accounts) !== JSON.stringify(saved);
  // Only the required accounts must be set to save; the others are optional.
  const missing = settings.required.filter((f) => !accounts[f]);
  const isConfigured = settings.required.every((f) => !!saved[f]);

  const saveMutation = useMutation({
    mutationFn: () => updateInvestorSettings(accounts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investorSettings"] });
      queryClient.invalidateQueries({
        queryKey: ["investorAccountingSettings"],
      });
      openCommonModal({
        heading: "Settings Saved",
        subtitle: "",
        body: "Investor accounting settings have been saved successfully.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) =>
      openCommonModal({
        heading: "Save Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  const show = (field: InvestorSettingsField) => accounts[field] || "—";

  return (
    <>
      <Paper
        radius="lg"
        p="md"
        style={{
          background: "var(--mantine-color-white)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="xs">
            <Text fz="sm" c="slate.6">
              Company
            </Text>
            <Badge variant="light" color="brand" radius="sm">
              {settings.company || "No default company"}
            </Badge>
            <Badge
              variant="light"
              color={isConfigured ? "success" : "warning"}
              radius="sm"
            >
              {isConfigured ? "Configured" : "Not configured"}
            </Badge>
          </Group>
          <Group gap="sm">
            {missing.length > 0 && (
              <Text fz="xs" c="slate.5">
                {missing.map((f) => settings.labels[f]).join(", ")} required
              </Text>
            )}
            <Button
              radius="xl"
              color="brand"
              leftSection={<IconDeviceFloppy size={16} />}
              disabled={!isDirty || missing.length > 0}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Save
            </Button>
          </Group>
        </Group>
      </Paper>

      <SimpleGrid
        cols={{ base: 1, lg: 3 }}
        spacing="md"
        style={{ alignItems: "start" }}
      >
        {GROUPS.map((group) => (
          <Paper
            key={group.title}
            radius="lg"
            p="md"
            style={{
              background: "var(--mantine-color-white)",
              border: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            <Group gap="sm" mb="md" wrap="nowrap" align="flex-start">
              <ThemeIcon
                size={36}
                radius="md"
                variant="light"
                color={group.color}
              >
                <group.icon size={18} />
              </ThemeIcon>
              <Box>
                <Text fw={700} fz="sm" c="slate.8">
                  {group.title}
                </Text>
                <Text fz="xs" c="slate.5">
                  {group.description}
                </Text>
              </Box>
            </Group>
            <Stack gap="md">
              {group.fields.map((field) => (
                <AccountSearchSelect
                  key={field}
                  label={settings.labels[field]}
                  required={settings.required.includes(field)}
                  value={accounts[field]}
                  onChange={(v) =>
                    setAccounts((prev) => ({ ...prev, [field]: v }))
                  }
                />
              ))}
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper
        radius="lg"
        p="md"
        style={{
          background: "var(--mantine-color-white)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Text fw={700} fz="sm" c="slate.8">
          Entry posted by Fund Receipt
        </Text>
        <Text fz="xs" c="slate.5" mb="sm">
          Money received from an investor: the mode of payment's GL is debited
          (Paid to) and the Investor Creditor GL is credited (Paid from) with
          the investor as the party.
        </Text>
        <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" horizontalSpacing="md" fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Mode of payment</Table.Th>
                <Table.Th>Debit (Paid to)</Table.Th>
                <Table.Th>Credit (Paid from)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {MODE_FIELDS.map(({ mode, field }) => (
                <Table.Tr key={mode}>
                  <Table.Td fw={600}>{mode}</Table.Td>
                  <Table.Td>
                    {accounts[field] || "Not set: this mode can't be used"}
                  </Table.Td>
                  <Table.Td>{show("investor_creditor_account")}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
