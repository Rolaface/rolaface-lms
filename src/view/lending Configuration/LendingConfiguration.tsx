import { useState } from "react";

import {
  Box,
  Group,
  Title,
  Text,
  Tabs,
  Stack,
  TextInput,
} from "@mantine/core";

import { IconSettings, IconSearch } from "@tabler/icons-react";
import { useMantineTheme } from "@mantine/core";

import {
  TAB_ITEMS,
  type TabValue,
} from "../../components/constants/setting/lendingConfig/lendingConfig.constants";
import { GeneralInfoPanel } from "./tabs/GeneralInfoPanel";
import { InterestPenaltyAccountsPanel } from "./tabs/InterestPenaltyAccountsPanel";
import { TabComingSoon } from "./tabs/TabComingSoon";

export function LendingConfiguration() {
  const [activeTab, setActiveTab] = useState<TabValue>("general");
  const [search, setSearch] = useState("");
  const theme = useMantineTheme();

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => setActiveTab(value as TabValue)}
      variant="default"
    >
      <Box
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
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
                  <IconSettings
                    size={20}
                    color="var(--mantine-color-white)"
                    stroke={1.8}
                  />
                </Box>

                <Stack gap={2}>
                  <Title order={2} c="slate.8" fw={700}>
                    Lending Configuration
                  </Title>
                  <Text fz="sm" c="slate.5">
                    Configure global system parameters and accounting rules.
                  </Text>
                </Stack>
              </Group>
            </Group>

            <Box>
              <Tabs.List
                px="lg"
                style={{
                  borderBottom:
                    "1px solid var(--mantine-color-slate-2)",
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
                        color: isActive
                          ? "var(--mantine-color-brand-6)"
                          : "var(--mantine-color-slate-6)",
                        backgroundColor: isActive
                          ? "var(--mantine-color-brand-0)"
                          : "transparent",
                        border: isActive
                          ? "1px solid var(--mantine-color-brand-2)"
                          : "1px solid transparent",
                        borderBottom: isActive
                          ? "1px solid var(--mantine-color-brand-2)"
                          : "1px solid transparent",
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

           <Box
  px="lg"
  py="xs"
  style={{
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "var(--mantine-color-white)",
    borderBottom: "1px solid var(--mantine-color-slate-2)",
  }}
>
  <TextInput
    value={search}
    onChange={(event) => setSearch(event.currentTarget.value)}
    placeholder="Search settings..."
    leftSection={<IconSearch size={15} />}
    size="xs"
    radius="sm"
    w={300}
    styles={{
      input: {
        height: 34,
      },
    }}
  />
</Box>
          </Box>

          <Box
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <Tabs.Panel value="general">
              <GeneralInfoPanel />
            </Tabs.Panel>

            <Tabs.Panel value="interest-penalty">
              <InterestPenaltyAccountsPanel />
            </Tabs.Panel>

            {TAB_ITEMS.filter(
              (tab) =>
                tab.value !== "general" &&
                tab.value !== "interest-penalty",
            ).map(({ value, label, icon }) => (
              <Tabs.Panel key={value} value={value}>
                <TabComingSoon icon={icon} label={label} />
              </Tabs.Panel>
            ))}
          </Box>
        </Box>
      </Box>
    </Tabs>
  );
}

export default LendingConfiguration;