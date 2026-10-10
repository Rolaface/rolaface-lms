/*
 * Email a statement to the investor after a fund is approved (Fund Receipt) or a payout is made (Payment Statement).
 * To / Subject / Message are pre-filled and editable; the PDF can be previewed. Send uploads the PDF, emails it
 * (communication.email.make, referencing the investment) and logs it in Custom Investor Notification.
 */
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import { IconEye, IconMail, IconSend, IconX } from "@tabler/icons-react";
import type { jsPDF } from "jspdf";
import {
  getInvestmentDetail,
  logInvestorNotification,
  sendEmail,
} from "../../../../api/Investor/investorFlowApi";
import { uploadFile } from "../../../../api/loanApi";
import type {
  InvestmentDetail,
  NotificationType,
} from "../../../../types/Investor/investorFlow";
import { useCompanyStore } from "../../../../store/companyStore";
import { formatAmount } from "../../../../store/currencyStore";
import { parseFrappeError } from "../../../../utils/parseFrappeError";
import { openCommonModal } from "../../AlertModal";
import { usePdfPreview } from "../PdfPreviewModal";
import {
  buildFundReceiptPdf,
  buildPaymentStatementPdf,
  getPdfPalette,
} from "../Investmentpdf";
import { formatInvestorDate } from "../investorDate";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const messageToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

interface MailContent {
  title: string;
  notificationType: NotificationType;
  reference: string;
  to: string;
  subject: string;
  message: string;
  pdfName: string;
  buildPdf: () => jsPDF;
}

/* ------------------------------ Generic dialog ------------------------------ */

function StatementMailForm({
  investmentId,
  content,
  onClose,
}: {
  investmentId: string;
  content: MailContent;
  onClose: () => void;
}) {
  const pdfPreview = usePdfPreview();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(content.subject);
  const [message, setMessage] = useState(content.message);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const pdf = content.buildPdf().output("blob");
      const file = await uploadFile(
        new File([pdf], content.pdfName, { type: "application/pdf" }),
        1,
        content.pdfName,
      );
      await sendEmail({
        recipients: content.to,
        subject: subject.trim(),
        content: messageToHtml(message),
        send_me_a_copy: "0",
        doctype: "Custom Investor Flow",
        name: investmentId,
        attachmentNames: [file.name],
      });
      return logInvestorNotification({
        investment: investmentId,
        notification_type: content.notificationType,
        sent_to: content.to,
        subject: subject.trim(),
        message,
        file_id: file.name,
        reference: content.reference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investorNotifications"] });
      onClose();
      openCommonModal({
        heading: `${content.notificationType === "Investment" ? "Fund Receipt" : content.notificationType} Sent`,
        subtitle: "",
        body: `The statement was emailed to ${content.to} and saved in the investor's notifications.`,
        color: "green",
        buttons: [{ label: "Close", color: "green" }],
      });
    },
    onError: (error: any) =>
      openCommonModal({
        heading: "Send Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      }),
  });

  const canSend = !!content.to && !!subject.trim() && !!message.trim();

  return (
    <>
      <Stack gap="sm">
        <TextInput
          label="To"
          size="sm"
          radius="md"
          readOnly
          leftSection={<IconMail size={14} />}
          value={content.to}
          error={
            !content.to
              ? "This investor has no email; add it to the customer first."
              : undefined
          }
        />
        <TextInput
          label="Subject"
          size="sm"
          radius="md"
          required
          value={subject}
          onChange={(e) => setSubject(e.currentTarget.value)}
        />
        <Textarea
          label="Message"
          size="sm"
          radius="md"
          required
          autosize
          minRows={5}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />
        <Group justify="space-between" mt="xs">
          <Button
            variant="default"
            radius="xl"
            leftSection={<IconEye size={14} />}
            onClick={() =>
              pdfPreview.open(
                content.buildPdf(),
                content.title,
                content.pdfName,
              )
            }
          >
            Preview PDF
          </Button>
          <Group gap="sm">
            <Button
              variant="subtle"
              color="slate"
              radius="xl"
              disabled={sendMutation.isPending}
              onClick={onClose}
            >
              Skip
            </Button>
            <Button
              radius="xl"
              color="brand"
              leftSection={<IconSend size={14} />}
              disabled={!canSend}
              loading={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              Send
            </Button>
          </Group>
        </Group>
      </Stack>
      {pdfPreview.modal}
    </>
  );
}

function StatementMailShell({
  opened,
  onClose,
  title,
  subtitle,
  children,
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const theme = useMantineTheme();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size={620}
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <Group
        gap="sm"
        wrap="nowrap"
        px="lg"
        py="md"
        style={{ background: theme.other.brandGradient }}
      >
        <ThemeIcon size={34} radius="md" color="white" c="brand.6">
          <IconMail size={18} />
        </ThemeIcon>
        <Box style={{ minWidth: 0 }}>
          <Text fw={700} c="white">
            {title}
          </Text>
          <Text fz="xs" c="white" style={{ opacity: 0.85 }} truncate>
            {subtitle}
          </Text>
        </Box>
        <Button
          variant="subtle"
          color="white"
          size="xs"
          px={6}
          ml="auto"
          onClick={onClose}
          aria-label="Close"
        >
          <IconX size={18} />
        </Button>
      </Group>
      <Box p="lg">{children}</Box>
    </Modal>
  );
}

function useInvestment(investmentId: string, opened: boolean) {
  return useQuery({
    queryKey: ["investorInvestmentDetail", investmentId],
    queryFn: () => getInvestmentDetail(investmentId),
    enabled: opened,
    // The statement must show the figures after this approval / payout.
    staleTime: 0,
  });
}

function LoadingOrError({
  isError,
  error,
}: {
  isError: boolean;
  error: unknown;
}) {
  return isError ? (
    <Alert variant="light" color="red" radius="md">
      {parseFrappeError(error)}
    </Alert>
  ) : (
    <Group justify="center" py="lg">
      <Loader size="sm" color="brand" />
    </Group>
  );
}

/* ------------------------------ Fund receipt ------------------------------ */

export function FundReceiptMailDialog({
  investmentId,
  recordName,
  onClose,
}: {
  investmentId: string;
  /** Fund record (row) that was approved. */
  recordName: string;
  onClose: () => void;
}) {
  const theme = useMantineTheme();
  const companyName = useCompanyStore((s) => s.companyName);
  const currency = useCompanyStore((s) => s.baseCurrency);
  const query = useInvestment(investmentId, true);
  const detail: InvestmentDetail | undefined = query.data;
  const receipt = detail?.funds.find((f) => f.name === recordName);

  let body;
  if (!detail)
    body = <LoadingOrError isError={query.isError} error={query.error} />;
  else if (!receipt)
    body = <Alert color="red">This fund record was not found.</Alert>;
  else {
    const amount = formatAmount(currency, receipt.amount, { withSymbol: true });
    body = (
      <>
        <Group gap={6} mb="sm">
          <Badge
            variant="light"
            color="success"
            radius="sm"
            style={{ textTransform: "none" }}
          >
            Approved
          </Badge>
          <Text fz="xs" c="slate.6">
            {amount} received on {formatInvestorDate(receipt.paid_date)} ·{" "}
            {receipt.mode_of_payment}
          </Text>
        </Group>
        <StatementMailForm
          investmentId={investmentId}
          onClose={onClose}
          content={{
            title: `Fund Receipt - ${detail.name}`,
            notificationType: "Investment",
            reference: receipt.name,
            to: detail.investor_email || "",
            subject: `Fund Receipt - ${detail.name}`,
            message:
              `Dear ${detail.investor_name},\n\n` +
              `We have received ${amount} on ${formatInvestorDate(receipt.paid_date)} towards your investment ` +
              `${detail.name} (${detail.investment_product_name}). Your investment statement is attached.\n\n` +
              `Regards,\n${companyName || "The Company"}`,
            pdfName: `FundReceipt-${detail.name}-${receipt.paid_date}.pdf`,
            buildPdf: () =>
              buildFundReceiptPdf(
                detail,
                receipt,
                companyName,
                getPdfPalette(theme),
                currency,
              ),
          }}
        />
      </>
    );
  }

  return (
    <StatementMailShell
      opened
      onClose={onClose}
      title="Send Fund Receipt"
      subtitle="Email the investment statement for this fund to the investor"
    >
      {body}
    </StatementMailShell>
  );
}

/* ---------------------------- Payment statement ---------------------------- */

export function PaymentStatementMailDialog({
  investmentId,
  rowName,
  onClose,
}: {
  investmentId: string;
  /** Schedule row that was paid. */
  rowName: string;
  onClose: () => void;
}) {
  const theme = useMantineTheme();
  const companyName = useCompanyStore((s) => s.companyName);
  const currency = useCompanyStore((s) => s.baseCurrency);
  const query = useInvestment(investmentId, true);
  const detail: InvestmentDetail | undefined = query.data;
  const row = detail?.schedule.find((r) => r.name === rowName);

  let body;
  if (!detail)
    body = <LoadingOrError isError={query.isError} error={query.error} />;
  else if (!row)
    body = <Alert color="red">This schedule row was not found.</Alert>;
  else {
    const amount = formatAmount(currency, row.total, { withSymbol: true });
    const paidOn = formatInvestorDate(row.paid_on || row.payment_date);
    body = (
      <>
        <Group gap={6} mb="sm">
          <Badge
            variant="light"
            color="success"
            radius="sm"
            style={{ textTransform: "none" }}
          >
            Paid
          </Badge>
          <Text fz="xs" c="slate.6">
            Instalment {row.number} of {detail.payouts_total} · {amount} paid on{" "}
            {paidOn}
          </Text>
        </Group>
        <StatementMailForm
          investmentId={investmentId}
          onClose={onClose}
          content={{
            title: `Payment Statement - ${detail.name}`,
            notificationType: "Payment Statement",
            reference: row.name,
            to: detail.investor_email || "",
            subject: `Payment Statement - ${detail.name} - Instalment ${row.number}`,
            message:
              `Dear ${detail.investor_name},\n\n` +
              `We have paid ${amount} on ${paidOn} for instalment ${row.number} of ${detail.payouts_total} of your ` +
              `investment ${detail.name} (${detail.investment_product_name}). Your payment statement is attached.\n\n` +
              `Regards,\n${companyName || "The Company"}`,
            pdfName: `PaymentStatement-${detail.name}-${row.number}.pdf`,
            buildPdf: () =>
              buildPaymentStatementPdf(
                detail,
                row,
                companyName,
                getPdfPalette(theme),
                currency,
              ),
          }}
        />
      </>
    );
  }

  return (
    <StatementMailShell
      opened
      onClose={onClose}
      title="Send Payment Statement"
      subtitle="Email the statement for this payout to the investor"
    >
      {body}
    </StatementMailShell>
  );
}
