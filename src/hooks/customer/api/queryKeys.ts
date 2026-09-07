import type { GetCustomersParams } from "../../../api/Customer/customerApi";

export const queryKeys = {
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (params?: GetCustomersParams) =>
      [...queryKeys.customers.lists(), params ?? {}] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
};