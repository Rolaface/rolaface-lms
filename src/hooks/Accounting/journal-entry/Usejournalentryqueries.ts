import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntryById,
} from "../../../api/Accounting/Journalentries.api";
import type { JournalEntryPayload } from "../../../api/Accounting/Journalentries.api";

export const journalEntryKeys = {
  all: ["journalEntries"] as const,
  detail: (id: string) => ["journalEntries", "detail", id] as const,
};


export function useJournalEntryDetail(entryId?: string | null) {
  return useQuery({
    queryKey: journalEntryKeys.detail(entryId ?? ""),
    queryFn: () => getJournalEntryById(entryId as string),
    enabled: !!entryId,
    staleTime: 0, 
    select: (res: any) =>
      res?.data?.data || res?.data?.message || res?.data || res?.message || res,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JournalEntryPayload) => createJournalEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.all });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<JournalEntryPayload> }) =>
      updateJournalEntryById(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.all });
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.detail(variables.id) });
    },
  });
}