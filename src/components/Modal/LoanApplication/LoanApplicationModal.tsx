import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Text,
  Button,
  Modal,
  ActionIcon,
  ThemeIcon,
  Group,
  ScrollArea,
  Fieldset,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconX, IconCheck, IconFileText } from "@tabler/icons-react";

import { GradientButton } from "../../shared/customer/Shared";
import { BasicDetails } from "./BasicDetails";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import { getTodayDate } from "../../../utils/loanCalculations";
// TODO: point these at your real loan-application endpoints — assumed to
// mirror createLoan / updateLoan / getLoanById from api/loanApi.ts.
import {
  createLoanApplication,
  updateLoanApplication,
  getLoanApplicationById,
} from "../../../api/loanApplicationApi";

interface LoanApplicationModalProps {
  opened: boolean;
  onClose: () => void;
  loanApplicationId?: string | null;
  isViewMode?: boolean;
}

export interface LoanApplicationFormValues {
  applicant_email_address: string;
  applicant_phone_number: string;
  phone_country_code: string;
  applicant_name: string;
  posting_date: string;
  status: string;
  loan_purpose: string;
  loan_product: string;
  loan_amount: number | "";
  rate_of_interest: number | "";
  is_term_loan: boolean;
  is_secured_loan: boolean;
  repayment_method: string;
  repayment_periods: number | "";
  monthly_repayment_amount: number | "";
  repayment_start_date: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  zip_code: number | "";
}

const INITIAL_VALUES: LoanApplicationFormValues = {
  applicant_email_address: "",
  applicant_phone_number: "",
  phone_country_code: "+91",
  applicant_name: "",
  posting_date: getTodayDate(),
  status: "Open",
  loan_purpose: "",
  loan_product: "",
  loan_amount: "",
  rate_of_interest: "",
  is_term_loan: true,
  is_secured_loan: false,
  repayment_method: "Repay Over Number of Periods",
  repayment_periods: "",
  monthly_repayment_amount: "",
  repayment_start_date: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "",
  zip_code: "",
};

export function LoanApplicationModal({
  opened,
  onClose,
  loanApplicationId,
  isViewMode,
}: LoanApplicationModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<LoanApplicationFormValues>({
    initialValues: INITIAL_VALUES,
    validate: {
    //   applicant: (v) => (!v ? "Applicant is required" : null),
      applicant_email_address: (v) =>
        !v ? "Email is required" : /^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email",
    //   applicant_phone_number: (v) => (!v ? "Phone number is required" : null),
    applicant_phone_number: (v) =>
  !v
    ? "Phone number is required"
    : /^\d{10}$/.test(v)
    ? null
    : "Enter a valid 10-digit phone number",
      posting_date: (v) => (!v ? "Application date is required" : null),
      loan_product: (v) => (!v ? "Loan product is required" : null),
      loan_amount: (v) => (!v ? "Loan amount is required" : null),
      repayment_method: (v) => (!v ? "Repayment method is required" : null),
      repayment_periods: (v, values) =>
        values.repayment_method === "Repay Over Number of Periods" && !v
          ? "Repayment period is required"
          : null,
      monthly_repayment_amount: (v, values) =>
        values.repayment_method === "Repay Fixed Amount per Period" && !v
          ? "Monthly repayment amount is required"
          : null,
    },
  });

  const { data: existingApplication, isLoading: isFetching } = useQuery({
    queryKey: ["loan-application", loanApplicationId],
    queryFn: async () => await getLoanApplicationById(loanApplicationId as string),
    enabled: !!loanApplicationId && opened === true,
    refetchOnMount: "always",
  });

  useEffect(() => {
    const application = existingApplication?.message?.data;
    if (application) {
         const rawPhone = application.applicant_phone_number || "";
    const [phoneCode, phoneNumber] = rawPhone.includes("-")
      ? [rawPhone.split("-")[0], rawPhone.split("-").slice(1).join("-")]
      : ["+91", rawPhone];
      form.setValues({
        applicant_email_address: application.applicant_email_address || "",
        phone_country_code: phoneCode || "+91",
      applicant_phone_number: phoneNumber || "",
        applicant_name: application.applicant_name || "",
         posting_date: application.posting_date || getTodayDate(),
        status: application.status || "Open",
        address_line_1: application.address_line_1 || "",
address_line_2: application.address_line_2 || "",
city: application.city || "",
state: application.state || "",
country: application.country || "",
zip_code: application.zip_code ?? "",
        loan_purpose: application.loan_purpose || "",
        loan_product: application.loan_product || "",
        loan_amount: application.loan_amount ?? "",
        rate_of_interest: application.rate_of_interest ?? "",
        is_term_loan: !!application.is_term_loan,
        is_secured_loan: !!application.is_secured_loan,
        repayment_method: application.repayment_method || "Repay Over Number of Periods",
        repayment_periods: application.repayment_periods ?? "",
        monthly_repayment_amount: application.monthly_repayment_amount ?? "",
        repayment_start_date: application.repayment_start_date || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingApplication]);

  const createMutation = useMutation({
    mutationFn: createLoanApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
      handleModalClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLoanApplication,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
      queryClient.invalidateQueries({ queryKey: ["loan-application", variables.id] });
      handleModalClose();
    },
  });

  const handleSubmit = (values: LoanApplicationFormValues) => {
    const payload: any = {
      applicant_email_address: values.applicant_email_address,
         applicant_phone_number: `${values.phone_country_code}-${values.applicant_phone_number}`,
      applicant_name: values.applicant_name,
      address_line_1: values.address_line_1 || undefined,
address_line_2: values.address_line_2 || undefined,
city: values.city || undefined,
state: values.state || undefined,
country: values.country || undefined,
zip_code: values.zip_code || undefined,
      posting_date: values.posting_date,
      status: values.status,
      loan_purpose: values.loan_purpose,
      loan_product: values.loan_product,
      loan_amount: Number(values.loan_amount),
      rate_of_interest: Number(values.rate_of_interest) || 0,
      is_term_loan: values.is_term_loan ? 1 : 0,
      is_secured_loan: values.is_secured_loan ? 1 : 0,
      repayment_method: values.repayment_method,
      repayment_start_date: values.repayment_start_date || undefined,
    };

    if (values.repayment_method === "Repay Over Number of Periods") {
      payload.repayment_periods = Number(values.repayment_periods);
    } else {
      payload.monthly_repayment_amount = Number(values.monthly_repayment_amount);
    }

    if (loanApplicationId) {
      updateMutation.mutate({ id: loanApplicationId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleReset = () => {
    form.setValues(INITIAL_VALUES);
    form.resetDirty(INITIAL_VALUES);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleModalClose = () => {
    if (loanApplicationId) {
      queryClient.removeQueries({ queryKey: ["loan-application", loanApplicationId] });
    }
    handleReset();
    onClose();
  };

  const headerTitle = loanApplicationId
    ? isViewMode
      ? "View Loan Application"
      : "Update Loan Application"
    : "New Loan Application";

  const isSubmitting = createMutation.isPending || updateMutation.isPending || isFetching;

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size={1040}
      padding={0}
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "88vh",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          minHeight: 0,
          overflow: "hidden",
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} style={{ height: "100%" }}>
        <Box style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }} bg="white">
          {/* Header */}
          <Group
            justify="space-between"
            align="center"
            px="xl"
            py="sm"
            bg="brand.6"
            style={{ borderBottom: "1px solid var(--mantine-color-brand-7)", flexShrink: 0 }}
          >
            <Group gap="sm">
              <ThemeIcon radius="md" size={34} variant="white" color="brand">
                <IconFileText size={16} />
              </ThemeIcon>
              <Box>
                <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                  {headerTitle}
                </Text>
                <Text size="xs" fw={500} c="brand.1">
                  Applicant, loan and repayment details
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={handleModalClose}
              aria-label="Close"
            >
              <IconX size={16} color="white" />
            </ActionIcon>
          </Group>

          {/* Body */}
          <ScrollArea type="auto" scrollbarSize={8} style={{ flex: 1, minHeight: 0 }} bg="slate.0">
            <Box mx="auto" pt="md" pl="lg" pr="lg" pb="md">
              <Fieldset disabled={isViewMode} variant="unstyled" p={0} m={0}>
                <BasicDetails form={form} />
              </Fieldset>
            </Box>
          </ScrollArea>

          {/* Footer */}
          <Group
            justify="space-between"
            px="xl"
            py="md"
            style={{ borderTop: "1px solid var(--mantine-color-slate-2)", flexShrink: 0 }}
          >
            <Group gap="md">
              <Button variant="subtle" color="slate" onClick={handleModalClose}>
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </Group>

            {!isViewMode && (
              <Group gap="sm" align="center">
                {(createMutation.isError || updateMutation.isError) && (
                  <Text size="xs" c="red">
                    {parseFrappeError(createMutation.error || updateMutation.error)}
                  </Text>
                )}
                <GradientButton
                  type="submit"
                  px="xl"
                  loading={isSubmitting}
                  rightSection={<IconCheck size={14} />}
                >
                  {loanApplicationId ? "Update Application" : "Submit Application"}
                </GradientButton>
              </Group>
            )}
          </Group>
        </Box>
      </form>
    </Modal>
  );
}