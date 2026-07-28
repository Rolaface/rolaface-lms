export interface AmortizationRow {
  inst: number;
  date: string;
  beginning: number;
  principal: number;
  interest: number;
  emi: number;
  ending: number;
}

export function calcEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

export function buildAmortization(
  principal: number,
  annualRate: number,
  tenureMonths: number
): AmortizationRow[] {
  if (!principal || !annualRate || !tenureMonths) return [];
  const r = annualRate / 12 / 100;
  const emi = calcEmi(principal, annualRate, tenureMonths);
  let balance = principal;
  const rows: AmortizationRow[] = [];
  const start = new Date();

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * r * 100) / 100;
    const principalPaid = Math.round((emi - interest) * 100) / 100;
    const ending = Math.round((balance - principalPaid) * 100) / 100;
    const date = new Date(start.getFullYear(), start.getMonth() + i, 15);

    rows.push({
      inst: i,
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      beginning: balance,
      principal: principalPaid,
      interest,
      emi,
      ending,
    });
    balance = ending;
  }
  return rows;
}

export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}