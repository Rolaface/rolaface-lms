import { useState } from "react";
import { ActionIcon, Box, Button, Grid, Group, Pagination, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import { IconArrowLeft, IconChevronRight, IconDeviceFloppy, IconShieldCog } from "@tabler/icons-react";

import { RuleDetailsTab } from "./Ruledetailstab";
import { RuleGroupsTab } from "./Rulegroupstab";
import { MatchingBehaviorTab } from "./Matchingbehaviortab";
import {
  DEFAULT_MATCHING_SETTINGS,
  DEFAULT_RULE_DETAILS,
  emptyRuleGroup,
  type MatchingSettings,
  type RuleGroup,
  type RuleSetDetails,
  type RuleSetRecord,
} from "./shared";

interface RuleSetConfiguratorProps {
  ruleSet?: RuleSetRecord;
  onExit: () => void;
  onSave?: (record: Pick<RuleSetRecord, "details" | "groups" | "settings">) => void;
}

export function RuleSetConfigurator({ ruleSet, onExit, onSave }: RuleSetConfiguratorProps) {
  const theme = useMantineTheme();

  const [details, setDetails] = useState<RuleSetDetails>(ruleSet?.details ?? DEFAULT_RULE_DETAILS);
  const [groups, setGroups] = useState<RuleGroup[]>(ruleSet?.groups ?? [emptyRuleGroup()]);
  const [settings, setSettings] = useState<MatchingSettings>(ruleSet?.settings ?? DEFAULT_MATCHING_SETTINGS);

  const [savedFlash, setSavedFlash] = useState(false);
  
  // Pagination State for Rule Groups
  const [page, setPage] = useState(1);
  const itemsPerPage = 2;
  const totalPages = Math.max(1, Math.ceil(groups.length / itemsPerPage));
  
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = groups.slice(startIndex, endIndex);

  const patchDetails = (patch: Partial<RuleSetDetails>) => setDetails((d) => ({ ...d, ...patch }));
  const patchSettings = (patch: Partial<MatchingSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const handleGroupsChange = (updatedSlice: RuleGroup[]) => {
    const newGroups = [...groups];
    newGroups.splice(startIndex, paginatedGroups.length, ...updatedSlice);
    setGroups(newGroups);
  };

  const handleSave = () => {
    onSave?.({ details, groups, settings });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  return (
    <Box style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box
        component="main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--mantine-color-slate-0)",
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "var(--mantine-color-white)",
          }}
        >
          <Group justify="space-between" align="center" px="lg" py="md" wrap="wrap">
            <Group gap="sm" align="center">
              <ActionIcon variant="subtle" color="slate" onClick={onExit} aria-label="Back to rule sets">
                <IconArrowLeft size={18} />
              </ActionIcon>

              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--mantine-radius-md)",
                  background: theme.other?.brandGradient || "linear-gradient(to right, var(--mantine-color-blue-6), var(--mantine-color-cyan-6))",
                  boxShadow: theme.other?.brandGlowShadow || "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconShieldCog size={20} color="var(--mantine-color-white)" stroke={1.8} />
              </Box>

              <Stack gap={2}>
                <Group gap={6} fz="xs" c="slate.5">
                  <Text fz="xs" c="slate.5">
                    Origination Setup
                  </Text>
                  <IconChevronRight size={12} />
                  <Text fz="xs" c="slate.5">
                    Pre-Screening
                  </Text>
                  <IconChevronRight size={12} />
                  <Text fz="xs" c="slate.8">
                    {ruleSet ? ruleSet.summary.name : "New rule set"}
                  </Text>
                </Group>
                <Title order={2} c="slate.8" fw={700}>
                  {details.ruleName || "Loan Product Auto Assignment"}
                </Title>
              </Stack>
            </Group>

            <Group gap="sm">
              {savedFlash && (
                <Text fz="sm" fw={500} c="teal.6">
                  Configuration saved
                </Text>
              )}
              <Button variant="default" c="slate.7" onClick={onExit}>
                Cancel
              </Button>
              <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave}>
                Save Assignment
              </Button>
            </Group>
          </Group>
        </Box>

        {/* Scrollable Unified Content Area */}
        <Box style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <Grid gutter="lg" mb="xl">
            {/* Rule Details: Left Box */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Box style={{ height: "100%" }}>
                <RuleDetailsTab details={details} onChange={patchDetails} />
              </Box>
            </Grid.Col>

            {/* Matching Behavior: Right Box */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Box style={{ height: "100%" }}>
                <MatchingBehaviorTab settings={settings} onChange={patchSettings} />
              </Box>
            </Grid.Col>
          </Grid>

          {/* Rule Groups List */}
          <Box mb="md">
           <RuleGroupsTab groups={paginatedGroups} startIndex={startIndex} onChange={handleGroupsChange} />
          </Box>

          {/* Table-style Pagination Footer */}
          {groups.length > itemsPerPage && (
            <Group justify="flex-end" align="center" mt="xl" py="sm" style={{ borderTop: "1px solid var(--mantine-color-slate-2)" }}>
              <Text fz="sm" c="slate.5">
                Showing {startIndex + 1} to {Math.min(endIndex, groups.length)} of {groups.length} groups
              </Text>
              <Pagination 
                total={totalPages} 
                value={page} 
                onChange={setPage} 
                size="sm" 
                radius="md" 
                withEdges 
              />
            </Group>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default RuleSetConfigurator;