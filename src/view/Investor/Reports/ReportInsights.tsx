/* Investor Report insights: upcoming maturities, overdue, scheduled vs actual payouts, paid out breakdown,
   top investors and top products (all over the filtered investments, as of today). */
import type { ReactNode } from "react";
import {
  Badge,
  Box,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconCalendarTime,
  IconInfoCircle,
  IconPackage,
  IconTrophy,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  InvestorReport,
  InvestorReportInsights,
  InvestorReportTopItem,
} from "../../../types/Investor/investorFlow";
import { formatInvestorDate } from "../../../components/Modal/Investor/investorDate";

const cv = (name: string, shade: number) =>
  `var(--mantine-color-${name}-${shade})`;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
};

/** Short amount for chart axes: 1.2K / 3.4M. */
const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : `${Math.round(n)}`;

function PanelCard({
  title,
  info,
  right,
  children,
}: {
  title: string;
  info?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      radius="lg"
      p="md"
      h="100%"
      style={{
        background: "var(--mantine-color-white)",
        border: "1px solid var(--mantine-color-slate-2)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          <Text fz={13.5} fw={700} c="slate.8">
            {title}
          </Text>
          {info && (
            <Tooltip label={info} withArrow multiline w={240}>
              <IconInfoCircle size={14} color={cv("slate", 4)} />
            </Tooltip>
          )}
        </Group>
        {right}
      </Group>
      <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Paper>
  );
}

function TopList({
  items,
  money,
  color,
  empty,
}: {
  items: InvestorReportTopItem[];
  money: (v: number) => string;
  color: string;
  empty: string;
}) {
  if (!items.length)
    return (
      <Text fz="xs" c="dimmed" ta="center" py="md">
        {empty}
      </Text>
    );
  const max = Math.max(...items.map((i) => i.invested), 1);
  return (
    <Stack gap={10}>
      {items.map((i, n) => (
        <Box key={i.id}>
          <Group justify="space-between" wrap="nowrap" gap="xs" mb={3}>
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <Text fz={11} fw={800} c="slate.4" w={14}>
                {n + 1}
              </Text>
              <Text fz="xs" fw={700} c="slate.8" truncate>
                {i.name}
              </Text>
              <Text fz={10.5} c="slate.5" style={{ whiteSpace: "nowrap" }}>
                · {i.investments} inv.
              </Text>
            </Group>
            <Text fz="xs" fw={700} c="slate.8" style={{ whiteSpace: "nowrap" }}>
              {money(i.invested)}
            </Text>
          </Group>
          <Tooltip
            withArrow
            label={`Invested ${money(i.invested)} · Paid out ${money(i.paid_out)}`}
          >
            <Progress
              value={(i.invested / max) * 100}
              size={6}
              radius="xl"
              color={color}
            />
          </Tooltip>
        </Box>
      ))}
    </Stack>
  );
}

export function ReportInsights({
  insights,
  totals,
  money,
}: {
  insights: InvestorReportInsights;
  /** Report totals (every filtered investment). */
  totals: InvestorReport["totals"];
  money: (v: number) => string;
}) {
  const { overdue, trend, upcoming_maturities: maturities } = insights;
  const paidOut =
    totals.principal_paid + totals.interest_paid + totals.penalty_paid;
  const breakdown = [
    { label: "Principal", value: totals.principal_paid, color: "brand" },
    { label: "Interest", value: totals.interest_paid, color: "grape" },
    { label: "Penalty", value: totals.penalty_paid, color: "warning" },
  ];
  const trendData = trend.map((t) => ({ ...t, label: monthLabel(t.month) }));

  return (
    <Grid gap="md">
      {/* Upcoming maturities (the 3 soonest) */}
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <PanelCard
          title="Upcoming Maturities"
          right={
            <ThemeIcon size={26} radius="md" variant="light" color="info">
              <IconCalendarDue size={15} />
            </ThemeIcon>
          }
        >
          {maturities.items.length === 0 ? (
            <Text fz="xs" c="dimmed" ta="center" py="md">
              No investment matures in the next {maturities.window_days} days.
            </Text>
          ) : (
            <Stack gap={6}>
              {maturities.items.slice(0, 3).map((m) => (
                <Group
                  key={m.investment_id}
                  justify="space-between"
                  wrap="nowrap"
                  px={10}
                  py={6}
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    border: `1px solid ${cv("slate", 2)}`,
                  }}
                >
                  <Box style={{ minWidth: 0 }}>
                    <Text fz="xs" fw={700} c="slate.8" truncate>
                      {m.investor}
                    </Text>
                    <Text fz={10.5} c="slate.5">
                      {m.investment_id} · {formatInvestorDate(m.end_date)}
                    </Text>
                  </Box>
                  <Stack gap={0} align="flex-end">
                    <Badge
                      size="xs"
                      variant="light"
                      color={m.days_left <= 30 ? "warning" : "info"}
                      radius="sm"
                      style={{ textTransform: "none" }}
                    >
                      {m.days_left}d left
                    </Badge>
                    <Text fz={10.5} c="slate.6" mt={2}>
                      {money(m.outstanding)} due
                    </Text>
                  </Stack>
                </Group>
              ))}
            </Stack>
          )}
        </PanelCard>
      </Grid.Col>

      {/* Overdue */}
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <PanelCard
          title="Overdue"
          info="Scheduled payouts whose date has passed and that are not fully paid."
          right={
            <ThemeIcon
              size={26}
              radius="md"
              variant="light"
              color={overdue.emis ? "danger" : "success"}
            >
              <IconAlertTriangle size={15} />
            </ThemeIcon>
          }
        >
          <Group grow gap="xs" mb="sm">
            {[
              {
                label: "Payouts",
                value: String(overdue.emis),
                color: "danger",
              },
              {
                label: "Investments",
                value: String(overdue.investments),
                color: "warning",
              },
              {
                label: "Oldest",
                value: `${overdue.oldest_days}d`,
                color: "slate",
              },
            ].map((k) => (
              <Box
                key={k.label}
                p={8}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  background: cv(k.color, 0),
                  border: `1px solid ${cv(k.color, 1)}`,
                }}
              >
                <Text fz={10} fw={700} c={`${k.color}.8`} tt="uppercase">
                  {k.label}
                </Text>
                <Text fz="md" fw={800} c="slate.9">
                  {k.value}
                </Text>
              </Box>
            ))}
          </Group>
          {overdue.top.length === 0 ? (
            <Text fz="xs" c="success.7" fw={600} ta="center" py="sm">
              Nothing is overdue.
            </Text>
          ) : (
            <Stack gap={6}>
              {overdue.top.map((o) => (
                <Group
                  key={o.investment_id}
                  justify="space-between"
                  wrap="nowrap"
                >
                  <Box style={{ minWidth: 0 }}>
                    <Text fz="xs" fw={700} c="slate.8" truncate>
                      {o.investor}
                    </Text>
                    <Text fz={10.5} c="slate.5">
                      {o.investment_id} · {o.emis} Payout · {o.days}d
                    </Text>
                  </Box>
                  <Text
                    fz="xs"
                    fw={700}
                    c="danger.7"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {money(o.amount)}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </PanelCard>
      </Grid.Col>

      {/* Scheduled vs actual payouts */}
      <Grid.Col span={{ base: 12, lg: 6 }}>
        <PanelCard
          title="Scheduled vs Actual Payouts"
          info="Per month: payouts due (scheduled) and approved payouts by value date (actual). Months still to come show what is scheduled."
          right={
            <Group gap={6}>
              <Badge size="xs" variant="dot" color="brand" radius="sm">
                Scheduled
              </Badge>
              <Badge size="xs" variant="dot" color="success" radius="sm">
                Actual
              </Badge>
            </Group>
          }
        >
          <Box h={200}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 8, right: 10, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="irScheduled" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={cv("brand", 6)}
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor={cv("brand", 6)}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="irActual" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={cv("success", 6)}
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor={cv("success", 6)}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke={cv("slate", 1)}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 10.5,
                    fill: cv("slate", 5),
                    fontWeight: 500,
                  }}
                  axisLine={{ stroke: cv("slate", 2) }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={compact}
                  tick={{ fontSize: 10, fill: cv("slate", 5), fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <RTooltip
                  formatter={(v, name) => [
                    money(Number(v) || 0),
                    name === "scheduled" ? "Scheduled" : "Actual",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${cv("slate", 2)}`,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scheduled"
                  stroke={cv("brand", 6)}
                  strokeWidth={2.2}
                  fill="url(#irScheduled)"
                  dot={{ r: 2.5, fill: cv("brand", 6) }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke={cv("success", 6)}
                  strokeWidth={2.2}
                  fill="url(#irActual)"
                  dot={{ r: 2.5, fill: cv("success", 6) }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </PanelCard>
      </Grid.Col>

      {/* Paid out breakdown: principal / interest / penalty */}
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <PanelCard
          title="Paid Out Breakdown"
          info="What has been paid out to investors, split into principal, interest and penalty."
          right={
            <Box ta="right">
              <Text
                fz="sm"
                fw={800}
                c="indigo.6"
                lh={1.2}
                style={{ whiteSpace: "nowrap" }}
              >
                {money(paidOut)}
              </Text>
              <Text fz={10} fw={500} c="dimmed">
                Total Paid Out
              </Text>
            </Box>
          }
        >
          {paidOut <= 0 ? (
            <Text fz="xs" c="dimmed" ta="center" py="md">
              Nothing has been paid out yet.
            </Text>
          ) : (
            <Group wrap="nowrap" gap="md" align="center">
              <RingProgress
                size={104}
                thickness={10}
                style={{ flexShrink: 0 }}
                sections={breakdown.map((b) => ({
                  value: (b.value / paidOut) * 100,
                  color: b.color,
                  tooltip: `${b.label} ${money(b.value)}`,
                }))}
              />

              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                {breakdown.map((b) => (
                  <Group
                    key={b.label}
                    justify="space-between"
                    wrap="nowrap"
                    gap="xs"
                  >
                    <Group gap={6} wrap="nowrap">
                      <Box
                        w={9}
                        h={9}
                        style={{ borderRadius: 3, background: cv(b.color, 6) }}
                      />
                      <Text fz="xs" c="slate.6">
                        {b.label}
                      </Text>
                    </Group>
                    <Box ta="right">
                      <Text
                        fz="xs"
                        fw={700}
                        c="slate.8"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {money(b.value)}
                      </Text>
                      <Text fz={10} c="slate.5">
                        {((b.value / paidOut) * 100).toFixed(1)}%
                      </Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Group>
          )}
        </PanelCard>
      </Grid.Col>

      {/* Upcoming EMIs (the 3 soonest unpaid EMIs from today) */}
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <PanelCard
          title="Upcoming Payouts"
          right={
            <ThemeIcon size={26} radius="md" variant="light" color="brand">
              <IconCalendarTime size={15} />
            </ThemeIcon>
          }
        >
          {insights.upcoming_emis.length === 0 ? (
            <Text fz="xs" c="dimmed" ta="center" py="md">
              No payout is due.
            </Text>
          ) : (
            <Stack gap={6}>
              {insights.upcoming_emis.slice(0, 3).map((e) => (
                <Group
                  key={`${e.investment_id}-${e.emi_number}`}
                  justify="space-between"
                  wrap="nowrap"
                  px={10}
                  py={6}
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    border: `1px solid ${cv("slate", 2)}`,
                  }}
                >
                  <Box style={{ minWidth: 0 }}>
                    <Text fz="xs" fw={700} c="slate.8" truncate>
                      {e.investor}
                    </Text>
                    <Text fz={10.5} c="slate.5">
                      {e.investment_id} · Payout #{e.emi_number} ·{" "}
                      {formatInvestorDate(e.payment_date)}
                    </Text>
                  </Box>
                  <Stack gap={0} align="flex-end">
                    <Badge
                      size="xs"
                      variant="light"
                      color={e.days_left <= 7 ? "warning" : "brand"}
                      radius="sm"
                      style={{ textTransform: "none" }}
                    >
                      {e.days_left === 0 ? "Today" : `${e.days_left}d left`}
                    </Badge>
                    <Text fz={10.5} fw={700} c="slate.7" mt={2}>
                      {money(e.amount)}
                    </Text>
                  </Stack>
                </Group>
              ))}
            </Stack>
          )}
        </PanelCard>
      </Grid.Col>

      {/* Top investors */}
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <PanelCard
          title="Top Investors"
          info="By amount invested."
          right={
            <ThemeIcon size={26} radius="md" variant="light" color="brand">
              <IconTrophy size={15} />
            </ThemeIcon>
          }
        >
          <TopList
            items={insights.top_investors.slice(0, 2)}
            money={money}
            color="brand"
            empty="No investors."
          />
        </PanelCard>
      </Grid.Col>

      {/* Top products */}
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <PanelCard
          title="Top Products"
          info="By amount invested."
          right={
            <ThemeIcon size={26} radius="md" variant="light" color="grape">
              <IconPackage size={15} />
            </ThemeIcon>
          }
        >
          <TopList
            items={insights.top_products.slice(0, 2)}
            money={money}
            color="grape"
            empty="No products."
          />
        </PanelCard>
      </Grid.Col>
    </Grid>
  );
}
