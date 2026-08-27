import { Badge, Group, Table, Text } from "@mantine/core";

import { IconBuildingBank } from "@tabler/icons-react";

import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";

import { type BureauFacility } from "../../../../api/Customer/creditAssessmentApi";

interface ExistingFacilitiesProps {
  bureauFacilities: BureauFacility[];
}

export function ExistingFacilities({
  bureauFacilities,
}: ExistingFacilitiesProps) {
  const facilities = bureauFacilities ?? [];

  return (
    <PlainCard dense>
      <Group justify="space-between" align="center" mb="xs">
        <SectionHeader
          icon={IconBuildingBank}
          title="Existing facilities"
          accent="accent"
          dense
          stepNumber={3}
        />

        {facilities.length > 0 && (
          <Badge size="sm" color="accent" variant="light">
            {facilities.length} {facilities.length === 1 ? "facility" : "facilities"} found
          </Badge>
        )}
      </Group>

      {facilities.length === 0 ? (
        <Text size="sm" c="slate.5">
          No existing facilities found from the credit bureau.
        </Text>
      ) : (
        <Table verticalSpacing="xs" fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Source</Table.Th>
              <Table.Th>Institution</Table.Th>
              <Table.Th>Facility Type</Table.Th>
              <Table.Th>Outstanding</Table.Th>
              <Table.Th>Monthly Payment</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {facilities.map((facility, index) => (
              <Table.Tr key={`bureau-${index}`}>
                <Table.Td>
                  <Badge size="xs" color="accent" variant="light">
                    Bureau
                  </Badge>
                </Table.Td>

                <Table.Td>
                  {facility.institution || "—"}
                </Table.Td>

                <Table.Td>
                  {facility.facilityType || "—"}
                </Table.Td>

                <Table.Td>
                  {typeof facility.outstandingAmount === "number"
                    ? facility.outstandingAmount.toLocaleString()
                    : "—"}
                </Table.Td>

                <Table.Td>
                  {typeof facility.monthlyPayment === "number"
                    ? facility.monthlyPayment.toLocaleString()
                    : "—"}
                </Table.Td>

                <Table.Td>
                  {facility.accountStatus || "—"}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </PlainCard>
  );
}