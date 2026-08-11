import { Select } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconChevronDown, IconClipboardList } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { PlainCard } from "./PlainCard";
import { IconChip } from "./IconChips";
import { DemandTypeTable } from "./DemandTypeTable";
import { labelProps, collectionAssetColumns, toOffsetOrderOptions } from "./Constants";
import {
  getLoanDeamndOffsetorder,
  getLoanDemandOffsetOrderDetail,
  type OffsetOrderComponent,
} from "../../../api/productApi";

interface CollectionTabProps {
  form: UseFormReturnType<any>;
}

export function CollectionTab({ form }: CollectionTabProps) {
  // List of available offset-order sequences (Standard, Sub Standard, etc.)
  // used to populate all 4 dropdowns.
  const { data: offsetOrdersResponse } = useQuery({
    queryKey: ["loanDemandOffsetOrders"],
    queryFn: getLoanDeamndOffsetorder,
  });

  const collectionSequenceOptions = useMemo(
    () => toOffsetOrderOptions(offsetOrdersResponse?.data ?? offsetOrdersResponse?.message),
    [offsetOrdersResponse]
  );

  return (
    <PlainCard>
      <div className="grid grid-cols-4 gap-x-5">
        {collectionAssetColumns.map((col) => {
          const selectedName: string | null = form.values.collectionSeq?.[col.key] || null;

          // One detail query per column, keyed by that column's own
          // selected value — each column fetches and shows independently.
          const { data: detailResponse, isFetching } = useQuery({
            queryKey: ["loanDemandOffsetOrderDetail", selectedName],
            queryFn: () => getLoanDemandOffsetOrderDetail(selectedName as string),
            enabled: !!selectedName,
          });

          const components: OffsetOrderComponent[] =
            (detailResponse as any)?.data?.components ??
            (detailResponse as any)?.message?.data?.components ??
            [];

          return (
            <div key={col.key} className="flex flex-col gap-3">
              <Select
                size="xs"
                searchable
                rightSection={<IconChevronDown size={14} className="text-slate-400" />}
                label={col.label}
                placeholder="Select sequence"
                data={collectionSequenceOptions}
                withAsterisk
                leftSection={<IconChip icon={IconClipboardList} color="indigoAlt" />}
                leftSectionWidth={50}
                classNames={labelProps}
                {...form.getInputProps(`collectionSeq.${col.key}`)}
              />

              {/* Table stays hidden until a sequence is selected for this column */}
              {selectedName && (
                <DemandTypeTable components={components} isLoading={isFetching} />
              )}
            </div>
          );
        })}
      </div>
    </PlainCard>
  );
}