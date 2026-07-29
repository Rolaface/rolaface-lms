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

export function AsyncAccountSelect({ queryKeyPrefix, fetchFn, ...props }: AsyncAccountSelectProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);

  const { data, isFetching } = useQuery({
    queryKey: [queryKeyPrefix, debouncedSearch],
    queryFn: () => fetchFn(debouncedSearch),
  });

  const options = data?.data ? toAccountOptions(data.data) : [];

  return (
    <Select
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filter={({ options }) => options} 
      data={options}
      rightSection={isFetching ? <Loader size={14} color="blue" /> : props.rightSection}
      {...props}
    />
  );
}