import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLoanTypes, getPurposes, getSubTypes, type ApplicantType } from "../../../api/LosConfiguration/LoanApplicationApi";
import { getAllCountries } from "../../../api/loanApplicationApi";
import { getLoanSecurityTypeList } from "../../../api/lookup api/lookUpApi";

export interface Option {
  value: string;
  label: string;
}

const toOptions = (nodes: { name: string; node_name: string }[] | undefined): Option[] =>
  (nodes ?? []).map((n) => ({ value: n.name, label: n.node_name }));

export function useLoanTypeOptions(applicantType: ApplicantType | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["los-loan-types", applicantType],
    queryFn: () => getLoanTypes(applicantType as ApplicantType),
    enabled: !!applicantType,
  });
  return { options: useMemo(() => toOptions(data), [data]), isLoading };
}

export function useSubTypeOptions(loanType: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["los-sub-types", loanType],
    queryFn: () => getSubTypes(loanType as string),
    enabled: !!loanType,
  });
  return { options: useMemo(() => toOptions(data), [data]), isLoading };
}

export function usePurposeOptions(subType: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["los-purposes", subType],
    queryFn: () => getPurposes(subType as string),
    enabled: !!subType,
  });
  return { options: useMemo(() => toOptions(data), [data]), isLoading };
}

export function useCountryOptions() {
  const { data, isLoading } = useQuery({ queryKey: ["countries"], queryFn: getAllCountries });
  const options = useMemo<Option[]>(
    () => ((data?.message?.data ?? []) as Option[]).map((c) => ({ value: c.value, label: c.label })),
    [data],
  );
  return { options, isLoading };
}

export function useCollateralTypeOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ["loan-security-types"],
    queryFn: () => getLoanSecurityTypeList({ page_size: 100 }),
  });
  const options = useMemo<Option[]>(
    () => ((data?.data ?? []) as Option[]).map((t) => ({ value: t.value, label: t.label || t.value })),
    [data],
  );
  return { options, isLoading };
}

export const labelOf = (options: Option[], value: string | null | undefined) =>
  options.find((o) => o.value === value)?.label ?? value ?? "";
