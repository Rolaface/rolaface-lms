import { Text, ActionIcon, Paper, ThemeIcon } from "@mantine/core";
import { IconTrash, IconBriefcase2 } from "@tabler/icons-react";

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

export function CollateralTab({ collaterals, onRemove }: CollateralTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <Paper
        withBorder
        radius="lg"
        shadow="md"
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <ThemeIcon variant="light" color="brand" radius="xl" size={56} mb="md">
          <IconBriefcase2 size={26} />
        </ThemeIcon>
        <Text size="sm" fw={700} c="slate.8" ta="center">
          No collaterals linked
        </Text>
        <Text size="xs" c="slate.4" ta="center" mb="md" maw={320} mx="auto">
          Attach a collateral asset to secure this loan account.
        </Text>

        {collaterals.length > 0 && (
          <div className="w-full mt-4 flex flex-col gap-2 px-6">
            {collaterals.map((c) => (
              <Paper
                key={c.id}
                withBorder
                radius="md"
                className="flex justify-between items-center px-3 py-2"
              >
                <Text size="sm" c="slate.7">
                  {c.name}
                </Text>
                <ActionIcon size="sm" color="danger" variant="subtle" onClick={() => onRemove(c.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Paper>
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
}