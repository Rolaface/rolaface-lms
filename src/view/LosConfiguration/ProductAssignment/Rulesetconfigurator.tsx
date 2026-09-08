import { useState } from "react";
import { ActionIcon, Box, Button, Group, Stack, Tabs, Text, Title, useMantineTheme } from "@mantine/core";
import { IconArrowLeft, IconChevronRight, IconDeviceFloppy, IconShieldCog } from "@tabler/icons-react";

import { RuleDetailsTab } from "./Ruledetailstab";
import { RuleGroupsTab } from "./Rulegroupstab";
import { MatchingBehaviorTab } from "./Matchingbehaviortab";
import {
  DEFAULT_MATCHING_SETTINGS,
  DEFAULT_RULE_DETAILS,
  RULE_SET_TAB_ITEMS,
  emptyRuleGroup,
  type MatchingSettings,
  type RuleGroup,
  type RuleSetDetails,
  type RuleSetRecord,
  type RuleSetTabValue,
} from "./shared";

interface RuleSetConfiguratorProps {
  ruleSet?: RuleSetRecord;
  onExit: () => void;
  onSave?: (record: Pick<RuleSetRecord, "details" | "groups" | "settings">) => void;
}

export function RuleSetConfigurator({ ruleSet, onExit, onSave }: RuleSetConfiguratorProps) {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<RuleSetTabValue>("details");

  const [details, setDetails] = useState<RuleSetDetails>(ruleSet?.details ?? DEFAULT_RULE_DETAILS);
  const [groups, setGroups] = useState<RuleGroup[]>(ruleSet?.groups ?? [emptyRuleGroup()]);
  const [settings, setSettings] = useState<MatchingSettings>(ruleSet?.settings ?? DEFAULT_MATCHING_SETTINGS);

  const [savedFlash, setSavedFlash] = useState(false);

  const patchDetails = (patch: Partial<RuleSetDetails>) => setDetails((d) => ({ ...d, ...patch }));
  const patchSettings = (patch: Partial<MatchingSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const handleSave = () => {
    onSave?.({ details, groups, settings });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as RuleSetTabValue)} variant="default">
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
                    background: theme.other.brandGradient,
                    boxShadow: theme.other.brandGlowShadow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconShieldCog size={20} color="var(--mantine-color-white)" stroke={1.8} />
                </Box>

                <Stack gap={2}>
                  {/* <Group gap={6} fz="xs" c="slate.5">
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
                  </Group> */}
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
                  Save configuration
                </Button>
              </Group>
            </Group>

            <Box>
              <Tabs.List
                px="lg"
                style={{
                  borderBottom: "1px solid var(--mantine-color-slate-2)",
                }}
              >
                {RULE_SET_TAB_ITEMS.map(({ value, label, icon: Icon }) => {
                  const isActive = activeTab === value;

                  return (
                    <Tabs.Tab
                      key={value}
                      value={value}
                      leftSection={<Icon size={15} />}
                      style={{
                        color: isActive ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-6)",
                        backgroundColor: isActive ? "var(--mantine-color-brand-0)" : "transparent",
                        border: isActive ? "1px solid var(--mantine-color-brand-2)" : "1px solid transparent",
                        borderBottom: isActive ? "1px solid var(--mantine-color-brand-2)" : "1px solid transparent",
                        borderRadius: "6px 6px 0 0",
                        fontWeight: 600,
                        padding: "10px 16px",
                      }}
                    >
                      {label}
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Box>
          </Box>

          <Box style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <Tabs.Panel value="details">
              <RuleDetailsTab details={details} onChange={patchDetails} />
            </Tabs.Panel>

            {/* <Tabs.Panel value="groups">
              <RuleGroupsTab groups={groups} onChange={setGroups} />
            </Tabs.Panel> */}
<Tabs.Panel value="groups">
  <RuleGroupsTab groups={groups} onChange={setGroups} productLine={details.productLine} />
</Tabs.Panel>
            <Tabs.Panel value="behavior">
              <MatchingBehaviorTab settings={settings} onChange={patchSettings} />
            </Tabs.Panel>
          </Box>
        </Box>
      </Box>
    </Tabs>
  );
}

export default RuleSetConfigurator;