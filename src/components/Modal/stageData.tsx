import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Stack, Text } from "@mantine/core";
import * as LoanApplicationApi from "../../api/LosConfiguration/LoanApplicationApi";
import type { LoanApplication, StagePayload } from "../../api/LosConfiguration/LoanApplicationApi";
import { uploadFile } from "../../api/loanApi";
import { openCommonModal } from "./AlertModal";
import { parseFrappeError } from "../../utils/parseFrappeError";
import { SIMULATION_RANGE, valuesFromApplication } from "./LoanApplication/form";

const POLICIES = {
  personal: { minCreditScore: 650, maxDTI: 50, productMax: 100000 },
  business: { minCreditScore: 620, maxDTI: 55, productMax: 500000 },
  mortgage: { minCreditScore: 680, maxDTI: 45, productMax: 2000000 },
};

export function stagePolicy(application: LoanApplication) {
  const key =
    application.applicant_type === "Business"
      ? "business"
      : application.loan_type_name === "Home Loan"
        ? "mortgage"
        : "personal";
  return { ...POLICIES[key], rate: SIMULATION_RANGE[application.applicant_type].rate };
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
