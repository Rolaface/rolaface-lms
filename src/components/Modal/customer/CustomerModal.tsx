import { useState } from "react";
import { Box, Text, Button, Modal, ActionIcon, ThemeIcon, Group, ScrollArea, Fieldset, Timeline } from "@mantine/core";
import { IconX, IconUser, IconCheck, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

import { GradientButton } from "../../shared/customer/Shared";
import { STEPS } from "../../constants/customer/constants";
import { nextId } from "../../../utils/customer/utils";
import type { IdDocument, CustomField, UploadedDoc } from "../../../types/customer/types";

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

export function CustomerModal({ opened, onClose, isViewMode }: CustomerModalProps) {
  const [activeTab, setActiveTab] = useState<string>("0");
  const currentStep = parseInt(activeTab);

  // --- Identity ---
  const [customerNumber] = useState(() => `CUST-${String(Math.floor(1000000 + Math.random() * 9000000)).slice(0, 7)}`);
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
    { id: nextId(), idType: "National ID (NRC)", docNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "", verification: "Not verified", isPrimary: true },
  ]);
  const updateIdDocument = (id: string, patch: Partial<IdDocument>) =>
    setIdDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const addIdDocument = () =>
    setIdDocuments((prev) => [...prev, { id: nextId(), idType: "Passport", docNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "", verification: "Not verified", isPrimary: false }]);
  const removeIdDocument = (id: string) => setIdDocuments((prev) => prev.filter((d) => d.id !== id));

  // --- Financial ---
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [sourceOfIncome, setSourceOfIncome] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [creditRiskCategory, setCreditRiskCategory] = useState<string | null>(null);

  // --- Borrower ---
  const [convertToBorrower, setConvertToBorrower] = useState(true);
  const [borrowerCategory, setBorrowerCategory] = useState<string | null>(null);
  const [loanPurpose, setLoanPurpose] = useState<string | null>(null);
  const [intendedLoanProduct, setIntendedLoanProduct] = useState<string | null>(null);
  const [preliminaryRiskRating, setPreliminaryRiskRating] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [creditOfficer, setCreditOfficer] = useState<string | null>(null);
  const [relationshipManager, setRelationshipManager] = useState<string | null>(null);

  // --- KYC ---
  const [kycStatus, setKycStatus] = useState<Record<string, string>>({
    kyc: "Pending", aml: "Pending", sanctions: "Pending", pep: "Clear", fatca: "Not applicable", crs: "Not applicable",
  });
  const runCheck = (key: string) => setKycStatus((prev) => ({ ...prev, [key]: "Clear" }));

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
  const addTag = (tag: string) => { const t = tag.trim(); if (t && !tags.includes(t)) setTags((p) => [...p, t]); setTagInput(""); };
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag));
  const addCustomField = () => setCustomFields((p) => [...p, { id: nextId(), label: "", value: "", type: "Text" }]);
  const removeCustomField = (id: string) => setCustomFields((p) => p.filter((f) => f.id !== id));
  const updateCustomField = (id: string, patch: Partial<CustomField>) => setCustomFields((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleReset = () => {
    setCustomerType("Individual"); setFullLegalName(""); setPreferredName(""); setGender(null);
    setDateOfBirth(""); setNationality(null); setMaritalStatus(null); setOccupation("");
    setIndustry(null); setEmployer("");
    setMobileNumber(""); setAlternateMobile(""); setEmail(""); setPreferredCommunication(null);
    setResidentialAddress(""); setCountry(null); setProvince(null); setDistrict("");
    setCityTown(""); setPostalCode(""); setMailingAddress("");
    setIdDocuments([{ id: nextId(), idType: "National ID (NRC)", docNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "", verification: "Not verified", isPrimary: true }]);
    setEducationLevel(null); setEmploymentType(null); setSourceOfIncome(null);
    setMonthlyIncome(""); setAnnualIncome(""); setCreditRiskCategory(null);
    setBorrowerCategory(null); setLoanPurpose(null); setIntendedLoanProduct(null);
    setPreliminaryRiskRating(null); setBranch(null); setCreditOfficer(null); setRelationshipManager(null);
    Object.values(uploadedDocs).forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
    setUploadedDocs({});
    setKinName(""); setKinRelationship(null); setKinPhone(""); setKinAddress(""); setGuarantorLinked(false);
    setTags([]); setRelationshipNotes(""); setCustomFields([]);
    setActiveTab("0");
  };

  const handleModalClose = () => { handleReset(); onClose(); };
  const handleNext = () => { if (currentStep < STEPS.length - 1) setActiveTab((currentStep + 1).toString()); };
  const handleBack = () => { if (currentStep > 0) setActiveTab((currentStep - 1).toString()); };

  const headerIcon = STEPS[currentStep]?.icon || IconUser;
  const HeaderIcon = headerIcon;
  const headerTitle = isViewMode ? "View Customer" : "Create Customer";

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <IdentityStep
            customerNumber={customerNumber}
            customerType={customerType} setCustomerType={setCustomerType}
            fullLegalName={fullLegalName} setFullLegalName={setFullLegalName}
            preferredName={preferredName} setPreferredName={setPreferredName}
            gender={gender} setGender={setGender}
            dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
            nationality={nationality} setNationality={setNationality}
            maritalStatus={maritalStatus} setMaritalStatus={setMaritalStatus}
            occupation={occupation} setOccupation={setOccupation}
            industry={industry} setIndustry={setIndustry}
            employer={employer} setEmployer={setEmployer}
          />
        );
      case 1:
        return (
          <ContactStep
            mobileNumber={mobileNumber} setMobileNumber={setMobileNumber}
            alternateMobile={alternateMobile} setAlternateMobile={setAlternateMobile}
            email={email} setEmail={setEmail}
            preferredCommunication={preferredCommunication} setPreferredCommunication={setPreferredCommunication}
            residentialAddress={residentialAddress} setResidentialAddress={setResidentialAddress}
            country={country} setCountry={setCountry}
            province={province} setProvince={setProvince}
            district={district} setDistrict={setDistrict}
            cityTown={cityTown} setCityTown={setCityTown}
            postalCode={postalCode} setPostalCode={setPostalCode}
            sameAsResidential={sameAsResidential} setSameAsResidential={setSameAsResidential}
            mailingAddress={mailingAddress} setMailingAddress={setMailingAddress}
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
            educationLevel={educationLevel} setEducationLevel={setEducationLevel}
            employmentType={employmentType} setEmploymentType={setEmploymentType}
            sourceOfIncome={sourceOfIncome} setSourceOfIncome={setSourceOfIncome}
            monthlyIncome={monthlyIncome} setMonthlyIncome={setMonthlyIncome}
            annualIncome={annualIncome} setAnnualIncome={setAnnualIncome}
            creditRiskCategory={creditRiskCategory} setCreditRiskCategory={setCreditRiskCategory}
          />
        );
      case 4:
        return (
          <BorrowerStep
            convertToBorrower={convertToBorrower} setConvertToBorrower={setConvertToBorrower}
            borrowerCategory={borrowerCategory} setBorrowerCategory={setBorrowerCategory}
            loanPurpose={loanPurpose} setLoanPurpose={setLoanPurpose}
            intendedLoanProduct={intendedLoanProduct} setIntendedLoanProduct={setIntendedLoanProduct}
            preliminaryRiskRating={preliminaryRiskRating} setPreliminaryRiskRating={setPreliminaryRiskRating}
            branch={branch} setBranch={setBranch}
            creditOfficer={creditOfficer} setCreditOfficer={setCreditOfficer}
            relationshipManager={relationshipManager} setRelationshipManager={setRelationshipManager}
          />
        );
      case 5:
        return <KycStep kycStatus={kycStatus} runCheck={runCheck} />;
      case 6:
        return <DocumentsStep uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} isViewMode={isViewMode} />;
      case 7:
        return (
          <KinStep
            kinName={kinName} setKinName={setKinName}
            kinRelationship={kinRelationship} setKinRelationship={setKinRelationship}
            kinPhone={kinPhone} setKinPhone={setKinPhone}
            kinAddress={kinAddress} setKinAddress={setKinAddress}
            guarantorLinked={guarantorLinked} setGuarantorLinked={setGuarantorLinked}
          />
        );
      case 8:
        return (
          <TagsStep
            tags={tags} tagInput={tagInput} setTagInput={setTagInput}
            addTag={addTag} removeTag={removeTag}
            relationshipNotes={relationshipNotes} setRelationshipNotes={setRelationshipNotes}
            customFields={customFields} addCustomField={addCustomField}
            removeCustomField={removeCustomField} updateCustomField={updateCustomField}
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
      size="88%"
      padding={0}
      lockScroll
      styles={{
        content: { height: "93vh", maxHeight: "93vh", maxWidth: 1320, display: "flex", flexDirection: "column", overflow: "hidden" },
        header: { display: "none", padding: 0, margin: 0, minHeight: 0 },
        body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Box style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }} bg="white">
        {/* Header */}
        <Group justify="space-between" align="flex-start" px="lg" pt="md" pb="sm" style={{ borderBottom: "1px solid var(--mantine-color-slate-2)", flexShrink: 0 }}>
          <Group align="center" gap="sm">
            <ThemeIcon radius="md" size={40} variant="gradient" gradient={{ from: "brand.5", to: "brand.7", deg: 135 }}>
              <HeaderIcon size={18} />
            </ThemeIcon>
            <Box>
              <Text size="lg" fw={800} c="slate.8" lh={1.2}>{headerTitle}</Text>
              <Text size="xs" c="slate.4" mt={2}>
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]?.label}
              </Text>
            </Box>
          </Group>
          <ActionIcon variant="light" color="slate" radius="xl" size="lg" onClick={handleModalClose} aria-label="Close">
            <IconX size={18} />
          </ActionIcon>
        </Group>

        {/* Body — sidebar stepper + scrollable step content */}
        <Box style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          {/* Sidebar */}
          <ScrollArea
            type="auto"
            bg="slate.0"
            style={{ width: 232, flexShrink: 0, borderRight: "1px solid var(--mantine-color-slate-2)" }}
          >
            <Timeline active={currentStep} bulletSize={30} lineWidth={2} color="brand" p="md">
              {STEPS.map((step, idx) => {
                const isActive = currentStep === idx;
                const isComplete = currentStep > idx;
                const StepIcon = step.icon;
                return (
                  <Timeline.Item
                    key={step.label}
                    bullet={isComplete ? <IconCheck size={14} /> : <StepIcon size={14} />}
                    onClick={() => setActiveTab(idx.toString())}
                    style={{ cursor: "pointer" }}
                    title={
                      // Padding/shadow live on this inner box only, so the highlight hugs
                      // the label instead of stretching across the Timeline item's full
                      // row height (which includes the connector spacing to the next step).
                      <Box
                        display="inline-block"
                        px={isActive ? 10 : 0}
                        py={5}
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          background: isActive ? "var(--mantine-color-white)" : "transparent",
                          boxShadow: isActive ? "var(--mantine-shadow-xs)" : "none",
                          transition: "background-color 120ms ease, box-shadow 120ms ease",
                        }}
                      >
                        <Text size="sm" fw={700} c={isActive ? "brand.6" : isComplete ? "slate.7" : "slate.4"}>
                          {step.label}
                        </Text>
                      </Box>
                    }
                  />
                );
              })}
            </Timeline>
          </ScrollArea>

          {/* Step content */}
          <ScrollArea style={{ flex: 1, minHeight: 0 }} bg="slate.0" p="md" px="lg">
            <Fieldset disabled={isViewMode} variant="unstyled" p={0} m={0}>
              {renderStep()}
            </Fieldset>
          </ScrollArea>
        </Box>

        {/* Footer */}
        <Group justify="flex-end" px="lg" py="xs" style={{ borderTop: "1px solid var(--mantine-color-slate-2)", flexShrink: 0 }}>
          <Button size="sm" variant="default" onClick={handleModalClose} px="lg">
            {isViewMode ? "Close" : "Cancel"}
          </Button>

          {!isViewMode && (
            <Button size="sm" variant="transparent" c="danger.6" onClick={handleReset}>
              Reset
            </Button>
          )}

          {currentStep > 0 && (
            <Button size="sm" variant="default" onClick={handleBack} leftSection={<IconArrowLeft size={14} />} px="lg">
              Back
            </Button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <GradientButton size="sm" px="xl" onClick={handleNext} rightSection={<IconArrowRight size={14} />}>
              {isViewMode ? "Next" : "Save & Next"}
            </GradientButton>
          ) : (
            !isViewMode && (
              <GradientButton size="sm" px="xl" rightSection={<IconCheck size={14} />}>
                Create Customer
              </GradientButton>
            )
          )}
        </Group>
      </Box>
    </Modal>
  );
}