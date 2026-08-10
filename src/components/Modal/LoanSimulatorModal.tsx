import { useMemo, useState } from "react";
import {
  Modal,
  Text,
  NumberInput,
  Button,
  ActionIcon,
  ThemeIcon,
  Paper,
  Group,
  useMantineTheme,
} from "@mantine/core";
import {
  IconCalculator,
  IconPercentage,
  IconCalendarStats,
  IconInfoCircle,
  IconX,
  IconCurrency,
} from "@tabler/icons-react";

interface LoanSimulatorModalProps {
  opened: boolean;
  onClose: () => void;
  onApply?: (principal: number, tenure: number) => void;
}

function FieldIcon({ Icon }: { Icon: any }) {
  return (
    <ThemeIcon variant="light" color="slate" radius="md" size={28}>
      <Icon size={14} />
    </ThemeIcon>
  );
}

function calcEmi(principal: number, annualRate: number, tenureMonths: number) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

function calcPrincipalFromEmi(emi: number, annualRate: number, tenureMonths: number) {
  if (!emi || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const principal = (emi * (Math.pow(1 + r, tenureMonths) - 1)) / (r * Math.pow(1 + r, tenureMonths));
  return Math.round(principal * 100) / 100;
}

export function LoanSimulatorModal({ opened, onClose, onApply }: LoanSimulatorModalProps) {
  const theme = useMantineTheme();
  const [simPrincipal, setSimPrincipal] = useState<number | "">(50000);
  const [simRate, setSimRate] = useState<number | "">(14.5);
  const [simTenure, setSimTenure] = useState<number | "">(12);
  const [simEmi, setSimEmi] = useState<number | "">("");
  const [simMode, setSimMode] = useState<"principalToEmi" | "emiToPrincipal">("principalToEmi");

  const simComputedEmi = useMemo(() => {
    if (simMode === "emiToPrincipal") return Number(simEmi) || 0;
    return calcEmi(Number(simPrincipal) || 0, Number(simRate) || 0, Number(simTenure) || 0);
  }, [simMode, simPrincipal, simRate, simTenure, simEmi]);

  const simComputedPrincipal = useMemo(() => {
    if (simMode === "emiToPrincipal") {
      return calcPrincipalFromEmi(Number(simEmi) || 0, Number(simRate) || 0, Number(simTenure) || 0);
    }
    return Number(simPrincipal) || 0;
  }, [simMode, simEmi, simRate, simTenure, simPrincipal]);

  const simTotalRepayment = useMemo(
    () => Math.round(simComputedEmi * (Number(simTenure) || 0) * 100) / 100,
    [simComputedEmi, simTenure]
  );
  const simTotalInterest = useMemo(
    () => Math.round((simTotalRepayment - simComputedPrincipal) * 100) / 100,
    [simTotalRepayment, simComputedPrincipal]
  );

  const handleSimPrincipalChange = (v: number | "") => {
    setSimPrincipal(v);
    setSimMode("principalToEmi");
    setSimEmi("");
  };

  const handleSimEmiChange = (v: number | "") => {
    setSimEmi(v);
    setSimMode("emiToPrincipal");
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={640}
      withCloseButton={false}
      padding="lg"
      radius="lg"
    >
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg" wrap="nowrap">
        <Group gap={6}>
          <Text size="sm" fw={800} c="slate.8" tt="uppercase" style={{ letterSpacing: "0.04em" }}>
            Loan Simulator
          </Text>
        </Group>
        <ActionIcon onClick={onClose} variant="subtle" color="slate" size="lg" radius="md">
          <IconX size={20} />
        </ActionIcon>
      </Group>

      <div
        className="grid grid-cols-1 gap-6"
        style={{ gridTemplateColumns: "240px 1fr" }}
      >
        {/* Left Column - Inputs */}
        <div className="flex flex-col gap-4">
          <NumberInput
            label="Principal"
            hideControls
            min={0}
            value={simPrincipal}
            onChange={(v) => handleSimPrincipalChange(v as number | "")}
            leftSection={<FieldIcon Icon={IconCurrency} />}
            thousandSeparator=","
            maw={240}
          />

          <NumberInput
            label="Interest Rate (% p.a.)"
            hideControls
            min={0}
            value={simRate}
            onChange={(v) => setSimRate(v as number | "")}
            leftSection={<FieldIcon Icon={IconPercentage} />}
            maw={240}
          />

          <NumberInput
            label="Tenure (months)"
            value={simTenure}
            hideControls
            min={0}
            onChange={(v) => setSimTenure(v as number | "")}
            leftSection={<FieldIcon Icon={IconCalendarStats} />}
            maw={240}
          />

          <div style={{ maxWidth: 240 }}>
            <NumberInput
              label="EMI"
              hideControls
              min={0}
              value={simMode === "emiToPrincipal" ? simEmi : simComputedEmi || ""}
              onChange={(v) => handleSimEmiChange(v as number | "")}
              leftSection={<FieldIcon Icon={IconCalculator} />}
            />
            <Text size="xs" c="slate.4" mt={6}>
              Enter an EMI to back-calculate the Principal below.
            </Text>
          </div>

          <Paper
            radius="md"
            p="sm"
            style={{
              background: "var(--mantine-color-slate-0)",
              border: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            <Text size="xs" c="slate.6">
              Showing{" "}
              <Text span fw={700} c="brand.6">
                {simMode === "principalToEmi" ? "Principal → EMI" : "EMI → Principal"}
              </Text>
              . Type a value into {simMode === "principalToEmi" ? "EMI" : "Principal"} to switch to{" "}
              {simMode === "principalToEmi" ? "EMI → Principal" : "Principal → EMI"} mode.
            </Text>
          </Paper>

          <Button
            size="md"
            fullWidth
            onClick={() => {
              if (onApply) onApply(simComputedPrincipal, Number(simTenure) || 0);
              onClose();
            }}
            styles={{
              root: {
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
                border: "none",
              },
            }}
          >
            Apply to Loan Form →
          </Button>
        </div>

        {/* Right Column - Results Card — sized to its own content, not stretched */}
        <Paper
          radius="lg"
          shadow="md"
          p="lg"
          style={{
            background: "var(--mantine-color-gold-0)",
            border: "1px solid var(--mantine-color-gold-2)",
            alignSelf: "start",
          }}
        >
          <Text size="xs" fw={800} c="gold.7" tt="uppercase" mb={6} style={{ letterSpacing: "0.04em" }}>
            Estimated EMI
          </Text>
          <Text fw={800} c="gold.7" mb="md" style={{ fontSize: 32, lineHeight: 1 }}>
            {formatCurrency(simComputedEmi)}
          </Text>

          <div className="flex flex-col gap-0">
            <Group
              justify="space-between"
              py="sm"
              style={{ borderTop: "1px solid var(--mantine-color-gold-2)" }}
            >
              <Text size="sm" c="slate.7">
                Principal
              </Text>
              <Text size="sm" fw={600} c="slate.7" ff="monospace">
                {formatCurrency(simComputedPrincipal)}
              </Text>
            </Group>

            <Group
              justify="space-between"
              py="sm"
              style={{ borderTop: "1px solid var(--mantine-color-gold-2)" }}
            >
              <Text size="sm" c="slate.7">
                Total Interest Payable
              </Text>
              <Text size="sm" fw={600} c="slate.7" ff="monospace">
                {formatCurrency(simTotalInterest)}
              </Text>
            </Group>

            <Group
              justify="space-between"
              pt="sm"
              style={{ borderTop: "1px solid var(--mantine-color-gold-2)" }}
            >
              <Text size="sm" c="slate.7">
                Total Repayment
              </Text>
              <Text size="sm" fw={600} c="slate.7" ff="monospace">
                {formatCurrency(simTotalRepayment)}
              </Text>
            </Group>
          </div>
        </Paper>
      </div>
    </Modal>
  );
}