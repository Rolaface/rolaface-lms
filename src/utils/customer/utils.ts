import type { ChipColor } from "../../types/customer/types";

// Single source of truth for chip/accent colors — reads straight off the
// CSS variables Mantine generates for every shade registered in
// mantine.theme.ts (--mantine-color-brand-0 ... 9, etc).
export const colorVar = (color: ChipColor, shade: number) => `var(--mantine-color-${color}-${shade})`;

let uid = 0;
export const nextId = () => `id_${Date.now()}_${uid++}`;

export const calcAge = (dob: string): string => {
  if (!dob) return "\u2014";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "\u2014";
  const diffMs = Date.now() - d.getTime();
  const ageDate = new Date(diffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return age >= 0 && age < 130 ? `${age} yrs` : "\u2014";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};