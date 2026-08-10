import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconChevronDown, IconClipboardList } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { PlainCard } from "./PlainCard";
import { IconChip } from "./IconChips";
import { DemandTypeTable } from "./DemandTypeTable";
import { labelProps, collectionAssetColumns, toOffsetOrderOptions } from "./Constants";
import { getLoanDeamndOffsetorder } from "../../../api/productApi";  

interface CollectionTabProps {
  form: UseFormReturnType<any>;
  // collectionSequenceOptions prop can now be removed since it's fetched locally
}

export function CollectionTab({ form }: CollectionTabProps) {
  // Fetch collection offset orders locally
  const { data: offsetOrdersResponse } = useQuery({
    queryKey: ["loanDemandOffsetOrders"],
    queryFn: getLoanDeamndOffsetorder,
  });

  const collectionSequenceOptions = useMemo(
    () => toOffsetOrderOptions(offsetOrdersResponse?.data),
    [offsetOrdersResponse]
  );

  return (
    <PlainCard>
      <div className="grid grid-cols-4 gap-x-5">
        {collectionAssetColumns.map((col) => (
          <div key={col.key} className="flex flex-col gap-3">
            <Select
              size="xs" searchable rightSection={<IconChevronDown size={14} className="text-slate-400" />}
              label={col.label} placeholder="Select sequence" data={collectionSequenceOptions}
              withAsterisk leftSection={<IconChip icon={IconClipboardList} color="indigoAlt" />} leftSectionWidth={50} classNames={labelProps}
              {...form.getInputProps(`collectionSeq.${col.key}`)}
            />
            <DemandTypeTable />
          </div>
        ))}
      </div>
    </PlainCard>
  );
}