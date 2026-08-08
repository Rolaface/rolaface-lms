
export const DEFAULT_NUMBER_FORMAT_PATTERN = "#,###.##";

export interface ParsedNumberFormat {
  groupSeparator: string;
  decimalSeparator: string;
  decimalPlaces: number;
}

export interface FormatAmountOptions {
  withSymbol?: boolean;
  symbolPosition?: "prefix" | "suffix";
  symbolSpacer?: string;
}

const SEPARATOR_CANDIDATES = [".", ",", " "] as const;


export function parseNumberFormat(
  pattern: string | null | undefined,
): ParsedNumberFormat {
  if (!pattern || typeof pattern !== "string" || !pattern.includes("#")) {
    return { groupSeparator: ",", decimalSeparator: ".", decimalPlaces: 2 };
  }

  const positions = SEPARATOR_CANDIDATES
    .map((sep) => ({ sep, index: pattern.lastIndexOf(sep) }))
    .filter((entry) => entry.index !== -1)
    .sort((a, b) => b.index - a.index);

  if (positions.length === 0) {
    return { groupSeparator: "", decimalSeparator: ".", decimalPlaces: 0 };
  }

  const [{ sep: decimalSeparator, index: decimalIndex }] = positions;
  const groupEntry = positions.find((entry) => entry.sep !== decimalSeparator);
  const groupSeparator = groupEntry ? groupEntry.sep : "";

  const decimalPlaces = Math.max(0, pattern.length - decimalIndex - 1);

  return { groupSeparator, decimalSeparator, decimalPlaces };
}


export function formatWithParsedPattern(
  value: number,
  parsed: ParsedNumberFormat,
): string {
  if (!Number.isFinite(value)) return "";

  const { groupSeparator, decimalSeparator, decimalPlaces } = parsed;
  const isNegative = value < 0;
  const fixed = Math.abs(value).toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");

  const groupedInteger = groupSeparator
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
    : integerPart;

  const result =
    decimalPlaces > 0 ? `${groupedInteger}${decimalSeparator}${decimalPart}` : groupedInteger;

  return isNegative ? `-${result}` : result;
}


export function formatAmountByPattern(
  value: number | string | null | undefined,
  pattern: string | null | undefined = DEFAULT_NUMBER_FORMAT_PATTERN,
): string {
  if (value === null || value === undefined || value === "") return "";

  const numericValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numericValue)) return "";

  return formatWithParsedPattern(numericValue, parseNumberFormat(pattern));
}


export function formatAmountWithSymbol(
  value: number | string | null | undefined,
  pattern: string | null | undefined,
  symbol: string,
  options: Pick<FormatAmountOptions, "symbolPosition" | "symbolSpacer"> = {},
): string {
  const formatted = formatAmountByPattern(value, pattern);
  if (!formatted) return "";

  const { symbolPosition = "prefix", symbolSpacer = " " } = options;
  if (!symbol) return formatted;

  return symbolPosition === "prefix"
    ? `${symbol}${symbolSpacer}${formatted}`
    : `${formatted}${symbolSpacer}${symbol}`;
}