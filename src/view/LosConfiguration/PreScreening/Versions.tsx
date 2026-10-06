import { Paper, Box, Group, Stack, Text, Title, Loader, Badge } from "@mantine/core";
import { IconArchive, IconCheck, IconPencil, IconPlayerPause, IconHistory } from "@tabler/icons-react";
import { formatDate, formatDay, type RuleSet, type VersionEntry } from "./types";
import { StatusBadge } from "./shared";
import { getVersions } from "../../../api/LosConfiguration/PreScreeningApi";
import { useState, useEffect } from "react";

export interface VersionsTabProps {
  ruleSet: RuleSet;
}

const toneFor = (status: string) =>
  status === "Active" ? "green" : status === "Draft" ? "brand" : status === "Inactive" ? "orange" : "slate";

const iconFor = (status: string) =>
  status === "Active" ? (
    <IconCheck size={13} stroke={2.2} />
  ) : status === "Draft" ? (
    <IconPencil size={13} stroke={2.2} />
  ) : status === "Inactive" ? (
    <IconPlayerPause size={13} stroke={2.2} />
  ) : (
    <IconArchive size={13} stroke={2.2} />
  );

export default function VersionsTab({ ruleSet }: VersionsTabProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ruleSet.product) return;
    setLoading(true);
    setFailed(false);
    getVersions(ruleSet.product)
      .then((res) => setVersions(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [ruleSet.product, ruleSet.id]);

  return (
    <Box maw={760}>
      <Group gap={8} align="center" mb={10} wrap="nowrap">
        <Box style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mantine-color-brand-6)", color: "white", flexShrink: 0 }}>
          <IconHistory size={13} stroke={2} />
        </Box>
        <Title order={4} fz={13} c="slate.8">Version History</Title>
        {!loading && !failed && (
          <Text fz={11.5} c="slate.5">
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </Text>
        )}
      </Group>

      {loading ? (
        <Stack align="center" py="lg">
          <Loader size="sm" color="brand" />
        </Stack>
      ) : failed ? (
        <Paper radius="md" p={14} style={{ border: "1px dashed var(--mantine-color-red-3)", textAlign: "center", background: "var(--mantine-color-red-0)" }}>
          <Text fz={11.5} c="red.7">Version history could not be loaded.</Text>
        </Paper>
      ) : versions.length === 0 ? (
        <Paper radius="md" p={14} style={{ border: "1px dashed var(--mantine-color-slate-3)", textAlign: "center", background: "var(--mantine-color-slate-0)" }}>
          <Text fz={11.5} c="dimmed">No versions yet.</Text>
        </Paper>
      ) : (
        versions.map((v) => {
          const tone = toneFor(v.status);
          const current = v.name === ruleSet.id;
          const effective = v.effective_from
            ? `Effective ${formatDay(v.effective_from)}${v.effective_to ? ` – ${formatDay(v.effective_to)}` : ""}`
            : "Effective when activated";
          return (
            <Paper
              withBorder
              radius="md"
              p={12}
              mb={8}
              key={v.name}
              style={{
                background: current ? "var(--mantine-color-brand-0)" : "var(--mantine-color-white)",
                borderColor: current ? "var(--mantine-color-brand-2)" : "var(--mantine-color-slate-2)",
                borderLeft: `3px solid var(--mantine-color-${tone}-4)`,
              }}
            >
              <Group align="flex-start" gap={10} wrap="nowrap">
                <Box
                  w={46}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "6px 4px",
                    borderRadius: 6,
                    background: `var(--mantine-color-${tone}-0)`,
                    color: `var(--mantine-color-${tone}-7)`,
                  }}
                >
                  {iconFor(v.status)}
                  <Text fz={12} fw={700} lh={1}>v{v.version}</Text>
                </Box>
                <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8} align="center" wrap="nowrap">
                    <StatusBadge status={v.status} />
                    {current && (
                      <Badge size="xs" radius="sm" variant="light" color="brand">
                        Viewing
                      </Badge>
                    )}
                    <Text fz={11} c="slate.5" truncate>
                      {effective}
                    </Text>
                  </Group>
                  <Text fz={11.5} c="slate.6">
                    {v.rules_count ?? 0} rule{v.rules_count === 1 ? "" : "s"}
                  </Text>
                  <Text fz={11} c="slate.5">
                    {v.published_on
                      ? `Published by ${v.published_by || "—"} on ${formatDate(v.published_on)}`
                      : "Never published"}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          );
        })
      )}
    </Box>
  );
}
