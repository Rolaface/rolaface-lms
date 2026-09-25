import {
  Box,
  Group,
  Text,
  Badge,
  Paper,
  Button,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import {
  IconRefresh,
  IconFileDownload,
  IconTargetArrow,
  IconCircleCheck,
  IconAlertTriangle,
  IconRulerMeasure,
} from "@tabler/icons-react";

import type {
  EligibilityCalc,
  PrescreeningState,
} from "./PreScreeningShared";
import { zmw, IconTile, MicroLabel, NUMERIC } from "./PreScreeningShared";

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function ConstraintBar({
  label,
  sublabel,
  valueLabel,
  ratio,
  requestedRatio,
  binding,
  naLabel,
}: {
  label: string;
  sublabel: string;
  value?: number | null;
  valueLabel: string;
  ratio: number;
  requestedRatio: number;
  binding?: boolean;
  naLabel?: boolean;
}) {
  return (
    <Box
      px={binding ? 11 : 2}
      py={binding ? 9 : 2}
      style={{
        position: "relative",
        borderRadius: "var(--mantine-radius-md)",
        background: binding
          ? "linear-gradient(135deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-white) 70%)"
          : undefined,
        border: binding
          ? "1px solid var(--mantine-color-brand-2)"
          : "1px solid transparent",
      }}
    >
      {binding && (
        <Box
          style={{
            position: "absolute",
            left: 0,
            top: 10,
            bottom: 10,
            width: 3,
            borderRadius: 99,
            background: "var(--mantine-color-brand-6)",
          }}
        />
      )}
      <Group justify="space-between" align="flex-start" mb={6} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Group gap={7} wrap="nowrap">
            <Text fz={12.5} fw={700} c={naLabel ? "slate.5" : "slate.9"}>
              {label}
            </Text>
            {binding && (
              <Badge size="xs" radius="xl" color="brand" variant="filled">
                Binding
              </Badge>
            )}
            {naLabel && (
              <Badge size="xs" radius="xl" color="slate" variant="light">
                n/a
              </Badge>
            )}
          </Group>
          <Text fz={10.5} c="slate.5" truncate>
            {sublabel}
          </Text>
        </Box>
        <Text
          fz={13}
          fw={800}
          c={naLabel ? "slate.3" : binding ? "brand.7" : "slate.9"}
          style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
        >
          {valueLabel}
        </Text>
      </Group>

      <Box style={{ position: "relative" }}>
        <Box
          style={{
            height: 9,
            borderRadius: 99,
            background: "var(--mantine-color-slate-1)",
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, ratio * 100))}%`,
              borderRadius: 99,
              background: binding
                ? "linear-gradient(90deg, var(--mantine-color-brand-4), var(--mantine-color-brand-6))"
                : "linear-gradient(90deg, var(--mantine-color-brand-2), var(--mantine-color-brand-3))",
              transition: "width 450ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </Box>
        {!naLabel && (
          <Box
            style={{
              position: "absolute",
              top: -3,
              left: `${Math.max(0, Math.min(100, requestedRatio * 100))}%`,
              width: 2,
              height: 15,
              borderRadius: 99,
              background: "var(--mantine-color-danger-5)",
              transform: "translateX(-1px)",
            }}
          />
        )}
      </Box>
    </Box>
  );
}

/** Headline figure used in the summary strip above the constraint list. */
function SummaryStat({
  icon: Icon,
  label,
  value,
  tone = "brand",
  hint,
}: {
  icon: React.FC<any>;
  label: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <Paper
      className="ps-surface"
      withBorder
      radius="lg"
      p={12}
      bg="white"
      style={{ borderColor: "var(--mantine-color-slate-2)", minWidth: 0 }}
    >
      <Group gap={9} wrap="nowrap" mb={6}>
        <IconTile icon={Icon} color={tone} size={26} iconSize={14} />
        <MicroLabel c="slate.4">{label}</MicroLabel>
      </Group>
      <Text fz={20} fw={800} c="slate.9" lh={1.15} style={NUMERIC} truncate>
        {value}
      </Text>
      {hint && (
        <Text fz={10.5} c="slate.5" mt={2} truncate>
          {hint}
        </Text>
      )}
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function LimitAssessment({
  state,
  calc,
  requested,
  income,
  obligations,
  maxDTI,
  productMax,
  tenure,
  applicationId = "APP-58231",
  onExportPdf,
  onRecalculate,
}: {
  state: PrescreeningState;
  calc: EligibilityCalc | null;
  requested: number;
  income: number | null;
  obligations: number | null;
  maxDTI: number;
  minCreditScore: number;
  productMax: number;
  rate: number;
  tenure: number;
  applicationId?: string;
  customerName?: string;
  onRefreshAll?: () => void;
  onExportPdf?: () => void;
  onRecalculate?: () => void;
}) {
  const creditScore = state.credit.value;
  const eligibleAmount = calc?.eligibleAmount ?? 0;
  const affordabilityAmount = calc?.affordabilityAmount ?? eligibleAmount;

  // Derived limits for the constraint model — computed defensively from the
  // same inputs already available on the page, so this stays in sync with
  // the eligibility calc without needing new shared logic.
  const incomeLimit = income != null ? income * 6 : null;
  const affordabilityLimit = affordabilityAmount;
  const creditLimit = income != null && creditScore != null ? income * 5 : null;
  const exposureLimit = eligibleAmount;

  const limits = [
    {
      key: "income",
      label: "Income limit",
      sublabel: income != null ? `${zmw(income)} × 6 (income multiple)` : "Awaiting income data",
      value: incomeLimit,
    },
    {
      key: "affordability",
      label: "Affordability limit",
      sublabel: `(${zmw(income)} × ${maxDTI}% − ${zmw(obligations)}) × ${tenure || "—"}mo`,
      value: affordabilityLimit,
    },
    {
      key: "credit",
      label: "Credit score limit",
      sublabel: creditScore != null ? `${zmw(income)} × 5 (score ${creditScore})` : "Awaiting bureau data",
      value: creditLimit,
    },
    {
      key: "exposure",
      label: "Existing exposure limit",
      sublabel: "Affordability × (1 – 5% utilisation)",
      value: exposureLimit,
      binding: true,
    },
    {
      key: "collateral",
      label: "Collateral limit",
      sublabel: "Unsecured product — not applicable",
      value: null,
    },
    {
      key: "product",
      label: "Product limit",
      sublabel: "Product maximum",
      value: productMax,
    },
  ];

  const maxLimitValue = Math.max(
    ...limits.map((l) => l.value ?? 0),
    requested,
    1,
  );

  const bindingLimit = limits.find((l) => l.binding);
  const headroom = eligibleAmount - requested;
  const withinLimit = requested <= eligibleAmount;

  return (
    <Box
      px={18}
      py={16}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background:
          "linear-gradient(180deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-slate-0) 280px)",
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" mb={14} wrap="wrap" gap={10}>
        <Box>
          <Group gap={9} align="center">
            <Text fz={16} fw={800} c="slate.9" style={{ letterSpacing: "-0.01em" }}>
              Loan eligibility &amp; limit assessment
            </Text>
            {applicationId && (
              <Badge size="sm" radius="xl" color="slate" variant="light">
                PL-SAL-36
              </Badge>
            )}
          </Group>
          <Text fz={11.5} c="slate.5" mt={2}>
            Every policy ceiling applied to this application — the lowest one binds.
          </Text>
        </Box>
        <Group gap={8}>
          <Button
            variant="default"
            size="compact-sm"
            radius="md"
            leftSection={<IconFileDownload size={14} />}
            onClick={onExportPdf}
          >
            Export audit PDF
          </Button>
          <Button
            size="compact-sm"
            radius="md"
            leftSection={<IconRefresh size={14} />}
            onClick={onRecalculate}
            styles={{
              root: {
                background:
                  "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
                boxShadow:
                  "0 8px 18px -10px color-mix(in srgb, var(--mantine-color-brand-6) 90%, transparent)",
              },
            }}
          >
            Recalculate with overrides
          </Button>
        </Group>
      </Group>

      {/* Summary strip */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={12} mb={14}>
        <SummaryStat
          icon={IconTargetArrow}
          label="Requested"
          value={zmw(requested)}
          tone="brand"
          hint={`Over ${tenure || "—"} months`}
        />
        <SummaryStat
          icon={IconRulerMeasure}
          label="Maximum eligible"
          value={zmw(eligibleAmount)}
          tone="brand"
          hint={bindingLimit ? `Bound by ${bindingLimit.label.toLowerCase()}` : undefined}
        />
        <SummaryStat
          icon={withinLimit ? IconCircleCheck : IconAlertTriangle}
          label={withinLimit ? "Headroom" : "Shortfall"}
          value={zmw(Math.abs(headroom))}
          tone={withinLimit ? "success" : "warning"}
          hint={withinLimit ? "Within the eligible limit" : "Requested exceeds the limit"}
        />
      </SimpleGrid>

      {/* Constraints */}
      <Paper
        className="ps-surface"
        withBorder
        radius="lg"
        bg="white"
        style={{
          borderColor: "var(--mantine-color-slate-2)",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Group
          justify="space-between"
          px={16}
          py={11}
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-1)",
            background:
              "linear-gradient(180deg, var(--mantine-color-slate-0) 0%, var(--mantine-color-white) 100%)",
          }}
        >
          <Text fz={13.5} fw={700} c="slate.9">
            Eligibility calculation
          </Text>
          <Badge size="xs" radius="xl" color="brand" variant="light" style={NUMERIC}>
            Rule model v2.4
          </Badge>
        </Group>

        <Stack
          gap={12}
          px={16}
          py={14}
          justify="space-evenly"
          style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
        >
          {limits.map((l) => (
            <ConstraintBar
              key={l.key}
              label={l.label}
              sublabel={l.sublabel}
              value={l.value}
              valueLabel={l.value == null ? "n/a" : zmw(l.value)}
              naLabel={l.value == null}
              ratio={l.value == null ? 0 : l.value / maxLimitValue}
              requestedRatio={requested / maxLimitValue}
              binding={l.binding}
            />
          ))}
        </Stack>

        <Group
          gap={14}
          px={16}
          py={10}
          style={{
            borderTop: "1px solid var(--mantine-color-slate-1)",
            background: "var(--mantine-color-slate-0)",
          }}
        >
          <Group gap={6}>
            <Box style={{ width: 10, height: 6, borderRadius: 99, background: "var(--mantine-color-brand-6)" }} />
            <Text fz={10.5} c="slate.5">Binding limit</Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 6, borderRadius: 99, background: "var(--mantine-color-brand-3)" }} />
            <Text fz={10.5} c="slate.5">Other limits</Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 2, height: 11, borderRadius: 99, background: "var(--mantine-color-danger-5)" }} />
            <Text fz={10.5} c="slate.5" style={NUMERIC}>Requested ({zmw(requested)})</Text>
          </Group>
        </Group>
      </Paper>
    </Box>
  );
}
