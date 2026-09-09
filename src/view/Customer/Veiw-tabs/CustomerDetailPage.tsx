import { Center, Loader, Text } from "@mantine/core";
import { useCustomerById } from "../../../hooks/customer/Detail/useCustomerById";
import { mapCustomerDetailToBorrowerProfile } from "../mapCustomerDetail";
import { Borrower360 } from "../CustomerView";
import type { SelectedItem } from "../../../types/customerview";

interface CustomerDetailPageProps {
  customerId: string;
  onBack: () => void;
  /** Deep-link straight into a tab, e.g. from Loan Booking's View action */
  initialSelected?: SelectedItem;
}

export function CustomerDetailPage({
  customerId,
  onBack,
  initialSelected,
}: CustomerDetailPageProps) {
  const { data, isLoading, isError, error } = useCustomerById(customerId);

  if (isLoading) {
    return (
      <Center h="100%" mih={400}>
        <Loader />
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center h="100%" mih={400}>
        <Text c="red" fz="sm">
          Could not load customer
          {error instanceof Error ? `: ${error.message}` : "."}
        </Text>
      </Center>
    );
  }

  const borrower = mapCustomerDetailToBorrowerProfile(data);

  return (
    <Borrower360
      borrower={borrower}
      onBack={onBack}
      initialSelected={initialSelected}
    />
  );
}