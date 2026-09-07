import { useMemo, useState } from "react";
import { Badge, Button, Paper, Box, Group, Stack, Text, Select, SegmentedControl, Grid, Divider, NumberInput } from "@mantine/core";
import { IconCheck, IconPlayerPlay, IconX } from "@tabler/icons-react";
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
  const [sample, setSample] = useState<Record<string, any>>({ ...SAMPLE_APPLICANTS["Eligible applicant"] });
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
    Eligible: { bg: "var(--mantine-color-green-0)", fg: "var(--mantine-color-green-7)", label: "✓ Eligible" },
    "Eligible with Warnings": { bg: "var(--mantine-color-orange-0)", fg: "var(--mantine-color-orange-7)", label: "⚠ Eligible with Warnings" },
    "Manual Review": { bg: "var(--mantine-color-blue-0)", fg: "var(--mantine-color-blue-7)", label: "◔ Sent for Manual Review" },
    "Not Eligible": { bg: "var(--mantine-color-red-0)", fg: "var(--mantine-color-red-7)", label: "✕ Not Eligible" },
  }[results.verdict];

  return (
    <Grid gutter="lg" >
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Paper withBorder radius="lg" shadow="xs" p="lg" style={{ alignSelf: "start" }}>
          <Text fz={13} fw={700} mb="md">Sample Applicant</Text>
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
          <Stack gap="sm">
            {TEST_FIELDS.map((fid) => {
              const f = fieldById(fid)!;
              return (
                <Box key={fid}>
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
                </Box>
              );
            })}
          </Stack>
          <Button fullWidth mt="md" color="brand" leftSection={<IconPlayerPlay size={13} />}>Run Simulation</Button>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 8 }}>
        <Paper withBorder radius="lg" p="lg" mb="md" ta="center" style={{ background: verdictStyle.bg, borderColor: verdictStyle.fg }}>
          <Text fz={11} fw={700} c={verdictStyle.fg} tt="uppercase" mb={6} style={{ letterSpacing: ".05em" }}>
            Pre-Screening Result
          </Text>
          <Text fz={22} fw={600} c={verdictStyle.fg}>{verdictStyle.label}</Text>
          <Text fz={12.5} c={verdictStyle.fg} mt={6}>
            {results.verdict === "Eligible" && "All blocking criteria passed."}
            {results.verdict === "Eligible with Warnings" && "All blocking criteria passed; some non-blocking checks were flagged."}
            {results.verdict === "Manual Review" && "Basic criteria were met, but the file needs manual credit review."}
            {results.verdict === "Not Eligible" && "One or more blocking criteria failed."}
          </Text>
        </Paper>

        {results.groupResults.map(({ group, groupPass }) => (
          <Paper withBorder radius="lg" shadow="xs" p="lg" mb="md" key={group.id}>
            <Group justify="space-between" mb="sm">
              <Text fw={700} fz={13.5}>{group.name}</Text>
              {groupPass === null ? (
                <Text fz={12} c="dimmed">Not evaluated</Text>
              ) : groupPass ? (
                <Badge size="sm" radius="xl" variant="light" color="green">Passed</Badge>
              ) : (
                <Badge size="sm" radius="xl" variant="light" color="red">Failed</Badge>
              )}
            </Group>
            <Stack gap={0}>
              {group.rules.filter((r) => !r.disabled).map((r, i) => {
                const f = fieldById(r.fieldId)!;
                const pass = evalRule(r, sample[r.fieldId as string]);
                return (
                  <Box key={r.id}>
                    {i > 0 && <Divider />}
                    <Group justify="space-between" align="center" py="sm">
                      <Box>
                        <Text fz={13}>{f.label}</Text>
                        <Text fz={12} c="dimmed">Required: {ruleSentence(r).replace(f.label + " ", "")} · Applicant: {fmtVal(f, sample[r.fieldId as string])}</Text>
                      </Box>
                      {pass === null ? (
                        <Text c="dimmed" fz={12}>—</Text>
                      ) : pass ? (
                        <IconCheck size={14} color="var(--mantine-color-green-6)" />
                      ) : (
                        <IconX size={14} color="var(--mantine-color-red-6)" />
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