import { useQuery } from "@tanstack/react-query";
import { getCustomerById } from "../../../api/Customer/customerApi";

export function useCustomerById(id: string | null) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}