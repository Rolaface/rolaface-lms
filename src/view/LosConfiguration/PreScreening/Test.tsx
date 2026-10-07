import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { test } from "../../../api/LosConfiguration/PreScreeningApi";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { Badge, Button, Paper, Box, Group, Stack, Text, Title, Select, SegmentedControl, Grid, Input, ThemeIcon, Alert } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertTriangle, IconCheck, IconClipboardCheck, IconFlask, IconPlayerPlay, IconX } from "@tabler/icons-react";
import {
  fieldById,
  fmtVal,
  ruleSentence,
  type RuleValue,
  type RuleSet,
} from "./types";

export interface TestTabProps {
  ruleSet: RuleSet;
  dirty: boolean;
}

const findResult = (res: any) => {
  let x = res;
  for (let i = 0; i < 5; i++) {
    if (x && typeof x === "object" && x.verdict !== undefined) return x;
    x = x?.data ?? x?.message;
  }
  return null;
};

const VERDICT_STYLES: Record<string, { tone: string; label: string; icon: ReactNode; note: string }> = {
  Eligible: { tone: "green", label: "Eligible", icon: <IconCheck size={15} />, note: "All blocking criteria passed." },
  "Eligible with Warnings": { tone: "orange", label: "Eligible with Warnings", icon: <IconAlertTriangle size={15} />, note: "All blocking criteria passed; some non-blocking checks flagged." },
  "Manual Review": { tone: "blue", label: "Sent for Manual Review", icon: <IconClipboardCheck size={15} />, note: "Basic criteria met, but file needs manual review." },
  "Not Eligible": { tone: "red", label: "Not Eligible", icon: <IconX size={15} />, note: "One or more blocking criteria failed." },
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text fz={10} fw={700} c="slate.6" tt="uppercase" mb={5} style={{ letterSpacing: ".03em" }}>
      {children}
    </Text>
  );
}

function CardHeader({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <Group gap={8} align="center" mb={8} wrap="nowrap">
      <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
        {icon}
      </Box>
      <Title order={4} fz={13} c="slate.8">{title}</Title>
      {hint && <Text fz={11.5} c="slate.5">{hint}</Text>}
    </Group>
  );
}

export default function TestTab({ ruleSet, dirty }: TestTabProps) {
  const usedFieldIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    ruleSet.groups.forEach((g) =>
      g.rules.forEach((r) => {
        if (r.fieldId && !seen.has(r.fieldId)) {
          seen.add(r.fieldId);
          ids.push(r.fieldId);
        }
      })
    );
    return ids;
  }, [ruleSet]);

  const localRuleById = useMemo(() => {
    const m: Record<string, any> = {};
    ruleSet.groups.forEach((g) => g.rules.forEach((r) => { m[r.id] = r; }));
    return m;
  }, [ruleSet]);

  const [sample, setSample] = useState<Record<string, RuleValue | undefined>>({});

  const [results, setResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      const facts = Object.fromEntries(
        Object.entries(sample).filter(([, v]) => v !== undefined && v !== null && v !== "")
      );
      const response = await test(ruleSet.id, { facts });
      setResults(findResult(response));
    } catch (err: any) {
      let body = "";
      try {
        const m = parseFrappeError(err);
        body = typeof m === "string" ? m : JSON.stringify(m);
      } catch {
        body = String(err);
      }
      openCommonModal({
        heading: "Test Failed",
        subtitle: "We couldn't complete your request.",
        body,
        color: "red",
        buttons: [{ label: "OK", color: "red" }],
      });
    } finally {
      setTesting(false);
    }
  };

  const verdictStyle = VERDICT_STYLES[results?.verdict] ?? VERDICT_STYLES["Eligible"];

  const allNull =
    !!results &&
    Array.isArray(results.groups) &&
    results.groups.length > 0 &&
    results.groups.every((g: any) => (g.rules ?? []).every((r: any) => r.passed === null));

  const setField = (fid: string, val: RuleValue) => {
    setSample((s) => ({ ...s, [fid]: val }));
  };

  return (
    <Grid gap="lg">
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper withBorder radius="md" p={12} style={{ alignSelf: "start", background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderTop: "2px solid var(--mantine-color-brand-6)" }}>
          <CardHeader icon={<IconFlask size={13} stroke={2} />} title="Sample Applicant" hint={usedFieldIds.length ? `${usedFieldIds.length} criteria` : undefined} />
          <Text fz={11.5} c="slate.5" mb={10}>Enter values for the criteria used by this rule set to test it.</Text>

          {usedFieldIds.length === 0 ? (
            <Paper radius="md" p={14} style={{ border: "1px dashed var(--mantine-color-slate-3)", textAlign: "center", background: "var(--mantine-color-slate-0)" }}>
              <Text fz={11.5} c="dimmed">Add rules in the Builder tab to test applicant scenarios here.</Text>
            </Paper>
          ) : (
            <>
              <Grid gap={10}>
                {usedFieldIds.map((fid) => {
                  const f = fieldById(fid);
                  if (!f) return null;
                  const value = sample[fid];
                  return (
                    <Grid.Col span={6} key={fid}>
                      <FieldLabel>{f.label}</FieldLabel>
                      {f.type === "boolean" ? (
                        <SegmentedControl
                          fullWidth
                          size="xs"
                          color="brand"
                          value={value === true ? "yes" : value === false ? "no" : ""}
                          onChange={(val) => setField(fid, val === "yes")}
                          data={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
                          styles={{ label: { fontSize: 11.5, fontWeight: 600 } }}
                        />
                      ) : f.type === "dropdown" ? (
                        <Select
                          size="xs"
                          placeholder="Select a value…"
                          value={(value as string) ?? null}
                          onChange={(val) => setField(fid, val)}
                          data={f.options ?? []}
                        />
                      ) : f.type === "date" ? (
                        <DateInput
                          size="xs"
                          valueFormat="DD-MMM-YYYY"
                          placeholder="DD-MMM-YYYY"
                          value={(value as string) || null}
                          onChange={(val) => setField(fid, val)}
                        />
                      ) : f.type === "text" ? (
                        <Input
                          size="xs"
                          component="input"
                          placeholder="Value"
                          value={(value as string) ?? ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setField(fid, e.target.value)}
                        />
                      ) : (
                        <Group gap={6} wrap="nowrap" align="center">
                          <Input
                            size="xs"
                            component="input"
                            type="number"
                            placeholder="Value"
                            value={value === undefined || value === null ? "" : String(value)}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setField(fid, e.target.value === "" ? null : Number(e.target.value))}
                            style={{ flex: 1 }}
                          />
                          {f.unit && <Text fz={11} c="slate.5" style={{ whiteSpace: "nowrap" }}>{f.unit}</Text>}
                        </Group>
                      )}
                    </Grid.Col>
                  );
                })}
              </Grid>

              <Button size="xs" radius="md" fullWidth mt={12} color="brand" leftSection={<IconPlayerPlay size={12} stroke={2.4} />} onClick={runTest} loading={testing}>
                Run Simulation
              </Button>
              {dirty ? (
                <Alert color="orange" mt={8} p={8} fz={11.5}>
                  You have unsaved changes. The test runs on the saved version, so save the draft first to test them.
                </Alert>
              ) : (
                <Text fz={10.5} c="slate.5" mt={6}>
                  The test runs on the saved version of this rule set.
                </Text>
              )}
            </>
          )}
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        {results && (
          <Paper withBorder radius="md" p={12} mb={8} style={{ background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderLeft: `3px solid var(--mantine-color-${verdictStyle.tone}-4)` }}>
            <Group justify="space-between" align="center" wrap="nowrap" gap={10}>
              <Group gap={8} align="center" wrap="nowrap">
                <ThemeIcon variant="light" color={verdictStyle.tone} radius="xl" size={28}>
                  {verdictStyle.icon}
                </ThemeIcon>
                <Box>
                  <Text fz={10} fw={700} c="slate.5" tt="uppercase" style={{ letterSpacing: ".04em" }}>Pre-Screening Result</Text>
                  <Text fz={13} fw={700} c={`${verdictStyle.tone}.7`}>{verdictStyle.label}</Text>
                </Box>
              </Group>
              <Text fz={11} c="slate.5" ta="right" maw={220}>{verdictStyle.note}</Text>
            </Group>
          </Paper>
        )}

        {allNull && (
          <Alert color="yellow" mb={8} fz={12}>
            No rule could be evaluated. Make sure the rules have values, the draft is saved, and the applicant values above are filled in.
          </Alert>
        )}

        {(results?.groups ?? []).map((g: any, index: number) => {
          const groupPass = g.passed;
          const tone = groupPass === null || groupPass === undefined ? "slate" : groupPass ? "green" : "red";
          return (
            <Paper withBorder radius="md" p={0} mb={8} key={g.id ?? index} style={{ overflow: "hidden", background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderLeft: `3px solid var(--mantine-color-${tone}-4)` }}>
              <Group justify="space-between" px={12} py={8} wrap="nowrap" style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                <Group gap={8} wrap="nowrap">
                  <Box style={{ width: 18, height: 18, minWidth: 18, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-slate-1)", color: "var(--mantine-color-slate-6)", fontSize: 10.5, fontWeight: 700 }}>{index + 1}</Box>
                  <Text fw={600} fz={12.5} c="slate.8">{g.name}</Text>
                  <Text fz={10.5} c="slate.5">Match {g.logic}</Text>
                </Group>
                {groupPass === null || groupPass === undefined ? (
                  <Text fz={11} c="dimmed">Not evaluated</Text>
                ) : (
                  <Badge size="xs" radius="xl" variant="light" color={groupPass ? "green" : "red"} fw={700}>
                    {groupPass ? "Passed" : "Failed"}
                  </Badge>
                )}
              </Group>
              <Stack gap={0} p={6}>
                {(g.rules ?? []).map((r: any) => {
                  const f = fieldById(r.field);
                  const label = r.label ?? f?.label ?? r.field;
                  const local = localRuleById[r.id];
                  const required = local ? ruleSentence(local).replace(label + " ", "") : r.operator;
                  const actualRaw = r.actual ?? sample[r.field];
                  const applicant = f ? fmtVal(f, actualRaw as RuleValue) : actualRaw ?? "…";
                  return (
                    <Group key={r.id} justify="space-between" align="center" py={5} px={8} wrap="nowrap" gap={8} style={{ borderRadius: 6 }}>
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text fz={11.5} fw={600} c="slate.8" truncate>{label}</Text>
                        <Text fz={10.5} c="slate.5" truncate>
                          Required: {required} · Applicant: {String(applicant)}
                        </Text>
                      </Stack>
                      {r.passed === null || r.passed === undefined ? (
                        <Text c="dimmed" fz={11} style={{ flexShrink: 0 }}>—</Text>
                      ) : r.passed ? (
                        <IconCheck size={14} color="var(--mantine-color-green-6)" style={{ flexShrink: 0 }} />
                      ) : (
                        <IconX size={14} color="var(--mantine-color-red-6)" style={{ flexShrink: 0 }} />
                      )}
                    </Group>
                  );
                })}
              </Stack>
            </Paper>
          );
        })}
      </Grid.Col>
    </Grid>
  );
}