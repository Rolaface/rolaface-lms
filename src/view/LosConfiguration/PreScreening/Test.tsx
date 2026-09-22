import { useMemo, useState } from "react";
import { Badge, Button, Paper, Box, Group, Stack, Text, Select, SegmentedControl, Grid, Divider, NumberInput, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconClipboardCheck, IconPlayerPlay, IconX } from "@tabler/icons-react";
import {
  SAMPLE_APPLICANTS,
  TEST_FIELDS,
  evalRule,
  fieldById,
  fmtVal,
  ruleSentence,
  type RuleSet,
} from "./types";

export interface TestTabProps {
  ruleSet: RuleSet;
}

export default function TestTab({ ruleSet }: TestTabProps) {
  const [sample, setSample] = useState<Record<string, string | number | boolean | null | undefined>>({ ...SAMPLE_APPLICANTS["Eligible applicant"] });
  const [preset, setPreset] = useState("Eligible applicant");

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
    Eligible: { bg: "var(--mantine-color-green-0)", fg: "var(--mantine-color-green-7)", label: "Eligible", icon: <IconCheck size={18} /> },
    "Eligible with Warnings": { bg: "var(--mantine-color-orange-0)", fg: "var(--mantine-color-orange-7)", label: "Eligible with Warnings", icon: <IconAlertTriangle size={18} /> },
    "Manual Review": { bg: "var(--mantine-color-blue-0)", fg: "var(--mantine-color-blue-7)", label: "Sent for Manual Review", icon: <IconClipboardCheck size={18} /> },
    "Not Eligible": { bg: "var(--mantine-color-red-0)", fg: "var(--mantine-color-red-7)", label: "Not Eligible", icon: <IconX size={18} /> },
  }[results.verdict];

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper withBorder radius="lg" shadow="xs" p={0} style={{ alignSelf: "start", overflow: "hidden", borderColor: "var(--mantine-color-slate-2)" }}>
          <Box p="md" style={{ background: "var(--mantine-color-brand-0)", borderBottom: "1px solid var(--mantine-color-brand-1)" }}>
            <Text fz={11} fw={800} c="brand.7" tt="uppercase" style={{ letterSpacing: ".06em" }}>Sample Applicant</Text>
            <Text fz={12.5} c="slate.6" mt={3}>Enter applicant values to test the configured rules.</Text>
          </Box>
          <Stack gap="md" p="lg">
          <Select
            label="Preset"
            value={preset}
            onChange={(val) => {
              if (!val) return;
              setPreset(val);
              if (val !== "Custom") setSample({ ...SAMPLE_APPLICANTS[val] });
            }}
            data={[...Object.keys(SAMPLE_APPLICANTS), "Custom"]}
            mb="md"
          />
          <Grid gutter="sm">
            {TEST_FIELDS.map((fid) => {
              const f = fieldById(fid)!;
              return (
                <Grid.Col span={6} key={fid}>
                  {f.type === "boolean" ? (
                    <>
                      <Text fz="sm" fw={600} mb={6}>{f.label}</Text>
                      <SegmentedControl
                        fullWidth
                        color="brand"
                        value={sample[fid] === true ? "yes" : sample[fid] === false ? "no" : ""}
                        onChange={(val) => { setSample({ ...sample, [fid]: val === "yes" }); setPreset("Custom"); }}
                        data={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
                      />
                    </>
                  ) : f.type === "dropdown" ? (
                    <Select
                      label={f.label}
                      value={sample[fid] ?? null}
                      onChange={(val) => { setSample({ ...sample, [fid]: val }); setPreset("Custom"); }}
                      data={f.options!}
                    />
                  ) : (
                    <NumberInput
                      label={f.label}
                      value={sample[fid] ?? ""}
                      onChange={(val) => { setSample({ ...sample, [fid]: val === "" ? "" : Number(val) }); setPreset("Custom"); }}
                    />
                  )}
                </Grid.Col>
              );
            })}
          </Grid>
          <Button fullWidth mt={2} color="brand" leftSection={<IconPlayerPlay size={15} />} style={{ fontWeight: 700 }}>Run Simulation</Button>
          </Stack>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Paper withBorder radius="lg" p="md" mb="md" style={{ background: verdictStyle.bg, borderColor: verdictStyle.fg, borderLeft: `4px solid ${verdictStyle.fg}` }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="sm" align="center" wrap="nowrap">
              <ThemeIcon variant="light" color={results.verdict === "Eligible" ? "green" : results.verdict === "Eligible with Warnings" ? "orange" : results.verdict === "Manual Review" ? "blue" : "red"} radius="xl" size={34}>
                {verdictStyle.icon}
              </ThemeIcon>
              <Box>
                <Text fz={10.5} fw={800} c={verdictStyle.fg} tt="uppercase" style={{ letterSpacing: ".06em" }}>Pre-Screening Result</Text>
                <Text fz={15} fw={800} c={verdictStyle.fg}>{verdictStyle.label}</Text>
              </Box>
            </Group>
            <Text fz={12} c={verdictStyle.fg} ta="right" maw={240}>
              {results.verdict === "Eligible" && "All blocking criteria passed."}
              {results.verdict === "Eligible with Warnings" && "All blocking criteria passed; some non-blocking checks flagged."}
              {results.verdict === "Manual Review" && "Basic criteria met, but file needs manual review."}
              {results.verdict === "Not Eligible" && "One or more blocking criteria failed."}
            </Text>
          </Group>
        </Paper>

        {results.groupResults.map(({ group, groupPass }) => (
          <Paper withBorder radius="lg" shadow="xs" p={0} mb="md" key={group.id} style={{ overflow: "hidden", borderColor: "var(--mantine-color-slate-2)" }}>
            <Group justify="space-between" p="md" style={{ background: "var(--mantine-color-slate-0)", borderBottom: "1px solid var(--mantine-color-slate-2)" }}>
              <Group gap="xs">
                <Box style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", fontSize: 11, fontWeight: 800 }}>{results.groupResults.indexOf(results.groupResults.find((result) => result.group.id === group.id)!) + 1}</Box>
                <Text fw={700} fz={13.5}>{group.name}</Text>
              </Group>
              {groupPass === null ? (
                <Text fz={12} c="dimmed">Not evaluated</Text>
              ) : groupPass ? (
                <Badge size="sm" radius="xl" variant="light" color="green">Passed</Badge>
              ) : (
                <Badge size="sm" radius="xl" variant="light" color="red">Failed</Badge>
              )}
            </Group>
            <Stack gap={0} p="xs">
              {group.rules.filter((r) => !r.disabled).map((r, i) => {
                const f = fieldById(r.fieldId)!;
                const pass = evalRule(r, sample[r.fieldId as string]);
                return (
                  <Box key={r.id}>
                    {i > 0 && <Divider my={6} />}
                    <Group justify="space-between" align="center" py="xs" px="sm" wrap="nowrap" style={{ borderRadius: "var(--mantine-radius-sm)" }}>
                      <Group gap="xs" wrap="nowrap" style={{ overflow: "hidden" }}>
                        <Text fz={13} fw={500} truncate>{f.label}:</Text>
                        <Text fz={12} c="dimmed" truncate>
                          Required: {ruleSentence(r).replace(f.label + " ", "")} · Applicant: {fmtVal(f, sample[r.fieldId as string])}
                        </Text>
                      </Group>
                      {pass === null ? (
                        <Text c="dimmed" fz={12}>—</Text>
                      ) : pass ? (
                        <IconCheck size={16} color="var(--mantine-color-green-6)" style={{ flexShrink: 0 }} />
                      ) : (
                        <IconX size={16} color="var(--mantine-color-red-6)" style={{ flexShrink: 0 }} />
                      )}
                    </Group>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ))}
      </Grid.Col>
    </Grid>
  );
}