import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, NumberInput, Pagination, Select, Table, Text } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { getCharges, type LoanChargeOption } from "../../../api/loanRestructureApi";
import { getSymbol, useCurrencyReady } from "../../../store/currencyStore";
import { useCompanyStore } from "../../../store/companyStore";
import type { ChargeRow } from "../../../hooks/useLoanRestructureForm";

const PAGE_SIZE = 3;
const LOAD_MORE_VALUE = "__load_more__";

const ROWS_PER_PAGE = 3;

function useChargeTypeOptions() {
  const [options, setOptions] = useState<LoanChargeOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchRef = useRef("");

  const fetchPage = async (targetPage: number, searchTerm: string, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCharges({ page: targetPage, page_size: PAGE_SIZE, search: searchTerm || undefined });
      setOptions((prev) => (append ? [...prev, ...res.data] : res.data));
      setHasNext(res.pagination.has_next);
      setPage(targetPage);
    } catch (err: any) {
      setError(err?.message || "Failed to load charges.");
    } finally {
      setLoading(false);
    }
  };

  const ensureLoaded = () => {
    if (loadedOnce || loading) return;
    setLoadedOnce(true);
    fetchPage(1, "", false);
  };

  const triggerSearch = (value: string) => {
    lastSearchRef.current = value;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchPage(1, value.trim(), false);
    }, 300);
  };

  const loadMore = () => {
    if (!hasNext || loading) return;
    fetchPage(page + 1, lastSearchRef.current.trim(), true);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  return { options, hasNext, loading, error, triggerSearch, loadMore, ensureLoaded };
}

interface ChargeTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LoanChargeOption[];
  hasNext: boolean;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onLoadMore: () => void;
  onOpen: () => void;
  disabled?: boolean;
}

function ChargeTypeSelect({
  value,
  onChange,
  options,
  hasNext,
  loading,
  error,
  onSearch,
  onLoadMore,
  onOpen,
  disabled,
}: ChargeTypeSelectProps) {
  const [searchValue, setSearchValue] = useState("");

  const base = options.map((o) => ({ value: o.value, label: o.label }));
  const hasSelected = value && base.some((o) => o.value === value);
  const withSelected = value && !hasSelected ? [{ value, label: value }, ...base] : base;
  const data = hasNext
    ? [...withSelected, { value: LOAD_MORE_VALUE, label: loading ? "Loading…" : "Load more…" }]
    : withSelected;

  return (
    <Select
      size="sm"
      placeholder="Select charge "
      searchable
      disabled={disabled}
      data={data}
      value={value || null}
      searchValue={searchValue}
      onSearchChange={(v) => {
        setSearchValue(v);
        onSearch(v);
      }}
      onDropdownOpen={onOpen}
      nothingFoundMessage={loading ? "Loading…" : error ? error : "No charges found"}
      onChange={(v) => {
        if (!v) return;
        if (v === LOAD_MORE_VALUE) {
          onLoadMore();
          return;
        }
        onChange(v);
        setSearchValue("");
      }}
    />
  );
}

interface RestructureChargesTabProps {
  chargeRows: ChargeRow[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, patch: Partial<Pick<ChargeRow, "charge" | "amount">>) => void;
  disabled?: boolean;
}

export function RestructureChargesTab({
  chargeRows,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  disabled = false,
}: RestructureChargesTabProps) {
  const baseCurrency = useCompanyStore((s) => s.baseCurrency);
  const currencyReady = useCurrencyReady();
  const currencySymbol = currencyReady ? getSymbol(baseCurrency) : "";

  const { options, hasNext, loading, error, triggerSearch, loadMore, ensureLoaded } = useChargeTypeOptions();

  const amountLabel = currencySymbol ? `Charge Amount (${currencySymbol})` : "Charge Amount";

  // ---------- Table pagination (4 rows per page) ----------
  const [activePage, setActivePage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(chargeRows.length / ROWS_PER_PAGE));
  const prevRowCountRef = useRef(chargeRows.length);

  useEffect(() => {
    if (activePage > totalPages) setActivePage(totalPages);
  }, [totalPages, activePage]);

  useEffect(() => {
    if (chargeRows.length > prevRowCountRef.current) {
      setActivePage(Math.max(1, Math.ceil(chargeRows.length / ROWS_PER_PAGE)));
    }
    prevRowCountRef.current = chargeRows.length;
  }, [chargeRows.length]);

  const pagedRows = chargeRows.slice((activePage - 1) * ROWS_PER_PAGE, activePage * ROWS_PER_PAGE);

  return (
    <div>
      <Table verticalSpacing="sm" horizontalSpacing="md" fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ minWidth: 220 }}>Charge</Table.Th>
            <Table.Th style={{ minWidth: 160 }}>{`Charge Amount${currencySymbol ? ` (${currencySymbol})` : ""}`}</Table.Th>
            {!disabled && <Table.Th style={{ width: 48 }} />}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {chargeRows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={disabled ? 2 : 3}>
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No charges added yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            pagedRows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <ChargeTypeSelect
                    value={row.charge}
                    onChange={(v) => onUpdateRow(row.id, { charge: v })}
                    options={options}
                    hasNext={hasNext}
                    loading={loading}
                    error={error}
                    onSearch={triggerSearch}
                    onLoadMore={loadMore}
                    onOpen={ensureLoaded}
                    disabled={disabled}
                  />
                </Table.Td>

                <Table.Td>
                  <NumberInput
                    size="sm"
                    placeholder="e.g. 1500"
                    aria-label={amountLabel}
                    value={row.amount}
                    disabled={disabled}
                    onChange={(v) => onUpdateRow(row.id, { amount: v as number | "" })}
                    decimalScale={2}
                    thousandSeparator=","
                    hideControls
                    min={0}
                  />
                </Table.Td>
                {!disabled && (
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="danger"
                      radius="md"
                      onClick={() => onRemoveRow(row.id)}
                      aria-label="Remove charge row"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      {chargeRows.length > ROWS_PER_PAGE && (
        <div className="flex justify-end mt-3">
          <Pagination
            size="sm"
            color="brand"
            total={totalPages}
            value={activePage}
            onChange={setActivePage}
          />
        </div>
      )}

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          color="brand"
          size="xs"
          mt="sm"
          leftSection={<IconPlus size={14} />}
          onClick={onAddRow}
        >
          Add Charge
        </Button>
      )}
    </div>
  );
}