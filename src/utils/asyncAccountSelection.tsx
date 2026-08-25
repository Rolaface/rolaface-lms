import { useState } from "react";
import type { SelectProps } from "@mantine/core";
import { Select, Loader } from "@mantine/core";

import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { theme, fieldLabelProps, toAccountOptions } from "../components/Modal/LoanProduct/Constants";

interface AsyncAccountSelectProps extends Omit<SelectProps, "data"> {
  queryKeyPrefix: string;
  fetchFn: (searchTerm?: string) => Promise<any>;
}

export function AsyncAccountSelect({ queryKeyPrefix, fetchFn, value, ...props }: AsyncAccountSelectProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);

  const { data, isFetching } = useQuery({
    queryKey: [queryKeyPrefix, debouncedSearch],
    queryFn: () => fetchFn(debouncedSearch),
  });

  const options = data?.data ? toAccountOptions(data.data) : [];

   // toAccountOptions returns string[] (each string doubles as value+label
  // for Mantine's Select). Make sure the currently selected value is present
   // (in case it's not in this page's fetch result), and dedupe defensively —
   // the backend can return the same account name more than once for a query.
   const rawOptions = value ? [...options, value] : options;
   const dedupedOptions = Array.from(new Set(rawOptions));


  return (
    <Select
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filter={({ options }) => options}
      data={dedupedOptions}
      value={value}
      rightSection={isFetching ? <Loader size={14} color="blue" /> : props.rightSection}
      {...props}
    />
  );
}