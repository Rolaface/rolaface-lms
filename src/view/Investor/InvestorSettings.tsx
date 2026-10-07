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

const GROUPS: {
  title: string;
  description: string;
  icon: typeof IconBuildingBank;
  color: string;
  fields: InvestorSettingsField[];
}[] = [
  {
    title: "Cash",
    description: "Where investor money arrives and payouts leave.",
    icon: IconBuildingBank,
    color: "info",
    fields: ["company_bank_account"],
  },
  {
    title: "Liabilities",
    description: "What the company owes investors. The investor is the party on these lines.",
    icon: IconScale,
    color: "danger",
    fields: ["investor_deposit_account", "interest_payable_account"],
  },
  {
    title: "Expenses",
    description: "The company's cost of interest and late-payout penalty.",
    icon: IconReceipt,
    color: "warning",
    fields: ["interest_expense_account", "penalty_expense_account"],
  },
];

const accountsFrom = (s: InvestorSettingsData): InvestorSettingsAccounts => ({
  company_bank_account: s.accounts.company_bank_account ?? "",
  investor_deposit_account: s.accounts.investor_deposit_account ?? "",
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
          <IconSettings size={20} color="var(--mantine-color-white)" stroke={1.8} />
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
  const [accounts, setAccounts] = useState<InvestorSettingsAccounts>(() => accountsFrom(settings));

  const saved = accountsFrom(settings);
  const isDirty = JSON.stringify(accounts) !== JSON.stringify(saved);
  const missing = (Object.keys(accounts) as InvestorSettingsField[]).filter((f) => !accounts[f]);
  const isConfigured = (Object.keys(saved) as InvestorSettingsField[]).every((f) => !!saved[f]);

  const saveMutation = useMutation({
    mutationFn: () => updateInvestorSettings(accounts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investorSettings"] });
      queryClient.invalidateQueries({ queryKey: ["investorAccountingSettings"] });
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
            <Badge variant="light" color={isConfigured ? "success" : "warning"} radius="sm">
              {isConfigured ? "Configured" : "Not configured"}
            </Badge>
          </Group>
          <Group gap="sm">
            {missing.length > 0 && (
              <Text fz="xs" c="slate.5">
                {missing.length} account{missing.length > 1 ? "s" : ""} left to select
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

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
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
              <ThemeIcon size={36} radius="md" variant="light" color={group.color}>
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
                <Select
                  key={field}
                  label={settings.labels[field]}
                  description={`Must be ${settings.rules[field]}.`}
                  placeholder={
                    settings.options[field].length ? "Select account" : "No matching account"
                  }
                  size="sm"
                  radius="md"
                  required
                  searchable
                  data={settings.options[field]}
                  value={accounts[field] || null}
                  onChange={(v) => setAccounts((prev) => ({ ...prev, [field]: v ?? "" }))}
                  nothingFoundMessage="No matching account"
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
          Entries posted with these accounts
        </Text>
        <Text fz="xs" c="slate.5" mb="sm">
          Every Journal Entry in the investor flow uses only these accounts.
        </Text>
        <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" horizontalSpacing="md" fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>When</Table.Th>
                <Table.Th>Debit</Table.Th>
                <Table.Th>Credit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={600}>Receive Payment</Table.Td>
                <Table.Td>{show("company_bank_account")}</Table.Td>
                <Table.Td>{show("investor_deposit_account")}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>Schedule row due (daily job)</Table.Td>
                <Table.Td>
                  {show("interest_expense_account")}
                  <br />
                  {show("penalty_expense_account")} (penalty)
                </Table.Td>
                <Table.Td>{show("interest_payable_account")}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>Pay schedule row</Table.Td>
                <Table.Td>
                  {show("investor_deposit_account")} (principal)
                  <br />
                  {show("interest_payable_account")} (interest + penalty)
                </Table.Td>
                <Table.Td>{show("company_bank_account")}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
