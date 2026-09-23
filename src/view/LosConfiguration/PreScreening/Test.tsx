import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Badge, Button, Paper, Box, Group, Stack, Text, Title, Select, SegmentedControl, Grid, Input, ThemeIcon } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertTriangle, IconCheck, IconClipboardCheck, IconFlask, IconPlayerPlay, IconX } from "@tabler/icons-react";
import {
  SAMPLE_APPLICANTS,
  evalRule,
  fieldById,
  fmtVal,
  ruleSentence,
  type RuleValue,
  type RuleSet,
} from "./types";

export interface TestTabProps {
  ruleSet: RuleSet;
}

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

export default function TestTab({ ruleSet }: TestTabProps) {
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

  const presets = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(SAMPLE_APPLICANTS).map(([name, values]) => [
          name,
          Object.fromEntries(usedFieldIds.map((fid) => [fid, values[fid]])),
        ])
      ),
    [usedFieldIds]
  );

  const [sample, setSample] = useState<Record<string, RuleValue | undefined>>({});
  const [preset, setPreset] = useState<string>("Custom");

  const results = useMemo(() => {
    const groupResults = ruleSet.groups.map((g) => {
      const ruleResults = g.rules.filter((r) => !r.disabled).map((r) => ({ rule: r, pass: evalRule(r, sample[r.fieldId as string]) }));
      const evaluated = ruleResults.filter((rr) => rr.pass !== null);
      const groupPass = g.logic === "ALL" ? evaluated.every((rr) => rr.pass) : evaluated.some((rr) => rr.pass);
      const failing = ruleResults.filter((rr) => rr.pass === false);
      return { group: g, groupPass: evaluated.length ? groupPass : null, failing };
    });
    const allFailing = groupResults.filter((gr) => gr.groupPass === false).flatMap((gr) => gr.failing);
    const blocking = allFailing.filter((f) => f.rule.severity === "Blocking");
    const review = allFailing.filter((f) => f.rule.severity === "Review");
    const warning = allFailing.filter((f) => f.rule.severity === "Warning");
    let verdict: "Eligible" | "Eligible with Warnings" | "Manual Review" | "Not Eligible" = "Eligible";
    if (blocking.length) verdict = "Not Eligible";
    else if (review.length) verdict = "Manual Review";
    else if (warning.length) verdict = "Eligible with Warnings";
    return { groupResults, blocking, review, warning, verdict };
  }, [sample, ruleSet]);

  const verdictStyle = {
    Eligible: { tone: "green", label: "Eligible", icon: <IconCheck size={15} />, note: "All blocking criteria passed." },
    "Eligible with Warnings": { tone: "orange", label: "Eligible with Warnings", icon: <IconAlertTriangle size={15} />, note: "All blocking criteria passed; some non-blocking checks flagged." },
    "Manual Review": { tone: "blue", label: "Sent for Manual Review", icon: <IconClipboardCheck size={15} />, note: "Basic criteria met, but file needs manual review." },
    "Not Eligible": { tone: "red", label: "Not Eligible", icon: <IconX size={15} />, note: "One or more blocking criteria failed." },
  }[results.verdict];

  const setField = (fid: string, val: RuleValue) => {
    setSample((s) => ({ ...s, [fid]: val }));
    setPreset("Custom");
  };

  return (
    <Grid gutter="lg">
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
              <Box mb={10}>
                <FieldLabel>Preset</FieldLabel>
                <Select
                  size="xs"
                  value={preset}
                  onChange={(val) => {
                    if (!val) return;
                    setPreset(val);
                    if (val !== "Custom") setSample({ ...presets[val] });
                  }}
                  data={[...Object.keys(SAMPLE_APPLICANTS), "Custom"]}
                />
              </Box>

              <Grid gutter={10}>
                {usedFieldIds.map((fid) => {
                  const f = fieldById(fid)!;
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
                          data={f.options!}
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

              <Button size="xs" radius="md" fullWidth mt={12} color="brand" leftSection={<IconPlayerPlay size={12} stroke={2.4} />}>
                Run Simulation
              </Button>
            </>
          )}
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
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

        {results.groupResults.map(({ group, groupPass }, index) => {
          const tone = groupPass === null ? "slate" : groupPass ? "green" : "red";
          return (
            <Paper withBorder radius="md" p={0} mb={8} key={group.id} style={{ overflow: "hidden", background: "var(--mantine-color-white)", borderColor: "var(--mantine-color-slate-2)", borderLeft: `3px solid var(--mantine-color-${tone}-4)` }}>
              <Group justify="space-between" px={12} py={8} wrap="nowrap" style={{ borderBottom: "1px solid var(--mantine-color-slate-1)" }}>
                <Group gap={8} wrap="nowrap">
                  <Box style={{ width: 18, height: 18, minWidth: 18, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-slate-1)", color: "var(--mantine-color-slate-6)", fontSize: 10.5, fontWeight: 700 }}>{index + 1}</Box>
                  <Text fw={600} fz={12.5} c="slate.8">{group.name}</Text>
                  <Text fz={10.5} c="slate.5">Match {group.logic}</Text>
                </Group>
                {groupPass === null ? (
                  <Text fz={11} c="dimmed">Not evaluated</Text>
                ) : (
                  <Badge size="xs" radius="xl" variant="light" color={groupPass ? "green" : "red"} fw={700}>
                    {groupPass ? "Passed" : "Failed"}
                  </Badge>
                )}
              </Group>
              <Stack gap={0} p={6}>
                {group.rules.filter((r) => !r.disabled).map((r) => {
                  const f = fieldById(r.fieldId)!;
                  const pass = evalRule(r, sample[r.fieldId as string]);
                  return (
                    <Group key={r.id} justify="space-between" align="center" py={5} px={8} wrap="nowrap" gap={8} style={{ borderRadius: 6 }}>
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text fz={11.5} fw={600} c="slate.8" truncate>{f.label}</Text>
                        <Text fz={10.5} c="slate.5" truncate>
                          Required: {ruleSentence(r).replace(f.label + " ", "")} · Applicant: {fmtVal(f, sample[r.fieldId as string])}
                        </Text>
                      </Stack>
                      {pass === null ? (
                        <Text c="dimmed" fz={11} style={{ flexShrink: 0 }}>—</Text>
                      ) : pass ? (
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
