import {
  Text,
  TextInput,
  NumberInput,
  Select,
  SegmentedControl,
  Button,
} from "@mantine/core";

import {
  IconCalendarDue,
  IconCalendar,
  IconCurrencyDollar,
  IconPlus,
  IconCalendarStats,
  IconClipboardList,
  IconCar,
} from "@tabler/icons-react";

const labelClass = {
  label: "text-sm font-medium text-gray-700 mb-1",
};

const RESTRUCTURE_REASONS = [
  "Financial Hardship",
  "Rate Renegotiation",
  "Loan Consolidation",
  "Collateral Revaluation",
  "Regulatory Requirement",
  "Other",
];

type RestructureType =
  | "RATE_CHANGE"
  | "TOPUP"
  | "MODIFY_MATURITY";

interface RestructureDetailsProps {
  selectedLoan: any;

  valueDate: string;
  setValueDate: (value: string) => void;

  reason: string | null;
  setReason: (value: string | null) => void;

  restructureType: RestructureType;
  setRestructureType: (value: RestructureType) => void;

  newInterestRate: number | "";
  setNewInterestRate: (value: number | "") => void;

  newPenaltyRate: number | "";
  setNewPenaltyRate: (value: number | "") => void;

  topupAmount: number | "";
  handleTopupAmountChange: (value: number | "") => void;

  newPrincipalOutstanding: number | "";
  handleNewPrincipalChange: (value: number | "") => void;

  newMaturityDate: string;
  setNewMaturityDate: (value: string) => void;

  setScheduleOpened: (value: boolean) => void;
}

export function RestructureDetails({
  selectedLoan,
  valueDate,
  setValueDate,
  reason,
  setReason,
  restructureType,
  setRestructureType,
  newInterestRate,
  setNewInterestRate,
  newPenaltyRate,
  setNewPenaltyRate,
  topupAmount,
  handleTopupAmountChange,
  newPrincipalOutstanding,
  handleNewPrincipalChange,
  newMaturityDate,
  setNewMaturityDate,
  setScheduleOpened,
}: RestructureDetailsProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {!selectedLoan ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
          <IconClipboardList size={40} className="opacity-50" />

          <Text c="dimmed" size="sm" ta="center" maw={280}>
            Select a borrower and loan account on the left to begin the
            restructure.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Restructure Request */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />

            <Text fw={700} size="sm" className="text-gray-900">
              Restructure Request
            </Text>
          </div>

          {/* Selected Loan */}
          <div>
            <Text size="sm" fw={500} className="text-gray-700 mb-1">
              Selected Loan A/C Number
            </Text>

            <div className="flex items-center gap-2 rounded-md border border-[#a5b4fc] bg-[#eef2ff] px-3 py-2.5">
              <IconCar size={14} className="text-[#4F46E5]" />

              <Text
                size="sm"
                fw={700}
                className="text-gray-900 font-mono"
              >
                {selectedLoan.id}
              </Text>

              <Text size="xs" c="dimmed">
                ({selectedLoan.type})
              </Text>
            </div>
          </div>

          {/* Value Date + Reason */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <TextInput
              size="sm"
              withAsterisk
              type="date"
              label="Value Date"
              value={valueDate}
              onChange={(e) => setValueDate(e.currentTarget.value)}
              leftSection={
                <IconCalendarDue
                  size={14}
                  className="text-emerald-600"
                />
              }
              classNames={labelClass}
            />

            <Select
              size="sm"
              withAsterisk
              label="Reason for Restructure"
              placeholder="Select a reason"
              data={RESTRUCTURE_REASONS}
              value={reason}
              onChange={setReason}
              classNames={labelClass}
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* Restructure Type */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded bg-gradient-to-b from-[#4338CA] to-[#4F46E5]" />

              <Text fw={700} size="sm" className="text-gray-900">
                Restructure Type
              </Text>
            </div>

            <SegmentedControl
              fullWidth
              color="brand"
              value={restructureType}
              onChange={(v) =>
                setRestructureType(v as RestructureType)
              }
              data={[
                {
                  label: "Rate Change",
                  value: "RATE_CHANGE",
                },
                {
                  label: "Topup",
                  value: "TOPUP",
                },
                {
                  label: "Modify Maturity",
                  value: "MODIFY_MATURITY",
                },
              ]}
            />
          </div>

          {/* Dynamic Restructure Details */}
          <div className="rounded-lg border border-gray-200 p-4">
            {/* RATE CHANGE */}
            {restructureType === "RATE_CHANGE" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <IconCurrencyDollar
                    size={16}
                    className="text-[#4F46E5]"
                  />

                  <Text
                    fw={700}
                    size="sm"
                    className="text-gray-900"
                  >
                    Rate Change Details
                  </Text>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <NumberInput
                    size="sm"
                    hideControls
                    withAsterisk
                    label="New Interest Rate (%)"
                    value={newInterestRate}
                    onChange={(v) =>
                      setNewInterestRate(v as number | "")
                    }
                    decimalScale={2}
                    classNames={labelClass}
                  />

                  <NumberInput
                    size="sm"
                    hideControls
                    withAsterisk
                    label="Penalty Rate (%)"
                    value={newPenaltyRate}
                    onChange={(v) =>
                      setNewPenaltyRate(v as number | "")
                    }
                    decimalScale={2}
                    classNames={labelClass}
                  />
                </div>
              </>
            )}

            {/* TOPUP */}
            {restructureType === "TOPUP" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <IconPlus
                    size={16}
                    className="text-[#4F46E5]"
                  />

                  <Text
                    fw={700}
                    size="sm"
                    className="text-gray-900"
                  >
                    Topup Details
                  </Text>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <NumberInput
                    size="sm"
                    hideControls
                    withAsterisk
                    label="Topup Amount"
                    placeholder="e.g. 2000"
                    value={topupAmount}
                    onChange={(v) =>
                      handleTopupAmountChange(v as number | "")
                    }
                    leftSection={
                      <IconCurrencyDollar
                        size={14}
                        className="text-[#F26522]"
                      />
                    }
                    thousandSeparator=","
                    classNames={labelClass}
                  />

                  <NumberInput
                    size="sm"
                    hideControls
                    withAsterisk
                    label="New Principal Outstanding"
                    value={newPrincipalOutstanding}
                    onChange={(v) =>
                      handleNewPrincipalChange(v as number | "")
                    }
                    leftSection={
                      <IconCurrencyDollar
                        size={14}
                        className="text-[#F26522]"
                      />
                    }
                    thousandSeparator=","
                    classNames={labelClass}
                  />
                </div>
              </>
            )}

            {/* MODIFY MATURITY */}
            {restructureType === "MODIFY_MATURITY" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <IconCalendar
                    size={16}
                    className="text-[#4F46E5]"
                  />

                  <Text
                    fw={700}
                    size="sm"
                    className="text-gray-900"
                  >
                    Maturity Details
                  </Text>
                </div>

                <TextInput
                  size="sm"
                  withAsterisk
                  type="date"
                  label="New Maturity Date"
                  value={newMaturityDate}
                  onChange={(e) =>
                    setNewMaturityDate(e.currentTarget.value)
                  }
                  classNames={labelClass}
                  className="max-w-[260px]"
                />
              </>
            )}
          </div>

          {/* View New Schedule */}
          <Button
            type="button"
            variant="outline"
            color="brand"
            size="sm"
            leftSection={<IconCalendarStats size={14} />}
            onClick={() => setScheduleOpened(true)}
            className="self-start font-semibold"
          >
            View New Schedule
          </Button>
        </div>
      )}
    </div>
  );
}