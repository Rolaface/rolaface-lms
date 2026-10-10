/* Tab 1 - Renewal terms: the contract in force (Section 1), how it is renewed (2) and the renewed terms (3). */
import type { ReactNode } from "react";
import {
  Alert,
  Badge,
  Box,
  Group,
  Loader,
  NumberInput,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAdjustmentsHorizontal,
  IconArrowsExchange,
  IconFileDescription,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  INTEREST_SETTLEMENTS,
  REPAYMENT_FREQUENCIES,
  RENEWAL_STRUCTURES,
  type InterestSettlement,
  type RenewalCandidate,
  type RenewalContract,
  type RenewalStructure,
  type RepaymentFrequency,
} from "../../../../types/Investor/investorFlow";
import { useCompanyStore } from "../../../../store/companyStore";
import { formatAmount, getSymbol } from "../../../../store/currencyStore";
import { fmtDate, toIso } from "../InvestorModalShared";
import {
  INTEREST_SEPARATE,
  STRUCTURE_LABELS,
  newMaturity,
  payoutAtRenewal,
  renewedPrincipal,
  type RenewalFormValues,
} from "./renewalForm";
import { InvestorDateInput } from "../InvestorDateInput";

interface Props {
  /** Add: the investment is picked here. */
  isAdd: boolean;
  readOnly: boolean;
  candidates: RenewalCandidate[];
  candidatesLoading: boolean;
  investmentId: string | null;
  onInvestmentChange: (id: string | null) => void;
  contract: RenewalContract | null;
  contractLoading: boolean;
  values: RenewalFormValues;
  update: (patch: Partial<RenewalFormValues>) => void;
}

function Card({
  icon,
  title,
  subtitle,
  subtitleInline = false,
  aside,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Show the subtitle on the title's line instead of under it. */
  subtitleInline?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      radius="lg"
      p="sm"
      style={{
        background: "var(--mantine-color-white)",
        border: "1px solid var(--mantine-color-slate-2)",
      }}
    >
      <Group justify="space-between" mb="xs" wrap="nowrap" align="center">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={26} radius="md" variant="light" color="brand">
            {icon}
          </ThemeIcon>
          <Box>
            <Group gap={8} wrap="nowrap" align="baseline">
              <Text
                fw={800}
                fz="xs"
                c="slate.8"
                tt="uppercase"
                style={{ letterSpacing: 0.4, whiteSpace: "nowrap" }}
              >
                {title}
              </Text>
              {subtitle && subtitleInline && (
                <Text fz={11} c="slate.5" truncate>
                  {subtitle}
                </Text>
              )}
            </Group>
            {subtitle && !subtitleInline && (
              <Text fz={11} c="slate.5">
                {subtitle}
              </Text>
            )}
          </Box>
        </Group>
        {aside}
      </Group>
      {children}
    </Paper>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "warning";
}) {
  return (
    <Box
      p="xs"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: `1px solid var(--mantine-color-${tone ? "warning-3" : "slate-2"})`,
        background: tone
          ? "var(--mantine-color-warning-0)"
          : "var(--mantine-color-slate-0)",
      }}
    >
      <Text fz={11} c={tone ? "warning.8" : "slate.5"}>
        {label}
      </Text>
      <Text fz="sm" fw={800} c={tone ? "warning.8" : "slate.9"} truncate>
        {value}
      </Text>
    </Box>
  );
}

function SubBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box
      p="xs"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-slate-2)",
        background: "var(--mantine-color-slate-0)",
      }}
    >
      <Text fz="xs" fw={700} c="slate.8" mb={4}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  Pending: "slate",
  Paid: "success",
  Renewed: "brand",
  Expired: "danger",
};

export function RenewalTermsTab({
  isAdd,
  readOnly,
  candidates,
  candidatesLoading,
  investmentId,
  onInvestmentChange,
  contract,
  contractLoading,
  values: v,
  update,
}: Props) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const symbol = getSymbol(companyCurrency);

  const principal = renewedPrincipal(v, contract);
  const maturity = newMaturity(v);
  const payout = payoutAtRenewal(v, contract);
  const monthlyInterest = (principal * (Number(v.rate) || 0)) / 1200;
  const separate = !!v.structure && INTEREST_SEPARATE.includes(v.structure);

  return (
    <Stack gap="sm">
      {/* Section 1 - existing contract */}
      <Card
        icon={<IconFileDescription size={16} />}
        title="Section 1 — Existing contract details"
        subtitle="Read-only, from the contract in force"
        subtitleInline
        aside={
          contract?.payment_status && (
            <Badge
              variant="light"
              radius="xl"
              color={PAYMENT_STATUS_COLOR[contract.payment_status] ?? "slate"}
              style={{ textTransform: "none" }}
            >
              {contract.payment_status}
            </Badge>
          )
        }
      >
        {isAdd && (
          <Select
            mb="xs"
            label={
              <Group justify="space-between" wrap="nowrap" w="100%" gap="sm">
                <span>Investment to renew</span>
                <Text span fz={11} fw={400} c="slate.5" truncate>
                  Renew at expiry (past maturity with money still due) or during
                  the contract (from today up to its maturity).
                </Text>
              </Group>
            }
            styles={{ label: { display: "block", width: "100%" } }}
            placeholder={candidatesLoading ? "Loading…" : "Select investment"}
            size="sm"
            radius="md"
            searchable
            clearable
            data={candidates.map((c) => ({
              value: c.id,
              label: `${c.id} · ${c.investor} · ${c.renewal_kind} · owed ${fmtAmount(c.outstanding_principal + c.unpaid_interest)}`,
            }))}
            value={investmentId}
            onChange={onInvestmentChange}
            rightSection={candidatesLoading ? <Loader size={14} /> : undefined}
            nothingFoundMessage="No investment can be renewed"
          />
        )}
        {contractLoading ? (
          <Group justify="center" py="md">
            <Loader size="sm" color="brand" />
          </Group>
        ) : contract ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="xs">
            <Tile label="Investor" value={contract.investor} />
            <Tile label="Contract reference" value={contract.id} />
            <Tile
              label="Contract principal"
              value={fmtAmount(contract.contract_principal)}
            />
            <Tile
              label="Maturity"
              value={
                contract.contract_maturity
                  ? fmtDate(contract.contract_maturity)
                  : "-"
              }
            />
            <Tile
              label="Outstanding principal"
              value={fmtAmount(contract.outstanding_principal)}
            />
            <Tile
              label="Unpaid accrued interest"
              value={fmtAmount(contract.unpaid_interest)}
              tone="warning"
            />
          </SimpleGrid>
        ) : (
          <Text fz="xs" c="slate.5">
            Select an investment to see its contract.
          </Text>
        )}
      </Card>

      <fieldset
        disabled={readOnly || !contract}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing="md"
          style={{ alignItems: "start" }}
        >
          {/* Section 2 - renewal terms */}
          <Card
            icon={<IconAdjustmentsHorizontal size={16} />}
            title="Section 2 — Renewal terms"
          >
            <Stack gap="xs">
              <Select
                label="Renewal structure"
                placeholder="Select structure"
                withAsterisk
                size="xs"
                radius="md"
                allowDeselect={false}
                data={RENEWAL_STRUCTURES.map((s) => ({
                  value: s,
                  label: STRUCTURE_LABELS[s],
                }))}
                value={v.structure || null}
                onChange={(s) =>
                  update({ structure: (s as RenewalStructure) || "" })
                }
              />
              <InvestorDateInput
                label="Renewal effective date"
                withAsterisk
                size="xs"
                radius="md"
                minDate={
                  contract?.renewal_kind === "Mid-contract"
                    ? toIso(new Date())
                    : (contract?.contract_maturity ?? undefined)
                }
                maxDate={
                  contract?.renewal_kind === "Mid-contract"
                    ? (contract.contract_maturity ?? undefined)
                    : undefined
                }
                description={
                  contract?.renewal_kind === "Mid-contract"
                    ? `Renewal during the contract: from today up to ${contract.contract_maturity ? fmtDate(contract.contract_maturity) : "maturity"}`
                    : contract?.renewal_kind === "At expiry"
                      ? "Renewal at expiry: on or after the maturity date"
                      : undefined
                }
                inputWrapperOrder={["label", "input", "description", "error"]}
                value={v.effectiveDate}
                onChange={(value) => update({ effectiveDate: value })}
              />

              {contract && v.structure === "Capitalization" && (
                <SubBox title="Capitalization breakdown">
                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text fz="xs" c="slate.6">
                        Outstanding principal
                      </Text>
                      <Text fz="xs" fw={700}>
                        {fmtAmount(contract.outstanding_principal)}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text fz="xs" c="slate.6">
                        Unpaid interest
                      </Text>
                      <Text fz="xs" fw={700}>
                        {fmtAmount(contract.unpaid_interest)}
                      </Text>
                    </Group>
                    <Group
                      justify="space-between"
                      pt={4}
                      style={{
                        borderTop: "1px solid var(--mantine-color-slate-2)",
                      }}
                    >
                      <Text fz="sm" fw={700} c="slate.8">
                        Proposed new principal
                      </Text>
                      <Text fz="sm" fw={800} c="brand.7">
                        {fmtAmount(principal)}
                      </Text>
                    </Group>
                  </Stack>
                </SubBox>
              )}

              {contract && separate && (
                <SubBox
                  title={
                    v.structure === "Extended Maturity"
                      ? "Extension details"
                      : "Separate interest settlement"
                  }
                >
                  <Text fz={11} c="slate.5" mb={6}>
                    {v.structure === "Extended Maturity"
                      ? "The principal stays the same. Choose how the unpaid interest is handled."
                      : "Choose how the existing unpaid interest will be handled."}
                  </Text>
                  {contract.unpaid_interest > 0 ? (
                    <>
                      <Radio.Group
                        value={v.interestSettlement || null}
                        onChange={(s) =>
                          update({
                            interestSettlement: s as InterestSettlement,
                          })
                        }
                      >
                        <Stack gap={6}>
                          {INTEREST_SETTLEMENTS.map((s) => (
                            <Radio key={s} value={s} label={s} size="sm" />
                          ))}
                        </Stack>
                      </Radio.Group>
                      {v.interestSettlement ===
                        "Defer to an agreed future date" && (
                        <InvestorDateInput
                          mt="sm"
                          label="Interest settlement date"
                          withAsterisk
                          size="xs"
                          radius="md"
                          value={v.interestSettlementDate}
                          onChange={(value) =>
                            update({
                              interestSettlementDate: value,
                            })
                          }
                        />
                      )}
                    </>
                  ) : (
                    <Text fz="xs" c="slate.6">
                      No interest is owed.
                    </Text>
                  )}
                </SubBox>
              )}

              {contract && v.structure === "Partial Settlement" && (
                <SubBox title="Partial settlement">
                  <NumberInput
                    label={`Amount to be paid now (${symbol})`}
                    withAsterisk
                    size="xs"
                    radius="md"
                    hideControls
                    min={0}
                    thousandSeparator=","
                    leftSection={
                      <Text fz="xs" c="slate.4">
                        {symbol}
                      </Text>
                    }
                    value={v.settlementAmount}
                    onChange={(n) =>
                      update({ settlementAmount: n === "" ? "" : Number(n) })
                    }
                    description={`Owed: ${fmtAmount(contract.outstanding_principal + contract.unpaid_interest)}. The interest is settled first; the rest becomes the renewed principal.`}
                    inputWrapperOrder={[
                      "label",
                      "input",
                      "description",
                      "error",
                    ]}
                  />
                </SubBox>
              )}

              <Textarea
                label="Reason for renewal"
                size="xs"
                radius="md"
                autosize
                minRows={2}
                placeholder="Specify notes or reasons..."
                value={v.reason}
                onChange={(e) => update({ reason: e.currentTarget.value })}
              />
            </Stack>
          </Card>

          {/* Section 3 - proposed terms */}
          <Card
            icon={<IconArrowsExchange size={16} />}
            title="Section 3 — Proposed investment terms"
            subtitle="The terms of the renewed contract"
          >
            <SimpleGrid
              cols={{ base: 1, sm: 3 }}
              spacing="sm"
              verticalSpacing="sm"
              style={{ alignItems: "start" }}
            >
              <NumberInput
                label={`Renewed principal (${symbol})`}
                description="Calculated"
                inputWrapperOrder={["label", "input", "description", "error"]}
                size="xs"
                radius="md"
                hideControls
                readOnly
                thousandSeparator=","
                value={principal || ""}
                styles={{
                  input: {
                    background: "var(--mantine-color-slate-0)",
                    fontWeight: 700,
                  },
                }}
              />
              <NumberInput
                label="Interest rate (% p.a.)"
                withAsterisk
                size="xs"
                radius="md"
                hideControls
                min={0}
                rightSection={
                  <Text fz="xs" c="slate.4">
                    %
                  </Text>
                }
                value={v.rate}
                onChange={(n) => update({ rate: n === "" ? "" : Number(n) })}
              />
              <NumberInput
                label="Penalty rate (% p.a.)"
                description="Optional"
                inputWrapperOrder={["label", "input", "description", "error"]}
                size="xs"
                radius="md"
                hideControls
                min={0}
                rightSection={
                  <Text fz="xs" c="slate.4">
                    %
                  </Text>
                }
                value={v.penaltyRate}
                onChange={(n) =>
                  update({ penaltyRate: n === "" ? "" : Number(n) })
                }
              />
              <NumberInput
                label="Renewal tenure (months)"
                withAsterisk
                size="xs"
                radius="md"
                hideControls
                min={1}
                allowDecimal={false}
                rightSection={
                  <Text fz="xs" c="slate.4">
                    mo
                  </Text>
                }
                value={v.tenure}
                onChange={(n) => update({ tenure: n === "" ? "" : Number(n) })}
              />
              <InvestorDateInput
                label="New maturity date"
                description="Effective date + tenure"
                inputWrapperOrder={["label", "input", "description", "error"]}
                size="xs"
                radius="md"
                readOnly
                value={maturity}
                styles={{
                  input: { background: "var(--mantine-color-slate-0)" },
                }}
              />
              <Select
                label="Payment frequency"
                withAsterisk
                size="xs"
                radius="md"
                allowDeselect={false}
                data={[...REPAYMENT_FREQUENCIES]}
                value={v.frequency}
                onChange={(f) =>
                  update({
                    frequency: (f as RepaymentFrequency) || v.frequency,
                  })
                }
              />
              <InvestorDateInput
                label="First payment date"
                withAsterisk
                size="xs"
                radius="md"
                value={v.firstPayment}
                onChange={(value) => update({ firstPayment: value })}
              />
            </SimpleGrid>

            <SimpleGrid
              cols={3}
              spacing={0}
              mt="md"
              style={{
                border: "1px solid var(--mantine-color-slate-2)",
                borderRadius: "var(--mantine-radius-md)",
              }}
            >
              {[
                {
                  label: "Payout at settlement",
                  value: fmtAmount(payout),
                  color: "danger.6",
                },
                {
                  label: "Renewed contract principal",
                  value: fmtAmount(principal),
                  color: "brand.7",
                },
                {
                  label: "Est. monthly interest",
                  value: `${fmtAmount(monthlyInterest)} / mo`,
                  color: "success.7",
                },
              ].map((k, i) => (
                <Box
                  key={k.label}
                  p="xs"
                  ta="center"
                  style={{
                    borderLeft: i
                      ? "1px solid var(--mantine-color-slate-2)"
                      : undefined,
                  }}
                >
                  <Text fz={11} c="slate.5">
                    {k.label}
                  </Text>
                  <Text fz="sm" fw={800} c={k.color}>
                    {k.value}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            <Alert
              mt="sm"
              variant="light"
              color="warning"
              radius="md"
              icon={<IconInfoCircle size={16} />}
              p="xs"
            >
              <Text fz={11}>
                The new maturity date is always the effective date plus the
                tenure, so the two can never conflict.
              </Text>
            </Alert>
          </Card>
        </SimpleGrid>
      </fieldset>
    </Stack>
  );
}
