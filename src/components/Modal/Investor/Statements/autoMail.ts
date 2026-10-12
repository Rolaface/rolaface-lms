/*
 * The emails sent automatically on approval (fund receipt, payout, contract): their default subject / message
 * and the PDF, built and uploaded before the approval request (the server approves only when the email is sent).
 * The Compose Mail dialogs use the same texts.
 */
import type { MantineTheme } from "@mantine/core";
import type { jsPDF } from "jspdf";
import {
  getInvestmentDetail,
  getInvestorFlowSchedule,
  getPayoutContext,
  previewInvestorPayout,
  type ApprovalMail,
} from "../../../../api/Investor/investorFlowApi";
import { uploadFile } from "../../../../api/loanApi";
import type {
  InvestmentDetail,
  InvestmentFundEntry,
  InvestorPayout,
  PayoutAllocation,
  PayoutContext,
  PayoutScheduleRow,
} from "../../../../types/Investor/investorFlow";
import { formatAmount } from "../../../../store/currencyStore";
import {
  buildContractPdfFromState,
  buildFundReceiptPdf,
  buildPayoutStatementPdf,
  contractPdfName,
  getPdfPalette,
  type PayoutStatementPdfData,
} from "../Investmentpdf";
import {
  loadInvestorFlowState,
  scheduleFromApi,
  termsFromState,
  type ModalState,
} from "../InvestorModalShared";
import { formatInvestorDate } from "../investorDate";

export interface MailContext {
  theme: MantineTheme;
  currency: string;
  companyName: string;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The plain-text message as the HTML body of the email. */
export const messageToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

async function uploadPdf(doc: jsPDF, fileName: string) {
  const blob = doc.output("blob");
  const file = await uploadFile(
    new File([blob], fileName, { type: "application/pdf" }),
    1,
    fileName,
  );
  return file.name as string;
}

const regards = (company: string) => `Regards,\n${company || "The Company"}`;

/* ------------------------------ Texts ------------------------------ */

export function fundReceiptText(
  detail: InvestmentDetail,
  receipt: InvestmentFundEntry,
  mc: MailContext,
) {
  const amount = formatAmount(mc.currency, receipt.amount, {
    withSymbol: true,
  });
  return {
    subject: `Fund Receipt - ${detail.name}`,
    message:
      `Dear ${detail.investor_name},\n\n` +
      `We have received ${amount} on ${formatInvestorDate(receipt.paid_date)} towards your investment ` +
      `${detail.name} (${detail.investment_product_name}). Your investment statement is attached.\n\n` +
      regards(mc.companyName),
  };
}

export function payoutText(
  context: PayoutContext,
  payout: Pick<InvestorPayout, "payment_amount" | "value_date">,
  mc: MailContext,
) {
  const amount = formatAmount(mc.currency, Number(payout.payment_amount) || 0, {
    withSymbol: true,
  });
  return {
    subject: `Payment Statement - ${context.id} - ${formatInvestorDate(payout.value_date)}`,
    message:
      `Dear ${context.investor},\n\n` +
      `We have paid ${amount} on ${formatInvestorDate(payout.value_date)} towards your investment ` +
      `${context.id} (${context.investment_product_name}). Your payment statement is attached.\n\n` +
      regards(mc.companyName),
  };
}

export function contractText(
  state: ModalState,
  investorName: string,
  productName: string,
  mc: MailContext,
) {
  return {
    subject: `Investment Agreement - ${state.contractNo}`,
    message:
      `Dear ${investorName},\n\n` +
      `Please find attached your investment agreement ${state.contractNo} for ${productName}.\n\n` +
      regards(mc.companyName),
  };
}

/* ------------------------------ PDFs ------------------------------ */

/** Investment detail as it will be once this receipt is approved (for a statement made before approving). */
function withReceiptApproved(
  detail: InvestmentDetail,
  receipt: InvestmentFundEntry,
): InvestmentDetail {
  if (receipt.record_status === "Approved") return detail;
  const paidIn = detail.fund_paid_in + receipt.amount;
  return {
    ...detail,
    fund_paid_in: paidIn,
    fund_remaining: Math.max(detail.investment_amount - paidIn, 0),
    funds: detail.funds.map((f) =>
      f.name === receipt.name ? { ...f, record_status: "Approved" } : f,
    ),
  };
}

export function payoutPdfData(
  context: PayoutContext,
  payout: Pick<
    InvestorPayout,
    | "payment_type"
    | "payment_mode"
    | "reference_number"
    | "value_date"
    | "payment_amount"
  >,
  allocations: PayoutAllocation[],
  schedule: PayoutScheduleRow[],
): PayoutStatementPdfData {
  const sum = (k: "interest" | "penalty" | "principal") =>
    allocations.reduce((t, a) => t + a[k], 0);
  return {
    investmentId: context.id,
    productName: context.investment_product_name,
    investor: {
      id: context.investor_id,
      name: context.investor,
      email: context.investor_email,
    },
    valueDate: payout.value_date,
    paymentType: payout.payment_type,
    paymentMode: payout.payment_mode,
    reference: payout.reference_number,
    amount: Number(payout.payment_amount) || 0,
    principal: sum("principal"),
    interest: sum("interest"),
    penalty: sum("penalty"),
    allocations,
    schedule: schedule.map((r) => ({
      number: r.number,
      payment_date: r.payment_date,
      total: r.total,
      paid: r.paid,
      remaining: r.remaining,
      status: r.status,
    })),
  };
}

/** The schedule once the allocations are applied (for a statement made before approving). */
function scheduleAfter(
  schedule: PayoutScheduleRow[],
  allocations: PayoutAllocation[],
): PayoutScheduleRow[] {
  return schedule.map((r) => {
    const a = allocations.find((x) => x.row === r.name);
    if (!a) return r;
    const remaining = Math.max(
      Math.round((r.remaining - a.amount) * 100) / 100,
      0,
    );
    return {
      ...r,
      paid: r.paid + a.amount,
      remaining,
      status: remaining <= 0 ? "Paid" : "Partially Paid",
    };
  });
}

/* ------------------------- Prepared approval mails ------------------------- */

export async function prepareFundReceiptMail(
  investmentId: string,
  recordName: string,
  mc: MailContext,
): Promise<ApprovalMail> {
  const detail = await getInvestmentDetail(investmentId);
  const receipt = detail.funds.find((f) => f.name === recordName);
  if (!receipt) throw new Error("The fund record was not found.");
  const after = withReceiptApproved(detail, receipt);
  const text = fundReceiptText(after, receipt, mc);
  const fileId = await uploadPdf(
    buildFundReceiptPdf(
      after,
      { ...receipt, record_status: "Approved" },
      mc.companyName,
      getPdfPalette(mc.theme),
      mc.currency,
    ),
    `FundReceipt-${detail.name}-${receipt.paid_date}.pdf`,
  );
  return {
    ...text,
    message_html: messageToHtml(text.message),
    file_id: fileId,
  };
}

export async function preparePayoutMail(
  investmentId: string,
  payoutName: string,
  mc: MailContext,
): Promise<ApprovalMail> {
  const context = await getPayoutContext(investmentId);
  const payout = context.payouts.find((p) => p.name === payoutName);
  if (!payout) throw new Error("The payout was not found.");
  const preview = await previewInvestorPayout(
    investmentId,
    payout.payment_type,
    payout.payment_type === "Pay Any" ? payout.payment_amount : null,
  );
  const final = { ...payout, payment_amount: preview.payment_amount };
  const text = payoutText(context, final, mc);
  const fileId = await uploadPdf(
    buildPayoutStatementPdf(
      payoutPdfData(
        context,
        final,
        preview.allocations,
        scheduleAfter(context.schedule, preview.allocations),
      ),
      mc.companyName,
      getPdfPalette(mc.theme),
      mc.currency,
    ),
    `PaymentStatement-${context.id}-${payout.value_date}.pdf`,
  );
  return {
    ...text,
    message_html: messageToHtml(text.message),
    file_id: fileId,
  };
}

export async function prepareContractMail(
  investmentId: string,
  mc: MailContext,
): Promise<ApprovalMail> {
  const state = await loadInvestorFlowState(investmentId);
  const schedule = scheduleFromApi(
    await getInvestorFlowSchedule(termsFromState(state)),
  );
  const doc = buildContractPdfFromState(state, schedule, mc.theme, mc.currency);
  if (!doc)
    throw new Error(
      "The contract could not be made (investor, product or terms missing).",
    );
  const text = contractText(
    state,
    state.customerName || state.customerId || "",
    state.productName || "",
    mc,
  );
  const fileId = await uploadPdf(doc, contractPdfName(state));
  return {
    ...text,
    message_html: messageToHtml(text.message),
    file_id: fileId,
  };
}
