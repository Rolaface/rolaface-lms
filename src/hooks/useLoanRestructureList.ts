import { useCallback, useEffect, useState } from "react";
import {
  getAllLoanRestructures,
  deleteLoanRestructure,
  approveLoanRestructure,
  type LoanRestructureListItem,
  type LoanRestructurePagination,
  type LoanRestructureStatus,
} from "../api/loanRestructureApi";
import { showSuccess, showApiError } from "../utils/alert";
import { parseFrappeError } from "../utils/parseFrappeError";

export function useLoanRestructureList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LoanRestructureStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState("creation desc");

  const [rows, setRows] = useState<LoanRestructureListItem[]>([]);
  const [pagination, setPagination] = useState<LoanRestructurePagination | null>(null);
  const [loading, setLoading] = useState(false);


  const [approvingName, setApprovingName] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllLoanRestructures({ page, page_size: pageSize, order_by: orderBy, search, status });
      setRows(res.restructures);
      setPagination(res.pagination);
    } catch (err) {
      showApiError(parseFrappeError(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, orderBy, search, status]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchList, 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  const handleDelete = async (name: string) => {
    try {
      await deleteLoanRestructure(name);
      showSuccess("Restructure request deleted successfully.");
      fetchList();
    } catch (err) {
      showApiError(parseFrappeError(err));
    }
  };

  const handleApprove = async (name: string) => {
    setApprovingName(name);
    try {
      await approveLoanRestructure(name);
      showSuccess("Restructure request approved successfully.");
      fetchList();
    } catch (err) {
      showApiError(parseFrappeError(err));
    } finally {
      setApprovingName(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  return {
    search, setSearch,
    status, setStatus,
    page, setPage,
    pageSize, setPageSize,
    orderBy, setOrderBy,
    rows, pagination, loading,
    refetch: fetchList,
    handleDelete,
    handleApprove,
    approvingName,
    resetFilters,
  };
}