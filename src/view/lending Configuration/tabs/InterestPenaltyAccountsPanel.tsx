import {
  Paper,
  Group,
  Text,
  Switch,
  Table,
  Select,
  Skeleton,
} from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { CurrencySymbol } from "../../../components/shared/CurrencyIcon";
import { useInterestPenaltyAccounts } from "../../../hooks/setting/lending-config/useInterestPenaltyAccounts";

export function InterestPenaltyAccountsPanel() {
  const { mappings, glAccounts, sameAsInterest, isLoading } =
    useInterestPenaltyAccounts();

  return (
    <Paper radius="sm" withBorder>
      <Group
        justify="space-between"
        align="center"
        p="md"
        bg="slate.0"
        style={{
          borderBottom: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="xs">
          <CurrencySymbol size="sm" />
          <Text size="sm" fw={600} c="slate.8">
            Account Mapping
          </Text>
        </Group>

        <Switch
          label="Same as interest"
          checked={sameAsInterest}
          color="brand"
          disabled
        />
      </Group>

      <Table.ScrollContainer minWidth={600}>
        <Table
          highlightOnHover={false}
          horizontalSpacing="lg"
          verticalSpacing="sm"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: "33%" }}>Transaction Type</Table.Th>

              <Table.Th style={{ width: "33%" }}>Interest Account</Table.Th>

              <Table.Th
                style={{
                  width: "33%",
                  opacity: sameAsInterest ? 0.6 : 1,
                }}
              >
                Penalty Account
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Skeleton height={20} width="60%" />
                    </Table.Td>

                    <Table.Td>
                      <Skeleton height={30} />
                    </Table.Td>

                    <Table.Td>
                      <Skeleton height={30} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : mappings.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Text size="sm" fw={600} c="slate.8">
                        {row.transaction_type}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Select
                        placeholder={
                          row.interest_account ? undefined : "Not configured"
                        }
                        data={glAccounts}
                        value={row.interest_account}
                        disabled
                      />
                    </Table.Td>

                    <Table.Td bg={sameAsInterest ? "slate.0" : undefined}>
                      <Select
                        placeholder={
                          sameAsInterest
                            ? "Same as interest"
                            : row.penalty_account
                              ? undefined
                              : "Not configured"
                        }
                        data={glAccounts}
                        value={
                          sameAsInterest
                            ? row.interest_account
                            : row.penalty_account
                        }
                        disabled
                        rightSection={
                          sameAsInterest ? <IconLock size={14} /> : undefined
                        }
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

export default InterestPenaltyAccountsPanel;