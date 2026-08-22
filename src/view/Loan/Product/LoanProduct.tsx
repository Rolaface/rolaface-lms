import { useMemo, useState, useEffect } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { FilterMultiSelect } from "../../../components/shared/FilterMultiSelect";
import {
  Box,
  Button,
  TextInput,
  Select,
  SegmentedControl,
  Group,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Switch,
  Text,
  Pagination,
  Tooltip,
  Title,
  Stack,
  Loader,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconSearch,
  IconTrash,
  IconBriefcase,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoanProductModal } from "../../../components/Modal/LoanProduct/LoanProductModal";
import {
  getLoanProducts,
  deleteLoanProduct,
  enableLoanProduct,
  disableLoanProduct,
  type LoanProductRaw,
} from "../../../api/LoanProduct/LoanProductAPi";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { openCommonModal } from "../../../components/Modal/AlertModal";
import { loanProductModal } from "../../../components/Modal/LoanProduct/loanProductModalstore";

interface NormalizedProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  rate: number;
  max: number;
  disabled: 0 | 1;
  status: "ACTIVE" | "INACTIVE";
}

const columnHelper = createColumnHelper<NormalizedProduct>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  const color = sorted ? "var(--mantine-color-brand-6)" : "var(--mantine-color-slate-4)";
  if (sorted === "asc") return <IconChevronUp size={12} color={color} />;
  if (sorted === "desc") return <IconChevronDown size={12} color={color} />;
  return <IconSelector size={12} color={color} style={{ opacity: 0.5 }} />;
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  const scale = isActive ? "success" : "danger";
  return (
    <Badge
      variant="light"
      color={scale}
      radius="xl"
      size="sm"
      styles={{
        root: {
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: 0.2,
          paddingLeft: 8,
          paddingRight: 10,
          border: `1px solid var(--mantine-color-${scale}-2)`,
        },
      }}
      leftSection={
        <Box w={6} h={6} style={{ borderRadius: "50%", background: `var(--mantine-color-${scale}-6)` }} />
      }
    >
      {status}
    </Badge>
  );
}

const chevronDown = <IconChevronDown size={14} style={{ opacity: 0.6 }} />;

// Collateral module ke statusToDisabledParam jaisa hi — "All | Active | Inactive"
// ko API ke `disabled` param me map karta hai.
function statusToDisabledParam(status: string): 0 | 1 | undefined {
  if (status === "active") return 0;
  if (status === "inactive") return 1;
  return undefined;
}

export function LoanProduct() {
  const theme = useMantineTheme();

  // filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [status, setStatus] = useState("all");

  // table state
  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const disabledParam = statusToDisabledParam(status);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, disabledParam, selectedCategories]);

  const queryClient = useQueryClient();

  const showError = (heading: string, error: any) => {
    openCommonModal({
      heading,
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });
  };

  const showSuccess = (heading: string, body: string) => {
    openCommonModal({ heading, subtitle: "", body, color: "green", buttons: [{ label: "Close", color: "green" }] });
  };

  const { data: productsResponse, isLoading, isFetching } = useQuery({
    queryKey: ["loanProducts", debouncedSearch, disabledParam, selectedCategories, page, pageSize],
    queryFn: () =>
      getLoanProducts({
        search: debouncedSearch.trim() || undefined,
        disabled: disabledParam,
        loan_category: selectedCategories.length > 0 ? selectedCategories : undefined,
        page,
        page_size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });


  const categoryOptions = useMemo(() => {
    const list = productsResponse?.data || [];
    const unique = Array.from(new Set(list.map((p) => p.loan_category?.trim()).filter(Boolean))).sort();
    return unique.map((c) => ({ value: c as string, label: c as string }));
  }, [productsResponse]);

  const { mutate: enableItem, isPending: isEnabling } = useMutation({
    mutationFn: (id: string) => enableLoanProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      showSuccess("Product Activated", "Loan product has been activated successfully.");
    },
    onError: (error: any) => showError("Status Update Failed", error),
  });

  const { mutate: disableItem, isPending: isDisabling } = useMutation({
    mutationFn: (id: string) => disableLoanProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      showSuccess("Product Deactivated", "Loan product has been deactivated successfully.");
    },
    onError: (error: any) => showError("Status Update Failed", error),
  });

  const { mutate: removeItem, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteLoanProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      showSuccess("Product Deleted", "Loan product deleted successfully.");
    },
    onError: (error: any) => showError("Delete Failed", error),
  });

  const data: NormalizedProduct[] = useMemo(() => {
    const list: LoanProductRaw[] = productsResponse?.data || [];
    return list.map((p) => ({
      id: p.name,
      name: p.product_name || "—",
      code: p.product_code || "—",
      category: p.loan_category?.trim() || "Uncategorized",
      rate: Number(p.rate_of_interest) || 0,
      max: Number(p.maximum_loan_amount) || 0,
      disabled: p.disabled === 1 ? 1 : 0,
      status: p.disabled === 1 ? "INACTIVE" : "ACTIVE",
    }));
  }, [productsResponse]);

  const toggleStatus = (row: NormalizedProduct) => {
    const willDeactivate = row.status === "ACTIVE";
    openCommonModal({
      heading: willDeactivate ? "Deactivate Loan Product" : "Activate Loan Product",
      subtitle: "Please confirm this action before continuing.",
      body: (
        <>
          Are you sure you want to {willDeactivate ? "deactivate" : "activate"} loan product{" "}
          <Text span fw={600}>{row.name}</Text>?
        </>
      ),
      color: willDeactivate ? "red" : "green",
      buttons: [
        { label: "Cancel", variant: "default" },
        {
          label: willDeactivate ? "Deactivate" : "Activate",
          color: willDeactivate ? "red" : "green",
          onClick: () => (willDeactivate ? disableItem(row.id) : enableItem(row.id)),
        },
      ],
    });
  };

  const handleDelete = (row: NormalizedProduct) => {
    openCommonModal({
      heading: "Delete Loan Product",
      subtitle: "This action cannot be undone.",
      body: (
        <>
          Are you sure you want to delete loan product{" "}
          <Text span fw={600}>{row.name}</Text>?
        </>
      ),
      color: "red",
      buttons: [
        { label: "Cancel", variant: "default" },
        { label: "Delete", color: "red", onClick: () => removeItem(row.id) },
      ],
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Product Name",
        cell: (info) => <Text fz="sm" fw={700} c="slate.8">{info.getValue()}</Text>,
      }),
      columnHelper.accessor("code", {
        header: "Code",
        cell: (info) => (
          <Text fz="xs" c="slate.6" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => (
          <Badge variant="light" size="sm" radius="sm" color="brand" styles={{ root: { fontSize: 10, padding: "0 8px" } }}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("rate", {
        header: "Base Rate",
        cell: (info) => <Text fz="xs" c="slate.6">{Number(info.getValue()).toFixed(2)}%</Text>,
        sortingFn: "basic",
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <Text fz="xs" fw={600} ta="right" w="100%">Actions</Text>,
        cell: (info) => {
          const row = info.row.original;
          const isTogglingStatus = isEnabling || isDisabling;
          return (
            <Group justify="flex-end" gap={4} wrap="nowrap" className="lms-row-actions">
              <Tooltip label="View" withArrow>
                <ActionIcon size="sm" variant="subtle" color="slate" radius="md"
                  onClick={() => loanProductModal.open({ loanProductId: row.id, isViewMode: true })}>
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon size="sm" variant="subtle" color="brand" radius="md"
                  onClick={() => loanProductModal.open({ loanProductId: row.id, isViewMode: false })}>
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete" withArrow>
                <ActionIcon size="sm" variant="subtle" color="danger" radius="md" loading={isDeleting}
                  onClick={() => handleDelete(row)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={row.status === "ACTIVE" ? "Deactivate" : "Activate"} withArrow>
                <Switch
                  size="xs"
                  color="success"
                  checked={row.status === "ACTIVE"}
                  disabled={isTogglingStatus}
                  onChange={() => toggleStatus(row)}
                />
              </Tooltip>
            </Group>
          );
        },
      }),
    ],
    [isDeleting, isEnabling, isDisabling]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const totalRows = productsResponse?.pagination?.total ?? 0;
  const totalPages = productsResponse?.pagination?.total_pages ?? 1;
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(totalRows, page * pageSize);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setStatus("all");
    setPage(1);
  };

  return (
    <Stack gap="lg" p="lg">
      <style>{`
        .lms-search:focus-within { box-shadow: ${theme.other.searchFocusRing}; }
        .lms-row-actions { opacity: 1; }
        .lms-row td { background: var(--mantine-color-white); transition: background-color 150ms ease; }
        .lms-row:hover td { background: ${theme.other.rowHoverBg} !important; }
        .lms-row td:first-child { border-top-left-radius: var(--mantine-radius-md); border-bottom-left-radius: var(--mantine-radius-md); }
        .lms-row td:last-child { border-top-right-radius: var(--mantine-radius-md); border-bottom-right-radius: var(--mantine-radius-md); }
      `}</style>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" align="center">
          <Box style={{ width: 40, height: 40, borderRadius: "var(--mantine-radius-md)", background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconBriefcase size={20} color="var(--mantine-color-white)" stroke={1.8} />
          </Box>
          <Stack gap={2}>
            <Title order={2} c="slate.8" fw={700}>Loan Products</Title>
            <Text fz="sm" c="slate.5">Configure and manage loan products</Text>
          </Stack>
        </Group>
      </Group>

      <Paper radius="xl" p="xs" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        <Group gap="sm" wrap="wrap" align="center">
          <TextInput
            className="lms-search"
            size="sm"
            radius="xl"
            placeholder="Product Name / Code"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, minWidth: 220 }}
            styles={{ input: { border: "1px solid var(--mantine-color-slate-2)" } }}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />

          <FilterMultiSelect
            placeholder="All Categories"
            data={categoryOptions}
            value={selectedCategories}
            onChange={setSelectedCategories}
            width={180}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            color="brand"
            value={status}
            onChange={setStatus}
            data={[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
          <Group gap="xs" ml="auto">
            <Button size="sm" radius="xl" variant="default" px="md" onClick={resetFilters}>Reset</Button>
            <Button
              size="sm"
              radius="xl"
              color="brand"
              onClick={() => loanProductModal.open({})}
              leftSection={<IconPlus size={14} />}
              style={{ background: theme.other.brandGradient, boxShadow: theme.other.brandGlowShadowSm }}
            >
              Add Product
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper radius="lg" p="sm" pos="relative" style={{ background: "var(--mantine-color-slate-0)", border: "1px solid var(--mantine-color-slate-2)" }}>
        {isLoading ? (
          <Group justify="center" py="xl"><Loader size="sm" color="brand" /></Group>
        ) : (
          <>
            <Box style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 120ms ease" }}>
              <Table verticalSpacing="sm" horizontalSpacing="sm" fz="xs" w="100%" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <Table.Thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Table.Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        return (
                          <Table.Th
                            key={header.id}
                            c="slate.5"
                            fw={700}
                            style={{ fontSize: "var(--mantine-font-size-xs)", padding: "0 10px 6px", userSelect: "none", cursor: canSort ? "pointer" : "default", textTransform: "uppercase", letterSpacing: "0.04em", border: "none" }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <Group gap="xs" wrap="nowrap" justify={header.id === "actions" ? "flex-end" : "flex-start"}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort && <SortIcon sorted={header.column.getIsSorted()} />}
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
                      <Table.Td colSpan={columns.length} style={{ border: "none" }}>
                        <Stack align="center" gap="xs" py="xl">
                          <Box style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--mantine-color-white)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--mantine-color-slate-2)" }}>
                            <IconBriefcase size={24} color="var(--mantine-color-slate-4)" />
                          </Box>
                          <Text ta="center" c="slate.5" fz="xs">No products match your filters.</Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    rows.map((row) => {
                      const isActive = row.original.status === "ACTIVE";
                      return (
                        <Table.Tr key={row.id} className="lms-row">
                          {row.getVisibleCells().map((cell, idx) => (
                            <Table.Td
                              key={cell.id}
                              style={{ padding: "10px 10px", border: "none", boxShadow: "var(--mantine-shadow-xs)", borderLeft: idx === 0 ? `3px solid var(--mantine-color-${isActive ? "success" : "danger"}-4)` : undefined }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
              <Group gap="sm" c="slate.6" style={{ fontSize: "var(--mantine-font-size-xs)" }}>
                <span>{totalRows === 0 ? "Showing 0 of 0" : `Showing ${firstRow}-${lastRow} of ${totalRows}`}</span>
                <Group gap="xs">
                  <span>Rows:</span>
                  <Select
                    data={["10", "20", "50"]}
                    value={String(pageSize)}
                    onChange={(v) => { setPageSize(Number(v) || 10); setPage(1); }}
                    rightSection={chevronDown}
                    size="xs"
                    radius="xl"
                    w={60}
                  />
                </Group>
              </Group>
              <Pagination total={totalPages} value={page} onChange={setPage} color="brand" size="xs" radius="xl" disabled={totalRows === 0} />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}