import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Select,
  SegmentedControl,
  Group,
  Paper,
  Table,
  Text,
  Pagination,
  Title,
  Stack,
  Loader,
  useMantineTheme,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { customerModal } from "../../components/Modal/customer/CustomerModalStore";
import { getBorrowerProfile } from "./mockdata";
import { Borrower360 } from "./CustomerView";
import { useCustomerList } from "../../hooks/customer/table/useCustomerList";
import { buildCustomerColumns, type CustomerRow } from "./customerColumns";
import { SortIcon } from "./CustomerTableCells";
import { FilterMultiSelect } from "../../components/shared/FilterMultiSelect";

export { getBorrowerProfile } from "./mockdata";

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

export function Customer() {
  const theme = useMantineTheme();
  const list = useCustomerList();

  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
  const [borrower360CustomerId, setBorrower360CustomerId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      borrower360CustomerId !== null &&
      !list.allRows.some((c) => c.id === borrower360CustomerId)
    ) {
      setBorrower360CustomerId(null);
    }
  }, [borrower360CustomerId, list.allRows]);

  const handleViewCustomer = (customer: CustomerRow) =>
    setBorrower360CustomerId(customer.id);

  const handleDeleteCustomer = (id: string) => {
    // TODO: backend delete endpoint isn't live yet (see CustomerApi.ts ->
    // CUSTOMER_ENDPOINTS.delete). Wire this to deleteCustomer() + a
    // react-query mutation + invalidateQueries(['customers']) once it is.
  };

  const columns = useMemo(
    () =>
      buildCustomerColumns({
        onView: handleViewCustomer,
        onEdit: () => customerModal.open({ isViewMode: false }),
        onDelete: handleDeleteCustomer,
      }),
    [],
  );

  const table = useReactTable({
    data: list.rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (borrower360CustomerId !== null) {
    const customer = list.allRows.find((c) => c.id === borrower360CustomerId);
    if (customer) {
      const borrower = getBorrowerProfile({
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
      });
      return (
        <Borrower360
          borrower={borrower}
          onBack={() => setBorrower360CustomerId(null)}
        />
      );
    }
    return null;
  }

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
        .lms-thead-cell { position: sticky; top: 0; z-index: 2; background: var(--mantine-color-slate-0); }
      `}</style>

      {/* Header */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              background: theme.other.brandGradient,
              boxShadow: theme.other.brandGlowShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconUsers
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Customers
            </Title>
            <Text fz="sm" c="slate.5">
              Onboard new customers
            </Text>
          </Stack>
        </Group>
      </Group>

      {/* Toolbar */}
      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Name / Email / Mobile"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={list.search}
            onChange={(e) => list.setSearch(e.currentTarget.value)}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Types"
            data={["Individual", "Company"]}
            w={150}
            searchable
            clearable
            rightSection={chevronDown}
            value={list.type}
            onChange={list.setType}
          />
          <Select
            size="sm"
            radius="xl"
            placeholder="All Countries"
            data={list.countryOptions}
            w={166}
            searchable
            clearable
            rightSection={chevronDown}
            value={list.country}
            onChange={list.setCountry}
          />
          <FilterMultiSelect
            placeholder="All Status"
            data={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            value={list.status}
            onChange={list.setStatus}
            width={150}
          />
          <Group gap="xs" ml="auto">
            <Button
              size="sm"
              radius="xl"
              variant="default"
              px="md"
              onClick={list.resetFilters}
            >
              Reset
            </Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => customerModal.open({ isViewMode: false })}
              leftSection={<IconPlus size={14} />}
              style={{
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
            >
              Add Customer
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Table */}
      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {list.isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : (
          <>
            <Box
              style={{
                height: "clamp(320px, calc(100vh - 280px), 720px)",
                overflowY: "auto",
                opacity: list.isFetching ? 0.6 : 1,
                transition: "opacity 120ms ease",
              }}
            >
              <Table
                verticalSpacing="sm"
                horizontalSpacing="sm"
                fz="xs"
                w="100%"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <Table.Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        return (
                          <Table.Th
                            key={header.id}
                            className="lms-thead-cell"
                            c="slate.5"
                            fw={700}
                            style={{
                              fontSize: "var(--mantine-font-size-xs)",
                              padding: "0 10px 6px",
                              userSelect: "none",
                              cursor: canSort ? "pointer" : "default",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              border: "none",
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <Group
                              gap="xs"
                              wrap="nowrap"
                              justify={
                                header.id === "actions"
                                  ? "flex-end"
                                  : "flex-start"
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {canSort && (
                                <SortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              )}
                            </Group>
                          </Table.Th>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Thead>
                <Table.Tbody>
                  {rows.length === 0 ? (
                    <Table.Tr>
                      <Table.Td
                        colSpan={columns.length}
                        style={{ border: "none" }}
                      >
                        <Stack align="center" gap="xs" py="xl">
                          <Box
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: "50%",
                              background: "var(--mantine-color-white)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--mantine-color-slate-2)",
                            }}
                          >
                            <IconUsers
                              size={26}
                              color="var(--mantine-color-slate-4)"
                            />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No customers match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const isActive = row.original.status === "ACTIVE";
                      return (
                        <Table.Tr
                          key={row.id}
                          className="lms-row"
                          onDoubleClick={() => handleViewCustomer(row.original)}
                          style={{ cursor: "pointer" }}
                        >
                          {row.getVisibleCells().map((cell, idx) => (
                            <Table.Td
                              key={cell.id}
                              style={{
                                padding: "10px 10px",
                                border: "none",
                                boxShadow: "var(--mantine-shadow-xs)",
                                borderLeft:
                                  idx === 0
                                    ? `3px solid var(--mantine-color-${isActive ? "success" : "danger"}-4)`
                                    : undefined,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Pagination Footer */}
            <Group justify="space-between" px="sm" pt="xs">
              <Group
                gap="sm"
                c="slate.6"
                style={{ fontSize: "var(--mantine-font-size-xs)" }}
              >
                <span>
                  {list.totalRows === 0
                    ? "Showing 0 of 0"
                    : `Showing ${list.firstRow}-${list.lastRow} of ${list.totalRows}`}
                </span>
                <Group gap="xs">
                  <span>Rows:</span>
                  <Select
                    data={["10", "20", "50"]}
                    value={String(list.pageSize)}
                    onChange={(v) => list.setPageSize(Number(v) || 10)}
                    rightSection={chevronDown}
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination
                total={list.totalPages}
                value={list.page}
                onChange={list.setPage}
                color="brand"
                size="xs"
                radius="xl"
                disabled={list.totalRows === 0}
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
