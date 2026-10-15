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
} from "@tabler/icons-react";

import type { EligibilityLimit } from "../../../api/LosConfiguration/LoanApplicationApi";
import { zmw, NUMERIC } from "./PreScreeningShared";

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function ConstraintBar({
  label,
  sublabel,
  valueLabel,
  ratio,
  requestedRatio,
  naLabel,
}: {
  label: string;
  sublabel: string;
  value?: number | null;
  valueLabel: string;
  ratio: number;
  requestedRatio: number;
  naLabel?: boolean;
}) {
  return (
    <Box px={2} py={2}>
      <Group justify="space-between" align="flex-start" mb={6} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Group gap={7} wrap="nowrap">
            <Text fz={12.5} fw={700} c={naLabel ? "slate.5" : "slate.9"}>
              {label}
            </Text>
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
          c={naLabel ? "slate.3" : "slate.9"}
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
              background:
                "linear-gradient(90deg, var(--mantine-color-brand-4), var(--mantine-color-brand-6))",
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

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function LimitAssessment({
  requested,
  limits: engineLimits,
  productCode,
  ruleLabel,
  onRecalculate,
}: {
  requested: number;
  limits?: EligibilityLimit[];
  productCode: string | null;
  ruleLabel: string | null;
  onRecalculate?: () => void;
}) {
  const find = (key: EligibilityLimit["key"]) => engineLimits?.find((limit) => limit.key === key);
  const income = find("income");
  const affordability = find("affordability");
  const credit = find("credit");
  const collateral = find("collateral");
  const product = find("product");

  const limits = [
    {
      key: "income",
      label: "Income limit",
      sublabel: income ? `${zmw(income.recognised_income)} × ${income.multiple} (income multiple)` : "Awaiting income data",
      value: income?.value ?? null,
    },
    {
      key: "affordability",
      label: "Affordability limit",
      sublabel: affordability
        ? `(${zmw(affordability.recognised_income)} × ${affordability.max_emi_ratio}% − ${zmw(affordability.obligations)}) × ${affordability.tenure_months}mo × ${affordability.buffer}%`
        : "Awaiting income data",
      value: affordability?.value ?? null,
    },
    {
      key: "credit",
      label: "Credit score limit",
      sublabel: credit
        ? `${zmw(credit.basis_income)} × ${credit.multiple} (${credit.basis}${credit.grade ? `, grade ${credit.grade}` : ""})`
        : "Awaiting bureau data",
      value: credit?.value ?? null,
    },
    {
      key: "collateral",
      label: "Collateral limit",
      sublabel: collateral
        ? `${collateral.assets.length} asset${collateral.assets.length === 1 ? "" : "s"} after haircut and LTV`
        : "Unsecured product — not applicable",
      value: collateral?.value ?? null,
    },
    {
      key: "product",
      label: "Product limit",
      sublabel: "Product maximum",
      value: product?.value ?? null,
    },
  ];

  const maxLimitValue = Math.max(
    ...limits.map((l) => l.value ?? 0),
    requested,
    1,
  );

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
            {productCode && (
              <Badge size="sm" radius="xl" color="slate" variant="light">
                {productCode}
              </Badge>
            )}
          </Group>
          <Text fz={11.5} c="slate.5" mt={2}>
            Every policy ceiling applied to this application — the lowest one binds.
          </Text>
        </Box>
        <Group gap={8}>
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
          {ruleLabel && (
            <Badge size="xs" radius="xl" color="brand" variant="light" style={NUMERIC}>
              {ruleLabel}
            </Badge>
          )}
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
            <Box style={{ width: 10, height: 6, borderRadius: 99, background: "var(--mantine-color-brand-5)" }} />
            <Text fz={10.5} c="slate.5">Policy limit</Text>
          </Group>
          <Group gap={6}>
            <Box style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--mantine-color-white)", border: "2px solid var(--mantine-color-danger-5)" }} />
            <Text fz={10.5} c="slate.5" style={NUMERIC}>Requested ({zmw(requested)})</Text>
          </Group>
        </Group>
      </Paper>
    </Box>
  );
}

