import { useState } from "react";
import {
  Box,
  Text,
  Button,
  Modal,
  ActionIcon,
  ThemeIcon,
  Group,
  ScrollArea,
  UnstyledButton,
  useMantineTheme,
  Stack,
} from "@mantine/core";
import { IconX, IconUser, IconCheck, IconMinus } from "@tabler/icons-react";

import { STEPS, STEP_GROUPS } from "../../constants/customer/constants";
import { CustomerSummarySidebar } from "./Customersummarysidebar";

import { IdentityStep } from "./steps/IdentityStep";
import { ContactStep } from "./steps/ContactStep";
import { IdentificationStep } from "./steps/IdentificationStep";
import { FinancialStep } from "./steps/FinancialStep";
import { BorrowerStep } from "./steps/BorrowerStep";
import { CreditAssessmentStep } from "./steps/Creditassessmentstep";
import { CreditBureauSummary } from "./steps/CreditBureauSummary";
import { ExistingFacilities } from "./steps/ExistingFacilities";
import { EligibilitySummary } from "./steps/EligibilitySummary";
import { KycStep } from "./steps/KycStep";
import { DocumentsStep } from "./steps/DocumentsStep";
import { KinStep } from "./steps/KinStep";

import { DirectorsStakeholdersStep } from "./steps/DirectorsStakeholdersStep";
import { ModalFooter } from "../../shared/ModalFooter";
import { showValidationError } from "../../../utils/alert";
import { openCommonModal } from "../AlertModal";
import { parseFrappeError } from "../../../utils/parseFrappeError";

import { useIdentityState } from "../../../hooks/customer/modal/useIdentityState";
import { useContactState } from "../../../hooks/customer/modal/useContactState";
import { useIdentificationState } from "../../../hooks/customer/modal/useIdentificationState";
import { useFinancialBorrowerState } from "../../../hooks/customer/modal/useFinancialBorrowerState";
import { useCreditAssessmentState } from "../../../hooks/customer/modal/Usecreditassessmentstate";
import {
  useKycState,
  useDocumentsState,
  useKinState,
  useTagsState,
} from "../../../hooks/customer/modal/useLaterStepsState";
import { getScoreBand } from "../../../components/shared/Creditscoregauge";

interface CustomerModalProps {
  opened: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isViewMode?: boolean;
}

// NOTE: STEPS now has 8 entries (was 7) — "Financial & Lending" was split
// into two separate steps, "Financial" (index 3) and "Lending" (index 4).
// STEP_GROUPS.financial.stepIndices is [3, 4], same pattern as the
// verification group's multi-step sub-stepper. Consent for the bureau
// check is captured on the Credit Assessment card itself (see
// useCreditAssessmentState) inside the Lending step — Lending (index 4)
// still runs before KYC (index 5), so gating consent on the KYC step would
// make the check unrunnable on first pass through the wizard.

export function CustomerModal({
  opened,
  onClose,
  onMinimize,
  isViewMode,
}: CustomerModalProps) {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string>("0");
  const currentStep = parseInt(activeTab);

  const identity = useIdentityState();
  const contact = useContactState();
  const identification = useIdentificationState();
  const financialBorrower = useFinancialBorrowerState();
  const creditAssessment = useCreditAssessmentState({
    customerId: identity.customerNumber ?? null,
    bureauProvider: financialBorrower.bureauProvider ?? undefined,
  });
  const kyc = useKycState({ customerId: identity.customerNumber ?? null });
  const documents = useDocumentsState({
    customerId: identity.customerNumber ?? null,
  });
  const kin = useKinState();
  const tagsState = useTagsState();

  const activeGroup =
    STEP_GROUPS.find((g) =>
      (g.stepIndices as readonly number[]).includes(currentStep),
    ) ?? STEP_GROUPS[0];
  const stepInGroup = activeGroup.stepIndices.indexOf(currentStep as never) + 1;
  const handleGroupClick = (group: (typeof STEP_GROUPS)[number]) => {
    if (group.id === activeGroup.id) return;

    setActiveTab(group.stepIndices[0].toString());
  };

  const mobileDuplicateName = contact.mobileNumber
    .replace(/\D/g, "")
    .endsWith("7124456")
    ? "Mwansa Chileshe (CUST-0042118)"
    : null;
  const primaryDoc =
    identification.idDocuments.find((d) => d.isPrimary) ??
    identification.idDocuments[0];
  const duplicateDocMatch =
    primaryDoc && primaryDoc.docNumber.replace(/\s/g, "") === "221009/11/1"
      ? "Mwansa Chileshe (CUST-0042118)"
      : null;

  const isBusinessType = identity.customerType === "Business";
  const sidebarCustomerName = isBusinessType
    ? identity.companyName
    : [identity.firstName, identity.lastName].filter(Boolean).join(" ");
  const stepLabel = (idx: number) =>
    idx === 7 && isBusinessType ? "Directors & Stakeholders" : STEPS[idx].label;
  // Derived, sidebar-only view of the credit assessment result. `result`
  // stays the single source of truth (owned by useCreditAssessmentState);
  // this just reshapes it into the flat props CustomerSummarySidebar takes.
  // Returns all-null when there's no result yet, so the sidebar's credit
  // panels simply don't render (see hasCreditData in CustomerSummarySidebar).
  const creditResult = creditAssessment.result;

  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());

  const getStepErrors = (step: number): Record<string, string> => {
    switch (step) {
      case 0: {
        const errs: Record<string, string> = {};
        if (isBusinessType) {
          if (!identity.companyName.trim())
            errs.companyName = "Registered company name is required";
          if (!identity.registrationNumber.trim())
            errs.registrationNumber = "Registration number is required";
          if (!identity.businessAddress.trim())
            errs.businessAddress = "Address line 1 is required";
          if (!identity.businessCity.trim())
            errs.businessCity = "City / town is required";
          if (!identity.businessProvince)
            errs.businessProvince = "State / Province is required";
          if (!identity.businessCountry)
            errs.businessCountry = "Country is required";
        } else {
          if (!identity.firstName.trim())
            errs.firstName = "First name is required";
          if (!identity.lastName.trim())
            errs.lastName = "Last name is required";
          if (!identity.gender) errs.gender = "Gender is required";
          if (!identity.dateOfBirth)
            errs.dateOfBirth = "Date of birth is required";
          if (!identity.nationality)
            errs.nationality = "Nationality is required";
        }
        return errs;
      }
      case 1: {
        const errs: Record<string, string> = {};
        if (!contact.mobileNumber.trim())
          errs.mobileNumber = "Mobile number is required";
        else if (!/^\+?[0-9\s]{7,15}$/.test(contact.mobileNumber.trim()))
          errs.mobileNumber = "Enter a valid phone number";
        if (
          contact.email.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
        )
          errs.email = "Enter a valid email address";
        return errs;
      }
      case 2: {
        const errs: Record<string, string> = {};
        if (primaryDoc && !primaryDoc.docNumber.trim())
          errs[`doc-${primaryDoc.id}`] = "Document number is required";
        return errs;
      }
      case 3:
        // Financial — no required fields currently.
        return {};
      case 4:
        // Lending — Loan Requirement validation (borrower category, loan
        // purpose, branch) lives here. Credit Assessment/bureau check stays
        // optional/unvalidated.
        return financialBorrower.getErrors();
      default:
        return {};
    }
  };

  const handleCreateCustomer = () => {
    const stepsToCheck = [0, 1, 2, 3, 4];
    let firstInvalid: number | null = null;
    const newAttempted = new Set(attemptedSteps);
    for (const s of stepsToCheck) {
      if (Object.keys(getStepErrors(s)).length > 0) {
        newAttempted.add(s);
        if (firstInvalid === null) firstInvalid = s;
      }
    }
    if (firstInvalid !== null) {
      setAttemptedSteps(newAttempted);
      setActiveTab(firstInvalid.toString());
      showValidationError(
        "Please fill in all required fields before submitting.",
      );
      return;
    }

    try {
      openCommonModal({
        heading: "Customer Created",
        subtitle: "Success",
        body: "Customer has been created successfully.",
        color: "success",
        buttons: [
          {
            label: "Close",
            color: "teal",
            onClick: () => handleModalClose(),
          },
        ],
      });
    } catch (err: any) {
      const errorMessage = parseFrappeError(err);
      openCommonModal({
        heading: "Unable to Create Customer",
        subtitle: "Customer creation failed",
        body: errorMessage,
        color: "danger",
        buttons: [
          {
            label: "Close",
            color: "red",
          },
        ],
      });
    }
  };

  const handleReset = () => {
    identity.reset();
    contact.reset();
    identification.reset();
    financialBorrower.reset();
    creditAssessment.reset();
    kyc.reset();
    documents.reset();
    kin.reset();
    tagsState.reset();
    setAttemptedSteps(new Set());
    setActiveTab("0");
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };
  const handleNext = () => {
    const errs = getStepErrors(currentStep);
    if (Object.keys(errs).length > 0) {
      setAttemptedSteps((prev) => new Set(prev).add(currentStep));
      showValidationError(
        "Please fill in all required fields before continuing.",
      );
      return;
    }
    if (currentStep < STEPS.length - 1)
      setActiveTab((currentStep + 1).toString());
  };
  const handleBack = () => {
    if (currentStep > 0) setActiveTab((currentStep - 1).toString());
  };

  const headerIcon = STEPS[currentStep]?.icon || IconUser;
  const HeaderIcon = headerIcon;
  const headerTitle = isViewMode ? "View Customer" : "Create Customer";

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <IdentityStep
            customerNumber={identity.customerNumber}
            customerType={identity.customerType}
            setCustomerType={identity.setCustomerType}
            firstName={identity.firstName}
            setFirstName={identity.setFirstName}
            middleName={identity.middleName}
            setMiddleName={identity.setMiddleName}
            lastName={identity.lastName}
            setLastName={identity.setLastName}
            preferredName={identity.preferredName}
            setPreferredName={identity.setPreferredName}
            gender={identity.gender}
            setGender={identity.setGender}
            dateOfBirth={identity.dateOfBirth}
            setDateOfBirth={identity.setDateOfBirth}
            nationality={identity.nationality}
            setNationality={identity.setNationality}
            occupation={identity.occupation}
            setOccupation={identity.setOccupation}
            industry={identity.industry}
            setIndustry={identity.setIndustry}
            employer={identity.employer}
            setEmployer={identity.setEmployer}
            companyName={identity.companyName}
            setCompanyName={identity.setCompanyName}
            registrationNumber={identity.registrationNumber}
            setRegistrationNumber={identity.setRegistrationNumber}
            incorporationDate={identity.incorporationDate}
            setIncorporationDate={identity.setIncorporationDate}
            businessAddress={identity.businessAddress}
            setBusinessAddress={identity.setBusinessAddress}
            businessAddressLine2={identity.businessAddressLine2}
            setBusinessAddressLine2={identity.setBusinessAddressLine2}
            businessIndustry={identity.businessIndustry}
            setBusinessIndustry={identity.setBusinessIndustry}
            numberOfEmployees={identity.numberOfEmployees}
            setNumberOfEmployees={identity.setNumberOfEmployees}
            annualRevenue={identity.annualRevenue}
            setAnnualRevenue={identity.setAnnualRevenue}
            businessCity={identity.businessCity}
            setBusinessCity={identity.setBusinessCity}
            businessProvince={identity.businessProvince}
            setBusinessProvince={identity.setBusinessProvince}
            businessCountry={identity.businessCountry}
            setBusinessCountry={identity.setBusinessCountry}
            businessPostalCode={identity.businessPostalCode}
            setBusinessPostalCode={identity.setBusinessPostalCode}
            errors={attemptedSteps.has(0) ? getStepErrors(0) : {}}
          />
        );
      case 1:
        return (
          <ContactStep
            customerType={identity.customerType}
            mobileNumber={contact.mobileNumber}
            setMobileNumber={contact.setMobileNumber}
            alternateMobile={contact.alternateMobile}
            setAlternateMobile={contact.setAlternateMobile}
            email={contact.email}
            setEmail={contact.setEmail}
            preferredCommunication={contact.preferredCommunication}
            setPreferredCommunication={contact.setPreferredCommunication}
            residentialAddress={contact.residentialAddress}
            setResidentialAddress={contact.setResidentialAddress}
            residentialAddressLine2={contact.residentialAddressLine2}
            setResidentialAddressLine2={contact.setResidentialAddressLine2}
            country={contact.country}
            setCountry={contact.setCountry}
            province={contact.province}
            setProvince={contact.setProvince}
            district={contact.district}
            setDistrict={contact.setDistrict}
            cityTown={contact.cityTown}
            setCityTown={contact.setCityTown}
            postalCode={contact.postalCode}
            setPostalCode={contact.setPostalCode}
            sameAsResidential={contact.sameAsResidential}
            setSameAsResidential={contact.setSameAsResidential}
            mailingAddress={contact.mailingAddress}
            setMailingAddress={contact.setMailingAddress}
            mailingAddressLine2={contact.mailingAddressLine2}
            setMailingAddressLine2={contact.setMailingAddressLine2}
            mailingCountry={contact.mailingCountry}
            setMailingCountry={contact.setMailingCountry}
            mailingProvince={contact.mailingProvince}
            setMailingProvince={contact.setMailingProvince}
            mailingDistrict={contact.mailingDistrict}
            setMailingDistrict={contact.setMailingDistrict}
            mailingCityTown={contact.mailingCityTown}
            setMailingCityTown={contact.setMailingCityTown}
            mailingPostalCode={contact.mailingPostalCode}
            setMailingPostalCode={contact.setMailingPostalCode}
            primaryContactName={contact.primaryContactName}
            setPrimaryContactName={contact.setPrimaryContactName}
            sameAsRegisteredOffice={contact.sameAsRegisteredOffice}
            setSameAsRegisteredOffice={contact.setSameAsRegisteredOffice}
            correspondenceAddress={contact.correspondenceAddress}
            setCorrespondenceAddress={contact.setCorrespondenceAddress}
            correspondenceAddressLine2={contact.correspondenceAddressLine2}
            setCorrespondenceAddressLine2={
              contact.setCorrespondenceAddressLine2
            }
            correspondenceCountry={contact.correspondenceCountry}
            setCorrespondenceCountry={contact.setCorrespondenceCountry}
            correspondenceProvince={contact.correspondenceProvince}
            setCorrespondenceProvince={contact.setCorrespondenceProvince}
            correspondenceCityTown={contact.correspondenceCityTown}
            setCorrespondenceCityTown={contact.setCorrespondenceCityTown}
            correspondencePostalCode={contact.correspondencePostalCode}
            setCorrespondencePostalCode={contact.setCorrespondencePostalCode}
            registeredOfficeAddress={identity.businessAddress}
            registeredOfficeAddressLine2={identity.businessAddressLine2}
            registeredOfficeCity={identity.businessCity}
            registeredOfficeProvince={identity.businessProvince}
            registeredOfficeCountry={identity.businessCountry}
            registeredOfficePostalCode={identity.businessPostalCode}
            mobileDuplicateName={mobileDuplicateName}
            errors={attemptedSteps.has(1) ? getStepErrors(1) : {}}
          />
        );
      case 2:
        return (
          <IdentificationStep
            idDocuments={identification.idDocuments}
            updateIdDocument={identification.updateIdDocument}
            addIdDocument={identification.addIdDocument}
            removeIdDocument={identification.removeIdDocument}
            errors={attemptedSteps.has(2) ? getStepErrors(2) : {}}
            duplicateDocMatch={duplicateDocMatch}
          />
        );
      case 3:
        return (
          <FinancialStep
            educationLevel={financialBorrower.educationLevel}
            setEducationLevel={financialBorrower.setEducationLevel}
            employmentType={financialBorrower.employmentType}
            setEmploymentType={financialBorrower.setEmploymentType}
            sourceOfIncome={financialBorrower.sourceOfIncome}
            setSourceOfIncome={financialBorrower.setSourceOfIncome}
            monthlyIncome={financialBorrower.monthlyIncome}
            setMonthlyIncome={financialBorrower.setMonthlyIncome}
            annualIncome={financialBorrower.annualIncome}
            setAnnualIncome={financialBorrower.setAnnualIncome}
            totalAssets={financialBorrower.totalAssets}
            setTotalAssets={financialBorrower.setTotalAssets}
            totalLiabilities={financialBorrower.totalLiabilities}
            setTotalLiabilities={financialBorrower.setTotalLiabilities}
            existingMonthlyObligations={
              financialBorrower.existingMonthlyObligations
            }
            setExistingMonthlyObligations={
              financialBorrower.setExistingMonthlyObligations
            }
            relationshipManager={financialBorrower.relationshipManager}
            setRelationshipManager={financialBorrower.setRelationshipManager}
          />
        );
      case 4:
        return (
          <Stack gap="lg">
            <CreditAssessmentStep
              status={creditAssessment.status}
              result={creditAssessment.result}
              errorMessage={creditAssessment.errorMessage}
              consentGiven={creditAssessment.consentGiven}
              setConsentGiven={creditAssessment.setConsentGiven}
              bureauProvider={financialBorrower.bureauProvider}
              setBureauProvider={financialBorrower.setBureauProvider}
              runCheck={creditAssessment.runCheck}
              refreshCheck={creditAssessment.refreshCheck}
            />
            <CreditBureauSummary
              result={creditAssessment.result}
              isExpired={creditAssessment.isExpired}
              onViewFullReport={() => {
                // TODO: open a Drawer/Modal with the full bureau report
                // (trade lines, inquiry history, exportable PDF).
              }}
            />
            <ExistingFacilities
              bureauFacilities={
                creditAssessment.result?.existingFacilities ?? []
              }
            />
            {/* <BorrowerStep
              convertToBorrower={financialBorrower.convertToBorrower}
              setConvertToBorrower={financialBorrower.setConvertToBorrower}
              borrowerCategory={financialBorrower.borrowerCategory}
              setBorrowerCategory={financialBorrower.setBorrowerCategory}
              loanPurpose={financialBorrower.loanPurpose}
              setLoanPurpose={financialBorrower.setLoanPurpose}
              intendedLoanProduct={financialBorrower.intendedLoanProduct}
              setIntendedLoanProduct={financialBorrower.setIntendedLoanProduct}
              loanAmountRequested={financialBorrower.loanAmountRequested}
              setLoanAmountRequested={financialBorrower.setLoanAmountRequested}
              loanTenureMonths={financialBorrower.loanTenureMonths}
              setLoanTenureMonths={financialBorrower.setLoanTenureMonths}
              repaymentFrequency={financialBorrower.repaymentFrequency}
              setRepaymentFrequency={financialBorrower.setRepaymentFrequency}
              preliminaryRiskRating={financialBorrower.preliminaryRiskRating}
              setPreliminaryRiskRating={
                financialBorrower.setPreliminaryRiskRating
              }
              branch={financialBorrower.branch}
              setBranch={financialBorrower.setBranch}
              creditOfficer={financialBorrower.creditOfficer}
              setCreditOfficer={financialBorrower.setCreditOfficer}
            /> */}
            <EligibilitySummary
              monthlyIncome={financialBorrower.monthlyIncome}
              existingMonthlyObligations={
                financialBorrower.existingMonthlyObligations
              }
              bureauMonthlyObligations={
                creditAssessment.result?.monthlyObligations
              }
              loanTenureMonths={financialBorrower.loanTenureMonths}
            />
          </Stack>
        );
      case 5:
        return <KycStep kycStatus={kyc.kycStatus} runCheck={kyc.runCheck} />;
      case 6:
        return (
          <DocumentsStep
            uploadedDocs={documents.uploadedDocs}
            uploadDoc={documents.uploadDoc}
            removeUpload={documents.removeUpload}
            uploadingKey={documents.uploadingKey}
            isViewMode={isViewMode}
          />
        );
      case 7:
        return isBusinessType ? (
          <DirectorsStakeholdersStep
            directors={identity.directors}
            addDirector={identity.addDirector}
            updateDirector={identity.updateDirector}
            removeDirector={identity.removeDirector}
          />
        ) : (
          <KinStep
            kinFirstName={kin.kinFirstName}
            setKinFirstName={kin.setKinFirstName}
            kinMiddleName={kin.kinMiddleName}
            setKinMiddleName={kin.setKinMiddleName}
            kinLastName={kin.kinLastName}
            setKinLastName={kin.setKinLastName}
            kinRelationship={kin.kinRelationship}
            setKinRelationship={kin.setKinRelationship}
            kinPhone={kin.kinPhone}
            setKinPhone={kin.setKinPhone}
            kinAddress={kin.kinAddress}
            setKinAddress={kin.setKinAddress}
            kinDistrict={kin.kinDistrict}
            setKinDistrict={kin.setKinDistrict}
            kinCityTown={kin.kinCityTown}
            setKinCityTown={kin.setKinCityTown}
            kinPostalCode={kin.kinPostalCode}
            setKinPostalCode={kin.setKinPostalCode}
          />
        );
        // case 8:
        //   return (
        //     <TagsStep
        //       tags={tagsState.tags}
        //       tagInput={tagsState.tagInput}
        //       setTagInput={tagsState.setTagInput}
        //       addTag={tagsState.addTag}
        //       removeTag={tagsState.removeTag}
        //       relationshipNotes={tagsState.relationshipNotes}
        //       setRelationshipNotes={tagsState.setRelationshipNotes}
        //       customFields={tagsState.customFields}
        //       addCustomField={tagsState.addCustomField}
        //       removeCustomField={tagsState.removeCustomField}
        //       updateCustomField={tagsState.updateCustomField}
        //     />
        //   );
        // default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="90vw"
      padding={0}
      lockScroll
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        content: {
          height: "98vh",
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
      <Box
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
        bg="white"
      >
        <Group
          justify="space-between"
          align="center"
          px="lg"
          py={6}
          style={{
            background: theme.other.brandGradient,
            borderBottom: "1px solid var(--mantine-color-brand-7)",
            flexShrink: 0,
          }}
        >
          <Group gap="sm">
            <ThemeIcon radius="md" size={34} variant="white" color="brand">
              <HeaderIcon size={16} />
            </ThemeIcon>
            <Box>
              <Text
                size="md"
                fw={700}
                c="white"
                style={{ letterSpacing: "-0.01em" }}
              >
                {headerTitle}
              </Text>
              <Text size="xs" fw={600} c="brand.1">
                Step {currentStep + 1} of {STEPS.length}
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
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

        <Box px="md" bg="white" style={{ flexShrink: 0 }}>
          <Group
            gap={8}
            wrap="nowrap"
            style={{
              overflow: "hidden",
              borderBottom: "1px solid var(--mantine-color-slate-2)",
            }}
          >
            {STEP_GROUPS.map((group) => {
              const isActiveGroup = group.id === activeGroup.id;
              const GroupIcon = group.icon;
              return (
                <UnstyledButton
                  key={group.id}
                  onClick={() => handleGroupClick(group)}
                  px={12}
                  py={6}
                  style={{
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    borderBottom: isActiveGroup
                      ? "2px solid var(--mantine-color-brand-6)"
                      : "2px solid transparent",
                    marginBottom: -1,
                    transition:
                      "border-color 120ms ease, background-color 120ms ease",
                  }}
                >
                  <Group gap={7} wrap="nowrap">
                    <GroupIcon
                      size={16}
                      color={
                        isActiveGroup
                          ? "var(--mantine-color-brand-6)"
                          : "var(--mantine-color-slate-4)"
                      }
                    />
                    <Text
                      size="sm"
                      fw={isActiveGroup ? 600 : 500}
                      c={isActiveGroup ? "brand.7" : "slate.5"}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {group.label}
                    </Text>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Group>

          {activeGroup.stepIndices.length > 1 && (
            <Group
              gap={0}
              wrap="nowrap"
              px={12}
              py={6}
              style={{ overflow: "hidden" }}
            >
              {activeGroup.stepIndices.map((stepIdx, i) => {
                const isCurrent = stepIdx === currentStep;
                const isDone = stepIdx < currentStep;
                const hasError =
                  attemptedSteps.has(stepIdx) &&
                  Object.keys(getStepErrors(stepIdx)).length > 0;
                return (
                  <Group
                    key={stepIdx}
                    gap={10}
                    wrap="nowrap"
                    style={{ flexShrink: 0 }}
                  >
                    <UnstyledButton
                      onClick={() => setActiveTab(stepIdx.toString())}
                      style={{ flexShrink: 0 }}
                    >
                      <Group gap={10} wrap="nowrap">
                        {isDone && !hasError ? (
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            variant="outline"
                            color="brand"
                            style={{ background: "white" }}
                          >
                            <IconCheck size={14} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon
                            size={28}
                            radius="xl"
                            variant={isCurrent ? "filled" : "light"}
                            color={
                              hasError
                                ? "danger"
                                : isCurrent
                                  ? "brand"
                                  : "slate"
                            }
                          >
                            <Text
                              size="sm"
                              fw={700}
                              c={isCurrent || hasError ? "white" : "slate.5"}
                            >
                              {i + 1}
                            </Text>
                          </ThemeIcon>
                        )}
                        <Text
                          size="sm"
                          fw={isCurrent ? 600 : 500}
                          c={
                            hasError
                              ? "danger.6"
                              : isCurrent
                                ? "brand.7"
                                : isDone
                                  ? "slate.6"
                                  : "slate.4"
                          }
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {stepLabel(stepIdx)}
                        </Text>
                      </Group>
                    </UnstyledButton>
                    {i < activeGroup.stepIndices.length - 1 && (
                      <Box
                        style={{
                          width: 72,
                          height: 1,
                          background: isDone
                            ? "var(--mantine-color-brand-3)"
                            : "var(--mantine-color-slate-2)",
                          flexShrink: 0,
                          marginInline: 10,
                        }}
                      />
                    )}
                  </Group>
                );
              })}
            </Group>
          )}
        </Box>

        {/*
          Content region — this is the piece that was causing the dead
          gap + clipped sidebar on narrow/mobile widths.

          Below `lg`: the OUTER box owns the scroll (`overflow-y-auto`) and
          both children (main content + sidebar) just flow naturally, full
          width, stacked. No fixed heights fighting each other, nothing
          gets clipped — it just scrolls as one long page.

          At `lg` and above: outer scroll is turned off
          (`lg:overflow-hidden`) and we go back to the original two-pane
          layout — main content and sidebar each own their own
          ScrollArea/overflow independently, side by side.
        */}
        <Box
          bg="slate.0"
          className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-y-auto lg:overflow-hidden"
          style={{ minHeight: 0 }}
        >
          <Box
            className="lg:flex-1 lg:min-w-0 lg:h-full lg:overflow-y-auto"
            style={{ minHeight: 0 }}
          >
            <Box
              component="fieldset"
              disabled={isViewMode}
              style={{ border: 0, padding: 0, margin: 0 }}
              pt="xs"
              pl="md"
              pr="md"
              pb="xs"
            >
              {renderStep()}
            </Box>
          </Box>

          <Box className="w-full lg:w-auto lg:flex-shrink-0 lg:h-full lg:overflow-y-auto">
            <CustomerSummarySidebar
              customerName={sidebarCustomerName}
              customerType={identity.customerType}
              customerNumber={identity.customerNumber}
              activeGroupLabel={activeGroup.label}
              currentStepLabel={
                currentStep in STEPS ? stepLabel(currentStep) : ""
              }
              stepInGroup={stepInGroup}
              groupStepCount={activeGroup.stepIndices.length}
              overallCompleted={currentStep}
              overallTotal={STEPS.length}
              creditScore={creditResult?.score ?? null}
              creditBand={
                creditResult ? getScoreBand(creditResult.score).label : null
              }
              activeFacilities={
                creditResult ? creditResult.existingFacilities.length : null
              }
              onViewSnapshot={() => {}}
            />
          </Box>
        </Box>

        <ModalFooter
          variant="theme"
          isViewMode={isViewMode}
          onClose={handleModalClose}
          leftSlot={
            currentStep > 0 ? (
              <Button variant="default" onClick={handleBack} px="lg">
                Back
              </Button>
            ) : undefined
          }
          submitLabel={
            currentStep < STEPS.length - 1
              ? isViewMode
                ? "Next"
                : "Save & Continue"
              : "Save"
          }
          onSubmit={
            currentStep < STEPS.length - 1
              ? handleNext
              : isViewMode
                ? undefined
                : handleCreateCustomer
          }
          submitDisabled={isViewMode && currentStep === STEPS.length - 1}
        />
      </Box>
    </Modal>
  );
}
