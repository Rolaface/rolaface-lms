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
  Fieldset,
  Divider,
} from "@mantine/core";
import {
  IconX,
  IconUser,
  IconCheck,
  IconArrowRight,
  IconChevronRight,
} from "@tabler/icons-react";

import { GradientButton } from "../../shared/customer/Shared";
import { STEPS } from "../../constants/customer/constants";
import { nextId } from "../../../utils/customer/utils";
import type {
  IdDocument,
  CustomField,
  UploadedDoc,
} from "../../../types/customer/types";

import { IdentityStep } from "./steps/IdentityStep";
import { ContactStep } from "./steps/ContactStep";
import { IdentificationStep } from "./steps/IdentificationStep";
import { FinancialStep } from "./steps/FinancialStep";
import { BorrowerStep } from "./steps/BorrowerStep";
import { KycStep } from "./steps/KycStep";
import { DocumentsStep } from "./steps/DocumentsStep";
import { KinStep } from "./steps/KinStep";
import { TagsStep } from "./steps/TagsStep";

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
  const [activeTab, setActiveTab] = useState<string>("0");
  const currentStep = parseInt(activeTab);

  // --- Identity ---
  const [customerNumber] = useState(
    () =>
      `CUST-${String(Math.floor(1000000 + Math.random() * 9000000)).slice(0, 7)}`,
  );
  const [customerType, setCustomerType] = useState<string>("Individual");
  const [fullLegalName, setFullLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);
  const [maritalStatus, setMaritalStatus] = useState<string | null>(null);
  const [occupation, setOccupation] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [employer, setEmployer] = useState("");

  // --- Contact ---
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [preferredCommunication, setPreferredCommunication] = useState<string | null>(null);
  const [residentialAddress, setResidentialAddress] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [sameAsResidential, setSameAsResidential] = useState(true);
  const [mailingAddress, setMailingAddress] = useState("");

  // --- Identification documents ---
  const [idDocuments, setIdDocuments] = useState<IdDocument[]>([
    {
      id: nextId(),
      idType: "National ID (NRC)",
      docNumber: "",
      issuingAuthority: "",
      issueDate: "",
      expiryDate: "",
      verification: "Not verified",
      isPrimary: true,
    },
  ]);
  const updateIdDocument = (id: string, patch: Partial<IdDocument>) =>
    setIdDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  const addIdDocument = () =>
    setIdDocuments((prev) => [
      ...prev,
      {
        id: nextId(),
        idType: "Passport",
        docNumber: "",
        issuingAuthority: "",
        issueDate: "",
        expiryDate: "",
        verification: "Not verified",
        isPrimary: false,
      },
    ]);
  const removeIdDocument = (id: string) =>
    setIdDocuments((prev) => prev.filter((d) => d.id !== id));

  // --- Financial ---
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [sourceOfIncome, setSourceOfIncome] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [creditRiskCategory, setCreditRiskCategory] = useState<string | null>(
    null,
  );

  // --- Borrower ---
  const [convertToBorrower, setConvertToBorrower] = useState(true);
  const [borrowerCategory, setBorrowerCategory] = useState<string | null>(
    null,
  );
  const [loanPurpose, setLoanPurpose] = useState<string | null>(null);
  const [intendedLoanProduct, setIntendedLoanProduct] = useState<string | null>(null);
  const [preliminaryRiskRating, setPreliminaryRiskRating] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [creditOfficer, setCreditOfficer] = useState<string | null>(null);
  const [relationshipManager, setRelationshipManager] = useState<string | null>(null);

  // --- KYC ---
  const [kycStatus, setKycStatus] = useState<Record<string, string>>({
    kyc: "Pending",
    aml: "Pending",
    sanctions: "Pending",
    pep: "Clear",
    fatca: "Not applicable",
    crs: "Not applicable",
  });
  const runCheck = (key: string) =>
    setKycStatus((prev) => ({ ...prev, [key]: "Clear" }));

  // --- Documents ---
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});

  // --- Next of kin & guarantor ---
  const [kinName, setKinName] = useState("");
  const [kinRelationship, setKinRelationship] = useState<string | null>(null);
  const [kinPhone, setKinPhone] = useState("");
  const [kinAddress, setKinAddress] = useState("");
  const [guarantorLinked, setGuarantorLinked] = useState(false);

  // --- Tags, notes & custom fields ---
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [relationshipNotes, setRelationshipNotes] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };
  const removeTag = (tag: string) =>
    setTags((p) => p.filter((t) => t !== tag));
  const addCustomField = () =>
    setCustomFields((p) => [
      ...p,
      { id: nextId(), label: "", value: "", type: "Text" },
    ]);
  const removeCustomField = (id: string) =>
    setCustomFields((p) => p.filter((f) => f.id !== id));
  const updateCustomField = (id: string, patch: Partial<CustomField>) =>
    setCustomFields((p) =>
      p.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );

  const handleReset = () => {
    setCustomerType("Individual");
    setFullLegalName("");
    setPreferredName("");
    setGender(null);
    setDateOfBirth("");
    setNationality(null);
    setMaritalStatus(null);
    setOccupation("");
    setIndustry(null);
    setEmployer("");
    setMobileNumber("");
    setAlternateMobile("");
    setEmail("");
    setPreferredCommunication(null);
    setResidentialAddress("");
    setCountry(null);
    setProvince(null);
    setDistrict("");
    setCityTown("");
    setPostalCode("");
    setMailingAddress("");
    setIdDocuments([
      {
        id: nextId(),
        idType: "National ID (NRC)",
        docNumber: "",
        issuingAuthority: "",
        issueDate: "",
        expiryDate: "",
        verification: "Not verified",
        isPrimary: true,
      },
    ]);
    setEducationLevel(null);
    setEmploymentType(null);
    setSourceOfIncome(null);
    setMonthlyIncome("");
    setAnnualIncome("");
    setCreditRiskCategory(null);
    setBorrowerCategory(null);
    setLoanPurpose(null);
    setIntendedLoanProduct(null);
    setPreliminaryRiskRating(null);
    setBranch(null);
    setCreditOfficer(null);
    setRelationshipManager(null);
    Object.values(uploadedDocs).forEach(
      (d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl),
    );
    setUploadedDocs({});
    setKinName("");
    setKinRelationship(null);
    setKinPhone("");
    setKinAddress("");
    setGuarantorLinked(false);
    setTags([]);
    setRelationshipNotes("");
    setCustomFields([]);
    setActiveTab("0");
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };
  const handleNext = () => {
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
            customerNumber={customerNumber}
            customerType={customerType}
            setCustomerType={setCustomerType}
            fullLegalName={fullLegalName}
            setFullLegalName={setFullLegalName}
            preferredName={preferredName}
            setPreferredName={setPreferredName}
            gender={gender}
            setGender={setGender}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            nationality={nationality}
            setNationality={setNationality}
            maritalStatus={maritalStatus}
            setMaritalStatus={setMaritalStatus}
            occupation={occupation}
            setOccupation={setOccupation}
            industry={industry}
            setIndustry={setIndustry}
            employer={employer}
            setEmployer={setEmployer}
          />
        );
      case 1:
        return (
          <ContactStep
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            alternateMobile={alternateMobile}
            setAlternateMobile={setAlternateMobile}
            email={email}
            setEmail={setEmail}
            preferredCommunication={preferredCommunication}
            setPreferredCommunication={setPreferredCommunication}
            residentialAddress={residentialAddress}
            setResidentialAddress={setResidentialAddress}
            country={country}
            setCountry={setCountry}
            province={province}
            setProvince={setProvince}
            district={district}
            setDistrict={setDistrict}
            cityTown={cityTown}
            setCityTown={setCityTown}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            sameAsResidential={sameAsResidential}
            setSameAsResidential={setSameAsResidential}
            mailingAddress={mailingAddress}
            setMailingAddress={setMailingAddress}
          />
        );
      case 2:
        return (
          <IdentificationStep
            idDocuments={idDocuments}
            updateIdDocument={updateIdDocument}
            addIdDocument={addIdDocument}
            removeIdDocument={removeIdDocument}
          />
        );
      case 3:
        return (
          <FinancialStep
            educationLevel={educationLevel}
            setEducationLevel={setEducationLevel}
            employmentType={employmentType}
            setEmploymentType={setEmploymentType}
            sourceOfIncome={sourceOfIncome}
            setSourceOfIncome={setSourceOfIncome}
            monthlyIncome={monthlyIncome}
            setMonthlyIncome={setMonthlyIncome}
            annualIncome={annualIncome}
            setAnnualIncome={setAnnualIncome}
            creditRiskCategory={creditRiskCategory}
            setCreditRiskCategory={setCreditRiskCategory}
          />
        );
      case 4:
        return (
          <BorrowerStep
            convertToBorrower={convertToBorrower}
            setConvertToBorrower={setConvertToBorrower}
            borrowerCategory={borrowerCategory}
            setBorrowerCategory={setBorrowerCategory}
            loanPurpose={loanPurpose}
            setLoanPurpose={setLoanPurpose}
            intendedLoanProduct={intendedLoanProduct}
            setIntendedLoanProduct={setIntendedLoanProduct}
            preliminaryRiskRating={preliminaryRiskRating}
            setPreliminaryRiskRating={setPreliminaryRiskRating}
            branch={branch}
            setBranch={setBranch}
            creditOfficer={creditOfficer}
            setCreditOfficer={setCreditOfficer}
            relationshipManager={relationshipManager}
            setRelationshipManager={setRelationshipManager}
          />
        );
      case 5:
        return <KycStep kycStatus={kycStatus} runCheck={runCheck} />;
      case 6:
        return (
          <DocumentsStep
            uploadedDocs={uploadedDocs}
            setUploadedDocs={setUploadedDocs}
            isViewMode={isViewMode}
          />
        );
      case 7:
        return (
          <KinStep
            kinName={kinName}
            setKinName={setKinName}
            kinRelationship={kinRelationship}
            setKinRelationship={setKinRelationship}
            kinPhone={kinPhone}
            setKinPhone={setKinPhone}
            kinAddress={kinAddress}
            setKinAddress={setKinAddress}
            guarantorLinked={guarantorLinked}
            setGuarantorLinked={setGuarantorLinked}
          />
        );
      case 8:
        return (
          <TagsStep
            tags={tags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            addTag={addTag}
            removeTag={removeTag}
            relationshipNotes={relationshipNotes}
            setRelationshipNotes={setRelationshipNotes}
            customFields={customFields}
            addCustomField={addCustomField}
            removeCustomField={removeCustomField}
            updateCustomField={updateCustomField}
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
      size="80%"
      padding={0}
      lockScroll
      styles={{
        content: {
          height: "88vh",
          maxHeight: "88vh",
          maxWidth: 1180,
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
        {/* Header — brand fill, compact */}
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
              <Group gap={6}>
                <Text size="xs" fw={600} c="brand.1">
                  Step {currentStep + 1} of {STEPS.length}
                </Text>
                <Text size="xs" c="brand.3">
                  ·
                </Text>
                <Text size="xs" fw={500} c="brand.1">
                  {STEPS[currentStep]?.label}
                </Text>
              </Group>
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


        <Box
          px="md"
          py={8}
          style={{
            borderBottom: "1px solid var(--mantine-color-slate-2)",
            flexShrink: 0,
          }}
          bg="slate.0"
        >
          <Group gap={4} wrap="nowrap">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === idx;
              const isComplete = currentStep > idx;
              const StepIcon = step.icon;
              return (
                <Group key={step.label} gap={4} wrap="nowrap">
                  <UnstyledButton
                    onClick={() => setActiveTab(idx.toString())}
                    px={8}
                    py={6}
                    style={{
                      borderRadius: "var(--mantine-radius-sm)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: isActive
                        ? "var(--mantine-color-white)"
                        : "transparent",
                      boxShadow: isActive ? "var(--mantine-shadow-sm)" : "none",
                      border: isActive
                        ? "1px solid var(--mantine-color-slate-2)"
                        : "1px solid transparent",
                      transition:
                        "background-color 120ms ease, box-shadow 120ms ease",
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
                        {isComplete ? (
                          <IconCheck size={10} />
                        ) : (
                          <StepIcon size={10} />
                        )}
                      </ThemeIcon>
                      <Text
                        size="xs"
                        fw={isActive ? 700 : 500}
                        c={
                          isActive
                            ? "brand.7"
                            : isComplete
                              ? "slate.7"
                              : "slate.5"
                        }
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {step.label}
                      </Text>
                    </Group>
                  </UnstyledButton>
                  {idx < STEPS.length - 1 && (
                    <IconChevronRight
                      size={11}
                      color="var(--mantine-color-slate-3)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </Group>
              );
            })}
          </Group>
        </Box>
        {/* Main Content */}
        <ScrollArea style={{ flex: 1, minHeight: 0 }} bg="slate.0">
          <Box maw={1000} mx="auto" pt="md" pl="lg" pr="lg" pb={24}>
            <Fieldset disabled={isViewMode} variant="unstyled" p={0} m={0}>
              {renderStep()}
            </Fieldset>
          </Box>
        </ScrollArea>

        {/* Footer */}
        <Group
          justify="space-between"
          px="xl"
          py="md"
          style={{
            borderTop: "1px solid var(--mantine-color-slate-2)",
            flexShrink: 0,
          }}
        >
          <Group gap="md">
            <Button variant="subtle" color="slate" onClick={handleModalClose}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <>
                <Divider orientation="vertical" color="slate.2" />
                <Button variant="subtle" color="danger" onClick={handleReset}>
                  Reset Form
                </Button>
              </>
            )}
          </Group>

          <Group gap="sm">
            {currentStep > 0 && (
              <Button variant="default" onClick={handleBack} px="lg">
                Back
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <GradientButton
                px="xl"
                onClick={handleNext}
                rightSection={<IconArrowRight size={14} />}
              >
                {isViewMode ? "Next" : "Save & Continue"}
              </GradientButton>
            ) : (
              !isViewMode && (
                <GradientButton
                  px="xl"
                  rightSection={<IconCheck size={14} />}
                >
                  Create Customer
                </GradientButton>
              )
            )}
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}