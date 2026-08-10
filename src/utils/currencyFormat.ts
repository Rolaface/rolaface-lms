export const DEFAULT_NUMBER_FORMAT_PATTERN = "#,###.##";

export interface ParsedNumberFormat {
  groupSeparator: string;
  decimalSeparator: string;
  decimalPlaces: number;
  /**
   * Digit-group sizes, ordered from the group nearest the decimal point
   * outward (rightmost first). The last entry repeats indefinitely for
   * any remaining higher-order digits.
   * e.g. Western "#,###"    -> [3]      -> 1,234,567
   *      Indian   "#,##,###" -> [3, 2]  -> 12,34,567
   */
  groupSizes: number[];
}

export interface FormatAmountOptions {
  withSymbol?: boolean;
  symbolPosition?: "prefix" | "suffix";
  symbolSpacer?: string;
}

const SEPARATOR_CANDIDATES = [".", ",", " "] as const;

const DEFAULT_GROUP_SIZES = [3];

/**
 * Reads the digit-group sizes directly out of the pattern's integer part
 * instead of assuming every currency groups by 3s. The leading segment
 * (e.g. the "#" in "#,##,###") is just a placeholder for "however many
 * digits are left" and isn't itself a group size — only the segments
 * after it describe real, repeating group widths.
 */
function computeGroupSizes(integerPattern: string, groupSeparator: string): number[] {
  if (!groupSeparator) return [];

  const segments = integerPattern.split(groupSeparator).filter((s) => s.length > 0);
  if (segments.length <= 1) return DEFAULT_GROUP_SIZES;

  // Drop the leading placeholder segment. Remaining segments are in
  // left-to-right pattern order; reverse so index 0 = group nearest the
  // decimal point (applied first when grouping from the right).
  return segments.slice(1).map((s) => s.length).reverse();
}

export function parseNumberFormat(
  pattern: string | null | undefined,
): ParsedNumberFormat {
  if (!pattern || typeof pattern !== "string" || !pattern.includes("#")) {
    return { groupSeparator: ",", decimalSeparator: ".", decimalPlaces: 2, groupSizes: DEFAULT_GROUP_SIZES };
  }

  const positions = SEPARATOR_CANDIDATES
    .map((sep) => ({ sep, index: pattern.lastIndexOf(sep) }))
    .filter((entry) => entry.index !== -1)
    .sort((a, b) => b.index - a.index);

  if (positions.length === 0) {
    return { groupSeparator: "", decimalSeparator: ".", decimalPlaces: 0, groupSizes: [] };
  }

  const [{ sep: decimalSeparator, index: decimalIndex }] = positions;
  const groupEntry = positions.find((entry) => entry.sep !== decimalSeparator);
  const groupSeparator = groupEntry ? groupEntry.sep : "";

  const decimalPlaces = Math.max(0, pattern.length - decimalIndex - 1);
  const integerPattern = pattern.slice(0, decimalIndex);
  const groupSizes = computeGroupSizes(integerPattern, groupSeparator);

  return { groupSeparator, decimalSeparator, decimalPlaces, groupSizes };
}

/**
 * Applies digit grouping from the right, walking outward through
 * `groupSizes` and repeating the final size for any remaining digits.
 * e.g. digits="1234567", sizes=[3, 2] (Indian) -> "12,34,567"
 *      digits="1234567", sizes=[3]    (Western) -> "1,234,567"
 */
function applyGrouping(integerDigits: string, groupSeparator: string, groupSizes: number[]): string {
  if (!groupSeparator || integerDigits.length === 0) return integerDigits;

  const sizes = groupSizes.length ? groupSizes : DEFAULT_GROUP_SIZES;
  const chunks: string[] = [];
  let remaining = integerDigits;
  let i = 0;

  while (remaining.length > 0) {
    const size = sizes[Math.min(i, sizes.length - 1)];
    const take = Math.min(size, remaining.length);
    chunks.unshift(remaining.slice(remaining.length - take));
    remaining = remaining.slice(0, remaining.length - take);
    i++;
  }

  return chunks.join(groupSeparator);
}

export function formatWithParsedPattern(
  value: number,
  parsed: ParsedNumberFormat,
): string {
  if (!Number.isFinite(value)) return "";

  const { groupSeparator, decimalSeparator, decimalPlaces, groupSizes } = parsed;
  const isNegative = value < 0;
  const fixed = Math.abs(value).toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");

  const groupedInteger = applyGrouping(integerPart, groupSeparator, groupSizes);

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