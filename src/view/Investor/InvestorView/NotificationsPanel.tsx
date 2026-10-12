/* Notifications: every email sent to the investor, by type (Contracts / Investments / Payment Statements),
   with the PDF that was attached (view or download). */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Stack,
  Table,
  Tabs,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconDownload,
  IconEye,
  IconFileCertificate,
  IconReceipt,
  IconReportMoney,
} from "@tabler/icons-react";
import { fetchPrivateFile } from "../../../api/Investor/investorFlowApi";
import type {
  InvestorNotification,
  NotificationType,
} from "../../../types/Investor/investorFlow";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { Card, CardTitle } from "./ui";
import { formatInvestorDate } from "../../../components/Modal/Investor/investorDate";

const TYPES: {
  type: NotificationType;
  label: string;
  icon: typeof IconReceipt;
  color: string;
}[] = [
  {
    type: "Contract",
    label: "Contracts",
    icon: IconFileCertificate,
    color: "brand",
  },
  {
    type: "Investment",
    label: "Investments",
    icon: IconReceipt,
    color: "info",
  },
  {
    type: "Payment Statement",
    label: "Payment Statements",
    icon: IconReportMoney,
    color: "success",
  },
];

const sentOn = (value: string) => {
  const time = new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatInvestorDate(value)} ${time}`;
};

export function NotificationsPanel({
  notifications,
}: {
  notifications: InvestorNotification[];
}) {
  const [tab, setTab] = useState<string | null>(TYPES[0].type);

  // The PDFs are private files: fetched with the logged-in session, then opened / saved.
  const fileMutation = useMutation({
    mutationFn: async ({
      n,
      download,
    }: {
      n: InvestorNotification;
      download: boolean;
    }) => {
      const blob = await fetchPrivateFile(n.file_url as string);
      const url = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = n.file_name || "statement.pdf";
        a.click();
      } else {
        window.open(url, "_blank", "noopener");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (error: any) =>
      openCommonModal({
        heading: "Could Not Open File",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  return (
    <Card>
      <CardTitle
        title="Notifications"
        subtitle="Contracts and statements emailed to the investor, with the PDF that was sent"
      />
      <Tabs value={tab} onChange={setTab} color="brand">
        <Tabs.List mb="md">
          {TYPES.map((t) => {
            const count = notifications.filter(
              (n) => n.notification_type === t.type,
            ).length;
            return (
              <Tabs.Tab
                key={t.type}
                value={t.type}
                leftSection={<t.icon size={14} />}
                rightSection={
                  <Badge size="xs" variant="light" color={t.color} radius="xl">
                    {count}
                  </Badge>
                }
              >
                {t.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {TYPES.map((t) => {
          const rows = notifications.filter(
            (n) => n.notification_type === t.type,
          );
          return (
            <Tabs.Panel key={t.type} value={t.type}>
              {rows.length === 0 ? (
                <Text fz="xs" c="dimmed" ta="center" py="lg">
                  No {t.label.toLowerCase()} have been sent yet.
                </Text>
              ) : (
                <Table.ScrollContainer minWidth={760}>
                  <Table
                    verticalSpacing="sm"
                    horizontalSpacing="sm"
                    fz="xs"
                    highlightOnHover
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Sent on</Table.Th>
                        <Table.Th>Investment</Table.Th>
                        <Table.Th>Sent to</Table.Th>
                        <Table.Th>Subject &amp; message</Table.Th>
                        <Table.Th ta="right">PDF</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {rows.map((n) => (
                        <Table.Tr key={n.name}>
                          <Table.Td style={{ whiteSpace: "nowrap" }}>
                            {sentOn(n.sent_on)}
                          </Table.Td>
                          <Table.Td fw={600}>{n.investment}</Table.Td>
                          <Table.Td>{n.sent_to}</Table.Td>
                          <Table.Td maw={380}>
                            <Stack gap={2}>
                              <Text fz="xs" fw={700} c="slate.8" truncate>
                                {n.subject}
                              </Text>
                              {n.message && (
                                <Text
                                  fz={11}
                                  c="slate.5"
                                  lineClamp={2}
                                  style={{ whiteSpace: "pre-line" }}
                                >
                                  {n.message}
                                </Text>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            {n.file_url ? (
                              <Group gap={4} justify="flex-end" wrap="nowrap">
                                <Tooltip label="View PDF" withArrow>
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color="brand"
                                    radius="md"
                                    loading={
                                      fileMutation.isPending &&
                                      fileMutation.variables?.n.name ===
                                        n.name &&
                                      !fileMutation.variables?.download
                                    }
                                    onClick={() =>
                                      fileMutation.mutate({
                                        n,
                                        download: false,
                                      })
                                    }
                                  >
                                    <IconEye size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Download PDF" withArrow>
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color="slate"
                                    radius="md"
                                    loading={
                                      fileMutation.isPending &&
                                      fileMutation.variables?.n.name ===
                                        n.name &&
                                      !!fileMutation.variables?.download
                                    }
                                    onClick={() =>
                                      fileMutation.mutate({ n, download: true })
                                    }
                                  >
                                    <IconDownload size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            ) : (
                              <Box ta="right">
                                <Text fz={11} c="dimmed">
                                  No file
                                </Text>
                              </Box>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Card>
  );
}
