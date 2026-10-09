import { jsPDF } from "jspdf";
import { useCompanyStore } from "../../../store/companyStore";
import type { MantineTheme } from "@mantine/core";
import {
  fmtDate,
  stateCustomer,
  stateProduct,
  type ModalState,
  type Schedule,
  type ScheduleRow,
} from "./InvestorModalShared";

/* ------------------------------ Palette ------------------------------ */
type RGB = [number, number, number];

export interface PdfPalette {
  brand: RGB;
  brandSoft: RGB;
  ink: RGB;
  mute: RGB;
  line: RGB;
  soft: RGB;
  success: RGB;
  successSoft: RGB;
}

const toRgb = (hex: string | undefined, fallback: RGB): RGB => {
  const m = hex ? /^#?([0-9a-f]{6})$/i.exec(hex.trim()) : null;
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Reads the same theme colors the app uses (brand / slate / success). */
export function getPdfPalette(theme: MantineTheme): PdfPalette {
  const c = theme.colors;
  return {
    brand: toRgb(c.brand?.[6], [67, 56, 202]),
    brandSoft: toRgb(c.brand?.[0], [238, 236, 255]),
    ink: toRgb(c.slate?.[8], [27, 35, 64]),
    mute: toRgb(c.slate?.[5], [107, 115, 144]),
    line: toRgb(c.slate?.[2], [228, 231, 240]),
    soft: toRgb(c.slate?.[0], [246, 247, 251]),
    success: toRgb(c.success?.[6], [22, 128, 60]),
    successSoft: toRgb(c.success?.[0], [220, 245, 229]),
  };
}

/* ------------------------------ Drawing ------------------------------ */
const PAGE_W = 210;
const PAGE_H = 297;
const M = 15;
const CW = PAGE_W - M * 2;
const BOTTOM = PAGE_H - 22;

// jsPDF's built-in fonts have no rupee glyph, so amounts print as "Rs."
const money = (n: number) => "Rs. " + Math.round(n).toLocaleString("en-IN");

interface Ctx {
  doc: jsPDF;
  p: PdfPalette;
}

const fill = ({ doc }: Ctx, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const draw = ({ doc }: Ctx, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const ink = ({ doc }: Ctx, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
const font = ({ doc }: Ctx, style: "normal" | "bold", size: number) => {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
};

function drawHeader(
  ctx: Ctx,
  title: string,
  subtitle: string,
  meta: { label: string; value: string }[],
) {
  const { doc, p } = ctx;
  fill(ctx, p.brand);
  doc.rect(0, 0, PAGE_W, 40, "F");
  fill(ctx, p.brandSoft);
  doc.rect(0, 40, PAGE_W, 1.2, "F");

  ink(ctx, [255, 255, 255]);
  font(ctx, "bold", 20);
  doc.text(title, M, 19);
  font(ctx, "normal", 10);
  doc.text(subtitle, M, 27);

  meta.forEach((m, i) => {
    const y = 11 + i * 10;
    font(ctx, "normal", 7.5);
    doc.text(m.label.toUpperCase(), PAGE_W - M, y, { align: "right" });
    font(ctx, "bold", 10);
    doc.text(m.value, PAGE_W - M, y + 4.5, { align: "right" });
  });
  return 54;
}

function newPage(ctx: Ctx) {
  const { doc, p } = ctx;
  doc.addPage();
  fill(ctx, p.brand);
  doc.rect(0, 0, PAGE_W, 4, "F");
  return 16;
}

function sectionTitle(ctx: Ctx, y: number, text: string) {
  const { doc, p } = ctx;
  fill(ctx, p.brand);
  doc.roundedRect(M, y - 3.8, 1.6, 5, 0.8, 0.8, "F");
  ink(ctx, p.ink);
  font(ctx, "bold", 10.5);
  doc.text(text, M + 4, y);
  return y + 6;
}

function kpiTiles(ctx: Ctx, y: number, items: { label: string; value: string }[]) {
  const { doc, p } = ctx;
  const gap = 4;
  const w = (CW - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = M + i * (w + gap);
    fill(ctx, p.brandSoft);
    doc.roundedRect(x, y, w, 20, 2.5, 2.5, "F");
    ink(ctx, p.mute);
    font(ctx, "bold", 7);
    doc.text(it.label.toUpperCase(), x + 4, y + 7);
    ink(ctx, p.brand);
    font(ctx, "bold", 11.5);
    doc.text(it.value, x + 4, y + 15);
  });
  return y + 28;
}

function infoCard(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  heading: string,
  name: string,
  lines: string[],
) {
  const { doc, p } = ctx;
  const h = 14 + lines.length * 4.6 + 3;
  fill(ctx, p.soft);
  draw(ctx, p.line);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "FD");
  ink(ctx, p.mute);
  font(ctx, "bold", 7);
  doc.text(heading.toUpperCase(), x + 4, y + 6);
  ink(ctx, p.ink);
  font(ctx, "bold", 11);
  doc.text(name, x + 4, y + 12);
  font(ctx, "normal", 8.5);
  ink(ctx, p.mute);
  lines.forEach((l, i) => doc.text(l, x + 4, y + 17.5 + i * 4.6));
  return h;
}

function keyValueRows(ctx: Ctx, y: number, rows: [string, string][]) {
  const { doc, p } = ctx;
  const rowH = 8;
  const h = rows.length * rowH;
  fill(ctx, [255, 255, 255]);
  draw(ctx, p.line);
  doc.roundedRect(M, y, CW, h, 2.5, 2.5, "FD");
  rows.forEach(([label, value], i) => {
    const ry = y + i * rowH;
    if (i > 0) {
      draw(ctx, p.line);
      doc.line(M + 3, ry, M + CW - 3, ry);
    }
    ink(ctx, p.mute);
    font(ctx, "normal", 9);
    doc.text(label, M + 4, ry + 5.4);
    ink(ctx, p.ink);
    font(ctx, "bold", 9);
    doc.text(value, M + CW - 4, ry + 5.4, { align: "right" });
  });
  return y + h + 8;
}

function table(
  ctx: Ctx,
  y: number,
  cols: { header: string; w: number; align: "left" | "right" }[],
  rows: string[][],
) {
  const { doc, p } = ctx;
  const rowH = 7.5;

  const head = (yy: number) => {
    fill(ctx, p.brandSoft);
    doc.roundedRect(M, yy, CW, 8, 1.5, 1.5, "F");
    ink(ctx, p.brand);
    font(ctx, "bold", 7.5);
    let x = M;
    cols.forEach((c) => {
      if (c.align === "right") doc.text(c.header.toUpperCase(), x + c.w - 3, yy + 5.3, { align: "right" });
      else doc.text(c.header.toUpperCase(), x + 3, yy + 5.3);
      x += c.w;
    });
    return yy + 10;
  };

  let cy = head(y);
  rows.forEach((r, ri) => {
    if (cy + rowH > BOTTOM) {
      cy = head(newPage(ctx));
    }
    if (ri % 2 === 1) {
      fill(ctx, p.soft);
      doc.rect(M, cy - 1.8, CW, rowH, "F");
    }
    ink(ctx, p.ink);
    font(ctx, "normal", 8.5);
    let x = M;
    cols.forEach((c, ci) => {
      if (c.align === "right") doc.text(r[ci], x + c.w - 3, cy + 3, { align: "right" });
      else doc.text(r[ci], x + 3, cy + 3);
      x += c.w;
    });
    cy += rowH;
  });
  return cy + 6;
}

function ensure(ctx: Ctx, y: number, needed: number) {
  return y + needed > BOTTOM ? newPage(ctx) : y;
}

function addFooters(ctx: Ctx, leftText: string) {
  const { doc, p } = ctx;
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    draw(ctx, p.line);
    doc.line(M, PAGE_H - 15, PAGE_W - M, PAGE_H - 15);
    ink(ctx, p.mute);
    font(ctx, "normal", 8);
    doc.text(leftText, M, PAGE_H - 10);
    doc.text(`Page ${i} of ${n}`, PAGE_W - M, PAGE_H - 10, { align: "right" });
  }
}

/* ------------------------------ Contract ------------------------------ */
export interface PdfCustomer {
  name: string;
  id: string;
  bank: string;
  email: string;
}

export interface ContractPdfData {
  contractNo: string;
  companyName: string;
  issuedOn: Date;
  status: string;
  signMethod: string;
  customer: PdfCustomer;
  productName: string;
  amount: number;
  rate: number;
  frequency: string;
  firstRepayment: string;
  maturity: string;
  penaltyApplicable: boolean;
  penaltyRate: number;
  totalMonths: number;
  totalInterest: number;
  rows: ScheduleRow[];
}

export function buildContractPdf(d: ContractPdfData, p: PdfPalette): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: Ctx = { doc, p };

  let y = drawHeader(ctx, "INVESTMENT AGREEMENT", d.productName, [
    { label: "Contract No.", value: d.contractNo },
    { label: "Issued on", value: fmtDate(d.issuedOn) },
    { label: "Status", value: d.status },
  ]);

  // Parties
  y = sectionTitle(ctx, y, "Parties");
  const cardW = (CW - 6) / 2;
  const h1 = infoCard(ctx, M, y, cardW, "The Company", d.companyName || "The Company", [
    `Product: ${d.productName}`,
  ]);
  const h2 = infoCard(ctx, M + cardW + 6, y, cardW, "The Investor", d.customer.name, [
    `Customer ID: ${d.customer.id}`,
    `Email: ${d.customer.email}`,
  ]);
  y += Math.max(h1, h2) + 8;

  // Summary
  y = sectionTitle(ctx, y, "Investment summary");
  y = kpiTiles(ctx, y, [
    { label: "Investment amount", value: money(d.amount) },
    { label: "Interest rate", value: `${d.rate}% p.a.` },
    { label: "Tenure", value: `${d.totalMonths} months` },
    { label: "Total repayment", value: money(d.amount + d.totalInterest) },
  ]);

  // Key terms
  y = sectionTitle(ctx, y, "Key terms");
  y = keyValueRows(ctx, y, [
    ["Investment amount", money(d.amount)],
    ["Interest rate", `${d.rate}% p.a.`],
    ["Repayment frequency", d.frequency],
    ["First repayment date", fmtDate(d.firstRepayment)],
    ["Maturity date", fmtDate(d.maturity)],
    ["Number of payments", String(d.rows.length)],
    ["Total repayment", money(d.amount + d.totalInterest)],
    [
      "Penalty",
      d.penaltyApplicable
        ? `Delayed payouts attract ${d.penaltyRate}% p.a.`
        : "Not applicable",
    ],
  ]);

  // Schedule
  y = ensure(ctx, y, 30);
  y = sectionTitle(ctx, y, "Repayment schedule");
  y = table(
    ctx,
    y,
    [
      { header: "No.", w: 16, align: "left" },
      { header: "Repay date", w: 44, align: "left" },
      { header: "Principal", w: 40, align: "right" },
      { header: "Interest", w: 40, align: "right" },
      { header: "Total payout", w: 40, align: "right" },
    ],
    d.rows.map((r, i) => [
      String(i + 1),
      fmtDate(r.date),
      money(r.principal),
      money(r.interest),
      money(r.principal + r.interest),
    ]),
  );

  // Terms
  y = ensure(ctx, y, 30);
  y = sectionTitle(ctx, y, "Terms");
  ink(ctx, p.ink);
  font(ctx, "normal", 9);
  const terms = [
    "Principal and interest are paid in equal instalments on each payout date; the last instalment settles any rounding difference.",
    d.penaltyApplicable
      ? `Delayed payouts attract a penalty of ${d.penaltyRate}% p.a.`
      : "Penalty: not applicable.",
  ];
  terms.forEach((t, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}.  ${t}`, CW - 4) as string[];
    doc.text(wrapped, M + 2, y);
    y += wrapped.length * 4.8 + 1.5;
  });
  y += 6;

  // Signatures
  y = ensure(ctx, y, 48);
  y = sectionTitle(ctx, y, "Signatures");
  const sigW = (CW - 12) / 2;
  const executed = d.status === "Executed";
  [
    { x: M, label: `Investor - ${d.customer.name}` },
    { x: M + sigW + 12, label: `For ${d.companyName || "the Company"}` },
  ].forEach((s, idx) => {
    draw(ctx, p.mute);
    doc.line(s.x, y + 22, s.x + sigW, y + 22);
    ink(ctx, p.ink);
    font(ctx, "bold", 9);
    doc.text(s.label, s.x, y + 28);
    if (idx === 0) {
      font(ctx, "normal", 8.5);
      if (executed) {
        ink(ctx, p.success);
        doc.text(`Signed via ${d.signMethod}`, s.x, y + 15);
      } else {
        ink(ctx, p.mute);
        doc.text("Signature pending", s.x, y + 15);
      }
    }
  });

  addFooters(ctx, `Investment Agreement | ${d.contractNo}`);
  return doc;
}

/* ------------------------------ Statement ------------------------------ */
export interface StatementPdfData {
  contractNo: string;
  statementLabel: string; // e.g. "Nov 2026"
  periodFrom: Date;
  periodTo: Date;
  monthNo: number;
  totalMonths: number;
  customer: PdfCustomer;
  productName: string;
  principal: number;
  rate: number;
  interestEarned: number;
  paidOut: number;
  earnedToDate: number;
}

export function buildStatementPdf(d: StatementPdfData, p: PdfPalette): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: Ctx = { doc, p };

  let y = drawHeader(ctx, "INVESTMENT STATEMENT", d.statementLabel, [
    { label: "Contract No.", value: d.contractNo },
    { label: "Statement period", value: `${fmtDate(d.periodFrom)} - ${fmtDate(d.periodTo)}` },
    { label: "Month", value: `${d.monthNo} of ${d.totalMonths}` },
  ]);

  y = sectionTitle(ctx, y, "Investor");
  const cardW = (CW - 6) / 2;
  const h1 = infoCard(ctx, M, y, cardW, "Statement for", d.customer.name, [
    `Customer ID: ${d.customer.id}`,
    `Email: ${d.customer.email}`,
  ]);
  const h2 = infoCard(ctx, M + cardW + 6, y, cardW, "Investment", d.productName, [
    `Contract No.: ${d.contractNo}`,
    `Payout bank: ${d.customer.bank}`,
  ]);
  y += Math.max(h1, h2) + 8;

  y = sectionTitle(ctx, y, "This month at a glance");
  y = kpiTiles(ctx, y, [
    { label: "Principal", value: money(d.principal) },
    { label: "Interest rate", value: `${d.rate}% p.a.` },
    { label: "Earned this month", value: money(d.interestEarned) },
    { label: "Paid out this month", value: money(d.paidOut) },
  ]);

  y = sectionTitle(ctx, y, "Statement details");
  y = keyValueRows(ctx, y, [
    ["Contract No.", d.contractNo],
    ["Principal", money(d.principal)],
    ["Interest rate", `${d.rate}% p.a.`],
    ["Interest earned this month", money(d.interestEarned)],
    ["Paid out this month", money(d.paidOut)],
    ["Total interest earned to date", money(d.earnedToDate)],
  ]);

  // Progress
  y = sectionTitle(ctx, y, "Investment progress");
  fill(ctx, p.line);
  doc.roundedRect(M, y, CW, 4, 2, 2, "F");
  fill(ctx, p.success);
  doc.roundedRect(M, y, Math.max(4, CW * (d.monthNo / d.totalMonths)), 4, 2, 2, "F");
  ink(ctx, p.mute);
  font(ctx, "normal", 8.5);
  doc.text(`${d.monthNo} of ${d.totalMonths} months completed`, M, y + 10);
  y += 20;

  ink(ctx, p.mute);
  font(ctx, "normal", 8.5);
  doc.text(
    "This is a system-generated statement and does not require a signature.",
    M,
    y,
  );

  addFooters(ctx, `Investment Statement | ${d.contractNo} | ${d.statementLabel}`);
  return doc;
}

export const contractPdfName = (state: ModalState) => `${state.contractNo}.pdf`;

/** The contract PDF for the current terms (null until customer, product and schedule exist). */
export function buildContractPdfFromState(
  state: ModalState,
  schedule: Schedule | null,
  theme: MantineTheme,
) {
  const customer = stateCustomer(state);
  const product = stateProduct(state);
  if (!schedule || !customer || !product) return null;
  return buildContractPdf(
    {
      contractNo: state.contractNo,
      companyName: useCompanyStore.getState().companyName,
      issuedOn: new Date(),
      status: state.contractStatus,
      signMethod: state.signMethod,
      customer: { ...customer, bank: customer.bank || "—" },
      productName: product.name,
      amount: state.amount,
      rate: state.rate,
      frequency: state.frequency,
      firstRepayment: state.firstRepayment,
      maturity: state.maturity,
      penaltyApplicable: state.penaltyApplicable,
      penaltyRate: state.penaltyRate,
      totalMonths: schedule.totalMonths,
      totalInterest: schedule.totalInterest,
      rows: schedule.rows,
    },
    getPdfPalette(theme),
  );
}

/* -------------------------- Investor statement -------------------------- */
export interface InvestorStatementPdfData {
  investor: { id: string; name: string; email: string | null; mobile: string | null };
  /** Investment the statement is limited to, or null for all investments. */
  investment: string | null;
  entries: {
    date: string;
    investment: string;
    type: string;
    description: string;
    paid_in: number;
    principal_returned: number;
    interest_paid: number;
    balance: number;
  }[];
  totals: { paid_in: number; principal_returned: number; interest_paid: number; closing_balance: number };
}

/** Every fund paid in and every payout received, with the principal balance after each entry. */
export function buildInvestorStatementPdf(d: InvestorStatementPdfData, p: PdfPalette): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: Ctx = { doc, p };
  const first = d.entries[0]?.date;
  const last = d.entries[d.entries.length - 1]?.date;
  const period = first && last ? `${fmtDate(first)} - ${fmtDate(last)}` : "No entries";

  let y = drawHeader(ctx, "INVESTOR STATEMENT", d.investment ? `Investment ${d.investment}` : "All investments", [
    { label: "Investor", value: d.investor.id },
    { label: "Period", value: period },
    { label: "Generated on", value: fmtDate(new Date()) },
  ]);

  y = sectionTitle(ctx, y, "Investor");
  const cardW = (CW - 6) / 2;
  const h1 = infoCard(ctx, M, y, cardW, "Statement for", d.investor.name, [
    `Investor ID: ${d.investor.id}`,
    `Email: ${d.investor.email || "-"}`,
  ]);
  const h2 = infoCard(ctx, M + cardW + 6, y, cardW, "Covers", d.investment || "All investments", [
    `Entries: ${d.entries.length}`,
    `Mobile: ${d.investor.mobile || "-"}`,
  ]);
  y += Math.max(h1, h2) + 8;

  y = sectionTitle(ctx, y, "Summary");
  y = kpiTiles(ctx, y, [
    { label: "Paid in", value: money(d.totals.paid_in) },
    { label: "Principal returned", value: money(d.totals.principal_returned) },
    { label: "Interest paid", value: money(d.totals.interest_paid) },
    { label: "Principal held", value: money(d.totals.closing_balance) },
  ]);

  y = ensure(ctx, y, 30);
  y = sectionTitle(ctx, y, "Transactions");
  const amount = (n: number) => (n ? money(n) : "-");
  y = table(
    ctx,
    y,
    [
      { header: "Date", w: 22, align: "left" },
      { header: "Investment", w: 30, align: "left" },
      { header: "Details", w: 40, align: "left" },
      { header: "Paid in", w: 22, align: "right" },
      { header: "Principal", w: 22, align: "right" },
      { header: "Interest", w: 20, align: "right" },
      { header: "Balance", w: 24, align: "right" },
    ],
    d.entries.map((e) => [
      fmtDate(e.date),
      e.investment,
      doc.splitTextToSize(`${e.type}: ${e.description}`, 37)[0] as string,
      amount(e.paid_in),
      amount(e.principal_returned),
      amount(e.interest_paid),
      money(e.balance),
    ]),
  );

  y = ensure(ctx, y, 12);
  ink(ctx, p.mute);
  font(ctx, "normal", 8.5);
  doc.text(
    "Balance is the principal held for the investor (paid in minus principal returned). " +
      "System-generated statement; no signature required.",
    M,
    y,
    { maxWidth: CW },
  );

  addFooters(ctx, `Investor Statement | ${d.investor.id}${d.investment ? ` | ${d.investment}` : ""}`);
  return doc;
}
