import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Stack, Text } from "@mantine/core";
import * as LoanApplicationApi from "../../api/LosConfiguration/LoanApplicationApi";
import type { LoanApplication, StagePayload } from "../../api/LosConfiguration/LoanApplicationApi";
import { uploadFile } from "../../api/loanApi";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { valuesFromApplication } from "./LoanApplication/form";

export function productTerms(application: LoanApplication) {
  const eligibility = (application.prescreening_data?.engine?.eligibility ?? {}) as Record<string, any>;
  return {
    rate: Number(application.interest_rate) || Number(eligibility.rate_of_interest) || 0,
    maxDTI: Number(eligibility.max_emi_ratio) || Number(eligibility.max_dti_ratio) || Number(application.prescreening_data?.policy?.max_dti) || 0,
  };
}

export const sumAmounts = (items?: { monthly_amount: number }[] | null) =>
  (items ?? []).reduce((total, item) => total + (Number(item.monthly_amount) || 0), 0);

export async function uploadStageFile(file: File) {
  return (await uploadFile(file)).file_url;
}

export function useStageApplication(id?: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["los-loan-application", id, "stage"],
    queryFn: () => LoanApplicationApi.getById(id as string),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: (payload: StagePayload) => LoanApplicationApi.update(id as string, payload),
    onSuccess: (application) => {
      queryClient.setQueryData(["los-loan-application", id, "stage"], application);
      queryClient.invalidateQueries({ queryKey: ["los-loan-applications"] });
      queryClient.invalidateQueries({ queryKey: ["los-loan-application", id] });
    },
  });

  const application = query.data;
  const values = useMemo(
    () => (application ? valuesFromApplication(application, new WeakMap()) : undefined),
    [application],
  );

  const save = async (payload: StagePayload) => {
    try {
      return await mutation.mutateAsync(payload);
    } catch (error) {
      openCommonModal({
        heading: "Action Failed",
        subtitle: "We couldn't complete your request.",
        body: parseFrappeError(error),
        color: "red",
        buttons: [{ label: "Close", color: "red" }],
      });
      return null;
    }
  };

  return { application, values, isLoading: query.isLoading, error: query.error, save, saving: mutation.isPending };
}

export function StageLoading({ error }: { error?: unknown }) {
  return (
    <Stack align="center" justify="center" gap="xs" py={80}>
      {error ? (
        <Text fz="sm" c="red.6">
          {parseFrappeError(error)}
        </Text>
      ) : (
        <>
          <Loader size="sm" color="brand" />
          <Text fz="xs" c="slate.5">
            Loading application…
          </Text>
        </>
      )}
    </Stack>
  );
}
