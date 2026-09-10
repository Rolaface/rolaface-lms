import { useState } from "react";
import { Box, Group, Title, Text, Tabs, Stack, useMantineTheme } from "@mantine/core";
import { IconSettingsCheck } from "@tabler/icons-react";

import { TAB_ITEMS, type TabValue } from "./shared";
import { EligibilityRules } from "./EligibilityRules";
import { CreateRule } from "./CreateRule";
import { Simulator } from "./Simulator";

export function LosEligibilityCheck() {
  const [activeTab, setActiveTab] = useState<TabValue>("rules");
  const theme = useMantineTheme();

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as TabValue)} variant="default">
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
            <Group justify="space-between" align="center" px="lg" py="md">
              <Group gap="sm" align="center">
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
                  <IconSettingsCheck size={20} color="var(--mantine-color-white)" stroke={1.8} />
                </Box>

                <Stack gap={2}>
                  <Title order={2} c="slate.8" fw={700}>
                    Loan Eligibility Check
                  </Title>
                  <Text fz="sm" c="slate.5">
                    Configure the rules used to determine customer eligibility, risk category and pre-approved loan amount.
                  </Text>
                </Stack>
              </Group>
            </Group>

            <Box>
              <Tabs.List
                px="lg"
                style={{
                  borderBottom: "1px solid var(--mantine-color-slate-2)",
                }}
              >
                {TAB_ITEMS.map(({ value, label, icon: Icon }) => {
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
            <Tabs.Panel value="rules">
              <EligibilityRules onCreateRule={() => setActiveTab("create")} onSimulate={() => setActiveTab("simulate")} />
            </Tabs.Panel>

            <Tabs.Panel value="create">
              <CreateRule onExit={() => setActiveTab("rules")} />
            </Tabs.Panel>

            <Tabs.Panel value="simulate">
              <Simulator />
            </Tabs.Panel>
          </Box>
        </Box>
      </Box>
    </Tabs>
  );
}

export default LosEligibilityCheck;