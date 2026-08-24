import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  TextInput,
  Select,
  MultiSelect,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Loader,
  Menu,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconFileInvoice,
  IconSelector,
  IconSearch,
  IconFileText,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { FilterMultiSelect } from "../../components/shared/FilterMultiSelect";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { loanAccountModal } from "../../components/Modal/LoanBooking/loanAccountModalStore";
import { getAllLoans, deleteLoan, changeLoanStatus } from "../../api/loanApi";
import { getAllLoanProducts } from "../../api/productApi";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { getSymbol } from "../../store/currencyStore";
import { formatAmount, useCurrencyReady } from "../../store/currencyStore";
import { useCompanyStore } from "../../store/companyStore";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { usePermission } from "../../hooks/Usepermission";


import { Borrower360 } from "../Customer/CustomerView";
import { getBorrowerProfile } from "../Customer/mockdata";

const STATUS_META: Record<string, { label: string; color: string }> = {
  Draft: { label: "DRAFT", color: "slate" },
  Sanctioned: { label: "SANCTIONED", color: "warning" },
  "Partially Disbursed": { label: "PARTIALLY DISBURSED", color: "info" },
  Disbursed: { label: "DISBURSED", color: "success" },
  Closed: { label: "CLOSED", color: "slate" },
  Cancelled: { label: "CANCELLED", color: "danger" },
};


const STATUS_FILTER_OPTIONS = ["Draft", "Sanctioned", "Partially Disbursed", "Disbursed", "Closed"];

const columnHelper = createColumnHelper<any>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted
    ? "var(--mantine-color-brand-6)"
    : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${color}-2)`,
        },
      }}
      leftSection={
        <Box
          w={6}
          h={6}
          style={{
            borderRadius: "50%",
            background: `var(--mantine-color-${color}-6)`,
          }}
        />
      }
    >
      {label}
    </Badge>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;



const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "-";


interface SelectedLoan {
  id: string;
  customerId: string;
  customerName: string;
}

export function LoanAccount() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();

  const { can } = usePermission();

  const canCreateLoan = can("Loan", "create");
  const canReadLoan = can("Loan", "read");
  const canWriteLoan = can("Loan", "write");
  const canDeleteLoan = can("Loan", "delete");
  const canSubmitLoan = can("Loan", "submit");
  const canCancelLoan = can("Loan", "cancel");


  const [selectedLoan, setSelectedLoan] = useState<SelectedLoan | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);
  const [productSearchInput, setProductSearchInput] = useState("");
  const [debouncedProductSearch] = useDebouncedValue(productSearchInput, 400);

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);


  const [branch, setBranch] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, productFilter]);

  const { data: loansResponse, isLoading, isFetching } = useQuery({
    queryKey: ["loans", debouncedSearch, statusFilter, productFilter, page, pageSize],
    queryFn: () =>
      getAllLoans({
        search: debouncedSearch || undefined,
        status: statusFilter.length ? statusFilter : undefined,
        loan_product: productFilter.length ? productFilter : undefined,
        page,
        page_size: pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: productsResponse, isLoading: isProductsLoading } = useQuery({
    queryKey: ["loanProducts", debouncedProductSearch],
    queryFn: () => getAllLoanProducts({ search: debouncedProductSearch || undefined }),
  });

  const productFilterOptions = useMemo(() => {
    const products = productsResponse?.data || [];
    return products.map((p: any) => ({
      value: p.product_code,
      label: p.product_code,
    }));
  }, [productsResponse]);

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({
      heading,
      subtitle: '',
      body,
      color: 'green',
      buttons: [{ label: 'Close', color: 'green' }],
    });
  };

  const { mutate: removeLoan, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoan(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      showSuccess('Loan Booking Deleted', `Loan Booking ${variables} deleted successfully.`);
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",

        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    },
  });

  const confirmDelete = (id: string) => {
    openCommonModal({
      heading: "Delete Loan Booking",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {id}
          </Text>
          ?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: "Delete",
          color: "red",
          onClick: () => removeLoan(id),
        },
      ],
    });
  };

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      changeLoanStatus(id, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      showSuccess(
        variables.action === "approved" ? "Loan Booking Approved" : "Loan Booking Cancelled",
        `Loan Booking ${variables.id} ${variables.action === "approved" ? "approved" : "cancelled"} successfully.`
      );
    },
    onError: (error: any) => {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
    },
  });

  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const data = useMemo(() => {
    if (loansResponse?.status === "success" && loansResponse.data) {
      return loansResponse.data.map((item: any) => ({
        id: item.name,
        appNo: item.name,
        customer: item.applicant_name || item.applicant || "N/A",
        customerId: item.applicant || item.name,
        product: item.loan_product || "N/A",
        branch: item.company || "N/A",
        amount: item.loan_amount || 0,
        rate: 0,
        status: item.status || "Draft",
        appliedDate: item.posting_date,
      }));
    }
    return [];
  }, [loansResponse]);


  const filteredData = useMemo(() => {
    if (!branch) return data;
    return data.filter((a) => a.branch === branch);
  }, [data, branch]);

  const companyCurrency = useCompanyStore((state) => state.baseCurrency);
  const currencyReady = useCurrencyReady();

  const columns = useMemo(
    () => [
      columnHelper.accessor("appNo", {
        header: "Loan Account Number",
        cell: (info) => (
          <Text
            fz="sm"
            fw={700}
            c="slate.8"
            style={{ fontFamily: "var(--mantine-font-family-monospace)" }}
          >
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("customer", {
        header: "Customer",
        cell: (info) => (
          <Text fz="sm" fw={600} c="slate.8">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("product", {
        header: "Loan Product",
        cell: (info) => (
          <Badge
            variant="light"
            size="sm"
            radius="sm"
            color="brand"
            styles={{ root: { fontSize: 10, padding: "0 8px" } }}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("branch", {
        header: "Branch",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => (
          <Text
            fz="xs"
            c="slate.6"
            style={{
              fontFamily: "var(--mantine-font-family-monospace)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatAmount(companyCurrency, info.getValue(), { withSymbol: true })}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("rate", {
        header: "Rate",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {info.getValue() ? `${info.getValue().toFixed(2)}%` : "-"}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("appliedDate", {
        header: "Applied On",
        cell: (info) => (
          <Text fz="xs" c="slate.6">
            {fmtDate(info.getValue())}
          </Text>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const meta = STATUS_META[info.getValue()] || {
            label: info.getValue(),
            color: "gray",
          };
          return <StatusBadge label={meta.label} color={meta.color} />;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <Text fz="xs" fw={600} ta="right" w="100%">
            Actions
          </Text>
        ),
        cell: (info) => {
          const rowData = info.row.original;
          const loanIdentifier = rowData.name || rowData.appNo || rowData.id;
          const isDraft = rowData.status === "Draft";
          const isCancelled = rowData.status === "Cancelled";

          return (
            <Group
              justify="flex-end"
              gap={4}
              wrap="nowrap"
              className="lms-row-actions"
            >
              {canReadLoan && (
                <Tooltip label="View" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="slate"
                    radius="md"
                    onClick={() => handleViewLoan(rowData)}
                  >
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

              {canWriteLoan && (
                <Tooltip
                  label={isDraft ? "Edit" : "Only Drafts can be edited"}
                  withArrow
                >
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={isDraft ? "brand" : "slate"}
                    radius="md"
                    disabled={!isDraft}
                    onClick={() =>
                      loanAccountModal.open({
                        loanId: loanIdentifier,
                        isViewMode: false,
                      })
                    }
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

              {canDeleteLoan && (
                <Tooltip
                  label={isDraft ? "Delete" : "Only Drafts can be deleted"}
                  withArrow
                >
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={isDraft ? "danger" : "slate"}
                    radius="md"
                    disabled={!isDraft || isDeleting}
                    onClick={() => confirmDelete(loanIdentifier)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

             {(canSubmitLoan || canCancelLoan) && (
                <Menu 
                  shadow="md" 
                  width={140} 
                  position="bottom-end" 
                  radius="md"
                  disabled={isCancelled}
                >
                  <Menu.Target>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="slate"
                      radius="md"
                      disabled={isCancelled}
                    >
                      <IconDotsVertical size={14} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    {isDraft && canSubmitLoan && (
                      <Menu.Item
                        onClick={() => {
                          openCommonModal({
                            heading: "Approve Loan Booking",
                            subtitle:
                              "Please confirm this action before continuing.",
                            body: (
                              <>
                                Are you sure you want to approve loan booking{" "}
                                <Text span fw={600}>
                                  {loanIdentifier}
                                </Text>{" "}
                                for approval?
                              </>
                            ),
                            color: "green",
                            buttons: [
                              { label: "Cancel", variant: "default" },
                              {
                                label: "Approve",
                                color: "green",
                                onClick: () => {
                                  updateStatus({
                                    id: loanIdentifier,
                                    action: "approved",
                                  });
                                },
                              },
                            ],
                          });
                        }}
                      >
                        Approve
                      </Menu.Item>
                    )}

                    {!isDraft && !isCancelled && canCancelLoan && (
                      <Menu.Item
                        color="danger"
                        onClick={() => {
                          openCommonModal({
                            heading: "Cancel Loan Booking",
                            subtitle: "This action cannot be undone.",
                            body: (
                              <>
                                Are you sure you want to cancel loan booking{" "}
                                <Text span fw={600}>
                                  {loanIdentifier}
                                </Text>
                                ?
                              </>
                            ),
                            color: "red",
                            buttons: [
                              { label: "Back", variant: "default" },
                              {
                                label: "Cancel Booking",
                                color: "red",
                                onClick: () => {
                                  updateStatus({
                                    id: loanIdentifier,
                                    action: "cancelled",
                                  });
                                },
                              },
                            ],
                          });
                        }}
                      >
                        Cancel
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          );
        },
      }),
    ],
    [
      isDeleting, companyCurrency, canWriteLoan, canDeleteLoan, canSubmitLoan, canCancelLoan],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;


  const totalRows = loansResponse?.pagination?.total ?? 0;
  const totalPages = loansResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter([]);
    setProductFilter([]);
    setBranch(null);
    setPage(1);
  };

  // Branch options still derived from the currently loaded page, unchanged.
  const branchOptions = Array.from(
    new Set(data.map((a) => a.branch).filter(Boolean)),
  );


  const handleViewLoan = (rowData: any) => {
    const loanIdentifier = rowData.name || rowData.appNo || rowData.id;

    setSelectedLoan({
      id: loanIdentifier,
      customerId: rowData.customerId,
      customerName: rowData.customer,
    });
  };

  if (selectedLoan) {
    const borrower = getBorrowerProfile({
      id: selectedLoan.customerId,
      name: selectedLoan.customerName,
    });

    return (
      <Borrower360
        borrower={borrower}
        onBack={() => setSelectedLoan(null)}
        initialSelected={{ type: "loan", id: selectedLoan.id }}
        hideProfile
      />
    );
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
            <IconFileInvoice
              size={20}
              color="var(--mantine-color-white)"
              stroke={1.8}
            />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>
              Loan Booking
            </Title>
            <Text fz="sm" c="slate.5">
              Manage loan applications and bookings
            </Text>
          </Stack>
        </Group>
      </Group>

      <Paper
        radius="xl"
        p="xs"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        <Group gap="xs" wrap="nowrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Application No. / Customer"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{
              input: { border: "1px solid var(--mantine-color-slate-2)" },
            }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          />

          <FilterMultiSelect
            placeholder="All Products"
            data={productFilterOptions}
            value={productFilter}
            onChange={setProductFilter}
            searchable
            searchValue={productSearchInput}
            onSearchChange={setProductSearchInput}
            loading={isProductsLoading}
            width={140}
          />

          <Select
            size="sm"
            radius="xl"
            placeholder="All Branches"
            data={branchOptions as string[]}
            w={128}
            style={{ flexShrink: 1, minWidth: 90 }}
            searchable
            clearable
            rightSection={chevronDown}
            value={branch}
            onChange={setBranch}
          />

          <FilterMultiSelect
            placeholder="All Statuses"
            data={STATUS_FILTER_OPTIONS.map((s) => ({ value: s, label: s }))}
            value={statusFilter}
            onChange={setStatusFilter}
            width={140}
          />

          <Button
            size="sm"
            radius="xl"
            variant="default"
            px="sm"
            style={{ flexShrink: 0 }}
            onClick={resetFilters}
          >
            Reset
          </Button>

          {canCreateLoan && (
            <Button
              size="sm"
              radius="xl"
              color="brand"
              px="sm"
              style={{
                flexShrink: 0,
                background: theme.other.brandGradient,
                boxShadow: theme.other.brandGlowShadowSm,
              }}
              onClick={() =>
                loanAccountModal.open({ loanId: null, isViewMode: false })
              }
              leftSection={<IconPlus size={14} />}
            >
              Add Loan
            </Button>
          )}
        </Group>
      </Paper>

      <Paper
        radius="lg"
        p="sm"
        pos="relative"
        style={{
          background: "var(--mantine-color-slate-0)",
          border: "1px solid var(--mantine-color-slate-2)",
        }}
      >
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : (
          <>
            <Box
              style={{
                height: "clamp(320px, calc(100vh - 280px), 720px)",
                overflowY: "auto",
                opacity: isFetching ? 0.6 : 1,
                transition: "opacity 120ms ease",
              }}
            >
              <Table
                verticalSpacing="sm"
                horizontalSpacing="sm"
                fz="xs"
                w="100%"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px", height: "100%"}}
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
                            <IconFileText
                              size={24}
                              color="var(--mantine-color-slate-4)"
                            />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">
                            No applications match your filters.
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const rowMeta = STATUS_META[row.original.status] || {
                        label: row.original.status,
                        color: "gray",
                      };
                      const cells = row.getVisibleCells();
                      return (
                        <Table.Tr
                          key={row.id}
                          className="lms-row"
                          onDoubleClick={() => handleViewLoan(row.original)}
                          style={{ cursor: "pointer" }}
                        >
                          {cells.map((cell, idx) => (
                            <Table.Td
                              key={cell.id}
                              style={{
                                padding: "10px 10px",
                                border: "none",
                                boxShadow: "var(--mantine-shadow-xs)",
                                borderLeft:
                                  idx === 0
                                    ? `3px solid var(--mantine-color-${rowMeta.color}-4)`
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

            <Group justify="space-between" px="sm" pt="xs">
              <Group
                gap="sm"
                c="slate.6"
                style={{ fontSize: "var(--mantine-font-size-xs)" }}
              >
                <span>
                  {totalRows === 0
                    ? "Showing 0 of 0"
                    : `Showing ${firstRow}-${lastRow} of ${totalRows}`}
                </span>
                <Group gap="xs">
                  <span>Rows:</span>
                  <Select
                    data={["10", "20", "50"]}
                    value={String(pageSize)}
                    onChange={(v) => {
                      setPageSize(Number(v) || 10);
                      setPage(1);
                    }}
                    rightSection={chevronDown}
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination
                total={totalPages}
                value={page}
                onChange={(p) => setPage(p)}
                color="brand"
                size="xs"
                radius="xl"
                disabled={totalRows === 0}
              />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}