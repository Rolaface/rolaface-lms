import { Text, Button, NumberInput, SegmentedControl, Textarea } from "@mantine/core";
import { IconCalendarStats, IconNotes } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import type { RestructureType } from "../../../types/RestructureTypes";


interface RestructureDetailsTabProps {
  restructureType: RestructureType;
  setRestructureType: (type: RestructureType) => void;
  disabled?: boolean;

  // Current rates
  currentInterestRate: number;
  currentPenaltyRate: number;


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
  currentPrincipalOutstanding: number | "";
  onCurrentPrincipalChange: (value: number | "") => void;

  comment: string;
  setComment: (value: string) => void;

  // Maturity
  currentMaturityDate: string;
  repaymentFrequency: string;
  extendTenureBy: number | "";
  setExtendTenureBy: (value: number | "") => void;
  newMaturityDate: string;

  onViewSchedule: () => void;
  canPreviewSchedule: boolean;
}

export function RestructureDetailsTab({
  restructureType,
  setRestructureType,
  disabled = false,
  newInterestRate,
  setNewInterestRate,
  newPenaltyRate,
  setNewPenaltyRate,
  topupAmount,
  onTopupAmountChange,
  newPrincipalOutstanding,
  onNewPrincipalChange,
  currentPrincipalOutstanding,
  onCurrentPrincipalChange,
  currentMaturityDate,
  repaymentFrequency,
  extendTenureBy,
  setExtendTenureBy,
  newMaturityDate,
  comment,
  setComment,
  onViewSchedule,
  canPreviewSchedule,
  currentInterestRate,
  currentPenaltyRate,
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
      <fieldset disabled={disabled} className="border-0 m-0 p-0">
        <div className="rounded-lg border border-gray-200 p-3">
          {restructureType === "RATE_CHANGE" && (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <NumberInput
                  size="sm"
                  className="max-w-[220px]"
                  label="Current Interest Rate (%)"
                  value={currentInterestRate}
                  disabled
                  hideControls
                  rightSection={
                    <Text size="xs" c="dimmed" pr={4}>{repaymentFrequency}</Text>
                  }
                  rightSectionWidth={70}
                />

                <NumberInput
                  size="sm"
                  className="max-w-[220px]"
                  label="New Interest Rate (%)"
                  value={newInterestRate}
                  onChange={(v) => setNewInterestRate(v as number | "")}
                  hideControls
                  rightSection={
                    <Text size="xs" c="dimmed" pr={4}>{repaymentFrequency}</Text>
                  }
                  rightSectionWidth={70}
                />

                <NumberInput
                  size="sm"
                  className="max-w-[220px]"
                  label="Current Penalty Rate (%)"
                  value={currentPenaltyRate}
                  disabled
                  hideControls
                  rightSection={
                    <Text size="xs" c="dimmed" pr={4}>{repaymentFrequency}</Text>
                  }
                  rightSectionWidth={70}
                />

                <NumberInput
                  size="sm"
                  className="max-w-[220px]"
                  label="New Penalty Rate (%)"
                  value={newPenaltyRate}
                  hideControls
                  onChange={(v) => setNewPenaltyRate(v as number | "")}
                  rightSection={
                    <Text size="xs" c="dimmed" pr={4}>{repaymentFrequency}</Text>
                  }
                  rightSectionWidth={70}
                />
              </div>
            </>
          )}

          {restructureType === "TOPUP" && (
            <>

              <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                <NumberInput
                  size="sm"
                  label="Current Principal"
                  value={currentPrincipalOutstanding}
                  hideControls
                  onChange={(v) => onCurrentPrincipalChange(v as number | "")}
                  thousandSeparator=","
                  className="max-w-[190px]"
                />
                <NumberInput
                  size="sm"
                  label="Topup Amount"
                  hideControls
                  placeholder="e.g. 2000"
                  value={topupAmount}
                  onChange={(v) => onTopupAmountChange(v as number | "")}
                  thousandSeparator=","
                  className="max-w-[190px]"
                />
                <NumberInput
                  size="sm"
                  label="New Principal"
                  value={newPrincipalOutstanding}
                  hideControls
                  onChange={(v) => onNewPrincipalChange(v as number | "")}
                  thousandSeparator=","
                  className="max-w-[190px]"
                />
              </div>
            </>
          )}

          {restructureType === "MODIFY_MATURITY" && (
            <>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <DateInput
                  size="sm" disabled label="Current Maturity Date"
                  valueFormat="DD-MMM-YYYY"
                  value={currentMaturityDate && dayjs(currentMaturityDate).isValid() ? dayjs(currentMaturityDate).toDate() : null}
                  className="max-w-[200px]"
                />
                <NumberInput
                  size="sm" hideControls
                  label={`Extend Tenure By (${repaymentFrequency})`}
                  value={extendTenureBy}
                  onChange={(v) => setExtendTenureBy(v as number | "")}
                  className="max-w-[200px]"
                  styles={{ label: { whiteSpace: "nowrap" } }}
                />
                <DateInput
                  size="sm" disabled label="New Maturity Date"
                  valueFormat="DD-MMM-YYYY"
                  value={newMaturityDate && dayjs(newMaturityDate).isValid() ? dayjs(newMaturityDate).toDate() : null}
                  className="max-w-[200px]"
                />
              </div>
            </>
          )}

          <div className="mt-2">
              <Textarea
                size="sm"
                label="Comment"
                placeholder="Add a comment or description..."
                disabled={disabled}
                value={comment}
                onChange={(e) => setComment(e.currentTarget.value)}
                minRows={2}
                maxRows={4}
                autosize
                variant={disabled ? 'filled' : 'default'}
                leftSection={<IconNotes size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
                leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '10px' } }}
              />
            </div>
        </div>
      </fieldset>

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

