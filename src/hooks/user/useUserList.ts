import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, getUserById, deleteUser, type UserRow } from "../../api/User/userApi";
import { userModal } from "../../components/Modal/User/Usermodalstore";
import type { CreateUserFormData } from "../../types/User/createUser";
import { openCommonModal } from "../../components/Modal/AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";

const DEBOUNCE_MS = 350;

export function useUserList() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null); // edit/view fetch

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["lmsUsers", search, page, pageSize],
    queryFn: () => getUsers(search || undefined, page, pageSize),
    placeholderData: (prev) => prev,
  });

  const rows: UserRow[] = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      await queryClient.invalidateQueries({ queryKey: ["lmsUsers"] });
    } catch (error) {
      openCommonModal({
        heading: "Error",
        body: parseFrappeError(error),
        color: "danger",
        buttons: [{ label: "OK" }],
      });
    } finally {
      setDeletingId(null);
    }
  };

  const loadAndOpen = async (row: UserRow, isView: boolean) => {
    setLoadingId(row.id);
    try {
      const res = await getUserById(row.id);
      const d = res.message.data;
      const initialData: CreateUserFormData = {
        email: d.email,
        username: d.username,
        language: d.language ?? "",
        firstName: d.firstName ?? "",
        middleName: d.middleName ?? "",
        lastName: d.lastName ?? "",
        roleIds: d.roles ?? [],
        gender: d.gender ?? "",
        phone: d.phone ?? "",
        dob: d.dob ?? "",
        timezone: d.timezone ?? "",
        mobile_no: d.mobile_no ?? "",
      };
      userModal.open({ editId: row.id, isView, initialData });
    } catch (error) {
      openCommonModal({
        heading: "Error",
        body: parseFrappeError(error),
        color: "danger",
        buttons: [{ label: "OK" }],
      });
    } finally {
      setLoadingId(null);
    }
  };

  const openEdit = (row: UserRow) => loadAndOpen(row, false);
  const openView = (row: UserRow) => loadAndOpen(row, true);

  return {
    searchInput, setSearchInput,
    page, setPage,
    pageSize, setPageSize,
    rows, pagination,
    loading: isLoading || isFetching,
    refetch,
    handleDelete, deletingId,
    openEdit, openView, loadingId,
  };
}