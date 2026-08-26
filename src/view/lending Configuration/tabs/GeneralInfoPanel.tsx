import {
  Paper,
  Box,
  Text,
  Switch,
  Group,
  Skeleton,
  Accordion,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import {
  IconLock,
  IconSettings,
  IconRefresh,
  IconPercentage,
  IconShieldCheck,
  IconFileCheck,
} from "@tabler/icons-react";

import { useGeneralLendingSettings } from "../../../hooks/setting/lending-config/useGeneralLendingSettings";
import type { LendingDefaultsRaw } from "../../../types/setting/lending_config/lendingConfig.types";

type SettingSection =
  | "Operational Settings"
  | "Repayment Settings"
  | "Interest Settings"
  | "Risk & Controls"
  | "Document & Verification";

interface SettingConfig {
  id: string;
  name: string;
  description: string;
  section: SettingSection;
}

interface SettingItem extends SettingConfig {
  checked: boolean;
}

// Column layout — which sections render on which side.
// Kept separate from section metadata so the grouping choice is explicit
// and easy to re-balance later without touching render logic.
const COLUMN_LAYOUT: SettingSection[][] = [
  ["Operational Settings", "Interest Settings", "Document & Verification"],
  ["Repayment Settings", "Risk & Controls"],
];

const SECTION_ICONS: Record<SettingSection, React.ReactNode> = {
  "Operational Settings": <IconSettings size={15} stroke={1.8} />,
  "Repayment Settings": <IconRefresh size={15} stroke={1.8} />,
  "Interest Settings": <IconPercentage size={15} stroke={1.8} />,
  "Risk & Controls": <IconShieldCheck size={15} stroke={1.8} />,
  "Document & Verification": <IconFileCheck size={15} stroke={1.8} />,
};

// Static metadata only — no boolean state baked in here.
// `checked` is resolved at render time from the injected `defaults` payload.
const SETTINGS_CONFIG: SettingConfig[] = [
  {
    id: "enable_loan_accounting",
    name: "Enable loan accounting",
    description: "Post lending transactions through accounting entries",
    section: "Operational Settings",
  },
  {
    id: "auto_disbursement",
    name: "Enable auto disbursement",
    description: "Automatically release funds after approval",
    section: "Operational Settings",
  },
  {
    id: "enable_topup",
    name: "Enable top-up",
    description: "Allow additional borrowing on active loans",
    section: "Operational Settings",
  },
  {
    id: "allow_loan_restructure",
    name: "Allow loan restructuring",
    description: "Allow modification of existing loan terms",
    section: "Operational Settings",
  },

  {
    id: "allow_partial_repayment",
    name: "Allow partial repayment",
    description: "Allow borrowers to make partial loan repayments",
    section: "Repayment Settings",
  },
  {
    id: "auto_repayment_schedule",
    name: "Automatic repayment schedule",
    description: "Automatically generate repayment schedules",
    section: "Repayment Settings",
  },
  {
    id: "validate_normal_repayment",
    name: "Validate normal repayment",
    description: "Prevent repayment amounts from exceeding payable amounts",
    section: "Repayment Settings",
  },
  {
    id: "minimum_days_before_first_repayment",
    name: "Minimum days before first repayment",
    description: "Maintain a minimum gap between disbursement and first repayment",
    section: "Repayment Settings",
  },
  {
    id: "excess_amount_acceptance",
    name: "Excess amount acceptance",
    description: "Allow small excess payments during loan closure",
    section: "Repayment Settings",
  },

  {
    id: "interest_accrual",
    name: "Interest accrual",
    description: "Automatically accrue interest on active loans",
    section: "Interest Settings",
  },
  {
    id: "loan_accrual_frequency",
    name: "Loan accrual frequency",
    description: "Control how frequently loan interest is accrued",
    section: "Interest Settings",
  },
  {
    id: "interest_day_count_convention",
    name: "Interest day-count convention",
    description: "Define the day-count method used for interest calculation",
    section: "Interest Settings",
  },
  {
    id: "penalty_interest",
    name: "Penalty interest",
    description: "Apply penalty interest to overdue repayments",
    section: "Interest Settings",
  },
  {
    id: "penalty_grace_period",
    name: "Penalty grace period",
    description: "Allow overdue repayments before penalty interest starts",
    section: "Interest Settings",
  },

  {
    id: "npa_classification",
    name: "NPA classification",
    description: "Classify loans based on configured delinquency rules",
    section: "Risk & Controls",
  },
  {
    id: "days_past_due_threshold",
    name: "Days past due threshold",
    description: "Define the threshold used for NPA classification",
    section: "Risk & Controls",
  },
  {
    id: "loan_account_freeze",
    name: "Loan account freeze",
    description: "Stop accrual and demand generation for frozen loans",
    section: "Risk & Controls",
  },
  {
    id: "auto_write_off",
    name: "Automatic write-off",
    description: "Automatically write off eligible residual loan amounts",
    section: "Risk & Controls",
  },

  {
    id: "loan_agreement_required",
    name: "Loan agreement required",
    description: "Require a loan agreement before loan processing",
    section: "Document & Verification",
  },
  {
    id: "kyc_verification_required",
    name: "KYC verification required",
    description: "Require borrower verification before loan processing",
    section: "Document & Verification",
  },
  {
    id: "document_verification",
    name: "Document verification",
    description: "Require verification of submitted loan documents",
    section: "Document & Verification",
  },
];
function resolveChecked(
  id: string,
  defaults: LendingDefaultsRaw,
): boolean {
  const raw = (defaults as unknown as Record<string, unknown>)[id];

  return typeof raw === "boolean" ? raw : false;
}
const accordionStyles = {
  item: {
    marginBottom: 6,
    border: "1px solid var(--mantine-color-slate-2)",
  },
  control: {
    padding: "8px 16px",
    minHeight: "auto",
  },
  panel: { padding: 0 },
  content: { padding: 0 },
  label: { padding: 0 },
};

interface SettingRowProps {
  name: string;
  description: string;
  checked: boolean;
}

function SettingRow({ name, description, checked }: SettingRowProps) {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="nowrap"
      py={6}
      px="md"
      style={{
        borderBottom: "1px solid var(--mantine-color-slate-1)",
      }}
    >
      <Box style={{ minWidth: 0 }}>
        <Text size="sm" fw={600} c="slate.8" lh={1.3}>
          {name}
        </Text>

        <Text size="xs" c="slate.5" lh={1.3}>
          {description}
        </Text>
      </Box>

      <Group gap="sm" wrap="nowrap">
        <Text
          size="xs"
          fw={700}
          c={checked ? "brand.6" : "slate.4"}
          style={{ letterSpacing: "0.03em" }}
        >
          {checked ? "ON" : "OFF"}
        </Text>

        <Switch checked={checked} color="brand" size="sm" disabled />
      </Group>
    </Group>
  );
}

interface SectionAccordionProps {
  sections: { section: SettingSection; items: SettingItem[] }[];
}

function SectionAccordion({ sections }: SectionAccordionProps) {
  return (
    <Accordion
      multiple
      defaultValue={sections.length > 0 ? [sections[0].section] : []}
      variant="separated"
      radius="sm"
      chevronPosition="right"
      styles={accordionStyles}
    >
      {sections.map(({ section, items }) => (
        <Accordion.Item key={section} value={section}>
          <Accordion.Control icon={SECTION_ICONS[section]}>
            <Text size="sm" fw={600} c="slate.8">
              {section}
            </Text>
          </Accordion.Control>

          <Accordion.Panel>
            <Box>
              {items.map((item) => (
                <SettingRow
                  key={item.id}
                  name={item.name}
                  description={item.description}
                  checked={item.checked}
                />
              ))}
            </Box>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export function GeneralInfoPanel() {
  const { defaults, isLoading } = useGeneralLendingSettings();

  if (isLoading || !defaults) {
    return (
      <Paper p="md" radius="sm" withBorder>
        <Skeleton height={40} mb="sm" />
        <Skeleton height={40} />
      </Paper>
    );
  }

  const settings: SettingItem[] = SETTINGS_CONFIG.map((cfg) => ({
    ...cfg,
    checked: resolveChecked(cfg.id, defaults),
  }));

  const buildGroups = (sectionList: SettingSection[]) =>
    sectionList
      .map((section) => ({
        section,
        items: settings.filter((setting) => setting.section === section),
      }))
      .filter((group) => group.items.length > 0);

  const columns = COLUMN_LAYOUT.map(buildGroups).filter(
    (group) => group.length > 0
  );

  return (
    <Stack gap={0} style={{ minHeight: "100%" }}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {columns.map((sections, idx) => (
          <SectionAccordion key={idx} sections={sections} />
        ))}
      </SimpleGrid>

      <Group
        gap={6}
        mt="auto"
        pt="md"
        style={{
          borderTop: "1px solid var(--mantine-color-slate-1)",
        }}
      >
        <IconLock size={14} color="var(--mantine-color-slate-4)" />
        <Text size="xs" c="slate.5">
          Lending configuration is in maintenance mode. All settings are
          read-only.
        </Text>
      </Group>
    </Stack>
  );
}

export default GeneralInfoPanel;