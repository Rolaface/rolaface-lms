import { Badge, Group, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconEye, IconPencil, IconTrash, IconMail, IconPhone } from '@tabler/icons-react';
import { createColumnHelper } from '@tanstack/react-table';
import type { CustomerRaw } from '../../api/Customer/customerApi';
import { NameCell, IconText, EmptyPlaceholder, StatusBadge } from './CustomerTableCells';


export interface CustomerRow {
  id: string; // CustomerRaw.name (Frappe doc name) — API has no separate numeric id
  name: string; // CustomerRaw.customer_name
  type: string; // CustomerRaw.customer_type
  contact: string; // no matching API field yet — blank
  email: string; // CustomerRaw.email_id
  mobile: string; // CustomerRaw.mobile_no
  city: string; // no matching API field yet — blank
  country: string; // no matching API field yet — blank
  status: string; // CustomerRaw.status, upper-cased to match existing badge logic
}

export function mapCustomer(raw: CustomerRaw): CustomerRow {
  return {
    id: raw.name,
    name: raw.customer_name ?? '',
    type: raw.customer_type ?? '',
    contact: '',
    email: raw.email_id ?? '',
    mobile: raw.mobile_no ?? '',
    city: '',
    country: '',
    status: (raw.status ?? '').toUpperCase(),
  };
}

const columnHelper = createColumnHelper<CustomerRow>();

interface BuildColumnsArgs {
  onView: (row: CustomerRow) => void;
  onEdit: (row: CustomerRow) => void;
  onDelete: (id: string) => void;
}

export function buildCustomerColumns({ onView, onEdit, onDelete }: BuildColumnsArgs) {
  return [
    columnHelper.accessor('name', {
      header: 'Customer Name',
      cell: (info) => <NameCell name={info.getValue()} type={info.row.original.type} />,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => (
        <Badge
          variant="light"
          size="sm"
          radius="sm"
          color={info.getValue() === 'Company' ? 'brand' : 'info'}
          styles={{ root: { fontSize: 10, padding: '0 8px' } }}
        >
          {info.getValue() || '—'}
        </Badge>
      ),
    }),
    columnHelper.accessor('contact', {
      header: 'Primary Contact',
      cell: (info) => <EmptyPlaceholder text={info.getValue()} />,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => <IconText icon={<IconMail size={13} />}>{info.getValue()}</IconText>,
    }),
    columnHelper.accessor('mobile', {
      header: 'Mobile',
      cell: (info) => (
        <IconText icon={<IconPhone size={13} />} mono>
          {info.getValue()}
        </IconText>
      ),
    }),
    columnHelper.accessor('city', {
      header: 'City',
      cell: (info) => <EmptyPlaceholder text={info.getValue()} />,
    }),
    columnHelper.accessor('country', {
      header: 'Country',
      cell: (info) => <EmptyPlaceholder text={info.getValue()} />,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <Text fz="xs" fw={600} ta="right" w="100%">
          Actions
        </Text>
      ),
      cell: (info) => {
        const row = info.row.original;
        return (
          <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
            <Tooltip label="View" withArrow>
              <ActionIcon size="sm" variant="subtle" color="slate" radius="md" onClick={() => onView(row)}>
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="brand" radius="md" onClick={() => onEdit(row)}>
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon size="sm" variant="subtle" color="danger" radius="md" onClick={() => onDelete(row.id)}>
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    }),
  ];
}