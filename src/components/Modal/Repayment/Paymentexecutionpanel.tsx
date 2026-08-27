import {
  Badge,
  NumberInput,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  UnstyledButton, SegmentedControl, Group,
  useMantineTheme,
  Textarea,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconCalendar,
  IconCalendarDue,
  IconChevronDown,
  IconClipboardCheck,
  IconCreditCard,
  IconCashBanknote,
  IconChecklist,
  IconHash,
  IconNotes,
} from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import type {
  Borrower,
  LoanAccount,
  LoanRepaymentFormValues,
} from "../../../types/loanRepayment";
import {
  PAYMENT_MODES,
  PAYMENT_NATURE_OPTIONS,
} from "../../../utils/Loanrepaymentutils";

const chevronDown = (
  <IconChevronDown
    size={14}
    style={{ color: "var(--mantine-color-slate-4)" }}
  />
);
import { DateInput } from "@mantine/dates";

interface PaymentExecutionPanelProps {
  form: UseFormReturnType<LoanRepaymentFormValues>;
  selectedLoan: LoanAccount | null;
  selectedBorrower: Borrower | null;
  isView?: boolean;
  onNatureChange: (value: string) => void;
  modeOfPaymentOptions: { value: string; label: string }[];
  isModeOfPaymentLoading?: boolean;
}

export function PaymentExecutionPanel({
  form,
  selectedLoan,
  selectedBorrower,
  isView,
  onNatureChange,
  modeOfPaymentOptions,
  isModeOfPaymentLoading,
}: PaymentExecutionPanelProps) {
  const theme = useMantineTheme();

  return (
    <div className="relative flex-1 overflow-y-auto p-6">
      <div
        className={`rounded-lg p-4 transition-all duration-300 ${
          !selectedLoan
            ? "pointer-events-none select-none opacity-50 blur-[2px]"
            : ""
        }`}
        style={{ border: "1px solid var(--mantine-color-slate-2)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <IconClipboardCheck
            size={16}
            style={{ color: "var(--mantine-color-brand-6)" }}
          />
          <Text
            size="sm"
            fw={700}
            c="slate.8"
            className="flex items-center gap-2"
          >
            Executing Payment for
            <Badge color="brand" variant="light" radius="sm" size="md">
              {selectedLoan?.id ?? "—"}
            </Badge>
            <Text component="span" c="slate.4">
              /
            </Text>
            <Badge color="accent" variant="light" radius="sm" size="md">
              {selectedBorrower?.name ?? "—"}
            </Badge>
          </Text>
        </div>

        <div className="flex flex-col gap-5">
          <SimpleGrid cols={4} spacing="xl">
            <DateInput
              size="sm"
              withAsterisk
              label="Value Date"
              disabled={isView}
              leftSection={<IconCalendarDue size={14} />}
              valueFormat="DD-MMM-YYYY"
              value={form.values.valueDate || null}
              onChange={(value) => {
                form.setFieldValue("valueDate", value ?? "");
              }}
              error={form.errors.valueDate}
            />
          </SimpleGrid>

          <div>
            <Text size="sm" fw={500} c="slate.6" className="mb-2">
              Nature of Payment
            </Text>
            <SegmentedControl
              data={PAYMENT_NATURE_OPTIONS.map((opt) => ({
                label: (
                  <Group gap="xs" justify="center" wrap="nowrap">
                    <opt.icon size={16} />
                    <span>{opt.label}</span>
                  </Group>
                ),
                value: opt.value,
              }))}
              value={form.values.natureOfPayment}
              onChange={(val) => onNatureChange(val as any)}
              fullWidth
              size="md"
              color="brand"
              disabled={isView}
            />
          </div>

          <SimpleGrid cols={4} spacing="xl">
            <NumberInput
              size="sm"
              withAsterisk
              label="Amount to Pay"
              placeholder="Enter amount"
              disabled={isView}
              hideControls
              leftSection={
                <IconCashBanknote
                  size={14}
                  style={{ color: "var(--mantine-color-accent-6)" }}
                />
              }
              thousandSeparator=","
              decimalScale={2}
              {...form.getInputProps("amountToPay")}
            />
            <Select
              size="sm"
              withAsterisk
              label="Payment Mode"
              disabled={isView || isModeOfPaymentLoading}
              placeholder={
                isModeOfPaymentLoading ? "Loading..." : "Select payment mode"
              }
              data={modeOfPaymentOptions}
              leftSection={
                <IconCreditCard
                  size={14}
                  style={{ color: "var(--mantine-color-brand-6)" }}
                />
              }
              rightSection={chevronDown}
              {...form.getInputProps("paymentMode")}
            />
            <TextInput
              size="sm"
              label="Account Number"
              placeholder="Enter account no"
              disabled={isView}
              leftSection={
                <IconBuildingBank
                  size={14}
                  style={{ color: "var(--mantine-color-slate-4)" }}
                />
              }
              {...form.getInputProps("accountNumber")}
            />
            <TextInput
              size="sm"
              withAsterisk
              label="Reference Number"
              disabled={isView}
              placeholder="Enter reference no"
              leftSection={
                <IconHash
                  size={14}
                  style={{ color: "var(--mantine-color-slate-4)" }}
                />
              }
              {...form.getInputProps("referenceNumber")}
            />
          </SimpleGrid>

          <SimpleGrid cols={4} spacing="xl">
            <DateInput
              size="sm"
              withAsterisk
              label="Reference Date"
              disabled={isView}
              leftSection={<IconCalendar size={14} />}
              valueFormat="DD-MMM-YYYY"
              value={form.values.referenceDate || null}
              onChange={(value) => {
                form.setFieldValue("referenceDate", value ?? "");
              }}
              error={form.errors.referenceDate}
            />
          </SimpleGrid>

          <div className="w-1/2">
            <Textarea
              size="sm"
              label="Comment"
              placeholder="Add a comment or description..."
              disabled={isView}
              minRows={2}
              maxRows={4}
              autosize
              variant={isView ? 'filled' : 'default'}
              leftSection={<IconNotes size={14} style={{ color: "var(--mantine-color-slate-4)" }} />}
              leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '10px' } }}
              {...form.getInputProps("_comments")}
            />
          </div>
        </div>
      </div>

      {!selectedLoan && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-lg backdrop-blur-[3px]"
          style={{
            background:
              "color-mix(in srgb, var(--mantine-color-white) 55%, transparent)",
          }}
        >
          <div
            className="w-[440px] rounded-2xl"
            style={{
              border: "1px solid var(--mantine-color-brand-1)",
              background: "var(--mantine-color-white)",
              boxShadow: "var(--mantine-shadow-xl)",
            }}
          >
            <div className="flex justify-center pt-8">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: theme.other.softBrandGradient,
                  boxShadow: "0 0 0 1px var(--mantine-color-brand-2)",
                }}
              >
                <IconChecklist
                  size={30}
                  style={{ color: "var(--mantine-color-brand-7)" }}
                />
              </div>
            </div>

            <div className="px-8 py-6 text-center">
              <Text size="xl" fw={700} c="slate.8">
                No Loan Account Selected
              </Text>

              <Text size="sm" c="dimmed" className="mt-3 leading-6">
                To proceed with a repayment transaction, first search for a
                borrower and select one of their active loan accounts from the
                panel on the left.
              </Text>

              <div
                className="mt-6 rounded-lg px-4 py-3"
                style={{
                  border: "1px solid var(--mantine-color-slate-2)",
                  background: "var(--mantine-color-slate-0)",
                }}
              >
                <Text
                  size="xs"
                  fw={600}
                  c="brand.6"
                  className="uppercase tracking-wide"
                >
                  Next Step
                </Text>
                <Text size="sm" c="slate.6" className="mt-1">
                  Select a borrower → Choose a loan account → Process repayment
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










