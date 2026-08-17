import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type PLData,
  type ProfitLossFilters,
  fetchProfitAndLoss,
} from "../../api/Accounting/Profitloss.api";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";
import { useCompanyStore } from "../../store/companyStore";
import {
  formatAmount as storeFormatAmount,
  ensureCurrencies,
  useCurrencyReady,
} from "../../store/currencyStore";

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
};

const FALLBACK_FY = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

export function useProfitLoss() {
  const initialFilters: ProfitLossFilters = {
    mode: "Fiscal Year",
    periodicity: "Monthly",
    from_fiscal_year: FALLBACK_FY,
    to_fiscal_year: FALLBACK_FY,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  };

  const [filters, setFilters] = useState<ProfitLossFilters>(initialFilters);
  const [fyResolved, setFyResolved] = useState(false);

  const lastAppliedFiltersRef = useRef<ProfitLossFilters | null>(null);


  const initialDefaultsRef = useRef<ProfitLossFilters>(initialFilters);

  const [data, setData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useCurrencyReady();
  const baseCurrency = useCompanyStore((state) => state.baseCurrency);

  useEffect(() => {
    if (baseCurrency) ensureCurrencies([baseCurrency]);
  }, [baseCurrency]);

  useEffect(() => {
    let cancelled = false;
    getCompanyCurrentFiscalYear()
      .then((fy) => {
        if (cancelled || !fy) return;
        setFilters((f) => ({
          ...f,
          from_fiscal_year: fy.fiscal_year,
          to_fiscal_year: fy.fiscal_year,
        }));
   
        initialDefaultsRef.current = {
          ...initialDefaultsRef.current,
          from_fiscal_year: fy.fiscal_year,
          to_fiscal_year: fy.fiscal_year,
        };
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFyResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = useCallback(async (currentFilters: ProfitLossFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      if (
        currentFilters.mode === "Date Range" &&
        (!currentFilters.from_date || !currentFilters.to_date)
      ) {
        setError("Please select a valid date range.");
        return;
      }
      const res = await fetchProfitAndLoss(currentFilters);
      setData(res);
  
      lastAppliedFiltersRef.current = currentFilters;
    } catch (err: any) {
      setError(err?.message ?? "Failed to load Profit & Loss.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filters.mode === "Fiscal Year" && !fyResolved) return;

    let resolved = filters;
    const lastApplied = lastAppliedFiltersRef.current;
    if (lastApplied) {
      resolved = {
        ...filters,
        from_date: filters.from_date || lastApplied.from_date,
        to_date: filters.to_date || lastApplied.to_date,
        from_fiscal_year:
          filters.from_fiscal_year || lastApplied.from_fiscal_year,
        to_fiscal_year:
          filters.to_fiscal_year || lastApplied.to_fiscal_year,
      };
    }

    if (
      resolved.mode === "Date Range" &&
      (!resolved.from_date || !resolved.to_date)
    )
      return;
    if (
      resolved.mode === "Fiscal Year" &&
      (!resolved.from_fiscal_year || !resolved.to_fiscal_year)
    )
      return;

    const timer = setTimeout(() => fetchData(resolved), 300);
    return () => clearTimeout(timer);
    // `lastAppliedFiltersRef` intentionally excluded — it's a ref, reading
    // `.current` doesn't need to be tracked as a dependency.
  }, [filters, fyResolved, fetchData]);


  const handleFieldBlur = useCallback(
    (
      field: "from_date" | "to_date" | "from_fiscal_year" | "to_fiscal_year",
    ) => {
      const fallback = initialDefaultsRef.current[field];
      if (!fallback) return;
      setFilters((f) => (f[field] ? f : { ...f, [field]: fallback }));
    },

    [],
  );

  const tableData = useMemo(() => {
    if (!data) return [];
    return [...data.income, ...data.expense];
  }, [data]);


  const displayAmount = useCallback(
    (amount: number) => {
      if (!amount) return "—";
      return storeFormatAmount(baseCurrency, amount, { withSymbol: true });
    },
    [baseCurrency],
  );

  const handleRefresh = useCallback(
    () => fetchData(filters),
    [fetchData, filters],
  );

  return {
    filters,
    setFilters,
    data,
    tableData,
    isLoading,
    error,
    displayAmount,
    handleRefresh,
    handleFieldBlur,
  };
}