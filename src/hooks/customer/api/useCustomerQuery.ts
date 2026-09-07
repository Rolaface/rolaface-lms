import { useQuery } from "@tanstack/react-query";
import {
  getCustomers,
  getCustomerById,
  type GetCustomersParams,
} from "../../../api/Customer/customerApi";
import { queryKeys } from "./queryKeys";

export function useCustomers(params?: GetCustomersParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => getCustomers(params),
  });
}

export function useCustomer(customerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId ?? ""),
    queryFn: () => getCustomerById(customerId as string),
    enabled: !!customerId,
  });
}