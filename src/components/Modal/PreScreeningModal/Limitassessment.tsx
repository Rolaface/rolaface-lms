import {
  Box,
  Group,
  Text,
  Badge,
  Paper,
  Button,
  Stack,
} from "@mantine/core";
import {
  IconRefresh,
  IconFileDownload,
} from "@tabler/icons-react";

import type {
  EligibilityCalc,
  PrescreeningState,
} from "./PreScreeningShared";
import { zmw } from "./PreScreeningShared";

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function ConstraintBar({
  label,
  sublabel,
  value,
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
      px={binding ? 10 : 0}
      py={binding ? 8 : 0}
      style={
        binding
          ? {
              background: "var(--mantine-color-indigo-0)",
              border: "1px solid var(--mantine-color-indigo-2)",
              borderRadius: "var(--mantine-radius-md)",
            }
          : undefined
      }
    >
      <Group justify="space-between" align="flex-start" mb={4} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Group gap={6}>
            <Text fz={13} fw={700} c="slate.9">
              {label}
            </Text>
            {binding && (
              <Badge size="xs" radius="sm" color="indigo" variant="filled">
                BINDING
              </Badge>
            )}
          </Group>
          <Text fz={11} c="slate.5" truncate>
            {sublabel}
          </Text>
        </Box>
        <Text
          fz={13}
          fw={700}
          c={naLabel ? "slate.4" : "slate.9"}
          style={{ fontFamily: "monospace", flexShrink: 0 }}
        >
          {valueLabel}
        </Text>
      </Group>
      <Box
        style={{
          position: "relative",
          height: 10,
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
              ? "var(--mantine-color-indigo-5)"
              : "var(--mantine-color-indigo-3)",
            opacity: binding ? 1 : 0.8,
            transition: "width 300ms ease",
          }}
        />
        {!naLabel && (
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: `${Math.max(0, Math.min(100, requestedRatio * 100))}%`,
              width: 2,
              height: 10,
              background: "var(--mantine-color-red-5)",
              transform: "translateX(-1px)",
            }}
          />
        )}
      </Box>
    </Box>
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

  const cardStyle = { border: "1px solid var(--mantine-color-slate-2)" };

  return (
    <Box
      px={16}
      py={12}
      bg="slate.0"
      style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" mb={10} wrap="wrap" gap={8}>
        <Group gap={8} align="center">
          <Text fz={15} fw={800} c="slate.9">
            Loan Eligibility &amp; Limit Assessment
          </Text>
          {applicationId && (
            <Badge size="sm" radius="sm" color="slate" variant="light" c="slate.6">
              PL-SAL-36
            </Badge>
          )}
        </Group>
        <Group gap={8}>
          <Button
            variant="default"
            size="compact-xs"
            radius="md"
            leftSection={<IconFileDownload size={13} />}
            onClick={onExportPdf}
          >
            Export Audit PDF
          </Button>
          <Button
            size="compact-xs"
            radius="md"
            color="brand"
            leftSection={<IconRefresh size={13} />}
            onClick={onRecalculate}
          >
            Recalculate with Overrides
          </Button>
        </Group>
      </Group>

      {/* Constraints */}
      <Paper
        withBorder
        radius="lg"
        px={18}
        py={14}
        bg="white"
        style={{ ...cardStyle, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        <Group justify="space-between" mb={8}>
          <Text fz={14} fw={700} c="slate.9">
            Eligibility calculation
          </Text>
          <Badge size="xs" radius="sm" color="indigo" variant="light" style={{ fontFamily: "monospace" }}>
            Rule Model v2.4
          </Badge>
        </Group>

        <Stack gap={10} justify="space-evenly" style={{ flex: 1, minHeight: 0 }}>
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

        <Group gap={12} mt={10} pt={8} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
          <Group gap={5}>
            <Box style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mantine-color-indigo-5)" }} />
            <Text fz={10} c="slate.5">Binding</Text>
          </Group>
          <Group gap={5}>
            <Box style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mantine-color-indigo-3)" }} />
            <Text fz={10} c="slate.5">Other</Text>
          </Group>
          <Group gap={5}>
            <Box style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mantine-color-red-5)" }} />
            <Text fz={10} c="slate.5">Requested ({zmw(requested)})</Text>
          </Group>
        </Group>
      </Paper>
    </Box>
  );
}
