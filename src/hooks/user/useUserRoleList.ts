import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserRoles,
  getUserRoleById,
  updateUserRoleStatus,
} from "../../api/User/roleApi";
import { roleModal } from "../../components/Modal/User/Rolemodalstore";
import type { UserRoleFormData } from "../../types/User/userRole";

const DEBOUNCE_MS = 350;

export function useUserRoleList() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null); // edit/view fetch

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["userRoles", search, page, pageSize],
    queryFn: () => getUserRoles(search || undefined, page, pageSize),
    placeholderData: (prev) => prev,
  });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  const handleToggleStatus = async (id: string, currentlyDisabled: 0 | 1) => {
    setTogglingId(id);
    try {
      await updateUserRoleStatus(id, currentlyDisabled ? 0 : 1);
      await queryClient.invalidateQueries({ queryKey: ["userRoles"] });
    } finally {
      setTogglingId(null);
    }
  };

  const loadAndOpen = async (id: string, isView: boolean) => {
    setLoadingId(id);
    try {
      const res = await getUserRoleById(id);
      const d = res.message.data;
      const initialData: UserRoleFormData = {
        role: d.roleName,
        permission: d.permissions,
      };
      roleModal.open({ editId: id, isView, initialData });
    } finally {
      setLoadingId(null);
    }
  };

  const openEdit = (id: string) => loadAndOpen(id, false);
  const openView = (id: string) => loadAndOpen(id, true);

  return {
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows,
    pagination,
    loading: isLoading || isFetching,
    refetch,
    handleToggleStatus,
    togglingId,
    openEdit,
    openView,
    loadingId,
  };
}