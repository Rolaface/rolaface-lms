/* Profile: the investor's customer record (identity, contact, next of kin) and their bank accounts. */
import { useQuery } from "@tanstack/react-query";
import { Badge, Group, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import { useCustomerById } from "../../../hooks/customer/Detail/useCustomerById";
import { mapCustomerDetailToBorrowerProfile } from "../../Customer/mapCustomerDetail";
import { getInvestorBankAccounts } from "../../../api/Investor/investorFlowApi";
import { Card, CardTitle, ErrorBlock, Field, LoadingBlock } from "./ui";

export function ProfilePanel({ investorId }: { investorId: string }) {
  const { data: raw, isError, error } = useCustomerById(investorId);
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ["investorBankAccounts", investorId],
    queryFn: () => getInvestorBankAccounts(investorId),
    retry: false,
  });

  if (isError) return <ErrorBlock error={error} fallback="The investor profile could not be loaded." />;
  if (!raw) return <LoadingBlock />;

  const p = mapCustomerDetailToBorrowerProfile(raw);
  const isBusiness = p.type === "Company";
  const nok = p.nextOfKin;

  return (
    <Stack gap="md">
      <Card>
        <CardTitle title="Identity" subtitle={isBusiness ? "Company investor" : "Individual investor"} />
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <Field label="Name" value={p.name} />
          <Field label="Investor ID" value={p.custId} />
          <Field label="Type" value={p.type} />
          <Field label="Status" value={p.status} />
          {isBusiness ? (
            <>
              <Field label="Registered name" value={p.registeredCompanyName} />
              <Field label="Registration no." value={p.registrationNumber} />
              <Field label="Incorporated on" value={p.incorporationDate} />
              <Field label="Industry" value={p.industry} />
            </>
          ) : (
            <>
              <Field label="Gender" value={p.gender} />
              <Field label="Date of birth" value={p.dateOfBirth} />
              <Field label="Nationality" value={p.nationality} />
              <Field label="National ID" value={p.nationalId} />
              <Field label="Occupation" value={p.occupation} />
              <Field label="Employer" value={p.employer} />
            </>
          )}
          <Field label="Customer since" value={p.relationshipSince} />
          <Field label="Relationship manager" value={p.relationshipManager?.name} />
        </SimpleGrid>
      </Card>

      <Card>
        <CardTitle title="Contact" />
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <Field label="Mobile" value={p.mobile} />
          <Field label="Alternate mobile" value={p.alternateMobile} />
          <Field label="Email" value={p.email} />
          <Field label="Address" value={p.residentialAddress ?? p.addressLine1} />
          <Field label="City" value={p.city} />
          <Field label="Province" value={p.province} />
          <Field label="Country" value={p.country} />
          <Field label="Postal code" value={p.postalCode} />
        </SimpleGrid>
      </Card>

      {nok && (
        <Card>
          <CardTitle title="Next of kin" />
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <Field label="Name" value={[nok.firstName, nok.middleName, nok.lastName].filter(Boolean).join(" ")} />
            <Field label="Relationship" value={nok.relationship} />
            <Field label="Phone" value={nok.phone} />
            <Field label="Address" value={nok.address} />
          </SimpleGrid>
        </Card>
      )}

      <Card>
        <CardTitle title="Bank accounts" subtitle="Bank Accounts with this investor as the party" />
        {banksLoading ? (
          <LoadingBlock />
        ) : (
          <Table.ScrollContainer minWidth={640}>
            <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Account name</Table.Th>
                  <Table.Th>Bank</Table.Th>
                  <Table.Th>Account no.</Table.Th>
                  <Table.Th>IBAN</Table.Th>
                  <Table.Th>Branch code</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {banks.map((b) => (
                  <Table.Tr key={b.name}>
                    <Table.Td>
                      <Group gap={6}>
                        <Text fz="xs" fw={600}>
                          {b.account_name}
                        </Text>
                        {b.is_default === 1 && (
                          <Badge size="xs" variant="light" color="brand" style={{ textTransform: "none" }}>
                            Default
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>{b.bank}</Table.Td>
                    <Table.Td className="font-mono">{b.bank_account_no || "-"}</Table.Td>
                    <Table.Td className="font-mono">{b.iban || "-"}</Table.Td>
                    <Table.Td>{b.branch_code || "-"}</Table.Td>
                  </Table.Tr>
                ))}
                {banks.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text fz="xs" c="dimmed" ta="center" py="md">
                        No bank account found for this investor.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Stack>
  );
}
