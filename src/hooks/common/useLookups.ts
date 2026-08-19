import { useQuery } from "@tanstack/react-query";
import {
  getCountryList,
  getGenderList,
  getIndustryList,
} from "../../api/lookup api/lookUpApi";
import { commonKeys } from "./queryKeys";

export interface LookupOption {
  value: string;
  label: string;
}

export function useCountries(search?: string) {
  return useQuery({
    queryKey: commonKeys.countries(search),
    queryFn: () =>
      getCountryList({
        fields: JSON.stringify(["name", "country_name", "code"]),
        ...(search
          ? { filters: JSON.stringify([["country_name", "like", `%${search}%`]]) }
          : {}),
      }),
    select: (res): LookupOption[] =>
      (res?.data ?? []).map((c: any) => ({
        value: c.name,
        label: c.country_name,
      })),
    staleTime: 1000 * 60 * 30,
  });
}

export function useGenders() {
  return useQuery({
    queryKey: commonKeys.genders(),
    queryFn: () => getGenderList(),
    select: (res): LookupOption[] =>
      (res?.data ?? []).map((g: any) => ({
        value: g.name,
        label: g.name,
      })),
    staleTime: Infinity, 
  });
}

export function useIndustries(search?: string) {
  return useQuery({
    queryKey: commonKeys.industries(search),
    queryFn: () =>
      getIndustryList({
        fields: JSON.stringify(["name", "industry"]),
        ...(search
          ? { filters: JSON.stringify([["industry", "like", `%${search}%`]]) }
          : {}),
      }),
    select: (res): LookupOption[] =>
      (res?.data ?? []).map((i: any) => ({
        value: i.name,
        label: i.industry,
      })),
    staleTime: 1000 * 60 * 30,
  });
}