export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";

  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

