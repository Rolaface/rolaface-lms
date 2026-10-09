/* Statement: every fund paid in and every payout received, with the principal balance; downloadable as PDF. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCash,
  IconDownload,
  IconLock,
  IconPercentage,
  IconReceipt2,
} from "@tabler/icons-react";
import { useCompanyStore } from "../../../store/companyStore";
import { getInvestorStatement } from "../../../api/Investor/investorFlowApi";
import type { InvestorPortfolio } from "../../../types/Investor/investorFlow";
import {
  buildInvestorStatementPdf,
  getPdfPalette,
} from "../../../components/Modal/Investor/Investmentpdf";
import { Card, CardTitle, ErrorBlock, KpiTile, LoadingBlock } from "./ui";
import { fmtDate, useMoney } from "./format";

interface Props {
  portfolio: InvestorPortfolio;
  onOpenEntry: (journalEntry: string) => void;
}

const ALL = "__all__";

export function StatementPanel({ portfolio, onOpenEntry }: Props) {
  const theme = useMantineTheme();
  const money = useMoney();
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const investorId = portfolio.investor.id;
  const [investment, setInvestment] = useState<string>(ALL);
  const investmentFilter = investment === ALL ? null : investment;

  const { data, isError, error } = useQuery({
    queryKey: ["investorStatement", investorId, investmentFilter],
    queryFn: () => getInvestorStatement(investorId, investmentFilter),
    retry: false,
  });

  const downloadPdf = () => {
    if (!data) return;
    const doc = buildInvestorStatementPdf(
      data,
      getPdfPalette(theme),
      companyCurrency,
    );
    doc.save(
      `Statement-${investorId}${investmentFilter ? `-${investmentFilter}` : ""}.pdf`,
    );
  };

  return (
    <Stack gap="md">
      <Card>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <CardTitle
            title="Statement"
            subtitle="Money paid in by the investor and money paid back, by date"
          />
          <Group gap="sm" align="flex-end">
            <Select
              size="sm"
              radius="md"
              w={260}
              label="Investment"
              data={[
                { value: ALL, label: "All investments" },
                ...portfolio.investments.map((i) => ({
                  value: i.name,
                  label: `${i.name} · ${i.investment_product_name}`,
                })),
              ]}
              value={investment}
              onChange={(v) => setInvestment(v ?? ALL)}
              allowDeselect={false}
            />
            <Button
              radius="xl"
              color="brand"
              leftSection={<IconDownload size={16} />}
              disabled={!data || data.entries.length === 0}
              onClick={downloadPdf}
            >
              Download PDF
            </Button>
          </Group>
        </Group>
      </Card>

      {isError ? (
        <ErrorBlock
          error={error}
          fallback="The statement could not be loaded."
        />
      ) : !data ? (
        <LoadingBlock />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <KpiTile
              icon={<IconCash size={18} />}
              color="info"
              label="Paid in"
              value={money(data.totals.paid_in)}
            />
            <KpiTile
              icon={<IconArrowBackUp size={18} />}
              color="success"
              label="Principal returned"
              value={money(data.totals.principal_returned)}
            />
            <KpiTile
              icon={<IconPercentage size={18} />}
              color="grape"
              label="Interest paid"
              value={money(data.totals.interest_paid)}
            />
            <KpiTile
              icon={<IconLock size={18} />}
              color="warning"
              label="Principal held"
              value={money(data.totals.closing_balance)}
              hint="Closing balance"
            />
          </SimpleGrid>

          <Card>
            <Table.ScrollContainer minWidth={960}>
              <Table
                verticalSpacing="sm"
                horizontalSpacing="sm"
                fz="xs"
                highlightOnHover
                striped
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Investment</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th ta="right">Paid in</Table.Th>
                    <Table.Th ta="right">Principal returned</Table.Th>
                    <Table.Th ta="right">Interest paid</Table.Th>
                    <Table.Th ta="right">Balance</Table.Th>
                    <Table.Th ta="right">Accounting</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.entries.map((e, i) => (
                    <Table.Tr key={`${e.journal_entry ?? ""}-${i}`}>
                      <Table.Td>{fmtDate(e.date)}</Table.Td>
                      <Table.Td fw={600}>{e.investment}</Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          radius="xl"
                          size="sm"
                          color={e.type === "Payout" ? "success" : "info"}
                          style={{ textTransform: "none" }}
                        >
                          {e.type}
                        </Badge>
                      </Table.Td>
                      <Table.Td c="slate.6">{e.description}</Table.Td>
                      <Table.Td ta="right" c={e.paid_in ? "info.7" : "slate.4"}>
                        {e.paid_in ? money(e.paid_in) : "-"}
                      </Table.Td>
                      <Table.Td
                        ta="right"
                        c={e.principal_returned ? "success.7" : "slate.4"}
                      >
                        {e.principal_returned
                          ? money(e.principal_returned)
                          : "-"}
                      </Table.Td>
                      <Table.Td
                        ta="right"
                        c={e.interest_paid ? "success.7" : "slate.4"}
                      >
                        {e.interest_paid ? money(e.interest_paid) : "-"}
                      </Table.Td>
                      <Table.Td ta="right" fw={700}>
                        {money(e.balance)}
                      </Table.Td>
                      <Table.Td>
                        <Group justify="flex-end">
                          {e.journal_entry && (
                            <Tooltip label={e.journal_entry} withArrow>
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="brand"
                                radius="md"
                                onClick={() => onOpenEntry(e.journal_entry!)}
                              >
                                <IconReceipt2 size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {data.entries.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={9}>
                        <Text fz="xs" c="dimmed" ta="center" py="md">
                          No approved fund or payout yet.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                {data.entries.length > 0 && (
                  <Table.Tfoot>
                    <Table.Tr
                      style={{ background: "var(--mantine-color-slate-0)" }}
                    >
                      <Table.Td colSpan={4} fw={700}>
                        Total
                      </Table.Td>
                      <Table.Td ta="right" fw={700}>
                        {money(data.totals.paid_in)}
                      </Table.Td>
                      <Table.Td ta="right" fw={700}>
                        {money(data.totals.principal_returned)}
                      </Table.Td>
                      <Table.Td ta="right" fw={700}>
                        {money(data.totals.interest_paid)}
                      </Table.Td>
                      <Table.Td ta="right" fw={800}>
                        {money(data.totals.closing_balance)}
                      </Table.Td>
                      <Table.Td />
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            </Table.ScrollContainer>
          </Card>
        </>
      )}
    </Stack>
  );
}
