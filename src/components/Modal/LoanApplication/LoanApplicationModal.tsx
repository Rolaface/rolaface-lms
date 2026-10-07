import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  Box,
  Group,
  Text,
  Button,
  ActionIcon,
  ScrollArea,
  ThemeIcon,
  Divider,
  UnstyledButton,
  Loader,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconX,
  IconFileText,
  IconChevronRight,
  IconUser,
  IconBuilding,
  IconBriefcase,
  IconFileInvoice,
  IconUsers,
  IconArrowRight,
  IconMinus,
  IconCheck,
  IconHomeDollar,
} from "@tabler/icons-react";
import { PersonalBusinessInfoStep } from "./PersonalBusinessInfoStep";
import { ResidenceEmploymentStep } from "./ResidenceEmploymentStep";
import { DocumentsStep } from "./DocumentsStep";
import { CustomerLoanStep } from "./CustomerLoanStep";
import { EligibilitySimulationStep } from "./EligibilitySimulationStep";
import { Review } from "./Review";
import { ApplicationSummary } from "./ApplicationSummary";
import { EmploymentDetails } from "./EmploymentDetails";
import { Applicant } from "./Applicant";
import { Collateral } from "./Collateral";
import * as LoanApplicationApi from "../../../api/LosConfiguration/LoanApplicationApi";
import type { ApplicationDocument, LoanApplicationPayload } from "../../../api/LosConfiguration/LoanApplicationApi";
import { uploadFile } from "../../../api/loanApi";
import { openCommonModal } from "../AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";
import {
  DOCUMENT_KEYS,
  DOCUMENT_NAMES,
  EMAIL_REGEX,
  OPTIONAL_DOCUMENTS,
  SIMULATION_RANGE,
  buildPayload,
  computeSimulation,
  createInitialValues,
  directorDocName,
  isAddressFilled,
  valuesFromApplication,
  type ApplicantType,
  type DocumentKey,
  type LoanApplicationValues,
} from "./form";

export type {
  LoanApplicationValues,
  DirectorEntry,
  DirectorDocEntry,
  CollateralEntry,
  ApplicantType,
} from "./form";

const STEP_LABELS: Record<ApplicantType, string[]> = {
  Individual: ["Customer & Loan", "Applicant", "Residence", "Employment", "Collateral", "Documents", "Simulation", "Review"],
  Business: ["Customer & Loan", "Business", "Directors", "Applicant", "Collateral", "Documents", "Simulation", "Review"],
};

const STEP_ICONS: Record<ApplicantType, React.FC<any>[]> = {
  Individual: [IconUsers, IconUser, IconBriefcase, IconBriefcase, IconHomeDollar, IconFileText, IconCheck, IconFileInvoice],
  Business: [IconUsers, IconBuilding, IconBuilding, IconUsers, IconHomeDollar, IconFileText, IconCheck, IconFileInvoice],
};

const SUBMIT_STEP = 6;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const PERSON_FIELDS = [
  "first_name",
  "last_name",
  "nrc",
  "phone",
  "email",
  "date_of_birth",
  "gender",
  "marital_status",
  "nationality",
];
const addressPaths = (key: string) => [`${key}.address_line1`, `${key}.city`, `${key}.country`];

function stepPaths(values: LoanApplicationValues, step: number): string[] {
  const isBusiness = values.applicant_type === "Business";
  switch (step) {
    case 0:
      return ["customer_type", "customer", "loan_type", "loan_sub_type", "loan_purpose"];
    case 1:
      return isBusiness
        ? [
            "company_name",
            "registration_number",
            "tpin",
            "credit_score",
            "business_type",
            "established_date",
            "nature_of_business",
            ...addressPaths("office_address"),
          ]
        : [...PERSON_FIELDS, "kin_name", "kin_relationship", "kin_phone", "kin_email"];
    case 2:
      return isBusiness
        ? values.directors.flatMap((_, i) => ["full_name", "nrc", "phone", "email"].map((f) => `directors.${i}.${f}`))
        : [...addressPaths("current_address"), ...addressPaths("permanent_address")];
    case 3:
      return isBusiness
        ? [...PERSON_FIELDS, "position", ...addressPaths("current_address"), ...addressPaths("permanent_address")]
        : ["employment_status", "employment_type", "employer_name", "designation", "experience_years", "credit_score"];
    case 4:
      return values.collaterals.flatMap((_, i) => [`collaterals.${i}.collateral_type`, `collaterals.${i}.estimated_value`]);
    case 5:
      return [
        ...DOCUMENT_KEYS[values.applicant_type].map((key) => `documents.${key}`),
        ...(isBusiness
          ? values.directorDocuments.flatMap((_, i) => [`directorDocuments.${i}.nrcFile`, `directorDocuments.${i}.photoFile`])
          : []),
      ];
    case 6:
      return ["requested_amount", "tenure_months"];
    default:
      return [];
  }
}

const required = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && !value.trim()) ? "Required" : null;

const email = (value: string) => required(value) ?? (EMAIL_REGEX.test(value.trim()) ? null : "Enter a valid email address");

const fileRule = (value: File | null, isRequired: boolean) => {
  if (!value) return isRequired ? "Required" : null;
  if (value.size > 0 && !ALLOWED_FILE_TYPES.includes(value.type)) return "Only PDF, JPEG, JPG or PNG files are allowed";
  return null;
};

const addressRule = (
  isRequired: (values: LoanApplicationValues) => boolean,
  key: "current_address" | "permanent_address" | "office_address",
) => {
  const check = (value: unknown, values: LoanApplicationValues) => {
    if (key === "permanent_address" && values.permanent_same_as_current) return null;
    return isRequired(values) || isAddressFilled(values[key]) ? required(value) : null;
  };
  return { address_line1: check, city: check, country: check };
};

const isBusinessApp = (values: LoanApplicationValues) => values.applicant_type === "Business";
const individualOnly = (rule: (value: any) => string | null) => (value: any, values: LoanApplicationValues) =>
  isBusinessApp(values) ? null : rule(value);
const businessOnly = (rule: (value: any) => string | null) => (value: any, values: LoanApplicationValues) =>
  isBusinessApp(values) ? rule(value) : null;

interface LoanApplicationModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onExited?: () => void;
  loanApplicationId?: string | null;
  readOnly?: boolean;
  embedded?: boolean;
  initialValues?: LoanApplicationValues;
}

export function LoanApplicationModal({
  opened,
  onClose,
  onMinimize,
  onExited,
  loanApplicationId,
  readOnly = false,
  embedded = false,
  initialValues,
}: LoanApplicationModalProps) {
  const queryClient = useQueryClient();
  const [existingUrls] = useState(() => new WeakMap<File, string>());
  const loadedValues = useRef<LoanApplicationValues | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [directorsError, setDirectorsError] = useState<string | null>(null);
  const [directorDocsError, setDirectorDocsError] = useState<string | null>(null);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  const form = useForm<LoanApplicationValues>({
    initialValues: embedded && initialValues ? initialValues : createInitialValues(),
    validate: {
      customer_type: required,
      customer: (value, values) => (values.customer_type === "Existing" ? required(value) : null),
      loan_type: required,
      loan_sub_type: required,
      loan_purpose: required,
      requested_amount: (value) => (required(value) ?? (Number(value) > 0 ? null : "Must be more than 0")),
      tenure_months: (value) =>
        required(value) ?? (Number.isInteger(Number(value)) && Number(value) > 0 ? null : "Enter whole months"),
      first_name: required,
      last_name: required,
      nrc: required,
      phone: required,
      email,
      date_of_birth: required,
      gender: required,
      marital_status: required,
      nationality: required,
      position: businessOnly(required),
      kin_name: individualOnly(required),
      kin_relationship: individualOnly(required),
      kin_phone: individualOnly(required),
      kin_email: individualOnly(email),
      employment_status: individualOnly(required),
      employment_type: individualOnly(required),
      employer_name: individualOnly(required),
      designation: individualOnly(required),
      experience_years: individualOnly(required),
      credit_score: (value) =>
        required(value) ?? (Number(value) >= 300 && Number(value) <= 850 ? null : "Enter a score between 300 and 850"),
      company_name: businessOnly(required),
      registration_number: businessOnly(required),
      tpin: businessOnly(required),
      business_type: businessOnly(required),
      established_date: businessOnly(required),
      nature_of_business: businessOnly(required),
      current_address: addressRule((values) => !isBusinessApp(values), "current_address"),
      permanent_address: addressRule(() => false, "permanent_address"),
      office_address: addressRule(isBusinessApp, "office_address"),
      directors: {
        full_name: businessOnly(required),
        nrc: businessOnly(required),
        phone: businessOnly(required),
        email: businessOnly(email),
      },
      collaterals: {
        collateral_type: required,
        estimated_value: (value) => required(value) ?? (Number(value) > 0 ? null : "Must be more than 0"),
      },
      documents: Object.fromEntries(
        (Object.keys(DOCUMENT_NAMES) as DocumentKey[]).map((key) => [
          key,
          (value: File | null, values: LoanApplicationValues) =>
            DOCUMENT_KEYS[values.applicant_type].includes(key) ? fileRule(value, !OPTIONAL_DOCUMENTS.includes(key)) : null,
        ]),
      ),
      directorDocuments: {
        nrcFile: (value, values) => (isBusinessApp(values) ? fileRule(value, true) : null),
        photoFile: (value, values) => (isBusinessApp(values) ? fileRule(value, true) : null),
      },
    },
  });

  const applicantType = form.values.applicant_type;
  const stepLabels = STEP_LABELS[applicantType];

  const { data: existingApplication, error: loadError } = useQuery({
    queryKey: ["los-loan-application", loanApplicationId, "edit"],
    queryFn: () => LoanApplicationApi.getById(loanApplicationId as string),
    enabled: !!loanApplicationId && !embedded,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!existingApplication) return;
    const values = valuesFromApplication(existingApplication, existingUrls);
    loadedValues.current = values;
    form.setValues(values);
    form.resetDirty(values);
  }, [existingApplication]);

  const validateStep = (step: number) => {
    let hasError = false;
    stepPaths(form.values, step).forEach((path) => {
      if (form.validateField(path).hasError) hasError = true;
    });
    if (applicantType === "Business" && step === 2) {
      const missing = form.values.directors.length === 0;
      setDirectorsError(missing ? "Please add at least one director" : null);
      if (missing) hasError = true;
    }
    if (applicantType === "Business" && step === 5) {
      const missing = form.values.directorDocuments.length === 0;
      setDirectorDocsError(missing ? "Please add at least one director's documents" : null);
      if (missing) hasError = true;
    }
    return !hasError;
  };

  const handleReset = () => {
    const values = loadedValues.current ?? createInitialValues();
    form.setValues(values);
    form.resetDirty(values);
    form.clearErrors();
    setDirectorsError(null);
    setDirectorDocsError(null);
    setActiveStep(0);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep((s) => Math.min(s + 1, SUBMIT_STEP));
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const amount = Number(form.values.requested_amount) || 0;
  const tenure = Number(form.values.tenure_months) || 0;
  const estimate =
    amount > 0 && Number.isInteger(tenure) && tenure > 0
      ? computeSimulation(amount, tenure, SIMULATION_RANGE[applicantType].rate, form.values.repayment_frequency)
      : null;
  const totalRepayable = Math.round(estimate?.totalRepayment ?? 0);
  const monthlyRepayment = Math.round(estimate?.installment ?? 0);

  const showError = (error: unknown) =>
    openCommonModal({
      heading: "Action Failed",
      subtitle: "We couldn't complete your request.",
      body: parseFrappeError(error),
      color: "red",
      buttons: [{ label: "Close", color: "red" }],
    });

  const onSaved = (heading: string, body: string) => {
    queryClient.invalidateQueries({ queryKey: ["los-loan-applications"] });
    queryClient.invalidateQueries({ queryKey: ["los-loan-application"] });
    handleModalClose();
    openCommonModal({
      heading,
      subtitle: "",
      body,
      color: "green",
      buttons: [{ label: "Close", color: "green" }],
    });
  };

  const { mutate: createApplication, isPending: isCreating } = useMutation({
    mutationFn: (payload: LoanApplicationPayload) => LoanApplicationApi.create(payload),
    onSuccess: (application) =>
      onSaved("Application Saved", `Loan application ${application?.name ?? ""} has been saved as a draft.`),
    onError: showError,
  });

  const { mutate: updateApplication, isPending: isUpdating } = useMutation({
    mutationFn: (payload: LoanApplicationPayload) =>
      LoanApplicationApi.update(loanApplicationId as string, payload),
    onSuccess: () => onSaved("Application Updated", `Loan application ${loanApplicationId} has been updated.`),
    onError: showError,
  });

  const resolveDocuments = async (values: LoanApplicationValues): Promise<ApplicationDocument[]> => {
    const fileUrl = async (file: File) => existingUrls.get(file) ?? (await uploadFile(file)).file_url;
    const documents: ApplicationDocument[] = [];
    for (const key of DOCUMENT_KEYS[values.applicant_type]) {
      const file = values.documents[key];
      if (file) documents.push({ document_name: DOCUMENT_NAMES[key], file: await fileUrl(file) });
    }
    if (values.applicant_type === "Business") {
      for (const [index, doc] of values.directorDocuments.entries()) {
        for (const kind of ["nrcFile", "photoFile"] as const) {
          const file = doc[kind];
          if (file) documents.push({ document_name: directorDocName(index, kind), file: await fileUrl(file) });
        }
      }
    }
    return [...documents, ...values.other_documents];
  };

  const handleSubmitApplication = async () => {
    for (let step = 0; step <= SUBMIT_STEP; step++) {
      if (!validateStep(step)) {
        setActiveStep(step);
        return;
      }
    }
    setIsUploadingDocs(true);
    try {
      const payload = buildPayload(form.values, await resolveDocuments(form.values));
      if (loanApplicationId) updateApplication(payload);
      else createApplication(payload);
    } catch (error) {
      showError(error);
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <CustomerLoanStep form={form} readOnly={readOnly} />;
      case 1:
        return <PersonalBusinessInfoStep form={form} applicantType={applicantType} readOnly={readOnly} />;
      case 2:
        return (
          <ResidenceEmploymentStep
            form={form}
            applicantType={applicantType}
            directorsError={directorsError}
            readOnly={readOnly}
          />
        );
      case 3:
        return applicantType === "Individual" ? (
          <EmploymentDetails form={form} readOnly={readOnly} />
        ) : (
          <Applicant form={form} readOnly={readOnly} />
        );
      case 4:
        return <Collateral form={form} readOnly={readOnly} />;
      case 5:
        return (
          <DocumentsStep
            form={form}
            applicantType={applicantType}
            directorDocsError={directorDocsError}
            existingUrls={existingUrls}
            readOnly={readOnly}
          />
        );
      case 6:
        return <EligibilitySimulationStep form={form} readOnly={readOnly} />;
      case 7:
        return <Review form={form} />;
      default:
        return null;
    }
  };

  const isSaving = isUploadingDocs || isCreating || isUpdating;
  const isLoadingApplication = !!loanApplicationId && !embedded && !existingApplication;

  const bodyContent = (
    <Box
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {!embedded && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="sm"
          bg="brand.6"
          style={{
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <IconFileText size={16} />
            </ThemeIcon>
            <Box>
              <Text size="md" fw={700} c="white" style={{ letterSpacing: "-0.01em" }}>
                {readOnly
                  ? `Loan Application · ${loanApplicationId}`
                  : loanApplicationId
                    ? `Update Loan Application · ${loanApplicationId}`
                    : "New Loan Application"}
              </Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="white"
              radius="xl"
              size="md"
              onClick={onMinimize}
              aria-label="Minimize"
            >
              <IconMinus size={16} color="white" />
            </ActionIcon>
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
        </Group>
      )}
      <Box
        px="md"
        py={6}
        style={{
          borderBottom: "1px solid var(--mantine-color-slate-2)",
          flexShrink: 0,
        }}
        bg="slate.0"
      >
        <ScrollArea type="auto" scrollbarSize={4} offsetScrollbars={false}>
          <Group gap={18} wrap="nowrap">
            {stepLabels.map((label, idx) => {
              const isActive = activeStep === idx;
              const isComplete = idx < activeStep;
              const StepIcon = STEP_ICONS[applicantType][idx];
              return (
                <Group key={label} gap={18} wrap="nowrap">
                  <UnstyledButton
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    px={14}
                    py={7}
                    style={{
                      borderRadius: "var(--mantine-radius-sm)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: isActive ? "var(--mantine-color-white)" : "transparent",
                      boxShadow: isActive ? "var(--mantine-shadow-sm)" : "none",
                      border: isActive ? "1px solid var(--mantine-color-slate-2)" : "1px solid transparent",
                      transition: "background-color 120ms ease, box-shadow 120ms ease",
                    }}
                  >
                    <Group gap={6} wrap="nowrap">
                      <ThemeIcon
                        radius="xl"
                        size={20}
                        variant={isActive || isComplete ? "filled" : "outline"}
                        color={isActive || isComplete ? "brand" : "slate"}
                        style={{ flexShrink: 0 }}
                      >
                        {isComplete ? <IconCheck size={10} /> : <StepIcon size={10} />}
                      </ThemeIcon>
                      <Text
                        size="xs"
                        fw={isActive ? 700 : 500}
                        c={isActive ? "brand.7" : isComplete ? "slate.7" : "slate.5"}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {label}
                      </Text>
                    </Group>
                  </UnstyledButton>
                  {idx < stepLabels.length - 1 && (
                    <IconChevronRight size={11} color="var(--mantine-color-slate-3)" style={{ flexShrink: 0 }} />
                  )}
                </Group>
              );
            })}
          </Group>
        </ScrollArea>
      </Box>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <ScrollArea type="hover" scrollbarSize={6} style={{ flex: 1, minHeight: 0 }}>
          <Box px="xl" py="xl" style={{ flex: 1, minWidth: 0 }}>
            <Box className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
              {loadError ? (
                <Text fz="sm" c="red.6" ta="center" py="xl">
                  {parseFrappeError(loadError)}
                </Text>
              ) : isLoadingApplication ? (
                <Stack align="center" gap="xs" py="xl">
                  <Loader size="sm" color="brand" />
                  <Text fz="xs" c="slate.5">
                    Loading application…
                  </Text>
                </Stack>
              ) : (
                renderStep()
              )}
            </Box>
          </Box>
        </ScrollArea>

        {!readOnly && (
          <ApplicationSummary
            values={form.values}
            totalRepayable={totalRepayable}
            monthlyRepayment={monthlyRepayment}
            activeStep={activeStep}
            totalSteps={stepLabels.length}
          />
        )}
      </Box>
      {!readOnly && (
        <Group
          justify="space-between"
          align="center"
          px="xl"
          py="md"
          bg="white"
          style={{
            borderTop: "1px solid var(--mantine-color-gray-2)",
            flexShrink: 0,
          }}
        >
          <Group gap="lg">
            <Button variant="transparent" c="dark.8" px={0} fw={600} onClick={handleModalClose}>
              Cancel
            </Button>
            <Divider orientation="vertical" />
            <Button variant="transparent" color="red.8" px={0} fw={600} onClick={handleReset}>
              Reset Form
            </Button>
          </Group>

          <Group gap="md">
            {activeStep > 0 && (
              <Button variant="default" radius="md" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button
              color="brand"
              radius="md"
              onClick={activeStep < SUBMIT_STEP ? handleNext : handleSubmitApplication}
              loading={activeStep >= SUBMIT_STEP && isSaving}
              disabled={isLoadingApplication}
              rightSection={<IconArrowRight size={16} />}
            >
              {activeStep < SUBMIT_STEP
                ? "Save & Continue"
                : loanApplicationId
                  ? "Update Application"
                  : "Save Application"}
            </Button>
          </Group>
        </Group>
      )}
    </Box>
  );

  if (embedded) {
    return (
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        {bodyContent}
      </Box>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      transitionProps={{ onExited: () => onExited?.() }}
      size="90vw"
      padding={0}
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "92vh",
          maxHeight: "99vh",
          width: "90vw",
          maxWidth: "1600px",
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
      {bodyContent}
    </Modal>
  );
}
