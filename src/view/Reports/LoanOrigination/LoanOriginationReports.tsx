import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  ActionIcon,
  Pagination,
} from "@mantine/core";
import {
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconFileSpreadsheet,
  IconFilter,
  IconRefresh,
  IconTrendingUp,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";

const cv = (name: string, shade: number) =>
  `var(--mantine-color-${name}-${shade})`;

type ApplicationStatus =
  | "Approved"
  | "Disbursed"
  | "Pending"
  | "Rejected";

type ApplicationRow = {
  loanAccount: string;
  customerName: string;
  branch: string;
  daysPastDue: number;
  product: string;
  requestedAmount: number;
  approvedAmount: number;
  status: ApplicationStatus;
  cancelled?: boolean;
};

const APPLICATIONS: ApplicationRow[] = [
  {
    loanAccount: "ACC-LOAN-2026-00167",
    customerName: "Sneha Iyer",
    branch: "Lusaka Main",
    daysPastDue: 1560,
    product: "RFPL",
    requestedAmount: 161700.3,
    approvedAmount: 19222.03,
    status: "Disbursed",
  },
  {
    loanAccount: "ACC-LOAN-2026-00169",
    customerName: "Rahul Verma",
    branch: "Ndola Central",
    daysPastDue: 1315,
    product: "SME01",
    requestedAmount: 23233.62,
    approvedAmount: 23233.62,
    status: "Approved",
  },
  {
    loanAccount: "ACC-LOAN-2026-00156",
    customerName: "MD Enterprise Ltd",
    branch: "Kitwe North",
    daysPastDue: 584,
    product: "ESDE",
    requestedAmount: 194826,
    approvedAmount: 194826,
    status: "Pending",
  },
  {
    loanAccount: "ACC-LOAN-2026-00007",
    customerName: "Abhishek Nair",
    branch: "Kabwe West",
    daysPastDue: 382,
    product: "RFPL",
    requestedAmount: 25271.49,
    approvedAmount: 47209.26,
    status: "Disbursed",
  },
  {
    loanAccount: "ACC-LOAN-2026-00053",
    customerName: "Jaspreet Bumrah",
    branch: "Lusaka East",
    daysPastDue: 259,
    product: "TEST",
    requestedAmount: 570555.37,
    approvedAmount: 933615.01,
    status: "Rejected",
  },
];

const STATUS_DATA = [
  { name: "Approved", value: 824 },
  { name: "Pending Review", value: 287 },
  { name: "Rejected / Cancelled", value: 137 },
];

const TREND_DATA = [
  { month: "Sep 22", value: 420000 },
  { month: "Jan 23", value: 510000 },
  { month: "Mar 23", value: 610000 },
  { month: "May 23", value: 690000 },
  { month: "Jul 23", value: 760000 },
  { month: "Sep 23", value: 820000 },
  { month: "Nov 23", value: 870000 },
  { month: "Jan 24", value: 910000 },
  { month: "Mar 24", value: 950000 },
  { month: "May 24", value: 1040000 },
  { month: "Jul 24", value: 1160000 },
  { month: "Aug 26", value: 2300000 },
  { month: "Sep 26", value: 18420000 },
];

const PRODUCT_DATA = [
  {
    product: "RFPL (Retail Personal)",
    amount: 9.8,
    percentage: 53,
  },
  {
    product: "SME01 (Small Business)",
    amount: 4.2,
    percentage: 23,
  },
  {
    product: "ESDE (Education Scheme)",
    amount: 2.8,
    percentage: 15,
  },
  {
    product: "TEST (Pilot Scheme)",
    amount: 1.6,
    percentage: 9,
  },
];

const formatAmount = (value: number) => {
  if (value >= 1_000_000) {
    return `ZMW ${(value / 1_000_000).toFixed(2)}M`;
  }

  return `ZMW ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCompactAmount = (value: number) => {
  if (value >= 1_000_000) {
    return `ZMW ${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `ZMW ${(value / 1_000).toFixed(1)}K`;
  }

  return formatAmount(value);
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = {
    Approved: {
      color: "indigo",
      icon: <IconCircleCheck size={11} />,
    },
    Disbursed: {
      color: "teal",
      icon: <IconCircleCheck size={11} />,
    },
    Pending: {
      color: "yellow",
      icon: <IconClock size={11} />,
    },
    Rejected: {
      color: "red",
      icon: <IconCircleX size={11} />,
    },
  }[status];

  return (
    <Badge
      size="xs"
      variant="light"
      color={config.color}
      leftSection={config.icon}
      radius="sm"
    >
      {status}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  color = "brand",
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      className="bg-white"
      style={{
        borderColor: "var(--mantine-color-gray-2)",
        minHeight: 78,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="10px" c="dimmed" fw={500}>
            {label}
          </Text>

          <Text
            fw={700}
            size="17px"
            mt={5}
            className="text-slate-900"
            style={{ lineHeight: 1.1 }}
          >
            {value}
          </Text>

          <Text size="8.5px" c="dimmed" mt={4}>
            {helper}
          </Text>
        </div>

        <Box
          className={`bg-${color}-0`}
          style={{
            width: 27,
            height: 27,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: cv(color, 6),
            background: `var(--mantine-color-${color}-0)`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Group>
    </Paper>
  );
}

export function LoanOriginationReports() {
  const [asOnDate, setAsOnDate] = useState("2026-09-16");
  const [branch, setBranch] = useState<string | null>(null);
  const [loanProduct, setLoanProduct] = useState<string | null>(null);
  const [customer, setCustomer] = useState<string | null>(null);
  const [loanAccount, setLoanAccount] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] =
    useState<string | null>("All Statuses");
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const [trendPeriod, setTrendPeriod] = useState("Monthly");
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);

  const pageSize = 5;

  const filteredApplications = useMemo(() => {
    return APPLICATIONS.filter((application) => {
      if (!includeCancelled && application.cancelled) {
        return false;
      }

      if (
        branch &&
        branch !== "All Branches" &&
        application.branch !== branch
      ) {
        return false;
      }

      if (
        loanProduct &&
        loanProduct !== "All Products" &&
        application.product !== loanProduct
      ) {
        return false;
      }

      if (
        customer &&
        customer !== "All Customers" &&
        application.customerName !== customer
      ) {
        return false;
      }

      if (
        loanAccount &&
        loanAccount !== "All Accounts" &&
        application.loanAccount !== loanAccount
      ) {
        return false;
      }

      if (
        applicationStatus &&
        applicationStatus !== "All Statuses" &&
        application.status !== applicationStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    branch,
    loanProduct,
    customer,
    loanAccount,
    applicationStatus,
    includeCancelled,
  ]);

  const paginatedApplications = filteredApplications.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const clearFilters = () => {
    setAsOnDate("2026-09-16");
    setBranch(null);
    setLoanProduct(null);
    setCustomer(null);
    setLoanAccount(null);
    setApplicationStatus("All Statuses");
    setIncludeCancelled(false);
    setPage(1);
  };

  const generateReport = () => {
    setGenerating(true);
    setPage(1);

    window.setTimeout(() => {
      setGenerating(false);
    }, 700);
  };

  const exportExcel = () => {
    const exportRows = filteredApplications.map((row) => ({
      "Loan Account": row.loanAccount,
      "Customer Name": row.customerName,
      Branch: row.branch,
      "Days Past Due": row.daysPastDue,
      Product: row.product,
      "Requested Amount": row.requestedAmount,
      "Approved Amount": row.approvedAmount,
      Status: row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Origination");

    XLSX.writeFile(
      workbook,
      `loan-origination-report-${asOnDate}.xlsx`
    );
  };

  return (
    <Box className="bg-[#F7F8FB] text-slate-800 min-h-full">
      <Box component="main" className="p-4 flex flex-col gap-3">
        {/* PAGE HEADER */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3} className="text-slate-900">
              Loan Origination Reports
            </Title>

            <Group gap={6} mt={4}>
              <Text size="12px" c="dimmed">
                Home
              </Text>

              <Text size="12px" c="dimmed">
                ›
              </Text>

              <Text size="12px" c="dimmed">
                Origination
              </Text>

              <Text size="12px" c="dimmed">
                ›
              </Text>

              <Text size="12px" c="dimmed">
                Reports
              </Text>

              <Text size="12px" c="dimmed">
                ›
              </Text>

              <Text size="12px" c="dimmed" fw={500}>
                Loan Origination Report
              </Text>
            </Group>
          </div>

          <Group gap={8}>
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconFileSpreadsheet size={15} />}
              onClick={exportExcel}
              styles={{
                root: {
                  borderColor: "var(--mantine-color-gray-3)",
                },
                section: {
                  color: cv("brand", 6),
                },
              }}
            >
              Export Excel
            </Button>

            <Button
              size="sm"
              radius="md"
              color="brand"
              loading={generating}
              leftSection={<IconRefresh size={15} />}
              onClick={generateReport}
            >
              Generate Report
            </Button>
          </Group>
        </Group>

        {/* FILTERS */}
        <Paper
          withBorder
          radius="md"
          p="sm"
          className="bg-white"
          style={{
            borderColor: "var(--mantine-color-gray-2)",
          }}
        >
          <Group gap={6} mb={8}>
            <IconFilter
              size={13}
              style={{ color: cv("brand", 6) }}
            />

            <Text size="10px" fw={700} tt="uppercase">
              Filters
            </Text>
          </Group>

          <div className="grid grid-cols-5 gap-2">
            <TextInput
              label="As On Date"
              type="date"
              value={asOnDate}
              onChange={(event) =>
                setAsOnDate(event.currentTarget.value)
              }
              size="xs"
              leftSection={<IconCalendar size={13} />}
            />

            <Select
              label="Branch"
              placeholder="Select branch"
              value={branch}
              onChange={setBranch}
              clearable
              size="xs"
              data={[
                "Lusaka Main",
                "Ndola Central",
                "Kitwe North",
                "Kabwe West",
                "Lusaka East",
              ]}
            />

            <Select
              label="Loan Product"
              placeholder="Select product"
              value={loanProduct}
              onChange={setLoanProduct}
              clearable
              size="xs"
              data={["RFPL", "SME01", "ESDE", "TEST"]}
            />

            <Select
              label="Customer"
              placeholder="Select Customer"
              value={customer}
              onChange={setCustomer}
              clearable
              searchable
              size="xs"
              data={[
                "Sneha Iyer",
                "Rahul Verma",
                "MD Enterprise Ltd",
                "Abhishek Nair",
                "Jaspreet Bumrah",
              ]}
            />

            <Select
              label="Loan Account"
              placeholder="Select account"
              value={loanAccount}
              onChange={setLoanAccount}
              clearable
              searchable
              size="xs"
              data={APPLICATIONS.map(
                (application) => application.loanAccount
              )}
            />
          </div>

          <Group justify="space-between" align="flex-end" mt={9}>
            <Select
              label="Application Status"
              value={applicationStatus}
              onChange={(value) => {
                setApplicationStatus(value);
                setPage(1);
              }}
              size="xs"
              style={{ width: 180 }}
              data={[
                "All Statuses",
                "Approved",
                "Disbursed",
                "Pending",
                "Rejected",
              ]}
            />

            <Group gap={12}>
              <Switch
                size="xs"
                label="Include Cancelled"
                checked={includeCancelled}
                onChange={(event) =>
                  setIncludeCancelled(event.currentTarget.checked)
                }
              />

              <Button
                variant="subtle"
                size="xs"
                color="gray"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* SUMMARY */}
        <div className="grid grid-cols-5 gap-2">
          <SummaryCard
            label="Total Applications"
            value="1,248"
            helper="Applications received"
            icon={<IconUsers size={15} />}
          />

          <SummaryCard
            label="Approved"
            value="824"
            helper="66% of applications"
            icon={<IconCircleCheck size={15} />}
            color="teal"
          />

          <SummaryCard
            label="Disbursed"
            value="ZMW 18.42M"
            helper="Total disbursed amount"
            icon={<IconWallet size={15} />}
            color="indigo"
          />

          <SummaryCard
            label="Pending"
            value="287"
            helper="23% of applications"
            icon={<IconClock size={15} />}
            color="yellow"
          />

          <SummaryCard
            label="Rejected"
            value="137"
            helper="11% of applications"
            icon={<IconCircleX size={15} />}
            color="red"
          />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-2">
          {/* STATUS DISTRIBUTION */}
          <Paper
            withBorder
            radius="md"
            p="sm"
            className="bg-white"
            style={{
              borderColor: "var(--mantine-color-gray-2)",
              height: 235,
            }}
          >
            <Text size="10px" fw={700}>
              Application Status Distribution
            </Text>

            <div className="flex items-center h-47.5">
              <div style={{ width: "58%", height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={STATUS_DATA}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={66}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      <Cell fill={cv("brand", 6)} />
                      <Cell fill={cv("cyan", 5)} />
                      <Cell fill={cv("red", 4)} />
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        Number(value).toLocaleString()
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div
                  className="relative"
                  style={{
                    marginTop: -122,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Text fw={700} size="17px">
                    1,248
                  </Text>
                  <Text size="8px" c="dimmed">
                    Total Apps
                  </Text>
                </div>
              </div>

              <Stack gap={7} style={{ width: "42%" }}>
                {STATUS_DATA.map((item, index) => (
                  <Group
                    key={item.name}
                    justify="space-between"
                    gap={5}
                  >
                    <Group gap={5} wrap="nowrap">
                      <Box
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 50,
                          background:
                            index === 0
                              ? cv("brand", 6)
                              : index === 1
                                ? cv("cyan", 5)
                                : cv("red", 4),
                        }}
                      />

                      <Text size="8px">
                        {item.name}
                      </Text>
                    </Group>

                    <Text size="8px" fw={600}>
                      {item.value}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </div>
          </Paper>

          {/* TREND */}
          <Paper
            withBorder
            radius="md"
            p="sm"
            className="bg-white"
            style={{
              borderColor: "var(--mantine-color-gray-2)",
              height: 235,
            }}
          >
            <Group justify="space-between" mb={4}>
              <Text size="10px" fw={700}>
                Loan Origination Trend
              </Text>

              <Select
                size="xs"
                value={trendPeriod}
                onChange={(value) =>
                  setTrendPeriod(value || "Monthly")
                }
                data={["Monthly", "Quarterly", "Yearly"]}
                rightSection={<IconChevronDown size={12} />}
                style={{ width: 85 }}
                allowDeselect={false}
              />
            </Group>

            <Box style={{ height: 185 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={TREND_DATA}
                  margin={{
                    top: 8,
                    right: 4,
                    left: -25,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="originationFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={cv("brand", 5)}
                        stopOpacity={0.24}
                      />

                      <stop
                        offset="100%"
                        stopColor={cv("brand", 5)}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 7,
                      fill: "#94a3b8",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 7,
                      fill: "#94a3b8",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `${Math.round(value / 1_000_000)}M`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCompactAmount(Number(value))
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={cv("brand", 6)}
                    strokeWidth={2}
                    fill="url(#originationFill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* PRODUCT */}
          <Paper
            withBorder
            radius="md"
            p="sm"
            className="bg-white"
            style={{
              borderColor: "var(--mantine-color-gray-2)",
              height: 235,
            }}
          >
            <Text size="10px" fw={700} mb={8}>
              Origination by Loan Product
            </Text>

            <Stack gap={11}>
              {PRODUCT_DATA.map((item) => (
                <div key={item.product}>
                  <Group justify="space-between" mb={4}>
                    <Text
                      size="8px"
                      fw={600}
                      style={{
                        maxWidth: 170,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.product}
                    </Text>

                    <Text size="8px" fw={600}>
                      ZMW {item.amount.toFixed(1)}M
                    </Text>
                  </Group>

                  <Box
                    style={{
                      height: 7,
                      background:
                        "var(--mantine-color-gray-1)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      style={{
                        width: `${item.percentage}%`,
                        height: "100%",
                        borderRadius: 10,
                        background: cv("brand", 6),
                      }}
                    />
                  </Box>
                </div>
              ))}
            </Stack>

            <Text size="7px" c="dimmed" mt={10}>
              Total origination amount: ZMW 18.4M
            </Text>
          </Paper>
        </div>

        {/* TABLE + INSIGHTS */}
        <div className="grid grid-cols-[2.2fr_1fr] gap-2 items-start">
          {/* TABLE */}
          <Paper
            withBorder
            radius="md"
            className="bg-white overflow-hidden"
            style={{
              borderColor: "var(--mantine-color-gray-2)",
            }}
          >
            <Group
              justify="space-between"
              px="sm"
              py="xs"
              style={{
                borderBottom:
                  "1px solid var(--mantine-color-gray-2)",
              }}
            >
              <div>
                <Text size="10px" fw={700}>
                  Loan Origination Accounts
                </Text>

                <Text size="7.5px" c="dimmed" mt={2}>
                  {filteredApplications.length} filtered accounts
                </Text>
              </div>

              <Text size="7.5px" c="dimmed">
                Updated just now
              </Text>
            </Group>

            <Box style={{ overflowX: "auto" }}>
              <Table
                verticalSpacing={7}
                horizontalSpacing={8}
                highlightOnHover
                style={{ minWidth: 850 }}
              >
                <Table.Thead>
                  <Table.Tr>
                    {[
                      "LOAN ACCOUNT",
                      "CUSTOMER NAME",
                      "BRANCH",
                      "DAYS PAST DUE",
                      "PRODUCT",
                      "REQUESTED AMT",
                      "APPROVED AMT",
                      "STATUS",
                    ].map((heading) => (
                      <Table.Th
                        key={heading}
                        style={{
                          fontSize: 7,
                          color:
                            "var(--mantine-color-gray-6)",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {paginatedApplications.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={8}>
                        <Text
                          ta="center"
                          size="sm"
                          c="dimmed"
                          py="xl"
                        >
                          No applications match the selected
                          filters.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paginatedApplications.map((row) => (
                      <Table.Tr key={row.loanAccount}>
                        <Table.Td>
                          <Text
                            size="7.5px"
                            fw={600}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {row.loanAccount}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="7.5px">
                            {row.customerName}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="7.5px">
                            {row.branch}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="7.5px">
                            {row.daysPastDue}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            size="xs"
                            variant="light"
                            color="gray"
                            radius="sm"
                          >
                            {row.product}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="7.5px"
                            ta="right"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {formatAmount(row.requestedAmount)}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text
                            size="7.5px"
                            fw={600}
                            ta="right"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {formatAmount(row.approvedAmount)}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <StatusBadge status={row.status} />
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Box>

            <Group
              justify="space-between"
              px="sm"
              py="xs"
              style={{
                borderTop:
                  "1px solid var(--mantine-color-gray-2)",
              }}
            >
              <Text size="7.5px" c="dimmed">
                Showing {filteredApplications.length === 0 ? 0 : (page - 1) * pageSize + 1}
                {" "}to{" "}
                {Math.min(
                  page * pageSize,
                  filteredApplications.length
                )}{" "}
                of 1,248 entries
              </Text>

              <Group gap={5}>
                <ActionIcon
                  size="sm"
                  variant="default"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                >
                  <IconChevronLeft size={12} />
                </ActionIcon>

                <Pagination
                  size="xs"
                  total={Math.max(
                    1,
                    Math.ceil(filteredApplications.length / pageSize)
                  )}
                  value={page}
                  onChange={setPage}
                  siblings={1}
                  boundaries={1}
                />

                <ActionIcon
                  size="sm"
                  variant="default"
                  disabled={
                    page >=
                    Math.ceil(
                      filteredApplications.length / pageSize
                    )
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        Math.max(
                          1,
                          Math.ceil(
                            filteredApplications.length /
                              pageSize
                          )
                        ),
                        current + 1
                      )
                    )
                  }
                >
                  <IconChevronRight size={12} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>

          {/* INSIGHTS */}
          <Paper
            withBorder
            radius="md"
            p="sm"
            className="bg-white"
            style={{
              borderColor: "var(--mantine-color-gray-2)",
            }}
          >
            <Group justify="space-between" mb={9}>
              <Text size="10px" fw={700}>
                Key Insights
              </Text>

              <Box
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 50,
                  background: cv("teal", 5),
                }}
              />
            </Group>

            <Stack gap={7}>
              <Insight
                icon={<IconTrendingUp size={13} />}
                color="brand"
                title="Highest Origination Product"
                value="RFPL — ZMW 9.8M (53%)"
              />

              <Insight
                icon={<IconCircleCheck size={13} />}
                color="teal"
                title="Approval Rate"
                value="66% — 4.2% vs last month"
              />

              <Insight
                icon={<IconUsers size={13} />}
                color="indigo"
                title="Origination Concentration"
                value="5 branches yield 78% of total loans"
              />

              <Insight
                icon={<IconWallet size={13} />}
                color="yellow"
                title="Average Ticket Size"
                value="ZMW 230,400 across portfolio"
              />
            </Stack>
          </Paper>
        </div>
      </Box>
    </Box>
  );
}

function Insight({
  icon,
  color,
  title,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  value: string;
}) {
  return (
    <Box
      p="xs"
      style={{
        border: "1px solid var(--mantine-color-gray-2)",
        borderRadius: 8,
      }}
    >
      <Group gap={8} align="flex-start" wrap="nowrap">
        <Box
          style={{
            width: 25,
            height: 25,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: cv(color, 6),
            background: `var(--mantine-color-${color}-0)`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <div>
          <Text size="8px" fw={700}>
            {title}
          </Text>

          <Text size="7.5px" c="dimmed" mt={3}>
            {value}
          </Text>
        </div>
      </Group>
    </Box>
  );
}

export default LoanOriginationReports;