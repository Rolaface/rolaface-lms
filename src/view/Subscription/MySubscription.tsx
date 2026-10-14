import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAward,
  IconClock,
  IconCopy,
  IconCreditCard,
  IconLayersLinked,
} from "@tabler/icons-react";
import {
  getMySubscription,
  type MySubscriptionResponse,
} from "../../api/subscriptionApi";

const parseDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`);

const formatDate = (d: string | null | undefined) => {
  if (!d) return "-";
  const date = parseDate(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const daysFromToday = (d: string) => {
  const date = parseDate(d);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

const describeDays = (days: number) => {
  if (days === 0) return "(today)";
  const n = Math.abs(days);
  const unit = n === 1 ? "day" : "days";
  return days > 0 ? `(in ${n} ${unit})` : `(${n} ${unit} ago)`;
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  } catch {
    return `${currency ?? ""} ${amount ?? 0}`.trim();
  }
};

const getErrorMessage = (err: unknown) => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "Failed to load subscription";
};

function HeaderField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box miw={0}>
      <Text fz="xs" fw={500} c="brand.1">
        {label}
      </Text>
      {children}
    </Box>
  );
}

function LoadingState() {
  return (
    <Stack gap="md">
      <Paper withBorder radius="lg" p="lg">
        <Skeleton h={22} w={160} />
        <Skeleton h={32} w={260} mt="sm" />
        <SimpleGrid cols={{ base: 2, md: 5 }} mt="lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} h={48} />
          ))}
        </SimpleGrid>
      </Paper>
      <Paper withBorder radius="lg" p="lg">
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} h={120} />
          ))}
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}

export function MySubscription() {
  const theme = useMantineTheme();
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMySubscription();
      if (mounted.current) setData(res);
    } catch (err: unknown) {
      if (mounted.current) setError(getErrorMessage(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const d = data?.details;

  const products = useMemo(() => {
    if (!d) return [];
    const codes = (d.products ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const modules = d.modules ?? [];

    return codes.map((code) => {
      const enabled = modules.filter((m) => m.product === code && m.is_enabled);
      return {
        code,
        subFeatures: enabled.map((m) => m.module_name),
      };
    });
  }, [d]);

  const handleCopyId = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.name);
      notifications.show({ message: "Subscription ID copied", color: "success" });
    } catch {
      notifications.show({
        message: "Could not copy. Please copy it manually.",
        color: "danger",
      });
    }
  };

  const renewalDate = d?.end_date ?? null;
  const daysToRenewal = renewalDate ? daysFromToday(renewalDate) : null;
  const subscriptionStatus = data?.subscription_status?.trim() || null;

  return (
    <Stack gap="lg" p="md">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" radius="md" size="lg">
          <IconCreditCard size={18} />
        </ThemeIcon>
        <Box>
          <Title order={3}>My Subscription</Title>
          <Text fz="sm" c="slate.5">
            View your current plan, billing details and activated products.
          </Text>
        </Box>
      </Group>

      {loading && <LoadingState />}

      {!loading && error && (
        <Paper withBorder radius="lg" p="xl">
          <Stack align="center" gap="sm">
            <Text fz="sm" c="slate.7">
              {error}
            </Text>
            <Button variant="default" onClick={load}>
              Retry
            </Button>
          </Stack>
        </Paper>
      )}

      {!loading && !error && !data && (
        <Paper withBorder radius="lg" p="xl">
          <Text ta="center" fz="sm" c="slate.5">
            No subscription found.
          </Text>
        </Paper>
      )}

      {!loading && !error && data && d && (
        <Paper withBorder radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
          {/* ── Brand header ── */}
          <Box p="lg" c="white" style={{ background: theme.other.brandGradient }}>
            <Group justify="space-between" align="flex-start" gap="xs">
              <Box>
                <Group gap="xs">
                  <Badge
                    variant="filled"
                    leftSection={<IconAward size={12} />}
                    bg={theme.other.headerIconOverlayBg}
                    c="white"
                  >
                    Current Plan
                  </Badge>
                  {subscriptionStatus && (
                    <Badge variant="white" color="brand">
                      {subscriptionStatus}
                    </Badge>
                  )}
                </Group>
                <Title order={2} mt="xs" c="white">
                  {d.plan_name}
                </Title>
              </Box>
              <Box ta="right">
                <Text span fz={28} fw={700} c="white">
                  {formatMoney(d.plan_price, d.currency)}
                </Text>
                <Text span fz="sm" ml={4} c="brand.1">
                  / {d.billing_frequency}
                </Text>
              </Box>
            </Group>

            <Divider mt="lg" color="brand.4" />

            <SimpleGrid cols={{ base: 2, md: 3, lg: 5 }} mt="md">
              <HeaderField label="Subscription ID">
                <Group gap={6} mt={4} wrap="nowrap">
                  <Text
                    truncate
                    ff="monospace"
                    fz="xs"
                    c="white"
                    px={8}
                    py={4}
                    bg={theme.other.headerIconOverlayBg}
                    bd="1px solid var(--mantine-color-brand-4)"
                    style={{ borderRadius: "var(--mantine-radius-sm)" }}
                  >
                    {data.name}
                  </Text>
                  <Tooltip label="Copy subscription ID">
                    <ActionIcon
                      variant="subtle"
                      color="white"
                      size="sm"
                      aria-label="Copy subscription ID"
                      onClick={handleCopyId}
                    >
                      <IconCopy size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </HeaderField>

              <HeaderField label="Start Date">
                <Text fz="sm" fw={600} mt={6} c="white">
                  {formatDate(d.start_date)}
                </Text>
              </HeaderField>

              <HeaderField label="Next Renewal">
                <Text fz="sm" fw={600} mt={6} c="white">
                  {formatDate(renewalDate)}
                </Text>
                {daysToRenewal !== null && (
                  <Group gap={4} mt={2}>
                    <IconClock size={12} color="var(--mantine-color-brand-1)" />
                    <Text fz="xs" c="brand.1">
                      {describeDays(daysToRenewal)}
                    </Text>
                  </Group>
                )}
              </HeaderField>

              {d.trial_enabled ? (
                <HeaderField label="Free Trial">
                  <Text fz="sm" fw={600} mt={6} c="white">
                    {d.trial_days} days
                  </Text>
                </HeaderField>
              ) : null}

              <HeaderField label="Setup Fee">
                <Text fz="sm" fw={600} mt={6} c="white">
                  {formatMoney(d.setup_fee, d.currency)}
                </Text>
              </HeaderField>
            </SimpleGrid>
          </Box>

          {/* ── Products ── */}
          <Box p="lg">
            <Title order={4}>Products</Title>
            <Text fz="sm" c="slate.5">
              Detailed view of products activated under your account, and sub-modules.
            </Text>

            {products.length === 0 ? (
              <Text fz="sm" c="slate.5" mt="md">
                No products activated.
              </Text>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} mt="md">
                {products.map((product) => (
                  <Paper key={product.code} withBorder radius="md" p="md" bg="slate.0">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon variant="light" radius="md" size="lg">
                        <IconLayersLinked size={18} />
                      </ThemeIcon>
                      <Text fz="sm" fw={600} c="slate.8">
                        {product.code}
                      </Text>
                    </Group>

                    {product.subFeatures.length > 0 ? (
                      <Box mt="sm">
                        <Text fz="micro" fw={600} tt="uppercase" lts="0.05em" c="slate.5">
                          Included Modules
                        </Text>
                        <Group gap={6} mt={6}>
                          {product.subFeatures.map((f) => (
                            <Badge key={f} variant="light" color="brand">
                              {f}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    ) : (
                      <Text fz="xs" c="slate.5" mt="sm">
                        No modules enabled.
                      </Text>
                    )}
                  </Paper>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </Paper>
      )}
    </Stack>
  );
}