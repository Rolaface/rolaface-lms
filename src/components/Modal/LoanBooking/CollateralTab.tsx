import { Text, TextInput, Button, ActionIcon, Tooltip } from "@mantine/core";
import { IconSearch, IconTrash, IconBriefcase2, IconInfoCircle } from "@tabler/icons-react";

export interface CollateralItem {
  id: number;
  name: string;
}

interface CollateralTabProps {
  search: string;
  onSearchChange: (v: string) => void;
  collaterals: CollateralItem[];
  onRemove: (id: number) => void;
  onOpenAddModal: () => void;
}

export function CollateralTab({
  search,
  onSearchChange,
  collaterals,
  onRemove,
  onOpenAddModal,
}: CollateralTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* <div className="border border-slate-200 rounded-md p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Text size="sm" fw={700} className="text-slate-900 uppercase tracking-wide" style={{ fontSize: 11 }}>
            Find Existing Collateral
          </Text>
          <Tooltip label="Search for an existing collateral asset to link to this loan account." withArrow>
            <IconInfoCircle size={13} className="text-slate-400" />
          </Tooltip>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <TextInput
            size="sm"
            placeholder="Search by collateral code or description..."
            leftSection={<IconSearch size={14} className="text-slate-400" />}
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-0 px-6 w-full sm:w-auto"
          >
            Search
          </Button>
        </div>
      </div> */}

      <div className="flex flex-col items-center justify-center py-20 border border-slate-200 rounded-md">
        <IconBriefcase2 size={40} className="text-indigo-400 mb-4" />
        <Text size="sm" fw={700} className="text-slate-900">
          No collaterals linked
        </Text>
        <Text size="xs" c="dimmed" className="mb-4">
          Attach a collateral asset to secure this loan account.
        </Text>
        {/* <Button size="xs" variant="outline" color="indigo" className="border-dashed" onClick={onOpenAddModal}>
          + Add Collateral
        </Button> */}

        {collaterals.length > 0 && (
          <div className="w-full mt-6 flex flex-col gap-2">
            {collaterals.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <span>{c.name}</span>
                <ActionIcon size="sm" color="red" variant="subtle" onClick={() => onRemove(c.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}