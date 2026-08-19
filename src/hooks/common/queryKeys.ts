export const commonKeys = {
  all: ["common"] as const,
  countries: (search?: string) => [...commonKeys.all, "countries", search ?? ""] as const,
  genders: () => [...commonKeys.all, "genders"] as const,
  industries: (search?: string) => [...commonKeys.all, "industries", search ?? ""] as const,
};