import { Box, Group, Text, Badge, Paper, Button, SimpleGrid, ThemeIcon } from "@mantine/core";
import { IconRefresh, IconCheck, IconX, IconMinus } from "@tabler/icons-react";

import type { Evaluation, PrescreeningRuleResult } from "../../../api/LosConfiguration/LoanApplicationApi";
import { OPERATOR_LABELS } from "../../../view/LosConfiguration/PreScreening/types";
import { NUMERIC } from "./PreScreeningShared";

const VERDICT_STYLE: Record<string, { color: string; status: string }> = {
  Eligible: { color: "green", status: "Pass" },
  "Eligible with Warnings": { color: "yellow", status: "Warning" },
  "Manual Review": { color: "orange", status: "Review" },
  "Not Eligible": { color: "red", status: "Fail" },
};
const SEVERITY_COLOR: Record<string, string> = { Blocking: "red", Review: "orange", Warning: "yellow" };

const show = (value: unknown) =>
  value == null || value === "" ? "—" : Array.isArray(value) ? value.join(", ") : typeof value === "number" ? value.toLocaleString() : String(value);

function condition(rule: PrescreeningRuleResult) {
  const operator = OPERATOR_LABELS[rule.operator] ?? rule.operator.replace(/_/g, " ");
  const value =
    rule.operator === "between"
      ? `${show(rule.value)} – ${show(rule.value2)}`
      : rule.operator === "in" || rule.operator === "not_in"
        ? show(rule.values)
        : show(rule.value);
  return `${operator} ${value}`;
}

function RuleRow({ rule, counted }: { rule: PrescreeningRuleResult; counted: boolean }) {
  const failedColor = counted ? SEVERITY_COLOR[rule.severity] ?? "red" : "slate";
  const action = rule.action || rule.severity;
  return (
    <Group wrap="nowrap" gap={8} px={10} py={5} style={{ borderTop: "1px solid var(--mantine-color-slate-1)" }}>
      <ThemeIcon size={18} radius="xl" variant="light" color={rule.passed ? "green" : failedColor} style={{ flexShrink: 0 }}>
        {rule.passed ? <IconCheck size={11} /> : <IconX size={11} />}
      </ThemeIcon>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text fz={12} c="slate.9" truncate title={`${rule.label} ${condition(rule)}`}>
          <Text span inherit fw={700}>{rule.label}</Text> {condition(rule)}
        </Text>
        <Text fz={10.5} truncate c={rule.passed ? "slate.5" : counted ? `${failedColor}.7` : "slate.5"} fw={rule.passed ? 400 : 600}>
          {rule.passed ? `Met · if not → ${action}` : counted ? `Not met → ${action}` : "Not met · not counted (group passed)"}
        </Text>
      </Box>
      <Box ta="right" style={{ flexShrink: 0, maxWidth: 120 }}>
        <Text fz={12} fw={700} c={rule.missing ? "danger.6" : "slate.9"} truncate style={NUMERIC}>
          {rule.missing ? "Missing" : show(rule.actual)}
        </Text>
        <Badge size="xs" radius="sm" variant="light" color={SEVERITY_COLOR[rule.severity] ?? "slate"}>
          {rule.severity}
        </Badge>
      </Box>
    </Group>
  );
}

export function PrescreeningAssessment({
  evaluation,
  onRecalculate,
}: {
  evaluation?: Evaluation;
  onRecalculate?: () => void;
}) {
  const prescreening = evaluation?.prescreening;
  const groups = prescreening?.groups ?? [];
  const rules = groups.flatMap((group) => group.rules);
  const failed = prescreening?.failed ?? [];
  const verdict = prescreening?.verdict;
  const style = verdict ? VERDICT_STYLE[verdict] : undefined;
  const worst = failed.find((f) => f.severity === "Blocking") ?? failed.find((f) => f.severity === "Review") ?? failed[0];

  const summary = !prescreening
    ? "Waiting for the engine result."
    : prescreening.reason
      ? prescreening.reason
      : failed.length === 0
        ? "Every rule group passed."
        : `${failed.length} rule${failed.length === 1 ? "" : "s"} failed; the worst is ${worst.severity} (${worst.label}), so the result is ${verdict}.`;

  return (
    <Box
      px={18}
      py={14}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "linear-gradient(180deg, var(--mantine-color-brand-0) 0%, var(--mantine-color-slate-0) 280px)",
      }}
    >
      <Group justify="space-between" align="center" mb={10} wrap="wrap" gap={10}>
        <Box>
          <Group gap={9} align="center">
            <Text fz={16} fw={800} c="slate.9" style={{ letterSpacing: "-0.01em" }}>
              Pre-screening assessment
            </Text>
            {evaluation?.loan_product && (
              <Badge size="sm" radius="xl" color="slate" variant="light">
                {evaluation.loan_product}
              </Badge>
            )}
          </Group>
          <Text fz={11.5} c="slate.5" mt={2}>
            Each rule is a requirement the applicant must meet — the worst failure decides the result.
          </Text>
        </Box>
        {onRecalculate && (
          <Button
            size="compact-sm"
            radius="md"
            leftSection={<IconRefresh size={14} />}
            onClick={onRecalculate}
            styles={{
              root: {
                background: "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
                boxShadow: "0 8px 18px -10px color-mix(in srgb, var(--mantine-color-brand-6) 90%, transparent)",
              },
            }}
          >
            Recalculate with overrides
          </Button>
        )}
      </Group>

      <Paper
        withBorder
        radius="md"
        px={12}
        py={8}
        mb={10}
        bg="white"
        style={{ borderLeft: `4px solid var(--mantine-color-${style?.color ?? "slate"}-5)` }}
      >
        <Group justify="space-between" wrap="nowrap" gap={12}>
          <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
            {verdict && (
              <Badge radius="xl" variant="light" color={style?.color ?? "slate"} style={{ flexShrink: 0 }}>
                {style?.status ?? verdict}
              </Badge>
            )}
            <Text fz={12.5} c="slate.7" truncate>
              {summary}
            </Text>
          </Group>
          <Text fz={11.5} c="slate.5" style={{ ...NUMERIC, flexShrink: 0 }}>
            {rules.filter((rule) => rule.passed).length} / {rules.length} rules met
          </Text>
        </Group>
      </Paper>

      <Paper
        className="ps-surface"
        withBorder
        radius="lg"
        bg="white"
        style={{ borderColor: "var(--mantine-color-slate-2)", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Group
          justify="space-between"
          px={14}
          py={9}
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-1)",
            background: "linear-gradient(180deg, var(--mantine-color-slate-0) 0%, var(--mantine-color-white) 100%)",
          }}
        >
          <Text fz={13.5} fw={700} c="slate.9">
            Rules checked
          </Text>
          {prescreening?.ruleset && (
            <Badge size="xs" radius="xl" color="brand" variant="light" style={NUMERIC}>
              {prescreening.ruleset} v{prescreening.version}
            </Badge>
          )}
        </Group>

        <Box p={10} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {groups.length === 0 ? (
            <Text fz={12.5} c="slate.5" ta="center" py={30}>
              {prescreening?.reason ?? "No rules have been evaluated yet."}
            </Text>
          ) : (
            <SimpleGrid cols={groups.length > 1 ? 2 : 1} spacing={8} verticalSpacing={8}>
            {groups.map((group) => (
              <Box key={group.id} style={{ border: "1px solid var(--mantine-color-slate-2)", borderRadius: "var(--mantine-radius-md)", overflow: "hidden", alignSelf: "start" }}>
                <Group justify="space-between" px={12} py={6} bg="slate.0" wrap="nowrap">
                  <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                    <Text fz={12.5} fw={700} c="slate.8" truncate>
                      {group.name}
                    </Text>
                    <Text fz={10.5} c="slate.5" style={{ flexShrink: 0 }}>
                      {group.logic === "ANY" ? "ANY — one must be met" : "ALL — every rule"}
                    </Text>
                  </Group>
                  <Badge
                    size="xs"
                    radius="xl"
                    variant="light"
                    color={group.passed == null ? "slate" : group.passed ? "green" : "red"}
                    leftSection={group.passed == null ? <IconMinus size={10} /> : undefined}
                  >
                    {group.passed == null ? "No rules" : group.passed ? "Group passed" : "Group failed"}
                  </Badge>
                </Group>
                {group.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} counted={group.passed === false} />
                ))}
              </Box>
            ))}
            </SimpleGrid>
          )}
        </Box>

        <Text
          fz={10.5}
          c="slate.5"
          px={14}
          py={7}
          style={{ borderTop: "1px solid var(--mantine-color-slate-1)", background: "var(--mantine-color-slate-0)" }}
        >
          A failed rule only counts when its group fails. Missing data fails the rule. Blocking → Fail · Review → Review · Warning → Warning · none → Pass.
        </Text>
      </Paper>
    </Box>
  );
}
