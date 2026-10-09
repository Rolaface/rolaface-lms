import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconCircleCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInvestorEarningById,
  getInvestorMaturityById,
  redeemInvestorFlow,
  renewInvestorFlow,
} from "../../../api/Investor/investorFlowApi";
import { getEveryInvestmentProduct } from "../../../api/Investor/productApi";
import {
  REPAYMENT_FREQUENCIES,
  type InvestorMaturity,
  type InvestorRenewalTerms,
  type RepaymentFrequency,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../AlertModal";
import {
  KeyValueList,
  KpiGrid,
  SectionBox,
  Tag,
  createInitialState,
  fmtDate,
  loadInvestorFlowState,
  scheduleFromEarning,
  type ModalState,
} from "./InvestorModalShared";
import {
  STAGES,
  StageShell,
  StageSideNav,
  ViewOnlyBar,
  type StageId,
} from "./StageShell";
import { EarningsStatementsView } from "./EarningsStatementModal";
import { ProcessingReadOnlyView } from "./InvestorModal";
import { formatAmount } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";

type Decision = "redeem" | "renew";

const STAGE_INDEX = 2;

const showFailure = (heading: string, error: any) =>
  openCommonModal({
    heading,
    subtitle: "We couldn't complete your request.",
    body: parseFrappeError(error),
    color: "red",
    buttons: [{ label: "Close", color: "red" }],
  });

/* ------------------------------------------------------------------ */
/* Maturity content                                                    */
/* ------------------------------------------------------------------ */

function DecisionCard({
  selected,
  disabled,
  icon: Icon,
  title,
  text,
  onClick,
}: {
  selected: boolean;
  disabled: boolean;
  icon: typeof IconCircleCheck;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      disabled={disabled}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Paper
        radius="md"
        p="md"
        h="100%"
        style={{
          border: `1px solid ${
            selected
              ? "var(--mantine-color-brand-6)"
              : "var(--mantine-color-slate-2)"
          }`,
          background: selected
            ? "var(--mantine-color-brand-light)"
            : "var(--mantine-color-white)",
        }}
      >
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon
            size={34}
            radius="md"
            variant="light"
            color={selected ? "brand" : "slate"}
          >
            <Icon size={18} />
          </ThemeIcon>
          <Box>
            <Text fw={700} fz="sm" c="slate.8">
              {title}
            </Text>
            <Text fz="xs" c="slate.6">
              {text}
            </Text>
          </Box>
        </Group>
      </Paper>
    </UnstyledButton>
  );
}

function MaturityContent({
  maturity,
  editable,
  decision,
  onDecision,
  terms,
  onTerms,
  productOptions,
}: {
  maturity: InvestorMaturity;
  editable: boolean;
  decision: Decision | null;
  onDecision: (d: Decision) => void;
  terms: InvestorRenewalTerms | null;
  onTerms: (patch: Partial<InvestorRenewalTerms>) => void;
  productOptions: { value: string; label: string }[];
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const owedTotal =
    maturity.outstanding_principal + maturity.outstanding_interest;

  return (
    <>
      <KpiGrid
        items={[
          {
            label: "Amount invested",
            value: fmtAmount(maturity.amount_invested),
            color: "info",
          },
          {
            label: "Payouts made",
            value: `${maturity.rows_paid} / ${maturity.rows_total}`,
            color: "brand",
          },
          {
            label: "Principal owed",
            value: fmtAmount(maturity.outstanding_principal),
            color: "warning",
          },
          {
            label: "Interest owed",
            value: fmtAmount(maturity.outstanding_interest),
            color: "success",
          },
        ]}
      />

      {maturity.status === "Matured" && (
        <Alert
          variant="light"
          color="green"
          radius="md"
          icon={<IconCircleCheck size={18} />}
        >
          This investment was redeemed and is closed (Matured).
        </Alert>
      )}
      {maturity.status === "Renewed" && (
        <Alert
          variant="light"
          color="brand"
          radius="md"
          icon={<IconRefresh size={18} />}
        >
          This investment was renewed. Its principal now continues in investment{" "}
          <Text span fw={700}>
            {maturity.renewed_to}
          </Text>
          .
        </Alert>
      )}

      {maturity.status === "Received" && (
        <>
          <SectionBox
            title="Maturity"
            titleAddon={
              <Tag
                label={maturity.is_due ? "Due" : "Upcoming"}
                color={maturity.is_due ? "warning" : "brand"}
              />
            }
          >
            <KeyValueList
              cols={2}
              rows={[
                {
                  label: "Maturity date",
                  value: maturity.mat_date ? fmtDate(maturity.mat_date) : "—",
                },
                {
                  label: "Still owed to investor",
                  value: fmtAmount(owedTotal),
                },
              ]}
            />
            {!maturity.is_due && (
              <Text fz="xs" c="slate.5" mt="sm">
                Redeem and Renew become available on the maturity date.
              </Text>
            )}
          </SectionBox>

          {editable && maturity.is_due && (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
                <DecisionCard
                  selected={decision === "redeem"}
                  disabled={false}
                  icon={IconArrowBackUp}
                  title="Redeem"
                  text={`Pay ${fmtAmount(owedTotal)} (principal + interest) from the Company Bank and close the investment.`}
                  onClick={() => onDecision("redeem")}
                />
                <DecisionCard
                  selected={decision === "renew"}
                  disabled={maturity.renewal_carry_amount <= 0}
                  icon={IconRefresh}
                  title="Renew"
                  text={
                    maturity.renewal_carry_amount > 0
                      ? `Pay ${fmtAmount(maturity.renewal_cash_payout)} interest now and reinvest ${fmtAmount(maturity.renewal_carry_amount)} as a new investment.`
                      : "No principal is left to reinvest."
                  }
                  onClick={() => onDecision("renew")}
                />
              </SimpleGrid>

              {decision === "renew" && terms && (
                <SectionBox title="New investment terms">
                  <Text fz="xs" c="slate.5" mb="sm">
                    Pre-filled from this investment. A new Draft is created for{" "}
                    {fmtAmount(maturity.renewal_carry_amount)}; it then goes
                    through Approve and Contract.
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <Select
                      label="Investment product"
                      size="sm"
                      radius="md"
                      required
                      searchable
                      data={productOptions}
                      value={terms.investment_product}
                      onChange={(v) => v && onTerms({ investment_product: v })}
                    />
                    <NumberInput
                      label="Interest rate (% p.a.)"
                      size="sm"
                      radius="md"
                      required
                      min={0}
                      max={100}
                      decimalScale={2}
                      value={terms.interest_rate}
                      onChange={(v) =>
                        onTerms({ interest_rate: Number(v) || 0 })
                      }
                    />
                    <Select
                      label="Repayment frequency"
                      size="sm"
                      radius="md"
                      required
                      allowDeselect={false}
                      data={[...REPAYMENT_FREQUENCIES]}
                      value={terms.repayment_frequency}
                      onChange={(v) =>
                        v &&
                        onTerms({
                          repayment_frequency: v as RepaymentFrequency,
                        })
                      }
                    />
                    <NumberInput
                      label="Penalty rate (% p.a.)"
                      size="sm"
                      radius="md"
                      min={0}
                      max={100}
                      decimalScale={2}
                      value={terms.penalty_rate}
                      onChange={(v) =>
                        onTerms({ penalty_rate: Number(v) || 0 })
                      }
                    />
                    <TextInput
                      type="date"
                      label="First repayment date"
                      size="sm"
                      radius="md"
                      required
                      value={terms.first_repayment_date}
                      onChange={(e) =>
                        onTerms({ first_repayment_date: e.currentTarget.value })
                      }
                    />
                    <TextInput
                      type="date"
                      label="Maturity date"
                      size="sm"
                      radius="md"
                      required
                      value={terms.maturity_date}
                      onChange={(e) =>
                        onTerms({ maturity_date: e.currentTarget.value })
                      }
                    />
                  </SimpleGrid>
                </SectionBox>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

interface MaturityModalProps {
  opened: boolean;
  onClose: () => void;
  /** Investor Flow ID. */
  investorFlowId: string;
  /** View only (no Redeem / Renew). */
  readOnly?: boolean;
  /** Minimizes the modal to the dock. */
  onMinimize: () => void;
}

/**
 * Stage 3 — Maturity.
 * Side nav: Investor Processing and Earnings & Statements (both view only) and Maturity.
 */
export function MaturityModal({
  opened,
  onClose,
  onMinimize,
  investorFlowId,
  readOnly = false,
}: MaturityModalProps) {
  const maturityQuery = useQuery({
    queryKey: ["investorMaturity", investorFlowId],
    queryFn: () => getInvestorMaturityById(investorFlowId),
    enabled: opened,
  });
  const flowQuery = useQuery({
    queryKey: ["investorFlow", investorFlowId],
    queryFn: () => loadInvestorFlowState(investorFlowId),
    enabled: opened,
  });

  if (maturityQuery.data && flowQuery.data) {
    return (
      <MaturityStage
        key={maturityQuery.dataUpdatedAt}
        opened={opened}
        onClose={onClose}
        onMinimize={onMinimize}
        investorFlowId={investorFlowId}
        readOnly={readOnly}
        maturity={maturityQuery.data}
        flowState={flowQuery.data}
      />
    );
  }

  const error = maturityQuery.error || flowQuery.error;
  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      onMinimize={onMinimize}
      stageIndex={STAGE_INDEX}
      state={createInitialState()}
      title="Maturity"
    >
      <Group justify="center" py="xl">
        {error ? (
          <Text fz="sm" c="red">
            {parseFrappeError(error)}
          </Text>
        ) : (
          <Loader size="sm" color="brand" />
        )}
      </Group>
    </StageShell>
  );
}

function MaturityStage({
  opened,
  onClose,
  onMinimize,
  investorFlowId,
  readOnly,
  maturity,
  flowState,
}: Omit<MaturityModalProps, "readOnly"> & {
  readOnly: boolean;
  maturity: InvestorMaturity;
  flowState: ModalState;
}) {
  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const fmtAmount = (value: number) =>
    formatAmount(companyCurrency, value, { withSymbol: true });
  const queryClient = useQueryClient();
  const [section, setSection] = useState<StageId>("maturity");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [terms, setTerms] = useState<InvestorRenewalTerms | null>(
    maturity.renewal_defaults,
  );
  const viewingEarlier = section !== "maturity";
  const editable =
    !readOnly && maturity.status === "Received" && maturity.is_due;

  const { data: earning } = useQuery({
    queryKey: ["investorEarning", investorFlowId],
    queryFn: () => getInvestorEarningById(investorFlowId),
  });
  const processingSchedule = earning ? scheduleFromEarning(earning) : null;

  const { data: products = [] } = useQuery({
    queryKey: ["investmentProducts", "all"],
    queryFn: getEveryInvestmentProduct,
    enabled: editable,
  });
  const productOptions = products.map((p) => ({
    value: p.name,
    label: p.product_name,
  }));

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["investorMaturity", investorFlowId],
    });
    queryClient.invalidateQueries({ queryKey: ["investorMaturities"] });
    queryClient.invalidateQueries({
      queryKey: ["investorEarning", investorFlowId],
    });
    queryClient.invalidateQueries({ queryKey: ["investorEarnings"] });
    queryClient.invalidateQueries({ queryKey: ["investorFlows"] });
    queryClient.invalidateQueries({
      queryKey: ["investorFlow", investorFlowId],
    });
  };

  const redeemMutation = useMutation({
    mutationFn: () => redeemInvestorFlow(investorFlowId),
    onSuccess: () => {
      refresh();
      onClose();
      openCommonModal({
        heading: "Investment Redeemed",
        subtitle: "",
        body: "Everything owed has been paid out and the investment is closed as Matured.",
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) => showFailure("Redeem Failed", error),
  });

  const renewMutation = useMutation({
    mutationFn: (t: InvestorRenewalTerms) =>
      renewInvestorFlow({ id: investorFlowId, terms: t }),
    onSuccess: (result) => {
      refresh();
      onClose();
      openCommonModal({
        heading: "Investment Renewed",
        subtitle: "",
        body: `New Draft investment ${result.renewed_to} has been created. Approve it and send its contract to continue.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) => showFailure("Renew Failed", error),
  });

  const termsError = (() => {
    if (decision !== "renew" || !terms) return "";
    if (!terms.investment_product) return "Select the investment product.";
    if (!terms.first_repayment_date) return "Enter the first repayment date.";
    if (!terms.maturity_date) return "Enter the maturity date.";
    if (
      new Date(terms.maturity_date).getTime() <=
      new Date(terms.first_repayment_date).getTime()
    )
      return "Maturity date must be after the first repayment date.";
    if (!(terms.interest_rate > 0 && terms.interest_rate <= 100))
      return "Interest rate must be between 0 and 100.";
    return "";
  })();

  const confirm = () => {
    const owed = maturity.outstanding_principal + maturity.outstanding_interest;
    if (decision === "redeem") {
      openCommonModal({
        heading: "Redeem Investment",
        subtitle: "Please confirm this action before continuing.",
        body: `Pay ${fmtAmount(owed)} to ${maturity.investor} from the Company Bank (dated today) and close investment ${maturity.id}?`,
        color: "green",
        buttons: [
          { label: "Cancel", variant: "default" },
          {
            label: "Redeem",
            color: "green",
            onClick: () => redeemMutation.mutate(),
          },
        ],
      });
    } else if (decision === "renew" && terms) {
      openCommonModal({
        heading: "Renew Investment",
        subtitle: "Please confirm this action before continuing.",
        body: `Pay ${fmtAmount(maturity.renewal_cash_payout)} interest to ${maturity.investor} now and reinvest ${fmtAmount(maturity.renewal_carry_amount)} as a new Draft investment?`,
        color: "green",
        buttons: [
          { label: "Cancel", variant: "default" },
          {
            label: "Renew",
            color: "green",
            onClick: () => renewMutation.mutate(terms),
          },
        ],
      });
    }
  };

  let footer;
  if (viewingEarlier) {
    footer = (
      <Button
        size="sm"
        radius="xl"
        variant="light"
        color="brand"
        onClick={() => setSection("maturity")}
      >
        Return to {STAGES[STAGE_INDEX].label}
      </Button>
    );
  } else if (editable) {
    footer = (
      <>
        {termsError && (
          <Text fz="xs" c="red" mr="auto">
            {termsError}
          </Text>
        )}
        <Button
          size="sm"
          radius="xl"
          color="brand"
          disabled={!decision || !!termsError}
          loading={redeemMutation.isPending || renewMutation.isPending}
          onClick={confirm}
        >
          {decision === "renew" ? "Renew" : "Redeem"}
        </Button>
      </>
    );
  }

  return (
    <StageShell
      opened={opened}
      onClose={onClose}
      onMinimize={onMinimize}
      stageIndex={STAGE_INDEX}
      state={flowState}
      title="Maturity"
      sideNav={
        <StageSideNav
          stageIndex={STAGE_INDEX}
          section={section}
          onSelect={setSection}
        />
      }
      footer={footer}
    >
      {section === "processing" && (
        <ProcessingReadOnlyView
          state={flowState}
          schedule={processingSchedule}
          existingCount={0}
        />
      )}

      {section === "earnings" && (
        <>
          <ViewOnlyBar label={STAGES[1].label} />
          <section className="inv-content">
            <EarningsStatementsView investorFlowId={investorFlowId} />
          </section>
        </>
      )}

      {section === "maturity" && (
        <section className="inv-content">
          <Stack gap={0}>
            <MaturityContent
              maturity={maturity}
              editable={editable}
              decision={decision}
              onDecision={setDecision}
              terms={terms}
              onTerms={(patch) =>
                setTerms((prev) => (prev ? { ...prev, ...patch } : prev))
              }
              productOptions={productOptions}
            />
          </Stack>
        </section>
      )}
    </StageShell>
  );
}
