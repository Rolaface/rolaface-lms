// RestructureDetailsTab.tsx
// "Restructure Details" tab content for LoanRestructureModal:
// restructure type selector + type-specific fields + "View New Schedule" button.

import { Text, Button, NumberInput, TextInput, SegmentedControl } from "@mantine/core";
import { IconCalendarStats, IconPlus, IconCalendar } from "@tabler/icons-react";

import { labelClass } from "./RestructureTypes";
import type { RestructureType } from "./RestructureTypes";

interface RestructureDetailsTabProps {
  restructureType: RestructureType;
  setRestructureType: (type: RestructureType) => void;

  // Rate Change
  newInterestRate: number | "";
  setNewInterestRate: (value: number | "") => void;
  newPenaltyRate: number | "";
  setNewPenaltyRate: (value: number | "") => void;

  // Topup
  topupAmount: number | "";
  onTopupAmountChange: (value: number | "") => void;
  newPrincipalOutstanding: number | "";
  onNewPrincipalChange: (value: number | "") => void;

  // Modify Maturity
  newMaturityDate: string;
  setNewMaturityDate: (value: string) => void;

  onViewSchedule: () => void;
}

export function RestructureDetailsTab({
  restructureType,
  setRestructureType,
  newInterestRate,
  setNewInterestRate,
  newPenaltyRate,
  setNewPenaltyRate,
  topupAmount,
  onTopupAmountChange,
  newPrincipalOutstanding,
  onNewPrincipalChange,
  newMaturityDate,
  setNewMaturityDate,
  onViewSchedule,
}: RestructureDetailsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
        </div>
        <SegmentedControl
          fullWidth
          size="xs"
          color="brand"
          value={restructureType}
          onChange={(v) => setRestructureType(v as RestructureType)}
          data={[
            { label: "Rate Change", value: "RATE_CHANGE" },
            { label: "Topup", value: "TOPUP" },
            { label: "Modify Maturity", value: "MODIFY_MATURITY" },
          ]}
          styles={{ label: { padding: "4px 8px" } }}
        />
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        {restructureType === "RATE_CHANGE" && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Text fw={700} size="sm" className="text-gray-900">
                Rate Change Details
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <NumberInput
                size="sm"
                withAsterisk
                label="New Interest Rate (%)"
                value={newInterestRate}
                onChange={(v) => setNewInterestRate(v as number | "")}
                decimalScale={2}
                hideControls
                classNames={labelClass}
              />
              <NumberInput
                size="sm"
                withAsterisk
                label="Penalty Rate (%)"
                value={newPenaltyRate}
                hideControls
                onChange={(v) => setNewPenaltyRate(v as number | "")}
                decimalScale={2}
                classNames={labelClass}
              />
            </div>
          </>
        )}

        {restructureType === "TOPUP" && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <IconPlus size={16} className="text-[#4F46E5]" />
              <Text fw={700} size="sm" className="text-gray-900">
                Topup Details
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-y-4">
              <NumberInput
                size="sm"
                withAsterisk
                label="Topup Amount"
                hideControls
                placeholder="e.g. 2000"
                value={topupAmount}
                onChange={(v) => onTopupAmountChange(v as number | "")}
                thousandSeparator=","
                classNames={labelClass}
                className="max-w-[220px]"
              />
              <NumberInput
                size="sm"
                withAsterisk
                label="New Principal Outstanding"
                value={newPrincipalOutstanding}
                hideControls
                onChange={(v) => onNewPrincipalChange(v as number | "")}
                thousandSeparator=","
                classNames={labelClass}
                className="max-w-[220px]"
              />
            </div>
          </>
        )}

        {restructureType === "MODIFY_MATURITY" && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <IconCalendar size={16} className="text-[#4F46E5]" />
              <Text fw={700} size="sm" className="text-gray-900">
                Maturity Details
              </Text>
            </div>
            <TextInput
              size="sm"
              withAsterisk
              type="date"
              label="New Maturity Date"
              value={newMaturityDate}
              onChange={(e) => setNewMaturityDate(e.currentTarget.value)}
              classNames={labelClass}
              className="max-w-[260px]"
            />
          </>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        color="brand"
        size="sm"
        leftSection={<IconCalendarStats size={14} />}
        onClick={onViewSchedule}
        className="self-start font-semibold"
      >
        View New Schedule
      </Button>
    </div>
  );
}