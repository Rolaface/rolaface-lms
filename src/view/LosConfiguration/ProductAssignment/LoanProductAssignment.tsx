import { useState } from "react";
import { Badge, Box, Button, Group, Stack, Text, Title, useMantineTheme } from "@mantine/core";
import {
  IconChevronRight,
  IconEyeOff,
  IconEyeSearch,
  IconInbox,
  IconPlus,
  IconShieldCog,
} from "@tabler/icons-react";
// import { RuleSetConfigurator } from "./Rulesetconfigurator";
import { RuleSetConfigurator } from "./ProductDetails"; 

type RuleStatus = "Active" | "Draft" | "Inactive";

interface AssignmentRule {
  id: string;
  ruleName: string;
  source: string;
  category: string;
  subcategory: string;
  productLine: string;
  status: RuleStatus;
}

const ASSIGNMENT_RULES: AssignmentRule[] = [
  {
    id: "rule-1",
    ruleName: "Auto Loan Product Assignment",
    source: "Customer Profile",
    category: "Credit",
    subcategory: "Credit Score",
    productLine: "Auto Loan",
    status: "Active",
  },
];

const STATUS_COLOR: Record<RuleStatus, string> = {
  Active: "teal",
  Draft: "slate",
  Inactive: "amber",
};

export function LoanProductAssignment() {
  const theme = useMantineTheme();
  const [showEmptyState, setShowEmptyState] = useState(false);
  
  // 2. Add a state to track the active view
  const [activeView, setActiveView] = useState<"list" | "configurator">("list");

  const ruleSets = showEmptyState ? [] : ASSIGNMENT_RULES;

  // 3. Update the handlers to switch views instead of just logging
  const onOpenRuleSet = (id: string) => setActiveView("configurator");
  const onCreateNew = () => setActiveView("configurator");

  // 4. Return the configurator component if the state is active
  if (activeView === "configurator") {
    return (
      <RuleSetConfigurator 
        onExit={() => setActiveView("list")} 
      />
    );
  }

  return (
    <Box p="xl">
      <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
        <Group gap="sm" align="flex-start">
          <Box
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
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
            <Title order={2} c="slate.8" fw={700}>
              Loan Product Auto Assignment
            </Title>
            <Text fz="sm" c="slate.5">
              Identify rules and the data evaluated to automatically assign loan products.
            </Text>
          </Stack>
        </Group>

        <Group gap="sm">
          <Button
            variant="default"
            c="slate.7"
            leftSection={showEmptyState ? <IconEyeOff size={16} /> : <IconEyeSearch size={16} />}
            onClick={() => setShowEmptyState((v) => !v)}
          >
            {showEmptyState ? "Show rules" : "Preview empty state"}
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={onCreateNew}>
            New Product Assignment
          </Button>
        </Group>
      </Group>

      <Box
        style={{
          border: "1px solid var(--mantine-color-slate-2)",
          borderRadius: "var(--mantine-radius-md)",
          background: "var(--mantine-color-white)",
          overflow: "hidden",
        }}
      >
        {ruleSets.length === 0 ? (
          <Stack align="center" justify="center" py={64} gap="xs">
            <IconInbox size={32} color="var(--mantine-color-slate-4)" stroke={1.5} />
            <Text fz="sm" fw={600} c="slate.6">
              No assignment rules yet
            </Text>
            <Text fz="xs" c="slate.5">
              Create a rule to automatically assign products based on customer details.
            </Text>
            <Button mt="xs" size="xs" leftSection={<IconPlus size={14} />} onClick={onCreateNew}>
              New Assignment Rule
            </Button>
          </Stack>
        ) : (
          <>
            <Box
              px="lg"
              py="sm"
              style={{
                borderBottom: "1px solid var(--mantine-color-slate-2)",
                background: "var(--mantine-color-slate-0)",
              }}
            >
              <Group wrap="nowrap">
                <Text fz="xs" fw={700} c="slate.5" style={{ flex: "2 1 0", letterSpacing: 0.3 }}>
                  RULE NAME
                </Text>
                <Text fz="xs" fw={700} c="slate.5" style={{ flex: "1 1 0", letterSpacing: 0.3 }}>
                  SOURCE
                </Text>
                <Text fz="xs" fw={700} c="slate.5" style={{ flex: "1 1 0", letterSpacing: 0.3 }}>
                  CATEGORY
                </Text>
                <Text fz="xs" fw={700} c="slate.5" style={{ flex: "1 1 0", letterSpacing: 0.3 }}>
                  SUBCATEGORY
                </Text>
                <Text fz="xs" fw={700} c="slate.5" style={{ flex: "1 1 0", letterSpacing: 0.3 }}>
                  PRODUCT LINE
                </Text>
                <Box style={{ width: 20 }} />
              </Group>
            </Box>

            <Stack gap={0}>
              {ruleSets.map((rs) => (
                <Box
                  key={rs.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenRuleSet(rs.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onOpenRuleSet(rs.id);
                  }}
                  px="lg"
                  py="md"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--mantine-spacing-md)",
                    borderBottom: "1px solid var(--mantine-color-slate-1)",
                    borderLeft: `3px solid var(--mantine-color-${STATUS_COLOR[rs.status]}-5)`,
                    cursor: "pointer",
                    transition: "background-color .1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--mantine-color-slate-0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Stack gap={4} style={{ flex: "2 1 0", minWidth: 0 }}>
                      <Text fz="sm" fw={600} c="slate.8" truncate>
                        {rs.ruleName}
                      </Text>
                      <Badge size="sm" variant="light" color={STATUS_COLOR[rs.status]} w="fit-content">
                        {rs.status}
                      </Badge>
                    </Stack>
                    <Text fz="sm" c="slate.6" style={{ flex: "1 1 0" }}>
                      {rs.source}
                    </Text>
                    <Text fz="sm" c="slate.6" style={{ flex: "1 1 0" }}>
                      {rs.category}
                    </Text>
                    <Text fz="sm" c="slate.6" style={{ flex: "1 1 0" }}>
                      {rs.subcategory}
                    </Text>
                    <Text fz="sm" c="slate.6" style={{ flex: "1 1 0" }}>
                      {rs.productLine}
                    </Text>
                    <Box style={{ width: 20, display: "flex", justifyContent: "flex-end" }}>
                      <IconChevronRight size={16} color="var(--mantine-color-slate-4)" />
                    </Box>
                  </Group>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

export default LoanProductAssignment;