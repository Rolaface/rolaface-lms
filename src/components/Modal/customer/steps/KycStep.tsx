import { SimpleGrid, Paper, Text, Group, Button } from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import { PlainCard, SectionHeader } from "../../../shared/customer/Shared";
import { colorVar } from "../../../../utils/customer/utils";

interface KycStepProps {
  kycStatus: Record<string, string>;
  runCheck: (key: string) => void;
}

const ITEMS = [
  {
    key: "kyc",
    title: "KYC Verification",
    desc: "Confirms identity documents against issuing authority records.",
  },
  {
    key: "aml",
    title: "AML Screening",
    desc: "Screens against anti-money-laundering watchlists.",
  },
  {
    key: "sanctions",
    title: "Sanctions Screening",
    desc: "Checks global and local sanctions lists.",
  },
  {
    key: "pep",
    title: "PEP Status",
    desc: "Politically exposed person screening against public office records.",
  },
  {
    key: "fatca",
    title: "FATCA",
    desc: "US tax reporting status — applies to select customer types.",
  },
  {
    key: "crs",
    title: "CRS",
    desc: "Common reporting standard for cross-border tax residency.",
  },
] as const;

const statusColor = (s: string) =>
  s === "Clear"
    ? colorVar("brand", 6)
    : s === "Not applicable"
      ? "var(--mantine-color-slate-4)"
      : colorVar("gold", 6);
const actionLabel = (s: string) =>
  s === "Pending"
    ? "Run check \u2192"
    : s === "Clear"
      ? "View details \u2192"
      : "Mark applicable \u2192";

export function KycStep({ kycStatus, runCheck }: KycStepProps) {
  return (
    <PlainCard>
      <SectionHeader
        icon={IconShieldCheck}
        title="KYC & compliance"
        badge="RUNS AUTOMATICALLY"
        description="Verification, screening and regulatory checks"
        accent="accent"
      />
      <SimpleGrid cols={3} spacing="sm">
        {ITEMS.map((it) => (
          <Paper
            key={it.key}
            withBorder
            radius="md"
            p="md"
            style={{ borderColor: "var(--mantine-color-slate-2)" }}
          >
            <Group justify="space-between" mb="xs" wrap="nowrap">
              <Text size="sm" fw={700} c="dark.8">
                {it.title}
              </Text>
              <Text
                size="xxs"
                fw={700}
                tt="uppercase"
                style={{
                  color: statusColor(kycStatus[it.key]),
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                {kycStatus[it.key]}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mb="xs" style={{ lineHeight: 1.4 }}>
              {it.desc}
            </Text>
            <Button
              variant="transparent"
              size="compact-xs"
              p={0}
              c="brand.6"
              onClick={() =>
                kycStatus[it.key] === "Pending" && runCheck(it.key)
              }
            >
              {actionLabel(kycStatus[it.key])}
            </Button>
          </Paper>
        ))}
      </SimpleGrid>
    </PlainCard>
  );
}
