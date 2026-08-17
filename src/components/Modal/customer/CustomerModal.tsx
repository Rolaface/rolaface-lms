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
import { IconX, IconUser, IconCheck } from "@tabler/icons-react";

import { STEPS, STEP_GROUPS } from "../../constants/customer/constants";
import { CustomerSummarySidebar } from "./Customersummarysidebar";

import { IdentityStep } from "./steps/IdentityStep";
import { ContactStep } from "./steps/ContactStep";
import { IdentificationStep } from "./steps/IdentificationStep";
import { FinancialStep } from "./steps/FinancialStep";
import { BorrowerStep } from "./steps/BorrowerStep";
import { KycStep } from "./steps/KycStep";
import { DocumentsStep } from "./steps/DocumentsStep";
import { KinStep } from "./steps/KinStep";
import { TagsStep } from "./steps/TagsStep";
import { ModalFooter } from "../../shared/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";

import { useIdentityState } from "../../../hooks/customer/modal/useIdentityState";
import { useContactState } from "../../../hooks/customer/modal/useContactState";
import { useIdentificationState } from "../../../hooks/customer/modal/useIdentificationState";
import { useFinancialBorrowerState } from "../../../hooks/customer/modal/useFinancialBorrowerState";
import {
  useKycState,
  useDocumentsState,
  useKinState,
  useTagsState,
} from "../../../hooks/customer/modal/useLaterStepsState";

interface CustomerModalProps {
  opened: boolean;
  onClose: () => void;
  isViewMode?: boolean;
}

export function CustomerModal({
  opened,
  onClose,
  isViewMode,
}: CustomerModalProps) {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string>("0");
  const currentStep = parseInt(activeTab);

  const identity = useIdentityState();
  const contact = useContactState();
  const identification = useIdentificationState();
  const financialBorrower = useFinancialBorrowerState();
  const kyc = useKycState();
  const documents = useDocumentsState();
  const kin = useKinState();
  const tagsState = useTagsState();

  const activeGroup =
    STEP_GROUPS.find((g) =>
      (g.stepIndices as readonly number[]).includes(currentStep),
    ) ?? STEP_GROUPS[0];
  const stepInGroup = activeGroup.stepIndices.indexOf(currentStep as never) + 1;
  const handleGroupClick = (group: (typeof STEP_GROUPS)[number]) => {
    if (group.id === activeGroup.id) return;
    const target =
      group.stepIndices.find((idx) => idx >= currentStep) ??
      group.stepIndices[0];
    setActiveTab(target.toString());
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
        return financialBorrower.getErrors();
      default:
        return {};
    }
  };

  const handleCreateCustomer = () => {
    const stepsToCheck = [0, 1, 2, 3];
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
      showSuccess("Customer created successfully.");
      handleModalClose();
    } catch (err) {
      showApiError("Something went wrong while creating the customer.");
    }
  };

  const handleReset = () => {
    identity.reset();
    contact.reset();
    identification.reset();
    financialBorrower.reset();
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
            businessIndustry={identity.businessIndustry}
            setBusinessIndustry={identity.setBusinessIndustry}
            numberOfEmployees={identity.numberOfEmployees}
            setNumberOfEmployees={identity.setNumberOfEmployees}
            annualRevenue={identity.annualRevenue}
            setAnnualRevenue={identity.setAnnualRevenue}
            businessType={identity.businessType}
            setBusinessType={identity.setBusinessType}
            legalStructure={identity.legalStructure}
            setLegalStructure={identity.setLegalStructure}
            taxId={identity.taxId}
            setTaxId={identity.setTaxId}
            vatNumber={identity.vatNumber}
            setVatNumber={identity.setVatNumber}
            currency={identity.currency}
            setCurrency={identity.setCurrency}
            fiscalYearEnd={identity.fiscalYearEnd}
            setFiscalYearEnd={identity.setFiscalYearEnd}
            businessCity={identity.businessCity}
            setBusinessCity={identity.setBusinessCity}
            businessCountry={identity.businessCountry}
            setBusinessCountry={identity.setBusinessCountry}
            businessPostalCode={identity.businessPostalCode}
            setBusinessPostalCode={identity.setBusinessPostalCode}
            directors={identity.directors}
            addDirector={identity.addDirector}
            updateDirector={identity.updateDirector}
            removeDirector={identity.removeDirector}
            errors={attemptedSteps.has(0) ? getStepErrors(0) : {}}
          />
        );
      case 1:
        return (
          <ContactStep
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
          <Stack gap="lg">
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
              creditRiskCategory={financialBorrower.creditRiskCategory}
              setCreditRiskCategory={financialBorrower.setCreditRiskCategory}
            />
            <BorrowerStep
              convertToBorrower={financialBorrower.convertToBorrower}
              setConvertToBorrower={financialBorrower.setConvertToBorrower}
              borrowerCategory={financialBorrower.borrowerCategory}
              setBorrowerCategory={financialBorrower.setBorrowerCategory}
              loanPurpose={financialBorrower.loanPurpose}
              setLoanPurpose={financialBorrower.setLoanPurpose}
              intendedLoanProduct={financialBorrower.intendedLoanProduct}
              setIntendedLoanProduct={financialBorrower.setIntendedLoanProduct}
              preliminaryRiskRating={financialBorrower.preliminaryRiskRating}
              setPreliminaryRiskRating={
                financialBorrower.setPreliminaryRiskRating
              }
              branch={financialBorrower.branch}
              setBranch={financialBorrower.setBranch}
              creditOfficer={financialBorrower.creditOfficer}
              setCreditOfficer={financialBorrower.setCreditOfficer}
              relationshipManager={financialBorrower.relationshipManager}
              setRelationshipManager={financialBorrower.setRelationshipManager}
              errors={attemptedSteps.has(3) ? getStepErrors(3) : {}}
            />
          </Stack>
        );
      case 4:
        return <KycStep kycStatus={kyc.kycStatus} runCheck={kyc.runCheck} />;
      case 5:
        return (
          <DocumentsStep
            uploadedDocs={documents.uploadedDocs}
            setUploadedDocs={documents.setUploadedDocs}
            isViewMode={isViewMode}
          />
        );
      case 6:
        return (
          <KinStep
            kinName={kin.kinName}
            setKinName={kin.setKinName}
            kinRelationship={kin.kinRelationship}
            setKinRelationship={kin.setKinRelationship}
            kinPhone={kin.kinPhone}
            setKinPhone={kin.setKinPhone}
            kinAddress={kin.kinAddress}
            setKinAddress={kin.setKinAddress}
            guarantorLinked={kin.guarantorLinked}
            setGuarantorLinked={kin.setGuarantorLinked}
          />
        );
      case 7:
        return (
          <TagsStep
            tags={tagsState.tags}
            tagInput={tagsState.tagInput}
            setTagInput={tagsState.setTagInput}
            addTag={tagsState.addTag}
            removeTag={tagsState.removeTag}
            relationshipNotes={tagsState.relationshipNotes}
            setRelationshipNotes={tagsState.setRelationshipNotes}
            customFields={tagsState.customFields}
            addCustomField={tagsState.addCustomField}
            removeCustomField={tagsState.removeCustomField}
            updateCustomField={tagsState.updateCustomField}
          />
        );
      default:
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
      styles={{
        content: {
          height: "94vh",
          maxHeight: "96vh",
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
          px="xl"
          py="sm"
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
                  px={14}
                  py={9}
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
              px={14}
              py={10}
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
                          {STEPS[stepIdx].label}
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

        <Box
          bg="slate.0"
          className="flex-1 flex flex-col lg:flex-row min-w-0"
          style={{ minHeight: 0, overflow: "hidden" }}
        >
          <ScrollArea
            style={{ flex: 1, minWidth: 0, minHeight: 0, height: "100%" }}
            type="auto"
            scrollbarSize={6}
          >
            <Box
              component="fieldset"
              disabled={isViewMode}
              style={{ border: 0, padding: 0, margin: 0 }}
              pt="md"
              pl="lg"
              pr="lg"
              pb="md"
            >
              {renderStep()}
            </Box>
          </ScrollArea>

          <Box style={{ flexShrink: 0, overflow: "hidden" }}>
            <CustomerSummarySidebar
              customerName={sidebarCustomerName}
              customerType={identity.customerType}
              customerNumber={identity.customerNumber}
              activeGroupLabel={activeGroup.label}
              currentStepLabel={STEPS[currentStep]?.label ?? ""}
              stepInGroup={stepInGroup}
              groupStepCount={activeGroup.stepIndices.length}
              overallCompleted={currentStep}
              overallTotal={STEPS.length}
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